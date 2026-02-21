import { Request, Response } from 'express';
import { StorageHelper } from '../utils/storageHelper';

const SHEETS_HOOK_URL = process.env.SHEETS_HOOK_URL!;

export const baja = async (req: Request, res: Response) => {
    console.log("Trigger baja (unsubscribe)");
    try {
        let ID = req.query.id as string;
        if (!ID) return res.status(400).json({ message: 'No se encontró el ID en la url' });

        // Pasarlo a email
        try {
            ID = Buffer.from(ID, "base64").toString("ascii");
        } catch (e) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        console.log("ID descifrado (email): ", ID);

        try {
            const [sheetsResult] = await Promise.all([
                // Operación de Google Sheets
                fetch(SHEETS_HOOK_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    },
                    body: JSON.stringify({
                        action: "unsubscribe",
                        email: ID
                    })
                }),
                // Operación de Almacenamiento Local
                StorageHelper.updateEvents(ID, "unsubscribed")
            ]);

            console.log("Cambiando entrada en base de datos de Sheets... Status:", sheetsResult.status);

            if (sheetsResult.ok) {
                return res.status(200).json({ status: "OK", message: 'Baja tramitada con éxito' });
            } else {
                const text = await sheetsResult.text();
                throw new Error(`Hook HTTP ${sheetsResult.status}: ${text}`);
            }

        } catch (sheetError) {
            console.error('No se pudo actualizar la hoja:', sheetError);
            return res.status(500).json({ message: 'Error actualizando hoja de cálculo' });
        }

    } catch (error) {
        console.error('Error general en baja:', error);
        res.status(500).json({ message: 'Server error during unsubscribe' });
    }
};
