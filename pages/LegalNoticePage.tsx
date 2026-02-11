import React from 'react';
import { motion } from 'framer-motion';

const LegalNoticePage: React.FC = () => {
    return (
        <div className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-3xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-3xl shadow-2xl"
                >
                    <h1 className="text-2xl md:text-3xl font-serif mb-6 text-white">Aviso Legal</h1>

                    <div className="space-y-5 text-gray-400 text-sm leading-relaxed">
                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">Información Titular</h2>
                            <p>
                                En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico, se exponen los siguientes datos identificativos del titular:
                            </p>
                            <ul className="mt-4 space-y-2">
                                <li><strong>Titular:</strong>Visualizalo.es</li>
                                <li><strong>CIF/NIF:</strong>48786605V</li>
                                <li><strong>Domicilio Social:</strong>Avd Naranjos Num 16, Valencia</li>
                                <li><strong>Email:</strong>alonso@visualizalo.es</li>
                                <li><strong>Teléfono:</strong>+34 639 440 460</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">Condiciones de Acceso</h2>
                            <p>
                                El acceso a este portal es gratuito y atribuye la condición de USUARIO, que acepta, desde dicho acceso y/u uso, las Condiciones Generales de Uso aquí reflejadas.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">Propiedad Industrial e Intelectual</h2>
                            <p>
                                El diseño del portal y sus códigos fuente, así como los logos, marcas y demás signos distintivos que aparecen en el mismo pertenecen a su titular y están protegidos por los correspondientes derechos de propiedad intelectual e industrial.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">Responsabilidad de los Contenidos</h2>
                            <p>
                                El titular no se hace responsable de la legalidad de otros sitios web de terceros desde los que pueda accederse al portal. El titular tampoco responde por la legalidad de otros sitios web de terceros, que pudieran estar vinculados o enlazados desde este portal.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-serif text-white mb-3">Ley Aplicable</h2>
                            <p>
                                La ley aplicable en caso de disputa o conflicto de interpretación de los términos que conforman este aviso legal, así como cualquier cuestión relacionada con los servicios del presente portal, será la ley española.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LegalNoticePage;
