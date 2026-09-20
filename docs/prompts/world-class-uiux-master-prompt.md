# MASTER PROMPT — World-Class UI/UX Audit & Implementation Plan

> **This is a multi-session engagement — roughly 7–9 sessions.** It will not fit in one context window,
> and trying to force it produces a shallow audit right at the point where depth matters (Phase 2/3).
>
> Session 1 = paste **THE PROMPT** below into a fresh Claude Code session at the repo root
> (`C:\Alok\Business Projects\Urbanclap-dup`), on **Opus 5**, budget `+800k`.
> Sessions 2+ = paste the matching **resume prompt** from the "Resume prompts" section at the bottom.
>
> The whole thing is held together by one file: `docs/design/SESSION-STATE.md`. That file is the
> handoff contract. If a session ends without updating it, the next session starts blind.

---

## THE PROMPT

```
ULTRACODE. Budget +800k.

# MISSION

This repo is a UrbanClap/Urban Company-class home-services platform for Ayodhya / rural UP:
- `customer-app/`   — Kotlin + Compose, 29 screens
- `technician-app/` — Kotlin + Compose, 19 screens
- `admin-web/`      — Next.js 15 App Router, 20 routes, bilingual (en/hi)
- `design-system/`  — shared Compose token + component module

My goal is **best-in-world UI/UX** — not "good for a pilot", not "good for rural India".
The bar is: a senior product designer at Linear / Stripe / Revolut / Cred / Airbnb opens any
screen of this app and cannot tell it was not built by a 12-person design team.

You will produce two artifacts:
1. `docs/design/uiux-audit-2026.md`     — evidence-backed, per-screen, adversarially verified audit
2. `docs/design/uiux-implementation-plan.md` — sequenced, work-stream-structured, story-sized plan

Every claim in artifact 1 must survive an adversarial verifier. Every item in artifact 2 must be
executable by a Sonnet subagent without further design decisions.

---

# SESSION PROTOCOL — READ THIS BEFORE ANYTHING ELSE

This work spans **multiple sessions**. You are one session in a chain. Act accordingly.

## The handoff file

`docs/design/SESSION-STATE.md` is the single source of truth between sessions. On session start,
read it first. On session end, it must be accurate enough that a session with ZERO conversation
history can pick up cleanly. Structure:

```markdown
# UI/UX 2026 — Session State
Last updated: <date> | Session: <n> | Phase: <n.n> | Worktree: <path> | Branch: <name>

## Completed
- [x] Phase 0 — inventory.json (48/48 screens), screenshots 41/48  ← gaps listed below
- [x] Phase 1 — direction "soft-depth premium" chosen by owner on <date>

## In progress
Phase 2, clusters C1–C4 done, T1–T3 done, A1–A3 + X1 NOT started.

## Blocked / gaps
- LiveTrackingScreen hi-dark screenshot missing — cannot trigger tracking state without a live job
- admin-web finance page: needs seeded data

## Decisions made (do not relitigate)
- Poppins rejected for Devanagari — falls back badly; using Noto Sans Devanagari. <date>
- No shared-element transitions on customer-app — jank on Moto G at 3GB. <date>

## Next session starts with
Phase 2, cluster A1. Resume prompt: R2 in docs/prompts/world-class-uiux-master-prompt.md
```

## Rules for ending a session

**Stop and hand off when ANY of these is true — do not push through:**
- You hit a CHECKPOINT (owner review required). Checkpoints are natural session boundaries.
- Context is ~70% consumed. Hand off *before* degradation, not after. A rushed Phase 2 cluster is
  worse than no cluster, because it produces confident low-quality findings that pollute Phase 3.
- A phase completed and its artifact is written and committed.
- You are blocked on something only I can do (pick a direction, connect the device, seed data).

**Handoff sequence (mandatory, in this order):**
1. Write every partial result to disk. Nothing of value may live only in conversation.
2. Update `docs/design/SESSION-STATE.md` — including gaps and decisions, not just progress.
3. Invoke the `remember` skill to persist cross-session state.
4. `git add -A && git commit` on the worktree branch. Uncommitted work does not survive.
5. Tell me: what's done, what's next, and **which resume prompt (R0–R6) to paste next session**.

## Rules for starting a session

1. Read `docs/design/SESSION-STATE.md`, then `docs/design/design-language.md` (if it exists),
   then the audit-so-far. Do NOT re-derive anything already recorded there.
2. Do NOT re-audit a completed cluster. Do NOT reopen a decision in the "Decisions made" list.
3. Confirm the worktree/branch matches SESSION-STATE before touching files.
4. State in one line what this session will accomplish, then start.

## Session map (plan for ~7–9 sessions)

| Session | Phase | Model | Ends when |
|---|---|---|---|
| S1 | Phase 0 — inventory + screenshot capture | Opus (brainstorm) → Sonnet (capture) | Coverage table reviewed by me |
| S2 | Phase 1 — design language + moodboards + judge panel | Opus + Fable | I pick a direction |
| S3 | Phase 2 — clusters C1–C4 (customer) | Sonnet fanout | 4 clusters × 5 lenses written to disk |
| S4 | Phase 2 — clusters T1–T3 (technician) | Sonnet fanout | 3 clusters written to disk |
| S5 | Phase 2 — clusters A1–A3 + X1 (admin + cross-cutting) | Sonnet fanout | 4 clusters written to disk |
| S6 | Phase 3 — adversarial verification + completeness loop | Opus | `uiux-audit-2026.md` committed |
| S7 | Phase 3 review + Phase 4 — implementation plan | Opus | Plan committed, stories sized |
| S8+ | Execution — one story per session | Sonnet | Per `CLAUDE.md` per-story flow |

Split a session further if a phase is bigger than expected. Never merge two phases to "save time" —
the checkpoints exist because my input changes what you do next.

## Fresh-session quarantine

Start Phase 3 in a **fresh session with no Phase 2 conversation history**. The verifier must read the
findings cold, from disk, exactly as a skeptic would. If the session that wrote the findings also
verifies them, it will defend its own work and the adversarial pass is theatre.

---

# NON-NEGOTIABLE CONSTRAINTS

- ₹0/month operational infra at pilot scale. No paid SaaS, no paid fonts, no paid icon sets,
  no CDN dependency. Anything that violates this needs an ADR + my explicit approval.
- Hindi (Devanagari) and English are **co-equal**. Any type scale, line-height, truncation, or
  layout decision must be validated in BOTH scripts. Read `docs/patterns/devanagari-web-typography.md`
  and `docs/patterns/compose-locale-init-sync.md` before proposing any typography change.
- Target device class includes low-end Android (Moto G tier, 720x1600, 3–4 GB RAM, spotty 3G).
  "Premium" here means *perceived* performance and polish, not heavy shaders. Any motion proposal
  must state its cost on a low-end device.
- Accessibility floor is WCAG 2.2 AA — contrast, 48dp touch targets, TalkBack labels, dynamic type
  to 200%, reduced-motion honored. AA is the floor, not the goal.
- Existing invariants in `CLAUDE.md` hold: TDD, Paparazzi goldens recorded on CI Linux only
  (see `docs/patterns/paparazzi-cross-os-goldens.md`), Codex CLI is the authoritative review gate.

---

# PHASE 0 — GROUND TRUTH (do this before any opinion)

Invoke `superpowers:brainstorming` first to align with me on scope, then:

1. Use **Serena** (`get_symbols_overview`, `find_symbol`) — not grep — to map:
   - every Composable screen in both apps and the component vocabulary each one uses
   - every token actually consumed from `design-system/` vs. hardcoded literals
   - `admin-web/DESIGN.md` and `admin-web/src/components/*` — which primitives exist, which are ad hoc
2. Build `docs/design/inventory.json`:
   `{ surface, screen, file, states[loading|empty|error|success|offline|partial],
      tokens_used[], hardcoded_values[], i18n_keys[], a11y_annotations[], has_paparazzi_golden }`
3. Run the apps and capture real screenshots — do NOT audit from source alone:
   - Android: use the `run` skill / installed debug builds on the Moto G, capture each screen in
     **en + hi**, **light + dark**, **default + 200% font scale**
   - admin-web: use **Playwright MCP** against the local dev server at 1440px, 1024px, 768px, 390px
   - Store under `artifacts/uiux-2026/screens/<surface>/<screen>-<locale>-<theme>-<viewport>.png`
4. Report gaps: screens you could not reach, states you could not trigger. List them explicitly.
   Do not silently skip — a missing screenshot is a finding.

CHECKPOINT + END OF SESSION 1: show me the inventory summary + screenshot coverage table.
Run the handoff sequence. Next session resumes with R1. Do not start Phase 1 in this session even
if context remains — I need to see coverage before you define the design language against it.

---

# PHASE 1 — DESIGN LANGUAGE (define the bar before measuring against it)

Invoke `frontend-design:frontend-design` and `impeccable`. Then:

1. **Reference research.** Run `codex exec` with web search to pull 2026-current visual language from:
   Linear, Stripe Dashboard, Revolut, Cred, Zomato/Swiggy (Indian-market density + Devanagari),
   Uber driver app + Rappi courier (technician-app analogue), Airbnb (booking flow analogue),
   Retool/Linear (admin-web analogue). Extract *principles*, not screenshots to copy:
   type ramp ratios, elevation philosophy, accent discipline, empty-state voice, motion curves.
2. **Moodboards via Codex imagegen.** Generate 3 distinct visual directions for the customer app
   home + booking flow. Each direction must have a one-line thesis (e.g. "warm trust / paper-and-ink",
   "high-contrast utilitarian", "soft-depth premium"). Save to `artifacts/uiux-2026/directions/`.
   Do NOT generate 3 variations of the same idea — they must be genuinely divergent.
3. **Judge panel.** Spawn 3 independent agents, each scoring all 3 directions against: rural-UP trust
   signals, Devanagari legibility, low-end render cost, differentiation from Urban Company, and
   longevity (will it look dated in 18 months). Synthesize the winner, graft the best ideas from runners-up.
4. Write `docs/design/design-language.md`: the chosen direction as an enforceable spec —
   type ramp (both scripts), color roles + exact contrast ratios, elevation ladder, radius scale,
   spacing rhythm, motion curves + durations, iconography rules, imagery/illustration policy,
   voice & tone for microcopy (en + hi), and the empty/error/loading state grammar.

CHECKPOINT + END OF SESSION 2: show me the 3 directions + the panel's reasoning. I pick before you
proceed. Record my pick and the rejected directions (with reasons) in SESSION-STATE "Decisions made",
commit `design-language.md`, then hand off. Next session resumes with R2.

---

# PHASE 2 — MULTI-AGENT AUDIT (fan out; one agent per cluster per lens)

Use `superpowers:dispatching-parallel-agents`. Clusters:

| # | Cluster | Screens |
|---|---|---|
| C1 | Customer — acquisition & catalogue | FirstLaunchLanguage, Auth, CatalogueHome, ServiceList, ServiceDetail |
| C2 | Customer — booking funnel | SlotPicker, Address, AddressPicker, BookingSummary, PriceApproval, BookingConfirmed |
| C3 | Customer — live & post-service | LiveTracking, CustomerBookings, Rating, Complaint, ComplaintList, Waitlist |
| C4 | Customer — account & compliance | Profile, Settings, Wallet, LanguageSettings, PrivacyAndData, PrivacyData, DpdpConsent, DataExport, DeleteAccount* |
| T1 | Technician — onboarding & KYC | OnboardingGate, Onboarding, Auth, Kyc, ServiceSelection |
| T2 | Technician — job loop | TechnicianHome, TechnicianDashboard, JobOffer, ActiveJob, PhotoCapture, Rating |
| T3 | Technician — money & standing | Earnings, PayoutCadence, MyRatings, Complaint, LanguageSettings, DeleteAccount, AccountDeleted |
| A1 | Admin — operations | dashboard, orders, technicians, customers, complaints |
| A2 | Admin — catalogue CRUD | catalogue/*, all nested edit/new routes |
| A3 | Admin — money, trust & access | finance, compliance, audit-log, admin-users, login, setup, not-authorized |
| X1 | Cross-cutting | design-system module, admin-web components, navigation/IA across all 3 surfaces |

Each cluster is audited through **five lenses**, run as separate agents so they don't blur:

- **L1 Visual craft** — type rhythm, optical alignment, spacing consistency, color discipline,
  elevation logic, icon coherence, density. Compare against `design-language.md`, not taste.
- **L2 Interaction & motion** — affordance clarity, feedback latency, transition choreography,
  gesture support, loading→content continuity, error recovery paths, undo.
- **L3 Information architecture & flow** — step count vs. best-in-class, decision load per screen,
  navigation model coherence, back-stack correctness, deep-link behavior, cross-surface consistency.
- **L4 Content & i18n** — microcopy quality in en AND hi, Devanagari line-height/truncation/ellipsis,
  number/currency/date formatting, RTL-safety of layout primitives, translation completeness,
  tone appropriate for a first-time smartphone user in Ayodhya.
- **L5 Accessibility & resilience** — WCAG 2.2 AA, TalkBack/screen-reader traversal, focus order,
  200% type, color-blind safety, offline/slow-network states, empty states, error states,
  destructive-action confirmation.

## Finding contract (agents MUST return exactly this)

```json
{
  "id": "C2-L1-003",
  "cluster": "C2", "lens": "L1",
  "surface": "customer-app",
  "screen": "BookingSummaryScreen",
  "file": "customer-app/.../BookingSummaryScreen.kt", "line": 142,
  "evidence_screenshot": "artifacts/uiux-2026/screens/customer/booking-summary-hi-dark-390.png",
  "severity": "P0|P1|P2|P3",
  "claim": "one sentence — what is wrong",
  "why_it_matters": "user-visible consequence, not a principle restatement",
  "benchmark": "how Stripe/Cred/Swiggy handles this, specifically",
  "fix": "concrete change: which token, which value, which component",
  "effort": "S|M|L",
  "blast_radius": "screen|cluster|design-system",
  "score_before": 0-4, "score_after_fix": 0-4
}
```

## Scoring rubric (0–4, applied per screen, per lens)

- **0 Broken** — visibly wrong: overlap, clipping, unreadable contrast, dead state.
- **1 Functional** — works, looks like a default template. Hardcoded values, stock Material.
- **2 Competent** — consistent tokens, correct states, nothing embarrassing. **This is most of the repo's likely ceiling today.**
- **3 Considered** — intentional hierarchy, purposeful motion, crafted empty/error states, copy that sounds human.
- **4 Exceptional** — a designer would screenshot it for a deck. Every element earns its place; there is a signature detail.

**A screen is not "done" below 3. The target average is 3.5+ with no screen below 3.**

## Rules for agents (state these to every subagent)

- No finding without a `file:line` AND a screenshot path. Assertions from memory are rejected.
- Banned findings: "add more whitespace", "improve visual hierarchy", "use better colors",
  "make it more modern" — with no specific token/value/component named. These are noise.
- Every finding must name what *specifically* changes. `fix` must be implementable without design judgment.
- If a screen is already at 3+ on a lens, say so and move on. Do not manufacture findings to fill a quota.
- Report what you could NOT check and why.

## Phase 2 spans sessions 3–5 (customer / technician / admin+cross-cutting)

Write each cluster's findings to `docs/design/findings/<cluster>.json` **as that cluster completes** —
never batch them to the end of the session. A cluster on disk survives a context blowout; a cluster
in conversation does not.

After each cluster, append one line to SESSION-STATE. When ~70% context is consumed, stop at the
next cluster boundary and hand off — even mid-surface. Cluster boundaries are safe resume points;
mid-cluster is not.

END OF SESSIONS 3/4/5: all assigned clusters on disk, SESSION-STATE current, committed.
Next session resumes with R3 / R4 / R5 respectively.

---

# PHASE 3 — ADVERSARIAL VERIFICATION (kill the plausible-but-wrong)

**Run this in a fresh session (S6) with no Phase 2 history.** Load findings from
`docs/design/findings/*.json` on disk. You did not write them. Treat them as claims by someone else.

For every P0/P1 finding, spawn **3 verifiers with distinct mandates**, each prompted to REFUTE:
- **V-code**: open the cited file:line. Does the claimed code actually do that? Is it already handled elsewhere?
- **V-visual**: open the cited screenshot. Is the defect actually visible? Is it a screenshot artifact?
- **V-cost**: does the fix violate the ₹0 constraint, the low-end-device budget, the Devanagari
  constraint, or an existing `docs/patterns/` gotcha? Would it regress a Paparazzi golden or a11y?

Survival rule: a finding survives if **≥2 of 3 verifiers fail to refute it**. Default to refuted when uncertain.
Dedup key: `surface + screen + lens + normalized(claim)` — merge duplicates, keep the best evidence.

Also run a **completeness critic**: "what did every cluster miss — an unaudited state, an untested
locale, a flow never exercised end-to-end, a screen with no screenshot?" Its output is a new round of work.
Loop until 2 consecutive rounds surface nothing new.

Write `docs/design/uiux-audit-2026.md`: executive summary, scorecard heatmap (screen × lens),
surviving findings ranked by `severity × blast_radius / effort`, and an explicit "refuted findings"
appendix so I can see what was thrown out and why.

CHECKPOINT + END OF SESSION 6: I read the audit before any plan is written. Commit the audit,
update SESSION-STATE, hand off. Next session resumes with R6.

If the completeness-critic loop has not converged when context runs low, hand off mid-loop —
record which round you're on and what the last round surfaced. Do not shorten the loop to fit
one session; that is exactly the tail this phase exists to catch.

---

# PHASE 4 — IMPLEMENTATION PLAN

Invoke `superpowers:writing-plans`. Structure per `CLAUDE.md` work-stream rules:

- **WS-0 Design system first.** Every fix that generalizes lands in `design-system/` or
  `admin-web/src/components/` before any screen consumes it. Token/component changes ship with
  contrast tests (`HomeservicesColorsContrastTest` pattern) and Storybook/TokenGallery entries.
- **WS-A..E per story** as defined in `CLAUDE.md`. Android stories cite the relevant `docs/patterns/` files.
- **Story sizing gate** — run `wc -l` on each plan; Feature >800 lines → split by layer.
- **Sequencing:** P0 correctness/a11y → design-system foundation → highest-traffic flows
  (customer booking funnel, technician job loop) → admin → long tail. State the dependency graph.
- **Per story include:** screens touched, exact before/after token values, new/changed components,
  Paparazzi goldens to re-record (CI Linux only), Playwright visual checks for admin-web,
  i18n keys added, a11y assertions, and the rubric score it must reach to be considered done.
- **Verification per story:** `bash tools/pre-codex-smoke.sh <app>` (all 6 steps) → visual audit
  agent re-scores the screen against the rubric → `codex review --base main`.
- Include a **"do not do this" section**: proposals considered and rejected, with reasons
  (cost, device budget, Devanagari, scope). Prevents future sessions relitigating.

END OF SESSION 7: plan committed, stories sized, dependency graph stated. From here each story is
its own session per `CLAUDE.md` per-story flow. Add a story tracker table to SESSION-STATE
(`story | status | PR | rubric score before/after`) so execution sessions stay coordinated.

---

# MODEL ROUTING

- **Opus 5** — Phase 1 synthesis, Phase 3 adversarial synthesis, plan authoring, conflict resolution.
- **Fable 5** — taste-heavy generative lanes: design-direction theses, microcopy in en + hi,
  motion choreography narratives, empty-state voice, moodboard prompt authoring.
  Run ONE lane on Fable first and compare against an Opus baseline before routing the rest to it.
- **Sonnet 5** — cluster audits (Phase 2), screenshot capture, inventory building, story implementation.
- **Haiku 4.5** — token codemods, hardcoded-literal→token sweeps, i18n key extraction, doc indexing.

# WORKING RULES

- Isolate in a worktree: `git worktree add` per `feedback_concurrent_session_isolation`. Do not work on `main`.
- Checkpoint at the four marked points. Between checkpoints, drive autonomously — do not ask me
  A/B/C/D questions on sub-decisions.
- If you find the app is genuinely worse than I think it is, say so plainly with screenshots.
  I would rather hear "half these screens are a 1" than get a diplomatic audit.
- Log anything you cap, sample, or truncate. Silent truncation reads as full coverage.
- **Never claim a phase is complete to end a session tidily.** An honest "Phase 2, 6 of 11 clusters
  done, handing off" is correct. A premature "Phase 2 complete" corrupts every downstream phase.

THIS IS SESSION 1. Create the worktree, create `docs/design/SESSION-STATE.md`, then START WITH PHASE 0.
Stop at the Phase 0 checkpoint and hand off.
```

---

## RESUME PROMPTS — paste one of these to start sessions 2+

Each is self-contained. None assumes conversation history.

**R1 — Session 2 (Phase 1, design language)**
```
Continue the UI/UX 2026 engagement. Read docs/prompts/world-class-uiux-master-prompt.md in full,
then docs/design/SESSION-STATE.md. Verify Phase 0 is complete and the screenshot coverage table is
real — if coverage is materially short, tell me before proceeding.
This session = PHASE 1 only (design language, moodboards, judge panel). Stop at the Phase 1
checkpoint for my direction pick, then run the handoff sequence.
Model: Opus, with Fable for the creative lanes. Budget +400k.
```

**R2 / R3 / R4 — Sessions 3, 4, 5 (Phase 2 audit)**
```
Continue the UI/UX 2026 engagement. Read docs/prompts/world-class-uiux-master-prompt.md in full,
then docs/design/SESSION-STATE.md, then docs/design/design-language.md. Do not relitigate anything
in "Decisions made". Do not re-audit clusters already on disk in docs/design/findings/.
This session = PHASE 2, clusters <C1–C4 | T1–T3 | A1–A3 + X1>.
Fan out one Sonnet agent per cluster per lens. Write each cluster to disk the moment it completes.
Hand off at a cluster boundary when context hits ~70%.
Budget +500k.
```

**R5 — Session 6 (Phase 3, adversarial verification) — MUST be a fresh session**
```
Continue the UI/UX 2026 engagement. Read docs/prompts/world-class-uiux-master-prompt.md in full,
then docs/design/SESSION-STATE.md and docs/design/design-language.md.
Load all findings from docs/design/findings/*.json. You did NOT write these — treat every one as an
unverified claim by someone else and try to refute it.
This session = PHASE 3 only: 3-mandate verification (code / visual / cost), dedup, completeness-critic
loop until 2 dry rounds, then write docs/design/uiux-audit-2026.md.
Report the refutation rate. If it is under 10% you were not adversarial enough — say so.
Model: Opus. Budget +500k.
```

**R6 — Session 7 (Phase 4, implementation plan)**
```
Continue the UI/UX 2026 engagement. Read docs/prompts/world-class-uiux-master-prompt.md in full,
then docs/design/SESSION-STATE.md, design-language.md, and uiux-audit-2026.md.
This session = PHASE 4 only: the implementation plan. Invoke superpowers:writing-plans. WS-0
design-system-first, work streams per CLAUDE.md, story sizing gate enforced with wc -l, dependency
graph stated, "do not do this" appendix included.
Then add the story tracker to SESSION-STATE and hand off.
Model: Opus. Budget +400k.
```

**R7 — Sessions 8+ (execution, one story per session)**
```
Continue the UI/UX 2026 engagement. Read docs/design/SESSION-STATE.md and
docs/design/uiux-implementation-plan.md. Pick the next story with status=ready whose dependencies
are all done. Execute it per CLAUDE.md per-story flow: superpowers:executing-plans → TDD →
bash tools/pre-codex-smoke.sh <app> → visual re-score against the Phase 2 rubric → codex review --base main.
The story is not done until its screens score 3+ on every lens. Update the story tracker, then hand off.
Model: Sonnet. Budget +300k.
```

**R0 — recovery, if a session died without handing off**
```
The previous UI/UX 2026 session ended without a handoff. Read
docs/prompts/world-class-uiux-master-prompt.md, then reconstruct actual state from disk and git:
docs/design/SESSION-STATE.md (may be stale), docs/design/findings/*.json, artifacts/uiux-2026/,
and `git log` on the worktree branch. Trust the filesystem over SESSION-STATE where they disagree.
Rewrite SESSION-STATE to match reality, report what was lost, and tell me which resume prompt to use.
Do no new audit work this session.
```

---

## Why this prompt is shaped the way it is

| Design choice | Reason |
|---|---|
| Screenshots mandatory before opinions | Source-only UI audits hallucinate. An LLM reading Compose cannot see that Devanagari clips at 200% type. |
| Five separate lenses, separate agents | One agent asked for "UX review" returns a blurred average. Separating visual/motion/IA/content/a11y forces depth in each. |
| Rigid JSON finding contract | Makes findings dedupable, sortable, and countable. Prose findings can't be verified or ranked. |
| Banned-findings list | Without it, ~40% of multi-agent UI output is "improve visual hierarchy" filler. |
| 0–4 rubric with "3 = not done below this" | Gives a measurable definition of "premium" instead of vibes. Also lets you re-score after fixes. |
| 3 verifiers with *different* mandates | Three identical skeptics agree with each other. Code/visual/cost lenses catch different failure classes. |
| Design language defined **before** the audit | Otherwise every agent audits against its own private taste and the findings don't compose. |
| Loop-until-dry completeness critic | Fixed-round audits systematically miss the tail — usually error states and Hindi. |
| Design-system-first sequencing (WS-0) | Fixing 48 screens individually creates 48 new inconsistencies. |
| "Do not do this" appendix | Stops the next session re-proposing things you already rejected. |
| One handoff file, disk over conversation | Sessions end unpredictably. Anything living only in context is lost. Cluster-level writes mean a blowout costs one cluster, not a session. |
| Hand off at ~70% context, not 95% | Model output degrades before context runs out. Work produced in the last 20% is confidently mediocre — and in Phase 2 it poisons Phase 3. |
| Phase 3 in a quarantined fresh session | A session that wrote the findings will defend them. Adversarial review by the author is theatre. |
| Explicit "never claim a phase complete to end tidily" | The single most likely failure mode of a long chained engagement. |

## Before you run it

1. **Worktree** — `git worktree add ../uiux-2026 -b feat/uiux-2026`.
2. **Screenshots are the bottleneck.** Have the Moto G connected and both debug builds installed, and
   `admin-web` dev server running, or Phase 0 stalls.
3. **Fable routing is a hypothesis, not a measured result** — the prompt deliberately tells the session
   to A/B one lane against Opus before committing. Don't let it route the whole creative track blind.
4. Expect Phase 0–3 to be the bulk of the spend. The plan itself is cheap once the audit is real.
5. **Budget ~7–9 sessions before execution even starts.** Sessions 1–7 produce the audit and the plan;
   the actual UI work is sessions 8+, one story each. If that's more ceremony than you want, the
   honest smaller version is: S1 (Phase 0) → S2 (Phase 1) → S3 (Phase 2 on the customer booking
   funnel only, C1+C2) → S4 (verify + plan). That gets you a world-class booking flow instead of a
   thin pass over 48 screens — and it's the better trade if you have to pick.
6. **The worktree must persist across all sessions.** Don't let a session clean it up. Every resume
   prompt assumes the branch and `artifacts/uiux-2026/` are still there.
