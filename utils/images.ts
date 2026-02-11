// Helper para manejar rutas de imágenes
export const getImageUrl = (imagePath: string): string => {
  // Para imágenes en la carpeta public
  if (imagePath.startsWith('/')) {
    return imagePath;
  }

  // Para imágenes en assets (importadas)
  return new URL(`../assets/images/${imagePath}`, import.meta.url).href;
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
