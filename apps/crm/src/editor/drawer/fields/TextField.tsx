import { cx } from '../../ui';
import styles from './fields.module.css';
import type { FieldProps } from './types';

export interface TextFieldProps extends FieldProps<string> {
  placeholder?: string;
  /** Inline validation message; marks the input invalid. */
  error?: string | null;
  required?: boolean;
}

/** Single-line text input. */
export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
}: TextFieldProps) {
  const errorId = `${id}:error`;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cx(styles.input, error && styles.invalid)}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
