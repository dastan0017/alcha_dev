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
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'http', hostname: 'localhost', port: '4000' },
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
