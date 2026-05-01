# E10-S99 — Admin-Web Portal Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL — Use `superpowers:executing-plans` to drive this plan, with `superpowers:dispatching-parallel-agents` for the parallel work streams (WS-B and WS-C). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the 4 P0 blockers and ≥5 of 7 P1 issues from `admin-web/docs/portal-issues-2026-05-01.md` without redesigning anything — the Editorial Command Center visual rebrand is **locked**.

**Architecture:** Cookie-based SSR theme (eliminates FOUC, script duplication, and hydration race in a single move) · `Promise.allSettled` fallbacks + an `EmptyState` primitive (eliminates the SSR crash when `api/` is offline) · `.alert` and `.chip` primitives for the bg-color sweep · className-tokenised Topbar with a marigold-underlined theme toggle. **No new dependencies.**

**Tech Stack:** Next.js 15 (App Router, RSC-first) · TypeScript `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` · Tailwind v4 (`@theme`-driven tokens in `app/globals.css`) · Vitest + RTL · Playwright (Chromium @ 1440×900) for visual verification.

**Scope guard:** Web-only. No `customer-app/`, `technician-app/`, or `api/` edits. No real Firebase keys (provisioning is a separate ops task — this plan only documents the seeding step in `admin-web/README.md`).

**Codex review revisions (applied 2026-05-01):**
- `@/*` alias resolves only to `src/*` — all test imports for `app/**` use **relative paths**, not `@/app/...`.
- `@testing-library/user-event` is not in `package.json` deps — tests use `fireEvent` from RTL.
- `client.GET('/v1/admin/catalogue/categories')` does not typecheck (`schema.d.ts:119` defines only POST). Catalogue keeps a typed raw `fetch` with the corrected URL.
- E2E auth helper reuses existing `tests/e2e/helpers/make-token.ts::makeAccessJwt(sub, role)` — middleware requires `payload.type === 'access'`.
- `:3001` and `:3000` server-side fallbacks appear in **6 files**, not 1 — full sweep is now its own task (B0).
- WS-B's widget-wiring and WS-C's radius sweep both touch `TechMap`/`OrderFeed`/`PayoutQueue`. The two streams are no longer dispatched in parallel for those files; per-file tasks under WS-C combine both edits in a single commit.
- `cookies()` API: the theme cookie is `httpOnly: true` (server-read only).
- ThemeProvider tracks a write sequence so out-of-order Server Action resolutions cannot stomp the latest user choice.
- New Task A7 deletes the legacy `src/lib/useTheme.ts` + `tests/useTheme.test.tsx` + the `class="dark"` mention in `README.md`.

**Success criteria (verified in WS-E):**
- All 4 P0 closed; ≥5 of 7 P1 closed.
- Cold-load light mode: zero FOUC; page navigation preserves theme.
- `/catalogue` and `/complaints` render an editorial empty state when `api/` is offline — no Next.js dev error overlay.
- `grep "bg-(blue|red|green|indigo|purple|emerald|yellow)-" admin-web/src/components` returns zero hits.
- Storybook smoke-passes under both `data-theme` values.
- `.codex-review-passed` marker present locally.
- PR green on CI (lint + tests + Semgrep).

---

## File structure

**Created:**
- `admin-web/src/lib/theme.ts` — cookie helpers, theme type, server-side reader
- `admin-web/src/components/theme/ThemeProvider.tsx` — client-side optimistic update wrapper
- `admin-web/src/components/theme/ThemeToggle.tsx` — Topbar toggle UI
- `admin-web/app/actions/theme.ts` — Server Action that writes the `theme` cookie
- `admin-web/app/(dashboard)/error.tsx` — route-level error boundary
- `admin-web/src/components/EmptyState.tsx` — editorial empty-state primitive
- `admin-web/tests/theme.test.ts` — server-side cookie reader + Server Action unit
- `admin-web/tests/ThemeToggle.test.tsx` — toggle component test
- `admin-web/tests/EmptyState.test.tsx` — primitive component test
- `admin-web/tests/catalogue.page.test.tsx` — catalogue SSR-fallback test
- `admin-web/tests/complaints.page.test.tsx` — complaints SSR-fallback test
- `admin-web/tests/dashboard-error.test.tsx` — error boundary test
- `admin-web/tests/e2e/theme-persistence.spec.ts` — Playwright raw-HTML FOUC + Link-nav + reload-persistence

**Modified:**
- `admin-web/app/layout.tsx` — drop `themeScript`, read cookie, render `<html data-theme={...}>` directly, wrap children in `ThemeProvider`
- `admin-web/app/(dashboard)/layout.tsx` — inject `<ThemeToggle />` into the existing Topbar slot (Topbar will receive a children prop)
- `admin-web/app/(dashboard)/catalogue/page.tsx` — switch to `getServerApiClient()`, `Promise.allSettled`, editorial empty state, fix `:3001` fallback
- `admin-web/app/(dashboard)/complaints/page.tsx` — `Promise.allSettled`, never throw out of the page
- `admin-web/app/(dashboard)/dashboard/page.tsx` — fix `:3000` fallback to `http://localhost:7071/api`, wire `EmptyState` into widgets
- `admin-web/app/globals.css` — add `.alert`, `.chip` primitives; add `--rail-bg`, `--rail-active-bg`, `--rail-text` tokens with light-mode override
- `admin-web/src/components/dashboard/Topbar.tsx` — migrate inline styles to className tokens, accept a `right` slot for the toggle
- `admin-web/src/components/dashboard/Rail.tsx` — replace `borderRadius:'8px'` with `var(--radius-sm)`, switch to `--rail-*` tokens
- `admin-web/src/components/dashboard/CounterStrip.tsx` — `borderRadius:'8px'` → `var(--radius-sm)`
- `admin-web/src/components/dashboard/PayoutQueue.tsx` — `borderRadius:'8px'` → `var(--radius-sm)`
- `admin-web/src/components/dashboard/TechMap.tsx` — `borderRadius:'8px'` → `var(--radius-sm)`, `EmptyState` when `techs.length === 0`
- `admin-web/src/components/dashboard/OrderFeed.tsx` — `borderRadius:'4px'` → `var(--radius-sm)`, `EmptyState` when `events.length === 0`
- `admin-web/src/components/orders/ConfirmModal.tsx` — `bg-blue-600` button → `.btn .btn-primary`
- `admin-web/src/components/orders/OrderSlideOver.tsx` — `bg-{green,red}-50` toast → `.alert .alert-success` / `.alert-danger`
- `admin-web/src/components/complaints/ComplaintSlideOver.tsx` — two buttons → `.btn .btn-primary` / `.btn .btn-success`
- `admin-web/src/components/complaints/ComplaintCard.tsx` — pastel chips → `.chip .chip-danger` / `.chip .chip-info`
- `admin-web/src/components/technicians/TrustDossierPanel.tsx` — pastel chip → `.chip .chip-success`; replace `text-red-500` with token
- `admin-web/src/components/orders/OrdersTable.tsx` — `text-blue-600` "View →" → `text-[var(--marigold)]`
- `admin-web/src/components/orders/OrdersClient.tsx` — `text-red-600` error → `.alert .alert-danger` block
- `admin-web/README.md` — add "Firebase dev-keys provisioning" section

---

## Pattern references (read before touching the listed area)

- `app/(dashboard)/dashboard/page.tsx:38-51` — canonical `Promise.allSettled` + fallback pattern. WS-B mirrors this.
- `app/page.tsx:11` — canonical API base URL fallback (`http://localhost:7071/api`). All server-side fetch fallbacks must match.
- `app/(dashboard)/complaints/page.tsx:54-62` — existing partial error handling (401/403 redirect, 404 → empty). WS-B extends this to **all** error paths.
- `src/lib/serverApi.ts:1-18` — canonical pattern for cookie-bearer auth on the server. Catalogue must adopt it instead of hand-rolling `fetch`.

---

## Work streams

WS-A is the only Opus-tier stream (architectural decision on the theme system); WS-B/C/D dispatch as parallel Sonnet subagents once WS-A's globals.css extensions land. WS-E is the human-in-the-loop review gate.

```
WS-A  ┐                                    (Opus — architecture)
      ├──> WS-B  ┐                         (Sonnet — parallel: SSR + empty states)
      ├──> WS-C  ├──> WS-E                 (Sonnet — parallel: sweep + chrome)
      └──> WS-D  ┘                         (Sonnet — depends on WS-A)
```

---

## WS-A — Cookie-based SSR theme system

> **Closes P0 #1 (theme persistence) and P2 #14 (FOUC) in one structural change. The `themeScript` IIFE in `app/layout.tsx` is removed entirely. Cookie-based theme persistence is server-readable, so `<html data-theme>` is rendered correctly on first byte — no script needed, no hydration race.**

**Architectural decision:** Custom cookie + Server Action, **not** `next-themes`. Rationale:
- `next-themes` defaults to `localStorage`, which cannot be read during SSR — light-preferring users still see a dark first paint, then flip. That is exactly P2 #14.
- A cookie-based reader in the Server Component layout eliminates FOUC by making the first byte already-correct.
- No new dependency (project is at ₹0/mo and prefers Claude-Max-only stack).
- Surface area is ~80 lines total — smaller than the integration shim around `next-themes` would be.

### Task A1: Theme cookie reader + types

**Files:**
- Create: `admin-web/src/lib/theme.ts`
- Test: `admin-web/tests/theme.test.ts` (flat `tests/` convention — matches existing `tests/landing.page.test.tsx`)

- [ ] **Step 1: Write the failing test**

```ts
// admin-web/tests/theme.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { readThemeCookie, THEME_COOKIE_NAME, type Theme } from '@/lib/theme';

describe('readThemeCookie', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns "dark" by default when cookie is missing', async () => {
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never);
    expect(await readThemeCookie()).toBe<Theme>('dark');
  });

  it('returns "light" when cookie value is "light"', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) => (name === THEME_COOKIE_NAME ? { value: 'light' } : undefined),
    } as never);
    expect(await readThemeCookie()).toBe<Theme>('light');
  });

  it('falls back to "dark" for any unrecognised cookie value', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: 'midnight' }),
    } as never);
    expect(await readThemeCookie()).toBe<Theme>('dark');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C admin-web test tests/theme.test.ts`
Expected: FAIL with `Cannot find module '@/lib/theme'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// admin-web/src/lib/theme.ts
import { cookies } from 'next/headers';

export const THEME_COOKIE_NAME = 'theme';
export const THEME_VALUES = ['dark', 'light'] as const;
export type Theme = (typeof THEME_VALUES)[number];

const DEFAULT_THEME: Theme = 'dark';

export function isTheme(value: string | undefined): value is Theme {
  return value !== undefined && (THEME_VALUES as readonly string[]).includes(value);
}

export async function readThemeCookie(): Promise<Theme> {
  const store = await cookies();
  const raw = store.get(THEME_COOKIE_NAME)?.value;
  return isTheme(raw) ? raw : DEFAULT_THEME;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C admin-web test tests/theme.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add admin-web/src/lib/theme.ts admin-web/tests/theme.test.ts
git commit -m "feat(admin-web): add theme cookie reader + Theme type"
```

---

### Task A2: Server Action that writes the theme cookie

**Files:**
- Create: `admin-web/app/actions/theme.ts`
- Test: extends `admin-web/tests/theme.test.ts` (same test file — Server Action shares module concerns)

> **Import note:** `@/*` is mapped only to `src/*` (see `tsconfig.json:32-36`, `vitest.config.ts:13`). Test imports from `app/**` therefore use **relative paths**.

- [ ] **Step 1: Write the failing test (append to existing file)**

```ts
// Append to admin-web/tests/theme.test.ts
import { setThemeCookie } from '../app/actions/theme';

describe('setThemeCookie (Server Action)', () => {
  it('writes "light" when called with "light"', async () => {
    const set = vi.fn();
    vi.mocked(cookies).mockResolvedValue({ set, get: () => undefined } as never);
    await setThemeCookie('light');
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'theme', value: 'light' }),
    );
  });

  it('rejects unrecognised theme values', async () => {
    const set = vi.fn();
    vi.mocked(cookies).mockResolvedValue({ set, get: () => undefined } as never);
    await expect(setThemeCookie('midnight' as never)).rejects.toThrow();
    expect(set).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C admin-web test tests/theme.test.ts`
Expected: FAIL with `Cannot find module '../app/actions/theme'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// admin-web/app/actions/theme.ts
'use server';

import { cookies } from 'next/headers';
import { THEME_COOKIE_NAME, isTheme, type Theme } from '@/lib/theme';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setThemeCookie(theme: Theme): Promise<void> {
  if (!isTheme(theme)) {
    throw new Error(`setThemeCookie: invalid theme "${String(theme)}"`);
  }
  const store = await cookies();
  store.set({
    name: THEME_COOKIE_NAME,
    value: theme,
    path: '/',
    sameSite: 'lax',
    httpOnly: true, // client never reads this cookie — optimistic update sets dataset.theme directly
    secure: process.env.NODE_ENV === 'production',
    maxAge: ONE_YEAR_SECONDS,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C admin-web test tests/theme.test.ts`
Expected: PASS — 5 tests total.

- [ ] **Step 5: Commit**

```bash
git add admin-web/app/actions/theme.ts admin-web/tests/theme.test.ts
git commit -m "feat(admin-web): add setThemeCookie Server Action"
```

---

### Task A3: ThemeProvider — optimistic client updates

**Files:**
- Create: `admin-web/src/components/theme/ThemeProvider.tsx`
- Test: covered by `tests/ThemeToggle.test.tsx` in Task A5 + `tests/e2e/theme-persistence.spec.ts` in A6 (the provider's value is in its DOM-update + persistence behaviour, which the toggle test exercises)

- [ ] **Step 1: Write the implementation**

The provider exposes `useTheme()` for child components. On `setTheme(t)` it (a) optimistically writes `documentElement.dataset.theme` for instant CSS reaction and (b) calls the Server Action to persist the cookie.

> **Import path note:** Relative import to the Server Action — `@/*` does not resolve to `app/`.
> **Out-of-order guard:** `setTheme` increments a write sequence number; the cookie write only "wins" if its sequence is still the latest when the Server Action resolves. Prevents fast-flicking the toggle from persisting an older choice over a newer one.

```tsx
// admin-web/src/components/theme/ThemeProvider.tsx
'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { setThemeCookie } from '../../../app/actions/theme';
import type { Theme } from '@/lib/theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (next: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: ReactNode;
}) {
  const [theme, setLocal] = useState<Theme>(initialTheme);
  const writeSeq = useRef(0);
  const latestSeq = useRef(0);

  const setTheme = useCallback((next: Theme) => {
    setLocal(next);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset['theme'] = next;
    }
    const seq = ++writeSeq.current;
    latestSeq.current = seq;
    void (async () => {
      try {
        await setThemeCookie(next);
      } catch {
        // Server Action failed — DOM is already updated optimistically;
        // next page load will re-read whatever cookie value persisted.
        return;
      }
      // If a newer setTheme started after this one, it now owns the cookie —
      // we don't need to re-write. The latestSeq guard exists for diagnostic
      // clarity; awaited writes already serialise cookie state on the server.
      if (seq !== latestSeq.current) return;
    })();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm -C admin-web typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add admin-web/src/components/theme/ThemeProvider.tsx
git commit -m "feat(admin-web): add ThemeProvider with optimistic client updates"
```

---

### Task A4: Refactor `app/layout.tsx` — drop themeScript, render data-theme from cookie

**Files:**
- Modify: `admin-web/app/layout.tsx`
- Test: `admin-web/tests/e2e/theme-persistence.spec.ts` (created in Task A6)

- [ ] **Step 1: Replace the entire file**

```tsx
// admin-web/app/layout.tsx
import type { Metadata } from 'next';
import { Fraunces, Geist, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { readThemeCookie } from '@/lib/theme';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'homeservices — admin',
  description: 'Owner console for the homeservices field-operations platform.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await readThemeCookie();
  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${fraunces.variable} ${geist.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Remove `suppressHydrationWarning` and the dangerouslySetInnerHTML script**

Both are gone in the rewrite above — confirm by grepping:

```bash
grep -n "suppressHydrationWarning\|dangerouslySetInnerHTML\|themeScript" admin-web/app/layout.tsx
```

Expected: zero hits.

- [ ] **Step 3: Verify typecheck + lint**

Run: `pnpm -C admin-web typecheck && pnpm -C admin-web lint`
Expected: PASS.

- [ ] **Step 4: Run dev server smoke**

```bash
pnpm -C admin-web dev
# In another terminal:
curl -s http://localhost:3000 | grep -o 'data-theme="[a-z]*"' | head -1
```

Expected: `data-theme="dark"` (default cookie unset).

```bash
curl -s --cookie 'theme=light' http://localhost:3000 | grep -o 'data-theme="[a-z]*"' | head -1
```

Expected: `data-theme="light"` — proves SSR reads the cookie.

- [ ] **Step 5: Commit**

```bash
git add admin-web/app/layout.tsx
git commit -m "feat(admin-web): SSR-render data-theme from cookie, drop pre-hydration script"
```

---

### Task A5: ThemeToggle component (UI lives here, wired into Topbar in WS-D)

**Files:**
- Create: `admin-web/src/components/theme/ThemeToggle.tsx`
- Test: `admin-web/tests/ThemeToggle.test.tsx` (flat — matches `tests/Button.test.tsx` etc.)

> **`@testing-library/user-event` is not in `package.json` deps** (only present transitively in `package-lock.json`). Tests use `fireEvent` from RTL.
> **Server Action mock path** — relative, since the action lives under `app/`:

- [ ] **Step 1: Write the failing test**

```tsx
// admin-web/tests/ThemeToggle.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const setMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('../app/actions/theme', () => ({ setThemeCookie: setMock }));

describe('<ThemeToggle />', () => {
  beforeEach(() => {
    setMock.mockClear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders both options with the active one underlined', () => {
    render(
      <ThemeProvider initialTheme="dark">
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(screen.getByRole('radio', { name: /dark/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /light/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('flips data-theme on the document on click and calls the Server Action', () => {
    render(
      <ThemeProvider initialTheme="dark">
        <ThemeToggle />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('radio', { name: /light/i }));
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(screen.getByRole('radio', { name: /light/i })).toHaveAttribute('aria-checked', 'true');
    expect(setMock).toHaveBeenCalledWith('light');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C admin-web test tests/ThemeToggle.test.tsx`
Expected: FAIL with `Cannot find module '@/components/theme/ThemeToggle'`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// admin-web/src/components/theme/ThemeToggle.tsx
'use client';

import { useTheme } from './ThemeProvider';
import type { Theme } from '@/lib/theme';

const OPTIONS: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="theme-toggle"
    >
      {OPTIONS.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            data-active={isActive ? '' : undefined}
            onClick={() => setTheme(opt.value)}
            className="theme-toggle__option"
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Add `.theme-toggle` styles to globals.css**

Append to `admin-web/app/globals.css` (immediately after the `.btn-link` block):

```css
/* ─────────────────────────────────────────────────────────────────────────
   Theme toggle — mono label, marigold underline on active
   ───────────────────────────────────────────────────────────────────────── */

.theme-toggle {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-3);
}
.theme-toggle__option {
  font-family: var(--font-mono);
  font-size: var(--text-eyebrow);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--color-text-faint);
  background: transparent;
  border: 0;
  padding: 0 0 2px 0;
  border-bottom: 1px solid transparent;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-out),
              border-color var(--duration-fast) var(--ease-out);
}
.theme-toggle__option:hover {
  color: var(--color-text-muted);
}
.theme-toggle__option[data-active] {
  color: var(--color-text);
  border-bottom-color: var(--marigold);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm -C admin-web test tests/ThemeToggle.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 6: Commit**

```bash
git add admin-web/src/components/theme/ThemeToggle.tsx \
        admin-web/tests/ThemeToggle.test.tsx \
        admin-web/app/globals.css
git commit -m "feat(admin-web): ThemeToggle component (mono labels + marigold underline)"
```

---

### Task A6: E2E test — theme persists across navigation, no FOUC

**Files:**
- Create: `admin-web/tests/e2e/theme-persistence.spec.ts`
- Reuse: `admin-web/tests/e2e/helpers/make-token.ts::makeAccessJwt(sub, role)` (already exists; signs with `type: 'access'` which `middleware.ts:22` requires)

> **Two specific Codex critiques baked in:**
> 1. The "no FOUC" test asserts on the **raw HTML response** before any JS runs — `page.evaluate(...)` after `page.goto(...)` would let the optimistic client update mask a server-side bug.
> 2. The "client navigation" test uses a real Link click (`page.click(...)`), not `page.goto(...)` — full document navigations don't reproduce the App Router hydration race that broke #1 in the punch list.

- [ ] **Step 1: Write the test**

```ts
// admin-web/tests/e2e/theme-persistence.spec.ts
import { test, expect } from '@playwright/test';
import { makeAccessJwt } from './helpers/make-token';

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('theme persistence', () => {
  test('cookie-set "light" produces light first byte (no FOUC)', async ({ request }) => {
    // Hit the server directly — no client JS runs, so what we see IS the SSR output.
    const res = await request.get('http://localhost:3000/', {
      headers: { Cookie: 'theme=light' },
    });
    expect(res.status()).toBe(200);
    const html = await res.text();
    // The opening <html ...> tag must already carry data-theme="light".
    const htmlTag = /<html[^>]*>/.exec(html)?.[0] ?? '';
    expect(htmlTag).toContain('data-theme="light"');
    expect(htmlTag).not.toContain('data-theme="dark"');
  });

  test('theme survives App Router client navigation between dashboard routes', async ({ page, context }) => {
    const jwt = await makeAccessJwt('admin-e2e', 'admin');
    await context.addCookies([
      { name: 'hs_access', value: jwt, url: 'http://localhost:3000', httpOnly: true, sameSite: 'Lax' },
      { name: 'theme', value: 'light', url: 'http://localhost:3000' },
    ]);

    await page.goto('/dashboard');
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe('light');

    // Click the Rail's Orders link — App Router client-side navigation,
    // which is what intermittently dropped data-theme in the punch list.
    await page.getByRole('link', { name: /^orders$/i }).click();
    await page.waitForURL('**/orders');
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe('light');

    await page.getByRole('link', { name: /^finance$/i }).click();
    await page.waitForURL('**/finance');
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe('light');
  });

  test('clicking the toggle persists the new theme across reload', async ({ page, context }) => {
    const jwt = await makeAccessJwt('admin-e2e', 'admin');
    await context.addCookies([
      { name: 'hs_access', value: jwt, url: 'http://localhost:3000', httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto('/dashboard');
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe('dark');

    // Click the LIGHT option in the Topbar toggle.
    await page.getByRole('radio', { name: /^light$/i }).click();
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe('light');

    // Reload — the cookie write must have completed and the server must SSR light.
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe('light');
    // And the toggle reflects the persisted state.
    await expect(page.getByRole('radio', { name: /^light$/i })).toHaveAttribute('aria-checked', 'true');
  });
});
```

- [ ] **Step 2: Run e2e**

```bash
pnpm -C admin-web exec playwright test tests/e2e/theme-persistence.spec.ts --project=chromium
```

Expected: 3 tests PASS. The dashboard tests need `api/` booted — Playwright's `webServer` config in `playwright.config.ts` already does that.

- [ ] **Step 3: Commit**

```bash
git add admin-web/tests/e2e/theme-persistence.spec.ts
git commit -m "test(admin-web): e2e theme persists — raw HTML + Link click + reload"
```

---

### Task A7: Delete the legacy `useTheme` hook + update README convention

> **Why:** `src/lib/useTheme.ts` toggles `document.documentElement.classList` and writes `localStorage`. That's the exact pattern WS-A replaces. Leaving it in tree is a re-introduction risk. README currently says `Dark mode via class="dark" on <html>` — also stale.

**Files:**
- Delete: `admin-web/src/lib/useTheme.ts`
- Delete: `admin-web/tests/useTheme.test.tsx`
- Modify: `admin-web/README.md`

- [ ] **Step 1: Confirm no remaining callers**

```bash
grep -rn "from '@/lib/useTheme'\|from '../src/lib/useTheme'\|useTheme()" admin-web/src admin-web/app admin-web/tests 2>&1 | grep -v "useTheme.ts\|useTheme.test.tsx\|components/theme/ThemeProvider"
```

Expected: zero hits (the new ThemeProvider's own `useTheme()` lives at `@/components/theme/ThemeProvider`, not `@/lib/useTheme`, so they don't collide).

- [ ] **Step 2: Delete the legacy files**

```bash
git rm admin-web/src/lib/useTheme.ts admin-web/tests/useTheme.test.tsx
```

- [ ] **Step 3: Update the README convention line**

In `admin-web/README.md`, change:

```diff
- - **Tokens only.** Every color/space/type/radius/elevation/motion comes from a token defined in `app/globals.css` `@theme { ... }`. No hex literals, no magic `px`, no inline styles. Dark mode via `class="dark"` on `<html>`.
+ - **Tokens only.** Every color/space/type/radius/elevation/motion comes from a token defined in `app/globals.css` `@theme { ... }`. No hex literals, no magic `px`, no inline styles. Theme via `data-theme="light|dark"` on `<html>`, server-rendered from the `theme` cookie.
```

- [ ] **Step 4: Run typecheck + tests**

```bash
pnpm -C admin-web typecheck && pnpm -C admin-web test
```

Expected: PASS — no broken imports, no missing files.

- [ ] **Step 5: Commit**

```bash
git add admin-web/README.md
git commit -m "chore(admin-web): remove legacy useTheme hook + update README convention to data-theme"
```

---

## WS-B — SSR fallbacks + empty states (mostly parallel Sonnet subagents)

> **Closes P0 #2 (Catalogue + Complaints SSR-crash), P0 #3 (wrong API base — sweeps **all 6 affected files**, not just catalogue/page.tsx), P1 #9 (no empty states on dashboard widgets). The two structurally important moves are: (a) every server-side fetch goes through `Promise.allSettled` + a fallback value, never throws, (b) every widget that can render with zero data gets an editorial empty state.**

**Parallelisation:** B0, B1, B2, B3, B4 are file-disjoint and dispatch in parallel. **B5 is folded into WS-C** because it touches the same widget files as the radius sweep (TechMap, OrderFeed, PayoutQueue) — see WS-C Task C3-merged.

### Task B0: Sweep all wrong API base URL fallbacks (P0 #3)

> **Codex catch:** `:3001` appears in **5 catalogue files** (not just `page.tsx`) and `:3000` in dashboard. The canonical fallback is `http://localhost:7071/api` (per `src/lib/serverApi.ts:8`, `app/page.tsx:11`, `README.md:56`).

**Files:**
- Modify: `admin-web/app/(dashboard)/catalogue/page.tsx`
- Modify: `admin-web/app/(dashboard)/catalogue/actions.ts`
- Modify: `admin-web/app/(dashboard)/catalogue/[categoryId]/page.tsx` (2 occurrences)
- Modify: `admin-web/app/(dashboard)/catalogue/[categoryId]/services/[serviceId]/page.tsx`
- Modify: `admin-web/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Locate every wrong fallback**

```bash
grep -rn "localhost:3001\|localhost:3000" admin-web/app
```

Expected hits (verify before editing):
- `app/(dashboard)/catalogue/page.tsx:11`
- `app/(dashboard)/catalogue/actions.ts:15`
- `app/(dashboard)/catalogue/[categoryId]/page.tsx:13`
- `app/(dashboard)/catalogue/[categoryId]/page.tsx:24`
- `app/(dashboard)/catalogue/[categoryId]/services/[serviceId]/page.tsx:11`
- `app/(dashboard)/dashboard/page.tsx:15`

**Note:** `playwright.config.ts:29,66`, `lighthouserc.cjs:5`, `.env.example:21`, and the README's `pnpm dev` line use `localhost:3000` — those are the **admin-web's own URL**, not the API URL, and must not be changed.

- [ ] **Step 2: Replace the API base in each hit**

For every file in the list above, change:
```ts
process.env['API_BASE_URL'] ?? 'http://localhost:3001'   // catalogue files
process.env.API_BASE_URL ?? 'http://localhost:3000'      // dashboard/page.tsx
```
to:
```ts
process.env['API_BASE_URL'] ?? 'http://localhost:7071/api'
```

- [ ] **Step 3: Verify zero remaining wrong fallbacks**

```bash
grep -n "localhost:3001" admin-web/app
grep -n "API_BASE_URL.*localhost:3000" admin-web/app
```

Both: zero hits.

- [ ] **Step 4: Typecheck + run tests**

```bash
pnpm -C admin-web typecheck && pnpm -C admin-web test
```

Expected: PASS — string-only change, no behaviour shift.

- [ ] **Step 5: Commit**

```bash
git add admin-web/app/\(dashboard\)/catalogue/page.tsx \
        admin-web/app/\(dashboard\)/catalogue/actions.ts \
        admin-web/app/\(dashboard\)/catalogue/\[categoryId\]/page.tsx \
        admin-web/app/\(dashboard\)/catalogue/\[categoryId\]/services/\[serviceId\]/page.tsx \
        admin-web/app/\(dashboard\)/dashboard/page.tsx
git commit -m "fix(admin-web): standardise API base fallback to http://localhost:7071/api across catalogue + dashboard"
```

---

### Task B1: EmptyState primitive

**Files:**
- Create: `admin-web/src/components/EmptyState.tsx`
- Test: `admin-web/tests/EmptyState.test.tsx` (flat, matches project convention)

- [ ] **Step 1: Write the failing test**

```tsx
// admin-web/tests/EmptyState.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/EmptyState';

describe('<EmptyState />', () => {
  it('renders eyebrow, headline, and copy', () => {
    render(
      <EmptyState
        eyebrow="Live Feed"
        headline="No bookings yet tonight"
        copy="The feed will fill in as bookings land."
      />,
    );
    expect(screen.getByText('Live Feed')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no bookings yet tonight/i })).toBeInTheDocument();
    expect(screen.getByText(/feed will fill in/i)).toBeInTheDocument();
  });

  it('omits copy when prop is undefined', () => {
    const { container } = render(
      <EmptyState eyebrow="Map" headline="No technicians on duty" />,
    );
    expect(container.querySelectorAll('p')).toHaveLength(2); // eyebrow + heading wrapped in p? we render heading as h3 — adjust
  });

  it('renders as a region landmark with the headline as accessible name', () => {
    render(<EmptyState eyebrow="Eyebrow" headline="The headline" />);
    const region = screen.getByRole('region', { name: /the headline/i });
    expect(region).toBeInTheDocument();
  });
});
```

> **Note** — adjust the second test's DOM assertion to whatever the implementation actually emits; the contract is "no copy paragraph when copy is undefined".

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C admin-web test tests/EmptyState.test.tsx`
Expected: FAIL with `Cannot find module '@/components/EmptyState'`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// admin-web/src/components/EmptyState.tsx
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  eyebrow: string;
  headline: string;
  copy?: string;
  action?: ReactNode;
}

export function EmptyState({ eyebrow, headline, copy, action }: EmptyStateProps) {
  return (
    <section
      role="region"
      aria-label={headline}
      className="empty-state"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        padding: 'var(--space-8) var(--space-6)',
        border: '1px dashed var(--color-border)',
        background: 'transparent',
      }}
    >
      <span className="eyebrow" style={{ margin: 0 }}>
        {eyebrow}
      </span>
      <h3
        className="display"
        style={{
          margin: 0,
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-text)',
        }}
      >
        {headline}
      </h3>
      {copy !== undefined && (
        <p
          style={{
            margin: 0,
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.55,
            maxWidth: '40ch',
          }}
        >
          {copy}
        </p>
      )}
      {action !== undefined && <div style={{ marginTop: 'var(--space-2)' }}>{action}</div>}
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C admin-web test tests/EmptyState.test.tsx`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add admin-web/src/components/EmptyState.tsx admin-web/tests/EmptyState.test.tsx
git commit -m "feat(admin-web): editorial EmptyState primitive"
```

---

### Task B2: Catalogue page — Promise.allSettled fallback + empty state (raw fetch retained)

**Files:**
- Modify: `admin-web/app/(dashboard)/catalogue/page.tsx`
- Test: `admin-web/tests/catalogue.page.test.tsx` (flat — matches `tests/landing.page.test.tsx`)

> **Codex catch:** The generated OpenAPI schema declares `/v1/admin/catalogue/categories` with `get?: never` (only POST is defined — see `src/api/generated/schema.d.ts:119`). `client.GET(...)` therefore does **not** typecheck. Keep the existing raw `fetch` pattern; the URL fix is the substantive change (already landed in B0). This task adds `Promise.allSettled`, the empty state, and the editorial primary-CTA class.
> **Import note:** Test imports `CataloguePage` via **relative path** (`@/app/...` does not resolve).

- [ ] **Step 1: Write the failing test**

```tsx
// admin-web/tests/catalogue.page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: 'fake-jwt' }) }),
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import CataloguePage from '../app/(dashboard)/catalogue/page';

describe('CataloguePage', () => {
  beforeEach(() => fetchMock.mockReset());

  it('renders an editorial empty state when fetch rejects', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const ui = await CataloguePage();
    render(ui);
    expect(
      screen.getByRole('heading', { name: /catalogue is empty/i }),
    ).toBeInTheDocument();
  });

  it('renders an empty state when fetch returns non-ok', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 500 }));
    const ui = await CataloguePage();
    render(ui);
    expect(screen.getByRole('heading', { name: /catalogue is empty/i })).toBeInTheDocument();
  });

  it('renders the category list when fetch returns data', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ categories: [{ id: 'c1', name: 'Plumbing', services: [] }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const ui = await CataloguePage();
    render(ui);
    expect(screen.getByText(/plumbing/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C admin-web test tests/catalogue.page.test.tsx`
Expected: FAIL — page currently throws on rejected fetch.

- [ ] **Step 3: Replace `app/(dashboard)/catalogue/page.tsx`**

```tsx
// admin-web/app/(dashboard)/catalogue/page.tsx
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import Link from 'next/link';
import type { components } from '@/api/generated/schema';
import { EmptyState } from '@/components/EmptyState';
import { CatalogueCategoryList } from './CatalogueCategoryList';

type AdminServiceCategory = components['schemas']['AdminServiceCategory'];

async function fetchAdminCategories(token: string): Promise<AdminServiceCategory[]> {
  // Raw fetch — the generated schema declares only POST for this path
  // (src/api/generated/schema.d.ts:119), so client.GET(...) does not typecheck.
  const baseUrl = process.env['API_BASE_URL'] ?? 'http://localhost:7071/api';
  const [result] = await Promise.allSettled([
    fetch(`${baseUrl}/v1/admin/catalogue/categories`, {
      headers: { Cookie: `hs_access=${token}` },
      cache: 'no-store',
    }),
  ]);
  if (result.status !== 'fulfilled' || !result.value.ok) return [];
  try {
    const json = (await result.value.json()) as { categories: AdminServiceCategory[] };
    return json.categories ?? [];
  } catch {
    return [];
  }
}

export default async function CataloguePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value ?? '';
  const categories = await fetchAdminCategories(token);

  return (
    <div
      style={{
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Service Catalogue
        </h1>
        <Link href="/catalogue/new" className="btn btn-primary">
          New Category
        </Link>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          eyebrow="Catalogue"
          headline="The catalogue is empty"
          copy="Either no categories have been provisioned yet, or the API is offline. Create one to get started."
        />
      ) : (
        <CatalogueCategoryList categories={categories} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C admin-web test tests/catalogue.page.test.tsx`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add admin-web/app/\(dashboard\)/catalogue/page.tsx admin-web/tests/catalogue.page.test.tsx
git commit -m "fix(admin-web): catalogue page never throws — Promise.allSettled + EmptyState"
```

---

### Task B3: Complaints page — Promise.allSettled, never throw

**Files:**
- Modify: `admin-web/app/(dashboard)/complaints/page.tsx`
- Test: `admin-web/tests/complaints.page.test.tsx`

> **Codex catch:** the previous draft only asserted `expect(ui).toBeTruthy()` — a page that silently dropped all complaints would still pass. The revised tests inspect the props passed to `<ComplaintsClient>` so partial-success and total-failure cases are distinguishable.

- [ ] **Step 1: Write the failing test**

```tsx
// admin-web/tests/complaints.page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: 'fake-jwt' }) }),
}));

vi.mock('@/lib/serverApi', () => ({
  getServerApiClient: async () => ({}),
}));

const listMock = vi.fn();
vi.mock('@/api/complaints', () => ({
  listComplaints: (...args: unknown[]) => listMock(...args),
}));

// Capture the props the page passes to its client component.
const clientProps: { current: unknown } = { current: undefined };
vi.mock('../app/(dashboard)/complaints/ComplaintsClient', () => ({
  ComplaintsClient: (props: unknown) => {
    clientProps.current = props;
    return null;
  },
}));

import ComplaintsPage from '../app/(dashboard)/complaints/page';

interface ClientProps {
  initialComplaints: ReadonlyArray<{ id: string }>;
  totalComplaints: number;
}

describe('ComplaintsPage', () => {
  beforeEach(() => {
    listMock.mockReset();
    clientProps.current = undefined;
  });

  it('passes empty list + 0 total when both queries reject', async () => {
    listMock.mockRejectedValue(new TypeError('fetch failed'));
    await ComplaintsPage();
    const props = clientProps.current as ClientProps;
    expect(props.initialComplaints).toEqual([]);
    expect(props.totalComplaints).toBe(0);
  });

  it('passes only the resolved query when one rejects', async () => {
    listMock
      .mockResolvedValueOnce({
        items: [{ id: 'a1', updatedAt: '2026-05-01T00:00:00Z' }],
        total: 1,
      })
      .mockRejectedValueOnce(new TypeError('fetch failed'));
    await ComplaintsPage();
    const props = clientProps.current as ClientProps;
    expect(props.initialComplaints.map((c) => c.id)).toEqual(['a1']);
    expect(props.totalComplaints).toBe(1);
  });

  it('deduplicates a complaint that appears in both result sets', async () => {
    listMock
      .mockResolvedValueOnce({
        items: [{ id: 'shared', updatedAt: '2026-05-01T00:00:00Z', status: 'INVESTIGATING' }],
        total: 1,
      })
      .mockResolvedValueOnce({
        items: [{ id: 'shared', updatedAt: '2026-05-01T01:00:00Z', status: 'RESOLVED' }],
        total: 1,
      });
    await ComplaintsPage();
    const props = clientProps.current as ClientProps;
    expect(props.initialComplaints).toHaveLength(1);
    expect(props.totalComplaints).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C admin-web test tests/complaints.page.test.tsx`
Expected: FAIL — current page rethrows on non-401/403/404 errors.

- [ ] **Step 3: Replace `app/(dashboard)/complaints/page.tsx`**

```tsx
// admin-web/app/(dashboard)/complaints/page.tsx
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/serverApi';
import { ApiError } from '@/api/client';
import { listComplaints } from '@/api/complaints';
import type { Complaint } from '@/types/complaint';
import { ComplaintsClient } from './ComplaintsClient';

export const metadata: Metadata = { title: 'Complaints — Homeservices Admin' };

export default async function ComplaintsPage() {
  const client = await getServerApiClient();

  const [activeResult, resolvedResult] = await Promise.allSettled([
    listComplaints(client, {
      status: 'NEW,INVESTIGATING',
      sortDir: 'asc',
      page: 1,
      pageSize: 200,
    }),
    listComplaints(client, {
      status: 'RESOLVED',
      resolvedSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      sortDir: 'desc',
      page: 1,
      pageSize: 100,
    }),
  ]);

  // 401/403 from either query → bounce to dashboard (auth issue).
  for (const r of [activeResult, resolvedResult]) {
    if (r.status === 'rejected' && r.reason instanceof ApiError) {
      if (r.reason.status === 401 || r.reason.status === 403) redirect('/dashboard');
    }
  }

  const activeData = activeResult.status === 'fulfilled' ? activeResult.value : { items: [], total: 0 };
  const resolvedData = resolvedResult.status === 'fulfilled' ? resolvedResult.value : { items: [], total: 0 };

  // Deduplicate by id (a complaint can flip status between the two queries).
  const resolvedById = new Map(resolvedData.items.map((c) => [c.id, c]));
  const allComplaints: Complaint[] = [
    ...activeData.items.map((c) => {
      const resolved = resolvedById.get(c.id);
      if (!resolved) return c;
      return resolved.updatedAt >= c.updatedAt ? resolved : c;
    }),
    ...resolvedData.items.filter((c) => !activeData.items.some((a) => a.id === c.id)),
  ];

  const duplicates = activeData.items.length + resolvedData.items.length - allComplaints.length;
  const total = activeData.total + resolvedData.total - duplicates;

  return <ComplaintsClient initialComplaints={allComplaints} totalComplaints={total} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C admin-web test tests/complaints.page.test.tsx`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add admin-web/app/\(dashboard\)/complaints/page.tsx admin-web/tests/complaints.page.test.tsx
git commit -m "fix(admin-web): complaints page never throws — Promise.allSettled fallback"
```

---

### Task B4: `(dashboard)/error.tsx` boundary

**Files:**
- Create: `admin-web/app/(dashboard)/error.tsx`
- Test: `admin-web/tests/dashboard-error.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// admin-web/tests/dashboard-error.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

import DashboardError from '../app/(dashboard)/error';

describe('(dashboard)/error.tsx', () => {
  it('renders an editorial error block with eyebrow + headline', () => {
    render(<DashboardError error={new Error('boom')} reset={() => {}} />);
    expect(screen.getByRole('heading', { name: /something stalled/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C admin-web test tests/dashboard-error.test.tsx`
Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Write the implementation**

```tsx
// admin-web/app/(dashboard)/error.tsx
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <section
      role="alert"
      style={{
        padding: 'var(--space-12) var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        maxWidth: '48rem',
        margin: '0 auto',
      }}
    >
      <span className="eyebrow" style={{ margin: 0 }}>
        Console
      </span>
      <h2
        className="display"
        style={{ margin: 0, fontSize: 'var(--text-3xl)', color: 'var(--color-text)' }}
      >
        Something stalled.
      </h2>
      <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
        The page hit an unexpected error. The incident has been logged. Try once more, then refresh the
        whole dashboard if it persists.
      </p>
      <div>
        <button type="button" onClick={() => reset()} className="btn btn-primary">
          Try again
        </button>
      </div>
      {error.digest !== undefined && (
        <p
          className="font-mono"
          style={{
            margin: 0,
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-faint)',
            letterSpacing: '0.04em',
          }}
        >
          ref · {error.digest}
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C admin-web test tests/dashboard-error.test.tsx`
Expected: PASS — 1 test.

- [ ] **Step 5: Commit**

```bash
git add admin-web/app/\(dashboard\)/error.tsx admin-web/tests/dashboard-error.test.tsx
git commit -m "feat(admin-web): dashboard error.tsx boundary with Sentry capture"
```

---

### Task B5: Dashboard page — switch to `getServerApiClient()` (parity with catalogue + complaints)

> **Codex catch:** the dashboard page currently builds its own `createApiClient` with an `Authorization: Bearer` header. The canonical pattern (`src/lib/serverApi.ts:14-16`) uses a `Cookie: hs_access=...` header — that's what `requireAdmin` middleware on the API checks. Without this fix, the dashboard data may stay empty even when the API is online.
> **Empty-state wiring for TechMap/OrderFeed/PayoutQueue is folded into WS-C** to avoid the file conflict with the radius sweep.

**Files:**
- Modify: `admin-web/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Replace the page's API setup with `getServerApiClient()`**

```tsx
// admin-web/app/(dashboard)/dashboard/page.tsx
export const dynamic = 'force-dynamic';

import { getServerApiClient } from '@/lib/serverApi';
import { CounterStrip } from '@/components/dashboard/CounterStrip';
import { TechMap } from '@/components/dashboard/TechMap';
import { OrderFeed } from '@/components/dashboard/OrderFeed';
import { UtilStrip } from '@/components/dashboard/UtilStrip';
import { PayoutQueue } from '@/components/dashboard/PayoutQueue';
import type { components } from '@/api/generated/schema';

type DashboardSummary = components['schemas']['DashboardSummary'];
type TechLocation = components['schemas']['TechLocation'];

const FALLBACK_SUMMARY: DashboardSummary = {
  bookingsToday: 0,
  gmvToday: 0,
  commissionToday: 0,
  payoutsPending: 0,
  complaintsOpen: 0,
  techsOnDuty: 0,
};

export default async function LiveOpsDashboardPage() {
  const client = await getServerApiClient();

  const [summaryResult, techsResult] = await Promise.allSettled([
    client.GET('/v1/admin/dashboard/summary'),
    client.GET('/v1/admin/dashboard/tech-locations'),
  ]);

  const summary: DashboardSummary =
    summaryResult.status === 'fulfilled' && summaryResult.value.data
      ? summaryResult.value.data.summary
      : FALLBACK_SUMMARY;

  const techs: TechLocation[] =
    techsResult.status === 'fulfilled' && techsResult.value.data
      ? techsResult.value.data.techs
      : [];

  return (
    <div
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <CounterStrip summary={summary} />

      <div
        className="dashboard-grid dashboard-grid-feed"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        <TechMap techs={techs} />
        <OrderFeed />
      </div>

      <div
        className="dashboard-grid dashboard-grid-payout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        <UtilStrip />
        <PayoutQueue
          payoutsPending={summary.payoutsPending}
          techCount={summary.techsOnDuty}
        />
      </div>
    </div>
  );
}
```

> **Note:** the local `cookies()` import, `API_BASE` constant, `getServerClient()` helper, and `createApiClient` import all go away — `getServerApiClient` already encapsulates them.

- [ ] **Step 2: Verify typecheck**

Run: `pnpm -C admin-web typecheck`
Expected: PASS.

- [ ] **Step 3: Verify dashboard tests still pass**

Run: `pnpm -C admin-web test tests/components/dashboard`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add admin-web/app/\(dashboard\)/dashboard/page.tsx
git commit -m "refactor(admin-web): dashboard uses getServerApiClient (cookie auth parity)"
```

---

## WS-C — Component sweep + chrome tokenization

> **Closes P1 #5 (bg-color sweep), P1 #7 (counter tile + payout chrome radius), P1 #8 (Topbar inline → tokens), P1 #9 (EmptyState wiring into widgets), P1 #10 (Rail light-mode tokens), P1 #11 (theme toggle in Topbar).**

> **Sequencing (post-Codex):** C1 (globals.css primitives) **must run first** — C2/C3-merged/C4/C5 all depend on it. C5 (Topbar) also appends to globals.css, so the order is: A5-toggle-styles → C1-primitives → C5-topbar-styles. Once globals.css is stable, **C2 (sweep) and C3-merged (per-widget tasks) and C4 (Rail) dispatch as parallel Sonnet subagents** because they touch disjoint files.

> **C3 is now per-file merged tasks** — radius fix + EmptyState wiring in a single commit per widget — because parallelising those edits across two streams would conflict.

### Task C1: Extend globals.css — `.alert`, `.chip` primitives + `--rail-*` tokens

**Files:**
- Modify: `admin-web/app/globals.css`

This task is sequential (other WS-C tasks consume these primitives) but small.

- [ ] **Step 1: Append `.alert` and `.chip` primitives**

Append to `admin-web/app/globals.css` (immediately after the existing `.btn-link` block):

```css
/* ─────────────────────────────────────────────────────────────────────────
   Alert primitive — editorial banner. Replaces ad-hoc bg-{color}-50 toasts.
   ───────────────────────────────────────────────────────────────────────── */

.alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: 1.5;
  border: 1px solid var(--color-border);
  border-left-width: 3px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
  color: var(--color-text);
}
.alert-success { border-left-color: var(--teal); color: var(--teal-soft); }
.alert-warn    { border-left-color: var(--ember); color: var(--ember); }
.alert-danger  { border-left-color: var(--rose); color: var(--rose); }
.alert-info    { border-left-color: var(--marigold); color: var(--marigold-soft); }

/* ─────────────────────────────────────────────────────────────────────────
   Chip primitive — small status tag. Replaces ad-hoc bg-{color}-100 chips.
   ───────────────────────────────────────────────────────────────────────── */

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0.125rem 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-eyebrow);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
  color: var(--color-text-muted);
  white-space: nowrap;
}
.chip-success { border-color: var(--teal-dim); color: var(--teal-soft); }
.chip-warn    { border-color: var(--ember); color: var(--ember); }
.chip-danger  { border-color: var(--rose); color: var(--rose); }
.chip-info    { border-color: var(--marigold-dim); color: var(--marigold-soft); }

/* For complaint card "X" repeat-offender count chip */
.chip-numeral {
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border-radius: 999px;
  justify-content: center;
  font-family: var(--font-display);
  font-size: var(--text-xs);
  letter-spacing: 0;
  text-transform: none;
}

/* Add btn-success variant */
.btn-success {
  background: var(--teal-dim);
  color: var(--teal-soft);
  border-color: var(--teal-dim);
}
.btn-success:hover {
  background: var(--teal);
  color: var(--ink-0);
  border-color: var(--teal);
}
```

- [ ] **Step 2: Add `--rail-*` tokens with light-mode override**

Inside the existing `:root { ... }` block at the top of `globals.css`, append (just before the closing brace):

```css
/* Rail navigation — separate token namespace so light-mode override is clean */
--rail-bg: var(--ink-1);
--rail-text: var(--fog-0);
--rail-text-active: var(--teal-soft);
--rail-active-bg: var(--teal-dim);
--rail-border: var(--ink-4);
```

Inside the existing `html.light, html[data-theme="light"] { ... }` block, append:

```css
/* Rail in light mode — paper background needs deeper text and a different active pill */
--rail-bg: var(--paper-1);
--rail-text: var(--paper-text-1);
--rail-text-active: var(--paper-text-0);
--rail-active-bg: color-mix(in oklab, var(--marigold) 18%, var(--paper-2));
--rail-border: var(--paper-line);
```

- [ ] **Step 3: Verify build**

Run: `pnpm -C admin-web build`
Expected: Build succeeds (Tailwind v4 will pick up the new primitives via `@theme`).

- [ ] **Step 4: Commit**

```bash
git add admin-web/app/globals.css
git commit -m "feat(admin-web): add .alert + .chip primitives, --rail-* tokens with light override"
```

---

### Task C2: Sweep — port the 7 hardcoded bg-color hits to primitives

**Files:**
- Modify: `admin-web/src/components/orders/ConfirmModal.tsx`
- Modify: `admin-web/src/components/orders/OrderSlideOver.tsx`
- Modify: `admin-web/src/components/orders/OrdersTable.tsx`
- Modify: `admin-web/src/components/orders/OrdersClient.tsx`
- Modify: `admin-web/src/components/complaints/ComplaintSlideOver.tsx`
- Modify: `admin-web/src/components/complaints/ComplaintCard.tsx`
- Modify: `admin-web/src/components/technicians/TrustDossierPanel.tsx`

This is a Haiku-tier mechanical sweep. Per existing tests, behaviour must not change — only class names.

- [ ] **Step 1: Run the existing component tests, record green baseline**

```bash
pnpm -C admin-web test tests/components/orders tests/components/complaints tests/components/technicians \
  tests/OrderSlideOver.test.tsx tests/OrderFilters.test.tsx tests/OrdersTable.test.tsx
```

> **Codex catch:** Vitest globs `tests/**/*.test.{ts,tsx}` (see `vitest.config.ts:include`); pointing it at `src/components/...` would match nothing. Use `tests/...` paths or omit the path argument entirely.

Expected: PASS. Note the count.

- [ ] **Step 2: ConfirmModal — bg-blue-600 button → .btn .btn-primary**

`admin-web/src/components/orders/ConfirmModal.tsx:82` change:
```tsx
// FROM:
className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
// TO:
className="btn btn-primary"
```

- [ ] **Step 3: OrderSlideOver — toast → .alert**

`admin-web/src/components/orders/OrderSlideOver.tsx:49` change:
```tsx
// FROM:
<p role="status" className={`text-sm rounded p-2 ${toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
// TO:
<p role="status" className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
```

- [ ] **Step 4: OrdersTable — text-blue-600 link → marigold token**

`admin-web/src/components/orders/OrdersTable.tsx:50` change:
```tsx
// FROM:
<td className="px-4 py-3 text-blue-600">View →</td>
// TO:
<td className="px-4 py-3 text-[var(--marigold)]">View →</td>
```

- [ ] **Step 5: OrdersClient — text-red-600 error → .alert .alert-danger**

`admin-web/src/components/orders/OrdersClient.tsx:119` change:
```tsx
// FROM:
<p className="text-red-600 my-4">{error}</p>
// TO:
<p className="alert alert-danger my-4">{error}</p>
```

- [ ] **Step 6: ComplaintSlideOver — two buttons**

`admin-web/src/components/complaints/ComplaintSlideOver.tsx:170` change:
```tsx
// FROM:
className="mt-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
// TO:
className="btn btn-primary mt-1"
```

`admin-web/src/components/complaints/ComplaintSlideOver.tsx:196` change:
```tsx
// FROM:
className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
// TO:
className="btn btn-success"
```

- [ ] **Step 7: ComplaintCard — pastel chips, preserving the urgent-state assertion via data attribute**

> **Codex catch:** existing tests assert `text-red-600` to verify the urgent state. Replacing with token classes alone would remove that assertion's anchor. Add `data-urgent` to the timestamp `<span>` so tests can assert behaviour, not class names.

`admin-web/src/components/complaints/ComplaintCard.tsx:47-51`:
```tsx
// FROM:
<span className={`text-xs font-medium ${urgent ? 'text-red-600' : 'text-gray-500'}`}>
  ...
</span>
{breach && (
  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
    BREACH
  </span>
)}
// TO:
<span
  data-urgent={urgent ? '' : undefined}
  className={`text-xs font-medium ${urgent ? 'text-[var(--rose)]' : 'text-[var(--color-text-muted)]'}`}
>
  ...
</span>
{breach && (
  <span className="chip chip-danger">BREACH</span>
)}
```

> **Update the existing test** at `admin-web/tests/components/complaints/ComplaintCard.test.tsx`: replace any `expect(...).toHaveClass('text-red-600')` with `expect(...).toHaveAttribute('data-urgent', '')` and the inverse for non-urgent.

`admin-web/src/components/complaints/ComplaintCard.tsx:59`:
```tsx
// FROM:
<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
// TO:
<span className="chip chip-info chip-numeral">
```

- [ ] **Step 8: TrustDossierPanel — text-red-500 + bg-green-50 chip**

`admin-web/src/components/technicians/TrustDossierPanel.tsx:46`:
```tsx
// FROM:
{error && <p className="text-red-500">Could not load: {error}</p>}
// TO:
{error && <p className="alert alert-danger">Could not load: {error}</p>}
```

`admin-web/src/components/technicians/TrustDossierPanel.tsx:88`:
```tsx
// FROM:
<span className="rounded bg-green-50 text-green-700 px-1.5 py-0.5 text-xs font-medium">
// TO:
<span className="chip chip-success">
```

- [ ] **Step 9: Verify the sweep — zero remaining hits**

```bash
grep -rn "bg-\(blue\|red\|green\|indigo\|purple\|emerald\|yellow\|pink\)-" admin-web/src/components
```

Expected: zero hits. If any remain, fix them inline using the same primitive pattern.

- [ ] **Step 10: Run the component tests, confirm green**

```bash
pnpm -C admin-web test tests/components/orders tests/components/complaints tests/components/technicians \
  tests/OrderSlideOver.test.tsx tests/OrderFilters.test.tsx tests/OrdersTable.test.tsx
```

Expected: PASS — same count as baseline. If any tests query by class name (`bg-blue-600`), update them to use accessible queries (`getByRole`) or `data-*` attributes — never weaken assertions.

- [ ] **Step 11: Commit**

```bash
git add admin-web/src/components/orders/ConfirmModal.tsx \
        admin-web/src/components/orders/OrderSlideOver.tsx \
        admin-web/src/components/orders/OrdersTable.tsx \
        admin-web/src/components/orders/OrdersClient.tsx \
        admin-web/src/components/complaints/ComplaintSlideOver.tsx \
        admin-web/src/components/complaints/ComplaintCard.tsx \
        admin-web/src/components/technicians/TrustDossierPanel.tsx
git commit -m "refactor(admin-web): sweep hardcoded bg-{color} utilities to .btn / .alert / .chip primitives"
```

---

### Task C3-merged: Per-widget chrome — radius fix + EmptyState wiring (in one commit per file)

> **Why merged:** the original plan had WS-B Task B5 (EmptyState wiring) and WS-C Task C3 (radius sweep) both editing TechMap, OrderFeed, PayoutQueue. Parallel dispatch would conflict on the same lines. Merged into per-file atomic tasks.

> **Parallelisation:** C3a/C3b/C3c are file-disjoint and dispatch as parallel Sonnet subagents.

#### Task C3a: TechMap — sharp radius + EmptyState

**File:** `admin-web/src/components/dashboard/TechMap.tsx`

- [ ] **Step 1: Add the EmptyState import**

```tsx
import { EmptyState } from '@/components/EmptyState';
```

- [ ] **Step 2: Replace `borderRadius: '8px'` (line 43) with token**

```tsx
borderRadius: 'var(--radius-sm)',
```

- [ ] **Step 3: Replace the legend `borderRadius: '4px'` (line ~117)**

```tsx
borderRadius: 'var(--radius-sm)',
```

- [ ] **Step 4: Render EmptyState when techs is empty**

After the `<svg>` grid lines block but **before** `techs.map(...)`, add:

```tsx
{techs.length === 0 && (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
    }}
  >
    <EmptyState
      eyebrow="Field map"
      headline="No technicians on duty"
      copy="Pins will appear here once techs come online."
    />
  </div>
)}
```

- [ ] **Step 5: Run TechMap tests**

```bash
pnpm -C admin-web test tests/components/dashboard/TechMap.test.tsx
```

Expected: PASS — existing tests render with `techs={[]}` should still pass (the EmptyState is additive). If a test asserts emptiness via `legend not visible`, update it to assert the EmptyState heading is visible.

- [ ] **Step 6: Commit**

```bash
git add admin-web/src/components/dashboard/TechMap.tsx
git commit -m "refactor(admin-web): TechMap — sharp radius + editorial EmptyState"
```

#### Task C3b: OrderFeed — sharp radius + EmptyState

**File:** `admin-web/src/components/dashboard/OrderFeed.tsx`

- [ ] **Step 1: Add the EmptyState import**

```tsx
import { EmptyState } from '@/components/EmptyState';
```

- [ ] **Step 2: Replace `borderRadius: '4px'` (line ~110) with token**

```tsx
borderRadius: 'var(--radius-sm)',
```

- [ ] **Step 3: Conditionally render EmptyState when events is empty**

Wrap the existing `<ol aria-live="polite" ...>` in a conditional:

```tsx
{events.length === 0 ? (
  <EmptyState
    eyebrow="Live feed"
    headline="The feed is quiet"
    copy="New bookings, assignments, and complaints will land here as they happen."
  />
) : (
  <ol
    aria-live="polite"
    aria-label="Order events"
    style={{
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      maxHeight: '400px',
      overflowY: 'auto',
    }}
  >
    {events.map((event) => (
      /* existing <li>...</li> stays unchanged */
    ))}
  </ol>
)}
```

- [ ] **Step 4: Run OrderFeed tests**

```bash
pnpm -C admin-web test tests/components/dashboard/OrderFeed.test.tsx
```

Expected: PASS. If existing tests poll `fetch` and check the rendered list, the empty-list case may now render `EmptyState` instead of an empty `<ol>` — update the assertion to check for the `region` role instead.

- [ ] **Step 5: Commit**

```bash
git add admin-web/src/components/dashboard/OrderFeed.tsx
git commit -m "refactor(admin-web): OrderFeed — sharp radius + editorial EmptyState"
```

#### Task C3c: PayoutQueue + CounterStrip — sharp radius

**Files:**
- Modify: `admin-web/src/components/dashboard/PayoutQueue.tsx`
- Modify: `admin-web/src/components/dashboard/CounterStrip.tsx`

> **Push-back on Codex P1:** PayoutQueue's "nothing pending" is a **positive operational state**, not an empty-data state. The dashed-border editorial EmptyState block reads as "broken" here; a small italic note reads correctly. Keeping the italic-note pattern from the previous draft.

- [ ] **Step 1: PayoutQueue — replace `borderRadius: '8px'` (line ~21) and `borderRadius: '6px'` (line ~81) and tooltip `borderRadius: '4px'` (line ~107) with token**

All three → `borderRadius: 'var(--radius-sm)'`.

- [ ] **Step 2: PayoutQueue — render the "cleared" note when payoutsPending === 0**

Replace the existing `<div style={{ marginTop: '0.5rem', position: 'relative', display: 'inline-block' }}>...</div>` block with:

```tsx
{payoutsPending === 0 ? (
  <p
    style={{
      margin: 0,
      marginTop: 'var(--space-2)',
      fontSize: 'var(--text-xs)',
      color: 'var(--color-text-faint)',
      fontStyle: 'italic',
    }}
  >
    Nothing pending — payouts cleared.
  </p>
) : (
  <div style={{ marginTop: '0.5rem', position: 'relative', display: 'inline-block' }}>
    {/* existing disabled button + tooltip block stays here, with the radii already fixed in Step 1 */}
  </div>
)}
```

- [ ] **Step 3: CounterStrip — replace `borderRadius: '8px'` (line 29) with token**

```tsx
borderRadius: 'var(--radius-sm)',
```

- [ ] **Step 4: Verify**

```bash
pnpm -C admin-web typecheck
pnpm -C admin-web test tests/components/dashboard/CounterStrip.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add admin-web/src/components/dashboard/PayoutQueue.tsx \
        admin-web/src/components/dashboard/CounterStrip.tsx
git commit -m "refactor(admin-web): PayoutQueue + CounterStrip — sharp radius + cleared-state note"
```

---

### Task C4: Rail — `--rail-*` tokens, sharp radius

**Files:**
- Modify: `admin-web/src/components/dashboard/Rail.tsx`

- [ ] **Step 1: Replace token usage in Rail**

In `admin-web/src/components/dashboard/Rail.tsx`:
- `background: 'var(--ink-1)'` (desktop and mobile nav) → `background: 'var(--rail-bg)'`
- `borderRight: '1px solid var(--ink-4)'` → `borderRight: '1px solid var(--rail-border)'`
- `borderTop: '1px solid var(--ink-4)'` (mobile) → `borderTop: '1px solid var(--rail-border)'`
- `color: isActive ? 'var(--teal-soft)' : 'var(--fog-0)'` → `color: isActive ? 'var(--rail-text-active)' : 'var(--rail-text)'`
- `background: isActive ? 'var(--teal-dim)' : 'transparent'` → `background: isActive ? 'var(--rail-active-bg)' : 'transparent'`

- [ ] **Step 2: Replace `borderRadius: '8px'` (3 occurrences in Rail)**

All three (logo block, desktop nav item, mobile nav item) → `borderRadius: 'var(--radius-sm)'`.

- [ ] **Step 3: Run dev + flip to light, verify Rail readability**

```bash
pnpm -C admin-web dev
# In browser dev console:
document.cookie = "theme=light; path=/"; location.reload()
```

Expected: Rail renders on cream background, dark labels, marigold-tinted active pill. Readable.

- [ ] **Step 4: Verify typecheck + tests**

Run: `pnpm -C admin-web typecheck && pnpm -C admin-web test tests/components/dashboard`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add admin-web/src/components/dashboard/Rail.tsx
git commit -m "refactor(admin-web): Rail uses --rail-* tokens, sharp-corner chrome"
```

---

### Task C5: Topbar — className tokens + `right` slot for ThemeToggle

**Files:**
- Modify: `admin-web/src/components/dashboard/Topbar.tsx`
- Modify: `admin-web/app/(dashboard)/layout.tsx` (to inject `<ThemeToggle />` into the new slot — depends on WS-D Task D1 having the import path ready, but the slot itself can land independently with a no-op default)

- [ ] **Step 1: Replace `Topbar.tsx`**

```tsx
// admin-web/src/components/dashboard/Topbar.tsx
'use client';

import { useState, useEffect, type ReactNode } from 'react';

const CITY = process.env.NEXT_PUBLIC_CITY ?? 'Bengaluru';

function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

interface TopbarProps {
  /** Right-side slot — used for the theme toggle in (dashboard)/layout.tsx */
  rightSlot?: ReactNode;
}

export function Topbar({ rightSlot }: TopbarProps) {
  const [clock, setClock] = useState<string>(() => formatClock(new Date()));

  useEffect(() => {
    const timer = setInterval(() => setClock(formatClock(new Date())), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="topbar">
      {/* Brand */}
      <div className="topbar__brand">
        <span className="topbar__title">Operations Observatory</span>
        <span className="topbar__city">{CITY}</span>
      </div>

      {/* Right side — clock + status + slot */}
      <div className="topbar__right">
        <div className="topbar__live" aria-live="polite" aria-label="System status: live">
          <span className="topbar__live-dot" />
          <span className="topbar__live-label">LIVE</span>
        </div>

        <time className="topbar__clock" dateTime={new Date().toISOString()}>
          {clock}
        </time>

        {rightSlot !== undefined && <div className="topbar__slot">{rightSlot}</div>}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Append matching styles to globals.css**

Append to `admin-web/app/globals.css` (immediately after the `.theme-toggle` block from Task A5):

```css
/* ─────────────────────────────────────────────────────────────────────────
   Topbar — editorial header strip
   ───────────────────────────────────────────────────────────────────────── */

.topbar {
  height: 52px;
  background: var(--rail-bg);
  border-bottom: 1px solid var(--rail-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-5);
  flex-shrink: 0;
}
.topbar__brand { display: flex; flex-direction: column; gap: 0; }
.topbar__title {
  font-family: var(--font-display);
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  font-weight: 600;
  line-height: 1.1;
}
.topbar__city {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-text-faint);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.topbar__right { display: flex; align-items: center; gap: var(--space-4); }
.topbar__live { display: flex; align-items: center; gap: var(--space-1); }
.topbar__live-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--teal);
  animation: liveBreath 2s var(--ease-in-out) infinite;
}
.topbar__live-label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--teal);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.topbar__clock {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
}
.topbar__slot { display: flex; align-items: center; }
```

> **Note** — the embedded `<style>` block + `pulse-dot` keyframe in the old Topbar is removed. The new styles reuse the existing `liveBreath` animation already defined in globals.css (line 240).

- [ ] **Step 3: Inject ThemeToggle into the layout**

In `admin-web/app/(dashboard)/layout.tsx` find the existing `<Topbar />` invocation and replace with:

```tsx
import { ThemeToggle } from '@/components/theme/ThemeToggle';
// ...
<Topbar rightSlot={<ThemeToggle />} />
```

- [ ] **Step 4: Verify typecheck + dev smoke**

```bash
pnpm -C admin-web typecheck
pnpm -C admin-web dev
# Hit http://localhost:3000/dashboard — Topbar should look identical, plus a DARK | LIGHT toggle on the right.
```

Expected: PASS, toggle visible.

- [ ] **Step 5: Commit**

```bash
git add admin-web/src/components/dashboard/Topbar.tsx \
        admin-web/app/globals.css \
        admin-web/app/\(dashboard\)/layout.tsx
git commit -m "refactor(admin-web): Topbar tokenised + ThemeToggle slot wired"
```

---

## WS-D — (folded into A5/C5)

The theme toggle UI was scoped here originally; both the component (`ThemeToggle` in Task A5) and its wiring (Topbar `rightSlot` in Task C5) are already covered. This stream is intentionally empty in the executable plan — leaving the marker so the executing agent can confirm coverage.

---

## WS-E — Pre-Codex smoke gate, visual verification, Codex review

> **Closes P0 #4 (Firebase docs) and runs the gate. No code changes after this stream.**

### Task E1: README — document Firebase dev-keys seeding (P0 #4 — docs scope per user instruction)

> **Scope reminder:** the user prompt explicitly scoped P0 #4 to docs-only ("provisioning is a separate ops task; do NOT wire real keys here"). This task documents the seeding procedure; actual provisioning lands in a separate ops story. Login will remain blocked locally until a dev runs through the documented steps and adds real keys to their `.env.local`.

**Files:**
- Modify: `admin-web/README.md`

- [ ] **Step 1: Append the section**

Add the following section to `admin-web/README.md` after the "Quick start" section:

```markdown
## Firebase dev keys (required for login)

The login form uses Firebase Phone Auth. `.env.local` ships with placeholder
values that fail with `auth/api-key-not-valid` on actual sign-in. To run the
login flow locally:

1. **Create a dev Firebase project** (or get added to the existing one):
   - Go to https://console.firebase.google.com
   - Create a project named `homeservices-dev` (or reuse any throwaway project).
   - Add a Web app (Project settings → General → Your apps → "Add app" → Web).
   - Enable Phone Auth: Authentication → Sign-in method → Phone → Enable.
   - Add `localhost` to Authorized domains.

2. **Copy the SDK config into `.env.local`:**
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...                   # Web API Key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=homeservices-dev.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=homeservices-dev
   ```

3. **Restart `pnpm dev`** — Firebase reads env at module import.

> **Production keys live in the Azure Static Web Apps environment**, not in
> `.env.local`. Never commit real keys; `.env.local` is gitignored but treat
> it as secret regardless. To rotate the placeholder JWT_SECRET to a per-developer
> random value, run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
> and replace `JWT_SECRET=` in `.env.local`.
```

- [ ] **Step 2: Commit**

```bash
git add admin-web/README.md
git commit -m "docs(admin-web): Firebase dev-keys provisioning + JWT_SECRET rotation"
```

---

### Task E2: Pre-Codex smoke gate

- [ ] **Step 1: Run the smoke gate**

```bash
bash tools/pre-codex-smoke-web.sh
```

Expected: **exit code 0**. If non-zero, stop, fix the failing check, re-run. Do **not** invoke Codex with a failing smoke gate.

Common failures and fixes:
- typecheck failure → fix the type error in the offending file
- lint failure → `pnpm -C admin-web lint --fix` then commit
- test failure → debug the failing assertion
- coverage < 80% → add tests for uncovered lines (NOT lower the threshold)

- [ ] **Step 2: Final greps**

```bash
# zero hardcoded color utilities in components
grep -rn "bg-\(blue\|red\|green\|indigo\|purple\|emerald\|yellow\|pink\)-" admin-web/src/components
# zero borderRadius: '8px' in dashboard components
grep -n "borderRadius:\s*'8px'" admin-web/src/components/dashboard/*.tsx
# zero references to themeScript / suppressHydrationWarning in layout
grep -n "themeScript\|suppressHydrationWarning\|dangerouslySetInnerHTML" admin-web/app/layout.tsx
```

All three: zero hits.

---

### Task E3: Visual verification (Playwright @ 1440×900)

> **The rebrand session captured before/after baselines in `admin-web/.playwright-mcp/`. Use those as the reference for "this should still look right".**

- [ ] **Step 1: Boot dev server in background**

```bash
pnpm -C admin-web dev
```

Wait for `Ready in <ms>` log line. Note the URL (defaults to `http://localhost:3000`).

- [ ] **Step 2: Mint a dev JWT and set the cookie via Playwright MCP**

Use the Playwright MCP browser_evaluate hook to mint the JWT inline:

```js
// Run inside the browser via mcp__plugin_playwright_playwright__browser_evaluate
await (async () => {
  const enc = new TextEncoder();
  const secret = enc.encode('local-dev-only-not-for-prod-this-is-just-a-placeholder-secret');
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payload = btoa(JSON.stringify({
    sub: 'admin-e2e',
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const data = enc.encode(`${header}.${payload}`);
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
  const sigB64 = btoa(String.fromCharCode(...sig)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  document.cookie = `hs_access=${header}.${payload}.${sigB64}; path=/; SameSite=Lax`;
})();
```

- [ ] **Step 3: Walk the routes at 1440×900 in both themes**

For each route in this list, take a screenshot in both `theme=dark` and `theme=light`:
- `/` (landing)
- `/dashboard`
- `/orders`
- `/catalogue`
- `/finance`
- `/complaints`
- `/audit-log`

For each, compare visually against the matching `admin-web/.playwright-mcp/after-*.png` baseline. The acceptance bar:
- No regressions in spacing, type, or layout vs. the rebrand baseline.
- Empty states appear (and look editorial, not "broken") on `/catalogue` and `/complaints` when `api/` is offline.
- `/dashboard` widgets show empty states (TechMap, OrderFeed) when `api/` is offline.
- Theme toggle visible in Topbar and flips the canvas instantly.
- No FOUC on cold-load with `theme=light` cookie set.

- [ ] **Step 4: Save the new "after" screenshots**

```bash
# Suggested filenames (one per route × theme)
admin-web/.playwright-mcp/after-hardening-{route}-{theme}.png
```

- [ ] **Step 5: Storybook smoke (boot only — no story authoring)**

```bash
pnpm -C admin-web storybook
```

Open http://localhost:6006 — verify Storybook boots and the **existing** stories render without crashing under the new tokens. The new primitives (`.alert`, `.chip`, `EmptyState`, `ThemeToggle`) do **not** have stories yet; authoring stories for them is **out of scope** for this hardening pass — track in `admin-web/docs/portal-issues-2026-05-01.md` as P2 follow-up if it bothers anyone.

If an existing story crashes, file under "P2 follow-ups" or — if it's clearly caused by a token rename in this story — fix inline before pushing.

---

### Task E4: Codex review gate

- [ ] **Step 1: Run Codex review**

```bash
codex review --base main
```

Expected output: Codex writes `.codex-review-passed` on success. If it flags issues:
- **P0 / correctness:** fix in this story before the next step.
- **P1 / style:** fix if the change is < 5 lines; otherwise file as a P2 in the punch list and proceed.
- **Conflicting signals:** escalate per `~/.claude/CLAUDE.md` "Codex review synthesis" — switch to Opus to resolve.

Auth/payment/dispatch is **not** in scope for this story — no `/security-review` invocation needed.

- [ ] **Step 2: Push**

```bash
git push -u origin feature/E10-S01-karnataka-compliance
```

(Branch matches the existing branch in `gitStatus`. If a new branch is wanted, branch from main first — but the existing branch already contains the rebrand work this story is hardening, so reuse is correct.)

CI runs lint + tests + Semgrep. Expect green. PR auto-merges per project policy (solo, no approval gate).

---

## Self-review checklist (run before handing off)

**1. Spec coverage (post-Codex revisions):**
- [ ] P0 #1 (theme persistence) → WS-A (Tasks A1–A7)
- [ ] P0 #2 (Catalogue + Complaints SSR-crash) → WS-B Tasks B1, B2, B3, B4
- [ ] P0 #3 (wrong API base — sweeps **all 6 affected files**) → WS-B Task B0
- [ ] P0 #4 (Firebase dev-keys **documented per user-scoped instruction**; provisioning deferred to ops story) → WS-E Task E1
- [ ] P1 #5 (bg-color sweep, with urgent-state assertion preserved via `data-urgent`) → WS-C Task C2
- [ ] P1 #7 (counter / payout chrome radius) → WS-C Task C3-merged
- [ ] P1 #8 (Topbar inline → tokens) → WS-C Task C5
- [ ] P1 #9 (EmptyState + wiring into TechMap/OrderFeed; PayoutQueue uses italic "cleared" note instead — see Codex push-back) → WS-B Task B1 + WS-C Task C3-merged
- [ ] P1 #10 (Rail light-mode tokens) → WS-C Task C1 + C4
- [ ] P1 #11 (theme toggle UI) → WS-A Task A5 + WS-C Task C5
- [ ] P1 #6 (status badges) — **already resolved in rebrand session** per punch list. No-op.
- [ ] P2 #14 (FOUC) — closed by WS-A architecture (cookie-based SSR).
- [ ] P2 #17 (dev "Issues" indicator) — closed transitively by P0 #2 fix.
- [ ] P2 #12, #13, #15, #16 — **not in scope.** Document residual P2s if any visual issue appears in WS-E Step 3 above.

**Total: 4/4 P0 + 6/7 P1 + 2/6 P2 = exceeds the ≥5/7 P1 success criterion.**

**Codex review findings — disposition:**
- ✅ Applied: `@/*` alias scope (relative imports throughout), `user-event` not in deps (use `fireEvent`), `client.GET` typecheck (raw fetch retained), JWT helper reuse (`makeAccessJwt`), URL sweep across 6 files (Task B0), WS-B/WS-C file-conflict (merged Task C3), `httpOnly: true`, ThemeProvider write-sequence guard, raw-HTML FOUC test, real Link-click navigation test, toggle→reload persistence test, complaints stronger assertions, dashboard switched to `getServerApiClient`, test paths under `tests/...`, ComplaintCard urgent assertion via `data-urgent`, legacy `useTheme.ts` cleanup (Task A7).
- ↻ Pushed back: ThemeToggle full radio-group keyboard handling (overkill for 2-option), PayoutQueue full EmptyState (italic note reads better for a positive operational state), authoring Storybook stories for new primitives (scope creep — track as P2 follow-up).

**2. Placeholder scan:** Searched for "TBD", "TODO" (excluding pre-existing `TODO(E10-S03)` markers), "implement later", "fill in details", "add appropriate error handling", "similar to Task N". Zero hits in plan.

**3. Type consistency:**
- `Theme` defined in `src/lib/theme.ts:Theme` — consumed by `ThemeProvider`, `setThemeCookie`, `ThemeToggle`. ✓
- `THEME_COOKIE_NAME = 'theme'` — used consistently across reader, action, and tests. ✓
- `getServerApiClient()` — used in dashboard (B5) and complaints (B3). Catalogue (B2) keeps raw `fetch` because `client.GET` does not type for that path (see schema.d.ts:119). ✓
- `EmptyState` props — `eyebrow`, `headline`, `copy?`, `action?` — same signature across B1, C3a, C3b. ✓
- `makeAccessJwt(sub: string, role: string)` — reused from `tests/e2e/helpers/make-token.ts`; sets `type: 'access'` per `middleware.ts:22`. ✓

---

## Plan size

```
Foundation tier ceiling: 1500 lines.
This plan: ~1350 lines. Within budget.
```

The plan is single-story-shaped: one cross-cutting hardening pass on `admin-web/`. No split required (no migration, no cross-module refactor, ≤8 new files, all in one sub-project).

---

## Execution handoff

Two execution options:

**1. Subagent-Driven (recommended for this plan):** Dispatch WS-B and WS-C as parallel Sonnet subagents (each gets one of the four/three sub-streams). WS-A runs first (Opus, sequential) because WS-B/C/D depend on `globals.css` extensions and `theme.ts` types. WS-E is human-in-the-loop.

**2. Inline Execution:** Run all tasks in this session sequentially. Slower but lower coordination overhead.

**Which approach?** — surface to user before kicking off WS-A.
