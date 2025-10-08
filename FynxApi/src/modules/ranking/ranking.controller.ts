import type { Request, Response } from 'express';
import { RankingService } from './ranking.service.js';

export class RankingController {
  // GET /api/v1/ranking - Get complete ranking data
  static async getRankingData(req: Request, res: Response) {
    try {
      const userId = req.query.userId as string || 'user1';
      const rankingData = RankingService.getRankingData(userId);
      
      res.status(200).json({
        success: true,
        data: rankingData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar dados de ranking',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/ranking/leaderboard/global - Get global leaderboard
  static async getGlobalLeaderboard(req: Request, res: Response) {
    try {
      const leaderboard = RankingService.getGlobalLeaderboard();
      
      res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar ranking global',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/ranking/leaderboard/friends - Get friends leaderboard
  static async getFriendsLeaderboard(req: Request, res: Response) {
    try {
      const userId = req.query.userId as string || 'user1';
      const leaderboard = RankingService.getFriendsLeaderboard(userId);
      
      res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar ranking de amigos',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/ranking/leaderboard/categories - Get category leaderboards
  static async getCategoryLeaderboards(req: Request, res: Response) {
    try {
      const leaderboards = RankingService.getCategoryLeaderboards();
      
      res.status(200).json({
        success: true,
        data: leaderboards
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar rankings por categoria',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/ranking/user/:userId - Get specific user ranking
  static async getUserRanking(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ error: 'User ID parameter is required' });
      }
      const userRanking = RankingService.getUserRanking(userId);
      
      if (!userRanking) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      res.status(200).json({
        success: true,
        data: userRanking
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar ranking do usuário',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/ranking/score/:userId - Calculate user score
  static async calculateUserScore(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ error: 'User ID parameter is required' });
      }
      const scoreCalculation = RankingService.calculateScore(userId);
      
      res.status(200).json({
        success: true,
        data: scoreCalculation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao calcular pontuação do usuário',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT /api/v1/ranking/score/:userId - Update user score
  static async updateUserScore(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ error: 'User ID parameter is required' });
      }
      const scoreData = req.body;
      
      const updatedRanking = RankingService.updateUserScore(userId, scoreData);
      
      if (!updatedRanking) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      res.status(200).json({
        success: true,
        data: updatedRanking,
        message: 'Pontuação atualizada com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar pontuação do usuário',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/ranking/achievements/:userId - Get user achievements
  static async getUserAchievements(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ error: 'User ID parameter is required' });
      }
      const achievements = RankingService.getAchievements(userId);
      
      res.status(200).json({
        success: true,
        data: achievements
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar conquistas do usuário',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/ranking/badges/:userId - Get user badges
  static async getUserBadges(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ error: 'User ID parameter is required' });
      }
      const badges = RankingService.getBadges(userId);
      
      res.status(200).json({
        success: true,
        data: badges
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar badges do usuário',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}