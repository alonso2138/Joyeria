
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { brandingConfig } from '../../config/branding';
import { useAuth } from '../../hooks/useAuth';

const AdminSidebar: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    
    const navLinkClasses = ({ isActive }: { isActive: boolean }) => 
      `flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
        isActive ? 'bg-[var(--primary-color)] text-black' : 'hover:bg-gray-700'
      }`;

    return (
        <aside className="w-64 bg-black flex-shrink-0 p-4 flex flex-col justify-between">
            <div>
                <div className="flex items-center space-x-3 mb-10 px-2">
                    <img src={brandingConfig.logoLightUrl} alt={`${brandingConfig.brandName} Logo`} className="h-8" />
                    <span className="font-serif text-xl font-bold tracking-wider text-white">
                        {brandingConfig.brandName}
                    </span>
                </div>

                <nav className="space-y-2">
                    <NavLink to="/" className={navLinkClasses}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
                        Ir a la Web
                    </NavLink>
                    <NavLink to="/admin/jewelry" className={navLinkClasses}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2V4zm0 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6z"/></svg>
                        Joyas
                    </NavLink>
                    <NavLink to="/admin/custom-requests" className={navLinkClasses}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v7a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2V5a2 2 0 00-2-2H4z" /></svg>
                        Encargos personalizados
                    </NavLink>
                     <NavLink to="/admin/stats" className={navLinkClasses} onClick={(e)=> e.preventDefault()} style={{cursor: 'not-allowed', opacity: 0.5}}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                        Estadísticas (Próximamente)
                    </NavLink>
                </nav>
            </div>

            <div>
                 <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 text-red-400 hover:bg-red-900 hover:text-white rounded-md transition-colors duration-200">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
