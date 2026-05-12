/**
 * Shared Cosmos DB error classification helpers.
 *
 * Used by change-feed projectors to decide whether to rethrow an error
 * (so the Azure Functions runtime retries the batch) or swallow it
 * (so the checkpoint advances past a poison-pill document).
 *
 * Retry policy rationale:
 *   - 429 (throttling) — already handled transparently by the Cosmos SDK
 *     (maxRetryAttemptsOnThrottledRequests=9 in client.ts). Does NOT reach here.
 *   - 503 (service unavailable) — transient; rethrow so runtime retries.
 *   - 500 (internal server error) — transient; rethrow.
 *   - 4xx (bad request, conflict, not found) — data/validation issue; swallow
 *     to avoid infinite retry loops on poison-pill documents.
 */

export function isRetryableCosmosError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const code = (err as { code?: unknown; statusCode?: unknown }).code
    ?? (err as { code?: unknown; statusCode?: unknown }).statusCode;
  if (typeof code === 'number') {
    // 5xx errors are transient; rethrow. 4xx are non-retryable; swallow.
    return code >= 500;
  }
  // Fallback: if no numeric code, check message for known transient patterns.
  const msg = err instanceof Error ? err.message : '';
  return /service\s*unavailable|ECONNRESET|ETIMEDOUT/i.test(msg);
}
