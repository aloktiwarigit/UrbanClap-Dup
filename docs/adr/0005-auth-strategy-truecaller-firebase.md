# ADR-0005: Auth — Truecaller SDK (primary) + Firebase Phone Auth OTP (fallback) + Google Sign-In (alt) + persistent device session

- **Status:** accepted
- **Date:** 2026-04-17
- **Deciders:** Alok Tiwari, Winston

## Context

Customers and technicians authenticate to their respective Android apps. SMS-based OTP is the Indian default but costs ~₹0.20-0.40 per SMS. At scale, SMS volume could reach hundreds of thousands per month — incompatible with the ₹0 infra constraint (NFR-M-1).

User directive earlier in the session: *"we will keep otp only for authentication and once user login then session will be maintained on device"*.

## Decision

**Three-layer auth with persistent device session:**

1. **Primary path: Truecaller SDK.** When a user opens the app and Truecaller is installed (~95% of Indian Android devices), Truecaller's "Verify with Truecaller" pop-up verifies the user's phone number silently without sending an SMS. This is free for the platform.
2. **Fallback: Firebase Phone Auth OTP.** For the ~5% of users without Truecaller, we send an SMS OTP via Firebase Phone Auth. Cost ~₹0.40 per SMS × ~100/month steady state = ~₹40/mo.
3. **Alternative entry: Google Sign-In.** For customers who prefer Google account login (especially older users or NRIs using existing Google accounts).

**Persistent device session:** After first successful auth on a device, Firebase Auth refresh tokens keep the user signed in for 180 days. No re-OTP.

**Re-auth on sensitive actions** (Android BiometricPrompt): payment confirmation, payout cadence change, profile deletion, account deactivation. Falls back to device PIN if no biometric.

**Admin web auth:** Firebase Auth with email + password + TOTP 2FA for super-admin (FR-1.3). Role claims stored as custom claims on Firebase Auth token.

## Consequences

**Positive:**
- Steady-state SMS cost ≈ ₹0 (Truecaller covers ~95%, only ~100 SMS/mo fallback).
- UX is better: Truecaller verification is a single tap and ~3 seconds vs 20+ seconds for SMS OTP.
- Device persistence eliminates repeated OTP flows (NFR-U target: returning users auto-authenticate without typing).
- Biometric re-auth on sensitive actions is Indian-Android-user-familiar UX (banking apps use this).
- Google Sign-In gives NRI segment (OQ-24 gift flows, Phase 2+) a familiar entry.
- Admin 2FA with TOTP (no SMS for admin) keeps owner protected.

**Negative:**
- Truecaller SDK requires business registration with Truecaller (~2-week lead time — OQ-13). Founder must complete this in Phase 0 / pre-launch sprint.
- Biometric UX varies across Android OEM implementations (Samsung vs Xiaomi vs OnePlus); accept inconsistency, fall back to PIN gracefully.
- Google Sign-In requires Google account; some rural users don't have one.
- If Truecaller changes its free tier or revokes SDK access, we fall back entirely to Firebase Phone Auth — SMS cost rises ~20× to ~₹800/mo at MVP scale. Still acceptable but no longer ₹0.

**Neutral:**
- If Firebase Phone Auth changes its Indian SMS pricing, we have MSG91 as a direct alternative (~₹0.15-0.20 per SMS) — can swap in a week.

## Alternatives considered

- **OTP-only (no Truecaller)** — ~₹800-1000/mo at pilot scale rising to ₹20k+/mo at full. Violates ₹0 constraint. Rejected.
- **Magic links via email** — email is not the Indian default; most users don't check email regularly. Rejected for customer + tech; acceptable for admin (and we use password + TOTP there anyway).
- **Passwords for customers/techs** — Indian mobile-first users don't remember passwords; password-reset SMS negates the savings. Rejected.
- **Passkeys / WebAuthn** — 2026 support varies across Android versions; too new to bet on for mass audience. Revisit Phase 4.
- **Apple Sign-In** — iOS is Phase 4; will revisit then.
- **Aadhaar-based OTP** — tempting (free via UIDAI) but heavy regulatory implications for using Aadhaar for customer auth. Rejected in favour of using Aadhaar only for tech KYC (via DigiLocker).

## References

- `docs/prd.md` FR-1.1 (auth), NFR-S-5 (RBAC), NFR-S-7 (2FA)
- `_bmad-output/planning-artifacts/architecture.md` §3.2 component table (auth providers)
- User directive (session 2026-04-17): *"we will keep otp only for authentication and once user login then session will be maintained on device"*
- Truecaller SDK for business (Apr 2026): free for identity verification
- Firebase Auth Phone pricing (India): ~₹0.40/verification
