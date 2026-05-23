# ADR-0024: Rating Shield Threshold — ≤2★ Narrow Default

- **Status:** accepted
- **Date:** 2026-05-14
- **Deciders:** Alok Tiwari

## Context

The rating shield intercepts low-star submissions and offers the customer the option to send
their feedback to owner support privately before the rating is published. The shield fires when
the customer's overall star rating is at or below a configurable threshold.

Two threshold candidates were considered for the MVP launch:

- **≤2★ (narrow)**: only 1-star and 2-star ratings trigger the shield.
- **≤3★ (broad)**: ratings of 1, 2, or 3 stars trigger the shield.

The threshold is stored as a Firebase Remote Config key (`rating_shield_threshold_stars`,
default `2`), so it can be changed server-side without a Play Store release.

At MVP launch we have no PostHog data for the Ayodhya pilot area. We do not know what
percentage of bookings will receive low ratings or at what rate customers use the escalate vs.
skip path.

## Decision

**Ship with ≤2★ as the default shield threshold.**

The threshold should only be widened to ≤3★ if PostHog soft-launch data shows **more than 10%
of all completed bookings** hitting the shield (i.e., rating ≤2★). If the shield is firing that
frequently, a broader net is warranted to give owner support adequate signal. Otherwise, widening
to ≤3★ pre-launch creates unnecessary friction for customers who give a middling-but-not-bad
rating.

The Remote Config key means no code change is needed to adjust the threshold post-launch.

## Consequences

- **Positive:** Minimal friction for the majority of raters (3★, 4★, 5★ submitters see no shield).
- **Positive:** The narrow threshold avoids desensitising customers to the shield prompt.
- **Positive:** Threshold is remotely configurable — no release required to widen.
- **Negative:** Customers giving a genuine 3★ rating (unsatisfied but not severely) receive no
  private escalation path. If 3★ problems surface at scale, this is a gap.
- **Neutral:** The 10% PostHog trigger is a heuristic, not a hard rule. Owner can override with
  judgment after reviewing first 30 days of data.

## Alternatives considered

- **≤3★ threshold from day one** — rejected. Without any baseline data, widening the shield to
  3★ is speculative. A 3★ rating reflects moderate dissatisfaction, not a support-triggering event.
  Widening pre-launch risks frequent shield interruptions that reduce the signal quality of
  genuine escalations.
- **≤1★ threshold** — rejected. A 1-star rating is an explicit, deliberate condemnation. Customers
  who give 1★ are typically certain and do not need a shield nudge; they may also find the
  shield patronising. The ≤1★ threshold would undermine the shield's purpose (catching impulsive
  low ratings before they publish).
- **Dynamic threshold driven by ML** — out of scope for MVP; revisit at E18 or later when
  sufficient booking volume exists for model training.

## References

- `docs/stories/E18-S03-rating-shield-hindi-tip-chip.md` — story that authored this ADR
- `docs/adr/0017-customer-wallet-ledger.md` — pattern: Firebase Remote Config for feature toggles
- Firebase Remote Config key: `rating_shield_threshold_stars` (default `2`)
