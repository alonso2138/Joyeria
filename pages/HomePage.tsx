import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { JewelryItem } from '../types';
import { getFeaturedJewelryItems, getImageUrl, logWidgetEvent } from '../services/api';
import { trackIfAvailable, trackMeeting, trackStepCompleted } from '../services/tracking';
import { useConfig } from '../hooks/useConfig';
import { useTryOn } from '../hooks/useTryOn';

const HomePage: React.FC = () => {
  const { config, isLoading: configLoading } = useConfig();
  const totalSteps = 6;
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [formSent, setFormSent] = useState(false);
  const [selectionError, setSelectionError] = useState(false);
  const [useUploadFlow, setUseUploadFlow] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);
  const [compareDragging, setCompareDragging] = useState(false);
  const [compareAnimating, setCompareAnimating] = useState(false);

  const trackedStepsRef = useRef({ started: false, finished: false });
  const trackedStepNumbersRef = useRef<Set<number>>(new Set());
  const prevStepRef = useRef(step);
  const compareIntroTimeoutRef = useRef<number | null>(null);
  const compareStopTimeoutRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const progress = (step / totalSteps) * 100;
  const selectedItem = items.find((it) => it.id === selectedItemId || it._id === selectedItemId) || null;

  const {
    cameraStatus,
    cameraError,
    cameraReady,
    isProcessing,
    countdown,
    previewImage,
    resultImage,
    tryOnError,
    videoRef,
    canvasRef,
    itemMetadata,
    facingMode,
    toggleCamera,
    startCamera,
    stopCamera,
    triggerCapture,
    executeCaptureAndAI,
    reset,
    setPreviewImage
  } = useTryOn({
    selectedItem,
    config,
    onSuccess: () => {
      // If we have a linked API key (demo mode), log the usage to the backend
      if (config?.linkedApiKey) {
        logWidgetEvent(config.linkedApiKey, 'TRYON_SUCCESS', { itemId: selectedItemId || 'demo' });
      }

      if (!trackedStepsRef.current.finished) {
        trackIfAvailable('try-on');
        trackedStepsRef.current.finished = true;
      }
      // The transition to step 5 is handled by an effect or after a delay
      setTimeout(() => setStep(5), 1500);
    },
    isMirrorMode: true
  });

  const compareOverlayTransition = compareDragging
    ? 'none'
    : compareAnimating
      ? 'clip-path 1.1s ease'
      : 'clip-path 0.2s ease';
  const compareHandleTransition = compareDragging
    ? 'none'
    : compareAnimating
      ? 'left 1.1s ease'
      : 'left 0.2s ease';
  const isIntroStep = step === 1;
  const isCompactStep = step === 1 || step === 2 || step === 4;
  const cameraFrameClass = "w-full max-w-[70vh] aspect-video mx-auto";

  useEffect(() => {
    const fetchItems = async () => {
      setItemsLoading(true);
      setItemsError(null);
      try {
        const data = await getFeaturedJewelryItems('main');
        const valid = Array.isArray(data) ? data.filter((it) => it && it.slug && it.imageUrl) : [];
        setItems(valid);
        if (!selectedItemId && valid.length > 0) {
          setSelectedItemId(valid[0].id || valid[0]._id || null);
        }
      } catch (err) {
        console.error('Error loading items', err);
        setItemsError('No pudimos cargar tus joyas destacadas ahora mismo.');
      } finally {
        setItemsLoading(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    if (step === 4 && !useUploadFlow && !isProcessing && !resultImage) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [step, useUploadFlow, isProcessing, resultImage, startCamera, stopCamera]);

  useEffect(() => {
    if (step !== 4) {
      setUseUploadFlow(false);
    }
  }, [step]);

  useEffect(() => {
    if (step >= 2 && !trackedStepsRef.current.started) {
      trackIfAvailable('try-on-started');
      trackedStepsRef.current.started = true;
    }
  }, [step]);

  useEffect(() => {
    const prevStep = prevStepRef.current;
    if (step > prevStep) {
      const completedStep = prevStep;
      if (completedStep >= 1 && !trackedStepNumbersRef.current.has(completedStep)) {
        trackStepCompleted(completedStep);
        trackedStepNumbersRef.current.add(completedStep);
      }
    }
    prevStepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (compareIntroTimeoutRef.current) {
      clearTimeout(compareIntroTimeoutRef.current);
      compareIntroTimeoutRef.current = null;
    }
    if (compareStopTimeoutRef.current) {
      clearTimeout(compareStopTimeoutRef.current);
      compareStopTimeoutRef.current = null;
    }
    if (step !== 1) {
      setCompareAnimating(false);
      setCompareDragging(false);
      return;
    }
    setCompareAnimating(false);
    setCompareDragging(true);
    setComparePosition(20);
    compareIntroTimeoutRef.current = window.setTimeout(() => {
      setCompareDragging(false);
      setCompareAnimating(true);
      setComparePosition(50);
    }, 150);
    compareStopTimeoutRef.current = window.setTimeout(() => {
      setCompareAnimating(false);
    }, 1250);
    return () => {
      if (compareIntroTimeoutRef.current) {
        clearTimeout(compareIntroTimeoutRef.current);
        compareIntroTimeoutRef.current = null;
      }
      if (compareStopTimeoutRef.current) {
        clearTimeout(compareStopTimeoutRef.current);
        compareStopTimeoutRef.current = null;
      }
    };
  }, [step]);

  const goBack = () => setStep((prev) => Math.max(1, prev - 1));
  const goNext = () => setStep((prev) => Math.min(totalSteps, prev + 1));

  const handlePieceSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    setSelectionError(false);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUseUploadFlow(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setPreviewImage(reader.result);
        setStep(4);
        setTimeout(() => {
          executeCaptureAndAI(reader.result as string);
        }, 500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseResult = () => setStep(6);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    trackMeeting(formData.name, formData.email);
    if (!trackedStepNumbersRef.current.has(6)) {
      trackStepCompleted(6);
      trackedStepNumbersRef.current.add(6);
    }
    setFormSent(true);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="grid md:grid-cols-5 gap-8 items-start">
            <div className="md:col-span-3 space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Bienvenida</p>
              <h1 className="text-[clamp(1.8rem,4vh,2.5rem)] font-serif font-bold leading-tight">
                {config?.uiLabels?.heroTitle || 'Convierte visitas en clientes mostrando joyas en tiempo real.'}
              </h1>
              <p className="text-sm md:text-base text-gray-300 max-w-xl">
                {config?.uiLabels?.heroSubtitle || 'Las joyerías que lo usan reducen dudas y cierran más ventas online y en tienda.'}
              </p>
              <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest">
                Probado con clientes reales
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" className="px-6 py-2 text-xs md:text-sm" onClick={goNext}>
                  Pruébalo en 30 segundos sin registro
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="space-y-2">
                <div className="relative aspect-square w-full max-w-[20rem] md:max-w-[22rem] lg:max-w-sm mx-auto rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-2xl">
                  <img src="/despues.png" alt="Despues con probador" className="absolute inset-0 w-full h-full object-cover" />
                  <div
                    className="absolute inset-0 z-10 overflow-hidden"
                    style={{
                      clipPath: `inset(0 ${100 - comparePosition}% 0 0)`,
                      WebkitClipPath: `inset(0 ${100 - comparePosition}% 0 0)`,
                      transition: compareOverlayTransition,
                    }}
                  >
                    <img src="/antes.png" alt="Antes sin probador" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 z-20 bg-gradient-to-br from-black/35 via-transparent to-black/55 pointer-events-none"></div>
                  <div className="absolute top-3 left-3 z-30 rounded-full bg-black/70 border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/80">
                    Antes
                  </div>
                  <div className="absolute top-3 right-3 z-30 rounded-full bg-black/70 border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/80">
                    Despues
                  </div>
                  <div
                    className="absolute top-0 bottom-0 z-40 -translate-x-1/2"
                    style={{
                      left: `${comparePosition}%`,
                      transition: compareHandleTransition,
                    }}
                  >
                    <div className="h-full w-[2px] bg-[var(--primary-color)]/80 shadow-[0_0_12px_rgba(245,193,76,0.45)]" />
                    <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--primary-color)]/70 bg-black/70 shadow-lg flex items-center justify-center">
                      <div className="flex gap-1 text-[10px] text-white/80">
                        <span>&lt;</span>
                        <span>&gt;</span>
                      </div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={comparePosition}
                    onChange={(event) => setComparePosition(Number(event.target.value))}
                    onPointerDown={() => {
                      setCompareDragging(true);
                      setCompareAnimating(false);
                    }}
                    onPointerUp={() => setCompareDragging(false)}
                    onPointerCancel={() => setCompareDragging(false)}
                    onBlur={() => setCompareDragging(false)}
                    aria-label="Comparador antes y despues"
                    className="absolute inset-0 z-50 h-full w-full cursor-ew-resize opacity-0"
                    style={{ touchAction: 'none' }}
                  />
                </div>
                <Button variant="secondary" onClick={() => setStep(6)}>
                  Usar esto con mis joyas
                </Button>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Capítulo 01</p>
            <h2 className="text-xl md:text-2xl font-serif font-bold">¿Qué pieza quiere probarse?</h2>
            {itemsLoading && (
              <div className="p-6 border border-white/10 rounded-xl bg-black/40 flex justify-center">
                <Spinner text="Cargando joyas..." />
              </div>
            )}
            {itemsError && <p className="text-sm text-red-400">{itemsError}</p>}
            {!itemsLoading && items.length > 0 && (
              <div className="grid md:grid-cols-3 gap-2">
                {items.slice(0, 3).map((item) => (
                  <button
                    key={item.id || item._id}
                    onClick={() => handlePieceSelect(item.id || item._id!)}
                    className={`p-3 rounded-xl border transition-all text-left bg-black/30 ${selectedItemId === (item.id || item._id)
                      ? 'border-[var(--primary-color)] bg-white/5'
                      : 'border-white/10 hover:border-[var(--primary-color)]/60'
                      }`}
                  >
                    <div className="aspect-[3/2] w-full overflow-hidden rounded-lg mb-2 bg-gradient-to-br from-black/40 to-black/20">
                      <img
                        src={getImageUrl(item.imageUrl)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-sm md:text-base font-serif">{item.name}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400">{item.category}</div>
                  </button>
                ))}
              </div>
            )}
            {!itemsLoading && items.length === 0 && (
              <p className="text-sm text-gray-400">Aun no hay joyas cargadas. Agrega destacadas para mostrarlas aqui.</p>
            )}
            {selectionError && (
              <p className="text-sm text-red-400">Selecciona una pieza para continuar.</p>
            )}
            <div className="flex justify-between items-center">
              <Button
                variant="primary"
                className="px-6 py-2 text-xs md:text-sm"
                onClick={() => selectedItem ? goNext() : setSelectionError(true)}
              >
                Continuar
              </Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Capítulo 02</p>
            <h2 className="text-2xl md:text-3xl font-serif font-bold">
              Haz una foto rápida para ver la pieza puesta.
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-sm text-gray-200 mb-4">{itemMetadata.poseAdvice}</p>
              <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
                <li>Se solicitará acceso a la cámara de su dispositivo para iniciar la demo del probador virtual.</li>
                <li>La imagen sera tratada electrónicamente únicamente para el servicio de probador virtual y será descartada después.</li>
                <li>Si prefieres no usar la cámara, en el paso siguiente podrás subir una foto desde tu dispositivo.</li>
              </ul>
            </div>
            <div className="flex justify-between items-center">
              <Button variant="primary" onClick={() => setStep(4)}>Entendido, abrir cámara</Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">En Vivo</p>
            <h2 className="text-xl md:text-2xl font-serif font-bold">
              Colóquese dentro del encuadre y haz la foto.
            </h2>
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/50">
              {cameraStatus === 'granted' && !previewImage ? (
                <div className={`relative ${cameraFrameClass} overflow-hidden`}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                  />
                  {/* Toggle Camera Button */}
                  <button
                    onClick={toggleCamera}
                    className="absolute top-4 right-4 z-20 bg-black/50 text-white p-2 md:p-3 rounded-full hover:bg-black/70 transition-all border border-white/10"
                    title="Cambiar Cámara"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              ) : (previewImage || resultImage) ? (
                <div className={`relative ${cameraFrameClass} overflow-hidden`}>
                  <img
                    src={resultImage || previewImage!}
                    alt="Vista previa"
                    className={`w-full h-full object-cover transition-all duration-1000 ${isProcessing ? 'blur-xl scale-105' : 'blur-0 scale-100'}`}
                  />
                </div>
              ) : (
                <div className={`${cameraFrameClass} bg-gradient-to-br from-black/40 via-black/20 to-black/40 flex items-center justify-center text-gray-500 text-sm`}>
                  Activa la cámara o sube una foto para ver aquí la vista previa.
                </div>
              )}
              {isProcessing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
                  <Spinner size={48} text={itemMetadata.loadingText || "Aplicando joya..."} />
                </div>
              )}
              {/* Countdown Overlay */}
              <AnimatePresence>
                {countdown !== null && (
                  <motion.div
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                  >
                    <span className="text-9xl font-bold text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                      {countdown}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <canvas ref={canvasRef} className="hidden" />
            </div>
            {tryOnError && <p className="text-sm text-red-400">{tryOnError}</p>}
            {cameraError && <p className="text-sm text-red-400">{cameraError}</p>}
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="primary" className="px-6 py-2 text-xs md:text-sm" onClick={triggerCapture} disabled={isProcessing || (cameraStatus === 'granted' && !cameraReady) || countdown !== null}>
                {isProcessing ? 'Procesando...' : (!cameraReady && cameraStatus === 'granted') ? 'Iniciando cámara...' : countdown !== null ? `En ${countdown}...` : 'Hacer foto y ver resultado'}
              </Button>
              <Button variant="secondary" className="px-6 py-2 text-xs md:text-sm" onClick={handleUploadClick}>Usar imagen del ordenador</Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Resultado</p>
              {resultImage && (
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = resultImage;
                    link.download = `joyeria-tryon.jpg`;
                    link.click();
                  }}
                  className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Guardar resultado
                </button>
              )}
            </div>
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-black/60 shadow-2xl aspect-video md:aspect-auto">
                  {resultImage ? (
                    <motion.img
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 1 }}
                      src={resultImage}
                      alt="Resultado de la prueba"
                      className="w-full h-full md:h-[500px] object-cover"
                    />
                  ) : (
                    <div className="w-full h-[360px] md:h-[460px] bg-black/40 flex items-center justify-center text-gray-400 italic">
                      Toma una foto para ver el resultado aquí.
                    </div>
                  )}
                  {/* Subtle vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-bold text-white tracking-tight">Visto. Probado. Decidido.</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">Así es como tus clientes experimentarán tus piezas en tiempo real, desde cualquier lugar.</p>
                </div>

                {selectedItem && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm"
                  >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--primary-color)] font-bold mb-2">Pieza actual</div>
                    <div className="text-xl font-serif text-white">{selectedItem.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{selectedItem.category}</div>
                  </motion.div>
                )}

                <div className="pt-4 space-y-3">
                  <Button variant="primary" className="w-full py-4 text-xs" onClick={() => setStep(6)}>Quiero esto en mi web</Button>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1 py-3 text-[10px]" onClick={() => { reset(); setStep(4); }}>Nueva foto</Button>
                    <Button variant="secondary" className="flex-1 py-3 text-[10px]" onClick={() => { reset(); setStep(2); }}>Cambiar joya</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Finalizar</p>
            <h2 className="text-2xl md:text-3xl font-serif font-bold">
              ¿Quieres ofrecer esta experiencia?
            </h2>
            <p className="text-base text-gray-300 max-w-2xl">
              Te preparamos una prueba gratuita sin compromiso y la vemos en 5 minutos.
            </p>
            <form className="grid md:grid-cols-3 gap-4 bg-white/5 border border-white/10 rounded-xl p-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-sm focus:outline-none focus:border-[var(--primary-color)]"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-300">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-sm focus:outline-none focus:border-[var(--primary-color)]"
                />
              </div>
              <div className="md:col-span-3 flex flex-wrap gap-3 items-center justify-between">
                <div className="text-sm text-gray-400">

                </div>
                <Button type="submit" variant="primary">Quiero probarlo con mis joyas</Button>
              </div>
              {formSent && <p className="md:col-span-3 text-sm text-green-400">Listo. Te contactaremos con la prueba.</p>}
            </form>
            <div className="flex justify-between items-center">
              <Button variant="secondary" onClick={() => setStep(1)}>Volver al inicio</Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden"
    >
      <section
        className={`relative min-h-[calc(100vh-130px)] px-4 ${isCompactStep ? 'py-1 md:py-2' : 'py-4'
          }`}
      >
        <div className={`max-w-6xl mx-auto flex flex-col ${isCompactStep ? 'gap-2' : 'gap-3'}`} style={{ zoom: 1 }}>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--primary-color)]" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className={`bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl ${isIntroStep ? 'p-4 md:p-5 border-b-transparent' : isCompactStep ? 'p-3 md:p-4' : 'p-4 md:p-6'
                } shadow-2xl flex-1 flex flex-col gap-4 overflow-hidden`}
            >
              <div className="flex-1">
                {renderStepContent()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </motion.div>
  );
};

export default HomePage;


