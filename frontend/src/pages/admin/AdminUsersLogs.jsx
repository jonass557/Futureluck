import { useState, useEffect } from 'react';
import { UserPlus, Trophy, Gavel, CheckCircle2, X } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { formatFCFA, formatShortDateFR } from '@/lib/utils';
import api from '@/lib/api';

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // Create user form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('User@2026');
  const [walletBalance, setWalletBalance] = useState('0');
  const [creating, setCreating] = useState(false);

  // Assign user to market as participant or winner modal
  const [assignUser, setAssignUser] = useState(null);
  const [assignMarketId, setAssignMarketId] = useState('');
  const [assignRole, setAssignRole] = useState('participant'); // 'participant' | 'winner'
  const [assignAmount, setAssignAmount] = useState('5000');
  const [assigning, setAssigning] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/admin/users'), api.get('/markets?status=all')])
      .then(([uRes, mRes]) => {
        setUsers(uRes.data.users || []);
        const mkts = mRes.data.markets || [];
        setMarkets(mkts);
        if (mkts[0] && !assignMarketId) setAssignMarketId(mkts[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const changeStatus = async (id, status) => {
    await api.patch(`/admin/users/${id}/status`, { status });
    load();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setFeedback('');
    try {
      const { data } = await api.post('/admin/users', {
        fullName,
        phone,
        email: email || undefined,
        password,
        walletBalance: Number(walletBalance) || 0,
      });
      setFeedback(data.message);
      setShowCreate(false);
      setFullName('');
      setPhone('');
      setEmail('');
      setWalletBalance('0');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  const openAssignModal = (u, role = 'participant') => {
    setAssignUser(u);
    setAssignRole(role);
    const m = markets.find((x) => x._id === assignMarketId) || markets[0];
    if (m) {
      setAssignMarketId(m._id);
      setAssignAmount(
        String(role === 'winner' ? m.prizeAmount || 25000 : m.productPrice || m.minStake || 5000)
      );
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignUser || !assignMarketId) return;
    setAssigning(true);
    setFeedback('');
    try {
      if (assignRole === 'participant') {
        const { data } = await api.post(`/admin/markets/${assignMarketId}/participants`, {
          userId: assignUser.id,
          stakeAmount: Number(assignAmount),
        });
        setFeedback(data.message);
      } else {
        const { data } = await api.post(`/admin/markets/${assignMarketId}/winners`, {
          userId: assignUser.id,
          prizeAmount: Number(assignAmount),
        });
        setFeedback(data.message);
      }
      setAssignUser(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l’opération.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <AdminLayout title="Gestion des Utilisateurs">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 font-medium">
            Créez des utilisateurs, gérez leurs statuts et ajoutez-les comme participants ou gagnants à un produit.
          </p>
          <Button variant="gold" onClick={() => setShowCreate((v) => !v)}>
            <UserPlus className="w-4 h-4" /> Créer un utilisateur
          </Button>
        </div>

        {feedback && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" /> {feedback}
          </div>
        )}

        {showCreate && (
          <form
            onSubmit={handleCreateUser}
            className="bg-white rounded-3xl p-5 fl-card-shadow border border-blue-100 space-y-4"
          >
            <h2 className="text-base font-extrabold text-[#001B6B]">Nouvel Utilisateur</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Jean Momo"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+237695008164"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email (optionnel)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Solde initial LuckyGamble (FCFA)</label>
                <input
                  type="number"
                  min={0}
                  value={walletBalance}
                  onChange={(e) => setWalletBalance(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={creating}>
                {creating ? 'Création...' : 'Créer l’utilisateur'}
              </Button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-2xl fl-card-shadow overflow-x-auto">
          {loading ? (
            <p className="p-8 text-center text-slate-500 text-sm">Chargement...</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0033B3] text-white text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">ID Portefeuille</th>
                  <th className="px-4 py-3">Solde / Gains</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Ajouter à un produit</th>
                  <th className="px-4 py-3 text-right">Contrôle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{u.fullName}</p>
                      <p className="text-xs text-slate-500">{u.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(u.walletId || '')}
                        title="Cliquer pour copier l'ID"
                        className="font-mono text-xs font-extrabold bg-[#EEF4FF] text-[#0033B3] px-2.5 py-1 rounded-lg hover:bg-blue-100 cursor-pointer"
                      >
                        {u.walletId || '—'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-semibold text-slate-700">Misé : {formatFCFA(u.totalStaked)}</p>
                      <p className="font-bold text-emerald-600">Gagné : {formatFCFA(u.totalWon)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={u.status === 'active' ? 'approved' : u.status === 'suspended' ? 'pending' : 'rejected'}
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => openAssignModal(u, 'participant')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EEF4FF] text-[#0033B3] hover:bg-blue-100 text-xs font-bold cursor-pointer"
                        >
                          <Gavel className="w-3.5 h-3.5" /> + Participant
                        </button>
                        <button
                          type="button"
                          onClick={() => openAssignModal(u, 'winner')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFD200] text-[#001B6B] hover:brightness-95 text-xs font-extrabold cursor-pointer"
                        >
                          <Trophy className="w-3.5 h-3.5" /> + Gagnant
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {u.status !== 'active' && (
                        <button
                          type="button"
                          onClick={() => changeStatus(u.id, 'active')}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                        >
                          Activer
                        </button>
                      )}
                      {u.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => changeStatus(u.id, 'suspended')}
                          className="px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Suspendre
                        </button>
                      )}
                      {u.status !== 'blocked' && (
                        <button
                          type="button"
                          onClick={() => changeStatus(u.id, 'blocked')}
                          className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                        >
                          Bloquer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-4 pb-4">
            <Pagination
              page={page}
              totalPages={Math.max(1, Math.ceil(users.length / PAGE_SIZE))}
              onPageChange={setPage}
            />
          </div>
        </div>

        {/* Assign User to Market Modal */}
        {assignUser && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <form
              onSubmit={handleAssignSubmit}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="fl-gradient-blue text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base">
                    {assignRole === 'winner' ? 'Désigner comme gagnant' : 'Ajouter comme participant'}
                  </h3>
                  <p className="text-xs text-blue-100">
                    {assignUser.fullName} ({assignUser.phone})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignUser(null)}
                  className="p-1 rounded-full hover:bg-white/15 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Produit / Marché *</label>
                  <select
                    required
                    value={assignMarketId}
                    onChange={(e) => {
                      setAssignMarketId(e.target.value);
                      const m = markets.find((x) => x._id === e.target.value);
                      if (m) {
                        setAssignAmount(
                          String(
                            assignRole === 'winner' ? m.prizeAmount || 25000 : m.productPrice || m.minStake || 5000
                          )
                        );
                      }
                    }}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-sm font-bold"
                  >
                    {markets.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.title} ({m.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {assignRole === 'winner' ? 'Prix gagné (FCFA) *' : 'Montant de la mise (FCFA) *'}
                  </label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={assignAmount}
                    onChange={(e) => setAssignAmount(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 font-extrabold text-base"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setAssignUser(null)}>
                    Annuler
                  </Button>
                  <Button type="submit" variant={assignRole === 'winner' ? 'gold' : 'primary'} size="sm" disabled={assigning}>
                    {assigning
                      ? 'Enregistrement...'
                      : assignRole === 'winner'
                      ? 'Confirmer & Créditer le gain'
                      : 'Ajouter au marché'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    api
      .get('/admin/audit-logs')
      .then((res) => setLogs(res.data.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Journaux des opérations">
      <div className="bg-white rounded-2xl fl-card-shadow overflow-x-auto">
        {loading ? (
          <p className="p-8 text-center text-slate-500 text-sm">Chargement...</p>
        ) : (
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#0033B3] text-white text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Acteur</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((log) => (
                <tr key={log._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatShortDateFR(log.createdAt)}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {log.actorName} <span className="text-xs font-normal text-slate-500">({log.actorRole})</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-[#0033B3]">{log.action}</td>
                  <td className="px-4 py-3 text-slate-700">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4 pb-4">
          <Pagination
            page={page}
            totalPages={Math.max(1, Math.ceil(logs.length / PAGE_SIZE))}
            onPageChange={setPage}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
