import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { Project } from '@alcha/shared';
import { Link } from '@/i18n/navigation';
import styles from './about.module.css';

export async function AboutProjects({
  heading,
  projects,
}: {
  heading: string;
  projects: Project[];
}) {
  const t = await getTranslations('works');
  if (projects.length === 0) return null;

  return (
    <section className="section">
      <div className="container">
        <h2 className={styles.sectionH2}>{heading}</h2>
        <div className={styles.projGrid}>
          {projects.map((project) => (
            <article key={project.id} className={styles.projCard}>
              <div className={styles.projMedia}>
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
                >
                  {project.badge}
                </span>
                <h3 className={styles.projTitle}>{project.title}</h3>
                {project.role && (
                  <p className={styles.projRole}>
                    <span className={styles.projRoleLabel}>{t('role')}:</span> {project.role}
                  </p>
                )}
                <p className={styles.projDesc}>{project.description}</p>

                {project.bullets.length > 0 && (
                  <ul className={styles.projBullets}>
                    {project.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}

                {project.techChips.length > 0 && (
                  <ul className={styles.projTech}>
                    {project.techChips.map((chip) => (
                      <li key={chip} className="chip">
                        {chip}
                      </li>
                    ))}
                  </ul>
                )}

                <Link href={`/works/${project.slug}`} className={styles.projLink}>
                  {t('viewCase')} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
