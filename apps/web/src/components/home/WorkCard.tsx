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
            sizes="(max-width: 900px) 100vw, 380px"
            className={styles.workImg}
          />
        ) : (
          <span className={styles.workShot}>
            {t('screenshot')}: {project.title}
          </span>
        )}
      </div>

      <div className={styles.workBody}>
        <div className={styles.workHeadRow}>
          <div className={styles.workTitleWrap}>
            <span className={styles.workTitle}>{project.title}</span>
            {project.typeTag && (
              <span
                className={`${styles.workTag} ${
                  project.badgeType === 'own' ? styles.workTagOwn : styles.workTagWork
                }`}
              >
                {project.typeTag}
              </span>
            )}
          </div>
          {project.badge && <span className={styles.workBadge}>{project.badge}</span>}
        </div>

        <p className={styles.workMeta}>{project.metaLine}</p>

        {project.factsLine && <div className={styles.workFacts}>{project.factsLine}</div>}

        {project.pills.length > 0 && (
          <ul className={styles.workPills}>
            {project.pills.map((pill) => (
              <li key={pill}>{pill}</li>
            ))}
          </ul>
        )}

        <div className={styles.workFooter}>
          {project.techChips.length > 0 && (
            <span className={`mono ${styles.workTech}`}>{project.techChips.join(' · ')}</span>
          )}
          <Link href={`/works/${project.slug}`} className={styles.workLink}>
            {t('viewCase')} →
          </Link>
        </div>
      </div>
    </article>
  );
}
