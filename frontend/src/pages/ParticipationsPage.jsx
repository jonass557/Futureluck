import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserLayout } from '@/components/UserLayout';
import { Badge } from '@/components/ui/Card';
import { formatFCFA, formatShortDateFR } from '@/lib/utils';
import api from '@/lib/api';

export default function ParticipationsPage() {
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/markets/my-participations')
      .then((res) => setParticipations(res.data.participations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const badgeInfo = {
    pending: { label: 'En cours', variant: 'pending' },
    won: { label: 'Gagné !', variant: 'approved' },
    lost: { label: 'Non retenu', variant: 'default' },
    refunded: { label: 'Remboursé', variant: 'settled' },
  };

  return (
    <UserLayout title="Mes Participations" showBack>
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-500">Chargement...</div>
        ) : participations.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-3 fl-card-shadow">
            <p className="text-slate-600 font-medium">Vous n’avez pas encore participé à un marché.</p>
            <Link
              to="/markets"
              className="inline-block bg-[#0033B3] text-white font-bold px-6 py-2.5 rounded-full text-sm"
            >
              Découvrir les marchés
            </Link>
          </div>
        ) : (
          participations.map((p) => {
            const info = badgeInfo[p.status] || badgeInfo.pending;
            return (
              <Link
                key={p._id}
                to={`/markets/${p.market?._id}`}
                className="block bg-white rounded-3xl p-4 sm:p-5 fl-card-shadow border border-slate-100 hover:border-blue-200 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={p.market?.imageUrl}
                      alt={p.market?.title}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-[#001B6B] truncate">{p.market?.title || 'Marché'}</h3>
                      <p className="text-xs text-slate-500">{formatShortDateFR(p.createdAt)}</p>
                      <p className="text-xs font-bold text-slate-700 mt-1">
                        Mise : {formatFCFA(p.stakeAmount)} • Gain potentiel :{' '}
                        <span className="text-[#0033B3]">{formatFCFA(p.potentialGain)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <Badge variant={info.variant}>{info.label}</Badge>
                    {p.status === 'won' && (
                      <p className="text-sm font-black text-emerald-600">+{formatFCFA(p.actualGain)}</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </UserLayout>
  );
}
