OpenAI Codex v0.121.0 (research preview)
--------
workdir: C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
model: gpt-5.4
provider: openai
approval: never
sandbox: read-only
reasoning effort: none
reasoning summaries: none
session id: 019dad43-3915-74e1-a642-f68e585daa2e
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
index 2e44e28..ecac6a5 100644
--- a/api/src/cosmos/booking-repository.ts
+++ b/api/src/cosmos/booking-repository.ts
@@ -37,4 +37,30 @@ export const bookingRepo = {
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
index 0000000..b1e6206
--- /dev/null
+++ b/api/tests/cosmos/booking-repository-markPaid.test.ts
@@ -0,0 +1,100 @@
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/cosmos/booking-repository.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse api/src | Select-String -Pattern 'paymentOrderId|PENDING_PAYMENT|SEARCHING|PAID|dispatcherService|triggerDispatch|Razorpay'" in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 225ms:
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
    if (!existing || existing.status !== 'PENDING_PAYMENT') return null;
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

 succeeded in 283ms:
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

 succeeded in 442ms:

api\src\cosmos\booking-repository.ts:11:    paymentOrderId: string,
api\src\cosmos\booking-repository.ts:16:      status: 'PENDING_PAYMENT', paymentOrderId,
api\src\cosmos\booking-repository.ts:35:    if (!existing || existing.status !== 'PENDING_PAYMENT') return null;
api\src\cosmos\booking-repository.ts:36:    const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, 
paymentSignature };
api\src\cosmos\booking-repository.ts:41:  async getByPaymentOrderId(orderId: string): Promise<BookingDoc | null> {
api\src\cosmos\booking-repository.ts:44:        query: 'SELECT * FROM c WHERE c.paymentOrderId = @orderId',
api\src\cosmos\booking-repository.ts:51:  async markPaid(id: string, paymentId: string): Promise<BookingDoc | null> {
api\src\cosmos\booking-repository.ts:53:    if (!existing || (existing.status !== 'SEARCHING' && existing.status !== 
'PENDING_PAYMENT')) return null;
api\src\cosmos\booking-repository.ts:54:    const updated: BookingDoc = { ...existing, status: 'PAID', paymentId };
api\src\cosmos\booking-repository.ts:59:  async getStaleSearching(olderThanIso: string): Promise<BookingDoc[]> {
api\src\cosmos\booking-repository.ts:61:      query: "SELECT * FROM c WHERE c.status = 'SEARCHING' AND c.createdAt < 
@cutoff",
api\src\cosmos\finance-repository.ts:19:  razorpayTransferId: string;
api\src\cosmos\finance-repository.ts:29:  razorpayTransferId?: string;
api\src\cosmos\finance-repository.ts:139:  razorpayLinkedAccountId?: string;
api\src\cosmos\finance-repository.ts:148:  return resource?.razorpayLinkedAccountId ?? null;
api\src\functions\bookings.ts:6:import { createRazorpayOrder, verifyPaymentSignature } from 
'../services/razorpay.service.js';
api\src\functions\bookings.ts:17:  const order = await createRazorpayOrder({
api\src\functions\bookings.ts:24:  return { status: 201, jsonBody: { bookingId: booking.id, razorpayOrderId: order.id, 
amount: order.amount } };
api\src\functions\bookings.ts:38:    razorpayOrderId: parsed.data.razorpayOrderId,
api\src\functions\bookings.ts:39:    razorpayPaymentId: parsed.data.razorpayPaymentId,
api\src\functions\bookings.ts:40:    razorpaySignature: parsed.data.razorpaySignature,
api\src\functions\bookings.ts:43:  const confirmed = await bookingRepo.confirmPayment(id, 
parsed.data.razorpayPaymentId, parsed.data.razorpaySignature);
api\src\functions\webhooks.ts:4:import { RazorpayWebhookPayloadSchema } from '../schemas/webhook.js';
api\src\functions\webhooks.ts:6:import { dispatcherService } from '../services/dispatcher.service.js';
api\src\functions\webhooks.ts:8:export const razorpayWebhookHandler: HttpHandler = async (req, _ctx) => {
api\src\functions\webhooks.ts:9:  const secret = process.env['RAZORPAY_WEBHOOK_SECRET'];
api\src\functions\webhooks.ts:12:  const signature = req.headers.get('x-razorpay-signature') ?? '';
api\src\functions\webhooks.ts:24:    const result = RazorpayWebhookPayloadSchema.safeParse(json);
api\src\functions\webhooks.ts:40:  const booking = await bookingRepo.getByPaymentOrderId(orderId);
api\src\functions\webhooks.ts:45:  if (booking.status === 'PAID') {
api\src\functions\webhooks.ts:49:  const updated = await bookingRepo.markPaid(booking.id, paymentId);
api\src\functions\webhooks.ts:54:  dispatcherService.triggerDispatch(booking.id).catch(() => {
api\src\functions\webhooks.ts:66:  const stale = await bookingRepo.getStaleSearching(cutoff);
api\src\functions\webhooks.ts:72:app.http('razorpayWebhook', {
api\src\functions\webhooks.ts:73:  route: 'v1/webhooks/razorpay',
api\src\functions\webhooks.ts:75:  handler: razorpayWebhookHandler,
api\src\functions\admin\finance\approve-payouts.ts:9:import { RazorpayRouteService } from 
'../../../services/razorpayRoute.service.js';
api\src\functions\admin\finance\approve-payouts.ts:33:  const razorpay = new RazorpayRouteService();
api\src\functions\admin\finance\approve-payouts.ts:54:      errors.push({ technicianId: entry.technicianId, reason: 
'no linked Razorpay account' });
api\src\functions\admin\finance\approve-payouts.ts:59:      const { transferId } = await razorpay.transfer({
api\src\functions\admin\finance\approve-payouts.ts:70:        razorpayTransferId: transferId,
api\src\schemas\booking.ts:4:  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE',
api\src\schemas\booking.ts:5:  'REACHED', 'IN_PROGRESS', 'COMPLETED', 'PAID', 'CLOSED',
api\src\schemas\booking.ts:21:  paymentOrderId: z.string(),
api\src\schemas\booking.ts:38:  razorpayPaymentId: z.string().min(1),
api\src\schemas\booking.ts:39:  razorpayOrderId: z.string().min(1),
api\src\schemas\booking.ts:40:  razorpaySignature: z.string().min(1),
api\src\schemas\order.ts:7:  'SEARCHING', 'ASSIGNED', 'EN_ROUTE', 'REACHED',
api\src\schemas\order.ts:8:  'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PAID',
api\src\schemas\webhook.ts:4: * Razorpay webhook payload schema.
api\src\schemas\webhook.ts:16: *         order_id: string,   // maps to booking.paymentOrderId
api\src\schemas\webhook.ts:26:export const RazorpayWebhookPayloadSchema = z.object({
api\src\schemas\webhook.ts:40:export type RazorpayWebhookPayload = z.infer<typeof RazorpayWebhookPayloadSchema>;
api\src\services\dispatcher.service.ts:1:export const dispatcherService = {
api\src\services\dispatcher.service.ts:2:  triggerDispatch(bookingId: string): Promise<void> {
api\src\services\razorpay.service.ts:1:import Razorpay from 'razorpay';
api\src\services\razorpay.service.ts:4:let _rzp: Razorpay | null = null;
api\src\services\razorpay.service.ts:6:function getRazorpay(): Razorpay {
api\src\services\razorpay.service.ts:8:    const keyId = process.env.RAZORPAY_KEY_ID;
api\src\services\razorpay.service.ts:9:    const keySecret = process.env.RAZORPAY_KEY_SECRET;
api\src\services\razorpay.service.ts:10:    if (!keyId || !keySecret) throw new Error('Missing RAZORPAY_KEY_ID or 
RAZORPAY_KEY_SECRET');
api\src\services\razorpay.service.ts:11:    _rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
api\src\services\razorpay.service.ts:16:export async function createRazorpayOrder(opts: { amount: number; currency: 
string; receipt: string }) {
api\src\services\razorpay.service.ts:17:  const order = await getRazorpay().orders.create(opts);
api\src\services\razorpay.service.ts:22:  razorpayOrderId: string;
api\src\services\razorpay.service.ts:23:  razorpayPaymentId: string;
api\src\services\razorpay.service.ts:24:  razorpaySignature: string;
api\src\services\razorpay.service.ts:26:  const secret = process.env.RAZORPAY_KEY_SECRET;
api\src\services\razorpay.service.ts:27:  if (!secret) throw new Error('Missing RAZORPAY_KEY_SECRET');
api\src\services\razorpay.service.ts:29:    .update(`${opts.razorpayOrderId}|${opts.razorpayPaymentId}`)
api\src\services\razorpay.service.ts:31:  return expected === opts.razorpaySignature;
api\src\services\razorpayRoute.service.ts:1:import Razorpay from 'razorpay';
api\src\services\razorpayRoute.service.ts:3:export interface RazorpayTransferInput {
api\src\services\razorpayRoute.service.ts:10:export interface RazorpayTransferResult {
api\src\services\razorpayRoute.service.ts:14:export interface IRazorpayRouteService {
api\src\services\razorpayRoute.service.ts:15:  transfer(input: RazorpayTransferInput): Promise<RazorpayTransferResult>;
api\src\services\razorpayRoute.service.ts:18:export class RazorpayRouteService implements IRazorpayRouteService {
api\src\services\razorpayRoute.service.ts:19:  private readonly client: Razorpay;
api\src\services\razorpayRoute.service.ts:22:    const keyId = process.env['RAZORPAY_KEY_ID'];
api\src\services\razorpayRoute.service.ts:23:    const keySecret = process.env['RAZORPAY_KEY_SECRET'];
api\src\services\razorpayRoute.service.ts:24:    if (!keyId) throw new Error('Missing env var: RAZORPAY_KEY_ID');
api\src\services\razorpayRoute.service.ts:25:    if (!keySecret) throw new Error('Missing env var: 
RAZORPAY_KEY_SECRET');
api\src\services\razorpayRoute.service.ts:26:    this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
api\src\services\razorpayRoute.service.ts:29:  async transfer(input: RazorpayTransferInput): 
Promise<RazorpayTransferResult> {
api\src\services\razorpayRoute.service.ts:36:        ? { headers: { 'X-Razorpay-Idempotency-Key': input.idempotencyKey 
} }



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/bookings.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 169ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse api/src | Select-String -Pattern \"status: 'PAID'|=== 'PAID'|"'!== '"'PAID'|BOOKING_ALREADY_PROCESSED|SEARCHING\"" in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/schemas/order.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 176ms:
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

 succeeded in 242ms:

api\src\cosmos\booking-repository.ts:36:    const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, 
paymentSignature };
api\src\cosmos\booking-repository.ts:53:    if (!existing || (existing.status !== 'SEARCHING' && existing.status !== 
'PENDING_PAYMENT')) return null;
api\src\cosmos\booking-repository.ts:54:    const updated: BookingDoc = { ...existing, status: 'PAID', paymentId };
api\src\cosmos\booking-repository.ts:59:  async getStaleSearching(olderThanIso: string): Promise<BookingDoc[]> {
api\src\cosmos\booking-repository.ts:61:      query: "SELECT * FROM c WHERE c.status = 'SEARCHING' AND c.createdAt < 
@cutoff",
api\src\functions\bookings.ts:44:  if (!confirmed) return { status: 409, jsonBody: { code: 'BOOKING_ALREADY_PROCESSED' 
} };
api\src\functions\webhooks.ts:45:  if (booking.status === 'PAID') {
api\src\functions\webhooks.ts:66:  const stale = await bookingRepo.getStaleSearching(cutoff);
api\src\schemas\booking.ts:4:  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE',
api\src\schemas\order.ts:7:  'SEARCHING', 'ASSIGNED', 'EN_ROUTE', 'REACHED',



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Recurse api/src/functions | Select-Object FullName' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/package.json' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem api -Filter host.json -Recurse | Select-Object -ExpandProperty FullName' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 365ms:
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

 succeeded in 425ms:

FullName                                                                                                      
--------                                                                                                      
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



 succeeded in 854ms:
C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\host.json

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse api/src | Select-String -Pattern \"ASSIGNED|EN_ROUTE|IN_PROGRESS|COMPLETED|UNFULFILLED|CUSTOMER_CANCELLED|getStaleSearching|SEARCHING'\"" in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 248ms:

api\src\cosmos\booking-repository.ts:36:    const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, 
paymentSignature };
api\src\cosmos\booking-repository.ts:53:    if (!existing || (existing.status !== 'SEARCHING' && existing.status !== 
'PENDING_PAYMENT')) return null;
api\src\cosmos\booking-repository.ts:59:  async getStaleSearching(olderThanIso: string): Promise<BookingDoc[]> {
api\src\cosmos\booking-repository.ts:61:      query: "SELECT * FROM c WHERE c.status = 'SEARCHING' AND c.createdAt < 
@cutoff",
api\src\cosmos\finance-repository.ts:5:interface CompletedBooking {
api\src\cosmos\finance-repository.ts:11:  completedAt: string;
api\src\cosmos\finance-repository.ts:33:async function queryCompletedBookings(from: string, to: string): 
Promise<CompletedBooking[]> {
api\src\cosmos\finance-repository.ts:39:        query: `SELECT c.id, c.technicianId, c.technicianName, c.amount, 
c.commissionBps, c.completedAt
api\src\cosmos\finance-repository.ts:41:                WHERE c.status = 'COMPLETED'
api\src\cosmos\finance-repository.ts:42:                  AND c.completedAt >= @from
api\src\cosmos\finance-repository.ts:43:                  AND c.completedAt <= @toEnd`,
api\src\cosmos\finance-repository.ts:51:  return (resources ?? []) as CompletedBooking[];
api\src\cosmos\finance-repository.ts:55:  const bookings = await queryCompletedBookings(from, to);
api\src\cosmos\finance-repository.ts:59:    const date = b.completedAt.slice(0, 10);
api\src\cosmos\finance-repository.ts:80:  const bookings = await queryCompletedBookings(weekStart, weekEnd);
api\src\cosmos\finance-repository.ts:101:    entries.push({ technicianId, technicianName: name, completedJobsThisWeek: 
jobs, grossEarnings: gross, commissionDeducted: commission, netPayable });
api\src\cosmos\seeds\catalogue.ts:66:    photoStages: [{ id: 'before-wall', label: 'Wall before drilling', required: 
true }, { id: 'after-install', label: 'Completed installation', required: true }],
api\src\cosmos\seeds\catalogue.ts:231:    photoStages: [{ id: 'before-wall', label: 'Wall before wiring', required: 
false }, { id: 'completed-point', label: 'New point completed', required: true }],
api\src\functions\webhooks.ts:66:  const stale = await bookingRepo.getStaleSearching(cutoff);
api\src\functions\admin\dashboard\summary.ts:30:          query: 'SELECT VALUE SUM(c.amount) FROM c WHERE c.status = 
"completed" AND c.createdAt >= @today',
api\src\schemas\booking.ts:4:  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE',
api\src\schemas\booking.ts:5:  'REACHED', 'IN_PROGRESS', 'COMPLETED', 'PAID', 'CLOSED',
api\src\schemas\booking.ts:6:  'UNFULFILLED', 'CUSTOMER_CANCELLED',
api\src\schemas\dashboard.ts:17:    kind: z.enum(['booking', 'assigned', 'completed', 'alert', 'payout', 'complaint']),
api\src\schemas\finance.ts:41:  completedJobsThisWeek: z.number().int().nonnegative(),
api\src\schemas\order.ts:7:  'SEARCHING', 'ASSIGNED', 'EN_ROUTE', 'REACHED',
api\src\schemas\order.ts:8:  'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PAID',



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse api/src | Select-String -Pattern 'paymentSignature'" in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 254ms:

api\src\cosmos\booking-repository.ts:17:      paymentId: null, paymentSignature: null,
api\src\cosmos\booking-repository.ts:32:    paymentSignature: string,
api\src\cosmos\booking-repository.ts:36:    const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, 
paymentSignature };
api\src\functions\bookings.ts:6:import { createRazorpayOrder, verifyPaymentSignature } from 
'../services/razorpay.service.js';
api\src\functions\bookings.ts:37:  if (!verifyPaymentSignature({
api\src\schemas\booking.ts:23:  paymentSignature: z.string().nullable(),
api\src\services\razorpay.service.ts:21:export function verifyPaymentSignature(opts: {



codex
The new webhook flow can cause successful payments to be reported as booking-processing failures when the webhook arrives before the client confirmation call. That race makes the patch behaviorally incorrect for a real production scenario.

Review comment:

- [P1] Avoid moving webhook-first payments to a terminal booking state — C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\cosmos\booking-repository.ts:52-54
  If Razorpay sends `payment.captured` before the app calls `/v1/bookings/{id}/confirm`, this change moves the booking from `PENDING_PAYMENT`/`SEARCHING` straight to `PAID`. The existing confirm flow only succeeds from `PENDING_PAYMENT`, so the customer's later confirm request will now return `409 BOOKING_ALREADY_PROCESSED` even though the payment was valid. Since this PR explicitly handles that race, this false-error path is expected in production rather than theoretical.
The new webhook flow can cause successful payments to be reported as booking-processing failures when the webhook arrives before the client confirmation call. That race makes the patch behaviorally incorrect for a real production scenario.

Review comment:

- [P1] Avoid moving webhook-first payments to a terminal booking state — C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\cosmos\booking-repository.ts:52-54
  If Razorpay sends `payment.captured` before the app calls `/v1/bookings/{id}/confirm`, this change moves the booking from `PENDING_PAYMENT`/`SEARCHING` straight to `PAID`. The existing confirm flow only succeeds from `PENDING_PAYMENT`, so the customer's later confirm request will now return `409 BOOKING_ALREADY_PROCESSED` even though the payment was valid. Since this PR explicitly handles that race, this false-error path is expected in production rather than theoretical.
