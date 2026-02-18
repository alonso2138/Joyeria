import { Request, Response } from 'express';
import Organization from '../models/Organization';
import GlobalConfig from '../models/GlobalConfig';
import DemoConfig from '../models/DemoConfig';

/**
 * Helper to get the single global configuration document.
 * Creates one with defaults if none exists.
 */
const getGlobalConfigDoc = async () => {
    let config = await GlobalConfig.findOne();
    if (!config) {
        config = await GlobalConfig.create({});
    }
    return config;
};

export const getConfig = async (req: Request, res: Response) => {
    try {
        const globalConfig = await getGlobalConfigDoc();
        const { tag, apiKey } = req.query;

        let linkedApiKey = apiKey as string || null;
        let demoConfig = null;
        let orgShutterDesign = 'default';
        let orgTryOnInstruction = '';

        // 1. If we have a tag, find the demo and the linked org
        if (tag && typeof tag === 'string') {
            const orgByTag = await Organization.findOne({ demoTag: tag });
            if (orgByTag) {
                linkedApiKey = orgByTag.apiKey;
                orgShutterDesign = orgByTag.shutterDesign || 'default';
                orgTryOnInstruction = orgByTag.tryOnInstruction || '';
            }
            demoConfig = await DemoConfig.findOne({ tag });
        }

        // 2. If we have an apiKey (either from tag search or direct param), get org-level settings
        if (linkedApiKey) {
            const orgByKey = await Organization.findOne({ apiKey: linkedApiKey });
            if (orgByKey) {
                orgShutterDesign = orgByKey.shutterDesign || 'default';
                orgTryOnInstruction = orgByKey.tryOnInstruction || '';
            }
        }

        // --- SANITIZATION: Only return specific public fields ---
        const sanitizedConfig = {
            branding: {
                ...globalConfig.branding,
                ...(demoConfig?.branding || {}),
                shutterDesign: orgShutterDesign // Org selection takes precedence if present
            },
            uiLabels: {
                ...globalConfig.uiLabels,
                ...(demoConfig?.uiLabels || {}),
                ...(orgTryOnInstruction ? { tryOnInstruction: orgTryOnInstruction } : {}) // Org selection takes precedence if present
            },
            customizationOptions: globalConfig.customizationOptions,
            tryOnMetadata: globalConfig.tryOnMetadata,
            linkedApiKey // Controlled: only for the requested tag
        };

        res.json(sanitizedConfig);
    } catch (error) {
        console.error('Error reading config:', error);
        res.status(500).json({ message: 'Error reading configuration' });
    }
};

export const updateConfig = async (req: Request, res: Response) => {
    try {
        const newConfig = req.body;
        let config = await GlobalConfig.findOne();

        if (config) {
            // Update existing
            Object.assign(config, newConfig);
            await config.save();
        } else {
            // Create new
            config = await GlobalConfig.create(newConfig);
        }

        res.json({ message: 'Configuration updated successfully', config });
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ message: 'Error updating configuration' });
    }
};

export const getDemos = async (req: Request, res: Response) => {
    try {
        const demos = await DemoConfig.find();
        // Return as a map to maintain compatibility with the previous JSON structure
        const demoMap: Record<string, any> = {};
        demos.forEach(d => {
            demoMap[d.tag] = d;
        });
        res.json(demoMap);
    } catch (error) {
        console.error('Error reading demos:', error);
        res.status(500).json({ message: 'Error reading demos' });
    }
};

export const upsertDemo = async (req: Request, res: Response) => {
    try {
        const { tag, branding, uiLabels, aiPrompts, organizationId } = req.body;
        if (!tag) {
            return res.status(400).json({ message: 'Tag is required' });
        }

        // Update or create DemoConfig
        const demo = await DemoConfig.findOneAndUpdate(
            { tag },
            { branding: branding || {}, uiLabels: uiLabels || {}, aiPrompts: aiPrompts || {} },
            { upsert: true, new: true }
        );

        // Handle Organization Linking
        // 1. Remove this tag from any organization that currently has it
        await Organization.updateMany({ demoTag: tag }, { $unset: { demoTag: 1 } });

        // 2. If an organizationId is provided, link it to this tag
        if (organizationId) {
            await Organization.findByIdAndUpdate(organizationId, { demoTag: tag });
        }

        res.json({ message: 'Demo configuration updated successfully', demo });
    } catch (error) {
        console.error('Error upserting demo:', error);
        res.status(500).json({ message: 'Error updating demo configuration' });
    }
};

export const deleteDemo = async (req: Request, res: Response) => {
    try {
        const { tag } = req.params;
        if (!tag) {
            return res.status(400).json({ message: 'Tag is required' });
        }

        const result = await DemoConfig.findOneAndDelete({ tag });
        if (result) {
            return res.json({ message: 'Demo deleted successfully' });
        }

        res.status(404).json({ message: 'Demo not found' });
    } catch (error) {
        console.error('Error deleting demo:', error);
        res.status(500).json({ message: 'Error deleting demo' });
    }
};

export const createAutoDemo = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const baseTag = name.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with -
            .replace(/-+/g, '-') // Replace multiple - with single
            .replace(/^-|-$/g, ''); // Trim -

        let tag = baseTag;
        let counter = 1;

        while (await DemoConfig.findOne({ tag })) {
            tag = `${baseTag}-${counter}`;
            counter++;
        }

        // Initialize with minimal clear branding/labels
        const newDemo = await DemoConfig.create({
            tag,
            branding: {
                name: name,
                ctaTryOn: "Probar ahora"
            },
            uiLabels: {},
            aiPrompts: {}
        });

        res.json({ success: true, tag });
    } catch (error) {
        console.error('Error creating auto demo:', error);
        res.status(500).json({ message: 'Error creating demo' });
    }
};
