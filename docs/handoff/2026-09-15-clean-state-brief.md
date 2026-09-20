# Clean-State Brief — Release Engineering / DevOps

**Written:** 2026-09-15 22:15 EDT
**Goal of next session:** get the repo, the release pipeline and both Android apps into a
verifiably clean state. **Do not deploy or upload anything until the exit criteria at the bottom
are met.**

Every fact below was verified by command at the time of writing, not recalled. Re-verify anything
load-bearing before acting on it — some of it will have moved.

---

## 1. What is ALREADY correct — do not redo these

| Thing | State | How it was verified |
|---|---|---|
| Prod catalogue data | **6 categories, 19 active services** | seed ran 21:53 EDT; before/after diff showed zero price drift across all 20 pre-existing services |
| Backend API | **deployed and current** | `GET /api/v1/health` returns `commit: 14cb0644` (PR #362). Nothing merged since touches `api/` |
| `/v1/categories` live | returns 6 categories incl. Appliance Repair (4 services) | curl against prod |
| Technician app on owner's Moto G | versionCode **16** / 0.1.13, launches clean | `adb shell dumpsys package in.homeheroo.technician` |
| Merged to main tonight | #362 (ADR-0030 activation), #363 (live catalogue + skill-loss fixes), #364 (Hindi guard), #365 (vc16 bump) | `git log origin/main` |

**Implication:** the backend and the data are done. The remaining work is Android release
engineering and repo hygiene — nothing server-side.

---

## 2. THE BLOCKER — Play rejects both apps today

Play Console rejected the technician upload:

> Your app currently targets API level 35 and must target at least API level 36

There is a **second rejection waiting behind it** that will hit as soon as the first is cleared:
a 16KB page-size rejection, fixed by a Sentry SDK bump.

### 2a. Work in progress — `wt-sdk36` worktree, NOT committed

A worktree exists at `C:/Alok/Business Projects/wt-sdk36` on branch `fix/target-sdk-36`, branched
from `origin/main`. It contains a cherry-pick of `2f770532` (from the stale branch, see §3) with
conflicts already resolved:

- `compileSdk` / `targetSdk` **35 → 36 in BOTH apps**
- edge-to-edge inset fixes across 9 Compose screens (the original commit audited every screen;
  Codex round 1 on that original work caught a real gap in the safety-critical job-offer overlay)
- conflict resolution kept **main's** `versionCode = 16` / `versionName = "0.1.13"` for
  technician-app, discarding the stale branch's older `versionCode = 14`
- a stale comment (`targetSdk 35, etc.`) corrected in both build files
- a 0-byte `docs/reviews/` artifact from the original commit was deliberately dropped

**Verified:** `bash tools/pre-codex-smoke.sh technician-app -PexcludePaparazzi` → **exit 0, all 6
steps**, at targetSdk 36.

**NOT yet done:** customer-app smoke gate, commit, Codex review, push, PR.

> Note: `wt-sdk36` needed `local.properties` (×3) and both `release-upload.jks` files copied in
> before Gradle would run — see §5.

### 2b. Do this next

1. Run the customer-app gate in `wt-sdk36`: `bash tools/pre-codex-smoke.sh customer-app -PexcludePaparazzi` (run it BARE — piping to `tail` reports the pipe's exit code and hides failures).
2. Commit the cherry-pick, attributing the original work.
3. `codex review --base origin/main -c sandbox_permissions='["disk-full-read-access"]'`
4. PR → CI → merge.
5. **Then** bring across the 16KB page-size fix (`13183b51`) as a separate PR.

---

## 3. The stranded branch — 9 commits of Play-readiness work never merged

`fix/customer-privacy-policy-url` is **the branch the main working directory is checked out on**,
and it is 9 commits ahead of `origin/main`. This is almost certainly why REL-1's bundles were built
but never successfully uploaded.

```
0d76365a chore(customer-app): bump versionCode to 14          <- STALE, main has 13; do NOT take
4a26e843 fix(customer-app): remove fabricated 4.8-star rating claim    <- compliance, TAKE
b41c753a fix(technician-app): bump versionCode to 15          <- STALE, main has 16; do NOT take
43bfb827 fix(technician-app): drop unused background-location permission, add full-screen intent  <- policy, TAKE
2f770532 fix(android): bump targetSdk to 36 + edge-to-edge audit      <- IN PROGRESS in wt-sdk36
13183b51 fix(android): bump Sentry SDK for Play 16KB page-size rejection  <- BLOCKER, TAKE NEXT
b5bda763 docs(play-store): correct listing pack against verified code state  <- TAKE
0db52fc4 chore: codex review passed                            <- marker file only, SKIP
0bfaa11f fix(customer-app): privacy link -> live policy, real launcher name  <- compliance, TAKE
```

**Cherry-pick the substantive ones onto fresh branches off `origin/main`. Do NOT merge the branch
wholesale** — its versionCode bumps are older than main's and would regress tonight's release.

The `4a26e843` fabricated-rating fix is a truthfulness issue on a customer-facing screen; treat it
as higher priority than its position in the list suggests.

---

## 4. Repo hygiene — large but low-risk

### Measured 2026-09-15

`C:/Alok/Business Projects/` holds **29 `wt-*` directories totalling 17 GB**, and the main checkout
is a further **17 GB** — roughly **34 GB** in total.

Only **12 of those 29 are registered git worktrees** of this repo:

```
wt-335-a11y-quarantine  wt-api36  wt-e21-s05  wt-e22-s02  wt-e24-s01  wt-e24-s01c
wt-fix-ci-required-check  wt-fix-paparazzi-doc  wt-fix-paparazzi-doc2
wt-rel-1  wt-rel-2  wt-sdk36
```

Biggest: `wt-335-a11y-quarantine` 2.8 G, `wt-rel-1` 2.7 G, `wt-e21-s05` 2.2 G, `wt-e24-s01` 2.2 G,
`wt-e22-s02` 2.0 G, `wt-rel-2` 1.6 G, `wt-api36` 1.1 G, `wt-sdk36` 777 M.

**KEEP `wt-sdk36`** (targetSdk 36 work in progress, §2a) and **`wt-rel-2`** (holds the built AAB)
until their work has merged.

### ⚠️ The other 17 directories have NO `.git` — do not bulk-delete them

They are not worktrees. Some are orphaned leftovers from this repo:

```
wt-p0-catalogue-patch 1.4G   wt-p0-earnings-truth 1.4G   wt-p0-payout-disarm 553M
wt-month-end-boundary-fix 19M   wt-apk-1m 4.0M   wt-obs-keys   wt-rzp-warning
wt-ignore-fix   wt-ci-budget-fix   wt-activate-nonhg-zones   wt-ws3-repo-tests-20260802
wt-e23-s01;C (0 bytes, malformed name)
```

But several look like **entirely different client projects**, and this is an agency machine:

```
wt-safar-rides 76M   wt-womenswear-saree-design   wt-nukkad-chat-defects
wt-tapri-reactions-typing   wt-draw-results
```

**Confirm ownership with the owner before deleting anything in that second group.** Reclaiming the
~3.4 GB of orphaned `wt-p0-*` / `wt-month-end-*` directories is safe and worthwhile; the rest is
not yours to judge.
- **~85 local branches ahead of `origin/main`.** Most are almost certainly already merged: this repo
  squash-merges, so the original branch commits never appear in main's history and
  `git branch --merged` will never list them. Do not delete on "ahead" count alone.

### Safe way to decide what is really merged

For each branch, ask GitHub whether its PR merged, rather than inferring from git:

```bash
gh pr list --state merged --limit 300 --json headRefName,number,mergedAt \
  --jq '.[] | "\(.headRefName)"' | sort -u > /tmp/merged-heads.txt
```

Then intersect with local branches, and for anything NOT in that list, inspect before deleting.
Keep: `main`, anything with an open PR, and `chore/rel-2-technician-version-bump` (holds the built
AAB's worktree). Confirm each worktree is clean before removal:

```bash
git -C <worktree> status --porcelain | { grep -v '^?? .superpowers/' || true; }
```

(The `|| true` matters — `grep -v` exits 1 when it filters everything out, which makes a naive
cleanliness check report a clean tree as dirty. That bug bit this session.)

Remove with `git worktree remove --force <path>`; if it fails with "Directory not empty", a leftover
`node_modules` is the cause — `rm -rf` the directory, then `git worktree prune`.

### Main working directory is itself unclean

`C:/Alok/Business Projects/Urbanclap-dup` has uncommitted edits to `.gitignore`,
`.serena/project.yml`, `admin-web/lighthouserc.cjs`, plus untracked files including a WhatsApp
export zip, `docs/play-store-listing-technician.md`, `docs/uat-handoff-plan.md`, and `docs/prompts/`.
**Ask the owner before touching any of it** — some may be work in progress.

Consider moving the main checkout onto `main` once its contents are triaged, so nobody reads stale
files as current state (see §6).

---

## 5. Traps this session hit — do not rediscover them

1. **A fresh worktree cannot build Android.** `local.properties` (technician-app, customer-app,
   design-system) and `release-upload.jks` (both apps) are gitignored, and the release signing
   config is evaluated at Gradle *configuration* time — so even `testDebugUnitTest` fails without
   the keystore. Copy all five from the main checkout first. This blocked a push three times.
2. **Never pipe a gate to `tail`/`head` when you need its exit code.** The pipe's status masks the
   failure. Redirect to a file and check `$?`.
3. **Never trust a file read from the main checkout as current state.** It sits on the stale branch.
   This session twice reported stale file contents as production reality — once claiming a live bug
   that did not exist, once planning an entire story to add Hindi copy that was already merged. Use
   `git show origin/main:<path>`.
4. **Paparazzi goldens must never be recorded on Windows.** Use the `paparazzi-record.yml`
   workflow_dispatch with `gradle_root` and `gradle_task` filled in EXPLICITLY — both silently
   default to customer-app.
5. **`.codex-review-passed` proves nothing.** It is a rolling file on main rewritten by every
   merging PR. Read its `commit` field or ignore it.

---

## 6. Suggested order of work

1. Finish targetSdk 36 (§2b) — unblocks everything else.
2. 16KB page-size fix (`13183b51`).
3. The three compliance commits (`4a26e843`, `43bfb827`, `0bfaa11f`) + listing docs (`b5bda763`).
4. Repo hygiene (§4), ideally in parallel — it touches no shipping code.
5. Rebuild BOTH app bundles, verify targetSdk 36 in the built artifact (not just the source), upload.

## 7. Exit criteria — "clean state" means all of these

- [ ] `origin/main` builds both apps at **targetSdk 36** with green smoke gates
- [ ] The 16KB page-size fix is on main
- [ ] No Play policy blockers outstanding (permissions, privacy link, rating claim)
- [ ] `gh pr list --state open` is empty, or every open PR is deliberate
- [ ] Local branches reconciled against merged PRs; stale worktrees removed
- [ ] Main working directory is clean and on `main`
- [ ] A fresh `git clone` + documented setup can build both apps — i.e. the local-config
      requirement in §5 is written down in the repo, not just in this brief
- [ ] Built AAB verified at targetSdk 36 via `bundletool dump manifest` before upload

## 8. Deferred product/engineering items (not blockers)

- **Server-side deactivated-skill fix.** `patchMyTechnicianServiceProfile` hard-400s if ANY
  submitted skill is inactive, so the client must drop deactivated skills on save. It should reject
  only *newly added* inactive skills. Do this before any seasonal deactivation (e.g. cooler service
  in winter) or technicians silently lose that skill. Found by Codex; ruling recorded in the PR #363
  description.
- **Dead category images.** 5 of 6 active categories still point at the dead `homeservices-mvp`
  Firebase bucket and 404. Only `appliance-repair` renders. Most visible remaining customer-facing
  defect.
- **Dispatch ignores `kycStatus`** — 0 of 17 technicians are KYC-approved, yet all dispatchable ones
  receive jobs. No predicate exists in `findNearbyTechnicians`.
- **Coverage reality:** only 3 dispatchable technicians are physically inside Ayodhya. Two accounts
  sit at New Jersey coordinates and are geo-excluded by `ST_WITHIN`.
