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
    termsAndConditions: {
      type: String,
      default:
        "1. Objet : FutureLuck est une plateforme de participation à des marchés de produits.\n2. Participation : Tout montant engagé est débité du portefeuille LuckyGamble et reste ferme.\n3. Gagnants & Gains : Les gagnants sont désignés après la clôture du marché et crédités sur leurs gains retirables.\n4. Retraits : Les retraits de gains sont soumis à des frais de service de 8 %.\n5. Sécurité : L'utilisateur s'engage à fournir des informations exactes et à respecter les règles de la plateforme.",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model('SystemSetting', systemSettingSchema);
