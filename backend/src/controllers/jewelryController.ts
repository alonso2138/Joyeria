import { Request, Response } from 'express';
import Jewelry from '../models/Jewelry';
import mongoose from 'mongoose';

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
        console.log('Uploaded file:', req.file);
        
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
        
        // Si se subió una imagen, generar las URLs
        if (req.file) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const imageUrl = `${baseUrl}/uploads/jewelry/${req.file.filename}`;
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
        console.log('UPDATE - Uploaded file:', req.file);
        
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
        
        // Si se subió una nueva imagen, actualizar las URLs
        if (req.file) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const imageUrl = `${baseUrl}/uploads/jewelry/${req.file.filename}`;
            updateData.imageUrl = imageUrl;
            updateData.overlayAssetUrl = imageUrl; // Usar la misma imagen para overlay
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
        const deletedItem = await Jewelry.findByIdAndDelete(req.params.id);
        if (deletedItem) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Jewelry not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
