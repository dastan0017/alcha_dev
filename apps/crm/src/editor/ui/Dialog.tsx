import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from './cx';
import tokens from './tokens.module.css';
import styles from './Dialog.module.css';

export interface DialogProps {
  open: boolean;
  /** Esc, a scrim click, or whatever the content wires up. */
  onClose: () => void;
  /** right — full-height drawer · center — modal. The panel's size comes from `className`. */
  placement: 'right' | 'center';
  /** Id of the element that names the dialog (its heading). */
  labelledBy: string;
  describedBy?: string;
  /**
   * Element to focus on open (or its first focusable descendant); called once after the
   * content mounts. Defaults to the first focusable element of the panel.
   */
  initialFocus?: () => HTMLElement | null;
  className?: string;
  children: ReactNode;
}

/**
 * Modal dialog in a portal on `document.body` (with the editor tokens applied): scrim, focus
 * trap, Esc to close, focus restored to the opener. Nested dialogs stack; only the topmost
 * one traps focus and reacts to keys.
 */
export function Dialog({ open, ...props }: DialogProps) {
  return open ? <DialogLayer {...props} /> : null;
}

const FOCUSABLE = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled):not([type="hidden"])',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Open dialogs, topmost last. */
const openDialogs: object[] = [];

function isTabbable(element: HTMLElement, root: HTMLElement): boolean {
  if (element.tabIndex < 0 || element.getClientRects().length === 0) return false;
  if (!(element instanceof HTMLInputElement) || element.type !== 'radio' || element.checked)
    return true;
  // Tab stops only at the checked radio of a group (arrow keys move inside it).
  return !root.querySelector(`input[type="radio"][name="${CSS.escape(element.name)}"]:checked`);
}

function tabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) =>
    isTabbable(element, root),
  );
}

function focusWithin(element: HTMLElement) {
  (element.matches(FOCUSABLE) ? element : (tabbables(element)[0] ?? element)).focus();
}

function DialogLayer({
  onClose,
  placement,
  labelledBy,
  describedBy,
  initialFocus,
  className,
  children,
}: Omit<DialogProps, 'open'>) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Read during the first render, before anything inside the dialog takes focus.
  const [opener] = useState(() => document.activeElement);
  const latest = useRef({ onClose, initialFocus });
  useLayoutEffect(() => {
    latest.current = { onClose, initialFocus };
  });

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const token = {};
    openDialogs.push(token);
    const isTop = () => openDialogs[openDialogs.length - 1] === token;

    focusWithin(latest.current.initialFocus?.() ?? panel);

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTop() || event.defaultPrevented || event.isComposing) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        latest.current.onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = tabbables(panel);
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const active = document.activeElement;
      const outside = active === panel || !panel.contains(active);
      if (event.shiftKey && (outside || active === items[0])) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (!event.shiftKey && (outside || active === items[items.length - 1])) {
        event.preventDefault();
        items[0].focus();
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (isTop() && event.target instanceof Node && !panel.contains(event.target))
        focusWithin(panel);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      openDialogs.splice(openDialogs.indexOf(token), 1);
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [opener]);

  return createPortal(
    <div className={cx(tokens.editorRoot, styles.layer, styles[placement])}>
      <div aria-hidden="true" className={styles.scrim} onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={cx(styles.panel, className)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
