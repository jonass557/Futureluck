import { UserLayout } from '@/components/UserLayout';
import { ShieldCheck, HelpCircle, Sparkles } from 'lucide-react';

export function HelpPage() {
  return (
    <UserLayout title="Aide & Assistance" showBack>
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 fl-card-shadow space-y-5">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-7 h-7 text-[#0033B3]" />
          <h2 className="text-xl font-extrabold text-[#001B6B]">Comment fonctionne FutureLuck ?</h2>
        </div>
        <ol className="space-y-3 text-sm text-slate-700 list-decimal pl-5">
          <li>
            <strong>Rechargez votre portefeuille LuckyGamble</strong> via MTN Mobile Money ou Orange Money.
          </li>
          <li>
            <strong>Participez aux marchés ouverts</strong> en choisissant un produit virtuel et en engageant un montant.
          </li>
          <li>
            <strong>Consultez votre gain potentiel</strong> en toute transparence selon le taux de gain annoncé.
          </li>
          <li>
            <strong>Encaissez vos gains</strong> vers Mobile Money dès que vous êtes désigné gagnant à la clôture.
          </li>
        </ol>
      </div>
    </UserLayout>
  );
}

export function AboutPage() {
  return (
    <UserLayout title="À propos de FutureLuck" showBack>
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 fl-card-shadow space-y-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-[#FFD200]" />
          <h2 className="text-xl font-extrabold text-[#001B6B]">FutureLuck — Votre chance, notre priorité.</h2>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          FutureLuck est une plateforme de marchés virtuels à récompenses financières. Les produits présentés sont des
          supports de marchés virtuels dont la finalité est la participation et la récompense financière.
        </p>
        <div className="bg-[#EEF4FF] rounded-2xl p-4 flex items-start gap-3 text-sm text-[#001B6B]">
          <ShieldCheck className="w-5 h-5 text-[#0033B3] shrink-0 mt-0.5" />
          <p className="font-medium">
            Transactions sécurisées, règles transparentes et contrôle administratif complet pour garantir l’équité.
          </p>
        </div>
      </div>
    </UserLayout>
  );
}
