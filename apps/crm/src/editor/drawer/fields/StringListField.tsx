import type { KeyboardEvent } from 'react';
import { Button, IconButton, cx, srOnly } from '../../ui';
import { entryControl, moveEntry, useEntryFocus } from './entries';
import styles from './fields.module.css';
import type { FieldProps } from './types';

export interface StringListFieldProps extends FieldProps<string[]> {
  /** Add button text. */
  addLabel?: string;
}

/**
 * Ordered list of short strings (✓ bullets). Enter inserts an entry below, Backspace in an
 * empty entry removes it; ↑ ↓ ✕ per entry.
 */
export function StringListField({
  id,
  label,
  value,
  onChange,
  addLabel = 'Добавить пункт',
}: StringListFieldProps) {
  const { rootRef, focusAfterChange } = useEntryFocus<HTMLDivElement>(value);
  const labelId = `${id}:label`;

  const insert = (index: number) => {
    focusAfterChange(entryControl(index, 'input'));
    onChange([...value.slice(0, index), '', ...value.slice(index)]);
  };

  const move = (from: number, to: number, control: 'up' | 'down') => {
    focusAfterChange(entryControl(to, control), entryControl(to, 'input'));
    onChange(moveEntry(value, from, to));
  };

  const remove = (index: number, focusIndex: number) => {
    const next = value.filter((_, i) => i !== index);
    focusAfterChange(
      entryControl(Math.max(0, Math.min(focusIndex, next.length - 1)), 'input'),
      '[data-control="add"]',
    );
    onChange(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      insert(index + 1);
    } else if (event.key === 'Backspace' && value[index] === '') {
      event.preventDefault();
      remove(index, index - 1);
    }
  };

  return (
    <div ref={rootRef} id={id} role="group" aria-labelledby={labelId} className={styles.field}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      {value.length > 0 && (
        <ul className={styles.entries}>
          {value.map((entry, index) => {
            const inputId = `${id}.${index}`;
            return (
              <li key={index} className={styles.entry}>
                <span aria-hidden="true" className={styles.check}>
                  ✓
                </span>
                <label htmlFor={inputId} className={srOnly}>
                  {`Пункт ${index + 1}`}
                </label>
                <input
                  id={inputId}
                  type="text"
                  value={entry}
                  data-entry={index}
                  data-control="input"
                  className={cx(styles.input, styles.entryInput)}
                  onChange={(event) =>
                    onChange(value.map((item, i) => (i === index ? event.target.value : item)))
                  }
                  onKeyDown={(event) => handleKeyDown(event, index)}
                />
                <IconButton
                  aria-label={`Поднять пункт ${index + 1}`}
                  data-entry={index}
                  data-control="up"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1, 'up')}
                >
                  ↑
                </IconButton>
                <IconButton
                  aria-label={`Опустить пункт ${index + 1}`}
                  data-entry={index}
                  data-control="down"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, index + 1, 'down')}
                >
                  ↓
                </IconButton>
                <IconButton
                  tone="danger"
                  aria-label={`Удалить пункт ${index + 1}`}
                  onClick={() => remove(index, index)}
                >
                  ✕
                </IconButton>
              </li>
            );
          })}
        </ul>
      )}
      <Button
        variant="ghost"
        data-control="add"
        className={styles.add}
        onClick={() => insert(value.length)}
      >
        + {addLabel}
      </Button>
    </div>
  );
}
