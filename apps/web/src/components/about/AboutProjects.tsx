import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { Locale, Project, SiteChrome } from '@alcha/shared';
import { Link } from '@/i18n/navigation';
import { cmsAttrs } from '@/lib/cms';
import { CmsAddSlot } from '../preview/CmsAddSlot';
import { CmsHiddenSection } from '../preview/CmsHiddenSection';
import styles from './about.module.css';

export async function AboutProjects({
  heading,
  projects,
  chrome,
  hidden,
  preview,
  locale,
}: {
  heading: string;
  projects: Project[];
  chrome: SiteChrome;
  hidden: boolean;
  preview: boolean;
  locale: Locale;
}) {
  const t = await getTranslations('works');
  const cms = cmsAttrs(preview, locale);
  if (hidden) return cms.enabled ? <CmsHiddenSection section="projects" variant="hidden" /> : null;
  if (projects.length === 0) {
    return cms.enabled ? (
      <CmsHiddenSection section="projects" variant="empty" collection="projects" />
    ) : null;
  }

  return (
    <section className="section" {...cms.section('projects', { hideable: true })}>
      <div className="container">
        <h2 className={styles.sectionH2} {...cms.field(cms.about('projectsHeading'))}>
          {heading}
        </h2>
        <div className={styles.projGrid} {...cms.list('projects', 'grid')}>
          {projects.map((project) => (
            <article
              key={project.id}
              className={styles.projCard}
              {...cms.item('projects', project.id)}
            >
              <div
                className={styles.projMedia}
                {...cms.image(cms.itemField('projects', project.id, 'coverImage'))}
              >
                {project.coverImage ? (
                  <Image
                    src={project.coverImage}
                    alt={`${project.title} — ${t('screenshot')}`}
                    fill
                    sizes="(max-width: 768px) 90vw, 560px"
                    className={styles.projImg}
                  />
                ) : (
                  <div className={`screenshot-placeholder ${styles.projPlaceholder}`}>
                    {project.title}
                  </div>
                )}
              </div>
              <div className={styles.projBody}>
                <span
                  className={`${styles.projBadge} ${project.badgeType === 'own' ? styles.projBadgeOwn : ''}`}
                  {...cms.field(cms.itemLocale('projects', project.id, 'badge'))}
                >
                  {project.badge}
                </span>
                <h3
                  className={styles.projTitle}
                  {...cms.field(cms.itemLocale('projects', project.id, 'title'))}
                >
                  {project.title}
                </h3>
                {project.role && (
                  <p className={styles.projRole}>
                    <span className={styles.projRoleLabel}>
                      <span {...cms.field(cms.chrome('roleLabel'))}>{chrome.roleLabel}</span>:
                    </span>{' '}
                    <span {...cms.field(cms.itemLocale('projects', project.id, 'role'))}>
                      {project.role}
                    </span>
                  </p>
                )}
                <p
                  className={styles.projDesc}
                  {...cms.field(cms.itemLocale('projects', project.id, 'description'), {
                    multiline: true,
                  })}
                >
                  {project.description}
                </p>

                {project.bullets.length > 0 && (
                  <ul className={styles.projBullets}>
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

                {project.techChips.length > 0 && (
                  <ul className={styles.projTech}>
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
                )}

                <Link href={`/works/${project.slug}`} className={styles.projLink}>
                  <span {...cms.field(cms.chrome('viewCaseLabel'))}>{chrome.viewCaseLabel}</span> →
                </Link>
              </div>
            </article>
          ))}
          {cms.enabled && <CmsAddSlot collection="projects" />}
        </div>
      </div>
    </section>
  );
}
