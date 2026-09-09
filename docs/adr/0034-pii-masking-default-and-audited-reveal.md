# ADR-0034: Phone numbers are masked by default; the full number is reachable only through an audited, rate-limited reveal endpoint

- **Status:** accepted
- **Date:** 2026-09-08
- **Deciders:** Alok Tiwari (owner), implementing session (E09-S08)

## Context

Admin orders returned the customer's full phone number in the list, the detail drawer, and the
CSV export. The technician's phone was absent entirely, so owner requirement R2 ("admin sees
technician + customer phone on a booking") was unmet — closing R2 by simply adding the raw
technician number alongside the already-unmasked customer number would have doubled the exposed
surface instead of fixing it.

A CSV export is an uncontrolled copy: once downloaded, it leaves every access control, audit hook,
and session boundary the API enforces. Any admin with `orders.read` — including `finance` and
`support-agent`, who have no legitimate reason to see a customer's phone number — could export the
full customer list with a click. The masking work in this story therefore couldn't stop at the
list and drawer; the CSV path had to carry the same guarantee, including the case where
`customerName` itself falls back to the customer's phone number when a booking has no display
name (that fallback writes into the CSV's `customerName` column, so an unmasked fallback there
would silently re-leak the number the rest of the story just closed off).

Two independent copies of phone-masking logic already existed (`admin/customers/list.ts`,
`admin/technicians/list.ts`), each hand-rolled and each a place a future editor could
accidentally regress the format or the length-leak guarantee.

## Decision

Phone numbers (and UPI VPAs) are masked by default everywhere in the admin API, with a single
audited path back to the raw value.

- **One masking module.** `api/src/lib/pii/mask.ts` owns `maskPhone` and `maskVpa`. It is pure,
  has no I/O, and is guarded by a test
  (`api/tests/lib/pii/mask.test.ts` → `masking is not re-implemented anywhere else`) that fails
  the build if `maskPhone` is declared in more than one source file. The two prior duplicates in
  the customer and technician roster handlers are deleted and re-pointed at this module.
- **One serialization boundary.** Masking happens inside `hydrateOrders` in
  `api/src/cosmos/orders-repository.ts`, after every raw-value fallback (technician contact
  lookup, customer profile lookup, `customerName` phone-fallback) is resolved, and before the
  object is handed back to any caller. `queryOrders` and `getOrderById` both terminate in
  `hydrateOrders`, so there is no code path in admin orders that can emit a raw number.
  `technicianPhoneMasked` is a **new optional** field on `OrderSchema` — read-path schemas only
  widen (see `~/.claude/memory/feedback_read_path_validation.md`), so this can never break an
  existing stored order.
- **One reveal endpoint.** `POST /v1/admin/orders/{id}/reveal-contact`, body `{ party: 'CUSTOMER'
  | 'TECHNICIAN' }`, resolves the raw number fresh from Firebase Auth on every call — never from a
  cached response — and returns it with `Cache-Control: no-store`. Restricted to `super-admin` and
  `ops-manager` via `requireAdmin`. Rate-limited to 30 reveals per minute per admin via
  `consumeStrict`, which fails **closed** (`503 RATE_LIMIT_UNAVAILABLE`) if the rate-limit store
  itself is unreachable — the opposite choice from the shared `consume()` helper (fail open),
  which is correct for the location endpoint it was written for and wrong here: a rate limiter
  that silently stops limiting is an acceptable availability trade-off for live-location polling
  and an unacceptable one for PII disclosure.
- **Audited, without re-leaking.** Every successful reveal writes a `PII_CONTACT_REVEALED` entry
  to `audit_log` carrying `party`, `subjectId`, the **masked** number, and the last four digits —
  never the full number. `audit_log` is readable by any role holding `audit.read`, so writing the
  raw number into the audit payload would defeat the masking this ADR exists to establish.
- **Client re-masks itself.** The admin-web `ContactReveal` component holds the revealed number in
  component state only (never in a store, never in a URL), starts a 60-second countdown on reveal,
  and re-masks automatically when it elapses or when the operator clicks "Hide now" early.

## Consequences

- **Positive:** `finance` and `support-agent` — roles with no operational need to contact a
  customer or technician directly — can no longer read any phone number anywhere in the admin
  surface, including the CSV export, without that fact appearing nowhere: they simply don't get
  the reveal control.
- **Positive:** every reveal is attributable to one admin, one order, one party, at one timestamp.
  A CSV export can never carry an unmasked number, so the uncontrolled-copy problem this ADR opened
  with is closed structurally, not by policy.
- **Positive:** `technicianPhoneMasked` being permanently optional means this change cannot break
  any consumer of the existing `OrderSchema`, including the admin-web client generated from
  `api/openapi.json` before this story shipped.
- **Negative:** the last four digits of every phone number remain visible to every role that can
  read orders (`orders.read`), including `finance` and `support-agent`. This is an accepted
  trade-off, not an oversight — see "Alternatives rejected" and `docs/threat-model.md`.
- **Negative:** `maskVpa` deliberately leaves the PSP suffix (e.g. `@okhdfcbank`) readable, which
  is a smaller but real disclosure (which bank the technician uses) accepted for the same
  operator-recognition reason as the last-four digits.
- **Negative:** denied and failed reveal attempts are not audited — only successes write to
  `audit_log`. An `ops-manager` probing which orders have reachable numbers, or any role hitting
  the endpoint and getting a 403/404, leaves no trace. Recorded as an open gap in
  `docs/threat-model.md` with a recommended `PII_CONTACT_REVEAL_DENIED` audit action, deferred
  because it requires expanding an audit-action enum the spec defines as closed for this story and
  hooking auditing into shared `requireAdmin` middleware.
- **Neutral:** 30 reveals/minute/admin is 43,200/day with no per-subject or daily cap and no
  volume alerting, while the same role can already page the full orders list for ids. This is the
  single most important open item from this story — see `docs/threat-model.md` for the full
  writeup and the recommended daily-cap-plus-anomaly-threshold control.

## Alternatives considered

- **A confirmation dialog before each reveal** — rejected as friction theatre. An operator who
  reveals contact numbers many times a day gets no additional safety from clicking "confirm";
  the audit log is the real control, and it already records every reveal without requiring the
  admin to do anything extra.
- **Storing the raw number in the audit payload** — rejected: `audit_log` is readable by any role
  with `audit.read` (which is broader than the two roles allowed to reveal), so this would
  re-leak the exact PII the masking work exists to contain, just through a different door.
- **Reveal-by-CSV (a separate "unmasked export" admin action)** — rejected as unattributable at
  the row level: a CSV, once downloaded, carries no record of who looked at which specific
  number, defeating the audit requirement entirely.

## References

- Spec: `C:/Users/alokt/.claude/plans/validated-frolicking-mochi.md` §6 (E09-S08 row), §7.11,
  §8 (RBAC, audit enum, ADR 0034)
- Plan: `plans/E09-S08-pii-safe-phones.md`
- `api/src/lib/pii/mask.ts` — `maskPhone`, `maskVpa`, `MASK_PLACEHOLDER`
- `api/src/cosmos/orders-repository.ts` — `hydrateOrders`, the single serialization boundary
- `api/src/functions/admin/orders/reveal-contact.ts` — the reveal endpoint
- `api/src/cosmos/rate-limit-repository.ts` — `consumeStrict` (fail-closed) vs `consume` (fail-open)
- `admin-web/src/components/orders/ContactReveal.tsx` — client-side reveal + 60s auto-remask
- `docs/stories/E09-S08-pii-safe-phones.md`
- `docs/threat-model.md` — Addendum 2026-09-08 (contact-data inventory and residuals)
- `docs/runbook.md` — "Contact reveal (E09-S08)"
