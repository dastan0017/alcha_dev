import { z } from 'zod';
import { localeSchema } from './common';
import { seoPageSchema } from './enums';

export const seoMetaSchema = z.object({
  page: seoPageSchema,
  locale: localeSchema,
  title: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
  ogImageUrl: z.string().nullable(),
});
export type SeoMeta = z.infer<typeof seoMetaSchema>;

export const seoMetaUpsertSchema = z.object({
  page: seoPageSchema,
  locale: localeSchema,
  title: z.string().min(1).max(70),
  description: z.string().min(1).max(180),
  keywords: z.array(z.string()).default([]),
  ogImageUrl: z.string().nullable().default(null),
});
export type SeoMetaUpsert = z.infer<typeof seoMetaUpsertSchema>;
