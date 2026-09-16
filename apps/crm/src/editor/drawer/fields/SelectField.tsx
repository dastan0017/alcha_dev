import { Segmented, type SegmentedOption } from '../../ui';
import styles from './fields.module.css';
import type { FieldProps } from './types';

export interface SelectFieldProps extends FieldProps<string> {
  options: readonly SegmentedOption<string>[];
}

/** One of a few options as a segmented control. */
export function SelectField({ id, label, value, onChange, options }: SelectFieldProps) {
  const labelId = `${id}:label`;

  return (
    <div className={styles.field}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <Segmented
        id={id}
        aria-labelledby={labelId}
        value={value}
        options={options}
        onChange={onChange}
      />
    </div>
  );
}
