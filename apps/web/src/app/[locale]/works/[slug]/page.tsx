import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, type Locale } from '@alcha/shared';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { getProject, getProjects, getSettings } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';
import { WorkJsonLd } from '@/components/seo/JsonLd';
import { ContactButton } from '@/components/contact/ContactButton';
import styles from './works.module.css';

type Params = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    const projects = await getProjects(locale);
    for (const project of projects) {
      params.push({ locale, slug: project.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const typed = locale as Locale;
  const project = await getProject(slug, typed);
  if (!project) return {};
  return buildMetadata({
    title: project.seoTitle || `${project.title} — alcha.dev`,
    description: project.seoDescription || project.metaLine,
    keywords: project.techChips,
    path: `/works/${slug}`,
    locale: typed,
    ogImageUrl: project.coverImage,
  });
}

export default async function WorkPage({ params }: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const typed: Locale = locale;

  const [project, settings, t, nav] = await Promise.all([
    getProject(slug, typed),
    getSettings(typed),
    getTranslations('works'),
    getTranslations('nav'),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <>
      <WorkJsonLd project={project} settings={settings} locale={typed} />

      <article className={styles.page}>
        <div className="container">
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/#works">{t('backToHome')}</Link>
            <span aria-hidden="true">/</span>
            <span>{project.title}</span>
          </nav>

          <header className={styles.header}>
            <span
              className={`${styles.badge} ${project.badgeType === 'own' ? styles.badgeOwn : ''}`}
            >
              {project.badge}
            </span>
            <h1 className={styles.title}>{project.title}</h1>
            <p className={styles.lead}>{project.metaLine}</p>
          </header>

          <div className={styles.media}>
            {project.coverImage ? (
              <Image
                src={project.coverImage}
                alt={`${project.title} — ${t('screenshot')}`}
                fill
                sizes="(max-width: 1240px) 100vw, 1240px"
                className={styles.mediaImg}
                priority
              />
            ) : (
              <div className={`screenshot-placeholder ${styles.mediaPlaceholder}`}>
                {project.title}
              </div>
            )}
          </div>

          {project.screenshots.length > 0 && (
            <div className={styles.gallery}>
              {project.screenshots.map((src, i) => (
                <div key={src} className={styles.galleryItem}>
                  <Image
                    src={src}
                    alt={`${project.title} — ${t('screenshot')} ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className={styles.mediaImg}
                  />
                </div>
              ))}
            </div>
          )}

          <div className={styles.body}>
            <div className={styles.main}>
              {project.role && (
                <p className={styles.role}>
                  <span className={styles.roleLabel}>{t('role')}</span> {project.role}
                </p>
              )}
              <p className={styles.description}>{project.description}</p>
              {project.bullets.length > 0 && (
                <ul className={styles.bullets}>
                  {project.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>

            <aside className={styles.aside}>
              {project.pills.length > 0 && (
                <div className={styles.asideBlock}>
                  <p className={styles.asideHeading}>{t('whatWasDone')}</p>
                  <ul className={styles.pills}>
                    {project.pills.map((pill) => (
                      <li key={pill} className="pill">
                        {pill}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {project.techChips.length > 0 && (
                <div className={styles.asideBlock}>
                  <p className={styles.asideHeading}>{t('stack')}</p>
                  <ul className={styles.chips}>
                    {project.techChips.map((chip) => (
                      <li key={chip} className="chip">
                        {chip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>

          <div className={styles.footerCta}>
            <ContactButton label={nav('cta')} />
            <Link href="/#works" className="btn btn--ghost">
              {t('allWorks')}
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
