import { Request, Response } from 'express';
import { StorageHelper } from '../utils/storageHelper';

export const stepCompleted = async (req: Request, res: Response) => {
    try {
        let id = req.query.id as string;
        const stepParam = req.query.step || req.body?.step;

        if (!id) {
            return res.status(401).json({ message: 'No se encontro el ID en la url' });
        }

        const stepNum = Number(stepParam);
        if (!Number.isFinite(stepNum) || stepNum < 1) {
            return res.status(400).json({ message: 'Paso invalido' });
        }

        id = Buffer.from(id, 'base64').toString('ascii');

        const actionType = `step-${Math.floor(stepNum)}-completed`;
        await StorageHelper.updateEvents(id, actionType);

        return res.status(200).json({ status: 'OK', message: 'Paso guardado' });
    } catch (error) {
        console.error('Error general:', error);
        res.status(500).json({ message: 'Server error during step log' });
    }
};
