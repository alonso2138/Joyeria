import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Organization from '../models/Organization';

const CONFIG_PATH = path.join(__dirname, '../../data/campaignConfig.json');

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
        const org = await Organization.findOne({ demoTag: tag });
        if (!org || !org.isActive) {
            return res.status(403).json({ message: 'This demo is not authorized for AI generation (Missing Org)' });
        }

        // 2. Load config for AI Prompts
        let config = { aiPrompts: { categoryPrompts: {} } };
        if (fs.existsSync(CONFIG_PATH)) {
            config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        }

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
        const categoryPrompts = (config as any).aiPrompts?.categoryPrompts || {};
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

        const model = 'gemini-2.5-flash-image';

        const result = await client.models.generateContent({
            model: model,
            contents: [{ role: 'user', parts: [userImagePart, jewelryImagePart, { text: basePrompt }] }],
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
