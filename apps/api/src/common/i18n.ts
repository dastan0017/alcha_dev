import type { Locale } from '@alcha/shared';
import { DEFAULT_LOCALE } from '@alcha/shared';

interface HasLocale {
  locale: Locale;
}

/**
 * Pick a translation row for `locale`, falling back to the default locale (RU)
 * and then the first available translation. Seeded content always has both.
 */
export function pickTranslation<T extends HasLocale>(translations: T[], locale: Locale): T {
  const found =
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === DEFAULT_LOCALE) ??
    translations[0];
  if (!found) {
    throw new Error('Content is missing translations');
  }
  return found;
}

export function findTranslation<T extends HasLocale>(
  translations: T[],
  locale: Locale,
): T | undefined {
  return translations.find((t) => t.locale === locale);
}

export const LOCALES_TUPLE = ['ru', 'en'] as const satisfies readonly Locale[];
