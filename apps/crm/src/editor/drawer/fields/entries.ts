import { useLayoutEffect, useRef } from 'react';

/** Copy of `list` with the entry at `from` moved to `to`. */
export function moveEntry<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [entry] = next.splice(from, 1);
  next.splice(to, 0, entry);
  return next;
}

/** Selector of one entry control; entry controls carry `data-entry` + `data-control`. */
export const entryControl = (index: number, control: string) =>
  `[data-entry="${index}"][data-control="${control}"]`;

/**
 * Keeps keyboard focus in an entry list across the re-render that a reorder, insert or
 * remove causes: call `focusAfterChange(...selectors)` before `onChange`; the first enabled
 * match inside `rootRef` is focused once `value` changes.
 */
export function useEntryFocus<T extends HTMLElement>(value: unknown) {
  const rootRef = useRef<T>(null);
  const pending = useRef<string[] | null>(null);

  useLayoutEffect(() => {
    const selectors = pending.current;
    pending.current = null;
    for (const selector of selectors ?? []) {
      const control = rootRef.current?.querySelector<HTMLElement>(`${selector}:not(:disabled)`);
      if (control) {
        control.focus();
        return;
      }
    }
  }, [value]);

  const focusAfterChange = (...selectors: string[]) => {
    pending.current = selectors;
  };

  return { rootRef, focusAfterChange };
}
