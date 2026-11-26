import express from 'express';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { generateReference, recordAudit } from '../utils/audit.js';

const router = express.Router();

// POST /api/wallet/deposit - Mobile Money deposit request
router.post('/deposit', protect, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const { provider, phone } = req.body;

    if (!['MTN_MOMO', 'ORANGE_MONEY'].includes(provider)) {
      return res.status(400).json({ message: 'Veuillez choisir MTN Mobile Money ou Orange Money.' });
    }
    if (!amount || isNaN(amount) || amount < 500) {
      return res.status(400).json({ message: 'Le montant minimum de dépôt est de 500 FCFA.' });
    }

    const tx = await Transaction.create({
      user: req.user._id,
      type: 'deposit',
      amount,
      provider,
      phone: phone || req.user.phone,
      reference: generateReference('DEP'),
      status: 'pending',
      note: `Recharge LuckyGamble via ${provider === 'MTN_MOMO' ? 'MTN MoMo' : 'Orange Money'}`,
    });

    await Notification.create({
      user: req.user._id,
      title: 'Demande de dépôt enregistrée',
      message: `Votre demande de recharge de ${amount.toLocaleString('fr-FR')} FCFA (${provider === 'MTN_MOMO' ? 'MTN MoMo' : 'Orange Money'}) est en attente de validation.`,
      type: 'deposit',
      link: '/wallet',
    });

    await recordAudit({
      actor: req.user,
      action: 'DEPOSIT_REQUESTED',
      targetType: 'Transaction',
      targetId: tx._id,
      amount,
      details: `Demande de dépôt ${provider} de ${amount} FCFA`,
      ip: req.ip,
    });

    res.status(201).json({
      message: 'Demande de dépôt envoyée ! Elle sera créditée après validation.',
      transaction: tx,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la demande de dépôt.' });
  }
});

// POST /api/wallet/withdraw - Withdraw strictly from winningsBalance
router.post('/withdraw', protect, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const { provider, phone } = req.body;

    if (!['MTN_MOMO', 'ORANGE_MONEY'].includes(provider)) {
      return res.status(400).json({ message: 'Veuillez choisir MTN Mobile Money ou Orange Money.' });
    }
    if (!amount || isNaN(amount) || amount < 1000) {
      return res.status(400).json({ message: 'Le montant minimum de retrait est de 1 000 FCFA.' });
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

    const tx = await Transaction.create({
      user: updatedUser._id,
      type: 'withdrawal',
      amount,
      provider,
      phone: phone || updatedUser.phone,
      reference: generateReference('WDR'),
      status: 'pending',
      note: `Retrait de gains vers ${provider === 'MTN_MOMO' ? 'MTN MoMo' : 'Orange Money'}`,
    });

    await Notification.create({
      user: updatedUser._id,
      title: 'Demande de retrait envoyée',
      message: `Votre demande de retrait de ${amount.toLocaleString('fr-FR')} FCFA est en cours de traitement.`,
      type: 'withdrawal',
      link: '/wallet',
    });

    await recordAudit({
      actor: updatedUser,
      action: 'WITHDRAWAL_REQUESTED',
      targetType: 'Transaction',
      targetId: tx._id,
      amount,
      details: `Demande de retrait ${provider} de ${amount} FCFA`,
      ip: req.ip,
    });

    res.status(201).json({
      message: 'Demande de retrait enregistrée avec succès !',
      transaction: tx,
      user: updatedUser.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la demande de retrait.' });
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
