// dashboard.controller.ts

/**
 * @file Define os controladores para o módulo de dashboard.
 * @author Douglas Bernardes
 */

import type { Request, Response } from 'express';
import * as DashboardService from './dashboard.service.js';

/**
 * Controlador para buscar os dados do dashboard.
 * @param {Request} _req - O objeto de requisição (não utilizado).
 * @param {Response} res - O objeto de resposta.
 */
export const getDashboardData = (_req: Request, res: Response) => {
  try {
    const data = DashboardService.getDashboardData();
    res.status(200).json(data);
  } catch (error) {
    console.error('Erro no getDashboardData:', error);
    res.status(500).json({ 
      message: "Erro ao buscar dados do dashboard", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Controlador para adicionar uma nova transação.
 * @param {Request} req - O objeto de requisição.
 * @param {Response} res - O objeto de resposta.
 */
export const addTransaction = (req: Request, res: Response) => {
  try {
    const newTransaction = DashboardService.addTransaction(req.body);
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({ message: "Erro ao adicionar transação", error });
  }
};

/**
 * Controlador para buscar o histórico de transações.
 * @param {Request} _req - O objeto de requisição (não utilizado).
 * @param {Response} res - O objeto de resposta.
 */
export const getTransactionHistory = (_req: Request, res: Response) => {
  try {
    const history = DashboardService.getTransactionHistory();
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar histórico de transações", error });
  }
};