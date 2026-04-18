# ADR-0008: Storybook framework — `@storybook/react-vite` instead of `@storybook/nextjs`

- **Status:** accepted
- **Date:** 2026-04-18
- **Deciders:** Alok Tiwari

## Context

Story E01-S02 (admin-web skeleton + landing page) plan-prescribed `@storybook/nextjs@^8.4` as the Storybook framework. The brainstorm Q6/N9 anticipated React 19 peer-dep warnings from Storybook 8.x and prescribed: (a) try `@storybook/nextjs@^8.4`, (b) if peer warnings, add `pnpm.overrides` for React 19, (c) if that fails, defer Storybook AC-5 with an ADR-logged deviation, (d) **do NOT pull `@storybook/nextjs@9-rc`**.

During T9 implementation we hit a hard build crash — not just peer-dep warnings:

1. **`@storybook/nextjs@8.6.18` (webpack builder):** `@storybook/builder-webpack5` crashes at cache shutdown because Storybook resolves to Next.js's internal bundled webpack (`next/dist/compiled/webpack/bundle5.js`) instead of standalone webpack 5. Build exits non-zero every time.
2. **`@storybook/experimental-nextjs-vite@8.6.14` (vite-based):** `vite-plugin-storybook-nextjs@1.1.5` requires `next/dist/build/webpack/plugins/define-env-plugin.js`, which no longer exists in Next.js 15.5.x. Hard module-not-found crash at startup.

The brainstorm-prescribed fallback — defer AC-5 — would have shipped the skeleton story without a working Storybook, leaving the design-system foundation untestable for all subsequent admin-web stories.

## Decision

Switch the Storybook framework to **`@storybook/react-vite@8.6.14`**. This is a plain React + Vite Storybook framework with no Next.js-specific integration layer. The build succeeds, all three seed stories (Button, TokenSwatch, Typography) render correctly, and `globals.css` (containing the `@theme` token block) is processed correctly by Vite's native CSS pipeline. AC-5 is met.

Dependencies added to `admin-web`:

| Package | Version |
|---|---|
| `@storybook/react-vite` | `8.6.14` |
| `@storybook/react` | `8.6.14` |
| `@storybook/test` | `8.6.14` |
| `storybook` (CLI) | `8.6.14` |
| `vite` | `^5` |
| `pnpm.overrides` for `react`/`react-dom` | `^19.0.0` |

Dependencies removed:

- `@storybook/nextjs`
- `@storybook/builder-webpack5` (no longer transitively required)

## Consequences

- **Positive:** Storybook builds and runs today against Next.js 15.5.x. The design-system seed stories (Button, TokenSwatch, Typography) are testable in isolation immediately, unblocking all downstream admin-web stories that build on the token layer.
- **Negative:** `next/image`, `next/link`, `next/font`, `next/router`, and `next/navigation` are **not** auto-mocked. Stories that import any of these Next.js APIs will fail to render in Storybook unless manual mocks are provided as decorators or module aliases.
- **Neutral:** The three seed stories in T9 use none of the Next.js APIs, so there is zero immediate impact. Future stories that render Next.js components in Storybook must either (a) add per-story decorators mocking the relevant APIs, or (b) wait for `@storybook/nextjs@9.x` + `vite-plugin-storybook-nextjs@3.x` (reported to support Next 15.5+) when Storybook 9 reaches GA.

## Alternatives considered

- **`@storybook/nextjs@^8.4` with React 19 overrides only** — rejected; fails at runtime with the webpack-builder crash described above. Adding `pnpm.overrides` for `react@19` does not fix the webpack bundle resolution issue.
- **`@storybook/experimental-nextjs-vite@8.6.14`** — rejected; requires `vite-plugin-storybook-nextjs@1.1.5` which has a hard dependency on a missing Next.js 15.5 internal module (`define-env-plugin.js`).
- **Defer Storybook AC-5 to a follow-up story** (the brainstorm-prescribed fallback) — rejected; leaves the design-system token foundation unverifiable in isolation for all subsequent stories, which increases regression risk.
- **`@storybook/nextjs@9-rc`** — explicitly forbidden by the brainstorm (Q6 prescription, item d).

## References

- Plan: `plans/E01-S02.md` Task 9
- Story: `docs/stories/E01-S02-admin-web-skeleton-landing-page.md` AC-5
- Brainstorm: `docs/superpowers/specs/2026-04-18-e01-s02-admin-web-skeleton-design.md` Q6 + risk register
- Storybook 9 + Next 15.5 compatibility: tracked upstream in the Storybook GitHub repository
- Prior ADRs: ADR-0001 (primary stack), ADR-0007 (zero paid SaaS — this change introduces no paid dependencies)
