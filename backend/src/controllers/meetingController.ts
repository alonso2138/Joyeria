import { Request, Response } from 'express';
import { Resend } from 'resend';
import https from 'https';

const SHEETS_HOOK_URL = process.env.SHEETS_HOOK_URL!;

type TelegramConfig = {
    botToken: string;
    chatId: string;
};

let telegramConfig: TelegramConfig | null = null;
let notifiersInitialized = false;
let adminAction = '';
let resendClient: Resend | null = null;
let mailFrom = '';

const initializeNotifiers = () => {
    if (notifiersInitialized) return;

    const { RESEND_API_KEY, RESEND_FROM, EMAIL_FROM, SMTP_FROM } = process.env;
    if (RESEND_API_KEY) {
        resendClient = new Resend(RESEND_API_KEY);
        mailFrom = RESEND_FROM || EMAIL_FROM || SMTP_FROM || '';
        if (!mailFrom) {
            console.warn('Define RESEND_FROM (o EMAIL_FROM/SMTP_FROM) para el campo "from" de los correos.');
        }
    } else {
        console.warn('RESEND_API_KEY no configurada; habilita RESEND_API_KEY y RESEND_FROM para enviar correos.');
    }

    const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        telegramConfig = {
            botToken: TELEGRAM_BOT_TOKEN,
            chatId: TELEGRAM_CHAT_ID,
        };
    } else {
        console.warn('Telegram configuration missing; set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable sendTelegramNotification.');
    }

    notifiersInitialized = true;
};

export const sendTelegramNotification = async (text: string) => {
    initializeNotifiers();

    if (!telegramConfig) {
        throw new Error('Telegram not configured. Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.');
    }

    const payload = JSON.stringify({
        chat_id: telegramConfig.chatId,
        text,
        parse_mode: 'HTML',
    });

    const url = new URL(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`);

    await new Promise<void>((resolve, reject) => {
        const req = https.request(
            url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            },
            (res) => {
                const chunks: Buffer[] = [];
                res.on('data', (chunk: Buffer) => chunks.push(chunk));
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 400) {
                        const body = chunks.length ? Buffer.concat(chunks).toString() : '';
                        return reject(new Error(`Telegram API error ${res.statusCode}: ${body}`));
                    }
                    resolve();
                });
            }
        );

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
};

export const meeting = async (req: Request, res: Response) => {
    try {
        await sendTelegramNotification(`🚨 NUEVO MEETING ALERTA\n  Nombre: ${req.query.nombre}\n  Email: ${req.query.email}`);
        return res.status(200).json({ status: "OK", message: "Notificación de meetinge enviada con éxito" })
    } catch (error) {
        console.error('Error general:', error);
        return res.status(500).json({ message: 'Server error during trigger log' });
    }
};