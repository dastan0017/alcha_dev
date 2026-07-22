import { Injectable, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly config: ConfigService) {}

  /** Sends an HTML message to the configured chat. No-op if env is not set. */
  async notify(text: string): Promise<void> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID');
    if (!token || !chatId) {
      return;
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      });
      if (!res.ok) {
        this.logger.warn(`Telegram notify failed with HTTP ${res.status}`);
      }
    } catch (error) {
      this.logger.warn(`Telegram notify errored: ${String(error)}`);
    }
  }
}

@Module({
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
