#!/usr/bin/env bash
# Recovery script for the deferred Phase B (Codex cross-model challenges) of the
# 2026-05-21 technician-app production-readiness audit.
#
# Why this exists: the original Phase B dispatched 8 parallel `codex exec` background
# tasks. They hung indefinitely (likely shell-quoting + parallel-dispatch interaction
# on Windows/Git-Bash). Codex CLI itself works fine for small sequential prompts.
#
# Usage:
#   bash tools/run-audit-codex-challenges.sh
#
# Output: writes `docs/reviews/codex-challenge-<lane>-20260521-0738.md` for each lane.
# After running, manually append each codex challenge section to its matching lane
# doc and add a reconciliation note (3-5 sentences) summarizing accepted/disputed/merged
# findings. Then re-run the synthesis on the master backlog if any CRIT-tier finding changes.
#
# CAVEAT (added 2026-05-22): The 8 per-lane source docs from the 2026-05-21 audit
# were never committed to git and were wiped from local disk. To use this script
# meaningfully, the audit would need to be re-run first to regenerate the per-lane
# docs. Otherwise codex has nothing to challenge.
set -euo pipefail

PROJECT_ROOT="C:/Alok/Business Projects/Urbanclap-dup"
TS="20260521-0738"
REVIEWS="$PROJECT_ROOT/docs/reviews"

LANES=("security" "i18n" "a11y" "reliability" "perf" "arch" "release" "design")

for LANE in "${LANES[@]}"; do
  LANE_DOC="$REVIEWS/audit-techapp-${LANE}-${TS}.md"
  OUT="$REVIEWS/codex-challenge-${LANE}-${TS}.md"

  if [[ ! -f "$LANE_DOC" ]]; then
    echo "skip $LANE (no lane doc at $LANE_DOC)"
    continue
  fi
  if [[ -f "$OUT" ]]; then
    echo "skip $LANE (challenge already done at $OUT)"
    continue
  fi

  PROMPT="Cross-model adversarial review of a Claude Sonnet 4.6 audit.

Read: docs/reviews/audit-techapp-${LANE}-${TS}.md
Then independently inspect the cited source files under technician-app/ (and api/ if cited).

For each finding output one of:
- CONFIRMED: verified the issue with file:line evidence
- DISPUTED: found error/overstatement, with correct interpretation
- PARTIAL: partially correct, clarify scope

Then a NEW FINDINGS section for issues Claude missed in the same source areas.

Output ONLY markdown body. Start with:
## Codex cross-model challenge — ${LANE}

For each verdict use shape:
### [CONFIRMED|DISPUTED|PARTIAL|NEW] <id> — title
- Evidence: file:line with 1-3 line excerpt
- Verdict / Recommendation: one paragraph

End with: ## Reviewer summary — N confirmed, N disputed, N partial, N new."

  echo ">> Running codex challenge for lane: $LANE ..."
  codex exec \
    --sandbox read-only \
    --skip-git-repo-check \
    --cd "$PROJECT_ROOT" \
    --output-last-message "$OUT" \
    "$PROMPT"

  if [[ -s "$OUT" ]]; then
    echo "   done: $OUT ($(wc -c < "$OUT") bytes)"
  else
    echo "   WARN: $OUT is empty - investigate codex output"
  fi
done

echo ""
echo "All 8 lanes processed."
echo "Next steps:"
echo "  1. Review each codex-challenge-*.md"
echo "  2. Append each as a '## Codex cross-model challenge' section to its lane doc"
echo "  3. Add a reconciliation note at the top of each lane doc"
echo "  4. Re-run master synthesis if any CRIT changes"
