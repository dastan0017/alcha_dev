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
  /** Short benefit bullets rendered under the hero subtitle. */
  heroBullets: z.array(z.string()),
  /** Closing price / timeline line under the bullets. */
  heroNote: z.string(),
  heroCtaPrimary: z.string(),
  heroCtaSecondary: z.string(),
  trustLine: z.string(),
  /** Small label above the services heading, e.g. "УСЛУГИ". */
  servicesEyebrow: z.string(),
  servicesHeading: z.string(),
  /** Intro paragraph under the services heading. */
  servicesLede: z.string(),
  /** Divider label above the supporting service cards. */
  servicesSecondaryLabel: z.string(),
  worksHeading: z.string(),
  /** Small label above the pricing heading, e.g. "ЦЕНЫ". */
  pricingEyebrow: z.string(),
  pricingHeading: z.string(),
  /** Sits beside the pricing heading. */
  pricingNote: z.string(),
  /** Instalment explanation under the pricing grid. */
  pricingFootnote: z.string(),
  ctaTitle: z.string(),
  ctaSubtitle: z.string(),
  ctaTelegramLabel: z.string(),
  ctaCvLabel: z.string(),
});
export type HomeContent = z.infer<typeof homeContentSchema>;

/**
 * Write shape: the optional hero extras default so the CRM can submit a form
 * with an empty bullets field without failing validation.
 */
export const homeContentTranslationInput = homeContentSchema.extend({
  heroBullets: z.array(z.string()).default([]),
  heroNote: z.string().default(''),
  servicesEyebrow: z.string().default(''),
  servicesLede: z.string().default(''),
  servicesSecondaryLabel: z.string().default(''),
  pricingEyebrow: z.string().default(''),
  pricingFootnote: z.string().default(''),
});

export const homeContentUpdateSchema = z.object({
  translations: translatedSchema(homeContentTranslationInput),
});
export type HomeContentUpdate = z.infer<typeof homeContentUpdateSchema>;
