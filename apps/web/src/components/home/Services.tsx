import type { HomeContent, Service } from '@alcha/shared';
import styles from './home.module.css';

function Ticks({ items, className }: { items: string[]; className: string }) {
  if (items.length === 0) return null;
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item}>
          <span className={styles.tick} aria-hidden="true">
            ✓
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Services({ content, services }: { content: HomeContent; services: Service[] }) {
  if (services.length === 0) return null;

  const featured = services.find((s) => s.featured) ?? services[0];
  const rest = services.filter((s) => s.id !== featured.id);

  return (
    <section className="section" id="services">
      <div className="container">
        <div className={styles.svcHead}>
          {content.servicesEyebrow && (
            <p className="eyebrow eyebrow--muted">{content.servicesEyebrow}</p>
          )}
          <h2 className="section-title">{content.servicesHeading}</h2>
          {content.servicesLede && <p className={styles.svcLede}>{content.servicesLede}</p>}
        </div>

        <article className={styles.svcFeatured}>
          <div className={styles.svcFeaturedMain}>
            <div className={styles.svcFeaturedTop}>
              <span className={styles.svcNumFeatured}>{featured.number}</span>
              {featured.badge && <span className={styles.svcBadge}>{featured.badge}</span>}
            </div>
            <h3 className={styles.svcFeaturedTitle}>{featured.title}</h3>
            <p className={styles.svcFeaturedDesc}>{featured.description}</p>
          </div>
          <Ticks items={featured.bullets} className={styles.svcFeaturedTicks} />
        </article>

        {rest.length > 0 && (
          <>
            {content.servicesSecondaryLabel && (
              <p className={`eyebrow eyebrow--muted ${styles.svcSecondaryLabel}`}>
                {content.servicesSecondaryLabel}
              </p>
            )}
            <div className={styles.svcGrid}>
              {rest.map((service) => (
                <article key={service.id} className={styles.svcCard}>
                  <div className={styles.svcCardHead}>
                    <span className={styles.svcNum}>{service.number}</span>
                    <h3 className={styles.svcCardTitle}>{service.title}</h3>
                  </div>
                  <p className={styles.svcCardDesc}>{service.description}</p>
                  <Ticks items={service.bullets} className={styles.svcCardTicks} />
                  {service.techLine && (
                    <p className={`mono ${styles.svcTech}`}>{service.techLine}</p>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
