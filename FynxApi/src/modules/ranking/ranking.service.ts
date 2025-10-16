import type { 
  UserRanking, 
  Badge, 
  Achievement, 
  LeaderboardEntry, 
  RankingData, 
  RankingFilters, 
  ScoreCalculation 
} from './ranking.types.js';

import { database } from '../../database/database.js';

// Helper function to calculate user level based on score
function calculateLevel(score: number): number {
  return Math.floor(score / 500) + 1;
}

// Helper function to calculate league based on score
function calculateLeague(score: number): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
  if (score >= 10000) return 'diamond';
  if (score >= 7500) return 'platinum';
  if (score >= 5000) return 'gold';
  if (score >= 2500) return 'silver';
  return 'bronze';
}

// Helper function to get trend
function getTrend(change: number): 'up' | 'down' | 'same' {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'same';
}

// Helper function to calculate percentile
function calculatePercentile(score: number, allScores: number[]): number {
  const sortedScores = allScores.sort((a, b) => a - b);
  const rank = sortedScores.findIndex(s => s >= score) + 1;
  return Math.round((rank / sortedScores.length) * 100);
}

// Helper function to generate contribution data
function generateContributionData(): Array<{ date: string; value: number; level: number }> {
  const data: Array<{ date: string; value: number; level: number }> = [];
  const today = new Date();
  
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const value = Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0;
    const dateString = date.toISOString().split('T')[0] || '';
    data.push({
      date: dateString,
      value,
      level: value
    });
  }
  
  return data;
}

export class RankingService {
  // Get complete ranking data for a user
  static async getRankingData(userId: number): Promise<RankingData> {
    const db = database;
    
    // Get user data and calculate score
    const userScore = await this.calculateScore(userId);
    const userLevel = calculateLevel(userScore.totalScore);
    const userLeague = calculateLeague(userScore.totalScore);
    
    // Get user position in global ranking
    const allScores = await db.all(`
      SELECT 
        u.id,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses,
        COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as goals_completed,
        COALESCE(MAX(julianday('now') - julianday(t.date)), 0) as days_since_last_activity
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      LEFT JOIN goals g ON u.id = g.user_id
      GROUP BY u.id
      ORDER BY (total_income - total_expenses) DESC
    `, []) as any[];
    
    const userPosition = allScores.findIndex(score => score.id === userId) + 1;
    const allScoreValues = allScores.map(s => s.total_income - s.total_expenses);
    const percentile = calculatePercentile(userScore.totalScore, allScoreValues);
    
    // Get monthly score (current month savings)
    const monthlyScore = await db.get(`
      SELECT 
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as monthly_savings
      FROM transactions t
      WHERE t.user_id = ? 
        AND strftime('%Y-%m', t.date) = strftime('%Y-%m', 'now')
    `, [userId]) as any;
    
    // Get total savings and savings rate
    const savingsData = await db.get(`
      SELECT 
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses
      FROM transactions t
      WHERE t.user_id = ?
    `, [userId]) as any;
    
    const totalSavings = savingsData.total_income - savingsData.total_expenses;
    const savingsRate = savingsData.total_income > 0 ? 
      ((savingsData.total_income - savingsData.total_expenses) / savingsData.total_income) * 100 : 0;
    
    // Get goals completed
    const goalsCompleted = await db.get(`
      SELECT COUNT(*) as count
      FROM goals
      WHERE user_id = ? AND status = 'completed'
    `, [userId]) as any;
    
    // Calculate streak days (simplified - days since last transaction)
    const lastActivity = await db.get(`
      SELECT MAX(date) as last_date
      FROM transactions
      WHERE user_id = ?
    `, [userId]) as any;
    
    const streakDays = lastActivity?.last_date ? 
      Math.max(0, Math.floor((Date.now() - new Date(lastActivity.last_date).getTime()) / (1000 * 60 * 60 * 24))) : 0;
    
    const globalLeaderboard = await this.getGlobalLeaderboard();
    const friendsLeaderboard = await this.getFriendsLeaderboard(userId);
    const categoryLeaderboards = await this.getCategoryLeaderboards();
    
    const userRanking: UserRanking = {
      id: userId.toString(),
      userId: userId.toString(),
      username: 'User', // This should come from user data
      position: userPosition,
      score: userScore.totalScore,
      level: userLevel,
      badges: [],
      achievements: [],
      monthlyScore: monthlyScore?.monthly_savings || 0,
      totalSavings,
      savingsRate,
      goalsCompleted: goalsCompleted?.count || 0,
      streakDays,
      lastActivity: new Date().toISOString(),
      joinedAt: new Date().toISOString()
    };

    const achievements = await this.getAchievements(userId);
    const badges = await this.getBadges(userId);

    const rankingStats = {
      totalUsers: allScores.length,
      averageScore: Math.round(allScoreValues.reduce((sum, score) => sum + score, 0) / allScores.length),
      topScore: Math.max(...allScoreValues),
      userPercentile: percentile
    };

    return {
      userRanking,
      globalLeaderboard,
      friendsLeaderboard,
      categoryLeaderboards,
      achievements,
      availableBadges: badges,
      rankingStats
    };
  }

  // Get global leaderboard
  static async getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
    const db = database;
    
    const leaderboard = await db.all(`
      SELECT 
        u.id,
        u.name as username,
        u.email,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_savings,
        COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as goals_completed
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      LEFT JOIN goals g ON u.id = g.user_id
      GROUP BY u.id, u.name, u.email
      ORDER BY total_savings DESC
      LIMIT 10
    `, []) as any[];

    return leaderboard.map((user, index) => ({
      position: index + 1,
      userId: user.id.toString(),
      username: user.username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      score: user.total_savings,
      level: calculateLevel(user.total_savings),
      league: calculateLeague(user.total_savings),
      change: Math.floor(Math.random() * 3) - 1,
      trend: getTrend(Math.floor(Math.random() * 3) - 1)
    }));
  }

  // Get friends leaderboard
  static async getFriendsLeaderboard(userId: number): Promise<LeaderboardEntry[]> {
    const db = database;
    
    // For demo purposes, return top 5 users excluding the current user
    const leaderboard = await db.all(`
      SELECT 
        u.id,
        u.name as username,
        u.email,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_savings,
        COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as goals_completed
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      LEFT JOIN goals g ON u.id = g.user_id
      WHERE u.id != ?
      GROUP BY u.id, u.name, u.email
      ORDER BY total_savings DESC
      LIMIT 5
    `, [userId]) as any[];

    return leaderboard.map((user, index) => ({
      position: index + 1,
      userId: user.id.toString(),
      username: user.username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      score: user.total_savings,
      level: calculateLevel(user.total_savings),
      league: calculateLeague(user.total_savings),
      change: Math.floor(Math.random() * 2) - 1,
      trend: getTrend(Math.floor(Math.random() * 2) - 1)
    }));
  }

  // Get category leaderboards
  static async getCategoryLeaderboards(): Promise<{
    savings: LeaderboardEntry[];
    goals: LeaderboardEntry[];
    consistency: LeaderboardEntry[];
  }> {
    const db = database;
    
    // Savings leaderboard
    const savingsLeaderboard = await db.all(`
      SELECT 
        u.id,
        u.name as username,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_savings
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      GROUP BY u.id, u.name
      ORDER BY total_savings DESC
      LIMIT 10
    `, []) as any[];

    // Goals leaderboard
    const goalsLeaderboard = await db.all(`
      SELECT 
        u.id,
        u.name as username,
        COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as goals_completed
      FROM users u
      LEFT JOIN goals g ON u.id = g.user_id
      GROUP BY u.id, u.name
      ORDER BY goals_completed DESC
      LIMIT 10
    `, []) as any[];

    // Consistency leaderboard (based on transaction frequency)
    const consistencyLeaderboard = await db.all(`
      SELECT 
        u.id,
        u.name as username,
        COUNT(DISTINCT DATE(t.date)) as active_days
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      WHERE t.date >= date('now', '-30 days')
      GROUP BY u.id, u.name
      ORDER BY active_days DESC
      LIMIT 10
    `, []) as any[];

    return {
      savings: savingsLeaderboard.map((user, index) => ({
        position: index + 1,
        userId: user.id.toString(),
        username: user.username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
        score: user.total_savings,
        level: calculateLevel(user.total_savings),
        league: calculateLeague(user.total_savings),
        change: Math.floor(Math.random() * 4) - 2,
        trend: getTrend(Math.floor(Math.random() * 4) - 2)
      })),
      goals: goalsLeaderboard.map((user, index) => ({
        position: index + 1,
        userId: user.id.toString(),
        username: user.username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
        score: user.goals_completed,
        level: calculateLevel(user.goals_completed * 100),
        league: calculateLeague(user.goals_completed * 100),
        change: Math.floor(Math.random() * 3) - 1,
        trend: getTrend(Math.floor(Math.random() * 3) - 1)
      })),
      consistency: consistencyLeaderboard.map((user, index) => ({
        position: index + 1,
        userId: user.id.toString(),
        username: user.username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
        score: user.active_days,
        level: calculateLevel(user.active_days * 50),
        league: calculateLeague(user.active_days * 50),
        change: Math.floor(Math.random() * 5) - 2,
        trend: getTrend(Math.floor(Math.random() * 5) - 2)
      }))
    };
  }

  // Get user ranking by ID
  static async getUserRanking(userId: number): Promise<UserRanking | null> {
    const db = database;
    
    const user = await db.get(`
      SELECT 
        u.id,
        u.name as username,
        u.email,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_savings,
        COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as goals_completed
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      LEFT JOIN goals g ON u.id = g.user_id
      WHERE u.id = ?
      GROUP BY u.id, u.name, u.email
    `, [userId]) as any;

    if (!user) return null;

    // Get user position
    const allUsers = await db.all(`
      SELECT 
        u.id,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_savings
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      GROUP BY u.id
      ORDER BY total_savings DESC
    `, []) as any[];

    const position = allUsers.findIndex(u => u.id === userId) + 1;
    const score = await this.calculateScore(userId);

    return {
      id: user.id.toString(),
      userId: user.id.toString(),
      username: user.username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      position,
      score: score.totalScore,
      level: calculateLevel(score.totalScore),
      badges: await this.getBadges(userId),
      achievements: await this.getAchievements(userId),
      monthlyScore: 0, // Would need monthly calculation
      totalSavings: user.total_savings,
      savingsRate: 0, // Would need calculation
      goalsCompleted: user.goals_completed,
      streakDays: 0, // Would need streak calculation
      lastActivity: new Date().toISOString(),
      joinedAt: new Date().toISOString()
    };
  }

  // Calculate user score
  static async calculateScore(userId: number): Promise<ScoreCalculation> {
    const db = database;
    
    const userData = await db.get(`
      SELECT 
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_savings,
        COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as goals_completed,
        COUNT(DISTINCT DATE(t.date)) as active_days
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      LEFT JOIN goals g ON u.id = g.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [userId]) as any;

    if (!userData) {
      throw new Error('User not found');
    }

    const savingsScore = Math.round(userData.total_savings * 0.1);
    const goalsScore = userData.goals_completed * 50;
    const consistencyScore = userData.active_days * 5;
    const bonusScore = 0; // Would need badges calculation
    const totalScore = savingsScore + goalsScore + consistencyScore + bonusScore;

    return {
      savingsScore,
      goalsScore,
      consistencyScore,
      bonusScore,
      totalScore,
      breakdown: [
        {
          category: 'Economia Total',
          points: savingsScore,
          description: `R$ ${userData.total_savings.toLocaleString('pt-BR')} economizados`
        },
        {
          category: 'Metas Completadas',
          points: goalsScore,
          description: `${userData.goals_completed} metas alcançadas`
        },
        {
          category: 'Consistência',
          points: consistencyScore,
          description: `${userData.active_days} dias ativos`
        },
        {
          category: 'Conquistas',
          points: bonusScore,
          description: `0 badges conquistadas`
        }
      ]
    };
  }

  // Update user score (simplified - would need proper implementation)
  static async updateUserScore(userId: number, scoreData: Partial<ScoreCalculation>): Promise<UserRanking | null> {
    // For now, just return the current user ranking
    return await this.getUserRanking(userId);
  }

  // Get achievements (simplified - returning empty for now)
  static async getAchievements(userId: number): Promise<Achievement[]> {
    // This would need a proper achievements system in the database
    return [];
  }

  // Get badges (simplified - returning empty for now)
  static async getBadges(userId: number): Promise<Badge[]> {
    // This would need a proper badges system in the database
    return [];
  }
}