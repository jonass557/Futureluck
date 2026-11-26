import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Gavel, Coins, ArrowDownToLine, ArrowUpRight, Clock } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { formatFCFA } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((res) => setStats(res.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: 'Utilisateurs inscrits', value: stats.totalUsers, icon: Users, color: 'bg-blue-50 text-[#0033B3]' },
        { label: 'Marchés ouverts', value: stats.activeMarkets, icon: Gavel, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Montants engagés (Total)', value: formatFCFA(stats.totalPool), icon: Coins, color: 'bg-amber-50 text-amber-600' },
        { label: 'Dépôts validés', value: formatFCFA(stats.totalDeposits), icon: ArrowUpRight, color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Retraits validés', value: formatFCFA(stats.totalWithdrawals), icon: ArrowDownToLine, color: 'bg-purple-50 text-purple-600' },
        {
          label: 'Demandes en attente',
          value: `${stats.pendingDeposits} dépôts / ${stats.pendingWithdrawals} retraits`,
          icon: Clock,
          color: 'bg-red-50 text-red-600',
        },
      ]
    : [];

  return (
    <AdminLayout title="Tableau de bord & Statistiques">
      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-500">Chargement des statistiques...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="bg-white rounded-2xl p-5 fl-card-shadow border border-slate-100 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${c.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">{c.label}</p>
                    <p className="text-xl font-black text-[#001B6B] mt-0.5">{c.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/markets"
              className="fl-gradient-blue text-white rounded-2xl p-6 shadow-lg hover:brightness-105 transition"
            >
              <h2 className="text-lg font-extrabold text-[#FFD200]">Gérer les marchés & gagnants →</h2>
              <p className="text-sm text-blue-100 mt-1">
                Publier des produits, ajouter des participants et désigner les gagnants.
              </p>
            </Link>
            <Link
              to="/admin/payments"
              className="fl-gradient-gold text-[#001B6B] rounded-2xl p-6 shadow-lg hover:brightness-95 transition"
            >
              <h2 className="text-lg font-extrabold">Paramètres & Clés API Ikeepay →</h2>
              <p className="text-sm text-[#001B6B]/85 font-medium mt-1">
                Insérer votre clé secrète Ikeepay et copier le lien Webhook.
              </p>
            </Link>
            <Link
              to="/admin/users"
              className="bg-white border-2 border-[#0033B3] text-[#001B6B] rounded-2xl p-6 shadow-sm hover:bg-[#EEF4FF] transition"
            >
              <h2 className="text-lg font-extrabold">Créer & gérer les utilisateurs →</h2>
              <p className="text-sm text-slate-600 mt-1">
                Créer des comptes utilisateurs et les ajouter comme participants ou gagnants.
              </p>
            </Link>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
