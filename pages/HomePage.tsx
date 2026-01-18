import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { JewelryItem } from '../types';
import { getFeaturedJewelryItems, getImageUrl } from '../services/api';
import { generateTryOnImage } from '../services/geminiService';
import { trackIfAvailable, trackMeeting, trackStepCompleted } from '../services/tracking';

const HomePage: React.FC = () => {
  const totalSteps = 6;
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [formSent, setFormSent] = useState(false);
  const [selectionError, setSelectionError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [processingBackdrop, setProcessingBackdrop] = useState<string | null>(null);
  const [useUploadFlow, setUseUploadFlow] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);
  const [compareDragging, setCompareDragging] = useState(false);
  const [compareAnimating, setCompareAnimating] = useState(false);
  const processingTimeoutRef = useRef<number | null>(null);
  const trackedStepsRef = useRef({ started: false, finished: false });
  const trackedStepNumbersRef = useRef<Set<number>>(new Set());
  const prevStepRef = useRef(step);
  const compareIntroTimeoutRef = useRef<number | null>(null);
  const compareStopTimeoutRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const progress = (step / totalSteps) * 100;
  const selectedItem = items.find((it) => it.id === selectedItemId || it._id === selectedItemId) || null;
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

  useEffect(() => {
    const fetchItems = async () => {
      setItemsLoading(true);
      setItemsError(null);
      try {
        const data = await getFeaturedJewelryItems();
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

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  };

  const playVideoStream = () => {
    const videoEl = videoRef.current;
    if (videoEl) {
      console.log('[CAM] Intentando reproducir stream en <video>');
      videoEl
        .play()
        .then(() => console.log('[CAM] Stream en reproduccion'))
        .catch((err) => console.warn('[CAM] No se pudo hacer autoplay del stream de camara.', err));
    }
  };

  const attachStreamToVideo = (stream: MediaStream) => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      console.warn('[CAM] Video element no disponible para adjuntar stream');
      setTimeout(() => attachStreamToVideo(stream), 100);
      return;
    }
    videoEl.srcObject = stream;
    setCameraReady(true);
    videoEl.onloadedmetadata = () => {
      console.log('[CAM] metadata cargada. Dimensiones', videoEl.videoWidth, videoEl.videoHeight);
      setCameraReady(videoEl.videoWidth > 0 && videoEl.videoHeight > 0);
      playVideoStream();
    };
    playVideoStream();
  };

  const startCamera = async () => {
    if (streamRef.current) {
      console.log('[CAM] Stream ya activo, reintentando adjuntar al video');
      attachStreamToVideo(streamRef.current);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('denied');
      setCameraError('Tu dispositivo no permite abrir la camara.');
      return;
    }
    setCameraReady(false);

    const constraintsList: MediaStreamConstraints[] = [
      { video: { facingMode: 'user' } },
      { video: { facingMode: 'environment' } },
      { video: true },
    ];

    for (const constraint of constraintsList) {
      try {
        console.log('[CAM] Solicitando getUserMedia con', constraint);
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        streamRef.current = stream;
        console.log('[CAM] Stream obtenido. Tracks:', stream.getTracks().map(t => `${t.kind}:${t.readyState}`).join(', '));
        attachStreamToVideo(stream);
        setCameraStatus('granted');
        setCameraError(null);
        return;
      } catch (err) {
        console.error('[CAM] Error con constraint', constraint, err);
      }
    }

    setCameraStatus('denied');
    setCameraError('No se pudo abrir la camara. Usa una imagen del ordenador.');
  };

  useEffect(() => stopCamera, []);

  useEffect(() => {
    if (step === 4 && !useUploadFlow) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [step, useUploadFlow]);

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

  // Asegura que si ya hay stream y el video se monta, se vuelva a adjuntar.
  useEffect(() => {
    if (cameraStatus === 'granted' && streamRef.current && videoRef.current) {
      attachStreamToVideo(streamRef.current);
    }
  }, [cameraStatus]);

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
    setCameraStatus('idle');
    setCameraError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setPreviewImage(reader.result);
        setResultImage(null);
        setStep(4);
        setTimeout(() => {
          capturePhotoAndTryOn(reader.result as string);
        }, 500);
      }
    };
    reader.readAsDataURL(file);
  };

  const captureToBase64 = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    const maxWidth = 1280;
    const maxHeight = 720;
    const { videoWidth, videoHeight } = video;
    if (!videoWidth || !videoHeight) return null;
    const aspect = videoWidth / videoHeight;
    let targetWidth = maxWidth;
    let targetHeight = Math.round(targetWidth / aspect);
    if (targetHeight > maxHeight) {
      targetHeight = maxHeight;
      targetWidth = Math.round(targetHeight * aspect);
    }
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      // Mirror horizontally for natural selfie view
      ctx.translate(targetWidth, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      ctx.restore();
    }
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const capturePhotoAndTryOn = async (providedBase64?: string) => {
    if (!selectedItem) {
      setSelectionError(true);
      setStep(2);
      return;
    }
    setIsProcessing(true);
    setTryOnError(null);
    setProcessingBackdrop(null);
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    try {
      let userImageBase64: string | null = providedBase64 ?? previewImage;
      if (cameraStatus === 'granted' && videoRef.current && canvasRef.current) {
        const captured = captureToBase64(videoRef.current, canvasRef.current);
        if (captured) {
          userImageBase64 = captured;
          setPreviewImage(captured);
          console.log('[CAM] Captura realizada. Tamano base64:', captured.length);
        } else {
          console.warn('[CAM] Captura devolvio null');
        }
      }
      if (userImageBase64) {
        processingTimeoutRef.current = window.setTimeout(() => {
          setProcessingBackdrop(userImageBase64);
        }, 1500);
      }
      if (!userImageBase64) {
        throw new Error('Necesitamos una foto para aplicar la joya.');
      }
      stopCamera();
      const overlayUrl = getImageUrl(selectedItem.overlayAssetUrl);
      console.log('[TRYON] Llamando a Gemini con overlay:', overlayUrl);
      const composed = await generateTryOnImage(userImageBase64, overlayUrl);
      console.log('[TRYON] Imagen compuesta recibida. Tamano:', composed?.length || 0);
      setResultImage(composed);
      if (!trackedStepsRef.current.finished) {
        trackIfAvailable('try-on');
        trackedStepsRef.current.finished = true;
      }
      setStep(5); // Avanza sin pulsar continuar
    } catch (err) {
      console.error('Error en try-on', err);
      setTryOnError('No se pudo procesar la imagen. Prueba otra vez o sube una foto.');
    } finally {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      setIsProcessing(false);
    }
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
              <h1 className="text-[clamp(2.3rem,4.5vh,3.2rem)] font-serif font-bold leading-tight">
                Convierte visitas en clientes mostrando joyas en tiempo real.
              </h1>
              <p className="text-base md:text-lg text-gray-300">
                Las joyerías que lo usan reducen dudas y cierran más ventas online y en tienda.
              </p>
              <p className="text-sm md:text-base text-gray-400">
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
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Elección de pieza</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold">¿Qué pieza quiere probarse?</h2>
            {itemsLoading && (
              <div className="p-6 border border-white/10 rounded-xl bg-black/40 flex justify-center">
                <Spinner text="Cargando joyas..." />
              </div>
            )}
            {itemsError && <p className="text-sm text-red-400">{itemsError}</p>}
            {!itemsLoading && items.length > 0 && (
              <div className="grid md:grid-cols-3 gap-4">
                {items.slice(0, 3).map((item) => (
                  <button
                    key={item.id || item._id}
                    onClick={() => handlePieceSelect(item.id || item._id!)}
                    className={`p-4 rounded-xl border transition-all text-left bg-black/30 ${
                      selectedItemId === (item.id || item._id)
                        ? 'border-[var(--primary-color)] bg-white/5'
                        : 'border-white/10 hover:border-[var(--primary-color)]/60'
                    }`}
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-lg mb-3 bg-gradient-to-br from-black/40 to-black/20">
                      <img
                        src={getImageUrl(item.imageUrl)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-lg font-serif">{item.name}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-400">{item.category}</div>
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
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Antes de la cámara</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold">
              Haz una foto rápida para ver la pieza puesta.
            </h2>
            <p className="text-lg text-gray-300">En el siguiente paso pediremos permiso para usar la camara y podrás continuar o subir una foto alli.</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-sm text-gray-200 mb-2">Para seguir con la demo:</p>
              <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
                <li>Se solicitará acceso a la cámara de su dispositivo para iniciar la demo del probador virtual.</li>
                <li>La imagen sera tratada electrónicamente únicamente para el servicio de probador virtual y será descartada después.</li>
                <li>Si prefieres no usar la cámara, en el paso siguiente podrás subir una foto desde tu dispositivo.</li>
              </ul>
            </div>
            <div className="flex justify-between items-center">
              <Button variant="primary" onClick={() => setStep(4)}>Continuar</Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Cámara</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold">
              Colóquese dentro del encuadre y haz la foto.
            </h2>
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/50">
              {cameraStatus === 'granted' ? (
                <div className="relative w-full h-[320px] md:h-[420px] overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: isProcessing ? 0.05 : 1, transform: 'scaleX(-1)' }}
                    onLoadedMetadata={playVideoStream}
                    onPlay={() => {
                      const v = videoRef.current;
                      if (v && v.videoWidth > 0 && v.videoHeight > 0) {
                        setCameraReady(true);
                      }
                      console.log('[CAM] evento play');
                    }}
                  />
                </div>
              ) : previewImage ? (
                <img src={previewImage} alt="Vista previa" className="w-full h-[320px] md:h-[420px] object-cover opacity-90" />
              ) : (
                <div className="w-full h-[320px] md:h-[420px] bg-gradient-to-br from-black/40 via-black/20 to-black/40 flex items-center justify-center text-gray-500 text-sm">
                  Activa la camara o sube una foto para ver aqui la vista previa.
                </div>
              )}
              {isProcessing && (
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-black/80"></div>
                  <div
                    className="absolute inset-0 bg-center bg-cover blur-2xl transition-opacity duration-500"
                    style={{
                      backgroundImage: processingBackdrop ? `url(${processingBackdrop})` : undefined,
                      opacity: processingBackdrop ? 0.6 : 0,
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-black/60"></div>
                  <div className="relative z-10 h-full flex flex-col items-center justify-center">
                    <Spinner size={48} text="Aplicando la joya elegida..." />
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute bottom-4 inset-x-0 text-center text-sm text-white/80"></div>
            </div>
            {tryOnError && <p className="text-sm text-red-400">{tryOnError}</p>}
            {cameraError && <p className="text-sm text-red-400">{cameraError}</p>}
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="primary" onClick={capturePhotoAndTryOn} disabled={isProcessing}>
                {isProcessing ? 'Procesando...' : 'Hacer foto y ver resultado'}
              </Button>
              <Button variant="secondary" onClick={handleUploadClick}>Usar imagen del ordenador</Button>

            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <div className="flex justify-between items-center">
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Resultado</p>
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="md:w-2/3">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl">
                  {resultImage ? (
                    <img src={resultImage} alt="Resultado de la prueba" className="w-full h-[360px] md:h-[460px] object-cover" />
                  ) : (
                    <div className="w-full h-[360px] md:h-[460px] bg-black/40 flex items-center justify-center text-gray-400">
                      Toma una foto para ver el resultado aqui.
                    </div>
                  )}
                </div>
              </div>
              <div className="md:w-1/3 space-y-4">
                <h3 className="text-2xl font-serif font-bold">Asi lo vería tu cliente.</h3>
                <p className="text-gray-300">Listo para decidir sin dudas.</p>
                {selectedItem && (
                  <div className="p-4 rounded-lg border border-white/10 bg-black/40">
                    <div className="text-sm uppercase tracking-[0.2em] text-gray-400">Probado</div>
                    <div className="text-lg font-serif">{selectedItem.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{selectedItem.category}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <Button variant="secondary" onClick={() => setStep(4)}>Repetir captura</Button>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="secondary" onClick={() => setStep(2)}>Probar otra pieza</Button>
                <Button variant="primary" onClick={handleUseResult}>Usar esto con mis joyas</Button>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Contacto</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold">
               ¿Quieres ofrecer esta experiencia a tus clientes?
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl">
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
      <div className="absolute inset-0 bg-gradient-to-br from-[#08070f] via-[#0f1018] to-[#0b0c14]"></div>
      <div className="absolute -left-32 -top-32 w-72 h-72 bg-[var(--primary-color)]/10 blur-3xl"></div>
      <div className="absolute -right-24 bottom-0 w-64 h-64 bg-white/5 blur-3xl"></div>
      <section
        className={`relative z-10 min-h-[calc(100vh-130px)] px-4 ${
          isIntroStep ? 'py-2 md:py-3' : 'py-4'
        }`}
      >
        <div className={`max-w-6xl mx-auto flex flex-col ${isIntroStep ? 'gap-2' : 'gap-3'}`} style={{ zoom: 1 }}>
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
              className={`bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl ${
                isIntroStep ? 'p-4 md:p-5' : 'p-4 md:p-6'
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
