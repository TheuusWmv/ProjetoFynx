import { z } from 'zod';

export const requestVerificationSchema = z.object({
  phone: z.string().min(10).max(20),
});

export const confirmVerificationSchema = z.object({
  phone: z.string().min(10).max(20),
  code: z.string().regex(/^\d{6}$/),
});

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const providerMessageIdSchema = z.string().min(1).max(160).optional();
const contextRefSchema = z.string().min(24).max(256);
const periodSchema = z.enum(['monthly', 'weekly', 'yearly']);

export const whatsappResolveSchema = z.object({
  phone: z.string().min(10).max(30),
  providerMessageId: providerMessageIdSchema,
});

export const whatsappContextActionSchema = z.object({
  contextRef: contextRefSchema,
  providerMessageId: providerMessageIdSchema,
});

export const whatsappTransactionsSearchSchema = whatsappContextActionSchema.extend({
  filters: z
    .object({
      type: z.enum(['income', 'expense', 'all']).optional(),
      category: z.string().min(1).max(80).optional(),
      dateFrom: isoDateSchema.optional(),
      dateTo: isoDateSchema.optional(),
      amountMin: z.number().nonnegative().optional(),
      amountMax: z.number().nonnegative().optional(),
      search: z.string().min(1).max(120).optional(),
    })
    .optional(),
  page: z.number().int().positive().max(1000).optional(),
  limit: z.number().int().positive().max(50).optional(),
  sortBy: z.enum(['date', 'amount', 'description', 'category', 'type', 'created_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const whatsappCreateTransactionSchema = whatsappContextActionSchema.extend({
  providerMessageId: z.string().min(1).max(160),
  transaction: z.object({
    type: z.enum(['income', 'expense']),
    amount: z.number().positive(),
    description: z.string().min(1).max(160),
    category: z.string().min(1).max(80),
    date: isoDateSchema,
    notes: z.string().max(500).optional(),
    spendingGoalId: z.string().regex(/^\d+$/).optional(),
    savingGoalId: z.string().regex(/^\d+$/).optional(),
  }),
});

export const whatsappCreateGoalSchema = whatsappContextActionSchema.extend({
  providerMessageId: z.string().min(1).max(160),
  goal: z.object({
    title: z.string().min(1).max(120),
    category: z.string().min(1).max(80),
    goalType: z.enum(['spending', 'saving']).optional(),
    targetAmount: z.number().positive(),
    period: periodSchema,
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    description: z.string().max(500).optional(),
  }),
});

export const whatsappCreateBudgetSchema = whatsappContextActionSchema.extend({
  providerMessageId: z.string().min(1).max(160),
  budget: z.object({
    name: z.string().min(1).max(120),
    category: z.string().min(1).max(80),
    allocatedAmount: z.number().positive(),
    period: periodSchema,
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  }),
});
