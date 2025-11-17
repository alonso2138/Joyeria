import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { JewelryItem } from '../../types';
import { getJewelryItems, deleteJewelryItem, getFullImageUrl } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const AdminJewelryListPage: React.FC = () => {
    const [items, setItems] = useState<JewelryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuth();

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        // Using getJewelryItems with no filters to get all items
        const results = await getJewelryItems({});
        setItems(results);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta joya? Esta acción no se puede deshacer.')) {
            try {
                if(!token) throw new Error("No auth token");
                await deleteJewelryItem(id, token);
                // Refetch items after deletion
                fetchItems(); 
            } catch (error) {
                console.error("Failed to delete item:", error);
                alert("No se pudo eliminar la joya.");
            }
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner text="Cargando joyas..." /></div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-serif">Gestionar Joyas</h1>
                <Link to="/admin/jewelry/new">
                    <Button variant="primary">Crear Nueva Joya</Button>
                </Link>
            </div>
            <div className="bg-black bg-opacity-30 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black bg-opacity-50 uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Imagen</th>
                            <th className="p-4">Nombre</th>
                            <th className="p-4">SKU</th>
                            <th className="p-4">Precio</th>
                            <th className="p-4">Destacado</th>
                            <th className="p-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                                <td className="p-4"><img src={getFullImageUrl(item.imageUrl)} alt={item.name} className="w-16 h-16 object-cover rounded-md"/></td>
                                <td className="p-4 font-semibold">{item.name}</td>
                                <td className="p-4 text-gray-400">{item.sku}</td>
                                <td className="p-4">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: item.currency }).format(item.price)}</td>
                                <td className="p-4">{item.isFeatured ? 'Sí' : 'No'}</td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <Link to={`/admin/jewelry/edit/${item.id}`} className="text-[var(--primary-color)] hover:underline">Editar</Link>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline">Eliminar</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {items.length === 0 && <p className="p-8 text-center text-gray-400">No se encontraron joyas.</p>}
            </div>
        </div>
    );
};

export default AdminJewelryListPage;
