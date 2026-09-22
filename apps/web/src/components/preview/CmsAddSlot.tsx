import type { CSSProperties } from 'react';
import { CMS_ATTR, MAX_PROCESS_STEPS, type CollectionKey } from '@alcha/shared';

interface SlotCopy {
  label: string;
  hint?: string;
  /** Stack lists and the row under the steps get a one-row slot; grids a card-sized column. */
  row?: boolean;
  minHeight: number;
}

const SLOTS: Record<CollectionKey, SlotCopy> = {
  steps: {
    label: 'Добавить шаг',
    hint: `— встанет последним, номера пересчитаются сами (не больше ${MAX_PROCESS_STEPS} шагов)`,
    row: true,
    minHeight: 72,
  },
  projects: {
    label: 'Добавить работу',
    hint: '— встанет в конец списка, порядок меняется стрелками',
    row: true,
    minHeight: 96,
  },
  pricing: { label: 'Добавить тариф', hint: 'Колонки выровняются автоматически', minHeight: 220 },
};

export const cmsAddLabel = (collection: CollectionKey) => SLOTS[collection].label;

const BUTTON: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  border: '2px dashed rgba(91,52,201,.4)',
  borderRadius: 14,
  background: 'rgba(91,52,201,.04)',
  color: '#5B34C9',
  font: 'inherit',
  textAlign: 'center',
  cursor: 'pointer',
};

/**
 * «+ Добавить …» ghost slot (docs/visual-editor.md D8): render it in preview as the
 * last child of a list container; `className` lets it take a grid cell or a stack row.
 * The preview bridge handles the click and the hover state.
 */
export function CmsAddSlot({
  collection,
  className,
  as: Root = 'div',
  style,
}: {
  collection: CollectionKey;
  className?: string;
  as?: 'div' | 'li';
  style?: CSSProperties;
}) {
  const { label, hint, row, minHeight } = SLOTS[collection];

  return (
    <Root
      {...{ [CMS_ATTR.previewUi]: '' }}
      className={className}
      style={{ display: 'flex', ...style }}
    >
      <button
        type="button"
        {...{ [CMS_ATTR.add]: collection }}
        style={{
          ...BUTTON,
          minHeight,
          flexDirection: row ? 'row' : 'column',
          flexWrap: row ? 'wrap' : 'nowrap',
          gap: row ? 10 : 8,
        }}
      >
        <span
          aria-hidden="true"
          style={{ fontSize: row ? 22 : 24, fontWeight: 600, lineHeight: 1 }}
        >
          +
        </span>
        <span style={{ fontSize: 14.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
        {hint && (
          <span style={{ fontSize: 12, color: '#7d6aa8', maxWidth: row ? undefined : 200 }}>
            {hint}
          </span>
        )}
      </button>
    </Root>
  );
}
