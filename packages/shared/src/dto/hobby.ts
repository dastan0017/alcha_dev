import { z } from 'zod';
import { translatedSchema } from './common';

export const hobbyCardSchema = z.object({
  id: z.string(),
  sortOrder: z.number(),
  handle: z.string(),
  url: z.string(),
  imageUrl: z.string().nullable(),
  title: z.string(),
  description: z.string(),
});
export type HobbyCard = z.infer<typeof hobbyCardSchema>;

export const hobbyCardTranslationInput = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export const hobbyCardUpsertSchema = z.object({
  handle: z.string().min(1),
  url: z.string(),
  imageUrl: z.string().nullable().default(null),
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(true),
  translations: translatedSchema(hobbyCardTranslationInput),
});
export type HobbyCardUpsert = z.infer<typeof hobbyCardUpsertSchema>;

export const hobbyCardAdminSchema = z.object({
  id: z.string(),
  handle: z.string(),
  url: z.string(),
  imageUrl: z.string().nullable(),
  sortOrder: z.number(),
  published: z.boolean(),
  translations: translatedSchema(hobbyCardTranslationInput),
});
export type HobbyCardAdmin = z.infer<typeof hobbyCardAdminSchema>;
