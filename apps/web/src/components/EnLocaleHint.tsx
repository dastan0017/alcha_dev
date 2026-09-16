'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@alcha/shared';
import { getPathname, usePathname, useRouter } from '@/i18n/navigation';
import { LOCALE_NAV_ATTR } from '@/lib/cms';

const DISMISS_KEY = 'alcha-locale-hint';

/**
 * Non-blocking hint suggesting EN when the browser language is English and the
 * user is on the RU (default) locale. Never redirects automatically.
 */
export function EnLocaleHint({ locale }: { locale: Locale }) {
  const t = useTranslations('enHint');
  const pathname = usePathname();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (locale !== 'ru') return;
    if (localStorage.getItem(DISMISS_KEY) === 'dismissed') return;
    if (navigator.language?.toLowerCase().startsWith('en')) {
      setShow(true);
    }
  }, [locale]);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'dismissed');
    setShow(false);
  };

  return (
    <div className="en-hint" role="region" aria-label={t('text')}>
      <span>{t('text')}</span>
      <button
        type="button"
        className="en-hint__action"
        {...{ [LOCALE_NAV_ATTR]: getPathname({ href: pathname, locale: 'en' }) }}
        onClick={() => {
          dismiss();
          router.replace(pathname, { locale: 'en' });
        }}
      >
        {t('action')}
      </button>
      <button type="button" className="en-hint__dismiss" aria-label={t('dismiss')} onClick={dismiss}>
        ✕
      </button>
    </div>
  );
}
