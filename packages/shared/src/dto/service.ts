import { z } from 'zod';
import { translatedSchema } from './common';

/** Localized service item as returned by the public API. */
export const serviceSchema = z.object({
  id: z.string(),
  number: z.string(),
  sortOrder: z.number(),
  title: z.string(),
  description: z.string(),
});
export type Service = z.infer<typeof serviceSchema>;

export const serviceTranslationInput = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export const serviceUpsertSchema = z.object({
  number: z.string().min(1),
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(true),
  translations: translatedSchema(serviceTranslationInput),
});
export type ServiceUpsert = z.infer<typeof serviceUpsertSchema>;

/** Admin list item includes draft/publish state and both translations. */
export const serviceAdminSchema = z.object({
  id: z.string(),
  number: z.string(),
  sortOrder: z.number(),
  published: z.boolean(),
  translations: translatedSchema(serviceTranslationInput),
});
export type ServiceAdmin = z.infer<typeof serviceAdminSchema>;
