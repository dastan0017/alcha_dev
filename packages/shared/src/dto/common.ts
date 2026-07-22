import { z } from 'zod';

export const localeSchema = z.enum(['ru', 'en']);

export const localeQuerySchema = z.object({
  locale: localeSchema.default('ru'),
});
export type LocaleQuery = z.infer<typeof localeQuerySchema>;

export const idParamSchema = z.object({ id: z.string().min(1) });
export const slugParamSchema = z.object({ slug: z.string().min(1) });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** A field that is authored per locale in the CRM. */
export const translatedSchema = <T extends z.ZodTypeAny>(inner: T) =>
  z.object({ ru: inner, en: inner });

export const okResponseSchema = z.object({ ok: z.literal(true) });
export type OkResponse = z.infer<typeof okResponseSchema>;
