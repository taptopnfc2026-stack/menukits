import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import AppLayout from '@/components/AppLayout';
import MenusPage from '@/pages/MenusPage';
import EditorPage from '@/pages/EditorPage';
import { ChecklistProvider } from '@/contexts/ChecklistContext';
import { MenuProvider } from '@/contexts/MenuContext';
import MenuPreviewPage from '@/pages/MenuPreviewPage';
import QRCodePage from '@/pages/QRCodePage';
import MenuHubPage from '@/pages/MenuHubPage';
import RestaurantPage from '@/pages/RestaurantPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import TranslationPage from '@/pages/TranslationPage';
import PaperMenuPage from '@/pages/PaperMenuPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import CookiePolicyPage from '@/pages/CookiePolicyPage';
import ImprintPage from '@/pages/ImprintPage';
import { CookieConsentProvider } from '@/components/CookieConsent';

function App() {
  return (
    <HashRouter>
      <CookieConsentProvider>
        <MenuProvider>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public menu preview (QR code scan) — no auth required */}
          <Route path="/r/:id" element={<MenuPreviewPage />} />

          {/* Public menu hub — browse all menus */}
          <Route path="/hub" element={<MenuHubPage />} />

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
        </Routes>
        </MenuProvider>
      </CookieConsentProvider>
    </HashRouter>
  );
}

export default App;
