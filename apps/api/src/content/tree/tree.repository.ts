import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  CMS_FIELD_MODEL,
  LOCALES,
  siteTreeSchema,
  type CmsFieldKind,
  type CmsScope,
  type CollectionKey,
  type Locale,
  type PricingNode,
  type ProjectNode,
  type ServiceNode,
  type SiteTree,
} from '@alcha/shared';
import { PrismaService } from '../../prisma/prisma.service';

type Db = Prisma.TransactionClient;
type FieldKinds = Readonly<Record<string, CmsFieldKind>>;
type TranslationRow = { locale: Locale } & Record<string, unknown>;
type CollectionRow = { id: string; published: boolean; translations: TranslationRow[] } & Record<
  string,
  unknown
>;

const include = { translations: true } as const;
const byPosition = [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }];
const oldestFirst = { createdAt: 'asc' as const };

/** Maps the content tables (the published copy) to and from a SiteTree. */
@Injectable()
export class TreeRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Every content row, unpublished ones included, as a tree. A missing singleton or
   * translation row reads as blank copy.
   */
  async loadPublishedTree(db: Db = this.prisma): Promise<SiteTree> {
    const [home, chrome, services, pricing, projects] = await Promise.all([
      db.homeContent.findFirst({ orderBy: oldestFirst, include }),
      db.siteChrome.findFirst({ orderBy: oldestFirst, include }),
      db.service.findMany({ orderBy: byPosition, include }),
      db.pricingPlan.findMany({ orderBy: byPosition, include }),
      db.project.findMany({ orderBy: byPosition, include }),
    ]);

    // Parsing types the generic mapping and fails loudly if the tables and the tree drift.
    return siteTreeSchema.parse({
      version: 1,
      home: {
        hiddenSections: home?.hiddenSections ?? [],
        ...copyOf('home', home?.translations),
      },
      chrome: copyOf('chrome', chrome?.translations),
      services: services.map((row) => toNode('services', row)),
      pricing: pricing.map((row) => toNode('pricing', row)),
      projects: projects.map((row) => toNode('projects', row)),
    });
  }

  /**
   * Writes `tree` into the content tables inside the caller's transaction: singletons are
   * updated (or created), each collection loses the rows missing from the tree and upserts
   * the rest by id with `sortOrder` = array index and both translation rows.
   */
  async writeTree(tx: Db, tree: SiteTree): Promise<void> {
    await this.writeSingletons(tx, tree);
    await this.writeServices(tx, tree.services);
    await this.writePricing(tx, tree.pricing);
    await this.writeProjects(tx, tree.projects);
  }

  private async writeSingletons(tx: Db, { home, chrome }: SiteTree): Promise<void> {
    const homeRow = await tx.homeContent.findFirst({ orderBy: oldestFirst, select: { id: true } });
    if (homeRow) {
      const homeContentId = homeRow.id;
      await tx.homeContent.update({
        where: { id: homeContentId },
        data: {
          hiddenSections: home.hiddenSections,
          translations: {
            upsert: upsertCopy(home, (locale) => ({
              homeContentId_locale: { homeContentId, locale },
            })),
          },
        },
      });
    } else {
      await tx.homeContent.create({
        data: { hiddenSections: home.hiddenSections, translations: { create: createCopy(home) } },
      });
    }

    const chromeRow = await tx.siteChrome.findFirst({ orderBy: oldestFirst, select: { id: true } });
    if (chromeRow) {
      const siteChromeId = chromeRow.id;
      await tx.siteChrome.update({
        where: { id: siteChromeId },
        data: {
          translations: {
            upsert: upsertCopy(chrome, (locale) => ({
              siteChromeId_locale: { siteChromeId, locale },
            })),
          },
        },
      });
    } else {
      await tx.siteChrome.create({ data: { translations: { create: createCopy(chrome) } } });
    }
  }

  private async writeServices(tx: Db, nodes: ServiceNode[]): Promise<void> {
    await tx.service.deleteMany({ where: { id: { notIn: idsOf(nodes) } } });
    for (const [sortOrder, node] of nodes.entries()) {
      const { id, ...columns } = columnsOf(node);
      await tx.service.upsert({
        where: { id },
        create: { id, sortOrder, ...columns, translations: { create: createCopy(node) } },
        update: {
          sortOrder,
          ...columns,
          translations: {
            upsert: upsertCopy(node, (locale) => ({ serviceId_locale: { serviceId: id, locale } })),
          },
        },
      });
    }
  }

  private async writePricing(tx: Db, nodes: PricingNode[]): Promise<void> {
    await tx.pricingPlan.deleteMany({ where: { id: { notIn: idsOf(nodes) } } });
    for (const [sortOrder, node] of nodes.entries()) {
      const { id, ...columns } = columnsOf(node);
      await tx.pricingPlan.upsert({
        where: { id },
        create: { id, sortOrder, ...columns, translations: { create: createCopy(node) } },
        update: {
          sortOrder,
          ...columns,
          translations: {
            upsert: upsertCopy(node, (locale) => ({ planId_locale: { planId: id, locale } })),
          },
        },
      });
    }
  }

  private async writeProjects(tx: Db, nodes: ProjectNode[]): Promise<void> {
    await tx.project.deleteMany({ where: { id: { notIn: idsOf(nodes) } } });

    // Slugs are unique: park every changed slug on a placeholder first, so a swap or a
    // rename onto a slug another project is giving up never trips the index mid-way.
    // `~<id>` is unique per row and can never be a valid slug.
    const rows = await tx.project.findMany({ select: { id: true, slug: true } });
    const slugById = new Map(rows.map(({ id, slug }) => [id, slug]));
    for (const { id, slug } of nodes) {
      const current = slugById.get(id);
      if (current !== undefined && current !== slug) {
        await tx.project.update({ where: { id }, data: { slug: `~${id}` } });
      }
    }

    for (const [sortOrder, node] of nodes.entries()) {
      const { id, ...columns } = columnsOf(node);
      await tx.project.upsert({
        where: { id },
        create: { id, sortOrder, ...columns, translations: { create: createCopy(node) } },
        update: {
          sortOrder,
          ...columns,
          translations: {
            upsert: upsertCopy(node, (locale) => ({ projectId_locale: { projectId: id, locale } })),
          },
        },
      });
    }
  }
}

// ─── Rows → tree ─────────────────────────────────────────────────────────────

/** Both locales' copy fields of a scope; a missing translation row reads as blank copy. */
function copyOf(scope: CmsScope, translations: readonly TranslationRow[] = []) {
  const fields: FieldKinds = CMS_FIELD_MODEL[scope].localized;
  const copy = (locale: Locale) => {
    const row = translations.find((translation) => translation.locale === locale);
    return Object.fromEntries(
      Object.entries(fields).map(([field, kind]) => [
        field,
        row ? row[field] : kind === 'stringList' ? [] : '',
      ]),
    );
  };
  return { ru: copy('ru'), en: copy('en') };
}

/** A collection row as a node: id, `published`, the neutral columns and both locales' copy. */
function toNode(collection: CollectionKey, row: CollectionRow) {
  const fields: FieldKinds = CMS_FIELD_MODEL[collection].neutral;
  return {
    id: row.id,
    published: row.published,
    ...Object.fromEntries(Object.keys(fields).map((field) => [field, row[field]])),
    ...copyOf(collection, row.translations),
  };
}

// ─── Tree → rows ─────────────────────────────────────────────────────────────

/** A node's own columns (id, `published`, neutral fields): everything but its copy. */
function columnsOf<N extends Record<Locale, unknown>>({ ru: _ru, en: _en, ...columns }: N) {
  return columns;
}

const idsOf = (nodes: readonly { id: string }[]) => nodes.map((node) => node.id);

const createCopy = <C extends object>(owner: Record<Locale, C>) =>
  LOCALES.map((locale) => ({ ...owner[locale], locale }));

const upsertCopy = <C extends object, W>(owner: Record<Locale, C>, where: (locale: Locale) => W) =>
  LOCALES.map((locale) => ({
    where: where(locale),
    create: { ...owner[locale], locale },
    update: owner[locale],
  }));
