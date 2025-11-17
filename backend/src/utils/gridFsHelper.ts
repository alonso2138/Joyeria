import mongoose from 'mongoose';
import stream from 'stream';
import path from 'path';

export const uploadBufferToGridFS = async (buffer: Buffer, originalName: string, mimetype: string, bucketName = 'jewelry') => {
    const db = mongoose.connection.db;
    if (!db) throw new Error('No DB connection');
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName });
    const ext = path.extname(originalName) || '';
    const filename = `jewelry-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const uploadStream = bucket.openUploadStream(filename, { contentType: mimetype });

    const readable = new stream.Readable({ read() {} });
    readable.push(buffer);
    readable.push(null);

    readable.pipe(uploadStream);

    return new Promise<any>((resolve, reject) => {
        uploadStream.on('error', (err) => reject(err));
        uploadStream.on('finish', () => {
            resolve(uploadStream.id);
        });
    });
};

export const deleteFileFromGridFS = async (fileId: any, bucketName = 'jewelry') => {
    const db = mongoose.connection.db;
    if (!db) throw new Error('No DB connection');
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName });
    try {
        await bucket.delete(new mongoose.Types.ObjectId(fileId));
    } catch (err) {
        console.warn('Warning: failed to delete file from GridFS', err);
    }
};
