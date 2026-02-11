
import React, { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { brandingConfig } from '../../config/branding';
import Button from '../../components/ui/Button';

const AdminLoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const from = location.state?.from?.pathname || '/admin';

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const success = await login({ email, password });
        setIsLoading(false);
        if (success) {
            navigate(from, { replace: true });
        } else {
            setError('Credenciales incorrectas. Por favor, inténtelo de nuevo.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <img src={brandingConfig.logoLightUrl} alt="Logo" className="w-96 mx-auto mb-4" />
                </div>

                <form onSubmit={handleSubmit} className="bg-black bg-opacity-30 p-8 rounded-lg shadow-lg">
                    <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                            required
                        />
                    </div>

                    {error && <p className="text-red-400 text-xs italic mb-4">{error}</p>}

                    <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
};

export default AdminLoginPage;
