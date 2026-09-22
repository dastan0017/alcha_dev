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
  /** Small label above the process heading, e.g. "ПРОЦЕСС И УСЛУГИ". */
  processEyebrow: z.string(),
  processHeading: z.string(),
  /** Intro paragraph under the process heading. */
  processSubheading: z.string(),
  /** Timeline pill beside the heading, e.g. "ОТ 1 ДО 6 НЕДЕЛЬ". */
  processPill: z.string(),
  /** Label above each step's client contribution, e.g. "ОТ ВАС". */
  processFromLabel: z.string(),
  /** Label above each step's outcome, e.g. "РЕЗУЛЬТАТ". */
  processResultLabel: z.string(),
  /** Badge on the main step, e.g. "ГЛАВНОЕ". */
  processMainLabel: z.string(),
  /** Annotation under the main step: its mono label, e.g. "МОЯ ГЛАВНАЯ СИЛА"… */
  processAnnotationLabel: z.string(),
  /** …and its text. */
  processAnnotationText: z.string(),
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
