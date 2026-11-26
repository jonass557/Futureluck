import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { UserLayout } from '@/components/UserLayout';
import { formatShortDateFR } from '@/lib/utils';
import api from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get('/wallet/notifications')
      .then((res) => setNotifications(res.data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    await api.patch('/wallet/notifications/read-all');
    load();
  };

  return (
    <UserLayout title="Notifications" showBack>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0033B3] hover:underline cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" /> Tout marquer comme lu
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-500">Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-500">Aucune notification.</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`rounded-2xl p-4 fl-card-shadow border ${
                  n.read ? 'bg-white border-slate-100' : 'bg-[#EEF4FF] border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0033B3] text-white flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-[#001B6B]">{n.title}</h3>
                      <span className="text-[11px] text-slate-500 shrink-0">{formatShortDateFR(n.createdAt)}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 mt-1">{n.message}</p>
                    {n.link && (
                      <Link to={n.link} className="inline-block text-xs font-bold text-[#0033B3] mt-2 hover:underline">
                        Voir →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
