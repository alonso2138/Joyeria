import { CustomJewelOptions, GeneratedJewelResult } from '../types';

const getGenAI = async () => {
  const { GoogleGenAI, Modality } = await import('@google/genai');
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is missing');
  return { client: new GoogleGenAI({ apiKey }), Modality };
};

const urlToInlineData = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
  const blob = await response.blob();
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return { inlineData: { data: base64Data, mimeType: blob.type } };
};

const userImageToInlineData = (base64String: string) => {
  const [header, data] = base64String.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  return { inlineData: { data, mimeType } };
};

const extractImageDataUrl = (response: any) => {
  const part = response?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  if (!part) return null;
  return `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
};

export const generateTryOnImage = async (
  userImageBase64: string,
  jewelryOverlayUrl: string,
  itemType: string = 'ring',
  config?: any,
  forcedModel?: string
): Promise<string> => {
  try {
    const { client, Modality } = await getGenAI();
    const userImagePart = userImageToInlineData(userImageBase64);
    const jewelryImagePart = await urlToInlineData(jewelryOverlayUrl);

    // Obtener prompt específico por categoría desde la config
    const categoryPrompts = config?.aiPrompts?.categoryPrompts || {};
    const itemKey = itemType.toLowerCase();

    console.log("itemKey", itemKey);

    let basePrompt = categoryPrompts[itemKey] || `Photorealistic virtual try-on: Place this ${itemKey} on the person accurately. Match lighting and shadows.`;

    // Inject Macro Context if applicable
    // Inject Orientation and Proportional Scaling
    if (config?.isMacro) {
      basePrompt = `
        CRITICAL INSTRUCTIONS FOR MACRO SHOT:
        1. POSE GUIDANCE: ${config.orientationDesc || 'Hand is in a standard pose.'}
        2. ANATOMICAL SCALE: The ring/jewelry must be SMALL relative to the zoomed body part. A ring diameter must match the finger thickness EXACTLY (sub-millimeter precision).
        3. LIGHTING & SPECULAR MATCHING: Detect the strongest light source in the user's photo (look at skin highlights). Replicate this exact light source on the metal's specular highlights.
        4. SKIN INTERACTION: The jewelry must displace the skin. Create subtle bulges where the metal meets the flesh. Cast a SHARP CONTACT SHADOW.
        5. SILHOUETTE ENFORCEMENT: Use the provided jewelry image ONLY for shape and texture. DO NOT let its background or fringes bleed into the skin.
        ${basePrompt}
      `;
    } else {
      // This case is now rare due to center-fallback, but kept for absolute safety
      basePrompt = `PROPORTIONAL SCALE: The jewelry must be tiny and match the person's distance. ${basePrompt}`;
    }

    const finalPrompt = basePrompt;
    const model = forcedModel || 'gemini-2.5-flash-image';
    console.log(`[Gemini Try-On] Model: ${model}`);
    console.log(`[Gemini Try-On] Prompt: ${finalPrompt}`);

    console.log("userImagePart", userImagePart);
    console.log("jewelryImagePart", jewelryImagePart);

    const response = await client.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [userImagePart, jewelryImagePart, { text: finalPrompt }] }],
      config: { responseModalities: [Modality.IMAGE] },
    });

    const result = extractImageDataUrl(response);
    if (!result) {
      throw new Error('La IA no pudo procesar esta imagen. Inténtalo de nuevo con mejor iluminación o una pose diferente.');
    }
    return result;
  } catch (error: any) {
    console.error('[Gemini Service Error]:', error);
    throw new Error(error.message || 'Error en la conexión con la IA. Prueba de nuevo en unos momentos.');
  }
};

export const generateCustomJewelWithTryOn = async (
  userPhotoBase64: string,
  options: CustomJewelOptions,
  config?: any
): Promise<GeneratedJewelResult> => {
  const basePrompt = config?.aiPrompts?.customJewelPrompt || "CAD luxury jewelry rendering. Piece: {pieceType}. Material: {material}. Details: {details}.";
  const prompt = basePrompt
    .replace(/{sectorName}/g, 'jewelry')
    .replace(/{pieceType}/g, options.pieceType)
    .replace(/{material}/g, options.material)
    .replace(/{details}/g, options.stonesOrColors);
  try {
    const { client, Modality } = await getGenAI();
    const model = 'gemini-2.5-flash-image';
    console.log(`[Gemini Custom Try-On] Model: ${model}`);
    console.log(`[Gemini Custom Try-On] Prompt: ${prompt}`);
    const response = await client.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [userImageToInlineData(userPhotoBase64), { text: prompt }] }],
      config: { responseModalities: [Modality.IMAGE] },
    });
    return { imageBase64: extractImageDataUrl(response) || '', promptUsed: prompt, options };
  } catch (error) {
    console.error('[Gemini Custom Try-On Error]:', error);
    return { imageBase64: '', promptUsed: prompt, options };
  }
};

export const generateCustomJewelRender = async (options: CustomJewelOptions, config?: any): Promise<GeneratedJewelResult> => {
  const basePrompt = config?.aiPrompts?.customJewelRenderPrompt || "Studio jewelry product photo. {pieceType}, {material}, {details}.";
  const prompt = basePrompt
    .replace(/{sectorName}/g, 'jewelry')
    .replace(/{pieceType}/g, options.pieceType)
    .replace(/{material}/g, options.material)
    .replace(/{details}/g, options.stonesOrColors);
  try {
    const { client, Modality } = await getGenAI();
    const model = 'gemini-2.5-flash-image';
    console.log(`[Gemini Custom Render] Model: ${model}`);
    console.log(`[Gemini Custom Render] Prompt: ${prompt}`);
    const response = await client.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseModalities: [Modality.IMAGE] },
    });
    return { imageBase64: extractImageDataUrl(response) || '', promptUsed: prompt, options };
  } catch (error) {
    console.error('[Gemini Custom Render Error]:', error);
    return { imageBase64: '', promptUsed: prompt, options };
  }
};
