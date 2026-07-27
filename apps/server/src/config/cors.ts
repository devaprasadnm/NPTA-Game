// ============================================
// CORS Configuration
// ============================================

import cors from 'cors';
import { config } from './index.js';

export const corsOptions: cors.CorsOptions = {
  origin: config.cors.origin.split(',').map((o) => o.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
};
