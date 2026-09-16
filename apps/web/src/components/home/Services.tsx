import type { HomeContent, Locale, Service } from '@alcha/shared';
import { cmsAttrs, type Cms } from '@/lib/cms';
import { CmsAddSlot } from '../preview/CmsAddSlot';
import { CmsHiddenSection } from '../preview/CmsHiddenSection';
import styles from './home.module.css';

function Ticks({ service, className, cms }: { service: Service; className: string; cms: Cms }) {
  if (service.bullets.length === 0) return null;
  return (
    <ul className={className}>
      {service.bullets.map((item, i) => (
        <li key={i}>
          <span className={styles.tick} aria-hidden="true">
            ✓
          </span>
          <span {...cms.field(cms.itemLocale('services', service.id, 'bullets', i))}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Services({
  content,
  services,
  hidden,
  preview,
  locale,
}: {
  content: HomeContent;
  services: Service[];
  hidden: boolean;
  preview: boolean;
  locale: Locale;
}) {
  const cms = cmsAttrs(preview, locale);
  if (hidden) return cms.enabled ? <CmsHiddenSection section="services" variant="hidden" /> : null;
  if (services.length === 0) {
    return cms.enabled ? (
      <CmsHiddenSection section="services" variant="empty" collection="services" />
    ) : null;
  }

  const featured = services.find((s) => s.featured) ?? services[0];
  const rest = services.filter((s) => s.id !== featured.id);

  return (
    <section
      className={styles.svcSection}
      id="services"
      {...cms.section('services', { hideable: true })}
    >
      <div className="container">
        <div className={styles.sectionHead}>
          <div>
            {content.servicesEyebrow && (
              <p
                className={`eyebrow eyebrow--muted ${styles.lockupEyebrow}`}
                {...cms.field(cms.home('servicesEyebrow'))}
              >
                {content.servicesEyebrow}
              </p>
            )}
            <h2
              className={`section-title ${styles.lockupTitle}`}
              {...cms.field(cms.home('servicesHeading'))}
            >
              {content.servicesHeading}
            </h2>
            {content.servicesLede && (
              <p
                className={`${styles.lockupLede} ${styles.svcLede}`}
                {...cms.field(cms.home('servicesLede'), { multiline: true })}
              >
                {content.servicesLede}
              </p>
            )}
          </div>
        </div>

        <article className={styles.svcFeatured} {...cms.item('services', featured.id)}>
          {featured.badge && (
            <span
              className={styles.badgeTop}
              {...cms.field(cms.itemLocale('services', featured.id, 'badge'))}
            >
              {featured.badge}
            </span>
          )}
          <div>
            <div className={styles.svcFeaturedTop}>
              <span
                className={styles.svcNumFeatured}
                {...cms.field(cms.itemField('services', featured.id, 'number'))}
              >
                {featured.number}
              </span>
              <h3
                className={styles.svcFeaturedTitle}
                {...cms.field(cms.itemLocale('services', featured.id, 'title'))}
              >
                {featured.title}
              </h3>
            </div>
            <p
              className={styles.svcFeaturedDesc}
              {...cms.field(cms.itemLocale('services', featured.id, 'description'), {
                multiline: true,
              })}
            >
              {featured.description}
            </p>
          </div>
          <Ticks service={featured} className={styles.svcFeaturedTicks} cms={cms} />
        </article>

        {rest.length > 0 && content.servicesSecondaryLabel && (
          <p
            className={styles.svcSecondaryLabel}
            {...cms.field(cms.home('servicesSecondaryLabel'))}
          >
            {content.servicesSecondaryLabel}
          </p>
        )}
        {/* In preview the grid stays without supporting cards, to hold the add slot.
            TODO(dastan): with only the featured service, Просмотр keeps that empty grid
            while production renders none; fine while the grid has no margin of its own. */}
        {(rest.length > 0 || cms.enabled) && (
          <div className={styles.svcGrid} {...cms.list('services', 'grid')}>
            {rest.map((service) => (
              <article
                key={service.id}
                className={styles.svcCard}
                {...cms.item('services', service.id)}
              >
                <div className={styles.svcCardHead}>
                  <span
                    className={styles.svcNum}
                    {...cms.field(cms.itemField('services', service.id, 'number'))}
                  >
                    {service.number}
                  </span>
                  <h3
                    className={styles.svcCardTitle}
                    {...cms.field(cms.itemLocale('services', service.id, 'title'))}
                  >
                    {service.title}
                  </h3>
                </div>
                <p
                  className={styles.svcCardDesc}
                  {...cms.field(cms.itemLocale('services', service.id, 'description'), {
                    multiline: true,
                  })}
                >
                  {service.description}
                </p>
                <Ticks service={service} className={styles.svcCardTicks} cms={cms} />
                {service.techLine && (
                  <p
                    className={`mono ${styles.svcTech}`}
                    {...cms.field(cms.itemLocale('services', service.id, 'techLine'))}
                  >
                    {service.techLine}
                  </p>
                )}
              </article>
            ))}
            {cms.enabled && <CmsAddSlot collection="services" />}
          </div>
        )}
      </div>
    </section>
  );
}
