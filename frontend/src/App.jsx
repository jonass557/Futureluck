import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PublicHomePage from './pages/PublicHomePage';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MarketsPage from './pages/MarketsPage';
import MarketDetailsPage from './pages/MarketDetailsPage';
import WalletPage from './pages/WalletPage';
import RechargePage from './pages/RechargePage';
import WithdrawPage from './pages/WithdrawPage';
import WinnersPage from './pages/WinnersPage';
import ParticipationsPage from './pages/ParticipationsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import { HelpPage, AboutPage } from './pages/InfoPages';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminMarketsPage from './pages/admin/AdminMarketsPage';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';
import { AdminUsersPage, AdminLogsPage } from './pages/admin/AdminUsersLogs';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen fl-gradient-blue flex items-center justify-center text-white font-bold">
        Chargement de FutureLuck...
      </div>
    );
  }
  return user ? children : <Navigate to="/welcome" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen fl-gradient-blue flex items-center justify-center text-white font-bold">
        Chargement...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function HomeGate() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen fl-gradient-blue flex items-center justify-center text-white font-bold">
        Chargement de FutureLuck...
      </div>
    );
  }
  return user ? <DashboardPage /> : <PublicHomePage />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<HomeGate />} />
          <Route
            path="/markets"
            element={
              <PrivateRoute>
                <MarketsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/markets/:id"
            element={
              <PrivateRoute>
                <MarketDetailsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <PrivateRoute>
                <WalletPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/wallet/history"
            element={
              <PrivateRoute>
                <WalletPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/wallet/recharge"
            element={
              <PrivateRoute>
                <RechargePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/wallet/withdraw"
            element={
              <PrivateRoute>
                <WithdrawPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/winners"
            element={
              <PrivateRoute>
                <WinnersPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/participations"
            element={
              <PrivateRoute>
                <ParticipationsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <NotificationsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/help"
            element={
              <PrivateRoute>
                <HelpPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/about"
            element={
              <PrivateRoute>
                <AboutPage />
              </PrivateRoute>
            }
          />

          {/* Distinct Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminOverviewPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/markets"
            element={
              <AdminRoute>
                <AdminMarketsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <AdminRoute>
                <AdminTransactionsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <AdminRoute>
                <AdminLogsPage />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
