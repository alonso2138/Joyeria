import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { CustomJewelOptions, CustomRequestPayload, GeneratedJewelResult } from '../types';
import { createCustomRequest, logWidgetEvent } from '../services/api';
import { generateCustomJewelWithTryOn, generateCustomJewelRender } from '../services/geminiService';
import { trackIfAvailable } from '../services/tracking';
import { useConfig } from '../hooks/useConfig';

type Step = 'rendering' | 'result' | 'tryon-capture' | 'tryon-processing' | 'tryon-result';

const compressFromVideo = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
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
  ctx?.drawImage(video, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL('image/jpeg', 0.7);
};

const CustomResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { config } = useConfig();
  const options = (location.state as { options?: CustomJewelOptions })?.options;

  const [step, setStep] = useState<Step>('rendering');
  const [designResult, setDesignResult] = useState<GeneratedJewelResult | null>(null);
  const [tryOnResult, setTryOnResult] = useState<GeneratedJewelResult | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [showContact, setShowContact] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!options) {
      navigate('/personalizar');
    }
  }, [options, navigate]);

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
        console.error(err);
        setError('No se pudo acceder a la cámara. Concede permisos o usa otra foto.');
      }
    }
  }, []);

  useEffect(() => {
    if (step === 'tryon-capture') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [step, startCamera, stopCamera]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !options) return;
    setStep('tryon-processing');
    setError(null);
    const base64 = compressFromVideo(videoRef.current, canvasRef.current);
    stopCamera(); // ensure camera is off right after capture
    if (!base64) {
      setError('No se pudo capturar la foto. Intenta nuevamente.');
      setStep('tryon-capture');
      return;
    }
    try {
      const generated = await generateCustomJewelWithTryOn(base64, options, config);
      setTryOnResult(generated);

      // Log widget event if in demo mode with linkedApiKey
      if (config?.linkedApiKey) {
        logWidgetEvent(config.linkedApiKey, 'TRYON_SUCCESS', {
          itemId: 'custom-jewelry',
          pieceType: options.pieceType,
          material: options.material
        });
      }

      trackIfAvailable('try-on');
      setStep('tryon-result');
    } catch (err) {
      console.error(err);
      setError('No pudimos generar la imagen. Intentalo otra vez.');
      setStep('tryon-capture');
    }
  };

  useEffect(() => {
    const renderDesign = async () => {
      if (!options) return;
      setStep('rendering');
      setError(null);
      try {
        const generated = await generateCustomJewelRender(options, config);
        setDesignResult(generated);
        trackIfAvailable('personalizada-generada');
        setStep('result');
        const summary = [
          `Tipo: ${options.pieceType}`,
          `Material: ${options.material}`,
          options.measurements ? `Medidas: ${options.measurements}` : '',
          options.stonesOrColors ? `Piedras/colores: ${options.stonesOrColors}` : '',
          options.engraving ? `Grabado: ${options.engraving}` : '',
          options.description ? `Notas: ${options.description}` : '',
        ].filter(Boolean).join('\n');
        setContactMessage(summary);
      } catch (err) {
        console.error(err);
        setError('No pudimos generar el render. Intenta de nuevo.');
        setStep('result');
      }
    };
    renderDesign();
  }, [options]);

  const renderCapture = () => (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover"></video>
      <canvas ref={canvasRef} className="hidden"></canvas>
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      <div className="z-10 text-center text-white p-4">
        <h2 className="text-3xl font-serif">Captura una foto</h2>
        <p className="mt-2">Acerca la zona donde quieres la joya y mantenla centrada.</p>
      </div>
      <button onClick={handleCapture} className="absolute bottom-10 z-10 w-20 h-20 bg-white rounded-full border-4 border-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white"></button>
    </div>
  );

  if (!options) return null;

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designResult && !tryOnResult) return;
    if (!options) return;
    try {
      const payload: CustomRequestPayload = {
        ...options,
        optionsJson: JSON.stringify(options),
        details: options.description,
        imageBase64: (tryOnResult || designResult)?.imageBase64,
        customerName,
        customerEmail,
        customerPhone,
      };
      const saved = await createCustomRequest(payload);
      setSavingId(saved.id);
      setShowContact(false);
    } catch (err) {
      console.error('Error saving custom request', err);
      setError('No pudimos enviar tu contacto. Intenta de nuevo.');
    }
  };

  const handleBack = () => {
    stopCamera();
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 text-white z-50">
      <button onClick={handleBack} className="absolute top-4 left-4 z-20 text-white bg-black bg-opacity-50 rounded-full p-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {step === 'rendering' && (
        <div className="h-full flex flex-col items-center justify-center">
          <Spinner text="Generando el render de tu joya..." />
          <p className="mt-4 text-gray-300 px-6 text-center">Usamos las opciones que marcaste para crear un render limpio.</p>
        </div>
      )}

      {step === 'result' && designResult && (
        <div className="h-full overflow-y-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="bg-black rounded-lg overflow-hidden shadow-lg flex items-center justify-center min-h-[60vh]">
              <img src={designResult.imageBase64} alt="Resultado personalizado" className="max-h-[70vh] object-contain" />
            </div>
            <div className="space-y-6 bg-gray-950 rounded-lg p-6 border border-gray-800">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">Resumen</p>
                <h2 className="text-2xl font-serif">Tu diseño</h2>
                <div className="text-gray-300 space-y-1 text-sm">
                  <p><strong>Tipo:</strong> {options.pieceType}</p>
                  <p><strong>Material:</strong> {options.material}</p>
                  {options.measurements && <p><strong>Medidas:</strong> {options.measurements}</p>}
                  {options.stonesOrColors && <p><strong>Piedra:</strong> {options.stonesOrColors}</p>}
                  {options.engraving && <p><strong>Grabado:</strong> {options.engraving}</p>}
                  {options.description && <p className="whitespace-pre-wrap"><strong>Notas:</strong> {options.description}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button variant="primary" className="w-full" onClick={() => setShowContact(true)}>Contactar</Button>
                <Button variant="secondary" className="w-full" onClick={() => setStep('tryon-capture')}>Probar virtual try-on</Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/personalizar')}>Volver a personalizar</Button>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          </div>
        </div>
      )}

      {step === 'tryon-capture' && renderCapture()}

      {step === 'tryon-processing' && (
        <div className="h-full flex flex-col items-center justify-center">
          <Spinner text="Aplicando tu joya en la foto..." />
          <p className="mt-4 text-gray-300 px-6 text-center">Usamos tu foto solo para crear la vista previa y la descartamos después.</p>
        </div>
      )}

      {step === 'tryon-result' && tryOnResult && (
        <div className="h-full overflow-y-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="bg-black rounded-lg overflow-hidden shadow-lg flex items-center justify-center min-h-[60vh]">
              <img src={tryOnResult.imageBase64} alt="Resultado try-on" className="max-h-[70vh] object-contain" />
            </div>
            <div className="space-y-6 bg-gray-950 rounded-lg p-6 border border-gray-800">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">Vista en tu foto</p>
                <h2 className="text-2xl font-serif">Ajustes</h2>
                <p className="text-gray-300 text-sm">Si quieres otra foto, vuelve a capturar o regresa al render limpio.</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="primary" className="w-full" onClick={() => setShowContact(true)}>Contactar</Button>
                <Button variant="secondary" className="w-full" onClick={() => setStep('tryon-capture')}>Tomar otra foto</Button>
                <Button variant="outline" className="w-full" onClick={() => setStep('result')}>Volver al render</Button>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          </div>
        </div>
      )}

      {showContact && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-6 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Compartir contacto</h3>
              <button onClick={() => setShowContact(false)} className="text-gray-400 hover:text-white">Cerrar</button>
            </div>
            <form className="space-y-3" onSubmit={submitContact}>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-sm focus:ring-2 focus:ring-[var(--primary-color)]"
              />
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Teléfono / WhatsApp"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-sm focus:ring-2 focus:ring-[var(--primary-color)]"
              />
              <input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-sm focus:ring-2 focus:ring-[var(--primary-color)]"
              />
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-sm focus:ring-2 focus:ring-[var(--primary-color)]"
              />
              <Button variant="primary" type="submit" className="w-full">Enviar</Button>
            </form>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        </div>
      )}

      {error && step === 'rendering' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-700 bg-opacity-80 text-white px-4 py-2 rounded">
          {error}
        </div>
      )}

      {savingId && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-700 bg-opacity-80 text-white px-4 py-2 rounded">
          Hemos recibido tus datos. ID: {savingId}
        </div>
      )}
    </div>
  );
};

export default CustomResultPage;
