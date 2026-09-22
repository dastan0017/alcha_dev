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
    lastModified: new Date(),
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
