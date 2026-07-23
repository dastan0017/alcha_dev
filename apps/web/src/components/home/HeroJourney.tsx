import { useTranslations } from 'next-intl';
import styles from './home.module.css';

/**
 * Decorative hero illustration (design 8a): the client's path in three steps —
 * Google search → the site + request form → the lead landing in the CRM.
 */
export function HeroJourney() {
  const t = useTranslations('hero');

  return (
    <div className={styles.journey} aria-hidden="true">
      {/* 1 — Google search */}
      <div className={styles.jCard}>
        <div className={styles.jLabel}>{t('step1')}</div>
        <div className={styles.jSearch}>
          <span className={styles.jGlass} />
          <span className={styles.jQuery}>{t('query')}</span>
        </div>
        <div className={styles.jResult}>
          <div>
            <div className={styles.jResultTitle}>{t('resultTitle')}</div>
            <div className={styles.jResultUrl}>{t('resultUrl')}</div>
          </div>
          <span className={styles.jRank}>{t('rank')}</span>
        </div>
      </div>

      <div className={styles.jArrow}>↓</div>

      {/* 2 — the site + request form */}
      <div className={styles.jCard}>
        <div className={styles.jLabel}>{t('step2')}</div>
        <div className={styles.jBrowser}>
          <div className={styles.jBrowserBar}>
            <span className={styles.jDot} />
            <span className={styles.jDot} />
            <span className={styles.jDot} />
            <span className={styles.jBrowserUrl}>{t('resultUrl')}</span>
          </div>
          <div className={styles.jBrowserBody}>
            <div className={styles.jSiteTitle}>{t('siteTitle')}</div>
            <div className={styles.jSiteSub}>{t('siteSub')}</div>
            <div className={styles.jForm}>
              <span className={styles.jField}>{t('formName')}</span>
              <span className={styles.jField}>{t('formPhone')}</span>
              <span className={styles.jSubmit}>{t('formSubmit')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.jArrow}>↓</div>

      {/* 3 — the lead in the CRM */}
      <div className={styles.jCard}>
        <div className={styles.jLabel}>{t('step3')}</div>
        <div className={styles.jLeads}>
          {(
            [
              ['lead1', 'lead1meta', 'statusNew', styles.jStatusNew],
              ['lead2', 'lead2meta', 'statusProgress', styles.jStatusProgress],
              ['lead3', 'lead3meta', 'statusPaid', styles.jStatusPaid],
            ] as const
          ).map(([name, meta, status, statusClass]) => (
            <div key={name} className={styles.jLead}>
              <div>
                <div className={styles.jLeadName}>{t(name)}</div>
                <div className={styles.jLeadMeta}>{t(meta)}</div>
              </div>
              <span className={`${styles.jStatus} ${statusClass}`}>{t(status)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.jPills}>
        <span className={`${styles.jPill} ${styles.jPillGreen}`}>
          <span className={styles.jPillTick}>✓</span>
          {t('pillLaunched')}
        </span>
        <span className={`${styles.jPill} ${styles.jPillNeutral}`}>
          <span className={styles.jPillTickPurple}>✓</span>
          {t('pillYours')}
        </span>
      </div>
    </div>
  );
}
