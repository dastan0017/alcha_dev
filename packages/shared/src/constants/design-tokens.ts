/**
 * Design tokens transcribed from the approved hi-fi reference (directions 2a/3a).
 * The web app mirrors these into CSS custom properties; the CRM uses them to
 * theme Ant Design and to render content-status colors that match the site.
 */
export const colors = {
  ink: '#17121F',
  bodyText: '#5F5768',
  muted: '#8A8494',
  faint: '#A39CAE',
  border: 'rgba(23,18,31,0.08)',
  borderStrong: 'rgba(23,18,31,0.14)',
  primary: '#5B34C9',
  primaryHover: '#4A28AB',
  primaryLightBg: '#F4F0F8',
  ownGradient: 'linear-gradient(100deg,#7B2D8E,#D6336C 55%,#E8930C)',
  pageBg: '#FFFFFF',
  darkBlock: '#17121F',
  onDarkMuted: '#A99FB8',
  onDarkPurple: '#C4B0FF',
  white: '#FFFFFF',
} as const;

export const fonts = {
  sans: 'Golos Text',
  mono: 'JetBrains Mono',
} as const;

export const radii = {
  button: '9px',
  buttonSm: '8px',
  card: '16px',
  cardSm: '12px',
  chip: '6px',
  pill: '999px',
} as const;

export const shadows = {
  primaryButton: '0 6px 18px rgba(91,52,201,0.28)',
  card: '0 6px 18px rgba(23,18,31,0.06)',
  cardHover: '0 14px 34px rgba(23,18,31,0.10)',
  floating: '0 18px 44px rgba(23,18,31,0.14)',
} as const;

/** Striped placeholder used for project screenshots until a real image exists. */
export const PLACEHOLDER_STRIPES =
  'repeating-linear-gradient(45deg,#F4F0F8 0 12px,#ECE5F3 12px 24px)';

export type ColorToken = keyof typeof colors;
