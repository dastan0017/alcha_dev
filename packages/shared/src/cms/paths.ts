import { isLocale, type Locale } from '../constants/locales';
import {
  CMS_FIELD_MODEL,
  CMS_ID_PATTERN,
  isCollectionKey,
  type CmsFieldKind,
  type CmsLocalizedField,
  type CmsNeutralField,
  type CmsScope,
  type CmsSingletonScope,
  type CollectionKey,
  type CollectionNode,
  type SiteTree,
} from './tree';

const withIndex = (path: string, index?: number) =>
  index === undefined ? path : `${path}.${index}`;

/** Dot-path builders (docs/visual-editor.md §2). Items are addressed by id, list entries by index. */
export const cmsPath = {
  home: (locale: Locale, field: CmsLocalizedField<'home'>, index?: number) =>
    withIndex(`home.${locale}.${field}`, index),
  homeNeutral: (field: CmsNeutralField<'home'>) => `home.${field}`,
  chrome: (locale: Locale, field: CmsLocalizedField<'chrome'>) => `chrome.${locale}.${field}`,
  collection: <C extends CollectionKey>(collection: C): C => collection,
  item: (collection: CollectionKey, id: string) => `${collection}.${id}`,
  itemField: <C extends CollectionKey>(
    collection: C,
    id: string,
    field: CmsNeutralField<C>,
    index?: number,
  ) => withIndex(`${collection}.${id}.${field}`, index),
  itemLocale: <C extends CollectionKey>(
    collection: C,
    id: string,
    locale: Locale,
    field: CmsLocalizedField<C>,
    index?: number,
  ) => withIndex(`${collection}.${id}.${locale}.${field}`, index),
};

/** A leaf: `locale` is null for neutral fields; `index` is set only on string-list entries. */
export interface CmsFieldTarget {
  locale: Locale | null;
  field: string;
  fieldKind: CmsFieldKind;
  index: number | null;
}

export type ParsedCmsPath =
  | ({ kind: 'field'; scope: CmsSingletonScope } & CmsFieldTarget)
  | { kind: 'collection'; collection: CollectionKey }
  | { kind: 'item'; collection: CollectionKey; id: string }
  | ({ kind: 'itemField'; collection: CollectionKey; id: string } & CmsFieldTarget);

const INDEX_PATTERN = /^(0|[1-9]\d*)$/;

function parseFieldTarget(scope: CmsScope, segments: string[]): CmsFieldTarget | null {
  const [head, ...tail] = segments;
  const locale = isLocale(head) ? head : null;
  const [field, indexSegment, ...extra] = locale ? tail : segments;
  if (field === undefined || extra.length > 0) return null;

  const fields: Record<string, CmsFieldKind> = locale
    ? CMS_FIELD_MODEL[scope].localized
    : CMS_FIELD_MODEL[scope].neutral;
  if (!Object.hasOwn(fields, field)) return null;
  const fieldKind = fields[field];
  if (indexSegment === undefined) return { locale, field, fieldKind, index: null };

  const index = Number(indexSegment);
  if (
    fieldKind !== 'stringList' ||
    !INDEX_PATTERN.test(indexSegment) ||
    !Number.isSafeInteger(index)
  ) {
    return null;
  }
  return { locale, field, fieldKind, index };
}

/** Parses a CMS path; null for anything outside the field model (unknown field, locale, index…). */
export function parseCmsPath(path: string): ParsedCmsPath | null {
  const [head, ...rest] = path.split('.');
  if (head === 'home' || head === 'chrome') {
    const target = parseFieldTarget(head, rest);
    return target ? { kind: 'field', scope: head, ...target } : null;
  }
  if (!isCollectionKey(head)) return null;
  if (rest.length === 0) return { kind: 'collection', collection: head };

  const [id, ...fieldSegments] = rest;
  if (!CMS_ID_PATTERN.test(id)) return null;
  if (fieldSegments.length === 0) return { kind: 'item', collection: head, id };
  const target = parseFieldTarget(head, fieldSegments);
  return target ? { kind: 'itemField', collection: head, id, ...target } : null;
}

/** Value at `path` (leaf, list, item or collection); undefined for invalid paths and missing ids/indexes. */
export function getAtPath(tree: SiteTree, path: string): unknown {
  const parsed = parseCmsPath(path);
  if (!parsed) return undefined;
  if (parsed.kind === 'collection') return tree[parsed.collection];

  let owner: Record<string, unknown>;
  if (parsed.kind === 'field') {
    owner = tree[parsed.scope];
  } else {
    const items: readonly CollectionNode[] = tree[parsed.collection];
    const node = items.find((item) => item.id === parsed.id);
    if (!node || parsed.kind === 'item') return node;
    owner = node;
  }

  const record = parsed.locale ? (owner[parsed.locale] as Record<string, unknown>) : owner;
  const value = record[parsed.field];
  return parsed.index === null ? value : (value as readonly string[])[parsed.index];
}
