# E21-S05 — Technician KYC completion, wallet, cash confirm, dues banner (design)

- **Date:** 2026-09-12
- **Tier:** Foundation (auth/KYC-adjacent, consumes the E21-S04 accept-contract, money-adjacent via cash collection)
- **Sub-project:** `technician-app/` (primary) + `api/` (KYC endpoints only — no dispatch or ledger changes)
- **Branch / worktree:** `feat/e21-s05-technician-kyc-wallet` in `C:/Alok/Business Projects/wt-e21-s05`, cut from `origin/main` @ `52ba5d8c`.
- **Builds on:** `docs/stories/E21-S04-interface-notes.md` (the accept contract this story consumes), `docs/adr/0032-commission-hold-is-an-eligibility-gate.md` (the KYC two-fact predicate and the ordering-gap this story closes).
- **Coordinates with:** E24-S01 (session-1, UPI QR collection) sequences its `collectionMethod: UPI_QR` addition on top of this story's `CompletionConfirmationDialog.kt` changes. E22-S02 and E24-S01 are otherwise independent parallel streams on the same `origin/main`.

---

## 1. What this story is

E21-S04 wired the commission-hold cache into dispatch and accept, and defined — but did not build a UI for — the client-facing accept contract (`403 COMMISSION_HOLD_BLOCKED` / `503 HOLD_CHECK_UNAVAILABLE`). Separately, the existing KYC flow (built pre-E21-S04) has a real, already-shipped bug: a technician who submits PAN first has no route to a completable verified state, and `KycViewModel.submitPan()` today renders `KycUiState.Complete(status = KycStatus.PAN_DONE)` on bare PAN success — a false "you're done" screen regardless of whether Aadhaar ever ran.

This story does four things:

1. **Closes the KYC ordering gap** at the data layer (a real `COMPLETE` terminal state with a single writer, order-independent) and the flow layer (PAN step is blocked until Aadhaar succeeds).
2. **Builds the technician-app wallet screen** — read-only balance/receivables view sourced from the existing E21-S02 commission endpoints.
3. **Wires cash collection** into `CompletionConfirmationDialog.kt` (amount entry, `collectionMethod` defaulting to `CASH`) — the API already accepts these fields; the client has never sent them.
4. **Builds the dues banner** (home screen, `WARN`/`BLOCKED`) and the accept-contract client handling (`JobOfferUiState.BlockedByDues` / transient-retry on `503`).

### Non-goals

- **`enforceKycInDispatch` is not flipped, and `dispatch-eligibility.ts` is not touched.** Per the interface notes' explicit blocker, the flag stays off regardless of what this story ships — flipping it is a separate owner decision gated on this ordering fix being verified against prod data, not merely code-reviewed.
- **No in-app payment collection for dues.** The wallet's "settle" CTA is an external deep link (contact admin), not a Razorpay checkout. Adding in-app remittance is a future story if ever needed.
- **`collectionMethod: UPI_QR`** is E24-S01's addition on top of this story's dialog — not built here.
- **No changes to the commission ledger, allocator, or `commissionHold` computation.** This story is a read-only consumer of E21-S02/S04's existing endpoints plus the two narrowly-scoped KYC endpoint changes in §2.
- **No admin-facing changes.** The admin console's KYC/commission views are untouched.

---

## 2. Closing the KYC ordering gap

### 2.1 The bug, precisely

- `submit-aadhaar.ts` writes `aadhaarVerified: true|false` and a `kycStatus` of `AADHAAR_DONE` or `PENDING_MANUAL`.
- `submit-pan-ocr.ts` writes `panHash`/`panMaskedNumber` and a `kycStatus` of `PAN_DONE` or `MANUAL_REVIEW` — **unconditionally**, with no check that `aadhaarVerified` is `true`.
- No code path anywhere writes `kycStatus: 'COMPLETE'`, the one value in `KycStatusSchema` that could mean "both done."
- Client-side, `KycViewModel.submitPan()` maps a bare PAN-OCR success straight to `KycUiState.Complete(status = KycStatus.PAN_DONE)` — a UI that reads as finished regardless of Aadhaar state. This is a pre-existing bug this story fixes, not new code introduced by this story.

### 2.2 The fix

**A single shared helper, `deriveKycStatus({ aadhaarVerified, panHash })`**, added to `technician-repository.ts` next to `upsertKycStatus`:

```ts
function deriveKycStatus(kyc: { aadhaarVerified: boolean; panHash: string | null | undefined }): KycStatus {
  const panVerified = kyc.panHash != null; // present AND non-null
  if (kyc.aadhaarVerified && panVerified) return 'COMPLETE';
  if (panVerified) return 'PAN_DONE';
  if (kyc.aadhaarVerified) return 'AADHAAR_DONE';
  return 'PENDING';
}
```

Both `submit-aadhaar.ts` and `submit-pan-ocr.ts` call this **after** their `upsertKycStatus` write, reading back the merged document, and use its result as the `kycStatus` they persist and return — replacing today's hardcoded literals (`'AADHAAR_DONE'`, `'PAN_DONE'`). This is the single writer for `COMPLETE`; it is correct in either completion order by construction, matching the two-fact predicate `dispatch-eligibility.ts` already uses (ADR-0032 §"The replacement reads two independent per-step facts"). `MANUAL_REVIEW` / `PENDING_MANUAL` (rejection paths) are set directly as today — a rejection is not an input to `deriveKycStatus`, it overrides it.

**`submit-pan-ocr.ts` gets a new precondition**, before calling `extractPanFromStoragePath` (avoids spending an OCR call on a submission that structurally cannot complete):

```ts
const kyc = await getKycByTechnicianId(technicianId);
if (kyc?.aadhaarVerified !== true) {
  return { status: 409, jsonBody: { code: 'AADHAAR_REQUIRED_FIRST' } };
}
```

This makes PAN-first structurally impossible going forward. It does **not** retroactively fix any of the 16 current prod technicians (all of whom have no `kyc` object at all today, per the interface notes — zero are PAN-first already, so no backfill is needed; confirm this count is unchanged immediately before merge as a smoke-gate check, not an assumption).

**`trigger-projector-kyc.ts` must follow the new terminal state.** It currently treats
`COMPLETE_STATUSES = new Set(['COMPLETE', 'AADHAAR_DONE', 'PAN_DONE'])` and **resolves** the
`KYC_RESUME` pending action — the "finish your KYC" reminder — on any of them. So a technician who
finishes only Aadhaar has their reminder cleared while a step is still outstanding: the same
"looks done, isn't done" failure at the notification layer. With a real terminal state this
becomes `COMPLETE_STATUSES = new Set(['COMPLETE'])`, and `AADHAAR_DONE` / `PAN_DONE` move into
`ACTION_REQUIRED_STATUSES` so the reminder persists until both steps land. Without this change the
story would write a correct terminal value that nothing downstream respects.

**`get-kyc-status.ts`** adds `panVerified: boolean` to its response (computed the same way, `panHash != null`, after the existing canonical-mask validation) — the client keys UI off explicit `aadhaarVerified`/`panVerified` booleans, never off `kycStatus` as a trust boundary, mirroring dispatch's own posture per the interface notes ("derive from the same two facts dispatch uses, not from `kyc.kycStatus`"). `kycStatus` is still returned and now trustworthy, but is treated as display-only, not as the completion fact.

### 2.3 Android: KYC flow becomes sequential

- `KycState` gains `panVerified: Boolean` (mirrors the new API field) alongside the existing `aadhaarVerified: Boolean`.
- `KycUiState` gains `AadhaarRequired` — shown if the PAN step is somehow reached before Aadhaar (defensive; the screen shouldn't allow this, but a stale nav state or the `409` response could produce it).
- `KycScreen`'s PAN card is disabled until `aadhaarVerified == true` is observed from `fetchCurrentStatus()`.
- `KycUiState.Complete` is only reached when both `aadhaarVerified && panVerified` are true — fixing `submitPan()`'s current bug. A bare PAN-OCR success with Aadhaar still pending renders `PanDone` (a new, honest "one step left" state), not `Complete`.
- `409 AADHAAR_REQUIRED_FIRST` maps to `KycUiState.AadhaarRequired`.

---

## 3. Wallet screen

Read-only, and **entirely client-side — no API work.** `GET /v1/technicians/me/commission-due` already exists (`api/src/functions/technicians/commission-due.ts`, `verifyTechnicianToken`) and returns exactly what the wallet needs. E21-S02 built it; the technician app has never consumed it (zero matches for `commission-due` in `technician-app/app/src/main`).

Response shape (`TechnicianCommissionDueV2Schema`, `api/src/schemas/commission-receivable.ts:153-202`):

```
totalOutstandingPaise: int, dueCount: int,
hold: { state: 'CLEAR'|'WARN'|'BLOCKED', warnPaise: int, blockPaise: int,
        enforcementEnabled: bool, override?: { until, reason } },
entries: [{ bookingId, serviceName?, slotDate?, bookingAmount, cashCollectedAmount?,
            commissionDue, remittedAmount, outstandingPaise, collectionMethod?,
            remittanceStatus, createdAt }],
remittances: [...], credits: [...], weekSummary: {...}
```

**Naming trap:** this endpoint spells the block threshold `hold.blockPaise`; the accept-path `403` body spells the same concept `blockThresholdPaise`. Both names are correct in their own response. Use each verbatim; do not normalise one into the other.

- Displays: hold state chip (`CLEAR`/`WARN`/`BLOCKED`), `totalOutstandingPaise`, `hold.blockPaise`, and the `entries[]` list.
- "Contact admin to settle" CTA — a WhatsApp intent to the real support number (**blocking input: Alok to supply the number**). The existing contact in `TechnicianHomeScreen.kt:988-1010` is the placeholder `tel:+919876543210` plus `partners@homeheroo.in`, which conflicts with `support@homeheroo.in` in `strings.xml:91`. The real number is extracted to `strings.xml` + `values-hi/strings.xml` and reused for both the wallet CTA and the existing home-screen support entry, retiring the placeholder.
- No payment SDK, no Razorpay integration, no new endpoint of any kind.

---

## 4. Cash confirm — `CompletionConfirmationDialog.kt`

Currently a bare confirm/cancel `AlertDialog` with no fields.

**Required API widening (forced by correctness).** The active-job `GET` response
(`api/src/functions/active-job.ts:62-74`) carries neither an amount nor a payment method, so the
client cannot currently tell a cash booking from a prepaid one. It gains two fields:

- `amountPaise: booking.finalAmount ?? booking.amount` — the expected collection amount.
- `paymentMethod: booking.paymentMethod ?? 'CASH_ON_SERVICE'` — `'RAZORPAY' | 'CASH_ON_SERVICE'`.

Both are additive read-path widenings (no write schema tightened — `feedback_read_path_validation`).
Without `paymentMethod` the dialog would ask for cash on a prepaid Razorpay booking, which
`settleCashCompletion` skips entirely (`skipped: 'NOT_CASH'`).

**The commission is computed server-side** from `finalAmount ?? amount`
(`commission-settlement.service.ts:46`), never from the client's `collectedAmount`. A mistyped
amount therefore corrupts the *collection record*, not the debt owed — which is why an editable
amount field is acceptable at all.

The dialog gains:

- Cash UI shown **only** when `paymentMethod == 'CASH_ON_SERVICE'`. Prepaid bookings keep today's
  plain confirm/cancel dialog unchanged.
- An amount field pre-filled with `amountPaise`, editable downward.
- **Short collection (in scope).** If the entered amount is below `amountPaise`, a reason picker
  becomes required and `shortCollectionReason` is sent. The API already accepts this field.
- `collectionMethod` fixed to `CASH` (no picker — E24-S01 adds the picker with `UPI_QR`).
- On confirm, `COMPLETE_JOB` includes `cashCollected: true, collectedAmount, collectionMethod: 'CASH'`
  and `shortCollectionReason` when applicable.

**Offline replay gap (in scope).** `PendingTransitionEntity` stores only
`(id, bookingId, targetStatus, createdAt, retryCount)` and `syncPendingTransitions()` replays
`TransitionRequest(entry.targetStatus)` alone — a completion queued offline reaches the server with
no cash fields at all. The commission debt is still created correctly server-side, but the
collection record (`cashCollectionStatus` / `cashCollectedAt` / `cashCollectedAmount`) and the
`CASH_COLLECTION_RECORDED` audit entry are lost. Rural Ayodhya connectivity makes offline
completion a normal case, so this story adds the cash fields to the Room entity (with a migration)
and threads them through the replay path.

**Coordination note for E24-S01:** this story's dialog changes land first; E24-S01 sequences its
`UPI_QR` collection-method option on top of the resulting dialog shape (per Alok's decision,
relayed to session-1).

---

## 5. Dues banner

- New composable on `TechnicianHomeScreen`, driven by the technician's hold state (sourced from the same commission-receivables read the wallet screen uses, or a lighter existing summary endpoint if one exists — confirm during execution which is cheaper to poll from the home screen).
- Shown at `WARN` ("You owe ₹X — pay soon to keep receiving jobs") and `BLOCKED` ("You owe ₹X — job offers are paused until you pay"), each linking to `WalletScreen`.
- Not shown on `JobOfferScreen` — that screen only reacts to a real `403`, per §6. No pre-emptive dues messaging there.

---

## 6. Job-offer accept-gate client handling

`JobOfferResult` gains two variants:

```kotlin
public data class BlockedByDues(
    val outstandingPaise: Long,
    val blockThresholdPaise: Long,
) : JobOfferResult()

public data object HoldCheckUnavailable : JobOfferResult()
```

Mapped from the accept call's response:

- **`403 { code: 'COMMISSION_HOLD_BLOCKED', outstandingPaise, blockThresholdPaise }`** → `JobOfferResult.BlockedByDues`. The offer is already declined server-side and dispatch has moved to the next candidate — **the client must not retry this booking.**
- **`503 { code: 'HOLD_CHECK_UNAVAILABLE' }`** → `JobOfferResult.HoldCheckUnavailable`. The offer is still `PENDING`; the existing retry-within-window behavior applies unchanged, and **no dues message is shown** — this is a transient server condition, not a balance. Any fallback-timing copy or logic in this path uses **~120 seconds** (90s offer window + up to a 30s sweep tick), not 30 — per the interface notes' explicit correction.

`JobOfferUiState` gains:

```kotlin
public data class BlockedByDues(
    val outstandingPaise: Long,
    val blockThresholdPaise: Long,
) : JobOfferUiState()
```

Terminal state (no retry button) with a wallet CTA. `HoldCheckUnavailable` does not need its own `JobOfferUiState` — it stays on `Offering` with `errorMessage` cleared (no dues copy), consistent with "not a balance, just try again."

---

## 7. Testing

- `deriveKycStatus` unit tests: both orderings (Aadhaar-then-PAN, PAN blocked until Aadhaar per the new precondition — so only one order is reachable end-to-end, but the pure function itself is tested against all four input combinations for defense-in-depth), rejection-then-retry, and the existing canonical-PAN-mask edge case in `get-kyc-status.ts`.
- `submit-pan-ocr.ts`: new test for the `409 AADHAAR_REQUIRED_FIRST` precondition (mock `aadhaarVerified: false` and `undefined`/no `kyc` object).
- `KycViewModel` / `KycOrchestrator` tests: PAN-OCR success while `aadhaarVerified` is false renders `PanDone`, not `Complete` — this is the regression test for the bug in §2.1; verify it fails against the current code before the fix lands (non-vacuous, per `feedback_guards_that_miss_their_class`).
- `JobOfferViewModel` tests: 403 → `BlockedByDues` (no retry attempted), 503 → stays `Offering`, no dues copy.
- Paparazzi goldens: `WalletScreen`, dues banner (both states), updated `KycScreen` states (`AadhaarRequired`, `PanDone`, `Complete`), `CompletionConfirmationDialog` with amount field. Recorded via CI `workflow_dispatch`, not locally (`docs/patterns/paparazzi-cross-os-goldens.md`).
- `libs.versions.toml` sync is not a first task here — this story doesn't touch `technician-app`'s dependency set beyond what's already present, but confirm at plan time.

---

## 8. Open items — resolved at plan-writing time

| Item | Resolution |
|---|---|
| Technician-scoped commission read | **No new route.** `GET /v1/technicians/me/commission-due` already exists and is unconsumed by the client. The admin route (`requireAdmin(['super-admin','finance','ops-manager'])`) is not reused. |
| Hold-state source for the home banner | The same `commission-due` call. No lighter endpoint carries hold state, and `TechnicianHomeViewModel` currently makes exactly one call (`getBookings()`), so the banner adds a second, independent fetch — folded as a nullable field on the Ready state so a banner failure never degrades the jobs list. |
| Support contact for the wallet CTA | WhatsApp intent to a real number (**blocking input from Alok**), extracted to `strings.xml` + `values-hi`, replacing the `+919876543210` placeholder in both the wallet and the existing home-screen entry. |
| ADR | **Yes — ADR-0036** (next free number; 0035 is the highest present). Records the "single writer, order-independent terminal state" decision, mirroring ADR-0032's postmortem of three consecutive wrong guesses at this same problem. |

## 9. Story split

Per root `CLAUDE.md`'s split rule, this work splits **by feature** into three plans that share no
files except navigation and the two string files, and can run in parallel or back-to-back:

- **E21-S05a — KYC completion** (`docs/superpowers/plans/2026-09-12-e21-s05a-kyc-completion.md`,
  1221 lines). `deriveKycStatus` terminal writer, `409 AADHAAR_REQUIRED_FIRST` precondition,
  `panVerified`, the `trigger-projector-kyc` fix, ADR-0036, and the sequential Android KYC UI
  (including the `submitPan()` false-`Complete` bug fix). This is the item gating any future
  `enforceKycInDispatch` decision, so it lands first and on its own.
- **E21-S05b — Dues visibility** (`…-e21-s05b-dues-visibility.md`, 1059 lines). Wallet screen,
  home dues banner, job-offer `403`/`503` handling. **Zero API changes** — every endpoint it
  consumes is already deployed.
- **E21-S05c — Cash confirm** (`…-e21-s05c-cash-confirm.md`, 670 lines). Active-job response
  widening, the cash-aware completion dialog with short collection, and the Room migration that
  stops offline completions from losing their collection record. **E24-S01 depends on this one**,
  so it is deliberately the smallest of the three.

The original two-way split (S05a / "money surfaces") was revised to three at plan-writing time:
written at the density this repo's plans require, the combined money-surfaces plan projected to
~1800-2000 lines, past the 1500-line split-required threshold. The S05b/S05c seam also shrinks
E24-S01's blocking dependency from the whole money surface to just the dialog.

---

## 10. References

- `docs/stories/E21-S04-interface-notes.md` — the accept contract and the KYC landmine list this story is built against.
- `docs/adr/0032-commission-hold-is-an-eligibility-gate.md` — the two-fact KYC predicate and the ordering-gap analysis this story closes.
- `docs/runbook.md` → "Dues-gated dispatch (E21-S04)" — operational context, not modified by this story.
- `api/src/functions/kyc/submit-aadhaar.ts`, `submit-pan-ocr.ts`, `get-kyc-status.ts` — files this story modifies.
- `api/src/cosmos/technician-repository.ts` — `upsertKycStatus`, new `deriveKycStatus`.
- `technician-app/.../domain/kyc/`, `.../ui/kyc/` — KYC domain + UI layers.
- `technician-app/.../ui/jobOffer/` — `JobOfferResult`, `JobOfferUiState`, `JobOfferViewModel`.
- `technician-app/.../ui/activeJob/CompletionConfirmationDialog.kt` — cash-confirm wiring.
