import { describe, it, expect, vi, afterEach } from 'vitest';
import { revealOrderContact, RevealContactError } from '../src/api/orders';

// Codex round 3, Finding 2: the daily cap (429 RATE_LIMITED_DAILY) and the
// per-minute cap (429 RATE_LIMITED) both surface as HTTP 429. RevealContactError
// must carry the response body's `code`/`retryAfterMs` so the UI can tell them
// apart — but the body may be absent or unparseable (e.g. a proxy error page),
// so parsing it must never throw a second error out of the error path.
describe('revealOrderContact — RevealContactError body parsing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('carries code and retryAfterMs from a well-formed RATE_LIMITED_DAILY body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ code: 'RATE_LIMITED_DAILY', retryAfterMs: 3_600_000 }),
      }),
    );
    await expect(revealOrderContact('ord_1', 'CUSTOMER')).rejects.toMatchObject(
      new RevealContactError(429, 'RATE_LIMITED_DAILY', 3_600_000),
    );
  });

  it('carries code and retryAfterMs from a well-formed RATE_LIMITED body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ code: 'RATE_LIMITED', retryAfterMs: 5_000 }),
      }),
    );
    const err = await revealOrderContact('ord_1', 'CUSTOMER').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RevealContactError);
    expect((err as RevealContactError).status).toBe(429);
    expect((err as RevealContactError).code).toBe('RATE_LIMITED');
    expect((err as RevealContactError).retryAfterMs).toBe(5_000);
  });

  it('falls back to undefined code/retryAfterMs when the body is unparseable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON');
        },
      }),
    );
    const err = await revealOrderContact('ord_1', 'CUSTOMER').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RevealContactError);
    expect((err as RevealContactError).status).toBe(429);
    expect((err as RevealContactError).code).toBeUndefined();
    expect((err as RevealContactError).retryAfterMs).toBeUndefined();
  });

  it('falls back to undefined code/retryAfterMs when the body is absent (204-shaped error)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => null,
      }),
    );
    const err = await revealOrderContact('ord_1', 'CUSTOMER').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RevealContactError);
    expect((err as RevealContactError).status).toBe(403);
    expect((err as RevealContactError).code).toBeUndefined();
    expect((err as RevealContactError).retryAfterMs).toBeUndefined();
  });
});
