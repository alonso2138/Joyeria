import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const CookieBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('user_tracking_consent');
        if (!consent) {
            // Small delay to make it feel more organic
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('user_tracking_consent', 'accepted');
        setIsVisible(false);
        // Reload to trigger tracking if needed, or simply let the next action trigger it
        window.location.reload();
    };

    const handleDecline = () => {
        localStorage.setItem('user_tracking_consent', 'declined');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-[100]"
                >
                    <div className="bg-[#12131a]/95 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--primary-color)]/10 flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--primary-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-white font-serif text-lg mb-2">Tu privacidad nos importa</h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                    Utilizamos identificadores propios para mejorar tu experiencia y analizar el uso de nuestro probador virtual.
                                    Consulta nuestra <Link to="/cookies" className="text-[var(--primary-color)] hover:underline">Política de Cookies</Link>.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleAccept}
                                        className="flex-grow py-3 px-4 bg-white text-black text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Aceptar todo
                                    </button>
                                    <button
                                        onClick={handleDecline}
                                        className="py-3 px-4 bg-white/5 text-white text-sm font-medium rounded-xl hover:bg-white/10 transition-colors border border-white/5"
                                    >
                                        Solo necesarias
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieBanner;
