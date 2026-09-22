import type { CmsLocalizedField, HomeContent, Locale, PricingPlan } from '@alcha/shared';
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

/**
 * «Цены» (design «Pricing Section Options» 1a, docs/visual-editor.md D17): each card
 * leads with its price and button, then says who the plan is for, and its list heading
 * carries the tier ladder («Всё из «Лендинга», плюс:»). Payment terms appear only in
 * the footnote.
 */
export function Pricing({
  content,
  plans,
  hidden,
  preview,
  locale,
}: {
  content: HomeContent;
  plans: PricingPlan[];
  hidden: boolean;
  preview: boolean;
  locale: Locale;
}) {
  const cms = cmsAttrs(preview, locale);
  if (hidden) return cms.enabled ? <CmsHiddenSection section="pricing" variant="hidden" /> : null;
  if (plans.length === 0) {
    return cms.enabled ? (
      <CmsHiddenSection section="pricing" variant="empty" collection="pricing" />
    ) : null;
  }

  // Only the first flagged plan is highlighted (the editor keeps the flag exclusive).
  const highlightedId = plans.find((plan) => plan.highlighted)?.id;

  return (
    <section
      className={styles.priceSection}
      id="pricing"
      {...cms.section('pricing', { hideable: true })}
    >
      <div className="container">
        <div className={styles.sectionHead}>
          <div className={styles.priceIntro}>
            {content.pricingEyebrow && (
              <p
                className={`eyebrow ${styles.lockupEyebrow} ${styles.priceEyebrow}`}
                {...cms.field(cms.home('pricingEyebrow'))}
              >
                {content.pricingEyebrow}
              </p>
            )}
            <h2
              className={`section-title ${styles.lockupTitle} ${styles.priceTitle}`}
              {...cms.field(cms.home('pricingHeading'))}
            >
              {content.pricingHeading}
            </h2>
            {content.pricingNote && (
              <p
                className={`${styles.lockupLede} ${styles.priceLede}`}
                {...cms.field(cms.home('pricingNote'), { multiline: true })}
              >
                {content.pricingNote}
              </p>
            )}
          </div>
        </div>

        {/* role="list": `list-style: none` drops the list semantics in Safari/VoiceOver. */}
        <ul role="list" className={styles.priceGrid} {...cms.list('pricing', 'grid')}>
          {plans.map((plan) => {
            const isHighlighted = plan.id === highlightedId;
            const { prefix, amount } = splitPrice(plan.priceLabel);
            const headingId = `pricing-${plan.id}-includes`;
            const field = (name: CmsLocalizedField<'pricing'>, index?: number) =>
              cms.itemLocale('pricing', plan.id, name, index);

            return (
              <li
                key={plan.id}
                className={`${styles.priceCard} ${isHighlighted ? styles.priceCardHi : ''}`}
                {...cms.item('pricing', plan.id)}
              >
                {isHighlighted && plan.highlightLabel && (
                  <span className={styles.badgeTop} {...cms.field(field('highlightLabel'))}>
                    {plan.highlightLabel}
                  </span>
                )}

                <div className={styles.priceTop}>
                  <h3 className={styles.priceName} {...cms.field(field('name'))}>
                    {plan.name}
                  </h3>
                  <p
                    className={styles.priceAmountRow}
                    {...cms.field(field('priceLabel'), { value: plan.priceLabel })}
                  >
                    {prefix && <span className={styles.priceFrom}>{prefix}</span>}
                    <span className={styles.priceValue}>{amount}</span>
                  </p>
                  {plan.termLine && (
                    <p className={styles.priceTerm} {...cms.field(field('termLine'))}>
                      {plan.termLine}
                    </p>
                  )}
                </div>

                <ContactButton
                  label={plan.ctaLabel}
                  labelAttrs={cms.field(field('ctaLabel'))}
                  className={`btn ${isHighlighted ? 'btn--primary' : 'btn--ghost'} ${styles.priceCta}`}
                />

                <div className={styles.priceWho}>
                  <p
                    className={styles.priceDesc}
                    {...cms.field(field('description'), { multiline: true })}
                  >
                    {plan.description}
                  </p>
                  {plan.examples && (
                    <p className={styles.priceExamples}>
                      {content.pricingExamplesLabel && (
                        <>
                          <span {...cms.field(cms.home('pricingExamplesLabel'))}>
                            {content.pricingExamplesLabel}
                          </span>{' '}
                        </>
                      )}
                      <span {...cms.field(field('examples'))}>{plan.examples}</span>
                    </p>
                  )}
                </div>

                <div className={styles.priceRule} aria-hidden="true" />

                <div className={styles.priceList}>
                  {plan.listHeading && (
                    <p
                      id={headingId}
                      className={styles.priceListHeading}
                      {...cms.field(field('listHeading'))}
                    >
                      {plan.listHeading}
                    </p>
                  )}
                  <ul
                    role="list"
                    className={styles.priceFeatures}
                    aria-labelledby={plan.listHeading ? headingId : undefined}
                  >
                    {plan.features.map((feature, i) => (
                      <li key={`feature-${i}`}>
                        <span className={styles.check} aria-hidden="true">
                          ✓
                        </span>
                        <span {...cms.field(field('features', i))}>{feature}</span>
                      </li>
                    ))}
                    {/* Optional add-ons: a «+», never a ✓, and the «По желанию:» label,
                        which is also what tells a screen reader the row is optional. */}
                    {plan.extras.map((extra, i) => (
                      <li key={`extra-${i}`} className={styles.priceExtra}>
                        <span className={styles.plus} aria-hidden="true">
                          +
                        </span>
                        <span>
                          {content.pricingOptionalLabel && (
                            <>
                              <span {...cms.field(cms.home('pricingOptionalLabel'))}>
                                {content.pricingOptionalLabel}
                              </span>{' '}
                            </>
                          )}
                          <span {...cms.field(field('extras', i))}>{extra}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
          {cms.enabled && <CmsAddSlot collection="pricing" as="li" className={styles.priceSlot} />}
        </ul>

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
