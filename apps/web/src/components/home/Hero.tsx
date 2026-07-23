import type { HomeContent } from '@alcha/shared';
import { ContactButton } from '../contact/ContactButton';
import { HeroJourney } from './HeroJourney';
import styles from './home.module.css';

export function Hero({ content }: { content: HomeContent }) {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.heroInner}`}>
        <div className={styles.heroCopy}>
          <p className={`eyebrow ${styles.heroEyebrow}`}>{content.eyebrow}</p>
          <h1 className={styles.heroTitle}>{content.heroTitle}</h1>
          <p className={styles.heroSub}>{content.heroSubtitle}</p>

          {content.heroBullets.length > 0 && (
            <ul className={styles.heroBullets}>
              {content.heroBullets.map((bullet) => (
                <li key={bullet}>
                  <span className={styles.heroCheck} aria-hidden="true">
                    ✓
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          )}

          {content.heroNote && <p className={styles.heroNote}>{content.heroNote}</p>}

          <div className={styles.heroCtas}>
            <ContactButton label={content.heroCtaPrimary} />
            <a href="#works" className="btn btn--ghost">
              {content.heroCtaSecondary}
            </a>
          </div>

          <p className={`mono ${styles.trust}`}>{content.trustLine}</p>
        </div>

        <HeroJourney />
      </div>
    </section>
  );
}
