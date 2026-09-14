# homeservices-mvp — Project-Level CLAUDE.md

**Placeholder name:** `homeservices-mvp` (will be renamed once brand-name is locked in Phase 2)
**Owner:** Alok Tiwari
**Stack:** multi-repo monorepo — Kotlin+Compose (2 Android apps) + Next.js (admin) + Node (API)
**Build constraint:** ₹0/month operational infra at pilot scale (Firebase + Azure free tiers; FCM as universal messaging spine)

## Read before you act

| Before you… | Read first |
|---|---|
| Plan or execute any story — ceremony tier, work-stream structure, story size gate, pre-Codex smoke gate, Android invariants, pattern library | `docs/rules/per-story-execution.md` |
| Add a dependency or service, change CI/template components, or check the BMAD artifact gate | `docs/rules/project-constraints.md` |
| Deploy admin-web | `admin-web/CLAUDE.md` → "Production deployment" |
| Review code before push or merge | Codex CLI is the only mandatory gate — see `~/.claude/CLAUDE.md` → "Review" and `~/.claude/memory/feedback_cross_model_review.md` |

Everything below this table binds directly and needs no further reading.

## Repository shape

```
/
├── customer-app/       # Android (Kotlin + Compose) — customer-facing
├── technician-app/     # Android (Kotlin + Compose) — vendor/partner-facing
├── admin-web/          # Next.js 15 + TypeScript — owner dashboard
├── api/                # Node 22 + TypeScript (Fastify/Hono) — backend
├── docs/               # Project-level BMAD artifacts (PRD, architecture, ADRs, stories, threat-model, runbook, ux-design, brainstorm)
├── tools/              # Cross-cutting scripts (md→docx converter, etc.)
├── _bmad/              # BMAD method config + skills scaffolding
└── _bmad-output/       # BMAD intermediate outputs (planning-artifacts/, implementation-artifacts/)
```

Each sub-project has its own `CLAUDE.md` with stack-specific rules. **This root file governs cross-cutting concerns only.**

## Production deployment ownership

- **Admin web canonical production frontend:** Azure Container Apps resource `aca-admin-homeservices-prod` in `rg-homeservices-prod`.
- **Canonical admin URL:** `https://aca-admin-homeservices-prod.icybush-b2e9c876.centralindia.azurecontainerapps.io`.
- **Canonical admin image registry:** GHCR image `ghcr.io/aloktiwarigit/urbanclap-dup-admin-web:<tag>`, updated on the ACA resource.
- **Admin API production backend:** Azure Functions resource `func-homeservices-prod`; admin-web must call it through same-origin `/admin-api/*` unless a task explicitly says otherwise.
- **Do not use Azure Static Web Apps for production admin validation or access.** Any `swa-homeservices-admin-prod`, `black-river-*.azurestaticapps.net`, or `.github/workflows/admin-ship.yml` references are legacy unless the user explicitly approves a new cutover.
- If admin deployment instructions conflict, ACA wins. Update the conflicting doc before proceeding.
- **Admin-web deploy runbook:** use `admin-web/CLAUDE.md` -> "Production deployment" for the exact Docker/GHCR/ACA PowerShell sequence and smoke checks. Do not deploy admin-web from `.github/workflows/admin-ship.yml`; that workflow is legacy SWA-oriented.

## Phase gate (enforced across all sub-projects)

**No `src/` or `app/src/` edits in any sub-project** until ALL of the following exist and are committed:

- the BMAD artifact list, ending with the `.bmad-readiness-passed` marker — enumerated in `docs/rules/project-constraints.md`

Per-sub-project hooks in `.claude/settings.json` enforce this. Root also enforces it.

## Model routing (within Claude Max)

**Mandatory self-selection rules live in `~/.claude/CLAUDE.md` → "Model routing … MANDATORY self-selection".** Every session announces its tier on turn 1 and offers a downgrade prompt when the task fits Sonnet/Haiku. Do not silently stay on Opus.

Project-specific trigger map (overrides the generic tiers only where noted):

- **Opus 4.7 (1M ctx)** — BMAD Phase 2 (PRD), Phase 4 (architecture + cross-cutting ADRs), Phase 4.5 adversarial review, Codex review synthesis, plans for high-blast-radius stories (auth, payments, dispatch, Cosmos schema changes)
- **Sonnet 4.6 (default)** — per-story implementation, TDD cycles, BMAD Phase 3 (UX), 4.5 stub-filling, Phase 5 (epics/stories — parallel per epic), routine debugging
- **Haiku 4.5** — codemod fanouts: renames, mechanical refactors, lint-fix passes, doc-index updates, Paparazzi golden re-records driven by a mechanical rule

Dispatch subagents in parallel whenever tasks are independent (e.g. 3 epics being decomposed into stories simultaneously). Subagents inherit the parent's model unless the dispatch explicitly picks a cheaper tier — prefer `model: "sonnet"` or `"haiku"` on the Agent call when the subtask is mechanical.

## Zero-cost infra (the binding architectural constraint)

Every architectural decision across all sub-projects must preserve ₹0/month operational cost at pilot scale (≤5,000 bookings/mo). See `docs/architecture.md` for the service-by-service free-tier budget.

Per-service free-tier ceiling table: `docs/rules/project-constraints.md`.

**Any PR that introduces a paid SaaS dependency must create an ADR and get explicit user approval.**

## Enterprise floor (ships with every template)

Component list: `docs/rules/project-constraints.md`.

**Do not remove any of these without an ADR.**

## Forbidden

- Paid external SaaS (CodeRabbit Pro, paid Figma, v0 Pro, Subframe, Kiro, Cursor, LaunchDarkly, etc.). See `~/.claude/memory/feedback_paid_tools.md`.
- Skipping phases of BMAD. The readiness gate exists for a reason.
- `--no-verify` on commits unless `CLAUDE_OVERRIDE_REASON` is set (logged to `~/.claude/override-log.jsonl`).
- Amending published commits.
- Direct push to `main` (must go through PR + CI).

## Root-config PRs and CI coverage

`main` requires the `quality-gate` context. Every `*-ship.yml` workflow is
scoped by a `paths:` filter to its own sub-project, so a PR touching **only**
a root-level file matches no filter, runs nothing, and can never satisfy the
required check — it sits `MERGEABLE` + `BLOCKED` with zero checks reported,
indefinitely. PR #331 stalled this way for 50 minutes.

`docs-ship.yml` is the workflow that covers this case. Its filter includes
`- '*'`, which in an Actions path glob means "any character except `/`" —
i.e. root-level files only, not sub-project paths. Do not narrow it back to an
enumerated list: enumeration is what left `.gitignore` uncovered in the first
place, and left eight more root files uncovered after that.

If a root-config PR ever does stall, the escape is
`gh pr merge <n> --squash --admin` — owner's call, never automatic. Never push
to `main` directly.

## Cross-cutting ADR scope

ADRs that span multiple sub-projects (e.g. "use FCM for all dispatch", "Cosmos DB schema conventions", "auth token format") live in **root `docs/adr/`**. Stack-specific ADRs (e.g. "use Hilt for DI in customer-app") live in the sub-project's own `docs/adr/` once that folder is populated.

## Emergency override

For genuine emergencies only:
```bash
CLAUDE_OVERRIDE_REASON="<detailed reason>" git commit --no-verify
```
Every override is logged to `~/.claude/override-log.jsonl`. No silent bypass.

## Next BMAD step

Phase 0 (this scaffold) complete → Phase 1 (brainstorming → `docs/brainstorm.md`) → Phase 2 (PRD) → Phase 3 (UX) → Phase 4 (architecture + ADRs) → Phase 4.5 (threat-model + runbook) → Phase 5 (epics + stories) → Phase 5.5 (readiness gate) → **unlocks per-story execution**.

Existing inputs: `_bmad-output/planning-artifacts/product-brief.md` (comprehensive 50 KB brief with full UC-parity scope, ₹0 constraint, and design strategy) feeds directly into Phase 1 → 2 → 3 → 4.
