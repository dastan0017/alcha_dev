import { z } from 'zod';

export const pricingPlanSchema = z.object({
  id: z.string(),
  sortOrder: z.number(),
  highlighted: z.boolean(),
  name: z.string(),
  priceLabel: z.string(),
  termLine: z.string(),
  highlightLabel: z.string(),
  description: z.string(),
  features: z.array(z.string()),
  /** Optional add-ons listed after the features with a «+» marker (may be empty). */
  extras: z.array(z.string()),
  /** The card button, e.g. «Обсудить лендинг». */
  ctaLabel: z.string(),
});
export type PricingPlan = z.infer<typeof pricingPlanSchema>;
