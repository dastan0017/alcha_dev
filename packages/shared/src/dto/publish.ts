import { z } from 'zod';

/** What the CRM asks the API to publish (which triggers web revalidation). */
export const publishTargetSchema = z.enum(['home', 'settings', 'projects', 'all']);
export type PublishTarget = z.infer<typeof publishTargetSchema>;

export const publishRequestSchema = z.object({
  target: publishTargetSchema,
  /** When publishing a single project, also revalidate its case page. */
  slug: z.string().optional(),
});
export type PublishRequest = z.infer<typeof publishRequestSchema>;

export const publishResponseSchema = z.object({
  ok: z.boolean(),
  tags: z.array(z.string()),
  revalidated: z.boolean(),
});
export type PublishResponse = z.infer<typeof publishResponseSchema>;

/** Body accepted by the web app's POST /api/revalidate endpoint. */
export const revalidateRequestSchema = z.object({
  tags: z.array(z.string()).min(1),
});
export type RevalidateRequest = z.infer<typeof revalidateRequestSchema>;

export const revalidateResponseSchema = z.object({
  revalidated: z.boolean(),
  tags: z.array(z.string()),
  now: z.number(),
});
export type RevalidateResponse = z.infer<typeof revalidateResponseSchema>;
