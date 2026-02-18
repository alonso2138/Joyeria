import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Organization } from '../../types';
import { getOrganizations, deleteOrganizationAPI, createOrganizationAPI, updateOrganizationAPI, getCampaignConfig, resetOrganizationUsageAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const AdminOrganizationPage: React.FC = () => {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [config, setConfig] = useState<any>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        allowedDomains: '',
        isActive: true,
        plan: 'basic',
        ownerEmail: '',
        shutterDesign: 'default',
        tryOnInstruction: ''
    });

    const { token } = useAuth();

    const fetchData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [orgsResults, configResults] = await Promise.all([
                getOrganizations(token),
                getCampaignConfig()
            ]);
            setOrgs(orgsResults);
            setConfig(configResults);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
        setIsLoading(false);
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const resetForm = () => {
        setFormData({
            name: '',
            allowedDomains: '',
            isActive: true,
            plan: 'basic',
            ownerEmail: '',
            shutterDesign: 'default',
            tryOnInstruction: ''
        });
        setEditingOrg(null);
    };

    const handleEditClick = (org: Organization) => {
        setEditingOrg(org);
        setFormData({
            name: org.name,
            allowedDomains: (org.allowedDomains || []).join(', '),
            isActive: org.isActive,
            plan: org.plan || 'basic',
            ownerEmail: org.ownerEmail || '',
            shutterDesign: org.shutterDesign || 'default',
            tryOnInstruction: org.tryOnInstruction || ''
        });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Eliminar esta organización? Se revocará el acceso al visualizador.')) {
            try {
                if (!token) throw new Error("No auth token");
                await deleteOrganizationAPI(id, token);
                fetchData();
            } catch (error) {
                console.error("Failed to delete organization:", error);
                alert("Error al eliminar.");
            }
        }
    };

    const handleResetUsage = async (id: string) => {
        if (window.confirm('¿Resetear el contador de uso de esta organización?')) {
            try {
                if (!token) throw new Error("No auth token");
                await resetOrganizationUsageAPI(id, token);
                fetchData();
            } catch (error) {
                console.error("Failed to reset usage:", error);
                alert("Error al resetear el uso.");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!token) throw new Error("No auth token");

            const payload = {
                ...formData,
                allowedDomains: formData.allowedDomains.split(',').map(d => d.trim()).filter(d => d)
            };

            if (editingOrg) {
                await updateOrganizationAPI(editingOrg.id, payload, token);
            } else {
                await createOrganizationAPI(payload, token);
            }

            setShowCreateModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Failed to save organization:", error);
            alert("Error al guardar.");
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner text="Cargando clientes..." /></div>;
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif">Gestión de Clientes (SaaS)</h1>
                    <p className="text-gray-400 text-xs mt-1">Administra accesos, planes y dominios autorizados.</p>
                </div>
                <Button variant="primary" className="py-2 px-4 text-xs" onClick={() => { resetForm(); setShowCreateModal(true); }}>Nuevo Cliente</Button>
            </div>

            <div className="bg-black bg-opacity-30 rounded-xl overflow-hidden backdrop-blur-md border border-white/5 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-black bg-opacity-50 uppercase tracking-widest text-gray-500 font-bold border-b border-white/5">
                            <tr>
                                <th className="px-4 py-3">Organización</th>
                                <th className="px-4 py-3">API Key</th>
                                <th className="px-4 py-3">Plan</th>
                                <th className="px-4 py-3">Dominios</th>
                                <th className="px-4 py-3">Uso</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3">Diseño</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orgs.map(org => (
                                <tr key={org.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-white text-sm">{org.name}</div>
                                        <div className="text-[10px] text-gray-500">{org.ownerEmail || 'Sin email'}</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-[10px]">
                                        <span className="bg-white/5 px-2 py-1 rounded select-all cursor-pointer text-gray-400 border border-white/5" title="Haga clic para seleccionar">
                                            {org.apiKey}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase w-fit ${org.plan === 'premium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                {config?.saasPlans?.[org.plan]?.label || org.plan}
                                            </span>
                                            <span className="text-[9px] text-gray-500 font-mono mt-1">
                                                Límite: {config?.saasPlans?.[org.plan]?.limit >= 1000000 ? '∞' : config?.saasPlans?.[org.plan]?.limit || '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                                            {org.allowedDomains && org.allowedDomains.length > 0 ? (
                                                org.allowedDomains.map(d => (
                                                    <span key={d} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-gray-400">{d}</span>
                                                ))
                                            ) : (
                                                <span className="text-[10px] text-gray-600 italic">Global</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-bold text-[var(--primary-color)]">{org.usageCount}</div>
                                        <div className="text-[8px] text-gray-500 uppercase tracking-tighter">Try-ons</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${org.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`}></div>
                                            <span className={`text-[11px] ${org.isActive ? 'text-green-500/80' : 'text-red-500/80'}`}>
                                                {org.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase ${org.shutterDesign === 'special' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                            }`}>
                                            {org.shutterDesign === 'special' ? 'Especial' : 'Estándar'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => { handleEditClick(org); setShowCreateModal(true); }} className="text-blue-400 hover:text-blue-300 transition-colors text-[11px] font-bold uppercase tracking-wider">Editar</button>
                                            <button onClick={() => handleResetUsage(org.id)} className="text-amber-500 hover:text-amber-400 transition-colors text-[11px] font-bold uppercase tracking-wider">Reset</button>
                                            <button onClick={() => handleDelete(org.id)} className="text-red-500 hover:text-red-400 transition-colors text-[11px] font-bold uppercase tracking-wider">Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {orgs.length === 0 && (
                    <div className="p-16 text-center">
                        <p className="text-gray-500 font-serif italic text-base mb-4">Todavía no hay clientes externos registrados.</p>
                        <Button variant="outline" className="text-xs" onClick={() => setShowCreateModal(true)}>Crea tu primer cliente</Button>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal - REFINED SIZE */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-[#0f111a] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-3xl"
                    >
                        <h2 className="text-xl font-serif mb-5 text-white text-center">
                            {editingOrg ? 'Editar Cliente' : 'Nuevo Cliente SaaS'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5">Nombre Comercial</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--primary-color)] transition-all placeholder:text-gray-700"
                                    placeholder="Ej: Joyería Martínez"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5">Email del Propietario</label>
                                <input
                                    type="email"
                                    value={formData.ownerEmail}
                                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--primary-color)] transition-all placeholder:text-gray-700"
                                    placeholder="contacto@joyeria.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5">Plan</label>
                                    <select
                                        value={formData.plan}
                                        onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-[var(--primary-color)] appearance-none"
                                    >
                                        {config?.saasPlans ? (
                                            Object.keys(config.saasPlans).map(planKey => (
                                                <option key={planKey} value={planKey}>
                                                    {config.saasPlans[planKey].label}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="free">Free</option>
                                                <option value="basic">Basic</option>
                                                <option value="premium">Premium</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5">Estado</label>
                                    <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isActive: true })}
                                            className={`flex-1 py-1 rounded-md transition-all text-[9px] font-bold ${formData.isActive ? 'bg-green-500/20 text-green-500' : 'text-gray-600'}`}
                                        >
                                            ON
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isActive: false })}
                                            className={`flex-1 py-1 rounded-md transition-all text-[9px] font-bold ${!formData.isActive ? 'bg-red-500/20 text-red-500' : 'text-gray-600'}`}
                                        >
                                            OFF
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5">Dominios</label>
                                <input
                                    type="text"
                                    value={formData.allowedDomains}
                                    onChange={(e) => setFormData({ ...formData, allowedDomains: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white focus:outline-none focus:border-[var(--primary-color)] transition-all placeholder:text-gray-700 font-mono"
                                    placeholder="joyeriamartinez.com, shop.es"
                                />
                                <p className="text-[8px] text-gray-600 mt-1.5 italic">Separa por comas. Vacío = Global.</p>
                            </div>

                            <div>
                                <label className="block text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5">Diseño del Obturador</label>
                                <select
                                    value={formData.shutterDesign}
                                    onChange={(e) => setFormData({ ...formData, shutterDesign: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-[var(--primary-color)] appearance-none"
                                >
                                    <option value="default">Estándar (Centro)</option>
                                    <option value="special">Especial (Top + Frame)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5">Instrucciones Try-On (Opcional)</label>
                                <textarea
                                    value={formData.tryOnInstruction}
                                    onChange={(e) => setFormData({ ...formData, tryOnInstruction: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white focus:outline-none focus:border-[var(--primary-color)] transition-all placeholder:text-gray-700 h-16 resize-none"
                                    placeholder="Ej: Centra el accesorio en el marcador..."
                                />
                                <p className="text-[8px] text-gray-600 mt-1.5 italic">Si se deja vacío, se usarán las globales.</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button className="flex-1 py-2 text-xs" variant="outline" type="button" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancelar</Button>
                                <Button className="flex-1 py-2 text-xs shadow-lg shadow-[var(--primary-color)]/10" variant="primary" type="submit">
                                    {editingOrg ? 'Actualizar' : 'Generar Key'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminOrganizationPage;
