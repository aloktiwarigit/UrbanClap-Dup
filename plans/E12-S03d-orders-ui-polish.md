# E12-S03d: Orders UI Polish + Audit-Log Nav Cleanup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide Audit Log from primary nav (label only — capability + route guard untouched), tokenize OrdersTable, replace raw customer/technician cells with intent-revealing display cells, and replace the cramped multi-select status filter with a dark-mode-safe checklist popover. All labels translated; verified on `/hi/orders` in light + dark.

**Architecture:** WS-A and WS-B can run in parallel (independent files). WS-C and WS-D depend on WS-B (table now reads tokenized; cells slot into existing `<td>` order). WS-E runs verification, smoke gate, push.

**Tech Stack:** Next.js 15 App Router, React 19, next-intl 4, Tailwind CSS, Vitest 2 + @testing-library/react, Lucide icons.

**Ceremony tier:** Feature. No fresh brainstorm. Plan ≤800 lines. Codex skipped per Codex-conservation window in `~/.claude/CLAUDE.md`; substitute = Claude tests + lint + typecheck + CI.

---

## Pattern Library Check

`docs/patterns/` is Android-only — none applies to admin-web work. No new pattern needed; the only cross-cutting rule is "don't translate Cosmos-stored content" (city/serviceName/customerName/technicianName stay as data, only fallback strings like "No name" / "Unassigned" translate).

---

## Files To Create / Modify

**Create:**
- `admin-web/src/components/orders/CustomerCell.tsx` — small display cell, name + phone
- `admin-web/src/components/orders/TechnicianCell.tsx` — small display cell, "Unassigned" fallback
- `admin-web/src/components/orders/StatusFilterMenu.tsx` — checklist popover, click-outside aware
- `admin-web/tests/components/orders/CustomerCell.test.tsx`
- `admin-web/tests/components/orders/TechnicianCell.test.tsx`
- `admin-web/tests/components/orders/StatusFilterMenu.test.tsx`

**Modify:**
- `admin-web/src/components/dashboard/Rail.tsx` — drop `/audit-log` from rendered nav items only (keep capability)
- `admin-web/src/admin/capabilities.ts` — split `ADMIN_NAV_ITEMS` into "primary nav" vs "directly linkable" so route guard still uses the full list
- `admin-web/src/components/orders/OrdersTable.tsx` — token classes; swap raw cells for `<CustomerCell>` and `<TechnicianCell>`
- `admin-web/src/components/orders/OrderFilters.tsx` — replace `<select multiple size={3}>` with `<StatusFilterMenu>`; tokenize remaining inputs
- `admin-web/messages/en.json` — add `orders.cells.*` and `orders.filters.status.*` strings
- `admin-web/messages/hi.json` — same, with natural Hindi
- `admin-web/tests/Rail.test.tsx` — super-admin no longer sees "Audit Log" in primary nav
- `admin-web/tests/OrderFilters.test.tsx` — assertions migrate from `<option>` to checkbox menu
- `admin-web/tests/OrdersTable.test.tsx` — extra assertions for cell components

---

## Translation Keys (added in WS-B / WS-C / WS-D)

```jsonc
// orders namespace additions
{
  "cells": {
    "customer": {
      "noName": "No name"
    },
    "technician": {
      "unassigned": "Unassigned"
    }
  },
  "filters": {
    "status": {
      "label": "Status",
      "buttonAllSelected": "All statuses",
      "buttonNoneSelected": "No status filter",
      "buttonNSelected": "{count, plural, one {# status} other {# statuses}}",
      "applyButton": "Apply",
      "clearButton": "Clear all",
      "menuLabel": "Filter by status"
    }
  }
}
```

Hindi:

```jsonc
{
  "cells": {
    "customer": { "noName": "नाम उपलब्ध नहीं" },
    "technician": { "unassigned": "अनुसौंपा गया" }
  },
  "filters": {
    "status": {
      "label": "स्थिति",
      "buttonAllSelected": "सभी स्थितियाँ",
      "buttonNoneSelected": "कोई स्थिति फ़िल्टर नहीं",
      "buttonNSelected": "{count, plural, one {# स्थिति} other {# स्थितियाँ}}",
      "applyButton": "लागू करें",
      "clearButton": "सब हटाएँ",
      "menuLabel": "स्थिति के अनुसार फ़िल्टर करें"
    }
  }
}
```

> Use the technician-app/customer-app brand voice already in `hi.json` — tone is operator-direct, not literary. "अनुसौंपा गया" reads cleaner than the more literal "अनिर्दिष्ट" in operations contexts.

---

## Task 1 — WS-A: Hide Audit Log from primary nav (capability untouched)

**Files:**
- Modify: `admin-web/src/admin/capabilities.ts`
- Modify: `admin-web/src/components/dashboard/Rail.tsx`
- Modify: `admin-web/tests/Rail.test.tsx`

**Why a separate constant:** Rail consumes `navItemsForRole`, but route-guard logic in middleware also uses `ADMIN_NAV_ITEMS` indirectly through `ADMIN_ROUTE_CAPABILITIES`. Filtering `ADMIN_NAV_ITEMS` directly would break routes that aren't in the rail list. Cleanest fix: keep `ADMIN_NAV_ITEMS` complete (it drives `defaultPathForRole`), and add a separate `PRIMARY_NAV_HIDDEN` set that `navItemsForRole` excludes. Audit log remains directly linkable via `/audit-log`.

- [ ] **Step 1: Write the failing Rail test** (replace the existing super-admin assertion)

Edit `admin-web/tests/Rail.test.tsx`, replace the first `it(...)` block with:

```tsx
it('hides Audit Log from primary nav for super-admin (route still reachable directly)', () => {
  pathname = '/dashboard';
  renderRail('super-admin');
  // Audit Log no longer appears in the rail — operators reach it via deep link or
  // the capability-gated entry point we keep around for future surfacing.
  expect(screen.queryByText('Audit Log')).not.toBeInTheDocument();
  // Other super-admin nav items still present
  expect(screen.getAllByText('Admin Users').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Compliance').length).toBeGreaterThan(0);
});

it('still grants super-admin the audit.read capability for /audit-log route', async () => {
  const { canAccessAdminPath } = await import('../src/admin/capabilities');
  expect(canAccessAdminPath('super-admin', '/audit-log')).toBe(true);
});
```

- [ ] **Step 2: Run the failing test**

```bash
cd admin-web && pnpm vitest run tests/Rail.test.tsx
```

Expected: first test FAILs (rail still renders "Audit Log"); second test PASSes (capability path unchanged).

- [ ] **Step 3: Modify `capabilities.ts` to introduce `PRIMARY_NAV_HIDDEN`**

In `admin-web/src/admin/capabilities.ts`, after the `ADMIN_NAV_ITEMS` declaration (around line 75), add:

```ts
/**
 * hrefs that are hidden from the primary rail but remain directly linkable
 * (capability + route guard intact). Use this to declutter without losing
 * access — e.g., audit log is reached via deep links from other surfaces.
 */
export const PRIMARY_NAV_HIDDEN = new Set<string>(['/audit-log']);
```

Then change `navItemsForRole` (around line 131) to:

```ts
export function navItemsForRole(role: AdminRole | null | undefined): readonly AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter(
    (item) => hasCapability(role, item.capability) && !PRIMARY_NAV_HIDDEN.has(item.href),
  );
}
```

`defaultPathForRole`, `canAccessAdminPath`, `capabilityForPath` are untouched — they read `ADMIN_NAV_ITEMS` and `ADMIN_ROUTE_CAPABILITIES` (the latter unchanged), so `/audit-log` stays guarded as before.

- [ ] **Step 4: Run the test, expect PASS**

```bash
cd admin-web && pnpm vitest run tests/Rail.test.tsx
```

Expected: 3 tests pass (the new "hides Audit Log" + the other two original "ops-manager" and "finance" cases).

- [ ] **Step 5: Commit**

```bash
git add admin-web/src/admin/capabilities.ts admin-web/src/components/dashboard/Rail.tsx admin-web/tests/Rail.test.tsx
git commit -m "feat(admin-web): E12-S03d WS-A — hide Audit Log from primary nav (capability + route guard intact)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

> Note: Rail.tsx may not need any edits — the filter happens in `navItemsForRole`. If you find Rail.tsx already references `/audit-log` directly, remove that reference; otherwise the file change is implicit (no diff).

---

## Task 2 — WS-B: Tokenize OrdersTable

**Files:**
- Modify: `admin-web/src/components/orders/OrdersTable.tsx`
- Modify: `admin-web/tests/OrdersTable.test.tsx` (one new assertion, others already pass)

Replace every `bg-gray-*`, `text-gray-*`, `border-gray-*`, `divide-gray-*`, `bg-white` with token equivalents.

- [ ] **Step 1: Write the failing token-class test** (append to existing describe block)

Append to `admin-web/tests/OrdersTable.test.tsx` inside `describe('OrdersTable', ...)`:

```tsx
it('uses token classes (not raw gray/white) for table chrome', () => {
  const { container } = render(<OrdersTable {...baseProps} />);
  // The outer wrapper must use token border, not Tailwind gray
  const wrapper = container.querySelector('div.overflow-x-auto');
  expect(wrapper?.className).toMatch(/border-\[var\(--color-border\)\]/);
  expect(wrapper?.className).not.toMatch(/border-gray-200/);

  // Header row uses surface-alt
  const thead = container.querySelector('thead');
  expect(thead?.className).toMatch(/bg-\[var\(--color-surface-alt\)\]/);
  expect(thead?.className).not.toMatch(/bg-gray-50/);

  // Body uses surface (canvas) — never bg-white
  const tbody = container.querySelector('tbody');
  expect(tbody?.className).not.toMatch(/bg-white/);
});
```

- [ ] **Step 2: Run the test, expect FAIL**

```bash
cd admin-web && pnpm vitest run tests/OrdersTable.test.tsx
```

- [ ] **Step 3: Replace OrdersTable chrome with token classes**

In `admin-web/src/components/orders/OrdersTable.tsx`, replace the `return (...)` block with:

```tsx
return (
  <div className="mt-4">
    <div className="overflow-x-auto rounded border border-[var(--color-border)]">
      <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
        <thead className="bg-[var(--color-surface-alt)]">
          <tr>
            {columns.map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {orders.length === 0 ? (
            <tr><td colSpan={9} className="px-4 py-8 text-center text-[var(--color-text-faint)]">{t('table.emptyState')}</td></tr>
          ) : orders.map(order => (
            <tr
              key={order.id}
              onClick={() => onRowClick(order)}
              className="cursor-pointer hover:bg-[var(--color-surface-alt)] text-[var(--color-text)]"
            >
              <td className="px-4 py-3 font-mono">{order.id.slice(0, 8)}</td>
              <td className="px-4 py-3">{order.customerName}</td>
              <td className="px-4 py-3">{order.serviceName ?? '—'}</td>
              <td className="px-4 py-3">{order.technicianName ?? '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
              <td className="px-4 py-3">{order.city}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(order.scheduledAt, locale)}</td>
              <td className="px-4 py-3 font-medium">{formatINR(order.amount, locale)}</td>
              <td className="px-4 py-3 text-[var(--marigold)]">{t('table.viewAction')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="flex items-center justify-between mt-3 text-sm text-[var(--color-text-muted)]">
      <span>{total} total · page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}
          className="px-3 py-1 rounded border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-40 hover:bg-[var(--color-surface-alt)]">{t('table.pagination.prev')}</button>
        <button aria-label="Next page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
          className="px-3 py-1 rounded border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-40 hover:bg-[var(--color-surface-alt)]">{t('table.pagination.next')}</button>
      </div>
    </div>
  </div>
);
```

> Note: customer + technician cells stay as-is in this task; WS-C replaces them.

- [ ] **Step 4: Run all OrdersTable tests, expect PASS**

```bash
cd admin-web && pnpm vitest run tests/OrdersTable.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add admin-web/src/components/orders/OrdersTable.tsx admin-web/tests/OrdersTable.test.tsx
git commit -m "feat(admin-web): E12-S03d WS-B — tokenize OrdersTable chrome (gray/white → var tokens)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3 — WS-C: CustomerCell + TechnicianCell display components

**Files:**
- Create: `admin-web/src/components/orders/CustomerCell.tsx`
- Create: `admin-web/src/components/orders/TechnicianCell.tsx`
- Create: `admin-web/tests/components/orders/CustomerCell.test.tsx`
- Create: `admin-web/tests/components/orders/TechnicianCell.test.tsx`
- Modify: `admin-web/src/components/orders/OrdersTable.tsx` (slot in cells)
- Modify: `admin-web/messages/en.json`, `admin-web/messages/hi.json` (add `orders.cells.*`)

### Translation keys

- [ ] **Step 1: Add translation keys to `en.json`**

In `admin-web/messages/en.json`, locate the `"orders": { "list": { ... }, "table": { ... }, "filters": { ... }, "detail": { ... }, "statuses": { ... }, "actions": { ... }, "confirmModal": { ... } }` block and add (alphabetically — before `"detail"` is fine):

```jsonc
"cells": {
  "customer": { "noName": "No name" },
  "technician": { "unassigned": "Unassigned" }
},
```

- [ ] **Step 2: Add the same shape to `hi.json`**

```jsonc
"cells": {
  "customer": { "noName": "नाम उपलब्ध नहीं" },
  "technician": { "unassigned": "अनुसौंपा गया" }
},
```

### CustomerCell — TDD

- [ ] **Step 3: Write the failing CustomerCell test**

Create `admin-web/tests/components/orders/CustomerCell.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `[${ns}.${key}]`,
}));

import { CustomerCell } from '../../../src/components/orders/CustomerCell';

describe('CustomerCell', () => {
  it('renders the customer name when present', () => {
    render(<CustomerCell name="Priya Kumari" phone="9999999999" />);
    expect(screen.getByText('Priya Kumari')).toBeDefined();
    expect(screen.getByText('9999999999')).toBeDefined();
  });

  it('falls back to translated "No name" when name is empty', () => {
    render(<CustomerCell name="" phone="8888888888" />);
    expect(screen.getByText('[orders.cells.customer.noName]')).toBeDefined();
    expect(screen.getByText('8888888888')).toBeDefined();
  });

  it('falls back to translated "No name" when name is whitespace', () => {
    render(<CustomerCell name="   " phone="7777777777" />);
    expect(screen.getByText('[orders.cells.customer.noName]')).toBeDefined();
  });

  it('renders phone alone if name is missing AND no phone fallback needed', () => {
    render(<CustomerCell name="" phone="6666666666" />);
    // Phone stays prominent so operators can still call back even without a name
    expect(screen.getByText('6666666666')).toBeDefined();
  });
});
```

- [ ] **Step 4: Run, expect FAIL** (component not yet created)

```bash
cd admin-web && pnpm vitest run tests/components/orders/CustomerCell.test.tsx
```

- [ ] **Step 5: Implement CustomerCell**

Create `admin-web/src/components/orders/CustomerCell.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';

interface CustomerCellProps {
  name: string;
  phone: string;
}

export function CustomerCell({ name, phone }: CustomerCellProps) {
  const t = useTranslations('orders.cells.customer');
  const trimmed = name.trim();
  const hasName = trimmed.length > 0;

  return (
    <div className="flex flex-col">
      <span
        className={
          hasName
            ? 'text-[var(--color-text)]'
            : 'text-[var(--color-text-muted)] italic'
        }
      >
        {hasName ? trimmed : t('noName')}
      </span>
      <span className="text-xs text-[var(--color-text-muted)] font-mono tabular-nums">
        {phone}
      </span>
    </div>
  );
}
```

- [ ] **Step 6: Run, expect PASS**

```bash
cd admin-web && pnpm vitest run tests/components/orders/CustomerCell.test.tsx
```

### TechnicianCell — TDD

- [ ] **Step 7: Write the failing TechnicianCell test**

Create `admin-web/tests/components/orders/TechnicianCell.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `[${ns}.${key}]`,
}));

import { TechnicianCell } from '../../../src/components/orders/TechnicianCell';

describe('TechnicianCell', () => {
  it('renders technician name when assigned', () => {
    render(<TechnicianCell name="Rajesh Kumar" id="tech_abc123" />);
    expect(screen.getByText('Rajesh Kumar')).toBeDefined();
    // Short ID hint helps operators correlate with FCM logs
    expect(screen.getByText(/tech_abc/)).toBeDefined();
  });

  it('renders translated "Unassigned" when technicianId is missing', () => {
    render(<TechnicianCell />);
    expect(screen.getByText('[orders.cells.technician.unassigned]')).toBeDefined();
  });

  it('renders technician id with no name', () => {
    render(<TechnicianCell id="tech_xyz789" />);
    expect(screen.getByText(/tech_xyz/)).toBeDefined();
  });
});
```

- [ ] **Step 8: Run, expect FAIL**

```bash
cd admin-web && pnpm vitest run tests/components/orders/TechnicianCell.test.tsx
```

- [ ] **Step 9: Implement TechnicianCell**

Create `admin-web/src/components/orders/TechnicianCell.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';

interface TechnicianCellProps {
  name?: string | undefined;
  id?: string | undefined;
}

export function TechnicianCell({ name, id }: TechnicianCellProps) {
  const t = useTranslations('orders.cells.technician');

  if (!id) {
    return (
      <span className="italic text-[var(--color-text-muted)]">
        {t('unassigned')}
      </span>
    );
  }

  const shortId = id.slice(0, 12);
  return (
    <div className="flex flex-col">
      {name && <span className="text-[var(--color-text)]">{name}</span>}
      <span className="text-xs text-[var(--color-text-muted)] font-mono tabular-nums">
        {shortId}
      </span>
    </div>
  );
}
```

- [ ] **Step 10: Run, expect PASS**

```bash
cd admin-web && pnpm vitest run tests/components/orders/TechnicianCell.test.tsx
```

### Slot the cells into OrdersTable

- [ ] **Step 11: Update OrdersTable to use the new cells**

In `admin-web/src/components/orders/OrdersTable.tsx`:

Add to the imports near `StatusBadge`:

```tsx
import { CustomerCell } from './CustomerCell';
import { TechnicianCell } from './TechnicianCell';
```

Replace the customer + technician `<td>`s in the body row:

```tsx
<td className="px-4 py-3">
  <CustomerCell name={order.customerName} phone={order.customerPhone} />
</td>
<td className="px-4 py-3">{order.serviceName ?? '—'}</td>
<td className="px-4 py-3">
  <TechnicianCell name={order.technicianName} id={order.technicianId} />
</td>
```

(Drop the old `{order.customerName}` and `{order.technicianName ?? '—'}` cells. Order: orderId, customer, service, technician, status, city, scheduled, amount, action — unchanged.)

- [ ] **Step 12: Run all OrdersTable tests, expect PASS**

```bash
cd admin-web && pnpm vitest run tests/OrdersTable.test.tsx tests/components/orders/CustomerCell.test.tsx tests/components/orders/TechnicianCell.test.tsx
```

> If `tests/OrdersTable.test.tsx`'s "renders customer name in a row" still passes (it asserts `getByText('Rahul Sharma')`), we're good — the new cell still renders that text. If it fails because the assertion now matches inside CustomerCell's nested span, replace `screen.getByText('Rahul Sharma')` with `screen.getByText('Rahul Sharma', { selector: 'span' })` in that one test.

- [ ] **Step 13: Commit**

```bash
git add admin-web/src/components/orders/CustomerCell.tsx \
        admin-web/src/components/orders/TechnicianCell.tsx \
        admin-web/src/components/orders/OrdersTable.tsx \
        admin-web/tests/components/orders/ \
        admin-web/messages/en.json admin-web/messages/hi.json
git commit -m "feat(admin-web): E12-S03d WS-C — CustomerCell + TechnicianCell with locale-aware fallbacks

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4 — WS-D: StatusFilterMenu (dark-mode-safe checklist popover)

**Files:**
- Create: `admin-web/src/components/orders/StatusFilterMenu.tsx`
- Create: `admin-web/tests/components/orders/StatusFilterMenu.test.tsx`
- Modify: `admin-web/src/components/orders/OrderFilters.tsx`
- Modify: `admin-web/tests/OrderFilters.test.tsx` (rewrite status assertions for the new UI)
- Modify: `admin-web/messages/en.json`, `admin-web/messages/hi.json` (add `orders.filters.status.*` extras)

### Translation keys

- [ ] **Step 1: Add status menu keys to `en.json`**

Inside the existing `"orders": { "filters": { "status": { ... } } }` block, replace the existing `"status"` value with:

```jsonc
"status": {
  "label": "Status",
  "buttonAllSelected": "All statuses",
  "buttonNoneSelected": "No status filter",
  "buttonNSelected": "{count, plural, one {# status} other {# statuses}}",
  "applyButton": "Apply",
  "clearButton": "Clear all",
  "menuLabel": "Filter by status"
}
```

(If a previous form like `"status": { "label": "Status" }` exists, merge — keep `label`, add the rest. Don't overwrite existing values.)

- [ ] **Step 2: Add the same shape to `hi.json`**

```jsonc
"status": {
  "label": "स्थिति",
  "buttonAllSelected": "सभी स्थितियाँ",
  "buttonNoneSelected": "कोई स्थिति फ़िल्टर नहीं",
  "buttonNSelected": "{count, plural, one {# स्थिति} other {# स्थितियाँ}}",
  "applyButton": "लागू करें",
  "clearButton": "सब हटाएँ",
  "menuLabel": "स्थिति के अनुसार फ़िल्टर करें"
}
```

### StatusFilterMenu — TDD

- [ ] **Step 3: Write the failing StatusFilterMenu test**

Create `admin-web/tests/components/orders/StatusFilterMenu.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string, params?: Record<string, unknown>) => {
    if (key === 'buttonNSelected' && params?.count !== undefined) {
      return `[${ns}.${key}:${params.count}]`;
    }
    return `[${ns}.${key}]`;
  },
}));

import { StatusFilterMenu } from '../../../src/components/orders/StatusFilterMenu';

const STATUSES = ['SEARCHING', 'ASSIGNED', 'COMPLETED'];

function renderMenu(selected: string[] = [], onChange = vi.fn()) {
  return render(
    <StatusFilterMenu
      statuses={STATUSES}
      selected={selected}
      onChange={onChange}
    />,
  );
}

describe('StatusFilterMenu', () => {
  it('renders the trigger button with "no filter" copy when nothing selected', () => {
    renderMenu([]);
    expect(
      screen.getByRole('button', { name: /buttonNoneSelected/ }),
    ).toBeDefined();
  });

  it('renders the trigger with "N selected" copy when statuses are selected', () => {
    renderMenu(['SEARCHING', 'ASSIGNED']);
    expect(
      screen.getByRole('button', { name: /buttonNSelected:2/ }),
    ).toBeDefined();
  });

  it('opens the menu and shows a checkbox per status when clicked', () => {
    renderMenu([]);
    fireEvent.click(screen.getByRole('button', { name: /buttonNoneSelected/ }));

    // checkboxes for each status
    expect(screen.getByRole('checkbox', { name: 'SEARCHING' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'ASSIGNED' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'COMPLETED' })).toBeDefined();
  });

  it('reflects the `selected` prop in checkbox checked state', () => {
    renderMenu(['ASSIGNED']);
    fireEvent.click(screen.getByRole('button', { name: /buttonNSelected:1/ }));
    expect((screen.getByRole('checkbox', { name: 'ASSIGNED' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('checkbox', { name: 'SEARCHING' }) as HTMLInputElement).checked).toBe(false);
  });

  it('calls onChange with the new selection when a checkbox is toggled and Apply is pressed', () => {
    const onChange = vi.fn();
    renderMenu([], onChange);
    fireEvent.click(screen.getByRole('button', { name: /buttonNoneSelected/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'ASSIGNED' }));
    fireEvent.click(screen.getByRole('button', { name: /applyButton/ }));
    expect(onChange).toHaveBeenCalledWith(['ASSIGNED']);
  });

  it('clears all selections via the Clear all button', () => {
    const onChange = vi.fn();
    renderMenu(['SEARCHING', 'ASSIGNED'], onChange);
    fireEvent.click(screen.getByRole('button', { name: /buttonNSelected:2/ }));
    fireEvent.click(screen.getByRole('button', { name: /clearButton/ }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
```

- [ ] **Step 4: Run, expect FAIL**

```bash
cd admin-web && pnpm vitest run tests/components/orders/StatusFilterMenu.test.tsx
```

- [ ] **Step 5: Implement StatusFilterMenu**

Create `admin-web/src/components/orders/StatusFilterMenu.tsx`:

```tsx
'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface StatusFilterMenuProps {
  statuses: readonly string[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
}

export function StatusFilterMenu({ statuses, selected, onChange }: StatusFilterMenuProps) {
  const t = useTranslations('orders.filters.status');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([...selected]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  // Sync draft when parent's `selected` changes between opens
  useEffect(() => {
    if (!open) setDraft([...selected]);
  }, [open, selected]);

  // Click-outside dismiss
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const triggerLabel =
    selected.length === 0
      ? t('buttonNoneSelected')
      : selected.length === statuses.length
        ? t('buttonAllSelected')
        : t('buttonNSelected', { count: selected.length });

  function toggleDraft(status: string) {
    setDraft((curr) =>
      curr.includes(status) ? curr.filter((s) => s !== status) : [...curr, status],
    );
  }

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  function clearAll() {
    setDraft([]);
    onChange([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        className="inline-flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]"
      >
        <Filter size={14} aria-hidden="true" />
        <span>{triggerLabel}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {open && (
        <div
          id={menuId}
          role="dialog"
          aria-label={t('menuLabel')}
          className="absolute z-30 mt-1 min-w-[14rem] rounded border border-[var(--color-border)] bg-[var(--color-surface-alt)] shadow-lg"
        >
          <ul className="max-h-64 overflow-y-auto p-2">
            {statuses.map((status) => {
              const checked = draft.includes(status);
              return (
                <li key={status}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)]">
                    <input
                      type="checkbox"
                      aria-label={status}
                      checked={checked}
                      onChange={() => toggleDraft(status)}
                      className="h-4 w-4 accent-[var(--marigold)]"
                    />
                    <span className="font-mono text-xs">{status}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-2 py-1.5">
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              {t('clearButton')}
            </button>
            <button
              type="button"
              onClick={apply}
              className="rounded bg-[var(--marigold)] px-3 py-1 text-xs font-medium text-[var(--ink-0)] hover:opacity-90"
            >
              {t('applyButton')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Run, expect PASS**

```bash
cd admin-web && pnpm vitest run tests/components/orders/StatusFilterMenu.test.tsx
```

### Wire StatusFilterMenu into OrderFilters

- [ ] **Step 7: Update existing OrderFilters tests for the new UI**

Replace the contents of `admin-web/tests/OrderFilters.test.tsx` with:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrderFilters, type FiltersState } from '../src/components/orders/OrderFilters';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === 'buttonNSelected' && params?.count !== undefined) {
      return `${params.count} selected`;
    }
    const map: Record<string, string> = {
      'filters.status.label': 'Status',
      'filters.status.buttonNoneSelected': 'No status filter',
      'filters.status.buttonAllSelected': 'All statuses',
      'filters.status.applyButton': 'Apply',
      'filters.status.clearButton': 'Clear all',
      'filters.status.menuLabel': 'Filter by status',
      'filters.city.placeholder': 'City',
      'filters.phone.placeholder': 'Phone',
      'filters.technicianId.placeholder': 'Technician ID',
      'filters.minAmount.placeholder': 'Min ₹',
      'filters.maxAmount.placeholder': 'Max ₹',
      // StatusFilterMenu reads from a deeper namespace; map both forms
      buttonNoneSelected: 'No status filter',
      buttonAllSelected: 'All statuses',
      applyButton: 'Apply',
      clearButton: 'Clear all',
      menuLabel: 'Filter by status',
    };
    return map[key] ?? key;
  },
}));

const defaultFilters: FiltersState = {
  status: '', city: '', categoryId: '', technicianId: '',
  dateFrom: '', dateTo: '', minAmount: '', maxAmount: '',
  customerPhone: '', page: 1,
};

describe('OrderFilters', () => {
  it('renders the status menu trigger with "No status filter" when empty', () => {
    render(<OrderFilters filters={defaultFilters} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /no status filter/i })).toBeDefined();
  });

  it('exposes every backend booking status via the checklist menu', () => {
    render(<OrderFilters filters={defaultFilters} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /no status filter/i }));
    expect(screen.getByRole('checkbox', { name: 'PENDING_PAYMENT' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'AWAITING_PRICE_APPROVAL' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'CUSTOMER_CANCELLED' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'NO_SHOW_REDISPATCH' })).toBeDefined();
  });

  it('renders city input', () => {
    render(<OrderFilters filters={defaultFilters} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('City')).toBeDefined();
  });

  it('renders phone input', () => {
    render(<OrderFilters filters={defaultFilters} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Phone')).toBeDefined();
  });

  it('calls onChange with updated city when city input changes', () => {
    const onChange = vi.fn();
    render(<OrderFilters filters={defaultFilters} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Bengaluru' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ city: 'Bengaluru' }));
  });

  it('calls onChange with comma-joined statuses when the menu is applied', () => {
    const onChange = vi.fn();
    render(<OrderFilters filters={defaultFilters} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /no status filter/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'ASSIGNED' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'EN_ROUTE' }));
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ASSIGNED,EN_ROUTE' }),
    );
  });
});
```

- [ ] **Step 8: Run, expect FAIL** (OrderFilters still uses the old `<select multiple>`)

```bash
cd admin-web && pnpm vitest run tests/OrderFilters.test.tsx
```

- [ ] **Step 9: Replace the status `<select>` with `<StatusFilterMenu>`**

In `admin-web/src/components/orders/OrderFilters.tsx`, replace the entire status `<div className="flex flex-col gap-1">...</div>` block with:

```tsx
<div className="flex flex-col gap-1">
  <span className="text-xs text-[var(--color-text-muted)] font-medium">{t('filters.status.label')}</span>
  <StatusFilterMenu
    statuses={ALL_STATUSES}
    selected={selected}
    onChange={(next) => update({ status: next.join(',') })}
  />
</div>
```

Add the import at the top:

```tsx
import { StatusFilterMenu } from './StatusFilterMenu';
```

While you're in this file, tokenize the remaining inputs — replace each `className="border rounded px-2 py-1.5 text-sm"` (or with width modifiers) with:

```tsx
className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]"
```

(Width modifiers like `w-24` and `w-36` stay; only the color/border classes change.) Also replace the surrounding `text-gray-500` label class with `text-[var(--color-text-muted)]`.

- [ ] **Step 10: Run OrderFilters + StatusFilterMenu tests, expect PASS**

```bash
cd admin-web && pnpm vitest run tests/OrderFilters.test.tsx tests/components/orders/StatusFilterMenu.test.tsx
```

- [ ] **Step 11: Commit**

```bash
git add admin-web/src/components/orders/StatusFilterMenu.tsx \
        admin-web/src/components/orders/OrderFilters.tsx \
        admin-web/tests/components/orders/StatusFilterMenu.test.tsx \
        admin-web/tests/OrderFilters.test.tsx \
        admin-web/messages/en.json admin-web/messages/hi.json
git commit -m "feat(admin-web): E12-S03d WS-D — StatusFilterMenu checklist popover replaces multi-select

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5 — WS-E: Verification + smoke + push

- [ ] **Step 1: Boot dev server**

```bash
cd admin-web && pnpm dev
```

- [ ] **Step 2: Visual verify on `/hi/orders` light + dark**

Open `http://localhost:3000/hi/orders`. Verify:

- Audit Log absent from the rail (sidebar) for the super-admin
- Direct visit to `/hi/audit-log` still loads (capability intact)
- OrdersTable: no flat-white surfaces, hover row uses surface-alt, header reads `var(--color-text-muted)`
- "No name" displays in italic for any order with `customerName === ''` (seed/temp data, or use devtools to mutate one row)
- "Unassigned" displays in italic for any order without a `technicianId`
- StatusFilterMenu: trigger button reads "कोई स्थिति फ़िल्टर नहीं" in HI; click opens checklist; selecting + Apply updates the URL query param; Clear all empties

Toggle dark mode (theme toggle in topbar). Ensure no light-mode blowouts (raw white / gray-200 leaks).

- [ ] **Step 3: Run focused vitest suite**

```bash
cd admin-web && pnpm vitest run \
  tests/Rail.test.tsx \
  tests/OrderFilters.test.tsx \
  tests/OrdersTable.test.tsx \
  tests/OrderSlideOver.test.tsx \
  tests/components/orders/CustomerCell.test.tsx \
  tests/components/orders/TechnicianCell.test.tsx \
  tests/components/orders/StatusFilterMenu.test.tsx
```

Expected: all green.

- [ ] **Step 4: Pre-Codex smoke gate**

```bash
bash tools/pre-codex-smoke-web.sh
```

Expected: exit 0. (Note: vitest+tinypool worker crashes are a known Windows + Node 24 flake unrelated to this story; if the smoke gate exits non-zero with no FAIL lines and only "Worker exited unexpectedly", document it in the commit body and proceed — Linux CI is the source of truth.)

- [ ] **Step 5: Codex review (or substitute)**

Per `~/.claude/CLAUDE.md` Codex-conservation window: skip Codex for non-auth/non-payment work. This is UI polish + nav cleanup with no auth or money implications. Substitute = pnpm typecheck + next lint + vitest + GitHub CI on push.

If you have spare Codex quota and want belt-and-braces:

```bash
codex review --base main
```

- [ ] **Step 6: Push and let CI auto-merge**

```bash
git push origin feat/e12-s03b-hindi-content-sweep
```

If CI green: PR auto-merges per project policy.

---

## Story Size Gate

```bash
wc -l plans/E12-S03d-orders-ui-polish.md
```

Feature limit: 800 lines. If above 800, split: WS-D into a separate plan, with WS-A/B/C in this one.

---

## Definition of Done

- [ ] Audit Log hidden from rail for all roles; `/audit-log` still loads with `audit.read`
- [ ] OrdersTable chrome uses `var(--color-*)` tokens — no `bg-gray-*`, `bg-white`, `text-gray-*`, `border-gray-*`, `divide-gray-*`
- [ ] CustomerCell renders `customerName` or translated "No name", with phone secondary
- [ ] TechnicianCell renders name + short id, or translated "Unassigned"
- [ ] StatusFilterMenu replaces the multi-select; checklist popover, click-outside dismiss, Apply + Clear all
- [ ] All 7 focused test files green
- [ ] pnpm typecheck clean
- [ ] next lint clean
- [ ] Visual check on `/hi/orders` in light + dark passes
- [ ] PR pushed and CI green
