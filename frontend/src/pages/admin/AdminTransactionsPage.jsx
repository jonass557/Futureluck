import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { Badge } from '@/components/ui/Card';
import { formatFCFA, formatShortDateFR } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get(`/admin/transactions?type=${typeFilter}&status=${statusFilter}`)
      .then((res) => setTransactions(res.data.transactions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [typeFilter, statusFilter]);

  const handleAction = async (id, action) => {
    try {
      await api.patch(`/admin/transactions/${id}/${action}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du traitement.');
    }
  };

  return (
    <AdminLayout title="Gestion des Dépôts & Retraits">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 bg-white p-4 rounded-2xl fl-card-shadow">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="min-h-[42px] px-3 rounded-xl border border-slate-300 text-sm font-bold"
          >
            <option value="all">Tous les types</option>
            <option value="deposit">Dépôts Mobile Money</option>
            <option value="withdrawal">Retraits de gains</option>
            <option value="participation">Participations</option>
            <option value="winning">Gains attribués</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[42px] px-3 rounded-xl border border-slate-300 text-sm font-bold"
          >
            <option value="pending">En attente</option>
            <option value="approved">Validés</option>
            <option value="rejected">Refusés</option>
            <option value="all">Tous les statuts</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl fl-card-shadow overflow-x-auto">
          {loading ? (
            <p className="p-8 text-center text-slate-500 text-sm">Chargement...</p>
          ) : transactions.length === 0 ? (
            <p className="p-8 text-center text-slate-500 text-sm">Aucune transaction trouvée.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0033B3] text-white text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Type / Opérateur</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{tx.user?.fullName}</p>
                      <p className="text-xs text-slate-500">{tx.phone || tx.user?.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold capitalize">{tx.type}</p>
                      <p className="text-xs text-slate-500">{tx.provider}</p>
                    </td>
                    <td className="px-4 py-3 font-black text-[#001B6B]">{formatFCFA(tx.amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{formatShortDateFR(tx.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          tx.status === 'approved' || tx.status === 'completed'
                            ? 'approved'
                            : tx.status === 'rejected'
                            ? 'rejected'
                            : 'pending'
                        }
                      >
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tx.status === 'pending' && (
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAction(tx._id, 'approve')}
                            className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                            title="Approuver"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(tx._id, 'reject')}
                            className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                            title="Refuser"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
