import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { isLocale, type Locale } from '@alcha/shared';
import { getAbout, getChrome } from '@/lib/content';
import { getPreview } from '@/lib/preview';
import { buildMetadata } from '@/lib/seo';
import { AboutHero } from '@/components/about/AboutHero';
import { ExperienceList } from '@/components/about/ExperienceList';
import { AboutProjects } from '@/components/about/AboutProjects';
import { StackTable } from '@/components/about/StackTable';
import { Hobbies } from '@/components/about/Hobbies';
import { CtaBanner } from '@/components/shared/CtaBanner';
import { AboutJsonLd } from '@/components/seo/JsonLd';

type Params = { params: Promise<{ locale: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const typed = locale as Locale;
  const { seo } = await getAbout(typed);
  return buildMetadata({
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    path: '/about',
    locale: typed,
    ogImageUrl: seo.ogImageUrl,
  });
}

export default async function AboutPage({ params }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const typed: Locale = locale;
  const [about, chrome, { enabled: preview }] = await Promise.all([
    getAbout(typed),
    getChrome(typed),
    getPreview(),
  ]);
  const { profile, hiddenSections } = about;

  return (
    <>
      <AboutJsonLd about={about} locale={typed} />
      <AboutHero
        profile={profile}
        settings={about.settings}
        cvLabel={about.cta.cvLabel}
        preview={preview}
        locale={typed}
      />
      <ExperienceList
        heading={profile.experienceHeading}
        experiences={about.experiences}
        hidden={hiddenSections.includes('experience')}
        preview={preview}
        locale={typed}
      />
      <AboutProjects
        heading={profile.projectsHeading}
        projects={about.projects}
        chrome={chrome}
        hidden={hiddenSections.includes('projects')}
        preview={preview}
        locale={typed}
      />
      <StackTable
        heading={profile.stackHeading}
        stack={about.stack}
        hidden={hiddenSections.includes('stack')}
        preview={preview}
        locale={typed}
      />
      <Hobbies
        heading={profile.hobbiesHeading}
        hobbies={about.hobbies}
        hidden={hiddenSections.includes('hobbies')}
        preview={preview}
        locale={typed}
      />
      <CtaBanner
        title={about.cta.title}
        subtitle={about.cta.subtitle}
        telegramLabel={about.cta.telegramLabel}
        cvLabel={about.cta.cvLabel}
        telegramUrl={about.settings.telegram}
        cvUrl={about.settings.cvUrl}
        preview={preview}
        locale={typed}
      />
    </>
  );
}
