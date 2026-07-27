// ============================================
// Middleware — Error Handler
// ============================================

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  logger.error('ErrorHandler', `${statusCode} ${code}: ${err.message}`, {
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

export function createAppError(message: string, statusCode: number, code: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Resource not found' },
  });
}
