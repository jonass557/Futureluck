import express from 'express';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { getIkeepayConfig, verifyIkeepaySignature } from '../services/ikeepay.js';

const router = express.Router();

// Helper to settle a transaction when Ikeepay reports completed or failed
export async function applyIkeepayStatus(tx, providerStatus, providerRef = '') {
  if (!tx || tx.status !== 'pending') return tx;

  if (providerRef && !tx.providerReference) {
    tx.providerReference = providerRef;
  }

  if (providerStatus === 'completed') {
    tx.status = 'approved';
    tx.processedAt = new Date();
    await tx.save();

    if (tx.type === 'deposit') {
      await User.findByIdAndUpdate(tx.user, {
        $inc: { walletBalance: tx.amount, totalDeposited: tx.amount },
      });
      await Notification.create({
        user: tx.user,
        title: 'Recharge confirmée !',
        message: `Votre portefeuille LuckyGamble a été crédité de ${tx.amount.toLocaleString('fr-FR')} FCFA via Mobile Money.`,
        type: 'deposit',
        link: '/wallet',
      });
    } else if (tx.type === 'withdrawal') {
      await User.findByIdAndUpdate(tx.user, {
        $inc: { totalWithdrawn: tx.amount },
      });
      await Notification.create({
        user: tx.user,
        title: 'Retrait effectué !',
        message: `Votre retrait de ${tx.amount.toLocaleString('fr-FR')} FCFA a été envoyé avec succès.`,
        type: 'withdrawal',
        link: '/wallet',
      });
    }

    const user = await User.findById(tx.user);
    if (user) {
      await AuditLog.create({
        actor: user._id,
        actorName: user.fullName,
        actorRole: user.role,
        action: `IKEEPAY_${tx.type.toUpperCase()}_COMPLETED`,
        targetType: 'Transaction',
        targetId: String(tx._id),
        amount: tx.amount,
        details: `Transaction ${tx.reference} (${providerRef || 'Ikeepay'}) confirmée automatiquement`,
      });
    }
  } else if (providerStatus === 'failed') {
    tx.status = 'rejected';
    tx.note = `${tx.note} (Échec paiement)`;
    tx.processedAt = new Date();
    await tx.save();

    // Refund winningsBalance if withdrawal failed
    if (tx.type === 'withdrawal') {
      await User.findByIdAndUpdate(tx.user, {
        $inc: { winningsBalance: tx.amount },
      });
    }

    await Notification.create({
      user: tx.user,
      title: 'Transaction échouée',
      message: `Votre ${tx.type === 'deposit' ? 'dépôt' : 'retrait'} de ${tx.amount.toLocaleString('fr-FR')} FCFA n’a pas abouti.`,
      type: 'alert',
      link: '/wallet',
    });
  }

  return tx;
}

// POST /api/webhooks/ikeepay (raw body for HMAC SHA-256 verification)
router.post('/ikeepay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-ikeepay-signature'];
    const rawBody = req.body;
    const cfg = await getIkeepayConfig();

    if (!cfg.secretKey) {
      return res.status(500).send('Clé secrète Ikeepay non configurée');
    }

    if (!verifyIkeepaySignature(rawBody, signature, cfg.secretKey)) {
      return res.status(401).send('Signature invalide');
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    const data = payload?.data || {};
    const { external_reference, provider_reference, status } = data;

    if (external_reference || provider_reference) {
      const tx = await Transaction.findOne({
        $or: [
          ...(external_reference ? [{ reference: external_reference }] : []),
          ...(provider_reference ? [{ providerReference: provider_reference }] : []),
        ],
      });

      if (tx) {
        await applyIkeepayStatus(tx, status, provider_reference);
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Erreur Webhook Ikeepay:', err.message);
    res.status(400).json({ message: 'Payload invalide' });
  }
});

export default router;
