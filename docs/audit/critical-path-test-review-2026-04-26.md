# Critical-Path Test Coverage Review — 2026-04-26

## Summary

- **10 critical paths reviewed** (api/ scope only — Android and admin-web tests deferred to a follow-up audit).
- **3 strong** — would catch realistic regressions across the surface they cover.
- **6 weak** — line-covered but assertions are shallow, asymmetric, or miss adversarial scenarios.
- **1 not yet implemented** — feature stubbed in the audit prompt is not present in the codebase.

| # | Critical path | Verdict |
|---|---|---|
| 1 | Auth & token verification | ⚠️ Mixed |
| 2 | Dispatcher fairness (FR-9.1) | ✅ Strong |
| 3 | Payment capture (Razorpay webhook) | ⚠️ Weak |
| 4 | Payout split (settle booking + Razorpay route) | ✅ Strong |
| 5 | SSC levy | ✅ Strong |
| 6 | Booking state machine | ⚠️ Weak |
| 7 | Customer block list (E08-S04) | ❌ Not implemented |
| 8 | Audit log immutability | ⚠️ Weak |
| 9 | Rating doc reveal | ⚠️ Weak |
| 10 | Karnataka right-to-refuse | ⚠️ Weak |

## Methodology

For each critical path:
1. Located the source under review.
2. Located the test file(s) exercising it.
3. Asked: "If a developer changed `<` to `<=`, swapped `&&` for `||`, off-by-oned a loop, removed a Zod `safeParse`, swapped a real signature check for a noop, or inverted an `isCustomer`/`isTechnician` branch — would the existing tests fail?"
4. Categorized: ✅ would catch / ⚠️ might catch but not deterministic / ❌ would not catch.
5. For ✅, named the specific test file + assertion that closes the regression scenario.

---

## Path-by-path findings

### 1. Auth & token verification ⚠️ Mixed

**Source:**
- `api/src/services/firebaseAdmin.ts` (`verifyFirebaseIdToken`)
- `api/src/middleware/verifyTechnicianToken.ts` (Bearer parse + verify)
- `api/src/middleware/requireAdmin.ts` (cookie JWT + session + role)
- `api/src/middleware/requireCustomer.ts` (Bearer + Firebase verify)

**Tests:**
- `api/tests/unit/requireAdmin.test.ts` — 5 tests, cookie/JWT/session/role/success
- `api/tests/unit/requireCustomer.test.ts` — 3 tests, no header / bad token / valid
- `api/tests/integration/auth.integration.test.ts` — login flow with TOTP, ~9 tests
- `api/tests/integration/rbac.integration.test.ts` — 8-test role matrix

**Assertions checked:**
| Scenario | requireAdmin (cookie path) | requireCustomer (Bearer path) | verifyTechnicianToken (Bearer path) |
|---|---|---|---|
| Missing credential | ✅ `requireAdmin.test.ts:32-37` | ✅ `requireCustomer.test.ts:23-27` | ❌ no test file |
| Malformed credential | ✅ `requireAdmin.test.ts:39-44` (`not.a.valid.jwt`) | ⚠️ only `'Bearer bad'` tested — no test for `'Bearer '` (empty), `'bearer xyz'` (lowercase, the `replace` is case-sensitive), or `'Bearer\txyz'` | ❌ no test file |
| Expired token | ⚠️ session-expired (`requireAdmin.test.ts:46-53`) tests session, not token expiry; Firebase mock never returns "expired" error | ❌ no test | ❌ no test file |
| Wrong audience/issuer | ❌ Firebase SDK is responsible; never asserted | ❌ never asserted | ❌ no test file |
| Valid → handler invoked with right context | ✅ `requireAdmin.test.ts:64-74` (asserts `adminId/role/sessionId` shape) | ✅ `requireCustomer.test.ts:35-39` | ❌ no test file |
| Role-based authorisation | ✅ `rbac.integration.test.ts` — 8 role-matrix permutations | n/a | n/a |

**Specific weaknesses:**
- `verifyTechnicianToken` (the technician-side authentication used in 19 handlers) has **zero direct unit tests**. The Bearer parsing logic — `authorization.replace('Bearer ', '')` — has a sharp edge: if a future refactor changes the prefix to lowercase or omits the space, no test fails. The middleware is mocked in every consumer test, so the parse logic itself is never exercised under test.
- `firebaseAdmin.getFirebaseAdmin()` initialization (env var presence, `\\n` → `\n` private-key normalization) has no test. A regression in private-key parsing fails only at deploy time.
- `requireCustomer` is only 3 tests deep. Lowercase `bearer` and empty Bearer (`'Bearer '` with no token) are not covered.

**Recommendation:** Add `tests/unit/verifyTechnicianToken.test.ts` covering the Bearer parse edges, and add 2 tests to `requireCustomer.test.ts` for lowercase/empty Bearer. (Issue filed.)

---

### 2. Dispatcher fairness (FR-9.1) ✅ Strong

**Source:** `api/src/services/dispatcher.service.ts:15-32` (`rankTechnicians`).

**Tests:**
- `api/tests/services/dispatcher.service.test.ts` — smoke (2 tests)
- `api/tests/unit/dispatcher.service.test.ts` — 13 tests including ranking, dispatch lifecycle, redispatch, exclude logic
- `api/tests/integration/dispatcher-up-ranking.test.ts` — 4 tests: invariance to simulated decline, stability across permutations, schema-shape check, **phantom decline-field adversarial test** (`dispatcher-up-ranking.test.ts:86-111`)
- `api/tests/integration/dispatcher-data-isolation.test.ts` — file-scan + schema-shape gate against `declineCount`/`acceptRate`/etc. across 5 source files

**Adversarial scenarios that would be caught:**
- A new `declineCount` field added to `TechnicianProfile` → caught by both the file-scan (`dispatcher-data-isolation.test.ts:55-66`) and the schema-shape check (`:68-80`).
- `rankTechnicians` mutated to factor in any decline-derived term (even a tied positive framing like `acceptRate`) → caught by the data-isolation file-scan over `dispatcher.service.ts`, plus the phantom-decline-field test in `dispatcher-up-ranking.test.ts:86-111`.
- Sort order inverted (`b - a` instead of `a - b` on distance) → caught by all distance-ordering assertions.

**Verdict:** ✅ This path is the project's gold standard. Multiple complementary layers (runtime ranking + schema introspection + file-scan + Semgrep rule referenced at `dispatcher-data-isolation.test.ts:11`) make a quiet regression effectively impossible.

**Recommendation:** none.

---

### 3. Payment capture (Razorpay webhook) ⚠️ Weak

**Source:** `api/src/functions/webhooks.ts` (`razorpayWebhookHandler`).

**Tests:** `api/tests/webhooks/razorpay-webhook.test.ts` — 4 tests.

**Assertions checked:**
- 500 on missing `RAZORPAY_WEBHOOK_SECRET` ✅ (`razorpay-webhook.test.ts:43-51`)
- 400 on bad signature ✅ (`:53-59`)
- Happy path: `markPaid` + `triggerDispatch` invoked ✅ (`:61-84`)
- Idempotency: second call on already-`PAID` booking is a no-op ✅ (`:86-103`)

**Weaknesses:**
- **Signature comparison is not timing-safe.** `webhooks.ts:17` uses `expected !== signature` (lexicographic compare) instead of `crypto.timingSafeEqual`. No test catches this (and a test couldn't directly — but a Semgrep rule could).
- **No test for malformed JSON body** (`PARSE_ERROR` branch at `webhooks.ts:30`).
- **No test for unknown event type** (`event !== 'payment.captured'` branch returning 200 with `{received: true}` at `webhooks.ts:34`). A regression that flipped this to 400 would silently break Razorpay's webhook retry contract.
- **No test for `getByPaymentOrderId` returning null** (orphan-order branch at `webhooks.ts:42`).
- **No test for `markPaid` returning null** (race / wrong-state branch at `webhooks.ts:50`).
- **No test verifies that a thrown `dispatcherService.triggerDispatch` does not fail the webhook ack.** The fire-and-forget `.catch(() => {})` at `webhooks.ts:55` is a deliberate design choice, but no test pins it.

**Verdict:** ⚠️ Happy path + signature validation are covered. Several branches and the timing-safe comparison are not. A regression that changed `parsed.event !== 'payment.captured'` to `parsed.event === 'payment.captured'` would be caught (the happy-path assertion would fail), but a regression that swapped `400` for `200` on bad JSON would not.

**Recommendation:** add 4 tests (malformed JSON, unknown event, orphan order, dispatch-throws-but-webhook-OK), and replace `!==` with `crypto.timingSafeEqual` (separate code change, not part of this audit).

---

### 4. Payout split (settle booking + Razorpay route) ✅ Strong

**Source:**
- `api/src/functions/trigger-booking-completed.ts` (`settleBooking`)
- `api/src/services/razorpayRoute.service.ts`

**Tests:**
- `api/tests/unit/trigger-booking-completed.test.ts` — 18 tests
- `api/tests/services/razorpayRoute.service.test.ts` — 4 tests

**Strong assertions:**
- Audit-call ordering: `trigger-booking-completed.test.ts:153-169` builds a `callOrder` array and asserts `audit:ROUTE_TRANSFER_ATTEMPT` precedes the Razorpay call. A regression that moved the audit after the transfer would fail this.
- 22% vs 25% commission tiers tested with exact paise values (`:127-149`).
- `bookingId` used as Razorpay idempotency key (`:109-115`) — protects against double-credit on retry.
- Concurrent-fire idempotency: `createPendingEntry` returning `false` short-circuits before transfer (`:101-107`).
- `markFailed` + audit `ROUTE_TRANSFER_FAILED` on Razorpay error, with `markPaid` NOT called (`:193-200`).
- `incrementCompletedJobCount` only on success, never on failure (`:215-224`).
- Razorpay route service: `currency: 'INR'`, `on_hold: 0`, idempotency-key header propagation (`razorpayRoute.service.test.ts:27-61`).

**Minor gaps:**
- The success path does not assert what `walletLedgerRepo.markPaid` is called with — i.e. that it receives `(bookingId, technicianId, transferId)` in that exact order. A regression that swapped argument positions would not be caught.
- No test that asserts `audit:ROUTE_TRANSFER_SUCCESS` payload contains the actual `transferId` and `techAmount` (the `successCall` test at `:171-178` only checks the action name).

**Verdict:** ✅ Strong. The two minor gaps are worth filing but do not undermine the path's overall robustness.

**Recommendation:** add explicit `markPaid` argument-order assertion and `ROUTE_TRANSFER_SUCCESS` payload-content assertion. (Issue filed.)

---

### 5. SSC levy ✅ Strong

**Source:** `api/src/functions/admin/compliance/ssc-levy.ts`.

**Tests:** `api/tests/functions/admin/compliance/ssc-levy.test.ts` — 14 tests across timer + approve handler.

**Strong assertions:**
- Timer creates `PENDING_APPROVAL` with exact `levyAmount` math (₹1,00,000 GMV → ₹1,000 levy at 1%) (`ssc-levy.test.ts:80-94`).
- Replay-after-crash: existing `PENDING_APPROVAL` levy → notifications retried, no re-create (`:96-111`).
- 409 conflict on `createLevy` → notifications retried (`:156-176`).
- All-notifications-fail → throws to trigger Azure retry (`:193-206`).
- `approveSscLevyHandler` retries on `FAILED` and **on `APPROVED` stuck** (`:240-267`) — the latter is a subtle crashed-mid-flight scenario.
- **`ssc-levy.test.ts:302-321` — gold-tier test:** transfer succeeded but DB write fails → returns 500 (not 502), does NOT mark `FAILED` (because money already moved). Asserts that `updateLevy` was called exactly twice and the second call had status `TRANSFERRED`, not `FAILED`. This is the kind of test that catches "fix the symptom, not the cause" regressions.

**Minor gaps:**
- `computeLevyAmount` math is asserted only at `gmv = 10_000_000`. No test for `gmv = 0`, fractional rounding (`gmv = 33_333` → expected `333` paise), or extreme values.

**Verdict:** ✅ Strong. The mid-flight failure-isolation test alone closes the most dangerous regression scenario.

**Recommendation:** add 3 boundary tests for `computeLevyAmount` (0, fractional, max). (Issue filed — low priority.)

---

### 6. Booking state machine ⚠️ Weak

**Source:** `api/src/cosmos/booking-repository.ts`.

**Tests:**
- `api/tests/cosmos/booking-repository-markPaid.test.ts` — 5 tests
- `api/tests/cosmos/booking-repository-getByPaymentOrderId.test.ts` — 4 tests
- `api/tests/cosmos/booking-repository-getStaleSearching.test.ts` — 3 tests

**Strong assertions (markPaid only):**
- Not-found returns null without write (`markPaid.test.ts:42-49`).
- `PENDING_PAYMENT → PAID` transition writes correctly (`:51-64`).
- `ASSIGNED → PAID` rejected, returns null without write (`:66-74`) — would catch a regression that loosened the guard.
- `SEARCHING → PAID` happy path (`:76-89`).
- `PAID` (already-paid) returns null without re-write (`:91-99`) — idempotency.
- `confirmPayment` returns existing PAID booking on idempotent retry (`:105-113`).

**Critical gaps:**
- **`bookingRepo.confirmPayment` PENDING_PAYMENT → SEARCHING happy path NOT tested.** Only the PAID-idempotency branch is tested. A regression that broke the normal "client confirms after webhook miss" path would not be caught.
- **`bookingRepo.requestAddOn`** (status guard `IN_PROGRESS → AWAITING_PRICE_APPROVAL`, append to `pendingAddOns`) — **NO TEST.**
- **`bookingRepo.applyAddOnDecisions`** (customer-id guard, status guard, finalAmount calculation `existing.amount + sum(approved.price)`) — **NO TEST.** A regression that summed all `pendingAddOns` (including rejected) would silently overcharge customers.
- **`bookingRepo.addPhoto`** (ETag optimistic concurrency, multi-photo append per stage) — **NO TEST.** The ETag race-loss path is critical for preventing photo loss under concurrent uploads.
- **`bookingRepo.markSosActivated`** (already-activated short-circuit, ETag 412 catch) — **NO TEST.** This handles a safety-critical state transition.
- **`updateBookingFields`** (the generic field-merger used by ~20 callers) — **NO TEST.** Any caller passing an unintended `status` field would silently overwrite the booking status.

**Verdict:** ⚠️ The most-critical state transition (`markPaid`) is well-guarded; the rest of the state machine is largely untested. Several of the gaps (`applyAddOnDecisions`, `addPhoto` ETag, `markSosActivated`) involve money or safety.

**Recommendation:** add unit tests for the 5 untested transitions, with focus on guard-rejection paths. (Issue filed.)

---

### 7. Customer block list (E08-S04) ❌ Not implemented

**Search:** `grep -r "blockedCustomerIds\|blocklist\|blocked.*customer"` across `api/` returned **zero matches**.

The audit prompt names this as a critical path with the regression scenario "doesn't honor blockedCustomerIds = tech safety incident." Since the feature is not yet present in the codebase, there is nothing to test.

**Verdict:** ❌ Not implemented. This is not a test gap — it is a feature gap. Either E08-S04 has been deferred, or it lives outside `api/` in a place I did not find. Worth confirming with the sprint plan before filing.

**Recommendation:** confirm story status and either (a) close as "feature deferred" or (b) when implementation lands, ensure the dispatcher integration test seeds a blocked technician and asserts that the `rankTechnicians` candidate set excludes them. (Issue filed.)

---

### 8. Audit log immutability ⚠️ Weak

**Source:**
- `api/src/cosmos/audit-log-repository.ts` — exports only `appendAuditEntry` and `queryAuditLog`. **No update or delete methods exist.**
- `api/src/functions/admin/audit-log/list.ts` — read-only handler, super-admin gated.

**Tests:**
- `api/tests/cosmos/audit-log-repository.test.ts` — 8 tests covering append, query, error propagation, partitionKey stripping, continuation tokens.
- `api/tests/functions/admin/audit-log/list.test.ts` — 6 tests covering 401 / 403 / 200 / 400 / filter forwarding / continuation forwarding.

**What's covered:**
- Append writes the full doc (`audit-log-repository.test.ts:46-50`).
- Cosmos errors propagate to caller (`:52-55`).
- Query parameters bind correctly; partitionKey is stripped on read; continuation tokens round-trip.
- 401/403 enforcement on the admin handler is solid.

**The gap:**
- **No test asserts that the immutability invariant holds.** The legal exposure is "any path that allows mutation/deletion." Today the invariant holds **only by convention** — no `updateAuditEntry`, no `deleteAuditEntry`, no PUT/DELETE handler. A future PR that adds a mutation method or admin endpoint would not break any test.
- The dispatcher path solved this exact pattern with `dispatcher-data-isolation.test.ts` (file-scan + schema introspection). The audit-log path needs the same: a test that scans `audit-log-repository.ts` and asserts no `.replace(`/`.delete(`/`PUT`/`DELETE` calls touch the `audit_log` container; or a structural test asserting the module's exported surface contains exactly `{appendAuditEntry, queryAuditLog}`.

**Verdict:** ⚠️ Append/query mechanics are well-tested. The immutability invariant — the whole reason this path is critical — has zero defensive coverage.

**Recommendation:** add `tests/cosmos/audit-log-immutability.test.ts` modeled on `dispatcher-data-isolation.test.ts`. (Issue filed — high priority given legal exposure framing.)

---

### 9. Rating doc reveal ⚠️ Weak (asymmetric coverage)

**Source:** `api/src/functions/ratings.ts:101-145` (`getRatingHandler`).

The reveal logic at `ratings.ts:128-129` is:
```ts
const customerVisible = revealed || (isCustomer && customerHas);
const techVisible = revealed || (isTechnician && techHas);
```
This is symmetric: each party can always see their own submitted side; the other side only after mutual reveal. A regression that flipped `isCustomer` ↔ `isTechnician` in either branch would leak one direction.

**Tests:** `api/tests/unit/ratings.test.ts` — 11 tests.

**Covered:**
- 401/403/404 paths ✅
- Customer caller, only customer submitted: customer side is `SUBMITTED` for them, tech side is `PENDING` ✅ (`ratings.test.ts:129-141`)
- Both submitted: full reveal of both sides ✅ (`:143-158`)
- No rating doc: `PENDING` ✅ (`:160-166`)

**The gap — only one direction of the asymmetric branch is tested:**
- **No test for technician caller, only technician submitted.** A regression that wrote `customerVisible = revealed || (isTechnician && techHas)` (swapping `isCustomer` for `isTechnician`) would not be caught — the customer-only-submitted test would still pass because `isCustomer && customerHas` would still let the customer see their own side; but a customer querying after only the tech submitted would now (incorrectly) see the tech side. That symmetric scenario is not tested.
- **No test for "customer caller queries when only tech has submitted".** The expected behaviour is `customerSide.status === 'PENDING'`, `techSide.status === 'PENDING'` (because `customerHas = false` → `customerVisible = false` for the customer's own side; and `techVisible = false` because not the tech). This is the exact scenario that "reveals one side before mutual" would break.
- **No test for "technician caller queries when only customer has submitted"** — symmetric to above, also untested.

**Verdict:** ⚠️ The most-important regression scenario for this path ("a regression that reveals one side before mutual") is **not deterministically guarded**. The asymmetric reveal logic has 50% coverage.

**Recommendation:** add 3 tests for the missing reveal-direction permutations. (Issue filed — high priority given trust-system framing.)

---

### 10. Karnataka right-to-refuse ⚠️ Weak

**Source:**
- `api/src/services/dispatcher.service.ts` — no decline-related code (decline does not penalize; dispatcher fans out to `TOP_N = 3` techs and the first acceptor wins, others get `OFFER_CANCELLED`).
- `api/src/functions/job-offers.ts:50-67` (`declineJobOfferHandler`).

**Tests:**
- `api/tests/bookings/accept-decline.test.ts` — 6 tests for accept, 2 for decline.
- `api/tests/integration/dispatcher-data-isolation.test.ts` — already covered above.

**Strong assertions on the decline path itself:**
- Decline returns 200 and does NOT call `updateBookingFields` or `acceptAttempt` (`accept-decline.test.ts:160-172`) — confirms decline is a no-op state-wise.
- Decline appends `TECH_DECLINED` event with **no `ranking`, `score`, or `dispatchScore` field** on the payload (`:174-189`) — adversarial check that ranking metadata cannot leak into the event log via decline.

**The gap — the offer-expiration timer is completely untested:**
- `job-offers.ts:81-104` (`expireStaleOffers`) is the function that handles "all 3 techs declined or ignored, 30s elapsed → mark booking UNFULFILLED, transition attempt to EXPIRED, append `OFFER_EXPIRED` event". **There is no test file for this.**
- A regression that, say, removed the `await updateBookingFields(attempt.bookingId, { status: 'UNFULFILLED' })` line (`job-offers.ts:97`) would leave bookings stuck in `SEARCHING` indefinitely — and no test would fail.
- A regression that swapped the ETag `IfMatch` precondition for an unconditional `replace` (`job-offers.ts:95`) would re-introduce the lost-update class of bug; no test catches it.

**Verdict:** ⚠️ The decline-handler itself is well-tested (no penalty leaks into events). The fallback path — what happens when all candidates decline or ignore — is untested.

**Recommendation:** add `tests/functions/job-offers-expire-stale.test.ts` covering: stale attempt found → status flipped to EXPIRED with ETag, booking marked UNFULFILLED, `OFFER_EXPIRED` event appended; ETag-loss path skipped silently. (Issue filed.)

---

## Patterns observed

**Consistent strengths:**
- The dispatcher and SSC-levy paths show **layered defense**: behavioural tests + adversarial tests + file-scan/schema introspection. The `audit:ROUTE_TRANSFER_ATTEMPT` call-ordering test in `trigger-booking-completed.test.ts:153-169` and the post-transfer-DB-fail test in `ssc-levy.test.ts:302-321` are both examples of tests that assert *invariants*, not just *behaviour*.
- Idempotency keys are explicitly asserted in every money path (Razorpay idempotency-key header, `bookingId` as the key for transfers, levy-id namespaced key for the SSC fund).

**Consistent weaknesses:**
- **Asymmetric branches with one direction untested.** Seen in rating reveal (path 9) and arguably in token-verification (path 1, where the cookie path is well-tested but the Bearer path lags). When a function has two symmetric branches (e.g. `isCustomer` vs `isTechnician`), tests should cover both — current pattern is to test one and trust the other.
- **Mock-shaped tests that never exercise integration seams.** `verifyFirebaseIdToken` is mocked in 7 test files; the actual function has no test of its own. `RazorpayRouteService.transfer` is well-mocked but the SDK boundary (what happens if `transfers.create` returns no `id` or throws a typed error) is not asserted.
- **Repository methods that are not in the "happy path" of a foundation story tend to be untested.** `bookingRepo.{requestAddOn,applyAddOnDecisions,addPhoto,markSosActivated,updateBookingFields}` are all in production but uncovered.
- **Defensive "this thing must NOT exist" tests are absent except where Karnataka forced them.** The audit-log path needs the same pattern that `dispatcher-data-isolation.test.ts` established. Generalize the pattern.

## Recommendations — top 3 to harden first

1. **Audit log immutability** (path 8) — add a Karnataka-style file-scan + structural-export test to `tests/cosmos/audit-log-immutability.test.ts`. Highest ROI: legal exposure if breached, cheap to write, single canonical pattern already in the repo.
2. **Rating doc reveal** (path 9) — add 3 tests for the missing reveal-direction permutations (technician sees own side; customer does NOT see tech side when only tech submitted; technician does NOT see customer side when only customer submitted). Closes the most-likely-mutation regression on a trust-critical handler.
3. **Booking state machine** (path 6) — add unit tests for `applyAddOnDecisions` (overcharge risk), `addPhoto` ETag (photo-loss risk), `markSosActivated` (safety-critical), and `confirmPayment` happy-path. The current coverage is concentrated on `markPaid`; the rest is bare.

After those, the next tier:
4. Verifier-side auth (verifyTechnicianToken + lowercase/empty-Bearer for requireCustomer).
5. Razorpay webhook branch coverage.
6. Karnataka right-to-refuse expireStaleOffers timer.

The 3 ✅-strong paths (dispatcher, SSC-levy, payout split) need only minor polish; do not invest there until the ⚠️ tier is closed.
