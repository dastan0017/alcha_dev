import { isAxiosError } from 'axios';
import {
  contentPatchResponseSchema,
  contentPublishErrorSchema,
  contentPublishResponseSchema,
  contentTreeResponseSchema,
  previewTokenResponseSchema,
  type CmsIssue,
  type ContentPatch,
  type ContentPatchRequest,
  type ContentPatchResponse,
  type ContentPublishResponse,
  type ContentTreeResponse,
  type PreviewTokenResponse,
} from '@alcha/shared';
import { http } from '../api/client';

/** TanStack Query key of `GET /admin/content/tree` (docs/visual-editor.md §6). */
export const TREE_QUERY_KEY = ['content-tree'] as const;

export async function fetchTree(): Promise<ContentTreeResponse> {
  const { data } = await http.get<unknown>('/admin/content/tree');
  return contentTreeResponseSchema.parse(data);
}

/** Not replay-safe as a batch: never retry a failed call automatically. */
export async function patchDraft(patches: ContentPatch[]): Promise<ContentPatchResponse> {
  const body: ContentPatchRequest = { patches };
  const { data } = await http.patch<unknown>('/admin/content/draft', body);
  return contentPatchResponseSchema.parse(data);
}

/** Drops the draft; the response is the published tree. */
export async function resetDraft(): Promise<ContentTreeResponse> {
  const { data } = await http.delete<unknown>('/admin/content/draft');
  return contentTreeResponseSchema.parse(data);
}

/** Publish refused (422): the draft has blank required fields or bad slugs. */
export class PublishBlockedError extends Error {
  constructor(
    message: string,
    public readonly errors: CmsIssue[],
  ) {
    super(message);
    this.name = 'PublishBlockedError';
  }
}

export async function publishContent(): Promise<ContentPublishResponse> {
  try {
    const { data } = await http.post<unknown>('/admin/content/publish');
    return contentPublishResponseSchema.parse(data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 422) {
      const body = contentPublishErrorSchema.safeParse(error.response.data);
      if (body.success) throw new PublishBlockedError(body.data.message, body.data.errors);
    }
    throw error;
  }
}

export async function createPreviewToken(): Promise<PreviewTokenResponse> {
  const { data } = await http.post<unknown>('/admin/content/preview-token');
  return previewTokenResponseSchema.parse(data);
}
