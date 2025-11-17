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
router.get('/:id', getJewelryById);

// This is a bit of a hack to put this here, but it works for a small app.
// The /api/hashtags route will be handled by this router.
router.get('/hashtags', getUniqueHashtags);


// Protected admin routes
router.post('/', protect, uploadToMemory.single('image'), createJewelryItem);
router.put('/:id', protect, uploadToMemory.single('image'), updateJewelryItem);
router.delete('/:id', protect, deleteJewelryItem);

export default router;
