import { z } from 'zod';
import { projectBadgeSchema } from './enums';

/**
 * Kebab-case slug (`/works/[slug]`, `project:<slug>` tags): lowercase words joined by single
 * hyphens. The draft tree accepts any string; publish validation and the CRM slug input both
 * check this pattern.
 */
export const PROJECT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
