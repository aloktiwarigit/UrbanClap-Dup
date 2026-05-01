# Client Project — Enterprise Baseline (Node API)

## Phase gate

Same as sibling templates. `src/` gated until BMAD artifacts exist.

## Stack

- Node 22 LTS + TypeScript `strict: true`
- Fastify (or Hono) for HTTP; Zod for validation
- Sentry Node SDK + OpenTelemetry auto-instrumentation
- GrowthBook Node SDK (OSS)
- PostHog Node SDK
- Prisma or Drizzle (per ADR)
- Vitest (unit + integration), Supertest (HTTP), Testcontainers (DB-in-docker)
- Semgrep SAST + Snyk (OSS CLI) for dep audit

## CI

- typecheck, ESLint (0 warnings), Vitest ≥80% coverage
- Integration tests against Testcontainers
- Semgrep (owasp-top-ten + typescript)
- `pnpm audit --audit-level=high`
- OpenAPI spec validation if applicable
- Codex review marker check

## Deployment — Azure Functions (func-homeservices-prod, centralindia)

**Deployed automatically by `api-ship.yml` on push/merge to `main`.**
Manual trigger: `gh workflow run api-ship.yml` or GitHub Actions → workflow_dispatch.

### How the deploy works (DO NOT change this without understanding why)

The deploy job:
1. Runs on **ubuntu-latest** (Linux — required for Linux-compatible node_modules)
2. `pnpm install --frozen-lockfile` (all deps for tsc)
3. `pnpm build` (compiles TypeScript → dist/)
4. Creates `.deploy-stage/` with only: `host.json`, `package.json`, `pnpm-lock.yaml`, `dist/`
5. `pnpm install --prod` inside `.deploy-stage/` (Linux prod-only node_modules, no devDeps)
6. Zips `.deploy-stage/` → `deploy.zip` (<950MB gate)
7. Uploads zip to `sthomeservicesprod` blob storage (`function-packages` container)
8. Sets `WEBSITE_RUN_FROM_PACKAGE` to the SAS blob URL
9. Restarts the function app
10. Calls Azure REST `syncfunctiontriggers` directly (NOT via `func` CLI — that times out)
11. Polls `/api/v1/health` for up to 6 minutes (36 × 10s)

### Why NOT to use these approaches

| Approach | Why it fails |
|---|---|
| `Azure/functions-action@v1` + publish profile | Kudu SCM unreachable on Linux Consumption plan |
| `func publish` without `--javascript` | Can't detect language on Ubuntu runner |
| `func publish --javascript --no-build` on Windows | Windows node_modules crash on Linux Azure |
| `func publish` Oryx remote build | Trigger sync times out / BadRequest, exits 1 |
| `azure/login@v2` with `creds` JSON | JSON gets corrupted (warnings mixed in) |
| `azure/login@v2` with individual secrets | Tries OIDC by default, not service principal |

### GitHub Secrets required

| Secret | Value |
|---|---|
| `AZURE_CLIENT_ID` | SP app ID (b1844efc-c007-47a8-b08f-0d0bac0bdeb2) |
| `AZURE_CLIENT_SECRET` | SP secret — regenerate with `az ad app credential reset --id <clientId>` |
| `AZURE_TENANT_ID` | 45e4c830-3c4e-472c-9802-6e4f1ecf7a7e |
| `AZURE_SUBSCRIPTION_ID` | 83296266-5b58-4b55-851c-8e6b55cc43e6 |

### Cosmos DB — pre-provisioned requirements

These containers must exist before the function app can start (change-feed triggers):
- `booking_completed_leases` (partition key: `/id`)
- `booking_rating_prompt_leases` (partition key: `/id`)
- `booking_report_leases` (partition key: `/id`)

And these app settings must be present (extension bundle 4.33.1 split-format):
- `COSMOS_CONNECTION_STRING__accountEndpoint`
- `COSMOS_CONNECTION_STRING__accountKey`

### Verify deployment

```bash
curl https://func-homeservices-prod.azurewebsites.net/api/v1/health
```
