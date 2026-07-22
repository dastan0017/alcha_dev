import styles from './CtaBanner.module.css';

export function CtaBanner({
  title,
  subtitle,
  telegramLabel,
  cvLabel,
  telegramUrl,
  cvUrl,
}: {
  title: string;
  subtitle: string;
  telegramLabel: string;
  cvLabel: string;
  telegramUrl: string;
  cvUrl: string;
}) {
  return (
    <section className={styles.cta}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.actions}>
          {telegramUrl && (
            <a
              className="btn btn--on-dark"
              href={telegramUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              {telegramLabel}
            </a>
          )}
          {cvUrl && (
            <a className="btn btn--on-dark-ghost" href={cvUrl} target="_blank" rel="noreferrer noopener">
              {cvLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
