import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 py-6 border-t border-white/5 bg-black/20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-xl font-serif text-white tracking-widest mb-2 uppercase"></span>
            <p className="text-gray-500 text-[10px] uppercase tracking-wider">Visualizalo.es © - {currentYear} Todos los derechos reservados.</p>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            <Link to="/legal-notice" className="text-gray-500 hover:text-white text-[11px] transition-colors decoration-[var(--primary-color)] hover:underline underline-offset-4">
              Aviso Legal
            </Link>
            <Link to="/privacy" className="text-gray-500 hover:text-white text-[11px] transition-colors decoration-[var(--primary-color)] hover:underline underline-offset-4">
              Privacidad
            </Link>
            <Link to="/terms" className="text-gray-500 hover:text-white text-[11px] transition-colors decoration-[var(--primary-color)] hover:underline underline-offset-4">
              Términos
            </Link>
            <Link to="/cookies" className="text-gray-500 hover:text-white text-[11px] transition-colors decoration-[var(--primary-color)] hover:underline underline-offset-4">
              Cookies
            </Link>
            <Link to="/docs" className="text-[var(--primary-color)] hover:text-white text-[11px] font-bold transition-colors decoration-[var(--primary-color)] hover:underline underline-offset-4">
              Desarrolladores
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

