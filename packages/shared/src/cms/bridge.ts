import type { Locale } from '../constants/locales';
import type { HomeSectionKey } from '../dto/enums';
import { CMS_ID_PATTERN, isCollectionKey, type CmsSectionKey, type CollectionKey } from './tree';

/** `source` of every postMessage between the CRM and the preview iframe. */
export const CMS_SOURCE = 'alcha-cms';

/** Preview-only DOM attributes the web emits for the bridge (docs/visual-editor.md §4). */
export const CMS_ATTR = {
  field: 'data-cms-field',
  multiline: 'data-cms-multiline',
  value: 'data-cms-value',
  rich: 'data-cms-rich',
  image: 'data-cms-image',
  item: 'data-cms-item',
  list: 'data-cms-list',
  listLayout: 'data-cms-list-layout',
  section: 'data-cms-section',
  sectionLabel: 'data-cms-section-label',
  sectionHideable: 'data-cms-section-hideable',
  sectionItem: 'data-cms-section-item',
  add: 'data-cms-add',
  hidden: 'data-cms-hidden',
  previewUi: 'data-cms-preview-ui',
  /** On `<html>`: the current editor mode. */
  mode: 'data-cms-mode',
} as const;

/** `data-cms-section-label` per section, also shown for a hidden section (docs/visual-editor.md §4). */
export const CMS_SECTION_LABELS: Record<CmsSectionKey, string> = {
  header: 'Шапка',
  hero: 'Первый экран',
  process: 'Процесс и услуги',
  works: 'Работы',
  pricing: 'Цены',
  cta: 'Призыв к действию',
  footer: 'Подвал',
  case: 'Кейс проекта',
};

export type CmsNodeKind = 'field' | 'image' | 'item' | 'list' | 'section' | 'add' | 'hidden';
export type CmsListLayout = 'grid' | 'stack';
export type CmsEditorMode = 'edit' | 'view';

/** Iframe viewport coordinates (getBoundingClientRect). */
export interface CmsRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CmsViewport {
  w: number;
  h: number;
  scrollY: number;
  docH: number;
}

export interface CmsNode {
  key: string;
  kind: CmsNodeKind;
  rect: CmsRect;
  path?: string;
  collection?: CollectionKey;
  id?: string;
  section?: CmsSectionKey;
  label?: string;
  hideable?: boolean;
  /** `<collection>:<id>` of the item a section renders (case page). */
  sectionItem?: string;
  layout?: CmsListLayout;
  multiline?: boolean;
  rich?: boolean;
  /** Keys of the nearest enclosing list / section nodes. */
  listKey?: string;
  sectionKey?: string;
}

type CmsMessage<T extends string, P = unknown> = { source: typeof CMS_SOURCE; type: T } & P;

/** iframe → CRM. */
export type CmsChildMessage =
  | CmsMessage<
      'ready',
      { pathname: string; locale: Locale; nodes: CmsNode[]; viewport: CmsViewport }
    >
  /** rAF-throttled on scroll, resize and DOM mutations. */
  | CmsMessage<'nodes', { nodes: CmsNode[]; viewport: CmsViewport }>
  /** Hovered node keys at every level at once. */
  | CmsMessage<
      'hover',
      { field: string | null; image: string | null; item: string | null; section: string | null }
    >
  | CmsMessage<'edit-start', { path: string; key: string }>
  | CmsMessage<'edit-commit', { path: string; value: string }>
  | CmsMessage<'edit-end', { path: string }>
  /**
   * Click on a field that is not edited inline (`data-cms-rich`, or inside a button / label /
   * summary), or Enter on a focused card (`<collection>.<id>`) or image (its path).
   */
  | CmsMessage<'open-field', { path: string }>
  /** Ghost slot clicked. */
  | CmsMessage<'add', { collection: CollectionKey }>
  /** «Показать» on a hidden-section strip. */
  | CmsMessage<'show-section', { section: HomeSectionKey }>
  | CmsMessage<'navigation-blocked', { href: string }>;

/** CRM → iframe. */
export type CmsParentMessage =
  | CmsMessage<'mode', { mode: CmsEditorMode }>
  /** Optimistic text on every matching leaf. */
  | CmsMessage<'patch', { path: string; value: string }>
  /** router.refresh() once every change is saved; held back while a field is edited inline. */
  | CmsMessage<'refresh'>
  | CmsMessage<'scroll-to', { key: string }>
  /** Fresh preview token: the bridge renews its preview cookie without reloading. */
  | CmsMessage<'preview-token', { token: string }>
  /**
   * Wheel over an overlay control (card toolbar, section chip, photo scrim): those sit in the
   * CRM document, so the preview never sees the event — the CRM forwards the delta instead.
   */
  | CmsMessage<'scroll-by', { dx: number; dy: number }>;

const CHILD_MESSAGE_TYPES: Record<CmsChildMessage['type'], true> = {
  ready: true,
  nodes: true,
  hover: true,
  'edit-start': true,
  'edit-commit': true,
  'edit-end': true,
  'open-field': true,
  add: true,
  'show-section': true,
  'navigation-blocked': true,
};

const PARENT_MESSAGE_TYPES: Record<CmsParentMessage['type'], true> = {
  mode: true,
  patch: true,
  refresh: true,
  'scroll-to': true,
  'preview-token': true,
  'scroll-by': true,
};

function hasKnownType(data: unknown, types: Record<string, true>): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const { source, type } = data as { source?: unknown; type?: unknown };
  return source === CMS_SOURCE && typeof type === 'string' && Object.hasOwn(types, type);
}

/** Cheap structural check (source + known type); origin checks stay with the caller. */
export function isCmsChildMessage(data: unknown): data is CmsChildMessage {
  return hasKnownType(data, CHILD_MESSAGE_TYPES);
}

/** Cheap structural check (source + known type); origin checks stay with the caller. */
export function isCmsParentMessage(data: unknown): data is CmsParentMessage {
  return hasKnownType(data, PARENT_MESSAGE_TYPES);
}

/** `data-cms-item` / `data-cms-section-item` value. */
export function cmsItemRef(collection: CollectionKey, id: string): string {
  return `${collection}:${id}`;
}

export function parseCmsItemRef(ref: string): { collection: CollectionKey; id: string } | null {
  const [collection, id, ...extra] = ref.split(':');
  return isCollectionKey(collection) &&
    id !== undefined &&
    extra.length === 0 &&
    CMS_ID_PATTERN.test(id)
    ? { collection, id }
    : null;
}

const withDuplicate = (key: string, n?: number) => (n ? `${key}#${n}` : key);

/** Overlay node keys; `n` is the DOM-order duplicate index (the first occurrence has no suffix). */
export const cmsNodeKey = {
  field: (path: string, n?: number) => withDuplicate(`field:${path}`, n),
  image: (path: string, n?: number) => withDuplicate(`image:${path}`, n),
  item: (collection: CollectionKey, id: string) => `item:${cmsItemRef(collection, id)}`,
  list: (collection: CollectionKey, n?: number) => withDuplicate(`list:${collection}`, n),
  section: (key: CmsSectionKey) => `section:${key}`,
  add: (collection: CollectionKey) => `add:${collection}`,
  hidden: (section: CmsSectionKey) => `hidden:${section}`,
};
