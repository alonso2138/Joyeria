import { Request, Response } from 'express';
import Organization from '../models/Organization';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(__dirname, '../../data/campaignConfig.json');

export const validateApiKey = async (req: Request, res: Response) => {
    try {
        const { apiKey } = req.body;
        const origin = req.headers.origin || req.headers.referer || '';

        if (!apiKey) {
            return res.status(400).json({ valid: false, message: 'API Key missing' });
        }

        const org = await Organization.findOne({ apiKey });

        if (!org) {
            return res.status(404).json({ valid: false, message: 'Invalid API Key' });
        }

        if (!org.isActive) {
            return res.status(403).json({ valid: false, message: 'Account inactive' });
        }

        // --- Monthly Reset Check ---
        const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
        if ((org as any).lastUsageMonth !== currentMonth) {
            org.usageCount = 0;
            (org as any).lastUsageMonth = currentMonth;
            await org.save();
        }

        // 1. Quota Validation (Plan-based - DYNAMIC)
        let quotas: Record<string, number> = {
            free: 25,
            basic: 500,
            premium: Infinity
        };

        try {
            if (fs.existsSync(CONFIG_PATH)) {
                const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
                if (config.saasPlans) {
                    quotas = Object.keys(config.saasPlans).reduce((acc, planKey) => {
                        acc[planKey] = config.saasPlans[planKey].limit;
                        // Map very large numbers or specific keywords back to Infinity for safety
                        if (planKey === 'premium' && acc[planKey] >= 100000) acc[planKey] = Infinity;
                        return acc;
                    }, {} as Record<string, number>);
                }
            }
        } catch (err) {
            console.error('[Security] Error reading plan quotas from config:', err);
        }

        const currentQuota = quotas[org.plan as keyof typeof quotas] || quotas.basic;
        if (org.usageCount >= currentQuota) {
            return res.status(403).json({
                valid: false,
                message: 'Monthly quota exceeded',
                quotaReached: true
            });
        }

        // 2. Strict Domain Validation
        if (org.allowedDomains && org.allowedDomains.length > 0) {
            if (!origin) {
                return res.status(403).json({ valid: false, message: 'Missing origin header' });
            }

            const cleanOrigin = origin.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];

            const isAllowed = org.allowedDomains.some(pattern => {
                // Support exact match or wildcard (e.g., *.example.com)
                if (pattern.startsWith('*.')) {
                    const suffix = pattern.substring(2);
                    return cleanOrigin.endsWith(suffix);
                }
                return cleanOrigin === pattern;
            });

            if (!isAllowed) {
                console.warn(`[Security] Blocked unauthorized domain: ${cleanOrigin} for org ${org.name}`);
                return res.status(403).json({ valid: false, message: 'Domain not authorized' });
            }
        }

        res.status(200).json({
            valid: true,
            orgName: org.name,
            plan: org.plan
        });
    } catch (error) {
        console.error('[WidgetController] validateApiKey error:', error);
        res.status(500).json({ valid: false, message: 'Internal server error' });
    }
};

export const logWidgetEvent = async (req: Request, res: Response) => {
    try {
        const { apiKey, type } = req.body;

        if (!apiKey) {
            return res.status(400).json({ message: 'API Key is required' });
        }

        // Only increment for successful try-ons (or as defined by business logic)
        if (type === 'TRYON_SUCCESS') {
            const currentMonth = new Date().toISOString().substring(0, 7);

            // Check if we need to reset for the new month before incrementing
            const org = await Organization.findOne({ apiKey });
            if (org) {
                if ((org as any).lastUsageMonth !== currentMonth) {
                    org.usageCount = 1; // Start new month at 1
                    (org as any).lastUsageMonth = currentMonth;
                } else {
                    org.usageCount += 1;
                }
                await org.save();
            }
        }

        res.status(200).json({ status: 'OK' });
    } catch (error) {
        console.error('Error logging widget event:', error);
        res.status(500).json({ message: 'Error logging event' });
    }
};

export const getAllOrganizations = async (req: Request, res: Response) => {
    try {
        const orgs = await Organization.find().sort({ createdAt: -1 });
        res.status(200).json(orgs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching organizations' });
    }
};

export const createOrganization = async (req: Request, res: Response) => {
    try {
        const { name, allowedDomains, isActive, plan, ownerEmail } = req.body;

        // Generate a random API key
        const apiKey = `ak_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36).substring(2, 6)}`;

        const newOrg = new Organization({
            name,
            apiKey,
            allowedDomains: allowedDomains || [],
            isActive: isActive !== undefined ? isActive : true,
            plan: plan || 'basic',
            ownerEmail
        });

        await newOrg.save();
        res.status(201).json(newOrg);
    } catch (error) {
        res.status(500).json({ message: 'Error creating organization' });
    }
};

export const updateOrganization = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, allowedDomains, isActive, plan, ownerEmail } = req.body;

        const updatedOrg = await Organization.findByIdAndUpdate(
            id,
            { name, allowedDomains, isActive, plan, ownerEmail },
            { new: true }
        );

        if (!updatedOrg) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        res.status(200).json(updatedOrg);
    } catch (error) {
        res.status(500).json({ message: 'Error updating organization' });
    }
};

export const deleteOrganization = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Organization.findByIdAndDelete(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting organization' });
    }
};

export const resetOrganizationUsage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const org = await Organization.findById(id);
        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        org.usageCount = 0;
        await org.save();
        res.status(200).json(org);
    } catch (error) {
        res.status(500).json({ message: 'Error resetting usage count' });
    }
};
