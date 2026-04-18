# homeservices-api

Node 22 + TypeScript + Azure Functions Consumption backend for homeservices-mvp.

## Quick start

```bash
pnpm install
pnpm dev    # compiles src/ → dist/ then runs `func start`; serves http://localhost:7071/api/v1/health
```

`pnpm dev` runs `pnpm build && func start` because Azure Functions loads compiled files from `dist/functions/*.js` (see `package.json` `main`). In a clean checkout `dist/` is absent, so skipping the build means Core Tools would start with zero functions discovered.

For edit-reload during development, run the watcher in a second terminal:

```bash
pnpm dev:watch    # tsc --watch — recompiles on save; `func start` picks up changed files
```

**Windows fallback:** if `azure-functions-core-tools` fails to install via npm (a known intermittent issue on Windows), install it system-wide instead:

```powershell
winget install Microsoft.AzureFunctionsCoreTools
```

Then use `pnpm dev:direct`, which also runs `pnpm build && func start` but expects `func` on PATH rather than in `node_modules/.bin`.

## Test

```bash
pnpm test           # Vitest, single run
pnpm test:coverage  # Vitest + v8 coverage, fails under 80% on lines/branches/functions/statements
pnpm typecheck      # tsc --noEmit against tsconfig.tests.json (src + tests)
pnpm lint           # ESLint 9 flat config, --max-warnings 0
```

## Deploy

```bash
pnpm build          # tsc → dist/
```

Deployment to Azure Functions Consumption is covered in a later story (E01 or later deploy story).

## Conventions (LOCK IN — all contributors and future AI agents)

### 1. NodeNext ESM requires `.js` extensions on relative imports

Even though source files are `.ts`, imports MUST use `.js`:

```ts
// ✅ Correct
import { parseBody } from './shared/zod.js';

// ❌ Wrong — tsc will fail with TS2835
import { parseBody } from './shared/zod';
```

This is a requirement of `module: "NodeNext"` + `"type": "module"` + Node 22 ESM resolution. TypeScript's own compiler enforces it; ESLint's `import/no-unresolved` rule is deliberately off because it can't reconcile `.js` → `.ts` without additional resolver config.

### 2. All input validation goes through `src/shared/zod.ts`

```ts
import { parseBody } from '../shared/zod.js';
import { MySchema } from '../schemas/my-resource.js';

const input = parseBody(MySchema, await req.json());
```

Never hand-roll validation. Never use `express-validator`, `joi`, or `class-validator`.

### 3. Routes prefixed `v1/`; URL is `/api/v1/{resource}`

The default Azure Functions `/api` prefix is kept. Versioning lives in the route: `app.http('foo', { route: 'v1/foo', ... })`.

### 4. Observability bootstrap is a single import

Every function file must include `import '../bootstrap.js';` at the top. Do not call `Sentry.init()` directly in handlers.

## References

- Architecture: [`../docs/architecture.md`](../docs/architecture.md) §6 (code structure) + §7 (NFR traceability)
- ADR-0001: [Primary stack choice](../docs/adr/0001-primary-stack-choice.md)
- ADR-0004: [Azure Functions Consumption](../docs/adr/0004-azure-functions-consumption.md)
- ADR-0007: [Zero paid SaaS constraint](../docs/adr/0007-zero-paid-saas-constraint.md)
- Brainstorm design: [`../docs/superpowers/specs/2026-04-17-e01-s01-api-skeleton-design.md`](../docs/superpowers/specs/2026-04-17-e01-s01-api-skeleton-design.md)

## OpenAPI

This project emits its OpenAPI 3.1 document from Zod schemas via `@asteasolutions/zod-to-openapi`.

- **Generate:** `pnpm openapi:build` writes `api/openapi.json` (committed artifact).
- **Validate:** `pnpm openapi:lint` runs `@stoplight/spectral-cli` with the `spectral:oas` ruleset.
- **When to regenerate:** every time a Zod schema or route registration changes. CI drift-checks on every PR.
- **Where it's consumed:** `admin-web/` syncs this file into `admin-web/src/api/generated/openapi.json` and generates a typed client from it. See ADR-0009.
