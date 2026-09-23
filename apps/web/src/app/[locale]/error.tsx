'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import styles from './error.module.css';

/**
 * Page-level boundary. Reached when a page render throws — in practice when the API is
 * unreachable and lib/content.ts rethrows instead of caching blank copy. [locale]/layout
 * has already rendered, so NextIntlClientProvider is mounted and translations work.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');

  useEffect(() => {
    console.error('[error boundary]', error);
  }, [error]);

  return (
    <div className={`container ${styles.wrap}`}>
      <p className={styles.code}>{t('code')}</p>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.desc}>{t('description')}</p>
      <button type="button" onClick={reset} className="btn btn--primary">
        {t('retry')}
      </button>
    </div>
  );
}
