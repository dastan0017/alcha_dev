import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CmsPatchError,
  applyPatches,
  invertPatches,
  type ContentPatch,
  type ContentPatchResponse,
  type ContentPublishResponse,
  type ContentTreeResponse,
  type SiteTree,
} from '@alcha/shared';
import { TREE_QUERY_KEY, fetchTree, patchDraft, publishContent, resetDraft } from './api';

const HISTORY_LIMIT = 50;

export interface HistoryEntry {
  id: number;
  forward: ContentPatch[];
  /** Exact undo of `forward`, computed against the tree it was applied to. */
  inverse: ContentPatch[];
  /** «Текст», «Тариф «Лендинг»»… */
  label: string;
}

interface Job {
  patches: ContentPatch[];
  /** The history entry the job saves (null for undos). */
  entryId: number | null;
}

export interface DraftCallbacks {
  /** A change could not be applied or saved; its history entry and every later one are gone. */
  onSaveError: () => void;
  /**
   * The tree was refetched after failed PATCHes: `failed` holds their patches in order and
   * `tree` the server's draft, so the caller can put back what the preview shows for them.
   */
  onResync: (failed: readonly ContentPatch[], tree: SiteTree) => void;
}

/**
 * The draft tree (docs/visual-editor.md §6): TanStack Query owns the tree response, every
 * change is applied to the cache optimistically and PATCHed in strict order, and the server
 * response replaces the cache with the still-queued patches re-applied on top.
 */
export function useDraft(callbacks: DraftCallbacks) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: TREE_QUERY_KEY,
    queryFn: fetchTree,
    // Only a load that failed is retried when the tab comes back: refetching a tree that is
    // already on screen would land on top of the optimistic changes it is holding.
    refetchOnWindowFocus: ({ state }) => state.status === 'error',
  });

  const historyRef = useRef<HistoryEntry[]>([]);
  const [lastEntry, setLastEntry] = useState<HistoryEntry | null>(null);
  const queueRef = useRef<Job[]>([]);
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const [pending, setPending] = useState(0);
  const nextIdRef = useRef(1);
  /** Patches of failed jobs, waiting for the refetch that follows a failure. */
  const failedRef = useRef<ContentPatch[]>([]);
  const resyncRef = useRef({ running: false, stale: false });

  const callbacksRef = useRef(callbacks);
  useLayoutEffect(() => {
    callbacksRef.current = callbacks;
  });

  const setHistory = useCallback((entries: HistoryEntry[]) => {
    historyRef.current = entries;
    setLastEntry(entries.at(-1) ?? null);
  }, []);

  const writeCache = useCallback(
    (response: ContentTreeResponse) => {
      // A refetch in flight would land on top of the optimistic tree.
      void queryClient.cancelQueries({ queryKey: TREE_QUERY_KEY });
      queryClient.setQueryData<ContentTreeResponse>(TREE_QUERY_KEY, response);
    },
    [queryClient],
  );

  /** Resolves once every queued PATCH, including ones queued while waiting, has settled. */
  const whenIdle = useCallback(async () => {
    let current: Promise<void>;
    do {
      current = chainRef.current;
      await current;
    } while (current !== chainRef.current);
  }, []);

  /**
   * After a failed PATCH the cache still holds its optimistic change: refetch the tree once
   * the queue drains (again if something failed or was queued meanwhile), then hand the
   * failed patches to `onResync`.
   */
  const resync = useCallback(async () => {
    const state = resyncRef.current;
    state.stale = true;
    if (state.running) return;
    state.running = true;
    while (state.stale || queueRef.current.length > 0) {
      await whenIdle();
      state.stale = false;
      await queryClient.invalidateQueries({ queryKey: TREE_QUERY_KEY });
    }
    state.running = false;
    // The refetch failed as well: the effect below finishes once the tree loads again.
    if (queryClient.getQueryState(TREE_QUERY_KEY)?.status === 'error') return;
    const failed = failedRef.current;
    failedRef.current = [];
    const tree = queryClient.getQueryData<ContentTreeResponse>(TREE_QUERY_KEY)?.tree;
    if (tree) callbacksRef.current.onResync(failed, tree);
  }, [queryClient, whenIdle]);

  useEffect(() => {
    if (query.isSuccess && failedRef.current.length > 0 && !resyncRef.current.running)
      void resync();
  }, [query.dataUpdatedAt, query.isSuccess, resync]);

  const onSaved = useCallback(
    ({ entryId }: Job, response: ContentPatchResponse) => {
      // Nothing applied (e.g. the item is gone on the server): nothing to undo either.
      if (response.applied === 0 && entryId !== null) {
        setHistory(historyRef.current.filter(({ id }) => id !== entryId));
      }
      let { tree } = response;
      try {
        tree = applyPatches(
          tree,
          queueRef.current.flatMap(({ patches }) => patches),
        ).tree;
      } catch {
        // A queued patch no longer fits the server tree (CmsPatchError): the server rejects
        // that job as well, and its failure resyncs. Until then, show the server tree.
      }
      writeCache({ ...response, tree });
    },
    [setHistory, writeCache],
  );

  const onFailed = useCallback(
    ({ patches, entryId }: Job) => {
      // Later inverses were computed on top of this change; after a failed undo none is exact.
      setHistory(entryId === null ? [] : historyRef.current.filter(({ id }) => id < entryId));
      failedRef.current.push(...patches);
      callbacksRef.current.onSaveError();
      void resync();
    },
    [resync, setHistory],
  );

  /** Queues a PATCH behind every earlier one; the chain itself never rejects. */
  const enqueue = useCallback(
    (job: Job) => {
      const queue = queueRef.current;
      queue.push(job);
      setPending((count) => count + 1);
      chainRef.current = chainRef.current.then(async () => {
        const response = await patchDraft(job.patches).catch(() => null);
        queue.splice(queue.indexOf(job), 1);
        if (response) onSaved(job, response);
        else onFailed(job);
        setPending((count) => count - 1);
      });
    },
    [onFailed, onSaved],
  );

  /** The cached tree with `patches` applied, or null when there is no tree or a patch is malformed. */
  const optimistic = useCallback(
    (patches: readonly ContentPatch[]) => {
      const current = queryClient.getQueryData<ContentTreeResponse>(TREE_QUERY_KEY);
      if (!current) return null;
      try {
        return { current, next: applyPatches(current.tree, patches).tree };
      } catch (error) {
        if (!(error instanceof CmsPatchError)) throw error;
        callbacksRef.current.onSaveError();
        return null;
      }
    },
    [queryClient],
  );

  /** Applies a user change; returns its history entry id, or null when nothing changed. */
  const apply = useCallback(
    (patches: ContentPatch[], label: string): number | null => {
      const result = optimistic(patches);
      if (!result) return null;
      const inverse = invertPatches(result.current.tree, patches);
      // Every op was a no-op (e.g. an item removed in the meantime).
      if (inverse.length === 0) return null;

      const entry: HistoryEntry = { id: nextIdRef.current++, forward: patches, inverse, label };
      setHistory([...historyRef.current, entry].slice(-HISTORY_LIMIT));
      writeCache({ ...result.current, tree: result.next });
      enqueue({ patches, entryId: entry.id });
      return entry.id;
    },
    [enqueue, optimistic, setHistory, writeCache],
  );

  /** Reverts the latest entry (without adding one); returns it, or null when there is nothing to undo. */
  const undo = useCallback((): HistoryEntry | null => {
    const entry = historyRef.current.at(-1);
    if (!entry) return null;
    setHistory(historyRef.current.slice(0, -1));
    const result = optimistic(entry.inverse);
    if (!result) return null;
    writeCache({ ...result.current, tree: result.next });
    enqueue({ patches: entry.inverse, entryId: null });
    return entry;
  }, [enqueue, optimistic, setHistory, writeCache]);

  /** DELETE the draft after the queue drains (a late PATCH would recreate it). */
  const reset = useCallback(async () => {
    await whenIdle();
    writeCache(await resetDraft());
    setHistory([]);
  }, [setHistory, whenIdle, writeCache]);

  /** Publishes the drained draft; throws PublishBlockedError on 422. */
  const publish = useCallback(async (): Promise<ContentPublishResponse> => {
    await whenIdle();
    const result = await publishContent();
    setHistory([]);
    await queryClient.invalidateQueries({ queryKey: TREE_QUERY_KEY });
    return result;
  }, [queryClient, setHistory, whenIdle]);

  return {
    query,
    tree: query.data?.tree,
    changes: query.data?.changes ?? 0,
    issues: query.data?.issues,
    lastEntry,
    pending: pending > 0,
    apply,
    undo,
    whenIdle,
    reset,
    publish,
  };
}
