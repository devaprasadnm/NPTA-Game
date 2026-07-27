// ============================================
// Auth Routes
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { guestLogin, validateSession } from '../controllers/authController.js';
import { validateBody } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { MIN_DISPLAY_NAME_LENGTH, MAX_DISPLAY_NAME_LENGTH, DISPLAY_NAME_REGEX } from '@npta/shared';

const router = Router();

const guestLoginSchema = z.object({
  displayName: z
    .string()
    .min(MIN_DISPLAY_NAME_LENGTH, `Name must be at least ${MIN_DISPLAY_NAME_LENGTH} characters`)
    .max(MAX_DISPLAY_NAME_LENGTH, `Name must be at most ${MAX_DISPLAY_NAME_LENGTH} characters`)
    .regex(DISPLAY_NAME_REGEX, 'Name can only contain letters, numbers, spaces, underscores, and hyphens'),
});

router.post('/guest', authLimiter, validateBody(guestLoginSchema), guestLogin);
router.get('/session', validateSession);

export default router;
