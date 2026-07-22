import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES } from '@alcha/shared';

export const routing = defineRouting({
  locales: [...LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  // RU (default) lives at the root; EN is prefixed as /en.
  localePrefix: 'as-needed',
  // Never auto-redirect by IP / Accept-Language — bad for SEO crawlers.
  localeDetection: false,
});
