import type { CSSProperties } from 'react';
import Image from 'next/image';
import type { AboutProfile, SiteSettings } from '@alcha/shared';
import styles from './about.module.css';

interface Social {
  label: string;
  href: string;
  external: boolean;
  /** Initials shown in the round badge. */
  badge: string;
  /** Brand colour: badge background and hover border, per the design. */
  brand: string;
}

export function AboutHero({
  profile,
  settings,
  cvLabel,
}: {
  profile: AboutProfile;
  settings: SiteSettings;
  cvLabel: string;
}) {
  const socials: Social[] = [
    settings.github && {
      label: 'GitHub',
      href: settings.github,
      external: true,
      badge: 'GH',
      brand: '#17121F',
    },
    settings.linkedin && {
      label: 'LinkedIn',
      href: settings.linkedin,
      external: true,
      badge: 'in',
      brand: '#0A66C2',
    },
    settings.telegram && {
      label: 'Telegram',
      href: settings.telegram,
      external: true,
      badge: 'TG',
      brand: '#229ED9',
    },
    settings.email && {
      label: settings.email,
      href: `mailto:${settings.email}`,
      external: false,
      badge: '@',
      brand: '#5B34C9',
    },
  ].filter(Boolean) as Social[];

  return (
    <section className={`section ${styles.hero}`}>
      <div className={`container ${styles.heroInner}`}>
        <div className={styles.heroCopy}>
          <h1 className={styles.name}>{profile.name}</h1>
          {/* Admin-authored rich text (bold highlights) from the CRM. */}
          <div className={styles.bio} dangerouslySetInnerHTML={{ __html: profile.bioHtml }} />
          <div className={styles.heroActions}>
            {settings.cvUrl && (
              <a
                className="btn btn--primary"
                href={settings.cvUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                {cvLabel}
              </a>
            )}
            <ul className={styles.socials}>
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    className={styles.socialPill}
                    style={{ '--brand': s.brand } as CSSProperties}
                    href={s.href}
                    {...(s.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                  >
                    <span className={styles.socialBadge} aria-hidden="true">
                      {s.badge}
                    </span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <figure className={styles.photoCard}>
          {profile.photoUrl ? (
            <Image
              src={profile.photoUrl}
              alt={profile.name}
              fill
              sizes="(max-width: 768px) 90vw, 420px"
              className={styles.photo}
              priority
            />
          ) : (
            <div className={`screenshot-placeholder ${styles.photoPlaceholder}`}>{profile.name}</div>
          )}
          {profile.photoCaption && (
            <figcaption className={styles.caption}>{profile.photoCaption}</figcaption>
          )}
        </figure>
      </div>
    </section>
  );
}
