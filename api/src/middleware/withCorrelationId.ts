/**
 * withCorrelationId — correlation-ID propagation middleware (E13-S04).
 *
 * - Reads x-correlation-id from the incoming request.
 * - Generates a UUID v4 when the header is absent.
 * - Tags the active Sentry scope with correlationId so all exceptions
 *   captured within this request carry the same ID.
 * - Injects x-correlation-id into the outgoing response headers.
 *
 * Composition order (outermost → innermost):
 *   withRateLimit(...)(withCorrelationId(requireAdmin(roles)(handler)))
 */

import { randomUUID } from 'node:crypto';
import type { HttpHandler, HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import * as Sentry from '@sentry/node';

export function withCorrelationId(handler: HttpHandler): HttpHandler {
  return async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const correlationId = req.headers.get('x-correlation-id') ?? randomUUID();

    // Tag the Sentry scope so any exception from this request carries the ID.
    const response = await Sentry.withScope(async (scope) => {
      scope.setTag('correlationId', correlationId);
      return handler(req, ctx) as Promise<HttpResponseInit>;
    });

    // Inject correlation-ID into the response so the caller can trace requests.
    const headers: Record<string, string> = {
      ...((response.headers as Record<string, string> | undefined) ?? {}),
      'x-correlation-id': correlationId,
    };

    return { ...response, headers };
  };
}
