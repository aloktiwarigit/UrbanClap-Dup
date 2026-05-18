import { createHash } from 'node:crypto';
import { app } from '@azure/functions';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { WaitlistRequestSchema } from '../schemas/waitlist.schema.js';
import { joinWaitlist } from '../services/waitlist.service.js';
import { consume } from '../cosmos/rate-limit-repository.js';

const PHONE_RATE_LIMIT = { capacity: 5, refillPerSec: 5 / 3600 } as const;
const IP_RATE_LIMIT = { capacity: 50, refillPerSec: 50 / 3600 } as const;

export const waitlistHandler: HttpHandler = async (
  req: HttpRequest,
  ctx: InvocationContext,
) => {
  // ── IP-level rate limit ────────────────────────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ipResult = await consume(
    `rl:waitlist:ip:${ip}`,
    IP_RATE_LIMIT.capacity,
    IP_RATE_LIMIT.refillPerSec,
  );
  if (!ipResult.allowed) {
    return {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((ipResult.retryAfterMs ?? 1000) / 1000)),
      },
      jsonBody: { code: 'RATE_LIMITED' },
    };
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }

  // ── Zod validation ─────────────────────────────────────────────────────────
  const parsed = WaitlistRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      jsonBody: { code: 'VALIDATION_ERROR', errors: parsed.error.flatten() },
    };
  }
  const data = parsed.data;

  // ── Clock-skew check (±90 s) ───────────────────────────────────────────────
  const requestedAtMs = new Date(data.requestedAt).getTime();
  if (Math.abs(Date.now() - requestedAtMs) > 90_000) {
    return { status: 400, jsonBody: { code: 'CLOCK_SKEW' } };
  }

  // ── Phone-level rate limit (after parse so we have the phone number) ───────
  const phoneResult = await consume(
    `rl:waitlist:phone:${data.phone}`,
    PHONE_RATE_LIMIT.capacity,
    PHONE_RATE_LIMIT.refillPerSec,
  );
  if (!phoneResult.allowed) {
    return {
      status: 429,
      headers: {
        'Retry-After': String(
          Math.ceil((phoneResult.retryAfterMs ?? 1000) / 1000),
        ),
      },
      jsonBody: { code: 'RATE_LIMITED' },
    };
  }

  // ── Business logic ─────────────────────────────────────────────────────────
  try {
    await joinWaitlist(data, ip);
    const phoneHash = createHash('sha256')
      .update(data.phone)
      .digest('hex')
      .slice(0, 8);
    ctx.log(
      `waitlist_join phone_hash=${phoneHash} serviceId=${data.serviceId} mode=ok`,
    );
    return { status: 201, jsonBody: { ok: true } };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNKNOWN_SERVICE') {
      return { status: 400, jsonBody: { code: 'UNKNOWN_SERVICE' } };
    }
    Sentry.captureException(err);
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }
};

app.http('waitlist', {
  methods: ['POST'],
  route: 'v1/waitlist',
  authLevel: 'anonymous',
  handler: waitlistHandler,
});
