import type { 
  UserRanking, 
  Badge, 
  Achievement, 
  LeaderboardEntry, 
  RankingData, 
  RankingFilters, 
  ScoreCalculation 
} from './ranking.types.js';

// Mock data storage
const mockBadges: Badge[] = [
  {
    id: '1',
    name: 'Primeiro Passo',
    description: 'Complete sua primeira meta de economia',
    icon: '🎯',
    color: '#10B981',
    earnedAt: '2025-01-15T00:00:00Z',
    category: 'goals'
  },
  {
    id: '2',
    name: 'Poupador Consistente',
    description: 'Economize por 30 dias consecutivos',
    icon: '💰',
    color: '#3B82F6',
    earnedAt: '2025-01-20T00:00:00Z',
    category: 'savings'
  },
  {
    id: '3',
    name: 'Maratonista Financeiro',
    description: 'Mantenha uma sequência de 100 dias',
    icon: '🏃‍♂️',
    color: '#F59E0B',
    earnedAt: '2025-01-25T00:00:00Z',
    category: 'streak'
  }
];

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Meta de R$ 10.000',
    description: 'Economize R$ 10.000 em total',
    icon: '💎',
    progress: 7500,
    target: 10000,
    completed: false,
    category: 'savings',
    reward: {
      points: 500,
      ...(mockBadges[1] && { badge: mockBadges[1] })
    }
  },
  {
    id: '2',
    title: 'Completar 5 Metas',
    description: 'Complete 5 metas de economia',
    icon: '🎯',
    progress: 3,
    target: 5,
    completed: false,
    category: 'goals',
    reward: {
      points: 300
    }
  },
  {
    id: '3',
    title: 'Sequência de 50 dias',
    description: 'Mantenha atividade por 50 dias consecutivos',
    icon: '🔥',
    progress: 50,
    target: 50,
    completed: true,
    completedAt: '2025-01-20T00:00:00Z',
    category: 'streak',
    reward: {
      points: 200,
      ...(mockBadges[2] && { badge: mockBadges[2] })
    }
  }
];

let userRankings: UserRanking[] = [
  {
    id: '1',
    userId: 'user1',
    username: 'João Silva',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joao',
    position: 1,
    score: 2850,
    level: 12,
    badges: [mockBadges[0], mockBadges[1], mockBadges[2]].filter((badge): badge is Badge => Boolean(badge)),
    achievements: mockAchievements,
    monthlyScore: 450,
    totalSavings: 15000,
    savingsRate: 25.5,
    goalsCompleted: 8,
    streakDays: 75,
    lastActivity: '2025-01-25T10:30:00Z',
    joinedAt: '2024-10-01T00:00:00Z'
  },
  {
    id: '2',
    userId: 'user2',
    username: 'Maria Santos',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
    position: 2,
    score: 2720,
    level: 11,
    badges: [mockBadges[0], mockBadges[1]].filter((badge): badge is Badge => Boolean(badge)),
    achievements: mockAchievements.slice(0, 2),
    monthlyScore: 420,
    totalSavings: 12500,
    savingsRate: 22.3,
    goalsCompleted: 6,
    streakDays: 45,
    lastActivity: '2025-01-25T09:15:00Z',
    joinedAt: '2024-11-15T00:00:00Z'
  },
  {
    id: '3',
    userId: 'user3',
    username: 'Pedro Costa',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pedro',
    position: 3,
    score: 2580,
    level: 10,
    badges: [mockBadges[0]].filter((badge): badge is Badge => Boolean(badge)),
    achievements: mockAchievements.slice(0, 1),
    monthlyScore: 380,
    totalSavings: 9800,
    savingsRate: 18.7,
    goalsCompleted: 4,
    streakDays: 32,
    lastActivity: '2025-01-24T16:45:00Z',
    joinedAt: '2024-12-01T00:00:00Z'
  },
  {
    id: '4',
    userId: 'user4',
    username: 'Ana Oliveira',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ana',
    position: 4,
    score: 2350,
    level: 9,
    badges: [mockBadges[0]].filter((badge): badge is Badge => Boolean(badge)),
    achievements: mockAchievements.slice(0, 1),
    monthlyScore: 340,
    totalSavings: 8200,
    savingsRate: 20.1,
    goalsCompleted: 3,
    streakDays: 28,
    lastActivity: '2025-01-25T08:20:00Z',
    joinedAt: '2024-12-15T00:00:00Z'
  },
  {
    id: '5',
    userId: 'user5',
    username: 'Carlos Ferreira',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
    position: 5,
    score: 2180,
    level: 8,
    badges: [],
    achievements: [],
    monthlyScore: 310,
    totalSavings: 6500,
    savingsRate: 15.8,
    goalsCompleted: 2,
    streakDays: 15,
    lastActivity: '2025-01-23T14:30:00Z',
    joinedAt: '2025-01-01T00:00:00Z'
  }
];

export class RankingService {
  // Calculate league based on score
  static calculateLeague(score: number): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
    if (score >= 2500) return 'diamond';
    if (score >= 2000) return 'platinum';
    if (score >= 1500) return 'gold';
    if (score >= 1000) return 'silver';
    return 'bronze';
  }

  // Get complete ranking data
  static getRankingData(userId: string = 'user1'): RankingData {
    const userRanking = userRankings.find(u => u.userId === userId) || userRankings[0];
    if (!userRanking) {
      throw new Error('User ranking not found');
    }
    const globalLeaderboard = this.getGlobalLeaderboard();
    const friendsLeaderboard = this.getFriendsLeaderboard(userId);
    const categoryLeaderboards = this.getCategoryLeaderboards();
    
    return {
      userRanking,
      globalLeaderboard,
      friendsLeaderboard,
      categoryLeaderboards,
      achievements: mockAchievements,
      availableBadges: mockBadges,
      rankingStats: {
        totalUsers: userRankings.length,
        averageScore: Math.round(userRankings.reduce((sum, u) => sum + u.score, 0) / userRankings.length),
        topScore: Math.max(...userRankings.map(u => u.score)),
        userPercentile: this.calculatePercentile(userRanking.score)
      }
    };
  }

  // Get global leaderboard
  static getGlobalLeaderboard(filters?: RankingFilters): LeaderboardEntry[] {
    return userRankings
      .sort((a, b) => b.score - a.score)
      .map((user, index) => ({
        position: index + 1,
        userId: user.userId,
        username: user.username,
        ...(user.avatar && { avatar: user.avatar }),
        score: user.score,
        level: user.level,
        league: this.calculateLeague(user.score),
        change: Math.floor(Math.random() * 6) - 3, // Random change for demo
        trend: this.getTrend(Math.floor(Math.random() * 6) - 3)
      }));
  }

  // Get friends leaderboard (mock - returns subset)
  static getFriendsLeaderboard(userId: string): LeaderboardEntry[] {
    return userRankings
      .slice(0, 3) // Mock friends
      .sort((a, b) => b.score - a.score)
      .map((user, index) => ({
        position: index + 1,
        userId: user.userId,
        username: user.username,
        ...(user.avatar && { avatar: user.avatar }),
        score: user.score,
        level: user.level,
        league: this.calculateLeague(user.score),
        change: Math.floor(Math.random() * 4) - 2,
        trend: this.getTrend(Math.floor(Math.random() * 4) - 2)
      }));
  }

  // Get category leaderboards
  static getCategoryLeaderboards(): {
    savings: LeaderboardEntry[];
    goals: LeaderboardEntry[];
    consistency: LeaderboardEntry[];
  } {
    const savingsLeaderboard = userRankings
      .sort((a, b) => b.totalSavings - a.totalSavings)
      .slice(0, 10)
      .map((user, index) => ({
        position: index + 1,
        userId: user.userId,
        username: user.username,
        ...(user.avatar && { avatar: user.avatar }),
        score: user.totalSavings,
        level: user.level,
        league: this.calculateLeague(user.score),
        change: Math.floor(Math.random() * 4) - 2,
        trend: this.getTrend(Math.floor(Math.random() * 4) - 2)
      }));

    const goalsLeaderboard = userRankings
      .sort((a, b) => b.goalsCompleted - a.goalsCompleted)
      .slice(0, 10)
      .map((user, index) => ({
        position: index + 1,
        userId: user.userId,
        username: user.username,
        ...(user.avatar && { avatar: user.avatar }),
        score: user.goalsCompleted,
        level: user.level,
        league: this.calculateLeague(user.score),
        change: Math.floor(Math.random() * 3) - 1,
        trend: this.getTrend(Math.floor(Math.random() * 3) - 1)
      }));

    const consistencyLeaderboard = userRankings
      .sort((a, b) => b.streakDays - a.streakDays)
      .slice(0, 10)
      .map((user, index) => ({
        position: index + 1,
        userId: user.userId,
        username: user.username,
        ...(user.avatar && { avatar: user.avatar }),
        score: user.streakDays,
        level: user.level,
        league: this.calculateLeague(user.score),
        change: Math.floor(Math.random() * 5) - 2,
        trend: this.getTrend(Math.floor(Math.random() * 5) - 2)
      }));

    return {
      savings: savingsLeaderboard,
      goals: goalsLeaderboard,
      consistency: consistencyLeaderboard
    };
  }

  // Get user ranking by ID
  static getUserRanking(userId: string): UserRanking | null {
    return userRankings.find(u => u.userId === userId) || null;
  }

  // Calculate user score
  static calculateScore(userId: string): ScoreCalculation {
    const user = userRankings.find(u => u.userId === userId);
    if (!user) {
      throw new Error('User not found');
    }

    const savingsScore = Math.round(user.totalSavings * 0.1);
    const goalsScore = user.goalsCompleted * 50;
    const consistencyScore = user.streakDays * 5;
    const bonusScore = user.badges.length * 25;
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
          description: `R$ ${user.totalSavings.toLocaleString('pt-BR')} economizados`
        },
        {
          category: 'Metas Completadas',
          points: goalsScore,
          description: `${user.goalsCompleted} metas alcançadas`
        },
        {
          category: 'Consistência',
          points: consistencyScore,
          description: `${user.streakDays} dias de sequência`
        },
        {
          category: 'Conquistas',
          points: bonusScore,
          description: `${user.badges.length} badges conquistadas`
        }
      ]
    };
  }

  // Update user score
  static updateUserScore(userId: string, scoreData: Partial<ScoreCalculation>): UserRanking | null {
    const userIndex = userRankings.findIndex(u => u.userId === userId);
    if (userIndex === -1) return null;

    if (scoreData.totalScore && userRankings[userIndex]) {
      userRankings[userIndex].score = scoreData.totalScore;
      userRankings[userIndex].lastActivity = new Date().toISOString();
      
      // Recalculate positions
      userRankings.sort((a, b) => b.score - a.score);
      userRankings.forEach((user, index) => {
        user.position = index + 1;
      });
    }

    return userRankings[userIndex] || null;
  }

  // Get achievements
  static getAchievements(userId: string): Achievement[] {
    const user = userRankings.find(u => u.userId === userId);
    return user ? user.achievements : [];
  }

  // Get badges
  static getBadges(userId: string): Badge[] {
    const user = userRankings.find(u => u.userId === userId);
    return user ? user.badges : [];
  }

  // Helper methods
  private static getTrend(change: number): 'up' | 'down' | 'same' {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'same';
  }

  private static calculatePercentile(score: number): number {
    const sortedScores = userRankings.map(u => u.score).sort((a, b) => a - b);
    const rank = sortedScores.findIndex(s => s >= score) + 1;
    return Math.round((rank / sortedScores.length) * 100);
  }
}