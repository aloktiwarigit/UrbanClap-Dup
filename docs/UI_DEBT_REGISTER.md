# UI Debt Register

Date: 2026-04-30

This register is the compact handoff memory for future Claude/Codex sessions. Source, tests, and architecture docs remain the authority; this file only records the current UI quality state and the remaining visual risk.

## Operating Rules

- Do not record or update Paparazzi goldens on Windows. Use the CI `workflow_dispatch` path for golden updates.
- Local Paparazzi reports may be inspected on Windows for visual QA.
- Treat `.remember/` and memory files as orientation only. Verify against code, tests, and docs before changing behavior.
- Keep future UI work in shared design-system components where a pattern repeats across customer and technician apps.

## Polished Screens

Customer app:

- Auth first-run, OTP, loading, and error states
- Catalogue home, service list, and service detail
- Slot picker
- Address selection
- Booking summary
- Booking confirmation
- Price approval
- Live tracking and SOS surfaces
- Rating
- Complaint creation

Technician app:

- Auth first-run, OTP, loading, and error states
- KYC Aadhaar, PAN upload, review, loading, and error states
- Job offer
- Active job
- Onboarding
- Earnings
- My ratings
- Complaint creation

Shared:

- Added reusable design-system components for primary/secondary buttons, section cards, skeleton blocks, trust badges, price text, info rows, and timeline steps.

Admin web:

- Landing page
- Login page
- Dashboard grid responsiveness
- Primary rail navigation

## Visual Coverage Added

Customer app:

- Auth light/dark, OTP, loading, and error states
- Catalogue loading and success states
- Service list success state
- Service detail success state
- Address, booking summary, booking confirmation, and price approval
- Live tracking in-progress fallback state
- Rating ready-to-submit state
- Complaint form state

Technician app:

- Auth, OTP, loading, and error states
- Job offer state
- Active job themed state
- Earnings success state
- My ratings success state
- Complaint form state
- KYC Aadhaar, PAN no-selection, PAN selected, review, error, and loading states

## Verified Gates

- `api`: `pnpm build` passed
- `api`: `pnpm test` passed, 92 files and 603 tests
- `admin-web`: `pnpm build` passed
- `admin-web`: `pnpm test` passed, 27 files and 140 tests
- `design-system`: `.\gradlew.bat -g .gradle testDebugUnitTest` passed
- `customer-app`: `.\gradlew.bat -g .gradle :app:compileDebugKotlin :app:testDebugUnitTest` passed
- `technician-app`: `.\gradlew.bat -g .gradle :app:compileDebugKotlin :app:testDebugUnitTest` passed

## Remaining Debt

- Real remote service images and media quality need device validation.
- Google Maps rendering needs emulator or physical-device QA; local visual coverage validates the fallback/no-location state.
- Paparazzi goldens were not recorded on Windows.
- Dark-theme coverage for newly polished populated states is incomplete.
- Admin web has build/test coverage and a responsive polish pass, but not a manual authenticated browser walkthrough against live data.
- Some domain-level Hindi label fields may still contain mojibake. The touched UI maps complaint reasons to clean English labels, but full Hindi support should be fixed deliberately through resources/domain labels.

## Recommended Next Batch

1. Validate the customer and technician apps on an emulator or physical Android device.
2. Run an authenticated admin web walkthrough against live or seeded data.
3. Trigger CI Paparazzi golden recording after visual approval.
4. Add dark-theme populated-state coverage for the newly polished mobile screens.
5. Convert repeated UI workflow lessons into a small project skill or memory layer only after the patterns stabilize.
