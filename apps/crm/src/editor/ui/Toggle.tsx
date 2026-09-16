import { useId, type ReactNode } from 'react';
import { cx } from './cx';
import styles from './Toggle.module.css';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Text inside the box next to the switch, usually the current value. */
  children?: ReactNode;
  id?: string;
  disabled?: boolean;
  /** Only when nothing else labels the switch. */
  'aria-label'?: string;
  className?: string;
}

/** On/off switch: a native checkbox with `role="switch"`, drawn as the prototype's bordered box. */
export function Toggle({
  checked,
  onChange,
  children,
  id,
  disabled,
  'aria-label': ariaLabel,
  className,
}: ToggleProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <span className={cx(styles.toggle, className)}>
      <input
        id={inputId}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        className={styles.input}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={inputId} className={styles.box}>
        <span aria-hidden="true" className={styles.track} />
        {children}
      </label>
    </span>
  );
}
