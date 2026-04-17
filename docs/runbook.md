# Runbook

## Service summary
TODO: one paragraph — what does this service do, who depends on it, where does it run.

## Oncall
- **Primary:** <name>, <contact>
- **Secondary:** <name>, <contact>
- **Escalation:** <client stakeholder>, <contact>

## Dashboards
- **Sentry:** <link>
- **PostHog:** <link>
- **Uptime:** <link>

## Common incidents

### 1. Elevated error rate (Sentry spike)
- Check Sentry for new exception type or regression in recent deploy.
- Rollback: `vercel rollback` or revert the last commit + redeploy.
- If 5xx from downstream: check vendor status pages.

### 2. Feature flag misbehaving
- GrowthBook UI → disable the flag.
- Confirm kill-switch logged to Sentry breadcrumbs.

### 3. Auth failures
TODO: specific auth provider steps.

### 4. Data issue
TODO: backup/restore procedure.

## Deploy procedure
- PR merged to `main` → CI green → auto-deploy preview → promote on approval.

## Post-incident
- Blameless postmortem in `docs/postmortems/YYYY-MM-DD-<slug>.md`.
- Update this runbook with any new failure mode discovered.
