export type WhatsappAccountStatus = 'pending' | 'verified' | 'revoked';
export type WhatsappOtpStatus = 'pending' | 'used' | 'expired' | 'blocked';

export interface WhatsappAccount {
  id: number;
  user_id: number;
  phone_hash: string;
  phone_masked: string;
  status: WhatsappAccountStatus;
  verified_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsappOtpChallenge {
  id: number;
  user_id: number;
  phone_hash: string;
  code_hash: string;
  status: WhatsappOtpStatus;
  attempts: number;
  send_count: number;
  expires_at: string;
  last_sent_at: string;
  next_resend_at: string;
  created_at: string;
  used_at: string | null;
}

export interface PublicWhatsappAccount {
  id: number;
  phoneMasked: string;
  status: WhatsappAccountStatus;
  verifiedAt: string | null;
  createdAt: string;
}

export interface WhatsappContextRef {
  id: number;
  user_id: number;
  phone_hash: string;
  context_hash: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface WhatsappMessageEvent {
  id: number;
  user_id: number | null;
  context_ref_id: number | null;
  provider_message_id: string | null;
  action_type: string;
  status: 'processing' | 'success' | 'failed' | 'duplicate';
  request_payload: string | null;
  response_payload: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
