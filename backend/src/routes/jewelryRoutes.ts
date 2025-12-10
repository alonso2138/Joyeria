import express from 'express';
import {
    getJewelryItems,
    getFeaturedJewelryItems,
    getJewelryBySlug,
    getJewelryById,
    getUniqueHashtags,
    createJewelryItem,
    updateJewelryItem,
    deleteJewelryItem,
    getImage
} from '../controllers/jewelryController';
import { protect } from '../middleware/authMiddleware';
import { uploadToMemory } from '../middleware/gridfsMiddleware';

const router = express.Router();

// Public routes
router.get('/', getJewelryItems);
router.get('/featured', getFeaturedJewelryItems);
router.get('/slug/:slug', getJewelryBySlug);
router.get('/image/:fileId', getImage); // Ruta para servir imágenes desde GridFS
// The /api/jewelry/hashtags route should be resolved before the :id param.
router.get('/hashtags', getUniqueHashtags);
router.get('/:id', getJewelryById);

// Protected admin routes
router.post('/', protect, uploadToMemory.single('image'), createJewelryItem);
router.put('/:id', protect, uploadToMemory.single('image'), updateJewelryItem);
router.delete('/:id', protect, deleteJewelryItem);

export default router;
