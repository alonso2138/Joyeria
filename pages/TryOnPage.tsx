import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { JewelryItem, EventType } from '../types';
import { getJewelryBySlug, logEvent, getImageUrl } from '../services/api';
import { trackIfAvailable } from '../services/tracking';
import { generateTryOnImage } from '../services/geminiService';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';

type TryOnStep = 'loading_item' | 'camera' | 'processing' | 'result';

const TryOnPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [item, setItem] = useState<JewelryItem | null>(null);
    const [step, setStep] = useState<TryOnStep>('loading_item');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [firstPassImage, setFirstPassImage] = useState<string | null>(null);
    const [showFirstPassDebug, setShowFirstPassDebug] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const progressPreviewTimeout = useRef<number | null>(null);

    useEffect(() => {
        const fetchItem = async () => {
            if (slug) {
                const result = await getJewelryBySlug(slug);
                if (result) {
                    setItem(result);
                    setStep('camera');
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
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                videoRef.current.srcObject = stream;
            } catch (err) {
                console.error('Error accessing camera: ', err);
                alert('No se pudo acceder a la cámara. Por favor, revisa los permisos.');
                navigate(`/jewelry/${slug}`);
            }
        }
    }, [slug, navigate]);

    useEffect(() => {
        if(step === 'camera') {
            startCamera();
        } else {
            stopCamera();
        }
        return () => { // Cleanup: stop camera stream
            stopCamera();
        };
    }, [step, startCamera, stopCamera]);

    useEffect(() => {
        return () => {
            if (progressPreviewTimeout.current) {
                clearTimeout(progressPreviewTimeout.current);
            }
        };
    }, []);
    
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
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, targetWidth, targetHeight);
        return canvas.toDataURL('image/jpeg', 0.7);
    };

    const capturePhoto = async () => {
        if (videoRef.current && canvasRef.current && item && step !== 'processing') {
            setStep('processing');
            setIsProcessingAI(true);
            setFirstPassImage(null);
            setShowFirstPassDebug(false);
            if (progressPreviewTimeout.current) {
                clearTimeout(progressPreviewTimeout.current);
            }
            try {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const userImageBase64 = captureToBase64(video, canvas);
                stopCamera(); // stop immediately after capture
                if (!userImageBase64) {
                    throw new Error('No se pudo capturar la imagen.');
                }

                // After ~2s, show the captured photo blurred as a progress backdrop.
                progressPreviewTimeout.current = window.setTimeout(() => {
                    setFirstPassImage(userImageBase64);
                }, 2000);

                const composedImage = await generateTryOnImage(
                    userImageBase64,
                    getImageUrl(item.overlayAssetUrl)
                );
                
                // If no preview was shown yet, keep the captured photo as the debug image.
                setFirstPassImage((prev) => prev || userImageBase64);
                setResultImage(composedImage);
                logEvent(EventType.TRYON_SUCCESS, item.id);
                trackIfAvailable('try-on');
                setStep('result');
                setTimeout(() => setShowDetails(true), 500); // Auto-show details after a moment
            } catch (err) {
                console.error(err);
                alert('No se pudo procesar la imagen. Intenta de nuevo.');
                setStep('camera');
            } finally {
                if (progressPreviewTimeout.current) {
                    clearTimeout(progressPreviewTimeout.current);
                    progressPreviewTimeout.current = null;
                }
                setIsProcessingAI(false);
            }
        }
    };

    const renderContent = () => {
        switch (step) {
            case 'loading_item':
                return <div className="h-full flex items-center justify-center"><Spinner text="Preparando probador..." /></div>;
            case 'camera':
                return (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover"></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                        <div className="z-10 text-center text-white p-4">
                            <h2 className="text-3xl font-serif">Pruébate: {item?.name}</h2>
                            <p className="mt-2">Coloca tu mano, cuello o muñeca en el centro y captura.</p>
                        </div>
                        <button onClick={capturePhoto} className="absolute bottom-10 z-10 w-20 h-20 bg-white rounded-full border-4 border-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white"></button>
                    </div>
                );
            case 'processing':
                return (
                    <div className="relative h-full w-full flex flex-col items-center justify-center text-center p-4 overflow-hidden bg-black">
                        {firstPassImage && (
                            <div
                                className="absolute inset-0 bg-center bg-cover scale-105 blur-lg opacity-50"
                                style={{ backgroundImage: `url(${firstPassImage})` }}
                            ></div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <Spinner text={isProcessingAI ? 'Aplicando la joya...' : 'Capturando...'} />
                            <p className="mt-4 text-gray-300">Nuestra IA esta creando tu imagen personalizada.</p>
                        </div>
                    </div>
                );
            
case 'result':
                return (
                    <div className="relative w-full h-full bg-black">
                        {resultImage && <img src={resultImage} alt="Virtual try-on result" className="w-full h-full object-contain" />}
                        {firstPassImage && (
                            <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                                <button
                                    onClick={() => setShowFirstPassDebug(prev => !prev)}
                                    className="px-3 py-1 text-xs rounded-full bg-white/20 text-white border border-white/30 backdrop-blur"
                                >
                                    {showFirstPassDebug ? 'Ocultar captura' : 'Ver captura (debug)'}
                                </button>
                                {showFirstPassDebug && (
                                    <div className="bg-black/70 p-2 rounded-lg border border-white/20 shadow-lg">
                                        <p className="text-[10px] text-white text-right mb-1">Captura inicial (depuracion)</p>
                                        <img src={firstPassImage} alt="Captura inicial" className="w-40 h-40 object-contain rounded" />
                                    </div>
                                )}
                            </div>
                        )}
                        <AnimatePresence>
                        {showDetails && (
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 backdrop-blur-lg p-6 rounded-t-2xl"
                                onPanEnd={(event, info) => { if (info.offset.y > 100) setShowDetails(false); }}
                            >
                                <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => setShowDetails(false)}></div>
                                <h2 className="text-3xl font-serif text-white">{item?.name}</h2>
                                <p className="text-xl text-[var(--primary-color)] my-2">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item?.price || 0)}</p>
                                <p className="text-gray-300 text-sm mb-6">{item?.description.substring(0, 150)}...</p>
                                <Button variant="primary" className="w-full" onClick={() => logEvent(EventType.CLICK_BUY, item?.id || '')}>Quiero esta joya</Button>
                            </motion.div>
                        )}
                        </AnimatePresence>
                         {!showDetails && (
                            <button onClick={() => setShowDetails(true)} className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-black bg-opacity-50 rounded-full text-white text-sm">
                                Ver Detalles
                            </button>
                        )}
                    </div>
                );
        }
    };

    const handleBack = () => {
        stopCamera();
        navigate(-1);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 z-50">
            <button onClick={handleBack} className="absolute top-4 left-4 z-20 text-white bg-black bg-opacity-50 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {renderContent()}
        </div>
    );
};

export default TryOnPage;
