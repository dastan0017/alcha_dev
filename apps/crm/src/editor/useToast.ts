import { useCallback, useEffect, useRef, useState } from 'react';

export interface ToastState {
  id: number;
  text: string;
  /** History entry that «Вернуть» reverts; null for toasts without it. */
  undoEntryId: number | null;
}

const TOAST_MS = 3200;
/** Toasts with «Вернуть» or a long message (publish issues) stay longer. */
const LONG_TOAST_MS = 6000;
const LONG_TEXT = 60;

/** One toast at a time; a new one replaces the current one. */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const nextIdRef = useRef(1);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const show = useCallback((text: string, undoEntryId: number | null = null) => {
    clearTimeout(timerRef.current);
    setToast({ id: nextIdRef.current++, text, undoEntryId });
    const long = undoEntryId !== null || text.length > LONG_TEXT;
    timerRef.current = setTimeout(() => setToast(null), long ? LONG_TOAST_MS : TOAST_MS);
  }, []);

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, show, dismiss };
}
