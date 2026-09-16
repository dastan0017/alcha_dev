'use client';

import { useEffect, useSyncExternalStore, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { CMS_ATTR } from '@alcha/shared';

const PILL: CSSProperties = {
  position: 'fixed',
  left: 16,
  bottom: 16,
  zIndex: 1000,
  padding: '8px 14px',
  borderRadius: 999,
  background: '#17121F',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
  boxShadow: '0 6px 18px rgba(23,18,31,.25)',
};

const subscribeNever = () => () => {};

/**
 * Talks to the CRM editor around the preview iframe (docs/visual-editor.md §5); the
 * locale layout mounts it in draft mode only. The runtime is a lazy chunk, so it is
 * fetched by previews alone. Opened outside the CRM it only offers a way out.
 */
export function PreviewBridge({ parentOrigin }: { parentOrigin: string }) {
  const router = useRouter();
  const standalone = useSyncExternalStore(
    subscribeNever,
    () => window.parent === window,
    () => false,
  );

  useEffect(() => {
    if (window.parent === window) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    void import('./bridge-runtime').then(({ startPreviewBridge }) => {
      if (!cancelled) stop = startPreviewBridge({ parentOrigin, refresh: () => router.refresh() });
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [parentOrigin, router]);

  if (!standalone) return null;
  return (
    // A route handler, not a page: it needs a full navigation, never a client-side one.
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href="/api/preview/exit" {...{ [CMS_ATTR.previewUi]: '' }} style={PILL}>
      Черновик · выйти из предпросмотра
    </a>
  );
}
