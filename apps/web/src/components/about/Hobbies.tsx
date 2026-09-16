import Image from 'next/image';
import type { HobbyCard, Locale } from '@alcha/shared';
import { cmsAttrs } from '@/lib/cms';
import { CmsAddSlot } from '../preview/CmsAddSlot';
import { CmsHiddenSection } from '../preview/CmsHiddenSection';
import styles from './about.module.css';

export function Hobbies({
  heading,
  hobbies,
  hidden,
  preview,
  locale,
}: {
  heading: string;
  hobbies: HobbyCard[];
  hidden: boolean;
  preview: boolean;
  locale: Locale;
}) {
  const cms = cmsAttrs(preview, locale);
  if (hidden) return cms.enabled ? <CmsHiddenSection section="hobbies" variant="hidden" /> : null;
  if (hobbies.length === 0) {
    return cms.enabled ? (
      <CmsHiddenSection section="hobbies" variant="empty" collection="hobbies" />
    ) : null;
  }

  return (
    <section className="section" {...cms.section('hobbies', { hideable: true })}>
      <div className="container">
        <h2 className={styles.sectionH2} {...cms.field(cms.about('hobbiesHeading'))}>
          {heading}
        </h2>
        <div className={styles.hobbyGrid} {...cms.list('hobbies', 'grid')}>
          {hobbies.map((hobby) => (
            <a
              key={hobby.id}
              className={styles.hobbyCard}
              href={hobby.url}
              target="_blank"
              rel="noreferrer noopener"
              {...cms.item('hobbies', hobby.id)}
            >
              <div
                className={styles.hobbyMedia}
                {...cms.image(cms.itemField('hobbies', hobby.id, 'imageUrl'))}
              >
                {hobby.imageUrl ? (
                  <Image
                    src={hobby.imageUrl}
                    alt={hobby.title}
                    fill
                    sizes="(max-width: 768px) 90vw, 560px"
                    className={styles.hobbyImg}
                  />
                ) : (
                  <div className={`screenshot-placeholder ${styles.hobbyPlaceholder}`}>
                    {hobby.handle}
                  </div>
                )}
              </div>
              <div className={styles.hobbyBody}>
                <h3
                  className={styles.hobbyTitle}
                  {...cms.field(cms.itemLocale('hobbies', hobby.id, 'title'))}
                >
                  {hobby.title}
                </h3>
                <p
                  className={styles.hobbyDesc}
                  {...cms.field(cms.itemLocale('hobbies', hobby.id, 'description'), {
                    multiline: true,
                  })}
                >
                  {hobby.description}
                </p>
                <span
                  className={`mono ${styles.hobbyHandle}`}
                  {...cms.field(cms.itemField('hobbies', hobby.id, 'handle'))}
                >
                  {hobby.handle}
                </span>
              </div>
            </a>
          ))}
          {cms.enabled && <CmsAddSlot collection="hobbies" />}
        </div>
      </div>
    </section>
  );
}
