/** Centralised env access. NEXT_PUBLIC_* values are inlined into the client bundle. */
export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  /** Server-side fetch base (internal network in prod). */
  apiInternalUrl:
    process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  revalidateSecret: process.env.REVALIDATE_SECRET ?? '',
  analytics: {
    gaId: process.env.NEXT_PUBLIC_GA_ID ?? '',
    yandexMetrikaId: process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID ?? '',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? '',
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ?? '',
  },
} as const;

export const SITE_NAME = 'alcha.dev';
