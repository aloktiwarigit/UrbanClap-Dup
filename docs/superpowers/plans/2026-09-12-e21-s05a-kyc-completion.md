# E21-S05a — KYC Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the KYC flow a real terminal "both steps done" state with exactly one writer, make PAN-first structurally impossible, and stop the technician app from showing a false "Complete" screen after a PAN-only submission.

**Architecture:** A single pure function `deriveKycStatus()` becomes the only writer of `kycStatus: 'COMPLETE'`, computed inside `upsertKycStatus`'s existing `readModifyWrite` merge so it is atomic with the field writes and needs no second round-trip. `submit-pan-ocr.ts` gains a precondition rejecting a PAN submission before Aadhaar. `get-kyc-status.ts` exposes `panVerified` so the client keys its UI off the same two facts dispatch reads, never off the status scalar. The change-feed projector stops treating half-done states as complete. The Android KYC flow becomes strictly sequential.

**Tech Stack:** Node 22 + TypeScript (Azure Functions, Zod, Vitest), Kotlin + Compose (Hilt, Moshi, Retrofit, MockK, JUnit 5, AssertJ, Paparazzi).

**Spec:** `docs/superpowers/specs/2026-09-12-e21-s05-technician-kyc-wallet-design.md` (§2, §8, §9)

## Global Constraints

- **Worktree:** `C:/Alok/Business Projects/wt-e21-s05`, branch `feat/e21-s05-technician-kyc-wallet`, based on `origin/main` @ `52ba5d8c`. All work happens here, never in `Urbanclap-dup`.
- **🚫 `enforceKycInDispatch` must NOT be flipped, and `api/src/services/dispatch-eligibility.ts` must NOT be touched.** Flipping it is a separate owner decision gated on prod-data verification (`docs/runbook.md` → "Precondition before flipping `enforceKycInDispatch`"). This plan makes the flow *completable*; it does not enable enforcement.
- **`api/src/cosmos/technician-repository.ts`'s `KYC_VERIFIED_PREDICATE` SQL must not change.** The two-fact predicate is already correct (ADR-0032). This plan makes the data satisfy it; it does not redefine it.
- **Kotlin explicit API mode** (`-Xexplicit-api=strict`, `-Werror`): every new `class`, `fun`, `val`, test class and test method needs an explicit `public` (or `internal`/`private`) modifier and an explicit return type on test functions (`: Unit`). See `docs/patterns/kotlin-explicit-api-public-modifier.md`.
- **String parity is enforced by `lintDebug` (MissingTranslation).** `values/strings.xml` and `values-hi/strings.xml` each hold exactly 183 strings today. Every new string needs a Hindi translation in the same commit, or the smoke gate fails at step 4/6.
- **Paparazzi goldens are recorded on CI only, never on Windows** (`docs/patterns/paparazzi-cross-os-goldens.md`). Write the tests; do not run `recordPaparazziDebug`. **Do NOT run `git rm -r .../snapshots/images/`** — 53 existing goldens live at `technician-app/app/src/test/snapshots/images/` and deleting them breaks CI (`feedback_paparazzi_golden_cleanup`). New tests simply have no golden until the CI `paparazzi-record.yml` `workflow_dispatch` run commits one.
- **Coverage floor is 80%** (`koverVerify`, smoke-gate step 6/6).
- **Commit after every task.** Never `--no-verify`.

---

## File Structure

**API (`api/`):**
- Modify `src/cosmos/technician-repository.ts` — add `deriveKycStatus()` (exported, pure) and `upsertKycStepAndDeriveStatus()`; leave `upsertKycStatus()` and `KYC_VERIFIED_PREDICATE` untouched.
- Modify `src/functions/kyc/submit-aadhaar.ts` — success path uses the deriving writer; rejection path unchanged.
- Modify `src/functions/kyc/submit-pan-ocr.ts` — add the `409` precondition; success path uses the deriving writer; rejection path unchanged.
- Modify `src/functions/kyc/get-kyc-status.ts` — add `panVerified` to the response.
- Modify `src/schemas/kyc.ts` — add `panVerified` to `GetKycStatusResponseSchema`.
- Modify `src/functions/trigger-projector-kyc.ts` — `COMPLETE_STATUSES` becomes `{'COMPLETE'}`; half-states move to `ACTION_REQUIRED_STATUSES`.
- Create `tests/unit/derive-kyc-status.test.ts`, `tests/functions/kyc/submit-pan-ocr-precondition.test.ts`.
- Modify `tests/kyc/kyc-status.test.ts`, `tests/unit/trigger-projector-kyc.test.ts` (find the real path in Task 6).

**Android (`technician-app/app/src/main/kotlin/com/homeservices/technician/`):**
- Modify `domain/kyc/model/KycState.kt` — add `panVerified`.
- Modify `data/kyc/KycRepositoryImpl.kt` — `KycStatusResponse` DTO gains `panVerified`; `PanOcrResult` gains an `AadhaarRequired` variant; `submitPanOcr` returns `Response<PanOcrResponse>` so the `409` is readable.
- Modify `domain/kyc/model/PanOcrResult.kt` — add `AadhaarRequired`.
- Modify `ui/kyc/KycUiState.kt` — add `AadhaarRequired`, `PanDone`; `Complete` no longer carries a bare status.
- Modify `ui/kyc/KycViewModel.kt` — fix the false-`Complete` bug; handle `AadhaarRequired`.
- Modify `ui/kyc/KycScreen.kt` — PAN step gated on `aadhaarVerified`.
- Modify `res/values/strings.xml` + `res/values-hi/strings.xml`.
- Tests under `app/src/test/kotlin/com/homeservices/technician/ui/kyc/`.

**Docs:**
- Create `docs/adr/0036-kyc-completion-needs-a-terminal-writer.md`.

---

## Task 1: `deriveKycStatus()` — the pure function

**Files:**
- Modify: `api/src/cosmos/technician-repository.ts` (add after `upsertKycStatus`, ~line 69)
- Test: `api/tests/unit/derive-kyc-status.test.ts` (create)

**Interfaces:**
- Consumes: `KycStatus` type from `../schemas/kyc.js` (already imported in this file).
- Produces: `export function deriveKycStatus(facts: { aadhaarVerified: boolean; panHash: string | null | undefined }): KycStatus` — returns `'COMPLETE' | 'PAN_DONE' | 'AADHAAR_DONE' | 'PENDING'`. Tasks 2, 3 and 4 call this.

- [ ] **Step 1: Write the failing test**

Create `api/tests/unit/derive-kyc-status.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { deriveKycStatus } from '../../src/cosmos/technician-repository.js';

describe('deriveKycStatus', () => {
  it('returns COMPLETE when both facts are true', () => {
    expect(deriveKycStatus({ aadhaarVerified: true, panHash: 'a'.repeat(64) })).toBe('COMPLETE');
  });

  it('returns AADHAAR_DONE when only Aadhaar succeeded', () => {
    expect(deriveKycStatus({ aadhaarVerified: true, panHash: null })).toBe('AADHAAR_DONE');
    expect(deriveKycStatus({ aadhaarVerified: true, panHash: undefined })).toBe('AADHAAR_DONE');
  });

  // Unreachable end-to-end once Task 3's precondition lands, but the function must still be
  // correct in isolation: a future manual-KYC or admin path could write PAN without Aadhaar,
  // and ADR-0032's whole point is that the completion fact must not depend on call order.
  it('returns PAN_DONE when only PAN succeeded', () => {
    expect(deriveKycStatus({ aadhaarVerified: false, panHash: 'b'.repeat(64) })).toBe('PAN_DONE');
  });

  it('returns PENDING when neither succeeded', () => {
    expect(deriveKycStatus({ aadhaarVerified: false, panHash: null })).toBe('PENDING');
  });

  // The null trap from ADR-0032: a rejected PAN submission writes an explicit null, which must
  // revoke an earlier pass rather than read as "a PAN exists".
  it('treats an explicit null panHash as not verified, revoking an earlier pass', () => {
    expect(deriveKycStatus({ aadhaarVerified: true, panHash: null })).not.toBe('COMPLETE');
  });

  it('treats an empty-string panHash as not verified', () => {
    expect(deriveKycStatus({ aadhaarVerified: true, panHash: '' })).toBe('AADHAAR_DONE');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd api && npx vitest run tests/unit/derive-kyc-status.test.ts`
Expected: FAIL — `deriveKycStatus is not a function` / no matching export.

- [ ] **Step 3: Write the implementation**

In `api/src/cosmos/technician-repository.ts`, directly after `upsertKycStatus` (which ends ~line 69):

```ts
/**
 * The single source of truth for "is this technician's KYC finished".
 *
 * `kyc.kycStatus` was historically a progress marker for a two-step process completable in either
 * order, so it could not express "both done" — whichever step ran last won, and `COMPLETE` had no
 * writer at all. Three consecutive review rounds each produced a wrong predicate over that scalar
 * (ADR-0032). This function is now the only thing that writes `COMPLETE`, and it derives it from
 * the same two independent facts the dispatch predicate reads, so the two can never disagree.
 *
 * Order-independent by construction: it reads the merged document, not the incoming patch.
 * An empty-string panHash is treated as absent — a hash is never legitimately empty, and
 * accepting one would let a blank write satisfy the completion fact.
 */
export function deriveKycStatus(facts: {
  aadhaarVerified: boolean;
  panHash: string | null | undefined;
}): KycStatus {
  const panVerified = facts.panHash != null && facts.panHash !== '';
  if (facts.aadhaarVerified && panVerified) return 'COMPLETE';
  if (panVerified) return 'PAN_DONE';
  if (facts.aadhaarVerified) return 'AADHAAR_DONE';
  return 'PENDING';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd api && npx vitest run tests/unit/derive-kyc-status.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add api/src/cosmos/technician-repository.ts api/tests/unit/derive-kyc-status.test.ts
git commit -m "feat(api): add deriveKycStatus as the single writer of terminal KYC completion"
```

---

## Task 2: `upsertKycStepAndDeriveStatus()` — atomic derive-inside-merge

**Files:**
- Modify: `api/src/cosmos/technician-repository.ts` (add after `deriveKycStatus`)
- Test: `api/tests/unit/upsert-kyc-derive.test.ts` (create)

**Interfaces:**
- Consumes: `deriveKycStatus` (Task 1), the file-private `readModifyWrite<T>`, `TechnicianKyc`, `TechnicianDoc`.
- Produces: `export async function upsertKycStepAndDeriveStatus(technicianId: string, patch: Partial<TechnicianKyc>): Promise<KycStatus>` — writes the patch and a derived `kycStatus` in one read-modify-write, returning the status actually persisted. Tasks 3 and 4 call this.

**Why a sibling function rather than changing `upsertKycStatus`:** `upsertKycStatus` has a third caller shape (rejection paths) that must force `PENDING_MANUAL` / `MANUAL_REVIEW` explicitly, overriding any derivation. Leaving its contract untouched keeps those paths obviously correct and avoids a sentinel value.

- [ ] **Step 1: Write the failing test**

Create `api/tests/unit/upsert-kyc-derive.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const replace = vi.fn().mockResolvedValue({});
const create = vi.fn().mockResolvedValue({});
const read = vi.fn();

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: () => ({
    database: () => ({
      container: () => ({
        item: () => ({ read, replace }),
        items: { create },
      }),
    }),
  }),
}));

const { upsertKycStepAndDeriveStatus } = await import('../../src/cosmos/technician-repository.js');

describe('upsertKycStepAndDeriveStatus', () => {
  beforeEach(() => {
    replace.mockClear();
    create.mockClear();
    read.mockReset();
  });

  it('derives COMPLETE when the incoming PAN completes an existing Aadhaar', async () => {
    read.mockResolvedValue({
      resource: { id: 't1', kyc: { aadhaarVerified: true, panHash: null } },
      etag: 'e1',
    });

    const status = await upsertKycStepAndDeriveStatus('t1', { panHash: 'c'.repeat(64) });

    expect(status).toBe('COMPLETE');
    expect(replace.mock.calls[0][0].kyc.kycStatus).toBe('COMPLETE');
  });

  it('derives AADHAAR_DONE when Aadhaar lands with no PAN yet', async () => {
    read.mockResolvedValue({ resource: { id: 't1', kyc: {} }, etag: 'e1' });

    const status = await upsertKycStepAndDeriveStatus('t1', { aadhaarVerified: true });

    expect(status).toBe('AADHAAR_DONE');
    expect(replace.mock.calls[0][0].kyc.kycStatus).toBe('AADHAAR_DONE');
  });

  it('derives from the MERGED document, not the patch alone', async () => {
    // The patch carries only the PAN; the Aadhaar fact exists only on the stored document.
    // Deriving from the patch would wrongly yield PAN_DONE.
    read.mockResolvedValue({
      resource: { id: 't1', kyc: { aadhaarVerified: true, panHash: null } },
      etag: 'e1',
    });

    const status = await upsertKycStepAndDeriveStatus('t1', { panHash: 'd'.repeat(64) });

    expect(status).toBe('COMPLETE');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd api && npx vitest run tests/unit/upsert-kyc-derive.test.ts`
Expected: FAIL — no such export.

- [ ] **Step 3: Write the implementation**

In `api/src/cosmos/technician-repository.ts`, after `deriveKycStatus`:

```ts
/**
 * Writes one KYC step's fields and the status derived from the resulting merged document, in a
 * single read-modify-write. Deriving inside the merge callback is what makes the status atomic
 * with the facts it describes — a read-back after the write would cost a second round-trip and
 * reopen the window this function exists to close.
 *
 * Rejection paths do NOT use this function: they call `upsertKycStatus` directly to force
 * PENDING_MANUAL / MANUAL_REVIEW, which deliberately override any derivation.
 */
export async function upsertKycStepAndDeriveStatus(
  technicianId: string,
  patch: Partial<TechnicianKyc>
): Promise<KycStatus> {
  // `readModifyWrite` may invoke the callback more than once (ETag precondition retry). Only the
  // invocation belonging to the write that actually succeeded is the one whose value we return,
  // and that is always the last one to run before it returns.
  let derived: KycStatus = 'PENDING';
  await readModifyWrite<TechnicianDoc>(technicianId, (existing) => {
    const base: TechnicianDoc = existing ?? { id: technicianId };
    const mergedKyc = {
      aadhaarVerified: false,
      aadhaarMaskedNumber: null,
      panNumber: null,
      panMaskedNumber: null,
      panHash: null,
      panImagePath: null,
      ...(base.kyc ?? {}),
      ...patch,
    };
    derived = deriveKycStatus({
      aadhaarVerified: mergedKyc.aadhaarVerified === true,
      panHash: mergedKyc.panHash,
    });
    return {
      ...base,
      kyc: { ...mergedKyc, kycStatus: derived, updatedAt: new Date().toISOString() },
    };
  });
  return derived;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd api && npx vitest run tests/unit/upsert-kyc-derive.test.ts`
Expected: PASS, 3 tests.

If the `vi.mock` path for the Cosmos client does not match this repo's actual module layout, fix the mock to match `technician-repository.ts`'s real import of `getCosmosClient` — do not change the production code to suit the test.

- [ ] **Step 5: Commit**

```bash
git add api/src/cosmos/technician-repository.ts api/tests/unit/upsert-kyc-derive.test.ts
git commit -m "feat(api): derive KYC status atomically inside the read-modify-write merge"
```

---

## Task 3: `submit-pan-ocr.ts` — the `409` precondition and the deriving write

**Files:**
- Modify: `api/src/functions/kyc/submit-pan-ocr.ts`
- Test: `api/tests/functions/kyc/submit-pan-ocr-precondition.test.ts` (create)

**Interfaces:**
- Consumes: `upsertKycStepAndDeriveStatus` (Task 2), existing `getKycByTechnicianId`.
- Produces: `409 { code: 'AADHAAR_REQUIRED_FIRST' }` on the accept path — Task 8 (Android) consumes this code.

- [ ] **Step 1: Write the failing test**

Create `api/tests/functions/kyc/submit-pan-ocr-precondition.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyTechnicianToken = vi.fn();
const getKycByTechnicianId = vi.fn();
const extractPanFromStoragePath = vi.fn();
const upsertKycStepAndDeriveStatus = vi.fn().mockResolvedValue('COMPLETE');
const upsertKycStatus = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/middleware/verifyTechnicianToken.js', () => ({ verifyTechnicianToken }));
vi.mock('../../../src/cosmos/technician-repository.js', () => ({
  getKycByTechnicianId,
  upsertKycStepAndDeriveStatus,
  upsertKycStatus,
}));
vi.mock('../../../src/services/formRecognizer.service.js', () => ({ extractPanFromStoragePath }));
vi.mock('../../../src/services/kycAudit.service.js', () => ({ kycAuditEntry: vi.fn() }));

const { submitPanOcr } = await import('../../../src/functions/kyc/submit-pan-ocr.js');

function reqFor(technicianId: string) {
  return {
    json: async () => ({ technicianId, firebaseStoragePath: 'kyc/t1/pan.jpg' }),
  } as never;
}

describe('submitPanOcr — Aadhaar-first precondition', () => {
  beforeEach(() => {
    verifyTechnicianToken.mockResolvedValue({ uid: 't1' });
    extractPanFromStoragePath.mockReset();
    upsertKycStepAndDeriveStatus.mockClear();
  });

  it('rejects with 409 when Aadhaar is not yet verified', async () => {
    getKycByTechnicianId.mockResolvedValue({ aadhaarVerified: false, panHash: null });

    const res = await submitPanOcr(reqFor('t1'), {} as never);

    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('AADHAAR_REQUIRED_FIRST');
  });

  it('rejects with 409 when the technician has no kyc sub-object at all', async () => {
    getKycByTechnicianId.mockResolvedValue(null);

    const res = await submitPanOcr(reqFor('t1'), {} as never);

    expect(res.status).toBe(409);
  });

  it('does not spend an OCR call when the precondition fails', async () => {
    getKycByTechnicianId.mockResolvedValue({ aadhaarVerified: false, panHash: null });

    await submitPanOcr(reqFor('t1'), {} as never);

    expect(extractPanFromStoragePath).not.toHaveBeenCalled();
  });

  it('proceeds and returns the derived status when Aadhaar is verified', async () => {
    getKycByTechnicianId.mockResolvedValue({ aadhaarVerified: true, panHash: null });
    extractPanFromStoragePath.mockResolvedValue({
      status: 'PAN_DONE',
      panMaskedNumber: 'XXXXX1234F',
      panHash: 'e'.repeat(64),
    });

    const res = await submitPanOcr(reqFor('t1'), {} as never);

    expect(res.status).toBe(200);
    expect((res.jsonBody as { kycStatus: string }).kycStatus).toBe('COMPLETE');
    expect(upsertKycStepAndDeriveStatus).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd api && npx vitest run tests/functions/kyc/submit-pan-ocr-precondition.test.ts`
Expected: FAIL — the first two cases return 200, not 409.

- [ ] **Step 3: Write the implementation**

In `api/src/functions/kyc/submit-pan-ocr.ts`:

Change the import line from `upsertKycStatus` to add the new function:

```ts
import {
  upsertKycStatus,
  upsertKycStepAndDeriveStatus,
  getKycByTechnicianId,
} from '../../cosmos/technician-repository.js';
```

Insert the precondition immediately after the IDOR guard (`if (decodedToken.uid !== technicianId)`) and **before** the `extractPanFromStoragePath` call:

```ts
  // Step order is enforced here, not merely encouraged in the UI. Before this guard a PAN-first
  // technician reached PAN_DONE with no route to a terminal state: `kyc.kycStatus` cannot express
  // "both done", and once ANY KYC write lands the technician stops matching dispatch's fail-open
  // `NOT IS_DEFINED(c.kyc)` disjunct. See ADR-0036.
  const existingKyc = await getKycByTechnicianId(technicianId);
  if (existingKyc?.aadhaarVerified !== true) {
    return { status: 409, jsonBody: { code: 'AADHAAR_REQUIRED_FIRST' } };
  }
```

Replace the success-path write (currently `await upsertKycStatus(technicianId, { ..., kycStatus: 'PAN_DONE' })`) with:

```ts
    const derivedStatus = await upsertKycStepAndDeriveStatus(technicianId, {
      panMaskedNumber: ocrResult.panMaskedNumber,
      panHash: ocrResult.panHash,
      panNumber: null,           // explicitly clear legacy field
      panNumberEncrypted: undefined, // explicitly clear
      panImagePath: firebaseStoragePath,
    });
    void kycAuditEntry(technicianId, 'PAN', 'VERIFIED');
    return {
      status: 200,
      jsonBody: {
        kycStatus: derivedStatus,
        panMaskedNumber: ocrResult.panMaskedNumber,
        panNumber: ocrResult.panMaskedNumber, // legacy alias — technician-app reads panNumber
      },
    };
```

Leave the rejection path exactly as it is — it calls `upsertKycStatus` with an explicit `kycStatus: 'MANUAL_REVIEW'`, which must override any derivation.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd api && npx vitest run tests/functions/kyc/submit-pan-ocr-precondition.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Run the existing KYC suite for regressions**

Run: `cd api && npx vitest run tests/kyc/ tests/schemas/kyc.test.ts`
Expected: PASS. If an existing test asserted `kycStatus === 'PAN_DONE'` on a PAN-only submission, that test encoded the bug — update it to set up a verified Aadhaar first and expect `'COMPLETE'`, and note the change in the commit body.

- [ ] **Step 6: Commit**

```bash
git add api/src/functions/kyc/submit-pan-ocr.ts api/tests/
git commit -m "feat(api): reject PAN submission before Aadhaar and derive terminal KYC status"
```

---

## Task 4: `submit-aadhaar.ts` — the deriving write

**Files:**
- Modify: `api/src/functions/kyc/submit-aadhaar.ts`
- Test: `api/tests/functions/kyc/submit-aadhaar-derive.test.ts` (create)

**Interfaces:**
- Consumes: `upsertKycStepAndDeriveStatus` (Task 2).
- Produces: an Aadhaar success response whose `kycStatus` is `'COMPLETE'` when a PAN was already on file, `'AADHAAR_DONE'` otherwise.

**Why this matters even with Task 3's precondition:** the precondition prevents *new* PAN-first sequences, but a technician whose PAN landed before this story shipped, or through a future admin/manual path, still needs Aadhaar to complete them. Deriving here is what makes the terminal state order-independent rather than merely sequential.

- [ ] **Step 1: Write the failing test**

Create `api/tests/functions/kyc/submit-aadhaar-derive.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyTechnicianToken = vi.fn();
const exchangeCodeForAadhaar = vi.fn();
const upsertKycStepAndDeriveStatus = vi.fn();
const upsertKycStatus = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/middleware/verifyTechnicianToken.js', () => ({ verifyTechnicianToken }));
vi.mock('../../../src/cosmos/technician-repository.js', () => ({
  upsertKycStepAndDeriveStatus,
  upsertKycStatus,
  getKycByTechnicianId: vi.fn(),
}));
vi.mock('../../../src/services/digilocker.service.js', () => ({ exchangeCodeForAadhaar }));
vi.mock('../../../src/services/kycAudit.service.js', () => ({ kycAuditEntry: vi.fn() }));

const { submitAadhaar } = await import('../../../src/functions/kyc/submit-aadhaar.js');

const req = {
  json: async () => ({
    technicianId: 't1',
    authCode: 'code',
    redirectUri: 'homeservices://kyc/aadhaar-callback',
  }),
} as never;

describe('submitAadhaar — derived status', () => {
  beforeEach(() => {
    verifyTechnicianToken.mockResolvedValue({ uid: 't1' });
    upsertKycStepAndDeriveStatus.mockReset();
  });

  it('returns COMPLETE when a PAN was already on file', async () => {
    exchangeCodeForAadhaar.mockResolvedValue({ maskedNumber: 'XXXXXXXX1234' });
    upsertKycStepAndDeriveStatus.mockResolvedValue('COMPLETE');

    const res = await submitAadhaar(req, {} as never);

    expect((res.jsonBody as { kycStatus: string }).kycStatus).toBe('COMPLETE');
  });

  it('returns AADHAAR_DONE when no PAN is on file yet', async () => {
    exchangeCodeForAadhaar.mockResolvedValue({ maskedNumber: 'XXXXXXXX1234' });
    upsertKycStepAndDeriveStatus.mockResolvedValue('AADHAAR_DONE');

    const res = await submitAadhaar(req, {} as never);

    expect((res.jsonBody as { kycStatus: string }).kycStatus).toBe('AADHAAR_DONE');
  });

  it('still forces PENDING_MANUAL on a DigiLocker rejection, bypassing derivation', async () => {
    exchangeCodeForAadhaar.mockResolvedValue(null);

    const res = await submitAadhaar(req, {} as never);

    expect((res.jsonBody as { kycStatus: string }).kycStatus).toBe('PENDING_MANUAL');
    expect(upsertKycStepAndDeriveStatus).not.toHaveBeenCalled();
    expect(upsertKycStatus).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd api && npx vitest run tests/functions/kyc/submit-aadhaar-derive.test.ts`
Expected: FAIL — the success path still returns a hardcoded `'AADHAAR_DONE'` and never calls the new function.

- [ ] **Step 3: Write the implementation**

In `api/src/functions/kyc/submit-aadhaar.ts`, update the import:

```ts
import {
  upsertKycStatus,
  upsertKycStepAndDeriveStatus,
} from '../../cosmos/technician-repository.js';
```

Replace the success-path block with:

```ts
  const derivedStatus = await upsertKycStepAndDeriveStatus(technicianId, {
    aadhaarVerified: true,
    aadhaarMaskedNumber: aadhaarResult.maskedNumber,
  });
  void kycAuditEntry(technicianId, 'AADHAAR', 'VERIFIED');

  return {
    status: 200,
    jsonBody: {
      kycStatus: derivedStatus,
      aadhaarVerified: true,
      aadhaarMaskedNumber: aadhaarResult.maskedNumber,
    },
  };
```

Leave the rejection branch untouched — it forces `PENDING_MANUAL` via `upsertKycStatus`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd api && npx vitest run tests/functions/kyc/submit-aadhaar-derive.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add api/src/functions/kyc/submit-aadhaar.ts api/tests/functions/kyc/submit-aadhaar-derive.test.ts
git commit -m "feat(api): derive terminal KYC status on the Aadhaar success path"
```

---

## Task 5: `get-kyc-status.ts` — expose `panVerified`

**Files:**
- Modify: `api/src/schemas/kyc.ts` (`GetKycStatusResponseSchema`)
- Modify: `api/src/functions/kyc/get-kyc-status.ts`
- Test: `api/tests/kyc/kyc-status.test.ts` (extend)

**Interfaces:**
- Produces: `panVerified: boolean` on the `GET /v1/kyc/status` response — Task 7 (Android DTO) consumes it.

- [ ] **Step 1: Write the failing test**

Append to `api/tests/kyc/kyc-status.test.ts` (match the file's existing mock setup and `describe` style — read it first):

```ts
  it('reports panVerified true only when a non-null panHash is on file', async () => {
    getKycByTechnicianId.mockResolvedValue({
      aadhaarVerified: true,
      aadhaarMaskedNumber: 'XXXXXXXX1234',
      panMaskedNumber: 'XXXXX1234F',
      panHash: 'f'.repeat(64),
      panNumber: null,
      kycStatus: 'COMPLETE',
    });

    const res = await getKycStatus(reqFor('t1'), {} as never);

    expect((res.jsonBody as { panVerified: boolean }).panVerified).toBe(true);
  });

  it('reports panVerified false when panHash is null even though a masked number exists', async () => {
    // A rejected re-submission nulls panHash but an earlier panMaskedNumber can still be present
    // in legacy documents. panVerified must follow the hash, which is what dispatch reads.
    getKycByTechnicianId.mockResolvedValue({
      aadhaarVerified: true,
      aadhaarMaskedNumber: 'XXXXXXXX1234',
      panMaskedNumber: 'XXXXX1234F',
      panHash: null,
      panNumber: null,
      kycStatus: 'AADHAAR_DONE',
    });

    const res = await getKycStatus(reqFor('t1'), {} as never);

    expect((res.jsonBody as { panVerified: boolean }).panVerified).toBe(false);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd api && npx vitest run tests/kyc/kyc-status.test.ts`
Expected: FAIL — `panVerified` is `undefined`.

- [ ] **Step 3: Write the implementation**

In `api/src/schemas/kyc.ts`, add to `GetKycStatusResponseSchema`:

```ts
  panVerified: z.boolean(),
```

In `api/src/functions/kyc/get-kyc-status.ts`, add above the return:

```ts
  // The same fact the dispatch predicate reads (`IS_DEFINED(panHash) AND NOT IS_NULL(panHash)`),
  // surfaced as a boolean so the client never has to infer completion from a masked string or
  // from kycStatus. Deliberately keyed on the hash, not on panMaskedNumber: a rejected
  // re-submission nulls the hash, and that must revoke an earlier pass.
  const panVerified = kyc.panHash != null && kyc.panHash !== '';
```

and add `panVerified,` to the returned `jsonBody`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd api && npx vitest run tests/kyc/kyc-status.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/schemas/kyc.ts api/src/functions/kyc/get-kyc-status.ts api/tests/kyc/kyc-status.test.ts
git commit -m "feat(api): expose panVerified on the KYC status response"
```

---

## Task 6: `trigger-projector-kyc.ts` — stop resolving the reminder on half-done states

**Files:**
- Modify: `api/src/functions/trigger-projector-kyc.ts:50-52`
- Test: find the existing projector test (`ls api/tests | grep -i projector`, likely `api/tests/functions/trigger-projector-kyc.test.ts`) and extend it.

**Interfaces:** none exported; behaviour change only.

**Why this is in scope:** without it, the story writes a correct terminal state that nothing downstream respects. Today `COMPLETE_STATUSES` contains `AADHAAR_DONE` and `PAN_DONE`, so finishing one step **resolves** the `KYC_RESUME` pending action — the app stops reminding a technician who still has a step outstanding. That is the same "looks done, isn't done" failure this story exists to remove, one layer up.

- [ ] **Step 1: Write the failing test**

Add to the projector's existing test file, matching its established mock setup:

```ts
  it('keeps the KYC_RESUME reminder active on AADHAAR_DONE', async () => {
    await processKycChangeFeedDoc({
      id: 't1',
      kyc: { kycStatus: 'AADHAAR_DONE', updatedAt: '2026-09-12T00:00:00.000Z' },
    });

    expect(upsertAction).toHaveBeenCalled();
    expect(resolveAction).not.toHaveBeenCalled();
  });

  it('keeps the KYC_RESUME reminder active on PAN_DONE', async () => {
    await processKycChangeFeedDoc({
      id: 't1',
      kyc: { kycStatus: 'PAN_DONE', updatedAt: '2026-09-12T00:00:00.000Z' },
    });

    expect(upsertAction).toHaveBeenCalled();
    expect(resolveAction).not.toHaveBeenCalled();
  });

  it('resolves the reminder only on the terminal COMPLETE state', async () => {
    await processKycChangeFeedDoc({
      id: 't1',
      kyc: { kycStatus: 'COMPLETE', updatedAt: '2026-09-12T00:00:00.000Z' },
    });

    expect(resolveAction).toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd api && npx vitest run tests/functions/trigger-projector-kyc.test.ts`
Expected: FAIL on the first two — `resolveAction` *is* currently called for both half-states.

- [ ] **Step 3: Write the implementation**

In `api/src/functions/trigger-projector-kyc.ts`, replace lines 50-52:

```ts
/**
 * KYC statuses that require technician action.
 *
 * AADHAAR_DONE and PAN_DONE live here, not in COMPLETE_STATUSES: each means exactly one of the two
 * required steps has landed, so the "finish your KYC" reminder must stay up. They were previously
 * treated as complete, which cleared the reminder for a technician who still had a step to do.
 */
const ACTION_REQUIRED_STATUSES = new Set([
  'PENDING',
  'PENDING_MANUAL',
  'MANUAL_REVIEW',
  'AADHAAR_DONE',
  'PAN_DONE',
]);
/** The only status meaning both KYC steps succeeded — written solely by `deriveKycStatus`. */
const COMPLETE_STATUSES = new Set(['COMPLETE']);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd api && npx vitest run tests/functions/trigger-projector-kyc.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/functions/trigger-projector-kyc.ts api/tests/
git commit -m "fix(api): keep the KYC reminder active until both steps are done"
```

---

## Task 7: Android data layer — `panVerified` and the `409`

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/kyc/model/KycState.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/kyc/model/PanOcrResult.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/kyc/KycRepositoryImpl.kt`
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/data/kyc/KycRepositoryImplTest.kt` (create if absent)

**Interfaces:**
- Consumes: `panVerified` from Task 5's response; `409 AADHAAR_REQUIRED_FIRST` from Task 3.
- Produces: `KycState.panVerified: Boolean`; `PanOcrResult.AadhaarRequired` — Task 8 consumes both.

**Note on the DTO:** `KycStatusResponse` currently reads the API's legacy `panNumber` alias, and `KycStatus.valueOf(r.kycStatus)` throws on an unknown string. `COMPLETE` is already a member of the Kotlin enum, so the new terminal value is safe to receive. `submitPanOcr` currently returns a bare `PanOcrResponse`, so a non-2xx throws `HttpException` and the `409` is invisible — it must become `Response<PanOcrResponse>`.

- [ ] **Step 1: Write the failing test**

Create `technician-app/app/src/test/kotlin/com/homeservices/technician/data/kyc/KycRepositoryImplTest.kt`. Mirror the house style from `ui/jobOffer/JobOfferViewModelTest.kt` (JUnit 5, MockK, AssertJ, explicit `public`):

```kotlin
package com.homeservices.technician.data.kyc

import com.homeservices.technician.domain.kyc.model.PanOcrResult
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import retrofit2.Response

public class KycRepositoryImplTest {
    @Test
    public fun `getKycStatus maps panVerified from the response`(): Unit =
        runTest {
            val api = mockk<KycApiService>()
            coEvery { api.getKycStatus() } returns
                KycStatusResponse(
                    technicianId = "t1",
                    kycStatus = "COMPLETE",
                    aadhaarVerified = true,
                    aadhaarMaskedNumber = "XXXXXXXX1234",
                    panNumber = "XXXXX1234F",
                    panVerified = true,
                )

            val state = createRepository(api).getKycStatus()

            assertThat(state.panVerified).isTrue()
            assertThat(state.aadhaarVerified).isTrue()
        }

    @Test
    public fun `submitPan maps 409 AADHAAR_REQUIRED_FIRST to AadhaarRequired`(): Unit =
        runTest {
            val api = mockk<KycApiService>()
            val body = """{"code":"AADHAAR_REQUIRED_FIRST"}"""
                .toResponseBody("application/json".toMediaType())
            coEvery { api.submitPanOcr(any()) } returns Response.error(409, body)

            val result = createRepository(api).submitPanOcr("kyc/t1/pan.jpg")

            assertThat(result).isInstanceOf(PanOcrResult.AadhaarRequired::class.java)
        }
}
```

Add a `createRepository(api)` helper in the test matching `KycRepositoryImpl`'s real constructor (read it — it takes the api service plus, per the Shield precedent, likely a `Moshi`). If the repository's PAN entry point has a different name or signature than `submitPanOcr(path)`, match the real one rather than inventing.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*KycRepositoryImplTest*" -PexcludePaparazzi`
Expected: FAIL — `panVerified` is not a parameter of `KycStatusResponse` / `KycState`, and `AadhaarRequired` does not exist.

- [ ] **Step 3: Write the implementation**

`domain/kyc/model/KycState.kt`:

```kotlin
package com.homeservices.technician.domain.kyc.model

public data class KycState(
    public val status: KycStatus,
    public val aadhaarVerified: Boolean,
    public val panVerified: Boolean,
    public val aadhaarMaskedNumber: String?,
    public val panNumber: String?,
)
```

`domain/kyc/model/PanOcrResult.kt` — add to the existing sealed class:

```kotlin
    /**
     * The server refused the PAN submission because Aadhaar is not verified yet
     * (409 AADHAAR_REQUIRED_FIRST). The UI must send the technician back to step 1;
     * retrying the PAN upload cannot succeed.
     */
    public data object AadhaarRequired : PanOcrResult()
```

`data/kyc/KycRepositoryImpl.kt`:
1. Add `panVerified: Boolean` to the `KycStatusResponse` DTO.
2. Pass it through when building `KycState` (keep the existing `rawPanReceived` sanitisation exactly as-is; `panVerified` comes from the server field, not from the masked string).
3. Change the API signature to `suspend fun submitPanOcr(@Body body: PanOcrRequest): Response<PanOcrResponse>`.
4. Map the response, following `ShieldRepositoryImpl.kt:38-44`'s error-body pattern — parse with Moshi inside a `try`, never substring-sniff:

```kotlin
        val response = api.submitPanOcr(PanOcrRequest(firebaseStoragePath))
        if (!response.isSuccessful) {
            if (response.code() == HTTP_CONFLICT) {
                val code = runCatching {
                    moshi.adapter(ApiErrorDto::class.java)
                        .fromJson(response.errorBody()?.string() ?: "")?.code
                }.getOrNull()
                if (code == AADHAAR_REQUIRED_FIRST) return PanOcrResult.AadhaarRequired
            }
            return PanOcrResult.OcrError("...")  // keep the existing error copy/branching
        }
```

with file-private constants (`-Werror` forbids magic values under detekt's `MagicNumber`):

```kotlin
private const val HTTP_CONFLICT = 409
private const val AADHAAR_REQUIRED_FIRST = "AADHAAR_REQUIRED_FIRST"

@JsonClass(generateAdapter = true)
internal data class ApiErrorDto(val code: String?)
```

Inject `Moshi` into the repository if it is not already a constructor parameter, and add the binding to the Hilt module in `data/kyc/di/KycModule.kt` if needed.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*KycRepositoryImplTest*" -PexcludePaparazzi`
Expected: PASS.

- [ ] **Step 5: Fix every other construction site of `KycState`**

Adding a field breaks callers. Run `./gradlew assembleDebug` and fix each unresolved-reference until clean.

- [ ] **Step 6: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/kyc/ \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/kyc/ \
        technician-app/app/src/test/kotlin/com/homeservices/technician/data/kyc/
git commit -m "feat(technician-app): surface panVerified and the Aadhaar-first 409 in the KYC data layer"
```

---

## Task 8: `KycViewModel` — fix the false `Complete`

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/kyc/KycUiState.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/kyc/KycViewModel.kt`
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/kyc/KycViewModelTest.kt` (create if absent)

**Interfaces:**
- Consumes: `KycState.panVerified`, `PanOcrResult.AadhaarRequired` (Task 7).
- Produces: `KycUiState.PanDone`, `KycUiState.AadhaarRequired`; `KycUiState.Complete` reachable only when both facts hold — Task 9 (screen) and Task 10 (Paparazzi) consume these.

**This is the regression test for the bug the story exists to fix.** Today `submitPan()` maps `PanOcrResult.Success` straight to `KycUiState.Complete(status = KycStatus.PAN_DONE)` — a "you're done" screen after a PAN-only submission. `handleKycStatusEvent` has the same defect (`event.verified` → `Complete(PAN_DONE)`).

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.technician.ui.kyc

import com.homeservices.technician.domain.kyc.model.KycStatus
import com.homeservices.technician.domain.kyc.model.PanOcrResult
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class KycViewModelTest {
    @Test
    public fun `PAN success while Aadhaar unverified does NOT render Complete`(): Unit =
        runTest {
            val vm = createViewModel(aadhaarVerified = false, panVerified = true)
            every { orchestrator.submitPan(any(), any()) } returns flowOf(PanOcrResult.Success)

            vm.submitPan(aUri())

            assertThat(vm.uiState.value).isNotInstanceOf(KycUiState.Complete::class.java)
            assertThat(vm.uiState.value).isInstanceOf(KycUiState.PanDone::class.java)
        }

    @Test
    public fun `PAN success with Aadhaar verified renders Complete`(): Unit =
        runTest {
            val vm = createViewModel(aadhaarVerified = true, panVerified = true)
            every { orchestrator.submitPan(any(), any()) } returns flowOf(PanOcrResult.Success)

            vm.submitPan(aUri())

            assertThat(vm.uiState.value).isInstanceOf(KycUiState.Complete::class.java)
        }

    @Test
    public fun `AadhaarRequired result routes back to the Aadhaar step`(): Unit =
        runTest {
            val vm = createViewModel(aadhaarVerified = false, panVerified = false)
            every { orchestrator.submitPan(any(), any()) } returns flowOf(PanOcrResult.AadhaarRequired)

            vm.submitPan(aUri())

            assertThat(vm.uiState.value).isInstanceOf(KycUiState.AadhaarRequired::class.java)
        }
}
```

Write `createViewModel(...)` to stub `KycOrchestrator.fetchCurrentStatus()` returning a `KycState` with the given flags, plus the buses/stores the real constructor takes (`DigiLockerCallbackBus`, `KycStatusEventBus`, `PendingActionStore`, `SessionManager`) as relaxed MockK mocks with an `AuthState.Authenticated` uid.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*KycViewModelTest*" -PexcludePaparazzi`
Expected: FAIL on test 1 — current code renders `Complete`. **Confirm this failure before fixing: it is the proof the regression test is non-vacuous** (`feedback_guards_that_miss_their_class`).

- [ ] **Step 3: Write the implementation**

`KycUiState.kt` — replace `Complete` and add the two new states:

```kotlin
    /** Exactly one step remains: the PAN landed but Aadhaar has not been verified. */
    public data object PanDone : KycUiState()

    /** The PAN step was attempted before Aadhaar; the technician must complete Aadhaar first. */
    public data object AadhaarRequired : KycUiState()

    /**
     * Both KYC steps have succeeded. Reachable only when `aadhaarVerified && panVerified` —
     * never from a single step's success. Carries no status scalar: the two facts are the
     * completion contract, and a scalar here is what produced the false-complete bug.
     */
    public data object Complete : KycUiState()
```

`KycViewModel.kt`:
- Hold the latest `KycState` (refresh via `orchestrator.fetchCurrentStatus()` on init and after each successful step) so both facts are known locally.
- Add a private resolver and use it everywhere a terminal state is set:

```kotlin
        private fun terminalStateFor(
            aadhaarVerified: Boolean,
            panVerified: Boolean,
        ): KycUiState =
            when {
                aadhaarVerified && panVerified -> KycUiState.Complete
                panVerified -> KycUiState.PanDone
                aadhaarVerified -> KycUiState.AadhaarDone
                else -> KycUiState.Idle
            }
```

- `submitPan`: on `PanOcrResult.Success`, re-fetch the status and set `terminalStateFor(state.aadhaarVerified, state.panVerified)` instead of the hardcoded `Complete(PAN_DONE)`. On `PanOcrResult.AadhaarRequired`, set `KycUiState.AadhaarRequired` and do **not** persist a photo-retry row (retrying cannot help).
- `handleKycStatusEvent`: on `event.verified`, re-fetch and use the same resolver rather than `Complete(PAN_DONE)`.
- Remove the now-unused `KycStatus` import if nothing else uses it.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*KycViewModelTest*" -PexcludePaparazzi`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/kyc/ \
        technician-app/app/src/test/kotlin/com/homeservices/technician/ui/kyc/
git commit -m "fix(technician-app): stop rendering KYC Complete after a PAN-only submission"
```

---

## Task 9: `KycScreen` — sequential steps and Hindi copy

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/kyc/KycScreen.kt`
- Modify: `technician-app/app/src/main/res/values/strings.xml`
- Modify: `technician-app/app/src/main/res/values-hi/strings.xml`

**Interfaces:**
- Consumes: `KycUiState.PanDone`, `KycUiState.AadhaarRequired`, `KycUiState.Complete` (Task 8).

- [ ] **Step 1: Add the strings (both locales, same commit)**

`values/strings.xml`:

```xml
    <string name="kyc_step_pan_locked_title">Complete Aadhaar first</string>
    <string name="kyc_step_pan_locked_body">Verify your Aadhaar before uploading your PAN card.</string>
    <string name="kyc_pan_done_title">One step left</string>
    <string name="kyc_pan_done_body">Your PAN is verified. Verify your Aadhaar to finish.</string>
    <string name="kyc_complete_title">KYC complete</string>
    <string name="kyc_complete_body">Both documents are verified. You can receive jobs.</string>
```

`values-hi/strings.xml` (same names, same order):

```xml
    <string name="kyc_step_pan_locked_title">पहले आधार पूरा करें</string>
    <string name="kyc_step_pan_locked_body">पैन कार्ड अपलोड करने से पहले अपना आधार सत्यापित करें।</string>
    <string name="kyc_pan_done_title">एक कदम बाकी है</string>
    <string name="kyc_pan_done_body">आपका पैन सत्यापित हो गया है। पूरा करने के लिए आधार सत्यापित करें।</string>
    <string name="kyc_complete_title">केवाईसी पूरी हुई</string>
    <string name="kyc_complete_body">दोनों दस्तावेज़ सत्यापित हैं। अब आप जॉब ले सकते हैं।</string>
```

- [ ] **Step 2: Gate the PAN step**

In `KycScreen.kt`, render the PAN upload control as disabled with the `kyc_step_pan_locked_*` copy whenever the observed state has `aadhaarVerified == false`, and add `when` branches for `KycUiState.PanDone`, `KycUiState.AadhaarRequired` and the now-parameterless `KycUiState.Complete`. Keep the screen's existing stateless `*Content` composable split — Task 10's Paparazzi tests render that, not the Hilt-wired screen.

- [ ] **Step 3: Verify compilation and lint**

Run: `cd technician-app && ./gradlew assembleDebug lintDebug --quiet`
Expected: BUILD SUCCESSFUL, **no `MissingTranslation`**. A MissingTranslation failure here means a string was added to one locale only — fix before continuing.

- [ ] **Step 4: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/kyc/KycScreen.kt \
        technician-app/app/src/main/res/values/strings.xml \
        technician-app/app/src/main/res/values-hi/strings.xml
git commit -m "feat(technician-app): gate the PAN step behind Aadhaar verification"
```

---

## Task 10: Paparazzi coverage for the new KYC states

**Files:**
- Modify/Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/kyc/KycScreenPaparazziTest.kt`

- [ ] **Step 1: Write the snapshot tests**

Follow `JobOfferScreenPaparazziTest.kt` exactly (JUnit 4 `@get:Rule`, `DeviceConfig.PIXEL_5`, `theme = "android:Theme.Material3.DayNight.NoActionBar"`, light and dark variants, stateless `*Content` composable):

```kotlin
    @Test
    public fun kycScreen_panDone_lightTheme(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycScreenContent(uiState = KycUiState.PanDone, onStartKyc = {}, onSubmitPan = {})
            }
        }
    }
```

Cover `PanDone`, `AadhaarRequired` and `Complete`, light and dark. Match `KycScreenContent`'s real parameter list.

- [ ] **Step 2: Verify the tests compile and are collected**

Run: `cd technician-app && ./gradlew compileDebugUnitTestKotlin --quiet`
Expected: BUILD SUCCESSFUL.

**Do NOT run `recordPaparazziDebug` and do NOT delete any existing goldens.** The 53 goldens under `technician-app/app/src/test/snapshots/images/` belong to other screens and must stay. These new tests have no golden until CI records one (Task 12).

- [ ] **Step 3: Commit**

```bash
git add technician-app/app/src/test/kotlin/com/homeservices/technician/ui/kyc/KycScreenPaparazziTest.kt
git commit -m "test(technician-app): add Paparazzi coverage for the new KYC states"
```

---

## Task 11: ADR-0036

**Files:**
- Create: `docs/adr/0036-kyc-completion-needs-a-terminal-writer.md`

- [ ] **Step 1: Write the ADR**

Follow `docs/adr/TEMPLATE.md`. Content requirements — this ADR exists so the next story does not re-derive it:

- **Status:** accepted. **Date:** 2026-09-12. **Deciders:** Alok Tiwari (owner), E21-S05a implementing session. **Extends:** ADR-0032.
- **Context:** `kyc.kycStatus` was a single scalar progress marker for a two-step process completable in either order; `COMPLETE` existed in the schema with no writer; `submit-pan-ocr` wrote `PAN_DONE` without checking Aadhaar. ADR-0032 worked around this for *dispatch* by reading two independent facts, and explicitly left step-order enforcement as an open follow-up. A PAN-first technician had no route to a completable state, and any client rendering progress from the scalar showed a false "done".
- **Decision:** (1) `deriveKycStatus()` is the only writer of `COMPLETE`, derived from the same two facts dispatch reads, computed inside the existing read-modify-write so status and facts are atomic. (2) `submit-pan-ocr` rejects with `409 AADHAAR_REQUIRED_FIRST` unless `aadhaarVerified === true`. (3) `panVerified` is exposed on the status response so clients key off facts, not the scalar. (4) The change-feed projector treats only `COMPLETE` as complete.
- **Consequences (negative, and be honest):** the two mechanisms are partly redundant by design — derivation alone would have sufficed for correctness, and enforcement alone would have left pre-existing PAN-first technicians stranded; together they cost an extra Cosmos read on every PAN submission (the precondition). `deriveKycStatus` still does not cover a manual/admin KYC path, which ADR-0032 flagged and which remains unbuilt — if one is added it must write the two facts, not the scalar. `enforceKycInDispatch` remains **off**; this story removes the blocker identified in `E21-S04-interface-notes.md` item 5 but does not itself authorise the flip, which still needs the prod-data check in the runbook.
- **Alternatives considered:** deriving in the client only (rejected — puts the completion contract in the least trustworthy place and lets two clients disagree); a Cosmos computed property (rejected — no writer-side validation and still readable as a scalar); enforcement without a terminal state (rejected — strands existing PAN-first technicians, which the owner explicitly ruled out).

- [ ] **Step 2: Update the ADR index**

Add the row to `docs/adr/README.md` matching its existing table format.

- [ ] **Step 3: Commit**

```bash
git add docs/adr/0036-kyc-completion-needs-a-terminal-writer.md docs/adr/README.md
git commit -m "docs(adr): ADR-0036 — KYC completion needs a terminal writer, not a status scalar"
```

---

## Task 12: Smoke gate, prod-data check, and review

- [ ] **Step 1: Run the API smoke gate**

```bash
bash tools/pre-codex-smoke-api.sh
```
Expected: exit 0. Non-zero means stop and fix — do not proceed to Codex.

- [ ] **Step 2: Run the Android smoke gate**

```bash
bash tools/pre-codex-smoke.sh technician-app
```
Expected: exit 0 across all 6 steps (`assembleDebug`, `ktlintCheck`, `detekt`, `lintDebug`, `testDebugUnitTest`, `koverVerify`). The script already passes `-PexcludePaparazzi` where needed.

- [ ] **Step 3: Verify the prod-data assumption before claiming the blocker is closed**

The spec's claim that no backfill is needed rests on production holding **zero** technicians with a `kyc` sub-object (16 technicians, none having touched KYC). Confirm it still holds rather than assuming — a PAN-first technician created since would need remediation, and the terminal writer alone will not fix them (their Aadhaar step must still run).

Query production for technicians where `IS_DEFINED(c.kyc) AND (NOT IS_DEFINED(c.kyc.aadhaarVerified) OR c.kyc.aadhaarVerified != true) AND IS_DEFINED(c.kyc.panHash) AND NOT IS_NULL(c.kyc.panHash)` — see `project_sentry_dsn_empty` memory for the token-minting + Cosmos access recipe. Record the result in the PR description. **If the count is non-zero, stop and report to Alok** — this plan closes the path forward but does not remediate existing stranded records.

- [ ] **Step 4: Merge main and push**

```bash
git fetch origin main && git merge origin/main
bash tools/pre-codex-smoke.sh technician-app   # re-run after the merge
git push -u origin feat/e21-s05-technician-kyc-wallet
```

Two other sessions are landing PRs from the same `main`; merging before the push is what keeps the pre-push hook's `@{u}` diff from running unrelated sub-project gates (`feedback_prepush_hook_upstream_diff`).

- [ ] **Step 5: Codex review**

```bash
codex review --base main
```
Use the `disk-full-read-access` sandbox permission — this is a git worktree (`feedback_smoke_gate_paparazzi`). Fix findings in Claude and re-run Codex **once**; do not iterate rounds.

- [ ] **Step 6: Trigger the Paparazzi golden recording on CI**

After the branch is pushed, trigger `paparazzi-record.yml` via `workflow_dispatch` for this branch, then pull the golden commit. Only then will `verifyPaparazziDebug` pass in CI.

- [ ] **Step 7: Open the PR**

Body must state: the blocker from `E21-S04-interface-notes.md` item 5 is closed (KYC is now completable in both orderings), the prod-data count from Step 3, and **explicitly that `enforceKycInDispatch` has not been flipped and this PR does not authorise flipping it.**

---

## Self-Review Notes

- **Spec coverage:** §2.1/§2.2 → Tasks 1-5; the projector consequence → Task 6; §2.3 → Tasks 7-10; §8 ADR row → Task 11; §7 testing → Tasks 1-10 inline plus Task 12.
- **Deliberately out of this plan** (they belong to E21-S05b): wallet screen, dues banner, job-offer `403`/`503`, cash confirm, the active-job response widening.
- **Type consistency:** `deriveKycStatus(facts)` (Task 1) is called by `upsertKycStepAndDeriveStatus` (Task 2), which is called by Tasks 3 and 4. `panVerified` is named identically across the Zod schema (Task 5), the Moshi DTO, `KycState` (Task 7), and the ViewModel resolver (Task 8). `PanOcrResult.AadhaarRequired` (Task 7) → `KycUiState.AadhaarRequired` (Task 8) → screen branch (Task 9) → Paparazzi state (Task 10).
- **Known unknowns the executor must resolve by reading, not guessing:** the exact projector test path (Task 6), `KycRepositoryImpl`'s real constructor and PAN entry-point signature (Task 7), `KycScreenContent`'s real parameter list (Tasks 9-10), and whether `Moshi` is already injected into the KYC repository (Task 7).
