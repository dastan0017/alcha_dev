import { Injectable, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RevalidateService {
  private readonly logger = new Logger(RevalidateService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * POST the affected cache tags to the web app's /api/revalidate endpoint.
   * Retries up to 3 times with linear backoff; never throws (publish should
   * still succeed even if the web app is briefly unreachable).
   */
  async revalidate(tags: string[]): Promise<boolean> {
    if (tags.length === 0) {
      return true;
    }
    const webUrl = this.config.getOrThrow<string>('WEB_URL').replace(/\/+$/, '');
    const url = `${webUrl}/api/revalidate`;
    const secret = this.config.getOrThrow<string>('REVALIDATE_SECRET');
    const body = JSON.stringify({ tags });

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
          body,
          // Without this, undici's 300s default means a web app that accepts the
          // connection but never answers pins a publish request for ~15 minutes.
          signal: AbortSignal.timeout(5_000),
        });
        if (res.ok) {
          this.logger.log(`Revalidated tags [${tags.join(', ')}]`);
          return true;
        }
        this.logger.warn(`Revalidate attempt ${attempt} failed with HTTP ${res.status}`);
      } catch (error) {
        this.logger.warn(`Revalidate attempt ${attempt} errored: ${String(error)}`);
      }
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 300));
      }
    }

    this.logger.error(`Failed to revalidate tags after 3 attempts: [${tags.join(', ')}]`);
    return false;
  }
}

@Module({
  providers: [RevalidateService],
  exports: [RevalidateService],
})
export class RevalidateModule {}
