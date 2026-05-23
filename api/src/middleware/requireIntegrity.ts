import type { HttpHandler, HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import * as Sentry from '@sentry/node';

/**
 * Options passed to individual route wrappers.
 */
export interface RequireIntegrityOptions {
  /**
   * The nonce value that was issued for this specific request.
   * When provided, the middleware checks that the token's `requestHash` matches.
   * If omitted, the nonce match check is skipped (useful for stateless verification).
   */
  expectedNonce?: string;
}

interface PlayIntegrityVerdict {
  tokenPayloadExternal?: {
    requestDetails?: {
      requestPackageName?: string;
      requestHash?: string;
    };
    appIntegrity?: {
      appRecognitionVerdict?: string;
    };
  };
}

const DEBUG_BYPASS_TOKEN = 'debug-bypass';
const STRICT_ENV_VAR = 'PLAY_INTEGRITY_STRICT';
const PACKAGE_NAME_ENV_VAR = 'PLAY_INTEGRITY_PACKAGE_NAME';

function isStrictMode(): boolean {
  return process.env[STRICT_ENV_VAR] === 'true';
}

function isDevEnv(): boolean {
  return process.env[STRICT_ENV_VAR] !== 'true';
}

async function decodeIntegrityToken(
  token: string,
): Promise<PlayIntegrityVerdict> {
  const packageName =
    process.env[PACKAGE_NAME_ENV_VAR] ?? 'com.homeservices';
  const url = `https://playintegrity.googleapis.com/v1/${packageName}:decodeIntegrityToken`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ integrity_token: token }),
  });
  if (!response.ok) {
    throw new Error(`Play Integrity API returned HTTP ${response.status}`);
  }
  return response.json() as Promise<PlayIntegrityVerdict>;
}

/**
 * Middleware that validates the X-Integrity-Token header using the Play Integrity API.
 *
 * Behaviour:
 * - In strict mode (`PLAY_INTEGRITY_STRICT=true`): absent or invalid tokens are rejected (403).
 * - In non-strict mode (default/dev/staging): absent tokens warn to Sentry but allow through.
 *   The `debug-bypass` token value is always accepted in non-strict mode without calling Google.
 * - On Google API errors: fail-open (warn to Sentry, allow through) to avoid 503-ing real traffic.
 *
 * @param handler - The inner handler to wrap.
 * @param opts    - Per-route options (e.g. expected nonce for this request).
 */
export function requireIntegrity(
  handler: HttpHandler,
  opts: RequireIntegrityOptions = {},
): HttpHandler {
  return async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const token = req.headers.get('x-integrity-token');
    const strict = isStrictMode();

    // ── Token absent ─────────────────────────────────────────────────────────
    if (!token) {
      if (strict) {
        return {
          status: 403,
          jsonBody: { code: 'INTEGRITY_MISSING', message: 'Play Integrity token required' },
        };
      }
      // Non-strict: warn + allow
      Sentry.withScope((scope) => {
        scope.setLevel('warning');
        Sentry.captureMessage('Play Integrity token missing on high-value mutation (non-strict mode)');
      });
      return handler(req, ctx);
    }

    // ── Debug bypass (non-strict dev/staging only) ────────────────────────────
    if (token === DEBUG_BYPASS_TOKEN && isDevEnv()) {
      return handler(req, ctx);
    }

    // ── Verify token with Google ──────────────────────────────────────────────
    try {
      const verdict = await decodeIntegrityToken(token);
      const payload = verdict.tokenPayloadExternal;
      const appVerdict = payload?.appIntegrity?.appRecognitionVerdict;
      const requestHash = payload?.requestDetails?.requestHash;

      // Check nonce if provided
      const nonceOk =
        opts.expectedNonce == null || requestHash === opts.expectedNonce;

      const appOk = appVerdict != null && appVerdict !== 'UNAPPROACHABLE';

      if (!appOk || !nonceOk) {
        if (strict) {
          return {
            status: 403,
            jsonBody: {
              code: 'INTEGRITY_FAILED',
              message: 'Play Integrity token validation failed',
            },
          };
        }
        // Non-strict: warn + allow
        Sentry.withScope((scope) => {
          scope.setLevel('warning');
          Sentry.captureMessage(
            `Play Integrity validation failed (non-strict): verdict=${appVerdict ?? 'unknown'}, nonceOk=${nonceOk}`,
          );
        });
      }

      return handler(req, ctx);
    } catch (err: unknown) {
      // Fail-open: Google API errors must not 503 real traffic
      Sentry.withScope((scope) => {
        scope.setLevel('warning');
        Sentry.captureMessage(
          `Play Integrity API call failed (fail-open): ${err instanceof Error ? err.message : String(err)}`,
        );
      });
      return handler(req, ctx);
    }
  };
}
