# Client Project — Enterprise Baseline (Next.js)

## Phase gate

This project uses BMAD + Superpowers. **`src/` is off-limits until all of these exist and are committed:**

- `docs/prd.md`, `docs/ux-design.md`, `docs/architecture.md`
- `docs/adr/0001-*.md`
- `docs/stories/` has at least one story file
- `docs/threat-model.md`, `docs/runbook.md`
- `.bmad-readiness-passed` marker

Hooks in `.claude/settings.json` enforce this.

## Per-story execution

1. Pick story from `docs/stories/`
2. Fresh session → `/superpowers:writing-plans` → commit `plans/<story-id>.md`
3. **Fresh session** → `/superpowers:executing-plans`
4. TDD: tests in `tests/` BEFORE implementation in `src/`
5. `/superpowers:verification-before-completion` before claiming done
6. 5-layer review gate → `/codex-review-gate` (writes `.codex-review-passed`)
7. `git push` — CI runs the full quality gate

## Stack

- Next.js 15 (App Router), TypeScript `strict: true`
- Sentry + OpenTelemetry instrumentation
- GrowthBook OSS feature flags
- Storybook + design tokens
- PostHog event tracking
- Vitest + Playwright
- CI: type, lint, test (≥80% coverage), Semgrep, axe-core, Lighthouse CI, Codex review

## Production deployment

Admin-web production is Azure Container Apps, not Azure Static Web Apps.

Canonical resource:
- Resource group: `rg-homeservices-prod`
- Container App: `aca-admin-homeservices-prod`
- Public URL: `https://aca-admin-homeservices-prod.icybush-b2e9c876.centralindia.azurecontainerapps.io`
- Image registry: `ghcr.io/aloktiwarigit/urbanclap-dup-admin-web:<tag>`
- Backend API: `https://func-homeservices-prod.azurewebsites.net/api`, reached from the browser through `/admin-api/*`

Required deploy shape, in order:
1. Run the local admin-web checks before shipping:
   - `pnpm vitest run <focused tests>`
   - `pnpm typecheck`
   - `pnpm build`
2. Build a Docker image from `admin-web/Dockerfile`.
3. Push the image to GHCR as `ghcr.io/aloktiwarigit/urbanclap-dup-admin-web:<tag>`.
4. Update ACA `aca-admin-homeservices-prod` to that exact image.
5. Re-enable/check external ingress on target port `3000` after every `az containerapp update`.
6. Smoke test ACA, not SWA.

PowerShell deploy template from repo root:

```powershell
cd admin-web

$tag = "admin-web-$(Get-Date -Format yyyyMMdd-HHmm)"
$image = "ghcr.io/aloktiwarigit/urbanclap-dup-admin-web:$tag"

$envLines = Get-Content .env.local -ErrorAction Stop
function Get-DotEnvValue([string]$Name) {
  $line = $envLines | Where-Object { $_ -match "^$Name=" } | Select-Object -First 1
  if (-not $line) { return "" }
  return (($line -replace "^$Name=", "").Trim('"'))
}

$token = gh auth token
$token | docker login ghcr.io -u aloktiwarigit --password-stdin

docker build --progress=plain -t $image `
  --build-arg NEXT_PUBLIC_APP_URL="https://aca-admin-homeservices-prod.icybush-b2e9c876.centralindia.azurecontainerapps.io" `
  --build-arg NEXT_PUBLIC_CITY="$(Get-DotEnvValue 'NEXT_PUBLIC_CITY')" `
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="$(Get-DotEnvValue 'NEXT_PUBLIC_FIREBASE_API_KEY')" `
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$(Get-DotEnvValue 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN')" `
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="$(Get-DotEnvValue 'NEXT_PUBLIC_FIREBASE_PROJECT_ID')" `
  --build-arg NEXT_PUBLIC_GIT_SHA="$tag" `
  --build-arg NEXT_PUBLIC_GROWTHBOOK_API_HOST="$(Get-DotEnvValue 'NEXT_PUBLIC_GROWTHBOOK_API_HOST')" `
  --build-arg NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY="$(Get-DotEnvValue 'NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY')" `
  --build-arg NEXT_PUBLIC_POSTHOG_HOST="$(Get-DotEnvValue 'NEXT_PUBLIC_POSTHOG_HOST')" `
  --build-arg NEXT_PUBLIC_POSTHOG_KEY="$(Get-DotEnvValue 'NEXT_PUBLIC_POSTHOG_KEY')" `
  --build-arg NEXT_PUBLIC_SENTRY_DSN="$(Get-DotEnvValue 'NEXT_PUBLIC_SENTRY_DSN')" `
  .

docker push $image

az containerapp update `
  --name aca-admin-homeservices-prod `
  --resource-group rg-homeservices-prod `
  --image $image

az containerapp ingress enable `
  --name aca-admin-homeservices-prod `
  --resource-group rg-homeservices-prod `
  --type external `
  --target-port 3000 `
  --transport auto

az containerapp show `
  --name aca-admin-homeservices-prod `
  --resource-group rg-homeservices-prod `
  --query "{image:properties.template.containers[0].image,ingress:properties.configuration.ingress.external,targetPort:properties.configuration.ingress.targetPort,traffic:properties.configuration.ingress.traffic,runningStatus:properties.runningStatus,latestRevisionName:properties.latestRevisionName}" `
  --output json
```

Required ACA smoke checks:

```powershell
curl.exe -I "https://aca-admin-homeservices-prod.icybush-b2e9c876.centralindia.azurecontainerapps.io/hi/login"
curl.exe -I "https://aca-admin-homeservices-prod.icybush-b2e9c876.centralindia.azurecontainerapps.io/dashboard"
curl.exe -i -H "Cookie: hs_setup=mock.setup.token" "https://aca-admin-homeservices-prod.icybush-b2e9c876.centralindia.azurecontainerapps.io/api/setup-token/exchange"
```

Expected smoke results:
- `/hi/login` returns `200`.
- `/dashboard` returns a redirect to `/hi/login?next=%2Fdashboard` when unauthenticated, with no `:3000` in the `Location`.
- `/api/setup-token/exchange` with a mock `hs_setup` cookie returns `200` and does not clear the cookie.
- For an authenticated admin, `/hi/dashboard` returns `200`.

If Docker Desktop returns engine `500` errors on Windows, restart the Docker Desktop WSL backend before rebuilding:

```powershell
Get-Process | Where-Object { $_.ProcessName -like "*Docker*" -or $_.ProcessName -like "com.docker*" -or $_.ProcessName -like "docker" } | Stop-Process -Force
wsl --terminate docker-desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -WindowStyle Hidden
Start-Sleep -Seconds 45
docker version
```

Do not direct users, screenshots, smoke tests, or production validation to `swa-homeservices-admin-prod`, `black-river-*.azurestaticapps.net`, or Static Web Apps workflows. Those are legacy unless the user explicitly approves a future cutover away from ACA.

## Override

Set `CLAUDE_OVERRIDE_REASON="<reason>"` to bypass a hook. Logged to `~/.claude/override-log.jsonl`.
