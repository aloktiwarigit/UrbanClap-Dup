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
