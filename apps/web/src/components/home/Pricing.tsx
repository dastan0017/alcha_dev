'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { HomeContent, PricingPlan } from '@alcha/shared';
import { ContactButton } from '../contact/ContactButton';
import styles from './home.module.css';

/**
 * The design sets the "от" / "from" qualifier apart from the figure so the
 * number carries the weight, but the CMS stores one label ("от $300"). Split a
 * leading all-letters word off the front; anything else renders as-is.
 */
function splitPrice(label: string): { prefix: string | null; amount: string } {
  const match = /^(\p{L}+)\s+(\S.*)$/u.exec(label.trim());
  return match ? { prefix: match[1], amount: match[2] } : { prefix: null, amount: label };
}

export function Pricing({ content, plans }: { content: HomeContent; plans: PricingPlan[] }) {
  const nav = useTranslations('nav');
  const t = useTranslations('pricing');
  const gridRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Keep the swipe-hint dots in sync with the card nearest the carousel centre
  // (mobile only — on desktop the grid isn't scrollable and the hint is hidden).
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const cards = Array.from(grid.children) as HTMLElement[];
      if (cards.length === 0) return;
      const gridRect = grid.getBoundingClientRect();
      const centre = gridRect.left + gridRect.width / 2;
      let best = 0;
      let bestDist = Infinity;
      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const dist = Math.abs(rect.left + rect.width / 2 - centre);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    grid.addEventListener('scroll', onScroll, { passive: true });
    measure();
    return () => {
      grid.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [plans.length]);

  if (plans.length === 0) return null;

  return (
    <section className={styles.priceSection} id="pricing">
      <div className="container">
        <div className={styles.sectionHead}>
          <div>
            {content.pricingEyebrow && (
              <p className={`eyebrow eyebrow--muted ${styles.lockupEyebrow}`}>
                {content.pricingEyebrow}
              </p>
            )}
            <h2 className={`section-title ${styles.lockupTitle}`}>{content.pricingHeading}</h2>
            {content.pricingNote && <p className={styles.lockupLede}>{content.pricingNote}</p>}
          </div>
        </div>

        <div className={styles.priceGrid} ref={gridRef}>
          {plans.map((plan) => {
            const { prefix, amount } = splitPrice(plan.priceLabel);
            return (
              <article
                key={plan.id}
                className={`${styles.priceCard} ${plan.highlighted ? styles.priceCardHi : ''}`}
              >
                {plan.highlighted && plan.highlightLabel && (
                  <span className={styles.badgeTop}>{plan.highlightLabel}</span>
                )}
                <div>
                  <div className={styles.priceName}>{plan.name}</div>
                  <div className={styles.priceAmountRow}>
                    {prefix && <span className={styles.priceFrom}>{prefix}</span>}
                    <span className={styles.priceValue}>{amount}</span>
                  </div>
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
            );
          })}
        </div>

        <div className={styles.priceSwipeHint} aria-hidden="true">
          <span className={styles.priceDots}>
            {plans.map((plan, i) => (
              <span key={plan.id} className={i === active ? styles.priceDotActive : undefined} />
            ))}
          </span>
          {t('swipe')}
        </div>

        {content.pricingFootnote && (
          <p className={styles.priceFootnote}>{content.pricingFootnote}</p>
        )}
      </div>
    </section>
  );
}
