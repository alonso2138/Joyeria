import { useState, useRef, useCallback, useEffect } from 'react';
import { generateTryOnImage } from '../services/geminiService';
import { getImageUrl } from '../services/api';

interface TryOnHookOptions {
    selectedItem: any;
    config: any;
    onSuccess?: (result: string) => void;
    onError?: (error: string) => void;
    isMirrorMode?: boolean;
}

export const useTryOn = ({
    selectedItem,
    config,
    onSuccess,
    onError,
    isMirrorMode = true
}: TryOnHookOptions) => {
    const [cameraStatus, setCameraStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [tryOnError, setTryOnError] = useState<string | null>(null);
    const [processingPhase, setProcessingPhase] = useState<'idle' | 'capturing' | 'detecting' | 'rendering' | 'finalizing'>('idle');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isProcessingRef = useRef(false);

    const metadata = config?.tryOnMetadata || {};
    const itemKey = selectedItem?.category?.toLowerCase() || 'default';
    const itemMetadata = metadata[itemKey] || metadata['default'] || {
        countdown: 0,
        poseAdvice: 'Colócate en el centro.',
        loadingText: 'Procesando...'
    };

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraReady(false);
        setCameraStatus('idle');
    }, []);

    const startCamera = useCallback(async () => {
        // Stop any existing stream first to ensure we can switch sensors
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraStatus('denied');
            setCameraError('Cámara no soportada.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
            });

            streamRef.current = stream;
            setCameraStatus('granted');
            setCameraError(null);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => { });
            }
        } catch (err) {
            console.error('[useTryOn] startCamera error:', err);
            setCameraStatus('denied');
            setCameraError('Error al acceder a la cámara.');
        }
    }, [facingMode, cameraStatus]);

    // Robust attachment effect
    useEffect(() => {
        const video = videoRef.current;
        if (cameraStatus === 'granted' && streamRef.current && video) {
            if (video.srcObject !== streamRef.current) {
                video.srcObject = streamRef.current;
                video.play().catch(() => { });
            }

            const checkReady = () => {
                if (video.videoWidth > 0) setCameraReady(true);
            };

            video.addEventListener('loadedmetadata', checkReady);
            video.addEventListener('canplay', checkReady);
            if (video.videoWidth > 0) setCameraReady(true);

            return () => {
                video.removeEventListener('loadedmetadata', checkReady);
                video.removeEventListener('canplay', checkReady);
            };
        }
    }, [cameraStatus]); // Only re-run when status changes to granted

    const toggleCamera = useCallback(() => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }, []);

    // Watch for facingMode changes to restart camera if it was already on
    useEffect(() => {
        if (cameraStatus === 'granted') {
            startCamera();
        }
    }, [facingMode]);

    const captureToBase64 = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return null;

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
            if (isMirrorMode && facingMode === 'user') {
                ctx.translate(targetWidth, 0);
                ctx.scale(-1, 1);
            }
            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            ctx.restore();
        }
        return canvas.toDataURL('image/jpeg', 0.8);
    }, [isMirrorMode, facingMode]);

    const executeCaptureAndAI = useCallback(async (providedBase64?: string) => {
        if (isProcessingRef.current || !selectedItem) return;

        isProcessingRef.current = true;
        setIsProcessing(true);
        setProcessingPhase('capturing');
        setTryOnError(null);

        try {
            let userImageBase64 = providedBase64 || null;
            let isCropped = false;

            // 1. CAPTURA INMEDIATA (Freeze Frame)
            // Esto soluciona ambos problemas: congela la imagen para que no te veas moviéndote
            // y asegura que la IA procese la foto EXACTA del momento del disparo.
            if (!userImageBase64 && cameraStatus === 'granted' && videoRef.current) {
                // Capturamos el frame actual al canvas de forma síncrona/inmediata
                userImageBase64 = captureToBase64();

                if (userImageBase64) {
                    setPreviewImage(userImageBase64); // Mostramos el preview inmediatamente
                    stopCamera(); // Apagamos la cámara ya
                }
            }

            // 2. PROCESAMIENTO DE VISIÓN (Smart Crop + 3D Pose)
            setProcessingPhase('detecting');
            // Intentamos buscar la mano/cara sobre la imagen ya capturada
            let orientationDesc = '';
            if (userImageBase64 && !providedBase64) {
                try {
                    const { detectAndCrop } = await import('../services/visionService');
                    const category = (selectedItem.category || 'anillo').toLowerCase();

                    // Creamos un canvas temporal o imagen para que MediaPipe lo procese
                    const img = new Image();
                    img.src = userImageBase64;
                    await new Promise(r => img.onload = r);

                    const cropResult = await detectAndCrop(img as any, category);
                    if (cropResult) {
                        userImageBase64 = cropResult.image;
                        isCropped = true;
                        if (cropResult.orientation) {
                            orientationDesc = cropResult.orientation.description;
                        }
                        console.log(`[TryOn] Smart Crop + Orientation successful for ${category}`);
                    } else {
                        // FALLBACK: Si no detecta nada, forzamos un recorte central "Best Effort"
                        // Esto evita que la IA reciba fotos de toda la habitación y pierda la escala.
                        const { getFallbackCrop } = await import('../services/visionService');
                        const fallback = getFallbackCrop(img as any);
                        userImageBase64 = fallback.image;
                        isCropped = true; // Lo tratamos como macro para la IA
                        console.log(`[TryOn] Detection failed, using Center-Weighted Fallback`);
                    }
                } catch (e) {
                    console.warn('[TryOn] Vision service error:', e);
                }
            }

            if (!userImageBase64) throw new Error('No se pudo obtener una imagen.');

            const overlayUrl = getImageUrl(selectedItem.overlayAssetUrl);
            const category = (selectedItem.category || 'anillo').toLowerCase();
            const aiModel = selectedItem.aiModel;

            const requestConfig = {
                ...config,
                isMacro: isCropped,
                orientationDesc,
                options: { ...(selectedItem?.options || {}), ...(config?.options || {}) }
            };

            setProcessingPhase('rendering');
            const composed = await generateTryOnImage(userImageBase64, overlayUrl, category, requestConfig, aiModel);

            setProcessingPhase('finalizing');
            setResultImage(composed);
            // Breve pausa para mostrar el resultado
            await new Promise(r => setTimeout(r, 800));

            if (onSuccess) onSuccess(composed);
            setIsProcessing(false);
            setProcessingPhase('idle');
        } catch (err: any) {
            console.error('[useTryOn] Processing error:', err);
            const msg = err.message || 'Error al procesar la imagen.';
            setTryOnError(msg);
            if (onError) onError(msg);
            setIsProcessing(false);
            setProcessingPhase('idle');
            setPreviewImage(null);
            if (cameraStatus === 'granted') startCamera();
        } finally {
            isProcessingRef.current = false;
        }
    }, [selectedItem, config, cameraStatus, captureToBase64, stopCamera, startCamera, onSuccess, onError]);

    const triggerCapture = useCallback(() => {
        if (isProcessing || countdown !== null) return;

        const waitSeconds = itemMetadata.countdown || 0;
        if (waitSeconds > 0) {
            setCountdown(waitSeconds);
            const timerId = setInterval(() => {
                setCountdown(prev => {
                    if (prev === 1) {
                        clearInterval(timerId);
                        setCountdown(null);
                        executeCaptureAndAI();
                        return null;
                    }
                    return prev !== null ? prev - 1 : null;
                });
            }, 1000);
        } else {
            executeCaptureAndAI();
        }
    }, [isProcessing, countdown, itemMetadata.countdown, executeCaptureAndAI]);

    const reset = useCallback(() => {
        setPreviewImage(null);
        setResultImage(null);
        setTryOnError(null);
        setIsProcessing(false);
        setProcessingPhase('idle');
        setCountdown(null);
        if (cameraStatus === 'granted') startCamera();
    }, [cameraStatus, startCamera]);

    return {
        cameraStatus,
        cameraError,
        cameraReady,
        isProcessing,
        countdown,
        previewImage,
        resultImage,
        tryOnError,
        processingPhase,
        facingMode,
        videoRef,
        canvasRef,
        itemMetadata,
        startCamera,
        stopCamera,
        toggleCamera,
        triggerCapture,
        executeCaptureAndAI,
        reset,
        setPreviewImage
    };
};
