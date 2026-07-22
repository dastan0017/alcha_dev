'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Logo } from './Logo';
import { LocaleSwitch } from './LocaleSwitch';
import { ContactButton } from './contact/ContactButton';

export function Header() {
  const t = useTranslations('nav');
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" aria-label="alcha.dev" onClick={close}>
          <Logo />
        </Link>

        <nav className="site-header__nav" aria-label="Primary">
          <Link href="/#works" className="nav-link">
            {t('works')}
          </Link>
          <Link href="/about" className="nav-link">
            {t('about')}
          </Link>
        </nav>

        <div className="site-header__actions">
          <LocaleSwitch />
          <span className="site-header__cta-desktop">
            <ContactButton label={t('cta')} />
          </span>
          <button
            type="button"
            className={`burger${menuOpen ? ' burger--open' : ''}`}
            aria-label={menuOpen ? t('close') : t('menu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label={t('menu')}>
          <nav className="mobile-menu__nav">
            <Link href="/#works" className="mobile-menu__link" onClick={close}>
              {t('works')}
            </Link>
            <Link href="/about" className="mobile-menu__link" onClick={close}>
              {t('about')}
            </Link>
          </nav>
          <div className="mobile-menu__actions">
            <LocaleSwitch />
            <ContactButton label={t('cta')} />
          </div>
        </div>
      )}
    </header>
  );
}
