# Codex Merge Train — 2026-04-28

**Quota reset:** 2026-04-28 17:37 IST (Codex weekly cap)
**Owner:** Alok Tiwari
**Estimated wall-clock:** 3.5–5 hours (six PRs, sequential, ~30–50 min each)
**Last reviewed:** 2026-04-26

---

## Why this runbook exists

Six PRs are queued behind the Codex quota wall, with non-trivial base-branch
relationships. Three of them (E08-S01, E08-S03, E08-S04) are stacked on
`chore/paparazzi-golden-batch-record` rather than living in independent branches off
`main`. After the first stacked PR merges, the others' diffs against `main` will
double-count commits unless we rebase between merges.

Without a runbook, mid-train decisions ("wait, what was the base for #52?")
compound into mistakes. Follow the steps below mechanically. **Do not improvise.**

---

## The queue (strict sequential order)

| # | Story | PR | Branch | State | Special handling |
|---|-------|----|--------|-------|------------------|
| 1 | E07-S04 | TBD | `feature/E07-S04-noshow-detection` | Local, not pushed | Push first → opens PR |
| 2 | E07-S05 | #51 | `feature/E07-S05-safety-sos` | Open | Standard |
| 3 | E08-S01 | TBD | `chore/paparazzi-golden-batch-record` (S01 commits only) | Stacked, no own PR | **Cherry-pick S01 commits onto fresh branch from main, then PR** |
| 4 | E08-S03 | #52 | `feature/E08-S03-rating-transparency` | Open, base on chore | **Rebase onto main after step 3 merges** |
| 5 | E08-S04 | #53 | `feature/E08-S04-abusive-shield` | Open, base on chore | **Rebase onto main after step 4 merges** |
| 6 | E10-S01 | #54 | `feature/E10-S01-karnataka-compliance` | Open as of 2026-04-26 | Standard |

After this train: E08-S02 (Razorpay payout) → E10-S04 (launch gate) → public launch.

---

## Pre-flight checks (T=0, before opening any PR)

Run these in order. Stop if any fail.

```bash
# 1. Verify Codex is back online (look for non-zero quota)
codex --version
codex review --help | head -5    # should not error with "quota exceeded"

# 2. Confirm working directory clean and on main
cd "C:/Alok/Business Projects/Urbanclap-dup"
git fetch origin
git checkout main
git pull --ff-only origin main
git status                       # must show "nothing to commit, working tree clean"
git log --oneline -5             # confirm latest commit matches GitHub main HEAD

# 3. Verify all expected PRs are open and CI green
gh pr list --state open --json number,title,headRefName,mergeable,statusCheckRollup
# Expect: #51, #52, #53, plus E10-S01 PR (likely #54 or #55)

# 4. Save current branch list for rollback
git branch -a > /tmp/pre-train-branches.txt
gh pr list --state open --json number,headRefName > /tmp/pre-train-prs.json

# 5. Kill any leftover worktrees from prior sessions (clean baseline)
git worktree list
# If any are stale (story already merged), `git worktree remove <path>`
```

**Stop if:**
- Codex quota still 0 (wait 10 min, retry; if persists, file ChatGPT support)
- `git status` shows uncommitted changes (stash or commit before proceeding)
- A PR shows `mergeable: CONFLICTING` (note it; rebase before reaching that step)

---

## Per-PR runbook (the loop you repeat 6 times)

This is the canonical sequence. Every PR follows it; the per-step sections below only
note deviations.

```bash
# ── 0. Set context for this PR ─────────────────────────────────────────────
PR=##                                  # current PR number (e.g. 51)
BRANCH=feature/E0X-S0X-...             # current branch name
STORY=E0X-S0X
echo ">>> Starting $STORY (PR #$PR, branch $BRANCH)"

# ── 1. Pre-Codex sanity ────────────────────────────────────────────────────
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

# Confirm base is up-to-date with main (handles in-flight merges from earlier PRs)
git fetch origin main
git log --oneline origin/main..HEAD | head -5     # what's NEW in this PR
git log --oneline HEAD..origin/main | head -5     # what main has that this branch doesn't

# If main has commits this branch doesn't — REBASE before Codex (saves a round)
if [ -n "$(git log --oneline HEAD..origin/main)" ]; then
  echo ">>> Rebasing $BRANCH onto origin/main"
  git rebase origin/main
  # Resolve conflicts if any → git add . → git rebase --continue
  git push --force-with-lease origin "$BRANCH"
fi

# ── 2. Run Codex review ────────────────────────────────────────────────────
codex review --base main 2>&1 | tee "/tmp/codex-$STORY-round1.log"

# Codex output → either:
#   (a) "No P1 issues. .codex-review-passed written."
#   (b) "N P1 issues found. See above."

# ── 3. P1 fix loop (skip if no P1s) ────────────────────────────────────────
ROUND=1
while grep -q "P1 issues found" "/tmp/codex-$STORY-round$ROUND.log"; do
  echo ">>> Round $ROUND P1s — fixing"
  # Read the log, fix each P1 in order, run pre-codex smoke after each
  # (The actual fixes are story-specific. Common patterns:
  #  - Auth-level mismatch    → set authLevel: 'anonymous' + middleware
  #  - Validation gap         → add Zod safeParse before destructure
  #  - Missing test           → write red test, then green it
  #  - Race condition         → ETag + retry loop)
  bash tools/pre-codex-smoke-api.sh         # must exit 0
  # if Android changes:
  bash tools/pre-codex-smoke.sh technician-app   # must exit 0

  git add -A
  git commit -m "fix($STORY): Codex round $ROUND P1s"
  git push origin "$BRANCH"

  ROUND=$((ROUND + 1))
  codex review --base main 2>&1 | tee "/tmp/codex-$STORY-round$ROUND.log"

  # Hard cap: 5 rounds. If Codex still flags P1s after round 5, escalate.
  if [ $ROUND -gt 5 ]; then
    echo "!!! 5+ rounds without convergence — STOP. Investigate before proceeding."
    exit 1
  fi
done

# ── 4. Commit the .codex-review-passed marker ──────────────────────────────
# Codex writes .codex-review-passed automatically on the round that succeeds.
# Confirm it's keyed to current HEAD SHA:
HEAD_SHA=$(git rev-parse HEAD)
grep "$HEAD_SHA" .codex-review-passed   # must match
git add .codex-review-passed
git commit -m "chore($STORY): Codex review passed (round $ROUND)"
git push origin "$BRANCH"

# ── 5. Merge ───────────────────────────────────────────────────────────────
# Wait for CI green on the marker push (auto-merge fires when CI green + Codex marker
# present + no merge conflicts).
gh pr checks "$PR" --watch                # polls until CI complete
gh pr merge "$PR" --squash --delete-branch

# Verify merge landed on main:
git checkout main
git pull --ff-only origin main
git log --oneline -3                      # should show the squash merge

# ── 6. Update memory + audit table ─────────────────────────────────────────
# (After all 6 PRs merged, single update — see § Post-train cleanup)
echo ">>> $STORY merged. Moving to next."
```

---

## Step 1 — E07-S04 (push from local)

```bash
git checkout feature/E07-S04-noshow-detection
git rebase origin/main                              # bring up to date
# Resolve conflicts if any (likely minimal — story is self-contained)
git push -u origin feature/E07-S04-noshow-detection

# Open PR
gh pr create \
  --base main \
  --head feature/E07-S04-noshow-detection \
  --title "feat(E07-S04): no-show detection + auto-credit" \
  --body "$(cat <<'EOF'
## Summary
- 30-min no-show timer fires after slotWindow start
- Auto ₹500 credit to customer on tech no-show
- Re-dispatch to next candidate
- 10 Codex rounds completed locally pre-quota; .codex-review-passed-manual on branch

## Test plan
- [ ] CI green
- [ ] Codex review (this run)

EOF
)"
# Note the assigned PR number — fill into queue table
```

Then run the standard per-PR runbook above. Notes:
- This PR has `.codex-review-passed-manual` from the local 10-round loop. Codex will
  re-review against current HEAD; expect 0–2 P1s if the local rounds were thorough.
- If CI fails (lint/tests) on first push, fix locally, force-push, and Codex sees the fixed
  state.

---

## Step 2 — PR #51 (E07-S05)

Standard runbook. Branch is `feature/E07-S05-safety-sos`.

Notes:
- 19 tests, ETag race fix, audio consent flow already addressed locally.
- After step 1 merges, rebase #51 onto updated main before running Codex.

---

## Step 3 — E08-S01 (extract from chore branch into a clean PR)

This is the trickiest step. The S01 commits are on `chore/paparazzi-golden-batch-record`
along with S03 + S04 commits. We need a clean PR that contains ONLY S01.

```bash
# Identify S01 commits on the chore branch
git checkout chore/paparazzi-golden-batch-record
git pull --ff-only origin chore/paparazzi-golden-batch-record
git log --oneline | grep "e08-s01"
# Expected output (per session-start git status):
#   7f8a5d4 feat(e08-s01): Hilt EarningsModule
#   e7021fd feat(e08-s01): EarningsRepository + GetEarningsUseCase with TDD
#   8ca9604 feat(e08-s01): domain model, DTOs, EarningsApiService interface
#   d93cf6e feat(e08-s01): EarningsUpdateEventBus + FCM EARNINGS_UPDATE handler
#   ab55d7d fix(e08-s01): authLevel anonymous, setUTCHours, repo JSDoc, week/month tests
# Save the SHAs in chronological order (oldest first):
S01_SHAS="d93cf6e 8ca9604 e7021fd 7f8a5d4 ab55d7d"
# (verify with `git log --oneline --reverse | grep e08-s01` to be safe)

# Create fresh branch from main
git checkout main
git pull --ff-only origin main
git checkout -b feature/E08-S01-earnings-dashboard

# Cherry-pick the S01 commits in order
for SHA in $S01_SHAS; do
  git cherry-pick "$SHA"
  # If conflicts: most likely libs.versions.toml — accept the chore branch version
  # (it should match customer-app already)
  # git add ... && git cherry-pick --continue
done

# Verify the clean branch contains only S01 changes
git diff main --stat
# Expected: ~16 files, ~700 lines added (per E08-S01 story scope)
# If it includes S03/S04 files (myratings/, shield/), STOP — wrong commits picked

# Smoke gates
bash tools/pre-codex-smoke-api.sh
bash tools/pre-codex-smoke.sh technician-app

# Push + open PR
git push -u origin feature/E08-S01-earnings-dashboard
gh pr create \
  --base main \
  --head feature/E08-S01-earnings-dashboard \
  --title "feat(E08-S01): tech earnings dashboard" \
  --body "$(cat <<'EOF'
## Summary
- GET /v1/technicians/me/earnings — today/week/month/lifetime + 7-day sparkline
- EarningsScreen on home_dashboard, FCM EARNINGS_UPDATE refresh
- Cherry-picked from chore/paparazzi-golden-batch-record onto fresh main base
  to keep diff scoped to S01 only

## Test plan
- [ ] CI green
- [ ] Codex review (this run)

EOF
)"
```

Then standard runbook: codex review → P1 loop → marker → merge.

---

## Step 4 — PR #52 (E08-S03) — rebase onto main first

After step 3 merges, S01 commits are now on main. PR #52 is based on the chore branch
which still has the duplicated S01 commits.

```bash
git fetch origin
git checkout feature/E08-S03-rating-transparency
git pull --ff-only origin feature/E08-S03-rating-transparency

# Rebase onto updated main
git rebase origin/main
# This will re-apply only the S03-specific commits (the S01 commits are already on main
# and git will skip them OR flag conflicts since the squash merge SHAs differ).
#
# Conflict resolution pattern:
#   - libs.versions.toml: take main's version (already synced)
#   - HomeGraph.kt: keep S03's additions (ratings_transparency route)
#   - EarningsScreen.kt: keep S03's onViewRatings parameter
#   - HomeservicesFcmService.kt: keep S03's RATING_RECEIVED handler
#   - AppNavigation.kt: keep S03's RatingReceivedEventBus param
#   - MainActivity.kt: keep S03's @Inject ratingReceivedEventBus
#
# After resolving each conflict file:
#   git add <file> && git rebase --continue
#
# If you get lost, abort and re-plan: git rebase --abort

# Sanity check: diff against main should be ONLY S03 changes
git diff main --stat
# Expected: ~14 files (api/src/functions/tech-ratings.ts, api/src/cosmos/rating-repository.ts
# additions, technician-app ui/myratings/, data/rating extensions, RatingReceivedEventBus)

# Force-push (rebase rewrote history)
git push --force-with-lease origin feature/E08-S03-rating-transparency

# Then standard runbook for codex review + merge.
```

---

## Step 5 — PR #53 (E08-S04) — rebase onto main first

Same pattern as step 4. After steps 3 and 4 merge, S01 + S03 are on main. Rebase #53.

```bash
git checkout feature/E08-S04-abusive-shield
git pull --ff-only origin feature/E08-S04-abusive-shield
git rebase origin/main

# Conflict resolution pattern (S04-specific):
#   - api/src/schemas/complaint.ts: keep S04's new types (ABUSIVE_CUSTOMER_SHIELD,
#     RATING_APPEAL) and resolution categories
#   - api/src/schemas/technician.ts: keep S04's blockedCustomerIds field
#   - api/src/schemas/rating.ts: keep S04's appeal flags (added on top of S03's
#     appeal-related fields if any)
#   - api/src/services/dispatcher.service.ts: keep S04's block-list filter
#   - api/src/functions/admin/complaints/patch.ts: keep S04's RATING_APPEAL hook
#   - api/src/functions/tech-ratings.ts: keep S04's customerAppealRemoved filter
#     (additive on top of S03's getTechRatingsHandler)
#   - technician-app: ActiveJobScreen, MyRatingsScreen — keep S04's new buttons/sheets

git diff main --stat
# Expected: ~30 files (per session report: 19 api + 28 technician-app, but minus what's
# now on main from S01/S03 = ~30 unique S04 files)

git push --force-with-lease origin feature/E08-S04-abusive-shield
# Standard runbook from here.
```

---

## Step 6 — PR #54 (E10-S01, Karnataka compliance test)

Standard runbook. By the time we reach this step, main has S01 + S03 + S04 merged.

Notes:
- API-only story, no source changes (4-layer enforcement: schema check + Semgrep
  + tests + ADR-0011 + dispatch-algorithm.md). 9 new tests, 580/580 API suite
  passing pre-train.
- Codex round 1 should pass cleanly given the small surface and zero source changes.
- Pay attention to the Semgrep CI step — confirm the new `api/.semgrep.yml` is being
  loaded (look for "1 rules loaded from api/.semgrep.yml" in CI logs).
- ADR is numbered 0011 (not 0010 as a draft prompt suggested) — there was already an
  0010 in the repo. Don't try to renumber.

---

## Audit table — fill in during the session

| # | Story | PR | Codex round 1 P1s | Total rounds | Merge SHA | Wall-clock | Notes |
|---|-------|----|--------------------|---------------|-----------|------------|-------|
| 1 | E07-S04 |   |                    |               |           |            |       |
| 2 | E07-S05 | 51 |                    |               |           |            |       |
| 3 | E08-S01 |   |                    |               |           |            |       |
| 4 | E08-S03 | 52 |                    |               |           |            |       |
| 5 | E08-S04 | 53 |                    |               |           |            |       |
| 6 | E10-S01 |   |                    |               |           |            |       |

---

## Rollback paths

### "Codex finds a P1 in already-merged story X — story Y depends on it"
1. Identify the bad commit in story X's squash merge.
2. Open a fix PR (`fix/E0X-S0X-codex-pX`) directly off main — do NOT amend the merged
   squash commit.
3. Run codex on the fix PR before merging it.
4. After fix merges, rebase any in-flight stacked PRs onto updated main.

### "Merge introduces CI failure on main"
1. Do NOT proceed to the next PR.
2. `gh pr revert <merged-PR>` to create a revert PR.
3. Fix the underlying issue locally on a new branch, codex it, merge.
4. Resume the train from the revert point.

### "Stuck in P1 loop > 5 rounds"
1. Stop the run for that PR.
2. Read all 5 round logs side-by-side: are the P1s the same recurring issues, or new ones?
3. If recurring → the fix is wrong; revert and re-think.
4. If new each round → Codex may be finding cascading issues from a fundamental design
   flaw; consider closing the PR and re-planning.

### "Codex quota runs out mid-train"
1. Check date — quota resets weekly.
2. PRs with `.codex-review-passed` already committed are safe to merge with `gh pr merge`.
3. PRs without the marker stay open, no auto-merge.
4. Resume next week.

---

## Post-train cleanup

```bash
# 1. Sync local main
git checkout main
git pull --ff-only origin main
git log --oneline -10                          # confirm 6 squash merges visible

# 2. Delete merged local branches
git branch --merged main | grep -v "^\*\|main$" | xargs -r git branch -d

# 3. Delete remote tracking refs
git fetch --prune

# 4. Delete the chore stack branch (S01/S03/S04 commits are now on main via squash)
git push origin --delete chore/paparazzi-golden-batch-record
git branch -D chore/paparazzi-golden-batch-record

# 5. Trigger Paparazzi golden record workflow (was deferred during the train)
gh workflow run paparazzi-record.yml --ref main -f app=technician-app
gh workflow run paparazzi-record.yml --ref main -f app=customer-app
# Each produces a follow-up "chore: Paparazzi goldens for $APP" PR — merge those
# normally (no Codex gate needed for golden recordings — they're machine-generated).

# 6. Update memory files
# Edit C:/Users/alokt/.claude/projects/.../memory/project_homeservices_sprint_state.md
#   - Stories done: bump from 33 to 39
#   - Move E07-S04, E07-S05, E08-S01, E08-S03, E08-S04, E10-S01 from "remaining" to "done"
#   - Append PR #s to PRs reference table with merge dates
# Edit .remember/remember.md
#   - State: "43/45 merged. Remaining: E08-S02 (Razorpay payout) + E10-S04 (launch gate)"
#   - Next: E08-S02 prompt
```

---

## What's next after this train

| Story | Why deferred until now | Strategy |
|-------|------------------------|----------|
| E08-S02 | Razorpay payout cadence — payment story, non-negotiable Codex gate. With Codex now reliably available, safe to implement + review in same session. | Foundation tier. Fresh session, brainstorm → plan → execute → codex → merge in one flow. |
| E10-S04 | Launch readiness gate — must be last to validate the full stack. | Foundation tier. Includes DR drill, marketing-pause toggle, soft-launch flag. |

After both: pilot launch (Bengaluru, Karnataka — chosen per OQ-2 in PRD).

---

## One-line summary for sticky-note next to the desk

> Pre-flight → for each PR (rebase → codex → P1 loop ≤5 → marker → merge) → post-train
> cleanup. Track in audit table. Don't improvise base branches.

---

*Runbook generated 2026-04-26 by orchestrator session. Review and adjust SHAs / branch
names if state has drifted before 2026-04-28.*
