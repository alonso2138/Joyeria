import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '../components/ui/Button';
import { CustomJewelOptions } from '../types';
import { useConfig } from '../hooks/useConfig';
import Spinner from '../components/ui/Spinner';

type StepId = 'tipo' | 'material' | 'piedra' | 'talla' | 'grabado' | 'resumen';

const stepOrder: StepId[] = ['tipo', 'material', 'piedra', 'talla', 'grabado', 'resumen'];

const cardMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25 },
};

const CustomizePage: React.FC = () => {
  const { config, isLoading: configLoading } = useConfig();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<StepId>('tipo');
  const [options, setOptions] = useState<CustomJewelOptions>({ pieceType: '', material: '', stonesOrColors: '', measurements: '', engraving: '', description: '' });
  const [sizeValue, setSizeValue] = useState<number | null>(null);
  const [errors, setErrors] = useState<string | null>(null);

  const customization = config?.customizationOptions;

  const sizeConfig = useMemo(() => {
    if (!customization?.sizePresets) return { label: 'Talla', unit: '', min: 0, max: 100, step: 1, description: '' };
    return customization.sizePresets[options.pieceType] || Object.values(customization.sizePresets)[0];
  }, [options.pieceType, customization]);

  useEffect(() => {
    if (sizeConfig) {
      setSizeValue(sizeConfig.min);
      const label = sizeConfig.label;
      const valueText = sizeConfig.unit === 'talla' ? `Talla ${sizeConfig.min}` : `${sizeConfig.min} ${sizeConfig.unit}`;
      setOptions(prev => ({ ...prev, measurements: `${label}: ${valueText}` }));
    }
  }, [sizeConfig]);

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

  const OptionCard = ({ option, selected, onSelect, helper }: { option: any; selected: boolean; onSelect: () => void; helper?: string; key?: any }) => (
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

  if (configLoading) return <Spinner text="Cargando configuración..." />;

  const summaryLines = [
    { label: 'Tipo', value: options.pieceType || '—' },
    { label: 'Material', value: options.material || '—' },
    { label: 'Detalle', value: options.stonesOrColors || 'Sin detalle' },
    { label: 'Medida', value: options.measurements || '—' },
    { label: 'Grabado', value: options.engraving || 'Sin grabado' },
  ];

  return (
    <div className="container mx-auto px-4 py-12 text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Diseño Personalizado</p>
          <h1 className="text-4xl font-serif">{config?.uiLabels?.customizationTitle || "Diseña tu pieza"}</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">{config?.uiLabels?.customizationSubtitle || "Personaliza cada detalle a tu gusto"}</p>
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
                    <p className="text-sm text-gray-300">Escoge el tipo de producto base.</p>
                  </div>
                  <span className="text-sm text-gray-400">Obligatorio</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {customization?.pieceTypes?.map((opt: any) => (
                    <OptionCard
                      key={opt.id}
                      option={opt}
                      selected={options.pieceType === opt.id}
                      onSelect={() => setOptions(prev => ({ ...prev, pieceType: opt.id }))}
                      helper={opt.label}
                    />
                  ))}
                </div>
              </StepWrapper>
            )}

            {currentStep === 'material' && (
              <StepWrapper key="material">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-serif">2. Material</h2>
                    <p className="text-sm text-gray-300">Elige el material de acabado.</p>
                  </div>
                  <span className="text-sm text-gray-400">Obligatorio</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {customization?.materials?.map((opt: any) => (
                    <OptionCard
                      key={opt.id}
                      option={opt}
                      selected={options.material === opt.label}
                      onSelect={() => setOptions(prev => ({ ...prev, material: opt.label }))}
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
                    <h2 className="text-2xl font-serif">3. Detalles y Piedras</h2>
                    <p className="text-sm text-gray-300">Añade gemas o detalles adicionales.</p>
                  </div>
                  <span className="text-sm text-gray-400">Opcional</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {customization?.stones?.map((opt: any) => (
                    <OptionCard
                      key={opt.id}
                      option={opt}
                      selected={options.stonesOrColors === opt.label}
                      onSelect={() => setOptions(prev => ({ ...prev, stonesOrColors: opt.label }))}
                      helper={opt.label}
                    />
                  ))}
                </div>
              </StepWrapper>
            )}

            {currentStep === 'talla' && (
              <StepWrapper key="talla">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-serif">4. Medidas</h2>
                    <p className="text-sm text-gray-300">{sizeConfig.description}</p>
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
                    <h2 className="text-2xl font-serif">5. Otros detalles</h2>
                    <p className="text-sm text-gray-300">Anota cualquier preferencia adicional.</p>
                  </div>
                  <span className="text-sm text-gray-400">Opcional</span>
                </div>
                <div className="space-y-3">
                  <input
                    value={options.engraving || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, engraving: e.target.value }))}
                    placeholder="Grabado, fecha, iniciales..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-800 focus:ring-2 focus:ring-[var(--primary-color)]"
                  />
                  <textarea
                    value={options.description || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Notas adicionales..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-800 focus:ring-2 focus:ring-[var(--primary-color)]"
                  />
                </div>
              </StepWrapper>
            )}

            {currentStep === 'resumen' && (
              <StepWrapper key="resumen">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-serif">6. Resumen</h2>
                    <p className="text-sm text-gray-300">Verifica tu configuración.</p>
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
                    <p className="text-sm text-gray-300 mb-3">Generaremos una propuesta basada en tus elecciones.</p>
                    <div className="mt-4 flex flex-col gap-2">
                      <Button variant="primary" type="submit" className="w-full">Finalizar diseño</Button>
                      <Button variant="outline" type="button" onClick={() => goTo('tipo')}>Reiniciar</Button>
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
