import type { Request, Response } from 'express';
import { GoalsService } from './goals.service.js';

export class GoalsController {
  // Get all goals data (overview)
  static async getGoalsData(req: Request, res: Response) {
    try {
      const goalsData = GoalsService.getGoalsData();
      res.status(200).json(goalsData);
    } catch (error) {
      console.error('Error fetching goals data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Spending Goals endpoints
  static async getSpendingGoals(req: Request, res: Response) {
    try {
      const spendingGoals = GoalsService.getSpendingGoals();
      res.status(200).json(spendingGoals);
    } catch (error) {
      console.error('Error fetching spending goals:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getSpendingGoalById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'ID parameter is required' });
      }
      const spendingGoal = GoalsService.getSpendingGoalById(id);
      
      if (!spendingGoal) {
        return res.status(404).json({ error: 'Spending goal not found' });
      }
      
      res.status(200).json(spendingGoal);
    } catch (error) {
      console.error('Error fetching spending goal:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createSpendingGoal(req: Request, res: Response) {
    try {
      const goalData = req.body;
      const newGoal = GoalsService.createSpendingGoal(goalData);
      res.status(201).json(newGoal);
    } catch (error) {
      console.error('Error creating spending goal:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateSpendingGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'ID parameter is required' });
      }
      const updateData = req.body;
      const updatedGoal = GoalsService.updateSpendingGoal(id, updateData);
      
      if (!updatedGoal) {
        return res.status(404).json({ error: 'Spending goal not found' });
      }
      
      res.status(200).json(updatedGoal);
    } catch (error) {
      console.error('Error updating spending goal:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteSpendingGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'ID parameter is required' });
      }
      const deleted = GoalsService.deleteSpendingGoal(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Spending goal not found' });
      }
      
      res.status(200).json({ message: 'Spending goal deleted successfully' });
    } catch (error) {
      console.error('Error deleting spending goal:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateGoalProgress(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'ID parameter is required' });
      }
      const { amount } = req.body;
      const updatedGoal = GoalsService.updateGoalProgress(id, amount);
      
      if (!updatedGoal) {
        return res.status(404).json({ error: 'Spending goal not found' });
      }
      
      res.status(200).json(updatedGoal);
    } catch (error) {
      console.error('Error updating goal progress:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateGoalProgressByTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'ID parameter is required' });
      }
      const { amount, transactionType } = req.body;
      
      if (!transactionType || !['income', 'expense'].includes(transactionType)) {
        return res.status(400).json({ error: 'Valid transaction type (income or expense) is required' });
      }
      
      const updatedGoal = GoalsService.updateGoalProgressByTransaction(id, amount, transactionType);
      
      if (!updatedGoal) {
        return res.status(404).json({ error: 'Spending goal not found' });
      }
      
      res.status(200).json(updatedGoal);
    } catch (error) {
      console.error('Error updating goal progress by transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } 

  // Budget endpoints
  static async getBudgets(req: Request, res: Response) {
    try {
      const budgets = GoalsService.getBudgets();
      res.status(200).json(budgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getBudgetById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'ID parameter is required' });
      }
      const budget = GoalsService.getBudgetById(id);
      
      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }
      
      res.status(200).json(budget);
    } catch (error) {
      console.error('Error fetching budget:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createBudget(req: Request, res: Response) {
    try {
      const budgetData = req.body;
      const newBudget = GoalsService.createBudget(budgetData);
      res.status(201).json(newBudget);
    } catch (error) {
      console.error('Error creating budget:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateBudget(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'ID parameter is required' });
      }
      const updateData = req.body;
      const updatedBudget = GoalsService.updateBudget(id, updateData);
      
      if (!updatedBudget) {
        return res.status(404).json({ error: 'Budget not found' });
      }
      
      res.status(200).json(updatedBudget);
    } catch (error) {
      console.error('Error updating budget:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteBudget(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'ID parameter is required' });
      }
      const deleted = GoalsService.deleteBudget(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Budget not found' });
      }
      
      res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (error) {
      console.error('Error deleting budget:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateBudgetSpending(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'ID parameter is required' });
      }
      const { spentAmount } = req.body;
      const updatedBudget = GoalsService.updateBudgetSpending(id, spentAmount);
      
      if (!updatedBudget) {
        return res.status(404).json({ error: 'Budget not found' });
      }
      
      res.status(200).json(updatedBudget);
    } catch (error) {
      console.error('Error updating budget spending:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}