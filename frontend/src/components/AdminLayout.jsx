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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { FutureLuckLogo } from './FutureLuckLogo';

export function AdminLayout({ children, title }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin', label: 'Statistiques', icon: LayoutDashboard },
    { to: '/admin/markets', label: 'Marchés & Gagnants', icon: Gavel },
    { to: '/admin/transactions', label: 'Dépôts & Retraits', icon: ArrowLeftRight },
    { to: '/admin/users', label: 'Utilisateurs', icon: Users },
    { to: '/admin/logs', label: 'Journaux', icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col lg:flex-row">
      {/* Distinct Admin Sidebar */}
      <aside className="fl-gradient-blue text-white w-full lg:w-68 shrink-0 flex flex-col justify-between shadow-xl">
        <div>
          <div className="p-5 border-b border-white/10 flex items-center justify-between lg:block">
            <FutureLuckLogo size="sm" />
            <div className="inline-flex items-center gap-1.5 bg-[#FFD200] text-[#001B6B] text-[11px] font-black px-2.5 py-1 rounded-full lg:mt-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Espace Administration
            </div>
          </div>

          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
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

        <div className="hidden lg:block p-4 border-t border-white/10 space-y-2">
          <p className="text-xs text-blue-200 truncate">Connecté : {user?.fullName}</p>
          <Link
            to="/"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Vue Utilisateur
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/welcome');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-[#001B6B]">{title}</h1>
          <div className="flex items-center gap-3 lg:hidden">
            <Link to="/" className="text-xs font-bold text-[#0033B3] hover:underline">
              App User
            </Link>
          </div>
        </header>
        <main className="p-4 sm:p-6 flex-1 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
