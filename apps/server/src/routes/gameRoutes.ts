// ============================================
// Game Routes
// ============================================

import { Router } from 'express';
import { getGameById, getPlayerStats, getPlayerHistory } from '../controllers/gameController.js';

const router = Router();

router.get('/:id', getGameById);
router.get('/player/:id/stats', getPlayerStats);
router.get('/player/:id/history', getPlayerHistory);

export default router;
