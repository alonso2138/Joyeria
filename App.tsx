
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { brandingConfig } from './config/branding';
import { captureTrackingIdFromUrl } from './services/tracking';

import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import JewelryDetailPage from './pages/JewelryDetailPage';
import TryOnPage from './pages/TryOnPage';
import CustomizePage from './pages/CustomizePage';
import CustomResultPage from './pages/CustomResultPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminJewelryListPage from './pages/admin/AdminJewelryListPage';
import AdminJewelryEditPage from './pages/admin/AdminJewelryEditPage';
import AdminCustomRequestsPage from './pages/admin/AdminCustomRequestsPage';
import AdminLegacyPanelPage from './pages/admin/AdminLegacyPanelPage';
import { AuthProvider } from './hooks/useAuth';

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
      </div>
    </div>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    captureTrackingIdFromUrl();
    document.documentElement.style.setProperty('--primary-color', brandingConfig.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', brandingConfig.secondaryColor);
    document.documentElement.style.setProperty('--accent-color', brandingConfig.accentColor);
    document.body.style.background = brandingConfig.backgroundGradient;
  }, []);

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/try-on/:slug" element={<TryOnPage />} />
          <Route path="/personalizar" element={<PageLayout><CustomizePage /></PageLayout>} />
          <Route path="/personalizar/resultado" element={<CustomResultPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout><AdminJewelryListPage /></AdminLayout>} />
          <Route path="/admin/jewelry" element={<AdminLayout><AdminJewelryListPage /></AdminLayout>} />
          <Route path="/admin/jewelry/new" element={<AdminLayout><AdminJewelryEditPage /></AdminLayout>} />
          <Route path="/admin/jewelry/edit/:id" element={<AdminLayout><AdminJewelryEditPage /></AdminLayout>} />
          <Route path="/admin/custom-requests" element={<AdminLayout><AdminCustomRequestsPage /></AdminLayout>} />
          <Route path="/admin/legacy-panel" element={<AdminLayout><AdminLegacyPanelPage /></AdminLayout>} />

          <Route path="*" element={
            <PageLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/jewelry/:slug" element={<JewelryDetailPage />} />
                <Route path="/personalizar" element={<CustomizePage />} />
                <Route path="/personalizar/resultado" element={<CustomResultPage />} />
              </Routes>
            </PageLayout>
          }/>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
