export const LOCALES = ['ru', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

/** RU is the default locale and lives at the site root (`/`, `/about`). */
export const DEFAULT_LOCALE: Locale = 'ru';

export const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'RU',
  en: 'EN',
};

/** BCP-47 tags used for `<html lang>`, hreflang, and Open Graph `og:locale`. */
export const LOCALE_HREFLANG: Record<Locale, string> = {
  ru: 'ru',
  en: 'en',
};

export const LOCALE_OG: Record<Locale, string> = {
  ru: 'ru_RU',
  en: 'en_US',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function assertLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
