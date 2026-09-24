import { z } from 'zod';
import { projectBadgeSchema } from './enums';

/**
 * Kebab-case slug (`/works/[slug]`, `project:<slug>` tags): lowercase words joined by single
 * hyphens. The draft tree accepts any string; publish validation and the CRM slug input both
 * check this pattern.
 */
export const PROJECT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * One ✓ fact on the works card. `lead` is the bold opening phrase («Удобная админка»);
 * a fact without one is a single plain sentence.
 */
export const projectFactSchema = z
  .object({ lead: z.string().optional(), text: z.string() })
  .strict();
export type ProjectFact = z.infer<typeof projectFactSchema>;

/**
 * Storage form of a fact list: entries with blank text are dropped (never published as an
 * empty ✓ row) and a blank lead is dropped instead of stored as `''`, so the same facts
 * always compare equal.
 */
export function normalizeFacts(facts: readonly ProjectFact[]): ProjectFact[] {
  return facts.flatMap(({ lead, text }) =>
    text.trim() === '' ? [] : [lead?.trim() ? { lead, text } : { text }],
  );
}

/** Localized project as returned by the public API (home cards + case pages). */
export const projectSchema = z.object({
  id: z.string(),
  slug: z.string(),
  badgeType: projectBadgeSchema,
  sortOrder: z.number(),
  showOnHome: z.boolean(),
  screenshots: z.array(z.string()),
  coverImage: z.string().nullable(),
  title: z.string(),
  /** Badge label text, e.g. "ЭТОТ САЙТ" / "APP STORE + GOOGLE PLAY". */
  badge: z.string(),
  /** Product-type tag (green own / orange client); empty = hidden. */
  typeTag: z.string(),
  /** Short card description / transformation story. */
  metaLine: z.string(),
  /** ✓ facts under the description on the works card. */
  facts: z.array(projectFactSchema),
  /** Role line on the case page (may be empty). */
  role: z.string(),
  description: z.string(),
  /** "What was done" chips. */
  pills: z.array(z.string()),
  /** Detailed bullet points on the case page. */
  bullets: z.array(z.string()),
  techChips: z.array(z.string()),
  seoTitle: z.string(),
  seoDescription: z.string(),
});
export type Project = z.infer<typeof projectSchema>;
