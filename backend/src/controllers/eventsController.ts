import { Request, Response } from 'express';
import { StorageHelper } from '../utils/storageHelper';

export const getEvents = async (req: Request, res: Response) => {
    try {
        const events = await StorageHelper.getEvents();
        res.json(events);
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
};

export const deleteEventsBatch = async (req: Request, res: Response) => {
    try {
        const { events } = req.body;
        if (!Array.isArray(events)) {
            return res.status(400).json({ message: 'Invalid events format' });
        }

        await StorageHelper.deleteEvents(events);
        res.json({ status: 'OK', message: 'Events deleted successfully' });
    } catch (error) {
        console.error('Error deleting events:', error);
        res.status(500).json({ message: 'Error deleting events' });
    }
};
