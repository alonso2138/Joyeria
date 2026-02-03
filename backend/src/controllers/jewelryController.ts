import { Request, Response } from 'express';
import Jewelry from '../models/Jewelry';
import mongoose from 'mongoose';
import { getGridFSBucket } from '../middleware/gridfsMiddleware';
import { Readable } from 'stream';

// @desc    Get all jewelry items with optional filters
// @route   GET /api/jewelry
// @access  Public
export const getJewelryItems = async (req: Request, res: Response) => {
    try {
        const { search, hashtag, catalogId } = req.query;
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

        const queryObj: any = { ...filter };

        // Handle catalogId isolation
        if (catalogId && catalogId !== 'all') {
            if (catalogId === 'main') {
                const catalogFilter = { $or: [{ catalogId: 'main' }, { catalogId: { $exists: false } }] };
                if (queryObj.$or) {
                    // Combine search $or and catalog $or using $and
                    const searchOr = queryObj.$or;
                    delete queryObj.$or;
                    queryObj.$and = [{ $or: searchOr }, catalogFilter];
                } else {
                    queryObj.$or = catalogFilter.$or;
                }
            } else {
                queryObj.catalogId = catalogId;
            }
        } else if (!catalogId && !search && !hashtag) {
            // Default to main catalog
            queryObj.$or = [{ catalogId: 'main' }, { catalogId: { $exists: false } }];
        }

        const items = await Jewelry.find(queryObj).sort({ createdAt: -1 });
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
        const { catalogId } = req.query;
        const filter: any = { isFeatured: true };

        if (catalogId === 'main' || !catalogId) {
            filter.$or = [{ catalogId: 'main' }, { catalogId: { $exists: false } }];
        } else if (catalogId !== 'all') {
            filter.catalogId = catalogId;
        }

        const items = await Jewelry.find(filter);
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

        // Si se subió una imagen, guardarla en GridFS
        if (req.file) {
            const bucket = getGridFSBucket();
            const readableStream = Readable.from(req.file.buffer);
            const uploadStream = bucket.openUploadStream(req.file.originalname, {
                contentType: req.file.mimetype,
                metadata: {
                    originalName: req.file.originalname
                }
            });

            await new Promise((resolve, reject) => {
                readableStream.pipe(uploadStream)
                    .on('finish', resolve)
                    .on('error', reject);
            });

            // Guardar el ID del archivo en GridFS
            jewelryData.imageFileId = uploadStream.id.toString();
            jewelryData.imageUrl = `/api/jewelry/image/${uploadStream.id.toString()}`;
            jewelryData.overlayAssetUrl = `/api/jewelry/image/${uploadStream.id.toString()}`;
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

        // Si se subió una nueva imagen, guardarla en GridFS
        if (req.file) {
            const bucket = getGridFSBucket();
            const readableStream = Readable.from(req.file.buffer);
            const uploadStream = bucket.openUploadStream(req.file.originalname, {
                contentType: req.file.mimetype,
                metadata: {
                    originalName: req.file.originalname
                }
            });

            await new Promise((resolve, reject) => {
                readableStream.pipe(uploadStream)
                    .on('finish', resolve)
                    .on('error', reject);
            });

            // Si había una imagen anterior, eliminarla
            const existingItem = await Jewelry.findById(req.params.id);
            if (existingItem && existingItem.imageFileId) {
                try {
                    const oldFileId = new mongoose.Types.ObjectId(existingItem.imageFileId);
                    await bucket.delete(oldFileId);
                } catch (err) {
                    console.error('Error deleting old image:', err);
                }
            }

            // Guardar el ID del nuevo archivo en GridFS
            updateData.imageFileId = uploadStream.id.toString();
            updateData.imageUrl = `/api/jewelry/image/${uploadStream.id.toString()}`;
            updateData.overlayAssetUrl = `/api/jewelry/image/${uploadStream.id.toString()}`;
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

// @desc    Delete a jewelry item
// @route   DELETE /api/jewelry/:id
// @access  Private/Admin
export const deleteJewelryItem = async (req: Request, res: Response) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Jewelry not found' });
        }

        const item = await Jewelry.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Jewelry not found' });
        }

        // Si tiene una imagen en GridFS, eliminarla
        if (item.imageFileId) {
            try {
                const bucket = getGridFSBucket();
                const fileId = new mongoose.Types.ObjectId(item.imageFileId);
                await bucket.delete(fileId);
            } catch (err) {
                console.error('Error deleting image from GridFS:', err);
            }
        }

        await Jewelry.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get image from GridFS
// @route   GET /api/jewelry/image/:fileId
// @access  Public
export const getImage = async (req: Request, res: Response) => {
    try {
        const bucket = getGridFSBucket();
        const fileId = new mongoose.Types.ObjectId(req.params.fileId);

        // Buscar el archivo en GridFS
        const files = await bucket.find({ _id: fileId }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const file = files[0];

        // Configurar headers
        res.set('Content-Type', file.contentType || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año

        // Stream de la imagen
        const downloadStream = bucket.openDownloadStream(fileId);
        downloadStream.pipe(res);

        downloadStream.on('error', (error) => {
            console.error('Error streaming image:', error);
            res.status(500).json({ message: 'Error streaming image' });
        });
    } catch (error) {
        console.error('Error getting image:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
