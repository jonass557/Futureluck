import { useState, useEffect } from 'react';
import { Wallet, Send, Plus, ArrowDownToLine, CheckCircle2, Copy } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { formatFCFA, formatShortDateFR } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminWalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('transfer'); // 'transfer' | 'deposit' | 'withdraw'
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Transfer form
  const [recipientWalletId, setRecipientWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('25000');
  const [transferNote, setTransferNote] = useState('');

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('50000');
  const [depositNote, setDepositNote] = useState('');

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('10000');
  const [withdrawProvider, setWithdrawProvider] = useState('MTN_MOMO');
  const [withdrawPhone, setWithdrawPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/admin/wallet'), api.get('/admin/users')])
      .then(([wRes, uRes]) => {
        setWallet(wRes.data.wallet);
        setTransactions(wRes.data.transactions || []);
        setUsers(uRes.data.users || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    try {
      const { data } = await api.post('/admin/wallet/transfer', {
        recipientWalletId,
        amount: Number(transferAmount),
        note: transferNote,
      });
      setFeedback(data.message);
      setRecipientWalletId('');
      setTransferNote('');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du transfert.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    try {
      const { data } = await api.post('/admin/wallet/deposit', {
        amount: Number(depositAmount),
        note: depositNote,
      });
      setFeedback(data.message);
      setDepositNote('');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du dépôt.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    try {
      const { data } = await api.post('/admin/wallet/withdraw', {
        amount: Number(withdrawAmount),
        provider: withdrawProvider,
        phone: withdrawPhone,
      });
      setFeedback(data.message);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du retrait.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Portefeuille Administrateur">
      <div className="space-y-5">
        {/* Admin Wallet Summary Card */}
        <div className="fl-gradient-blue text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-[#FFD200]/40 flex items-center justify-center shrink-0">
              <Wallet className="w-9 h-9 text-[#FFD200]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm text-blue-100 font-semibold">Solde Portefeuille Admin</p>
                {wallet?.walletId && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(wallet.walletId);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="inline-flex items-center gap-1 bg-white/15 text-[#FFD200] text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-full cursor-pointer"
                  >
                    {wallet.walletId} <Copy className="w-3 h-3" /> {copied && '✓'}
                  </button>
                )}
              </div>
              <p className="text-3xl font-black text-[#FFD200] mt-1">
                {loading ? '...' : formatFCFA(wallet?.walletBalance)}
              </p>
              <p className="text-xs text-blue-200 mt-1">
                Total collecté des participations : <strong>{formatFCFA(wallet?.totalCollectedFromMarkets)}</strong>
              </p>
            </div>
          </div>
        </div>

        {feedback && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" /> {feedback}
          </div>
        )}

        {/* Action Tabs */}
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl fl-card-shadow">
          <button
            type="button"
            onClick={() => setTab('transfer')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition ${
              tab === 'transfer' ? 'bg-[#0033B3] text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Send className="w-4 h-4" /> Transférer à un gagnant
          </button>
          <button
            type="button"
            onClick={() => setTab('deposit')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition ${
              tab === 'deposit' ? 'bg-[#0033B3] text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Plus className="w-4 h-4" /> Dépôt Admin
          </button>
          <button
            type="button"
            onClick={() => setTab('withdraw')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition ${
              tab === 'withdraw' ? 'bg-[#0033B3] text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" /> Retrait Admin
          </button>
        </div>

        {/* Forms */}
        <div className="bg-white rounded-3xl p-6 fl-card-shadow border border-slate-100">
          {tab === 'transfer' && (
            <form onSubmit={handleTransfer} className="space-y-4 max-w-xl">
              <h2 className="text-lg font-extrabold text-[#001B6B]">
                Transférer des fonds vers un gagnant / utilisateur
              </h2>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sélectionner un utilisateur (remplit son ID portefeuille)
                </label>
                <select
                  onChange={(e) => setRecipientWalletId(e.target.value)}
                  value={recipientWalletId}
                  className="w-full min-h-[46px] px-3 rounded-xl border border-slate-300 text-sm font-bold"
                >
                  <option value="">-- Choisir un utilisateur --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.walletId}>
                      {u.fullName} — {u.walletId} ({u.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Identifiant du portefeuille du destinataire *
                </label>
                <input
                  type="text"
                  required
                  value={recipientWalletId}
                  onChange={(e) => setRecipientWalletId(e.target.value)}
                  placeholder="Ex: FLW-A1B2C3"
                  className="w-full min-h-[46px] px-3 rounded-xl border border-slate-300 font-mono font-bold uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Montant à transférer (FCFA) *</label>
                <input
                  type="number"
                  min={100}
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full min-h-[46px] px-3 rounded-xl border border-slate-300 font-extrabold text-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note (optionnel)</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Ex: Récompense gagnant marché..."
                  className="w-full min-h-[46px] px-3 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <Button type="submit" variant="gold" size="lg" disabled={submitting}>
                {submitting ? 'Transfert...' : 'Transférer vers le portefeuille du gagnant'}
              </Button>
            </form>
          )}

          {tab === 'deposit' && (
            <form onSubmit={handleDeposit} className="space-y-4 max-w-xl">
              <h2 className="text-lg font-extrabold text-[#001B6B]">Effectuer un dépôt dans le Portefeuille Admin</h2>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Montant (FCFA) *</label>
                <input
                  type="number"
                  min={100}
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full min-h-[46px] px-3 rounded-xl border border-slate-300 font-extrabold text-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motif / Note</label>
                <input
                  type="text"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder="Ex: Approvisionnement caisse"
                  className="w-full min-h-[46px] px-3 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                {submitting ? 'Dépôt...' : 'Confirmer le dépôt'}
              </Button>
            </form>
          )}

          {tab === 'withdraw' && (
            <form onSubmit={handleWithdraw} className="space-y-4 max-w-xl">
              <h2 className="text-lg font-extrabold text-[#001B6B]">Effectuer un retrait depuis le Portefeuille Admin</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Opérateur / Mode</label>
                  <select
                    value={withdrawProvider}
                    onChange={(e) => setWithdrawProvider(e.target.value)}
                    className="w-full min-h-[46px] px-3 rounded-xl border border-slate-300 text-sm font-bold"
                  >
                    <option value="WALLET">Retrait direct / Caisse</option>
                    <option value="MTN_MOMO">MTN Mobile Money (Ikeepay)</option>
                    <option value="ORANGE_MONEY">Orange Money (Ikeepay)</option>
                    <option value="WAVE">Wave (Ikeepay)</option>
                    <option value="MOOV">Moov Money (Ikeepay)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone réception (si Mobile Money)</label>
                  <input
                    type="tel"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    placeholder="2250700000000"
                    className="w-full min-h-[46px] px-3 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Montant (FCFA) *</label>
                <input
                  type="number"
                  min={100}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full min-h-[46px] px-3 rounded-xl border border-slate-300 font-extrabold text-lg"
                />
              </div>
              <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                {submitting ? 'Retrait...' : 'Confirmer le retrait'}
              </Button>
            </form>
          )}
        </div>

        {/* Admin Wallet History */}
        <div className="bg-white rounded-3xl p-5 fl-card-shadow border border-slate-100">
          <h3 className="text-base font-extrabold text-[#001B6B] mb-3">Historique du Portefeuille Admin</h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Aucune opération pour le moment.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((tx) => (
                <div key={tx._id} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-bold text-slate-900">{tx.note || tx.type}</p>
                    <p className="text-xs text-slate-500">
                      {tx.reference} • {formatShortDateFR(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-[#001B6B]'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}
                      {formatFCFA(tx.amount)}
                    </p>
                    <Badge variant="approved">{tx.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination
            page={page}
            totalPages={Math.max(1, Math.ceil(transactions.length / PAGE_SIZE))}
            onPageChange={setPage}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
