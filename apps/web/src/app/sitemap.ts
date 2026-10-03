import type { MetadataRoute } from 'next';
import { LOCALES } from '@alcha/shared';
import { getProjects } from '@/lib/content';
import { absoluteUrl, localizedPath } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ['/'];
  const projects = await getProjects('ru'); // slugs are shared across locales
  const projectPaths = projects.map((p) => `/works/${p.slug}`);
  const paths = [...staticPaths, ...projectPaths];

  // Google wants every language version as its own <url>, each listing all the
  // alternates including itself (and x-default). `priority` / `changefreq` are
  // ignored by Google, so they are left out. `lastModified` is deliberately
  // omitted too: this route revalidates hourly, so `new Date()` would claim every
  // URL changed within the hour, forever — the textbook way to get lastmod
  // discounted. Restore it once the DTOs expose a real updatedAt.
  return paths.flatMap((path) => {
    const languages = {
      ru: absoluteUrl(localizedPath(path, 'ru')),
      en: absoluteUrl(localizedPath(path, 'en')),
      'x-default': absoluteUrl(localizedPath(path, 'ru')),
    };
    return LOCALES.map((locale) => ({
      url: absoluteUrl(localizedPath(path, locale)),
      alternates: { languages },
    }));
  });
}
