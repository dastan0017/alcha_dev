'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Logo } from './Logo';
import { LocaleSwitch } from './LocaleSwitch';
import { ContactButton } from './contact/ContactButton';

export function Header({ email }: { email?: string }) {
  const t = useTranslations('nav');
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  // The menu is a disclosure, not a modal: Escape closes it and the page
  // behind the scrim is held still while it is open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link href="/" aria-label="alcha.dev" onClick={close}>
            <Logo />
          </Link>

          <nav className="site-header__nav" aria-label="Primary">
            <Link href="/#works" className="nav-link">
              {t('works')}
            </Link>
            <Link href="/#pricing" className="nav-link">
              {t('pricing')}
            </Link>
            <Link href="/about" className="nav-link">
              {t('about')}
            </Link>
          </nav>

          <div className="site-header__actions">
            {/* v3 review: the mobile bar drops the RU/EN switch — it lives in
                the menu — so the CTA can sit beside the burger. */}
            <span className="site-header__locale">
              <LocaleSwitch />
            </span>
            <span className="site-header__cta-desktop">
              <ContactButton label={t('cta')} />
            </span>
            <span className="site-header__cta-mobile">
              <ContactButton label={t('ctaShort')} className="btn btn--primary btn--compact" />
            </span>
            <button
              type="button"
              className={`burger${menuOpen ? ' burger--open' : ''}`}
              aria-label={menuOpen ? t('close') : t('menu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mobile-menu" id="mobile-menu">
            <div className="container">
              <nav className="mobile-menu__nav" aria-label={t('menu')}>
                <Link href="/#works" className="mobile-menu__link" onClick={close}>
                  {t('works')}
                </Link>
                <Link href="/#pricing" className="mobile-menu__link" onClick={close}>
                  {t('pricing')}
                </Link>
                <Link href="/about" className="mobile-menu__link" onClick={close}>
                  {t('about')}
                </Link>
              </nav>
              <div className="mobile-menu__foot">
                <LocaleSwitch />
                {email && (
                  <a className="mobile-menu__email mono" href={`mailto:${email}`}>
                    {email}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {menuOpen && <div className="mobile-menu__scrim" onClick={close} aria-hidden="true" />}
    </>
  );
}
