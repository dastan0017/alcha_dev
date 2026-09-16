import type { Experience, Locale } from '@alcha/shared';
import { cmsAttrs } from '@/lib/cms';
import { CmsAddSlot } from '../preview/CmsAddSlot';
import { CmsHiddenSection } from '../preview/CmsHiddenSection';
import styles from './about.module.css';

export function ExperienceList({
  heading,
  experiences,
  hidden,
  preview,
  locale,
}: {
  heading: string;
  experiences: Experience[];
  hidden: boolean;
  preview: boolean;
  locale: Locale;
}) {
  const cms = cmsAttrs(preview, locale);
  if (hidden) {
    return cms.enabled ? <CmsHiddenSection section="experience" variant="hidden" /> : null;
  }
  if (experiences.length === 0) {
    return cms.enabled ? (
      <CmsHiddenSection section="experience" variant="empty" collection="experience" />
    ) : null;
  }

  return (
    <section className="section" {...cms.section('experience', { hideable: true })}>
      <div className="container">
        <h2 className={styles.sectionH2} {...cms.field(cms.about('experienceHeading'))}>
          {heading}
        </h2>
        <ul className={styles.expList} {...cms.list('experience', 'stack')}>
          {experiences.map((exp) => (
            <li key={exp.id} className={styles.expRow} {...cms.item('experience', exp.id)}>
              <div className={styles.expLeft}>
                <h3
                  className={styles.expCompany}
                  {...cms.field(cms.itemField('experience', exp.id, 'company'))}
                >
                  {exp.company}
                </h3>
                <p
                  className={styles.expRole}
                  {...cms.field(cms.itemLocale('experience', exp.id, 'role'))}
                >
                  {exp.role}
                </p>
                <p
                  className={`mono ${styles.expMeta}`}
                  {...cms.field(cms.itemLocale('experience', exp.id, 'meta'))}
                >
                  {exp.meta}
                </p>
              </div>
              <p
                className={styles.expDesc}
                {...cms.field(cms.itemLocale('experience', exp.id, 'description'), {
                  multiline: true,
                })}
              >
                {exp.description}
              </p>
            </li>
          ))}
          {cms.enabled && <CmsAddSlot collection="experience" as="li" className={styles.rowSlot} />}
        </ul>
      </div>
    </section>
  );
}
