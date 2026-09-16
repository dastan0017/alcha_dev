import { useLayoutEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cx, editorRoot } from '../ui';
import type { ToastState } from '../useToast';
import styles from './Toast.module.css';

export interface ToastProps {
  toast: ToastState | null;
  /** Offers «Вернуть» (only while the toast's change is still the latest one). */
  canUndo: boolean;
  onUndo: () => void;
  /** Lifts the toast above the bottom bar. */
  raised: boolean;
  /** Moves the toast into the space left of the open right-hand drawer. */
  besideDrawer: boolean;
  /** The editor area the toast is centred under. */
  anchor: RefObject<HTMLElement | null>;
}

/**
 * Live region with at most one message, bottom-centre over the editor. It sits in a portal
 * above open dialogs, so a toast about the drawer that just opened (publish blocked) is readable.
 */
export function Toast({ toast, canUndo, onUndo, raised, besideDrawer, anchor }: ToastProps) {
  // The portal spans the viewport; the editor starts after the sidebar rail.
  const [left, setLeft] = useState(0);
  useLayoutEffect(() => {
    if (toast) setLeft(anchor.current?.getBoundingClientRect().left ?? 0);
  }, [anchor, toast]);

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={cx(
        editorRoot,
        styles.region,
        raised && styles.raised,
        besideDrawer && styles.besideDrawer,
      )}
      style={{ left }}
    >
      {toast && (
        <div key={toast.id} className={styles.toast}>
          <span>{toast.text}</span>
          {canUndo && (
            <button type="button" className={styles.undo} onClick={onUndo}>
              Вернуть
            </button>
          )}
        </div>
      )}
    </div>,
    document.body,
  );
}
