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
    provider: {
      type: String,
      enum: ['MTN_MOMO', 'ORANGE_MONEY', 'WALLET'],
      default: 'WALLET',
    },
    phone: {
      type: String,
      default: '',
    },
    reference: {
      type: String,
      unique: true,
      required: true,
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
