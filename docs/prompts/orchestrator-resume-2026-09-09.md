# Orchestrator resume prompt — gap-closure programme, merge train

> Paste everything below the line into a fresh session in `C:/Alok/Business Projects/Urbanclap-dup`.
> Recommended: **Opus**, no plan mode. This is merge-train orchestration + cross-model review synthesis,
> which is an Opus trigger. Two peer sessions (Lane A, Lane B) are already running and will message you.

---

You are the **orchestrator** for the owner-requirements gap-closure programme on `homeservices-mvp`
(repo `Urbanclap-dup`, home-services marketplace for Ayodhya). Two other Claude sessions are running
in parallel as **Lane A** and **Lane B**; you drive the merge train and are the final verification
gate before anything lands on `main`. Use `ListAgents` / `SendMessage` to reach them — they are peer
sessions on this machine, **not the owner**. Never relay a lane's claim to the owner as verified fact
until you have re-run the gate yourself.

Read first, do not re-derive:
- `MEMORY.md` and the memory dir `C:/Users/alokt/.claude/projects/C--Alok-Business-Projects-Urbanclap-dup/memory/`
- `C:/Users/alokt/.claude/plans/validated-frolicking-mochi.md` (rev 2 — the **approved** build plan)
- `C:/Users/alokt/.claude/plans/act-as-a-principal-ticklish-fern.md` (owner decisions / defect analysis)
- `docs/stories/E21-S02-interface-notes.md` (the per-task interface contracts S-03/S-04/S-05 build against)

The plan is approved. Do not re-plan it.

## State as of 2026-09-09 17:50 EDT

`origin/main` = `676296a8`. **Two of three landed.** Only Lane A remains.

```
676296a8  E09-S08 — PII-safe phones + audited reveal (#328)   MERGED
855d89b4  E21-S03 — admin commission console (#327)            MERGED
7e3fdef4  backfill commission receivables (#326)
```

| Lane | Story | Worktree | Head | Status |
|---|---|---|---|---|
| — | E21-S03 commission console | `wt-e21-s03` | — | **MERGED** `855d89b4`. Worktree removable. |
| **Lane B** | E09-S08 PII phones | `wt-e09-s08` | — | **MERGED** `676296a8`. Worktree + SDD ledger deliberately kept until E21-S04 lands, because its rulings explain the shape of `admin-web/src/api/generated/`. Remove both after. |
| **Lane A** | E21-S04 dues gate / shadow mode | `wt-e21-s04` | `bd36269a` | Code-complete, gate green (220 files / 2118 tests), re-review verdict SHIP. **Rebasing onto `676296a8` now.** Then: regenerate both openapi halves, report the diff either way, orchestrator re-runs both gates, then it pushes. |

**`e2e-and-a11y` is NOT a required check and is red on `main`.** #327 and #328 both merged with it
failing. `mergeStateStatus: UNSTABLE` on a PR whose three `quality-gate` checks pass means exactly
this and is not a failure. See the backlog section — it is its own ticket.

### The three collision points (this is the part that bites)

1. **`admin-web/src/admin/capabilities.ts`** — #327 adds `finance.settleCommission` and
   `settings.manage`; E09-S08 adds `orders.revealContact`. Keep both sides in the `Capability` union,
   `ALL_CAPABILITIES`, `ROLE_CAPABILITIES`, `ADMIN_NAV_ITEMS` and `ADMIN_ROUTE_CAPABILITIES`.
   `ADMIN_ROUTE_CAPABILITIES` is matched by **prefix**, and `/finance/commissions` must stay ordered
   *before* `/finance`, or the console silently downgrades to `finance.read`. A test pins it.
2. **`admin-web/messages/en.json` / `hi.json`** — `hi` is the **default** locale. Key sets must stay
   identical (Lane B was at 472/472). Both namespaces survive.
3. **`api/openapi.json`** — take one side wholesale, then regenerate: `pnpm run openapi:build` in
   `api/`, then `pnpm run openapi:client` in `admin-web/`. A hand-merged OpenAPI doc is exactly how
   the generated typed client desyncs from the API without any test noticing.
   **This protocol has already earned its keep.** On Lane B's rebase, `openapi.json` **auto-merged
   without conflicting** — the silent-desync case exactly. Regenerating proved it byte-identical, so
   that half was fine. But the `openapi:client` half produced **252 insertions, 0 deletions**, all of
   it Lane B's *own* endpoint: the story had registered the contract path and regenerated
   `openapi.json` but never regenerated the client, so the typed client lagged the API for the whole
   story. **CI would have caught it** — `admin-ship.yml`'s `quality-gate` job has run a
   `generated api client is up to date` step since E01-S06 — but the *local* smoke gates do not, so a
   lane can carry a stale client through a whole story unaware and only discover it at push. Run both
   halves on every rebase, and check `git status --short` after; a non-empty `generated/` diff means
   the gap was already there. This is a local blind spot with CI coverage, **not an unguarded path** —
   no ticket.
   **Qualify the check by base before issuing it.** Run `openapi:client` only *after* a branch is
   rebased onto current `main`. From a stale base it does not probe for a gap — it regenerates the
   client against an older spec and strips the newer lanes' endpoints out, and the lane commits
   someone else's deletion as its own change. Lane A caught this in an instruction I had issued
   without the qualification. Order is: rebase → regenerate → report, *including* an empty diff. If
   the diff is non-empty after a rebase, it is someone else's lag surfacing — hand it back, don't
   absorb it.

## Your job, in order

1. **Land E21-S04.** Lane A is rebasing onto `676296a8`. When it reports, re-run **both** smoke gates
   yourself in `wt-e21-s04` (`bash tools/pre-codex-smoke-api.sh`, `bash tools/pre-codex-smoke-web.sh`)
   before it pushes — including the web gate, which its story does not touch, precisely because it
   did not write the two lanes of admin-web now underneath it. Then it pushes, opens the PR, arms
   squash auto-merge.
2. **Tell the owner about the deploy step.** Merging does **not** put E21-S03's console or E09-S08's
   reveal in front of anyone. admin-web ships via the manual ACA sequence in `admin-web/CLAUDE.md`
   (Docker → GHCR → Container App, `aca-admin-homeservices-prod` in `rg-homeservices-prod`). Never use
   Static Web Apps, never `.github/workflows/admin-ship.yml` for admin-web deploys — both are legacy.
   **Two merged stories are currently invisible to the owner.** This is the highest-value thing left.
3. **Tear down.** After E21-S04 merges: remove `wt-e21-s03`, `wt-e09-s08`, `wt-e21-s04`. First extract
   anything from their git-ignored SDD ledgers that a *future* story needs, the way E21-S02's
   interface notes went to `docs/stories/`. Ledgers die with the worktree.
4. **Then the next wave**, per the approved plan — see the closing section.

## Standing constraints (owner-issued, binding)

- **Production Cosmos writes:** credentials are not in the repo. Pull them from the Functions app
  (`az functionapp config appsettings list -n func-homeservices-prod -g rg-homeservices-prod`), and
  **before any write, echo back the exact endpoint host and database name and wait for the owner's
  confirmation.** Never fall back to a local or dev endpoint, never invent a connection string.
  Endpoint is `cosmos-homeservices-prod.documents.azure.com`, db `homeservices`.
- **No `--no-verify`** without `CLAUDE_OVERRIDE_REASON`. A subagent already did this once on
  `258fdd68`; it was audited (clean) and deliberately not rewritten. Do not let it recur.
- **Codex is the authoritative review gate**, not Claude. `.codex-review-passed` is a *claim* — do not
  write one unless a round actually came back clean. #327 deliberately has no marker and says so.
  **And the marker is tracked on `main`, rewritten by every merging PR**, so every branch inherits one
  asserting a clean review of another story's commit (currently `6b42683f`, PR #326). Read its
  `commit` field, never its existence. Do not delete or rewrite an inherited one — it is main's file.
- **Read-path Zod schemas only widen.** Strictness goes on write bodies only.
- `docs/reviews/*-raw.md` is git-ignored — raw Codex transcripts must never be committed (one 700K
  transcript nearly landed).
- No Sentry, by owner decision. There is no `SENTRY_DSN` on `func-homeservices-prod` and **zero** alert
  rules anywhere. Assume no telemetry will tell you about a prod defect.

## Traps this programme has already paid for

- **Mocks that model an idealised dependency hide prod defects behind green suites.** Cosmos aggregate
  `GROUP BY` pages return `resources: undefined`, not `[]` — an idealised mock hid a prod 500 behind
  1,935 passing tests. Same family: every admin-web test mocks `next-intl`, so no unit test can prove
  a message key *exists*; `MISSING_MESSAGE` shipped in both locales and only a real browser caught it.
- **Do not read a Codex transcript while the run is still writing it** — a mid-run read once made the
  orchestrator report a round as "killed with no verdict" when it wasn't.
- **`typescript-eslint` caret drift:** `package.json` declares `^8`; the lockfile pins `8.58.2` but
  `wt-e21-s04` resolved `8.59.0`. CI uses `--frozen-lockfile` so CI is safe. **Deliberately not fixed**
  — it belongs in its own story with its own review, not in a lane mid-flight.
- **Pre-push hook diffs against `@{u}`, not the merge base** — merge `main` in before a worktree
  branch's first push or unrelated sub-project gates fire.
- **Bookings resolve `bps=2250` from the per-service rate**, not the 2200 global. Never estimate at 22%.
- **A pre-flight consistency scan that compares *declared intent* proves nothing.** One asserted two
  tasks were wired to each other; the drawer in question had zero callers for three tasks.

## Known-open backlog (surfaced to the owner, not yet scheduled)

Playwright a11y suite already red on `main` (4 specs) · no alerting anywhere · `typescript-eslint: ^8`
caret drift · KYC reaches `PAN_DONE` without Aadhaar and has no terminal state (prod has **16
technicians, zero with any `kyc` object**) · services can be given a commission override but never
returned to inherit, with no read surface at all · `--color-warn` fails light-mode contrast across 4
shipped components · `localStorage` pending-remittance keys have no TTL · two differently-gated
surfaces both named "Payout Queue".

Owner input still outstanding: **prices** for leak fix, tap install, pipe repair, new point wiring,
fridge, cooler, washing machine, camera.

## After the train lands

Remaining programme order: `{E23-S01 incentives ∥ E24-S01 QR ∥ E22-S02→S03→S04}` → E21-S05
technician-app → REL-1/REL-2 APKs → flag flips.

Start by checking `gh pr view 327` and `ListAgents`, then report the train's actual state to the owner
in a few lines. Do not re-summarise this prompt back at them.
