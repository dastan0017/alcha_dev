import tokens from './tokens.module.css';

/**
 * Root class of the editor chrome: the site tokens as CSS variables (`--ink`, `--primary`,
 * `--canvas`, `--font-sans`…) plus base typography. Every primitive below reads those
 * variables, so render them inside it; `Dialog` applies it to its portal itself.
 */
export const editorRoot = tokens.editorRoot;

/** Visually hidden but announced and focusable. */
export const srOnly = tokens.srOnly;

export { cx } from './cx';
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './Button';
export { IconButton, type IconButtonProps } from './IconButton';
export { Segmented, type SegmentedOption, type SegmentedProps } from './Segmented';
export { Toggle, type ToggleProps } from './Toggle';
export { Dialog, type DialogProps } from './Dialog';
