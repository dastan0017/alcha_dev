import {
  CMS_FIELD_MODEL,
  COLLECTION_KEYS,
  LOCALES,
  type CmsFieldKind,
  type CmsScope,
  type ProjectFact,
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
 * Leaves are strings, booleans, null, string lists or fact lists. A section list is a set:
 * the page renders sections in its own order, so hiding the same sections in another order
 * is no change. Facts are objects, so they are compared field by field.
 */
function sameLeaf(kind: CmsFieldKind, a: unknown, b: unknown): boolean {
  if (!Array.isArray(a) || !Array.isArray(b)) return a === b;
  // Section lists never hold duplicates (the patch engine rejects them).
  if (kind === 'sectionList') return a.length === b.length && a.every((key) => b.includes(key));
  if (kind === 'factList')
    return a.length === b.length && a.every((fact, i) => sameFact(fact, b[i]));
  return sameList(a, b);
}

const sameFact = (a: unknown, b: unknown) => {
  const [before, after] = [a, b] as ProjectFact[];
  return before.text === after.text && (before.lead ?? '') === (after.lead ?? '');
};

const sameList = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((entry, i) => entry === b[i]);
