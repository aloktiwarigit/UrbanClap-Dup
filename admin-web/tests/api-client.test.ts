import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { createApiClient, ApiError } from '../src/api/client';

const baseUrl = 'http://localhost:7071/api';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const healthBody = {
  status: 'ok' as const,
  version: '0.1.0',
  commit: 'abcdef12',
  timestamp: '2026-04-18T12:00:00.000',
  uptimeSeconds: 1.5,
};

describe('createApiClient', () => {
  it('calls /v1/health and returns typed data on 2xx', async () => {
    server.use(http.get(`${baseUrl}/v1/health`, () => HttpResponse.json(healthBody)));
    const client = createApiClient({ baseUrl });
    const { data, error } = await client.GET('/v1/health');
    expect(error).toBeUndefined();
    expect(data).toEqual(healthBody);
  });

  it('invokes sync headers() on every request', async () => {
    const tokens: string[] = [];
    server.use(
      http.get(`${baseUrl}/v1/health`, ({ request }) => {
        tokens.push(request.headers.get('authorization') ?? '');
        return HttpResponse.json(healthBody);
      }),
    );
    let counter = 0;
    const client = createApiClient({
      baseUrl,
      headers: () => ({ Authorization: `Bearer t${++counter}` }),
    });
    await client.GET('/v1/health');
    await client.GET('/v1/health');
    expect(tokens).toEqual(['Bearer t1', 'Bearer t2']);
  });

  it('awaits async headers() before dispatch', async () => {
    let captured = '';
    server.use(
      http.get(`${baseUrl}/v1/health`, ({ request }) => {
        captured = request.headers.get('x-token') ?? '';
        return HttpResponse.json(healthBody);
      }),
    );
    const client = createApiClient({
      baseUrl,
      headers: async () => {
        await new Promise((r) => setTimeout(r, 5));
        return { 'x-token': 'async-value' };
      },
    });
    await client.GET('/v1/health');
    expect(captured).toBe('async-value');
  });

  it('throws ApiError with status/url/method/body on non-2xx', async () => {
    server.use(
      http.get(`${baseUrl}/v1/health`, () =>
        HttpResponse.json({ error: 'boom' }, { status: 503 }),
      ),
    );
    const client = createApiClient({ baseUrl });
    await expect(client.GET('/v1/health')).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      method: 'GET',
      url: `${baseUrl}/v1/health`,
      body: { error: 'boom' },
    });
    await expect(client.GET('/v1/health')).rejects.toBeInstanceOf(ApiError);
  });

  it('parses application/problem+json error bodies as JSON (RFC 7807)', async () => {
    server.use(
      http.get(`${baseUrl}/v1/health`, () =>
        HttpResponse.json(
          { type: 'https://example.com/errors/boom', title: 'Boom', status: 503 },
          { status: 503, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );
    const client = createApiClient({ baseUrl });
    await expect(client.GET('/v1/health')).rejects.toMatchObject({
      status: 503,
      body: { type: 'https://example.com/errors/boom', title: 'Boom', status: 503 },
    });
  });

  it('works without headers option (factory default)', async () => {
    const sawAuth = vi.fn();
    server.use(
      http.get(`${baseUrl}/v1/health`, ({ request }) => {
        sawAuth(request.headers.get('authorization'));
        return HttpResponse.json(healthBody);
      }),
    );
    const client = createApiClient({ baseUrl });
    const { data } = await client.GET('/v1/health');
    expect(sawAuth).toHaveBeenCalledWith(null);
    expect(data).toEqual(healthBody);
  });
});
