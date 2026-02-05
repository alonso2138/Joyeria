import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { JewelryItem, EventType } from '../types';
import { getJewelryBySlug, logEvent } from '../services/api';
import { trackIfAvailable } from '../services/tracking';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { useConfig } from '../hooks/useConfig';
import { useTryOn } from '../hooks/useTryOn';

type TryOnStep = 'loading_item' | 'instructions' | 'camera' | 'processing' | 'result';

const TryOnPage: React.FC = () => {
    const { config } = useConfig();
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [item, setItem] = useState<JewelryItem | null>(null);
    const [step, setStep] = useState<TryOnStep>('loading_item');
    const [showDetails, setShowDetails] = useState(false);

    const {
        cameraStatus,
        cameraReady,
        isProcessing,
        countdown,
        previewImage,
        resultImage,
        tryOnError,
        facingMode,
        videoRef,
        canvasRef,
        itemMetadata,
        startCamera,
        stopCamera,
        toggleCamera,
        triggerCapture,
        reset
    } = useTryOn({
        selectedItem: item,
        config,
        onSuccess: () => {
            logEvent(EventType.TRYON_SUCCESS, item?.id || '');
            trackIfAvailable('try-on');
            setStep('result');
            setTimeout(() => setShowDetails(true), 500);
        },
        isMirrorMode: true // Enabled mirror mode as requested
    });

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

    useEffect(() => {
        if (step === 'camera' && !isProcessing && !resultImage) {
            startCamera();
        } else {
            stopCamera();
        }
    }, [step, isProcessing, resultImage, startCamera, stopCamera]);

    useEffect(() => {
        if (isProcessing && step !== 'processing') {
            setStep('processing');
        }
    }, [isProcessing, step]);

    const renderContent = () => {
        switch (step) {
            case 'loading_item':
                return <div className="h-full flex items-center justify-center"><Spinner text="Preparando probador..." /></div>;
            case 'instructions':
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
                                {itemMetadata.poseAdvice}
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
                            className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                        ></video>

                        <canvas ref={canvasRef} className="hidden"></canvas>
                        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                        <div className="z-10 text-center text-white p-4">
                            <h2 className="text-3xl font-serif">Pruébate: {item?.name}</h2>
                            <p className="mt-2">{config?.uiLabels?.tryOnInstruction || 'Coloca la pieza en el encuadre y captura.'}</p>
                            {tryOnError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 bg-red-500/80 backdrop-blur-md px-4 py-2 rounded-lg text-sm border border-red-400"
                                >
                                    {tryOnError}
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
                            onClick={triggerCapture}
                            disabled={countdown !== null || !cameraReady}
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
                                alt="Fondo borroso"
                            />
                        )}
                        <div className="relative z-10 flex flex-col items-center bg-black/20 p-8 rounded-full backdrop-blur-sm">
                            <Spinner text={itemMetadata.loadingText || 'Aplicando IA...'} />
                            <p className="mt-4 text-gray-300">Nuestra IA esta creando tu imagen personalizada.</p>
                        </div>
                    </div>
                );
            case 'result':
                return (
                    <div className="relative w-full h-full bg-[#050505] overflow-hidden flex flex-col items-center justify-center">
                        {/* Immersive blurred backdrop */}
                        {resultImage && (
                            <div className="absolute inset-0 z-0">
                                <img
                                    src={resultImage}
                                    className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
                                    alt=""
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                            </div>
                        )}

                        {resultImage && (
                            <motion.img
                                initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                src={resultImage}
                                alt="Virtual try-on result"
                                className="relative z-10 max-w-full max-h-[75vh] object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg"
                            />
                        )}

                        <AnimatePresence>
                            {showDetails && (
                                <motion.div
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="absolute bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-96 z-20"
                                >
                                    <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-2xl font-serif font-bold text-white tracking-tight">{item?.name}</h2>
                                                <p className="text-lg font-medium text-[var(--primary-color)] mt-1">
                                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item?.price || 0)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = resultImage!;
                                                    link.download = `try-on-${item?.slug}.jpg`;
                                                    link.click();
                                                }}
                                                className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/5 group"
                                                title="Descargar imagen"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>
                                        </div>

                                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                                            {item?.description}
                                        </p>

                                        <div className="mt-2">
                                            <button
                                                onClick={() => { reset(); setStep('camera'); }}
                                                className="w-full py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all border border-white/10 active:scale-95"
                                            >
                                                Repetir
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-[#050505] z-50">
            <button onClick={() => navigate(-1)} className="absolute top-6 left-6 z-30 w-12 h-12 flex items-center justify-center text-white bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/10 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {renderContent()}
        </div>
    );
};

export default TryOnPage;
