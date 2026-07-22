import { cache } from 'react';
import type { AboutResponse, HomeResponse, Locale, Project, SiteSettings } from '@alcha/shared';
import { api } from './api';
import { emptyAbout, emptyHome, EMPTY_SETTINGS } from './fallback';

function warn(scope: string, error: unknown): void {
  console.warn(`[content] ${scope} fetch failed — using fallback:`, error);
}

/** React.cache dedupes these across generateMetadata + the page render. */
export const getHome = cache(async (locale: Locale): Promise<HomeResponse> => {
  try {
    return await api.getHome(locale);
  } catch (error) {
    warn('home', error);
    return emptyHome(locale);
  }
});

export const getAbout = cache(async (locale: Locale): Promise<AboutResponse> => {
  try {
    return await api.getAbout(locale);
  } catch (error) {
    warn('about', error);
    return emptyAbout(locale);
  }
});

export const getSettings = cache(async (locale: Locale): Promise<SiteSettings> => {
  try {
    return await api.getSettings(locale);
  } catch (error) {
    warn('settings', error);
    return EMPTY_SETTINGS;
  }
});

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
    try {
      return await api.getProject(slug, locale);
    } catch {
      return null;
    }
  },
);
