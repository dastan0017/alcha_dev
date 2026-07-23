import { useTranslations } from 'next-intl';
import type { HomeContent, PricingPlan } from '@alcha/shared';
import { ContactButton } from '../contact/ContactButton';
import styles from './home.module.css';

export function Pricing({ content, plans }: { content: HomeContent; plans: PricingPlan[] }) {
  const nav = useTranslations('nav');
  if (plans.length === 0) return null;

  return (
    <section className="section" id="pricing">
      <div className="container">
        {content.pricingEyebrow && (
          <p className={`eyebrow eyebrow--muted ${styles.priceEyebrow}`}>
            {content.pricingEyebrow}
          </p>
        )}
        <div className={styles.priceHead}>
          <h2 className="section-title">{content.pricingHeading}</h2>
          {content.pricingNote && <span className={styles.priceNote}>{content.pricingNote}</span>}
        </div>

        <div className={styles.priceGrid}>
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`${styles.priceCard} ${plan.highlighted ? styles.priceCardHi : ''}`}
            >
              {plan.highlighted && plan.highlightLabel && (
                <span className={styles.priceBadge}>{plan.highlightLabel}</span>
              )}
              <div>
                <div className={styles.priceName}>{plan.name}</div>
                <div className={styles.priceValue}>{plan.priceLabel}</div>
                {plan.termLine && <div className={styles.priceTerm}>{plan.termLine}</div>}
              </div>
              <p className={styles.priceDesc}>{plan.description}</p>
              <ul className={styles.priceFeatures}>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className={styles.check} aria-hidden="true">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <ContactButton
                label={nav('cta')}
                className={`btn ${plan.highlighted ? 'btn--primary' : 'btn--ghost'} ${styles.priceCta}`}
              />
            </article>
          ))}
        </div>

        {content.pricingFootnote && (
          <p className={styles.priceFootnote}>{content.pricingFootnote}</p>
        )}
      </div>
    </section>
  );
}
