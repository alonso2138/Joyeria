import { Request, Response } from 'express';

const SHEETS_HOOK_URL = process.env.SHEETS_HOOK_URL!;
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID!;
const JSONBIN_MASTER_KEY = process.env.JSONBIN_MASTER_KEY!;
const JSONBIN_API_URL = process.env.JSONBIN_API_URL || `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;
console.log(SHEETS_HOOK_URL, JSONBIN_BIN_ID, JSONBIN_API_URL, JSONBIN_MASTER_KEY)
// Función para actualizar el bin con el nuevo evento
async function updateJsonBin(email: string): Promise<void> {
    try {
        // 1. Obtener el contenido actual del bin
        const getResponse = await fetch(`${JSONBIN_API_URL}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_MASTER_KEY
            }
        });

        console.log("MASTER KEY: ",JSONBIN_MASTER_KEY)
        console.log("MASTER KEY: ",JSONBIN_API_URL)

        if (!getResponse.ok) {
            throw new Error(`Error obteniendo bin: ${getResponse.status}`);
        }

        const binData = await getResponse.json();
        const currentRecord = binData.record || [];

        // 2. Crear el nuevo evento
        const newData = {
            email: email,
            timestamp: new Date().toISOString(),
            action_type: "follow-up"
        };

        // 3. Agregar al final del array existente
        const updatedRecord = Array.isArray(currentRecord) 
            ? [...currentRecord, newData] 
            : [newData];

        // 4. Actualizar el bin
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

        console.log('JSONBin actualizado correctamente');
    } catch (error) {
        console.error('Error actualizando JSONBin:', error);
        // No lanzamos el error para no interrumpir el flujo principal
    }
}

export const followAbierto = async (req: Request, res: Response) => {
    console.log("Trigger follow abierto");
    try {   
        // Obtener ID de la query
        let ID = req.query.id as string;
        console.log("ID cifrado: ",ID);

        // Pasarlo a email
        if(ID=="") return res.status(401).json({ message: 'No se encontró el ID en la url' });        
        ID = Buffer.from(ID, "base64").toString("ascii");
        console.log("ID descifrado: ",ID);

        // Ejecutar ambas operaciones en paralelo
        try {
            const [sheetsResult] = await Promise.all([
                // Operación de Google Sheets
                fetch(SHEETS_HOOK_URL, {
                    method: "POST",
                    redirect: "follow", //ignorar esto
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    },
                    body: JSON.stringify({
                        action:"trigger",
                        email:ID,
                        estado:"Aperturas de follow-up"                    
                    })
                }),
                // Operación de JSONBin (en paralelo)
                updateJsonBin(ID)
            ]);

            console.log("Cambiando entrada en base de datos... Status:", sheetsResult.status);

            const text = await sheetsResult.text();
            console.log("Respuesta del servidor:", text);

            // Google Apps Script puede devolver 200 incluso con redirect seguido
            if (sheetsResult.ok) {
                console.log("Éxito");
                return res.status(200).json({ status:"OK", message: 'Éxito guardando trigger de follow abierto' });     
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