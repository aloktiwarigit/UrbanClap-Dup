# E09-S08 — PII-Safe Phones + Audited Reveal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin sees both the technician and the customer phone on a booking, masked by default everywhere (list, drawer, CSV), with a role-gated, rate-limited, audit-logged reveal for the full number.

**Architecture:** One masking module (`api/src/lib/pii/mask.ts`) owns `maskPhone`/`maskVpa`; the two existing per-call-site copies are deleted and re-pointed at it. Masking happens at exactly one serialization boundary in `orders-repository.ts` — inside `hydrateOrders`, after all raw-value logic is finished — so no admin orders response can carry a raw number. `technicianPhoneMasked` is a new **optional** read-path field (widen only). The full number is reachable only through `POST /v1/admin/orders/{id}/reveal-contact`, which resolves the raw number fresh from Firebase Auth / Cosmos, never from a cached response. On the client, a single `ContactReveal` component holds the reveal state, the 60-second auto-remask timer, and every error state.

**Tech Stack:** Node 22 + TypeScript + Azure Functions + Zod + `@asteasolutions/zod-to-openapi` + Cosmos DB (api); Next.js 15 + React + next-intl + Tailwind/D1 CSS custom properties (admin-web); Vitest both sides.

**Spec:** `C:/Users/alokt/.claude/plans/validated-frolicking-mochi.md` — §6 "E09-S08" row, §7.11, §8 (RBAC, audit enum, ADR 0034).

**Tier:** Feature. **Worktree:** `C:/Alok/Business Projects/wt-e09-s08`, branch `feat/e09-s08-pii-phones` off `origin/main` @ `7e3fdef4`.

---

## Global Constraints

Every task's requirements implicitly include this section.

1. **Read-path schemas only widen.** `technicianPhoneMasked` is `.optional()`. Do **not** make any existing optional field required, and do not add new required fields to `OrderSchema`. A 2026-09-05 production outage came from tightening a read-path schema against stored data. (`~/.claude/memory/feedback_read_path_validation.md`)
2. **No raw phone number leaves the API except in the `reveal-contact` response body.** Not in list, not in detail, not in CSV, not in an audit-log payload, not in a Sentry breadcrumb, not in a log line.
3. **Every user-facing string goes through next-intl** into **both** `admin-web/messages/en.json` and `admin-web/messages/hi.json`, with real Hindi (not English copied across). `hi` is the **default** locale. Both files currently hold exactly 457 keys and are in perfect parity — Task 8 adds a test that keeps them that way.
4. **Mocking next-intl proves nothing about key existence.** Load-bearing copy is pinned against the real `messages/en.json` and `messages/hi.json` in `admin-web/tests/i18n/`. (`~/.claude/memory/feedback_i18n_mock_blindspot.md`)
5. **TDD:** the test file is committed before the implementation file, in a separate commit, with the test failing for the stated reason.
6. **UI:** follow `admin-web/DESIGN.md`. No new colour / type / radius / spacing tokens — use the existing `--color-*` semantic custom properties. No nested cards. Focus rings use `--color-focus-ring`, never marigold. Radii limited to `2px`, `4px`, `6px`, `999px`. Spacing on the 4px grid. Motion: `120ms` press/hover, `220ms` standard; respect `prefers-reduced-motion`.
7. **Never `--no-verify`.** If a hook fails, fix the cause.
8. **OpenAPI:** never hand-edit `api/openapi.json`. Regenerate with `pnpm run openapi:build` and commit the result (Task 9). Another lane is editing the same file.
9. **Shared files with the parallel lane:** on a conflict in `admin-web/messages/*.json`, keep **both** sides' keys and keep the en/hi key sets identical. Do not touch anything under `api/src/services/commission-*` or `api/src/functions/admin/finance/`.
10. **Commands** run from the worktree root unless a task says otherwise. `pnpm` is the package manager; both `api/node_modules` and `admin-web/node_modules` are already installed in this worktree.

---

## Design Direction (reviewed before any UI code)

Reference contract: `admin-web/DESIGN.md` (D1, dark-default, editorial command-center). The visual identity is fixed and not up for reinvention; the design work here is the **interaction** design of withholding and releasing a phone number. Decisions, and why they are not the generic default:

- **The masked number is the resting state and must read as a deliberate control, not as broken data.** Rendered `+91 XXXXX-X4821` in `--font-mono` with tabular numerals — the real last four digits are kept because they are what the operator matches against their own call log. This reuses the table's existing numeric idiom rather than introducing a new "redacted" treatment.
- **The affordance is a labelled inline text button, not an icon-only eye.** An eye icon is the generic default and is ambiguous (show password? preview?). The control says what happens: **"Show number"**.
- **No modal and no confirmation dialog.** The audit log is the accountability mechanism; a confirm step would be friction theatre for an operator who does this many times a day. Instead, while revealed, one quiet line states the fact plainly: *"Shown to you and recorded in the audit log."* It appears only while revealed.
- **The countdown is the state indicator.** Once revealed, the number becomes a `tel:` link and the control becomes **"Hide now · 47s"** — clickable to hide immediately. No badge, no toast, no second status element. This one self-reversing moment is where the design spends its boldness; everything around it stays flat.
- **Failure states carry direction, inline, replacing the control** — the operator's eye is already on that row, so a corner toast would be the wrong place. 403 → "Your role can't reveal contact numbers." 429 → "Too many reveals. Try again in {seconds}s." Network/500 → "Couldn't reveal the number. Try again." Rendered in `--color-danger`.
- **Motion:** a 120ms opacity crossfade on the number only, on a user-triggered change. No slide, no scale, no entrance animation. Countdown ticks are plain text updates. Under `prefers-reduced-motion` the crossfade is dropped.
- **In the table, the control stays quiet.** It renders at `--color-text-faint` and lifts to `--color-text-muted` on hover/focus. It is always in the DOM (never hover-only) so keyboard and touch reach it. The technician phone is drawer-and-CSV only — no new table column, so the 50-row grid stays calm.

---

## File Structure

**api — create**
- `api/src/lib/pii/mask.ts` — the only phone/VPA masking in the codebase. Pure, no I/O.
- `api/src/schemas/order-reveal.ts` — `RevealContactBodySchema`, `RevealContactResponseSchema`.
- `api/src/functions/admin/orders/reveal-contact.ts` — handler + `app.http` registration.
- `api/tests/lib/pii/mask.test.ts`
- `api/tests/functions/admin/orders/reveal-contact.test.ts`

**api — modify**
- `api/src/schemas/order.ts` — add `technicianPhoneMasked: z.string().optional()`.
- `api/src/cosmos/orders-repository.ts` — `fetchTechnicianContacts`, mask at the single boundary in `hydrateOrders`.
- `api/src/functions/admin/customers/list.ts` — delete local `maskPhone`, import the shared one.
- `api/src/functions/admin/technicians/list.ts` — same.
- `api/src/types/admin.ts` — add `'PII_CONTACT_REVEALED'` to `AuditAction`.
- `api/src/openapi/registry.ts` — register the reveal path.
- `api/openapi.json` — regenerated, never hand-edited.
- `api/tests/cosmos/orders-repository.test.ts` — expectations move to masked values.

**admin-web — create**
- `admin-web/src/components/orders/ContactReveal.tsx` — the whole reveal interaction.
- `admin-web/tests/components/orders/ContactReveal.test.tsx`
- `admin-web/tests/i18n/pii-copy.test.ts` — pins copy + global en/hi parity against the real message files.

**admin-web — modify**
- `admin-web/src/types/order.ts` — `technicianPhoneMasked?: string`, reveal request/response types.
- `admin-web/src/api/orders.ts` — `revealOrderContact`.
- `admin-web/src/admin/capabilities.ts` — `orders.revealContact`.
- `admin-web/src/components/orders/CustomerCell.tsx` — masked phone + reveal control.
- `admin-web/src/components/orders/OrdersTable.tsx` — pass `orderId` / `canReveal` down.
- `admin-web/src/components/orders/OrdersClient.tsx` — compute `canReveal`, pass to table + drawer.
- `admin-web/src/components/orders/OrderSlideOver.tsx` — reveal for both parties.
- `admin-web/src/components/orders/exportCsv.ts` — technician phone column.
- `admin-web/messages/en.json`, `admin-web/messages/hi.json`.

**docs**
- `docs/adr/0034-pii-masking-default-and-audited-reveal.md`
- `docs/stories/E09-S08-pii-safe-phones.md`
- `docs/threat-model.md`, `docs/runbook.md` — appended sections.

---

### Task 1: The single masking module

**Files:**
- Create: `api/src/lib/pii/mask.ts`
- Test: `api/tests/lib/pii/mask.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `maskPhone(phone: string | null | undefined): string`, `maskVpa(vpa: string | null | undefined): string`, and `MASK_PLACEHOLDER: string` (the value `'••••••••••'`). Tasks 2, 3, 4 import these.

The output format `+91 XXXXX-X1234` is **copied exactly** from the two existing duplicate helpers so that Task 4 is a pure de-duplication with no behaviour change. Both functions return a fixed-width mask so the output never leaks the input's length.

- [ ] **Step 1: Write the failing test**

Create `api/tests/lib/pii/mask.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { maskPhone, maskVpa, MASK_PLACEHOLDER } from '../../../src/lib/pii/mask.js';

describe('maskPhone', () => {
  it('keeps the last four digits of an E.164 number', () => {
    expect(maskPhone('+919876543210')).toBe('+91 XXXXX-X3210');
  });

  it('keeps the last four digits of a bare ten-digit number', () => {
    expect(maskPhone('9999999999')).toBe('+91 XXXXX-X9999');
  });

  it('returns the placeholder for an empty string', () => {
    expect(maskPhone('')).toBe(MASK_PLACEHOLDER);
  });

  it('returns the placeholder for null and undefined', () => {
    expect(maskPhone(null)).toBe(MASK_PLACEHOLDER);
    expect(maskPhone(undefined)).toBe(MASK_PLACEHOLDER);
  });

  it('returns the placeholder for a number shorter than four digits', () => {
    expect(maskPhone('123')).toBe(MASK_PLACEHOLDER);
  });

  it('never contains any digit other than the last four of the input', () => {
    const masked = maskPhone('+919876543210');
    expect(masked).not.toContain('98765');
    expect(masked).not.toContain('432');
  });
});

describe('maskVpa', () => {
  it('keeps the first two handle characters and the whole PSP suffix', () => {
    expect(maskVpa('alok.tiwari@okhdfcbank')).toBe('al••••••@okhdfcbank');
  });

  it('uses a fixed-width mask so handle length does not leak', () => {
    expect(maskVpa('ab@ybl')).toBe('ab••••••@ybl');
    expect(maskVpa('abcdefghijklmnop@ybl')).toBe('ab••••••@ybl');
  });

  it('masks the whole handle when it is shorter than three characters', () => {
    expect(maskVpa('a@ybl')).toBe('••••••••@ybl');
  });

  it('returns the placeholder when there is no @ separator', () => {
    expect(maskVpa('notavpa')).toBe(MASK_PLACEHOLDER);
  });

  it('returns the placeholder for empty, null and undefined', () => {
    expect(maskVpa('')).toBe(MASK_PLACEHOLDER);
    expect(maskVpa(null)).toBe(MASK_PLACEHOLDER);
    expect(maskVpa(undefined)).toBe(MASK_PLACEHOLDER);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd api && ./node_modules/.bin/vitest run tests/lib/pii/mask.test.ts
```

Expected: FAIL — `Failed to resolve import "../../../src/lib/pii/mask.js"`.

- [ ] **Step 3: Write the implementation**

Create `api/src/lib/pii/mask.ts`:

```ts
/**
 * The single source of PII masking for the API.
 *
 * Every surface that renders a phone number or a UPI VPA to an admin — order
 * lists, order details, CSV exports, technician and customer rosters — goes
 * through here. The only path that may emit an unmasked value is
 * POST /v1/admin/orders/{id}/reveal-contact, which is role-gated,
 * rate-limited and audit-logged (ADR 0034).
 *
 * Both functions return a fixed-width mask so the output never leaks the
 * length of the input.
 */

/** Rendered when there is nothing safe to show. */
export const MASK_PLACEHOLDER = '••••••••••';

/** Fixed-width bullet run used inside a masked VPA handle. */
const VPA_HANDLE_MASK = '••••••';

/**
 * `+919876543210` -> `+91 XXXXX-X3210`
 *
 * The last four digits are kept deliberately: they are what an operator
 * matches against their own call log, and four digits alone do not identify
 * a person. Anything shorter than four characters is masked entirely.
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || phone.length < 4) return MASK_PLACEHOLDER;
  return `+91 XXXXX-X${phone.slice(-4)}`;
}

/**
 * `alok.tiwari@okhdfcbank` -> `al••••••@okhdfcbank`
 *
 * The PSP suffix is not personal data and is kept in full so an admin can
 * confirm which bank app the technician uses. The handle keeps two leading
 * characters for recognition; handles shorter than three characters are
 * masked entirely rather than being reduced to a near-plaintext hint.
 */
export function maskVpa(vpa: string | null | undefined): string {
  if (!vpa) return MASK_PLACEHOLDER;
  const separator = vpa.indexOf('@');
  if (separator <= 0 || separator === vpa.length - 1) return MASK_PLACEHOLDER;

  const handle = vpa.slice(0, separator);
  const psp = vpa.slice(separator + 1);
  if (handle.length < 3) return `••••••••@${psp}`;
  return `${handle.slice(0, 2)}${VPA_HANDLE_MASK}@${psp}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd api && ./node_modules/.bin/vitest run tests/lib/pii/mask.test.ts
```

Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add api/tests/lib/pii/mask.test.ts
git commit -m "test(api): specify the single PII masking module for phones and VPAs"
git add api/src/lib/pii/mask.ts
git commit -m "feat(api): add api/src/lib/pii/mask.ts as the single PII masking module"
```

---

### Task 2: Mask order phones at the serialization boundary, add `technicianPhoneMasked`

**Files:**
- Modify: `api/src/schemas/order.ts:19-39`
- Modify: `api/src/cosmos/orders-repository.ts` (`fetchTechnicianNames` → `fetchTechnicianContacts`, `hydrateOrders`)
- Test: `api/tests/cosmos/orders-repository.test.ts` (existing — expectations change)

**Interfaces:**
- Consumes: `maskPhone`, `MASK_PLACEHOLDER` from Task 1.
- Produces: `Order.customerPhone` is now always a **masked** string; `Order.technicianPhoneMasked?: string` is present only when a technician is assigned and their number is resolvable. `queryOrders` and `getOrderById` keep their signatures.

Masking happens in `hydrateOrders` **after** the `order.customerPhone || customerProfile?.phoneNumber` fallback has run on raw values, and `hydrateOrders` is the last thing both `queryOrders` and `getOrderById` do. `toAdminOrder` keeps parsing the raw stored value so the fallback still works; it is never returned to a caller directly.

`filters.customerPhone` in `buildWhereClause` compares against the **stored raw** `c.customerPhone` in Cosmos and is untouched — searching by full phone number still works, and the search term never appears in a response.

The technician's number lives in Firebase Auth, not in the Cosmos `technicians` doc (confirmed: `technician-repository.ts` has no phone field; `admin/technicians/list.ts` reads it from `auth().getUsers`). A booking's `technicianId` may be either the doc `id` or the doc's `technicianId` field, so contacts are keyed under both, exactly as `fetchTechnicianNames` already does for names.

- [ ] **Step 1: Write the failing tests**

In `api/tests/cosmos/orders-repository.test.ts`, add a new `describe` block at the end of the file:

```ts
describe('PII masking at the orders serialization boundary', () => {
  it('masks customerPhone in queryOrders output', async () => {
    const result = await queryOrders({ page: 1, pageSize: 50 } as never);
    for (const order of result.items) {
      expect(order.customerPhone).not.toBe('9999999999');
      expect(order.customerPhone).toMatch(/^(\+91 XXXXX-X\d{4}|••••••••••)$/);
    }
  });

  it('masks customerPhone in getOrderById output', async () => {
    const order = await getOrderById('ord_1');
    expect(order?.customerPhone).toMatch(/^(\+91 XXXXX-X\d{4}|••••••••••)$/);
  });

  it('exposes technicianPhoneMasked when the technician has a number', async () => {
    const order = await getOrderById('ord_1');
    expect(order?.technicianPhoneMasked).toBe('+91 XXXXX-X4321');
  });

  it('omits technicianPhoneMasked when no technician is assigned', async () => {
    const order = await getOrderById('ord_unassigned');
    expect(order?.technicianPhoneMasked).toBeUndefined();
  });
});
```

Read the existing mocks at the top of that file first and extend them so that: `ord_1` has `technicianId: 'tech_1'`; the Firebase `auth().getUsers` mock returns `{ uid: 'tech_1', phoneNumber: '+919876544321' }` alongside the existing customer users; and an `ord_unassigned` fixture exists with no `technicianId`. Update any existing assertion in that file that expects a raw `customerPhone` to expect the masked form instead.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd api && ./node_modules/.bin/vitest run tests/cosmos/orders-repository.test.ts
```

Expected: FAIL — `expected '9999999999' to match /^(\+91 XXXXX-X\d{4}|••••••••••)$/`, and `technicianPhoneMasked` is `undefined`.

- [ ] **Step 3: Widen the schema**

In `api/src/schemas/order.ts`, inside `OrderSchema`, immediately after `technicianName`:

```ts
  technicianName: z.string().optional(),
  /**
   * Masked technician phone (ADR 0034). Optional and read-path only: absent
   * for unassigned bookings and for technicians whose number cannot be
   * resolved. Never widen this to a required field.
   */
  technicianPhoneMasked: z.string().optional(),
```

- [ ] **Step 4: Resolve technician contacts and mask at the boundary**

In `api/src/cosmos/orders-repository.ts`:

Add the import beside the existing ones:

```ts
import { maskPhone } from '../lib/pii/mask.js';
```

Replace `fetchTechnicianNames` with `fetchTechnicianContacts`:

```ts
interface TechnicianContact {
  displayName: string;
  phoneNumber?: string;
}

/**
 * Resolves display names from Cosmos and phone numbers from Firebase Auth.
 *
 * A booking's technicianId may hold either the technician document id or its
 * technicianId field, so every contact is registered under both keys. The
 * Firebase uid is always the document id (see admin/technicians/list.ts).
 */
async function fetchTechnicianContacts(
  technicianIds: string[],
): Promise<Map<string, TechnicianContact>> {
  const contacts = new Map<string, TechnicianContact>();
  if (technicianIds.length === 0) return contacts;

  let techs: Awaited<ReturnType<typeof getTechniciansByIds>> = [];
  try {
    techs = await getTechniciansByIds(technicianIds);
  } catch {
    return contacts;
  }

  const phones = new Map<string, string>();
  const uids = unique(techs.map((tech) => tech.id));
  if (uids.length > 0) {
    try {
      const auth = getFirebaseAdmin().auth();
      for (let index = 0; index < uids.length; index += 100) {
        const result = await auth.getUsers(uids.slice(index, index + 100).map((uid) => ({ uid })));
        for (const user of result.users) {
          if (user.phoneNumber) phones.set(user.uid, user.phoneNumber);
        }
      }
    } catch {
      // Firebase Auth metadata is best-effort; the roster still renders without it.
    }
  }

  for (const tech of techs) {
    const displayName = tech.displayName?.trim() || tech.name?.trim() || tech.technicianId || tech.id;
    const phoneNumber = tech.id ? phones.get(tech.id) : undefined;
    const contact: TechnicianContact = {
      displayName,
      ...(phoneNumber ? { phoneNumber } : {}),
    };
    if (tech.id) contacts.set(tech.id, contact);
    if (tech.technicianId) contacts.set(tech.technicianId, contact);
  }
  return contacts;
}
```

Replace the body of `hydrateOrders`:

```ts
/**
 * The single PII serialization boundary for admin orders (ADR 0034).
 *
 * Raw phone numbers are used above this line for fallback resolution and are
 * masked on the way out. queryOrders and getOrderById both end here, so no
 * admin orders response can carry an unmasked number. The full number is
 * reachable only via POST /v1/admin/orders/{id}/reveal-contact.
 */
async function hydrateOrders(orders: Order[]): Promise<Order[]> {
  if (orders.length === 0) return orders;

  const [serviceNames, technicianContacts, customerProfiles] = await Promise.all([
    fetchServiceNames(unique(orders.map((order) => order.serviceId))),
    fetchTechnicianContacts(unique(orders.map((order) => order.technicianId))),
    fetchCustomerProfiles(unique(orders.map((order) => order.customerId))),
  ]);

  return orders.map((order) => {
    const customerProfile = customerProfiles.get(order.customerId);
    const customerName = isGeneratedCustomerName(order.customerName, order.customerId)
      ? customerProfile?.displayName ?? customerProfile?.phoneNumber ?? order.customerName
      : order.customerName;

    const technicianContact = order.technicianId ? technicianContacts.get(order.technicianId) : undefined;
    const rawCustomerPhone = order.customerPhone || customerProfile?.phoneNumber || '';

    return OrderSchema.parse({
      ...order,
      customerName,
      customerPhone: maskPhone(rawCustomerPhone),
      serviceName: order.serviceName ?? (order.serviceId ? serviceNames.get(order.serviceId) : undefined),
      technicianName: order.technicianName ?? technicianContact?.displayName,
      ...(technicianContact?.phoneNumber
        ? { technicianPhoneMasked: maskPhone(technicianContact.phoneNumber) }
        : {}),
    });
  });
}
```

Note: `customerName` can still fall back to `customerProfile.phoneNumber` when a booking has no name — that is pre-existing behaviour on a display-name field and is out of this story's scope; Task 10 records it in the threat model as a known residual.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd api && ./node_modules/.bin/vitest run tests/cosmos/orders-repository.test.ts tests/functions/admin/orders
```

Expected: PASS. If `detail.test.ts` or `overrides.test.ts` assert a raw phone, update those expectations to the masked form — that is the intended behaviour change.

- [ ] **Step 6: Commit**

```bash
git add api/tests/cosmos/orders-repository.test.ts
git commit -m "test(api): pin masked customerPhone and technicianPhoneMasked on admin orders"
git add api/src/schemas/order.ts api/src/cosmos/orders-repository.ts api/tests/functions/admin/orders
git commit -m "feat(api): mask order phones at the serialization boundary, add technicianPhoneMasked"
```

---

### Task 3: The audited reveal endpoint

**Files:**
- Create: `api/src/schemas/order-reveal.ts`
- Create: `api/src/functions/admin/orders/reveal-contact.ts`
- Modify: `api/src/types/admin.ts` (add `'PII_CONTACT_REVEALED'` to `AuditAction`)
- Test: `api/tests/functions/admin/orders/reveal-contact.test.ts`

**Interfaces:**
- Consumes: `maskPhone`, `MASK_PLACEHOLDER` (Task 1); `getOrderById` (Task 2, masked output — used only for existence and party resolution, never as a phone source).
- Produces: `revealContactHandler(req, ctx, admin)`, `RevealContactBodySchema`, `RevealContactResponseSchema`. Task 6 registers the schemas in OpenAPI; Task 5 consumes the response shape.

Design notes that the implementer must not "simplify" away:

- **Rate limiting is done inside the handler**, not via `withRateLimit`. The spec requires 30/min **per admin**, and `withRateLimit`'s `keyExtractor` only receives the raw `HttpRequest` — it runs before `requireAdmin` resolves the identity, so it cannot key on `adminId`. Calling `consume()` directly after auth gives the exact semantics. `consume()` already fails open on Cosmos errors.
- **The raw number is resolved fresh** from Firebase Auth (customer, technician) and Cosmos (technician doc → uid), never read back out of a masked response.
- **The audit payload stores the masked number and the last four digits, never the full number.** The audit log is readable by anyone with `audit.read`; writing raw PII into it would defeat the whole story.

- [ ] **Step 1: Write the failing test**

Create `api/tests/functions/admin/orders/reveal-contact.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';
import type { AdminContext } from '../../../../src/types/admin.js';

const getOrderById = vi.fn();
const getTechniciansByIds = vi.fn();
const appendAuditEntry = vi.fn().mockResolvedValue(undefined);
const consume = vi.fn().mockResolvedValue({ allowed: true });
const getUsers = vi.fn();

vi.mock('../../../../src/cosmos/orders-repository.js', () => ({ getOrderById }));
vi.mock('../../../../src/cosmos/technician-repository.js', () => ({ getTechniciansByIds }));
vi.mock('../../../../src/cosmos/audit-log-repository.js', () => ({ appendAuditEntry }));
vi.mock('../../../../src/cosmos/rate-limit-repository.js', () => ({ consume }));
vi.mock('../../../../src/services/firebaseAdmin.js', () => ({
  getFirebaseAdmin: () => ({ auth: () => ({ getUsers }) }),
}));

const { revealContactHandler } = await import(
  '../../../../src/functions/admin/orders/reveal-contact.js'
);

const admin: AdminContext = { adminId: 'adm_1', role: 'ops-manager', sessionId: 'sess_1' };
const ctx = {} as InvocationContext;

function request(body: unknown, id = 'ord_1'): HttpRequest {
  return { params: { id }, json: async () => body } as unknown as HttpRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  consume.mockResolvedValue({ allowed: true });
  getOrderById.mockResolvedValue({
    id: 'ord_1',
    customerId: 'cust_1',
    customerPhone: '+91 XXXXX-X9999',
    technicianId: 'tech_1',
  });
  getTechniciansByIds.mockResolvedValue([{ id: 'tech_1', technicianId: 'tech_1' }]);
  getUsers.mockResolvedValue({
    users: [
      { uid: 'cust_1', phoneNumber: '+919999999999' },
      { uid: 'tech_1', phoneNumber: '+919876544321' },
    ],
  });
});

describe('POST /v1/admin/orders/{id}/reveal-contact', () => {
  it('returns the full customer number', async () => {
    const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(res.status).toBe(200);
    expect((res.jsonBody as { phone: string }).phone).toBe('+919999999999');
    expect((res.jsonBody as { party: string }).party).toBe('CUSTOMER');
  });

  it('returns the full technician number', async () => {
    const res = await revealContactHandler(request({ party: 'TECHNICIAN' }), ctx, admin);
    expect(res.status).toBe(200);
    expect((res.jsonBody as { phone: string }).phone).toBe('+919876544321');
  });

  it('writes a PII_CONTACT_REVEALED audit entry naming the admin and the party', async () => {
    await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(appendAuditEntry).toHaveBeenCalledTimes(1);
    const entry = appendAuditEntry.mock.calls[0]![0] as {
      action: string; adminId: string; resourceId: string; payload: Record<string, unknown>;
    };
    expect(entry.action).toBe('PII_CONTACT_REVEALED');
    expect(entry.adminId).toBe('adm_1');
    expect(entry.resourceId).toBe('ord_1');
    expect(entry.payload['party']).toBe('CUSTOMER');
  });

  it('never writes the full number into the audit payload', async () => {
    await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    const entry = appendAuditEntry.mock.calls[0]![0] as { payload: Record<string, unknown> };
    expect(JSON.stringify(entry.payload)).not.toContain('+919999999999');
    expect(JSON.stringify(entry.payload)).not.toContain('9999999999');
    expect(entry.payload['phoneMasked']).toBe('+91 XXXXX-X9999');
    expect(entry.payload['phoneLast4']).toBe('9999');
  });

  it('rejects an unknown party with 422 and does not audit', async () => {
    const res = await revealContactHandler(request({ party: 'COURIER' }), ctx, admin);
    expect(res.status).toBe(422);
    expect(appendAuditEntry).not.toHaveBeenCalled();
  });

  it('returns 404 when the order does not exist', async () => {
    getOrderById.mockResolvedValue(null);
    const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('ORDER_NOT_FOUND');
  });

  it('returns 404 PARTY_NOT_AVAILABLE when no technician is assigned', async () => {
    getOrderById.mockResolvedValue({ id: 'ord_1', customerId: 'cust_1' });
    const res = await revealContactHandler(request({ party: 'TECHNICIAN' }), ctx, admin);
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('PARTY_NOT_AVAILABLE');
  });

  it('returns 404 PHONE_UNAVAILABLE when the number cannot be resolved', async () => {
    getUsers.mockResolvedValue({ users: [] });
    const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('PHONE_UNAVAILABLE');
  });

  it('returns 429 with Retry-After when the per-admin budget is spent', async () => {
    consume.mockResolvedValue({ allowed: false, retryAfterMs: 4000 });
    const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(res.status).toBe(429);
    expect((res.jsonBody as { code: string }).code).toBe('RATE_LIMITED');
    expect(res.headers?.['Retry-After']).toBe('4');
    expect(appendAuditEntry).not.toHaveBeenCalled();
  });

  it('rate-limits per admin at 30 per minute', async () => {
    await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(consume).toHaveBeenCalledWith('rl:pii-reveal:adm_1', 30, 0.5);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd api && ./node_modules/.bin/vitest run tests/functions/admin/orders/reveal-contact.test.ts
```

Expected: FAIL — cannot resolve `src/functions/admin/orders/reveal-contact.js`.

- [ ] **Step 3: Add the audit action**

In `api/src/types/admin.ts`, in the `AuditAction` union, add under a `// PII` comment (keep the file's alphabetical grouping style):

```ts
  // PII
  | 'PII_CONTACT_REVEALED'
```

- [ ] **Step 4: Add the schemas**

Create `api/src/schemas/order-reveal.ts`:

```ts
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const RevealPartyEnum = z.enum(['CUSTOMER', 'TECHNICIAN']);

/** Write body — strict, per the read-widen/write-strict invariant. */
export const RevealContactBodySchema = z.object({
  party: RevealPartyEnum,
});

export const RevealContactResponseSchema = z.object({
  party: RevealPartyEnum,
  /** The full, unmasked number. This is the only field in the API that carries one. */
  phone: z.string(),
  revealedAt: z.string(),
});

export type RevealParty = z.infer<typeof RevealPartyEnum>;
export type RevealContactBody = z.infer<typeof RevealContactBodySchema>;
export type RevealContactResponse = z.infer<typeof RevealContactResponseSchema>;
```

- [ ] **Step 5: Write the handler**

Create `api/src/functions/admin/orders/reveal-contact.ts`:

```ts
import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getOrderById } from '../../../cosmos/orders-repository.js';
import { getTechniciansByIds } from '../../../cosmos/technician-repository.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import { consume } from '../../../cosmos/rate-limit-repository.js';
import { getFirebaseAdmin } from '../../../services/firebaseAdmin.js';
import { maskPhone } from '../../../lib/pii/mask.js';
import { RevealContactBodySchema, type RevealParty } from '../../../schemas/order-reveal.js';

/** 30 reveals per minute per admin (spec §6 E09-S08). */
const REVEAL_CAPACITY = 30;
const REVEAL_REFILL_PER_SEC = 0.5;

async function phoneForUid(uid: string): Promise<string | undefined> {
  try {
    const { users } = await getFirebaseAdmin().auth().getUsers([{ uid }]);
    return users[0]?.phoneNumber ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolves the technician's Firebase uid. A booking's technicianId may hold
 * either the technician document id or its technicianId field; the uid is
 * always the document id.
 */
async function technicianUid(technicianId: string): Promise<string | undefined> {
  try {
    const techs = await getTechniciansByIds([technicianId]);
    return techs[0]?.id ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * The only endpoint in the API that returns an unmasked phone number
 * (ADR 0034). Role-gated to super-admin and ops-manager, rate-limited to 30
 * reveals per minute per admin, and audit-logged as PII_CONTACT_REVEALED.
 *
 * Rate limiting runs here rather than in withRateLimit because the budget is
 * per admin: withRateLimit's keyExtractor only sees the raw request and runs
 * before requireAdmin has resolved an identity.
 */
export async function revealContactHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = (req.params as Record<string, string | undefined>)['id'];
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { status: 422, jsonBody: { code: 'VALIDATION_ERROR' } };
  }
  const parsed = RevealContactBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } };
  }
  const party: RevealParty = parsed.data.party;

  const budget = await consume(`rl:pii-reveal:${admin.adminId}`, REVEAL_CAPACITY, REVEAL_REFILL_PER_SEC);
  if (!budget.allowed) {
    const retryAfterSec = Math.ceil((budget.retryAfterMs ?? 1000) / 1000);
    return {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec), 'Content-Type': 'application/json' },
      jsonBody: { code: 'RATE_LIMITED', retryAfterMs: budget.retryAfterMs },
    };
  }

  const order = await getOrderById(id);
  if (!order) return { status: 404, jsonBody: { code: 'ORDER_NOT_FOUND' } };

  let subjectId: string | undefined;
  if (party === 'CUSTOMER') {
    subjectId = order.customerId;
  } else {
    if (!order.technicianId) return { status: 404, jsonBody: { code: 'PARTY_NOT_AVAILABLE' } };
    subjectId = await technicianUid(order.technicianId);
  }
  if (!subjectId) return { status: 404, jsonBody: { code: 'PARTY_NOT_AVAILABLE' } };

  const phone = await phoneForUid(subjectId);
  if (!phone) return { status: 404, jsonBody: { code: 'PHONE_UNAVAILABLE' } };

  const revealedAt = new Date().toISOString();

  // The audit payload carries the masked number only — audit_log is readable
  // by any role with audit.read, so storing the raw number there would defeat
  // the purpose of masking it everywhere else.
  await appendAuditEntry({
    id: randomUUID(),
    adminId: admin.adminId,
    role: admin.role,
    action: 'PII_CONTACT_REVEALED',
    resourceType: 'booking',
    resourceId: id,
    payload: {
      party,
      subjectId,
      phoneMasked: maskPhone(phone),
      phoneLast4: phone.slice(-4),
    },
    timestamp: revealedAt,
    partitionKey: revealedAt.slice(0, 7),
  });

  return { status: 200, jsonBody: { party, phone, revealedAt } };
}

app.http('adminRevealOrderContact', {
  methods: ['POST'],
  route: 'v1/admin/orders/{id}/reveal-contact',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(revealContactHandler),
});
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
cd api && ./node_modules/.bin/vitest run tests/functions/admin/orders/reveal-contact.test.ts
```

Expected: PASS, 11 tests.

- [ ] **Step 7: Confirm the function is registered**

The API registers functions by importing modules; check how sibling order functions are wired and add the same registration for `reveal-contact.js`:

```bash
cd api && grep -rn "admin/orders/overrides" src/index.ts src/main.ts src/functions/index.ts 2>/dev/null
```

Add the matching import line for `./functions/admin/orders/reveal-contact.js` in whichever file lists the others. If the project uses a glob/`main` field in `package.json` instead, no change is needed — verify before assuming.

- [ ] **Step 8: Commit**

```bash
git add api/tests/functions/admin/orders/reveal-contact.test.ts
git commit -m "test(api): specify audited, rate-limited contact reveal for admin orders"
git add api/src/schemas/order-reveal.ts api/src/functions/admin/orders/reveal-contact.ts api/src/types/admin.ts api/src/index.ts
git commit -m "feat(api): add POST /v1/admin/orders/{id}/reveal-contact with PII_CONTACT_REVEALED audit"
```

---

### Task 4: Retire the duplicate maskPhone helpers

**Files:**
- Modify: `api/src/functions/admin/customers/list.ts:10-13`
- Modify: `api/src/functions/admin/technicians/list.ts:10-13`

**Interfaces:**
- Consumes: `maskPhone` from Task 1.
- Produces: no behaviour change. The shared implementation is byte-identical to both deleted copies, so the existing roster tests must pass untouched — that is the proof.

- [ ] **Step 1: Add a guard test that only one masking implementation exists**

Append to `api/tests/lib/pii/mask.test.ts`:

```ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : [];
  });
}

describe('masking is not re-implemented anywhere else', () => {
  it('declares maskPhone in exactly one source file', () => {
    const offenders = walk('src')
      .filter((file) => file !== join('src', 'lib', 'pii', 'mask.ts'))
      .filter((file) => /function\s+maskPhone|const\s+maskPhone\s*=/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd api && ./node_modules/.bin/vitest run tests/lib/pii/mask.test.ts
```

Expected: FAIL — offenders lists `src\functions\admin\customers\list.ts` and `src\functions\admin\technicians\list.ts`.

- [ ] **Step 3: Delete both local copies and import the shared one**

In `api/src/functions/admin/customers/list.ts`, delete the four-line local `maskPhone` and add to the imports:

```ts
import { maskPhone } from '../../../lib/pii/mask.js';
```

Do exactly the same in `api/src/functions/admin/technicians/list.ts`.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd api && ./node_modules/.bin/vitest run tests/lib/pii/mask.test.ts tests/functions/admin/customers tests/functions/admin/technicians
```

Expected: PASS, with the pre-existing roster tests unchanged.

- [ ] **Step 5: Commit**

```bash
git add api/tests/lib/pii/mask.test.ts
git commit -m "test(api): forbid re-declaring maskPhone outside the pii module"
git add api/src/functions/admin/customers/list.ts api/src/functions/admin/technicians/list.ts
git commit -m "refactor(api): point customer and technician rosters at the shared maskPhone"
```

---

### Task 5: Capability, types, and API client in admin-web

**Files:**
- Modify: `admin-web/src/admin/capabilities.ts:10-55`
- Modify: `admin-web/src/types/order.ts:17-37`
- Modify: `admin-web/src/api/orders.ts`
- Test: `admin-web/tests/admin/capabilities.test.ts` (create if absent — check first)

**Interfaces:**
- Consumes: the response shape from Task 3.
- Produces: `Capability` gains `'orders.revealContact'`; `Order.technicianPhoneMasked?: string`; `RevealParty = 'CUSTOMER' | 'TECHNICIAN'`; `RevealContactResponse { party, phone, revealedAt }`; `revealOrderContact(id: string, party: RevealParty): Promise<RevealContactResponse>` — thrown errors carry `.status`. Tasks 6 and 7 consume all of these.

E21-S03 deliberately deferred this capability; it is added here.

- [ ] **Step 1: Write the failing test**

```bash
cd admin-web && ls tests/admin/ 2>/dev/null
```

Add to the existing capabilities test if one exists, otherwise create `admin-web/tests/admin/capabilities.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { hasCapability, ALL_CAPABILITIES } from '../../src/admin/capabilities';

describe('orders.revealContact capability', () => {
  it('is granted to super-admin', () => {
    expect(hasCapability('super-admin', 'orders.revealContact')).toBe(true);
  });

  it('is granted to ops-manager', () => {
    expect(hasCapability('ops-manager', 'orders.revealContact')).toBe(true);
  });

  it('is denied to finance', () => {
    expect(hasCapability('finance', 'orders.revealContact')).toBe(false);
  });

  it('is denied to support-agent', () => {
    expect(hasCapability('support-agent', 'orders.revealContact')).toBe(false);
  });

  it('is denied to an unauthenticated caller', () => {
    expect(hasCapability(null, 'orders.revealContact')).toBe(false);
  });

  it('is listed in ALL_CAPABILITIES', () => {
    expect(ALL_CAPABILITIES).toContain('orders.revealContact');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd admin-web && ./node_modules/.bin/vitest run tests/admin/capabilities.test.ts
```

Expected: FAIL — TypeScript rejects `'orders.revealContact'` as it is not in `Capability`.

- [ ] **Step 3: Add the capability**

In `admin-web/src/admin/capabilities.ts`, add `| 'orders.revealContact'` to the `Capability` union after `'orders.financialOverride'`, add `'orders.revealContact',` to `ALL_CAPABILITIES` in the same position, and add `'orders.revealContact',` to the `'ops-manager'` array in `ROLE_CAPABILITIES`. `super-admin` receives it through `ALL_CAPABILITIES`; `finance` and `support-agent` are untouched, so they are denied.

- [ ] **Step 4: Add the client types**

In `admin-web/src/types/order.ts`, add to `Order` after `technicianName`:

```ts
  technicianName?: string;
  /** Masked technician phone from the API. Absent when unassigned or unresolvable. */
  technicianPhoneMasked?: string;
```

and at the end of the file:

```ts
export type RevealParty = 'CUSTOMER' | 'TECHNICIAN';

export interface RevealContactResponse {
  party: RevealParty;
  phone: string;
  revealedAt: string;
}
```

- [ ] **Step 5: Add the API call**

Append to `admin-web/src/api/orders.ts` (and add `RevealParty`, `RevealContactResponse` to the type import at the top):

```ts
/** Error thrown by revealOrderContact, carrying the HTTP status so the UI can
 *  distinguish forbidden (403) from rate-limited (429) from everything else. */
export class RevealContactError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`revealOrderContact failed: ${status}`);
    this.name = 'RevealContactError';
    this.status = status;
  }
}

export async function revealOrderContact(
  id: string,
  party: RevealParty,
): Promise<RevealContactResponse> {
  const res = await fetch(apiUrl(`/v1/admin/orders/${id}/reveal-contact`), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ party }),
  });
  if (!res.ok) throw new RevealContactError(res.status);
  return res.json() as Promise<RevealContactResponse>;
}
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
cd admin-web && ./node_modules/.bin/vitest run tests/admin/capabilities.test.ts && ./node_modules/.bin/tsc --noEmit
```

Expected: PASS, and a clean typecheck.

- [ ] **Step 7: Commit**

```bash
git add admin-web/tests/admin/capabilities.test.ts
git commit -m "test(admin-web): specify orders.revealContact role grants"
git add admin-web/src/admin/capabilities.ts admin-web/src/types/order.ts admin-web/src/api/orders.ts
git commit -m "feat(admin-web): add orders.revealContact capability and reveal API client"
```

---

### Task 6: The ContactReveal component

**Files:**
- Create: `admin-web/src/components/orders/ContactReveal.tsx`
- Modify: `admin-web/messages/en.json`, `admin-web/messages/hi.json`
- Test: `admin-web/tests/components/orders/ContactReveal.test.tsx`

**Interfaces:**
- Consumes: `revealOrderContact`, `RevealContactError`, `RevealParty` (Task 5).
- Produces:
  ```ts
  interface ContactRevealProps {
    orderId: string;
    party: RevealParty;
    maskedPhone: string | undefined;
    canReveal: boolean;
    variant?: 'inline' | 'block';   // 'inline' = table cell, 'block' = drawer
  }
  export function ContactReveal(props: ContactRevealProps): JSX.Element
  ```
  Tasks 7 and 8 render it.

Behaviour: masked at rest; **Show number** reveals for 60 s then auto-remasks; while revealed the number is a `tel:` link and the control reads **Hide now · {n}s**; errors replace the control inline. The timer is cleared on unmount and on manual hide. When `canReveal` is false, only the masked number renders — no control.

Follow the design direction section above exactly. Use only existing `--color-*` tokens.

- [ ] **Step 1: Add the copy to both message files**

Add this block inside `"orders"` in `admin-web/messages/en.json`:

```json
"pii": {
  "showNumber": "Show number",
  "showNumberAria": "Show the full {party} number",
  "hideNow": "Hide now · {seconds}s",
  "hideNowAria": "Hide the number now",
  "recorded": "Shown to you and recorded in the audit log.",
  "unavailable": "No number on file",
  "party": {
    "customer": "customer",
    "technician": "technician"
  },
  "errors": {
    "forbidden": "Your role can't reveal contact numbers.",
    "rateLimited": "Too many reveals. Try again in a minute.",
    "failed": "Couldn't reveal the number. Try again."
  }
}
```

and the matching block inside `"orders"` in `admin-web/messages/hi.json`:

```json
"pii": {
  "showNumber": "नंबर दिखाएँ",
  "showNumberAria": "{party} का पूरा नंबर दिखाएँ",
  "hideNow": "अभी छिपाएँ · {seconds}से",
  "hideNowAria": "नंबर अभी छिपाएँ",
  "recorded": "आपको दिखाया गया और ऑडिट लॉग में दर्ज किया गया।",
  "unavailable": "कोई नंबर दर्ज नहीं है",
  "party": {
    "customer": "ग्राहक",
    "technician": "तकनीशियन"
  },
  "errors": {
    "forbidden": "आपकी भूमिका संपर्क नंबर नहीं देख सकती।",
    "rateLimited": "बहुत ज़्यादा बार देखा गया। एक मिनट बाद कोशिश करें।",
    "failed": "नंबर नहीं दिखाया जा सका। दोबारा कोशिश करें।"
  }
}
```

Also add the CSV header key used in Task 8 to both files now, so en/hi stay in parity in a single edit — inside `"orders"."csv"."headers"`:

- en: `"technicianPhone": "Technician Phone"`
- hi: `"technicianPhone": "तकनीशियन फ़ोन"`

and inside `"orders"."csv"."headers"` change nothing else. In `"orders"."detail"."sections"` add:

- en: `"technicianPhone": "Technician phone"`, `"customerPhone": "Customer phone"`
- hi: `"technicianPhone": "तकनीशियन फ़ोन"`, `"customerPhone": "ग्राहक फ़ोन"`

- [ ] **Step 2: Write the failing test**

Create `admin-web/tests/components/orders/ContactReveal.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => {
    const t = (key: string, values?: Record<string, unknown>) =>
      values ? `[${ns}.${key}:${JSON.stringify(values)}]` : `[${ns}.${key}]`;
    return t;
  },
}));

const revealOrderContact = vi.fn();
class RevealContactError extends Error {
  status: number;
  constructor(status: number) { super('x'); this.status = status; }
}
vi.mock('@/api/orders', () => ({ revealOrderContact, RevealContactError }));

import { ContactReveal } from '../../../src/components/orders/ContactReveal';

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { vi.useRealTimers(); });

const base = {
  orderId: 'ord_1',
  party: 'CUSTOMER' as const,
  maskedPhone: '+91 XXXXX-X9999',
  canReveal: true,
};

describe('ContactReveal', () => {
  it('renders the masked number at rest', () => {
    render(<ContactReveal {...base} />);
    expect(screen.getByText('+91 XXXXX-X9999')).toBeInTheDocument();
  });

  it('hides the reveal control when the role lacks the capability', () => {
    render(<ContactReveal {...base} canReveal={false} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('+91 XXXXX-X9999')).toBeInTheDocument();
  });

  it('renders the unavailable copy when there is no masked number', () => {
    render(<ContactReveal {...base} maskedPhone={undefined} />);
    expect(screen.getByText('[orders.pii.unavailable]')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows the full number and a tel: link after a successful reveal', async () => {
    revealOrderContact.mockResolvedValue({
      party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('+919999999999')).toBeInTheDocument());
    expect(screen.getByRole('link')).toHaveAttribute('href', 'tel:+919999999999');
  });

  it('states that the reveal was recorded', async () => {
    revealOrderContact.mockResolvedValue({
      party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('[orders.pii.recorded]')).toBeInTheDocument());
  });

  it('re-masks automatically after 60 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    revealOrderContact.mockResolvedValue({
      party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('+919999999999')).toBeInTheDocument());
    await vi.advanceTimersByTimeAsync(60_000);
    await waitFor(() => expect(screen.queryByText('+919999999999')).toBeNull());
    expect(screen.getByText('+91 XXXXX-X9999')).toBeInTheDocument();
  });

  it('re-masks immediately when the operator hides it', async () => {
    revealOrderContact.mockResolvedValue({
      party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('+919999999999')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('+919999999999')).toBeNull();
    expect(screen.getByText('+91 XXXXX-X9999')).toBeInTheDocument();
  });

  it('shows the forbidden message on 403', async () => {
    revealOrderContact.mockRejectedValue(new RevealContactError(403));
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('[orders.pii.errors.forbidden]')).toBeInTheDocument());
  });

  it('shows the rate-limited message on 429', async () => {
    revealOrderContact.mockRejectedValue(new RevealContactError(429));
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('[orders.pii.errors.rateLimited]')).toBeInTheDocument());
  });

  it('shows the generic failure message on any other error', async () => {
    revealOrderContact.mockRejectedValue(new Error('network'));
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('[orders.pii.errors.failed]')).toBeInTheDocument());
  });

  it('requests the party it was given', async () => {
    revealOrderContact.mockResolvedValue({
      party: 'TECHNICIAN', phone: '+919876544321', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} party="TECHNICIAN" maskedPhone="+91 XXXXX-X4321" />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(revealOrderContact).toHaveBeenCalledWith('ord_1', 'TECHNICIAN'));
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd admin-web && ./node_modules/.bin/vitest run tests/components/orders/ContactReveal.test.tsx
```

Expected: FAIL — cannot resolve `../../../src/components/orders/ContactReveal`.

- [ ] **Step 4: Write the component**

Create `admin-web/src/components/orders/ContactReveal.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { revealOrderContact, RevealContactError } from '@/api/orders';
import type { RevealParty } from '@/types/order';

/** Seconds a revealed number stays on screen before it re-masks itself. */
const REVEAL_SECONDS = 60;

interface ContactRevealProps {
  orderId: string;
  party: RevealParty;
  /** Masked number from the API. Undefined when there is no number on file. */
  maskedPhone: string | undefined;
  /** False when the signed-in role lacks orders.revealContact. */
  canReveal: boolean;
  /** 'inline' sits in a table cell; 'block' sits in the order drawer. */
  variant?: 'inline' | 'block';
}

type ErrorKey = 'forbidden' | 'rateLimited' | 'failed';

function errorKeyFor(err: unknown): ErrorKey {
  if (err instanceof RevealContactError) {
    if (err.status === 403) return 'forbidden';
    if (err.status === 429) return 'rateLimited';
  }
  return 'failed';
}

export function ContactReveal({
  orderId,
  party,
  maskedPhone,
  canReveal,
  variant = 'inline',
}: ContactRevealProps) {
  const t = useTranslations('orders.pii');
  const [phone, setPhone] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(REVEAL_SECONDS);
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    stopTimer();
    setPhone(null);
    setSecondsLeft(REVEAL_SECONDS);
  }, [stopTimer]);

  useEffect(() => stopTimer, [stopTimer]);

  const reveal = useCallback(async () => {
    setPending(true);
    setErrorKey(null);
    try {
      const result = await revealOrderContact(orderId, party);
      setPhone(result.phone);
      setSecondsLeft(REVEAL_SECONDS);
      stopTimer();
      intervalRef.current = setInterval(() => {
        setSecondsLeft((remaining) => {
          if (remaining <= 1) {
            stopTimer();
            setPhone(null);
            return REVEAL_SECONDS;
          }
          return remaining - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      setErrorKey(errorKeyFor(err));
    } finally {
      setPending(false);
    }
  }, [orderId, party, stopTimer]);

  const partyLabel = t(party === 'CUSTOMER' ? 'party.customer' : 'party.technician');
  const numberClass =
    'font-mono tabular-nums text-[var(--color-text)] transition-opacity duration-[120ms] motion-reduce:transition-none';
  const controlClass =
    'text-left text-xs text-[var(--color-text-faint)] underline decoration-dotted underline-offset-2 ' +
    'transition-colors duration-[120ms] motion-reduce:transition-none hover:text-[var(--color-text-muted)] ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'focus-visible:outline-[var(--color-focus-ring)] disabled:opacity-60';

  if (!maskedPhone) {
    return (
      <span className="text-xs italic text-[var(--color-text-faint)]">{t('unavailable')}</span>
    );
  }

  return (
    <div className={variant === 'block' ? 'flex flex-col gap-1' : 'flex flex-col gap-0.5'}>
      {phone === null ? (
        <span className={`${numberClass} text-xs`}>{maskedPhone}</span>
      ) : (
        <a href={`tel:${phone}`} className={`${numberClass} text-xs underline underline-offset-2`}>
          {phone}
        </a>
      )}

      {canReveal && errorKey === null && (
        phone === null ? (
          <button
            type="button"
            onClick={reveal}
            disabled={pending}
            aria-label={t('showNumberAria', { party: partyLabel })}
            className={controlClass}
          >
            {t('showNumber')}
          </button>
        ) : (
          <button
            type="button"
            onClick={hide}
            aria-label={t('hideNowAria')}
            className={controlClass}
          >
            {t('hideNow', { seconds: secondsLeft })}
          </button>
        )
      )}

      {canReveal && errorKey === null && phone !== null && (
        <span className="text-xs text-[var(--color-text-faint)]">{t('recorded')}</span>
      )}

      {errorKey !== null && (
        <span role="status" className="text-xs text-[var(--color-danger)]">
          {t(`errors.${errorKey}`)}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd admin-web && ./node_modules/.bin/vitest run tests/components/orders/ContactReveal.test.tsx
```

Expected: PASS, 11 tests.

- [ ] **Step 6: Commit**

```bash
git add admin-web/tests/components/orders/ContactReveal.test.tsx admin-web/messages/en.json admin-web/messages/hi.json
git commit -m "test(admin-web): specify ContactReveal states and add bilingual PII copy"
git add admin-web/src/components/orders/ContactReveal.tsx
git commit -m "feat(admin-web): add ContactReveal with 60s auto-remask and inline error states"
```

---

### Task 7: Wire ContactReveal into the list and the drawer

**Files:**
- Modify: `admin-web/src/components/orders/OrdersClient.tsx` (compute `canReveal`, thread it down)
- Modify: `admin-web/src/components/orders/OrdersTable.tsx` (pass `orderId` + `canReveal` to `CustomerCell`)
- Modify: `admin-web/src/components/orders/CustomerCell.tsx`
- Modify: `admin-web/src/components/orders/OrderSlideOver.tsx`
- Test: `admin-web/tests/OrdersTable.test.tsx`, `admin-web/tests/OrderSlideOver.test.tsx` (existing)

**Interfaces:**
- Consumes: `ContactReveal` (Task 6), `hasCapability` + `Order.technicianPhoneMasked` (Task 5).
- Produces: `CustomerCellProps` gains `orderId: string` and `canReveal: boolean`; `OrderSlideOverProps` gains `canReveal?: boolean`.

In the drawer the customer section becomes name + `ContactReveal variant="block"`, and the technician section gains a phone line with its own `ContactReveal variant="block"` for `technicianPhoneMasked`, placed above `TrustDossierPanel`. Use the `orders.detail.sections.customerPhone` / `technicianPhone` labels added in Task 6.

- [ ] **Step 1: Write the failing tests**

Add to `admin-web/tests/OrdersTable.test.tsx`:

```tsx
it('renders a reveal control for the customer phone when permitted', () => {
  // Use the file's existing render helper and fixture; pass canReveal
  renderTable({ canReveal: true });
  expect(screen.getAllByRole('button', { name: /show/i }).length).toBeGreaterThan(0);
});

it('renders no reveal control when the role lacks the capability', () => {
  renderTable({ canReveal: false });
  expect(screen.queryByRole('button', { name: /show/i })).toBeNull();
});
```

Add to `admin-web/tests/OrderSlideOver.test.tsx`:

```tsx
it('shows the masked technician phone', () => {
  renderSlideOver({ order: { ...baseOrder, technicianPhoneMasked: '+91 XXXXX-X4321' } });
  expect(screen.getByText('+91 XXXXX-X4321')).toBeInTheDocument();
});

it('shows the unavailable copy when the technician has no number on file', () => {
  renderSlideOver({ order: { ...baseOrder, technicianPhoneMasked: undefined } });
  expect(screen.getAllByText(/unavailable|नंबर दर्ज नहीं/i).length).toBeGreaterThan(0);
});
```

Read each test file first and match its existing render-helper and mock style — do not invent `renderTable`/`renderSlideOver` if the file uses a different shape; adapt to what is there.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd admin-web && ./node_modules/.bin/vitest run tests/OrdersTable.test.tsx tests/OrderSlideOver.test.tsx
```

Expected: FAIL — no reveal button, no technician phone rendered.

- [ ] **Step 3: Update CustomerCell**

Replace the phone `<span>` in `admin-web/src/components/orders/CustomerCell.tsx` with `ContactReveal`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { ContactReveal } from './ContactReveal';

interface CustomerCellProps {
  orderId: string;
  name: string;
  phone: string;
  canReveal: boolean;
}

export function CustomerCell({ orderId, name, phone, canReveal }: CustomerCellProps) {
  const t = useTranslations('orders.cells.customer');
  const trimmed = name.trim();
  const hasName = trimmed.length > 0;

  return (
    <div className="flex flex-col">
      <span
        className={
          hasName ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] italic'
        }
      >
        {hasName ? trimmed : t('noName')}
      </span>
      <ContactReveal
        orderId={orderId}
        party="CUSTOMER"
        maskedPhone={phone || undefined}
        canReveal={canReveal}
        variant="inline"
      />
    </div>
  );
}
```

- [ ] **Step 4: Thread canReveal through OrdersTable and OrdersClient**

In `OrdersTable.tsx`, add `canReveal: boolean` to its props and pass `orderId={order.id}` and `canReveal={canReveal}` to `<CustomerCell />`.

In `OrdersClient.tsx`, next to the existing capability lookups:

```ts
const canReveal = hasCapability(auth?.role, 'orders.revealContact');
```

Pass `canReveal={canReveal}` to `<OrdersTable />` and to `<OrderSlideOver />`.

- [ ] **Step 5: Update OrderSlideOver**

Add `canReveal?: boolean;` to `OrderSlideOverProps`, destructure it with `canReveal = false`, and replace the customer and technician sections:

```tsx
<section>
  <h3 className="text-xs text-gray-500 font-medium mb-1">{t('detail.sections.customer')}</h3>
  <p>{currentOrder.customerName}</p>
  <ContactReveal
    orderId={currentOrder.id}
    party="CUSTOMER"
    maskedPhone={currentOrder.customerPhone || undefined}
    canReveal={canReveal}
    variant="block"
  />
</section>
<section>
  <h3 className="text-xs text-gray-500 font-medium mb-1">{t('detail.sections.technician')}</h3>
  <p>{currentOrder.technicianName ?? '—'}</p>
  <p className="text-gray-500 font-mono text-xs">{currentOrder.technicianId ?? '—'}</p>
  {currentOrder.technicianId && (
    <ContactReveal
      orderId={currentOrder.id}
      party="TECHNICIAN"
      maskedPhone={currentOrder.technicianPhoneMasked}
      canReveal={canReveal}
      variant="block"
    />
  )}
  <TrustDossierPanel technicianId={currentOrder.technicianId} />
</section>
```

Add `import { ContactReveal } from './ContactReveal';` to the imports.

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd admin-web && ./node_modules/.bin/vitest run tests/OrdersTable.test.tsx tests/OrderSlideOver.test.tsx tests/a11y/orders.a11y.spec.ts tests/i18n/orders.i18n.test.tsx
```

Expected: PASS. Fix any fixture in those files that still passes the old `CustomerCell` props.

- [ ] **Step 7: Commit**

```bash
git add admin-web/tests/OrdersTable.test.tsx admin-web/tests/OrderSlideOver.test.tsx
git commit -m "test(admin-web): specify reveal affordance in the orders list and drawer"
git add admin-web/src/components/orders/
git commit -m "feat(admin-web): show masked phones with audited reveal in the orders list and drawer"
```

---

### Task 8: Mask the CSV export and lock the bilingual copy

**Files:**
- Modify: `admin-web/src/components/orders/exportCsv.ts`
- Test: `admin-web/tests/exportCsv.test.ts` (existing)
- Create: `admin-web/tests/i18n/pii-copy.test.ts`

**Interfaces:**
- Consumes: `Order.technicianPhoneMasked` (Task 5), the `orders.csv.headers.technicianPhone` key (Task 6).
- Produces: the CSV gains a **Technician Phone** column after **Technician Name**. Both phone columns carry the masked values the API already returned — the CSV never calls the reveal endpoint.

The parity test pins the real message files, because every component test mocks next-intl and therefore cannot prove a key exists (`~/.claude/memory/feedback_i18n_mock_blindspot.md`).

- [ ] **Step 1: Write the failing tests**

Add to `admin-web/tests/exportCsv.test.ts`:

```ts
it('emits a technician phone column', () => {
  const csv = buildOrdersCsv(
    [{ ...baseOrder, technicianPhoneMasked: '+91 XXXXX-X4321' }],
    (k: string) => k,
  );
  expect(csv.split('\n')[0]).toContain('technicianPhone');
  expect(csv.split('\n')[1]).toContain('+91 XXXXX-X4321');
});

it('leaves the technician phone cell empty when there is no number', () => {
  const csv = buildOrdersCsv([{ ...baseOrder }], (k: string) => k);
  const cells = csv.split('\n')[1]!.split(',');
  expect(cells).toContain('');
});

it('never emits an unmasked ten-digit number', () => {
  const csv = buildOrdersCsv(
    [{ ...baseOrder, customerPhone: '+91 XXXXX-X9999', technicianPhoneMasked: '+91 XXXXX-X4321' }],
    (k: string) => k,
  );
  expect(csv).not.toMatch(/\b\d{10}\b/);
});
```

Adjust `baseOrder` in that file so `customerPhone` is the masked form `'+91 XXXXX-X9999'` — that is what the API now returns.

Create `admin-web/tests/i18n/pii-copy.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import en from '../../messages/en.json';
import hi from '../../messages/hi.json';

function flatten(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    flatten(value, prefix ? `${prefix}.${key}` : key),
  );
}

const REQUIRED = [
  'orders.pii.showNumber',
  'orders.pii.showNumberAria',
  'orders.pii.hideNow',
  'orders.pii.hideNowAria',
  'orders.pii.recorded',
  'orders.pii.unavailable',
  'orders.pii.party.customer',
  'orders.pii.party.technician',
  'orders.pii.errors.forbidden',
  'orders.pii.errors.rateLimited',
  'orders.pii.errors.failed',
  'orders.csv.headers.technicianPhone',
  'orders.detail.sections.customerPhone',
  'orders.detail.sections.technicianPhone',
];

describe('PII reveal copy', () => {
  const enKeys = flatten(en);
  const hiKeys = flatten(hi);

  it('keeps en and hi key sets identical', () => {
    expect(enKeys.slice().sort()).toEqual(hiKeys.slice().sort());
  });

  for (const key of REQUIRED) {
    it(`defines ${key} in en`, () => expect(enKeys).toContain(key));
    it(`defines ${key} in hi`, () => expect(hiKeys).toContain(key));
  }

  it('translates the reveal copy into Devanagari rather than copying English', () => {
    const hiPii = (hi as Record<string, Record<string, Record<string, string>>>)['orders']!['pii']!;
    for (const key of ['showNumber', 'recorded', 'unavailable']) {
      expect(hiPii[key]).toMatch(/[\u0900-\u097F]/);
    }
  });

  it('does not promise a reveal without saying it is recorded', () => {
    const enPii = (en as Record<string, Record<string, Record<string, string>>>)['orders']!['pii']!;
    expect(enPii['recorded']).toMatch(/audit log/i);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd admin-web && ./node_modules/.bin/vitest run tests/exportCsv.test.ts tests/i18n/pii-copy.test.ts
```

Expected: `exportCsv` FAILs on the missing column; `pii-copy` PASSes if Task 6 was completed (its keys already exist) — if Task 6's message edits were skipped, it fails on the missing keys.

- [ ] **Step 3: Add the column**

In `admin-web/src/components/orders/exportCsv.ts`, add `t('technicianPhone'),` to `headers` right after `t('technicianName')`, and add `o.technicianPhoneMasked ?? '',` to the row array in the same position:

```ts
    o.status, o.city,
```
becomes, with the row array reading:
```ts
      o.id, o.customerName, o.customerPhone,
      o.serviceName ?? '', o.technicianName ?? '', o.technicianPhoneMasked ?? '',
      o.status, o.city,
      o.scheduledAt, String(paiseToRupeeNumber(o.amount)), o.createdAt,
```

Add a header comment recording why both values arrive pre-masked:

```ts
/**
 * Both phone columns carry the masked values the API returned (ADR 0034).
 * The export never calls the reveal endpoint: a CSV is an uncontrolled copy,
 * and a reveal has to be attributable to one admin looking at one order.
 */
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd admin-web && ./node_modules/.bin/vitest run tests/exportCsv.test.ts tests/i18n/pii-copy.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add admin-web/tests/exportCsv.test.ts admin-web/tests/i18n/pii-copy.test.ts
git commit -m "test(admin-web): pin masked CSV export and bilingual PII copy against real messages"
git add admin-web/src/components/orders/exportCsv.ts
git commit -m "feat(admin-web): add masked technician phone column to the orders CSV export"
```

---

### Task 9: OpenAPI contract

**Files:**
- Modify: `api/src/openapi/registry.ts`
- Modify: `api/openapi.json` (generated — never hand-edited)

**Interfaces:**
- Consumes: `RevealContactBodySchema`, `RevealContactResponseSchema` (Task 3); `OrderSchema` with `technicianPhoneMasked` (Task 2).
- Produces: `adminRevealOrderContact` in the published contract.

A parallel lane is also regenerating `api/openapi.json`. On a conflict, take `origin/main`'s version of the file, then re-run the build — never resolve the JSON by hand.

- [ ] **Step 1: Register the path**

In `api/src/openapi/registry.ts`, add to the imports:

```ts
import { RevealContactBodySchema, RevealContactResponseSchema } from '../schemas/order-reveal.js';
```

and immediately after the existing `adminGetOrderTechnicianCandidates` registration:

```ts
registry.register('RevealContactBody', RevealContactBodySchema);
registry.register('RevealContactResponse', RevealContactResponseSchema);

registry.registerPath({
  method: 'post',
  path: '/v1/admin/orders/{id}/reveal-contact',
  operationId: 'adminRevealOrderContact',
  tags: ['orders'],
  security: [{ cookieAuth: [] }],
  summary: 'Reveal the full phone number for one party on an order',
  description:
    'The only endpoint that returns an unmasked phone number. Restricted to super-admin and '
    + 'ops-manager, rate-limited to 30 reveals per minute per admin, and audit-logged as '
    + 'PII_CONTACT_REVEALED (ADR 0034).',
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  request: { body: { content: { 'application/json': { schema: RevealContactBodySchema } } } },
  responses: {
    200: { description: 'Revealed', content: { 'application/json': { schema: RevealContactResponseSchema } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    404: { description: 'Order not found, party not on the order, or no number on file' },
    422: { description: 'Invalid party' },
    429: { description: 'Reveal budget exhausted for this admin' },
  },
});
```

- [ ] **Step 2: Regenerate and lint the contract**

```bash
cd api && pnpm run openapi:build && pnpm run openapi:lint
```

Expected: the build writes `api/openapi.json`; the lint exits 0.

- [ ] **Step 3: Verify the generated contract contains the new operation and field**

```bash
cd api && node -e "
const s = require('./openapi.json');
const p = s.paths['/v1/admin/orders/{id}/reveal-contact'];
console.log('operationId:', p && p.post && p.post.operationId);
const order = s.components.schemas.Order || s.components.schemas.OrderSchema;
console.log('technicianPhoneMasked present:', !!(order && order.properties && order.properties.technicianPhoneMasked));
console.log('technicianPhoneMasked required:', (order && order.required || []).includes('technicianPhoneMasked'));
"
```

Expected: `operationId: adminRevealOrderContact`, `present: true`, `required: false`. If `required` is true, the schema was not marked `.optional()` — go back to Task 2.

- [ ] **Step 4: Commit**

```bash
git add api/src/openapi/registry.ts api/openapi.json
git commit -m "feat(api): publish adminRevealOrderContact and technicianPhoneMasked in the OpenAPI contract"
```

---

### Task 10: ADR, story doc, threat model, runbook

**Files:**
- Create: `docs/adr/0034-pii-masking-default-and-audited-reveal.md`
- Create: `docs/stories/E09-S08-pii-safe-phones.md`
- Modify: `docs/threat-model.md`
- Modify: `docs/runbook.md`

**Interfaces:**
- Consumes: everything above.
- Produces: no code.

- [ ] **Step 1: Check the ADR number is still free**

```bash
ls docs/adr/ | tail -6
```

If `0034-*` is taken by the parallel lane, use the next free number and update every reference to "ADR 0034" in the code comments written in Tasks 1, 2, 3 and 8.

- [ ] **Step 2: Write the ADR**

Create `docs/adr/0034-pii-masking-default-and-audited-reveal.md` following the format of the neighbouring ADRs. It must state:

- **Context:** admin orders returned the customer's full phone in the list, the detail drawer and the CSV export; the technician's phone was absent entirely, so owner requirement R2 was unmet. A CSV export is an uncontrolled copy that leaves the audited surface completely.
- **Decision:** masked by default at one serialization boundary; a single `api/src/lib/pii/mask.ts`; the full number reachable only through `POST /v1/admin/orders/{id}/reveal-contact`, restricted to `super-admin` and `ops-manager`, rate-limited to 30/min per admin, audit-logged as `PII_CONTACT_REVEALED` with the masked number in the payload; the client re-masks after 60 seconds.
- **Consequences:** `finance` and `support-agent` can no longer read any customer phone; the last four digits remain visible to every role that can read orders, which is the accepted trade-off for operator recognition; the CSV can never be un-masked; reveals are attributable per admin per order; `technicianPhoneMasked` is optional forever because read-path schemas only widen.
- **Alternatives rejected:** a confirmation dialog before each reveal (friction theatre; the audit log is the real control); storing the raw number in the audit payload (would re-leak PII to every `audit.read` holder); reveal-by-CSV (unattributable).

- [ ] **Step 3: Write the story doc**

Create `docs/stories/E09-S08-pii-safe-phones.md` matching the shape of `docs/stories/E21-S02-commission-ledger-v2.md`: the owner requirement (R2), acceptance criteria mirroring the tests in Tasks 1–8, the endpoint contract, the RBAC matrix, and a link to this plan and to the ADR.

- [ ] **Step 4: Update the threat model**

Append a DPDP contact-data inventory row to `docs/threat-model.md` recording: what is collected (customer and technician phone numbers), where it is stored (Firebase Auth; `bookings.customerPhone` in Cosmos), who can read the masked form (every role with `orders.read`), who can read the full form (`super-admin`, `ops-manager`), the retention of reveal events (the `audit_log` container's existing retention), and the two accepted residuals:

1. the last four digits are visible to every role that can read orders;
2. `customerName` still falls back to the customer's phone number when a booking carries no name — a pre-existing display-name behaviour, tracked separately, not introduced by this story.

- [ ] **Step 5: Update the runbook**

Append a "Contact reveal" section to `docs/runbook.md`: how to audit who revealed which contact (query `audit_log` for `action = 'PII_CONTACT_REVEALED'`, partition key `YYYY-MM`), what a 429 means and that the budget refills at 0.5/sec, and what to check when a reveal returns `PHONE_UNAVAILABLE` (the subject has no `phoneNumber` in Firebase Auth).

- [ ] **Step 6: Commit**

```bash
git add docs/
git commit -m "docs: ADR 0034, E09-S08 story, PII inventory and contact-reveal runbook"
```

---

### Task 11: Gates

**Files:** none.

- [ ] **Step 1: Merge main so the pre-push hook diffs against the right base**

The pre-push hook diffs against `@{u}`, and this branch tracks `origin/main`, so unrelated sub-project gates run as main advances (`~/.claude/memory/feedback_prepush_hook_upstream_diff.md`). Merge before the first push:

```bash
git fetch origin && git merge origin/main
```

Resolve `api/openapi.json` by taking main's copy and re-running `cd api && pnpm run openapi:build`. Resolve `admin-web/messages/*.json` by keeping **both** sides' keys — then re-run `cd admin-web && ./node_modules/.bin/vitest run tests/i18n/pii-copy.test.ts` to confirm en/hi parity survived.

- [ ] **Step 2: API smoke gate**

```bash
bash tools/pre-codex-smoke-api.sh
```

Expected: exit 0, ending with `=== API smoke gate PASSED ===`.

- [ ] **Step 3: Web smoke gate**

```bash
bash tools/pre-codex-smoke-web.sh
```

Expected: exit 0, ending with `=== Web smoke gate PASSED ===`.

- [ ] **Step 4: Full-repo raw-PII sweep**

Confirm no admin orders surface can emit an unmasked number:

```bash
cd api && ./node_modules/.bin/vitest run 2>&1 | tail -5
grep -rn "customerPhone" api/src/functions/admin/ | grep -v "reveal-contact"
```

Expected: the only remaining reference is the `customerPhone` **query filter** in `admin/orders/list.ts`, which is a search input compared against stored data, not an output.

- [ ] **Step 5: Codex review gate**

Use the `codex-review-gate` skill. Run from the worktree, which needs the `disk-full-read-access` sandbox permission (`~/.claude/memory/feedback_smoke_gate_paparazzi.md`):

```bash
codex review --base main
```

Fix findings once, re-run once. Write `.codex-review-passed` only for a review that ran clean.

- [ ] **Step 6: Push**

```bash
git push -u origin feat/e09-s08-pii-phones
```

---

## Self-Review

**Spec coverage (§6 E09-S08 + §7.11 + §8):**

| Spec requirement | Task |
|---|---|
| `api/src/lib/pii/mask.ts` — single `maskPhone`, `maskVpa` | 1, and 4 removes the duplicates |
| `OrderSchema.customerPhone` masked | 2 |
| `technicianPhoneMasked?` added | 2 |
| CSV masked | 8 |
| `POST /v1/admin/orders/{id}/reveal-contact { party }` | 3 |
| Roles super-admin + ops-manager | 3 (`requireAdmin`), 5 (client capability) |
| Returns the full number | 3 |
| Audit `PII_CONTACT_REVEALED` | 3 |
| Rate-limited 30/min per admin | 3 |
| Capability `orders.revealContact` | 5 |
| `ContactReveal` — masked → reveal → full for 60 s → auto-remask, `tel:` while revealed | 6 |
| Reveal in `OrderSlideOver` for both parties | 7 |
| Reveal in the list | 7 |
| Tests: reveal audited, `finance` 403, remask timer | 3, 5, 6 |
| DPDP inventory + threat model | 10 |
| ADR 0034 | 10 |
| §8 audit enum entry | 3 |

**Type consistency:** `maskPhone`/`maskVpa`/`MASK_PLACEHOLDER` (Task 1) are used with those exact names in Tasks 2, 3, 4. `RevealParty`, `RevealContactResponse`, `revealOrderContact`, `RevealContactError` (Task 5) are used with those exact names in Task 6. `ContactRevealProps` (Task 6) matches every call site in Task 7. `technicianPhoneMasked` is spelled identically in Tasks 2, 5, 7, 8, 9.

**Known gaps flagged rather than silently absorbed:**

- `maskVpa` has no consumer in this story — E24-S01 will use it for `technicianUpiMasked`. The spec names it in the E09-S08 row, so it is built and tested here rather than left as a stub.
- `customerName` can still fall back to a raw phone number when a booking carries no name. That is pre-existing behaviour on a display-name field, outside this story's scope; Task 10 records it in the threat model as an accepted residual rather than fixing it unasked.
