import { Request, Response } from 'express';
import sharp from 'sharp';
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
        let debugPass1Image: string | null = null;

        if (req.body.options && typeof req.body.options === 'object') {
            console.log(`[AI Controller] Received specific options:`, JSON.stringify(req.body.options));
        }

        if ((itemKey === 'anillo' || itemKey === 'alianza') && req.body.options && typeof req.body.options === 'object') {
            const variant = req.body.options.ring_variant || req.body.options.variant;
            console.log(`[AI Controller] Extracted variant: "${variant}" (from options.ring_variant or options.variant)`);
            
            if (variant === 'mujer' || variant === 'hombre') {
                console.log(`[AI Controller] Init Pass 1 (Detection): Finding bounding box for ${variant} ring...`);
                let detectionPrompt = '';
                
                if (variant === 'mujer') {
                    detectionPrompt = "Return the bounding box coordinates [ymin, xmin, ymax, xmax] for the WOMAN'S RING (typically the smaller, thinner, or more decorated one). Return ONLY a JSON array of 4 numbers between 0 and 1000 representing normalized coordinates (0 is top/left, 1000 is bottom/right). Example: [200, 300, 500, 600]";
                } else {
                    detectionPrompt = "Return the bounding box coordinates [ymin, xmin, ymax, xmax] for the MAN'S RING (typically the larger, wider, or more plain one without diamonds). Return ONLY a JSON array of 4 numbers between 0 and 1000 representing normalized coordinates (0 is top/left, 1000 is bottom/right). Example: [200, 300, 500, 600]";
                }

                console.log(`[AI Controller] Sending Pass 1 Detection Prompt to Gemini...`);
                try {
                    const detectionResult = await client.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: [{ role: 'user', parts: [jewelryImagePart, { text: detectionPrompt }] }],
                        config: { 
                            responseMimeType: "application/json",
                            temperature: 0.1
                        },
                    });

                    const responseText = detectionResult.text;
                    console.log(`[AI Controller] Pass 1 Raw Response:`, responseText);
                    
                    if (responseText) {
                        try {
                            const coords = JSON.parse(responseText);
                            if (Array.isArray(coords) && coords.length === 4) {
                                const [ymin, xmin, ymax, xmax] = coords;
                                
                                // Pass 1.5: Crop with Sharp
                                console.log(`[AI Controller] Init Pass 1.5: Cropping image with Sharp...`);
                                
                                const imageMetadata = await sharp(jewelryBuffer).metadata();
                                const width = imageMetadata.width || 1000;
                                const height = imageMetadata.height || 1000;
                                
                                // Convert 0-1000 normalized coordinates to absolute pixels safely
                                const absoluteYmin = Math.max(0, Math.floor((ymin / 1000) * height));
                                const absoluteXmin = Math.max(0, Math.floor((xmin / 1000) * width));
                                const absoluteYmax = Math.min(height, Math.ceil((ymax / 1000) * height));
                                const absoluteXmax = Math.min(width, Math.ceil((xmax / 1000) * width));
                                
                                const cropTop = absoluteYmin;
                                const cropLeft = absoluteXmin;
                                const cropHeight = absoluteYmax - absoluteYmin;
                                const cropWidth = absoluteXmax - absoluteXmin;
                                
                                if (cropWidth > 0 && cropHeight > 0) {
                                    console.log(`[AI Controller] Cropping geometry: top=${cropTop}, left=${cropLeft}, width=${cropWidth}, height=${cropHeight}`);

                                    // Add some padding to the crop (20px) so the ring isn't touching borders
                                    const paddedTop = Math.max(0, cropTop - 20);
                                    const paddedLeft = Math.max(0, cropLeft - 20);
                                    const paddedHeight = Math.min(height - paddedTop, cropHeight + 40);
                                    const paddedWidth = Math.min(width - paddedLeft, cropWidth + 40);

                                    const croppedBuffer = await sharp(jewelryBuffer)
                                        .extract({ top: paddedTop, left: paddedLeft, width: paddedWidth, height: paddedHeight })
                                        .png() // Convert to PNG to maintain transparency if any
                                        .toBuffer();
                                    
                                    finalJewelryImagePart = {
                                        inlineData: {
                                            data: croppedBuffer.toString('base64'),
                                            mimeType: 'image/png'
                                        }
                                    };
                                    
                                    debugPass1Image = `data:image/png;base64,${croppedBuffer.toString('base64')}`;
                                    console.log(`[AI Controller] Pass 1.5 Success: Ring perfectly cropped with Sharp.`);
                                } else {
                                    console.warn(`[AI Controller] Invalid crop dimensions derived from coordinates.`);
                                }
                            }
                        } catch (parseError) {
                            console.error(`[AI Controller] Failed to parse coordinates from Gemini response:`, parseError);
                        }
                    } else {
                         console.warn(`[AI Controller] Pass 1 Failed: Gemini responded but with empty text. Proceeding with original image.`);
                    }
                } catch (sepError: any) {
                    console.error('[AI Controller] Error during Pass 1 (Detection):', sepError.message || sepError);
                }
            } else {
                console.log(`[AI Controller] Pass 1 skipped: Required variant is not 'mujer' or 'hombre'. Current value: ${variant}`);
            }
        } else {
            console.log(`[AI Controller] Pass 1 skipped: Target is not a ring or no options provided. itemKey: ${itemKey}`);
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
        res.json({ imageBase64, ...(debugPass1Image ? { debugPass1Image } : {}) });

    } catch (error: any) {
        console.error('[AI Controller] Error:', error);
        res.status(500).json({ message: error.message || 'Error communicating with AI' });
    }
};
