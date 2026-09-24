import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import type { Project, ProjectPoint, ProjectShot } from '@alcha/shared';
import type { Cms } from '@/lib/cms';
import { ProofLine } from './ProofLine';
import styles from './case.module.css';

/** A screenshot slot with the caption stored at the same index, and its own position. */
interface Shot extends ProjectShot {
  caption: string;
  index: number;
}

interface CaseProps {
  project: Project;
  cms: Cms;
  /** `case` namespace: the page's own chrome — eyebrows, the flow and the sample data in it. */
  t: (key: string, values?: Record<string, string>) => string;
  /** `works` namespace fallback for an image with no caption. */
  screenshotAlt: string;
  stackLabel: string;
  stackLabelAttrs: Record<string, string>;
  /**
   * Editor mode. A picture nobody has uploaded yet shows as a labelled, clickable slot
   * rather than disappearing, so every picture the design asks for can be filled from the
   * page itself. Visitors never see a slot (docs/visual-editor.md D8).
   */
  preview: boolean;
}

/** Which parts of the page have data. The anchors list only the sections that render. */
export function caseSections(project: Project) {
  return {
    shots: pairShots(project),
    site: project.siteFeatures.length > 0,
    editing: project.editingPoints.length > 0 || project.editingTitle.trim() !== '',
    requests: project.requestsPoints.length > 0 || project.requestsTitle.trim() !== '',
  };
}

/**
 * The detailed case layout («Case alcha.dev» 1a). Every block reads its own field and
 * disappears when that field is empty, so a half-filled project never shows an empty
 * heading or a placeholder box.
 */
export function CaseHero({ project, cms, t }: CaseProps) {
  const { site, editing, requests } = caseSections(project);
  const anchors = [
    site && { href: '#case-site', num: '01', full: t('anchorSite'), short: t('anchorSiteShort') },
    editing && {
      href: '#case-editing',
      num: '02',
      full: t('anchorEditing'),
      short: t('anchorEditing'),
    },
    requests && {
      href: '#case-requests',
      num: '03',
      full: t('anchorRequests'),
      short: t('anchorRequests'),
    },
  ].filter((entry): entry is { href: string; num: string; full: string; short: string } =>
    Boolean(entry),
  );

  return (
    <>
      <header className={styles.heroHead}>
        <div className={styles.badgeRow}>
          <span
            className={styles.badgePill}
            {...cms.field(cms.itemLocale('projects', project.id, 'badge'))}
          >
            {project.badge}
          </span>
          {project.typeTag && (
            <span
              className={styles.badgeTag}
              {...cms.field(cms.itemLocale('projects', project.id, 'typeTag'))}
            >
              {project.typeTag}
            </span>
          )}
        </div>
        <h1
          className={styles.caseTitle}
          {...cms.field(cms.itemLocale('projects', project.id, 'title'))}
        >
          {project.title}
        </h1>
        <p
          className={styles.caseLead}
          {...cms.field(cms.itemLocale('projects', project.id, 'description'), { multiline: true })}
        >
          {project.description}
        </p>
      </header>

      {anchors.length > 0 && (
        <nav className={styles.anchors} aria-label={t('anchorsLabel')}>
          <span className={styles.anchorsLabel} aria-hidden="true">
            {t('anchorsLabel')}
          </span>
          {anchors.map((anchor) => (
            <a key={anchor.href} href={anchor.href} className={styles.anchor}>
              <span className={styles.anchorNum} aria-hidden="true">
                {anchor.num}
              </span>
              <span className={styles.anchorFull}>{anchor.full}</span>
              <span className={styles.anchorShort} aria-hidden="true">
                {anchor.short}
              </span>
            </a>
          ))}
        </nav>
      )}
    </>
  );
}

/** «01 · Что умеет сайт» — an open layout on the page background, plus the hero screenshot. */
export function CaseSite(props: CaseProps) {
  const { project, cms, t, preview } = props;
  const { site } = caseSections(project);
  const { hero, phone } = shotRoles(project);
  // The link preview falls back to the picture the page itself shares.
  const shareSrc = project.shareImage || project.coverImage || '';
  const asideShown = preview || Boolean(phone?.src) || Boolean(shareSrc);

  return (
    <>
      <Picture
        {...props}
        src={hero?.src ?? ''}
        path={cms.itemField('projects', project.id, 'screenshots', 0)}
        label={t('slotHero')}
        alt={hero?.caption}
        className={styles.heroShot}
        sizes="(max-width: 1288px) 100vw, 1240px"
        priority
      />

      {site && (
        <section id="case-site" className={`${styles.section} ${styles.siteGrid}`}>
          <div className={styles.siteCopy}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowNum}>01</span> · {t('siteEyebrow')}
            </span>
            <h2 className={styles.h2}>{t('siteTitle')}</h2>
            <p className={styles.lead}>{t('siteLead')}</p>
            <div
              className={styles.featureList}
              {...cms.field(cms.itemLocale('projects', project.id, 'siteFeatures'), { rich: true })}
            >
              {project.siteFeatures.map((feature, i) => (
                <div key={i} className={styles.feature}>
                  <span className={styles.featureTitle}>{feature.title}</span>
                  <span className={styles.featureText}>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {asideShown && (
            <div className={styles.siteAside}>
              {phone && (
                <figure className={`${styles.figure} ${styles.phoneFigure}`}>
                  <Picture
                    {...props}
                    src={phone.src}
                    path={cms.itemField('projects', project.id, 'screenshots', phone.index)}
                    label={t('slotPhone')}
                    alt={phone.caption}
                    className={styles.phoneFrame}
                    sizes="260px"
                  />
                  {phone.caption && (
                    <figcaption
                      className={styles.caption}
                      {...cms.field(
                        cms.itemLocale('projects', project.id, 'screenshotCaptions', phone.index),
                      )}
                    >
                      {phone.caption}
                    </figcaption>
                  )}
                </figure>
              )}

              {(preview || shareSrc) && (
                <div className={styles.share}>
                  <span className={styles.shareLabel}>{t('shareLabel')}</span>
                  <div className={styles.shareBubble}>
                    <Picture
                      {...props}
                      src={shareSrc}
                      path={cms.itemField('projects', project.id, 'shareImage')}
                      label={t('slotShare')}
                      alt={t('shareAlt')}
                      className={styles.shareImg}
                      sizes="290px"
                    />
                    <div className={styles.shareText}>
                      <span className={styles.shareTitle}>{t('shareTitle')}</span>
                      <span className={styles.shareSub}>{t('shareSub')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </>
  );
}

/** «02 · Админка: тексты и фото» — the lilac band. Rendered outside the page container. */
export function CaseEditing(props: CaseProps) {
  const { project, cms, t, preview } = props;
  const images = project.editingImages
    .map((src, index) => ({ src, caption: project.editingCaptions[index] ?? '', index }))
    .filter((image) => preview || image.src.trim() !== '');

  return (
    <section id="case-editing" className={`${styles.section} ${styles.band}`}>
      <div className="container">
        <div className={styles.bandHead}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowNum}>02</span> · {t('editingEyebrow')}
          </span>
          <h2
            className={styles.h2}
            {...cms.field(cms.itemLocale('projects', project.id, 'editingTitle'))}
          >
            {project.editingTitle}
          </h2>
          <p
            className={styles.lead}
            {...cms.field(cms.itemLocale('projects', project.id, 'editingLead'), {
              multiline: true,
            })}
          >
            {project.editingLead}
          </p>
        </div>

        <div className={styles.bandGrid}>
          <NumberedPoints
            points={project.editingPoints}
            attrs={cms.field(cms.itemLocale('projects', project.id, 'editingPoints'), {
              rich: true,
            })}
          />
          {images.length > 0 && (
            <div className={styles.bandShots}>
              {images.map((image, position) => (
                <figure key={image.index} className={styles.figure}>
                  <Picture
                    {...props}
                    src={image.src}
                    path={cms.itemField('projects', project.id, 'editingImages', image.index)}
                    label={t(position === 0 ? 'slotEditing1' : 'slotEditing2')}
                    alt={image.caption}
                    className={`${styles.bandFrame} ${position === 0 ? '' : styles.bandFrameFlat}`}
                    style={{ aspectRatio: position === 0 ? '16 / 10' : '16 / 9' }}
                    sizes="(max-width: 1023px) 100vw, 620px"
                  >
                    {/* Decorative: the draft bar the admin panel itself shows over the page. */}
                    {position === 0 && image.src && (
                      <span className={styles.draftBar} aria-hidden="true">
                        <span className={styles.draftLabel}>
                          {t('draftLabel')}
                          <span className={styles.draftCount}> · {t('draftCount')}</span>
                        </span>
                        <span className={styles.draftAction}>{t('draftAction')}</span>
                      </span>
                    )}
                  </Picture>
                  {image.caption && (
                    <figcaption
                      className={styles.caption}
                      {...cms.field(
                        cms.itemLocale('projects', project.id, 'editingCaptions', image.index),
                      )}
                    >
                      {image.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** «03 · Админка: заявки» — a white bordered card, picture on the left. */
export function CaseRequests(props: CaseProps) {
  const { project, cms, t, preview } = props;
  const statuses = project.requestsStatuses;
  const imageShown = preview || Boolean(project.requestsImage);

  return (
    <section id="case-requests" className={`${styles.section} ${styles.requests}`}>
      <div className={`${styles.requestsCard} ${imageShown ? '' : styles.requestsCardAlone}`}>
        {imageShown && (
          <figure className={styles.figure}>
            <Picture
              {...props}
              src={project.requestsImage ?? ''}
              path={cms.itemField('projects', project.id, 'requestsImage')}
              label={t('slotRequests')}
              alt={project.requestsCaption}
              className={styles.requestsShot}
              sizes="(max-width: 1023px) 100vw, 560px"
            />
            {project.requestsCaption && (
              <figcaption
                className={styles.caption}
                {...cms.field(cms.itemLocale('projects', project.id, 'requestsCaption'))}
              >
                {project.requestsCaption}
              </figcaption>
            )}
          </figure>
        )}

        <div className={styles.requestsCopy}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowNum}>03</span> · {t('requestsEyebrow')}
          </span>
          <h2
            className={styles.h2}
            {...cms.field(cms.itemLocale('projects', project.id, 'requestsTitle'))}
          >
            {project.requestsTitle}
          </h2>
          <p
            className={styles.lead}
            {...cms.field(cms.itemLocale('projects', project.id, 'requestsLead'), {
              multiline: true,
            })}
          >
            {project.requestsLead}
          </p>

          {statuses.length > 0 && (
            <ol className={styles.statuses} aria-label={t('statusesLabel')}>
              {statuses.map((status, i) => (
                <li key={i} className={styles.status}>
                  <span
                    className={`${styles.statusChip} ${i === 0 ? styles.statusFirst : ''} ${
                      i === statuses.length - 1 ? styles.statusLast : ''
                    }`}
                    {...cms.field(cms.itemLocale('projects', project.id, 'requestsStatuses', i))}
                  >
                    {status}
                  </span>
                  {i < statuses.length - 1 && (
                    <span className={styles.statusArrow} aria-hidden="true">
                      →
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}

          <div
            className={styles.requestsPoints}
            {...cms.field(cms.itemLocale('projects', project.id, 'requestsPoints'), { rich: true })}
          >
            {project.requestsPoints.map((point, i) => (
              <div key={i}>
                <div className={styles.pointTitle}>{point.title}</div>
                <div className={styles.pointText}>{point.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * «Как приходит заявка» — the three-step flow. Sample data, not project fields: it is a
 * picture of the mechanism, the same on every case that shows it.
 */
export function CaseFlow({ project, t }: CaseProps) {
  const site = project.typeTag || project.title;

  return (
    <section className={styles.flow}>
      <span className={styles.eyebrow}>{t('flowEyebrow')}</span>
      <h2 className={styles.h2}>{t('flowTitle')}</h2>

      <div className={styles.flowSteps}>
        <div className={styles.flowCard}>
          <span className={styles.flowLabel}>{t('flowStep1')}</span>
          <span className={styles.flowInput}>{t('flowName')}</span>
          <span className={styles.flowInput}>{t('flowMessage')}</span>
          <span className={styles.flowSubmit}>{t('flowSubmit')}</span>
        </div>
        <span className={styles.flowArrow} aria-hidden="true">
          <span className={styles.arrowWide}>→</span>
          <span className={styles.arrowNarrow}>↓</span>
        </span>
        <div className={styles.flowCard}>
          <span className={styles.flowLabel}>{t('flowStep2')}</span>
          <div className={styles.tgBubble}>
            <div className={styles.tgTitle}>{t('flowTgTitle', { site })}</div>
            <div className={styles.tgBody}>
              {t('flowName')}
              <br />
              {t('flowTgQuote')}
            </div>
            <div className={styles.tgTime}>{t('flowTgTime')}</div>
          </div>
        </div>
        <span className={styles.flowArrow} aria-hidden="true">
          <span className={styles.arrowWide}>→</span>
          <span className={styles.arrowNarrow}>↓</span>
        </span>
        <div className={styles.flowCard}>
          <span className={styles.flowLabel}>{t('flowStep3')}</span>
          <div className={`${styles.leadRow} ${styles.leadRowFirst}`}>
            <span>
              <b>{t('flowLead1Name')}</b> · {t('flowLead1Text')}
            </span>
            <span className={`${styles.leadChip} ${styles.leadChipNew}`}>
              {t('flowLead1Status')}
            </span>
          </div>
          <div className={`${styles.leadRow} ${styles.leadRowRest}`}>
            <span>{t('flowLead2')}</span>
            <span className={styles.leadChip}>{t('flowLead2Status')}</span>
          </div>
        </div>
      </div>

      {project.proofLine && <ProofLine text={project.proofLine} />}
    </section>
  );
}

/** «Экраны» — every screenshot slot the hero and the phone shot in section 01 did not take. */
export function CaseGallery(props: CaseProps) {
  const { project, cms, t, preview } = props;
  const { gallery } = shotRoles(project);
  const shown = gallery.filter((shot) => preview || shot.src.trim() !== '');
  if (shown.length === 0) return null;

  return (
    <section className={styles.gallery}>
      <div className={styles.galleryHead}>
        <span className={styles.eyebrow}>{t('screensEyebrow')}</span>
      </div>
      <div className={styles.galleryGrid}>
        {shown.map((shot) => (
          <figure key={shot.index} className={styles.galleryItem}>
            <Picture
              {...props}
              src={shot.src}
              path={cms.itemField('projects', project.id, 'screenshots', shot.index)}
              label={shot.caption || t('slotGallery')}
              alt={shot.caption}
              className={`${styles.galleryFrame} ${
                shot.device === 'mobile' ? styles.galleryMobile : styles.galleryDesktop
              }`}
              sizes="(max-width: 767px) 50vw, (max-width: 1288px) 33vw, 400px"
            />
            {shot.caption && (
              <figcaption
                className={styles.caption}
                {...cms.field(
                  cms.itemLocale('projects', project.id, 'screenshotCaptions', shot.index),
                )}
              >
                {shot.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

/** «Сервер и надёжность» plus the stack line — the quiet close before the CTA. */
export function CaseReliability({ project, cms, t, stackLabel, stackLabelAttrs }: CaseProps) {
  if (project.reliability.length === 0 && project.techChips.length === 0) return null;

  return (
    <section className={styles.reliability}>
      {project.reliability.length > 0 && (
        <>
          <div className={styles.reliabilityHead}>
            <span className={styles.eyebrow}>{t('reliabilityEyebrow')}</span>
          </div>
          <div
            className={styles.reliabilityGrid}
            {...cms.field(cms.itemLocale('projects', project.id, 'reliability'), { rich: true })}
          >
            {project.reliability.map((item, i) => (
              <div key={i}>
                <b className={styles.reliabilityTitle}>{item.title}</b>
                {item.text}
              </div>
            ))}
          </div>
        </>
      )}

      {project.techChips.length > 0 && (
        <div className={styles.stack}>
          <span className={styles.stackLabel} {...stackLabelAttrs}>
            {stackLabel}
          </span>
          <ul className={styles.stackChips}>
            {project.techChips.map((chip, i) => (
              <li key={i} {...cms.field(cms.itemLocale('projects', project.id, 'techChips', i))}>
                {chip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// ─── Internals ───────────────────────────────────────────────────────────────

interface PictureProps extends CaseProps {
  src: string;
  /** CMS path of the picture: where «Заменить фото» writes the URL the editor picks. */
  path: string;
  /** What to capture for this slot; shown while it is empty. */
  label: string;
  alt?: string;
  className?: string;
  sizes: string;
  style?: CSSProperties;
  priority?: boolean;
  children?: ReactNode;
}

/**
 * One picture of the case page. Filled, it is the picture; empty, it is a labelled slot the
 * editor clicks to upload into; and for a visitor it is nothing at all, so the published
 * page never shows an empty box.
 */
function Picture({
  src,
  path,
  label,
  alt,
  className = '',
  sizes,
  style,
  priority,
  children,
  cms,
  preview,
  screenshotAlt,
}: PictureProps): ReactNode {
  if (!src && !preview) return null;
  return (
    <div className={`${styles.frame} ${className}`} style={style} {...cms.image(path)}>
      {src ? (
        <Image
          src={src}
          alt={alt || screenshotAlt}
          fill
          sizes={sizes}
          className={styles.frameImg}
          priority={priority}
        />
      ) : (
        <span className={styles.slot}>{label}</span>
      )}
      {children}
    </div>
  );
}

/** Points numbered 01…05 down the band's left column. */
function NumberedPoints({
  points,
  attrs,
}: {
  points: readonly ProjectPoint[];
  attrs: Record<string, string>;
}): ReactNode {
  if (points.length === 0) return null;
  return (
    <div className={styles.points} {...attrs}>
      {points.map((point, i) => (
        <div key={i} className={styles.point}>
          <span className={styles.pointNum} aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div>
            <div className={styles.pointTitle}>{point.title}</div>
            <div className={styles.pointText}>{point.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Every screenshot slot with its caption and its own index, the empty ones included. */
function pairShots(project: Project): Shot[] {
  return project.screenshots.map((shot, index) => ({
    ...shot,
    caption: project.screenshotCaptions[index] ?? '',
    index,
  }));
}

/**
 * What each screenshot slot is for: `[0]` is the wide shot under the hero, the first phone
 * shot after it stands beside «Что умеет сайт», and the rest fill «Экраны». A slot's role
 * comes from its position, not from which slots happen to be filled, so the pictures can be
 * uploaded in any order and each still lands where the design puts it.
 */
function shotRoles(project: Project) {
  const shots = pairShots(project);
  const phoneIndex = shots.findIndex((shot, i) => i > 0 && shot.device === 'mobile');
  return {
    hero: shots[0],
    phone: phoneIndex > 0 ? shots[phoneIndex] : undefined,
    gallery: shots.filter((_, i) => i !== 0 && i !== phoneIndex),
  };
}
