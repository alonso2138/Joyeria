import express from 'express';
import { validateApiKey, logWidgetEvent, getAllOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../controllers/widgetController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Public/Widget routes (no auth required)
router.post('/validate', validateApiKey);
router.post('/log-event', logWidgetEvent);

// Admin routes (protected - require authentication)
router.get('/organizations', protect, getAllOrganizations);
router.post('/organizations', protect, createOrganization);
router.put('/organizations/:id', protect, updateOrganization);
router.delete('/organizations/:id', protect, deleteOrganization);

export default router;
