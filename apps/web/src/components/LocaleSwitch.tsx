'use client';

import NextLink from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LOCALES } from '@alcha/shared';
import { getPathname, usePathname } from '@/i18n/navigation';
import { LOCALE_NAV_ATTR } from '@/lib/cms';

/**
 * Real links, not buttons: they are the only crawlable path between the RU and EN
 * versions of a page. The CRM preview still swallows them via `data-locale-nav`.
 * A plain Next link to the final URL: next-intl's `<Link locale>` writes `/ru/…`
 * for the default locale, which now 308s to the unprefixed path.
 */
export function LocaleSwitch() {
  const active = useLocale();
  const pathname = usePathname();
  const t = useTranslations('locale');

  return (
    <div className="locale-switch" role="group" aria-label={t('switchLabel')}>
      {LOCALES.map((locale) => {
        if (locale === active) {
          return (
            <span key={locale} className="locale-switch__btn" aria-current="true">
              {t(locale)}
            </span>
          );
        }
        const href = getPathname({ href: pathname, locale });
        return (
          <NextLink
            key={locale}
            href={href}
            hrefLang={locale}
            replace
            className="locale-switch__btn"
            {...{ [LOCALE_NAV_ATTR]: href }}
          >
            {t(locale)}
          </NextLink>
        );
      })}
    </div>
  );
}
