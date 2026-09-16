import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { DraftVerifyResponse } from '@alcha/shared';
import { PreviewTokenService } from './preview-token.service';

/** A request that passed PreviewTokenGuard. */
export type PreviewRequest = Request & { preview: DraftVerifyResponse };

/** Draft reads: `Authorization: Bearer <preview token>`. Pair with `@Public()`. */
@Injectable()
export class PreviewTokenGuard implements CanActivate {
  constructor(private readonly tokens: PreviewTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PreviewRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing preview token');
    }
    request.preview = await this.tokens.verify(token);
    return true;
  }
}
