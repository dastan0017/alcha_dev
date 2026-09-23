import type { MediaAsset, PresignResponse } from '@alcha/shared';
import { http } from './client';
import { prepareImageForUpload } from '../lib/image';

export const MEDIA_QUERY_KEY = ['media'] as const;

export function listMedia(): Promise<MediaAsset[]> {
  return http.get<MediaAsset[]>('/media').then((r) => r.data);
}

export function deleteMedia(id: string): Promise<void> {
  return http.delete(`/media/${id}`).then(() => undefined);
}

export type UploadResult = { asset: MediaAsset; originalSize: number; converted: boolean };

/**
 * Converts to WebP in the browser, uploads straight to storage with a presigned
 * PUT, then registers the asset. Every field below describes the PREPARED file,
 * not the one the user picked — presigning with the original size or type would
 * mint a URL for a file we are not sending.
 */
export async function uploadMedia(file: File): Promise<UploadResult> {
  const prepared = await prepareImageForUpload(file);
  const upload = prepared.file;

  const presign = (
    await http.post<PresignResponse>('/media/presign', {
      filename: upload.name,
      contentType: upload.type,
      size: upload.size,
    })
  ).data;

  const put = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: presign.headers,
    body: upload,
  });
  if (!put.ok) {
    throw new Error(`Upload failed with HTTP ${put.status}`);
  }

  const asset = (
    await http.post<MediaAsset>('/media', {
      key: presign.key,
      url: presign.publicUrl,
      filename: upload.name,
      mimeType: upload.type,
      size: upload.size,
      width: prepared.width,
      height: prepared.height,
    })
  ).data;

  return { asset, originalSize: prepared.originalSize, converted: prepared.converted };
}
