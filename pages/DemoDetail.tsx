import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { JewelryItem } from '../types';
import { getJewelryBySlug, getImageUrl } from '../services/api';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { useConfig } from '../hooks/useConfig';

const DemoDetail: React.FC = () => {
    const { config, isLoading: configLoading } = useConfig();
    const { tag, slug } = useParams<{ tag: string; slug: string }>();
    const navigate = useNavigate();
    const [item, setItem] = useState<JewelryItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchItem = async () => {
            if (slug) {
                setIsLoading(true);
                const result = await getJewelryBySlug(slug);
                if (result) {
                    setItem(result);
                }
                setIsLoading(false);
            }
        };
        fetchItem();
    }, [slug]);

    const handleTryOn = () => {
        if (!item) return;
        // Navegamos al flujo de try-on pero manteniendo el contexto de la demo
        navigate(`/demo/${tag}/try-on/${item.slug}`);
    };

    if (isLoading || configLoading) return <div className="h-screen flex items-center justify-center bg-[#08070f]"><Spinner text="Preparando pieza..." /></div>;
    if (!item) return <div className="h-screen flex items-center justify-center font-serif text-2xl">Producto no encontrado.</div>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen pt-16 pb-10 px-6"
            style={{ fontFamily: 'var(--font-family)' }}
        >
            <div className="max-w-6xl mx-auto">
                {/* Migas de pan */}
                <nav className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500">
                    <button onClick={() => navigate(`/demo/${tag}`)} className="hover:opacity-80 transition-colors" style={{ color: 'var(--text-color)' }}>Volver a la Tienda</button>
                    <span>/</span>
                    <span className="text-[var(--primary-color)]">{item.category}</span>
                    <span>/</span>
                    <span style={{ color: 'var(--text-color)' }}>{item.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                    {/* Imagen de Producto Estilo E-commerce */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square rounded-3xl overflow-hidden bg-black shadow-2xl"
                        style={{ border: '1px solid var(--card-border-color)' }}
                    >
                        <img
                            src={getImageUrl(item.imageUrl)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay de Try-On disponible */}
                        <div className="absolute top-6 right-6">
                            <div className="bg-black/80 backdrop-blur-md border border-[var(--primary-color)]/30 rounded-full px-4 py-2 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-pulse"></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Probador Virtual Disponible</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Información y Compra */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col h-full"
                    >
                        <div className="mb-6">
                            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3" style={{ color: 'var(--text-color)' }}>{item.name}</h1>
                            <p className="text-2xl font-light" style={{ color: 'var(--price-color)' }}>
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: item.currency || 'EUR' }).format(item.price)}
                            </p>
                        </div>

                        <div className="space-y-4 mb-10">
                            <div className="h-px bg-white/10 w-full"></div>
                            <div>
                                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3 opacity-60" style={{ color: 'var(--secondary-color)' }}>Descripción</h3>
                                <p className="text-sm md:text-base leading-relaxed opacity-80" style={{ color: 'var(--secondary-color)' }}>
                                    {item.description}
                                </p>
                            </div>
                            <div className="h-px bg-white/10 w-full"></div>
                        </div>

                        {/* Acciones Destacadas */}
                        <div className="mt-auto space-y-3">
                            <button
                                onClick={handleTryOn}
                                className="w-full py-4 rounded-2xl text-white font-bold uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                                style={{ backgroundColor: 'var(--primary-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                                {config?.uiLabels?.ctaText || config?.uiLabels?.ctaTryOn || 'Abrir Probador Virtual'}
                            </button>

                            <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                                Añadir al Carrito
                            </button>
                        </div>

                        <p className="mt-8 text-center text-xs text-gray-500 italic">
                            "Pruébatelo ahora mismo desde tu móvil usando realidad aumentada."
                        </p>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default DemoDetail;
