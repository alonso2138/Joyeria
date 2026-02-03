import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { JewelryItem, EventType } from '../types';
import { getJewelryBySlug, logEvent, getImageUrl } from '../services/api';
import { trackIfAvailable } from '../services/tracking';
import { generateTryOnImage } from '../services/geminiService';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { useConfig } from '../hooks/useConfig';

type TryOnStep = 'loading_item' | 'instructions' | 'camera' | 'processing' | 'result';

const TryOnPage: React.FC = () => {
    const { config } = useConfig();
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [item, setItem] = useState<JewelryItem | null>(null);
    const [step, setStep] = useState<TryOnStep>('loading_item');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showFirstPassDebug, setShowFirstPassDebug] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isProcessingRef = useRef(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [countdown, setCountdown] = useState<number | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const progressPreviewTimeout = useRef<number | null>(null);

    useEffect(() => {
        const fetchItem = async () => {
            if (slug) {
                const result = await getJewelryBySlug(slug);
                if (result) {
                    setItem(result);
                    setStep('instructions');
                } else {
                    navigate('/catalog');
                }
            }
        };
        fetchItem();
    }, [slug, navigate]);

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && videoRef.current) {
            try {
                // Stop previous tracks before starting new ones to avoid conflicts on some devices
                stopCamera();
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facingMode }
                });
                videoRef.current.srcObject = stream;
            } catch (err) {
                console.error('Error accessing camera: ', err);
                alert('No se pudo acceder a la cámara. Por favor, revisa los permisos.');
                navigate(`/jewelry/${slug}`);
            }
        }
    }, [slug, navigate, facingMode, stopCamera]);

    useEffect(() => {
        if (step === 'camera') {
            startCamera();
        } else {
            stopCamera();
        }
        return () => { stopCamera(); };
    }, [step, startCamera, stopCamera, facingMode]);

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const captureToBase64 = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
        const maxWidth = 1280;
        const maxHeight = 720;
        const { videoWidth, videoHeight } = video;

        if (!videoWidth || !videoHeight) {
            return null;
        }

        const aspect = videoWidth / videoHeight;
        let targetWidth = maxWidth;
        let targetHeight = Math.round(targetWidth / aspect);
        if (targetHeight > maxHeight) {
            targetHeight = maxHeight;
            targetWidth = Math.round(targetHeight * aspect);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, targetWidth, targetHeight);
        return canvas.toDataURL('image/jpeg', 0.7);
    };

    const capturePhoto = async () => {
        if (isProcessingRef.current || countdown !== null) return;
        setError(null);

        if (videoRef.current && canvasRef.current && item && step !== 'processing') {
            const needsTimer = ['bolso', 'camiseta', 'camisa'].includes(item.category.toLowerCase());

            if (needsTimer && countdown === null) {
                setCountdown(3);
                const timerId = setInterval(() => {
                    setCountdown(prev => {
                        if (prev === 1) {
                            clearInterval(timerId);
                            setCountdown(null);
                            executeCapture();
                            return null;
                        }
                        return prev !== null ? prev - 1 : null;
                    });
                }, 1000);
            } else {
                executeCapture();
            }
        }
    };

    const executeCapture = async () => {
        if (!videoRef.current || !canvasRef.current || !item || isProcessingRef.current) return;

        isProcessingRef.current = true;
        setIsProcessingAI(true);
        setError(null);

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Intentos de captura con reintento aumentado para mayor robustez
            let userImageBase64 = null;
            for (let i = 0; i < 10; i++) {
                userImageBase64 = captureToBase64(video, canvas);
                if (userImageBase64 && userImageBase64.length > 2000) break;
                await new Promise(r => setTimeout(r, 200));
            }

            if (!userImageBase64) {
                throw new Error('La cámara no está lista para capturar. Reintenta asegurándote de que el video se ve.');
            }

            setStep('processing');
            setPreviewImage(userImageBase64); // Freeze immediately
            stopCamera();

            const composedImage = await generateTryOnImage(
                userImageBase64,
                getImageUrl(item.overlayAssetUrl),
                item.category.toLowerCase(),
                config
            );

            setResultImage(composedImage);

            // Give time to see the swap while blurred
            await new Promise(r => setTimeout(r, 800));

            logEvent(EventType.TRYON_SUCCESS, item.id);
            trackIfAvailable('try-on');

            // Unblur starts
            setIsProcessingAI(false);
            setStep('result');
            setTimeout(() => setShowDetails(true), 500);
        } catch (err: any) {
            console.error('Error in virtual try-on:', err);
            setError(err.message || 'Error inesperado al procesar el probador.');
            setStep('camera');
            setPreviewImage(null);
            setIsProcessingAI(false);
        } finally {
            isProcessingRef.current = false;
        }
    };

    const renderContent = () => {
        switch (step) {
            case 'loading_item':
                return <div className="h-full flex items-center justify-center"><Spinner text="Preparando probador..." /></div>;
            case 'instructions':
                const getPoseAdvice = () => {
                    switch (item?.category) {
                        case 'Anillo': return 'Muestra tu mano abierta con los dedos relajados frente a la cámara.';
                        case 'Collar': return 'Encuadra tu cuello y parte superior del pecho de forma frontal.';
                        case 'Pulsera': case 'Reloj': return 'Muestra tu muñeca de lado o de frente, evitando sombras fuertes.';
                        case 'Pendiente': return 'Muestra tu oreja de perfil con el pelo retirado.';
                        case 'Bolso': return 'Sujeta el bolso en tu mano o cuélgalo de tu hombro frente a la cámara.';
                        case 'Camiseta': case 'Camisa': return 'Colócate frente a la cámara mostrando tu torso completo. Intenta que la iluminación sea uniforme.';
                        default: return 'Colócate en el centro del encuadre para ver el resultado.';
                    }
                };
                return (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-black/90">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="max-w-md w-full"
                        >
                            <div className="w-20 h-20 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--primary-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-serif text-white mb-4">Consejo de Posado</h2>
                            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                                {getPoseAdvice()}
                            </p>
                            <Button variant="primary" className="w-full py-4 text-lg" onClick={() => setStep('camera')}>
                                Entendido, abrir cámara
                            </Button>
                        </motion.div>
                    </div>
                );
            case 'camera':
                return (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                        ></video>

                        {/* Overlay de Carga durante la captura */}
                        {isProcessingAI && (
                            <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <Spinner text="Capturando..." />
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                        <div className="z-10 text-center text-white p-4">
                            <h2 className="text-3xl font-serif">Pruébate: {item?.name}</h2>
                            <p className="mt-2">{config?.uiLabels?.tryOnInstruction || 'Coloca la pieza en el encuadre y captura.'}</p>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 bg-red-500/80 backdrop-blur-md px-4 py-2 rounded-lg text-sm border border-red-400"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </div>

                        {/* Flip Camera Button */}
                        <button
                            onClick={toggleCamera}
                            className="absolute top-4 right-16 z-20 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-all"
                            title="Cambiar Cámara"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>

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

                        <button
                            onClick={capturePhoto}
                            disabled={countdown !== null}
                            className={`absolute bottom-10 z-10 w-20 h-20 rounded-full border-4 border-gray-800 transition-all flex items-center justify-center overflow-hidden
                                ${countdown !== null ? 'bg-red-500 border-red-700' : 'bg-white'}
                            `}
                        >
                            {countdown !== null ? (
                                <span className="text-2xl font-bold text-white">{countdown}</span>
                            ) : (
                                <div className="w-16 h-16 rounded-full border-2 border-transparent hover:border-gray-200 transition-all"></div>
                            )}
                        </button>
                    </div>
                );
            case 'processing':
                return (
                    <div className="relative h-full w-full flex flex-col items-center justify-center text-center overflow-hidden bg-black">
                        {(previewImage || resultImage) && (
                            <img
                                src={resultImage || previewImage!}
                                className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 transition-all duration-1000"
                            />
                        )}
                        <div className="relative z-10 flex flex-col items-center bg-black/20 p-8 rounded-full backdrop-blur-sm">
                            <Spinner text={config?.uiLabels?.processingTryOn || 'Aplicando IA...'} />
                            <p className="mt-4 text-gray-300">Nuestra IA esta creando tu imagen personalizada.</p>
                        </div>
                    </div>
                );
            case 'result':
                return (
                    <div className="relative w-full h-full bg-black">
                        {resultImage && (
                            <motion.img
                                initial={{ filter: 'blur(20px)', scale: 1.1 }}
                                animate={{ filter: 'blur(0px)', scale: 1 }}
                                transition={{ duration: 0.8 }}
                                src={resultImage}
                                alt="Virtual try-on result"
                                className="w-full h-full object-contain"
                            />
                        )}
                        <AnimatePresence>
                            {showDetails && (
                                <motion.div
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 backdrop-blur-lg p-6 rounded-t-2xl"
                                >
                                    <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => setShowDetails(false)}></div>
                                    <h2 className="text-3xl font-serif text-white">{item?.name}</h2>
                                    <p className="text-xl text-[var(--primary-color)] my-2">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item?.price || 0)}</p>
                                    <p className="text-gray-300 text-sm mb-6">{item?.description.substring(0, 150)}...</p>
                                    <Button variant="primary" className="w-full" onClick={() => logEvent(EventType.CLICK_BUY, item?.id || '')}>{config?.uiLabels?.buyButton || 'Quiero esto'}</Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 z-50">
            <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-20 text-white bg-black bg-opacity-50 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {renderContent()}
        </div>
    );
};

export default TryOnPage;
