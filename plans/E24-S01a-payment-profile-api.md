# E24-S01a — Payment Profile API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the API surface E24-S01 (Technician UPI QR) needs: a way for a technician to set their own UPI VPA, the settled amount on the technician's active-job read, and the customer's own masked view of that VPA. No client work — this is the API half of a two-part split (root CLAUDE.md story-size gate: the combined API+Android plan was 1734 lines, over the 800-line Feature-tier split threshold and hitting 2 of 4 split criteria — all Android layers touched, ≥10 test files).

**Architecture:** Purely additive. One new PATCH endpoint, two existing GET responses each widened by one field. No new payment rail, no touch to `PAYMENT_METHODS`/Razorpay/`trigger-booking-completed.ts`.

**Tech Stack:** Zod, Vitest, `@azure/functions`.

**Spec:** Owner-approved design: `C:/Users/alokt/.claude/plans/act-as-a-principal-ticklish-fern.md` § "E24-S01 · Technician UPI QR" (lines ~465-488). Interface contract for the masking piece: `docs/stories/E09-S08-interface-notes.md` §1 (`maskVpa`) and `docs/adr/0034-pii-masking-default-and-audited-reveal.md`. Companion Android plan: `plans/E24-S01b-android-upi-qr.md` (depends on this story being merged — it needs these endpoints live to build against).

## Global Constraints

- Do **not** add a third value to `PAYMENT_METHODS`. `collectionMethod: 'CASH'|'UPI_QR'` is a separate, already-defined additive field (`api/src/schemas/commission-receivable.ts` → `CollectionMethodSchema`) — nothing in this story touches the payment-method branch in `trigger-booking-completed.ts`.
- Masking follows the ADR-0034 pattern: mask at the single serialization boundary inside the handler, never construct or pass around an unmasked VPA on a read path that doesn't need it.

---

## Work Stream A — VPA validation + payment-profile endpoint

### Task 1: VPA format validator (shared by server and Android client logic)

**Files:**
- Create: `api/src/lib/pii/vpa-format.ts`
- Test: `api/tests/lib/pii/vpa-format.test.ts`

**Interfaces:**
- Produces: `isValidVpaFormat(vpa: string): boolean` — used by Task 2's Zod schema.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { isValidVpaFormat } from '../../../src/lib/pii/vpa-format.js';

describe('isValidVpaFormat', () => {
  it('accepts a well-formed VPA', () => {
    expect(isValidVpaFormat('alok.tiwari@okhdfcbank')).toBe(true);
  });

  it('accepts a short handle@psp VPA', () => {
    expect(isValidVpaFormat('ab@ybl')).toBe(true);
  });

  it('rejects a string with no @', () => {
    expect(isValidVpaFormat('alokokhdfcbank')).toBe(false);
  });

  it('rejects a string with two @ characters', () => {
    expect(isValidVpaFormat('alok@secret.handle@okaxis')).toBe(false);
  });

  it('rejects an empty local part', () => {
    expect(isValidVpaFormat('@okhdfcbank')).toBe(false);
  });

  it('rejects an empty handle part', () => {
    expect(isValidVpaFormat('alok@')).toBe(false);
  });

  it('rejects a VPA containing whitespace', () => {
    expect(isValidVpaFormat('alok tiwari@okhdfcbank')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidVpaFormat('')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/lib/pii/vpa-format.test.ts`
Expected: FAIL — `isValidVpaFormat` is not defined (module does not exist yet).

- [ ] **Step 3: Write minimal implementation**

```typescript
/**
 * Format-only check for a UPI VPA: exactly one '@', non-empty local part and
 * handle, no whitespace. Does NOT verify the VPA resolves to a real PSP
 * account — there is no PSP integration in this product, so "valid" here
 * means "well-formed enough to embed in a upi://pay URI," nothing more.
 */
export function isValidVpaFormat(vpa: string): boolean {
  if (/\s/.test(vpa)) return false;
  const parts = vpa.split('@');
  if (parts.length !== 2) return false;
  const [local, handle] = parts;
  return local.length > 0 && handle.length > 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/lib/pii/vpa-format.test.ts`
Expected: PASS (8/8)

- [ ] **Step 5: Commit**

```bash
git add api/src/lib/pii/vpa-format.ts api/tests/lib/pii/vpa-format.test.ts
git commit -m "feat(api): add UPI VPA format validator"
```

### Task 2: `PATCH /v1/technicians/me/payment-profile`

**Files:**
- Create: `api/src/functions/payment-profile.ts`
- Test: `api/tests/unit/payment-profile.test.ts`

**Interfaces:**
- Consumes: `isValidVpaFormat` (Task 1); `patchPaymentProfile(technicianId: string, profile: PaymentProfile): Promise<void>` (existing, `api/src/cosmos/technician-repository.ts:818`, throws an `Error` with `.code === 'TECHNICIAN_NOT_FOUND'` on a 404 from Cosmos); `verifyTechnicianToken` (existing, `api/src/middleware/verifyTechnicianToken.ts`).
- Produces: `updatePaymentProfileHandler: HttpHandler`, registered at `PATCH v1/technicians/me/payment-profile`. Response body on success: `{ upiVpa: string, upiUpdatedAt: string }`.

Mirrors `api/src/functions/payout-cadence.ts` exactly (same auth pattern, same error-shape conventions) — read that file for the shape before writing this one.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/cosmos/technician-repository.js', () => ({
  patchPaymentProfile: vi.fn(),
}));
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { updatePaymentProfileHandler } from '../../src/functions/payment-profile.js';
import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';
import * as techRepo from '../../src/cosmos/technician-repository.js';

const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

function makeReq(body: unknown, auth = 'Bearer tok'): HttpRequest {
  return {
    headers: { get: (h: string) => (h.toLowerCase() === 'authorization' ? auth : null) },
    json: async () => body,
  } as unknown as HttpRequest;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-1' });
  vi.mocked(techRepo.patchPaymentProfile).mockResolvedValue(undefined);
});

describe('PATCH /v1/technicians/me/payment-profile', () => {
  it('returns 401 when token is invalid', async () => {
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('bad token'));
    const res = (await updatePaymentProfileHandler(
      makeReq({ upiVpa: 'a@b' }),
      ctx,
    )) as HttpResponseInit;
    expect(res.status).toBe(401);
    expect((res.jsonBody as any).code).toBe('UNAUTHENTICATED');
  });

  it('returns 400 when upiVpa is missing', async () => {
    const res = (await updatePaymentProfileHandler(makeReq({}), ctx)) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as any).code).toBe('INVALID_VPA');
  });

  it('returns 400 when upiVpa has no @', async () => {
    const res = (await updatePaymentProfileHandler(
      makeReq({ upiVpa: 'notavpa' }),
      ctx,
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as any).code).toBe('INVALID_VPA');
  });

  it('returns 400 when upiVpa has two @ characters', async () => {
    const res = (await updatePaymentProfileHandler(
      makeReq({ upiVpa: 'a@b@c' }),
      ctx,
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
  });

  it('returns 200 and calls patchPaymentProfile with the technician uid and a fresh upiUpdatedAt', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-12T10:00:00.000Z'));

    const res = (await updatePaymentProfileHandler(
      makeReq({ upiVpa: 'alok@okhdfcbank' }),
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect((res.jsonBody as any).upiVpa).toBe('alok@okhdfcbank');
    expect((res.jsonBody as any).upiUpdatedAt).toBe('2026-09-12T10:00:00.000Z');
    expect(techRepo.patchPaymentProfile).toHaveBeenCalledWith('tech-1', {
      upiVpa: 'alok@okhdfcbank',
      upiUpdatedAt: '2026-09-12T10:00:00.000Z',
    });

    vi.useRealTimers();
  });

  it('returns 404 when patchPaymentProfile reports TECHNICIAN_NOT_FOUND', async () => {
    vi.mocked(techRepo.patchPaymentProfile).mockRejectedValue(
      Object.assign(new Error('TECHNICIAN_NOT_FOUND'), { code: 'TECHNICIAN_NOT_FOUND' }),
    );
    const res = (await updatePaymentProfileHandler(
      makeReq({ upiVpa: 'alok@okhdfcbank' }),
      ctx,
    )) as HttpResponseInit;
    expect(res.status).toBe(404);
    expect((res.jsonBody as any).code).toBe('TECHNICIAN_NOT_FOUND');
  });

  it('returns 500 on any other repository error', async () => {
    vi.mocked(techRepo.patchPaymentProfile).mockRejectedValue(new Error('Cosmos error'));
    const res = (await updatePaymentProfileHandler(
      makeReq({ upiVpa: 'alok@okhdfcbank' }),
      ctx,
    )) as HttpResponseInit;
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/unit/payment-profile.test.ts`
Expected: FAIL — module `../../src/functions/payment-profile.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

```typescript
import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { patchPaymentProfile } from '../cosmos/technician-repository.js';
import { isValidVpaFormat } from '../lib/pii/vpa-format.js';

const UpdatePaymentProfileBodySchema = z.object({
  upiVpa: z.string().refine(isValidVpaFormat, { message: 'malformed VPA' }),
});

export const updatePaymentProfileHandler: HttpHandler = async (
  req: HttpRequest,
  ctx: InvocationContext,
) => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_VPA' } };
  }

  const parsed = UpdatePaymentProfileBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'INVALID_VPA', details: parsed.error.flatten() } };
  }

  const upiUpdatedAt = new Date().toISOString();
  try {
    await patchPaymentProfile(uid, { upiVpa: parsed.data.upiVpa, upiUpdatedAt });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'TECHNICIAN_NOT_FOUND') {
      return { status: 404, jsonBody: { code: 'TECHNICIAN_NOT_FOUND' } };
    }
    Sentry.captureException(err);
    ctx.error('patchPaymentProfile failed', err);
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }

  return { status: 200, jsonBody: { upiVpa: parsed.data.upiVpa, upiUpdatedAt } };
};

app.http('updatePaymentProfile', {
  route: 'v1/technicians/me/payment-profile',
  methods: ['PATCH'],
  authLevel: 'anonymous',
  handler: updatePaymentProfileHandler,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/unit/payment-profile.test.ts`
Expected: PASS (7/7)

- [ ] **Step 5: Register in OpenAPI + regenerate**

Add a registration entry in `api/src/openapi/registry.ts` following the pattern used for `updatePayoutCadence` (find it by searching `payout-cadence` in that file), then run `cd api && npm run openapi:build` so `api/openapi.json` picks up the new route.

- [ ] **Step 6: Commit**

```bash
git add api/src/functions/payment-profile.ts api/tests/unit/payment-profile.test.ts api/src/openapi/registry.ts api/openapi.json
git commit -m "feat(api): add PATCH /v1/technicians/me/payment-profile"
```

---

## Work Stream B — widen two existing read paths

### Task 3: Add `amountPaise` to the technician active-job response

**Field name note:** originally implemented as `amount`, renamed to `amountPaise` before merge — a parallel story (E21-S05c, technician-app cash-confirm) is independently widening this same response and had already committed to `amountPaise` (same `finalAmount ?? amount` computation) plus a sibling `paymentMethod` field. Confirmed directly against their committed plan rather than assumed, and renamed here (single reader — the not-yet-built QR builder in E24-S01b) to avoid carrying two names for one value.

**Files:**
- Modify: `api/src/functions/active-job.ts:63-76` (GET response) and `:200-213` (transition response)
- Test: `api/tests/functions/active-job.test.ts` (existing file — add cases, do not restructure it)

**Interfaces:**
- Produces: both `getActiveJobHandler` and `transitionStatusHandler` responses now include `amountPaise: number` (`booking.finalAmount ?? booking.amount`, matching the `bookingAmount` convention used everywhere else in the codebase, e.g. `api/src/services/commission-settlement.service.ts:30`).

- [ ] **Step 1: Write the failing test**

Add to `api/tests/functions/active-job.test.ts` (match its existing mock/fixture style — read the file first for its `booking` fixture shape):

```typescript
it('includes amountPaise, preferring finalAmount over amount', async () => {
  // extend the existing booking fixture with `amount: 50000, finalAmount: 65000`
  // (add-ons approved) and assert the response body's `amountPaise` is 65000.
  const res = await getActiveJobHandler(makeReq(), ctx) as HttpResponseInit;
  expect((res.jsonBody as any).amountPaise).toBe(65000);
});

it('falls back to amountPaise when finalAmount is absent', async () => {
  // fixture with `amount: 50000` and no `finalAmount` field.
  const res = await getActiveJobHandler(makeReq(), ctx) as HttpResponseInit;
  expect((res.jsonBody as any).amountPaise).toBe(50000);
});
```

(Wire these into whatever `makeReq`/fixture helpers the existing file already defines — do not invent a second set.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/functions/active-job.test.ts`
Expected: FAIL — `amountPaise` is `undefined` on the response body.

- [ ] **Step 3: Write minimal implementation**

In `getActiveJobHandler`'s return (active-job.ts:63-76), add one line:

```typescript
      addressText: normalizeAddressText(booking.addressText),
      amountPaise: booking.finalAmount ?? booking.amount,
      addressLatLng: booking.addressLatLng,
```

And identically in `transitionStatusHandler`'s return (active-job.ts:200-213):

```typescript
      addressText: normalizeAddressText(updated.addressText),
      amountPaise: updated.finalAmount ?? updated.amount,
      addressLatLng: updated.addressLatLng,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/functions/active-job.test.ts`
Expected: PASS, no regressions in the existing cases in that file.

- [ ] **Step 5: Commit**

```bash
git add api/src/functions/active-job.ts api/tests/functions/active-job.test.ts
git commit -m "feat(api): include settled amountPaise in active-job responses"
```

### Task 4: Masked technician VPA on the customer's booking read

**Files:**
- Modify: `api/src/functions/bookings.ts` — `getBookingInner` (the block starting `const id = ...params.id` through its `return`, ~line 645-666)
- Test: `api/tests/functions/bookings.test.ts` (existing — search for `getBookingHandler` or `getBookingInner` tests and add alongside them)

**Interfaces:**
- Consumes: `getTechniciansByIds(ids: string[])` (existing, `api/src/cosmos/technician-repository.ts`, returns docs with `.id`/`.technicianId`/`.paymentProfile?.upiVpa`); `maskVpa(vpa: string | null | undefined): string` (existing, `api/src/lib/pii/mask.ts`).
- Produces: `getBookingInner`'s response gains `technicianUpiMasked: string | null`.

Per `docs/stories/E09-S08-interface-notes.md` §2, a naive lookup by `technicianId` can return an unrelated technician's document. This endpoint is not a PII-disclosure path (it returns a *masked* value, never the raw VPA), so the full three-step ambiguity resolution from `reveal-contact.ts` is unnecessary — but an **exact** `id` match is still required before trusting the result, mirroring that file's first (safest) case. `booking.technicianId` is already established elsewhere in this codebase (e.g. `active-job.ts`'s `booking.technicianId !== uid` check against the Firebase-auth `uid`) to hold the technician's Firebase uid directly, so an exact-`id` match is the correct and sufficient check here — not a guess.

- [ ] **Step 1: Write the failing test**

```typescript
it('getBookingHandler includes technicianUpiMasked when the assigned technician has a VPA on file', async () => {
  // booking fixture: { ..., technicianId: 'tech-1' }
  // getTechniciansByIds mock returns [{ id: 'tech-1', technicianId: 'tech-1', paymentProfile: { upiVpa: 'alok.tiwari@okhdfcbank', upiUpdatedAt: '...' } }]
  const res = await getBookingHandler(makeReq(), ctx) as HttpResponseInit;
  expect((res.jsonBody as any).technicianUpiMasked).toBe('al••••••@okhdfcbank');
});

it('getBookingHandler returns null technicianUpiMasked when no technician is assigned yet', async () => {
  // booking fixture with technicianId: undefined
  const res = await getBookingHandler(makeReq(), ctx) as HttpResponseInit;
  expect((res.jsonBody as any).technicianUpiMasked).toBeNull();
});

it('getBookingHandler returns null technicianUpiMasked when the assigned technician has no VPA on file', async () => {
  // getTechniciansByIds mock returns [{ id: 'tech-1', technicianId: 'tech-1' }] (no paymentProfile)
  const res = await getBookingHandler(makeReq(), ctx) as HttpResponseInit;
  expect((res.jsonBody as any).technicianUpiMasked).toBeNull();
});

it('getBookingHandler returns null technicianUpiMasked when the id lookup is ambiguous (no exact id match)', async () => {
  // getTechniciansByIds mock returns docs where none has id === booking.technicianId
  // (e.g. only a technicianId-field match) — must not guess.
  const res = await getBookingHandler(makeReq(), ctx) as HttpResponseInit;
  expect((res.jsonBody as any).technicianUpiMasked).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/functions/bookings.test.ts`
Expected: FAIL — `technicianUpiMasked` is `undefined`.

- [ ] **Step 3: Write minimal implementation**

In `bookings.ts`, near the top of the file (alongside the other repository imports):

```typescript
import { getTechniciansByIds } from '../cosmos/technician-repository.js';
import { maskVpa } from '../lib/pii/mask.js';
```

Then in `getBookingInner`, before the `return`:

```typescript
  let technicianUpiMasked: string | null = null;
  if (booking.technicianId) {
    const techs = await getTechniciansByIds([booking.technicianId]);
    const exact = techs.find((t) => t.id === booking.technicianId);
    technicianUpiMasked = maskVpa(exact?.paymentProfile?.upiVpa);
  }

  return {
    status: 200,
    jsonBody: {
      bookingId: booking.id,
      status: booking.status,
      amount: booking.amount,
      finalAmount: booking.finalAmount ?? null,
      technicianUpiMasked,
      pendingAddOns: booking.pendingAddOns ?? [],
      approvedAddOns: booking.approvedAddOns ?? [],
      ...(photos !== undefined ? { photos } : {}),
      reportSignedUrl,
    },
  };
```

(`maskVpa` already returns `MASK_PLACEHOLDER` rather than throwing for `null`/`undefined`/malformed input — check `api/src/lib/pii/mask.ts` for its exact signature; if it returns a placeholder string instead of `null` for the "no VPA" case, use `exact?.paymentProfile?.upiVpa ? maskVpa(exact.paymentProfile.upiVpa) : null` instead so the client can tell "no VPA on file" apart from "masked value".)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && npx vitest run tests/functions/bookings.test.ts`
Expected: PASS, no regressions elsewhere in that file.

- [ ] **Step 5: Register in OpenAPI + regenerate**

Same as Task 2 Step 5: add the route to `api/src/openapi/registry.ts`, then `cd api && npm run openapi:build`.

- [ ] **Step 6: Commit**

```bash
git add api/src/functions/bookings.ts api/tests/functions/bookings.test.ts api/src/openapi/registry.ts api/openapi.json
git commit -m "feat(api): expose masked technician UPI VPA on customer booking read"
```

---

## Work Stream C — smoke gate + review

### Task 5: Smoke gate + Codex + push

- [ ] Run `bash tools/pre-codex-smoke-api.sh` from the repo root (or `api/`, check the script's expected cwd) — must exit 0 before proceeding. Fix any failures before invoking Codex.
- [ ] Invoke the `codex-review-gate` skill (`codex review --base main`). Fix any findings and re-run once per `feedback_codex_paired_pr_pattern`/`feedback_lean_review_stack` — do not iterate more than once without checking in.
- [ ] `git fetch origin main && git merge origin/main` before the final push.
- [ ] Push and open the PR with `gh pr merge --auto --squash` once CI is green. Note in the PR description that `plans/E24-S01b-android-upi-qr.md` (a separate PR) depends on these endpoints being live.
