
import React from 'react';
import { Link } from 'react-router-dom';
import { brandingConfig } from '../../config/branding';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black bg-opacity-50 text-gray-300 py-12 px-6 md:px-12">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <h3 className="font-serif text-2xl font-bold text-white">{brandingConfig.brandName}</h3>
          <p className="text-sm">{brandingConfig.brandSubtitle}</p>
        </div>
        <div className="space-y-4">
          <h4 className="text-lg font-semibold tracking-wider uppercase text-white">Contacto</h4>
          <p className="text-sm">{brandingConfig.footer.address}</p>
          <p className="text-sm">Tel: {brandingConfig.footer.phone}</p>
          <p className="text-sm">Email: {brandingConfig.footer.email}</p>
        </div>
        <div className="space-y-4">
          <h4 className="text-lg font-semibold tracking-wider uppercase text-white">Síguenos</h4>
          <div className="flex space-x-4">
            <a href={brandingConfig.footer.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary-color)] transition-colors">Instagram</a>
            <a href={brandingConfig.footer.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary-color)] transition-colors">Facebook</a>
            <a href={brandingConfig.footer.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary-color)] transition-colors">Twitter</a>
          </div>
        </div>
      </div>
      <div className="container mx-auto mt-12 border-t border-gray-700 pt-6 flex justify-between items-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} {brandingConfig.brandName}. Todos los derechos reservados.</p>
        <Link to="/admin/login" title="Admin Login" className="hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
