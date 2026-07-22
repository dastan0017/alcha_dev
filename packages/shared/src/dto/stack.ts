import { z } from 'zod';
import { translatedSchema } from './common';

export const stackCategorySchema = z.object({
  id: z.string(),
  sortOrder: z.number(),
  title: z.string(),
  items: z.array(z.string()),
});
export type StackCategory = z.infer<typeof stackCategorySchema>;

export const stackCategoryTranslationInput = z.object({
  title: z.string().min(1),
});

export const stackCategoryUpsertSchema = z.object({
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(true),
  /** Item names (React, Next.js, …) are language-neutral. */
  items: z.array(z.string()).default([]),
  translations: translatedSchema(stackCategoryTranslationInput),
});
export type StackCategoryUpsert = z.infer<typeof stackCategoryUpsertSchema>;

export const stackCategoryAdminSchema = z.object({
  id: z.string(),
  sortOrder: z.number(),
  published: z.boolean(),
  items: z.array(z.string()),
  translations: translatedSchema(stackCategoryTranslationInput),
});
export type StackCategoryAdmin = z.infer<typeof stackCategoryAdminSchema>;
