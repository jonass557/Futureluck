import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true,
    },
    forgotPasswordEnabled: {
      type: Boolean,
      default: true,
    },
    withdrawalFeeRate: {
      type: Number,
      default: 8,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model('SystemSetting', systemSettingSchema);
