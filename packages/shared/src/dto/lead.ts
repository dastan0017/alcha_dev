import { z } from 'zod';
import { localeSchema } from './common';
import { leadStatusSchema } from './enums';

/** Public contact-form submission. `website` is a honeypot — bots fill it. */
export const createLeadSchema = z.object({
  name: z.string().min(1).max(120),
  contact: z.string().min(1).max(200),
  message: z.string().min(1).max(4000),
  sourcePath: z.string().max(300).default('/'),
  locale: localeSchema.default('ru'),
  // Honeypot: legit clients leave this empty; the API silently drops it if filled.
  website: z.string().max(200).optional(),
});
export type CreateLead = z.infer<typeof createLeadSchema>;

export const leadSchema = z.object({
  id: z.string(),
  name: z.string(),
  contact: z.string(),
  message: z.string(),
  status: leadStatusSchema,
  note: z.string().nullable(),
  sourcePath: z.string(),
  locale: localeSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Lead = z.infer<typeof leadSchema>;

export const updateLeadSchema = z.object({
  status: leadStatusSchema.optional(),
  note: z.string().nullable().optional(),
});
export type UpdateLead = z.infer<typeof updateLeadSchema>;

export const leadStatsSchema = z.object({
  total: z.number(),
  new: z.number(),
  in_progress: z.number(),
  paid: z.number(),
  closed: z.number(),
});
export type LeadStats = z.infer<typeof leadStatsSchema>;
