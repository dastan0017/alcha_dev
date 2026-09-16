import { z } from 'zod';
import { localeSchema } from './common';
import { siteTreeSchema } from '../cms/tree';

/** A publish-validation finding; `locale` is null for neutral fields. */
export const cmsIssueSchema = z.object({
  path: z.string(),
  locale: localeSchema.nullable(),
  message: z.string(),
});
export type CmsIssue = z.infer<typeof cmsIssueSchema>;

/** GET /admin/content/tree, DELETE /admin/content/draft. */
export const contentTreeResponseSchema = z.object({
  tree: siteTreeSchema,
  /** Leaf-level diff between the published base and the draft. */
  changes: z.number().int(),
  hasDraft: z.boolean(),
  updatedAt: z.string().nullable(),
  issues: z.object({
    errors: z.array(cmsIssueSchema),
    warnings: z.array(cmsIssueSchema),
  }),
});
export type ContentTreeResponse = z.infer<typeof contentTreeResponseSchema>;

/** PATCH /admin/content/draft. */
export const contentPatchResponseSchema = contentTreeResponseSchema.extend({
  applied: z.number().int(),
  skipped: z.number().int(),
});
export type ContentPatchResponse = z.infer<typeof contentPatchResponseSchema>;

/** POST /admin/content/publish (blank EN required fields come back as warnings). */
export const contentPublishResponseSchema = z.object({
  ok: z.literal(true),
  tags: z.array(z.string()),
  revalidated: z.boolean(),
  warnings: z.array(cmsIssueSchema),
});
export type ContentPublishResponse = z.infer<typeof contentPublishResponseSchema>;

/** 422 body of POST /admin/content/publish when the draft has blocking errors. */
export const contentPublishErrorSchema = z.object({
  message: z.string(),
  errors: z.array(cmsIssueSchema),
});

/** POST /admin/content/preview-token. */
export const previewTokenResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
});
export type PreviewTokenResponse = z.infer<typeof previewTokenResponseSchema>;

/** GET /content/draft/verify. */
export const draftVerifyResponseSchema = z.object({ expiresAt: z.string() });
export type DraftVerifyResponse = z.infer<typeof draftVerifyResponseSchema>;
