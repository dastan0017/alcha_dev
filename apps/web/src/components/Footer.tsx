import type { HomeSectionKey, Locale, SiteChrome, SiteSettings } from '@alcha/shared';
import { Link } from '@/i18n/navigation';
import { cmsAttrs } from '@/lib/cms';
import { Logo } from './Logo';

interface SocialLink {
  label: string;
  href: string;
}

export function Footer({
  settings,
  chrome,
  hiddenSections,
  preview,
  locale,
}: {
  settings: SiteSettings;
  chrome: SiteChrome;
  /** Home sections the owner hid: their anchors would lead nowhere, so their links go too. */
  hiddenSections: HomeSectionKey[];
  preview: boolean;
  locale: Locale;
}) {
  const year = new Date().getFullYear();
  const cms = cmsAttrs(preview, locale);

  const socials: SocialLink[] = [
    settings.github && { label: 'GitHub', href: settings.github },
    settings.linkedin && { label: 'LinkedIn', href: settings.linkedin },
    settings.telegram && { label: 'Telegram', href: settings.telegram },
    settings.instagram && { label: 'Instagram', href: settings.instagram },
  ].filter(Boolean) as SocialLink[];

  return (
    <footer className="site-footer" {...cms.section('footer')}>
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <Logo variant="dark" size={22} />
          <p className="site-footer__tagline" {...cms.field(cms.chrome('footerTagline'))}>
            {chrome.footerTagline}
          </p>
          {settings.email && (
            <a className="site-footer__email" href={`mailto:${settings.email}`}>
              {settings.email}
            </a>
          )}
        </div>

        <nav className="site-footer__col" aria-label={chrome.footerNavHeading}>
          <p className="site-footer__heading" {...cms.field(cms.chrome('footerNavHeading'))}>
            {chrome.footerNavHeading}
          </p>
          {!hiddenSections.includes('works') && (
            <Link
              href="/#works"
              className="site-footer__link"
              {...cms.field(cms.chrome('navWorks'))}
            >
              {chrome.navWorks}
            </Link>
          )}
          {!hiddenSections.includes('pricing') && (
            <Link
              href="/#pricing"
              className="site-footer__link"
              {...cms.field(cms.chrome('navPricing'))}
            >
              {chrome.navPricing}
            </Link>
          )}
          <Link href="/about" className="site-footer__link" {...cms.field(cms.chrome('navAbout'))}>
            {chrome.navAbout}
          </Link>
        </nav>

        {socials.length > 0 && (
          <div className="site-footer__col">
            <p className="site-footer__heading" {...cms.field(cms.chrome('footerContactsHeading'))}>
              {chrome.footerContactsHeading}
            </p>
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
          © {year} alcha.dev —{' '}
          <span {...cms.field(cms.chrome('footerRights'))}>{chrome.footerRights}</span>
        </span>
        <span className="mono" {...cms.field(cms.chrome('footerMadeIn'))}>
          {chrome.footerMadeIn}
        </span>
      </div>
    </footer>
  );
}
