import { useTranslations } from 'next-intl';
import type { SiteSettings } from '@alcha/shared';
import { Link } from '@/i18n/navigation';
import { Logo } from './Logo';

interface SocialLink {
  label: string;
  href: string;
}

export function Footer({ settings }: { settings: SiteSettings }) {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const year = new Date().getFullYear();

  const socials: SocialLink[] = [
    settings.github && { label: 'GitHub', href: settings.github },
    settings.linkedin && { label: 'LinkedIn', href: settings.linkedin },
    settings.telegram && { label: 'Telegram', href: settings.telegram },
    settings.instagram && { label: 'Instagram', href: settings.instagram },
  ].filter(Boolean) as SocialLink[];

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <Logo variant="dark" size={22} />
          <p className="site-footer__tagline">{t('tagline')}</p>
          {settings.email && (
            <a className="site-footer__email" href={`mailto:${settings.email}`}>
              {settings.email}
            </a>
          )}
        </div>

        <nav className="site-footer__col" aria-label={t('navHeading')}>
          <p className="site-footer__heading">{t('navHeading')}</p>
          <Link href="/#works" className="site-footer__link">
            {nav('works')}
          </Link>
          <Link href="/#pricing" className="site-footer__link">
            {nav('pricing')}
          </Link>
          <Link href="/about" className="site-footer__link">
            {nav('about')}
          </Link>
        </nav>

        {socials.length > 0 && (
          <div className="site-footer__col">
            <p className="site-footer__heading">{t('contactsHeading')}</p>
            {socials.map((s) => (
              <a
                key={s.label}
                className="site-footer__link"
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
              >
                {s.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="container site-footer__bottom">
        <span>
          © {year} alcha.dev — {t('rights')}
        </span>
        <span className="mono">{t('madeIn')}</span>
      </div>
    </footer>
  );
}
