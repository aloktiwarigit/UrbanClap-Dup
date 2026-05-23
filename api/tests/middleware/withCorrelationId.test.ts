/**
 * TDD (E13-S04) — withCorrelationId middleware.
 *
 * - Absent x-correlation-id header → middleware generates a UUID v4 and
 *   writes it to the response header.
 * - Present x-correlation-id header → middleware echoes it unchanged.
 * - Response always has x-correlation-id set.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock @sentry/node to avoid importing the real SDK in unit tests.
vi.mock('@sentry/node', () => ({
  withScope: vi.fn((cb: (scope: { setTag: () => void }) => unknown) =>
    cb({ setTag: vi.fn() }),
  ),
}));

import { withCorrelationId } from '../../src/middleware/withCorrelationId.js';
import type { HttpHandler, HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';

// Minimal mock helpers ---------------------------------------------------

function makeRequest(headers: Record<string, string> = {}): HttpRequest {
  return {
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
    url: 'https://api.example.com/v1/bookings',
    method: 'POST',
    params: {},
    query: {},
    user: null,
    text: async () => '',
    json: async () => ({}),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    body: null,
    bodyUsed: false,
    clone: () => makeRequest(headers),
  } as unknown as HttpRequest;
}

function makeCtx(): InvocationContext {
  return {
    invocationId: 'inv-1',
    functionName: 'test',
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    extraInputs: { get: vi.fn() },
    extraOutputs: { set: vi.fn() },
    retryContext: undefined,
    traceContext: { traceparent: undefined, tracestate: undefined, attributes: {} },
    options: { trigger: { type: 'http' } },
  } as unknown as InvocationContext;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('withCorrelationId', () => {
  it('generates a UUID when x-correlation-id header is absent', async () => {
    const inner: HttpHandler = vi.fn(async () => ({ status: 200 }));
    const wrapped = withCorrelationId(inner);

    const req = makeRequest(); // no x-correlation-id
    const res = await wrapped(req, makeCtx()) as HttpResponseInit;

    const id = (res.headers as Record<string, string>)['x-correlation-id'] ?? '';
    expect(id).toBeTruthy();
    expect(UUID_RE.test(id)).toBe(true);
  });

  it('echoes the incoming x-correlation-id header unchanged', async () => {
    const incomingId = 'test-corr-id-abc123';
    const inner: HttpHandler = vi.fn(async () => ({ status: 200 }));
    const wrapped = withCorrelationId(inner);

    const req = makeRequest({ 'x-correlation-id': incomingId });
    const res = await wrapped(req, makeCtx()) as HttpResponseInit;

    const id = (res.headers as Record<string, string>)['x-correlation-id'];
    expect(id).toBe(incomingId);
  });

  it('response always contains x-correlation-id header', async () => {
    const inner: HttpHandler = vi.fn(async () => ({
      status: 201,
      jsonBody: { ok: true },
    }));
    const wrapped = withCorrelationId(inner);

    const res = await wrapped(makeRequest(), makeCtx()) as HttpResponseInit;
    expect((res.headers as Record<string, string>)['x-correlation-id']).toBeDefined();
  });

  it('passes the inner handler status and body through', async () => {
    const inner: HttpHandler = vi.fn(async () => ({
      status: 422,
      jsonBody: { code: 'VALIDATION_ERROR' },
    }));
    const wrapped = withCorrelationId(inner);

    const res = await wrapped(makeRequest(), makeCtx()) as HttpResponseInit;
    expect(res.status).toBe(422);
    expect((res as HttpResponseInit).jsonBody).toEqual({ code: 'VALIDATION_ERROR' });
  });
});
