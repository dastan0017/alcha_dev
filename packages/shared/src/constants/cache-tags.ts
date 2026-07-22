/**
 * Next.js cache tags shared between the API (which triggers revalidation on
 * publish) and the web app (which tags its fetches). Keeping them here means
 * both sides can never drift apart.
 */
export const CacheTags = {
  home: 'content:home',
  about: 'content:about',
  settings: 'content:settings',
  projects: 'content:projects',
  /** Per-project page tag, e.g. `project:alcha-dev`. */
  project: (slug: string): `project:${string}` => `project:${slug}`,
} as const;

export type StaticContentTag =
  | 'content:home'
  | 'content:about'
  | 'content:settings'
  | 'content:projects';

export type ContentTag = StaticContentTag | `project:${string}`;

/** Every static (non per-slug) content tag — used for "publish all". */
export const ALL_STATIC_CONTENT_TAGS: StaticContentTag[] = [
  CacheTags.home,
  CacheTags.about,
  CacheTags.settings,
  CacheTags.projects,
];

/** Time-based revalidation safety net (seconds) applied to all content fetches. */
export const CONTENT_REVALIDATE_SECONDS = 3600;
