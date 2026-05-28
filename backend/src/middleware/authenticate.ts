import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AuthRequest } from '../types/index.js';

interface JwtPayload { userId: string; type: 'access' | 'refresh' }

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (req.path.includes('/pdf/download')) {
    console.info('[auth] pdf download validation', { hasAuthorizationHeader: Boolean(header), hasBearerToken: Boolean(token) });
  }
  if (!token) return res.status(401).json({ message: 'Missing access token' });
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    if (payload.type !== 'access') return res.status(401).json({ message: 'Invalid token type' });
    req.userId = payload.userId;
    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) return res.status(401).json({ code: 'TOKEN_EXPIRED', message: 'Access token expired' });
    return res.status(401).json({ message: 'Invalid access token' });
  }
}
