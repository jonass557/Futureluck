import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Bell,
  Home,
  Gavel,
  Wallet,
  Trophy,
  User as UserIcon,
  History,
  ArrowDownToLine,
  Settings,
  HelpCircle,
  Info,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { FutureLuckLogo } from './FutureLuckLogo';
import { formatFCFA } from '@/lib/utils';
import api from '@/lib/api';

export function UserLayout({ children, title, showBack = true }) {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    api
      .get('/wallet/notifications')
      .then((res) => setUnreadCount(res.data.unreadCount || 0))
      .catch(() => {});
  }, [user, location.pathname]);

  const navItems = [
    { to: '/', label: 'Accueil', icon: Home },
    { to: '/markets', label: 'Marchés', icon: Gavel },
    { to: '/wallet', label: 'Portefeuille', icon: Wallet },
    { to: '/winners', label: 'Gagnants', icon: Trophy },
    { to: '/profile', label: 'Profil', icon: UserIcon },
  ];

  const drawerLinks = [
    { to: '/wallet', label: 'Mon Portefeuille', icon: Wallet, extra: formatFCFA(user?.walletBalance) },
    { to: '/participations', label: 'Mes Participations', icon: Gavel },
    { to: '/wallet/withdraw', label: 'Mes Retraits', icon: ArrowDownToLine },
    { to: '/wallet/history', label: 'Historique des gains', icon: History },
    { to: '/profile', label: 'Paramètres', icon: Settings },
    { to: '/help', label: 'Aide & Assistance', icon: HelpCircle },
    { to: '/about', label: 'À propos de FutureLuck', icon: Info },
  ];

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col pb-20 md:pb-0">
      {/* Top Royal Blue Header */}
      <header className="fl-gradient-header text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="p-2 -ml-2 rounded-full hover:bg-white/15 transition cursor-pointer"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            {showBack && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-white/15 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                aria-label="Retour"
              >
                <span className="text-lg font-bold leading-none">←</span>
                <span className="hidden sm:inline">Retour</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-center">
            {title ? (
              <h1 className="text-lg font-extrabold tracking-tight">{title}</h1>
            ) : (
              <Link to="/" className="flex flex-col items-center">
                <FutureLuckLogo size="sm" showSlogan />
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1 bg-[#FFD200] text-[#001B6B] text-xs font-extrabold px-3 py-1.5 rounded-full"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
            <Link
              to="/notifications"
              className="relative p-2 rounded-full hover:bg-white/15 transition"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link to="/profile" className="shrink-0">
              <div className="w-9 h-9 rounded-full border-2 border-[#FFD200] overflow-hidden bg-blue-900 flex items-center justify-center text-xs font-bold">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.fullName?.slice(0, 2).toUpperCase() || 'FL'}</span>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* Desktop Sub-Navigation Bar */}
        <nav className="hidden md:block bg-[#002385]/80 border-t border-white/10">
          <div className="max-w-5xl mx-auto px-4 flex items-center gap-2 h-11">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition ${
                    active ? 'bg-[#FFD200] text-[#001B6B]' : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-5">{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Navigation principale"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 fl-gradient-blue text-white border-t border-blue-700/60 shadow-lg"
      >
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                  active ? 'text-[#FFD200]' : 'text-blue-100/85 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''}`} />
                <span>{item.label}</span>
                {active && <span className="w-5 h-0.5 rounded-full bg-[#FFD200]" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Slide-out Drawer (inspired by Image 2) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative z-10 w-80 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="fl-gradient-blue text-white p-5 flex items-center gap-3.5 relative">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/15 cursor-pointer"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden bg-blue-950 flex items-center justify-center text-lg font-extrabold shrink-0">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  user?.fullName?.slice(0, 2).toUpperCase() || 'FL'
                )}
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-lg truncate">{user?.fullName}</p>
                <p className="text-xs text-blue-100 truncate">{user?.phone}</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  En ligne
                </span>
              </div>
            </div>

            {/* Drawer Links */}
            <div className="flex-1 divide-y divide-slate-100 px-3 py-2">
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between py-3.5 px-2 rounded-xl bg-amber-50 text-[#001B6B] font-extrabold text-sm my-1"
                >
                  <span className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                    Tableau de bord Admin
                  </span>
                  <span>→</span>
                </Link>
              )}

              {drawerLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to + item.label}
                    to={item.to}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-between py-3.5 px-2 hover:bg-slate-50 rounded-xl transition text-slate-800"
                  >
                    <span className="flex items-center gap-3 font-semibold text-sm">
                      <Icon className="w-5 h-5 text-[#0033B3]" />
                      {item.label}
                    </span>
                    {item.extra && (
                      <span className="text-xs font-extrabold text-[#0033B3]">{item.extra}</span>
                    )}
                  </Link>
                );
              })}

              <div className="pt-4 pb-2 px-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-sm transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="fl-gradient-blue text-white p-4 flex flex-col items-center">
              <FutureLuckLogo size="sm" showSlogan slogan="Jouez • Gagnez • Encaissez" />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
