import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowDownToLine, ArrowUpRight, ArrowDownLeft, Trophy, Gavel } from 'lucide-react';
import { UserLayout } from '@/components/UserLayout';
import { Badge } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { formatFCFA, formatShortDateFR } from '@/lib/utils';
import api from '@/lib/api';

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
    api
      .get('/wallet/transactions')
      .then((res) => setTransactions(res.data.transactions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const txLabel = {
    deposit: 'Recharge Mobile Money',
    withdrawal: 'Retrait de gains',
    participation: 'Participation marché',
    winning: 'Gain remporté',
    refund: 'Remboursement',
  };

  const statusLabel = {
    pending: 'En attente',
    approved: 'Validé',
    completed: 'Effectué',
    rejected: 'Refusé',
  };

  return (
    <UserLayout title="Mon Portefeuille">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="fl-gradient-blue text-white rounded-3xl p-5 shadow-xl">
            <p className="text-xs text-blue-100 font-semibold">Portefeuille LuckyGamble</p>
            <p className="text-3xl font-black text-[#FFD200] mt-1">{formatFCFA(user?.walletBalance)}</p>
            <Link
              to="/wallet/recharge"
              className="mt-4 fl-gradient-gold text-[#001B6B] font-extrabold text-sm py-2.5 px-5 rounded-full inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Recharger via Mobile Money
            </Link>
          </div>

          <div className="fl-gradient-blue text-white rounded-3xl p-5 shadow-xl">
            <p className="text-xs text-blue-100 font-semibold">Mes gains disponibles (Retirables)</p>
            <p className="text-3xl font-black text-[#FFD200] mt-1">{formatFCFA(user?.winningsBalance)}</p>
            <Link
              to="/wallet/withdraw"
              className="mt-4 bg-white text-[#0033B3] font-extrabold text-sm py-2.5 px-5 rounded-full inline-flex items-center gap-1.5"
            >
              <ArrowDownToLine className="w-4 h-4" /> Retirer mes gains
            </Link>
          </div>
        </div>

        <section className="bg-white rounded-3xl p-5 fl-card-shadow border border-slate-100">
          <h2 className="text-lg font-extrabold text-[#001B6B] mb-4">Historique des transactions</h2>

          {loading ? (
            <p className="text-sm text-slate-500 text-center py-6">Chargement...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Aucune transaction pour le moment.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                const isCredit = tx.type === 'deposit' || tx.type === 'winning' || tx.type === 'refund';
                return (
                  <div key={tx._id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.type === 'winning'
                            ? 'bg-amber-100 text-amber-600'
                            : tx.type === 'participation'
                            ? 'bg-blue-100 text-[#0033B3]'
                            : isCredit
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {tx.type === 'winning' ? (
                          <Trophy className="w-5 h-5" />
                        ) : tx.type === 'participation' ? (
                          <Gavel className="w-5 h-5" />
                        ) : isCredit ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{txLabel[tx.type] || tx.type}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {tx.note || tx.reference} • {formatShortDateFR(tx.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <p className={`font-black text-sm ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isCredit ? '+' : '-'}
                        {formatFCFA(tx.amount)}
                      </p>
                      <Badge
                        variant={
                          tx.status === 'approved' || tx.status === 'completed'
                            ? 'approved'
                            : tx.status === 'rejected'
                            ? 'rejected'
                            : 'pending'
                        }
                      >
                        {statusLabel[tx.status] || tx.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </UserLayout>
  );
}
