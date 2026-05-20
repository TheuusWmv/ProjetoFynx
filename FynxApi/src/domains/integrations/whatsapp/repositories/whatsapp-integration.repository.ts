import database from '../../../../infrastructure/database/database.js';
import type { WhatsappContextRef, WhatsappMessageEvent } from '../whatsapp.types.js';

export class WhatsappIntegrationRepository {
  static async createContextRef(params: {
    userId: number;
    phoneHash: string;
    contextHash: string;
    expiresAt: Date;
  }): Promise<WhatsappContextRef> {
    const result = await database.run(
      `INSERT INTO whatsapp_context_refs (user_id, phone_hash, context_hash, expires_at)
       VALUES (?, ?, ?, ?)`,
      [params.userId, params.phoneHash, params.contextHash, toSqlDate(params.expiresAt)],
    );

    return database.get('SELECT * FROM whatsapp_context_refs WHERE id = ?', [
      result.lastID,
    ]) as Promise<WhatsappContextRef>;
  }

  static findContextRefByHash(contextHash: string): Promise<WhatsappContextRef | undefined> {
    return database.get(
      `SELECT * FROM whatsapp_context_refs
       WHERE context_hash = ? AND revoked_at IS NULL
       LIMIT 1`,
      [contextHash],
    ) as Promise<WhatsappContextRef | undefined>;
  }

  static async touchContextRef(id: number): Promise<void> {
    await database.run('UPDATE whatsapp_context_refs SET used_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }

  static findMessageEventByProviderId(providerMessageId: string): Promise<WhatsappMessageEvent | undefined> {
    return database.get(
      `SELECT * FROM whatsapp_message_events
       WHERE provider_message_id = ?
       LIMIT 1`,
      [providerMessageId],
    ) as Promise<WhatsappMessageEvent | undefined>;
  }

  static async createMessageEvent(params: {
    userId?: number;
    contextRefId?: number;
    providerMessageId?: string;
    actionType: string;
    requestPayload?: unknown;
  }): Promise<WhatsappMessageEvent> {
    const result = await database.run(
      `INSERT INTO whatsapp_message_events (
        user_id, context_ref_id, provider_message_id, action_type, status, request_payload
      ) VALUES (?, ?, ?, ?, 'processing', ?)`,
      [
        params.userId ?? null,
        params.contextRefId ?? null,
        params.providerMessageId ?? null,
        params.actionType,
        stringifyJson(params.requestPayload),
      ],
    );

    return database.get('SELECT * FROM whatsapp_message_events WHERE id = ?', [
      result.lastID,
    ]) as Promise<WhatsappMessageEvent>;
  }

  static async markMessageEventSuccess(id: number, responsePayload: unknown): Promise<void> {
    await database.run(
      `UPDATE whatsapp_message_events
       SET status = 'success', response_payload = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [stringifyJson(responsePayload), id],
    );
  }

  static async markMessageEventFailed(id: number, code: string, message: string): Promise<void> {
    await database.run(
      `UPDATE whatsapp_message_events
       SET status = 'failed', error_code = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [code, message, id],
    );
  }

  static parseResponsePayload(event: WhatsappMessageEvent): unknown {
    if (!event.response_payload) return null;
    try {
      return JSON.parse(event.response_payload);
    } catch {
      return event.response_payload;
    }
  }
}

function stringifyJson(value: unknown): string | null {
  if (value === undefined) return null;
  return JSON.stringify(value);
}

function toSqlDate(date: Date): string {
  return date.toISOString();
}
