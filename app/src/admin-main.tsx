import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import './index.css';
import './admin.css';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminMenusPage from './pages/AdminMenusPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminApiPage from './pages/AdminApiPage';
import AdminApiKeysPage from './pages/AdminApiKeysPage';
import AdminActivityPage from './pages/AdminActivityPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';

// ---- Standalone Admin SPA ----
// Only routes relevant to the admin panel. No main app pages included.
function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected admin shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="menus" element={<AdminMenusPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="api" element={<AdminApiPage />} />
        <Route path="providers" element={<SettingsPage />} />
        <Route path="keys" element={<AdminApiKeysPage />} />
        <Route path="activity" element={<AdminActivityPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? '/' : '/login'} replace />
          }
        />
      </Route>
    </Routes>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
