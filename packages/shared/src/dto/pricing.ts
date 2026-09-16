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
});
export type PricingPlan = z.infer<typeof pricingPlanSchema>;
