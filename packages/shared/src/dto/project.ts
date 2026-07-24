import { z } from 'zod';
import { translatedSchema } from './common';
import { projectBadgeSchema } from './enums';

/** Localized project as returned by the public API (home cards + case pages). */
export const projectSchema = z.object({
  id: z.string(),
  slug: z.string(),
  badgeType: projectBadgeSchema,
  sortOrder: z.number(),
  showOnHome: z.boolean(),
  showOnAbout: z.boolean(),
  screenshots: z.array(z.string()),
  coverImage: z.string().nullable(),
  title: z.string(),
  /** Badge label text, e.g. "ЭТОТ САЙТ" / "APP STORE + GOOGLE PLAY". */
  badge: z.string(),
  /** Product-type tag (green own / orange client); empty = hidden. */
  typeTag: z.string(),
  /** Short card description / transformation story. */
  metaLine: z.string(),
  /** Mono highlight line of concrete facts on the works card. */
  factsLine: z.string(),
  /** Role line shown on the detailed About-page card (may be empty). */
  role: z.string(),
  description: z.string(),
  /** "What was done" chips. */
  pills: z.array(z.string()),
  /** Detailed bullet points (About-page card). */
  bullets: z.array(z.string()),
  techChips: z.array(z.string()),
  seoTitle: z.string(),
  seoDescription: z.string(),
});
export type Project = z.infer<typeof projectSchema>;

export const projectTranslationInput = z.object({
  title: z.string().min(1),
  badge: z.string().min(1),
  typeTag: z.string().default(''),
  metaLine: z.string().min(1),
  factsLine: z.string().default(''),
  role: z.string().default(''),
  description: z.string().min(1),
  pills: z.array(z.string()).default([]),
  bullets: z.array(z.string()).default([]),
  techChips: z.array(z.string()).default([]),
  seoTitle: z.string().default(''),
  seoDescription: z.string().default(''),
});

export const projectUpsertSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
  badgeType: projectBadgeSchema,
  sortOrder: z.number().int().default(0),
  showOnHome: z.boolean().default(false),
  showOnAbout: z.boolean().default(false),
  published: z.boolean().default(false),
  screenshots: z.array(z.string()).default([]),
  coverImage: z.string().nullable().default(null),
  translations: translatedSchema(projectTranslationInput),
});
export type ProjectUpsert = z.infer<typeof projectUpsertSchema>;

export const projectAdminSchema = z.object({
  id: z.string(),
  slug: z.string(),
  badgeType: projectBadgeSchema,
  sortOrder: z.number(),
  showOnHome: z.boolean(),
  showOnAbout: z.boolean(),
  published: z.boolean(),
  screenshots: z.array(z.string()),
  coverImage: z.string().nullable(),
  translations: translatedSchema(projectTranslationInput),
});
export type ProjectAdmin = z.infer<typeof projectAdminSchema>;
