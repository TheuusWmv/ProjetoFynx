import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { whatsappConfig } from './config/whatsapp.config.js';

export class OtpService {
  static generateCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  static hashCode(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
  }

  static verifyCode(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  static getExpiresAt(now = new Date()): Date {
    return new Date(now.getTime() + whatsappConfig.otp.ttlMinutes * 60 * 1000);
  }

  static getCooldownSeconds(sendCount: number): number {
    return whatsappConfig.otp.baseResendCooldownSeconds * Math.max(sendCount, 1);
  }
}
