'use client';

import { useLocale, useTranslations } from 'next-intl';
import { LOCALES, type Locale } from '@alcha/shared';
import { getPathname, usePathname, useRouter } from '@/i18n/navigation';
import { LOCALE_NAV_ATTR } from '@/lib/cms';

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
          {...(active === locale
            ? {}
            : { [LOCALE_NAV_ATTR]: getPathname({ href: pathname, locale }) })}
          onClick={() => switchTo(locale)}
        >
          {t(locale)}
        </button>
      ))}
    </div>
  );
}
