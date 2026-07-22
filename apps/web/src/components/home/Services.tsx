import type { Service } from '@alcha/shared';
import styles from './home.module.css';

export function Services({ heading, services }: { heading: string; services: Service[] }) {
  return (
    <section className="section" id="services">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow eyebrow--muted">01 — 04</p>
          <h2 className="section-title">{heading}</h2>
        </div>
        <ul className={styles.svcList}>
          {services.map((service) => (
            <li key={service.id} className={styles.svcRow}>
              <span className={styles.svcNum}>{service.number}</span>
              <div className={styles.svcBody}>
                <h3 className={styles.svcTitle}>{service.title}</h3>
                <p className={styles.svcDesc}>{service.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
