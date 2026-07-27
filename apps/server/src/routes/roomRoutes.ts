// ============================================
// Room Routes
// ============================================

import { Router } from 'express';
import { getRoomByCode, getRoomPlayers } from '../controllers/roomController.js';

const router = Router();

router.get('/:code', getRoomByCode);
router.get('/:code/players', getRoomPlayers);

export default router;
