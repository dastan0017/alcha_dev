import { cache } from 'react';
import {
  ApiError,
  DEFAULT_CHROME,
  type AboutResponse,
  type HomeResponse,
  type Locale,
  type Project,
  type SiteChrome,
  type SiteSettings,
} from '@alcha/shared';
import { api } from './api';
import { emptyAbout, emptyHome, EMPTY_SETTINGS } from './fallback';
import { getPreview } from './preview';

function warn(scope: string, error: unknown): void {
  console.warn(`[content] ${scope} fetch failed — using fallback:`, error);
}

/**
 * The draft read in draft mode (preview token, no-store); `undefined` when preview
 * is off or the draft read failed, so callers fall through to the published read.
 */
async function readDraft<T>(scope: string, read: (token: string) => Promise<T>): Promise<T | undefined> {
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
    return await api.getHome(locale);
  } catch (error) {
    warn('home', error);
    return emptyHome(locale);
  }
});

export const getAbout = cache(async (locale: Locale): Promise<AboutResponse> => {
  const draft = await readDraft('about', (token) => api.getDraftAbout(locale, token));
  if (draft !== undefined) return draft;
  try {
    return await api.getAbout(locale);
  } catch (error) {
    warn('about', error);
    return emptyAbout(locale);
  }
});

/** Nav, footer and button labels (docs/visual-editor.md D4). */
export const getChrome = cache(async (locale: Locale): Promise<SiteChrome> => {
  const draft = await readDraft('chrome', (token) => api.getDraftChrome(locale, token));
  if (draft !== undefined) return draft;
  try {
    return await api.getChrome(locale);
  } catch (error) {
    warn('chrome', error);
    // Seeded labels, never blanks: an ISR page rendered during an outage keeps its nav and buttons.
    return DEFAULT_CHROME[locale];
  }
});

/** Published only: feeds the sitemap and generateStaticParams. */
export const getSettings = cache(async (locale: Locale): Promise<SiteSettings> => {
  try {
    return await api.getSettings(locale);
  } catch (error) {
    warn('settings', error);
    return EMPTY_SETTINGS;
  }
});

/** Published only: feeds the sitemap and generateStaticParams. */
export const getProjects = cache(async (locale: Locale): Promise<Project[]> => {
  try {
    return await api.getProjects(locale);
  } catch (error) {
    warn('projects', error);
    return [];
  }
});

export const getProject = cache(
  async (slug: string, locale: Locale): Promise<Project | null> => {
    // A slug the draft does not have is a 404 in preview, not a reason to show the published page.
    const draft = await readDraft('project', (token) =>
      api.getDraftProject(slug, locale, token).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }),
    );
    if (draft !== undefined) return draft;
    try {
      return await api.getProject(slug, locale);
    } catch {
      return null;
    }
  },
);
