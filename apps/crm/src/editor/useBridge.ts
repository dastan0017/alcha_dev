import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type RefObject,
} from 'react';
import {
  CMS_SOURCE,
  isCmsChildMessage,
  type CmsChildMessage,
  type CmsEditorMode,
  type CmsNode,
  type CmsParentMessage,
  type CmsViewport,
} from '@alcha/shared';
import { SITE_URL } from '../lib/site';

const SITE_ORIGIN = new URL(SITE_URL).origin;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type ChildMessage<T extends CmsChildMessage['type']> = Extract<CmsChildMessage, { type: T }>;

type ParentMessage = DistributiveOmit<CmsParentMessage, 'source'>;
/** Hovered node keys at every level (field / image / item / section). */
export type HoverKeys = Omit<ChildMessage<'hover'>, 'source' | 'type'>;

const NO_HOVER: HoverKeys = { field: null, image: null, item: null, section: null };

export interface BridgeState {
  /** Visible nodes in DOM order. */
  nodes: readonly CmsNode[];
  byKey: ReadonlyMap<string, CmsNode>;
  /** The iframe viewport: node rects are relative to it, and it is exactly the overlay's size. */
  viewport: CmsViewport | null;
  hover: HoverKeys;
  /** The field being edited inline. */
  editing: { path: string; key: string } | null;
  /** The current document has announced itself (and was sent the editor mode). */
  ready: boolean;
}

const INITIAL: BridgeState = {
  nodes: [],
  byKey: new Map(),
  viewport: null,
  hover: NO_HOVER,
  editing: null,
  ready: false,
};

/**
 * Ref-backed store of what the iframe reports: node rects change at scroll rate, so
 * components subscribe to the slice they draw instead of re-rendering the page.
 */
export interface BridgeStore {
  get: () => BridgeState;
  subscribe: (listener: () => void) => () => void;
}

function createBridgeStore() {
  let state = INITIAL;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (patch: Partial<BridgeState>) => {
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const withNodes = ({ nodes, viewport }: { nodes: CmsNode[]; viewport: CmsViewport }) => ({
  nodes,
  byKey: new Map(nodes.map((node) => [node.key, node])),
  viewport,
});

/** A slice of the bridge state; `select` must return stored references or primitives. */
export function useBridgeState<T>(store: BridgeStore, select: (state: BridgeState) => T): T {
  return useSyncExternalStore(store.subscribe, () => select(store.get()));
}

export interface BridgeHandlers {
  /** A document announced itself; returning false rejects it (no overlay until the next one). */
  onReady: (message: ChildMessage<'ready'>) => boolean;
  onCommit: (message: ChildMessage<'edit-commit'>) => void;
  onOpenField: (message: ChildMessage<'open-field'>) => void;
  onAdd: (message: ChildMessage<'add'>) => void;
  onShowSection: (message: ChildMessage<'show-section'>) => void;
}

/**
 * The CRM side of the preview bridge (docs/visual-editor.md §5): listens to the iframe at
 * `SITE_URL`, keeps its nodes / hover / editing state and posts commands back.
 */
export function useBridge(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  { src, mode, ...handlers }: BridgeHandlers & { src: string | null; mode: CmsEditorMode },
) {
  const store = useMemo(createBridgeStore, []);
  const latest = useRef({ mode, handlers });
  useLayoutEffect(() => {
    latest.current = { mode, handlers };
  });

  const send = useCallback(
    (message: ParentMessage) => {
      iframeRef.current?.contentWindow?.postMessage(
        { source: CMS_SOURCE, ...message },
        SITE_ORIGIN,
      );
    },
    [iframeRef],
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const frame = iframeRef.current?.contentWindow;
      if (
        event.origin !== SITE_ORIGIN ||
        !frame ||
        event.source !== frame ||
        !isCmsChildMessage(event.data)
      ) {
        return;
      }
      const message = event.data;
      switch (message.type) {
        case 'ready':
          if (!latest.current.handlers.onReady(message)) {
            store.set(INITIAL);
            break;
          }
          store.set({ ...withNodes(message), hover: NO_HOVER, editing: null, ready: true });
          send({ type: 'mode', mode: latest.current.mode });
          break;
        case 'nodes':
          store.set(withNodes(message));
          break;
        case 'hover': {
          const { field, image, item, section } = message;
          store.set({ hover: { field, image, item, section } });
          break;
        }
        case 'edit-start':
          store.set({ editing: { path: message.path, key: message.key } });
          break;
        case 'edit-end':
          store.set({ editing: null });
          break;
        case 'edit-commit':
          latest.current.handlers.onCommit(message);
          break;
        case 'open-field':
          latest.current.handlers.onOpenField(message);
          break;
        case 'add':
          latest.current.handlers.onAdd(message);
          break;
        case 'show-section':
          latest.current.handlers.onShowSection(message);
          break;
        case 'navigation-blocked':
          // The preview stays on the page picked in the top bar.
          break;
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [iframeRef, latest, send, store]);

  // A new document: the old rects are meaningless until it announces itself.
  useEffect(() => {
    store.set(INITIAL);
  }, [src, store]);

  useEffect(() => {
    // The bridge drops its hover when leaving edit mode without posting it.
    if (mode === 'view') store.set({ hover: NO_HOVER });
    send({ type: 'mode', mode });
  }, [mode, send, store]);

  /** Resolves true once a nodes update contains `key`, false after `timeoutMs`. */
  const waitForNode = useCallback(
    (key: string, timeoutMs: number) =>
      new Promise<boolean>((resolve) => {
        if (store.get().byKey.has(key)) return resolve(true);
        const finish = (found: boolean) => {
          clearTimeout(timer);
          unsubscribe();
          resolve(found);
        };
        const timer = setTimeout(() => finish(false), timeoutMs);
        const unsubscribe = store.subscribe(() => {
          if (store.get().byKey.has(key)) finish(true);
        });
      }),
    [store],
  );

  return { store: store as BridgeStore, send, waitForNode };
}
