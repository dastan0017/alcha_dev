import { z } from 'zod';
import { translatedSchema } from './common';

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

export const pricingPlanTranslationInput = z.object({
  name: z.string().min(1),
  priceLabel: z.string().min(1),
  termLine: z.string().min(1),
  highlightLabel: z.string().default(''),
  description: z.string().min(1),
  features: z.array(z.string()).default([]),
});

export const pricingPlanUpsertSchema = z.object({
  sortOrder: z.number().int().default(0),
  highlighted: z.boolean().default(false),
  published: z.boolean().default(true),
  translations: translatedSchema(pricingPlanTranslationInput),
});
export type PricingPlanUpsert = z.infer<typeof pricingPlanUpsertSchema>;

export const pricingPlanAdminSchema = z.object({
  id: z.string(),
  sortOrder: z.number(),
  highlighted: z.boolean(),
  published: z.boolean(),
  translations: translatedSchema(pricingPlanTranslationInput),
});
export type PricingPlanAdmin = z.infer<typeof pricingPlanAdminSchema>;
