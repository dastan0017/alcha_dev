export function Logo({
  variant = 'light',
  size = 20,
}: {
  variant?: 'light' | 'dark';
  size?: number;
}) {
  const nameColor = variant === 'dark' ? '#fff' : 'var(--ink)';
  const devColor = variant === 'dark' ? 'var(--on-dark-purple)' : 'var(--primary)';
  return (
    <span
      style={{
        fontFamily: 'var(--font-sans-stack)',
        fontWeight: 800,
        fontSize: size,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      <span style={{ color: nameColor }}>alcha</span>
      <span style={{ color: devColor }}>.dev</span>
    </span>
  );
}
