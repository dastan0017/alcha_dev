import { z } from 'zod';

/** Editorial singleton holding the homepage hero, section headings and the dark CTA banner. */
export const homeContentSchema = z.object({
  eyebrow: z.string(),
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  /** Shorter hero lead rendered instead of `heroSubtitle` on phones (may be blank). */
  heroSubtitleMobile: z.string(),
  /** Short benefit bullets rendered under the hero subtitle. */
  heroBullets: z.array(z.string()),
  /** Closing price / timeline line under the bullets. */
  heroNote: z.string(),
  heroCtaPrimary: z.string(),
  heroCtaSecondary: z.string(),
  /** Small label above the services heading, e.g. "УСЛУГИ". */
  servicesEyebrow: z.string(),
  servicesHeading: z.string(),
  /** Intro paragraph under the services heading. */
  servicesLede: z.string(),
  /** Divider label above the supporting service cards. */
  servicesSecondaryLabel: z.string(),
  /** Small label above the works heading, e.g. "РАБОТЫ". */
  worksEyebrow: z.string(),
  worksHeading: z.string(),
  /** Intro paragraph under the works heading. */
  worksLede: z.string(),
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
  ctaWhatsappLabel: z.string(),
});
export type HomeContent = z.infer<typeof homeContentSchema>;
