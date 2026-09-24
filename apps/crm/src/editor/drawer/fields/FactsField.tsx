import type { KeyboardEvent } from 'react';
import type { ProjectFact } from '@alcha/shared';
import { Button, IconButton, cx, srOnly } from '../../ui';
import { entryControl, moveEntry, useEntryFocus } from './entries';
import styles from './fields.module.css';
import type { FieldProps } from './types';

export interface FactsFieldProps extends FieldProps<ProjectFact[]> {
  /** Add button text. */
  addLabel?: string;
}

const EMPTY: ProjectFact = { text: '' };

/**
 * The ✓ facts of a works card: each entry is an optional bold opening phrase («Удобная
 * админка») plus the rest of the line. Keyboard behaviour matches StringListField — Enter
 * inserts an entry below, Backspace in an empty line removes it, ↑ ↓ ✕ per entry.
 */
export function FactsField({
  id,
  label,
  value,
  onChange,
  addLabel = 'Добавить факт',
}: FactsFieldProps) {
  const { rootRef, focusAfterChange } = useEntryFocus<HTMLDivElement>(value);
  const labelId = `${id}:label`;

  const insert = (index: number) => {
    focusAfterChange(entryControl(index, 'input'));
    onChange([...value.slice(0, index), EMPTY, ...value.slice(index)]);
  };

  const edit = (index: number, patch: Partial<ProjectFact>) =>
    onChange(value.map((fact, i) => (i === index ? { ...fact, ...patch } : fact)));

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
    const fact = value[index];
    if (event.key === 'Enter') {
      event.preventDefault();
      insert(index + 1);
    } else if (event.key === 'Backspace' && fact.text === '' && !fact.lead) {
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
          {value.map((fact, index) => {
            const leadId = `${id}.${index}.lead`;
            const textId = `${id}.${index}`;
            return (
              <li key={index} className={cx(styles.entry, styles.factEntry)}>
                <span aria-hidden="true" className={styles.check}>
                  ✓
                </span>
                <div className={styles.factInputs}>
                  <label htmlFor={leadId} className={srOnly}>
                    {`Факт ${index + 1}, начало жирным (необязательно)`}
                  </label>
                  <input
                    id={leadId}
                    type="text"
                    value={fact.lead ?? ''}
                    placeholder="Жирное начало — необязательно"
                    data-entry={index}
                    data-control="lead"
                    className={cx(styles.input, styles.entryInput, styles.factLead)}
                    onChange={(event) => edit(index, { lead: event.target.value })}
                  />
                  <label htmlFor={textId} className={srOnly}>
                    {`Факт ${index + 1}, текст`}
                  </label>
                  <input
                    id={textId}
                    type="text"
                    value={fact.text}
                    placeholder="— остальная часть строки"
                    data-entry={index}
                    data-control="input"
                    className={cx(styles.input, styles.entryInput)}
                    onChange={(event) => edit(index, { text: event.target.value })}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                  />
                </div>
                <IconButton
                  aria-label={`Поднять факт ${index + 1}`}
                  data-entry={index}
                  data-control="up"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1, 'up')}
                >
                  ↑
                </IconButton>
                <IconButton
                  aria-label={`Опустить факт ${index + 1}`}
                  data-entry={index}
                  data-control="down"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, index + 1, 'down')}
                >
                  ↓
                </IconButton>
                <IconButton
                  tone="danger"
                  aria-label={`Удалить факт ${index + 1}`}
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
