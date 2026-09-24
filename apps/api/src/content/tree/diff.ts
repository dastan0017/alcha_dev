import {
  CMS_FIELD_MODEL,
  COLLECTION_KEYS,
  LOCALES,
  type CmsFieldKind,
  type CmsScope,
  type ProjectFact,
  type ProjectPoint,
  type ProjectShot,
  type SiteTree,
} from '@alcha/shared';

type FieldKinds = Readonly<Record<string, CmsFieldKind>>;
type Owner = Record<string, unknown>;

/**
 * Leaf-level diff between the published base and the draft (docs/visual-editor.md §3):
 * one per changed singleton field (a string list is one leaf); per collection one per
 * added or removed item, one per changed leaf of a common item (`published` included)
 * and one more when the relative order of the common items changed.
 */
export function countChanges(base: SiteTree, tree: SiteTree): number {
  let changes =
    changedLeaves('home', base.home, tree.home) + changedLeaves('chrome', base.chrome, tree.chrome);

  for (const collection of COLLECTION_KEYS) {
    const before: readonly (Owner & { id: string })[] = base[collection];
    const after: readonly (Owner & { id: string })[] = tree[collection];
    const beforeById = new Map(before.map((node) => [node.id, node]));
    const afterIds = new Set(after.map((node) => node.id));

    for (const node of after) {
      const previous = beforeById.get(node.id);
      changes += previous
        ? changedLeaves(collection, previous, node) + Number(previous.published !== node.published)
        : 1;
    }
    changes += before.filter((node) => !afterIds.has(node.id)).length;

    const beforeOrder = before.filter((node) => afterIds.has(node.id)).map((node) => node.id);
    const afterOrder = after.filter((node) => beforeById.has(node.id)).map((node) => node.id);
    changes += Number(!sameList(beforeOrder, afterOrder));
  }
  return changes;
}

function changedLeaves(scope: CmsScope, before: Owner, after: Owner): number {
  const model: { neutral: FieldKinds; localized: FieldKinds } = CMS_FIELD_MODEL[scope];
  let changes = countDifferent(model.neutral, before, after);
  for (const locale of LOCALES) {
    changes += countDifferent(model.localized, before[locale] as Owner, after[locale] as Owner);
  }
  return changes;
}

const countDifferent = (fields: FieldKinds, before: Owner, after: Owner) =>
  Object.entries(fields).filter(([field, kind]) => !sameLeaf(kind, before[field], after[field]))
    .length;

/**
 * Leaves are strings, booleans, null, string lists, or lists of small objects (facts,
 * points, screenshots). A section list is a set: the page renders sections in its own
 * order, so hiding the same sections in another order is no change. Object entries are
 * compared field by field — two equal lists built separately must count as no change.
 */
function sameLeaf(kind: CmsFieldKind, a: unknown, b: unknown): boolean {
  if (!Array.isArray(a) || !Array.isArray(b)) return a === b;
  // Section lists never hold duplicates (the patch engine rejects them).
  if (kind === 'sectionList') return a.length === b.length && a.every((key) => b.includes(key));
  if (kind === 'factList') return sameEntries(a, b, sameFact);
  if (kind === 'pointList') return sameEntries(a, b, samePoint);
  if (kind === 'shotList') return sameEntries(a, b, sameShot);
  return sameList(a, b);
}

const sameEntries = (
  a: readonly unknown[],
  b: readonly unknown[],
  same: (x: unknown, y: unknown) => boolean,
) => a.length === b.length && a.every((entry, i) => same(entry, b[i]));

const sameFact = (a: unknown, b: unknown) => {
  const [before, after] = [a, b] as ProjectFact[];
  return before.text === after.text && (before.lead ?? '') === (after.lead ?? '');
};

const samePoint = (a: unknown, b: unknown) => {
  const [before, after] = [a, b] as ProjectPoint[];
  return before.title === after.title && before.text === after.text;
};

const sameShot = (a: unknown, b: unknown) => {
  const [before, after] = [a, b] as ProjectShot[];
  return before.src === after.src && before.device === after.device;
};

const sameList = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((entry, i) => entry === b[i]);
