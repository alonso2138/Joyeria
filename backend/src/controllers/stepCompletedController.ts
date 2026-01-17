import { Request, Response } from 'express';

const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;
const JSONBIN_MASTER_KEY = process.env.JSONBIN_MASTER_KEY;
const JSONBIN_API_URL =
    process.env.JSONBIN_API_URL ||
    (JSONBIN_BIN_ID ? `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}` : '');

async function updateJsonBin(email: string, actionType: string): Promise<void> {
    if (!JSONBIN_BIN_ID || !JSONBIN_MASTER_KEY || !JSONBIN_API_URL) {
        console.warn('JSONBin no configurado; omitiendo evento', actionType);
        return;
    }

    try {
        const getResponse = await fetch(`${JSONBIN_API_URL}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_MASTER_KEY
            }
        });

        if (!getResponse.ok) {
            throw new Error(`Error obteniendo bin: ${getResponse.status}`);
        }

        const binData = await getResponse.json();
        const currentRecord = binData.record || [];

        const newData = {
            email,
            timestamp: new Date().toISOString(),
            action_type: actionType
        };

        const updatedRecord = Array.isArray(currentRecord)
            ? [...currentRecord, newData]
            : (currentRecord && Array.isArray(currentRecord.events))
                ? { ...currentRecord, events: [...currentRecord.events, newData] }
                : [newData];

        const putResponse = await fetch(JSONBIN_API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_MASTER_KEY
            },
            body: JSON.stringify(updatedRecord)
        });

        if (!putResponse.ok) {
            throw new Error(`Error actualizando bin: ${putResponse.status}`);
        }
    } catch (error) {
        console.error('Error actualizando JSONBin:', error);
    }
}

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
        await updateJsonBin(id, actionType);

        return res.status(200).json({ status: 'OK', message: 'Paso guardado' });
    } catch (error) {
        console.error('Error general:', error);
        res.status(500).json({ message: 'Server error during step log' });
    }
};
