import { useLayoutEffect, useRef } from 'react';
import styles from './fields.module.css';
import type { FieldProps } from './types';

export interface TextareaFieldProps extends FieldProps<string> {
  placeholder?: string;
  required?: boolean;
}

/** Multi-line text that grows with its content. */
export function TextareaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
}: TextareaFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    // scrollHeight leaves out the borders that the border-box height includes.
    textarea.style.height = `${textarea.scrollHeight + textarea.offsetHeight - textarea.clientHeight}px`;
  }, [value]);

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        value={value}
        placeholder={placeholder}
        aria-required={required || undefined}
        className={styles.textarea}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
