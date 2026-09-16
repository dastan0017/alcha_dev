import { Fragment, useId, type ReactNode } from 'react';
import { cx } from './cx';
import styles from './Segmented.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Tooltip. */
  title?: string;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string> {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  /** light — full-width form control (44px) · dark — the editor top-bar tabs. */
  variant?: 'light' | 'dark';
  id?: string;
  /** Radio group name; unique by default. */
  name?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
}

/** Single choice: native radios drawn as segments (Tab reaches the group, arrow keys switch). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  variant = 'light',
  id,
  name,
  className,
  ...aria
}: SegmentedProps<T>) {
  const autoName = useId();
  const groupName = name ?? autoName;

  return (
    <div
      id={id}
      role="radiogroup"
      className={cx(styles.group, styles[variant], className)}
      {...aria}
    >
      {options.map((option) => {
        const optionId = `${groupName}-${option.value}`;
        return (
          <Fragment key={option.value}>
            <input
              id={optionId}
              type="radio"
              name={groupName}
              value={option.value}
              checked={option.value === value}
              disabled={option.disabled}
              className={styles.input}
              onChange={() => onChange(option.value)}
            />
            <label htmlFor={optionId} title={option.title} className={styles.option}>
              {option.label}
            </label>
          </Fragment>
        );
      })}
    </div>
  );
}
