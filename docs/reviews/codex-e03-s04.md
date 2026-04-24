OpenAI Codex v0.121.0 (research preview)
--------
workdir: C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
model: gpt-5.4
provider: openai
approval: never
sandbox: read-only
reasoning effort: none
reasoning summaries: none
session id: 019dad3e-219d-7a60-b6b6-98a9fd439e53
--------
user
changes against 'main'
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff ae8bc4977db3473758186f3b86d09542af2874f6' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 265ms:
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
index 2e44e28..620dbbf 100644
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
+    if (!existing || existing.status !== 'SEARCHING') return null;
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
index 0000000..fe6292a
--- /dev/null
+++ b/api/src/functions/webhooks.ts
@@ -0,0 +1,79 @@
+import { createHmac } from 'node:crypto';
+import type { HttpHandler, Timer } from '@azure/functions';
+import { type InvocationContext, app } from '@azure/functions';
+import { RazorpayWebhookPayloadSchema } from '../schemas/webhook.js';
+import { bookingRepo } from '../cosmos/booking-repository.js';
+import { dispatcherService } from '../services/dispatcher.service.js';
+
+export const razorpayWebhookHandler: HttpHandler = async (req, _ctx) => {
+  const secret = process.env['RAZORPAY_WEBHOOK_SECRET'] ?? '';
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
index 0000000..987d85d
--- /dev/null
+++ b/api/tests/cosmos/booking-repository-markPaid.test.ts
@@ -0,0 +1,85 @@
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
+  it('returns null when status is not SEARCHING (e.g. PENDING_PAYMENT)', async () => {
+    const pendingDoc: BookingDoc = { ...baseDoc, status: 'PENDING_PAYMENT' };
+    mockRead.mockResolvedValue({ resource: pendingDoc });
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
+    const replaceArg: BookingDoc = mockReplace.mock.calls[0]![0]!;
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
index 0000000..3396319
--- /dev/null
+++ b/api/tests/webhooks/razorpay-webhook.test.ts
@@ -0,0 +1,114 @@
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Recurse api/src | Select-String -Pattern "PENDING_PAYMENT|SEARCHING|paymentOrderId|markPaid|verify|Razorpay|razorpay"' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 392ms:

api\src\cosmos\booking-repository.ts:11:    paymentOrderId: string,
api\src\cosmos\booking-repository.ts:16:      status: 'PENDING_PAYMENT', paymentOrderId,
api\src\cosmos\booking-repository.ts:35:    if (!existing || existing.status !== 'PENDING_PAYMENT') return null;
api\src\cosmos\booking-repository.ts:36:    const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, 
paymentSignature };
api\src\cosmos\booking-repository.ts:41:  async getByPaymentOrderId(orderId: string): Promise<BookingDoc | null> {
api\src\cosmos\booking-repository.ts:44:        query: 'SELECT * FROM c WHERE c.paymentOrderId = @orderId',
api\src\cosmos\booking-repository.ts:51:  async markPaid(id: string, paymentId: string): Promise<BookingDoc | null> {
api\src\cosmos\booking-repository.ts:53:    if (!existing || existing.status !== 'SEARCHING') return null;
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
api\src\functions\bookings.ts:37:  if (!verifyPaymentSignature({
api\src\functions\bookings.ts:38:    razorpayOrderId: parsed.data.razorpayOrderId,
api\src\functions\bookings.ts:39:    razorpayPaymentId: parsed.data.razorpayPaymentId,
api\src\functions\bookings.ts:40:    razorpaySignature: parsed.data.razorpaySignature,
api\src\functions\bookings.ts:43:  const confirmed = await bookingRepo.confirmPayment(id, 
parsed.data.razorpayPaymentId, parsed.data.razorpaySignature);
api\src\functions\webhooks.ts:4:import { RazorpayWebhookPayloadSchema } from '../schemas/webhook.js';
api\src\functions\webhooks.ts:8:export const razorpayWebhookHandler: HttpHandler = async (req, _ctx) => {
api\src\functions\webhooks.ts:9:  const secret = process.env['RAZORPAY_WEBHOOK_SECRET'] ?? '';
api\src\functions\webhooks.ts:10:  const signature = req.headers.get('x-razorpay-signature') ?? '';
api\src\functions\webhooks.ts:22:    const result = RazorpayWebhookPayloadSchema.safeParse(json);
api\src\functions\webhooks.ts:38:  const booking = await bookingRepo.getByPaymentOrderId(orderId);
api\src\functions\webhooks.ts:47:  const updated = await bookingRepo.markPaid(booking.id, paymentId);
api\src\functions\webhooks.ts:64:  const stale = await bookingRepo.getStaleSearching(cutoff);
api\src\functions\webhooks.ts:70:app.http('razorpayWebhook', {
api\src\functions\webhooks.ts:71:  route: 'v1/webhooks/razorpay',
api\src\functions\webhooks.ts:73:  handler: razorpayWebhookHandler,
api\src\functions\admin\auth\login.ts:5:import { verifyFirebaseIdToken } from '../../../services/firebaseAdmin.js';
api\src\functions\admin\auth\login.ts:7:import { decryptSecret, verifyToken } from '../../../services/totp.service.js';
api\src\functions\admin\auth\login.ts:42:    const decoded = await verifyFirebaseIdToken(idToken);
api\src\functions\admin\auth\login.ts:61:  if (!verifyToken(totpCode, secret)) {
api\src\functions\admin\auth\logout.ts:5:import { verifyAccessToken } from '../../../services/jwt.service.js';
api\src\functions\admin\auth\logout.ts:17:    const payload = await verifyAccessToken(token);
api\src\functions\admin\auth\setup-totp.ts:4:import { SetupTotpVerifySchema } from '../../../schemas/admin-auth.js';
api\src\functions\admin\auth\setup-totp.ts:5:import { verifySetupToken, signAccessToken } from 
'../../../services/jwt.service.js';
api\src\functions\admin\auth\setup-totp.ts:12:  verifyToken,
api\src\functions\admin\auth\setup-totp.ts:21:  return token ? verifySetupToken(token) : null;
api\src\functions\admin\auth\setup-totp.ts:67:  const parsed = SetupTotpVerifySchema.safeParse(raw);
api\src\functions\admin\auth\setup-totp.ts:84:  if (!verifyToken(parsed.data.totpCode, secret)) {
api\src\functions\admin\finance\approve-payouts.ts:9:import { RazorpayRouteService } from 
'../../../services/razorpayRoute.service.js';
api\src\functions\admin\finance\approve-payouts.ts:33:  const razorpay = new RazorpayRouteService();
api\src\functions\admin\finance\approve-payouts.ts:54:      errors.push({ technicianId: entry.technicianId, reason: 
'no linked Razorpay account' });
api\src\functions\admin\finance\approve-payouts.ts:59:      const { transferId } = await razorpay.transfer({
api\src\functions\admin\finance\approve-payouts.ts:70:        razorpayTransferId: transferId,
api\src\functions\kyc\get-kyc-status.ts:2:import { verifyTechnicianToken } from 
'../../middleware/verifyTechnicianToken.js';
api\src\functions\kyc\get-kyc-status.ts:10:    await verifyTechnicianToken(req);
api\src\functions\kyc\submit-aadhaar.ts:2:import { verifyTechnicianToken } from 
'../../middleware/verifyTechnicianToken.js';
api\src\functions\kyc\submit-aadhaar.ts:12:    await verifyTechnicianToken(req);
api\src\functions\kyc\submit-pan-ocr.ts:4:import { verifyTechnicianToken } from 
'../../middleware/verifyTechnicianToken.js';
api\src\functions\kyc\submit-pan-ocr.ts:12:    await verifyTechnicianToken(req);
api\src\middleware\requireAdmin.ts:3:import { verifyAccessToken } from '../services/jwt.service.js';
api\src\middleware\requireAdmin.ts:20:      const payload = await verifyAccessToken(token);
api\src\middleware\requireCustomer.ts:2:import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';
api\src\middleware\requireCustomer.ts:16:      const decoded = await verifyFirebaseIdToken(auth.slice(7));
api\src\middleware\verifyTechnicianToken.ts:4:export async function verifyTechnicianToken(
api\src\middleware\verifyTechnicianToken.ts:10:  const decoded = await getAuth().verifyIdToken(token);
api\src\openapi\admin-auth.ts:3:import { LoginRequestSchema, SetupTotpVerifySchema } from '../schemas/admin-auth.js';
api\src\openapi\admin-auth.ts:8:const SetupTotpVerify = SetupTotpVerifySchema.openapi('AdminSetupTotpVerifyRequest');
api\src\openapi\admin-auth.ts:30:  request: { body: { content: { 'application/json': { schema: SetupTotpVerify } } } },
api\src\schemas\admin-auth.ts:9:export const SetupTotpVerifySchema = z.object({
api\src\schemas\admin-auth.ts:12:export type SetupTotpVerify = z.infer<typeof SetupTotpVerifySchema>;
api\src\schemas\booking.ts:4:  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE',
api\src\schemas\booking.ts:21:  paymentOrderId: z.string(),
api\src\schemas\booking.ts:38:  razorpayPaymentId: z.string().min(1),
api\src\schemas\booking.ts:39:  razorpayOrderId: z.string().min(1),
api\src\schemas\booking.ts:40:  razorpaySignature: z.string().min(1),
api\src\schemas\order.ts:7:  'SEARCHING', 'ASSIGNED', 'EN_ROUTE', 'REACHED',
api\src\schemas\webhook.ts:4: * Razorpay webhook payload schema.
api\src\schemas\webhook.ts:16: *         order_id: string,   // maps to booking.paymentOrderId
api\src\schemas\webhook.ts:26:export const RazorpayWebhookPayloadSchema = z.object({
api\src\schemas\webhook.ts:40:export type RazorpayWebhookPayload = z.infer<typeof RazorpayWebhookPayloadSchema>;
api\src\services\firebaseAdmin.ts:19:export async function verifyFirebaseIdToken(idToken: string): 
Promise<DecodedIdToken> {
api\src\services\firebaseAdmin.ts:20:  return getFirebaseAdmin().auth().verifyIdToken(idToken);
api\src\services\jwt.service.ts:1:import { SignJWT, jwtVerify } from 'jose';
api\src\services\jwt.service.ts:47:export async function verifyAccessToken(
api\src\services\jwt.service.ts:51:    const { payload } = await jwtVerify(token, jwtKey());
api\src\services\jwt.service.ts:59:export async function verifySetupToken(
api\src\services\jwt.service.ts:63:    const { payload } = await jwtVerify(token, jwtKey());
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
api\src\services\razorpay.service.ts:21:export function verifyPaymentSignature(opts: {
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
api\src\services\totp.service.ts:1:import { generateSecret as otpGenerateSecret, verifySync, generateURI } from 
'otplib';
api\src\services\totp.service.ts:45:export function verifyToken(token: string, secret: string): boolean {
api\src\services\totp.service.ts:47:    const result = verifySync({ token, secret, strategy: 'totp' });



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/cosmos/booking-repository.ts; Get-Content api/src/functions/bookings.ts; Get-Content api/src/schemas/booking.ts; Get-ChildItem api/src/functions | Select-Object Name' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 249ms:
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
    if (!existing || existing.status !== 'SEARCHING') return null;
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

Name               
----               
admin              
kyc                
bookings.ts        
catalogue-admin.ts 
catalogue-public.ts
health.ts          
webhooks.ts        



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content package.json -ErrorAction SilentlyContinue; Get-Content api/package.json; Get-Content api/tsconfig.json' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 184ms:
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

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/cosmos/client.ts; Get-ChildItem api/src/cosmos -Recurse | Select-String -Pattern "bookings|partition|createIfNotExists|container"' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 239ms:
import { CosmosClient, type Container } from '@azure/cosmos';

let _client: CosmosClient | null = null;

export function getCosmosClient(): CosmosClient {
  if (!_client) {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    if (!endpoint || !key) {
      throw new Error('Missing required env vars: COSMOS_ENDPOINT, COSMOS_KEY');
    }
    _client = new CosmosClient({ endpoint, key });
  }
  return _client;
}

export const DB_NAME = process.env.COSMOS_DATABASE ?? 'homeservices';

export function getCatalogueContainers(): { categories: Container; services: Container } {
  const db = getCosmosClient().database(DB_NAME);
  return {
    categories: db.container('service_categories'),
    services: db.container('services'),
  };
}

export function getBookingsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('bookings');
}

/** Inject a mock CosmosClient in tests. */
export function _setCosmosClientForTest(mock: CosmosClient): void {
  _client = mock;
}

api\src\cosmos\audit-log-repository.ts:6:const CONTAINER = 'audit_log';
api\src\cosmos\audit-log-repository.ts:9:  await 
getCosmosClient().database(DB_NAME).container(CONTAINER).items.create(entry);
api\src\cosmos\audit-log-repository.ts:48:    .container(CONTAINER)
api\src\cosmos\booking-repository.ts:2:import { getBookingsContainer } from './client.js';
api\src\cosmos\booking-repository.ts:20:    const { resource } = await 
getBookingsContainer().items.create<BookingDoc>(doc);
api\src\cosmos\booking-repository.ts:25:    const { resource } = await getBookingsContainer().item(id, 
id).read<BookingDoc>();
api\src\cosmos\booking-repository.ts:37:    const { resource } = await getBookingsContainer().item(id, 
id).replace<BookingDoc>(updated);
api\src\cosmos\booking-repository.ts:42:    const { resources } = await getBookingsContainer()
api\src\cosmos\booking-repository.ts:55:    const { resource } = await getBookingsContainer().item(id, 
id).replace<BookingDoc>(updated);
api\src\cosmos\booking-repository.ts:60:    const { resources } = await 
getBookingsContainer().items.query<BookingDoc>({
api\src\cosmos\catalogue-repository.ts:1:import { getCatalogueContainers } from './client.js';
api\src\cosmos\catalogue-repository.ts:10:  private get cats() { return getCatalogueContainers().categories; }
api\src\cosmos\catalogue-repository.ts:11:  private get svcs() { return getCatalogueContainers().services; }
api\src\cosmos\catalogue-repository.ts:77:  async getServiceByIdCrossPartition(id: string): Promise<Service | null> {
api\src\cosmos\catalogue-repository.ts:91:    const existing = await this.getServiceByIdCrossPartition(id);
api\src\cosmos\catalogue-repository.ts:99:    const existing = await this.getServiceByIdCrossPartition(id);
api\src\cosmos\client.ts:1:import { CosmosClient, type Container } from '@azure/cosmos';
api\src\cosmos\client.ts:19:export function getCatalogueContainers(): { categories: Container; services: Container } {
api\src\cosmos\client.ts:22:    categories: db.container('service_categories'),
api\src\cosmos\client.ts:23:    services: db.container('services'),
api\src\cosmos\client.ts:27:export function getBookingsContainer(): Container {
api\src\cosmos\client.ts:28:  return getCosmosClient().database(DB_NAME).container('bookings');
api\src\cosmos\finance-repository.ts:33:async function queryCompletedBookings(from: string, to: string): 
Promise<CompletedBooking[]> {
api\src\cosmos\finance-repository.ts:36:    .container('bookings')
api\src\cosmos\finance-repository.ts:55:  const bookings = await queryCompletedBookings(from, to);
api\src\cosmos\finance-repository.ts:58:  for (const b of bookings) {
api\src\cosmos\finance-repository.ts:80:  const bookings = await queryCompletedBookings(weekStart, weekEnd);
api\src\cosmos\finance-repository.ts:83:  for (const b of bookings) {
api\src\cosmos\finance-repository.ts:111:    .container('wallet_ledger')
api\src\cosmos\finance-repository.ts:128:    .container('wallet_ledger')
api\src\cosmos\finance-repository.ts:131:      partitionKey: entry.technicianId,
api\src\cosmos\finance-repository.ts:145:    .container('technicians')
api\src\cosmos\finance-repository.ts:162:    .container('payout_snapshots')
api\src\cosmos\finance-repository.ts:177:    .container('payout_snapshots')
api\src\cosmos\finance-repository.ts:180:      partitionKey: queue.weekStart,
api\src\cosmos\orders-repository.ts:5:function getContainer(client: CosmosClient) {
api\src\cosmos\orders-repository.ts:6:  return client.database(DB_NAME).container('bookings');
api\src\cosmos\orders-repository.ts:57:  const container = getContainer(client);
api\src\cosmos\orders-repository.ts:65:  const { resources: countResult } = await 
container.items.query(countQuery).fetchAll();
api\src\cosmos\orders-repository.ts:72:  const { resources } = await container.items.query(dataQuery).fetchAll();
api\src\cosmos\orders-repository.ts:86:  const container = getContainer(client);
api\src\cosmos\orders-repository.ts:87:  const { resources } = await container.items.query({
api\src\cosmos\technician-repository.ts:6:const CONTAINER = 'technicians';
api\src\cosmos\technician-repository.ts:20:  const container = client.database(DB_NAME).container(CONTAINER);
api\src\cosmos\technician-repository.ts:21:  const { resource } = await container.item(technicianId, 
technicianId).read<TechnicianDoc>();
api\src\cosmos\technician-repository.ts:35:  await container.items.upsert(updated);
api\src\cosmos\technician-repository.ts:42:  const container = client.database(DB_NAME).container(CONTAINER);
api\src\cosmos\technician-repository.ts:43:  const { resource } = await container.item(technicianId, 
technicianId).read<TechnicianDoc>();
api\src\cosmos\technician-repository.ts:51:  const container = client.database(DB_NAME).container(CONTAINER);
api\src\cosmos\technician-repository.ts:52:  await container.items.upsert(profile);
api\src\cosmos\technician-repository.ts:62:  const container = client.database(DB_NAME).container(CONTAINER);
api\src\cosmos\technician-repository.ts:76:  const { resources } = await container.items
api\src\cosmos\indexes\technicians-index.json:2:  "_comment": "Apply via: container.replace({ id: 'technicians', 
partitionKey: { paths: ['/technicianId'] }, indexingPolicy: <this object> }) or Azure Portal → Data Explorer → 
technicians → Scale & Settings → Indexing Policy",
api\src\cosmos\seeds\catalogue.ts:297:  // Ensure containers exist (idempotent)
api\src\cosmos\seeds\catalogue.ts:298:  await db.containers.createIfNotExists({ id: 'service_categories', 
partitionKey: '/id', defaultTtl: -1 });
api\src\cosmos\seeds\catalogue.ts:299:  await db.containers.createIfNotExists({ id: 'services', partitionKey: 
'/categoryId' });
api\src\cosmos\seeds\catalogue.ts:301:  const catContainer = db.container('service_categories');
api\src\cosmos\seeds\catalogue.ts:302:  const svcContainer = db.container('services');
api\src\cosmos\seeds\catalogue.ts:306:    await catContainer.items.upsert(cat);
api\src\cosmos\seeds\catalogue.ts:312:    await svcContainer.items.upsert(svc);



2026-04-20T23:34:16.287394Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm --dir api exec tsc --noEmit -p tsconfig.json'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm --dir api exec tsc --noEmit -p tsconfig.json' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm --dir api exec tsc --noEmit -p tsconfig.json'` rejected: blocked by policy
2026-04-20T23:34:19.931553Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content api/src/functions/webhooks.ts | ForEach-Object { '"'{0,4}: {1}' -f "'$i, $_; $i++ }; $i=1; Get-Content api/src/cosmos/booking-repository.ts | ForEach-Object { '"'{0,4}: {1}' -f "'$i, $_; $i++ }'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content api/src/functions/webhooks.ts | ForEach-Object { '"'{0,4}: {1}' -f "'$i, $_; $i++ }; $i=1; Get-Content api/src/cosmos/booking-repository.ts | ForEach-Object { '"'{0,4}: {1}' -f "'$i, $_; $i++ }' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content api/src/functions/webhooks.ts | ForEach-Object { '"'{0,4}: {1}' -f "'$i, $_; $i++ }; $i=1; Get-Content api/src/cosmos/booking-repository.ts | ForEach-Object { '"'{0,4}: {1}' -f "'$i, $_; $i++ }'` rejected: blocked by policy
2026-04-20T23:34:23.169060Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'findstr /n "RAZORPAY_WEBHOOK_SECRET markPaid getByPaymentOrderId expected !== signature" api'"\\src\\functions\\webhooks.ts & findstr /n \"async markPaid status "'!== '"'SEARCHING'\" api\\src\\cosmos\\booking-repository.ts"` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'findstr /n "RAZORPAY_WEBHOOK_SECRET markPaid getByPaymentOrderId expected !== signature" api'"\\src\\functions\\webhooks.ts & findstr /n \"async markPaid status "'!== '"'SEARCHING'\" api\\src\\cosmos\\booking-repository.ts" in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'findstr /n "RAZORPAY_WEBHOOK_SECRET markPaid getByPaymentOrderId expected !== signature" api'"\\src\\functions\\webhooks.ts & findstr /n \"async markPaid status "'!== '"'SEARCHING'\" api\\src\\cosmos\\booking-repository.ts"` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/webhooks.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 174ms:
import { createHmac } from 'node:crypto';
import type { HttpHandler, Timer } from '@azure/functions';
import { type InvocationContext, app } from '@azure/functions';
import { RazorpayWebhookPayloadSchema } from '../schemas/webhook.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { dispatcherService } from '../services/dispatcher.service.js';

export const razorpayWebhookHandler: HttpHandler = async (req, _ctx) => {
  const secret = process.env['RAZORPAY_WEBHOOK_SECRET'] ?? '';
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  const rawBody = await req.text();

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  if (expected !== signature) {
    return { status: 400, jsonBody: { code: 'SIGNATURE_INVALID' } };
  }

  let parsed;
  try {
    const json: unknown = JSON.parse(rawBody);
    const result = RazorpayWebhookPayloadSchema.safeParse(json);
    if (!result.success) {
      return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: result.error.issues } };
    }
    parsed = result.data;
  } catch {
    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
  }

  if (parsed.event !== 'payment.captured') {
    return { status: 200, jsonBody: { received: true } };
  }

  const orderId = parsed.payload.payment.entity.order_id;
  const paymentId = parsed.payload.payment.entity.id;

  const booking = await bookingRepo.getByPaymentOrderId(orderId);
  if (!booking) {
    return { status: 200, jsonBody: { received: true } };
  }

  if (booking.status === 'PAID') {
    return { status: 200, jsonBody: { received: true } };
  }

  const updated = await bookingRepo.markPaid(booking.id, paymentId);
  if (!updated) {
    return { status: 200, jsonBody: { received: true } };
  }

  dispatcherService.triggerDispatch(booking.id).catch(() => {
    // fire-and-forget â€” dispatch failure does not fail the webhook ack
  });

  return { status: 200, jsonBody: { received: true } };
};

export async function reconcileStaleBookingsHandler(
  _myTimer: Timer,
  context: InvocationContext,
): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const stale = await bookingRepo.getStaleSearching(cutoff);
  for (const booking of stale) {
    context.log(`STALE_BOOKING bookingId=${booking.id} createdAt=${booking.createdAt}`);
  }
}

app.http('razorpayWebhook', {
  route: 'v1/webhooks/razorpay',
  methods: ['POST'],
  handler: razorpayWebhookHandler,
});

app.timer('reconcileStaleBookings', {
  schedule: '0 0 2 * * *',
  handler: reconcileStaleBookingsHandler,
});

2026-04-20T23:34:32.391821Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path api/src/functions/webhooks.ts -Pattern "RAZORPAY_WEBHOOK_SECRET|markPaid" | ForEach-Object { "$($_.LineNumber):$($_.Line)" }; Select-String -Path api/src/cosmos/booking-repository.ts -Pattern "status !== '"'SEARCHING'|status: 'PAID'\" | ForEach-Object { \""'$($_.LineNumber):$($_.Line)" }'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path api/src/functions/webhooks.ts -Pattern "RAZORPAY_WEBHOOK_SECRET|markPaid" | ForEach-Object { "$($_.LineNumber):$($_.Line)" }; Select-String -Path api/src/cosmos/booking-repository.ts -Pattern "status !== '"'SEARCHING'|status: 'PAID'\" | ForEach-Object { \""'$($_.LineNumber):$($_.Line)" }' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path api/src/functions/webhooks.ts -Pattern "RAZORPAY_WEBHOOK_SECRET|markPaid" | ForEach-Object { "$($_.LineNumber):$($_.Line)" }; Select-String -Path api/src/cosmos/booking-repository.ts -Pattern "status !== '"'SEARCHING'|status: 'PAID'\" | ForEach-Object { \""'$($_.LineNumber):$($_.Line)" }'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path api/src/functions/webhooks.ts -Pattern RAZORPAY_WEBHOOK_SECRET' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 227ms:

api\src\functions\webhooks.ts:9:  const secret = process.env['RAZORPAY_WEBHOOK_SECRET'] ?? '';



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path api/src/functions/webhooks.ts -Pattern markPaid' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 800ms:

api\src\functions\webhooks.ts:47:  const updated = await bookingRepo.markPaid(booking.id, paymentId);



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path api/src/cosmos/booking-repository.ts -Pattern SEARCHING' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 239ms:

api\src\cosmos\booking-repository.ts:36:    const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, 
paymentSignature };
api\src\cosmos\booking-repository.ts:53:    if (!existing || existing.status !== 'SEARCHING') return null;
api\src\cosmos\booking-repository.ts:59:  async getStaleSearching(olderThanIso: string): Promise<BookingDoc[]> {
api\src\cosmos\booking-repository.ts:61:      query: "SELECT * FROM c WHERE c.status = 'SEARCHING' AND c.createdAt < 
@cutoff",



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse . | Select-String -Pattern \"status: 'PAID'|PAID|SEARCHING\" -SimpleMatch | Select-Object -First 50" in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 47082ms:

docs\reviews\codex-e03-s04.md:1394:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 
"Get-ChildItem -Recurse . | Select-String -Pattern \"status: 'PAID'|PAID|SEARCHING\" -SimpleMatch | Select-Object 
-First 50" in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04



2026-04-20T23:35:39.580982Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Recurse api/src,docs -File | Select-String -Pattern "PAID" | Select-Object Path,LineNumber,Line -First 100'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Recurse api/src,docs -File | Select-String -Pattern "PAID" | Select-Object Path,LineNumber,Line -First 100' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Recurse api/src,docs -File | Select-String -Pattern "PAID" | Select-Object Path,LineNumber,Line -First 100'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem docs' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 252ms:


    Directory: C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\docs


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
d-----         4/20/2026   7:14 PM                adr                                                                  
d-----         4/20/2026   7:14 PM                patterns                                                             
d-----         4/20/2026   7:14 PM                proposals                                                            
d-----         4/20/2026   7:33 PM                reviews                                                              
d-----         4/20/2026   7:14 PM                stories                                                              
d-----         4/20/2026   7:14 PM                superpowers                                                          
d-----         4/20/2026   7:14 PM                ux-demos                                                             
-a----         4/20/2026   7:14 PM          37451 architecture.md                                                      
-a----         4/20/2026   7:14 PM          45298 brainstorm.md                                                        
-a----         4/20/2026   7:14 PM          46604 client-proposal-hindi.docx                                           
-a----         4/20/2026   7:14 PM          54544 client-proposal-tiered-hindi.docx                                    
-a----         4/20/2026   7:14 PM         111968 prd.md                                                               
-a----         4/20/2026   7:14 PM          17280 runbook.md                                                           
-a----         4/20/2026   7:14 PM          20713 threat-model.md                                                      
-a----         4/20/2026   7:14 PM          35463 ux-design.md                                                         



2026-04-20T23:35:45.103298Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path docs/prd.md,docs/architecture.md,docs/runbook.md -Pattern PAID'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path docs/prd.md,docs/architecture.md,docs/runbook.md -Pattern PAID' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path docs/prd.md,docs/architecture.md,docs/runbook.md -Pattern PAID'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path docs/prd.md -Pattern PAID' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 218ms:

docs\prd.md:64:**Business model:** Customer pays owner via Razorpay; owner takes 22–25% commission; Razorpay Route 
auto-splits balance to technician's linked bank account; weekly or flexible-cadence payouts. Zero paid SaaS 
dependencies. GST-compliant from day one.
docs\prd.md:102:| Booking completion rate (started → paid) | ≥ 80% | ≥ 90% |
docs\prd.md:151:**Infra cost ceiling (any phase):** free-tier-eligible at ≤ 5,000 bookings/month. Any paid-tier 
migration requires ADR + owner approval.
docs\prd.md:179:- Zero paid SaaS dependencies (architectural constraint)
docs\prd.md:195:- Paid-SaaS-dependency count = 0
docs\prd.md:413:| **GST + e-invoicing** | All paid bookings | GSTIN registration; HSN/SAC codes for services; 
e-invoice via IRP for B2B (>₹5 cr turnover threshold; plan for MVP) |
docs\prd.md:458:| **Free-tier limit hit unexpectedly at scale spike** | Monitoring alerts at 70% / 85% of each free 
tier quota; documented paid-tier migration playbook; ₹50k/mo budget standby; per-service migration ADRs pre-authored |
docs\prd.md:479:**I-2. FCM as universal messaging spine (replacing paid SMS + WhatsApp Business).**
docs\prd.md:518:- **Innovation risk #3 (free-tier policy change):** per-service paid-tier migration playbook 
pre-written in architecture docs; ₹50k/mo budget standby.
docs\prd.md:646:| **Event sourcing for owner admin live view** | Cosmos change feed → Azure Function → FCM topic per 
admin | Free-tier scale; avoids WebSocket/SignalR paid tier |
docs\prd.md:745:| Free-tier limits hit unexpectedly | Monitoring alerts at 70% / 85% of each free tier; paid-tier 
migration playbook pre-written; ₹50k/mo budget standby |
docs\prd.md:754:| Customer acquisition CAC too high | RWA tie-ups + society WhatsApp + referrals (C-23/C-25) before 
paid ads; soft launch to 100 F&F first (D23); paid ads only after organic hits 500 bookings/mo |
docs\prd.md:764:| Working capital squeeze | ₹15–20 lakh standby line earmarked (OQ-6); Razorpay Instant Settlement as 
optional tech-paid feature (T-3); contingency: pause new tech onboarding until float recovers |
docs\prd.md:765:| Marketing budget insufficient | Phase-gated spend: ₹1 lakh organic only first 3 months; paid ads 
only after organic CAC validated; budget cap ₹5 lakh pilot (OQ-7) |
docs\prd.md:775:- **₹0 infra constraint (D2). Any paid SaaS needs ADR + approval.**
docs\prd.md:861:- *As a customer, I want to go from catalogue to paid booking in 3 taps or fewer, so that booking is 
frictionless.*
docs\prd.md:925:- *As a technician, I want to choose how often I get paid — weekly, next-day, or instant — so that I 
can manage my cash flow.*
docs\prd.md:1158:| NFR-C-4 | GST e-invoicing for all paid bookings | IRP integration; invoice register audit |
docs\prd.md:1211:| NFR-M-3 | Zero paid SaaS dependencies (any new paid SaaS requires ADR + approval) | Dependency 
audit + ADR count |
docs\prd.md:1233:| OQ-7 | Marketing budget for pilot | ₹5 lakh recommended (80% organic + 20% paid) | Pre-launch |
docs\prd.md:1270:- **Booking:** Customer's request for a service; lifecycle CREATED → SEARCHING → ASSIGNED → EN_ROUTE 
→ REACHED → IN_PROGRESS → COMPLETED → PAID → CLOSED
docs\prd.md:1276:- **GMV:** Gross Merchandise Value — total paid amount for all bookings in a period



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path docs/architecture.md -Pattern "PENDING_PAYMENT"' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 185ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/cosmos/finance-repository.ts' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04
 succeeded in 180ms:
import { randomUUID } from 'node:crypto';
import { getCosmosClient, DB_NAME } from './client.js';
import type { DailyPnLEntry, FinanceSummary, PayoutQueue, PayoutQueueEntry } from '../schemas/finance.js';

interface CompletedBooking {
  id: string;
  technicianId: string;
  technicianName: string;
  amount: number;
  commissionBps?: number;
  completedAt: string;
}

interface LedgerTransferDoc {
  id: string;
  type: 'TRANSFER';
  technicianId: string;
  weekStart: string;
  razorpayTransferId: string;
  amount: number;
  createdAt: string;
}

export interface LedgerEntryInput {
  technicianId: string;
  amount: number;
  type: 'EARNING' | 'TRANSFER';
  weekStart?: string;
  razorpayTransferId?: string;
  bookingId?: string;
}

async function queryCompletedBookings(from: string, to: string): Promise<CompletedBooking[]> {
  const { resources } = await getCosmosClient()
    .database(DB_NAME)
    .container('bookings')
    .items.query(
      {
        query: `SELECT c.id, c.technicianId, c.technicianName, c.amount, c.commissionBps, c.completedAt
                FROM c
                WHERE c.status = 'COMPLETED'
                  AND c.completedAt >= @from
                  AND c.completedAt <= @toEnd`,
        parameters: [
          { name: '@from', value: `${from}T00:00:00.000Z` },
          { name: '@toEnd', value: `${to}T23:59:59.999Z` },
        ],
      },
    )
    .fetchAll();
  return (resources ?? []) as CompletedBooking[];
}

export async function getDailyPnL(from: string, to: string): Promise<FinanceSummary> {
  const bookings = await queryCompletedBookings(from, to);
  const byDate = new Map<string, { gross: number; commission: number }>();

  for (const b of bookings) {
    const date = b.completedAt.slice(0, 10);
    const bps = b.commissionBps ?? 0;
    const commission = Math.round(b.amount * bps / 10000);
    const existing = byDate.get(date) ?? { gross: 0, commission: 0 };
    byDate.set(date, { gross: existing.gross + b.amount, commission: existing.commission + commission });
  }

  const dailyPnL: DailyPnLEntry[] = [];
  let totalGross = 0;
  let totalCommission = 0;

  for (const [date, { gross, commission }] of [...byDate.entries()].sort()) {
    dailyPnL.push({ date, grossRevenue: gross, commission, netToOwner: gross - commission });
    totalGross += gross;
    totalCommission += commission;
  }

  return { dailyPnL, totalGross, totalCommission, totalNet: totalGross - totalCommission };
}

export async function getPayoutQueue(weekStart: string, weekEnd: string): Promise<PayoutQueue> {
  const bookings = await queryCompletedBookings(weekStart, weekEnd);
  const byTech = new Map<string, { name: string; jobs: number; gross: number; commission: number }>();

  for (const b of bookings) {
    const bps = b.commissionBps ?? 0;
    const commission = Math.round(b.amount * bps / 10000);
    const existing = byTech.get(b.technicianId) ?? { name: b.technicianName, jobs: 0, gross: 0, commission: 0 };
    byTech.set(b.technicianId, {
      name: b.technicianName,
      jobs: existing.jobs + 1,
      gross: existing.gross + b.amount,
      commission: existing.commission + commission,
    });
  }

  const entries: PayoutQueueEntry[] = [];
  let totalNetPayable = 0;

  for (const [technicianId, { name, jobs, gross, commission }] of byTech.entries()) {
    const netPayable = gross - commission;
    if (netPayable <= 0) continue;
    entries.push({ technicianId, technicianName: name, completedJobsThisWeek: jobs, grossEarnings: gross, commissionDeducted: commission, netPayable });
    totalNetPayable += netPayable;
  }

  return { weekStart, weekEnd, entries, totalNetPayable };
}

export async function getLedgerTransfer(technicianId: string, weekStart: string): Promise<LedgerTransferDoc | null> {
  const { resources } = await getCosmosClient()
    .database(DB_NAME)
    .container('wallet_ledger')
    .items.query(
      {
        query: `SELECT TOP 1 * FROM c WHERE c.technicianId = @tid AND c.weekStart = @ws AND c.type = 'TRANSFER'`,
        parameters: [
          { name: '@tid', value: technicianId },
          { name: '@ws', value: weekStart },
        ],
      },
    )
    .fetchAll();
  return (resources?.[0] as LedgerTransferDoc | undefined) ?? null;
}

export async function writeLedgerEntry(entry: LedgerEntryInput): Promise<void> {
  await getCosmosClient()
    .database(DB_NAME)
    .container('wallet_ledger')
    .items.create({
      id: randomUUID(),
      partitionKey: entry.technicianId,
      createdAt: new Date().toISOString(),
      ...entry,
    });
}

interface TechnicianDoc {
  id: string;
  razorpayLinkedAccountId?: string;
}

export async function getTechnicianLinkedAccount(technicianId: string): Promise<string | null> {
  const { resource } = await getCosmosClient()
    .database(DB_NAME)
    .container('technicians')
    .item(technicianId, technicianId)
    .read<TechnicianDoc>();
  return resource?.razorpayLinkedAccountId ?? null;
}

interface SnapshotDoc {
  weekStart: string;
  weekEnd: string;
  entries: PayoutQueueEntry[];
  totalNetPayable: number;
  computedAt: string;
}

export async function getWeekSnapshot(weekStart: string): Promise<PayoutQueue | null> {
  const { resource } = await getCosmosClient()
    .database(DB_NAME)
    .container('payout_snapshots')
    .item(weekStart, weekStart)
    .read<SnapshotDoc>();
  if (!resource) return null;
  return {
    weekStart: resource.weekStart,
    weekEnd: resource.weekEnd,
    entries: resource.entries,
    totalNetPayable: resource.totalNetPayable,
  };
}

export async function upsertWeekSnapshot(queue: PayoutQueue): Promise<void> {
  await getCosmosClient()
    .database(DB_NAME)
    .container('payout_snapshots')
    .items.upsert({
      id: queue.weekStart,
      partitionKey: queue.weekStart,
      computedAt: new Date().toISOString(),
      ...queue,
    });
}

codex
The webhook implementation can lose or misclassify successful payment captures depending on delivery order, and it fails open when the webhook secret is missing. These are functional/security issues in the new webhook path.

Full review comments:

- [P1] Keep captured payments in the booking lifecycle — C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\cosmos\booking-repository.ts:53-54
  For `payment.captured` webhooks, this only accepts bookings that are already `SEARCHING` and then immediately writes `PAID`. If Razorpay delivers the webhook before the client calls `/confirm`, the booking is still `PENDING_PAYMENT` and the webhook is acknowledged without updating it; if the client confirm wins the race, the webhook moves an active `SEARCHING` booking out of the dispatch lifecycle even though the job has not been assigned/completed yet. The webhook path should be able to confirm pending payments into the same post-payment state as `confirmPayment` and remain idempotent for already-confirmed bookings.

- [P1] Reject webhooks when the signing secret is unset — C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\webhooks.ts:9-9
  When `RAZORPAY_WEBHOOK_SECRET` is missing, this silently falls back to an empty HMAC key, so a deployment with a missing secret will still accept any request signed with the publicly guessable empty key instead of failing closed. This should reject requests or fail startup/configuration when the webhook secret is not configured.
The webhook implementation can lose or misclassify successful payment captures depending on delivery order, and it fails open when the webhook secret is missing. These are functional/security issues in the new webhook path.

Full review comments:

- [P1] Keep captured payments in the booking lifecycle — C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\cosmos\booking-repository.ts:53-54
  For `payment.captured` webhooks, this only accepts bookings that are already `SEARCHING` and then immediately writes `PAID`. If Razorpay delivers the webhook before the client calls `/confirm`, the booking is still `PENDING_PAYMENT` and the webhook is acknowledged without updating it; if the client confirm wins the race, the webhook moves an active `SEARCHING` booking out of the dispatch lifecycle even though the job has not been assigned/completed yet. The webhook path should be able to confirm pending payments into the same post-payment state as `confirmPayment` and remain idempotent for already-confirmed bookings.

- [P1] Reject webhooks when the signing secret is unset — C:\Alok\Business Projects\Urbanclap-dup\.worktrees\e03-s04\api\src\functions\webhooks.ts:9-9
  When `RAZORPAY_WEBHOOK_SECRET` is missing, this silently falls back to an empty HMAC key, so a deployment with a missing secret will still accept any request signed with the publicly guessable empty key instead of failing closed. This should reject requests or fail startup/configuration when the webhook secret is not configured.
