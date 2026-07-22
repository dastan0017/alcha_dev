import { z } from 'zod';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export const presignRequestSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});
export type PresignRequest = z.infer<typeof presignRequestSchema>;

export const presignResponseSchema = z.object({
  uploadUrl: z.string(),
  publicUrl: z.string(),
  key: z.string(),
  method: z.enum(['PUT']),
  headers: z.record(z.string()).default({}),
});
export type PresignResponse = z.infer<typeof presignResponseSchema>;

export const mediaAssetSchema = z.object({
  id: z.string(),
  url: z.string(),
  key: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  createdAt: z.string(),
});
export type MediaAsset = z.infer<typeof mediaAssetSchema>;

/** Registers an asset in the media library after a successful presigned upload. */
export const mediaRegisterSchema = z.object({
  key: z.string().min(1),
  url: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  width: z.number().int().nullable().default(null),
  height: z.number().int().nullable().default(null),
});
export type MediaRegister = z.infer<typeof mediaRegisterSchema>;
