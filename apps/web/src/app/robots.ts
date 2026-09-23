import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // NOT the whole of /api/: og:image points at /api/og, and Facebook/Twitter honour
      // robots.txt — blanket-disallowing /api/ strips the image from every link preview.
      disallow: ['/api/preview', '/api/revalidate'],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
    host: env.siteUrl,
  };
}
