import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDemos, upsertDemo } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const AdminDemoEditPage: React.FC = () => {
    const { tag } = useParams<{ tag: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(!!tag);
    const [isSaving, setIsSaving] = useState(false);
    const [organizations, setOrganizations] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        tag: '',
        brandName: '',
        organizationId: '',
        primaryColor: '#D4AF37',
        secondaryColor: '#111111',
        accentColor: '#FFFFFF',
        textColor: '#FFFFFF',
        headerBackground: 'rgba(0, 0, 0, 0.2)',
        cardBorderColor: 'rgba(255, 255, 255, 0.1)',
        secondaryTextColor: '#9CA3AF',
        priceColor: '#D4AF37',
        fontFamily: 'sans',
        backgroundGradient: 'linear-gradient(135deg, #050509, #1C1C24)',
        logoUrl: '/logo.png', // Default
        faviconUrl: '',
        heroTitle: '',
        heroDescription: '',
        ctaText: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                // Fetch Organizations for the dropdown
                const { getOrganizations } = await import('../../services/api');
                const orgs = await getOrganizations(token);
                setOrganizations(Array.isArray(orgs) ? orgs : []);

                if (tag) {
                    const demos = await getDemos(token);
                    const demo = demos[tag];
                    if (demo) {
                        // Find if any org is linked to this tag
                        const linkedOrg = orgs.find((o: any) => o.demoTag === tag);

                        setFormData({
                            tag: tag,
                            organizationId: linkedOrg?.id || '',
                            brandName: demo.branding?.brandName || '',
                            primaryColor: demo.branding?.primaryColor || '',
                            secondaryColor: demo.branding?.secondaryColor || '',
                            accentColor: demo.branding?.accentColor || '',
                            textColor: demo.branding?.textColor || '#FFFFFF',
                            headerBackground: demo.branding?.headerBackground || '',
                            cardBorderColor: demo.branding?.cardBorderColor || '',
                            secondaryTextColor: demo.branding?.secondaryTextColor || '',
                            priceColor: demo.branding?.priceColor || '',
                            fontFamily: demo.branding?.fontFamily || 'sans',
                            backgroundGradient: demo.branding?.backgroundGradient || '',
                            logoUrl: demo.branding?.logoLightUrl || '',
                            faviconUrl: demo.branding?.faviconUrl || '',
                            heroTitle: demo.uiLabels?.heroTitle || '',
                            heroDescription: demo.uiLabels?.heroDescription || '',
                            ctaText: demo.uiLabels?.ctaText || ''
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                alert("Error al cargar los datos.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [tag, token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setIsSaving(true);

        try {
            await upsertDemo({
                tag: formData.tag,
                organizationId: formData.organizationId,
                branding: {
                    brandName: formData.brandName,
                    primaryColor: formData.primaryColor,
                    secondaryColor: formData.secondaryColor || '#111111',
                    accentColor: formData.accentColor || '#FFFFFF',
                    textColor: formData.textColor || '#FFFFFF',
                    headerBackground: formData.headerBackground,
                    cardBorderColor: formData.cardBorderColor,
                    secondaryTextColor: formData.secondaryTextColor,
                    priceColor: formData.priceColor,
                    fontFamily: formData.fontFamily,
                    backgroundGradient: formData.backgroundGradient,
                    logoLightUrl: formData.logoUrl,
                    logoDarkUrl: formData.logoUrl,
                    faviconUrl: formData.faviconUrl
                },
                uiLabels: {
                    heroTitle: formData.heroTitle,
                    heroDescription: formData.heroDescription,
                    ctaText: formData.ctaText
                }
            }, token);
            navigate('/admin/demos');
        } catch (error) {
            console.error("Error saving demo:", error);
            alert("Error al guardar la demo.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><Spinner text="Cargando datos..." /></div>;

    return (
        <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-4xl font-serif mb-8">{tag ? 'Editar Demo' : 'Nueva Demo'}</h1>

            <form onSubmit={handleSubmit} className="bg-black bg-opacity-30 p-8 rounded-2xl border border-white/5 space-y-6">

                {/* ID / TAG */}
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">ID de Demo (Tag Único)</label>
                    <input
                        type="text"
                        name="tag"
                        value={formData.tag}
                        onChange={handleChange}
                        disabled={!!tag} // No editar el tag una vez creado
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                        placeholder="ej: joyeria-luxe"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-2">Este será el identificador en la URL: visualizalo.es/#/demo/<b>{formData.tag || '...'}</b></p>
                </div>

                <div className="h-px bg-white/10 my-6"></div>

                {/* BRANDING */}
                <h3 className="text-lg font-serif text-[var(--primary-color)]">Personalización de Marca</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Nombre de la Marca</label>
                        <input
                            type="text"
                            name="brandName"
                            value={formData.brandName}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
                            placeholder="Joyería Ejemplo"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Cliente / Organización Vinculada</label>
                        <select
                            name="organizationId"
                            value={formData.organizationId}
                            onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
                        >
                            <option value="">-- Sin vincular --</option>
                            {organizations.map(org => (
                                <option key={org.id} value={org.id}>
                                    {org.name} ({org.plan})
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-gray-500 mt-2">Los usos de esta demo se sumarán a la cuota de este cliente.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Color Principal (Hex)</label>
                        <div className="flex gap-3">
                            <input
                                type="color"
                                name="primaryColor"
                                value={formData.primaryColor}
                                onChange={handleChange}
                                className="h-12 w-12 rounded cursor-pointer bg-transparent border-none p-0"
                            />
                            <input
                                type="text"
                                name="primaryColor"
                                value={formData.primaryColor}
                                onChange={handleChange}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono uppercase"
                                pattern="^#[0-9A-Fa-f]{6}$"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Color Secundario (Hex)</label>
                        <div className="flex gap-3">
                            <input
                                type="color"
                                name="secondaryColor"
                                value={formData.secondaryColor}
                                onChange={handleChange}
                                className="h-12 w-12 rounded cursor-pointer bg-transparent border-none p-0"
                            />
                            <input
                                type="text"
                                name="secondaryColor"
                                value={formData.secondaryColor}
                                onChange={handleChange}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono uppercase"
                                pattern="^#[0-9A-Fa-f]{6}$"
                                placeholder="#111111"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Color Acento (Hex)</label>
                        <div className="flex gap-3">
                            <input
                                type="color"
                                name="accentColor"
                                value={formData.accentColor}
                                onChange={handleChange}
                                className="h-12 w-12 rounded cursor-pointer bg-transparent border-none p-0"
                            />
                            <input
                                type="text"
                                name="accentColor"
                                value={formData.accentColor}
                                onChange={handleChange}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono uppercase"
                                pattern="^#[0-9A-Fa-f]{6}$"
                                placeholder="#FFFFFF"
                            />
                        </div>
                    </div>
                </div>

                {/* Extended Branding */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Color de Texto Principal</label>
                        <div className="flex gap-3">
                            <input
                                type="color"
                                name="textColor"
                                value={formData.textColor}
                                onChange={handleChange}
                                className="h-12 w-12 rounded cursor-pointer bg-transparent border-none p-0"
                            />
                            <input
                                type="text"
                                name="textColor"
                                value={formData.textColor}
                                onChange={handleChange}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono uppercase"
                                pattern="^#[0-9A-Fa-f]{6}$"
                                placeholder="#FFFFFF"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Útil si usas un fondo claro (ponlo oscuro, ej: #000000).</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Fondo del Header (Cabecera)</label>
                        <div className="flex gap-3">
                            <input
                                type="color"
                                value={formData.headerBackground.startsWith('#') ? formData.headerBackground : '#000000'}
                                onChange={(e) => setFormData({ ...formData, headerBackground: e.target.value })}
                                className="h-12 w-12 rounded cursor-pointer bg-transparent border-none p-0"
                            />
                            <input
                                type="text"
                                name="headerBackground"
                                value={formData.headerBackground}
                                onChange={handleChange}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none text-sm font-mono"
                                placeholder="rgba(0,0,0,0.5) o #Color"
                            />
                        </div>
                    </div>
                </div>

                {/* Typography Section */}
                <div className="mt-8">
                    <h4 className="text-md font-bold text-gray-300 mb-4 border-b border-white/10 pb-2">Tipografía</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Familia de Fuente</label>
                            <select
                                name="fontFamily"
                                value={formData.fontFamily}
                                onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
                            >
                                <option value="sans">Moderna (Sans-Serif - Inter/Roboto)</option>
                                <option value="serif">Elegante (Serif - Playfair/Merriweather)</option>
                                <option value="mono">Técnica (Monospace - Space Mono)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-2">Define la personalidad del texto.</p>
                        </div>
                    </div>
                </div>

                {/* Advanced Colors Section */}
                <div className="mt-8">
                    <h4 className="text-md font-bold text-gray-300 mb-4 border-b border-white/10 pb-2">Colores Avanzados (Granularidad)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Borde de Tarjetas</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formData.cardBorderColor.startsWith('#') ? formData.cardBorderColor : '#333333'}
                                    onChange={(e) => setFormData({ ...formData, cardBorderColor: e.target.value })}
                                    className="h-10 w-10 rounded cursor-pointer bg-transparent border-none p-0"
                                />
                                <input
                                    type="text"
                                    name="cardBorderColor"
                                    value={formData.cardBorderColor}
                                    onChange={handleChange}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono"
                                    placeholder="#333333"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Texto Secundario</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formData.secondaryTextColor.startsWith('#') ? formData.secondaryTextColor : '#888888'}
                                    onChange={(e) => setFormData({ ...formData, secondaryTextColor: e.target.value })}
                                    className="h-10 w-10 rounded cursor-pointer bg-transparent border-none p-0"
                                />
                                <input
                                    type="text"
                                    name="secondaryTextColor"
                                    value={formData.secondaryTextColor}
                                    onChange={handleChange}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono"
                                    placeholder="#888888"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Precio</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formData.priceColor.startsWith('#') ? formData.priceColor : '#D4AF37'}
                                    onChange={(e) => setFormData({ ...formData, priceColor: e.target.value })}
                                    className="h-10 w-10 rounded cursor-pointer bg-transparent border-none p-0"
                                />
                                <input
                                    type="text"
                                    name="priceColor"
                                    value={formData.priceColor}
                                    onChange={handleChange}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono"
                                    placeholder="#D4AF37"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Fondo de Pantalla</label>
                        <div className="flex gap-3">
                            <input
                                type="color"
                                value={formData.backgroundGradient.startsWith('#') ? formData.backgroundGradient : '#000000'}
                                onChange={(e) => setFormData({ ...formData, backgroundGradient: e.target.value })}
                                className="h-12 w-12 rounded cursor-pointer bg-transparent border-none p-0"
                                title="Seleccionar color sólido"
                            />
                            <input
                                type="text"
                                name="backgroundGradient"
                                value={formData.backgroundGradient}
                                onChange={handleChange}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none text-sm font-mono"
                                placeholder="linear-gradient(...) o #Color"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Usa el selector para un color sólido o escribe un gradiente CSS avanzado.</p>
                    </div>
                    <div>
                        {/* Empty/Placeholder for grid alignment if needed */}
                    </div>
                </div >

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">URL del Logo (Imagen)</label>
                    <input
                        type="text"
                        name="logoUrl"
                        value={formData.logoUrl}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none text-sm"
                        placeholder="/logo.png o https://..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">URL del Favicon (Icono Pestaña)</label>
                    <input
                        type="text"
                        name="faviconUrl"
                        value={formData.faviconUrl}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none text-sm"
                        placeholder="/favicon.ico o https://... (opcional, usa logo si vacío)"
                    />
                    <p className="text-xs text-gray-500 mt-2">Imagen cuadrada pequeña (16x16 o 32x32 px). Si está vacío, se usará el logo.</p>
                </div>

                <div className="h-px bg-white/10 my-6"></div>

                {/* TEXTOS */}
                <h3 className="text-lg font-serif text-[var(--primary-color)]">Textos Personalizados</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Título Hero (Landing)</label>
                    <input
                        type="text"
                        name="heroTitle"
                        value={formData.heroTitle}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
                        placeholder="Descubre nuestra colección exclusiva..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Descripción Hero</label>
                    <textarea
                        name="heroDescription"
                        value={formData.heroDescription}
                        onChange={(e) => setFormData({ ...formData, heroDescription: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none h-24 resize-none"
                        placeholder="Explora nuestra selección..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Texto del Botón CTA</label>
                    <input
                        type="text"
                        name="ctaText"
                        value={formData.ctaText}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
                        placeholder="Ej: Abrir Probador Virtual"
                    />
                </div>


                <div className="pt-6 flex justify-end gap-4">
                    <Button type="button" variant="secondary" onClick={() => navigate('/admin/demos')}>Cancelar</Button>
                    <Button type="submit" variant="primary" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar Demo'}
                    </Button>
                </div>
            </form >
        </div >
    );
};

export default AdminDemoEditPage;
