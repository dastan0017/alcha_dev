import { z } from 'zod';
import { translatedSchema } from './common';

/** Localized service item as returned by the public API. */
export const serviceSchema = z.object({
  id: z.string(),
  number: z.string(),
  sortOrder: z.number(),
  /** The highlighted "core strength" service, rendered as the large card. */
  featured: z.boolean(),
  title: z.string(),
  description: z.string(),
  /** Pill label on the featured card. */
  badge: z.string(),
  /** Checklist items rendered with ticks. */
  bullets: z.array(z.string()),
  /** Optional mono tech line under the card. */
  techLine: z.string(),
});
export type Service = z.infer<typeof serviceSchema>;

/** Write shape: optional extras default so the CRM can leave them blank. */
export const serviceTranslationInput = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  badge: z.string().default(''),
  bullets: z.array(z.string()).default([]),
  techLine: z.string().default(''),
});

export const serviceUpsertSchema = z.object({
  number: z.string().min(1),
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
  translations: translatedSchema(serviceTranslationInput),
});
export type ServiceUpsert = z.infer<typeof serviceUpsertSchema>;

/** Admin list item includes draft/publish state and both translations. */
export const serviceAdminSchema = z.object({
  id: z.string(),
  number: z.string(),
  sortOrder: z.number(),
  published: z.boolean(),
  featured: z.boolean(),
  translations: translatedSchema(serviceTranslationInput),
});
export type ServiceAdmin = z.infer<typeof serviceAdminSchema>;
