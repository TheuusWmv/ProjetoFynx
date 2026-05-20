import database from '../../../../infrastructure/database/database.js';
import type { WhatsappAccount, WhatsappOtpChallenge } from '../whatsapp.types.js';

export class UserWhatsappRepository {
  static findAccountsByUser(userId: number): Promise<WhatsappAccount[]> {
    return database.all(
      `SELECT * FROM user_whatsapp_accounts
       WHERE user_id = ? AND status != 'revoked'
       ORDER BY created_at DESC`,
      [userId],
    ) as Promise<WhatsappAccount[]>;
  }

  static findVerifiedAccountByPhoneHash(phoneHash: string): Promise<WhatsappAccount | undefined> {
    return database.get(
      `SELECT * FROM user_whatsapp_accounts
       WHERE phone_hash = ? AND status = 'verified'
       LIMIT 1`,
      [phoneHash],
    ) as Promise<WhatsappAccount | undefined>;
  }

  static async upsertPendingAccount(userId: number, phoneHash: string, phoneMasked: string): Promise<void> {
    const existing = await database.get(
      'SELECT id FROM user_whatsapp_accounts WHERE user_id = ? AND phone_hash = ?',
      [userId, phoneHash],
    );

    if (existing) {
      await database.run(
        `UPDATE user_whatsapp_accounts
         SET phone_masked = ?, status = 'pending', revoked_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [phoneMasked, existing.id],
      );
      return;
    }

    await database.run(
      `INSERT INTO user_whatsapp_accounts (user_id, phone_hash, phone_masked, status)
       VALUES (?, ?, ?, 'pending')`,
      [userId, phoneHash, phoneMasked],
    );
  }

  static async markAccountVerified(userId: number, phoneHash: string): Promise<void> {
    await database.run(
      `UPDATE user_whatsapp_accounts
       SET status = 'verified', verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND phone_hash = ?`,
      [userId, phoneHash],
    );
  }

  static async revokeAccount(userId: number, accountId: number): Promise<boolean> {
    const result = await database.run(
      `UPDATE user_whatsapp_accounts
       SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [accountId, userId],
    );
    return result.changes > 0;
  }

  static findLatestPendingChallenge(userId: number, phoneHash: string): Promise<WhatsappOtpChallenge | undefined> {
    return database.get(
      `SELECT * FROM whatsapp_otp_challenges
       WHERE user_id = ? AND phone_hash = ? AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, phoneHash],
    ) as Promise<WhatsappOtpChallenge | undefined>;
  }

  static async expirePendingChallenges(userId: number, phoneHash: string): Promise<void> {
    await database.run(
      `UPDATE whatsapp_otp_challenges
       SET status = 'expired'
       WHERE user_id = ? AND phone_hash = ? AND status = 'pending'`,
      [userId, phoneHash],
    );
  }

  static async createChallenge(params: {
    userId: number;
    phoneHash: string;
    codeHash: string;
    sendCount: number;
    expiresAt: Date;
    lastSentAt: Date;
    nextResendAt: Date;
  }): Promise<void> {
    await database.run(
      `INSERT INTO whatsapp_otp_challenges
       (user_id, phone_hash, code_hash, send_count, expires_at, last_sent_at, next_resend_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        params.userId,
        params.phoneHash,
        params.codeHash,
        params.sendCount,
        toSqlDate(params.expiresAt),
        toSqlDate(params.lastSentAt),
        toSqlDate(params.nextResendAt),
      ],
    );
  }

  static async incrementChallengeAttempts(id: number, attempts: number): Promise<void> {
    await database.run('UPDATE whatsapp_otp_challenges SET attempts = ? WHERE id = ?', [attempts, id]);
  }

  static async markChallengeStatus(id: number, status: 'used' | 'expired' | 'blocked'): Promise<void> {
    const usedAt = status === 'used' ? ', used_at = CURRENT_TIMESTAMP' : '';
    await database.run(`UPDATE whatsapp_otp_challenges SET status = ?${usedAt} WHERE id = ?`, [status, id]);
  }

  static countChallengesSince(userId: number, phoneHash: string, since: Date): Promise<{ count: number }> {
    return database.get(
      `SELECT COUNT(*) as count FROM whatsapp_otp_challenges
       WHERE user_id = ? AND phone_hash = ? AND created_at >= ?`,
      [userId, phoneHash, toSqlDate(since)],
    ) as Promise<{ count: number }>;
  }

  static countUserChallengesSince(userId: number, since: Date): Promise<{ count: number }> {
    return database.get(
      `SELECT COUNT(*) as count FROM whatsapp_otp_challenges
       WHERE user_id = ? AND created_at >= ?`,
      [userId, toSqlDate(since)],
    ) as Promise<{ count: number }>;
  }

  static async createAuditLog(params: {
    userId?: number;
    phoneHash?: string;
    eventType: string;
    status: string;
    providerMessageId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await database.run(
      `INSERT INTO whatsapp_audit_logs (user_id, phone_hash, event_type, status, provider_message_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.userId ?? null,
        params.phoneHash ?? null,
        params.eventType,
        params.status,
        params.providerMessageId ?? null,
        params.metadata ? JSON.stringify(params.metadata) : null,
      ],
    );
  }
}

function toSqlDate(date: Date): string {
  return date.toISOString();
}
