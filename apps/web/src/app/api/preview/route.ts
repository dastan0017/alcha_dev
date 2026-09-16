import { cookies, draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { api } from '@/lib/api';
import { clearPreview, PREVIEW_COOKIE } from '@/lib/preview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Control characters (browsers strip TAB/LF, so `/\t/host` becomes `//host`) and backslashes. */
const UNSAFE_PATH = /[\u0000-\u001f\u007f\\]/;

/** `path` as a same-origin pathname + search; `/` for anything else. */
function safePath(path: string | null, origin: string): string {
  if (!path || UNSAFE_PATH.test(path)) return '/';
  try {
    const url = new URL(path, origin);
    return url.origin === origin ? `${url.pathname}${url.search}` : '/';
  } catch {
    return '/';
  }
}

/**
 * Entry of the CRM preview (docs/visual-editor.md D2): verifies the token with the
 * API, enables draft mode, keeps the token for draft reads and lands on `path`.
 * `refresh=1` (the bridge's 'preview-token') only renews the cookie and answers 204.
 * Without a valid token a page entry lands on the published page, so a stray or
 * expired `?preview=` never shows visitors or crawlers an error.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token = searchParams.get('token');
  const refresh = searchParams.get('refresh') === '1';
  const verified = token ? await api.verifyPreviewToken(token).catch(() => null) : null;

  if (!token || !verified) {
    // TODO(dastan): a rejected renewal leaves the current cookies alone — they may still be
    // valid — and answers 401 to the bridge's fetch; only page entries clear stale ones.
    if (refresh) return new Response(null, { status: 401 });
    await clearPreview();
    redirect(safePath(searchParams.get('path'), origin));
  }

  (await draftMode()).enable();
  // Same attributes as Next's __prerender_bypass, so both cookies reach the CRM iframe.
  const development = process.env.NODE_ENV === 'development';
  (await cookies()).set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    path: '/',
    secure: !development,
    sameSite: development ? 'lax' : 'none',
    expires: new Date(verified.expiresAt),
  });
  if (refresh) return new Response(null, { status: 204 });
  redirect(safePath(searchParams.get('path'), origin));
}
