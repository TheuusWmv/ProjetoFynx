import { whatsappConfig } from '../config/whatsapp.config.js';

export class EvolutionApiClient {
  static async sendText(number: string, text: string): Promise<void> {
    if (whatsappConfig.evolution.mock) {
      console.log('[EvolutionApiClient] Mock sendText', {
        number: maskNumber(number),
        instance: whatsappConfig.evolution.instanceName,
      });
      return;
    }

    if (!whatsappConfig.evolution.apiKey) {
      throw new Error('EVOLUTION_API_KEY is required when EVOLUTION_API_MOCK is false');
    }

    const baseUrl = whatsappConfig.evolution.baseUrl.replace(/\/$/, '');
    const url = `${baseUrl}/message/sendText/${encodeURIComponent(whatsappConfig.evolution.instanceName)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), whatsappConfig.evolution.timeoutMs);

    try {
      console.log('[EvolutionApiClient] Sending WhatsApp text', {
        url,
        number: maskNumber(number),
        instance: whatsappConfig.evolution.instanceName,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: whatsappConfig.evolution.apiKey,
        },
        body: JSON.stringify({
          number,
          text,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Evolution API sendText failed with ${response.status}: ${body.slice(0, 300)}`);
      }

      console.log('[EvolutionApiClient] WhatsApp text sent', {
        status: response.status,
        number: maskNumber(number),
      });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(`Evolution API sendText timed out after ${whatsappConfig.evolution.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  static async sendImage(number: string, base64Image: string, caption?: string): Promise<void> {
    if (whatsappConfig.evolution.mock) {
      console.log('[EvolutionApiClient] Mock sendImage', {
        number: maskNumber(number),
        instance: whatsappConfig.evolution.instanceName,
        caption,
        hasImage: !!base64Image,
      });
      return;
    }

    if (!whatsappConfig.evolution.apiKey) {
      throw new Error('EVOLUTION_API_KEY is required when EVOLUTION_API_MOCK is false');
    }

    const baseUrl = whatsappConfig.evolution.baseUrl.replace(/\/$/, '');
    const url = `${baseUrl}/message/sendMedia/${encodeURIComponent(whatsappConfig.evolution.instanceName)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), whatsappConfig.evolution.timeoutMs);

    const mediaData = base64Image.startsWith('data:') 
      ? base64Image.split(',')[1] || ''
      : base64Image;

    try {
      console.log('[EvolutionApiClient] Sending WhatsApp image/media', {
        url,
        number: maskNumber(number),
        instance: whatsappConfig.evolution.instanceName,
        caption,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: whatsappConfig.evolution.apiKey,
        },
        body: JSON.stringify({
          number,
          mediatype: 'image',
          mimetype: 'image/png',
          media: mediaData,
          fileName: 'dashboard.png',
          caption: caption || '',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Evolution API sendMedia failed with ${response.status}: ${body.slice(0, 300)}`);
      }

      console.log('[EvolutionApiClient] WhatsApp image/media sent', {
        status: response.status,
        number: maskNumber(number),
      });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(`Evolution API sendMedia timed out after ${whatsappConfig.evolution.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function maskNumber(number: string): string {
  if (number.length <= 4) return '****';
  return `${number.slice(0, 4)}*****${number.slice(-4)}`;
}

