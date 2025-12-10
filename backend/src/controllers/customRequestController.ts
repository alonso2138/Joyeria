import { Request, Response } from 'express';
import CustomRequest from '../models/CustomRequest';

// Crear una solicitud personalizada (pública)
export const createCustomRequest = async (req: Request, res: Response) => {
    try {
        const payload = { ...req.body };
        if (!payload.pieceType || !payload.material) {
            return res.status(400).json({ message: 'pieceType y material son obligatorios' });
        }
        const created = await CustomRequest.create(payload);
        return res.status(201).json({ id: created.id, createdAt: created.createdAt });
    } catch (error) {
        console.error('Error creating custom request', error);
        return res.status(500).json({ message: 'Server error creating custom request' });
    }
};

// Listar solicitudes (admin)
export const getCustomRequests = async (_req: Request, res: Response) => {
    try {
        const requests = await CustomRequest.find().sort({ createdAt: -1 }).limit(200);
        return res.json(requests);
    } catch (error) {
        console.error('Error fetching custom requests', error);
        return res.status(500).json({ message: 'Server error fetching custom requests' });
    }
};
