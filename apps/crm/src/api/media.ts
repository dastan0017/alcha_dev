import type { MediaAsset, PresignResponse } from '@alcha/shared';
import { http } from './client';

export const MEDIA_QUERY_KEY = ['media'] as const;

export function listMedia(): Promise<MediaAsset[]> {
  return http.get<MediaAsset[]>('/media').then((r) => r.data);
}

export function deleteMedia(id: string): Promise<void> {
  return http.delete(`/media/${id}`).then(() => undefined);
}

/** Presigned upload straight to storage, then registers the asset in the library. */
export async function uploadMedia(file: File): Promise<MediaAsset> {
  const contentType = file.type || 'application/octet-stream';
  const presign = (
    await http.post<PresignResponse>('/media/presign', {
      filename: file.name,
      contentType,
      size: file.size,
    })
  ).data;
  const put = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: presign.headers,
    body: file,
  });
  if (!put.ok) {
    throw new Error(`Upload failed with HTTP ${put.status}`);
  }
  return (
    await http.post<MediaAsset>('/media', {
      key: presign.key,
      url: presign.publicUrl,
      filename: file.name,
      mimeType: contentType,
      size: file.size,
      width: null,
      height: null,
    })
  ).data;
}
