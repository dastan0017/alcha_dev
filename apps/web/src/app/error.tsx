'use client';

import { useEffect } from 'react';

/**
 * Root boundary. [locale]/layout.tsx is what renders <html>/<body>, and it fetches
 * settings/chrome/home — so when the API is down the LAYOUT throws and this boundary
 * replaces it entirely. That means it must supply its own document shell and must not
 * depend on next-intl, CSS modules or globals, none of which are mounted here.
 * Same pattern as app/not-found.tsx.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[root error boundary]', error);
  }, [error]);

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
        <p style={{ color: '#5b34c9', fontWeight: 600 }}>500</p>
        <h1 style={{ fontSize: 32 }}>Сайт временно недоступен</h1>
        <p style={{ color: '#5b5570', maxWidth: '40ch' }}>
          Мы уже знаем о проблеме. Попробуйте обновить страницу через минуту.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 16,
            padding: '10px 20px',
            borderRadius: 8,
            border: 0,
            background: '#5b34c9',
            color: '#fff',
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Обновить
        </button>
      </body>
    </html>
  );
}
