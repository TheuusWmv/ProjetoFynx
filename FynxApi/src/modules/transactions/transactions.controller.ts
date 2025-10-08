import type { Request, Response } from 'express';
import { TransactionsService } from './transactions.service.js';
import type { TransactionFilters, CreateTransactionRequest, UpdateTransactionRequest, BulkTransactionOperation } from './transactions.types.js';

export class TransactionsController {
  // GET /api/v1/transactions - Get all transactions with filters and pagination
  static async getTransactions(req: Request, res: Response) {
    try {
      const userId = (req.query.userId as string) || 'user1';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters: TransactionFilters = {
        ...(req.query.type && { type: req.query.type as 'income' | 'expense' | 'all' }),
        ...(req.query.category && { category: req.query.category as string }),
        ...(req.query.subcategory && { subcategory: req.query.subcategory as string }),
        ...(req.query.paymentMethod && { paymentMethod: req.query.paymentMethod as string }),
        ...(req.query.dateFrom && { dateFrom: req.query.dateFrom as string }),
        ...(req.query.dateTo && { dateTo: req.query.dateTo as string }),
        ...(req.query.amountMin && { amountMin: parseFloat(req.query.amountMin as string) }),
        ...(req.query.amountMax && { amountMax: parseFloat(req.query.amountMax as string) }),
        ...(req.query.search && { search: req.query.search as string }),
        ...(req.query.tags && { tags: (req.query.tags as string).split(',') })
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof TransactionFilters] === undefined) {
          delete filters[key as keyof TransactionFilters];
        }
      });

      const transactionsData = TransactionsService.getTransactions(userId, filters, page, limit);
      
      res.status(200).json({
        success: true,
        data: transactionsData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar transações',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/transactions/:id - Get transaction by ID
  static async getTransactionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req.query.userId as string) || 'user1';
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID da transação é obrigatório'
        });
      }
      
      const transaction = TransactionsService.getTransactionById(id, userId);
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transação não encontrada'
        });
      }
      
      res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar transação',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/v1/transactions - Create new transaction
  static async createTransaction(req: Request, res: Response) {
    try {
      const userId = req.body.userId || 'user1';
      const transactionData: CreateTransactionRequest = req.body;
      
      const newTransaction = TransactionsService.createTransaction(transactionData, userId);
      
      res.status(201).json({
        success: true,
        data: newTransaction,
        message: 'Transação criada com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao criar transação',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT /api/v1/transactions/:id - Update transaction
  static async updateTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.body.userId || 'user1';
      const updateData: UpdateTransactionRequest = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID da transação é obrigatório'
        });
      }
      
      const updatedTransaction = TransactionsService.updateTransaction(id, updateData, userId);
      
      if (!updatedTransaction) {
        return res.status(404).json({
          success: false,
          message: 'Transação não encontrada'
        });
      }
      
      res.status(200).json({
        success: true,
        data: updatedTransaction,
        message: 'Transação atualizada com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar transação',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // DELETE /api/v1/transactions/:id - Delete transaction
  static async deleteTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req.query.userId as string) || 'user1';
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID da transação é obrigatório'
        });
      }
      
      const deleted = TransactionsService.deleteTransaction(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Transação não encontrada'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Transação deletada com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao deletar transação',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/v1/transactions/bulk - Bulk operations
  static async bulkOperation(req: Request, res: Response) {
    try {
      const userId = req.body.userId || 'user1';
      const operation: BulkTransactionOperation = req.body;
      
      const result = TransactionsService.bulkOperation(operation, userId);
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Operação em lote concluída: ${result.success} sucessos, ${result.failed} falhas`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao executar operação em lote',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/transactions/categories - Get transaction categories
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = TransactionsService.getCategories();
      
      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar categorias',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/transactions/summary - Get transactions summary
  static async getTransactionsSummary(req: Request, res: Response) {
    try {
      const userId = req.query.userId as string || 'user1';
      
      const filters: TransactionFilters = {
        type: req.query.type as any,
        category: req.query.category as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof TransactionFilters] === undefined) {
          delete filters[key as keyof TransactionFilters];
        }
      });

      const transactionsData = TransactionsService.getTransactions(userId, filters, 1, 1000);
      
      res.status(200).json({
        success: true,
        data: {
          summary: transactionsData.summary,
          stats: transactionsData.stats
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar resumo das transações',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/transactions/stats - Get transactions statistics
  static async getTransactionsStats(req: Request, res: Response) {
    try {
      const userId = req.query.userId as string || 'user1';
      
      const transactionsData = TransactionsService.getTransactions(userId, {}, 1, 1000);
      
      res.status(200).json({
        success: true,
        data: transactionsData.stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas das transações',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}