import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  History,
  Play,
  Trophy,
  ChevronRight,
  Calendar,
  Clock,
  Gavel,
  Wallet,
  User as UserIcon,
  Gift,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserLayout } from '@/components/UserLayout';
import { Badge } from '@/components/ui/Card';
import { CountdownTimer } from '@/components/CountdownTimer';
import { formatFCFA, formatDateFR, formatTimeFR } from '@/lib/utils';
import api from '@/lib/api';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [markets, setMarkets] = useState([]);
  const [winners, setWinners] = useState([]);
  const [participantsFeed, setParticipantsFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
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
  }, [refreshUser]);

  const latestWinner = winners[0] || null;

  return (
    <UserLayout>
      <div className="space-y-5">
        {/* Gold Winner Ticker Banner (Image 1) */}
        <Link
          to="/winners"
          className="fl-gradient-gold text-[#001B6B] rounded-full px-4 py-2.5 flex items-center justify-between shadow-md hover:brightness-95 transition"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Trophy className="w-5 h-5 text-amber-800 shrink-0" />
            <p className="text-xs sm:text-sm font-extrabold truncate">
              {latestWinner
                ? `Félicitations à ${latestWinner.name} — ${formatFCFA(latestWinner.amount)} gagnés !`
                : 'Félicitations à tous nos gagnants FutureLuck !'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </Link>

        {/* Live Scrolling Participants Marquee */}
        {participantsFeed.length > 0 && (
          <div className="bg-white rounded-2xl p-3 fl-card-shadow border border-blue-100 overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-[#0033B3] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                <Users className="w-3.5 h-3.5 text-[#FFD200]" />
                Participants en direct ({participantsFeed.length})
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Tous les utilisateurs ayant participé aux produits
              </span>
            </div>
            <div className="overflow-hidden relative">
              <div className="animate-fl-marquee gap-3">
                {[...participantsFeed, ...participantsFeed].map((p, idx) => (
                  <div
                    key={`${p.id}-${idx}`}
                    className="inline-flex items-center gap-2 bg-[#EEF4FF] border border-blue-100 px-3 py-1.5 rounded-full text-xs shrink-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-extrabold text-[#001B6B]">{p.name}</span>
                    <span className="text-slate-600">• {p.marketTitle}</span>
                    <span className="font-black text-[#0033B3]">{formatFCFA(p.stakeAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wallet & Winnings Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mon portefeuille LuckyGamble */}
          <div className="fl-gradient-blue text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/30 border border-blue-300/30 flex items-center justify-center shrink-0 shadow-inner">
                <Wallet className="w-9 h-9 text-[#FFD200]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs sm:text-sm text-blue-100 font-medium">Mon portefeuille LuckyGamble</p>
                  {user?.walletId && (
                    <span className="bg-white/15 text-[#FFD200] text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                      {user.walletId}
                    </span>
                  )}
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#FFD200] tracking-tight mt-0.5">
                  {formatFCFA(user?.walletBalance)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-5">
              <Link
                to="/wallet/recharge"
                className="fl-gradient-gold text-[#001B6B] font-extrabold text-xs sm:text-sm py-2.5 px-2 rounded-full flex items-center justify-center gap-1 shadow hover:brightness-95 transition"
              >
                <Plus className="w-4 h-4" /> Recharger
              </Link>
              <Link
                to="/wallet/history"
                className="bg-[#0040D1] hover:bg-[#0033B3] border border-blue-400/30 text-white font-bold text-xs sm:text-sm py-2.5 px-2 rounded-full flex items-center justify-center gap-1 transition"
              >
                <History className="w-4 h-4" /> Historique
              </Link>
              <Link
                to="/markets"
                className="bg-white hover:bg-blue-50 text-[#001B6B] font-extrabold text-xs sm:text-sm py-2.5 px-2 rounded-full flex items-center justify-center gap-1 shadow transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Participer
              </Link>
            </div>
          </div>

          {/* Mes gains disponibles */}
          <div className="fl-gradient-blue text-white rounded-3xl p-5 shadow-xl flex items-center justify-between gap-3 relative overflow-hidden">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/15 border border-amber-300/30 flex items-center justify-center shrink-0">
                <Trophy className="w-9 h-9 text-[#FFD200]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-blue-100 font-medium">Mes gains disponibles</p>
                <p className="text-2xl sm:text-3xl font-black text-[#FFD200] tracking-tight mt-0.5 truncate">
                  {formatFCFA(user?.winningsBalance)}
                </p>
              </div>
            </div>

            <Link
              to="/wallet/withdraw"
              className="fl-gradient-gold text-[#001B6B] font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md hover:brightness-95 transition flex items-center gap-1 shrink-0 text-center leading-tight"
            >
              <span>
                Retirer
                <br />
                mes gains
              </span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Marchés en cours */}
        <section>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-0.5 w-10 bg-gradient-to-r from-transparent to-[#FFD200]" />
            <h2 className="text-xl font-extrabold text-[#001B6B]">Marchés en cours</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {markets.map((market) => (
                <div key={market._id} className="bg-white rounded-3xl p-4 sm:p-5 fl-card-shadow border border-slate-100">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-lg font-extrabold text-[#001B6B] leading-snug">{market.title}</h3>
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
                        <span className="truncate">Date : {formatDateFR(market.marketDate)}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#0033B3] shrink-0" />
                        <span>
                          {formatTimeFR(market.startTime)} — {formatTimeFR(market.endTime)}
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
                    <div className="bg-[#EEF4FF] rounded-2xl p-2.5 text-center">
                      <p className="text-[11px] font-bold text-slate-600">Prix du produit</p>
                      <p className="text-sm sm:text-base font-black text-[#001B6B]">
                        {formatFCFA(market.productPrice || market.minStake)}
                      </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-center">
                      <p className="text-[11px] font-bold text-amber-800 flex items-center justify-center gap-1">
                        <Gift className="w-3.5 h-3.5" /> Prix à gagner
                      </p>
                      <p className="text-sm sm:text-base font-black text-amber-700">
                        {formatFCFA(market.prizeAmount || 25000)}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/markets/${market._id}`}
                    className="mt-3 w-full bg-[#0033B3] hover:bg-[#002799] text-white font-extrabold py-3 rounded-full flex items-center justify-center gap-2 shadow-md transition"
                  >
                    Participer au marché →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Liste des Gagnants visible directement sur le Dashboard */}
        {winners.length > 0 && (
          <section className="bg-white rounded-3xl p-5 fl-card-shadow border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-[#001B6B] flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Liste des gagnants & Prix remportés
              </h2>
              <Link to="/winners" className="text-xs font-bold text-[#0033B3] hover:underline">
                Voir tout →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {winners.slice(0, 6).map((w, idx) => (
                <div key={w.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full fl-gradient-gold text-[#001B6B] font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{w.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {w.marketTitle} • {w.maskedPhone}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-sm text-emerald-600 shrink-0">
                    {formatFCFA(w.amount)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Accès rapide (Image 1) */}
        <section>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-0.5 w-10 bg-gradient-to-r from-transparent to-[#FFD200]" />
            <h2 className="text-xl font-extrabold text-[#001B6B]">Accès rapide</h2>
            <span className="h-0.5 w-10 bg-gradient-to-l from-transparent to-[#FFD200]" />
          </div>

          <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
            {[
              { to: '/markets', label: 'Marchés', icon: Gavel, color: 'text-[#0033B3] bg-blue-50' },
              { to: '/winners', label: 'Gagnants', icon: Trophy, color: 'text-amber-500 bg-amber-50' },
              { to: '/wallet', label: 'Portefeuille', icon: Wallet, color: 'text-emerald-600 bg-emerald-50' },
              { to: '/profile', label: 'Mon profil', icon: UserIcon, color: 'text-[#0033B3] bg-blue-50' },
            ].map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.to}
                  to={tile.to}
                  className="bg-white rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 fl-card-shadow hover:-translate-y-0.5 transition text-center"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tile.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">{tile.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </UserLayout>
  );
}
