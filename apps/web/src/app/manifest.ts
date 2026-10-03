import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/lib/env';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — создание сайтов, CRM и приложений`,
    short_name: SITE_NAME,
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#5b34c9',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Full-bleed square: survives the platform's own mask.
      { src: '/brand/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
