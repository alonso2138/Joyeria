import express from 'express';
import { launchColdApproach } from '../controllers/coldApproachController';
import { launchFollowUp } from '../controllers/followUpController';

const router = express.Router();

router.post('/cold-approach', launchColdApproach);
router.post('/follow-up', launchFollowUp);

export default router;
