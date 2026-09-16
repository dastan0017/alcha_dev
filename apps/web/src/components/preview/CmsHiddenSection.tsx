import type { CSSProperties } from 'react';
import {
  CMS_ATTR,
  CMS_SECTION_LABELS,
  type AboutSectionKey,
  type CollectionKey,
  type HomeSectionKey,
} from '@alcha/shared';
import { cmsAddLabel } from './CmsAddSlot';

const STRIP: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 14,
  padding: '18px 20px',
  border: '1px dashed rgba(23,18,31,.22)',
  borderRadius: 12,
  background: 'rgba(23,18,31,.03)',
};

const ACTION: CSSProperties = {
  marginLeft: 'auto',
  padding: '7px 12px',
  border: '1px solid rgba(91,52,201,.35)',
  borderRadius: 8,
  background: 'transparent',
  color: '#5B34C9',
  fontFamily: 'inherit',
  fontSize: 13.5,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};

type Props = { section: HomeSectionKey | AboutSectionKey } & (
  { variant: 'hidden' } | { variant: 'empty'; collection: CollectionKey }
);

/**
 * Preview-only strip rendered in place of a section visitors cannot see: hidden by
 * the owner («Показать») or empty («+ Добавить …»). Handled by the preview bridge.
 */
export function CmsHiddenSection(props: Props) {
  const label = CMS_SECTION_LABELS[props.section];

  return (
    <div
      className="container"
      {...{ [CMS_ATTR.previewUi]: '' }}
      style={{ paddingBlock: 'clamp(16px, 3vw, 32px)' }}
    >
      <div style={STRIP}>
        <span style={{ fontSize: 14, color: '#5f5768' }}>
          {`Секция «${label}» ${props.variant === 'hidden' ? 'скрыта' : 'пуста'} — посетители её не видят.`}
        </span>
        {props.variant === 'hidden' ? (
          <button type="button" {...{ [CMS_ATTR.hidden]: props.section }} style={ACTION}>
            Показать
          </button>
        ) : (
          <button type="button" {...{ [CMS_ATTR.add]: props.collection }} style={ACTION}>
            {`+ ${cmsAddLabel(props.collection)}`}
          </button>
        )}
      </div>
    </div>
  );
}
