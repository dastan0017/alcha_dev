import { z } from 'zod';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * The only content types the media library accepts.
 *
 * Enforced on the SERVER, not just in the CRM, for two reasons. The presigned PUT
 * does not sign the Content-Type header (S3RequestPresigner marks it unsignable),
 * so whatever the browser sends is what S3 stores — and the bucket serves
 * `uploads/*` publicly. Without this list an authenticated user could store
 * `text/html` and get stored XSS on the media origin.
 *
 * SVG is deliberately absent: it can carry script, and it cannot be meaningfully
 * re-encoded to WebP. GIF is present but never converted — a canvas re-encode
 * keeps only the first frame and would silently destroy the animation.
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/**
 * The media LIBRARY is images-only, but Settings uploads a CV as PDF through the
 * same endpoint, so the server allow-list is the wider set. The images-only rule
 * is enforced in the Media page UI, which is where it was wanted.
 */
export const ALLOWED_UPLOAD_MIME_TYPES = [...ALLOWED_IMAGE_MIME_TYPES, 'application/pdf'] as const;
export type AllowedUploadMimeType = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];

export const presignRequestSchema = z.object({
  filename: z.string().min(1),
  contentType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
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
  // Same allow-list as the presign step: registering is a separate request, so
  // validating only the presign would leave the recorded type spoofable.
  mimeType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
  size: z.number().int().nonnegative(),
  width: z.number().int().nullable().default(null),
  height: z.number().int().nullable().default(null),
});
export type MediaRegister = z.infer<typeof mediaRegisterSchema>;
