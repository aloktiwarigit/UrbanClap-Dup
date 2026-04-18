import { describe, it, expect } from 'vitest';
import { HttpRequest } from '@azure/functions';
import { healthHandler } from '../src/functions/health.js';
import { HealthResponseSchema } from '../src/schemas/health.js';

describe('GET /v1/health', () => {
  it('returns 200 with Content-Type application/json; charset=utf-8', async () => {
    const req = new HttpRequest({
      url: 'http://localhost:7071/api/v1/health',
      method: 'GET',
    });
    const result = await healthHandler(req, {} as never);
    expect(result.status).toBe(200);
    expect(result.headers).toBeDefined();
    const contentType =
      (result.headers as Record<string, string>)['Content-Type'] ??
      (result.headers as Record<string, string>)['content-type'];
    expect(contentType).toMatch(/application\/json/);
    expect(contentType).toMatch(/charset=utf-8/);
  });

  it('returns a body that parses cleanly against HealthResponseSchema (.strict())', async () => {
    const req = new HttpRequest({
      url: 'http://localhost:7071/api/v1/health',
      method: 'GET',
    });
    const result = await healthHandler(req, {} as never);
    const parsed = HealthResponseSchema.parse(result.jsonBody);
    expect(parsed.status).toBe('ok');
    expect(parsed.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(parsed.commit).toBeTypeOf('string');
    expect(parsed.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('rejects extra keys via .strict() — regression guard', async () => {
    const req = new HttpRequest({
      url: 'http://localhost:7071/api/v1/health',
      method: 'GET',
    });
    const result = await healthHandler(req, {} as never);
    const withExtra = { ...(result.jsonBody as object), surprise: 'bad' };
    expect(() => HealthResponseSchema.parse(withExtra)).toThrow();
  });
});
