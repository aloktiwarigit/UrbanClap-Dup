# Story E07-S03: Complaints module — customer + technician manual filing

Status: ready-for-dev

> **Epic:** E07 — Ratings, Complaints & Safety (`docs/stories/README.md` §E07)
> **Sprint:** S4 (wk 7–8) · **Estimated:** ≤ 2 dev-days · **Priority:** P1
> **Sub-projects:** `api/` + `customer-app/` + `technician-app/`
> **Ceremony tier:** Feature (builds on E09-S06's complaints Cosmos container + E07-S02's schema extensions; new partner-callable API endpoints + complaint creation UI in both apps; Codex + CI; no /security-review trigger — no PII stored beyond booking IDs already in scope)
> **Prerequisite:** E09-S06 merged to main (`complaints` Cosmos container provisioned; admin inbox live). E07-S02 merged to main (`ComplaintTypeEnum` + `RATING_SHIELD` schema extensions present on `ComplaintDocSchema`).

---

## Story

As a **customer or technician who has had a problem with a booking**,
I want to file a complaint directly from within the app after a job,
so that **the owner is notified immediately, the complaint is tracked with SLA timers (2h acknowledge, 24h resolve), and I can see its status without leaving the app**.

---

## Acceptance Criteria

### AC-1 · Complaint entry point visible on completed booking
- **Given** a customer is viewing their booking history or booking detail for a `CLOSED` booking
- **Then** a "शिकायत दर्ज करें" (File a complaint) button is visible
- **Given** a technician views a completed job in their job history
- **Then** a "समस्या रिपोर्ट करें" (Report a problem) button is visible

### AC-2 · Complaint creation screen — reason + description + optional photo
- **Given** the user taps the complaint entry point
- **Then** `ComplaintScreen` opens with:
  - A reason-code picker (RadioGroup or DropDown) — see reason code lists in Dev Notes
  - A description text field (10–2000 chars, mandatory)
  - An optional photo picker (gallery or camera) that uploads to Firebase Storage before submission
  - A "Submit" button (disabled until reasonCode + description are non-empty)

### AC-3 · Successful complaint creation
- **Given** the user taps Submit with valid reason + description (and optionally a photo)
- **Then** `POST /v1/complaints` is called with `{ bookingId, reasonCode, description, photoStoragePath? }`
- **And** the API responds 201 with `{ id, status: "NEW", acknowledgeDeadlineAt, slaDeadlineAt }`
- **And** the screen transitions to a confirmation state showing "आपकी शिकायत दर्ज हो गई। मालिक 2 घंटे में जवाब देंगे।"
- **And** an FCM data message of type `OWNER_COMPLAINT_FILED` is sent to topic `owner_alerts` with `{ bookingId, filedBy, reasonCode }`

### AC-4 · Complaint status polling
- **Given** a complaint has been filed for a booking
- **When** `GET /v1/complaints/{bookingId}` is called by the same party who filed it
- **Then** the API returns the list of complaints filed by that caller for that booking, each with current `status`
- **And** the customer/technician app displays the latest complaint's status in the confirmation screen

### AC-5 · Authorization guards on complaint creation
- 401 `UNAUTHENTICATED` — missing/invalid Bearer token
- 403 `FORBIDDEN` — caller's uid is neither `booking.customerId` nor `booking.technicianId`
- 404 `BOOKING_NOT_FOUND` — bookingId does not exist
- 409 `BOOKING_NOT_ELIGIBLE` — booking is not in `CLOSED` state (only closed bookings can generate complaints; active-job disputes go through the owner override flow)

### AC-6 · One active complaint per booking-party
- **Given** a customer has already filed a complaint for a booking
- **When** they attempt to file another complaint for the same booking
- **Then** the API returns 409 `COMPLAINT_ALREADY_FILED`
- **And** the app entry point shows the existing complaint status instead of the "File complaint" button

### AC-7 · SLA timer — acknowledge within 2h, resolve within 24h
- **Given** a complaint exists with `status: "NEW"` and `acknowledgeDeadlineAt` has passed
- **When** the SLA-timer trigger fires (existing `sla-timer` function extended)
- **Then** the complaint's `escalated` flag is set to `true` and an FCM alert is sent to `owner_alerts` with type `OWNER_COMPLAINT_SLA_BREACH`, `slaType: "ACKNOWLEDGE"`
- **Given** a complaint exists with `status != "RESOLVED"` and `slaDeadlineAt` (resolve, 24h) has passed
- **Then** the existing breach path fires with `slaType: "RESOLVE"` added to the FCM payload

### AC-8 · Paparazzi: @Ignored stubs only, no golden deletion
- New `ComplaintScreenPaparazziTest` in customer-app and `ComplaintScreenPaparazziTest` in technician-app are `@Ignore`d.
- No existing goldens deleted.

---

## Tasks / Subtasks

> TDD: test file committed before implementation file per CLAUDE.md.

- [ ] **T1 — API: extend complaint schema (api/, no separate test)**
  - [ ] In `api/src/schemas/complaint.ts`:
    - Add `ComplaintFiledByEnum = z.enum(['CUSTOMER', 'TECHNICIAN'])`
    - Add `CustomerReasonCodeEnum = z.enum(['SERVICE_QUALITY', 'LATE_ARRIVAL', 'NO_SHOW', 'TECHNICIAN_BEHAVIOUR', 'BILLING_DISPUTE', 'OTHER'])`
    - Add `TechnicianReasonCodeEnum = z.enum(['CUSTOMER_MISCONDUCT', 'LATE_PAYMENT', 'SAFETY_CONCERN', 'OTHER'])`
    - Extend `ComplaintDocSchema` to add: `filedBy: ComplaintFiledByEnum.optional()`, `reasonCode: z.string().optional()`, `photoStoragePath: z.string().optional()`, `acknowledgeDeadlineAt: z.string().optional()`
    - Add `CreateComplaintByPartnerBodySchema = z.object({ bookingId, reasonCode: CustomerReasonCodeEnum | TechnicianReasonCodeEnum union, description, photoStoragePath? })`
    - Add `PartnerComplaintStatusResponseSchema = z.object({ complaints: z.array(ComplaintDocSchema) })`
    - Export new types

- [ ] **T2 — API: `POST /v1/complaints` endpoint (api/, TDD)**
  - [ ] Create `api/tests/functions/complaints/partner-create.test.ts` first — 401, 403 (not booking participant), 404, 409 BOOKING_NOT_ELIGIBLE, 409 COMPLAINT_ALREADY_FILED, 201 happy path (customer), 201 happy path (technician)
  - [ ] Create `api/src/functions/complaints/partner-create.ts` — route `POST /v1/complaints`; auth: raw `verifyFirebaseIdToken` (handles both customer and technician tokens); fetch booking from Cosmos to derive `filedBy`; validate `reasonCode` against per-role enums; build `ComplaintDoc` with `filedBy`, `reasonCode`, `photoStoragePath`, `acknowledgeDeadlineAt = now+2h`, `slaDeadlineAt = now+24h`, `type = "STANDARD"`; duplicate-check query against complaints container; call `createComplaint()`; fire FCM `OWNER_COMPLAINT_FILED` to `owner_alerts` fire-and-forget; return 201
  - [ ] Add repo helper `findActiveComplaintByBookingAndParty(bookingId, uid)` to `complaints-repository.ts`

- [ ] **T3 — API: `GET /v1/complaints/{bookingId}` endpoint (api/, TDD)**
  - [ ] Create `api/tests/functions/complaints/partner-get.test.ts` — 401, 403, 404, 200 with complaints list
  - [ ] Create `api/src/functions/complaints/partner-get.ts` — route `GET /v1/complaints/{bookingId}`; same dual-role auth; return complaints for that booking filed by caller (`filedBy` + `uid` filter on query)
  - [ ] Add `queryComplaintsByBookingAndParty(bookingId, uid)` helper to `complaints-repository.ts`

- [ ] **T4 — API: extend SLA-timer to acknowledge breach (api/, TDD)**
  - [ ] Extend `api/src/functions/admin/complaints/sla-timer.ts`: add a second Cosmos query for complaints where `acknowledgeDeadlineAt < @now AND status == "NEW" AND escalated != true`; set `escalated = true`, fire FCM `OWNER_COMPLAINT_SLA_BREACH` with `{ complaintId, slaType: "ACKNOWLEDGE" }`; update existing resolve-breach FCM payload to add `slaType: "RESOLVE"`
  - [ ] Extend `api/tests/functions/admin/complaints/sla-timer.test.ts` (already exists or create): cover acknowledge-breach path + resolve-breach path

- [ ] **T5 — libs.versions.toml sync (technician-app, no tests)**
  - [ ] Copy `customer-app/gradle/libs.versions.toml` → `technician-app/gradle/libs.versions.toml`

- [ ] **T6 — customer-app domain + data layer (TDD)**
  - [ ] Create `customer-app/.../data/complaint/remote/dto/ComplaintDtos.kt` — Moshi `@JsonClass(generateAdapter=true)` data classes: `CreateComplaintRequestDto`, `ComplaintResponseDto`, `ComplaintListResponseDto`
  - [ ] Create `customer-app/.../data/complaint/remote/ComplaintApiService.kt` — Retrofit interface: `createComplaint()`, `getComplaintsForBooking()`
  - [ ] Create `customer-app/.../data/complaint/ComplaintRepository.kt` (interface) + `ComplaintRepositoryImpl.kt`
  - [ ] Create `customer-app/.../data/complaint/di/ComplaintModule.kt` — `@Binds` ComplaintRepository, `@Provides` ComplaintApiService reusing `@AuthOkHttpClient`
  - [ ] Create `customer-app/.../domain/complaint/SubmitComplaintUseCase.kt` + `domain/complaint/SubmitComplaintUseCaseTest.kt`
  - [ ] Create `customer-app/.../domain/complaint/PhotoUploadUseCase.kt` (wraps FirebaseStorage upload, same pattern as `JobPhotoRepositoryImpl`) + test: upload → storagePath; compression to JPEG 80% at 1024px
  - [ ] Create `customer-app/.../domain/complaint/GetComplaintStatusUseCase.kt` + test

- [ ] **T7 — customer-app ViewModel + UI (TDD where applicable)**
  - [ ] Create `customer-app/.../ui/complaint/ComplaintViewModel.kt` + `ComplaintViewModelTest.kt` — states: Idle, PhotoUploading, Submitting, Success(acknowledgeDeadlineAt), Error; `onReasonSelected()`, `onDescriptionChanged()`, `onPhotoSelected()`, `onSubmit()`; `submitEnabled` derived state (reasonCode + description non-empty)
  - [ ] Create `customer-app/.../ui/complaint/ComplaintScreen.kt` — reason picker (customer reason codes), description field (10–2000 char counter), photo picker button (triggers gallery/camera intent), Submit button, success state with status display
  - [ ] Create `customer-app/.../ui/complaint/ComplaintRoutes.kt` + wire `complaint/{bookingId}` route in `AppNavigation.kt` (MainGraph); add complaint nav trigger from booking detail/history screen entry point
  - [ ] Create `customer-app/.../ui/complaint/ComplaintScreenPaparazziTest.kt` — `@Ignore` annotation; no golden recorded on Windows

- [ ] **T8 — technician-app domain + data layer (TDD) — mirrors T6**
  - [ ] Create `technician-app/.../data/complaint/remote/dto/ComplaintDtos.kt`
  - [ ] Create `technician-app/.../data/complaint/remote/ComplaintApiService.kt`
  - [ ] Create `technician-app/.../data/complaint/ComplaintRepository.kt` + `ComplaintRepositoryImpl.kt`
  - [ ] Create `technician-app/.../data/complaint/di/ComplaintModule.kt`
  - [ ] Create `technician-app/.../domain/complaint/SubmitComplaintUseCase.kt` + test (technician reason codes: CUSTOMER_MISCONDUCT, LATE_PAYMENT, SAFETY_CONCERN, OTHER)
  - [ ] Create `technician-app/.../domain/complaint/PhotoUploadUseCase.kt` + test (same Firebase Storage pattern as existing `JobPhotoRepositoryImpl`)
  - [ ] Create `technician-app/.../domain/complaint/GetComplaintStatusUseCase.kt` + test

- [ ] **T9 — technician-app ViewModel + UI (TDD where applicable)**
  - [ ] Create `technician-app/.../ui/complaint/ComplaintViewModel.kt` + `ComplaintViewModelTest.kt`
  - [ ] Create `technician-app/.../ui/complaint/ComplaintScreen.kt` — tech-specific reason codes; otherwise same structure as customer variant
  - [ ] Create `technician-app/.../ui/complaint/ComplaintRoutes.kt` + wire `complaint/{bookingId}` in `technician-app/AppNavigation.kt`
  - [ ] Create `technician-app/.../ui/complaint/ComplaintScreenPaparazziTest.kt` — `@Ignore`

- [ ] **T10 — Pre-Codex smoke gates + Paparazzi cleanup + Codex review**
  - [ ] `bash tools/pre-codex-smoke-api.sh` — must exit 0
  - [ ] `bash tools/pre-codex-smoke.sh customer-app` — must exit 0
  - [ ] `bash tools/pre-codex-smoke.sh technician-app` — must exit 0
  - [ ] `git rm -r customer-app/app/src/test/snapshots/images/ 2>/dev/null || true`
  - [ ] `git rm -r technician-app/app/src/test/snapshots/images/ 2>/dev/null || true`
  - [ ] `codex review --base main` → `.codex-review-passed`
  - [ ] After PR merge: trigger `paparazzi-record.yml` for both apps, commit goldens, remove `@Ignore` in chore branch

---

## Dev Notes

### Complaint reason codes

**Customer reason codes** (maps to `CustomerReasonCodeEnum`):
| Code | Hindi label |
|---|---|
| SERVICE_QUALITY | काम ठीक नहीं हुआ |
| LATE_ARRIVAL | देरी से आए |
| NO_SHOW | आए ही नहीं |
| TECHNICIAN_BEHAVIOUR | व्यवहार खराब था |
| BILLING_DISPUTE | पैसों का झगड़ा |
| OTHER | अन्य |

**Technician reason codes** (maps to `TechnicianReasonCodeEnum`):
| Code | Hindi label |
|---|---|
| CUSTOMER_MISCONDUCT | ग्राहक ने बुरा व्यवहार किया |
| LATE_PAYMENT | पेमेंट नहीं मिली |
| SAFETY_CONCERN | सुरक्षा की समस्या थी |
| OTHER | अन्य |

### Auth pattern for dual-role endpoint
`POST /v1/complaints` cannot use `requireCustomer` HOF because it must accept both customer and technician tokens. Pattern: call `verifyFirebaseIdToken(token)` directly, fetch the booking doc, check `uid == booking.customerId` → `filedBy = CUSTOMER` or `uid == booking.technicianId` → `filedBy = TECHNICIAN`; else 403. The server sets `filedBy` — the request body never includes it (prevents forgery).

### Photo upload — storage path pattern
Firebase Storage path: `complaints/{bookingId}/{uid}/{timestamp}.jpg`. Return the storage path (not a download URL) from `PhotoUploadUseCase`, store it as `photoStoragePath` in the API doc. This is the same pattern as `JobPhotoRepositoryImpl` — the path is saved; signed URLs for owner viewing are generated server-side.

### Schema coordination with E07-S02
E07-S02 adds `ComplaintTypeEnum` (`'RATING_SHIELD' | 'STANDARD'`) and `expiresAt`, `draftOverall`, `draftComment` to `ComplaintDocSchema`. E07-S03 depends on E07-S02 being merged first. New E07-S03 fields (`filedBy`, `reasonCode`, `photoStoragePath`, `acknowledgeDeadlineAt`) are all optional to preserve backward compat with admin-created complaints from E09-S06 which don't have them.

### SLA timer: two breach types
The existing `sla-timer.ts` checks `slaDeadlineAt < @now AND status != RESOLVED`. After E07-S03, it also checks `acknowledgeDeadlineAt < @now AND status == NEW AND escalated != true`. Both breach types set `escalated = true`. FCM payload includes `slaType: "ACKNOWLEDGE" | "RESOLVE"` so the owner app (E09-S06) can display the correct badge.

### `GET /v1/complaints/{bookingId}` — filedBy filter
The query returns only complaints where the complaint's `filedBy` field matches the caller's role (derived from token uid vs booking). A customer cannot see a technician's complaint and vice versa — even for the same booking.

### Paparazzi
Follow `docs/patterns/paparazzi-cross-os-goldens.md` exactly. New `ComplaintScreenPaparazziTest` in both apps must be `@Ignore`d. Delete any auto-generated goldens before push; trigger `paparazzi-record.yml` workflow_dispatch post-merge.

### Patterns referenced
- `docs/patterns/paparazzi-cross-os-goldens.md` — ComplaintScreen Paparazzi stubs
- `docs/patterns/hilt-module-android-test-scope.md` — ComplaintViewModel unit tests = manual constructor injection
- `docs/patterns/kotlin-explicit-api-public-modifier.md` — all new public Kotlin files
- `docs/patterns/firebase-callbackflow-lifecycle.md` — Firebase Storage upload in `PhotoUploadUseCase` (use `task.await()` inside `runCatching` block, `Dispatchers.IO` for bitmap compress)

### libs.versions.toml sync
**Mandatory first task:** copy `customer-app/gradle/libs.versions.toml` → `technician-app/gradle/libs.versions.toml` before any technician-app changes. This prevents Gradle version drift that Codex catches as a P1.

---

## Definition of Done

- [ ] `cd api && pnpm typecheck && pnpm lint && pnpm test:coverage` green (≥80%)
- [ ] `cd customer-app && ./gradlew testDebugUnitTest ktlintCheck assembleDebug` green
- [ ] `cd technician-app && ./gradlew testDebugUnitTest ktlintCheck assembleDebug` green
- [ ] All AC pass via test assertions
- [ ] Pre-Codex smoke gates exit 0 (api + customer-app + technician-app)
- [ ] Paparazzi snapshot dirs deleted from both apps; `@Ignore` on both `ComplaintScreenPaparazziTest`
- [ ] `.codex-review-passed` marker present
- [ ] PR opened; CI green on `main`
- [ ] Post-merge: `paparazzi-record.yml` triggered for both apps; goldens committed; `@Ignore` removed (chore branch)

---

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
