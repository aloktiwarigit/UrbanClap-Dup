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
  to `audit_log` carrying `party`, a one-way `subjectRef` (SHA-256 of the subject id, truncated to
  16 hex characters — never the raw subject id itself), the **masked** number, and the last four
  digits — never the full number and never a raw subject identifier. `subjectId` (`order
  .customerId` for customers, the technician's Firebase uid for technicians) is not itself
  guaranteed non-PII: customer Firebase UIDs are minted as `createCustomToken(phoneNumber)` (see
  `api/src/functions/auth/truecaller-verify.ts`, `TODO(E11-S01b)`), so for every
  Truecaller-onboarded customer the raw subject id literally IS their phone number. `audit_log` is
  readable by any role holding `audit.read` (broader than the two roles allowed to reveal), so
  writing that value into the audit payload would defeat the masking this ADR exists to establish.
  A breach investigator can still correlate a `subjectRef` back to a candidate id by hashing that
  candidate the same way and comparing — the standard one-way-correlation pattern.
- **Client re-masks itself.** The admin-web `ContactReveal` component holds the revealed number in
  component state only (never in a store, never in a URL), starts a 60-second countdown on reveal,
  and re-masks automatically when it elapses or when the operator clicks "Hide now" early.

## Update 2026-09-09 — denial auditing, daily cap, and authorize-in-handler

Two of this ADR's own accepted negatives — "denied and failed reveal attempts are not audited"
and "no daily cap" (below, and `docs/threat-model.md` I-PII3/I-PII4) — are closed.

- **Every non-200 outcome that reached an identified admin is now audited**, not just successes.
  `PII_CONTACT_REVEAL_DENIED` (added to `AuditAction`) is written by a new `auditDenied()` helper
  for reason `FORBIDDEN`, `RATE_LIMITED`, `RATE_LIMITED_DAILY`, `NOT_FOUND` (covers
  `ORDER_NOT_FOUND`, `PARTY_NOT_AVAILABLE`, and `PHONE_UNAVAILABLE`), `LOOKUP_FAILED`, or
  `RATE_LIMIT_UNAVAILABLE`, with payload `{ party?, subjectRef?, reason }` — `subjectRef` included
  only when a subject was actually resolved, `party` included whenever it is known at the point of
  denial, never a raw id or a raw phone. It deliberately calls `auditLog()` (which swallows its own
  write failure to Sentry), not `appendAuditEntry()` (which the success path still uses and
  deliberately does not swallow): a lost denial-audit row is a monitoring gap, not a security
  incident, and must never turn an otherwise-correct 403/404/429 into a 500. A lost *success* audit
  must still fail closed, because a silently-unaudited disclosure is exactly the failure mode this
  whole ADR exists to prevent — hence the asymmetry between the two audit calls is deliberate, not
  an oversight.
- **A second daily budget closes the volume gap.** `consumeStrict` now also gates
  `rl:pii-reveal-day:${adminId}` at capacity 50, refilling `50/86400` per second — a token bucket
  at that refill rate approximates a rolling 24h window (it never hard-resets at midnight) rather
  than implementing a literal calendar-day reset, the same approximation the per-minute budget
  already makes. Checked after the per-minute budget on every attempt. Sizing: production has had
  11 completed bookings in the product's entire history; the pilot ceiling is 5,000 bookings/month
  ≈ 167/day; a single dispute may reasonably need two reveals (customer + technician). 50/day is
  ~30% of all bookings at the *planned* pilot ceiling — generous for a legitimately busy dispute
  day, while turning bulk exfiltration into a months-long operation that now writes one queryable
  `PII_CONTACT_REVEAL_DENIED` row per attempt once the cap bites. This is explicitly a detection
  mechanism, not an alerting one: **there is no alerting layer in this environment**
  (`func-homeservices-prod` has no `SENTRY_DSN`, and `rg-homeservices-prod` has no Azure
  metric-alert rules, scheduled-query rules, or action groups), so cap-hits become queryable rather
  than paged — see `docs/runbook.md` → "Contact reveal (E09-S08)".
- **Authorization moved from `requireAdmin` middleware into the handler — a deliberate, mitigated
  reduction in defence in depth.** Auditing a FORBIDDEN denial requires the denying admin's
  identity, but `requireAdmin(['super-admin','ops-manager'])` rejects an unauthorized caller
  before an `AdminContext` (and therefore an `adminId`) ever reaches the handler — there is no one
  to attribute the row to. The endpoint is now registered as `requireAdmin(ALL_ADMIN_ROLES)` (every
  authenticated admin, of any role, reaches `revealContactHandler`), and the handler itself rejects
  any role that is not `super-admin`/`ops-manager` as the *first* thing it does — before parsing
  the body, before touching the rate limiter, before any Cosmos/Firebase I/O. The 403 response is
  unchanged byte-for-byte (`{ code: 'FORBIDDEN', requiredRoles: ['super-admin', 'ops-manager'] }`).
  This is a real trade-off: a bug in this one handler's role check is no longer backstopped by
  middleware rejecting the request before the handler runs at all. Mitigated two ways: (1)
  `PII_REVEAL_ALLOWED_ROLES` is a single exported const used for both the check and the
  `requiredRoles` body field, so the two cannot silently drift; (2) the pre-existing composed-handler
  RBAC test in `reveal-contact.test.ts` — which asserts 403 for `finance`/`support-agent` and
  non-403 for `super-admin`/`ops-manager` against the actual registered handler — was verified to
  still pass unchanged, proving the net access-control behaviour is identical even though the layer
  enforcing it moved. Tracked as `docs/threat-model.md` I-PII8.

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
- **~~Negative: denied and failed reveal attempts are not audited~~ — closed 2026-09-09.** See
  "Update 2026-09-09" above: every non-200 outcome that reached an identified admin now writes a
  `PII_CONTACT_REVEAL_DENIED` row.
- **~~Neutral: 30 reveals/minute/admin is 43,200/day with no daily cap~~ — closed 2026-09-09.** See
  "Update 2026-09-09" above: a second 50/rolling-24h budget now caps every admin regardless of the
  per-minute rate. Volume alerting (paging someone automatically) remains explicitly out of scope
  for this pilot environment, which has no Sentry DSN and no Azure alert rules configured — cap
  hits are queryable via the audit log, not pushed to anyone.

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
