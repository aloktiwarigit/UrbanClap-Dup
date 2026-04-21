import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './generated/schema';

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly method: string;
  readonly body: unknown;

  constructor(args: { status: number; url: string; method: string; body: unknown }) {
    super(`API ${args.method} ${args.url} → ${args.status}`);
    this.name = 'ApiError';
    this.status = args.status;
    this.url = args.url;
    this.method = args.method;
    this.body = args.body;
  }
}

export type HeadersProvider = () =>
  | Record<string, string>
  | Promise<Record<string, string>>;

export interface ApiClientOptions {
  baseUrl: string;
  headers?: HeadersProvider;
  disableRefresh?: boolean;
}

export function createApiClient(options: ApiClientOptions) {
  const client = createClient<paths>({ baseUrl: options.baseUrl });

  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      if (!options.headers) return request;
      const headers = await options.headers();
      for (const [k, v] of Object.entries(headers)) {
        request.headers.set(k, v);
      }
      return request;
    },
  };

  let isRefreshing = false;

  const errorMiddleware: Middleware = {
    async onResponse({ response, request }) {
      if (response.ok) return response;

      if (
        !options.disableRefresh &&
        response.status === 401 &&
        !isRefreshing &&
        !request.url.includes('/auth/refresh') &&
        !request.url.includes('/auth/login')
      ) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch('/api/v1/admin/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });
          if (refreshRes.ok) {
            const retried = await fetch(request.clone());
            if (retried.ok) return retried;
          }
        } catch {
          // Refresh failed — fall through to throw ApiError
        } finally {
          isRefreshing = false;
        }
      }

      let body: unknown = null;
      const contentType = response.headers.get('content-type') ?? '';
      const isJson = /\bjson\b/i.test(contentType);
      try {
        body = isJson ? await response.clone().json() : await response.clone().text();
      } catch {
        body = null;
      }
      throw new ApiError({
        status: response.status,
        url: request.url,
        method: request.method,
        body,
      });
    },
  };

  client.use(authMiddleware, errorMiddleware);
  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;
