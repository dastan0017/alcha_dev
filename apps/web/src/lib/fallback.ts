import type { AboutResponse, HomeResponse, Locale, SiteSettings } from '@alcha/shared';

/**
 * Safe empty content so `next build` never hard-fails if the API is briefly
 * unreachable at build time. At runtime, ISR revalidation fills real content in.
 * Chrome labels fall back to the seeded DEFAULT_CHROME instead (lib/content.ts).
 */
export const EMPTY_SETTINGS: SiteSettings = {
  email: '',
  telegram: '',
  whatsapp: '',
  github: '',
  linkedin: '',
  instagram: '',
  cvUrl: '',
  addressLocality: 'Bishkek',
  addressRegion: '',
  addressCountry: 'KG',
  priceRange: '$300+',
  gaId: null,
  yandexMetrikaId: null,
};

export function emptyHome(locale: Locale): HomeResponse {
  return {
    content: {
      eyebrow: '',
      heroTitle: '',
      heroSubtitle: '',
      heroSubtitleMobile: '',
      heroBullets: [],
      heroNote: '',
      heroCtaPrimary: '',
      heroCtaSecondary: '',
      servicesEyebrow: '',
      servicesHeading: '',
      servicesLede: '',
      servicesSecondaryLabel: '',
      worksEyebrow: '',
      worksHeading: '',
      worksLede: '',
      worksLinkLabel: '',
      pricingEyebrow: '',
      pricingHeading: '',
      pricingNote: '',
      pricingFootnote: '',
      ctaTitle: '',
      ctaSubtitle: '',
      ctaTelegramLabel: '',
      ctaCvLabel: '',
    },
    hiddenSections: [],
    services: [],
    projects: [],
    pricingPlans: [],
    settings: EMPTY_SETTINGS,
    seo: { page: 'home', locale, title: '', description: '', keywords: [], ogImageUrl: null },
  };
}

export function emptyAbout(locale: Locale): AboutResponse {
  return {
    profile: {
      name: '',
      photoUrl: null,
      photoCaption: '',
      bioHtml: '',
      experienceHeading: '',
      projectsHeading: '',
      stackHeading: '',
      hobbiesHeading: '',
    },
    hiddenSections: [],
    experiences: [],
    projects: [],
    stack: [],
    hobbies: [],
    cta: { title: '', subtitle: '', telegramLabel: '', cvLabel: '' },
    settings: EMPTY_SETTINGS,
    seo: { page: 'about', locale, title: '', description: '', keywords: [], ogImageUrl: null },
  };
}
