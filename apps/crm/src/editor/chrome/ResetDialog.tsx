import { useId } from 'react';
import { Button, Dialog } from '../ui';
import styles from './ResetDialog.module.css';

export interface ResetDialogProps {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation for «Сбросить всё»; focus starts on «Отмена».
 * TODO(dastan): the prototype resets at once — the dialog guards an unrecoverable action.
 */
export function ResetDialog({ open, busy, onCancel, onConfirm }: ResetDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog
      open={open}
      placement="center"
      labelledBy={titleId}
      describedBy={descriptionId}
      className={styles.panel}
      onClose={onCancel}
    >
      <h2 id={titleId} className={styles.title}>
        Сбросить черновик?
      </h2>
      <p id={descriptionId} className={styles.text}>
        Все неопубликованные изменения пропадут.
      </p>
      <div className={styles.actions}>
        <Button variant="subtle" onClick={onCancel}>
          Отмена
        </Button>
        <Button variant="danger" disabled={busy} onClick={onConfirm}>
          {busy ? 'Сбрасываем…' : 'Сбросить'}
        </Button>
      </div>
    </Dialog>
  );
}
