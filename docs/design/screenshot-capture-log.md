# UI/UX 2026 Screenshot Capture Log

Last updated: 2026-07-26

## Environment

Android target:

- Device: `emulator-5554`
- Audit viewport: 720x1600, density 280
- Reset after capture: default wm size/density, light mode, font scale 1.0
- Customer package: `in.homeheroo.customer`
- Technician package: `in.homeheroo.technician`

Admin target:

- Local dev server: `http://localhost:3000`
- Command used: `pnpm dev` from `admin-web`
- Note: Node v24.13.1 emitted an engine warning; project asks for Node >=22 <23.
- Dev server stopped after capture.

## Captured

### Customer App

First-run language picker:

- `artifacts/uiux-2026/screens/customer-app/language-picker-emulator-enhi-light-720x1600.png`
- `artifacts/uiux-2026/screens/customer-app/language-picker-emulator-enhi-light-720x1600.xml`
- `artifacts/uiux-2026/screens/customer-app/language-picker-hindi-selected-emulator-light-720x1600.png`
- `artifacts/uiux-2026/screens/customer-app/language-picker-hindi-selected-emulator-light-720x1600.xml`
- `artifacts/uiux-2026/screens/customer-app/post-english-continue-emulator-light-720x1600.png`
- `artifacts/uiux-2026/screens/customer-app/post-english-continue-emulator-light-720x1600.xml`
- `artifacts/uiux-2026/screens/customer-app/post-language-emulator-hi-light-720x1600.png`
- `artifacts/uiux-2026/screens/customer-app/post-language-emulator-hi-light-720x1600.xml`

Older first-pass files retained for traceability:

- `artifacts/uiux-2026/screens/customer-app/first-launch-emulator-en-light-1080x2400.png`
- `artifacts/uiux-2026/screens/customer-app/first-launch-emulator-window.xml`
- `artifacts/uiux-2026/screens/customer-app/dpdp-consent-emulator-en-light-720x1600.png`
- `artifacts/uiux-2026/screens/customer-app/dpdp-consent-emulator-en-light-720x1600.xml`
- `artifacts/uiux-2026/screens/customer-app/dpdp-consent-emulator-en-dark-720x1600.png`
- `artifacts/uiux-2026/screens/customer-app/dpdp-consent-emulator-en-dark-font200-720x1600.png`
- `artifacts/uiux-2026/screens/customer-app/dpdp-consent-emulator-en-dark-font200-720x1600.xml`
- `artifacts/uiux-2026/screens/customer-app/dpdp-consent-emulator-hi-light-720x1600.png`
- `artifacts/uiux-2026/screens/customer-app/dpdp-consent-emulator-hi-light-720x1600.xml`

Important caveat: several `dpdp-consent-*` filenames were created before XML inspection; the paired XML shows the visible state is the language picker. Do not rely on filename alone; inspect XML before using as evidence.

Observed blocker:

- English is selected by default and Continue is exposed as clickable/enabled, but tapping it did not advance from the language picker.
- The Hindi row text is visible, but the Hindi row was not exposed as a clickable node in the inspected XML. This is a candidate accessibility/operability finding and needs code verification.

### Technician App

Onboarding/sign-in gate:

- `artifacts/uiux-2026/screens/technician-app/onboarding-gate-emulator-en-light-720x1600.png`
- `artifacts/uiux-2026/screens/technician-app/onboarding-gate-emulator-en-light-720x1600.xml`
- `artifacts/uiux-2026/screens/technician-app/onboarding-gate-emulator-en-dark-720x1600.png`
- `artifacts/uiux-2026/screens/technician-app/onboarding-gate-emulator-en-dark-font200-720x1600.png`
- `artifacts/uiux-2026/screens/technician-app/onboarding-gate-emulator-en-dark-font200-720x1600.xml`

Email login:

- `artifacts/uiux-2026/screens/technician-app/email-login-emulator-en-light-720x1600.png`
- `artifacts/uiux-2026/screens/technician-app/email-login-emulator-en-light-720x1600.xml`
- `artifacts/uiux-2026/screens/technician-app/email-login-emulator-en-dark-720x1600.png`
- `artifacts/uiux-2026/screens/technician-app/email-login-emulator-en-dark-font200-720x1600.png`
- `artifacts/uiux-2026/screens/technician-app/email-login-emulator-en-dark-font200-720x1600.xml`

Observed caveat:

- At 200% font scale, the sign-in options screen expands enough that fixed coordinate tapping missed the email CTA. The captured `email-login-emulator-en-dark-font200` file should be inspected before treating it as the email form state.

Authenticated flow:

- Firebase Auth project confirmed: `homeservices-prod-001`
- Dedicated UI-audit Firebase Auth users created/updated:
  - customer user: `uiux.audit.customer@homeheroo.test`
  - technician user: `uiux.audit.technician@homeheroo.test`
- Emails marked verified in Firebase Auth.
- Password was generated locally for capture, verified through Firebase REST, used in emulator, then the temp file was overwritten with `{"cleared":true}`. No password is stored in the repo.

> **BOTH ACCOUNTS WERE DELETED FROM PRODUCTION ON 2026-07-26** at the owner's direction.
> UIDs `qvlOwe9VtehrWFEzSkxAxKbC6TB2` (customer) and `HvfNJD45eVX0RdZg61lHMPrBt893` (technician) were
> removed via Identity Toolkit `accounts:batchDelete`; `auth_get_users` now returns `{"users":[]}` for
> both emails. The screenshots below remain valid evidence, but **this flow is no longer reproducible
> with these credentials.** Do not recreate accounts in `homeservices-prod-001` — use a non-production
> Firebase project or `firebase emulators:start --only auth` for future authenticated capture.

Authenticated screenshots:

- `artifacts/uiux-2026/screens/technician-app/authenticated-landing-emulator-en-light-720x1600.png`
- `artifacts/uiux-2026/screens/technician-app/authenticated-landing-emulator-en-light-720x1600.xml`
- `artifacts/uiux-2026/screens/technician-app/post-notification-permission-emulator-en-light-720x1600.png`
- `artifacts/uiux-2026/screens/technician-app/post-notification-permission-emulator-en-light-720x1600.xml`
- `artifacts/uiux-2026/screens/technician-app/service-selection-authenticated-emulator-en-dark-720x1600.png`
- `artifacts/uiux-2026/screens/technician-app/service-selection-authenticated-emulator-en-dark-font200-720x1600.png`
- `artifacts/uiux-2026/screens/technician-app/service-selection-authenticated-emulator-en-dark-font200-720x1600.xml`
- `artifacts/uiux-2026/screens/technician-app/service-selection-bottom-emulator-en-light-720x1600.png`
- `artifacts/uiux-2026/screens/technician-app/service-selection-bottom-emulator-en-light-720x1600.xml`
- `artifacts/uiux-2026/screens/technician-app/service-selection-location-after-geo-emulator-en-light-720x1600.png`
- `artifacts/uiux-2026/screens/technician-app/service-selection-location-after-geo-emulator-en-light-720x1600.xml`
- `artifacts/uiux-2026/screens/technician-app/service-selection-location-resolved-emulator-en-light-720x1600.png`
- `artifacts/uiux-2026/screens/technician-app/service-selection-location-resolved-emulator-en-light-720x1600.xml`

Observed authenticated blockers:

- First successful login lands on the Android notification permission prompt. Captured as `authenticated-landing-*`.
- After notification permission, the app lands on Step 3 of 3, "Choose your services".
- Services can be selected and the bottom of the service-selection form is reachable.
- `Use current location` remains stuck at "Finding your location" even after:
  - granting `ACCESS_FINE_LOCATION`
  - granting `ACCESS_COARSE_LOCATION`
  - injecting emulator location `26.7922, 82.1998`
- The save step did not reach the dashboard. Treat as capture blocker and candidate resilience/permissions finding pending code verification.

### Admin Web

Captured with Playwright:

- `artifacts/uiux-2026/screens/admin-web/login-hi-desktop-1440.png`
- `artifacts/uiux-2026/screens/admin-web/login-hi-mobile-390.png`
- `artifacts/uiux-2026/screens/admin-web/login-en-desktop-1440.png`
- `artifacts/uiux-2026/screens/admin-web/setup-hi-desktop-1440.png`
- `artifacts/uiux-2026/screens/admin-web/setup-hi-mobile-390.png`
- `artifacts/uiux-2026/screens/admin-web/capture-manifest.json`

Observed caveat:

- `/hi/setup` redirected to `/hi/login` while unauthenticated, so the setup screenshots show the login screen after redirect.

## Credential Blocker

The user stated that Firebase CLI can be used. Firebase CLI and service account access were available, and dedicated UI-audit Firebase Auth users were created.

To continue past auth screens, the next session needs one of:

- Reset the UI-audit Firebase Auth users to a fresh password for future emulator sessions, or
- Use Firebase test phone number + OTP, or
- Add/identify admin user records for authenticated admin screenshots.

Firebase Auth alone is enough to pass the technician email login screen, but the technician dashboard remains blocked by onboarding location resolution.
