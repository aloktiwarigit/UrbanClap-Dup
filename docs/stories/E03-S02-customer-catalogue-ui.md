# Story E03-S02: Customer catalogue UI — categories, service list, service detail

Status: shipped (PR #16, merged 2026-04-20, commit c10a438) — **retroactive docs**

> **Epic:** E03 — Service Discovery + Booking Flow (`docs/stories/README.md` §E03)
> **Sprint:** S2 (wk 3–4) · **Estimated:** ≤ 1 dev-day · **Priority:** P0
> **Sub-project:** `customer-app/`
> **Ceremony tier:** Foundation (introduces the customer-app's Retrofit/Moshi/Coil networking layer + Hilt module + first three Compose screens of the booking funnel)
> **Prerequisite:** E03-S01 (catalogue API + seed data must exist).
> **Retroactive note:** This story file is being written *after* the implementation merged. PR #16 shipped without `docs/stories/E03-S02-*.md` ever landing in main. The accompanying plan `plans/E03-S02.md` was committed as part of the PR and is unchanged. Acceptance criteria below are reverse-engineered from the merged code (see `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt`, `ServiceListScreen.kt`, `ServiceDetailScreen.kt` for the canonical implementation).

---

## Story

As a **first-time customer opening the customer app**,
I want a photo-first catalogue of services with categories, a list of services per category, and a detail page that shows price, duration, includes, add-ons, and a Trust Dossier preview,
so that **I can pick a service in 3 taps and see exactly what I'm paying for** (FR-2.1, FR-2.2; UX §7.1).

---

## Acceptance Criteria

### AC-1 · Photo-first category grid replaces HomeScreen
- **Given** the customer launches the customer-app
- **When** the start destination renders
- **Then** the legacy `HomeScreen` placeholder is gone (file deleted) and `CatalogueHomeScreen` is shown
- **And** categories render as a `LazyVerticalGrid` of cards with photo + name + service count
- **And** Coil loads category images from Firebase Storage CDN URLs (no auth headers needed)
- **And** the screen uses `LazyVerticalGrid` for memory efficiency on large catalogues

### AC-2 · Service list per category
- **Given** the customer taps a category card
- **When** navigation routes to `ServiceListScreen` with the categoryId
- **Then** the screen shows a `LazyColumn` of service cards: photo, name, base price, duration
- **And** the `ServiceListViewModel` exposes `StateFlow<ServiceListUiState>` (Loading/Loaded/Error)
- **And** taps on a service navigate to `ServiceDetailScreen`

### AC-3 · Service detail with includes, add-ons, Trust Dossier preview, Book Now
- **Given** the customer arrives on `ServiceDetailScreen`
- **Then** the screen shows: hero image, name, base price, duration, Includes list, AddOns list with per-line prices, a Trust Dossier preview stub, and a "Book Now" CTA disabled in this story (booking is wired in E03-S03b)
- **And** state is exposed via `ServiceDetailViewModel` → `StateFlow<ServiceDetailUiState>`

### AC-4 · Clean Architecture: domain / data / UI
- **Domain models:** `Category`, `Service`, `AddOn` value objects in `domain/catalogue/model/`
- **Use cases:** `GetCategoriesUseCase`, `GetServicesForCategoryUseCase`, `GetServiceDetailUseCase` — each thin mappers over the repository, returning `Flow<Result<T>>`
- **Data layer:** `CatalogueRepository` interface + `CatalogueRepositoryImpl` calling `CatalogueApiService` (Retrofit) and mapping DTO → domain
- **DI:** `CatalogueModule` (Hilt) provides `Retrofit`, `OkHttpClient`, `Moshi`, `CatalogueApiService`; binds `CatalogueRepositoryImpl`

### AC-5 · Networking — Retrofit + OkHttp + Moshi
- **Given** new dependencies
- **Then** `customer-app/gradle/libs.versions.toml` has Retrofit 2.11.0, OkHttp 4.12.0, Moshi 1.15.1, Coil 2.7.0
- **And** `technician-app/gradle/libs.versions.toml` is byte-for-byte synchronized (per Android-story invariant in CLAUDE.md)
- **And** `BuildConfig.API_BASE_URL` points at the dev/prod API host
- **And** `AndroidManifest.xml` declares `<uses-permission android:name="android.permission.INTERNET"/>`

### AC-6 · String localization (EN + HI)
- **Given** new UI surfaces
- **Then** `res/values/strings.xml` contains 15 new EN keys for catalogue screens
- **And** `res/values-hi/strings.xml` contains the matching Hindi translations
- **And** every visible string in catalogue Compose screens references `stringResource(R.string.…)`

### AC-7 · Navigation wired into MainGraph
- **Given** `CatalogueRoutes` defines `CATALOGUE_HOME_ROUTE`, `SERVICE_LIST_ROUTE` (with `categoryId` arg), `SERVICE_DETAIL_ROUTE` (with `serviceId` arg)
- **Then** `MainGraph` registers all three composables via `hiltViewModel()` and `composable(...)` blocks
- **And** the start destination is `CATALOGUE_HOME_ROUTE`

### AC-8 · Test coverage + Paparazzi stubs
- **Given** the implementation
- **Then** unit tests exist for repository (`CatalogueRepositoryImplTest`), all 3 use cases, and all 3 ViewModels
- **And** Paparazzi snapshot tests exist for `CatalogueHomeScreen` and `ServiceDetailScreen`
- **And** Paparazzi goldens are recorded on CI Linux only (per `docs/patterns/paparazzi-cross-os-goldens.md` — never on Windows)
- **And** Kover coverage thresholds (≥80% line, ≥70% branch, ≥80% instruction) pass with documented exclusions for Compose lambdas + Moshi adapters + SDK-dependent use cases

### AC-9 · ViewModel visibility — internal @HiltViewModel
- All three ViewModels (`CatalogueHomeViewModel`, `ServiceListViewModel`, `ServiceDetailViewModel`) are declared `internal class … @HiltViewModel` to keep the public API surface minimal under explicit-API mode

---

## Tasks / Subtasks (as actually shipped)

> Implementation merged via PR #16. Tasks below match the work-stream plan at `plans/E03-S02.md` and the code in main.

- [x] **WS-A — Domain models + data layer**
  - [x] Add Retrofit/OkHttp/Moshi/Coil to `libs.versions.toml` (both apps in sync)
  - [x] `domain/catalogue/model/Category.kt`, `Service.kt`, `AddOn.kt`
  - [x] `data/catalogue/remote/CatalogueApiService.kt` + `dto/CategoryDto.kt`, `dto/ServiceDto.kt`
  - [x] `data/catalogue/CatalogueRepository.kt` + `CatalogueRepositoryImpl.kt`
  - [x] `data/catalogue/di/CatalogueModule.kt` (Retrofit/OkHttp/Moshi providers + repo binding)
  - [x] `CatalogueRepositoryImplTest.kt`

- [x] **WS-B — Use cases (TDD)**
  - [x] `domain/catalogue/GetCategoriesUseCase.kt` + test (3 cases)
  - [x] `domain/catalogue/GetServicesForCategoryUseCase.kt` + test (3 cases)
  - [x] `domain/catalogue/GetServiceDetailUseCase.kt` + test (3 cases)
  - [x] `ui/catalogue/CatalogueHomeUiState.kt`, `ServiceListUiState.kt`, `ServiceDetailUiState.kt` (sealed)

- [x] **WS-C — ViewModels + navigation + strings**
  - [x] `CatalogueHomeViewModel.kt` + test
  - [x] `ServiceListViewModel.kt` + test
  - [x] `ServiceDetailViewModel.kt` + test
  - [x] `navigation/CatalogueRoutes.kt`
  - [x] `navigation/MainGraph.kt` — wire 3 destinations via `hiltViewModel()`
  - [x] `res/values/strings.xml` + `res/values-hi/strings.xml` (15 keys each)

- [x] **WS-D — Compose screens + Paparazzi stubs**
  - [x] `ui/catalogue/CatalogueHomeScreen.kt`
  - [x] `ui/catalogue/ServiceListScreen.kt`
  - [x] `ui/catalogue/ServiceDetailScreen.kt`
  - [x] Paparazzi tests for CatalogueHome + ServiceDetail (`@Ignore` on Windows; goldens via CI workflow_dispatch)
  - [x] Delete `ui/home/HomeScreen.kt`

- [x] **WS-E — Smoke gate + Codex**
  - [x] ktlintFormat applied (30 files)
  - [x] Kover exclusions extended (Compose lambdas + Moshi adapters + SDK-dependent use cases)
  - [x] Pre-Codex smoke gate green
  - [x] Codex review passed; `.codex-review-passed` marker shipped

---

## Dev Notes

### What was actually shipped (per PR #16 file list)
- 17 main-source Kotlin files (3 domain, 5 data, 9 UI/nav)
- 9 test files (1 repository, 3 use case, 3 ViewModel, 2 Paparazzi)
- 15 EN + 15 HI string resources
- `customer-app/build.gradle.kts` + `libs.versions.toml` (both apps)
- `tools/pre-codex-smoke-api.sh` + `pre-codex-smoke-web.sh` patched to use named pnpm scripts (`typecheck`/`lint` instead of bare `tsc`/`eslint`)

### Why this story is being written retroactively
- During the 2026-04-26 story-completeness audit, PR #16 was found to have shipped with `plans/E03-S02.md` but no `docs/stories/E03-S02-*.md` ever in main.
- This rescue PR closes the audit hole; merged code remains the source of truth.

### Patterns referenced (per plan)
- `docs/patterns/paparazzi-cross-os-goldens.md` — goldens recorded on CI only; deleted before push from Windows
- `docs/patterns/hilt-module-android-test-scope.md` — JVM unit tests use `mockk()`, not `@HiltAndroidTest`
- `docs/patterns/kotlin-explicit-api-public-modifier.md` — every public symbol carries explicit `public` (or `internal` where appropriate, e.g. ViewModels)
- `docs/patterns/firebase-callbackflow-lifecycle.md` — N/A here (Coil loads Firebase Storage CDN URLs as plain HTTPS; no async SDK callbacks)

---

## Definition of Done

- [x] `cd customer-app && ./gradlew :app:testDebugUnitTest :app:ktlintCheck :app:assembleDebug :app:koverVerify` green (PR #16 CI)
- [x] All AC pass via test assertions
- [x] Pre-Codex smoke gate exited 0
- [x] `.codex-review-passed` marker shipped in PR #16
- [x] Paparazzi goldens recorded via `paparazzi-record.yml` workflow_dispatch on CI (post-merge)
- [x] CI green on `main` after merge (commit c10a438)

---

## Dev Agent Record

### Agent Model Used
Claude (per PR #16 commit attribution)

### Completion Notes
PR #16 merged 2026-04-20 as commit c10a438. Codex review passed; no P1 findings.

### File List
See PR #16: 17 main-source Kotlin files + 9 test files + 2 string resource files + build/version files + 2 smoke-script tweaks.
