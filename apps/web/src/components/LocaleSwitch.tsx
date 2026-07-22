'use client';

import { useLocale, useTranslations } from 'next-intl';
import { LOCALES, type Locale } from '@alcha/shared';
import { usePathname, useRouter } from '@/i18n/navigation';

export function LocaleSwitch() {
  const active = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('locale');

  function switchTo(next: Locale) {
    if (next === active) return;
    // Persists the choice in the NEXT_LOCALE cookie via next-intl.
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="locale-switch" role="group" aria-label={t('switchLabel')}>
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          className="locale-switch__btn"
          aria-pressed={active === locale}
          onClick={() => switchTo(locale)}
        >
          {t(locale)}
        </button>
      ))}
    </div>
  );
}
