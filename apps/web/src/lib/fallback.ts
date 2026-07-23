import type { AboutResponse, HomeResponse, Locale, SiteSettings } from '@alcha/shared';

/**
 * Safe empty content so `next build` never hard-fails if the API is briefly
 * unreachable at build time. At runtime, ISR revalidation fills real content in.
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
      heroBullets: [],
      heroNote: '',
      heroCtaPrimary: '',
      heroCtaSecondary: '',
      trustLine: '',
      servicesEyebrow: '',
      servicesHeading: '',
      servicesLede: '',
      servicesSecondaryLabel: '',
      worksHeading: '',
      pricingHeading: '',
      pricingNote: '',
      ctaTitle: '',
      ctaSubtitle: '',
      ctaTelegramLabel: '',
      ctaCvLabel: '',
    },
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
    experiences: [],
    projects: [],
    stack: [],
    hobbies: [],
    cta: { title: '', subtitle: '', telegramLabel: '', cvLabel: '' },
    settings: EMPTY_SETTINGS,
    seo: { page: 'about', locale, title: '', description: '', keywords: [], ogImageUrl: null },
  };
}
