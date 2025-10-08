// dashboard.service.ts

/**
 * @file Implementa a lógica de negócios para o módulo de dashboard.

 */

import type {
  DashboardData,
  Transaction,
  OverviewData,
  SpendingCategory,
  IncomeCategory,
  DailyData,
  MonthlyData,
} from './dashboard.types.js';

// Simula um banco de dados de transações em memória.
let transactions: Transaction[] = [
  { id: 1, description: "Salário Mensal", type: 'income', status: 'completed', amount: 5200.00, date: "2025-01-26", category: "Salário" },
  { id: 2, description: "Aluguel", type: 'expense', status: 'completed', amount: 1200.00, date: "2025-01-25", category: "Moradia" },
  { id: 3, description: "Retorno de Investimento", type: 'income', status: 'pending', amount: 850.00, date: "2025-01-24", category: "Investimento" },
  { id: 4, description: "Supermercado", type: 'expense', status: 'completed', amount: 320.50, date: "2025-01-23", category: "Alimentação" },
];

/**
 * Calcula os dados do overview (Balanço Total, Renda Mensal, Despesas Mensais, Taxa de Poupança).
 * @returns {OverviewData[]} Os dados calculados para o overview.
 */
const calculateOverview = (): OverviewData[] => {
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (totalBalance / monthlyIncome) * 100 : 0;

  // Mock de dados de comparação com o mês anterior.
  return [
    { title: "Total Balance", value: `$${totalBalance.toFixed(2)}`, change: "+12.5% vs last month", trend: 'up' },
    { title: "Monthly Income", value: `$${monthlyIncome.toFixed(2)}`, change: "+6.2% vs last month", trend: 'up' },
    { title: "Monthly Expenses", value: `$${monthlyExpenses.toFixed(2)}`, change: "+5.1% vs last month", trend: 'up' },
    { title: "Savings Rate", value: `${savingsRate.toFixed(1)}%`, change: "+2.1% steady growth", trend: 'up' },
  ];
};

/**
 * Agrupa as transações por categoria.
 * @returns {{ spendingByCategory: SpendingCategory[], incomeByCategory: IncomeCategory[] }} As transações agrupadas.
 */
const getCategoryData = (): { spendingByCategory: SpendingCategory[], incomeByCategory: IncomeCategory[] } => {
  const spendingByCategory: SpendingCategory[] = [];
  const incomeByCategory: IncomeCategory[] = [];

  transactions.forEach(t => {
    if (t.status === 'completed') {
      if (t.type === 'expense') {
        const existing = spendingByCategory.find(c => c.category === t.category);
        if (existing) {
          existing.value += t.amount;
        } else {
          spendingByCategory.push({ category: t.category, value: t.amount });
        }
      } else if (t.type === 'income') {
        const existing = incomeByCategory.find(c => c.category === t.category);
        if (existing) {
          existing.value += t.amount;
        } else {
          incomeByCategory.push({ category: t.category, value: t.amount });
        }
      }
    }
  });

  return { spendingByCategory, incomeByCategory };
};

/**
 * Gera dados diários e mensais mocados para os gráficos.
 * @returns {{ dailyPerformance: DailyData[], monthlyPerformance: MonthlyData[] }} Os dados gerados.
 */
const getPerformanceData = (): { dailyPerformance: DailyData[], monthlyPerformance: MonthlyData[] } => {
  // Gera dados diários começando em 04/09/2025
  const startDate = new Date('2025-09-04'); // 04/09/2025
  const dailyPerformance: DailyData[] = Array.from({ length: 30 }, (_, i) => {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    return {
      day: `${currentDate.getDate()}`,
      date: currentDate.toISOString().split('T')[0] as string, // YYYY-MM-DD format
      income: Math.floor(Math.random() * 1000) + 200, // Entre 200-1200
      expense: Math.floor(Math.random() * 500) + 100,  // Entre 100-600
    };
  });

  const monthlyPerformance: MonthlyData[] = [
    { month: "Jul", income: 15200, expense: 12400 },
    { month: "Ago", income: 14800, expense: 11200 },
    { month: "Set", income: 16500, expense: 13800 },
  ];

  return { dailyPerformance, monthlyPerformance };
};

/**
 * Busca todos os dados do dashboard.
 * @returns {DashboardData} Os dados completos do dashboard.
 */
export const getDashboardData = (): DashboardData => {
  const overview = calculateOverview();
  const { spendingByCategory, incomeByCategory } = getCategoryData();
  const { dailyPerformance, monthlyPerformance } = getPerformanceData();
  
  return {
    overview,
    recentTransactions: transactions.slice(0, 4), // Retorna as 4 transações mais recentes.
    spendingByCategory,
    incomeByCategory,
    dailyPerformance,
    monthlyPerformance,
  };
};

/**
 * Adiciona uma nova transação.
 * @param {Omit<Transaction, 'id'>} transactionData - Os dados da nova transação.
 * @returns {Transaction} A transação criada.
 */
export const addTransaction = (transactionData: Omit<Transaction, 'id'>): Transaction => {
  const newTransaction: Transaction = {
    id: transactions.length + 1,
    ...transactionData,
  };
  transactions.push(newTransaction);
  return newTransaction;
};

/**
 * Retorna o histórico de transações.
 * @returns {Transaction[]} O histórico de transações.
 */
export const getTransactionHistory = (): Transaction[] => {
  return transactions;
};