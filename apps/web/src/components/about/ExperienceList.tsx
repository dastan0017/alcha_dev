import type { Experience } from '@alcha/shared';
import styles from './about.module.css';

export function ExperienceList({
  heading,
  experiences,
}: {
  heading: string;
  experiences: Experience[];
}) {
  if (experiences.length === 0) return null;

  return (
    <section className="section">
      <div className="container">
        <h2 className={styles.sectionH2}>{heading}</h2>
        <ul className={styles.expList}>
          {experiences.map((exp) => (
            <li key={exp.id} className={styles.expRow}>
              <div className={styles.expLeft}>
                <h3 className={styles.expCompany}>{exp.company}</h3>
                <p className={styles.expRole}>{exp.role}</p>
                <p className={`mono ${styles.expMeta}`}>{exp.meta}</p>
              </div>
              <p className={styles.expDesc}>{exp.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
