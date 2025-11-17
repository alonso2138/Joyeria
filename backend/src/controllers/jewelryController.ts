import { Request, Response } from 'express';
import Jewelry from '../models/Jewelry';
import mongoose from 'mongoose';
import { uploadBufferToGridFS, deleteFileFromGridFS } from '../utils/gridFsHelper';

// @desc    Get all jewelry items with optional filters
// @route   GET /api/jewelry
// @access  Public
export const getJewelryItems = async (req: Request, res: Response) => {
    try {
        const { search, hashtag } = req.query;
        const filter: any = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }
        if (hashtag) {
            filter.hashtags = hashtag;
        }
        const items = await Jewelry.find(filter).sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get featured jewelry items
// @route   GET /api/jewelry/featured
// @access  Public
export const getFeaturedJewelryItems = async (req: Request, res: Response) => {
    try {
        const items = await Jewelry.find({ isFeatured: true });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get jewelry by slug
// @route   GET /api/jewelry/slug/:slug
// @access  Public
export const getJewelryBySlug = async (req: Request, res: Response) => {
    try {
        const item = await Jewelry.findOne({ slug: req.params.slug });
        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ message: 'Jewelry not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get jewelry by ID
// @route   GET /api/jewelry/:id
// @access  Public
export const getJewelryById = async (req: Request, res: Response) => {
    try {
         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Jewelry not found' });
        }
        const item = await Jewelry.findById(req.params.id);
        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ message: 'Jewelry not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get unique hashtags
// @route   GET /api/hashtags
// @access  Public
export const getUniqueHashtags = async (req: Request, res: Response) => {
    try {
        const hashtags = await Jewelry.distinct('hashtags');
        res.json(hashtags);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new jewelry item
// @route   POST /api/jewelry
// @access  Private/Admin
export const createJewelryItem = async (req: Request, res: Response) => {
    try {
        console.log('Received data for new jewelry item:', req.body);
        console.log('Uploaded file:', !!req.file);
        
        const jewelryData = { ...req.body };
        
        // Parsear hashtags si vienen como JSON string
        if (jewelryData.hashtags && typeof jewelryData.hashtags === 'string') {
            try {
                jewelryData.hashtags = JSON.parse(jewelryData.hashtags);
            } catch (e) {
                // Si no es JSON válido, dividir por comas
                jewelryData.hashtags = jewelryData.hashtags.split(',').map((tag: string) => tag.trim());
            }
        }
        
        // Si se subió una imagen, guardar en GridFS
        if (req.file && req.file.buffer) {
            const fileId = await uploadBufferToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);
            const imageUrl = `/api/uploads/${fileId}`;
            jewelryData.imageUrl = imageUrl;
            jewelryData.overlayAssetUrl = imageUrl; // Usar la misma imagen para overlay
        }
        
        const newItem = new Jewelry(jewelryData);
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        console.error('Error creating jewelry item:', error);
        res.status(400).json({ message: 'Error creating jewelry item', error });
    }
};

// @desc    Update a jewelry item
// @route   PUT /api/jewelry/:id
// @access  Private/Admin
export const updateJewelryItem = async (req: Request, res: Response) => {
    try {
        console.log('UPDATE - Received data for jewelry ID:', req.params.id);
        console.log('UPDATE - Request body:', JSON.stringify(req.body, null, 2));
        console.log('UPDATE - Uploaded file:', !!req.file);
        
         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Jewelry not found' });
        }
        
        const updateData = { ...req.body };
        
        // Parsear hashtags si vienen como JSON string
        if (updateData.hashtags && typeof updateData.hashtags === 'string') {
            try {
                updateData.hashtags = JSON.parse(updateData.hashtags);
            } catch (e) {
                // Si no es JSON válido, dividir por comas
                updateData.hashtags = updateData.hashtags.split(',').map((tag: string) => tag.trim());
            }
        }
        
        // Si se subió una nueva imagen, guardarla en GridFS y eliminar la anterior
        if (req.file && req.file.buffer) {
            const fileId = await uploadBufferToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);
            const imageUrl = `/api/uploads/${fileId}`;
            updateData.imageUrl = imageUrl;
            updateData.overlayAssetUrl = imageUrl;

            // Si el documento original tenía imageUrl apuntando a GridFS, eliminar el fichero antiguo
            const original = await Jewelry.findById(req.params.id);
            if (original && original.imageUrl && original.imageUrl.startsWith('/api/uploads/')) {
                const oldId = original.imageUrl.split('/api/uploads/')[1];
                if (oldId) {
                    try {
                        await deleteFileFromGridFS(oldId);
                    } catch (e) {
                        console.warn('Failed to delete old GridFS file', e);
                    }
                }
            }
        }
        
        const updatedItem = await Jewelry.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (updatedItem) {
            res.json(updatedItem);
        } else {
            res.status(404).json({ message: 'Jewelry not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error updating jewelry item', error });
    }
};

// Serve GridFS files
export const getUploadById = async (req: Request, res: Response) => {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(500).json({ message: 'Database not ready' });
        }
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'jewelry' });
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        const filesCollection = db.collection('jewelry.files');
        const fileDoc = await filesCollection.findOne({ _id: fileId });
        if (!fileDoc) return res.status(404).json({ message: 'File not found' });

        res.setHeader('Content-Type', fileDoc.contentType || 'application/octet-stream');
        const downloadStream = bucket.openDownloadStream(fileId);
        downloadStream.on('error', (err) => {
            console.error('GridFS download error', err);
            res.status(500).end();
        });
        downloadStream.pipe(res);
    } catch (e) {
        console.error('Error serving file from GridFS', e);
        res.status(500).json({ message: 'Error serving file' });
    }
};

export const deleteUploadById = async (req: Request, res: Response) => {
    try {
        const db = mongoose.connection.db;
        if (!db) return res.status(500).json({ message: 'Database not ready' });
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'jewelry' });
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        await bucket.delete(fileId);
        res.status(204).send();
    } catch (e) {
        console.error('Error deleting file from GridFS', e);
        res.status(500).json({ message: 'Error deleting file' });
    }
};
