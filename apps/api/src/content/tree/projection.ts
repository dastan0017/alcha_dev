import {
  CMS_REQUIRED_FIELDS,
  DEFAULT_LOCALE,
  type AboutResponse,
  type CmsScope,
  type Experience,
  type HobbyCard,
  type HomeResponse,
  type Locale,
  type PricingPlan,
  type Project,
  type ProjectNode,
  type SeoMeta,
  type Service,
  type SiteChrome,
  type SiteSettings,
  type SiteTree,
  type StackCategory,
} from '@alcha/shared';
import { isBlank } from './validate';

// Tree → public DTOs, one code path for published and draft reads (docs/visual-editor.md §3).
// Only `published` items are projected; an item's `sortOrder` is its index in the full collection.

/** Page data that lives outside the tree (Настройки, SEO). */
export interface PageContext {
  settings: SiteSettings;
  seo: SeoMeta;
}

export function projectHome(
  tree: SiteTree,
  locale: Locale,
  { settings, seo }: PageContext,
): HomeResponse {
  return {
    content: localize('home', tree.home, locale),
    hiddenSections: tree.home.hiddenSections,
    services: published(tree.services).map(({ node, sortOrder }): Service => ({
      id: node.id,
      number: node.number,
      sortOrder,
      featured: node.featured,
      ...localize('services', node, locale),
    })),
    projects: published(tree.projects, (node) => node.showOnHome).map(({ node, sortOrder }) =>
      toProject(node, sortOrder, locale),
    ),
    pricingPlans: published(tree.pricing).map(({ node, sortOrder }): PricingPlan => ({
      id: node.id,
      sortOrder,
      highlighted: node.highlighted,
      ...localize('pricing', node, locale),
    })),
    settings,
    seo,
  };
}

export function projectAbout(
  tree: SiteTree,
  locale: Locale,
  { settings, seo }: PageContext,
): AboutResponse {
  const home = localize('home', tree.home, locale);
  return {
    profile: { photoUrl: tree.about.photoUrl, ...localize('about', tree.about, locale) },
    hiddenSections: tree.about.hiddenSections,
    experiences: published(tree.experience).map(({ node, sortOrder }): Experience => ({
      id: node.id,
      company: node.company,
      sortOrder,
      ...localize('experience', node, locale),
    })),
    projects: published(tree.projects, (node) => node.showOnAbout).map(({ node, sortOrder }) =>
      toProject(node, sortOrder, locale),
    ),
    stack: published(tree.stack).map(({ node, sortOrder }): StackCategory => ({
      id: node.id,
      sortOrder,
      items: node.items,
      ...localize('stack', node, locale),
    })),
    hobbies: published(tree.hobbies).map(({ node, sortOrder }): HobbyCard => ({
      id: node.id,
      sortOrder,
      handle: node.handle,
      url: node.url,
      imageUrl: node.imageUrl,
      ...localize('hobbies', node, locale),
    })),
    // The dark CTA banner at the bottom of About reuses the homepage copy.
    cta: {
      title: home.ctaTitle,
      subtitle: home.ctaSubtitle,
      telegramLabel: home.ctaTelegramLabel,
      cvLabel: home.ctaCvLabel,
    },
    settings,
    seo,
  };
}

export function projectProjects(tree: SiteTree, locale: Locale): Project[] {
  return published(tree.projects).map(({ node, sortOrder }) => toProject(node, sortOrder, locale));
}

/** The published project with `slug`, or null. */
export function projectProject(tree: SiteTree, slug: string, locale: Locale): Project | null {
  const [match] = published(tree.projects, (node) => node.slug === slug);
  return match ? toProject(match.node, match.sortOrder, locale) : null;
}

export function projectChrome(tree: SiteTree, locale: Locale): SiteChrome {
  return localize('chrome', tree.chrome, locale);
}

function toProject(node: ProjectNode, sortOrder: number, locale: Locale): Project {
  return {
    id: node.id,
    slug: node.slug,
    badgeType: node.badgeType,
    sortOrder,
    showOnHome: node.showOnHome,
    showOnAbout: node.showOnAbout,
    screenshots: node.screenshots,
    coverImage: node.coverImage,
    ...localize('projects', node, locale),
  };
}

/** Published items paired with their index in the full collection. */
function published<N extends { published: boolean }>(
  items: readonly N[],
  include: (node: N) => boolean = () => true,
): { node: N; sortOrder: number }[] {
  return items.flatMap((node, sortOrder) =>
    node.published && include(node) ? [{ node, sortOrder }] : [],
  );
}

/** The `locale` copy of a node; blank required fields of other locales fall back to RU. */
function localize<C extends Record<string, unknown>>(
  scope: CmsScope,
  node: Record<Locale, C>,
  locale: Locale,
): C {
  const copy = node[locale];
  if (locale === DEFAULT_LOCALE) return copy;
  const required: readonly string[] = CMS_REQUIRED_FIELDS[scope].localized;
  const blank = required.filter((field) => isBlank(copy[field]));
  if (blank.length === 0) return copy;
  const fallback = node[DEFAULT_LOCALE];
  return { ...copy, ...Object.fromEntries(blank.map((field) => [field, fallback[field]])) };
}
