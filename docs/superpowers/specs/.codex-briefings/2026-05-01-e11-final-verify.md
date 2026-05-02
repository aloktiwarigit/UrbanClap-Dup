# Codex Verify Pass — E11 Final Spec

**Reviewer:** OpenAI Codex CLI
**Date:** 2026-05-01
**Prior round:** `docs/superpowers/specs/.codex-briefings/2026-05-01-e11-decomposition-review.md`
**Artifact under review:** `docs/superpowers/specs/2026-05-01-e11-durable-screen-hooks-design.md`

You previously did an adversarial first pass on Claude's E11 proposal. Claude integrated your corrections into a final spec at the path above. **Read it.** This is a verify pass.

The owner asked a binary question: "do you and Claude both agree with the plan?" Don't pretend agreement. Don't hedge.

## What to check

### 1. Faithful integration of first-pass corrections

For each, confirm whether the spec reflects your earlier guidance — point to file line numbers or flag if missing/incorrect:

- Stale-event resurrection: `version` + monotonic `updatedAt` + ingest drops older payloads.
- Dirty-state merge contract: per-screen `DirtyStateMerger`, banner instead of silent reload when unsafe.
- RouteSpec decoupling: shared `RouteSpec` interface + per-app `CustomerRouteSpec` / `TechnicianRouteSpec` enums.
- Event-bus removal listed explicitly (the 6 buses you grepped).
- Logout cleanup explicit (Room.clearAll + FCM token delete + topic unsubscribe).
- S05a source state correction: `AWAITING_PRICE_APPROVAL` stays as source state; `ADDON_APPROVAL_REQUESTED` is the pending-action TYPE only.
- `ActiveJobResponse.id` mismatch flagged as S04 pre-req hygiene.
- `dispatch_attempts` naming (not `job_offers`).
- Observability as S02 acceptance criteria, not a separate story.
- S01 split into S01a/S01b pre-committed.
- S06 split into S06-warn (after S01b) + S06-fail (after S05c).
- S05b split into S05b-1 (trust+confidence, unblocked) + S05b-2 (SOS, owner-blocked).
- Existing FCM wire types reused; no invented type names.
- Storage rules + TTL flagged for S05b-2 Option A.

### 2. Did the integration introduce new errors?

Look for over-corrections, contradictions, or sloppy translations between sections.

### 3. Claude's own residual concerns

Claude flagged these. Validate or push back:

a. **S01b still big.** Pre-commit S01b-1 / S01b-2 split now? Or keep "split if exceeds 1500 lines" deferral?
b. **`version` server-side semantics underspecified.** Cosmos `_etag` optimistic concurrency? Read-then-write transaction? Where does the bump happen — projector code or stored procedure?
c. **S06-warn suppression workflow hand-wavy.** Who adds entries, who reviews, what's the expiry default during active development?
d. **Android 13+ POST_NOTIFICATIONS runtime permission** not enumerated in the spec. Where does it belong?
e. **S01a spike fallback** under-specified. If kotlinx-serialization spike fails, does S01b mid-pivot or replan?

### 4. Anything still missing

What would a senior staff engineer reading this spec flag that neither you nor Claude has surfaced?

## Output format

Bullet form. Under 400 words. Lead with the binary: **"Agree" or "Don't agree, here's what to fix."** Then point-by-point.
