import { Request, Response } from 'express';
import Organization from '../models/Organization';
import GlobalConfig from '../models/GlobalConfig';

const getGenAI = async () => {
    const { GoogleGenAI, Modality } = await import('@google/genai');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key is missing on backend');
    return { client: new GoogleGenAI({ apiKey }), Modality };
};

export const generateTryOn = async (req: Request, res: Response) => {
    try {
        const { userImageBase64, jewelryOverlayUrl, itemType, tag } = req.body;

        if (!userImageBase64 || !jewelryOverlayUrl || !tag) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // 1. SECURITY: Verify that the demo has an active organization
        let org = await Organization.findOne({ demoTag: tag });

        // Fallback for landing page or if 'main' tag is used
        if (!org && tag === 'main') {
            org = await Organization.findOne({ isActive: true });
        }

        if (!org || !org.isActive) {
            return res.status(403).json({ message: 'This demo is not authorized for AI generation (Missing Org)' });
        }

        // 2. Load config for AI Prompts from DB
        const config = await GlobalConfig.findOne();

        const { client, Modality } = await getGenAI();
        const [header, data] = userImageBase64.split(',');
        const mimeType = header?.match(/:(.*?);/)?.[1] || 'image/jpeg';
        const userImagePart = { inlineData: { data, mimeType } };

        // Fetch jewelry asset
        const jewelryResponse = await fetch(jewelryOverlayUrl);
        const jewelryBlob = await jewelryResponse.blob();
        const jewelryBuffer = Buffer.from(await jewelryBlob.arrayBuffer());
        const jewelryImagePart = {
            inlineData: {
                data: jewelryBuffer.toString('base64'),
                mimeType: jewelryBlob.type || 'image/png'
            }
        };

        const itemKey = (itemType || 'ring').toLowerCase();
        const categoryPrompts = (config as any)?.aiPrompts?.categoryPrompts || {};
        let basePrompt = categoryPrompts[itemKey] || `Photorealistic virtual try-on: Place this ${itemKey} on the person accurately. Match lighting and shadows.`;

        // Add Macro logic if passed from frontend
        if (req.body.isMacro) {
            let scaleGuidance = "";
            if (itemKey === 'anillo') {
                scaleGuidance = "ANATOMICAL SCALE: The ring diameter must match the finger thickness perfectly.";
            } else if (itemKey === 'pendiente') {
                scaleGuidance = "ANATOMICAL SCALE: The earring size must be proportional to the earlobe, typically 10-30mm in relative scale.";
            } else if (itemKey === 'collar') {
                scaleGuidance = "ANATOMICAL SCALE: The chain thickness and pendant must be proportional to the neck and chest.";
            } else if (itemKey === 'gargantilla') {
                scaleGuidance = "ANATOMICAL SCALE: The choker must fit tightly around the neck, higher than a standard necklace, typically 30-35cm in relative length.";
            } else if (itemKey === 'pulsera') {
                scaleGuidance = "ANATOMICAL SCALE: The bracelet must fit snugly around the wrist; its diameter should match the wrist width.";
            }

            basePrompt = `
                CRITICAL INSTRUCTIONS FOR MACRO SHOT:
                1. POSE GUIDANCE: ${req.body.orientationDesc || 'Subject is in a standard pose for this category.'}
                2. ${scaleGuidance}
                ${basePrompt}
            `;
        }

        // Add dynamic options as context (Professional Startup approach)
        if (req.body.options && typeof req.body.options === 'object') {
            const options = req.body.options;
            const contextItems = Object.entries(options)
                .map(([key, value]) => `- ${key.toUpperCase()}: ${value}`)
                .join('\n                    ');

            if (contextItems) {
                basePrompt = `
                    CRITICAL PRODUCT SPECIFICATIONS:
                    You MUST rigidly respect the following physical constraints and attributes for the jewelry piece:
                    ${contextItems}
                    
                    IMPORTANT: If physical dimensions (e.g. "ancho", "largo", "thickness", "width") are provided, you MUST adjust the relative scale of the jewelry on the human body to perfectly match those dimensions in real life. Do not use default scaling.
                    
                    ${basePrompt}
                `;
            }

            // Specific logic for Wedding Bands (Alianzas) with multiple rings in the photo
            if (itemKey === 'anillo' || itemKey === 'anillo') {
                const variant = options.ring_variant || options.variant;
                if (variant === 'mujer') {
                    basePrompt = `
                        VISUAL SELECTION:
                        There are two rings in the product image (a pair of wedding bands). 
                        You MUST select the WOMAN'S ring (typically the smaller, thinner, or more decorated one).
                        Render ONLY this ring on the hand. Ignore the other larger ring.
                        
                        ${basePrompt}
                    `;
                } else if (variant === 'hombre') {
                    basePrompt = `
                        VISUAL SELECTION:
                        There are two rings in the product image (a pair of wedding bands). 
                        You MUST select the MAN'S ring (typically the larger, wider, or more plain one).
                        Render ONLY this ring on the hand. Ignore the other smaller ring.
                        
                        ${basePrompt}
                    `;
                }
            }
        }

        // --- PASS 1: ISOLATION (Only if ring variant is provided) ---
        let finalJewelryImagePart = jewelryImagePart;

        if ((itemKey === 'anillo' || itemKey === 'alianza') && req.body.options && typeof req.body.options === 'object') {
            const variant = req.body.options.ring_variant || req.body.options.variant;
            
            if (variant === 'mujer' || variant === 'hombre') {
                console.log(`[AI Controller] Init Pass 1: Isolating ${variant} ring...`);
                let separationPrompt = '';
                
                if (variant === 'mujer') {
                    separationPrompt = "Extract the WOMAN'S RING (typically the smaller, thinner, or more decorated one) from this image. Render ONLY this specific ring on a pure perfect white background. Make it completely centered and fill most of the frame. Preserve all lighting, shadows, and details exactly as they are.";
                } else {
                    separationPrompt = "Extract the MAN'S RING (typically the larger, wider, or more plain one) from this image. Render ONLY this specific ring on a pure perfect white background. Make it completely centered and fill most of the frame. Preserve all lighting, shadows, and details exactly as they are.";
                }

                try {
                    const separationResult = await client.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: [{ role: 'user', parts: [jewelryImagePart, { text: separationPrompt }] }],
                        config: { responseModalities: [Modality.IMAGE] },
                    });

                    const separationPart = (separationResult as any)?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
                    
                    if (separationPart) {
                         console.log(`[AI Controller] Pass 1 Success: Isolated ring generated.`);
                         finalJewelryImagePart = separationPart;
                    } else {
                         console.warn(`[AI Controller] Pass 1 Failed: Fallback to original image.`);
                    }
                } catch (sepError) {
                    console.error('[AI Controller] Error during Pass 1 (Separation):', sepError);
                    // Fallback to original image if separation fails, don't crash the whole process
                }
            }
        }

        // --- PASS 2: TRY-ON ---
        console.log(`[AI Controller] Init Pass 2: Main Try-On generation...`);
        const model = 'gemini-2.5-flash-image';

        const result = await client.models.generateContent({
            model: model,
            contents: [{ role: 'user', parts: [userImagePart, finalJewelryImagePart, { text: basePrompt }] }],
            config: { responseModalities: [Modality.IMAGE] },
        });

        const part = (result as any)?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (!part) {
            return res.status(500).json({ message: 'IA failed to generate image' });
        }

        const imageBase64 = `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
        res.json({ imageBase64 });

    } catch (error: any) {
        console.error('[AI Controller] Error:', error);
        res.status(500).json({ message: error.message || 'Error communicating with AI' });
    }
};
