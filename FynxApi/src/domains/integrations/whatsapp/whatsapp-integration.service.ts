import crypto from 'crypto';
import { getDashboardData } from '../../analytics/dashboard/dashboard.service.js';
import { TransactionsService } from '../../financial/transactions/transactions.service.js';
import { GoalsService } from '../../financial/goals/goals.service.js';
import { CustomCategoriesService } from '../../financial/custom-categories/customCategories.service.js';
import { RankingService } from '../../gamification/ranking/ranking.service.js';
import { WhatsappRendererService } from './whatsapp-renderer.service.js';
import type { TransactionFilters, CreateTransactionRequest } from '../../financial/transactions/transactions.types.js';
import type { CreateSpendingGoalRequest } from '../../financial/goals/goals.types.js';
import { whatsappConfig } from './config/whatsapp.config.js';
import { WhatsappIntegrationRepository } from './repositories/whatsapp-integration.repository.js';
import { UserWhatsappRepository } from './repositories/user-whatsapp.repository.js';
import {
  hashWhatsappPhone,
  maskWhatsappPhone,
  normalizeWhatsappPhone,
  WhatsappDomainError,
} from './whatsapp.service.js';
import type {
  whatsappContextActionSchema,
  whatsappCreateBudgetSchema,
  whatsappCreateGoalSchema,
  whatsappCreateTransactionSchema,
  whatsappResolveSchema,
  whatsappTransactionsSearchSchema,
} from './schemas/whatsapp.schemas.js';
import type { z } from 'zod';

type ResolveInput = z.infer<typeof whatsappResolveSchema>;
type ContextActionInput = z.infer<typeof whatsappContextActionSchema>;
type TransactionsSearchInput = z.infer<typeof whatsappTransactionsSearchSchema>;
type CreateTransactionInput = z.infer<typeof whatsappCreateTransactionSchema>;
type CreateGoalInput = z.infer<typeof whatsappCreateGoalSchema>;
type CreateBudgetInput = z.infer<typeof whatsappCreateBudgetSchema>;

type ActionResult = {
  status: 'ok';
  action: string;
  idempotent?: boolean;
  data: unknown;
};

export class WhatsappIntegrationService {
  static async resolve(input: ResolveInput) {
    const normalizedPhone = normalizeWhatsappPhone(input.phone);
    const phoneHash = hashWhatsappPhone(normalizedPhone);
    const account = await UserWhatsappRepository.findVerifiedAccountByPhoneHash(phoneHash);

    if (!account) {
      await UserWhatsappRepository.createAuditLog({
        phoneHash,
        eventType: 'resolve',
        status: 'not_found',
        ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
      });
      throw new WhatsappDomainError(
        'WHATSAPP_PHONE_NOT_VERIFIED',
        'Numero nao verificado na plataforma Fynx.',
        404,
      );
    }

    const { contextRef, expiresAt } = await this.createContextRef(account.user_id, phoneHash);

    await UserWhatsappRepository.createAuditLog({
      userId: account.user_id,
      phoneHash,
      eventType: 'resolve',
      status: 'success',
      ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
      metadata: { contextExpiresAt: expiresAt.toISOString() },
    });

    return {
      status: 'resolved',
      userId: account.user_id,
      phoneMasked: account.phone_masked || maskWhatsappPhone(normalizedPhone),
      contextRef,
      expiresAt: expiresAt.toISOString(),
    };
  }

  static async getDashboard(input: ContextActionInput): Promise<ActionResult> {
    return this.runAction('dashboard', input, async userId => {
      const data = await getDashboardData(userId);
      
      let dailyPerformanceBase64 = '';
      let monthlyPerformanceBase64 = '';
      let categoryExpenseBase64 = '';
      let categoryIncomeBase64 = '';

      try {
        dailyPerformanceBase64 = await WhatsappRendererService.renderDashboardHistory(
          'daily',
          data.dailyPerformance.map(d => d.day),
          data.dailyPerformance.map(d => d.income),
          data.dailyPerformance.map(d => d.expense)
        );
      } catch (err) {
        console.error('Error rendering dailyPerformance visual:', err);
      }

      try {
        monthlyPerformanceBase64 = await WhatsappRendererService.renderDashboardHistory(
          'monthly',
          data.monthlyPerformance.map(m => m.month),
          data.monthlyPerformance.map(m => m.income),
          data.monthlyPerformance.map(m => m.expense)
        );
      } catch (err) {
        console.error('Error rendering monthlyPerformance visual:', err);
      }

      try {
        categoryExpenseBase64 = await WhatsappRendererService.renderCategoriesDonut(
          data.spendingByCategory,
          'expense'
        );
      } catch (err) {
        console.error('Error rendering categoryExpense visual:', err);
      }

      try {
        categoryIncomeBase64 = await WhatsappRendererService.renderCategoriesDonut(
          data.incomeByCategory,
          'income'
        );
      } catch (err) {
        console.error('Error rendering categoryIncome visual:', err);
      }

      return {
        ...data,
        visualRenderings: {
          dailyPerformance: dailyPerformanceBase64,
          monthlyPerformance: monthlyPerformanceBase64,
          categoryExpense: categoryExpenseBase64,
          categoryIncome: categoryIncomeBase64,
        }
      };
    });
  }

  static async getRanking(input: ContextActionInput): Promise<ActionResult> {
    return this.runAction('ranking', input, async userId => {
      const data = await RankingService.getRankingData(userId);
      let visual = '';
      try {
        visual = await WhatsappRendererService.renderRanking(data.globalLeaderboard, userId);
      } catch (err) {
        console.error('Error rendering ranking visual:', err);
      }
      return {
        ...data,
        visualRendering: visual,
      };
    });
  }

  static async searchTransactions(input: TransactionsSearchInput): Promise<ActionResult> {
    return this.runAction('transactions.search', input, async userId =>
      TransactionsService.getTransactions(
        userId,
        cleanOptional(input.filters) as TransactionFilters | undefined,
        input.page ?? 1,
        input.limit ?? 10,
        input.sortBy ?? 'date',
        input.sortOrder ?? 'desc',
      ),
    );
  }

  static async createTransaction(input: CreateTransactionInput): Promise<ActionResult> {
    return this.runAction(
      'transactions.create',
      input,
      async userId => TransactionsService.createTransaction(cleanOptional(input.transaction) as CreateTransactionRequest, userId),
      true,
    );
  }

  static async getGoals(input: ContextActionInput): Promise<ActionResult> {
    return this.runAction('goals', input, async userId => {
      const data = await GoalsService.getGoalsData(userId);
      const spendingGoalsWithVisuals = await Promise.all(
        data.spendingGoals.map(async (goal: any) => {
          try {
            const visual = await WhatsappRendererService.renderGoal(goal);
            return { ...goal, visualRendering: visual };
          } catch (err) {
            console.error('Error rendering goal visual:', err);
            return goal;
          }
        })
      );
      return {
        ...data,
        spendingGoals: spendingGoalsWithVisuals,
      };
    });
  }

  static async createGoal(input: CreateGoalInput): Promise<ActionResult> {
    return this.runAction(
      'goals.create',
      input,
      async userId =>
        GoalsService.createSpendingGoal({
          ...(cleanOptional(input.goal) as CreateSpendingGoalRequest),
          userId,
        }),
      true,
    );
  }

  static async getBudgets(input: ContextActionInput): Promise<ActionResult> {
    return this.runAction('budgets', input, async userId => GoalsService.getBudgets(userId));
  }

  static async createBudget(input: CreateBudgetInput): Promise<ActionResult> {
    return this.runAction(
      'budgets.create',
      input,
      async userId => GoalsService.createBudget({ ...input.budget, userId }),
      true,
    );
  }

  static async getCategories(input: ContextActionInput): Promise<ActionResult> {
    return this.runAction('categories', input, async userId => {
      const [defaultCategories, customCategories] = await Promise.all([
        TransactionsService.getCategories(),
        CustomCategoriesService.getCustomCategories(userId),
      ]);

      return {
        defaultCategories,
        customCategories,
      };
    });
  }

  private static async runAction(
    actionType: string,
    input: ContextActionInput,
    work: (userId: number) => Promise<unknown>,
    requireIdempotency = false,
  ): Promise<ActionResult> {
    if (requireIdempotency && !input.providerMessageId) {
      throw new WhatsappDomainError(
        'WHATSAPP_PROVIDER_MESSAGE_ID_REQUIRED',
        'providerMessageId e obrigatorio para escritas via WhatsApp.',
        400,
      );
    }

    const context = await this.resolveContextRef(input.contextRef);

    if (input.providerMessageId) {
      const existing = await WhatsappIntegrationRepository.findMessageEventByProviderId(input.providerMessageId);
      if (existing?.status === 'success') {
        return {
          status: 'ok',
          action: actionType,
          idempotent: true,
          data: WhatsappIntegrationRepository.parseResponsePayload(existing),
        };
      }

      if (existing?.status === 'processing') {
        throw new WhatsappDomainError(
          'WHATSAPP_ACTION_IN_PROGRESS',
          'Mensagem ja esta em processamento.',
          409,
        );
      }
    }

    let event;
    try {
      event = await WhatsappIntegrationRepository.createMessageEvent({
        userId: context.user_id,
        contextRefId: context.id,
        ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
        actionType,
        requestPayload: input,
      });
    } catch (error: any) {
      if (input.providerMessageId) {
        const existing = await WhatsappIntegrationRepository.findMessageEventByProviderId(input.providerMessageId);
        if (existing?.status === 'success') {
          return {
            status: 'ok',
            action: actionType,
            idempotent: true,
            data: WhatsappIntegrationRepository.parseResponsePayload(existing),
          };
        }
      }
      throw error;
    }

    try {
      const data = await work(context.user_id);
      await WhatsappIntegrationRepository.markMessageEventSuccess(event.id, data);
      await UserWhatsappRepository.createAuditLog({
        userId: context.user_id,
        phoneHash: context.phone_hash,
        eventType: actionType,
        status: 'success',
        ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
      });
      return { status: 'ok', action: actionType, data };
    } catch (error: any) {
      const code = error instanceof WhatsappDomainError ? error.code : 'WHATSAPP_ACTION_FAILED';
      const message = error instanceof Error ? error.message : 'Falha ao executar acao WhatsApp.';
      await WhatsappIntegrationRepository.markMessageEventFailed(event.id, code, message);
      await UserWhatsappRepository.createAuditLog({
        userId: context.user_id,
        phoneHash: context.phone_hash,
        eventType: actionType,
        status: 'failed',
        ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
        metadata: { code, message },
      });
      throw error;
    }
  }

  private static async resolveContextRef(contextRef: string) {
    const contextHash = hashContextRef(contextRef);
    const context = await WhatsappIntegrationRepository.findContextRefByHash(contextHash);

    if (!context) {
      throw new WhatsappDomainError('WHATSAPP_CONTEXT_INVALID', 'contextRef invalido.', 401);
    }

    if (new Date(context.expires_at).getTime() <= Date.now()) {
      throw new WhatsappDomainError('WHATSAPP_CONTEXT_EXPIRED', 'contextRef expirado.', 401);
    }

    const account = await UserWhatsappRepository.findVerifiedAccountByPhoneHash(context.phone_hash);
    if (!account || account.user_id !== context.user_id) {
      throw new WhatsappDomainError(
        'WHATSAPP_CONTEXT_REVOKED',
        'Acesso WhatsApp revogado para este usuario.',
        401,
      );
    }

    await WhatsappIntegrationRepository.touchContextRef(context.id);
    return context;
  }

  private static async createContextRef(userId: number, phoneHash: string) {
    const contextRef = `wctx_${crypto.randomBytes(32).toString('base64url')}`;
    const expiresAt = new Date(Date.now() + whatsappConfig.context.ttlMinutes * 60 * 1000);
    await WhatsappIntegrationRepository.createContextRef({
      userId,
      phoneHash,
      contextHash: hashContextRef(contextRef),
      expiresAt,
    });

    return { contextRef, expiresAt };
  }
}

function hashContextRef(contextRef: string): string {
  if (!whatsappConfig.context.secret) {
    throw new Error('WHATSAPP_CONTEXT_SECRET or JWT_SECRET is required');
  }

  return crypto.createHmac('sha256', whatsappConfig.context.secret).update(contextRef).digest('hex');
}

function cleanOptional<T extends Record<string, unknown> | undefined>(value: T): T {
  if (!value) return value;

  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined);
  return Object.fromEntries(entries) as T;
}
