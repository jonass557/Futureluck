import { useState } from 'react';
import { Info, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import { UserLayout } from '@/components/UserLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const COUNTRIES = [
  { code: 'CI', label: 'Côte d’Ivoire (CI)', currency: 'XOF' },
  { code: 'CM', label: 'Cameroun (CM)', currency: 'XAF' },
  { code: 'SN', label: 'Sénégal (SN)', currency: 'XOF' },
  { code: 'BF', label: 'Burkina Faso (BF)', currency: 'XOF' },
  { code: 'BJ', label: 'Bénin (BJ)', currency: 'XOF' },
  { code: 'TG', label: 'Togo (TG)', currency: 'XOF' },
  { code: 'ML', label: 'Mali (ML)', currency: 'XOF' },
];

export default function RechargePage() {
  const { user, setUser } = useAuth();
  const [provider, setProvider] = useState('MTN_MOMO');
  const [country, setCountry] = useState('CI');
  const [currency, setCurrency] = useState('XOF');
  const [amount, setAmount] = useState('10000');
  const [phone, setPhone] = useState(user?.phone || '');
  const [otp, setOtp] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [lastRef, setLastRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleCountryChange = (code) => {
    setCountry(code);
    const found = COUNTRIES.find((c) => c.code === code);
    if (found) setCurrency(found.currency);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setPaymentLink('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/wallet/deposit', {
        provider,
        country,
        currency,
        amount: Number(amount),
        phone,
        otp: otp || undefined,
      });
      if (data.user) setUser(data.user);
      if (data.paymentLink) setPaymentLink(data.paymentLink);
      if (data.transaction?.reference) setLastRef(data.transaction.reference);
      setFeedback({ type: 'success', text: data.message });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de la demande de dépôt.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!lastRef) return;
    setVerifying(true);
    try {
      const { data } = await api.get(`/wallet/transactions/${lastRef}/verify`);
      if (data.user) setUser(data.user);
      const st = data.transaction?.status;
      setFeedback({
        type: st === 'approved' ? 'success' : st === 'rejected' ? 'error' : 'success',
        text:
          st === 'approved'
            ? 'Paiement confirmé ! Votre portefeuille LuckyGamble est crédité.'
            : st === 'rejected'
            ? 'Le paiement a échoué.'
            : 'Paiement toujours en attente de confirmation.',
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Erreur de vérification.' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <UserLayout title="Recharger mon portefeuille" showBack>
      <div className="max-w-lg mx-auto bg-white rounded-3xl p-6 fl-card-shadow border border-slate-100 space-y-5">
        <p className="text-center font-bold text-slate-800 text-base">
          Rechargez votre Portefeuille LuckyGamble via Mobile Money
        </p>

        {/* Mobile Money Operator Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setProvider('MTN_MOMO')}
            className={`rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 border-2 transition cursor-pointer ${
              provider === 'MTN_MOMO'
                ? 'border-[#0033B3] ring-4 ring-blue-100 bg-[#FFCC00]'
                : 'border-slate-200 bg-[#FFCC00]/80 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="border-2 border-[#00205B] rounded-full px-3 py-0.5 font-black text-[#00205B] text-sm">
              MTN
            </div>
            <span className="text-[11px] font-extrabold text-[#00205B] text-center">MTN MoMo</span>
          </button>

          <button
            type="button"
            onClick={() => setProvider('ORANGE_MONEY')}
            className={`rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 border-2 transition cursor-pointer bg-white ${
              provider === 'ORANGE_MONEY'
                ? 'border-[#0033B3] ring-4 ring-blue-100'
                : 'border-slate-200 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="w-full bg-[#FF6600] text-white font-black text-sm py-1.5 rounded-xl text-center">
              orange™
            </div>
            <span className="text-[11px] font-extrabold text-slate-900 text-center">Orange Money</span>
          </button>

          <button
            type="button"
            onClick={() => setProvider('WAVE')}
            className={`rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 border-2 transition cursor-pointer bg-[#1DC8FF]/15 ${
              provider === 'WAVE'
                ? 'border-[#0033B3] ring-4 ring-blue-100'
                : 'border-slate-200 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="w-full bg-[#1DC8FF] text-white font-black text-sm py-1.5 rounded-xl text-center">
              Wave
            </div>
            <span className="text-[11px] font-extrabold text-slate-900 text-center">Wave</span>
          </button>

          <button
            type="button"
            onClick={() => setProvider('MOOV')}
            className={`rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 border-2 transition cursor-pointer bg-blue-50 ${
              provider === 'MOOV'
                ? 'border-[#0033B3] ring-4 ring-blue-100'
                : 'border-slate-200 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="w-full bg-[#0057B8] text-white font-black text-sm py-1.5 rounded-xl text-center">
              Moov
            </div>
            <span className="text-[11px] font-extrabold text-slate-900 text-center">Moov Money</span>
          </button>
        </div>

        {feedback.text && (
          <div
            role="alert"
            className={`rounded-2xl px-4 py-3 text-sm font-bold space-y-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
              <span>{feedback.text}</span>
            </div>

            {paymentLink && (
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#0033B3] text-white text-xs font-extrabold px-4 py-2 rounded-full"
              >
                Finaliser le paiement <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {lastRef && (
              <div>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0033B3] underline cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
                  {verifying ? 'Vérification...' : 'Vérifier le statut du paiement'}
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="deposit-country" className="block text-xs font-bold text-slate-700 mb-1">
                Pays
              </label>
              <select
                id="deposit-country"
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full min-h-[46px] px-3 rounded-xl border border-slate-300 text-sm font-bold"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="deposit-currency" className="block text-xs font-bold text-slate-700 mb-1">
                Devise
              </label>
              <select
                id="deposit-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full min-h-[46px] px-3 rounded-xl border border-slate-300 text-sm font-bold"
              >
                <option value="XOF">XOF (FCFA)</option>
                <option value="XAF">XAF (FCFA)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="deposit-amount" className="block text-sm font-bold text-slate-800 mb-1.5">
              Saisissez le montant ({currency})
            </label>
            <input
              id="deposit-amount"
              type="number"
              min={100}
              step={100}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 font-extrabold text-lg text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="deposit-phone" className="block text-sm font-bold text-slate-800 mb-1.5">
              Numéro Mobile Money (avec indicatif)
            </label>
            <input
              id="deposit-phone"
              type="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="2250700000000 ou 237695008164"
              className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 font-semibold text-slate-900"
            />
          </div>

          {country === 'BF' && provider === 'ORANGE_MONEY' && (
            <div>
              <label htmlFor="deposit-otp" className="block text-sm font-bold text-slate-800 mb-1.5">
                Code OTP Orange Money BF
              </label>
              <input
                id="deposit-otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Ex : 123456"
                className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 font-semibold text-slate-900"
              />
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Initiation en cours...' : 'Confirmer le dépôt'}
          </Button>
        </form>

        <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 bg-slate-50 rounded-2xl p-3.5">
          <Info className="w-5 h-5 text-[#0033B3] shrink-0 mt-0.5" />
          <p className="font-medium">Votre argent sera utilisé uniquement pour participer aux enchères.</p>
        </div>
      </div>
    </UserLayout>
  );
}
