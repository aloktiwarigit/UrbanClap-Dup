2026-09-06T09:55:49.493251Z ERROR codex_models_manager::manager: failed to load models cache: missing field `supports_parallel_tool_calls` at line 132 column 5
OpenAI Codex v0.147.0
--------
workdir: C:\Alok\Business Projects\wt-obs-keys
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: high
reasoning summaries: none
session id: 01a07625-4808-7600-8c35-bdb754087371
--------
user
changes against 'main'
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 869ms:


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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force -Recurse -Filter AGENTS* | Select-Object FullName' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 4323ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --stat aab4fddc4809ea0b052cfbf648590098690158e7; git diff --name-status aab4fddc4809ea0b052cfbf648590098690158e7' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 879ms:
 .github/workflows/customer-ship.yml   |  6 +++
 .github/workflows/technician-ship.yml |  6 +++
 customer-app/app/build.gradle.kts     | 78 +++++++++++++++++++++++++++++++++--
 docs/runbook.md                       | 26 ++++++++++++
 technician-app/app/build.gradle.kts   | 78 +++++++++++++++++++++++++++++++++--
 5 files changed, 188 insertions(+), 6 deletions(-)
M	.github/workflows/customer-ship.yml
M	.github/workflows/technician-ship.yml
M	customer-app/app/build.gradle.kts
M	docs/runbook.md
M	technician-app/app/build.gradle.kts
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff aab4fddc4809ea0b052cfbf648590098690158e7 -- .github/workflows/customer-ship.yml .github/workflows/technician-ship.yml customer-app/app/build.gradle.kts technician-app/app/build.gradle.kts docs/runbook.md' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 756ms:
diff --git a/.github/workflows/customer-ship.yml b/.github/workflows/customer-ship.yml
index c63001d0..921ad0b0 100644
--- a/.github/workflows/customer-ship.yml
+++ b/.github/workflows/customer-ship.yml
@@ -29,6 +29,12 @@ permissions:
 env:
   GIT_SHA: ${{ github.sha }}
   FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'
+  # CI's release build is an R8/ProGuard compile check, and its AAB is a 7-day
+  # upload-artifact — nothing here is ever published to Play (that happens locally via
+  # tools/build-play-bundles.ps1). So CI acknowledges the blank observability keys rather
+  # than failing on them; the hard gate stays on the builds that actually ship.
+  # A CI AAB sideloaded for testing therefore reports no Sentry/PostHog/GrowthBook data.
+  ALLOW_BLANK_OBSERVABILITY_KEYS: 'true'
 
 jobs:
   quality-gate:
diff --git a/.github/workflows/technician-ship.yml b/.github/workflows/technician-ship.yml
index 9db9bdbf..e6281bc5 100644
--- a/.github/workflows/technician-ship.yml
+++ b/.github/workflows/technician-ship.yml
@@ -29,6 +29,12 @@ permissions:
 env:
   GIT_SHA: ${{ github.sha }}
   FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'
+  # CI's release build is an R8/ProGuard compile check, and its AAB is a 7-day
+  # upload-artifact — nothing here is ever published to Play (that happens locally via
+  # tools/build-play-bundles.ps1). So CI acknowledges the blank observability keys rather
+  # than failing on them; the hard gate stays on the builds that actually ship.
+  # A CI AAB sideloaded for testing therefore reports no Sentry/PostHog/GrowthBook data.
+  ALLOW_BLANK_OBSERVABILITY_KEYS: 'true'
 
 jobs:
   quality-gate:
diff --git a/customer-app/app/build.gradle.kts b/customer-app/app/build.gradle.kts
index fcb15b8e..5219d06b 100644
--- a/customer-app/app/build.gradle.kts
+++ b/customer-app/app/build.gradle.kts
@@ -101,8 +101,80 @@ val mapsApiKey =
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
@@ -145,7 +217,7 @@ android {
         buildConfigField(
             "String",
             "SENTRY_DSN",
-            "\"${System.getenv("SENTRY_DSN") ?: ""}\"",
+            buildConfigString(sentryDsn),
         )
         buildConfigField(
             "String",
@@ -175,12 +247,12 @@ android {
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
diff --git a/docs/runbook.md b/docs/runbook.md
index 6ab9c9fc..347705f1 100644
--- a/docs/runbook.md
+++ b/docs/runbook.md
@@ -619,6 +619,32 @@ Required env vars before enabling `soft_launch_enabled`:
 
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
+CI sets `ALLOW_BLANK_OBSERVABILITY_KEYS=true` in `customer-ship.yml` and `technician-ship.yml`:
+its release build is an R8/ProGuard compile check and its AAB is a 7-day `upload-artifact`, never
+published to Play. A CI AAB sideloaded for testing therefore reports nothing — use a locally built
+one when you need telemetry.
+
+
 ---
 
 ## Disaster Recovery Drill
diff --git a/technician-app/app/build.gradle.kts b/technician-app/app/build.gradle.kts
index e6810eb0..fb304eb7 100644
--- a/technician-app/app/build.gradle.kts
+++ b/technician-app/app/build.gradle.kts
@@ -101,8 +101,80 @@ val mapsApiKey =
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
@@ -147,7 +219,7 @@ android {
         buildConfigField(
             "String",
             "SENTRY_DSN",
-            "\"${System.getenv("SENTRY_DSN") ?: ""}\"",
+            buildConfigString(sentryDsn),
         )
         buildConfigField(
             "String",
@@ -172,12 +244,12 @@ android {
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
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path customer-app/app/build.gradle.kts -TotalCount 260' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 763ms:
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Observability and feature-flag keys.
//
// These resolve the same way as MAPS_API_KEY and the signing values: environment
// variable first, then local.properties. They used to read the environment only, so a
// release built from a shell without them exported silently baked in "" â€” and every
// consumer treats a blank key as "feature switched off" and returns quietly. That is
// how customer-app shipped to Play with Sentry, PostHog and GrowthBook all inert.
//
// verifyReleaseObservabilityKeys (below) now fails a release build that would repeat it.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
val sentryDsn = envOrLocalProperty("SENTRY_DSN") ?: ""
val postHogApiKey = envOrLocalProperty("POSTHOG_API_KEY") ?: ""
val growthBookClientKey = envOrLocalProperty("GROWTHBOOK_CLIENT_KEY") ?: ""

val releaseSigning = loadReleaseSigning()

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Release gate: a blank observability key must never reach Play again.
//
// Every consumer of these keys treats blank as "switched off" and returns without a
// word â€” SentryInitializer returns on a blank DSN, PostHogAnalyticsFacade returns on a
// blank API key, GrowthBook fetches nothing and every flag falls to its default. That
// silence is the whole problem, so the build says it out loud instead.
//
// Set them per app in local.properties (not committed) or export them before building:
//   SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
//   POSTHOG_API_KEY=phc_<key>
//   GROWTHBOOK_CLIENT_KEY=sdk-<key>
//
// To ship without one on purpose, set ALLOW_BLANK_OBSERVABILITY_KEYS=true. That is an
// explicit, per-build acknowledgement and still prints a warning â€” the point is that
// nobody discovers it months later from an empty dashboard.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
val blankReleaseObservabilityKeys =
    mapOf(
        "SENTRY_DSN" to sentryDsn,
        "POSTHOG_API_KEY" to postHogApiKey,
        "GROWTHBOOK_CLIENT_KEY" to growthBookClientKey,
    ).filterValues { it.isBlank() }
        .keys
        .sorted()

val allowBlankObservabilityKeys =
    envOrLocalProperty("ALLOW_BLANK_OBSERVABILITY_KEYS")?.toBooleanStrictOrNull() ?: false

val verifyReleaseObservabilityKeys =
    tasks.register("verifyReleaseObservabilityKeys") {
        group = "verification"
        description = "Fails a release build whose observability keys would be baked in blank."
        // Captured at configuration time so the task body closes over plain data.
        val missing = blankReleaseObservabilityKeys
        val allowed = allowBlankObservabilityKeys
        doLast {
            if (missing.isEmpty()) return@doLast
            val detail =
                buildString {
                    appendLine("Release build would bake in blank keys: ${missing.joinToString(", ")}.")
                    appendLine("Each one silently disables its feature at runtime â€” no crash, no log.")
                    appendLine("Set them in local.properties or the environment, or acknowledge with")
                    appendLine("ALLOW_BLANK_OBSERVABILITY_KEYS=true to ship without them on purpose.")
                }
            if (allowed) {
                logger.warn("WARNING: $detail")
            } else {
                throw GradleException(detail)
            }
        }
    }

tasks.matching { it.name == "assembleRelease" || it.name == "bundleRelease" }.configureEach {
    dependsOn(verifyReleaseObservabilityKeys)
}

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
            buildConfigString(sentryDsn),
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
            buildConfigString(growthBookClientKey),
        )
        buildConfigField(
            "String",
            "POSTHOG_API_KEY",
            buildConfigString(postHogApiKey),
        )
        manifestPlaceholders["MAPS_API_KEY"] = mapsApiKey
    }

    buildTypes {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git show aab4fddc4809ea0b052cfbf648590098690158e7:customer-app/app/build.gradle.kts | Select-Object -First 130' in C:\Alok\Business Projects\wt-obs-keys
2026-09-06T09:56:18.174727Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 1.5 seconds
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

android {
    namespace = "com.homeservices.customer"
    compileSdk = 35

    if (releaseSigning != null) {
        signingConfigs {
            create("release") {
                storeFile = releaseSigning.storeFile
                storePassword = releaseSigning.storePassword
                keyAlias = releaseSigning.keyAlias

 exited 1 in 1510ms:
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

android {
    namespace = "com.homeservices.customer"
    compileSdk = 35

    if (releaseSigning != null) {
        signingConfigs {
            create("release") {
                storeFile = releaseSigning.storeFile
                storePassword = releaseSigning.storePassword
                keyAlias = releaseSigning.keyAlias

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content .github/workflows/customer-ship.yml; Get-Content .github/workflows/technician-ship.yml' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 674ms:
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
  # CI's release build is an R8/ProGuard compile check, and its AAB is a 7-day
  # upload-artifact â€” nothing here is ever published to Play (that happens locally via
  # tools/build-play-bundles.ps1). So CI acknowledges the blank observability keys rather
  # than failing on them; the hard gate stays on the builds that actually ship.
  # A CI AAB sideloaded for testing therefore reports no Sentry/PostHog/GrowthBook data.
  ALLOW_BLANK_OBSERVABILITY_KEYS: 'true'

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
  # CI's release build is an R8/ProGuard compile check, and its AAB is a 7-day
  # upload-artifact â€” nothing here is ever published to Play (that happens locally via
  # tools/build-play-bundles.ps1). So CI acknowledges the blank observability keys rather
  # than failing on them; the hard gate stays on the builds that actually ship.
  # A CI AAB sideloaded for testing therefore reports no Sentry/PostHog/GrowthBook data.
  ALLOW_BLANK_OBSERVABILITY_KEYS: 'true'

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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content customer-app/settings.gradle.kts; Get-Content technician-app/settings.gradle.kts' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 669ms:
includeBuild("../design-system")
includeBuild("../core-nav")

pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
        mavenCentral()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "homeservices-customer"
include(":app")
includeBuild("../design-system")
includeBuild("../core-nav")

pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
        mavenCentral()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "homeservices-technician"
include(":app")

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content tools/build-play-bundles.ps1' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 678ms:
param(
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

$apps = @(
    @{
        Name = "customer"
        Prefix = "CUSTOMER"
        Directory = Join-Path $repoRoot "customer-app"
        Bundle = "app\build\outputs\bundle\release\app-release.aab"
    },
    @{
        Name = "technician"
        Prefix = "TECHNICIAN"
        Directory = Join-Path $repoRoot "technician-app"
        Bundle = "app\build\outputs\bundle\release\app-release.aab"
    }
)

function Read-LocalProperties($path) {
    $properties = @{}
    if (-not (Test-Path -LiteralPath $path)) {
        return $properties
    }

    foreach ($line in Get-Content -LiteralPath $path) {
        $trimmed = $line.Trim()
        if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) {
            continue
        }

        $parts = $trimmed -split "=", 2
        if ($parts.Count -eq 2 -and $parts[0].Trim().Length -gt 0) {
            $properties[$parts[0].Trim()] = $parts[1].Trim()
        }
    }

    return $properties
}

function Get-ReleaseProperty($properties, $prefix, $name) {
    $prefixedName = "${prefix}_${name}"
    $prefixedEnv = [Environment]::GetEnvironmentVariable($prefixedName)
    if (-not [string]::IsNullOrWhiteSpace($prefixedEnv)) {
        return $prefixedEnv
    }

    $env = [Environment]::GetEnvironmentVariable($name)
    if (-not [string]::IsNullOrWhiteSpace($env)) {
        return $env
    }

    if ($properties.ContainsKey($prefixedName) -and -not [string]::IsNullOrWhiteSpace($properties[$prefixedName])) {
        return $properties[$prefixedName]
    }

    if ($properties.ContainsKey($name) -and -not [string]::IsNullOrWhiteSpace($properties[$name])) {
        return $properties[$name]
    }

    return $null
}

function Assert-GoogleServicesNotStub($app) {
    $gsFile = Join-Path $app.Directory "app\google-services.json"
    if (-not (Test-Path -LiteralPath $gsFile -PathType Leaf)) {
        throw "google-services.json not found for $($app.Name)-app at $gsFile. The committed file is a stub; the real one is materialised by CI from the GOOGLE_SERVICES_JSON secret. For local Play AAB builds, drop the real file at this path before re-running."
    }

    $content = Get-Content -LiteralPath $gsFile -Raw
    if ($content -match "PROJECT_ID_PLACEHOLDER" -or $content -match "AIzaSyPLACEHOLDER" -or $content -match "PROJECT_NUMBER_PLACEHOLDER") {
        throw "google-services.json for $($app.Name)-app contains placeholder markers (SEC-01 stub). Refusing to build a release AAB with stub Firebase config â€” Auth/FCM would be broken in the published app. Replace the stub with the real google-services.json from Firebase Console (or restore from your GOOGLE_SERVICES_JSON GitHub secret) before re-running."
    }
}

function Assert-SigningConfig($app) {
    $propertiesPath = Join-Path $app.Directory "local.properties"
    $properties = Read-LocalProperties $propertiesPath
    $required = @(
        "RELEASE_STORE_FILE",
        "RELEASE_STORE_PASSWORD",
        "RELEASE_KEY_ALIAS",
        "RELEASE_KEY_PASSWORD"
    )

    $missing = @()
    foreach ($name in $required) {
        $value = Get-ReleaseProperty $properties $app.Prefix $name
        if ([string]::IsNullOrWhiteSpace($value)) {
            $missing += $name
        }
    }

    if ($missing.Count -gt 0) {
        throw "Missing release signing values for $($app.Name)-app: $($missing -join ', '). Add them to $propertiesPath or set $($app.Prefix)_* env vars."
    }

    $storeFile = Get-ReleaseProperty $properties $app.Prefix "RELEASE_STORE_FILE"
    if ([IO.Path]::IsPathRooted($storeFile)) {
        $storePath = $storeFile
    } else {
        $storePath = Join-Path $app.Directory $storeFile
    }

    if (-not (Test-Path -LiteralPath $storePath -PathType Leaf)) {
        throw "Release keystore for $($app.Name)-app was not found at $storePath."
    }
}

foreach ($app in $apps) {
    Assert-GoogleServicesNotStub $app
    Assert-SigningConfig $app

    $tasks = @()
    if ($Clean) {
        $tasks += "clean"
    }
    $tasks += ":app:bundleRelease"

    Push-Location $app.Directory
    try {
        Write-Host "Building $($app.Name)-app release bundle..."
        & ".\gradlew.bat" @tasks
        if ($LASTEXITCODE -ne 0) {
            throw "$($app.Name)-app Gradle build failed with exit code $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }

    $bundlePath = Join-Path $app.Directory $app.Bundle
    if (-not (Test-Path -LiteralPath $bundlePath -PathType Leaf)) {
        throw "$($app.Name)-app bundle was not created at $bundlePath."
    }

    Write-Host "$($app.Name)-app AAB: $bundlePath"
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command ".\\gradlew.bat -q :app:tasks --all" in C:\Alok\Business Projects\wt-obs-keys\customer-app
2026-09-06T09:56:47.500164Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 9.2 seconds
Output:
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

 exited 1 in 9240ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Force customer-app\\.gradle, technician-app\\.gradle -ErrorAction SilentlyContinue | Select-Object FullName" in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 736ms:

FullName                                                                        
--------                                                                        
C:\Alok\Business Projects\wt-obs-keys\customer-app\.gradle\8.11                 
C:\Alok\Business Projects\wt-obs-keys\customer-app\.gradle\buildOutputCleanup   
C:\Alok\Business Projects\wt-obs-keys\customer-app\.gradle\configuration-cache  
C:\Alok\Business Projects\wt-obs-keys\customer-app\.gradle\vcs-1                
C:\Alok\Business Projects\wt-obs-keys\customer-app\.gradle\file-system.probe    
C:\Alok\Business Projects\wt-obs-keys\technician-app\.gradle\8.11               
C:\Alok\Business Projects\wt-obs-keys\technician-app\.gradle\buildOutputCleanup 
C:\Alok\Business Projects\wt-obs-keys\technician-app\.gradle\configuration-cache
C:\Alok\Business Projects\wt-obs-keys\technician-app\.gradle\vcs-1              
C:\Alok\Business Projects\wt-obs-keys\technician-app\.gradle\file-system.probe  



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content technician-app/app/build.gradle.kts -TotalCount 270' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 698ms:
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Observability and feature-flag keys.
//
// These resolve the same way as MAPS_API_KEY and the signing values: environment
// variable first, then local.properties. They used to read the environment only, so a
// release built from a shell without them exported silently baked in "" â€” and every
// consumer treats a blank key as "feature switched off" and returns quietly. That is
// how customer-app shipped to Play with Sentry, PostHog and GrowthBook all inert.
//
// verifyReleaseObservabilityKeys (below) now fails a release build that would repeat it.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
val sentryDsn = envOrLocalProperty("SENTRY_DSN") ?: ""
val postHogApiKey = envOrLocalProperty("POSTHOG_API_KEY") ?: ""
val growthBookClientKey = envOrLocalProperty("GROWTHBOOK_CLIENT_KEY") ?: ""

val releaseSigning = loadReleaseSigning()

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Release gate: a blank observability key must never reach Play again.
//
// Every consumer of these keys treats blank as "switched off" and returns without a
// word â€” SentryInitializer returns on a blank DSN, PostHogAnalyticsFacade returns on a
// blank API key, GrowthBook fetches nothing and every flag falls to its default. That
// silence is the whole problem, so the build says it out loud instead.
//
// Set them per app in local.properties (not committed) or export them before building:
//   SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
//   POSTHOG_API_KEY=phc_<key>
//   GROWTHBOOK_CLIENT_KEY=sdk-<key>
//
// To ship without one on purpose, set ALLOW_BLANK_OBSERVABILITY_KEYS=true. That is an
// explicit, per-build acknowledgement and still prints a warning â€” the point is that
// nobody discovers it months later from an empty dashboard.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
val blankReleaseObservabilityKeys =
    mapOf(
        "SENTRY_DSN" to sentryDsn,
        "POSTHOG_API_KEY" to postHogApiKey,
        "GROWTHBOOK_CLIENT_KEY" to growthBookClientKey,
    ).filterValues { it.isBlank() }
        .keys
        .sorted()

val allowBlankObservabilityKeys =
    envOrLocalProperty("ALLOW_BLANK_OBSERVABILITY_KEYS")?.toBooleanStrictOrNull() ?: false

val verifyReleaseObservabilityKeys =
    tasks.register("verifyReleaseObservabilityKeys") {
        group = "verification"
        description = "Fails a release build whose observability keys would be baked in blank."
        // Captured at configuration time so the task body closes over plain data.
        val missing = blankReleaseObservabilityKeys
        val allowed = allowBlankObservabilityKeys
        doLast {
            if (missing.isEmpty()) return@doLast
            val detail =
                buildString {
                    appendLine("Release build would bake in blank keys: ${missing.joinToString(", ")}.")
                    appendLine("Each one silently disables its feature at runtime â€” no crash, no log.")
                    appendLine("Set them in local.properties or the environment, or acknowledge with")
                    appendLine("ALLOW_BLANK_OBSERVABILITY_KEYS=true to ship without them on purpose.")
                }
            if (allowed) {
                logger.warn("WARNING: $detail")
            } else {
                throw GradleException(detail)
            }
        }
    }

tasks.matching { it.name == "assembleRelease" || it.name == "bundleRelease" }.configureEach {
    dependsOn(verifyReleaseObservabilityKeys)
}

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
            buildConfigString(sentryDsn),
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
            buildConfigString(growthBookClientKey),
        )
        buildConfigField(
            "String",
            "POSTHOG_API_KEY",
            buildConfigString(postHogApiKey),
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

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path **/* -Pattern 'CUSTOMER_SENTRY|TECHNICIAN_SENTRY|SENTRY_DSN|POSTHOG_API_KEY|GROWTHBOOK_CLIENT_KEY|ALLOW_BLANK_OBSERVABILITY_KEYS' -CaseSensitive -ErrorAction SilentlyContinue | Select-Object Path,LineNumber,Line | Format-List" in C:\Alok\Business Projects\wt-obs-keys
2026-09-06T09:57:01.917115Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 1 seconds
Output:


Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\.env.example
LineNumber : 2
Line       : SENTRY_DSN=

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\.env.example
LineNumber : 5
Line       : NEXT_PUBLIC_SENTRY_DSN=

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\.env.example
LineNumber : 12
Line       : NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY=

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\CLAUDE.md
LineNumber : 90
Line       :   --build-arg NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY="$(Get-DotEnvValue 'NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY')" `

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\CLAUDE.md
LineNumber : 93
Line       :   --build-arg NEXT_PUBLIC_SENTRY_DSN="$(Get-DotEnvValue 'NEXT_PUBLIC_SENTRY_DSN')" `

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\Dockerfile
LineNumber : 23
Line       : ARG NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY=

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\Dockerfile
LineNumber : 26
Line       : ARG NEXT_PUBLIC_SENTRY_DSN=

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\Dockerfile
LineNumber : 38
Line       : ENV NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY=$NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\Dockerfile
LineNumber : 41
Line       : ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\README.md
LineNumber : 9
Line       : cp .env.example .env.local   # leave SENTRY_DSN blank for local dev

Path       : C:\Alok\Business Projects\wt-obs-keys\api\local.settings.example.json
LineNumber : 12
Line       :     "GROWTHBOOK_CLIENT_KEY": ""

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\device-test-findings-2026-05-19.md
LineNumber : 21
Line       : | SENTRY_DSN | ✗ missing — error tracking dark |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\device-test-findings-2026-05-19.md
LineNumber : 22
Line       : | POSTHOG_API_KEY | ✗ missing — analytics dark |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\device-test-findings-2026-05-19.md
LineNumber : 100
Line       : | P2 | Add ACS_CONNECTION_STRING, SENTRY_DSN, POSTHOG_API_KEY to Function App | Alok (infra) |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\launch-checklist.md
LineNumber : 11
Line       : - [ ] `GROWTHBOOK_CLIENT_KEY` set in Azure Functions app settings

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\launch-readiness.md
LineNumber : 59
Line       : - [ ] All required app settings configured: `COSMOS_CONNECTION_STRING`, `COSMOS_DATABASE`, 
             `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `ACS_CONNECTION_STRING`, 
             `SENTRY_DSN`, `POSTHOG_API_KEY`, `GROWTHBOOK_API_HOST`, `GROWTHBOOK_CLIENT_KEY`, 
             `WEBSITE_RUN_FROM_PACKAGE` (deleted per Oryx note), `SCM_DO_BUILD_DURING_DEPLOYMENT=true`, 
             `ENABLE_ORYX_BUILD=true`, `NPM_CONFIG_INCLUDE=dev`

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 612
Line       : | `GROWTHBOOK_CLIENT_KEY` | Azure Functions app settings | Required for soft-launch flag to work |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 630
Line       : | `SENTRY_DSN` | `SentryInitializer` returns early — no crash or error reporting at all |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 631
Line       : | `POSTHOG_API_KEY` | `PostHogAnalyticsFacade` returns early — no product analytics |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 632
Line       : | `GROWTHBOOK_CLIENT_KEY` | flags never fetch; every flag silently falls back to its default |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 637
Line       : To ship without one deliberately, set `ALLOW_BLANK_OBSERVABILITY_KEYS=true` — the build then warns

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 642
Line       : CI sets `ALLOW_BLANK_OBSERVABILITY_KEYS=true` in `customer-ship.yml` and `technician-ship.yml`:

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 1002
Line       : - Confirm `GROWTHBOOK_CLIENT_KEY` is the correct SDK key for the production environment (not staging).

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 1133
Line       :    - `GROWTHBOOK_CLIENT_KEY` — production SDK key from GrowthBook Cloud console

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S01.md
LineNumber : 35
Line       : | `api/src/observability/sentry.ts` | Create | `initSentry()` — early-return when `SENTRY_DSN` unset |

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S01.md
LineNumber : 651
Line       :     delete process.env.SENTRY_DSN;

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S01.md
LineNumber : 654
Line       :   it('does not call Sentry.init when SENTRY_DSN is unset', () => {

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S01.md
LineNumber : 659
Line       :   it('calls Sentry.init exactly once with DSN + tracesSampleRate when SENTRY_DSN is set', () => {

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S01.md
LineNumber : 660
Line       :     process.env.SENTRY_DSN = 'https://public@sentry.example.io/1';

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S01.md
LineNumber : 688
Line       :   const dsn = process.env.SENTRY_DSN;

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S02.md
LineNumber : 30
Line       : | `admin-web/.env.example` | Modify | Stub keys only — `SENTRY_DSN=`, `NEXT_PUBLIC_SENTRY_DSN=`, 
             `NEXT_PUBLIC_POSTHOG_KEY=`, `GROWTHBOOK_CLIENT_KEY=` |

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S02.md
LineNumber : 35
Line       : | `admin-web/src/instrumentation.ts` | Rewrite | Server-side Sentry init — early-return when `SENTRY_DSN` 
             unset |

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S02.md
LineNumber : 36
Line       : | `admin-web/src/instrumentation-client.ts` | Create | Client-side Sentry init — early-return when 
             `NEXT_PUBLIC_SENTRY_DSN` unset |

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 7
Line       : **Architecture:** Two independent Gradle roots (no root-of-repo Gradle) with duplicated 
             `libs.versions.toml` catalogs enforced byte-identical by a CI drift check; Kotlin 2 K2 compiler with 
             `allWarningsAsErrors = true` + `-Xexplicit-api=strict` + `jvmTarget = JVM_17` + `jvmToolchain(21)`; 
             Compose via BOM pin; Hilt with KSP processor (not KAPT); Sentry initialised in `Application.onCreate()` 
             via a `SentryInitializer.init(this)` single-entry-point wrapper that early-returns on blank 
             `BuildConfig.SENTRY_DSN`; Paparazzi 1.3.5 JVM-only screenshot tests at `app/src/test/snapshots/images/`; 
             Robolectric for the Hilt wiring test (no emulator); Kover coverage thresholds 80/80/80; Detekt + ktlint + 
             Android Lint at zero-issues; two CI workflows at **repo-root** (`customer-ship.yml`, 
             `technician-ship.yml`) with `paths:` filter + `defaults.run.working-directory:` + `env.GIT_SHA` + the 
             **ancestor-check + scope-diff** codex-marker pattern copied verbatim from `api-ship.yml`.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 58
Line       : | `app/src/main/kotlin/com/homeservices/<app-kind>/observability/SentryInitializer.kt` | Create | 
             Early-return on blank `BuildConfig.SENTRY_DSN` |

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 539
Line       :             "SENTRY_DSN",

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 540
Line       :             "\"${System.getenv("SENTRY_DSN") ?: ""}\"",

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 1084
Line       :     public fun init(application: Application, dsn: String = BuildConfig.SENTRY_DSN) {




 exited 1 in 986ms:


Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\.env.example
LineNumber : 2
Line       : SENTRY_DSN=

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\.env.example
LineNumber : 5
Line       : NEXT_PUBLIC_SENTRY_DSN=

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\.env.example
LineNumber : 12
Line       : NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY=

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\CLAUDE.md
LineNumber : 90
Line       :   --build-arg NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY="$(Get-DotEnvValue 'NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY')" `

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\CLAUDE.md
LineNumber : 93
Line       :   --build-arg NEXT_PUBLIC_SENTRY_DSN="$(Get-DotEnvValue 'NEXT_PUBLIC_SENTRY_DSN')" `

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\Dockerfile
LineNumber : 23
Line       : ARG NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY=

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\Dockerfile
LineNumber : 26
Line       : ARG NEXT_PUBLIC_SENTRY_DSN=

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\Dockerfile
LineNumber : 38
Line       : ENV NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY=$NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\Dockerfile
LineNumber : 41
Line       : ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN

Path       : C:\Alok\Business Projects\wt-obs-keys\admin-web\README.md
LineNumber : 9
Line       : cp .env.example .env.local   # leave SENTRY_DSN blank for local dev

Path       : C:\Alok\Business Projects\wt-obs-keys\api\local.settings.example.json
LineNumber : 12
Line       :     "GROWTHBOOK_CLIENT_KEY": ""

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\device-test-findings-2026-05-19.md
LineNumber : 21
Line       : | SENTRY_DSN | ✗ missing — error tracking dark |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\device-test-findings-2026-05-19.md
LineNumber : 22
Line       : | POSTHOG_API_KEY | ✗ missing — analytics dark |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\device-test-findings-2026-05-19.md
LineNumber : 100
Line       : | P2 | Add ACS_CONNECTION_STRING, SENTRY_DSN, POSTHOG_API_KEY to Function App | Alok (infra) |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\launch-checklist.md
LineNumber : 11
Line       : - [ ] `GROWTHBOOK_CLIENT_KEY` set in Azure Functions app settings

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\launch-readiness.md
LineNumber : 59
Line       : - [ ] All required app settings configured: `COSMOS_CONNECTION_STRING`, `COSMOS_DATABASE`, 
             `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `ACS_CONNECTION_STRING`, 
             `SENTRY_DSN`, `POSTHOG_API_KEY`, `GROWTHBOOK_API_HOST`, `GROWTHBOOK_CLIENT_KEY`, 
             `WEBSITE_RUN_FROM_PACKAGE` (deleted per Oryx note), `SCM_DO_BUILD_DURING_DEPLOYMENT=true`, 
             `ENABLE_ORYX_BUILD=true`, `NPM_CONFIG_INCLUDE=dev`

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 612
Line       : | `GROWTHBOOK_CLIENT_KEY` | Azure Functions app settings | Required for soft-launch flag to work |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 630
Line       : | `SENTRY_DSN` | `SentryInitializer` returns early — no crash or error reporting at all |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 631
Line       : | `POSTHOG_API_KEY` | `PostHogAnalyticsFacade` returns early — no product analytics |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 632
Line       : | `GROWTHBOOK_CLIENT_KEY` | flags never fetch; every flag silently falls back to its default |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 637
Line       : To ship without one deliberately, set `ALLOW_BLANK_OBSERVABILITY_KEYS=true` — the build then warns

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 642
Line       : CI sets `ALLOW_BLANK_OBSERVABILITY_KEYS=true` in `customer-ship.yml` and `technician-ship.yml`:

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 1002
Line       : - Confirm `GROWTHBOOK_CLIENT_KEY` is the correct SDK key for the production environment (not staging).

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 1133
Line       :    - `GROWTHBOOK_CLIENT_KEY` — production SDK key from GrowthBook Cloud console

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S01.md
LineNumber : 35
Line       : | `api/src/observability/sentry.ts` | Create | `initSentry()` — early-return when `SENTRY_DSN` unset |

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S01.md
LineNumber : 651
Line       :     delete process.env.SENTRY_DSN;

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S01.md
LineNumber : 654
Line       :   it('does not call Sentry.init when SENTRY_DSN is unset', () => {

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S01.md
LineNumber : 659
Line       :   it('calls Sentry.init exactly once with DSN + tracesSampleRate when SENTRY_DSN is set', () => {

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S01.md
LineNumber : 660
Line       :     process.env.SENTRY_DSN = 'https://public@sentry.example.io/1';

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S01.md
LineNumber : 688
Line       :   const dsn = process.env.SENTRY_DSN;

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S02.md
LineNumber : 30
Line       : | `admin-web/.env.example` | Modify | Stub keys only — `SENTRY_DSN=`, `NEXT_PUBLIC_SENTRY_DSN=`, 
             `NEXT_PUBLIC_POSTHOG_KEY=`, `GROWTHBOOK_CLIENT_KEY=` |

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S02.md
LineNumber : 35
Line       : | `admin-web/src/instrumentation.ts` | Rewrite | Server-side Sentry init — early-return when `SENTRY_DSN` 
             unset |

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S02.md
LineNumber : 36
Line       : | `admin-web/src/instrumentation-client.ts` | Create | Client-side Sentry init — early-return when 
             `NEXT_PUBLIC_SENTRY_DSN` unset |

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 7
Line       : **Architecture:** Two independent Gradle roots (no root-of-repo Gradle) with duplicated 
             `libs.versions.toml` catalogs enforced byte-identical by a CI drift check; Kotlin 2 K2 compiler with 
             `allWarningsAsErrors = true` + `-Xexplicit-api=strict` + `jvmTarget = JVM_17` + `jvmToolchain(21)`; 
             Compose via BOM pin; Hilt with KSP processor (not KAPT); Sentry initialised in `Application.onCreate()` 
             via a `SentryInitializer.init(this)` single-entry-point wrapper that early-returns on blank 
             `BuildConfig.SENTRY_DSN`; Paparazzi 1.3.5 JVM-only screenshot tests at `app/src/test/snapshots/images/`; 
             Robolectric for the Hilt wiring test (no emulator); Kover coverage thresholds 80/80/80; Detekt + ktlint + 
             Android Lint at zero-issues; two CI workflows at **repo-root** (`customer-ship.yml`, 
             `technician-ship.yml`) with `paths:` filter + `defaults.run.working-directory:` + `env.GIT_SHA` + the 
             **ancestor-check + scope-diff** codex-marker pattern copied verbatim from `api-ship.yml`.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 58
Line       : | `app/src/main/kotlin/com/homeservices/<app-kind>/observability/SentryInitializer.kt` | Create | 
             Early-return on blank `BuildConfig.SENTRY_DSN` |

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 539
Line       :             "SENTRY_DSN",

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 540
Line       :             "\"${System.getenv("SENTRY_DSN") ?: ""}\"",

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 1084
Line       :     public fun init(application: Application, dsn: String = BuildConfig.SENTRY_DSN) {




exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --check aab4fddc4809ea0b052cfbf648590098690158e7' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 750ms:
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content .codex-review-passed' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 723ms:
{"timestamp":"2026-09-05T15:43:13Z","commit":"4de363f79d2a0b8dd88413c0abe22c95ea0cbb58","reviewer":"codex","rounds":7,"summary":"customer-app rating submit: failed submits keep the form and name the reason instead of a fake load error; escalation errors on their own channel; 6 P2 rounds fixed, round 7 clean; 20 new/updated tests; smoke gate 6/6"}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path customer-app/app/build.gradle.kts,technician-app/app/build.gradle.kts -Pattern 'flavor|productFlavors|buildTypes|release' | ForEach-Object { \""'$($_.Path):$($_.LineNumber):$($_.Line.Trim())" }' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 760ms:
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:36:data class ReleaseSigning(
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:47:fun releaseSigningProperty(name: String): String? =
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:51:fun resolveReleaseFile(path: String): File {
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:56:fun loadReleaseSigning(): ReleaseSigning? {
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:57:val storeFilePath = releaseSigningProperty("RELEASE_STORE_FILE")
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:58:val storePassword = releaseSigningProperty("RELEASE_STORE_PASSWORD")
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:59:val keyAlias = releaseSigningProperty("RELEASE_KEY_ALIAS")
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:60:val keyPassword = releaseSigningProperty("RELEASE_KEY_PASSWORD")
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:67:resolveReleaseFile(
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:69:"Missing RELEASE_STORE_FILE for release signing."
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:73:"Release signing store file not found at ${storeFile.absolutePath}."
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:76:return ReleaseSigning(
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:80:"Missing RELEASE_STORE_PASSWORD for release signing."
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:84:"Missing RELEASE_KEY_ALIAS for release signing."
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:88:"Missing RELEASE_KEY_PASSWORD for release signing."
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:109:// release built from a shell without them exported silently baked in "" — and every
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:113:// verifyReleaseObservabilityKeys (below) now fails a release build that would repeat it.
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:119:val releaseSigning = loadReleaseSigning()
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:122:// Release gate: a blank observability key must never reach Play again.
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:138:val blankReleaseObservabilityKeys =
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:150:val verifyReleaseObservabilityKeys =
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:151:tasks.register("verifyReleaseObservabilityKeys") {
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:153:description = "Fails a release build whose observability keys would be baked in blank."
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:155:val missing = blankReleaseObservabilityKeys
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:161:appendLine("Release build would bake in blank keys: ${missing.joinToString(", ")}.")
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:174:tasks.matching { it.name == "assembleRelease" || it.name == "bundleRelease" }.configureEach {
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:175:dependsOn(verifyReleaseObservabilityKeys)
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:197:if (releaseSigning != null) {
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:199:create("release") {
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:200:storeFile = releaseSigning.storeFile
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:201:storePassword = releaseSigning.storePassword
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:202:keyAlias = releaseSigning.keyAlias
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:203:keyPassword = releaseSigning.keyPassword
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:260:buildTypes {
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:264:release {
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:267:if (releaseSigning != null) {
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:268:signingConfig = signingConfigs.getByName("release")
C:\Alok\Business Projects\wt-obs-keys\customer-app\app\build.gradle.kts:306:checkReleaseBuilds = false
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:36:data class ReleaseSigning(
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:47:fun releaseSigningProperty(name: String): String? =
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:51:fun resolveReleaseFile(path: String): File {
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:56:fun loadReleaseSigning(): ReleaseSigning? {
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:57:val storeFilePath = releaseSigningProperty("RELEASE_STORE_FILE")
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:58:val storePassword = releaseSigningProperty("RELEASE_STORE_PASSWORD")
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:59:val keyAlias = releaseSigningProperty("RELEASE_KEY_ALIAS")
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:60:val keyPassword = releaseSigningProperty("RELEASE_KEY_PASSWORD")
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:67:resolveReleaseFile(
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:69:"Missing RELEASE_STORE_FILE for release signing."
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:73:"Release signing store file not found at ${storeFile.absolutePath}."
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:76:return ReleaseSigning(
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:80:"Missing RELEASE_STORE_PASSWORD for release signing."
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:84:"Missing RELEASE_KEY_ALIAS for release signing."
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:88:"Missing RELEASE_KEY_PASSWORD for release signing."
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:109:// release built from a shell without them exported silently baked in "" — and every
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:113:// verifyReleaseObservabilityKeys (below) now fails a release build that would repeat it.
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:119:val releaseSigning = loadReleaseSigning()
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:122:// Release gate: a blank observability key must never reach Play again.
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:138:val blankReleaseObservabilityKeys =
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:150:val verifyReleaseObservabilityKeys =
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:151:tasks.register("verifyReleaseObservabilityKeys") {
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:153:description = "Fails a release build whose observability keys would be baked in blank."
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:155:val missing = blankReleaseObservabilityKeys
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:161:appendLine("Release build would bake in blank keys: ${missing.joinToString(", ")}.")
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:174:tasks.matching { it.name == "assembleRelease" || it.name == "bundleRelease" }.configureEach {
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:175:dependsOn(verifyReleaseObservabilityKeys)
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:199:if (releaseSigning != null) {
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:201:create("release") {
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:202:storeFile = releaseSigning.storeFile
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:203:storePassword = releaseSigning.storePassword
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:204:keyAlias = releaseSigning.keyAlias
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:205:keyPassword = releaseSigning.keyPassword
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:263:buildTypes {
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:267:release {
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:271:if (releaseSigning != null) {
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:272:signingConfig = signingConfigs.getByName("release")
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:301:getByName("release").kotlin.srcDirs("src/release/kotlin")
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:311:checkReleaseBuilds = false
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:862:// autoUploadProguardMapping hardcoded to true every release build failed at
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:863:// :app:uploadSentryProguardMappingsRelease with:
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:871:// local release build with a token, or CI once the secrets are added — while letting
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:879:// assembleRelease by includeProguardMapping (default true), so the build still fails on
C:\Alok\Business Projects\wt-obs-keys\technician-app\app\build.gradle.kts:884:ignoredBuildTypes.set(setOf("debug"))

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content technician-app/app/build.gradle.kts | Select-Object -Skip 830 -First 80' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 767ms:
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

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path docs\\*.md,plans\\*.md,TOKEN-SYNC.md,CLAUDE.md,tools\\*.ps1,tools\\*.sh -Pattern 'customer.*Sentry|technician.*Sentry|CUSTOMER_.*SENTRY|TECHNICIAN_.*SENTRY|per app|app.*own' -CaseSensitive:"'$false -ErrorAction SilentlyContinue | Select-Object Path,LineNumber,Line | Format-List' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 1132ms:


Path       : C:\Alok\Business Projects\wt-obs-keys\docs\architecture.md
LineNumber : 105
Line       :   │  CUSTOMER APP        │  │  TECHNICIAN APP    │  │  OWNER WEB ADMIN   │

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\architecture.md
LineNumber : 198
Line       : **Decision:** Kotlin + Jetpack Compose (Android, ×2 apps) + Next.js 15 (owner admin) + Node 22 + Fastify 
             (API backend). Monorepo with `customer-app/`, `technician-app/`, `admin-web/`, `api/` subdirectories. 
             Shared `docs/` at root for BMAD artifacts.

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\brainstorm.md
LineNumber : 16
Line       : Small-scale (1 city max) **3-app home services marketplace** replicating Urban Company's **core business 
             loop only** — customer request → nearest qualified technician → FCM-push to owner → owner receives 
             payment → owner settles technician. Role-based visibility: customer sees their world, technician sees 
             theirs, owner sees everything.

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\brainstorm.md
LineNumber : 37
Line       : **Role-first brainstorming.** Each of the 3 app users — Customer, Technician, Owner — has a distinct 
             world of features needed. Each was brainstormed separately via Role Playing, then integrated via Mind 
             Mapping, refined via SCAMPER, and stress-tested via Reverse Brainstorming.

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\brainstorm.md
LineNumber : 115
Line       : | T-8 | In-Job Parts Catalog (Scan + Add) | Barcode-scan capacitor → preset price → customer approval → 
             line item | UC techs WhatsApp owner for approvals |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\brainstorm.md
LineNumber : 135
Line       : | T-23 | Rating Appeal with Evidence | <3★ disputed → evidence → owner review 48 hr → remove if valid | 
             UC ratings are immutable |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\brainstorm.md
LineNumber : 342
Line       : - **Reverse:** Let techs SEE demand heatmap in their app (with their ranking) — they self-route to hot 
             areas. Inversion: owner's tool becomes dispatch intelligence for techs.

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\play-store-release.md
LineNumber : 37
Line       : Generate one upload keystore per app and keep both files/passwords backed up outside the repo.

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\prd.md
LineNumber : 56
Line       : homeservices-mvp is a three-app home-services marketplace for India — Customer Android + Technician 
             Android + Owner web admin — replicating Urban Company's core booking loop (customer request → nearest 
             qualified technician → FCM notification to owner → owner receives payment → owner settles technician with 
             commission) at small scale (one city pilot) with two non-negotiable differentiators: **(a) impeccable 
             UI/UX at Airbnb/CRED tier to beat UC's 1.4★ customer experience, and (b) fair vendor economics (22–25% 
             commission vs UC's 28%) with transparent right-to-refuse-compliant dispatch architecture (defensive 
             against Karnataka Platform Workers Act + future state extensions; no decline-derived ranking) to attract 
             UC's discontented technicians post-Jan/Feb 2026 protests.**

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\prd.md
LineNumber : 82
Line       : - **Project type:** Multi-surface marketplace — primary: `mobile_app` (two Kotlin + Jetpack Compose 
             Android apps: customer-app, technician-app); secondary: `saas_b2b` (Next.js 15 + TypeScript owner web 
             admin); backend: `api_backend` (Node 22 + TypeScript on Azure Functions). Single-platform pilot (Android 
             + Web); iOS deferred to Phase 5 (post-MVP).

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\prd.md
LineNumber : 105
Line       : > These are the PRD-05 pilot acceptance criteria. All 5 gates must be green for ≥ 7 consecutive days 
             before graduating to public launch. Source: customer-app prod-readiness audit 2026-05-21 (lens 9 
             proposal, confirmed by owner).

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\prd.md
LineNumber : 285
Line       : Full complaints + both-way ratings moderation (O-20, O-21, C-22), coupons + referrals + loyalty (C-23, 
             C-24 gift, C-25 society-group), WhatsApp Business via Meta Cloud API free tier, Home Health hub (C-18, 
             C-20, C-21, C-26), voice-first + vernacular (C-29 in HI/TA/BN/TE/MR/KN), low-literacy visual (C-28), 
             caregiver dual-access (C-30), split-bill (C-32), wallet (C-33), GST mode (C-34), insurance claim 60-s 
             (C-37), diagnose quiz (C-13), society feed (C-14), emergency toggle (C-16), contextual tipping (C-19), 
             plus technician T-5/T-6/T-8/T-9/T-12/T-22/T-24, welfare T-17/T-18/T-19, career T-13/T-14/T-15/T-16, 
             community T-20/T-21, owner O-7 to O-12 management, O-15 GST register, O-16 to O-18 marketing, O-22 to 
             O-24 analytics, O-25 to O-27 catalog, O-29 RBAC, O-30 regulatory dashboard.

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\prd.md
LineNumber : 314
Line       : **Opening scene.** It's 9 PM on a Thursday. Riya's split AC is making a grinding noise. She's WFH 
             tomorrow with a 10 AM client call and she can't sleep in 36°C Bengaluru. She's used Urban Company twice 
             before and had mediocre experiences — the last tech arrived 2 hrs late, upcharged her by ₹800, and the 
             app made her feel like she didn't matter. A colleague mentioned homeservices-mvp launched in 
             Shantiniketan. She downloads it.

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\prd.md
LineNumber : 332
Line       : **Climax.** Ravi arrives at 11:26, apologises for the rush (though he had nothing to do with Ramesh), 
             does the deep clean. But Riya finds the kitchen floor still dirty near the stove. She rates 2★ and types 
             *"Ravi did most of the job well but kitchen stove area wasn't cleaned."* Before submitting, the app 
             intercepts: *"We're sorry. Want the owner to make this right before you post the 2★? Reply in 2 hours."*

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\prd.md
LineNumber : 340
Line       : **Opening scene.** Suresh quit Urban Company four months ago — 28% commission, opaque ratings, the 
             January 2026 protest got him ID-blocked for a week. Since then he's been doing independent work through a 
             WhatsApp group of 12 tech friends. A friend tells him homeservices-mvp is recruiting ITI-certified techs 
             in Faridabad with 22% commission. He's skeptical (heard it before) but desperate enough to download.

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\prd.md
LineNumber : 382
Line       : **Climax.** He navigates to Finance: payout queue for the week shows ₹1,82,400 for 38 techs. Numbers are 
             INR-formatted with lakh/crore grouping. He doesn't approve payouts — that's Alokt's authority — but he 
             can verify per-tech breakdowns are correct. He uses the Tech Roster screen to check if Ramesh (a tech 
             flagged yesterday) is still on-duty; sees Ramesh's status is `ऑफ ड्यूटी` and KYC is `लंबित` (pending). He 
             notes this for Alokt.

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\prd.md
LineNumber : 439
Line       : | **Central Social Security Code 2025 (rules notified 30 Dec 2025)** | All aggregators | 1–2% of GMV to 
             central social-security fund (capped at 5% of payments to workers); quarterly remittance; auto-calculated 
             in owner admin (O-30) |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\prd.md
LineNumber : 719
Line       : - Three-app role-based visibility (Customer / Technician / Owner) — Kotlin+Compose × 2 + Next.js × 1

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\prd.md
LineNumber : 999
Line       :   - Given an appeal is filed, When owner reviews, Then owner decides within 48 hours to: Uphold (rating 
             stays), Remove (rating deleted from tech's aggregate), or Partial-Remove (rating stays but is flagged as 
             disputed-visible-to-customer-only).

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\prd.md
LineNumber : 1093
Line       :   - Given a tech disputes an action taken against them (e.g., deactivation), When they request an appeal 
             (FR-5.7), Then the audit log entry is cited in the response; tech cannot view the log but owner can.

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\prd.md
LineNumber : 1103
Line       :   - Given owner selects a prior date, When filter applied, Then the same breakdown for that date is 
             shown; 30-day rolling chart visible.

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 12
Line       : **homeservices-mvp** is a three-app home-services marketplace for the Indian market — Customer Android, 
             Technician Android, Owner Web Admin — running on Azure (Functions Consumption + Cosmos DB Serverless + 
             Static Web Apps) and Firebase (FCM + Auth + Storage). Payments via Razorpay + Razorpay Route. KYC via 
             DigiLocker. Maps via Google Maps Platform.

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 84
Line       : - **Downstream outage:** check vendor status page; if confirmed outage, (a) post maintenance banner in 
             customer app (FCM topic `all_customers`), (b) pause new bookings if payment/dispatch critical dependency 
             is down, (c) extend complaint SLA by outage duration in owner admin.

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 228
Line       : 4. Initiate "force tech leave" via admin override; customer booking → `TECH_CANCELLED_SAFETY`; tech app 
             pushed: "Job cancelled by owner — leave premises immediately."

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 625
Line       : in Azure later has no effect. Each resolves from the environment first, then the app's own

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 840
Line       : - For **bookings hot partition** (e.g. all-customers-in-one-partition mistake — won't happen in current 
             schema where partition is `customerId`): add a salt to partition key for known-hot tenants.

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\runbook.md
LineNumber : 971
Line       : 3. Append the digest + range to `docs/audit-log-digests.md` (append-only file in repo, signed off by 
             owner each quarter).

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\threat-model.md
LineNumber : 134
Line       : | **R**epudiation | "I didn't make that payout approval" | L | H | Every admin action → audit_log 
             (immutable); monthly owner review; TOTP ensures it's really them | PM |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\threat-model.md
LineNumber : 267
Line       : | S-A3 | **Cross-provider auth-token confusion at admin boundary** — admin login accepts any valid 
             Firebase ID token whose `uid` matches an `adminUser` row (`login.ts:42-50`). A customer or technician 
             whose Firebase UID happens to collide with a (deleted, deactivated, but re-created) admin row would 
             authenticate as admin. Currently `adminUsers.id` is the Firebase UID, so an attacker who can provision 
             their own Firebase account with a chosen UID cannot collide — but Google Identity Platform's UID is 
             server-generated, so this is a defence by Firebase property, not code. | 
             `api/src/functions/admin/auth/login.ts:42-50` | 1 | 5 | Add explicit `provider === 'password'` (or 
             whatever admin-provider claim) check on the decoded ID token; reject Phone-Auth/Truecaller/Google-Sign-In 
             tokens at the admin boundary. | Medium; depends on Firebase provider claim | not-yet-mitigated |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\threat-model.md
LineNumber : 289
Line       : | I-A2 | **FCM topic payload PII leak** — `sendOwnerSosAlert` previously published `slotAddress` to topic 
             `owner_alerts`. **E11-S05b-2**: `slotAddress` removed; payload now contains only opaque IDs (`bookingId`, 
             `customerId`, `technicianId`, `incidentId`). Same applies to `customer_<uid>` (booking IDs, rating 
             prompts) and `technician_<uid>` (earnings, rating drafts). | `api/src/services/fcm.service.ts` 
             (sendOwnerSosAlert — updated); `api/src/services/device-token.service.ts` (E19-S02) | 2 | 2 | SOS path 
             mitigated by E11-S05b-2 (payload trim). **Mitigated by E19-S02**: switched all PII-bearing FCM sends to 
             device-token unicast — `customer_<uid>` and `technician_<uid>` topics retired; sends go to enrolled 
             device tokens only. Non-PII opt-in topics retained (ADR-0026). | Low — unicast eliminates subscriber 
             eavesdrop surface; residual only if device token store is compromised (separate threat) | mitigated 
             (E19-S02) |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\threat-model.md
LineNumber : 300
Line       : | D-L1 | **Location-endpoint flood / replay** — a rogue tech client (or a captured tech auth token) 
             pushes rapid-fire or replayed location updates to `POST /v1/technicians/active-job/{bookingId}/location`, 
             exhausting Cosmos RUs for the `live_locations` container and/or injecting stale/fake coordinates into the 
             customer's live-tracking pin. | `api/src/functions/active-job-location.ts` | 2 | 3 | **Mitigated by 
             E17-S02 (ADR-0019):** (a) token-bucket rate limit `1 req/15 s per bookingId` via `withRateLimit 
             keyExtractor`; (b) `capturedAt` freshness guard (±90 s window rejects replays); (c) assigned-tech-only 
             403 + booking-status 409 gates; (d) `attestation.isMock` flag logged to Sentry for investigation. Cosmos 
             TTL=3600 s caps container growth. | Low — residual: a determined attacker with the assigned tech's live 
             token can still push spoofed coordinates up to 4/min; hardware attestation (Play Integrity) on the 
             location path is a Phase 2 hardening. | mitigated (E17-S02) |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\threat-model.md
LineNumber : 357
Line       : | **S-W1d** | **Credit application on cancelled / no-show bookings** — A customer applies credit to a 
             booking that is later `CUSTOMER_CANCELLED` or `NO_SHOW_REDISPATCH`. The credit is consumed but the 
             booking never completes, so the customer effectively loses their credit for no service delivered. | 
             `bookings.ts` — no post-apply refund path yet | L-M (2) | M (3) — bad UX + customer complaint | 
             **Accepted for pilot.** Razorpay route refund cascade (E13-S04, Week 4) will add a refund event that 
             writes a `REFUND` ledger entry when a credit-applied booking is cancelled. Until then, credit is 
             non-refundable on cancellation — documented in T&C. | Medium — E13-S04 is the fix. Until it ships, a 
             cancelled credit-applied booking loses the credit. Owner aware and accepts for pilot. | not-yet-mitigated 
             (E13-S04 roadmap) |

Path       : C:\Alok\Business Projects\wt-obs-keys\docs\ux-design.md
LineNumber : 26
Line       :   three_apps: ['customer-android', 'technician-android', 'owner-web-admin']

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S02.md
LineNumber : 33
Line       : | `admin-web/app/page.tsx` | Create | Landing route — RSC; brand + tagline + owner-login CTA + footer 
             (build-info) |

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S02.md
LineNumber : 34
Line       : | `admin-web/app/login/page.tsx` | Create | 501 stub — "Owner sign-in coming in E02-S04" |

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S02.md
LineNumber : 94
Line       : 5. `admin-web/app/login/page.tsx` — 501 stub ("Owner sign-in coming in E02-S04"); RSC, token-only styling.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 5
Line       : **Goal:** Turn the two placeholder Android scaffolds (empty `app/src/main/`, ship.yml at sub-project 
             path, template residue) into two canonical `homeservices-customer` + `homeservices-technician` Kotlin 2 + 
             Jetpack Compose + Hilt + Paparazzi + Sentry skeletons that each render a smoke screen, build a debug APK, 
             and gate behind their own green `<app>-ship.yml` workflow at repo-root.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 31
Line       : Files created or modified in this story, listed per app with the divergences called out. **All paths 
             below repeat identically under `customer-app/` and `technician-app/` except where noted.** The 
             substitution table for Part 2 lives at Task 10.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 117
Line       : Customer-facing Android app for the homeservices-mvp platform. Kotlin 2 + Jetpack Compose + Material 3 + 
             Hilt + Sentry, targeting Android 8 (API 26) through Android 15 (API 35). Published to Google Play (deploy 
             story is separate).

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 975
Line       : ## Task 5: customer-app — SentryInitializer (TDD)

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 980
Line       : - Create: 
             `customer-app/app/src/test/kotlin/com/homeservices/customer/observability/SentryInitializerTest.kt`

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 981
Line       : - Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/observability/SentryInitializer.kt`

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 985
Line       : Create 
             `customer-app/app/src/test/kotlin/com/homeservices/customer/observability/SentryInitializerTest.kt`:

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 1063
Line       : ./gradlew :app:testDebugUnitTest --tests "com.homeservices.customer.observability.SentryInitializerTest"

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 1071
Line       : Create `customer-app/app/src/main/kotlin/com/homeservices/customer/observability/SentryInitializer.kt`:

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 1099
Line       : ./gradlew :app:testDebugUnitTest --tests "com.homeservices.customer.observability.SentryInitializerTest"

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 1108
Line       : git add customer-app/app/src/test/kotlin/com/homeservices/customer/observability/SentryInitializerTest.kt 
             \

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 1109
Line       :         customer-app/app/src/main/kotlin/com/homeservices/customer/observability/SentryInitializer.kt

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 1110
Line       : git commit -m "feat(customer-app): SentryInitializer with early-return on blank DSN — TDD RED→GREEN"

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 1403
Line       : import com.homeservices.customer.observability.SentryInitializer

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 1957
Line       : Commit message: `feat(technician-app): SentryInitializer with early-return on blank DSN — TDD RED→GREEN`

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S03.md
LineNumber : 2150
Line       : - Wires `customer-app/` and `technician-app/` into canonical Kotlin 2 + Jetpack Compose + Hilt + 
             Paparazzi + Sentry skeletons

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S04.md
LineNumber : 7
Line       : **Architecture:** Single-module composite build (`design-system/build.gradle.kts` IS the library module's 
             build — no nested `library/` directory) with `group = "com.homeservices"` + `rootProject.name = 
             "design-system"` so consumers depend on `com.homeservices:design-system`. UX §5 tokens implemented as: 
             (a) internal raw colour constants → public grouped object `HomeservicesColors` → Material 3 `ColorScheme` 
             mapping per story §"Color Slot Mapping"; (b) `HomeservicesExtendedColors` data class for non-M3 
             trust-badge tokens, exposed via `LocalHomeservicesExtendedColors`; (c) `HomeservicesTypography` with 
             Geist Sans Variable bundled at `res/font/geist_sans_variable.ttf` and four `Font(...)` entries with 
             `FontVariation.Settings(FontVariation.weight(...))` to access the variable weight axis correctly (Compose 
             1.7+ API); (d) `HomeservicesSpacing`/`HomeservicesRadius`/`HomeservicesElevation`/`HomeservicesMotion` as 
             typed objects (`Dp`, `Duration`, `Easing`) PLUS `staticCompositionLocalOf` `Local*` accessors for 
             Composable consumers. `HomeservicesTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable 
             () -> Unit)` installs all five `CompositionLocal`s plus M3 `ColorScheme`/`Typography`/`Shapes`. A 
             `TokenGallery` Composable + Paparazzi tests (light + dark, `RenderingMode.V_SCROLL` to capture full 
             content) gate the module pixel-by-pixel. Both apps' `settings.gradle.kts` add a single top-line 
             `includeBuild("../design-system")`; `app/build.gradle.kts` adds 
             `implementation("com.homeservices:design-system")`; placeholder theme files deleted; `MainActivity` + 
             `SmokeScreen` import switched; goldens re-recorded atomically per app. Three CI workflows independent; 
             cross-app catalog drift check stays on the two app catalogs only (third catalog has different dep surface 
             — no Hilt/Sentry/Activity); `tools/check-shared-versions.sh` enforces toolchain version parity across all 
             three.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E01-S04.md
LineNumber : 568
Line       : Each app in its own atomic commit (per AC-9 revision in brainstorm). T7 = customer-app; T8 = 
             technician-app.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E02-S02.md
LineNumber : 157
Line       : - Tests: `sendOtp` cancellation does not throw (firebase-callbackflow-lifecycle.md); `CodeSent` emission; 
             `AutoVerified` emission; `WrongCode` / `CodeExpired` / `RateLimited` mappings; unknown error → `General`

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E05-S03.md
LineNumber : 7
Line       : **Goal:** Add a full-screen Compose overlay to `technician-app/` that wakes up on FCM `JOB_OFFER` data 
             messages, renders rich job context (service, address, slot, distance, earnings) plus a 30-s countdown 
             ring with haptic feedback in the last 5 seconds, and provides large Accept (green) / Decline (outline) 
             buttons that hit the E05-S02 / E05-S04 backend. Sync the FCM token on login and on `onNewToken`.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E05-S03.md
LineNumber : 320
Line       :   > `feat(technician-app): E05-S03 — FCM job offer full-screen card with countdown`

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E05-S04.md
LineNumber : 296
Line       : > `authLevel: 'anonymous'` because Firebase ID token verification happens in `verifyTechnicianToken` — we 
             don't want Azure Functions' own key auth on top.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E06-S01.md
LineNumber : 1139
Line       :     const arg = appendCalls[0]![0] as Record<string, unknown>;

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E09-S02.md
LineNumber : 7
Line       : **Architecture:** Read-only Cosmos query on the `bookings` collection (partitioned by `/status`) via a 
             new repository layer. Two Azure Functions: `GET /v1/admin/orders` (filtered, paginated; supports 
             `pageSize=10000` for export) and `GET /v1/admin/orders/{id}`. Admin-web: Server Component shell at 
             `app/(dashboard)/orders/page.tsx` + `OrdersClient` (Client Component) owns URL-synced filter state via 
             `useSearchParams`/`useRouter`. Auth: `requireAdmin(['super-admin', 'ops-manager'])` on both API 
             endpoints; JWT gate already enforced by dashboard layout.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E09-S04b.md
LineNumber : 7
Line       : **Architecture:** Server Component shell at `app/(dashboard)/finance/page.tsx` that inherits the existing 
             JWT-gate dashboard layout. A `FinanceClient` client component owns state — date-range inputs, loading 
             flags, modal visibility. `PnLChart` is a pure recharts `BarChart` wrapper. `PayoutQueueTable` is a pure 
             presentational table. `ApproveAllModal` is an accessible dialog. All fetch calls go through 
             `src/api/finance.ts` wrappers.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E09-S05.md
LineNumber : 457
Line       :     const [doc] = mockAppendAuditEntry.mock.calls[0] as [Record<string, unknown>];

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E09-S05.md
LineNumber : 476
Line       :     const [doc] = mockAppendAuditEntry.mock.calls[0] as [Record<string, unknown>];

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E09-S05.md
LineNumber : 485
Line       :     const [doc] = mockAppendAuditEntry.mock.calls[0] as [Record<string, unknown>];

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E09-S05.md
LineNumber : 491
Line       :     mockAppendAuditEntry.mockRejectedValue(new Error('Cosmos down'));

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E09-S07b.md
LineNumber : 1251
Line       : | POST /v1/admin/customers/:id/refund-credit (Sentry logged) | Task A4 |

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E10-S02.md
LineNumber : 7
Line       : **Goal:** A quarterly Azure Functions timer (`0 0 0 1 1,4,7,10 *`) calculates 1 % of prior-quarter 
             completed-booking GMV, files a `PENDING_APPROVAL` `ssc_levies` doc, notifies the owner via FCM + ACS 
             email, and waits. A super-admin-only `POST /v1/admin/compliance/ssc-levy/{id}/approve` endpoint moves the 
             money via Razorpay Route transfer to the SSC fund account, with two-phase error handling so the ledger 
             never lies and `idempotencyKey` so retries never double-charge.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E10-S99-portal-hardening.md
LineNumber : 18
Line       : - `:3001` and `:3000` server-side fallbacks appear in **6 files**, not 1 — full sweep is now its own task 
             (B0).

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E11-S01a-1-core-nav-contracts.md
LineNumber : 262
Line       :    * which app owns them.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E11-S01a-1-core-nav-contracts.md
LineNumber : 1059
Line       :   The smoke harness only knows about the two app subprojects. core-nav has its own gradle wrapper.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E11-S01a-2-per-app-room.md
LineNumber : 7
Line       : **Architecture:** Both apps get an identically-shaped `data/pendingActions/` package under their own root 
             namespace. The DAO's `purgeExpired` constrains to `status='ACTIVE'` so `purgeTombstones` (30-day cutoff) 
             controls tombstone retention — the FCM TTL invariant from spec §2.10 (tombstone window > 28-day FCM max) 
             is enforced at the SQL level. `PendingActionStore` exposes `PendingAction` (domain type from `core-nav`); 
             `PendingActionEntity` (persistence type) never leaks past the store.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E11-S01a-3-typed-routes-spike.md
LineNumber : 7
Line       : **Architecture:** Add the `kotlinx-serialization` Gradle plugin + `kotlinx-serialization-json` library to 
             both apps' version catalogues and build files. Convert exactly four routes to Compose Nav 2.8 typed 
             `@Serializable` form (one no-arg + one one-arg per app), wired alongside the existing string-route graph 
             (not as replacements) so the experiment can be reverted without touching production routing. One 
             Paparazzi smoke per app demonstrates the typed route renders. The story closes with 
             `docs/superpowers/decisions/2026-05-XX-e11-s01a-spike-decision.md` — a GO/NO-GO artifact signed by the 
             owner. **GO** → S01b-1 plan-write proceeds with typed routes per spec §3.2/§3.3. **NO-GO** → spike code 
             is reverted, plugin + lib stay installed (cheap forward-compat), and 
             `docs/adr/00XX-route-contract-fallback.md` is committed before any S01b-1 plan-write begins. **No 
             mid-story pivot during S01b-1.**

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E11-S01a-3-typed-routes-spike.md
LineNumber : 12
Line       : **Produces:** kotlinx-serialization plugin + lib installed in both apps; 4 typed route data classes + 4 
             `composable<T>()` bindings; 2 Paparazzi smoke tests; 1 owner-visible go/no-go decision file. On NO-GO: 1 
             fallback ADR + reverted spike code.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E11-S01a-3-typed-routes-spike.md
LineNumber : 49
Line       : WS-C1 (plugin + lib install)  ─► WS-C2/C3 (typed routes per app, parallel) ─► WS-C4 (Paparazzi smoke per 
             app, parallel) ─► WS-D (smoke + Codex + GO/NO-GO gate)

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E11-S01a-3-typed-routes-spike.md
LineNumber : 355
Line       : ## WS-C4 — Paparazzi smoke per app (CI-recorded goldens)

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E11-S01a-3-typed-routes-spike.md
LineNumber : 357
Line       : One Paparazzi snapshot per app proves the typed route can be constructed and the destination screen 
             renders. Goldens are recorded on CI Linux only — never locally on Windows 
             (`docs/patterns/paparazzi-cross-os-goldens.md`).

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E11-S01a-3-typed-routes-spike.md
LineNumber : 558
Line       :   **Spike scope:** kotlinx-serialization 1.7.3 plugin + Compose Navigation 2.8.9 typed routes; 1 no-arg + 
             1 arg route per app; Paparazzi smoke per app.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E11-S01a-3-typed-routes-spike.md
LineNumber : 645
Line       :   - 4 typed routes (1 no-arg + 1 arg per app) added alongside existing string-route graph (additive, not 
             replacement).

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E11-S01a-3-typed-routes-spike.md
LineNumber : 646
Line       :   - Paparazzi smoke per app, goldens recorded via paparazzi-record.yml workflow_dispatch.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E11-S01a-3-typed-routes-spike.md
LineNumber : 704
Line       : Both apps return to current main with no diff. Spike abandoned; no decision artifact required because the 
             spike never ran. Owner is notified directly.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E11-S01a-3-typed-routes-spike.md
LineNumber : 718
Line       : - Spec §S01a-2 (the spike + go/no-go gate, isolated from §S01a-1's contracts + Room layer) coverage 
             walked: plugin install (C1), typed routes per app (C2 + C3), Paparazzi smoke per app (C4), pre-Codex 
             smoke (D1), Codex (D2), decision artifact (D3), NO-GO fallback (D3.3).

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E11-S04.md
LineNumber : 105
Line       : for all types used in technician-app (no unknown-name crash).

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E12-S03a.md
LineNumber : 199
Line       : **Climax.** He navigates to Finance: payout queue for the week shows ₹1,82,400 for 38 techs. Numbers are 
             INR-formatted with lakh/crore grouping. He doesn't approve payouts — that's Alokt's authority — but he 
             can verify per-tech breakdowns are correct. He uses the Tech Roster screen to check if Ramesh (a tech 
             flagged yesterday) is still on-duty; sees Ramesh's status is `ऑफ ड्यूटी` and KYC is `लंबित` (pending). He 
             notes this for Alokt.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E17-S01.md
LineNumber : 292
Line       : - Append to the Mitigation column: *"E17-S01 (2026-05-16): `GET /v1/bookings/{id}` photo and report 
             signed URLs now use 5-min TTL (300 s) via `getStorageDownloadUrlWithTtl`. Signed URL values are never 
             passed to Sentry structured fields. 15-min TTL retained on KYC (`extractPanFromStoragePath`) and orders 
             (`orders-repository.ts:toPhotoUrl`) paths — tracked for future hardening story."*

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E17-S02.md
LineNumber : 238
Line       : **Note on the existing `ActiveJobForegroundService`:** that service handles outbox sync and posts a 
             generic "active job" notification with a low-importance channel `active_job_service`. It does NOT request 
             periodic location updates. We deliberately do not extend it — adding a 30 s location-callback inside it 
             would couple network-sync responsibility to GPS responsibility. Instead, this story adds a sibling 
             service. Both can run concurrently while a job is active (Android allows multiple foreground services per 
             app provided each declares the right `foregroundServiceType`).

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E17-S02.md
LineNumber : 678
Line       :    2. WS-A part 1 — append `live_locations` container entry to `setup-cosmos.ts`. Owner runs `npx tsx 
             scripts/setup-cosmos.ts` against dev Cosmos before WS-C tests are run.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E19-S01-pan-encryption.md
LineNumber : 165
Line       : - Always Encrypted CMK approach (rejected per Approach §)

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E19-S02-fcm-pii-trim.md
LineNumber : 18
Line       :    `bookingId` + status. A malicious tech-app could subscribe to a known

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E22-S01-bilingual-catalogue-reprice.md
LineNumber : 5
Line       : **Goal:** Move Hindi catalogue copy from a compiled-in Kotlin map into the API, apply the owner's new 
             price list, and remove the rupee figures baked into service descriptions — so the owner can change a 
             price in the dashboard and every Hindi customer sees it correctly without an app release.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E22-S01-bilingual-catalogue-reprice.md
LineNumber : 7
Line       : **Architecture:** `nameHi` / `shortDescriptionHi` become optional fields on `ServiceSchema` and 
             `ServiceCategorySchema`, served by the public catalogue endpoints. `CatalogueLocalizer` becomes a 
             three-level fallback — server Hindi → compiled-in map → English — so APKs already in the field keep 
             working and the customer-app release is *not* a blocker for the reprice. The seed applies the new prices 
             and backfills Hindi, and stops clobbering the owner's `isActive` toggles.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E22-S01-bilingual-catalogue-reprice.md
LineNumber : 19
Line       : - **Prices are applied exactly as the owner wrote them.** No price is invented, rounded, or "corrected". 
             The table in Task 3 is the whole change.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E22-S01-bilingual-catalogue-reprice.md
LineNumber : 585
Line       : git commit -m "feat(api): E22-S01 — apply owner reprice, add window AC, backfill Hindi, take prices out 
             of prose"

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\E22-S01-bilingual-catalogue-reprice.md
LineNumber : 1057
Line       : The seed writes documents carrying `nameHi`; the deployed API must already accept and serve those fields, 
             or the strict schemas will reject reads. Merge, let `api-ship.yml` deploy, confirm `/api/v1/health` 
             reports the new commit. admin-web must not ship before the API because its create/update request bodies 
             are `.strict()` and would 400 on `nameHi` against the old API; the customer-app release is independent of 
             this deploy order and can ship on its own schedule.

Path       : C:\Alok\Business Projects\wt-obs-keys\plans\W4-technician-hindi-i18n.md
LineNumber : 381
Line       :   // Add inside HomeservicesTechnicianApplication class, after FeatureFlagsEntryPoint:

Path       : C:\Alok\Business Projects\wt-obs-keys\CLAUDE.md
LineNumber : 221
Line       : ADRs that span multiple sub-projects (e.g. "use FCM for all dispatch", "Cosmos DB schema conventions", 
             "auth token format") live in **root `docs/adr/`**. Stack-specific ADRs (e.g. "use Hilt for DI in 
             customer-app") live in the sub-project's own `docs/adr/` once that folder is populated.




codex-fallback: primary account appears rate-limited (exit 1) — retrying with CODEX_HOME=/c/Users/alokt/.codex-alt
OpenAI Codex v0.147.0
--------
workdir: C:\Alok\Business Projects\wt-obs-keys
model: gpt-5.6-terra
provider: openai
approval: never
sandbox: read-only
reasoning effort: none
reasoning summaries: none
session id: 01a07626-f4c6-7113-881c-7c36316f4cd6
--------
user
changes against 'main'
2026-09-06T09:57:48.282773Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force -Name; Get-ChildItem -Path . -Recurse -Force -Include AGENTS.override.md,AGENTS.md | ForEach-Object { $_.FullName }; git diff --stat aab4fddc4809ea0b052cfbf648590098690158e7; git diff --find-renames --find-copies aab4fddc4809ea0b052cfbf648590098690158e7'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force -Name; Get-ChildItem -Path . -Recurse -Force -Include AGENTS.override.md,AGENTS.md | ForEach-Object { $_.FullName }; git diff --stat aab4fddc4809ea0b052cfbf648590098690158e7; git diff --find-renames --find-copies aab4fddc4809ea0b052cfbf648590098690158e7' in C:\Alok\Business Projects\wt-obs-keys
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force -Name; Get-ChildItem -Path . -Recurse -Force -Include AGENTS.override.md,AGENTS.md | ForEach-Object { $_.FullName }; git diff --stat aab4fddc4809ea0b052cfbf648590098690158e7; git diff --find-renames --find-copies aab4fddc4809ea0b052cfbf648590098690158e7'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --stat aab4fddc4809ea0b052cfbf648590098690158e7; git diff --find-renames --find-copies aab4fddc4809ea0b052cfbf648590098690158e7' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 405ms:
 .github/workflows/customer-ship.yml   |  6 +++
 .github/workflows/technician-ship.yml |  6 +++
 customer-app/app/build.gradle.kts     | 78 +++++++++++++++++++++++++++++++++--
 docs/runbook.md                       | 26 ++++++++++++
 technician-app/app/build.gradle.kts   | 78 +++++++++++++++++++++++++++++++++--
 5 files changed, 188 insertions(+), 6 deletions(-)
diff --git a/.github/workflows/customer-ship.yml b/.github/workflows/customer-ship.yml
index c63001d0..921ad0b0 100644
--- a/.github/workflows/customer-ship.yml
+++ b/.github/workflows/customer-ship.yml
@@ -29,6 +29,12 @@ permissions:
 env:
   GIT_SHA: ${{ github.sha }}
   FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'
+  # CI's release build is an R8/ProGuard compile check, and its AAB is a 7-day
+  # upload-artifact — nothing here is ever published to Play (that happens locally via
+  # tools/build-play-bundles.ps1). So CI acknowledges the blank observability keys rather
+  # than failing on them; the hard gate stays on the builds that actually ship.
+  # A CI AAB sideloaded for testing therefore reports no Sentry/PostHog/GrowthBook data.
+  ALLOW_BLANK_OBSERVABILITY_KEYS: 'true'
 
 jobs:
   quality-gate:
diff --git a/.github/workflows/technician-ship.yml b/.github/workflows/technician-ship.yml
index 9db9bdbf..e6281bc5 100644
--- a/.github/workflows/technician-ship.yml
+++ b/.github/workflows/technician-ship.yml
@@ -29,6 +29,12 @@ permissions:
 env:
   GIT_SHA: ${{ github.sha }}
   FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'
+  # CI's release build is an R8/ProGuard compile check, and its AAB is a 7-day
+  # upload-artifact — nothing here is ever published to Play (that happens locally via
+  # tools/build-play-bundles.ps1). So CI acknowledges the blank observability keys rather
+  # than failing on them; the hard gate stays on the builds that actually ship.
+  # A CI AAB sideloaded for testing therefore reports no Sentry/PostHog/GrowthBook data.
+  ALLOW_BLANK_OBSERVABILITY_KEYS: 'true'
 
 jobs:
   quality-gate:
diff --git a/customer-app/app/build.gradle.kts b/customer-app/app/build.gradle.kts
index fcb15b8e..5219d06b 100644
--- a/customer-app/app/build.gradle.kts
+++ b/customer-app/app/build.gradle.kts
@@ -101,8 +101,80 @@ val mapsApiKey =
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
@@ -145,7 +217,7 @@ android {
         buildConfigField(
             "String",
             "SENTRY_DSN",
-            "\"${System.getenv("SENTRY_DSN") ?: ""}\"",
+            buildConfigString(sentryDsn),
         )
         buildConfigField(
             "String",
@@ -175,12 +247,12 @@ android {
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
diff --git a/docs/runbook.md b/docs/runbook.md
index 6ab9c9fc..347705f1 100644
--- a/docs/runbook.md
+++ b/docs/runbook.md
@@ -619,6 +619,32 @@ Required env vars before enabling `soft_launch_enabled`:
 
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
+CI sets `ALLOW_BLANK_OBSERVABILITY_KEYS=true` in `customer-ship.yml` and `technician-ship.yml`:
+its release build is an R8/ProGuard compile check and its AAB is a 7-day `upload-artifact`, never
+published to Play. A CI AAB sideloaded for testing therefore reports nothing — use a locally built
+one when you need telemetry.
+
+
 ---
 
 ## Disaster Recovery Drill
diff --git a/technician-app/app/build.gradle.kts b/technician-app/app/build.gradle.kts
index e6810eb0..fb304eb7 100644
--- a/technician-app/app/build.gradle.kts
+++ b/technician-app/app/build.gradle.kts
@@ -101,8 +101,80 @@ val mapsApiKey =
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
@@ -147,7 +219,7 @@ android {
         buildConfigField(
             "String",
             "SENTRY_DSN",
-            "\"${System.getenv("SENTRY_DSN") ?: ""}\"",
+            buildConfigString(sentryDsn),
         )
         buildConfigField(
             "String",
@@ -172,12 +244,12 @@ android {
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

2026-09-06T09:57:56.471736Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force -Name; Get-ChildItem -Force -Name AGENTS.md,AGENTS.override.md -ErrorAction SilentlyContinue'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force -Name; Get-ChildItem -Force -Name AGENTS.md,AGENTS.override.md -ErrorAction SilentlyContinue' in C:\Alok\Business Projects\wt-obs-keys
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force -Name; Get-ChildItem -Force -Name AGENTS.md,AGENTS.override.md -ErrorAction SilentlyContinue'` rejected: blocked by policy
2026-09-06T09:57:59.419620Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git ls-files '*AGENTS.md' '*AGENTS.override.md'"` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git ls-files '*AGENTS.md' '*AGENTS.override.md'" in C:\Alok\Business Projects\wt-obs-keys
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git ls-files '*AGENTS.md' '*AGENTS.override.md'"` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git status --short; git diff --check aab4fddc4809ea0b052cfbf648590098690158e7; git log --oneline -5' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 598ms:
?? docs/reviews/codex-20260905-obs-keys.md
?? docs/reviews/codex-20260906-obs-keys-round2.md
207a0c0b fix(ci): acknowledge blank observability keys in the app workflows
4f4eeba8 fix(android): resolve observability keys from local.properties, and fail a release that would ship them blank
aab4fddc fix(customer-app): report why a rating submit failed instead of a fake load error (#322)
0285c8e5 fix(customer-app): stop showing the blank-Razorpay-key dev warning to pilot users (#321)
7e901c27 hotfix(api): catalogue 500s — price-in-prose guard moved off the read path (#320)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git show aab4fddc4809ea0b052cfbf648590098690158e7:customer-app/app/build.gradle.kts; git show aab4fddc4809ea0b052cfbf648590098690158e7:technician-app/app/build.gradle.kts' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 316ms:
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
            "\"${System.getenv("SENTRY_DSN") ?: ""}\"",
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
            "\"${System.getenv("GROWTHBOOK_CLIENT_KEY") ?: ""}\"",
        )
        buildConfigField(
            "String",
            "POSTHOG_API_KEY",
            "\"${System.getenv("POSTHOG_API_KEY") ?: ""}\"",
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
    }
}

kotlin {
    jvmToolchain(
        libs.versions.java
            .get()
            .toInt(),
    )
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
        allWarningsAsErrors.set(true)
        freeCompilerArgs.addAll(
            "-Xexplicit-api=strict",
            "-Xjsr305=strict",
        )
    }
}

ktlint {
    version.set("1.3.1")
    android.set(true)
    ignoreFailures.set(false)
    reporters {
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.PLAIN)
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.CHECKSTYLE)
    }
}

detekt {
    toolVersion = libs.versions.detekt.get()
    config.setFrom(file("../detekt.yml"))
    buildUponDefaultConfig = true
    allRules = false
    autoCorrect = false
    ignoreFailures = false
    baseline = file("detekt-baseline.xml")
}

kover {
    reports {
        verify {
            rule {
                minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.LINE)
                // Branch coverage threshold is intentionally lower than line/instruction because:
                // 1. Compose UI files generate synthetic internal branches (recomposition guards,
                //    slot-table ops) that are only exercisable via Compose instrumented tests,
                //    not JVM unit tests. Paparazzi snapshot tests cover the UI rendering paths.
                // 2. Firebase SDK callbackFlow bodies (PhoneAuthProvider callbacks) are framework
                //    callbacks that require a live Firebase project to trigger.
                // 3. Android BiometricPrompt callback branches require a real device/emulator.
                // 4. SosViewModel.startRecording() has a Build.VERSION_CODES.S if/else that requires
                //    Robolectric @Config(sdk=[31+]) to cover the true branch — deferred to E07 Espresso pass.
                // CI's Espresso/Compose instrumented tests (run in a later story) will cover
                // the remaining UI and framework integration branches.
                // Lowered from 69 → 67 after merge of origin/main: BookingConfirmedScreen gained
                // appliedCreditAmount + technicianId branches (Compose UI conditional), and
                // LiveTrackingScreen gained noShowEvent?.let branch — all Compose-framework conditionals
                // that are not exercisable in JVM unit tests. Instrumented-test pass deferred.
                minBound(67, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.BRANCH)
                minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.INSTRUCTION)
            }
        }
        filters {
            excludes {
                classes(
                    // Hilt & Dagger generated code
                    "*.Hilt_*",
                    "*.*_Factory",
                    "*.*_Factory\$*",
                    "*.*_Factory\$InstanceHolder",
                    "*.*_HiltModules*",
                    "*.*_HiltModules\$*",
                    "*.*_Impl",
                    "*.*_MembersInjector",
                    "*.*_GeneratedInjector",
                    "hilt_aggregated_deps.*",
                    "dagger.hilt.*",
                    // KSP-generated factories (pattern: ModuleName_ProvideXxxFactory)
                    "*.*_Provide*Factory*",
                    // Compose-generated lambdas & singletons
                    "*.ComposableSingletons*",
                    "*.ComposableSingletons\$*",
                    // Android/Build generated
                    "*.BuildConfig",
                    "*.R",
                    "*.R\$*",
                    // Excluded application entry-points (no unit tests possible without emulator)
                    "*.HomeservicesCustomerApplication",
                    "*.MainActivity",
                    "*.MainActivity\$*",
                    "*.TestRunner",
                    // Compose theme boilerplate (Color / Theme / Type) — framework wiring, not business logic
                    "*.ui.theme.*",
                    // Compose navigation graphs — NavHost lambdas are framework wiring, not unit-testable
                    "*.navigation.*",
                    // Hilt DI modules — @Provides methods are framework wiring
                    "*.data.auth.di.*",
                    // data.auth.remote.di — AuthApiModule (@Provides for AuthApi Retrofit + @PublicOkHttpClient),
                    // same rationale as data.auth.di.* and data.booking.di.*
                    "*.data.auth.remote.di.*",
                    // domain.flags.di — FeatureFlagsModule (@Binds), same rationale as other DI modules
                    "*.domain.flags.di.*",
                    "*.data.catalogue.di.*",
                    // Stub home screen — placeholder Compose composable, no logic
                    "*.ui.home.*",
                    // BiometricGateUseCase.requestAuth requires FragmentActivity + BiometricPrompt
                    // (Android OS framework calls), not unit-testable without instrumentation
                    "*.BiometricGateUseCase",
                    // Compose screen files generate *Kt JVM wrapper classes. The top-level class
                    // contains Compose-framework branches (recomposition guards, slot-table ops)
                    // that are only exercisable via Compose instrumented tests (Paparazzi covers
                    // the nested $AuthScreen$1 lambda which holds the actual when-branches).
                    "*.AuthScreenKt",
                    "*.AuthScreenKt\$*",
                    // Catalogue Compose screen files generate *Kt JVM wrapper classes with
                    // Compose-framework branches (recomposition guards, slot-table ops) that
                    // are only exercisable via Compose instrumented tests. Paparazzi covers
                    // the snapshot rendering; branch coverage is deferred to instrumented CI tests.
                    "*.CatalogueHomeScreenKt",
                    "*.CatalogueHomeScreenKt\$*",
                    "*.ServiceListScreenKt",
                    "*.ServiceListScreenKt\$*",
                    "*.ServiceDetailScreenKt",
                    "*.ServiceDetailScreenKt\$*",
                    // Booking flow Compose screen files — same rationale as catalogue screens above
                    "*.SlotPickerScreenKt",
                    "*.SlotPickerScreenKt\$*",
                    "*.AddressScreenKt",
                    "*.AddressScreenKt\$*",
                    "*.BookingSummaryScreenKt",
                    "*.BookingSummaryScreenKt\$*",
                    "*.BookingConfirmedScreenKt",
                    "*.BookingConfirmedScreenKt\$*",
                    // Customer bookings list Compose screen, same rationale as other *Kt screen classes
                    "*.CustomerBookingsScreenKt",
                    "*.CustomerBookingsScreenKt\$*",
                    // CustomerBookingsUiState sealed class, data holders with no logic branches
                    "*.CustomerBookingsUiState",
                    "*.CustomerBookingsUiState\$*",
                    // BookingUiState sealed class — data holders, no logic branches
                    "*.BookingUiState",
                    "*.BookingUiState\$*",
                    // RazorpayErrorCode — pure mapping object, covered by BookingViewModelTest indirectly
                    "*.RazorpayErrorCode",
                    // Delete-account (DPDP) Compose screens — same rationale as other *ScreenKt files.
                    // Paparazzi covers rendering paths (currently @Ignored — Linux-only via workflow_dispatch).
                    "*.DeleteAccountScreenKt",
                    "*.DeleteAccountScreenKt\$*",
                    "*.DeleteAccountConfirmScreenKt",
                    "*.DeleteAccountConfirmScreenKt\$*",
                    "*.DeleteAccountCoolOffScreenKt",
                    "*.DeleteAccountCoolOffScreenKt\$*",
                    "*.PrivacyDataScreenKt",
                    "*.PrivacyDataScreenKt\$*",
                    // DeleteAccountUiState sealed class — data holders
                    "*.DeleteAccountUiState",
                    "*.DeleteAccountUiState\$*",
                    // DeleteAccountModule — Hilt @Provides wiring
                    "*.data.deleteaccount.di.*",
                    // Moshi KSP-generated JSON adapters — code-gen output, same rationale as Hilt factories.
                    // Broadened from *.*DtoJsonAdapter to *.*JsonAdapter to cover non-Dto-suffixed classes
                    // (e.g. NonceResponse, TruecallerVerifyRequest) whose generated adapters previously
                    // leaked uncovered JVM branches into the coverage denominator.
                    "*.*JsonAdapter",
                    "*.*JsonAdapter\$*",
                    // BiometricResult sealed class — data holders, no logic branches
                    "*.domain.auth.model.BiometricResult",
                    "*.domain.auth.model.BiometricResult\$*",
                    // BiometricGateUseCase inner lambda classes (BiometricPrompt OS callback)
                    "*.BiometricGateUseCase\$*",
                    // TruecallerLoginUseCase — Truecaller SDK callbacks require live SDK + device
                    "*.TruecallerLoginUseCase",
                    "*.TruecallerLoginUseCase\$*",
                    // SessionManager companion object — EncryptedSharedPreferences requires Android context
                    "*.SessionManager\$Companion",
                    // FirebaseOtpUseCase.sendOtp uses callbackFlow with PhoneAuthProvider —
                    // a real Firebase SDK callback that can't be triggered in JVM unit tests.
                    // signInWithCredential branches are tested separately.
                    "*.FirebaseOtpUseCase",
                    "*.FirebaseOtpUseCase\$*",
                    // TrustDossierCard — Compose UI composables, same rationale as other screen *Kt classes
                    "*.TrustDossierCardKt",
                    "*.TrustDossierCardKt\$*",
                    // TrustDossierUiState — sealed class data holders, no logic branches
                    "*.TrustDossierUiState",
                    "*.TrustDossierUiState\$*",
                    // TechnicianProfileModule — Hilt @Provides wiring, same rationale as other DI modules
                    "*.data.technician.di.*",
                    // TechnicianProfileDto Moshi adapter — code-gen output
                    "*.TechnicianProfileDtoJsonAdapter",
                    "*.TechnicianReviewDtoJsonAdapter",
                    // ConfidenceScoreRow — Compose composable, same rationale as other *Kt screen classes
                    "*.ConfidenceScoreRowKt",
                    "*.ConfidenceScoreRowKt\$*",
                    // ConfidenceScoreUiState sealed class — data holders, no logic branches
                    "*.ConfidenceScoreUiState",
                    "*.ConfidenceScoreUiState\$*",
                    // ConfidenceScoreRepositoryImpl — thin Retrofit wrapper, integration-tested via API layer
                    "*.ConfidenceScoreRepositoryImpl",
                    "*.ConfidenceScoreRepositoryImpl\$*",
                    // PriceApprovalScreen — Compose UI, same rationale as other *Kt screen classes
                    "*.PriceApprovalScreenKt",
                    "*.PriceApprovalScreenKt\$*",
                    // PriceApprovalUiState sealed class — data holders, no logic branches
                    "*.PriceApprovalUiState",
                    "*.PriceApprovalUiState\$*",
                    // CustomerFirebaseMessagingService — Android OS entry-point, not unit-testable
                    "*.CustomerFirebaseMessagingService",
                    "*.CustomerFirebaseMessagingService\$*",
                    // BookingModule — Hilt @Provides wiring + OkHttp/Retrofit construction,
                    // same rationale as data.auth.di.* and data.catalogue.di.*
                    "*.data.booking.di.*",
                    // Booking remote DTOs — Moshi @JsonClass data holders with toDomain() mappers;
                    // mapping is exercised indirectly via repository integration tests, not JVM unit tests
                    "*.data.booking.remote.dto.*",
                    // Auth remote DTOs — Moshi @JsonClass data holders (TruecallerVerifyRequest/Response),
                    // same rationale as *.data.booking.remote.dto.*
                    "*.data.auth.remote.dto.*",
                    // BuildConfigFeatureFlags — reads a compile-time constant; no branches to test
                    "*.BuildConfigFeatureFlags",
                    // RazorpayPaymentUseCase.open() — uses callbackFlow + Razorpay Checkout SDK which
                    // requires a real Activity; same rationale as FirebaseOtpUseCase (callbackFlow + SDK)
                    "*.RazorpayPaymentUseCase",
                    "*.RazorpayPaymentUseCase\$*",
                    // PriceApprovalEventBus — MutableSharedFlow wrapper; post() uses tryEmit()
                    // which is only observable in a running coroutine collector (integration-level)
                    "*.PriceApprovalEventBus",
                    "*.PriceApprovalEventBus\$*",
                    // LiveTracking Compose screen — same rationale as other *Kt screen classes
                    "*.LiveTrackingScreenKt",
                    "*.LiveTrackingScreenKt\$*",
                    // LiveTrackingUiState sealed class — data holders, no logic branches
                    "*.LiveTrackingUiState",
                    "*.LiveTrackingUiState\$*",
                    // TrackingEventBus — MutableSharedFlow wrapper, same rationale as PriceApprovalEventBus
                    "*.TrackingEventBus",
                    "*.TrackingEventBus\$*",
                    // data.tracking.di — Hilt @Binds wiring, same rationale as other DI modules
                    "*.data.tracking.di.*",
                    // RatingScreen — Compose UI composables (RatingScreen, ShieldBottomSheet,
                    // CountdownChip, StarRow), same rationale as other *Kt screen classes.
                    // Paparazzi snapshot test covers rendering; JVM unit tests cover ViewModel logic.
                    "*.RatingScreenKt",
                    "*.RatingScreenKt$*",
                    // data.rating.di — Hilt @Provides wiring (RatingModule/Retrofit construction),
                    // same rationale as data.auth.di.*, data.catalogue.di.*, data.booking.di.*
                    "*.data.rating.di.*",
                    // RatingPromptEventBus — MutableSharedFlow wrapper, same rationale as PriceApprovalEventBus
                    "*.RatingPromptEventBus",
                    "*.RatingPromptEventBus$*",
                    // SOS composable screens — same rationale as other *Kt screen classes
                    "*.SosBottomSheetKt",
                    "*.SosBottomSheetKt\$*",
                    "*.SosConsentDialogKt",
                    "*.SosConsentDialogKt\$*",
                    // SosUiState sealed interface — data holders, no logic branches
                    "*.SosUiState",
                    "*.SosUiState\$*",
                    // data.sos.di — Hilt @Provides wiring, same rationale as other DI modules
                    "*.data.sos.di.*",
                    // SosConsentStore — thin DataStore wrapper (IO-bound, integration-tested)
                    "*.SosConsentStore",
                    "*.SosConsentStore\$*",
                    // ComplaintScreen — Compose UI composable
                    "*.ComplaintScreenKt",
                    "*.ComplaintScreenKt\$*",
                    // ComplaintRoutes — nav route sealed class
                    "*.ComplaintRoutes",
                    "*.ComplaintRoutes\$*",
                    // data.complaint.di — Hilt @Provides wiring
                    "*.data.complaint.di.*",
                    // PhotoUploadUseCase — Firebase Storage upload path
                    "*.PhotoUploadUseCase",
                    "*.PhotoUploadUseCase\$*",
                    // FirstLaunchLanguageScreen + LanguageSettingsScreen + SettingsScreen —
                    // Compose UI composables, same rationale as other *Kt screen classes
                    "*.FirstLaunchLanguageScreenKt",
                    "*.FirstLaunchLanguageScreenKt\$*",
                    "*.LanguageSettingsScreenKt",
                    "*.LanguageSettingsScreenKt\$*",
                    "*.SettingsScreenKt",
                    "*.SettingsScreenKt\$*",
                    // ProfileScreen — Compose UI composable, same rationale as other *Kt screen classes
                    "*.ProfileScreenKt",
                    "*.ProfileScreenKt\$*",
                    // IntegrityModule — Hilt @Provides DI wiring for Play Integrity SDK setup
                    "*.domain.integrity.di.*",
                    // IntegrityApiService — Retrofit interface, methods invoked by Retrofit runtime
                    "*.data.integrity.IntegrityApiService",
                    // IdTokenCache — background CoroutineScope refreshLoop (while(true) + delay).
                    "*.IdTokenCache",
                    "*.IdTokenCache\$*",
                    // FirebaseTokenAuthenticator — OkHttp Authenticator using Tasks.await on a worker thread.
                    "*.FirebaseTokenAuthenticator",
                    "*.FirebaseTokenAuthenticator\$*",
                    // SessionPrefsMigrator — object with KeyStore + EncryptedSharedPreferences IO.
                    "*.SessionPrefsMigrator",
                    "*.SessionPrefsMigrator\$*",
                    "*.data.network.auth.di.*",
                    // PendingActionsModule — Hilt @Provides wiring for Room database construction
                    "*.data.pendingaction.di.*",
                    // PendingActionsDatabase — Room database singleton; generated _Impl has no unit-testable logic
                    "*.PendingActionsDatabase",
                    "*.PendingActionsDatabase\$*",
                    // Room KSP-generated DAO/DB implementation classes (anonymous Runnable/Callable on Room executor)
                    "*.PendingActionsDatabase_Impl",
                    "*.PendingActionsDatabase_Impl\$*",
                    "*.PendingActionDao_Impl",
                    "*.PendingActionDao_Impl\$*",
                    // DataExportScreen + PrivacyAndDataScreen — Compose UI composables,
                    // same rationale as other *Kt screen classes.
                    // Paparazzi @Ignored tests are recorded on CI; JVM unit tests cover ViewModel.
                    "*.DataExportScreenKt",
                    "*.DataExportScreenKt\$*",
                    "*.PrivacyAndDataScreenKt",
                    "*.PrivacyAndDataScreenKt\$*",
                    // DataExportUiState — sealed class data holders, no logic branches
                    "*.DataExportUiState",
                    "*.DataExportUiState\$*",
                    // DataExportRepositoryImpl — thin Retrofit/ResponseBody wrapper,
                    // integration-tested via API layer (same rationale as BookingRepositoryImpl)
                    "*.DataExportRepositoryImpl",
                    "*.DataExportRepositoryImpl\$*",
                    // DataExportModule — Hilt @Provides Retrofit construction + @Binds,
                    // same rationale as data.booking.di.*
                    "*.data.dataexport.di.*",
                    // FusedCurrentLocationProvider — suspends on FusedLocationProviderClient which
                    // requires a real device/emulator; GPS behavior is verified via mocked interface
                    // in ServiceDetailViewModelGpsConfidenceTest and ServiceDetailViewModelConfidenceScoreTest.
                    "*.FusedCurrentLocationProvider",
                    "*.FusedCurrentLocationProvider\$*",
                    // LocationModule — Hilt @Provides wiring for FusedLocationProviderClient,
                    // same rationale as other DI modules.
                    "*.data.location.di.*",
                    // WalletScreen + WalletBalanceChip — Compose UI composables,
                    // same rationale as other *Kt screen classes (recomposition guards, slot-table ops).
                    // Paparazzi snapshot tests cover the rendering paths.
                    "*.WalletScreenKt",
                    "*.WalletScreenKt\$*",
                    "*.WalletBalanceChipKt",
                    "*.WalletBalanceChipKt\$*",
                    // WalletRepositoryImpl — thin Retrofit wrapper, integration-tested via API layer.
                    // Same rationale as BookingRepositoryImpl and ConfidenceScoreRepositoryImpl.
                    "*.WalletRepositoryImpl",
                    "*.WalletRepositoryImpl\$*",
                    // WalletModule — Hilt @Provides wiring for Retrofit construction,
                    // same rationale as data.booking.di.* and other DI modules.
                    "*.data.wallet.di.*",
                    // WalletUiState + WalletBalanceUiState + LedgerUiState — sealed class data holders,
                    // no logic branches; state transitions covered by WalletViewModelTest.
                    "*.WalletBalanceUiState",
                    "*.WalletBalanceUiState\$*",
                    "*.LedgerUiState",
                    "*.LedgerUiState\$*",
                    // WalletRoutes — nav route object, framework wiring
                    "*.WalletRoutes",
                    "*.WalletRoutes\$*",
                    // FirstLaunchLanguageViewModel + LanguageSettingsViewModel — DataStore/locale I/O,
                    // not unit-testable without Android context injection; covered by E12-S03c integration pass.
                    "*.FirstLaunchLanguageViewModel",
                    "*.FirstLaunchLanguageViewModel\$*",
                    "*.LanguageSettingsViewModel",
                    "*.LanguageSettingsViewModel\$*",
                    // LocaleModule — Hilt @Provides wiring, same rationale as other DI modules.
                    "*.data.locale.di.*",
                    // ComplaintListScreen — Compose UI; Paparazzi covers rendering paths.
                    "*.ComplaintListScreenKt",
                    "*.ComplaintListScreenKt\$*",
                    // CountdownChip — standalone Compose chip; no logic beyond time formatting.
                    "*.CountdownChipKt",
                    "*.CountdownChipKt\$*",
                    // NoShowCreditBanner + NoShowCreditViewModel — FCM/event bus UI,
                    // same rationale as WalletScreenKt.
                    "*.NoShowCreditBannerKt",
                    "*.NoShowCreditBannerKt\$*",
                    "*.NoShowCreditViewModel",
                    "*.NoShowCreditViewModel\$*",
                    // PhotoFirstCategoryCard + PhotoFirstServiceCard — Compose UI photo-first cards.
                    "*.PhotoFirstCategoryCardKt",
                    "*.PhotoFirstCategoryCardKt\$*",
                    "*.PhotoFirstServiceCardKt",
                    "*.PhotoFirstServiceCardKt\$*",
                    // CatalogueHomeScreen refactor — CatalogueTab extracted composable.
                    "*.CatalogueHomeScreenKt\$CatalogueTab\$*",
                    // NoShowCreditHandler — calls NotificationCompat.Builder; integration-tested
                    // via CustomerFirebaseMessagingServiceNoShowTest with Robolectric.
                    "*.NoShowCreditHandler",
                    "*.NoShowCreditHandler\$*",
                    // SettingsScreen — Compose UI updated with onMyComplaintsClick; Paparazzi covers.
                    "*.SettingsScreenKt",
                    "*.SettingsScreenKt\$*",
                    // CustomerHomeTabContent — Compose UI composable (E11-S03), Paparazzi @Ignored
                    // stubs cover rendering; JVM unit tests cover ViewModel logic only.
                    "*.CustomerHomeTabContentKt",
                    "*.CustomerHomeTabContentKt\$*",
                    // CustomerHomeUiState — sealed class data holders, no logic branches
                    "*.CustomerHomeUiState",
                    "*.CustomerHomeUiState\$*",
                    // E16-S04: PlacesModule + WaitlistModule — Hilt @Provides/@Binds wiring, same
                    // rationale as data.auth.di.* and other DI modules excluded above.
                    "*.di.PlacesModule",
                    "*.di.PlacesModule\$*",
                    "*.di.PlacesBindingsModule",
                    "*.di.PlacesBindingsModule\$*",
                    "*.di.WaitlistModule",
                    "*.di.WaitlistModule\$*",
                    // E16-S04: DefaultDispatcher annotation — compile-time qualifier, no runtime logic.
                    "*.di.DefaultDispatcher",
                    // E16-S04: SDK wrappers — require Android Context / Places SDK at runtime;
                    // exercised via instrumented tests, not JVM unit tests.
                    "*.data.places.DefaultPlacesClientGateway",
                    "*.data.places.DefaultPlacesClientGateway\$*",
                    "*.data.places.AndroidReverseGeocoder",
                    "*.data.places.AndroidReverseGeocoder\$*",
                    // E16-S04: Compose UI screens — Paparazzi stubs cover rendering paths (@Ignored
                    // goldens recorded on CI Linux); ViewModel logic is covered by AddressPickerViewModelTest.
                    "*.ui.booking.AddressPickerScreenKt",
                    "*.ui.booking.AddressPickerScreenKt\$*",
                    "*.ui.booking.AddressPickerScreenContentKt",
                    "*.ui.booking.AddressPickerScreenContentKt\$*",
                    "*.ui.waitlist.WaitlistScreenKt",
                    "*.ui.waitlist.WaitlistScreenKt\$*",
                    "*.ui.waitlist.WaitlistScreenContentKt",
                    "*.ui.waitlist.WaitlistScreenContentKt\$*",
                    // E16-S04: WaitlistRepositoryImpl — Retrofit/HttpException wiring; core 429 mapping
                    // covered by repository-layer integration test in W6 (E16-S04b scope).
                    "*.data.waitlist.WaitlistRepositoryImpl",
                    "*.data.waitlist.WaitlistRepositoryImpl\$*",
                    // Analytics DI module — Hilt @Binds wiring, same rationale as other DI modules.
                    "*.observability.analytics.di.*",
                    // NoOpAnalyticsFacade — trivial no-op stubs; no logic to test.
                    "*.NoOpAnalyticsFacade",
                    // AnalyticsEvents — constants object; no runtime logic or branches.
                    "*.AnalyticsEvents",
                    // DpdpConsentScreen — Compose UI composable (first-launch + consent management),
                    // same rationale as other *Kt screen classes (recomposition guards, slot-table ops).
                    // Paparazzi @Ignored tests are recorded on CI; ViewModel logic is covered by ConsentViewModelTest.
                    "*.DpdpConsentScreenKt",
                    "*.DpdpConsentScreenKt\$*",
                    // ConsentUiState — sealed data class data holders, no logic branches.
                    "*.ConsentUiState",
                    "*.ConsentUiState\$*",
                    // data.consent.di — Hilt @Provides/@Binds wiring, same rationale as other DI modules.
                    "*.data.consent.di.*",
                    // data.consent.remote.di — Hilt @Provides wiring for ConsentAuditApiService (Retrofit).
                    "*.data.consent.remote.di.*",
                    // ConsentAuditApiService — Retrofit interface; methods invoked by Retrofit runtime,
                    // same rationale as *.data.integrity.IntegrityApiService.
                    "*.data.consent.remote.ConsentAuditApiService",
                )
            }
        }
    }
}

// Hilt + KSP2 (K2 compiler): pass the flag that tells the Hilt KSP processor
// that the Hilt Gradle plugin IS applied and superclass validation should be
// skipped during the KSP pass (the plugin does the bytecode transform post-compile).
// Without this, KSP2 fails with "Expected @AndroidEntryPoint to have a value".
// See https://dagger.dev/hilt/gradle-setup.html#ksp
ksp {
    arg("dagger.hilt.android.internal.disableAndroidSuperclassValidation", "true")
}

// Paparazzi 1.3.5 picks up the correct layoutlib for the Compose BOM automatically.
// No paparazzi {} configuration block is needed or valid.

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons.core)
    implementation(libs.compose.material.icons.extended)
    implementation(libs.homeservices.design.system)
    implementation(libs.homeservices.core.nav)
    implementation(libs.kotlinx.serialization.json)

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.androidx.hilt.navigation.compose)

    implementation(libs.sentry.android)
    implementation(libs.posthog.android)
    implementation(libs.growthbook.android)
    implementation(libs.growthbook.okhttp)

    // Firebase (BOM manages all Firebase library versions)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth.ktx)
    implementation(libs.firebase.messaging)
    implementation(libs.firebase.storage)

    // Credential Manager + Google Identity Library
    implementation(libs.androidx.credentials)
    implementation(libs.androidx.credentials.playservices)
    implementation(libs.google.identity.googleid)

    // Coroutines — play-services extensions (.await() on Task<T>)
    implementation(libs.kotlinx.coroutines.play.services)

    // Consent / preferences storage
    implementation(libs.androidx.datastore.preferences)

    // Auth SDKs
    implementation(libs.truecaller.sdk)
    implementation(libs.androidx.security.crypto)
    implementation(libs.androidx.biometric)
    implementation(libs.androidx.navigation.compose)

    // Networking / serialisation / image loading
    implementation(libs.retrofit.core)
    implementation(libs.retrofit.moshi)
    implementation(libs.okhttp.core)
    implementation(libs.okhttp.logging)
    implementation(libs.moshi.kotlin)
    ksp(libs.moshi.kotlin.codegen)
    implementation(libs.coil.compose)

    // Room (local persistence — pending_actions table introduced in E11-S01a)
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)

    // Play Integrity API
    implementation(libs.play.integrity)

    // Payments + Maps
    implementation(libs.razorpay.checkout)
    implementation(libs.google.places)
    implementation(libs.play.services.maps)
    implementation(libs.play.services.location)
    implementation(libs.maps.compose)

    testImplementation(libs.junit.jupiter)
    testImplementation(libs.junit.jupiter.api)
    testRuntimeOnly(libs.junit.jupiter.engine)
    // JUnit 4 vintage engine: required for Paparazzi @Rule-based tests under the JUnit 5 launcher
    testRuntimeOnly(libs.junit.vintage.engine)
    testImplementation(libs.mockk)
    testImplementation(libs.assertj.core)
    testImplementation(libs.google.truth)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.core)
    testImplementation(libs.hilt.testing)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.turbine)
    testImplementation(libs.okhttp.mockwebserver)
    kspTest(libs.hilt.compiler)

    androidTestImplementation(libs.hilt.testing)
    androidTestImplementation(libs.androidx.test.runner)
    kspAndroidTest(libs.hilt.compiler)
}

// ---------------------------------------------------------------------------
// English-literal Text() gate — E12-S02a Hindi sweep
// ---------------------------------------------------------------------------
// Catches any Compose Text("Uppercase...") literals in main sources that were
// not extracted to strings.xml.  Uppercase-initial is used as the heuristic
// because Hindi string-resource keys are lower_snake_case; any raw English
// sentence starting with a capital letter is almost certainly a hardcoded UI
// literal that belongs in strings.xml / strings-hi.xml.
//
// Zero violations are expected after the E12-S02a sweep.  The rule is wired
// into the `check` task so it runs on every CI build.
// ---------------------------------------------------------------------------
tasks.register("verifyNoEnglishTextLiterals") {
    description = "Fail the build if any Compose Text() calls contain hardcoded English literals."
    group = "verification"
    // Configuration-cache compatible: capture only File references at config time, then use
    // plain java.io / kotlin.io.path traversal at execution time. Avoid Gradle DSL helpers
    // (fileTree, files) inside doLast — they capture script-object references that can't be
    // serialized into the configuration cache.
    val projectDir = layout.projectDirectory.asFile
    val ktSourceDirs: List<java.io.File> =
        listOf("src/main/kotlin", "src/main/java")
            .map { projectDir.resolve(it) }
            .filter { it.exists() }
    val ktFiles: List<java.io.File> =
        ktSourceDirs.flatMap { dir ->
            dir.walkTopDown().filter { it.isFile && it.extension == "kt" }.toList()
        }
    inputs.files(ktFiles)
    doLast {
        val pattern = Regex("""Text\("[A-Z][^"]*"""")
        val violations =
            ktFiles.flatMap { file ->
                file
                    .readLines()
                    .withIndex()
                    .filter { (_, line) -> pattern.containsMatchIn(line) }
                    .map { (idx, line) -> "${file.relativeTo(projectDir)}:${idx + 1}: $line" }
            }
        if (violations.isNotEmpty()) {
            throw GradleException(
                "Forbidden English-literal Text() found — extract to strings.xml:\n" +
                    violations.joinToString("\n"),
            )
        }
    }
}

tasks.named("check") { dependsOn("verifyNoEnglishTextLiterals") }

tasks.register<Exec>("verifyDesignTokenUsage") {
    description = "Fail if raw Color or off-scale spacing/radius token debt grows."
    group = "verification"
    workingDir = rootProject.projectDir.parentFile
    commandLine("python", "tools/verify-android-design-tokens.py", "customer-app")
}

tasks.named("detekt") { dependsOn("verifyDesignTokenUsage") }
tasks.named("check") { dependsOn("verifyDesignTokenUsage") }
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
            "\"${System.getenv("SENTRY_DSN") ?: ""}\"",
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
            "\"${System.getenv("GROWTHBOOK_CLIENT_KEY") ?: ""}\"",
        )
        buildConfigField(
            "String",
            "POSTHOG_API_KEY",
            "\"${System.getenv("POSTHOG_API_KEY") ?: ""}\"",
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
                    test.filter.excludeTestsMatching("*MyRatingsScreenTest*")
                }
            }
        }
    }
}

kotlin {
    jvmToolchain(
        libs.versions.java
            .get()
            .toInt(),
    )
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
        allWarningsAsErrors.set(true)
        freeCompilerArgs.addAll(
            "-Xexplicit-api=strict",
            "-Xjsr305=strict",
        )
    }
}

ktlint {
    version.set("1.3.1")
    android.set(true)
    ignoreFailures.set(false)
    reporters {
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.PLAIN)
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.CHECKSTYLE)
    }
}

detekt {
    toolVersion = libs.versions.detekt.get()
    config.setFrom(file("../detekt.yml"))
    buildUponDefaultConfig = true
    allRules = false
    autoCorrect = false
    ignoreFailures = false
    baseline = file("detekt-baseline.xml")
}

kover {
    reports {
        verify {
            rule {
                // E13-S02b (Wave 3, 2026-05-14): raised LINE + INSTRUCTION to 80% after
                // domain-layer test-writing pass + proper exclusion of TechnicianHomeScreenKt,
                // AuthScreenKt$*, LanguageSettingsScreenKt, and missing DI-module packages.
                // Actual at gate: lines=86.3%, branches=62.1%, instructions=85.1%.
                // Do NOT lower these further.
                minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.LINE)
                // Branch coverage intentionally lower — Compose UI synthetic branches, Firebase
                // SDK callbacks, and BiometricPrompt require instrumented tests (later story).
                // Raised from 35 → 55 to reflect real improvement; target 69% deferred.
                minBound(55, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.BRANCH)
                minBound(80, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.INSTRUCTION)
            }
        }
        filters {
            excludes {
                classes(
                    // Hilt & Dagger generated code
                    "*.Hilt_*",
                    "*.*_Factory",
                    "*.*_Factory\$*",
                    "*.*_Factory\$InstanceHolder",
                    "*.*_HiltModules*",
                    "*.*_HiltModules\$*",
                    "*.*_Impl",
                    "*.*_MembersInjector",
                    "*.*_GeneratedInjector",
                    "hilt_aggregated_deps.*",
                    "dagger.hilt.*",
                    // KSP-generated factories (pattern: ModuleName_ProvideXxxFactory)
                    "*.*_Provide*Factory*",
                    // Compose-generated lambdas & singletons
                    "*.ComposableSingletons*",
                    "*.ComposableSingletons\$*",
                    // Android/Build generated
                    "*.BuildConfig",
                    "*.R",
                    "*.R\$*",
                    // Excluded application entry-points (no unit tests possible without emulator)
                    "*.HomeservicesTechnicianApplication",
                    "*.MainActivity",
                    "*.MainActivity\$*",
                    "*.TestRunner",
                    // Compose theme boilerplate (Color / Theme / Type) — framework wiring, not business logic
                    "*.ui.theme.*",
                    // Compose navigation graphs — NavHost lambdas are framework wiring, not unit-testable
                    "*.navigation.*",
                    // Hilt DI module — @Provides methods are framework wiring
                    "*.data.auth.di.*",
                    // Hilt DI module for job offer feature — @Provides methods are framework wiring
                    "*.data.jobOffer.di.*",
                    // domain.flags.di — FeatureFlagsModule (@Binds), same rationale as other DI modules
                    "*.domain.flags.di.*",
                    // BuildConfigFeatureFlags — reads a compile-time constant; no branches to test
                    "*.BuildConfigFeatureFlags",
                    // GrowthBookFeatureFlags — SDK construction requires network (OkHttp); the
                    // unit test covers the safe-off invariant via the no-arg constructor path;
                    // the refreshAsync() fire-and-forget and SDK init branches need integration tests.
                    "*.GrowthBookFeatureFlags",
                    "*.GrowthBookFeatureFlags\$*",
                    // Stub onboarding screen — placeholder Compose composable, no logic
                    "*.ui.onboarding.*",
                    // BiometricGateUseCase.requestAuth requires FragmentActivity + BiometricPrompt
                    // (Android OS framework calls), not unit-testable without instrumentation
                    "*.BiometricGateUseCase",
                    "*.BiometricGateUseCase\$*",
                    // Compose screen files generate *Kt JVM wrapper classes. The top-level class
                    // contains Compose-framework branches (recomposition guards, slot-table ops)
                    // that are only exercisable via Compose instrumented tests (Paparazzi covers
                    // the nested lambda which holds the actual when-branches).
                    "*.AuthScreenKt",
                    // KycScreen and sub-composables generate *Kt JVM wrapper classes with
                    // Compose-framework branches (recomposition guards, slot-table ops) only
                    // exercisable via Compose instrumented tests. Paparazzi covers rendering paths.
                    "*.KycScreenKt",
                    "*.KycScreenKt\$*",
                    // FirebaseOtpUseCase.sendOtp uses callbackFlow with PhoneAuthProvider —
                    // a real Firebase SDK callback that can't be triggered in JVM unit tests.
                    // signInWithCredential branches are tested separately.
                    "*.FirebaseOtpUseCase",
                    "*.FirebaseOtpUseCase\$*",
                    // TruecallerLoginUseCase.init/isAvailable/launch wrap TruecallerSDK static calls
                    // (Android SDK) that cannot be exercised in JVM unit tests. sdkCallback path
                    // is covered via simulateSdkCallback in TruecallerLoginUseCaseTest.
                    "*.TruecallerLoginUseCase",
                    // SentryInitializer wraps Android SDK initialisation — no JVM unit test path
                    "*.SentryInitializer",
                    // KycApiService is an internal Retrofit interface — its methods are invoked by
                    // the Retrofit runtime (not unit-testable). KycRepositoryImpl covers all
                    // reachable branches via mockk in KycRepositoryImplTest.
                    "*.KycApiService",
                    "*.KycApiService\$*",
                    // HomeservicesFcmService — @AndroidEntryPoint service with field injection;
                    // onMessageReceived requires a live FCM connection, not unit-testable
                    "*.HomeservicesFcmService",
                    "*.HomeservicesFcmService\$*",
                    // NotificationChannelInitializer — all framework calls (NotificationChannel,
                    // NotificationManager). Same rationale as HomeservicesFcmService: requires
                    // Robolectric or instrumented test to exercise. Wired into Application.onCreate.
                    "*.NotificationChannelInitializer",
                    "*.NotificationChannelInitializer\$*",
                    // JobOfferScreen composable file generates *Kt JVM wrapper with framework branches
                    "*.JobOfferScreenKt",
                    "*.JobOfferScreenKt\$*",
                    // PendingActionCard's per-second countdown tick (S-33) is a LaunchedEffect +
                    // recomposition-driven remember, only exercisable via Compose instrumented
                    // tests; Paparazzi covers rendering. The tested pure math lives in
                    // PendingActionCountdown.kt (remainingSeconds), a separate facade class, so it
                    // is NOT excluded and keeps contributing coverage.
                    "*.PendingActionCardKt",
                    "*.PendingActionCardKt\$*",
                    // JobOfferApiService is an internal Retrofit interface — its methods are invoked
                    // by the Retrofit runtime (not unit-testable)
                    "*.JobOfferApiService",
                    "*.JobOfferApiService\$*",
                    // ActiveJob Hilt DI module — @Provides methods are framework wiring
                    "*.data.activeJob.di.*",
                    // Room database singleton — no unit-testable logic
                    "*.ActiveJobDatabase",
                    "*.ActiveJobDatabase\$*",
                    // ConnectivityObserver uses Android OS-level callbacks
                    "*.ConnectivityObserver",
                    "*.ConnectivityObserver\$*",
                    // ActiveJobScreen generates Compose *Kt wrapper classes
                    "*.ActiveJobScreenKt",
                    "*.ActiveJobScreenKt\$*",
                    // Room KSP-generated DAO/DB implementations contain anonymous Runnable/Callable
                    // inner classes that execute on Room's executor threads — not unit-testable
                    // without a real Android instrumented test environment.
                    "*.ActiveJobDatabase_Impl",
                    "*.ActiveJobDatabase_Impl\$*",
                    "*.ActiveJobDao_Impl",
                    "*.ActiveJobDao_Impl\$*",
                    // ActiveJobRepositoryImpl.getActiveJob() delegates to StateFlow.filterNotNull().
                    // The filter lambda is a Kotlin stdlib internal; the repository itself is
                    // covered by ActiveJobRepositoryImplTest.
                    "*.ActiveJobRepositoryImpl\$getActiveJob\$1",
                    // ActiveJobApiService is an internal Retrofit interface — methods invoked by
                    // the Retrofit runtime, not unit-testable directly.
                    "*.ActiveJobApiService",
                    "*.ActiveJobApiService\$*",
                    // onPhotoConfirmed / fireTransition viewModelScope.launch lambdas —
                    // the ?: return@launch guards and else-branch are race-condition / unreachable paths
                    // that are not exercisable in JVM unit tests with UnconfinedTestDispatcher.
                    "*.ActiveJobViewModel\$onPhotoConfirmed\$1",
                    "*.ActiveJobViewModel\$onPhotoConfirmed\$1\$*",
                    "*.ActiveJobViewModel\$fireTransition\$1",
                    "*.ActiveJobViewModel\$fireTransition\$1\$*",
                    // PhotoCaptureScreen generates Compose *Kt wrapper classes
                    "*.PhotoCaptureScreenKt",
                    "*.PhotoCaptureScreenKt\$*",
                    // E11-S05a Compose surfaces — Paparazzi-only (goldens recorded on CI Linux);
                    // same rationale as PhotoCaptureScreenKt / ActiveJobScreenKt.
                    "*.PhotoUploadRetryBannerKt",
                    "*.PhotoUploadRetryBannerKt\$*",
                    "*.CompletionConfirmationDialogKt",
                    "*.CompletionConfirmationDialogKt\$*",
                    // BookingStatusEventBus (E11-S05a) wraps MutableSharedFlow.tryEmit() — only
                    // observable in a running coroutine collector, same rationale as
                    // RatingPromptEventBus / RatingReceivedEventBus / EarningsUpdateEventBus.
                    "*.BookingStatusEventBus",
                    "*.BookingStatusEventBus\$*",
                    // JobPhotoRepositoryImpl wraps Firebase Storage + HTTP — requires live services
                    "*.JobPhotoRepositoryImpl",
                    "*.JobPhotoRepositoryImpl\$*",
                    // Photo DI module — @Provides methods are framework wiring
                    "*.data.photo.di.*",
                    // RatingScreen generates Compose *Kt wrapper classes — same rationale as
                    // AuthScreenKt / KycScreenKt / JobOfferScreenKt / ActiveJobScreenKt: framework
                    // recomposition guards only exercisable via Paparazzi / instrumented tests.
                    "*.RatingScreenKt",
                    "*.RatingScreenKt\$*",
                    // Rating Hilt DI module (RatingModule) — @Provides for AuthOkHttpClient + Retrofit
                    // construction, same rationale as data.auth.di.* / data.activeJob.di.* /
                    // data.jobOffer.di.* / data.photo.di.*.
                    "*.data.rating.di.*",
                    // RatingApiService is an internal Retrofit interface — methods invoked by
                    // Retrofit runtime, not unit-testable directly.
                    "*.RatingApiService",
                    "*.RatingApiService\$*",
                    // RatingPromptEventBus wraps MutableSharedFlow.tryEmit() — only observable
                    // in a running coroutine collector (integration-level), same rationale as
                    // customer-app's PriceApprovalEventBus / TrackingEventBus exclusion.
                    "*.RatingPromptEventBus",
                    "*.RatingPromptEventBus\$*",
                    // RatingReceivedEventBus — same rationale as RatingPromptEventBus: Channel
                    // delivery observable only with a live coroutine collector.
                    "*.RatingReceivedEventBus",
                    "*.RatingReceivedEventBus\$*",
                    // RatingUiState sealed class — data holders, no logic branches.
                    "*.RatingUiState",
                    "*.RatingUiState\$*",
                    // EarningsScreen generates Compose *Kt wrapper classes — same rationale as
                    // RatingScreenKt / AuthScreenKt: recomposition guards + slot-table ops.
                    "*.EarningsScreenKt",
                    "*.EarningsScreenKt\$*",
                    // MyRatingsScreen generates Compose *Kt wrapper classes — same rationale.
                    "*.MyRatingsScreenKt",
                    "*.MyRatingsScreenKt\$*",
                    // FcmTopicSubscriber wraps FirebaseMessaging.subscribeToTopic /
                    // unsubscribeFromTopic — Tasks-API callbacks that require a real
                    // Firebase project + network to resolve. Same rationale as
                    // FirebaseOtpUseCase exclusion above.
                    "*.FcmTopicSubscriber",
                    "*.FcmTopicSubscriber\$*",
                    // ComplaintScreen — Compose UI composable
                    "*.ComplaintScreenKt",
                    "*.ComplaintScreenKt\$*",
                    // ComplaintRoutes — nav route sealed class
                    "*.ComplaintRoutes",
                    "*.ComplaintRoutes\$*",
                    // data.complaint.di — Hilt @Provides wiring
                    "*.data.complaint.di.*",
                    // PhotoUploadUseCase — Firebase Storage upload path
                    "*.PhotoUploadUseCase",
                    "*.PhotoUploadUseCase\$*",
                    // E08-S04 Shield/Appeal Compose sheets — same rationale as other
                    // *Kt screen wrappers: recomposition guards + slot-table ops only
                    // exercisable via Paparazzi / instrumented tests.
                    "*.ShieldReportSheetKt",
                    "*.ShieldReportSheetKt\$*",
                    "*.RatingAppealSheetKt",
                    "*.RatingAppealSheetKt\$*",
                    // ShieldApiService is an internal Retrofit interface — methods invoked by
                    // Retrofit runtime, not unit-testable directly.
                    "*.ShieldApiService",
                    "*.ShieldApiService\$*",
                    // Shield Hilt DI module — @Provides methods are framework wiring,
                    // same rationale as data.rating.di.* / data.activeJob.di.*.
                    "*.data.shield.di.*",
                    // PayoutCadenceScreen generates Compose *Kt wrapper classes — same rationale
                    // as RatingScreenKt / EarningsScreenKt: recomposition guards + slot-table ops.
                    "*.PayoutCadenceScreenKt",
                    "*.PayoutCadenceScreenKt\$*",
                    // Payout Hilt DI module — @Provides methods are framework wiring,
                    // same rationale as data.rating.di.* / data.shield.di.*.
                    "*.data.payout.di.*",
                    // PayoutApiService is an internal Retrofit interface — methods invoked by
                    // Retrofit runtime, not unit-testable directly.
                    "*.PayoutApiService",
                    "*.PayoutApiService\$*",
                    // Service selection screen generates Compose *Kt wrapper classes — same
                    // rationale as the other Compose screen exclusions above.
                    "*.ServiceSelectionScreenKt",
                    "*.ServiceSelectionScreenKt\$*",
                    // Service profile Hilt DI module and Retrofit interface are framework wiring.
                    "*.data.serviceprofile.di.*",
                    "*.ServiceProfileApiService",
                    "*.ServiceProfileApiService\$*",
                    // PayoutCadenceViewModel.saveCadence$1 — viewModelScope.launch lambda containing
                    // biometric + PATCH call. The ?: return@launch guard and coroutine suspension
                    // points are only exercisable via instrumented tests (real FragmentActivity needed
                    // for BiometricPrompt). Business logic paths are fully covered by ViewModel unit
                    // tests using mockk.
                    "*.PayoutCadenceViewModel\$saveCadence\$1",
                    "*.PayoutCadenceViewModel\$saveCadence\$1\$*",
                    // ActiveJobForegroundService — @AndroidEntryPoint service with field injection;
                    // foreground notification and WorkManager scheduling are OS-framework calls
                    // not exercisable in JVM unit tests. Smoke test covers lifecycle.
                    "*.ActiveJobForegroundService",
                    "*.ActiveJobForegroundService\$*",
                    // BootReceiver — goAsync() + Room call in a BroadcastReceiver; requires
                    // a real Android runtime to exercise properly.
                    "*.BootReceiver",
                    "*.BootReceiver\$*",
                    // JobOfferFullScreenActivity — Compose Activity wrapping JobOfferScreen;
                    // identical rationale to MainActivity exclusion.
                    "*.JobOfferFullScreenActivity",
                    "*.JobOfferFullScreenActivity\$*",
                    // OutboxSyncWorker is fully covered by OutboxSyncWorkerTest; the
                    // @HiltWorker-generated factory is excluded here (same as other generated DI).
                    "*.*_AssistedFactory",
                    "*.*_AssistedFactory\$*",
                    // HomeservicesTechnicianApplication.workManagerConfiguration — framework
                    // Configuration.Provider wiring, tested indirectly via WorkManager integration.
                    "*.HomeservicesTechnicianApplication",
                    "*.HomeservicesTechnicianApplication\$*",
                    // IntegrityModule + IntegrityApiService — Play Integrity SDK DI wiring (E11-S03)
                    "*.domain.integrity.di.*",
                    "*.data.integrity.IntegrityApiService",
                    // IdTokenCache, FirebaseTokenAuthenticator, SessionPrefsMigrator (E11-S02)
                    "*.IdTokenCache",
                    "*.IdTokenCache\$*",
                    "*.FirebaseTokenAuthenticator",
                    "*.FirebaseTokenAuthenticator\$*",
                    "*.SessionPrefsMigrator",
                    "*.SessionPrefsMigrator\$*",
                    "*.data.network.auth.di.*",
                    // Moshi KSP-generated JSON adapters — code-gen output, same rationale as
                    // Hilt/Room-generated classes above. Each @JsonClass(generateAdapter = true)
                    // annotation causes Moshi KSP to emit a *JsonAdapter class with 30-50 JVM
                    // branches (null checks, token-switch statements, field-loop logic) that are
                    // invoked only by the Retrofit/Moshi runtime, not by JVM unit tests.
                    // Excluding these restores the branch metric to reflect actual domain-logic
                    // coverage rather than generated serialisation plumbing.
                    // Pattern covers all generated adapter names: ClassNameJsonAdapter.
                    "*.*JsonAdapter",
                    "*.*JsonAdapter\$*",
                    // PendingActionsModule — Hilt @Provides wiring for Room database construction (E11-S01a)
                    "*.data.pendingaction.di.*",
                    // PendingActionsDatabase — Room database singleton; generated _Impl has no unit-testable logic
                    "*.PendingActionsDatabase",
                    "*.PendingActionsDatabase\$*",
                    // Room KSP-generated DAO/DB implementation classes (anonymous Runnable/Callable on Room executor)
                    "*.PendingActionsDatabase_Impl",
                    "*.PendingActionsDatabase_Impl\$*",
                    "*.PendingActionDao_Impl",
                    "*.PendingActionDao_Impl\$*",
                    // Locale DI module — @Provides + @Binds methods are framework wiring, same rationale
                    // as data.auth.di.* / data.activeJob.di.* / data.jobOffer.di.* / data.photo.di.*.
                    "*.data.locale.di.*",
                    // CrashlyticsInitializer / AppCheckInitializer / PostHogInitializer wrap Firebase + PostHog
                    // Android SDK calls; not unit-testable without a live Firebase project / device.
                    "*.CrashlyticsInitializer",
                    "*.CrashlyticsInitializer\$*",
                    "*.AppCheckInitializer",
                    "*.AppCheckInitializer\$*",
                    "*.PostHogInitializer",
                    "*.PostHogInitializer\$*",
                    // TechnicianHomeScreen — Compose screen Kt wrapper + nested lambdas.
                    // Same rationale as RatingScreenKt / AuthScreenKt / EarningsScreenKt.
                    "*.TechnicianHomeScreenKt",
                    "*.TechnicianHomeScreenKt\$*",
                    // AuthScreenKt sub-composable lambda classes not matched by "*.AuthScreenKt".
                    "*.AuthScreenKt\$*",
                    // LanguageSettingsScreen — Compose screen Kt wrapper + nested lambdas.
                    "*.LanguageSettingsScreenKt",
                    "*.LanguageSettingsScreenKt\$*",
                    // Missing DI module packages — @Provides / @Binds framework wiring.
                    "*.data.kyc.di.*",
                    "*.data.earnings.di.*",
                    "*.data.availability.di.*",
                    "*.data.complaint.di.*",
                    "*.data.jobs.di.*",
                    "*.data.location.di.*",
                    "*.notification.di.*",
                    // HiltWrapper_* generated by Hilt — same rationale as *.Hilt_*.
                    "*.HiltWrapper_*",
                    // TechnicianDashboardScreen — Compose UI composable added by home-heroo branch;
                    // same rationale as other *Kt screen exclusions (recomposition guards, palette logic).
                    "*.TechnicianDashboardScreenKt",
                    "*.TechnicianDashboardScreenKt\$*",
                    // DeleteAccountScreen / AccountDeletedScreen — Compose UI composables (E20-S08);
                    // same rationale as other *Kt screen exclusions: recomposition guards + slot-table
                    // ops are only exercisable via Paparazzi / instrumented tests.
                    "*.DeleteAccountScreenKt",
                    "*.DeleteAccountScreenKt\$*",
                    "*.AccountDeletedScreenKt",
                    "*.AccountDeletedScreenKt\$*",
                    // ErasureApiService is an internal Retrofit interface — methods invoked by
                    // Retrofit runtime, not unit-testable directly (same rationale as other ApiService exclusions).
                    "*.ErasureApiService",
                    "*.ErasureApiService\$*",
                    // ErasureModule — Hilt @Provides / @Binds methods are framework wiring,
                    // same rationale as data.auth.di.* and other DI module exclusions.
                    "*.data.erasure.di.*",
                    // ErasureRepository$DefaultImpls — Kotlin compiler-generated delegation stubs
                    // for interface default parameters; same rationale as Hilt-generated exclusions.
                    "*.ErasureRepository\$DefaultImpls",
                )
            }
        }
    }
}

// Hilt + KSP2 (K2 compiler): pass the flag that tells the Hilt KSP processor
// that the Hilt Gradle plugin IS applied and superclass validation should be
// skipped during the KSP pass (the plugin does the bytecode transform post-compile).
// Without this, KSP2 fails with "Expected @AndroidEntryPoint to have a value".
// See https://dagger.dev/hilt/gradle-setup.html#ksp
ksp {
    arg("dagger.hilt.android.internal.disableAndroidSuperclassValidation", "true")
}

// Paparazzi 1.3.5 picks up the correct layoutlib for the Compose BOM automatically.
// No paparazzi {} configuration block is needed or valid.

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.datastore.preferences)

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)
    debugImplementation(libs.compose.ui.test.manifest)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons.extended)
    implementation(libs.homeservices.design.system)
    implementation(libs.homeservices.core.nav)
    implementation(libs.kotlinx.serialization.json)

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)
    implementation(libs.androidx.hilt.navigation.compose)

    implementation(libs.sentry.android)
    implementation(libs.posthog.android)
    implementation(libs.growthbook.android)
    implementation(libs.growthbook.okhttp)

    // Firebase (BOM manages all Firebase library versions)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth.ktx)
    implementation(libs.firebase.messaging)
    implementation(libs.firebase.crashlytics.ktx)
    implementation(libs.firebase.appcheck.playintegrity)
    debugImplementation(libs.firebase.appcheck.debug)

    // Credential Manager + Google Identity Library
    implementation(libs.androidx.credentials)
    implementation(libs.androidx.credentials.playservices)
    implementation(libs.google.identity.googleid)

    // Coroutines — play-services extensions (.await() on Task<T>)
    implementation(libs.kotlinx.coroutines.play.services)

    // Auth SDKs
    implementation(libs.truecaller.sdk)
    implementation(libs.androidx.security.crypto)
    implementation(libs.androidx.biometric)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.play.services.location)
    implementation(libs.play.services.maps)
    implementation(libs.maps.compose)

    // Play Integrity API
    implementation(libs.play.integrity)

    // KYC networking + serialization
    implementation(libs.retrofit.core)
    implementation(libs.retrofit.moshi)
    implementation(libs.okhttp.core)
    implementation(libs.okhttp.logging)
    implementation(libs.moshi.kotlin)
    ksp(libs.moshi.kotlin.codegen)
    implementation(libs.androidx.browser)
    implementation(libs.firebase.storage)

    // CameraX — on-device photo capture for job stage evidence (E06-S02)
    implementation(libs.camera.core)
    implementation(libs.camera.camera2)
    implementation(libs.camera.lifecycle)
    implementation(libs.camera.view)

    // WorkManager + Hilt-Worker integration (E11-S04)
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
    // Gating on the credentials keeps upload working wherever they ARE configured — a
    // local release build with a token, or CI once the secrets are added — while letting
    // credential-less builds succeed instead of failing on an unconfigurable step.
    val hasSentryCredentials =
        !System.getenv("SENTRY_AUTH_TOKEN").isNullOrBlank() &&
            !System.getenv("SENTRY_ORG").isNullOrBlank()

    // BOTH flags are required. autoUploadProguardMapping alone is not enough — it controls
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

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git show HEAD:.github/workflows/customer-ship.yml; git show HEAD:.github/workflows/technician-ship.yml' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 350ms:
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
  # CI's release build is an R8/ProGuard compile check, and its AAB is a 7-day
  # upload-artifact — nothing here is ever published to Play (that happens locally via
  # tools/build-play-bundles.ps1). So CI acknowledges the blank observability keys rather
  # than failing on them; the hard gate stays on the builds that actually ship.
  # A CI AAB sideloaded for testing therefore reports no Sentry/PostHog/GrowthBook data.
  ALLOW_BLANK_OBSERVABILITY_KEYS: 'true'

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
      # work — release builds MUST run with the secret populated.
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
  # CI's release build is an R8/ProGuard compile check, and its AAB is a 7-day
  # upload-artifact — nothing here is ever published to Play (that happens locally via
  # tools/build-play-bundles.ps1). So CI acknowledges the blank observability keys rather
  # than failing on them; the hard gate stays on the builds that actually ship.
  # A CI AAB sideloaded for testing therefore reports no Sentry/PostHog/GrowthBook data.
  ALLOW_BLANK_OBSERVABILITY_KEYS: 'true'

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
            echo "❌ Found $count hardcoded Text() literals in ui/ — use stringResource()"
            grep -r 'Text("' technician-app/app/src/main/kotlin/com/homeservices/technician/ui/ \
              | grep -v '//\|%.1f\|\\u\|""\|" "' \
              | grep -v 'stringResource\|getString'
            exit 1
          fi
          echo "✅ No hardcoded Text() literals"

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

2026-09-06T09:58:21.842334Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git show HEAD:tools/build-play-bundles.ps1; git grep -n \"bundleRelease\\|assembleRelease\\|packageReleaseBundle\\|ALLOW_BLANK_OBSERVABILITY\" HEAD -- ':"'!docs/reviews/*'"'"` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git show HEAD:tools/build-play-bundles.ps1; git grep -n \"bundleRelease\\|assembleRelease\\|packageReleaseBundle\\|ALLOW_BLANK_OBSERVABILITY\" HEAD -- ':"'!docs/reviews/*'"'" in C:\Alok\Business Projects\wt-obs-keys
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git show HEAD:tools/build-play-bundles.ps1; git grep -n \"bundleRelease\\|assembleRelease\\|packageReleaseBundle\\|ALLOW_BLANK_OBSERVABILITY\" HEAD -- ':"'!docs/reviews/*'"'"` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git show HEAD:tools/build-play-bundles.ps1' in C:\Alok\Business Projects\wt-obs-keys
 succeeded in 322ms:
param(
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

$apps = @(
    @{
        Name = "customer"
        Prefix = "CUSTOMER"
        Directory = Join-Path $repoRoot "customer-app"
        Bundle = "app\build\outputs\bundle\release\app-release.aab"
    },
    @{
        Name = "technician"
        Prefix = "TECHNICIAN"
        Directory = Join-Path $repoRoot "technician-app"
        Bundle = "app\build\outputs\bundle\release\app-release.aab"
    }
)

function Read-LocalProperties($path) {
    $properties = @{}
    if (-not (Test-Path -LiteralPath $path)) {
        return $properties
    }

    foreach ($line in Get-Content -LiteralPath $path) {
        $trimmed = $line.Trim()
        if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) {
            continue
        }

        $parts = $trimmed -split "=", 2
        if ($parts.Count -eq 2 -and $parts[0].Trim().Length -gt 0) {
            $properties[$parts[0].Trim()] = $parts[1].Trim()
        }
    }

    return $properties
}

function Get-ReleaseProperty($properties, $prefix, $name) {
    $prefixedName = "${prefix}_${name}"
    $prefixedEnv = [Environment]::GetEnvironmentVariable($prefixedName)
    if (-not [string]::IsNullOrWhiteSpace($prefixedEnv)) {
        return $prefixedEnv
    }

    $env = [Environment]::GetEnvironmentVariable($name)
    if (-not [string]::IsNullOrWhiteSpace($env)) {
        return $env
    }

    if ($properties.ContainsKey($prefixedName) -and -not [string]::IsNullOrWhiteSpace($properties[$prefixedName])) {
        return $properties[$prefixedName]
    }

    if ($properties.ContainsKey($name) -and -not [string]::IsNullOrWhiteSpace($properties[$name])) {
        return $properties[$name]
    }

    return $null
}

function Assert-GoogleServicesNotStub($app) {
    $gsFile = Join-Path $app.Directory "app\google-services.json"
    if (-not (Test-Path -LiteralPath $gsFile -PathType Leaf)) {
        throw "google-services.json not found for $($app.Name)-app at $gsFile. The committed file is a stub; the real one is materialised by CI from the GOOGLE_SERVICES_JSON secret. For local Play AAB builds, drop the real file at this path before re-running."
    }

    $content = Get-Content -LiteralPath $gsFile -Raw
    if ($content -match "PROJECT_ID_PLACEHOLDER" -or $content -match "AIzaSyPLACEHOLDER" -or $content -match "PROJECT_NUMBER_PLACEHOLDER") {
        throw "google-services.json for $($app.Name)-app contains placeholder markers (SEC-01 stub). Refusing to build a release AAB with stub Firebase config — Auth/FCM would be broken in the published app. Replace the stub with the real google-services.json from Firebase Console (or restore from your GOOGLE_SERVICES_JSON GitHub secret) before re-running."
    }
}

function Assert-SigningConfig($app) {
    $propertiesPath = Join-Path $app.Directory "local.properties"
    $properties = Read-LocalProperties $propertiesPath
    $required = @(
        "RELEASE_STORE_FILE",
        "RELEASE_STORE_PASSWORD",
        "RELEASE_KEY_ALIAS",
        "RELEASE_KEY_PASSWORD"
    )

    $missing = @()
    foreach ($name in $required) {
        $value = Get-ReleaseProperty $properties $app.Prefix $name
        if ([string]::IsNullOrWhiteSpace($value)) {
            $missing += $name
        }
    }

    if ($missing.Count -gt 0) {
        throw "Missing release signing values for $($app.Name)-app: $($missing -join ', '). Add them to $propertiesPath or set $($app.Prefix)_* env vars."
    }

    $storeFile = Get-ReleaseProperty $properties $app.Prefix "RELEASE_STORE_FILE"
    if ([IO.Path]::IsPathRooted($storeFile)) {
        $storePath = $storeFile
    } else {
        $storePath = Join-Path $app.Directory $storeFile
    }

    if (-not (Test-Path -LiteralPath $storePath -PathType Leaf)) {
        throw "Release keystore for $($app.Name)-app was not found at $storePath."
    }
}

foreach ($app in $apps) {
    Assert-GoogleServicesNotStub $app
    Assert-SigningConfig $app

    $tasks = @()
    if ($Clean) {
        $tasks += "clean"
    }
    $tasks += ":app:bundleRelease"

    Push-Location $app.Directory
    try {
        Write-Host "Building $($app.Name)-app release bundle..."
        & ".\gradlew.bat" @tasks
        if ($LASTEXITCODE -ne 0) {
            throw "$($app.Name)-app Gradle build failed with exit code $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }

    $bundlePath = Join-Path $app.Directory $app.Bundle
    if (-not (Test-Path -LiteralPath $bundlePath -PathType Leaf)) {
        throw "$($app.Name)-app bundle was not created at $bundlePath."
    }

    Write-Host "$($app.Name)-app AAB: $bundlePath"
}

2026-09-06T09:58:28.654457Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command ".\\gradlew.bat help"` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command ".\\gradlew.bat help" in C:\Alok\Business Projects\wt-obs-keys\customer-app
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command ".\\gradlew.bat help"` rejected: blocked by policy
2026-09-06T09:58:41.455163Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --check aab4fddc4809ea0b052cfbf648590098690158e7; git diff --numstat aab4fddc4809ea0b052cfbf648590098690158e7; git grep -n "bundleRelease" HEAD'` rejected: blocked by policy
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --check aab4fddc4809ea0b052cfbf648590098690158e7; git diff --numstat aab4fddc4809ea0b052cfbf648590098690158e7; git grep -n "bundleRelease" HEAD' in C:\Alok\Business Projects\wt-obs-keys
 declined in 0ms:
`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --check aab4fddc4809ea0b052cfbf648590098690158e7; git diff --numstat aab4fddc4809ea0b052cfbf648590098690158e7; git grep -n "bundleRelease" HEAD'` rejected: blocked by policy
codex
The release-key validation, local.properties resolution, and CI opt-out are consistently wired for both Android apps. No actionable defects were identified in the diff.
The release-key validation, local.properties resolution, and CI opt-out are consistently wired for both Android apps. No actionable defects were identified in the diff.
codex-fallback: succeeded on secondary account.
