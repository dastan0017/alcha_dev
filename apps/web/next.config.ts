import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

// Load the monorepo root .env so a single .env drives every app in dev/build.
loadEnv({ path: resolve(process.cwd(), '../../.env') });

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@alcha/shared'],
  images: {
    formats: ['image/avif', 'image/webp'],
    // Next defaults this to HALF THE FREE DISK. On a 40 GB VPS shared with Postgres and
    // Docker, .next/cache/images grows into the tens of GB inside the container's
    // writable layer until Postgres hits ENOSPC — and it presents as a database failure.
    maximumDiskCacheSize: 512 * 1024 * 1024,
    // S3 keys embed a UUID and never change in place, so re-encoding hourly is waste.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      // MinIO + the local API, dev only — never reachable from the production container.
      ...(process.env.NODE_ENV === 'production'
        ? []
        : ([
            { protocol: 'http', hostname: 'localhost', port: '9000' },
            { protocol: 'http', hostname: 'localhost', port: '4000' },
          ] as const)),
      { protocol: 'https', hostname: '**.alcha.dev' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
    ],
  },
  // Add production 301s here as the site grows.
  async redirects() {
    return [];
  },
};

export default withNextIntl(nextConfig);
