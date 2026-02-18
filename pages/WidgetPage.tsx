import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { JewelryItem, EventType } from '../types';
import { logEvent, validateWidgetApiKey, logWidgetEvent } from '../services/api';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { useConfig } from '../hooks/useConfig';
import { useTryOn } from '../hooks/useTryOn';

type TryOnStep = 'loading' | 'unauthorized' | 'instructions' | 'camera' | 'processing' | 'result';

const WidgetPage: React.FC = () => {
    const { config } = useConfig();
    const [searchParams] = useSearchParams();

    // Dynamic item from URL or fallback to empty
    const { item, options } = useMemo(() => {
        const imageUrl = searchParams.get('imageUrl') || '';
        const name = searchParams.get('name') || 'Producto';
        const category = (searchParams.get('category') as any) || 'Anillo';
        const apiKey = searchParams.get('apiKey');
        const optionsStr = searchParams.get('options');

        let parsedOptions = null;
        try {
            if (optionsStr) parsedOptions = JSON.parse(optionsStr);
        } catch (e) {
            console.warn('[Widget] Failed to parse options:', e);
        }

        return {
            item: {
                id: 'widget-dynamic',
                slug: 'widget-item',
                name,
                imageUrl,
                overlayAssetUrl: imageUrl, // In widget mode, we use the image provided as overlay
                category,
                price: 0,
                currency: 'EUR',
                description: '',
                hashtags: [],
                sku: 'widget',
                isFeatured: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            } as JewelryItem,
            options: parsedOptions
        };
    }, [searchParams]);

    const [step, setStep] = useState<TryOnStep>('loading');
    const [showDetails, setShowDetails] = useState(false);

    const {
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
        config: { ...config, options },
        onSuccess: (result) => {
            const apiKey = searchParams.get('apiKey');
            if (apiKey) {
                logWidgetEvent(apiKey, 'TRYON_SUCCESS', { itemId: 'widget-dynamic' });
            }

            logEvent(EventType.TRYON_SUCCESS, 'widget-dynamic');
            setStep('result');
            setTimeout(() => setShowDetails(true), 500);

            // Notify parent
            if (window.parent !== window) {
                window.parent.postMessage({ type: 'TRYON_SUCCESS', image: result }, '*');
            }
        },
        isMirrorMode: true
    });

    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const validate = async () => {
            const apiKey = searchParams.get('apiKey');
            const imageUrl = searchParams.get('imageUrl');

            if (!apiKey) {
                setErrorMessage('API Key missing');
                setStep('unauthorized');
                return;
            }

            if (!imageUrl) {
                setErrorMessage('Product image missing');
                setStep('unauthorized');
                return;
            }

            try {
                const result = await validateWidgetApiKey(apiKey);
                if (result.valid) {
                    setStep('instructions');
                } else {
                    setErrorMessage(result.message || 'Unauthorized');
                    setStep('unauthorized');
                }
            } catch (err) {
                setErrorMessage('Connection error');
                setStep('unauthorized');
            }
        };

        validate();
    }, [searchParams]);

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

    const handleClose = () => {
        if (window.parent !== window) {
            window.parent.postMessage({ type: 'WIDGET_CLOSE' }, '*');
        }
    };

    const renderContent = () => {
        return (
            <AnimatePresence mode="wait">
                {step === 'loading' && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex items-center justify-center p-8 text-center"
                    >
                        <Spinner text="Iniciando visualizador..." />
                    </motion.div>
                )}

                {step === 'unauthorized' && (
                    <motion.div
                        key="unauthorized"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center p-12 text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl md:text-2xl font-serif text-white mb-2">Error de Acceso</h2>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            {errorMessage || 'No tienes autorización para usar este widget.'}
                        </p>
                        <Button variant="primary" className="w-full py-3 text-sm" onClick={handleClose}>
                            Cerrar
                        </Button>
                    </motion.div>
                )}

                {step === 'instructions' && (
                    <motion.div
                        key="instructions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="h-full flex flex-col items-center justify-center p-8 text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)] border border-white/5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--primary-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-serif text-white mb-2 leading-tight">Pruébatelo ahora</h2>
                        <p className="text-gray-400 text-base mb-6 leading-relaxed max-w-xs mx-auto">
                            {config?.branding?.shutterDesign === 'special'
                                ? 'Enfoca la zona para comenzar'
                                : (itemMetadata.poseAdvice || 'Enfoca la zona donde quieras probar el accesorio.')
                            }
                        </p>
                        <Button variant="primary" className="w-full max-w-[200px] py-3 text-base font-bold rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95" onClick={() => setStep('camera')}>
                            ABRIR CÁMARA
                        </Button>
                    </motion.div>
                )}

                {step === 'camera' && (
                    <motion.div
                        key="camera"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
                    >
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                        ></video>

                        <canvas ref={canvasRef} className="hidden"></canvas>

                        {/* More subtle overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>

                        {/* Special Shutter Design: Top Text and Central Frame */}
                        {config?.branding?.shutterDesign === 'special' ? (
                            <>
                                {/* Top Text */}
                                <div className="absolute top-10 left-0 right-0 z-20 text-center text-white px-6">
                                    <h2 className="text-2xl font-serif font-light tracking-widest uppercase">Pruébate: {item?.name}</h2>
                                </div>

                                {/* Central Frame with Corners */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                    <div className="relative w-64 h-64 md:w-80 md:h-80">
                                        {/* Corners */}
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white"></div>
                                    </div>
                                </div>

                                {/* Instruction below frame */}
                                <div className="absolute bottom-32 left-0 right-0 z-20 text-center text-white px-8">
                                    <p className="text-sm tracking-wide font-medium">
                                        {config?.uiLabels?.tryOnInstruction || 'Centra el accesorio en el marcador'}
                                    </p>
                                </div>
                            </>
                        ) : (
                            /* Original context labels */
                            <div className="z-10 text-center text-white p-6 mt-12">
                                {/* Only show if NOT special design */}
                            </div>
                        )}

                        <AnimatePresence>
                            {countdown !== null && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1.2 }}
                                    exit={{ opacity: 0, scale: 2 }}
                                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
                                >
                                    <span className="text-9xl font-serif font-bold text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]">
                                        {countdown}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="z-10 text-center text-white p-6 mt-12">
                            {tryOnError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 bg-red-500/80 backdrop-blur-md px-4 py-2 rounded-lg text-xs border border-red-400"
                                >
                                    {tryOnError}
                                </motion.div>
                            )}
                        </div>

                        {/* Camera controls with glass effect */}
                        <div className="absolute bottom-10 flex flex-col items-center w-full gap-6">
                            <div className="flex items-center gap-12">
                                <button
                                    onClick={toggleCamera}
                                    className="bg-black/40 text-white p-4 rounded-full border border-white/10 backdrop-blur-xl hover:bg-black/60 transition-all active:scale-90"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>

                                <button
                                    onClick={triggerCapture}
                                    disabled={countdown !== null || !cameraReady}
                                    className={`relative group transition-all active:scale-95 ${!cameraReady && 'opacity-50 cursor-not-allowed'}`}
                                >
                                    <div className={`w-16 h-16 rounded-full border-2 p-1 flex items-center justify-center transition-colors ${countdown !== null ? 'border-red-500' : 'border-white'}`}>
                                        <div className={`w-full h-full rounded-full transition-all ${countdown !== null ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'}`}>
                                        </div>
                                    </div>
                                </button>

                                <div className="w-14"></div> {/* Spacer to center the capture button */}
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'processing' && (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative h-full w-full flex flex-col items-center justify-center text-center overflow-hidden"
                    >
                        {(previewImage || resultImage) && (
                            <img
                                src={resultImage || previewImage!}
                                className="absolute inset-0 w-full h-full object-cover blur-3xl scale-125 transition-all duration-1000 opacity-60"
                                alt=""
                            />
                        )}
                        <div className="relative z-10 flex flex-col items-center p-12">
                            <div className="relative w-24 h-24 mb-6">
                                <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-[var(--primary-color)] animate-spin"></div>
                                <div className="absolute inset-3 rounded-full border-2 border-white/5 border-b-[var(--primary-color)] animate-spin opacity-50"></div>
                            </div>
                            <h3 className="text-xl font-serif text-white mb-1">Creando Magia...</h3>
                            <p className="text-gray-500 text-xs max-w-[180px] mx-auto leading-relaxed">Nuestra IA está colocando la pieza de forma realista.</p>
                        </div>
                    </motion.div>
                )}

                {step === 'result' && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center"
                    >
                        {resultImage && (
                            <div className="fixed inset-0 z-0 opacity-40">
                                <img
                                    src={resultImage}
                                    className="w-full h-full object-cover blur-3xl scale-150"
                                    alt=""
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                            </div>
                        )}

                        <div className="relative z-10 w-full flex flex-col items-center p-6">
                            {resultImage && (
                                <motion.img
                                    initial={{ opacity: 0, scale: 0.8, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    src={resultImage}
                                    alt="Result"
                                    className="max-w-full max-h-[65vh] object-contain shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] rounded-3xl mb-10 border border-white/10"
                                />
                            )}

                            <div className="flex gap-3 w-full max-w-[320px]">
                                <button
                                    onClick={() => { reset(); setStep('camera'); }}
                                    className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all border border-white/10 backdrop-blur-md active:scale-95"
                                >
                                    Repetir
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 px-4 rounded-xl bg-white text-black font-bold text-sm transition-all shadow-xl hover:bg-gray-100 active:scale-95"
                                >
                                    Terminar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    };

    return (
        <div className="fixed inset-0 bg-transparent z-50 font-sans text-white overflow-hidden selection:bg-[var(--primary-color)]">
            {renderContent()}
        </div>
    );
};

export default WidgetPage;
