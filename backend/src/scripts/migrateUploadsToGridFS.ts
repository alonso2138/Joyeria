import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import Jewelry from '../models/Jewelry';
import connectDB from '../config/db';
import { uploadBufferToGridFS, deleteFileFromGridFS } from '../utils/gridFsHelper';

dotenv.config();

const migrate = async () => {
    await connectDB();
    const items = await Jewelry.find({});
    console.log('Found', items.length, 'items');

    for (const item of items) {
        if (item.imageUrl && item.imageUrl.includes('/uploads/')) {
            console.log('Migrating item', item.slug);
            let buffer: Buffer | null = null;
            const url = item.imageUrl;
            try {
                if (url.startsWith('http')) {
                    const resp = await fetch(url);
                    if (!resp.ok) throw new Error('Failed to fetch remote file');
                    const arrayBuffer = await resp.arrayBuffer();
                    buffer = Buffer.from(arrayBuffer);
                } else {
                    // local file path
                    const localPath = path.join(process.cwd(), 'uploads', url.replace('/uploads/', ''));
                    if (fs.existsSync(localPath)) {
                        buffer = fs.readFileSync(localPath);
                    }
                }

                if (buffer) {
                    const fileId = await uploadBufferToGridFS(buffer, `${item.slug}.jpg`, 'image/jpeg');
                    item.imageUrl = `/api/uploads/${fileId}`;
                    item.overlayAssetUrl = `/api/uploads/${fileId}`;
                    await item.save();
                    console.log('Migrated:', item.slug, '->', item.imageUrl);
                    // Optionally delete local file
                    // fs.unlinkSync(localPath);
                } else {
                    console.warn('No buffer found for', item.slug);
                }
            } catch (err) {
                console.error('Failed migration for', item.slug, err);
            }
        }
    }

    process.exit(0);
};

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
