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
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraReady(false);
    }, []);

    const startCamera = useCallback(async () => {
        if (streamRef.current) stopCamera();

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraStatus('denied');
            setCameraError('Tu dispositivo no permite abrir la cámara.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode }
            });
            streamRef.current = stream;
            setCameraStatus('granted');
            setCameraError(null);

            // Try to attach immediately if ref exists
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.warn('[useTryOn] Play error:', e));
                videoRef.current.onloadedmetadata = () => {
                    if (videoRef.current && videoRef.current.videoWidth > 0) {
                        setCameraReady(true);
                    }
                };
            }
        } catch (err) {
            console.error('[useTryOn] Camera error:', err);
            setCameraStatus('denied');
            setCameraError('No se pudo acceder a la cámara.');
        }
    }, [facingMode, stopCamera]);

    // Effect to attach stream when video element appears (handles race condition)
    useEffect(() => {
        if (cameraStatus === 'granted' && streamRef.current && videoRef.current) {
            const video = videoRef.current;
            if (!video.srcObject) {
                video.srcObject = streamRef.current;
                video.play().catch(e => console.warn('[useTryOn] Play error:', e));
            }

            const handleMetadata = () => {
                if (video.videoWidth > 0) {
                    setCameraReady(true);
                }
            };

            if (video.videoWidth > 0) {
                setCameraReady(true);
            } else {
                video.addEventListener('loadedmetadata', handleMetadata);
                video.addEventListener('canplay', handleMetadata);
                return () => {
                    video.removeEventListener('loadedmetadata', handleMetadata);
                    video.removeEventListener('canplay', handleMetadata);
                };
            }
        }
    }, [cameraStatus, facingMode]);

    const toggleCamera = useCallback(() => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }, []);

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
        setTryOnError(null);

        try {
            let userImageBase64 = providedBase64 || null;

            if (!userImageBase64 && cameraStatus === 'granted') {
                // Robust retry loop
                for (let i = 0; i < 10; i++) {
                    userImageBase64 = captureToBase64();
                    if (userImageBase64 && userImageBase64.length > 2000) break;
                    await new Promise(r => setTimeout(r, 200));
                }
            }

            if (!userImageBase64) throw new Error('No se pudo obtener una imagen.');

            setPreviewImage(userImageBase64);
            if (cameraStatus === 'granted') stopCamera();

            const overlayUrl = getImageUrl(selectedItem.overlayAssetUrl);
            const category = selectedItem.category || 'ring';

            const composed = await generateTryOnImage(userImageBase64, overlayUrl, category, config);

            setResultImage(composed);
            // Brief pause to show the change while blurred (managed by UI usually)
            await new Promise(r => setTimeout(r, 800));

            if (onSuccess) onSuccess(composed);
            setIsProcessing(false);
        } catch (err: any) {
            console.error('[useTryOn] Processing error:', err);
            const msg = err.message || 'Error al procesar la imagen.';
            setTryOnError(msg);
            if (onError) onError(msg);
            setIsProcessing(false);
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
