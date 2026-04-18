import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  isInitialized: vi.fn(() => false),
}));

import * as Sentry from '@sentry/node';
import { initSentry } from '../src/observability/sentry.js';

describe('initSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SENTRY_DSN;
  });

  it('does not call Sentry.init when SENTRY_DSN is unset', () => {
    initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('calls Sentry.init exactly once with DSN + tracesSampleRate when SENTRY_DSN is set', () => {
    process.env.SENTRY_DSN = 'https://public@sentry.example.io/1';
    initSentry();
    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://public@sentry.example.io/1',
        tracesSampleRate: 0.1,
      }),
    );
  });
});
