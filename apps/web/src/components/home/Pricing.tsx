'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CMS_ATTR,
  type HomeContent,
  type Locale,
  type PricingPlan,
  type SiteChrome,
} from '@alcha/shared';
import { cmsAttrs } from '@/lib/cms';
import { ContactButton } from '../contact/ContactButton';
import { CmsAddSlot } from '../preview/CmsAddSlot';
import { CmsHiddenSection } from '../preview/CmsHiddenSection';
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

export function Pricing({
  content,
  plans,
  chrome,
  hidden,
  preview,
  locale,
}: {
  content: HomeContent;
  plans: PricingPlan[];
  chrome: SiteChrome;
  hidden: boolean;
  preview: boolean;
  locale: Locale;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const cms = cmsAttrs(preview, locale);

  // Keep the swipe-hint dots in sync with the card nearest the carousel centre
  // (mobile only — on desktop the grid isn't scrollable and the hint is hidden).
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      // The editor's add slot (preview only) is not a plan, so it has no dot.
      const cards = (Array.from(grid.children) as HTMLElement[]).filter(
        (card) => !card.hasAttribute(CMS_ATTR.previewUi),
      );
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
  }, [plans.length, hidden]);

  if (hidden) return cms.enabled ? <CmsHiddenSection section="pricing" variant="hidden" /> : null;
  if (plans.length === 0) {
    return cms.enabled ? (
      <CmsHiddenSection section="pricing" variant="empty" collection="pricing" />
    ) : null;
  }

  return (
    <section
      className={styles.priceSection}
      id="pricing"
      {...cms.section('pricing', { hideable: true })}
    >
      <div className="container">
        <div className={styles.sectionHead}>
          <div>
            {content.pricingEyebrow && (
              <p
                className={`eyebrow eyebrow--muted ${styles.lockupEyebrow}`}
                {...cms.field(cms.home('pricingEyebrow'))}
              >
                {content.pricingEyebrow}
              </p>
            )}
            <h2
              className={`section-title ${styles.lockupTitle}`}
              {...cms.field(cms.home('pricingHeading'))}
            >
              {content.pricingHeading}
            </h2>
            {content.pricingNote && (
              <p
                className={styles.lockupLede}
                {...cms.field(cms.home('pricingNote'), { multiline: true })}
              >
                {content.pricingNote}
              </p>
            )}
          </div>
        </div>

        <div className={styles.priceGrid} ref={gridRef} {...cms.list('pricing', 'grid')}>
          {plans.map((plan) => {
            const { prefix, amount } = splitPrice(plan.priceLabel);
            return (
              <article
                key={plan.id}
                className={`${styles.priceCard} ${plan.highlighted ? styles.priceCardHi : ''}`}
                {...cms.item('pricing', plan.id)}
              >
                {plan.highlighted && plan.highlightLabel && (
                  <span
                    className={styles.badgeTop}
                    {...cms.field(cms.itemLocale('pricing', plan.id, 'highlightLabel'))}
                  >
                    {plan.highlightLabel}
                  </span>
                )}
                <div>
                  <div
                    className={styles.priceName}
                    {...cms.field(cms.itemLocale('pricing', plan.id, 'name'))}
                  >
                    {plan.name}
                  </div>
                  <div
                    className={styles.priceAmountRow}
                    {...cms.field(cms.itemLocale('pricing', plan.id, 'priceLabel'), {
                      value: plan.priceLabel,
                    })}
                  >
                    {prefix && <span className={styles.priceFrom}>{prefix}</span>}
                    <span className={styles.priceValue}>{amount}</span>
                  </div>
                  {plan.termLine && (
                    <div
                      className={styles.priceTerm}
                      {...cms.field(cms.itemLocale('pricing', plan.id, 'termLine'))}
                    >
                      {plan.termLine}
                    </div>
                  )}
                </div>
                <p
                  className={styles.priceDesc}
                  {...cms.field(cms.itemLocale('pricing', plan.id, 'description'), {
                    multiline: true,
                  })}
                >
                  {plan.description}
                </p>
                <ul className={styles.priceFeatures}>
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      <span className={styles.check} aria-hidden="true">
                        ✓
                      </span>
                      <span {...cms.field(cms.itemLocale('pricing', plan.id, 'features', i))}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <ContactButton
                  label={chrome.navCta}
                  labelAttrs={cms.field(cms.chrome('navCta'))}
                  className={`btn ${plan.highlighted ? 'btn--primary' : 'btn--ghost'} ${styles.priceCta}`}
                />
              </article>
            );
          })}
          {cms.enabled && <CmsAddSlot collection="pricing" className={styles.priceSlot} />}
        </div>

        <div className={styles.priceSwipeHint} aria-hidden="true">
          <span className={styles.priceDots}>
            {plans.map((plan, i) => (
              <span key={plan.id} className={i === active ? styles.priceDotActive : undefined} />
            ))}
          </span>
          <span {...cms.field(cms.chrome('pricingSwipeHint'))}>{chrome.pricingSwipeHint}</span>
        </div>

        {content.pricingFootnote && (
          <p
            className={styles.priceFootnote}
            {...cms.field(cms.home('pricingFootnote'), { multiline: true })}
          >
            {content.pricingFootnote}
          </p>
        )}
      </div>
    </section>
  );
}
