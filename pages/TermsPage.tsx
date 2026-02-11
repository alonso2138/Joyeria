import React from 'react';
import { motion } from 'framer-motion';

const TermsPage: React.FC = () => {
    return (
        <div className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-3xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-3xl shadow-2xl"
                >
                    <h1 className="text-2xl md:text-3xl font-serif mb-6 text-white">Términos del Servicio</h1>

                    <div className="space-y-5 text-gray-400 text-sm leading-relaxed">
                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">1. Aceptación de los términos</h2>
                            <p>
                                Al acceder y utilizar este sitio web, usted acepta estar sujeto a estos Términos del Servicio y a todas las leyes y reglamentos aplicables.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">2. Uso del Probador Virtual</h2>
                            <p>
                                La función de Probador Virtual es una herramienta tecnológica basada en IA para visualización orientativa.
                                Los resultados generados son representaciones digitales y pueden no coincidir exactamente con la apariencia del producto físico real.
                            </p>
                            <p className="mt-2 text-sm italic">
                                Nota: No se recomienda basar decisiones de compra críticas únicamente en la representación digital del probador.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">3. Propiedad Intelectual</h2>
                            <p>
                                Todo el contenido, diseños, logotipos y productos que aparecen en este sitio son propiedad de la joyería o de sus respectivos licenciantes y están protegidos por las leyes de propiedad intelectual.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">4. Restricciones de uso</h2>
                            <p>Usted se compromete a no:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Utilizar el sitio para fines ilegales.</li>
                                <li>Intentar vulnerar la seguridad de la plataforma.</li>
                                <li>Hacer un uso abusivo de las herramientas de IA integradas.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">5. Limitación de Responsabilidad</h2>
                            <p>
                                No nos hacemos responsables de cualquier daño directo o indirecto resultante del uso o la imposibilidad de uso de las herramientas de este sitio web.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">6. Modificaciones</h2>
                            <p>
                                Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado del sitio tras dichos cambios constituirá su aceptación de los nuevos términos.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsPage;
