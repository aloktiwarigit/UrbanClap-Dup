# Device Test Findings — 2026-05-19

**Tester:** Alok Tiwari
**Device:** Samsung (serial `33000a5015f2b351`)
**Build:** customer-app `0.1.4` / technician-app, both assembled from `origin/main` @ `1509ced6`
**Test date:** 2026-05-18 (session) / 2026-05-19 (doc date)
**Test goal:** First real-device end-to-end booking smoke test

---

## Infra state at test time

| Item | Status |
|---|---|
| API health (`/v1/health`) | ✓ live @ `1509ced6` |
| Cosmos containers | ✓ all 16 provisioned (10 created this session via `setup-cosmos.ts`) |
| GCP Maps + Places API | ✓ enabled this session on `homeservices-prod-001` |
| Razorpay | SKIPPED — using Cash on Arrival for this test |
| Firebase Storage lifecycle (SOS audio) | ⚠️ rule file in git, not yet applied via gsutil |
| ACS_CONNECTION_STRING | ✗ missing — email notifications dark |
| SENTRY_DSN | ✗ missing — error tracking dark |
| POSTHOG_API_KEY | ✗ missing — analytics dark |
| Truecaller partner | ⚠️ unconfirmed — will fallback to OTP |
| DigiLocker client_id | ✗ missing — KYC not tested |

---

## Findings

### BUG-001 — Rating screen: Submit button unreachable

**Severity:** P1 (flow completes but customer cannot submit rating)
**Screen:** `RatingScreen.kt` (customer-app)
**Owner:** customer-app

**Reproduction:**
1. Complete a booking through to COMPLETED state
2. Rating prompt appears — tap to open
3. Rating screen shows 4 dimensions (Overall experience, Punctuality, Skill quality, Behaviour) + Comment box
4. **Submit button is below the visible area with no way to scroll to it**

**Root cause:** `RatingScreen.kt:107` — outer `Column` is `fillMaxSize()` with no `verticalScroll`. Inner layout uses `Spacer(Modifier.weight(1f))` at line 197 to pin the Submit button to the bottom. On a standard-height device with 4 rating rows + comment box, the button is pushed off screen.

**Fix:** Wrap the scrollable content in `Column(modifier = Modifier.verticalScroll(rememberScrollState()))` and remove `fillMaxSize()` from the inner column; the Submit button should sit below the comment box, not weight-pinned to the bottom.

**Screenshot:** Rating screen visible; Submit button not visible below 0/500 comment counter.

---

### BUG-002 — Complaint screen: Submit button unreachable

**Severity:** P1 (customer cannot file a complaint)
**Screen:** `ComplaintScreen.kt` (customer-app)
**Owner:** customer-app

**Reproduction:**
1. Open any completed booking
2. Tap "File a complaint"
3. Fill in complaint details
4. **Submit button is below the visible area with no way to scroll to it**

**Root cause:** Same pattern as BUG-001 — `ComplaintScreen.kt:116` uses `fillMaxSize().padding(24.dp)` Column with `Spacer(Modifier.weight(1f))` at line 137 pinning the Submit button below content that overflows the screen height. No `verticalScroll`.

**Fix:** Same as BUG-001 — add `verticalScroll(rememberScrollState())` to the content column; remove weight-based spacer in favour of bottom padding.

---

## Steps completed before bugs blocked further testing

| Step | Result |
|---|---|
| Phase 1: Infra verification | ✓ complete (see table above) |
| Phase 2: Signed APK builds | ✓ customer-app 40 MB, technician-app 13 MB |
| Phase 3: Device install | ✓ both apps installed on Samsung `33000a5015f2b351` |
| Step 15: Rate the booking | ✗ BLOCKED by BUG-001 |
| Step 16: File a complaint | ✗ BLOCKED by BUG-002 |

---

## What was NOT tested (deferred)

- Steps 1–14 of the booking flow (OTP login through MARK_COMPLETED) — not yet reached; blocked first on identifying infra gaps, then on device connect/build time
- SOS button (E11-S05b-2 not merged)
- Add-on biometric approval
- Live tracking (E17-S02 not merged)
- Razorpay payment (deferred — cash flow only)
- DigiLocker KYC
- Hindi UI review

---

## Next actions

| Priority | Action | Owner |
|---|---|---|
| P1 | Fix BUG-001: add `verticalScroll` to `RatingScreen` | customer-app story |
| P1 | Fix BUG-002: add `verticalScroll` to `ComplaintScreen` | customer-app story |
| P1 | Re-run full steps 1–17 after fixes | Alok |
| P2 | Apply Firebase Storage lifecycle rule via gsutil | Alok (infra) |
| P2 | Add ACS_CONNECTION_STRING, SENTRY_DSN, POSTHOG_API_KEY to Function App | Alok (infra) |
| P3 | Confirm Truecaller partner registration or document OTP-only decision | Alok |
