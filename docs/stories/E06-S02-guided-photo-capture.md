# Story E06-S02: Guided photo capture — CameraX UI + Firebase Storage + API

Status: shipped (PR #33, merged 2026-04-23 · SHA `9c592ad`)

> **Epic:** E06 — Service Execution + Payment (`docs/stories/README.md` §E06)
> **Sprint:** S3 (wk 5–6) · **Estimated:** ≤ 1.5 dev-days · **Priority:** **P0 — gates the active-job state machine; every transition requires a photo**
> **Sub-projects:** `technician-app/`, `api/`, `firebase/`
> **Ceremony tier:** Foundation (CameraX permissions + Storage rules + state-gate intercept on every transition — Codex required, `/security-review` triggered for storage-rule + UID-scoped path correctness)
> **Implementation plan:** `plans/E06-S02.md`
>
> **Rescue note (2026-04-26):** This story file was generated retroactively from PR #33's merged code (`api/src/functions/active-job-photos.ts`, `firebase/storage.rules`, `technician-app/.../PhotoCaptureScreen.kt`, `JobPhotoRepositoryImpl.kt`). The implementation has been live on `main` since 2026-04-23; this document closes the BMAD audit gap (#102).

---

## Story

As the **technician** about to advance the active-job state machine,
I want the camera to open automatically before each transition (Start Trip, Mark Reached, Start Work, Complete) and require me to capture and confirm a photo,
so that **every stage is documented, the customer can later see proof of work, the owner can audit disputed jobs, and no transition can complete without evidence — while also being a hard prerequisite for E06-S04 settlement and E06-S05 service report PDFs.**

---

## Acceptance Criteria

### AC-1 · Photo gate intercepts every transition
- **Given** the active-job screen is rendered for any non-terminal status
- **When** the technician taps the stage CTA (Start Trip, Mark Reached, Start Work, Complete)
- **Then** `ActiveJobViewModel` sets `pendingPhotoStage = <next stage>` and overlays `PhotoCaptureScreen`
- **And** the underlying API transition is **NOT** called until a photo has been uploaded and recorded

### AC-2 · UID-scoped Firebase Storage path
- **Given** a photo is captured for booking `B`, technician `T`, stage `S`
- **Then** the file is uploaded to `bookings/{B}/photos/{T}/{S}/{epochMs}.jpg`
- **And** Storage rules enforce: write requires `request.auth.uid == technicianUid` segment of the path, content type `image/*`, size ≤ 5 MB
- **And** read access is restricted to the uploading technician (admin/customer reads go via Firebase Admin SDK signed URLs at API layer)

### AC-3 · API records photo path with stage-workflow validation
- **Given** the technician calls `POST /v1/technicians/active-job/{bookingId}/photos` with `{ stage, storagePath }`
- **Then** the API verifies (a) Firebase ID token, (b) `storagePath` matches regex `^bookings/{bookingId}/photos/{uid}/{stage}/\d+\.jpg$` *with* matching booking/uid/stage extracted from the path
- **And** the API verifies the requested `stage` is the next valid transition target for the booking's current status (e.g. `EN_ROUTE` is valid only when the booking is `ASSIGNED`)
- **And** stale or invalid stage requests return **409**
- **And** mismatched-tech requests return **403**
- **And** missing booking returns **404**
- **And** Cosmos ETag conflicts (412) are translated to **409** "Conflict — please retry"

### AC-4 · JPEG compression on IO dispatcher (no ANR)
- **Given** a captured image
- **Then** the bitmap is decoded, scaled to 1024×1024, and JPEG-encoded at quality 80 — all on `Dispatchers.IO`
- **And** the resulting `image/jpeg` content-type metadata is set on the Storage upload
- **And** the original + scaled bitmaps are recycled to avoid OOM on long shifts

### AC-5 · Confirm / retake flow
- **Given** a photo has just been captured
- **Then** `PhotoCaptureScreen` shows the still image with **Retake** and **Confirm** buttons
- **And** **Retake** clears the captured image and any prior error, returning to the live preview
- **And** **Confirm** triggers the upload + record flow

### AC-6 · CameraX lifecycle correctness
- **Given** `PhotoCaptureScreen` is dismissed (back press, parent navigation, or successful upload)
- **Then** the CameraX provider is unbound in `onDispose`
- **And** the surface is released cleanly (no SurfaceTexture leak warnings in logcat)

### AC-7 · No-camera fallback
- **Given** the device has no usable camera (emulator without camera, or runtime CAMERA permission denied)
- **Then** `PhotoCaptureScreen` renders a fallback message and a **Cancel** button
- **And** the active-job CTA does not advance the state machine

### AC-8 · UI state preserves photo status across polling
- **Given** the booking is being polled (e.g. by the active-job repository)
- **Then** `pendingPhotoStage`, `uploadedStoragePath`, `photoUploadInProgress`, and `photoUploadError` survive the poll cycle
- **And** a poll cannot accidentally cancel an in-flight upload

### AC-9 · State cleanup on transition or cancel
- **Given** a transition has been initiated using an uploaded photo
- **Then** `uploadedStoragePath` is cleared once the transition succeeds (or when the technician cancels the photo gate)
- **And** the next stage starts with a clean photo-state slot

---

## Tasks / Subtasks

> Implementation followed `plans/E06-S02.md` (full work-stream plan). Recap below.

- [x] **WS-0 — Prep** · Sync `customer-app/gradle/libs.versions.toml` → `technician-app/gradle/libs.versions.toml`; add CameraX 1.4.0 catalog entries; add `CAMERA` permission to `AndroidManifest.xml`; add Kover exclusions for `PhotoCaptureScreenKt`, `PhotoModule`, etc.
- [x] **WS-A — API + storage rules (TDD, 6/6)**
  - Extend `BookingDocSchema` with `photos: Record<string, string[]>` field
  - Add `addPhoto(bookingId, stage, storagePath)` to `booking-repository.ts` (ETag-aware)
  - Create `api/src/functions/active-job-photos.ts` with full path/ownership/stage validation
  - Create `firebase/storage.rules` — UID-scoped write + read, 5 MB + image/* content-type
  - 6 Vitest cases: 200, 401, 403 (mismatch tech), 403 (path-mismatch), 404, 409 (stage), 409 (ETag)
- [x] **WS-B — Android domain layer (TDD, 3/3)**
  - `domain/photo/model/JobPhoto.kt`
  - `domain/photo/JobPhotoRepository.kt` (interface)
  - `domain/photo/UploadJobPhotoUseCase.kt`
  - `UploadJobPhotoUseCaseTest` — happy path, upload-fail, record-fail
- [x] **WS-C — Android data layer + Hilt module**
  - `data/photo/PhotoApiService.kt` (Retrofit interface)
  - `data/photo/JobPhotoRepositoryImpl.kt` — Firebase Storage + Retrofit; bitmap compress on `Dispatchers.IO`; storage path returned (NOT download URL)
  - `data/photo/di/PhotoModule.kt` Hilt provides
- [x] **WS-D — UI/ViewModel + CameraX**
  - Extend `ActiveJobUiState.Active` with `pendingPhotoStage`, `uploadedStoragePath`, `photoUploadInProgress`, `photoUploadError`
  - `ActiveJobViewModel` — photo gate methods (`onPhotoCaptured`, `onPhotoRetake`, `onPhotoCancel`, `onPhotoConfirmed`); intercepts every transition; preserves photo state across polls
  - `PhotoCaptureScreen.kt` — full-screen overlay; permission check; CameraX preview; capture; confirm/retake; `onDispose` unbinds; no-camera fallback
  - `ActiveJobScreen` opens `PhotoCaptureScreen` overlay when `pendingPhotoStage != null`
  - `PhotoCaptureScreenTest` `@Ignored` (Paparazzi stub — CI workflow_dispatch only)
- [x] **WS-E — Smoke gate + Codex (6 rounds)**
  - `tools/pre-codex-smoke.sh technician-app` + `tools/pre-codex-smoke-api.sh` PASSED
  - Codex feedback addressed across 6 rounds (see "Codex review history" in dev notes)

---

## Dev Notes

### Context from previous stories
- **E06-S01** introduced the active-job state machine. This story makes the state machine **photo-gated** — `CompleteJob` was already disabled in E06-S01 with a comment "photo gate deferred to E06-S02"; this story closes that loop.
- `BookingEvent.metadata` (widened in E06-S01) carries `{ stage, storagePath }` on photo-record events.
- The state machine remains: `ASSIGNED → EN_ROUTE → REACHED → IN_PROGRESS → COMPLETED`. The valid photo stage for each origin status is the **next** target, not the current one (rationale: a photo at "Mark Reached" documents arrival, not assignment).

### Security invariants (non-negotiable)
1. **UID-scoped paths**. Storage rules use the `technicianUid` segment from the path, not a Cosmos lookup — defence in depth + cheap rule evaluation. Path regex on the API enforces the same.
2. **Storage paths, not download URLs**. The client uploads then sends the **path** to the API. Tokenised download URLs bypass Storage rules once obtained — we never persist them. Customer/admin reads go via short-lived Firebase Admin signed URLs generated server-side.
3. **Stage-workflow validation**. The API maps each booking status to exactly one valid next-photo-stage; mismatched stage requests are rejected with 409. A malicious client cannot pre-record `COMPLETED` photos for an `ASSIGNED` booking.
4. **ETag concurrency**. `bookingRepo.addPhoto` uses Cosmos ETag; on 412 we translate to 409 so the client retries cleanly.
5. **Content-type metadata**. Set explicitly to `image/jpeg` server-side metadata so the Storage rules `request.resource.contentType.matches('image/.*')` cannot be spoofed.

### Codex review history (6 rounds)
1. **R1**: JPEG content type, UID-scoped Storage path, IO dispatcher for compression
2. **R2**: Preserve photo state on poll, restrict Storage reads, ETag concurrency, no-camera fallback
3. **R3**: Stage-workflow validation + offline design doc reference
4. **R4**: Storage path not URL; path-ownership validation; transition retry on failure
5. **R5**: Validate path `bookingId` matches route param; clear `uploadedStoragePath` on cancel/new-transition
6. **R6**: `onPhotoRetake` clears error; CameraX unbind on dismiss; transition keeps spinner active

### Paparazzi
- `PhotoCaptureScreenTest` and `ActiveJobScreenPaparazziTest` are `@Ignored`. Trigger `paparazzi-record.yml` workflow_dispatch on Linux CI to record. Per `docs/patterns/paparazzi-cross-os-goldens.md`, never record on Windows.

### Offline behaviour (deferred)
- Photo upload retries are not queued in Room. If the upload fails, the photo gate stays open and the technician retakes. A future story may add a Storage upload queue if field reports show real flaky-network friction; for now Storage's own resumable upload + the in-screen retry covers the case.

---

## Definition of Done

- [x] API: 80/80 tests pass (6 new for `active-job-photos`)
- [x] Android: `UploadJobPhotoUseCaseTest` 3/3; `ActiveJobViewModelTest` photo-gate cases pass; `PhotoCaptureScreenTest` `@Ignored`
- [x] Pre-Codex smoke gates exit 0
- [x] `.codex-review-passed` marker present (after 6 rounds)
- [x] `/security-review` triggered (storage rules + UID scoping); 0 P1 after Codex round 6
- [x] PR #33 opened; CI green; merged 2026-04-23 (SHA `9c592ad`)

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (executing-plans).

### Completion Notes
- Six rounds of Codex review reflect the security-sensitivity of the photo path. The R5 fix (path `bookingId` must match route param) prevented a forgery vector where a malicious client could record photos against arbitrary bookings.
- CameraX preview was tested by hand on Pixel 6 + emulator; goldens deferred to CI.
- The IO dispatcher fix (R1) eliminated an ANR seen in dogfood when capturing on lower-end devices.

### File List
See PR #33. Authoritative file map in `plans/E06-S02.md` §"File Map".
