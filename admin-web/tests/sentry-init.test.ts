import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { initSpy } = vi.hoisted(() => ({ initSpy: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ init: initSpy }));

describe('Sentry server config', () => {
  beforeEach(() => {
    vi.resetModules();
    initSpy.mockReset();
    delete process.env.SENTRY_DSN;
  });

  afterEach(() => {
    delete process.env.SENTRY_DSN;
  });

  it('does not call Sentry.init when SENTRY_DSN is unset', async () => {
    await import('../src/sentry.server.config');
    expect(initSpy).not.toHaveBeenCalled();
  });

  it('calls Sentry.init once with tracesSampleRate 0.1 when SENTRY_DSN is set', async () => {
    process.env.SENTRY_DSN = 'https://abc@o0.ingest.sentry.io/1';
    await import('../src/sentry.server.config');
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(initSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://abc@o0.ingest.sentry.io/1',
        tracesSampleRate: 0.1,
      }),
    );
  });
});

describe('Sentry client config', () => {
  beforeEach(() => {
    vi.resetModules();
    initSpy.mockReset();
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  });

  it('does not call Sentry.init when NEXT_PUBLIC_SENTRY_DSN is unset', async () => {
    await import('../src/sentry.client.config');
    expect(initSpy).not.toHaveBeenCalled();
  });

  it('calls Sentry.init when NEXT_PUBLIC_SENTRY_DSN is set', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://xyz@o0.ingest.sentry.io/2';
    await import('../src/sentry.client.config');
    expect(initSpy).toHaveBeenCalledTimes(1);
  });
});
