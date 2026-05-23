# E11-S05a-api — API producer for technician-bound booking-status pushes

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` (or `superpowers:subagent-driven-development` if running in a Claude Code session with subagent support). Steps use checkbox (`- [ ]`) syntax for tracking.

**Tier:** Feature
**Deps:** none (independent of E11-S05a-client; producer can ship first or second)
**Pairs with:** [`E11-S05a-client.md`](./E11-S05a-client.md) — once both merge, the active-job screen refreshes on customer price-approval.
**Blocks:** none in W5.

---

## Goal

Add a server-side FCM producer that pushes booking-status updates to the **technician topic** (`technician_${technicianId}`) so the client-side `BookingStatusEventBus` listener built in E11-S05a-client actually fires in production.

The immediate trigger that needs a technician push is the customer's `approveFinalPrice` action. Today the API mutates the booking but never notifies the assigned technician — they only see the new finalAmount on next manual navigation. After this story, the open `ActiveJobScreen` refreshes within seconds.

## Architecture

```
Customer POST /v1/bookings/{id}/approve-final-price
  └─ bookings.ts: approveFinalPriceInner
       ├─ bookingRepo.applyAddOnDecisions(...)
       │    returns updated BookingDoc with finalAmount + status="IN_PROGRESS"
       └─ NEW: if updated.technicianId, sendTechnicianBookingStatusUpdatePush({
              technicianId: updated.technicianId,
              bookingId: id,
              status: "PRICE_APPROVED",
              priceApprovedPaise: updated.finalAmount,
          }).catch(log)

Technician device receives FCM on technician_<id> topic
  └─ HomeservicesFcmService.handleMessageData: BOOKING_STATUS_UPDATE branch fires
       ├─ Posts BookingStatusEvent("PRICE_APPROVED", priceApprovedPaise=...)
       └─ ActiveJobViewModel collector calls repository.startObserving(bookingId) → screen refreshes
```

### Why only `approveFinalPrice`

| Existing API mutator | Actor | Technician needs push? |
|---|---|---|
| `active-job.ts` (technician transitions ASSIGNED → ... → COMPLETED) | Technician (self) | No — self-actor; in-memory state already reflects the change |
| `job-offers.ts` `acceptOffer` (status → ASSIGNED) | Technician (self) | No — same reason |
| `bookings.ts` `requestAddon` (status → AWAITING_PRICE_APPROVAL) | Technician (self) | No — same reason |
| `bookings.ts` `approveFinalPrice` (status → IN_PROGRESS, finalAmount set) | **Customer** | **Yes** — technician is a passive bystander |
| Future: customer-side rejection / cancellation | Customer | Yes (defer until those endpoints exist) |

So this story wires exactly one call site. Future producers can reuse the same helper.

## Tech stack

- Node 22 LTS + TypeScript `strict: true`
- Vitest + ts-mockito patterns from `api/tests/services/`, `api/tests/bookings/`
- Firebase Admin SDK (`getFirebaseAdmin().messaging().send()` — already in `firebaseAdmin.ts`)
- Existing test patterns: `vi.mock('../../src/services/fcm.service.js', () => ({ sendXxx: vi.fn().mockResolvedValue(undefined) }))`

---

## Work streams

### WS-A — Producer

**Files:**
- Modify: `api/src/services/fcm.service.ts` (append the new function)
- Create: `api/tests/services/fcm-technician.service.test.ts`

#### Steps

- [ ] **Step A1 — Add producer to `api/src/services/fcm.service.ts`**

Append after `sendBookingStatusUpdatePush` (around line 23):

```typescript
export async function sendTechnicianBookingStatusUpdatePush(payload: {
  technicianId: string;
  bookingId: string;
  status: string;
  priceApprovedPaise?: number;
}): Promise<void> {
  const data: Record<string, string> = {
    type: 'BOOKING_STATUS_UPDATE',
    bookingId: payload.bookingId,
    status: payload.status,
  };
  if (payload.priceApprovedPaise !== undefined) {
    data.priceApprovedPaise = String(payload.priceApprovedPaise);
  }
  await getFirebaseAdmin().messaging().send({
    topic: `technician_${payload.technicianId}`,
    data,
  });
}
```

Notes:
- Topic naming mirrors the existing `customer_${customerId}` convention. The technician-app subscribes to `technician_${uid}` already (see `FcmTopicSubscriber`).
- Data values are `Record<string, string>` per FCM requirements — `priceApprovedPaise` is serialized as a stringified integer.
- Status uses the canonical wire string `'BOOKING_STATUS_UPDATE'` (NOT `CUSTOMER_PRICE_APPROVED`) so the existing technician-app `BOOKING_STATUS_UPDATE` branch fires.

- [ ] **Step A2 — Write Vitest for the producer**

Create `api/tests/services/fcm-technician.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMock = vi.fn().mockResolvedValue('mid-1');

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  getFirebaseAdmin: () => ({ messaging: () => ({ send: sendMock }) }),
}));

import { sendTechnicianBookingStatusUpdatePush } from '../../src/services/fcm.service.js';

beforeEach(() => sendMock.mockClear());

describe('sendTechnicianBookingStatusUpdatePush', () => {
  it('targets the technician_<id> topic', async () => {
    await sendTechnicianBookingStatusUpdatePush({
      technicianId: 'tech-9',
      bookingId: 'bk-1',
      status: 'PRICE_APPROVED',
    });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0].topic).toBe('technician_tech-9');
  });

  it('emits BOOKING_STATUS_UPDATE with the canonical status key', async () => {
    await sendTechnicianBookingStatusUpdatePush({
      technicianId: 'tech-9',
      bookingId: 'bk-1',
      status: 'PRICE_APPROVED',
    });
    const data = sendMock.mock.calls[0][0].data;
    expect(data.type).toBe('BOOKING_STATUS_UPDATE');
    expect(data.bookingId).toBe('bk-1');
    expect(data.status).toBe('PRICE_APPROVED');
  });

  it('serialises priceApprovedPaise as a string when provided', async () => {
    await sendTechnicianBookingStatusUpdatePush({
      technicianId: 'tech-9',
      bookingId: 'bk-1',
      status: 'PRICE_APPROVED',
      priceApprovedPaise: 12500,
    });
    expect(sendMock.mock.calls[0][0].data.priceApprovedPaise).toBe('12500');
  });

  it('omits priceApprovedPaise when not provided', async () => {
    await sendTechnicianBookingStatusUpdatePush({
      technicianId: 'tech-9',
      bookingId: 'bk-1',
      status: 'ASSIGNED',
    });
    expect(sendMock.mock.calls[0][0].data.priceApprovedPaise).toBeUndefined();
  });
});
```

- [ ] **Step A3 — Run the producer test in isolation**

Run: `cd api && npx vitest run tests/services/fcm-technician.service.test.ts`
Expected: 4 passing.

- [ ] **Step A4 — Commit WS-A**

```bash
git add api/src/services/fcm.service.ts api/tests/services/fcm-technician.service.test.ts
git commit -m "feat(E11-S05a-api): WS-A — sendTechnicianBookingStatusUpdatePush producer

Add a producer that targets technician_<id> FCM topic with the canonical
BOOKING_STATUS_UPDATE data shape. priceApprovedPaise is optional and serialised
as a stringified integer per FCM data-only payload requirements.

Vitest covers topic targeting, data shape, paise serialisation, and the
omit-when-absent path.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### WS-B — Wire into `approveFinalPrice`

**Files:**
- Modify: `api/src/functions/bookings.ts:587-595` (approveFinalPriceInner)
- Modify: `api/tests/bookings/price-approval.test.ts` (add coverage for the new push)

#### Steps

- [ ] **Step B1 — Update the import in `bookings.ts`**

Change line 14 from:

```typescript
import { sendPriceApprovalPush } from '../services/fcm.service.js';
```

to:

```typescript
import { sendPriceApprovalPush, sendTechnicianBookingStatusUpdatePush } from '../services/fcm.service.js';
```

- [ ] **Step B2 — Wire the push in `approveFinalPriceInner`**

Replace the existing handler body (currently lines 587-595):

```typescript
const approveFinalPriceInner: CustomerHttpHandler = async (req, _ctx, customer) => {
  const id = (req as unknown as { params: { id: string } }).params.id;
  const body = await req.json().catch(() => null);
  const parsed = ApproveAddOnsBodySchema.safeParse(body);
  if (!parsed.success) return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  const updated = await bookingRepo.applyAddOnDecisions(id, customer.customerId, parsed.data.decisions);
  if (!updated) return { status: 409, jsonBody: { code: 'BOOKING_NOT_AWAITING_APPROVAL' } };
  return { status: 200, jsonBody: { bookingId: updated.id, status: updated.status, finalAmount: updated.finalAmount } };
};
```

with:

```typescript
const approveFinalPriceInner: CustomerHttpHandler = async (req, _ctx, customer) => {
  const id = (req as unknown as { params: { id: string } }).params.id;
  const body = await req.json().catch(() => null);
  const parsed = ApproveAddOnsBodySchema.safeParse(body);
  if (!parsed.success) return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  const updated = await bookingRepo.applyAddOnDecisions(id, customer.customerId, parsed.data.decisions);
  if (!updated) return { status: 409, jsonBody: { code: 'BOOKING_NOT_AWAITING_APPROVAL' } };

  // Notify the assigned technician so their open ActiveJobScreen can refresh
  // (E11-S05a-client wires the BookingStatusEventBus listener). Best-effort —
  // a push failure must not fail the customer's request.
  if (updated.technicianId) {
    try {
      await sendTechnicianBookingStatusUpdatePush({
        technicianId: updated.technicianId,
        bookingId: id,
        status: 'PRICE_APPROVED',
        priceApprovedPaise: updated.finalAmount,
      });
    } catch (err) {
      console.error('[approveFinalPrice] FCM technician push failed', { bookingId: id, err });
    }
  }

  return { status: 200, jsonBody: { bookingId: updated.id, status: updated.status, finalAmount: updated.finalAmount } };
};
```

- [ ] **Step B3 — Update the existing test mock to include the new producer**

In `api/tests/bookings/price-approval.test.ts`, find the existing mock block:

```typescript
vi.mock('../../src/services/fcm.service.js', () => ({
  sendPriceApprovalPush: vi.fn().mockResolvedValue(undefined),
}));
```

Replace with:

```typescript
vi.mock('../../src/services/fcm.service.js', () => ({
  sendPriceApprovalPush: vi.fn().mockResolvedValue(undefined),
  sendTechnicianBookingStatusUpdatePush: vi.fn().mockResolvedValue(undefined),
}));
```

- [ ] **Step B4 — Add coverage for the new push behaviour**

At the bottom of the existing `describe` block that tests `approveFinalPriceHandler` (search for `approveFinalPrice` in the file), add:

```typescript
it('sends technician BOOKING_STATUS_UPDATE push when booking has assigned technician', async () => {
  const { sendTechnicianBookingStatusUpdatePush } = await import('../../src/services/fcm.service.js');
  (sendTechnicianBookingStatusUpdatePush as MockFn).mockClear();

  (bookingRepo.applyAddOnDecisions as MockFn).mockResolvedValue({
    id: 'bk-1',
    status: 'IN_PROGRESS',
    technicianId: 'tech-1',
    finalAmount: 75000,
  });
  // Construct the request via the same `req()` helper used elsewhere in this file.
  const res: any = await approveFinalPriceHandler(
    req('POST', 'bk-1', '/approve-final-price', { decisions: [] }),
    {} as any,
  );
  expect(res.status).toBe(200);
  expect(sendTechnicianBookingStatusUpdatePush).toHaveBeenCalledWith({
    technicianId: 'tech-1',
    bookingId: 'bk-1',
    status: 'PRICE_APPROVED',
    priceApprovedPaise: 75000,
  });
});

it('skips technician push when booking has no assigned technician', async () => {
  const { sendTechnicianBookingStatusUpdatePush } = await import('../../src/services/fcm.service.js');
  (sendTechnicianBookingStatusUpdatePush as MockFn).mockClear();

  (bookingRepo.applyAddOnDecisions as MockFn).mockResolvedValue({
    id: 'bk-2',
    status: 'IN_PROGRESS',
    technicianId: undefined,
    finalAmount: 50000,
  });
  const res: any = await approveFinalPriceHandler(
    req('POST', 'bk-2', '/approve-final-price', { decisions: [] }),
    {} as any,
  );
  expect(res.status).toBe(200);
  expect(sendTechnicianBookingStatusUpdatePush).not.toHaveBeenCalled();
});

it('returns 200 even when technician push throws (best-effort)', async () => {
  const { sendTechnicianBookingStatusUpdatePush } = await import('../../src/services/fcm.service.js');
  (sendTechnicianBookingStatusUpdatePush as MockFn).mockReset();
  (sendTechnicianBookingStatusUpdatePush as MockFn).mockRejectedValueOnce(new Error('FCM 500'));

  (bookingRepo.applyAddOnDecisions as MockFn).mockResolvedValue({
    id: 'bk-3',
    status: 'IN_PROGRESS',
    technicianId: 'tech-2',
    finalAmount: 60000,
  });
  const res: any = await approveFinalPriceHandler(
    req('POST', 'bk-3', '/approve-final-price', { decisions: [] }),
    {} as any,
  );
  expect(res.status).toBe(200);
});
```

Verify the `req()` helper in this file matches the example — adjust the suffix/body args to whatever the file's existing helper expects.

- [ ] **Step B5 — Run the bookings tests**

Run: `cd api && npx vitest run tests/bookings/price-approval.test.ts`
Expected: all previously-green tests still pass + 3 new ones pass.

- [ ] **Step B6 — Commit WS-B**

```bash
git add api/src/functions/bookings.ts api/tests/bookings/price-approval.test.ts
git commit -m "feat(E11-S05a-api): WS-B — wire technician push into approveFinalPrice

After applyAddOnDecisions succeeds, dispatch a BOOKING_STATUS_UPDATE push to
the assigned technician with status='PRICE_APPROVED' and the new finalAmount
serialised as priceApprovedPaise. Wrapped in try/catch so a push failure
cannot fail the customer's HTTP request (best-effort delivery — FCM is
unreliable by design).

Tests cover: happy path (push fires with correct payload), no-technician path
(push skipped), and push-throws path (handler still returns 200).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### WS-C — Smoke gate + Codex review

#### Steps

- [ ] **Step C1 — Run the API smoke gate**

Run: `bash tools/pre-codex-smoke-api.sh`
Expected: 0 exit. If non-zero, fix the failures (typecheck, lint, full vitest, semgrep) before invoking Codex.

If `tools/pre-codex-smoke-api.sh` does not exist, run these four steps manually:

```bash
cd api
npm run typecheck
npm run lint
npx vitest run
npx semgrep --config .semgrep.yml --error src/
```

All four must exit 0.

- [ ] **Step C2 — Codex review**

```bash
codex review --base main
```

Expected: green. If P1/P2 findings appear, invoke `superpowers:receiving-code-review` and fix before proceeding. Per the project's lean review policy, allow at most one Codex re-run; stop and surface to the user if a third round is needed.

- [ ] **Step C3 — Write the Codex marker**

```bash
echo "{\"timestamp\":\"$(date -Iseconds)\",\"commit\":\"$(git rev-parse HEAD)\",\"reviewer\":\"codex\"}" > .codex-review-passed
git add .codex-review-passed
git commit -m "chore(E11-S05a-api): codex review passed"
```

- [ ] **Step C4 — Push and open PR**

```bash
git push -u origin feat/E11-S05a-api
gh pr create --title "feat(E11-S05a-api): technician-bound booking-status FCM producer" \
  --body "$(cat <<'EOF'
## Summary
- Adds `sendTechnicianBookingStatusUpdatePush` producer (`technician_<id>` topic, canonical `BOOKING_STATUS_UPDATE` data shape).
- Wires the push into `approveFinalPrice` so the assigned technician's open `ActiveJobScreen` refreshes within seconds of the customer approving the final price.
- Best-effort delivery: push failures never fail the customer request.

## Pairs with
PR for `E11-S05a-client` (`feat/E11-S05a-job-execution-durable-hooks`). The client wires the listener; this PR wires the producer. Both must merge for the end-to-end refresh path to be live.

## Test plan
- [ ] Vitest green: `sendTechnicianBookingStatusUpdatePush` happy + skip + throw paths
- [ ] CI green
- [ ] Manual: trigger a customer approve-final-price against staging; observe an open technician device receive the FCM payload and the active-job screen re-fetch

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## File manifest

| Action | File |
|---|---|
| MODIFY | `api/src/services/fcm.service.ts` — append `sendTechnicianBookingStatusUpdatePush` |
| MODIFY | `api/src/functions/bookings.ts` — import + call from `approveFinalPriceInner` |
| NEW (test) | `api/tests/services/fcm-technician.service.test.ts` |
| MODIFY (test) | `api/tests/bookings/price-approval.test.ts` — mock new producer + 3 new tests |

Lines changed: ~25 production + ~75 test. Single function add, single call-site wire.

## Out of scope

- **CUSTOMER_PRICE_REJECTED producer.** No explicit reject endpoint exists in the API today; customer rejection is implicit (don't approve). Add the producer when that endpoint lands.
- **Deep-link routing.** The technician-app notification opens MainActivity without deep-linking to `activeJob/{bookingId}`. Tracked separately if user demand justifies a `PendingNavigationStore` + `HomeGraph` collector.
- **Server-side cancellation pushes.** Out of scope until cancellation endpoints exist.
- **Removing the dead CUSTOMER_PRICE_APPROVED / CUSTOMER_PRICE_REJECTED FCM branches in the technician-app.** Optional cleanup story; the branches don't fire today but harm nothing.

## Acceptance criteria

- [ ] `sendTechnicianBookingStatusUpdatePush` exists in `fcm.service.ts` and is fully covered by isolated Vitest.
- [ ] `approveFinalPriceInner` calls the new producer for assigned technicians with `status='PRICE_APPROVED'` and `priceApprovedPaise=updated.finalAmount`.
- [ ] Best-effort: a push exception NEVER fails the customer HTTP request (test verifies 200 on push-throws).
- [ ] No production code paths target a topic other than `technician_<id>` (no broadcast, no fan-out).
- [ ] `bash tools/pre-codex-smoke-api.sh` exits 0.
- [ ] `codex review --base main` exits 0 (one re-run allowed; stop if a third round is needed).
- [ ] PR opened against `main`; CI green; merged.

## Estimated wall-clock

1.5–2 hours including Codex round-trip and PR open. Pure API story, narrow blast radius, two file modifications.
