import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createHash, randomUUID } from 'node:crypto';
import * as Sentry from '@sentry/node';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getOrderById } from '../../../cosmos/orders-repository.js';
import { bookingRepo } from '../../../cosmos/booking-repository.js';
import { getTechniciansByIds } from '../../../cosmos/technician-repository.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import { consumeStrict } from '../../../cosmos/rate-limit-repository.js';
import { getFirebaseAdmin } from '../../../services/firebaseAdmin.js';
import { maskPhone, MASK_PLACEHOLDER } from '../../../lib/pii/mask.js';
import { RevealContactBodySchema, type RevealParty } from '../../../schemas/order-reveal.js';

/** 30 reveals per minute per admin (spec §6 E09-S08). */
const REVEAL_CAPACITY = 30;
const REVEAL_REFILL_PER_SEC = 0.5;

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
 * reveals per minute per admin, and audit-logged as PII_CONTACT_REVEALED.
 *
 * Rate limiting runs here rather than in withRateLimit because the budget is
 * per admin: withRateLimit's keyExtractor only sees the raw request and runs
 * before requireAdmin has resolved an identity.
 *
 * The rate limiter is called via consumeStrict(), not consume(): this is the
 * one endpoint in the API where "the limiter silently disabled itself under
 * Cosmos throttling" is worse than a visible failure, so a Cosmos error here
 * fails the request closed (503) instead of granting it.
 */
export async function revealContactHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = (req.params as Record<string, string | undefined>)['id'];
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

  let budget: Awaited<ReturnType<typeof consumeStrict>>;
  try {
    budget = await consumeStrict(`rl:pii-reveal:${admin.adminId}`, REVEAL_CAPACITY, REVEAL_REFILL_PER_SEC);
  } catch (err: unknown) {
    Sentry.captureException(err);
    return { status: 503, jsonBody: { code: 'RATE_LIMIT_UNAVAILABLE' } };
  }
  if (!budget.allowed) {
    const retryAfterSec = Math.ceil((budget.retryAfterMs ?? 1000) / 1000);
    return {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec), 'Content-Type': 'application/json' },
      jsonBody: { code: 'RATE_LIMITED', retryAfterMs: budget.retryAfterMs },
    };
  }

  const order = await getOrderById(id);
  if (!order) return { status: 404, jsonBody: { code: 'ORDER_NOT_FOUND' } };

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
    if (!order.technicianId) return { status: 404, jsonBody: { code: 'PARTY_NOT_AVAILABLE' } };
    subjectId = await technicianUid(order.technicianId);
  }
  if (!subjectId) return { status: 404, jsonBody: { code: 'PARTY_NOT_AVAILABLE' } };

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
      return { status: 502, jsonBody: { code: 'CONTACT_LOOKUP_FAILED' } };
    }
  }
  if (!phone) return { status: 404, jsonBody: { code: 'PHONE_UNAVAILABLE' } };

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

export const adminRevealOrderContactHandler = requireAdmin(['super-admin', 'ops-manager'])(
  revealContactHandler,
);

app.http('adminRevealOrderContact', {
  methods: ['POST'],
  route: 'v1/admin/orders/{id}/reveal-contact',
  authLevel: 'anonymous',
  handler: adminRevealOrderContactHandler,
});
