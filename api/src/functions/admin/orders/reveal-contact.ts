import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getOrderById } from '../../../cosmos/orders-repository.js';
import { getTechniciansByIds } from '../../../cosmos/technician-repository.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import { consume } from '../../../cosmos/rate-limit-repository.js';
import { getFirebaseAdmin } from '../../../services/firebaseAdmin.js';
import { maskPhone } from '../../../lib/pii/mask.js';
import { RevealContactBodySchema, type RevealParty } from '../../../schemas/order-reveal.js';

/** 30 reveals per minute per admin (spec §6 E09-S08). */
const REVEAL_CAPACITY = 30;
const REVEAL_REFILL_PER_SEC = 0.5;

async function phoneForUid(uid: string): Promise<string | undefined> {
  try {
    const { users } = await getFirebaseAdmin().auth().getUsers([{ uid }]);
    return users[0]?.phoneNumber ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolves the technician's Firebase uid. A booking's technicianId may hold
 * either the technician document id or its technicianId field; the uid is
 * always the document id.
 */
async function technicianUid(technicianId: string): Promise<string | undefined> {
  try {
    const techs = await getTechniciansByIds([technicianId]);
    return techs[0]?.id ?? undefined;
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

  const budget = await consume(`rl:pii-reveal:${admin.adminId}`, REVEAL_CAPACITY, REVEAL_REFILL_PER_SEC);
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
  if (party === 'CUSTOMER') {
    subjectId = order.customerId;
  } else {
    if (!order.technicianId) return { status: 404, jsonBody: { code: 'PARTY_NOT_AVAILABLE' } };
    subjectId = await technicianUid(order.technicianId);
  }
  if (!subjectId) return { status: 404, jsonBody: { code: 'PARTY_NOT_AVAILABLE' } };

  const phone = await phoneForUid(subjectId);
  if (!phone) return { status: 404, jsonBody: { code: 'PHONE_UNAVAILABLE' } };

  const revealedAt = new Date().toISOString();

  // The audit payload carries the masked number only — audit_log is readable
  // by any role with audit.read, so storing the raw number there would defeat
  // the purpose of masking it everywhere else.
  await appendAuditEntry({
    id: randomUUID(),
    adminId: admin.adminId,
    role: admin.role,
    action: 'PII_CONTACT_REVEALED',
    resourceType: 'booking',
    resourceId: id,
    payload: {
      party,
      subjectId,
      phoneMasked: maskPhone(phone),
      phoneLast4: phone.slice(-4),
    },
    timestamp: revealedAt,
    partitionKey: revealedAt.slice(0, 7),
  });

  return { status: 200, jsonBody: { party, phone, revealedAt } };
}

app.http('adminRevealOrderContact', {
  methods: ['POST'],
  route: 'v1/admin/orders/{id}/reveal-contact',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(revealContactHandler),
});
