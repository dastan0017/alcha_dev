import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { Project, SiteChrome } from '@alcha/shared';
import { Link } from '@/i18n/navigation';
import type { Cms } from '@/lib/cms';
import styles from './home.module.css';

/** This site's own project: the only card whose badge is the purple «you are here». */
const SELF_SLUG = 'alcha-dev';

/**
 * Cards already rebuilt on the wide layout — name → badge → headline → description →
 * ✓ facts → flat chips → footer (designs «Project alcha.dev» 1a, «Project Chaban» 1b).
 * Kit Store keeps the compact card until its own pass.
 */
const WIDE_SLUGS: readonly string[] = [SELF_SLUG, 'chaban'];

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
  const self = project.slug === SELF_SLUG;

  const caseLink = (
    <Link href={`/works/${project.slug}`} className={styles.workLink}>
      <span {...cms.field(cms.chrome('viewCaseLabel'))}>{chrome.viewCaseLabel}</span> →
    </Link>
  );

  const tech = project.techChips.length > 0 && (
    /* One joined line: the chips are edited in the drawer, not inline. */
    <span className={`mono ${styles.workTech}`}>{project.techChips.join(' · ')}</span>
  );

  const cover = (className: string) =>
    project.coverImage ? (
      <Image
        src={project.coverImage}
        alt={`${project.title} — ${t('screenshot')}`}
        fill
        sizes="(max-width: 900px) 100vw, 520px"
        className={className}
      />
    ) : (
      <span className={styles.workShot}>
        {t('screenshot')}: {project.title}
      </span>
    );

  if (WIDE_SLUGS.includes(project.slug)) {
    // Purple marks the card you are standing on; every other own product stays green.
    const badgeTone = self
      ? styles.workTagSelf
      : project.badgeType === 'own'
        ? styles.workTagOwn
        : styles.workTagWork;

    return (
      <article
        className={`${styles.workCard} ${styles.workCardWide}`}
        {...cms.item('projects', project.id)}
      >
        {/* One cell on every wide card: the screenshot fills it and sets the card's height. */}
        <div
          className={`${styles.workMedia} ${styles.workMediaCover}`}
          {...cms.image(cms.itemField('projects', project.id, 'coverImage'))}
        >
          {cover(styles.workCoverImg)}
        </div>

        <div className={`${styles.workBody} ${styles.workBodyWide}`}>
          <div className={styles.workMetaRow}>
            {project.typeTag && (
              <span
                className={`mono ${styles.workDomain}`}
                {...cms.field(cms.itemLocale('projects', project.id, 'typeTag'))}
              >
                {project.typeTag}
              </span>
            )}
            {project.badge && (
              <span
                className={`mono ${styles.workTag} ${badgeTone}`}
                {...cms.field(cms.itemLocale('projects', project.id, 'badge'))}
              >
                {project.badge}
              </span>
            )}
            {/* Stacked above the stretched case link, so a store link wins the click. */}
            {(project.appStoreUrl || project.googlePlayUrl) && (
              <span className={styles.workStores}>
                {project.appStoreUrl && (
                  <a
                    href={project.appStoreUrl}
                    target="_blank"
                    rel="noopener"
                    className={styles.workStore}
                  >
                    App Store <span aria-hidden="true">↗</span>
                  </a>
                )}
                {project.googlePlayUrl && (
                  <a
                    href={project.googlePlayUrl}
                    target="_blank"
                    rel="noopener"
                    className={styles.workStore}
                  >
                    Google Play <span aria-hidden="true">↗</span>
                  </a>
                )}
              </span>
            )}
          </div>

          <h3
            className={styles.workTitleWide}
            {...cms.field(cms.itemLocale('projects', project.id, 'title'))}
          >
            {project.title}
          </h3>

          <p
            className={styles.workMeta}
            {...cms.field(cms.itemLocale('projects', project.id, 'metaLine'), { multiline: true })}
          >
            {project.metaLine}
          </p>

          {/* Facts hold a bold lead phrase, so they are edited in the drawer, not inline. */}
          {project.facts.length > 0 && (
            <ul className={styles.workFactList}>
              {project.facts.map((fact, i) => (
                <li key={i} className={styles.workFact}>
                  <span aria-hidden="true" className={styles.workFactCheck}>
                    ✓
                  </span>
                  {/* No lead means the whole line is the lead: every row starts bold. */}
                  <span>
                    <b className={styles.workFactLead}>{fact.lead ?? fact.text}</b>
                    {fact.lead ? ` ${fact.text}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {project.pills.length > 0 && (
            <ul className={`${styles.workPills} ${styles.workPillsFlat}`}>
              {project.pills.map((pill, i) => (
                <li key={i} {...cms.field(cms.itemLocale('projects', project.id, 'pills', i))}>
                  {pill}
                </li>
              ))}
            </ul>
          )}

          <div className={styles.workFooter}>
            {tech}
            {caseLink}
          </div>
        </div>
      </article>
    );
  }

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

        {/* The old one-line facts string, now joined from the fact list. */}
        {project.facts.length > 0 && (
          <div className={styles.workFacts}>
            {project.facts
              .map((fact) => (fact.lead ? `${fact.lead} ${fact.text}` : fact.text))
              .join(' · ')}
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
          {tech}
          {caseLink}
        </div>
      </div>
    </article>
  );
}
