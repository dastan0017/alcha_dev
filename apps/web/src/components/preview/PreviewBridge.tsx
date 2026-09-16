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
 * Ghost slots and hidden-section strips stay hidden until the bridge runtime marks
 * <html> with a mode, so a draft-mode cookie left over from the CRM never shows them
 * on the site in a normal tab. Server-rendered, so they never flash in.
 */
const EDITOR_UI_GATE = `html:not([${CMS_ATTR.mode}]) [${CMS_ATTR.previewUi}] { display: none !important; }`;

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

  return (
    <>
      <style>{EDITOR_UI_GATE}</style>
      {standalone && (
        // A route handler, not a page: it needs a full navigation, never a client-side one.
        // No preview-ui attribute: the gate would hide it, and the bridge never runs here.
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a href="/api/preview/exit" style={PILL}>
          Черновик · выйти из предпросмотра
        </a>
      )}
    </>
  );
}
