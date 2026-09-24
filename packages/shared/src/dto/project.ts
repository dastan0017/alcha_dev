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

/**
 * A titled point: one «Что умеет сайт» feature row, one numbered admin point or one
 * «Сервер и надёжность» column. The title is the bold lead, the text the line under it.
 */
export const projectPointSchema = z.object({ title: z.string(), text: z.string() }).strict();
export type ProjectPoint = z.infer<typeof projectPointSchema>;

/** Storage form of a point list: entries blank in both fields are dropped, never published as an empty row. */
export function normalizePoints(points: readonly ProjectPoint[]): ProjectPoint[] {
  return points.flatMap((point) =>
    point.title.trim() === '' && point.text.trim() === '' ? [] : [point],
  );
}

/** Which frame a case-page screenshot is shown in: 4/3 for a desktop shot, 9/19.5 for a phone one. */
export const screenshotDeviceSchema = z.enum(['desktop', 'mobile']);
export type ScreenshotDevice = z.infer<typeof screenshotDeviceSchema>;

/**
 * One case-page screenshot. The caption lives beside it in `screenshotCaptions` (same index)
 * because it is per-locale and the picture is not; the CRM edits both in one control.
 */
export const projectShotSchema = z
  .object({ src: z.string(), device: screenshotDeviceSchema })
  .strict();
export type ProjectShot = z.infer<typeof projectShotSchema>;

/** Storage form of a screenshot list: a slot with no picture is dropped. */
export function normalizeShots(shots: readonly ProjectShot[]): ProjectShot[] {
  return shots.filter((shot) => shot.src.trim() !== '');
}

/** Localized project as returned by the public API (home cards + case pages). */
export const projectSchema = z.object({
  id: z.string(),
  slug: z.string(),
  badgeType: projectBadgeSchema,
  sortOrder: z.number(),
  showOnHome: z.boolean(),
  /** Case-page screenshots: `[0]` is the hero shot, the rest the «Экраны» gallery. */
  screenshots: z.array(projectShotSchema),
  coverImage: z.string().nullable(),
  /** Link-preview picture of the site the case is about; empty falls back to the SEO og-image. */
  shareImage: z.string().nullable(),
  /** «Админка: тексты и фото» pictures, in order; captions are in `editingCaptions`. */
  editingImages: z.array(z.string()),
  /** «Админка: заявки» picture; its caption is `requestsCaption`. */
  requestsImage: z.string().nullable(),
  /**
   * Id of the project the «Следующий проект» card points at. A blank or unknown id falls
   * back to the next published project by sort order, so the card never breaks on a delete.
   */
  nextProjectId: z.string(),
  /** Meta-strip values, stored but not rendered until both hold real data (see the case page). */
  durationWeeks: z.string(),
  launchedAt: z.string(),
  /** Store pages for a shipped app; blank hides the link. Language-neutral. */
  appStoreUrl: z.string(),
  googlePlayUrl: z.string(),
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
  /** Detailed bullet points on the classic case page (the detailed one uses `siteFeatures`). */
  bullets: z.array(z.string()),
  /** «01 · Что умеет сайт» rows. Non-empty is what turns on the detailed case layout. */
  siteFeatures: z.array(projectPointSchema),
  /** Caption under each entry of `screenshots`, same index; a blank one hides the caption. */
  screenshotCaptions: z.array(z.string()),
  /** «02 · Админка: тексты и фото». */
  editingTitle: z.string(),
  editingLead: z.string(),
  editingPoints: z.array(projectPointSchema),
  /** Caption under each entry of `editingImages`, same index. */
  editingCaptions: z.array(z.string()),
  /** «03 · Админка: заявки». */
  requestsTitle: z.string(),
  requestsLead: z.string(),
  requestsPoints: z.array(projectPointSchema),
  /** The status row, in order: «Новая → В работе → Оплачена → Закрыта». */
  requestsStatuses: z.array(z.string()),
  requestsCaption: z.string(),
  /**
   * «Проверьте сами» line under the request flow. `**bold**` renders bold and `[text]`
   * becomes the link that opens the request form; without the markers it is plain text.
   */
  proofLine: z.string(),
  /** «Сервер и надёжность» columns. */
  reliability: z.array(projectPointSchema),
  techChips: z.array(z.string()),
  seoTitle: z.string(),
  seoDescription: z.string(),
});
export type Project = z.infer<typeof projectSchema>;
