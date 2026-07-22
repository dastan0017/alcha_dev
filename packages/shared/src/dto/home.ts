import { z } from 'zod';
import { translatedSchema } from './common';

/**
 * Editorial singleton holding the homepage hero, section headings and the dark
 * CTA banner (the banner is reused verbatim at the bottom of the About page).
 */
export const homeContentSchema = z.object({
  eyebrow: z.string(),
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  heroCtaPrimary: z.string(),
  heroCtaSecondary: z.string(),
  trustLine: z.string(),
  servicesHeading: z.string(),
  worksHeading: z.string(),
  pricingHeading: z.string(),
  pricingNote: z.string(),
  ctaTitle: z.string(),
  ctaSubtitle: z.string(),
  ctaTelegramLabel: z.string(),
  ctaCvLabel: z.string(),
});
export type HomeContent = z.infer<typeof homeContentSchema>;

export const homeContentTranslationInput = homeContentSchema;

export const homeContentUpdateSchema = z.object({
  translations: translatedSchema(homeContentTranslationInput),
});
export type HomeContentUpdate = z.infer<typeof homeContentUpdateSchema>;
