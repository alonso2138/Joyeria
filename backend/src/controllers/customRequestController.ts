import { Request, Response } from 'express';
import CustomRequest from '../models/CustomRequest';
import { sendTelegramNotification } from './meetingController';

export const createCustomRequest = async (req: Request, res: Response) => {
    try {
        const payload = req.body;

        // Save to database
        const newRequest = new CustomRequest(payload);
        const savedRequest = await newRequest.save();

        // Send Telegram Notification
        try {
            const message = `💎 <b>NUEVO LEAD CTA:</b>\nNombre: ${payload.customerName || 'Sin nombre'}\nEmail: ${payload.customerEmail || 'Sin email'}`;
            await sendTelegramNotification(message);
        } catch (telegramErr) {
            console.error('Failed to send Telegram notification for custom request:', telegramErr);
        }

        return res.status(201).json(savedRequest);
    } catch (error) {
        console.error('Error creating custom request:', error);
        return res.status(500).json({ message: 'Error saving your request' });
    }
};

export const getCustomRequests = async (req: Request, res: Response) => {
    try {
        const requests = await CustomRequest.find().sort({ createdAt: -1 });
        return res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching custom requests:', error);
        return res.status(500).json({ message: 'Error fetching requests' });
    }
};
