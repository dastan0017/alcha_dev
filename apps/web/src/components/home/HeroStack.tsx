import { useTranslations } from 'next-intl';
import styles from './home.module.css';

/**
 * Decorative hero illustration (design 13a): the product itself, top to bottom —
 * 1 the finished site the way a client sees it, 2 the same site inside the
 * owner's panel, where a short loop retypes the headline and a price and hits
 * «Опубликовать», 3 the CRM every request lands in. Replaces the two journey
 * illustrations (8a desktop / 12a mobile): one fluid component now serves both,
 * shrinking from the 460px desktop track down to 390px on a phone.
 *
 * Pure decoration — the root is `aria-hidden` and nothing inside is focusable,
 * so the animated panel is invisible to assistive tech. The loop is disabled
 * under `prefers-reduced-motion`, where every animated node's base state is
 * authored to be the story's end state (see `home.module.css`).
 */
export function HeroStack() {
  const t = useTranslations('hero');

  return (
    <div className={styles.hsCol} aria-hidden="true">
      {/* 1 — the live site, as a client sees it */}
      <div className={styles.hsCard}>
        <div className={styles.hsHead}>
          <span className={styles.hsLabel}>{t('c1Label')}</span>
          <span className={styles.hsCaption}>{t('c1Caption')}</span>
        </div>
        <div className={styles.hsWindow}>
          <div className={styles.hsChrome}>
            <span className={styles.hsDot} />
            <span className={styles.hsDot} />
            <span className={styles.hsDot} />
            <span className={styles.hsUrl}>{t('c1Url')}</span>
          </div>
          <div className={styles.hsBody}>
            <div className={styles.hsSite}>
              <span className={styles.hsSiteTitle}>{t('siteTitle')}</span>
              <span className={styles.hsSiteMeta}>{t('siteMeta')}</span>
              <span className={styles.hsSiteCta}>{t('siteCta')}</span>
            </div>
            <div className={styles.hsPrices}>
              <div className={`${styles.hsPriceRow} ${styles.hsPriceRule}`}>
                <span className={styles.hsPriceName}>{t('price1Name')}</span>
                <span className={styles.hsPriceVal}>{t('price1')}</span>
              </div>
              <div className={`${styles.hsPriceRow} ${styles.hsPriceRule}`}>
                <span className={styles.hsPriceName}>{t('price2Name')}</span>
                <span className={styles.hsPriceVal}>{t('price2')}</span>
              </div>
              <div className={styles.hsPriceRow}>
                <span className={styles.hsPriceName}>{t('price3Name')}</span>
                <span className={styles.hsPriceVal}>{t('price3')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.hsArrow}>↓</div>

      {/* 2 — the same site in the owner's panel: edit the copy, publish */}
      <div className={styles.hsCard}>
        <div className={styles.hsHead}>
          <span className={styles.hsLabel}>{t('c2Label')}</span>
          <span className={styles.hsCaption}>{t('c2Caption')}</span>
        </div>
        <div className={`${styles.hsWindow} ${styles.hsWindowLive}`}>
          <div className={styles.hsChrome}>
            <span className={styles.hsWinName}>{t('panelChrome')}</span>
            <span className={styles.hsPublish}>
              <span className={styles.hsPublishLabel}>{t('publish')}</span>
              <span className={styles.hsPublishDone}>{t('published')}</span>
            </span>
          </div>
          <div className={styles.hsBody}>
            <div className={styles.hsSite}>
              <div className={styles.hsEdit}>
                <span className={styles.hsSwap}>
                  <span className={styles.hsTitleOld}>
                    {t('siteTitle')}
                    <span className={styles.hsCaret} />
                  </span>
                  <span className={styles.hsTitleNew}>
                    {t('siteTitleNew')}
                    <span className={styles.hsCaret} />
                  </span>
                </span>
              </div>
              <span className={styles.hsSiteMeta}>{t('siteMeta')}</span>
              <span className={styles.hsSiteCta}>{t('siteCta')}</span>
            </div>
            <div className={styles.hsPrices}>
              <div className={styles.hsEditPrice}>
                <span className={styles.hsPriceName}>{t('price1Name')}</span>
                <span className={styles.hsSwapPrice}>
                  <span className={styles.hsPriceOld}>
                    {t('price1')}
                    <span className={styles.hsCaretPrice} />
                  </span>
                  <span className={styles.hsPriceNew}>
                    {t('price1New')}
                    <span className={styles.hsCaretPrice} />
                  </span>
                </span>
              </div>
              <div className={`${styles.hsPriceRow} ${styles.hsPriceRuleTop}`}>
                <span className={styles.hsPriceName}>{t('price2Name')}</span>
                <span className={styles.hsPriceVal}>{t('price2')}</span>
              </div>
              <div className={`${styles.hsPriceRow} ${styles.hsPriceRuleTop}`}>
                <span className={styles.hsPriceName}>{t('price3Name')}</span>
                <span className={styles.hsPriceVal}>{t('price3')}</span>
              </div>
            </div>
          </div>
          {/* Ripple then cursor: the window's last two children, so both are
              positioned against it and paint over the panel. */}
          <span className={styles.hsRipple} />
          <span className={styles.hsCursor} />
        </div>
      </div>

      <div className={styles.hsArrow}>↓</div>

      {/* 3 — the CRM the requests land in */}
      <div className={styles.hsCard}>
        <div className={styles.hsHead}>
          <span className={styles.hsLabel}>{t('c3Label')}</span>
          <span className={styles.hsCaption}>{t('c3Caption')}</span>
        </div>
        <div className={styles.hsWindow}>
          <div className={styles.hsChrome}>
            <span className={styles.hsWinName}>{t('crmChrome')}</span>
            <span className={styles.hsChromeEnd}>
              <span className={styles.hsChip}>{t('crmNewChip')}</span>
            </span>
          </div>
          <div className={styles.hsCrm}>
            <div className={styles.hsNav}>
              <span className={`${styles.hsNavItem} ${styles.hsNavItemActive}`}>
                {t('navLeads')}
              </span>
              <span className={styles.hsNavItem}>{t('navClients')}</span>
              <span className={styles.hsNavItem}>{t('navPayments')}</span>
            </div>
            <div className={styles.hsLeads}>
              <div className={styles.hsLead}>
                <span className={styles.hsLeadName}>{t('lead1')}</span>
                <span className={styles.hsChip}>{t('lead1Channel')}</span>
                <span className={styles.hsStatus}>{t('lead1Status')}</span>
              </div>
              <div className={styles.hsLead}>
                <span className={styles.hsLeadName}>{t('lead2')}</span>
                <span className={`${styles.hsChip} ${styles.hsChipWa}`}>{t('lead2Channel')}</span>
                <span className={`${styles.hsStatus} ${styles.hsStatusProgress}`}>
                  {t('lead2Status')}
                </span>
              </div>
              <div className={styles.hsLead}>
                <span className={styles.hsLeadName}>{t('lead3')}</span>
                <span className={`${styles.hsChip} ${styles.hsChipIg}`}>{t('lead3Channel')}</span>
                <span className={`${styles.hsStatus} ${styles.hsStatusPaid}`}>
                  {t('lead3Status')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.hsPills}>
        <span className={`${styles.hsPill} ${styles.hsPillGreen}`}>
          <span className={styles.hsTick}>✓</span>
          {t('pillLaunched')}
        </span>
        <span className={`${styles.hsPill} ${styles.hsPillNeutral}`}>
          <span className={styles.hsTickPurple}>✓</span>
          {t('pillYours')}
        </span>
      </div>
    </div>
  );
}
