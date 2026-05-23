# ADR-0023 — Observability Stack: Crashlytics + App Check + PostHog (technician-app)

**Status:** Accepted  
**Date:** 2026-05-13  
**Deciders:** Alok Tiwari  
**Wave:** W5 — Quality floor

---

## Context

Wave 5 closes the remaining observability gaps identified in the 4-agent audit of the technician-app:

- No crash reporting beyond Sentry (Sentry is present but Firebase Crashlytics gives deeper Android-native context: ANRs, native crashes, ProGuard-mapped stack traces per release).
- No Firebase App Check — any caller with the Firebase project config can invoke Firebase services without attestation.
- No PostHog event instrumentation — the locale-switch path (E12-S03c / W4) has no analytics coverage.

The constraint is ₹0 operational infra at pilot scale (≤5 000 bookings/mo). All three SDKs are free at pilot scale and are covered by the existing Claude Max / free-tier stack.

---

## Decision

### 1. Firebase Crashlytics (`firebase-crashlytics-ktx`, plugin `com.google.firebase.crashlytics`)

- Applied in addition to Sentry. Crashlytics captures ANRs, native crashes, and ProGuard-mapped JVM crashes that may be missed by the Sentry SDK.
- Auto-initializes via the Gradle plugin + `google-services.json`; wired into `CrashlyticsInitializer` (called from `HomeservicesTechnicianApplication.onCreate`).
- Collection enabled at runtime; no PII is added to crash keys (only `app_id` = package name).

### 2. Firebase App Check (`firebase-appcheck-playintegrity`, debug variant `firebase-appcheck-debug`)

- Uses **Play Integrity** provider in release builds; **debug** provider for debug/test builds.
- Initialization in `AppCheckInitializer` (called from `HomeservicesTechnicianApplication.onCreate`) installs the provider factory before any Firebase service call.
- Covers: Firebase Auth, Firebase Storage, FCM token registration, Firebase Realtime Database.
- **Limitation (W5 scope):** App Check attestation is NOT wired into the Azure Functions REST API layer because the W1 NetworkModule refactor (central `@AuthOkHttpClient` interceptor) is not yet on `main`. REST API endpoints continue to rely on Firebase ID token authentication only. A follow-up story (`E-AppCheck-API`) should add App Check token header to the `@AuthOkHttpClient` interceptor once W1 lands on main.

### 3. PostHog Android SDK (`com.posthog.android:posthog`, version `3.13.0`)

- Initialized in `PostHogInitializer` (called from `HomeservicesTechnicianApplication.onCreate`).
- API key and host injected via `BuildConfig.POSTHOG_API_KEY` / `BuildConfig.POSTHOG_HOST`; blank key → no-op init.
- `captureApplicationLifecycleEvents = true` — tracks app open/background automatically.
- `captureScreenViews = false` — screens are tracked explicitly at Compose navigation events.
- First event: `tech_locale_switched` (fired from `LanguageSettingsViewModel.onSave`), properties: `locale` (BCP 47 tag e.g. `"hi"`, `"en"`).

---

## Consequences

**Positive:**
- ANR + native crash coverage from Crashlytics improves pilot-phase bug triage.
- App Check reduces Firebase resource abuse risk at pilot (Play Integrity attestation).
- PostHog gives product analytics on locale adoption rates in Ayodhya/UP market.

**Neutral / trade-offs:**
- App Check adds ~50–200 ms latency on first Firebase call per session (Play Integrity token fetch). Acceptable for pilot.
- Dual crash reporters (Sentry + Crashlytics) have minor overlap; each captures a class of errors the other misses — both are free-tier so no cost concern.
- PostHog `captureApplicationLifecycleEvents` fires on every foreground event; contributes to the 1M event/mo free tier. At pilot scale (<5 000 active technicians/mo) this is negligible.

**Negative:**
- App Check does NOT cover Azure Functions REST endpoints in this wave (see limitation above). This is explicitly tracked and not blocking pilot launch.

---

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Crashlytics only, no Sentry | Sentry has better React Native / cross-platform support for the admin-web; keeping both is future-proof |
| reCAPTCHA App Check provider | Requires a UI challenge; Play Integrity is silent / automatic and appropriate for a native Android app |
| Firebase Analytics instead of PostHog | Firebase Analytics is not in the free-tier stack (billing linkage); PostHog is OSS with a generous free tier and better product analytics primitives |
| Inject PostHog via Hilt | Adds DI ceremony for a singleton; `PostHog.capture()` is already a no-op when not initialized — `runCatching` wrapper is sufficient |
