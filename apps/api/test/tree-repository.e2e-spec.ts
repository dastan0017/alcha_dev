import type { Prisma } from '@prisma/client';
import { applyPatches, newCollectionNode, type ContentPatch, type SiteTree } from '@alcha/shared';
import { lockContent } from '../src/content/draft.service';
import { treeFixture } from '../src/content/tree/tree.fixture';
import { TreeRepository } from '../src/content/tree/tree.repository';
import { PrismaService } from '../src/prisma/prisma.service';

type Db = Prisma.TransactionClient;

// Runs against the dev database (test/setup-env.ts), so every case is rolled back.
jest.setTimeout(30_000);

const prisma = new PrismaService();
const trees = new TreeRepository(prisma);

const ROLLBACK = new Error('rollback');

/**
 * Writes the fixture tree over the content tables, runs `body`, then rolls everything back.
 * Takes the content lock first, so it queues behind a publish instead of deadlocking with it.
 */
async function rolledBack(body: (tx: Db, fixture: SiteTree) => Promise<void>): Promise<void> {
  try {
    await prisma.$transaction(
      async (tx) => {
        await lockContent(tx);
        const fixture = treeFixture();
        await trees.writeTree(tx, fixture);
        await body(tx, fixture);
        throw ROLLBACK;
      },
      { timeout: 30_000 },
    );
  } catch (error) {
    if (error !== ROLLBACK) throw error;
  }
}

/** Writes `tree` and expects reading the tables back to give exactly `tree`. */
async function expectRoundTrip(tx: Db, tree: SiteTree): Promise<void> {
  await trees.writeTree(tx, tree);
  expect(await trees.loadPublishedTree(tx)).toEqual(tree);
}

const edit = (tree: SiteTree, patches: ContentPatch[]) => applyPatches(tree, patches).tree;
const set = (path: string, value: unknown): ContentPatch => ({ op: 'set', path, value });

describe('TreeRepository.writeTree (rolled back)', () => {
  afterAll(() => prisma.$disconnect());

  it('replaces the existing content with a tree', () =>
    rolledBack(async (tx, fixture) => {
      expect(await trees.loadPublishedTree(tx)).toEqual(fixture);
    }));

  it('swaps slugs between two projects', () =>
    rolledBack((tx, fixture) =>
      expectRoundTrip(
        tx,
        edit(fixture, [set('projects.pr1.slug', 'second'), set('projects.pr2.slug', 'first')]),
      ),
    ));

  it('renames a project onto a slug another project gives up in the same write', () =>
    rolledBack((tx, fixture) =>
      expectRoundTrip(
        tx,
        edit(fixture, [
          set('projects.pr1.slug', 'second'),
          set('projects.pr2.slug', 'third-one'),
          set('projects.pr3.slug', 'fourth'),
        ]),
      ),
    ));

  it('deletes a project and reuses its slug on a new id', () =>
    rolledBack((tx, fixture) => {
      const project = { ...newCollectionNode('projects'), slug: 'first' };
      return expectRoundTrip(
        tx,
        edit(fixture, [
          { op: 'remove', path: 'projects.pr1' },
          { op: 'insert', path: 'projects', value: project, index: 0 },
        ]),
      );
    }));

  it('inserts and moves items, storing sortOrder as the array index', () =>
    rolledBack(async (tx, fixture) => {
      const tree = edit(fixture, [
        { op: 'insert', path: 'services', value: newCollectionNode('services'), index: 1 },
        { op: 'move', path: 'services.s3', value: 0 },
        { op: 'move', path: 'stack.st2', value: 0 },
      ]);
      await expectRoundTrip(tx, tree);
      const rows = await tx.service.findMany({
        orderBy: { sortOrder: 'asc' },
        select: { id: true, sortOrder: true },
      });
      expect(rows).toEqual(tree.services.map(({ id }, sortOrder) => ({ id, sortOrder })));
    }));

  it('deletes every row of an emptied collection', () =>
    rolledBack(async (tx, fixture) => {
      await expectRoundTrip(tx, { ...fixture, pricing: [], hobbies: [] });
      expect(await tx.pricingPlan.count()).toBe(0);
      expect(await tx.hobbyCardTranslation.count()).toBe(0);
    }));

  it('creates missing singleton and translation rows', () =>
    rolledBack(async (tx, fixture) => {
      await tx.siteChrome.deleteMany();
      await tx.aboutProfile.deleteMany();
      await tx.homeContentTranslation.deleteMany({ where: { locale: 'en' } });
      await tx.projectTranslation.deleteMany({ where: { projectId: 'pr2', locale: 'en' } });

      const blank = await trees.loadPublishedTree(tx);
      expect(blank.chrome.ru.navWorks).toBe('');
      expect(blank.about).toMatchObject({ photoUrl: null, hiddenSections: [] });
      expect(blank.home.en.heroBullets).toEqual([]);
      expect(blank.projects[1].en.title).toBe('');

      await expectRoundTrip(
        tx,
        edit(fixture, [
          set('home.hiddenSections', ['pricing', 'works']),
          set('about.hiddenSections', ['hobbies']),
        ]),
      );
    }));
});
