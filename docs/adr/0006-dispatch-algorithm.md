# ADR-0006: Real-time dispatch — Cosmos geospatial + FCM + optimistic concurrency, with Karnataka right-to-refuse architecturally enforced

- **Status:** accepted
- **Date:** 2026-04-17
- **Deciders:** Alok Tiwari, Winston

## Context

When a customer completes payment, a technician must be found and notified within seconds. The system must offer the job to multiple candidates with a 30-second accept-or-decline window, lock the booking to the first who accepts (avoiding double-assignment), and if all decline, expand the search radius. This must work without persistent WebSocket connections (ADR-0002) and at free-tier scale (NFR-M-1).

**Legal constraint (Karnataka Platform Workers Act 2025, effective May 2025):** *"Right to refuse tasks offered by the aggregator or platform"* — technician declines must not degrade future ranking. Urban Company's 2026 protests centered on violations of this principle. Our dispatcher must be demonstrably compliant.

## Decision

**Dispatcher architecture:**

1. **Trigger:** Azure Function with Cosmos change-feed trigger on `bookings` collection. Fires when a booking transitions to `SEARCHING` state (post-payment-captured).

2. **Candidate selection (Cosmos query):**
   - Filter: `skill ⊇ booking.category` AND `available_in_slot(bookingSlot)` AND `ST_DWITHIN(geo, bookingGeo, 5000 meters)` AND `rating ≥ 3.5` AND `acceptance_rate_30d ≥ 30%`
   - Order: composite score (see below), return top 3
   - Query partitioned by `city`, bounded RU cost.

3. **Ranking score:**
   ```
   score = 0.4 × (1 - normalized_distance)
         + 0.3 × normalized_rating
         + 0.2 × recency_of_last_job
         + 0.1 × acceptance_rate_30d
   ```
   **NONE of: decline_count, decline_ratio, decline_recency, or any decline-derived feature.** This is the Karnataka compliance stake.

4. **Offer dispatch:** Send FCM data message to top 3 candidates simultaneously. Each FCM carries offer ID, context (FR-5.1), and a 30-second ACK deadline.

5. **Accept-or-decline:** Tech app calls `POST /tech/offers/{id}/accept` (or `.../decline`). Accept performs Cosmos optimistic concurrency write: `booking._etag = current_etag` → update booking to `ASSIGNED` with `assignedTechId`. First accept wins (Cosmos retry loop rejects stale etag). Remaining candidates receive "no longer available" FCM within 1 second.

6. **Timeout handling:** If all 3 decline OR ACK window elapses without any accept, expand radius to 10 km → re-run query (excluding already-offered techs for this booking within last 60s). After 3 expansions (15 km max), booking → `UNFULFILLED`, customer gets FCM with reschedule/refund options (FR-4.1 AC4).

7. **Decline recorded (NOT used for ranking):** Declines are written to `booking_events` for audit and analytics (helps the owner see decline patterns) but the dispatcher query explicitly does NOT read this data.

## Compliance enforcement (FR-9.1, NFR-C-1)

**Architectural level:**
- The `technicians` read-model exposed to the dispatcher query has NO `declineCount`, `declineRatio`, or `lastDecline` fields. These only exist in `booking_events` which the dispatcher does not query.
- The ranking function is a pure function in `api/src/domain/dispatcher/rank.ts` with unit tests asserting that input variations in decline history have zero effect on output.

**Test level:**
- Integration test `dispatcher-karnataka-compliance.test.ts`: create 10 techs with identical profiles except for decline history (0, 5, 10, 20, 50 declines in last 30 days) → dispatch 100 bookings → assert that the ranking order per booking is IDENTICAL across test runs with different decline histories.
- This test runs in CI on every PR. Any change that breaks it fails CI.

**Review level:**
- Codex review (authoritative gate, per CLAUDE.md) and bmad-code-review Blind Hunter layer flag any PR that reads decline history in the dispatcher path.

## Consequences

**Positive:**
- Works entirely on free tier: Cosmos change feed + Functions + FCM.
- Dispatch p95 < 2 seconds end-to-end (booking paid → first FCM on tech device). Validated in architecture.md §7.3.
- Karnataka-compliant by architecture, not by policy — cannot be accidentally violated.
- Scales to 50k bookings/month without paid infra.
- Transparent: tech sees "Why you got this" in offer card (FR-5.1), algorithm intent is publishable (NFR-C-1).

**Negative:**
- 30-second ACK window vs WebSocket's real-time. Accepted trade-off (ADR-0002).
- Top-3 simultaneous offer means 2 of 3 receive "no longer available" — if not carefully designed, feels spammy. Mitigation: concise message, no badge, auto-dismiss within 2 seconds.
- If dispatcher function is cold, first-booking-of-the-day dispatch sees +1-2s cold start (ADR-0004). Mitigation: warmup ping.
- Composite ranking score weights are judgment calls. Mitigation: A/B testable post-MVP; Phase 4 introduces ML dispatch (AQ-3).

**Neutral:**
- We accept slightly slower dispatch than WebSocket for massive operational and compliance wins.

## Alternatives considered

- **Broadcast to all available techs, first-come-first-served** — terrible tech UX (everyone's phones buzz for every booking); violates fair dispatch. Rejected.
- **Round-robin (not distance-based)** — ignores geography, slower services. Rejected.
- **ML ranking from day 1** — premature without data. MVP is rule-based; ML introduced Phase 4 once we have 50k bookings' worth of ground truth.
- **Distance-only ranking** — ignores rating and recency. Creates "stuck at the same tech" patterns. Rejected.
- **Random from qualified pool** — wastefully ignores skill signals. Rejected.

## References

- `docs/prd.md` FR-4.1 (dispatch flow), FR-9.1 (Karnataka compliance), NFR-P-3 (dispatch p95 < 2s), NFR-C-1 (right-to-refuse)
- `_bmad-output/planning-artifacts/architecture.md` §3.1 diagram, §4.6 ADR summary, §7.3 performance budget
- `docs/brainstorm.md` T-4 (rich job offer context), SCAMPER-T5 live-tracking theatre
- Karnataka Platform Based Gig Workers (Social Security and Welfare) Act 2025 — in force May 2025
- DLA Piper analysis: *"Karnataka's new platform-based gig worker protection"* (Apr 2025)
