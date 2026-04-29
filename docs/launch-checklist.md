# Home Heroo — Soft Launch Checklist

**Version:** 1.0 (E10-S04)
**Owner:** Alok Tiwari
**Last updated:** 2026-04-29

---

## Environment (verify before enabling `soft_launch_enabled`)

- [ ] `GROWTHBOOK_CLIENT_KEY` set in Azure Functions app settings
- [ ] `GROWTHBOOK_API_HOST` set (default: `https://cdn.growthbook.io`)
- [ ] `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` set (production keys, not test)
- [ ] `RAZORPAY_WEBHOOK_SECRET` set
- [ ] `COSMOS_PAN_ENCRYPTION_KEY` set (`openssl rand -base64 32`)
- [ ] `ADMIN_SETUP_SECRET` set (first run only — remove after TOTP enrollment)
- [ ] Firebase project: production app registered, SHA-256 cert added
- [ ] GrowthBook: `soft_launch_enabled = false` initially (gate closed until go-live)
- [ ] GrowthBook: `marketing_pause_enabled = false` (not paused)

---

## Pre-launch smoke (day of launch)

- [ ] Create 1 test booking end-to-end: customer → tech job offer → complete → payout
- [ ] Verify earnings dashboard shows the test booking with correct amounts
- [ ] Verify no Sentry errors in last 1 hour
- [ ] Verify GrowthBook dashboard reachable and flag states correct
- [ ] Verify admin-web login works (TOTP enrolled)
- [ ] Confirm Razorpay Route account is live (not test mode)

---

## Go-live

- [ ] Enable `soft_launch_enabled = true` in GrowthBook
- [ ] Send first F&F batch invite (100 users max for soft launch)
- [ ] Monitor Sentry for 30 minutes post-launch
- [ ] Monitor admin dashboard for booking activity and dispatch health
- [ ] Verify at least 1 real booking completes successfully

---

## Rollback trigger criteria

Immediately disable `soft_launch_enabled` in GrowthBook if any of these occur:

- Sentry error rate > 5% of requests over a 10-minute window
- Payment webhook failures > 2 in any 10-minute window
- Tech FCM delivery rate < 80% over 30 minutes
- Any unhandled exception reaching production Sentry for the first time
- Owner admin becomes inaccessible

See `docs/runbook.md § Emergency rollback` for the step-by-step procedure.
