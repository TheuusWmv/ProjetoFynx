import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../../../shared/utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not defined!');
}

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
    };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authorizationHeader = req.headers.authorization;
    const [scheme, credentials] = authorizationHeader?.trim().split(/\s+/) ?? [];

    logger.http(`[AuthMiddleware] Request: ${req.method} ${req.originalUrl}`);

    if (scheme?.toLowerCase() !== 'bearer' || !credentials) {
        logger.warn('[AuthMiddleware] Authentication credential not provided');
        return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    jwt.verify(credentials, JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn(`[AuthMiddleware] Token verification failed: ${err.message}`);
            return res.status(403).json({ error: 'Token inválido ou expirado' });
        }

        if (!user || typeof user === 'string') {
            logger.warn('[AuthMiddleware] Token payload is invalid');
            return res.status(403).json({ error: 'Token inválido ou expirado' });
        }

        const userId = Number(user.id);
        if (!Number.isFinite(userId) || typeof user.email !== 'string') {
            logger.warn('[AuthMiddleware] Token payload is incomplete');
            return res.status(403).json({ error: 'Token inválido ou expirado' });
        }

        req.user = {
            id: userId,
            email: user.email,
        };
        next();
    });
};
