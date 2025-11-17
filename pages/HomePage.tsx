
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { brandingConfig } from '../config/branding';
import Button from '../components/ui/Button';
import { JewelryItem } from '../types';
import { getFeaturedJewelryItems } from '../services/api';
import JewelryCard from '../components/catalog/JewelryCard';

const HomePage: React.FC = () => {
    const [featuredItems, setFeaturedItems] = useState<JewelryItem[]>([]);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const items = await getFeaturedJewelryItems();
                const validItems = Array.isArray(items) ? items.filter(item => 
                    item && typeof item === 'object' && item.name && item.slug
                ) : [];
                setFeaturedItems(validItems);
            } catch (error) {
                console.error('Error fetching featured items:', error);
                setFeaturedItems([]);
            }
        };
        fetchItems();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Hero Section */}
            <section className="h-screen flex items-center justify-center text-center relative overflow-hidden px-4">
                 <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
                <div className="z-20 relative">
                    <motion.h1 
                        className="text-5xl md:text-7xl font-serif font-bold"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        {brandingConfig.hero.title}
                    </motion.h1>
                    <motion.p 
                        className="text-lg md:text-xl mt-4 max-w-2xl mx-auto text-gray-300"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        {brandingConfig.hero.subtitle}
                    </motion.p>
                    <motion.div 
                        className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                    >
                        <Link to="/catalog"><Button variant="primary">{brandingConfig.hero.ctaExplore}</Button></Link>
                    </motion.div>
                </div>
            </section>

            {/* Featured Collection Section */}
            <section className="py-20 px-6">
                <div className="container mx-auto">
                    <h2 className="text-4xl font-serif text-center mb-12">Colección Destacada</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {featuredItems.map((item, index) => {
                            if (!item || typeof item !== 'object') return null;
                            return (
                                <JewelryCard key={`featured-${item.id || item._id || index}-${item.slug || index}`} item={item} index={index}/>
                            );
                        })}
                    </div>
                </div>
            </section>
        </motion.div>
    );
};

export default HomePage;
