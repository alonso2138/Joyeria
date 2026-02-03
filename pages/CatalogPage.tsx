import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { JewelryItem } from '../types';
import { getJewelryItems } from '../services/api';
import JewelryCard from '../components/catalog/JewelryCard';
import FilterBar from '../components/catalog/FilterBar';
import Spinner from '../components/ui/Spinner';
import { useConfig } from '../hooks/useConfig';

const CatalogPage: React.FC = () => {
  const { config } = useConfig();
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<{ search?: string; hashtag?: string }>({});

  const handleFilterChange = useCallback((newFilters: { search?: string; hashtag?: string }) => {
    setFilters(newFilters);
  }, []);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await getJewelryItems({ ...filters, catalogId: 'main' });
      const validResults = Array.isArray(results) ? results.filter(item =>
        item && typeof item === 'object' && item.name && item.slug
      ) : [];
      setItems(validResults);
    } catch (error) {
      console.error('CatalogPage: Error fetching items:', error);
      setItems([]);
    }
    setIsLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      <div className="pt-24 pb-12 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <h1 className="text-5xl font-serif font-bold">{config?.uiLabels?.catalogTitle || 'Nuestra Colección'}</h1>
        <p className="text-lg mt-2 text-gray-300">{config?.uiLabels?.catalogSubtitle || 'Joyas disponibles para probar'}</p>
      </div>

      <FilterBar onFilterChange={handleFilterChange} />

      <div className="container mx-auto py-12 px-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner text={config?.uiLabels?.loadingItems || "Cargando..."} />
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {items.map((item, index) => (
              <JewelryCard key={item.id || item._id} item={item} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-serif">{config?.uiLabels?.noItemsFound || "No se encontraron resultados"}</h2>
            <p className="text-gray-400 mt-2">{config?.uiLabels?.tryChangingFilters || "Prueba a cambiar los filtros."}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CatalogPage;
