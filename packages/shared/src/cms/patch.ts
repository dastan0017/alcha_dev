import { z } from 'zod';
import { HOME_SECTION_KEYS, projectBadgeSchema, type HomeSectionKey } from '../dto/enums';
import { cmsPath, parseCmsPath, type CmsFieldTarget, type ParsedCmsPath } from './paths';
import {
  CMS_FIELD_MODEL,
  collectionKeySchema,
  collectionNodeSchema,
  nodeSchemaByCollection,
  type CmsFieldKind,
  type CmsNeutralField,
  type CmsScope,
  type CollectionKey,
  type CollectionNode,
  type SiteTree,
} from './tree';

export const contentPatchSchema = z.discriminatedUnion('op', [
  /** Leaf, list entry (index === length appends) or whole list. */
  z.object({ op: z.literal('set'), path: z.string(), value: z.unknown() }).strict(),
  /** Upsert by `value.id`; a new item lands at `index` (default: end). */
  z
    .object({
      op: z.literal('insert'),
      path: collectionKeySchema,
      value: collectionNodeSchema,
      index: z.number().int().optional(),
    })
    .strict(),
  /** `<collection>.<id>`. */
  z.object({ op: z.literal('remove'), path: z.string() }).strict(),
  /** `<collection>.<id>` → absolute index in the full collection (clamped). */
  z.object({ op: z.literal('move'), path: z.string(), value: z.number().int() }).strict(),
]);
export type ContentPatch = z.infer<typeof contentPatchSchema>;

/**
 * Body of PATCH /admin/content/draft. Each op is idempotent on its own, but a batch
 * is not replay-safe (several moves, or an append then a shrink, differ on a second
 * run), so a failed PATCH must not be retried automatically.
 */
export const contentPatchRequestSchema = z.object({
  patches: z.array(contentPatchSchema).min(1).max(200),
});
export type ContentPatchRequest = z.infer<typeof contentPatchRequestSchema>;

/** A malformed path or a value of the wrong type (API → 400). */
export class CmsPatchError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly patchIndex: number,
  ) {
    super(`patches[${patchIndex}] ${path}: ${message}`);
    this.name = 'CmsPatchError';
  }
}

export interface ApplyPatchesResult {
  tree: SiteTree;
  applied: number;
  /** No-ops: `set` / `remove` / `move` on a missing item id. */
  skipped: number;
}

/** Applies patches in order; pure and immutable (copy-on-write along each path). */
export function applyPatches(tree: SiteTree, patches: readonly ContentPatch[]): ApplyPatchesResult {
  let current = tree;
  let applied = 0;
  patches.forEach((patch, i) => {
    const step = applyPatch(current, patch, i);
    if (!step) return;
    current = step.tree;
    applied += 1;
  });
  return { tree: current, applied, skipped: patches.length - applied };
}

/**
 * Exact undo for `patches` applied to `treeBefore`, already in reverse order:
 * `applyPatches(applyPatches(t, p).tree, invertPatches(t, p)).tree` deep-equals `t`.
 */
export function invertPatches(
  treeBefore: SiteTree,
  patches: readonly ContentPatch[],
): ContentPatch[] {
  let current = treeBefore;
  const inverses: ContentPatch[] = [];
  patches.forEach((patch, i) => {
    const step = applyPatch(current, patch, i);
    if (!step) return;
    inverses.push(step.inverse);
    current = step.tree;
  });
  return inverses.reverse();
}

/** Keys of a collection's boolean fields, e.g. `featured`, `highlighted`. */
export type CmsFlagField<C extends CollectionKey> = {
  [K in CmsNeutralField<C>]: (typeof CMS_FIELD_MODEL)[C]['neutral'][K] extends 'boolean'
    ? K
    : never;
}[CmsNeutralField<C>];

/**
 * Sets `flag` on `id`; when turning it on, also turns it off on every other item that has it.
 * Empty when `id` is not in `tree`. The clears are only right for the tree they were computed from.
 */
export function exclusiveFlagPatches<C extends CollectionKey>(
  tree: SiteTree,
  collection: C,
  id: string,
  flag: CmsFlagField<C>,
  value: boolean,
): ContentPatch[] {
  const items = itemsOf(tree, collection);
  if (!items.some((item) => item.id === id)) return [];
  const field = flag as string;
  const patches: ContentPatch[] = [{ op: 'set', path: `${collection}.${id}.${field}`, value }];
  if (!value) return patches;
  for (const item of items) {
    if (item.id !== id && (item as Record<string, unknown>)[field] === true) {
      patches.push({ op: 'set', path: `${collection}.${item.id}.${field}`, value: false });
    }
  }
  return patches;
}

/**
 * Sets the homepage's `hiddenSections` with `section` added or removed, in
 * HOME_SECTION_KEYS order, so equal sets are equal arrays.
 */
export function hiddenSectionPatch(
  tree: SiteTree,
  section: HomeSectionKey,
  hidden: boolean,
): ContentPatch {
  const current: readonly string[] = tree.home.hiddenSections;
  const value = HOME_SECTION_KEYS.filter((key) =>
    key === section ? hidden : current.includes(key),
  );
  return { op: 'set', path: 'home.hiddenSections', value };
}

// ─── Internals ───────────────────────────────────────────────────────────────

type Fail = (message: string) => never;

/** One applied patch and its inverse against the tree it was applied to. */
interface Step {
  tree: SiteTree;
  inverse: ContentPatch;
}

/** Null when the patch is a no-op on a missing item id. */
function applyPatch(tree: SiteTree, patch: ContentPatch, patchIndex: number): Step | null {
  const fail: Fail = (message) => {
    throw new CmsPatchError(message, patch.path, patchIndex);
  };
  const parsed = parseCmsPath(patch.path) ?? fail('unknown path');

  switch (patch.op) {
    case 'set':
      if (parsed.kind !== 'field' && parsed.kind !== 'itemField')
        return fail('set needs a field path');
      return setField(tree, patch.path, parsed, patch.value, fail);

    case 'insert': {
      if (parsed.kind !== 'collection') return fail('insert needs a collection path');
      if (patch.index !== undefined && !Number.isInteger(patch.index)) {
        return fail('index must be an integer');
      }
      const { collection } = parsed;
      const schema: z.ZodType<CollectionNode> = nodeSchemaByCollection[collection];
      const result = schema.safeParse(patch.value);
      if (!result.success) {
        const [issue] = result.error.issues;
        return fail(`invalid ${collection} item (${issue.path.join('.')}: ${issue.message})`);
      }
      const node = result.data;
      const items = itemsOf(tree, collection);
      const pos = items.findIndex((item) => item.id === node.id);
      const next = [...items];
      if (pos >= 0) {
        next[pos] = node;
        return {
          tree: withItems(tree, collection, next),
          inverse: { op: 'insert', path: collection, value: items[pos] },
        };
      }
      next.splice(clamp(patch.index ?? items.length, 0, items.length), 0, node);
      return {
        tree: withItems(tree, collection, next),
        inverse: { op: 'remove', path: cmsPath.item(collection, node.id) },
      };
    }

    case 'remove': {
      if (parsed.kind !== 'item') return fail('remove needs an item path');
      const items = itemsOf(tree, parsed.collection);
      const pos = items.findIndex((item) => item.id === parsed.id);
      if (pos < 0) return null;
      return {
        tree: withItems(
          tree,
          parsed.collection,
          items.filter((_, i) => i !== pos),
        ),
        inverse: { op: 'insert', path: parsed.collection, value: items[pos], index: pos },
      };
    }

    case 'move': {
      if (parsed.kind !== 'item') return fail('move needs an item path');
      if (!Number.isInteger(patch.value)) return fail('target index must be an integer');
      const items = itemsOf(tree, parsed.collection);
      const pos = items.findIndex((item) => item.id === parsed.id);
      if (pos < 0) return null;
      const next = items.filter((_, i) => i !== pos);
      next.splice(clamp(patch.value, 0, items.length - 1), 0, items[pos]);
      return {
        tree: withItems(tree, parsed.collection, next),
        inverse: { op: 'move', path: patch.path, value: pos },
      };
    }
  }
}

function setField(
  tree: SiteTree,
  path: string,
  target: Extract<ParsedCmsPath, { kind: 'field' | 'itemField' }>,
  value: unknown,
  fail: Fail,
): Step | null {
  // The value is checked before the id lookup, so a wrong type fails whether or not the item exists.
  const scope = target.kind === 'field' ? target.scope : target.collection;
  const checked = checkValue(
    target.index === null ? target.fieldKind : 'string',
    scope,
    value,
    fail,
  );
  if (target.kind === 'field') {
    const { owner, inverse } = setOnOwner(tree[target.scope], path, target, checked, fail);
    return { tree: { ...tree, [target.scope]: owner } as SiteTree, inverse };
  }
  const items = itemsOf(tree, target.collection);
  const pos = items.findIndex((item) => item.id === target.id);
  if (pos < 0) return null;
  const { owner, inverse } = setOnOwner(items[pos], path, target, checked, fail);
  const next = [...items];
  next[pos] = owner as CollectionNode;
  return { tree: withItems(tree, target.collection, next), inverse };
}

/** Copies `owner` (a singleton or item) with the target leaf replaced by an already checked value. */
function setOnOwner(
  owner: Record<string, unknown>,
  path: string,
  target: CmsFieldTarget,
  value: unknown,
  fail: Fail,
): { owner: Record<string, unknown>; inverse: ContentPatch } {
  const record = target.locale ? (owner[target.locale] as Record<string, unknown>) : owner;
  const current = record[target.field];
  let nextValue: unknown;
  let inverse: ContentPatch;

  if (target.index === null) {
    nextValue = value;
    inverse = { op: 'set', path, value: current };
  } else {
    const list = current as readonly string[];
    if (target.index > list.length)
      return fail(`index ${target.index} is past the end (${list.length})`);
    const nextList = [...list];
    nextList[target.index] = value as string;
    nextValue = nextList;
    // An append is undone by restoring the whole list.
    inverse =
      target.index === list.length
        ? { op: 'set', path: path.slice(0, path.lastIndexOf('.')), value: list }
        : { op: 'set', path, value: list[target.index] };
  }

  const nextRecord = { ...record, [target.field]: nextValue };
  return { owner: target.locale ? { ...owner, [target.locale]: nextRecord } : nextRecord, inverse };
}

/** Returns the value to store (arrays copied) or fails when it does not match the field kind. */
function checkValue(kind: CmsFieldKind, scope: CmsScope, value: unknown, fail: Fail): unknown {
  switch (kind) {
    case 'string':
      return typeof value === 'string' ? value : fail('expected a string');
    case 'nullableString':
      return typeof value === 'string' || value === null
        ? value
        : fail('expected a string or null');
    case 'boolean':
      return typeof value === 'boolean' ? value : fail('expected a boolean');
    case 'badgeType':
      return projectBadgeSchema.safeParse(value).success
        ? value
        : fail(`expected one of ${projectBadgeSchema.options.join(', ')}`);
    case 'stringList':
      return isStringArray(value) ? [...value] : fail('expected an array of strings');
    case 'sectionList': {
      const allowed: readonly string[] = scope === 'home' ? HOME_SECTION_KEYS : [];
      if (!isStringArray(value) || !value.every((key) => allowed.includes(key))) {
        return fail(`expected an array of ${allowed.join(', ')}`);
      }
      return new Set(value).size === value.length ? [...value] : fail('duplicate section');
    }
  }
}

/** `Array.from` visits holes, so a sparse array fails here just as its JSON form (`null`s) would. */
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && Array.from(value).every((entry) => typeof entry === 'string');

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const itemsOf = (tree: SiteTree, collection: CollectionKey): readonly CollectionNode[] =>
  tree[collection];

const withItems = (tree: SiteTree, collection: CollectionKey, items: CollectionNode[]) =>
  ({ ...tree, [collection]: items }) as SiteTree;
