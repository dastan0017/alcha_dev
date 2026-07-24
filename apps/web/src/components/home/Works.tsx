import type { HomeContent, Project } from '@alcha/shared';
import { Link } from '@/i18n/navigation';
import { WorkCard } from './WorkCard';
import styles from './home.module.css';

export function Works({ content, projects }: { content: HomeContent; projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <section className="section" id="works">
      <div className="container">
        {content.worksEyebrow && <p className="eyebrow eyebrow--muted">{content.worksEyebrow}</p>}
        <div className={styles.worksHead}>
          <div>
            <h2 className={`section-title ${styles.worksHeading}`}>{content.worksHeading}</h2>
            {content.worksLede && <p className={styles.worksLede}>{content.worksLede}</p>}
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
