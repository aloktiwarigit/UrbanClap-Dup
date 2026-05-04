import type { HttpHandler, HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { consume } from '../cosmos/rate-limit-repository.js';

export interface RateLimitOptions {
  buckets: {
    ip: {
      capacity: number;
      refillPerSec: number;
    };
  };
  /**
   * Optional predicate: return true to bypass rate limiting entirely for
   * this request.  The default exemption also applies: any request whose
   * URL contains `/v1/webhooks/` is always exempt (Razorpay retries are
   * idempotent and legitimate).
   */
  exempt?: (req: HttpRequest) => boolean;
}

/**
 * Sliding-window rate limiting middleware factory.
 *
 * Wraps any Azure Functions HttpHandler and enforces a per-IP token-bucket
 * limit backed by Cosmos DB.  Compatible with both AdminHttpHandler and
 * CustomerHttpHandler shapes because it wraps at the outermost HttpHandler
 * level — handler signatures inside are untouched.
 *
 * Fail-open: if Cosmos throws (throttle, network timeout, etc.) the request
 * is allowed and a Sentry warning is emitted.  Rate limiting is best-effort
 * brute-force defence; it must never 503 real traffic.
 *
 * @example
 * app.http('adminLogin', {
 *   handler: withRateLimit({ buckets: { ip: { capacity: 10, refillPerSec: 10/60 } } })(
 *     requireAdmin([...])(adminLoginHandler)
 *   ),
 * });
 */
export function withRateLimit(options: RateLimitOptions) {
  return <T extends HttpHandler>(handler: T): T => {
    const limited: HttpHandler = async (
      req: HttpRequest,
      ctx: InvocationContext,
    ): Promise<HttpResponseInit> => {
      // ── Exemption check ──────────────────────────────────────────────────
      const isWebhookPath = req.url.includes('/v1/webhooks/');
      const isCustomExempt = options.exempt ? options.exempt(req) : false;

      if (isWebhookPath || isCustomExempt) {
        return handler(req, ctx) as Promise<HttpResponseInit>;
      }

      // ── Derive IP key ─────────────────────────────────────────────────────
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        'unknown';

      const bucketKey = `rl:ip:${ip}`;
      const { capacity, refillPerSec } = options.buckets.ip;

      // ── Consume token ─────────────────────────────────────────────────────
      let result: Awaited<ReturnType<typeof consume>>;
      try {
        result = await consume(bucketKey, capacity, refillPerSec);
      } catch (err: unknown) {
        // consume() already fails-open internally; this is a double-safety net
        Sentry.withScope((scope) => {
          scope.setLevel('warning');
          Sentry.captureException(err);
        });
        return handler(req, ctx) as Promise<HttpResponseInit>;
      }

      if (!result.allowed) {
        const retryAfterSec = Math.ceil((result.retryAfterMs ?? 1000) / 1000);
        return {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'Content-Type': 'application/json',
          },
          jsonBody: {
            code: 'RATE_LIMITED',
            retryAfterMs: result.retryAfterMs,
          },
        };
      }

      return handler(req, ctx) as Promise<HttpResponseInit>;
    };

    // Return as T so the caller keeps the original handler type
    return limited as unknown as T;
  };
}
