import { useTranslations } from 'next-intl';
import styles from './home.module.css';

/**
 * Mobile-only hero illustration (design 12a v2). A leaner take on the desktop
 * journey (8a): a mini Google SERP where the client ranks #1 (rating instead of
 * a "#1" badge) above two anonymised competitors, a single request form, and
 * one lead landing in the CRM. Rendered under 768px — the desktop
 * <HeroJourney/> is hidden there and vice-versa.
 */
export function HeroJourneyMobile() {
  const t = useTranslations('hero');

  return (
    <div className={styles.journeyMobile} aria-hidden="true">
      <div className={styles.jmHeading}>{t('mobile.heading')}</div>

      {/* 1 — Google search, the client ranks #1 */}
      <div className={styles.jCard}>
        <div className={styles.jmLabel}>
          <span className={styles.jmDot} />
          {t('mobile.step1')}
        </div>
        <div className={styles.jSearch}>
          <span className={styles.jGlass} />
          <span className={styles.jQuery}>{t('query')}</span>
        </div>

        <div className={styles.jmResultTop}>
          <div className={styles.jResultTitle}>{t('mobile.resultTitle')}</div>
          <div className={styles.jmResultSub}>{t('mobile.resultSub')}</div>
          <div className={styles.jmRatingRow}>
            <span className={styles.jmStars}>★★★★★</span>
            <span className={styles.jmRatingNum}>{t('mobile.rating')}</span>
            <span className={styles.jmReviews}>{t('mobile.reviews')}</span>
          </div>
        </div>

        <div className={styles.jmComp}>
          <div className={styles.jmCompName}>{t('mobile.comp2Name')}</div>
          <div className={styles.jmCompDesc}>{t('mobile.comp2Desc')}</div>
        </div>
        <div className={styles.jmComp}>
          <div className={styles.jmCompName}>{t('mobile.comp3Name')}</div>
          <div className={styles.jmCompDesc}>{t('mobile.comp3Desc')}</div>
        </div>
      </div>

      <div className={styles.jArrow}>↓</div>

      {/* 2 — the request form */}
      <div className={styles.jCard}>
        <div className={styles.jmLabel}>
          <span className={styles.jmDot} />
          {t('mobile.step2')}
        </div>
        <div className={styles.jmForm}>
          <span className={styles.jmFormField}>{t('formName')}</span>
          <span className={styles.jmFormField}>{t('formPhone')}</span>
          <span className={styles.jmFormSubmit}>{t('formSubmit')}</span>
        </div>
      </div>

      <div className={styles.jArrow}>↓</div>

      {/* 3 — the lead in the CRM (single) */}
      <div className={styles.jCard}>
        <div className={styles.jmLabel}>
          <span className={styles.jmDot} />
          {t('mobile.step3')}
        </div>
        <div className={styles.jLead}>
          <div>
            <div className={styles.jLeadName}>{t('lead1')}</div>
            <div className={styles.jLeadMeta}>{t('lead1meta')}</div>
          </div>
          <span className={`${styles.jStatus} ${styles.jStatusNew}`}>{t('statusNew')}</span>
        </div>
      </div>

      <div className={styles.jPills}>
        <span className={`${styles.jPill} ${styles.jPillGreen}`}>
          <span className={styles.jPillTick}>✓</span>
          {t('pillLaunched')}
        </span>
        <span className={`${styles.jPill} ${styles.jPillNeutral}`}>
          <span className={styles.jPillTickPurple}>✓</span>
          {t('mobile.pillYours')}
        </span>
      </div>
    </div>
  );
}
