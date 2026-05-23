/**
 * Shared Cosmos DB error classification helpers.
 *
 * Used by change-feed projectors to decide whether to rethrow an error
 * (so the Azure Functions runtime retries the batch) or swallow it
 * (so the checkpoint advances past a poison-pill document).
 *
 * Retry policy rationale:
 *   - 429 (throttling) — the Cosmos SDK transparently retries up to
 *     maxRetryAttemptsOnThrottledRequests (default 9). If ALL SDK retries are
 *     exhausted the SDK surfaces the final 429 to the caller. We must treat it
 *     as retryable here so the Azure Functions runtime retries the batch and the
 *     change-feed checkpoint does NOT advance, preventing a permanent action drop.
 *   - 449 (CONCURRENCY_RETRY) — surfaces in some SDK versions for optimistic
 *     concurrency conflicts; treat as retryable.
 *   - 503 (service unavailable) — transient; rethrow so runtime retries.
 *   - 500 (internal server error) — transient; rethrow.
 *   - Other 4xx (bad request, conflict, not found) — data/validation issue;
 *     swallow to avoid infinite retry loops on poison-pill documents.
 */

/** Status codes that are retryable even though they fall in the 4xx range. */
const RETRYABLE_4XX = new Set([429, 449]);

export function isRetryableCosmosError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const code = (err as { code?: unknown; statusCode?: unknown }).code
    ?? (err as { code?: unknown; statusCode?: unknown }).statusCode;
  if (typeof code === 'number') {
    // 5xx errors are transient; always rethrow.
    if (code >= 500) return true;
    // 429 / 449 in the 4xx range are also retryable (see rationale above).
    return RETRYABLE_4XX.has(code);
  }
  // Fallback: if no numeric code, check message for known transient patterns.
  const msg = err instanceof Error ? err.message : '';
  return /service\s*unavailable|ECONNRESET|ETIMEDOUT/i.test(msg);
}
