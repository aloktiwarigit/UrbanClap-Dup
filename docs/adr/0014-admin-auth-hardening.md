# ADR-0014 — Admin Auth Hardening (TOTP TOFU race, role escalation, Bearer parse coverage)

**Status:** Accepted
**Date:** 2026-04-27
**Deciders:** Alok Tiwari
**Related:** threat-model.md § Addendum 2026-04-26, closes audit findings #81, #86, #87

---

## Context

Three findings from the 2026-04-26 threat-model addendum required fixes before the pilot launch:

**E-A1 — TOTP setup TOFU (Trust On First Use) race (#81)**
The TOTP setup endpoint was open to any caller with the URL. On a solo-owner system the legitimate owner *is* the sole admin; if an attacker reaches the setup endpoint first they enroll their TOTP device and permanently lock the owner out. The window exists between first deploy and the owner completing enrollment — narrow but launch-blocking.

**E-A2 — updateAdminUser role escalation (#87)**
The admin user patch endpoint accepted a `role` field without checking whether the caller had the right to change roles. Any authenticated admin (even `ops-manager`) could promote themselves to `super-admin`.

**Test gap #86 — verifyTechnicianToken untested**
The Bearer token parsing in `verifyTechnicianToken.ts` — the entry point for all 19 technician endpoints — had zero direct unit tests. Edge cases (empty token, lowercase `bearer`, tab separator) were not pinned, making regressions invisible.

## Decision

### TOTP setup guard (AC-1)

Add an opt-in `ADMIN_SETUP_SECRET` env-var guard to both `setupTotpGetHandler` and `setupTotpPostHandler`:

- If `ADMIN_SETUP_SECRET` is set in the Azure Functions environment, requests must include `X-Setup-Secret: <value>` header matching the env var exactly. Wrong or missing header → `403 SETUP_SECRET_REQUIRED`.
- If `ADMIN_SETUP_SECRET` is **not** set, the endpoint behaves as before (open setup). A `console.warn` fires at module load to alert the operator.
- This is backward-compatible: existing deployments without the env var are unaffected.

### Role ceiling check (AC-2)

Add a dedicated `PATCH /v1/admin/users/{adminId}` endpoint with the ceiling check in the HTTP handler layer (not the service layer):

- If the request body contains a `role` field and the caller's role is not `super-admin` → `403 INSUFFICIENT_ROLE_FOR_ROLE_CHANGE`.
- If the request body has no `role` field, any admin role may update the allowed non-role fields.
- Policy is enforced in the handler, not in `adminUser.service.ts`, which remains a role-agnostic shared helper.

### Bearer parse tests (AC-3)

Add 7 direct unit tests for `verifyTechnicianToken` pinning the actual behavior of `replace('Bearer ', '')`:

- Empty header → throws (pre-Firebase).
- Non-Bearer header (e.g. `Basic xyz`) → full header passed to Firebase → Firebase rejects.
- `Bearer ` with empty suffix → throws (pre-Firebase).
- Lowercase `bearer` prefix → full header passed to Firebase → Firebase rejects. **Security note in test:** this relies on Firebase rejection not parse-layer rejection; worth hardening in a follow-up PR.
- Tab separator (`Bearer\txyz`) → similar to lowercase case.
- Firebase rejection on valid-format token → throws.
- Valid token → returns `{ uid }`.

Behavior is **pinned, not changed** in this PR. Hardening the parse layer is deferred to avoid changing the contract for 19 active handlers in this PR.

## Consequences

**Operators must:**
- Set `ADMIN_SETUP_SECRET` in Azure Functions Application Settings before the first production deploy (see `docs/runbook.md § Admin setup procedure`).
- Share the secret value only with the legitimate owner (Alok).
- After TOTP enrollment is complete, the secret may be rotated or removed — the endpoint will revert to open mode if unset.

**Future PRs:**
- Harden `verifyTechnicianToken` Bearer parse to use `startsWith('Bearer ')` + explicit slice, eliminating the case-sensitivity and separator edge cases (#86 follow-up).
- Consider rate-limiting and audit-logging failed `X-Setup-Secret` attempts to prevent brute force (noted in AC-5 security review).
