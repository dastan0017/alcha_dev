import { cache } from 'react';
import {
  ApiError,
  DEFAULT_CHROME,
  type HomeResponse,
  type Locale,
  type Project,
  type SiteChrome,
  type SiteSettings,
} from '@alcha/shared';
import { api } from './api';
import { emptyHome, EMPTY_SETTINGS } from './fallback';
import { getPreview } from './preview';

/**
 * `next build` must never hard-fail on an API outage — it falls back to blank copy so
 * the build still produces a site. At RUNTIME the opposite is true: returning blanks
 * makes the render *succeed*, so Next writes that empty HTML into the incremental cache
 * and serves it for a full `revalidate` hour. Rethrowing instead makes Next keep the
 * previously cached (good) page, which is what we want during a blip.
 */
const IS_BUILD = process.env.NEXT_PHASE === 'phase-production-build';

/** Server-side reads should not inherit undici's 300s default on a 2 vCPU box. */
const READ_TIMEOUT_MS = 5_000;
const opts = (): { signal: AbortSignal } => ({ signal: AbortSignal.timeout(READ_TIMEOUT_MS) });

function warn(scope: string, error: unknown): void {
  console.warn(`[content] ${scope} fetch failed — using fallback:`, error);
}

/** Blank copy is acceptable output for a build, never for a live revalidation. */
function fallbackOrRethrow<T>(scope: string, error: unknown, fallback: () => T): T {
  warn(scope, error);
  if (!IS_BUILD) throw error;
  return fallback();
}

/**
 * The draft read in draft mode (preview token, no-store); `undefined` when preview
 * is off or the draft read failed, so callers fall through to the published read.
 */
async function readDraft<T>(
  scope: string,
  read: (token: string) => Promise<T>,
): Promise<T | undefined> {
  const { enabled, token } = await getPreview();
  if (!enabled || !token) return undefined;
  try {
    return await read(token);
  } catch (error) {
    console.warn(`[content] draft ${scope} fetch failed — using published content:`, error);
    return undefined;
  }
}

/** React.cache dedupes these across generateMetadata + the page render. */
export const getHome = cache(async (locale: Locale): Promise<HomeResponse> => {
  const draft = await readDraft('home', (token) => api.getDraftHome(locale, token));
  if (draft !== undefined) return draft;
  try {
    return await api.getHome(locale, opts());
  } catch (error) {
    return fallbackOrRethrow('home', error, () => emptyHome(locale));
  }
});

/** Nav, footer and button labels (docs/visual-editor.md D4). */
export const getChrome = cache(async (locale: Locale): Promise<SiteChrome> => {
  const draft = await readDraft('chrome', (token) => api.getDraftChrome(locale, token));
  if (draft !== undefined) return draft;
  try {
    return await api.getChrome(locale, opts());
  } catch (error) {
    warn('chrome', error);
    // Safe to keep as a fallback at runtime too: these are real seeded labels, not blanks,
    // so an ISR page rendered during an outage keeps a usable nav and buttons.
    return DEFAULT_CHROME[locale];
  }
});

/** Published only: feeds the sitemap and generateStaticParams. */
export const getSettings = cache(async (locale: Locale): Promise<SiteSettings> => {
  try {
    return await api.getSettings(locale, opts());
  } catch (error) {
    return fallbackOrRethrow('settings', error, () => EMPTY_SETTINGS);
  }
});

/** Published only: feeds the sitemap and generateStaticParams. */
export const getProjects = cache(async (locale: Locale): Promise<Project[]> => {
  try {
    return await api.getProjects(locale, opts());
  } catch (error) {
    return fallbackOrRethrow('projects', error, () => []);
  }
});

export const getProject = cache(async (slug: string, locale: Locale): Promise<Project | null> => {
  // A slug the draft does not have is a 404 in preview, not a reason to show the published page.
  const draft = await readDraft('project', (token) =>
    api.getDraftProject(slug, locale, token).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }),
  );
  if (draft !== undefined) return draft;
  try {
    return await api.getProject(slug, locale, opts());
  } catch (error) {
    // A genuine 404 means the slug does not exist — notFound() is correct.
    // Anything else is an outage, and returning null would cache a 404 for an hour.
    if (error instanceof ApiError && error.status === 404) return null;
    return fallbackOrRethrow('project', error, () => null);
  }
});
