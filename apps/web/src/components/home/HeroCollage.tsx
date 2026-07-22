import { useTranslations } from 'next-intl';
import styles from './home.module.css';

/** Decorative floating UI widgets from the design (browser mock, CRM, toast). */
export function HeroCollage() {
  const t = useTranslations('hero');

  return (
    <div className={styles.collage} aria-hidden="true">
      <div className={styles.browser}>
        <div className={styles.browserBar}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.browserUrl}>{t('browserBar')}</span>
        </div>
        <div className={styles.browserBody}>
          <div className={styles.mockHeadline} />
          <div className={styles.mockText} />
          <div className={styles.mockTextShort} />
          <div className={styles.mockBtn} />
        </div>
      </div>

      <div className={styles.crmCard}>
        <div className={styles.crmTitle}>{t('crmTitle')}</div>
        <div className={styles.crmRow}>
          <span className={styles.crmName} />
          <span className={`${styles.crmStatus} ${styles.crmNew}`}>{t('crmNew')}</span>
        </div>
        <div className={styles.crmRow}>
          <span className={styles.crmName} />
          <span className={`${styles.crmStatus} ${styles.crmProgress}`}>{t('crmInProgress')}</span>
        </div>
        <div className={styles.crmRow}>
          <span className={styles.crmName} />
          <span className={`${styles.crmStatus} ${styles.crmPaid}`}>{t('crmPaid')}</span>
        </div>
      </div>

      <div className={styles.toast}>
        <span className={styles.toastCheck}>✓</span>
        <div>
          <div className={styles.toastTitle}>{t('deploy')}</div>
          <div className={styles.toastStatus}>{t('deployStatus')}</div>
        </div>
      </div>

      <div className={styles.accessPill}>{t('accessPill')}</div>
    </div>
  );
}
