import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { isLocale, type Locale } from '@alcha/shared';
import { getChrome, getHome } from '@/lib/content';
import { getPreview } from '@/lib/preview';
import { buildMetadata } from '@/lib/seo';
import { Hero } from '@/components/home/Hero';
import { Services } from '@/components/home/Services';
import { Works } from '@/components/home/Works';
import { Pricing } from '@/components/home/Pricing';
import { CtaBanner } from '@/components/shared/CtaBanner';
import { HomeJsonLd } from '@/components/seo/JsonLd';
import styles from '@/components/home/home.module.css';

type Params = { params: Promise<{ locale: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const typed = locale as Locale;
  const { seo } = await getHome(typed);
  return buildMetadata({
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    path: '/',
    locale: typed,
    ogImageUrl: seo.ogImageUrl,
  });
}

export default async function HomePage({ params }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const typed: Locale = locale;
  const [home, chrome, { enabled: preview }] = await Promise.all([
    getHome(typed),
    getChrome(typed),
    getPreview(),
  ]);
  const { hiddenSections } = home;

  return (
    <>
      <HomeJsonLd home={home} locale={typed} />
      {/* Flex column so the mobile breakpoint can reorder sections (works → services → prices). */}
      <div className={styles.homeMain}>
        <Hero
          content={home.content}
          worksHidden={hiddenSections.includes('works')}
          preview={preview}
          locale={typed}
        />
        <Services
          content={home.content}
          services={home.services}
          hidden={hiddenSections.includes('services')}
          preview={preview}
          locale={typed}
        />
        <Works
          content={home.content}
          projects={home.projects}
          chrome={chrome}
          hidden={hiddenSections.includes('works')}
          preview={preview}
          locale={typed}
        />
        <Pricing
          content={home.content}
          plans={home.pricingPlans}
          chrome={chrome}
          hidden={hiddenSections.includes('pricing')}
          preview={preview}
          locale={typed}
        />
        <CtaBanner
          title={home.content.ctaTitle}
          subtitle={home.content.ctaSubtitle}
          telegramLabel={home.content.ctaTelegramLabel}
          cvLabel={home.content.ctaCvLabel}
          telegramUrl={home.settings.telegram}
          cvUrl={home.settings.cvUrl}
          preview={preview}
          locale={typed}
        />
      </div>
    </>
  );
}
