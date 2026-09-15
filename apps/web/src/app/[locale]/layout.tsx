import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, type Locale } from '@alcha/shared';
import { routing } from '@/i18n/routing';
import { golos, jetbrainsMono } from '@/lib/fonts';
import { env, SITE_NAME } from '@/lib/env';
import { getSettings } from '@/lib/content';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Analytics } from '@/components/analytics/Analytics';
import { EnLocaleHint } from '@/components/EnLocaleHint';
import { ContactProvider } from '@/components/contact/ContactContext';
import '@/styles/globals.css';
import '@/styles/chrome.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: `${SITE_NAME} — создание сайтов, CRM и веб-приложений в Бишкеке`,
    template: `%s — ${SITE_NAME}`,
  },
  applicationName: SITE_NAME,
  authors: [{ name: 'Dastan Rakhmanzhanov' }],
  creator: 'Dastan Rakhmanzhanov',
  robots: { index: true, follow: true },
  verification: {
    google: env.verification.google || undefined,
    yandex: env.verification.yandex || undefined,
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const typedLocale: Locale = locale;
  const [messages, settings, t] = await Promise.all([
    getMessages(),
    getSettings(typedLocale),
    getTranslations('a11y'),
  ]);

  return (
    <html lang={locale} className={`${golos.variable} ${jetbrainsMono.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ContactProvider locale={typedLocale} telegram={settings.telegram}>
            <a href="#main" className="skip-link">
              {t('skipToContent')}
            </a>
            <Header email={settings.email} />
            <main id="main">{children}</main>
            <Footer settings={settings} />
            <EnLocaleHint locale={typedLocale} />
          </ContactProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
