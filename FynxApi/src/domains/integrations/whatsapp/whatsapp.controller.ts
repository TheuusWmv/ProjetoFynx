import type { Response } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../../../infrastructure/http/middlewares/auth.middleware.js';
import { confirmVerificationSchema, requestVerificationSchema } from './schemas/whatsapp.schemas.js';
import { WhatsappDomainError, WhatsappService } from './whatsapp.service.js';

export class WhatsappController {
  static async listAccounts(req: AuthRequest, res: Response) {
    try {
      const accounts = await WhatsappService.listAccounts(req.user!.id);
      res.json({ accounts });
    } catch (error: any) {
      handleWhatsappError(error, res);
    }
  }

  static async requestVerification(req: AuthRequest, res: Response) {
    try {
      const body = requestVerificationSchema.parse(req.body);
      const result = await WhatsappService.requestVerification(req.user!.id, body.phone);
      res.status(201).json(result);
    } catch (error: any) {
      handleWhatsappError(error, res);
    }
  }

  static async confirmVerification(req: AuthRequest, res: Response) {
    try {
      const body = confirmVerificationSchema.parse(req.body);
      const result = await WhatsappService.confirmVerification(req.user!.id, body.phone, body.code);
      res.json(result);
    } catch (error: any) {
      handleWhatsappError(error, res);
    }
  }

  static async revokeAccount(req: AuthRequest, res: Response) {
    try {
      const accountId = Number(req.params.accountId);
      if (!Number.isInteger(accountId)) {
        return res.status(400).json({ error: 'ID invalido.', code: 'WHATSAPP_ACCOUNT_INVALID' });
      }

      const result = await WhatsappService.revokeAccount(req.user!.id, accountId);
      res.json(result);
    } catch (error: any) {
      handleWhatsappError(error, res);
    }
  }
}

function handleWhatsappError(error: unknown, res: Response) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: 'Payload invalido.', code: 'VALIDATION_ERROR', details: error.issues });
  }

  if (error instanceof WhatsappDomainError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      ...(error.details ?? {}),
    });
  }

  const message = error instanceof Error ? error.message : 'Erro interno.';
  return res.status(500).json({ error: message, code: 'INTERNAL_ERROR' });
}
