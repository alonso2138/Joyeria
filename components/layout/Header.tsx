import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useConfig } from '../../hooks/useConfig';

const Header: React.FC = () => {
  const { config } = useConfig();
  const location = useLocation();
  const brandName = config?.branding?.brandName;
  const logoUrl = config?.branding?.logoMainUrl || "/logo.png";

  // Check if we are in a demo route
  const isDemo = location.pathname.startsWith('/demo/');

  // Extract demo tag if present to redirect logo to demo root
  const demoTag = isDemo ? location.pathname.split('/')[2] : null;
  const logoLink = isDemo && demoTag ? `/demo/${demoTag}` : '/';

  return (
    <motion.header
      className="sticky top-0 z-50 py-2 px-3 md:px-6 bg-black bg-opacity-30 backdrop-blur-lg"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link to={logoLink} className="flex items-center space-x-1.5 md:space-x-2">
          <img src={logoUrl} alt={`${brandName} Logo`} className="h-12 md:h-12" />
          <span className="font-serif text-base md:text-lg font-bold tracking-wide md:tracking-wider" style={{ color: config?.branding?.accentColor || 'white' }}>
            {brandName}
          </span>
        </Link>
        <div className="flex items-center">
          {!isDemo && (
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 text-[10px] md:text-[11px] font-bold tracking-[0.15em] md:tracking-[0.2em] uppercase">
              <Link to="/" className="hover:text-[var(--primary-color)] transition-colors duration-300">Home</Link>
              <Link to="/catalog" className="hover:text-[var(--primary-color)] transition-colors duration-300">Colección</Link>
            </nav>
          )}
          {!isDemo && (
            <Link to="/admin/login" title="Admin Login" className="md:ml-8 text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
