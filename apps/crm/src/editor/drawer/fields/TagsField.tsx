import { useRef, useState, type KeyboardEvent } from 'react';
import styles from './fields.module.css';
import type { FieldProps } from './types';

/**
 * Chips for short tags. Enter or a comma adds (pasted comma lists split), Backspace in the
 * empty input removes the last chip, ✕ removes one; unfinished text is added on blur.
 */
export function TagsField({ id, label, value, onChange }: FieldProps<string[]>) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const helpId = `${id}:help`;

  const add = (parts: readonly string[]) => {
    const next = [...value];
    for (const part of parts) {
      const tag = part.trim();
      if (tag && !next.includes(tag)) next.push(tag);
    }
    if (next.length !== value.length) onChange(next);
  };

  const commitDraft = () => {
    add([draft]);
    setDraft('');
  };

  const handleChange = (text: string) => {
    const parts = text.split(',');
    const rest = parts.pop() ?? '';
    add(parts);
    setDraft(rest);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      commitDraft();
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      event.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    inputRef.current?.focus();
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {/* A click on the box's empty space focuses the input, like a native text field. */}
      <div
        className={styles.tags}
        onClick={(event) => {
          if (event.target === event.currentTarget) inputRef.current?.focus();
        }}
      >
        {value.length > 0 && (
          <ul className={styles.chips}>
            {value.map((tag, index) => (
              <li key={`${index}:${tag}`} className={styles.chip}>
                {tag}
                <button
                  type="button"
                  aria-label={`Удалить «${tag}»`}
                  className={styles.chipRemove}
                  onClick={() => remove(index)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          aria-describedby={helpId}
          className={styles.tagInput}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
        />
      </div>
      <p id={helpId} className={styles.help}>
        Enter или запятая — добавить, Backspace — убрать последний
      </p>
    </div>
  );
}
