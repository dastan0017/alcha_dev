import { useTranslations } from 'next-intl';
import type { PricingPlan } from '@alcha/shared';
import { ContactButton } from '../contact/ContactButton';
import styles from './home.module.css';

export function Pricing({
  heading,
  note,
  plans,
}: {
  heading: string;
  note: string;
  plans: PricingPlan[];
}) {
  const nav = useTranslations('nav');

  return (
    <section className="section" id="pricing">
      <div className="container">
        <div className="section-head">
          {note && <p className="eyebrow eyebrow--muted">{note}</p>}
          <h2 className="section-title">{heading}</h2>
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
              <h3 className={styles.priceName}>{plan.name}</h3>
              <div className={styles.priceValue}>{plan.priceLabel}</div>
              {plan.termLine && <div className={`mono ${styles.priceTerm}`}>{plan.termLine}</div>}
              <p className={styles.priceDesc}>{plan.description}</p>
              <ul className={styles.priceFeatures}>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className={styles.check} aria-hidden="true">
                      ✓
                    </span>
                    {feature}
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
      </div>
    </section>
  );
}
