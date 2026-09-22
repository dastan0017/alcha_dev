import type { Locale } from '@alcha/shared';
import { cmsAttrs } from '@/lib/cms';
import styles from './CtaBanner.module.css';

/** The banner copy is the homepage's on every page, so its editor paths are too. */
export function CtaBanner({
  title,
  subtitle,
  telegramLabel,
  whatsappLabel,
  telegramUrl,
  whatsappUrl,
  email,
  preview,
  locale,
}: {
  title: string;
  subtitle: string;
  telegramLabel: string;
  whatsappLabel: string;
  telegramUrl: string;
  whatsappUrl: string;
  email: string;
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
          <div className={styles.contact}>
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
              {whatsappUrl && (
                <a
                  className="btn btn--on-dark-whatsapp"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  {...cms.field(cms.home('ctaWhatsappLabel'))}
                >
                  {whatsappLabel}
                </a>
              )}
            </div>
            {email && (
              <a className={styles.email} href={`mailto:${email}`}>
                {email}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
