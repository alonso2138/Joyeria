import { Request, Response } from 'express';
import https from 'https';
import Papa from 'papaparse';
import { Resend } from 'resend';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1UTNIkH7J9xPVrOHHL0RgqsZ0Yuz6r6StQWu6ASVQSww/export?format=csv';

type CsvRow = Record<string, string>;

type Lead = {
    nombre: string;
    email: string;
    estado: string;
    campanaId: string;
    aperturasCold: number;
    aperturasFollow: number;
    aperturasLink: number;
    respuesta: string;
    tryOn: number;
    tryOnStarted: number;
    eventos: any[];
    score: number;
    ultimaAccion: string | null;
};

type TelegramConfig = {
    botToken: string;
    chatId: string;
};

let telegramConfig: TelegramConfig | null = null;
let notifiersInitialized = false;
let adminAction = '';
let resendClient: Resend | null = null;
let mailFrom = '';
const SHEETS_HOOK_URL =
    process.env.SHEETS_HOOK_URL ||
    'https://script.google.com/macros/s/AKfycbzW6IyAaawNV2z665RTC3PthHqNWqJapgJZMQMm38SkAvTLCRqWl1Ni_Hrx6Mbo6Hhk/exec';

const normalizeEmail = (value: unknown) => {
    const email = String(value ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) return '';
    return email;
};

const normalizeCampaignId = (value: unknown) => {
    return String(value ?? '').trim().toLowerCase();
};

const toInt = (value: unknown) => {
    const parsed = parseInt(String(value ?? '').trim(), 10);
    return Number.isFinite(parsed) ? parsed : 0;
};

const mergeLeadRecords = (a: Lead, b: Lead): Lead => ({
    nombre: b.nombre || a.nombre,
    email: a.email,
    estado: b.estado || a.estado,
    campanaId: b.campanaId || a.campanaId,
    aperturasCold: Math.max(a.aperturasCold, b.aperturasCold),
    aperturasFollow: Math.max(a.aperturasFollow, b.aperturasFollow),
    aperturasLink: Math.max(a.aperturasLink, b.aperturasLink),
    respuesta: b.respuesta || a.respuesta,
    tryOn: Math.max(a.tryOn, b.tryOn),
    tryOnStarted: Math.max(a.tryOnStarted, b.tryOnStarted),
    eventos: [...a.eventos, ...b.eventos],
    score: Math.max(a.score, b.score),
    ultimaAccion: b.ultimaAccion || a.ultimaAccion,
});

const fetchCsv = async (): Promise<CsvRow[]> => {
    const res = await fetch(CSV_URL);
    if (!res.ok) {
        throw new Error('No se pudo descargar el CSV');
    }
    const text = await res.text();
    const parsed = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });
    return parsed.data || [];
};

// Placeholder: completa si tienes otra fuente de eventos.
const fetchEvents = async (): Promise<any[]> => {
    return [];
};

const extractAdminControl = (rows: CsvRow[]) => {
    let adminRowAction = '';
    const remaining: CsvRow[] = [];
    rows.forEach((row) => {
        const name = (row['Nombre'] || '').trim().toUpperCase();
        if (name === 'ADMIN') {
            adminRowAction = (row['Accion'] || '').trim();
        } else {
            remaining.push(row);
        }
    });
    return { rowsWithoutAdmin: remaining, adminAction: adminRowAction };
};

const buildLeadsFromCsv = (rows: CsvRow[]): Map<string, Lead> => {
    const leads = new Map<string, Lead>();
    rows.forEach((row) => {
        const email = normalizeEmail(row['Email']);
        if (!email) return;
        const lead: Lead = {
            nombre: (row['Nombre'] || '').trim() || 'Sin nombre',
            email,
            estado: (row['Estado'] || '').trim() || 'Sin estado',
            campanaId: normalizeCampaignId(row['ID campana']),
            aperturasCold: toInt(row['Aperturas de cold']),
            aperturasFollow: toInt(row['Aperturas de follow-up']),
            aperturasLink: toInt(row['Aperturas de link']),
            respuesta: (row['Respuesta'] || '').trim(),
            tryOn: toInt(row['Try-On Generado']),
            tryOnStarted: toInt(row['Try-On-Comenzado']),
            eventos: [],
            score: 0,
            ultimaAccion: null,
        };
        if (leads.has(email)) {
            const merged = mergeLeadRecords(leads.get(email) as Lead, lead);
            leads.set(email, merged);
        } else {
            leads.set(email, lead);
        }
    });
    return leads;
};

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

const callSheetsHook = async (payload: Record<string, unknown>) => {
    const res = await fetch(SHEETS_HOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Hook HTTP ${res.status}: ${text}`);
    }

    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; msg?: string };
    if (!data.ok) {
        throw new Error(`Hook respondio con error: ${data.msg || 'respuesta inesperada'}`);
    }

    return data;
};

const updateLeadEstadoInSheet = async (email: string, newStatus: string) => {
    const normalized = normalizeEmail(email);
    if (!normalized) throw new Error('Email invalido para Sheets');

    await callSheetsHook({
        action: 'action',
        email: normalized,
        estado: newStatus,
    });
};

const setAdminActionInSheet = async (action: string) => {
    await callSheetsHook({ adminAction: action });
};

export const sendMail = async (to: string, subject: string, html: string) => {
    initializeNotifiers();

    if (!resendClient) {
        throw new Error('Mailer not configured. Please set RESEND_API_KEY/RESEND_FROM environment variables.');
    }

    if (!mailFrom) {
        throw new Error('Missing RESEND_FROM (or EMAIL_FROM/SMTP_FROM) to set the "from" field.');
    }

    console.log("Mensaje enviado: ", await resendClient.emails.send({
        from: mailFrom,
        to,
        subject,
        html,
    }));
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

export const launchColdApproach = async (req: Request, res: Response) => {
    try {
        const batchsize = req.body.batchsize as number | undefined;
        const campaignID = req.body.campaignId as string | undefined;

        console.log(batchsize,campaignID)

        const [csvRows, events] = await Promise.all([fetchCsv(), fetchEvents()]);
        const { rowsWithoutAdmin, adminAction: csvAdminAction } = extractAdminControl(csvRows);
        adminAction = csvAdminAction;

        const leadsMap = buildLeadsFromCsv(rowsWithoutAdmin);
        console.log("Leads encontrados: ",leadsMap.size);

        // Asociar eventos a cada lead si los traes de otro origen (placeholder)
        events.forEach((_ev) => {
            return;
        });

        let leads = Array.from(leadsMap.values()).filter((lead) => {
            console.log("ID de campaña: ",campaignID, "ID de lead: ",lead.campanaId)
            const matchesCampaign = campaignID ? lead.campanaId === normalizeCampaignId(campaignID) : false;
            return lead.email && lead.estado.toLowerCase() === 'no contactado' && matchesCampaign;
        });

        console.log("Leads filtrados: ", leads.length)

        if (batchsize && batchsize > 0) {
            leads = leads.slice(0, batchsize);
        }

        console.log("Leads tras filtrar batchsize: ", leads.length);

        // Cambiando estado a Corriendo
        try {
            const res = await fetch(SHEETS_HOOK_URL, {
                method: "POST",
                headers: {
                "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify({ adminAction: "Corriendo" }),
            });
        } catch (sheetError) {
            console.error('No se pudo actualizar la hoja para', sheetError);
        }

        // Le decimos al admin que se han pasado las validaciones y el proceso está en marcha
        console.log("Campaña validada, diciendoselo al admin")
        res.status(200).json({ message: 'Cold approach executed' });
        console.log("Respuesta enviada correctamente")

        for(let i = 0; i < leads.length; i++){
            console.log("Empezando el lead numero ",i+1)

            console.log(JSON.stringify(leads[i]))

            const horarios = ['09:15-12:45', '15:45-18:30'];
            let diaValidado = false;
            let horarioValidado = false;

            do {
                const d = new Date();
                const now = d.getMinutes() + d.getHours() * 60;

                horarios.forEach((horario) => {
                    const hStart = parseInt(horario.substring(0, 2));
                    const mStart = parseInt(horario.substring(3, 5));
                    const MIN_START = hStart * 60 + mStart;

                    const hEnd = parseInt(horario.substring(6, 8));
                    const mEnd = parseInt(horario.substring(9, 11));
                    const MIN_END = hEnd * 60 + mEnd;

                    if (MIN_START < now && now < MIN_END) horarioValidado = true;
                });

                const diaSimple = d
                    .toLocaleDateString('es-ES', { weekday: 'long' })
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');

                if (!(diaSimple === 'viernes' || diaSimple === 'sabado' || diaSimple === 'domingo')) diaValidado = true;

                if (diaValidado==false || horarioValidado==false){
                    console.log("Horario/Día "+diaValidado+"/"+horarioValidado+"+ no validado, intentando en 30min");
                    await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000));
                }
            } while (diaValidado==false || horarioValidado==false);

            console.log("Horario y Día validado")

            const encodedEmail = Buffer.from(leads[i].email).toString('base64');

            console.log("Codificando email de lead... ("+leads[i].email+")   => "+encodedEmail);
            
            console.log("Admin action: ",adminAction)

            if (adminAction && adminAction.toLowerCase() === 'stop') {
                console.log("Ending process, admin action: ",adminAction)
                return res.status(200).json({ message: 'Proceso detenido por ADMIN en hoja', adminAction });
            }

            console.log("Enviando mail...")

            await sendMail(
                `${leads[i].email}`,
                `Cuando un cliente duda entre dos piezas`,
`Hola!<br><br>Seguro que te pasa a menudo: un cliente mira una pulsera o un reloj, le gusta pero no termina de decidirse.<br><br>Estoy ayudando a algunas joyerias a que el cliente se decida antes de comprar, usando una pagina donde puede verse la joya que quiera puesta desde el movil en segundos.<br><br>Puedes probarlo tu mismo aqui (sin registro) en apenas 10 segundos:<br><a href="https://visualizalo.es?id=${encodedEmail}">Probar el probador virtual</a><br><br>Si os parece interesante la idea, os invito a hacer una prueba gratuita, con vuestras piezas, para que veais si realmente os sirve en vuestro dia a dia.<br><br>Si no es algo que encaje con vuestra forma de vender, dimelo sin problema, se agradece cualquier feedback.<br><br>Muchas gracias por su tiempo,<br>Alonso Valls<br><br><img src="https://api.visualizalo.es/api/trigger/cold-abierto?id=${encodedEmail}" alt="" width="1" height="1" style="display:none!important;min-height:0;height:0;max-height:0;width:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;" />`);

            console.log("Mail enviado, enviando notificacion de telegram")

            await sendTelegramNotification(`Mail frio enviado a ${leads[i].email}`);

            updateLeadEstadoInSheet(leads[i].email, "Cold-Approach enviado");

            // Delay arbitrario para siguiente mail => Entre 120 y 180s
            if(!(i === leads.length - 1)){
                await new Promise(resolve => setTimeout(resolve, (Math.floor(Math.random() * (180 - 120 + 1)) + 120)*1000));
            }  
        }

        // Cambiando estado a Acabado
        try {
            const res = await fetch(SHEETS_HOOK_URL, {
                method: "POST",
                headers: {
                "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify({ adminAction: "Acabado" }),
            });
        } catch (sheetError) {
            console.error('No se pudo actualizar la hoja para', sheetError);
        }
        
    }catch(error){
            res.status(500).json({ message: 'Failed to execute cold approach' });
    }
};




