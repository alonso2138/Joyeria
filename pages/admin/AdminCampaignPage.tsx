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
                    { id: 'ai', label: 'AI Prompts' }
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
                                <label className={labelClasses}>Logo (Modo Claro)</label>
                                <input type="text" value={config.branding.logoLightUrl} onChange={(e) => updateNestedField('branding', 'logoLightUrl', e.target.value)} className={inputClasses} placeholder="/logo.png" />
                            </div>
                            <div>
                                <label className={labelClasses}>Logo (Modo Oscuro)</label>
                                <input type="text" value={config.branding.logoDarkUrl} onChange={(e) => updateNestedField('branding', 'logoDarkUrl', e.target.value)} className={inputClasses} placeholder="/logo.png" />
                            </div>
                            <div>
                                <label className={labelClasses}>Sector (Ej: joya / gafa)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" value={config.branding.sectorName} onChange={(e) => updateNestedField('branding', 'sectorName', e.target.value)} className={inputClasses} placeholder="Singular" />
                                    <input type="text" value={config.branding.sectorNamePlural} onChange={(e) => updateNestedField('branding', 'sectorNamePlural', e.target.value)} className={inputClasses} placeholder="Plural" />
                                </div>
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
                                <b>Tip:</b> Usa los placeholders <code>{`{productType}`}</code>, <code>{`{sectorName}`}</code>, <code>{`{pieceType}`}</code>, <code>{`{material}`}</code> y <code>{`{details}`}</code> para inyectar datos dinámicos.
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


            </div>
        </div>
    );
};

export default AdminCampaignPage;
