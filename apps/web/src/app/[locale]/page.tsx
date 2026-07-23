import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { isLocale, type Locale } from '@alcha/shared';
import { getHome } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';
import { Hero } from '@/components/home/Hero';
import { Services } from '@/components/home/Services';
import { Works } from '@/components/home/Works';
import { Pricing } from '@/components/home/Pricing';
import { CtaBanner } from '@/components/shared/CtaBanner';
import { HomeJsonLd } from '@/components/seo/JsonLd';

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
  const home = await getHome(typed);

  return (
    <>
      <HomeJsonLd home={home} locale={typed} />
      <Hero content={home.content} />
      <Services content={home.content} services={home.services} />
      <Works heading={home.content.worksHeading} projects={home.projects} />
      <Pricing
        heading={home.content.pricingHeading}
        note={home.content.pricingNote}
        plans={home.pricingPlans}
      />
      <CtaBanner
        title={home.content.ctaTitle}
        subtitle={home.content.ctaSubtitle}
        telegramLabel={home.content.ctaTelegramLabel}
        cvLabel={home.content.ctaCvLabel}
        telegramUrl={home.settings.telegram}
        cvUrl={home.settings.cvUrl}
      />
    </>
  );
}
