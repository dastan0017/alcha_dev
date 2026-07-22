import { z } from 'zod';
import { translatedSchema } from './common';

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  sortOrder: z.number(),
  role: z.string(),
  /** e.g. "авг 2023 — сейчас · 3 года · удалённо · США и Европа" */
  meta: z.string(),
  description: z.string(),
});
export type Experience = z.infer<typeof experienceSchema>;

export const experienceTranslationInput = z.object({
  role: z.string().min(1),
  meta: z.string().min(1),
  description: z.string().min(1),
});

export const experienceUpsertSchema = z.object({
  company: z.string().min(1),
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(true),
  translations: translatedSchema(experienceTranslationInput),
});
export type ExperienceUpsert = z.infer<typeof experienceUpsertSchema>;

export const experienceAdminSchema = z.object({
  id: z.string(),
  company: z.string(),
  sortOrder: z.number(),
  published: z.boolean(),
  translations: translatedSchema(experienceTranslationInput),
});
export type ExperienceAdmin = z.infer<typeof experienceAdminSchema>;
