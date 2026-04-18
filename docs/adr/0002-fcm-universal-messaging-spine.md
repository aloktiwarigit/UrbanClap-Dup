# ADR-0002: FCM as the universal messaging spine (no WebSockets, no paid SMS/WhatsApp in steady state)

- **Status:** accepted
- **Date:** 2026-04-17
- **Deciders:** Alok Tiwari, Winston

## Context

The product has four real-time communication needs:
1. Customer sees live booking status (searching → assigned → en-route → reached → in-progress → completed)
2. Technician receives job offers within seconds and transmits live status
3. Owner admin sees the live ops feed (new bookings, status changes, complaints)
4. In-app chat between customer and tech during active service

The user directive is explicit: *"everything else should be FCM."* Operational cost constraint (NFR-M-1) rules out paid WhatsApp Business API (~₹0.30-0.40/conversation × scale) and paid SMS (~₹0.20/SMS × scale). WebSockets require an always-on server (not free-tier compatible on Azure).

## Decision

**FCM (Firebase Cloud Messaging) is the universal messaging spine for all four needs.**

- Customer + technician mobile apps register FCM tokens on first auth.
- Backend publishes FCM data messages for: booking status transitions, job offers, tech location pings, chat messages, marketing campaigns (Phase 2).
- Owner web admin subscribes to FCM topics (one per owner admin user) to receive live ops feed events (delivered via Firebase JS SDK in browser).
- **OTP via Firebase Phone Auth SMS is the only non-FCM path at MVP**, and only at onboarding (one-time per device). Truecaller SDK (ADR-0005) handles ~95% of these without SMS, leaving ≤100 SMS/mo steady state.
- **No WebSocket server anywhere in the architecture.**

## Consequences

**Positive:**
- FCM is unlimited free forever. Zero marginal cost at any scale.
- Google manages delivery infrastructure; we benefit from billions-of-devices reliability.
- FCM data messages wake sleeping Android devices via the native OS — no polling, no custom background service.
- Eliminates entire categories of operational work (WS connection state, reconnect, load balancing, sticky sessions).
- Chat delivery works even after users close the app (device still wakes for FCM).

**Negative:**
- FCM delivery latency is p95 ~2-5 seconds (NFR-R-5: ≥ 95% delivery within 10 seconds) — slower than WebSocket's sub-second. Accepted trade-off for dispatch (30-second ACK window absorbs it) and for status updates (not time-critical).
- Chat UX has slightly higher latency than WhatsApp-native (still within comfortable range).
- FCM has a 4 KB data message size limit — tight but fine for our metadata-only pushes.
- One-time OTP SMS at Firebase Phone Auth rates (~₹0.40/SMS) still costs something. Mitigated to ~₹40/mo steady state by Truecaller-first (ADR-0005).

**Neutral:**
- Our delivery SLO (95% within 10s) is explicit in NFR-R-5 and monitored via PostHog. If it drops, we have a pre-planned MSG91 SMS fallback (1-week implementation) to layer in.

## Alternatives considered

- **WebSocket server (Azure SignalR)** — SignalR free tier is 20 concurrent connections, unusable at 500-tech scale. Paid tier costs ~₹5-10k/month minimum. Rejected.
- **Self-hosted WebSocket on Azure Functions + Durable Functions** — Functions Consumption doesn't support WebSocket triggers; would need App Service Standard tier (~₹8k/mo). Rejected.
- **Paid WhatsApp Business API via Wati/Gupshup** — ~₹1.5-2k/mo at MVP scale rising to ~₹20k+/mo at full scale. Rejected.
- **Server-Sent Events (SSE)** — works for web admin but mobile apps still need FCM for background delivery. Two systems, twice the complexity. Rejected.
- **Polling (API every N seconds)** — battery-killing on mobile, wastes RU/s on Cosmos, high latency. Rejected.
- **WhatsApp Cloud API (Meta direct)** — 1,000 service conversations/month free from Meta. Considered for Phase 3 as a supplementary surface for customers who don't install the app, not a replacement for FCM.

## References

- `docs/prd.md` FR-4.1 (dispatch), FR-3.5 (live tracking), NFR-R-5 (FCM delivery SLO)
- `docs/ux-design.md` §5.4 (motion / timing), §10.5 (notification design)
- `_bmad-output/planning-artifacts/architecture.md` §5.1 (real-time data flow pattern)
- User directive (session 2026-04-17): *"everything else should be FCM"*
- Brainstorm `docs/brainstorm.md` Innovation I-2
