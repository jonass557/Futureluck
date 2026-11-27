import express from 'express';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { generateReference, recordAudit } from '../utils/audit.js';
import { ikeepayPayin, ikeepayPayout, ikeepayVerify } from '../services/ikeepay.js';
import { applyIkeepayStatus } from './webhook.js';

const router = express.Router();

const ALLOWED_PROVIDERS = ['MTN_MOMO', 'ORANGE_MONEY', 'WAVE', 'MOOV'];

// POST /api/wallet/deposit - Mobile Money deposit request (Ikeepay H2H Payin)
router.post('/deposit', protect, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const { provider, phone, country, currency, otp } = req.body;

    if (!ALLOWED_PROVIDERS.includes(provider)) {
      return res.status(400).json({ message: 'Veuillez choisir un opérateur Mobile Money valide.' });
    }
    if (!amount || isNaN(amount) || amount < 100) {
      return res.status(400).json({ message: 'Le montant minimum de dépôt est de 100 FCFA.' });
    }

    const externalRef = generateReference('DEP');
    const targetPhone = phone || req.user.phone;

    const tx = await Transaction.create({
      user: req.user._id,
      type: 'deposit',
      amount,
      provider,
      phone: targetPhone,
      country: country || '',
      currency: currency || 'XOF',
      reference: externalRef,
      status: 'pending',
      note: `Recharge LuckyGamble via ${provider}`,
    });

    let paymentLink = '';
    try {
      const ikp = await ikeepayPayin({
        amount,
        currency,
        country,
        phoneNumber: targetPhone,
        operator: provider,
        external_reference: externalRef,
        customer_email: req.user.email || undefined,
        otp: otp || undefined,
      });

      if (!ikp.skipped && ikp.data) {
        const resData = ikp.data.data || ikp.data;
        paymentLink = resData.payment_link || ikp.data.payment_link || '';
        const providerRef = resData.provider_reference || '';
        if (paymentLink) tx.paymentLink = paymentLink;
        if (providerRef) tx.providerReference = providerRef;
        await tx.save();

        if (resData.status === 'completed') {
          await applyIkeepayStatus(tx, 'completed', providerRef);
        }
      }
    } catch (ikpErr) {
      tx.status = 'rejected';
      tx.note = `${tx.note} (${ikpErr.message})`;
      await tx.save();
      return res.status(400).json({ message: ikpErr.message || 'Échec de l’initiation du paiement Mobile Money.' });
    }

    await Notification.create({
      user: req.user._id,
      title: tx.status === 'approved' ? 'Dépôt confirmé !' : 'Demande de dépôt enregistrée',
      message:
        tx.status === 'approved'
          ? `Votre portefeuille LuckyGamble a été crédité de ${amount.toLocaleString('fr-FR')} FCFA.`
          : `Votre demande de recharge de ${amount.toLocaleString('fr-FR')} FCFA est en cours de traitement.`,
      type: 'deposit',
      link: '/wallet',
    });

    await recordAudit({
      actor: req.user,
      action: 'DEPOSIT_REQUESTED',
      targetType: 'Transaction',
      targetId: tx._id,
      amount,
      details: `Demande de dépôt ${provider} de ${amount} FCFA (${externalRef})`,
      ip: req.ip,
    });

    const freshUser = await User.findById(req.user._id);
    res.status(201).json({
      message: paymentLink
        ? 'Paiement initié ! Cliquez sur le lien pour finaliser votre dépôt.'
        : tx.status === 'approved'
        ? 'Dépôt validé et crédité !'
        : 'Demande de dépôt envoyée ! Validez sur votre téléphone ou patientez.',
      transaction: tx,
      paymentLink,
      user: freshUser?.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la demande de dépôt.' });
  }
});

// POST /api/wallet/withdraw - Withdraw strictly from winningsBalance (Ikeepay H2H Payout)
router.post('/withdraw', protect, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const { provider, phone, accountName, country, currency } = req.body;

    if (!ALLOWED_PROVIDERS.includes(provider)) {
      return res.status(400).json({ message: 'Veuillez choisir un opérateur Mobile Money valide.' });
    }
    if (!amount || isNaN(amount) || amount < 200) {
      return res.status(400).json({ message: 'Le montant minimum de retrait est de 200 FCFA.' });
    }

    // Atomic check & reserve from winningsBalance only
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id, winningsBalance: { $gte: amount }, status: 'active' },
      { $inc: { winningsBalance: -amount } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({
        message: 'Gains disponibles insuffisants. Vous pouvez retirer uniquement si vous êtes gagnant.',
      });
    }

    const externalRef = generateReference('PAYOUT');
    const targetPhone = phone || updatedUser.phone;
    const fee = Math.round(amount * 0.08); // 8% withdrawal fee
    const netAmount = Math.max(0, amount - fee);

    const tx = await Transaction.create({
      user: updatedUser._id,
      type: 'withdrawal',
      amount,
      fee,
      netAmount,
      provider,
      phone: targetPhone,
      country: country || '',
      currency: currency || 'XOF',
      reference: externalRef,
      status: 'pending',
      note: `Retrait de gains vers ${provider}${accountName ? ` (${accountName})` : ''} • Frais 8%: ${fee.toLocaleString('fr-FR')} F • Net: ${netAmount.toLocaleString('fr-FR')} F`,
    });

    try {
      const ikp = await ikeepayPayout({
        amount: netAmount,
        currency,
        country,
        phoneNumber: targetPhone,
        operator: provider,
        external_reference: externalRef,
      });

      if (!ikp.skipped && ikp.data) {
        const resData = ikp.data.data || ikp.data;
        const providerRef = resData.provider_reference || '';
        if (providerRef) {
          tx.providerReference = providerRef;
          await tx.save();
        }
        if (resData.status === 'completed') {
          await applyIkeepayStatus(tx, 'completed', providerRef);
        } else if (resData.status === 'failed') {
          await applyIkeepayStatus(tx, 'failed', providerRef);
          const refunded = await User.findById(updatedUser._id);
          return res.status(400).json({
            message: 'Le retrait Mobile Money a échoué. Vos gains ont été recrédités.',
            user: refunded?.toSafeObject(),
          });
        }
      }
    } catch (ikpErr) {
      // Refund winningsBalance if payout initiation failed
      await User.findByIdAndUpdate(updatedUser._id, { $inc: { winningsBalance: amount } });
      tx.status = 'rejected';
      tx.note = `${tx.note} (${ikpErr.message})`;
      await tx.save();
      const refunded = await User.findById(updatedUser._id);
      return res.status(400).json({
        message: ikpErr.message || 'Erreur lors de l’envoi du retrait Mobile Money.',
        user: refunded?.toSafeObject(),
      });
    }

    await Notification.create({
      user: updatedUser._id,
      title: tx.status === 'approved' ? 'Retrait effectué !' : 'Demande de retrait envoyée',
      message:
        tx.status === 'approved'
          ? `Votre retrait de ${amount.toLocaleString('fr-FR')} FCFA a été envoyé vers votre compte Mobile Money.`
          : `Votre demande de retrait de ${amount.toLocaleString('fr-FR')} FCFA est en cours de traitement.`,
      type: 'withdrawal',
      link: '/wallet',
    });

    await recordAudit({
      actor: updatedUser,
      action: 'WITHDRAWAL_REQUESTED',
      targetType: 'Transaction',
      targetId: tx._id,
      amount,
      details: `Demande de retrait ${provider} de ${amount} FCFA (${externalRef})`,
      ip: req.ip,
    });

    const freshUser = await User.findById(updatedUser._id);
    res.status(201).json({
      message:
        tx.status === 'approved'
          ? 'Retrait envoyé avec succès !'
          : 'Demande de retrait enregistrée avec succès !',
      transaction: tx,
      user: freshUser?.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la demande de retrait.' });
  }
});

// GET /api/wallet/transactions/:reference/verify - Verify transaction via Ikeepay H2H
router.get('/transactions/:reference/verify', protect, async (req, res) => {
  try {
    const tx = await Transaction.findOne({
      reference: req.params.reference,
      user: req.user._id,
    });
    if (!tx) {
      return res.status(404).json({ message: 'Transaction introuvable.' });
    }

    const ikp = await ikeepayVerify(tx.providerReference || tx.reference);
    if (!ikp.skipped && ikp.data?.data) {
      const { status, provider_reference } = ikp.data.data;
      await applyIkeepayStatus(tx, status, provider_reference);
    }

    const freshTx = await Transaction.findById(tx._id);
    const freshUser = await User.findById(req.user._id);
    res.json({
      transaction: freshTx,
      user: freshUser?.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur lors de la vérification.' });
  }
});

// GET /api/wallet/transactions
router.get('/transactions', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('market', 'title');
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement de l’historique.' });
  }
});

// GET /api/wallet/notifications
router.get('/notifications', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(40);
    const unreadCount = notifications.filter((n) => !n.read).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement des notifications.' });
  }
});

// PATCH /api/wallet/notifications/read-all
router.patch('/notifications/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: 'Notifications marquées comme lues.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour des notifications.' });
  }
});

export default router;
