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
  config?: any
): Promise<string> => {
  try {
    const { client, Modality } = await getGenAI();
    const userImagePart = userImageToInlineData(userImageBase64);
    const jewelryImagePart = await urlToInlineData(jewelryOverlayUrl);

    // Obtener prompt específico por categoría desde la config o usar fallbacks refinados
    const categoryPrompts = config?.aiPrompts?.categoryPrompts || {};
    const itemKey = itemType.toLowerCase();

    const fallbacks: Record<string, string> = {
      // Anillos
      ring: "Photorealistic virtual try-on: Place this ring accurately on the base of the person's finger. Match perspective, metallic luster, and lighting.",
      anillo: "Photorealistic virtual try-on: Place this ring accurately on the base of the person's finger. Match perspective, metallic luster, and lighting.",

      // Collares
      necklace: "Photorealistic virtual try-on: Place this necklace naturally around the person's neck. Match skin tone, gravity, and lighting.",
      collar: "Photorealistic virtual try-on: Place this necklace naturally around the person's neck. Match skin tone, gravity, and lighting.",

      // Pendientes
      earring: "Photorealistic virtual try-on: Place this earring exactly on the earlobe. Maintain correct scale and orientation. Match lighting and create a subtle shadow on the skin for realism.",
      pendiente: "Photorealistic virtual try-on: Place this earring exactly on the earlobe. Maintain correct scale and orientation. Match lighting and create a subtle shadow on the skin for realism.",

      // Pulseras
      bracelet: "Photorealistic virtual try-on: Fit this bracelet around the wrist with realistic metal reflections and natural drape.",
      pulsera: "Photorealistic virtual try-on: Fit this bracelet around the wrist with realistic metal reflections and natural drape.",

      // Relojes
      watch: "Photorealistic virtual try-on: Place this watch precisely on the person's wrist. Adjust the strap curvature to fit the wrist perfectly. Match lighting, metallic reflections, and skin shadows.",
      reloj: "Photorealistic virtual try-on: Place this watch precisely on the person's wrist. Adjust the strap curvature to fit the wrist perfectly. Match lighting, metallic reflections, and skin shadows.",

      // Moda / Complementos
      bolso: "Photorealistic virtual try-on: Place this bag as if being held or worn. Match shadows, perspective, and lighting.",
      camiseta: "Photorealistic virtual fashion: Fit this t-shirt over the person's torso. Match body shape and fabric wrinkles.",
      camisa: "Photorealistic virtual fashion: Fit this shirt over the person's torso. Match shoulder profile and fabric drape."
    };

    const finalPrompt = categoryPrompts[itemKey] || fallbacks[itemKey] || `Photorealistic virtual try-on: Place this ${itemKey} on the person accurately. Match lighting and shadows.`;
    const model = 'gemini-2.5-flash-image';
    console.log(`[Gemini Try-On] Model: ${model}`);
    console.log(`[Gemini Try-On] Prompt: ${finalPrompt}`);

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
  const basePrompt = config?.aiPrompts?.customJewelPrompt || "CAD luxury {sectorName} rendering. Piece: {pieceType}. Material: {material}. Details: {details}.";
  const sector = config?.branding?.sectorName || "jewelry";
  const prompt = basePrompt
    .replace(/{sectorName}/g, sector)
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
  const basePrompt = config?.aiPrompts?.customJewelRenderPrompt || "Studio {sectorName} product photo. {pieceType}, {material}, {details}.";
  const sector = config?.branding?.sectorName || "jewelry";
  const prompt = basePrompt
    .replace(/{sectorName}/g, sector)
    .replace(/{pieceType}/g, options.pieceType)
    .replace(/{material}/g, options.material)
    .replace(/{details}/g, options.stonesOrColors);
  try {
    const { client, Modality } = await getGenAI();
    const model = 'gemini-2.0-flash';
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
