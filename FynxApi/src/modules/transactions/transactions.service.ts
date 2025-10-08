import type { 
  Transaction, 
  TransactionCategory, 
  TransactionFilters, 
  TransactionSummary, 
  TransactionStats, 
  TransactionsData, 
  CreateTransactionRequest, 
  UpdateTransactionRequest,
  BulkTransactionOperation 
} from './transactions.types.js';

// Mock categories
const mockCategories: TransactionCategory[] = [
  {
    id: '1',
    name: 'Alimentação',
    type: 'expense',
    icon: '🍽️',
    color: '#EF4444',
    subcategories: [
      { id: '1-1', name: 'Restaurantes', categoryId: '1', icon: '🍽️' },
      { id: '1-2', name: 'Supermercado', categoryId: '1', icon: '🛒' },
      { id: '1-3', name: 'Delivery', categoryId: '1', icon: '🚚' }
    ]
  },
  {
    id: '2',
    name: 'Transporte',
    type: 'expense',
    icon: '🚗',
    color: '#F59E0B',
    subcategories: [
      { id: '2-1', name: 'Combustível', categoryId: '2', icon: '⛽' },
      { id: '2-2', name: 'Uber/Taxi', categoryId: '2', icon: '🚕' },
      { id: '2-3', name: 'Transporte Público', categoryId: '2', icon: '🚌' }
    ]
  },
  {
    id: '3',
    name: 'Moradia',
    type: 'expense',
    icon: '🏠',
    color: '#8B5CF6',
    subcategories: [
      { id: '3-1', name: 'Aluguel', categoryId: '3', icon: '🏠' },
      { id: '3-2', name: 'Contas', categoryId: '3', icon: '💡' },
      { id: '3-3', name: 'Manutenção', categoryId: '3', icon: '🔧' }
    ]
  },
  {
    id: '4',
    name: 'Salário',
    type: 'income',
    icon: '💰',
    color: '#10B981',
    subcategories: [
      { id: '4-1', name: 'Salário Principal', categoryId: '4', icon: '💰' },
      { id: '4-2', name: 'Freelance', categoryId: '4', icon: '💻' },
      { id: '4-3', name: 'Bônus', categoryId: '4', icon: '🎁' }
    ]
  },
  {
    id: '5',
    name: 'Investimentos',
    type: 'income',
    icon: '📈',
    color: '#3B82F6',
    subcategories: [
      { id: '5-1', name: 'Dividendos', categoryId: '5', icon: '📊' },
      { id: '5-2', name: 'Rendimentos', categoryId: '5', icon: '💹' },
      { id: '5-3', name: 'Vendas', categoryId: '5', icon: '💸' }
    ]
  }
];

// Mock transactions
let mockTransactions: Transaction[] = [
  {
    id: '1',
    userId: 'user1',
    type: 'expense',
    amount: 45.50,
    description: 'Almoço no restaurante',
    category: 'Alimentação',
    subcategory: 'Restaurantes',
    date: '2025-01-25T12:30:00Z',
    paymentMethod: 'credit_card',
    tags: ['trabalho', 'almoço'],
    location: 'Centro da cidade',
    notes: 'Reunião de negócios',
    createdAt: '2025-01-25T12:30:00Z',
    updatedAt: '2025-01-25T12:30:00Z'
  },
  {
    id: '2',
    userId: 'user1',
    type: 'expense',
    amount: 120.00,
    description: 'Compras do mês',
    category: 'Alimentação',
    subcategory: 'Supermercado',
    date: '2025-01-24T18:00:00Z',
    paymentMethod: 'debit_card',
    tags: ['casa', 'mensal'],
    location: 'Supermercado Extra',
    createdAt: '2025-01-24T18:00:00Z',
    updatedAt: '2025-01-24T18:00:00Z'
  },
  {
    id: '3',
    userId: 'user1',
    type: 'expense',
    amount: 80.00,
    description: 'Combustível',
    category: 'Transporte',
    subcategory: 'Combustível',
    date: '2025-01-23T08:15:00Z',
    paymentMethod: 'credit_card',
    tags: ['carro', 'combustível'],
    location: 'Posto Shell',
    createdAt: '2025-01-23T08:15:00Z',
    updatedAt: '2025-01-23T08:15:00Z'
  },
  {
    id: '4',
    userId: 'user1',
    type: 'income',
    amount: 5000.00,
    description: 'Salário Janeiro',
    category: 'Salário',
    subcategory: 'Salário Principal',
    date: '2025-01-20T00:00:00Z',
    paymentMethod: 'bank_transfer',
    tags: ['salário', 'mensal'],
    createdAt: '2025-01-20T00:00:00Z',
    updatedAt: '2025-01-20T00:00:00Z'
  },
  {
    id: '5',
    userId: 'user1',
    type: 'expense',
    amount: 1200.00,
    description: 'Aluguel Janeiro',
    category: 'Moradia',
    subcategory: 'Aluguel',
    date: '2025-01-05T00:00:00Z',
    paymentMethod: 'bank_transfer',
    tags: ['aluguel', 'mensal'],
    recurring: {
      isRecurring: true,
      frequency: 'monthly',
      nextDate: '2025-02-05T00:00:00Z'
    },
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-05T00:00:00Z'
  },
  {
    id: '6',
    userId: 'user1',
    type: 'income',
    amount: 250.00,
    description: 'Freelance - Website',
    category: 'Salário',
    subcategory: 'Freelance',
    date: '2025-01-18T00:00:00Z',
    paymentMethod: 'pix',
    tags: ['freelance', 'extra'],
    createdAt: '2025-01-18T00:00:00Z',
    updatedAt: '2025-01-18T00:00:00Z'
  }
];

export class TransactionsService {
  // Get all transactions with filters and pagination
  static getTransactions(
    userId: string = 'user1',
    filters?: TransactionFilters,
    page: number = 1,
    limit: number = 10
  ): TransactionsData {
    let filteredTransactions = mockTransactions.filter(t => t.userId === userId);

    // Apply filters
    if (filters) {
      if (filters.type && filters.type !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === filters.type);
      }
      if (filters.category) {
        filteredTransactions = filteredTransactions.filter(t => t.category === filters.category);
      }
      if (filters.subcategory) {
        filteredTransactions = filteredTransactions.filter(t => t.subcategory === filters.subcategory);
      }
      if (filters.paymentMethod) {
        filteredTransactions = filteredTransactions.filter(t => t.paymentMethod === filters.paymentMethod);
      }
      if (filters.dateFrom) {
        filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= new Date(filters.dateFrom!));
      }
      if (filters.dateTo) {
        filteredTransactions = filteredTransactions.filter(t => new Date(t.date) <= new Date(filters.dateTo!));
      }
      if (filters.amountMin) {
        filteredTransactions = filteredTransactions.filter(t => t.amount >= filters.amountMin!);
      }
      if (filters.amountMax) {
        filteredTransactions = filteredTransactions.filter(t => t.amount <= filters.amountMax!);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredTransactions = filteredTransactions.filter(t => 
          t.description.toLowerCase().includes(searchLower) ||
          t.category.toLowerCase().includes(searchLower) ||
          (t.notes && t.notes.toLowerCase().includes(searchLower))
        );
      }
    }

    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Pagination
    const totalCount = filteredTransactions.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + limit);

    const summary = this.calculateSummary(filteredTransactions);
    const stats = this.calculateStats(filteredTransactions);

    return {
      transactions: paginatedTransactions,
      summary,
      stats,
      categories: mockCategories,
      totalCount,
      currentPage: page,
      totalPages
    };
  }

  // Get transaction by ID
  static getTransactionById(id: string, userId: string = 'user1'): Transaction | null {
    return mockTransactions.find(t => t.id === id && t.userId === userId) || null;
  }

  // Create new transaction
  static createTransaction(data: CreateTransactionRequest, userId: string = 'user1'): Transaction {
    const newTransaction: Transaction = {
      id: (mockTransactions.length + 1).toString(),
      userId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockTransactions.push(newTransaction);
    return newTransaction;
  }

  // Update transaction
  static updateTransaction(id: string, data: UpdateTransactionRequest, userId: string = 'user1'): Transaction | null {
    const index = mockTransactions.findIndex(t => t.id === id && t.userId === userId);
    if (index === -1) return null;

    const currentTransaction = mockTransactions[index]!;
    const updatedTransaction: Transaction = {
      id: currentTransaction.id,
      type: currentTransaction.type,
      amount: currentTransaction.amount,
      description: currentTransaction.description,
      category: currentTransaction.category,
      date: currentTransaction.date,
      paymentMethod: currentTransaction.paymentMethod,
      userId: currentTransaction.userId,
      createdAt: currentTransaction.createdAt,
      updatedAt: new Date().toISOString(),
      ...(currentTransaction.subcategory !== undefined && { subcategory: currentTransaction.subcategory }),
      ...(currentTransaction.location !== undefined && { location: currentTransaction.location }),
      ...(currentTransaction.notes !== undefined && { notes: currentTransaction.notes }),
      ...(currentTransaction.recurring !== undefined && { recurring: currentTransaction.recurring }),
      ...(currentTransaction.attachments !== undefined && { attachments: currentTransaction.attachments }),
      ...(currentTransaction.tags !== undefined && { tags: currentTransaction.tags })
    };

    // Only update properties that are defined
    if (data.type !== undefined) updatedTransaction.type = data.type;
    if (data.amount !== undefined) updatedTransaction.amount = data.amount;
    if (data.description !== undefined) updatedTransaction.description = data.description;
    if (data.category !== undefined) updatedTransaction.category = data.category;
    if (data.subcategory !== undefined) updatedTransaction.subcategory = data.subcategory;
    if (data.date !== undefined) updatedTransaction.date = data.date;
    if (data.paymentMethod !== undefined) updatedTransaction.paymentMethod = data.paymentMethod;
    if (data.location !== undefined) updatedTransaction.location = data.location;
    if (data.notes !== undefined) updatedTransaction.notes = data.notes;
    if (data.recurring !== undefined) updatedTransaction.recurring = data.recurring;
    if (data.tags !== undefined) updatedTransaction.tags = data.tags;

    mockTransactions[index] = updatedTransaction;
    return updatedTransaction;
  }

  // Delete transaction
  static deleteTransaction(id: string, userId: string = 'user1'): boolean {
    const index = mockTransactions.findIndex(t => t.id === id && t.userId === userId);
    if (index === -1) return false;

    mockTransactions.splice(index, 1);
    return true;
  }

  // Bulk operations
  static bulkOperation(operation: BulkTransactionOperation, userId: string = 'user1'): { success: number; failed: number } {
    let success = 0;
    let failed = 0;

    operation.transactionIds.forEach((id: string) => {
      const index = mockTransactions.findIndex(t => t.id === id && t.userId === userId);
      if (index === -1) {
        failed++;
        return;
      }

      switch (operation.operation) {
        case 'delete':
          mockTransactions.splice(index, 1);
          success++;
          break;
        case 'update':
          if (operation.updateData && mockTransactions[index]) {
            mockTransactions[index] = {
              ...mockTransactions[index],
              ...operation.updateData,
              updatedAt: new Date().toISOString()
            };
            success++;
          } else {
            failed++;
          }
          break;
        case 'categorize':
          if (operation.updateData?.category && mockTransactions[index]) {
            mockTransactions[index].category = operation.updateData.category;
            if (operation.updateData.subcategory) {
              mockTransactions[index].subcategory = operation.updateData.subcategory;
            }
            mockTransactions[index].updatedAt = new Date().toISOString();
            success++;
          } else {
            failed++;
          }
          break;
        default:
          failed++;
      }
    });

    return { success, failed };
  }

  // Get categories
  static getCategories(): TransactionCategory[] {
    return mockCategories;
  }

  // Calculate summary
  private static calculateSummary(transactions: Transaction[]): TransactionSummary {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netAmount = totalIncome - totalExpenses;
    const transactionCount = transactions.length;
    const averageTransaction = transactionCount > 0 ? (totalIncome + totalExpenses) / transactionCount : 0;

    // Category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>();
    transactions.forEach(t => {
      const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
      categoryMap.set(t.category, {
        amount: existing.amount + t.amount,
        count: existing.count + 1
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      transactionCount: data.count
    }));

    // Monthly trend (mock data)
    const monthlyTrend = [
      { month: '2024-11', income: 4800, expenses: 3200, net: 1600 },
      { month: '2024-12', income: 5200, expenses: 3800, net: 1400 },
      { month: '2025-01', income: totalIncome, expenses: totalExpenses, net: netAmount }
    ];

    return {
      totalIncome,
      totalExpenses,
      netAmount,
      transactionCount,
      averageTransaction,
      categoryBreakdown,
      monthlyTrend
    };
  }

  // Calculate stats
  private static calculateStats(transactions: Transaction[]): TransactionStats {
    const dailyAverage = transactions.length > 0 ? 
      transactions.reduce((sum, t) => sum + t.amount, 0) / 30 : 0;
    
    const weeklyAverage = dailyAverage * 7;
    const monthlyAverage = dailyAverage * 30;

    const mostExpensiveTransaction = transactions.reduce((max, t) => 
      t.amount > max.amount ? t : max, transactions[0] || {} as Transaction);

    // Most frequent category
    const categoryCount = new Map<string, number>();
    transactions.forEach(t => {
      categoryCount.set(t.category, (categoryCount.get(t.category) || 0) + 1);
    });
    const mostFrequentCategory = Array.from(categoryCount.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    // Payment method breakdown
    const paymentMethodMap = new Map<string, { amount: number; count: number }>();
    transactions.forEach(t => {
      const existing = paymentMethodMap.get(t.paymentMethod) || { amount: 0, count: 0 };
      paymentMethodMap.set(t.paymentMethod, {
        amount: existing.amount + t.amount,
        count: existing.count + 1
      });
    });

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const paymentMethodBreakdown = Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
    }));

    return {
      dailyAverage,
      weeklyAverage,
      monthlyAverage,
      mostExpensiveTransaction,
      mostFrequentCategory,
      paymentMethodBreakdown
    };
  }
}