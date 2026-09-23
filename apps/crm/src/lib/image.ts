import { ALLOWED_IMAGE_MIME_TYPES } from '@alcha/shared';

/**
 * Client-side image normalisation, run before the presigned upload.
 *
 * Conversion happens in the BROWSER on purpose. Uploads go straight from the
 * browser to S3 — the API only signs the URL and never sees the bytes — so doing
 * this server-side would mean routing every file through the API and spending
 * its CPU and memory on re-encoding. Here it costs the server nothing, and it
 * shrinks the upload itself rather than just what is stored.
 *
 * It also yields width/height for free, which the media library previously
 * recorded as null.
 */

/** Beyond this, detail is wasted: the public site re-encodes through next/image anyway. */
const MAX_DIMENSION = 2560;
/** Visually lossless for photographs at roughly a quarter of the bytes. */
const WEBP_QUALITY = 0.82;

/** A canvas re-encode keeps only the first frame, so animation would be lost. */
const NEVER_CONVERT = new Set<string>(['image/gif']);

export type PreparedUpload = {
  /** What to actually upload — the converted file, or the original untouched. */
  file: File;
  width: number | null;
  height: number | null;
  originalSize: number;
  converted: boolean;
};

export function isAllowedImage(file: File): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type);
}

function withWebpExtension(name: string): string {
  return `${name.replace(/\.[^./\\]+$/, '')}.webp`;
}

export async function prepareImageForUpload(file: File): Promise<PreparedUpload> {
  const asIs: PreparedUpload = {
    file,
    width: null,
    height: null,
    originalSize: file.size,
    converted: false,
  };

  if (!isAllowedImage(file) || NEVER_CONVERT.has(file.type)) return asIs;

  let bitmap: ImageBitmap;
  try {
    // from-image applies EXIF orientation, so photos straight off a phone are not
    // silently rotated by the re-encode (the tag is dropped along with the metadata).
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return asIs; // Undecodable here; upload the original rather than failing outright.
  }

  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const measured = { ...asIs, width: bitmap.width, height: bitmap.height };

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return measured;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY);
    });

    // toBlob falls back to PNG when the requested type is unsupported rather than
    // failing, so check what actually came back instead of trusting the request.
    if (!blob || blob.type !== 'image/webp') return measured;

    // Re-encoding an already-optimised file can make it bigger. If we did not also
    // downscale it, there is nothing to gain — keep the original.
    if (scale === 1 && blob.size >= file.size) return measured;

    return {
      file: new File([blob], withWebpExtension(file.name), { type: 'image/webp' }),
      width,
      height,
      originalSize: file.size,
      converted: true,
    };
  } finally {
    bitmap.close();
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
