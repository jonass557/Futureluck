import { useState, useEffect } from 'react';
import { Trophy, Users, Calendar } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { Badge } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { formatFCFA, formatShortDateFR } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminHistoryPage() {
  const [type, setType] = useState('participants'); // 'participants' | 'winners'
  const [marketId, setMarketId] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/markets?status=all')
      .then((res) => setMarkets(res.data.markets || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      type,
      marketId,
      page: String(page),
      limit: '12',
    });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    api
      .get(`/admin/history?${params.toString()}`)
      .then((res) => {
        setItems(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type, marketId, startDate, endDate, page]);

  const handleFilterChange = (setter) => (val) => {
    setter(val);
    setPage(1);
  };

  return (
    <AdminLayout title="Historique Participants & Gagnants">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl fl-card-shadow max-w-md">
          <button
            type="button"
            onClick={() => handleFilterChange(setType)('participants')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition ${
              type === 'participants' ? 'bg-[#0033B3] text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" /> Participants
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange(setType)('winners')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition ${
              type === 'winners' ? 'bg-[#FFD200] text-[#001B6B] shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Trophy className="w-4 h-4" /> Gagnants
          </button>
        </div>

        {/* Product & Period Filters */}
        <div className="bg-white rounded-2xl p-4 fl-card-shadow grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Filtrer par produit</label>
            <select
              value={marketId}
              onChange={(e) => handleFilterChange(setMarketId)(e.target.value)}
              className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 text-sm font-bold"
            >
              <option value="all">Tous les produits</option>
              {markets.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#0033B3]" /> Date début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleFilterChange(setStartDate)(e.target.value)}
              className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#0033B3]" /> Date fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleFilterChange(setEndDate)(e.target.value)}
              className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 text-sm"
            />
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-2xl p-4 fl-card-shadow overflow-x-auto">
          <p className="text-xs font-bold text-slate-500 mb-3">
            {total} résultat(s) trouvé(s)
          </p>
          {loading ? (
            <p className="p-8 text-center text-slate-500 text-sm">Chargement...</p>
          ) : items.length === 0 ? (
            <p className="p-8 text-center text-slate-500 text-sm">Aucun enregistrement pour ces critères.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0033B3] text-white text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Mise</th>
                  <th className="px-4 py-3">{type === 'winners' ? 'Prix gagné' : 'Statut'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatShortDateFR(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{item.user?.fullName || 'Utilisateur'}</p>
                      <p className="text-xs text-slate-500">
                        {item.user?.phone} • <span className="font-mono">{item.user?.walletId}</span>
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#001B6B]">
                      {item.market?.title || 'Marché'}
                    </td>
                    <td className="px-4 py-3 font-bold">{formatFCFA(item.stakeAmount)}</td>
                    <td className="px-4 py-3">
                      {type === 'winners' ? (
                        <span className="font-black text-emerald-600">{formatFCFA(item.actualGain)}</span>
                      ) : (
                        <Badge
                          variant={
                            item.status === 'won'
                              ? 'gold'
                              : item.status === 'pending'
                              ? 'pending'
                              : 'default'
                          }
                        >
                          {item.status === 'won'
                            ? `Gagnant (${formatFCFA(item.actualGain)})`
                            : item.status === 'pending'
                            ? 'En cours'
                            : 'Non retenu'}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </AdminLayout>
  );
}
