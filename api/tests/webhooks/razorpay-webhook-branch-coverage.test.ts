/**
 * E13-S01 webhook branch-coverage gap closure
 *
 * Covers the residual uncovered branches that kept the suite at 79.99%:
 *   webhooks.ts line 29  – Zod schema validation failure (valid JSON, wrong shape)
 *   webhooks.ts line 65  – markPaid returns null (concurrent lock / already processed)
 *   webhooks.ts line 125 – posthog.capture throws (non-fatal, caught silently)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';

vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook_secret');

const { mockItemsCreate } = vi.hoisted(() => ({ mockItemsCreate: vi.fn() }));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getByPaymentOrderId: vi.fn(),
    getById: vi.fn(),
    markPaid: vi.fn(),
    getStaleSearching: vi.fn(),
  },
}));

vi.mock('../../src/cosmos/customer-credit-ledger-repository.js', () => ({
  customerCreditLedgerRepo: { applyCredit: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../../src/services/dispatcher.service.js', () => ({
  dispatcherService: { triggerDispatch: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/cosmos/client.js', () => ({
  getWebhookEventsContainer: vi.fn(() => ({
    items: { create: mockItemsCreate },
  })),
}));

vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

// posthog mock — allows us to control capture() behaviour per test
const { mockPosthogCapture } = vi.hoisted(() => ({ mockPosthogCapture: vi.fn() }));
vi.mock('../../src/observability/posthog.js', () => ({
  posthog: { capture: mockPosthogCapture },
}));

import { razorpayWebhookHandler } from '../../src/functions/webhooks.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';

type MockFn = ReturnType<typeof vi.fn>;
const mockCtx = {} as InvocationContext;

function makeSignature(body: string, secret = 'webhook_secret') {
  return createHmac('sha256', secret).update(body).digest('hex');
}

function makeWebhookReq(body: string, signature: string) {
  return new HttpRequest({
    url: 'http://localhost/api/v1/webhooks/razorpay',
    method: 'POST',
    body: { string: body },
    headers: { 'x-razorpay-signature': signature, 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockItemsCreate.mockResolvedValue({});
  mockPosthogCapture.mockReturnValue(undefined);
});

// ---------------------------------------------------------------------------
// webhooks.ts line 29: if (!result.success) → VALIDATION_ERROR
// Valid JSON but schema shape is wrong (missing required fields).
// ---------------------------------------------------------------------------
describe('razorpayWebhook — Zod schema validation failure (line 29)', () => {
  it('returns 400 VALIDATION_ERROR for valid JSON that does not match RazorpayWebhookPayloadSchema', async () => {
    // Valid JSON but missing required fields (no event, no payload)
    const body = JSON.stringify({ foo: 'bar' });
    const signature = makeSignature(body);
    const res = await razorpayWebhookHandler(makeWebhookReq(body, signature), mockCtx) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// webhooks.ts line 65: if (!updated) → 200 when markPaid returns null (race)
// ---------------------------------------------------------------------------
describe('razorpayWebhook — markPaid returns null (concurrent lock branch, line 65)', () => {
  it('returns 200 received:true and does NOT dispatch when markPaid returns null', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_race', order_id: 'order_race' } } },
    });
    const signature = makeSignature(body);

    (bookingRepo.getByPaymentOrderId as MockFn).mockResolvedValueOnce({
      id: 'bk-race',
      customerId: 'cust-race',
      status: 'PENDING_PAYMENT',
      paymentOrderId: 'order_race',
    });
    // markPaid returns null → concurrent write won the race
    (bookingRepo.markPaid as MockFn).mockResolvedValueOnce(null);

    const res = await razorpayWebhookHandler(makeWebhookReq(body, signature), mockCtx) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect((res.jsonBody as { received: boolean }).received).toBe(true);
    // No dispatch because markPaid failed (concurrent lock)
    const { dispatcherService } = await import('../../src/services/dispatcher.service.js');
    expect(vi.mocked(dispatcherService.triggerDispatch)).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// webhooks.ts line 125: } catch { /* never break the webhook ack */ }
// posthog.capture throws — must be swallowed; webhook returns 200.
// ---------------------------------------------------------------------------
describe('razorpayWebhook — posthog.capture throw is swallowed (line 125)', () => {
  it('returns 200 when posthog.capture throws', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_posthog', order_id: 'order_posthog' } } },
    });
    const signature = makeSignature(body);

    (bookingRepo.getByPaymentOrderId as MockFn).mockResolvedValueOnce({
      id: 'bk-posthog',
      customerId: 'cust-posthog',
      status: 'PENDING_PAYMENT',
      paymentOrderId: 'order_posthog',
    });
    (bookingRepo.markPaid as MockFn).mockResolvedValueOnce({
      id: 'bk-posthog',
      customerId: 'cust-posthog',
      status: 'PAID',
    });
    // Force posthog.capture to throw synchronously
    mockPosthogCapture.mockImplementationOnce(() => {
      throw new Error('PostHog SDK unavailable');
    });

    const res = await razorpayWebhookHandler(makeWebhookReq(body, signature), mockCtx) as HttpResponseInit;

    // Error must be swallowed; webhook ack must still be 200
    expect(res.status).toBe(200);
    expect((res.jsonBody as { received: boolean }).received).toBe(true);
  });
});
