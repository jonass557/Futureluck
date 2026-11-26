import express from 'express';
import Market from '../models/Market.js';
import Participation from '../models/Participation.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { generateReference, recordAudit } from '../utils/audit.js';

const router = express.Router();

function maskPhone(phone = '') {
  if (phone.length <= 6) return phone;
  return phone.slice(0, 7) + '***' + phone.slice(-2);
}

// GET /api/markets/winners/all - Public / authenticated winners hall of fame
router.get('/winners/all', async (_req, res) => {
  try {
    const winningParticipations = await Participation.find({ status: 'won' })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate('user', 'fullName phone avatarUrl')
      .populate('market', 'title marketDate rewardRate');

    const winners = winningParticipations.map((p, idx) => ({
      id: p._id,
      rank: p.rank || idx + 1,
      name: p.user?.fullName || 'Gagnant',
      phone: p.user?.phone || '',
      maskedPhone: maskPhone(p.user?.phone || ''),
      avatarUrl: p.user?.avatarUrl || '',
      amount: p.actualGain,
      marketTitle: p.market?.title || 'Marché FutureLuck',
      wonAt: p.updatedAt,
    }));

    res.json({ winners });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement des gagnants.' });
  }
});

// GET /api/markets/feed/participants - Live scrolling feed of participants
router.get('/feed/participants', async (_req, res) => {
  try {
    const docs = await Participation.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'fullName phone avatarUrl')
      .populate('market', 'title prizeAmount productPrice status');

    const participants = docs.map((p) => ({
      id: p._id,
      name: p.user?.fullName || 'Participant',
      maskedPhone: maskPhone(p.user?.phone || ''),
      avatarUrl: p.user?.avatarUrl || '',
      marketId: p.market?._id,
      marketTitle: p.market?.title || 'Marché',
      stakeAmount: p.stakeAmount,
      potentialGain: p.potentialGain,
      status: p.status,
      createdAt: p.createdAt,
    }));

    res.json({ participants });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement des participants.' });
  }
});

// GET /api/markets/my-participations
router.get('/my-participations', protect, async (req, res) => {
  try {
    const participations = await Participation.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('market');
    res.json({ participations });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement de vos participations.' });
  }
});

// GET /api/markets - List markets
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    const markets = await Market.find(filter).sort({ createdAt: -1 });
    res.json({ markets });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement des marchés.' });
  }
});

// GET /api/markets/:id - Market details (winners visible only when resultsPublished)
router.get('/:id', async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) {
      return res.status(404).json({ message: 'Marché introuvable.' });
    }

    let winners = [];
    if (market.resultsPublished) {
      const winDocs = await Participation.find({ market: market._id, status: 'won' })
        .sort({ rank: 1, actualGain: -1 })
        .populate('user', 'fullName phone avatarUrl');
      winners = winDocs.map((w, i) => ({
        id: w._id,
        rank: w.rank || i + 1,
        name: w.user?.fullName || 'Gagnant',
        phone: maskPhone(w.user?.phone || ''),
        amount: w.actualGain,
      }));
    }

    res.json({ market, winners });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement du marché.' });
  }
});

// POST /api/markets/:id/participate - Stake from LuckyGamble wallet
router.post('/:id/participate', protect, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Montant de participation invalide.' });
    }

    const market = await Market.findById(req.params.id);
    if (!market) {
      return res.status(404).json({ message: 'Marché introuvable.' });
    }

    if (market.status !== 'open') {
      return res.status(400).json({ message: 'Ce marché n’est pas ouvert aux participations.' });
    }

    if (amount < market.minStake || amount > market.maxStake) {
      return res.status(400).json({
        message: `Le montant doit être compris entre ${market.minStake.toLocaleString('fr-FR')} et ${market.maxStake.toLocaleString('fr-FR')} FCFA.`,
      });
    }

    // Atomic balance deduction to prevent race conditions / double spending
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id, walletBalance: { $gte: amount }, status: 'active' },
      { $inc: { walletBalance: -amount, totalStaked: amount } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({
        message: 'Solde LuckyGamble insuffisant. Veuillez recharger votre portefeuille.',
      });
    }

    const potentialGain =
      market.prizeAmount && amount === market.productPrice
        ? market.prizeAmount
        : Math.max(market.prizeAmount || 0, amount + Math.round((amount * (market.rewardRate || 50)) / 100));

    const participation = await Participation.create({
      market: market._id,
      user: updatedUser._id,
      stakeAmount: amount,
      rewardRate: market.rewardRate,
      potentialGain,
      status: 'pending',
    });

    await Market.findByIdAndUpdate(market._id, {
      $inc: { totalPool: amount, participantsCount: 1 },
    });

    await Transaction.create({
      user: updatedUser._id,
      type: 'participation',
      amount,
      provider: 'WALLET',
      reference: generateReference('PART'),
      status: 'completed',
      market: market._id,
      note: `Participation au marché "${market.title}"`,
    });

    await Notification.create({
      user: updatedUser._id,
      title: 'Participation enregistrée',
      message: `Vous avez engagé ${amount.toLocaleString('fr-FR')} FCFA sur "${market.title}". Gain potentiel : ${potentialGain.toLocaleString('fr-FR')} FCFA.`,
      type: 'market',
      link: `/markets/${market._id}`,
    });

    await recordAudit({
      actor: updatedUser,
      action: 'MARKET_PARTICIPATION',
      targetType: 'Market',
      targetId: market._id,
      amount,
      details: `Participation de ${amount} FCFA sur "${market.title}"`,
      ip: req.ip,
    });

    res.status(201).json({
      message: 'Participation confirmée avec succès !',
      participation,
      user: updatedUser.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la participation.' });
  }
});

export default router;
