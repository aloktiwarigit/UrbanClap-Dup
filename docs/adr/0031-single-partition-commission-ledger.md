# ADR-0031: Commission ledger is a single-partition transactional log with absolute recomputation

- **Status:** accepted
- **Date:** 2026-09-06
- **Deciders:** Alok Tiwari (owner), implementing session (E21-S02)
- **Supersedes:** nothing. **Extends:** the E21-S01 `commission_receivables` container (one doc
  per completed cash booking, partitioned by `/technicianId`).

## Context

E21-S01 shipped one doc type per booking (`RECEIVABLE`) in `commission_receivables`, settled one
booking at a time via `POST commission-receivables/settle`. E21-S02 needed to add: a single
remittance that pays down several outstanding bookings at once (technicians pay in lump sums, not
per job), overpayment credit that automatically applies to future dues, a per-technician
commission hold (WARN/BLOCK) computed from the running balance, and configurable warn/block
thresholds — all without breaking any E21-S01 stored doc, since the pilot is live and those
receivables cannot be migrated offline.

The first candidate design put remittances and credits in their own containers
(`commission_remittances`, `commission_credits`), cross-referenced from `commission_receivables`
by id. It was rejected by **two independent adversarial reviews** (Codex CLI and Opus, both run
2026-09-05) on the same grounds: applying one remittance against N outstanding receivables plus
writing a remittance record plus (conditionally) a credit record is one business transaction, and
Cosmos DB transactional batches are scoped to a single container **and** a single partition key.
A cross-container design cannot commit that transaction atomically — a crash between the
receivable updates and the remittance-record write leaves the ledger in a state where the money is
recorded as collected on the receivables but the remittance itself never happened (or vice versa),
with no way to detect or repair the gap from either container alone. Both reviewers flagged this
as a silent-money-loss bug waiting to happen, not a style preference.

## Decision

Everything that represents money moving lives in the **same container, same partition**
(`commission_receivables`, partition key `/technicianId`), distinguished by a `docType`
discriminator:

- `RECEIVABLE` — one doc per completed cash booking (unchanged from E21-S01; absent `docType` on
  a stored doc reads as `RECEIVABLE` for backward compatibility).
- `REMITTANCE` — one doc per recorded payment, id `rem:${idempotencyKey}`. `idempotencyKey` is a
  client-generated UUID scoped per technician; a replayed call with the same key and the same
  amount/method/ref returns the original doc untouched.
- `CREDIT` — one doc per overpayment (or, later, incentive award) that couldn't be fully allocated
  to outstanding receivables at write time, id `cr:${refId}`. Consumed by future dues/remittances
  via `consumedBy` entries.
- `INCENTIVE_AWARD` — reserved for E23; the read-path union already tolerates it.

Every mutation across these doc types for one remittance (or settlement) goes through
`commissionReceivableRepo.runLedgerBatch()`, which wraps `container.items.batch(ops,
technicianId)` — a genuine single-partition transactional batch: all operations commit or none do.
Allocation ids are deterministic (`${refId}:${bookingId}`) so a batch retried after a partial
failure or a duplicate change-feed delivery cannot double-apply the same allocation — the repeat
write is naturally idempotent, not merely retried-and-hoped.

Every derived money figure (`remittedAmount`, `remainingPaise`, `totalOutstandingPaise`,
`commissionHold.outstandingPaise`) is **recomputed from the source arrays on every read/write**,
never incremented or decremented in place. A `+=`/`-=` on any of these fields is a bug by
definition here — see the `no-increment-on-ledger` Semgrep rule.

`technicians.commissionHold` is a **cache**, not a source of truth: it is written by a conditional
Cosmos PATCH (`patchCommissionHold`) guarded by an `evaluatedAt` string-comparison condition so a
slower, stale recompute can never clobber a fresher one. When a recompute fails or races, the
technician id is pushed onto the `system/hold-repair` queue (`technicianIds[]` + `all` flag) rather
than silently left wrong; the E21-S04 reconciler timer drains that queue on a 15-minute cycle, plus
a targeted `EXPIRED_OVERRIDES` sweep for technicians whose manual override has lapsed.

## Consequences

- **Positive:** every remittance/settlement is genuinely atomic — no cross-container partial-write
  window exists. Replays (duplicate change-feed delivery, a retried admin click) are inherently
  safe: deterministic ids make re-applying the same operation a no-op, not a double-count.
- **Positive:** absolute recomputation means a bug that once corrupts a derived field self-heals on
  the next read/recompute instead of compounding forever the way an increment bug would.
- **Negative (98-row allocation cap):** `container.items.batch()` caps at 100 operations; one op is
  the remittance anchor doc and (conditionally) one more is the credit doc, leaving
  `MAX_ALLOCATION_ROWS = 98` receivables a single remittance can pay down in one call. A technician
  with more than 98 simultaneously-outstanding bookings needs more than one remittance call to
  clear the balance — acceptable at pilot volume (~10 technicians, weekly settlement cadence) but a
  real ceiling to revisit before scale.
- **Negative (docType filter tax):** because `RECEIVABLE`, `REMITTANCE`, `CREDIT`, and (later)
  `INCENTIVE_AWARD` share one container, every receivable-only query must filter with
  `(NOT IS_DEFINED(c.docType) OR c.docType = 'RECEIVABLE')` — forgetting the filter silently
  pulls remittance/credit docs into a receivables aggregate. This is exactly the shape of bug the
  cross-container design would have prevented structurally; we accept it because the transactional
  guarantee is worth more at this stage than the query-authoring convenience, and the filter is
  centralized (`RECEIVABLE_FILTER` constant) rather than repeated ad hoc.
- **Negative (aggregate drains at pilot scale only):** `listAllTechniciansWithHold`,
  `sumDueGroupedByTechnician`, and the backfill sweep (`sweepAllHolds`) are cross-partition,
  full-drain queries with no continuation-token pagination baked into their callers. Fine for a
  ≤5,000-booking/mo pilot with a handful of technicians; will need re-architecting (or a
  materialized aggregate) before a multi-city rollout.
- **Neutral:** `holdEnforcementEnabled` and `enforceKycInDispatch` both default to `false` on
  `commission-config` — the hold is computed and visible to admins/technicians from day one, but
  does not yet block dispatch or job acceptance for anyone. This is a deliberate dark launch:
  the pilot needs to see real hold numbers before anyone is willing to gate work on them.

## Alternatives considered

- **Cross-container ledger (`commission_remittances` + `commission_credits`, cross-referenced by
  id)** — rejected: no atomic multi-container write in Cosmos DB; a crash mid-write leaves an
  undetectable gap between "money recorded as collected" and "remittance recorded as happened."
  Flagged independently by both Codex CLI and Opus review on 2026-09-05.
- **Incremental counters (`remittedAmount += amount` etc.)** — rejected: a single bad write (a
  double-fired trigger, a bug in an allocation edge case) permanently corrupts the running total
  with no way to detect or repair it short of a full manual audit. Absolute recomputation from the
  source arrays makes every derived figure self-correcting.
- **commissionHold as a source of truth, written synchronously on every settlement** — rejected:
  couples every booking-completion and remittance write to a successful hold recompute, so a
  transient Cosmos hiccup on the hold write would fail (or at minimum delay) the money-moving
  operation it has nothing to do with. Treating it as a best-effort cache with a repair queue
  decouples "the money moved" from "the cached hold is accurate," at the cost of the hold briefly
  lagging reality until the next recompute or the 15-minute reconciler catches it.

## References

- Spec: `C:/Users/alokt/.claude/plans/validated-frolicking-mochi.md` §3.2 (absolute recomputation),
  §5 (batch write invariant)
- `api/.semgrep.yml` — `ledger-batch-only`, `no-increment-on-ledger` rules enforce this ADR
  mechanically
- `api/src/cosmos/commission-receivable-repository.ts` — `runLedgerBatch`, `RECEIVABLE_FILTER`
- `api/src/services/commission-allocator.service.ts` — `MAX_ALLOCATION_ROWS`, deterministic id
  helpers
- `api/src/services/commission-hold.service.ts` — `recomputeCommissionHold`, `sweepAllHolds`
- `docs/stories/E21-S02-commission-ledger-v2.md`
