'use client';

import type { CmsAttrs } from '@/lib/cms';
import { useContact } from './ContactContext';

export function ContactButton({
  label,
  className = 'btn btn--primary',
  labelAttrs,
}: {
  label: string;
  className?: string;
  /** Visual-editor annotation of the label (preview only); non-empty attrs wrap it in a span. */
  labelAttrs?: CmsAttrs;
}) {
  const { open } = useContact();
  return (
    <button type="button" className={className} onClick={open}>
      {labelAttrs && Object.keys(labelAttrs).length > 0 ? (
        <span {...labelAttrs}>{label}</span>
      ) : (
        label
      )}
    </button>
  );
}
