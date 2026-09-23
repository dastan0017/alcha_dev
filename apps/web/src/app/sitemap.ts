import type { MetadataRoute } from 'next';
import { getProjects } from '@/lib/content';
import { env } from '@/lib/env';
import { localizedPath } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ['/'];
  const projects = await getProjects('ru'); // slugs are shared across locales
  const projectPaths = projects.map((p) => `/works/${p.slug}`);
  const paths = [...staticPaths, ...projectPaths];

  return paths.map((path) => ({
    url: `${env.siteUrl}${localizedPath(path, 'ru')}`,
    // Deliberately omitted. This route revalidates hourly, so `new Date()` claimed every
    // URL changed within the last hour, forever — the textbook way to get your lastmod
    // discounted entirely. Restore it once Project exposes a real updatedAt.
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.8,
    alternates: {
      languages: {
        ru: `${env.siteUrl}${localizedPath(path, 'ru')}`,
        en: `${env.siteUrl}${localizedPath(path, 'en')}`,
      },
    },
  }));
}
