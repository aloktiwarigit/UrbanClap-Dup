# Pattern: Paparazzi Goldens — CI Only, Never Windows
**Stack:** Android / Kotlin / Compose / Paparazzi
**Story source:** E02-S01 (customer auth)
**Last updated:** 2026-04-19
**Recurrence risk:** Certain — affects every Android story that adds or changes a Compose screen

## The Trap

Running `./gradlew recordPaparazziDebug` on Windows produces PNG goldens whose pixel hashes differ from Linux CI. The difference is caused by subpixel font antialiasing and M3 text rendering variation between the two platforms. The diff is typically 1-3 pixels on text edges — invisible to the eye but above Paparazzi's 0.1% default threshold.

Result: CI `verifyPaparazziDebug` fails with `Image mismatch for <TestName>` even though the screen looks correct. The fix (delete + re-record on CI) costs ~45-60 minutes.

## The Solution

**Never run `recordPaparazziDebug` locally on a Windows machine.**

Protocol for every Android story that touches Compose UI:

1. Delete any auto-generated goldens before pushing:
   ```bash
   git rm -r customer-app/src/test/snapshots/images/ 2>/dev/null || true
   git rm -r technician-app/src/test/snapshots/images/ 2>/dev/null || true
   ```

2. Push the branch (without goldens).

3. Trigger the `paparazzi-record.yml` workflow on GitHub Actions via `workflow_dispatch` — this runs on Ubuntu and commits the correct goldens back to the branch.

4. Pull the CI-generated golden commit locally.

5. Only after this commit is on the branch will `verifyPaparazziDebug` pass in `customer-ship.yml`.

## The Tests

After the CI golden commit, verify locally:
```bash
cd customer-app
./gradlew verifyPaparazziDebug
```
Expected: `BUILD SUCCESSFUL` with no image mismatches listed.

## CI Gate

`verifyPaparazziDebug` task in `customer-ship.yml` / `technician-ship.yml`. Blocks merge if any golden mismatches.

## Do Not

- Do not commit goldens generated on Windows (`recordPaparazziDebug` on a dev machine).
- Do not add `--threshold 0.5` to relax the comparison — this masks real regressions.
- Do not skip Paparazzi tests — they are the screenshot regression layer for the design system.
