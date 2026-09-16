import { Button, IconButton, cx } from '../../ui';
import { entryControl, moveEntry, useEntryFocus } from './entries';
import styles from './fields.module.css';
import type { FieldProps } from './types';

export interface ImagesFieldProps extends FieldProps<string[]> {
  /** Opens the media picker; the parent appends the chosen URL to `value`. */
  onAdd: () => void;
}

const fileName = (url: string) => url.split(/[?#]/)[0].split('/').pop() || url;

/** Ordered photos (screenshots): thumbnail rows with ↑ ↓ ✕ and «Добавить фото». */
export function ImagesField({ id, label, value, onChange, onAdd }: ImagesFieldProps) {
  const { rootRef, focusAfterChange } = useEntryFocus<HTMLDivElement>(value);
  const labelId = `${id}:label`;

  const move = (from: number, to: number, control: 'up' | 'down') => {
    focusAfterChange(entryControl(to, control), entryControl(to, control === 'up' ? 'down' : 'up'));
    onChange(moveEntry(value, from, to));
  };

  const remove = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    focusAfterChange(
      entryControl(Math.min(index, next.length - 1), 'remove'),
      '[data-control="add"]',
    );
    onChange(next);
  };

  return (
    <div ref={rootRef} id={id} role="group" aria-labelledby={labelId} className={styles.field}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      {value.length > 0 && (
        <ol className={styles.entries}>
          {value.map((url, index) => (
            <li key={index} id={`${id}.${index}`} className={styles.entry}>
              <span className={cx(styles.preview, styles.previewSmall)}>
                <img src={url} alt="" />
              </span>
              <span title={url} className={styles.fileName}>
                {`${index + 1}. ${fileName(url)}`}
              </span>
              <IconButton
                aria-label={`Поднять фото ${index + 1}`}
                data-entry={index}
                data-control="up"
                disabled={index === 0}
                onClick={() => move(index, index - 1, 'up')}
              >
                ↑
              </IconButton>
              <IconButton
                aria-label={`Опустить фото ${index + 1}`}
                data-entry={index}
                data-control="down"
                disabled={index === value.length - 1}
                onClick={() => move(index, index + 1, 'down')}
              >
                ↓
              </IconButton>
              <IconButton
                tone="danger"
                aria-label={`Удалить фото ${index + 1}`}
                data-entry={index}
                data-control="remove"
                onClick={() => remove(index)}
              >
                ✕
              </IconButton>
            </li>
          ))}
        </ol>
      )}
      <Button variant="ghost" data-control="add" className={styles.add} onClick={onAdd}>
        + Добавить фото
      </Button>
    </div>
  );
}
