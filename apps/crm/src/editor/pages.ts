import { DEFAULT_LOCALE, type Locale, type ProjectNode, type SiteTree } from '@alcha/shared';
import { SITE_URL } from '../lib/site';

/** What the page switcher offers: «Кейс проекта» shows one project's case page. */
export type PageKind = 'home' | 'about' | 'case';

export type SitePageRef =
  { kind: 'home' } | { kind: 'about' } | { kind: 'case'; project: ProjectNode };

/** Projects that have a case page in the draft. */
export const caseProjects = (tree: SiteTree): ProjectNode[] =>
  tree.projects.filter((project) => project.published && project.slug !== '');

/**
 * The page to show: a case page follows its project by id (so a slug edit reloads the
 * right URL) and falls back to the first case, or to the homepage when there is none.
 */
export function resolvePage(tree: SiteTree, kind: PageKind, projectId: string | null): SitePageRef {
  if (kind !== 'case') return { kind };
  const projects = caseProjects(tree);
  const project = projects.find(({ id }) => id === projectId) ?? projects[0];
  return project ? { kind, project } : { kind: 'home' };
}

export function pagePath(page: SitePageRef): string {
  switch (page.kind) {
    case 'home':
      return '/';
    case 'about':
      return '/about';
    case 'case':
      return `/works/${encodeURIComponent(page.project.slug)}`;
  }
}

/** `path` as the site serves it in `locale`: RU at the root, EN under /en (like the web middleware). */
export function localizedPath(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

/** The web middleware turns `?preview=` into draft mode and applies the locale prefix. */
export function frameSrc(path: string, locale: Locale, token: string): string {
  const url = new URL(path, SITE_URL);
  url.searchParams.set('preview', token);
  url.searchParams.set('locale', locale);
  return url.toString();
}
