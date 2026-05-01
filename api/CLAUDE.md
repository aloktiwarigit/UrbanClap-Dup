# Client Project - Enterprise Baseline (Node API)

## Phase Gate

Same as sibling templates. `src/` gated until BMAD artifacts exist.

## Stack

- Node 22 LTS + TypeScript `strict: true`
- Fastify or Hono for HTTP; Zod for validation
- Sentry Node SDK + OpenTelemetry auto-instrumentation
- GrowthBook Node SDK (OSS)
- PostHog Node SDK
- Prisma or Drizzle (per ADR)
- Vitest, Supertest, and Testcontainers
- Semgrep SAST and dependency audit

## CI

- Typecheck, ESLint with 0 warnings, and Vitest
- Integration tests against Testcontainers where applicable
- Semgrep with OWASP, TypeScript, Node.js, secrets, and `api/.semgrep.yml`
- OpenAPI spec build and lint
- API deployment is handled by `.github/workflows/api-ship.yml`

## Deployment - Azure Functions (func-homeservices-prod, centralindia)

Last known good production deployment:
- Commit: `8555ae3a`
- GitHub Actions run: `25203003001`
- Date: 2026-05-01
- Result: Oryx remote build succeeded, `/api/v1/health` returned `status=ok`, and the runtime admin endpoint showed 82 indexed functions.

### Canonical Deploy Path

Use `.github/workflows/api-ship.yml`. Do not hand-build a zip from Windows and do not use `Azure/functions-action@v1`.

Deploy is automatic on push to `main` when `api/**` or `.github/workflows/api-ship.yml` changes. Manual deploy:

```bash
gh workflow run api-ship.yml --ref main
gh run list --workflow api-ship.yml --limit 5
gh run watch <run-id> --exit-status
```

The deploy job must:

1. Run on `ubuntu-latest`.
2. Install and build from `api/` with Node 22.
3. Authenticate with `az login --service-principal`, not `azure/login@v2`.
4. Delete stale `WEBSITE_RUN_FROM_PACKAGE` before publish.
5. Enable Oryx remote build on the function app.
6. Publish with `func azure functionapp publish "$AZURE_FUNCTIONAPP_NAME" --javascript --build remote --verbose`.
7. List indexed functions after publish.
8. Poll `https://func-homeservices-prod.azurewebsites.net/api/v1/health`.
9. Require the health payload commit to match `${GITHUB_SHA:0:8}` so an old deployment cannot pass.

### Required Oryx App Settings

These settings are not optional. They prevent the exact failures seen on 2026-05-01.

```bash
az functionapp config appsettings delete \
  --name func-homeservices-prod \
  --resource-group rg-homeservices-prod \
  --setting-names WEBSITE_RUN_FROM_PACKAGE \
  --output none || true

az functionapp config appsettings set \
  --name func-homeservices-prod \
  --resource-group rg-homeservices-prod \
  --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    ENABLE_ORYX_BUILD=true \
    NPM_CONFIG_INCLUDE=dev \
    NPM_CONFIG_PRODUCTION=false \
    NODE_ENV=production \
    GIT_SHA="$GITHUB_SHA" \
    AzureWebJobsFeatureFlags=EnableWorkerIndexing \
  --output none
```

Why `NPM_CONFIG_INCLUDE=dev` matters: Oryx runs `npm install` and then `npm run build`. Without dev dependencies, `typescript` is missing and the remote build fails with `sh: 1: tsc: not found`.

Why delete `WEBSITE_RUN_FROM_PACKAGE`: a stale blob URL can override newly published content and keep serving an old or empty app.

### Required Ignore Rules

`api/.funcignore` must keep the Oryx upload source-build friendly:

```text
node_modules/
.pnpm-store/
local.settings.json
tests/
coverage/
docs/
specs/
plans/
```

Do not exclude `src/`, `dist/`, `host.json`, `package.json`, `pnpm-lock.yaml`, or `tsconfig*.json`.

### GitHub Secrets Required

The workflow expects these repository secrets:

```text
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
```

If the service-principal secret fails with `AADSTS7000215`, regenerate it with Azure CLI and paste the raw secret value into GitHub Secrets. Avoid PowerShell commands that capture warning text into the secret.

### Cosmos DB Pre-Provisioning

These lease containers must exist before the function app starts. Cosmos Serverless cannot auto-create these leases with provisioned throughput from the trigger extension.

```text
booking_completed_leases       partition key: /id
booking_rating_prompt_leases   partition key: /id
booking_report_leases          partition key: /id
```

These app settings must also exist for the Cosmos extension bundle used in production:

```text
COSMOS_CONNECTION_STRING
COSMOS_CONNECTION_STRING__accountEndpoint
COSMOS_CONNECTION_STRING__accountKey
COSMOS_DATABASE
```

### Verification Commands

Health:

```bash
curl https://func-homeservices-prod.azurewebsites.net/api/v1/health
```

Expected shape:

```json
{"status":"ok","version":"0.1.0","commit":"<first-8-of-git-sha>"}
```

List indexed functions from Azure:

```bash
az functionapp function list \
  --name func-homeservices-prod \
  --resource-group rg-homeservices-prod \
  --query "[].name" \
  -o tsv
```

Runtime admin verification when function list is suspicious:

```powershell
$key = az functionapp keys list --name func-homeservices-prod --resource-group rg-homeservices-prod --query masterKey -o tsv
$headers = @{ 'x-functions-key' = $key }
$functions = Invoke-RestMethod -Uri "https://func-homeservices-prod.azurewebsites.net/admin/functions" -Headers $headers
@($functions).Count
```

### Known Bad Paths

| Approach | Failure mode |
|---|---|
| Local `func publish` from Windows | Uploads Windows-built `node_modules`; Linux Azure can crash or load zero functions. |
| `func publish --no-build` | Depends on locally built artifacts and local module ABI. |
| Manual blob zip with `WEBSITE_RUN_FROM_PACKAGE` | Easy to leave a stale package mounted; caused health 404 after trigger sync. |
| `Azure/functions-action@v1` with publish profile | Kudu/SCM is unreliable or unreachable on Linux Consumption. |
| `azure/login@v2` in this repo | Previously fell into OIDC or malformed creds issues. Use direct `az login --service-principal`. |
| Oryx without `NPM_CONFIG_INCLUDE=dev` | Remote build fails with `tsc: not found`. |
| Continuing after failed Oryx publish without checking logs | Health will stay 404 because no new build was deployed. |

### Debugging Failed Future Deploys

1. Read the deploy step logs first:
   ```bash
   gh run view <run-id> --log-failed
   gh run view <run-id> --job <deploy-job-id> --log
   ```
2. Search for `Remote build failed`, `tsc: not found`, `Deployment successful`, `Syncing triggers`, and `Functions in func-homeservices-prod`.
3. If health is 404, check whether Oryx actually reached `Deployment successful`.
4. If Oryx succeeded but functions are empty, inspect `/admin/functions` with the master key and then Azure Portal Log stream.
5. If functions are indexed but health is old or 404, check `WEBSITE_RUN_FROM_PACKAGE`, `GIT_SHA`, and the health route commit.
