import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Badge } from '@/components/ui/Card';
import { formatFCFA, formatShortDateFR } from '@/lib/utils';
import api from '@/lib/api';

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/admin/users')
      .then((res) => setUsers(res.data.users || []))
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

  return (
    <AdminLayout title="Gestion des Utilisateurs">
      <div className="bg-white rounded-2xl fl-card-shadow overflow-x-auto">
        {loading ? (
          <p className="p-8 text-center text-slate-500 text-sm">Chargement...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0033B3] text-white text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Total engagé</th>
                <th className="px-4 py-3">Total gagné</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Contrôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{u.fullName}</p>
                    <p className="text-xs text-slate-500">{u.phone}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatFCFA(u.totalStaked)}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">{formatFCFA(u.totalWon)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.status === 'active' ? 'approved' : u.status === 'suspended' ? 'pending' : 'rejected'}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5">
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
      </div>
    </AdminLayout>
  );
}

export function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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
              {logs.map((log) => (
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
      </div>
    </AdminLayout>
  );
}
