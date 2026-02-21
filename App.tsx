
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { captureTrackingIdFromUrl } from './services/tracking';

import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import JewelryDetailPage from './pages/JewelryDetailPage';
import TryOnPage from './pages/TryOnPage';
import WidgetPage from './pages/WidgetPage';
import CustomizePage from './pages/CustomizePage';
import CustomResultPage from './pages/CustomResultPage';
import DemoCatalog from './pages/DemoCatalog';
import DemoDetail from './pages/DemoDetail';
import DocsPage from './pages/DocsPage';
import AdminDemoListPage from './pages/admin/AdminDemoListPage';
import AdminDemoEditPage from './pages/admin/AdminDemoEditPage';
import BajaPage from './pages/BajaPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminJewelryListPage from './pages/admin/AdminJewelryListPage';
import AdminJewelryEditPage from './pages/admin/AdminJewelryEditPage';
import AdminLegacyPanelPage from './pages/admin/AdminLegacyPanelPage';
import AdminCampaignPage from './pages/admin/AdminCampaignPage';
import AdminOrganizationPage from './pages/admin/AdminOrganizationPage';
import { AuthProvider } from './hooks/useAuth';
import { ConfigProvider } from './hooks/useConfig';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import LegalNoticePage from './pages/LegalNoticePage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import CookieBanner from './components/ui/CookieBanner';
import Footer from './components/layout/Footer';

const PageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <div className="relative min-h-screen font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#08070f] via-[#0f1018] to-[#0b0c14]"></div>
        <div className="absolute -left-32 -top-32 w-72 h-72 bg-[var(--primary-color)]/10 blur-3xl"></div>
        <div className="absolute -right-24 bottom-0 w-64 h-64 bg-white/5 blur-3xl"></div>
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <div key={location.pathname}>{children}</div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    captureTrackingIdFromUrl();
  }, []);

  return (
    <AuthProvider>
      <HashRouter>
        <ConfigProvider>
          <Routes>
            <Route path="/try-on/:slug" element={<TryOnPage />} />
            <Route path="/widget" element={<WidgetPage />} />
            <Route path="/personalizar" element={<PageLayout><CustomizePage /></PageLayout>} />
            <Route path="/personalizar/resultado" element={<CustomResultPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayout><AdminJewelryListPage /></AdminLayout>} />
            <Route path="/admin/jewelry" element={<AdminLayout><AdminJewelryListPage /></AdminLayout>} />
            <Route path="/admin/jewelry/new" element={<AdminLayout><AdminJewelryEditPage /></AdminLayout>} />
            <Route path="/admin/jewelry/edit/:id" element={<AdminLayout><AdminJewelryEditPage /></AdminLayout>} />
            <Route path="/admin/demos" element={<AdminLayout><AdminDemoListPage /></AdminLayout>} />
            <Route path="/admin/demos/new" element={<AdminLayout><AdminDemoEditPage /></AdminLayout>} />
            <Route path="/admin/demos/edit/:tag" element={<AdminLayout><AdminDemoEditPage /></AdminLayout>} />
            <Route path="/admin/campaign" element={<AdminLayout><AdminCampaignPage /></AdminLayout>} />
            <Route path="/admin/organizations" element={<AdminLayout><AdminOrganizationPage /></AdminLayout>} />
            <Route path="/admin/legacy-panel" element={<AdminLayout><AdminLegacyPanelPage /></AdminLayout>} />

            {/* Demo Routes - Isolated from Main Layout */}
            <Route path="/demo/:tag" element={<DemoCatalog />} />
            <Route path="/demo/:tag/jewelry/:slug" element={<DemoDetail />} />
            <Route path="/demo/:tag/try-on/:slug" element={<TryOnPage />} />

            <Route path="*" element={
              <PageLayout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/catalog" element={<CatalogPage />} />
                  <Route path="/jewelry/:slug" element={<JewelryDetailPage />} />
                  <Route path="/personalizar" element={<CustomizePage />} />
                  <Route path="/personalizar/resultado" element={<CustomResultPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/legal-notice" element={<LegalNoticePage />} />
                  <Route path="/cookies" element={<CookiePolicyPage />} />
                  <Route path="/docs" element={<DocsPage />} />
                  <Route path="/baja" element={<BajaPage />} />
                </Routes>
              </PageLayout>
            } />
          </Routes>
          <CookieBanner />
        </ConfigProvider>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
