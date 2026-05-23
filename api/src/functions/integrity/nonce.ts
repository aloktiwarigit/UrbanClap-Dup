import { randomUUID } from 'node:crypto';
import { app, type HttpHandler, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import '../../bootstrap.js';
import { withRateLimit } from '../../middleware/withRateLimit.js';

/**
 * GET /v1/integrity/nonce
 *
 * Returns a one-time UUID nonce the mobile client must include when requesting a Play Integrity
 * token.  The resulting token (with `requestHash = nonce`) is then sent back on the
 * high-value mutation as the X-Integrity-Token header.
 *
 * Rate-limited to 20 requests per minute per IP to prevent abuse of the nonce issuance path.
 */
export const getNonceHandler: HttpHandler = async (
  _req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> => {
  return {
    status: 200,
    jsonBody: { nonce: randomUUID() },
  };
};

app.http('integrityNonce', {
  route: 'v1/integrity/nonce',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: withRateLimit({
    buckets: { ip: { capacity: 20, refillPerSec: 20 / 60 } },
  })(getNonceHandler),
});
