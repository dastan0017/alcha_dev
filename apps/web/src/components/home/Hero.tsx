import type { HomeContent, Locale } from '@alcha/shared';
import { cmsAttrs } from '@/lib/cms';
import { ContactButton } from '../contact/ContactButton';
import { HeroJourney } from './HeroJourney';
import { HeroJourneyMobile } from './HeroJourneyMobile';
import styles from './home.module.css';

export function Hero({
  content,
  worksHidden,
  preview,
  locale,
}: {
  content: HomeContent;
  /** The secondary CTA jumps to #works, so it goes when that section is hidden. */
  worksHidden: boolean;
  preview: boolean;
  locale: Locale;
}) {
  const cms = cmsAttrs(preview, locale);

  return (
    <section className={styles.hero} {...cms.section('hero')}>
      <div className={`container ${styles.heroInner}`}>
        <div className={styles.heroCopy}>
          <p className={`eyebrow ${styles.heroEyebrow}`} {...cms.field(cms.home('eyebrow'))}>
            {content.eyebrow}
          </p>
          <h1
            className={styles.heroTitle}
            {...cms.field(cms.home('heroTitle'), { multiline: true })}
          >
            {content.heroTitle}
          </h1>
          <p
            className={styles.heroSub}
            {...cms.field(cms.home('heroSubtitle'), { multiline: true })}
          >
            {content.heroSubtitle}
          </p>

          {content.heroBullets.length > 0 && (
            <ul className={styles.heroBullets}>
              {content.heroBullets.map((bullet, i) => (
                <li key={i}>
                  <span className={styles.heroCheck} aria-hidden="true">
                    ✓
                  </span>
                  <span {...cms.field(cms.home('heroBullets', i))}>{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {content.heroNote && (
            <p className={styles.heroNote} {...cms.field(cms.home('heroNote'))}>
              {content.heroNote}
            </p>
          )}

          <div className={styles.heroCtas}>
            <ContactButton
              label={content.heroCtaPrimary}
              labelAttrs={cms.field(cms.home('heroCtaPrimary'))}
            />
            {!worksHidden && (
              <a
                href="#works"
                className="btn btn--ghost"
                {...cms.field(cms.home('heroCtaSecondary'))}
              >
                {content.heroCtaSecondary}
              </a>
            )}
          </div>

          <p className={`mono ${styles.trust}`} {...cms.field(cms.home('trustLine'))}>
            {content.trustLine}
          </p>
        </div>

        <HeroJourney />
        <HeroJourneyMobile />
      </div>
    </section>
  );
}
