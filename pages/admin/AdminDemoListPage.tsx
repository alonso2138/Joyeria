import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getDemos, deleteDemo } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

interface DemoItem {
    tag: string;
    brandName: string;
    primaryColor: string;
}

const AdminDemoListPage: React.FC = () => {
    const [demos, setDemos] = useState<DemoItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuth();

    const fetchDemos = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await getDemos(token);
            const demosList = Object.entries(data).map(([tag, config]: [string, any]) => ({
                tag,
                brandName: config.branding?.brandName || 'Sin nombre',
                primaryColor: config.branding?.primaryColor || '#D4AF37'
            }));
            setDemos(demosList);
        } catch (error) {
            console.error("Failed to fetch demos:", error);
        }
        setIsLoading(false);
    }, [token]);

    useEffect(() => {
        fetchDemos();
    }, [fetchDemos]);

    const handleDelete = async (tag: string) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar la demo "${tag}"?`)) {
            try {
                if (!token) throw new Error("No auth token");
                await deleteDemo(tag, token);
                fetchDemos();
            } catch (error) {
                console.error("Failed to delete demo:", error);
                alert("No se pudo eliminar la demo.");
            }
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner text="Cargando demos..." /></div>;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-serif">Gestionar Demos</h1>
                    <p className="text-gray-400 mt-2">Demos personalizadas para clientes activos.</p>
                </div>
                <Link to="/admin/demos/new">
                    <Button variant="primary">Crear Nueva Demo</Button>
                </Link>
            </div>

            <div className="bg-black bg-opacity-30 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 uppercase tracking-[0.2em] text-[10px] font-bold">
                        <tr>
                            <th className="p-6">Marca</th>
                            <th className="p-6">ID de Demo (Tag)</th>
                            <th className="p-6">Color Principal</th>
                            <th className="p-6">Link</th>
                            <th className="p-6">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {demos.map(demo => (
                            <tr key={demo.tag} className="hover:bg-white/5 transition-colors group">
                                <td className="p-6">
                                    <div className="font-semibold text-lg">{demo.brandName}</div>
                                </td>
                                <td className="p-6">
                                    <span className="bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full font-mono text-xs border border-purple-500/20">
                                        {demo.tag}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: demo.primaryColor }}></div>
                                        <span className="font-mono text-gray-400">{demo.primaryColor}</span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <a
                                        href={`/#/demo/${demo.tag}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[var(--primary-color)] hover:underline flex items-center gap-2"
                                    >
                                        Ir a la Demo ↗
                                    </a>
                                </td>
                                <td className="p-6">
                                    <div className="flex gap-4">
                                        <Link to={`/admin/demos/edit/${demo.tag}`} className="text-blue-400 hover:text-blue-300 font-medium">Editar</Link>
                                        <button onClick={() => handleDelete(demo.tag)} className="text-red-500 hover:text-red-400 font-medium">Eliminar</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {demos.length === 0 && (
                    <div className="p-20 text-center">
                        <h2 className="text-xl font-serif text-gray-500">Aún no has creado ninguna demo.</h2>
                        <p className="text-gray-600 mt-2">Empieza creando una nueva demo para un cliente potencial.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDemoListPage;
