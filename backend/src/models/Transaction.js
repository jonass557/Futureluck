import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'participation', 'winning', 'refund'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    fee: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      default: 0,
    },
    provider: {
      type: String,
      enum: ['MTN_MOMO', 'ORANGE_MONEY', 'WAVE', 'MOOV', 'WALLET'],
      default: 'WALLET',
    },
    phone: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'XOF',
    },
    reference: {
      type: String,
      unique: true,
      required: true,
    },
    providerReference: {
      type: String,
      default: '',
    },
    paymentLink: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market',
    },
    note: {
      type: String,
      default: '',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Transaction', transactionSchema);
