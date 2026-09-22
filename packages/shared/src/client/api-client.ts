import type { z } from 'zod';
import type { Locale } from '../constants/locales';
import { CacheTags, CONTENT_REVALIDATE_SECONDS } from '../constants/cache-tags';
import { homeResponseSchema, type HomeResponse } from '../dto/content';
import { siteSettingsSchema, type SiteSettings } from '../dto/settings';
import { siteChromeSchema, type SiteChrome } from '../dto/chrome';
import { draftVerifyResponseSchema, type DraftVerifyResponse } from '../dto/content-draft';
import { projectSchema, type Project } from '../dto/project';
import { createLeadSchema, type CreateLead } from '../dto/lead';
import { okResponseSchema, type OkResponse } from '../dto/common';
import { z as zod } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Next.js-flavoured fetch options (ignored by a plain fetch runtime). */
export interface NextFetchOptions {
  tags?: string[];
  revalidate?: number | false;
}

/**
 * A fetch init that is portable across the DOM and Node (undici) `RequestInit`
 * types: it explicitly adds `next` (Next.js ISR) and `cache`, which the Node
 * lib does not declare.
 */
export type FetchInit = RequestInit & {
  next?: NextFetchOptions;
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
};

export interface RequestOptions {
  /** Passed through to Next.js `fetch(..., { next })` for ISR tagging. */
  next?: NextFetchOptions;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export interface ApiClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  /** Applied to every request (e.g. a default `cache` strategy). */
  defaultInit?: RequestInit;
}

export function createApiClient(options: ApiClientOptions) {
  const base = options.baseUrl.replace(/\/+$/, '');
  const doFetch = options.fetchImpl ?? globalThis.fetch;

  async function request<T>(
    path: string,
    schema: z.ZodType<T, z.ZodTypeDef, unknown>,
    init: FetchInit | undefined,
  ): Promise<T> {
    const res = await doFetch(`${base}${path}`, {
      ...options.defaultInit,
      ...init,
      headers: {
        Accept: 'application/json',
        ...options.defaultInit?.headers,
        ...init?.headers,
      },
    });

    if (!res.ok) {
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = await res.text().catch(() => undefined);
      }
      const message =
        typeof body === 'object' && body !== null && 'message' in body
          ? String((body as { message: unknown }).message)
          : `Request to ${path} failed with ${res.status}`;
      throw new ApiError(res.status, message, body);
    }

    const json = await res.json();
    return schema.parse(json);
  }

  function withTags(opts: RequestOptions | undefined, tags: string[]): FetchInit {
    return {
      method: 'GET',
      signal: opts?.signal,
      headers: opts?.headers,
      next: {
        tags,
        revalidate: opts?.next?.revalidate ?? CONTENT_REVALIDATE_SECONDS,
        ...opts?.next,
      },
    };
  }

  /** Draft reads bypass every cache and authenticate with the preview token. */
  function draftInit(token: string): FetchInit {
    return { method: 'GET', cache: 'no-store', headers: { Authorization: `Bearer ${token}` } };
  }

  return {
    getHome(locale: Locale, opts?: RequestOptions): Promise<HomeResponse> {
      return request(`/content/home?locale=${locale}`, homeResponseSchema, withTags(opts, [CacheTags.home]));
    },

    getSettings(locale: Locale, opts?: RequestOptions): Promise<SiteSettings> {
      return request(`/content/settings?locale=${locale}`, siteSettingsSchema, withTags(opts, [CacheTags.settings]));
    },

    getChrome(locale: Locale, opts?: RequestOptions): Promise<SiteChrome> {
      return request(`/content/chrome?locale=${locale}`, siteChromeSchema, withTags(opts, [CacheTags.chrome]));
    },

    getProjects(locale: Locale, opts?: RequestOptions): Promise<Project[]> {
      return request(
        `/projects?locale=${locale}`,
        zod.array(projectSchema),
        withTags(opts, [CacheTags.projects]),
      );
    },

    getProject(slug: string, locale: Locale, opts?: RequestOptions): Promise<Project> {
      return request(
        `/projects/${encodeURIComponent(slug)}?locale=${locale}`,
        projectSchema,
        withTags(opts, [CacheTags.projects, CacheTags.project(slug)]),
      );
    },

    getDraftHome(locale: Locale, token: string): Promise<HomeResponse> {
      return request(`/content/draft/home?locale=${locale}`, homeResponseSchema, draftInit(token));
    },

    getDraftChrome(locale: Locale, token: string): Promise<SiteChrome> {
      return request(`/content/draft/chrome?locale=${locale}`, siteChromeSchema, draftInit(token));
    },

    getDraftProject(slug: string, locale: Locale, token: string): Promise<Project> {
      return request(
        `/content/draft/projects/${encodeURIComponent(slug)}?locale=${locale}`,
        projectSchema,
        draftInit(token),
      );
    },

    verifyPreviewToken(token: string): Promise<DraftVerifyResponse> {
      return request(`/content/draft/verify`, draftVerifyResponseSchema, draftInit(token));
    },

    createLead(payload: CreateLead, opts?: RequestOptions): Promise<OkResponse> {
      const body = createLeadSchema.parse(payload);
      return request(`/leads`, okResponseSchema, {
        method: 'POST',
        cache: 'no-store',
        signal: opts?.signal,
        headers: { 'Content-Type': 'application/json', ...opts?.headers },
        body: JSON.stringify(body),
      });
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
