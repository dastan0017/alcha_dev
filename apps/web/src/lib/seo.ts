import type { Metadata } from 'next';
import type { Locale } from '@alcha/shared';
import { env, SITE_NAME } from './env';

const OG_LOCALE: Record<Locale, string> = { ru: 'ru_RU', en: 'en_US' };

/** Locale-aware path: RU lives at root, EN under /en (matches localePrefix). */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path === '/' ? '' : path;
  return locale === 'ru' ? `/${clean.replace(/^\//, '')}` : `/en${clean}`;
}

function abs(path: string): string {
  const p = path === '' ? '/' : path;
  return `${env.siteUrl}${p}`;
}

export function buildMetadata(input: {
  title: string;
  description: string;
  keywords?: string[];
  path: string;
  locale: Locale;
  ogImageUrl?: string | null;
}): Metadata {
  const { title, description, keywords, path, locale, ogImageUrl } = input;

  const canonical = abs(localizedPath(path, locale));
  const languages: Record<string, string> = {
    ru: abs(localizedPath(path, 'ru')),
    en: abs(localizedPath(path, 'en')),
    'x-default': abs(localizedPath(path, 'ru')),
  };

  const ogImage =
    ogImageUrl ||
    `${env.siteUrl}/api/og?title=${encodeURIComponent(title)}&locale=${locale}`;

  return {
    title: title ? { absolute: title } : undefined,
    description: description || undefined,
    keywords: keywords && keywords.length ? keywords : undefined,
    alternates: { canonical, languages },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      url: canonical,
      title: title || SITE_NAME,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title || SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: title || SITE_NAME,
      description,
      images: [ogImage],
    },
  };
}
