import type { NextFunction, Request, Response } from 'express';
import { whatsappConfig } from './config/whatsapp.config.js';

export function authenticateWhatsappService(req: Request, res: Response, next: NextFunction) {
  const configuredToken = whatsappConfig.serviceAuth.token;

  if (!configuredToken) {
    return res.status(503).json({
      error: 'Token interno do WhatsApp nao configurado.',
      code: 'WHATSAPP_SERVICE_TOKEN_NOT_CONFIGURED',
    });
  }

  const authorization = req.header('authorization') || '';
  const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : '';
  const headerToken = req.header('x-n8n-service-token') || '';
  const providedToken = bearerToken || headerToken;

  if (!providedToken || providedToken !== configuredToken) {
    return res.status(401).json({
      error: 'Token interno do WhatsApp invalido.',
      code: 'WHATSAPP_SERVICE_UNAUTHORIZED',
    });
  }

  return next();
}
