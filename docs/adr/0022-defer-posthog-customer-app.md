# ADR-0022: Defer PostHog SDK Integration in customer-app

**Status:** Accepted  
**Date:** 2026-05-12  
**Deciders:** Alok Tiwari  
**Story:** E18-S06 (Sentry user-context + breadcrumbs + PostHog decision)

---

## Context

E18-S06 required a decision: integrate the PostHog Android SDK for product-analytics event capture now, or defer to a later story.

The PostHog Cloud tier used in this project (1M events/month free) is confirmed in the ₹0 stack (CLAUDE.md, `docs/architecture.md`). PostHog is also listed as a planned dependency in `customer-app/CLAUDE.md`. However, the SDK was not present in `customer-app/gradle/libs.versions.toml` at the time this story was executed.

## Decision

**Defer PostHog SDK integration.** Do not add the SDK in this story.

Sentry wiring (user-context + navigation breadcrumbs) is implemented as planned. PostHog integration is deferred to a dedicated story (E18-S07 or equivalent).

## Rationale

1. **Sentry already covers the must-haves.** Error monitoring, crash reports, navigation breadcrumbs, and user-session correlation are all in place after E18-S06. These are the operational observability essentials needed before pilot launch.

2. **PostHog integration is a non-trivial SDK addition.** Adding the PostHog Android SDK introduces:
   - A new Gradle dependency (≈1–2 MB APK size increase).
   - An `Application.onCreate` initialisation path that must be guarded by a `BuildConfig` field (`POSTHOG_API_KEY`) wired through all three build variants.
   - A Hilt-injected `Analytics` interface + `PostHogAnalytics` + `NoOpAnalytics` bindings.
   - Call sites in `BookingViewModel` and future ViewModels.
   - These changes deserve their own story, plan, and Codex review — not an appendage to E18-S06.

3. **APK size budget.** The PostHog Android SDK + OkHttp transitive deps add measurable APK weight. At pilot scale (Ayodhya/UP rural target market with budget Android devices), APK size is a conscious quality metric. The addition should be intentional and accompanied by a Baseline Profile update.

4. **Firebase Analytics is a zero-cost fallback.** Firebase Analytics (already a transitive dependency via `firebase-messaging`) can capture basic conversion events (booking created, payment succeeded/failed) without an additional SDK. If a lightweight analytics interim is needed before the dedicated PostHog story ships, Firebase Analytics is available.

5. **Story scope discipline.** Combining PostHog SDK init, event taxonomy, ViewModel call sites, and Hilt bindings in the same PR as Sentry wiring exceeds feature-tier scope. Splitting avoids a bloated diff that is harder for Codex review to reason about.

## Consequences

- **Positive:** E18-S06 PR is focused, testable, and reviewable. Smoke gate passes cleanly.
- **Positive:** PostHog integration gets proper ceremony (plan, TDD, Codex review) in E18-S07.
- **Negative:** Product-analytics events (BookingCreated, PaymentSucceeded, etc.) are not captured during the gap between E18-S06 merge and E18-S07 execution. This is acceptable — the pilot phase has not started.
- **Tracking:** E18-S07 (or equivalent) must add:
  - `posthog-android` to `libs.versions.toml`
  - `BuildConfig.POSTHOG_API_KEY` with env-var fallback
  - `Analytics` interface + `PostHogAnalytics` / `NoOpAnalytics` Hilt bindings
  - Event taxonomy in `customer-app/app/src/main/kotlin/com/homeservices/customer/analytics/Events.kt`
  - Call sites: `BookingViewModel` (payment success/failure), future wallet/export/erasure screens

## Alternatives Considered

- **Integrate PostHog now (rejected):** The SDK is not yet in `libs.versions.toml`. Adding it mid-story increases PR scope beyond feature-tier limits and risks introducing an unreviewed dependency.
- **Use Firebase Analytics as interim (deferred):** Possible, but adds its own wiring overhead. Better handled in E18-S07 where the analytics strategy can be decided holistically (PostHog vs Firebase Analytics vs both).
