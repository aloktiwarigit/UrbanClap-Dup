# Pattern: Paparazzi Goldens — CI Only, Never Windows
**Stack:** Android / Kotlin / Compose / Paparazzi
**Story source:** E02-S01 (customer auth)
**Last updated:** 2026-09-14
**Recurrence risk:** Certain — affects every Android story that adds or changes a Compose screen

## The Trap

Running `./gradlew recordPaparazziDebug` on Windows produces PNG goldens whose pixel hashes differ from Linux CI. The difference is caused by subpixel font antialiasing and M3 text rendering variation between the two platforms. The diff is typically 1-3 pixels on text edges — invisible to the eye but above Paparazzi's 0.1% default threshold.

Result: CI `verifyPaparazziDebug` fails with `Image mismatch for <TestName>` even though the screen looks correct. The fix (delete + re-record on CI) costs ~45-60 minutes.

## The Solution

**Never run `recordPaparazziDebug` locally on a Windows machine.**

**`paparazzi-record.yml` uploads an artifact — it does NOT auto-commit anything to the branch.**
Every step after the CI run is manual. (Corrected 2026-09-14 — this doc previously claimed CI
"commits the correct goldens back to the branch"; it never has. Caught when a session read a
green run + an unrelated "Auto-commit regenerated" check in the flat `gh pr checks` list and
told the owner goldens were done when nothing had landed on the branch.)

Protocol for every Android story that touches Compose UI:

1. Delete any auto-generated goldens before pushing:
   ```bash
   git rm -r customer-app/app/src/test/snapshots/images/ 2>/dev/null || true
   git rm -r technician-app/app/src/test/snapshots/images/ 2>/dev/null || true
   ```

2. Push the branch (without goldens).

3. Trigger `paparazzi-record.yml` on GitHub Actions with **explicit** inputs — `gradle_root`
   (`customer-app`, `technician-app`, or `design-system`) and `gradle_task`
   (`:app:recordPaparazziDebug`, or `:recordPaparazziDebug` for `design-system`):
   ```bash
   gh workflow run paparazzi-record.yml \
     -f gradle_root=technician-app \
     -f gradle_task=:app:recordPaparazziDebug
   ```
   **Both inputs default to `customer-app` / `:app:recordPaparazziDebug` if left blank or
   omitted.** Dispatching with no inputs silently records `customer-app`'s screens regardless
   of which app you meant — the run still reports success, the artifact is just for the wrong
   app. Always pass both flags explicitly; never rely on the workflow's own defaults.

4. Download the `paparazzi-snapshots-<gradle_root>` artifact from the Actions run, then unzip
   it **inside the matching `gradle_root` directory** (e.g. `cd technician-app && unzip
   ~/Downloads/paparazzi-snapshots-technician-app.zip`) — `actions/upload-artifact@v4` strips
   the common path prefix, so the archive's entries are relative to `<gradle_root>/`.

5. Commit the extracted goldens and push. Only after this commit is on the branch will
   `verifyPaparazziDebug` pass in `customer-ship.yml` / `technician-ship.yml`.

## The Tests

After committing the downloaded goldens, verify locally:
```bash
cd customer-app   # or technician-app
./gradlew verifyPaparazziDebug
```
Expected: `BUILD SUCCESSFUL` with no image mismatches listed.

## CI Gate

`verifyPaparazziDebug` task in `customer-ship.yml` / `technician-ship.yml`. Blocks merge if any golden mismatches.

## Do Not

- Do not commit goldens generated on Windows (`recordPaparazziDebug` on a dev machine).
- Do not add `--threshold 0.5` to relax the comparison — this masks real regressions.
- Do not skip Paparazzi tests — they are the screenshot regression layer for the design system.
