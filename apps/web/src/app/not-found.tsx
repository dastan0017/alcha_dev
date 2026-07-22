import Link from 'next/link';

/** Root fallback for paths that never reach the [locale] segment. */
export default function GlobalNotFound() {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#fff',
          color: '#17121f',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <p style={{ color: '#5b34c9', fontWeight: 600 }}>404</p>
        <h1 style={{ fontSize: 32 }}>Страница не найдена</h1>
        <Link href="/" style={{ color: '#5b34c9', marginTop: 12 }}>
          alcha.dev
        </Link>
      </body>
    </html>
  );
}
