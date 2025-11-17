
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { brandingConfig } from './config/branding';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import JewelryDetailPage from './pages/JewelryDetailPage';
import TryOnPage from './pages/TryOnPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminJewelryListPage from './pages/admin/AdminJewelryListPage';
import AdminJewelryEditPage from './pages/admin/AdminJewelryEditPage';
import { AuthProvider } from './hooks/useAuth';

const PageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Header />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <div key={location.pathname}>{children}</div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  useEffect(() => {
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
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout><AdminJewelryListPage /></AdminLayout>} />
          <Route path="/admin/jewelry" element={<AdminLayout><AdminJewelryListPage /></AdminLayout>} />
          <Route path="/admin/jewelry/new" element={<AdminLayout><AdminJewelryEditPage /></AdminLayout>} />
          <Route path="/admin/jewelry/edit/:id" element={<AdminLayout><AdminJewelryEditPage /></AdminLayout>} />

          <Route path="*" element={
            <PageLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/jewelry/:slug" element={<JewelryDetailPage />} />
              </Routes>
            </PageLayout>
          }/>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
