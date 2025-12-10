import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '../components/ui/Button';
import { CustomJewelOptions } from '../types';

type StepId = 'tipo' | 'material' | 'piedra' | 'talla' | 'grabado' | 'resumen';

const pieceOptions = [
  { value: 'Anillo', label: 'Anillo', accent: '#f5c14c', image: '/personalizar/tipo-anillo.jpg', gradient: 'radial-gradient(circle at 20% 30%, #f1cf6a, #0c0c0f 60%)' },
  { value: 'Collar', label: 'Collar', accent: '#8dd5ff', image: '/personalizar/tipo-collar.jpg', gradient: 'linear-gradient(135deg, #8dd5ff, #0a1018)' },
  { value: 'Pulsera', label: 'Pulsera', accent: '#e2b0ff', image: '/personalizar/tipo-pulsera.jpg', gradient: 'radial-gradient(circle at 70% 20%, #e2b0ff, #0b0b11 65%)' },
  { value: 'Pendientes', label: 'Pendientes', accent: '#f78fb3', image: '/personalizar/tipo-pendientes.jpg', gradient: 'linear-gradient(160deg, #f78fb3, #0b0d14)' },
];

const materialOptions = [
  { value: 'Oro amarillo', label: 'Oro amarillo', accent: '#f6d35f', image: '/personalizar/material-oro-amarillo.jpg', gradient: 'linear-gradient(135deg, #f6d35f, #171308)' },
  { value: 'Oro blanco', label: 'Oro blanco', accent: '#dfe5f2', image: '/personalizar/material-oro-blanco.jpg', gradient: 'linear-gradient(135deg, #eef2f7, #0f1116)' },
  { value: 'Plata', label: 'Plata', accent: '#cfd5dd', image: '/personalizar/material-plata.jpg', gradient: 'linear-gradient(135deg, #d8e0ea, #0d0f15)' },
  { value: 'Platino', label: 'Platino', accent: '#d2d7e3', image: '/personalizar/material-platino.jpg', gradient: 'linear-gradient(135deg, #d2d7e3, #0c0d12)' },
];

const stoneOptions = [
  { value: 'Sin piedra', label: 'Sin piedra', accent: '#888', image: '/personalizar/piedra-sin.jpg', gradient: 'linear-gradient(135deg, #3a3a3a, #0b0c0f)' },
  { value: 'Diamante', label: 'Diamante', accent: '#e2f2ff', image: '/personalizar/piedra-diamante.jpg', gradient: 'linear-gradient(135deg, #e2f2ff, #0d1017)' },
  { value: 'Zafiro', label: 'Zafiro', accent: '#6db5ff', image: '/personalizar/piedra-zafiro.jpg', gradient: 'linear-gradient(135deg, #6db5ff, #09111c)' },
  { value: 'Circonita', label: 'Circonita', accent: '#f3e6ff', image: '/personalizar/piedra-circonita.jpg', gradient: 'linear-gradient(135deg, #f3e6ff, #0f0f15)' },
  { value: 'Esmeralda', label: 'Esmeralda', accent: '#7ae4a8', image: '/personalizar/piedra-esmeralda.jpg', gradient: 'linear-gradient(135deg, #7ae4a8, #0a130f)' },
];

const sizePresets: Record<string, { label: string; unit: 'cm' | 'mm' | 'talla'; min: number; max: number; step: number; description: string }> = {
  Anillo: { label: 'Talla (ES)', unit: 'talla', min: 8, max: 24, step: 0.5, description: 'Talla numérica española' },
  Collar: { label: 'Longitud del collar', unit: 'cm', min: 36, max: 65, step: 1, description: 'Corto (36cm) a largo (65cm)' },
  Pulsera: { label: 'Longitud de pulsera', unit: 'cm', min: 14, max: 22, step: 0.5, description: 'Ajuste ceñido a holgado' },
  Pendientes: { label: 'Largo del pendiente', unit: 'mm', min: 4, max: 60, step: 1, description: 'De botón a cascada' },
};

const stepOrder: StepId[] = ['tipo', 'material', 'piedra', 'talla', 'grabado', 'resumen'];

const cardMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25 },
};

const CustomizePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<StepId>('tipo');
  const [options, setOptions] = useState<CustomJewelOptions>({ pieceType: '', material: '', stonesOrColors: '', measurements: '', engraving: '', description: '' });
  const [sizeValue, setSizeValue] = useState<number | null>(null);
  const [errors, setErrors] = useState<string | null>(null);

  const sizeConfig = useMemo(() => sizePresets[options.pieceType] || sizePresets.Anillo, [options.pieceType]);

  useEffect(() => {
    setSizeValue(sizeConfig.min);
    const label = sizeConfig.label;
    const valueText = sizeConfig.unit === 'talla' ? `Talla ${sizeConfig.min}` : `${sizeConfig.min} ${sizeConfig.unit}`;
    setOptions(prev => ({ ...prev, measurements: `${label}: ${valueText}` }));
  }, [sizeConfig.label, sizeConfig.min, sizeConfig.unit]);

  const goTo = (step: StepId) => {
    setErrors(null);
    setCurrentStep(step);
  };

  const validateStep = (step: StepId) => {
    if (step === 'tipo' && !options.pieceType) return 'Selecciona el tipo de pieza para continuar.';
    if (step === 'material' && !options.material) return 'Elige un material para continuar.';
    if (step === 'talla' && !options.measurements) return 'Define la talla/longitud para continuar.';
    return null;
  };

  const handleNext = () => {
    const message = validateStep(currentStep);
    if (message) return setErrors(message);
    const idx = stepOrder.indexOf(currentStep);
    const next = stepOrder[idx + 1] || 'resumen';
    setCurrentStep(next);
    setErrors(null);
  };

  const handlePrev = () => {
    const idx = stepOrder.indexOf(currentStep);
    const prev = stepOrder[idx - 1];
    if (prev) setCurrentStep(prev);
    setErrors(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const message = validateStep('talla') || validateStep('material') || validateStep('tipo');
    if (message) {
      setErrors(message);
      setCurrentStep(stepOrder.find(s => validateStep(s) === message) || 'tipo');
      return;
    }
    navigate('/personalizar/resultado', { state: { options } });
  };

  const OptionCard = ({ option, selected, onSelect, helper }: { option: { value: string; label: string; accent: string; image?: string; gradient: string }; selected: boolean; onSelect: () => void; helper?: string }) => (
    <motion.button
      type="button"
      className={`relative overflow-hidden rounded-xl border ${selected ? 'border-[var(--primary-color)] ring-2 ring-[var(--primary-color)]' : 'border-gray-800'} bg-gray-900/60 text-left transition`}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: `${option.gradient}${option.image ? `, url(${option.image})` : ''}`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/55 to-black/80" />
      <div className="relative p-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: option.accent }} />
          <p className="text-base font-semibold">{option.label}</p>
        </div>
        {helper && <p className="text-xs text-gray-300">{helper}</p>}
        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">Seleccionar</p>
      </div>
    </motion.button>
  );

  const StepWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <motion.div {...cardMotion} className="bg-black/40 rounded-2xl border border-gray-800 p-6 shadow-xl">
      {children}
    </motion.div>
  );

  const summaryLines = [
    { label: 'Tipo', value: options.pieceType || '—' },
    { label: 'Material', value: options.material || '—' },
    { label: 'Piedra', value: options.stonesOrColors || 'Sin piedra' },
    { label: 'Talla / longitud', value: options.measurements || '—' },
    { label: 'Grabado', value: options.engraving || 'Sin grabado' },
  ];

  return (
    <div className="container mx-auto px-4 py-12 text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Personalización guiada</p>
          <h1 className="text-4xl font-serif">Diseña tu joya a medida</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">Selecciona tipo, material, piedra y talla con controles fluidos. El resumen final genera el render y CTA.</p>
        </div>

        <div className="flex items-center gap-3">
          {stepOrder.map(step => {
            const idx = stepOrder.indexOf(step);
            const isActive = step === currentStep;
            const isDone = stepOrder.indexOf(currentStep) > idx;
            return (
              <div key={step} className="flex-1">
                <div className={`h-2 rounded-full ${isActive ? 'bg-[var(--primary-color)]' : isDone ? 'bg-gray-500' : 'bg-gray-800'}`} />
                <p className={`mt-2 text-xs uppercase tracking-[0.2em] ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {step}
                </p>
              </div>
            );
          })}
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {currentStep === 'tipo' && (
              <StepWrapper key="tipo">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-serif">1. Selección de tipo</h2>
                    <p className="text-sm text-gray-300">Anillo, collar, pulsera o pendientes. Prepara cada opción para su imagen de fondo.</p>
                  </div>
                  <span className="text-sm text-gray-400">Obligatorio</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {pieceOptions.map(opt => (
                    <OptionCard
                      key={opt.value}
                      option={opt}
                      selected={options.pieceType === opt.value}
                      onSelect={() => setOptions(prev => ({ ...prev, pieceType: opt.value }))}
                      helper={`Opción ${opt.label}`}
                    />
                  ))}
                </div>
              </StepWrapper>
            )}

            {currentStep === 'material' && (
              <StepWrapper key="material">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-serif">2. Material base</h2>
                    <p className="text-sm text-gray-300">Oro amarillo, oro blanco, plata o platino. Pensado para superponer una imagen de referencia.</p>
                  </div>
                  <span className="text-sm text-gray-400">Obligatorio</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {materialOptions.map(opt => (
                    <OptionCard
                      key={opt.value}
                      option={opt}
                      selected={options.material === opt.value}
                      onSelect={() => setOptions(prev => ({ ...prev, material: opt.value }))}
                      helper={opt.label}
                    />
                  ))}
                </div>
              </StepWrapper>
            )}

            {currentStep === 'piedra' && (
              <StepWrapper key="piedra">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-serif">3. Piedra (opcional)</h2>
                    <p className="text-sm text-gray-300">Diamante, zafiro, circonita u otra gema. Escoge “Sin piedra” si no aplica.</p>
                  </div>
                  <span className="text-sm text-gray-400">Opcional</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {stoneOptions.map(opt => (
                    <OptionCard
                      key={opt.value}
                      option={opt}
                      selected={(options.stonesOrColors || 'Sin piedra') === opt.value}
                      onSelect={() => setOptions(prev => ({ ...prev, stonesOrColors: opt.value === 'Sin piedra' ? '' : opt.value }))}
                      helper={opt.value === 'Sin piedra' ? 'Liso, sin gema' : opt.label}
                    />
                  ))}
                </div>
              </StepWrapper>
            )}

            {currentStep === 'talla' && (
              <StepWrapper key="talla">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-serif">4. Talla / longitud</h2>
                    <p className="text-sm text-gray-300">{sizeConfig.description}. Usa el slider animado.</p>
                  </div>
                  <span className="text-sm text-gray-400">Obligatorio</span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-200">
                    <span>{sizeConfig.label}</span>
                    <span className="font-semibold text-[var(--primary-color)]">
                      {sizeValue !== null ? (sizeConfig.unit === 'talla' ? `Talla ${sizeValue}` : `${sizeValue} ${sizeConfig.unit}`) : '—'}
                    </span>
                  </div>
                  <motion.input
                    type="range"
                    min={sizeConfig.min}
                    max={sizeConfig.max}
                    step={sizeConfig.step}
                    value={sizeValue ?? sizeConfig.min}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSizeValue(val);
                      const valueText = sizeConfig.unit === 'talla' ? `Talla ${val}` : `${val} ${sizeConfig.unit}`;
                      setOptions(prev => ({ ...prev, measurements: `${sizeConfig.label}: ${valueText}` }));
                    }}
                    className="w-full accent-[var(--primary-color)]"
                    whileTap={{ scale: 0.99 }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{sizeConfig.min} {sizeConfig.unit === 'talla' ? '' : sizeConfig.unit}</span>
                    <span>{sizeConfig.max} {sizeConfig.unit === 'talla' ? '' : sizeConfig.unit}</span>
                  </div>
                </div>
              </StepWrapper>
            )}

            {currentStep === 'grabado' && (
              <StepWrapper key="grabado">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-serif">5. Grabado (opcional)</h2>
                    <p className="text-sm text-gray-300">Texto breve para el interior o reverso. Se incluirá en el prompt.</p>
                  </div>
                  <span className="text-sm text-gray-400">Opcional</span>
                </div>
                <div className="space-y-3">
                  <input
                    value={options.engraving || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, engraving: e.target.value }))}
                    placeholder="Iniciales, fecha, tipografía..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-800 focus:ring-2 focus:ring-[var(--primary-color)]"
                  />
                  <textarea
                    value={options.description || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Notas adicionales: ajuste, preferencia de color, contexto de uso."
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-800 focus:ring-2 focus:ring-[var(--primary-color)]"
                  />
                </div>
              </StepWrapper>
            )}

            {currentStep === 'resumen' && (
              <StepWrapper key="resumen">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-serif">6. Resumen y CTA</h2>
                    <p className="text-sm text-gray-300">Verifica los datos antes de generar el render.</p>
                  </div>
                  <span className="text-sm text-gray-400">Checklist</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {summaryLines.map(item => (
                      <div key={item.label} className="flex items-center justify-between bg-gray-900/60 border border-gray-800 rounded-lg px-4 py-3">
                        <span className="text-gray-400 text-sm">{item.label}</span>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gradient-to-br from-[var(--primary-color)]/15 to-transparent border border-[var(--primary-color)]/30 rounded-lg p-4">
                    <p className="text-sm text-gray-300 mb-3">Generaremos un prompt con estas características y pasaremos al CTA final.</p>
                    <ul className="text-sm text-gray-200 space-y-1 list-disc list-inside">
                      <li>Tipo definido y material listo</li>
                      <li>Piedra opcional o diseño liso</li>
                      <li>Talla/longitud con slider animado</li>
                      <li>Grabado opcional incluido</li>
                    </ul>
                    <div className="mt-4 flex flex-col gap-2">
                      <Button variant="primary" type="submit" className="w-full">Generar mi joya</Button>
                      <Button variant="outline" type="button" onClick={() => goTo('tipo')}>Reiniciar selección</Button>
                    </div>
                  </div>
                </div>
              </StepWrapper>
            )}
          </AnimatePresence>

          {errors && <p className="text-red-400 text-sm">{errors}</p>}

          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Salir</Button>
            <div className="flex gap-3 justify-end">
              {currentStep !== 'tipo' && <Button variant="outline" type="button" onClick={handlePrev}>Anterior</Button>}
              {currentStep !== 'resumen' ? (
                <Button variant="primary" type="button" onClick={handleNext}>Siguiente</Button>
              ) : (
                <Button variant="primary" type="submit">Generar</Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomizePage;
