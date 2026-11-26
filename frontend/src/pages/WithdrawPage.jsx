import { useState } from 'react';
import { Info, CheckCircle2 } from 'lucide-react';
import { UserLayout } from '@/components/UserLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { formatFCFA } from '@/lib/utils';
import api from '@/lib/api';

export default function WithdrawPage() {
  const { user, setUser } = useAuth();
  const [provider, setProvider] = useState('MTN_MOMO');
  const [amount, setAmount] = useState('25000');
  const [phone, setPhone] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setSubmitting(true);
    try {
      const { data } = await api.post('/wallet/withdraw', {
        provider,
        amount: Number(amount),
        phone,
      });
      if (data.user) setUser(data.user);
      setFeedback({ type: 'success', text: data.message });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de la demande de retrait.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserLayout title="Retirer mes gains" showBack>
      <div className="max-w-lg mx-auto bg-white rounded-3xl p-6 fl-card-shadow border border-slate-100 space-y-6">
        <div className="fl-gradient-blue text-white rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-blue-100">Gains disponibles :</span>
          <span className="text-xl font-black text-[#FFD200]">{formatFCFA(user?.winningsBalance)}</span>
        </div>

        <p className="text-center font-bold text-slate-800 text-base">
          Retirez vos gains vers MTN MoMo ou Orange Money
        </p>

        {/* Mobile Money Provider Cards (Image 4) */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setProvider('MTN_MOMO')}
            className={`rounded-2xl p-4 flex flex-col items-center justify-center gap-2 border-2 transition cursor-pointer ${
              provider === 'MTN_MOMO'
                ? 'border-[#0033B3] ring-4 ring-blue-100 bg-[#FFCC00]'
                : 'border-slate-200 bg-[#FFCC00]/80 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="border-2 border-[#00205B] rounded-full px-4 py-1 font-black text-[#00205B] text-lg tracking-wider">
              MTN
            </div>
            <span className="text-xs font-extrabold text-[#00205B] leading-tight text-center">
              MTN
              <br />
              Mobile Money
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProvider('ORANGE_MONEY')}
            className={`rounded-2xl p-4 flex flex-col items-center justify-center gap-2 border-2 transition cursor-pointer bg-white ${
              provider === 'ORANGE_MONEY'
                ? 'border-[#0033B3] ring-4 ring-blue-100'
                : 'border-slate-200 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="w-full bg-[#FF6600] text-white font-black text-lg py-2 rounded-xl text-center">
              orange™
            </div>
            <span className="text-xs font-extrabold text-slate-900 leading-tight text-center">
              Orange
              <br />
              Money
            </span>
          </button>
        </div>

        {feedback.text && (
          <div
            role="alert"
            className={`rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="withdraw-amount" className="block text-sm font-bold text-slate-800 mb-1.5">
              Entrez le montant (FCFA)
            </label>
            <input
              id="withdraw-amount"
              type="number"
              min={1000}
              step={500}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 font-extrabold text-lg text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="withdraw-phone" className="block text-sm font-bold text-slate-800 mb-1.5">
              Numéro de réception
            </label>
            <input
              id="withdraw-phone"
              type="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 font-semibold text-slate-900"
            />
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Envoi en cours...' : 'Demander un retrait'}
          </Button>
        </form>

        <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 bg-slate-50 rounded-2xl p-3.5">
          <Info className="w-5 h-5 text-[#0033B3] shrink-0 mt-0.5" />
          <p className="font-medium">Vous pouvez retirer uniquement si vous êtes gagnant.</p>
        </div>
      </div>
    </UserLayout>
  );
}
