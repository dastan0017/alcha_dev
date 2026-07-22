import { createApiClient } from '@alcha/shared';
import { env } from './env';

/** Server-side API client; each method tags fetches for on-demand ISR. */
export const api = createApiClient({ baseUrl: env.apiInternalUrl });
