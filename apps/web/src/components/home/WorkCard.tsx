import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { Project, SiteChrome } from '@alcha/shared';
import { Link } from '@/i18n/navigation';
import type { Cms } from '@/lib/cms';
import styles from './home.module.css';

/**
 * This site's own project. Its card is the section's lead card (design «Project alcha.dev»
 * 1a): a wider screenshot column with a live proof overlay instead of the shared 380px plate.
 */
const SELF_SLUG = 'alcha-dev';

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
  const featured = project.slug === SELF_SLUG;

  const caseLink = (
    <Link href={`/works/${project.slug}`} className={styles.workLink}>
      <span {...cms.field(cms.chrome('viewCaseLabel'))}>{chrome.viewCaseLabel}</span> →
    </Link>
  );

  const tech = project.techChips.length > 0 && (
    /* One joined line: the chips are edited in the drawer, not inline. */
    <span className={`mono ${styles.workTech}`}>{project.techChips.join(' · ')}</span>
  );

  if (featured) {
    return (
      <article
        className={`${styles.workCard} ${styles.workCardFeatured}`}
        {...cms.item('projects', project.id)}
      >
        <div
          className={`${styles.workMedia} ${styles.workMediaFeatured}`}
          {...cms.image(cms.itemField('projects', project.id, 'coverImage'))}
        >
          {/* One real screenshot, framed like a window and bleeding off the bottom edge. */}
          <div className={styles.workFrame}>
            {project.coverImage ? (
              <Image
                src={project.coverImage}
                alt={`${project.title} — ${t('screenshot')}`}
                fill
                sizes="(max-width: 900px) 100vw, 520px"
                className={styles.workFrameImg}
              />
            ) : (
              <span className={styles.workShot}>
                {t('screenshot')}: {project.title}
              </span>
            )}
          </div>
          {/* Proof, not chrome: what the visitor's request looks like when it lands. */}
          <div className={styles.workProof} aria-hidden="true">
            <div className={styles.workProofHead}>
              <span>{t('proofChannel')}</span>
              <span>{t('proofWhen')}</span>
            </div>
            <div className={styles.workProofTitle}>{t('proofTitle')}</div>
            <div className={styles.workProofText}>{t('proofText')}</div>
          </div>
        </div>

        <div className={`${styles.workBody} ${styles.workBodyFeatured}`}>
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
                className={`mono ${styles.workBadgeSelf}`}
                {...cms.field(cms.itemLocale('projects', project.id, 'badge'))}
              >
                {project.badge}
              </span>
            )}
          </div>

          <h3
            className={styles.workTitleFeatured}
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
