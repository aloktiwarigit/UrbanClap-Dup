import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createHash, randomUUID } from 'node:crypto';
import * as Sentry from '@sentry/node';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext, AdminRole } from '../../../types/admin.js';
import { getOrderById } from '../../../cosmos/orders-repository.js';
import { bookingRepo } from '../../../cosmos/booking-repository.js';
import { getTechniciansByIds } from '../../../cosmos/technician-repository.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import { consumeStrict } from '../../../cosmos/rate-limit-repository.js';
import { auditLog } from '../../../services/auditLog.service.js';
import { getFirebaseAdmin } from '../../../services/firebaseAdmin.js';
import { maskPhone, MASK_PLACEHOLDER } from '../../../lib/pii/mask.js';
import { RevealContactBodySchema, type RevealParty } from '../../../schemas/order-reveal.js';

/** 30 reveals per minute per admin (spec §6 E09-S08). */
const REVEAL_CAPACITY = 30;
const REVEAL_REFILL_PER_SEC = 0.5;

/**
 * 50 reveals per rolling 24h per admin (E09-S08 hardening, closes I-PII4).
 *
 * Sizing: production has had 11 completed bookings in the product's entire
 * history to date, and the pilot ceiling is 5,000 bookings/month ≈ 167/day.
 * A single dispute may reasonably need two reveals (customer + technician).
 * 50/day is ~30% of all bookings at the *planned* pilot ceiling — generous
 * for a legitimately busy day of dispute handling, while turning bulk
 * exfiltration from "unnoticed" into a months-long operation that writes one
 * queryable `PII_CONTACT_REVEAL_DENIED` row per attempt once the cap bites.
 *
 * `consumeStrict`'s token bucket is a rate limiter, not a calendar window:
 * refilling 50 tokens/86400s approximates a rolling 24h budget (it never
 * hard-resets at midnight, and a bucket left untouched for a full day is
 * back to full) rather than implementing a literal rolling window. That
 * approximation is accepted here for the same reason the per-minute budget
 * already accepts it — see `consumeStrict`'s own doc comment.
 */
const REVEAL_DAILY_CAPACITY = 50;
const REVEAL_DAILY_REFILL_PER_SEC = 50 / 86400;

/**
 * The only two roles allowed to reveal a full phone number (ADR 0034).
 * Exported as a single const and used for BOTH the handler's authorization
 * check and the `requiredRoles` field of the 403 body, so the two can never
 * drift apart — see Change 1b in the handler doc comment below.
 */
export const PII_REVEAL_ALLOWED_ROLES: AdminRole[] = ['super-admin', 'ops-manager'];

/**
 * Every admin role that can hold a valid session. Passed to `requireAdmin`
 * so any authenticated admin reaches the handler — see Change 1b below for
 * why authorization is checked in the handler instead.
 */
const ALL_ADMIN_ROLES: AdminRole[] = [
  'super-admin',
  'ops-manager',
  'finance',
  'support-agent',
  'system',
];

/** Reasons a reveal can be denied — see `auditDenied()`. */
type RevealDenialReason =
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'RATE_LIMITED_DAILY'
  | 'NOT_FOUND'
  | 'LOOKUP_FAILED'
  | 'RATE_LIMIT_UNAVAILABLE';

/**
 * Resolves the full phone number for a Firebase uid.
 *
 * Throws on a genuine lookup failure (Firebase Auth outage) rather than
 * swallowing the error — the caller must be able to tell "the number does
 * not exist" (404 PHONE_UNAVAILABLE) apart from "we could not check" (502
 * CONTACT_LOOKUP_FAILED). Silently collapsing both to the same response
 * would hide an outage as if it were routine data absence.
 */
async function phoneForUid(uid: string): Promise<string | undefined> {
  const { users } = await getFirebaseAdmin().auth().getUsers([{ uid }]);
  return users[0]?.phoneNumber ?? undefined;
}

/**
 * Derives a stable, non-PII surrogate for a subject identifier to write into
 * the audit log.
 *
 * `subjectId` (`order.customerId` for customers, the technician's Firebase
 * uid for technicians) is NOT safe to write raw: `truecaller-verify.ts` mints
 * customer Firebase UIDs as `createCustomToken(phoneNumber)` (see the
 * `TODO(E11-S01b)` there tracking the migration off phone-as-uid), so for
 * every Truecaller-onboarded customer `subjectId` literally IS their phone
 * number. `audit_log` is readable by any role holding `audit.read` — broader
 * than the two roles allowed to reveal — so writing that value there would
 * re-leak precisely what this endpoint's masking exists to prevent.
 *
 * Applied uniformly to both parties (not special-cased for customers):
 * technician uids may also turn out to be phone-derived, and uniform
 * treatment is easier to reason about than trusting a per-party exemption.
 *
 * A breach investigator can still correlate a `subjectRef` back to a
 * candidate id by hashing that candidate the same way and comparing — the
 * standard "hash, don't encrypt" pattern for a one-way audit correlation key.
 */
function subjectRefFor(subjectId: string): string {
  return createHash('sha256').update(subjectId).digest('hex').slice(0, 16);
}

/**
 * Audits a denied reveal outcome — every non-200 response that reached an
 * identified admin (E09-S08 hardening, closes I-PII3).
 *
 * Deliberately uses `auditLog()` (which swallows its own write failure to
 * Sentry) rather than `appendAuditEntry()`, which the SUCCESS path below
 * uses and deliberately does NOT swallow. That asymmetry looks inconsistent
 * at a glance, so to be explicit: a denial means nothing sensitive was
 * disclosed, so losing the audit row for it is a monitoring gap, not a
 * security incident — it must never turn an otherwise-correct 403/404/429
 * into a 500. A *success* audit failing must still fail closed, because a
 * silently-unaudited successful disclosure is exactly the failure mode this
 * whole endpoint exists to prevent.
 *
 * `subjectRef` is included only when a subject was actually resolved
 * (mirrors the success path's rule below) — never a raw id. `party` is
 * included whenever it is known at the point of denial; it is not yet known
 * for a FORBIDDEN denial, which is checked before the body is parsed.
 */
async function auditDenied(
  admin: AdminContext,
  resourceId: string,
  reason: RevealDenialReason,
  extra: { party?: RevealParty; subjectRef?: string } = {},
): Promise<void> {
  const payload: Record<string, unknown> = {
    ...(extra.party !== undefined && { party: extra.party }),
    ...(extra.subjectRef !== undefined && { subjectRef: extra.subjectRef }),
    reason,
  };
  await auditLog(
    { adminId: admin.adminId, role: admin.role, sessionId: admin.sessionId },
    'PII_CONTACT_REVEAL_DENIED',
    'booking',
    resourceId,
    payload,
  );
}

/**
 * Resolves the technician's Firebase uid.
 *
 * `getTechniciansByIds` queries `WHERE ARRAY_CONTAINS(@ids, c.id) OR
 * ARRAY_CONTAINS(@ids, c.technicianId)` with no ORDER BY, so for a single
 * input it can legitimately return more than one doc — e.g. doc A with
 * `id = technicianId` (an unrelated technician) and doc B with
 * `id = <real assignee>, technicianId = technicianId`. Taking whichever the
 * cross-partition query happens to order first risks disclosing an
 * unrelated person's phone number on the one endpoint in this API that
 * discloses PII. Resolve deterministically instead:
 *   1. An exact `id === technicianId` match wins outright.
 *   2. Otherwise, a `technicianId === technicianId` match is accepted only
 *      if it is unique.
 *   3. Anything ambiguous or absent resolves to `undefined` — the handler
 *      then answers PARTY_NOT_AVAILABLE rather than guess.
 */
async function technicianUid(technicianId: string): Promise<string | undefined> {
  try {
    const techs = await getTechniciansByIds([technicianId]);
    const exact = techs.find((t) => t.id === technicianId);
    if (exact) return exact.id;
    const byTechnicianId = techs.filter((t) => t.technicianId === technicianId);
    if (byTechnicianId.length === 1) return byTechnicianId[0]!.id;
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * The only endpoint in the API that returns an unmasked phone number
 * (ADR 0034). Role-gated to super-admin and ops-manager, rate-limited to 30
 * reveals per minute AND 50 reveals per rolling 24h per admin, and
 * audit-logged as PII_CONTACT_REVEALED on success or PII_CONTACT_REVEAL_DENIED
 * on every other outcome that reached an identified admin.
 *
 * Rate limiting runs here rather than in withRateLimit because the budget is
 * per admin: withRateLimit's keyExtractor only sees the raw request and runs
 * before requireAdmin has resolved an identity.
 *
 * The rate limiter is called via consumeStrict(), not consume(): this is the
 * one endpoint in the API where "the limiter silently disabled itself under
 * Cosmos throttling" is worse than a visible failure, so a Cosmos error here
 * fails the request closed (503) instead of granting it. Both the per-minute
 * and per-day budgets use consumeStrict for the same reason.
 *
 * Change 1b (E09-S08 hardening): this endpoint is registered below with
 * `requireAdmin(ALL_ADMIN_ROLES)`, not `requireAdmin(PII_REVEAL_ALLOWED_ROLES)`
 * — every authenticated admin reaches this handler, and authorization is
 * decided HERE, as the first thing the handler does, instead of inside the
 * shared `requireAdmin` middleware. That is a real reduction in defence in
 * depth: a bug in this handler's role check is no longer backstopped by
 * middleware rejecting the request before the handler ever runs. It is done
 * anyway because `requireAdmin` denies unauthorized callers before an
 * `AdminContext` (and therefore an `adminId`) ever reaches the handler, and
 * without an identified admin there is nothing to attribute a
 * `PII_CONTACT_REVEAL_DENIED` audit row to. Mitigations: (1) the 403 body is
 * built from the same `PII_REVEAL_ALLOWED_ROLES` const used for the check
 * itself, so the two cannot silently drift; (2) the pre-existing RBAC test
 * in reveal-contact.test.ts asserts 403 for `finance`/`support-agent` and a
 * non-403 for `super-admin`/`ops-manager` against the actual composed,
 * registered handler (not just this inner function) — proving the net
 * behaviour is unchanged even though the layer that enforces it moved.
 */
export async function revealContactHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = (req.params as Record<string, string | undefined>)['id'];

  // Change 1b: authorization check runs first — before parsing the body,
  // before touching the rate limiter, before any Cosmos/Firebase I/O — so a
  // caller with no legitimate reason to be here does the least possible
  // amount of work before being rejected. `party` is not yet known at this
  // point, so it is intentionally omitted from the denial payload below.
  if (!PII_REVEAL_ALLOWED_ROLES.includes(admin.role)) {
    if (id) await auditDenied(admin, id, 'FORBIDDEN');
    return { status: 403, jsonBody: { code: 'FORBIDDEN', requiredRoles: PII_REVEAL_ALLOWED_ROLES } };
  }

  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { status: 422, jsonBody: { code: 'VALIDATION_ERROR' } };
  }
  const parsed = RevealContactBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } };
  }
  const party: RevealParty = parsed.data.party;

  // Per-minute budget first, then the daily ceiling — a caller who is about
  // to be denied by the tighter per-minute window shouldn't also spend a
  // token out of the daily budget for the same attempt.
  let minuteBudget: Awaited<ReturnType<typeof consumeStrict>>;
  try {
    minuteBudget = await consumeStrict(
      `rl:pii-reveal:${admin.adminId}`,
      REVEAL_CAPACITY,
      REVEAL_REFILL_PER_SEC,
    );
  } catch (err: unknown) {
    Sentry.captureException(err);
    await auditDenied(admin, id, 'RATE_LIMIT_UNAVAILABLE', { party });
    return { status: 503, jsonBody: { code: 'RATE_LIMIT_UNAVAILABLE' } };
  }
  if (!minuteBudget.allowed) {
    const retryAfterSec = Math.ceil((minuteBudget.retryAfterMs ?? 1000) / 1000);
    await auditDenied(admin, id, 'RATE_LIMITED', { party });
    return {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec), 'Content-Type': 'application/json' },
      jsonBody: { code: 'RATE_LIMITED', retryAfterMs: minuteBudget.retryAfterMs },
    };
  }

  let dailyBudget: Awaited<ReturnType<typeof consumeStrict>>;
  try {
    dailyBudget = await consumeStrict(
      `rl:pii-reveal-day:${admin.adminId}`,
      REVEAL_DAILY_CAPACITY,
      REVEAL_DAILY_REFILL_PER_SEC,
    );
  } catch (err: unknown) {
    Sentry.captureException(err);
    await auditDenied(admin, id, 'RATE_LIMIT_UNAVAILABLE', { party });
    return { status: 503, jsonBody: { code: 'RATE_LIMIT_UNAVAILABLE' } };
  }
  if (!dailyBudget.allowed) {
    const retryAfterSec = Math.ceil((dailyBudget.retryAfterMs ?? 1000) / 1000);
    await auditDenied(admin, id, 'RATE_LIMITED_DAILY', { party });
    return {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec), 'Content-Type': 'application/json' },
      jsonBody: { code: 'RATE_LIMITED_DAILY', retryAfterMs: dailyBudget.retryAfterMs },
    };
  }

  const order = await getOrderById(id);
  if (!order) {
    await auditDenied(admin, id, 'NOT_FOUND', { party });
    return { status: 404, jsonBody: { code: 'ORDER_NOT_FOUND' } };
  }

  let subjectId: string | undefined;
  let bookingCustomerPhone: string | undefined;
  if (party === 'CUSTOMER') {
    subjectId = order.customerId;
    // hydrateOrders() masks order.customerPhone || customerProfile?.phoneNumber,
    // so the list can display a masked number sourced from the booking
    // document even when Firebase Auth no longer holds one for this
    // customer. bookings.ts persists customerPhone at booking creation, so
    // this is common for historical bookings — read the raw booking here so
    // the reveal can still succeed instead of a false 404 PHONE_UNAVAILABLE.
    const booking = await bookingRepo.getById(id);
    bookingCustomerPhone = booking?.customerPhone || undefined;
  } else {
    if (!order.technicianId) {
      await auditDenied(admin, id, 'NOT_FOUND', { party });
      return { status: 404, jsonBody: { code: 'PARTY_NOT_AVAILABLE' } };
    }
    subjectId = await technicianUid(order.technicianId);
  }
  if (!subjectId) {
    await auditDenied(admin, id, 'NOT_FOUND', { party });
    return { status: 404, jsonBody: { code: 'PARTY_NOT_AVAILABLE' } };
  }

  let phone: string | undefined;
  if (bookingCustomerPhone) {
    // The booking's persisted number wins outright when present — no need
    // to hit Firebase Auth at all, and no risk of a spurious 502 masking a
    // number we already have.
    phone = bookingCustomerPhone;
  } else {
    try {
      phone = await phoneForUid(subjectId);
    } catch (err: unknown) {
      Sentry.captureException(err);
      await auditDenied(admin, id, 'LOOKUP_FAILED', { party, subjectRef: subjectRefFor(subjectId) });
      return { status: 502, jsonBody: { code: 'CONTACT_LOOKUP_FAILED' } };
    }
  }
  if (!phone) {
    await auditDenied(admin, id, 'NOT_FOUND', { party, subjectRef: subjectRefFor(subjectId) });
    return { status: 404, jsonBody: { code: 'PHONE_UNAVAILABLE' } };
  }

  const revealedAt = new Date().toISOString();
  const phoneMasked = maskPhone(phone);
  // Derive last4 from the trimmed value, and never from the raw one: a phone
  // under 4 characters makes maskPhone() collapse to MASK_PLACEHOLDER, and
  // slicing the raw (untrimmed) string in that case would write the entire
  // number in cleartext into audit_log — exactly the leak this story exists
  // to prevent.
  const phoneLast4 = phoneMasked === MASK_PLACEHOLDER ? '' : phone.trim().slice(-4);

  // The audit payload carries the masked number and a one-way subjectRef
  // only — never the raw subjectId. audit_log is readable by any role with
  // audit.read, and subjectId can itself be a raw phone number (customer
  // Firebase UIDs are phone-derived, see subjectRefFor() above), so storing
  // it directly would defeat the purpose of masking the number everywhere
  // else.
  await appendAuditEntry({
    id: randomUUID(),
    adminId: admin.adminId,
    role: admin.role,
    action: 'PII_CONTACT_REVEALED',
    resourceType: 'booking',
    resourceId: id,
    payload: {
      party,
      subjectRef: subjectRefFor(subjectId),
      phoneMasked,
      phoneLast4,
    },
    timestamp: revealedAt,
    partitionKey: revealedAt.slice(0, 7),
  });

  return {
    status: 200,
    // This response carries the one raw phone number the API ever emits —
    // never cache it, matching the convention in dashboard/feed.ts and
    // dashboard/pending-actions.ts for other admin responses that must not
    // be served stale from a shared cache.
    headers: { 'Cache-Control': 'no-store' },
    jsonBody: { party, phone, revealedAt },
  };
}

// Change 1b: authenticate any admin here, authorize inside revealContactHandler
// itself — see that function's doc comment for why, and the mitigations.
export const adminRevealOrderContactHandler = requireAdmin(ALL_ADMIN_ROLES)(
  revealContactHandler,
);

app.http('adminRevealOrderContact', {
  methods: ['POST'],
  route: 'v1/admin/orders/{id}/reveal-contact',
  authLevel: 'anonymous',
  handler: adminRevealOrderContactHandler,
});
