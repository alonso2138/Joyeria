
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { JewelryItem, EventType } from '../types';
import { getJewelryBySlug, logEvent } from '../services/api';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';

const JewelryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<JewelryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      if (slug) {
        setIsLoading(true);
        const result = await getJewelryBySlug(slug);
        if (result) {
          setItem(result);
          logEvent(EventType.VIEW, result.id);
        }
        setIsLoading(false);
      }
    };
    fetchItem();
  }, [slug]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(price);
  };

  const handleTryOn = () => {
      if(!item) return;
      logEvent(EventType.TRYON_START, item.id);
      navigate(`/try-on/${item.slug}`);
  }

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Spinner text="Cargando joya..." /></div>;
  }

  if (!item) {
    return <div className="h-screen flex items-center justify-center text-2xl font-serif">Joya no encontrada.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-12 md:py-24 px-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <motion.div 
            className="w-full aspect-square bg-black overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
        >
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        </motion.div>

        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
        >
          <p className="text-sm uppercase tracking-widest text-gray-400">{item.category}</p>
          <h1 className="text-4xl md:text-5xl font-serif my-4">{item.name}</h1>
          <p className="text-2xl font-semibold text-[var(--primary-color)] mb-6">{formatPrice(item.price, item.currency)}</p>
          <p className="text-gray-300 leading-relaxed mb-8">{item.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-8">
            {item.hashtags && Array.isArray(item.hashtags) ? item.hashtags.map((tag, tagIndex) => (
              <span key={`tag-${tagIndex}-${tag}`} className="text-xs bg-gray-700 text-gray-200 px-3 py-1 rounded-full capitalize">
                {typeof tag === 'string' ? tag : JSON.stringify(tag)}
              </span>
            )) : null}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="primary" onClick={handleTryOn}>Probar en mi piel</Button>
            <Button variant="secondary" onClick={() => logEvent(EventType.CLICK_BOOK_APPOINTMENT, item.id)}>Pedir Cita</Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default JewelryDetailPage;
