import { Request, Response } from 'express';
import { StorageHelper } from '../utils/storageHelper';

const SHEETS_HOOK_URL = process.env.SHEETS_HOOK_URL!;

export const tryOnStarted = async (req: Request, res: Response) => {
    try {
        const batchsize = req.body.batchsize as number | undefined;
        const campaignID = req.body.campaignId as string | undefined;

        // Obtener ID de la query
        let ID = req.query.id as string;
        console.log("ID cifrado: ", ID);

        // Pasarlo a email
        if (ID == "") return res.status(401).json({ message: 'No se encontró el ID en la url' });
        ID = Buffer.from(ID, "base64").toString("ascii");
        console.log("ID descifrado: ", ID);

        // Ejecutar ambas operaciones en paralelo
        try {
            const [sheetsResult] = await Promise.all([
                // Operación de Google Sheets
                fetch(SHEETS_HOOK_URL, {
                    method: "POST",
                    redirect: "follow", // ignorar esto
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    },
                    body: JSON.stringify({
                        action: "trigger",
                        email: ID,
                        estado: "Try-On-Comenzado"
                    })
                }),
                // Operación de Almacenamiento Local (en paralelo)
                StorageHelper.updateEvents(ID, "try-on-started")
            ]);

            console.log("Cambiando entrada en base de datos... Status:", sheetsResult.status);

            const text = await sheetsResult.text();
            console.log("Respuesta del servidor:", text);

            // Google Apps Script puede devolver 200 incluso con redirect seguido
            if (sheetsResult.ok) {
                console.log("Éxito");
                return res.status(200).json({ status: "OK", message: 'Éxito guardando trigger de try-on-started' });
            } else {
                throw new Error(`Hook HTTP ${sheetsResult.status} ${sheetsResult.statusText}: ${text}`);
            }

        } catch (sheetError) {
            console.error('No se pudo actualizar la hoja:', sheetError);
            return res.status(500).json({ message: 'Error actualizando hoja de cálculo' });
        }

    } catch (error) {
        console.error('Error general:', error);
        res.status(500).json({ message: 'Server error during trigger log' });
    }
};