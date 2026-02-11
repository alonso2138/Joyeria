import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPage: React.FC = () => {
    return (
        <div className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-3xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-3xl shadow-2xl"
                >
                    <h1 className="text-2xl md:text-3xl font-serif mb-6 text-white">Política de Privacidad</h1>

                    <div className="space-y-5 text-gray-400 text-sm leading-relaxed">
                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">1. Introducción</h2>
                            <p>
                                En Visualizalo.es (en adelante, "nosotros"), nos tomamos muy en serio la privacidad de sus datos. Esta política explica cómo recopilamos, usamos y protegemos su información personal al utilizar nuestro sitio web y nuestro probador virtual.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">2. Datos que recopilamos</h2>
                            <p>Podemos recopilar los siguientes tipos de información:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Información de contacto:</strong> Nombre y correo electrónico proporcionados al solicitar citas o información.</li>
                                <li><strong>Imágenes de usuario:</strong> Fotos capturadas a través del Probador Virtual para el procesamiento de IA.</li>
                                <li><strong>Datos de uso:</strong> Información sobre cómo interactúa con nuestro sitio, recolectada a través de identificadores de seguimiento.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">3. Finalidad del tratamiento</h2>
                            <p>Utilizamos sus datos para:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Proporcionar la experiencia de probador virtual mediante Inteligencia Artificial.</li>
                                <li>Gestionar solicitudes de contacto y reuniones.</li>
                                <li>Analizar y mejorar la experiencia de usuario en nuestro catálogo.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">4. Procesamiento de IA</h2>
                            <p>
                                Para la funcionalidad del probador virtual, sus imágenes son procesadas mediante servicios de Inteligencia Artificial. Estas imágenes se utilizan únicamente para generar el resultado visual solicitado por usted.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">5. Sus derechos</h2>
                            <p>
                                Usted tiene derecho a acceder, rectificar, suprimir o limitar el tratamiento de sus datos personales. Para ejercer estos derechos, puede ponerse en contacto con nosotros a través de los canales proporcionados en el Aviso Legal.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">6. Conservación de datos</h2>
                            <p>
                                Los datos se conservarán únicamente durante el tiempo necesario para cumplir con las finalidades para las que fueron recogidos o por imperativo legal.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPage;
