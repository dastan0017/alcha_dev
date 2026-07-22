import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { Project } from '@alcha/shared';
import { Link } from '@/i18n/navigation';
import styles from './home.module.css';

export function WorkCard({ project }: { project: Project }) {
  const t = useTranslations('works');

  return (
    <article className={styles.workCard}>
      <div className={styles.workMedia}>
        {project.coverImage ? (
          <Image
            src={project.coverImage}
            alt={`${project.title} — ${t('screenshot')}`}
            fill
            sizes="(max-width: 768px) 85vw, 960px"
            className={styles.workImg}
          />
        ) : (
          <div className={`screenshot-placeholder ${styles.workPlaceholder}`}>{project.title}</div>
        )}
      </div>
      <div className={styles.workBody}>
        <span
          className={`${styles.workBadge} ${project.badgeType === 'own' ? styles.workBadgeOwn : ''}`}
        >
          {project.badge}
        </span>
        <h3 className={styles.workTitle}>{project.title}</h3>
        <p className={styles.workMeta}>{project.metaLine}</p>

        {project.pills.length > 0 && (
          <ul className={styles.workPills}>
            {project.pills.map((pill) => (
              <li key={pill} className="pill">
                {pill}
              </li>
            ))}
          </ul>
        )}

        {project.techChips.length > 0 && (
          <ul className={styles.workTech}>
            {project.techChips.map((chip) => (
              <li key={chip} className="chip">
                {chip}
              </li>
            ))}
          </ul>
        )}

        <Link href={`/works/${project.slug}`} className={styles.workLink}>
          {t('viewCase')} →
        </Link>
      </div>
    </article>
  );
}
