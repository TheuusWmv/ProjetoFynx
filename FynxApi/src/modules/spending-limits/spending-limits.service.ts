import type { 
  SpendingLimit, 
  CreateSpendingLimitRequest, 
  UpdateSpendingLimitRequest,
  UpdateSpendingLimitProgressRequest
} from './spending-limits.types.js';

// Mock data storage for spending limits
let spendingLimits: SpendingLimit[] = [
  {
    id: '1',
    category: 'Alimentação',
    limitAmount: 800,
    currentSpent: 650,
    period: 'monthly',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-20T00:00:00Z'
  },
  {
    id: '2',
    category: 'Transporte',
    limitAmount: 400,
    currentSpent: 450,
    period: 'monthly',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    status: 'exceeded',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-22T00:00:00Z'
  },
  {
    id: '3',
    category: 'Lazer',
    limitAmount: 600,
    currentSpent: 320,
    period: 'monthly',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-18T00:00:00Z'
  }
];

export class SpendingLimitsService {
  // Get all spending limits
  static getSpendingLimits(): SpendingLimit[] {
    return spendingLimits;
  }

  // Get spending limit by ID
  static getSpendingLimitById(id: string): SpendingLimit | null {
    return spendingLimits.find(limit => limit.id === id) || null;
  }

  // Get spending limit by category
  static getSpendingLimitByCategory(category: string): SpendingLimit | null {
    return spendingLimits.find(limit => limit.category === category) || null;
  }

  // Create new spending limit
  static createSpendingLimit(data: CreateSpendingLimitRequest): SpendingLimit {
    const newLimit: SpendingLimit = {
      id: (spendingLimits.length + 1).toString(),
      ...data,
      currentSpent: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    spendingLimits.push(newLimit);
    return newLimit;
  }

  // Update spending limit
  static updateSpendingLimit(id: string, data: UpdateSpendingLimitRequest): SpendingLimit | null {
    const limitIndex = spendingLimits.findIndex(limit => limit.id === id);
    if (limitIndex === -1) return null;

    const currentLimit = spendingLimits[limitIndex]!;
    const updatedLimit: SpendingLimit = {
      ...currentLimit,
      ...data,
      updatedAt: new Date().toISOString()
    };

    // Update status based on current spent vs limit
    if (data.limitAmount !== undefined) {
      updatedLimit.status = updatedLimit.currentSpent > data.limitAmount ? 'exceeded' : 'active';
    }

    spendingLimits[limitIndex] = updatedLimit;
    return updatedLimit;
  }

  // Update spending limit progress (add expense amount)
  static updateSpendingLimitProgress(id: string, data: UpdateSpendingLimitProgressRequest): SpendingLimit | null {
    const limitIndex = spendingLimits.findIndex(limit => limit.id === id);
    if (limitIndex === -1) return null;

    const limit = spendingLimits[limitIndex]!;
    
    // Add the expense amount to current spent
    limit.currentSpent = Math.max(0, limit.currentSpent + data.amount);
    limit.updatedAt = new Date().toISOString();

    // Update status based on current spent vs limit
    limit.status = limit.currentSpent > limit.limitAmount ? 'exceeded' : 'active';

    return limit;
  }

  // Delete spending limit
  static deleteSpendingLimit(id: string): boolean {
    const limitIndex = spendingLimits.findIndex(limit => limit.id === id);
    if (limitIndex === -1) return false;

    spendingLimits.splice(limitIndex, 1);
    return true;
  }

  // Get all categories from spending limits
  static getCategories(): string[] {
    return [...new Set(spendingLimits.map(limit => limit.category))];
  }
}