import express from 'express';
import { createCustomRequest, getCustomRequests } from '../controllers/customRequestController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', createCustomRequest);
router.get('/', protect, getCustomRequests);

export default router;
