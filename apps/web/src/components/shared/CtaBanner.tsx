import type { Locale } from '@alcha/shared';
import { cmsAttrs } from '@/lib/cms';
import styles from './CtaBanner.module.css';

/** The banner copy is the homepage's on every page, so its editor paths are too. */
export function CtaBanner({
  title,
  subtitle,
  telegramLabel,
  cvLabel,
  telegramUrl,
  cvUrl,
  preview,
  locale,
}: {
  title: string;
  subtitle: string;
  telegramLabel: string;
  cvLabel: string;
  telegramUrl: string;
  cvUrl: string;
  preview: boolean;
  locale: Locale;
}) {
  const cms = cmsAttrs(preview, locale);

  return (
    <section className={styles.cta} {...cms.section('cta')}>
      {/* The dark panel gets its own container so the gutter is the page's,
          not the panel's padding (v3 review). */}
      <div className="container">
        <div className={styles.inner}>
          <div className={styles.copy}>
            <h2 className={styles.title} {...cms.field(cms.home('ctaTitle'))}>
              {title}
            </h2>
            <p
              className={styles.subtitle}
              {...cms.field(cms.home('ctaSubtitle'), { multiline: true })}
            >
              {subtitle}
            </p>
          </div>
          <div className={styles.actions}>
            {telegramUrl && (
              <a
                className="btn btn--on-dark"
                href={telegramUrl}
                target="_blank"
                rel="noreferrer noopener"
                {...cms.field(cms.home('ctaTelegramLabel'))}
              >
                {telegramLabel}
              </a>
            )}
            {cvUrl && (
              <a
                className="btn btn--on-dark-ghost"
                href={cvUrl}
                target="_blank"
                rel="noreferrer noopener"
                {...cms.field(cms.home('ctaCvLabel'))}
              >
                {cvLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
