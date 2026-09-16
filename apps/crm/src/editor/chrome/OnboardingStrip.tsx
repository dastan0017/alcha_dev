import { useState } from 'react';
import styles from './OnboardingStrip.module.css';

const storageKey = (userId: string) => `alcha-crm:site-tip-dismissed:${userId}`;

function readDismissed(userId: string): boolean {
  try {
    return localStorage.getItem(storageKey(userId)) === '1';
  } catch {
    return false;
  }
}

/**
 * «Как это работает» hint above the canvas, dismissed once per user (per browser).
 * TODO(dastan): the brief says «remembered per user» — this is localStorage, so it shows again
 * on another browser or device; persist the flag on the user in the API to make it per account.
 */
export function OnboardingStrip({ userId, hidden }: { userId: string; hidden: boolean }) {
  const [dismissed, setDismissed] = useState(() => readDismissed(userId));
  if (dismissed || hidden) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey(userId), '1');
    } catch {
      // Storage unavailable (private mode): the hint stays hidden for this visit only.
    }
  };

  return (
    <div className={styles.strip}>
      <span className={styles.tag}>Как это работает</span>
      <p className={styles.text}>
        Наведите на текст — он подсветится, кликните и правьте прямо на месте. У карточек и секций
        при наведении появляется панель: изменить, копировать, удалить, поменять местами.
      </p>
      <button type="button" className={styles.dismiss} onClick={dismiss}>
        Понятно <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}
