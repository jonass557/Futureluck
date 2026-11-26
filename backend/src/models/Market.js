import mongoose from 'mongoose';

const marketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre du produit/marché est requis'],
      trim: true,
    },
    description: {
      type: String,
      default: 'Investissez et tentez votre chance. Transformez votre participation en argent !',
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "L'image du produit est requise"],
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    marketDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    winnersCount: {
      type: Number,
      required: true,
      min: 1,
    },
    productPrice: {
      type: Number,
      default: 5000,
      min: 100,
    },
    prizeAmount: {
      type: Number,
      default: 25000,
      min: 100,
    },
    rewardRate: {
      type: Number,
      default: 50,
      min: 1,
    },
    minStake: {
      type: Number,
      default: 500,
      min: 100,
    },
    maxStake: {
      type: Number,
      default: 500000,
    },
    status: {
      type: String,
      enum: ['upcoming', 'open', 'closed', 'settled', 'cancelled'],
      default: 'open',
    },
    totalPool: {
      type: Number,
      default: 0,
    },
    participantsCount: {
      type: Number,
      default: 0,
    },
    resultsPublished: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Market', marketSchema);
