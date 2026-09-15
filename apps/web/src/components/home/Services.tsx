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
    <section className={styles.svcSection} id="services">
      <div className="container">
        <div className={styles.sectionHead}>
          <div>
            {content.servicesEyebrow && (
              <p className={`eyebrow eyebrow--muted ${styles.lockupEyebrow}`}>
                {content.servicesEyebrow}
              </p>
            )}
            <h2 className={`section-title ${styles.lockupTitle}`}>{content.servicesHeading}</h2>
            {content.servicesLede && (
              <p className={`${styles.lockupLede} ${styles.svcLede}`}>{content.servicesLede}</p>
            )}
          </div>
        </div>

        <article className={styles.svcFeatured}>
          {featured.badge && <span className={styles.badgeTop}>{featured.badge}</span>}
          <div>
            <div className={styles.svcFeaturedTop}>
              <span className={styles.svcNumFeatured}>{featured.number}</span>
              <h3 className={styles.svcFeaturedTitle}>{featured.title}</h3>
            </div>
            <p className={styles.svcFeaturedDesc}>{featured.description}</p>
          </div>
          <Ticks items={featured.bullets} className={styles.svcFeaturedTicks} />
        </article>

        {rest.length > 0 && (
          <>
            {content.servicesSecondaryLabel && (
              <p className={styles.svcSecondaryLabel}>{content.servicesSecondaryLabel}</p>
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
