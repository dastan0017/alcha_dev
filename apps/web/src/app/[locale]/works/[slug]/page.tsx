import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { cmsItemRef, isLocale, type Locale } from '@alcha/shared';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { cmsAttrs } from '@/lib/cms';
import { getChrome, getHome, getProject, getProjects, getSettings } from '@/lib/content';
import { getPreview } from '@/lib/preview';
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

  const [project, settings, chrome, home, { enabled: preview }, t] = await Promise.all([
    getProject(slug, typed),
    getSettings(typed),
    getChrome(typed),
    getHome(typed),
    getPreview(),
    getTranslations('works'),
  ]);

  if (!project) {
    notFound();
  }

  const cms = cmsAttrs(preview, typed);
  // TODO(dastan): with «Работы» hidden the breadcrumb goes to the top of home and the
  // «Все работы» button is dropped — there is no list left to return to.
  const worksHidden = home.hiddenSections.includes('works');

  return (
    <>
      <WorkJsonLd project={project} settings={settings} locale={typed} />

      <article
        className={styles.page}
        {...cms.section('case', { item: cmsItemRef('projects', project.id) })}
      >
        <div className="container">
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link
              href={worksHidden ? '/' : '/#works'}
              {...cms.field(cms.chrome('backToHomeLabel'))}
            >
              {chrome.backToHomeLabel}
            </Link>
            <span aria-hidden="true">/</span>
            <span {...cms.field(cms.itemLocale('projects', project.id, 'title'))}>
              {project.title}
            </span>
          </nav>

          <header className={styles.header}>
            <span
              className={`${styles.badge} ${project.badgeType === 'own' ? styles.badgeOwn : ''}`}
              {...cms.field(cms.itemLocale('projects', project.id, 'badge'))}
            >
              {project.badge}
            </span>
            <h1
              className={styles.title}
              {...cms.field(cms.itemLocale('projects', project.id, 'title'))}
            >
              {project.title}
            </h1>
            <p
              className={styles.lead}
              {...cms.field(cms.itemLocale('projects', project.id, 'metaLine'), {
                multiline: true,
              })}
            >
              {project.metaLine}
            </p>
          </header>

          <div
            className={styles.media}
            {...cms.image(cms.itemField('projects', project.id, 'coverImage'))}
          >
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
                <div
                  key={i}
                  className={styles.galleryItem}
                  {...cms.image(cms.itemField('projects', project.id, 'screenshots', i))}
                >
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
                  <span className={styles.roleLabel} {...cms.field(cms.chrome('roleLabel'))}>
                    {chrome.roleLabel}
                  </span>{' '}
                  <span {...cms.field(cms.itemLocale('projects', project.id, 'role'))}>
                    {project.role}
                  </span>
                </p>
              )}
              <p
                className={styles.description}
                {...cms.field(cms.itemLocale('projects', project.id, 'description'), {
                  multiline: true,
                })}
              >
                {project.description}
              </p>
              {project.bullets.length > 0 && (
                <ul className={styles.bullets}>
                  {project.bullets.map((bullet, i) => (
                    <li
                      key={i}
                      {...cms.field(cms.itemLocale('projects', project.id, 'bullets', i))}
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <aside className={styles.aside}>
              {project.pills.length > 0 && (
                <div className={styles.asideBlock}>
                  <p className={styles.asideHeading} {...cms.field(cms.chrome('whatWasDoneLabel'))}>
                    {chrome.whatWasDoneLabel}
                  </p>
                  <ul className={styles.pills}>
                    {project.pills.map((pill, i) => (
                      <li
                        key={i}
                        className="pill"
                        {...cms.field(cms.itemLocale('projects', project.id, 'pills', i))}
                      >
                        {pill}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {project.techChips.length > 0 && (
                <div className={styles.asideBlock}>
                  <p className={styles.asideHeading} {...cms.field(cms.chrome('stackLabel'))}>
                    {chrome.stackLabel}
                  </p>
                  <ul className={styles.chips}>
                    {project.techChips.map((chip, i) => (
                      <li
                        key={i}
                        className="chip"
                        {...cms.field(cms.itemLocale('projects', project.id, 'techChips', i))}
                      >
                        {chip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>

          <div className={styles.footerCta}>
            <ContactButton label={chrome.navCta} labelAttrs={cms.field(cms.chrome('navCta'))} />
            {!worksHidden && (
              <Link
                href="/#works"
                className="btn btn--ghost"
                {...cms.field(cms.chrome('allWorksLabel'))}
              >
                {chrome.allWorksLabel}
              </Link>
            )}
          </div>
        </div>
      </article>
    </>
  );
}
