import React, { useState, useEffect } from 'react';
import { getCampaignConfig, updateCampaignConfig } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

const AdminCampaignPage: React.FC = () => {
    const { token } = useAuth();
    const [config, setConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'branding' | 'ui' | 'ai'>('branding');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await getCampaignConfig();
                setConfig(data);
            } catch (error) {
                console.error('Failed to fetch config:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        if (!token) return;
        setIsSaving(true);
        try {
            await updateCampaignConfig(config, token);
            alert('Configuración actualizada con éxito');
        } catch (error) {
            console.error('Failed to update config:', error);
            alert('Error al actualizar la configuración');
        } finally {
            setIsSaving(false);
        }
    };

    const updateNestedField = (section: string, field: string, value: any) => {
        setConfig((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const updateDeepField = (section: string, subSection: string, field: string, value: any) => {
        setConfig((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [subSection]: {
                    ...prev[section][subSection],
                    [field]: value
                }
            }
        }));
    };

    if (isLoading) return <Spinner text="Cargando configuración..." />;
    if (!config) return <div className="p-8 text-center text-red-400">Error al cargar la configuración.</div>;

    const inputClasses = "mt-1 block w-full bg-gray-900/50 border border-gray-700 rounded-lg shadow-sm text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all";
    const labelClasses = "block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5";
    const sectionClasses = "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300";

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-white">Gestión de Campaña</h1>
                    <p className="text-gray-400 mt-2">Control total sobre la identidad y comportamiento de la plataforma.</p>
                </div>
                <Button variant="primary" onClick={handleSave} disabled={isSaving} className="shadow-lg shadow-[var(--primary-color)]/20 px-8">
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>

            <div className="flex overflow-x-auto gap-2 mb-8 border-b border-gray-800 pb-px scrollbar-hide">
                {([
                    { id: 'branding', label: 'Branding' },
                    { id: 'ui', label: 'Interfaz (UI)' },
                    { id: 'ai', label: 'AI Prompts' },
                    { id: 'saas', label: 'SaaS (Planes)' }
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-4 px-6 text-sm font-medium tracking-wide transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                            ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                            : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-gray-900/30 backdrop-blur-md p-6 md:p-10 rounded-3xl border border-gray-800 shadow-2xl">
                {activeTab === 'branding' && (
                    <div className={sectionClasses}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <label className={labelClasses}>Color Primario</label>
                                <div className="flex gap-3">
                                    <input type="color" value={config.branding.primaryColor} onChange={(e) => updateNestedField('branding', 'primaryColor', e.target.value)} className="h-11 w-14 bg-transparent border border-gray-700 rounded-lg cursor-pointer p-0.5" />
                                    <input type="text" value={config.branding.primaryColor} onChange={(e) => updateNestedField('branding', 'primaryColor', e.target.value)} className={inputClasses} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Color Secundario</label>
                                <div className="flex gap-3">
                                    <input type="color" value={config.branding.secondaryColor} onChange={(e) => updateNestedField('branding', 'secondaryColor', e.target.value)} className="h-11 w-14 bg-transparent border border-gray-700 rounded-lg cursor-pointer p-0.5" />
                                    <input type="text" value={config.branding.secondaryColor} onChange={(e) => updateNestedField('branding', 'secondaryColor', e.target.value)} className={inputClasses} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Color de Acento</label>
                                <div className="flex gap-3">
                                    <input type="color" value={config.branding.accentColor} onChange={(e) => updateNestedField('branding', 'accentColor', e.target.value)} className="h-11 w-14 bg-transparent border border-gray-700 rounded-lg cursor-pointer p-0.5" />
                                    <input type="text" value={config.branding.accentColor} onChange={(e) => updateNestedField('branding', 'accentColor', e.target.value)} className={inputClasses} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className={labelClasses}>Nombre de Marca</label>
                                <input type="text" value={config.branding.brandName} onChange={(e) => updateNestedField('branding', 'brandName', e.target.value)} className={inputClasses} />
                            </div>
                            <div>
                                <label className={labelClasses}>Gradient de Fondo</label>
                                <input type="text" value={config.branding.backgroundGradient} onChange={(e) => updateNestedField('branding', 'backgroundGradient', e.target.value)} className={inputClasses} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                            <div>
                                <label className={labelClasses}>Logo Principal (Cabecera)</label>
                                <input type="text" value={config.branding.logoMainUrl} onChange={(e) => updateNestedField('branding', 'logoMainUrl', e.target.value)} className={inputClasses} placeholder="/logo.png" />
                            </div>
                            <div>
                                <label className={labelClasses}>Logo Icono (Favicon)</label>
                                <input type="text" value={config.branding.logoIconUrl} onChange={(e) => updateNestedField('branding', 'logoIconUrl', e.target.value)} className={inputClasses} placeholder="/favicon.ico" />
                            </div>
                            <div>
                                <label className={labelClasses}>Diseño del Obturador (Try-On)</label>
                                <select
                                    value={config.branding.shutterDesign || 'default'}
                                    onChange={(e) => updateNestedField('branding', 'shutterDesign', e.target.value)}
                                    className={inputClasses}
                                >
                                    <option value="default">Estándar (Texto en el centro)</option>
                                    <option value="special">Especial (Texto arriba + Encuadre)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ui' && (
                    <div className={sectionClasses}>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className={labelClasses}>Título Hero (Home)</label>
                                <input type="text" value={config.uiLabels.heroTitle} onChange={(e) => updateNestedField('uiLabels', 'heroTitle', e.target.value)} className={inputClasses} />
                            </div>
                            <div>
                                <label className={labelClasses}>Subtítulo Hero (Home)</label>
                                <input type="text" value={config.uiLabels.heroSubtitle} onChange={(e) => updateNestedField('uiLabels', 'heroSubtitle', e.target.value)} className={inputClasses} />
                            </div>
                            <div>
                                <label className={labelClasses}>Instrucciones Try-On</label>
                                <textarea value={config.uiLabels.tryOnInstruction} onChange={(e) => updateNestedField('uiLabels', 'tryOnInstruction', e.target.value)} rows={2} className={inputClasses} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClasses}>Mensaje de Carga</label>
                                    <input type="text" value={config.uiLabels.loadingItems} onChange={(e) => updateNestedField('uiLabels', 'loadingItems', e.target.value)} className={inputClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>CTA Probador (Botón)</label>
                                    <input type="text" value={config.uiLabels.ctaTryOn} onChange={(e) => updateNestedField('uiLabels', 'ctaTryOn', e.target.value)} className={inputClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Botón de Compra</label>
                                    <input type="text" value={config.uiLabels.buyButton} onChange={(e) => updateNestedField('uiLabels', 'buyButton', e.target.value)} className={inputClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Sin Resultados</label>
                                    <input type="text" value={config.uiLabels.noItemsFound} onChange={(e) => updateNestedField('uiLabels', 'noItemsFound', e.target.value)} className={inputClasses} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className={sectionClasses}>
                        <div className="bg-blue-900/20 border border-blue-800/50 p-4 rounded-xl mb-6">
                            <p className="text-sm text-blue-200">
                                <b>Tip:</b> Usa los placeholders <code>{`{productType}`}</code>, <code>{`{pieceType}`}</code>, <code>{`{material}`}</code> y <code>{`{details}`}</code> para inyectar datos dinámicos.
                            </p>
                        </div>
                        <div className="space-y-8">
                            <div>
                                <label className={labelClasses}>Prompt Base del Probador (Try-On)</label>
                                <textarea
                                    value={config.aiPrompts.tryOnBasePrompt}
                                    onChange={(e) => updateNestedField('aiPrompts', 'tryOnBasePrompt', e.target.value)}
                                    rows={3}
                                    className={inputClasses}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClasses}>Prompt Diseño (Render)</label>
                                    <textarea
                                        value={config.aiPrompts.customJewelPrompt}
                                        onChange={(e) => updateNestedField('aiPrompts', 'customJewelPrompt', e.target.value)}
                                        rows={4}
                                        className={inputClasses}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Prompt Producto (Studio)</label>
                                    <textarea
                                        value={config.aiPrompts.customJewelRenderPrompt}
                                        onChange={(e) => updateNestedField('aiPrompts', 'customJewelRenderPrompt', e.target.value)}
                                        rows={4}
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className={labelClasses}>Instrucciones de Colocación Específicas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.keys(config.aiPrompts.placementInstructions || {}).map(key => (
                                        <div key={key}>
                                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">{key}</label>
                                            <input
                                                type="text"
                                                value={config.aiPrompts.placementInstructions[key]}
                                                onChange={(e) => updateDeepField('aiPrompts', 'placementInstructions', key, e.target.value)}
                                                className={inputClasses}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'saas' && (
                    <div className={sectionClasses}>
                        <div className="bg-yellow-900/20 border border-yellow-800/50 p-4 rounded-xl mb-6">
                            <p className="text-sm text-yellow-200">
                                <b>Control de Cuotas:</b> Define el número máximo de try-ons (eventos exitosos) permitidos por mes para cada plan.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {Object.keys(config.saasPlans || {}).map(planKey => (
                                <div key={planKey} className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--primary-color)]">
                                            {config.saasPlans[planKey].label || planKey}
                                        </h3>
                                        <div className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-gray-400 font-mono">
                                            ID: {planKey}
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClasses}>Etiqueta Display</label>
                                        <input
                                            type="text"
                                            value={config.saasPlans[planKey].label}
                                            onChange={(e) => updateDeepField('saasPlans', planKey, 'label', e.target.value)}
                                            className={inputClasses}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClasses}>Límite Mensual (Try-ons)</label>
                                        <input
                                            type="number"
                                            value={config.saasPlans[planKey].limit}
                                            onChange={(e) => updateDeepField('saasPlans', planKey, 'limit', parseInt(e.target.value) || 0)}
                                            className={inputClasses}
                                        />
                                        <p className="text-[10px] text-gray-600 mt-2 italic">
                                            * Usa 1000000 o más para simular "Ilimitado".
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
};

export default AdminCampaignPage;
