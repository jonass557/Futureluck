import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Trophy, Gift, Users, Sparkles, ArrowRight } from 'lucide-react';
import { FutureLuckLogo } from '@/components/FutureLuckLogo';
import { Badge } from '@/components/ui/Card';
import { CountdownTimer } from '@/components/CountdownTimer';
import { formatFCFA, formatDateFR, formatTimeFR } from '@/lib/utils';
import api from '@/lib/api';

export default function PublicHomePage() {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState([]);
  const [winners, setWinners] = useState([]);
  const [participantsFeed, setParticipantsFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/markets?status=open'),
      api.get('/markets/winners/all'),
      api.get('/markets/feed/participants'),
    ])
      .then(([mRes, wRes, pRes]) => {
        setMarkets(mRes.data.markets || []);
        setWinners(wRes.data.winners || []);
        setParticipantsFeed(pRes.data.participants || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleParticipateClick = (marketId) => {
    navigate(`/login?redirect=/markets/${marketId}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col">
      {/* Public Top Header */}
      <header className="fl-gradient-header text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center">
            <FutureLuckLogo size="sm" showSlogan />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full transition"
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="fl-gradient-gold text-[#001B6B] font-extrabold text-xs sm:text-sm px-4 py-2 rounded-full shadow hover:brightness-95 transition"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Gold Winner Ticker */}
        <div className="fl-gradient-gold text-[#001B6B] rounded-full px-4 py-2.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <Trophy className="w-5 h-5 text-amber-800 shrink-0" />
            <p className="text-xs sm:text-sm font-extrabold truncate">
              {winners[0]
                ? `Félicitations à ${winners[0].name} — ${formatFCFA(winners[0].amount)} gagnés !`
                : 'Bienvenue sur FutureLuck — Jouez • Gagnez • Encaissez !'}
            </p>
          </div>
          <Link to="/register" className="text-xs font-black underline shrink-0 ml-2">
            Tenter ma chance →
          </Link>
        </div>

        {/* Hero Banner */}
        <section className="fl-gradient-blue text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-[#FFD200] text-xs font-extrabold px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Marchés virtuels à récompenses financières
            </span>
            <h1 className="text-2xl sm:text-4xl font-black leading-tight">
              Participez aux marchés ouverts et <span className="text-[#FFD200]">remportez des gains</span>
            </h1>
            <p className="text-sm text-blue-100">
              Choisissez un produit ci-dessous, consultez le compte à rebours en direct, créez votre compte et
              validez votre participation via Mobile Money.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
            <Link
              to="/register"
              className="fl-gradient-gold text-[#001B6B] font-extrabold px-6 py-3.5 rounded-full text-center shadow-lg hover:brightness-95 transition"
            >
              Créer un compte
            </Link>
            <Link
              to="/login"
              className="bg-white text-[#0033B3] font-extrabold px-6 py-3.5 rounded-full text-center shadow-lg hover:bg-blue-50 transition"
            >
              Se connecter
            </Link>
          </div>
        </section>

        {/* Live Scrolling Participants Feed */}
        {participantsFeed.length > 0 && (
          <div className="bg-white rounded-2xl p-3.5 fl-card-shadow border border-blue-100 flex items-center gap-3 overflow-hidden">
            <span className="inline-flex items-center gap-1.5 bg-[#0033B3] text-white text-xs font-extrabold px-3 py-1.5 rounded-full shrink-0">
              <Users className="w-3.5 h-3.5 text-[#FFD200]" />
              En direct
            </span>
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-0.5">
              {participantsFeed.slice(0, 12).map((p) => (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-2 bg-[#EEF4FF] px-3 py-1.5 rounded-full text-xs shrink-0"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-[#001B6B]">{p.name}</span>
                  <span className="text-slate-600">a participé à</span>
                  <span className="font-extrabold text-[#0033B3]">{p.marketTitle}</span>
                  <span className="font-black text-emerald-700">({formatFCFA(p.stakeAmount)})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Markets Grid */}
        <section>
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-0.5 w-10 bg-gradient-to-r from-transparent to-[#FFD200]" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#001B6B]">Marchés ouverts</h2>
            <span className="h-0.5 w-10 bg-gradient-to-l from-transparent to-[#FFD200]" />
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-500 fl-card-shadow">
              Chargement des marchés...
            </div>
          ) : markets.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-500 fl-card-shadow">
              Aucun marché ouvert pour le moment. Revenez très bientôt !
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {markets.map((market) => (
                <div
                  key={market._id}
                  onClick={() => handleParticipateClick(market._id)}
                  className="bg-white rounded-3xl p-5 fl-card-shadow border border-slate-100 hover:border-[#0033B3] transition cursor-pointer flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-lg font-extrabold text-[#001B6B]">{market.title}</h3>
                      <Badge variant="open" className="shrink-0">
                        <span className="w-2 h-2 rounded-full bg-white" /> Ouvert
                      </Badge>
                    </div>

                    <div className="flex gap-4 items-center">
                      <img
                        src={market.imageUrl}
                        alt={market.title}
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shrink-0 border border-slate-100 shadow-sm"
                      />
                      <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 min-w-0">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#0033B3] shrink-0" />
                          <span>{formatDateFR(market.marketDate)}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#0033B3] shrink-0" />
                          <span>
                            Ouverture : <strong>{formatTimeFR(market.startTime)}</strong> • Clôture :{' '}
                            <strong>{formatTimeFR(market.endTime)}</strong>
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-[#0033B3] shrink-0" />
                          <span>
                            Gagnants : <strong>{market.winnersCount} personnes</strong>
                          </span>
                        </p>
                        <div className="pt-1">
                          <CountdownTimer startTime={market.startTime} endTime={market.endTime} compact />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                      <div className="bg-[#EEF4FF] rounded-2xl p-3 text-center">
                        <p className="text-[11px] font-bold text-slate-600">Prix du produit</p>
                        <p className="text-base font-black text-[#001B6B]">
                          {formatFCFA(market.productPrice || market.minStake)}
                        </p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                        <p className="text-[11px] font-bold text-amber-800 flex items-center justify-center gap-1">
                          <Gift className="w-3.5 h-3.5" /> Prix à gagner
                        </p>
                        <p className="text-base font-black text-amber-700">
                          {formatFCFA(market.prizeAmount || 25000)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleParticipateClick(market._id);
                    }}
                    className="w-full bg-[#0033B3] hover:bg-[#002799] text-white font-extrabold py-3 rounded-full flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    Participer au marché <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Winners Preview */}
        {winners.length > 0 && (
          <section className="fl-gradient-blue text-white rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2 text-[#FFD200]">
                <Trophy className="w-6 h-6" /> Nos derniers gagnants
              </h2>
              <Link to="/register" className="text-xs font-bold text-blue-100 hover:text-white underline">
                Rejoindre les gagnants →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {winners.slice(0, 6).map((w, idx) => (
                <div key={w.id} className="bg-white/10 border border-white/15 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-full fl-gradient-gold text-[#001B6B] font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{w.name}</p>
                      <p className="text-[11px] text-blue-200 truncate">{w.marketTitle}</p>
                    </div>
                  </div>
                  <span className="font-black text-sm text-[#FFD200] shrink-0">{formatFCFA(w.amount)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="fl-gradient-blue text-white py-6 text-center mt-8">
        <FutureLuckLogo size="sm" showSlogan slogan="Jouez • Gagnez • Encaissez" />
      </footer>
    </div>
  );
}
