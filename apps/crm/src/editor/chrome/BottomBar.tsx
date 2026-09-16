import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../ui';
import styles from './BottomBar.module.css';

interface EnWarning {
  path: string;
  /** «Цены · Заголовок (EN)». */
  label: string;
}

export interface BottomBarProps {
  changes: number;
  /** Required EN fields that are still blank (publish only warns about them). */
  enWarnings: readonly EnWarning[];
  publishing: boolean;
  onReset: () => void;
  onPublish: () => void;
  /** Opens the drawer that edits a warning's field. */
  onOpenWarning: (path: string) => void;
}

/** Shown while the draft differs from the published site. */
export function BottomBar({
  changes,
  enWarnings,
  publishing,
  onReset,
  onPublish,
  onOpenWarning,
}: BottomBarProps) {
  return (
    <div className={styles.bar}>
      <span aria-hidden="true" className={styles.dot} />
      <span className={styles.text}>
        Черновик не опубликован · изменений: <strong>{changes}</strong>
      </span>
      {enWarnings.length > 0 && <EnWarnings warnings={enWarnings} onOpen={onOpenWarning} />}
      <div className={styles.actions}>
        <Button variant="subtle" onClick={onReset}>
          Сбросить всё
        </Button>
        <Button variant="primary" disabled={publishing} onClick={onPublish}>
          {publishing ? 'Публикуем…' : 'Опубликовать изменения'}
        </Button>
      </div>
    </div>
  );
}

/** «EN не заполнено: N» disclosure: the blank fields, each opening its drawer. Esc or a click outside closes it. */
function EnWarnings({
  warnings,
  onOpen,
}: {
  warnings: readonly EnWarning[];
  onOpen: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const choose = (path: string) => {
    // Focus the toggle first: the drawer returns focus to it, and it outlives the list.
    toggleRef.current?.focus();
    setOpen(false);
    onOpen(path);
  };

  return (
    <div ref={rootRef} className={styles.warnings}>
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className={styles.warning}
        onClick={() => setOpen((current) => !current)}
      >
        EN не заполнено: {warnings.length}
      </button>
      {open && (
        <div id={listId} className={styles.popover}>
          <p className={styles.popoverNote}>
            Публикация не блокируется: пустые EN-поля берут текст из RU.
          </p>
          <ul className={styles.list}>
            {warnings.map(({ path, label }) => (
              <li key={path}>
                <button type="button" className={styles.entry} onClick={() => choose(path)}>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
