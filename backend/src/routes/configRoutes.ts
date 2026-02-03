import { Router } from 'express';
import * as configController from '../controllers/configController';
import { protect as authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', configController.getConfig);
router.put('/', authenticateToken, configController.updateConfig);

// Demo CRUD routes
router.get('/demos', authenticateToken, configController.getDemos);
router.post('/demos', authenticateToken, configController.upsertDemo);
router.delete('/demos/:tag', authenticateToken, configController.deleteDemo);

export default router;
