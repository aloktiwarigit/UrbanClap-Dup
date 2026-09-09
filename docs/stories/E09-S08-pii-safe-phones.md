# E09-S08: PII-safe phones + audited reveal

**Goal:** Admin sees both the technician and the customer phone number on a booking (owner
requirement R2), masked by default everywhere — list, drawer, CSV export — with a role-gated,
rate-limited, audit-logged reveal for the full number. No raw phone number leaves the API except
in the `reveal-contact` response body.

## Owner requirement

**R2:** "Admin sees technician + customer phone on a booking." Before this story, admin orders
carried the customer's full phone number unmasked in the list, the detail drawer, and the CSV
export, and carried no technician phone number at all — R2 was unmet for the technician side and
over-satisfied (with no access control) for the customer side.

## Acceptance (story-level)

1. `maskPhone` and `maskVpa` are declared in exactly one source file
   (`api/src/lib/pii/mask.ts`) — a guard test fails the build if either is re-declared anywhere
   else. `maskPhone('+919876543210')` → `'+91 XXXXX-X3210'`; any phone shorter than four
   characters after trimming → `MASK_PLACEHOLDER` (`'••••••••••'`). `maskVpa` keeps the PSP suffix
   readable and returns the placeholder for any VPA without exactly one `@`.
2. Every admin orders response (`queryOrders`, `getOrderById`) is masked at one serialization
   boundary (`hydrateOrders` in `api/src/cosmos/orders-repository.ts`). `customerPhone` is always
   masked. `technicianPhoneMasked` is a new **optional** field, present only when the assigned
   technician has a resolvable phone number. `customerName` is also masked when it falls back to
   the customer's phone number (no display name on file) — this matters because the CSV export
   writes `customerName` as its own column, and an unmasked fallback there would re-leak the
   number.
3. The CSV export (`admin-web/src/components/orders/exportCsv.ts`) emits a "Technician Phone"
   column, leaves the cell empty when no technician number is on file, and never emits an
   unmasked ten-digit number anywhere in the file.
4. `POST /v1/admin/orders/{id}/reveal-contact` resolves the full number fresh from Firebase Auth
   on every call (never from a cached response), returns it with `Cache-Control: no-store`, and
   is reachable only by `super-admin` and `ops-manager` (403 for `finance` and `support-agent`).
5. The endpoint is rate-limited to 30 reveals/minute/admin via `consumeStrict`, which **fails
   closed** (`503 RATE_LIMIT_UNAVAILABLE`) if the rate-limit store is unreachable, unlike the
   shared `consume()` helper (fail-open) used elsewhere in the API.
6. Every successful reveal writes a `PII_CONTACT_REVEALED` audit entry carrying `party`,
   `subjectId`, the **masked** number, and the last four digits — never the full number, because
   `audit_log` is readable by any role holding `audit.read`. A phone that masks to the placeholder
   (under four characters) writes `phoneLast4: ''`, never a slice of the raw value.
7. Technician-uid resolution is deterministic under `getTechniciansByIds`' unordered cross-key
   match (a booking's `technicianId` may match either a document's `id` or its `technicianId`
   field): an exact `id` match wins outright; otherwise a unique `technicianId` match is accepted;
   anything ambiguous or absent resolves to `404 PARTY_NOT_AVAILABLE` rather than guessing.
8. `ContactReveal` (admin-web) shows the masked number at rest, a labelled "Show number" control
   (not an icon-only eye), reveals the full number for 60 seconds with a live "Hide now · Ns"
   countdown/manual-hide control, states inline that the reveal was recorded in the audit log,
   and renders 403/429/other-failure states inline (not as a toast) — with no confirmation dialog,
   since the audit log is the accountability mechanism.
9. `orders.revealContact` is a capability granted to `super-admin` and `ops-manager` only; the
   reveal control does not render for a role that lacks it.
10. `admin-web/messages/en.json` and `admin-web/messages/hi.json` hold 471 keys each in exact key
    parity, with the PII-reveal copy translated into Devanagari rather than copied across from
    English, pinned against the real message files (not a mock) in
    `admin-web/tests/i18n/pii-copy.test.ts`.

## Endpoint contract

`POST /v1/admin/orders/{id}/reveal-contact`

**Request body:**

```json
{ "party": "CUSTOMER" }
```

`party` is `'CUSTOMER' | 'TECHNICIAN'`. The body schema is `.strict()` — an unexpected extra key
returns `422`.

**Success response (`200`):**

```json
{ "party": "CUSTOMER", "phone": "+919876543210", "revealedAt": "2026-09-08T10:15:00.000Z" }
```

Headers: `Cache-Control: no-store`.

**Status codes:**

| Status | Code | Meaning |
|---|---|---|
| 200 | — | Full number returned; reveal audit-logged. |
| 401 | `UNAUTHENTICATED` / `TOKEN_INVALID` / `SESSION_EXPIRED` | No valid admin session (`requireAdmin`). |
| 403 | `FORBIDDEN` | Authenticated, but role is not `super-admin` or `ops-manager`. |
| 404 | `ORDER_NOT_FOUND` | No order with the given id. |
| 404 | `PARTY_NOT_AVAILABLE` | No technician assigned, or technician-uid resolution was ambiguous and refused to guess. |
| 404 | `PHONE_UNAVAILABLE` | The subject genuinely has no `phoneNumber` on their Firebase Auth user. |
| 422 | `VALIDATION_ERROR` | Malformed or non-JSON body, unknown `party`, or an unexpected extra key. |
| 429 | `RATE_LIMITED` | The admin's 30/min budget is spent. `Retry-After` header + `retryAfterMs` in the body. |
| 502 | `CONTACT_LOOKUP_FAILED` | Firebase Auth lookup threw (reported to Sentry). |
| 503 | `RATE_LIMIT_UNAVAILABLE` | The rate-limit store itself is unreachable; the endpoint fails closed by design. |

## RBAC matrix

| Role | `orders.read` (masked) | `orders.revealContact` (full number) |
|---|---|---|
| `super-admin` | ✅ | ✅ |
| `ops-manager` | ✅ | ✅ |
| `finance` | ✅ | ❌ (403) |
| `support-agent` | ❌ (no `orders.read`) | ❌ (403) |

## Links

- Plan: `plans/E09-S08-pii-safe-phones.md`
- Spec: `C:/Users/alokt/.claude/plans/validated-frolicking-mochi.md` §6 (E09-S08 row), §7.11, §8
- ADR: `docs/adr/0034-pii-masking-default-and-audited-reveal.md`
- Threat model: `docs/threat-model.md` — Addendum 2026-09-08
- Runbook: `docs/runbook.md` — "Contact reveal (E09-S08)"
