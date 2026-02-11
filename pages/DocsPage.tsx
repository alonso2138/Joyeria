import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';

const docsContent = [
    {
        id: 'intro',
        title: 'Introducción',
        content: 'Nuestra plataforma de permite a cualquier e-commerce integrar pruebas en tiempo real con IA en cuestión de minutos.',
    },
    {
        id: 'quickstart',
        title: 'Inicio Rápido',
        content: 'Para empezar, añade nuestro script de carga antes del cierre de la etiqueta `</body>` en tu sitio web.',
        code: `<script src="https://www.visualizalo.es/widget.js"></script>`,
    },
    {
        id: 'trigger',
        title: 'Activación del Probador',
        content: 'Cualquier elemento HTML con el atributo `data-try-on` activará el visualizador. Debes proporcionar la información de la pieza mediante atributos de datos.',
        code: `<button 
  data-try-on 
  data-api-key="TU_API_KEY"
  data-name="Anillo Eternity"
  data-category="Anillo"
  data-image="https://tusitio.com/fotos/anillo-1.jpg"
>
  Probar ahora
</button>`,
    },
    {
        id: 'parameters',
        title: 'Parámetros Disponibles',
        table: [
            { param: 'data-api-key', desc: 'Identificador único de tu organización (obtenido en el panel admin).', req: 'Sí' },
            { param: 'data-image', desc: 'URL absoluta de la imagen del producto. Se recomienda fondo transparente o blanco limpio.', req: 'Sí' },
            { param: 'data-category', desc: 'Categoría de la joya (Anillo, Collar, Reloj, Pulsera). Esto optimiza el modelo de IA.', req: 'Sí' },
            { param: 'data-name', desc: 'Nombre que se mostrará en la cabecera del visualizador.', req: 'No' },
        ]
    },
    {
        id: 'events',
        title: 'Comunicación y Eventos',
        content: 'El visualizador se comunica con tu sitio web mediante `window.postMessage`. Esto te permite realizar acciones personalizadas cuando una prueba tiene éxito.',
        code: `window.addEventListener('message', (event) => {
  if (event.data.type === 'TRYON_SUCCESS') {
    const finalImage = event.data.image; // URL en base64 de la foto final
    console.log('El usuario se ha probado la joya con éxito!');
  }
  
  if (event.data.type === 'WIDGET_CLOSE') {
    console.log('El modal ha sido cerrado.');
  }
});`,
    },
];

const DocsPage: React.FC = () => {
    const [showContactModal, setShowContactModal] = useState(false);

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const offset = 100; // Account for sticky header
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-10 md:py-12">
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10">
                {/* Sidebar Nav */}
                <aside className="lg:col-span-3 hidden lg:block sticky top-24 h-fit">
                    <nav className="space-y-0.5">
                        <p className="text-[9px] uppercase font-bold text-gray-600 mb-3 tracking-widest pl-4">Índice</p>
                        {docsContent.map(section => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                onClick={(e) => scrollToSection(e, section.id)}
                                className="block py-1.5 text-xs text-gray-500 hover:text-[var(--primary-color)] transition-all border-l border-white/5 pl-4 hover:border-[var(--primary-color)]/50 active:text-white"
                            >
                                {section.title}
                            </a>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-9 space-y-10">
                    <header className="space-y-2">
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">Guía de Integración</h1>
                        <p className="text-base text-gray-500 max-w-xl leading-relaxed font-light">
                            Integra el probador virtual en tu e-commerce con un snippet de código
                        </p>
                    </header>

                    {docsContent.map((section) => (
                        <section key={section.id} id={section.id} className="scroll-mt-24 space-y-3">
                            <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                                <span className="text-[var(--primary-color)] font-mono text-[10px] opacity-40">#</span>
                                {section.title}
                            </h2>

                            {section.content && (
                                <p className="text-gray-500 leading-relaxed text-[13px] max-w-2xl">
                                    {section.content}
                                </p>
                            )}

                            {section.code && (
                                <div className="relative group overflow-hidden rounded-lg">
                                    <pre className="bg-black/40 border border-white/5 p-3 overflow-x-auto font-mono text-[11px] text-[var(--primary-color)]/80 selection:bg-[var(--primary-color)]/20">
                                        <code>{section.code}</code>
                                    </pre>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-gray-600 uppercase border border-white/5 font-mono">JS</div>
                                    </div>
                                </div>
                            )}

                            {section.table && (
                                <div className="overflow-hidden rounded-lg border border-white/5 bg-black/10">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                                <th className="px-4 py-2.5 text-[9px] uppercase font-bold text-gray-500 tracking-wider">Atributo</th>
                                                <th className="px-4 py-2.5 text-[9px] uppercase font-bold text-gray-500 tracking-wider">Descripción</th>
                                                <th className="px-4 py-2.5 text-[9px] uppercase font-bold text-gray-500 tracking-wider">Req</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {section.table.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                                    <td className="px-4 py-2.5 text-[11px] font-mono text-[var(--primary-color)]/70">{row.param}</td>
                                                    <td className="px-4 py-2.5 text-[11px] text-gray-500 leading-snug">{row.desc}</td>
                                                    <td className="px-4 py-2.5 text-[10px] text-gray-600 font-medium">{row.req}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    ))}

                    {/* Final Step */}
                    <section className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-1 text-center sm:text-left">
                            <h3 className="text-lg font-serif font-bold text-white">¿Dudas en la integración?</h3>
                            <p className="text-gray-500 text-xs">Contáctanos para soporte técnico especializado o auditoría de integración.</p>
                        </div>
                        <Button variant="outline" className="px-6 py-2 text-xs" onClick={() => setShowContactModal(true)}>
                            Abrir Ticket Soporte
                        </Button>
                    </section>
                </main>
            </div>

            {/* Contact Modal */}
            <AnimatePresence>
                {showContactModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowContactModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-[#0f1018] border border-white/10 rounded-3xl p-8 shadow-2xl"
                        >
                            <button
                                onClick={() => setShowContactModal(false)}
                                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="space-y-6 text-center">
                                <div className="w-16 h-16 bg-[var(--primary-color)]/10 rounded-2xl flex items-center justify-center mx-auto">
                                    <svg className="w-8 h-8 text-[var(--primary-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-serif font-bold text-white">Soporte Técnico</h2>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Habla directamente con nuestro equipo para resolver cualquier duda técnica sobre la integración.
                                    </p>
                                </div>

                                <div className="bg-white/5 rounded-2xl p-6 space-y-4 border border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Contacto Directo</p>
                                        <p className="text-lg text-white font-medium">Alonso Valls</p>
                                    </div>
                                    <div className="h-px bg-white/5 w-12 mx-auto"></div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Email</p>
                                        <a href="mailto:alonso@visualizalo.es" className="text-[var(--primary-color)] hover:underline text-lg">
                                            alonso@visualizalo.es
                                        </a>
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    className="w-full py-4"
                                    onClick={() => window.location.href = 'mailto:alonso@visualizalo.es'}
                                >
                                    Enviar Email Ahora
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DocsPage;
