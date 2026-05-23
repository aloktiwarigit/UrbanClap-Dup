# E09-S07 — Navigation IA Redesign + Tech Roster + Customer List

**Date:** 2026-05-05  
**Story:** E09-S07  
**Depends on:** E12-S03a (next-intl locale routing, merged in PR #183)  
**Ceremony tier:** Foundation  
**Author:** Alok Tiwari

---

## Context

The current admin-web navigation Rail uses 76px-wide icon-only slots with 2-letter monospace abbreviations (`LO`, `OR`, `CA`, …). The Ayodhya ops-operator persona (Pradeep) is Hindi-first with limited English — 2-letter abbreviations without labels are unusable. The Rail also lacks entries for Technicians and Customers, two screens Pradeep needs for daily ops.

This story does three things:
1. **Replace 2-letter abbreviations** with lucide-react semantic icons + always-visible localized labels.
2. **Add Tech Roster screen** (`/[locale]/technicians`) — full technician management.
3. **Add Customer List screen** (`/[locale]/customers`) — customer management with complaint history.

---

## 1. Capabilities & Data Model

### New capabilities (added to `src/admin/capabilities.ts`)

```typescript
'technicians.manage'   // view + toggle duty + suspend + edit commission + assign categories
'customers.manage'     // view + flag + add note + initiate refund credit
```

### Updated `ROLE_CAPABILITIES`

| Role | New capabilities |
|---|---|
| `super-admin` | `technicians.manage`, `customers.manage` |
| `ops-manager` | `technicians.manage`, `customers.manage` |
| `finance` | — |
| `support-agent` | — |

### Fine-grained action gating within screens

Some actions within the technician screen are super-admin only even if the capability is shared:
- **Edit commission %**: super-admin only (checked via `hasCapability(role, 'finance.approvePayouts')` as a proxy, or add `technicians.editCommission` — see decision below).

Decision: use a single `technicians.manage` capability for screen access. Commission % edit is gated inside the client component via `auth.role === 'super-admin'`. Avoids capability proliferation for MVP.

### `AdminNavItem.icon` field change

`icon: string` changes meaning from a 2-letter abbreviation to a **lucide icon name key** (kebab-case, matches lucide export names). `capabilities.ts` stays React-free — icon resolution happens in `Rail.tsx`.

### Updated `ADMIN_NAV_ITEMS` (all 10 items)

```typescript
{ label: 'Live Ops',     href: '/dashboard',    icon: 'activity',              capability: 'liveOps.read' }
{ label: 'Orders',       href: '/orders',        icon: 'clipboard-list',        capability: 'orders.read' }
{ label: 'Catalogue',    href: '/catalogue',     icon: 'layout-grid',           capability: 'catalogue.manage' }
{ label: 'Finance',      href: '/finance',       icon: 'indian-rupee',          capability: 'finance.read' }
{ label: 'Complaints',   href: '/complaints',    icon: 'message-circle-warning',capability: 'complaints.manage' }
{ label: 'Audit Log',    href: '/audit-log',     icon: 'scroll-text',           capability: 'audit.read' }
{ label: 'Admin Users',  href: '/admin-users',   icon: 'shield-user',           capability: 'adminUsers.manage' }
{ label: 'Compliance',   href: '/compliance',    icon: 'scale',                 capability: 'compliance.manage' }
{ label: 'Technicians',  href: '/technicians',   icon: 'wrench',                capability: 'technicians.manage' }
{ label: 'Customers',    href: '/customers',     icon: 'users-2',               capability: 'customers.manage' }
```

### New route entries in `ADMIN_ROUTE_CAPABILITIES`

```typescript
{ prefix: '/technicians', capability: 'technicians.manage' }
{ prefix: '/customers',   capability: 'customers.manage' }
```

### i18n message keys (added to `messages/en.json` and `messages/hi.json`)

```json
// en.json additions under "nav":
"technicians": "Technicians",
"customers": "Customers"

// hi.json additions under "nav":
"technicians": "तकनीशियन",
"customers": "ग्राहक"
```

Screen-level strings (page headings, table headers, action labels, status badges) also added to both catalogs under `"technicians"` and `"customers"` namespaces.

---

## 2. Rail Redesign

### Layout changes

| Property | Before | After |
|---|---|---|
| Width | `76px` | `192px` |
| Item layout | Icon centered | `[icon 20px] [gap 12px] [label 13px]` horizontal row |
| Active indicator | Background only | Background + 2px left accent bar (`var(--marigold)`) |
| Font | `var(--font-mono) 0.7rem 700` | `var(--font-body) 0.8125rem 500` |
| Labels | Hidden (aria-label only) | Always visible, from `useTranslations('nav')` |
| Logo mark | `HS` text badge | Unchanged (brand rename Phase 2) |

### Icon resolution in `Rail.tsx`

```typescript
import {
  Activity, ClipboardList, LayoutGrid, IndianRupee,
  MessageCircleWarning, ScrollText, ShieldUser, Scale,
  Wrench, Users2,
} from 'lucide-react';

const NAV_ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  'activity':               Activity,
  'clipboard-list':         ClipboardList,
  'layout-grid':            LayoutGrid,
  'indian-rupee':           IndianRupee,
  'message-circle-warning': MessageCircleWarning,
  'scroll-text':            ScrollText,
  'shield-user':            ShieldUser,
  'scale':                  Scale,
  'wrench':                 Wrench,
  'users-2':                Users2,
};
```

### Pathname active-check fix

`Rail.tsx` switches from `next/navigation`'s `usePathname()` (returns `/hi/dashboard`) to next-intl's `usePathname()` from `@/lib/i18n/navigation` (returns `/dashboard`, locale-stripped). This makes the active-check `pathname === item.href` work correctly.

### Mobile bottom bar

Same items, icon (18px) + short label (11px) stacked vertically. Shows first 5 items. Width of each cell: flex 1.

---

## 3. Tech Roster Screen

### Files

```
app/[locale]/(dashboard)/technicians/page.tsx          ← server component, fetches initial data
app/[locale]/(dashboard)/technicians/TechnicianRosterClient.tsx  ← client component
```

### API dependency

`GET /v1/admin/technicians` (new endpoint in `api/`)

Response shape:
```typescript
{
  technicians: Array<{
    id: string;
    name: string;
    phone: string;           // masked: +91 XXXXX-X1234
    status: 'ON_DUTY' | 'OFF_DUTY' | 'SUSPENDED';
    kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
    kycDocumentUrl?: string; // present when VERIFIED
    serviceCategories: string[];
    commissionPct: number;   // 0–100
    activeBookingCount: number;
    lastActiveAt: string;    // ISO-8601
  }>;
}
```

Mutations:
- `PATCH /v1/admin/technicians/:id` — `{ status }` (toggle duty / suspend)
- `PATCH /v1/admin/technicians/:id` — `{ commissionPct }` (super-admin only)
- `PATCH /v1/admin/technicians/:id` — `{ serviceCategories }` (replace list)

### Table columns

| Column | Role access | Notes |
|---|---|---|
| Name + initials avatar | All | — |
| Phone (masked) | All | — |
| Service categories | All | Badge list |
| Status | All | ON_DUTY green · OFF_DUTY gray · SUSPENDED red |
| KYC | All | Pill + link if VERIFIED |
| Commission % | super-admin only | Inline `<input type="number">`, PATCH on blur |
| Active bookings | All | Count badge |
| Toggle duty | ops-manager, super-admin | ON_DUTY ↔ OFF_DUTY |
| Suspend / Reactivate | ops-manager, super-admin | SUSPENDED ↔ ACTIVE |

### Search & filter

- Text input: filters name + phone client-side
- Status dropdown: ALL / ON_DUTY / OFF_DUTY / SUSPENDED
- No server-side pagination (≤50 techs at pilot scale)

### i18n status labels (hi.json)

```
ON_DUTY    → "ऑन ड्यूटी"
OFF_DUTY   → "ऑफ ड्यूटी"
SUSPENDED  → "निलंबित"
VERIFIED   → "सत्यापित"
PENDING    → "लंबित"
REJECTED   → "अस्वीकृत"
```

---

## 4. Customer List Screen

### Files

```
app/[locale]/(dashboard)/customers/page.tsx          ← server component
app/[locale]/(dashboard)/customers/CustomerListClient.tsx  ← client component
```

### API dependency

`GET /v1/admin/customers` (new endpoint in `api/`)

Response shape:
```typescript
{
  customers: Array<{
    id: string;
    name: string;
    phone: string;           // masked
    city: string;
    bookingCount: number;
    lastBookingDate: string; // ISO-8601
    accountStatus: 'ACTIVE' | 'FLAGGED';
    openComplaintCount: number;
    recentBookings: Array<{  // last 5
      date: string; service: string; techName: string; status: string;
    }>;
    recentComplaints: Array<{ // last 3
      date: string; category: string; resolution: string;
    }>;
    notes: Array<{ text: string; createdAt: string; authorName: string }>;
  }>;
}
```

Mutations:
- `PATCH /v1/admin/customers/:id` — `{ accountStatus: 'FLAGGED' | 'ACTIVE' }`
- `POST /v1/admin/customers/:id/notes` — `{ text: string }`
- `POST /v1/admin/customers/:id/refund-credit` — `{ amountRupees: number; reason: string }`

### Table columns

| Column | Notes |
|---|---|
| Name | Click → inline row expansion |
| Phone (masked) | — |
| City | — |
| Bookings | Count |
| Last booking | Relative date |
| Open complaints | Count badge, red if > 0 |
| Account status | ACTIVE · FLAGGED pill |
| Actions | Flag toggle · Add note · Refund credit |

### Expanded row (inline)

Opens below the row on click (accordion). Shows:
- Last 5 bookings: date, service name, tech name, status
- Last 3 complaints: date, category, resolution
- Notes thread (chronological, newest first)

### Action: Refund credit

Inline form that appears in place of the action buttons:
- Amount input (INR, integer)
- Reason textarea (max 200 chars)
- Submit → `POST /v1/admin/customers/:id/refund-credit`
- Role gate: `auth.role === 'super-admin' || auth.role === 'ops-manager'`

### i18n status labels (hi.json)

```
ACTIVE   → "सक्रिय"
FLAGGED  → "चिह्नित"
```

---

## 5. Testing

### Unit tests

- `tests/capabilities.test.ts` — new capabilities in role maps, navItemsForRole with new items, canAccessAdminPath for /technicians and /customers
- `tests/technicians.page.test.tsx` — server component renders TechnicianRosterClient with fetched data; handles API error gracefully (empty list)
- `tests/customers.page.test.tsx` — same pattern

### Storybook

- `Rail.stories.tsx` — super-admin rail (all 10 items), ops-manager rail (8 items, no audit/admin-users), active state highlight
- `TechnicianRosterClient.stories.tsx` — full list, empty state, super-admin vs ops-manager action visibility
- `CustomerListClient.stories.tsx` — full list, expanded row, flagged state

### E2E (Playwright)

- Rail shows localized labels in Hindi on `/hi/dashboard`
- Rail active indicator correctly highlights current page
- `/hi/technicians` accessible to ops-manager role mock-cookie
- `/hi/customers` accessible to ops-manager role mock-cookie
- Commission % input hidden for ops-manager
- Refund credit form visible for super-admin

---

## 6. Work Streams (for plan)

```
WS-A: Capabilities + API endpoints (data layer)
      - capabilities.ts: 2 new capabilities, updated roles, updated nav items, updated route map
      - api/: GET /v1/admin/technicians, GET /v1/admin/customers, PATCH/POST mutations
      - messages/: new i18n keys in en.json + hi.json

WS-B: Rail redesign (depends on WS-A types)
      - Rail.tsx: lucide icons, 192px, labels, active bar, next-intl pathname
      - lucide-react install

WS-C: Tech Roster screen (parallel with WS-D after WS-A)
      - app/[locale]/(dashboard)/technicians/page.tsx
      - TechnicianRosterClient.tsx
      - TDD: tests/technicians.page.test.tsx first

WS-D: Customer List screen (parallel with WS-C)
      - app/[locale]/(dashboard)/customers/page.tsx
      - CustomerListClient.tsx
      - TDD: tests/customers.page.test.tsx first

WS-E: Storybook + E2E + smoke gate → Codex review
```

---

## 7. Out of Scope

- Technician detail page (full profile view) — Phase 2
- Customer detail page — Phase 2
- Bulk actions (bulk suspend, bulk flag) — Phase 2
- Technician onboarding flow from admin — separate story
- Pagination / infinite scroll — not needed at pilot scale (≤50 techs, ≤200 customers)
- Push notifications to technicians from roster — Phase 2
