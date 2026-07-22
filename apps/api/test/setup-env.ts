import { config } from 'dotenv';
import { resolve } from 'node:path';

// Load the monorepo root .env (overriding any stale shell vars) so e2e tests
// hit the right database and seeded admin credentials.
config({ path: resolve(process.cwd(), '../../.env'), override: true });
