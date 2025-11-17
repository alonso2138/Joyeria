import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { JewelryItem } from '../../types';
import { getFullImageUrl } from '../../services/api';

interface JewelryCardProps {
  item: JewelryItem;
  index: number;
}

const JewelryCard: React.FC<JewelryCardProps> = ({ item, index }) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(price);
  };

  const imageSrc = getFullImageUrl(item.imageUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Link to={`/jewelry/${item.slug}`} className="block group">
        <div className="overflow-hidden bg-black">
          <motion.img
            src={imageSrc}
            alt={item.name}
            className="w-full h-80 object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
          />
        </div>
        <div className="mt-4 text-center">
          <h3 className="font-serif text-xl text-white group-hover:text-[var(--primary-color)] transition-colors">{item.name}</h3>
          <p className="text-gray-400 mt-1">{item.category}</p>
          <p className="font-semibold mt-2 text-lg text-white">{formatPrice(item.price, item.currency)}</p>
        </div>
      </Link>
    </motion.div>
  );
};

export default JewelryCard;
