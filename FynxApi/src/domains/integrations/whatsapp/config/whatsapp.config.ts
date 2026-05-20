export const whatsappConfig = {
  otp: {
    ttlMinutes: Number(process.env.WHATSAPP_OTP_TTL_MINUTES || 10),
    maxAttempts: Number(process.env.WHATSAPP_OTP_MAX_ATTEMPTS || 5),
    baseResendCooldownSeconds: Number(process.env.WHATSAPP_OTP_BASE_RESEND_COOLDOWN_SECONDS || 60),
    maxSendsPerHour: Number(process.env.WHATSAPP_OTP_MAX_SENDS_PER_HOUR || 3),
    maxSendsPerDay: Number(process.env.WHATSAPP_OTP_MAX_SENDS_PER_DAY || 10),
    phoneHashSecret: process.env.WHATSAPP_PHONE_HASH_SECRET || process.env.JWT_SECRET || '',
  },
  evolution: {
    baseUrl: process.env.EVOLUTION_BASE_URL || process.env.EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: process.env.EVOLUTION_API_KEY || '',
    instanceName: process.env.EVOLUTION_INSTANCE_NAME || process.env.EVOLUTION_INSTANCE || 'FYNX_LOCAL',
    botNumber: process.env.EVOLUTION_BOT_NUMBER || '',
    mock: process.env.EVOLUTION_API_MOCK === 'true',
    timeoutMs: Number(process.env.EVOLUTION_API_TIMEOUT_MS || 10000),
  },
  serviceAuth: {
    token: process.env.N8N_SERVICE_TOKEN || '',
  },
  context: {
    secret: process.env.WHATSAPP_CONTEXT_SECRET || process.env.JWT_SECRET || '',
    ttlMinutes: Number(process.env.WHATSAPP_CONTEXT_TTL_MINUTES || 15),
  },
};
