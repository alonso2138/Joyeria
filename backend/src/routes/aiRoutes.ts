import { Router } from 'express';
import * as aiController from '../controllers/aiController';

const router = Router();

// Public route but will be rate limited in server.ts
router.post('/generate-tryon', aiController.generateTryOn);

export default router;
