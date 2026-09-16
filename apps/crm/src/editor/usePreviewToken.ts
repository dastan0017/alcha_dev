import { useQuery } from '@tanstack/react-query';
import { createPreviewToken } from './api';

const REFRESH_BEFORE_EXPIRY_MS = 5 * 60_000;
const MIN_REFRESH_MS = 30_000;

/** A preview token for the iframe URL, re-issued 5 minutes before it expires. */
export function usePreviewToken() {
  return useQuery({
    queryKey: ['content-preview-token'],
    queryFn: createPreviewToken,
    staleTime: Infinity,
    refetchInterval: ({ state }) =>
      state.data
        ? Math.max(
            Date.parse(state.data.expiresAt) - Date.now() - REFRESH_BEFORE_EXPIRY_MS,
            MIN_REFRESH_MS,
          )
        : false,
  });
}
