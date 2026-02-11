import React from 'react';
import { motion } from 'framer-motion';

const CookiePolicyPage: React.FC = () => {
    return (
        <div className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-3xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-3xl shadow-2xl"
                >
                    <h1 className="text-2xl md:text-3xl font-serif mb-6 text-white">Política de Cookies</h1>

                    <div className="space-y-5 text-gray-400 text-sm leading-relaxed">
                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">¿Qué tecnologías utilizamos?</h2>
                            <p>
                                Este sitio web utiliza tecnologías de almacenamiento local (<code>localStorage</code>) y mecanismos de seguimiento para mejorar la experiencia del usuario y analizar el uso de nuestras herramientas, como el probador virtual.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">Tipos de identificadores</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xl font-medium text-white">1. Técnicas y Necesarias</h3>
                                    <p>Son aquellas que permiten al usuario la navegación a través de la página web y la utilización de las diferentes opciones o servicios que en ella existen.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium text-white">2. De Análisis y Seguimiento</h3>
                                    <p>Utilizamos un identificador único (ID de seguimiento) almacenado en su navegador para saber qué piezas del catálogo ha visitado y cómo interactúa con el probador. Esto nos ayuda a optimizar nuestra colección y el rendimiento del sitio.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">Consentimiento</h2>
                            <p>
                                Al utilizar nuestro sitio, le mostraremos un banner para que pueda aceptar o rechazar el uso de tecnologías de seguimiento. No activaremos el seguimiento de análisis hasta que tengamos su consentimiento expreso.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">¿Cómo desactivarlas?</h2>
                            <p>
                                Además de nuestras opciones de consentimiento, puede controlar y eliminar las cookies y el almacenamiento local a través de la configuración de su navegador:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Google Chrome</li>
                                <li>Mozilla Firefox</li>
                                <li>Safari</li>
                                <li>Microsoft Edge</li>
                            </ul>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CookiePolicyPage;
