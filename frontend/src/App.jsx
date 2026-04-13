// src/App.jsx - Root router with protected/public route handling
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import StoragePage from './pages/StoragePage';
import FileManagementPage from './pages/FileManagementPage';
import MembersPage from './pages/MembersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import PricingPage from './pages/PricingPage';

// ─── Route Guards ─────────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-page-loader"><span className="loader" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-page-loader"><span className="loader" /></div>;
  return user ? <Navigate to="/" replace /> : children;
};

export default function App() {
  return (
    <Routes>
      {/* Protected routes */}
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/storage" element={<PrivateRoute><StoragePage /></PrivateRoute>} />
      <Route path="/files" element={<PrivateRoute><FileManagementPage /></PrivateRoute>} />
      <Route path="/members" element={<PrivateRoute><MembersPage /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
      <Route path="/pricing" element={<PrivateRoute><PricingPage /></PrivateRoute>} />

      {/* Public only (redirect to dashboard if logged in) */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
