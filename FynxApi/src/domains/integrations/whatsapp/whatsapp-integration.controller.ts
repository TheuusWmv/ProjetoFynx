import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  whatsappContextActionSchema,
  whatsappCreateBudgetSchema,
  whatsappCreateGoalSchema,
  whatsappCreateTransactionSchema,
  whatsappResolveSchema,
  whatsappTransactionsSearchSchema,
} from './schemas/whatsapp.schemas.js';
import { WhatsappIntegrationService } from './whatsapp-integration.service.js';
import { WhatsappDomainError } from './whatsapp.service.js';

export class WhatsappIntegrationController {
  static async resolve(req: Request, res: Response) {
    try {
      const body = whatsappResolveSchema.parse(req.body);
      const result = await WhatsappIntegrationService.resolve(body);
      res.json(result);
    } catch (error) {
      handleWhatsappIntegrationError(error, res);
    }
  }

  static async dashboard(req: Request, res: Response) {
    await runAction(req, res, whatsappContextActionSchema, body => WhatsappIntegrationService.getDashboard(body));
  }

  static async ranking(req: Request, res: Response) {
    await runAction(req, res, whatsappContextActionSchema, body => WhatsappIntegrationService.getRanking(body));
  }

  static async createTransaction(req: Request, res: Response) {
    await runAction(req, res, whatsappCreateTransactionSchema, body =>
      WhatsappIntegrationService.createTransaction(body),
    );
  }

  static async searchTransactions(req: Request, res: Response) {
    await runAction(req, res, whatsappTransactionsSearchSchema, body =>
      WhatsappIntegrationService.searchTransactions(body),
    );
  }

  static async goals(req: Request, res: Response) {
    await runAction(req, res, whatsappContextActionSchema, body => WhatsappIntegrationService.getGoals(body));
  }

  static async createGoal(req: Request, res: Response) {
    await runAction(req, res, whatsappCreateGoalSchema, body => WhatsappIntegrationService.createGoal(body));
  }

  static async budgets(req: Request, res: Response) {
    await runAction(req, res, whatsappContextActionSchema, body => WhatsappIntegrationService.getBudgets(body));
  }

  static async createBudget(req: Request, res: Response) {
    await runAction(req, res, whatsappCreateBudgetSchema, body => WhatsappIntegrationService.createBudget(body));
  }

  static async categories(req: Request, res: Response) {
    await runAction(req, res, whatsappContextActionSchema, body => WhatsappIntegrationService.getCategories(body));
  }
}

async function runAction<T>(
  req: Request,
  res: Response,
  schema: z.ZodType<T>,
  action: (body: T) => Promise<unknown>,
) {
  try {
    const body = schema.parse(req.body);
    const result = await action(body);
    res.json(result);
  } catch (error) {
    handleWhatsappIntegrationError(error, res);
  }
}

function handleWhatsappIntegrationError(error: unknown, res: Response) {
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
