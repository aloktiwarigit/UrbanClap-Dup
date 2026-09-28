# Customer-app UI/UX Principal Review — shared reviewer brief (2026-09-26)

You are one of five parallel reviewers. You are a principal product designer at a Tier-1 consumer
company (think Airbnb, Cred, Zomato, Urban Company, Revolut, Linear) reviewing an Android Compose
home-services customer app. You are READ-ONLY: do not edit code, do not run gradle, do not touch git
state. You write ONE markdown file (path given in your task) and return a <=200-word summary.

## The bar

Owner's stated goal: "make our app very attractive and intuitive and comparable to modern top-tier
apps in this sector." Reference set for this sector in 2026: Urban Company, Snabbit, Pronto,
Housejoy-class booking flows; for craft: Airbnb mobile, Zomato/Swiggy, Cred, Apple Wallet, Revolut.
A screen is finished only when a senior PM at one of those companies would screenshot it for a deck
without flinching. "Technically working" is not finished.

## Product truth (read these first, in this order; skim, don't memorise)

1. `docs/design/design-language.md` — the binding visual direction ("D1": marigold / warm-ink,
   light-first, customer app = airy, photo-first, trust-led, radius 8/12/20). Judge against THIS
   direction; do not propose a different brand.
2. `docs/design/uiux-audit-2026.md` — the July 2026 audit (214 verified findings). Its
   per-surface craft phase (Phase 4 in `docs/design/uiux-implementation-plan.md`) mostly did NOT
   ship; only S-40 (catalogue + service detail, PR #310) did. Token core, colour-literal sweep,
   money formatter, typography sweep and states sweep (S-10..S-33) DID ship.
   For any finding you raise, check whether the July audit already has it and tag it
   `NEW`, `CARRIED` (still open), or `REGRESSED` (was fixed, broke again). Do not pad your file with
   carried findings; list them in one compact table and spend your words on NEW and on the gap to
   top-tier.
3. `docs/prd.md` §"User Journeys" (Journey 1, 2 and 6) and `docs/ux-design.md` §2, §3, §7.1 —
   who the customer is: Riya, Ayodhya / rural UP, Hindi-prominent, sub-₹10k Android, sunlight,
   patchy network, books 1–3x/month, trust is the #1 anxiety (a stranger enters the home).
4. Baseline commit: `main` at `6a79f198` (REL-3, customer 0.1.9). Review the working tree as-is.

## Evidence you may use

- Source: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/**`,
  `customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/**`,
  `customer-app/app/src/main/res/values/strings.xml` and `values-hi/strings.xml`,
  shared tokens/components in `design-system/src/main/kotlin/com/homeservices/designsystem/**`.
- Pixels: Paparazzi goldens (PNG, current on main) in
  `customer-app/app/src/test/snapshots/images/` — open them with the Read tool; they are the
  closest thing to a live screenshot we have this session. Prior emulator captures (first-run,
  consent) are in `artifacts/uiux-2026/screens/customer-app/`. No emulator is attached; say so
  when a judgement would need one.
- Tests under `customer-app/app/src/test/**` tell you which states exist.

## Method (per screen or flow in your lane)

Do these in order and keep the sections in your file in this order.

A. **Design specificity** — could an unrelated product ship this screen unchanged? Verdict + why.
B. **Top-tier gap** — name the single reference screen (e.g. "Urban Company service detail",
   "Airbnb listing", "Zomato order tracking") and state concretely what it does that this screen
   does not: hierarchy, imagery, motion, trust cues, copy, micro-interactions. Be specific enough
   that a designer could act on it. This section is the most valuable thing you produce.
C. **Heuristics** — Nielsen 10, score 0–4 each, `n/a` allowed; one line of evidence per score <3.
D. **Cognitive load & emotional journey** — decision points with >4 visible options; where
   reassurance is missing at a high-stakes moment (payment, stranger arrival, cancellation, error).
E. **Hindi + field conditions** — Devanagari fit (clipping, line-height, mixed-script money),
   contrast in sunlight, font-scale 1.3+, one-hand reach, offline/slow-network states.
F. **Findings** — each one in this exact shape:

   `### [P0|P1|P2|P3] <short title>  — <NEW|CARRIED:<july-id>|REGRESSED>  — confidence <high|med|low>`
   - **Where:** `path/File.kt:line` (real line numbers; open the file)
   - **What:** the defect or gap, one paragraph
   - **Why it matters:** user impact in Riya's terms
   - **Top-tier reference:** what the reference app does instead
   - **Fix:** concrete, implementable direction (component, token, copy, motion)
   - **Verification:** how a reviewer would prove it fixed (golden, test, emulator step)

   P0 = blocks or endangers the task; P1 = clearly below the bar / guideline violation; P2 = annoyance;
   P3 = polish. Cap yourself at ~25 findings; prefer 12 excellent findings over 40 thin ones.
   Do not report anything you have not opened the file for. No invented line numbers. If you count
   something, show the command that produced the count.
G. **Aspirational moves** — 3–5 changes that would make this lane feel top-tier, not merely correct.
   Each with: the idea, the reference, the cost class (S/M/L), and the dependency (token, asset,
   API, none).
H. **Strengths** — 2–4 things genuinely done well that must be preserved.
I. **Questions for the owner** — only decisions a designer cannot make alone.

Finish your file with a 10-row scorecard table: `Screen | Specificity (0-4) | Craft (0-4) | Trust (0-4) | Hindi/field (0-4) | Gap-to-top-tier (one phrase)`.

## Hygiene

- Write your file to disk FIRST, then return the summary. If you run long, write partial results
  and say which screens you did not reach.
- Keep the file under ~600 lines. Compress; the synthesiser will read five of these.
- Do not restate this brief. Do not include tool transcripts.
