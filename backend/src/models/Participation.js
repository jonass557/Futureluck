import mongoose from 'mongoose';

const participationSchema = new mongoose.Schema(
  {
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stakeAmount: {
      type: Number,
      required: true,
      min: 100,
    },
    rewardRate: {
      type: Number,
      required: true,
    },
    potentialGain: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'won', 'lost', 'refunded'],
      default: 'pending',
    },
    actualGain: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

participationSchema.index({ market: 1, user: 1 });

export default mongoose.model('Participation', participationSchema);
