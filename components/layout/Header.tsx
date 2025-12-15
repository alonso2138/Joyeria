import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { brandingConfig } from '../../config/branding';

const Header: React.FC = () => {
  return (
    <motion.header
      className="sticky top-0 z-50 py-1.5 px-4 md:px-8 bg-black bg-opacity-30 backdrop-blur-lg"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-3">
          <img src={brandingConfig.logoLightUrl} alt={`${brandingConfig.brandName} Logo`} className="h-8 md:h-10" />
          <span className="font-serif text-xl md:text-2xl font-bold tracking-wider" style={{ color: brandingConfig.accentColor }}>
            {brandingConfig.brandName}
          </span>
        </Link>
        <div className="flex items-center">
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-widest uppercase">
            <Link to="/" className="hover:text-[var(--primary-color)] transition-colors duration-300">Home</Link>
            <Link to="/catalog" className="hover:text-[var(--primary-color)] transition-colors duration-300">Todas las joyas</Link>
          </nav>
          <Link to="/admin/login" title="Admin Login" className="md:ml-8 text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
