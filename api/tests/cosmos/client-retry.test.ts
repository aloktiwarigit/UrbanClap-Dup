/**
 * E12-S03 — Sub-task A: Cosmos retry/backoff config
 *
 * Verifies that getCosmosClient() constructs a CosmosClient with the expected
 * retry options regardless of which credential path (endpoint+key vs
 * connectionString) is used.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Capture constructor arguments so we can inspect retryOptions
// ---------------------------------------------------------------------------
const capturedArgs: unknown[] = [];

vi.mock('@azure/cosmos', () => {
  const CosmosClient = vi.fn((...args: unknown[]) => {
    capturedArgs.push(args[0]);
    return {};
  });
  return { CosmosClient };
});

describe('getCosmosClient() retry config', () => {
  beforeEach(() => {
    capturedArgs.length = 0;
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sets maxRetryAttemptsOnThrottledRequests=9 via endpoint+key path', async () => {
    vi.stubEnv('COSMOS_CONNECTION_STRING', '');
    vi.stubEnv('COSMOS_ENDPOINT', 'https://test.documents.azure.com:443/');
    vi.stubEnv('COSMOS_KEY', 'dGVzdC1rZXk=');

    const { getCosmosClient } = await import('../../src/cosmos/client.js');
    getCosmosClient();

    expect(capturedArgs).toHaveLength(1);
    const opts = capturedArgs[0] as {
      connectionPolicy: { retryOptions: { maxRetryAttemptsOnThrottledRequests: number; maxWaitTimeInSeconds: number } };
    };
    expect(opts.connectionPolicy.retryOptions.maxRetryAttemptsOnThrottledRequests).toBe(9);
    expect(opts.connectionPolicy.retryOptions.maxWaitTimeInSeconds).toBe(30);
  });

  it('sets maxRetryAttemptsOnThrottledRequests=9 via connectionString path', async () => {
    // A valid Cosmos connection string format:
    // AccountEndpoint=https://...;AccountKey=<base64>=;
    vi.stubEnv(
      'COSMOS_CONNECTION_STRING',
      'AccountEndpoint=https://test.documents.azure.com:443/;AccountKey=dGVzdC1rZXk=;',
    );
    vi.stubEnv('COSMOS_ENDPOINT', '');
    vi.stubEnv('COSMOS_KEY', '');

    const { getCosmosClient } = await import('../../src/cosmos/client.js');
    getCosmosClient();

    expect(capturedArgs).toHaveLength(1);
    const opts = capturedArgs[0] as {
      endpoint: string;
      key: string;
      connectionPolicy: { retryOptions: { maxRetryAttemptsOnThrottledRequests: number; maxWaitTimeInSeconds: number } };
    };
    expect(opts.connectionPolicy.retryOptions.maxRetryAttemptsOnThrottledRequests).toBe(9);
    expect(opts.connectionPolicy.retryOptions.maxWaitTimeInSeconds).toBe(30);
    // Connection string should be parsed into endpoint + key
    expect(opts.endpoint).toBe('https://test.documents.azure.com:443/');
    expect(opts.key).toBe('dGVzdC1rZXk=');
  });

  it('includes userAgentSuffix with homeservices-api prefix', async () => {
    vi.stubEnv('COSMOS_CONNECTION_STRING', '');
    vi.stubEnv('COSMOS_ENDPOINT', 'https://test.documents.azure.com:443/');
    vi.stubEnv('COSMOS_KEY', 'dGVzdC1rZXk=');
    vi.stubEnv('GIT_SHA', 'abc1234');

    const { getCosmosClient } = await import('../../src/cosmos/client.js');
    getCosmosClient();

    const opts = capturedArgs[0] as { userAgentSuffix: string };
    expect(opts.userAgentSuffix).toBe('homeservices-api/abc1234');
  });

  it('falls back to "local" in userAgentSuffix when GIT_SHA is not set', async () => {
    vi.stubEnv('COSMOS_CONNECTION_STRING', '');
    vi.stubEnv('COSMOS_ENDPOINT', 'https://test.documents.azure.com:443/');
    vi.stubEnv('COSMOS_KEY', 'dGVzdC1rZXk=');
    vi.stubEnv('GIT_SHA', '');

    const { getCosmosClient } = await import('../../src/cosmos/client.js');
    getCosmosClient();

    const opts = capturedArgs[0] as { userAgentSuffix: string };
    expect(opts.userAgentSuffix).toBe('homeservices-api/local');
  });
});
