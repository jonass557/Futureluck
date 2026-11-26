import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { upload, uploadImage } from '../config/cloudinary.js';
import { recordAudit } from '../utils/audit.js';

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register
router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const { fullName, phone, email, password } = req.body;
    if (!fullName || !phone || !password) {
      return res.status(400).json({ message: 'Nom complet, téléphone et mot de passe sont requis.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    const existing = await User.findOne({ phone: cleanPhone });
    if (existing) {
      return res.status(409).json({ message: 'Ce numéro de téléphone est déjà enregistré.' });
    }

    let avatarUrl = '';
    if (req.file) {
      const uploaded = await uploadImage(req.file, 'futureluck/avatars');
      avatarUrl = uploaded?.url || '';
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: email ? email.trim().toLowerCase() : undefined,
      passwordHash,
      avatarUrl,
      role: 'user',
    });

    await Notification.create({
      user: user._id,
      title: 'Bienvenue sur FutureLuck !',
      message: 'Votre portefeuille LuckyGamble est prêt. Rechargez via Mobile Money et participez aux marchés.',
      type: 'info',
      link: '/wallet/recharge',
    });

    await recordAudit({
      actor: user,
      action: 'USER_REGISTERED',
      targetType: 'User',
      targetId: user._id,
      details: `Nouveau compte créé pour ${user.fullName} (${user.phone})`,
      ip: req.ip,
    });

    const token = signToken(user);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur lors de la création du compte.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifiant et mot de passe requis.' });
    }

    const clean = identifier.replace(/\s+/g, '');
    const user = await User.findOne({
      $or: [{ phone: clean }, { email: identifier.trim().toLowerCase() }],
    }).select('+passwordHash');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    if (user.status === 'blocked' || user.status === 'suspended') {
      return res.status(403).json({
        message:
          user.status === 'blocked'
            ? 'Ce compte a été bloqué par l’administration.'
            : 'Ce compte est temporairement suspendu.',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la connexion.' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

// PATCH /api/auth/profile
router.patch('/profile', protect, upload.single('avatar'), async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;
    const user = req.user;

    if (fullName) user.fullName = fullName.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (phone) {
      const cleanPhone = phone.replace(/\s+/g, '');
      if (cleanPhone !== user.phone) {
        const exists = await User.findOne({ phone: cleanPhone, _id: { $ne: user._id } });
        if (exists) {
          return res.status(409).json({ message: 'Ce numéro de téléphone est déjà utilisé.' });
        }
        user.phone = cleanPhone;
      }
    }

    if (req.file) {
      const uploaded = await uploadImage(req.file, 'futureluck/avatars');
      if (uploaded?.url) user.avatarUrl = uploaded.url;
    }

    await user.save();
    await recordAudit({
      actor: user,
      action: 'PROFILE_UPDATED',
      targetType: 'User',
      targetId: user._id,
      details: `Mise à jour du profil utilisateur`,
      ip: req.ip,
    });

    res.json({ user: user.toSafeObject(), message: 'Profil mis à jour avec succès.' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur lors de la mise à jour du profil.' });
  }
});

// PATCH /api/auth/password
router.patch('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe (min 6 car.) requis.' });
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du changement de mot de passe.' });
  }
});

export default router;
