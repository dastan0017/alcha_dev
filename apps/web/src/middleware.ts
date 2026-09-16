import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { isLocale } from '@alcha/shared';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const LOCALE_PREFIX = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`);

/**
 * `?preview=<token>[&locale=]` on any page (docs/visual-editor.md D2) goes through
 * /api/preview, which enables draft mode and lands on the clean localized path.
 */
function previewRedirect(request: NextRequest, token: string): NextResponse {
  const { pathname, searchParams } = request.nextUrl;
  const prefix = LOCALE_PREFIX.exec(pathname);
  const requested = searchParams.get('locale');
  const locale = isLocale(requested) ? requested : (prefix?.[1] ?? routing.defaultLocale);
  // '' for the root, so it reads `/` and `/en` rather than `/en/`.
  const rest = (prefix ? pathname.slice(prefix[0].length) : pathname).replace(/^\/$/, '');
  const localized = locale === routing.defaultLocale ? rest || '/' : `/${locale}${rest}`;

  const query = new URLSearchParams(searchParams);
  query.delete('preview');
  query.delete('locale');
  const search = query.toString();

  const url = request.nextUrl.clone();
  url.pathname = '/api/preview';
  url.search = new URLSearchParams({
    token,
    path: search ? `${localized}?${search}` : localized,
  }).toString();
  return NextResponse.redirect(url, 307);
}

export default function middleware(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('preview');
  return token ? previewRedirect(request, token) : intlMiddleware(request);
}

export const config = {
  // Skip API routes, Next internals and files with an extension.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
