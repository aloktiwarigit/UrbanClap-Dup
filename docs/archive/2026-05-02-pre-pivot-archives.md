# Pre-Pivot Branch Archive — 2026-05-02

This document captures every branch, stash, and worktree intentionally dropped during the post-Ayodhya-pivot cleanup on 2026-05-02. Reflog auto-expires entries after ~30 days; this doc preserves the SHAs and verification evidence permanently so any future session can recover specific files via `git show <SHA>:<path>`.

**Author:** Alok Tiwari (with Claude Code, principal-architect-mode)
**Companion plan:** `C:\Users\alokt\.claude\plans\mellow-orbiting-boot.md` ("Enterprise-grade completion plan — E02-S05-A + E08-S03")
**Companion audits:** Two Explore-agent deep-dives on the kept branches (in-session memory only)

---

## Active archive references on origin (permanent preservation)

These refs live under `origin/archive/*` indefinitely. They are NOT auto-cleaned. Inspect with `git ls-remote origin "archive/*"`.

### `archive/E08-S03-rating-transparency-pre-rebase-2026-05-02`

- **Tip SHA:** `fc78723164fa0b40110e0985517f76fce1c360d0`
- **Original branch name:** `feature/E08-S03-rating-transparency`
- **Original PR:** #52 (CLOSED on 2026-04-26 awaiting weekly Codex quota reset; never re-opened)
- **Branch base when forked:** `146834c` (E08-S04 abusive-shield merge, 2026-04-26)
- **Distance from main as of archive date:** 120 commits behind

#### What's in it
- Android: `MyRatingsScreen.kt`, `MyRatingsViewModel.kt`, `MyRatingsUiState.kt`, `GetMyRatingsSummaryUseCase.kt`, `TechRatingDtos.kt`, `RatingReceivedEventBus.kt`
- API: `tech-ratings.ts` handler + `getAllByTechnicianId` repo method + Zod schema additions
- Tests: `MyRatingsViewModelTest`, `RatingRepositoryImplTest` (partial — missing `getMyRatings()` test), `tech-ratings.test.ts` (7 tests)
- 1 Codex P1-fix commit (`fc78723 fix(e08-s03): P1 review fixes — authLevel anonymous on getTechRatings, time-relative trend test`)

#### Why archived (not shipped)

A Phase 0 capability check at 2026-05-02 revealed **main already has equivalent rating-transparency functionality** that landed via different PRs:
- `api/src/functions/tech-ratings.ts:17` — main has `visibleDocs = docs.filter(d => d.customerAppealRemoved !== true)` (the appeal-filter — branch REMOVED this)
- `api/src/schemas/rating.ts:46-81` — main has appeal fields (`customerAppealRemoved`, `appealDisputed`)
- `technician-app/.../TechRatingDtos.kt:16,62` — main's DTO already includes `appealDisputed` field
- `technician-app/.../MyRatingsViewModel.kt:21` — main's ViewModel already imports `FileRatingAppealUseCase`
- `technician-app/.../FileRatingAppealUseCase.kt` — main has the appeal use case (E08-S04 PR #53)
- `technician-app/.../TechRatingSummary.kt:23` — main's domain model has `appealDisputed: Boolean = false`

The archived branch is **functionally a regression** of the rating-transparency surface: it was forked before E08-S04 landed and removed the appeal-filter that E08-S04 expects. Shipping it would silently break the appeals product (techs would see appeal-removed ratings inflating their counts/trends).

#### Re-launch criteria (when this is worth revisiting)

Resume work from this archive ref ONLY if ALL three hold:
1. **E08-S04 appeal-filter semantics are revisited** AND there's a documented decision that techs SHOULD see appeal-removed ratings (currently they should NOT)
2. **Tech-retention metrics show rating-transparency UX is moving the retention needle** post-launch (i.e. the basic version on main is insufficient)
3. **Engineering capacity is available for the 4–6h conflict-resolution sprint** (28 conflicts across 40+ files, hottest in `api/src/schemas/rating.ts`, `api/src/functions/tech-ratings.ts`, `technician-app/.../MyRatingsScreen.kt`)

Per the audit, this branch is also missing:
- A `docs/stories/E08-S03-rating-transparency.md` story file (BMAD process debt)
- A Paparazzi golden for `MyRatingsScreenTest` (currently `@Disabled` stub; CI would block merge)
- An English `values/strings.xml` resource (branch hardcodes Hindi via raw string literals in Compose)
- A unit test for `RatingRepositoryImpl.getMyRatings()` (only `submit()` and `get()` are tested)

#### Recovery commands

```bash
# Re-materialize the branch locally
git fetch origin
git checkout -b feature/E08-S03-rating-transparency-recovered origin/archive/E08-S03-rating-transparency-pre-rebase-2026-05-02

# Or extract specific files
git show origin/archive/E08-S03-rating-transparency-pre-rebase-2026-05-02:technician-app/app/src/main/kotlin/com/homeservices/technician/ui/myratings/MyRatingsScreen.kt
```

---

## Reflog drops (auto-expire ~2026-06-01)

These were `git branch -D`'d on 2026-05-02. They live in the local `.git/reflog` for ~30 days, after which they may be garbage-collected. The SHAs below are recoverable in that window via `git checkout -b <new-name> <SHA>`.

### `wip/home-heroo-refinements-2026-05-01` @ `a70dd0d`

- **Content:** 68 files, +1845 / -7387 (net deletions). UI design refinements parked off `feature/E10-S01-karnataka-compliance` at session start on 2026-05-01.
- **Significance:** MEDIUM. Contains unique design docs that didn't merge:
  - `customer-app/.../ui/catalogue/CatalogueVisualImage.kt` (244 LOC component, never integrated)
  - `admin-web/docs/portal-issues-2026-05-01-codex-plan.md` (277 LOC remediation doc)
  - `admin-web/docs/portal-issues-2026-05-01.md` (115 LOC issue writeup)
  - `admin-web/docs/next-session-prompt.md` (next-session handoff prompt)
- **Why dropped:** Parent branch (`feature/E10-S01-karnataka-compliance`) was scope-contaminated and Home Heroo direction has shipped on main via PR #145; further iterations would conflict with current main rather than add value.
- **Note:** `admin-web/docs/*` content was rolled into PR #151 (audit-pass docs); these are duplicates here.

### `wip/e10-e11-leftovers-2026-05-01` @ `ef1d725`

- **Content:** 23 files, +173 / -1969 (net deletions). Cleanup branch parked off `feature/E12-pivot` by the E12-S01 executor.
- **Significance:** LOW. Mostly doc deletions; no feature code.
- **Why dropped:** Strict subset of stale state; deletions undid work that was rightfully on the parent branch at the time.

### `feature/design-earnings-screen` @ `3170409`

- **Content:** 150 files, +2874 / -18733. Orphan branch (no remote) with design artifacts + openapi regen.
- **Significance:** LOW. No implementation; mostly spec docs and openapi regeneration.
- **Why dropped:** Orphan branch with no remote, no PR ever opened; design direction superseded by Home Heroo overhaul on main (PR #145).

### Recovery within reflog window

```bash
# Find dangling commits (reflog auto-expires after gc)
git fsck --unreachable | grep commit

# Re-materialize a specific dropped branch
git checkout -b recovered-home-heroo a70dd0d
```

---

## Stashes dropped (12 total, all noise)

On 2026-05-02 a stash list of 12 entries was inspected and dropped. **None contained substantive code** — all were CRLF/encoding ping-pong on the same 3 codex review markdown files in `docs/reviews/`, plus a few empty stashes.

The stash that DID contain valuable content (operational procedures + threat-model addendum from 2026-04-26 audit pass) was preserved by being shipped as PR #151 (`docs: 2026-04-26 audit-pass — ops procedures + STRIDE addendum`, merged at commit `b205338`).

---

## External worktree directories swept

The following directories were git-removed and disk-deleted:

| Path | Branch | State at archive |
|---|---|---|
| `C:/Alok/Business Projects/homeservices-design-earnings/` | `feature/design-earnings-screen` (orphan) | Deleted (alt theme refactor; main has Home Heroo) |
| `C:/Alok/Business Projects/homeservices-W2-1-dpdp/` | `feature/E10-S05-dpdp-rights` | Already merged via PR #131 |
| `C:/Alok/Business Projects/homeservices-W2-2-auditlog/` | `feature/audit-log-p1-coverage` | Already merged |
| `C:/Alok/Business Projects/homeservices-W2-4-immutability/` | `feature/audit-log-immutability` | Already merged via PR #132 |
| `C:/Alok/Business Projects/homeservices-W2-5-admin-auth/` | `feature/admin-auth-hardening` | Already merged |
| `C:/Alok/Business Projects/homeservices-W2-7-tests/` | `feature/critical-path-test-hardening` | Already merged |
| `C:/Alok/Business Projects/wt-swa-deploy/` | `feat/admin-web-aca-migration` | Already merged via PR #149 |
| `C:/tmp/uc-oryx-remote/` | `codex-oryx-remote-build` | Work merged inline |

A two-Explore-agent audit confirmed these dirs were **byte-identical to main** after CRLF normalization — zero novel content was lost.

---

## In-session-memory audits (preserved by reference)

Two enterprise-grade audit reports (~700 lines each) were generated on 2026-05-02 to inform the cleanup decision:

1. **E02-S05-A audit** — confirmed branch is real unmerged backend work, ships via clean rebase, no UI yet (intentional Phase 1 scope; UI is E02-S05-B not yet planned)
2. **E08-S03 audit** — confirmed branch is ~85% complete but on stale base; main already has equivalent functionality via PR #53 (E08-S04 abusive shield); rebase would be regressive

Both audits are session artifacts; the conclusions are captured in the plan file at `C:\Users\alokt\.claude\plans\mellow-orbiting-boot.md`.

---

## Verification — confirm "no significant work lost"

```bash
# Active archive ref preserves E08-S03 work permanently
git ls-remote origin "archive/*"
# Expected: archive/E08-S03-rating-transparency-pre-rebase-2026-05-02 → fc78723...

# Reflog still has the wip/* drops for ~30 days
git fsck --unreachable | grep commit
# Expected: SHAs a70dd0d, ef1d725, 3170409 listed

# Recovery for any specific file
git show <SHA>:<path>
```

If any future-you (or a paranoid auditor) asks "what about that branch from May 2026?" — this doc, plus `git fsck` for the reflog window, plus `archive/*` refs on origin, are the canonical record.
