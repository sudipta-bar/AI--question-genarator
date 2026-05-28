import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) return res.status(400).json({ message: 'Validation failed', issues: error.issues });
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Profile image must be 4MB or smaller.' : error.message;
    return res.status(400).json({ message });
  }
  if (error instanceof Error && error.message.startsWith('Profile image')) return res.status(400).json({ message: error.message });
  const message = error instanceof Error ? error.message : 'Internal server error';
  console.error('[api-error]', {
    method: _req.method,
    path: _req.originalUrl,
    message,
    stack: error instanceof Error ? error.stack : undefined,
  });
  return res.status(500).json({ message });
}
