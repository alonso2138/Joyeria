import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Jewelry from '../models/Jewelry';
import { getGridFSBucket } from '../middleware/gridfsMiddleware';
import connectDB from '../config/db';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

dotenv.config();

/**
 * Script para migrar imágenes del sistema de archivos local a GridFS
 * Solo migra joyas que NO tengan imageFileId (es decir, que usen URLs locales)
 */
async function migrateToGridFS() {
    try {
        await connectDB();
        
        console.log('🔍 Buscando joyas con imágenes locales...');
        
        // Buscar joyas que no tengan imageFileId (usan sistema antiguo)
        const items = await Jewelry.find({ 
            imageFileId: { $exists: false },
            imageUrl: { $exists: true }
        });
        
        console.log(`📦 Encontradas ${items.length} joyas para migrar`);
        
        if (items.length === 0) {
            console.log('✅ No hay joyas para migrar');
            process.exit(0);
        }
        
        const bucket = getGridFSBucket();
        let migrated = 0;
        let skipped = 0;
        
        for (const item of items) {
            try {
                // Extraer el nombre del archivo de la URL
                const imageUrl = item.imageUrl;
                if (!imageUrl) {
                    skipped++;
                    continue;
                }
                
                // Si es una URL HTTP, skip (no podemos migrar desde URLs externas)
                if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                    console.log(`⏭️  Skipping ${item.name} - URL externa: ${imageUrl}`);
                    skipped++;
                    continue;
                }
                
                // Intentar encontrar el archivo en uploads/jewelry/
                const uploadsDir = path.join(__dirname, '../../../uploads/jewelry');
                const filename = path.basename(imageUrl);
                const filepath = path.join(uploadsDir, filename);
                
                if (!fs.existsSync(filepath)) {
                    console.log(`⚠️  Archivo no encontrado para ${item.name}: ${filepath}`);
                    skipped++;
                    continue;
                }
                
                // Leer el archivo
                const fileBuffer = fs.readFileSync(filepath);
                const readableStream = Readable.from(fileBuffer);
                
                // Determinar el tipo MIME
                const ext = path.extname(filename).toLowerCase();
                const mimeTypes: Record<string, string> = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.webp': 'image/webp'
                };
                const contentType = mimeTypes[ext] || 'image/jpeg';
                
                // Subir a GridFS
                const uploadStream = bucket.openUploadStream(filename, {
                    contentType,
                    metadata: {
                        originalName: filename,
                        migratedFrom: imageUrl
                    }
                });
                
                await new Promise((resolve, reject) => {
                    readableStream.pipe(uploadStream)
                        .on('finish', resolve)
                        .on('error', reject);
                });
                
                // Actualizar el documento de la joya
                item.imageFileId = uploadStream.id.toString();
                item.imageUrl = `/api/jewelry/image/${uploadStream.id.toString()}`;
                item.overlayAssetUrl = `/api/jewelry/image/${uploadStream.id.toString()}`;
                await item.save();
                
                console.log(`✅ Migrado: ${item.name} -> ${uploadStream.id.toString()}`);
                migrated++;
                
            } catch (error) {
                console.error(`❌ Error migrando ${item.name}:`, error);
                skipped++;
            }
        }
        
        console.log('\n📊 Resumen de migración:');
        console.log(`   Migradas: ${migrated}`);
        console.log(`   Omitidas: ${skipped}`);
        console.log(`   Total: ${items.length}`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    migrateToGridFS();
}

export default migrateToGridFS;
