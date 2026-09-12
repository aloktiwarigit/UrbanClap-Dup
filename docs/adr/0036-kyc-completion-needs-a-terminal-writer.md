# ADR-0036: KYC completion needs a terminal writer, not a status scalar

- **Status:** accepted
- **Date:** 2026-09-12
- **Deciders:** Alok Tiwari (owner), E21-S05a implementing session
- **Extends:** ADR-0032 (the dispatch predicate this ADR gives a real backing fact to;
  see that ADR's "Corrected three times, then replaced" passage and its two negative-consequence
  bullets on `kyc.kycStatus` and missing step-order enforcement — both are resolved here)

## Context

ADR-0032 diagnosed `kyc.kycStatus` as the root cause of three consecutive wrong dispatch
predicates: it is a single scalar used as a progress marker for a two-step process
(DigiLocker Aadhaar, PAN OCR) that is completable in either order, so it cannot express "both
done" — whichever step ran last wins. `COMPLETE`, the one enum value that could carry that
meaning, had no writer anywhere in the codebase. ADR-0032 worked around this for *dispatch* by
having the predicate read two independent per-step facts (`kyc.aadhaarVerified`, `kyc.panHash`)
instead of the scalar, and explicitly left two things unresolved as out of scope for that story:

1. Nothing outside the dispatch predicate had a trustworthy notion of "KYC complete." A client
   rendering progress from `kycStatus` — the technician app's own KYC screen, any admin view —
   still showed a false "done" the moment either step ran, and could never show a true "done"
   at all, because no code path ever wrote `COMPLETE`.
2. `submit-pan-ocr.ts` accepted a PAN submission unconditionally, with no check that Aadhaar had
   ever been verified. A technician who submitted PAN first reached `PAN_DONE` and had no route
   forward to a state meaning "both steps done" — not because the two-fact predicate was wrong
   (it isn't; it is order-independent by construction), but because nothing ever wrote the
   scalar value that would let a *client* show completion, and no endpoint enforced the order
   that would make a status-based mental model of the flow coherent.

Both problems trace back to the same root ADR-0032 named: the field is a marker, not a fact, and
guessing at what it should mean is what produced three review rounds of wrong predicates. This
story does not relitigate that diagnosis; it finishes the fix ADR-0032 started by giving
`COMPLETE` an actual writer and giving the two-step flow an actual order.

## Decision

1. **`deriveKycStatus()` is the only writer of `COMPLETE`.** It computes the status from the same
   two facts the dispatch predicate already reads — `aadhaarVerified` and a non-null, non-empty
   `panHash` — so the client-visible status and the dispatch-visible facts can never disagree.
   `PENDING` / `AADHAAR_DONE` / `PAN_DONE` / `COMPLETE` are the only outputs; rejection paths
   (`PENDING_MANUAL`, `MANUAL_REVIEW`) bypass derivation entirely and call `upsertKycStatus`
   directly, because a rejection is an override the derivation must not second-guess.
2. **Derivation happens inside the existing read-modify-write, not after it.**
   `upsertKycStepAndDeriveStatus()` computes `deriveKycStatus()` from the merged document inside
   the same `readModifyWrite` callback that writes the step's fields, so the status and the facts
   it is derived from land in the same ETag-guarded write. A read-back after the write would add a
   second Cosmos round-trip and reopen exactly the kind of window `readModifyWrite` exists to
   close.
3. **`submit-pan-ocr.ts` now enforces step order.** It reads the technician's existing KYC record
   before calling Form Recognizer and rejects with `409 { code: 'AADHAAR_REQUIRED_FIRST' }` unless
   `aadhaarVerified === true`. `submit-aadhaar.ts` is unchanged and still accepts Aadhaar first, in
   either order relative to nothing — there is no "PAN must come first" rule, only "Aadhaar must
   precede PAN."
4. **`panVerified` is exposed on `GET /v1/kyc/status`** as a boolean derived from the same fact the
   dispatch predicate and `deriveKycStatus()` both key on (`panHash` present and non-empty), so a
   client can key its own UI off the same fact everything else uses instead of re-deriving
   meaning from `kycStatus` or from a masked string.
5. **The change-feed projector (`trigger-projector-kyc.ts`) now treats only `COMPLETE` as
   complete.** `AADHAAR_DONE` and `PAN_DONE` moved into `ACTION_REQUIRED_STATUSES` — previously
   both were absent from `COMPLETE_STATUSES`'s predecessor set in a way that let a single-step
   technician's `KYC_RESUME` reminder resolve early. Now the reminder stays open until
   `deriveKycStatus()` actually writes `COMPLETE`, which — because of (1) and (2) — only happens
   when both facts are true.

## Consequences

**Positive:**
- `kycStatus` is now a value clients can trust: `COMPLETE` means what it says, because exactly one
  function writes it and that function cannot be fooled by write order.
- The dispatch predicate (ADR-0032) and the client-visible status now derive from the identical
  two facts, computed by the identical function, so a future change to what "KYC verified" means
  only has one place to change it correctly (`deriveKycStatus`) instead of two definitions that
  can drift apart.
- A PAN-first technician — the population ADR-0032's fix left stranded — now gets a clear,
  actionable `409` instead of silently reaching a state (`PAN_DONE`) with no route to completion.

**Negative — read this before touching either mechanism:**
- **The two mechanisms are partly redundant by design, and that redundancy has a real cost.**
  Derivation alone (`deriveKycStatus`, items 1–2) would have been *sufficient* for correctness —
  it makes `COMPLETE` reachable and order-independent regardless of what `submit-pan-ocr.ts` does.
  Step-order enforcement alone (item 3) would have been sufficient to keep the flow coherent
  *going forward*, but would have left every technician who had already submitted PAN before this
  story shipped permanently stuck at `PAN_DONE` with no way to reach `COMPLETE`, since the
  endpoint would simply keep rejecting their (already-past) PAN step retroactively unless a
  backfill ran. Shipping both closes both gaps, but it means `submit-pan-ocr.ts` now pays an
  **extra Cosmos read on every PAN submission** — the `getKycByTechnicianId` precondition check —
  purely to enforce an ordering that derivation does not actually depend on for correctness. A
  future session that notices this and "simplifies" by dropping the precondition read will restore
  the PAN-first stranding this story exists to fix; a future session that instead considers
  dropping `deriveKycStatus`'s order-independence in favor of trusting the (now-enforced) order
  will reintroduce exactly the fragility ADR-0032 spent three review rounds correcting, the moment
  any other write path (a manual/admin KYC path, a backfill script) touches these two fields
  without going through `submit-pan-ocr.ts` / `submit-aadhaar.ts`. Keep both.
- **`deriveKycStatus` still does not cover a manual/admin KYC path.** ADR-0032 flagged this as
  unbuilt and it remains unbuilt. If one is ever added, it must produce the two underlying facts
  (`aadhaarVerified`, `panHash`) and call `deriveKycStatus` (or `upsertKycStepAndDeriveStatus`) —
  not write `kycStatus` directly — or it reopens the exact single-writer guarantee this ADR
  establishes.
- **`enforceKycInDispatch` remains OFF, and this story does not authorise flipping it.** This story
  removes the blocker recorded in `E21-S04-interface-notes.md` item 5 (a PAN-first technician had
  no route to a completable state) and gives `COMPLETE` a real meaning, but it does not touch, and
  does not itself justify touching, the dispatch enforcement flag. That flag still requires the
  production-data precondition check described in `docs/runbook.md` ("Precondition before flipping
  `enforceKycInDispatch`") — specifically, confirming the target environment holds zero legacy
  `kyc` sub-objects that would fail closed under the two-fact predicate. Nothing in this story
  performs or substitutes for that check.
- **The `409 AADHAAR_REQUIRED_FIRST` precondition read is unconditional**, even for a technician
  who will go on to fail Form Recognizer anyway (a rejected OCR read). Every PAN submission now
  costs one extra point read regardless of outcome.
- **Legacy `kyc` sub-objects predating this story are unaffected by the ordering rule** in the one
  direction that matters: a technician whose document already carries `panHash` from before this
  shipped is not retroactively re-checked against `aadhaarVerified` by anything other than the
  dispatch predicate itself (ADR-0032's `KYC_VERIFIED_PREDICATE`) — the new `409` guard only fires
  on a *new* PAN submission, so an already-complete or already-PAN-only technician's existing
  document is not touched by this change until they next submit either step.

**Neutral:**
- `PENDING_MANUAL` and `MANUAL_REVIEW` remain writable directly via `upsertKycStatus`, bypassing
  `deriveKycStatus` entirely. This is deliberate — a rejection is an operator/system override of
  the derived value, not a fact to be derived — but it means the "single writer of `COMPLETE`"
  guarantee this ADR establishes does not extend to a general "single writer of `kycStatus`"
  guarantee. Only `COMPLETE` is exclusively derived.

## Alternatives considered

- **Step-order enforcement only, no derivation.** Rejected — see the redundancy discussion above:
  it strands every technician who submitted PAN first before the enforcement shipped, which the
  owner explicitly ruled out as an acceptable outcome.
- **Derivation only, no step-order enforcement.** Rejected — correctness does not require it, but
  it leaves the flow incoherent from a technician's point of view: submitting PAN first is
  silently accepted and then sits at `PAN_DONE` with no error and no guidance, when the product
  intent (per the PRD's Aadhaar-then-PAN flow) is that Aadhaar comes first. The owner wanted the
  precondition to be a real, visible `409`, not an implicit ordering technicians could violate
  without feedback.
- **Deriving `kycStatus` lazily on read (in `get-kyc-status.ts`) instead of writing it.** Rejected —
  it would fix the client-facing status without fixing the change-feed projector, which reads
  `doc.kyc.kycStatus` directly from the stored document and has no read-time hook to intercept;
  the projector would keep resolving `KYC_RESUME` reminders on a status that was never actually
  persisted as `COMPLETE`. Writing the derived value keeps every consumer — HTTP handler, change
  feed, any future direct Cosmos read — looking at the same persisted fact.
- **Backfilling `kycStatus` to `COMPLETE` for pre-existing dual-verified technicians in this
  story.** Rejected as out of scope — no evidence was gathered here on whether any pre-existing
  documents satisfy both facts, and a backfill script touches production data outside a
  documentation-only follow-up. Left for a dedicated story if the population is found to be
  non-empty.

## References

- `docs/adr/0032-commission-hold-is-an-eligibility-gate.md` — the ADR this one extends; the
  three-round predicate history and the two negative consequences ("Dispatch is the component
  that ends up *defining* what 'KYC verified' means" and "The two-fact predicate is a data-shape
  check, not an ordering guarantee") this ADR resolves
- `api/src/cosmos/technician-repository.ts` — `deriveKycStatus`, `upsertKycStepAndDeriveStatus`
- `api/src/functions/kyc/submit-pan-ocr.ts` — the `409 AADHAAR_REQUIRED_FIRST` precondition
- `api/src/functions/kyc/submit-aadhaar.ts` — the deriving success path
- `api/src/functions/kyc/get-kyc-status.ts` — the `panVerified` field
- `api/src/functions/trigger-projector-kyc.ts` — `COMPLETE_STATUSES` / `ACTION_REQUIRED_STATUSES`
- `docs/runbook.md` — "Precondition before flipping `enforceKycInDispatch`" (still required; this
  ADR does not satisfy it)
