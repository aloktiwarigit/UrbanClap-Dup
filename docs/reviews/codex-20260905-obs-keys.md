OpenAI Codex v0.147.0
--------
workdir: C:\Alok\Business Projects\wt-obs-keys
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: high
reasoning summaries: none
session id: 01a07365-9cb9-70e0-8d7b-458371e33835
--------
user
changes against 'main'
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 891ms:


    Directory: C:\Alok\Business Projects\wt-obs-keys


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
d-----          9/5/2026   4:34 PM                .claire                                                              
d-----          9/5/2026   4:34 PM                .firebase                                                            
d-----          9/5/2026   4:34 PM                .githooks                                                            
d-----          9/5/2026   4:34 PM                .github                                                              
d-----          9/5/2026   4:34 PM                .serena                                                              
d-----          9/5/2026   4:34 PM                .superpowers                                                         
d-----          9/5/2026   4:34 PM                admin-web                                                            
d-----          9/5/2026   4:34 PM                api                                                                  
d-----          9/5/2026   4:34 PM                artifacts                                                            
d-----          9/5/2026   4:34 PM                commonMain                                                           
d-----          9/5/2026   4:37 PM                core-nav                                                             
d-----          9/5/2026   4:37 PM                customer-app                                                         
d-----          9/5/2026   4:37 PM                design-system                                                        
d-----          9/5/2026   4:34 PM                docs                                                                 
d-----          9/5/2026   4:34 PM                figma                                                                
d-----          9/5/2026   4:34 PM                firebase                                                             
d-----          9/5/2026   4:34 PM                infra                                                                
d-----          9/5/2026   4:34 PM                moto-g-snapshots                                                     
d-----          9/5/2026   4:34 PM                plans                                                                
d-----          9/5/2026   4:34 PM                play-store-assets                                                    
d-----          9/5/2026   4:44 PM                technician-app                                                       
d-----          9/5/2026   4:34 PM                tools                                                                
d-----          9/5/2026   4:34 PM                _bmad                                                                
d-----          9/5/2026   4:34 PM                _bmad-output                                                         
-a----          9/5/2026   4:34 PM             26 .bmad-readiness-passed                                               
-a----          9/5/2026   4:34 PM            348 .codex-review-passed                                                 
-a----          9/5/2026   4:34 PM             63 .firebaserc                                                          
-a-h--          9/5/2026   4:34 PM             75 .git                                                                 
-a----          9/5/2026   4:34 PM            659 .gitattributes                                                       
-a----          9/5/2026   4:34 PM           3617 .gitignore                                                           
-a----          9/5/2026   4:34 PM            694 .semgrepignore                                                       
-a----          9/5/2026   4:34 PM          14551 CLAUDE.md                                                            
-a----          9/5/2026   4:34 PM            252 firebase.json                                                        
-a----          9/5/2026   4:34 PM           1346 TOKEN-SYNC.md                                                        



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Recurse -Force -Filter AGENTS.md | Select-Object -ExpandProperty FullName; Get-ChildItem -Recurse -Force -Filter AGENTS.override.md | Select-Object -ExpandProperty FullName' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 4895ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --stat aab4fddc4809ea0b052cfbf648590098690158e7; git diff --name-only aab4fddc4809ea0b052cfbf648590098690158e7' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 762ms:
 customer-app/app/build.gradle.kts   | 78 +++++++++++++++++++++++++++++++++++--
 docs/runbook.md                     | 21 ++++++++++
 technician-app/app/build.gradle.kts | 78 +++++++++++++++++++++++++++++++++++--
 3 files changed, 171 insertions(+), 6 deletions(-)
customer-app/app/build.gradle.kts
docs/runbook.md
technician-app/app/build.gradle.kts
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --no-ext-diff --unified=80 aab4fddc4809ea0b052cfbf648590098690158e7 -- customer-app/app/build.gradle.kts technician-app/app/build.gradle.kts docs/runbook.md' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 675ms:
diff --git a/customer-app/app/build.gradle.kts b/customer-app/app/build.gradle.kts
index fcb15b8e..5219d06b 100644
--- a/customer-app/app/build.gradle.kts
+++ b/customer-app/app/build.gradle.kts
@@ -24,240 +24,312 @@ fun googleServicesWebClientId(): String? {
         .mapNotNull { it as? Map<*, *> }
         .flatMap { client ->
             ((client["oauth_client"] as? List<*>) ?: emptyList<Any?>()).asSequence()
         }.mapNotNull { it as? Map<*, *> }
         .firstOrNull { it["client_type"] == 3 }
         ?.get("client_id")
         ?.toString()
         ?.takeIf { it.isNotBlank() }
 }
 
 fun buildConfigString(value: String): String = "\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""
 
 data class ReleaseSigning(
     val storeFile: File,
     val storePassword: String,
     val keyAlias: String,
     val keyPassword: String,
 )
 
 fun envOrLocalProperty(name: String): String? =
     System.getenv(name)?.takeIf { it.isNotBlank() }
         ?: localProperty(name)
 
 fun releaseSigningProperty(name: String): String? =
     envOrLocalProperty("CUSTOMER_$name")
         ?: envOrLocalProperty(name)
 
 fun resolveReleaseFile(path: String): File {
     val candidate = File(path)
     return if (candidate.isAbsolute) candidate else rootProject.file(path)
 }
 
 fun loadReleaseSigning(): ReleaseSigning? {
     val storeFilePath = releaseSigningProperty("RELEASE_STORE_FILE")
     val storePassword = releaseSigningProperty("RELEASE_STORE_PASSWORD")
     val keyAlias = releaseSigningProperty("RELEASE_KEY_ALIAS")
     val keyPassword = releaseSigningProperty("RELEASE_KEY_PASSWORD")
 
     if (listOf(storeFilePath, storePassword, keyAlias, keyPassword).all { it == null }) {
         return null
     }
 
     val storeFile =
         resolveReleaseFile(
             requireNotNull(storeFilePath) {
                 "Missing RELEASE_STORE_FILE for release signing."
             },
         )
     require(storeFile.isFile) {
         "Release signing store file not found at ${storeFile.absolutePath}."
     }
 
     return ReleaseSigning(
         storeFile = storeFile,
         storePassword =
             requireNotNull(storePassword) {
                 "Missing RELEASE_STORE_PASSWORD for release signing."
             },
         keyAlias =
             requireNotNull(keyAlias) {
                 "Missing RELEASE_KEY_ALIAS for release signing."
             },
         keyPassword =
             requireNotNull(keyPassword) {
                 "Missing RELEASE_KEY_PASSWORD for release signing."
             },
     )
 }
 
 val googleWebClientId =
     System.getenv("GOOGLE_WEB_CLIENT_ID")?.takeIf { it.isNotBlank() }
         ?: localProperty("GOOGLE_WEB_CLIENT_ID")
         ?: googleServicesWebClientId()
         ?: ""
 
 val mapsApiKey =
     System.getenv("MAPS_API_KEY")?.takeIf { it.isNotBlank() }
         ?: localProperty("MAPS_API_KEY")
         ?: ""
 
+// ─────────────────────────────────────────────────────────────────────────────
+// Observability and feature-flag keys.
+//
+// These resolve the same way as MAPS_API_KEY and the signing values: environment
+// variable first, then local.properties. They used to read the environment only, so a
+// release built from a shell without them exported silently baked in "" — and every
+// consumer treats a blank key as "feature switched off" and returns quietly. That is
+// how customer-app shipped to Play with Sentry, PostHog and GrowthBook all inert.
+//
+// verifyReleaseObservabilityKeys (below) now fails a release build that would repeat it.
+// ─────────────────────────────────────────────────────────────────────────────
+val sentryDsn = envOrLocalProperty("SENTRY_DSN") ?: ""
+val postHogApiKey = envOrLocalProperty("POSTHOG_API_KEY") ?: ""
+val growthBookClientKey = envOrLocalProperty("GROWTHBOOK_CLIENT_KEY") ?: ""
+
 val releaseSigning = loadReleaseSigning()
 
+// ─────────────────────────────────────────────────────────────────────────────
+// Release gate: a blank observability key must never reach Play again.
+//
+// Every consumer of these keys treats blank as "switched off" and returns without a
+// word — SentryInitializer returns on a blank DSN, PostHogAnalyticsFacade returns on a
+// blank API key, GrowthBook fetches nothing and every flag falls to its default. That
+// silence is the whole problem, so the build says it out loud instead.
+//
+// Set them per app in local.properties (not committed) or export them before building:
+//   SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
+//   POSTHOG_API_KEY=phc_<key>
+//   GROWTHBOOK_CLIENT_KEY=sdk-<key>
+//
+// To ship without one on purpose, set ALLOW_BLANK_OBSERVABILITY_KEYS=true. That is an
+// explicit, per-build acknowledgement and still prints a warning — the point is that
+// nobody discovers it months later from an empty dashboard.
+// ─────────────────────────────────────────────────────────────────────────────
+val blankReleaseObservabilityKeys =
+    mapOf(
+        "SENTRY_DSN" to sentryDsn,
+        "POSTHOG_API_KEY" to postHogApiKey,
+        "GROWTHBOOK_CLIENT_KEY" to growthBookClientKey,
+    ).filterValues { it.isBlank() }
+        .keys
+        .sorted()
+
+val allowBlankObservabilityKeys =
+    envOrLocalProperty("ALLOW_BLANK_OBSERVABILITY_KEYS")?.toBooleanStrictOrNull() ?: false
+
+val verifyReleaseObservabilityKeys =
+    tasks.register("verifyReleaseObservabilityKeys") {
+        group = "verification"
+        description = "Fails a release build whose observability keys would be baked in blank."
+        // Captured at configuration time so the task body closes over plain data.
+        val missing = blankReleaseObservabilityKeys
+        val allowed = allowBlankObservabilityKeys
+        doLast {
+            if (missing.isEmpty()) return@doLast
+            val detail =
+                buildString {
+                    appendLine("Release build would bake in blank keys: ${missing.joinToString(", ")}.")
+                    appendLine("Each one silently disables its feature at runtime — no crash, no log.")
+                    appendLine("Set them in local.properties or the environment, or acknowledge with")
+                    appendLine("ALLOW_BLANK_OBSERVABILITY_KEYS=true to ship without them on purpose.")
+                }
+            if (allowed) {
+                logger.warn("WARNING: $detail")
+            } else {
+                throw GradleException(detail)
+            }
+        }
+    }
+
+tasks.matching { it.name == "assembleRelease" || it.name == "bundleRelease" }.configureEach {
+    dependsOn(verifyReleaseObservabilityKeys)
+}
+
 plugins {
     alias(libs.plugins.android.application)
     alias(libs.plugins.kotlin.android)
     alias(libs.plugins.kotlin.compose)
     alias(libs.plugins.ksp)
     alias(libs.plugins.hilt)
     alias(libs.plugins.ktlint)
     alias(libs.plugins.detekt)
     alias(libs.plugins.paparazzi)
     alias(libs.plugins.kover)
     alias(libs.plugins.android.junit5)
     alias(libs.plugins.google.services)
     alias(libs.plugins.kotlin.serialization)
 }
 
 android {
     namespace = "com.homeservices.customer"
     compileSdk = 35
 
     if (releaseSigning != null) {
         signingConfigs {
             create("release") {
                 storeFile = releaseSigning.storeFile
                 storePassword = releaseSigning.storePassword
                 keyAlias = releaseSigning.keyAlias
                 keyPassword = releaseSigning.keyPassword
             }
         }
     }
 
     defaultConfig {
         applicationId = "in.homeheroo.customer"
         minSdk = 26
         targetSdk = 35
         versionCode = 11
         versionName = "0.1.7"
 
         testInstrumentationRunner = "com.homeservices.customer.TestRunner"
 
         buildConfigField(
             "String",
             "SENTRY_DSN",
-            "\"${System.getenv("SENTRY_DSN") ?: ""}\"",
+            buildConfigString(sentryDsn),
         )
         buildConfigField(
             "String",
             "GIT_SHA",
             "\"${System.getenv("GIT_SHA") ?: "dev"}\"",
         )
         buildConfigField(
             "String",
             "API_BASE_URL",
             "\"${System.getenv("API_BASE_URL") ?: "https://func-homeservices-prod.azurewebsites.net/api"}\"",
         )
         buildConfigField(
             "String",
             "RAZORPAY_KEY_ID",
             "\"${System.getenv("RAZORPAY_KEY_ID") ?: ""}\"",
         )
         buildConfigField(
             "String",
             "GOOGLE_WEB_CLIENT_ID",
             buildConfigString(googleWebClientId),
         )
         buildConfigField(
             "String",
             "MAPS_API_KEY",
             buildConfigString(mapsApiKey),
         )
         buildConfigField(
             "String",
             "GROWTHBOOK_CLIENT_KEY",
-            "\"${System.getenv("GROWTHBOOK_CLIENT_KEY") ?: ""}\"",
+            buildConfigString(growthBookClientKey),
         )
         buildConfigField(
             "String",
             "POSTHOG_API_KEY",
-            "\"${System.getenv("POSTHOG_API_KEY") ?: ""}\"",
+            buildConfigString(postHogApiKey),
         )
         manifestPlaceholders["MAPS_API_KEY"] = mapsApiKey
     }
 
     buildTypes {
         debug {
             isMinifyEnabled = false
         }
         release {
             isMinifyEnabled = true
             isShrinkResources = true
             if (releaseSigning != null) {
                 signingConfig = signingConfigs.getByName("release")
             }
             proguardFiles(
                 getDefaultProguardFile("proguard-android-optimize.txt"),
                 "proguard-rules.pro",
             )
             // Razorpay disabled for pilot (cash-only). Guard removed.
         }
     }
 
     compileOptions {
         sourceCompatibility = JavaVersion.VERSION_17
         targetCompatibility = JavaVersion.VERSION_17
     }
 
     buildFeatures {
         compose = true
         buildConfig = true
     }
 
     packaging {
         resources {
             excludes += "/META-INF/{AL2.0,LGPL2.1}"
             excludes += "/META-INF/LICENSE*"
         }
     }
 
     sourceSets {
         getByName("main").kotlin.srcDirs("src/main/kotlin")
         getByName("test").kotlin.srcDirs("src/test/kotlin")
         getByName("androidTest").kotlin.srcDirs("src/androidTest/kotlin")
     }
 
     lint {
         baseline = file("lint-baseline.xml")
         warningsAsErrors = true
         checkDependencies = false
         abortOnError = true
         checkReleaseBuilds = false
         // Story E01-S03 pins specific versions (AGP 8.6.0, targetSdk 35, etc.) per architecture
         // decision. Suppress advisory "newer version available" checks to avoid false failures.
         // LintError suppresses internal lint FIR crash (AGP 8.6.0 + K2 known issue on unit-test supertype resolution)
         disable += setOf("OldTargetApi", "AndroidGradlePluginVersion", "GradleDependency", "LintError")
     }
 
     testOptions {
         unitTests {
             isIncludeAndroidResources = true
             all { test: org.gradle.api.tasks.testing.Test ->
                 // Pass -PexcludePaparazzi in smoke gate to skip snapshot tests on Windows.
                 //
                 // Paparazzi cannot initialise its layoutlib bridge on Windows at all — it throws
                 // "Failed to init Bridge" / UninitializedPropertyAccessException rather than
                 // reporting a golden mismatch — so these must be excluded locally and verified on
                 // CI Linux. See docs/patterns/paparazzi-cross-os-goldens.md.
                 //
                 // The "*PaparazziTest*" pattern alone is not sufficient: it silently misses any
                 // Paparazzi-backed class that does not follow the naming convention, which made the
                 // smoke gate fail on Windows for reasons unrelated to the change under test. The
                 // durable fix is to rename offenders, but renaming a Paparazzi class also renames
                 // every golden it owns (the class name is embedded in the PNG filename), so the
                 // non-conforming names are listed explicitly here instead.
                 if (project.hasProperty("excludePaparazzi")) {
                     test.filter.excludeTestsMatching("*PaparazziTest*")
                     test.filter.excludeTestsMatching("*CatalogueHomeScreenTest*")
                 }
             }
         }
diff --git a/docs/runbook.md b/docs/runbook.md
index 6ab9c9fc..cd502dba 100644
--- a/docs/runbook.md
+++ b/docs/runbook.md
@@ -542,160 +542,181 @@ X-Setup-Secret: <secret>
 Authorization: Bearer <setup-token>
 ```
 
 Follow with the POST to confirm the TOTP code. On success, the owner's TOTP device is enrolled and the setup endpoint is now locked (any subsequent attempt without the secret returns 403).
 
 ### Step 5 — Optional: rotate or remove the secret
 
 After enrollment is confirmed:
 - **Remove:** Delete `ADMIN_SETUP_SECRET` from Azure Function App settings → setup endpoint reverts to open mode (safe post-enrollment since `ALREADY_ENROLLED` blocks re-setup).
 - **Rotate:** Replace with a new value for future re-enrollment scenarios (e.g. new admin, device lost).
 
 ### Troubleshooting
 
 | Symptom | Cause | Fix |
 |---|---|---|
 | `403 SETUP_SECRET_REQUIRED` | Header missing or wrong value | Check the `X-Setup-Secret` header matches `ADMIN_SETUP_SECRET` in Azure settings exactly |
 | `409 ALREADY_ENROLLED` | Owner already completed setup | Setup is done — no action needed |
 | `401 SETUP_TOKEN_INVALID` | Setup JWT expired (15 min TTL) | Re-login to get a new setup token |
 
 ---
 
 ## Emergency Rollback
 
 **Trigger:** Sentry error rate > 5%, payment webhook failures > 2/10 min, FCM delivery < 80%/30 min, or any unhandled first-time exception in production.
 
 **Estimated time: < 15 minutes from detection to user impact ended.**
 
 ### Step 1 — Disable soft_launch_enabled (immediate user impact ended)
 
 In GrowthBook dashboard → Feature Flags → `soft_launch_enabled` → set to `false`.
 
 All new booking creation attempts immediately return:
 ```json
 { "code": "SERVICE_UNAVAILABLE", "message": "Launch coming soon" }
 ```
 Customers see "coming soon" instead of an error. No data is written.
 
 ### Step 2 — Triage in-flight bookings
 
 For any bookings currently in `PAID` or `SEARCHING` state:
 - Open admin-web → Orders → filter by status `SEARCHING`
 - Owner manually closes or refunds via admin override panel
 - Razorpay Route payouts for `COMPLETED` bookings continue automatically (unaffected)
 
 ### Step 3 — Revert the bad commit (if code regression)
 
 ```bash
 git log --oneline origin/main | head -5    # identify the bad SHA
 git revert -m 1 <sha>                      # creates a revert commit
 git push origin HEAD:feature/revert-<sha>  # push to a new branch
 # Open PR → CI green → merge
 ```
 
 Do NOT force-push to main. Use revert + PR.
 
 ### Step 4 — Re-enable after root cause fixed
 
 Once the fix is deployed and smoke-tested:
 - GrowthBook → `soft_launch_enabled` → set to `true`
 - Monitor Sentry for 10 minutes
 - Notify F&F users via admin FCM broadcast (topic: `all_customers`)
 
 ---
 
 ## Launch Checklist
 
 Required env vars before enabling `soft_launch_enabled`:
 
 | Env var | Where set | Note |
 |---|---|---|
 | `GROWTHBOOK_CLIENT_KEY` | Azure Functions app settings | Required for soft-launch flag to work |
 | `GROWTHBOOK_API_HOST` | Azure Functions app settings | Default: `https://cdn.growthbook.io` |
 | `RAZORPAY_KEY_ID` | Azure Functions app settings | Production key (not test) |
 | `RAZORPAY_KEY_SECRET` | Azure Functions app settings | Production key (not test) |
 | `RAZORPAY_WEBHOOK_SECRET` | Azure Functions app settings | For webhook signature validation |
 | `COSMOS_PAN_ENCRYPTION_KEY` | Azure Functions app settings | `openssl rand -base64 32` |
 | `ADMIN_SETUP_SECRET` | Azure Functions app settings | First-run only — remove after TOTP enrollment |
 
 See `docs/launch-checklist.md` for the full pre-launch checklist.
 
+### Android build-time keys (customer-app and technician-app)
+
+These are compiled into the APK/AAB, so they must be present **at build time** — setting them
+in Azure later has no effect. Each resolves from the environment first, then the app's own
+`local.properties` (git-ignored).
+
+| Key | Consequence if blank |
+|---|---|
+| `SENTRY_DSN` | `SentryInitializer` returns early — no crash or error reporting at all |
+| `POSTHOG_API_KEY` | `PostHogAnalyticsFacade` returns early — no product analytics |
+| `GROWTHBOOK_CLIENT_KEY` | flags never fetch; every flag silently falls back to its default |
+
+Every consumer treats a blank key as "feature switched off" and returns without logging, so a
+release built without them looks completely healthy while reporting nothing. `bundleRelease` and
+`assembleRelease` therefore run `verifyReleaseObservabilityKeys` first and fail if any is blank.
+To ship without one deliberately, set `ALLOW_BLANK_OBSERVABILITY_KEYS=true` — the build then warns
+instead of failing.
+
+`RAZORPAY_KEY_ID` is deliberately blank for the cash-only pilot and is not covered by that gate.
+
+
 ---
 
 ## Disaster Recovery Drill
 
 **Run this drill 1–2 weeks before launch to confirm recovery procedures work.**
 
 ### 1. Cosmos DB restore (point-in-time)
 
 Azure Cosmos DB Serverless has continuous backup enabled by default.
 
 **Procedure:**
 1. Azure Portal → Cosmos DB account → Backups → Restore
 2. Select timestamp (up to 30 days back)
 3. Restore to a new account (restoration is non-destructive — original account remains)
 4. Verify document counts and spot-check data integrity
 5. DNS/connection string cutover: Azure Functions → Configuration → `COSMOS_CONNECTION_STRING` → update to new account endpoint
 6. Restart Function App to pick up new connection string
 
 **Estimated RTO:**
 - Full restore: 2–4 hours (depends on data volume)
 - Connection string cutover: 30 minutes (if restore already complete)
 
 **Drill:** Restore to a test Cosmos account, verify 5 sample bookings match production, then delete the test account.
 
 ### 2. Azure Functions cold-start recovery
 
 If Functions are unresponsive (HTTP 5xx or no response):
 
 ```bash
 # Portal path:
 # Azure Portal → Function App → Overview → Restart
 
 # CLI (faster):
 az functionapp restart --name <app-name> --resource-group <resource-group>
 ```
 
 **Estimated RTO:** < 5 minutes (Functions restart and warm up within 2–3 cold-start invocations)
 
 **Drill:** Restart the staging Function App and verify `GET /api/health` returns 200 within 60 seconds.
 
 ### 3. Firebase Auth outage
 
 Firebase Phone Auth is Google-managed infrastructure.
 
 **During outage:**
 - Existing sessions (Firebase JWT / persistent token) continue to work — customers mid-flow are unaffected
 - New logins fail with `auth/network-request-failed` → customer-app shows "Please try again later" message
 - No owner action needed
 
 **Resolution:** Monitor [Firebase Status](https://status.firebase.google.com). Firebase has 99.9% monthly uptime SLA.
 
 **Owner action:** None. If outage > 1 hour, post in-app maintenance banner via admin FCM broadcast.
 
 ### 4. FCM outage
 
 FCM is Google-managed infrastructure.
 
 **During outage:**
 - Job offers not delivered via push → technicians must manually check the app for new jobs
 - Owner FCM alerts not delivered → owner monitors admin dashboard directly
 - `dispatcher.service.ts` logs `FCM_DELIVERY_FAILED` to Sentry — confirms outage is FCM-side
 
 **Resolution:** None needed. FCM has 99.9% SLA. Bookings and payments are unaffected.
 
 **Owner action:** Notify active technicians via SMS (manual, out-of-band) if outage > 30 minutes.
 
 ### 5. Razorpay Route outage
 
 > **⚠ Deferred — requires live Razorpay account.** This procedure is documented but cannot be executed until the Razorpay live account is provisioned. The procedure body is preserved here so it is ready to execute on Day 1 of go-live; do not remove.
 
 **During outage:**
 - Payout disbursements via Route will fail
 - `trigger-booking-completed.ts` captures Route errors to Sentry (`RazorpayRoutePayoutFailed`)
 - Settled amounts stay in `PENDING` state in `wallet_ledger` entries — **idempotent and safe to retry**
 
 **Resolution:** When Route recovers, `trigger-reconcile-payouts.ts` automatically retries all `FAILED` ledger entries on its next scheduled run (every 6 hours).
 
 **Owner action:**
 - Monitor `/v1/admin/finance/payout-queue` for stuck `PENDING` entries
 - If entries remain stuck > 24 hours after Route recovery, manually trigger `trigger-reconcile-payouts` from Azure Portal → Functions → Run
diff --git a/technician-app/app/build.gradle.kts b/technician-app/app/build.gradle.kts
index e6810eb0..fb304eb7 100644
--- a/technician-app/app/build.gradle.kts
+++ b/technician-app/app/build.gradle.kts
@@ -24,237 +24,309 @@ fun googleServicesWebClientId(): String? {
         .mapNotNull { it as? Map<*, *> }
         .flatMap { client ->
             ((client["oauth_client"] as? List<*>) ?: emptyList<Any?>()).asSequence()
         }.mapNotNull { it as? Map<*, *> }
         .firstOrNull { it["client_type"] == 3 }
         ?.get("client_id")
         ?.toString()
         ?.takeIf { it.isNotBlank() }
 }
 
 fun buildConfigString(value: String): String = "\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""
 
 data class ReleaseSigning(
     val storeFile: File,
     val storePassword: String,
     val keyAlias: String,
     val keyPassword: String,
 )
 
 fun envOrLocalProperty(name: String): String? =
     System.getenv(name)?.takeIf { it.isNotBlank() }
         ?: localProperty(name)
 
 fun releaseSigningProperty(name: String): String? =
     envOrLocalProperty("TECHNICIAN_$name")
         ?: envOrLocalProperty(name)
 
 fun resolveReleaseFile(path: String): File {
     val candidate = File(path)
     return if (candidate.isAbsolute) candidate else rootProject.file(path)
 }
 
 fun loadReleaseSigning(): ReleaseSigning? {
     val storeFilePath = releaseSigningProperty("RELEASE_STORE_FILE")
     val storePassword = releaseSigningProperty("RELEASE_STORE_PASSWORD")
     val keyAlias = releaseSigningProperty("RELEASE_KEY_ALIAS")
     val keyPassword = releaseSigningProperty("RELEASE_KEY_PASSWORD")
 
     if (listOf(storeFilePath, storePassword, keyAlias, keyPassword).all { it == null }) {
         return null
     }
 
     val storeFile =
         resolveReleaseFile(
             requireNotNull(storeFilePath) {
                 "Missing RELEASE_STORE_FILE for release signing."
             },
         )
     require(storeFile.isFile) {
         "Release signing store file not found at ${storeFile.absolutePath}."
     }
 
     return ReleaseSigning(
         storeFile = storeFile,
         storePassword =
             requireNotNull(storePassword) {
                 "Missing RELEASE_STORE_PASSWORD for release signing."
             },
         keyAlias =
             requireNotNull(keyAlias) {
                 "Missing RELEASE_KEY_ALIAS for release signing."
             },
         keyPassword =
             requireNotNull(keyPassword) {
                 "Missing RELEASE_KEY_PASSWORD for release signing."
             },
     )
 }
 
 val googleWebClientId =
     System.getenv("GOOGLE_WEB_CLIENT_ID")?.takeIf { it.isNotBlank() }
         ?: localProperty("GOOGLE_WEB_CLIENT_ID")
         ?: googleServicesWebClientId()
         ?: ""
 
 val mapsApiKey =
     System.getenv("MAPS_API_KEY")?.takeIf { it.isNotBlank() }
         ?: localProperty("MAPS_API_KEY")
         ?: ""
 
+// ─────────────────────────────────────────────────────────────────────────────
+// Observability and feature-flag keys.
+//
+// These resolve the same way as MAPS_API_KEY and the signing values: environment
+// variable first, then local.properties. They used to read the environment only, so a
+// release built from a shell without them exported silently baked in "" — and every
+// consumer treats a blank key as "feature switched off" and returns quietly. That is
+// how customer-app shipped to Play with Sentry, PostHog and GrowthBook all inert.
+//
+// verifyReleaseObservabilityKeys (below) now fails a release build that would repeat it.
+// ─────────────────────────────────────────────────────────────────────────────
+val sentryDsn = envOrLocalProperty("SENTRY_DSN") ?: ""
+val postHogApiKey = envOrLocalProperty("POSTHOG_API_KEY") ?: ""
+val growthBookClientKey = envOrLocalProperty("GROWTHBOOK_CLIENT_KEY") ?: ""
+
 val releaseSigning = loadReleaseSigning()
 
+// ─────────────────────────────────────────────────────────────────────────────
+// Release gate: a blank observability key must never reach Play again.
+//
+// Every consumer of these keys treats blank as "switched off" and returns without a
+// word — SentryInitializer returns on a blank DSN, PostHogAnalyticsFacade returns on a
+// blank API key, GrowthBook fetches nothing and every flag falls to its default. That
+// silence is the whole problem, so the build says it out loud instead.
+//
+// Set them per app in local.properties (not committed) or export them before building:
+//   SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
+//   POSTHOG_API_KEY=phc_<key>
+//   GROWTHBOOK_CLIENT_KEY=sdk-<key>
+//
+// To ship without one on purpose, set ALLOW_BLANK_OBSERVABILITY_KEYS=true. That is an
+// explicit, per-build acknowledgement and still prints a warning — the point is that
+// nobody discovers it months later from an empty dashboard.
+// ─────────────────────────────────────────────────────────────────────────────
+val blankReleaseObservabilityKeys =
+    mapOf(
+        "SENTRY_DSN" to sentryDsn,
+        "POSTHOG_API_KEY" to postHogApiKey,
+        "GROWTHBOOK_CLIENT_KEY" to growthBookClientKey,
+    ).filterValues { it.isBlank() }
+        .keys
+        .sorted()
+
+val allowBlankObservabilityKeys =
+    envOrLocalProperty("ALLOW_BLANK_OBSERVABILITY_KEYS")?.toBooleanStrictOrNull() ?: false
+
+val verifyReleaseObservabilityKeys =
+    tasks.register("verifyReleaseObservabilityKeys") {
+        group = "verification"
+        description = "Fails a release build whose observability keys would be baked in blank."
+        // Captured at configuration time so the task body closes over plain data.
+        val missing = blankReleaseObservabilityKeys
+        val allowed = allowBlankObservabilityKeys
+        doLast {
+            if (missing.isEmpty()) return@doLast
+            val detail =
+                buildString {
+                    appendLine("Release build would bake in blank keys: ${missing.joinToString(", ")}.")
+                    appendLine("Each one silently disables its feature at runtime — no crash, no log.")
+                    appendLine("Set them in local.properties or the environment, or acknowledge with")
+                    appendLine("ALLOW_BLANK_OBSERVABILITY_KEYS=true to ship without them on purpose.")
+                }
+            if (allowed) {
+                logger.warn("WARNING: $detail")
+            } else {
+                throw GradleException(detail)
+            }
+        }
+    }
+
+tasks.matching { it.name == "assembleRelease" || it.name == "bundleRelease" }.configureEach {
+    dependsOn(verifyReleaseObservabilityKeys)
+}
+
 plugins {
     alias(libs.plugins.android.application)
     alias(libs.plugins.kotlin.android)
     alias(libs.plugins.kotlin.compose)
     alias(libs.plugins.ksp)
     alias(libs.plugins.hilt)
     alias(libs.plugins.ktlint)
     alias(libs.plugins.detekt)
     alias(libs.plugins.paparazzi)
     alias(libs.plugins.kover)
     alias(libs.plugins.android.junit5)
     alias(libs.plugins.google.services)
     alias(libs.plugins.crashlytics)
     alias(libs.plugins.kotlin.serialization)
     alias(libs.plugins.sentry)
 }
 
 android {
     namespace = "com.homeservices.technician"
     compileSdk = 35
 
     if (releaseSigning != null) {
         signingConfigs {
             create("release") {
                 storeFile = releaseSigning.storeFile
                 storePassword = releaseSigning.storePassword
                 keyAlias = releaseSigning.keyAlias
                 keyPassword = releaseSigning.keyPassword
             }
         }
     }
 
     defaultConfig {
         applicationId = "in.homeheroo.technician"
         minSdk = 26
         targetSdk = 35
         versionCode = 12
         versionName = "0.1.11"
 
         testInstrumentationRunner = "com.homeservices.technician.TestRunner"
 
         buildConfigField(
             "String",
             "SENTRY_DSN",
-            "\"${System.getenv("SENTRY_DSN") ?: ""}\"",
+            buildConfigString(sentryDsn),
         )
         buildConfigField(
             "String",
             "API_BASE_URL",
             "\"${System.getenv("API_BASE_URL") ?: "https://func-homeservices-prod.azurewebsites.net/api"}\"",
         )
         buildConfigField(
             "String",
             "GIT_SHA",
             "\"${System.getenv("GIT_SHA") ?: "dev"}\"",
         )
         buildConfigField(
             "String",
             "GOOGLE_WEB_CLIENT_ID",
             buildConfigString(googleWebClientId),
         )
         buildConfigField(
             "String",
             "MAPS_API_KEY",
             buildConfigString(mapsApiKey),
         )
         buildConfigField(
             "String",
             "GROWTHBOOK_CLIENT_KEY",
-            "\"${System.getenv("GROWTHBOOK_CLIENT_KEY") ?: ""}\"",
+            buildConfigString(growthBookClientKey),
         )
         buildConfigField(
             "String",
             "POSTHOG_API_KEY",
-            "\"${System.getenv("POSTHOG_API_KEY") ?: ""}\"",
+            buildConfigString(postHogApiKey),
         )
         buildConfigField(
             "String",
             "POSTHOG_HOST",
             "\"${System.getenv("POSTHOG_HOST") ?: "https://us.i.posthog.com"}\"",
         )
         manifestPlaceholders["MAPS_API_KEY"] = mapsApiKey
         resourceConfigurations += listOf("en", "hi")
     }
 
     buildTypes {
         debug {
             isMinifyEnabled = false
         }
         release {
             isMinifyEnabled = true
             isShrinkResources = true
             isDebuggable = false
             if (releaseSigning != null) {
                 signingConfig = signingConfigs.getByName("release")
             }
             proguardFiles(
                 getDefaultProguardFile("proguard-android-optimize.txt"),
                 "proguard-rules.pro",
             )
         }
     }
 
     compileOptions {
         sourceCompatibility = JavaVersion.VERSION_17
         targetCompatibility = JavaVersion.VERSION_17
     }
 
     buildFeatures {
         compose = true
         buildConfig = true
     }
 
     packaging {
         resources {
             excludes += "/META-INF/{AL2.0,LGPL2.1}"
             excludes += "/META-INF/LICENSE*"
         }
     }
 
     sourceSets {
         getByName("main").kotlin.srcDirs("src/main/kotlin")
         getByName("debug").kotlin.srcDirs("src/debug/kotlin")
         getByName("release").kotlin.srcDirs("src/release/kotlin")
         getByName("test").kotlin.srcDirs("src/test/kotlin")
         getByName("androidTest").kotlin.srcDirs("src/androidTest/kotlin")
     }
 
     lint {
         baseline = file("lint-baseline.xml")
         warningsAsErrors = true
         checkDependencies = false
         abortOnError = true
         checkReleaseBuilds = false
         // Story E01-S03 pins specific versions (AGP 8.6.0, targetSdk 35, etc.) per architecture
         // decision. Suppress advisory "newer version available" checks to avoid false failures.
         // LintError suppresses internal lint FIR crash (AGP 8.6.0 + K2 known issue on unit-test supertype resolution)
         disable += setOf("OldTargetApi", "AndroidGradlePluginVersion", "GradleDependency", "LintError")
     }
 
     testOptions {
         unitTests {
             isIncludeAndroidResources = true
             all { test: org.gradle.api.tasks.testing.Test ->
                 // Mirrors customer-app. technician-app had no wiring at all, so
                 // tools/pre-codex-smoke.sh passed -PexcludePaparazzi and it was silently ignored —
                 // the gate only appeared to pass because Paparazzi happened to initialise.
                 // Paparazzi cannot run on Windows ("Failed to init Bridge"); goldens are verified on
                 // CI Linux. See docs/patterns/paparazzi-cross-os-goldens.md.
                 // As in customer-app, "*PaparazziTest*" alone misses Paparazzi-backed classes that
                 // do not follow the naming convention. Listed explicitly rather than renamed,
                 // because a Paparazzi class name is embedded in every golden filename it owns.
                 if (project.hasProperty("excludePaparazzi")) {
                     test.filter.excludeTestsMatching("*PaparazziTest*")
                     test.filter.excludeTestsMatching("*EarningsScreenTest*")
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path customer-app/app/build.gradle.kts -TotalCount 80' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 671ms:
import groovy.json.JsonSlurper
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.io.File
import java.util.Properties

val localProperties =
    Properties().apply {
        val localPropertiesFile = rootProject.file("local.properties")
        if (localPropertiesFile.isFile) {
            localPropertiesFile.inputStream().use(::load)
        }
    }

fun localProperty(name: String): String? = localProperties.getProperty(name)?.takeIf { it.isNotBlank() }

fun googleServicesWebClientId(): String? {
    val googleServicesFile = file("google-services.json")
    if (!googleServicesFile.isFile) return null
    val root = JsonSlurper().parse(googleServicesFile) as? Map<*, *> ?: return null
    val clients = root["client"] as? List<*> ?: return null

    return clients
        .asSequence()
        .mapNotNull { it as? Map<*, *> }
        .flatMap { client ->
            ((client["oauth_client"] as? List<*>) ?: emptyList<Any?>()).asSequence()
        }.mapNotNull { it as? Map<*, *> }
        .firstOrNull { it["client_type"] == 3 }
        ?.get("client_id")
        ?.toString()
        ?.takeIf { it.isNotBlank() }
}

fun buildConfigString(value: String): String = "\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""

data class ReleaseSigning(
    val storeFile: File,
    val storePassword: String,
    val keyAlias: String,
    val keyPassword: String,
)

fun envOrLocalProperty(name: String): String? =
    System.getenv(name)?.takeIf { it.isNotBlank() }
        ?: localProperty(name)

fun releaseSigningProperty(name: String): String? =
    envOrLocalProperty("CUSTOMER_$name")
        ?: envOrLocalProperty(name)

fun resolveReleaseFile(path: String): File {
    val candidate = File(path)
    return if (candidate.isAbsolute) candidate else rootProject.file(path)
}

fun loadReleaseSigning(): ReleaseSigning? {
    val storeFilePath = releaseSigningProperty("RELEASE_STORE_FILE")
    val storePassword = releaseSigningProperty("RELEASE_STORE_PASSWORD")
    val keyAlias = releaseSigningProperty("RELEASE_KEY_ALIAS")
    val keyPassword = releaseSigningProperty("RELEASE_KEY_PASSWORD")

    if (listOf(storeFilePath, storePassword, keyAlias, keyPassword).all { it == null }) {
        return null
    }

    val storeFile =
        resolveReleaseFile(
            requireNotNull(storeFilePath) {
                "Missing RELEASE_STORE_FILE for release signing."
            },
        )
    require(storeFile.isFile) {
        "Release signing store file not found at ${storeFile.absolutePath}."
    }

    return ReleaseSigning(
        storeFile = storeFile,
        storePassword =
            requireNotNull(storePassword) {
                "Missing RELEASE_STORE_PASSWORD for release signing."

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force -Filter gradlew*; Get-ChildItem -Force -Recurse -Depth 2 -Filter gradlew* | Select-Object FullName' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 723ms:

FullName                                                        
--------                                                        
C:\Alok\Business Projects\wt-obs-keys\core-nav\gradlew          
C:\Alok\Business Projects\wt-obs-keys\core-nav\gradlew.bat      
C:\Alok\Business Projects\wt-obs-keys\customer-app\gradlew      
C:\Alok\Business Projects\wt-obs-keys\customer-app\gradlew.bat  
C:\Alok\Business Projects\wt-obs-keys\design-system\gradlew     
C:\Alok\Business Projects\wt-obs-keys\design-system\gradlew.bat 
C:\Alok\Business Projects\wt-obs-keys\technician-app\gradlew    
C:\Alok\Business Projects\wt-obs-keys\technician-app\gradlew.bat



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command ".\\gradlew.bat :app:tasks --all --quiet" in C:\Alok\Business Projects\wt-obs-keys\customer-app
2026-09-05T21:08:09.418539Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 9 seconds
Output:
Downloading https://services.gradle.org/distributions/gradle-8.11-bin.zip

Exception in thread "main" java.net.SocketException: Permission denied: getsockopt
	at java.base/sun.nio.ch.Net.pollConnect(Native Method)
	at java.base/sun.nio.ch.Net.pollConnectNow(Net.java:694)
	at java.base/sun.nio.ch.NioSocketImpl.timedFinishConnect(NioSocketImpl.java:542)
	at java.base/sun.nio.ch.NioSocketImpl.connect(NioSocketImpl.java:592)
	at java.base/java.net.SocksSocketImpl.connect(SocksSocketImpl.java:327)
	at java.base/java.net.Socket.connect(Socket.java:751)
	at java.base/sun.security.ssl.SSLSocketImpl.connect(SSLSocketImpl.java:304)
	at java.base/sun.net.NetworkClient.doConnect(NetworkClient.java:178)
	at java.base/sun.net.www.http.HttpClient.openServer(HttpClient.java:531)
	at java.base/sun.net.www.http.HttpClient.openServer(HttpClient.java:636)
	at java.base/sun.net.www.protocol.https.HttpsClient.<init>(HttpsClient.java:264)
	at java.base/sun.net.www.protocol.https.HttpsClient.New(HttpsClient.java:377)
	at java.base/sun.net.www.protocol.https.AbstractDelegateHttpsURLConnection.getNewHttpClient(AbstractDelegateHttpsURLConnection.java:193)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.plainConnect0(HttpURLConnection.java:1257)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.plainConnect(HttpURLConnection.java:1143)
	at java.base/sun.net.www.protocol.https.AbstractDelegateHttpsURLConnection.connect(AbstractDelegateHttpsURLConnection.java:179)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.getInputStream0(HttpURLConnection.java:1705)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.getInputStream(HttpURLConnection.java:1629)
	at java.base/sun.net.www.protocol.https.HttpsURLConnectionImpl.getInputStream(HttpsURLConnectionImpl.java:223)
	at org.gradle.wrapper.Install.forceFetch(SourceFile:2)
	at org.gradle.wrapper.Install$1.call(SourceFile:8)
	at org.gradle.wrapper.GradleWrapperMain.main(SourceFile:67)

 exited 1 in 9039ms:
Downloading https://services.gradle.org/distributions/gradle-8.11-bin.zip

Exception in thread "main" java.net.SocketException: Permission denied: getsockopt
	at java.base/sun.nio.ch.Net.pollConnect(Native Method)
	at java.base/sun.nio.ch.Net.pollConnectNow(Net.java:694)
	at java.base/sun.nio.ch.NioSocketImpl.timedFinishConnect(NioSocketImpl.java:542)
	at java.base/sun.nio.ch.NioSocketImpl.connect(NioSocketImpl.java:592)
	at java.base/java.net.SocksSocketImpl.connect(SocksSocketImpl.java:327)
	at java.base/java.net.Socket.connect(Socket.java:751)
	at java.base/sun.security.ssl.SSLSocketImpl.connect(SSLSocketImpl.java:304)
	at java.base/sun.net.NetworkClient.doConnect(NetworkClient.java:178)
	at java.base/sun.net.www.http.HttpClient.openServer(HttpClient.java:531)
	at java.base/sun.net.www.http.HttpClient.openServer(HttpClient.java:636)
	at java.base/sun.net.www.protocol.https.HttpsClient.<init>(HttpsClient.java:264)
	at java.base/sun.net.www.protocol.https.HttpsClient.New(HttpsClient.java:377)
	at java.base/sun.net.www.protocol.https.AbstractDelegateHttpsURLConnection.getNewHttpClient(AbstractDelegateHttpsURLConnection.java:193)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.plainConnect0(HttpURLConnection.java:1257)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.plainConnect(HttpURLConnection.java:1143)
	at java.base/sun.net.www.protocol.https.AbstractDelegateHttpsURLConnection.connect(AbstractDelegateHttpsURLConnection.java:179)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.getInputStream0(HttpURLConnection.java:1705)
	at java.base/sun.net.www.protocol.http.HttpURLConnection.getInputStream(HttpURLConnection.java:1629)
	at java.base/sun.net.www.protocol.https.HttpsURLConnectionImpl.getInputStream(HttpsURLConnectionImpl.java:223)
	at org.gradle.wrapper.Install.forceFetch(SourceFile:2)
	at org.gradle.wrapper.Install$1.call(SourceFile:8)
	at org.gradle.wrapper.GradleWrapperMain.main(SourceFile:67)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git show aab4fddc4809ea0b052cfbf648590098690158e7:customer-app/app/build.gradle.kts | Select-Object -First 120' in C:\Alok\Business Projects\wt-obs-keys
2026-09-05T21:08:13.002970Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.8 seconds
Output:
import groovy.json.JsonSlurper
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.io.File
import java.util.Properties

val localProperties =
    Properties().apply {
        val localPropertiesFile = rootProject.file("local.properties")
        if (localPropertiesFile.isFile) {
            localPropertiesFile.inputStream().use(::load)
        }
    }

fun localProperty(name: String): String? = localProperties.getProperty(name)?.takeIf { it.isNotBlank() }

fun googleServicesWebClientId(): String? {
    val googleServicesFile = file("google-services.json")
    if (!googleServicesFile.isFile) return null
    val root = JsonSlurper().parse(googleServicesFile) as? Map<*, *> ?: return null
    val clients = root["client"] as? List<*> ?: return null

    return clients
        .asSequence()
        .mapNotNull { it as? Map<*, *> }
        .flatMap { client ->
            ((client["oauth_client"] as? List<*>) ?: emptyList<Any?>()).asSequence()
        }.mapNotNull { it as? Map<*, *> }
        .firstOrNull { it["client_type"] == 3 }
        ?.get("client_id")
        ?.toString()
        ?.takeIf { it.isNotBlank() }
}

fun buildConfigString(value: String): String = "\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""

data class ReleaseSigning(
    val storeFile: File,
    val storePassword: String,
    val keyAlias: String,
    val keyPassword: String,
)

fun envOrLocalProperty(name: String): String? =
    System.getenv(name)?.takeIf { it.isNotBlank() }
        ?: localProperty(name)

fun releaseSigningProperty(name: String): String? =
    envOrLocalProperty("CUSTOMER_$name")
        ?: envOrLocalProperty(name)

fun resolveReleaseFile(path: String): File {
    val candidate = File(path)
    return if (candidate.isAbsolute) candidate else rootProject.file(path)
}

fun loadReleaseSigning(): ReleaseSigning? {
    val storeFilePath = releaseSigningProperty("RELEASE_STORE_FILE")
    val storePassword = releaseSigningProperty("RELEASE_STORE_PASSWORD")
    val keyAlias = releaseSigningProperty("RELEASE_KEY_ALIAS")
    val keyPassword = releaseSigningProperty("RELEASE_KEY_PASSWORD")

    if (listOf(storeFilePath, storePassword, keyAlias, keyPassword).all { it == null }) {
        return null
    }

    val storeFile =
        resolveReleaseFile(
            requireNotNull(storeFilePath) {
                "Missing RELEASE_STORE_FILE for release signing."
            },
        )
    require(storeFile.isFile) {
        "Release signing store file not found at ${storeFile.absolutePath}."
    }

    return ReleaseSigning(
        storeFile = storeFile,
        storePassword =
            requireNotNull(storePassword) {
                "Missing RELEASE_STORE_PASSWORD for release signing."
            },
        keyAlias =
            requireNotNull(keyAlias) {
                "Missing RELEASE_KEY_ALIAS for release signing."
            },
        keyPassword =
            requireNotNull(keyPassword) {
                "Missing RELEASE_KEY_PASSWORD for release signing."
            },
    )
}

val googleWebClientId =
    System.getenv("GOOGLE_WEB_CLIENT_ID")?.takeIf { it.isNotBlank() }
        ?: localProperty("GOOGLE_WEB_CLIENT_ID")
        ?: googleServicesWebClientId()
        ?: ""

val mapsApiKey =
    System.getenv("MAPS_API_KEY")?.takeIf { it.isNotBlank() }
        ?: localProperty("MAPS_API_KEY")
        ?: ""

val releaseSigning = loadReleaseSigning()

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ktlint)
    alias(libs.plugins.detekt)
    alias(libs.plugins.paparazzi)
    alias(libs.plugins.kover)
    alias(libs.plugins.android.junit5)
    alias(libs.plugins.google.services)
    alias(libs.plugins.kotlin.serialization)
}


 exited 1 in 791ms:
import groovy.json.JsonSlurper
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.io.File
import java.util.Properties

val localProperties =
    Properties().apply {
        val localPropertiesFile = rootProject.file("local.properties")
        if (localPropertiesFile.isFile) {
            localPropertiesFile.inputStream().use(::load)
        }
    }

fun localProperty(name: String): String? = localProperties.getProperty(name)?.takeIf { it.isNotBlank() }

fun googleServicesWebClientId(): String? {
    val googleServicesFile = file("google-services.json")
    if (!googleServicesFile.isFile) return null
    val root = JsonSlurper().parse(googleServicesFile) as? Map<*, *> ?: return null
    val clients = root["client"] as? List<*> ?: return null

    return clients
        .asSequence()
        .mapNotNull { it as? Map<*, *> }
        .flatMap { client ->
            ((client["oauth_client"] as? List<*>) ?: emptyList<Any?>()).asSequence()
        }.mapNotNull { it as? Map<*, *> }
        .firstOrNull { it["client_type"] == 3 }
        ?.get("client_id")
        ?.toString()
        ?.takeIf { it.isNotBlank() }
}

fun buildConfigString(value: String): String = "\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""

data class ReleaseSigning(
    val storeFile: File,
    val storePassword: String,
    val keyAlias: String,
    val keyPassword: String,
)

fun envOrLocalProperty(name: String): String? =
    System.getenv(name)?.takeIf { it.isNotBlank() }
        ?: localProperty(name)

fun releaseSigningProperty(name: String): String? =
    envOrLocalProperty("CUSTOMER_$name")
        ?: envOrLocalProperty(name)

fun resolveReleaseFile(path: String): File {
    val candidate = File(path)
    return if (candidate.isAbsolute) candidate else rootProject.file(path)
}

fun loadReleaseSigning(): ReleaseSigning? {
    val storeFilePath = releaseSigningProperty("RELEASE_STORE_FILE")
    val storePassword = releaseSigningProperty("RELEASE_STORE_PASSWORD")
    val keyAlias = releaseSigningProperty("RELEASE_KEY_ALIAS")
    val keyPassword = releaseSigningProperty("RELEASE_KEY_PASSWORD")

    if (listOf(storeFilePath, storePassword, keyAlias, keyPassword).all { it == null }) {
        return null
    }

    val storeFile =
        resolveReleaseFile(
            requireNotNull(storeFilePath) {
                "Missing RELEASE_STORE_FILE for release signing."
            },
        )
    require(storeFile.isFile) {
        "Release signing store file not found at ${storeFile.absolutePath}."
    }

    return ReleaseSigning(
        storeFile = storeFile,
        storePassword =
            requireNotNull(storePassword) {
                "Missing RELEASE_STORE_PASSWORD for release signing."
            },
        keyAlias =
            requireNotNull(keyAlias) {
                "Missing RELEASE_KEY_ALIAS for release signing."
            },
        keyPassword =
            requireNotNull(keyPassword) {
                "Missing RELEASE_KEY_PASSWORD for release signing."
            },
    )
}

val googleWebClientId =
    System.getenv("GOOGLE_WEB_CLIENT_ID")?.takeIf { it.isNotBlank() }
        ?: localProperty("GOOGLE_WEB_CLIENT_ID")
        ?: googleServicesWebClientId()
        ?: ""

val mapsApiKey =
    System.getenv("MAPS_API_KEY")?.takeIf { it.isNotBlank() }
        ?: localProperty("MAPS_API_KEY")
        ?: ""

val releaseSigning = loadReleaseSigning()

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ktlint)
    alias(libs.plugins.detekt)
    alias(libs.plugins.paparazzi)
    alias(libs.plugins.kover)
    alias(libs.plugins.android.junit5)
    alias(libs.plugins.google.services)
    alias(libs.plugins.kotlin.serialization)
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "bundleRelease|assembleRelease|publish.*Release|Release" -n .github tools docs customer-app technician-app -g "*.yml" -g "*.yaml" -g "*.sh" -g "*.md" -g "*.kts"' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 778ms:
technician-app\README.md:12:## Release
customer-app\README.md:12:## Release
customer-app\app\build.gradle.kts:36:data class ReleaseSigning(
customer-app\app\build.gradle.kts:51:fun resolveReleaseFile(path: String): File {
customer-app\app\build.gradle.kts:56:fun loadReleaseSigning(): ReleaseSigning? {
customer-app\app\build.gradle.kts:67:        resolveReleaseFile(
customer-app\app\build.gradle.kts:73:        "Release signing store file not found at ${storeFile.absolutePath}."
customer-app\app\build.gradle.kts:76:    return ReleaseSigning(
customer-app\app\build.gradle.kts:113:// verifyReleaseObservabilityKeys (below) now fails a release build that would repeat it.
customer-app\app\build.gradle.kts:119:val releaseSigning = loadReleaseSigning()
customer-app\app\build.gradle.kts:122:// Release gate: a blank observability key must never reach Play again.
customer-app\app\build.gradle.kts:138:val blankReleaseObservabilityKeys =
customer-app\app\build.gradle.kts:150:val verifyReleaseObservabilityKeys =
customer-app\app\build.gradle.kts:151:    tasks.register("verifyReleaseObservabilityKeys") {
customer-app\app\build.gradle.kts:155:        val missing = blankReleaseObservabilityKeys
customer-app\app\build.gradle.kts:161:                    appendLine("Release build would bake in blank keys: ${missing.joinToString(", ")}.")
customer-app\app\build.gradle.kts:174:tasks.matching { it.name == "assembleRelease" || it.name == "bundleRelease" }.configureEach {
customer-app\app\build.gradle.kts:175:    dependsOn(verifyReleaseObservabilityKeys)
customer-app\app\build.gradle.kts:306:        checkReleaseBuilds = false
.github\workflows\technician-ship.yml:79:        run: ./gradlew assembleRelease
.github\workflows\technician-ship.yml:82:        run: ./gradlew bundleRelease
.github\workflows\design-system-ship.yml:73:        run: ./gradlew assembleRelease
.github\workflows\customer-ship.yml:99:        run: ./gradlew assembleRelease
docs\prd.md:684:- **Release cadence:** MVP = single big-bang launch; Phase 2+ = 2-week sprint releases.
docs\play-store-release.md:1:# Play Store Release Runbook
docs\play-store-release.md:123:## 5. Upload And Release
docs\runbook.md:635:release built without them looks completely healthy while reporting nothing. `bundleRelease` and
docs\runbook.md:636:`assembleRelease` therefore run `verifyReleaseObservabilityKeys` first and fail if any is blank.
docs\runbook.md:1176:   - Open [Play Console](https://play.google.com/console) → the affected app → Release → Production → find the staged rollout → **Halt rollout**.
docs\runbook.md:1195:5. **Release via Play Console:**
docs\launch-readiness.md:232:### 5d. Release signing
technician-app\app\build.gradle.kts:36:data class ReleaseSigning(
technician-app\app\build.gradle.kts:51:fun resolveReleaseFile(path: String): File {
technician-app\app\build.gradle.kts:56:fun loadReleaseSigning(): ReleaseSigning? {
technician-app\app\build.gradle.kts:67:        resolveReleaseFile(
technician-app\app\build.gradle.kts:73:        "Release signing store file not found at ${storeFile.absolutePath}."
technician-app\app\build.gradle.kts:76:    return ReleaseSigning(
technician-app\app\build.gradle.kts:113:// verifyReleaseObservabilityKeys (below) now fails a release build that would repeat it.
technician-app\app\build.gradle.kts:119:val releaseSigning = loadReleaseSigning()
technician-app\app\build.gradle.kts:122:// Release gate: a blank observability key must never reach Play again.
technician-app\app\build.gradle.kts:138:val blankReleaseObservabilityKeys =
technician-app\app\build.gradle.kts:150:val verifyReleaseObservabilityKeys =
technician-app\app\build.gradle.kts:151:    tasks.register("verifyReleaseObservabilityKeys") {
technician-app\app\build.gradle.kts:155:        val missing = blankReleaseObservabilityKeys
technician-app\app\build.gradle.kts:161:                    appendLine("Release build would bake in blank keys: ${missing.joinToString(", ")}.")
technician-app\app\build.gradle.kts:174:tasks.matching { it.name == "assembleRelease" || it.name == "bundleRelease" }.configureEach {
technician-app\app\build.gradle.kts:175:    dependsOn(verifyReleaseObservabilityKeys)
technician-app\app\build.gradle.kts:311:        checkReleaseBuilds = false
technician-app\app\build.gradle.kts:863:    // :app:uploadSentryProguardMappingsRelease with:
technician-app\app\build.gradle.kts:879:    // assembleRelease by includeProguardMapping (default true), so the build still fails on
docs\reviews\audit-techapp-master-20260521-0738.md:153:### E20-S16 — Release pipeline + Play Console preflight
docs\reviews\audit-techapp-master-20260521-0738.md:157:- **Lane7-H4** Add `bundleRelease` step + `actions/upload-artifact` for signed AAB
docs\reviews\audit-techapp-master-20260521-0738.md:289:| Build, Release & Play Console | 3 | 6 | 9 | 4 | 22 |
docs\reviews\codex-20260418-2031-e01-s03-round3.md:364:-        run: ./gradlew lintRelease
docs\reviews\codex-20260418-2031-e01-s03-round3.md:373:-        run: ./gradlew assembleRelease
docs\reviews\codex-20260418-2031-e01-s03-round3.md:540:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2031-e01-s03-round3.md:686:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2031-e01-s03-round3.md:2037:+- **And** Android Lint runs against `lintDebug` (not `lintRelease` — release signing is out of scope) with `warningsAsErrors = true` and `checkDependencies = false`
docs\reviews\codex-20260418-2031-e01-s03-round3.md:2568:+**AC-4 (Detekt + ktlint + Android Lint) — fix Lint task to `lintDebug`, not `lintRelease`.**
docs\reviews\codex-20260418-2031-e01-s03-round3.md:2569:+The baseline ship.yml runs `./gradlew lintRelease` but release variants need a signing config, a ProGuard ruleset, and a keystore — none of which this story creates (AC-11 is explicit: no signing, no keystore, no release wiring). `lintRelease` would fail with "Release signing config not found" before Lint even runs. Change the story task + both CI workflows to invoke `lintDebug` consistently. AC-4 wording already says `lintDebug` — the baseline ship.yml is the stale one; the fix lands in T7.2.
docs\reviews\codex-20260418-2031-e01-s03-round3.md:2574:+**AC-8 (CI workflows) — replace `assembleRelease` + `lintRelease` + the naive marker check** as captured in §3 disaster fixes A1 + A2 + A5. AC-8 wording already correctly says `assembleDebug` — the fix is in the workflow file, not the AC text.
docs\reviews\codex-20260418-2031-e01-s03-round3.md:2587:+| A1 | Baseline `ship.yml` runs `./gradlew lintRelease` — release lint needs signing + R8 config; this skeleton creates neither | Change every CI Lint invocation to `./gradlew lintDebug`. Story AC-4 already says this; the ship.yml is the stale source. | **T7.2** (both workflows) |
docs\reviews\codex-20260418-2031-e01-s03-round3.md:2588:+| A2 | Baseline `ship.yml` runs `./gradlew assembleRelease` — release APK assembly requires signing config + keystore | Change to `./gradlew assembleDebug`. Note in PR description that release assembly + signing + R8 land in a dedicated deploy story. | **T7.2** |
docs\reviews\codex-20260418-2031-e01-s03-round3.md:2689:+- Release signing config, keystore, ProGuard/R8 rules, Play Store wiring — dedicated deploy story.
docs\reviews\codex-20260418-2031-e01-s03-round3.md:3324:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2031-e01-s03-round3.md:3439:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2031-e01-s03-round3.md:4489:+- `lintDebug` + `assembleDebug` (was `lintRelease` + `assembleRelease`) (A1 + A2) — no signing required
docs\reviews\codex-20260418-2031-e01-s03-round3.md:5055:-        run: ./gradlew lintRelease
docs\reviews\codex-20260418-2031-e01-s03-round3.md:5064:-        run: ./gradlew assembleRelease
docs\reviews\codex-20260418-2031-e01-s03-round3.md:5231:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2031-e01-s03-round3.md:5377:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2031-e01-s03-round3.md:6808:        checkReleaseBuilds = false
docs\reviews\codex-20260418-2031-e01-s03-round3.md:7031:        checkReleaseBuilds = false
docs\reviews\codex-20260418-2020-e01-s03-round2.md:364:-        run: ./gradlew lintRelease
docs\reviews\codex-20260418-2020-e01-s03-round2.md:373:-        run: ./gradlew assembleRelease
docs\reviews\codex-20260418-2020-e01-s03-round2.md:540:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2020-e01-s03-round2.md:684:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2020-e01-s03-round2.md:2033:+- **And** Android Lint runs against `lintDebug` (not `lintRelease` — release signing is out of scope) with `warningsAsErrors = true` and `checkDependencies = false`
docs\reviews\codex-20260418-2020-e01-s03-round2.md:2564:+**AC-4 (Detekt + ktlint + Android Lint) — fix Lint task to `lintDebug`, not `lintRelease`.**
docs\reviews\codex-20260418-2020-e01-s03-round2.md:2565:+The baseline ship.yml runs `./gradlew lintRelease` but release variants need a signing config, a ProGuard ruleset, and a keystore — none of which this story creates (AC-11 is explicit: no signing, no keystore, no release wiring). `lintRelease` would fail with "Release signing config not found" before Lint even runs. Change the story task + both CI workflows to invoke `lintDebug` consistently. AC-4 wording already says `lintDebug` — the baseline ship.yml is the stale one; the fix lands in T7.2.
docs\reviews\codex-20260418-2020-e01-s03-round2.md:2570:+**AC-8 (CI workflows) — replace `assembleRelease` + `lintRelease` + the naive marker check** as captured in §3 disaster fixes A1 + A2 + A5. AC-8 wording already correctly says `assembleDebug` — the fix is in the workflow file, not the AC text.
docs\reviews\codex-20260418-2020-e01-s03-round2.md:2583:+| A1 | Baseline `ship.yml` runs `./gradlew lintRelease` — release lint needs signing + R8 config; this skeleton creates neither | Change every CI Lint invocation to `./gradlew lintDebug`. Story AC-4 already says this; the ship.yml is the stale source. | **T7.2** (both workflows) |
docs\reviews\codex-20260418-2020-e01-s03-round2.md:2584:+| A2 | Baseline `ship.yml` runs `./gradlew assembleRelease` — release APK assembly requires signing config + keystore | Change to `./gradlew assembleDebug`. Note in PR description that release assembly + signing + R8 land in a dedicated deploy story. | **T7.2** |
docs\reviews\codex-20260418-2020-e01-s03-round2.md:2685:+- Release signing config, keystore, ProGuard/R8 rules, Play Store wiring — dedicated deploy story.
docs\reviews\codex-20260418-2020-e01-s03-round2.md:3320:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2020-e01-s03-round2.md:3435:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2020-e01-s03-round2.md:4485:+- `lintDebug` + `assembleDebug` (was `lintRelease` + `assembleRelease`) (A1 + A2) — no signing required
docs\reviews\codex-20260418-2020-e01-s03-round2.md:5051:-        run: ./gradlew lintRelease
docs\reviews\codex-20260418-2020-e01-s03-round2.md:5060:-        run: ./gradlew assembleRelease
docs\reviews\codex-20260418-2020-e01-s03-round2.md:5227:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2020-e01-s03-round2.md:5371:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2020-e01-s03-round2.md:6849:        checkReleaseBuilds = false
docs\reviews\codex-20260418-2013-e01-s03.md:364:-        run: ./gradlew lintRelease
docs\reviews\codex-20260418-2013-e01-s03.md:373:-        run: ./gradlew assembleRelease
docs\reviews\codex-20260418-2013-e01-s03.md:540:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2013-e01-s03.md:684:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2013-e01-s03.md:2036:+- **And** Android Lint runs against `lintDebug` (not `lintRelease` — release signing is out of scope) with `warningsAsErrors = true` and `checkDependencies = false`
docs\reviews\codex-20260418-2013-e01-s03.md:2567:+**AC-4 (Detekt + ktlint + Android Lint) — fix Lint task to `lintDebug`, not `lintRelease`.**
docs\reviews\codex-20260418-2013-e01-s03.md:2568:+The baseline ship.yml runs `./gradlew lintRelease` but release variants need a signing config, a ProGuard ruleset, and a keystore — none of which this story creates (AC-11 is explicit: no signing, no keystore, no release wiring). `lintRelease` would fail with "Release signing config not found" before Lint even runs. Change the story task + both CI workflows to invoke `lintDebug` consistently. AC-4 wording already says `lintDebug` — the baseline ship.yml is the stale one; the fix lands in T7.2.
docs\reviews\codex-20260418-2013-e01-s03.md:2573:+**AC-8 (CI workflows) — replace `assembleRelease` + `lintRelease` + the naive marker check** as captured in §3 disaster fixes A1 + A2 + A5. AC-8 wording already correctly says `assembleDebug` — the fix is in the workflow file, not the AC text.
docs\reviews\codex-20260418-2013-e01-s03.md:2586:+| A1 | Baseline `ship.yml` runs `./gradlew lintRelease` — release lint needs signing + R8 config; this skeleton creates neither | Change every CI Lint invocation to `./gradlew lintDebug`. Story AC-4 already says this; the ship.yml is the stale source. | **T7.2** (both workflows) |
docs\reviews\codex-20260418-2013-e01-s03.md:2587:+| A2 | Baseline `ship.yml` runs `./gradlew assembleRelease` — release APK assembly requires signing config + keystore | Change to `./gradlew assembleDebug`. Note in PR description that release assembly + signing + R8 land in a dedicated deploy story. | **T7.2** |
docs\reviews\codex-20260418-2013-e01-s03.md:2688:+- Release signing config, keystore, ProGuard/R8 rules, Play Store wiring — dedicated deploy story.
docs\reviews\codex-20260418-2013-e01-s03.md:3323:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2013-e01-s03.md:3438:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2013-e01-s03.md:4488:+- `lintDebug` + `assembleDebug` (was `lintRelease` + `assembleRelease`) (A1 + A2) — no signing required
docs\reviews\codex-20260418-2013-e01-s03.md:5054:-        run: ./gradlew lintRelease
docs\reviews\codex-20260418-2013-e01-s03.md:5063:-        run: ./gradlew assembleRelease
docs\reviews\codex-20260418-2013-e01-s03.md:5230:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2013-e01-s03.md:5374:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2013-e01-s03.md:6802:        checkReleaseBuilds = false
docs\reviews\codex-20260418-2013-e01-s03.md:7037:        checkReleaseBuilds = false
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:374:-        run: ./gradlew lintRelease
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:383:-        run: ./gradlew assembleRelease
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:550:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:696:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:2058:+- **And** Android Lint runs against `lintDebug` (not `lintRelease` — release signing is out of scope) with `warningsAsErrors = true` and `checkDependencies = false`
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:2589:+**AC-4 (Detekt + ktlint + Android Lint) — fix Lint task to `lintDebug`, not `lintRelease`.**
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:2590:+The baseline ship.yml runs `./gradlew lintRelease` but release variants need a signing config, a ProGuard ruleset, and a keystore — none of which this story creates (AC-11 is explicit: no signing, no keystore, no release wiring). `lintRelease` would fail with "Release signing config not found" before Lint even runs. Change the story task + both CI workflows to invoke `lintDebug` consistently. AC-4 wording already says `lintDebug` — the baseline ship.yml is the stale one; the fix lands in T7.2.
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:2595:+**AC-8 (CI workflows) — replace `assembleRelease` + `lintRelease` + the naive marker check** as captured in §3 disaster fixes A1 + A2 + A5. AC-8 wording already correctly says `assembleDebug` — the fix is in the workflow file, not the AC text.
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:2608:+| A1 | Baseline `ship.yml` runs `./gradlew lintRelease` — release lint needs signing + R8 config; this skeleton creates neither | Change every CI Lint invocation to `./gradlew lintDebug`. Story AC-4 already says this; the ship.yml is the stale source. | **T7.2** (both workflows) |
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:2609:+| A2 | Baseline `ship.yml` runs `./gradlew assembleRelease` — release APK assembly requires signing config + keystore | Change to `./gradlew assembleDebug`. Note in PR description that release assembly + signing + R8 land in a dedicated deploy story. | **T7.2** |
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:2710:+- Release signing config, keystore, ProGuard/R8 rules, Play Store wiring — dedicated deploy story.
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:3345:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:3460:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:4510:+- `lintDebug` + `assembleDebug` (was `lintRelease` + `assembleRelease`) (A1 + A2) — no signing required
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:5078:-        run: ./gradlew lintRelease
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:5087:-        run: ./gradlew assembleRelease
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:5254:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:5400:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:6928:        checkReleaseBuilds = false
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:7150:        checkReleaseBuilds = false
docs\reviews\codex-20260418-2115-e01-s03-round8-final.md:7902:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2050-e01-s03-round5.md:366:-        run: ./gradlew lintRelease
docs\reviews\codex-20260418-2050-e01-s03-round5.md:375:-        run: ./gradlew assembleRelease
docs\reviews\codex-20260418-2050-e01-s03-round5.md:542:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2050-e01-s03-round5.md:688:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2050-e01-s03-round5.md:2042:+- **And** Android Lint runs against `lintDebug` (not `lintRelease` — release signing is out of scope) with `warningsAsErrors = true` and `checkDependencies = false`
docs\reviews\codex-20260418-2050-e01-s03-round5.md:2573:+**AC-4 (Detekt + ktlint + Android Lint) — fix Lint task to `lintDebug`, not `lintRelease`.**
docs\reviews\codex-20260418-2050-e01-s03-round5.md:2574:+The baseline ship.yml runs `./gradlew lintRelease` but release variants need a signing config, a ProGuard ruleset, and a keystore — none of which this story creates (AC-11 is explicit: no signing, no keystore, no release wiring). `lintRelease` would fail with "Release signing config not found" before Lint even runs. Change the story task + both CI workflows to invoke `lintDebug` consistently. AC-4 wording already says `lintDebug` — the baseline ship.yml is the stale one; the fix lands in T7.2.
docs\reviews\codex-20260418-2050-e01-s03-round5.md:2579:+**AC-8 (CI workflows) — replace `assembleRelease` + `lintRelease` + the naive marker check** as captured in §3 disaster fixes A1 + A2 + A5. AC-8 wording already correctly says `assembleDebug` — the fix is in the workflow file, not the AC text.
docs\reviews\codex-20260418-2050-e01-s03-round5.md:2592:+| A1 | Baseline `ship.yml` runs `./gradlew lintRelease` — release lint needs signing + R8 config; this skeleton creates neither | Change every CI Lint invocation to `./gradlew lintDebug`. Story AC-4 already says this; the ship.yml is the stale source. | **T7.2** (both workflows) |
docs\reviews\codex-20260418-2050-e01-s03-round5.md:2593:+| A2 | Baseline `ship.yml` runs `./gradlew assembleRelease` — release APK assembly requires signing config + keystore | Change to `./gradlew assembleDebug`. Note in PR description that release assembly + signing + R8 land in a dedicated deploy story. | **T7.2** |
docs\reviews\codex-20260418-2050-e01-s03-round5.md:2694:+- Release signing config, keystore, ProGuard/R8 rules, Play Store wiring — dedicated deploy story.
docs\reviews\codex-20260418-2050-e01-s03-round5.md:3329:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2050-e01-s03-round5.md:3444:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2050-e01-s03-round5.md:4494:+- `lintDebug` + `assembleDebug` (was `lintRelease` + `assembleRelease`) (A1 + A2) — no signing required
docs\reviews\codex-20260418-2050-e01-s03-round5.md:5062:-        run: ./gradlew lintRelease
docs\reviews\codex-20260418-2050-e01-s03-round5.md:5071:-        run: ./gradlew assembleRelease
docs\reviews\codex-20260418-2050-e01-s03-round5.md:5238:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2050-e01-s03-round5.md:5384:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2050-e01-s03-round5.md:6814:        checkReleaseBuilds = false
docs\reviews\codex-20260418-2050-e01-s03-round5.md:7037:        checkReleaseBuilds = false
docs\reviews\codex-20260418-2050-e01-s03-round5.md:8692:- **And** Android Lint runs against `lintDebug` (not `lintRelease` â€” release signing is out of scope) with `warningsAsErrors = true` and `checkDependencies = false`
docs\reviews\codex-20260418-2106-e01-s03-round7.md:374:-        run: ./gradlew lintRelease
docs\reviews\codex-20260418-2106-e01-s03-round7.md:383:-        run: ./gradlew assembleRelease
docs\reviews\codex-20260418-2106-e01-s03-round7.md:550:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2106-e01-s03-round7.md:696:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2106-e01-s03-round7.md:2054:+- **And** Android Lint runs against `lintDebug` (not `lintRelease` — release signing is out of scope) with `warningsAsErrors = true` and `checkDependencies = false`
docs\reviews\codex-20260418-2106-e01-s03-round7.md:2585:+**AC-4 (Detekt + ktlint + Android Lint) — fix Lint task to `lintDebug`, not `lintRelease`.**
docs\reviews\codex-20260418-2106-e01-s03-round7.md:2586:+The baseline ship.yml runs `./gradlew lintRelease` but release variants need a signing config, a ProGuard ruleset, and a keystore — none of which this story creates (AC-11 is explicit: no signing, no keystore, no release wiring). `lintRelease` would fail with "Release signing config not found" before Lint even runs. Change the story task + both CI workflows to invoke `lintDebug` consistently. AC-4 wording already says `lintDebug` — the baseline ship.yml is the stale one; the fix lands in T7.2.
docs\reviews\codex-20260418-2106-e01-s03-round7.md:2591:+**AC-8 (CI workflows) — replace `assembleRelease` + `lintRelease` + the naive marker check** as captured in §3 disaster fixes A1 + A2 + A5. AC-8 wording already correctly says `assembleDebug` — the fix is in the workflow file, not the AC text.
docs\reviews\codex-20260418-2106-e01-s03-round7.md:2604:+| A1 | Baseline `ship.yml` runs `./gradlew lintRelease` — release lint needs signing + R8 config; this skeleton creates neither | Change every CI Lint invocation to `./gradlew lintDebug`. Story AC-4 already says this; the ship.yml is the stale source. | **T7.2** (both workflows) |
docs\reviews\codex-20260418-2106-e01-s03-round7.md:2605:+| A2 | Baseline `ship.yml` runs `./gradlew assembleRelease` — release APK assembly requires signing config + keystore | Change to `./gradlew assembleDebug`. Note in PR description that release assembly + signing + R8 land in a dedicated deploy story. | **T7.2** |
docs\reviews\codex-20260418-2106-e01-s03-round7.md:2706:+- Release signing config, keystore, ProGuard/R8 rules, Play Store wiring — dedicated deploy story.
docs\reviews\codex-20260418-2106-e01-s03-round7.md:3341:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2106-e01-s03-round7.md:3456:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2106-e01-s03-round7.md:4506:+- `lintDebug` + `assembleDebug` (was `lintRelease` + `assembleRelease`) (A1 + A2) — no signing required
docs\reviews\codex-20260418-2106-e01-s03-round7.md:5074:-        run: ./gradlew lintRelease
docs\reviews\codex-20260418-2106-e01-s03-round7.md:5083:-        run: ./gradlew assembleRelease
docs\reviews\codex-20260418-2106-e01-s03-round7.md:5250:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2106-e01-s03-round7.md:5396:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2106-e01-s03-round7.md:6832:        checkReleaseBuilds = false
docs\reviews\codex-20260418-2106-e01-s03-round7.md:7054:        checkReleaseBuilds = false
docs\reviews\codex-20260418-2106-e01-s03-round7.md:8020:- **And** Android Lint runs against `lintDebug` (not `lintRelease` â€” release signing is out of scope) with `warningsAsErrors = true` and `checkDependencies = false`
docs\reviews\codex-20260418-2043-e01-s03-round4.md:366:-        run: ./gradlew lintRelease
docs\reviews\codex-20260418-2043-e01-s03-round4.md:375:-        run: ./gradlew assembleRelease
docs\reviews\codex-20260418-2043-e01-s03-round4.md:542:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2043-e01-s03-round4.md:688:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2043-e01-s03-round4.md:2042:+- **And** Android Lint runs against `lintDebug` (not `lintRelease` — release signing is out of scope) wi2026-09-05T23:54:42.285013Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 10828.8 seconds
Output:
Starting a Gradle Daemon (subsequent builds will be faster)
Calculating task graph as no cached configuration is available for tasks: :app:tasks --all
Configuration cache entry stored.

FAILURE: Build failed with an exception.

* What went wrong:
org.gradle.api.internal.catalog.GeneratedClassCompilationException: Unable to compile generated classes
> Unable to compile generated classes

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.

BUILD FAILED in 22s

 exited 1 in 10828800ms:
Starting a Gradle Daemon (subsequent builds will be faster)
Calculating task graph as no cached configuration is available for tasks: :app:tasks --all
Configuration cache entry stored.

FAILURE: Build failed with an exception.

* What went wrong:
org.gradle.api.internal.catalog.GeneratedClassCompilationException: Unable to compile generated classes
> Unable to compile generated classes

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.

BUILD FAILED in 22s

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '& "$env:USERPROFILE'"\\.gradle\\wrapper\\dists\\gradle-8.11-bin\\c4te04g51qsyw1bxcb929u7br\\gradle-8.11\\bin\\gradle.bat\" :app:tasks --all --stacktrace" in C:\Alok\Business Projects\wt-obs-keys\customer-app
2026-09-05T23:54:46.702226Z ERROR codex_core::exec: exec error: windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)
2026-09-05T23:54:46.702422Z ERROR codex_core::tools::router: error=execution error: Io(Custom { kind: Other, error: "windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)" })
 exited -1 in 0ms:
execution error: Io(Custom { kind: Other, error: "windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)" })
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '& "$env:USERPROFILE'"\\.gradle\\wrapper\\dists\\gradle-8.11-bin\\c4te04g51qsyw1bxcb929u7br\\gradle-8.11\\bin\\gradle.bat\" :app:tasks --all --no-daemon --stacktrace" in C:\Alok\Business Projects\wt-obs-keys\customer-app
2026-09-05T23:54:50.997090Z ERROR codex_core::exec: exec error: windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)
2026-09-05T23:54:50.997302Z ERROR codex_core::tools::router: error=execution error: Io(Custom { kind: Other, error: "windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)" })
 exited -1 in 0ms:
execution error: Io(Custom { kind: Other, error: "windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)" })
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --check aab4fddc4809ea0b052cfbf648590098690158e7' in C:\Alok\Business Projects\wt-obs-keys
2026-09-05T23:54:59.065516Z ERROR codex_core::exec: exec error: windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)
2026-09-05T23:54:59.065852Z ERROR codex_core::tools::router: error=execution error: Io(Custom { kind: Other, error: "windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)" })
 exited -1 in 0ms:
execution error: Io(Custom { kind: Other, error: "windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)" })
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --check aab4fddc4809ea0b052cfbf648590098690158e7' in C:\Alok\Business Projects\wt-obs-keys
2026-09-05T23:55:03.100131Z ERROR codex_core::exec: exec error: windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)
2026-09-05T23:55:03.100319Z ERROR codex_core::tools::router: error=execution error: Io(Custom { kind: Other, error: "windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)" })
 exited -1 in 0ms:
execution error: Io(Custom { kind: Other, error: "windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)" })
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'echo hi' in C:\Alok\Business Projects\wt-obs-keys
2026-09-05T23:55:06.064636Z ERROR codex_core::exec: exec error: windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)
2026-09-05T23:55:06.064804Z ERROR codex_core::tools::router: error=execution error: Io(Custom { kind: Other, error: "windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)" })
 exited -1 in 0ms:
execution error: Io(Custom { kind: Other, error: "windows sandbox: orchestrator_helper_exit_nonzero: setup helper exited with status Some(-1073741502)" })
codex
No actionable regressions were found in the changed Gradle wiring or runbook documentation. The release guard is scoped to release assemble/bundle tasks and the BuildConfig values are consistently resolved from environment/local properties.
No actionable regressions were found in the changed Gradle wiring or runbook documentation. The release guard is scoped to release assemble/bundle tasks and the BuildConfig values are consistently resolved from environment/local properties.
 + A2) — no signing required
docs\reviews\codex-20260418-2059-e01-s03-round6.md:5074:-        run: ./gradlew lintRelease
docs\reviews\codex-20260418-2059-e01-s03-round6.md:5083:-        run: ./gradlew assembleRelease
docs\reviews\codex-20260418-2059-e01-s03-round6.md:5250:+        checkReleaseBuilds = false
docs\reviews\codex-20260418-2059-e01-s03-round6.md:5396:+# Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-20260418-2059-e01-s03-round6.md:6832:        checkReleaseBuilds = false
docs\reviews\codex-20260418-2059-e01-s03-round6.md:7055:        checkReleaseBuilds = false
docs\superpowers\specs\2026-04-18-e01-s04-design-system-design.md:63:| B4 | Composite build substitution requires BOTH `group = "com.homeservices"` in `design-system/build.gradle.kts` AND `rootProject.name = "design-system"` in `design-system/settings.gradle.kts`; missing either silently falls through to "module not found" with a confusing Gradle error | Set both explicitly in T1.1 + T1.2; add an integration check in T1.8 that runs `./gradlew :design-system:assembleRelease` from the design-system directory AND `./gradlew :app:dependencies` from `customer-app/` (after T7.1) to confirm `com.homeservices:design-system` resolves to the local build. | **T1.1, T1.2, T1.8, T7.5** |
docs\superpowers\specs\2026-04-18-e01-s04-design-system-design.md:271:- `design-system-ship.yml` — modelled verbatim on `customer-ship.yml`; `paths:` filter `['design-system/**', '.github/workflows/design-system-ship.yml', '.codex-review-passed']`; `defaults.run.working-directory: design-system`; full step list (BMAD gate, ktlintCheck, detekt, lintDebug, testDebugUnitTest, koverVerify koverXmlReport, verifyPaparazziDebug, assembleRelease, Semgrep, codex-marker ancestor-check); tools/check-shared-versions.sh as the second step
docs\superpowers\specs\2026-04-18-e01-s03-android-app-skeletons-design.md:35:**AC-4 (Detekt + ktlint + Android Lint) — fix Lint task to `lintDebug`, not `lintRelease`.**
docs\superpowers\specs\2026-04-18-e01-s03-android-app-skeletons-design.md:36:The baseline ship.yml runs `./gradlew lintRelease` but release variants need a signing config, a ProGuard ruleset, and a keystore — none of which this story creates (AC-11 is explicit: no signing, no keystore, no release wiring). `lintRelease` would fail with "Release signing config not found" before Lint even runs. Change the story task + both CI workflows to invoke `lintDebug` consistently. AC-4 wording already says `lintDebug` — the baseline ship.yml is the stale one; the fix lands in T7.2.
docs\superpowers\specs\2026-04-18-e01-s03-android-app-skeletons-design.md:41:**AC-8 (CI workflows) — replace `assembleRelease` + `lintRelease` + the naive marker check** as captured in §3 disaster fixes A1 + A2 + A5. AC-8 wording already correctly says `assembleDebug` — the fix is in the workflow file, not the AC text.
docs\superpowers\specs\2026-04-18-e01-s03-android-app-skeletons-design.md:54:| A1 | Baseline `ship.yml` runs `./gradlew lintRelease` — release lint needs signing + R8 config; this skeleton creates neither | Change every CI Lint invocation to `./gradlew lintDebug`. Story AC-4 already says this; the ship.yml is the stale source. | **T7.2** (both workflows) |
docs\superpowers\specs\2026-04-18-e01-s03-android-app-skeletons-design.md:55:| A2 | Baseline `ship.yml` runs `./gradlew assembleRelease` — release APK assembly requires signing config + keystore | Change to `./gradlew assembleDebug`. Note in PR description that release assembly + signing + R8 land in a dedicated deploy story. | **T7.2** |
docs\superpowers\specs\2026-04-18-e01-s03-android-app-skeletons-design.md:156:- Release signing config, keystore, ProGuard/R8 rules, Play Store wiring — dedicated deploy story.
docs\reviews\codex-20260425-1902-round6.md:23771:        checkReleaseBuilds = false
docs\reviews\codex-20260425-1902-round6.md:24184:        checkReleaseBuilds = false
docs\reviews\codex-20260905-obs-keys.md:97: data class ReleaseSigning(
docs\reviews\codex-20260905-obs-keys.md:112: fun resolveReleaseFile(path: String): File {
docs\reviews\codex-20260905-obs-keys.md:117: fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-20260905-obs-keys.md:128:         resolveReleaseFile(
docs\reviews\codex-20260905-obs-keys.md:134:         "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-20260905-obs-keys.md:137:     return ReleaseSigning(
docs\reviews\codex-20260905-obs-keys.md:174:+// verifyReleaseObservabilityKeys (below) now fails a release build that would repeat it.
docs\reviews\codex-20260905-obs-keys.md:180: val releaseSigning = loadReleaseSigning()
docs\reviews\codex-20260905-obs-keys.md:183:+// Release gate: a blank observability key must never reach Play again.
docs\reviews\codex-20260905-obs-keys.md:199:+val blankReleaseObservabilityKeys =
docs\reviews\codex-20260905-obs-keys.md:211:+val verifyReleaseObservabilityKeys =
docs\reviews\codex-20260905-obs-keys.md:212:+    tasks.register("verifyReleaseObservabilityKeys") {
docs\reviews\codex-20260905-obs-keys.md:216:+        val missing = blankReleaseObservabilityKeys
docs\reviews\codex-20260905-obs-keys.md:222:+                    appendLine("Release build would bake in blank keys: ${missing.joinToString(", ")}.")
docs\reviews\codex-20260905-obs-keys.md:235:+tasks.matching { it.name == "assembleRelease" || it.name == "bundleRelease" }.configureEach {
docs\reviews\codex-20260905-obs-keys.md:236:+    dependsOn(verifyReleaseObservabilityKeys)
docs\reviews\codex-20260905-obs-keys.md:370:         checkReleaseBuilds = false
docs\reviews\codex-20260905-obs-keys.md:498:+release built without them looks completely healthy while reporting nothing. `bundleRelease` and
docs\reviews\codex-20260905-obs-keys.md:499:+`assembleRelease` therefore run `verifyReleaseObservabilityKeys` first and fail if any is blank.
docs\reviews\codex-20260905-obs-keys.md:603: data class ReleaseSigning(
docs\reviews\codex-20260905-obs-keys.md:618: fun resolveReleaseFile(path: String): File {
docs\reviews\codex-20260905-obs-keys.md:623: fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-20260905-obs-keys.md:634:         resolveReleaseFile(
docs\reviews\codex-20260905-obs-keys.md:640:         "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-20260905-obs-keys.md:643:     return ReleaseSigning(
docs\reviews\codex-20260905-obs-keys.md:680:+// verifyReleaseObservabilityKeys (below) now fails a release build that would repeat it.
docs\reviews\codex-20260905-obs-keys.md:686: val releaseSigning = loadReleaseSigning()
docs\reviews\codex-20260905-obs-keys.md:689:+// Release gate: a blank observability key must never reach Play again.
docs\reviews\codex-20260905-obs-keys.md:705:+val blankReleaseObservabilityKeys =
docs\reviews\codex-20260905-obs-keys.md:717:+val verifyReleaseObservabilityKeys =
docs\reviews\codex-20260905-obs-keys.md:718:+    tasks.register("verifyReleaseObservabilityKeys") {
docs\reviews\codex-20260905-obs-keys.md:722:+        val missing = blankReleaseObservabilityKeys
docs\reviews\codex-20260905-obs-keys.md:728:+                    appendLine("Release build would bake in blank keys: ${missing.joinToString(", ")}.")
docs\reviews\codex-20260905-obs-keys.md:741:+tasks.matching { it.name == "assembleRelease" || it.name == "bundleRelease" }.configureEach {
docs\reviews\codex-20260905-obs-keys.md:742:+    dependsOn(verifyReleaseObservabilityKeys)
docs\reviews\codex-20260905-obs-keys.md:881:         checkReleaseBuilds = false
docs\reviews\codex-20260905-obs-keys.md:943:data class ReleaseSigning(
docs\reviews\codex-20260905-obs-keys.md:958:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-20260905-obs-keys.md:963:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-20260905-obs-keys.md:974:        resolveReleaseFile(
docs\reviews\codex-20260905-obs-keys.md:980:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-20260905-obs-keys.md:983:    return ReleaseSigning(
docs\reviews\codex-20260905-obs-keys.md:1104:data class ReleaseSigning(
docs\reviews\codex-20260905-obs-keys.md:1119:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-20260905-obs-keys.md:1124:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-20260905-obs-keys.md:1135:        resolveReleaseFile(
docs\reviews\codex-20260905-obs-keys.md:1141:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-20260905-obs-keys.md:1144:    return ReleaseSigning(
docs\reviews\codex-20260905-obs-keys.md:1172:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-20260905-obs-keys.md:1226:data class ReleaseSigning(
docs\reviews\codex-20260905-obs-keys.md:1241:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-20260905-obs-keys.md:1246:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-20260905-obs-keys.md:1257:        resolveReleaseFile(
docs\reviews\codex-20260905-obs-keys.md:1263:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-20260905-obs-keys.md:1266:    return ReleaseSigning(
docs\reviews\codex-20260905-obs-keys.md:1294:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-20260905-obs-keys.md:1313:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "bundleRelease|assembleRelease|publish.*Release|Release" -n .github tools docs customer-app technician-app -g "*.yml" -g "*.yaml" -g "*.sh" -g "*.md" -g "*.kts"' in C:\Alok\Business Projects\wt-obs-keys
docs\reviews\codex-20260905-0820.md:3925:  val releaseSigning = loadReleaseSigning()
docs\reviews\codex-20260905-0834-round2.md:2276:data class ReleaseSigning(
docs\reviews\codex-20260905-0834-round2.md:2291:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-20260905-0834-round2.md:2296:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-20260905-0834-round2.md:2307:        resolveReleaseFile(
docs\reviews\codex-20260905-0834-round2.md:2313:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-20260905-0834-round2.md:2316:    return ReleaseSigning(
docs\reviews\codex-20260905-0834-round2.md:2344:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-20260905-0834-round2.md:2474:        checkReleaseBuilds = false
docs\reviews\codex-20260905-0834-round2.md:6380:data class ReleaseSigning(
docs\reviews\codex-20260905-0834-round2.md:6395:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-20260905-0834-round2.md:6400:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-20260905-0834-round2.md:6411:        resolveReleaseFile(
docs\reviews\codex-20260905-0834-round2.md:6417:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-20260905-0834-round2.md:6420:    return ReleaseSigning(
docs\reviews\codex-20260905-0834-round2.md:6448:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-20260905-0834-round2.md:6578:        checkReleaseBuilds = false
docs\reviews\codex-20260905-0834-round2.md:12133:  val releaseSigning = loadReleaseSigning()
docs\reviews\codex-20260905-round5.md:11644:        checkReleaseBuilds = false
docs\reviews\codex-20260905-round7.md:3460:data class ReleaseSigning(
docs\reviews\codex-20260905-round7.md:3475:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-20260905-round7.md:3480:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-20260905-round7.md:3491:        resolveReleaseFile(
docs\reviews\codex-20260905-round7.md:3497:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-20260905-round7.md:3500:    return ReleaseSigning(
docs\reviews\codex-20260905-round7.md:3528:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-20260905-round7.md:3658:        checkReleaseBuilds = false
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:23:| **E20-S16** | Fix `app_name` → "HomeHeroo Technician"; add `workflow_dispatch` to `technician-ship.yml`; add `bundleRelease` + `upload-artifact` step; add `resConfigs("en","hi")`; add Sentry Gradle plugin for R8 mappings |
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:188:### WS-E: Release pipeline + CI (E20-S16)
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:204:Also add `bundleRelease` step + artifact upload after `assembleRelease`:
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:207:  run: ./gradlew bundleRelease
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:246:**Commit message:** `fix(tech-app): E20-S16 release pipeline — HomeHeroo app_name, bundleRelease CI, resConfigs, Sentry R8 plugin, workflow_dispatch`
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:282:- [ ] `technician-ship.yml` has `workflow_dispatch` + `bundleRelease` + artifact upload
docs\reviews\codex-E01-S02-20260418-0934-round7.md:43704:        // Release https://github.com/eslint/eslint/releases/tag/v8.57.0
docs\reviews\codex-20260905-round6.md:22934:data class ReleaseSigning(
docs\reviews\codex-20260905-round6.md:22949:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-20260905-round6.md:22954:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-20260905-round6.md:22965:        resolveReleaseFile(
docs\reviews\codex-20260905-round6.md:22971:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-20260905-round6.md:22974:    return ReleaseSigning(
docs\reviews\codex-20260905-round6.md:23002:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-20260905-round6.md:28222:+  val releaseSigning = loadReleaseSigning()
docs\reviews\codex-20260905-round6.md:30861:+data class ReleaseSigning(
docs\reviews\codex-20260905-round6.md:30876:+fun resolveReleaseFile(path: String): File {
docs\reviews\codex-20260905-round6.md:30881:+fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-20260905-round6.md:30892:+        resolveReleaseFile(
docs\reviews\codex-20260905-round6.md:30898:+        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-20260905-round6.md:30901:+    return ReleaseSigning(
docs\reviews\codex-20260905-round6.md:30929:+val releaseSigning = loadReleaseSigning()
docs\reviews\codex-20260905-round6.md:31059:+        checkReleaseBuilds = false
docs\reviews\codex-20260905-round6.md:34965:+data class ReleaseSigning(
docs\reviews\codex-20260905-round6.md:34980:+fun resolveReleaseFile(path: String): File {
docs\reviews\codex-20260905-round6.md:34985:+fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-20260905-round6.md:34996:+        resolveReleaseFile(
docs\reviews\codex-20260905-round6.md:35002:+        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-20260905-round6.md:35005:+    return ReleaseSigning(
docs\reviews\codex-20260905-round6.md:35033:+val releaseSigning = loadReleaseSigning()
docs\reviews\codex-20260905-round6.md:35163:+        checkReleaseBuilds = false
docs\reviews\codex-20260905-round6.md:40718:+  val releaseSigning = loadReleaseSigning()
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:363:- **E18-S04** `BookingSummaryScreen` `LaunchedEffect` guards `BuildConfig.RAZORPAY_KEY_ID.isBlank()`. Release build fails compile if env var missing. New `BookingUiState.PaymentFailed(orderId, amount, reason)` with retry CTA that re-opens Razorpay on the same `orderId` (Razorpay supports retry until capture).
docs\reviews\codex-E04-S02-round5-20260423-2023.md:3363:        checkReleaseBuilds = false
docs\reviews\codex-E04-S02-round4-20260423-2017.md:3339:        checkReleaseBuilds = false
docs\reviews\codex-E04-S02-20260423-2001.md:2858:        checkReleaseBuilds = false
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6073:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6074:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingPromptEventBus$Companion.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6075:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingPromptEventBus.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6076:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingPromptEventBus_Factory$InstanceHolder.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6077:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingPromptEventBus_Factory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6078:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepository.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6079:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImpl$get$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6080:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImpl$submitTechRating$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6081:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImpl.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6082:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImpl_Factory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6083:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\di\RatingModule$Companion$provideAuthOkHttpClient$$inlined$-addInterceptor$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6084:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\di\RatingModule$Companion$provideAuthOkHttpClient$1$token$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6085:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\di\RatingModule$Companion.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6086:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\di\RatingModule.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6087:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\di\RatingModule_Companion_ProvideAuthOkHttpClientFactory$InstanceHolder.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6088:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\di\RatingModule_Companion_ProvideAuthOkHttpClientFactory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6089:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\di\RatingModule_Companion_ProvideRatingApiServiceFactory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6090:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\remote\RatingApiService.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6091:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\remote\dto\GetRatingResponseDto.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6092:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\remote\dto\RatingDtosKt.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6093:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\data\rating\remote\dto\SubmitRatingRequestDto.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6094:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\domain\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6095:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\domain\rating\GetTechRatingUseCase.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6096:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\domain\rating\GetTechRatingUseCase_Factory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6097:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\domain\rating\SubmitTechRatingUseCase.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6098:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\domain\rating\SubmitTechRatingUseCase_Factory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6099:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\domain\rating\model\CustomerRating.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6100:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\domain\rating\model\RatingSnapshot$Status.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6101:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\domain\rating\model\RatingSnapshot.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6102:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\domain\rating\model\TechRating.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6103:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6104:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\ComposableSingletons$RatingScreenKt$lambda-1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6105:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\ComposableSingletons$RatingScreenKt$lambda-2$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6106:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\ComposableSingletons$RatingScreenKt.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6107:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingRoutes.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6108:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingScreenKt$RatingScreen$1$2$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6109:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingScreenKt$RatingScreen$1$3$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6110:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingScreenKt$RatingScreen$1$4$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6111:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingScreenKt$RatingScreen$1$5$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6112:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingScreenKt$RatingScreen$1$6$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6113:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingScreenKt.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6114:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingUiState$AwaitingPartner.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6115:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingUiState$Editing.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6116:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingUiState$Error.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6117:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingUiState$Loading.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6118:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingUiState$Revealed.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6119:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingUiState$Submitting.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6120:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingUiState.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6121:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModel$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6122:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModel$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6123:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModel$submit$1$2$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6124:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModel$submit$1$2$emit$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6125:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModel$submit$1$2.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6126:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModel$submit$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6127:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModel.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6128:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModel_Factory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6129:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModel_HiltModules$BindsModule.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6130:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModel_HiltModules$KeyModule.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6131:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModel_HiltModules.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6132:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModel_HiltModules_KeyModule_ProvideFactory$InstanceHolder.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6133:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModel_HiltModules_KeyModule_ProvideFactory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6134:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\hilt_aggregated_deps\_com_homeservices_technician_data_rating_di_RatingModule.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6135:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\hilt_aggregated_deps\_com_homeservices_technician_ui_rating_RatingViewModel_HiltModules_BindsModule.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6136:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\hilt_aggregated_deps\_com_homeservices_technician_ui_rating_RatingViewModel_HiltModules_KeyModule.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6137:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6138:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingDtosTest.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6139:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImplTest$get returns domain model on success$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6140:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImplTest$get returns domain model on success$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6141:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImplTest$get returns failure on API error$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6142:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImplTest$get returns failure on API error$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6143:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImplTest$submitTechRating calls api with side TECH_TO_CUSTOMER and behaviour communication keys$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6144:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImplTest$submitTechRating calls api with side TECH_TO_CUSTOMER and behaviour communication keys$1$2.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6145:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImplTest$submitTechRating calls api with side TECH_TO_CUSTOMER and behaviour communication keys$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6146:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImplTest$submitTechRating returns failure on API error$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6147:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImplTest$submitTechRating returns failure on API error$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6148:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImplTest.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6149:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\domain\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6150:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\domain\rating\GetTechRatingUseCaseTest$delegates to repository$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6151:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\domain\rating\GetTechRatingUseCaseTest$delegates to repository$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6152:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\domain\rating\GetTechRatingUseCaseTest.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6153:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\domain\rating\SubmitTechRatingUseCaseTest$delegates to repository with correct parameters$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6154:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\domain\rating\SubmitTechRatingUseCaseTest$delegates to repository with correct parameters$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6155:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\domain\rating\SubmitTechRatingUseCaseTest.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6156:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6157:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingScreenPaparazziTest.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6158:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$failed submit transitions to Error state$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6159:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$failed submit transitions to Error state$1$2.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6160:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$failed submit transitions to Error state$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6161:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$init transitions to AwaitingPartner when techSide already submitted$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6162:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$init transitions to AwaitingPartner when techSide already submitted$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6163:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$init transitions to Revealed when status is REVEALED$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6164:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$init transitions to Revealed when status is REVEALED$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6165:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$setComment truncates to 500 chars$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6166:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$setComment truncates to 500 chars$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6167:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$submit does nothing when canSubmit is false$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6168:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$submit does nothing when canSubmit is false$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6169:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$submit is a no-op while a previous submit is in flight$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6170:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$submit is a no-op while a previous submit is in flight$1$2.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6171:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$submit is a no-op while a previous submit is in flight$1$3.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6172:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$submit is a no-op while a previous submit is in flight$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6173:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$submit is disabled until overall and both sub-scores are non-zero$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6174:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$submit is disabled until overall and both sub-scores are non-zero$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6175:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$successful submit transitions to AwaitingPartner state$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6176:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$successful submit transitions to AwaitingPartner state$1$2.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6177:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$successful submit transitions to AwaitingPartner state$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6178:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$transitions to Error when getUseCase fails$1$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6179:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest$transitions to Error when getUseCase fails$1.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6180:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingViewModelTest.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6201:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\data\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6202:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\data\rating\RatingPromptEventBus_Factory$InstanceHolder.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6203:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\data\rating\RatingPromptEventBus_Factory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6204:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\data\rating\RatingRepositoryImpl_Factory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6205:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\data\rating\di\RatingModule_Companion_ProvideAuthOkHttpClientFactory$InstanceHolder.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6206:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\data\rating\di\RatingModule_Companion_ProvideAuthOkHttpClientFactory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6207:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\data\rating\di\RatingModule_Companion_ProvideRatingApiServiceFactory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6208:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\domain\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6209:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\domain\rating\GetTechRatingUseCase_Factory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6210:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\domain\rating\SubmitTechRatingUseCase_Factory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6211:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\ui\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6212:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\ui\rating\RatingViewModel_Factory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6213:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\ui\rating\RatingViewModel_HiltModules$BindsModule.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6214:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\ui\rating\RatingViewModel_HiltModules$KeyModule.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6215:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\ui\rating\RatingViewModel_HiltModules.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6216:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\ui\rating\RatingViewModel_HiltModules_KeyModule_ProvideFactory$InstanceHolder.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6217:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\com\homeservices\technician\ui\rating\RatingViewModel_HiltModules_KeyModule_ProvideFactory.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6218:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\hilt_aggregated_deps\_com_homeservices_technician_data_rating_di_RatingModule.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6219:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\hilt_aggregated_deps\_com_homeservices_technician_ui_rating_RatingViewModel_HiltModules_BindsModule.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6220:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes\hilt_aggregated_deps\_com_homeservices_technician_ui_rating_RatingViewModel_HiltModules_KeyModule.class
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6227:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\java_res\release\processReleaseJavaRes\out\com\homeservices\technician\data\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6228:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\java_res\release\processReleaseJavaRes\out\com\homeservices\technician\domain\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6229:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\java_res\release\processReleaseJavaRes\out\com\homeservices\technician\ui\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6230:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\java_res\releaseUnitTest\processReleaseUnitTestJavaRes\out\com\homeservices\technician\data\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6231:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\java_res\releaseUnitTest\processReleaseUnitTestJavaRes\out\com\homeservices\technician\domain\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6232:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\java_res\releaseUnitTest\processReleaseUnitTestJavaRes\out\com\homeservices\technician\ui\rating
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6338:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\classes\com.homeservices.technician.data.rating.RatingDtosTest.html
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6339:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\classes\com.homeservices.technician.data.rating.RatingRepositoryImplTest.html
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6340:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\classes\com.homeservices.technician.domain.rating.GetTechRatingUseCaseTest.html
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6341:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\classes\com.homeservices.technician.domain.rating.SubmitTechRatingUseCaseTest.html
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6342:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\classes\com.homeservices.technician.ui.rating.RatingScreenPaparazziTest.html
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6343:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\classes\com.homeservices.technician.ui.rating.RatingViewModelTest.html
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6344:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\packages\com.homeservices.technician.data.rating.html
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6345:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\packages\com.homeservices.technician.domain.rating.html
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6346:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\packages\com.homeservices.technician.ui.rating.html
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6353:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\test-results\testReleaseUnitTest\TEST-com.homeservices.technician.data.rating.RatingDtosTest.xml
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6354:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\test-results\testReleaseUnitTest\TEST-com.homeservices.technician.data.rating.RatingRepositoryImplTest.xml
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6355:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\test-results\testReleaseUnitTest\TEST-com.homeservices.technician.domain.rating.GetTechRatingUseCaseTest.xml
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6356:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\test-results\testReleaseUnitTest\TEST-com.homeservices.technician.domain.rating.SubmitTechRatingUseCaseTest.xml
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6357:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\test-results\testReleaseUnitTest\TEST-com.homeservices.technician.ui.rating.RatingScreenPaparazziTest.xml
docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6358:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\test-results\testReleaseUnitTest\TEST-com.homeservices.technician.ui.rating.RatingViewModelTest.xml
docs\reviews\codex-e07-s01b-round5-20260425-0233.md:5846:        checkReleaseBuilds = false
docs\reviews\codex-e07-s01b-round8-20260425-0301.md:5821:.\docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6100:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\domain\rating\model\RatingSnapshot$Status.class
docs\reviews\codex-e07-s01b-round8-20260425-0301.md:5822:.\docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6101:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\release\transformReleaseClassesWithAsm\dirs\com\homeservices\technician\domain\rating\model\RatingSnapshot.class
docs\reviews\codex-e07-s01b-round8-20260425-0301.md:5823:.\docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6143:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImplTest$submitTechRating calls api with side TECH_TO_CUSTOMER and behaviour communication keys$1$1.class
docs\reviews\codex-e07-s01b-round8-20260425-0301.md:5824:.\docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6144:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImplTest$submitTechRating calls api with side TECH_TO_CUSTOMER and behaviour communication keys$1$2.class
docs\reviews\codex-e07-s01b-round8-20260425-0301.md:5825:.\docs\reviews\codex-e07-s01b-round7-20260425-0251.md:6145:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\data\rating\RatingRepositoryImplTest$submitTechRating calls api with side TECH_TO_CUSTOMER and behaviour communication keys$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3268:        checkReleaseBuilds = false
docs\reviews\codex-e07s04-round3-20260426-1003.md:3623:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\SmokeScreenPaparazziTest$smokeScreenDarkThemeMatchesSnapshot$1$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3624:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\SmokeScreenPaparazziTest$smokeScreenDarkThemeMatchesSnapshot$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3625:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\SmokeScreenPaparazziTest$smokeScreenLightThemeMatchesSnapshot$1$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3626:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\SmokeScreenPaparazziTest$smokeScreenLightThemeMatchesSnapshot$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3627:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\SmokeScreenPaparazziTest.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3628:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\activeJob\ActiveJobScreenPaparazziTest$activeJobScreen_enRoute$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3629:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\activeJob\ActiveJobScreenPaparazziTest$activeJobScreen_inProgress$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3630:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\activeJob\ActiveJobScreenPaparazziTest$activeJobScreen_reached$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3631:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\activeJob\ActiveJobScreenPaparazziTest.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3632:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\AuthScreenPaparazziTest.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3633:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-1$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3634:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-10$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3635:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-11$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3636:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-12$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3637:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-13$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3638:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-14$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3639:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-15$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3640:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-16$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3641:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-2$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3642:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-3$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3643:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-4$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3644:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-5$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3645:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-6$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3646:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-7$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3647:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-8$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3648:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt$lambda-9$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3649:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\auth\ComposableSingletons$AuthScreenPaparazziTestKt.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3650:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\jobOffer\ComposableSingletons$JobOfferScreenPaparazziTestKt$lambda-1$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3651:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\jobOffer\ComposableSingletons$JobOfferScreenPaparazziTestKt$lambda-2$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3652:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\jobOffer\ComposableSingletons$JobOfferScreenPaparazziTestKt.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3653:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\jobOffer\JobOfferScreenPaparazziTest$jobOfferScreen_lastFiveSeconds$1$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3654:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\jobOffer\JobOfferScreenPaparazziTest$jobOfferScreen_lastFiveSeconds$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3655:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\jobOffer\JobOfferScreenPaparazziTest$jobOfferScreen_offerArrived_darkTheme$1$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3656:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\jobOffer\JobOfferScreenPaparazziTest$jobOfferScreen_offerArrived_darkTheme$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3657:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\jobOffer\JobOfferScreenPaparazziTest$jobOfferScreen_offerArrived_lightTheme$1$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3658:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\jobOffer\JobOfferScreenPaparazziTest$jobOfferScreen_offerArrived_lightTheme$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3659:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\jobOffer\JobOfferScreenPaparazziTest.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3660:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\kyc\ComposableSingletons$KycScreenPaparazziTestKt$lambda-1$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3661:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\kyc\ComposableSingletons$KycScreenPaparazziTestKt$lambda-10$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3662:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\kyc\ComposableSingletons$KycScreenPaparazziTestKt$lambda-11$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3663:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\kyc\ComposableSingletons$KycScreenPaparazziTestKt$lambda-12$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3664:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\kyc\ComposableSingletons$KycScreenPaparazziTestKt$lambda-2$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3665:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\kyc\ComposableSingletons$KycScreenPaparazziTestKt$lambda-3$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3666:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\kyc\ComposableSingletons$KycScreenPaparazziTestKt$lambda-4$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3667:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\kyc\ComposableSingletons$KycScreenPaparazziTestKt$lambda-5$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3668:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\kyc\ComposableSingletons$KycScreenPaparazziTestKt$lambda-6$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3669:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\kyc\ComposableSingletons$KycScreenPaparazziTestKt$lambda-7$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3670:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\kyc\ComposableSingletons$KycScreenPaparazziTestKt$lambda-8$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3671:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\kyc\ComposableSingletons$KycScreenPaparazziTestKt$lambda-9$1.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3672:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\kyc\ComposableSingletons$KycScreenPaparazziTestKt.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3673:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\kyc\KycScreenPaparazziTest.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3674:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\intermediates\classes\releaseUnitTest\transformReleaseUnitTestClassesWithAsm\dirs\com\homeservices\technician\ui\rating\RatingScreenPaparazziTest.class
docs\reviews\codex-e07s04-round3-20260426-1003.md:3688:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\classes\com.homeservices.technician.ui.activeJob.ActiveJobScreenPaparazziTest.html
docs\reviews\codex-e07s04-round3-20260426-1003.md:3689:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\classes\com.homeservices.technician.ui.auth.AuthScreenPaparazziTest.html
docs\reviews\codex-e07s04-round3-20260426-1003.md:3690:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\classes\com.homeservices.technician.ui.jobOffer.JobOfferScreenPaparazziTest.html
docs\reviews\codex-e07s04-round3-20260426-1003.md:3691:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\classes\com.homeservices.technician.ui.kyc.KycScreenPaparazziTest.html
docs\reviews\codex-e07s04-round3-20260426-1003.md:3692:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\classes\com.homeservices.technician.ui.rating.RatingScreenPaparazziTest.html
docs\reviews\codex-e07s04-round3-20260426-1003.md:3693:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\reports\tests\testReleaseUnitTest\classes\com.homeservices.technician.ui.SmokeScreenPaparazziTest.html
docs\reviews\codex-e07s04-round3-20260426-1003.md:3700:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\test-results\testReleaseUnitTest\TEST-com.homeservices.technician.ui.activeJob.ActiveJobScreenPaparazziTest.xml
docs\reviews\codex-e07s04-round3-20260426-1003.md:3701:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\test-results\testReleaseUnitTest\TEST-com.homeservices.technician.ui.auth.AuthScreenPaparazziTest.xml
docs\reviews\codex-e07s04-round3-20260426-1003.md:3702:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\test-results\testReleaseUnitTest\TEST-com.homeservices.technician.ui.jobOffer.JobOfferScreenPaparazziTest.xml
docs\reviews\codex-e07s04-round3-20260426-1003.md:3703:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\test-results\testReleaseUnitTest\TEST-com.homeservices.technician.ui.kyc.KycScreenPaparazziTest.xml
docs\reviews\codex-e07s04-round3-20260426-1003.md:3704:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\test-results\testReleaseUnitTest\TEST-com.homeservices.technician.ui.rating.RatingScreenPaparazziTest.xml
docs\reviews\codex-e07s04-round3-20260426-1003.md:3705:C:\Alok\Business Projects\Urbanclap-dup\technician-app\app\build\test-results\testReleaseUnitTest\TEST-com.homeservices.technician.ui.SmokeScreenPaparazziTest.xml
docs\reviews\codex-w5-20260513-2020.md:3054:data class ReleaseSigning(
docs\reviews\codex-w5-20260513-2020.md:3069:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-w5-20260513-2020.md:3074:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-w5-20260513-2020.md:3085:        resolveReleaseFile(
docs\reviews\codex-w5-20260513-2020.md:3091:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-w5-20260513-2020.md:3094:    return ReleaseSigning(
docs\reviews\codex-w5-20260513-2020.md:3122:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-w5-20260513-2020.md:3258:  technician-app\app\build.gradle.kts:104:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-w5-20260513-2020.md:4296:            // Release tag: "<applicationId>@<versionName>+<gitSha>" â€” enables
docs\reviews\codex-w5-20260513-2020.md:6854:  When building a release variant, `firebase-appcheck-debug` is not on the classpath because it is declared as `debugImplementation`, but this `src/main` code still imports and calls `DebugAppCheckProviderFactory`. Kotlin resolves both branches even though `BuildConfig.DEBUG` is false, so `:app:compileReleaseKotlin` will fail with an unresolved reference; put the debug provider branch in a debug source set or otherwise make the type available only where it is compiled.
docs\reviews\codex-w5-20260513-2020.md:6862:  When building a release variant, `firebase-appcheck-debug` is not on the classpath because it is declared as `debugImplementation`, but this `src/main` code still imports and calls `DebugAppCheckProviderFactory`. Kotlin resolves both branches even though `BuildConfig.DEBUG` is false, so `:app:compileReleaseKotlin` will fail with an unresolved reference; put the debug provider branch in a debug source set or otherwise make the type available only where it is compiled.
docs\reviews\codex-e11-s05b-2-round8-20260518-0451.md:7072: 197:             // Guard RAZORPAY_KEY_ID only on bundleRelease (the Play Store publishing path).
docs\reviews\codex-e11-s05b-2-round8-20260518-0451.md:7073: 198:             // assembleRelease is intentionally NOT guarded so CI smoke builds and local APK
docs\reviews\codex-e11-s05b-2-round8-20260518-0451.md:7076: 201:             tasks.matching { it.name == "bundleRelease" }.configureEach {
docs\reviews\codex-e11-s05b-2-round9-20260518-0507.md:2671:data class ReleaseSigning(
docs\reviews\codex-e11-s05b-2-round9-20260518-0507.md:2686:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-e11-s05b-2-round9-20260518-0507.md:2691:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-e11-s05b-2-round9-20260518-0507.md:2702:        resolveReleaseFile(
docs\reviews\codex-e11-s05b-2-round9-20260518-0507.md:2708:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-e11-s05b-2-round9-20260518-0507.md:2711:    return ReleaseSigning(
docs\reviews\codex-e11-s05b-2-round9-20260518-0507.md:2739:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-e11-s05b-2-round9-20260518-0507.md:2832:            // Guard RAZORPAY_KEY_ID only on bundleRelease (the Play Store publishing path).
docs\reviews\codex-e11-s05b-2-round9-20260518-0507.md:2833:            // assembleRelease is intentionally NOT guarded so CI smoke builds and local APK
docs\reviews\codex-e11-s05b-2-round9-20260518-0507.md:2836:            tasks.matching { it.name == "bundleRelease" }.configureEach {
docs\reviews\codex-e11-s05b-2-round9-20260518-0507.md:2878:        checkReleaseBuilds = false
docs\reviews\codex-e11-s05b-2-round7-20260518-0426.md:3384:data class ReleaseSigning(
docs\reviews\codex-e11-s05b-2-round7-20260518-0426.md:3399:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-e11-s05b-2-round7-20260518-0426.md:3404:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-e11-s05b-2-round7-20260518-0426.md:3415:        resolveReleaseFile(
docs\reviews\codex-e11-s05b-2-round7-20260518-0426.md:3421:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-e11-s05b-2-round7-20260518-0426.md:3424:    return ReleaseSigning(
docs\reviews\codex-e11-s05b-2-round7-20260518-0426.md:3452:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-e11-s05b-2-round7-20260518-0426.md:3545:            // Guard RAZORPAY_KEY_ID only on bundleRelease (the Play Store publishing path).
docs\reviews\codex-e11-s05b-2-round7-20260518-0426.md:3546:            // assembleRelease is intentionally NOT guarded so CI smoke builds and local APK
docs\reviews\codex-e19-s01-round4-20260518-0741.md:3575:                  PreRelease:       False
docs\reviews\codex-e19-s01-round4-20260518-0741.md:10035:                  PreRelease:       False
docs\reviews\codex-pr-E02-S01.md:162: # Release minification rules land in the deploy story (E0x-Sxx). Skeleton keeps minify off.
docs\reviews\codex-pr-E02-S01.md:3696:        checkReleaseBuilds = false
docs\reviews\codex-e11-s05b-2-round4-20260518-0300.md:388:-a---- 13044  customer-bundleRelease.log   
docs\reviews\codex-e11-s05b-2-round4-20260518-0300.md:390:-a---- 12958  technician-bundleRelease.log 
docs\reviews\codex-e11-s05b-2-round4-20260518-0300.md:4532:data class ReleaseSigning(
docs\reviews\codex-e11-s05b-2-round4-20260518-0300.md:4547:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-e11-s05b-2-round4-20260518-0300.md:4552:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-e11-s05b-2-round4-20260518-0300.md:4563:        resolveReleaseFile(
docs\reviews\codex-e11-s05b-2-round4-20260518-0300.md:4569:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-e11-s05b-2-round4-20260518-0300.md:4572:    return ReleaseSigning(
docs\reviews\codex-e11-s05b-2-round4-20260518-0300.md:4600:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-e11-s05b-2-round4-20260518-0300.md:4693:            // Guard RAZORPAY_KEY_ID only on bundleRelease (the Play Store publishing path).
docs\reviews\codex-e11-s05b-2-round4-20260518-0300.md:4694:            // assembleRelease is intentionally NOT guarded so CI smoke builds and local APK
docs\reviews\codex-e11-s05b-2-round4-20260518-0300.md:4697:            tasks.matching { it.name == "bundleRelease" }.configureEach {
docs\reviews\codex-e11-s05b-2-round4-20260518-0300.md:4739:        checkReleaseBuilds = false
docs\reviews\codex-E01-S02-20260418-0838-round4.md:32236:stdout.\n */\nasync function printInfo() {\n  const installedRelease = getPackageVersion('next')\n  const nextConfig = 
docs\reviews\codex-E01-S02-20260418-0838-round4.md:32239:res.json()\n\n    versionInfo = parseVersionInfo({\n      installed: installedRelease,\n      latest: tags.latest,\n   
docs\reviews\codex-E01-S02-20260418-0838-round4.md:32243:}.)\n      Detected \"${installedRelease}\". Visit https://github.com/vercel/next.js/releases.\n      Make sure to try 
docs\reviews\codex-E01-S02-20260418-0838-round4.md:32246:}\n\n  const cpuCores = os.cpus().length\n  let relevantPackages = `  next: ${installedRelease}${stalenessWithTitle}\n 
docs\reviews\codex-E01-S02-20260418-0838-round4.md:32292:    default: async () => {\n          const installedRelease = getPackageVersion('next')\n          const nextConfig = 
docs\reviews\codex-E01-S02-20260418-0838-round4.md:32295:Packages:\n    next: ${installedRelease}\n    eslint-config-next: ${getPackageVersion('eslint-config-next')}\n    
docs\reviews\codex-E01-S02-20260418-0838-round4.md:32381:Sync","toString","trim","execSync","printInfo","installedRelease","nextConfig","stalenessWithTitle","title","versionInf
docs\reviews\codex-e11-s05b-2-round6-20260518-0403.md:3417:          checkReleaseBuilds = false
docs\reviews\codex-e11-s05b-2-round6-20260518-0403.md:7797:data class ReleaseSigning(
docs\reviews\codex-e11-s05b-2-round6-20260518-0403.md:7812:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-e11-s05b-2-round6-20260518-0403.md:7817:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-e11-s05b-2-round6-20260518-0403.md:7828:        resolveReleaseFile(
docs\reviews\codex-e11-s05b-2-round6-20260518-0403.md:7834:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-e11-s05b-2-round6-20260518-0403.md:7837:    return ReleaseSigning(
docs\reviews\codex-w1-pr.md:5856:                     PreRelease:       False
docs\reviews\codex-sprint2b-perf-obs-20260522-2027.md:3449:data class ReleaseSigning(
docs\reviews\codex-sprint2b-perf-obs-20260522-2027.md:3464:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-sprint2b-perf-obs-20260522-2027.md:3469:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-sprint2b-perf-obs-20260522-2027.md:3480:        resolveReleaseFile(
docs\reviews\codex-sprint2b-perf-obs-20260522-2027.md:3486:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-sprint2b-perf-obs-20260522-2027.md:3489:    return ReleaseSigning(
docs\reviews\codex-sprint2b-perf-obs-20260522-2027.md:3517:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-sprint2b-perf-obs-20260522-2027.md:3649:        checkReleaseBuilds = false
docs\reviews\codex-sprint3-dpdp-consent-posthog.md:5558:            // Release tag: "<applicationId>@<versionName>+<gitSha>" â€” enables
docs\reviews\codex-e11-s05b-2-round10-20260518-0530.md:5194:data class ReleaseSigning(
docs\reviews\codex-e11-s05b-2-round10-20260518-0530.md:5209:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-e11-s05b-2-round10-20260518-0530.md:5214:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-e11-s05b-2-round10-20260518-0530.md:5225:        resolveReleaseFile(
docs\reviews\codex-e11-s05b-2-round10-20260518-0530.md:5231:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-e11-s05b-2-round10-20260518-0530.md:5234:    return ReleaseSigning(
docs\reviews\codex-e11-s05b-2-round10-20260518-0530.md:5262:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-e11-s05b-2-round10-20260518-0530.md:5355:            // Guard RAZORPAY_KEY_ID only on bundleRelease (the Play Store publishing path).
docs\reviews\codex-e11-s05b-2-round10-20260518-0530.md:5356:            // assembleRelease is intentionally NOT guarded so CI smoke builds and local APK
docs\reviews\codex-e11-s05b-2-round10-20260518-0530.md:5359:            tasks.matching { it.name == "bundleRelease" }.configureEach {
docs\reviews\codex-e11-s05b-2-round10-20260518-0530.md:5401:        checkReleaseBuilds = false
docs\stories\E01-S03-android-app-skeletons.md:60:- **And** Android Lint runs against `lintDebug` (not `lintRelease` — release signing is out of scope) with `warningsAsErrors = true` and `checkDependencies = false`
docs\reviews\codex-sprint2b-perf-obs-20260522-2015.md:2827:         checkReleaseBuilds = false
docs\reviews\codex-sprint2b-perf-obs-20260522-2015.md:4336:            // Release tag: "<applicationId>@<versionName>+<gitSha>" â€” enables
docs\reviews\codex-sprint4-sec-hardening-20260522-2156.md:7073:docs/stories/E01-S04-design-system-module.md:251:  - [x] T9.1 Create `.github/workflows/design-system-ship.yml` modelled verbatim on `customer-ship.yml`: `name`, `paths:` `['design-system/**', '.github/workflows/design-system-ship.yml', '.codex-review-passed']`, `defaults.run.working-directory: design-system`, `env: { GIT_SHA: ${{ github.sha }} }`, full step list (BMAD gate, ktlintCheck, detekt, lintDebug, testDebugUnitTest, koverVerify koverXmlReport, verifyPaparazziDebug, assembleRelease, Semgrep `p/kotlin p/owasp-top-ten p/secrets`, codex-marker ancestor-check + scope-diff)
docs\reviews\codex-sprint4-sec-hardening-20260522-2156.md:7172:docs/superpowers/specs/2026-04-18-e01-s04-design-system-design.md:271:- `design-system-ship.yml` — modelled verbatim on `customer-ship.yml`; `paths:` filter `['design-system/**', '.github/workflows/design-system-ship.yml', '.codex-review-passed']`; `defaults.run.working-directory: design-system`; full step list (BMAD gate, ktlintCheck, detekt, lintDebug, testDebugUnitTest, koverVerify koverXmlReport, verifyPaparazziDebug, assembleRelease, Semgrep, codex-marker ancestor-check); tools/check-shared-versions.sh as the second step
docs\reviews\codex-sprint4-sec-hardening-20260522-2156.md:7505:  ./gradlew assembleRelease ktlintCheck testDebugUnitTest --quiet 2>&1 | tail -20
docs\reviews\codex-e11-s05b-2-round5-20260518-0333.md:2509:data class ReleaseSigning(
docs\reviews\codex-e11-s05b-2-round5-20260518-0333.md:2524:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-e11-s05b-2-round5-20260518-0333.md:2529:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-e11-s05b-2-round5-20260518-0333.md:2540:        resolveReleaseFile(
docs\reviews\codex-e11-s05b-2-round5-20260518-0333.md:2546:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-e11-s05b-2-round5-20260518-0333.md:2549:    return ReleaseSigning(
docs\reviews\codex-e11-s05b-2-round5-20260518-0333.md:2577:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-e11-s05b-2-round5-20260518-0333.md:2670:            // Guard RAZORPAY_KEY_ID only on bundleRelease (the Play Store publishing path).
docs\reviews\codex-e11-s05b-2-round5-20260518-0333.md:2671:            // assembleRelease is intentionally NOT guarded so CI smoke builds and local APK
docs\reviews\codex-e11-s05b-2-round5-20260518-0333.md:2674:            tasks.matching { it.name == "bundleRelease" }.configureEach {
docs\reviews\codex-e11-s05b-2-round5-20260518-0333.md:2716:        checkReleaseBuilds = false
docs\stories\E01-S04-design-system-module.md:32:- **Given** a developer at repo root runs `./gradlew :design-system:assembleRelease` inside `design-system/`
docs\stories\E01-S04-design-system-module.md:140:- **Then** the workflow passes every step: BMAD artifacts gate (matching the api-/customer-/technician-/admin-ship.yml pattern), `./gradlew ktlintCheck`, `./gradlew detekt`, `./gradlew lintDebug`, `./gradlew testDebugUnitTest`, `./gradlew koverVerify koverXmlReport`, `./gradlew verifyPaparazziDebug`, `./gradlew assembleRelease` (library AAR; release variant is fine for a library — no signing config needed), Semgrep SAST (`p/kotlin p/owasp-top-ten p/secrets`), and the codex-review marker ancestor-check + scope-diff (verbatim from `api-ship.yml`)
docs\stories\E01-S04-design-system-module.md:176:  - [x] T1.8 Verify `./gradlew :design-system:assembleRelease` exits 0 with empty source set (smoke check before tokens)
docs\stories\E01-S04-design-system-module.md:251:  - [x] T9.1 Create `.github/workflows/design-system-ship.yml` modelled verbatim on `customer-ship.yml`: `name`, `paths:` `['design-system/**', '.github/workflows/design-system-ship.yml', '.codex-review-passed']`, `defaults.run.working-directory: design-system`, `env: { GIT_SHA: ${{ github.sha }} }`, full step list (BMAD gate, ktlintCheck, detekt, lintDebug, testDebugUnitTest, koverVerify koverXmlReport, verifyPaparazziDebug, assembleRelease, Semgrep `p/kotlin p/owasp-top-ten p/secrets`, codex-marker ancestor-check + scope-diff)
docs\reviews\codex-e11-s05b-2-round3-20260518-0224.md:7295:data class ReleaseSigning(
docs\reviews\codex-e11-s05b-2-round3-20260518-0224.md:7310:fun resolveReleaseFile(path: String): File {
docs\reviews\codex-e11-s05b-2-round3-20260518-0224.md:7315:fun loadReleaseSigning(): ReleaseSigning? {
docs\reviews\codex-e11-s05b-2-round3-20260518-0224.md:7326:        resolveReleaseFile(
docs\reviews\codex-e11-s05b-2-round3-20260518-0224.md:7332:        "Release signing store file not found at ${storeFile.absolutePath}."
docs\reviews\codex-e11-s05b-2-round3-20260518-0224.md:7335:    return ReleaseSigning(
docs\reviews\codex-e11-s05b-2-round3-20260518-0224.md:7363:val releaseSigning = loadReleaseSigning()
docs\reviews\codex-e11-s05b-2-round3-20260518-0224.md:7456:            // Guard RAZORPAY_KEY_ID only on bundleRelease (the Play Store publishing path).
docs\reviews\codex-e11-s05b-2-round3-20260518-0224.md:7457:            // assembleRelease is intentionally NOT guarded so CI smoke builds and local APK
docs\reviews\codex-e11-s05b-2-round3-20260518-0224.md:7460:            tasks.matching { it.name == "bundleRelease" }.configureEach {
docs\reviews\codex-e11-s05b-2-round3-20260518-0224.md:7502:        checkReleaseBuilds = false
docs\reviews\codex-pr.md:15198:} finally {\n          // Release the semaphore lock\n          this.failureCountSemaphore.leave();\n        }\n      

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content .github\\workflows\\customer-ship.yml; Get-Content .github\\workflows\\technician-ship.yml" in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 693ms:
name: customer-ship

on:
  workflow_dispatch:
  pull_request:
    branches: [main]
    paths:
      - 'customer-app/**'
      - 'design-system/**'
      - '.github/workflows/customer-ship.yml'
      - 'tools/check-shared-versions.sh'
      - 'tools/verify-android-design-tokens.py'
  push:
    branches: [main]
    paths:
      - 'customer-app/**'
      - 'design-system/**'
      - '.github/workflows/customer-ship.yml'
      - 'tools/check-shared-versions.sh'
      - 'tools/verify-android-design-tokens.py'

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

env:
  GIT_SHA: ${{ github.sha }}
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    defaults:
      run:
        working-directory: customer-app

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21

      - uses: gradle/actions/setup-gradle@v4

      - name: shared toolchain versions drift check
        working-directory: ${{ github.workspace }}
        run: bash tools/check-shared-versions.sh

      # Catalog drift check covers the two APP catalogs only.
      # design-system/gradle/libs.versions.toml is intentionally divergent
      # (no Hilt/Sentry/Activity/Lifecycle in the design-system module).
      # Shared toolchain versions (Kotlin, AGP, Compose BOM, Paparazzi, Kover, Detekt, ktlint)
      # are gated separately by tools/check-shared-versions.sh above.
      - name: app-catalog byte-identity drift check
        working-directory: ${{ github.workspace }}
        run: |
          if ! diff -q customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml > /dev/null; then
            echo "::error::libs.versions.toml drifted between customer-app and technician-app"
            diff customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml
            exit 1
          fi
          echo "app-catalog drift check OK"

      # SEC-01: the committed google-services.json is a placeholder stub with
      # no real credentials. The real Firebase config is injected here from
      # the GOOGLE_SERVICES_JSON repository secret. If the secret is missing
      # (e.g. PRs from external forks), the stub remains and AGP can still
      # parse it for compile/lint, but Firebase runtime features will not
      # work â€” release builds MUST run with the secret populated.
      - name: write google-services.json from secret
        working-directory: ${{ github.workspace }}
        env:
          GOOGLE_SERVICES_JSON: ${{ secrets.GOOGLE_SERVICES_JSON }}
        run: |
          if [ -z "$GOOGLE_SERVICES_JSON" ]; then
            echo "::warning::GOOGLE_SERVICES_JSON secret is empty; build will use placeholder stub (Firebase runtime will not function)."
            exit 0
          fi
          printf '%s' "$GOOGLE_SERVICES_JSON" > customer-app/app/google-services.json
          # Sanity check: must be valid JSON and contain expected applicationId
          python3 -c "import json,sys; d=json.load(open('customer-app/app/google-services.json')); pkgs=[c['client_info']['android_client_info']['package_name'] for c in d['client']]; sys.exit(0) if 'in.homeheroo.customer' in pkgs else sys.exit(1)"
          echo "google-services.json written and validated"

      - name: assemble debug APK (clean-room compile check)
        run: ./gradlew assembleDebug

      - name: unit tests + coverage gate
        run: ./gradlew testDebugUnitTest koverVerify

      - name: assemble release (verify R8 + ProGuard)
        run: ./gradlew assembleRelease

      - name: ktlint + detekt + android lint
        run: ./gradlew ktlintCheck detekt lintDebug

      - name: paparazzi screenshot diff
        run: ./gradlew verifyPaparazziDebug

      - name: semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: p/kotlin p/owasp-top-ten p/secrets
name: technician-ship

on:
  workflow_dispatch:
  pull_request:
    branches: [main]
    paths:
      - 'technician-app/**'
      - 'design-system/**'
      - '.github/workflows/technician-ship.yml'
      - 'tools/check-shared-versions.sh'
      - 'tools/verify-android-design-tokens.py'
  push:
    branches: [main]
    paths:
      - 'technician-app/**'
      - 'design-system/**'
      - '.github/workflows/technician-ship.yml'
      - 'tools/check-shared-versions.sh'
      - 'tools/verify-android-design-tokens.py'

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

env:
  GIT_SHA: ${{ github.sha }}
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    defaults:
      run:
        working-directory: technician-app

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21

      - uses: gradle/actions/setup-gradle@v4

      - name: shared toolchain versions drift check
        working-directory: ${{ github.workspace }}
        run: bash tools/check-shared-versions.sh

      # Catalog drift check covers the two APP catalogs only.
      # design-system/gradle/libs.versions.toml is intentionally divergent
      # (no Hilt/Sentry/Activity/Lifecycle in the design-system module).
      # Shared toolchain versions (Kotlin, AGP, Compose BOM, Paparazzi, Kover, Detekt, ktlint)
      # are gated separately by tools/check-shared-versions.sh above.
      - name: app-catalog byte-identity drift check
        working-directory: ${{ github.workspace }}
        run: |
          if ! diff -q technician-app/gradle/libs.versions.toml customer-app/gradle/libs.versions.toml > /dev/null; then
            echo "::error::libs.versions.toml drifted between technician-app and customer-app"
            diff technician-app/gradle/libs.versions.toml customer-app/gradle/libs.versions.toml
            exit 1
          fi
          echo "app-catalog drift check OK"

      - name: assemble debug APK (clean-room compile check)
        run: ./gradlew assembleDebug

      - name: unit tests + coverage gate
        run: ./gradlew testDebugUnitTest koverVerify

      - name: assemble release (verify R8 + ProGuard)
        run: ./gradlew assembleRelease

      - name: bundle release AAB
        run: ./gradlew bundleRelease

      - name: upload release AAB
        uses: actions/upload-artifact@v4
        with:
          name: technician-release-${{ env.GIT_SHA }}
          path: technician-app/app/build/outputs/bundle/release/app-release.aab
          retention-days: 7

      - name: ktlint + detekt + android lint
        run: ./gradlew ktlintCheck detekt lintDebug

      - name: Zero hardcoded Text literals
        run: |
          count=$(grep -r 'Text("' technician-app/app/src/main/kotlin/com/homeservices/technician/ui/ \
            | grep -v '//\|%.1f\|\\u\|""\|" "' \
            | grep -v 'stringResource\|getString' \
            | wc -l | tr -d ' ')
          if [ "$count" -gt 0 ]; then
            echo "âŒ Found $count hardcoded Text() literals in ui/ â€” use stringResource()"
            grep -r 'Text("' technician-app/app/src/main/kotlin/com/homeservices/technician/ui/ \
              | grep -v '//\|%.1f\|\\u\|""\|" "' \
              | grep -v 'stringResource\|getString'
            exit 1
          fi
          echo "âœ… No hardcoded Text() literals"

      - name: paparazzi screenshot diff
        run: ./gradlew verifyPaparazziDebug

      - name: semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/kotlin
            p/owasp-top-ten
            p/secrets
            technician-app/.semgrep/

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "SENTRY_DSN|POSTHOG_API_KEY|GROWTHBOOK_CLIENT_KEY|GrowthBook|PostHog|SentryInitializer" -n customer-app technician-app docs .github | Select-Object -First 200' in C:\Alok\Business Projects\wt-obs-keys
2026-09-05T21:08:38.477041Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.8 seconds
Output:
customer-app\CLAUDE.md:13:- GrowthBook Android SDK (OSS)
customer-app\CLAUDE.md:14:- PostHog Android SDK
docs\audit\customer-app-gap-audit-2026-05-11.md:43:| Feature flags to register | §`Cross-cutting infrastructure → Feature flags (GrowthBook)` |
docs\architecture.md:73:- **Next.js 15 + TypeScript strict** — hostable on Azure Static Web Apps free tier. Template has Storybook, Sentry, PostHog, axe-core, Lighthouse CI, Semgrep. Nothing custom.
docs\architecture.md:200:**Why:** each stack matches a scaffolded agency-baseline template (`client-baseline-android`, `client-baseline-nextjs`, `client-baseline-node`) that already wires the enterprise floor (Sentry, GrowthBook, PostHog, Storybook/Paparazzi, Semgrep, Codex-review CI). Zero custom scaffolding needed. Fits solo-build constraints.
docs\architecture.md:475:| NFR-O-1 to O-6 (observability) | PostHog + Sentry + App Insights + OTel |
docs\architecture.md:494:| PostHog Cloud | ~500k events | 1M/mo | 50% headroom |
docs\architecture.md:520:Monitoring: Azure Function execution-duration metric + PostHog event-timing on tech-side "offer received" → alert if p95 > 2s for 5 min.
customer-app\gradle\libs.versions.toml:135:growthbook-android = { module = "io.growthbook.sdk:GrowthBook", version.ref = "growthbook" }
docs\adr\0001-primary-stack-choice.md:23:- Each stack maps to an existing agency-baseline template (`client-baseline-android`, `client-baseline-nextjs`, `client-baseline-node`), already wired with the enterprise floor: Sentry, GrowthBook, PostHog, Storybook/Paparazzi, Semgrep, ship.yml CI, Codex-review gate. Zero custom scaffolding.
docs\adr\0002-fcm-universal-messaging-spine.md:43:- Our delivery SLO (95% within 10s) is explicit in NFR-R-5 and monitored via PostHog. If it drops, we have a pre-planned MSG91 SMS fallback (1-week implementation) to layer in.
docs\adr\0007-zero-paid-saas-constraint.md:19:- Free tiers with clear overflow behaviour (Google Maps $200/mo credit, FCM unlimited, Cosmos 25 GB, Form Recognizer 500 pages/mo, Firebase Storage 5 GB, PostHog 1M events/mo, Sentry 5k errors/mo, GitHub Actions 2000 min/mo) are acceptable.
docs\adr\0007-zero-paid-saas-constraint.md:74:| PostHog Cloud | 1M events/mo | ~10× pilot scale |
docs\adr\0007-zero-paid-saas-constraint.md:135:- **Exception for monitoring/observability tools only** — rejected; Sentry free + PostHog free + App Insights free are genuinely sufficient at this scale.
docs\device-test-findings-2026-05-19.md:21:| SENTRY_DSN | ✗ missing — error tracking dark |
docs\device-test-findings-2026-05-19.md:22:| POSTHOG_API_KEY | ✗ missing — analytics dark |
docs\device-test-findings-2026-05-19.md:100:| P2 | Add ACS_CONNECTION_STRING, SENTRY_DSN, POSTHOG_API_KEY to Function App | Alok (infra) |
docs\adr\0017-customer-wallet-ledger.md:105:Credit application is gated behind a GrowthBook feature flag. Default is `false` (fail-closed — never silently spend customer money). The flag will be flipped to `true` after E13-S02 (WalletScreen) ships and the balance is visible to the customer in the app.
docs\threat-model.md:28:- PostHog Cloud (product analytics)
docs\threat-model.md:156:| **R**epudiation | Tech claims "I didn't get the FCM" | L | L | FCM delivery receipts tracked in PostHog; we can show attempted delivery + ACK status | Ops |
docs\threat-model.md:192:| **Data breach — no 72-hour notification** | Runbook has breach-notification workflow; PostHog + Sentry alerts on anomaly; annual breach-response drill |
docs\threat-model.md:337:| **T-B1** | **Service-area bypass via client-spoofed lat/lng** — A customer outside the Ayodhya pilot area submits `addressLatLng: { lat: 26.7958, lng: 82.1947 }` (Ramkot coordinates) in `POST /v1/bookings` while physically located in Delhi or abroad. The booking is accepted and dispatched to a technician in Ayodhya who cannot reach the customer. Repeated systematic attempts (recon pattern) indicate the attacker is probing the polygon boundary or enumerating valid coordinates. | `api/src/functions/bookings.ts` — `isLatLngInServiceArea()` check + GrowthBook flag `customer.service-area-gating.enabled`; `api/src/schemas/booking.ts` — `LatLngSchema` with `lat.min(-90).max(90)` + `lng.min(-180).max(180)` range guard | M (3) | M-H (3) — wasted dispatch capacity, failed bookings, tech-side frustration; H if systematic booking fraud | **Server-side Turf.js polygon check** in `POST /v1/bookings` using `@turf/boolean-point-in-polygon` against 25 km Ayodhya polygon. Out-of-range coords rejected at Zod layer (422); out-of-polygon coords rejected at service layer (400 `SERVICE_NOT_AVAILABLE_AT_LOCATION`) when flag `customer.service-area-gating.enabled = true`. Structured log `service_area_check { inside, mode }` always emitted. **Alert trigger:** >5 rejections/min/customer → recon signal. ADR-0020. | Medium — no phone-home API to verify physical device location; a determined attacker with knowledge of the polygon can always spoof a valid inside-polygon coordinate. Mitigated post-soft-launch by cross-checking address against confirmed tech locations (Phase 2). | mitigated (server-side; AC-5 also mitigates out-of-range spoofing via Zod) |
docs\threat-model.md:387:> **Status as of this addendum:** PII leaks into these vendors have been remediated in PR S3 (PostHog masking, Sentry scrubber extension, OTel URL sanitisation). The cross-border transfer exposure documented here is the **residual** risk — data is now scrubbed before transmission, but the vendor endpoints remain in foreign jurisdictions. A future sprint (Sprint 2) will address jurisdiction migration.
docs\threat-model.md:393:| **PostHog** | `us.i.posthog.com` (US region — default when `NEXT_PUBLIC_POSTHOG_HOST` is unset) | `$pageview` events with sanitised URLs (no phone/email/PII query params after S3), click events on allowlisted elements, no session recording text content. | **Cross-border personal data transfer.** Pageview events include admin user's IP (inferred by PostHog from request) and navigation patterns. DPDPA 2023 §16 requires adequate protection for cross-border transfers. No SCCs or adequacy decision exists for US. | **Partial.** PII in event payloads is stripped. Admin-user IP and behavioural metadata still crosses to US. Remediation: set `NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com` or self-host on Azure Central India (Sprint 2). |
docs\threat-model.md:399:- **§16 (Cross-border transfer):** DPDPA permits transfer to "such countries or territories outside India as may be prescribed." The Rules (2025 draft) have not yet published a whitelist. Sending phone numbers, admin emails, and navigation data to US-region PostHog and Sentry without SCCs or consent is a compliance gap.
docs\threat-model.md:401:- **§9 (Data minimisation):** Post-S3, PostHog receives only sanitised behavioural metadata. Sentry receives scrubbed error events. This satisfies the minimisation principle for new events; historical events (pre-S3) in PostHog/Sentry remain a gap until retention windows expire.
docs\threat-model.md:402:- **Retention:** PostHog free tier retains events 1 year. Sentry free tier retains 30 days. Both should be documented in the data-processing inventory (`docs/dpdp-data-inventory.md`).
docs\threat-model.md:411:**Addendum 2026-05-21 complete. New STRIDE entries: I-CB1 (cross-border PostHog), I-CB2 (cross-border Sentry), I-CB3 (Azure Monitor region unverified).**
docs\launch-readiness.md:59:- [ ] All required app settings configured: `COSMOS_CONNECTION_STRING`, `COSMOS_DATABASE`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `ACS_CONNECTION_STRING`, `SENTRY_DSN`, `POSTHOG_API_KEY`, `GROWTHBOOK_API_HOST`, `GROWTHBOOK_CLIENT_KEY`, `WEBSITE_RUN_FROM_PACKAGE` (deleted per Oryx note), `SCM_DO_BUILD_DURING_DEPLOYMENT=true`, `ENABLE_ORYX_BUILD=true`, `NPM_CONFIG_INCLUDE=dev`
docs\launch-readiness.md:114:### 2i. Observability — Sentry + PostHog + GrowthBook
docs\launch-readiness.md:117:- [ ] PostHog Cloud project + API keys
docs\launch-readiness.md:118:- [ ] GrowthBook OSS instance running OR GrowthBook Cloud Free SDK key (E13-S05)
docs\launch-readiness.md:120:- [ ] PostHog funnels defined: `booking-search → catalogue-view → booking-created → booking-confirmed → booking-completed → rating-submitted`
docs\launch-readiness.md:121:- [ ] GrowthBook flags wired and toggleable for a single test customerId
docs\launch-readiness.md:134:- [ ] Data Processor / Sub-processor agreements with: Firebase (Google), Azure (Microsoft), Razorpay, Truecaller, ACS, Sentry, PostHog, GrowthBook
docs\launch-readiness.md:275:- [ ] Sentry, PostHog, GrowthBook all receiving events as expected
docs\launch-readiness.md:283:- [ ] Daily standup with owner-self: review Sentry + PostHog funnel + complaint count
docs\adr\0023-observability-stack-tech-app.md:1:# ADR-0023 — Observability Stack: Crashlytics + App Check + PostHog (technician-app)
docs\adr\0023-observability-stack-tech-app.md:16:- No PostHog event instrumentation — the locale-switch path (E12-S03c / W4) has no analytics coverage.
docs\adr\0023-observability-stack-tech-app.md:37:### 3. PostHog Android SDK (`com.posthog.android:posthog`, version `3.13.0`)
docs\adr\0023-observability-stack-tech-app.md:39:- Initialized in `PostHogInitializer` (called from `HomeservicesTechnicianApplication.onCreate`).
docs\adr\0023-observability-stack-tech-app.md:40:- API key and host injected via `BuildConfig.POSTHOG_API_KEY` / `BuildConfig.POSTHOG_HOST`; blank key → no-op init.
docs\adr\0023-observability-stack-tech-app.md:52:- PostHog gives product analytics on locale adoption rates in Ayodhya/UP market.
docs\adr\0023-observability-stack-tech-app.md:57:- PostHog `captureApplicationLifecycleEvents` fires on every foreground event; contributes to the 1M event/mo free tier. At pilot scale (<5 000 active technicians/mo) this is negligible.
docs\adr\0023-observability-stack-tech-app.md:70:| Firebase Analytics instead of PostHog | Firebase Analytics is not in the free-tier stack (billing linkage); PostHog is OSS with a generous free tier and better product analytics primitives |
docs\adr\0023-observability-stack-tech-app.md:71:| Inject PostHog via Hilt | Adds DI ceremony for a singleton; `PostHog.capture()` is already a no-op when not initialized — `runCatching` wrapper is sufficient |
docs\prd.md:100:| Booking success rate | ≥ 90% (PAID or CASH_BOOKING_CREATED events / BookingSummaryScreen attempts) | PostHog funnel |
docs\prd.md:101:| Payment success rate | ≥ 92% (Razorpay successful captures / initiations, excluding user-cancelled) | PostHog + Razorpay dashboard |
docs\prd.md:102:| p50 time-to-first-booking | ≤ 3 minutes (PostHog funnel: app_open → booking_confirmed, new users only) | PostHog funnel |
docs\prd.md:103:| Net Promoter Score | ≥ 30 from ≥ 15 soft-launch users (2-question in-app survey after first booking) | Manual survey via PostHog feature flag gate |
docs\prd.md:473:| **PostHog Cloud** (free tier — 1M events/mo) | Product analytics, cohort retention, A/B testing | Free at pilot scale |
docs\prd.md:510:- **Validation approach:** FCM delivery telemetry in PostHog; alert if < 95% delivery-within-10-seconds.
docs\prd.md:585:- Delivery SLO: < 95% delivery within 10 s (PostHog tracked).
docs\prd.md:685:- **Observability:** PostHog for product analytics across all 3 surfaces; Sentry for errors; Application Insights for infra telemetry.
docs\prd.md:748:- **E13-S01 — Ayodhya regional tech recruitment + verification.** Trigger: prerequisite to flipping `marketing.public-launch` GrowthBook flag. Scope: identify ≥2 technicians per active serviceId in Ayodhya service radius (~10km from `[82.20, 26.79]` GeoJSON `[longitude, latitude]`); complete DigiLocker Aadhaar KYC + PAN OCR + tech-app onboarding for each. Operations/recruitment story, not a software story. Tracked here to make the launch-flag prerequisite (E10-S04 AC) auditable.
docs\prd.md:776:| FCM delivery unreliability | Delivery telemetry in PostHog; if < 95% within 10 s, MSG91 SMS fallback planned (1-week implementation) |
docs\prd.md:1148:| NFR-P-4 | FCM data message delivery p95 < 5 s | PostHog event timing from push-sent → push-received |
docs\prd.md:1162:| NFR-R-5 | FCM delivery success ≥ 95% within 10 s | PostHog telemetry |
docs\prd.md:1220:| NFR-O-3 | Product analytics via PostHog: user events, cohort retention, A/B testing | Instrumentation on critical user actions (free tier 1M events/month) |
docs\prd.md:1229:| NFR-U-1 | Time to first completed booking (new customer) ≤ 90 s | PostHog funnel |
docs\prd.md:1230:| NFR-U-2 | Time to accept first job offer (new technician after onboarding) ≤ 30 s | PostHog funnel |
docs\adr\0024-rating-shield-threshold.md:21:At MVP launch we have no PostHog data for the Ayodhya pilot area. We do not know what
docs\adr\0024-rating-shield-threshold.md:29:The threshold should only be widened to ≤3★ if PostHog soft-launch data shows **more than 10%
docs\adr\0024-rating-shield-threshold.md:44:- **Neutral:** The 10% PostHog trigger is a heuristic, not a hard rule. Owner can override with
docs\adr\0022-defer-posthog-customer-app.md:1:# ADR-0022: Defer PostHog SDK Integration in customer-app
docs\adr\0022-defer-posthog-customer-app.md:6:**Story:** E18-S06 (Sentry user-context + breadcrumbs + PostHog decision)
docs\adr\0022-defer-posthog-customer-app.md:12:E18-S06 required a decision: integrate the PostHog Android SDK for product-analytics event capture now, or defer to a later story.
docs\adr\0022-defer-posthog-customer-app.md:14:The PostHog Cloud tier used in this project (1M events/month free) is confirmed in the ₹0 stack (CLAUDE.md, `docs/architecture.md`). PostHog is also listed as a planned dependency in `customer-app/CLAUDE.md`. However, the SDK was not present in `customer-app/gradle/libs.versions.toml` at the time this story was executed.
docs\adr\0022-defer-posthog-customer-app.md:18:**Defer PostHog SDK integration.** Do not add the SDK in this story.
docs\adr\0022-defer-posthog-customer-app.md:20:Sentry wiring (user-context + navigation breadcrumbs) is implemented as planned. PostHog integration is deferred to a dedicated story (E18-S07 or equivalent).
docs\adr\0022-defer-posthog-customer-app.md:26:2. **PostHog integration is a non-trivial SDK addition.** Adding the PostHog Android SDK introduces:
docs\adr\0022-defer-posthog-customer-app.md:28:   - An `Application.onCreate` initialisation path that must be guarded by a `BuildConfig` field (`POSTHOG_API_KEY`) wired through all three build variants.
docs\adr\0022-defer-posthog-customer-app.md:29:   - A Hilt-injected `Analytics` interface + `PostHogAnalytics` + `NoOpAnalytics` bindings.
docs\adr\0022-defer-posthog-customer-app.md:33:3. **APK size budget.** The PostHog Android SDK + OkHttp transitive deps add measurable APK weight. At pilot scale (Ayodhya/UP rural target market with budget Android devices), APK size is a conscious quality metric. The addition should be intentional and accompanied by a Baseline Profile update.
docs\adr\0022-defer-posthog-customer-app.md:35:4. **Firebase Analytics is a zero-cost fallback.** Firebase Analytics (already a transitive dependency via `firebase-messaging`) can capture basic conversion events (booking created, payment succeeded/failed) without an additional SDK. If a lightweight analytics interim is needed before the dedicated PostHog story ships, Firebase Analytics is available.
docs\adr\0022-defer-posthog-customer-app.md:37:5. **Story scope discipline.** Combining PostHog SDK init, event taxonomy, ViewModel call sites, and Hilt bindings in the same PR as Sentry wiring exceeds feature-tier scope. Splitting avoids a bloated diff that is harder for Codex review to reason about.
docs\adr\0022-defer-posthog-customer-app.md:42:- **Positive:** PostHog integration gets proper ceremony (plan, TDD, Codex review) in E18-S07.
docs\adr\0022-defer-posthog-customer-app.md:46:  - `BuildConfig.POSTHOG_API_KEY` with env-var fallback
docs\adr\0022-defer-posthog-customer-app.md:47:  - `Analytics` interface + `PostHogAnalytics` / `NoOpAnalytics` Hilt bindings
docs\adr\0022-defer-posthog-customer-app.md:53:- **Integrate PostHog now (rejected):** The SDK is not yet in `libs.versions.toml`. Adding it mid-story increases PR scope beyond feature-tier limits and risks introducing an unreviewed dependency.
docs\adr\0022-defer-posthog-customer-app.md:54:- **Use Firebase Analytics as interim (deferred):** Possible, but adds its own wiring overhead. Better handled in E18-S07 where the analytics strategy can be decided holistically (PostHog vs Firebase Analytics vs both).
docs\runbook.md:58:| **PostHog** | posthog.com → homeservices-mvp project | User flows, conversion funnels, feature usage, FCM delivery telemetry (free tier 1M events/mo) |
docs\runbook.md:126:3. FCM delivery — are pushes reaching tech phones? PostHog event `fcm_push_received` rate.
docs\runbook.md:162:- PostHog: signup funnel drop
docs\runbook.md:166:1. Truecaller SDK status — are Truecaller-based verifications succeeding? PostHog event `auth_method=truecaller` success rate.
docs\runbook.md:181:- PostHog `fcm_push_sent` vs `fcm_push_received` gap > 5%
docs\runbook.md:378:**Feature flags (GrowthBook):**
docs\runbook.md:571:In GrowthBook dashboard → Feature Flags → `soft_launch_enabled` → set to `false`.
docs\runbook.md:600:- GrowthBook → `soft_launch_enabled` → set to `true`
docs\runbook.md:612:| `GROWTHBOOK_CLIENT_KEY` | Azure Functions app settings | Required for soft-launch flag to work |
docs\runbook.md:630:| `SENTRY_DSN` | `SentryInitializer` returns early — no crash or error reporting at all |
docs\runbook.md:631:| `POSTHOG_API_KEY` | `PostHogAnalyticsFacade` returns early — no product analytics |
docs\runbook.md:632:| `GROWTHBOOK_CLIENT_KEY` | flags never fetch; every flag silently falls back to its default |
docs\runbook.md:825:2. Pause writes to the affected partition: deploy a feature-flag (GrowthBook) `partition_writes_paused_<container>=true`.
docs\runbook.md:838:- Re-enable writes after migration: flip GrowthBook flag.
docs\runbook.md:981:### OP-A8: GrowthBook config-server unreachable
docs\runbook.md:984:- GrowthBook Cloud Free SDK fails to fetch feature flags (HTTP timeout or 5xx from `cdn.growthbook.io`)
docs\runbook.md:986:- Sentry alert: `GrowthBookFetchFailed` repeated > 3 times in 5 minutes
docs\runbook.md:991:1. Check [GrowthBook status](https://status.growthbook.io) — vendor-side outage?
docs\runbook.md:993:3. Mobile apps: GrowthBook React Native SDK caches the last successful fetch to local storage; existing sessions are unaffected.
docs\runbook.md:997:- Confirm `GROWTHBOOK_CLIENT_KEY` is the correct SDK key for the production environment (not staging).
docs\runbook.md:1000:- If a critical flag (e.g. `soft_launch_enabled`) must be toggled urgently during a GrowthBook outage, it can be forced via a direct API call to the Functions endpoint (endpoint to be added in a follow-up story — `PUT /api/v1/admin/flags/:name`). Until that endpoint exists, update the Azure Functions app setting `GROWTHBOOK_FALLBACK_FLAGS` with a JSON override and restart the Function App.
docs\runbook.md:1003:- Once GrowthBook CDN recovers, the next SDK evaluation cycle (every 60 s in the admin-web implementation) picks up fresh flags automatically. No restart needed.
docs\runbook.md:1008:**Owner / escalation:** GrowthBook OSS community / GitHub issues (self-hosted fallback is always an option — see ADR-0007).
docs\runbook.md:1128:   - `GROWTHBOOK_CLIENT_KEY` — production SDK key from GrowthBook Cloud console
docs\runbook.md:1140:4. **GrowthBook sanity.** Log into GrowthBook Cloud → confirm `soft_launch_enabled` is set to `false` (will be toggled on after this checklist).
docs\runbook.md:1148:8. **Go-live.** GrowthBook → `soft_launch_enabled` → set to `true`. Send invite to F&F users.
docs\runbook.md:1217:- **OP-A8** complements the GrowthBook soft-launch flag procedures in § Emergency Rollback — A8 is the vendor outage case; Emergency Rollback is the self-initiated kill-switch.
docs\design\_inventory\A1.json:680:      "purpose": "Authenticated app shell — verifies the hs_access JWT, provides auth + GrowthBook context, and renders Rail + Topbar + scrollable main.",
docs\design\_inventory\A1.json:685:        "<GrowthBookClientProvider> → <AdminAuthProvider> — layout.tsx:57-58",
docs\adr\0020-service-area-gating.md:28:3. **GrowthBook feature flag** `customer.service-area-gating.enabled` (default `false`) gating between:
docs\adr\0020-service-area-gating.md:64:- **Positive:** Fail-open GrowthBook flag design allows soak period (warn-only first week) before hard enforcement, reducing risk of false-positive rejections of legitimate Ayodhya customers.
docs\adr\0019-periodic-tech-location.md:29:A **GrowthBook kill-switch** (`customer.periodic-location.enabled`, default off) gates the FCM publish step. When off, the Cosmos write still happens (admin observability is preserved) but no live pin appears in customer-app.
docs\adr\0019-periodic-tech-location.md:66:Flip `customer.periodic-location.enabled` to `false` in GrowthBook. FCM publishes stop immediately (within the next flag refresh). Cosmos writes continue — admin dashboard retains location observability. Tech-app continues calling the endpoint (Cosmos upsert still happens); deploy a client-side flag to stop the foreground service if needed.
docs\launch-checklist.md:11:- [ ] `GROWTHBOOK_CLIENT_KEY` set in Azure Functions app settings
docs\launch-checklist.md:18:- [ ] GrowthBook: `soft_launch_enabled = false` initially (gate closed until go-live)
docs\launch-checklist.md:19:- [ ] GrowthBook: `marketing_pause_enabled = false` (not paused)
docs\launch-checklist.md:28:- [ ] Verify GrowthBook dashboard reachable and flag states correct
docs\launch-checklist.md:36:- [ ] Enable `soft_launch_enabled = true` in GrowthBook
docs\launch-checklist.md:46:Immediately disable `soft_launch_enabled` in GrowthBook if any of these occur:
docs\stories\E01-S03-android-app-skeletons.md:85:- **And** at least these test files exist and pass in each app: `BuildInfoProviderTest.kt` (pure unit — no Android framework), `SentryInitializerTest.kt` (verifies no-op when DSN is empty, init-once when set — mocks `io.sentry.android.core.SentryAndroid`), `SmokeScreenPaparazziTest.kt` (Paparazzi — counts toward coverage of Compose composables)
docs\stories\E01-S03-android-app-skeletons.md:101:- **And** `BuildConfig.SENTRY_DSN` (injected from an optional `SENTRY_DSN` env var at build time, empty string default) is the empty string
docs\stories\E01-S03-android-app-skeletons.md:102:- **Then** `SentryInitializer.init(application)` returns without calling `SentryAndroid.init { ... }` — verified in `SentryInitializerTest.kt` via MockK
docs\stories\E01-S03-android-app-skeletons.md:103:- **Given** `BuildConfig.SENTRY_DSN` is a non-empty DSN
docs\stories\E01-S03-android-app-skeletons.md:106:- **And** `@opentelemetry/*` / `io.opentelemetry.*` / `io.sentry.opentelemetry.*` packages are **NOT** added in this story — defer entirely, mirroring the E01-S01 + E01-S02 deferrals. A single TODO comment in `SentryInitializer.kt` points at the future observability story
docs\stories\E01-S03-android-app-skeletons.md:158:  - [x] T3.2 Create each app's `app/build.gradle.kts`: plugins (AGP, Kotlin 2, Compose, Hilt, KSP, Kover, Detekt, ktlint, Paparazzi), `android { }` block per AC-10, `buildFeatures { compose = true; buildConfig = true }`, `kotlinOptions` with `-Werror` + explicit-api + JVM_17, `buildConfigField("String", "SENTRY_DSN", "\"${System.getenv("SENTRY_DSN") ?: ""}\"")` + `GIT_SHA` (`System.getenv("GIT_SHA") ?: "dev"`)
docs\stories\E01-S03-android-app-skeletons.md:164:  - [x] T4.2 (GREEN) Implement `app/src/main/kotlin/com/homeservices/{customer,technician}/HomeservicesCustomerApplication.kt` / `HomeservicesTechnicianApplication.kt` annotated `@HiltAndroidApp`, `onCreate()` calls `SentryInitializer.init(this)`
docs\stories\E01-S03-android-app-skeletons.md:179:  - [x] T6.1 (RED) Write `SentryInitializerTest.kt` — MockK `io.sentry.android.core.SentryAndroid`; two cases: DSN empty → `init` never called; DSN set → `init` called once with `tracesSampleRate = 0.1`
docs\stories\E01-S03-android-app-skeletons.md:180:  - [x] T6.2 (GREEN) Implement `observability/SentryInitializer.kt` reading `BuildConfig.SENTRY_DSN`; early-return on blank; TODO comment pointing at the future observability story (mirrors `api/bootstrap.ts`)
docs\stories\E01-S03-android-app-skeletons.md:181:  - [x] T6.3 Wire `SentryInitializer.init(this)` into `Application.onCreate()` (already done in T4.2)
docs\stories\E01-S03-android-app-skeletons.md:290:│       │       │   └── SentryInitializer.kt            CREATE (early-return on empty DSN)
docs\stories\E01-S03-android-app-skeletons.md:300:│       │   │   ├── observability/SentryInitializerTest.kt  CREATE (MockK on SentryAndroid)
docs\stories\E01-S03-android-app-skeletons.md:334:- **Test names** are full sentences as Kotlin method names with backticks: `` `SentryInitializer does not call SentryAndroid init when DSN is blank`() `` — matches the test-name style already set in `api/` and `admin-web/`.
docs\stories\E01-S03-android-app-skeletons.md:341:| **Observability bootstrap** | `observability/SentryInitializer.kt` (this story) | Read `BuildConfig.SENTRY_DSN`; early-return when blank. Single entry point. Never call `SentryAndroid.init` directly from a feature-module Application or Activity. |
docs\stories\E01-S03-android-app-skeletons.md:356:- **Detected variance vs template:** baseline `customer-app/` + `technician-app/` are both literally an empty `app/src/main/` + a ship.yml at the wrong path + template-residue dirs (`docs/`, `plans/`, `specs/`). The template's CLAUDE.md promises Kotlin + Compose + Hilt + Room + Ktor + Sentry + GrowthBook + PostHog + Detekt + ktlint + Android Lint + JUnit 5 + MockK + Espresso + Paparazzi — this story installs the first four layers (Kotlin + Compose + Hilt + Sentry) + the first three test layers (JUnit 5 + MockK + Paparazzi) and defers Room + Ktor + GrowthBook + PostHog + Espresso to stories where they're first used.
docs\stories\E01-S03-android-app-skeletons.md:365:4. **OTel is not a clean no-op (E01-S01, E01-S02):** defer entirely; do NOT add `io.opentelemetry.*` or Sentry's OTel bridge. Single TODO comment in `SentryInitializer.kt`.
docs\stories\E01-S03-android-app-skeletons.md:483:8. **Do NOT introduce OpenTelemetry (`io.opentelemetry.*` or `io.sentry.opentelemetry.*`).** Defer entirely, matching the E01-S01 + E01-S02 precedents. Single TODO comment in `SentryInitializer.kt`.
docs\stories\E01-S03-android-app-skeletons.md:494:19. **Do NOT add `PostHog` or `GrowthBook` SDKs in this story.** Both are approved OSS but neither is exercised yet; adding them here forces config decisions (API key plumbing, opt-in gating) that belong with the first real event / flag story.
docs\stories\E01-S03-android-app-skeletons.md:545:5. **Sentry init location** — `Application.onCreate()` (standard) vs `@HiltAndroidApp` + an `ApplicationInitializer` pattern via `androidx.startup:startup-runtime`? **Recommendation:** plain `Application.onCreate()` call to `SentryInitializer.init(this)`. AndroidX App Startup is overkill for one initializer; introduces without benefit. Confirm.
docs\proposals\client-proposal-tiered-hindi.md:599:| Monitoring | Sentry + PostHog + CloudWatch |
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:96:- **And** `SENTRY_DSN` env var (or `NEXT_PUBLIC_SENTRY_DSN` for client) is **not** set (default for local dev + CI)
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:111:- **And** `admin-web/.env.example` committed with **no real secrets** — only `SENTRY_DSN=`, `NEXT_PUBLIC_SENTRY_DSN=`, `NEXT_PUBLIC_POSTHOG_KEY=`, `GROWTHBOOK_CLIENT_KEY=` stub keys (empty values); `admin-web/.env.local` is gitignored (verify and add to root `.gitignore` if missing)
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:158:  - [x] T6.2 Rewrite `admin-web/src/instrumentation.ts` as: read `SENTRY_DSN`; if unset, early return; else import and call `Sentry.init({ dsn, tracesSampleRate: 0.1 })`. Add a TODO comment pointing to the future OTel story (mirror the api/ `bootstrap.ts` pattern).
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:159:  - [x] T6.3 Add `admin-web/src/sentry.client.config.ts` — init client SDK the same way, reading `NEXT_PUBLIC_SENTRY_DSN`
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:160:  - [x] T6.4 Add `admin-web/src/sentry.server.config.ts` for server-side runtime (re-reads `SENTRY_DSN`)
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:220:| **Zero paid SaaS** | ADR-0007 | Every dep on approved free-tier list. Storybook (OSS), Playwright (OSS), axe-core (OSS), Lighthouse CI (OSS), GrowthBook OSS self-hosted deferred to later story. |
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:307:| **Observability bootstrap** | `src/instrumentation.ts` (this story) | Read `SENTRY_DSN`; early-return if unset. Single entry point. Never call `Sentry.init()` directly in page/component code. |
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:368:**Forbidden in this story (and generally, without ADR):** `redux`, `@reduxjs/toolkit`, `zustand`, `jotai`, `mobx` (use RSC + URL state + React state); `emotion`, `styled-components`, `stitches` (Tailwind is locked); `date-fns` and `dayjs` (native `Intl.DateTimeFormat`); `axios` (use native `fetch`); `lodash` (native ES2022); Chromatic (paid after 5k snapshots); `@vercel/analytics` (use PostHog); `react-router` (App Router).
docs\stories\E01-S01-api-skeleton-health-endpoint.md:71:- **And** `SENTRY_DSN` env var is **not** set (default for local dev + CI)
docs\stories\E01-S01-api-skeleton-health-endpoint.md:134:  - [x] T6.1 Add `src/observability/sentry.ts` — `initSentry()` early-returns if `SENTRY_DSN` is unset; otherwise calls `Sentry.init({ dsn, tracesSampleRate: 0.1 })`
docs\stories\E05-S02-dispatcher-engine.md:105:Three is the minimum that gives the customer redundancy if the closest tech declines or doesn't see the offer. One would mean every decline forces a re-dispatch, doubling p95 latency. Five would saturate the FCM fan-out for marginal gain — the 4th and 5th candidates are typically too far for good service. Three is the operator's pilot recommendation; it can be promoted to a PostHog-controlled variable if the dispatch funnel data justifies tuning.
docs\proposals\client-proposal-hindi.md:157:| Monitoring | **Sentry + PostHog + CloudWatch** | Bugs जल्दी पकड़े जाएँ, user behaviour समझ में आए |
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:21:| **E20-S13** | `AnalyticsTracker` singleton + 6 PostHog funnel events; `Crashlytics.recordException` at 4 failure paths |
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:116:// Null-safe PostHog facade — all capture calls are fire-and-forget
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:119:        runCatching { PostHog.capture(event, properties = properties) }
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:140:- Test: `capture() does not throw when PostHog is not initialized`
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:141:- Test: `capture() calls PostHog.capture with correct event name and properties`
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:143:**Commit message:** `feat(tech-app): E20-S13 observability — AnalyticsTracker + 6 PostHog funnel events + Crashlytics.recordException`
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:276:- [ ] 6 PostHog events wired at correct callsites
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:117:  └── E18-S06   Customer-app: Sentry user-context + breadcrumbs on nav + PostHog events (or ADR to defer)  [Feature]
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:272:| 0022 (optional) | PostHog + OpenTelemetry deferral if not adopted | Eng | E18-S06 |
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:281:### Feature flags (GrowthBook)
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:297:### Observability (Sentry + PostHog)
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:300:- **PostHog event taxonomy** (E18-S06): minimal soft-launch set — `auth.{started,truecaller_success,otp_verified,signout}`, `catalogue.{viewed,category_tapped,service_tapped}`, `booking.{address_entered,slot_picked,summary_viewed,payment_initiated,payment_succeeded,payment_failed}`, `tracking.{opened,eta_shown,location_stale_warning_shown}`, `rating.{prompt_received,opened,submitted,shield_shown,shield_escalated}`, `complaint.{created,viewed,reopened}`, `sos.{consent_shown,countdown_started,sent,cancelled}`, `wallet.{opened,credit_visible,credit_applied}`. Alternative: ADR-0022 defers PostHog to Phase 2 if budget tight.
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:362:- **E18-S03** Shield bottom-sheet copy moved to HI strings (per spec verbatim). Tip-chip `TODO(C-19)` marker added with code reference to `AwaitingPartner` post-submit state. ADR-0024 documents the ≤2★ vs <3★ decision (recommend narrowing to ≤2★ unless launch-review math demands broader, with PostHog event to monitor).
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:365:- **E18-S06** `AppNavigation` calls `Sentry.setUser(User(id = sha256(uid).take(16)))` on `Authenticated`; `setUser(null)` on `Unauthenticated`. `NavController.OnDestinationChangedListener` adds breadcrumbs. PostHog client initialized (or ADR-0022 deferring it).
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:380:Flip flags in this order (each held for 24h with Sentry + PostHog observation):
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:393:- FCM delivery rate (PostHog) > 95% over 72h
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:414:- Feature flag created in GrowthBook and defaulted to `off`
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:427:| Service-area gating false negatives (real Ayodhya customer rejected) | Medium | High (lost booking) | Soft-launch flag warn-only first; PostHog event on every reject; manual polygon refinement over week 1 |
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:430:| FCM tray notification permission denial on Android 13+ | High | Medium (lost delivery) | Permission-rationale flow on first launch; in-app banner fallback for critical types; PostHog event on denial |
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:467:- `customer-app/app/src/main/kotlin/com/homeservices/customer/observability/SentryInitializer.kt` — already initialized; just bind user in AppNavigation
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:541:5. **Sentry / PostHog observation** — 24h: crash-free-session > 99.5%, FCM delivery > 95%
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:553:- E18-S06 PostHog (defer with ADR-0022)
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:564:3. **PostHog vs ADR-0022 deferral** — full PostHog instrumentation (~10 funnels) vs deferring all product analytics to Phase 2. **Plan defaults to ship PostHog minimal taxonomy** because soft-launch insight is too valuable to skip; ADR-0022 only if budget rejects.
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:577:- Sentry + PostHog (or ADR-0022) dashboards configured
docs\design\_inventory\_observations.json:4627:  "ev": "customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/SettingsGraph.kt:60 and customer-app/app/src/main/kotlin/com/homeservices/customer/domain/flags/GrowthBookFeatureFlags.kt:72"
technician-app\gradle\libs.versions.toml:135:growthbook-android = { module = "io.growthbook.sdk:GrowthBook", version.ref = "growthbook" }
docs\superpowers\specs\2026-05-16-week5-foundation-stories-design.md:77:  - GrowthBook flag `customer.periodic-location.enabled` gates the publish. When off, server still writes Cosmos (so admin observability works) but skips the FCM emit.
docs\stories\E10-S04-launch-readiness-gate.md:25:| AC-1 | GrowthBook `soft_launch_enabled` flag gates `createBooking`; fail-open on SDK error | ✅ |
docs\stories\E10-S04-launch-readiness-gate.md:30:| AC-6 | `api-ship.yml` warning step if `GROWTHBOOK_CLIENT_KEY` secret is missing | ✅ |
docs\stories\E10-S04-launch-readiness-gate.md:38:| `api/src/services/featureFlags.service.ts` | GrowthBook wrapper: `isSoftLaunchEnabled`, `isMarketingPaused` |
docs\stories\E10-S04-launch-readiness-gate.md:48:| `api/local.settings.example.json` | Added `GROWTHBOOK_API_HOST` + `GROWTHBOOK_CLIENT_KEY` placeholders |
docs\stories\E10-S04-launch-readiness-gate.md:59:- GrowthBook SDK timeout or throw
docs\stories\E10-S04-launch-readiness-gate.md:60:- Empty `GROWTHBOOK_CLIENT_KEY` (local dev)
docs\stories\E10-S04-launch-readiness-gate.md:74:`api/local.settings.json` is in `.gitignore` (Azure Functions convention). The new env vars are documented in `api/local.settings.example.json`. Local dev with empty `GROWTHBOOK_CLIENT_KEY` automatically fails open (never calls GrowthBook, never blocks bookings).
docs\stories\E10-S04-launch-readiness-gate.md:85:✓ isSoftLaunchEnabled > fails open when GrowthBook SDK throws
docs\stories\E10-S04-launch-readiness-gate.md:86:✓ isSoftLaunchEnabled > returns true when GROWTHBOOK_CLIENT_KEY is empty
docs\stories\E10-S04-launch-readiness-gate.md:89:✓ isMarketingPaused > fails open (returns false) when GrowthBook SDK throws
docs\stories\E10-S04-launch-readiness-gate.md:90:✓ isMarketingPaused > returns false when GROWTHBOOK_CLIENT_KEY is empty
technician-app\CLAUDE.md:13:- GrowthBook Android SDK (OSS)
technician-app\CLAUDE.md:14:- PostHog Android SDK
docs\reviews\codex-20260905-obs-keys.md:172:+// how customer-app shipped to Play with Sentry, PostHog and GrowthBook all inert.
docs\reviews\codex-20260905-obs-keys.md:176:+val sentryDsn = envOrLocalProperty("SENTRY_DSN") ?: ""
docs\reviews\codex-20260905-obs-keys.md:177:+val postHogApiKey = envOrLocalProperty("POSTHOG_API_KEY") ?: ""
docs\reviews\codex-20260905-obs-keys.md:178:+val growthBookClientKey = envOrLocalProperty("GROWTHBOOK_CLIENT_KEY") ?: ""
docs\reviews\codex-20260905-obs-keys.md:186:+// word — SentryInitializer returns on a blank DSN, PostHogAnalyticsFacade returns on a
docs\reviews\codex-20260905-obs-keys.md:187:+// blank API key, GrowthBook fetches nothing and every flag falls to its default. That
docs\reviews\codex-20260905-obs-keys.md:191:+//   SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
docs\reviews\codex-20260905-obs-keys.md:192:+//   POSTHOG_API_KEY=phc_<key>

 exited 1 in 790ms:
customer-app\CLAUDE.md:13:- GrowthBook Android SDK (OSS)
customer-app\CLAUDE.md:14:- PostHog Android SDK
docs\audit\customer-app-gap-audit-2026-05-11.md:43:| Feature flags to register | §`Cross-cutting infrastructure → Feature flags (GrowthBook)` |
docs\architecture.md:73:- **Next.js 15 + TypeScript strict** — hostable on Azure Static Web Apps free tier. Template has Storybook, Sentry, PostHog, axe-core, Lighthouse CI, Semgrep. Nothing custom.
docs\architecture.md:200:**Why:** each stack matches a scaffolded agency-baseline template (`client-baseline-android`, `client-baseline-nextjs`, `client-baseline-node`) that already wires the enterprise floor (Sentry, GrowthBook, PostHog, Storybook/Paparazzi, Semgrep, Codex-review CI). Zero custom scaffolding needed. Fits solo-build constraints.
docs\architecture.md:475:| NFR-O-1 to O-6 (observability) | PostHog + Sentry + App Insights + OTel |
docs\architecture.md:494:| PostHog Cloud | ~500k events | 1M/mo | 50% headroom |
docs\architecture.md:520:Monitoring: Azure Function execution-duration metric + PostHog event-timing on tech-side "offer received" → alert if p95 > 2s for 5 min.
customer-app\gradle\libs.versions.toml:135:growthbook-android = { module = "io.growthbook.sdk:GrowthBook", version.ref = "growthbook" }
docs\adr\0001-primary-stack-choice.md:23:- Each stack maps to an existing agency-baseline template (`client-baseline-android`, `client-baseline-nextjs`, `client-baseline-node`), already wired with the enterprise floor: Sentry, GrowthBook, PostHog, Storybook/Paparazzi, Semgrep, ship.yml CI, Codex-review gate. Zero custom scaffolding.
docs\adr\0002-fcm-universal-messaging-spine.md:43:- Our delivery SLO (95% within 10s) is explicit in NFR-R-5 and monitored via PostHog. If it drops, we have a pre-planned MSG91 SMS fallback (1-week implementation) to layer in.
docs\adr\0007-zero-paid-saas-constraint.md:19:- Free tiers with clear overflow behaviour (Google Maps $200/mo credit, FCM unlimited, Cosmos 25 GB, Form Recognizer 500 pages/mo, Firebase Storage 5 GB, PostHog 1M events/mo, Sentry 5k errors/mo, GitHub Actions 2000 min/mo) are acceptable.
docs\adr\0007-zero-paid-saas-constraint.md:74:| PostHog Cloud | 1M events/mo | ~10× pilot scale |
docs\adr\0007-zero-paid-saas-constraint.md:135:- **Exception for monitoring/observability tools only** — rejected; Sentry free + PostHog free + App Insights free are genuinely sufficient at this scale.
docs\device-test-findings-2026-05-19.md:21:| SENTRY_DSN | ✗ missing — error tracking dark |
docs\device-test-findings-2026-05-19.md:22:| POSTHOG_API_KEY | ✗ missing — analytics dark |
docs\device-test-findings-2026-05-19.md:100:| P2 | Add ACS_CONNECTION_STRING, SENTRY_DSN, POSTHOG_API_KEY to Function App | Alok (infra) |
docs\adr\0017-customer-wallet-ledger.md:105:Credit application is gated behind a GrowthBook feature flag. Default is `false` (fail-closed — never silently spend customer money). The flag will be flipped to `true` after E13-S02 (WalletScreen) ships and the balance is visible to the customer in the app.
docs\threat-model.md:28:- PostHog Cloud (product analytics)
docs\threat-model.md:156:| **R**epudiation | Tech claims "I didn't get the FCM" | L | L | FCM delivery receipts tracked in PostHog; we can show attempted delivery + ACK status | Ops |
docs\threat-model.md:192:| **Data breach — no 72-hour notification** | Runbook has breach-notification workflow; PostHog + Sentry alerts on anomaly; annual breach-response drill |
docs\threat-model.md:337:| **T-B1** | **Service-area bypass via client-spoofed lat/lng** — A customer outside the Ayodhya pilot area submits `addressLatLng: { lat: 26.7958, lng: 82.1947 }` (Ramkot coordinates) in `POST /v1/bookings` while physically located in Delhi or abroad. The booking is accepted and dispatched to a technician in Ayodhya who cannot reach the customer. Repeated systematic attempts (recon pattern) indicate the attacker is probing the polygon boundary or enumerating valid coordinates. | `api/src/functions/bookings.ts` — `isLatLngInServiceArea()` check + GrowthBook flag `customer.service-area-gating.enabled`; `api/src/schemas/booking.ts` — `LatLngSchema` with `lat.min(-90).max(90)` + `lng.min(-180).max(180)` range guard | M (3) | M-H (3) — wasted dispatch capacity, failed bookings, tech-side frustration; H if systematic booking fraud | **Server-side Turf.js polygon check** in `POST /v1/bookings` using `@turf/boolean-point-in-polygon` against 25 km Ayodhya polygon. Out-of-range coords rejected at Zod layer (422); out-of-polygon coords rejected at service layer (400 `SERVICE_NOT_AVAILABLE_AT_LOCATION`) when flag `customer.service-area-gating.enabled = true`. Structured log `service_area_check { inside, mode }` always emitted. **Alert trigger:** >5 rejections/min/customer → recon signal. ADR-0020. | Medium — no phone-home API to verify physical device location; a determined attacker with knowledge of the polygon can always spoof a valid inside-polygon coordinate. Mitigated post-soft-launch by cross-checking address against confirmed tech locations (Phase 2). | mitigated (server-side; AC-5 also mitigates out-of-range spoofing via Zod) |
docs\threat-model.md:387:> **Status as of this addendum:** PII leaks into these vendors have been remediated in PR S3 (PostHog masking, Sentry scrubber extension, OTel URL sanitisation). The cross-border transfer exposure documented here is the **residual** risk — data is now scrubbed before transmission, but the vendor endpoints remain in foreign jurisdictions. A future sprint (Sprint 2) will address jurisdiction migration.
docs\threat-model.md:393:| **PostHog** | `us.i.posthog.com` (US region — default when `NEXT_PUBLIC_POSTHOG_HOST` is unset) | `$pageview` events with sanitised URLs (no phone/email/PII query params after S3), click events on allowlisted elements, no session recording text content. | **Cross-border personal data transfer.** Pageview events include admin user's IP (inferred by PostHog from request) and navigation patterns. DPDPA 2023 §16 requires adequate protection for cross-border transfers. No SCCs or adequacy decision exists for US. | **Partial.** PII in event payloads is stripped. Admin-user IP and behavioural metadata still crosses to US. Remediation: set `NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com` or self-host on Azure Central India (Sprint 2). |
docs\threat-model.md:399:- **§16 (Cross-border transfer):** DPDPA permits transfer to "such countries or territories outside India as may be prescribed." The Rules (2025 draft) have not yet published a whitelist. Sending phone numbers, admin emails, and navigation data to US-region PostHog and Sentry without SCCs or consent is a compliance gap.
docs\threat-model.md:401:- **§9 (Data minimisation):** Post-S3, PostHog receives only sanitised behavioural metadata. Sentry receives scrubbed error events. This satisfies the minimisation principle for new events; historical events (pre-S3) in PostHog/Sentry remain a gap until retention windows expire.
docs\threat-model.md:402:- **Retention:** PostHog free tier retains events 1 year. Sentry free tier retains 30 days. Both should be documented in the data-processing inventory (`docs/dpdp-data-inventory.md`).
docs\threat-model.md:411:**Addendum 2026-05-21 complete. New STRIDE entries: I-CB1 (cross-border PostHog), I-CB2 (cross-border Sentry), I-CB3 (Azure Monitor region unverified).**
docs\launch-readiness.md:59:- [ ] All required app settings configured: `COSMOS_CONNECTION_STRING`, `COSMOS_DATABASE`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `ACS_CONNECTION_STRING`, `SENTRY_DSN`, `POSTHOG_API_KEY`, `GROWTHBOOK_API_HOST`, `GROWTHBOOK_CLIENT_KEY`, `WEBSITE_RUN_FROM_PACKAGE` (deleted per Oryx note), `SCM_DO_BUILD_DURING_DEPLOYMENT=true`, `ENABLE_ORYX_BUILD=true`, `NPM_CONFIG_INCLUDE=dev`
docs\launch-readiness.md:114:### 2i. Observability — Sentry + PostHog + GrowthBook
docs\launch-readiness.md:117:- [ ] PostHog Cloud project + API keys
docs\launch-readiness.md:118:- [ ] GrowthBook OSS instance running OR GrowthBook Cloud Free SDK key (E13-S05)
docs\launch-readiness.md:120:- [ ] PostHog funnels defined: `booking-search → catalogue-view → booking-created → booking-confirmed → booking-completed → rating-submitted`
docs\launch-readiness.md:121:- [ ] GrowthBook flags wired and toggleable for a single test customerId
docs\launch-readiness.md:134:- [ ] Data Processor / Sub-processor agreements with: Firebase (Google), Azure (Microsoft), Razorpay, Truecaller, ACS, Sentry, PostHog, GrowthBook
docs\launch-readiness.md:275:- [ ] Sentry, PostHog, GrowthBook all receiving events as expected
docs\launch-readiness.md:283:- [ ] Daily standup with owner-self: review Sentry + PostHog funnel + complaint count
docs\adr\0023-observability-stack-tech-app.md:1:# ADR-0023 — Observability Stack: Crashlytics + App Check + PostHog (technician-app)
docs\adr\0023-observability-stack-tech-app.md:16:- No PostHog event instrumentation — the locale-switch path (E12-S03c / W4) has no analytics coverage.
docs\adr\0023-observability-stack-tech-app.md:37:### 3. PostHog Android SDK (`com.posthog.android:posthog`, version `3.13.0`)
docs\adr\0023-observability-stack-tech-app.md:39:- Initialized in `PostHogInitializer` (called from `HomeservicesTechnicianApplication.onCreate`).
docs\adr\0023-observability-stack-tech-app.md:40:- API key and host injected via `BuildConfig.POSTHOG_API_KEY` / `BuildConfig.POSTHOG_HOST`; blank key → no-op init.
docs\adr\0023-observability-stack-tech-app.md:52:- PostHog gives product analytics on locale adoption rates in Ayodhya/UP market.
docs\adr\0023-observability-stack-tech-app.md:57:- PostHog `captureApplicationLifecycleEvents` fires on every foreground event; contributes to the 1M event/mo free tier. At pilot scale (<5 000 active technicians/mo) this is negligible.
docs\adr\0023-observability-stack-tech-app.md:70:| Firebase Analytics instead of PostHog | Firebase Analytics is not in the free-tier stack (billing linkage); PostHog is OSS with a generous free tier and better product analytics primitives |
docs\adr\0023-observability-stack-tech-app.md:71:| Inject PostHog via Hilt | Adds DI ceremony for a singleton; `PostHog.capture()` is already a no-op when not initialized — `runCatching` wrapper is sufficient |
docs\prd.md:100:| Booking success rate | ≥ 90% (PAID or CASH_BOOKING_CREATED events / BookingSummaryScreen attempts) | PostHog funnel |
docs\prd.md:101:| Payment success rate | ≥ 92% (Razorpay successful captures / initiations, excluding user-cancelled) | PostHog + Razorpay dashboard |
docs\prd.md:102:| p50 time-to-first-booking | ≤ 3 minutes (PostHog funnel: app_open → booking_confirmed, new users only) | PostHog funnel |
docs\prd.md:103:| Net Promoter Score | ≥ 30 from ≥ 15 soft-launch users (2-question in-app survey after first booking) | Manual survey via PostHog feature flag gate |
docs\prd.md:473:| **PostHog Cloud** (free tier — 1M events/mo) | Product analytics, cohort retention, A/B testing | Free at pilot scale |
docs\prd.md:510:- **Validation approach:** FCM delivery telemetry in PostHog; alert if < 95% delivery-within-10-seconds.
docs\prd.md:585:- Delivery SLO: < 95% delivery within 10 s (PostHog tracked).
docs\prd.md:685:- **Observability:** PostHog for product analytics across all 3 surfaces; Sentry for errors; Application Insights for infra telemetry.
docs\prd.md:748:- **E13-S01 — Ayodhya regional tech recruitment + verification.** Trigger: prerequisite to flipping `marketing.public-launch` GrowthBook flag. Scope: identify ≥2 technicians per active serviceId in Ayodhya service radius (~10km from `[82.20, 26.79]` GeoJSON `[longitude, latitude]`); complete DigiLocker Aadhaar KYC + PAN OCR + tech-app onboarding for each. Operations/recruitment story, not a software story. Tracked here to make the launch-flag prerequisite (E10-S04 AC) auditable.
docs\prd.md:776:| FCM delivery unreliability | Delivery telemetry in PostHog; if < 95% within 10 s, MSG91 SMS fallback planned (1-week implementation) |
docs\prd.md:1148:| NFR-P-4 | FCM data message delivery p95 < 5 s | PostHog event timing from push-sent → push-received |
docs\prd.md:1162:| NFR-R-5 | FCM delivery success ≥ 95% within 10 s | PostHog telemetry |
docs\prd.md:1220:| NFR-O-3 | Product analytics via PostHog: user events, cohort retention, A/B testing | Instrumentation on critical user actions (free tier 1M events/month) |
docs\prd.md:1229:| NFR-U-1 | Time to first completed booking (new customer) ≤ 90 s | PostHog funnel |
docs\prd.md:1230:| NFR-U-2 | Time to accept first job offer (new technician after onboarding) ≤ 30 s | PostHog funnel |
docs\adr\0024-rating-shield-threshold.md:21:At MVP launch we have no PostHog data for the Ayodhya pilot area. We do not know what
docs\adr\0024-rating-shield-threshold.md:29:The threshold should only be widened to ≤3★ if PostHog soft-launch data shows **more than 10%
docs\adr\0024-rating-shield-threshold.md:44:- **Neutral:** The 10% PostHog trigger is a heuristic, not a hard rule. Owner can override with
docs\adr\0022-defer-posthog-customer-app.md:1:# ADR-0022: Defer PostHog SDK Integration in customer-app
docs\adr\0022-defer-posthog-customer-app.md:6:**Story:** E18-S06 (Sentry user-context + breadcrumbs + PostHog decision)
docs\adr\0022-defer-posthog-customer-app.md:12:E18-S06 required a decision: integrate the PostHog Android SDK for product-analytics event capture now, or defer to a later story.
docs\adr\0022-defer-posthog-customer-app.md:14:The PostHog Cloud tier used in this project (1M events/month free) is confirmed in the ₹0 stack (CLAUDE.md, `docs/architecture.md`). PostHog is also listed as a planned dependency in `customer-app/CLAUDE.md`. However, the SDK was not present in `customer-app/gradle/libs.versions.toml` at the time this story was executed.
docs\adr\0022-defer-posthog-customer-app.md:18:**Defer PostHog SDK integration.** Do not add the SDK in this story.
docs\adr\0022-defer-posthog-customer-app.md:20:Sentry wiring (user-context + navigation breadcrumbs) is implemented as planned. PostHog integration is deferred to a dedicated story (E18-S07 or equivalent).
docs\adr\0022-defer-posthog-customer-app.md:26:2. **PostHog integration is a non-trivial SDK addition.** Adding the PostHog Android SDK introduces:
docs\adr\0022-defer-posthog-customer-app.md:28:   - An `Application.onCreate` initialisation path that must be guarded by a `BuildConfig` field (`POSTHOG_API_KEY`) wired through all three build variants.
docs\adr\0022-defer-posthog-customer-app.md:29:   - A Hilt-injected `Analytics` interface + `PostHogAnalytics` + `NoOpAnalytics` bindings.
docs\adr\0022-defer-posthog-customer-app.md:33:3. **APK size budget.** The PostHog Android SDK + OkHttp transitive deps add measurable APK weight. At pilot scale (Ayodhya/UP rural target market with budget Android devices), APK size is a conscious quality metric. The addition should be intentional and accompanied by a Baseline Profile update.
docs\adr\0022-defer-posthog-customer-app.md:35:4. **Firebase Analytics is a zero-cost fallback.** Firebase Analytics (already a transitive dependency via `firebase-messaging`) can capture basic conversion events (booking created, payment succeeded/failed) without an additional SDK. If a lightweight analytics interim is needed before the dedicated PostHog story ships, Firebase Analytics is available.
docs\adr\0022-defer-posthog-customer-app.md:37:5. **Story scope discipline.** Combining PostHog SDK init, event taxonomy, ViewModel call sites, and Hilt bindings in the same PR as Sentry wiring exceeds feature-tier scope. Splitting avoids a bloated diff that is harder for Codex review to reason about.
docs\adr\0022-defer-posthog-customer-app.md:42:- **Positive:** PostHog integration gets proper ceremony (plan, TDD, Codex review) in E18-S07.
docs\adr\0022-defer-posthog-customer-app.md:46:  - `BuildConfig.POSTHOG_API_KEY` with env-var fallback
docs\adr\0022-defer-posthog-customer-app.md:47:  - `Analytics` interface + `PostHogAnalytics` / `NoOpAnalytics` Hilt bindings
docs\adr\0022-defer-posthog-customer-app.md:53:- **Integrate PostHog now (rejected):** The SDK is not yet in `libs.versions.toml`. Adding it mid-story increases PR scope beyond feature-tier limits and risks introducing an unreviewed dependency.
docs\adr\0022-defer-posthog-customer-app.md:54:- **Use Firebase Analytics as interim (deferred):** Possible, but adds its own wiring overhead. Better handled in E18-S07 where the analytics strategy can be decided holistically (PostHog vs Firebase Analytics vs both).
docs\runbook.md:58:| **PostHog** | posthog.com → homeservices-mvp project | User flows, conversion funnels, feature usage, FCM delivery telemetry (free tier 1M events/mo) |
docs\runbook.md:126:3. FCM delivery — are pushes reaching tech phones? PostHog event `fcm_push_received` rate.
docs\runbook.md:162:- PostHog: signup funnel drop
docs\runbook.md:166:1. Truecaller SDK status — are Truecaller-based verifications succeeding? PostHog event `auth_method=truecaller` success rate.
docs\runbook.md:181:- PostHog `fcm_push_sent` vs `fcm_push_received` gap > 5%
docs\runbook.md:378:**Feature flags (GrowthBook):**
docs\runbook.md:571:In GrowthBook dashboard → Feature Flags → `soft_launch_enabled` → set to `false`.
docs\runbook.md:600:- GrowthBook → `soft_launch_enabled` → set to `true`
docs\runbook.md:612:| `GROWTHBOOK_CLIENT_KEY` | Azure Functions app settings | Required for soft-launch flag to work |
docs\runbook.md:630:| `SENTRY_DSN` | `SentryInitializer` returns early — no crash or error reporting at all |
docs\runbook.md:631:| `POSTHOG_API_KEY` | `PostHogAnalyticsFacade` returns early — no product analytics |
docs\runbook.md:632:| `GROWTHBOOK_CLIENT_KEY` | flags never fetch; every flag silently falls back to its default |
docs\runbook.md:825:2. Pause writes to the affected partition: deploy a feature-flag (GrowthBook) `partition_writes_paused_<container>=true`.
docs\runbook.md:838:- Re-enable writes after migration: flip GrowthBook flag.
docs\runbook.md:981:### OP-A8: GrowthBook config-server unreachable
docs\runbook.md:984:- GrowthBook Cloud Free SDK fails to fetch feature flags (HTTP timeout or 5xx from `cdn.growthbook.io`)
docs\runbook.md:986:- Sentry alert: `GrowthBookFetchFailed` repeated > 3 times in 5 minutes
docs\runbook.md:991:1. Check [GrowthBook status](https://status.growthbook.io) — vendor-side outage?
docs\runbook.md:993:3. Mobile apps: GrowthBook React Native SDK caches the last successful fetch to local storage; existing sessions are unaffected.
docs\runbook.md:997:- Confirm `GROWTHBOOK_CLIENT_KEY` is the correct SDK key for the production environment (not staging).
docs\runbook.md:1000:- If a critical flag (e.g. `soft_launch_enabled`) must be toggled urgently during a GrowthBook outage, it can be forced via a direct API call to the Functions endpoint (endpoint to be added in a follow-up story — `PUT /api/v1/admin/flags/:name`). Until that endpoint exists, update the Azure Functions app setting `GROWTHBOOK_FALLBACK_FLAGS` with a JSON override and restart the Function App.
docs\runbook.md:1003:- Once GrowthBook CDN recovers, the next SDK evaluation cycle (every 60 s in the admin-web implementation) picks up fresh flags automatically. No restart needed.
docs\runbook.md:1008:**Owner / escalation:** GrowthBook OSS community / GitHub issues (self-hosted fallback is always an option — see ADR-0007).
docs\runbook.md:1128:   - `GROWTHBOOK_CLIENT_KEY` — production SDK key from GrowthBook Cloud console
docs\runbook.md:1140:4. **GrowthBook sanity.** Log into GrowthBook Cloud → confirm `soft_launch_enabled` is set to `false` (will be toggled on after this checklist).
docs\runbook.md:1148:8. **Go-live.** GrowthBook → `soft_launch_enabled` → set to `true`. Send invite to F&F users.
docs\runbook.md:1217:- **OP-A8** complements the GrowthBook soft-launch flag procedures in § Emergency Rollback — A8 is the vendor outage case; Emergency Rollback is the self-initiated kill-switch.
docs\design\_inventory\A1.json:680:      "purpose": "Authenticated app shell — verifies the hs_access JWT, provides auth + GrowthBook context, and renders Rail + Topbar + scrollable main.",
docs\design\_inventory\A1.json:685:        "<GrowthBookClientProvider> → <AdminAuthProvider> — layout.tsx:57-58",
docs\adr\0020-service-area-gating.md:28:3. **GrowthBook feature flag** `customer.service-area-gating.enabled` (default `false`) gating between:
docs\adr\0020-service-area-gating.md:64:- **Positive:** Fail-open GrowthBook flag design allows soak period (warn-only first week) before hard enforcement, reducing risk of false-positive rejections of legitimate Ayodhya customers.
docs\adr\0019-periodic-tech-location.md:29:A **GrowthBook kill-switch** (`customer.periodic-location.enabled`, default off) gates the FCM publish step. When off, the Cosmos write still happens (admin observability is preserved) but no live pin appears in customer-app.
docs\adr\0019-periodic-tech-location.md:66:Flip `customer.periodic-location.enabled` to `false` in GrowthBook. FCM publishes stop immediately (within the next flag refresh). Cosmos writes continue — admin dashboard retains location observability. Tech-app continues calling the endpoint (Cosmos upsert still happens); deploy a client-side flag to stop the foreground service if needed.
docs\launch-checklist.md:11:- [ ] `GROWTHBOOK_CLIENT_KEY` set in Azure Functions app settings
docs\launch-checklist.md:18:- [ ] GrowthBook: `soft_launch_enabled = false` initially (gate closed until go-live)
docs\launch-checklist.md:19:- [ ] GrowthBook: `marketing_pause_enabled = false` (not paused)
docs\launch-checklist.md:28:- [ ] Verify GrowthBook dashboard reachable and flag states correct
docs\launch-checklist.md:36:- [ ] Enable `soft_launch_enabled = true` in GrowthBook
docs\launch-checklist.md:46:Immediately disable `soft_launch_enabled` in GrowthBook if any of these occur:
docs\stories\E01-S03-android-app-skeletons.md:85:- **And** at least these test files exist and pass in each app: `BuildInfoProviderTest.kt` (pure unit — no Android framework), `SentryInitializerTest.kt` (verifies no-op when DSN is empty, init-once when set — mocks `io.sentry.android.core.SentryAndroid`), `SmokeScreenPaparazziTest.kt` (Paparazzi — counts toward coverage of Compose composables)
docs\stories\E01-S03-android-app-skeletons.md:101:- **And** `BuildConfig.SENTRY_DSN` (injected from an optional `SENTRY_DSN` env var at build time, empty string default) is the empty string
docs\stories\E01-S03-android-app-skeletons.md:102:- **Then** `SentryInitializer.init(application)` returns without calling `SentryAndroid.init { ... }` — verified in `SentryInitializerTest.kt` via MockK
docs\stories\E01-S03-android-app-skeletons.md:103:- **Given** `BuildConfig.SENTRY_DSN` is a non-empty DSN
docs\stories\E01-S03-android-app-skeletons.md:106:- **And** `@opentelemetry/*` / `io.opentelemetry.*` / `io.sentry.opentelemetry.*` packages are **NOT** added in this story — defer entirely, mirroring the E01-S01 + E01-S02 deferrals. A single TODO comment in `SentryInitializer.kt` points at the future observability story
docs\stories\E01-S03-android-app-skeletons.md:158:  - [x] T3.2 Create each app's `app/build.gradle.kts`: plugins (AGP, Kotlin 2, Compose, Hilt, KSP, Kover, Detekt, ktlint, Paparazzi), `android { }` block per AC-10, `buildFeatures { compose = true; buildConfig = true }`, `kotlinOptions` with `-Werror` + explicit-api + JVM_17, `buildConfigField("String", "SENTRY_DSN", "\"${System.getenv("SENTRY_DSN") ?: ""}\"")` + `GIT_SHA` (`System.getenv("GIT_SHA") ?: "dev"`)
docs\stories\E01-S03-android-app-skeletons.md:164:  - [x] T4.2 (GREEN) Implement `app/src/main/kotlin/com/homeservices/{customer,technician}/HomeservicesCustomerApplication.kt` / `HomeservicesTechnicianApplication.kt` annotated `@HiltAndroidApp`, `onCreate()` calls `SentryInitializer.init(this)`
docs\stories\E01-S03-android-app-skeletons.md:179:  - [x] T6.1 (RED) Write `SentryInitializerTest.kt` — MockK `io.sentry.android.core.SentryAndroid`; two cases: DSN empty → `init` never called; DSN set → `init` called once with `tracesSampleRate = 0.1`
docs\stories\E01-S03-android-app-skeletons.md:180:  - [x] T6.2 (GREEN) Implement `observability/SentryInitializer.kt` reading `BuildConfig.SENTRY_DSN`; early-return on blank; TODO comment pointing at the future observability story (mirrors `api/bootstrap.ts`)
docs\stories\E01-S03-android-app-skeletons.md:181:  - [x] T6.3 Wire `SentryInitializer.init(this)` into `Application.onCreate()` (already done in T4.2)
docs\stories\E01-S03-android-app-skeletons.md:290:│       │       │   └── SentryInitializer.kt            CREATE (early-return on empty DSN)
docs\stories\E01-S03-android-app-skeletons.md:300:│       │   │   ├── observability/SentryInitializerTest.kt  CREATE (MockK on SentryAndroid)
docs\stories\E01-S03-android-app-skeletons.md:334:- **Test names** are full sentences as Kotlin method names with backticks: `` `SentryInitializer does not call SentryAndroid init when DSN is blank`() `` — matches the test-name style already set in `api/` and `admin-web/`.
docs\stories\E01-S03-android-app-skeletons.md:341:| **Observability bootstrap** | `observability/SentryInitializer.kt` (this story) | Read `BuildConfig.SENTRY_DSN`; early-return when blank. Single entry point. Never call `SentryAndroid.init` directly from a feature-module Application or Activity. |
docs\stories\E01-S03-android-app-skeletons.md:356:- **Detected variance vs template:** baseline `customer-app/` + `technician-app/` are both literally an empty `app/src/main/` + a ship.yml at the wrong path + template-residue dirs (`docs/`, `plans/`, `specs/`). The template's CLAUDE.md promises Kotlin + Compose + Hilt + Room + Ktor + Sentry + GrowthBook + PostHog + Detekt + ktlint + Android Lint + JUnit 5 + MockK + Espresso + Paparazzi — this story installs the first four layers (Kotlin + Compose + Hilt + Sentry) + the first three test layers (JUnit 5 + MockK + Paparazzi) and defers Room + Ktor + GrowthBook + PostHog + Espresso to stories where they're first used.
docs\stories\E01-S03-android-app-skeletons.md:365:4. **OTel is not a clean no-op (E01-S01, E01-S02):** defer entirely; do NOT add `io.opentelemetry.*` or Sentry's OTel bridge. Single TODO comment in `SentryInitializer.kt`.
docs\stories\E01-S03-android-app-skeletons.md:483:8. **Do NOT introduce OpenTelemetry (`io.opentelemetry.*` or `io.sentry.opentelemetry.*`).** Defer entirely, matching the E01-S01 + E01-S02 precedents. Single TODO comment in `SentryInitializer.kt`.
docs\stories\E01-S03-android-app-skeletons.md:494:19. **Do NOT add `PostHog` or `GrowthBook` SDKs in this story.** Both are approved OSS but neither is exercised yet; adding them here forces config decisions (API key plumbing, opt-in gating) that belong with the first real event / flag story.
docs\stories\E01-S03-android-app-skeletons.md:545:5. **Sentry init location** — `Application.onCreate()` (standard) vs `@HiltAndroidApp` + an `ApplicationInitializer` pattern via `androidx.startup:startup-runtime`? **Recommendation:** plain `Application.onCreate()` call to `SentryInitializer.init(this)`. AndroidX App Startup is overkill for one initializer; introduces without benefit. Confirm.
docs\proposals\client-proposal-tiered-hindi.md:599:| Monitoring | Sentry + PostHog + CloudWatch |
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:96:- **And** `SENTRY_DSN` env var (or `NEXT_PUBLIC_SENTRY_DSN` for client) is **not** set (default for local dev + CI)
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:111:- **And** `admin-web/.env.example` committed with **no real secrets** — only `SENTRY_DSN=`, `NEXT_PUBLIC_SENTRY_DSN=`, `NEXT_PUBLIC_POSTHOG_KEY=`, `GROWTHBOOK_CLIENT_KEY=` stub keys (empty values); `admin-web/.env.local` is gitignored (verify and add to root `.gitignore` if missing)
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:158:  - [x] T6.2 Rewrite `admin-web/src/instrumentation.ts` as: read `SENTRY_DSN`; if unset, early return; else import and call `Sentry.init({ dsn, tracesSampleRate: 0.1 })`. Add a TODO comment pointing to the future OTel story (mirror the api/ `bootstrap.ts` pattern).
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:159:  - [x] T6.3 Add `admin-web/src/sentry.client.config.ts` — init client SDK the same way, reading `NEXT_PUBLIC_SENTRY_DSN`
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:160:  - [x] T6.4 Add `admin-web/src/sentry.server.config.ts` for server-side runtime (re-reads `SENTRY_DSN`)
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:220:| **Zero paid SaaS** | ADR-0007 | Every dep on approved free-tier list. Storybook (OSS), Playwright (OSS), axe-core (OSS), Lighthouse CI (OSS), GrowthBook OSS self-hosted deferred to later story. |
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:307:| **Observability bootstrap** | `src/instrumentation.ts` (this story) | Read `SENTRY_DSN`; early-return if unset. Single entry point. Never call `Sentry.init()` directly in page/component code. |
docs\stories\E01-S02-admin-web-skeleton-landing-page.md:368:**Forbidden in this story (and generally, without ADR):** `redux`, `@reduxjs/toolkit`, `zustand`, `jotai`, `mobx` (use RSC + URL state + React state); `emotion`, `styled-components`, `stitches` (Tailwind is locked); `date-fns` and `dayjs` (native `Intl.DateTimeFormat`); `axios` (use native `fetch`); `lodash` (native ES2022); Chromatic (paid after 5k snapshots); `@vercel/analytics` (use PostHog); `react-router` (App Router).
docs\stories\E01-S01-api-skeleton-health-endpoint.md:71:- **And** `SENTRY_DSN` env var is **not** set (default for local dev + CI)
docs\stories\E01-S01-api-skeleton-health-endpoint.md:134:  - [x] T6.1 Add `src/observability/sentry.ts` — `initSentry()` early-returns if `SENTRY_DSN` is unset; otherwise calls `Sentry.init({ dsn, tracesSampleRate: 0.1 })`
docs\stories\E05-S02-dispatcher-engine.md:105:Three is the minimum that gives the customer redundancy if the closest tech declines or doesn't see the offer. One would mean every decline forces a re-dispatch, doubling p95 latency. Five would saturate the FCM fan-out for marginal gain — the 4th and 5th candidates are typically too far for good service. Three is the operator's pilot recommendation; it can be promoted to a PostHog-controlled variable if the dispatch funnel data justifies tuning.
docs\proposals\client-proposal-hindi.md:157:| Monitoring | **Sentry + PostHog + CloudWatch** | Bugs जल्दी पकड़े जाएँ, user behaviour समझ में आए |
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:21:| **E20-S13** | `AnalyticsTracker` singleton + 6 PostHog funnel events; `Crashlytics.recordException` at 4 failure paths |
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:116:// Null-safe PostHog facade — all capture calls are fire-and-forget
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:119:        runCatching { PostHog.capture(event, properties = properties) }
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:140:- Test: `capture() does not throw when PostHog is not initialized`
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:141:- Test: `capture() calls PostHog.capture with correct event name and properties`
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:143:**Commit message:** `feat(tech-app): E20-S13 observability — AnalyticsTracker + 6 PostHog funnel events + Crashlytics.recordException`
docs\superpowers\plans\2026-05-23-sprint8-techapp-high-items.md:276:- [ ] 6 PostHog events wired at correct callsites
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:117:  └── E18-S06   Customer-app: Sentry user-context + breadcrumbs on nav + PostHog events (or ADR to defer)  [Feature]
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:272:| 0022 (optional) | PostHog + OpenTelemetry deferral if not adopted | Eng | E18-S06 |
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:281:### Feature flags (GrowthBook)
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:297:### Observability (Sentry + PostHog)
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:300:- **PostHog event taxonomy** (E18-S06): minimal soft-launch set — `auth.{started,truecaller_success,otp_verified,signout}`, `catalogue.{viewed,category_tapped,service_tapped}`, `booking.{address_entered,slot_picked,summary_viewed,payment_initiated,payment_succeeded,payment_failed}`, `tracking.{opened,eta_shown,location_stale_warning_shown}`, `rating.{prompt_received,opened,submitted,shield_shown,shield_escalated}`, `complaint.{created,viewed,reopened}`, `sos.{consent_shown,countdown_started,sent,cancelled}`, `wallet.{opened,credit_visible,credit_applied}`. Alternative: ADR-0022 defers PostHog to Phase 2 if budget tight.
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:362:- **E18-S03** Shield bottom-sheet copy moved to HI strings (per spec verbatim). Tip-chip `TODO(C-19)` marker added with code reference to `AwaitingPartner` post-submit state. ADR-0024 documents the ≤2★ vs <3★ decision (recommend narrowing to ≤2★ unless launch-review math demands broader, with PostHog event to monitor).
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:365:- **E18-S06** `AppNavigation` calls `Sentry.setUser(User(id = sha256(uid).take(16)))` on `Authenticated`; `setUser(null)` on `Unauthenticated`. `NavController.OnDestinationChangedListener` adds breadcrumbs. PostHog client initialized (or ADR-0022 deferring it).
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:380:Flip flags in this order (each held for 24h with Sentry + PostHog observation):
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:393:- FCM delivery rate (PostHog) > 95% over 72h
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:414:- Feature flag created in GrowthBook and defaulted to `off`
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:427:| Service-area gating false negatives (real Ayodhya customer rejected) | Medium | High (lost booking) | Soft-launch flag warn-only first; PostHog event on every reject; manual polygon refinement over week 1 |
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:430:| FCM tray notification permission denial on Android 13+ | High | Medium (lost delivery) | Permission-rationale flow on first launch; in-app banner fallback for critical types; PostHog event on denial |
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:467:- `customer-app/app/src/main/kotlin/com/homeservices/customer/observability/SentryInitializer.kt` — already initialized; just bind user in AppNavigation
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:541:5. **Sentry / PostHog observation** — 24h: crash-free-session > 99.5%, FCM delivery > 95%
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:553:- E18-S06 PostHog (defer with ADR-0022)
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:564:3. **PostHog vs ADR-0022 deferral** — full PostHog instrumentation (~10 funnels) vs deferring all product analytics to Phase 2. **Plan defaults to ship PostHog minimal taxonomy** because soft-launch insight is too valuable to skip; ADR-0022 only if budget rejects.
docs\superpowers\plans\2026-05-12-customer-app-gap-closure-roadmap.md:577:- Sentry + PostHog (or ADR-0022) dashboards configured
docs\design\_inventory\_observations.json:4627:  "ev": "customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/SettingsGraph.kt:60 and customer-app/app/src/main/kotlin/com/homeservices/customer/domain/flags/GrowthBookFeatureFlags.kt:72"
technician-app\gradle\libs.versions.toml:135:growthbook-android = { module = "io.growthbook.sdk:GrowthBook", version.ref = "growthbook" }
docs\superpowers\specs\2026-05-16-week5-foundation-stories-design.md:77:  - GrowthBook flag `customer.periodic-location.enabled` gates the publish. When off, server still writes Cosmos (so admin observability works) but skips the FCM emit.
docs\stories\E10-S04-launch-readiness-gate.md:25:| AC-1 | GrowthBook `soft_launch_enabled` flag gates `createBooking`; fail-open on SDK error | ✅ |
docs\stories\E10-S04-launch-readiness-gate.md:30:| AC-6 | `api-ship.yml` warning step if `GROWTHBOOK_CLIENT_KEY` secret is missing | ✅ |
docs\stories\E10-S04-launch-readiness-gate.md:38:| `api/src/services/featureFlags.service.ts` | GrowthBook wrapper: `isSoftLaunchEnabled`, `isMarketingPaused` |
docs\stories\E10-S04-launch-readiness-gate.md:48:| `api/local.settings.example.json` | Added `GROWTHBOOK_API_HOST` + `GROWTHBOOK_CLIENT_KEY` placeholders |
docs\stories\E10-S04-launch-readiness-gate.md:59:- GrowthBook SDK timeout or throw
docs\stories\E10-S04-launch-readiness-gate.md:60:- Empty `GROWTHBOOK_CLIENT_KEY` (local dev)
docs\stories\E10-S04-launch-readiness-gate.md:74:`api/local.settings.json` is in `.gitignore` (Azure Functions convention). The new env vars are documented in `api/local.settings.example.json`. Local dev with empty `GROWTHBOOK_CLIENT_KEY` automatically fails open (never calls GrowthBook, never blocks bookings).
docs\stories\E10-S04-launch-readiness-gate.md:85:✓ isSoftLaunchEnabled > fails open when GrowthBook SDK throws
docs\stories\E10-S04-launch-readiness-gate.md:86:✓ isSoftLaunchEnabled > returns true when GROWTHBOOK_CLIENT_KEY is empty
docs\stories\E10-S04-launch-readiness-gate.md:89:✓ isMarketingPaused > fails open (returns false) when GrowthBook SDK throws
docs\stories\E10-S04-launch-readiness-gate.md:90:✓ isMarketingPaused > returns false when GROWTHBOOK_CLIENT_KEY is empty
technician-app\CLAUDE.md:13:- GrowthBook Android SDK (OSS)
technician-app\CLAUDE.md:14:- PostHog Android SDK
docs\reviews\codex-20260905-obs-keys.md:172:+// how customer-app shipped to Play with Sentry, PostHog and GrowthBook all inert.
docs\reviews\codex-20260905-obs-keys.md:176:+val sentryDsn = envOrLocalProperty("SENTRY_DSN") ?: ""
docs\reviews\codex-20260905-obs-keys.md:177:+val postHogApiKey = envOrLocalProperty("POSTHOG_API_KEY") ?: ""
docs\reviews\codex-20260905-obs-keys.md:178:+val growthBookClientKey = envOrLocalProperty("GROWTHBOOK_CLIENT_KEY") ?: ""
docs\reviews\codex-20260905-obs-keys.md:186:+// word — SentryInitializer returns on a blank DSN, PostHogAnalyticsFacade returns on a
docs\reviews\codex-20260905-obs-keys.md:187:+// blank API key, GrowthBook fetches nothing and every flag falls to its default. That
docs\reviews\codex-20260905-obs-keys.md:191:+//   SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
docs\reviews\codex-20260905-obs-keys.md:192:+//   POSTHOG_API_KEY=phc_<key>

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "PostHog|posthog|POSTHOG_API_KEY|GROWTHBOOK_CLIENT_KEY|GrowthBook|growthbook" -n customer-app/app/src customer-app/app/build.gradle.kts customer-app/gradle/libs.versions.toml' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 683ms:
customer-app/gradle/libs.versions.toml:29:growthbook = "7.1.1"
customer-app/gradle/libs.versions.toml:30:growthbookOkHttp = "1.0.8"
customer-app/gradle/libs.versions.toml:36:posthog = "3.44.1"
customer-app/gradle/libs.versions.toml:135:growthbook-android = { module = "io.growthbook.sdk:GrowthBook", version.ref = "growthbook" }
customer-app/gradle/libs.versions.toml:136:growthbook-okhttp = { module = "io.growthbook.sdk:NetworkDispatcherOkHttp", version.ref = "growthbookOkHttp" }
customer-app/gradle/libs.versions.toml:140:posthog-android = { module = "com.posthog:posthog-android", version.ref = "posthog" }
customer-app/app/build.gradle.kts:111:// how customer-app shipped to Play with Sentry, PostHog and GrowthBook all inert.
customer-app/app/build.gradle.kts:116:val postHogApiKey = envOrLocalProperty("POSTHOG_API_KEY") ?: ""
customer-app/app/build.gradle.kts:117:val growthBookClientKey = envOrLocalProperty("GROWTHBOOK_CLIENT_KEY") ?: ""
customer-app/app/build.gradle.kts:125:// word — SentryInitializer returns on a blank DSN, PostHogAnalyticsFacade returns on a
customer-app/app/build.gradle.kts:126:// blank API key, GrowthBook fetches nothing and every flag falls to its default. That
customer-app/app/build.gradle.kts:131://   POSTHOG_API_KEY=phc_<key>
customer-app/app/build.gradle.kts:132://   GROWTHBOOK_CLIENT_KEY=sdk-<key>
customer-app/app/build.gradle.kts:141:        "POSTHOG_API_KEY" to postHogApiKey,
customer-app/app/build.gradle.kts:142:        "GROWTHBOOK_CLIENT_KEY" to growthBookClientKey,
customer-app/app/build.gradle.kts:249:            "GROWTHBOOK_CLIENT_KEY",
customer-app/app/build.gradle.kts:254:            "POSTHOG_API_KEY",
customer-app/app/build.gradle.kts:827:    implementation(libs.posthog.android)
customer-app/app/build.gradle.kts:828:    implementation(libs.growthbook.android)
customer-app/app/build.gradle.kts:829:    implementation(libs.growthbook.okhttp)
customer-app/app/src\main\kotlin\com\homeservices\customer\di\BuildInfoProvider.kt:14:    /** PostHog project API key. Empty string in CI/debug builds without a key — init is skipped when blank. */
customer-app/app/src\main\kotlin\com\homeservices\customer\di\BuildInfoProvider.kt:15:    public val postHogApiKey: String = BuildConfig.POSTHOG_API_KEY
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:6:import com.posthog.android.PostHogAndroid
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:7:import com.posthog.android.PostHogAndroidConfig
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:22: * Unit tests for [PostHogAnalyticsFacade].
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:24: * [PostHogAndroid] is mocked via mockkObject so that setup() never touches the network.
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:25: * The key observable is the internal [posthogInitialized] AtomicBoolean:
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:32:public class PostHogAnalyticsFacadeTest {
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:38:        mockkObject(PostHogAndroid)
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:39:        every { PostHogAndroid.setup(any(), any<PostHogAndroidConfig>()) } returns Unit
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:47:    private fun buildFacade(apiKey: String): PostHogAnalyticsFacade {
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:49:        return PostHogAnalyticsFacade(context, buildInfo)
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:52:    private fun posthogInitialized(facade: PostHogAnalyticsFacade): Boolean {
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:53:        val field = PostHogAnalyticsFacade::class.java.getDeclaredField("posthogInitialized")
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:59:    public fun `posthogInitialized is false initially`() {
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:61:        assertThat(posthogInitialized(sut)).isFalse()
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:65:    public fun `applyConsent false does not set posthogInitialized`() {
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:68:        assertThat(posthogInitialized(sut)).isFalse()
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:72:    public fun `applyConsent true with blank key does not set posthogInitialized`() {
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:75:        assertThat(posthogInitialized(sut)).isFalse()
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:79:    public fun `applyConsent true with non-blank key sets posthogInitialized`() {
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:82:        assertThat(posthogInitialized(sut)).isTrue()
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:86:    public fun `track is no-op when posthogInitialized is false`() {
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:88:        // posthogInitialized is false — track should not throw
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:93:    public fun `identify is no-op when posthogInitialized is false`() {
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:99:    public fun `reset is no-op when posthogInitialized is false`() {
customer-app/app/src\test\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacadeTest.kt:109:        assertThat(posthogInitialized(sut)).isTrue()
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\flags\PhotoFirstCatalogueFeatureFlagTest.kt:11: * Verifies the safe-off default for both the BuildConfig and GrowthBook implementations.
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\flags\PhotoFirstCatalogueFeatureFlagTest.kt:23:    public fun `GrowthBookFeatureFlags photoFirstCatalogueEnabled defaults to false without live SDK`() {
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\flags\PhotoFirstCatalogueFeatureFlagTest.kt:24:        val sut = GrowthBookFeatureFlags(apiKey = "", analytics = noOpLazy)
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\flags\PhotoFirstCatalogueFeatureFlagTest.kt:29:    public fun `GrowthBookFeatureFlags implements FeatureFlags interface`() {
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\flags\PhotoFirstCatalogueFeatureFlagTest.kt:30:        val sut: FeatureFlags = GrowthBookFeatureFlags(apiKey = "", analytics = noOpLazy)
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlagsTest.kt:9: * GrowthBookFeatureFlags — unit tests.
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlagsTest.kt:16:public class GrowthBookFeatureFlagsTest {
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlagsTest.kt:22:        val flags = GrowthBookFeatureFlags(apiKey = "", analytics = noOpLazy)
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlagsTest.kt:28:        val flags = GrowthBookFeatureFlags(apiKey = "", analytics = noOpLazy)
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlagsTest.kt:33:    public fun `GrowthBookFeatureFlags implements FeatureFlags interface`() {
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlagsTest.kt:34:        val sut: FeatureFlags = GrowthBookFeatureFlags(apiKey = "", analytics = noOpLazy)
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\auth\AuthOrchestratorFlagOnTest.kt:28: *  - Set `GROWTHBOOK_CLIENT_KEY` env var in `customer-ship.yml` release env.
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\auth\AuthOrchestratorFlagOnTest.kt:29: *  - Configure `truecaller_server_verify_v2` flag in GrowthBook dashboard to
customer-app/app/src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:9:import com.homeservices.customer.domain.flags.GrowthBookFeatureFlags
customer-app/app/src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:13:import com.homeservices.customer.observability.analytics.PostHogAnalyticsFacade
customer-app/app/src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:36:        public fun growthBookFeatureFlags(): GrowthBookFeatureFlags
customer-app/app/src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:42:        public fun postHogAnalyticsFacade(): PostHogAnalyticsFacade
customer-app/app/src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:76:        //   2. A user who later revokes analytics/crash consent via Settings causes PostHog to opt out
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlags.kt:4:import com.sdk.growthbook.GBSDKBuilder
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlags.kt:5:import com.sdk.growthbook.GrowthBookSDK
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlags.kt:6:import com.sdk.growthbook.model.GBValue
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlags.kt:7:import com.sdk.growthbook.network.GBNetworkDispatcherOkHttp
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlags.kt:13: * GrowthBook-backed [FeatureFlags] implementation.
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlags.kt:15: * Uses the GrowthBook Cloud Free SDK (v7+). The client key is provided by
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlags.kt:16: * FeatureFlagsModule from the build-time `GROWTHBOOK_CLIENT_KEY` value.
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlags.kt:31:public class GrowthBookFeatureFlags
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlags.kt:34:        @Named("growthbook_api_key") private val apiKey: String,
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlags.kt:39:        private val sdk: GrowthBookSDK =
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlags.kt:42:                apiHost = "https://cdn.growthbook.io",
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\GrowthBookFeatureFlags.kt:61:         * Triggers a non-blocking background refresh of GrowthBook feature definitions
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\FeatureFlags.kt:10: * without requiring a live GrowthBook connection.
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\FeatureFlags.kt:12: * The GrowthBook-backed implementation is wired in E13-S05 (Wave 2).
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\FeatureFlags.kt:97:// GrowthBookFeatureFlags is defined in GrowthBookFeatureFlags.kt — stub removed to avoid redeclaration.
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\di\FeatureFlagsModule.kt:5:import com.homeservices.customer.domain.flags.GrowthBookFeatureFlags
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\di\FeatureFlagsModule.kt:19:    public abstract fun bindFeatureFlags(impl: GrowthBookFeatureFlags): FeatureFlags
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\di\FeatureFlagsModule.kt:23:        @Named("growthbook_api_key")
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\flags\di\FeatureFlagsModule.kt:24:        public fun provideGrowthBookApiKey(): String = BuildConfig.GROWTHBOOK_CLIENT_KEY
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\auth\VerifyTruecallerUseCase.kt:19: * This use case is invoked from [AuthViewModel] when the GrowthBook flag
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:5:import com.posthog.PostHog
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:6:import com.posthog.android.PostHogAndroid
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:7:import com.posthog.android.PostHogAndroidConfig
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:14:public class PostHogAnalyticsFacade
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:20:        private val posthogInitialized = AtomicBoolean(false)
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:26:         *  - A fresh-install user who grants consent mid-session gets PostHog initialized immediately.
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:27:         *  - A user who later revokes analytics consent via Settings causes PostHog to opt out
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:30:         * Thread-safe: [posthogInitialized] is an [AtomicBoolean]; opt-in/out calls are
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:31:         * wrapped in [runCatching] so a PostHog SDK failure never propagates to the caller.
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:35:                if (posthogInitialized.compareAndSet(false, true)) {
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:38:                        posthogInitialized.set(false) // allow retry if key becomes available
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:41:                    PostHogAndroid.setup(context, PostHogAndroidConfig(apiKey, "https://app.posthog.com"))
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:44:                    runCatching { PostHog.optIn() }
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:47:                if (posthogInitialized.get()) {
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:48:                    runCatching { PostHog.optOut() }
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:54:         * Initializes PostHog if [analyticsOptIn] is true and initialization has not yet occurred.
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:74:            if (!posthogInitialized.get()) return
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:76:                PostHog.capture(event, properties = properties)
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:84:            if (!posthogInitialized.get()) return
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:86:                PostHog.identify(userId, userProperties = traits)
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:91:            if (!posthogInitialized.get()) return
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:93:                PostHog.reset()
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\di\AnalyticsModule.kt:4:import com.homeservices.customer.observability.analytics.PostHogAnalyticsFacade
customer-app/app/src\main\kotlin\com\homeservices\customer\observability\analytics\di\AnalyticsModule.kt:16:    public abstract fun bindAnalyticsFacade(impl: PostHogAnalyticsFacade): AnalyticsFacade

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content CLAUDE.md -TotalCount 200; Get-Content customer-app\\CLAUDE.md -TotalCount 120; Get-Content technician-app\\CLAUDE.md -TotalCount 120" in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 751ms:
# homeservices-mvp â€” Project-Level CLAUDE.md

**Placeholder name:** `homeservices-mvp` (will be renamed once brand-name is locked in Phase 2)
**Owner:** Alok Tiwari
**Stack:** multi-repo monorepo â€” Kotlin+Compose (2 Android apps) + Next.js (admin) + Node (API)
**Build constraint:** â‚¹0/month operational infra at pilot scale (Firebase + Azure free tiers; FCM as universal messaging spine)

## Repository shape

```
/
â”œâ”€â”€ customer-app/       # Android (Kotlin + Compose) â€” customer-facing
â”œâ”€â”€ technician-app/     # Android (Kotlin + Compose) â€” vendor/partner-facing
â”œâ”€â”€ admin-web/          # Next.js 15 + TypeScript â€” owner dashboard
â”œâ”€â”€ api/                # Node 22 + TypeScript (Fastify/Hono) â€” backend
â”œâ”€â”€ docs/               # Project-level BMAD artifacts (PRD, architecture, ADRs, stories, threat-model, runbook, ux-design, brainstorm)
â”œâ”€â”€ tools/              # Cross-cutting scripts (mdâ†’docx converter, etc.)
â”œâ”€â”€ _bmad/              # BMAD method config + skills scaffolding
â””â”€â”€ _bmad-output/       # BMAD intermediate outputs (planning-artifacts/, implementation-artifacts/)
```

Each sub-project has its own `CLAUDE.md` with stack-specific rules. **This root file governs cross-cutting concerns only.**

## Production deployment ownership

- **Admin web canonical production frontend:** Azure Container Apps resource `aca-admin-homeservices-prod` in `rg-homeservices-prod`.
- **Canonical admin URL:** `https://aca-admin-homeservices-prod.icybush-b2e9c876.centralindia.azurecontainerapps.io`.
- **Canonical admin image registry:** GHCR image `ghcr.io/aloktiwarigit/urbanclap-dup-admin-web:<tag>`, updated on the ACA resource.
- **Admin API production backend:** Azure Functions resource `func-homeservices-prod`; admin-web must call it through same-origin `/admin-api/*` unless a task explicitly says otherwise.
- **Do not use Azure Static Web Apps for production admin validation or access.** Any `swa-homeservices-admin-prod`, `black-river-*.azurestaticapps.net`, or `.github/workflows/admin-ship.yml` references are legacy unless the user explicitly approves a new cutover.
- If admin deployment instructions conflict, ACA wins. Update the conflicting doc before proceeding.
- **Admin-web deploy runbook:** use `admin-web/CLAUDE.md` -> "Production deployment" for the exact Docker/GHCR/ACA PowerShell sequence and smoke checks. Do not deploy admin-web from `.github/workflows/admin-ship.yml`; that workflow is legacy SWA-oriented.

## Phase gate (enforced across all sub-projects)

**No `src/` or `app/src/` edits in any sub-project** until ALL of the following exist and are committed:

- `docs/prd.md` (BMAD Phase 2)
- `docs/ux-design.md` (BMAD Phase 3)
- `docs/architecture.md` (BMAD Phase 4)
- `docs/adr/0001-*.md` + subsequent ADRs (initial stack decisions)
- `docs/stories/` â€” at least one story file per sub-project
- `docs/threat-model.md` (STRIDE, Phase 4.5)
- `docs/runbook.md` (Phase 4.5)
- `.bmad-readiness-passed` marker

Per-sub-project hooks in `.claude/settings.json` enforce this. Root also enforces it.

## Model routing (within Claude Max)

**Mandatory self-selection rules live in `~/.claude/CLAUDE.md` â†’ "Model routing â€¦ MANDATORY self-selection".** Every session announces its tier on turn 1 and offers a downgrade prompt when the task fits Sonnet/Haiku. Do not silently stay on Opus.

Project-specific trigger map (overrides the generic tiers only where noted):

- **Opus 4.7 (1M ctx)** â€” BMAD Phase 2 (PRD), Phase 4 (architecture + cross-cutting ADRs), Phase 4.5 adversarial review, Codex review synthesis, plans for high-blast-radius stories (auth, payments, dispatch, Cosmos schema changes)
- **Sonnet 4.6 (default)** â€” per-story implementation, TDD cycles, BMAD Phase 3 (UX), 4.5 stub-filling, Phase 5 (epics/stories â€” parallel per epic), routine debugging
- **Haiku 4.5** â€” codemod fanouts: renames, mechanical refactors, lint-fix passes, doc-index updates, Paparazzi golden re-records driven by a mechanical rule

Dispatch subagents in parallel whenever tasks are independent (e.g. 3 epics being decomposed into stories simultaneously). Subagents inherit the parent's model unless the dispatch explicitly picks a cheaper tier â€” prefer `model: "sonnet"` or `"haiku"` on the Agent call when the subtask is mechanical.

## Per-story execution (mandatory flow)

### Story ceremony tiers â€” scale effort to blast radius

Before invoking any planning skill, classify the story into one of three tiers.

| Tier | When | Ceremony | Target wall-clock |
|---|---|---|---|
| **Foundation** | E01-* stories, migrations, architectural refactors, new module introductions, auth/security-sensitive work | Brainstorm â†’ plan (4-6 work streams, parallel agent dispatch) â†’ execute â†’ smoke gate â†’ Codex + /security-review (parallel) + CI | 3.5â€“4.5h |
| **Feature** | E02+ user-facing stories, new screens, endpoints built on existing foundation | Plan (brainstorm embedded, â‰¤800 lines) â†’ execute (same session, default) â†’ smoke gate â†’ Codex + CI | 1.5â€“2.5h |
| **Codemod / mechanical** | Renames, lint sweeps, doc-index updates, libs sync | No brainstorm, no plan doc. One-shot Haiku execution. | 30â€“45min |

**TDD + smoke gate + Codex + CI are non-negotiable across ALL tiers.**

### Work-stream structure (Foundation + Feature plans)

Plans use work streams instead of micro-tasks. Streams run in dependency order; independent streams dispatch as parallel agents.

```
WS-A: Domain models + data layer
      [customer-app or technician-app: sealed classes, SessionManager, Room/Prefs, ProGuard rules]
      Runs first. WS-B depends on WS-A types.

WS-B: Use cases + orchestrator  (parallel per use case â€” each is independent)
      [TruecallerUseCase, FirebaseOtpUseCase, BiometricGateUseCase, etc. â€” fan out to subagents]
      TDD: test file first, then implementation. Runs after WS-A models are committed.

WS-C: Hilt DI module + security gates  (parallel with WS-D after WS-B)
      [AuthModule, @Binds/@Provides, ProGuard keep rules, AndroidManifest entries]
      Runs parallel with WS-D.

WS-D: Compose UI + ViewModel + Navigation + Paparazzi  (parallel with WS-C)
      [ViewModel â†’ Screen â†’ AppNavigation â†’ MainActivity integration â†’ Paparazzi test stubs]
      Runs parallel with WS-C. Paparazzi goldens recorded on CI only (see docs/patterns/paparazzi-cross-os-goldens.md).

WS-E: Pre-Codex smoke gate â†’ review
      bash tools/pre-codex-smoke.sh <customer-app|technician-app>
      Runs after WS-B/C/D complete. Non-zero exit = stop and fix before Codex.
      Then: codex review --base main AND /security-review (auth/payment/dispatch stories) simultaneously.
```

For API (`api/`) stories: WS-A = Cosmos schema + Zod types, WS-B = repo + service + controller, WS-C = Semgrep rules + auth middleware, WS-D = (skip), WS-E = `bash tools/pre-codex-smoke-api.sh`.
For web (`admin-web/`) stories: WS-A = API types, WS-B = Next.js API routes, WS-C = auth guards, WS-D = React components + Storybook, WS-E = `bash tools/pre-codex-smoke-web.sh`.

### Story size gate (mandatory at plan-write time)

After drafting a plan, check its line count before committing:

```bash
wc -l plans/E##-S##*.md
# Feature tier: >500 lines â†’ warning; >800 lines â†’ split required
# Foundation tier: >1200 lines â†’ warning; >1500 lines â†’ split required
```

**Split rule:** If any 3 of the following are true, split by layer:
- New files > 20
- All 4 Android layers touched (domain + data + UI + nav)
- â‰¥2 external SDK integrations
- â‰¥10 test files required

**Split pattern:** Story A = WS-A + WS-B (domain + data); Story B = WS-C + WS-D (DI + UI), depends on A.

### Foundation-tier flow

For each foundation-tier story in `docs/stories/`:

1. Fresh session â†’ `/superpowers:brainstorming` (explore design before code)
2. `/superpowers:writing-plans` â†’ commit `plans/<story-id>.md` using work-stream structure above. Auth/RLS/money/crypto: fresh session for context quarantine; all other Foundation stories: same session permitted.
3. `/superpowers:executing-plans` â†’ dispatch parallel agents per work stream using `superpowers:dispatching-parallel-agents`. Fan out WS-B use cases to separate Sonnet subagents (each owns one use case + its test file).
4. TDD per work stream: test file committed before implementation file. Work-stream TDD completion IS verification â€” no separate verify step.
5. **Pre-Codex smoke gate (mandatory):**
   ```bash
   bash tools/pre-codex-smoke.sh <customer-app|technician-app>
   # Non-zero exit = stop and fix before invoking /codex-review-gate
   ```
6. **Review gate â€” local only (no CI ceremony):**
   - `codex review --base main` â†’ `.codex-review-passed` (local, before push)
   - `/security-review` (auth/payment/dispatch/PII trigger) â€” local, parallel with Codex
   - Drop `/code-review`, `/bmad-code-review`, `/superpowers:requesting-code-review` â€” echo-chamber
7. `git push` â†’ PR auto-merges on CI green (no approval gate â€” solo project).
   **CI is lint + tests + Semgrep only.** BMAD gate and Codex marker check removed from CI â€” enforced locally.

### Feature-tier flow (lean)

1. `/superpowers:writing-plans` (brainstorm embedded; plan â‰¤800 lines; reference `docs/patterns/` for known gotchas)
2. `/superpowers:executing-plans` in same session. Fan out independent use cases as subagents if â‰¥3.
3. Pre-Codex smoke gate (same script as Foundation).
4. Codex review â†’ CI. `/security-review` only on auth/payment trigger.

### Android story invariants (all tiers)

- **libs.versions.toml sync:** First task of every `technician-app` story = copy `customer-app/gradle/libs.versions.toml` to `technician-app/gradle/libs.versions.toml`. Prevents post-Codex drift.
- **Paparazzi goldens:** Never record on Windows. Delete before push; trigger `paparazzi-record.yml` workflow_dispatch on CI. See `docs/patterns/paparazzi-cross-os-goldens.md`.
- **Known gotchas:** Every Android plan's opening section cites the relevant `docs/patterns/` files for Firebase, Hilt, Paparazzi, and explicit-API traps.

### Pattern library

`docs/patterns/` contains hard-won solutions from previous stories. Read before writing any plan that touches these areas:

| Pattern file | Read before... |
|---|---|
| `paparazzi-cross-os-goldens.md` | Any story adding or changing Compose screens |
| `firebase-callbackflow-lifecycle.md` | Any story with Firebase Auth, FCM, or async SDK callbacks |
| `firebase-errorcode-mapping.md` | Any story handling Firebase or payment error codes |
| `hilt-module-android-test-scope.md` | Any story introducing new Hilt-injected classes |
| `kotlin-explicit-api-public-modifier.md` | Any story adding new public Kotlin files |

## Zero-cost infra (the binding architectural constraint)

Every architectural decision across all sub-projects must preserve â‚¹0/month operational cost at pilot scale (â‰¤5,000 bookings/mo). See `docs/architecture.md` for the service-by-service free-tier budget.

Summary of the â‚¹0 stack:

| Concern | Service | Free tier ceiling |
|---|---|---|
| Backend compute | Azure Functions (Consumption) | 1M execs + 400k GB-sec/mo |
| Database | Azure Cosmos DB (Serverless) | 1000 RU/s + 25 GB forever |
| Messaging / real-time | FCM (Firebase Cloud Messaging) | Unlimited forever |
| Auth | Firebase Phone Auth + Truecaller SDK + Google Sign-In | <100 SMS/mo at steady state |
| Photo storage | Firebase Storage | 5 GB + 1 GB/day download |
| Web admin hosting | Azure Container Apps (Consumption) + GHCR | Keep min replicas 0 / max replicas 1 for pilot cost control |
| Maps | Google Maps Platform | $200/mo recurring credit |
| Payments | Razorpay | â‚¹0 onboarding (2% of GMV txn fee) |
| KYC | DigiLocker (Govt of India) | Free Aadhaar consent |
| Email | Azure Communication Services | 100 emails/day |
| Analytics | PostHog Cloud | 1M events/mo |
| Errors | Sentry | 5k errors/mo |
| ML | Azure ML | 8 hrs/mo compute |
| CI | GitHub Actions | 2000 mins/mo |

**Any PR that introduces a paid SaaS dependency must create an ADR and get explicit user approval.**

## Enterprise floor (ships with every template)

Every sub-project's template includes:

- `.github/workflows/ship.yml` â€” type-check, lint, tests â‰¥80% coverage, Semgrep, axe-core (web), Lighthouse CI (web), Codex review marker check, BMAD artifact gate
- Sentry + OpenTelemetry instrumentation
- GrowthBook OSS feature flags
- Storybook (web) / Paparazzi (Android) screenshot tests
# Client Project â€” Enterprise Baseline (Android / Kotlin + Compose)

## Phase gate

Same as Next.js template. `app/src/main/` is off-limits until all BMAD artifacts exist and `.bmad-readiness-passed` is committed. See `.claude/settings.json`.

## Stack

- Kotlin (with `-Werror`, strict null, explicit API mode)
- Jetpack Compose
- Hilt (DI), Room (local DB), Ktor (networking), Coroutines
- Sentry Android SDK
- GrowthBook Android SDK (OSS)
- PostHog Android SDK
- Detekt + ktlint + Android Lint
- JUnit 5 + MockK (unit), Espresso + Compose test (UI)
- Paparazzi (screenshot tests)

## CI

- Android Lint (0 warnings)
- ktlint, Detekt
- Unit tests â‰¥80% coverage (Kover)
- Compose screenshot diffs (Paparazzi)
- R8 / ProGuard release build
- Semgrep SAST (Kotlin ruleset)
- Play Store pre-submission: no `android:debuggable`, `usesCleartextTraffic="false"` except dev

## Per-story flow
Same as Next.js: BMAD â†’ Superpowers plan â†’ fresh session execute â†’ TDD â†’ verify â†’ 5-layer review â†’ Codex â†’ CI.

## Android-specific pre-release checklist
- [ ] Signed release APK/AAB generated
- [ ] ProGuard rules verified (no release-breaking shrinkage)
- [ ] `baselineprofile` generated for cold-start perf
- [ ] Privacy policy URL set in Play Console
- [ ] Data safety form completed
- [ ] Screenshot tests pass on all supported densities
- [ ] Accessibility scanner (Google Accessibility Scanner) run on key flows
# Client Project â€” Enterprise Baseline (Android / Kotlin + Compose)

## Phase gate

Same as Next.js template. `app/src/main/` is off-limits until all BMAD artifacts exist and `.bmad-readiness-passed` is committed. See `.claude/settings.json`.

## Stack

- Kotlin (with `-Werror`, strict null, explicit API mode)
- Jetpack Compose
- Hilt (DI), Room (local DB), Ktor (networking), Coroutines
- Sentry Android SDK
- GrowthBook Android SDK (OSS)
- PostHog Android SDK
- Detekt + ktlint + Android Lint
- JUnit 5 + MockK (unit), Espresso + Compose test (UI)
- Paparazzi (screenshot tests)

## CI

- Android Lint (0 warnings)
- ktlint, Detekt
- Unit tests â‰¥80% coverage (Kover)
- Compose screenshot diffs (Paparazzi)
- R8 / ProGuard release build
- Semgrep SAST (Kotlin ruleset)
- Play Store pre-submission: no `android:debuggable`, `usesCleartextTraffic="false"` except dev

## Per-story flow
Same as Next.js: BMAD â†’ Superpowers plan â†’ fresh session execute â†’ TDD â†’ verify â†’ 5-layer review â†’ Codex â†’ CI.

## Android-specific pre-release checklist
- [ ] Signed release APK/AAB generated
- [ ] ProGuard rules verified (no release-breaking shrinkage)
- [ ] `baselineprofile` generated for cold-start perf
- [ ] Privacy policy URL set in Play Console
- [ ] Data safety form completed
- [ ] Screenshot tests pass on all supported densities
- [ ] Accessibility scanner (Google Accessibility Scanner) run on key flows

2026-09-05T21:08:52.317164Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content customer-app'"\\CLAUDE.md | ForEach-Object { '{0,4}: {1}' -f "'$i, $_; $i++ } | Select-Object -First 40' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 899ms:
   1: # Client Project â€” Enterprise Baseline (Android / Kotlin + Compose)
   2: 
   3: ## Phase gate
   4: 
   5: Same as Next.js template. `app/src/main/` is off-limits until all BMAD artifacts exist and `.bmad-readiness-passed` is committed. See `.claude/settings.json`.
   6: 
   7: ## Stack
   8: 
   9: - Kotlin (with `-Werror`, strict null, explicit API mode)
  10: - Jetpack Compose
  11: - Hilt (DI), Room (local DB), Ktor (networking), Coroutines
  12: - Sentry Android SDK
  13: - GrowthBook Android SDK (OSS)
  14: - PostHog Android SDK
  15: - Detekt + ktlint + Android Lint
  16: - JUnit 5 + MockK (unit), Espresso + Compose test (UI)
  17: - Paparazzi (screenshot tests)
  18: 
  19: ## CI
  20: 
  21: - Android Lint (0 warnings)
  22: - ktlint, Detekt
  23: - Unit tests â‰¥80% coverage (Kover)
  24: - Compose screenshot diffs (Paparazzi)
  25: - R8 / ProGuard release build
  26: - Semgrep SAST (Kotlin ruleset)
  27: - Play Store pre-submission: no `android:debuggable`, `usesCleartextTraffic="false"` except dev
  28: 
  29: ## Per-story flow
  30: Same as Next.js: BMAD â†’ Superpowers plan â†’ fresh session execute â†’ TDD â†’ verify â†’ 5-layer review â†’ Codex â†’ CI.
  31: 
  32: ## Android-specific pre-release checklist
  33: - [ ] Signed release APK/AAB generated
  34: - [ ] ProGuard rules verified (no release-breaking shrinkage)
  35: - [ ] `baselineprofile` generated for cold-start perf
  36: - [ ] Privacy policy URL set in Play Console
  37: - [ ] Data safety form completed
  38: - [ ] Screenshot tests pass on all supported densities
  39: - [ ] Accessibility scanner (Google Accessibility Scanner) run on key flows

2026-09-05T21:08:57.811416Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content customer-app'"\\app\\build.gradle.kts | ForEach-Object { if("'$i -ge 145 -and $i -le 180){ '"'{0,4}: {1}' -f "'$i, $_}; $i++ }; $i=1; Get-Content technician-app'"\\app\\build.gradle.kts | ForEach-Object { if("'$i -ge 145 -and $i -le 180){ '"'{0,4}: {1}' -f "'$i, $_}; $i++ }' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 731ms:
 145:         .sorted()
 146: 
 147: val allowBlankObservabilityKeys =
 148:     envOrLocalProperty("ALLOW_BLANK_OBSERVABILITY_KEYS")?.toBooleanStrictOrNull() ?: false
 149: 
 150: val verifyReleaseObservabilityKeys =
 151:     tasks.register("verifyReleaseObservabilityKeys") {
 152:         group = "verification"
 153:         description = "Fails a release build whose observability keys would be baked in blank."
 154:         // Captured at configuration time so the task body closes over plain data.
 155:         val missing = blankReleaseObservabilityKeys
 156:         val allowed = allowBlankObservabilityKeys
 157:         doLast {
 158:             if (missing.isEmpty()) return@doLast
 159:             val detail =
 160:                 buildString {
 161:                     appendLine("Release build would bake in blank keys: ${missing.joinToString(", ")}.")
 162:                     appendLine("Each one silently disables its feature at runtime â€” no crash, no log.")
 163:                     appendLine("Set them in local.properties or the environment, or acknowledge with")
 164:                     appendLine("ALLOW_BLANK_OBSERVABILITY_KEYS=true to ship without them on purpose.")
 165:                 }
 166:             if (allowed) {
 167:                 logger.warn("WARNING: $detail")
 168:             } else {
 169:                 throw GradleException(detail)
 170:             }
 171:         }
 172:     }
 173: 
 174: tasks.matching { it.name == "assembleRelease" || it.name == "bundleRelease" }.configureEach {
 175:     dependsOn(verifyReleaseObservabilityKeys)
 176: }
 177: 
 178: plugins {
 179:     alias(libs.plugins.android.application)
 180:     alias(libs.plugins.kotlin.android)
 145:         .sorted()
 146: 
 147: val allowBlankObservabilityKeys =
 148:     envOrLocalProperty("ALLOW_BLANK_OBSERVABILITY_KEYS")?.toBooleanStrictOrNull() ?: false
 149: 
 150: val verifyReleaseObservabilityKeys =
 151:     tasks.register("verifyReleaseObservabilityKeys") {
 152:         group = "verification"
 153:         description = "Fails a release build whose observability keys would be baked in blank."
 154:         // Captured at configuration time so the task body closes over plain data.
 155:         val missing = blankReleaseObservabilityKeys
 156:         val allowed = allowBlankObservabilityKeys
 157:         doLast {
 158:             if (missing.isEmpty()) return@doLast
 159:             val detail =
 160:                 buildString {
 161:                     appendLine("Release build would bake in blank keys: ${missing.joinToString(", ")}.")
 162:                     appendLine("Each one silently disables its feature at runtime â€” no crash, no log.")
 163:                     appendLine("Set them in local.properties or the environment, or acknowledge with")
 164:                     appendLine("ALLOW_BLANK_OBSERVABILITY_KEYS=true to ship without them on purpose.")
 165:                 }
 166:             if (allowed) {
 167:                 logger.warn("WARNING: $detail")
 168:             } else {
 169:                 throw GradleException(detail)
 170:             }
 171:         }
 172:     }
 173: 
 174: tasks.matching { it.name == "assembleRelease" || it.name == "bundleRelease" }.configureEach {
 175:     dependsOn(verifyReleaseObservabilityKeys)
 176: }
 177: 
 178: plugins {
 179:     alias(libs.plugins.android.application)
 180:     alias(libs.plugins.kotlin.android)

2026-09-05T21:09:02.914084Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content technician-app\\app\\build.gradle.kts | Select-Object -Skip 830 -First 80" in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 694ms:
    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.androidx.hilt.work)
    ksp(libs.androidx.hilt.compiler)

    testImplementation(libs.junit.jupiter)
    testImplementation(libs.junit.jupiter.api)
    testRuntimeOnly(libs.junit.jupiter.engine)
    // JUnit 4 vintage engine: required for Paparazzi @Rule-based tests under the JUnit 5 launcher
    testRuntimeOnly(libs.junit.vintage.engine)
    testImplementation(libs.mockk)
    testImplementation(libs.assertj.core)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.core)
    testImplementation(libs.hilt.testing)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.okhttp.mockwebserver)
    testImplementation(platform(libs.compose.bom))
    testImplementation(libs.compose.ui.test.junit4)
    kspTest(libs.hilt.compiler)
    kspTest(libs.androidx.hilt.compiler)

    androidTestImplementation(libs.hilt.testing)
    androidTestImplementation(libs.androidx.test.runner)
    kspAndroidTest(libs.hilt.compiler)
}

sentry {
    // Upload ProGuard mappings only when Sentry credentials are actually present.
    //
    // The plugin resolves org/project/token from SENTRY_ORG, SENTRY_PROJECT and
    // SENTRY_AUTH_TOKEN. No workflow in .github/workflows/ sets any of them, so with
    // autoUploadProguardMapping hardcoded to true every release build failed at
    // :app:uploadSentryProguardMappingsRelease with:
    //
    //     error: An organization ID or slug is required (provide with --org)
    //
    // That has broken technician-ship on main since 2026-05-23 (last green run
    // 26343728547, 21:14), when the Sentry plugin landed in fe8a9a3b.
    //
    // Gating on the credentials keeps upload working wherever they ARE configured â€” a
    // local release build with a token, or CI once the secrets are added â€” while letting
    // credential-less builds succeed instead of failing on an unconfigurable step.
    val hasSentryCredentials =
        !System.getenv("SENTRY_AUTH_TOKEN").isNullOrBlank() &&
            !System.getenv("SENTRY_ORG").isNullOrBlank()

    // BOTH flags are required. autoUploadProguardMapping alone is not enough â€” it controls
    // whether the upload runs automatically, but the task is still created and wired into
    // assembleRelease by includeProguardMapping (default true), so the build still fails on
    // the unconfigurable step. Gating includeProguardMapping removes the task entirely when
    // there are no credentials to use it with.
    includeProguardMapping.set(hasSentryCredentials)
    autoUploadProguardMapping.set(hasSentryCredentials)
    ignoredBuildTypes.set(setOf("debug"))
}

tasks.register<Exec>("verifyDesignTokenUsage") {
    description = "Fail if raw Color or off-scale spacing/radius token debt grows."
    group = "verification"
    workingDir = rootProject.projectDir.parentFile
    commandLine("python", "tools/verify-android-design-tokens.py", "technician-app")
}

tasks.named("detekt") { dependsOn("verifyDesignTokenUsage") }
tasks.named("check") { dependsOn("verifyDesignTokenUsage") }

2026-09-05T21:09:11.206570Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content tools\\pre-codex-smoke.sh -TotalCount 240" in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 675ms:
#!/usr/bin/env bash
# Pre-Codex smoke gate for Android sub-projects (customer-app / technician-app).
# Run this BEFORE /codex-review-gate. A non-zero exit means do NOT invoke Codex â€” fix the issue first.
# Usage: bash tools/pre-codex-smoke.sh <customer-app|technician-app>
#
# Steps:
#   1/6  assembleDebug    â€” compilation, missing deps, unresolved refs
#   2/6  ktlintCheck      â€” formatting
#   3/6  detekt           â€” static analysis (LongMethod, MagicNumber, ReturnCount, etc.)
#   4/6  lintDebug        â€” Android Lint (UnusedResources, MissingTranslation, ObsoleteSdkInt, etc.)
#   5/6  testDebugUnitTest â€” TDD invariant: all unit tests green
#   6/6  koverVerify      â€” coverage >= 80% threshold
#
# Note: steps 3+4 (detekt + lintDebug) were missing from the original gate and caused
# repeated CI fix-rounds in Week 2 (2026-05-12/13). Added in the Week 2 retrospective.
set -euo pipefail

APP_DIR="${1:?Usage: pre-codex-smoke.sh <customer-app|technician-app>}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPO_ROOT/$APP_DIR"

echo "=== Pre-Codex Smoke Gate: $APP_DIR ==="

echo "[1/6] assembleDebug â€” catches missing deps, broken imports, unresolved references..."
./gradlew assembleDebug --quiet 2>&1 | tail -30

echo "[2/6] ktlintCheck â€” formatting must be clean before Codex sees it..."
./gradlew ktlintCheck --quiet 2>&1 | tail -20

echo "[3/6] detekt â€” static analysis (LongMethod, MagicNumber, ReturnCount, NestedBlockDepth)..."
./gradlew detekt --quiet 2>&1 | tail -20

echo "[4/6] lintDebug â€” Android Lint (UnusedResources, MissingTranslation, ObsoleteSdkInt, Compose rules)..."
./gradlew lintDebug --quiet 2>&1 | tail -20

echo "[5/6] testDebugUnitTest â€” TDD invariant: all unit tests must be green..."
# -PexcludePaparazzi: Paparazzi snapshot tests require Linux font rendering; run on CI via paparazzi-record.yml
./gradlew testDebugUnitTest --quiet -PexcludePaparazzi 2>&1 | tail -30

echo "[6/6] koverVerify â€” coverage must meet >=80% threshold..."
# -PexcludePaparazzi here too: koverVerify depends on the unit-test tasks (including the RELEASE
# variant), so without the flag step 6 re-runs the very Paparazzi tests step 5 just excluded, and the
# gate fails on Windows with "Failed to init Bridge" for reasons unrelated to the change under test.
./gradlew koverVerify --quiet -PexcludePaparazzi 2>&1 | tail -10

echo ""
echo "=== Smoke gate PASSED â€” safe to invoke /codex-review-gate ==="

2026-09-05T21:09:16.983961Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
codex
The new release-key verifier is wired into release tasks that existing CI workflows run without providing the required keys or override, so the app quality gates will fail on clean PR/push runs.

Full review comments:

- [P1] Keep CI release builds runnable without local keys — C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:174-175
  When `customer-ship.yml` runs on PRs/pushes, it invokes `./gradlew assembleRelease` but does not populate `SENTRY_DSN`, `POSTHOG_API_KEY`, `GROWTHBOOK_CLIENT_KEY`, or `ALLOW_BLANK_OBSERVABILITY_KEYS`, and GitHub secrets are not exposed unless explicitly mapped. This new dependency therefore makes the required R8/ProGuard CI release build fail on every clean workflow run; the Android CI contract still includes that release build (`customer-app/CLAUDE.md:19-25`). Either inject/acknowledge the keys in CI or scope the hard gate away from the CI smoke release task.

- [P1] Keep technician CI release builds runnable without local keys — C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:174-175
  When `technician-ship.yml` runs on PRs/pushes, it invokes `./gradlew assembleRelease` and `./gradlew bundleRelease` without mapping the observability keys or `ALLOW_BLANK_OBSERVABILITY_KEYS` into the environment. Because this line now makes both tasks depend on the verifier, the required Android CI release build is blocked in a clean workflow run; the subproject CI contract still includes the R8/ProGuard release build (`technician-app/CLAUDE.md:19-25`). Add the CI env/override or avoid wiring this hard gate into the CI release-build check.
The new release-key verifier is wired into release tasks that existing CI workflows run without providing the required keys or override, so the app quality gates will fail on clean PR/push runs.

Full review comments:

- [P1] Keep CI release builds runnable without local keys — C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:174-175
  When `customer-ship.yml` runs on PRs/pushes, it invokes `./gradlew assembleRelease` but does not populate `SENTRY_DSN`, `POSTHOG_API_KEY`, `GROWTHBOOK_CLIENT_KEY`, or `ALLOW_BLANK_OBSERVABILITY_KEYS`, and GitHub secrets are not exposed unless explicitly mapped. This new dependency therefore makes the required R8/ProGuard CI release build fail on every clean workflow run; the Android CI contract still includes that release build (`customer-app/CLAUDE.md:19-25`). Either inject/acknowledge the keys in CI or scope the hard gate away from the CI smoke release task.

- [P1] Keep technician CI release builds runnable without local keys — C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:174-175
  When `technician-ship.yml` runs on PRs/pushes, it invokes `./gradlew assembleRelease` and `./gradlew bundleRelease` without mapping the observability keys or `ALLOW_BLANK_OBSERVABILITY_KEYS` into the environment. Because this line now makes both tasks depend on the verifier, the required Android CI release build is blocked in a clean workflow run; the subproject CI contract still includes the R8/ProGuard release build (`technician-app/CLAUDE.md:19-25`). Add the CI env/override or avoid wiring this hard gate into the CI release-build check.
