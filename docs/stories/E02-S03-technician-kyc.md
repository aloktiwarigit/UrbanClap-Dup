# Story E02-S03: Technician KYC — DigiLocker Aadhaar consent + PAN OCR via Form Recognizer

Status: shipped (PR #17, merged 2026-04-20, commit `41e65d8`) — **retroactive docs**

> **Epic:** E02 — Authentication & Onboarding (`docs/stories/README.md` §E02)
> **Sprint:** S1 (wk 1–2) · **Estimated:** ≤ 1 dev-day · **Priority:** P0 — blocks E05 (dispatch requires KYC'd technicians)
> **Sub-projects:** `technician-app/` + `api/`
> **Ceremony tier:** Foundation (cross-cutting Android + API; PII handling — Aadhaar consent, PAN OCR, Firebase Storage; security-sensitive)
> **FR reference:** FR-1.2
> **Prerequisite:** E02-S02 technician auth merged (KYC flow runs after sign-in)
> **Retroactive note:** This story file is being written *after* the implementation merged. PR #17 landed `plans/E02-S03.md` but never committed `docs/stories/E02-S03-*.md`. Acceptance criteria below are reverse-engineered from the merged code under `technician-app/.../{domain,data,ui}/kyc/**` and `api/src/{schemas,services,functions/kyc,middleware}/**`.

---

## Story

As a **technician who has just authenticated** (post-E02-S02),
I want a 3-step KYC flow — Aadhaar verification via DigiLocker OAuth2 (consent only, never the full number), PAN photo capture + OCR via Azure Form Recognizer, and a graceful manual-review fallback when either stage fails,
so that **I can become dispatch-eligible without giving up my Aadhaar number to the platform, the owner can review failures asynchronously, and the API never touches PII it doesn't need (Aadhaar masking + Firebase Storage scoped paths + tokenised tech identity)**.

---

## Acceptance Criteria

### AC-1 · Aadhaar verification via DigiLocker OAuth2 (consent flow, never full number)
- **Given** the technician taps "Verify Aadhaar" on `KycScreen`
- **When** Custom Tabs opens the DigiLocker consent URL with `redirectUri` pointing back to the deeplink scheme
- **Then** the redirect carries an `authCode` that the app POSTs to `/v1/kyc/aadhaar` (`api/src/functions/kyc/submit-aadhaar.ts`)
- **And** `digilocker.service.ts` exchanges the auth code for a verified Aadhaar payload
- **And** ONLY the masked last-4 digits (`"XXXX-XXXX-1234"`) and `aadhaarVerified: true` flag are persisted to Cosmos via `technician-repository.upsertKycStatus(...)`
- **And** the full 12-digit Aadhaar number is **never** logged or stored — verified by `api/tests/kyc/submit-aadhaar.test.ts`

### AC-2 · PAN photo capture + Firebase Storage upload + Form Recognizer OCR
- **Given** the technician captures their PAN card photo on `KycScreen` step 2
- **When** `FirebaseStorageUploaderImpl.upload(...)` writes the photo to `technicians/<technicianId>/pan/<timestamp>.jpg`
- **Then** the app POSTs `{ technicianId, firebaseStoragePath }` to `/v1/kyc/pan-ocr`
- **And** `formRecognizer.service.ts:extractPanFromStoragePath(...)` calls `@azure/ai-form-recognizer`
- **And** on success, the extracted PAN number is persisted via `technician-repository.upsertKycStatus({ panNumber, panImagePath, kycStatus: 'PAN_DONE' })`
- **And** the response returns `{ kycStatus, panNumber }`

### AC-3 · Form Recognizer 429 / failure → graceful `MANUAL_REVIEW` fallback
- **Given** `formRecognizer.service.ts` receives a 429 (rate-limit) or extraction failure
- **Then** the handler does NOT throw 500
- **And** instead persists `kycStatus: 'MANUAL_REVIEW'` and returns 200 with that status to the client
- **And** the technician sees "We'll review your PAN manually — you'll hear back within 24h" on `KycScreen` step 3 (review state)
- **And** the owner can later resolve via admin tooling (out of scope; tracked under E09)

### AC-4 · `KycStatus` state machine + Cosmos schema
- **Given** the `KycStatus` Zod enum in `api/src/schemas/kyc.ts`
- **Then** valid values are: `PENDING`, `AADHAAR_DONE`, `PAN_DONE`, `COMPLETE`, `PENDING_MANUAL`, `MANUAL_REVIEW`
- **And** transitions: `PENDING → AADHAAR_DONE` (after AC-1); `AADHAAR_DONE → PAN_DONE` (after AC-2); `PAN_DONE → COMPLETE` (when both verified); `* → MANUAL_REVIEW` (after AC-3 failure)
- **And** `TechnicianKycSchema` enforces the shape: `{ aadhaarVerified, aadhaarMaskedNumber, panNumber, panImagePath, kycStatus, updatedAt }`
- **And** `technician-repository.ts:upsertKycStatus(technicianId, patch)` does a Cosmos point-read + merge + upsert (preserving the technician's other fields)

### AC-5 · Firebase ID token verification on every KYC endpoint
- **Given** any of the 3 KYC endpoints (`submit-aadhaar`, `submit-pan-ocr`, `get-kyc-status`)
- **Then** `verifyTechnicianToken` middleware (`api/src/middleware/verifyTechnicianToken.ts`) verifies the `Authorization: Bearer <Firebase ID token>` header via `firebase-admin`
- **And** unauthenticated requests return 401
- **And** the verified `technicianId` (Firebase UID) is the only identity the handlers trust — the request body's `technicianId` is checked against the token's UID

### AC-6 · `KycRepository` + `KycOrchestrator` on the Android side (TDD)
- **Given** the technician-app KYC domain layer
- **Then** `KycRepository` interface + `KycRepositoryImpl` (Retrofit + Moshi) implement: `exchangeAadhaarCode(authCode, redirectUri)`, `submitPanOcr(firebaseStoragePath)`, `getKycStatus()`
- **And** `DigiLockerConsentUseCase` wraps `KycRepository.exchangeAadhaarCode` as `Flow<DigiLockerResult>`
- **And** `PanOcrUseCase` orchestrates Storage upload + OCR submit
- **And** `KycOrchestrator` sequences the 3 steps and exposes `Flow<KycState>`
- **And** all use cases have JUnit 5 + MockK tests + `KycRepositoryImpl` has 4 cases covering success, 401, 429, network failure

### AC-7 · `KycScreen` is a 3-step flow with reactive UI state
- **Given** the technician on the auth-success destination
- **When** `OnboardingGraph` routes to `KycScreen` (replaces the placeholder from E02-S02)
- **Then** the screen drives a 3-step flow: Aadhaar (Custom Tabs deeplink) → PAN (camera capture + Firebase Storage upload) → Review (status display)
- **And** `KycViewModel` exposes `KycUiState` derived from `KycOrchestrator.state` + UI events
- **And** `KycScreenPaparazziTest.kt` records goldens for the 3 steps + manual-review state

### AC-8 · `AndroidManifest.xml` deeplink scheme for DigiLocker callback
- **Given** the DigiLocker OAuth2 redirect URI
- **Then** `technician-app/app/src/main/AndroidManifest.xml` declares the `<intent-filter>` with the deeplink scheme so Custom Tabs returns to the app on consent completion

### AC-9 · `libs.versions.toml` synced + KYC deps added
- **Given** the project CLAUDE.md §"Android story invariants" rule
- **When** the story starts
- **Then** the first task is `cp customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml`
- **And** the technician-app catalog adds: `retrofit-core` 2.11.0, `retrofit-moshi`, `okhttp-logging` 4.12.0, `moshi-kotlin` 1.15.1, `androidx-browser` 1.8.0, `firebase-storage` 21.0.1
- **And** customer-app's catalog gets the same additions for parity (no functional change yet — sync discipline)

### AC-10 · API tests cover the 3 endpoints + service layer
- **Given** Vitest as the API test framework
- **Then** the following test files pass:
  - `api/tests/schemas/kyc.test.ts` (65) — Zod schema round-trips
  - `api/tests/cosmos/technician-repository.test.ts` (77) — upsert merge logic
  - `api/tests/services/formRecognizer.service.test.ts` (78) — extraction success + 429 → `MANUAL_REVIEW` fallback
  - `api/tests/kyc/submit-aadhaar.test.ts` (80) — happy path + 401 + Aadhaar masking
  - `api/tests/kyc/submit-pan-ocr.test.ts` (98) — happy path + Form Recognizer fallback
  - `api/tests/kyc/kyc-status.test.ts` (76) — `get-kyc-status` for all states

---

## Tasks / Subtasks (as actually shipped)

> Implementation merged via PR #17. Work-stream order in `plans/E02-S03.md` followed (WS-A schemas/models → WS-B1/B2 use cases + services → WS-C handlers + DI → WS-D UI → WS-E smoke).

- [x] **WS-A — Domain models + data layer + Cosmos schema**
  - [x] `technician-app/gradle/libs.versions.toml` — sync from customer-app + add KYC deps
  - [x] `api/src/schemas/kyc.ts` (55) — `KycStatusSchema`, `TechnicianKycSchema`, request/response schemas
  - [x] `api/src/cosmos/technician-repository.ts` (41) — `upsertKycStatus`
  - [x] `technician-app/.../domain/kyc/model/` — `KycStatus.kt`, `KycState.kt`, `DigiLockerResult.kt`, `PanOcrResult.kt`
  - [x] `technician-app/.../data/kyc/KycRepository.kt` interface + `KycRepositoryImpl.kt` + 4-case test (`KycRepositoryImplTest.kt`, 98 lines)

- [x] **WS-B1 — DigiLocker consent use case (TDD)**
  - [x] RED: `DigiLockerConsentUseCaseTest.kt` (74)
  - [x] GREEN: `DigiLockerConsentUseCase.kt` (21) — wraps `KycRepository.exchangeAadhaarCode` as `Flow`

- [x] **WS-B2 — Firebase Storage helper + middleware + Form Recognizer service + PAN OCR (TDD)**
  - [x] `api/src/services/digilocker.service.ts` (46) — auth-code exchange
  - [x] `api/src/firebase/admin.ts` (11) — `firebase-admin` singleton
  - [x] `api/src/middleware/verifyTechnicianToken.ts` (12) — Firebase ID token verification
  - [x] RED: `formRecognizer.service.test.ts` (78) → GREEN: `formRecognizer.service.ts` (35) — `extractPanFromStoragePath`; 429 → `MANUAL_REVIEW`
  - [x] RED: `kyc/submit-pan-ocr.test.ts` (98) → GREEN: `submit-pan-ocr.ts` (53) — uses `res.jsonBody` (HttpResponseInit pattern, consistent with existing test suite)
  - [x] `technician-app/.../data/kyc/FirebaseStorageUploaderImpl.kt` (22) + `FirebaseStorageUploader.kt` interface (10)
  - [x] RED: `PanOcrUseCaseTest.kt` (64) → GREEN: `PanOcrUseCase.kt` (30)
  - [x] RED: `KycOrchestratorTest.kt` (52) → GREEN: `KycOrchestrator.kt` (29)

- [x] **WS-C — Hilt module + remaining API handlers**
  - [x] `technician-app/.../data/kyc/di/KycModule.kt` (53)
  - [x] RED: `kyc/submit-aadhaar.test.ts` (80) → GREEN: `submit-aadhaar.ts` (64)
  - [x] RED: `kyc/kyc-status.test.ts` (76) → GREEN: `get-kyc-status.ts` (42)

- [x] **WS-D — UI + ViewModel + Navigation + Paparazzi**
  - [x] RED + GREEN: `ui/kyc/KycViewModel.kt` (92) + `KycViewModelTest.kt` (127)
  - [x] `ui/kyc/KycUiState.kt` (29)
  - [x] GREEN: `ui/kyc/KycScreen.kt` (279) — 3-step flow
  - [x] `KycScreenPaparazziTest.kt` (86) — recorded on CI Linux
  - [x] `AndroidManifest.xml` — deeplink scheme for DigiLocker callback
  - [x] `navigation/OnboardingGraph.kt` updated — `KycScreen` replaces placeholder
  - [x] `navigation/AppNavigation.kt` minor route addition

- [x] **WS-E — Pre-Codex smoke + Codex review**
  - [x] `tools/pre-codex-smoke-api.sh` minor fix (1-line update)
  - [x] `bash tools/pre-codex-smoke.sh technician-app` exit 0
  - [x] `bash tools/pre-codex-smoke-api.sh` exit 0
  - [x] Codex review passed; PR opened → CI green → merged

---

## Dev Notes

### What was actually shipped (per PR #17 file list)

48 files changed, 4,375 insertions:

```
api/                                              19 new files (1 schema, 1 repo, 2 services, 1 middleware, 3 functions, 6 tests, 1 firebase admin singleton, 4 misc)
technician-app/.../{domain,data,ui}/kyc/**        18 new Kotlin files (4 models, repo + impl, 3 use cases + orchestrator, KycModule, ViewModel + UiState + Screen)
technician-app/.../navigation/{App,Onboarding}    2 modified (KYC route + onboarding graph wiring)
technician-app/app/src/main/AndroidManifest.xml   +9 lines (deeplink)
technician-app/gradle/libs.versions.toml          synced + 6 new deps
customer-app/gradle/libs.versions.toml            +7 lines (parity sync)
plans/E02-S03.md                                  +2,165 lines (Foundation tier — within 1500 split warning ⚠ but accepted)
tools/pre-codex-smoke-api.sh                      +1 line
```

### Why this story is being written retroactively

The 2026-04-26 audit (`docs/audit/story-completeness-2026-04-26.md`) found that PR #17 landed `plans/E02-S03.md` but never committed `docs/stories/E02-S03-*.md`. This file closes the gap.

### Plan size note

`plans/E02-S03.md` is 2,165 lines — over the Foundation-tier 1,500-line split warning. The plan author explicitly noted the size and chose not to split because the cross-cutting nature of KYC (Android + API in one PR) warranted single-execution context. PR #17 landed cleanly; future cross-cutting stories of similar size should evaluate splitting by sub-project (Android KYC story + API KYC story).

### PII handling

The story is the first to touch user-supplied PII (Aadhaar, PAN). The implementation enforces:

| PII surface | Handling |
|---|---|
| Aadhaar number (12 digits) | Never stored. Only verified flag + masked last-4 digits persist |
| Aadhaar consent code | One-time use; not logged in handler responses |
| PAN photo | Firebase Storage path `technicians/<UID>/pan/<timestamp>.jpg`; storage rules scope to technician's own UID (out of scope for this story; tracked in storage-rules ADR) |
| PAN number | Server-side only; persisted to Cosmos under technician document; not exposed to other technicians |
| Firebase ID token | Verified per-request via `firebase-admin`; `technicianId` derived from token UID, NOT request body |

### Pattern adherence

| Pattern doc | Used here |
|---|---|
| `firebase-callbackflow-lifecycle.md` | `DigiLockerConsentUseCase` flow construction |
| `hilt-module-android-test-scope.md` | `KycRepositoryTest`, `PanOcrUseCaseTest` use manual JVM construction |
| `kotlin-explicit-api-public-modifier.md` | All public KYC symbols carry explicit `public` |
| `paparazzi-cross-os-goldens.md` | `KycScreenPaparazziTest` goldens on CI Linux |

### References

- [Source: `plans/E02-S03.md` — implementation plan (2165 lines, Foundation tier)]
- [Source: `docs/prd.md` §FR-1.2]
- [Source: `docs/threat-model.md` — Aadhaar handling rule]
- [Source: `docs/stories/README.md` §E02-S03 row]

---

## Definition of Done

- [x] `cd technician-app && ./gradlew testDebugUnitTest assembleDebug` green (verified on PR #17 CI)
- [x] `cd api && pnpm test:coverage` green (verified on PR #17 CI)
- [x] All AC pass via 6 API test files (~474 lines) + 5 Android test files (~427 lines)
- [x] `KycScreenPaparazziTest` goldens recorded on CI Linux
- [x] Pre-Codex smoke gate exited 0 for both `technician-app` and `api`
- [x] `.codex-review-passed` marker shipped in PR #17
- [x] CI green on `main` after merge (commit `41e65d8`)
- [x] Aadhaar full number never persisted (verified by `submit-aadhaar.test.ts`)
- [x] `libs.versions.toml` parity restored across customer-app + technician-app

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #17 commit attribution)

### Completion Notes
PR #17 merged 2026-04-20 as commit `41e65d8`. PII handling reviewed during Codex pass — masked-Aadhaar persistence pattern locked in for any future Indian-government-doc verification flow. PAN OCR fallback to `MANUAL_REVIEW` (instead of HTTP 500) was a deliberate UX choice — keeps technician unblocked even when Form Recognizer rate-limits.

### File List
See PR #17: 48 files. Highlights — Cosmos `technicians.kyc` schema, 3 KYC functions (`submit-aadhaar`, `submit-pan-ocr`, `get-kyc-status`), `formRecognizer` + `digilocker` services, Firebase ID-token middleware, Android KYC domain (4 models + repo + 3 use cases + orchestrator), KycModule + KycViewModel + KycScreen + Paparazzi goldens, deeplink wiring, OnboardingGraph route to KycScreen.
