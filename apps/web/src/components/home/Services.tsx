import Image from 'next/image';
import type { Service } from '@alcha/shared';
import styles from './home.module.css';

/**
 * Looping SVG animations (design assets, ~4 KB each, no JS). Keyed by the
 * service number from the CMS so reordering/renaming in the CRM keeps them
 * paired; a service without a match simply renders without an animation.
 */
const SERVICE_ANIMATIONS: Record<string, string> = {
  '01': '/services/service-01-design.svg',
  '02': '/services/service-02-dev-seo.svg',
  '03': '/services/service-03-crm.svg',
  '04': '/services/service-04-server.svg',
};

export function Services({ heading, services }: { heading: string; services: Service[] }) {
  return (
    <section className="section" id="services">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow eyebrow--muted">01 — 04</p>
          <h2 className="section-title">{heading}</h2>
        </div>
        <ul className={styles.svcList}>
          {services.map((service) => {
            const animation = SERVICE_ANIMATIONS[service.number];
            return (
              <li key={service.id} className={styles.svcRow}>
                <span className={styles.svcNum}>{service.number}</span>
                <div className={styles.svcBody}>
                  <h3 className={styles.svcTitle}>{service.title}</h3>
                  <p className={styles.svcDesc}>{service.description}</p>
                </div>
                {animation && (
                  <Image
                    className={styles.svcAnim}
                    src={animation}
                    alt=""
                    aria-hidden="true"
                    width={440}
                    height={230}
                    unoptimized
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
