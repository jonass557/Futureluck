import mongoose from 'mongoose';

const paymentConfigSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: 'ikeepay',
      unique: true,
    },
    secretKey: {
      type: String,
      default: '',
    },
    publicKey: {
      type: String,
      default: '',
    },
    baseUrl: {
      type: String,
      default: 'https://api.ikeepay.com',
    },
    defaultCountry: {
      type: String,
      default: 'CI',
    },
    defaultCurrency: {
      type: String,
      default: 'XOF',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model('PaymentConfig', paymentConfigSchema);
