
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
        `flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${isActive ? 'bg-[var(--primary-color)] text-black' : 'hover:bg-gray-700'
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                        Ir a la Web
                    </NavLink>
                    <NavLink to="/admin/jewelry" className={navLinkClasses}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2V4zm0 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6z" /></svg>
                        Joyas
                    </NavLink>
                    <NavLink to="/admin/campaign" className={navLinkClasses}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                        Campaña
                    </NavLink>
                    <NavLink to="/admin/demos" className={navLinkClasses}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.189A1 1 0 0118 4v10a1 1 0 01-1.396.92l-4.29-2.146a7 7 0 00-4.628 0l-4.29 2.146A1 1 0 012 14V4a1 1 0 011.392-.916l1.7.907L8 2.677V3a1 1 0 011-1zM4 11.594l3.303-1.652a9 9 0 013.394 0L14 11.594V5.004l-3.303 1.651a9 9 0 01-3.394 0L4 5.004v6.59z" clipRule="evenodd" /></svg>
                        Demos
                    </NavLink>
                    <NavLink to="/admin/legacy-panel" className={navLinkClasses}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V7.414A2 2 0 0017.414 6L14 2.586A2 2 0 0012.586 2H4zm9 0.414L16.586 7H13a1 1 0 01-1-1V3.414z" /></svg>
                        Panel Legacy
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
