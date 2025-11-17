
import React, { useState, useEffect } from 'react';
import { getUniqueHashtags } from '../../services/api';

interface FilterBarProps {
  onFilterChange: (filters: { search?: string; hashtag?: string }) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange }) => {
  const [search, setSearch] = useState('');
  const [selectedHashtag, setSelectedHashtag] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);

  useEffect(() => {
    const fetchHashtags = async () => {
      try {
        const uniqueHashtags = await getUniqueHashtags();
        console.log('FilterBar: Raw hashtags:', uniqueHashtags);
        // Ensure we only have valid strings
        const validHashtags = Array.isArray(uniqueHashtags) 
          ? uniqueHashtags.filter(tag => typeof tag === 'string' && tag.trim().length > 0)
          : [];
        console.log('FilterBar: Valid hashtags:', validHashtags);
        setHashtags(validHashtags);
      } catch (error) {
        console.error('FilterBar: Error fetching hashtags:', error);
        setHashtags([]);
      }
    };
    fetchHashtags();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      console.log('FilterBar: Sending filter change:', { search, hashtag: selectedHashtag });
      onFilterChange({ search, hashtag: selectedHashtag });
    }, 500);
    return () => clearTimeout(handler);
  }, [search, selectedHashtag]);

  return (
    <div className="py-8 px-6 bg-black bg-opacity-20 backdrop-blur-sm">
      <div className="container mx-auto flex flex-col md:flex-row gap-4 items-center justify-center">
        <input
          type="text"
          placeholder="Buscar por nombre o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
        />
        <select
          value={selectedHashtag}
          onChange={(e) => setSelectedHashtag(e.target.value)}
          className="w-full md:w-1/4 px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
        >
          <option value="">Todas las etiquetas</option>
          {hashtags.map((tag, index) => {
            // Extra safety check
            if (typeof tag !== 'string') {
              console.warn('FilterBar: Non-string tag found:', tag);
              return null;
            }
            return (
              <option key={`${tag}-${index}`} value={tag} className="capitalize">
                {tag}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

export default FilterBar;
