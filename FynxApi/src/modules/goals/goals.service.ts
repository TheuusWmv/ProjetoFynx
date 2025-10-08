import type { 
  SpendingGoal, 
  Budget, 
  GoalProgress, 
  GoalsData, 
  CreateSpendingGoalRequest, 
  UpdateSpendingGoalRequest,
  CreateBudgetRequest,
  UpdateBudgetRequest
} from './goals.types.js';

// Mock data storage
let spendingGoals: SpendingGoal[] = [
  {
    id: '1',
    title: 'Economizar para Viagem',
    category: 'Lazer',
    targetAmount: 5000,
    currentAmount: 2500,
    period: 'monthly',
    startDate: '2025-01-01',
    endDate: '2025-06-01',
    status: 'active',
    description: 'Viagem para Europa no meio do ano',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z'
  },
  {
    id: '2',
    title: 'Fundo de Emergência',
    category: 'Poupança',
    targetAmount: 10000,
    currentAmount: 7500,
    period: 'yearly',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'active',
    description: 'Reserva de emergência para 6 meses',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-20T00:00:00Z'
  },
  {
    id: '3',
    title: 'Novo Notebook',
    category: 'Tecnologia',
    targetAmount: 3000,
    currentAmount: 3000,
    period: 'monthly',
    startDate: '2024-12-01',
    endDate: '2025-02-01',
    status: 'completed',
    description: 'MacBook Pro para trabalho',
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z'
  }
];

let budgets: Budget[] = [
  {
    id: '1',
    category: 'Alimentação',
    allocatedAmount: 800,
    spentAmount: 650,
    remainingAmount: 150,
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
    allocatedAmount: 400,
    spentAmount: 450,
    remainingAmount: -50,
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
    allocatedAmount: 600,
    spentAmount: 320,
    remainingAmount: 280,
    period: 'monthly',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-18T00:00:00Z'
  }
];

// Helper function to calculate goal progress
const calculateGoalProgress = (goal: SpendingGoal): GoalProgress => {
  const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);
  
  const startDate = new Date(goal.startDate);
  const endDate = new Date(goal.endDate);
  const today = new Date();
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 0);
  
  const dailyTargetAmount = goal.targetAmount / totalDays;
  const expectedAmount = dailyTargetAmount * (totalDays - daysRemaining);
  const isOnTrack = goal.currentAmount >= expectedAmount;
  
  const projectedCompletion: string = isOnTrack ? goal.endDate : 
    new Date(today.getTime() + (remainingAmount / dailyTargetAmount) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || goal.endDate;

  return {
    goalId: goal.id,
    progressPercentage: Math.round(progressPercentage),
    remainingAmount,
    daysRemaining,
    isOnTrack,
    projectedCompletion
  };
};

export class GoalsService {
  // Get all goals data
  static getGoalsData(): GoalsData {
    const goalProgress = spendingGoals.map(calculateGoalProgress);
    const activeGoals = spendingGoals.filter(goal => goal.status === 'active').length;
    const completedGoals = spendingGoals.filter(goal => goal.status === 'completed').length;
    const totalBudgetAllocated = budgets.reduce((sum, budget) => sum + budget.allocatedAmount, 0);
    const totalBudgetSpent = budgets.reduce((sum, budget) => sum + budget.spentAmount, 0);

    return {
      spendingGoals,
      budgets,
      goalProgress,
      totalGoals: spendingGoals.length,
      activeGoals,
      completedGoals,
      totalBudgetAllocated,
      totalBudgetSpent
    };
  }

  // Spending Goals CRUD
  static getSpendingGoals(): SpendingGoal[] {
    return spendingGoals;
  }

  static getSpendingGoalById(id: string): SpendingGoal | null {
    return spendingGoals.find(goal => goal.id === id) || null;
  }

  static createSpendingGoal(data: CreateSpendingGoalRequest): SpendingGoal {
    const newGoal: SpendingGoal = {
      id: (spendingGoals.length + 1).toString(),
      ...data,
      currentAmount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    spendingGoals.push(newGoal);
    return newGoal;
  }

  static updateSpendingGoal(id: string, data: UpdateSpendingGoalRequest): SpendingGoal | null {
    const goalIndex = spendingGoals.findIndex(goal => goal.id === id);
    if (goalIndex === -1) return null;

    const currentGoal = spendingGoals[goalIndex]!;
    const updatedGoal: SpendingGoal = {
      id: currentGoal.id,
      title: currentGoal.title,
      category: currentGoal.category,
      targetAmount: currentGoal.targetAmount,
      currentAmount: currentGoal.currentAmount,
      period: currentGoal.period,
      startDate: currentGoal.startDate,
      endDate: currentGoal.endDate,
      status: currentGoal.status,
      createdAt: currentGoal.createdAt,
      updatedAt: new Date().toISOString(),
      ...(currentGoal.description !== undefined && { description: currentGoal.description })
    };

    // Only update properties that are defined
    if (data.title !== undefined) updatedGoal.title = data.title;
    if (data.category !== undefined) updatedGoal.category = data.category;
    if (data.targetAmount !== undefined) updatedGoal.targetAmount = data.targetAmount;
    if (data.period !== undefined) updatedGoal.period = data.period;
    if (data.startDate !== undefined) updatedGoal.startDate = data.startDate;
    if (data.endDate !== undefined) updatedGoal.endDate = data.endDate;
    if (data.status !== undefined) updatedGoal.status = data.status;
    if (data.description !== undefined) updatedGoal.description = data.description;

    spendingGoals[goalIndex] = updatedGoal;
    return updatedGoal;
  }

  static deleteSpendingGoal(id: string): boolean {
    const goalIndex = spendingGoals.findIndex(goal => goal.id === id);
    if (goalIndex === -1) return false;

    spendingGoals.splice(goalIndex, 1);
    return true;
  }

  static updateGoalProgress(id: string, amount: number): SpendingGoal | null {
    const goalIndex = spendingGoals.findIndex(goal => goal.id === id);
    if (goalIndex === -1) return null;

    const goal = spendingGoals[goalIndex];
    if (!goal) return null;
    
    goal.currentAmount = amount;
    goal.updatedAt = new Date().toISOString();

    // Auto-complete goal if target reached
    if (amount >= goal.targetAmount) {
      goal.status = 'completed';
    }

    return goal;
  }

  static updateGoalProgressByTransaction(id: string, amount: number, transactionType: 'income' | 'expense'): SpendingGoal | null {
    const goalIndex = spendingGoals.findIndex(goal => goal.id === id);
    if (goalIndex === -1) return null;

    const goal = spendingGoals[goalIndex];
    if (!goal) return null;
    
    // Para metas financeiras: somar receitas e subtrair despesas
    if (transactionType === 'income') {
      goal.currentAmount += amount;
    } else if (transactionType === 'expense') {
      goal.currentAmount = Math.max(0, goal.currentAmount - amount);
    }
    
    goal.updatedAt = new Date().toISOString();

    // Auto-complete goal if target reached
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
    }

    return goal;
  }

  // Budgets CRUD
  static getBudgets(): Budget[] {
    return budgets;
  }

  static getBudgetById(id: string): Budget | null {
    return budgets.find(budget => budget.id === id) || null;
  }

  static createBudget(data: CreateBudgetRequest): Budget {
    const newBudget: Budget = {
      id: (budgets.length + 1).toString(),
      ...data,
      spentAmount: 0,
      remainingAmount: data.allocatedAmount,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    budgets.push(newBudget);
    return newBudget;
  }

  static updateBudget(id: string, data: UpdateBudgetRequest): Budget | null {
    const budgetIndex = budgets.findIndex(budget => budget.id === id);
    if (budgetIndex === -1) return null;

    const currentBudget = budgets[budgetIndex]!;
    const updatedBudget: Budget = {
      id: currentBudget.id,
      category: currentBudget.category,
      allocatedAmount: currentBudget.allocatedAmount,
      spentAmount: currentBudget.spentAmount,
      remainingAmount: currentBudget.remainingAmount,
      period: currentBudget.period,
      startDate: currentBudget.startDate,
      endDate: currentBudget.endDate,
      status: currentBudget.status,
      createdAt: currentBudget.createdAt,
      updatedAt: new Date().toISOString()
    };

    // Only update properties that are defined
    if (data.category !== undefined) updatedBudget.category = data.category;
    if (data.allocatedAmount !== undefined) updatedBudget.allocatedAmount = data.allocatedAmount;
    if (data.period !== undefined) updatedBudget.period = data.period;
    if (data.startDate !== undefined) updatedBudget.startDate = data.startDate;
    if (data.endDate !== undefined) updatedBudget.endDate = data.endDate;
    if (data.status !== undefined) updatedBudget.status = data.status;

    // Recalculate remaining amount if allocated amount changed
    if (data.allocatedAmount !== undefined) {
      updatedBudget.remainingAmount = data.allocatedAmount - updatedBudget.spentAmount;
      updatedBudget.status = updatedBudget.remainingAmount < 0 ? 'exceeded' : 'active';
    }

    budgets[budgetIndex] = updatedBudget;
    return updatedBudget;
  }

  static deleteBudget(id: string): boolean {
    const budgetIndex = budgets.findIndex(budget => budget.id === id);
    if (budgetIndex === -1) return false;

    budgets.splice(budgetIndex, 1);
    return true;
  }

  static updateBudgetSpending(id: string, spentAmount: number): Budget | null {
    const budgetIndex = budgets.findIndex(budget => budget.id === id);
    if (budgetIndex === -1) return null;

    const budget = budgets[budgetIndex];
    if (!budget) return null;

    budget.spentAmount = spentAmount;
    budget.remainingAmount = budget.allocatedAmount - spentAmount;
    budget.status = budget.remainingAmount < 0 ? 'exceeded' : 'active';
    budget.updatedAt = new Date().toISOString();

    return budget;
  }
}