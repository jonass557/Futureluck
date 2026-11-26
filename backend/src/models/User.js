import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Le nom complet est requis'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Le numéro de téléphone est requis'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'blocked'],
      default: 'active',
    },
    tier: {
      type: String,
      default: 'Membre Argent',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    winningsBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDeposited: { type: Number, default: 0 },
    totalStaked: { type: Number, default: 0 },
    totalWon: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    fullName: this.fullName,
    phone: this.phone,
    email: this.email || '',
    role: this.role,
    status: this.status,
    tier: this.tier,
    avatarUrl: this.avatarUrl,
    walletBalance: this.walletBalance,
    winningsBalance: this.winningsBalance,
    totalDeposited: this.totalDeposited,
    totalStaked: this.totalStaked,
    totalWon: this.totalWon,
    totalWithdrawn: this.totalWithdrawn,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
