import { useQuery } from '@tanstack/react-query';
import { createPreviewToken } from './api';

const REFRESH_BEFORE_EXPIRY_MS = 5 * 60_000;
const MIN_REFRESH_MS = 30_000;
/** How soon a failed issue is tried again: without a token the editor has nothing to show. */
const RETRY_MS = 15_000;

/**
 * A preview token for the iframe URL, re-issued 5 minutes before it expires.
 *
 * The editor cannot open the preview without one, so a failed issue (an API restart mid-deploy,
 * a dropped connection) keeps retrying on its own instead of leaving «Не удалось загрузить
 * сайт.» on screen until someone presses «Повторить» — the tab is often left open unattended.
 * A token that was issued is never re-requested by a focus or a reconnect (`staleTime`), so the
 * preview is not reloaded behind the user's back.
 */
export function usePreviewToken() {
  return useQuery({
    queryKey: ['content-preview-token'],
    queryFn: createPreviewToken,
    staleTime: Infinity,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: ({ state }) =>
      state.data
        ? Math.max(
            Date.parse(state.data.expiresAt) - Date.now() - REFRESH_BEFORE_EXPIRY_MS,
            MIN_REFRESH_MS,
          )
        : RETRY_MS,
  });
}
