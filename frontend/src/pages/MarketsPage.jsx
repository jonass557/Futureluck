import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Trophy, Percent } from 'lucide-react';
import { UserLayout } from '@/components/UserLayout';
import { Badge } from '@/components/ui/Card';
import { formatFCFA, formatDateFR, formatTimeFR } from '@/lib/utils';
import api from '@/lib/api';

export default function MarketsPage() {
  const [markets, setMarkets] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/markets?status=${filter}`)
      .then((res) => setMarkets(res.data.markets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const tabs = [
    { id: 'all', label: 'Tous' },
    { id: 'open', label: 'Ouverts' },
    { id: 'settled', label: 'Clôturés' },
  ];

  return (
    <UserLayout title="Marchés virtuels">
      <div className="space-y-5">
        <div className="flex gap-2 bg-white p-1.5 rounded-full shadow-sm border border-slate-100 max-w-md mx-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={`flex-1 py-2 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
                filter === t.id ? 'bg-[#0033B3] text-white shadow' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-500">Chargement...</div>
        ) : markets.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-500">Aucun marché dans cette catégorie.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {markets.map((m) => (
              <div key={m._id} className="bg-white rounded-3xl p-5 fl-card-shadow border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h2 className="text-lg font-extrabold text-[#001B6B]">{m.title}</h2>
                    <Badge variant={m.status === 'open' ? 'open' : m.status === 'settled' ? 'settled' : 'closed'}>
                      {m.status === 'open' ? '● Ouvert' : m.status === 'settled' ? 'Résultats publiés' : 'Clôturé'}
                    </Badge>
                  </div>

                  <div className="flex gap-4 items-center">
                    <img
                      src={m.imageUrl}
                      alt={m.title}
                      className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-slate-100"
                    />
                    <div className="space-y-1 text-xs sm:text-sm text-slate-700">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#0033B3]" />
                        {formatDateFR(m.marketDate)}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#0033B3]" />
                        {formatTimeFR(m.startTime)} — {formatTimeFR(m.endTime)}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-[#0033B3]" />
                        <strong>{m.winnersCount}</strong> gagnants
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Percent className="w-4 h-4 text-[#0033B3]" />
                        Taux de gain : <strong>+{m.rewardRate}%</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Mise min : <strong className="text-slate-800">{formatFCFA(m.minStake)}</strong>
                  </span>
                  <Link
                    to={`/markets/${m._id}`}
                    className="bg-[#0033B3] hover:bg-[#002799] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full transition"
                  >
                    {m.status === 'open' ? 'Participer →' : 'Voir détails →'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
