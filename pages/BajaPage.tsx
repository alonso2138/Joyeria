import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const BajaPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Procesando tu solicitud...');

    const id = searchParams.get('id');

    useEffect(() => {
        const processUnsubscribe = async () => {
            if (!id) {
                setStatus('error');
                setMessage('No se ha proporcionado un identificador válido.');
                return;
            }

            try {
                const response = await fetch(`https://api.visualizalo.es/api/trigger/baja?id=${id}`);
                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage('Te has dado de baja correctamente. No recibirás más correos de seguimiento.');
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Ha ocurrido un error al procesar la baja.');
                }
            } catch (error) {
                console.error('Error processing unsubscribe:', error);
                setStatus('error');
                setMessage('No se ha podido conectar con el servidor. Inténtalo de nuevo más tarde.');
            }
        };

        processUnsubscribe();
    }, [id]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl text-center"
            >
                <div className="mb-6 flex justify-center">
                    {status === 'loading' && (
                        <div className="w-16 h-16 border-4 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {status === 'success' && (
                        <div className="bg-green-500/20 p-4 rounded-full">
                            <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="bg-red-500/20 p-4 rounded-full">
                            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-white mb-4">
                    {status === 'loading' ? 'Procesando baja' :
                        status === 'success' ? 'Baja confirmada' : 'Error'}
                </h1>

                <p className="text-gray-400 mb-8 leading-relaxed">
                    {message}
                </p>

                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 font-medium"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Volver al inicio
                </Link>
            </motion.div>
        </div>
    );
};

export default BajaPage;
