OpenAI Codex v0.121.0 (research preview)
--------
workdir: C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
model: gpt-5.4
provider: openai
approval: never
sandbox: read-only
reasoning effort: none
reasoning summaries: none
session id: 019dad45-eedf-7651-b14b-64d25547ac2d
--------
user
changes against 'main'
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff ae8bc4977db3473758186f3b86d09542af2874f6' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 165ms:
diff --git a/api/src/cosmos/audit-log-repository.ts b/api/src/cosmos/audit-log-repository.ts
index 09fad09..769451e 100644
--- a/api/src/cosmos/audit-log-repository.ts
+++ b/api/src/cosmos/audit-log-repository.ts
@@ -1,7 +1,7 @@
 import { getCosmosClient, DB_NAME } from './client.js';
 import { AuditLogEntrySchema } from '../schemas/audit-log.js';
 import type { AuditLogDoc, AuditLogEntry, AuditLogQuery } from '../schemas/audit-log.js';
-import type { SqlParameter, SqlQuerySpec } from '@azure/cosmos';
+import type { SqlParameter } from '@azure/cosmos';
 
 const CONTAINER = 'audit_log';
 
@@ -47,7 +47,7 @@ export async function queryAuditLog(
     .database(DB_NAME)
     .container(CONTAINER)
     .items.query<Record<string, unknown>>(
-      { query, parameters } as SqlQuerySpec,
+      { query, parameters },
       {
         maxItemCount: params.pageSize,
         ...(params.continuationToken !== undefined && {
diff --git a/api/src/cosmos/booking-repository.ts b/api/src/cosmos/booking-repository.ts
index 2e44e28..2a1e8fe 100644
--- a/api/src/cosmos/booking-repository.ts
+++ b/api/src/cosmos/booking-repository.ts
@@ -32,9 +32,37 @@ export const bookingRepo = {
     paymentSignature: string,
   ): Promise<BookingDoc | null> {
     const existing = await this.getById(id);
-    if (!existing || existing.status !== 'PENDING_PAYMENT') return null;
+    if (!existing) return null;
+    if (existing.status === 'PAID') return existing; // webhook already processed — idempotent success
+    if (existing.status !== 'PENDING_PAYMENT') return null;
     const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, paymentSignature };
     const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
     return resource!;
   },
+
+  async getByPaymentOrderId(orderId: string): Promise<BookingDoc | null> {
+    const { resources } = await getBookingsContainer()
+      .items.query<BookingDoc>({
+        query: 'SELECT * FROM c WHERE c.paymentOrderId = @orderId',
+        parameters: [{ name: '@orderId', value: orderId }],
+      })
+      .fetchAll();
+    return resources[0] ?? null;
+  },
+
+  async markPaid(id: string, paymentId: string): Promise<BookingDoc | null> {
+    const existing = await this.getById(id);
+    if (!existing || (existing.status !== 'SEARCHING' && existing.status !== 'PENDING_PAYMENT')) return null;
+    const updated: BookingDoc = { ...existing, status: 'PAID', paymentId };
+    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
+    return resource!;
+  },
+
+  async getStaleSearching(olderThanIso: string): Promise<BookingDoc[]> {
+    const { resources } = await getBookingsContainer().items.query<BookingDoc>({
+      query: "SELECT * FROM c WHERE c.status = 'SEARCHING' AND c.createdAt < @cutoff",
+      parameters: [{ name: '@cutoff', value: olderThanIso }],
+    }).fetchAll();
+    return resources;
+  },
 };
diff --git a/api/src/functions/admin/orders/detail.ts b/api/src/functions/admin/orders/detail.ts
index 5f3977c..b9987f9 100644
--- a/api/src/functions/admin/orders/detail.ts
+++ b/api/src/functions/admin/orders/detail.ts
@@ -9,7 +9,7 @@ export async function adminGetOrderHandler(
   _ctx: InvocationContext,
   _admin: AdminContext,
 ): Promise<HttpResponseInit> {
-  const id = (req.params as Record<string, string>)['id'];
+  const id = (req.params)['id'];
   if (!id) {
     return { status: 400, jsonBody: { code: 'MISSING_ID' } };
   }
diff --git a/api/src/functions/webhooks.ts b/api/src/functions/webhooks.ts
new file mode 100644
index 0000000..021e2e8
--- /dev/null
+++ b/api/src/functions/webhooks.ts
@@ -0,0 +1,81 @@
+import { createHmac } from 'node:crypto';
+import type { HttpHandler, Timer } from '@azure/functions';
+import { type InvocationContext, app } from '@azure/functions';
+import { RazorpayWebhookPayloadSchema } from '../schemas/webhook.js';
+import { bookingRepo } from '../cosmos/booking-repository.js';
+import { dispatcherService } from '../services/dispatcher.service.js';
+
+export const razorpayWebhookHandler: HttpHandler = async (req, _ctx) => {
+  const secret = process.env['RAZORPAY_WEBHOOK_SECRET'];
+  if (!secret) return { status: 500, jsonBody: { code: 'CONFIGURATION_ERROR' } };
+
+  const signature = req.headers.get('x-razorpay-signature') ?? '';
+
+  const rawBody = await req.text();
+
+  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
+  if (expected !== signature) {
+    return { status: 400, jsonBody: { code: 'SIGNATURE_INVALID' } };
+  }
+
+  let parsed;
+  try {
+    const json: unknown = JSON.parse(rawBody);
+    const result = RazorpayWebhookPayloadSchema.safeParse(json);
+    if (!result.success) {
+      return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: result.error.issues } };
+    }
+    parsed = result.data;
+  } catch {
+    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
+  }
+
+  if (parsed.event !== 'payment.captured') {
+    return { status: 200, jsonBody: { received: true } };
+  }
+
+  const orderId = parsed.payload.payment.entity.order_id;
+  const paymentId = parsed.payload.payment.entity.id;
+
+  const booking = await bookingRepo.getByPaymentOrderId(orderId);
+  if (!booking) {
+    return { status: 200, jsonBody: { received: true } };
+  }
+
+  if (booking.status === 'PAID') {
+    return { status: 200, jsonBody: { received: true } };
+  }
+
+  const updated = await bookingRepo.markPaid(booking.id, paymentId);
+  if (!updated) {
+    return { status: 200, jsonBody: { received: true } };
+  }
+
+  dispatcherService.triggerDispatch(booking.id).catch(() => {
+    // fire-and-forget — dispatch failure does not fail the webhook ack
+  });
+
+  return { status: 200, jsonBody: { received: true } };
+};
+
+export async function reconcileStaleBookingsHandler(
+  _myTimer: Timer,
+  context: InvocationContext,
+): Promise<void> {
+  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
+  const stale = await bookingRepo.getStaleSearching(cutoff);
+  for (const booking of stale) {
+    context.log(`STALE_BOOKING bookingId=${booking.id} createdAt=${booking.createdAt}`);
+  }
+}
+
+app.http('razorpayWebhook', {
+  route: 'v1/webhooks/razorpay',
+  methods: ['POST'],
+  handler: razorpayWebhookHandler,
+});
+
+app.timer('reconcileStaleBookings', {
+  schedule: '0 0 2 * * *',
+  handler: reconcileStaleBookingsHandler,
+});
diff --git a/api/src/schemas/webhook.ts b/api/src/schemas/webhook.ts
new file mode 100644
index 0000000..2982b7f
--- /dev/null
+++ b/api/src/schemas/webhook.ts
@@ -0,0 +1,40 @@
+import { z } from 'zod';
+
+/**
+ * Razorpay webhook payload schema.
+ *
+ * Full shape:
+ * {
+ *   entity: "event",
+ *   account_id: string,
+ *   event: string,           // e.g. "payment.captured"
+ *   contains: string[],
+ *   payload: {
+ *     payment: {
+ *       entity: {
+ *         id: string,         // paymentId
+ *         order_id: string,   // maps to booking.paymentOrderId
+ *         amount: number,
+ *         currency: string,
+ *         status: string,
+ *         ...                 // additional fields passed through
+ *       }
+ *     }
+ *   }
+ * }
+ */
+export const RazorpayWebhookPayloadSchema = z.object({
+  event: z.string(),
+  payload: z.object({
+    payment: z.object({
+      entity: z
+        .object({
+          id: z.string(),
+          order_id: z.string(),
+        })
+        .passthrough(),
+    }),
+  }),
+}).passthrough();
+
+export type RazorpayWebhookPayload = z.infer<typeof RazorpayWebhookPayloadSchema>;
diff --git a/api/src/services/dispatcher.service.ts b/api/src/services/dispatcher.service.ts
new file mode 100644
index 0000000..fc6d0e8
--- /dev/null
+++ b/api/src/services/dispatcher.service.ts
@@ -0,0 +1,6 @@
+export const dispatcherService = {
+  triggerDispatch(bookingId: string): Promise<void> {
+    console.log(`DISPATCH_TRIGGERED bookingId=${bookingId}`);
+    return Promise.resolve();
+  },
+};
diff --git a/api/tests/cosmos/booking-repository-getByPaymentOrderId.test.ts b/api/tests/cosmos/booking-repository-getByPaymentOrderId.test.ts
new file mode 100644
index 0000000..835487d
--- /dev/null
+++ b/api/tests/cosmos/booking-repository-getByPaymentOrderId.test.ts
@@ -0,0 +1,79 @@
+import { describe, it, expect, vi, beforeEach } from 'vitest';
+import type { BookingDoc } from '../../src/schemas/booking.js';
+
+// --- Mocks ---
+const mockFetchAll = vi.fn();
+const mockQuery = vi.fn(() => ({ fetchAll: mockFetchAll }));
+const mockItem = vi.fn(() => ({ read: vi.fn() }));
+
+vi.mock('../../src/cosmos/client.js', () => ({
+  getBookingsContainer: () => ({
+    items: { query: mockQuery, create: vi.fn() },
+    item: mockItem,
+  }),
+  getCosmosClient: vi.fn(),
+  DB_NAME: 'homeservices',
+}));
+
+import { bookingRepo } from '../../src/cosmos/booking-repository.js';
+
+const sampleDoc: BookingDoc = {
+  id: 'bk-order-test',
+  customerId: 'cust-1',
+  serviceId: 'svc-1',
+  categoryId: 'cat-1',
+  slotDate: '2026-05-01',
+  slotWindow: '10:00-12:00',
+  addressText: '123 Main St',
+  addressLatLng: { lat: 12.97, lng: 77.59 },
+  status: 'PENDING_PAYMENT',
+  paymentOrderId: 'order_abc123',
+  paymentId: null,
+  paymentSignature: null,
+  amount: 59900,
+  createdAt: '2026-04-20T10:00:00.000Z',
+};
+
+describe('bookingRepo.getByPaymentOrderId', () => {
+  beforeEach(() => {
+    vi.clearAllMocks();
+  });
+
+  it('queries Cosmos with the correct SQL and parameter', async () => {
+    mockFetchAll.mockResolvedValue({ resources: [sampleDoc] });
+
+    await bookingRepo.getByPaymentOrderId('order_abc123');
+
+    expect(mockQuery).toHaveBeenCalledOnce();
+    const queryArg = (mockQuery.mock.calls as unknown[][])[0]![0] as {
+      query: string; parameters: Array<{ name: string; value: string }>;
+    };
+    expect(queryArg.query).toContain('c.paymentOrderId = @orderId');
+    expect(queryArg.parameters).toEqual([{ name: '@orderId', value: 'order_abc123' }]);
+  });
+
+  it('returns the first matching document when found', async () => {
+    mockFetchAll.mockResolvedValue({ resources: [sampleDoc] });
+
+    const result = await bookingRepo.getByPaymentOrderId('order_abc123');
+
+    expect(result).toEqual(sampleDoc);
+  });
+
+  it('returns null when no documents match', async () => {
+    mockFetchAll.mockResolvedValue({ resources: [] });
+
+    const result = await bookingRepo.getByPaymentOrderId('order_nonexistent');
+
+    expect(result).toBeNull();
+  });
+
+  it('returns the first document when multiple match (dedup handled by caller)', async () => {
+    const secondDoc: BookingDoc = { ...sampleDoc, id: 'bk-order-test-2' };
+    mockFetchAll.mockResolvedValue({ resources: [sampleDoc, secondDoc] });
+
+    const result = await bookingRepo.getByPaymentOrderId('order_abc123');
+
+    expect(result?.id).toBe('bk-order-test');
+  });
+});
diff --git a/api/tests/cosmos/booking-repository-getStaleSearching.test.ts b/api/tests/cosmos/booking-repository-getStaleSearching.test.ts
new file mode 100644
index 0000000..5c33db5
--- /dev/null
+++ b/api/tests/cosmos/booking-repository-getStaleSearching.test.ts
@@ -0,0 +1,74 @@
+import { describe, it, expect, vi, beforeEach } from 'vitest';
+import type { BookingDoc } from '../../src/schemas/booking.js';
+
+// --- Mocks ---
+const mockFetchAll = vi.fn();
+const mockQuery = vi.fn(() => ({ fetchAll: mockFetchAll }));
+
+vi.mock('../../src/cosmos/client.js', () => ({
+  getBookingsContainer: () => ({
+    items: { query: mockQuery, create: vi.fn() },
+    item: vi.fn(() => ({ read: vi.fn(), replace: vi.fn() })),
+  }),
+  getCosmosClient: vi.fn(),
+  DB_NAME: 'homeservices',
+}));
+
+import { bookingRepo } from '../../src/cosmos/booking-repository.js';
+
+const staleDoc: BookingDoc = {
+  id: 'bk-stale-1',
+  customerId: 'cust-1',
+  serviceId: 'svc-1',
+  categoryId: 'cat-1',
+  slotDate: '2026-05-01',
+  slotWindow: '10:00-12:00',
+  addressText: '123 Main St',
+  addressLatLng: { lat: 12.97, lng: 77.59 },
+  status: 'SEARCHING',
+  paymentOrderId: 'order_stale',
+  paymentId: 'pay_stale',
+  paymentSignature: 'sig_stale',
+  amount: 59900,
+  createdAt: '2026-04-19T08:00:00.000Z',
+};
+
+describe('bookingRepo.getStaleSearching', () => {
+  beforeEach(() => {
+    vi.clearAllMocks();
+  });
+
+  it('queries with correct SQL and @cutoff parameter', async () => {
+    mockFetchAll.mockResolvedValue({ resources: [] });
+    const cutoff = '2026-04-20T00:00:00.000Z';
+
+    await bookingRepo.getStaleSearching(cutoff);
+
+    expect(mockQuery).toHaveBeenCalledOnce();
+    const queryArg = (mockQuery.mock.calls as unknown[][])[0]![0] as {
+      query: string; parameters: Array<{ name: string; value: string }>;
+    };
+    expect(queryArg.query).toContain("c.status = 'SEARCHING'");
+    expect(queryArg.query).toContain('c.createdAt < @cutoff');
+    expect(queryArg.parameters).toEqual([{ name: '@cutoff', value: cutoff }]);
+  });
+
+  it('returns array of matching documents', async () => {
+    const cutoff = '2026-04-20T00:00:00.000Z';
+    mockFetchAll.mockResolvedValue({ resources: [staleDoc] });
+
+    const result = await bookingRepo.getStaleSearching(cutoff);
+
+    expect(result).toEqual([staleDoc]);
+    expect(result).toHaveLength(1);
+  });
+
+  it('returns empty array when no results', async () => {
+    const cutoff = '2026-04-20T00:00:00.000Z';
+    mockFetchAll.mockResolvedValue({ resources: [] });
+
+    const result = await bookingRepo.getStaleSearching(cutoff);
+
+    expect(result).toEqual([]);
+  });
+});
diff --git a/api/tests/cosmos/booking-repository-markPaid.test.ts b/api/tests/cosmos/booking-repository-markPaid.test.ts
new file mode 100644
index 0000000..c9a2676
--- /dev/null
+++ b/api/tests/cosmos/booking-repository-markPaid.test.ts
@@ -0,0 +1,114 @@
+import { describe, it, expect, vi, beforeEach } from 'vitest';
+import type { BookingDoc } from '../../src/schemas/booking.js';
+
+// --- Mocks ---
+const mockReplace = vi.fn();
+const mockRead = vi.fn();
+const mockItem = vi.fn(() => ({ read: mockRead, replace: mockReplace }));
+
+vi.mock('../../src/cosmos/client.js', () => ({
+  getBookingsContainer: () => ({
+    items: { query: vi.fn(() => ({ fetchAll: vi.fn() })), create: vi.fn() },
+    item: mockItem,
+  }),
+  getCosmosClient: vi.fn(),
+  DB_NAME: 'homeservices',
+}));
+
+import { bookingRepo } from '../../src/cosmos/booking-repository.js';
+
+const baseDoc: BookingDoc = {
+  id: 'bk-paid-test',
+  customerId: 'cust-1',
+  serviceId: 'svc-1',
+  categoryId: 'cat-1',
+  slotDate: '2026-05-01',
+  slotWindow: '10:00-12:00',
+  addressText: '123 Main St',
+  addressLatLng: { lat: 12.97, lng: 77.59 },
+  status: 'SEARCHING',
+  paymentOrderId: 'order_abc123',
+  paymentId: 'pay_existing',
+  paymentSignature: 'sig_existing',
+  amount: 59900,
+  createdAt: '2026-04-20T10:00:00.000Z',
+};
+
+describe('bookingRepo.markPaid', () => {
+  beforeEach(() => {
+    vi.clearAllMocks();
+  });
+
+  it('returns null when booking is not found', async () => {
+    mockRead.mockResolvedValue({ resource: undefined });
+
+    const result = await bookingRepo.markPaid('nonexistent-id', 'pay_xyz');
+
+    expect(result).toBeNull();
+    expect(mockReplace).not.toHaveBeenCalled();
+  });
+
+  it('transitions PENDING_PAYMENT → PAID (webhook-before-client-confirm race)', async () => {
+    const pendingDoc: BookingDoc = { ...baseDoc, status: 'PENDING_PAYMENT' };
+    const updatedDoc: BookingDoc = { ...pendingDoc, status: 'PAID', paymentId: 'pay_new' };
+    mockRead.mockResolvedValue({ resource: pendingDoc });
+    mockReplace.mockResolvedValue({ resource: updatedDoc });
+
+    const result = await bookingRepo.markPaid('bk-paid-test', 'pay_new');
+
+    expect(mockReplace).toHaveBeenCalledOnce();
+    const replaceArg = (mockReplace.mock.calls as unknown[][])[0]![0] as BookingDoc;
+    expect(replaceArg.status).toBe('PAID');
+    expect(replaceArg.paymentId).toBe('pay_new');
+    expect(result).toEqual(updatedDoc);
+  });
+
+  it('returns null when status is an in-progress state (e.g. ASSIGNED)', async () => {
+    const assignedDoc: BookingDoc = { ...baseDoc, status: 'ASSIGNED' };
+    mockRead.mockResolvedValue({ resource: assignedDoc });
+
+    const result = await bookingRepo.markPaid('bk-paid-test', 'pay_xyz');
+
+    expect(result).toBeNull();
+    expect(mockReplace).not.toHaveBeenCalled();
+  });
+
+  it('transitions SEARCHING → PAID and writes paymentId', async () => {
+    const searchingDoc: BookingDoc = { ...baseDoc, status: 'SEARCHING' };
+    const updatedDoc: BookingDoc = { ...searchingDoc, status: 'PAID', paymentId: 'pay_new' };
+    mockRead.mockResolvedValue({ resource: searchingDoc });
+    mockReplace.mockResolvedValue({ resource: updatedDoc });
+
+    const result = await bookingRepo.markPaid('bk-paid-test', 'pay_new');
+
+    expect(mockReplace).toHaveBeenCalledOnce();
+    const replaceArg = (mockReplace.mock.calls as unknown[][])[0]![0] as BookingDoc;
+    expect(replaceArg.status).toBe('PAID');
+    expect(replaceArg.paymentId).toBe('pay_new');
+    expect(result).toEqual(updatedDoc);
+  });
+
+  it('returns null when status is already PAID (idempotency guard)', async () => {
+    const paidDoc: BookingDoc = { ...baseDoc, status: 'PAID' };
+    mockRead.mockResolvedValue({ resource: paidDoc });
+
+    const result = await bookingRepo.markPaid('bk-paid-test', 'pay_xyz');
+
+    expect(result).toBeNull();
+    expect(mockReplace).not.toHaveBeenCalled();
+  });
+});
+
+describe('bookingRepo.confirmPayment — PAID idempotency', () => {
+  beforeEach(() => vi.clearAllMocks());
+
+  it('returns the existing PAID booking when webhook already processed it', async () => {
+    const paidDoc: BookingDoc = { ...baseDoc, status: 'PAID', paymentId: 'pay_webhook' };
+    mockRead.mockResolvedValue({ resource: paidDoc });
+
+    const result = await bookingRepo.confirmPayment(paidDoc.id, 'pay_client', 'sig_client');
+
+    expect(result).toEqual(paidDoc);
+    expect(mockReplace).not.toHaveBeenCalled();
+  });
+});
diff --git a/api/tests/schemas/webhook.test.ts b/api/tests/schemas/webhook.test.ts
new file mode 100644
index 0000000..9c682bb
--- /dev/null
+++ b/api/tests/schemas/webhook.test.ts
@@ -0,0 +1,96 @@
+import { describe, it, expect } from 'vitest';
+import { RazorpayWebhookPayloadSchema } from '../../src/schemas/webhook.js';
+
+const validPayload = {
+  entity: 'event',
+  account_id: 'acc_test123',
+  event: 'payment.captured',
+  contains: ['payment'],
+  payload: {
+    payment: {
+      entity: {
+        id: 'pay_test123',
+        order_id: 'order_test456',
+        amount: 59900,
+        currency: 'INR',
+        status: 'captured',
+      },
+    },
+  },
+};
+
+describe('RazorpayWebhookPayloadSchema', () => {
+  it('parses a valid payment.captured payload successfully', () => {
+    expect(() => RazorpayWebhookPayloadSchema.parse(validPayload)).not.toThrow();
+  });
+
+  it('returns the event string', () => {
+    const result = RazorpayWebhookPayloadSchema.parse(validPayload);
+    expect(result.event).toBe('payment.captured');
+  });
+
+  it('returns the paymentId from payload.payment.entity.id', () => {
+    const result = RazorpayWebhookPayloadSchema.parse(validPayload);
+    expect(result.payload.payment.entity.id).toBe('pay_test123');
+  });
+
+  it('returns the order_id from payload.payment.entity.order_id', () => {
+    const result = RazorpayWebhookPayloadSchema.parse(validPayload);
+    expect(result.payload.payment.entity.order_id).toBe('order_test456');
+  });
+
+  it('fails when payload.payment.entity.order_id is missing', () => {
+    const bad = {
+      ...validPayload,
+      payload: {
+        payment: {
+          entity: {
+            id: 'pay_test123',
+            // order_id intentionally omitted
+            amount: 59900,
+            currency: 'INR',
+            status: 'captured',
+          },
+        },
+      },
+    };
+    expect(() => RazorpayWebhookPayloadSchema.parse(bad)).toThrow();
+  });
+
+  it('fails when payload.payment.entity.id is missing', () => {
+    const bad = {
+      ...validPayload,
+      payload: {
+        payment: {
+          entity: {
+            // id intentionally omitted
+            order_id: 'order_test456',
+            amount: 59900,
+          },
+        },
+      },
+    };
+    expect(() => RazorpayWebhookPayloadSchema.parse(bad)).toThrow();
+  });
+
+  it('fails when event field is missing', () => {
+    const { event: _event, ...noEvent } = validPayload;
+    expect(() => RazorpayWebhookPayloadSchema.parse(noEvent)).toThrow();
+  });
+
+  it('passes through extra fields in the entity (passthrough)', () => {
+    const withExtra = {
+      ...validPayload,
+      payload: {
+        payment: {
+          entity: {
+            ...validPayload.payload.payment.entity,
+            fee: 100,
+            tax: 18,
+          },
+        },
+      },
+    };
+    expect(() => RazorpayWebhookPayloadSchema.parse(withExtra)).not.toThrow();
+  });
+});
diff --git a/api/tests/services/dispatcher.service.test.ts b/api/tests/services/dispatcher.service.test.ts
new file mode 100644
index 0000000..1e5d6b7
--- /dev/null
+++ b/api/tests/services/dispatcher.service.test.ts
@@ -0,0 +1,25 @@
+import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
+import { dispatcherService } from '../../src/services/dispatcher.service.js';
+
+describe('dispatcherService', () => {
+  let consoleSpy: ReturnType<typeof vi.spyOn>;
+
+  beforeEach(() => {
+    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
+  });
+
+  afterEach(() => {
+    consoleSpy.mockRestore();
+  });
+
+  it('triggerDispatch logs the correct message', async () => {
+    await dispatcherService.triggerDispatch('bk-123');
+
+    expect(consoleSpy).toHaveBeenCalledOnce();
+    expect(consoleSpy).toHaveBeenCalledWith('DISPATCH_TRIGGERED bookingId=bk-123');
+  });
+
+  it('triggerDispatch returns void without throwing', async () => {
+    await expect(dispatcherService.triggerDispatch('bk-456')).resolves.toBeUndefined();
+  });
+});
diff --git a/api/tests/webhooks/razorpay-webhook.test.ts b/api/tests/webhooks/razorpay-webhook.test.ts
new file mode 100644
index 0000000..934884d
--- /dev/null
+++ b/api/tests/webhooks/razorpay-webhook.test.ts
@@ -0,0 +1,124 @@
+import { describe, it, expect, vi, beforeEach } from 'vitest';
+import { createHmac } from 'node:crypto';
+import { HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
+
+vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook_secret');
+
+vi.mock('../../src/cosmos/booking-repository.js', () => ({
+  bookingRepo: {
+    getByPaymentOrderId: vi.fn(),
+    markPaid: vi.fn(),
+    getStaleSearching: vi.fn(),
+  },
+}));
+
+vi.mock('../../src/services/dispatcher.service.js', () => ({
+  dispatcherService: { triggerDispatch: vi.fn().mockResolvedValue(undefined) },
+}));
+
+import { razorpayWebhookHandler, reconcileStaleBookingsHandler } from '../../src/functions/webhooks.js';
+import { bookingRepo } from '../../src/cosmos/booking-repository.js';
+import { dispatcherService } from '../../src/services/dispatcher.service.js';
+
+function makeSignature(body: string, secret = 'webhook_secret') {
+  return createHmac('sha256', secret).update(body).digest('hex');
+}
+
+function makeWebhookReq(body: string, signature: string) {
+  return new HttpRequest({
+    url: 'http://localhost/api/v1/webhooks/razorpay',
+    method: 'POST',
+    body: { string: body },
+    headers: { 'x-razorpay-signature': signature, 'content-type': 'application/json' },
+  });
+}
+
+const mockCtx = {} as InvocationContext;
+
+beforeEach(() => {
+  vi.clearAllMocks();
+});
+
+describe('POST /v1/webhooks/razorpay', () => {
+  it('returns 500 when RAZORPAY_WEBHOOK_SECRET is not configured', async () => {
+    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', undefined as unknown as string);
+    const body = JSON.stringify({ event: 'payment.captured' });
+    const req = makeWebhookReq(body, 'any');
+    const res = await razorpayWebhookHandler(req, mockCtx) as HttpResponseInit;
+    expect(res.status).toBe(500);
+    expect((res.jsonBody as { code: string }).code).toBe('CONFIGURATION_ERROR');
+    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook_secret');
+  });
+
+  it('returns 400 on bad signature', async () => {
+    const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_123', order_id: 'order_456' } } } });
+    const req = makeWebhookReq(body, 'bad_signature');
+    const res = await razorpayWebhookHandler(req, mockCtx) as HttpResponseInit;
+    expect(res.status).toBe(400);
+    expect((res.jsonBody as { code: string }).code).toBe('SIGNATURE_INVALID');
+  });
+
+  it('returns 200 + transitions to PAID on valid payment.captured', async () => {
+    const body = JSON.stringify({
+      event: 'payment.captured',
+      payload: { payment: { entity: { id: 'pay_123', order_id: 'order_456' } } },
+    });
+    const signature = makeSignature(body);
+    const req = makeWebhookReq(body, signature);
+
+    (bookingRepo.getByPaymentOrderId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
+      id: 'bk-1',
+      status: 'SEARCHING',
+      paymentOrderId: 'order_456',
+    });
+    (bookingRepo.markPaid as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
+      id: 'bk-1',
+      status: 'PAID',
+    });
+
+    const res = await razorpayWebhookHandler(req, mockCtx) as HttpResponseInit;
+    expect(res.status).toBe(200);
+    expect((res.jsonBody as { received: boolean }).received).toBe(true);
+    // eslint-disable-next-line @typescript-eslint/unbound-method
+    expect(vi.mocked(bookingRepo.markPaid)).toHaveBeenCalledWith('bk-1', 'pay_123');
+    // eslint-disable-next-line @typescript-eslint/unbound-method
+    expect(vi.mocked(dispatcherService.triggerDispatch)).toHaveBeenCalledWith('bk-1');
+  });
+
+  it('idempotency — second call on PAID booking returns 200, markPaid not called', async () => {
+    const body = JSON.stringify({
+      event: 'payment.captured',
+      payload: { payment: { entity: { id: 'pay_123', order_id: 'order_456' } } },
+    });
+    const signature = makeSignature(body);
+    const req = makeWebhookReq(body, signature);
+
+    (bookingRepo.getByPaymentOrderId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
+      id: 'bk-1',
+      status: 'PAID',
+      paymentOrderId: 'order_456',
+    });
+
+    const res = await razorpayWebhookHandler(req, mockCtx) as HttpResponseInit;
+    expect(res.status).toBe(200);
+    // eslint-disable-next-line @typescript-eslint/unbound-method
+    expect(vi.mocked(bookingRepo.markPaid)).not.toHaveBeenCalled();
+  });
+});
+
+describe('reconcileStaleBookingsHandler', () => {
+  it('logs STALE_BOOKING for old SEARCHING bookings', async () => {
+    (bookingRepo.getStaleSearching as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
+      { id: 'bk-stale', createdAt: '2026-01-01T00:00:00.000Z' },
+    ]);
+
+    const logSpy = vi.fn();
+    const fakeCtx = { log: logSpy } as unknown as InvocationContext;
+
+    await reconcileStaleBookingsHandler({} as never, fakeCtx);
+
+    expect(logSpy).toHaveBeenCalledWith(
+      expect.stringContaining('STALE_BOOKING bookingId=bk-stale'),
+    );
+  });
+});

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/schemas/booking.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/payments/confirm.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem api/src/functions -Recurse | Select-Object -ExpandProperty FullName' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 215ms:
import { z } from 'zod';

const BOOKING_STATUSES = [
  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE',
  'REACHED', 'IN_PROGRESS', 'COMPLETED', 'PAID', 'CLOSED',
  'UNFULFILLED', 'CUSTOMER_CANCELLED',
] as const;

export const LatLngSchema = z.object({ lat: z.number(), lng: z.number() });

export const BookingDocSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  serviceId: z.string(),
  categoryId: z.string(),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotWindow: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/),
  addressText: z.string().min(1),
  addressLatLng: LatLngSchema,
  status: z.enum(BOOKING_STATUSES),
  paymentOrderId: z.string(),
  paymentId: z.string().nullable(),
  paymentSignature: z.string().nullable(),
  amount: z.number().int().positive(),
  createdAt: z.string(),
});

export const CreateBookingRequestSchema = z.object({
  serviceId: z.string().min(1),
  categoryId: z.string().min(1),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotWindow: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/),
  addressText: z.string().min(1),
  addressLatLng: LatLngSchema,
});

export const ConfirmBookingRequestSchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export type BookingDoc = z.infer<typeof BookingDocSchema>;
export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;
export type ConfirmBookingRequest = z.infer<typeof ConfirmBookingRequestSchema>;

2026-04-20T23:42:25.803887Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.3 seconds
Output:
Get-Content : Cannot find path 'C:\Alok\Business 
Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\payments\confirm.ts' because it does not exist.
At line:2 char:1
+ Get-Content api/src/functions/payments/confirm.ts
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (C:\Alok\Busines...ents\confirm.ts:String) [Get-Content], ItemNotFoundEx 
   ception
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetContentCommand
 

 exited 1 in 330ms:
Get-Content : Cannot find path 'C:\Alok\Business 
Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\payments\confirm.ts' because it does not exist.
At line:2 char:1
+ Get-Content api/src/functions/payments/confirm.ts
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (C:\Alok\Busines...ents\confirm.ts:String) [Get-Content], ItemNotFoundEx 
   ception
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetContentCommand
 

 succeeded in 238ms:
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\kyc
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\bookings.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\catalogue-admin.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\catalogue-public.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\health.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\webhooks.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\audit-log
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\auth
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\dashboard
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\finance
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\orders
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\me.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\audit-log\list.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\auth\login.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\auth\logout.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\auth\refresh.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\auth\setup-totp.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\dashboard\feed.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\dashboard\summary.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\dashboard\tech-locations.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\finance\approve-payouts.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\finance\payout-queue.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\finance\summary.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\finance\weekly-aggregate.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\orders\detail.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\admin\orders\list.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\kyc\get-kyc-status.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\kyc\submit-aadhaar.ts
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\kyc\submit-pan-ocr.ts

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/bookings.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 155ms:
import type { HttpHandler } from '@azure/functions';
import { app } from '@azure/functions';
import { requireCustomer, type CustomerHttpHandler } from '../middleware/requireCustomer.js';
import { CreateBookingRequestSchema, ConfirmBookingRequestSchema } from '../schemas/booking.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { createRazorpayOrder, verifyPaymentSignature } from '../services/razorpay.service.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';

const createHandler: CustomerHttpHandler = async (req, _ctx, customer) => {
  const body = await req.json().catch(() => null);
  const parsed = CreateBookingRequestSchema.safeParse(body);
  if (!parsed.success) return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };

  const service = await catalogueRepo.getServiceByIdCrossPartition(parsed.data.serviceId);
  if (!service || !service.isActive) return { status: 404, jsonBody: { code: 'SERVICE_NOT_FOUND' } };

  const order = await createRazorpayOrder({
    amount: service.basePrice,
    currency: 'INR',
    receipt: `${customer.customerId}-${Date.now()}`,
  });

  const booking = await bookingRepo.createPending(parsed.data, customer.customerId, order.id, service.basePrice);
  return { status: 201, jsonBody: { bookingId: booking.id, razorpayOrderId: order.id, amount: order.amount } };
};

const confirmHandler: CustomerHttpHandler = async (req, _ctx, customer) => {
  const id = (req as unknown as { params: { id: string } }).params.id;
  const body = await req.json().catch(() => null);
  const parsed = ConfirmBookingRequestSchema.safeParse(body);
  if (!parsed.success) return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };

  const booking = await bookingRepo.getById(id);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.customerId !== customer.customerId) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };

  if (!verifyPaymentSignature({
    razorpayOrderId: parsed.data.razorpayOrderId,
    razorpayPaymentId: parsed.data.razorpayPaymentId,
    razorpaySignature: parsed.data.razorpaySignature,
  })) return { status: 400, jsonBody: { code: 'SIGNATURE_INVALID' } };

  const confirmed = await bookingRepo.confirmPayment(id, parsed.data.razorpayPaymentId, parsed.data.razorpaySignature);
  if (!confirmed) return { status: 409, jsonBody: { code: 'BOOKING_ALREADY_PROCESSED' } };

  return { status: 200, jsonBody: { bookingId: confirmed.id, status: confirmed.status } };
};

export const createBookingHandler: HttpHandler = requireCustomer(createHandler);
export const confirmBookingHandler: HttpHandler = requireCustomer(confirmHandler);

app.http('createBooking', { route: 'v1/bookings', methods: ['POST'], handler: createBookingHandler });
app.http('confirmBooking', { route: 'v1/bookings/{id}/confirm', methods: ['POST'], handler: confirmBookingHandler });

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/cosmos/booking-repository.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 194ms:
import { randomUUID } from 'node:crypto';
import { getBookingsContainer } from './client.js';
import type { BookingDoc, CreateBookingRequest } from '../schemas/booking.js';

function now() { return new Date().toISOString(); }

export const bookingRepo = {
  async createPending(
    req: CreateBookingRequest,
    customerId: string,
    paymentOrderId: string,
    amount: number,
  ): Promise<BookingDoc> {
    const doc: BookingDoc = {
      id: randomUUID(), customerId, ...req,
      status: 'PENDING_PAYMENT', paymentOrderId,
      paymentId: null, paymentSignature: null,
      amount, createdAt: now(),
    };
    const { resource } = await getBookingsContainer().items.create<BookingDoc>(doc);
    return resource!;
  },

  async getById(id: string): Promise<BookingDoc | null> {
    const { resource } = await getBookingsContainer().item(id, id).read<BookingDoc>();
    return resource ?? null;
  },

  async confirmPayment(
    id: string,
    paymentId: string,
    paymentSignature: string,
  ): Promise<BookingDoc | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    if (existing.status === 'PAID') return existing; // webhook already processed â€” idempotent success
    if (existing.status !== 'PENDING_PAYMENT') return null;
    const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, paymentSignature };
    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
    return resource!;
  },

  async getByPaymentOrderId(orderId: string): Promise<BookingDoc | null> {
    const { resources } = await getBookingsContainer()
      .items.query<BookingDoc>({
        query: 'SELECT * FROM c WHERE c.paymentOrderId = @orderId',
        parameters: [{ name: '@orderId', value: orderId }],
      })
      .fetchAll();
    return resources[0] ?? null;
  },

  async markPaid(id: string, paymentId: string): Promise<BookingDoc | null> {
    const existing = await this.getById(id);
    if (!existing || (existing.status !== 'SEARCHING' && existing.status !== 'PENDING_PAYMENT')) return null;
    const updated: BookingDoc = { ...existing, status: 'PAID', paymentId };
    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
    return resource!;
  },

  async getStaleSearching(olderThanIso: string): Promise<BookingDoc[]> {
    const { resources } = await getBookingsContainer().items.query<BookingDoc>({
      query: "SELECT * FROM c WHERE c.status = 'SEARCHING' AND c.createdAt < @cutoff",
      parameters: [{ name: '@cutoff', value: olderThanIso }],
    }).fetchAll();
    return resources;
  },
};

2026-04-20T23:42:38.909712Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem api/src -Recurse -File | Select-String -Pattern \"'PAID'|'SEARCHING'|'PENDING_PAYMENT'|'ASSIGNED'\" | ForEach-Object { "'$_.Path + '"':' + "'$_.LineNumber + '"': ' + "'$_.Line }'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem api/src -Recurse -File | Select-String -Pattern \"'PAID'|'SEARCHING'|'PENDING_PAYMENT'|'ASSIGNED'\" | ForEach-Object { "'$_.Path + '"':' + "'$_.LineNumber + '"': ' + "'$_.Line }' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem api/src -Recurse -File | Select-String -Pattern \"'PAID'|'SEARCHING'|'PENDING_PAYMENT'|'ASSIGNED'\" | ForEach-Object { "'$_.Path + '"':' + "'$_.LineNumber + '"': ' + "'$_.Line }'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n \"'PAID'|'SEARCHING'|'PENDING_PAYMENT'|'ASSIGNED'\" api/src" in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 161ms:
api/src\functions\webhooks.ts:45:  if (booking.status === 'PAID') {
api/src\schemas\booking.ts:4:  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE',
api/src\schemas\booking.ts:5:  'REACHED', 'IN_PROGRESS', 'COMPLETED', 'PAID', 'CLOSED',
api/src\schemas\order.ts:7:  'SEARCHING', 'ASSIGNED', 'EN_ROUTE', 'REACHED',
api/src\schemas\order.ts:8:  'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PAID',
api/src\cosmos\booking-repository.ts:16:      status: 'PENDING_PAYMENT', paymentOrderId,
api/src\cosmos\booking-repository.ts:36:    if (existing.status === 'PAID') return existing; // webhook already processed — idempotent success
api/src\cosmos\booking-repository.ts:37:    if (existing.status !== 'PENDING_PAYMENT') return null;
api/src\cosmos\booking-repository.ts:38:    const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, paymentSignature };
api/src\cosmos\booking-repository.ts:55:    if (!existing || (existing.status !== 'SEARCHING' && existing.status !== 'PENDING_PAYMENT')) return null;
api/src\cosmos\booking-repository.ts:56:    const updated: BookingDoc = { ...existing, status: 'PAID', paymentId };
api/src\cosmos\booking-repository.ts:63:      query: "SELECT * FROM c WHERE c.status = 'SEARCHING' AND c.createdAt < @cutoff",

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/schemas/order.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/admin/orders/detail.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/admin/orders/list.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 180ms:
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const OrderStatusEnum = z.enum([
  'SEARCHING', 'ASSIGNED', 'EN_ROUTE', 'REACHED',
  'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PAID',
]);

export const OrderSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  technicianId: z.string().optional(),
  technicianName: z.string().optional(),
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  categoryId: z.string().optional(),
  status: OrderStatusEnum,
  city: z.string(),
  scheduledAt: z.string(),
  amount: z.number().nonnegative(),
  createdAt: z.string(),
  _ts: z.number().optional(),
});

export const OrderListQuerySchema = z.object({
  status: z.string().optional().transform(s =>
    s ? s.split(',').map(x => x.trim()).filter(Boolean) as z.infer<typeof OrderStatusEnum>[] : undefined
  ),
  city: z.string().optional(),
  categoryId: z.string().optional(),
  technicianId: z.string().optional(),
  customerPhone: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(50).transform(v => Math.min(v, 10000)),
});

export const OrderListResponseSchema = z.object({
  items: z.array(OrderSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderStatus = z.infer<typeof OrderStatusEnum>;
export type OrderListQuery = z.infer<typeof OrderListQuerySchema>;
export type OrderListResponse = z.infer<typeof OrderListResponseSchema>;

 succeeded in 193ms:
import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getOrderById } from '../../../cosmos/orders-repository.js';

export async function adminGetOrderHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = (req.params)['id'];
  if (!id) {
    return { status: 400, jsonBody: { code: 'MISSING_ID' } };
  }

  const order = await getOrderById(id);
  if (!order) {
    return { status: 404, jsonBody: { code: 'ORDER_NOT_FOUND' } };
  }

  return { status: 200, jsonBody: order };
}

app.http('adminGetOrder', {
  methods: ['GET'],
  route: 'v1/admin/orders/{id}',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminGetOrderHandler),
});

 succeeded in 182ms:
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { OrderListQuerySchema } from '../../../schemas/order.js';
import { queryOrders } from '../../../cosmos/orders-repository.js';

export async function adminListOrdersHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  // Collect query params into plain object for Zod parsing
  const raw: Record<string, string> = {};
  const paramKeys = [
    'status', 'city', 'categoryId', 'technicianId', 'customerPhone',
    'dateFrom', 'dateTo', 'minAmount', 'maxAmount', 'page', 'pageSize',
  ];
  for (const key of paramKeys) {
    const val = req.query.get(key);
    if (val !== null) raw[key] = val;
  }

  const parsed = OrderListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const result = await queryOrders(parsed.data);
  return { status: 200, jsonBody: result };
}

app.http('adminListOrders', {
  methods: ['GET'],
  route: 'v1/admin/orders',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminListOrdersHandler),
});

2026-04-20T23:42:51.457144Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem api/src -File | Select-Object -ExpandProperty Name; if (Test-Path api/src/index.ts) { Write-Host '---'; Get-Content api/src/index.ts }"` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem api/src -File | Select-Object -ExpandProperty Name; if (Test-Path api/src/index.ts) { Write-Host '---'; Get-Content api/src/index.ts }" in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem api/src -File | Select-Object -ExpandProperty Name; if (Test-Path api/src/index.ts) { Write-Host '---'; Get-Content api/src/index.ts }"` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem api/src -File | Select-Object -ExpandProperty Name' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/index.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 239ms:
bootstrap.ts

2026-04-20T23:42:55.289920Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.3 seconds
Output:
Get-Content : Cannot find path 'C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\index.ts' because 
it does not exist.
At line:2 char:1
+ Get-Content api/src/index.ts
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (C:\Alok\Busines...pi\src\index.ts:String) [Get-Content], ItemNotFoundEx 
   ception
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetContentCommand
 

 exited 1 in 266ms:
Get-Content : Cannot find path 'C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\index.ts' because 
it does not exist.
At line:2 char:1
+ Get-Content api/src/index.ts
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (C:\Alok\Busines...pi\src\index.ts:String) [Get-Content], ItemNotFoundEx 
   ception
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetContentCommand
 

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/bootstrap.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 208ms:
import { initSentry } from './observability/sentry.js';

initSentry();

// TODO(future-observability-story): wire OpenTelemetry tracing once the
// exporter choice is made (Azure Monitor vs OTLP vs Axiom). Deferred per
// docs/superpowers/specs/2026-04-17-e01-s01-api-skeleton-design.md Â§2.

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/package.json' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/tsconfig.json' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/host.json' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 160ms:
{
  "name": "homeservices-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.15.4",
  "main": "dist/functions/**/*.js",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "dev": "pnpm build && func start",
    "dev:direct": "pnpm build && func start",
    "dev:watch": "tsc --watch",
    "build": "tsc",
    "start": "func start",
    "typecheck": "tsc --noEmit -p tsconfig.tests.json",
    "lint": "eslint . --max-warnings 0",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "openapi:build": "tsx src/openapi/build.ts",
    "openapi:lint": "spectral lint openapi.json --fail-severity error",
    "seed:technicians": "npx tsx scripts/seed-technicians.ts",
    "seed:catalogue": "tsx src/cosmos/seeds/catalogue.ts"
  },
  "dependencies": {
    "@azure/ai-form-recognizer": "^5.1.0",
    "@azure/cosmos": "^4.9.2",
    "@azure/functions": "^4.5.0",
    "@growthbook/growthbook": "^1",
    "@sentry/node": "^8",
    "fastify": "^5",
    "firebase-admin": "^13.8.0",
    "jose": "^6.2.2",
    "otplib": "^13.4.0",
    "posthog-node": "^4",
    "qrcode": "^1.5.4",
    "razorpay": "^2.9.6",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@apidevtools/swagger-parser": "^10.1.0",
    "@asteasolutions/zod-to-openapi": "^7.3.0",
    "@stoplight/spectral-cli": "^6.11.0",
    "@types/node": "^22",
    "@types/qrcode": "^1.5.6",
    "@vitest/coverage-v8": "^2",
    "azure-functions-core-tools": "^4",
    "eslint": "^9",
    "eslint-plugin-import": "^2",
    "prettier": "^3",
    "supertest": "^7",
    "testcontainers": "^10",
    "tsx": "^4",
    "typescript": "^5.6.0",
    "typescript-eslint": "^8",
    "vitest": "^2"
  }
}

 succeeded in 195ms:
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}

 succeeded in 177ms:
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "excludedTypes": "Request"
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}

2026-04-20T23:43:21.504322Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content api/src/cosmos/booking-repository.ts | ForEach-Object {"$i	$_"; $i++}'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content api/src/cosmos/booking-repository.ts | ForEach-Object {"$i	$_"; $i++}' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content api/src/cosmos/booking-repository.ts | ForEach-Object {"$i	$_"; $i++}'` rejected: blocked by policy
2026-04-20T23:43:21.620963Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content api/src/functions/webhooks.ts | ForEach-Object {"$i	$_"; $i++}'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content api/src/functions/webhooks.ts | ForEach-Object {"$i	$_"; $i++}' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content api/src/functions/webhooks.ts | ForEach-Object {"$i	$_"; $i++}'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "''^" api/src/cosmos/booking-repository.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "''^" api/src/functions/webhooks.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 165ms:
1:import { randomUUID } from 'node:crypto';
2:import { getBookingsContainer } from './client.js';
3:import type { BookingDoc, CreateBookingRequest } from '../schemas/booking.js';
4:
5:function now() { return new Date().toISOString(); }
6:
7:export const bookingRepo = {
8:  async createPending(
9:    req: CreateBookingRequest,
10:    customerId: string,
11:    paymentOrderId: string,
12:    amount: number,
13:  ): Promise<BookingDoc> {
14:    const doc: BookingDoc = {
15:      id: randomUUID(), customerId, ...req,
16:      status: 'PENDING_PAYMENT', paymentOrderId,
17:      paymentId: null, paymentSignature: null,
18:      amount, createdAt: now(),
19:    };
20:    const { resource } = await getBookingsContainer().items.create<BookingDoc>(doc);
21:    return resource!;
22:  },
23:
24:  async getById(id: string): Promise<BookingDoc | null> {
25:    const { resource } = await getBookingsContainer().item(id, id).read<BookingDoc>();
26:    return resource ?? null;
27:  },
28:
29:  async confirmPayment(
30:    id: string,
31:    paymentId: string,
32:    paymentSignature: string,
33:  ): Promise<BookingDoc | null> {
34:    const existing = await this.getById(id);
35:    if (!existing) return null;
36:    if (existing.status === 'PAID') return existing; // webhook already processed — idempotent success
37:    if (existing.status !== 'PENDING_PAYMENT') return null;
38:    const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, paymentSignature };
39:    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
40:    return resource!;
41:  },
42:
43:  async getByPaymentOrderId(orderId: string): Promise<BookingDoc | null> {
44:    const { resources } = await getBookingsContainer()
45:      .items.query<BookingDoc>({
46:        query: 'SELECT * FROM c WHERE c.paymentOrderId = @orderId',
47:        parameters: [{ name: '@orderId', value: orderId }],
48:      })
49:      .fetchAll();
50:    return resources[0] ?? null;
51:  },
52:
53:  async markPaid(id: string, paymentId: string): Promise<BookingDoc | null> {
54:    const existing = await this.getById(id);
55:    if (!existing || (existing.status !== 'SEARCHING' && existing.status !== 'PENDING_PAYMENT')) return null;
56:    const updated: BookingDoc = { ...existing, status: 'PAID', paymentId };
57:    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
58:    return resource!;
59:  },
60:
61:  async getStaleSearching(olderThanIso: string): Promise<BookingDoc[]> {
62:    const { resources } = await getBookingsContainer().items.query<BookingDoc>({
63:      query: "SELECT * FROM c WHERE c.status = 'SEARCHING' AND c.createdAt < @cutoff",
64:      parameters: [{ name: '@cutoff', value: olderThanIso }],
65:    }).fetchAll();
66:    return resources;
67:  },
68:};

 succeeded in 189ms:
1:import { createHmac } from 'node:crypto';
2:import type { HttpHandler, Timer } from '@azure/functions';
3:import { type InvocationContext, app } from '@azure/functions';
4:import { RazorpayWebhookPayloadSchema } from '../schemas/webhook.js';
5:import { bookingRepo } from '../cosmos/booking-repository.js';
6:import { dispatcherService } from '../services/dispatcher.service.js';
7:
8:export const razorpayWebhookHandler: HttpHandler = async (req, _ctx) => {
9:  const secret = process.env['RAZORPAY_WEBHOOK_SECRET'];
10:  if (!secret) return { status: 500, jsonBody: { code: 'CONFIGURATION_ERROR' } };
11:
12:  const signature = req.headers.get('x-razorpay-signature') ?? '';
13:
14:  const rawBody = await req.text();
15:
16:  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
17:  if (expected !== signature) {
18:    return { status: 400, jsonBody: { code: 'SIGNATURE_INVALID' } };
19:  }
20:
21:  let parsed;
22:  try {
23:    const json: unknown = JSON.parse(rawBody);
24:    const result = RazorpayWebhookPayloadSchema.safeParse(json);
25:    if (!result.success) {
26:      return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: result.error.issues } };
27:    }
28:    parsed = result.data;
29:  } catch {
30:    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
31:  }
32:
33:  if (parsed.event !== 'payment.captured') {
34:    return { status: 200, jsonBody: { received: true } };
35:  }
36:
37:  const orderId = parsed.payload.payment.entity.order_id;
38:  const paymentId = parsed.payload.payment.entity.id;
39:
40:  const booking = await bookingRepo.getByPaymentOrderId(orderId);
41:  if (!booking) {
42:    return { status: 200, jsonBody: { received: true } };
43:  }
44:
45:  if (booking.status === 'PAID') {
46:    return { status: 200, jsonBody: { received: true } };
47:  }
48:
49:  const updated = await bookingRepo.markPaid(booking.id, paymentId);
50:  if (!updated) {
51:    return { status: 200, jsonBody: { received: true } };
52:  }
53:
54:  dispatcherService.triggerDispatch(booking.id).catch(() => {
55:    // fire-and-forget — dispatch failure does not fail the webhook ack
56:  });
57:
58:  return { status: 200, jsonBody: { received: true } };
59:};
60:
61:export async function reconcileStaleBookingsHandler(
62:  _myTimer: Timer,
63:  context: InvocationContext,
64:): Promise<void> {
65:  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
66:  const stale = await bookingRepo.getStaleSearching(cutoff);
67:  for (const booking of stale) {
68:    context.log(`STALE_BOOKING bookingId=${booking.id} createdAt=${booking.createdAt}`);
69:  }
70:}
71:
72:app.http('razorpayWebhook', {
73:  route: 'v1/webhooks/razorpay',
74:  methods: ['POST'],
75:  handler: razorpayWebhookHandler,
76:});
77:
78:app.timer('reconcileStaleBookings', {
79:  schedule: '0 0 2 * * *',
80:  handler: reconcileStaleBookingsHandler,
81:});

2026-04-20T23:43:28.430849Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "triggerDispatch|SEARCHING" api/tests api/src | sort'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "triggerDispatch|SEARCHING" api/tests api/src | sort' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "triggerDispatch|SEARCHING" api/tests api/src | sort'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "triggerDispatch|SEARCHING" api/tests api/src' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 168ms:
api/src\functions\webhooks.ts:54:  dispatcherService.triggerDispatch(booking.id).catch(() => {
api/tests\webhooks\razorpay-webhook.test.ts:16:  dispatcherService: { triggerDispatch: vi.fn().mockResolvedValue(undefined) },
api/tests\webhooks\razorpay-webhook.test.ts:71:      status: 'SEARCHING',
api/tests\webhooks\razorpay-webhook.test.ts:85:    expect(vi.mocked(dispatcherService.triggerDispatch)).toHaveBeenCalledWith('bk-1');
api/tests\webhooks\razorpay-webhook.test.ts:110:  it('logs STALE_BOOKING for old SEARCHING bookings', async () => {
api/src\services\dispatcher.service.ts:2:  triggerDispatch(bookingId: string): Promise<void> {
api/tests\bookings\confirm.test.ts:16:    confirmPayment: vi.fn().mockResolvedValue({ id: 'bk-1', status: 'SEARCHING' }),
api/tests\bookings\confirm.test.ts:39:  it('returns 200 with SEARCHING status on valid signature', async () => {
api/tests\bookings\confirm.test.ts:45:    expect((res.jsonBody as { status: string }).status).toBe('SEARCHING');
api/tests\services\dispatcher.service.test.ts:15:  it('triggerDispatch logs the correct message', async () => {
api/tests\services\dispatcher.service.test.ts:16:    await dispatcherService.triggerDispatch('bk-123');
api/tests\services\dispatcher.service.test.ts:22:  it('triggerDispatch returns void without throwing', async () => {
api/tests\services\dispatcher.service.test.ts:23:    await expect(dispatcherService.triggerDispatch('bk-456')).resolves.toBeUndefined();
api/src\cosmos\booking-repository.ts:38:    const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, paymentSignature };
api/src\cosmos\booking-repository.ts:55:    if (!existing || (existing.status !== 'SEARCHING' && existing.status !== 'PENDING_PAYMENT')) return null;
api/src\cosmos\booking-repository.ts:63:      query: "SELECT * FROM c WHERE c.status = 'SEARCHING' AND c.createdAt < @cutoff",
api/tests\cosmos\booking-repository-markPaid.test.ts:29:  status: 'SEARCHING',
api/tests\cosmos\booking-repository-markPaid.test.ts:76:  it('transitions SEARCHING → PAID and writes paymentId', async () => {
api/tests\cosmos\booking-repository-markPaid.test.ts:77:    const searchingDoc: BookingDoc = { ...baseDoc, status: 'SEARCHING' };
api/tests\cosmos\booking-repository-getStaleSearching.test.ts:28:  status: 'SEARCHING',
api/tests\cosmos\booking-repository-getStaleSearching.test.ts:51:    expect(queryArg.query).toContain("c.status = 'SEARCHING'");
api/src\schemas\booking.ts:4:  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE',
api/tests\schemas\booking.test.ts:8:  status: 'SEARCHING', paymentOrderId: 'order_xyz',
api/tests\schemas\order.test.ts:8:    ['SEARCHING','ASSIGNED','EN_ROUTE','REACHED','IN_PROGRESS','COMPLETED','CANCELLED','PAID']
api/tests\schemas\order.test.ts:53:      status: 'SEARCHING', city: 'Mysuru',
api/src\schemas\order.ts:7:  'SEARCHING', 'ASSIGNED', 'EN_ROUTE', 'REACHED',

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/tests/bookings/confirm.test.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 168ms:
import { describe, it, expect, vi } from 'vitest';
import { HttpRequest, type HttpResponseInit } from '@azure/functions';

vi.stubEnv('RAZORPAY_KEY_SECRET', 'rzp_secret');

vi.mock('../../src/middleware/requireCustomer.js', () => ({
  requireCustomer: (handler: (req: HttpRequest, ctx: unknown, claims: { customerId: string }) => Promise<unknown>) =>
    (req: HttpRequest, ctx: unknown) => handler(req, ctx, { customerId: 'cust-1' }),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getById: vi.fn().mockResolvedValue({
      id: 'bk-1', customerId: 'cust-1', status: 'PENDING_PAYMENT', paymentOrderId: 'order_1',
    }),
    confirmPayment: vi.fn().mockResolvedValue({ id: 'bk-1', status: 'SEARCHING' }),
    createPending: vi.fn(),
  },
}));

vi.mock('../../src/services/razorpay.service.js', () => ({
  createRazorpayOrder: vi.fn(),
  verifyPaymentSignature: vi.fn().mockReturnValue(true),
}));

import { confirmBookingHandler } from '../../src/functions/bookings.js';

function confirmReq(id: string, body: unknown) {
  const req = new HttpRequest({
    url: `http://localhost/api/v1/bookings/${id}/confirm`, method: 'POST',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json' },
  });
  Object.assign(req, { params: { id } });
  return req;
}

describe('POST /v1/bookings/:id/confirm', () => {
  it('returns 200 with SEARCHING status on valid signature', async () => {
    const res = await confirmBookingHandler(
      confirmReq('bk-1', { razorpayPaymentId: 'pay_1', razorpayOrderId: 'order_1', razorpaySignature: 'sig' }),
      {} as never,
    ) as HttpResponseInit;
    expect(res.status).toBe(200);
    expect((res.jsonBody as { status: string }).status).toBe('SEARCHING');
  });

  it('returns 400 on invalid signature', async () => {
    const { verifyPaymentSignature } = await import('../../src/services/razorpay.service.js');
    (verifyPaymentSignature as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);
    const res = await confirmBookingHandler(
      confirmReq('bk-1', { razorpayPaymentId: 'p1', razorpayOrderId: 'o1', razorpaySignature: 'bad' }),
      {} as never,
    ) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('SIGNATURE_INVALID');
  });

  it('returns 404 when booking not found', async () => {
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const res = await confirmBookingHandler(
      confirmReq('missing', { razorpayPaymentId: 'p1', razorpayOrderId: 'o1', razorpaySignature: 'sig' }),
      {} as never,
    ) as HttpResponseInit;
    expect(res.status).toBe(404);
  });

  it('returns 403 when customerId does not match booking', async () => {
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'bk-1', customerId: 'other-customer', status: 'PENDING_PAYMENT' });
    const res = await confirmBookingHandler(
      confirmReq('bk-1', { razorpayPaymentId: 'p1', razorpayOrderId: 'o1', razorpaySignature: 'sig' }),
      {} as never,
    ) as HttpResponseInit;
    expect(res.status).toBe(403);
  });
});

codex
The new webhook/reconciliation flow introduces a state-machine regression for webhook-first payments and also makes dispatch unreliable by running it outside the request lifetime. The stale-search reconciliation additionally uses the wrong timestamp, so the patch is not safe as-is.

Full review comments:

- [P1] Keep webhook-first payments from bypassing the SEARCHING state — C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\cosmos\booking-repository.ts:53-57
  If the Razorpay webhook arrives before the client calls `/bookings/{id}/confirm`, `markPaid()` now converts `PENDING_PAYMENT` directly to `PAID`, and `confirmPayment()` later short-circuits on `PAID` without ever moving the booking to `SEARCHING`. In that race, the booking skips the normal post-payment state entirely, so any downstream logic keyed off `SEARCHING` (including the new stale-search reconciliation and existing booking-confirm tests/contracts) will never see it.

- [P1] Await dispatch before acknowledging a captured-payment webhook — C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\webhooks.ts:54-58
  `triggerDispatch()` is fired and forgotten after the 200 response path is determined. On Azure Functions, work scheduled after the handler returns is not guaranteed to complete, so a valid `payment.captured` event can be acknowledged while the dispatch side effect is dropped during shutdown/recycle. That leaves paid bookings with no dispatch attempt and no retry path.

- [P2] Reconcile stale searches using search start time, not booking creation — C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\cosmos\booking-repository.ts:61-64
  The timer now flags stale `SEARCHING` bookings by comparing `createdAt` to the cutoff, but `createdAt` is set when the booking is first created in `PENDING_PAYMENT`. Any booking that sits unpaid for a while and only later enters `SEARCHING` will be treated as stale immediately, even though it has not actually been searching for 24 hours.
The new webhook/reconciliation flow introduces a state-machine regression for webhook-first payments and also makes dispatch unreliable by running it outside the request lifetime. The stale-search reconciliation additionally uses the wrong timestamp, so the patch is not safe as-is.

Full review comments:

- [P1] Keep webhook-first payments from bypassing the SEARCHING state — C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\cosmos\booking-repository.ts:53-57
  If the Razorpay webhook arrives before the client calls `/bookings/{id}/confirm`, `markPaid()` now converts `PENDING_PAYMENT` directly to `PAID`, and `confirmPayment()` later short-circuits on `PAID` without ever moving the booking to `SEARCHING`. In that race, the booking skips the normal post-payment state entirely, so any downstream logic keyed off `SEARCHING` (including the new stale-search reconciliation and existing booking-confirm tests/contracts) will never see it.

- [P1] Await dispatch before acknowledging a captured-payment webhook — C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\webhooks.ts:54-58
  `triggerDispatch()` is fired and forgotten after the 200 response path is determined. On Azure Functions, work scheduled after the handler returns is not guaranteed to complete, so a valid `payment.captured` event can be acknowledged while the dispatch side effect is dropped during shutdown/recycle. That leaves paid bookings with no dispatch attempt and no retry path.

- [P2] Reconcile stale searches using search start time, not booking creation — C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\cosmos\booking-repository.ts:61-64
  The timer now flags stale `SEARCHING` bookings by comparing `createdAt` to the cutoff, but `createdAt` is set when the booking is first created in `PENDING_PAYMENT`. Any booking that sits unpaid for a while and only later enters `SEARCHING` will be treated as stale immediately, even though it has not actually been searching for 24 hours.
