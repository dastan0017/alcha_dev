import type { CSSProperties } from 'react';
import type { HomeContent, Locale, ProcessStep } from '@alcha/shared';
import { cmsAttrs } from '@/lib/cms';
import { CmsAddSlot } from '../preview/CmsAddSlot';
import { CmsHiddenSection } from '../preview/CmsHiddenSection';
import styles from './home.module.css';

export function Process({
  content,
  steps,
  hidden,
  preview,
  locale,
}: {
  content: HomeContent;
  steps: ProcessStep[];
  hidden: boolean;
  preview: boolean;
  locale: Locale;
}) {
  const cms = cmsAttrs(preview, locale);
  if (hidden) return cms.enabled ? <CmsHiddenSection section="process" variant="hidden" /> : null;
  if (steps.length === 0) {
    return cms.enabled ? (
      <CmsHiddenSection section="process" variant="empty" collection="steps" />
    ) : null;
  }

  // Only the first flagged step is highlighted and carries the annotation.
  const mainId = steps.find((step) => step.isMain)?.id;
  const hasNote = Boolean(content.processAnnotationLabel || content.processAnnotationText);
  // The main step's badge renders twice — in the head row on desktop, inside the card
  // below 1024px — and CSS shows one of them.
  const mainBadge = (className: string) =>
    content.processMainLabel && (
      <span
        className={`${styles.stepBadge} ${className}`}
        {...cms.field(cms.home('processMainLabel'))}
      >
        {content.processMainLabel}
      </span>
    );

  return (
    <section className={styles.processSection} {...cms.section('process', { hideable: true })}>
      <div className="container">
        <div className={styles.processHead}>
          <div className={styles.processIntro}>
            {content.processEyebrow && (
              <p
                className={`eyebrow ${styles.lockupEyebrow} ${styles.processEyebrow}`}
                {...cms.field(cms.home('processEyebrow'))}
              >
                {content.processEyebrow}
              </p>
            )}
            <h2
              className={`section-title ${styles.lockupTitle} ${styles.processTitle}`}
              {...cms.field(cms.home('processHeading'))}
            >
              {content.processHeading}
            </h2>
            {content.processSubheading && (
              <p
                className={`${styles.lockupLede} ${styles.processLede}`}
                {...cms.field(cms.home('processSubheading'), { multiline: true })}
              >
                {content.processSubheading}
              </p>
            )}
          </div>
          {content.processPill && (
            <span className={styles.processPill} {...cms.field(cms.home('processPill'))}>
              {content.processPill}
            </span>
          )}
        </div>

        {/* role="list": `list-style: none` drops the list semantics in Safari/VoiceOver.
            --step-count keeps every step on one row on desktop, however many there are. */}
        <ol
          role="list"
          className={styles.steps}
          style={{ '--step-count': steps.length } as CSSProperties}
          {...cms.list('steps', 'grid')}
        >
          {steps.map((step, index) => {
            const isMain = step.id === mainId;
            const isLast = index === steps.length - 1;
            const note = isMain && hasNote;

            return (
              <li key={step.id} className={`${styles.step} ${note ? styles.stepAnnotated : ''}`}>
                <div className={styles.stepHead}>
                  <span className={`${styles.stepNum} ${isMain ? styles.stepNumMain : ''}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {isMain && mainBadge(styles.stepBadgeHead)}
                  {!isLast && <span className={styles.stepLine} aria-hidden="true" />}
                </div>

                <div
                  className={`${styles.stepCard} ${isMain ? styles.stepCardMain : ''}`}
                  {...cms.item('steps', step.id)}
                >
                  {isMain && mainBadge(styles.stepBadgeCard)}
                  <h3
                    className={styles.stepTitle}
                    {...cms.field(cms.itemLocale('steps', step.id, 'title'))}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={styles.stepDesc}
                    {...cms.field(cms.itemLocale('steps', step.id, 'description'), {
                      multiline: true,
                    })}
                  >
                    {step.description}
                  </p>
                  {(step.from || step.result) && (
                    <dl className={styles.stepMeta}>
                      {step.from && (
                        <div>
                          <dt {...cms.field(cms.home('processFromLabel'))}>
                            {content.processFromLabel}
                          </dt>
                          <dd {...cms.field(cms.itemLocale('steps', step.id, 'from'))}>
                            {step.from}
                          </dd>
                        </div>
                      )}
                      {step.result && (
                        <div>
                          <dt
                            className={styles.stepResultLabel}
                            {...cms.field(cms.home('processResultLabel'))}
                          >
                            {content.processResultLabel}
                          </dt>
                          <dd {...cms.field(cms.itemLocale('steps', step.id, 'result'))}>
                            {step.result}
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}
                </div>

                {note && (
                  <div className={`${styles.stepNote} ${isLast ? '' : styles.stepNoteWide}`}>
                    <svg
                      className={styles.stepNoteArrow}
                      width="34"
                      height="42"
                      viewBox="0 0 34 42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M8 40C8 26 13 12 25 5" />
                      <path d="M25 5l-9 1M25 5l0 9" />
                    </svg>
                    <div className={styles.stepNoteBody}>
                      {content.processAnnotationLabel && (
                        <p
                          className={styles.stepNoteLabel}
                          {...cms.field(cms.home('processAnnotationLabel'))}
                        >
                          {content.processAnnotationLabel}
                        </p>
                      )}
                      {content.processAnnotationText && (
                        <p
                          className={styles.stepNoteText}
                          {...cms.field(cms.home('processAnnotationText'), { multiline: true })}
                        >
                          {content.processAnnotationText}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
          {cms.enabled && <CmsAddSlot collection="steps" as="li" className={styles.stepSlot} />}
        </ol>
      </div>
    </section>
  );
}
