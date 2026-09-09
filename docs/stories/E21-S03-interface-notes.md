# E21-S03 — Admin commission console: interface notes and rulings

Extracted from the E21-S03 SDD decision ledger
(`wt-e21-s03/.superpowers/sdd/2026-09-07-e21-s03-commission-console/progress.md`, git-ignored) so
the decisions a later story could get wrong survive the worktree.

Source of truth for the design itself: `docs/design/E21-S03-commission-console.md`,
`docs/superpowers/plans/2026-09-07-e21-s03-commission-console.md`, and
`docs/stories/E21-S02-interface-notes.md` for the ledger contracts this console reads.

**This file is deliberately short.** The ledger holds 11 rulings and 4 interface notes; most are
now encoded in merged code that reads correctly on its own. Extracted here are only the ones where
**the code alone would mislead** — an invariant a future writer would violate innocently, a
boundary that looks arbitrary but is not, or a rejected alternative that will look attractive
again.

Unlike the E09-S08 and E21-S04 notes, this file was extracted by the orchestrator rather than by
the lane that built the story: that session had already ended. If something here is thinner than
it should be, the ledger is the reason and it no longer exists.

---

## 1. THE LIVE TRAP — a service commission override cannot be returned to inherit

**This is a money defect on `main` today, not a design note.** It is the most important thing in
this file.

Commission resolves **service → category → global**. A service-level override outranks both of the
levels an operator can see and undo. The two levels are not symmetric:

| | write body | clears to inherit? |
|---|---|---|
| Category | `UpdateCategoryBodySchema` → `commissionBps: CommissionBpsSchema.nullable().optional()` | **yes** — send `null` |
| Service | derived from `ServiceSchema` → `commissionBps: z.number().int().min(1500).max(3500).optional()` | **no** — not nullable |

`api/src/schemas/service-category.ts` was widened to `.nullable()` for exactly this reason during
Task 9. `api/src/schemas/service.ts` was not.

The UI compounds it. `ServiceForm` sends `commissionBps` **only when it is non-empty and differs
from `initial?.commissionBps`** (`admin-web/src/components/catalogue/ServiceForm.tsx`). So
emptying the input sends *nothing* and the existing override persists silently. The operator's
most natural gesture for "remove this" is a no-op that looks like it worked.

**Read surface, stated precisely** — an earlier framing of this said "invisible", which is too
strong: a super-admin opening that one service's edit form does see the current value seeded into
the input. What does not exist is any **roster** view answering *which services carry an
override*. So the field is discoverable one service at a time, by a super-admin who already
suspects, and by nobody else.

**Net effect:** a service can be set to 30%, cannot be cleared, is not listed anywhere, and
outranks the global rate. The only escape today is typing the current global value in by hand —
which freezes a copy that stops tracking the global forever after. Change the global later and
that service quietly does not follow.

**The fix has two halves and both are needed.** Making the service write body `.nullable()` alone
is not enough while `ServiceForm` omits the empty field; and a read surface alone leaves the
override unclearable. Whoever picks this up should also decide whether the roster surface belongs
on the settings page or the catalogue list — the ledger did not rule on that.

---

## 2. `commissionBps` is authorized on key PRESENCE, and the form must match the guard

`commissionBpsForbidden(body, admin)` in `api/src/functions/catalogue-admin.ts` checks
`'commissionBps' in body && admin.role !== 'super-admin'` — **presence, not value**, so it
forbids setting *and* clearing. It guards **four** paths: create and update, × category and
service.

The ruling that matters is the one taken *after* the guard shipped and broke every ops-manager
service edit: **fix the form, never weaken the guard.** `ServiceForm` had been sending
`commissionBps` on every submit whether or not anyone touched it. Role-gating the input and
omitting the key when unchanged aligned the UI with the API *and* closed a latent bug the guard
merely exposed — an ops-manager editing only a service name was silently re-sending a commission
value, so a stale or rounded figure could be rewritten by an edit that had nothing to do with
rates.

**Generalises beyond this field:** a form that always sends its whole model will re-write fields
nobody edited. When a field-level guard is added anywhere, check every form that submits that
model before assuming the guard is the thing that broke.

---

## 3. `buildBalanceEvents` and `buildBalanceStack` do not reconcile — deliberately

`admin-web/src/lib/commissions/derive.ts`. **Do NOT assume**

```
buildBalanceEvents(d).at(-1).balancePaise === buildBalanceStack(d).balancePaise
```

for arbitrary `d`. This is documented in-file as a KNOWN LIMITATION and is the single most likely
invariant for a future story to add a test for and "fix".

They answer different questions. `buildBalanceStack.balancePaise` is computed as **the server's own
expression** — `Σ over DUE rows of max(0, due − remitted)` — so the headline figure reconciles to
the API by identity rather than by arithmetic that could drift. The event ledger is a chronological
running balance built for a dispute phone call. Forcing them to agree would mean deriving the
headline by subtraction, which is precisely the drift the identity was chosen to prevent.

Also in that module: `settledPaise` is **signed** — a legacy row settled for more than it owed
makes it negative — and the settled filter gates on `!== 'DUE'`, matching the server, **not** on
`=== 'WAIVED'`. Filtering on `WAIVED` leaves a `REMITTED` row whose `commissionDue − remittedAmount ≠ 0`
diverging from the server.

`WAIVER` is a real event kind and must stay in `buildBalanceEvents`: a waived receivable is a
balance-affecting state the API returns, and the dispute ledger is the one view whose entire
purpose is completeness.

---

## 4. Route capability matching is by PREFIX — order is load-bearing

`admin-web/src/admin/capabilities.ts`, `ADMIN_ROUTE_CAPABILITIES`. Matching is first-prefix-wins,
**not** most-specific-wins. `/finance/commissions` must be listed **before** `/finance`, or the
general prefix matches first and grants `finance.read` where `finance.settleCommission` was
intended.

There is a test pinning it and a comment above the entries explaining why. **Both must survive any
future rebase** — the comment more than the ordering, because it is the only thing that will stop a
later merge from quietly re-sorting two adjacent lines. Verify by *executing* the module
(`capabilityForPath('/finance/commissions')`), never by reading it.

This file now carries three stories' capabilities (E21-S03, E09-S08 and whatever comes next), so it
is a standing collision point for any parallel work touching admin-web.

---

## 5. UI kit contracts (Task 4)

`admin-web/src/components/ui`:

- `Dialog({open, onClose, titleId?, title, children, footer})`
- `Drawer({open, onClose, title, children, footer, side='right'})`
- `ToastRegion({toast, onDismiss})`, `useToast(): UseToastResult`
- `ToastTone = 'success' | 'error'`; success toast is `role="status"`, error is `role="alert"`

**Kit dialogs MAY be nested.** The topmost closes on Escape, guarded **by identity** — a dialog
handles Escape only when its own DOM node is the last `[role="dialog"]` in the document, not by
counting open dialogs. The rejected alternative was to document the kit as non-nesting; it was
rejected because this very story nests (a remittance drawer over the ledger page, a confirm dialog
behind the enforcement toggle). That alternative will look attractive again to anyone who meets the
identity guard and thinks it is over-engineered.

---

## 6. Client module surface (Task 2)

`admin-web/src/api/commissions.ts` exports `fetchCommissionDashboard(continuationToken?)`,
`fetchTechnicianLedger(id)`, `recordRemittance(params)`, `recomputeAllHolds()`,
`setHoldOverride(id, params)`, `clearHoldOverride(id)`, `fetchCommissionConfig()`,
`updateCommissionConfig(patch)`, `fetchTechnicianClientConfig()`, `updateTechnicianClientConfig(patch)`.

Types are **aliases onto the generated schema**, never hand-written duplicates — so regenerating
the client is the way to change them. Note `TechnicianClientConfig` responses include `id`; the
plan contradicted itself on this and the ruling was to keep it.

---

## 7. Page-scoped figures are labelled, and that is not a placeholder

When a `continuationToken` exists, the roll-up qualifies its count and oldest-due date as "on this
page" and derives the band's "as of" from `min(evaluatedAt)` over loaded rows. This was a
deliberate ruling against adding a roster-wide count to the API: the server already computes
`totalOutstanding` roster-wide on purpose, and a new top-level field would mean another pass
through the registry, an OpenAPI rebuild and a client regen for a provenance label.

**Do not "fix" this by adding an API field.** Honest labelling is right at any roster size; the API
change is right at none of them here.

Related: config **degrades, never blocks**. The ledger is what the owner needs mid-phone-call; the
hold-reason sentence is a nicety. Fetch them independently and render the ledger whenever it
resolves, falling back to a bare `HoldChip` without the money-terms sentence.

---

## 8. Hold override dates are end-of-day IST, expressed as UTC

`endOfIstDayUtcIso(dateStr)`. An override "until 30 Sep" must cover all of 30 Sep in Ayodhya, not
expire at 05:30 IST when UTC midnight lands. `2026-09-30` → `2026-09-30T18:29:59.999Z`.

The API validates `until: z.string().datetime()`. The dialog originally forwarded the raw
`<input type="date">` value, so **every save 400'd and no test saw it** — component tests mocked
the call, API tests fed valid ISO, and nobody exercised the seam. If a future dialog takes a date
and an endpoint takes a datetime, that seam is where to look first.

---

## Not extracted — and where to find it instead

- **Why cash collected is not a balance line**, and the accounting-stack layout →
  `docs/design/E21-S03-commission-console.md` §4. It is design rationale, and the design doc is
  where a UI story will look.
- **Staleness-as-provenance, the "Cached total" relabel, the marigold ruling** → same document,
  §2–§3. Encoded in components that read correctly.
- **`cashCollectedPaise` summing remittances instead of receivables** → fixed in
  `api/src/functions/admin/finance/commission-receivables.ts`; the technician-facing sibling in
  `api/src/services/commission-view.service.ts` is the reference implementation. Nothing left to
  carry.
- **The `RemittanceDrawer` idempotency-key state machine** (five review findings that turned out to
  be one flaw: `loadPendingAttempt` returning `null` for three distinct states) → the discriminated
  `{status: 'found' | 'empty' | 'unavailable'}` return in the merged code states it better than
  prose can. `'empty'` MINTS and never falls back to the ref.
- **A `--no-verify` commit at `258fdd68`** → a policy violation that let nothing through; the
  pre-commit secret patterns were re-run by hand against its diff (one 126-line test file, no
  matches) and history was deliberately not rewritten.
- **Carried-not-fixed items other than §1** → `--color-warn` fails light-mode contrast across four
  shipped components (`tests/setup.ts` carries a different token value, which is why no test can
  see it); `localStorage` pending remittance keys have no TTL; two differently-gated surfaces are
  both called "Payout Queue".

**The ledger does not survive the worktree.** If something above is not enough, ask before
`wt-e21-s03` is removed — after that it is gone.
