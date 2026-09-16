import type { ComponentProps } from 'react';
import { cx } from './cx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger';
export type ButtonSize = 'md' | 'sm';

export type ButtonProps = ComponentProps<'button'> & {
  /** primary — purple fill · ghost — purple outline · subtle — quiet text · danger — quiet red text. */
  variant?: ButtonVariant;
  /** md — 44px min height · sm — 36px, with a 44px hit area. */
  size?: ButtonSize;
};

/** Editor button; passes `ref` and every native prop through (`type` defaults to "button"). */
export function Button({
  variant = 'subtle',
  size = 'md',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], styles[size], className)}
      {...props}
    />
  );
}
