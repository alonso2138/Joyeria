import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { JewelryItem } from '../types';
import { getFeaturedJewelryItems, getImageUrl } from '../services/api';
import { trackB2BEvent, B2B_EVENTS } from '../services/tracking';
import { useConfig } from '../hooks/useConfig';
import { useTryOn } from '../hooks/useTryOn';

const HomePage: React.FC = () => {
  const { config, isLoading: configLoading } = useConfig();
  const location = useLocation();
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', web: '' });
  const [formStep, setFormStep] = useState(1); // 1: Info, 2: Links, 3: Success
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // UI/ROI States
  const [ticketMedio, setTicketMedio] = useState(250);
  const [margen, setMargen] = useState(30);

  // Intelligent Demo Experimental States
  const [showDemoOverlay, setShowDemoOverlay] = useState(false);
  const [demoState, setDemoState] = useState<'shutter' | 'processing' | 'result'>('shutter');
  const [countdownLocal, setCountdownLocal] = useState<number | null>(null);
  const [sliderPos, setSliderPos] = useState(50);

  const selectedItem = useMemo(() =>
    items.find((it) => it.id === selectedItemId || it._id === selectedItemId) || null
    , [items, selectedItemId]);

  const {
    isProcessing,
    processingPhase,
    resultImage,
    executeCaptureAndAI,
  } = useTryOn({
    selectedItem,
    config,
    onSuccess: () => {
      trackB2BEvent(B2B_EVENTS.INTELLIGENT_DEMO_SUCCESS);
      setDemoState('result');
    }
  });

  // Handle anchor links scroll manually for HashRouter
  useEffect(() => {
    const handleScroll = () => {
      const hash = window.location.hash;
      if (hash.includes('#')) {
        const id = hash.split('#').pop()?.split('?')[0];
        if (id) {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    handleScroll();
    window.addEventListener('hashchange', handleScroll);
    return () => window.removeEventListener('hashchange', handleScroll);
  }, [location.hash]);

  const setCookie = (name: string, value: string, days = 30) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
  };

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  };

  useEffect(() => {
    const savedDemo = getCookie('v_demo_tag');
    const savedName = getCookie('v_demo_name');
    if (savedDemo && savedName) {
      setTag(savedDemo);
      setFormData(prev => ({ ...prev, name: savedName }));
      setFormStep(3);
    }

    const fetchItems = async () => {
      try {
        const data = await getFeaturedJewelryItems('main');
        const valid = Array.isArray(data) ? data.filter((it) => it && it.slug && it.imageUrl) : [];
        setItems(valid);
        if (valid.length > 0) setSelectedItemId(valid[0].id || valid[0]._id || null);
      } catch (err) {
        console.error('Error loading items', err);
      }
    };
    fetchItems();
    trackB2BEvent(B2B_EVENTS.LANDING_VIEW);
  }, []);

  const handleStartSampleDemo = useCallback(() => {
    if (!selectedItem) return;
    setShowDemoOverlay(true);
    setDemoState('shutter');
    setCountdownLocal(3);

    const timer = setInterval(() => {
      setCountdownLocal(prev => {
        if (prev === 1) {
          clearInterval(timer);
          setTimeout(() => {
            setDemoState('processing');
            startAIProcess();
          }, 300);
          return null;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);

    const startAIProcess = async () => {
      trackB2BEvent(B2B_EVENTS.INTELLIGENT_DEMO_START);
      try {
        const response = await fetch('/antes.png');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => executeCaptureAndAI(reader.result as string);
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error("Demo sample error", e);
      }
    };
  }, [selectedItem, executeCaptureAndAI]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLead(true);
    await trackB2BEvent(B2B_EVENTS.CTA_PRIMARY_CLICK, { email: formData.email, name: formData.name }, true);
    setFormStep(2);
    setIsSubmittingLead(false);
  };

  const [tag, setTag] = useState<string | null>(null);

  const handleFinalSubmit = async () => {
    // 1. Create Demo signal in backend
    try {
      const resp = await fetch('/api/trigger/create-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          setTag(data.tag);
          setCookie('v_demo_tag', data.tag);
          setCookie('v_demo_name', formData.name);
        }
      } else {
        const errorText = await resp.text();
        console.error("Backend error creating demo:", errorText);
        // We still proceed to step 3 so the user isn't stuck, 
        // they just won't have a valid tag immediately.
      }
    } catch (err) {
      console.error("Failed to create demo", err);
    }

    // 2. Step 2 Notification
    await trackB2BEvent(B2B_EVENTS.B2B_LINKS_SUBMIT, { email: formData.email, name: formData.name }, true);
    setFormStep(3);
  };

  const roiResult = useMemo(() => {
    const profitPerSale = ticketMedio * (margen / 100);
    const cost = 75;
    const salesToBreakEven = Math.ceil(cost / profitPerSale);
    return { profitPerSale, salesToBreakEven };
  }, [ticketMedio, margen]);

  const getPhaseText = () => {
    switch (processingPhase) {
      case 'capturing': return 'Preparando modelo...';
      case 'detecting': return 'Analizando anatomía...';
      case 'rendering': return 'Ajustando iluminación...';
      case 'finalizing': return 'Finalizando acabado...';
      default: return 'Cargando IA...';
    }
  };

  return (
    <div className="bg-[#050505] text-white selection:bg-[var(--primary-color)] selection:text-black scroll-smooth">

      {/* --- HERO SECTION --- */}
      <section id="home" className="relative h-screen flex items-center justify-center px-4 overflow-hidden pt-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(circle_at_center,_rgba(245,193,76,0.08)_0%,_transparent_70%)] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 p-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-7xl font-serif font-bold leading-[1.1] mb-8"
          >
            Convierte dudas en pedidos con un botón <span className="text-[var(--primary-color)] font-serif italic">"Pruébatelo"</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Tus clientes se ven la pieza puesta en segundos desde su dispositivo. Sin descargar nada. Multiplica por 3 el deseo de compra en tu catálogo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <a href="#/#solicitar-demo" className="w-full md:w-auto">
              <Button variant="primary" className="w-full md:w-auto px-10 py-5 text-base rounded-full shadow-[0_0_30px_rgba(245,193,76,0.2)] border-none">
                Pídeme una demo hoy (con tus piezas)
              </Button>
            </a>
            <Button
              variant="secondary"
              className="w-full md:w-auto px-10 py-5 text-base rounded-full border-white/10 hover:bg-white/5"
              onClick={handleStartSampleDemo}
              disabled={isProcessing}
            >
              Ver ejemplo real en 10s
            </Button>
          </motion.div>
        </div>
      </section>

      {/* --- INTELLIGENT DEMO OVERLAY (MODAL) --- */}
      <AnimatePresence>
        {showDemoOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl"
          >
            <div className="absolute inset-0" onClick={() => setShowDemoOverlay(false)} />

            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-8 right-8 z-[110] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-xl"
              onClick={() => setShowDemoOverlay(false)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-4xl flex flex-col items-center"
            >
              {/* Image Container with Aspect Ratio */}
              <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-[2rem] overflow-hidden border border-white/10 bg-black shadow-2xl">
                {/* --- PHASE 1: SHUTTER & COUNTDOWN --- */}
                {demoState === 'shutter' && (
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <motion.img
                      initial={{ opacity: 0, scale: 1.1, filter: 'blur(40px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      transition={{ duration: 1 }}
                      src="/antes.png"
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                    <div className="relative z-10 text-center">
                      <motion.div
                        key={countdownLocal}
                        initial={{ scale: 2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-9xl font-serif font-bold text-white drop-shadow-2xl italic leading-none"
                      >
                        {countdownLocal}
                      </motion.div>
                      <p className="mt-4 uppercase tracking-[0.4em] text-[var(--primary-color)] text-[8px] font-black font-sans">Escaneando...</p>
                    </div>

                    <AnimatePresence>
                      {countdownLocal === null && (
                        <>
                          <motion.div initial={{ y: '-100%' }} animate={{ y: '0%' }} exit={{ y: '-100%' }} className="absolute top-0 left-0 w-full h-1/2 bg-white z-[40]" transition={{ duration: 0.08 }} />
                          <motion.div initial={{ y: '100%' }} animate={{ y: '0%' }} exit={{ y: '100%' }} className="absolute bottom-0 left-0 w-full h-1/2 bg-white z-[40]" transition={{ duration: 0.08 }} />
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* --- PHASE 2: PROCESSING --- */}
                {demoState === 'processing' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <img src="/antes.png" className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20" />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mb-8">
                        <motion.div
                          className="h-full bg-[var(--primary-color)] shadow-[0_0_15px_rgba(245,193,76,0.8)]"
                          animate={{ width: ['0%', '100%'] }}
                          transition={{ duration: 7 }}
                        />
                      </div>
                      <Spinner size={32} text={getPhaseText()} />
                    </div>
                  </div>
                )}

                {/* --- PHASE 3: RESULT SLIDER --- */}
                {demoState === 'result' && resultImage && (
                  <div className="absolute inset-0 bg-black">
                    <img src={resultImage} alt="Resultado" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                      <img src="/antes.png" alt="Antes" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5 font-sans">Original</span>
                        <span className="px-4 py-1.5 bg-[var(--primary-color)]/20 text-[var(--primary-color)] backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest border border-[var(--primary-color)]/30 font-serif">Puesto con IA</span>
                      </div>
                    </div>
                    <div className="absolute top-0 bottom-0 z-20 w-[1px] bg-white/40 cursor-ew-resize" style={{ left: `${sliderPos}%` }}>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-xl">
                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M8 7l-5 5 5 5M16 17l5-5-5-5" />
                        </svg>
                      </div>
                    </div>
                    <input type="range" min="0" max="100" value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" />
                  </div>
                )}
              </div>

              {/* --- CTA BELOW IMAGE --- */}
              <AnimatePresence>
                {demoState === 'result' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 flex justify-center"
                  >
                    <Button
                      variant="primary"
                      className="rounded-full px-12 py-5 text-base border-none shadow-[0_20px_40px_rgba(0,0,0,0.4)] bg-white text-black hover:bg-white/90 transform hover:scale-105 transition-all"
                      onClick={() => { setShowDemoOverlay(false); window.location.hash = '#/#solicitar-demo'; }}
                    >
                      Quiero verlo con mis piezas
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- BENEFITS SECTION --- */}
      <section id="beneficios" className="min-h-screen flex items-center py-20 px-4 bg-[#080808]">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-24">
            <motion.h2
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-serif font-bold mb-6"
            >
              Todo suma: Web, WhatsApp y Tienda
            </motion.h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto italic">No es solo para tu web. Es el motor que cierra ventas en cualquier canal donde tu cliente tenga dudas.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Para tu Ecommerce", desc: "Botón en cada ficha de producto. Reduce drásticamente el bounce rate y sube la intención de compra cualificada.", icon: "🌐", badge: "Más tráfico cualificado" },
              { title: "Para WhatsApp", desc: "Envía un enlace de prueba cuando te pregunten '¿cómo queda?'. Cierra la venta de inmediato.", icon: "💬", badge: "Cierre de ventas flash" },
              { title: "Para Tienda Física", desc: "QR en el expositor. Tus clientes se prueban 20 piezas en 2 minutos sin abrir el mostrador.", icon: "📍", badge: "Experiencia Premium" }
            ].map((card, i) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className="p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
              >
                <div className="text-4xl mb-8 transform group-hover:scale-110 transition-transform">{card.icon}</div>
                <div className="text-[var(--primary-color)] text-[10px] font-black uppercase tracking-[0.3em] mb-4 font-sans">{card.badge}</div>
                <h3 className="text-xl font-serif font-bold mb-4">{card.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ROI CALCULATOR SECTION --- */}
      <section id="roi" className="min-h-screen flex items-center py-20 px-4 relative">
        <div className="max-w-4xl mx-auto w-full bg-gradient-to-br from-white/5 to-black p-10 md:p-16 rounded-[3rem] border border-white/10 relative overflow-hidden">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">Se paga solo</h2>
            <p className="text-lg text-gray-500 italic">(literalmente)</p>
          </div>

          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <label className="text-[10px] uppercase tracking-[0.4em] text-gray-500 font-black font-sans">Tu Ticket Medio</label>
                <span className="text-2xl font-serif text-[var(--primary-color)] font-bold">{ticketMedio}€</span>
              </div>
              <input
                type="range" min="50" max="3000" step="50" value={ticketMedio}
                onChange={(e) => { setTicketMedio(Number(e.target.value)); trackB2BEvent(B2B_EVENTS.ROI_CALC_INTERACT); }}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[var(--primary-color)]"
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <label className="text-[10px] uppercase tracking-[0.4em] text-gray-500 font-black font-sans">Margen por pieza</label>
                <span className="text-2xl font-serif text-[var(--primary-color)] font-bold">{margen}%</span>
              </div>
              <input
                type="range" min="10" max="80" step="1" value={margen}
                onChange={(e) => { setMargen(Number(e.target.value)); trackB2BEvent(B2B_EVENTS.ROI_CALC_INTERACT); }}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[var(--primary-color)]"
              />
            </div>

            <div className="pt-12 grid md:grid-cols-2 gap-12 border-t border-white/10 font-sans">
              <div>
                <p className="text-gray-500 text-[10px] mb-2 uppercase tracking-[0.3em] font-black">Beneficio por venta</p>
                <p className="text-4xl font-serif font-bold italic">{roiResult.profitPerSale.toFixed(0)}€</p>
              </div>
              <div className="p-8 bg-[var(--primary-color)]/10 rounded-2xl border border-[var(--primary-color)]/20">
                <p className="text-[var(--primary-color)] text-[9px] font-black uppercase mb-4 tracking-[0.4em]">Punto de equilibrio</p>
                <p className="text-xl md:text-2xl font-serif font-bold leading-tight">
                  Solo necesitas <span className="text-[var(--primary-color)] underline decoration-1 underline-offset-4">{roiResult.salesToBreakEven}</span> {roiResult.salesToBreakEven === 1 ? 'venta' : 'ventas'} / mes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="min-h-screen flex items-center py-20 px-4 bg-[#080808]">
        <div className="max-w-4xl mx-auto w-full text-center">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-16 underline decoration-[var(--primary-color)] underline-offset-8">Sin trampas ni límites</h2>

          <div className="relative p-1 bg-gradient-to-br from-white/10 to-transparent rounded-[3rem] inline-block w-full max-w-md">
            <div className="bg-black rounded-[2.9rem] p-12 md:p-16 shadow-2xl">
              <p className="text-[var(--primary-color)] font-black text-[10px] uppercase tracking-[0.4em] mb-6 italic font-sans">Suscripción Probador Virtual</p>
              <div className="flex items-center justify-center gap-3 mb-10">
                <span className="text-6xl md:text-7xl font-serif font-bold">75€</span>
                <span className="text-gray-600 text-lg">/mes</span>
              </div>

              <ul className="text-left space-y-5 mb-12 max-w-[280px] mx-auto text-sm font-sans font-bold uppercase tracking-widest text-gray-300">
                {["Ilimitado en piezas", "Sin límite de vistas", "Soporte incluido", "Garantía 14 días", "Cancela cuando quieras"].map((step, i) => (
                  <li key={i} className="flex items-center gap-4 text-[11px]">
                    <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {step}
                  </li>
                ))}
              </ul>

              <a href="#/#solicitar-demo">
                <Button variant="primary" className="w-full py-5 text-sm rounded-full border-none font-black shadow-xl">
                  Empezar ahora
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* --- LEAD CAPTURE FLOW (FOOTER CTA) --- */}
      <section id="solicitar-demo" className="min-h-screen flex items-center py-20 px-4 bg-[var(--primary-color)] text-black">
        <div className="max-w-4xl mx-auto w-full text-center">
          <AnimatePresence mode="wait">
            {formStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-12">
                <h2 className="text-4xl md:text-6xl font-serif font-bold leading-tight">¿Te montamos una demo hoy mismo?</h2>

                <form onSubmit={handleLeadSubmit} className="grid md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                  <input
                    type="text" placeholder="Nombre" required
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="md:col-span-1 px-8 py-5 rounded-full bg-black/5 border-none placeholder:text-black/30 focus:outline-none focus:bg-white transition-all shadow-xl font-bold font-sans"
                  />
                  <input
                    type="email" placeholder="Email profesional" required
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="md:col-span-2 px-8 py-5 rounded-full bg-black/5 border-none placeholder:text-black/30 focus:outline-none focus:bg-white transition-all shadow-xl font-bold font-sans"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    className="md:col-span-1 bg-black !text-white hover:bg-black/90 rounded-full py-5 text-base border-none shadow-xl font-black uppercase tracking-widest font-sans"
                    disabled={isSubmittingLead}
                  >
                    {isSubmittingLead ? '...' : 'Siguiente'}
                  </Button>
                </form>
              </motion.div>
            )}

            {formStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-12">
                <h2 className="text-4xl md:text-6xl font-serif font-bold">¡Casi listo! Solo falta esto.</h2>
                <p className="text-black/60 text-lg font-bold uppercase tracking-widest font-sans">Péganos aquí los links de las joyas que quieras probar gratis.</p>
                <div className="max-w-2xl mx-auto space-y-6 text-left">
                  <textarea
                    placeholder="Pega links o nombres de tus joyas aquí..."
                    className="w-full h-48 px-8 py-6 rounded-[2rem] bg-black/5 border-none placeholder:text-black/30 focus:outline-none focus:bg-white transition-all shadow-xl text-black font-bold font-sans resize-none"
                    required
                  />
                  <Button onClick={handleFinalSubmit} variant="primary" className="w-full bg-black !text-white py-6 rounded-full text-lg shadow-xl border-none font-black uppercase tracking-widest font-sans">
                    Solicitar mi demo personalizada
                  </Button>
                </div>
              </motion.div>
            )}

            {formStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12 py-10">
                <div className="text-8xl font-serif font-bold italic text-black/10">Hecho.</div>
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-6xl font-serif font-bold">¡Recibido!</h2>
                  <p className="text-black/60 text-xl font-bold max-w-xl mx-auto leading-relaxed font-sans">Te escribiremos pronto para avisarte cuando esté lista tu demo. </p>
                </div>

                <div className="pt-16 flex flex-col items-center gap-6">
                  {/* QR Card */}
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/#/demo/${tag || 'loading'}`)}`}
                      alt="QR Demo"
                      className="w-48 h-48"
                    />
                  </div>

                  {/* Pretty Link Card - Separate White Box */}
                  <div className="w-full max-w-sm bg-white rounded-2xl border border-black/5 p-6 flex flex-col items-center gap-3 shadow-xl">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-black/30 font-black font-sans">Enlace de tu demo</p>
                    <div className="w-full flex items-center justify-between bg-black/5 text-black px-5 py-4 rounded-xl group cursor-pointer hover:bg-black/10 transition-all"
                      onClick={() => {
                        const url = `${window.location.origin}/#/demo/${tag}`;
                        navigator.clipboard.writeText(url);
                        alert("¡Enlace copiado! Ya puedes compartirlo.");
                      }}>
                      <span className="text-sm font-bold font-sans tracking-tight truncate">visualizalo.es/demo/{tag || '...'}</span>
                      <div className="bg-black text-white p-2 rounded-lg group-hover:scale-110 transition-transform shadow-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-4 mt-6">
                    <Button variant="secondary" className="border-black/20 text-black px-12 py-5 rounded-full font-black border-2 uppercase text-[10px] tracking-[0.2em] font-sans hover:bg-black/5" onClick={() => window.location.reload()}>Volver al inicio</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* --- STICKY FOOTER CTA (Mobile) --- */}
      <div className="md:hidden fixed bottom-8 left-10 right-10 z-[50]">
        <a href="#/#solicitar-demo">
          <Button variant="primary" className="w-full py-5 rounded-full shadow-2xl bg-black text-white border-none font-black text-[10px] uppercase tracking-widest">Pide tu demo hoy</Button>
        </a>
      </div>

    </div>
  );
};

export default HomePage;
