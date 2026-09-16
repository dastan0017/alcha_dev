import { cookies, draftMode } from 'next/headers';

/** httpOnly cookie holding the preview token the draft reads authenticate with. */
export const PREVIEW_COOKIE = 'alcha_preview';

export interface PreviewState {
  enabled: boolean;
  token: string | null;
}

const DISABLED: PreviewState = { enabled: false, token: null };

/** Leaves draft mode and drops the token cookie (route handlers only). */
export async function clearPreview(): Promise<void> {
  (await draftMode()).disable();
  (await cookies()).delete(PREVIEW_COOKIE);
}

/**
 * Draft-mode state of the current request (docs/visual-editor.md D2). Cookies are
 * read only once draft mode is on, so public renders stay static; contexts without
 * a request (build, generateStaticParams) report disabled.
 */
export async function getPreview(): Promise<PreviewState> {
  try {
    if (!(await draftMode()).isEnabled) return DISABLED;
    return { enabled: true, token: (await cookies()).get(PREVIEW_COOKIE)?.value ?? null };
  } catch {
    return DISABLED;
  }
}
