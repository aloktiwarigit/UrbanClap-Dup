# Local setup — what a fresh clone or worktree needs before it can build

A fresh `git clone`, **and every new `git worktree`**, is missing five gitignored files
without which **no Gradle task will run at all** — not `assembleDebug`, not
`testDebugUnitTest`, not even `tasks`. This has blocked a push three separate times, so it
is written down here rather than rediscovered.

Nothing in this document is secret-bearing: it tells you which files to copy from an
existing checkout, not what to put in them.

---

## 1. Why a worktree cannot build

Both app build files resolve release signing at Gradle **configuration** time:

```kotlin
val releaseSigning = loadReleaseSigning()   // top level, not inside a task
```

`loadReleaseSigning()` calls `require(storeFile.isFile)`. Configuration runs for *every*
invocation, so a missing keystore fails the build even for tasks that have nothing to do
with releases. The failure reads:

```
Release signing store file not found at <path>
```

That is the symptom to recognise. It does not mean the release build is broken; it means
the worktree was never seeded.

## 2. The five files

Copy these from a working checkout into the new clone/worktree, preserving paths:

| File | Notes |
|---|---|
| `customer-app/local.properties` | `sdk.dir`, `MAPS_API_KEY`, the four `RELEASE_*` keys, `GOOGLE_WEB_CLIENT_ID` |
| `technician-app/local.properties` | same shape as customer-app |
| `design-system/local.properties` | `sdk.dir` only |
| `customer-app/release-upload.jks` | keystore |
| `technician-app/release-upload.jks` | keystore |

**Keystore path.** `RELEASE_STORE_FILE=release-upload.jks` is resolved with
`rootProject.file(...)`, and each app is its own Gradle root. So the file belongs at
`customer-app/release-upload.jks` — the **sub-project root**, *not* `customer-app/app/`.
Putting it one level too deep produces exactly the same "store file not found" error.

From the repo root, with `$MAIN` pointing at an existing checkout:

```bash
for f in customer-app/local.properties \
         technician-app/local.properties \
         design-system/local.properties \
         customer-app/release-upload.jks \
         technician-app/release-upload.jks; do
  cp "$MAIN/$f" "$f"
done
```

Then confirm all five landed before running Gradle:

```bash
for f in customer-app/local.properties technician-app/local.properties \
         design-system/local.properties customer-app/release-upload.jks \
         technician-app/release-upload.jks; do
  [ -f "$f" ] && echo "OK   $f" || echo "MISS $f"
done
```

These are all gitignored (`**/local.properties`, `*.jks`) and must stay that way — the
repository is public. `google-services.json` is *already committed* for both apps, so it
needs no copying.

The values themselves live in the owner's password manager. For signing-key provenance and
the CI environment-variable equivalents
(`CUSTOMER_RELEASE_*` / `TECHNICIAN_RELEASE_*`), see `docs/play-store-release.md` §3.

## 3. admin-web

The pre-push hook runs `tools/pre-codex-smoke-web.sh`, which invokes the local
`node_modules/.bin/tsc`. In a fresh worktree that binary does not exist and the **push
fails**, not just the gate:

```
tools/pre-codex-smoke-web.sh: line 16: .../node_modules/.bin/tsc: No such file or directory
```

Install first:

```bash
cd admin-web && pnpm install --frozen-lockfile
```

Only needed if the worktree will touch `admin-web/`.

## 4. Verify the worktree is usable

```bash
bash tools/pre-codex-smoke.sh customer-app      # 6 steps
bash tools/pre-codex-smoke.sh technician-app    # 6 steps
```

Run these **bare**. Piping to `tail` or `head` reports the *pipe's* exit status and will
show a failing gate as a pass — redirect to a file and check the exit code instead:

```bash
bash tools/pre-codex-smoke.sh customer-app > gate.log 2>&1; echo "EXIT=$?"
```

## 5. Paparazzi

Never record goldens on Windows — cross-OS font antialiasing drift exceeds Paparazzi's
0.1% threshold. The smoke gate already passes `-PexcludePaparazzi` for this reason.

Record on CI via the `paparazzi-record.yml` `workflow_dispatch`, and fill in `gradle_root`
**and** `gradle_task` explicitly — both silently default to customer-app, so accepting the
defaults while intending technician-app re-records the wrong app. See
`docs/patterns/paparazzi-cross-os-goldens.md`.
