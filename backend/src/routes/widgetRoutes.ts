import express from 'express';
import { validateApiKey, logWidgetEvent, getAllOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../controllers/widgetController';

const router = express.Router();

// Public/Widget routes
router.post('/validate', validateApiKey);
router.post('/log-event', logWidgetEvent);

// Admin routes (should be protected by authMiddleware in server.ts if moved there, but for now we'll put them here)
router.get('/organizations', getAllOrganizations);
router.post('/organizations', createOrganization);
router.put('/organizations/:id', updateOrganization);
router.delete('/organizations/:id', deleteOrganization);

export default router;
