import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { Project, SiteChrome } from '@alcha/shared';
import { Link } from '@/i18n/navigation';
import type { Cms } from '@/lib/cms';
import styles from './home.module.css';

export function WorkCard({
  project,
  chrome,
  cms,
}: {
  project: Project;
  chrome: SiteChrome;
  cms: Cms;
}) {
  const t = useTranslations('works');

  return (
    <article className={styles.workCard} {...cms.item('projects', project.id)}>
      <div
        className={styles.workMedia}
        {...cms.image(cms.itemField('projects', project.id, 'coverImage'))}
      >
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
            <span
              className={styles.workTitle}
              {...cms.field(cms.itemLocale('projects', project.id, 'title'))}
            >
              {project.title}
            </span>
            {project.typeTag && (
              <span
                className={`${styles.workTag} ${
                  project.badgeType === 'own' ? styles.workTagOwn : styles.workTagWork
                }`}
                {...cms.field(cms.itemLocale('projects', project.id, 'typeTag'))}
              >
                {project.typeTag}
              </span>
            )}
          </div>
          {project.badge && (
            <span
              className={styles.workBadge}
              {...cms.field(cms.itemLocale('projects', project.id, 'badge'))}
            >
              {project.badge}
            </span>
          )}
        </div>

        <p
          className={styles.workMeta}
          {...cms.field(cms.itemLocale('projects', project.id, 'metaLine'), { multiline: true })}
        >
          {project.metaLine}
        </p>

        {project.factsLine && (
          <div
            className={styles.workFacts}
            {...cms.field(cms.itemLocale('projects', project.id, 'factsLine'))}
          >
            {project.factsLine}
          </div>
        )}

        {project.pills.length > 0 && (
          <ul className={styles.workPills}>
            {project.pills.map((pill, i) => (
              <li key={i} {...cms.field(cms.itemLocale('projects', project.id, 'pills', i))}>
                {pill}
              </li>
            ))}
          </ul>
        )}

        <div className={styles.workFooter}>
          {/* One joined line: the chips are edited in the drawer, not inline. */}
          {project.techChips.length > 0 && (
            <span className={`mono ${styles.workTech}`}>{project.techChips.join(' · ')}</span>
          )}
          <Link href={`/works/${project.slug}`} className={styles.workLink}>
            <span {...cms.field(cms.chrome('viewCaseLabel'))}>{chrome.viewCaseLabel}</span> →
          </Link>
        </div>
      </div>
    </article>
  );
}
