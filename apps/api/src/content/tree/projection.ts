import {
  CMS_FALLBACK_FIELDS,
  DEFAULT_LOCALE,
  isBlankCmsValue,
  type CmsScope,
  type HomeResponse,
  type Locale,
  type PricingPlan,
  type ProcessStep,
  type Project,
  type ProjectNode,
  type SeoMeta,
  type SiteChrome,
  type SiteSettings,
  type SiteTree,
} from '@alcha/shared';

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
    processSteps: published(tree.steps).map(({ node, sortOrder }): ProcessStep => ({
      id: node.id,
      sortOrder,
      isMain: node.isMain,
      ...localize('steps', node, locale),
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
    screenshots: node.screenshots,
    coverImage: node.coverImage,
    shareImage: node.shareImage,
    editingImages: node.editingImages,
    requestsImage: node.requestsImage,
    nextProjectId: node.nextProjectId,
    durationWeeks: node.durationWeeks,
    launchedAt: node.launchedAt,
    appStoreUrl: node.appStoreUrl,
    googlePlayUrl: node.googlePlayUrl,
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

/** The `locale` copy of a node; blank fallback fields of other locales fill in from RU. */
function localize<C extends Record<string, unknown>>(
  scope: CmsScope,
  node: Record<Locale, C>,
  locale: Locale,
): C {
  const copy = node[locale];
  if (locale === DEFAULT_LOCALE) return copy;
  const fields: readonly string[] = CMS_FALLBACK_FIELDS[scope];
  const blank = fields.filter((field) => isBlankCmsValue(copy[field]));
  if (blank.length === 0) return copy;
  const fallback = node[DEFAULT_LOCALE];
  return { ...copy, ...Object.fromEntries(blank.map((field) => [field, fallback[field]])) };
}
