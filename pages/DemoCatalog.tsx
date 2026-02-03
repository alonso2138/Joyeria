import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { JewelryItem } from '../types';
import { getJewelryItems, getImageUrl } from '../services/api';
import Spinner from '../components/ui/Spinner';
import { useConfig } from '../hooks/useConfig';

const DemoCatalog: React.FC = () => {
    const { config, isLoading: configLoading } = useConfig();
    const { tag } = useParams<{ tag: string }>();
    const navigate = useNavigate();
    const [items, setItems] = useState<JewelryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchItems = useCallback(async () => {
        if (!tag) return;
        setIsLoading(true);
        try {
            // Usamos el tag como catalogId para aislamiento total
            const results = await getJewelryItems({ catalogId: tag });
            setItems(results);
        } catch (error) {
            console.error('DemoCatalog: Error fetching items:', error);
            setItems([]);
        }
        setIsLoading(false);
    }, [tag]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    if (configLoading) return <div className="h-screen flex items-center justify-center bg-[#08070f]"><Spinner text="Preparando experiencia..." /></div>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col text-[var(--text-color)]"
            style={{ fontFamily: 'var(--font-family)' }}
        >
            {/* Header Estilo Tienda */}
            <header
                className="pt-12 pb-10 px-6 text-center border-b border-white/5 transition-colors duration-500"
                style={{ backgroundColor: 'var(--header-bg)' }}
            >
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {config?.branding?.logoLightUrl && (
                        <div className="mb-4 flex justify-center">
                            <img
                                src={config.branding.logoLightUrl}
                                alt={config.branding.brandName}
                                className="h-20 md:h-24 object-contain"
                            />
                        </div>
                    )}
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold tracking-tight">
                        {config?.uiLabels?.heroTitle || config?.branding?.brandName || 'Catálogo Demo'}
                    </h1>
                    <p className="opacity-70 mt-3 max-w-lg mx-auto text-xs md:text-sm leading-relaxed italic" style={{ color: 'var(--text-color)' }}>
                        {config?.uiLabels?.heroDescription}
                    </p>
                </motion.div>
            </header>

            <div className="flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full py-12 px-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner text="Cargando piezas..." />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500">No hay piezas disponibles</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-12 items-start">
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => navigate(`/demo/${tag}/jewelry/${item.slug}`)}
                                className="group cursor-pointer w-full sm:w-[320px] md:w-[350px]"
                            >
                                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-black border transition-all group-hover:border-[var(--primary-color)]/50" style={{ borderColor: 'var(--card-border-color)' }}>
                                    <img
                                        src={getImageUrl(item.imageUrl)}
                                        alt={item.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

                                    {/* Badge de acción rápida */}
                                    <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                        <div className="text-white text-[10px] font-bold uppercase tracking-widest text-center py-3 rounded-lg shadow-xl" style={{ backgroundColor: 'var(--primary-color)' }}>
                                            Ver Pieza y Probar
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-between items-start">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary-color)' }}>{item.category}</p>
                                        <h3 className="text-lg font-serif group-hover:text-[var(--primary-color)] transition-colors">{item.name}</h3>
                                    </div>
                                    <p className="text-base font-medium" style={{ color: 'var(--price-color)' }}>
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: item.currency || 'EUR' }).format(item.price)}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Minimalista */}
            <footer className="py-12 border-t border-white/5 text-center text-[10px] uppercase tracking-[0.2em] text-gray-600">
                Demo impulsada por Visualizalo®
            </footer>
        </motion.div>
    );
};

export default DemoCatalog;
