import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Organization from '../models/Organization';

const CONFIG_PATH = path.join(__dirname, '../../data/campaignConfig.json');

export const getConfig = async (req: Request, res: Response) => {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            return res.status(404).json({ message: 'Configuration file not found' });
        }
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

        const { tag } = req.query;
        let linkedApiKey = null;

        if (tag && typeof tag === 'string') {
            // Find organization linked to this demoTag
            const org = await Organization.findOne({ demoTag: tag });
            if (org) {
                linkedApiKey = org.apiKey;
            }

            if (config.demoConfigs && config.demoConfigs[tag]) {
                // Mergear configuración global con la específica de la demo
                const demoConfig = config.demoConfigs[tag];
                const mergedConfig = {
                    ...config,
                    linkedApiKey,
                    branding: { ...config.branding, ...demoConfig.branding },
                    uiLabels: { ...config.uiLabels, ...demoConfig.uiLabels },
                    aiPrompts: { ...config.aiPrompts, ...demoConfig.aiPrompts }
                };
                return res.json(mergedConfig);
            }
        }

        res.json({ ...config, linkedApiKey });
    } catch (error) {
        console.error('Error reading config:', error);
        res.status(500).json({ message: 'Error reading configuration' });
    }
};

export const updateConfig = (req: Request, res: Response) => {
    try {
        const newConfig = req.body;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
        res.json({ message: 'Configuration updated successfully', config: newConfig });
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ message: 'Error updating configuration' });
    }
};

export const getDemos = (req: Request, res: Response) => {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            return res.status(404).json({ message: 'Configuration file not found' });
        }
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        const demoConfigs = config.demoConfigs || {};
        res.json(demoConfigs);
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

        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        if (!config.demoConfigs) config.demoConfigs = {};

        config.demoConfigs[tag] = {
            branding: branding || {},
            uiLabels: uiLabels || {},
            aiPrompts: aiPrompts || {}
        };

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

        // Handle Organization Linking
        // 1. Remove this tag from any organization that currently has it
        await Organization.updateMany({ demoTag: tag }, { $unset: { demoTag: 1 } });

        // 2. If an organizationId is provided, link it to this tag
        if (organizationId) {
            await Organization.findByIdAndUpdate(organizationId, { demoTag: tag });
        }

        res.json({ message: 'Demo configuration updated successfully', demo: config.demoConfigs[tag] });
    } catch (error) {
        console.error('Error upserting demo:', error);
        res.status(500).json({ message: 'Error updating demo configuration' });
    }
};

export const deleteDemo = (req: Request, res: Response) => {
    try {
        const { tag } = req.params;
        if (!tag) {
            return res.status(400).json({ message: 'Tag is required' });
        }

        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        if (config.demoConfigs && config.demoConfigs[tag]) {
            delete config.demoConfigs[tag];
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
            return res.json({ message: 'Demo deleted successfully' });
        }

        res.status(404).json({ message: 'Demo not found' });
    } catch (error) {
        console.error('Error deleting demo:', error);
        res.status(500).json({ message: 'Error deleting demo' });
    }
};
