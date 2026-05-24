OpenAI Codex v0.125.0 (research preview)
--------
workdir: C:\Alok\Business Projects\Urbanclap-dup
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR, C:\Users\alokt\.codex\memories]
reasoning effort: xhigh
reasoning summaries: none
session id: 019e523a-c023-7740-b990-6f23eb03f627
--------
user
changes against 'main'
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff 360b04d87a5b9a8e609c7b66c07e1bbfcdc1072f' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 4643ms:
diff --git a/.gitignore b/.gitignore
index c49e9549..53709cd6 100644
--- a/.gitignore
+++ b/.gitignore
@@ -95,6 +95,7 @@ ehthumbs.db
 .remember/logs/
 .remember/tmp/
 _bmad-output/implementation-artifacts/
+.superpowers/
 
 # === Codex review markers (persist in git but filter per-story) ===
 # .codex-review-passed — keep committed per-story
diff --git a/api/src/cosmos/booking-repository.ts b/api/src/cosmos/booking-repository.ts
index 04a96c9c..8230594d 100644
--- a/api/src/cosmos/booking-repository.ts
+++ b/api/src/cosmos/booking-repository.ts
@@ -176,6 +176,18 @@ export const bookingRepo = {
     );
   },
 
+  async hasActiveBookingForTechnician(technicianId: string): Promise<boolean> {
+    const { resources } = await getBookingsContainer()
+      .items.query<{ id: string }>({
+        query: `SELECT TOP 1 c.id FROM c
+                WHERE c.technicianId = @technicianId
+                  AND c.status IN ('ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL')`,
+        parameters: [{ name: '@technicianId', value: technicianId }],
+      })
+      .fetchNext();
+    return resources.length > 0;
+  },
+
   async getByCustomerId(customerId: string): Promise<BookingDoc[]> {
     const { resources } = await getBookingsContainer()
       .items.query<BookingDoc>({
diff --git a/api/src/functions/users-erasure-request.ts b/api/src/functions/users-erasure-request.ts
index 45ff6385..6af8e416 100644
--- a/api/src/functions/users-erasure-request.ts
+++ b/api/src/functions/users-erasure-request.ts
@@ -11,6 +11,7 @@ import {
   getActiveErasureRequestForUser,
   replaceErasureRequest,
 } from '../cosmos/erasure-request-repository.js';
+import { bookingRepo } from '../cosmos/booking-repository.js';
 import {
   ErasureRequestSubmitBodySchema,
   ERASURE_GRACE_PERIOD_MS,
@@ -41,6 +42,14 @@ export async function submitErasureRequestHandler(
   const { uid } = auth;
   const role = await inferUserRole(uid);
 
+  // Gate: refuse deletion if an active booking exists for this technician.
+  if (role === 'TECHNICIAN') {
+    const hasActive = await bookingRepo.hasActiveBookingForTechnician(uid);
+    if (hasActive) {
+      return { status: 409, jsonBody: { code: 'ACTIVE_JOB_EXISTS' } };
+    }
+  }
+
   let body: unknown;
   try {
     body = await req.json();
diff --git a/api/tests/cosmos/booking-repository-hasActiveBookingForTechnician.test.ts b/api/tests/cosmos/booking-repository-hasActiveBookingForTechnician.test.ts
new file mode 100644
index 00000000..7adfc129
--- /dev/null
+++ b/api/tests/cosmos/booking-repository-hasActiveBookingForTechnician.test.ts
@@ -0,0 +1,43 @@
+import { describe, it, expect, vi, beforeEach } from 'vitest';
+
+// Mock the Cosmos client before importing the module under test.
+vi.mock('../../src/cosmos/client.js', () => ({
+  getBookingsContainer: vi.fn(),
+}));
+
+import { getBookingsContainer } from '../../src/cosmos/client.js';
+import { bookingRepo } from '../../src/cosmos/booking-repository.js';
+
+function makeContainer(resources: unknown[]) {
+  return {
+    items: {
+      query: vi.fn().mockReturnValue({
+        fetchNext: vi.fn().mockResolvedValue({ resources }),
+      }),
+    },
+  };
+}
+
+describe('bookingRepo.hasActiveBookingForTechnician', () => {
+  beforeEach(() => vi.clearAllMocks());
+
+  it('returns true when an active booking exists', async () => {
+    vi.mocked(getBookingsContainer).mockReturnValue(
+      makeContainer([{ id: 'bk-1', status: 'IN_PROGRESS' }]) as never,
+    );
+
+    const result = await bookingRepo.hasActiveBookingForTechnician('tech-123');
+
+    expect(result).toBe(true);
+  });
+
+  it('returns false when no active bookings exist', async () => {
+    vi.mocked(getBookingsContainer).mockReturnValue(
+      makeContainer([]) as never,
+    );
+
+    const result = await bookingRepo.hasActiveBookingForTechnician('tech-123');
+
+    expect(result).toBe(false);
+  });
+});
diff --git a/api/tests/functions/users-erasure-request.test.ts b/api/tests/functions/users-erasure-request.test.ts
new file mode 100644
index 00000000..f9d20516
--- /dev/null
+++ b/api/tests/functions/users-erasure-request.test.ts
@@ -0,0 +1,91 @@
+import { describe, it, expect, vi, beforeEach } from 'vitest';
+import type { HttpRequest, InvocationContext } from '@azure/functions';
+
+vi.mock('../../src/bootstrap.js', () => ({}));
+vi.mock('../../src/services/firebaseAdmin.js', () => ({
+  verifyFirebaseIdToken: vi.fn(),
+}));
+vi.mock('../../src/services/userRole.service.js', () => ({
+  inferUserRole: vi.fn(),
+}));
+vi.mock('../../src/cosmos/booking-repository.js', () => ({
+  bookingRepo: { hasActiveBookingForTechnician: vi.fn() },
+}));
+vi.mock('../../src/cosmos/erasure-request-repository.js', () => ({
+  createErasureRequest: vi.fn(),
+  DuplicatePendingError: class DuplicatePendingError extends Error {
+    constructor() { super('ERASURE_REQUEST_PENDING'); }
+  },
+  getActiveErasureRequestForUser: vi.fn(),
+  replaceErasureRequest: vi.fn(),
+}));
+vi.mock('../../src/services/auditLog.service.js', () => ({
+  auditLog: vi.fn(),
+}));
+
+import { verifyFirebaseIdToken } from '../../src/services/firebaseAdmin.js';
+import { inferUserRole } from '../../src/services/userRole.service.js';
+import { bookingRepo } from '../../src/cosmos/booking-repository.js';
+import { createErasureRequest } from '../../src/cosmos/erasure-request-repository.js';
+import { submitErasureRequestHandler } from '../../src/functions/users-erasure-request.js';
+
+function makeRequest(body: unknown, token: string | null = 'valid-token'): HttpRequest {
+  return {
+    headers: {
+      get: (k: string) => {
+        if (k !== 'authorization') return null;
+        return token !== null ? `Bearer ${token}` : null;
+      },
+    },
+    json: async () => body,
+  } as unknown as HttpRequest;
+}
+
+const ctx = {} as InvocationContext;
+
+describe('submitErasureRequestHandler', () => {
+  beforeEach(() => {
+    vi.clearAllMocks();
+    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'user-1' } as never);
+    vi.mocked(inferUserRole).mockResolvedValue('TECHNICIAN');
+    vi.mocked(bookingRepo.hasActiveBookingForTechnician).mockResolvedValue(false);
+    vi.mocked(createErasureRequest).mockResolvedValue(undefined);
+  });
+
+  it('returns 201 when no active job and valid phrase', async () => {
+    const req = makeRequest({ confirmationPhrase: 'DELETE MY ACCOUNT' });
+
+    const res = await submitErasureRequestHandler(req, ctx);
+
+    expect(res.status).toBe(201);
+    expect((res.jsonBody as { status: string }).status).toBe('PENDING');
+  });
+
+  it('returns 409 ACTIVE_JOB_EXISTS when technician has an active booking', async () => {
+    vi.mocked(bookingRepo.hasActiveBookingForTechnician).mockResolvedValue(true);
+    const req = makeRequest({ confirmationPhrase: 'DELETE MY ACCOUNT' });
+
+    const res = await submitErasureRequestHandler(req, ctx);
+
+    expect(res.status).toBe(409);
+    expect((res.jsonBody as { code: string }).code).toBe('ACTIVE_JOB_EXISTS');
+    expect(createErasureRequest).not.toHaveBeenCalled();
+  });
+
+  it('returns 400 when confirmation phrase is wrong', async () => {
+    const req = makeRequest({ confirmationPhrase: 'delete account' });
+
+    const res = await submitErasureRequestHandler(req, ctx);
+
+    expect(res.status).toBe(400);
+    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
+  });
+
+  it('returns 401 when no auth header', async () => {
+    const req = makeRequest({ confirmationPhrase: 'DELETE MY ACCOUNT' }, null);
+
+    const res = await submitErasureRequestHandler(req, ctx);
+
+    expect(res.status).toBe(401);
+  });
+});
diff --git a/api/tests/unit/users-erasure-request.test.ts b/api/tests/unit/users-erasure-request.test.ts
index cba61dc2..56937b68 100644
--- a/api/tests/unit/users-erasure-request.test.ts
+++ b/api/tests/unit/users-erasure-request.test.ts
@@ -9,6 +9,10 @@ vi.mock('../../src/services/userRole.service.js', () => ({
   inferUserRole: vi.fn().mockResolvedValue('CUSTOMER'),
 }));
 
+vi.mock('../../src/cosmos/booking-repository.js', () => ({
+  bookingRepo: { hasActiveBookingForTechnician: vi.fn().mockResolvedValue(false) },
+}));
+
 vi.mock('../../src/cosmos/erasure-request-repository.js', async (importOriginal) => {
   const actual = await importOriginal<typeof import('../../src/cosmos/erasure-request-repository.js')>();
   return {
diff --git a/docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md b/docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md
new file mode 100644
index 00000000..97254567
--- /dev/null
+++ b/docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md
@@ -0,0 +1,1592 @@
+# E20-S08 Account Deletion — Implementation Plan
+
+> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
+
+**Goal:** Add Play-Store-mandatory account deletion to the HomeHeroo Technician app: in-app deletion UI, API active-job gate, and a public web form for uninstalled users.
+
+**Architecture:** The API's erasure pipeline (schema, cron, cascade) is fully built from PR #257 — this story adds only the active-job pre-check to the submit handler and the entire Android UI path. The app uses a new `ErasureApiService` (Retrofit) → `ErasureRepositoryImpl` → `SubmitErasureRequestUseCase` → `DeleteAccountViewModel` chain. After the user confirms deletion the app signs them out; erasure runs server-side 7 days later via cron.
+
+**Tech Stack:** Kotlin + Compose, Hilt DI, Retrofit, JUnit 5 + MockK + Paparazzi; TypeScript + Vitest (API); values/strings.xml EN + HI.
+
+---
+
+## Parallel execution note
+
+Tasks 1–2 (API), 3–7 (app data/domain), 10 (strings), and 11 (web form) are all **independent** and can be dispatched to parallel subagents. Tasks 8–9 (ViewModel + screens) depend on Task 7 types. Task 12 (navigation wiring) depends on Tasks 8–9. Task 13 (smoke gate) runs last.
+
+---
+
+## Task 1: API — `hasActiveBookingForTechnician` (TDD)
+
+**Files:**
+- Modify: `api/src/cosmos/booking-repository.ts`
+- Create: `api/src/cosmos/booking-repository.test.ts`
+
+- [ ] **Step 1: Write the failing test**
+
+Create `api/src/cosmos/booking-repository.test.ts`:
+
+```typescript
+import { describe, it, expect, vi, beforeEach } from 'vitest';
+
+// Mock the Cosmos client before importing the module under test.
+vi.mock('./client.js', () => ({
+  getBookingsContainer: vi.fn(),
+}));
+
+import { getBookingsContainer } from './client.js';
+import { bookingRepo } from './booking-repository.js';
+
+function makeContainer(resources: unknown[]) {
+  return {
+    items: {
+      query: vi.fn().mockReturnValue({
+        fetchNext: vi.fn().mockResolvedValue({ resources }),
+      }),
+    },
+  };
+}
+
+describe('bookingRepo.hasActiveBookingForTechnician', () => {
+  beforeEach(() => vi.clearAllMocks());
+
+  it('returns true when an active booking exists', async () => {
+    vi.mocked(getBookingsContainer).mockReturnValue(
+      makeContainer([{ id: 'bk-1', status: 'IN_PROGRESS' }]) as never,
+    );
+
+    const result = await bookingRepo.hasActiveBookingForTechnician('tech-123');
+
+    expect(result).toBe(true);
+  });
+
+  it('returns false when no active bookings exist', async () => {
+    vi.mocked(getBookingsContainer).mockReturnValue(
+      makeContainer([]) as never,
+    );
+
+    const result = await bookingRepo.hasActiveBookingForTechnician('tech-123');
+
+    expect(result).toBe(false);
+  });
+});
+```
+
+- [ ] **Step 2: Run test to verify it fails**
+
+```bash
+cd api && npx vitest run src/cosmos/booking-repository.test.ts
+```
+
+Expected: FAIL — `bookingRepo.hasActiveBookingForTechnician is not a function`
+
+- [ ] **Step 3: Add method to `api/src/cosmos/booking-repository.ts`**
+
+Add this method to the `bookingRepo` object (after `getByTechnicianId`):
+
+```typescript
+  async hasActiveBookingForTechnician(technicianId: string): Promise<boolean> {
+    const { resources } = await getBookingsContainer()
+      .items.query<{ id: string }>({
+        query: `SELECT TOP 1 c.id FROM c
+                WHERE c.technicianId = @technicianId
+                  AND c.status IN ('ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL')`,
+        parameters: [{ name: '@technicianId', value: technicianId }],
+      })
+      .fetchNext();
+    return resources.length > 0;
+  },
+```
+
+- [ ] **Step 4: Run test to verify it passes**
+
+```bash
+cd api && npx vitest run src/cosmos/booking-repository.test.ts
+```
+
+Expected: 2 tests PASS
+
+- [ ] **Step 5: Commit**
+
+```bash
+git add api/src/cosmos/booking-repository.ts api/src/cosmos/booking-repository.test.ts
+git commit -m "feat(api): add hasActiveBookingForTechnician to booking-repository (E20-S08)"
+```
+
+---
+
+## Task 2: API — active-job gate in erasure submit handler (TDD)
+
+**Files:**
+- Create: `api/src/functions/users-erasure-request.test.ts`
+- Modify: `api/src/functions/users-erasure-request.ts`
+
+- [ ] **Step 1: Write the failing tests**
+
+Create `api/src/functions/users-erasure-request.test.ts`:
+
+```typescript
+import { describe, it, expect, vi, beforeEach } from 'vitest';
+import type { HttpRequest, InvocationContext } from '@azure/functions';
+
+vi.mock('../bootstrap.js', () => ({}));
+vi.mock('../services/firebaseAdmin.js', () => ({
+  verifyFirebaseIdToken: vi.fn(),
+}));
+vi.mock('../services/userRole.service.js', () => ({
+  inferUserRole: vi.fn(),
+}));
+vi.mock('../cosmos/booking-repository.js', () => ({
+  bookingRepo: { hasActiveBookingForTechnician: vi.fn() },
+}));
+vi.mock('../cosmos/erasure-request-repository.js', () => ({
+  createErasureRequest: vi.fn(),
+  DuplicatePendingError: class DuplicatePendingError extends Error {
+    constructor() { super('ERASURE_REQUEST_PENDING'); }
+  },
+  getActiveErasureRequestForUser: vi.fn(),
+  replaceErasureRequest: vi.fn(),
+}));
+vi.mock('../services/auditLog.service.js', () => ({
+  auditLog: vi.fn(),
+}));
+
+import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';
+import { inferUserRole } from '../services/userRole.service.js';
+import { bookingRepo } from '../cosmos/booking-repository.js';
+import { createErasureRequest } from '../cosmos/erasure-request-repository.js';
+import { submitErasureRequestHandler } from './users-erasure-request.js';
+
+function makeRequest(body: unknown, token = 'valid-token'): HttpRequest {
+  return {
+    headers: { get: (k: string) => (k === 'authorization' ? `Bearer ${token}` : null) },
+    json: async () => body,
+  } as unknown as HttpRequest;
+}
+
+const ctx = {} as InvocationContext;
+
+describe('submitErasureRequestHandler', () => {
+  beforeEach(() => {
+    vi.clearAllMocks();
+    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'user-1' } as never);
+    vi.mocked(inferUserRole).mockResolvedValue('TECHNICIAN');
+    vi.mocked(bookingRepo.hasActiveBookingForTechnician).mockResolvedValue(false);
+    vi.mocked(createErasureRequest).mockResolvedValue(undefined);
+  });
+
+  it('returns 201 when no active job and valid phrase', async () => {
+    const req = makeRequest({ confirmationPhrase: 'DELETE MY ACCOUNT' });
+
+    const res = await submitErasureRequestHandler(req, ctx);
+
+    expect(res.status).toBe(201);
+    expect((res.jsonBody as { status: string }).status).toBe('PENDING');
+  });
+
+  it('returns 409 ACTIVE_JOB_EXISTS when technician has an active booking', async () => {
+    vi.mocked(bookingRepo.hasActiveBookingForTechnician).mockResolvedValue(true);
+    const req = makeRequest({ confirmationPhrase: 'DELETE MY ACCOUNT' });
+
+    const res = await submitErasureRequestHandler(req, ctx);
+
+    expect(res.status).toBe(409);
+    expect((res.jsonBody as { code: string }).code).toBe('ACTIVE_JOB_EXISTS');
+    expect(createErasureRequest).not.toHaveBeenCalled();
+  });
+
+  it('returns 400 when confirmation phrase is wrong', async () => {
+    const req = makeRequest({ confirmationPhrase: 'delete account' });
+
+    const res = await submitErasureRequestHandler(req, ctx);
+
+    expect(res.status).toBe(400);
+    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
+  });
+
+  it('returns 401 when no auth header', async () => {
+    const req = makeRequest({ confirmationPhrase: 'DELETE MY ACCOUNT' }, '');
+
+    const res = await submitErasureRequestHandler(req, ctx);
+
+    expect(res.status).toBe(401);
+  });
+});
+```
+
+- [ ] **Step 2: Run tests to verify they fail**
+
+```bash
+cd api && npx vitest run src/functions/users-erasure-request.test.ts
+```
+
+Expected: FAIL — `ACTIVE_JOB_EXISTS` test passes unexpectedly because the gate doesn't exist yet.
+
+- [ ] **Step 3: Add active-job gate to `api/src/functions/users-erasure-request.ts`**
+
+Add this import at the top of the file (with the other repo imports):
+
+```typescript
+import { bookingRepo } from '../cosmos/booking-repository.js';
+```
+
+Then in `submitErasureRequestHandler`, after the `inferUserRole` call and before body parsing, add:
+
+```typescript
+  // Gate: refuse deletion if an active booking exists for this technician.
+  if (role === 'TECHNICIAN') {
+    const hasActive = await bookingRepo.hasActiveBookingForTechnician(uid);
+    if (hasActive) {
+      return { status: 409, jsonBody: { code: 'ACTIVE_JOB_EXISTS' } };
+    }
+  }
+```
+
+- [ ] **Step 4: Run tests to verify they pass**
+
+```bash
+cd api && npx vitest run src/functions/users-erasure-request.test.ts
+```
+
+Expected: 4 tests PASS
+
+- [ ] **Step 5: Commit**
+
+```bash
+git add api/src/functions/users-erasure-request.ts api/src/functions/users-erasure-request.test.ts
+git commit -m "feat(api): active-job gate for erasure-request submit handler (E20-S08)"
+```
+
+---
+
+## Task 3: String resources (EN + HI)
+
+**Files:**
+- Modify: `technician-app/app/src/main/res/values/strings.xml`
+- Modify: `technician-app/app/src/main/res/values-hi/strings.xml`
+
+- [ ] **Step 1: Add English strings**
+
+Open `technician-app/app/src/main/res/values/strings.xml`. After the `<!-- Language settings -->` block (around line 67), add:
+
+```xml
+    <!-- Account deletion (E20-S08) -->
+    <string name="settings_delete_account_title">Delete my account</string>
+    <string name="settings_delete_account_subtitle">Permanently remove your profile and data</string>
+    <string name="delete_account_title">Delete account</string>
+    <string name="delete_account_warning">This is permanent and cannot be undone</string>
+    <string name="delete_account_what_gets_deleted">What gets deleted</string>
+    <string name="delete_account_item_profile">Your profile and phone number</string>
+    <string name="delete_account_item_kyc">KYC documents (Aadhaar, PAN)</string>
+    <string name="delete_account_item_earnings">Earnings history and payout records</string>
+    <string name="delete_account_item_photos">Job photos and work history</string>
+    <string name="delete_account_item_ratings">Ratings received from customers</string>
+    <string name="delete_account_footnote">Data deleted within 7 days of confirmation</string>
+    <string name="delete_account_confirm_button">Yes, delete my account</string>
+    <string name="delete_account_cancel_button">Cancel</string>
+    <string name="delete_account_active_job_title">Job in progress</string>
+    <string name="delete_account_active_job_error">Complete or cancel your current job before deleting your account</string>
+    <string name="delete_account_active_job_ok">OK</string>
+    <string name="delete_account_duplicate_pending">A deletion request is already pending for your account</string>
+    <string name="delete_account_generic_error">Something went wrong. Please try again.</string>
+    <string name="account_deleted_title">Deletion request submitted</string>
+    <string name="account_deleted_body">Your account is scheduled for deletion on %1$s.</string>
+    <string name="account_deleted_revocation_hint">Changed your mind? Email support@homeheroo.in with subject \'Cancel account deletion\' and your phone number before %1$s.</string>
+    <string name="account_deleted_web_form_label">Lost access to the app? Request deletion here</string>
+    <string name="account_deleted_done">Done</string>
+    <string name="deletion_request_url">https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/</string>
+```
+
+- [ ] **Step 2: Add Hindi strings**
+
+Open `technician-app/app/src/main/res/values-hi/strings.xml`. Add the same keys with Hindi values:
+
+```xml
+    <!-- Account deletion (E20-S08) -->
+    <string name="settings_delete_account_title">अकाउंट हटाएं</string>
+    <string name="settings_delete_account_subtitle">आपकी प्रोफ़ाइल और डेटा स्थायी रूप से हटाएं</string>
+    <string name="delete_account_title">अकाउंट हटाएं</string>
+    <string name="delete_account_warning">यह स्थायी है और पूर्ववत नहीं होगा</string>
+    <string name="delete_account_what_gets_deleted">क्या हटाया जाएगा</string>
+    <string name="delete_account_item_profile">आपकी प्रोफ़ाइल और फ़ोन नंबर</string>
+    <string name="delete_account_item_kyc">KYC दस्तावेज़ (आधार, पैन)</string>
+    <string name="delete_account_item_earnings">कमाई इतिहास और भुगतान रिकॉर्ड</string>
+    <string name="delete_account_item_photos">जॉब फ़ोटो और कार्य इतिहास</string>
+    <string name="delete_account_item_ratings">ग्राहकों की रेटिंग</string>
+    <string name="delete_account_footnote">पुष्टि के 7 दिनों के भीतर डेटा हटाया जाएगा</string>
+    <string name="delete_account_confirm_button">हाँ, मेरा अकाउंट हटाएं</string>
+    <string name="delete_account_cancel_button">रद्द करें</string>
+    <string name="delete_account_active_job_title">जॉब जारी है</string>
+    <string name="delete_account_active_job_error">अकाउंट हटाने से पहले अपनी मौजूदा जॉब पूरी करें या रद्द करें</string>
+    <string name="delete_account_active_job_ok">ठीक है</string>
+    <string name="delete_account_duplicate_pending">आपके अकाउंट के लिए पहले से एक हटाने का अनुरोध लंबित है</string>
+    <string name="delete_account_generic_error">कुछ गड़बड़ी हुई। कृपया पुनः प्रयास करें।</string>
+    <string name="account_deleted_title">हटाने का अनुरोध सबमिट हुआ</string>
+    <string name="account_deleted_body">आपका अकाउंट %1$s को हटाया जाएगा।</string>
+    <string name="account_deleted_revocation_hint">मन बदला? %1$s से पहले support@homeheroo.in पर \'Cancel account deletion\' subject से अपना फ़ोन नंबर लिखकर ईमेल करें।</string>
+    <string name="account_deleted_web_form_label">ऐप तक पहुंच खो गई? यहाँ हटाने का अनुरोध करें</string>
+    <string name="account_deleted_done">हो गया</string>
+    <string name="deletion_request_url">https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/</string>
+```
+
+- [ ] **Step 3: Commit**
+
+```bash
+git add technician-app/app/src/main/res/values/strings.xml technician-app/app/src/main/res/values-hi/strings.xml
+git commit -m "feat(technician-app): add account-deletion string resources EN + HI (E20-S08)"
+```
+
+---
+
+## Task 4: ErasureApiService — Retrofit interface
+
+**Files:**
+- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt`
+
+- [ ] **Step 1: Create the file**
+
+```kotlin
+package com.homeservices.technician.data.erasure.remote
+
+import retrofit2.Response
+import retrofit2.http.Body
+import retrofit2.http.DELETE
+import retrofit2.http.POST
+
+public interface ErasureApiService {
+    @POST("v1/users/me/erasure-request")
+    public suspend fun submitErasureRequest(
+        @Body body: ErasureSubmitRequestBody,
+    ): Response<ErasureSubmitResponseBody>
+
+    @DELETE("v1/users/me/erasure-request")
+    public suspend fun revokeErasureRequest(): Response<Unit>
+}
+
+public data class ErasureSubmitRequestBody(
+    val confirmationPhrase: String,
+    val reason: String? = null,
+)
+
+public data class ErasureSubmitResponseBody(
+    val erasureId: String,
+    val scheduledDeletionAt: String,
+    val status: String,
+)
+```
+
+- [ ] **Step 2: Commit**
+
+```bash
+git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt
+git commit -m "feat(technician-app): add ErasureApiService Retrofit interface (E20-S08)"
+```
+
+---
+
+## Task 5: ErasureRepository interface + ErasureRepositoryImpl
+
+**Files:**
+- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt`
+- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt`
+
+- [ ] **Step 1: Create the domain interface**
+
+```kotlin
+package com.homeservices.technician.domain.erasure
+
+public sealed class ErasureSubmitResult {
+    public data class Success(val scheduledDeletionAt: String) : ErasureSubmitResult()
+    public object ActiveJobExists : ErasureSubmitResult()
+    public object DuplicatePending : ErasureSubmitResult()
+    public data class UnknownError(val message: String) : ErasureSubmitResult()
+}
+
+public interface ErasureRepository {
+    public suspend fun submitRequest(reason: String? = null): ErasureSubmitResult
+    public suspend fun revokeRequest(): Result<Unit>
+}
+```
+
+- [ ] **Step 2: Create the data implementation**
+
+`technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt`:
+
+```kotlin
+package com.homeservices.technician.data.erasure
+
+import com.homeservices.technician.data.erasure.remote.ErasureApiService
+import com.homeservices.technician.data.erasure.remote.ErasureSubmitRequestBody
+import com.homeservices.technician.domain.erasure.ErasureRepository
+import com.homeservices.technician.domain.erasure.ErasureSubmitResult
+import javax.inject.Inject
+
+private const val CONFIRMATION_PHRASE = "DELETE MY ACCOUNT"
+private const val HTTP_CONFLICT = 409
+
+public class ErasureRepositoryImpl
+    @Inject
+    constructor(
+        private val api: ErasureApiService,
+    ) : ErasureRepository {
+        public override suspend fun submitRequest(reason: String?): ErasureSubmitResult =
+            runCatching {
+                val response = api.submitErasureRequest(
+                    ErasureSubmitRequestBody(confirmationPhrase = CONFIRMATION_PHRASE, reason = reason),
+                )
+                when {
+                    response.isSuccessful -> {
+                        val body = checkNotNull(response.body()) { "Null body on 2xx" }
+                        ErasureSubmitResult.Success(body.scheduledDeletionAt)
+                    }
+                    response.code() == HTTP_CONFLICT -> {
+                        val raw = response.errorBody()?.string() ?: ""
+                        if (raw.contains("ACTIVE_JOB_EXISTS")) {
+                            ErasureSubmitResult.ActiveJobExists
+                        } else {
+                            ErasureSubmitResult.DuplicatePending
+                        }
+                    }
+                    else -> ErasureSubmitResult.UnknownError("HTTP ${response.code()}")
+                }
+            }.getOrElse { e -> ErasureSubmitResult.UnknownError(e.message ?: "Unknown") }
+
+        public override suspend fun revokeRequest(): Result<Unit> =
+            runCatching {
+                val response = api.revokeErasureRequest()
+                if (!response.isSuccessful) {
+                    throw RuntimeException("Revoke failed: HTTP ${response.code()}")
+                }
+            }
+    }
+```
+
+- [ ] **Step 3: Commit**
+
+```bash
+git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt
+git commit -m "feat(technician-app): ErasureRepository interface + impl (E20-S08)"
+```
+
+---
+
+## Task 6: ErasureModule — Hilt wiring
+
+**Files:**
+- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/di/ErasureModule.kt`
+
+- [ ] **Step 1: Create the Hilt module**
+
+```kotlin
+package com.homeservices.technician.data.erasure.di
+
+import com.homeservices.technician.data.erasure.ErasureRepositoryImpl
+import com.homeservices.technician.data.erasure.remote.ErasureApiService
+import com.homeservices.technician.domain.erasure.ErasureRepository
+import dagger.Binds
+import dagger.Module
+import dagger.Provides
+import dagger.hilt.InstallIn
+import dagger.hilt.components.SingletonComponent
+import retrofit2.Retrofit
+import javax.inject.Singleton
+
+@Module
+@InstallIn(SingletonComponent::class)
+public abstract class ErasureModule {
+    @Binds
+    internal abstract fun bindErasureRepository(impl: ErasureRepositoryImpl): ErasureRepository
+
+    public companion object {
+        @Provides
+        @Singleton
+        public fun provideErasureApiService(retrofit: Retrofit): ErasureApiService =
+            retrofit.create(ErasureApiService::class.java)
+    }
+}
+```
+
+- [ ] **Step 2: Commit**
+
+```bash
+git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/di/ErasureModule.kt
+git commit -m "feat(technician-app): ErasureModule Hilt wiring (E20-S08)"
+```
+
+---
+
+## Task 7: SubmitErasureRequestUseCase (TDD)
+
+**Files:**
+- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/erasure/SubmitErasureRequestUseCaseTest.kt`
+- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/SubmitErasureRequestUseCase.kt`
+
+- [ ] **Step 1: Write the failing tests**
+
+```kotlin
+package com.homeservices.technician.domain.erasure
+
+import com.homeservices.technician.domain.activeJob.ActiveJobRepository
+import com.homeservices.technician.domain.activeJob.model.ActiveJob
+import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
+import com.homeservices.technician.domain.activeJob.model.LatLng
+import io.mockk.coEvery
+import io.mockk.coVerify
+import io.mockk.every
+import io.mockk.mockk
+import kotlinx.coroutines.flow.MutableStateFlow
+import kotlinx.coroutines.test.runTest
+import org.assertj.core.api.Assertions.assertThat
+import org.junit.jupiter.api.BeforeEach
+import org.junit.jupiter.api.Test
+
+class SubmitErasureRequestUseCaseTest {
+    private val erasureRepository: ErasureRepository = mockk()
+    private val activeJobRepository: ActiveJobRepository = mockk()
+    private lateinit var useCase: SubmitErasureRequestUseCase
+
+    private fun activeJob() = ActiveJob(
+        bookingId = "bk-1",
+        customerId = "c-1",
+        serviceId = "svc-1",
+        serviceName = "AC Repair",
+        addressText = "12 Main St",
+        addressLatLng = LatLng(12.0, 77.0),
+        status = ActiveJobStatus.IN_PROGRESS,
+        slotDate = "2026-05-22",
+        slotWindow = "10:00-12:00",
+    )
+
+    @BeforeEach
+    fun setUp() {
+        useCase = SubmitErasureRequestUseCase(erasureRepository, activeJobRepository)
+    }
+
+    @Test
+    fun `returns ActiveJobExists without network call when activeJobState is non-null`() = runTest {
+        every { activeJobRepository.activeJobState } returns MutableStateFlow(activeJob())
+
+        val result = useCase()
+
+        assertThat(result).isEqualTo(ErasureSubmitResult.ActiveJobExists)
+        coVerify(exactly = 0) { erasureRepository.submitRequest(any()) }
+    }
+
+    @Test
+    fun `calls repository when activeJobState is null and returns Success`() = runTest {
+        every { activeJobRepository.activeJobState } returns MutableStateFlow(null)
+        coEvery { erasureRepository.submitRequest(null) } returns
+            ErasureSubmitResult.Success("2026-05-29T02:00:00.000Z")
+
+        val result = useCase()
+
+        assertThat(result).isEqualTo(ErasureSubmitResult.Success("2026-05-29T02:00:00.000Z"))
+    }
+
+    @Test
+    fun `propagates ActiveJobExists from server when activeJobState is null`() = runTest {
+        every { activeJobRepository.activeJobState } returns MutableStateFlow(null)
+        coEvery { erasureRepository.submitRequest(null) } returns ErasureSubmitResult.ActiveJobExists
+
+        val result = useCase()
+
+        assertThat(result).isEqualTo(ErasureSubmitResult.ActiveJobExists)
+    }
+
+    @Test
+    fun `propagates UnknownError from repository`() = runTest {
+        every { activeJobRepository.activeJobState } returns MutableStateFlow(null)
+        coEvery { erasureRepository.submitRequest(null) } returns
+            ErasureSubmitResult.UnknownError("HTTP 500")
+
+        val result = useCase()
+
+        assertThat(result).isEqualTo(ErasureSubmitResult.UnknownError("HTTP 500"))
+    }
+}
+```
+
+- [ ] **Step 2: Run test to verify it fails**
+
+```bash
+cd technician-app && ./gradlew testDebugUnitTest --tests "com.homeservices.technician.domain.erasure.SubmitErasureRequestUseCaseTest" 2>&1 | tail -20
+```
+
+Expected: FAIL — `SubmitErasureRequestUseCase` does not exist.
+
+- [ ] **Step 3: Create the use case**
+
+```kotlin
+package com.homeservices.technician.domain.erasure
+
+import com.homeservices.technician.domain.activeJob.ActiveJobRepository
+import javax.inject.Inject
+import javax.inject.Singleton
+
+@Singleton
+public class SubmitErasureRequestUseCase
+    @Inject
+    constructor(
+        private val erasureRepository: ErasureRepository,
+        private val activeJobRepository: ActiveJobRepository,
+    ) {
+        public suspend operator fun invoke(reason: String? = null): ErasureSubmitResult {
+            // Fast-path: activeJobState is non-null only while observing an active job.
+            // The server gate (§2) is authoritative for cases the client can't see.
+            if (activeJobRepository.activeJobState.value != null) {
+                return ErasureSubmitResult.ActiveJobExists
+            }
+            return erasureRepository.submitRequest(reason)
+        }
+    }
+```
+
+- [ ] **Step 4: Run test to verify it passes**
+
+```bash
+cd technician-app && ./gradlew testDebugUnitTest --tests "com.homeservices.technician.domain.erasure.SubmitErasureRequestUseCaseTest" 2>&1 | tail -10
+```
+
+Expected: 4 tests PASS
+
+- [ ] **Step 5: Commit**
+
+```bash
+git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/SubmitErasureRequestUseCase.kt technician-app/app/src/test/kotlin/com/homeservices/technician/domain/erasure/SubmitErasureRequestUseCaseTest.kt
+git commit -m "feat(technician-app): SubmitErasureRequestUseCase with active-job client gate (E20-S08)"
+```
+
+---
+
+## Task 8: DeleteAccountViewModel (TDD)
+
+**Files:**
+- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/deleteaccount/DeleteAccountViewModelTest.kt`
+- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/deleteaccount/DeleteAccountViewModel.kt`
+
+- [ ] **Step 1: Write the failing tests**
+
+```kotlin
+package com.homeservices.technician.ui.deleteaccount
+
+import com.homeservices.technician.domain.erasure.ErasureSubmitResult
+import com.homeservices.technician.domain.erasure.SubmitErasureRequestUseCase
+import io.mockk.coEvery
+import io.mockk.mockk
+import kotlinx.coroutines.Dispatchers
+import kotlinx.coroutines.ExperimentalCoroutinesApi
+import kotlinx.coroutines.test.StandardTestDispatcher
+import kotlinx.coroutines.test.advanceUntilIdle
+import kotlinx.coroutines.test.resetMain
+import kotlinx.coroutines.test.runTest
+import kotlinx.coroutines.test.setMain
+import org.assertj.core.api.Assertions.assertThat
+import org.junit.jupiter.api.AfterEach
+import org.junit.jupiter.api.BeforeEach
+import org.junit.jupiter.api.Test
+
+@OptIn(ExperimentalCoroutinesApi::class)
+class DeleteAccountViewModelTest {
+    private val dispatcher = StandardTestDispatcher()
+    private val submitUseCase: SubmitErasureRequestUseCase = mockk()
+
+    @BeforeEach fun setUp() { Dispatchers.setMain(dispatcher) }
+    @AfterEach fun tearDown() { Dispatchers.resetMain() }
+
+    private fun vm() = DeleteAccountViewModel(submitUseCase)
+
+    @Test fun `initial state is Idle`() = runTest {
+        val vm = vm()
+        assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.Idle)
+    }
+
+    @Test fun `onConfirmDelete transitions through Submitting to Done on success`() = runTest {
+        val scheduled = "2026-05-29T02:00:00.000Z"
+        coEvery { submitUseCase() } returns ErasureSubmitResult.Success(scheduled)
+        val vm = vm()
+
+        vm.onConfirmDelete()
+        assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.Submitting)
+
+        advanceUntilIdle()
+        assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.Done(scheduled))
+    }
+
+    @Test fun `onConfirmDelete sets ActiveJobBlocked when use case returns ActiveJobExists`() = runTest {
+        coEvery { submitUseCase() } returns ErasureSubmitResult.ActiveJobExists
+        val vm = vm()
+
+        vm.onConfirmDelete()
+        advanceUntilIdle()
+
+        assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.ActiveJobBlocked)
+    }
+
+    @Test fun `onConfirmDelete sets Error on DuplicatePending`() = runTest {
+        coEvery { submitUseCase() } returns ErasureSubmitResult.DuplicatePending
+        val vm = vm()
+
+        vm.onConfirmDelete()
+        advanceUntilIdle()
+
+        assertThat(vm.uiState.value).isInstanceOf(DeleteAccountUiState.Error::class.java)
+    }
+
+    @Test fun `onConfirmDelete sets Error on UnknownError`() = runTest {
+        coEvery { submitUseCase() } returns ErasureSubmitResult.UnknownError("HTTP 500")
+        val vm = vm()
+
+        vm.onConfirmDelete()
+        advanceUntilIdle()
+
+        assertThat(vm.uiState.value).isInstanceOf(DeleteAccountUiState.Error::class.java)
+    }
+
+    @Test fun `onDismissError resets to Idle`() = runTest {
+        coEvery { submitUseCase() } returns ErasureSubmitResult.UnknownError("oops")
+        val vm = vm()
+        vm.onConfirmDelete()
+        advanceUntilIdle()
+
+        vm.onDismissError()
+
+        assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.Idle)
+    }
+}
+```
+
+- [ ] **Step 2: Run tests to verify they fail**
+
+```bash
+cd technician-app && ./gradlew testDebugUnitTest --tests "com.homeservices.technician.ui.deleteaccount.DeleteAccountViewModelTest" 2>&1 | tail -20
+```
+
+Expected: FAIL — `DeleteAccountViewModel` and `DeleteAccountUiState` do not exist.
+
+- [ ] **Step 3: Create the ViewModel**
+
+```kotlin
+package com.homeservices.technician.ui.deleteaccount
+
+import androidx.lifecycle.ViewModel
+import androidx.lifecycle.viewModelScope
+import com.homeservices.technician.domain.erasure.ErasureSubmitResult
+import com.homeservices.technician.domain.erasure.SubmitErasureRequestUseCase
+import dagger.hilt.android.lifecycle.HiltViewModel
+import kotlinx.coroutines.flow.MutableStateFlow
+import kotlinx.coroutines.flow.StateFlow
+import kotlinx.coroutines.flow.asStateFlow
+import kotlinx.coroutines.launch
+import javax.inject.Inject
+
+public sealed class DeleteAccountUiState {
+    public object Idle : DeleteAccountUiState()
+    public object ActiveJobBlocked : DeleteAccountUiState()
+    public object Submitting : DeleteAccountUiState()
+    public data class Error(val messageRes: Int) : DeleteAccountUiState()
+    public data class Done(val scheduledDeletionAt: String) : DeleteAccountUiState()
+}
+
+@HiltViewModel
+public class DeleteAccountViewModel
+    @Inject
+    constructor(
+        private val submitErasureRequest: SubmitErasureRequestUseCase,
+    ) : ViewModel() {
+        private val _uiState = MutableStateFlow<DeleteAccountUiState>(DeleteAccountUiState.Idle)
+        public val uiState: StateFlow<DeleteAccountUiState> = _uiState.asStateFlow()
+
+        public fun onConfirmDelete() {
+            _uiState.value = DeleteAccountUiState.Submitting
+            viewModelScope.launch {
+                _uiState.value = when (val result = submitErasureRequest()) {
+                    is ErasureSubmitResult.Success -> DeleteAccountUiState.Done(result.scheduledDeletionAt)
+                    is ErasureSubmitResult.ActiveJobExists -> DeleteAccountUiState.ActiveJobBlocked
+                    is ErasureSubmitResult.DuplicatePending ->
+                        DeleteAccountUiState.Error(R.string.delete_account_duplicate_pending)
+                    is ErasureSubmitResult.UnknownError ->
+                        DeleteAccountUiState.Error(R.string.delete_account_generic_error)
+                }
+            }
+        }
+
+        public fun onDismissError() {
+            _uiState.value = DeleteAccountUiState.Idle
+        }
+    }
+```
+
+- [ ] **Step 4: Run tests to verify they pass**
+
+```bash
+cd technician-app && ./gradlew testDebugUnitTest --tests "com.homeservices.technician.ui.deleteaccount.DeleteAccountViewModelTest" 2>&1 | tail -10
+```
+
+Expected: 6 tests PASS
+
+- [ ] **Step 5: Commit**
+
+```bash
+git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/deleteaccount/DeleteAccountViewModel.kt technician-app/app/src/test/kotlin/com/homeservices/technician/ui/deleteaccount/DeleteAccountViewModelTest.kt
+git commit -m "feat(technician-app): DeleteAccountViewModel + UiState (E20-S08)"
+```
+
+---
+
+## Task 9: DeleteAccountScreen + AccountDeletedScreen + Paparazzi stubs
+
+**Files:**
+- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/deleteaccount/DeleteAccountScreen.kt`
+- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/deleteaccount/AccountDeletedScreen.kt`
+- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/deleteaccount/DeleteAccountScreenPaparazziTest.kt`
+- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/deleteaccount/AccountDeletedScreenPaparazziTest.kt`
+
+- [ ] **Step 1: Create DeleteAccountScreen.kt**
+
+```kotlin
+package com.homeservices.technician.ui.deleteaccount
+
+import androidx.compose.foundation.layout.Column
+import androidx.compose.foundation.layout.Row
+import androidx.compose.foundation.layout.Spacer
+import androidx.compose.foundation.layout.fillMaxSize
+import androidx.compose.foundation.layout.fillMaxWidth
+import androidx.compose.foundation.layout.height
+import androidx.compose.foundation.layout.padding
+import androidx.compose.foundation.rememberScrollState
+import androidx.compose.foundation.verticalScroll
+import androidx.compose.material.icons.Icons
+import androidx.compose.material.icons.filled.ArrowBack
+import androidx.compose.material.icons.filled.Close
+import androidx.compose.material3.AlertDialog
+import androidx.compose.material3.Button
+import androidx.compose.material3.ButtonDefaults
+import androidx.compose.material3.Card
+import androidx.compose.material3.CardDefaults
+import androidx.compose.material3.CircularProgressIndicator
+import androidx.compose.material3.ExperimentalMaterial3Api
+import androidx.compose.material3.Icon
+import androidx.compose.material3.IconButton
+import androidx.compose.material3.MaterialTheme
+import androidx.compose.material3.Scaffold
+import androidx.compose.material3.SnackbarHost
+import androidx.compose.material3.SnackbarHostState
+import androidx.compose.material3.Text
+import androidx.compose.material3.TextButton
+import androidx.compose.material3.TopAppBar
+import androidx.compose.runtime.Composable
+import androidx.compose.runtime.LaunchedEffect
+import androidx.compose.runtime.getValue
+import androidx.compose.runtime.remember
+import androidx.compose.ui.Alignment
+import androidx.compose.ui.Modifier
+import androidx.compose.ui.res.stringResource
+import androidx.compose.ui.unit.dp
+import androidx.hilt.navigation.compose.hiltViewModel
+import androidx.lifecycle.compose.collectAsStateWithLifecycle
+import com.homeservices.technician.R
+
+@OptIn(ExperimentalMaterial3Api::class)
+@Composable
+public fun DeleteAccountScreen(
+    onBack: () -> Unit,
+    onDeleted: (scheduledAt: String) -> Unit,
+    viewModel: DeleteAccountViewModel = hiltViewModel(),
+) {
+    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
+    val snackbarHostState = remember { SnackbarHostState() }
+
+    LaunchedEffect(uiState) {
+        if (uiState is DeleteAccountUiState.Done) {
+            onDeleted((uiState as DeleteAccountUiState.Done).scheduledDeletionAt)
+        }
+    }
+
+    val errorRes = (uiState as? DeleteAccountUiState.Error)?.messageRes
+    if (errorRes != null) {
+        val message = stringResource(errorRes)
+        LaunchedEffect(errorRes) {
+            snackbarHostState.showSnackbar(message)
+            viewModel.onDismissError()
+        }
+    }
+
+    if (uiState == DeleteAccountUiState.ActiveJobBlocked) {
+        AlertDialog(
+            onDismissRequest = onBack,
+            title = { Text(stringResource(R.string.delete_account_active_job_title)) },
+            text = { Text(stringResource(R.string.delete_account_active_job_error)) },
+            confirmButton = {
+                TextButton(onClick = onBack) {
+                    Text(stringResource(R.string.delete_account_active_job_ok))
+                }
+            },
+        )
+    }
+
+    Scaffold(
+        topBar = {
+            TopAppBar(
+                title = { Text(stringResource(R.string.delete_account_title)) },
+                navigationIcon = {
+                    IconButton(onClick = onBack) {
+                        Icon(Icons.Default.ArrowBack, contentDescription = stringResource(R.string.action_back))
+                    }
+                },
+            )
+        },
+        snackbarHost = { SnackbarHost(snackbarHostState) },
+    ) { padding ->
+        DeleteAccountScreenContent(
+            uiState = uiState,
+            onConfirm = viewModel::onConfirmDelete,
+            onCancel = onBack,
+            modifier = Modifier.padding(padding),
+        )
+    }
+}
+
+@Composable
+internal fun DeleteAccountScreenContent(
+    uiState: DeleteAccountUiState,
+    onConfirm: () -> Unit,
+    onCancel: () -> Unit,
+    modifier: Modifier = Modifier,
+) {
+    val isSubmitting = uiState == DeleteAccountUiState.Submitting
+
+    Column(
+        modifier = modifier
+            .fillMaxSize()
+            .verticalScroll(rememberScrollState())
+            .padding(horizontal = 16.dp),
+    ) {
+        Spacer(Modifier.height(16.dp))
+        Card(
+            colors = CardDefaults.cardColors(
+                containerColor = MaterialTheme.colorScheme.errorContainer,
+            ),
+            modifier = Modifier.fillMaxWidth(),
+        ) {
+            Text(
+                text = stringResource(R.string.delete_account_warning),
+                style = MaterialTheme.typography.bodyMedium,
+                color = MaterialTheme.colorScheme.onErrorContainer,
+                modifier = Modifier.padding(16.dp),
+            )
+        }
+        Spacer(Modifier.height(24.dp))
+        Text(
+            text = stringResource(R.string.delete_account_what_gets_deleted),
+            style = MaterialTheme.typography.titleMedium,
+        )
+        Spacer(Modifier.height(12.dp))
+        val items = listOf(
+            R.string.delete_account_item_profile,
+            R.string.delete_account_item_kyc,
+            R.string.delete_account_item_earnings,
+            R.string.delete_account_item_photos,
+            R.string.delete_account_item_ratings,
+        )
+        items.forEach { res ->
+            Row(
+                verticalAlignment = Alignment.Top,
+                modifier = Modifier.padding(vertical = 4.dp),
+            ) {
+                Icon(
+                    Icons.Default.Close,
+                    contentDescription = null,
+                    tint = MaterialTheme.colorScheme.error,
+                    modifier = Modifier.padding(end = 8.dp, top = 2.dp),
+                )
+                Text(
+                    text = stringResource(res),
+                    style = MaterialTheme.typography.bodyMedium,
+                )
+            }
+        }
+        Spacer(Modifier.height(12.dp))
+        Text(
+            text = stringResource(R.string.delete_account_footnote),
+            style = MaterialTheme.typography.bodySmall,
+            color = MaterialTheme.colorScheme.onSurfaceVariant,
+        )
+        Spacer(Modifier.height(32.dp))
+        Button(
+            onClick = onConfirm,
+            enabled = !isSubmitting,
+            colors = ButtonDefaults.buttonColors(
+                containerColor = MaterialTheme.colorScheme.error,
+            ),
+            modifier = Modifier.fillMaxWidth(),
+        ) {
+            if (isSubmitting) {
+                CircularProgressIndicator(
+                    modifier = Modifier.height(20.dp),
+                    strokeWidth = 2.dp,
+                    color = MaterialTheme.colorScheme.onError,
+                )
+            } else {
+                Text(stringResource(R.string.delete_account_confirm_button))
+            }
+        }
+        Spacer(Modifier.height(8.dp))
+        TextButton(
+            onClick = onCancel,
+            modifier = Modifier.fillMaxWidth(),
+        ) {
+            Text(stringResource(R.string.delete_account_cancel_button))
+        }
+        Spacer(Modifier.height(24.dp))
+    }
+}
+```
+
+- [ ] **Step 2: Create AccountDeletedScreen.kt**
+
+`clearSession()` is a suspend function, so the screen manages its own coroutine scope and lets
+`AppNavigation`'s `AuthState.Unauthenticated` observer handle the navigation to auth automatically —
+no explicit nav callback needed from `HomeGraph`.
+
+```kotlin
+package com.homeservices.technician.ui.deleteaccount
+
+import android.content.Intent
+import android.net.Uri
+import androidx.compose.foundation.layout.Arrangement
+import androidx.compose.foundation.layout.Column
+import androidx.compose.foundation.layout.Spacer
+import androidx.compose.foundation.layout.fillMaxSize
+import androidx.compose.foundation.layout.height
+import androidx.compose.foundation.layout.padding
+import androidx.compose.foundation.layout.size
+import androidx.compose.material.icons.Icons
+import androidx.compose.material.icons.filled.DeleteForever
+import androidx.compose.material3.Button
+import androidx.compose.material3.Card
+import androidx.compose.material3.CardDefaults
+import androidx.compose.material3.Icon
+import androidx.compose.material3.MaterialTheme
+import androidx.compose.material3.Text
+import androidx.compose.material3.TextButton
+import androidx.compose.runtime.Composable
+import androidx.compose.runtime.rememberCoroutineScope
+import androidx.compose.ui.Alignment
+import androidx.compose.ui.Modifier
+import androidx.compose.ui.platform.LocalContext
+import androidx.compose.ui.res.stringResource
+import androidx.compose.ui.text.style.TextAlign
+import androidx.compose.ui.unit.dp
+import com.homeservices.technician.R
+import com.homeservices.technician.data.auth.SessionManager
+import kotlinx.coroutines.launch
+import java.time.Instant
+import java.time.ZoneId
+import java.time.format.DateTimeFormatter
+import java.time.format.FormatStyle
+
+@Composable
+public fun AccountDeletedScreen(
+    scheduledAt: String,
+    sessionManager: SessionManager,
+) {
+    val scope = rememberCoroutineScope()
+    val formattedDate = rememberFormattedDate(scheduledAt)
+
+    AccountDeletedScreenContent(
+        formattedDate = formattedDate,
+        deletionRequestUrl = stringResource(R.string.deletion_request_url),
+        // clearSession() triggers AuthState.Unauthenticated; AppNavigation observer
+        // navigates to "auth" and pops the back stack — no explicit navigation needed here.
+        onDone = { scope.launch { sessionManager.clearSession() } },
+    )
+}
+
+@Composable
+internal fun AccountDeletedScreenContent(
+    formattedDate: String,
+    deletionRequestUrl: String,
+    onDone: () -> Unit,
+) {
+    val context = LocalContext.current
+
+    Column(
+        modifier = Modifier
+            .fillMaxSize()
+            .padding(horizontal = 24.dp),
+        horizontalAlignment = Alignment.CenterHorizontally,
+        verticalArrangement = Arrangement.Center,
+    ) {
+        Icon(
+            imageVector = Icons.Default.DeleteForever,
+            contentDescription = null,
+            tint = MaterialTheme.colorScheme.error,
+            modifier = Modifier.size(64.dp),
+        )
+        Spacer(Modifier.height(24.dp))
+        Text(
+            text = stringResource(R.string.account_deleted_title),
+            style = MaterialTheme.typography.headlineSmall,
+            textAlign = TextAlign.Center,
+        )
+        Spacer(Modifier.height(12.dp))
+        Text(
+            text = stringResource(R.string.account_deleted_body, formattedDate),
+            style = MaterialTheme.typography.bodyLarge,
+            textAlign = TextAlign.Center,
+        )
+        Spacer(Modifier.height(16.dp))
+        Card(
+            colors = CardDefaults.cardColors(
+                containerColor = MaterialTheme.colorScheme.surfaceVariant,
+            ),
+        ) {
+            Text(
+                text = stringResource(R.string.account_deleted_revocation_hint, formattedDate),
+                style = MaterialTheme.typography.bodyMedium,
+                modifier = Modifier.padding(16.dp),
+                textAlign = TextAlign.Center,
+            )
+        }
+        Spacer(Modifier.height(16.dp))
+        TextButton(
+            onClick = {
+                context.startActivity(
+                    Intent(Intent.ACTION_VIEW, Uri.parse(deletionRequestUrl))
+                )
+            },
+        ) {
+            Text(stringResource(R.string.account_deleted_web_form_label))
+        }
+        Spacer(Modifier.height(32.dp))
+        Button(onClick = onDone) {
+            Text(stringResource(R.string.account_deleted_done))
+        }
+    }
+}
+
+@Composable
+private fun rememberFormattedDate(isoTimestamp: String): String =
+    try {
+        val instant = Instant.parse(isoTimestamp)
+        val formatter = DateTimeFormatter
+            .ofLocalizedDate(FormatStyle.LONG)
+            .withZone(ZoneId.systemDefault())
+        formatter.format(instant)
+    } catch (_: Exception) {
+        isoTimestamp
+    }
+```
+
+- [ ] **Step 3: Create Paparazzi stub for DeleteAccountScreen**
+
+```kotlin
+package com.homeservices.technician.ui.deleteaccount
+
+import app.cash.paparazzi.DeviceConfig
+import app.cash.paparazzi.Paparazzi
+import com.homeservices.designsystem.theme.HomeservicesTheme
+import org.junit.Rule
+import org.junit.Test
+
+public class DeleteAccountScreenPaparazziTest {
+    @get:Rule
+    public val paparazzi: Paparazzi =
+        Paparazzi(
+            deviceConfig = DeviceConfig.PIXEL_5,
+            theme = "android:Theme.Material3.DayNight.NoActionBar",
+        )
+
+    @Test
+    public fun deleteAccountScreen_idle(): Unit {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = false) {
+                DeleteAccountScreenContent(
+                    uiState = DeleteAccountUiState.Idle,
+                    onConfirm = {},
+                    onCancel = {},
+                )
+            }
+        }
+    }
+
+    @Test
+    public fun deleteAccountScreen_submitting(): Unit {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = false) {
+                DeleteAccountScreenContent(
+                    uiState = DeleteAccountUiState.Submitting,
+                    onConfirm = {},
+                    onCancel = {},
+                )
+            }
+        }
+    }
+}
+```
+
+- [ ] **Step 4: Create Paparazzi stub for AccountDeletedScreen**
+
+```kotlin
+package com.homeservices.technician.ui.deleteaccount
+
+import app.cash.paparazzi.DeviceConfig
+import app.cash.paparazzi.Paparazzi
+import com.homeservices.designsystem.theme.HomeservicesTheme
+import org.junit.Rule
+import org.junit.Test
+
+public class AccountDeletedScreenPaparazziTest {
+    @get:Rule
+    public val paparazzi: Paparazzi =
+        Paparazzi(
+            deviceConfig = DeviceConfig.PIXEL_5,
+            theme = "android:Theme.Material3.DayNight.NoActionBar",
+        )
+
+    @Test
+    public fun accountDeletedScreen(): Unit {
+        paparazzi.snapshot {
+            HomeservicesTheme(darkTheme = false) {
+                AccountDeletedScreenContent(
+                    formattedDate = "29 May 2026",
+                    deletionRequestUrl = "https://example.com/deletion-request/",
+                    onDone = {},
+                )
+            }
+        }
+    }
+}
+```
+
+- [ ] **Step 5: Commit**
+
+```bash
+git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/deleteaccount/ technician-app/app/src/test/kotlin/com/homeservices/technician/ui/deleteaccount/
+git commit -m "feat(technician-app): DeleteAccountScreen + AccountDeletedScreen + Paparazzi stubs (E20-S08)"
+```
+
+---
+
+## Task 10: Navigation wiring — HomeGraph + AppNavigation + ProfileScreen SettingCard
+
+**Files:**
+- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt`
+- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/AppNavigation.kt`
+- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/home/TechnicianHomeScreen.kt`
+
+- [ ] **Step 1: Add routes to HomeGraph.kt**
+
+Add the import at the top of `HomeGraph.kt`:
+
+```kotlin
+import com.homeservices.technician.data.auth.SessionManager
+import com.homeservices.technician.ui.deleteaccount.AccountDeletedScreen
+import com.homeservices.technician.ui.deleteaccount.DeleteAccountScreen
+```
+
+Change the `homeGraph` function signature to accept `sessionManager` and `onDeleteAccount`:
+
+```kotlin
+internal fun NavGraphBuilder.homeGraph(
+    navController: NavController,
+    authState: AuthState,
+    sessionManager: SessionManager,
+    onSignOut: () -> Unit,
+) {
+```
+
+Inside the `navigation { }` block, add these two composables after the existing `language_settings` composable:
+
+```kotlin
+        composable("delete_account") {
+            DeleteAccountScreen(
+                onBack = { navController.popBackStack() },
+                onDeleted = { scheduledAt ->
+                    navController.navigate("account_deleted/${Uri.encode(scheduledAt)}") {
+                        popUpTo(HOME_DASHBOARD_ROUTE) { inclusive = false }
+                        launchSingleTop = true
+                    }
+                },
+            )
+        }
+        composable(
+            route = "account_deleted/{scheduledAt}",
+            arguments = listOf(navArgument("scheduledAt") { type = NavType.StringType }),
+        ) { backStackEntry ->
+            val scheduledAt = Uri.decode(
+                backStackEntry.arguments?.getString("scheduledAt") ?: "",
+            )
+            // No onDone nav callback — clearSession() triggers AuthState.Unauthenticated
+            // and AppNavigation.LaunchedEffect(authState) navigates to "auth" automatically.
+            AccountDeletedScreen(
+                scheduledAt = scheduledAt,
+                sessionManager = sessionManager,
+            )
+        }
+```
+
+In `HomeDashboardRoute`, add `onDeleteAccount` to `TechnicianHomeScreen`:
+
+```kotlin
+        onDeleteAccount = { navController.navigate("delete_account") },
+```
+
+(Add this alongside the existing `onLanguageSettings`, `onSignOut`, etc.)
+
+- [ ] **Step 2: Update AppNavigation.kt to pass sessionManager**
+
+In `AppNavigation.kt`, the `homeGraph` call currently passes `onSignOut`. Thread through `sessionManager`:
+
+```kotlin
+            homeGraph(
+                navController = navController,
+                authState = authState,
+                sessionManager = sessionManager,
+                onSignOut = { scope.launch { sessionManager.clearSession() } },
+            )
+```
+
+`sessionManager` is already in scope in `AppNavigation` — it is a parameter of the composable.
+
+- [ ] **Step 2b: Verify `SettingCard` supports `iconTint`**
+
+Find the `SettingCard` private composable definition in `TechnicianHomeScreen.kt` (search for `private fun SettingCard`). If it does NOT have an `iconTint` parameter, add one with a default:
+
+```kotlin
+private fun SettingCard(
+    icon: ImageVector,
+    title: String,
+    subtitle: String,
+    onClick: () -> Unit,
+    iconTint: Color = MaterialTheme.colorScheme.onSurface,  // ← add this
+) {
+    // find the Icon(...) call inside and change its `tint` to use iconTint
+    Icon(imageVector = icon, contentDescription = null, tint = iconTint)
+}
+```
+
+If `iconTint` already exists, skip this step.
+
+- [ ] **Step 3: Add `onDeleteAccount` to TechnicianHomeScreen**
+
+In `TechnicianHomeScreen.kt`, add `onDeleteAccount: () -> Unit` parameter to both the outer `TechnicianHomeScreen` composable and the inner `ProfileScreen` private composable.
+
+Find the `ProfileScreen` composable (around line 929). Add the parameter:
+
+```kotlin
+private fun ProfileScreen(
+    authState: AuthState,
+    onViewRatings: () -> Unit,
+    onPayoutSettings: () -> Unit,
+    onLanguageSettings: () -> Unit,
+    onEditServices: () -> Unit,
+    onSignOut: () -> Unit,
+    onDeleteAccount: () -> Unit,   // ← add this
+) {
+```
+
+Inside `ProfileScreen`, after the sign-out `SettingCard` item, add:
+
+```kotlin
+            item {
+                Spacer(Modifier.height(16.dp))
+                HorizontalDivider()
+                Spacer(Modifier.height(8.dp))
+                SettingCard(
+                    icon = Icons.Default.DeleteForever,
+                    title = stringResource(R.string.settings_delete_account_title),
+                    subtitle = stringResource(R.string.settings_delete_account_subtitle),
+                    iconTint = MaterialTheme.colorScheme.error,
+                    onClick = onDeleteAccount,
+                )
+            }
+```
+
+Thread `onDeleteAccount` through the outer `TechnicianHomeScreen` to `ProfileScreen`:
+
+```kotlin
+@Composable
+internal fun TechnicianHomeScreen(
+    // ... existing params ...
+    onDeleteAccount: () -> Unit,
+    // ...
+)
+```
+
+And in the `TechTab.Profile` branch:
+
+```kotlin
+                TechTab.Profile ->
+                    ProfileScreen(
+                        authState = authState,
+                        onViewRatings = onViewRatings,
+                        onPayoutSettings = onPayoutSettings,
+                        onLanguageSettings = onLanguageSettings,
+                        onEditServices = onEditServices,
+                        onSignOut = onSignOut,
+                        onDeleteAccount = onDeleteAccount,  // ← add this
+                    )
+```
+
+Also add `Icons.Default.DeleteForever` to the existing import if not already present. Check the existing import block for `Icons.Default.*` and add `DeleteForever` to the list.
+
+- [ ] **Step 4: Build to verify no compile errors**
+
+```bash
+cd technician-app && ./gradlew assembleDebug 2>&1 | grep -E "error:|BUILD" | tail -20
+```
+
+Expected: `BUILD SUCCESSFUL`
+
+- [ ] **Step 5: Commit**
+
+```bash
+git add technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/ technician-app/app/src/main/kotlin/com/homeservices/technician/ui/home/TechnicianHomeScreen.kt
+git commit -m "feat(technician-app): wire delete-account routes into HomeGraph and ProfileScreen (E20-S08)"
+```
+
+---
+
+## Task 11: Web form — homeheroo-privacy repo
+
+**Files (in `aloktiwarigit/homeheroo-privacy` repo — NOT this repo):**
+- Create: `docs/legal/deletion-request.md`
+
+- [ ] **Step 1: Clone or navigate to the homeheroo-privacy repo**
+
+```bash
+# If not already cloned locally:
+git clone https://github.com/aloktiwarigit/homeheroo-privacy.git
+cd homeheroo-privacy
+```
+
+- [ ] **Step 2: Create `docs/legal/deletion-request.md`**
+
+```markdown
+# Delete Your HomeHeroo Technician Account
+
+This page explains how to request deletion of your HomeHeroo Technician account and all associated data.
+
+## In-App Deletion (Recommended)
+
+If you have access to the HomeHeroo Technician app:
+
+1. Open the app and go to the **Profile** tab
+2. Scroll to the bottom and tap **Delete my account**
+3. Review the list of data that will be deleted
+4. Tap **Yes, delete my account** to confirm
+
+Your account and data will be permanently deleted within **7 days** of your confirmation.
+
+## Email Deletion Request (For Users Without App Access)
+
+If you no longer have access to the app, send an email to:
+
+**Email:** aloktiwari49@gmail.com  
+**Subject:** `Delete my HomeHeroo Technician account`  
+**Body:** Please include your registered phone number.
+
+We will process your request within **30 days** and send a confirmation to your registered contact.
+
+## What Gets Deleted
+
+When your account is deleted, the following data is permanently removed or anonymized:
+
+- Your profile and phone number
+- KYC documents (Aadhaar, PAN)
+- Earnings history and payout records
+- Job photos and work history
+- Ratings received from customers
+
+Some records may be retained in anonymized form for legal and fraud-prevention purposes as required by applicable law.
+
+## Questions
+
+For any questions about your data, contact us at aloktiwari49@gmail.com.
+
+*Last updated: May 2026*
+```
+
+- [ ] **Step 3: Commit and push to homeheroo-privacy**
+
+```bash
+git add docs/legal/deletion-request.md
+git commit -m "docs: add account deletion request page for technician app (E20-S08)"
+git push origin main
+```
+
+Expected: GitHub Pages `publish.yml` workflow deploys to `https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/` within ~2 minutes.
+
+- [ ] **Step 4: Verify the page is live**
+
+Open `https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/` in a browser and confirm the content renders.
+
+---
+
+## Task 12: Pre-Codex smoke gate
+
+Run both smoke gates before invoking Codex review. Both must exit 0.
+
+- [ ] **Step 1: Run API smoke gate**
+
+```bash
+cd api && bash ../tools/pre-codex-smoke-api.sh
+```
+
+Expected: All steps pass, exit 0.
+
+- [ ] **Step 2: Run technician-app smoke gate**
+
+```bash
+bash tools/pre-codex-smoke.sh technician-app
+```
+
+Expected: All 6 steps pass (assembleDebug → ktlintCheck → detekt → lintDebug → testDebugUnitTest → koverVerify), exit 0.
+
+If any step fails, fix the issue before proceeding to Codex review.
+
+- [ ] **Step 3: Invoke Codex review**
+
+```bash
+codex review --base main
+```
+
+If Codex raises issues, fix in Claude and re-run Codex **once**. After passing, the `.codex-review-passed` marker is written. Then push and open a PR.
+
+- [ ] **Step 4: Push and open PR**
+
+```bash
+git push origin fix/s001-pan-plaintext-migration-fallback
+gh pr create --title "feat(E20-S08): account deletion — Play Store Lane7-C2 (last CRIT)" --body "$(cat <<'EOF'
+## Summary
+- Adds in-app account deletion to HomeHeroo Technician app (Play Store mandatory since May 2024)
+- API: active-job gate prevents deletion while a booking is in flight
+- App: Settings → Delete my account → PII inventory → confirm → terminal screen → sign out
+- Web form: https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/ for uninstalled users
+- Erasure pipeline (cron, cascade, schema) pre-built in PR #257; this story adds the UI and the job gate
+
+## Test plan
+- [ ] `bash tools/pre-codex-smoke-api.sh` exits 0
+- [ ] `bash tools/pre-codex-smoke.sh technician-app` exits 0
+- [ ] `codex review --base main` passes (`.codex-review-passed` written)
+- [ ] Profile tab → Delete my account entry visible (error-tinted, below sign-out)
+- [ ] Tapping while active job shows AlertDialog "Complete your current job first"
+- [ ] PII list displays all 5 items in EN and HI
+- [ ] Confirm → terminal screen shows scheduled deletion date and revocation hint
+- [ ] Done → signs out to auth screen
+- [ ] Play Console → Data Safety → deletion URLs filled in after merge
+
+🤖 Generated with [Claude Code](https://claude.com/claude-code)
+EOF
+)"
+```
+
+---
+
+## Post-merge checklist
+
+- [ ] Trigger `paparazzi-record.yml` workflow_dispatch (`gradle_root=technician-app`) to record goldens
+- [ ] Play Console → App content → Data Safety → "Does your app allow users to request deletion?" → Yes → add in-app flow description + `https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/`
+- [ ] Verify `https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/` is live
+- [ ] Brief pilot coordinator on email-based deletion path for uninstalled users
diff --git a/docs/superpowers/specs/2026-05-22-account-deletion-design.md b/docs/superpowers/specs/2026-05-22-account-deletion-design.md
new file mode 100644
index 00000000..27db6052
--- /dev/null
+++ b/docs/superpowers/specs/2026-05-22-account-deletion-design.md
@@ -0,0 +1,355 @@
+# Account Deletion — E20-S08 Design Spec
+
+**Date:** 2026-05-22
+**Story:** E20-S08 — Lane7-C2 (account deletion, Play Store mandatory)
+**Tier:** Foundation (auth + PII, cross-stack, high blast radius)
+**Status:** Approved — ready for plan
+
+---
+
+## 1. Context and scope
+
+HomeHeroo Technician app must offer an in-app account deletion path to satisfy Play Store Data Safety policy (mandatory since May 2024) and the privacy policy commitment at https://aloktiwarigit.github.io/homeheroo-privacy/technician/ §7.
+
+**What already exists (PR #257 — do not re-implement):**
+- `api/src/schemas/erasure-request.ts` — full Zod schema, state machine, `ERASURE_CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT'`, `ERASURE_GRACE_PERIOD_MS = 7 days`
+- `api/src/cosmos/erasure-request-repository.ts` — full CRUD with optimistic concurrency
+- `api/src/functions/users-erasure-request.ts` — POST + DELETE `v1/users/me/erasure-request` (submit + revoke)
+- `api/src/functions/trigger-erasure-deadline.ts` — daily cron at 02:00 UTC, auto-executes overdue PENDING requests
+- `api/src/services/erasureCascade.service.ts` — anonymizes bookings/ratings/complaints/wallet/events; hard-deletes technician doc + KYC; clears FCM + device tokens
+
+**What this story adds:**
+1. API: active-job gate in the submit handler
+2. Technician-app: in-app deletion UI (Settings entry → confirmation screen → terminal screen)
+3. homeheroo-privacy repo: public web form for uninstalled users
+
+---
+
+## 2. API change — active-job gate
+
+**File:** `api/src/functions/users-erasure-request.ts` (`submitErasureRequestHandler`)
+
+**Change:** After auth and role inference, before creating the erasure doc, query for any active booking for this technician:
+
+```
+query bookings WHERE technicianId = uid
+  AND status IN ('ASSIGNED', 'IN_PROGRESS', 'REACHED', 'STARTED')
+```
+
+If any found → return `409 { code: 'ACTIVE_JOB_EXISTS' }`.
+
+**Supporting change:** `api/src/cosmos/booking-repository.ts` gains:
+```typescript
+hasActiveBookingForTechnician(technicianId: string): Promise<boolean>
+```
+Uses an indexed query on `technicianId + status`. Returns `true` if any active booking exists.
+
+**Test file (written before implementation):** `api/src/functions/users-erasure-request.test.ts`
+
+| Case | Expected |
+|---|---|
+| No active job, valid phrase | 201 + erasure doc created |
+| Active job exists | 409 `ACTIVE_JOB_EXISTS` |
+| Duplicate PENDING request | 409 `ERASURE_REQUEST_PENDING` |
+| Wrong confirmation phrase | 400 `VALIDATION_ERROR` |
+| Unauthenticated | 401 `UNAUTHENTICATED` |
+
+---
+
+## 3. Technician-app — data + domain layer
+
+### 3.1 ErasureApiService.kt
+
+Ktor HTTP interface. Two methods:
+
+```kotlin
+suspend fun submitErasureRequest(
+    idToken: String,
+    confirmationPhrase: String = ERASURE_CONFIRMATION_PHRASE,
+    reason: String? = null,
+): ErasureSubmitResponse  // erasureId, scheduledDeletionAt, status
+
+suspend fun revokeErasureRequest(idToken: String): Unit  // 204
+```
+
+`ERASURE_CONFIRMATION_PHRASE = "DELETE MY ACCOUNT"` — defined as a constant, never shown to the user as a text field. The button sends it internally.
+
+### 3.2 ErasureRepository + ErasureRepositoryImpl
+
+Thin wrapper around `ErasureApiService`. Injects `FirebaseTokenAuthenticator` for token retrieval.
+
+```kotlin
+interface ErasureRepository {
+    suspend fun submitRequest(reason: String? = null): ErasureSubmitResult
+    suspend fun revokeRequest(): Unit
+}
+
+sealed class ErasureSubmitResult {
+    data class Success(val scheduledDeletionAt: String) : ErasureSubmitResult()
+    object ActiveJobExists : ErasureSubmitResult()
+    object DuplicatePending : ErasureSubmitResult()
+    data class UnknownError(val message: String) : ErasureSubmitResult()
+}
+```
+
+### 3.3 SubmitErasureRequestUseCase
+
+Client-side active-job pre-check before hitting the network:
+
+```kotlin
+suspend operator fun invoke(): ErasureSubmitResult {
+    // Fast-path hint: activeJobState is non-null only when actively observing a job.
+    // Server-side check (§2) is authoritative for cases where this returns null.
+    if (activeJobRepository.activeJobState.value != null) {
+        return ErasureSubmitResult.ActiveJobExists
+    }
+    return erasureRepository.submitRequest()
+}
+```
+
+Client-side check is a fast-path UX guard using `activeJobRepository.activeJobState.value != null`. This is a hint only — `activeJobState` is only populated while an active job is being observed (FCM or manual fetch). If null, the use case proceeds to the API; the server-side gate in §2 is the authoritative check and will catch any active job the client doesn't know about.
+
+### 3.4 ErasureModule (Hilt)
+
+`@Binds ErasureRepository → ErasureRepositoryImpl`. Scoped to `@Singleton`.
+
+**Test file (written before implementation):** `SubmitErasureRequestUseCaseTest.kt`
+
+| Case | Expected |
+|---|---|
+| `activeJobRepository.hasActiveJob()` returns true | `ActiveJobExists` (no network call) |
+| No active job, repo returns Success | `Success(scheduledDeletionAt)` |
+| No active job, repo returns `ActiveJobExists` (server-side) | `ActiveJobExists` |
+| No active job, repo returns `UnknownError` | `UnknownError` propagated |
+
+---
+
+## 4. Technician-app — UI layer
+
+### 4.1 DeleteAccountViewModel
+
+```kotlin
+sealed class DeleteAccountUiState {
+    object Idle : DeleteAccountUiState()
+    object ActiveJobBlocked : DeleteAccountUiState()
+    object Submitting : DeleteAccountUiState()
+    data class Error(val messageRes: Int) : DeleteAccountUiState()
+    data class Done(val scheduledDeletionAt: String) : DeleteAccountUiState()
+}
+```
+
+**Init:** calls `SubmitErasureRequestUseCase` check-only path (or directly `activeJobRepository.hasActiveJob()`). If active job → state = `ActiveJobBlocked`. If clear → state = `Idle`.
+
+**`onConfirmDelete()`:**
+1. state = `Submitting`
+2. Call `SubmitErasureRequestUseCase()`
+3. `Success` → state = `Done(scheduledDeletionAt)`
+4. `ActiveJobExists` → state = `ActiveJobBlocked`
+5. `DuplicatePending` → state = `Error(R.string.delete_account_duplicate_pending)`
+6. `UnknownError` → state = `Error(R.string.delete_account_generic_error)`
+
+**Test file (written before implementation):** `DeleteAccountViewModelTest.kt`
+
+| Case | Expected state |
+|---|---|
+| Init with active job | `ActiveJobBlocked` |
+| Init without active job | `Idle` |
+| `onConfirmDelete()` → Success | `Done` |
+| `onConfirmDelete()` → ActiveJobExists | `ActiveJobBlocked` |
+| `onConfirmDelete()` → UnknownError | `Error` |
+
+### 4.2 DeleteAccountScreen.kt
+
+Full-screen Compose destination (nav route: `delete_account`).
+
+**Content (state = Idle or Submitting or Error):**
+- Top bar: "Delete account" / "अकाउंट हटाएं" with back arrow
+- Warning card (error-container background): "This is permanent and cannot be undone"
+- Section heading: "What gets deleted" / "क्या हटाया जाएगा"
+- Bulleted list with ✗ prefix:
+  - Profile and phone number
+  - KYC documents (Aadhaar, PAN)
+  - Earnings history and payout records
+  - Job photos and work history
+  - Ratings received from customers
+- Footnote: "Data deleted within 7 days of confirmation"
+- Primary button (full-width, error color): `settings_delete_account_title` / "हाँ, मेरा अकाउंट हटाएं" — disabled + spinner when `Submitting`; on tap calls `viewModel.onConfirmDelete()`
+- Text button: "Cancel"
+
+**ActiveJobBlocked state:** Non-dismissable `AlertDialog` overlay:
+- Title: "Job in progress"
+- Body: `delete_account_active_job_error`
+- Single button: "OK" → navigates back
+
+**Error state:** `Snackbar` with error message.
+
+### 4.3 AccountDeletedScreen.kt
+
+Full-screen Compose destination (nav route: `account_deleted/{scheduledAt}`). Back stack cleared on navigate — no back gesture.
+
+**Content:**
+- `DeleteForever` icon (error tint, 64dp)
+- Headline: `account_deleted_title`
+- Body: `account_deleted_body` with formatted date
+- Revocation hint card: `account_deleted_revocation_hint` with formatted date (tells user to email support before the date to cancel — in-app revoke UI is out of scope for this story, see §9)
+- Clickable text link: `account_deleted_web_form_label` → opens `deletion_request_url` in browser via `Intent.ACTION_VIEW`
+- Primary button: `account_deleted_done` → calls `sessionManager.clearSession()`; `AuthState.Unauthenticated` fires and `AppNavigation` navigates to `auth` popping everything
+
+### 4.4 Navigation wiring
+
+**`HomeGraph.kt`** — two new composable routes:
+
+```kotlin
+composable("delete_account") {
+    DeleteAccountScreen(
+        onBack = { navController.popBackStack() },
+        onDeleted = { scheduledAt ->
+            navController.navigate("account_deleted/$scheduledAt") {
+                popUpTo("home") { inclusive = false }
+            }
+        },
+    )
+}
+composable(
+    route = "account_deleted/{scheduledAt}",
+    arguments = listOf(navArgument("scheduledAt") { type = NavType.StringType }),
+) { backStackEntry ->
+    AccountDeletedScreen(
+        // ISO timestamp contains ':' and '+' — must be Uri.decoded here.
+        scheduledAt = Uri.decode(backStackEntry.arguments?.getString("scheduledAt") ?: ""),
+        sessionManager = sessionManager,
+    )
+}
+// When navigating: navController.navigate("account_deleted/${Uri.encode(scheduledAt)}")
+```
+
+**`AppNavigation.kt`** — pass `onDeleteAccount = { navController.navigate("delete_account") }` into `homeGraph()`.
+
+**`TechnicianHomeScreen.kt` `ProfileScreen`** — add after the sign-out `SettingCard`:
+
+```kotlin
+Spacer(Modifier.height(16.dp))
+HorizontalDivider()
+Spacer(Modifier.height(8.dp))
+SettingCard(
+    icon = Icons.Default.DeleteForever,
+    title = stringResource(R.string.settings_delete_account_title),
+    subtitle = stringResource(R.string.settings_delete_account_subtitle),
+    iconTint = MaterialTheme.colorScheme.error,
+    onClick = onDeleteAccount,
+)
+```
+
+### 4.5 Paparazzi screenshot tests
+
+Two new test files — goldens recorded on CI via `paparazzi-record.yml gradle_root=technician-app` after merge. Never recorded locally on Windows.
+
+- `DeleteAccountScreenTest.kt` — Idle state + ActiveJobBlocked state
+- `AccountDeletedScreenTest.kt` — terminal screen with sample date
+
+---
+
+## 5. Strings
+
+### strings.xml (EN)
+
+```xml
+<string name="settings_delete_account_title">Delete my account</string>
+<string name="settings_delete_account_subtitle">Permanently remove your profile and data</string>
+<string name="delete_account_title">Delete account</string>
+<string name="delete_account_warning">This is permanent and cannot be undone</string>
+<string name="delete_account_what_gets_deleted">What gets deleted</string>
+<string name="delete_account_item_profile">Your profile and phone number</string>
+<string name="delete_account_item_kyc">KYC documents (Aadhaar, PAN)</string>
+<string name="delete_account_item_earnings">Earnings history and payout records</string>
+<string name="delete_account_item_photos">Job photos and work history</string>
+<string name="delete_account_item_ratings">Ratings received from customers</string>
+<string name="delete_account_footnote">Data deleted within 7 days of confirmation</string>
+<string name="delete_account_confirm_button">Yes, delete my account</string>
+<string name="delete_account_cancel_button">Cancel</string>
+<string name="delete_account_active_job_title">Job in progress</string>
+<string name="delete_account_active_job_error">Complete or cancel your current job before deleting your account</string>
+<string name="delete_account_active_job_ok">OK</string>
+<string name="delete_account_duplicate_pending">A deletion request is already pending for your account</string>
+<string name="delete_account_generic_error">Something went wrong. Please try again.</string>
+<string name="account_deleted_title">Deletion request submitted</string>
+<string name="account_deleted_body">Your account is scheduled for deletion on %1$s.</string>
+<string name="account_deleted_revocation_hint">Changed your mind? Email us at support@homeheroo.in with subject \'Cancel account deletion\' and your phone number before %1$s.</string>
+<string name="account_deleted_web_form_label">Lost access to the app? Request deletion here</string>
+<string name="account_deleted_done">Done</string>
+<string name="deletion_request_url">https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/</string>
+```
+
+### strings-hi.xml (HI)
+
+```xml
+<string name="settings_delete_account_title">अकाउंट हटाएं</string>
+<string name="settings_delete_account_subtitle">आपकी प्रोफ़ाइल और डेटा स्थायी रूप से हटाएं</string>
+<string name="delete_account_title">अकाउंट हटाएं</string>
+<string name="delete_account_warning">यह स्थायी है और पूर्ववत नहीं होगा</string>
+<string name="delete_account_what_gets_deleted">क्या हटाया जाएगा</string>
+<string name="delete_account_item_profile">आपकी प्रोफ़ाइल और फ़ोन नंबर</string>
+<string name="delete_account_item_kyc">KYC दस्तावेज़ (आधार, पैन)</string>
+<string name="delete_account_item_earnings">कमाई इतिहास और भुगतान रिकॉर्ड</string>
+<string name="delete_account_item_photos">जॉब फ़ोटो और कार्य इतिहास</string>
+<string name="delete_account_item_ratings">ग्राहकों की रेटिंग</string>
+<string name="delete_account_footnote">पुष्टि के 7 दिनों के भीतर डेटा हटाया जाएगा</string>
+<string name="delete_account_confirm_button">हाँ, मेरा अकाउंट हटाएं</string>
+<string name="delete_account_cancel_button">रद्द करें</string>
+<string name="delete_account_active_job_title">जॉब जारी है</string>
+<string name="delete_account_active_job_error">अकाउंट हटाने से पहले अपनी मौजूदा जॉब पूरी करें या रद्द करें</string>
+<string name="delete_account_active_job_ok">ठीक है</string>
+<string name="delete_account_duplicate_pending">आपके अकाउंट के लिए पहले से एक हटाने का अनुरोध लंबित है</string>
+<string name="delete_account_generic_error">कुछ गड़बड़ी हुई। कृपया पुनः प्रयास करें।</string>
+<string name="account_deleted_title">हटाने का अनुरोध सबमिट हुआ</string>
+<string name="account_deleted_body">आपका अकाउंट %1$s को हटाया जाएगा।</string>
+<string name="account_deleted_revocation_hint">मन बदला? %1$s से पहले support@homeheroo.in पर \'Cancel account deletion\' subject से अपना फ़ोन नंबर लिखकर ईमेल करें।</string>
+<string name="account_deleted_web_form_label">ऐप तक पहुंच खो गई? यहाँ हटाने का अनुरोध करें</string>
+<string name="account_deleted_done">हो गया</string>
+<string name="deletion_request_url">https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/</string>
+```
+
+---
+
+## 6. Web form — homeheroo-privacy repo
+
+**File:** `docs/legal/deletion-request.md` (committed to `aloktiwarigit/homeheroo-privacy`, NOT this repo)
+
+**Content:**
+- Title: "Delete Your HomeHeroo Technician Account"
+- In-app path: "Open the app → Profile tab → Delete my account"
+- Email path (for users without app access): email `aloktiwari49@gmail.com` with subject `"Delete my HomeHeroo Technician account"` and body containing your registered phone number. Requests processed within 30 days.
+- The existing `publish.yml` workflow auto-deploys `docs/legal/**` to GitHub Pages → available at `https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/`
+
+---
+
+## 7. Work-stream summary
+
+| WS | Scope | Agent | Depends on |
+|---|---|---|---|
+| WS-A | API: `hasActiveBookingForTechnician` + active-job gate in submit handler + unit tests | Sonnet | — |
+| WS-B | App data/domain: `ErasureApiService`, `ErasureRepository`, `SubmitErasureRequestUseCase`, `ErasureModule`, unit tests | Sonnet | — |
+| WS-C | App UI: `DeleteAccountViewModel`, `DeleteAccountScreen`, `AccountDeletedScreen`, nav wiring, Paparazzi stubs | Sonnet | WS-B types |
+| WS-D | Strings (EN + HI) + `deletion_request_url` resource | Sonnet | — |
+| WS-E | `docs/legal/deletion-request.md` in homeheroo-privacy repo | Sonnet | — |
+| WS-F | Pre-Codex smoke gate: `tools/pre-codex-smoke.sh technician-app` + `tools/pre-codex-smoke-api.sh` | Main thread | WS-A/B/C/D complete |
+
+WS-A, WS-B, WS-D, WS-E run in parallel (no shared state). WS-C depends on WS-B types. WS-F runs last.
+
+---
+
+## 8. Post-merge checklist
+
+- [ ] Play Console → Data Safety → "Does your app allow users to request deletion?" → Yes → provide both URLs (in-app flow description + `deletion_request_url`)
+- [ ] Brief pilot coordinator on the email-based manual deletion path
+- [ ] Verify `erasure_requests` admin queue visible in admin-web (existing admin endpoint at `api/src/functions/admin/users/patch.ts`)
+- [ ] Trigger `paparazzi-record.yml` workflow_dispatch for `technician-app` after merge to record goldens
+
+---
+
+## 9. Out of scope for this story
+
+- Re-registration cooldown — allow freely at pilot; revisit if abuse observed
+- Customer-app deletion flow — separate story
+- Admin-web erasure queue UI improvements — existing admin endpoint is sufficient for v1
+- Revoke path in-app — user can log back in within 7 days; the `revokeErasureRequest()` API method is implemented in `ErasureRepository` for a future story if needed
diff --git a/technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt b/technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt
new file mode 100644
index 00000000..7f043a64
--- /dev/null
+++ b/technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt
@@ -0,0 +1,27 @@
+package com.homeservices.technician.data.erasure.remote
+
+import retrofit2.Response
+import retrofit2.http.Body
+import retrofit2.http.DELETE
+import retrofit2.http.POST
+
+public interface ErasureApiService {
+    @POST("v1/users/me/erasure-request")
+    public suspend fun submitErasureRequest(
+        @Body body: ErasureSubmitRequestBody,
+    ): Response<ErasureSubmitResponseBody>
+
+    @DELETE("v1/users/me/erasure-request")
+    public suspend fun revokeErasureRequest(): Response<Unit>
+}
+
+public data class ErasureSubmitRequestBody(
+    val confirmationPhrase: String,
+    val reason: String? = null,
+)
+
+public data class ErasureSubmitResponseBody(
+    val erasureId: String,
+    val scheduledDeletionAt: String,
+    val status: String,
+)
diff --git a/technician-app/app/src/main/res/values-hi/strings.xml b/technician-app/app/src/main/res/values-hi/strings.xml
index ea6a908e..23cfe6d0 100644
--- a/technician-app/app/src/main/res/values-hi/strings.xml
+++ b/technician-app/app/src/main/res/values-hi/strings.xml
@@ -170,4 +170,30 @@
 
     <!-- Legal (E20-S07) -->
     <string name="privacy_policy_url">https://aloktiwarigit.github.io/homeheroo-privacy/technician/</string>
+
+    <!-- Account deletion (E20-S08) -->
+    <string name="settings_delete_account_title">अकाउंट हटाएं</string>
+    <string name="settings_delete_account_subtitle">आपकी प्रोफ़ाइल और डेटा स्थायी रूप से हटाएं</string>
+    <string name="delete_account_title">अकाउंट हटाएं</string>
+    <string name="delete_account_warning">यह स्थायी है और पूर्ववत नहीं होगा</string>
+    <string name="delete_account_what_gets_deleted">क्या हटाया जाएगा</string>
+    <string name="delete_account_item_profile">आपकी प्रोफ़ाइल और फ़ोन नंबर</string>
+    <string name="delete_account_item_kyc">KYC दस्तावेज़ (आधार, पैन)</string>
+    <string name="delete_account_item_earnings">कमाई इतिहास और भुगतान रिकॉर्ड</string>
+    <string name="delete_account_item_photos">जॉब फ़ोटो और कार्य इतिहास</string>
+    <string name="delete_account_item_ratings">ग्राहकों की रेटिंग</string>
+    <string name="delete_account_footnote">पुष्टि के 7 दिनों के भीतर डेटा हटाया जाएगा</string>
+    <string name="delete_account_confirm_button">हाँ, मेरा अकाउंट हटाएं</string>
+    <string name="delete_account_cancel_button">रद्द करें</string>
+    <string name="delete_account_active_job_title">जॉब जारी है</string>
+    <string name="delete_account_active_job_error">अकाउंट हटाने से पहले अपनी मौजूदा जॉब पूरी करें या रद्द करें</string>
+    <string name="delete_account_active_job_ok">ठीक है</string>
+    <string name="delete_account_duplicate_pending">आपके अकाउंट के लिए पहले से एक हटाने का अनुरोध लंबित है</string>
+    <string name="delete_account_generic_error">कुछ गड़बड़ी हुई। कृपया पुनः प्रयास करें।</string>
+    <string name="account_deleted_title">हटाने का अनुरोध सबमिट हुआ</string>
+    <string name="account_deleted_body">आपका अकाउंट %1$s को हटाया जाएगा।</string>
+    <string name="account_deleted_revocation_hint">मन बदला? %1$s से पहले support@homeheroo.in पर \'Cancel account deletion\' subject से अपना फ़ोन नंबर लिखकर ईमेल करें।</string>
+    <string name="account_deleted_web_form_label">ऐप तक पहुंच खो गई? यहाँ हटाने का अनुरोध करें</string>
+    <string name="account_deleted_done">हो गया</string>
+    <string name="deletion_request_url">https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/</string>
 </resources>
diff --git a/technician-app/app/src/main/res/values/strings.xml b/technician-app/app/src/main/res/values/strings.xml
index 4b523491..efdcb88b 100644
--- a/technician-app/app/src/main/res/values/strings.xml
+++ b/technician-app/app/src/main/res/values/strings.xml
@@ -65,6 +65,32 @@
     <string name="settings_language_save">Save language</string>
     <string name="action_back">Back</string>
 
+    <!-- Account deletion (E20-S08) -->
+    <string name="settings_delete_account_title">Delete my account</string>
+    <string name="settings_delete_account_subtitle">Permanently remove your profile and data</string>
+    <string name="delete_account_title">Delete account</string>
+    <string name="delete_account_warning">This is permanent and cannot be undone</string>
+    <string name="delete_account_what_gets_deleted">What gets deleted</string>
+    <string name="delete_account_item_profile">Your profile and phone number</string>
+    <string name="delete_account_item_kyc">KYC documents (Aadhaar, PAN)</string>
+    <string name="delete_account_item_earnings">Earnings history and payout records</string>
+    <string name="delete_account_item_photos">Job photos and work history</string>
+    <string name="delete_account_item_ratings">Ratings received from customers</string>
+    <string name="delete_account_footnote">Data deleted within 7 days of confirmation</string>
+    <string name="delete_account_confirm_button">Yes, delete my account</string>
+    <string name="delete_account_cancel_button">Cancel</string>
+    <string name="delete_account_active_job_title">Job in progress</string>
+    <string name="delete_account_active_job_error">Complete or cancel your current job before deleting your account</string>
+    <string name="delete_account_active_job_ok">OK</string>
+    <string name="delete_account_duplicate_pending">A deletion request is already pending for your account</string>
+    <string name="delete_account_generic_error">Something went wrong. Please try again.</string>
+    <string name="account_deleted_title">Deletion request submitted</string>
+    <string name="account_deleted_body">Your account is scheduled for deletion on %1$s.</string>
+    <string name="account_deleted_revocation_hint">Changed your mind? Email support@homeheroo.in with subject \'Cancel account deletion\' and your phone number before %1$s.</string>
+    <string name="account_deleted_web_form_label">Lost access to the app? Request deletion here</string>
+    <string name="account_deleted_done">Done</string>
+    <string name="deletion_request_url">https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/</string>
+
     <!-- Photo capture screen (E06-S02-Codemod) -->
     <string name="photo_no_back_camera">No back camera available on this device</string>
     <string name="photo_go_back">Go back</string>
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --stat 360b04d87a5b9a8e609c7b66c07e1bbfcdc1072f; git diff --name-only 360b04d87a5b9a8e609c7b66c07e1bbfcdc1072f' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3241ms:
 .gitignore                                         |    1 +
 api/src/cosmos/booking-repository.ts               |   12 +
 api/src/functions/users-erasure-request.ts         |    9 +
 ...epository-hasActiveBookingForTechnician.test.ts |   43 +
 api/tests/functions/users-erasure-request.test.ts  |   91 ++
 api/tests/unit/users-erasure-request.test.ts       |    4 +
 .../plans/2026-05-22-E20-S08-account-deletion.md   | 1592 ++++++++++++++++++++
 .../specs/2026-05-22-account-deletion-design.md    |  355 +++++
 .../data/erasure/remote/ErasureApiService.kt       |   27 +
 .../app/src/main/res/values-hi/strings.xml         |   26 +
 technician-app/app/src/main/res/values/strings.xml |   26 +
 11 files changed, 2186 insertions(+)
.gitignore
api/src/cosmos/booking-repository.ts
api/src/functions/users-erasure-request.ts
api/tests/cosmos/booking-repository-hasActiveBookingForTechnician.test.ts
api/tests/functions/users-erasure-request.test.ts
api/tests/unit/users-erasure-request.test.ts
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md
docs/superpowers/specs/2026-05-22-account-deletion-design.md
technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt
technician-app/app/src/main/res/values-hi/strings.xml
technician-app/app/src/main/res/values/strings.xml
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Path 'api/src/cosmos/booking-repository.ts' -TotalCount 260" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 2512ms:
import { randomUUID } from 'node:crypto';
import { getBookingsContainer } from './client.js';
import type { BookingDoc, CreateBookingRequest } from '../schemas/booking.js';
import type { PendingAddOn, AddOnDecision } from '../schemas/addon-approval.js';
import { normalizeAddressText } from '../shared/address-text.js';

function now() { return new Date().toISOString(); }

export interface BookingCreateMetadata {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceName?: string;
}

export interface BookingCreateCreditOptions {
  /**
   * E13-S01 (P1-6): When set, the wallet credit debit is DEFERRED to the Razorpay webhook.
   * Stored on the booking doc so the webhook can apply the credit after payment.captured.
   * Not applicable to CASH_ON_SERVICE bookings (those apply credit synchronously).
   */
  pendingCreditAmountInPaise?: number;
  /** Idempotency key for the deferred credit debit (required when pendingCreditAmountInPaise > 0). */
  pendingCreditIdempotencyKey?: string;
}

export const bookingRepo = {
  async createPending(
    req: CreateBookingRequest,
    customerId: string,
    paymentOrderId: string,
    amount: number,
    metadata: BookingCreateMetadata = {},
    bookingId?: string,
    creditOptions?: BookingCreateCreditOptions,
  ): Promise<BookingDoc> {
    const paymentMethod = req.paymentMethod ?? 'RAZORPAY';
    const doc: BookingDoc = {
      id: bookingId ?? randomUUID(), customerId, ...req,
      addressText: normalizeAddressText(req.addressText),
      ...(metadata.customerName ? { customerName: metadata.customerName } : {}),
      ...(metadata.customerPhone ? { customerPhone: metadata.customerPhone } : {}),
      ...(metadata.customerEmail ? { customerEmail: metadata.customerEmail } : {}),
      ...(metadata.serviceName ? { serviceName: metadata.serviceName } : {}),
      status: 'PENDING_PAYMENT', paymentOrderId,
      paymentMethod,
      ...(paymentMethod === 'CASH_ON_SERVICE' ? { cashCollectionStatus: 'PENDING' as const } : {}),
      paymentId: null, paymentSignature: null,
      amount, createdAt: now(),
      // E13-S01 (P1-6): Store pending credit info for deferred debit in webhook
      ...(creditOptions?.pendingCreditAmountInPaise && creditOptions.pendingCreditAmountInPaise > 0
        ? {
            pendingCreditAmountInPaise: creditOptions.pendingCreditAmountInPaise,
            pendingCreditIdempotencyKey: creditOptions.pendingCreditIdempotencyKey,
          }
        : {}),
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
    const { resource: existing, etag } = await getBookingsContainer().item(id, id).read<BookingDoc>();
    if (!existing) return null;
    if (existing.status === 'PAID') return existing; // webhook already processed â€” idempotent success
    if (existing.status !== 'PENDING_PAYMENT') return null;
    const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, paymentSignature };
    const useEtag = process.env.BOOKINGS_ETAG_GUARDS === 'on';
    if (useEtag) {
      try {
        const { resource } = await getBookingsContainer()
          .item(id, id)
          .replace<BookingDoc>(updated, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });
        return resource ?? null;
      } catch (e: unknown) {
        if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: number }).code === 412) {
          return null; // lost ETag race â€” idempotent by design
        }
        throw e;
      }
    }
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
    const { resource: existing, etag } = await getBookingsContainer().item(id, id).read<BookingDoc>();
    if (!existing || (existing.status !== 'SEARCHING' && existing.status !== 'PENDING_PAYMENT')) return null;
    const updated: BookingDoc = { ...existing, status: 'PAID', paymentId };
    const useEtag = process.env.BOOKINGS_ETAG_GUARDS === 'on';
    if (useEtag) {
      try {
        const { resource } = await getBookingsContainer()
          .item(id, id)
          .replace<BookingDoc>(updated, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });
        return resource ?? null;
      } catch (e: unknown) {
        if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: number }).code === 412) {
          return null; // lost ETag race â€” idempotent by design
        }
        throw e;
      }
    }
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

  async getBookingsAwaitingDispatch(limit = 100): Promise<BookingDoc[]> {
    const { resources } = await getBookingsContainer().items.query<BookingDoc>({
      query: `SELECT * FROM c
              WHERE c.status IN ('PAID', 'UNFULFILLED')
                AND (NOT IS_DEFINED(c.technicianId) OR IS_NULL(c.technicianId))`,
      parameters: [],
    }).fetchAll();
    return resources.slice(0, limit);
  },

  async getAssignedBookingsBefore(slotDateCutoff: string): Promise<BookingDoc[]> {
    const { resources } = await getBookingsContainer()
      .items.query<BookingDoc>({
        query: "SELECT * FROM c WHERE (c.status IN ('ASSIGNED', 'NO_SHOW_REDISPATCH') OR (c.status = 'SEARCHING' AND IS_DEFINED(c.noShowTechnicianId))) AND c.slotDate <= @slotDate",
        parameters: [{ name: '@slotDate', value: slotDateCutoff }],
      })
      .fetchAll();
    return resources;
  },

  async getByTechnicianId(technicianId: string): Promise<BookingDoc[]> {
    const { resources } = await getBookingsContainer()
      .items.query<BookingDoc>({
        query: `SELECT * FROM c
                WHERE c.technicianId = @technicianId
                  AND c.status IN (
                    'ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS',
                    'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED'
                  )`,
        parameters: [{ name: '@technicianId', value: technicianId }],
      })
      .fetchAll();
    // Sort in memory â€” ORDER BY on a cross-partition (non-PK) query requires
    // a composite index that isn't provisioned on the bookings container.
    // Sort in-memory after the composite index is provisioned (see
    // scripts/provision-cosmos-indexes.ts). The index covers [/technicianId,
    // /slotDate, /slotWindow] so ORDER BY in the query is also valid, but
    // in-memory sort keeps this function safe even before the first index rebuild.
    return resources.sort(
      (a, b) =>
        a.slotDate.localeCompare(b.slotDate) || a.slotWindow.localeCompare(b.slotWindow),
    );
  },

  async hasActiveBookingForTechnician(technicianId: string): Promise<boolean> {
    const { resources } = await getBookingsContainer()
      .items.query<{ id: string }>({
        query: `SELECT TOP 1 c.id FROM c
                WHERE c.technicianId = @technicianId
                  AND c.status IN ('ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL')`,
        parameters: [{ name: '@technicianId', value: technicianId }],
      })
      .fetchNext();
    return resources.length > 0;
  },

  async getByCustomerId(customerId: string): Promise<BookingDoc[]> {
    const { resources } = await getBookingsContainer()
      .items.query<BookingDoc>({
        query: `SELECT * FROM c
                WHERE c.customerId = @customerId`,
        parameters: [{ name: '@customerId', value: customerId }],
      })
      .fetchAll();
    return resources.sort((a, b) => {
      const slotCompare = b.slotDate.localeCompare(a.slotDate) || b.slotWindow.localeCompare(a.slotWindow);
      return slotCompare || b.createdAt.localeCompare(a.createdAt);
    });
  },

  async requestAddOn(id: string, addOn: PendingAddOn): Promise<BookingDoc | null> {
    const existing = await this.getById(id);
    if (!existing || existing.status !== 'IN_PROGRESS') return null;
    const updated: BookingDoc = {
      ...existing,
      status: 'AWAITING_PRICE_APPROVAL',
      pendingAddOns: [...(existing.pendingAddOns ?? []), addOn],
      // Stable anchor for the ADDON_APPROVAL_REQUESTED pending-action expiry.
      // Written atomically with the status transition so the change-feed projector
      // can derive 24h from the actual request time (not the booking createdAt).
      pendingAddOnsUpdatedAt: new Date().toISOString(),
    };
    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
    return resource!;
  },

  async applyAddOnDecisions(id: string, customerId: string, decisions: AddOnDecision[]): Promise<BookingDoc | null> {
    const existing = await this.getById(id);
    if (!existing || existing.customerId !== customerId) return null;
    if (existing.status !== 'AWAITING_PRICE_APPROVAL') return null;
    const pending = existing.pendingAddOns ?? [];
    const approved = pending.filter(a => decisions.find(d => d.name === a.name && d.approved));
    const updated: BookingDoc = {
      ...existing,
      status: 'IN_PROGRESS',
      pendingAddOns: [],
      approvedAddOns: [...(existing.approvedAddOns ?? []), ...approved],
      finalAmount: (existing.finalAmount ?? existing.amount) + approved.reduce((s, a) => s + a.price, 0),
    };
    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
    return resource!;
  },

  async addPhoto(
    bookingId: string,
    stage: string,
    photoUrl: string,
  ): Promise<BookingDoc | null> {
    const { resource: existing, etag } = await getBookingsContainer()
      .item(bookingId, bookingId)
      .read<BookingDoc>();
    if (!existing) return null;
    const stagePhotos = existing.photos?.[stage] ?? [];
    const updated: BookingDoc = {
      ...existing,
      photos: { ...existing.photos, [stage]: [...stagePhotos, photoUrl] },
    };
    // Use ETag optimistic concurrency so concurrent uploads for the same
    // booking/stage don't silently drop each other's photo URL.
    const { resource } = await getBookingsContainer()
      .item(bookingId, bookingId)
      .replace<BookingDoc>(updated, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });
    return resource ?? null;
  },

  async markSosActivated(id: string): Promise<BookingDoc | null> {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Path 'api/src/functions/users-erasure-request.ts' -TotalCount 260" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3119ms:
import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { randomBytes } from 'node:crypto';
import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';
import { auditLog } from '../services/auditLog.service.js';
import { inferUserRole } from '../services/userRole.service.js';
import {
  createErasureRequest,
  DuplicatePendingError,
  getActiveErasureRequestForUser,
  replaceErasureRequest,
} from '../cosmos/erasure-request-repository.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import {
  ErasureRequestSubmitBodySchema,
  ERASURE_GRACE_PERIOD_MS,
} from '../schemas/erasure-request.js';
import type { ErasureRequestDoc } from '../schemas/erasure-request.js';

async function authenticate(req: HttpRequest): Promise<{ uid: string } | { errorStatus: number; code: string }> {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) {
    return { errorStatus: 401, code: 'UNAUTHENTICATED' };
  }
  try {
    const decoded = await verifyFirebaseIdToken(auth.slice(7));
    return { uid: decoded.uid };
  } catch {
    return { errorStatus: 401, code: 'TOKEN_INVALID' };
  }
}

export async function submitErasureRequestHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await authenticate(req);
  if ('errorStatus' in auth) {
    return { status: auth.errorStatus, jsonBody: { code: auth.code } };
  }
  const { uid } = auth;
  const role = await inferUserRole(uid);

  // Gate: refuse deletion if an active booking exists for this technician.
  if (role === 'TECHNICIAN') {
    const hasActive = await bookingRepo.hasActiveBookingForTechnician(uid);
    if (hasActive) {
      return { status: 409, jsonBody: { code: 'ACTIVE_JOB_EXISTS' } };
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = ErasureRequestSubmitBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const requestedAt = new Date();
  const scheduledDeletionAt = new Date(requestedAt.getTime() + ERASURE_GRACE_PERIOD_MS);
  // Deterministic ID: Cosmos enforces one-document-per-user atomically on create.
  const id = `pending:${uid}`;
  const salt = randomBytes(16).toString('hex'); // 32 chars; well above the 16-char min

  const doc: ErasureRequestDoc = {
    id,
    partitionKey: id,
    userId: uid,
    userRole: role,
    status: 'PENDING',
    requestedAt: requestedAt.toISOString(),
    scheduledDeletionAt: scheduledDeletionAt.toISOString(),
    anonymizationSalt: salt,
    ...(parsed.data.reason !== undefined && { reason: parsed.data.reason }),
  };

  try {
    await createErasureRequest(doc);
  } catch (err) {
    if (!(err instanceof DuplicatePendingError)) throw err;

    // Conflict: a document at "pending:{uid}" already exists â€” inspect it.
    const active = await getActiveErasureRequestForUser(uid);
    if (!active) throw err; // shouldn't happen; surface as 500

    const { doc: existing, etag } = active;

    if (existing.status === 'PENDING' || existing.status === 'EXECUTING') {
      return { status: 409, jsonBody: { code: 'ERASURE_REQUEST_PENDING', erasureId: existing.id } };
    }
    if (existing.status === 'EXECUTED') {
      return { status: 409, jsonBody: { code: 'USER_ALREADY_ERASED' } };
    }

    // REVOKED / DENIED / FAILED â€” allow re-submission by replacing in-place.
    await replaceErasureRequest(doc, etag);
  }

  await auditLog(
    { adminId: uid, role: 'system' },
    'ERASURE_REQUESTED',
    'user',
    uid,
    {
      erasureId: id,
      userRole: role,
      reason: parsed.data.reason ?? null,
      scheduledDeletionAt: doc.scheduledDeletionAt,
    },
  );

  return {
    status: 201,
    jsonBody: {
      erasureId: id,
      scheduledDeletionAt: doc.scheduledDeletionAt,
      status: 'PENDING',
    },
  };
}

export async function revokeErasureRequestHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await authenticate(req);
  if ('errorStatus' in auth) {
    return { status: auth.errorStatus, jsonBody: { code: auth.code } };
  }
  const { uid } = auth;

  const active = await getActiveErasureRequestForUser(uid);
  if (!active || active.doc.status !== 'PENDING') {
    return { status: 404, jsonBody: { code: 'NO_PENDING_ERASURE_REQUEST' } };
  }

  const { doc: existing, etag } = active;
  const updated: ErasureRequestDoc = {
    ...existing,
    status: 'REVOKED',
    revokedAt: new Date().toISOString(),
  };
  // Pass etag for optimistic concurrency â€” rejects 412 if cron/admin already
  // transitioned this request to EXECUTING while we were processing the revoke.
  await replaceErasureRequest(updated, etag);

  await auditLog(
    { adminId: uid, role: 'system' },
    'ERASURE_REVOKED',
    'user',
    uid,
    { erasureId: existing.id },
  );

  return { status: 204 };
}

app.http('usersErasureRequestSubmit', {
  methods: ['POST'],
  route: 'v1/users/me/erasure-request',
  authLevel: 'anonymous',
  handler: submitErasureRequestHandler,
});

app.http('usersErasureRequestRevoke', {
  methods: ['DELETE'],
  route: 'v1/users/me/erasure-request',
  authLevel: 'anonymous',
  handler: revokeErasureRequestHandler,
});

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Path 'api/src/schemas/booking.ts' -TotalCount 240" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 19672ms:
import { z } from 'zod';
import { PendingAddOnSchema } from './addon-approval.js';

const BOOKING_STATUSES = [
  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE',
  'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED',
  'UNFULFILLED', 'CUSTOMER_CANCELLED', 'NO_SHOW_REDISPATCH',
] as const;

const PAYMENT_METHODS = ['RAZORPAY', 'CASH_ON_SERVICE'] as const;
const CASH_COLLECTION_STATUSES = ['PENDING', 'COLLECTED'] as const;

export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export const PaymentMethodSchema = z.enum(PAYMENT_METHODS);
export const CashCollectionStatusSchema = z.enum(CASH_COLLECTION_STATUSES);

export const BookingDocSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  serviceId: z.string(),
  serviceName: z.string().optional(),
  categoryId: z.string(),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotWindow: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/),
  addressText: z.string().min(1),
  addressLatLng: LatLngSchema,
  status: z.enum(BOOKING_STATUSES),
  paymentOrderId: z.string(),
  paymentMethod: PaymentMethodSchema.optional(),
  cashCollectionStatus: CashCollectionStatusSchema.optional(),
  paymentId: z.string().nullable(),
  paymentSignature: z.string().nullable(),
  amount: z.number().int().positive(),
  technicianId: z.string().optional(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  feesWaived: z.boolean().optional(),
  escalated: z.boolean().optional(),
  internalNotes: z.array(z.string()).optional(),
  photos: z.record(z.string(), z.array(z.string())).optional(),
  pendingAddOns: z.array(PendingAddOnSchema).optional(),
  approvedAddOns: z.array(PendingAddOnSchema).optional(),
  finalAmount: z.number().int().positive().optional(),
  /** ISO timestamp written atomically after redispatch offers are sent successfully. */
  noShowRedispatchAt: z.string().optional(),
  /** The technician who no-showed. Preserved separately so the exclusion filter works across timer recovery runs even after technicianId is cleared. */
  noShowTechnicianId: z.string().optional(),
  /** ISO timestamp written after the NO_SHOW_CREDIT_ISSUED FCM push is sent successfully. Prevents duplicate pushes across recovery runs. */
  noShowPushSentAt: z.string().optional(),
  /** ISO timestamp written when customer triggers Safety SOS. */
  sosActivatedAt: z.string().optional(),
  /** ISO timestamp written after sendOwnerSosAlert() succeeds. Absent = alert pending retry. */
  sosAlertSentAt: z.string().optional(),
  /**
   * ISO timestamp written atomically when the booking transitions to AWAITING_PRICE_APPROVAL
   * (i.e. when the technician requests an add-on). Used by the bookings change-feed projector
   * to anchor the ADDON_APPROVAL_REQUESTED expiresAt from the actual request time, not from
   * the booking's original createdAt (which may be >24h in the past for advance bookings).
   */
  pendingAddOnsUpdatedAt: z.string().optional(),
  /**
   * E13-S01 (P1-6): Wallet credit amount in paise that is PENDING debit for a Razorpay booking.
   * Written at booking creation time (before Razorpay order); deducted from the ledger only
   * after payment.captured is received from the Razorpay webhook. Absent = no credit pending.
   * Once the webhook debits the credit, this field should be removed (or left as a historical record).
   */
  pendingCreditAmountInPaise: z.number().int().nonnegative().optional(),
  /**
   * E13-S01 (P1-6): Idempotency key for the pending credit debit above.
   * Stored so the webhook can call applyCredit idempotently on re-delivery.
   */
  pendingCreditIdempotencyKey: z.string().optional(),
});

export const CreateBookingRequestSchema = z.object({
  serviceId: z.string().min(1),
  categoryId: z.string().min(1),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotWindow: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/),
  addressText: z.string().min(1),
  addressLatLng: LatLngSchema,
  paymentMethod: PaymentMethodSchema.default('RAZORPAY'),
  /**
   * E13-S01: If true, the server will attempt to apply the customer's wallet
   * credit balance against this booking's amount. The actual applied amount is
   * returned as `appliedCreditAmount` in the response (may be 0 if no balance).
   * Requires an `Idempotency-Key: <uuid>` header for replay protection.
   */
  applyCredit: z.boolean().optional().default(false),
});

export const ConfirmBookingRequestSchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const PhotoStageResponseSchema = z.object({
  urls: z.array(z.string().url()),
});

export const GetBookingResponseSchema = z.object({
  bookingId: z.string(),
  status: BookingDocSchema.shape.status,
  amount: z.number().int().positive(),
  finalAmount: z.number().int().positive().nullable(),
  pendingAddOns: z.array(PendingAddOnSchema).default([]),
  approvedAddOns: z.array(PendingAddOnSchema).default([]),
  photos: z.record(z.string(), PhotoStageResponseSchema).optional(),
  reportSignedUrl: z.string().url().nullable().optional(),
});

export type BookingDoc = z.infer<typeof BookingDocSchema>;
export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;
export type ConfirmBookingRequest = z.infer<typeof ConfirmBookingRequestSchema>;
export type GetBookingResponse = z.infer<typeof GetBookingResponseSchema>;

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg \"NO_SHOW_REDISPATCH|status = 'NO_SHOW|status.*NO_SHOW|NO_SHOW_REDISPATCH\" api/src -n" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 2710ms:
api/src\functions\admin\dashboard\feed.ts:23:  if (['UNFULFILLED', 'CUSTOMER_CANCELLED', 'NO_SHOW_REDISPATCH', 'CANCELLED'].includes(status)) {
api/src\cosmos\booking-repository.ts:148:        query: "SELECT * FROM c WHERE (c.status IN ('ASSIGNED', 'NO_SHOW_REDISPATCH') OR (c.status = 'SEARCHING' AND IS_DEFINED(c.noShowTechnicianId))) AND c.slotDate <= @slotDate",
api/src\schemas\booking.ts:7:  'UNFULFILLED', 'CUSTOMER_CANCELLED', 'NO_SHOW_REDISPATCH',
api/src\functions\shield-report.ts:17:// CUSTOMER_CANCELLED, NO_SHOW_REDISPATCH) since those have no real tech assignment.
api/src\services\dispatcher.service.ts:170:    if (!booking || booking.status !== 'NO_SHOW_REDISPATCH') return false;
api/src\functions\trigger-no-show-detector.ts:13:const NO_SHOW_REDISPATCH_RADIUS_KM = 15;
api/src\functions\trigger-no-show-detector.ts:48:    // Also allow NO_SHOW_REDISPATCH — the query intentionally includes that status so that
api/src\functions\trigger-no-show-detector.ts:56:        freshBooking.status !== 'NO_SHOW_REDISPATCH' &&
api/src\functions\trigger-no-show-detector.ts:138:    // revert SEARCHING → NO_SHOW_REDISPATCH and break the SEARCHING recovery guard in Step 2.
api/src\functions\trigger-no-show-detector.ts:145:          status: 'NO_SHOW_REDISPATCH',
api/src\functions\trigger-no-show-detector.ts:157:    // Only when status write succeeded (dispatcher checks for NO_SHOW_REDISPATCH status).
api/src\functions\trigger-no-show-detector.ts:177:        void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', action: 'NO_SHOW_REDISPATCH_INITIATED', resourceType: 'booking', resourceId: booking.id, payload: { bookingId: booking.id }, timestamp: _rts, partitionKey: _rts.slice(0, 7) }).catch(Sentry.captureException);
api/src\functions\trigger-no-show-detector.ts:181:          redispatchOk = await dispatcherService.redispatch(booking.id, NO_SHOW_REDISPATCH_RADIUS_KM, noShowTechId);
api/src\functions\trigger-no-show-detector.ts:185:            void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', action: 'NO_SHOW_REDISPATCH_INITIATED', resourceType: 'booking', resourceId: booking.id, payload: { bookingId: booking.id }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
api/src\functions\trigger-no-show-detector.ts:189:            // concurrent invocation already moved the booking out of NO_SHOW_REDISPATCH (to SEARCHING
api/src\schemas\order.ts:9:  'UNFULFILLED', 'CUSTOMER_CANCELLED', 'NO_SHOW_REDISPATCH',

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Path 'api/src/services/dispatcher.service.ts' -TotalCount 260" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 2570ms:
import { randomUUID } from 'node:crypto';
import { getMessaging } from 'firebase-admin/messaging';
import { bookingRepo, updateBookingFields } from '../cosmos/booking-repository.js';
import { getTechniciansWithinRadius } from '../cosmos/technician-repository.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { dispatchAttemptRepo } from '../cosmos/dispatch-attempt-repository.js';
import { haversine } from '../cosmos/geo.js';
import { getDispatchAttemptsContainer } from '../cosmos/client.js';
import { getFirebaseAdmin } from './firebaseAdmin.js';
import type { TechnicianProfile } from '../schemas/technician.js';
import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';
import type { BookingDoc } from '../schemas/booking.js';
import { normalizeAddressText } from '../shared/address-text.js';

const DISPATCH_RADIUS_KM = 10;
const OFFER_WINDOW_MS = 90_000;
const SLOT_GRACE_WINDOW_MS = 30 * 60 * 1_000;

function slotStartUtcMs(slotDate: string, slotWindow: string): number {
  const startTime = slotWindow.split('-')[0];
  const ms = new Date(`${slotDate}T${startTime}:00+05:30`).getTime();
  if (isNaN(ms)) throw new Error(`invalid slotWindow "${slotWindow}" on slotDate "${slotDate}"`);
  return ms;
}

function isStillDispatchable(booking: BookingDoc, nowMs = Date.now()): boolean {
  try {
    return nowMs < slotStartUtcMs(booking.slotDate, booking.slotWindow) + SLOT_GRACE_WINDOW_MS;
  } catch {
    return false;
  }
}

export function rankTechnicians(
  techs: TechnicianProfile[],
  bookingLat: number,
  bookingLng: number,
): TechnicianProfile[] {
  // GeoJSON coordinates: [longitude, latitude]
  return techs
    .map((t) => ({
      tech: t,
      distanceKm: haversine(bookingLat, bookingLng, t.location.coordinates[1], t.location.coordinates[0]),
    }))
    .sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      // Operator policy (Ayodhya pilot): secondary sort is rating only â€” decline history must never be used
      return (b.tech.rating ?? 0) - (a.tech.rating ?? 0);
    })
    .map((x) => x.tech);
}

async function dispatchBookingToTechs(
  bookingId: string,
  booking: BookingDoc,
  radiusKm: number,
  excludedTechnicianIds: string[] = [],
): Promise<boolean> {
  const { lat, lng } = booking.addressLatLng;
  const excluded = new Set([
    ...excludedTechnicianIds,
    ...(booking.technicianId ? [booking.technicianId] : []),
  ]);
  // Cosmos uses a bounding-box (square) query; filter to the actual circle radius.
  // Exclude the original (no-show) technician from the candidate set so they cannot
  // receive the same booking again via a redispatch.
  const candidates = (await getTechniciansWithinRadius(lat, lng, radiusKm, booking.serviceId))
    .filter((t) => haversine(lat, lng, t.location.coordinates[1], t.location.coordinates[0]) <= radiusKm)
    .filter((t) => !excluded.has(t.id) && !excluded.has(t.technicianId))
    .filter((t) => !(t.blockedCustomerIds ?? []).includes(booking.customerId));

  if (candidates.length === 0) {
    if (isStillDispatchable(booking)) {
      console.log(`DISPATCH_WAITING_FOR_TECHS bookingId=${bookingId}`);
      if (booking.status !== 'PAID') {
        await updateBookingFields(bookingId, { status: 'PAID' });
      }
      return false;
    }
    console.log(`DISPATCH_NO_TECHS bookingId=${bookingId}`);
    await updateBookingFields(bookingId, { status: 'UNFULFILLED' });
    return false;
  }

  const selected = rankTechnicians(candidates, lat, lng)[0]!;
  const selectedTechnicianId = selected.technicianId || selected.id;
  const sentAt = new Date();
  const expiresAt = new Date(sentAt.getTime() + OFFER_WINDOW_MS);

  const attempt: DispatchAttemptDoc = {
    id: randomUUID(),
    bookingId,
    technicianIds: [selectedTechnicianId],
    sentAt: sentAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'PENDING',
  };

  await getDispatchAttemptsContainer().items.create(attempt);
  // Transition to SEARCHING so the stale-booking reconciler can find stuck dispatches
  await updateBookingFields(bookingId, { status: 'SEARCHING' });

  let serviceName = booking.serviceId;
  try {
    const service = await catalogueRepo.getServiceByIdCrossPartition(booking.serviceId);
    serviceName = service?.name ?? booking.serviceId;
  } catch (err: unknown) {
    console.error('DISPATCH_SERVICE_LOOKUP_FAILED', err);
  }
  getFirebaseAdmin();
  const messaging = getMessaging();
  if (selected.fcmToken) {
    try {
      await messaging.send({
        token: selected.fcmToken,
        data: {
          type: 'JOB_OFFER',
          bookingId,
          serviceId: booking.serviceId,
          serviceName,
          addressText: normalizeAddressText(booking.addressText),
          slotDate: booking.slotDate,
          slotWindow: booking.slotWindow,
          amount: String(booking.amount),
          distanceKm: String(
            haversine(lat, lng, selected.location.coordinates[1], selected.location.coordinates[0]),
          ),
          expiresAt: expiresAt.toISOString(),
          dispatchAttemptId: attempt.id,
        },
      });
    } catch (err: unknown) {
      console.error('DISPATCH_FCM_FAILED', err);
    }
  }

  console.log(`DISPATCH_SENT bookingId=${bookingId} technicianIds=${selectedTechnicianId}`);
  return true;
}

export const dispatcherService = {
  async triggerDispatch(bookingId: string): Promise<void> {
    const booking = await bookingRepo.getById(bookingId);
    if (!booking || booking.status !== 'PAID') {
      console.log(`DISPATCH_SKIP bookingId=${bookingId} status=${booking?.status ?? 'NOT_FOUND'}`);
      return;
    }
    await dispatchBookingToTechs(bookingId, booking, DISPATCH_RADIUS_KM);
  },

  async retryAwaitingDispatch(limit = 100): Promise<{ checked: number; dispatched: number }> {
    const bookings = await bookingRepo.getBookingsAwaitingDispatch(limit);
    let dispatched = 0;
    for (const booking of bookings.filter((b) => isStillDispatchable(b))) {
      const previouslyAttempted = await dispatchAttemptRepo.getAttemptedTechnicianIds(booking.id);
      if (await dispatchBookingToTechs(booking.id, booking, DISPATCH_RADIUS_KM, previouslyAttempted)) {
        dispatched += 1;
      }
    }
    return { checked: bookings.length, dispatched };
  },

  /**
   * Returns true if offers were actually sent to at least one technician.
   * @param excludeTechnicianId â€” the no-show technician's id, passed explicitly so that
   *   the filter is not lost if the booking doc is updated before this call reads it.
   */
  async redispatch(bookingId: string, radiusKm: number, excludeTechnicianId?: string): Promise<boolean> {
    const booking = await bookingRepo.getById(bookingId);
    if (!booking || booking.status !== 'NO_SHOW_REDISPATCH') return false;
    // Merge the caller-supplied exclusion so redispatch works even when technicianId was
    // already cleared from the booking document by the status-write step.
    const bookingForDispatch = excludeTechnicianId
      ? { ...booking, technicianId: excludeTechnicianId }
      : booking;
    return dispatchBookingToTechs(bookingId, bookingForDispatch, radiusKm);
  },

  /**
   * Continue nearest-first dispatch after a live offer is declined or expires.
   * Previously attempted technicians are excluded so the booking walks the ranked
   * candidate list instead of re-offering the same nearest technician.
   */
  async continueDispatchAfterOfferOutcome(
    bookingId: string,
    extraExcludeTechnicianIds: string[] = [],
    radiusKm: number = DISPATCH_RADIUS_KM,
  ): Promise<boolean> {
    const booking = await bookingRepo.getById(bookingId);
    if (!booking || booking.status !== 'SEARCHING') return false;
    const previouslyAttempted = await dispatchAttemptRepo.getAttemptedTechnicianIds(bookingId);
    return dispatchBookingToTechs(
      bookingId,
      booking,
      radiusKm,
      [...new Set([...previouslyAttempted, ...extraExcludeTechnicianIds])],
    );
  },
};

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Path 'api/src/functions/trigger-no-show-detector.ts' -TotalCount 240" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 2584ms:
import '../bootstrap.js';
import { randomUUID } from 'node:crypto';
import { app } from '@azure/functions';
import type { Timer, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { bookingRepo, updateBookingFields } from '../cosmos/booking-repository.js';
import { customerCreditRepo } from '../cosmos/customer-credit-repository.js';
import { dispatcherService } from '../services/dispatcher.service.js';
import { sendNoShowCreditPush } from '../services/fcm.service.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';

const NO_SHOW_CREDIT_PAISE = 50_000;
const NO_SHOW_REDISPATCH_RADIUS_KM = 15;
const NO_SHOW_WINDOW_MS = 30 * 60 * 1_000;

function slotStartUtcMs(slotDate: string, slotWindow: string): number {
  const startTime = slotWindow.split('-')[0]; // '10:00' from '10:00-12:00'
  const ms = new Date(`${slotDate}T${startTime}:00+05:30`).getTime();
  if (isNaN(ms)) throw new Error(`invalid slotWindow "${slotWindow}" on slotDate "${slotDate}"`);
  return ms;
}

export async function detectNoShows(ctx: InvocationContext): Promise<void> {
  // 'en-CA' locale gives YYYY-MM-DD format â€” identical to slotDate schema
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const now = Date.now();

  // Note: bookings with a slotDate > todayIST but a UTC slot start already past 30 min
  // (i.e., slotWindow starts before 05:30 IST) are excluded by this query. For the
  // Ayodhya pilot (service hours 08:00â€“20:00 IST), this edge case does not apply.
  const assignedBookings = await bookingRepo.getAssignedBookingsBefore(todayIST);
  ctx.log(`detectNoShows: ${assignedBookings.length} bookings on/before ${todayIST}`);

  for (const booking of assignedBookings) {
    let slotStart: number;
    try {
      slotStart = slotStartUtcMs(booking.slotDate, booking.slotWindow);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows: invalid slot data for ${booking.id} â€” skip`);
      continue;
    }
    if (now < slotStart + NO_SHOW_WINDOW_MS) continue;

    // Guard against stale ASSIGNED snapshot: re-read the booking immediately before the
    // credit write. If the technician marked it IN_PROGRESS or REACHED after the query
    // returned, skip to avoid issuing a wrong credit against a live booking.
    // Also allow NO_SHOW_REDISPATCH â€” the query intentionally includes that status so that
    // a prior run that wrote credit + status but crashed before redispatch can recover.
    const freshBooking = await bookingRepo.getById(booking.id);
    const isRecoverableSearching =
      freshBooking?.status === 'SEARCHING' && freshBooking.noShowTechnicianId !== undefined;
    if (
      !freshBooking ||
      (freshBooking.status !== 'ASSIGNED' &&
        freshBooking.status !== 'NO_SHOW_REDISPATCH' &&
        !isRecoverableSearching)
    ) {
      ctx.log(`detectNoShows: skipping ${booking.id} â€” live status is ${freshBooking?.status ?? 'NOT_FOUND'}`);
      continue;
    }

    // Stable reference to the no-show technician: prefer the preserved field (survives
    // technicianId being cleared from the booking doc), fall back to freshBooking.technicianId.
    const noShowTechId = freshBooking.noShowTechnicianId ?? freshBooking.technicianId;

    // â”€â”€ Credit write (idempotency gate) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // If it throws (non-409 Cosmos error), skip this booking entirely.
    // If it returns false (409 = prior run already wrote credit), proceed â€” the prior run
    // may have failed mid-way and later steps may need to be retried.
    let creditCreated: boolean;
    try {
      creditCreated = await customerCreditRepo.createCreditIfAbsent({
        id: booking.id,
        customerId: booking.customerId,
        bookingId: booking.id,
        amount: NO_SHOW_CREDIT_PAISE,
        reason: 'NO_SHOW',
        createdAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows: credit write failed for ${booking.id} â€” skip`);
      continue;
    }

    if (creditCreated) {
      ctx.log(`detectNoShows: processing no-show bookingId=${booking.id}`);
      const _ts = new Date().toISOString();
      void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', action: 'NO_SHOW_CREDIT_ISSUED', resourceType: 'booking', resourceId: booking.id, payload: { bookingId: booking.id, creditAmount: NO_SHOW_CREDIT_PAISE }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
    } else {
      ctx.log(`detectNoShows: credit already exists for ${booking.id} â€” retrying remaining steps`);
    }

    // â”€â”€ Recovery skip check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // On recovery (creditCreated=false), check which downstream steps already completed.
    // `noShowRedispatchAt` is set after successful offers-sent.
    // `noShowPushSentAt` is set after successful FCM push.
    // Replacement-tech check: if ASSIGNED with a different technicianId and noShowTechId
    // is known, the redispatch already resolved â€” skip entirely.
    if (!creditCreated) {
      const liveBooking = await bookingRepo.getById(booking.id);

      // If replacement tech accepted, redispatch already resolved.
      // Still send the push if noShowPushSentAt is absent (crashed in step 3 before the push).
      if (
        liveBooking?.status === 'ASSIGNED' &&
        noShowTechId !== undefined &&
        liveBooking.technicianId !== undefined &&
        liveBooking.technicianId !== noShowTechId
      ) {
        if (!liveBooking.noShowPushSentAt) {
          try {
            await sendNoShowCreditPush(booking.customerId, booking.id, NO_SHOW_CREDIT_PAISE);
            await updateBookingFields(booking.id, { noShowPushSentAt: new Date().toISOString() });
          } catch (err: unknown) {
            Sentry.captureException(err);
            ctx.log(`detectNoShows: FCM recovery failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        ctx.log(`detectNoShows: recovery skipped for ${booking.id} â€” replacement tech ${liveBooking.technicianId} already assigned`);
        continue;
      }

      // noShowRedispatchAt present â†’ redispatch already fired; only push may be pending
      if (liveBooking?.noShowRedispatchAt && liveBooking.noShowPushSentAt) {
        // Both redispatch and push done â€” nothing left to do
        ctx.log(`detectNoShows: recovery skipped for ${booking.id} â€” all steps already completed`);
        continue;
      }
    }

    // â”€â”€ Step 1: Status write + preserve no-show tech ID â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Clear technicianId so the original tech's active-job screen stops updating.
    // Store noShowTechnicianId separately â€” needed for exclusion filter across recovery runs.
    // Track success: if this fails, noShowRedispatchAt must NOT be set so recovery retries.
    // Skip if already SEARCHING: a prior run already wrote this step. Writing again would
    // revert SEARCHING â†’ NO_SHOW_REDISPATCH and break the SEARCHING recovery guard in Step 2.
    let statusWriteOk = false;
    if (freshBooking.status === 'SEARCHING') {
      statusWriteOk = true; // Step 1 was completed by the prior run that crashed in Step 2.
    } else {
      try {
        await updateBookingFields(booking.id, {
          status: 'NO_SHOW_REDISPATCH',
          technicianId: undefined,
          noShowTechnicianId: noShowTechId,
        });
        statusWriteOk = true;
      } catch (err: unknown) {
        Sentry.captureException(err);
        ctx.log(`detectNoShows: status update failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // â”€â”€ Step 2: Redispatch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Only when status write succeeded (dispatcher checks for NO_SHOW_REDISPATCH status).
    // Skip if noShowRedispatchAt already set (recovery: prior run completed this step).
    // noShowTechId is passed explicitly so the exclusion filter survives even after
    // technicianId was cleared from the booking doc in Step 1.
    let redispatchOk = false;
    if (statusWriteOk && !freshBooking.noShowRedispatchAt) {
      // Re-read before dispatching: a concurrent invocation or a prior crash may have already
      // moved the booking to SEARCHING without writing noShowRedispatchAt.
      const preDispatchDoc = await bookingRepo.getById(booking.id);
      if (preDispatchDoc?.noShowRedispatchAt) {
        // Concurrent run completed the step.
        redispatchOk = true;
        ctx.log(`detectNoShows: redispatch already completed concurrently for ${booking.id}`);
      } else if (preDispatchDoc?.status === 'SEARCHING') {
        // Prior run called redispatch() (moving the booking to SEARCHING) but crashed before
        // writing noShowRedispatchAt. The dispatch attempt is live â€” just write the timestamp.
        await updateBookingFields(booking.id, { noShowRedispatchAt: new Date().toISOString() });
        redispatchOk = true;
        // Emit the audit that the prior run never wrote before crashing.
        const _rts = new Date().toISOString();
        void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', action: 'NO_SHOW_REDISPATCH_INITIATED', resourceType: 'booking', resourceId: booking.id, payload: { bookingId: booking.id }, timestamp: _rts, partitionKey: _rts.slice(0, 7) }).catch(Sentry.captureException);
        ctx.log(`detectNoShows: recovery â€” booking ${booking.id} already SEARCHING, completing noShowRedispatchAt write`);
      } else {
        try {
          redispatchOk = await dispatcherService.redispatch(booking.id, NO_SHOW_REDISPATCH_RADIUS_KM, noShowTechId);
          if (redispatchOk) {
            await updateBookingFields(booking.id, { noShowRedispatchAt: new Date().toISOString() });
            const _ts = new Date().toISOString();
            void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', action: 'NO_SHOW_REDISPATCH_INITIATED', resourceType: 'booking', resourceId: booking.id, payload: { bookingId: booking.id }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
          } else {
            ctx.log(`detectNoShows: no techs found for ${booking.id} â€” booking marked UNFULFILLED`);
            // Guard: dispatcher.redispatch() returns false both when no candidates exist AND when a
            // concurrent invocation already moved the booking out of NO_SHOW_REDISPATCH (to SEARCHING
            // or ASSIGNED). Only emit BOOKING_UNFULFILLED when the dispatcher actually set the status
            // to UNFULFILLED (which it does only when candidate list is genuinely exhausted).
            const postDispatchDoc = await bookingRepo.getById(booking.id);
            if (postDispatchDoc?.status === 'UNFULFILLED') {
              const _ts = new Date().toISOString();
              void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', action: 'BOOKING_UNFULFILLED', resourceType: 'booking', resourceId: booking.id, payload: { bookingId: booking.id }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
            }
          }
        } catch (err: unknown) {
          Sentry.captureException(err);
          ctx.log(`detectNoShows: redispatch failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } else if (freshBooking.noShowRedispatchAt) {
      // Redispatch was already done on a prior run â€” mark ok for logging
      redispatchOk = true;
      ctx.log(`detectNoShows: redispatch already completed for ${booking.id}`);
    }

    // â”€â”€ Step 3: FCM push â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Send when:
    //   - creditCreated=true (this run issued the credit, first-time path), OR
    //   - creditCreated=false but noShowPushSentAt is absent (recovery: prior run crashed
    //     before the push â€” retry is safe since the push is idempotent enough at 5-min cadence)
    // Skip if noShowPushSentAt is already set (already sent on a prior run).
    const pushAlreadySent = !!(await bookingRepo.getById(booking.id))?.noShowPushSentAt;
    if (!pushAlreadySent) {
      try {
        await sendNoShowCreditPush(booking.customerId, booking.id, NO_SHOW_CREDIT_PAISE);
        await updateBookingFields(booking.id, { noShowPushSentAt: new Date().toISOString() });
      } catch (err: unknown) {
        Sentry.captureException(err);
        ctx.log(`detectNoShows: FCM failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    void redispatchOk; // consumed above for logging
  }
}

app.timer('triggerNoShowDetector', {
  schedule: '0 */5 * * * *',
  handler: async (_timer: Timer, ctx: InvocationContext): Promise<void> => {
    try {
      await detectNoShows(ctx);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows ERROR: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  },

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Path technician-app -Force | Select-Object Name; Get-ChildItem -Path technician-app/app -Force | Select-Object Name; Get-Content -Path technician-app/app/build.gradle.kts -TotalCount 240' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 11543ms:

Name                             
----                             
.claude                          
.gradle                          
.kotlin                          
.semgrep                         
app                              
build                            
gradle                           
.editorconfig                    
build.gradle.kts                 
CLAUDE.md                        
detekt.yml                       
gradle.properties                
gradlew                          
gradlew.bat                      
hs_err_pid55224.log              
hs_err_pid60224.log              
local.properties                 
README.md                        
release-upload.jks               
replay_pid55224.log              
replay_pid60224.log              
settings.gradle.kts              
technician-upload-certificate.pem
build                            
src                              
build.gradle.kts                 
detekt-baseline.xml              
google-services.json             
hs_err_pid27776.log              
hs_err_pid30616.log              
hs_err_pid50584.log              
hs_err_pid54340.log              
hs_err_pid9444.log               
lint-baseline.xml                
proguard-rules.pro               
replay_pid27776.log              
replay_pid50584.log              
import groovy.json.JsonSlurper
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.io.File
import java.util.Properties

val localProperties =
    Properties().apply {
        val localPropertiesFile = rootProject.file("local.properties")
        if (localPropertiesFile.isFile) {
            localPropertiesFile.inputStream().use(::load)
        }
    }

fun localProperty(name: String): String? = localProperties.getProperty(name)?.takeIf { it.isNotBlank() }

fun googleServicesWebClientId(): String? {
    val googleServicesFile = file("google-services.json")
    if (!googleServicesFile.isFile) return null
    val root = JsonSlurper().parse(googleServicesFile) as? Map<*, *> ?: return null
    val clients = root["client"] as? List<*> ?: return null

    return clients
        .asSequence()
        .mapNotNull { it as? Map<*, *> }
        .flatMap { client ->
            ((client["oauth_client"] as? List<*>) ?: emptyList<Any?>()).asSequence()
        }.mapNotNull { it as? Map<*, *> }
        .firstOrNull { it["client_type"] == 3 }
        ?.get("client_id")
        ?.toString()
        ?.takeIf { it.isNotBlank() }
}

fun buildConfigString(value: String): String = "\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""

data class ReleaseSigning(
    val storeFile: File,
    val storePassword: String,
    val keyAlias: String,
    val keyPassword: String,
)

fun envOrLocalProperty(name: String): String? =
    System.getenv(name)?.takeIf { it.isNotBlank() }
        ?: localProperty(name)

fun releaseSigningProperty(name: String): String? =
    envOrLocalProperty("TECHNICIAN_$name")
        ?: envOrLocalProperty(name)

fun resolveReleaseFile(path: String): File {
    val candidate = File(path)
    return if (candidate.isAbsolute) candidate else rootProject.file(path)
}

fun loadReleaseSigning(): ReleaseSigning? {
    val storeFilePath = releaseSigningProperty("RELEASE_STORE_FILE")
    val storePassword = releaseSigningProperty("RELEASE_STORE_PASSWORD")
    val keyAlias = releaseSigningProperty("RELEASE_KEY_ALIAS")
    val keyPassword = releaseSigningProperty("RELEASE_KEY_PASSWORD")

    if (listOf(storeFilePath, storePassword, keyAlias, keyPassword).all { it == null }) {
        return null
    }

    val storeFile =
        resolveReleaseFile(
            requireNotNull(storeFilePath) {
                "Missing RELEASE_STORE_FILE for release signing."
            },
        )
    require(storeFile.isFile) {
        "Release signing store file not found at ${storeFile.absolutePath}."
    }

    return ReleaseSigning(
        storeFile = storeFile,
        storePassword =
            requireNotNull(storePassword) {
                "Missing RELEASE_STORE_PASSWORD for release signing."
            },
        keyAlias =
            requireNotNull(keyAlias) {
                "Missing RELEASE_KEY_ALIAS for release signing."
            },
        keyPassword =
            requireNotNull(keyPassword) {
                "Missing RELEASE_KEY_PASSWORD for release signing."
            },
    )
}

val googleWebClientId =
    System.getenv("GOOGLE_WEB_CLIENT_ID")?.takeIf { it.isNotBlank() }
        ?: localProperty("GOOGLE_WEB_CLIENT_ID")
        ?: googleServicesWebClientId()
        ?: ""

val mapsApiKey =
    System.getenv("MAPS_API_KEY")?.takeIf { it.isNotBlank() }
        ?: localProperty("MAPS_API_KEY")
        ?: ""

val releaseSigning = loadReleaseSigning()

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ktlint)
    alias(libs.plugins.detekt)
    alias(libs.plugins.paparazzi)
    alias(libs.plugins.kover)
    alias(libs.plugins.android.junit5)
    alias(libs.plugins.google.services)
    alias(libs.plugins.crashlytics)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "com.homeservices.technician"
    compileSdk = 35

    if (releaseSigning != null) {
        signingConfigs {
            create("release") {
                storeFile = releaseSigning.storeFile
                storePassword = releaseSigning.storePassword
                keyAlias = releaseSigning.keyAlias
                keyPassword = releaseSigning.keyPassword
            }
        }
    }

    defaultConfig {
        applicationId = "in.homeheroo.technician"
        minSdk = 26
        targetSdk = 35
        versionCode = 11
        versionName = "0.1.10"

        testInstrumentationRunner = "com.homeservices.technician.TestRunner"

        buildConfigField(
            "String",
            "SENTRY_DSN",
            "\"${System.getenv("SENTRY_DSN") ?: ""}\"",
        )
        buildConfigField(
            "String",
            "API_BASE_URL",
            "\"${System.getenv("API_BASE_URL") ?: "https://func-homeservices-prod.azurewebsites.net/api"}\"",
        )
        buildConfigField(
            "String",
            "GIT_SHA",
            "\"${System.getenv("GIT_SHA") ?: "dev"}\"",
        )
        buildConfigField(
            "String",
            "GOOGLE_WEB_CLIENT_ID",
            buildConfigString(googleWebClientId),
        )
        buildConfigField(
            "String",
            "MAPS_API_KEY",
            buildConfigString(mapsApiKey),
        )
        buildConfigField(
            "String",
            "GROWTHBOOK_CLIENT_KEY",
            "\"${System.getenv("GROWTHBOOK_CLIENT_KEY") ?: ""}\"",
        )
        buildConfigField(
            "String",
            "POSTHOG_API_KEY",
            "\"${System.getenv("POSTHOG_API_KEY") ?: ""}\"",
        )
        buildConfigField(
            "String",
            "POSTHOG_HOST",
            "\"${System.getenv("POSTHOG_HOST") ?: "https://us.i.posthog.com"}\"",
        )
        manifestPlaceholders["MAPS_API_KEY"] = mapsApiKey
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            if (releaseSigning != null) {
                signingConfig = signingConfigs.getByName("release")
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "/META-INF/LICENSE*"
        }
    }

    sourceSets {
        getByName("main").kotlin.srcDirs("src/main/kotlin")
        getByName("debug").kotlin.srcDirs("src/debug/kotlin")
        getByName("release").kotlin.srcDirs("src/release/kotlin")
        getByName("test").kotlin.srcDirs("src/test/kotlin")
        getByName("androidTest").kotlin.srcDirs("src/androidTest/kotlin")
    }

    lint {
        baseline = file("lint-baseline.xml")
        warningsAsErrors = true
        checkDependencies = false
        abortOnError = true
        checkReleaseBuilds = false
        // Story E01-S03 pins specific versions (AGP 8.6.0, targetSdk 35, etc.) per architecture
        // decision. Suppress advisory "newer version available" checks to avoid false failures.
        // LintError suppresses internal lint FIR crash (AGP 8.6.0 + K2 known issue on unit-test supertype resolution)
        disable += setOf("OldTargetApi", "AndroidGradlePluginVersion", "GradleDependency", "LintError")



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path technician-app/app/build.gradle.kts -Tail 220' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 4175ms:
                    // Shield Hilt DI module â€” @Provides methods are framework wiring,
                    // same rationale as data.rating.di.* / data.activeJob.di.*.
                    "*.data.shield.di.*",
                    // PayoutCadenceScreen generates Compose *Kt wrapper classes â€” same rationale
                    // as RatingScreenKt / EarningsScreenKt: recomposition guards + slot-table ops.
                    "*.PayoutCadenceScreenKt",
                    "*.PayoutCadenceScreenKt\$*",
                    // Payout Hilt DI module â€” @Provides methods are framework wiring,
                    // same rationale as data.rating.di.* / data.shield.di.*.
                    "*.data.payout.di.*",
                    // PayoutApiService is an internal Retrofit interface â€” methods invoked by
                    // Retrofit runtime, not unit-testable directly.
                    "*.PayoutApiService",
                    "*.PayoutApiService\$*",
                    // Service selection screen generates Compose *Kt wrapper classes â€” same
                    // rationale as the other Compose screen exclusions above.
                    "*.ServiceSelectionScreenKt",
                    "*.ServiceSelectionScreenKt\$*",
                    // Service profile Hilt DI module and Retrofit interface are framework wiring.
                    "*.data.serviceprofile.di.*",
                    "*.ServiceProfileApiService",
                    "*.ServiceProfileApiService\$*",
                    // PayoutCadenceViewModel.saveCadence$1 â€” viewModelScope.launch lambda containing
                    // biometric + PATCH call. The ?: return@launch guard and coroutine suspension
                    // points are only exercisable via instrumented tests (real FragmentActivity needed
                    // for BiometricPrompt). Business logic paths are fully covered by ViewModel unit
                    // tests using mockk.
                    "*.PayoutCadenceViewModel\$saveCadence\$1",
                    "*.PayoutCadenceViewModel\$saveCadence\$1\$*",
                    // IntegrityModule + IntegrityApiService â€” Play Integrity SDK DI wiring (E11-S03)
                    "*.domain.integrity.di.*",
                    "*.data.integrity.IntegrityApiService",
                    // Foreground service, BootReceiver, JobOfferFullScreenActivity (E11-S04)
                    "*.ActiveJobForegroundService",
                    "*.ActiveJobForegroundService\$*",
                    "*.BootReceiver",
                    "*.BootReceiver\$*",
                    "*.JobOfferFullScreenActivity",
                    "*.JobOfferFullScreenActivity\$*",
                    "*.*_AssistedFactory",
                    "*.*_AssistedFactory\$*",
                    "*.HomeservicesTechnicianApplication",
                    "*.HomeservicesTechnicianApplication\$*",
                    // IdTokenCache, FirebaseTokenAuthenticator, SessionPrefsMigrator (E11-S02)
                    "*.IdTokenCache",
                    "*.IdTokenCache\$*",
                    "*.FirebaseTokenAuthenticator",
                    "*.FirebaseTokenAuthenticator\$*",
                    "*.SessionPrefsMigrator",
                    "*.SessionPrefsMigrator\$*",
                    "*.data.network.auth.di.*",
                    // Moshi KSP-generated JSON adapters â€” code-gen output, same rationale as
                    // Hilt/Room-generated classes above. Each @JsonClass(generateAdapter = true)
                    // annotation causes Moshi KSP to emit a *JsonAdapter class with 30-50 JVM
                    // branches (null checks, token-switch statements, field-loop logic) that are
                    // invoked only by the Retrofit/Moshi runtime, not by JVM unit tests.
                    // Excluding these restores the branch metric to reflect actual domain-logic
                    // coverage rather than generated serialisation plumbing.
                    // Pattern covers all generated adapter names: ClassNameJsonAdapter.
                    "*.*JsonAdapter",
                    "*.*JsonAdapter\$*",
                    // PendingActionsModule â€” Hilt @Provides wiring for Room database construction (E11-S01a)
                    "*.data.pendingaction.di.*",
                    // PendingActionsDatabase â€” Room database singleton; generated _Impl has no unit-testable logic
                    "*.PendingActionsDatabase",
                    "*.PendingActionsDatabase\$*",
                    // Room KSP-generated DAO/DB implementation classes (anonymous Runnable/Callable on Room executor)
                    "*.PendingActionsDatabase_Impl",
                    "*.PendingActionsDatabase_Impl\$*",
                    "*.PendingActionDao_Impl",
                    "*.PendingActionDao_Impl\$*",
                    // Locale DI module â€” @Provides + @Binds methods are framework wiring, same rationale
                    // as data.auth.di.* / data.activeJob.di.* / data.jobOffer.di.* / data.photo.di.*.
                    "*.data.locale.di.*",
                    // CrashlyticsInitializer / AppCheckInitializer / PostHogInitializer wrap Firebase + PostHog
                    // Android SDK calls; not unit-testable without a live Firebase project / device.
                    "*.CrashlyticsInitializer",
                    "*.CrashlyticsInitializer\$*",
                    "*.AppCheckInitializer",
                    "*.AppCheckInitializer\$*",
                    "*.PostHogInitializer",
                    "*.PostHogInitializer\$*",
                    // TechnicianHomeScreen â€” Compose screen Kt wrapper + nested lambdas.
                    // Same rationale as RatingScreenKt / AuthScreenKt / EarningsScreenKt.
                    "*.TechnicianHomeScreenKt",
                    "*.TechnicianHomeScreenKt\$*",
                    // AuthScreenKt sub-composable lambda classes not matched by "*.AuthScreenKt".
                    "*.AuthScreenKt\$*",
                    // LanguageSettingsScreen â€” Compose screen Kt wrapper + nested lambdas.
                    "*.LanguageSettingsScreenKt",
                    "*.LanguageSettingsScreenKt\$*",
                    // Missing DI module packages â€” @Provides / @Binds framework wiring.
                    "*.data.kyc.di.*",
                    "*.data.earnings.di.*",
                    "*.data.availability.di.*",
                    "*.data.complaint.di.*",
                    "*.data.jobs.di.*",
                    "*.data.location.di.*",
                    "*.notification.di.*",
                    // HiltWrapper_* generated by Hilt â€” same rationale as *.Hilt_*.
                    "*.HiltWrapper_*",
                    // TechnicianDashboardScreen â€” Compose UI composable added by home-heroo branch;
                    // same rationale as other *Kt screen exclusions (recomposition guards, palette logic).
                    "*.TechnicianDashboardScreenKt",
                    "*.TechnicianDashboardScreenKt\$*",
                )
            }
        }
    }
}

// Hilt + KSP2 (K2 compiler): pass the flag that tells the Hilt KSP processor
// that the Hilt Gradle plugin IS applied and superclass validation should be
// skipped during the KSP pass (the plugin does the bytecode transform post-compile).
// Without this, KSP2 fails with "Expected @AndroidEntryPoint to have a value".
// See https://dagger.dev/hilt/gradle-setup.html#ksp
ksp {
    arg("dagger.hilt.android.internal.disableAndroidSuperclassValidation", "true")
}

// Paparazzi 1.3.5 picks up the correct layoutlib for the Compose BOM automatically.
// No paparazzi {} configuration block is needed or valid.

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.datastore.preferences)

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons.extended)
    implementation(libs.homeservices.design.system)
    implementation(libs.homeservices.core.nav)
    implementation(libs.kotlinx.serialization.json)

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)
    implementation(libs.androidx.hilt.navigation.compose)

    implementation(libs.sentry.android)
    implementation(libs.posthog.android)
    implementation(libs.growthbook.android)
    implementation(libs.growthbook.okhttp)

    // Firebase (BOM manages all Firebase library versions)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth.ktx)
    implementation(libs.firebase.messaging)
    implementation(libs.firebase.crashlytics.ktx)
    implementation(libs.firebase.appcheck.playintegrity)
    debugImplementation(libs.firebase.appcheck.debug)

    // Credential Manager + Google Identity Library
    implementation(libs.androidx.credentials)
    implementation(libs.androidx.credentials.playservices)
    implementation(libs.google.identity.googleid)

    // Coroutines â€” play-services extensions (.await() on Task<T>)
    implementation(libs.kotlinx.coroutines.play.services)

    // Auth SDKs
    implementation(libs.truecaller.sdk)
    implementation(libs.androidx.security.crypto)
    implementation(libs.androidx.biometric)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.play.services.location)
    implementation(libs.play.services.maps)
    implementation(libs.maps.compose)

    // Play Integrity API
    implementation(libs.play.integrity)

    // KYC networking + serialization
    implementation(libs.retrofit.core)
    implementation(libs.retrofit.moshi)
    implementation(libs.okhttp.core)
    implementation(libs.okhttp.logging)
    implementation(libs.moshi.kotlin)
    ksp(libs.moshi.kotlin.codegen)
    implementation(libs.androidx.browser)
    implementation(libs.firebase.storage)

    // CameraX â€” on-device photo capture for job stage evidence (E06-S02)
    implementation(libs.camera.core)
    implementation(libs.camera.camera2)
    implementation(libs.camera.lifecycle)
    implementation(libs.camera.view)

    // WorkManager + Hilt-Worker integration (E11-S04)
    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.androidx.hilt.work)
    ksp(libs.androidx.hilt.compiler)

    testImplementation(libs.junit.jupiter)
    testImplementation(libs.junit.jupiter.api)
    testRuntimeOnly(libs.junit.jupiter.engine)
    // JUnit 4 vintage engine: required for Paparazzi @Rule-based tests under the JUnit 5 launcher
    testRuntimeOnly(libs.junit.vintage.engine)
    testImplementation(libs.mockk)
    testImplementation(libs.assertj.core)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.core)
    testImplementation(libs.hilt.testing)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.okhttp.mockwebserver)
    kspTest(libs.hilt.compiler)
    kspTest(libs.androidx.hilt.compiler)

    androidTestImplementation(libs.hilt.testing)
    androidTestImplementation(libs.androidx.test.runner)
    kspAndroidTest(libs.hilt.compiler)
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Path 'technician-app/app/src/main/kotlin/com/homeservices/technician/data' -Recurse -Filter '*ApiService.kt' | Select-Object -ExpandProperty FullName | ForEach-Object { "'$_.Replace((Get-Location).Path+'"'\\','') }" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 2424ms:
technician-app\app\src\main\kotlin\com\homeservices\technician\data\activeJob\ActiveJobApiService.kt
technician-app\app\src\main\kotlin\com\homeservices\technician\data\availability\remote\TechnicianAvailabilityApiService.kt
technician-app\app\src\main\kotlin\com\homeservices\technician\data\complaint\remote\ComplaintApiService.kt
technician-app\app\src\main\kotlin\com\homeservices\technician\data\earnings\remote\EarningsApiService.kt
technician-app\app\src\main\kotlin\com\homeservices\technician\data\erasure\remote\ErasureApiService.kt
technician-app\app\src\main\kotlin\com\homeservices\technician\data\integrity\IntegrityApiService.kt
technician-app\app\src\main\kotlin\com\homeservices\technician\data\jobOffer\JobOfferApiService.kt
technician-app\app\src\main\kotlin\com\homeservices\technician\data\jobs\remote\TechnicianJobsApiService.kt
technician-app\app\src\main\kotlin\com\homeservices\technician\data\payout\remote\PayoutApiService.kt
technician-app\app\src\main\kotlin\com\homeservices\technician\data\photo\PhotoApiService.kt
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\RatingApiService.kt
technician-app\app\src\main\kotlin\com\homeservices\technician\data\serviceprofile\remote\ServiceProfileApiService.kt
technician-app\app\src\main\kotlin\com\homeservices\technician\data\shield\remote\ShieldApiService.kt

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content 'technician-app/app/src/main/kotlin/com/homeservices/technician/data/payout/remote/PayoutApiService.kt'; Write-Host '---'; Get-Content 'technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/remote/EarningsApiService.kt'; Write-Host '---'; Get-Content 'technician-app/app/src/main/kotlin/com/homeservices/technician/data/complaint/remote/ComplaintApiService.kt'; Write-Host '---'; Get-Content 'technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ActiveJobApiService.kt' -TotalCount 120" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3124ms:
package com.homeservices.technician.data.payout.remote

import com.homeservices.technician.data.payout.remote.dto.UpdatePayoutCadenceRequestDto
import com.homeservices.technician.data.payout.remote.dto.UpdatePayoutCadenceResponseDto
import retrofit2.http.Body
import retrofit2.http.PATCH

public interface PayoutApiService {
    @PATCH("v1/technicians/me/payout-cadence")
    public suspend fun updatePayoutCadence(
        @Body body: UpdatePayoutCadenceRequestDto,
    ): UpdatePayoutCadenceResponseDto
}
---
package com.homeservices.technician.data.earnings.remote

import com.homeservices.technician.data.earnings.remote.dto.EarningsResponseDto
import retrofit2.http.GET

public interface EarningsApiService {
    @GET("v1/technicians/me/earnings")
    public suspend fun getEarnings(): EarningsResponseDto
}
---
package com.homeservices.technician.data.complaint.remote

import com.homeservices.technician.data.complaint.remote.dto.ComplaintListResponseDto
import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.technician.data.complaint.remote.dto.CreateComplaintRequestDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

public interface ComplaintApiService {
    @POST("v1/complaints")
    public suspend fun createComplaint(
        @Body body: CreateComplaintRequestDto,
    ): ComplaintResponseDto

    @GET("v1/complaints/{bookingId}")
    public suspend fun getComplaintsForBooking(
        @Path("bookingId") bookingId: String,
    ): ComplaintListResponseDto
}
---
package com.homeservices.technician.data.activeJob

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path

internal interface ActiveJobApiService {
    @GET("v1/technicians/active-job/{bookingId}")
    suspend fun getActiveJob(
        @Path("bookingId") bookingId: String,
    ): Response<ActiveJobResponse>

    @PATCH("v1/technicians/active-job/{bookingId}/transition")
    suspend fun transitionStatus(
        @Path("bookingId") bookingId: String,
        @Body body: TransitionRequest,
        @Header("X-Integrity-Token") integrityToken: String? = null,
    ): Response<ActiveJobResponse>

    @POST("v1/technicians/active-job/{bookingId}/location")
    suspend fun postActiveJobLocation(
        @Path("bookingId") bookingId: String,
        @Body body: com.homeservices.technician.data.activeJob.dto.PostLocationRequest,
    ): Response<Unit>
}

@JsonClass(generateAdapter = true)
internal data class ActiveJobResponse(
    // API returns "bookingId"; field aliased to "id" per E11 spec Â§9.3.
    // Follow-up API PR required: rename active-job.ts:40 bookingId â†’ id.
    @Json(name = "bookingId") val id: String,
    val customerId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val addressLatLng: LatLngDto,
    val status: String,
    val slotDate: String,
    val slotWindow: String,
)

@JsonClass(generateAdapter = true)
internal data class LatLngDto(
    val lat: Double,
    val lng: Double,
)

@JsonClass(generateAdapter = true)
internal data class LocationAttestationDto(
    val isMock: Boolean,
    val gpsAccuracyM: Float,
)

@JsonClass(generateAdapter = true)
internal data class TransitionRequest(
    val targetStatus: String,
    val currentLocation: LatLngDto? = null,
    val attestation: LocationAttestationDto? = null,
)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg \"Moshi|Retrofit|create\\(\" technician-app/app/src/main/kotlin/com/homeservices/technician -n | Select-Object -First 200" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 2558ms:
technician-app/app/src/main/kotlin/com/homeservices/technician\data\availability\di\TechnicianAvailabilityModule.kt:11:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\availability\di\TechnicianAvailabilityModule.kt:23:        fun provideTechnicianAvailabilityApiService(retrofit: Retrofit): TechnicianAvailabilityApiService =
technician-app/app/src/main/kotlin/com/homeservices/technician\data\availability\di\TechnicianAvailabilityModule.kt:24:            retrofit.create(TechnicianAvailabilityApiService::class.java)
technician-app/app/src/main/kotlin/com/homeservices/technician\data\auth\di\AuthModule.kt:17:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\auth\di\AuthModule.kt:33:    internal fun provideDeviceApi(retrofit: Retrofit): DeviceApi = retrofit.create(DeviceApi::class.java)
technician-app/app/src/main/kotlin/com/homeservices/technician\data\auth\di\AuthModule.kt:39:    ): CredentialManager = CredentialManager.create(context)
technician-app/app/src/main/kotlin/com/homeservices/technician\data\auth\di\AuthModule.kt:53:            EncryptedSharedPreferences.create(
technician-app/app/src/main/kotlin/com/homeservices/technician\data\earnings\di\EarningsModule.kt:11:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\earnings\di\EarningsModule.kt:23:        public fun provideEarningsApiService(retrofit: Retrofit): EarningsApiService = retrofit.create(EarningsApiService::class.java)
technician-app/app/src/main/kotlin/com/homeservices/technician\data\network\MoshiExt.kt:3:import com.squareup.moshi.Moshi
technician-app/app/src/main/kotlin/com/homeservices/technician\data\network\MoshiExt.kt:6:internal val defaultMoshi: Moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()
technician-app/app/src/main/kotlin/com/homeservices/technician\data\network\di\NetworkModule.kt:6:import com.homeservices.technician.data.network.defaultMoshi
technician-app/app/src/main/kotlin/com/homeservices/technician\data\network\di\NetworkModule.kt:7:import com.squareup.moshi.Moshi
technician-app/app/src/main/kotlin/com/homeservices/technician\data\network\di\NetworkModule.kt:14:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\network\di\NetworkModule.kt:15:import retrofit2.converter.moshi.MoshiConverterFactory
technician-app/app/src/main/kotlin/com/homeservices/technician\data\network\di\NetworkModule.kt:32:    public fun provideMoshi(): Moshi = defaultMoshi
technician-app/app/src/main/kotlin/com/homeservices/technician\data\network\di\NetworkModule.kt:84:    public fun provideRetrofit(
technician-app/app/src/main/kotlin/com/homeservices/technician\data\network\di\NetworkModule.kt:86:        moshi: Moshi,
technician-app/app/src/main/kotlin/com/homeservices/technician\data\network\di\NetworkModule.kt:87:    ): Retrofit =
technician-app/app/src/main/kotlin/com/homeservices/technician\data\network\di\NetworkModule.kt:88:        Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\network\di\NetworkModule.kt:92:            .addConverterFactory(MoshiConverterFactory.create(moshi))
technician-app/app/src/main/kotlin/com/homeservices/technician\data\jobOffer\di\JobOfferModule.kt:8:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\jobOffer\di\JobOfferModule.kt:16:    internal fun provideJobOfferApiService(retrofit: Retrofit): JobOfferApiService = retrofit.create(JobOfferApiService::class.java)
technician-app/app/src/main/kotlin/com/homeservices/technician\data\complaint\di\ComplaintModule.kt:11:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\complaint\di\ComplaintModule.kt:26:        public fun provideComplaintApiService(retrofit: Retrofit): ComplaintApiService = retrofit.create(ComplaintApiService::class.java)
technician-app/app/src/main/kotlin/com/homeservices/technician\data\activeJob\di\ActiveJobModule.kt:16:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\activeJob\di\ActiveJobModule.kt:29:        internal fun provideActiveJobApiService(retrofit: Retrofit): ActiveJobApiService = retrofit.create(ActiveJobApiService::class.java)
technician-app/app/src/main/kotlin/com/homeservices/technician\data\kyc\di\KycModule.kt:14:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\kyc\di\KycModule.kt:31:        internal fun provideKycApiService(retrofit: Retrofit): KycApiService = retrofit.create(KycApiService::class.java)
technician-app/app/src/main/kotlin/com/homeservices/technician\data\jobs\di\TechnicianJobsModule.kt:11:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\jobs\di\TechnicianJobsModule.kt:23:        internal fun provideTechnicianJobsApiService(retrofit: Retrofit): TechnicianJobsApiService =
technician-app/app/src/main/kotlin/com/homeservices/technician\data\jobs\di\TechnicianJobsModule.kt:24:            retrofit.create(TechnicianJobsApiService::class.java)
technician-app/app/src/main/kotlin/com/homeservices/technician\data\shield\ShieldRepositoryImpl.kt:10:import com.squareup.moshi.Moshi
technician-app/app/src/main/kotlin/com/homeservices/technician\data\shield\ShieldRepositoryImpl.kt:17:        private val moshi: Moshi,
technician-app/app/src/main/kotlin/com/homeservices/technician\data\photo\di\PhotoModule.kt:10:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\photo\di\PhotoModule.kt:18:    internal fun providePhotoApiService(retrofit: Retrofit): PhotoApiService = retrofit.create(PhotoApiService::class.java)
technician-app/app/src/main/kotlin/com/homeservices/technician\data\shield\di\ShieldModule.kt:11:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\shield\di\ShieldModule.kt:23:        public fun provideShieldApiService(retrofit: Retrofit): ShieldApiService = retrofit.create(ShieldApiService::class.java)
technician-app/app/src/main/kotlin/com/homeservices/technician\data\rating\di\RatingModule.kt:11:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\rating\di\RatingModule.kt:23:        public fun provideRatingApiService(retrofit: Retrofit): RatingApiService = retrofit.create(RatingApiService::class.java)
technician-app/app/src/main/kotlin/com/homeservices/technician\data\payout\di\PayoutModule.kt:11:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\payout\di\PayoutModule.kt:23:        public fun providePayoutApiService(retrofit: Retrofit): PayoutApiService = retrofit.create(PayoutApiService::class.java)
technician-app/app/src/main/kotlin/com/homeservices/technician\data\serviceprofile\di\ServiceProfileModule.kt:11:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\data\serviceprofile\di\ServiceProfileModule.kt:23:        fun provideServiceProfileApiService(retrofit: Retrofit): ServiceProfileApiService =
technician-app/app/src/main/kotlin/com/homeservices/technician\data\serviceprofile\di\ServiceProfileModule.kt:24:            retrofit.create(ServiceProfileApiService::class.java)
technician-app/app/src/main/kotlin/com/homeservices/technician\domain\integrity\PlayIntegrityAttestor.kt:24:            val manager = IntegrityManagerFactory.create(context)
technician-app/app/src/main/kotlin/com/homeservices/technician\domain\integrity\di\IntegrityModule.kt:13:import retrofit2.Retrofit
technician-app/app/src/main/kotlin/com/homeservices/technician\domain\integrity\di\IntegrityModule.kt:31:    public fun provideIntegrityApiService(retrofit: Retrofit): IntegrityApiService = retrofit.create(IntegrityApiService::class.java)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content 'technician-app/app/src/main/kotlin/com/homeservices/technician/data/network/MoshiExt.kt'; Get-Content 'technician-app/app/src/main/kotlin/com/homeservices/technician/data/network/di/NetworkModule.kt' -TotalCount 130" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 2078ms:
package com.homeservices.technician.data.network

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory

internal val defaultMoshi: Moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()
package com.homeservices.technician.data.network.di

import com.homeservices.technician.BuildConfig
import com.homeservices.technician.data.network.auth.FirebaseTokenAuthenticator
import com.homeservices.technician.data.network.auth.IdTokenCache
import com.homeservices.technician.data.network.defaultMoshi
import com.squareup.moshi.Moshi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Qualifier
import javax.inject.Singleton

@Qualifier
@Retention(AnnotationRetention.BINARY)
public annotation class AuthOkHttpClient

@Qualifier
@Retention(AnnotationRetention.BINARY)
public annotation class UnauthOkHttpClient

@Module
@InstallIn(SingletonComponent::class)
public object NetworkModule {
    @Provides
    @Singleton
    public fun provideMoshi(): Moshi = defaultMoshi

    @Provides
    @Singleton
    public fun provideLoggingInterceptor(): HttpLoggingInterceptor =
        HttpLoggingInterceptor().apply {
            level =
                if (BuildConfig.DEBUG) {
                    HttpLoggingInterceptor.Level.BODY
                } else {
                    HttpLoggingInterceptor.Level.NONE
                }
        }

    @Provides
    @Singleton
    @AuthOkHttpClient
    public fun provideAuthOkHttpClient(
        idTokenCache: IdTokenCache,
        authenticator: FirebaseTokenAuthenticator,
        logging: HttpLoggingInterceptor,
    ): OkHttpClient =
        OkHttpClient
            .Builder()
            .addInterceptor { chain ->
                val token = idTokenCache.cachedToken
                val req =
                    if (token != null) {
                        chain
                            .request()
                            .newBuilder()
                            .header("Authorization", "Bearer $token")
                            .build()
                    } else {
                        chain.request()
                    }
                chain.proceed(req)
            }.addInterceptor(logging)
            .authenticator(authenticator)
            .build()

    @Provides
    @Singleton
    @UnauthOkHttpClient
    public fun provideUnauthOkHttpClient(logging: HttpLoggingInterceptor): OkHttpClient =
        OkHttpClient
            .Builder()
            .addInterceptor(logging)
            .build()

    @Provides
    @Singleton
    public fun provideRetrofit(
        @AuthOkHttpClient client: OkHttpClient,
        moshi: Moshi,
    ): Retrofit =
        Retrofit
            .Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Path 'api/src/services/userRole.service.ts' -TotalCount 220" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1365ms:
import { getCosmosClient, DB_NAME } from '../cosmos/client.js';

const TECHNICIANS_CONTAINER = 'technicians';

/**
 * Authoritative role lookup. The technicians container holds a doc per uid for
 * every onboarded partner; absence implies a customer (or unknown user, which
 * the caller should treat as customer for the purpose of self-service rights
 * endpoints â€” there's no PII to read or erase that wouldn't otherwise be
 * scoped by the uid filter).
 *
 * Critically, this is NOT derived from a client-supplied header. DPDP Â§12
 * cascade depth depends on the role; an attacker who could spoof CUSTOMER
 * could persuade us to skip the technician hard-delete cascade.
 */
export async function inferUserRole(uid: string): Promise<'CUSTOMER' | 'TECHNICIAN'> {
  try {
    const { resource } = await getCosmosClient()
      .database(DB_NAME)
      .container(TECHNICIANS_CONTAINER)
      .item(uid, uid)
      .read<Record<string, unknown>>();
    return resource ? 'TECHNICIAN' : 'CUSTOMER';
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 404) return 'CUSTOMER';
    throw err;
  }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "active" docs/superpowers/specs/2026-05-22-account-deletion-design.md docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md -n | Select-Object -First 80' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3757ms:
docs/superpowers/specs/2026-05-22-account-deletion-design.md:22:1. API: active-job gate in the submit handler
docs/superpowers/specs/2026-05-22-account-deletion-design.md:28:## 2. API change — active-job gate
docs/superpowers/specs/2026-05-22-account-deletion-design.md:32:**Change:** After auth and role inference, before creating the erasure doc, query for any active booking for this technician:
docs/superpowers/specs/2026-05-22-account-deletion-design.md:45:Uses an indexed query on `technicianId + status`. Returns `true` if any active booking exists.
docs/superpowers/specs/2026-05-22-account-deletion-design.md:51:| No active job, valid phrase | 201 + erasure doc created |
docs/superpowers/specs/2026-05-22-account-deletion-design.md:97:Client-side active-job pre-check before hitting the network:
docs/superpowers/specs/2026-05-22-account-deletion-design.md:101:    // Fast-path hint: activeJobState is non-null only when actively observing a job.
docs/superpowers/specs/2026-05-22-account-deletion-design.md:103:    if (activeJobRepository.activeJobState.value != null) {
docs/superpowers/specs/2026-05-22-account-deletion-design.md:110:Client-side check is a fast-path UX guard using `activeJobRepository.activeJobState.value != null`. This is a hint only — `activeJobState` is only populated while an active job is being observed (FCM or manual fetch). If null, the use case proceeds to the API; the server-side gate in §2 is the authoritative check and will catch any active job the client doesn't know about.
docs/superpowers/specs/2026-05-22-account-deletion-design.md:120:| `activeJobRepository.hasActiveJob()` returns true | `ActiveJobExists` (no network call) |
docs/superpowers/specs/2026-05-22-account-deletion-design.md:121:| No active job, repo returns Success | `Success(scheduledDeletionAt)` |
docs/superpowers/specs/2026-05-22-account-deletion-design.md:122:| No active job, repo returns `ActiveJobExists` (server-side) | `ActiveJobExists` |
docs/superpowers/specs/2026-05-22-account-deletion-design.md:123:| No active job, repo returns `UnknownError` | `UnknownError` propagated |
docs/superpowers/specs/2026-05-22-account-deletion-design.md:141:**Init:** calls `SubmitErasureRequestUseCase` check-only path (or directly `activeJobRepository.hasActiveJob()`). If active job → state = `ActiveJobBlocked`. If clear → state = `Idle`.
docs/superpowers/specs/2026-05-22-account-deletion-design.md:155:| Init with active job | `ActiveJobBlocked` |
docs/superpowers/specs/2026-05-22-account-deletion-design.md:156:| Init without active job | `Idle` |
docs/superpowers/specs/2026-05-22-account-deletion-design.md:181:- Body: `delete_account_active_job_error`
docs/superpowers/specs/2026-05-22-account-deletion-design.md:270:<string name="delete_account_active_job_title">Job in progress</string>
docs/superpowers/specs/2026-05-22-account-deletion-design.md:271:<string name="delete_account_active_job_error">Complete or cancel your current job before deleting your account</string>
docs/superpowers/specs/2026-05-22-account-deletion-design.md:272:<string name="delete_account_active_job_ok">OK</string>
docs/superpowers/specs/2026-05-22-account-deletion-design.md:299:<string name="delete_account_active_job_title">जॉब जारी है</string>
docs/superpowers/specs/2026-05-22-account-deletion-design.md:300:<string name="delete_account_active_job_error">अकाउंट हटाने से पहले अपनी मौजूदा जॉब पूरी करें या रद्द करें</string>
docs/superpowers/specs/2026-05-22-account-deletion-design.md:301:<string name="delete_account_active_job_ok">ठीक है</string>
docs/superpowers/specs/2026-05-22-account-deletion-design.md:330:| WS-A | API: `hasActiveBookingForTechnician` + active-job gate in submit handler + unit tests | Sonnet | — |
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:5:**Goal:** Add Play-Store-mandatory account deletion to the HomeHeroo Technician app: in-app deletion UI, API active-job gate, and a public web form for uninstalled users.
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:7:**Architecture:** The API's erasure pipeline (schema, cron, cascade) is fully built from PR #257 — this story adds only the active-job pre-check to the submit handler and the entire Android UI path. The app uses a new `ErasureApiService` (Retrofit) → `ErasureRepositoryImpl` → `SubmitErasureRequestUseCase` → `DeleteAccountViewModel` chain. After the user confirms deletion the app signs them out; erasure runs server-side 7 days later via cron.
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:53:  it('returns true when an active booking exists', async () => {
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:63:  it('returns false when no active bookings exist', async () => {
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:118:## Task 2: API — active-job gate in erasure submit handler (TDD)
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:178:  it('returns 201 when no active job and valid phrase', async () => {
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:187:  it('returns 409 ACTIVE_JOB_EXISTS when technician has an active booking', async () => {
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:225:- [ ] **Step 3: Add active-job gate to `api/src/functions/users-erasure-request.ts`**
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:236:  // Gate: refuse deletion if an active booking exists for this technician.
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:257:git commit -m "feat(api): active-job gate for erasure-request submit handler (E20-S08)"
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:287:    <string name="delete_account_active_job_title">Job in progress</string>
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:288:    <string name="delete_account_active_job_error">Complete or cancel your current job before deleting your account</string>
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:289:    <string name="delete_account_active_job_ok">OK</string>
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:319:    <string name="delete_account_active_job_title">जॉब जारी है</string>
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:320:    <string name="delete_account_active_job_error">अकाउंट हटाने से पहले अपनी मौजूदा जॉब पूरी करें या रद्द करें</string>
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:321:    <string name="delete_account_active_job_ok">ठीक है</string>
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:529:import com.homeservices.technician.domain.activeJob.ActiveJobRepository
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:530:import com.homeservices.technician.domain.activeJob.model.ActiveJob
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:531:import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:532:import com.homeservices.technician.domain.activeJob.model.LatLng
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:545:    private val activeJobRepository: ActiveJobRepository = mockk()
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:548:    private fun activeJob() = ActiveJob(
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:562:        useCase = SubmitErasureRequestUseCase(erasureRepository, activeJobRepository)
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:566:    fun `returns ActiveJobExists without network call when activeJobState is non-null`() = runTest {
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:567:        every { activeJobRepository.activeJobState } returns MutableStateFlow(activeJob())
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:576:    fun `calls repository when activeJobState is null and returns Success`() = runTest {
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:577:        every { activeJobRepository.activeJobState } returns MutableStateFlow(null)
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:587:    fun `propagates ActiveJobExists from server when activeJobState is null`() = runTest {
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:588:        every { activeJobRepository.activeJobState } returns MutableStateFlow(null)
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:598:        every { activeJobRepository.activeJobState } returns MutableStateFlow(null)
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:622:import com.homeservices.technician.domain.activeJob.ActiveJobRepository
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:631:        private val activeJobRepository: ActiveJobRepository,
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:634:            // Fast-path: activeJobState is non-null only while observing an active job.
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:636:            if (activeJobRepository.activeJobState.value != null) {
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:656:git commit -m "feat(technician-app): SubmitErasureRequestUseCase with active-job client gate (E20-S08)"
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:917:            title = { Text(stringResource(R.string.delete_account_active_job_title)) },
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:918:            text = { Text(stringResource(R.string.delete_account_active_job_error)) },
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:921:                    Text(stringResource(R.string.delete_account_active_job_ok))
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:1564:- API: active-job gate prevents deletion while a booking is in flight
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:1574:- [ ] Tapping while active job shows AlertDialog "Complete your current job first"

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Path 'docs/superpowers/specs/2026-05-22-account-deletion-design.md' -TotalCount 90" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3349ms:
# Account Deletion â€” E20-S08 Design Spec

**Date:** 2026-05-22
**Story:** E20-S08 â€” Lane7-C2 (account deletion, Play Store mandatory)
**Tier:** Foundation (auth + PII, cross-stack, high blast radius)
**Status:** Approved â€” ready for plan

---

## 1. Context and scope

HomeHeroo Technician app must offer an in-app account deletion path to satisfy Play Store Data Safety policy (mandatory since May 2024) and the privacy policy commitment at https://aloktiwarigit.github.io/homeheroo-privacy/technician/ Â§7.

**What already exists (PR #257 â€” do not re-implement):**
- `api/src/schemas/erasure-request.ts` â€” full Zod schema, state machine, `ERASURE_CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT'`, `ERASURE_GRACE_PERIOD_MS = 7 days`
- `api/src/cosmos/erasure-request-repository.ts` â€” full CRUD with optimistic concurrency
- `api/src/functions/users-erasure-request.ts` â€” POST + DELETE `v1/users/me/erasure-request` (submit + revoke)
- `api/src/functions/trigger-erasure-deadline.ts` â€” daily cron at 02:00 UTC, auto-executes overdue PENDING requests
- `api/src/services/erasureCascade.service.ts` â€” anonymizes bookings/ratings/complaints/wallet/events; hard-deletes technician doc + KYC; clears FCM + device tokens

**What this story adds:**
1. API: active-job gate in the submit handler
2. Technician-app: in-app deletion UI (Settings entry â†’ confirmation screen â†’ terminal screen)
3. homeheroo-privacy repo: public web form for uninstalled users

---

## 2. API change â€” active-job gate

**File:** `api/src/functions/users-erasure-request.ts` (`submitErasureRequestHandler`)

**Change:** After auth and role inference, before creating the erasure doc, query for any active booking for this technician:

```
query bookings WHERE technicianId = uid
  AND status IN ('ASSIGNED', 'IN_PROGRESS', 'REACHED', 'STARTED')
```

If any found â†’ return `409 { code: 'ACTIVE_JOB_EXISTS' }`.

**Supporting change:** `api/src/cosmos/booking-repository.ts` gains:
```typescript
hasActiveBookingForTechnician(technicianId: string): Promise<boolean>
```
Uses an indexed query on `technicianId + status`. Returns `true` if any active booking exists.

**Test file (written before implementation):** `api/src/functions/users-erasure-request.test.ts`

| Case | Expected |
|---|---|
| No active job, valid phrase | 201 + erasure doc created |
| Active job exists | 409 `ACTIVE_JOB_EXISTS` |
| Duplicate PENDING request | 409 `ERASURE_REQUEST_PENDING` |
| Wrong confirmation phrase | 400 `VALIDATION_ERROR` |
| Unauthenticated | 401 `UNAUTHENTICATED` |

---

## 3. Technician-app â€” data + domain layer

### 3.1 ErasureApiService.kt

Ktor HTTP interface. Two methods:

```kotlin
suspend fun submitErasureRequest(
    idToken: String,
    confirmationPhrase: String = ERASURE_CONFIRMATION_PHRASE,
    reason: String? = null,
): ErasureSubmitResponse  // erasureId, scheduledDeletionAt, status

suspend fun revokeErasureRequest(idToken: String): Unit  // 204
```

`ERASURE_CONFIRMATION_PHRASE = "DELETE MY ACCOUNT"` â€” defined as a constant, never shown to the user as a text field. The button sends it internally.

### 3.2 ErasureRepository + ErasureRepositoryImpl

Thin wrapper around `ErasureApiService`. Injects `FirebaseTokenAuthenticator` for token retrieval.

```kotlin
interface ErasureRepository {
    suspend fun submitRequest(reason: String? = null): ErasureSubmitResult
    suspend fun revokeRequest(): Unit
}

sealed class ErasureSubmitResult {
    data class Success(val scheduledDeletionAt: String) : ErasureSubmitResult()
    object ActiveJobExists : ErasureSubmitResult()
    object DuplicatePending : ErasureSubmitResult()

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem api | Select-Object Name; Get-Content api/package.json' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 6490ms:

Name                       
----                       
.claude                    
.deploy-stage              
coverage                   
dist                       
docs                       
node_modules               
plans                      
scripts                    
specs                      
src                        
tests                      
.editorconfig              
.firebase-adminsdk.json    
.funcignore                
.nvmrc                     
.prettierignore            
.prettierrc.json           
.semgrep.yml               
.spectral.yaml             
CLAUDE.md                  
deploy-f2a6844.zip         
deploy-src.zip             
deploy-v2.zip              
deploy.zip                 
eslint.config.mjs          
func-start.err.log         
func-start.out.log         
host.json                  
local.settings.example.json
local.settings.json        
openapi.json               
package-lock.json          
package.json               
pnpm-lock.yaml             
README.md                  
stage-func-start.err.log   
stage-func-start.out.log   
tsconfig.json              
tsconfig.tests.json        
vitest.config.ts           
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
    "seed:admin": "tsx scripts/seed-admin.ts",
    "invite:admin": "tsx scripts/invite-admin.ts",
    "seed:technicians": "npx tsx scripts/seed-technicians.ts",
    "seed:catalogue": "tsx src/cosmos/seeds/catalogue.ts",
    "seed:complaints": "tsx src/cosmos/seeds/complaints.ts",
    "provision:indexes": "tsx scripts/provision-cosmos-indexes.ts",
    "semgrep:scan": "semgrep --config .semgrep.yml src/",
    "backfill:pan-mask": "tsx scripts/backfill-pan-mask.ts"
  },
  "dependencies": {
    "@azure/ai-form-recognizer": "^5.1.0",
    "@azure/communication-email": "^1.1.0",
    "@azure/cosmos": "^4.9.2",
    "@azure/functions": "^4.5.0",
    "@azure/monitor-opentelemetry-exporter": "1.0.0-beta.32",
    "@growthbook/growthbook": "^1",
    "@opentelemetry/resources": "^1",
    "@opentelemetry/sdk-node": "^0.57",
    "@sentry/node": "^8",
    "@turf/boolean-point-in-polygon": "^7.3.5",
    "@turf/helpers": "^7.3.5",
    "fastify": "^5",
    "firebase-admin": "^13.8.0",
    "jose": "^6.2.2",
    "otplib": "^13.4.0",
    "pdfkit": "^0.18.0",
    "posthog-node": "^4",
    "qrcode": "^1.5.4",
    "razorpay": "^2.9.6",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@apidevtools/swagger-parser": "^10.1.0",
    "@asteasolutions/zod-to-openapi": "^7.3.0",
    "@stoplight/spectral-cli": "^6.11.0",
    "@types/geojson": "^7946.0.16",
    "@types/node": "^22",
    "@types/pdfkit": "^0.17.6",
    "@types/qrcode": "^1.5.6",
    "@vitest/coverage-v8": "^2",
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



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm exec tsc --noEmit -p tsconfig.tests.json' in C:\Alok\Business Projects\Urbanclap-dup\api
2026-05-23T00:30:05.950659Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 9.5 seconds
Output:
Thread failed to start.

 exited 1 in 9533ms:
Thread failed to start.

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm exec vitest run tests/functions/users-erasure-request.test.ts tests/cosmos/booking-repository-hasActiveBookingForTechnician.test.ts --runInBand' in C:\Alok\Business Projects\Urbanclap-dup\api
2026-05-23T00:30:10.057504Z ERROR codex_core::exec: exec error: windows sandbox: spawn setup refresh
2026-05-23T00:30:10.061953Z ERROR codex_core::tools::router: error=execution error: Io(Custom { kind: Other, error: "windows sandbox: spawn setup refresh" })
 exited -1 in 0ms:
execution error: Io(Custom { kind: Other, error: "windows sandbox: spawn setup refresh" })
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/vitest.config.ts; Get-Content api/tsconfig.tests.json' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 4963ms:
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/bootstrap.ts',
        // OTel SDK init requires real Azure Monitor connection string â€” mocked in tests.
        'src/observability/otel.ts',
        // PostHog client self-inits on import â€” integration-tested via mock.
        'src/observability/posthog.ts',
        // OpenAPI build + registry are exercised end-to-end via execSync in
        // tests/openapi-build.test.ts (6 assertions against the real output),
        // but v8 coverage cannot instrument a subprocess invocation.
        'src/openapi/**',
        '**/*.config.*',
        // Cloud-infra singletons â€” require real Cosmos/Firebase credentials;
        // tested indirectly via mocks throughout the integration suite.
        'src/cosmos/client.ts',
        'src/services/firebaseAdmin.ts',
        'src/services/fcm.service.ts',
        'src/services/adminUser.service.ts',
        // Cosmos repositories added in E06-S04/S05 â€” cloud singletons,
        // exercised indirectly via mocks in trigger and service tests.
        'src/cosmos/booking-event-repository.ts',
        'src/cosmos/complaints-repository.ts',
        'src/cosmos/dispatch-attempt-repository.ts',
        'src/cosmos/ssc-levy-repository.ts',
        'src/cosmos/wallet-ledger-repository.ts',
        'src/cosmos/seeds/**',
        // Firebase helpers â€” require real Firebase Storage credentials;
        // mocked in trigger-service-report and active-job tests.
        'src/firebase/admin.ts',
        'src/firebase/booking-event.ts',
        // Function handlers requiring end-to-end Azure Functions runtime.
        'src/functions/dispatch-attempt.ts',
        // Schema route files with zero coverage â€” no test suite for these routes yet.
        'src/cosmos/catalogue.ts',
        'src/cosmos/complaints.ts',
        'src/cosmos/report.ts',
        'src/cosmos/ssc-levy.ts',
        'src/cosmos/wallet-ledger.ts',
        // Zod schema files with no test coverage yet (added E06-S04/S05).
        'src/schemas/booking-event.ts',
        'src/schemas/dispatch-attempt.ts',
        'src/schemas/report.ts',
        'src/schemas/ssc-levy.ts',
        'src/schemas/wallet-ledger.ts',
        // Azure Form Recognizer singleton â€” requires real Azure AI credentials.
        'src/services/formRecognizer.service.ts',
        // DigiLocker OAuth2 service â€” always mocked in KYC tests;
        // requires real DigiLocker API credentials to exercise directly.
        'src/services/digilocker.service.ts',
        // SSC levy service cloud functions â€” Cosmos + FCM require real credentials;
        // pure helper functions (getPriorQuarter, quarterBounds, computeLevyAmount)
        // are covered by the ssc-levy function test suite via the service mock.
        'src/services/ssc-levy.service.ts',
        // DPDP cascade modules added in E10-S05 â€” cloud singletons; exercised
        // indirectly via mocks in users-data-export, users-erasure-request,
        // admin-erasure-{execute,deny}, erasure-cron, and dpdp-data-inventory tests.
        'src/cosmos/erasure-request-repository.ts',
        'src/cosmos/user-data-export-reads.ts',
        'src/cosmos/user-data-cascade-writes.ts',
        'src/services/erasureCascade.service.ts',
        'src/services/userRole.service.ts',
        // DPDP function entry points â€” Azure Functions runtime registration
        // around thin handlers; the action handlers are unit-tested directly.
        'src/functions/admin/erasure-requests/list.ts',
        'src/functions/admin/erasure-requests/patch.ts',
        'src/functions/users-data-export.ts',
        'src/functions/trigger-erasure-deadline.ts',
        // Type-only declarations â€” zero executable statements.
        'src/types/**',
        // E16-S04: pure constant table (list of catalogue service IDs). Tested
        // indirectly via waitlist.test.ts (UNKNOWN_SERVICE path) and the seed
        // suite, but coverage tool can't instrument a static array.
        'src/data/catalogue-ids.ts',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        // Functions threshold lowered to 79% on 2026-05-18 because the merge of
        // E11-S05b-2 (SOS) + E17-S02 (location) + E16-S04 (waitlist) accumulated
        // a handful of pre-existing untested admin handlers (admin/customers/*,
        // admin/technicians/*, admin/wallet/*) just over the 80% line. The drop
        // is 0.15%. Restore to 80% once a dedicated coverage-cleanup story lands
        // (tracked in docs/launch-readiness.md Â§1c).
        functions: 79,
        statements: 80,
      },
    },
  },
});
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "rootDir": ".",
    "types": ["node"]
  },
  "include": ["src/**/*", "tests/**/*"]
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/tsconfig.json' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 2025ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Path 'technician-app/app/src/main/kotlin/com/homeservices/technician/data' -Recurse -Include '*.kt' | Select-String -Pattern 'data class .*Dto|@JsonClass|Response<|ResponseBody' | Select-Object -First 200 | ForEach-Object { \"{0}:{1}: {2}\" -f "'$_.Path.Replace((Get-Location).Path+'"'\\',''), "'$_.LineNumber, $_.Line.Trim() }' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3522ms:
technician-app\app\src\main\kotlin\com\homeservices\technician\data\activeJob\dto\PostLocationRequest.kt:6: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\activeJob\ActiveJobApiService.kt:17: ): Response<ActiveJobResponse>
technician-app\app\src\main\kotlin\com\homeservices\technician\data\activeJob\ActiveJobApiService.kt:24: ): Response<ActiveJobResponse>
technician-app\app\src\main\kotlin\com\homeservices\technician\data\activeJob\ActiveJobApiService.kt:30: ): Response<Unit>
technician-app\app\src\main\kotlin\com\homeservices\technician\data\activeJob\ActiveJobApiService.kt:33: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\activeJob\ActiveJobApiService.kt:48: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\activeJob\ActiveJobApiService.kt:49: internal data class LatLngDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\activeJob\ActiveJobApiService.kt:54: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\activeJob\ActiveJobApiService.kt:55: internal data class LocationAttestationDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\activeJob\ActiveJobApiService.kt:60: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\availability\remote\dto\AvailabilityDtos.kt:7: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\availability\remote\dto\AvailabilityDtos.kt:8: internal data class AvailabilityWindowDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\availability\remote\dto\AvailabilityDtos.kt:21: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\availability\remote\dto\AvailabilityDtos.kt:22: internal data class TechnicianAvailabilityDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\availability\remote\dto\AvailabilityDtos.kt:35: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\availability\remote\dto\AvailabilityDtos.kt:36: internal data class UpdateAvailabilityRequestDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\complaint\remote\dto\ComplaintDtos.kt:5: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\complaint\remote\dto\ComplaintDtos.kt:6: public data class CreateComplaintRequestDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\complaint\remote\dto\ComplaintDtos.kt:13: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\complaint\remote\dto\ComplaintDtos.kt:14: public data class ComplaintResponseDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\complaint\remote\dto\ComplaintDtos.kt:24: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\complaint\remote\dto\ComplaintDtos.kt:25: public data class ComplaintListResponseDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:14: ): Response<Unit>
technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:19: ): Response<Unit>
technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:22: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\earnings\remote\dto\EarningsDtos.kt:5: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\earnings\remote\dto\EarningsDtos.kt:6: public data class EarningsPeriodDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\earnings\remote\dto\EarningsDtos.kt:11: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\earnings\remote\dto\EarningsDtos.kt:12: public data class MonthEarningsPeriodDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\earnings\remote\dto\EarningsDtos.kt:18: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\earnings\remote\dto\EarningsDtos.kt:19: public data class DailyEarningsDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\earnings\remote\dto\EarningsDtos.kt:25: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\earnings\remote\dto\EarningsDtos.kt:26: public data class EarningsResponseDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\erasure\remote\ErasureApiService.kt:12: ): Response<ErasureSubmitResponseBody>
technician-app\app\src\main\kotlin\com\homeservices\technician\data\erasure\remote\ErasureApiService.kt:15: public suspend fun revokeErasureRequest(): Response<Unit>
technician-app\app\src\main\kotlin\com\homeservices\technician\data\erasure\remote\ErasureApiService.kt:23: public data class ErasureSubmitResponseBody(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\integrity\IntegrityApiService.kt:11: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\integrity\IntegrityApiService.kt:12: public data class IntegrityNonceResponseDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\jobOffer\JobOfferApiService.kt:13: ): Response<Unit>
technician-app\app\src\main\kotlin\com\homeservices\technician\data\jobOffer\JobOfferApiService.kt:18: ): Response<Unit>
technician-app\app\src\main\kotlin\com\homeservices\technician\data\jobOffer\JobOfferApiService.kt:23: ): Response<Unit>
technician-app\app\src\main\kotlin\com\homeservices\technician\data\jobOffer\JobOfferApiService.kt:26: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\jobs\remote\dto\TechnicianBookingDtos.kt:7: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\jobs\remote\dto\TechnicianBookingDtos.kt:8: internal data class TechnicianBookingsResponseDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\jobs\remote\dto\TechnicianBookingDtos.kt:12: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\jobs\remote\dto\TechnicianBookingDtos.kt:13: internal data class TechnicianBookingDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\kyc\KycRepositoryImpl.kt:31: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\kyc\KycRepositoryImpl.kt:37: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\kyc\KycRepositoryImpl.kt:44: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\kyc\KycRepositoryImpl.kt:49: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\kyc\KycRepositoryImpl.kt:55: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\payout\remote\dto\PayoutDtos.kt:5: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\payout\remote\dto\PayoutDtos.kt:6: public data class UpdatePayoutCadenceRequestDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\payout\remote\dto\PayoutDtos.kt:10: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\payout\remote\dto\PayoutDtos.kt:11: public data class UpdatePayoutCadenceResponseDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\photo\PhotoApiService.kt:14: ): Response<Unit>
technician-app\app\src\main\kotlin\com\homeservices\technician\data\photo\PhotoApiService.kt:17: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\dto\RatingDtos.kt:11: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\dto\RatingDtos.kt:12: public data class SubmitRatingRequestDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\dto\RatingDtos.kt:20: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\dto\RatingDtos.kt:21: public data class SidePayloadDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\dto\RatingDtos.kt:29: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\dto\RatingDtos.kt:30: public data class GetRatingResponseDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\dto\TechRatingDtos.kt:9: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\dto\TechRatingDtos.kt:10: public data class ReceivedRatingDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\dto\TechRatingDtos.kt:19: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\dto\TechRatingDtos.kt:20: public data class RatingWeekTrendDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\dto\TechRatingDtos.kt:26: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\dto\TechRatingDtos.kt:27: public data class AverageSubScoresDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\dto\TechRatingDtos.kt:33: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\rating\remote\dto\TechRatingDtos.kt:34: public data class TechRatingSummaryDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\serviceprofile\remote\dto\ServiceProfileDtos.kt:8: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\serviceprofile\remote\dto\ServiceProfileDtos.kt:9: internal data class ServiceLocationDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\serviceprofile\remote\dto\ServiceProfileDtos.kt:20: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\serviceprofile\remote\dto\ServiceProfileDtos.kt:21: internal data class ServiceProfileDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\serviceprofile\remote\dto\ServiceProfileDtos.kt:32: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\serviceprofile\remote\dto\ServiceProfileDtos.kt:33: internal data class UpdateServiceProfileRequestDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\shield\remote\dto\ShieldDtos.kt:5: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\shield\remote\dto\ShieldDtos.kt:6: public data class ShieldReportRequestDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\shield\remote\dto\ShieldDtos.kt:11: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\shield\remote\dto\ShieldDtos.kt:12: public data class ShieldReportResponseDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\shield\remote\dto\ShieldDtos.kt:16: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\shield\remote\dto\ShieldDtos.kt:17: public data class RatingAppealRequestDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\shield\remote\dto\ShieldDtos.kt:22: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\shield\remote\dto\ShieldDtos.kt:23: public data class RatingAppealResponseDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\shield\remote\dto\ShieldDtos.kt:27: @JsonClass(generateAdapter = true)
technician-app\app\src\main\kotlin\com\homeservices\technician\data\shield\remote\dto\ShieldDtos.kt:28: public data class AppealQuotaErrorDto(
technician-app\app\src\main\kotlin\com\homeservices\technician\data\shield\remote\ShieldApiService.kt:15: ): Response<ShieldReportResponseDto>
technician-app\app\src\main\kotlin\com\homeservices\technician\data\shield\remote\ShieldApiService.kt:20: ): Response<RatingAppealResponseDto>

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content technician-app/app/proguard-rules.pro' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1501ms:
# Truecaller SDK
-keep class com.truecaller.android.sdk.** { *; }
-dontwarn com.truecaller.android.sdk.**

# Firebase Auth
-keep class com.google.firebase.auth.** { *; }
-dontwarn com.google.firebase.auth.**

# Security-crypto (EncryptedSharedPreferences)
-keep class androidx.security.crypto.** { *; }

# Credential Manager + Google Identity Library
-keep class androidx.credentials.** { *; }
-keep class com.google.android.libraries.identity.googleid.** { *; }
-keep class com.google.firebase.auth.GoogleAuthProvider { *; }
-keep class com.google.firebase.auth.FirebaseAuthUserCollisionException { *; }

# Razorpay SDK (mirrored for safety â€” technician-app does not process payments)
-keep class com.razorpay.** { *; }
-keep class proguard.annotation.** { *; }
-keepattributes JavascriptInterface
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }
-dontwarn com.razorpay.**

# Google Maps + Places SDK
-keep class com.google.android.gms.maps.** { *; }
-keep class com.google.android.libraries.places.** { *; }
-dontwarn com.google.android.gms.**
-dontwarn com.google.android.libraries.places.**

# Google Maps Compose
-keep class com.google.maps.android.** { *; }

# Moshi + Kotlin codegen
-keep @com.squareup.moshi.JsonClass class * { *; }
-keep class * extends com.squareup.moshi.JsonAdapter { *; }
-keepclassmembers class * { @com.squareup.moshi.Json <fields>; }

# Coil image loading
-dontwarn coil.**

# Play Integrity (already has reflection via SDK)
-keep class com.google.android.play.core.integrity.** { *; }
-dontwarn com.google.android.play.core.integrity.**

# OkHttp / Retrofit
-dontwarn okhttp3.**
-dontwarn retrofit2.**
# Retrofit services are instantiated through dynamic proxies. Keep the app's
# service interfaces and members so release shrinking cannot remove or rewrite
# methods that Retrofit needs to inspect at runtime.
-keep,allowobfuscation interface com.homeservices.technician.**.*ApiService { *; }

# Sentry
-dontwarn io.sentry.**

# Keepattributes for reflection
-keepattributes Signature
-keepattributes *Annotation*

# GrowthBook SDK
-keep class com.sdk.growthbook.** { *; }
-dontwarn com.sdk.growthbook.**

# E11-S04 dashboard (Hilt ViewModel + Compose internals)
-keep class com.homeservices.technician.ui.dashboard.TechnicianDashboardViewModel { *; }
-keep class com.homeservices.technician.ui.dashboard.PendingActionCard { *; }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/schemas/technician.ts -TotalCount 220; rg "technicianId" api/src -n | Select-Object -First 200' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1873ms:
import { z } from 'zod';

export const GeoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
});

export const AvailabilityWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
});

export const TechnicianKycStatusSchema = z.enum(['APPROVED', 'PENDING', 'REJECTED']);

export const TechnicianProfileSchema = z.object({
  id: z.string().min(1),
  technicianId: z.string().min(1),
  location: GeoPointSchema,
  skills: z.array(z.string().min(1)).min(1),
  availabilityWindows: z.array(AvailabilityWindowSchema),
  isOnline: z.boolean(),
  isAvailable: z.boolean(),
  kycStatus: TechnicianKycStatusSchema,
  fcmToken: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  completedJobCount: z.number().int().min(0).optional(),
  updatedAt: z.string().datetime().optional(),
  blockedCustomerIds: z.array(z.string()).optional(),
  payoutCadence: z.enum(['WEEKLY', 'NEXT_DAY', 'INSTANT']).optional(),
  payoutCadenceUpdatedAt: z.string().optional(),
});

export type GeoPoint = z.infer<typeof GeoPointSchema>;
export type AvailabilityWindow = z.infer<typeof AvailabilityWindowSchema>;
export type TechnicianKycStatus = z.infer<typeof TechnicianKycStatusSchema>;
export type TechnicianProfile = z.infer<typeof TechnicianProfileSchema>;
api/src\cosmos\booking-repository.ts:139:                AND (NOT IS_DEFINED(c.technicianId) OR IS_NULL(c.technicianId))`,
api/src\cosmos\booking-repository.ts:155:  async getByTechnicianId(technicianId: string): Promise<BookingDoc[]> {
api/src\cosmos\booking-repository.ts:159:                WHERE c.technicianId = @technicianId
api/src\cosmos\booking-repository.ts:164:        parameters: [{ name: '@technicianId', value: technicianId }],
api/src\cosmos\booking-repository.ts:170:    // scripts/provision-cosmos-indexes.ts). The index covers [/technicianId,
api/src\cosmos\booking-repository.ts:179:  async hasActiveBookingForTechnician(technicianId: string): Promise<boolean> {
api/src\cosmos\booking-repository.ts:183:                WHERE c.technicianId = @technicianId
api/src\cosmos\booking-repository.ts:185:        parameters: [{ name: '@technicianId', value: technicianId }],
api/src\cosmos\booking-repository.ts:311:export async function getActiveBookingCountForTechnician(technicianId: string): Promise<number> {
api/src\cosmos\booking-repository.ts:315:              WHERE c.technicianId = @technicianId
api/src\cosmos\booking-repository.ts:317:      parameters: [{ name: '@technicianId', value: technicianId }],
api/src\cosmos\booking-repository.ts:331:    date: string; serviceId: string; technicianId: string; status: string;
api/src\cosmos\booking-repository.ts:339:      technicianId: string; status: string; addressText: string;
api/src\cosmos\booking-repository.ts:340:    }>(`SELECT c.customerId, c.slotDate, c.serviceId, c.technicianId,
api/src\cosmos\booking-repository.ts:366:        technicianId: r.technicianId ?? '',
api/src\cosmos\complaints-repository.ts:145:): Promise<Array<{ technicianId: string; count: number }>> {
api/src\cosmos\complaints-repository.ts:163:    counts.set(doc.technicianId, (counts.get(doc.technicianId) ?? 0) + 1);
api/src\cosmos\complaints-repository.ts:168:    .map(([technicianId, count]) => ({ technicianId, count }));
api/src\cosmos\complaints-repository.ts:171:// SEMGREP-JUSTIFIED: cross-partition query; technicianId and bookingId are caller-validated
api/src\cosmos\complaints-repository.ts:174:  technicianId: string,
api/src\cosmos\complaints-repository.ts:181:      query: `SELECT TOP 1 * FROM c WHERE c.technicianId = @uid AND c.orderId = @bookingId AND c.type = @type`,
api/src\cosmos\complaints-repository.ts:183:        { name: '@uid', value: technicianId },
api/src\cosmos\complaints-repository.ts:193:// SEMGREP-JUSTIFIED: cross-partition query; technicianId is the authenticated tech's own uid
api/src\cosmos\complaints-repository.ts:196:  technicianId: string,
api/src\cosmos\complaints-repository.ts:203:      query: `SELECT VALUE COUNT(1) FROM c WHERE c.technicianId = @uid AND c.type = @type AND c.createdAt >= @monthStart`,
api/src\cosmos\complaints-repository.ts:205:        { name: '@uid', value: technicianId },
api/src\cosmos\complaints-repository.ts:249:            AND (c.customerId = @uid OR c.technicianId = @uid)
api/src\cosmos\complaints-repository.ts:275:            AND (c.customerId = @uid OR c.technicianId = @uid)
api/src\functions\active-job-location.ts:25:  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
api/src\functions\active-job-location.ts:49:      scope.setExtras({ bookingId, technicianId: uid });
api/src\functions\active-job-location.ts:57:    technicianId: uid,
api/src\functions\active-job-photos.ts:73:  if (booking.technicianId !== uid) {
api/src\functions\active-job.ts:47:  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
api/src\functions\active-job.ts:78:  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
api/src\functions\active-job.ts:104:      scope.setExtras({ bookingId, technicianId: uid, gpsAccuracyM: body.attestation!.gpsAccuracyM });
api/src\functions\active-job.ts:118:    technicianId: uid,
api/src\functions\admin\complaints\create.ts:35:    technicianId: parsed.data.technicianId,
api/src\functions\admin\complaints\sla-timer.ts:53:        payload: { technicianId: complaint.technicianId, orderId: complaint.orderId },
api/src\functions\admin\complaints\patch.ts:125:      sendAppealDecisionPush(existing.technicianId, {
api/src\functions\admin\complaints\patch.ts:143:      payload: { decision, technicianId: existing.technicianId, bookingId: existing.orderId },
api/src\functions\admin\sos\get-incident.ts:21:      technicianId: booking.technicianId,
api/src\functions\admin\finance\approve-payouts.ts:37:  const errors: Array<{ technicianId: string; reason: string }> = [];
api/src\functions\admin\finance\approve-payouts.ts:41:    const cadence = await getTechnicianPayoutCadence(entry.technicianId);
api/src\functions\admin\finance\approve-payouts.ts:47:    const existing = await getLedgerTransfer(entry.technicianId, weekStart);
api/src\functions\admin\finance\approve-payouts.ts:55:      errors.push({ technicianId: entry.technicianId, reason: 'netPayable must be positive' });
api/src\functions\admin\finance\approve-payouts.ts:59:    const accountId = await getTechnicianLinkedAccount(entry.technicianId);
api/src\functions\admin\finance\approve-payouts.ts:62:      errors.push({ technicianId: entry.technicianId, reason: 'no linked Razorpay account' });
api/src\functions\admin\finance\approve-payouts.ts:70:        notes: { weekStart, technicianId: entry.technicianId, technicianName: entry.technicianName },
api/src\functions\admin\finance\approve-payouts.ts:71:        idempotencyKey: `${entry.technicianId}-${weekStart}`,
api/src\functions\admin\finance\approve-payouts.ts:74:        technicianId: entry.technicianId,
api/src\functions\admin\finance\approve-payouts.ts:84:        technicianId: entry.technicianId,
api/src\schemas\dashboard.ts:13:    technicianId: z.string().optional(),
api/src\schemas\dashboard.ts:39:    technicianId: z.string(),
api/src\schemas\complaint.ts:50:  technicianId: z.string(),
api/src\schemas\complaint.ts:76:  technicianId: z.string(),
api/src\schemas\complaint.ts:125:  technicianId: z.string(),
api/src\functions\admin\customers\list.ts:59:        techName: b.technicianId,
api/src\schemas\booking-event.ts:7:  technicianId: z.string().optional(),
api/src\schemas\order.ts:24:  technicianId: z.string().optional(),
api/src\schemas\order.ts:47:  technicianId: z.string().optional(),
api/src\schemas\order.ts:66:  technicianId: z.string(),
api/src\schemas\order-overrides.ts:4:  technicianId: z.string().min(1),
api/src\schemas\live-location.ts:19:  technicianId: string;
api/src\schemas\booking.ts:40:  technicianId: z.string().optional(),
api/src\schemas\booking.ts:52:  /** The technician who no-showed. Preserved separately so the exclusion filter works across timer recovery runs even after technicianId is cleared. */
api/src\functions\admin\dashboard\tech-locations.ts:10:  technicianId?: string;
api/src\functions\admin\dashboard\tech-locations.ts:29:    technicianId: doc.technicianId ?? doc.id ?? 'unknown',
api/src\functions\admin\dashboard\tech-locations.ts:51:          'SELECT c.id, c.technicianId, c.displayName, c.name, c.serviceType, c.skills, c.lat, c.lng, c.location, c.state, c.isAvailable, c.updatedAt FROM c WHERE c.isOnline = true AND (NOT IS_DEFINED(c.suspended) OR c.suspended = false)',
api/src\schemas\kyc.ts:30:  technicianId: z.string().min(1),
api/src\schemas\kyc.ts:42:  technicianId: z.string().min(1),
api/src\schemas\kyc.ts:52:  technicianId: z.string(),
api/src\schemas\finance.ts:39:  technicianId: z.string().min(1),
api/src\schemas\finance.ts:63:  technicianId: z.string().min(1),
api/src\schemas\wallet-ledger.ts:12:  technicianId: z.string(),
api/src\schemas\wallet-ledger.ts:33:  technicianId: string;
api/src\schemas\technician.ts:18:  technicianId: z.string().min(1),
api/src\schemas\rating.ts:36:  technicianId: z.string(),
api/src\schemas\dispatch-attempt.ts:8:  technicianIds: z.array(z.string()),
api/src\schemas\pendingActions.ts:57:   * schema churn (bookingId, technicianId, addonTotal, etc.).
api/src\functions\admin\orders\list.ts:17:    'status', 'city', 'categoryId', 'technicianId', 'customerPhone',
api/src\functions\admin\orders\overrides.ts:39:  const updated = await updateBookingFields(id, { technicianId: parsed.data.technicianId });
api/src\functions\admin\orders\overrides.ts:52:    payload: { technicianId: parsed.data.technicianId, reason: parsed.data.reason },
api/src\services\dataExport.service.ts:61:    ...(callerRole === 'TECHNICIAN' ? { technicianId: b['technicianId'] } : {}),
api/src\services\dispatcher.service.ts:62:    ...(booking.technicianId ? [booking.technicianId] : []),
api/src\services\dispatcher.service.ts:69:    .filter((t) => !excluded.has(t.id) && !excluded.has(t.technicianId))
api/src\services\dispatcher.service.ts:86:  const selectedTechnicianId = selected.technicianId || selected.id;
api/src\services\dispatcher.service.ts:93:    technicianIds: [selectedTechnicianId],
api/src\services\dispatcher.service.ts:137:  console.log(`DISPATCH_SENT bookingId=${bookingId} technicianIds=${selectedTechnicianId}`);
api/src\services\dispatcher.service.ts:171:    // Merge the caller-supplied exclusion so redispatch works even when technicianId was
api/src\services\dispatcher.service.ts:174:      ? { ...booking, technicianId: excludeTechnicianId }
api/src\cosmos\wallet-ledger-repository.ts:5:  async getByBookingId(bookingId: string, technicianId: string): Promise<WalletLedgerEntry | null> {
api/src\cosmos\wallet-ledger-repository.ts:7:      .item(bookingId, technicianId)
api/src\cosmos\wallet-ledger-repository.ts:17:        technicianId: input.technicianId,
api/src\cosmos\wallet-ledger-repository.ts:18:        partitionKey: input.technicianId,
api/src\cosmos\wallet-ledger-repository.ts:38:  async markPaid(bookingId: string, technicianId: string, razorpayTransferId: string): Promise<void> {
api/src\cosmos\wallet-ledger-repository.ts:40:      .item(bookingId, technicianId)
api/src\cosmos\wallet-ledger-repository.ts:44:      .item(bookingId, technicianId)
api/src\cosmos\wallet-ledger-repository.ts:54:  async markFailed(bookingId: string, technicianId: string, failureReason: string): Promise<void> {
api/src\cosmos\wallet-ledger-repository.ts:56:      .item(bookingId, technicianId)
api/src\cosmos\wallet-ledger-repository.ts:60:      .item(bookingId, technicianId)
api/src\cosmos\wallet-ledger-repository.ts:89:  async getPendingHeldByTechnicianId(technicianId: string): Promise<WalletLedgerEntry[]> {
api/src\cosmos\wallet-ledger-repository.ts:95:        { partitionKey: technicianId },
api/src\cosmos\wallet-ledger-repository.ts:116:  async getAllByTechnicianId(technicianId: string): Promise<WalletLedgerEntry[]> {
api/src\cosmos\wallet-ledger-repository.ts:120:        { partitionKey: technicianId },
api/src\cosmos\indexes\technicians-index.json:2:  "_comment": "Apply via: container.replace({ id: 'technicians', partitionKey: { paths: ['/technicianId'] }, indexingPolicy: <this object> }) or Azure Portal → Data Explorer → technicians → Scale & Settings → Indexing Policy",
api/src\cosmos\user-data-export-reads.ts:48:      query: 'SELECT * FROM c WHERE c.technicianId = @uid',
api/src\cosmos\user-data-export-reads.ts:68:      query: 'SELECT * FROM c WHERE c.technicianId = @uid',
api/src\cosmos\user-data-export-reads.ts:89:        query: 'SELECT * FROM c WHERE c.customerId = @uid OR c.technicianId = @uid',
api/src\cosmos\user-data-export-reads.ts:99:        query: 'SELECT * FROM c WHERE c.technicianId = @uid',
api/src\cosmos\user-data-export-reads.ts:109:        query: 'SELECT * FROM c WHERE c.technicianId = @uid OR c.adminId = @uid',
api/src\cosmos\user-data-export-reads.ts:119:        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(c.technicianIds, @uid)',
api/src\cosmos\finance-repository.ts:7:  technicianId: string;
api/src\cosmos\finance-repository.ts:19:  technicianId: string;
api/src\cosmos\finance-repository.ts:27:  technicianId: string;
api/src\cosmos\finance-repository.ts:41:        query: `SELECT c.id, c.technicianId, c.technicianName, c.amount, c.commissionBps, c.completedAt
api/src\cosmos\finance-repository.ts:88:    const existing = byTech.get(b.technicianId) ?? { name: b.technicianName, jobs: 0, gross: 0, commission: 0 };
api/src\cosmos\finance-repository.ts:89:    byTech.set(b.technicianId, {
api/src\cosmos\finance-repository.ts:100:  for (const [technicianId, { name, jobs, gross, commission }] of byTech.entries()) {
api/src\cosmos\finance-repository.ts:103:    entries.push({ technicianId, technicianName: name, completedJobsThisWeek: jobs, grossEarnings: gross, commissionDeducted: commission, netPayable });
api/src\cosmos\finance-repository.ts:110:export async function getLedgerTransfer(technicianId: string, weekStart: string): Promise<LedgerTransferDoc | null> {
api/src\cosmos\finance-repository.ts:116:        query: `SELECT TOP 1 * FROM c WHERE c.technicianId = @tid AND c.weekStart = @ws AND c.type = 'TRANSFER'`,
api/src\cosmos\finance-repository.ts:118:          { name: '@tid', value: technicianId },
api/src\cosmos\finance-repository.ts:133:      partitionKey: entry.technicianId,
api/src\cosmos\finance-repository.ts:144:export async function getTechnicianLinkedAccount(technicianId: string): Promise<string | null> {
api/src\cosmos\finance-repository.ts:148:    .item(technicianId, technicianId)
api/src\services\fcm.service.ts:58:    // Non-PII fields only in the fallback (no customerId, technicianId).
api/src\services\fcm.service.ts:157:  technicianId: string;
api/src\services\fcm.service.ts:170:  await sendToUserTokens(payload.technicianId, data);
api/src\services\fcm.service.ts:174:  technicianId: string,
api/src\services\fcm.service.ts:177:  await sendToUserTokens(technicianId, {
api/src\services\fcm.service.ts:184:export async function sendRatingPromptTechnicianPush(technicianId: string, bookingId: string): Promise<void> {
api/src\services\fcm.service.ts:185:  await sendToUserTokens(technicianId, { type: 'RATING_PROMPT_TECHNICIAN', bookingId });
api/src\services\fcm.service.ts:189:  technicianId: string,
api/src\services\fcm.service.ts:192:  await sendToUserTokens(technicianId, {
api/src\services\fcm.service.ts:201:  technicianId: string,
api/src\services\fcm.service.ts:204:  await sendToUserTokens(technicianId, {
api/src\services\fcm.service.ts:237: * Rating-shield alert — technicianId kept for owner triage; no customerId.
api/src\services\fcm.service.ts:242:  technicianId: string;
api/src\services\fcm.service.ts:245:  // technicianId retained — required for owner triage action; no customerId exposed.
api/src\services\fcm.service.ts:249:    technicianId: payload.technicianId,
api/src\services\fcm.service.ts:255: * SOS alert — customerId and technicianId trimmed from payload (PII per ADR-0026).
api/src\services\fcm.service.ts:262:  technicianId: string;
api/src\services\fcm.service.ts:265:  // PII trim: customerId and technicianId are NOT included in the FCM payload.
api/src\services\fcm.service.ts:276: * technicianId retained for owner triage.
api/src\services\fcm.service.ts:281:  technicianId: string;
api/src\services\fcm.service.ts:284:  // PII trim: customerId removed. technicianId kept for owner action.
api/src\services\fcm.service.ts:288:    technicianId: payload.technicianId,
api/src\services\fcm.service.ts:293: * Appeal filed — technicianId retained for owner triage.
api/src\services\fcm.service.ts:298:  technicianId: string;
api/src\services\fcm.service.ts:304:    technicianId: payload.technicianId,
api/src\cosmos\orders-repository.ts:99:    technicianId: asString(raw['technicianId']),
api/src\cosmos\orders-repository.ts:133:async function fetchTechnicianNames(technicianIds: string[]): Promise<Map<string, string>> {
api/src\cosmos\orders-repository.ts:135:    const techs = await getTechniciansByIds(technicianIds);
api/src\cosmos\orders-repository.ts:138:      const displayName = tech.displayName?.trim() || tech.name?.trim() || tech.technicianId || tech.id;
api/src\cosmos\orders-repository.ts:140:      if (tech.technicianId) names.set(tech.technicianId, displayName);
api/src\cosmos\orders-repository.ts:181:    fetchTechnicianNames(unique(orders.map((order) => order.technicianId))),
api/src\cosmos\orders-repository.ts:196:      technicianName: order.technicianName ?? (order.technicianId ? technicianNames.get(order.technicianId) : undefined),
api/src\cosmos\orders-repository.ts:222:  if (filters.technicianId) {
api/src\cosmos\orders-repository.ts:223:    conditions.push('c.technicianId = @technicianId');
api/src\cosmos\orders-repository.ts:224:    params.push({ name: '@technicianId', value: filters.technicianId });
api/src\cosmos\rating-repository.ts:7:  technicianId: string;
api/src\cosmos\rating-repository.ts:33:        technicianId: input.technicianId,
api/src\cosmos\rating-repository.ts:97:  // SEMGREP-JUSTIFIED: cross-partition query; technicianId is the authenticated tech's own uid
api/src\cosmos\rating-repository.ts:100:  async getAllByTechnicianId(technicianId: string): Promise<RatingDoc[]> {
api/src\cosmos\rating-repository.ts:104:          query: `SELECT * FROM c WHERE c.technicianId = @uid AND IS_DEFINED(c.customerSubmittedAt)`,
api/src\cosmos\rating-repository.ts:105:          parameters: [{ name: '@uid', value: technicianId }],
api/src\cosmos\dispatch-attempt-repository.ts:20:      .query<Pick<DispatchAttemptDoc, 'technicianIds'>>({
api/src\cosmos\dispatch-attempt-repository.ts:21:        query: 'SELECT c.technicianIds FROM c WHERE c.bookingId = @bookingId',
api/src\cosmos\dispatch-attempt-repository.ts:25:    return [...new Set(resources.flatMap((attempt) => attempt.technicianIds))];
api/src\cosmos\dispatch-attempt-repository.ts:38:      technicianIds: resource.technicianIds,
api/src\cosmos\dispatch-attempt-repository.ts:67:      technicianIds: resource.technicianIds,
api/src\services\kycAudit.service.ts:8:  technicianId: string,
api/src\services\kycAudit.service.ts:20:      resourceId: technicianId,
api/src\cosmos\user-data-cascade-writes.ts:52:        query: 'SELECT * FROM c WHERE c.customerId = @uid OR c.technicianId = @uid',
api/src\cosmos\user-data-cascade-writes.ts:60:      if (r['technicianId'] === uid) updated['technicianId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
api/src\cosmos\user-data-cascade-writes.ts:81:        query: 'SELECT * FROM c WHERE c.customerId = @uid OR c.technicianId = @uid',
api/src\cosmos\user-data-cascade-writes.ts:89:      if (r['technicianId'] === uid) updated['technicianId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
api/src\cosmos\user-data-cascade-writes.ts:103:        query: 'SELECT * FROM c WHERE c.customerId = @uid OR c.technicianId = @uid',
api/src\cosmos\user-data-cascade-writes.ts:111:      if (r['technicianId'] === uid) updated['technicianId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
api/src\cosmos\user-data-cascade-writes.ts:124:   * Anonymize technicianId only; do NOT delete entries.
api/src\cosmos\user-data-cascade-writes.ts:126:   * Partition key changes from `technicianId = uid` to `technicianId = hash`,
api/src\cosmos\user-data-cascade-writes.ts:134:        query: 'SELECT * FROM c WHERE c.technicianId = @uid',
api/src\cosmos\user-data-cascade-writes.ts:143:        technicianId: anonId,
api/src\cosmos\user-data-cascade-writes.ts:168:        query: 'SELECT * FROM c WHERE c.technicianId = @uid OR c.adminId = @uid',
api/src\cosmos\user-data-cascade-writes.ts:176:      if (r['technicianId'] === uid) updated['technicianId'] = anonId;
api/src\cosmos\user-data-cascade-writes.ts:189:        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(c.technicianIds, @uid)',
api/src\cosmos\user-data-cascade-writes.ts:196:      const ids = r['technicianIds'] as string[];
api/src\cosmos\user-data-cascade-writes.ts:199:        technicianIds: ids.map((t) => (t === uid ? anonId : t)),
api/src\cosmos\technician-repository.ts:17:  technicianId: string,
api/src\cosmos\technician-repository.ts:22:  const { resource } = await container.item(technicianId, technicianId).read<TechnicianDoc>();
api/src\cosmos\technician-repository.ts:23:  const existing: TechnicianDoc = resource ?? { id: technicianId };
api/src\cosmos\technician-repository.ts:42:  technicianId: string
api/src\cosmos\technician-repository.ts:46:  const { resource } = await container.item(technicianId, technicianId).read<TechnicianDoc>();
api/src\cosmos\technician-repository.ts:104:export async function getTechnicianAvailability(technicianId: string): Promise<TechnicianAvailability> {
api/src\cosmos\technician-repository.ts:107:  const { resource } = await container.item(technicianId, technicianId).read<Partial<TechnicianProfile> & Record<string, unknown>>();
api/src\cosmos\technician-repository.ts:112:  technicianId: string,
api/src\cosmos\technician-repository.ts:117:  const { resource } = await container.item(technicianId, technicianId).read<Record<string, unknown>>();
api/src\cosmos\technician-repository.ts:120:    ...(resource ?? { id: technicianId, technicianId }),
api/src\cosmos\technician-repository.ts:121:    id: technicianId,
api/src\cosmos\technician-repository.ts:122:    technicianId: (resource?.technicianId as string | undefined) ?? technicianId,

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/cosmos/booking-repository.ts -Tail 130' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1597ms:
    const { resource: existing, etag } = await getBookingsContainer()
      .item(bookingId, bookingId)
      .read<BookingDoc>();
    if (!existing) return null;
    const stagePhotos = existing.photos?.[stage] ?? [];
    const updated: BookingDoc = {
      ...existing,
      photos: { ...existing.photos, [stage]: [...stagePhotos, photoUrl] },
    };
    // Use ETag optimistic concurrency so concurrent uploads for the same
    // booking/stage don't silently drop each other's photo URL.
    const { resource } = await getBookingsContainer()
      .item(bookingId, bookingId)
      .replace<BookingDoc>(updated, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });
    return resource ?? null;
  },

  async markSosActivated(id: string): Promise<BookingDoc | null> {
    const { resource: existing, etag } = await getBookingsContainer().item(id, id).read<BookingDoc>();
    if (!existing) return null;
    if (existing.sosActivatedAt) return existing; // already activated â€” concurrent request lost the race
    const updated: BookingDoc = { ...existing, sosActivatedAt: new Date().toISOString() };
    try {
      const { resource } = await getBookingsContainer()
        .item(id, id)
        .replace<BookingDoc>(updated, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });
      return resource ?? null;
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: number }).code === 412) {
        return null; // lost ETag race â€” caller handles as already-activated
      }
      throw e;
    }
  },

  // E16-S02: Returns slotWindow strings for all active (non-cancelled/unfulfilled) bookings
  // for a given service on a given date. Used by the availability handler to mark slots
  // as hard-booked. Cross-partition scan â€” acceptable at pilot scale (â‰¤5,000 bookings/mo).
  async getBookedWindowsByServiceDate(serviceId: string, date: string): Promise<string[]> {
    const { resources } = await getBookingsContainer()
      .items.query<{ slotWindow: string }>({
        query: `SELECT c.slotWindow FROM c
                WHERE c.serviceId = @serviceId
                  AND c.slotDate = @date
                  AND c.status NOT IN ('CUSTOMER_CANCELLED', 'UNFULFILLED')`,
        parameters: [
          { name: '@serviceId', value: serviceId },
          { name: '@date', value: date },
        ],
      })
      .fetchAll();
    return resources.map((r) => r.slotWindow);
  },
};

export async function updateBookingFields(
  id: string,
  fields: Partial<BookingDoc>,
): Promise<BookingDoc | null> {
  const existing = await bookingRepo.getById(id);
  if (!existing) return null;
  const updated: BookingDoc = { ...existing, ...fields };
  const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
  return resource ?? null;
}

// â”€â”€ Admin roster helpers (E09-S07a) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getActiveBookingCountForTechnician(technicianId: string): Promise<number> {
  const { resources } = await getBookingsContainer()
    .items.query<number>({
      query: `SELECT VALUE COUNT(1) FROM c
              WHERE c.technicianId = @technicianId
                AND c.status IN ('ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL')`,
      parameters: [{ name: '@technicianId', value: technicianId }],
    })
    .fetchAll();
  return resources[0] ?? 0;
}

// â”€â”€ Customer roster helpers (E09-S07a A4) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface CustomerBookingSummary {
  customerId: string;
  bookingCount: number;
  lastBookingDate?: string;
  lastCity?: string;
  recentBookings: Array<{
    date: string; serviceId: string; technicianId: string; status: string;
  }>;
}

export async function getCustomerSummaries(): Promise<CustomerBookingSummary[]> {
  const { resources } = await getBookingsContainer()
    .items.query<{
      customerId: string; slotDate: string; serviceId: string;
      technicianId: string; status: string; addressText: string;
    }>(`SELECT c.customerId, c.slotDate, c.serviceId, c.technicianId,
              c.status, c.addressText
        FROM c`)
    .fetchAll();

  const map = new Map<string, CustomerBookingSummary>();
  for (const r of resources) {
    const cid = r.customerId;
    if (!cid) continue;
    if (!map.has(cid)) {
      const rawCity = typeof r.addressText === 'string' ? r.addressText.split(',').pop()?.trim() : undefined;
      const entry: CustomerBookingSummary = {
        customerId: cid,
        bookingCount: 0,
        recentBookings: [],
      };
      if (r.slotDate) entry.lastBookingDate = r.slotDate;
      if (rawCity) entry.lastCity = rawCity;
      map.set(cid, entry);
    }
    const entry = map.get(cid)!;
    entry.bookingCount++;
    if (entry.recentBookings.length < 5) {
      entry.recentBookings.push({
        date: r.slotDate,
        serviceId: r.serviceId,
        technicianId: r.technicianId ?? '',
        status: r.status,
      });
    }
  }
  return [...map.values()];
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/tests/unit/users-erasure-request.test.ts -TotalCount 240' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3530ms:
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, InvocationContext, type HttpResponseInit } from '@azure/functions';

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));

vi.mock('../../src/services/userRole.service.js', () => ({
  inferUserRole: vi.fn().mockResolvedValue('CUSTOMER'),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { hasActiveBookingForTechnician: vi.fn().mockResolvedValue(false) },
}));

vi.mock('../../src/cosmos/erasure-request-repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/cosmos/erasure-request-repository.js')>();
  return {
    ...actual,
    createErasureRequest: vi.fn(),
    getErasureRequestById: vi.fn(),
    getPendingErasureRequestForUser: vi.fn(),
    getActiveErasureRequestForUser: vi.fn(),
    replaceErasureRequest: vi.fn(),
  };
});

vi.mock('../../src/services/auditLog.service.js', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));

type MockFn = ReturnType<typeof vi.fn>;

function makePost(body: unknown, withAuth = true): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/users/me/erasure-request',
    method: 'POST',
    headers: withAuth ? { authorization: 'Bearer test-token' } : {},
    body: { string: JSON.stringify(body) },
  });
}

function makeDelete(withAuth = true): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/users/me/erasure-request',
    method: 'DELETE',
    headers: withAuth ? { authorization: 'Bearer test-token' } : {},
  });
}

describe('POST /v1/users/me/erasure-request', () => {
  let submitHandler: typeof import('../../src/functions/users-erasure-request.js').submitErasureRequestHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/users-erasure-request.js');
    submitHandler = mod.submitErasureRequestHandler;
  });

  it('returns 401 without Authorization', async () => {
    const res = (await submitHandler(
      makePost({ confirmationPhrase: 'DELETE MY ACCOUNT' }, false),
      new InvocationContext(),
    )) as HttpResponseInit;
    expect(res.status).toBe(401);
  });

  it('returns 400 when confirmationPhrase is missing', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });

    const res = (await submitHandler(
      makePost({}),
      new InvocationContext(),
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when confirmationPhrase is wrong (defends against accidental deletion)', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });

    const res = (await submitHandler(
      makePost({ confirmationPhrase: 'delete my account' }),
      new InvocationContext(),
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
  });

  it('returns 400 when confirmationPhrase is "DELETE" alone', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });

    const res = (await submitHandler(
      makePost({ confirmationPhrase: 'DELETE' }),
      new InvocationContext(),
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
  });

  it('returns 409 when a PENDING erasure request already exists for the user', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });

    // Simulate concurrent submit: createErasureRequest throws DuplicatePendingError
    (repo.createErasureRequest as MockFn).mockRejectedValue(new repo.DuplicatePendingError());
    (repo.getActiveErasureRequestForUser as MockFn).mockResolvedValue({
      doc: {
        id: 'pending:cust-1',
        partitionKey: 'pending:cust-1',
        userId: 'cust-1',
        userRole: 'CUSTOMER',
        status: 'PENDING',
        requestedAt: '2026-04-25T00:00:00.000Z',
        scheduledDeletionAt: '2026-05-02T00:00:00.000Z',
        anonymizationSalt: 'salt-1234567890abcd',
      },
      etag: '"etag-abc"',
    });

    const res = (await submitHandler(
      makePost({ confirmationPhrase: 'DELETE MY ACCOUNT' }),
      new InvocationContext(),
    )) as HttpResponseInit;
    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('ERASURE_REQUEST_PENDING');
  });

  it('returns 201 with erasureId "pending:{uid}" and scheduledDeletionAt 7 days out', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });
    (repo.createErasureRequest as MockFn).mockResolvedValue(undefined);

    const before = Date.now();
    const res = (await submitHandler(
      makePost({ confirmationPhrase: 'DELETE MY ACCOUNT', reason: 'no longer using' }),
      new InvocationContext(),
    )) as HttpResponseInit;
    const after = Date.now();

    expect(res.status).toBe(201);
    const body = res.jsonBody as { erasureId: string; scheduledDeletionAt: string; status: string };
    expect(body.erasureId).toBe('pending:cust-1');
    expect(body.status).toBe('PENDING');
    const scheduled = Date.parse(body.scheduledDeletionAt);
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    expect(scheduled).toBeGreaterThanOrEqual(before + SEVEN_DAYS - 5_000);
    expect(scheduled).toBeLessThanOrEqual(after + SEVEN_DAYS + 5_000);

    // Persisted with PENDING status + per-request salt for irreversible anonymization
    const created = (repo.createErasureRequest as MockFn).mock.calls[0]![0] as Record<string, unknown>;
    expect(created['status']).toBe('PENDING');
    expect(created['id']).toBe('pending:cust-1');
    expect(created['userId']).toBe('cust-1');
    expect(typeof created['anonymizationSalt']).toBe('string');
    expect((created['anonymizationSalt'] as string).length).toBeGreaterThanOrEqual(16);
    expect(created['reason']).toBe('no longer using');
  });

  it('writes ERASURE_REQUESTED audit log entry', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    const auditService = await import('../../src/services/auditLog.service.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });
    (repo.createErasureRequest as MockFn).mockResolvedValue(undefined);

    await submitHandler(
      makePost({ confirmationPhrase: 'DELETE MY ACCOUNT', reason: 'r' }),
      new InvocationContext(),
    );

    expect(auditService.auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'cust-1', role: 'system' }),
      'ERASURE_REQUESTED',
      'user',
      'cust-1',
      expect.any(Object),
    );
  });
});

describe('DELETE /v1/users/me/erasure-request', () => {
  let revokeHandler: typeof import('../../src/functions/users-erasure-request.js').revokeErasureRequestHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/users-erasure-request.js');
    revokeHandler = mod.revokeErasureRequestHandler;
  });

  it('returns 401 without Authorization', async () => {
    const res = (await revokeHandler(makeDelete(false), new InvocationContext())) as HttpResponseInit;
    expect(res.status).toBe(401);
  });

  it('returns 404 when no PENDING request exists', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });
    (repo.getActiveErasureRequestForUser as MockFn).mockResolvedValue(null);

    const res = (await revokeHandler(makeDelete(), new InvocationContext())) as HttpResponseInit;
    expect(res.status).toBe(404);
  });

  it('returns 204 and marks request REVOKED with etag-guarded replace + audit entry', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    const auditService = await import('../../src/services/auditLog.service.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });
    const pending = {
      id: 'pending:cust-1',
      partitionKey: 'pending:cust-1',
      userId: 'cust-1',
      userRole: 'CUSTOMER' as const,
      status: 'PENDING' as const,
      requestedAt: '2026-04-25T00:00:00.000Z',
      scheduledDeletionAt: '2026-05-02T00:00:00.000Z',
      anonymizationSalt: 'salt-1234567890abcd',
    };
    (repo.getActiveErasureRequestForUser as MockFn).mockResolvedValue({
      doc: pending,
      etag: '"etag-xyz"',
    });
    (repo.replaceErasureRequest as MockFn).mockResolvedValue(undefined);

    const res = (await revokeHandler(makeDelete(), new InvocationContext())) as HttpResponseInit;
    expect(res.status).toBe(204);

    const [replaced, passedEtag] = (repo.replaceErasureRequest as MockFn).mock.calls[0]! as [Record<string, unknown>, string];
    expect(replaced['status']).toBe('REVOKED');
    expect(typeof replaced['revokedAt']).toBe('string');
    expect(passedEtag).toBe('"etag-xyz"');

    expect(auditService.auditLog).toHaveBeenCalledWith(

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/tests/unit/users-erasure-request.test.ts -Tail 80' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3488ms:
    (repo.createErasureRequest as MockFn).mockResolvedValue(undefined);

    await submitHandler(
      makePost({ confirmationPhrase: 'DELETE MY ACCOUNT', reason: 'r' }),
      new InvocationContext(),
    );

    expect(auditService.auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'cust-1', role: 'system' }),
      'ERASURE_REQUESTED',
      'user',
      'cust-1',
      expect.any(Object),
    );
  });
});

describe('DELETE /v1/users/me/erasure-request', () => {
  let revokeHandler: typeof import('../../src/functions/users-erasure-request.js').revokeErasureRequestHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/users-erasure-request.js');
    revokeHandler = mod.revokeErasureRequestHandler;
  });

  it('returns 401 without Authorization', async () => {
    const res = (await revokeHandler(makeDelete(false), new InvocationContext())) as HttpResponseInit;
    expect(res.status).toBe(401);
  });

  it('returns 404 when no PENDING request exists', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });
    (repo.getActiveErasureRequestForUser as MockFn).mockResolvedValue(null);

    const res = (await revokeHandler(makeDelete(), new InvocationContext())) as HttpResponseInit;
    expect(res.status).toBe(404);
  });

  it('returns 204 and marks request REVOKED with etag-guarded replace + audit entry', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    const auditService = await import('../../src/services/auditLog.service.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });
    const pending = {
      id: 'pending:cust-1',
      partitionKey: 'pending:cust-1',
      userId: 'cust-1',
      userRole: 'CUSTOMER' as const,
      status: 'PENDING' as const,
      requestedAt: '2026-04-25T00:00:00.000Z',
      scheduledDeletionAt: '2026-05-02T00:00:00.000Z',
      anonymizationSalt: 'salt-1234567890abcd',
    };
    (repo.getActiveErasureRequestForUser as MockFn).mockResolvedValue({
      doc: pending,
      etag: '"etag-xyz"',
    });
    (repo.replaceErasureRequest as MockFn).mockResolvedValue(undefined);

    const res = (await revokeHandler(makeDelete(), new InvocationContext())) as HttpResponseInit;
    expect(res.status).toBe(204);

    const [replaced, passedEtag] = (repo.replaceErasureRequest as MockFn).mock.calls[0]! as [Record<string, unknown>, string];
    expect(replaced['status']).toBe('REVOKED');
    expect(typeof replaced['revokedAt']).toBe('string');
    expect(passedEtag).toBe('"etag-xyz"');

    expect(auditService.auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'cust-1' }),
      'ERASURE_REVOKED',
      'user',
      'cust-1',
      expect.any(Object),
    );
  });
});

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --unified=20 360b04d87a5b9a8e609c7b66c07e1bbfcdc1072f -- api/src/functions/users-erasure-request.ts api/src/cosmos/booking-repository.ts technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt technician-app/app/src/main/res/values/strings.xml technician-app/app/src/main/res/values-hi/strings.xml' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 4370ms:
diff --git a/api/src/cosmos/booking-repository.ts b/api/src/cosmos/booking-repository.ts
index 04a96c9c..8230594d 100644
--- a/api/src/cosmos/booking-repository.ts
+++ b/api/src/cosmos/booking-repository.ts
@@ -159,40 +159,52 @@ export const bookingRepo = {
                 WHERE c.technicianId = @technicianId
                   AND c.status IN (
                     'ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS',
                     'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED'
                   )`,
         parameters: [{ name: '@technicianId', value: technicianId }],
       })
       .fetchAll();
     // Sort in memory — ORDER BY on a cross-partition (non-PK) query requires
     // a composite index that isn't provisioned on the bookings container.
     // Sort in-memory after the composite index is provisioned (see
     // scripts/provision-cosmos-indexes.ts). The index covers [/technicianId,
     // /slotDate, /slotWindow] so ORDER BY in the query is also valid, but
     // in-memory sort keeps this function safe even before the first index rebuild.
     return resources.sort(
       (a, b) =>
         a.slotDate.localeCompare(b.slotDate) || a.slotWindow.localeCompare(b.slotWindow),
     );
   },
 
+  async hasActiveBookingForTechnician(technicianId: string): Promise<boolean> {
+    const { resources } = await getBookingsContainer()
+      .items.query<{ id: string }>({
+        query: `SELECT TOP 1 c.id FROM c
+                WHERE c.technicianId = @technicianId
+                  AND c.status IN ('ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL')`,
+        parameters: [{ name: '@technicianId', value: technicianId }],
+      })
+      .fetchNext();
+    return resources.length > 0;
+  },
+
   async getByCustomerId(customerId: string): Promise<BookingDoc[]> {
     const { resources } = await getBookingsContainer()
       .items.query<BookingDoc>({
         query: `SELECT * FROM c
                 WHERE c.customerId = @customerId`,
         parameters: [{ name: '@customerId', value: customerId }],
       })
       .fetchAll();
     return resources.sort((a, b) => {
       const slotCompare = b.slotDate.localeCompare(a.slotDate) || b.slotWindow.localeCompare(a.slotWindow);
       return slotCompare || b.createdAt.localeCompare(a.createdAt);
     });
   },
 
   async requestAddOn(id: string, addOn: PendingAddOn): Promise<BookingDoc | null> {
     const existing = await this.getById(id);
     if (!existing || existing.status !== 'IN_PROGRESS') return null;
     const updated: BookingDoc = {
       ...existing,
       status: 'AWAITING_PRICE_APPROVAL',
diff --git a/api/src/functions/users-erasure-request.ts b/api/src/functions/users-erasure-request.ts
index 45ff6385..6af8e416 100644
--- a/api/src/functions/users-erasure-request.ts
+++ b/api/src/functions/users-erasure-request.ts
@@ -1,63 +1,72 @@
 import '../bootstrap.js';
 import { app } from '@azure/functions';
 import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
 import { randomBytes } from 'node:crypto';
 import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';
 import { auditLog } from '../services/auditLog.service.js';
 import { inferUserRole } from '../services/userRole.service.js';
 import {
   createErasureRequest,
   DuplicatePendingError,
   getActiveErasureRequestForUser,
   replaceErasureRequest,
 } from '../cosmos/erasure-request-repository.js';
+import { bookingRepo } from '../cosmos/booking-repository.js';
 import {
   ErasureRequestSubmitBodySchema,
   ERASURE_GRACE_PERIOD_MS,
 } from '../schemas/erasure-request.js';
 import type { ErasureRequestDoc } from '../schemas/erasure-request.js';
 
 async function authenticate(req: HttpRequest): Promise<{ uid: string } | { errorStatus: number; code: string }> {
   const auth = req.headers.get('authorization') ?? '';
   if (!auth.startsWith('Bearer ')) {
     return { errorStatus: 401, code: 'UNAUTHENTICATED' };
   }
   try {
     const decoded = await verifyFirebaseIdToken(auth.slice(7));
     return { uid: decoded.uid };
   } catch {
     return { errorStatus: 401, code: 'TOKEN_INVALID' };
   }
 }
 
 export async function submitErasureRequestHandler(
   req: HttpRequest,
   _ctx: InvocationContext,
 ): Promise<HttpResponseInit> {
   const auth = await authenticate(req);
   if ('errorStatus' in auth) {
     return { status: auth.errorStatus, jsonBody: { code: auth.code } };
   }
   const { uid } = auth;
   const role = await inferUserRole(uid);
 
+  // Gate: refuse deletion if an active booking exists for this technician.
+  if (role === 'TECHNICIAN') {
+    const hasActive = await bookingRepo.hasActiveBookingForTechnician(uid);
+    if (hasActive) {
+      return { status: 409, jsonBody: { code: 'ACTIVE_JOB_EXISTS' } };
+    }
+  }
+
   let body: unknown;
   try {
     body = await req.json();
   } catch {
     body = {};
   }
   const parsed = ErasureRequestSubmitBodySchema.safeParse(body);
   if (!parsed.success) {
     return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
   }
 
   const requestedAt = new Date();
   const scheduledDeletionAt = new Date(requestedAt.getTime() + ERASURE_GRACE_PERIOD_MS);
   // Deterministic ID: Cosmos enforces one-document-per-user atomically on create.
   const id = `pending:${uid}`;
   const salt = randomBytes(16).toString('hex'); // 32 chars; well above the 16-char min
 
   const doc: ErasureRequestDoc = {
     id,
     partitionKey: id,
diff --git a/technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt b/technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt
new file mode 100644
index 00000000..7f043a64
--- /dev/null
+++ b/technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt
@@ -0,0 +1,27 @@
+package com.homeservices.technician.data.erasure.remote
+
+import retrofit2.Response
+import retrofit2.http.Body
+import retrofit2.http.DELETE
+import retrofit2.http.POST
+
+public interface ErasureApiService {
+    @POST("v1/users/me/erasure-request")
+    public suspend fun submitErasureRequest(
+        @Body body: ErasureSubmitRequestBody,
+    ): Response<ErasureSubmitResponseBody>
+
+    @DELETE("v1/users/me/erasure-request")
+    public suspend fun revokeErasureRequest(): Response<Unit>
+}
+
+public data class ErasureSubmitRequestBody(
+    val confirmationPhrase: String,
+    val reason: String? = null,
+)
+
+public data class ErasureSubmitResponseBody(
+    val erasureId: String,
+    val scheduledDeletionAt: String,
+    val status: String,
+)
diff --git a/technician-app/app/src/main/res/values-hi/strings.xml b/technician-app/app/src/main/res/values-hi/strings.xml
index ea6a908e..23cfe6d0 100644
--- a/technician-app/app/src/main/res/values-hi/strings.xml
+++ b/technician-app/app/src/main/res/values-hi/strings.xml
@@ -153,21 +153,47 @@
     <string name="booking_status_notification_title">बुकिंग अपडेट</string>
     <string name="booking_status_notification_body_default">आपकी बुकिंग की स्थिति बदल गई है।</string>
 
     <!-- Onboarding placement durable hooks (E11-S05c) -->
     <string name="kyc_verified_notification_title">KYC सत्यापित</string>
     <string name="kyc_verified_notification_body">आपके दस्तावेज़ स्वीकृत हो गए हैं। अब आप काम प्राप्त कर सकते हैं।</string>
     <string name="kyc_rejected_notification_title">KYC अस्वीकृत</string>
     <string name="kyc_rejected_notification_body">आपकी KYC स्वीकार नहीं हुई। कृपया दस्तावेज़ दोबारा जमा करें।</string>
     <string name="onboarding_reminder_notification_title">ऑनबोर्डिंग पूरी करें</string>
     <string name="onboarding_reminder_notification_body">काम पाने के लिए अपनी KYC पूरी करें।</string>
     <string name="photo_upload_retry_banner_label">फोटो अपलोड बाकी है</string>
     <string name="photo_upload_retry_banner_action">पुनः प्रयास</string>
     <string name="onboarding_kyc_queued_offline">ऑनलाइन होने पर KYC जमा की जाएगी।</string>
 
     <!-- Active job location foreground service (E17-S02) -->
     <string name="active_job_location_notification_title">ग्राहक के साथ स्थान साझा कर रहे हैं</string>
     <string name="active_job_location_notification_body">केवल सक्रिय बुकिंग के दौरान</string>
 
     <!-- Legal (E20-S07) -->
     <string name="privacy_policy_url">https://aloktiwarigit.github.io/homeheroo-privacy/technician/</string>
+
+    <!-- Account deletion (E20-S08) -->
+    <string name="settings_delete_account_title">अकाउंट हटाएं</string>
+    <string name="settings_delete_account_subtitle">आपकी प्रोफ़ाइल और डेटा स्थायी रूप से हटाएं</string>
+    <string name="delete_account_title">अकाउंट हटाएं</string>
+    <string name="delete_account_warning">यह स्थायी है और पूर्ववत नहीं होगा</string>
+    <string name="delete_account_what_gets_deleted">क्या हटाया जाएगा</string>
+    <string name="delete_account_item_profile">आपकी प्रोफ़ाइल और फ़ोन नंबर</string>
+    <string name="delete_account_item_kyc">KYC दस्तावेज़ (आधार, पैन)</string>
+    <string name="delete_account_item_earnings">कमाई इतिहास और भुगतान रिकॉर्ड</string>
+    <string name="delete_account_item_photos">जॉब फ़ोटो और कार्य इतिहास</string>
+    <string name="delete_account_item_ratings">ग्राहकों की रेटिंग</string>
+    <string name="delete_account_footnote">पुष्टि के 7 दिनों के भीतर डेटा हटाया जाएगा</string>
+    <string name="delete_account_confirm_button">हाँ, मेरा अकाउंट हटाएं</string>
+    <string name="delete_account_cancel_button">रद्द करें</string>
+    <string name="delete_account_active_job_title">जॉब जारी है</string>
+    <string name="delete_account_active_job_error">अकाउंट हटाने से पहले अपनी मौजूदा जॉब पूरी करें या रद्द करें</string>
+    <string name="delete_account_active_job_ok">ठीक है</string>
+    <string name="delete_account_duplicate_pending">आपके अकाउंट के लिए पहले से एक हटाने का अनुरोध लंबित है</string>
+    <string name="delete_account_generic_error">कुछ गड़बड़ी हुई। कृपया पुनः प्रयास करें।</string>
+    <string name="account_deleted_title">हटाने का अनुरोध सबमिट हुआ</string>
+    <string name="account_deleted_body">आपका अकाउंट %1$s को हटाया जाएगा।</string>
+    <string name="account_deleted_revocation_hint">मन बदला? %1$s से पहले support@homeheroo.in पर \'Cancel account deletion\' subject से अपना फ़ोन नंबर लिखकर ईमेल करें।</string>
+    <string name="account_deleted_web_form_label">ऐप तक पहुंच खो गई? यहाँ हटाने का अनुरोध करें</string>
+    <string name="account_deleted_done">हो गया</string>
+    <string name="deletion_request_url">https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/</string>
 </resources>
diff --git a/technician-app/app/src/main/res/values/strings.xml b/technician-app/app/src/main/res/values/strings.xml
index 4b523491..efdcb88b 100644
--- a/technician-app/app/src/main/res/values/strings.xml
+++ b/technician-app/app/src/main/res/values/strings.xml
@@ -48,40 +48,66 @@
     <string name="earnings_period_week">This week</string>
     <string name="earnings_period_month">This month</string>
     <string name="earnings_period_lifetime">Lifetime</string>
     <string name="earnings_no_jobs">No jobs yet</string>
     <string name="earnings_jobs_count">%d jobs</string>
     <string name="earnings_monthly_goal">Monthly goal</string>
     <string name="earnings_last_seven_days">Last 7 days</string>
     <string name="earnings_sparkline_empty">Activity will appear here after your first job</string>
     <string name="earnings_view_ratings">View ratings</string>
 
     <!-- Notification permission rationale (E11-S01b-1) -->
     <string name="notification_permission_rationale_title">Allow notifications</string>
     <string name="notification_permission_rationale_body">Allow notifications to receive job offers, booking updates, and payout alerts.</string>
 
     <!-- Language settings -->
     <string name="settings_language_title">App language</string>
     <string name="settings_language_subtitle">Switch between English and Hindi</string>
     <string name="settings_language_save">Save language</string>
     <string name="action_back">Back</string>
 
+    <!-- Account deletion (E20-S08) -->
+    <string name="settings_delete_account_title">Delete my account</string>
+    <string name="settings_delete_account_subtitle">Permanently remove your profile and data</string>
+    <string name="delete_account_title">Delete account</string>
+    <string name="delete_account_warning">This is permanent and cannot be undone</string>
+    <string name="delete_account_what_gets_deleted">What gets deleted</string>
+    <string name="delete_account_item_profile">Your profile and phone number</string>
+    <string name="delete_account_item_kyc">KYC documents (Aadhaar, PAN)</string>
+    <string name="delete_account_item_earnings">Earnings history and payout records</string>
+    <string name="delete_account_item_photos">Job photos and work history</string>
+    <string name="delete_account_item_ratings">Ratings received from customers</string>
+    <string name="delete_account_footnote">Data deleted within 7 days of confirmation</string>
+    <string name="delete_account_confirm_button">Yes, delete my account</string>
+    <string name="delete_account_cancel_button">Cancel</string>
+    <string name="delete_account_active_job_title">Job in progress</string>
+    <string name="delete_account_active_job_error">Complete or cancel your current job before deleting your account</string>
+    <string name="delete_account_active_job_ok">OK</string>
+    <string name="delete_account_duplicate_pending">A deletion request is already pending for your account</string>
+    <string name="delete_account_generic_error">Something went wrong. Please try again.</string>
+    <string name="account_deleted_title">Deletion request submitted</string>
+    <string name="account_deleted_body">Your account is scheduled for deletion on %1$s.</string>
+    <string name="account_deleted_revocation_hint">Changed your mind? Email support@homeheroo.in with subject \'Cancel account deletion\' and your phone number before %1$s.</string>
+    <string name="account_deleted_web_form_label">Lost access to the app? Request deletion here</string>
+    <string name="account_deleted_done">Done</string>
+    <string name="deletion_request_url">https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/</string>
+
     <!-- Photo capture screen (E06-S02-Codemod) -->
     <string name="photo_no_back_camera">No back camera available on this device</string>
     <string name="photo_go_back">Go back</string>
     <string name="photo_capture">Capture</string>
     <string name="photo_cancel">Cancel</string>
     <string name="photo_upload_failed">Upload failed: %s</string>
     <string name="photo_retry_upload">Retry Upload</string>
     <string name="photo_retake_photo">Retake Photo</string>
     <string name="photo_retake">Retake</string>
     <string name="photo_confirm_upload">Confirm &amp; Upload</string>
     <string name="photo_camera_permission_required">Camera permission required</string>
     <string name="photo_grant_permission">Grant Permission</string>
 
     <!-- Shield report sheet (E06-S02-Codemod) -->
     <string name="shield_description_placeholder">Description…</string>
 
     <!-- Ratings screens -->
     <string name="my_ratings_title">My ratings</string>
     <string name="my_ratings_load_error">Could not load ratings</string>
     <string name="my_ratings_empty">No ratings yet</string>
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --check 360b04d87a5b9a8e609c7b66c07e1bbfcdc1072f' in C:\Alok\Business Projects\Urbanclap-dup
2026-05-23T00:31:24.133598Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 2.7 seconds
Output:
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:1486: trailing whitespace.
+**Email:** aloktiwari49@gmail.com  
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:1487: trailing whitespace.
+**Subject:** `Delete my HomeHeroo Technician account`  
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

 exited 1 in 2670ms:
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:1486: trailing whitespace.
+**Email:** aloktiwari49@gmail.com  
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md:1487: trailing whitespace.
+**Subject:** `Delete my HomeHeroo Technician account`  
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/cosmos/technician-repository.ts -TotalCount 220' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3680ms:
import { getCosmosClient, DB_NAME } from './client.js';
import { boundingBoxPolygon, haversine } from './geo.js';
import type { BookingDoc } from '../schemas/booking.js';
import type { TechnicianKyc, KycStatus } from '../schemas/kyc.js';
import type { AvailabilityWindow, TechnicianProfile } from '../schemas/technician.js';

const CONTAINER = 'technicians';

// â”€â”€ KYC methods (E02-S03 pattern) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface TechnicianDoc {
  id: string;
  kyc?: Partial<TechnicianKyc>;
}

export async function upsertKycStatus(
  technicianId: string,
  patch: Partial<TechnicianKyc> & { kycStatus: KycStatus }
): Promise<void> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const { resource } = await container.item(technicianId, technicianId).read<TechnicianDoc>();
  const existing: TechnicianDoc = resource ?? { id: technicianId };
  const updated: TechnicianDoc = {
    ...existing,
    kyc: {
      aadhaarVerified: false,
      aadhaarMaskedNumber: null,
      panNumber: null,
      panMaskedNumber: null,
      panHash: null,
      panImagePath: null,
      ...(existing.kyc ?? {}),
      ...patch,
      updatedAt: new Date().toISOString(),
    },
  };
  await container.items.upsert(updated);
}

export async function getKycByTechnicianId(
  technicianId: string
): Promise<TechnicianKyc | null> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const { resource } = await container.item(technicianId, technicianId).read<TechnicianDoc>();
  return (resource?.kyc as TechnicianKyc | undefined) ?? null;
}

// â”€â”€ Geospatial profile methods (E05-S01) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function upsertTechnicianProfile(profile: TechnicianProfile): Promise<void> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  await container.items.upsert(profile);
}

export interface TechnicianAvailability {
  isOnline: boolean;
  isAvailable: boolean;
  availabilityWindows: AvailabilityWindow[];
  updatedAt?: string;
}

export interface TechnicianAvailabilityPatch {
  isOnline?: boolean | undefined;
  isAvailable?: boolean | undefined;
  availabilityWindows?: AvailabilityWindow[] | undefined;
}

export interface TechnicianServiceLocation {
  lat: number;
  lng: number;
}

export interface TechnicianServiceProfile {
  skills: string[];
  location: TechnicianServiceLocation | null;
}

export interface TechnicianServiceProfilePatch {
  skills: string[];
  location?: TechnicianServiceLocation | undefined;
}

const defaultAvailabilityWindows = (): AvailabilityWindow[] =>
  Array.from({ length: 7 }, (_, dayOfWeek) => [
    { dayOfWeek, startHour: 8, endHour: 12 },
    { dayOfWeek, startHour: 12, endHour: 17 },
  ]).flat();

function normalizeAvailability(doc?: Partial<TechnicianProfile> & Record<string, unknown>): TechnicianAvailability {
  const availability: TechnicianAvailability = {
    isOnline: typeof doc?.isOnline === 'boolean' ? doc.isOnline : true,
    isAvailable: typeof doc?.isAvailable === 'boolean' ? doc.isAvailable : true,
    availabilityWindows: Array.isArray(doc?.availabilityWindows)
      ? doc.availabilityWindows
      : defaultAvailabilityWindows(),
  };
  if (typeof doc?.updatedAt === 'string') availability.updatedAt = doc.updatedAt;
  return availability;
}

export async function getTechnicianAvailability(technicianId: string): Promise<TechnicianAvailability> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const { resource } = await container.item(technicianId, technicianId).read<Partial<TechnicianProfile> & Record<string, unknown>>();
  return normalizeAvailability(resource);
}

export async function patchTechnicianAvailability(
  technicianId: string,
  patch: TechnicianAvailabilityPatch,
): Promise<TechnicianAvailability> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const { resource } = await container.item(technicianId, technicianId).read<Record<string, unknown>>();
  const updatedAt = new Date().toISOString();
  const updated = {
    ...(resource ?? { id: technicianId, technicianId }),
    id: technicianId,
    technicianId: (resource?.technicianId as string | undefined) ?? technicianId,
    ...(patch.isOnline !== undefined ? { isOnline: patch.isOnline } : {}),
    ...(patch.isAvailable !== undefined ? { isAvailable: patch.isAvailable } : {}),
    ...(patch.availabilityWindows !== undefined ? { availabilityWindows: patch.availabilityWindows } : {}),
    updatedAt,
  };
  await container.items.upsert(updated);
  return normalizeAvailability(updated);
}

async function readTechnicianDocument(technicianId: string): Promise<Record<string, unknown> | null> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  try {
    const { resource } = await container.item(technicianId, technicianId).read<Record<string, unknown>>();
    return resource ?? null;
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 404) return null;
    throw err;
  }
}

function toServiceProfile(doc: Record<string, unknown> | null): TechnicianServiceProfile {
  const skills = Array.isArray(doc?.skills) ? doc.skills.filter((skill): skill is string => typeof skill === 'string') : [];
  const location = doc?.location as { coordinates?: unknown } | undefined;
  const coordinates = location?.coordinates;
  const hasCoordinates =
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number';
  return {
    skills,
    location: hasCoordinates ? { lat: coordinates[1] as number, lng: coordinates[0] as number } : null,
  };
}

export async function getTechnicianServiceProfile(
  technicianId: string,
): Promise<TechnicianServiceProfile> {
  return toServiceProfile(await readTechnicianDocument(technicianId));
}

export async function patchTechnicianServiceProfile(
  technicianId: string,
  patch: TechnicianServiceProfilePatch,
): Promise<TechnicianServiceProfile> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const existing = await readTechnicianDocument(technicianId);
  const existingKyc = existing?.kyc as { kycStatus?: unknown } | undefined;
  const updatedAt = new Date().toISOString();
  const updated: Record<string, unknown> = {
    ...(existing ?? {}),
    id: technicianId,
    technicianId: typeof existing?.technicianId === 'string' ? existing.technicianId : technicianId,
    skills: patch.skills,
    availabilityWindows: Array.isArray(existing?.availabilityWindows) ? existing.availabilityWindows : [],
    isOnline: typeof existing?.isOnline === 'boolean' ? existing.isOnline : false,
    isAvailable: typeof existing?.isAvailable === 'boolean' ? existing.isAvailable : false,
    kycStatus: typeof existing?.kycStatus === 'string'
      ? existing.kycStatus
      : typeof existingKyc?.kycStatus === 'string'
        ? existingKyc.kycStatus
        : 'PENDING',
    updatedAt,
  };
  if (patch.location !== undefined) {
    updated.location = { type: 'Point', coordinates: [patch.location.lng, patch.location.lat] };
  }
  await container.items.upsert(updated);
  return toServiceProfile(updated);
}

export async function getTechniciansWithinRadius(
  lat: number,
  lng: number,
  radiusKm: number,
  serviceId: string,
): Promise<TechnicianProfile[]> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);
  const polygon = boundingBoxPolygon(lat, lng, radiusKm);
  const query = {
    query: `SELECT * FROM c
            WHERE ST_WITHIN(c.location, @polygon)
            AND ARRAY_CONTAINS(c.skills, @serviceId)
            AND c.isOnline = true
            AND c.isAvailable = true`,
    parameters: [
      { name: '@polygon', value: polygon as unknown as string },
      { name: '@serviceId', value: serviceId },
    ],
  };
  const { resources } = await container.items
    .query<TechnicianProfile>(query)
    .fetchAll();
  return resources;
}

export interface TechnicianLookupInfo {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "settings_delete_account|delete_account|account_deleted|ErasureApiService|ErasureSubmit" technician-app/app/src/main/kotlin technician-app/app/src/main/res -n' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1778ms:
technician-app/app/src/main/res\values-hi\strings.xml:175:    <string name="settings_delete_account_title">अकाउंट हटाएं</string>
technician-app/app/src/main/res\values-hi\strings.xml:176:    <string name="settings_delete_account_subtitle">आपकी प्रोफ़ाइल और डेटा स्थायी रूप से हटाएं</string>
technician-app/app/src/main/res\values-hi\strings.xml:177:    <string name="delete_account_title">अकाउंट हटाएं</string>
technician-app/app/src/main/res\values-hi\strings.xml:178:    <string name="delete_account_warning">यह स्थायी है और पूर्ववत नहीं होगा</string>
technician-app/app/src/main/res\values-hi\strings.xml:179:    <string name="delete_account_what_gets_deleted">क्या हटाया जाएगा</string>
technician-app/app/src/main/res\values-hi\strings.xml:180:    <string name="delete_account_item_profile">आपकी प्रोफ़ाइल और फ़ोन नंबर</string>
technician-app/app/src/main/res\values-hi\strings.xml:181:    <string name="delete_account_item_kyc">KYC दस्तावेज़ (आधार, पैन)</string>
technician-app/app/src/main/res\values-hi\strings.xml:182:    <string name="delete_account_item_earnings">कमाई इतिहास और भुगतान रिकॉर्ड</string>
technician-app/app/src/main/res\values-hi\strings.xml:183:    <string name="delete_account_item_photos">जॉब फ़ोटो और कार्य इतिहास</string>
technician-app/app/src/main/res\values-hi\strings.xml:184:    <string name="delete_account_item_ratings">ग्राहकों की रेटिंग</string>
technician-app/app/src/main/res\values-hi\strings.xml:185:    <string name="delete_account_footnote">पुष्टि के 7 दिनों के भीतर डेटा हटाया जाएगा</string>
technician-app/app/src/main/res\values-hi\strings.xml:186:    <string name="delete_account_confirm_button">हाँ, मेरा अकाउंट हटाएं</string>
technician-app/app/src/main/res\values-hi\strings.xml:187:    <string name="delete_account_cancel_button">रद्द करें</string>
technician-app/app/src/main/res\values-hi\strings.xml:188:    <string name="delete_account_active_job_title">जॉब जारी है</string>
technician-app/app/src/main/res\values-hi\strings.xml:189:    <string name="delete_account_active_job_error">अकाउंट हटाने से पहले अपनी मौजूदा जॉब पूरी करें या रद्द करें</string>
technician-app/app/src/main/res\values-hi\strings.xml:190:    <string name="delete_account_active_job_ok">ठीक है</string>
technician-app/app/src/main/res\values-hi\strings.xml:191:    <string name="delete_account_duplicate_pending">आपके अकाउंट के लिए पहले से एक हटाने का अनुरोध लंबित है</string>
technician-app/app/src/main/res\values-hi\strings.xml:192:    <string name="delete_account_generic_error">कुछ गड़बड़ी हुई। कृपया पुनः प्रयास करें।</string>
technician-app/app/src/main/res\values-hi\strings.xml:193:    <string name="account_deleted_title">हटाने का अनुरोध सबमिट हुआ</string>
technician-app/app/src/main/res\values-hi\strings.xml:194:    <string name="account_deleted_body">आपका अकाउंट %1$s को हटाया जाएगा।</string>
technician-app/app/src/main/res\values-hi\strings.xml:195:    <string name="account_deleted_revocation_hint">मन बदला? %1$s से पहले support@homeheroo.in पर \'Cancel account deletion\' subject से अपना फ़ोन नंबर लिखकर ईमेल करें।</string>
technician-app/app/src/main/res\values-hi\strings.xml:196:    <string name="account_deleted_web_form_label">ऐप तक पहुंच खो गई? यहाँ हटाने का अनुरोध करें</string>
technician-app/app/src/main/res\values-hi\strings.xml:197:    <string name="account_deleted_done">हो गया</string>
technician-app/app/src/main/res\values\strings.xml:69:    <string name="settings_delete_account_title">Delete my account</string>
technician-app/app/src/main/res\values\strings.xml:70:    <string name="settings_delete_account_subtitle">Permanently remove your profile and data</string>
technician-app/app/src/main/res\values\strings.xml:71:    <string name="delete_account_title">Delete account</string>
technician-app/app/src/main/res\values\strings.xml:72:    <string name="delete_account_warning">This is permanent and cannot be undone</string>
technician-app/app/src/main/res\values\strings.xml:73:    <string name="delete_account_what_gets_deleted">What gets deleted</string>
technician-app/app/src/main/res\values\strings.xml:74:    <string name="delete_account_item_profile">Your profile and phone number</string>
technician-app/app/src/main/res\values\strings.xml:75:    <string name="delete_account_item_kyc">KYC documents (Aadhaar, PAN)</string>
technician-app/app/src/main/res\values\strings.xml:76:    <string name="delete_account_item_earnings">Earnings history and payout records</string>
technician-app/app/src/main/res\values\strings.xml:77:    <string name="delete_account_item_photos">Job photos and work history</string>
technician-app/app/src/main/res\values\strings.xml:78:    <string name="delete_account_item_ratings">Ratings received from customers</string>
technician-app/app/src/main/res\values\strings.xml:79:    <string name="delete_account_footnote">Data deleted within 7 days of confirmation</string>
technician-app/app/src/main/res\values\strings.xml:80:    <string name="delete_account_confirm_button">Yes, delete my account</string>
technician-app/app/src/main/res\values\strings.xml:81:    <string name="delete_account_cancel_button">Cancel</string>
technician-app/app/src/main/res\values\strings.xml:82:    <string name="delete_account_active_job_title">Job in progress</string>
technician-app/app/src/main/res\values\strings.xml:83:    <string name="delete_account_active_job_error">Complete or cancel your current job before deleting your account</string>
technician-app/app/src/main/res\values\strings.xml:84:    <string name="delete_account_active_job_ok">OK</string>
technician-app/app/src/main/res\values\strings.xml:85:    <string name="delete_account_duplicate_pending">A deletion request is already pending for your account</string>
technician-app/app/src/main/res\values\strings.xml:86:    <string name="delete_account_generic_error">Something went wrong. Please try again.</string>
technician-app/app/src/main/res\values\strings.xml:87:    <string name="account_deleted_title">Deletion request submitted</string>
technician-app/app/src/main/res\values\strings.xml:88:    <string name="account_deleted_body">Your account is scheduled for deletion on %1$s.</string>
technician-app/app/src/main/res\values\strings.xml:89:    <string name="account_deleted_revocation_hint">Changed your mind? Email support@homeheroo.in with subject \'Cancel account deletion\' and your phone number before %1$s.</string>
technician-app/app/src/main/res\values\strings.xml:90:    <string name="account_deleted_web_form_label">Lost access to the app? Request deletion here</string>
technician-app/app/src/main/res\values\strings.xml:91:    <string name="account_deleted_done">Done</string>
technician-app/app/src/main/kotlin\com\homeservices\technician\domain\erasure\ErasureRepository.kt:3:public sealed class ErasureSubmitResult {
technician-app/app/src/main/kotlin\com\homeservices\technician\domain\erasure\ErasureRepository.kt:4:    public data class Success(val scheduledDeletionAt: String) : ErasureSubmitResult()
technician-app/app/src/main/kotlin\com\homeservices\technician\domain\erasure\ErasureRepository.kt:5:    public object ActiveJobExists : ErasureSubmitResult()
technician-app/app/src/main/kotlin\com\homeservices\technician\domain\erasure\ErasureRepository.kt:6:    public object DuplicatePending : ErasureSubmitResult()
technician-app/app/src/main/kotlin\com\homeservices\technician\domain\erasure\ErasureRepository.kt:7:    public data class UnknownError(val message: String) : ErasureSubmitResult()
technician-app/app/src/main/kotlin\com\homeservices\technician\domain\erasure\ErasureRepository.kt:11:    public suspend fun submitRequest(reason: String? = null): ErasureSubmitResult
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:3:import com.homeservices.technician.data.erasure.remote.ErasureApiService
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:4:import com.homeservices.technician.data.erasure.remote.ErasureSubmitRequestBody
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:6:import com.homeservices.technician.domain.erasure.ErasureSubmitResult
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:15:        private val api: ErasureApiService,
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:17:        public override suspend fun submitRequest(reason: String?): ErasureSubmitResult =
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:20:                    ErasureSubmitRequestBody(confirmationPhrase = CONFIRMATION_PHRASE, reason = reason),
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:25:                        ErasureSubmitResult.Success(body.scheduledDeletionAt)
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:30:                            ErasureSubmitResult.ActiveJobExists
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:32:                            ErasureSubmitResult.DuplicatePending
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:35:                    else -> ErasureSubmitResult.UnknownError("HTTP ${response.code()}")
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:37:            }.getOrElse { e -> ErasureSubmitResult.UnknownError(e.message ?: "Unknown") }
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\remote\ErasureApiService.kt:8:public interface ErasureApiService {
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\remote\ErasureApiService.kt:11:        @Body body: ErasureSubmitRequestBody,
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\remote\ErasureApiService.kt:12:    ): Response<ErasureSubmitResponseBody>
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\remote\ErasureApiService.kt:18:public data class ErasureSubmitRequestBody(
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\remote\ErasureApiService.kt:23:public data class ErasureSubmitResponseBody(

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git status --short' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1521ms:
?? .codex-review/
?? docs/reviews/codex-sprint2b-perf-obs-20260522-2027.md
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt; Write-Host '---'; Get-Content technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt; Write-Host '---'; Get-ChildItem -Path technician-app/app/src/main/kotlin/com/homeservices/technician -Recurse -Filter '*Erasure*' | Select-Object -ExpandProperty FullName | ForEach-Object { "'$_.Replace((Get-Location).Path+'"'\\','') }" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1766ms:
package com.homeservices.technician.data.erasure

import com.homeservices.technician.data.erasure.remote.ErasureApiService
import com.homeservices.technician.data.erasure.remote.ErasureSubmitRequestBody
import com.homeservices.technician.domain.erasure.ErasureRepository
import com.homeservices.technician.domain.erasure.ErasureSubmitResult
import javax.inject.Inject

private const val CONFIRMATION_PHRASE = "DELETE MY ACCOUNT"
private const val HTTP_CONFLICT = 409

public class ErasureRepositoryImpl
    @Inject
    constructor(
        private val api: ErasureApiService,
    ) : ErasureRepository {
        public override suspend fun submitRequest(reason: String?): ErasureSubmitResult =
            runCatching {
                val response = api.submitErasureRequest(
                    ErasureSubmitRequestBody(confirmationPhrase = CONFIRMATION_PHRASE, reason = reason),
                )
                when {
                    response.isSuccessful -> {
                        val body = checkNotNull(response.body()) { "Null body on 2xx" }
                        ErasureSubmitResult.Success(body.scheduledDeletionAt)
                    }
                    response.code() == HTTP_CONFLICT -> {
                        val raw = response.errorBody()?.string() ?: ""
                        if (raw.contains("ACTIVE_JOB_EXISTS")) {
                            ErasureSubmitResult.ActiveJobExists
                        } else {
                            ErasureSubmitResult.DuplicatePending
                        }
                    }
                    else -> ErasureSubmitResult.UnknownError("HTTP ${response.code()}")
                }
            }.getOrElse { e -> ErasureSubmitResult.UnknownError(e.message ?: "Unknown") }

        public override suspend fun revokeRequest(): Result<Unit> =
            runCatching {
                val response = api.revokeErasureRequest()
                if (!response.isSuccessful) {
                    throw RuntimeException("Revoke failed: HTTP ${response.code()}")
                }
            }
    }
---
package com.homeservices.technician.domain.erasure

public sealed class ErasureSubmitResult {
    public data class Success(val scheduledDeletionAt: String) : ErasureSubmitResult()
    public object ActiveJobExists : ErasureSubmitResult()
    public object DuplicatePending : ErasureSubmitResult()
    public data class UnknownError(val message: String) : ErasureSubmitResult()
}

public interface ErasureRepository {
    public suspend fun submitRequest(reason: String? = null): ErasureSubmitResult
    public suspend fun revokeRequest(): Result<Unit>
}
---
technician-app\app\src\main\kotlin\com\homeservices\technician\data\erasure
technician-app\app\src\main\kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt
technician-app\app\src\main\kotlin\com\homeservices\technician\data\erasure\remote\ErasureApiService.kt
technician-app\app\src\main\kotlin\com\homeservices\technician\domain\erasure
technician-app\app\src\main\kotlin\com\homeservices\technician\domain\erasure\ErasureRepository.kt

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git show 360b04d87a5b9a8e609c7b66c07e1bbfcdc1072f:technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt 2>$null | Select-Object -First 20; if ($LASTEXITCODE -ne 0) { Write-Host '"'not in base' }; git ls-files technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1681ms:
not in base
technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-status 360b04d87a5b9a8e609c7b66c07e1bbfcdc1072f -- technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt; git log --oneline -- technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt -5; git ls-files -s technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3565ms:
A	technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt
A	technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt
f6829fd4 feat(technician-app): ErasureRepository interface + impl (E20-S08)
100644 5c3464cad605874f4b9c5245a6a33262684fb703 0	technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git diff --stat 360b04d87a5b9a8e609c7b66c07e1bbfcdc1072f | Select-String 'erasure|Erasure|technician-app' -Context 0,0; git diff --name-only 360b04d87a5b9a8e609c7b66c07e1bbfcdc1072f | Select-String 'erasure|Erasure|Delete|Account|technician-app'" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 2016ms:

 api/src/functions/users-erasure-request.ts         |    9 +
 api/tests/functions/users-erasure-request.test.ts  |   91 ++
 api/tests/unit/users-erasure-request.test.ts       |    4 +
 .../data/erasure/ErasureRepositoryImpl.kt          |   46 +
 .../data/erasure/remote/ErasureApiService.kt       |   27 +
 .../technician/domain/erasure/ErasureRepository.kt |   13 +
 technician-app/app/src/main/res/values/strings.xml |   26 +
api/src/functions/users-erasure-request.ts
api/tests/functions/users-erasure-request.test.ts
api/tests/unit/users-erasure-request.test.ts
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md
docs/superpowers/specs/2026-05-22-account-deletion-design.md
technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt
technician-app/app/src/main/res/values-hi/strings.xml
technician-app/app/src/main/res/values/strings.xml


warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --stat 360b04d87a5b9a8e609c7b66c07e1bbfcdc1072f; git diff --name-only 360b04d87a5b9a8e609c7b66c07e1bbfcdc1072f' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3161ms:
 .gitignore                                         |    1 +
 api/src/cosmos/booking-repository.ts               |   12 +
 api/src/functions/users-erasure-request.ts         |    9 +
 ...epository-hasActiveBookingForTechnician.test.ts |   43 +
 api/tests/functions/users-erasure-request.test.ts  |   91 ++
 api/tests/unit/users-erasure-request.test.ts       |    4 +
 .../plans/2026-05-22-E20-S08-account-deletion.md   | 1592 ++++++++++++++++++++
 .../specs/2026-05-22-account-deletion-design.md    |  355 +++++
 .../data/erasure/ErasureRepositoryImpl.kt          |   46 +
 .../data/erasure/remote/ErasureApiService.kt       |   27 +
 .../technician/domain/erasure/ErasureRepository.kt |   13 +
 .../app/src/main/res/values-hi/strings.xml         |   26 +
 technician-app/app/src/main/res/values/strings.xml |   26 +
 13 files changed, 2245 insertions(+)
.gitignore
api/src/cosmos/booking-repository.ts
api/src/functions/users-erasure-request.ts
api/tests/cosmos/booking-repository-hasActiveBookingForTechnician.test.ts
api/tests/functions/users-erasure-request.test.ts
api/tests/unit/users-erasure-request.test.ts
docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md
docs/superpowers/specs/2026-05-22-account-deletion-design.md
technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt
technician-app/app/src/main/res/values-hi/strings.xml
technician-app/app/src/main/res/values/strings.xml
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --unified=40 360b04d87a5b9a8e609c7b66c07e1bbfcdc1072f -- technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1812ms:
diff --git a/technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt b/technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt
new file mode 100644
index 00000000..5c3464ca
--- /dev/null
+++ b/technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt
@@ -0,0 +1,46 @@
+package com.homeservices.technician.data.erasure
+
+import com.homeservices.technician.data.erasure.remote.ErasureApiService
+import com.homeservices.technician.data.erasure.remote.ErasureSubmitRequestBody
+import com.homeservices.technician.domain.erasure.ErasureRepository
+import com.homeservices.technician.domain.erasure.ErasureSubmitResult
+import javax.inject.Inject
+
+private const val CONFIRMATION_PHRASE = "DELETE MY ACCOUNT"
+private const val HTTP_CONFLICT = 409
+
+public class ErasureRepositoryImpl
+    @Inject
+    constructor(
+        private val api: ErasureApiService,
+    ) : ErasureRepository {
+        public override suspend fun submitRequest(reason: String?): ErasureSubmitResult =
+            runCatching {
+                val response = api.submitErasureRequest(
+                    ErasureSubmitRequestBody(confirmationPhrase = CONFIRMATION_PHRASE, reason = reason),
+                )
+                when {
+                    response.isSuccessful -> {
+                        val body = checkNotNull(response.body()) { "Null body on 2xx" }
+                        ErasureSubmitResult.Success(body.scheduledDeletionAt)
+                    }
+                    response.code() == HTTP_CONFLICT -> {
+                        val raw = response.errorBody()?.string() ?: ""
+                        if (raw.contains("ACTIVE_JOB_EXISTS")) {
+                            ErasureSubmitResult.ActiveJobExists
+                        } else {
+                            ErasureSubmitResult.DuplicatePending
+                        }
+                    }
+                    else -> ErasureSubmitResult.UnknownError("HTTP ${response.code()}")
+                }
+            }.getOrElse { e -> ErasureSubmitResult.UnknownError(e.message ?: "Unknown") }
+
+        public override suspend fun revokeRequest(): Result<Unit> =
+            runCatching {
+                val response = api.revokeErasureRequest()
+                if (!response.isSuccessful) {
+                    throw RuntimeException("Revoke failed: HTTP ${response.code()}")
+                }
+            }
+    }
diff --git a/technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt b/technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt
new file mode 100644
index 00000000..307e3493
--- /dev/null
+++ b/technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt
@@ -0,0 +1,13 @@
+package com.homeservices.technician.domain.erasure
+
+public sealed class ErasureSubmitResult {
+    public data class Success(val scheduledDeletionAt: String) : ErasureSubmitResult()
+    public object ActiveJobExists : ErasureSubmitResult()
+    public object DuplicatePending : ErasureSubmitResult()
+    public data class UnknownError(val message: String) : ErasureSubmitResult()
+}
+
+public interface ErasureRepository {
+    public suspend fun submitRequest(reason: String? = null): ErasureSubmitResult
+    public suspend fun revokeRequest(): Result<Unit>
+}
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "ErasureRepository|SubmitErasure|DeleteAccount|onDeleteAccount|account_deleted|delete_account" technician-app/app/src/main/kotlin -n' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 661ms:
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:5:import com.homeservices.technician.domain.erasure.ErasureRepository
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:12:public class ErasureRepositoryImpl
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:16:    ) : ErasureRepository {
technician-app/app/src/main/kotlin\com\homeservices\technician\domain\erasure\ErasureRepository.kt:10:public interface ErasureRepository {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "kover|coverage|verify" technician-app/build.gradle.kts technician-app/app/build.gradle.kts -n' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1215ms:
technician-app/build.gradle.kts:10:    alias(libs.plugins.kover) apply false
technician-app/app/build.gradle.kts:115:    alias(libs.plugins.kover)
technician-app/app/build.gradle.kts:286:kover {
technician-app/app/build.gradle.kts:288:        verify {
technician-app/app/build.gradle.kts:295:                minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.LINE)
technician-app/app/build.gradle.kts:296:                // Branch coverage intentionally lower — Compose UI synthetic branches, Firebase
technician-app/app/build.gradle.kts:299:                minBound(55, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.BRANCH)
technician-app/app/build.gradle.kts:300:                minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.INSTRUCTION)
technician-app/app/build.gradle.kts:561:                    // coverage rather than generated serialisation plumbing.

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content technician-app/app/build.gradle.kts -TotalCount 360 | Select-Object -Skip 260 -First 70' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1170ms:
            "-Xjsr305=strict",
        )
    }
}

ktlint {
    version.set("1.3.1")
    android.set(true)
    ignoreFailures.set(false)
    reporters {
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.PLAIN)
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.CHECKSTYLE)
    }
}

detekt {
    toolVersion = libs.versions.detekt.get()
    config.setFrom(file("../detekt.yml"))
    buildUponDefaultConfig = true
    allRules = false
    autoCorrect = false
    ignoreFailures = false
    baseline = file("detekt-baseline.xml")
}

kover {
    reports {
        verify {
            rule {
                // E13-S02b (Wave 3, 2026-05-14): raised LINE + INSTRUCTION to 80% after
                // domain-layer test-writing pass + proper exclusion of TechnicianHomeScreenKt,
                // AuthScreenKt$*, LanguageSettingsScreenKt, and missing DI-module packages.
                // Actual at gate: lines=86.3%, branches=62.1%, instructions=85.1%.
                // Do NOT lower these further.
                minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.LINE)
                // Branch coverage intentionally lower â€” Compose UI synthetic branches, Firebase
                // SDK callbacks, and BiometricPrompt require instrumented tests (later story).
                // Raised from 35 â†’ 55 to reflect real improvement; target 69% deferred.
                minBound(55, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.BRANCH)
                minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.INSTRUCTION)
            }
        }
        filters {
            excludes {
                classes(
                    // Hilt & Dagger generated code
                    "*.Hilt_*",
                    "*.*_Factory",
                    "*.*_Factory\$*",
                    "*.*_Factory\$InstanceHolder",
                    "*.*_HiltModules*",
                    "*.*_HiltModules\$*",
                    "*.*_Impl",
                    "*.*_MembersInjector",
                    "*.*_GeneratedInjector",
                    "hilt_aggregated_deps.*",
                    "dagger.hilt.*",
                    // KSP-generated factories (pattern: ModuleName_ProvideXxxFactory)
                    "*.*_Provide*Factory*",
                    // Compose-generated lambdas & singletons
                    "*.ComposableSingletons*",
                    "*.ComposableSingletons\$*",
                    // Android/Build generated
                    "*.BuildConfig",
                    "*.R",
                    "*.R\$*",
                    // Excluded application entry-points (no unit tests possible without emulator)
                    "*.HomeservicesTechnicianApplication",
                    "*.MainActivity",
                    "*.MainActivity\$*",

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content technician-app/app/src/main/kotlin/com/homeservices/technician/data/payout/di/PayoutModule.kt; Write-Host '---'; Get-Content technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/di/EarningsModule.kt; Write-Host '---'; Get-Content technician-app/app/src/main/kotlin/com/homeservices/technician/data/shield/di/ShieldModule.kt" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1999ms:
package com.homeservices.technician.data.payout.di

import com.homeservices.technician.data.payout.PayoutRepositoryImpl
import com.homeservices.technician.data.payout.remote.PayoutApiService
import com.homeservices.technician.domain.payout.PayoutRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class PayoutModule {
    @Binds
    internal abstract fun bindPayoutRepository(impl: PayoutRepositoryImpl): PayoutRepository

    public companion object {
        @Provides
        @Singleton
        public fun providePayoutApiService(retrofit: Retrofit): PayoutApiService = retrofit.create(PayoutApiService::class.java)
    }
}
---
package com.homeservices.technician.data.earnings.di

import com.homeservices.technician.data.earnings.EarningsRepositoryImpl
import com.homeservices.technician.data.earnings.remote.EarningsApiService
import com.homeservices.technician.domain.earnings.EarningsRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class EarningsModule {
    @Binds
    internal abstract fun bindEarningsRepository(impl: EarningsRepositoryImpl): EarningsRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideEarningsApiService(retrofit: Retrofit): EarningsApiService = retrofit.create(EarningsApiService::class.java)
    }
}
---
package com.homeservices.technician.data.shield.di

import com.homeservices.technician.data.shield.ShieldRepositoryImpl
import com.homeservices.technician.data.shield.remote.ShieldApiService
import com.homeservices.technician.domain.shield.ShieldRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class ShieldModule {
    @Binds
    internal abstract fun bindShieldRepository(impl: ShieldRepositoryImpl): ShieldRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideShieldApiService(retrofit: Retrofit): ShieldApiService = retrofit.create(ShieldApiService::class.java)
    }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg \"RuntimeException\\(\" technician-app/app/src/main/kotlin -n | Select-Object -First 50; rg \"TooGenericException|exceptions\" technician-app/detekt.yml technician-app/app/detekt-baseline.xml -n | Select-Object -First 100" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 905ms:
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:43:                    throw RuntimeException("Revoke failed: HTTP ${response.code()}")
technician-app/app/src/main/kotlin\com\homeservices\technician\data\activeJob\ActiveJobRepositoryImpl.kt:91:                    Result.failure(RuntimeException("Transition failed: HTTP ${response.code()}"))
technician-app/app/src/main/kotlin\com\homeservices\technician\domain\jobOffer\AcceptJobOfferUseCase.kt:20:                else -> throw RuntimeException("Accept offer failed: HTTP ${response.code()}")
technician-app/app/detekt-baseline.xml:43:    <ID>FunctionMaxLength:FirebaseOtpUseCaseTest.kt$FirebaseOtpUseCaseTest$@Test public fun `signInWithCredential emits General error for unexpected exceptions`(): Unit</ID>
technician-app/app/detekt-baseline.xml:215:    <ID>TooGenericExceptionCaught:ActiveJobRepositoryImpl.kt$ActiveJobRepositoryImpl$e: Exception</ID>
technician-app/app/detekt-baseline.xml:216:    <ID>TooGenericExceptionCaught:FirebaseTokenAuthenticator.kt$FirebaseTokenAuthenticator$e: Exception</ID>
technician-app/app/detekt-baseline.xml:217:    <ID>TooGenericExceptionCaught:IdTokenCache.kt$IdTokenCache$e: Exception</ID>
technician-app/app/detekt-baseline.xml:218:    <ID>TooGenericExceptionCaught:KycRepositoryImpl.kt$KycRepositoryImpl$e: Exception</ID>
technician-app/app/detekt-baseline.xml:219:    <ID>TooGenericExceptionCaught:OutboxSyncWorker.kt$OutboxSyncWorker$e: Exception</ID>
technician-app/app/detekt-baseline.xml:220:    <ID>TooGenericExceptionCaught:SessionPrefsMigrator.kt$SessionPrefsMigrator$e: Exception</ID>
technician-app/app/detekt-baseline.xml:221:    <ID>TooGenericExceptionCaught:ShieldRepositoryImpl.kt$ShieldRepositoryImpl$e: Exception</ID>
technician-app/app/detekt-baseline.xml:222:    <ID>TooGenericExceptionThrown:AcceptJobOfferUseCase.kt$AcceptJobOfferUseCase$throw RuntimeException("Accept offer failed: HTTP ${response.code()}")</ID>

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path technician-app/detekt.yml -Pattern "TooGenericExceptionThrown|TooGenericExceptionCaught|exceptions" -Context 2,5' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1972ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command ".\\gradlew.bat :app:detekt --no-daemon --stacktrace" in C:\Alok\Business Projects\Urbanclap-dup\technician-app
2026-05-23T00:33:29.696486Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 1.7 seconds
Output:
Exception in thread "main" java.lang.RuntimeException: Could not create parent directory for lock file C:\Users\CodexSandboxOffline\.gradle\wrapper\dists\gradle-8.11-bin\c4te04g51qsyw1bxcb929u7br\gradle-8.11-bin.zip.lck
	at org.gradle.wrapper.GradleWrapperMain.main(SourceFile:65)

 exited 1 in 1677ms:
Exception in thread "main" java.lang.RuntimeException: Could not create parent directory for lock file C:\Users\CodexSandboxOffline\.gradle\wrapper\dists\gradle-8.11-bin\c4te04g51qsyw1bxcb929u7br\gradle-8.11-bin.zip.lck
	at org.gradle.wrapper.GradleWrapperMain.main(SourceFile:65)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Path .gradle\\wrapper\\dists -Recurse -Depth 3 -ErrorAction SilentlyContinue | Select-Object FullName | Select-Object -First 20" in C:\Alok\Business Projects\Urbanclap-dup\technician-app
 succeeded in 2364ms:

FullName                                                                                                               
--------                                                                                                               
C:\Alok\Business Projects\Urbanclap-dup\technician-app\.gradle\wrapper\dists\gradle-8.11-bin                           
C:\Alok\Business Projects\Urbanclap-dup\technician-app\.gradle\wrapper\dists\gradle-8.11-bin\c4te04g51qsyw1bxcb929u7br 
C:\Alok\Business Projects\Urbanclap-dup\technician-app\.gradle\wrapper\dists\gradle-8.11-bin\c4te04g51qsyw1bxcb929u7...
C:\Alok\Business Projects\Urbanclap-dup\technician-app\.gradle\wrapper\dists\gradle-8.11-bin\c4te04g51qsyw1bxcb929u7...



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$env:GRADLE_USER_HOME=(Resolve-Path '"'.gradle').Path; .\\gradlew.bat :app:detekt --no-daemon --offline --stacktrace" in C:\Alok\Business Projects\Urbanclap-dup\technician-app
2026-05-23T00:33:48.383001Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 10.1 seconds
Output:
Downloading https://services.gradle.org/distributions/gradle-8.11-bin.zip

Exception in thread "main" java.net.SocketException: Permission denied: getsockopt
	at java.base/sun.nio.ch.Net.pollConnect(Native Method)
	at java.base/sun.nio.ch.Net.pollConnectNow(Net.java:694)
	at java.base/sun.nio.ch.NioSocketImpl.timedFinishConnect(NioSocketImpl.java:542)
	at java.base/sun.nio.ch.NioSocketImpl.connect(NioSocketImpl.java:592)
	at java.base/java.net.SocksSocketImpl.connect(SocksSocketImpl.java:327)
	at java.base/java.net.Socket.connect(Socket.java:751)
	at java.base/sun.security.ssl.SSLSocketImpl.connect(SSLSocketImpl.java:304)
	at java.base/sun.net.NetworkClient.doConnect(NetworkClient.java:178)
	at java.base/sun.net.www.http.HttpClient.openServer(HttpClient.java:531)
	at java.base/sun.net.www.http.HttpClient.openServer(HttpClient.java:636)
	at java.base/sun.net.www.protocol.https.HttpsClient.<init>(HttpsClient.java:264)
	at java.base/sun.net.www.protocol.https.HttpsClient.New(HttpsClient.java:377)
	at java.base/sun.net.www.protocol.https.AbstractDelegateHttpsURLConnection.getNewHttpClient(AbstractDelegateHttpsURLConnection.java:193)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.plainConnect0(HttpURLConnection.java:1257)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.plainConnect(HttpURLConnection.java:1143)
	at java.base/sun.net.www.protocol.https.AbstractDelegateHttpsURLConnection.connect(AbstractDelegateHttpsURLConnection.java:179)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.getInputStream0(HttpURLConnection.java:1705)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.getInputStream(HttpURLConnection.java:1629)
	at java.base/sun.net.www.protocol.https.HttpsURLConnectionImpl.getInputStream(HttpsURLConnectionImpl.java:223)
	at org.gradle.wrapper.Install.forceFetch(SourceFile:2)
	at org.gradle.wrapper.Install$1.call(SourceFile:8)
	at org.gradle.wrapper.GradleWrapperMain.main(SourceFile:67)

 exited 1 in 10100ms:
Downloading https://services.gradle.org/distributions/gradle-8.11-bin.zip

Exception in thread "main" java.net.SocketException: Permission denied: getsockopt
	at java.base/sun.nio.ch.Net.pollConnect(Native Method)
	at java.base/sun.nio.ch.Net.pollConnectNow(Net.java:694)
	at java.base/sun.nio.ch.NioSocketImpl.timedFinishConnect(NioSocketImpl.java:542)
	at java.base/sun.nio.ch.NioSocketImpl.connect(NioSocketImpl.java:592)
	at java.base/java.net.SocksSocketImpl.connect(SocksSocketImpl.java:327)
	at java.base/java.net.Socket.connect(Socket.java:751)
	at java.base/sun.security.ssl.SSLSocketImpl.connect(SSLSocketImpl.java:304)
	at java.base/sun.net.NetworkClient.doConnect(NetworkClient.java:178)
	at java.base/sun.net.www.http.HttpClient.openServer(HttpClient.java:531)
	at java.base/sun.net.www.http.HttpClient.openServer(HttpClient.java:636)
	at java.base/sun.net.www.protocol.https.HttpsClient.<init>(HttpsClient.java:264)
	at java.base/sun.net.www.protocol.https.HttpsClient.New(HttpsClient.java:377)
	at java.base/sun.net.www.protocol.https.AbstractDelegateHttpsURLConnection.getNewHttpClient(AbstractDelegateHttpsURLConnection.java:193)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.plainConnect0(HttpURLConnection.java:1257)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.plainConnect(HttpURLConnection.java:1143)
	at java.base/sun.net.www.protocol.https.AbstractDelegateHttpsURLConnection.connect(AbstractDelegateHttpsURLConnection.java:179)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.getInputStream0(HttpURLConnection.java:1705)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.getInputStream(HttpURLConnection.java:1629)
	at java.base/sun.net.www.protocol.https.HttpsURLConnectionImpl.getInputStream(HttpsURLConnectionImpl.java:223)
	at org.gradle.wrapper.Install.forceFetch(SourceFile:2)
	at org.gradle.wrapper.Install$1.call(SourceFile:8)
	at org.gradle.wrapper.GradleWrapperMain.main(SourceFile:67)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
from pathlib import Path
files=['technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt','technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt']
for f in files:
    print(f)
    for i,l in enumerate(Path(f).read_text().splitlines(),1):
        if len(l)>120:
            print(i,len(l),l)
'@ | python -" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 5177ms:
technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ActiveJobRepositoryImpl.kt -TotalCount 180; Write-Host '--- shield'; Get-Content technician-app/app/src/main/kotlin/com/homeservices/technician/data/shield/ShieldRepositoryImpl.kt -TotalCount 140" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 4611ms:
package com.homeservices.technician.data.activeJob

import com.homeservices.technician.data.activeJob.db.ActiveJobDao
import com.homeservices.technician.data.activeJob.db.PendingTransitionEntity
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import com.homeservices.technician.domain.location.CurrentLocationProvider
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class ActiveJobRepositoryImpl
    @Inject
    internal constructor(
        private val api: ActiveJobApiService,
        private val dao: ActiveJobDao,
        private val currentLocationProvider: CurrentLocationProvider,
    ) : ActiveJobRepository {
        private val _activeJobState = MutableStateFlow<ActiveJob?>(null)

        override val activeJobState: StateFlow<ActiveJob?> = _activeJobState.asStateFlow()

        /**
         * Returns a flow that emits each non-null value from [activeJobState].
         * Calling [startObserving] before collecting ensures an initial fetch is performed.
         */
        override fun getActiveJob(bookingId: String): Flow<ActiveJob> =
            _activeJobState
                .filterNotNull()
                .filter { it.bookingId == bookingId }

        /** One-shot HTTP fetch to prime [activeJobState]. Called by the foreground service on start. */
        override suspend fun startObserving(bookingId: String) {
            val response = api.getActiveJob(bookingId)
            if (response.isSuccessful) {
                response.body()?.let { _activeJobState.value = it.toDomain() }
            }
        }

        /** Updates the in-memory state from an FCM JOB_UPDATE payload. */
        override fun updateFromFcm(job: ActiveJob) {
            _activeJobState.value = job
        }

        override val hasPendingTransitions: Flow<Boolean> =
            dao.getPendingFlow().map { it.isNotEmpty() }

        override suspend fun transitionStatus(
            bookingId: String,
            targetStatus: ActiveJobStatus,
            integrityToken: String?,
        ): Result<ActiveJob> =
            try {
                val locationWithFidelity =
                    runCatching { currentLocationProvider.currentLocation() }.getOrNull()
                val response =
                    api.transitionStatus(
                        bookingId,
                        TransitionRequest(
                            targetStatus = targetStatus.name,
                            currentLocation = locationWithFidelity?.latLng?.toDto(),
                            attestation =
                                locationWithFidelity?.fidelity?.let {
                                    LocationAttestationDto(
                                        isMock = it.isMock,
                                        gpsAccuracyM = it.accuracyMetres,
                                    )
                                },
                        ),
                        integrityToken = integrityToken,
                    )
                if (response.isSuccessful) {
                    response.body()?.let { body ->
                        val job = body.toDomain()
                        _activeJobState.value = job
                        Result.success(job)
                    } ?: Result.failure(
                        IllegalStateException("Empty body on successful transition for $bookingId"),
                    )
                } else {
                    Result.failure(RuntimeException("Transition failed: HTTP ${response.code()}"))
                }
            } catch (e: Exception) {
                dao.insert(
                    PendingTransitionEntity(
                        id = UUID.randomUUID().toString(),
                        bookingId = bookingId,
                        targetStatus = targetStatus.name,
                        createdAt = System.currentTimeMillis(),
                    ),
                )
                Result.failure(e)
            }

        override suspend fun syncPendingTransitions() {
            val pending = dao.getPending()
            for (entry in pending) {
                try {
                    val response =
                        api.transitionStatus(
                            entry.bookingId,
                            TransitionRequest(entry.targetStatus),
                        )
                    if (response.isSuccessful || response.code() == 409) {
                        dao.delete(entry.id)
                    }
                } catch (_: Exception) {
                    // leave for next reconnect
                }
            }
        }

        private fun ActiveJobResponse.toDomain(): ActiveJob =
            ActiveJob(
                bookingId = id,
                customerId = customerId,
                serviceId = serviceId,
                serviceName = serviceName,
                addressText = addressText,
                addressLatLng = LatLng(addressLatLng.lat, addressLatLng.lng),
                status = ActiveJobStatus.valueOf(status),
                slotDate = slotDate,
                slotWindow = slotWindow,
            )

        private fun LatLng.toDto(): LatLngDto = LatLngDto(lat = lat, lng = lng)
    }
--- shield
package com.homeservices.technician.data.shield

import com.homeservices.technician.data.shield.remote.ShieldApiService
import com.homeservices.technician.data.shield.remote.dto.AppealQuotaErrorDto
import com.homeservices.technician.data.shield.remote.dto.RatingAppealRequestDto
import com.homeservices.technician.data.shield.remote.dto.ShieldReportRequestDto
import com.homeservices.technician.domain.shield.ShieldRepository
import com.homeservices.technician.domain.shield.model.RatingAppealResult
import com.homeservices.technician.domain.shield.model.ShieldReportResult
import com.squareup.moshi.Moshi
import javax.inject.Inject

public class ShieldRepositoryImpl
    @Inject
    constructor(
        private val api: ShieldApiService,
        private val moshi: Moshi,
    ) : ShieldRepository {
        public override suspend fun fileShieldReport(
            bookingId: String,
            description: String?,
        ): Result<ShieldReportResult> =
            runCatching {
                val resp = api.fileShieldReport(ShieldReportRequestDto(bookingId, description))
                if (!resp.isSuccessful) error("shield report failed: ${resp.code()}")
                val body = resp.body() ?: error("shield report succeeded with empty body")
                ShieldReportResult(body.complaintId)
            }

        public override suspend fun fileRatingAppeal(
            bookingId: String,
            reason: String,
        ): Result<RatingAppealResult> =
            try {
                val resp = api.fileRatingAppeal(RatingAppealRequestDto(bookingId, reason))
                when {
                    resp.code() == 409 -> {
                        val errorBody = resp.errorBody()?.string() ?: ""
                        val err =
                            try {
                                moshi.adapter(AppealQuotaErrorDto::class.java).fromJson(errorBody)
                            } catch (_: Exception) {
                                null
                            }
                        if (err?.code == "APPEAL_QUOTA_EXCEEDED") {
                            Result.success(
                                RatingAppealResult(quotaExceeded = true, nextAvailableAt = err.nextAvailableAt),
                            )
                        } else {
                            Result.failure(IllegalStateException("rating appeal failed: ${resp.code()}"))
                        }
                    }
                    !resp.isSuccessful ->
                        Result.failure(IllegalStateException("rating appeal failed: ${resp.code()}"))
                    else ->
                        resp.body()?.let { body ->
                            Result.success(RatingAppealResult(appealId = body.appealId))
                        } ?: Result.failure(
                            IllegalStateException("rating appeal succeeded with empty body"),
                        )
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
    }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/schemas/erasure-request.ts -TotalCount 220; rg "ERASURE_REQUEST_PENDING|USER_ALREADY_ERASED|ACTIVE_JOB_EXISTS|erasure-request" -n api/src api/openapi.json technician-app/app/src/main/kotlin | Select-Object -First 200' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 2407ms:
import { z } from 'zod';

export const ErasureRequestStatusEnum = z.enum([
  'PENDING',
  'EXECUTING',
  'EXECUTED',
  'REVOKED',
  'DENIED',
  'FAILED',
]);
export type ErasureRequestStatus = z.infer<typeof ErasureRequestStatusEnum>;

export const ErasureRequestUserRoleEnum = z.enum(['CUSTOMER', 'TECHNICIAN']);
export type ErasureRequestUserRole = z.infer<typeof ErasureRequestUserRoleEnum>;

export const ErasureRequestActionEnum = z.enum(['EXECUTE', 'DENY']);
export type ErasureRequestAction = z.infer<typeof ErasureRequestActionEnum>;

export const ErasureDenialReasonEnum = z.enum([
  'legal-hold',
  'regulatory-retention-conflict',
  'fraud-investigation',
]);
export type ErasureDenialReason = z.infer<typeof ErasureDenialReasonEnum>;

/** Per-container counts captured at EXECUTED time; auditor-visible. */
export const ErasureDeletedCountsSchema = z.object({
  bookings: z.number().int().nonnegative(),
  ratings: z.number().int().nonnegative(),
  complaints: z.number().int().nonnegative(),
  walletLedgerAnonymized: z.number().int().nonnegative(),
  bookingEventsAnonymized: z.number().int().nonnegative(),
  dispatchAttemptsAnonymized: z.number().int().nonnegative(),
  auditLogAnonymized: z.number().int().nonnegative(),
  technicianHardDeleted: z.boolean(),
  kycHardDeleted: z.boolean(),
  fcmTokensCleared: z.boolean(),
  /** Device-token collection docs removed from Cosmos (E19-S02). */
  deviceTokensCleared: z.boolean(),
});
export type ErasureDeletedCounts = z.infer<typeof ErasureDeletedCountsSchema>;

export const ErasureRequestDocSchema = z.object({
  id: z.string(),
  partitionKey: z.string(),
  userId: z.string().min(1),
  userRole: ErasureRequestUserRoleEnum,
  status: ErasureRequestStatusEnum,
  reason: z.string().max(1000).optional(),
  requestedAt: z.string(),
  scheduledDeletionAt: z.string(),
  /** Per-request salt; only mechanism that links anonymizedHash back to userId. */
  /**
   * Per-request salt (32 hex chars at submit time). Wiped to empty string on
   * EXECUTED so that the natural-person uid cannot be re-derived from the
   * surviving doc. Schema accepts empty so the post-erasure shape parses.
   */
  anonymizationSalt: z.string(),
  /** SHA-256(userId + salt); set at EXECUTING and retained for ops cross-reference. */
  anonymizedHash: z.string().optional(),
  /**
   * Set true on EXECUTED â€” userId has been replaced with anonymizedHash on
   * this doc so re-identification requires inputs no longer present.
   */
  userIdWiped: z.boolean().optional(),
  executedAt: z.string().optional(),
  revokedAt: z.string().optional(),
  deniedAt: z.string().optional(),
  denialReason: ErasureDenialReasonEnum.optional(),
  failedAt: z.string().optional(),
  failureReason: z.string().optional(),
  deletedCounts: ErasureDeletedCountsSchema.optional(),
});
export type ErasureRequestDoc = z.infer<typeof ErasureRequestDocSchema>;

/** Hardcoded confirmation phrase (case-sensitive). Defends against accidental deletion. */
export const ERASURE_CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

export const ErasureRequestSubmitBodySchema = z.object({
  reason: z.string().max(1000).optional(),
  confirmationPhrase: z.literal(ERASURE_CONFIRMATION_PHRASE),
});
export type ErasureRequestSubmitBody = z.infer<typeof ErasureRequestSubmitBodySchema>;

export const ErasureRequestSubmitResponseSchema = z.object({
  erasureId: z.string(),
  scheduledDeletionAt: z.string(),
  status: ErasureRequestStatusEnum,
});
export type ErasureRequestSubmitResponse = z.infer<typeof ErasureRequestSubmitResponseSchema>;

export const AdminErasureExecuteBodySchema = z.object({
  action: z.literal('EXECUTE'),
});

export const AdminErasureDenyBodySchema = z.object({
  action: z.literal('DENY'),
  reason: ErasureDenialReasonEnum,
});

export const AdminErasurePatchBodySchema = z.discriminatedUnion('action', [
  AdminErasureExecuteBodySchema,
  AdminErasureDenyBodySchema,
]);
export type AdminErasurePatchBody = z.infer<typeof AdminErasurePatchBodySchema>;

/** Grace period (DPDP cool-off): 7 days from request to scheduled deletion. */
export const ERASURE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;
api/openapi.json:3003:    "/v1/admin/erasure-requests": {
api/openapi.json:3065:    "/v1/admin/erasure-requests/{id}": {
api/src\openapi\registry.ts:34:} from '../schemas/erasure-request.js';
api/src\openapi\registry.ts:443:  method: 'get', path: '/v1/admin/erasure-requests', operationId: 'adminListErasureRequests',
api/src\openapi\registry.ts:458:  method: 'patch', path: '/v1/admin/erasure-requests/{id}', operationId: 'adminPatchErasureRequest',
api/src\cosmos\erasure-request-repository.ts:2:import { ErasureRequestDocSchema } from '../schemas/erasure-request.js';
api/src\cosmos\erasure-request-repository.ts:3:import type { ErasureRequestDoc } from '../schemas/erasure-request.js';
api/src\cosmos\erasure-request-repository.ts:13:  constructor() { super('ERASURE_REQUEST_PENDING'); }
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\remote\ErasureApiService.kt:9:    @POST("v1/users/me/erasure-request")
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\remote\ErasureApiService.kt:14:    @DELETE("v1/users/me/erasure-request")
technician-app/app/src/main/kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:29:                        if (raw.contains("ACTIVE_JOB_EXISTS")) {
api/src\services\erasureCascade.service.ts:4:import type { ErasureDeletedCounts, ErasureRequestDoc } from '../schemas/erasure-request.js';
api/src\functions\users-erasure-request.ts:13:} from '../cosmos/erasure-request-repository.js';
api/src\functions\users-erasure-request.ts:18:} from '../schemas/erasure-request.js';
api/src\functions\users-erasure-request.ts:19:import type { ErasureRequestDoc } from '../schemas/erasure-request.js';
api/src\functions\users-erasure-request.ts:49:      return { status: 409, jsonBody: { code: 'ACTIVE_JOB_EXISTS' } };
api/src\functions\users-erasure-request.ts:94:      return { status: 409, jsonBody: { code: 'ERASURE_REQUEST_PENDING', erasureId: existing.id } };
api/src\functions\users-erasure-request.ts:97:      return { status: 409, jsonBody: { code: 'USER_ALREADY_ERASED' } };
api/src\functions\users-erasure-request.ts:165:  route: 'v1/users/me/erasure-request',
api/src\functions\users-erasure-request.ts:172:  route: 'v1/users/me/erasure-request',
api/src\functions\trigger-erasure-deadline.ts:9:} from '../cosmos/erasure-request-repository.js';
api/src\functions\trigger-erasure-deadline.ts:16:import type { ErasureRequestDoc } from '../schemas/erasure-request.js';
api/src\functions\admin\erasure-requests\patch.ts:37:  route: 'v1/admin/erasure-requests/{id}',
api/src\functions\admin\erasure-requests\deny.ts:3:import { AdminErasureDenyBodySchema } from '../../../schemas/erasure-request.js';
api/src\functions\admin\erasure-requests\deny.ts:7:} from '../../../cosmos/erasure-request-repository.js';
api/src\functions\admin\erasure-requests\deny.ts:10:import type { ErasureRequestDoc } from '../../../schemas/erasure-request.js';
api/src\functions\admin\erasure-requests\list.ts:6:import { listErasureRequests } from '../../../cosmos/erasure-request-repository.js';
api/src\functions\admin\erasure-requests\list.ts:7:import { ErasureRequestStatusEnum } from '../../../schemas/erasure-request.js';
api/src\functions\admin\erasure-requests\list.ts:40:  route: 'v1/admin/erasure-requests',
api/src\functions\admin\erasure-requests\execute.ts:4:import { AdminErasureExecuteBodySchema } from '../../../schemas/erasure-request.js';
api/src\functions\admin\erasure-requests\execute.ts:8:} from '../../../cosmos/erasure-request-repository.js';
api/src\functions\admin\erasure-requests\execute.ts:14:import type { ErasureRequestDoc } from '../../../schemas/erasure-request.js';

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "users/me/erasure|erasure-request" api/src/openapi api/openapi.json -n' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 6462ms:
api/openapi.json:3003:    "/v1/admin/erasure-requests": {
api/openapi.json:3065:    "/v1/admin/erasure-requests/{id}": {
api/src/openapi\registry.ts:34:} from '../schemas/erasure-request.js';
api/src/openapi\registry.ts:443:  method: 'get', path: '/v1/admin/erasure-requests', operationId: 'adminListErasureRequests',
api/src/openapi\registry.ts:458:  method: 'patch', path: '/v1/admin/erasure-requests/{id}', operationId: 'adminPatchErasureRequest',

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content api/src/functions/dispatch-attempt.ts -TotalCount 220; Write-Host '--- active'; Get-Content api/src/functions/active-job.ts -TotalCount 200" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1746ms:
--- active
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { type HttpHandler, type InvocationContext, app } from '@azure/functions';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { requireIntegrity } from '../middleware/requireIntegrity.js';
import { bookingRepo, updateBookingFields } from '../cosmos/booking-repository.js';
import { bookingEventRepo } from '../cosmos/booking-event-repository.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { haversine } from '../cosmos/geo.js';
import { sendBookingStatusUpdatePush, sendLocationUpdatePush } from '../services/fcm.service.js';
import type { BookingDoc as _BookingDoc } from '../schemas/booking.js';
import { normalizeAddressText } from '../shared/address-text.js';

const TRANSITION_ORDER = ['ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED'] as const;
const AVG_CITY_SPEED_KMH = 20;
type TransitionStatus = (typeof TRANSITION_ORDER)[number];

function isLegalTransition(from: string, to: string): boolean {
  const fromIdx = TRANSITION_ORDER.indexOf(from as TransitionStatus);
  const toIdx = TRANSITION_ORDER.indexOf(to as TransitionStatus);
  return fromIdx !== -1 && toIdx === fromIdx + 1;
}

const TransitionBodySchema = z.object({
  targetStatus: z.enum(['EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED']),
  currentLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  attestation: z.object({
    isMock: z.boolean(),
    gpsAccuracyM: z.number(),
  }).optional(),
});

export const getActiveJobHandler: HttpHandler = async (req, _ctx: InvocationContext) => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };

  const service = await catalogueRepo.getServiceByIdCrossPartition(booking.serviceId);

  return {
    status: 200,
    jsonBody: {
      bookingId: booking.id,
      customerId: booking.customerId,
      serviceId: booking.serviceId,
      serviceName: service?.name ?? '',
      addressText: normalizeAddressText(booking.addressText),
      addressLatLng: booking.addressLatLng,
      status: booking.status,
      slotDate: booking.slotDate,
      slotWindow: booking.slotWindow,
    },
  };
};

export const transitionStatusHandler: HttpHandler = async (req, ctx: InvocationContext) => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };

  let body: z.infer<typeof TransitionBodySchema>;
  try {
    const raw: unknown = await req.json();
    const result = TransitionBodySchema.safeParse(raw);
    if (!result.success) {
      return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: result.error.issues } };
    }
    body = result.data;
  } catch {
    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
  }

  if (!isLegalTransition(booking.status, body.targetStatus)) {
    return {
      status: 409,
      jsonBody: { code: 'ILLEGAL_TRANSITION', from: booking.status, to: body.targetStatus },
    };
  }

  // Warn in Sentry if the technician's device reported a mock/spoofed GPS fix.
  // Non-blocking: we allow the transition through and flag for investigation.
  if (body.attestation?.isMock === true) {
    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      scope.setExtras({ bookingId, technicianId: uid, gpsAccuracyM: body.attestation!.gpsAccuracyM });
      Sentry.captureMessage('MARK_REACHED with mock location');
    });
  }

  const updated = await updateBookingFields(bookingId, {
    status: body.targetStatus,
    ...(body.targetStatus === 'COMPLETED' ? { completedAt: new Date().toISOString() } : {}),
  });
  if (!updated) return { status: 500, jsonBody: { code: 'UPDATE_FAILED' } };

  await bookingEventRepo.append({
    bookingId,
    event: 'STATUS_TRANSITION',
    technicianId: uid,
    metadata: { from: booking.status, to: body.targetStatus },
  });

  await sendBookingStatusUpdatePush({
    customerId: updated.customerId,
    bookingId,
    status: updated.status,
  }).catch((err: unknown) => ctx.error('FCM BOOKING_STATUS_UPDATE failed', err));
  if (body.currentLocation) {
    const etaMinutes = Math.max(
      0,
      Math.round(
        (haversine(
          body.currentLocation.lat,
          body.currentLocation.lng,
          updated.addressLatLng.lat,
          updated.addressLatLng.lng,
        ) / AVG_CITY_SPEED_KMH) * 60,
      ),
    );
    await sendLocationUpdatePush({
      customerId: updated.customerId,
      bookingId,
      lat: body.currentLocation.lat,
      lng: body.currentLocation.lng,
      etaMinutes,
    }).catch((err: unknown) => ctx.error('FCM LOCATION_UPDATE failed', err));
  }

  const service = await catalogueRepo.getServiceByIdCrossPartition(updated.serviceId);

  return {
    status: 200,
    jsonBody: {
      bookingId: updated.id,
      customerId: updated.customerId,
      serviceId: updated.serviceId,
      serviceName: service?.name ?? '',
      addressText: normalizeAddressText(updated.addressText),
      addressLatLng: updated.addressLatLng,
      status: updated.status,
      slotDate: updated.slotDate,
      slotWindow: updated.slotWindow,
    },
  };
};

app.http('getActiveJob', {
  route: 'v1/technicians/active-job/{bookingId}',
  methods: ['GET'],
  handler: getActiveJobHandler,
});

app.http('transitionActiveJobStatus', {
  route: 'v1/technicians/active-job/{bookingId}/transition',
  methods: ['PATCH'],
  // requireIntegrity is applied to the REACHED (and all) status transitions.
  // Non-strict by default: absent/invalid token warns to Sentry but allows through.
  // Set PLAY_INTEGRITY_STRICT=true in production to enforce rejection.
  handler: requireIntegrity(transitionStatusHandler),
});
Get-Content : Cannot find path 'C:\Alok\Business Projects\Urbanclap-dup\api\src\functions\dispatch-attempt.ts' because 
it does not exist.
At line:2 char:1
+ Get-Content api/src/functions/dispatch-attempt.ts -TotalCount 220; Wr ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (C:\Alok\Busines...atch-attempt.ts:String) [Get-Content], ItemNotFoundEx 
   ception
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetContentCommand
 

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "accept|decline|dispatch" api/src/functions api/src/services -n | Select-Object -First 100' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3627ms:
api/src/functions\bookings.ts:18:import { dispatcherService } from '../services/dispatcher.service.js';
api/src/functions\bookings.ts:305:    dispatcherService.triggerDispatch(booking.id).catch((err: unknown) => {
api/src/functions\bookings.ts:307:      console.error('[createBooking] cash-on-service dispatch failed', { bookingId: booking.id, err });
api/src/functions\bookings.ts:341:    dispatcherService.triggerDispatch(booking.id).catch((err: unknown) => {
api/src/functions\bookings.ts:343:      console.error('[createBooking] manual-payment dispatch failed', { bookingId: booking.id, err });
api/src/functions\bookings.ts:464:    dispatcherService.triggerDispatch(booking.id).catch((err: unknown) => {
api/src/functions\bookings.ts:466:      console.error('[createBooking] credit-full dispatch failed', { bookingId: booking.id, err });
api/src/functions\bookings.ts:518:        // idempotent on order ID because the receipt is unique per attempt — acceptable).
api/src/functions\admin\erasure-requests\patch.ts:10: * Single PATCH dispatcher: parses body once (Azure Functions HttpRequest body
api/src/functions\admin\complaints\patch.ts:124:    const dispatchPush = () =>
api/src/functions\admin\complaints\patch.ts:133:      .then(dispatchPush)
api/src/functions\job-offers.ts:5:import { dispatchAttemptRepo } from '../cosmos/dispatch-attempt-repository.js';
api/src/functions\job-offers.ts:9:import { dispatcherService } from '../services/dispatcher.service.js';
api/src/functions\job-offers.ts:11:import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';
api/src/functions\job-offers.ts:13:export async function acceptJobOfferHandler(
api/src/functions\job-offers.ts:27:  const attempt = await dispatchAttemptRepo.getByBookingId(bookingId);
api/src/functions\job-offers.ts:38:  const accepted = await dispatchAttemptRepo.acceptAttempt(attempt.id, bookingId);
api/src/functions\job-offers.ts:39:  if (!accepted) {
api/src/functions\job-offers.ts:59:export async function declineJobOfferHandler(
api/src/functions\job-offers.ts:73:  const attempt = await dispatchAttemptRepo.getByBookingId(bookingId);
api/src/functions\job-offers.ts:76:      ? await dispatchAttemptRepo.declineAttempt(attempt.id, bookingId)
api/src/functions\job-offers.ts:79:      await dispatcherService.continueDispatchAfterOfferOutcome(bookingId, attempt.technicianIds);
api/src/functions\job-offers.ts:117:        await dispatcherService.continueDispatchAfterOfferOutcome(attempt.bookingId, attempt.technicianIds);
api/src/functions\job-offers.ts:125:app.http('acceptJobOffer', {
api/src/functions\job-offers.ts:126:  route: 'v1/technicians/job-offers/{bookingId}/accept',
api/src/functions\job-offers.ts:129:  handler: acceptJobOfferHandler,
api/src/functions\job-offers.ts:132:app.http('declineJobOffer', {
api/src/functions\job-offers.ts:133:  route: 'v1/technicians/job-offers/{bookingId}/decline',
api/src/functions\job-offers.ts:136:  handler: declineJobOfferHandler,
api/src/functions\webhooks.ts:8:import { dispatcherService } from '../services/dispatcher.service.js';
api/src/functions\webhooks.ts:152:  dispatcherService.triggerDispatch(booking.id).catch(() => {
api/src/functions\webhooks.ts:153:    // fire-and-forget — dispatch failure does not fail the webhook ack
api/src/functions\trigger-dispatch-retry.ts:5:import { dispatcherService } from '../services/dispatcher.service.js';
api/src/functions\trigger-dispatch-retry.ts:12:    const result = await dispatcherService.retryAwaitingDispatch();
api/src/functions\trigger-dispatch-retry.ts:13:    ctx.log(`retryAwaitingDispatch: checked=${result.checked} dispatched=${result.dispatched}`);
api/src/services\featureFlags.service.ts:20: * Returns true when bookings should be accepted.
api/src/functions\trigger-rating-prompt.ts:14:export async function dispatchRatingPrompt(
api/src/functions\trigger-rating-prompt.ts:48:    for (const doc of docs) await dispatchRatingPrompt(doc, context);
api/src/services\fcm.service.ts:318:  // filedBy is a role enum value, not a userId — acceptable in owner_alerts topic.
api/src/functions\trigger-no-show-detector.ts:8:import { dispatcherService } from '../services/dispatcher.service.js';
api/src/functions\trigger-no-show-detector.ts:49:    // a prior run that wrote credit + status but crashed before redispatch can recover.
api/src/functions\trigger-no-show-detector.ts:97:    // `noShowRedispatchAt` is set after successful offers-sent.
api/src/functions\trigger-no-show-detector.ts:100:    // is known, the redispatch already resolved — skip entirely.
api/src/functions\trigger-no-show-detector.ts:104:      // If replacement tech accepted, redispatch already resolved.
api/src/functions\trigger-no-show-detector.ts:125:      // noShowRedispatchAt present → redispatch already fired; only push may be pending
api/src/functions\trigger-no-show-detector.ts:126:      if (liveBooking?.noShowRedispatchAt && liveBooking.noShowPushSentAt) {
api/src/functions\trigger-no-show-detector.ts:127:        // Both redispatch and push done — nothing left to do
api/src/functions\trigger-no-show-detector.ts:136:    // Track success: if this fails, noShowRedispatchAt must NOT be set so recovery retries.
api/src/functions\trigger-no-show-detector.ts:156:    // ── Step 2: Redispatch ────────────────────────────────────────────────────────
api/src/functions\trigger-no-show-detector.ts:157:    // Only when status write succeeded (dispatcher checks for NO_SHOW_REDISPATCH status).
api/src/functions\trigger-no-show-detector.ts:158:    // Skip if noShowRedispatchAt already set (recovery: prior run completed this step).
api/src/functions\trigger-no-show-detector.ts:161:    let redispatchOk = false;
api/src/functions\trigger-no-show-detector.ts:162:    if (statusWriteOk && !freshBooking.noShowRedispatchAt) {
api/src/functions\trigger-no-show-detector.ts:163:      // Re-read before dispatching: a concurrent invocation or a prior crash may have already
api/src/functions\trigger-no-show-detector.ts:164:      // moved the booking to SEARCHING without writing noShowRedispatchAt.
api/src/functions\trigger-no-show-detector.ts:166:      if (preDispatchDoc?.noShowRedispatchAt) {
api/src/functions\trigger-no-show-detector.ts:168:        redispatchOk = true;
api/src/functions\trigger-no-show-detector.ts:169:        ctx.log(`detectNoShows: redispatch already completed concurrently for ${booking.id}`);
api/src/functions\trigger-no-show-detector.ts:171:        // Prior run called redispatch() (moving the booking to SEARCHING) but crashed before
api/src/functions\trigger-no-show-detector.ts:172:        // writing noShowRedispatchAt. The dispatch attempt is live — just write the timestamp.
api/src/functions\trigger-no-show-detector.ts:173:        await updateBookingFields(booking.id, { noShowRedispatchAt: new Date().toISOString() });
api/src/functions\trigger-no-show-detector.ts:174:        redispatchOk = true;
api/src/functions\trigger-no-show-detector.ts:178:        ctx.log(`detectNoShows: recovery — booking ${booking.id} already SEARCHING, completing noShowRedispatchAt write`);
api/src/functions\trigger-no-show-detector.ts:181:          redispatchOk = await dispatcherService.redispatch(booking.id, NO_SHOW_REDISPATCH_RADIUS_KM, noShowTechId);
api/src/functions\trigger-no-show-detector.ts:182:          if (redispatchOk) {
api/src/functions\trigger-no-show-detector.ts:183:            await updateBookingFields(booking.id, { noShowRedispatchAt: new Date().toISOString() });
api/src/functions\trigger-no-show-detector.ts:188:            // Guard: dispatcher.redispatch() returns false both when no candidates exist AND when a
api/src/functions\trigger-no-show-detector.ts:190:            // or ASSIGNED). Only emit BOOKING_UNFULFILLED when the dispatcher actually set the status
api/src/functions\trigger-no-show-detector.ts:200:          ctx.log(`detectNoShows: redispatch failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
api/src/functions\trigger-no-show-detector.ts:203:    } else if (freshBooking.noShowRedispatchAt) {
api/src/functions\trigger-no-show-detector.ts:204:      // Redispatch was already done on a prior run — mark ok for logging
api/src/functions\trigger-no-show-detector.ts:205:      redispatchOk = true;
api/src/functions\trigger-no-show-detector.ts:206:      ctx.log(`detectNoShows: redispatch already completed for ${booking.id}`);
api/src/functions\trigger-no-show-detector.ts:226:    void redispatchOk; // consumed above for logging
api/src/services\erasureCascade.service.ts:39:    dispatchAttemptsAnonymized,
api/src/services\erasureCascade.service.ts:77:    dispatchAttemptsAnonymized,
api/src/functions\trigger-projector-dispatch-attempts.ts:4: * Source: dispatch_attempts container (NOT job_offers).
api/src/functions\trigger-projector-dispatch-attempts.ts:5: * Triggers: dispatch_attempts container change feed.
api/src/functions\trigger-projector-dispatch-attempts.ts:21:import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';
api/src/functions\trigger-projector-dispatch-attempts.ts:34:    ctx?.warn(`[trigger-projector-dispatch-attempts] Skipping doc ${attemptId}: missing fields`);
api/src/functions\trigger-projector-dispatch-attempts.ts:49:          expiresAt, // inherit from dispatch attempt
api/src/functions\trigger-projector-dispatch-attempts.ts:59:          await emitFcmForAction(upserted, 'dispatch_attempts');
api/src/functions\trigger-projector-dispatch-attempts.ts:79:          ctx?.warn(`[trigger-projector-dispatch-attempts] Could not expire JOB_OFFER for tech ${technicianId}: ${String(err)}`);
api/src/functions\trigger-projector-dispatch-attempts.ts:91:  containerName: 'dispatch_attempts',
api/src/functions\trigger-projector-dispatch-attempts.ts:92:  leaseContainerName: 'pending_actions_dispatch_leases',
api/src/functions\trigger-projector-dispatch-attempts.ts:102:          ctx.error('[trigger-projector-dispatch-attempts] Retryable error — rethrowing for runtime retry', String(err));
api/src/functions\trigger-projector-dispatch-attempts.ts:105:        ctx.error('[trigger-projector-dispatch-attempts] Non-retryable error — swallowing to advance checkpoint', String(err));
api/src/services\pending-action-projector.ts:183: * Mark a pending action as EXPIRED (e.g., dispatch_attempts TTL elapsed).
api/src/services\dispatcher.service.ts:6:import { dispatchAttemptRepo } from '../cosmos/dispatch-attempt-repository.js';
api/src/services\dispatcher.service.ts:11:import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';
api/src/services\dispatcher.service.ts:47:      // Operator policy (Ayodhya pilot): secondary sort is rating only — decline history must never be used
api/src/services\dispatcher.service.ts:53:async function dispatchBookingToTechs(
api/src/services\dispatcher.service.ts:66:  // receive the same booking again via a redispatch.
api/src/services\dispatcher.service.ts:100:  // Transition to SEARCHING so the stale-booking reconciler can find stuck dispatches
api/src/services\dispatcher.service.ts:129:          dispatchAttemptId: attempt.id,
api/src/services\dispatcher.service.ts:141:export const dispatcherService = {
api/src/services\dispatcher.service.ts:148:    await dispatchBookingToTechs(bookingId, booking, DISPATCH_RADIUS_KM);
api/src/services\dispatcher.service.ts:151:  async retryAwaitingDispatch(limit = 100): Promise<{ checked: number; dispatched: number }> {
api/src/services\dispatcher.service.ts:153:    let dispatched = 0;
api/src/services\dispatcher.service.ts:155:      const previouslyAttempted = await dispatchAttemptRepo.getAttemptedTechnicianIds(booking.id);

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/job-offers.ts -TotalCount 160' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 2605ms:
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext, type Timer } from '@azure/functions';
import { getMessaging } from 'firebase-admin/messaging';
import type { Resource } from '@azure/cosmos';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { dispatchAttemptRepo } from '../cosmos/dispatch-attempt-repository.js';
import { bookingEventRepo } from '../cosmos/booking-event-repository.js';
import { updateBookingFields } from '../cosmos/booking-repository.js';
import { getDispatchAttemptsContainer } from '../cosmos/client.js';
import { dispatcherService } from '../services/dispatcher.service.js';
import { sendBookingStatusUpdatePush } from '../services/fcm.service.js';
import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';

export async function acceptJobOfferHandler(
  req: HttpRequest,
  ctx: InvocationContext,
): Promise<HttpResponseInit> {
  let technicianId: string;
  try {
    const { uid } = await verifyTechnicianToken(req);
    technicianId = uid;
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;

  const attempt = await dispatchAttemptRepo.getByBookingId(bookingId);
  if (!attempt) {
    return { status: 404, jsonBody: { code: 'OFFER_NOT_FOUND' } };
  }
  if (attempt.status !== 'PENDING' || new Date(attempt.expiresAt) <= new Date()) {
    return { status: 410, jsonBody: { code: 'OFFER_EXPIRED' } };
  }
  if (!attempt.technicianIds.includes(technicianId)) {
    return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  }

  const accepted = await dispatchAttemptRepo.acceptAttempt(attempt.id, bookingId);
  if (!accepted) {
    return { status: 409, jsonBody: { code: 'OFFER_ALREADY_TAKEN' } };
  }

  const updatedBooking = await updateBookingFields(bookingId, { status: 'ASSIGNED', technicianId });
  await bookingEventRepo.append({ event: 'TECH_ACCEPTED', technicianId, bookingId });
  if (updatedBooking) {
    await sendBookingStatusUpdatePush({
      customerId: updatedBooking.customerId,
      bookingId,
      status: updatedBooking.status,
    }).catch((err: unknown) => ctx.error('FCM BOOKING_STATUS_UPDATE failed', err));
  }

  const losingTechs = attempt.technicianIds.filter(id => id !== technicianId);
  void notifyLosingTechs(losingTechs, bookingId);

  return { status: 200, jsonBody: { bookingId, status: 'ASSIGNED' } };
}

export async function declineJobOfferHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  let technicianId: string;
  try {
    const { uid } = await verifyTechnicianToken(req);
    technicianId = uid;
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;

  const attempt = await dispatchAttemptRepo.getByBookingId(bookingId);
  if (attempt?.technicianIds.includes(technicianId) && attempt.status !== 'ACCEPTED') {
    const terminalAttempt = attempt.status === 'PENDING'
      ? await dispatchAttemptRepo.declineAttempt(attempt.id, bookingId)
      : attempt;
    if (terminalAttempt) {
      await dispatcherService.continueDispatchAfterOfferOutcome(bookingId, attempt.technicianIds);
    }
  }

  await bookingEventRepo.append({ event: 'TECH_DECLINED', technicianId, bookingId });

  return { status: 200, jsonBody: { bookingId, status: 'DECLINED' } };
}

async function notifyLosingTechs(techIds: string[], bookingId: string): Promise<void> {
  const messaging = getMessaging();
  await Promise.allSettled(
    techIds.map(techId =>
      messaging.send({
        topic: `tech_${techId}`,
        data: { type: 'OFFER_CANCELLED', bookingId },
      })
    )
  );
}

async function expireStaleOffers(_timer: Timer, _ctx: InvocationContext): Promise<void> {
  const container = getDispatchAttemptsContainer();
  const { resources } = await container.items
    .query<DispatchAttemptDoc & Resource>({
      query: `SELECT * FROM c WHERE c.status = 'PENDING' AND c.expiresAt < @now`,
      parameters: [{ name: '@now', value: new Date().toISOString() }],
    })
    .fetchAll();

  await Promise.allSettled(
    resources.map(async attempt => {
      try {
        await container.item(attempt.id, attempt.id).replace(
          { ...attempt, status: 'EXPIRED' },
          { accessCondition: { type: 'IfMatch', condition: attempt._etag } },
        );
        await bookingEventRepo.append({ event: 'OFFER_EXPIRED', bookingId: attempt.bookingId });
        await dispatcherService.continueDispatchAfterOfferOutcome(attempt.bookingId, attempt.technicianIds);
      } catch {
        // 412 PreconditionFailed = concurrent process already updated this attempt; skip it
      }
    })
  );
}

app.http('acceptJobOffer', {
  route: 'v1/technicians/job-offers/{bookingId}/accept',
  methods: ['PATCH'],
  authLevel: 'anonymous',
  handler: acceptJobOfferHandler,
});

app.http('declineJobOffer', {
  route: 'v1/technicians/job-offers/{bookingId}/decline',
  methods: ['PATCH'],
  authLevel: 'anonymous',
  handler: declineJobOfferHandler,
});

app.timer('expireStaleOffers', {
  schedule: '*/30 * * * * *',
  handler: expireStaleOffers,
});

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content api/src/services/erasureCascade.service.ts -TotalCount 140; Write-Host '--- writes'; Get-Content api/src/cosmos/user-data-cascade-writes.ts -TotalCount 240" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 7468ms:
import { createHash } from 'node:crypto';
import { userDataCascadeWrites } from '../cosmos/user-data-cascade-writes.js';
import { deviceTokenRepo } from '../cosmos/device-token-repository.js';
import type { ErasureDeletedCounts, ErasureRequestDoc } from '../schemas/erasure-request.js';

/**
 * Computes the irreversible anonymized hash from uid + per-request salt.
 * SHA-256 hex (64 chars). The salt is the only mechanism that links the
 * hash back to the natural-person uid â€” and only if regulatory hold
 * required us to retain it.
 */
export function computeAnonymizedHash(uid: string, salt: string): string {
  return createHash('sha256').update(`${uid}:${salt}`).digest('hex');
}

/**
 * Executes the DPDP Â§12 cascade for a single erasure request.
 *
 * Caller MUST have already transitioned the request to EXECUTING and persisted
 * the anonymizedHash (so admin retries are idempotent: each step's natural
 * predicate ("rows where customerId = uid") becomes a no-op once executed).
 *
 * Each cosmos cross-container step is independently retryable. Failures here
 * propagate up to the caller, which marks the request FAILED and may retry.
 */
export async function executeErasureCascade(
  request: Pick<ErasureRequestDoc, 'userId' | 'userRole' | 'anonymizationSalt'>,
): Promise<ErasureDeletedCounts> {
  const { userId, userRole, anonymizationSalt } = request;
  const hash = computeAnonymizedHash(userId, anonymizationSalt);

  // Anonymize across containers in parallel â€” they target disjoint containers.
  const [
    bookings,
    ratings,
    complaints,
    walletLedgerAnonymized,
    bookingEventsAnonymized,
    dispatchAttemptsAnonymized,
    auditLogAnonymized,
  ] = await Promise.all([
    userDataCascadeWrites.anonymizeBookings(userId, hash),
    userDataCascadeWrites.anonymizeRatings(userId, hash),
    userDataCascadeWrites.anonymizeComplaints(userId, hash),
    userRole === 'TECHNICIAN'
      ? userDataCascadeWrites.anonymizeWalletLedger(userId, hash)
      : Promise.resolve(0),
    userDataCascadeWrites.anonymizeBookingEvents(userId, hash),
    userDataCascadeWrites.anonymizeDispatchAttempts(userId, hash),
    userDataCascadeWrites.anonymizeAuditLogResourceId(userId, hash),
  ]);

  // E19-S02: clear FCM device token docs linked to erased UID (DPDP Â§12 compliance).
  await deviceTokenRepo.unregisterAllForUser(userId);

  let technicianHardDeleted = false;
  let kycHardDeleted = false;
  let fcmTokensCleared = false;

  if (userRole === 'TECHNICIAN') {
    // Clear FCM token before hard-delete (so the doc still exists for the patch).
    fcmTokensCleared = await userDataCascadeWrites.clearFcmTokenForTechnician(userId);
    // KYC is nested inside the technician doc â€” hard-deleting the doc removes it too.
    technicianHardDeleted = await userDataCascadeWrites.hardDeleteTechnician(userId);
    kycHardDeleted = technicianHardDeleted;
  } else {
    // Customer FCM is topic-based (`customer_<uid>`); no per-doc cleanup needed.
    fcmTokensCleared = true;
  }

  return {
    bookings,
    ratings,
    complaints,
    walletLedgerAnonymized,
    bookingEventsAnonymized,
    dispatchAttemptsAnonymized,
    auditLogAnonymized,
    technicianHardDeleted,
    kycHardDeleted,
    fcmTokensCleared,
    deviceTokensCleared: true, // E19-S02: unregisterAllForUser always succeeds (no-ops on empty)
  };
}
--- writes
/**
 * Cascade write facade for DPDP Â§12 right-to-erasure.
 * Hard-deletes PII categories that cannot be retained (KYC, technician profile);
 * anonymizes everything else (bookings, ratings, ledger, audit log) so financial
 * traceability and audit immutability invariants are preserved.
 *
 * Each method is idempotent â€” safe to retry after a partial failure.
 */
import {
  getCosmosClient,
  DB_NAME,
  getBookingsContainer,
  getRatingsContainer,
  getWalletLedgerContainer,
  getDispatchAttemptsContainer,
  getBookingEventsContainer,
} from './client.js';

const TECHNICIANS_CONTAINER = 'technicians';
const COMPLAINTS_CONTAINER = 'complaints';
const AUDIT_LOG_CONTAINER = 'audit_log';

const DELETED_ADDRESS_TEXT = '[deleted]';
const DELETED_LATLNG = { lat: 0, lng: 0 };

function isCosmos404(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 404;
}

export const userDataCascadeWrites = {
  async hardDeleteTechnician(uid: string): Promise<boolean> {
    try {
      await getCosmosClient()
        .database(DB_NAME)
        .container(TECHNICIANS_CONTAINER)
        .item(uid, uid)
        .delete();
      return true;
    } catch (err) {
      if (isCosmos404(err)) return false;
      throw err;
    }
  },

  /**
   * Replace bookings authored or fulfilled by the user with anonymized stubs.
   * Booking record is retained for finance/legal traceability; PII fields are stripped.
   */
  async anonymizeBookings(uid: string, anonymizedHash: string): Promise<number> {
    const { resources } = await getBookingsContainer()
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.customerId = @uid OR c.technicianId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    for (const r of resources) {
      const updated: Record<string, unknown> = { ...r };
      if (r['customerId'] === uid) updated['customerId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
      if (r['technicianId'] === uid) updated['technicianId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
      updated['addressText'] = DELETED_ADDRESS_TEXT;
      updated['addressLatLng'] = DELETED_LATLNG;
      // photos may contain PII (faces); drop the URLs
      delete updated['photos'];
      // internalNotes may reference user identity in admin commentary
      updated['internalNotes'] = [];
      const id = r['id'] as string;
      await getBookingsContainer().item(id, id).replace(updated);
      n += 1;
    }
    return n;
  },

  /**
   * Strip free-text comments while keeping the numeric rating (anonymous aggregate).
   * Â§AC-4: "the only way to honor DPDP without destroying the platform's rating average".
   */
  async anonymizeRatings(uid: string, anonymizedHash: string): Promise<number> {
    const { resources } = await getRatingsContainer()
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.customerId = @uid OR c.technicianId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    for (const r of resources) {
      const updated: Record<string, unknown> = { ...r };
      if (r['customerId'] === uid) updated['customerId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
      if (r['technicianId'] === uid) updated['technicianId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
      delete updated['customerComment'];
      delete updated['techComment'];
      const id = r['id'] as string;
      await getRatingsContainer().item(id, id).replace(updated);
      n += 1;
    }
    return n;
  },

  async anonymizeComplaints(uid: string, anonymizedHash: string): Promise<number> {
    const container = getCosmosClient().database(DB_NAME).container(COMPLAINTS_CONTAINER);
    const { resources } = await container
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.customerId = @uid OR c.technicianId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    for (const r of resources) {
      const updated: Record<string, unknown> = { ...r };
      if (r['customerId'] === uid) updated['customerId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
      if (r['technicianId'] === uid) updated['technicianId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
      // Description is free-text PII
      updated['description'] = '[deleted]';
      delete updated['photoStoragePath'];
      const id = r['id'] as string;
      await container.item(id, id).replace(updated);
      n += 1;
    }
    return n;
  },

  /**
   * Wallet ledger is retained for 7 years per RBI/finance regulation.
   * Anonymize technicianId only; do NOT delete entries.
   *
   * Partition key changes from `technicianId = uid` to `technicianId = hash`,
   * so we use insert-then-delete with idempotent guards: if a prior attempt
   * created the new doc but failed to delete the old, the next pass tolerates
   * Cosmos 409 (already-created) on insert and 404 (already-deleted) on delete.
   */
  async anonymizeWalletLedger(uid: string, anonymizedHash: string): Promise<number> {
    const { resources } = await getWalletLedgerContainer()
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.technicianId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    const anonId = `deleted-${anonymizedHash.slice(0, 16)}`;
    for (const r of resources) {
      const updated: Record<string, unknown> = {
        ...r,
        technicianId: anonId,
        partitionKey: anonId,
      };
      const id = r['id'] as string;
      // Insert first â€” anonymized doc lives in new partition. Idempotent on 409.
      try {
        await getWalletLedgerContainer().items.create(updated);
      } catch (err) {
        const code = (err as { code?: number }).code;
        if (code !== 409) throw err;
      }
      // Then delete the original. Idempotent on 404.
      try {
        await getWalletLedgerContainer().item(id, uid).delete();
      } catch (err) {
        if (!isCosmos404(err)) throw err;
      }
      n += 1;
    }
    return n;
  },

  async anonymizeBookingEvents(uid: string, anonymizedHash: string): Promise<number> {
    const { resources } = await getBookingEventsContainer()
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.technicianId = @uid OR c.adminId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    const anonId = `deleted-${anonymizedHash.slice(0, 16)}`;
    for (const r of resources) {
      const updated: Record<string, unknown> = { ...r };
      if (r['technicianId'] === uid) updated['technicianId'] = anonId;
      if (r['adminId'] === uid) updated['adminId'] = anonId;
      const id = r['id'] as string;
      const pk = (r['bookingId'] as string) ?? id;
      await getBookingEventsContainer().item(id, pk).replace(updated);
      n += 1;
    }
    return n;
  },

  async anonymizeDispatchAttempts(uid: string, anonymizedHash: string): Promise<number> {
    const { resources } = await getDispatchAttemptsContainer()
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(c.technicianIds, @uid)',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    const anonId = `deleted-${anonymizedHash.slice(0, 16)}`;
    for (const r of resources) {
      const ids = r['technicianIds'] as string[];
      const updated: Record<string, unknown> = {
        ...r,
        technicianIds: ids.map((t) => (t === uid ? anonId : t)),
      };
      const id = r['id'] as string;
      const pk = (r['bookingId'] as string) ?? id;
      await getDispatchAttemptsContainer().item(id, pk).replace(updated);
      n += 1;
    }
    return n;
  },

  /**
   * Audit log immutability invariant: NEVER delete audit entries.
   * Only the resourceId field is anonymized so the entries remain queryable
   * by the operator while no longer linking back to the natural-person uid.
   */
  async anonymizeAuditLogResourceId(uid: string, anonymizedHash: string): Promise<number> {
    const container = getCosmosClient().database(DB_NAME).container(AUDIT_LOG_CONTAINER);
    const { resources } = await container
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.resourceId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    const anonId = `deleted-${anonymizedHash.slice(0, 16)}`;
    for (const r of resources) {
      const updated: Record<string, unknown> = { ...r, resourceId: anonId };
      const id = r['id'] as string;
      const pk = (r['partitionKey'] as string) ?? '';
      await container.item(id, pk).replace(updated);
      n += 1;
    }
    return n;
  },

  /**
   * Clear FCM token from technician doc (best-effort; customer FCM is topic-based,
   * so nothing per-document to clear â€” we return a flag for the inventory check).
   */
  async clearFcmTokenForTechnician(uid: string): Promise<boolean> {
    const container = getCosmosClient().database(DB_NAME).container(TECHNICIANS_CONTAINER);
    try {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/cosmos/user-data-cascade-writes.ts -Tail 70' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 45475ms:
    return n;
  },

  async anonymizeDispatchAttempts(uid: string, anonymizedHash: string): Promise<number> {
    const { resources } = await getDispatchAttemptsContainer()
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(c.technicianIds, @uid)',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    const anonId = `deleted-${anonymizedHash.slice(0, 16)}`;
    for (const r of resources) {
      const ids = r['technicianIds'] as string[];
      const updated: Record<string, unknown> = {
        ...r,
        technicianIds: ids.map((t) => (t === uid ? anonId : t)),
      };
      const id = r['id'] as string;
      const pk = (r['bookingId'] as string) ?? id;
      await getDispatchAttemptsContainer().item(id, pk).replace(updated);
      n += 1;
    }
    return n;
  },

  /**
   * Audit log immutability invariant: NEVER delete audit entries.
   * Only the resourceId field is anonymized so the entries remain queryable
   * by the operator while no longer linking back to the natural-person uid.
   */
  async anonymizeAuditLogResourceId(uid: string, anonymizedHash: string): Promise<number> {
    const container = getCosmosClient().database(DB_NAME).container(AUDIT_LOG_CONTAINER);
    const { resources } = await container
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.resourceId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    const anonId = `deleted-${anonymizedHash.slice(0, 16)}`;
    for (const r of resources) {
      const updated: Record<string, unknown> = { ...r, resourceId: anonId };
      const id = r['id'] as string;
      const pk = (r['partitionKey'] as string) ?? '';
      await container.item(id, pk).replace(updated);
      n += 1;
    }
    return n;
  },

  /**
   * Clear FCM token from technician doc (best-effort; customer FCM is topic-based,
   * so nothing per-document to clear â€” we return a flag for the inventory check).
   */
  async clearFcmTokenForTechnician(uid: string): Promise<boolean> {
    const container = getCosmosClient().database(DB_NAME).container(TECHNICIANS_CONTAINER);
    try {
      const { resource } = await container.item(uid, uid).read<Record<string, unknown>>();
      if (!resource) return false;
      const updated: Record<string, unknown> = { ...resource };
      delete updated['fcmToken'];
      await container.item(uid, uid).replace(updated);
      return true;
    } catch (err) {
      if (isCosmos404(err)) return false;
      throw err;
    }
  },
};

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-status 360b04d87a5b9a8e609c7b66c07e1bbfcdc1072f' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3835ms:
M	.gitignore
M	api/src/cosmos/booking-repository.ts
M	api/src/functions/users-erasure-request.ts
A	api/tests/cosmos/booking-repository-hasActiveBookingForTechnician.test.ts
A	api/tests/functions/users-erasure-request.test.ts
M	api/tests/unit/users-erasure-request.test.ts
A	docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md
A	docs/superpowers/specs/2026-05-22-account-deletion-design.md
A	technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt
A	technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt
A	technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt
M	technician-app/app/src/main/res/values-hi/strings.xml
M	technician-app/app/src/main/res/values/strings.xml
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt | ForEach-Object { $i++; "{0,4}: {1}" -f $i,$_ }; $i=0; Get-Content technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt | ForEach-Object { $i++; "{0,4}: {1}" -f $i,$_ }' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 6205ms:
   1: package com.homeservices.technician.data.erasure
   2: 
   3: import com.homeservices.technician.data.erasure.remote.ErasureApiService
   4: import com.homeservices.technician.data.erasure.remote.ErasureSubmitRequestBody
   5: import com.homeservices.technician.domain.erasure.ErasureRepository
   6: import com.homeservices.technician.domain.erasure.ErasureSubmitResult
   7: import javax.inject.Inject
   8: 
   9: private const val CONFIRMATION_PHRASE = "DELETE MY ACCOUNT"
  10: private const val HTTP_CONFLICT = 409
  11: 
  12: public class ErasureRepositoryImpl
  13:     @Inject
  14:     constructor(
  15:         private val api: ErasureApiService,
  16:     ) : ErasureRepository {
  17:         public override suspend fun submitRequest(reason: String?): ErasureSubmitResult =
  18:             runCatching {
  19:                 val response = api.submitErasureRequest(
  20:                     ErasureSubmitRequestBody(confirmationPhrase = CONFIRMATION_PHRASE, reason = reason),
  21:                 )
  22:                 when {
  23:                     response.isSuccessful -> {
  24:                         val body = checkNotNull(response.body()) { "Null body on 2xx" }
  25:                         ErasureSubmitResult.Success(body.scheduledDeletionAt)
  26:                     }
  27:                     response.code() == HTTP_CONFLICT -> {
  28:                         val raw = response.errorBody()?.string() ?: ""
  29:                         if (raw.contains("ACTIVE_JOB_EXISTS")) {
  30:                             ErasureSubmitResult.ActiveJobExists
  31:                         } else {
  32:                             ErasureSubmitResult.DuplicatePending
  33:                         }
  34:                     }
  35:                     else -> ErasureSubmitResult.UnknownError("HTTP ${response.code()}")
  36:                 }
  37:             }.getOrElse { e -> ErasureSubmitResult.UnknownError(e.message ?: "Unknown") }
  38: 
  39:         public override suspend fun revokeRequest(): Result<Unit> =
  40:             runCatching {
  41:                 val response = api.revokeErasureRequest()
  42:                 if (!response.isSuccessful) {
  43:                     throw RuntimeException("Revoke failed: HTTP ${response.code()}")
  44:                 }
  45:             }
  46:     }
   1: package com.homeservices.technician.data.erasure.remote
   2: 
   3: import retrofit2.Response
   4: import retrofit2.http.Body
   5: import retrofit2.http.DELETE
   6: import retrofit2.http.POST
   7: 
   8: public interface ErasureApiService {
   9:     @POST("v1/users/me/erasure-request")
  10:     public suspend fun submitErasureRequest(
  11:         @Body body: ErasureSubmitRequestBody,
  12:     ): Response<ErasureSubmitResponseBody>
  13: 
  14:     @DELETE("v1/users/me/erasure-request")
  15:     public suspend fun revokeErasureRequest(): Response<Unit>
  16: }
  17: 
  18: public data class ErasureSubmitRequestBody(
  19:     val confirmationPhrase: String,
  20:     val reason: String? = null,
  21: )
  22: 
  23: public data class ErasureSubmitResponseBody(
  24:     val erasureId: String,
  25:     val scheduledDeletionAt: String,
  26:     val status: String,
  27: )

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git log --oneline --decorate --max-count=20 --no-merges 360b04d87a5b9a8e609c7b66c07e1bbfcdc1072f..HEAD' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 5817ms:
f6829fd4 (HEAD -> fix/s001-pan-plaintext-migration-fallback) feat(technician-app): ErasureRepository interface + impl (E20-S08)
f7d6bc0e feat(technician-app): add ErasureApiService Retrofit interface (E20-S08)
6726868f feat(technician-app): add account-deletion string resources EN + HI (E20-S08)
d400e61d feat(api): active-job gate for erasure-request submit handler (E20-S08)
ebab4fad feat(api): add hasActiveBookingForTechnician to booking-repository (E20-S08)
44d5ac29 docs(plan): E20-S08 account deletion implementation plan — 12 tasks
98e97466 docs(spec): E20-S08 account deletion design — Lane7-C2

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "explicitApi|ExplicitApi" technician-app -n' in C:\Alok\Business Projects\Urbanclap-dup
2026-05-23T00:36:53.074922Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 2.1 seconds
Output:

 exited 1 in 2121ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "ErasureModule|bindErasure|provideErasure" docs/superpowers/plans/2026-05-22-E20-S08-account-deletion.md -n -C 3' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1646ms:
470-
471----
472-
473:## Task 6: ErasureModule — Hilt wiring
474-
475-**Files:**
476:- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/di/ErasureModule.kt`
477-
478-- [ ] **Step 1: Create the Hilt module**
479-
--
493-
494-@Module
495-@InstallIn(SingletonComponent::class)
496:public abstract class ErasureModule {
497-    @Binds
498:    internal abstract fun bindErasureRepository(impl: ErasureRepositoryImpl): ErasureRepository
499-
500-    public companion object {
501-        @Provides
502-        @Singleton
503:        public fun provideErasureApiService(retrofit: Retrofit): ErasureApiService =
504-            retrofit.create(ErasureApiService::class.java)
505-    }
506-}
--
509-- [ ] **Step 2: Commit**
510-
511-```bash
512:git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/di/ErasureModule.kt
513:git commit -m "feat(technician-app): ErasureModule Hilt wiring (E20-S08)"
514-```
515-
516----

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command ".\\node_modules\\.bin\\tsc.cmd --noEmit -p tsconfig.tests.json --pretty false" in C:\Alok\Business Projects\Urbanclap-dup\api
 succeeded in 26474ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command ".\\node_modules\\.bin\\vitest.cmd run tests/functions/users-erasure-request.test.ts tests/cosmos/booking-repository-hasActiveBookingForTechnician.test.ts --pool forks --poolOptions.forks.singleFork true" in C:\Alok\Business Projects\Urbanclap-dup\api
2026-05-23T00:38:17.556434Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 10.2 seconds
Output:
[31mfailed to load config from C:\Alok\Business Projects\Urbanclap-dup\api\vitest.config.ts[39m

[31m⎯⎯⎯⎯⎯⎯⎯[1m[7m Startup Error [27m[22m⎯⎯⎯⎯⎯⎯⎯⎯[39m
Error: spawn EPERM
    at ChildProcess.spawn (node:internal/child_process:421:11)
    at Object.spawn (node:child_process:796:9)
    at ensureServiceIsRunning (C:\Alok\Business Projects\Urbanclap-dup\api\node_modules\.pnpm\esbuild@0.21.5\node_modules\esbuild\lib\main.js:1975:29)
    at build (C:\Alok\Business Projects\Urbanclap-dup\api\node_modules\.pnpm\esbuild@0.21.5\node_modules\esbuild\lib\main.js:1873:26)
    at bundleConfigFile (file:///C:/Alok/Business%20Projects/Urbanclap-dup/api/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:66845:24)
    at loadConfigFromFile (file:///C:/Alok/Business%20Projects/Urbanclap-dup/api/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:66815:27)
    at resolveConfig (file:///C:/Alok/Business%20Projects/Urbanclap-dup/api/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:66416:30)
    at _createServer (file:///C:/Alok/Business%20Projects/Urbanclap-dup/api/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:63015:24)
    at createServer (file:///C:/Alok/Business%20Projects/Urbanclap-dup/api/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:63012:10)
    at createViteServer (file:///C:/Alok/Business%20Projects/Urbanclap-dup/api/node_modules/.pnpm/vitest@2.1.9_@types+node@22.19.17/node_modules/vitest/dist/chunks/cli-api.DqsSTaIi.js:9842:24) {
  errno: -4048,
  code: 'EPERM',
  syscall: 'spawn'
}




 exited 1 in 10158ms:
[31mfailed to load config from C:\Alok\Business Projects\Urbanclap-dup\api\vitest.config.ts[39m

[31m⎯⎯⎯⎯⎯⎯⎯[1m[7m Startup Error [27m[22m⎯⎯⎯⎯⎯⎯⎯⎯[39m
Error: spawn EPERM
    at ChildProcess.spawn (node:internal/child_process:421:11)
    at Object.spawn (node:child_process:796:9)
    at ensureServiceIsRunning (C:\Alok\Business Projects\Urbanclap-dup\api\node_modules\.pnpm\esbuild@0.21.5\node_modules\esbuild\lib\main.js:1975:29)
    at build (C:\Alok\Business Projects\Urbanclap-dup\api\node_modules\.pnpm\esbuild@0.21.5\node_modules\esbuild\lib\main.js:1873:26)
    at bundleConfigFile (file:///C:/Alok/Business%20Projects/Urbanclap-dup/api/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:66845:24)
    at loadConfigFromFile (file:///C:/Alok/Business%20Projects/Urbanclap-dup/api/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:66815:27)
    at resolveConfig (file:///C:/Alok/Business%20Projects/Urbanclap-dup/api/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:66416:30)
    at _createServer (file:///C:/Alok/Business%20Projects/Urbanclap-dup/api/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:63015:24)
    at createServer (file:///C:/Alok/Business%20Projects/Urbanclap-dup/api/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:63012:10)
    at createViteServer (file:///C:/Alok/Business%20Projects/Urbanclap-dup/api/node_modules/.pnpm/vitest@2.1.9_@types+node@22.19.17/node_modules/vitest/dist/chunks/cli-api.DqsSTaIi.js:9842:24) {
  errno: -4048,
  code: 'EPERM',
  syscall: 'spawn'
}




exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path technician-app/gradle/libs.versions.toml -Pattern "moshi|retrofit" -Context 0,1' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 2199ms:

> technician-app\gradle\libs.versions.toml:44:retrofit = "2.11.0"
  technician-app\gradle\libs.versions.toml:45:okhttp = "4.12.0"
> technician-app\gradle\libs.versions.toml:46:moshi = "1.15.1"
  technician-app\gradle\libs.versions.toml:47:coil = "2.7.0"
> technician-app\gradle\libs.versions.toml:148:retrofit-core        = { module = "com.squareup.retrofit2:retrofit",    
           version.ref = "retrofit" }
> technician-app\gradle\libs.versions.toml:149:retrofit-moshi       = { module = 
"com.squareup.retrofit2:converter-moshi",        version.ref = "retrofit" }
  technician-app\gradle\libs.versions.toml:150:okhttp-core          = { module = "com.squareup.okhttp3:okhttp",        
           version.ref = "okhttp" }
> technician-app\gradle\libs.versions.toml:153:moshi-kotlin         = { module = "com.squareup.moshi:moshi-kotlin",    
           version.ref = "moshi" }
> technician-app\gradle\libs.versions.toml:154:moshi-kotlin-codegen = { module = 
"com.squareup.moshi:moshi-kotlin-codegen",       version.ref = "moshi" }
  technician-app\gradle\libs.versions.toml:155:coil-compose         = { module = "io.coil-kt:coil-compose",            
           version.ref = "coil" }



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content technician-app/app/src/main/kotlin/com/homeservices/technician/domain/activeJob/model/ActiveJob.kt; rg "COMPLETED" technician-app/app/src/main/kotlin -n | Select-Object -First 100' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3862ms:
package com.homeservices.technician.domain.activeJob.model

public data class ActiveJob(
    val bookingId: String,
    val customerId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val addressLatLng: LatLng,
    val status: ActiveJobStatus,
    val slotDate: String,
    val slotWindow: String,
)
technician-app/app/src/main/kotlin\com\homeservices\technician\domain\activeJob\model\ActiveJobStatus.kt:8:    COMPLETED,
technician-app/app/src/main/kotlin\com\homeservices\technician\domain\activeJob\CompleteJobUseCase.kt:15:            repository.transitionStatus(bookingId, ActiveJobStatus.COMPLETED)
technician-app/app/src/main/kotlin\com\homeservices\technician\ui\activeJob\ActiveJobScreen.kt:185:                ActiveJobAction.COMPLETE_JOB -> Triple(stringResource(R.string.active_job_complete_job), true, "COMPLETED")
technician-app/app/src/main/kotlin\com\homeservices\technician\ui\activeJob\ActiveJobScreen.kt:214:            ActiveJobStatus.COMPLETED to stringResource(R.string.active_job_status_done),
technician-app/app/src/main/kotlin\com\homeservices\technician\ui\activeJob\ActiveJobScreen.kt:304:        ActiveJobStatus.COMPLETED -> stringResource(R.string.active_job_status_done)
technician-app/app/src/main/kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:78:                        if (job.status == ActiveJobStatus.COMPLETED) {
technician-app/app/src/main/kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:310:                        "COMPLETED" -> completeJobUseCase(bookingId)
technician-app/app/src/main/kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:396:         * photo-capture flow for the COMPLETED stage. We MUST NOT call [completeJob]
technician-app/app/src/main/kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:400:         * opens and the [fireTransition]("COMPLETED") path triggered on photo confirm.
technician-app/app/src/main/kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:405:            onTransitionRequested("COMPLETED")
technician-app/app/src/main/kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:428:                ActiveJobStatus.IN_PROGRESS -> "COMPLETED"
technician-app/app/src/main/kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:429:                ActiveJobStatus.COMPLETED -> "COMPLETED"
technician-app/app/src/main/kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:438:                ActiveJobStatus.COMPLETED -> ActiveJobAction.NONE
technician-app/app/src/main/kotlin\com\homeservices\technician\data\activeJob\receiver\BootReceiver.kt:29:        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
technician-app/app/src/main/kotlin\com\homeservices\technician\ui\activeJob\PhotoCaptureScreen.kt:334:        "COMPLETED" -> "Completing - Take a photo of the finished work"
technician-app/app/src/main/kotlin\com\homeservices\technician\data\activeJob\ActiveJobLocationObserver.kt:45:                        ActiveJobStatus.COMPLETED,
technician-app/app/src/main/kotlin\com\homeservices\technician\ui\home\TechnicianHomeScreen.kt:1306:        TechnicianBookingStatus.COMPLETED -> "Complete"
technician-app/app/src/main/kotlin\com\homeservices\technician\domain\jobs\model\TechnicianBooking.kt:20:    COMPLETED,

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content technician-app/app/src/main/kotlin/com/homeservices/technician/ui/activeJob/ActiveJobViewModel.kt -TotalCount 120; Get-Content technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ActiveJobLocationObserver.kt -TotalCount 90' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 2470ms:
package com.homeservices.technician.ui.activeJob

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.corenav.PendingActionType
import com.homeservices.technician.data.activeJob.BookingStatusEventBus
import com.homeservices.technician.data.activeJob.ConnectivityObserver
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.data.pendingaction.PendingActionStore
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import com.homeservices.technician.domain.activeJob.CompleteJobUseCase
import com.homeservices.technician.domain.activeJob.MarkReachedUseCase
import com.homeservices.technician.domain.activeJob.StartTripUseCase
import com.homeservices.technician.domain.activeJob.StartWorkUseCase
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.NavigationEvent
import com.homeservices.technician.domain.auth.model.AuthState
import com.homeservices.technician.domain.photo.UploadJobPhotoUseCase
import com.homeservices.technician.domain.shield.FileShieldReportUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
@Suppress("LongParameterList") // Hilt-injected dependencies for the active-job feature; extracting an aggregator would only hide the wiring
internal class ActiveJobViewModel
    @Inject
    constructor(
        savedStateHandle: SavedStateHandle,
        private val repository: ActiveJobRepository,
        private val startTripUseCase: StartTripUseCase,
        private val markReachedUseCase: MarkReachedUseCase,
        private val startWorkUseCase: StartWorkUseCase,
        private val completeJobUseCase: CompleteJobUseCase,
        private val connectivityObserver: ConnectivityObserver,
        private val uploadJobPhotoUseCase: UploadJobPhotoUseCase,
        private val fileShieldReportUseCase: FileShieldReportUseCase,
        private val bookingStatusEventBus: BookingStatusEventBus,
        private val pendingActionStore: PendingActionStore,
        private val sessionManager: SessionManager,
    ) : ViewModel() {
        private val bookingId: String = checkNotNull(savedStateHandle["bookingId"])

        private val _uiState = MutableStateFlow<ActiveJobUiState>(ActiveJobUiState.Loading)
        public val uiState: StateFlow<ActiveJobUiState> = _uiState.asStateFlow()

        /**
         * Latest snapshot of "is there an active PHOTO_UPLOAD_PENDING row for this booking?"
         * Cached separately because the pending-action observer can emit BEFORE the polling
         * observer transitions uiState out of Loading on cold start; Room won't re-emit until
         * the table changes, so we must remember the value and apply it when Active is built.
         */
        @Volatile
        private var cachedPhotoUploadPending: Boolean = false

        private val _navigationEvents = MutableSharedFlow<NavigationEvent>(extraBufferCapacity = 1)
        public val navigationEvents: SharedFlow<NavigationEvent> = _navigationEvents.asSharedFlow()

        init {
            viewModelScope.launch {
                repository.startObserving(bookingId)
            }
            viewModelScope.launch {
                repository.getActiveJob(bookingId).collect { job ->
                    val current = _uiState.value as? ActiveJobUiState.Active
                    _uiState.value =
                        if (job.status == ActiveJobStatus.COMPLETED) {
                            ActiveJobUiState.Completed(bookingId = bookingId)
                        } else {
                            ActiveJobUiState.Active(
                                job = job,
                                availableAction = job.status.toAction(),
                                // Preserve transient UI state across polling refreshes so that
                                // an in-progress photo capture or upload is not interrupted.
                                hasPendingTransitions = current?.hasPendingTransitions ?: false,
                                pendingPhotoStage = current?.pendingPhotoStage,
                                uploadedStoragePath = current?.uploadedStoragePath,
                                photoUploadInProgress = current?.photoUploadInProgress ?: false,
                                photoUploadError = current?.photoUploadError,
                                showShieldSheet = current?.showShieldSheet ?: false,
                                shieldReportInProgress = current?.shieldReportInProgress ?: false,
                                shieldReportSuccess = current?.shieldReportSuccess ?: false,
                                shieldReportError = current?.shieldReportError,
                                mockLocationWarning = current?.mockLocationWarning ?: false,
                                // Prefer existing Active state, fall back to cached value so a
                                // pending row emitted before the first Active state still shows the banner.
                                photoUploadPending = current?.photoUploadPending ?: cachedPhotoUploadPending,
                                awaitingCompletionConfirm = current?.awaitingCompletionConfirm ?: false,
                            )
                        }
                }
            }
            viewModelScope.launch {
                repository.hasPendingTransitions.collect { hasPending ->
                    val current = _uiState.value
                    if (current is ActiveJobUiState.Active) {
                        _uiState.value = current.copy(hasPendingTransitions = hasPending)
                    }
                }
            }
            viewModelScope.launch {
                connectivityObserver.isConnected.collect { connected ->
                    if (connected) repository.syncPendingTransitions()
                }
            }
            // E11-S05a: react to server-confirmed booking-status pushes. Any matching
            // event triggers a refresh â€” ActiveJobRepository.getActiveJob is backed by
            // in-memory state, not polling, so without this the screen stays stale on
            // ASSIGNED / EN_ROUTE / IN_PROGRESS transitions that arrive via FCM.
package com.homeservices.technician.data.activeJob

import android.content.Context
import androidx.annotation.VisibleForTesting
import com.homeservices.technician.data.location.service.LocationForegroundService
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Application-scoped observer that starts or stops [LocationForegroundService]
 * in response to changes in the active-job state.
 *
 * Lifecycle: [start] is called once from [com.homeservices.technician.HomeservicesTechnicianApplication.onCreate].
 * The internal [CoroutineScope] lives for the process lifetime â€” no teardown is needed.
 */
@Singleton
public class ActiveJobLocationObserver
    @Inject
    internal constructor(
        @ApplicationContext private val appContext: Context,
        private val repository: ActiveJobRepository,
    ) {
        // Exposed for tests: override with a TestScope before calling start() so
        // `advanceUntilIdle()` reaches the collect coroutine.
        @VisibleForTesting
        internal var scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

        /** Subscribes to [ActiveJobRepository.activeJobState] and manages [LocationForegroundService]. */
        public fun start() {
            scope.launch {
                repository.activeJobState.collect { job ->
                    when (job?.status) {
                        ActiveJobStatus.EN_ROUTE,
                        ActiveJobStatus.REACHED,
                        ActiveJobStatus.IN_PROGRESS,
                        -> LocationForegroundService.startIfNeeded(appContext, job.bookingId)

                        ActiveJobStatus.COMPLETED,
                        null,
                        -> LocationForegroundService.stop(appContext)

                        else -> Unit
                    }
                }
            }
        }
    }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "users-erasure-request|submitErasureRequestHandler" api/tests -n' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 3801ms:
api/tests\functions\users-erasure-request.test.ts:30:import { submitErasureRequestHandler } from '../../src/functions/users-erasure-request.js';
api/tests\functions\users-erasure-request.test.ts:46:describe('submitErasureRequestHandler', () => {
api/tests\functions\users-erasure-request.test.ts:58:    const res = await submitErasureRequestHandler(req, ctx);
api/tests\functions\users-erasure-request.test.ts:68:    const res = await submitErasureRequestHandler(req, ctx);
api/tests\functions\users-erasure-request.test.ts:78:    const res = await submitErasureRequestHandler(req, ctx);
api/tests\functions\users-erasure-request.test.ts:87:    const res = await submitErasureRequestHandler(req, ctx);
api/tests\unit\users-erasure-request.test.ts:52:  let submitHandler: typeof import('../../src/functions/users-erasure-request.js').submitErasureRequestHandler;
api/tests\unit\users-erasure-request.test.ts:57:    const mod = await import('../../src/functions/users-erasure-request.js');
api/tests\unit\users-erasure-request.test.ts:58:    submitHandler = mod.submitErasureRequestHandler;
api/tests\unit\users-erasure-request.test.ts:187:  let revokeHandler: typeof import('../../src/functions/users-erasure-request.js').revokeErasureRequestHandler;
api/tests\unit\users-erasure-request.test.ts:192:    const mod = await import('../../src/functions/users-erasure-request.js');

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Path 'technician-app/.gradle/wrapper/dists/gradle-8.11-bin/c4te04g51qsyw1bxcb929u7br' -Force | Format-List Name,Mode,Length" in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 861ms:


Name   : gradle-8.11-bin.zip.lck
Mode   : -a----
Length : 0

Name   : gradle-8.11-bin.zip.part
Mode   : -a----
Length : 0




exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'gradle -v' in C:\Alok\Business Projects\Urbanclap-dup\technician-app
2026-05-23T00:40:13.003297Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 1.3 seconds
Output:
gradle : The term 'gradle' is not recognized as the name of a cmdlet, function, script file, or operable program. 
Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
At line:2 char:1
+ gradle -v
+ ~~~~~~
    + CategoryInfo          : ObjectNotFound: (gradle:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException
 

 exited 1 in 1330ms:
gradle : The term 'gradle' is not recognized as the name of a cmdlet, function, script file, or operable program. 
Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
At line:2 char:1
+ gradle -v
+ ~~~~~~
    + CategoryInfo          : ObjectNotFound: (gradle:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException
 

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "HiltAndroidTest|HiltRule|Component|missing binding|aggregated" technician-app/app/src/test technician-app/app/src/androidTest -n | Select-Object -First 100' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1602ms:
technician-app/app/src/test\kotlin\com\homeservices\technician\HiltWiringTest.kt:5:import dagger.hilt.android.testing.HiltAndroidTest
technician-app/app/src/test\kotlin\com\homeservices\technician\HiltWiringTest.kt:14:@HiltAndroidTest
technician-app/app/src/test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionDaoTest.kt:26: *   Robolectric tests use ApplicationProvider directly — no @HiltAndroidTest.

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content technician-app/app/src/test/kotlin/com/homeservices/technician/HiltWiringTest.kt' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1373ms:
package com.homeservices.technician

import com.homeservices.technician.di.BuildInfoProvider
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import dagger.hilt.android.testing.HiltTestApplication
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import javax.inject.Inject

@HiltAndroidTest
@RunWith(RobolectricTestRunner::class)
@Config(application = HiltTestApplication::class)
public class HiltWiringTest {
    @get:Rule
    public val hiltRule: HiltAndroidRule = HiltAndroidRule(this)

    @Inject
    public lateinit var buildInfoProvider: BuildInfoProvider

    @org.junit.Test
    public fun hiltGraphResolvesBuildInfoProvider(): Unit {
        hiltRule.inject()
        assertThat(buildInfoProvider).isNotNull
        assertThat(buildInfoProvider.version).isNotBlank
    }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path technician-app/gradle/libs.versions.toml -Pattern "detekt" -Context 0,0' in C:\Alok\Business Projects\Urbanclap-dup
 succeeded in 1401ms:

technician-app\gradle\libs.versions.toml:66:detekt = "1.23.7"
technician-app\gradle\libs.versions.toml:200:detekt = { id = "io.gitlab.arturbosch.detekt", version.ref = "detekt" }



codex
The API change is small, but the Android erasure data layer is not wireable through Hilt and has release serialization/static-analysis issues. These should be addressed before considering the patch correct.

Full review comments:

- [P2] Provide Hilt bindings for erasure dependencies — C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\src\main\kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:15-15
  When the delete-account flow injects `ErasureRepository`, Hilt has no `@Binds` from `ErasureRepository` to this implementation and no `@Provides` for the Retrofit `ErasureApiService` constructor dependency. Other Retrofit-backed repositories add a feature DI module for this; without one, any Hilt consumer of the new repository will fail compilation with missing bindings.

- [P2] Annotate erasure DTOs for Moshi codegen — C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\src\main\kotlin\com\homeservices\technician\data\erasure\remote\ErasureApiService.kt:18-23
  In minified release builds, this app's ProGuard rules only keep Moshi models annotated with `@JsonClass`, and the other Retrofit DTOs use that pattern. These new erasure request/response bodies fall back to reflection and can be obfuscated or stripped by R8, causing the submit flow to send/parse invalid JSON only in release builds.

- [P2] Avoid adding an unbaselined generic exception — C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\src\main\kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:43-43
  When CI runs `:app:detekt`, the active `TooGenericExceptionThrown` rule will flag this new `RuntimeException`; existing occurrences are covered by the baseline, but this one is not. Use a specific exception type such as `IllegalStateException` or return a failed `Result` directly so the detekt gate stays green.
2026-05-23T00:41:17.149827Z ERROR codex_core::session: failed to record rollout items: thread 019e523a-c467-78e3-8ca8-2c54610ba563 not found
2026-05-23T00:41:17.377797Z ERROR codex_core::session: failed to record rollout items: thread 019e523a-c023-7740-b990-6f23eb03f627 not found
The API change is small, but the Android erasure data layer is not wireable through Hilt and has release serialization/static-analysis issues. These should be addressed before considering the patch correct.

Full review comments:

- [P2] Provide Hilt bindings for erasure dependencies — C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\src\main\kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:15-15
  When the delete-account flow injects `ErasureRepository`, Hilt has no `@Binds` from `ErasureRepository` to this implementation and no `@Provides` for the Retrofit `ErasureApiService` constructor dependency. Other Retrofit-backed repositories add a feature DI module for this; without one, any Hilt consumer of the new repository will fail compilation with missing bindings.

- [P2] Annotate erasure DTOs for Moshi codegen — C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\src\main\kotlin\com\homeservices\technician\data\erasure\remote\ErasureApiService.kt:18-23
  In minified release builds, this app's ProGuard rules only keep Moshi models annotated with `@JsonClass`, and the other Retrofit DTOs use that pattern. These new erasure request/response bodies fall back to reflection and can be obfuscated or stripped by R8, causing the submit flow to send/parse invalid JSON only in release builds.

- [P2] Avoid adding an unbaselined generic exception — C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\src\main\kotlin\com\homeservices\technician\data\erasure\ErasureRepositoryImpl.kt:43-43
  When CI runs `:app:detekt`, the active `TooGenericExceptionThrown` rule will flag this new `RuntimeException`; existing occurrences are covered by the baseline, but this one is not. Use a specific exception type such as `IllegalStateException` or return a failed `Result` directly so the detekt gate stays green.
