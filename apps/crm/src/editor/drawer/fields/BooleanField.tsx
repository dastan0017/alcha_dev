import { Toggle } from '../../ui';
import styles from './fields.module.css';
import type { FieldProps } from './types';

export interface BooleanFieldProps extends FieldProps<boolean> {
  /** Value text next to the switch. */
  onLabel?: string;
  offLabel?: string;
}

/** A switch whose box spells out the current value. */
export function BooleanField({
  id,
  label,
  value,
  onChange,
  onLabel = 'Да',
  offLabel = 'Нет',
}: BooleanFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <Toggle id={id} checked={value} onChange={onChange}>
        {value ? onLabel : offLabel}
      </Toggle>
    </div>
  );
}
