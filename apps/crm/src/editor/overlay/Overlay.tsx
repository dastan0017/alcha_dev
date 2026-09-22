import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEventHandler,
} from 'react';
import { CMS_SECTION_LABELS, type CmsNode, type CmsRect, type CmsViewport } from '@alcha/shared';
import { cx } from '../ui';
import { useBridgeState, type BridgeStore, type HoverKeys } from '../useBridge';
import styles from './Overlay.module.css';

/** Hover survives this long after the pointer leaves the iframe, so it can reach the controls. */
const LEAVE_DELAY_MS = 150;
/** Floating controls keep this distance from the frame edges. */
const EDGE = 6;
/** How far the section chip reaches into its section; the rest sits above the top edge. */
const CHIP_OVERLAP = 16;
/** The section chip's inset from the section's left / right edge. */
const CHIP_INDENT = 12;
/** A field's hover outline and edit ring reach this far outside its rect. */
const OUTLINE_REACH = 6;
/** Wheel deltas arrive in lines or pages on some mice; the preview scrolls in pixels. */
const WHEEL_LINE_PX = 16;
const WHEEL_PAGE_PX = 400;

export interface OverlayActions {
  onEditItem: (item: CmsNode) => void;
  onDuplicateItem: (item: CmsNode) => void;
  onDeleteItem: (item: CmsNode) => void;
  /** Move `item` to where `neighbour` (the previous / next card of the same list) is. */
  onMoveItem: (item: CmsNode, neighbour: CmsNode) => void;
  onEditSection: (section: CmsNode) => void;
  onHideSection: (section: CmsNode) => void;
  onReplaceImage: (image: CmsNode) => void;
  /** Wheel over a control: the preview cannot see that event, so the CRM forwards the delta. */
  onWheelScroll: (dx: number, dy: number) => void;
}

interface ControlHandlers {
  /** Stable ref callback: releases the held hover when this control's element goes away under the pointer. */
  ref: (element: HTMLElement | null) => (() => void) | undefined;
  onPointerEnter: PointerEventHandler;
  onPointerLeave: PointerEventHandler;
  /** Structural WheelEvent shape, so React's handler type still accepts it. */
  onWheel: (event: { deltaX: number; deltaY: number; deltaMode: number }) => void;
}

/**
 * Transient editing affordances over the preview iframe (docs/visual-editor.md D8): hover
 * outlines, the inline-edit ring, card toolbars, section chips and the photo scrim. Mount
 * it only in edit mode with no dialog open; the layer ignores the pointer, its buttons don't.
 */
export function Overlay({ store, ...actions }: OverlayActions & { store: BridgeStore }) {
  const ready = useBridgeState(store, (state) => state.ready);
  const editingKey = useBridgeState(store, (state) => state.editing?.key ?? null);
  const { hover, controls: hoverControls } = useStickyHover(store);
  const controls: ControlHandlers = {
    ...hoverControls,
    onWheel: ({ deltaX, deltaY, deltaMode }) => {
      // deltaMode: 0 pixels, 1 lines, 2 pages.
      const scale = deltaMode === 1 ? WHEEL_LINE_PX : deltaMode === 2 ? WHEEL_PAGE_PX : 1;
      actions.onWheelScroll(deltaX * scale, deltaY * scale);
    },
  };

  if (!ready) return null;
  return (
    <div className={styles.layer}>
      {hover.field && hover.field !== editingKey && (
        <NodeBox store={store} nodeKey={hover.field} className={styles.fieldHover} />
      )}
      {editingKey && <NodeBox store={store} nodeKey={editingKey} className={styles.editRing} />}
      {hover.item && <NodeBox store={store} nodeKey={hover.item} className={styles.itemHover} />}
      {/* A text field inside a photo keeps its own outline, without the scrim. */}
      {hover.image && !hover.field && (
        <ImageScrim
          store={store}
          nodeKey={hover.image}
          controls={controls}
          onReplace={actions.onReplaceImage}
        />
      )}
      {/* The card toolbar wins: no section chip while a card is hovered. */}
      {hover.section && !hover.item && (
        <SectionChip
          key={hover.section}
          store={store}
          nodeKey={hover.section}
          avoid={[hover.field, editingKey, hover.image]}
          controls={controls}
          actions={actions}
        />
      )}
      {hover.item && (
        <ItemToolbar store={store} nodeKey={hover.item} controls={controls} actions={actions} />
      )}
    </div>
  );
}

const isEmpty = (hover: HoverKeys) => !hover.field && !hover.image && !hover.item && !hover.section;

/** The iframe's hover, held while the pointer is over overlay controls and briefly after it leaves. */
function useStickyHover(store: BridgeStore) {
  const reported = useBridgeState(store, (state) => state.hover);
  const [hover, setHover] = useState(reported);
  /** The control under the pointer, if any. */
  const overControl = useRef<EventTarget | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const settleLater = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setHover(store.get().hover), LEAVE_DELAY_MS);
  }, [store]);

  useEffect(() => {
    if (overControl.current) return;
    if (isEmpty(reported)) {
      settleLater();
    } else {
      clearTimeout(timer.current);
      setHover(reported);
    }
  }, [reported, settleLater]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // React fires no pointerleave for an element removed under the pointer («Удалить», «Скрыть секцию»).
  const ref = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;
      return () => {
        if (overControl.current !== element) return;
        overControl.current = null;
        settleLater();
      };
    },
    [settleLater],
  );

  // The wheel forwarder is added by the Overlay, which knows the bridge.
  const controls: Omit<ControlHandlers, 'onWheel'> = {
    ref,
    onPointerEnter: (event) => {
      overControl.current = event.currentTarget;
      clearTimeout(timer.current);
    },
    onPointerLeave: () => {
      overControl.current = null;
      settleLater();
    },
  };
  return { hover, controls };
}

/** The node while it has a drawable rect. */
function useVisibleNode(store: BridgeStore, key: string): CmsNode | null {
  const node = useBridgeState(store, (state) => state.byKey.get(key));
  return node && node.rect.w > 0 && node.rect.h > 0 ? node : null;
}

const boxStyle = (rect: CmsRect): CSSProperties => ({
  left: rect.x,
  top: rect.y,
  width: rect.w,
  height: rect.h,
});

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const overlaps = (a: CmsRect, b: CmsRect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** The part of `rect` inside the frame. */
function clipToFrame({ x, y, w, h }: CmsRect, frame: CmsViewport): CmsRect {
  const left = Math.max(x, 0);
  const top = Math.max(y, 0);
  return {
    x: left,
    y: top,
    w: Math.max(Math.min(x + w, frame.w) - left, 0),
    h: Math.max(Math.min(y + h, frame.h) - top, 0),
  };
}

interface Size {
  w: number;
  h: number;
}

/**
 * A floating control's stable ref: measures the element (again when its fonts load), since
 * placement needs its size, and holds the hover like `controls.ref`. Until measured, render
 * the control hidden.
 */
function useMeasuredControl(holdRef: ControlHandlers['ref']) {
  const [size, setSize] = useState<Size | null>(null);
  const ref = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;
      // Reports before the next paint.
      const observer = new ResizeObserver(() => {
        const { offsetWidth: w, offsetHeight: h } = element;
        setSize((current) => (current?.w === w && current.h === h ? current : { w, h }));
      });
      observer.observe(element);
      const release = holdRef(element);
      return () => {
        observer.disconnect();
        release?.();
      };
    },
    [holdRef],
  );
  return { ref, size };
}

const HIDDEN: CSSProperties = { left: 0, top: 0, visibility: 'hidden' };

function NodeBox({
  store,
  nodeKey,
  className,
}: {
  store: BridgeStore;
  nodeKey: string;
  className: string;
}) {
  const node = useVisibleNode(store, nodeKey);
  return (
    node && (
      <div aria-hidden="true" className={cx(styles.box, className)} style={boxStyle(node.rect)} />
    )
  );
}

interface ControlsProps {
  store: BridgeStore;
  nodeKey: string;
  controls: ControlHandlers;
}

/** Tint over the photo's visible part; only its button takes the pointer, so the wheel still scrolls the preview. */
function ImageScrim({
  store,
  nodeKey,
  controls,
  onReplace,
}: ControlsProps & { onReplace: (image: CmsNode) => void }) {
  const node = useVisibleNode(store, nodeKey);
  const viewport = useBridgeState(store, (state) => state.viewport);
  if (!node || !viewport) return null;
  return (
    <div
      className={cx(styles.box, styles.scrim)}
      style={boxStyle(clipToFrame(node.rect, viewport))}
    >
      <button
        type="button"
        className={styles.scrimButton}
        onClick={() => onReplace(node)}
        {...controls}
      >
        Заменить фото
      </button>
    </div>
  );
}

const MOVE_LABELS = {
  row: { prev: ['←', 'Переместить левее'], next: ['→', 'Переместить правее'] },
  column: { prev: ['↑', 'Переместить выше'], next: ['↓', 'Переместить ниже'] },
} as const;

/**
 * ↑ ↓ when the neighbouring card shares this card's column (a stack, or a grid collapsed to
 * one column on a phone), ← → otherwise; the list's declared layout decides for a lone card.
 */
function moveAxis(
  node: CmsNode,
  neighbour: CmsNode | undefined,
  list: CmsNode | undefined,
): keyof typeof MOVE_LABELS {
  if (!neighbour) return list?.layout === 'stack' ? 'column' : 'row';
  const { rect: a } = node;
  const { rect: b } = neighbour;
  const sharedWidth = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  return sharedWidth > Math.min(a.w, b.w) / 2 ? 'column' : 'row';
}

function ItemToolbar({
  store,
  nodeKey,
  controls,
  actions,
}: ControlsProps & { actions: OverlayActions }) {
  const node = useVisibleNode(store, nodeKey);
  const nodes = useBridgeState(store, (state) => state.nodes);
  const byKey = useBridgeState(store, (state) => state.byKey);
  const viewport = useBridgeState(store, (state) => state.viewport);
  const { ref: holdRef, ...handlers } = controls;
  const { ref, size } = useMeasuredControl(holdRef);
  if (!node || !viewport) return null;

  const list = node.listKey ? byKey.get(node.listKey) : undefined;
  const siblings = list
    ? nodes.filter((other) => other.kind === 'item' && other.listKey === list.key)
    : [];
  const index = siblings.findIndex((other) => other.key === node.key);
  const [prev, next] = [siblings[index - 1], siblings[index + 1]];
  const labels = MOVE_LABELS[moveAxis(node, prev ?? next, list)];
  const { x, y, w } = node.rect;
  // Right-aligned just above the card, kept inside the frame (a 390px carousel card is narrower than the toolbar).
  const place: CSSProperties = size
    ? {
        left: clamp(x + w - 12 - size.w, EDGE, viewport.w - size.w - EDGE),
        top: clamp(y - 18, EDGE, viewport.h - size.h - EDGE),
      }
    : HIDDEN;

  const moveButton = (
    neighbour: CmsNode | undefined,
    [glyph, label]: readonly [string, string],
  ) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={!neighbour}
      className={cx(styles.tool, styles.arrow)}
      onClick={() => neighbour && actions.onMoveItem(node, neighbour)}
    >
      {glyph}
    </button>
  );

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Карточка"
      className={styles.toolbar}
      style={place}
      {...handlers}
    >
      {index >= 0 && (
        <>
          {moveButton(prev, labels.prev)}
          {moveButton(next, labels.next)}
          <span aria-hidden="true" className={styles.divider} />
        </>
      )}
      <button
        type="button"
        className={cx(styles.tool, styles.primaryTool)}
        onClick={() => actions.onEditItem(node)}
      >
        Изменить
      </button>
      <button type="button" className={styles.tool} onClick={() => actions.onDuplicateItem(node)}>
        Копия
      </button>
      <button
        type="button"
        className={cx(styles.tool, styles.dangerTool)}
        onClick={() => actions.onDeleteItem(node)}
      >
        Удалить
      </button>
    </div>
  );
}

const clearOf = (box: CmsRect, rects: readonly CmsRect[]) =>
  !rects.some((rect) => overlaps(box, rect));

/**
 * Where the section chip goes: straddling the section's top edge at its left or right end,
 * kept inside the frame. The first spot clear of any `content` wins, else the first clear of
 * `avoid` (what is hovered or edited); null when both spots cover one of those.
 */
function placeChip(
  section: CmsRect,
  chip: Size,
  frame: Size,
  avoid: readonly CmsRect[],
  content: readonly CmsRect[],
) {
  const top = clamp(section.y + CHIP_OVERLAP - chip.h, EDGE, frame.h - chip.h - EDGE);
  const spots = [section.x + CHIP_INDENT, section.x + section.w - CHIP_INDENT - chip.w].map(
    (left) => ({
      x: clamp(left, EDGE, frame.w - chip.w - EDGE),
      y: top,
      w: chip.w,
      h: chip.h,
    }),
  );
  const spot =
    spots.find((box) => clearOf(box, avoid) && clearOf(box, content)) ??
    spots.find((box) => clearOf(box, avoid));
  return spot ? { left: spot.x, top: spot.y } : null;
}

const CONTENT_KINDS: ReadonlySet<CmsNode['kind']> = new Set(['field', 'image', 'item', 'add']);

const outlined = ({ x, y, w, h }: CmsRect): CmsRect => ({
  x: x - OUTLINE_REACH,
  y: y - OUTLINE_REACH,
  w: w + 2 * OUTLINE_REACH,
  h: h + 2 * OUTLINE_REACH,
});

interface SectionChipProps extends ControlsProps {
  /** Keys of the hovered / edited nodes the chip must not cover. */
  avoid: readonly (string | null)[];
  actions: OverlayActions;
}

function SectionChip({ store, nodeKey, avoid, controls, actions }: SectionChipProps) {
  const node = useVisibleNode(store, nodeKey);
  const nodes = useBridgeState(store, (state) => state.nodes);
  const byKey = useBridgeState(store, (state) => state.byKey);
  const viewport = useBridgeState(store, (state) => state.viewport);
  const { ref: holdRef, ...handlers } = controls;
  const { ref, size } = useMeasuredControl(holdRef);

  if (!node?.section || !viewport) return null;
  const label = node.label ?? CMS_SECTION_LABELS[node.section];
  let place: CSSProperties | null = HIDDEN;
  if (size) {
    const obstacles = avoid.flatMap((key) => {
      const other = key ? byKey.get(key) : undefined;
      return other ? [outlined(other.rect)] : [];
    });
    const content = nodes.filter(({ kind }) => CONTENT_KINDS.has(kind)).map(({ rect }) => rect);
    place = placeChip(node.rect, size, viewport, obstacles, content);
  }
  if (!place) return null;

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label={`Секция «${label}»`}
      className={styles.chip}
      style={place}
      {...handlers}
    >
      <span className={styles.chipLabel}>Секция · {label}</span>
      {/* TODO(dastan): the prototype chip has no «Изменить» — added so section copy (headings, ledes) has a drawer. */}
      <button
        type="button"
        className={cx(styles.tool, styles.primaryTool)}
        onClick={() => actions.onEditSection(node)}
      >
        Изменить
      </button>
      {node.hideable && (
        <button type="button" className={styles.tool} onClick={() => actions.onHideSection(node)}>
          Скрыть секцию
        </button>
      )}
    </div>
  );
}
