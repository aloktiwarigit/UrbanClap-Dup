# Story Completeness Audit — 2026-04-26

**Auditor:** Claude (Sonnet 4.6) — defensive read-only audit
**Repository state:** `origin/main` HEAD = `820913e` (PR #50, E07-S03 merged 2026-04-26 18:17 UTC)
**Scope:** every feature story merged to `main` since project inception (PR #1, 2026-04-18)

## Summary

- **38 feature-story PRs** merged to `main` (excluding chore/CI/rescue PRs)
- **27 stories** are missing one or both of their planning artifacts (story file + plan file) — **Tier-1 Karnataka audit holes**
- **11 stories** have a story file present but with stale status field (`ready-for-dev` instead of `merged`/`done`) and unchecked AC checkboxes — **Tier-2 cosmetic, non-blocking**
- **1 story** (E04-S03) is fully compliant — story file exists, plan file exists, status=`shipped`, all checkboxes ticked. This is the only fully-clean retroactive rescue (PR #43) and serves as the template for the rest.

### Gap categories

| Category | Count | Severity | Resolution |
|---|---:|---|---|
| Missing both story file + plan file | 9 | **Tier-1** | rescue PR per story |
| Missing story file only (plan exists) | 17 | **Tier-1** | rescue PR per story |
| Missing plan file only (story exists) | 1 | **Tier-1** | rescue PR |
| Stale status field + unchecked AC checkboxes | 11 | **Tier-2** | single bulk PR |

---

## Methodology

1. **Cross-referenced** the authoritative merged-PR list (`gh pr list --state merged --base main --limit 60`) against `git ls-tree -r origin/main` for `docs/stories/`, `docs/superpowers/plans/`, and `plans/`.
2. **For every merged feature-story PR**, verified four independent dimensions:
   - **Story file** present at `docs/stories/<ID>-<slug>.md`
   - **Plan file** present at either `plans/<ID>*.md` (legacy) OR `docs/superpowers/plans/<date>-<id>*.md` (post-2026-04-24 superpowers convention)
   - **Status field** in story-file frontmatter reads `merged`, `shipped`, or `done` (NOT `ready-for-dev` after the PR has been merged)
   - **AC checkboxes** under "Tasks / Subtasks" reflect shipped state (sample-checked: counted `[x]` vs `[ ]` in each existing story file)
3. **Excluded** chore/CI/rescue PRs (#6, #11, #20, #22, #40, #41, #42, #43, #49) — these are not feature stories and have no AC of their own.
4. **PRs #40, #41, #43** are themselves rescue PRs that retroactively added missing docs; their target stories are checked here as if the rescue had landed (which it did).

### What counts as "merged" for this audit

A story is treated as merged if its feature PR has landed on `origin/main` per the GitHub API. Branches still in flight (e.g. the current `feature/E10-S01-karnataka-compliance` branch and the local `docs/stories/E08-S01-tech-earnings-dashboard.md`) are out of scope for this audit because they have not yet shipped.

### What does NOT count as a story file

- Design specs in `docs/superpowers/specs/` (these are brainstorm artifacts, not story-template artifacts)
- Brief notes in commit messages
- Section rows in `docs/stories/README.md` (this is the index, not a story file)

---

## Findings table

| Story ID | PR | Merge SHA | Story file | Plan file | Status field | AC checkboxes | Gap? |
|---|---|---|---|---|---|---|---|
| E01-S01 | #1 | 33db7bb | ✅ | ✅ `plans/E01-S01.md` | ❌ stale `ready-for-dev` | ❌ 9/9 unchecked | **Tier-2** |
| E01-S02 | #2 | 1236d4c | ✅ | ❌ **NO plan** | ❌ stale `ready-for-dev` | ❌ 25 unchecked | **Tier-1** + Tier-2 |
| E01-S03 | #4 | 50aa8de | ✅ | ✅ `plans/E01-S03.md` | ❌ stale `ready-for-dev` | ❌ 23 unchecked | **Tier-2** |
| E01-S04 | #5 | aaa95ec | ✅ | ✅ `plans/E01-S04.md` | ❌ stale `ready-for-dev` | ❌ 21 unchecked | **Tier-2** |
| E01-S05 | #7 | cf8e54a | ❌ **NO story** | ✅ `plans/E01-S05.md` | n/a | n/a | **Tier-1** |
| E01-S06 | #3 | 1bd0706 | ✅ | ✅ `plans/E01-S06.md` | ❌ stale `ready-for-dev` | ❌ 30 unchecked | **Tier-2** |
| E02-S01 | #9 | 0960e88 | ❌ **NO story** | ✅ `plans/E02-S01.md` | n/a | n/a | **Tier-1** |
| E02-S02 | #14 | 2f6cfa6 | ❌ **NO story** | ✅ `plans/E02-S02.md` | n/a | n/a | **Tier-1** |
| E02-S03 | #17 | 41e65d8 | ❌ **NO story** | ✅ `plans/E02-S03.md` | n/a | n/a | **Tier-1** |
| E02-S04 | #8 | 7500cf6 | ❌ **NO story** | ✅ `plans/E02-S04.md` | n/a | n/a | **Tier-1** |
| E03-S01 | #12 | 5f23ad3 | ❌ **NO story** | ✅ `plans/E03-S01.md` | n/a | n/a | **Tier-1** |
| E03-S02 | #16 | c10a438 | ❌ **NO story** | ✅ `plans/E03-S02.md` | n/a | n/a | **Tier-1** |
| E03-S03a | #19 | 29d8c6b | ❌ **NO story** | ✅ `plans/E03-S03a.md` | n/a | n/a | **Tier-1** |
| E03-S03b | #23 | 1d5eb88 | ❌ **NO story** | ✅ `plans/E03-S03b.md` | n/a | n/a | **Tier-1** |
| E03-S04 | #24 | 06b879d | ❌ **NO story** | ❌ **NO plan** | n/a | n/a | **Tier-1 (both)** |
| E04-S01 | #30 | 93349c0 | ❌ **NO story** | ✅ `plans/E04-S01-trust-dossier.md` | n/a | n/a | **Tier-1** |
| E04-S02 | #34 | 4861332 | ❌ **NO story** | ✅ `plans/E04-S02a.md` + `E04-S02b.md` | n/a | n/a | **Tier-1** |
| E04-S03 | #37 | a52219c | ✅ (rescue #43) | ✅ `docs/superpowers/plans/2026-04-24-e04-s03-*.md` (rescue #43) | ✅ `shipped` | ✅ 14/14 checked | **none** |
| E05-S01 | #18 | 3fdfa4e | ❌ **NO story** | ❌ **NO plan** | n/a | n/a | **Tier-1 (both)** |
| E05-S02 | #26 | 5b9c5ff | ❌ **NO story** | ❌ **NO plan** | n/a | n/a | **Tier-1 (both)** |
| E05-S03 | #29 | d162932 | ❌ **NO story** | ❌ **NO plan** | n/a | n/a | **Tier-1 (both)** |
| E05-S04 | #28 | 8d47ec0 | ❌ **NO story** | ❌ **NO plan** | n/a | n/a | **Tier-1 (both)** |
| E06-S01 | #31 | b11bb28 | ❌ **NO story** | ✅ `plans/E06-S01.md` | n/a | n/a | **Tier-1** |
| E06-S02 | #33 | 9c592ad | ❌ **NO story** | ❌ **NO plan** | n/a | n/a | **Tier-1 (both)** |
| E06-S03 | #36 | 7f9ba79 | ❌ **NO story** | ✅ `plans/E06-S03.md` | n/a | n/a | **Tier-1** |
| E06-S04 | #38 | 36bab25 | ✅ (rescue #41) | ✅ `docs/superpowers/plans/2026-04-24-e06-s04-*.md` (rescue #41) | ❌ stale `ready-for-dev` | ❌ 12 unchecked | **Tier-2** |
| E06-S05 | #39 | 3800aab | ✅ | ✅ `docs/superpowers/plans/2026-04-24-e06-s05-*.md` | ❌ stale `ready-for-dev` | ❌ 11 unchecked | **Tier-2** |
| E07-S01a | #44 | 45618e1 | ✅ (rescue #40) | ✅ `docs/superpowers/plans/2026-04-24-e07-s01a-*.md` (rescue #40) | ❌ stale `ready-for-dev` | ❌ 15 unchecked | **Tier-2** |
| E07-S01b | #45 | da59fee | ✅ (rescue #40) | ✅ `docs/superpowers/plans/2026-04-24-e07-s01b-*.md` (rescue #40) | ❌ stale `ready-for-dev` | ❌ 13 unchecked | **Tier-2** |
| E07-S02 | #47 | 146834c | ✅ | ✅ `docs/superpowers/plans/2026-04-25-e07-s02-*.md` | ❌ stale `ready-for-dev` | ❌ 12 unchecked | **Tier-2** |
| E07-S03 | #50 | 820913e | ✅ | ✅ `docs/superpowers/plans/2026-04-25-e07-s03-*.md` | ❌ stale `ready-for-dev` | ❌ 19 unchecked | **Tier-2** |
| E09-S01 | #13 | c4568c7 | ❌ **NO story** | ✅ `plans/E09-S01.md` | n/a | n/a | **Tier-1** |
| E09-S02 | #15 | 6536fa6 | ❌ **NO story** | ✅ `plans/E09-S02.md` | n/a | n/a | **Tier-1** |
| E09-S03 | #25 | 10a2962 | ❌ **NO story** | ❌ **NO plan** | n/a | n/a | **Tier-1 (both)** |
| E09-S04 | #21 | 07c3d60 | ❌ **NO story** | ✅ `plans/E09-S04a.md` + `E09-S04b.md` | n/a | n/a | **Tier-1** |
| E09-S05 | (direct commits) | piecemeal — final at e1dfd5e | ❌ **NO story** | ✅ `plans/E09-S05.md` | n/a | n/a | **Tier-1** |
| E09-S06 | #27 | 0fea0c3 | ❌ **NO story** | ❌ **NO plan** | n/a | n/a | **Tier-1 (both)** |
| E10-S02 | #32 | 22e99a7 | ❌ **NO story** | ❌ **NO plan** | n/a | n/a | **Tier-1 (both)** |

---

## Gaps requiring rescue PR (Tier-1)

These are Karnataka audit holes — code shipped without the requirement-spec that drove it. A regulator asking "show me the spec for this code" cannot be answered for these stories.

### Class A — missing both story AND plan (9 stories)

These are the highest-risk audit holes. The plan file (`plans/<ID>.md` or `docs/superpowers/plans/<date>-<id>*.md`) is the implementation contract; the story file is the requirement spec. Both gone = full reverse-engineering required.

1. **E03-S04** — Razorpay webhook → PAID + dispatcher stub + reconciliation timer (PR #24, 06b879d)
2. **E05-S01** — technician geospatial profile + ST_WITHIN repo + Bengaluru seed (PR #18, 3fdfa4e)
3. **E05-S02** — dispatcher engine: geo-rank + FCM job offers + dispatch attempts (PR #26, 5b9c5ff)
4. **E05-S03** — technician-app FCM job-offer full-screen card + countdown (PR #29, d162932)
5. **E05-S04** — accept/decline job-offer API with `_etag` optimistic concurrency (PR #28, 8d47ec0)
6. **E06-S02** — guided photo capture (CameraX UI + Firebase Storage + API) (PR #33, 9c592ad)
7. **E09-S03** — owner override controls on order detail (PR #25, 10a2962)
8. **E09-S06** — owner complaints inbox (Kanban + optimistic mutations) (PR #27, 0fea0c3)
9. **E10-S02** — SSC levy quarterly automation (PR #32, 22e99a7)

### Class B — missing story file only, plan exists (17 stories)

Plan file is canonical for these (often quite detailed); the story file needs to be reverse-engineered from the plan + merged code, following the E04-S03 retroactive rescue template.

10. **E01-S05** — Figma library + W3C DTCG JSON + token-drift CI checker (PR #7)
11. **E02-S01** — customer-app OTP login: Truecaller + Firebase Phone Auth + persistent session (PR #9)
12. **E02-S02** — technician-app auth: Truecaller + Firebase OTP + biometric + session (PR #14)
13. **E02-S03** — technician KYC: DigiLocker Aadhaar + PAN OCR + 3-step UI (PR #17)
14. **E02-S04** — admin-web auth: email + TOTP 2FA + httpOnly cookies + RBAC + audit log (PR #8)
15. **E03-S01** — service catalogue data model + API + admin CRUD + seed (PR #12)
16. **E03-S02** — customer-app catalogue UI: categories, list, detail (PR #16)
17. **E03-S03a** — booking creation API + Android data layer (PR #19)
18. **E03-S03b** — booking UI flow: SlotPicker, Address, Summary, Confirmed + Razorpay (PR #23)
19. **E04-S01** — Trust Dossier: technician profile card for customer-app + admin-web (PR #30)
20. **E04-S02** — pre-booking confidence score: on-time %, ETA chips, limited-data badge (PR #34)
21. **E06-S01** — technician-app active-job workflow + state machine + Room offline queue + Maps nav (PR #31)
22. **E06-S03** — final price approval flow: API + Android FCM + Compose UI (PR #36)
23. **E09-S01** — owner Live Ops dashboard: counters, map, feed, KPI (PR #13)
24. **E09-S02** — owner Orders module: paginated table + filters + slide-over + CSV export (PR #15)
25. **E09-S04** — owner Finance dashboard: P&L chart + payout queue + approve-all (PR #21)
26. **E09-S05** — immutable Audit Log: schema, repository, service, GET endpoint, admin-web viewer (no single PR — direct commits)

### Class C — missing plan file only, story exists (1 story)

27. **E01-S02** — admin-web skeleton + Next.js 15 + Tailwind + Storybook + landing page (PR #2). Story file exists at `docs/stories/E01-S02-admin-web-skeleton-landing-page.md`; no `plans/E01-S02.md` ever committed to main.

---

## Gaps requiring backlog ticket only (not blocking launch) — Tier-2

The 11 stories below have story files in `docs/stories/` but every one of them carries a stale `Status: ready-for-dev` field (the template default that nobody updated post-merge) and unchecked AC checkboxes (`[ ]` instead of `[x]`). This is cosmetic — the merged code is the source of truth; the story file metadata simply lags. A regulator checking these would still find a story file present; it just looks unfinished.

Single bulk PR can fix all 11:

| Story | Status fix | Checkboxes to mark | Notes |
|---|---|---:|---|
| E01-S01 | → `merged` | 9 | Original Tasks T1–T9 |
| E01-S02 | → `merged` | 25 | (also gets a plan file in Class C rescue) |
| E01-S03 | → `merged` | 23 | |
| E01-S04 | → `merged` | 21 | |
| E01-S06 | → `merged` | 30 | Largest checkbox count |
| E06-S04 | → `merged` | 12 | |
| E06-S05 | → `merged` | 11 | |
| E07-S01a | → `merged` | 15 | |
| E07-S01b | → `merged` | 13 | |
| E07-S02 | → `merged` | 12 | |
| E07-S03 | → `merged` | 19 | Just merged 2026-04-26; status field never updated post-merge |

E04-S03 is the only story with `Status: shipped` (rescue PR #43 set it correctly). Recommend that future rescue PRs follow the E04-S03 template verbatim — set the Status field to `shipped` (or `merged`) and check every box that's actually shipped.

---

## Methodology notes for future audits

1. **Trust the GitHub PR list, not just `git log`** — squash-merged PRs lose their merge-commit signature; the only authoritative source is `gh pr list --state merged --base main`.
2. **Two plan-file conventions live side-by-side**: legacy `plans/<ID>*.md` (pre-2026-04-24) and new `docs/superpowers/plans/<date>-<id>*.md` (post-2026-04-24, set by the `/superpowers:writing-plans` skill). Future audits must check both locations.
3. **Story files vs design specs** — `docs/superpowers/specs/` contains brainstorm/design artifacts that pre-date the implementation; these are NOT story files. The convention in `docs/stories/README.md` is unambiguous: a story file lives at `docs/stories/E##-S##-<slug>.md`.
4. **Status-field hygiene is a write-time problem, not an audit-time problem** — every story-file template should ship with `Status: ready-for-dev`, and the `/superpowers:executing-plans` skill (or its successor) should flip the field to `merged` automatically on merge. Until that automation exists, every retroactive rescue PR is the only hand-fix opportunity.
5. **Run this audit weekly** — at this rate of merging (~9 PRs in 8 days during the recent burst), a weekly run keeps drift bounded. Earlier weekly runs would have caught the 9 Class-A holes (E03-S04 onward) before they piled up to 9.
6. **Karnataka compliance link** — the binding rationale is that the Karnataka Platform Workers Act 2025 + DPDP Act both require traceability between processing logic and the requirement that motivated it. Story-file-as-requirement-spec is the project's chosen traceability mechanism. Holes here = audit liability.
7. **Tier-1 vs Tier-2 cutoff** — missing artifacts entirely = Tier-1 (regulator cannot find the spec). Stale status field on a complete story file = Tier-2 (regulator finds the spec; only the metadata is wrong).

---

## Action items (post-audit)

- [ ] 27 GitHub Issues filed under labels `audit:tier1` + `audit:story-completeness` (one per Tier-1 gap)
- [ ] 1 GitHub Issue filed under `audit:story-completeness` for the bulk Tier-2 cleanup PR
- [ ] Triage of the 27 Tier-1 issues by orchestrator — recommend batching by epic for rescue-PR efficiency (E02 batch, E03 batch, E05 batch, E06 batch, E09 batch, plus standalones)
- [ ] Add a CI check (`docs/audit/story-completeness-check.sh`) that fails any future PR landing source code without a matching story file + plan file
- [ ] Update story-template at `agency-templates/` to ship with `Status: ready-for-dev` and a post-merge checklist reminding the developer to flip the field

---

**Audit complete. 38 feature stories scanned; 27 Tier-1 gaps + 11 Tier-2 gaps found.**
