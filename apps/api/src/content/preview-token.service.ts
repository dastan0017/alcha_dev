import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { createHmac } from 'node:crypto';
import type { DraftVerifyResponse, PreviewTokenResponse } from '@alcha/shared';

/** `@nestjs/jwt` types expiresIn as ms `StringValue`; env values are plain strings. */
type ExpiresIn = JwtSignOptions['expiresIn'];

interface PreviewClaims {
  sub: string;
  exp: number;
}

const PREVIEW_AUDIENCE = 'alcha-preview';

const expiresAt = ({ exp }: PreviewClaims) => new Date(exp * 1000).toISOString();

/**
 * Tokens that let the web render the draft (docs/visual-editor.md §3). They are signed
 * with a secret derived from JWT_SECRET, so a preview token never passes the admin
 * JwtAuthGuard and an admin access token never passes as a preview token.
 */
@Injectable()
export class PreviewTokenService {
  private readonly secret: string;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.secret = createHmac('sha256', config.getOrThrow<string>('JWT_SECRET'))
      .update(PREVIEW_AUDIENCE)
      .digest('hex');
  }

  async issue(userId: string): Promise<PreviewTokenResponse> {
    const token = await this.jwt.signAsync(
      { sub: userId },
      {
        secret: this.secret,
        audience: PREVIEW_AUDIENCE,
        expiresIn: this.config.get<string>('PREVIEW_TOKEN_TTL', '2h') as unknown as ExpiresIn,
      },
    );
    return { token, expiresAt: expiresAt(this.jwt.decode<PreviewClaims>(token)) };
  }

  /** Throws 401 for anything but a live preview token. */
  async verify(token: string): Promise<DraftVerifyResponse> {
    try {
      const claims = await this.jwt.verifyAsync<PreviewClaims>(token, {
        secret: this.secret,
        audience: PREVIEW_AUDIENCE,
      });
      return { expiresAt: expiresAt(claims) };
    } catch {
      throw new UnauthorizedException('Invalid preview token');
    }
  }
}
