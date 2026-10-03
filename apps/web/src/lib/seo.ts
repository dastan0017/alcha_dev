import type { Metadata } from 'next';
import type { Locale } from '@alcha/shared';
import { env, SITE_NAME } from './env';

const OG_LOCALE: Record<Locale, string> = { ru: 'ru_RU', en: 'en_US' };

/** Locale-aware path: RU lives at root, EN under /en (matches localePrefix). */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path === '/' ? '' : path;
  return locale === 'ru' ? `/${clean.replace(/^\//, '')}` : `/en${clean}`;
}

export function absoluteUrl(path: string): string {
  const p = path === '' ? '/' : path;
  return `${env.siteUrl}${p}`;
}

const BRAND_SUFFIX = ` | ${SITE_NAME}`;

/**
 * Titles written in the CMS (`seoTitle`) often leave the brand out, and the layout
 * template can't add it to an absolute title — so it is appended here unless the
 * title already names the site.
 */
export function withBrand(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return SITE_NAME;
  return trimmed.toLowerCase().includes(SITE_NAME) ? trimmed : `${trimmed}${BRAND_SUFFIX}`;
}

export function buildMetadata(input: {
  title: string;
  description: string;
  keywords?: string[];
  path: string;
  locale: Locale;
  ogImageUrl?: string | null;
}): Metadata {
  const { description, keywords, path, locale, ogImageUrl } = input;
  const title = withBrand(input.title);

  const canonical = absoluteUrl(localizedPath(path, locale));
  const languages: Record<string, string> = {
    ru: absoluteUrl(localizedPath(path, 'ru')),
    en: absoluteUrl(localizedPath(path, 'en')),
    'x-default': absoluteUrl(localizedPath(path, 'ru')),
  };

  const ogImage =
    ogImageUrl ||
    // The card already draws the brand, so it gets the bare title.
    `${env.siteUrl}/api/og?title=${encodeURIComponent(input.title.trim() || SITE_NAME)}&locale=${locale}`;

  return {
    title: { absolute: title },
    description: description || undefined,
    keywords: keywords && keywords.length ? keywords : undefined,
    alternates: { canonical, languages },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      url: canonical,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}
