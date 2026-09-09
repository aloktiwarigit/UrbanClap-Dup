import * as Sentry from '@sentry/node';
import { getCosmosClient, DB_NAME } from './client.js';

export interface RateLimitDoc {
  id: string;
  tokens: number;
  lastRefillAtMs: number;
}

export interface ConsumeResult {
  allowed: boolean;
  retryAfterMs?: number;
}

function getContainer() {
  return getCosmosClient().database(DB_NAME).container('rate_limit_tokens');
}

/**
 * Sliding-window token-bucket consume backed by Cosmos DB.
 *
 * Algorithm:
 *  1. Read the bucket doc (or treat as full on 404).
 *     - On 404, create a fresh bucket doc and consume one token immediately.
 *       - 409 Conflict on that create (another request for the same new key
 *         won the race) → re-read and retry the consume path against the doc
 *         the other request created; retried once, bounded.
 *  2. Refill tokens proportional to elapsed time since last refill.
 *  3. If tokens >= 1: subtract 1, write back (ETag-conditional).
 *     - 412 Precondition Failed → retry once.
 *  4. If tokens < 1: return allowed=false with retryAfterMs.
 *  5. Any unexpected Cosmos error → fail-open (allow=true) + Sentry warn.
 */
export async function consume(
  key: string,
  capacity: number,
  refillPerSec: number,
): Promise<ConsumeResult> {
  try {
    return await attemptConsume(key, capacity, refillPerSec, false, false);
  } catch (err: unknown) {
    // Fail-open: rate limiting is best-effort; don't 503 real traffic
    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      Sentry.captureException(err);
    });
    return { allowed: true };
  }
}

/**
 * Same token-bucket algorithm as consume(), but fails CLOSED: a Cosmos error,
 * and retry-exhaustion after a second consecutive 412 ETag collision, are
 * thrown to the caller instead of silently granting the request. `consume()`
 * is correct for best-effort callers (e.g. per-IP throttles on public
 * endpoints); it is wrong for the PII contact-reveal endpoint, where an
 * invisible "rate limiting silently disabled under Cosmos throttling"
 * fallback is worse than a visible failure. The caller is responsible for
 * catching the rejection, reporting it (Sentry), and returning an explicit
 * error response — this function does not report to Sentry itself.
 */
export async function consumeStrict(
  key: string,
  capacity: number,
  refillPerSec: number,
): Promise<ConsumeResult> {
  return attemptConsume(key, capacity, refillPerSec, false, true);
}

async function attemptConsume(
  key: string,
  capacity: number,
  refillPerSec: number,
  isRetry: boolean,
  failClosed: boolean,
  isCreateRetry = false,
): Promise<ConsumeResult> {
  const container = getContainer();
  const now = Date.now();

  let doc: RateLimitDoc;
  let etag: string | undefined;

  try {
    const { resource, etag: e } = await container.item(key, key).read<RateLimitDoc>();
    if (!resource) {
      // Doc existed but was empty — treat as fresh bucket
      doc = { id: key, tokens: capacity, lastRefillAtMs: now };
    } else {
      doc = resource;
      etag = e;
    }
  } catch (err: unknown) {
    if (isCosmosNotFound(err)) {
      // No doc yet — create a full bucket and immediately consume one
      const newDoc: RateLimitDoc = {
        id: key,
        tokens: capacity - 1,
        lastRefillAtMs: now,
      };
      try {
        await container.items.create(newDoc);
        return { allowed: true };
      } catch (createErr: unknown) {
        if (isCosmosConflict(createErr)) {
          // Two requests for the SAME new bucket key raced: both read 404,
          // both attempted create, and this one lost. The store is healthy
          // and the other writer's doc now exists — this is NOT an outage,
          // so it must never surface as one (Codex round 4, Finding 1).
          if (isCreateRetry) {
            // Second consecutive 409 — bound the retry exactly like the 412
            // branch below: fail closed under consumeStrict, fail open
            // under consume, rather than looping unbounded.
            if (failClosed) {
              throw new Error(
                'rate limit retry exhausted: two consecutive 409 create conflicts',
              );
            }
            return { allowed: true };
          }
          // Re-read and retry the consume path against the doc the other
          // request just created.
          return attemptConsume(key, capacity, refillPerSec, isRetry, failClosed, true);
        }
        throw createErr;
      }
    }
    throw err;
  }

  // Refill based on elapsed time
  const elapsedSec = Math.max(0, (now - doc.lastRefillAtMs) / 1000);
  const refilled = Math.min(capacity, doc.tokens + elapsedSec * refillPerSec);

  if (refilled < 1) {
    // Not enough tokens — deny
    const retryAfterMs = Math.ceil((1 - refilled) / refillPerSec * 1000);
    return { allowed: false, retryAfterMs };
  }

  // Consume one token and write back with optimistic concurrency
  const updatedDoc: RateLimitDoc = {
    id: key,
    tokens: refilled - 1,
    lastRefillAtMs: now,
  };

  try {
    if (etag) {
      await container.item(key, key).replace(updatedDoc, {
        accessCondition: { type: 'IfMatch', condition: etag },
      });
    } else {
      await container.item(key, key).replace(updatedDoc);
    }
    return { allowed: true };
  } catch (err: unknown) {
    if (isCosmosPreconditionFailed(err)) {
      if (isRetry) {
        if (failClosed) {
          // Second consecutive 412 under fail-closed semantics — we could
          // not establish a budget at all; that is a failure, not a grant.
          throw new Error('rate limit retry exhausted: two consecutive 412 ETag collisions');
        }
        // Second consecutive 412 — fail-open rather than loop
        return { allowed: true };
      }
      // Concurrent consume: retry once with a fresh read
      return attemptConsume(key, capacity, refillPerSec, true, failClosed, isCreateRetry);
    }
    throw err;
  }
}

function isCosmosNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 404
  );
}

function isCosmosConflict(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 409
  );
}

function isCosmosPreconditionFailed(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 412
  );
}
