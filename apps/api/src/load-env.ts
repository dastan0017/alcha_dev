import { config } from 'dotenv';
import { resolve } from 'node:path';

/**
 * Loaded as the very first import in main.ts. In development the app's own .env
 * must win over any stale variables inherited from the shell (e.g. a globally
 * exported DATABASE_URL). In production real env vars are injected and no root
 * .env exists, so this is a harmless no-op.
 */
if (process.env.NODE_ENV !== 'production') {
  config({ path: resolve(process.cwd(), '../../.env'), override: true });
}
