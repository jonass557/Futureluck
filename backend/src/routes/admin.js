import express from 'express';
import bcrypt from 'bcryptjs';
import Market from '../models/Market.js';
import Participation from '../models/Participation.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import PaymentConfig from '../models/PaymentConfig.js';
import SystemSetting from '../models/SystemSetting.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import { upload, uploadImage } from '../config/cloudinary.js';
import { generateReference, recordAudit } from '../utils/audit.js';
import { ikeepayPayout } from '../services/ikeepay.js';

const router = express.Router();

router.use(protect, requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (_req, res) => {
  try {
    const [
      totalUsers,
      activeMarkets,
      settledMarkets,
      pendingDeposits,
      pendingWithdrawals,
      poolAgg,
      depositAgg,
      withdrawalAgg,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Market.countDocuments({ status: 'open' }),
      Market.countDocuments({ status: 'settled' }),
      Transaction.countDocuments({ type: 'deposit', status: 'pending' }),
      Transaction.countDocuments({ type: 'withdrawal', status: 'pending' }),
      Market.aggregate([{ $group: { _id: null, total: { $sum: '$totalPool' } } }]),
      Transaction.aggregate([
        { $match: { type: 'deposit', status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'withdrawal', status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      stats: {
        totalUsers,
        activeMarkets,
        settledMarkets,
        pendingDeposits,
        pendingWithdrawals,
        totalPool: poolAgg[0]?.total || 0,
        totalDeposits: depositAgg[0]?.total || 0,
        totalWithdrawals: withdrawalAgg[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du calcul des statistiques.' });
  }
});

// POST /api/admin/markets - Create market & upload product image to Cloudinary
router.post('/markets', upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      marketDate,
      startTime,
      endTime,
      winnersCount,
      productPrice,
      prizeAmount,
      rewardRate,
      minStake,
      maxStake,
      status,
      imageUrl: fallbackImageUrl,
    } = req.body;

    if (!title || !marketDate || !startTime || !endTime || !winnersCount) {
      return res.status(400).json({ message: 'Tous les champs obligatoires du marché doivent être remplis.' });
    }

    const pPrice = Number(productPrice) || Number(minStake) || 5000;
    const pPrize = Number(prizeAmount) || Math.round(pPrice * (1 + (Number(rewardRate) || 50) / 100));
    const computedRate = rewardRate
      ? Number(rewardRate)
      : Math.max(1, Math.round(((pPrize - pPrice) / pPrice) * 100));

    let imageUrl = fallbackImageUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80';
    let imagePublicId = '';

    if (req.file) {
      const uploaded = await uploadImage(req.file, 'futureluck/markets');
      if (uploaded) {
        imageUrl = uploaded.url;
        imagePublicId = uploaded.publicId;
      }
    }

    const market = await Market.create({
      title: title.trim(),
      description: description?.trim() || undefined,
      imageUrl,
      imagePublicId,
      marketDate: new Date(marketDate),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      winnersCount: Number(winnersCount),
      productPrice: pPrice,
      prizeAmount: pPrize,
      rewardRate: computedRate,
      minStake: minStake ? Number(minStake) : pPrice,
      maxStake: maxStake ? Number(maxStake) : 500000,
      status: status || 'open',
      createdBy: req.user._id,
    });

    await recordAudit({
      actor: req.user,
      action: 'MARKET_CREATED',
      targetType: 'Market',
      targetId: market._id,
      details: `Marché créé: "${market.title}" (${market.winnersCount} gagnants, +${market.rewardRate}%)`,
      ip: req.ip,
    });

    res.status(201).json({ message: 'Marché publié avec succès !', market });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur lors de la création du marché.' });
  }
});

// PATCH /api/admin/markets/:id
router.patch('/markets/:id', upload.single('image'), async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) return res.status(404).json({ message: 'Marché introuvable.' });

    const fields = ['title', 'description', 'winnersCount', 'productPrice', 'prizeAmount', 'rewardRate', 'minStake', 'maxStake', 'status'];
    for (const f of fields) {
      if (req.body[f] !== undefined) market[f] = req.body[f];
    }
    if (req.body.marketDate) market.marketDate = new Date(req.body.marketDate);
    if (req.body.startTime) market.startTime = new Date(req.body.startTime);
    if (req.body.endTime) market.endTime = new Date(req.body.endTime);

    if (req.file) {
      const uploaded = await uploadImage(req.file, 'futureluck/markets');
      if (uploaded) {
        market.imageUrl = uploaded.url;
        market.imagePublicId = uploaded.publicId;
      }
    }

    await market.save();
    await recordAudit({
      actor: req.user,
      action: 'MARKET_UPDATED',
      targetType: 'Market',
      targetId: market._id,
      details: `Marché mis à jour: "${market.title}" (statut: ${market.status})`,
      ip: req.ip,
    });

    res.json({ message: 'Marché mis à jour.', market });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du marché.' });
  }
});

// DELETE /api/admin/markets/:id - Delete a published market/product
router.delete('/markets/:id', async (req, res) => {
  try {
    const market = await Market.findByIdAndDelete(req.params.id);
    if (!market) return res.status(404).json({ message: 'Marché introuvable.' });

    await recordAudit({
      actor: req.user,
      action: 'MARKET_DELETED',
      targetType: 'Market',
      targetId: market._id,
      details: `Marché supprimé: "${market.title}"`,
      ip: req.ip,
    });

    res.json({ message: 'Produit/marché supprimé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression du marché.' });
  }
});

// GET /api/admin/markets/:id/participants
router.get('/markets/:id/participants', async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) return res.status(404).json({ message: 'Marché introuvable.' });

    const participations = await Participation.find({ market: market._id })
      .sort({ createdAt: -1 })
      .populate('user', 'fullName phone avatarUrl status');

    res.json({ market, participations });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement des participants.' });
  }
});

// POST /api/admin/markets/:id/participants - Admin adds a participant directly to a market
router.post('/markets/:id/participants', async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) return res.status(404).json({ message: 'Marché introuvable.' });

    const { userId, fullName, phone, stakeAmount } = req.body;
    const amount = Number(stakeAmount) || market.productPrice || market.minStake || 5000;

    let targetUser = null;
    if (userId) {
      targetUser = await User.findById(userId);
    } else if (phone) {
      const cleanPhone = phone.replace(/\s+/g, '');
      targetUser = await User.findOne({ phone: cleanPhone });
      if (!targetUser && fullName) {
        const bcrypt = (await import('bcryptjs')).default;
        const hash = await bcrypt.hash('User@2026', 10);
        targetUser = await User.create({
          fullName: fullName.trim(),
          phone: cleanPhone,
          passwordHash: hash,
          role: 'user',
        });
      }
    }

    if (!targetUser) {
      return res.status(400).json({ message: 'Veuillez sélectionner un utilisateur ou saisir un nom et téléphone.' });
    }

    const potentialGain =
      market.prizeAmount && amount === market.productPrice
        ? market.prizeAmount
        : Math.max(market.prizeAmount || 0, amount + Math.round((amount * (market.rewardRate || 50)) / 100));

    const participation = await Participation.create({
      market: market._id,
      user: targetUser._id,
      stakeAmount: amount,
      rewardRate: market.rewardRate,
      potentialGain,
      status: 'pending',
    });

    await Market.findByIdAndUpdate(market._id, {
      $inc: { totalPool: amount, participantsCount: 1 },
    });

    await User.findOneAndUpdate(
      { role: 'admin' },
      { $inc: { walletBalance: amount } }
    );

    await User.findByIdAndUpdate(targetUser._id, {
      $inc: { totalStaked: amount },
    });

    await Transaction.create({
      user: targetUser._id,
      type: 'participation',
      amount,
      provider: 'WALLET',
      reference: generateReference('ADM-PART'),
      status: 'completed',
      market: market._id,
      note: `Participation ajoutée par l’administration sur "${market.title}"`,
      processedBy: req.user._id,
      processedAt: new Date(),
    });

    await Notification.create({
      user: targetUser._id,
      title: 'Participation ajoutée',
      message: `Vous avez été inscrit au marché "${market.title}" avec une mise de ${amount.toLocaleString('fr-FR')} FCFA.`,
      type: 'market',
      link: `/markets/${market._id}`,
    });

    await recordAudit({
      actor: req.user,
      action: 'ADMIN_ADDED_PARTICIPANT',
      targetType: 'Market',
      targetId: market._id,
      amount,
      details: `Admin a ajouté ${targetUser.fullName} comme participant sur "${market.title}" (${amount} FCFA)`,
      ip: req.ip,
    });

    const populated = await participation.populate('user', 'fullName phone avatarUrl status');
    res.status(201).json({ message: 'Participant ajouté avec succès !', participation: populated });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur lors de l’ajout du participant.' });
  }
});

// POST /api/admin/markets/:id/winners - Admin adds/designates a winner directly & credits their winningsBalance
router.post('/markets/:id/winners', async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) return res.status(404).json({ message: 'Marché introuvable.' });

    const { participationId, userId, prizeAmount } = req.body;
    const reward = Number(prizeAmount) || market.prizeAmount || 25000;

    let participation = null;
    if (participationId) {
      participation = await Participation.findById(participationId);
    } else if (userId) {
      participation = await Participation.findOne({ market: market._id, user: userId });
      if (!participation) {
        participation = await Participation.create({
          market: market._id,
          user: userId,
          stakeAmount: market.productPrice || market.minStake || 5000,
          rewardRate: market.rewardRate,
          potentialGain: reward,
          status: 'pending',
        });
        await Market.findByIdAndUpdate(market._id, {
          $inc: { participantsCount: 1, totalPool: market.productPrice || 5000 },
        });
      }
    }

    if (!participation) {
      return res.status(400).json({ message: 'Veuillez sélectionner un participant ou un utilisateur.' });
    }

    if (participation.status === 'won') {
      return res.status(400).json({ message: 'Ce participant est déjà désigné gagnant.' });
    }

    const existingWinnersCount = await Participation.countDocuments({ market: market._id, status: 'won' });

    participation.status = 'won';
    participation.actualGain = reward;
    participation.rank = existingWinnersCount + 1;
    await participation.save();

    await User.findByIdAndUpdate(participation.user, {
      $inc: { winningsBalance: reward, totalWon: reward },
    });

    await Transaction.create({
      user: participation.user,
      type: 'winning',
      amount: reward,
      provider: 'WALLET',
      reference: generateReference('WIN'),
      status: 'completed',
      market: market._id,
      note: `Gain attribué par l’administration sur "${market.title}"`,
      processedBy: req.user._id,
      processedAt: new Date(),
    });

    await Notification.create({
      user: participation.user,
      title: 'Félicitations ! Vous avez gagné !',
      message: `Vous avez remporté ${reward.toLocaleString('fr-FR')} FCFA sur "${market.title}". Votre compte est crédité pour le retrait !`,
      type: 'win',
      link: '/wallet/withdraw',
    });

    if (!market.resultsPublished) {
      market.resultsPublished = true;
      await market.save();
    }

    const targetUser = await User.findById(participation.user);

    await recordAudit({
      actor: req.user,
      action: 'ADMIN_ADDED_WINNER',
      targetType: 'Market',
      targetId: market._id,
      amount: reward,
      details: `Gagnant ajouté: ${targetUser?.fullName || participation.user} (+${reward} FCFA) sur "${market.title}"`,
      ip: req.ip,
    });

    res.status(201).json({
      message: `Gagnant ajouté et crédité de ${reward.toLocaleString('fr-FR')} FCFA pour le retrait !`,
      participation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur lors de l’ajout du gagnant.' });
  }
});

// POST /api/admin/markets/:id/settle - Select winners, credit rewards & publish results
router.post('/markets/:id/settle', async (req, res) => {
  try {
    const { winnerParticipationIds = [], autoDraw = false } = req.body;
    const market = await Market.findById(req.params.id);
    if (!market) return res.status(404).json({ message: 'Marché introuvable.' });
    if (market.status === 'settled') {
      return res.status(400).json({ message: 'Ce marché a déjà été clôturé et réglé.' });
    }

    const participations = await Participation.find({ market: market._id, status: 'pending' });
    if (participations.length === 0) {
      market.status = 'settled';
      market.resultsPublished = true;
      await market.save();
      return res.json({ message: 'Marché clôturé (aucun participant).', market });
    }

    let selectedIds = [...new Set(winnerParticipationIds.map(String))];
    if (autoDraw) {
      const shuffled = [...participations].sort(() => Math.random() - 0.5);
      selectedIds = shuffled.slice(0, Math.min(market.winnersCount, shuffled.length)).map((p) => String(p._id));
    }

    if (selectedIds.length === 0 || selectedIds.length > market.winnersCount) {
      return res.status(400).json({
        message: `Veuillez sélectionner entre 1 et ${market.winnersCount} gagnant(s) conformément aux règles du marché.`,
      });
    }

    let rank = 1;
    let totalAwarded = 0;

    for (const p of participations) {
      const isWinner = selectedIds.includes(String(p._id));
      if (isWinner) {
        p.status = 'won';
        p.actualGain = p.potentialGain;
        p.rank = rank++;
        await p.save();

        totalAwarded += p.actualGain;

        await User.findByIdAndUpdate(p.user, {
          $inc: { winningsBalance: p.actualGain, totalWon: p.actualGain },
        });

        await Transaction.create({
          user: p.user,
          type: 'winning',
          amount: p.actualGain,
          provider: 'WALLET',
          reference: generateReference('WIN'),
          status: 'completed',
          market: market._id,
          note: `Gain remporté sur "${market.title}"`,
          processedBy: req.user._id,
          processedAt: new Date(),
        });

        await Notification.create({
          user: p.user,
          title: 'Félicitations ! Vous avez gagné !',
          message: `Vous avez remporté ${p.actualGain.toLocaleString('fr-FR')} FCFA sur le marché "${market.title}" !`,
          type: 'win',
          link: '/wallet/withdraw',
        });
      } else {
        p.status = 'lost';
        p.actualGain = 0;
        await p.save();

        await Notification.create({
          user: p.user,
          title: 'Résultats publiés',
          message: `Les résultats du marché "${market.title}" sont disponibles. Tentez votre chance sur les prochains marchés !`,
          type: 'market',
          link: `/markets/${market._id}`,
        });
      }
    }

    market.status = 'settled';
    market.resultsPublished = true;
    await market.save();

    await recordAudit({
      actor: req.user,
      action: 'MARKET_SETTLED',
      targetType: 'Market',
      targetId: market._id,
      amount: totalAwarded,
      details: `${selectedIds.length} gagnant(s) désigné(s) sur "${market.title}". Total distribué: ${totalAwarded} FCFA`,
      ip: req.ip,
    });

    res.json({
      message: 'Gagnants sélectionnés, récompenses attribuées et résultats publiés !',
      market,
      winnersCount: selectedIds.length,
      totalAwarded,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la clôture du marché.' });
  }
});

// GET /api/admin/transactions
router.get('/transactions', async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type && type !== 'all') filter.type = type;
    if (status && status !== 'all') filter.status = status;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(150)
      .populate('user', 'fullName phone')
      .populate('market', 'title');

    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement des transactions.' });
  }
});

// PATCH /api/admin/transactions/:id/approve
router.patch('/transactions/:id/approve', async (req, res) => {
  try {
    const tx = await Transaction.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { status: 'approved', processedBy: req.user._id, processedAt: new Date() },
      { new: true }
    );

    if (!tx) {
      return res.status(404).json({ message: 'Transaction introuvable ou déjà traitée.' });
    }

    if (tx.type === 'deposit') {
      await User.findByIdAndUpdate(tx.user, {
        $inc: { walletBalance: tx.amount, totalDeposited: tx.amount },
      });
      await Notification.create({
        user: tx.user,
        title: 'Dépôt validé !',
        message: `Votre portefeuille LuckyGamble a été crédité de ${tx.amount.toLocaleString('fr-FR')} FCFA.`,
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
        message: `Votre retrait de ${tx.amount.toLocaleString('fr-FR')} FCFA a été envoyé vers votre compte Mobile Money.`,
        type: 'withdrawal',
        link: '/wallet',
      });
    }

    await recordAudit({
      actor: req.user,
      action: `TRANSACTION_APPROVED_${tx.type.toUpperCase()}`,
      targetType: 'Transaction',
      targetId: tx._id,
      amount: tx.amount,
      details: `${tx.type} de ${tx.amount} FCFA approuvé (${tx.reference})`,
      ip: req.ip,
    });

    res.json({ message: 'Transaction approuvée.', transaction: tx });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de l’approbation.' });
  }
});

// PATCH /api/admin/transactions/:id/reject
router.patch('/transactions/:id/reject', async (req, res) => {
  try {
    const tx = await Transaction.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      {
        status: 'rejected',
        note: req.body.reason || 'Refusé par l’administration',
        processedBy: req.user._id,
        processedAt: new Date(),
      },
      { new: true }
    );

    if (!tx) {
      return res.status(404).json({ message: 'Transaction introuvable ou déjà traitée.' });
    }

    // Refund winningsBalance if withdrawal was rejected
    if (tx.type === 'withdrawal') {
      await User.findByIdAndUpdate(tx.user, { $inc: { winningsBalance: tx.amount } });
    }

    await Notification.create({
      user: tx.user,
      title: 'Transaction refusée',
      message: `Votre ${tx.type === 'deposit' ? 'dépôt' : 'retrait'} de ${tx.amount.toLocaleString('fr-FR')} FCFA a été refusé. Motif : ${tx.note}`,
      type: 'alert',
      link: '/wallet',
    });

    await recordAudit({
      actor: req.user,
      action: `TRANSACTION_REJECTED_${tx.type.toUpperCase()}`,
      targetType: 'Transaction',
      targetId: tx._id,
      amount: tx.amount,
      details: `${tx.type} de ${tx.amount} FCFA refusé (${tx.reference})`,
      ip: req.ip,
    });

    res.json({ message: 'Transaction refusée.', transaction: tx });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du refus.' });
  }
});

// GET /api/admin/users
router.get('/users', async (_req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    for (const u of users) {
      if (!u.walletId) {
        await u.save();
      }
    }
    res.json({
      users: users.map((u) => ({
        id: u._id,
        fullName: u.fullName,
        phone: u.phone,
        email: u.email || '',
        status: u.status,
        tier: u.tier,
        avatarUrl: u.avatarUrl,
        walletId: u.walletId,
        walletBalance: u.walletBalance,
        winningsBalance: u.winningsBalance,
        totalStaked: u.totalStaked,
        totalWon: u.totalWon,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement des utilisateurs.' });
  }
});

// POST /api/admin/users - Admin creates a new user
router.post('/users', async (req, res) => {
  try {
    const { fullName, phone, email, password, walletBalance } = req.body;
    if (!fullName || !phone) {
      return res.status(400).json({ message: 'Le nom complet et le numéro de téléphone sont requis.' });
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    const existing = await User.findOne({ phone: cleanPhone });
    if (existing) {
      return res.status(409).json({ message: 'Ce numéro de téléphone est déjà utilisé.' });
    }

    const passwordHash = await bcrypt.hash(password && password.length >= 6 ? password : 'User@2026', 12);
    const user = await User.create({
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: email ? email.trim().toLowerCase() : undefined,
      passwordHash,
      role: 'user',
      walletBalance: Number(walletBalance) > 0 ? Number(walletBalance) : 0,
    });

    await recordAudit({
      actor: req.user,
      action: 'ADMIN_CREATED_USER',
      targetType: 'User',
      targetId: user._id,
      details: `Admin a créé l’utilisateur ${user.fullName} (${user.phone})`,
      ip: req.ip,
    });

    res.status(201).json({
      message: 'Utilisateur créé avec succès !',
      user: user.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur lors de la création de l’utilisateur.' });
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    await recordAudit({
      actor: req.user,
      action: 'USER_STATUS_CHANGED',
      targetType: 'User',
      targetId: user._id,
      details: `Statut de ${user.fullName} modifié en "${status}"`,
      ip: req.ip,
    });

    res.json({ message: `Compte mis à jour (${status}).`, status: user.status });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut.' });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (_req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement des journaux.' });
  }
});

// GET /api/admin/payment-config - Retrieve Ikeepay configuration (masked secret key)
router.get('/payment-config', async (_req, res) => {
  try {
    const doc = await PaymentConfig.findOne({ provider: 'ikeepay' });
    const rawSecret = doc?.secretKey || process.env.IKEEPAY_SECRET_KEY || '';
    const maskedSecretKey = rawSecret
      ? `${rawSecret.slice(0, 6)}••••••••${rawSecret.slice(-4)}`
      : '';

    res.json({
      config: {
        provider: 'ikeepay',
        baseUrl: doc?.baseUrl || 'https://api.ikeepay.com',
        publicKey: doc?.publicKey || '',
        defaultCountry: doc?.defaultCountry || 'CI',
        defaultCurrency: doc?.defaultCurrency || 'XOF',
        enabled: doc ? doc.enabled : Boolean(rawSecret),
        hasSecretKey: Boolean(rawSecret),
        maskedSecretKey,
        webhookPath: '/api/webhooks/ikeepay',
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement de la configuration Ikeepay.' });
  }
});

// PUT /api/admin/payment-config - Save/Update Ikeepay API keys from Admin Dashboard
router.put('/payment-config', async (req, res) => {
  try {
    const { secretKey, publicKey, baseUrl, defaultCountry, defaultCurrency, enabled } = req.body;

    let doc = await PaymentConfig.findOne({ provider: 'ikeepay' });
    if (!doc) {
      doc = new PaymentConfig({ provider: 'ikeepay' });
    }

    if (secretKey && secretKey.trim()) doc.secretKey = secretKey.trim();
    if (publicKey !== undefined) doc.publicKey = publicKey.trim();
    if (baseUrl) doc.baseUrl = baseUrl.trim().replace(/\/$/, '');
    if (defaultCountry) doc.defaultCountry = defaultCountry.trim().toUpperCase();
    if (defaultCurrency) doc.defaultCurrency = defaultCurrency.trim().toUpperCase();
    if (enabled !== undefined) doc.enabled = Boolean(enabled);
    doc.updatedBy = req.user._id;

    await doc.save();

    await recordAudit({
      actor: req.user,
      action: 'IKEEPAY_CONFIG_UPDATED',
      targetType: 'PaymentConfig',
      targetId: doc._id,
      details: `Configuration Ikeepay mise à jour (Pays: ${doc.defaultCountry}, Devise: ${doc.defaultCurrency}, Actif: ${doc.enabled})`,
      ip: req.ip,
    });

    const rawSecret = doc.secretKey || process.env.IKEEPAY_SECRET_KEY || '';
    res.json({
      message: 'Clés API Ikeepay enregistrées avec succès !',
      config: {
        provider: 'ikeepay',
        baseUrl: doc.baseUrl,
        publicKey: doc.publicKey,
        defaultCountry: doc.defaultCountry,
        defaultCurrency: doc.defaultCurrency,
        enabled: doc.enabled,
        hasSecretKey: Boolean(rawSecret),
        maskedSecretKey: rawSecret ? `${rawSecret.slice(0, 6)}••••••••${rawSecret.slice(-4)}` : '',
        webhookPath: '/api/webhooks/ikeepay',
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de l’enregistrement des clés Ikeepay.' });
  }
});

// GET /api/admin/wallet - Admin wallet balance, ID, total collected & transactions
router.get('/wallet', async (req, res) => {
  try {
    if (!req.user.walletId) {
      await req.user.save();
    }
    const poolAgg = await Market.aggregate([{ $group: { _id: null, total: { $sum: '$totalPool' } } }]);
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      wallet: {
        walletId: req.user.walletId,
        walletBalance: req.user.walletBalance,
        totalCollectedFromMarkets: poolAgg[0]?.total || 0,
      },
      transactions,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement du portefeuille administrateur.' });
  }
});

// POST /api/admin/wallet/deposit - Deposit into Admin wallet
router.post('/wallet/deposit', async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const { provider = 'WALLET', note = '' } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Montant invalide.' });
    }

    const updatedAdmin = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: amount, totalDeposited: amount } },
      { new: true }
    );

    const tx = await Transaction.create({
      user: req.user._id,
      type: 'deposit',
      amount,
      provider,
      phone: req.user.phone,
      reference: generateReference('ADM-DEP'),
      status: 'approved',
      note: note || 'Dépôt sur le portefeuille administrateur',
      processedBy: req.user._id,
      processedAt: new Date(),
    });

    await recordAudit({
      actor: req.user,
      action: 'ADMIN_WALLET_DEPOSIT',
      targetType: 'Transaction',
      targetId: tx._id,
      amount,
      details: `Dépôt de ${amount} FCFA sur le portefeuille administrateur`,
      ip: req.ip,
    });

    res.status(201).json({
      message: `Dépôt de ${amount.toLocaleString('fr-FR')} FCFA effectué sur le portefeuille admin.`,
      walletBalance: updatedAdmin.walletBalance,
      transaction: tx,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du dépôt admin.' });
  }
});

// POST /api/admin/wallet/withdraw - Withdraw from Admin wallet
router.post('/wallet/withdraw', async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const { provider = 'MTN_MOMO', phone, country = 'CI', currency = 'XOF' } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Montant invalide.' });
    }

    const updatedAdmin = await User.findOneAndUpdate(
      { _id: req.user._id, walletBalance: { $gte: amount } },
      { $inc: { walletBalance: -amount, totalWithdrawn: amount } },
      { new: true }
    );

    if (!updatedAdmin) {
      return res.status(400).json({ message: 'Solde du portefeuille administrateur insuffisant.' });
    }

    const ref = generateReference('ADM-WDR');
    if (['MTN_MOMO', 'ORANGE_MONEY', 'WAVE', 'MOOV'].includes(provider) && phone) {
      try {
        await ikeepayPayout({
          amount,
          currency,
          country,
          phoneNumber: phone,
          operator: provider,
          external_reference: ref,
        });
      } catch (ikpErr) {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { walletBalance: amount, totalWithdrawn: -amount },
        });
        return res.status(400).json({ message: ikpErr.message || 'Échec du retrait Ikeepay.' });
      }
    }

    const tx = await Transaction.create({
      user: req.user._id,
      type: 'withdrawal',
      amount,
      provider,
      phone: phone || req.user.phone,
      reference: ref,
      status: 'approved',
      note: `Retrait depuis le portefeuille administrateur (${provider})`,
      processedBy: req.user._id,
      processedAt: new Date(),
    });

    await recordAudit({
      actor: req.user,
      action: 'ADMIN_WALLET_WITHDRAW',
      targetType: 'Transaction',
      targetId: tx._id,
      amount,
      details: `Retrait de ${amount} FCFA depuis le portefeuille administrateur`,
      ip: req.ip,
    });

    res.status(201).json({
      message: `Retrait de ${amount.toLocaleString('fr-FR')} FCFA effectué avec succès.`,
      walletBalance: updatedAdmin.walletBalance,
      transaction: tx,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du retrait admin.' });
  }
});

// POST /api/admin/wallet/transfer - Transfer funds to a winner/user using their walletId
router.post('/wallet/transfer', async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const { recipientWalletId, note = '' } = req.body;
    if (!recipientWalletId || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Identifiant du portefeuille et montant valide requis.' });
    }

    const recipient = await User.findOne({ walletId: recipientWalletId.trim().toUpperCase(), role: 'user' });
    if (!recipient) {
      return res.status(404).json({ message: `Aucun utilisateur trouvé avec l’identifiant "${recipientWalletId}".` });
    }

    const updatedAdmin = await User.findOneAndUpdate(
      { _id: req.user._id, walletBalance: { $gte: amount } },
      { $inc: { walletBalance: -amount } },
      { new: true }
    );

    if (!updatedAdmin) {
      return res.status(400).json({ message: 'Solde du portefeuille administrateur insuffisant pour ce transfert.' });
    }

    await User.findByIdAndUpdate(recipient._id, {
      $inc: { winningsBalance: amount, totalWon: amount },
    });

    await Transaction.create({
      user: recipient._id,
      type: 'winning',
      amount,
      provider: 'WALLET',
      reference: generateReference('TRF-WIN'),
      status: 'completed',
      note: note || `Transfert de gain par l’administration vers ${recipient.walletId}`,
      processedBy: req.user._id,
      processedAt: new Date(),
    });

    await Transaction.create({
      user: req.user._id,
      type: 'withdrawal',
      amount,
      provider: 'WALLET',
      reference: generateReference('ADM-TRF'),
      status: 'completed',
      note: `Transfert vers ${recipient.fullName} (${recipient.walletId})`,
      processedBy: req.user._id,
      processedAt: new Date(),
    });

    await Notification.create({
      user: recipient._id,
      title: 'Vous avez reçu un transfert de gain !',
      message: `L’administration vous a transféré ${amount.toLocaleString('fr-FR')} FCFA sur votre portefeuille (${recipient.walletId}). Vous pouvez retirer vos gains !`,
      type: 'win',
      link: '/wallet/withdraw',
    });

    await recordAudit({
      actor: req.user,
      action: 'ADMIN_WALLET_TRANSFER',
      targetType: 'User',
      targetId: recipient._id,
      amount,
      details: `Transfert de ${amount} FCFA vers ${recipient.fullName} (${recipient.walletId})`,
      ip: req.ip,
    });

    res.status(201).json({
      message: `${amount.toLocaleString('fr-FR')} FCFA transférés à ${recipient.fullName} (${recipient.walletId}) !`,
      walletBalance: updatedAdmin.walletBalance,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du transfert de fonds.' });
  }
});

// GET /api/admin/history - Filter participants and winners by product & date period (with pagination)
router.get('/history', async (req, res) => {
  try {
    const { type = 'participants', marketId = 'all', startDate, endDate, page = 1, limit = 15 } = req.query;
    const filter = {};
    if (type === 'winners') {
      filter.status = 'won';
    }
    if (marketId && marketId !== 'all') {
      filter.market = marketId;
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 15));

    const [items, total] = await Promise.all([
      Participation.find(filter)
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .populate('user', 'fullName phone walletId')
        .populate('market', 'title productPrice prizeAmount'),
      Participation.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: p,
      totalPages: Math.max(1, Math.ceil(total / l)),
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement de l’historique.' });
  }
});

// GET /api/admin/settings
router.get('/settings', async (_req, res) => {
  try {
    let doc = await SystemSetting.findOne({ key: 'global' });
    if (!doc) {
      doc = await SystemSetting.create({ key: 'global', forgotPasswordEnabled: true, withdrawalFeeRate: 8 });
    }
    res.json({ settings: doc });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement des paramètres.' });
  }
});

// PUT /api/admin/settings - Toggle forgotPasswordEnabled etc.
router.put('/settings', async (req, res) => {
  try {
    const { forgotPasswordEnabled } = req.body;
    let doc = await SystemSetting.findOne({ key: 'global' });
    if (!doc) {
      doc = new SystemSetting({ key: 'global' });
    }
    if (forgotPasswordEnabled !== undefined) {
      doc.forgotPasswordEnabled = Boolean(forgotPasswordEnabled);
    }
    doc.updatedBy = req.user._id;
    await doc.save();

    await recordAudit({
      actor: req.user,
      action: 'SYSTEM_SETTINGS_UPDATED',
      targetType: 'SystemSetting',
      targetId: doc._id,
      details: `Mot de passe oublié ${doc.forgotPasswordEnabled ? 'activé' : 'désactivé'} par l’administration`,
      ip: req.ip,
    });

    res.json({
      message: `Option "Mot de passe oublié" ${doc.forgotPasswordEnabled ? 'activée' : 'désactivée'}.`,
      settings: doc,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour des paramètres.' });
  }
});

export default router;
