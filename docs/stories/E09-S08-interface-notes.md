# E09-S08 — PII-safe phones: interface notes and rulings

Extracted from the E09-S08 SDD decision ledger
(`wt-e09-s08/.superpowers/sdd/E09-S08-pii-safe-phones/progress.md`, git-ignored) so the
decisions a later story could get wrong survive the worktree.

Source of truth for the design itself: `docs/adr/0034-pii-masking-default-and-audited-reveal.md`,
`docs/stories/E09-S08-pii-safe-phones.md`, `docs/runbook.md` → "Contact reveal (E09-S08)", and
`docs/threat-model.md` → the 2026-09-08 addendum (I-PII1..8).

**This file is deliberately short.** The ledger holds 20 rulings; most are now encoded in merged
code that reads correctly on its own. Extracted here are only the four where **the code alone
would mislead** — an invariant a future writer would violate innocently, a boundary that looks
arbitrary but is not, or a rejected alternative that will look attractive again.

Related: `docs/reviews/codex-20260908-2101.md`, `…-round2.md`, `codex-20260909-0815-round3.md`,
`…-0838-round4.md`.

---

## 1. `maskVpa` — the readable PSP suffix is deliberate, and short handles are masked whole

**E24-S01 is the first consumer** (`technicianUpiMasked`). `api/src/lib/pii/mask.ts`:

```
maskVpa('alok.tiwari@okhdfcbank')  ->  'al••••••@okhdfcbank'
maskVpa('ab@ybl')                  ->  '••••••••@ybl'
maskVpa('alok@secret.handle@okaxis') -> '••••••••••'   (placeholder — not exactly one '@')
```

Two things look like bugs and are not:

- **The PSP suffix (`@okhdfcbank`) is kept in clear on purpose.** It is not personal data, and an
  admin needs it to tell which bank app a technician uses. Do not "fix" this by masking it.
- **A handle shorter than 3 characters is masked entirely**, rather than keeping its first two.
  Keeping "two leading characters" of a two-character handle reveals the whole handle, which
  defeats the mask. The threshold is the point, not an off-by-one.

**Anything without exactly one `@` returns `MASK_PLACEHOLDER`.** This is load-bearing: an earlier
implementation used `indexOf('@')` and emitted everything after the first separator verbatim, so
`alok@secret.handle@okaxis` leaked a whole segment in clear. Do not reintroduce `indexOf`.

`maskPhone` and `maskVpa` both **trim before measuring**, because stored Cosmos values can be
padded — an untrimmed `'9876543210  '` masked to `'+91 XXXXX-X10  '`, exposing two digits.

There must be exactly one implementation of each. `api/tests/lib/pii/mask.test.ts` contains a
guard test that walks `src/` and fails the build if `maskPhone` is declared anywhere but
`src/lib/pii/mask.ts`. It matches `function maskPhone` and `const maskPhone =` only — a `let`,
arrow, class method or re-export would slip past it.

## 2. A booking's `technicianId` may be either of two fields; the Firebase uid is always `id`

`getTechniciansByIds` (`api/src/cosmos/technician-repository.ts`) matches
`ARRAY_CONTAINS(@ids, c.id) OR ARRAY_CONTAINS(@ids, c.technicianId)` **with no `ORDER BY`**. So for
one input `X` it can legitimately return two documents: `{id:'X'}` and `{id:'Y', technicianId:'X'}`.

**This defect appeared twice in one story, in two different files, and once survived an explicit
adversarial review that cleared it as sound.** Assume a third site will get it wrong.

- `techs[0]` is never safe. `reveal-contact.ts` prefers an exact `t.id === technicianId` match,
  accepts a `t.technicianId === technicianId` match **only when unique**, and otherwise refuses to
  guess (→ `404 PARTY_NOT_AVAILABLE`). On a PII-disclosure path, guessing returns an unrelated
  person's phone number and audits it as if correct.
- Registering a contact under both keys in one pass is **also** unsafe: the alias write
  `contacts.set(tech.technicianId, contact)` can clobber the exact entry written from the other
  document. `orders-repository.ts`'s `fetchTechnicianContacts` therefore writes **all alias entries
  first, then all exact `id` entries**, so an exact match always wins regardless of document order.
- The Firebase Auth uid is always the document `id`, never `technicianId`. Resolve through the
  repository first; never pass a booking's `technicianId` straight to `auth().getUsers`.

## 3. The reveal endpoint authorizes in the handler, not in `requireAdmin` — do not "tighten" it back

`adminRevealOrderContact` is registered as `requireAdmin(ALL_ADMIN_ROLES)(handler)`, and the handler
rejects any role outside `PII_REVEAL_ALLOWED_ROLES` as its first act. That looks like a mistake and
is not.

`requireAdmin(['super-admin','ops-manager'])` rejects a `finance` caller **inside the middleware**,
before the handler runs — so there is no `adminId`, and a denied reveal cannot be audited. Since
denial auditing is a requirement (reveal reconnaissance must leave a trace), authorization has to
happen where the identity is known.

Changing the registration back to the narrow role list silently disables `PII_CONTACT_REVEAL_DENIED`
for the `FORBIDDEN` case. If you do it, the RBAC tests still pass — they assert a 403, which you
would still return.

Mitigations already in place, preserve them: the 403 body is byte-identical to `requireAdmin`'s,
and `PII_REVEAL_ALLOWED_ROLES` is a single exported const feeding both the check and the
`requiredRoles` payload so they cannot drift.

## 4. Success audits fail closed; denial audits fail open. The asymmetry is intentional

- **Success** uses `appendAuditEntry`, which throws. A failed audit write 500s the request *before*
  any phone number reaches the response body. A reveal that is not recorded must not happen.
- **Denial** uses the `auditLog()` service, which swallows to Sentry. A failed audit write must not
  turn a 403 or 429 into a 500.

Making these consistent in either direction is a regression: fail-open on success permits unlogged
disclosure; fail-closed on denial converts a correct rejection into a server error.

Related: the reveal endpoint's rate limiting uses `consumeStrict` (fails **closed**, `503
RATE_LIMIT_UNAVAILABLE`), not the shared `consume` (fails **open**). Fail-open is right for the
location endpoint it was written for and wrong for PII disclosure — a limiter that silently
disables itself under Cosmos throttling makes the endpoint unlimited with no caller-visible signal.

---

## Not extracted, and where to find it instead

The 50/day cap arithmetic, the decision not to build anomaly alerting, the DPDP residuals, and the
operator error-code table are all in `docs/adr/0034-*.md`, `docs/threat-model.md` and
`docs/runbook.md`. The read-path-widen rule (`technicianPhoneMasked` is optional forever) is a
repo-wide invariant carried in the schema's own comment. The technician phone's absence from the
orders table is deliberate per spec §7.11 and is recorded in `docs/stories/E09-S08-pii-safe-phones.md`.
