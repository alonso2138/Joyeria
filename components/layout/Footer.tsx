import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black bg-opacity-50 text-gray-300 py-3 px-4 md:px-8">
      <div className="container mx-auto text-center space-y-1.5">
        <p className="text-sm">Página de ejemplo para mostrar como un cliente puede ver una pieza antes de comprarla.</p>
        <p className="text-sm text-gray-400">La versión final se personaliza con la marca de cada empresa.</p>
      </div>
    </footer>
  );
};

export default Footer;
