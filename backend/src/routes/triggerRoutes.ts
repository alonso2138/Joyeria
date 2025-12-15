import express from 'express';

import { coldAbierto } from '../controllers/coldAbiertoController';
import { followAbierto } from '../controllers/followUpAbiertoController';

import { tryOn } from '../controllers/tryOnController';
import { tryOnStarted } from '../controllers/tryOnStartedController';
import { linkClick } from '../controllers/linkClickController';

const router = express.Router();

router.get('/cold-abierto', coldAbierto);
router.get('/follow-abierto',followAbierto);

router.post('/try-on', tryOn);
router.post('/try-on-started', tryOnStarted);
router.post('/link-click', linkClick);

export default router;
