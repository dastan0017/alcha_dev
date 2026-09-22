import { z } from 'zod';

/** A «Цены» card (docs/visual-editor.md D17), fields in the order the card shows them. */
export const pricingPlanSchema = z.object({
  id: z.string(),
  sortOrder: z.number(),
  /** One plan at most: the purple frame, the primary button and the badge. */
  highlighted: z.boolean(),
  /** Tier label, e.g. «Лендинг» (rendered uppercase). */
  name: z.string(),
  /** «от $300»: the leading word is set apart from the figure. */
  priceLabel: z.string(),
  /** Timing only, e.g. «1–2 НЕДЕЛИ»; payment terms live in the section footnote. */
  termLine: z.string(),
  /** Badge of the highlighted plan: who it suits, e.g. «СОВЕТУЮ КОМПАНИЯМ». */
  highlightLabel: z.string(),
  /** The card button, e.g. «Обсудить лендинг». */
  ctaLabel: z.string(),
  /** Who the plan is for, in plain words. */
  description: z.string(),
  /** Example businesses after the «Например:» label (may be blank). */
  examples: z.string(),
  /** Heading of the feature list: «Что входит:» or the ladder's «Всё из «Лендинга», плюс:». */
  listHeading: z.string(),
  /** Included items, each with a ✓. */
  features: z.array(z.string()),
  /** Optional add-ons after the features: a «+» and the «По желанию:» label (may be empty). */
  extras: z.array(z.string()),
});
export type PricingPlan = z.infer<typeof pricingPlanSchema>;
