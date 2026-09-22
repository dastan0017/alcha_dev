import {
  CMS_ATTR,
  CMS_SECTION_KEYS,
  CMS_SOURCE,
  DEFAULT_LOCALE,
  HOME_SECTION_KEYS,
  cmsNodeKey,
  cmsPath,
  isCmsParentMessage,
  isCollectionKey,
  isLocale,
  parseCmsItemRef,
  type CmsChildMessage,
  type CmsEditorMode,
  type CmsNode,
  type CmsNodeKind,
  type CmsRect,
  type CmsSectionKey,
  type CmsViewport,
  type HomeSectionKey,
} from '@alcha/shared';
import { LOCALE_NAV_ATTR } from '@/lib/cms';

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type Outgoing = DistributiveOmit<CmsChildMessage, 'source'>;
type HoverKeys = Omit<Extract<Outgoing, { type: 'hover' }>, 'type'>;

const sel = (attr: string) => `[${attr}]`;

/** Attribute per node kind, outermost first so an element's own section/list/item is known to its fields. */
const KIND_ATTRS = [
  ['section', CMS_ATTR.section],
  ['list', CMS_ATTR.list],
  ['item', CMS_ATTR.item],
  ['image', CMS_ATTR.image],
  ['field', CMS_ATTR.field],
  ['add', CMS_ATTR.add],
  ['hidden', CMS_ATTR.hidden],
] as const satisfies readonly (readonly [CmsNodeKind, string])[];

const ENCLOSING = [
  ['list', CMS_ATTR.list, 'listKey'],
  ['section', CMS_ATTR.section, 'sectionKey'],
] as const;

const NODE_SELECTOR = KIND_ATTRS.map(([, attr]) => sel(attr)).join(',');
const CONTROLS = 'a, button, [role="button"], label, summary';
/** contentEditable inside these is unreliable, so their fields open in the CRM instead. */
const EDIT_HOSTS = 'a, button, summary, label';
const NON_INLINE_HOSTS = 'button, summary, label';
/** Keyboard stops in edit mode: focus hovers them, Enter opens their drawer. */
const TAB_STOPS = `${sel(CMS_ATTR.item)}, ${sel(CMS_ATTR.image)}`;
/** Blocked in the rich contentEditable fallback: bold, italic, underline. */
const FORMAT_KEYS = new Set(['b', 'i', 'u']);

const NO_HOVER: HoverKeys = { field: null, image: null, item: null, section: null };

const inMode = (mode: CmsEditorMode) => `html[${CMS_ATTR.mode}="${mode}"]`;
const field = sel(CMS_ATTR.field);
const STYLE = `
${inMode('view')} ${sel(CMS_ATTR.previewUi)} { display: none !important; }
${inMode('edit')} ${field} { cursor: text; }
${inMode('edit')} ${field}:is(${sel(CMS_ATTR.rich)}, ${NON_INLINE_HOSTS}),
${inMode('edit')} :is(${NON_INLINE_HOSTS}) ${field} { cursor: pointer; }
${inMode('edit')} a { -webkit-user-drag: none; }
${field}[contenteditable] { outline: none; }
${sel(CMS_ATTR.add)}:hover { background: rgba(91, 52, 201, 0.09) !important; border-color: #5b34c9 !important; }
${sel(CMS_ATTR.hidden)}:hover { background: rgba(91, 52, 201, 0.1) !important; }
`;

const isSectionKey = (value: string): value is CmsSectionKey =>
  (CMS_SECTION_KEYS as readonly string[]).includes(value);

const isHideableSection = (value: string): value is HomeSectionKey =>
  (HOME_SECTION_KEYS as readonly string[]).includes(value);

const normalize = (text: string, multiline: boolean) =>
  (multiline ? text.replace(/\r\n/g, '\n') : text.replace(/[\r\n]+/g, ' ')).trim();

/** innerText keeps typed line breaks; text-transform is lifted so uppercase styling never becomes the value. */
function readText(el: HTMLElement): string {
  const hadStyle = el.hasAttribute('style');
  const transform = el.style.textTransform;
  el.style.textTransform = 'none';
  const text = el.innerText;
  el.style.textTransform = transform;
  if (!hadStyle) el.removeAttribute('style');
  return text;
}

/** plaintext-only where supported; older engines (Firefox < 136) throw on it and get a rich fallback. */
function makeEditable(el: HTMLElement): void {
  try {
    el.contentEditable = 'plaintext-only';
  } catch {
    el.contentEditable = 'true';
  }
}

function caretAt(x: number, y: number): { node: Node; offset: number } | null {
  if (typeof document.caretPositionFromPoint === 'function') {
    const position = document.caretPositionFromPoint(x, y);
    return position && { node: position.offsetNode, offset: position.offset };
  }
  const range = document.caretRangeFromPoint(x, y);
  return range && { node: range.startContainer, offset: range.startOffset };
}

function placeCaret(el: HTMLElement, x: number, y: number): void {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  const caret = caretAt(x, y);
  if (caret && el.contains(caret.node)) {
    range.setStart(caret.node, caret.offset);
    range.collapse(true);
  } else {
    range.selectNodeContents(el);
    range.collapse(false);
  }
  selection.removeAllRanges();
  selection.addRange(range);
}

function insertPlainText(text: string): void {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function leavesDocument(link: HTMLAnchorElement): boolean {
  const url = new URL(link.href);
  return url.origin !== location.origin || url.pathname !== location.pathname;
}

/** The drawer path of a focused tab stop: its image, else its item (`<collection>.<id>`). */
function tabStopPath(el: Element): string | null {
  const image = el.getAttribute(CMS_ATTR.image);
  if (image !== null) return image;
  const ref = parseCmsItemRef(el.getAttribute(CMS_ATTR.item) ?? '');
  return ref && cmsPath.item(ref.collection, ref.id);
}

function describe(
  el: Element,
  kind: CmsNodeKind,
  value: string,
  rect: CmsRect,
  nth: (base: string) => number,
): CmsNode | null {
  switch (kind) {
    case 'field': {
      const node: CmsNode = {
        key: cmsNodeKey.field(value, nth(`field:${value}`)),
        kind,
        rect,
        path: value,
      };
      if (el.hasAttribute(CMS_ATTR.multiline)) node.multiline = true;
      if (el.hasAttribute(CMS_ATTR.rich)) node.rich = true;
      return node;
    }
    case 'image':
      return { key: cmsNodeKey.image(value, nth(`image:${value}`)), kind, rect, path: value };
    case 'item': {
      const ref = parseCmsItemRef(value);
      return ref && { key: cmsNodeKey.item(ref.collection, ref.id), kind, rect, ...ref };
    }
    case 'list': {
      if (!isCollectionKey(value)) return null;
      const node: CmsNode = {
        key: cmsNodeKey.list(value, nth(`list:${value}`)),
        kind,
        rect,
        collection: value,
      };
      const layout = el.getAttribute(CMS_ATTR.listLayout);
      if (layout === 'grid' || layout === 'stack') node.layout = layout;
      return node;
    }
    case 'section': {
      if (!isSectionKey(value)) return null;
      const node: CmsNode = { key: cmsNodeKey.section(value), kind, rect, section: value };
      const label = el.getAttribute(CMS_ATTR.sectionLabel);
      const item = el.getAttribute(CMS_ATTR.sectionItem);
      if (label !== null) node.label = label;
      if (el.hasAttribute(CMS_ATTR.sectionHideable)) node.hideable = true;
      if (item !== null) node.sectionItem = item;
      return node;
    }
    case 'add':
      return isCollectionKey(value)
        ? { key: cmsNodeKey.add(value), kind, rect, collection: value }
        : null;
    case 'hidden':
      return isSectionKey(value)
        ? { key: cmsNodeKey.hidden(value), kind, rect, section: value }
        : null;
  }
}

interface ActiveEdit {
  el: HTMLElement;
  path: string;
  multiline: boolean;
  /** data-cms-value when present, else the rendered text. */
  original: string;
  hasRawValue: boolean;
  /** React owns these nodes: they are detached while editing and always put back. */
  children: ChildNode[];
}

/**
 * The preview side of docs/visual-editor.md §5: posts overlay nodes and hover to the
 * CRM, edits fields inline, blocks navigation and applies CRM commands. Returns the
 * cleanup.
 */
export function startPreviewBridge({
  parentOrigin,
  refresh,
}: {
  parentOrigin: string;
  refresh: () => void;
}): () => void {
  const root = document.documentElement;
  const controller = new AbortController();
  const { signal } = controller;

  let mode: CmsEditorMode = 'edit';
  let fontsReady = false;
  /** Pathname announced by the last 'ready'; a client-side navigation announces again. */
  let readyPathname: string | null = null;
  let lastNodes = '';
  let frame = 0;
  let hoverFrame = 0;
  let hoverTarget: EventTarget | null = null;
  let hoverState = JSON.stringify(NO_HOVER);
  let dirty = true;
  let keysByElement = new Map<Element, Partial<Record<CmsNodeKind, string>>>();
  let elementsByKey = new Map<string, Element>();
  let editing: ActiveEdit | null = null;
  /** A 'refresh' that arrived mid-edit, held back: React would overwrite the text being typed. */
  let refreshPending = false;
  /** Between pointerdown and pointerup: the blur ending an edit precedes the click that may start the next. */
  let pressing = false;
  /** Elements the bridge gave a tabindex; only these lose it again. */
  const tabStops = new Set<HTMLElement>();

  const post = (message: Outgoing) =>
    window.parent.postMessage({ source: CMS_SOURCE, ...message }, parentOrigin);

  function scan(): CmsNode[] {
    const nodes: CmsNode[] = [];
    const counts = new Map<string, number>();
    const nth = (base: string) => {
      const n = counts.get(base) ?? 0;
      counts.set(base, n + 1);
      return n;
    };
    keysByElement = new Map();
    elementsByKey = new Map();

    for (const el of document.querySelectorAll(NODE_SELECTOR)) {
      const keys: Partial<Record<CmsNodeKind, string>> = {};
      keysByElement.set(el, keys);
      // display:none elements keep their duplicate index but are not drawn.
      const visible = el.getClientRects().length > 0;
      const box = el.getBoundingClientRect();
      const rect: CmsRect = { x: box.x, y: box.y, w: box.width, h: box.height };

      for (const [kind, attr] of KIND_ATTRS) {
        const value = el.getAttribute(attr);
        const node = value === null ? null : describe(el, kind, value, rect, nth);
        if (!node) continue;
        keys[kind] = node.key;
        if (!elementsByKey.has(node.key)) elementsByKey.set(node.key, el);
        for (const [enclosingKind, enclosingAttr, prop] of ENCLOSING) {
          const owner = (kind === enclosingKind ? el.parentElement : el)?.closest(
            sel(enclosingAttr),
          );
          const key = owner && keysByElement.get(owner)?.[enclosingKind];
          if (key) node[prop] = key;
        }
        if (visible) nodes.push(node);
      }
    }
    dirty = false;
    return nodes;
  }

  const keyOf = (el: Element | null | undefined, kind: CmsNodeKind): string | null => {
    if (!el) return null;
    if (dirty) scan();
    return keysByElement.get(el)?.[kind] ?? null;
  };

  function publishNodes(force: boolean): void {
    const nodes = scan();
    const viewport: CmsViewport = {
      w: window.innerWidth,
      h: window.innerHeight,
      scrollY: window.scrollY,
      docH: root.scrollHeight,
    };
    const serialized = JSON.stringify([nodes, viewport]);
    const { pathname } = location;
    if (pathname !== readyPathname) {
      readyPathname = pathname;
      lastNodes = serialized;
      post({
        type: 'ready',
        pathname,
        locale: isLocale(root.lang) ? root.lang : DEFAULT_LOCALE,
        nodes,
        viewport,
      });
      return;
    }
    if (!force && serialized === lastNodes) return;
    lastNodes = serialized;
    post({ type: 'nodes', nodes, viewport });
  }

  function schedule(): void {
    if (!fontsReady || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      publishNodes(false);
    });
  }

  // ─── Hover & keyboard ───────────────────────────────────────────────────────

  function setHover(next: HoverKeys): void {
    const serialized = JSON.stringify(next);
    if (serialized === hoverState) return;
    hoverState = serialized;
    post({ type: 'hover', ...next });
  }

  function flushHover(): void {
    hoverFrame = 0;
    if (mode !== 'edit') return;
    const target = hoverTarget instanceof Element ? hoverTarget : null;
    const at = (kind: keyof HoverKeys, attr: string) => keyOf(target?.closest(sel(attr)), kind);
    setHover({
      field: at('field', CMS_ATTR.field),
      image: at('image', CMS_ATTR.image),
      item: at('item', CMS_ATTR.item),
      section: at('section', CMS_ATTR.section),
    });
  }

  function onPointerMove(event: PointerEvent): void {
    if (mode !== 'edit') return;
    hoverTarget = event.target;
    if (!hoverFrame) hoverFrame = requestAnimationFrame(flushHover);
  }

  /** Keyboard focus hovers a node exactly like the pointer does. */
  function onFocusIn(event: FocusEvent): void {
    if (mode !== 'edit') return;
    cancelAnimationFrame(hoverFrame);
    hoverTarget = event.target;
    flushHover();
  }

  function clearHover(): void {
    // A frame still pending from the last pointermove would re-post the node just left.
    cancelAnimationFrame(hoverFrame);
    hoverFrame = 0;
    hoverTarget = null;
    if (mode === 'edit') setHover(NO_HOVER);
  }

  /** Adds (edit mode) or removes tabindex on cards and images; the MutationObserver ignores these writes. */
  function syncTabStops(on: boolean): void {
    for (const el of tabStops) {
      if (on && el.isConnected) continue;
      el.removeAttribute('tabindex');
      tabStops.delete(el);
    }
    if (!on) return;
    for (const el of document.querySelectorAll<HTMLElement>(TAB_STOPS)) {
      if (el.hasAttribute('tabindex')) continue;
      el.tabIndex = 0;
      tabStops.add(el);
    }
  }

  /** On a focused card or image: Enter opens its drawer (the toolbar's «Изменить»), Escape leaves it. */
  function onKeyDown(event: KeyboardEvent): void {
    const target = event.target;
    if (
      mode !== 'edit' ||
      event.isComposing ||
      !(target instanceof HTMLElement) ||
      !target.matches(TAB_STOPS)
    ) {
      return;
    }
    if (event.key === 'Escape') {
      target.blur();
      clearHover();
    } else if (event.key === 'Enter') {
      const path = tabStopPath(target);
      if (!path) return;
      // A card that is a link would otherwise activate it.
      event.preventDefault();
      post({ type: 'open-field', path });
    }
  }

  // ─── Inline editing ─────────────────────────────────────────────────────────

  function onEditKeyDown(event: KeyboardEvent): void {
    if (!editing || event.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      endEdit(false);
    } else if (event.key === 'Enter' && !editing.multiline) {
      event.preventDefault();
      endEdit(true);
    } else if (
      (event.metaKey || event.ctrlKey) &&
      FORMAT_KEYS.has(event.key.toLowerCase()) &&
      editing.el.contentEditable === 'true'
    ) {
      event.preventDefault();
    }
  }

  function onEditPaste(event: ClipboardEvent): void {
    if (!editing) return;
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') ?? '';
    insertPlainText(editing.multiline ? text : text.replace(/[\r\n]+/g, ' '));
  }

  function onEditBlur(): void {
    endEdit(true);
  }

  function startEdit(el: HTMLElement, x: number, y: number): void {
    // Switching fields keeps a held-back refresh for the next edit.
    closeEdit(true);
    const path = el.getAttribute(CMS_ATTR.field) ?? '';
    const raw = el.getAttribute(CMS_ATTR.value);
    const original = raw ?? el.textContent ?? '';
    makeEditable(el);
    editing = {
      el,
      path,
      multiline: el.hasAttribute(CMS_ATTR.multiline),
      original,
      hasRawValue: raw !== null,
      children: Array.from(el.childNodes),
    };
    // The browser edits a stand-in text node, so React's nodes are never mutated or dropped.
    el.replaceChildren(original);
    el.addEventListener('keydown', onEditKeyDown);
    el.addEventListener('paste', onEditPaste);
    el.addEventListener('blur', onEditBlur);
    el.focus({ preventScroll: true });
    placeCaret(el, x, y);
    post({ type: 'edit-start', path, key: keyOf(el, 'field') ?? cmsNodeKey.field(path) });
  }

  /** Puts React's nodes back and reports the edit; true when a new value was committed. */
  function closeEdit(commit: boolean): boolean {
    if (!editing) return false;
    const { el, path, multiline, original, hasRawValue, children } = editing;
    editing = null;
    el.removeEventListener('keydown', onEditKeyDown);
    el.removeEventListener('paste', onEditPaste);
    el.removeEventListener('blur', onEditBlur);

    const before = normalize(original, multiline);
    const value = commit ? normalize(readText(el), multiline) : before;
    el.removeAttribute('contenteditable');
    el.replaceChildren(...children);
    window.getSelection()?.removeAllRanges();

    const committed = value !== before;
    if (committed) {
      const [only] = children;
      if (!hasRawValue && children.length === 1 && only.nodeType === Node.TEXT_NODE)
        only.nodeValue = value;
      post({ type: 'edit-commit', path, value });
    }
    post({ type: 'edit-end', path });
    return committed;
  }

  /**
   * Ends the edit and runs a refresh it held back, once no edit is active (after a click,
   * which may start the next one). A commit drops it instead: the CRM refreshes again once
   * that commit is saved, and the older render would flash the previous text back in.
   */
  function endEdit(commit: boolean): void {
    if (closeEdit(commit)) refreshPending = false;
    else if (!pressing) flushRefresh();
  }

  function flushRefresh(): void {
    if (!refreshPending || editing || signal.aborted) return;
    refreshPending = false;
    refresh();
  }

  function onPointerDown(): void {
    pressing = true;
  }

  function onPointerUp(): void {
    pressing = false;
    // A timeout runs after this press's click has had its chance to start an edit.
    setTimeout(flushRefresh);
  }

  // ─── Clicks & navigation ────────────────────────────────────────────────────

  function onClick(event: MouseEvent): void {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const swallow = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    if (editing?.el.contains(target)) return swallow();

    if (target.closest(sel(CMS_ATTR.previewUi))) {
      if (mode !== 'edit' || event.type !== 'click') return;
      const collection = target.closest(sel(CMS_ATTR.add))?.getAttribute(CMS_ATTR.add);
      const section = target.closest(sel(CMS_ATTR.hidden))?.getAttribute(CMS_ATTR.hidden);
      if (collection && isCollectionKey(collection)) {
        swallow();
        post({ type: 'add', collection });
      } else if (section && isHideableSection(section)) {
        swallow();
        post({ type: 'show-section', section });
      }
      return;
    }

    // Locale controls navigate client-side, with no href for the link checks below; the
    // CRM's own RU/EN switch picks the locale.
    const localeNav = target.closest(sel(LOCALE_NAV_ATTR));
    if (localeNav) {
      swallow();
      if (event.type === 'click') {
        post({
          type: 'navigation-blocked',
          href: new URL(localeNav.getAttribute(LOCALE_NAV_ATTR) ?? '', location.href).href,
        });
      }
      return;
    }

    if (mode === 'view') {
      const link = target.closest('a[href]');
      if (link instanceof HTMLAnchorElement && leavesDocument(link)) {
        swallow();
        post({ type: 'navigation-blocked', href: link.href });
      }
      return;
    }

    const fieldEl = event.type === 'click' ? target.closest<HTMLElement>(field) : null;
    if (fieldEl) {
      swallow();
      if (
        fieldEl.hasAttribute(CMS_ATTR.rich) ||
        fieldEl.closest(EDIT_HOSTS)?.matches(NON_INLINE_HOSTS)
      ) {
        post({ type: 'open-field', path: fieldEl.getAttribute(CMS_ATTR.field) ?? '' });
      } else {
        startEdit(fieldEl, event.clientX, event.clientY);
      }
      return;
    }

    const control = target.closest(CONTROLS);
    if (control) {
      swallow();
      if (control instanceof HTMLAnchorElement && control.hasAttribute('href')) {
        post({ type: 'navigation-blocked', href: control.href });
      }
    }
  }

  function onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  // ─── CRM → iframe ───────────────────────────────────────────────────────────

  function setMode(next: CmsEditorMode): void {
    if (next === 'view') {
      endEdit(true);
      cancelAnimationFrame(hoverFrame);
      hoverFrame = 0;
      hoverState = JSON.stringify(NO_HOVER);
    }
    mode = next;
    root.setAttribute(CMS_ATTR.mode, next);
    syncTabStops(next === 'edit');
    schedule();
  }

  function patchText(path: string, value: string): void {
    for (const el of document.querySelectorAll(`[${CMS_ATTR.field}="${CSS.escape(path)}"]`)) {
      const text = el.firstChild;
      if (el === editing?.el || el.hasAttribute(CMS_ATTR.value) || el.childNodes.length !== 1)
        continue;
      if (text?.nodeType === Node.TEXT_NODE) text.nodeValue = value;
    }
  }

  /** Renews the cookie the draft reads authenticate with, so a long session outlives its first token. */
  function renewPreviewToken(token: string): void {
    const url = `/api/preview?${new URLSearchParams({ token, refresh: '1' })}`;
    // On failure the current cookie stays in place until it expires.
    void fetch(url, { credentials: 'same-origin', cache: 'no-store' }).catch(() => undefined);
  }

  function onMessage(event: MessageEvent): void {
    if (
      event.origin !== parentOrigin ||
      event.source !== window.parent ||
      !isCmsParentMessage(event.data)
    ) {
      return;
    }
    const message = event.data;
    switch (message.type) {
      case 'mode':
        if (message.mode === 'edit' || message.mode === 'view') setMode(message.mode);
        break;
      case 'patch':
        if (typeof message.path === 'string' && typeof message.value === 'string') {
          patchText(message.path, message.value);
        }
        break;
      case 'refresh':
        if (editing) refreshPending = true;
        else refresh();
        break;
      case 'scroll-to':
        scan();
        elementsByKey.get(message.key)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        break;
      case 'preview-token':
        if (typeof message.token === 'string') renewPreviewToken(message.token);
        break;
      case 'scroll-by':
        // The overlay's controls live in the CRM document, so the wheel never reaches us.
        if (Number.isFinite(message.dx) && Number.isFinite(message.dy)) {
          window.scrollBy({ left: message.dx, top: message.dy, behavior: 'instant' });
        }
        break;
    }
  }

  // ─── Wiring ─────────────────────────────────────────────────────────────────

  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.append(style);
  setMode('edit');

  window.addEventListener('message', onMessage, { signal });
  window.addEventListener('click', onClick, { capture: true, signal });
  window.addEventListener('auxclick', onClick, { capture: true, signal });
  window.addEventListener('submit', onSubmit, { capture: true, signal });
  window.addEventListener('keydown', onKeyDown, { signal });
  window.addEventListener('focusin', onFocusIn, { signal });
  window.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true, signal });
  window.addEventListener('pointerup', onPointerUp, { capture: true, passive: true, signal });
  window.addEventListener('pointercancel', onPointerUp, { capture: true, passive: true, signal });
  window.addEventListener('pointermove', onPointerMove, { passive: true, signal });
  root.addEventListener('pointerleave', clearHover, { signal });
  window.addEventListener('blur', clearHover, { signal });
  // Capture on window sees the document scroll and every element scroll (carousels).
  window.addEventListener('scroll', schedule, { capture: true, passive: true, signal });
  window.addEventListener('resize', schedule, { signal });

  const mutations = new MutationObserver((records) => {
    if (records.every((record) => record.attributeName === 'tabindex')) return;
    dirty = true;
    if (editing && !editing.el.isConnected) endEdit(true);
    // Cards and images a refresh brought in.
    if (mode === 'edit') syncTabStops(true);
    schedule();
  });
  mutations.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
  });
  const resizes = new ResizeObserver(schedule);
  resizes.observe(document.body);

  void document.fonts.ready.then(() => {
    if (signal.aborted) return;
    fontsReady = true;
    publishNodes(false);
  });

  return () => {
    controller.abort();
    endEdit(false);
    mutations.disconnect();
    resizes.disconnect();
    cancelAnimationFrame(frame);
    cancelAnimationFrame(hoverFrame);
    syncTabStops(false);
    style.remove();
    root.removeAttribute(CMS_ATTR.mode);
  };
}
