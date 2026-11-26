import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Trophy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserLayout } from '@/components/UserLayout';
import { Button } from '@/components/ui/Button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useAuth } from '@/context/AuthContext';
import { formatFCFA, formatShortDateFR, formatTimeFR } from '@/lib/utils';
import api from '@/lib/api';

export default function MarketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [market, setMarket] = useState(null);
  const [winners, setWinners] = useState([]);
  const [stakeAmount, setStakeAmount] = useState('5000');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    api
      .get(`/markets/${id}`)
      .then((res) => {
        setMarket(res.data.market);
        setWinners(res.data.winners || []);
        if (res.data.market?.minStake) {
          setStakeAmount(String(Math.max(res.data.market.minStake, 5000)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <UserLayout title="Détails de l'enchère" showBack>
        <div className="bg-white rounded-3xl p-8 text-center text-slate-500">Chargement...</div>
      </UserLayout>
    );
  }

  if (!market) {
    return (
      <UserLayout title="Détails de l'enchère" showBack>
        <div className="bg-white rounded-3xl p-8 text-center text-slate-500">Marché introuvable.</div>
      </UserLayout>
    );
  }

  const numericStake = Math.max(0, Number(stakeAmount) || 0);
  const potentialGain = numericStake + Math.round((numericStake * market.rewardRate) / 100);

  const handleParticipate = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setSubmitting(true);
    try {
      const { data } = await api.post(`/markets/${market._id}/participate`, {
        amount: numericStake,
      });
      if (data.user) setUser(data.user);
      setFeedback({ type: 'success', text: data.message });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de la participation.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserLayout title="Détails de l'enchère" showBack>
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-5 sm:p-7 fl-card-shadow border border-slate-100 space-y-5">
        {/* Top Product Card (Image 6) */}
        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
          <img
            src={market.imageUrl}
            alt={market.title}
            className="w-40 h-40 rounded-2xl object-cover shadow-md border border-slate-100 shrink-0"
          />
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl font-extrabold text-[#001B6B]">{market.title}</h2>
            <div className="space-y-1.5 text-sm font-semibold text-slate-700">
              <p className="flex items-center justify-center sm:justify-start gap-2">
                <Calendar className="w-4 h-4 text-[#0033B3]" />
                {formatShortDateFR(market.marketDate)}
              </p>
              <p className="flex items-center justify-center sm:justify-start gap-2">
                <Clock className="w-4 h-4 text-[#0033B3]" />
                Début : {formatTimeFR(market.startTime)}
              </p>
              <p className="flex items-center justify-center sm:justify-start gap-2">
                <Clock className="w-4 h-4 text-[#0033B3]" />
                Fin : {formatTimeFR(market.endTime)}
              </p>
              <div className="pt-1 flex justify-center sm:justify-start">
                <CountdownTimer startTime={market.startTime} endTime={market.endTime} />
              </div>
            </div>
          </div>
        </div>

        {/* Winners & Prices Info Card (Image 6) */}
        <div className="bg-[#EEF4FF] rounded-2xl divide-y divide-blue-200/70">
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <Trophy className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600">Gagnants à désigner</p>
                <p className="text-xl font-black text-[#001B6B]">{market.winnersCount} personnes</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-600">Prix du produit</p>
              <p className="text-lg font-black text-[#0033B3]">
                {formatFCFA(market.productPrice || market.minStake)}
              </p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-[#0033B3] border-t-[#FFD200] flex items-center justify-center font-black text-[#0033B3] shrink-0">
              ★
            </div>
            <div>
              <p className="text-xs font-bold text-slate-600">Prix à gagner par gagnant</p>
              <p className="text-xl font-black text-emerald-700">
                {formatFCFA(market.prizeAmount || 25000)}
              </p>
            </div>
          </div>
        </div>

        {/* À propos de cette enchère */}
        <div>
          <div className="bg-[#0033B3] text-white font-extrabold px-4 py-2.5 rounded-xl text-sm">
            À propos de cette enchère
          </div>
          <p className="text-sm font-medium text-slate-700 mt-3 leading-relaxed">{market.description}</p>
        </div>

        {/* Yellow Warning Banner */}
        <div className="bg-[#FFE57F]/70 border border-amber-300 rounded-2xl px-4 py-3 flex items-center gap-3 text-sm font-bold text-amber-950">
          <AlertCircle className="w-5 h-5 text-amber-800 shrink-0" />
          <span>Vous ne verrez que les gagnants à la fin du marché.</span>
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

        {/* Participation Form if open */}
        {market.status === 'open' ? (
          <form onSubmit={handleParticipate} className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-600 font-semibold">
                Votre solde LuckyGamble :{' '}
                <strong className="text-[#0033B3]">{formatFCFA(user?.walletBalance)}</strong>
              </span>
              <Link to="/wallet/recharge" className="text-[#0033B3] font-bold hover:underline">
                + Recharger
              </Link>
            </div>

            <div>
              <label htmlFor="stakeAmount" className="block text-sm font-bold text-slate-700 mb-1.5">
                Montant de votre participation (FCFA)
              </label>
              <input
                id="stakeAmount"
                type="number"
                min={market.minStake}
                max={market.maxStake}
                step={500}
                required
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 font-extrabold text-lg text-[#001B6B]"
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {[1000, 2500, 5000, 10000, 25000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStakeAmount(String(preset))}
                    className="px-3 py-1 rounded-full text-xs font-bold bg-[#EEF4FF] text-[#0033B3] hover:bg-blue-100 cursor-pointer"
                  >
                    {preset.toLocaleString('fr-FR')} F
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#EEF4FF] rounded-2xl p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Gain potentiel si gagnant :</span>
              <span className="text-xl font-black text-[#0033B3]">{formatFCFA(potentialGain)}</span>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
              {submitting ? 'Traitement en cours...' : 'Participer maintenant'}
            </Button>
          </form>
        ) : market.resultsPublished ? (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="font-extrabold text-lg text-[#001B6B] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Gagnants officiels du marché
            </h3>
            {winners.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun gagnant enregistré.</p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
                {winners.map((w) => (
                  <div key={w.id} className="flex items-center justify-between px-4 py-3 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full fl-gradient-gold text-[#001B6B] font-black text-xs flex items-center justify-center">
                        {w.rank}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{w.name}</p>
                        <p className="text-xs text-slate-500">{w.phone}</p>
                      </div>
                    </div>
                    <span className="font-black text-sm text-emerald-600">{formatFCFA(w.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => navigate('/markets')}>
              Voir d'autres marchés
            </Button>
          </div>
        ) : (
          <div className="bg-slate-100 rounded-2xl p-4 text-center text-sm font-bold text-slate-600">
            Ce marché est clôturé. Les résultats seront publiés prochainement.
          </div>
        )}
      </div>
    </UserLayout>
  );
}
