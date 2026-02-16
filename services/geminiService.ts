const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const generateTryOnImage = async (
  userImageBase64: string,
  jewelryOverlayUrl: string,
  itemType: string = 'ring',
  config?: any,
  forcedModel?: string
): Promise<string> => {
  try {
    // SECURITY: We no longer call Google GenAI directly from the frontend.
    // We proxy through our backend to protect the API Key and enforce business rules.
    const response = await fetch(`${API_BASE_URL}/ai/generate-tryon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userImageBase64,
        jewelryOverlayUrl,
        itemType,
        tag: config?.tag || window.location.hash.split('/demo/')[1]?.split('/')[0], // Extract tag from URL if not in config
        isMacro: config?.isMacro,
        orientationDesc: config?.orientationDesc
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en la conexión con el servidor de IA.');
    }

    const data = await response.json();
    return data.imageBase64;
  } catch (error: any) {
    console.error('[Gemini Service Error]:', error);
    throw new Error(error.message || 'Error en la conexión con la IA. Prueba de nuevo en unos momentos.');
  }
};

// --- LEGACY STUBS (To be moved to backend if needed later) ---
export const generateCustomJewelWithTryOn = async (): Promise<any> => {
  throw new Error("This feature is temporarily disabled for security migration.");
};

export const generateCustomJewelRender = async (): Promise<any> => {
  throw new Error("This feature is temporarily disabled for security migration.");
};
