import type { HomeContent, Project } from '@alcha/shared';
import { Link } from '@/i18n/navigation';
import { WorkCard } from './WorkCard';
import styles from './home.module.css';

export function Works({ content, projects }: { content: HomeContent; projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <section className={styles.worksSection} id="works">
      <div className="container">
        <div className={styles.sectionHead}>
          <div>
            {content.worksEyebrow && (
              <p className={`eyebrow eyebrow--muted ${styles.lockupEyebrow}`}>
                {content.worksEyebrow}
              </p>
            )}
            <h2 className={`section-title ${styles.lockupTitle}`}>{content.worksHeading}</h2>
            {content.worksLede && <p className={styles.lockupLede}>{content.worksLede}</p>}
          </div>
          {content.worksLinkLabel && (
            <Link href="/about" className={styles.worksLink}>
              {content.worksLinkLabel}
            </Link>
          )}
        </div>

        <div className={styles.worksStack}>
          {projects.map((project) => (
            <WorkCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
