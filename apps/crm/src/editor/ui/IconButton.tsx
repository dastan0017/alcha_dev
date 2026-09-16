import type { ComponentProps } from 'react';
import { cx } from './cx';
import styles from './IconButton.module.css';

export type IconButtonProps = Omit<ComponentProps<'button'>, 'aria-label'> & {
  /** Required: the button shows only a glyph. */
  'aria-label': string;
  /** danger — red on hover, for remove actions. */
  tone?: 'default' | 'danger';
};

/** Square 44×44 glyph button (✕, ↑, ↓…); passes `ref` and every native prop through. */
export function IconButton({
  tone = 'default',
  type = 'button',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, tone === 'danger' && styles.danger, className)}
      {...props}
    />
  );
}
