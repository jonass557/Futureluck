import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Gavel,
  ArrowLeftRight,
  Users,
  ScrollText,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Wallet,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { FutureLuckLogo } from './FutureLuckLogo';

export function AdminLayout({ children, title }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { to: '/admin', label: 'Statistiques', icon: LayoutDashboard },
    { to: '/admin/wallet', label: 'Portefeuille Admin', icon: Wallet },
    { to: '/admin/markets', label: 'Marchés & Gagnants', icon: Gavel },
    { to: '/admin/transactions', label: 'Dépôts & Retraits', icon: ArrowLeftRight },
    { to: '/admin/payments', label: 'Paramètres Ikeepay', icon: KeyRound },
    { to: '/admin/users', label: 'Utilisateurs', icon: Users },
    { to: '/admin/logs', label: 'Journaux', icon: ScrollText },
  ];

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col lg:flex-row">
      {/* Desktop Admin Sidebar */}
      <aside className="hidden lg:flex fl-gradient-blue text-white w-68 shrink-0 flex-col justify-between shadow-xl">
        <div>
          <div className="p-5 border-b border-white/10">
            <FutureLuckLogo size="sm" />
            <div className="inline-flex items-center gap-1.5 bg-[#FFD200] text-[#001B6B] text-[11px] font-black px-2.5 py-1 rounded-full mt-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Espace Administration
            </div>
          </div>

          <nav className="p-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition ${
                    active ? 'bg-[#FFD200] text-[#001B6B] shadow' : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 space-y-2">
          <p className="text-xs text-blue-200 truncate">Connecté : {user?.fullName}</p>
          <Link
            to="/"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Vue Utilisateur
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Déconnecter
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-5 py-3.5 flex items-center justify-between gap-2 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-xl bg-[#0033B3] text-white hover:bg-[#002799] cursor-pointer"
              aria-label="Ouvrir le menu administrateur"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
              aria-label="Retour"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour</span>
            </button>
            <h1 className="text-base sm:text-xl font-extrabold text-[#001B6B] truncate">{title}</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#EEF4FF] text-[#0033B3] text-xs font-bold hover:bg-blue-100"
            >
              Vue User
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnecter</span>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 flex-1 max-w-6xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Admin Slide-out Menu Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setDrawerOpen(false)} />
          <aside className="relative z-10 w-76 max-w-[85vw] fl-gradient-blue text-white h-full flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div>
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <FutureLuckLogo size="sm" />
                  <p className="text-[11px] text-[#FFD200] font-bold mt-1">Administration</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/15 cursor-pointer"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-3 flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                        active ? 'bg-[#FFD200] text-[#001B6B] shadow' : 'text-blue-100 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-white/10 space-y-2">
              <Link
                to="/"
                onClick={() => setDrawerOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" /> Vue Utilisateur
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-600 text-xs font-bold cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Se déconnecter
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
