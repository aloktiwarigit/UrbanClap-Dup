import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getOrderById } from '../../../cosmos/orders-repository.js';
import { updateBookingFields, bookingRepo } from '../../../cosmos/booking-repository.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import {
  ReassignBodySchema,
  CompleteBodySchema,
  RefundBodySchema,
  WaiveFeeBodySchema,
  EscalateBodySchema,
  NoteBodySchema,
} from '../../../schemas/order-overrides.js';

function getOrderId(req: HttpRequest): string | undefined {
  const params = req.params as Record<string, string | undefined>;
  return params['id'];
}

// ── reassign ────────────────────────────────────────────────────────────────

export async function reassignOrderHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = getOrderId(req);
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  const raw = await req.json();
  const parsed = ReassignBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } };
  }

  const updated = await updateBookingFields(id, { technicianId: parsed.data.technicianId });
  if (!updated) {
    return { status: 404, jsonBody: { code: 'ORDER_NOT_FOUND' } };
  }

  const order = await getOrderById(id);
  await appendAuditEntry({
    id: randomUUID(),
    adminId: admin.adminId,
    role: admin.role,
    action: 'REASSIGN',
    resourceType: 'booking',
    resourceId: id,
    payload: { technicianId: parsed.data.technicianId, reason: parsed.data.reason },
    timestamp: new Date().toISOString(),
    partitionKey: new Date().toISOString().slice(0, 7),
  });

  return { status: 200, jsonBody: order };
}

app.http('adminReassignOrder', {
  methods: ['POST'],
  route: 'v1/admin/orders/{id}/reassign',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(reassignOrderHandler),
});

// ── complete ────────────────────────────────────────────────────────────────

export async function completeOrderHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = getOrderId(req);
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  const raw = await req.json();
  const parsed = CompleteBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } };
  }

  const updated = await updateBookingFields(id, { status: 'COMPLETED' });
  if (!updated) {
    return { status: 404, jsonBody: { code: 'ORDER_NOT_FOUND' } };
  }

  const order = await getOrderById(id);
  await appendAuditEntry({
    id: randomUUID(),
    adminId: admin.adminId,
    role: admin.role,
    action: 'COMPLETE',
    resourceType: 'booking',
    resourceId: id,
    payload: { reason: parsed.data.reason },
    timestamp: new Date().toISOString(),
    partitionKey: new Date().toISOString().slice(0, 7),
  });

  return { status: 200, jsonBody: order };
}

app.http('adminCompleteOrder', {
  methods: ['POST'],
  route: 'v1/admin/orders/{id}/complete',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(completeOrderHandler),
});

// ── refund (stub) ───────────────────────────────────────────────────────────

export async function refundOrderHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = getOrderId(req);
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  const raw = await req.json();
  const parsed = RefundBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } };
  }

  const order = await getOrderById(id);
  if (!order) {
    return { status: 404, jsonBody: { code: 'ORDER_NOT_FOUND' } };
  }

  console.log('REFUND_INITIATED', { orderId: id, ...parsed.data });

  await appendAuditEntry({
    id: randomUUID(),
    adminId: admin.adminId,
    role: admin.role,
    action: 'REFUND',
    resourceType: 'booking',
    resourceId: id,
    payload: { reason: parsed.data.reason, amountPaise: parsed.data.amountPaise },
    timestamp: new Date().toISOString(),
    partitionKey: new Date().toISOString().slice(0, 7),
  });

  return { status: 202, jsonBody: { status: 'REFUND_INITIATED', order } };
}

app.http('adminRefundOrder', {
  methods: ['POST'],
  route: 'v1/admin/orders/{id}/refund',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(refundOrderHandler),
});

// ── waive-fee ───────────────────────────────────────────────────────────────

export async function waiveFeeOrderHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = getOrderId(req);
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  const raw = await req.json();
  const parsed = WaiveFeeBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } };
  }

  const updated = await updateBookingFields(id, { feesWaived: true });
  if (!updated) {
    return { status: 404, jsonBody: { code: 'ORDER_NOT_FOUND' } };
  }

  const order = await getOrderById(id);
  await appendAuditEntry({
    id: randomUUID(),
    adminId: admin.adminId,
    role: admin.role,
    action: 'WAIVE_FEE',
    resourceType: 'booking',
    resourceId: id,
    payload: { reason: parsed.data.reason },
    timestamp: new Date().toISOString(),
    partitionKey: new Date().toISOString().slice(0, 7),
  });

  return { status: 200, jsonBody: order };
}

app.http('adminWaiveFeeOrder', {
  methods: ['POST'],
  route: 'v1/admin/orders/{id}/waive-fee',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(waiveFeeOrderHandler),
});

// ── escalate ────────────────────────────────────────────────────────────────

export async function escalateOrderHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = getOrderId(req);
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  const raw = await req.json();
  const parsed = EscalateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } };
  }

  const updated = await updateBookingFields(id, { escalated: true });
  if (!updated) {
    return { status: 404, jsonBody: { code: 'ORDER_NOT_FOUND' } };
  }

  const order = await getOrderById(id);
  await appendAuditEntry({
    id: randomUUID(),
    adminId: admin.adminId,
    role: admin.role,
    action: 'ESCALATE',
    resourceType: 'booking',
    resourceId: id,
    payload: { reason: parsed.data.reason, priority: parsed.data.priority },
    timestamp: new Date().toISOString(),
    partitionKey: new Date().toISOString().slice(0, 7),
  });

  return { status: 200, jsonBody: order };
}

app.http('adminEscalateOrder', {
  methods: ['POST'],
  route: 'v1/admin/orders/{id}/escalate',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(escalateOrderHandler),
});

// ── note ────────────────────────────────────────────────────────────────────

export async function noteOrderHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = getOrderId(req);
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  const raw = await req.json();
  const parsed = NoteBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } };
  }

  const existingBooking = await bookingRepo.getById(id);
  if (!existingBooking) {
    return { status: 404, jsonBody: { code: 'ORDER_NOT_FOUND' } };
  }

  const updatedNotes = [...(existingBooking.internalNotes ?? []), parsed.data.note];
  await updateBookingFields(id, { internalNotes: updatedNotes });

  const order = await getOrderById(id);
  await appendAuditEntry({
    id: randomUUID(),
    adminId: admin.adminId,
    role: admin.role,
    action: 'ADD_NOTE',
    resourceType: 'booking',
    resourceId: id,
    payload: { note: parsed.data.note },
    timestamp: new Date().toISOString(),
    partitionKey: new Date().toISOString().slice(0, 7),
  });

  return { status: 200, jsonBody: order };
}

app.http('adminNoteOrder', {
  methods: ['POST'],
  route: 'v1/admin/orders/{id}/note',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(noteOrderHandler),
});
