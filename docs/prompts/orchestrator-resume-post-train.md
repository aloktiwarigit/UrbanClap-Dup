# Resume prompt — gap-closure programme, post merge-train

> Paste everything below the line into a fresh session in `C:/Alok/Business Projects/Urbanclap-dup`.
> **Recommended model: Sonnet.** The merge train is finished and both parallel lanes have closed;
> what remains is deploy, cleanup, and starting the next story — none of which is an Opus trigger.
> Escalate to Opus only when you reach plan-writing for a high-blast-radius story, or Codex review
> synthesis.

---

You are resuming the owner-requirements gap-closure programme on `homeservices-mvp` (repo
`Urbanclap-dup`, home-services marketplace for Ayodhya, owner is Alok). The parallel merge train is
**complete** — Lane A and Lane B have both finished and closed. You are a single session again; there
are no peer sessions to coordinate with.

Read first, do not re-derive:
- `MEMORY.md` and the memory dir `C:/Users/alokt/.claude/projects/C--Alok-Business-Projects-Urbanclap-dup/memory/`
- `C:/Users/alokt/.claude/plans/validated-frolicking-mochi.md` (rev 2 — the **approved** build plan)
- `C:/Users/alokt/.claude/plans/act-as-a-principal-ticklish-fern.md` (owner decisions / defect analysis)

The plan is approved. Do not re-plan it.

## What landed (2026-09-09)

`origin/main` = `399fd2b5`. Seven merges, all verified:

```
399fd2b5  chore: ignore Codex transcripts by default + docs-ship filter fix (#331)
9dbed6a6  docs(stories): E21-S03 interface notes (#333)
6288dc58  docs(stories): E21-S04 interface notes (#332)
abf62ad4  E21-S04 — Dues-gated dispatch (dark) + reconciler + accept gate (#330)
61fbd871  docs(stories): E09-S08 interface notes (#329)
676296a8  E09-S08 — PII-safe phones + audited reveal (#328)
855d89b4  E21-S03 — admin commission console (#327)
```

Three stories built in three parallel worktrees, merged in the owner-approved order
E21-S03 → E09-S08 → E21-S04, with both smoke gates re-run by the orchestrator on each branch before
it pushed. Every git-ignored SDD ledger was extracted to `docs/stories/*-interface-notes.md` before
its worktree came down — read those three files before touching E21-S05 or E22.

## Do these, in this order

### 1. A root-config PR can stall forever — partly fixed, still open

**Resolved for `.gitignore`:** PR #331 sat `MERGEABLE` + `BLOCKED` for 50 minutes with **no checks at
all**. `main` requires the `quality-gate` context; a `.gitignore`-only PR matched no workflow's
`paths:` filter, so nothing ran and the required check could never be satisfied. `docs-ship.yml`
exists precisely to break this deadlock for docs-only PRs — its own header says so — but its filter
was `docs/**` plus its own filename, and **root config belongs to no sub-project**, so the same
deadlock sat one filter-gap over from its own fix. `.gitignore` was added to the filter in `399fd2b5`.

**Still open — these 8 root files match no workflow filter and will stall the same way.** Authoritative
list, from `git ls-tree origin/main | awk '$2=="blob" {print $4}'` (do not eyeball `ls-tree` output —
it lists trees alongside blobs, which is how an earlier count came out at 7):

```
.bmad-readiness-passed   .codex-review-passed   .firebaserc
.gitattributes           .semgrepignore         CLAUDE.md
TOKEN-SYNC.md            firebase.json
```

`CLAUDE.md` is edited fairly often, so this will recur.

**The fix, and it must replace the `- '.gitignore'` line rather than be added to it:**

```yaml
paths:
  - 'docs/**'
  - '.github/workflows/docs-ship.yml'
  - '*'      # root-level files only: Actions path globs treat * as "any char except /"
```

Widening by class rather than enumerating — enumeration is what produced this gap and carries the
risk of a further instance the next time a root file is added.

**Prove it, and note the trap in proving it.** `docs-ship.yml` self-triggers via its own filename, so
a PR editing only the workflow demonstrates **nothing** about whether `'*'` works. The honest proof is
a PR that also touches **one root file that is not the workflow** — a one-line edit to
`TOKEN-SYNC.md`, say — and confirming `quality-gate` actually reports. Skipping that would make this
another rule believed rather than tested, on the very change made to fix rules believed rather than
tested.

If a root-config PR ever does stall, the escape is `gh pr merge <n> --squash --admin` — but that is
the owner's call, not yours. Never push to `main` directly.

### 2. Deploy admin-web — the highest-value thing outstanding

**Two merged stories are invisible to the owner.** The commission console (#327) and the audited
contact reveal (#328) are on `main` and nowhere else. admin-web reaches production **only** through
the manual sequence in `admin-web/CLAUDE.md` → "Production deployment": Docker → GHCR → Container App
`aca-admin-homeservices-prod` in `rg-homeservices-prod`.

Never use Azure Static Web Apps, and never `.github/workflows/admin-ship.yml`, for admin-web deploys
— both are legacy. If any doc disagrees, ACA wins and the doc gets fixed.

Note the prod image also predates E22-S01, so Hindi typing in the catalogue is still missing until
this deploy lands.

### 3. Remove the spent worktrees

```
wt-e21-s03     docs/e21-s03-interface-notes   ledger extracted (#333) — safe to remove
wt-e21-s04     docs/e21-s04-interface-notes   ledger extracted (#332) — safe to remove
wt-deploy-main detached @ 9dbed6a6            INSPECTED: clean, no stash of its own — see below
wt-api36       chore/api-36-migration         UNRELATED work — leave alone
```

`git worktree remove <path>` then `git worktree prune`.

**`wt-deploy-main` has been inspected** (2026-09-09 18:52): created 18:34, tree **clean**, detached at
`9dbed6a6`, nothing uncommitted, no stash of its own. Neither closing lane claims it. It is therefore
free to either remove or **reuse for step 2** — it is one commit behind, so
`git fetch origin && git checkout 399fd2b5` first. Reusing it keeps the deploy out of the primary
checkout, which currently sits on the unrelated `fix/customer-privacy-policy-url`.

The three `git stash` entries visible from any worktree are **repo-wide and pre-existing** (from
`#282` and `fix/launch-blockers-batch1`), not from tonight's work. Leave them; they are older than
this programme.

### 4. Then the next wave, per the approved plan

`{E23-S01 incentives ∥ E24-S01 QR ∥ E22-S02 → S03 → S04}` → E21-S05 technician-app →
REL-1/REL-2 APKs → flag flips.

**E21-S05 is gated:** it must not ship in a way that makes the KYC flow *look* completable while it
is not — see issue #334's sibling constraint in `docs/stories/E21-S04-interface-notes.md`.

## Open tickets filed today

- **#334 (P1)** — a **service** `commissionBps` override outranks category and global, cannot be
  returned to inherit (category write body is `.nullable()`, service is not), and `ServiceForm` sends
  the field only when non-empty *and* changed, so emptying it is a silent no-op. No roster view lists
  which services carry one. Live on `main`. Fix needs both halves: nullable write body **and** a form
  that sends `null`, plus a read surface.
- **#335 (P2)** — `e2e-and-a11y` runs, fails, and is merged past. 4 of 13 specs red on `main` itself;
  the job is real but **not a required check**. Fix order is mandatory: repair the specs **first**,
  make the check required **second**.

## Standing constraints (owner-issued, binding)

- **Production Cosmos writes:** credentials are not in the repo. Pull them from the Functions app
  (`az functionapp config appsettings list -n func-homeservices-prod -g rg-homeservices-prod`), and
  **before any write, echo back the exact endpoint host and database name and wait for the owner's
  confirmation.** Never fall back to a local or dev endpoint, never invent a connection string.
  Endpoint `cosmos-homeservices-prod.documents.azure.com`, db `homeservices`.
- **No `--no-verify`** without `CLAUDE_OVERRIDE_REASON`.
- **Codex is the authoritative review gate**, not Claude. And `.codex-review-passed` is **tracked on
  `main` and rewritten by every merging PR**, so every branch inherits one asserting a clean review of
  another story's commit. Read its `commit` field, never its existence. Never delete or rewrite an
  inherited one.
- **Read-path Zod schemas only widen.** Strictness on write bodies only.
- No Sentry, by owner decision. No `SENTRY_DSN` on `func-homeservices-prod`, **zero** alert rules
  anywhere. Assume no telemetry will tell you about a prod defect.
- **`mergeStateStatus: UNSTABLE` is normal here** — it means `e2e-and-a11y` went red. Three passing
  `quality-gate` checks is the real signal.

## The pattern this programme keeps paying for

**A guard that does not cover its class.** Five independent instances surfaced in one afternoon:

- `docs/reviews/*-raw.md` — an ignore rule added after a real near-miss that matched **zero files
  across all history**. (Mine. Written in the urgency that made me not test it.)
- Cosmos `IS_DEFINED(c.kyc.panHash)` — true for a **present-but-null** property, so a PAN-*rejected*
  technician would have been admitted as verified. Caught inside the correction to an earlier bug.
- A mask guard test matching only `function maskPhone` and `const maskPhone =` — a `let`, arrow or
  class-method redeclaration walks past it.
- `docs-ship.yml` — a workflow created *specifically* to let docs-only PRs satisfy branch protection,
  whose own filter left root-level config stalling one gap over from its own fix.
- The fix for that, which covered `.gitignore` and was described as fixing the class — in the same
  message that named the pattern. **The failure survives knowing about it.** That is why the rule
  below is "prove it", not "remember it".

**After writing any guard, prove it against a realistic input** (`git check-ignore -v`, an actual
null-valued document, an actual alternate declaration). A guard written in response to a real
near-miss is when it feels most trustworthy and gets tested least.

Two related traps, same family — a mock that models an idealised dependency hides prod defects behind
green suites (Cosmos aggregate pages return `resources: undefined`, not `[]`; mocking `next-intl`
means no unit test can prove a key exists), and **nobody owns the question "should this path be in the
repo at all"** — two reviewers, a pre-push hook and CI all passed 2.58 MiB of Codex transcript into
`main` because each was checking whether the code in the diff was *right*. Read `git diff --stat`
before pushing.

## Open with the owner, not yet decided

- **The repo carries 92.4 MiB of raw Codex transcript under `docs/reviews/` — 45% of tracked bytes**
  (153 files; the 4 `.summary.md` distillations carry the review value at 8,901 bytes). Gitignore does
  not untrack, so #331 stops the bleeding but reclaims nothing. Removing it needs a history rewrite
  (rewrites every commit hash, forces every clone to reset) or `git rm --cached` (leaves history,
  stops new clones checking it out, but breaks four links from `docs/stories/E09-S08-interface-notes.md`).
  **Owner decision, at a moment of their choosing.** Do not fold it into another PR.
- **Prices still owed by the owner:** leak fix, tap install, pipe repair, new point wiring, fridge,
  cooler, washing machine, camera.

## Also known-open

KYC reaches `PAN_DONE` without Aadhaar and has no terminal state — prod has **16 technicians, zero
with any `kyc` object**, so `enforceKycInDispatch` is inert today and **must not be flipped until the
flow is completable in both orderings**. `patchTechnicianServiceProfile` still propagates
`kyc.kycStatus` to top-level `c.kycStatus` — how a retired field comes back. `typescript-eslint: ^8`
caret drift (lockfile pins 8.58.2; CI uses `--frozen-lockfile`, so CI is safe). `--color-warn` fails
light-mode contrast across four shipped components. `localStorage` pending remittance keys have no
TTL. Two differently-gated surfaces both named "Payout Queue".

Start by checking `git log origin/main --oneline -3` and `gh pr view 331`, then tell the owner where
things stand in a few lines. Do not re-summarise this prompt back at them.
