import multer from 'multer';
import mongoose from 'mongoose';
import { Request } from 'express';

// Configuración de memoria para multer
const storage = multer.memoryStorage();

export const uploadToMemory = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Función para obtener el bucket de GridFS
export const getGridFSBucket = () => {
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('Database not connected');
    }
    const mongodb = mongoose.mongo;
    return new mongodb.GridFSBucket(db, {
        bucketName: 'jewelry_images'
    });
};


