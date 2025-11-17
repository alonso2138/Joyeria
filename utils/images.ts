// Helper para manejar rutas de imágenes
export const getImageUrl = (imagePath: string): string => {
  // Para imágenes en la carpeta public, eliminar /public/ si existe
  if (imagePath.startsWith('/public/')) {
    return imagePath.replace('/public/', '/');
  }
  
  // Para imágenes que ya están en formato correcto
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  
  // Para rutas relativas, agregar la barra inicial
  return `/${imagePath}`;
};

// Función específica para limpiar URLs problemáticas
export const cleanImageUrl = (url: string): string => {
  if (!url) return '';
  
  // Eliminar múltiples barras
  url = url.replace(/\/+/g, '/');
  
  // Eliminar /public/ si aparece en la URL
  url = url.replace('/public/', '/');
  
  // Asegurar que empiece con / para rutas locales
  if (!url.startsWith('http') && !url.startsWith('/')) {
    url = '/' + url;
  }
  
  return url;
};

// Rutas de imágenes comunes
export const images = {
  logos: {
    light: '/logo.png',
    dark: '/logo-dark.png',
  },
  jewelry: {
    placeholder: '/images/jewelry/placeholder.jpg',
    defaultOverlay: '/images/jewelry/default-overlay.png',
  },
  hero: {
    background: '/images/hero-bg.jpg',
  }
} as const;
