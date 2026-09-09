# E21-S03 — Admin commission console: design direction

**Status:** design direction, pre-implementation. Reviewed before any UI code is written.
**Contract:** `admin-web/DESIGN.md` (D1 editorial command center) governs. This document adds only
information design — no new colour core, no new type family, no new radii.

## 1. What this surface is for

One expert user (the owner) asking two questions, in this order:

1. **Who owes me money?**
2. **Can I trust these numbers?**

Question 2 is unusual and it is what makes this screen different from a generic finance table. Every
figure here is a *cache* (`technicians.commissionHold`) over a *ledger* (`commission_receivables`).
The cache can be stale. The API tells us so explicitly, per row (`staleAfter`) and per roster
(`unreconciledTechnicianCount`). A design that renders these numbers as flat, unqualified truth
would be lying by omission.

So: **trust state is a first-class visual dimension here, not an error case.**

## 2. Tokens — reused, not extended

No new tokens. Existing semantic roles map as follows.

| Meaning | Token | Rationale |
|---|---|---|
| Hold CLEAR | `--color-text-muted` (no badge) | The common case must be quiet. A green badge on every healthy row is noise that trains the eye to skip badges. |
| Hold WARN | `--color-warn` `#E9B44C` | ember |
| Hold BLOCKED | `--color-danger` `#B6385C` | rose |
| Operator intervened here | explicit labelled chip, not colour | see below |
| Stale / unverified figure | `--color-text-faint` + explicit "as of" | provenance, not alarm |

Marigold keeps its DESIGN.md meaning unchanged — **selected/current state and the primary action** —
and nothing more. An earlier draft reserved it exclusively for "a human intervened"; that rule broke
on its own first example, because the drawer's primary action is also marigold. Colour alone cannot
carry provenance as the surface grows.

Operator interventions are instead marked by an **explicit chip carrying the actor and time** —
`Override · Alok · 6 Sep`, `Waived · Alok · 2 Sep` — because in a dispute the operator needs to know
*who* did it and *when*, which a colour can never say.

## 3. Roll-up — `/finance/commissions`

The generic solution is a row of three stat cards over a table. Rejected: three equal tiles imply
three peer facts, and here they are not peers — one is money, one is a trust caveat, one is a count.

Instead a **compact summary band** (a band, not a card — no nested cards per DESIGN.md), carrying
the figure *and its provenance inline*, then the table as the hero.

```
 Outstanding commission    ₹1,842.58    4 technicians · oldest 8 May · as of 13:24
 ──────────────────────────────────────────────────────────────────────────────────
 All balances reconciled                                            [ Recompute ]

  Technician         Outstanding   Jobs   Oldest due   Last checked   State
  ─────────────────────────────────────────────────────────────────────────────────
  Ramesh Kumar          ₹1,393.46     7    22 Aug       13:24          —
  Suresh Yadav            ₹202.06     2     9 May       13:24          Warn
  Anil Verma              ₹134.78     1     8 May       13:24          Override · Alok · 6 Sep
  Mohan Lal               ₹112.28     1    23 Aug       07:10 · stale  —
```

**Staleness is provenance, not a warning.** Every figure on this surface is a cache over the ledger,
so every figure carries an "as of". Faint-and-quiet was wrong in the earlier draft: faint reads as
*unimportant*, but stale means *possibly wrong*. So a past-`staleAfter` row shows its timestamp with
an explicit `stale` marker in `--color-warn`, not a receding one.

When `unreconciledTechnicianCount > 0` the band's label itself changes from **"Outstanding
commission"** to **"Cached total"**, and the reconciliation line becomes a `--color-warn` strip. The
number stops claiming to be the truth at the moment it stops being the truth.

Copy: **"All balances reconciled"** / **"3 technicians have unreconciled balances — figures below may
be out of date."** States what happened, offers the fix, no apology.

Money right-aligned, `--font-mono`, tabular numerals. Server sorts outstanding-desc.

**Hold state is an eligibility filter, never a ranking** (plan §3.7). Ordered by amount, never by
state; state is a trailing attribute, never a leading one.

## 4. Detail — `/finance/commissions/[technicianId]`

`cashCollectedPaise` and `creditAppliedPaise` **must never be read as summable** (plan §6). An
earlier draft solved this with a left/right arrow diagram around the balance. That was decoration
doing a job structure should do — and it hid a deeper modelling error.

**Cash collected is not a balance line at all.** It is the money that passed through the
technician's hands at the door — evidence for *why* a commission exists, not a reduction of what is
owed. Only credits reduce the balance. So the two figures are not peers, not opposites, and do not
belong in one composed graphic. They belong in different blocks entirely:

```
 Balance
   Commission due from cash jobs          ₹1,842.58
   Payments and credits applied           − ₹449.12      (includes ₹0.00 from credit)
   Waived or settled                      −   ₹0.00
   ───────────────────────────────────────────────
   Balance due                              ₹1,393.46

 Cash-job context
   Collected at the door, 11 jobs         ₹6,193.00      (not part of the balance)
```

**Revised after implementation review (2026-09-07).** An earlier draft made "credits" its own
subtraction line. That was wrong twice over: applied credits are already inside the server's
`remittedAmount`, so subtracting them again double-counts; and the credits that actually exist today
(overpayments) are written with a remittance source, so a dedicated credit line would read ₹0.00
forever while the events ledger below showed the same money. Credit is therefore an annotation on
the payments line, not a line of its own.

The third line absorbs both waived remainders and settled-row residue, and is **signed** — a legacy
row settled for more than it owed makes it negative. `balancePaise` is computed as the server's own
expression (`Σ over DUE rows of max(0, due − remitted)`) rather than by subtracting these lines, so
the headline figure reconciles to the server by identity rather than by arithmetic that could drift.

An accounting stack cannot be mis-added, because every line already carries its own sign and the
total is stated. The parenthetical on the cash line is doing real work and stays.

### Balance events — the dispute view

Management sections stay separate (a remittance is money that moved; a credit is money that did
not). But a technician arguing on the phone needs **one chronological ledger with a running
balance**, so the operator can walk the call through it line by line:

```
  Date     Event                                    Change      Balance
  8 May    AC Deep Clean · bk 304bad00              + ₹134.78    ₹134.78
  9 May    AC Deep Clean · bk f40503c8              + ₹134.78    ₹269.56
  2 Sep    Payment · UPI · ref upi-abc123           − ₹449.12    ₹1,393.46   Alok
```

Every row carries the booking id, the reference, and who recorded it. References are click-to-copy —
at 11pm the operator is reading one aloud down a phone line. This needs **no API change**: it is
derived from `receivables[]`, `remittances[]` and `credits[]`, all already returned by the detail
endpoint.

Also on this page: current hold state with **why** in plain words ("Blocked — balance ₹5,240 is over
the ₹5,000 limit"), and a "technician-declared" marker on UPI-collected rows, since the technician
self-reported that collection method.

**Not here:** the technician's phone number. That is E09-S08's masked-with-audited-reveal design;
putting a raw number on this page would pre-empt it.

## 5. Remittance drawer — the preview problem

The client computes an allocation preview; **the server recomputes authoritatively** and may
disagree (a concurrent settlement, a config edit). Rendering the preview as fact would be a money
bug in the UI layer.

Treatment: the preview block sits behind a dashed left rule in `--color-text-faint`, under a plain
label — **"Preview. The server recalculates when you record this."** After submission it is replaced
in place by the returned allocations in full-strength text. The visual weight change *is* the
feedback that the number became real.

Three server responses need distinct copy, all in the interface's voice:

- `replayed: true` → **"Already recorded. This is the original receipt, not a second payment."**
- `holdRecomputePending: true` → **"Recorded. The balance will catch up shortly."**
- `409 IDEMPOTENCY_MISMATCH` → names the *pending attempt*, not the reference just typed: **"A previous attempt for this technician has not been confirmed: {amount} via {method}, reference {ref}."** plus an explicit discard action whose copy states the risk it carries.

**Revised after implementation review (2026-09-07).** The original wording here was false in the
case that actually produces this error. The idempotency key is scoped to the technician and cleared
only on a successful record, so a 409 means an *earlier, unconfirmed* attempt is still pending — the
reference the operator just typed has usually never been used for anything. Blaming it sent the
operator looking for a problem that was not there, and because the key survives the failure, every
subsequent distinct payment for that technician hit the same error. The message must name the
pending attempt and offer a way out.

That way out — discarding the pending attempt — deliberately re-arms a double charge, so it is the
most dangerous control on this surface. Its copy says so plainly: if the earlier attempt did land,
discarding it and recording again charges the technician twice. This is the one place in the console
where we ask the owner to make that call, because only they can check whether the money arrived.

When the server's allocation **differs from the preview**, say so explicitly rather than swapping
the numbers silently — the operator has already read the preview aloud, possibly to the technician:

> **Allocated differently than previewed.** Another settlement landed first. Preview showed
> ₹449.12 across 3 jobs; recorded ₹449.12 across 2 jobs.

The action keeps one name throughout: the button says **Record payment**, the toast says
**Payment recorded**.

## 6. Settings — `/settings/commission`

Two groups that must not blur together: **rates** (money arithmetic, affects future bookings only)
and **enforcement** (behaviour, affects dispatch). Separate sections with a rule between them.

Rates carry a consequence line — *"Applies to bookings created from now on. Past bookings keep the
rate they were priced at."* — because the single most expensive misunderstanding available on this
page is thinking a rate edit repriced history.

Thresholds carry *"Applies within 5 minutes."* — and, because the roll-up has already loaded every
technician's `outstandingPaise`, the threshold inputs show their **actual impact live, computed
client-side with no new endpoint**:

> At ₹5,000: **no technicians** would be blocked today.
> At ₹1,000: **1 technician** would be blocked today (Ramesh Kumar, ₹1,393.46).

`holdEnforcementEnabled` is the one genuinely dangerous switch on this surface — it changes whether
technicians stop receiving work. It gets a confirm step that names the consequence in the same
terms.

Every setting shows **who changed it and when** (`updatedBy` / `updatedAt`, already on the config
doc). This is owner-only software where a wrong rate is a money bug; accountability is not optional.

A fuller "who would move to WARN/BLOCKED under this config" server-side dry-run belongs to E21-S04,
which owns shadow mode. The client-side count above is the honest subset available today.

## 7. Motion

Per DESIGN.md: 120ms press, 220ms standard, 420ms reserved. The drawer slides at 220ms. The
preview→actual swap is a 220ms opacity/weight change — the one orchestrated moment on the surface,
because it marks a number becoming true. Nothing else animates. `prefers-reduced-motion` respected.

## 8. Quality floor

Responsive to mobile (tables scroll in their own `overflow-x` container; the page never scrolls
sideways). Visible keyboard focus via `--color-focus-ring`, never marigold. Dialogs follow the
existing `react-focus-lock` + `role="dialog"` + Escape recipe exactly, so the existing a11y spec
style applies. Hindi is first-class: `hi` is the default locale, all copy lands in both
`messages/en.json` and `messages/hi.json`, and money goes through `formatINR(paise, locale)`.

## 9. What this deliberately does not do

- No new shared colour, radius, or type token.
- No green "healthy" badge on CLEAR rows.
- No card nesting (DESIGN.md anti-pattern).
- No all-caps eyebrow labels.
- No sum of cash + credit, anywhere, ever.
- No raw technician phone number (E09-S08 owns masked contact + audited reveal).
- No server-side enforcement dry-run (E21-S04 owns shadow mode).

## 10. Review trail

Design-direction review run cross-model via `codex exec` before any code (2026-09-07). Accepted and
applied: the accounting stack replacing the arrow diagram, cash-collected demoted out of the balance
entirely, staleness reframed as provenance, the marigold rule dropped in favour of actor-and-time
chips, the balance-events dispute ledger, and the preview-mismatch delta. Scoped out with reasons:
technician phone (E09-S08) and the server-side enforcement dry-run (E21-S04). Explicitly kept:
trust as a first-class dimension, no green healthy badges, hold state as an eligibility filter and
never a ranking input.
