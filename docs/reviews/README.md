# `docs/reviews/`

Codex CLI review output. **Raw transcripts are git-ignored; keeping one is a deliberate act.**

## What belongs here

| Pattern | Tracked? | Purpose |
|---|---|---|
| `*.summary.md` | **yes** | The distilled review record — findings, verdicts, what was fixed. Write one of these. |
| `README.md` | **yes** | This file. |
| everything else | **no** | Raw `codex review` transcripts, ignored by `.gitignore`. |

## Why

A raw transcript is 0.4–3.5 MB of tool-call log. As of 2026-09-09 there are **153 tracked files here totalling ~92 MiB — roughly 45% of the repository's tracked bytes** — against **8.9 KB** of `.summary.md` files that carry the actual review value.

They accumulated because the previous ignore rule was `docs/reviews/*-raw.md`, and **no file in this repo has ever used a `-raw` suffix**, so it matched nothing for its entire life. The rule was added in good faith after a near-miss and never tested against a realistic filename.

The rule is now inverted — the directory is ignored, with `README.md` and `*.summary.md` un-ignored — so the safe case is the default.

## Writing a summary

Name it `codex-<story>-<date>.summary.md` and keep it short. What belongs in one: the reviewed SHA per round, each finding with its severity and resolution, and any finding that was **adjudicated against** rather than fixed, with the reasoning. See `codex-e21-s02-20260906.summary.md`.

Note the raw transcripts already tracked here are **not** removed by the ignore rule — gitignore does not apply to tracked files. Some are referenced from `docs/stories/*-interface-notes.md`. Reclaiming that space needs a history rewrite and is an owner decision.

## Before you trust a new ignore rule

Prove it catches a realistic filename rather than reasoning that it should:

```bash
git check-ignore -v docs/reviews/codex-20260909-1200-round2.md
```
