import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import AppLayout from '@/components/AppLayout';
import MenusPage from '@/pages/MenusPage';
import EditorPage from '@/pages/EditorPage';
import { ChecklistProvider } from '@/contexts/ChecklistContext';
import { MenuProvider } from '@/contexts/MenuContext';
import MenuPreviewPage from '@/pages/MenuPreviewPage';
import QRCodePage from '@/pages/QRCodePage';
import MenuHubPage from '@/pages/MenuHubPage';
import PublicRestaurantPage from '@/pages/PublicRestaurantPage';
import RestaurantPage from '@/pages/RestaurantPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import TranslationPage from '@/pages/TranslationPage';
import PaperMenuPage from '@/pages/PaperMenuPage';
import SettingsPage from '@/pages/SettingsPage';
import AdminLayout from '@/components/AdminLayout';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminMenusPage from '@/pages/AdminMenusPage';
import AdminUsersPage from '@/pages/AdminUsersPage';
import AdminAnalyticsPage from '@/pages/AdminAnalyticsPage';
import AdminApiPage from '@/pages/AdminApiPage';
import AdminApiKeysPage from '@/pages/AdminApiKeysPage';
import AdminActivityPage from '@/pages/AdminActivityPage';
import AdminSettingsPage from '@/pages/AdminSettingsPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import CookiePolicyPage from '@/pages/CookiePolicyPage';
import ImprintPage from '@/pages/ImprintPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import { AuthProvider } from '@/contexts/AuthContext';
import { CookieConsentProvider } from '@/components/CookieConsent';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <CookieConsentProvider>
        <MenuProvider>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public menu preview (QR code scan) — no auth required */}
          <Route path="/r/:id" element={<MenuPreviewPage />} />

          {/* Public menu hub — browse all menus */}
          <Route path="/hub" element={<MenuHubPage />} />

          {/* Public restaurant page by custom slug — mobile-friendly QR scan destination */}
          <Route path="/hub/:slug" element={<PublicRestaurantPage />} />

          {/* Auth pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Legal pages */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/cookies" element={<CookiePolicyPage />} />
          <Route path="/imprint" element={<ImprintPage />} />

          {/* Admin dashboard (with header/nav) */}
          <Route path="/app" element={
            <ChecklistProvider>
              <AppLayout />
            </ChecklistProvider>
          }>
            <Route index element={<MenusPage />} />
            <Route path="editor/:id" element={<EditorPage />} />
            <Route path="menu-preview/:id" element={<MenuPreviewPage />} />
            <Route path="qr-code" element={<QRCodePage />} />
            <Route path="restaurant" element={<RestaurantPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="translations" element={<TranslationPage />} />
            <Route path="paper-menu" element={<PaperMenuPage />} />
          </Route>

          {/* Standalone Admin Panel (independent layout, no app nav) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="menus" element={<AdminMenusPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="api" element={<AdminApiPage />} />
            <Route path="providers" element={<SettingsPage />} />
            <Route path="keys" element={<AdminApiKeysPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Routes>
        </MenuProvider>
      </CookieConsentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
