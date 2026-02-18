import React, { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JewelryItem } from '../../types';
import { getJewelryById, createJewelryItem, updateJewelryItem } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

const AdminJewelryEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [item, setItem] = useState<Partial<JewelryItem>>({
        name: '',
        slug: '',
        description: '',
        price: 0,
        currency: 'EUR',
        category: 'Anillo',
        imageUrl: '',
        overlayAssetUrl: '',
        hashtags: [],
        sku: '',
        isFeatured: false,
        catalogId: 'main',
        aiModel: 'gemini-2.5-flash-image',
        options: {}
    });
    const [newOptionKey, setNewOptionKey] = useState('');
    const [newOptionValue, setNewOptionValue] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    const isEditing = Boolean(id);

    useEffect(() => {
        if (isEditing) {
            setIsFetching(true);
            getJewelryById(id!).then(data => {
                if (data) {
                    setItem(data);
                    setImagePreview(data.imageUrl || '');
                }
                setIsFetching(false);
            });
        }
    }, [id, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setItem(prev => ({ ...prev, [name]: checked }));
        } else {
            setItem(prev => {
                const updated = { ...prev, [name]: value };

                // Si se actualiza imageUrl y overlayAssetUrl está vacío o igual al imageUrl anterior,
                // actualizar overlayAssetUrl también
                if (name === 'imageUrl') {
                    if (!prev.overlayAssetUrl || prev.overlayAssetUrl === prev.imageUrl) {
                        updated.overlayAssetUrl = value;
                    }
                }

                return updated;
            });
        }
    };

    const handleHashtagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const hashtags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
        setItem(prev => ({ ...prev, hashtags }));
    };

    const handleAddOption = () => {
        if (!newOptionKey.trim()) return;
        setItem(prev => ({
            ...prev,
            options: {
                ...(prev.options || {}),
                [newOptionKey.trim()]: newOptionValue.trim()
            }
        }));
        setNewOptionKey('');
        setNewOptionValue('');
    };

    const handleRemoveOption = (key: string) => {
        setItem(prev => {
            const newOptions = { ...(prev.options || {}) };
            delete newOptions[key];
            return { ...prev, options: newOptions };
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);

            // Crear preview de la imagen
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!token) {
            alert('Authentication error');
            return;
        }

        setIsLoading(true);

        try {
            // Preparar FormData
            const formData = new FormData();

            // Basic slug generation
            const finalItem = { ...item };
            if (!finalItem.slug) {
                const baseSlug = finalItem.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') || '';
                const timestamp = Date.now().toString().slice(-6);
                finalItem.slug = `${baseSlug}-${timestamp}`;
            }

            // Generate SKU if empty
            if (!finalItem.sku) {
                const timestamp = Date.now().toString().slice(-8);
                finalItem.sku = `AUR-${finalItem.category?.substring(0, 1)}-${timestamp}`;
            }

            // Agregar todos los campos al FormData
            Object.keys(finalItem).forEach(key => {
                if (key === 'hashtags') {
                    formData.append('hashtags', JSON.stringify(finalItem.hashtags));
                } else if (key === 'options') {
                    formData.append('options', JSON.stringify(finalItem.options));
                } else if (finalItem[key] !== undefined && finalItem[key] !== null) {
                    formData.append(key, finalItem[key].toString());
                }
            });

            // Agregar imagen si se seleccionó una
            if (selectedFile) {
                formData.append('image', selectedFile);
            }

            console.log('Sending FormData to API');
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            if (isEditing) {
                await updateJewelryItem(id!, formData, token);
            } else {
                if (!selectedFile) {
                    alert('Debes seleccionar una imagen para la joya');
                    return;
                }
                await createJewelryItem(formData, token);
            }
            navigate('/admin/jewelry');
        } catch (error) {
            console.error('Failed to save jewelry item:', error);
            alert('Failed to save jewelry item.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return <Spinner text="Cargando datos de la joya..." />;
    }

    const formInputClasses = "mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[var(--primary-color)]";

    return (
        <div>
            <h1 className="text-4xl font-serif mb-8">{isEditing ? 'Editar Joya' : 'Crear Nueva Joya'}</h1>
            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Nombre</label>
                        <input type="text" name="name" value={item.name} onChange={handleChange} className={formInputClasses} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">SKU</label>
                        <input type="text" name="sku" value={item.sku} onChange={handleChange} className={formInputClasses} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Precio</label>
                        <input type="number" name="price" value={item.price} onChange={handleChange} className={formInputClasses} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Categoría</label>
                        <select name="category" value={item.category} onChange={handleChange} className={formInputClasses}>
                            <option>Anillo</option>
                            <option>Collar</option>
                            <option>Gargantilla</option>
                            <option>Pulsera</option>
                            <option>Pendiente</option>
                            <option>Reloj</option>
                            <option>Bolso</option>
                            <option>Camiseta</option>
                            <option>Camisa</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Modelo de IA para Try-On</label>
                        <select name="aiModel" value={item.aiModel} onChange={handleChange} className={formInputClasses}>
                            <option value="gemini-2.5-flash-image">Gemini 2.5 Flash (Velocidad)</option>
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1">Selecciona el modelo optimizado para esta pieza.</p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300">Descripción</label>
                        <textarea name="description" value={item.description} onChange={handleChange} rows={4} className={formInputClasses}></textarea>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Imagen de la Joya</label>

                        {/* Mostrar imagen actual o preview */}
                        {imagePreview && (
                            <div className="mb-4">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded-md border border-gray-600"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    {isEditing ? 'Imagen actual' : 'Preview'}
                                </p>
                            </div>
                        )}

                        {/* Input de archivo */}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary-color)] file:text-black hover:file:bg-opacity-90"
                            required={!isEditing}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            {isEditing ? 'Sube una nueva imagen para reemplazar la actual' : 'Selecciona una imagen para la joya (máximo 5MB)'}
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300">Hashtags (separados por comas)</label>
                        <input type="text" name="hashtags" value={item.hashtags?.join(', ')} onChange={handleHashtagsChange} className={formInputClasses} />
                    </div>
                    <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                            <span>¿Es una joya destacada?</span>
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Catálogo / ID de Demo</label>
                        <input
                            type="text"
                            name="catalogId"
                            value={item.catalogId}
                            onChange={handleChange}
                            className={formInputClasses}
                            placeholder="main"
                            required
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Usa 'main' para la web oficial o el 'tag' del cliente para una demo.</p>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <label className="block text-sm font-medium text-gray-300">Opciones / Atributos (Metadatos para la IA)</label>
                        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 space-y-4">
                            {/* Existing Options List */}
                            <div className="space-y-2">
                                {Object.entries(item.options || {}).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg border border-gray-700">
                                        <span className="text-xs font-mono text-[var(--primary-color)] flex-1">{key}: {value}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(key)}
                                            className="text-red-400 hover:text-red-300 p-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                {Object.keys(item.options || {}).length === 0 && (
                                    <p className="text-[10px] text-gray-500 italic">No hay atributos adicionales definidos.</p>
                                )}
                            </div>

                            {/* Add New Option */}
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Clave (ej: largo)"
                                    value={newOptionKey}
                                    onChange={(e) => setNewOptionKey(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
                                />
                                <input
                                    type="text"
                                    placeholder="Valor (ej: 60cm)"
                                    value={newOptionValue}
                                    onChange={(e) => setNewOptionValue(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full py-2 text-xs"
                                onClick={handleAddOption}
                            >
                                Añadir Atributo
                            </Button>
                            <p className="text-[9px] text-gray-500">Estos atributos informarán a la IA sobre características específicas de la pieza (como el largo de un collar) para mejorar la precisión del Try-On.</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="secondary" onClick={() => navigate('/admin/jewelry')}>Cancelar</Button>
                    <Button type="submit" variant="primary" disabled={isLoading}>
                        {isLoading ? 'Guardando...' : 'Guardar Joya'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AdminJewelryEditPage;