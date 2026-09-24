import type { KeyboardEvent } from 'react';
import type { ProjectPoint } from '@alcha/shared';
import { Button, IconButton, cx, srOnly } from '../../ui';
import { entryControl, moveEntry, useEntryFocus } from './entries';
import styles from './fields.module.css';
import type { FieldProps } from './types';

export interface PointsFieldProps extends FieldProps<ProjectPoint[]> {
  addLabel?: string;
  /** What one entry is called in the labels, e.g. «пункт», «строку». */
  noun?: string;
  hintTitle?: string;
  hintText?: string;
}

const EMPTY: ProjectPoint = { title: '', text: '' };

/**
 * A list of titled points: the case page's «Что умеет сайт» rows, the numbered admin
 * points and the «Сервер и надёжность» columns. Each entry is a bold title plus the line
 * under it. Keyboard behaviour matches StringListField — Enter inserts an entry below,
 * Backspace in an empty entry removes it, ↑ ↓ ✕ per entry.
 */
export function PointsField({
  id,
  label,
  value,
  onChange,
  addLabel = 'Добавить пункт',
  noun = 'Пункт',
  hintTitle = 'Заголовок жирным',
  hintText = 'Строка под заголовком',
}: PointsFieldProps) {
  const { rootRef, focusAfterChange } = useEntryFocus<HTMLDivElement>(value);
  const labelId = `${id}:label`;

  const insert = (index: number) => {
    focusAfterChange(entryControl(index, 'input'));
    onChange([...value.slice(0, index), EMPTY, ...value.slice(index)]);
  };

  const edit = (index: number, patch: Partial<ProjectPoint>) =>
    onChange(value.map((point, i) => (i === index ? { ...point, ...patch } : point)));

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
    const point = value[index];
    if (event.key === 'Enter') {
      event.preventDefault();
      insert(index + 1);
    } else if (event.key === 'Backspace' && point.title === '' && point.text === '') {
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
          {value.map((point, index) => {
            const titleId = `${id}.${index}`;
            const textId = `${id}.${index}.text`;
            return (
              <li key={index} className={cx(styles.entry, styles.factEntry)}>
                <span aria-hidden="true" className={styles.check}>
                  {index + 1}
                </span>
                <div className={styles.factInputs}>
                  <label htmlFor={titleId} className={srOnly}>
                    {`${noun} ${index + 1}, заголовок`}
                  </label>
                  <input
                    id={titleId}
                    type="text"
                    value={point.title}
                    placeholder={hintTitle}
                    data-entry={index}
                    data-control="input"
                    className={cx(styles.input, styles.entryInput, styles.factLead)}
                    onChange={(event) => edit(index, { title: event.target.value })}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                  />
                  <label htmlFor={textId} className={srOnly}>
                    {`${noun} ${index + 1}, текст`}
                  </label>
                  <input
                    id={textId}
                    type="text"
                    value={point.text}
                    placeholder={hintText}
                    data-entry={index}
                    data-control="text"
                    className={cx(styles.input, styles.entryInput)}
                    onChange={(event) => edit(index, { text: event.target.value })}
                  />
                </div>
                <IconButton
                  aria-label={`Поднять ${noun.toLowerCase()} ${index + 1}`}
                  data-entry={index}
                  data-control="up"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1, 'up')}
                >
                  ↑
                </IconButton>
                <IconButton
                  aria-label={`Опустить ${noun.toLowerCase()} ${index + 1}`}
                  data-entry={index}
                  data-control="down"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, index + 1, 'down')}
                >
                  ↓
                </IconButton>
                <IconButton
                  tone="danger"
                  aria-label={`Удалить ${noun.toLowerCase()} ${index + 1}`}
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
