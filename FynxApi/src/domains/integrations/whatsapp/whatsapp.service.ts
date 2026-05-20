import crypto from 'crypto';
import database from '../../../infrastructure/database/database.js';
import { EvolutionApiClient } from './clients/evolution-api.client.js';
import { whatsappConfig } from './config/whatsapp.config.js';
import { OtpService } from './otp.service.js';
import { UserWhatsappRepository } from './repositories/user-whatsapp.repository.js';
import type { PublicWhatsappAccount, WhatsappAccount } from './whatsapp.types.js';

export class WhatsappDomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export class WhatsappService {
  static async listAccounts(userId: number): Promise<PublicWhatsappAccount[]> {
    const accounts = await UserWhatsappRepository.findAccountsByUser(userId);
    return accounts.map(toPublicAccount);
  }

  static async requestVerification(userId: number, phone: string) {
    const normalizedPhone = normalizeWhatsappPhone(phone);
    const phoneHash = hashWhatsappPhone(normalizedPhone);
    const phoneMasked = maskWhatsappPhone(normalizedPhone);
    const now = new Date();

    const verifiedAccount = await UserWhatsappRepository.findVerifiedAccountByPhoneHash(phoneHash);
    if (verifiedAccount && verifiedAccount.user_id !== userId) {
      throw new WhatsappDomainError(
        'WHATSAPP_PHONE_ALREADY_LINKED',
        'Este numero ja esta vinculado a outra conta.',
        409,
      );
    }

    const pendingChallenge = await UserWhatsappRepository.findLatestPendingChallenge(userId, phoneHash);
    if (pendingChallenge) {
      const nextResendAt = new Date(pendingChallenge.next_resend_at);
      if (nextResendAt.getTime() > now.getTime()) {
        throw new WhatsappDomainError('WHATSAPP_OTP_COOLDOWN', 'Aguarde antes de solicitar um novo codigo.', 429, {
          retryAfterSeconds: secondsUntil(nextResendAt, now),
          phoneMasked,
        });
      }
    }

    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const hourly = await UserWhatsappRepository.countChallengesSince(userId, phoneHash, hourAgo);
    const daily = await UserWhatsappRepository.countUserChallengesSince(userId, dayAgo);

    if (hourly.count >= whatsappConfig.otp.maxSendsPerHour || daily.count >= whatsappConfig.otp.maxSendsPerDay) {
      throw new WhatsappDomainError('WHATSAPP_OTP_RATE_LIMITED', 'Muitas solicitacoes de codigo.', 429, {
        retryAfterSeconds: 3600,
      });
    }

    const previousSendCount = pendingChallenge?.send_count ?? 0;
    const sendCount = previousSendCount + 1;
    const cooldownSeconds = OtpService.getCooldownSeconds(sendCount);
    const code = OtpService.generateCode();
    const codeHash = await OtpService.hashCode(code);
    const expiresAt = OtpService.getExpiresAt(now);
    const nextResendAt = new Date(now.getTime() + cooldownSeconds * 1000);

    const message = `Seu codigo de verificacao Fynx e: *${code}*\n\nEle expira em ${whatsappConfig.otp.ttlMinutes} minutos.`;

    await database.withTransaction(async () => {
      await UserWhatsappRepository.upsertPendingAccount(userId, phoneHash, phoneMasked);
      await UserWhatsappRepository.expirePendingChallenges(userId, phoneHash);
      await UserWhatsappRepository.createChallenge({
        userId,
        phoneHash,
        codeHash,
        sendCount,
        expiresAt,
        lastSentAt: now,
        nextResendAt,
      });
      await UserWhatsappRepository.createAuditLog({
        userId,
        phoneHash,
        eventType: 'otp_requested',
        status: 'created',
        metadata: { sendCount },
      });
    });

    try {
      await EvolutionApiClient.sendText(normalizedPhone, message);
      await UserWhatsappRepository.createAuditLog({
        userId,
        phoneHash,
        eventType: 'otp_sent',
        status: 'success',
        metadata: { sendCount },
      });
    } catch (error: any) {
      await UserWhatsappRepository.createAuditLog({
        userId,
        phoneHash,
        eventType: 'otp_sent',
        status: 'failed',
        metadata: { message: error.message },
      });
      throw new WhatsappDomainError('WHATSAPP_SEND_FAILED', 'Nao foi possivel enviar o codigo pelo WhatsApp.', 502);
    }

    return {
      status: 'otp_sent',
      phoneMasked,
      expiresInSeconds: whatsappConfig.otp.ttlMinutes * 60,
      retryAfterSeconds: cooldownSeconds,
      sendCount,
    };
  }

  static async confirmVerification(userId: number, phone: string, code: string) {
    const normalizedPhone = normalizeWhatsappPhone(phone);
    const phoneHash = hashWhatsappPhone(normalizedPhone);
    const phoneMasked = maskWhatsappPhone(normalizedPhone);
    const challenge = await UserWhatsappRepository.findLatestPendingChallenge(userId, phoneHash);

    if (!challenge) {
      throw new WhatsappDomainError(
        'WHATSAPP_OTP_EXPIRED',
        'Codigo expirado. Solicite um novo codigo de verificacao.',
        410,
      );
    }

    const now = new Date();
    if (new Date(challenge.expires_at).getTime() < now.getTime()) {
      await UserWhatsappRepository.markChallengeStatus(challenge.id, 'expired');
      throw new WhatsappDomainError(
        'WHATSAPP_OTP_EXPIRED',
        'Codigo expirado. Solicite um novo codigo de verificacao.',
        410,
      );
    }

    const isValid = await OtpService.verifyCode(code, challenge.code_hash);
    if (!isValid) {
      const attempts = challenge.attempts + 1;
      await UserWhatsappRepository.incrementChallengeAttempts(challenge.id, attempts);

      if (attempts >= whatsappConfig.otp.maxAttempts) {
        await UserWhatsappRepository.markChallengeStatus(challenge.id, 'blocked');
        throw new WhatsappDomainError(
          'WHATSAPP_OTP_ATTEMPTS_EXCEEDED',
          'Limite de tentativas excedido. Solicite um novo codigo.',
          429,
        );
      }

      throw new WhatsappDomainError('WHATSAPP_OTP_INVALID', 'Codigo de verificacao invalido.', 400, {
        remainingAttempts: whatsappConfig.otp.maxAttempts - attempts,
      });
    }

    await database.withTransaction(async () => {
      await UserWhatsappRepository.markChallengeStatus(challenge.id, 'used');
      await UserWhatsappRepository.markAccountVerified(userId, phoneHash);
      await UserWhatsappRepository.createAuditLog({
        userId,
        phoneHash,
        eventType: 'otp_confirmed',
        status: 'success',
      });
    });

    return {
      status: 'verified',
      phoneMasked,
    };
  }

  static async revokeAccount(userId: number, accountId: number) {
    const revoked = await UserWhatsappRepository.revokeAccount(userId, accountId);
    if (!revoked) {
      throw new WhatsappDomainError('WHATSAPP_ACCOUNT_NOT_FOUND', 'Numero nao encontrado.', 404);
    }
    return { status: 'revoked' };
  }
}

function toPublicAccount(account: WhatsappAccount): PublicWhatsappAccount {
  return {
    id: account.id,
    phoneMasked: account.phone_masked,
    status: account.status,
    verifiedAt: account.verified_at,
    createdAt: account.created_at,
  };
}

export function normalizeWhatsappPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const withoutLeadingZeros = digits.replace(/^0+/, '');
  const normalized = withoutLeadingZeros.startsWith('55') ? withoutLeadingZeros : `55${withoutLeadingZeros}`;

  if (!/^55\d{10,11}$/.test(normalized)) {
    throw new WhatsappDomainError('WHATSAPP_PHONE_INVALID', 'Informe um numero de WhatsApp valido com DDD.', 400);
  }

  return normalized;
}

export function hashWhatsappPhone(phone: string): string {
  if (!whatsappConfig.otp.phoneHashSecret) {
    throw new Error('WHATSAPP_PHONE_HASH_SECRET or JWT_SECRET is required');
  }

  return crypto.createHmac('sha256', whatsappConfig.otp.phoneHashSecret).update(phone).digest('hex');
}

export function maskWhatsappPhone(phone: string): string {
  const country = phone.slice(0, 2);
  const area = phone.slice(2, 4);
  const suffix = phone.slice(-4);
  return `+${country} (${area}) *****-${suffix}`;
}

function secondsUntil(target: Date, now: Date): number {
  return Math.max(1, Math.ceil((target.getTime() - now.getTime()) / 1000));
}
