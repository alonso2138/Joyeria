import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import { JewelryItem } from '../types';
import { getFeaturedJewelryItems } from '../services/api';
import JewelryCard from '../components/catalog/JewelryCard';

const HomePage: React.FC = () => {
    const [featuredItems, setFeaturedItems] = useState<JewelryItem[]>([]);
    const [isContactOpen, setIsContactOpen] = useState(false);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const items = await getFeaturedJewelryItems();
                const validItems = Array.isArray(items) ? items.filter(item =>
                    item && typeof item === 'object' && item.name && item.slug
                ) : [];
                setFeaturedItems(validItems);
            } catch (error) {
                console.error('Error fetching featured items:', error);
                setFeaturedItems([]);
            }
        };
        fetchItems();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Hero Section */}
            <section className="min-h-[80vh] flex items-center justify-center text-center relative overflow-hidden px-4">
                <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
                <div className="z-20 relative max-w-4xl mx-auto space-y-6">
                    <motion.h1
                        className="text-5xl md:text-6xl font-serif font-bold"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        Joyería con probador virtual en tiempo real
                    </motion.h1>
                    <motion.p
                        className="text-lg md:text-xl mt-2 max-w-3xl mx-auto text-gray-300"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        Deja que tus clientes vean la pieza en su piel antes de comprar y mejora tu conversión.
                    </motion.p>
                    <motion.div
                        className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <Link to="/catalog"><Button variant="primary">Ver colección</Button></Link>
                        <Link to="/catalog"><Button variant="secondary">Probar ahora</Button></Link>
                        <Button variant="secondary" as="button" onClick={() => setIsContactOpen(true)}>Contactar</Button>
                    </motion.div>
                </div>
            </section>

            <section className="py-12 px-6 bg-black bg-opacity-30">
                <div className="container mx-auto">
                    <h2 className="text-3xl font-serif text-center mb-8">Cómo funciona</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: 'Elige la pieza', desc: 'Explora la colección y selecciona el modelo que quieres probar.' },
                            { title: 'Sube tu foto', desc: 'Coloca la joya automáticamente sobre tu mano, cuello u oreja en segundos.' },
                            { title: 'Guarda o comparte', desc: 'Descarga la imagen o envíala por WhatsApp, email o redes.' },
                        ].map((step, index) => (
                            <div key={index} className="p-6 bg-gray-900 bg-opacity-60 rounded-lg border border-gray-800">
                                <div className="text-[var(--primary-color)] text-2xl font-bold mb-2">{index + 1}</div>
                                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                                <p className="text-gray-300">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-12 px-4">
                <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { title: 'Menos devoluciones', desc: 'Los clientes deciden con seguridad antes de comprar.' },
                        { title: 'Más conversiones', desc: 'Ver la joya puesta elimina dudas y acelera la compra.' },
                        { title: 'Mayor ticket medio', desc: 'Más confianza para escoger piezas superiores.' },
                        { title: 'Experiencia premium online', desc: 'Probador realista en cualquier dispositivo.' },
                        { title: 'Funciona en móvil, tablet y ordenador', desc: 'Optimizado para sesiones rápidas y fluidas.' },
                    ].map((item, index) => (
                        <div key={index} className="p-4 bg-gray-900 bg-opacity-60 rounded-lg border border-gray-800 text-center">
                            <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                            <p className="text-gray-300 text-sm leading-snug">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="py-16 px-6 bg-black bg-opacity-40">
                <div className="container mx-auto max-w-5xl space-y-8">
                    <div className="text-center space-y-3">
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Para joyerías</p>
                        <h2 className="text-3xl font-serif">Convierte tu web en una máquina de ventas</h2>
                        <p className="text-gray-300">Integra el probador virtual en tu web y deja que tus clientes se prueben tus joyas sin ir a tienda. Si no tienes web, te la regalamos con la herramienta.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { title: 'Más ventas y menos dudas', desc: 'Los clientes se prueban la joya al instante y compran con seguridad.' },
                            { title: 'Implementación guiada', desc: 'La instalamos en tu web actual o te creamos una nueva sin coste.' },
                            { title: 'Control total', desc: 'Catálogo digital, probador con IA y panel para enviar resultados al cliente.' },
                        ].map((item, index) => (
                            <div key={index} className="p-5 bg-gray-900 bg-opacity-60 rounded-lg border border-gray-800">
                                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 bg-gray-900 bg-opacity-60 rounded-lg border border-gray-800 text-center space-y-3">
                            <div className="text-sm uppercase tracking-[0.2em] text-gray-400">Prueba ahora</div>
                            <p className="text-gray-200 text-sm">Comprueba el probador en segundos antes de decidir.</p>
                            <Link to="/catalog"><Button variant="secondary" as="button">Probar en 30 segundos</Button></Link>
                        </div>
                        <div className="p-5 bg-gray-900 bg-opacity-60 rounded-lg border border-gray-800 space-y-3">
                            <div className="text-sm uppercase tracking-[0.2em] text-gray-400 text-center">Lo que obtienes</div>
                            <div className="grid grid-cols-1 gap-2 text-sm text-gray-200">
                                {['Catálogo digital listo', 'Probador con IA', 'Panel de control', 'Envío automático al cliente', 'Instalación en tu web'].map(item => (
                                    <div key={item} className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-[var(--primary-color)]"></span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-5 bg-gray-900 bg-opacity-60 rounded-lg border border-gray-800 text-center space-y-3">
                            <div className="text-sm uppercase tracking-[0.2em] text-gray-400">Listo para tu web</div>
                            <p className="text-gray-200 text-sm">Hablemos para instalarlo en tu sitio y empezar a vender ya.</p>
                            <Button variant="primary" as="button" onClick={() => setIsContactOpen(true)}>Contactar para instalar</Button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 px-6 bg-black bg-opacity-50">
                <div className="container mx-auto max-w-3xl text-center space-y-4">
                    <h2 className="text-3xl font-serif">Empieza a usar el probador virtual hoy</h2>
                    <p className="text-gray-300">Aumenta ventas sin abrir nuevas tiendas.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/catalog"><Button variant="primary">Probar gratis</Button></Link>
                        <Link to="/catalog"><Button variant="secondary">Ver colección</Button></Link>
                        <Button variant="secondary" as="button" onClick={() => setIsContactOpen(true)}>Contactar</Button>
                    </div>
                </div>
            </section>

            {/* Featured Collection Section */}
            <section className="py-20 px-6">
                <div className="container mx-auto">
                    <h2 className="text-4xl font-serif text-center mb-12">Colección Destacada</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {featuredItems.map((item, index) => {
                            if (!item || typeof item !== 'object') return null;
                            return (
                                <JewelryCard key={`featured-${item.id || item._id || index}-${item.slug || index}`} item={item} index={index}/>
                            );
                        })}
                    </div>
                </div>
            </section>

            {isContactOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold">Contacta conmigo</h3>
                            <button onClick={() => setIsContactOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                        </div>
                        <p className="text-gray-300 text-sm">Elige el canal que prefieras y te responderé lo antes posible.</p>
                        <div className="space-y-3">
                            <a className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-[var(--primary-color)] hover:bg-gray-800 transition" href="tel:+34639440460">
                                <span className="font-semibold">Teléfono</span>
                                <span className="text-gray-300">+34 639 440 460</span>
                            </a>
                            <a className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-[var(--primary-color)] hover:bg-gray-800 transition" href="https://wa.me/34639440460" target="_blank" rel="noreferrer">
                                <span className="font-semibold">WhatsApp</span>
                                <span className="text-gray-300">+34 639 440 460</span>
                            </a>
                            <a className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-[var(--primary-color)] hover:bg-gray-800 transition" href="mailto:alonso.valls@icloud.com">
                                <span className="font-semibold">Email</span>
                                <span className="text-gray-300">alonso.valls@icloud.com</span>
                            </a>
                        </div>
                        <div className="flex justify-end">
                            <Button variant="secondary" as="button" onClick={() => setIsContactOpen(false)}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default HomePage;
