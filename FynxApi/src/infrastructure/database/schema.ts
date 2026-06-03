export const SCHEMA = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      color TEXT,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  custom_categories: `
    CREATE TABLE IF NOT EXISTS custom_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `,
  transactions: `
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      date DATE NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      notes TEXT,
      spending_goal_id INTEGER,
      saving_goal_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (spending_goal_id) REFERENCES spending_goals (id),
      FOREIGN KEY (saving_goal_id) REFERENCES spending_goals (id)
    )
  `,
  spending_goals: `
    CREATE TABLE IF NOT EXISTS spending_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      goal_type TEXT DEFAULT 'spending',
      target_amount DECIMAL(10,2) NOT NULL,
      current_amount DECIMAL(10,2) DEFAULT 0,
      period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly', 'yearly')),
      start_date DATE,
      end_date DATE,
      status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'paused')),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `,
  budgets: `
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      category TEXT NOT NULL DEFAULT 'Geral',
      allocated_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      spent_amount DECIMAL(10,2) DEFAULT 0,
      remaining_amount DECIMAL(10,2) DEFAULT 0,
      period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly', 'yearly')),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `,
  spending_limits: `
    CREATE TABLE IF NOT EXISTS spending_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      limit_amount DECIMAL(10,2) NOT NULL,
      current_spent DECIMAL(10,2) DEFAULT 0,
      period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly', 'yearly')),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'exceeded', 'paused')) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  user_scores: `
    CREATE TABLE IF NOT EXISTS user_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      total_score INTEGER DEFAULT 0,
      carry_over_score INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      league TEXT DEFAULT 'Bronze',
      current_streak INTEGER DEFAULT 0,
      max_streak INTEGER DEFAULT 0,
      last_checkin DATE,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `,
  achievements: `
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  user_achievements: `
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      achievement_id INTEGER NOT NULL,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (achievement_id) REFERENCES achievements (id),
      UNIQUE(user_id, achievement_id)
    )
  `,
  badges: `
    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      category TEXT,
      requirements TEXT -- JSON string of requirements
    )
  `,
  user_badges: `
    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      badge_id TEXT NOT NULL,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (badge_id) REFERENCES badges (id),
      UNIQUE(user_id, badge_id)
    )
  `,
  user_whatsapp_accounts: `
    CREATE TABLE IF NOT EXISTS user_whatsapp_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      phone_hash TEXT NOT NULL,
      phone_masked TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'revoked')) DEFAULT 'pending',
      verified_at DATETIME,
      revoked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, phone_hash)
    )
  `,
  whatsapp_otp_challenges: `
    CREATE TABLE IF NOT EXISTS whatsapp_otp_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      phone_hash TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'used', 'expired', 'blocked')) DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      send_count INTEGER DEFAULT 1,
      expires_at DATETIME NOT NULL,
      last_sent_at DATETIME NOT NULL,
      next_resend_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `,
  whatsapp_audit_logs: `
    CREATE TABLE IF NOT EXISTS whatsapp_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      phone_hash TEXT,
      event_type TEXT NOT NULL,
      status TEXT NOT NULL,
      provider_message_id TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `,
  whatsapp_context_refs: `
    CREATE TABLE IF NOT EXISTS whatsapp_context_refs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      phone_hash TEXT NOT NULL,
      context_hash TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      revoked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `,
  whatsapp_message_events: `
    CREATE TABLE IF NOT EXISTS whatsapp_message_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      context_ref_id INTEGER,
      provider_message_id TEXT UNIQUE,
      action_type TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('processing', 'success', 'failed', 'duplicate')) DEFAULT 'processing',
      request_payload TEXT,
      response_payload TEXT,
      error_code TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (context_ref_id) REFERENCES whatsapp_context_refs (id)
    )
  `
};
