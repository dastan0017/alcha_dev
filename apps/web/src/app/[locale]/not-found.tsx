import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import styles from './not-found.module.css';

export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <div className={`container ${styles.wrap}`}>
      <p className={styles.code}>{t('code')}</p>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.desc}>{t('description')}</p>
      <Link href="/" className="btn btn--primary">
        {t('home')}
      </Link>
    </div>
  );
}
