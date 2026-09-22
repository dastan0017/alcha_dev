import type { HomeContent, Locale, Project, SiteChrome } from '@alcha/shared';
import { cmsAttrs } from '@/lib/cms';
import { CmsAddSlot } from '../preview/CmsAddSlot';
import { CmsHiddenSection } from '../preview/CmsHiddenSection';
import { WorkCard } from './WorkCard';
import styles from './home.module.css';

export function Works({
  content,
  projects,
  chrome,
  hidden,
  preview,
  locale,
}: {
  content: HomeContent;
  projects: Project[];
  chrome: SiteChrome;
  hidden: boolean;
  preview: boolean;
  locale: Locale;
}) {
  const cms = cmsAttrs(preview, locale);
  if (hidden) return cms.enabled ? <CmsHiddenSection section="works" variant="hidden" /> : null;
  if (projects.length === 0) {
    return cms.enabled ? (
      <CmsHiddenSection section="works" variant="empty" collection="projects" />
    ) : null;
  }

  return (
    <section
      className={styles.worksSection}
      id="works"
      {...cms.section('works', { hideable: true })}
    >
      <div className="container">
        <div className={styles.sectionHead}>
          <div>
            {content.worksEyebrow && (
              <p
                className={`eyebrow eyebrow--muted ${styles.lockupEyebrow}`}
                {...cms.field(cms.home('worksEyebrow'))}
              >
                {content.worksEyebrow}
              </p>
            )}
            <h2
              className={`section-title ${styles.lockupTitle}`}
              {...cms.field(cms.home('worksHeading'))}
            >
              {content.worksHeading}
            </h2>
            {content.worksLede && (
              <p
                className={styles.lockupLede}
                {...cms.field(cms.home('worksLede'), { multiline: true })}
              >
                {content.worksLede}
              </p>
            )}
          </div>
        </div>

        <div className={styles.worksStack} {...cms.list('projects', 'stack')}>
          {projects.map((project) => (
            <WorkCard key={project.id} project={project} chrome={chrome} cms={cms} />
          ))}
          {cms.enabled && <CmsAddSlot collection="projects" />}
        </div>
      </div>
    </section>
  );
}
