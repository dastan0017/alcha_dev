import { useRef } from 'react';
import { Button } from '../../ui';
import styles from './fields.module.css';
import type { FieldProps } from './types';

export interface ImageFieldProps extends FieldProps<string | null> {
  /** Opens the media picker; the parent applies the chosen URL to `value`. */
  onPick: () => void;
}

/** One image: 132×83 preview, «Выбрать из медиатеки», «Убрать» (sets null). */
export function ImageField({ id, label, value, onChange, onPick }: ImageFieldProps) {
  const pickRef = useRef<HTMLButtonElement>(null);
  const labelId = `${id}:label`;

  const clear = () => {
    onChange(null);
    pickRef.current?.focus();
  };

  return (
    <div id={id} role="group" aria-labelledby={labelId} className={styles.field}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <div className={styles.image}>
        <div className={styles.preview}>
          {value ? (
            <img src={value} alt="" />
          ) : (
            <span className={styles.previewEmpty}>НЕТ ФОТО</span>
          )}
        </div>
        <div className={styles.imageActions}>
          <Button ref={pickRef} variant="ghost" onClick={onPick}>
            Выбрать из медиатеки
          </Button>
          {value && (
            <Button variant="subtle" onClick={clear}>
              Убрать
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
