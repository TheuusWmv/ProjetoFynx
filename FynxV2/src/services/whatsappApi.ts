import { api } from "./api";

export type WhatsappAccountStatus = "pending" | "verified" | "revoked";

export interface WhatsappAccount {
  id: number;
  phoneMasked: string;
  status: WhatsappAccountStatus;
  verifiedAt: string | null;
  createdAt: string;
}

export interface RequestVerificationResponse {
  status: "otp_sent";
  phoneMasked: string;
  expiresInSeconds: number;
  retryAfterSeconds: number;
  sendCount: number;
}

export interface ConfirmVerificationResponse {
  status: "verified";
  phoneMasked: string;
}

export const whatsappApi = {
  async listAccounts(): Promise<WhatsappAccount[]> {
    const response = await api.get<{ accounts: WhatsappAccount[] }>("/whatsapp/accounts");
    return response.data.accounts;
  },

  async requestVerification(phone: string): Promise<RequestVerificationResponse> {
    const response = await api.post<RequestVerificationResponse>("/whatsapp/accounts/request-verification", { phone });
    return response.data;
  },

  async confirmVerification(phone: string, code: string): Promise<ConfirmVerificationResponse> {
    const response = await api.post<ConfirmVerificationResponse>("/whatsapp/accounts/confirm-verification", {
      phone,
      code,
    });
    return response.data;
  },

  async revokeAccount(accountId: number): Promise<void> {
    await api.delete(`/whatsapp/accounts/${accountId}`);
  },
};
