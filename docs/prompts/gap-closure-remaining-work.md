# Kickoff prompt — owner-requirements gap closure, remaining work

Paste everything below the line into a fresh session. Replace the "START WITH" line if you want a different story first.

---

You are continuing the owner-requirements gap-closure programme for `homeservices-mvp` (Urbanclap-dup). Read `MEMORY.md` first, then the two plan files named below. Do not re-derive the plan; it is approved.

## Where things stand (2026-09-07)

**Approved build plan:** `C:/Users/alokt/.claude/plans/validated-frolicking-mochi.md` (revision 2 — §3 invariants, §5 data model, §6 API contracts, §7 per-story specs, §10 risks). Owner decisions and the original defect analysis: `C:/Users/alokt/.claude/plans/act-as-a-principal-ticklish-fern.md`. Programme state memory: `project_gap_closure_state.md`.

**E21-S02 (commission ledger v2) is MERGED** — PR #324, squashed to `main` as `c25e50aa`. It gives the API a single-partition transactional money ledger, partial and overpaid remittances, the `commissionHold` cache, admin-editable thresholds, `GET /v1/technicians/me/commission-due` v2 and `GET /v1/config/technician`. Its worktree `C:/Alok/Business Projects/wt-e21-s02` still exists and holds the decision ledger at `.superpowers/sdd/E21-S02-commission-ledger-v2/progress.md` — read that file's "interface note" lines before touching anything it built, then delete the worktree once you are satisfied it is no longer needed.

**Nothing else in the programme is built.** No client consumes the new endpoints; every technician feature flag and `holdEnforcementEnabled` ship false, so merging more API stories stays inert until the flags flip.

## Do this first (blocking, owner-gated)

The E21-S02 production rollout has NOT been run. `docs/runbook.md` → "Commission ledger v2 (E21-S02)" has the sequence: deploy the Functions app, run `api/scripts/setup-cosmos.ts` (seeds thresholds, client-config and hold-repair only-if-absent), then `api/scripts/backfill-commission-holds.ts --dry-run`, read the diff aloud to me, then `--apply`, then confirm the admin dashboard reports `unreconciledTechnicianCount === 0`. Before any of it, verify Sentry alerting on `settleBooking ERROR` is live: the change feed now rethrows settlement failures, so a poison booking stalls its lease partition silently. Stop and ask me before `--apply` and before the deploy itself.

## Remaining stories, in dependency order

| Story | Sub-project | Tier | Depends on |
|---|---|---|---|
| E21-S03 Admin commission console + settings page + audit-log unhide | admin-web | Feature | E21-S02 ✓ |
| E21-S04 Dues-gated dispatch (ships dark) + reconciler + ADR | api | Foundation | E21-S02 ✓ |
| E23-S01 Weekly incentive engine (credit-only) | api | Foundation | E21-S02 ✓ |
| E24-S01 UPI QR server contract | api | Feature | E21-S02 ✓ |
| E22-S02 New categories + hero-image pipeline | api, tools, customer-app | Feature | — |
| E22-S03 Per-unit pricing (₹15/sq ft wiring) | api, both apps | Foundation | E22-S02 |
| E22-S04 Rate editors + per-unit form | admin-web | Feature | E22-S03 contract |
| E09-S08 PII-safe phones on orders + audited reveal | api, admin-web | Feature | — |
| E21-S05 Technician wallet + cash confirm + dues banner | technician-app | Foundation | S-02/S-04 contracts |
| E23-S02 Incentive config UI + milestone card | admin-web, technician-app | Feature | E23-S01 |
| REL-1 / REL-2 APKs, then staged flag flips | technician-app / customer-app | Codemod | all above |

Independent lanes you may run in separate worktrees: {E21-S04, E23-S01, E24-S01} ∥ {E21-S03} ∥ {E22-S02 → S03 → S04} ∥ {E09-S08}. Everything client-facing converges into ONE technician APK (versionCode 16) and ONE customer APK (versionCode 15); do not plan separate releases per feature.

**START WITH: E21-S03 (admin commission console)** — it is what finally puts the ledger in front of me, and it is the only story that makes the E21-S02 rollout verifiable through a UI instead of curl.

## How to run each story

Follow the project's per-story protocol (root `CLAUDE.md`): classify the tier, then plan with `superpowers:writing-plans` and execute with `superpowers:subagent-driven-development`, one task per subagent with a task review after each. Work in a dedicated `git worktree` per story. TDD throughout: the test file is committed before the implementation.

Announce your model tier on turn 1. Route implementers by task shape — Haiku when the plan carries the complete code, Sonnet for ordinary implementation, Opus only for money, concurrency, or architecture. Never omit the model on an Agent dispatch.

Gates before any push: `bash tools/pre-codex-smoke-api.sh` (or `-web.sh`, or `pre-codex-smoke.sh <app>` with `-PexcludePaparazzi`), then `codex review --base main` via the `codex-review-gate` skill. Codex is authoritative. If a round fails, fix once and re-run once; do not iterate rounds. Write `.codex-review-passed` only for a review that actually ran clean.

For UI stories (E21-S03, E22-S04, E23-S02, E21-S05): invoke the `frontend-design:frontend-design` skill before writing any UI code, and run a design-direction review before code plus a visual audit after it. The bar is Linear, Stripe Dashboard, Razorpay X, Cred. Hindi is first-class in both apps, not a translation afterthought.

## Design commitments — settled, do not re-litigate

All technician money documents live in `commission_receivables` (partition key `/technicianId`) under a `docType` discriminator, where an absent discriminator means RECEIVABLE. Every money mutation is one single-partition transactional batch. Ids are deterministic. Derived figures are recomputed absolutely and never incremented. Read-path schemas only ever widen: new stored fields are optional, new enum values are additive, and strictness goes on write bodies only. Money is integer paise and the server recomputes every amount. Incentives are credited against dues, never paid out. Dues enforcement stays behind `holdEnforcementEnabled`, default off, with shadow logging first. Everything must hold ₹0/month at pilot scale.

## Carry-forwards owed to E21-S04

The 15-minute reconciler must call `sweepAllHolds({ scope: 'EXPIRED_OVERRIDES' })` every run, or a lapsed admin override leaves a technician wrongly CLEAR. It must also write `system/hold-reconciliation-summary` including top-N ordering, so the admin dashboard stops draining every hold document per request (a parked Codex finding). Register the four new cross-partition helpers in `api/tests/cosmos/cross-partition-tenant-filter.test.ts` per ADR-0027. Read ADR-0031 before changing anything in the ledger.

## Traps this codebase has already sprung

Create every branch in its own worktree; concurrent sessions on one checkout swap branches under each other. Before the first push of a worktree branch, run `git fetch origin && git merge --no-edit origin/main`: the pre-push hook diffs against `@{u}`, which for a worktree branch is `main` itself, so it runs unrelated Gradle gates as main advances. Never tighten a schema that parses stored production documents. Never record Paparazzi goldens on Windows. Sync `libs.versions.toml` from customer-app as the first task of any technician-app story. Running the full API test suite rewrites `api/openapi.json` as a side effect; restore it unless the change is intentional. This machine runs low on memory: prefer foreground commands, and do not let a subagent run a full Gradle or `pnpm build` alongside a Codex review.

## Still needing my input

Prices for leak fix, tap install, pipe repair, new point wiring, fridge, cooler, washing machine and camera service. They seed as inactive drafts until I give them, so they block only E22-S02's activation step, not the story.

Start by reading the plan, confirming the E21-S02 rollout status with me, and then proposing the E21-S03 task breakdown.
