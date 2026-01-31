import { Router } from 'express';
import { getEvents, deleteEventsBatch } from '../controllers/eventsController';

const router = Router();

router.get('/', getEvents);
router.post('/delete-batch', deleteEventsBatch);

export default router;
