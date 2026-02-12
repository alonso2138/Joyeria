import { Request, Response } from 'express';
import { StorageHelper } from '../utils/storageHelper';

const SHEETS_HOOK_URL = process.env.SHEETS_HOOK_URL!;

export const b2bEvent = async (req: Request, res: Response) => {
    try {
        const { eventType } = req.params;
        let ID = req.query.id as string;

        if (!ID) {
            // For B2B landing, we might want to log anonymous events too, 
            // but the current system relies on ID. 
            // We'll skip Sheets update if no ID, but could log to local storage with a session ID.
            return res.status(200).json({ status: 'OK', message: 'No ID, event skipped for Sheets' });
        }

        try {
            // Decoding ID (expected to be base64 email for this architecture)
            if (ID.length > 5) { // Simple check to see if it might be base64
                try {
                    const decoded = Buffer.from(ID, "base64").toString("ascii");
                    if (decoded.includes('@')) {
                        ID = decoded;
                    }
                } catch (e) {
                    // Not base64, use as is (maybe it's already an email or a tag)
                }
            }

            // We use the eventType to decide the "estado" in Sheets
            const actionLabels: Record<string, string> = {
                "landing-view": "Visto Landing B2B",
                "cta-primary-click": "Click CTA Principal",
                "intelligent-demo-start": "Inició Demo IA",
                "intelligent-demo-success": "Vio Demo IA (Modelo)",
                "roi-calc-interact": "Usó Calculadora ROI",
                "whatsapp-kit-copy": "Copió Kit WhatsApp",
                "b2b-links-submit": "Envió Links Joyas",
                "pricing-view": "Visto Precios"
            };

            const estadoLabel = actionLabels[eventType] || `B2B: ${eventType}`;

            // --- Telegram Notifications for Hot Leads ---
            if (eventType === 'cta-primary-click' || eventType === 'b2b-links-submit') {
                try {
                    const { sendTelegramNotification } = await import('./meetingController');
                    let message = `🚀 <b>NUEVO LEAD B2B</b>\n`;
                    message += `Email: ${ID}\n`;
                    message += `Acción: ${estadoLabel}`;

                    if (eventType === 'b2b-links-submit') {
                        const jewelryInfo = req.query.jewelryInfo as string;
                        if (jewelryInfo) {
                            message += `\n📍 <b>Piezas:</b>\n<i>${jewelryInfo}</i>`;
                        } else {
                            message += `\n📍 <i>(Este lead ha enviado sus piezas)</i>`;
                        }
                    }

                    await sendTelegramNotification(message);
                } catch (telegramErr) {
                    console.error('Failed to send Telegram notification:', telegramErr);
                }
            }

            await Promise.all([
                fetch(SHEETS_HOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({
                        action: "trigger",
                        email: ID,
                        estado: estadoLabel
                    })
                }),
                StorageHelper.updateEvents(ID, eventType)
            ]);

            return res.status(200).json({ status: "OK", message: `Event ${eventType} logged` });
        } catch (err) {
            console.error('Error logging B2B event:', err);
            return res.status(500).json({ message: 'Error updating tracking' });
        }
    } catch (error) {
        console.error('General B2B event error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
