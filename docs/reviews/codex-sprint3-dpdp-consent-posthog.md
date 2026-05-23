OpenAI Codex v0.125.0 (research preview)
--------
workdir: C:\Alok\Business Projects\Urbanclap-sprint3
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR, C:\Users\alokt\.codex\memories]
reasoning effort: xhigh
reasoning summaries: none
session id: 019e5150-857c-7322-a880-9a8ba7c6a0b6
--------
user
changes against 'main'
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff 8cab4403ef84774eed5790aa789818f6832a7ac3 --stat' in C:\Alok\Business Projects\Urbanclap-sprint3
2026-05-22T20:11:43.772797Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 5.7 seconds
Output:
warning: Not a git repository. Use --no-index to compare two paths outside a working tree
usage: git diff --no-index [<options>] <path> <path> [<pathspec>...]

Diff output format options
    -p, --patch           generate patch
    -s, --no-patch        suppress diff output
    -u                    generate patch
    -U, --unified[=<n>]   generate diffs with <n> lines context
    -W, --[no-]function-context
                          generate diffs with <n> lines context
    --raw                 generate the diff in raw format
    --patch-with-raw      synonym for '-p --raw'
    --patch-with-stat     synonym for '-p --stat'
    --numstat             machine friendly --stat
    --shortstat           output only the last line of --stat
    -X, --dirstat[=<param1>,<param2>...]
                          output the distribution of relative amount of changes for each sub-directory
    --cumulative          synonym for --dirstat=cumulative
    --dirstat-by-file[=<param1>,<param2>...]
                          synonym for --dirstat=files,<param1>,<param2>...
    --check               warn if changes introduce conflict markers or whitespace errors
    --summary             condensed summary such as creations, renames and mode changes
    --name-only           show only names of changed files
    --name-status         show only names and status of changed files
    --stat[=<width>[,<name-width>[,<count>]]]
                          generate diffstat
    --stat-width <width>  generate diffstat with a given width
    --stat-name-width <width>
                          generate diffstat with a given name width
    --stat-graph-width <width>
                          generate diffstat with a given graph width
    --stat-count <count>  generate diffstat with limited lines
    --[no-]compact-summary
                          generate compact summary in diffstat
    --binary              output a binary diff that can be applied
    --[no-]full-index     show full pre- and post-image object names on the "index" lines
    --[no-]color[=<when>] show colored diff
    --ws-error-highlight <kind>
                          highlight whitespace errors in the 'context', 'old' or 'new' lines in the diff
    -z                    do not munge pathnames and use NULs as output field terminators in --raw or --numstat
    --[no-]abbrev[=<n>]   use <n> digits to display object names
    --src-prefix <prefix> show the given source prefix instead of "a/"
    --dst-prefix <prefix> show the given destination prefix instead of "b/"
    --line-prefix <prefix>
                          prepend an additional prefix to every line of output
    --no-prefix           do not show any source or destination prefix
    --default-prefix      use default prefixes a/ and b/
    --inter-hunk-context <n>
                          show context between diff hunks up to the specified number of lines
    --output-indicator-new <char>
                          specify the character to indicate a new line instead of '+'
    --output-indicator-old <char>
                          specify the character to indicate an old line instead of '-'
    --output-indicator-context <char>
                          specify the character to indicate a context instead of ' '

Diff rename options
    -B, --break-rewrites[=<n>[/<m>]]
                          break complete rewrite changes into pairs of delete and create
    -M, --find-renames[=<n>]
                          detect renames
    -D, --irreversible-delete
                          omit the preimage for deletes
    -C, --find-copies[=<n>]
                          detect copies
    --[no-]find-copies-harder
                          use unmodified files as source to find copies
    --no-renames          disable rename detection
    --[no-]rename-empty   use empty blobs as rename source
    --[no-]follow         continue listing the history of a file beyond renames
    -l <n>                prevent rename/copy detection if the number of rename/copy targets exceeds given limit

Diff algorithm options
    --minimal             produce the smallest possible diff
    -w, --ignore-all-space
                          ignore whitespace when comparing lines
    -b, --ignore-space-change
                          ignore changes in amount of whitespace
    --ignore-space-at-eol ignore changes in whitespace at EOL
    --ignore-cr-at-eol    ignore carrier-return at the end of line
    --ignore-blank-lines  ignore changes whose lines are all blank
    -I, --[no-]ignore-matching-lines <regex>
                          ignore changes whose all lines match <regex>
    --[no-]indent-heuristic
                          heuristic to shift diff hunk boundaries for easy reading
    --patience            generate diff using the "patience diff" algorithm
    --histogram           generate diff using the "histogram diff" algorithm
    --diff-algorithm <algorithm>
                          choose a diff algorithm
    --anchored <text>     generate diff using the "anchored diff" algorithm
    --word-diff[=<mode>]  show word diff, using <mode> to delimit changed words
    --word-diff-regex <regex>
                          use <regex> to decide what a word is
    --color-words[=<regex>]
                          equivalent to --word-diff=color --word-diff-regex=<regex>
    --[no-]color-moved[=<mode>]
                          moved lines of code are colored differently
    --[no-]color-moved-ws <mode>
                          how white spaces are ignored in --color-moved

Other diff options
    --[no-]relative[=<prefix>]
                          when run from subdir, exclude changes outside and show relative paths
    -a, --[no-]text       treat all files as text
    -R                    swap two inputs, reverse the diff
    --[no-]exit-code      exit with 1 if there were differences, 0 otherwise
    --[no-]quiet          disable all output of the program
    --[no-]ext-diff       allow an external diff helper to be executed
    --[no-]textconv       run external text conversion filters when comparing binary files
    --ignore-submodules[=<when>]
                          ignore changes to submodules in the diff generation
    --submodule[=<format>]
                          specify how differences in submodules are shown
    --ita-invisible-in-index
                          hide 'git add -N' entries from the index
    --ita-visible-in-index
                          treat 'git add -N' entries as real in the index
    -S <string>           look for differences that change the number of occurrences of the specified string
    -G <regex>            look for differences that change the number of occurrences of the specified regex
    --pickaxe-all         show all changes in the changeset with -S or -G
    --pickaxe-regex       treat <string> in -S as extended POSIX regular expression
    -O <file>             control the order in which files appear in the output
    --rotate-to <path>    show the change in the specified path first
    --skip-to <path>      skip the output to the specified path
    --find-object <object-id>
                          look for differences that change the number of occurrences of the specified object
    --diff-filter [(A|C|D|M|R|T|U|X|B)...[*]]
                          select files by diff type
    --max-depth <depth>   maximum tree depth to recurse
    --output <file>       output to a specific file


 exited 1 in 5658ms:
warning: Not a git repository. Use --no-index to compare two paths outside a working tree
usage: git diff --no-index [<options>] <path> <path> [<pathspec>...]

Diff output format options
    -p, --patch           generate patch
    -s, --no-patch        suppress diff output
    -u                    generate patch
    -U, --unified[=<n>]   generate diffs with <n> lines context
    -W, --[no-]function-context
                          generate diffs with <n> lines context
    --raw                 generate the diff in raw format
    --patch-with-raw      synonym for '-p --raw'
    --patch-with-stat     synonym for '-p --stat'
    --numstat             machine friendly --stat
    --shortstat           output only the last line of --stat
    -X, --dirstat[=<param1>,<param2>...]
                          output the distribution of relative amount of changes for each sub-directory
    --cumulative          synonym for --dirstat=cumulative
    --dirstat-by-file[=<param1>,<param2>...]
                          synonym for --dirstat=files,<param1>,<param2>...
    --check               warn if changes introduce conflict markers or whitespace errors
    --summary             condensed summary such as creations, renames and mode changes
    --name-only           show only names of changed files
    --name-status         show only names and status of changed files
    --stat[=<width>[,<name-width>[,<count>]]]
                          generate diffstat
    --stat-width <width>  generate diffstat with a given width
    --stat-name-width <width>
                          generate diffstat with a given name width
    --stat-graph-width <width>
                          generate diffstat with a given graph width
    --stat-count <count>  generate diffstat with limited lines
    --[no-]compact-summary
                          generate compact summary in diffstat
    --binary              output a binary diff that can be applied
    --[no-]full-index     show full pre- and post-image object names on the "index" lines
    --[no-]color[=<when>] show colored diff
    --ws-error-highlight <kind>
                          highlight whitespace errors in the 'context', 'old' or 'new' lines in the diff
    -z                    do not munge pathnames and use NULs as output field terminators in --raw or --numstat
    --[no-]abbrev[=<n>]   use <n> digits to display object names
    --src-prefix <prefix> show the given source prefix instead of "a/"
    --dst-prefix <prefix> show the given destination prefix instead of "b/"
    --line-prefix <prefix>
                          prepend an additional prefix to every line of output
    --no-prefix           do not show any source or destination prefix
    --default-prefix      use default prefixes a/ and b/
    --inter-hunk-context <n>
                          show context between diff hunks up to the specified number of lines
    --output-indicator-new <char>
                          specify the character to indicate a new line instead of '+'
    --output-indicator-old <char>
                          specify the character to indicate an old line instead of '-'
    --output-indicator-context <char>
                          specify the character to indicate a context instead of ' '

Diff rename options
    -B, --break-rewrites[=<n>[/<m>]]
                          break complete rewrite changes into pairs of delete and create
    -M, --find-renames[=<n>]
                          detect renames
    -D, --irreversible-delete
                          omit the preimage for deletes
    -C, --find-copies[=<n>]
                          detect copies
    --[no-]find-copies-harder
                          use unmodified files as source to find copies
    --no-renames          disable rename detection
    --[no-]rename-empty   use empty blobs as rename source
    --[no-]follow         continue listing the history of a file beyond renames
    -l <n>                prevent rename/copy detection if the number of rename/copy targets exceeds given limit

Diff algorithm options
    --minimal             produce the smallest possible diff
    -w, --ignore-all-space
                          ignore whitespace when comparing lines
    -b, --ignore-space-change
                          ignore changes in amount of whitespace
    --ignore-space-at-eol ignore changes in whitespace at EOL
    --ignore-cr-at-eol    ignore carrier-return at the end of line
    --ignore-blank-lines  ignore changes whose lines are all blank
    -I, --[no-]ignore-matching-lines <regex>
                          ignore changes whose all lines match <regex>
    --[no-]indent-heuristic
                          heuristic to shift diff hunk boundaries for easy reading
    --patience            generate diff using the "patience diff" algorithm
    --histogram           generate diff using the "histogram diff" algorithm
    --diff-algorithm <algorithm>
                          choose a diff algorithm
    --anchored <text>     generate diff using the "anchored diff" algorithm
    --word-diff[=<mode>]  show word diff, using <mode> to delimit changed words
    --word-diff-regex <regex>
                          use <regex> to decide what a word is
    --color-words[=<regex>]
                          equivalent to --word-diff=color --word-diff-regex=<regex>
    --[no-]color-moved[=<mode>]
                          moved lines of code are colored differently
    --[no-]color-moved-ws <mode>
                          how white spaces are ignored in --color-moved

Other diff options
    --[no-]relative[=<prefix>]
                          when run from subdir, exclude changes outside and show relative paths
    -a, --[no-]text       treat all files as text
    -R                    swap two inputs, reverse the diff
    --[no-]exit-code      exit with 1 if there were differences, 0 otherwise
    --[no-]quiet          disable all output of the program
    --[no-]ext-diff       allow an external diff helper to be executed
    --[no-]textconv       run external text conversion filters when comparing binary files
    --ignore-submodules[=<when>]
                          ignore changes to submodules in the diff generation
    --submodule[=<format>]
                          specify how differences in submodules are shown
    --ita-invisible-in-index
                          hide 'git add -N' entries from the index
    --ita-visible-in-index
                          treat 'git add -N' entries as real in the index
    -S <string>           look for differences that change the number of occurrences of the specified string
    -G <regex>            look for differences that change the number of occurrences of the specified regex
    --pickaxe-all         show all changes in the changeset with -S or -G
    --pickaxe-regex       treat <string> in -S as extended POSIX regular expression
    -O <file>             control the order in which files appear in the output
    --rotate-to <path>    show the change in the specified path first
    --skip-to <path>      skip the output to the specified path
    --find-object <object-id>
                          look for differences that change the number of occurrences of the specified object
    --diff-filter [(A|C|D|M|R|T|U|X|B)...[*]]
                          select files by diff type
    --max-depth <depth>   maximum tree depth to recurse
    --output <file>       output to a specific file


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force' in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 638ms:


    Directory: C:\Alok\Business Projects\Urbanclap-sprint3


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
d-----         5/22/2026   1:56 PM                .claire                                                              
d-----         5/22/2026   1:56 PM                .firebase                                                            
d-----         5/22/2026   1:56 PM                .githooks                                                            
d-----         5/22/2026   1:56 PM                .github                                                              
d-----         5/22/2026   1:56 PM                .serena                                                              
d-----         5/22/2026   1:56 PM                .superpowers                                                         
d-----         5/22/2026   1:56 PM                admin-web                                                            
d-----         5/22/2026   1:56 PM                api                                                                  
d-----         5/22/2026   1:56 PM                commonMain                                                           
d-----         5/22/2026   2:57 PM                core-nav                                                             
d-----         5/22/2026   3:41 PM                customer-app                                                         
d-----         5/22/2026   2:57 PM                design-system                                                        
d-----         5/22/2026   2:24 PM                docs                                                                 
d-----         5/22/2026   1:56 PM                figma                                                                
d-----         5/22/2026   1:56 PM                firebase                                                             
d-----         5/22/2026   1:56 PM                infra                                                                
d-----         5/22/2026   1:56 PM                moto-g-snapshots                                                     
d-----         5/22/2026   1:56 PM                plans                                                                
d-----         5/22/2026   1:56 PM                play-store-assets                                                    
d-----         5/22/2026   1:56 PM                technician-app                                                       
d-----         5/22/2026   1:56 PM                tools                                                                
d-----         5/22/2026   1:56 PM                _bmad                                                                
d-----         5/22/2026   1:56 PM                _bmad-output                                                         
-a----         5/22/2026   1:56 PM             26 .bmad-readiness-passed                                               
-a----         5/22/2026   1:56 PM           1649 .codex-review-passed                                                 
-a----         5/22/2026   1:56 PM             63 .firebaserc                                                          
-a-h--         5/22/2026   1:56 PM             81 .git                                                                 
-a----         5/22/2026   1:56 PM            659 .gitattributes                                                       
-a----         5/22/2026   1:56 PM           3603 .gitignore                                                           
-a----         5/22/2026   1:56 PM            694 .semgrepignore                                                       
-a----         5/22/2026   1:56 PM          14551 CLAUDE.md                                                            
-a----         5/22/2026   1:56 PM            252 firebase.json                                                        
-a----         5/22/2026   1:56 PM           5369 TOKEN-SYNC.md                                                        



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content .git' in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 410ms:
gitdir: C:/Alok/Business Projects/Urbanclap-dup/.git/worktrees/Urbanclap-sprint3

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git status --short' in C:\Alok\Business Projects\Urbanclap-sprint3
2026-05-22T20:11:53.494956Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.4 seconds
Output:
fatal: detected dubious ownership in repository at 'C:/Alok/Business Projects/Urbanclap-sprint3'
'C:/Alok/Business Projects/Urbanclap-sprint3/.git' is owned by:
	Home/alokt (S-1-5-21-1726265981-1318906982-882074505-1001)
but the current user is:
	Home/CodexSandboxOffline (S-1-5-21-1726265981-1318906982-882074505-1004)
To add an exception for this directory, call:

	git config --global --add safe.directory 'C:/Alok/Business Projects/Urbanclap-sprint3'

 exited 1 in 407ms:
fatal: detected dubious ownership in repository at 'C:/Alok/Business Projects/Urbanclap-sprint3'
'C:/Alok/Business Projects/Urbanclap-sprint3/.git' is owned by:
	Home/alokt (S-1-5-21-1726265981-1318906982-882074505-1001)
but the current user is:
	Home/CodexSandboxOffline (S-1-5-21-1726265981-1318906982-882074505-1004)
To add an exception for this directory, call:

	git config --global --add safe.directory 'C:/Alok/Business Projects/Urbanclap-sprint3'

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 --stat" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 509ms:
 customer-app/.serena/.gitignore                    |   2 +
 customer-app/.serena/project.yml                   | 133 +++++
 customer-app/app/build.gradle.kts                  |  27 +
 .../customer/HomeservicesCustomerApplication.kt    |  39 ++
 .../com/homeservices/customer/MainActivity.kt      |   4 +
 .../customer/data/consent/ConsentRepositoryImpl.kt | 141 ++++++
 .../customer/data/consent/di/ConsentModule.kt      |  36 ++
 .../customer/data/consent/di/ConsentPrefs.kt       |   7 +
 .../data/consent/remote/ConsentAuditApiService.kt  |  13 +
 .../data/consent/remote/di/ConsentApiModule.kt     |  32 ++
 .../consent/remote/dto/ConsentAuditRequestDto.kt   |  15 +
 .../homeservices/customer/di/BuildInfoProvider.kt  |   4 +
 .../customer/domain/consent/ConsentRepository.kt   |  18 +
 .../customer/domain/consent/ConsentState.kt        |  19 +
 .../domain/consent/GetConsentStateUseCase.kt       |  13 +
 .../customer/domain/consent/GrantConsentUseCase.kt |  27 +
 .../domain/consent/IsConsentRequiredUseCase.kt     |  16 +
 .../domain/consent/RevokeConsentUseCase.kt         |  19 +
 .../domain/flags/GrowthBookFeatureFlags.kt         |  16 +-
 .../customer/navigation/AppNavigation.kt           |  74 ++-
 .../homeservices/customer/navigation/MainGraph.kt  |   2 +
 .../customer/navigation/SettingsGraph.kt           |  11 +
 .../observability/analytics/AnalyticsEvents.kt     |  17 +
 .../observability/analytics/AnalyticsFacade.kt     |  15 +
 .../observability/analytics/NoOpAnalyticsFacade.kt |  19 +
 .../analytics/PostHogAnalyticsFacade.kt            |  64 +++
 .../observability/analytics/di/AnalyticsModule.kt  |  17 +
 .../homeservices/customer/ui/auth/AuthViewModel.kt |  19 +-
 .../customer/ui/booking/BookingViewModel.kt        |  49 +-
 .../customer/ui/catalogue/CatalogueHomeScreen.kt   |   6 +
 .../ui/catalogue/CatalogueHomeViewModel.kt         |   4 +
 .../ui/catalogue/ServiceDetailViewModel.kt         |  10 +
 .../customer/ui/complaint/ComplaintViewModel.kt    |   9 +
 .../customer/ui/consent/ConsentUiState.kt          |   9 +
 .../customer/ui/consent/ConsentViewModel.kt        |  87 ++++
 .../customer/ui/consent/DpdpConsentScreen.kt       | 554 +++++++++++++++++++++
 .../customer/ui/profile/ProfileScreen.kt           |   9 +
 .../customer/ui/rating/RatingViewModel.kt          |   9 +
 .../customer/ui/settings/PrivacyDataScreen.kt      |  16 +
 .../data/consent/ConsentRepositoryImplTest.kt      | 206 ++++++++
 .../domain/consent/GrantConsentUseCaseTest.kt      |  40 ++
 .../domain/consent/IsConsentRequiredUseCaseTest.kt |  21 +
 .../domain/consent/RevokeConsentUseCaseTest.kt     |  24 +
 .../domain/flags/GrowthBookFeatureFlagsTest.kt     |   9 +-
 .../flags/PhotoFirstCatalogueFeatureFlagTest.kt    |   8 +-
 .../analytics/PostHogAnalyticsFacadeTest.kt        | 111 +++++
 .../customer/ui/auth/AuthViewModelTest.kt          |   3 +-
 .../ui/booking/BookingViewModelBiometricTest.kt    |   3 +-
 .../ui/booking/BookingViewModelCreditTest.kt       |   3 +-
 .../ui/booking/BookingViewModelDuplicateTapTest.kt |   3 +-
 .../customer/ui/booking/BookingViewModelTest.kt    |   3 +-
 .../ui/catalogue/CatalogueHomeViewModelTest.kt     |   5 +-
 .../ui/catalogue/ServiceDetailTrustDossierTest.kt  |   3 +
 .../ServiceDetailViewModelConfidenceScoreTest.kt   |   2 +
 .../ServiceDetailViewModelGpsConfidenceTest.kt     |   2 +
 .../ui/catalogue/ServiceDetailViewModelTest.kt     |   6 +
 .../ui/complaint/ComplaintViewModelTest.kt         |   3 +-
 .../customer/ui/consent/ConsentViewModelTest.kt    | 192 +++++++
 .../ui/consent/DpdpConsentScreenPaparazziTest.kt   | 118 +++++
 .../ui/rating/RatingViewModelShieldTest.kt         |   3 +-
 .../customer/ui/rating/RatingViewModelTest.kt      |  17 +-
 docs/prd.md                                        |  12 +
 62 files changed, 2329 insertions(+), 49 deletions(-)
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 -- customer-app/app/build.gradle.kts customer-app/app/src/main/java/com/homeservices/customer/HomeservicesCustomerApplication.kt customer-app/app/src/main/java/com/homeservices/customer/MainActivity.kt" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 414ms:
diff --git a/customer-app/app/build.gradle.kts b/customer-app/app/build.gradle.kts
index 45936d28..c4564d85 100644
--- a/customer-app/app/build.gradle.kts
+++ b/customer-app/app/build.gradle.kts
@@ -177,6 +177,11 @@ android {
             "GROWTHBOOK_CLIENT_KEY",
             "\"${System.getenv("GROWTHBOOK_CLIENT_KEY") ?: ""}\"",
         )
+        buildConfigField(
+            "String",
+            "POSTHOG_API_KEY",
+            "\"${System.getenv("POSTHOG_API_KEY") ?: ""}\"",
+        )
         manifestPlaceholders["MAPS_API_KEY"] = mapsApiKey
     }
 
@@ -695,6 +700,27 @@ kover {
                     // covered by repository-layer integration test in W6 (E16-S04b scope).
                     "*.data.waitlist.WaitlistRepositoryImpl",
                     "*.data.waitlist.WaitlistRepositoryImpl\$*",
+                    // Analytics DI module — Hilt @Binds wiring, same rationale as other DI modules.
+                    "*.observability.analytics.di.*",
+                    // NoOpAnalyticsFacade — trivial no-op stubs; no logic to test.
+                    "*.NoOpAnalyticsFacade",
+                    // AnalyticsEvents — constants object; no runtime logic or branches.
+                    "*.AnalyticsEvents",
+                    // DpdpConsentScreen — Compose UI composable (first-launch + consent management),
+                    // same rationale as other *Kt screen classes (recomposition guards, slot-table ops).
+                    // Paparazzi @Ignored tests are recorded on CI; ViewModel logic is covered by ConsentViewModelTest.
+                    "*.DpdpConsentScreenKt",
+                    "*.DpdpConsentScreenKt\$*",
+                    // ConsentUiState — sealed data class data holders, no logic branches.
+                    "*.ConsentUiState",
+                    "*.ConsentUiState\$*",
+                    // data.consent.di — Hilt @Provides/@Binds wiring, same rationale as other DI modules.
+                    "*.data.consent.di.*",
+                    // data.consent.remote.di — Hilt @Provides wiring for ConsentAuditApiService (Retrofit).
+                    "*.data.consent.remote.di.*",
+                    // ConsentAuditApiService — Retrofit interface; methods invoked by Retrofit runtime,
+                    // same rationale as *.data.integrity.IntegrityApiService.
+                    "*.data.consent.remote.ConsentAuditApiService",
                 )
             }
         }
@@ -736,6 +762,7 @@ dependencies {
     implementation(libs.androidx.hilt.navigation.compose)
 
     implementation(libs.sentry.android)
+    implementation(libs.posthog.android)
     implementation(libs.growthbook.android)
     implementation(libs.growthbook.okhttp)
 
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 -- customer-app/app/src/main/java/com/homeservices/customer/HomeservicesCustomerApplication.kt customer-app/app/src/main/java/com/homeservices/customer/MainActivity.kt" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 427ms:
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem customer-app/app/src/main/java/com/homeservices/customer -Force' in C:\Alok\Business Projects\Urbanclap-sprint3
2026-05-22T20:12:11.947433Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.6 seconds
Output:
Get-ChildItem : Cannot find path 'C:\Alok\Business 
Projects\Urbanclap-sprint3\customer-app\app\src\main\java\com\homeservices\customer' because it does not exist.
At line:2 char:1
+ Get-ChildItem customer-app/app/src/main/java/com/homeservices/custome ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (C:\Alok\Busines...rvices\customer:String) [Get-ChildItem], ItemNotFound 
   Exception
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetChildItemCommand
 

 exited 1 in 573ms:
Get-ChildItem : Cannot find path 'C:\Alok\Business 
Projects\Urbanclap-sprint3\customer-app\app\src\main\java\com\homeservices\customer' because it does not exist.
At line:2 char:1
+ Get-ChildItem customer-app/app/src/main/java/com/homeservices/custome ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (C:\Alok\Busines...rvices\customer:String) [Get-ChildItem], ItemNotFound 
   Exception
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetChildItemCommand
 

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 --name-only | Select-String 'Homeservices|MainActivity|ConsentRepository'" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 505ms:

customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/ConsentRepositoryImpl.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/di/ConsentModule.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/di/ConsentPrefs.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/remote/ConsentAuditApiService.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/remote/di/ConsentApiModule.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/remote/dto/ConsentAuditRequestDto.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/di/BuildInfoProvider.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/ConsentRepository.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/ConsentState.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/GetConsentStateUseCase.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/GrantConsentUseCase.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/IsConsentRequiredUseCase.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/RevokeConsentUseCase.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/flags/GrowthBookFeatureFlags.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/SettingsGraph.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/AnalyticsEvents.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/AnalyticsFacade.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/NoOpAnalyticsFacade.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/PostHogAnalyticsFacade.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/di/AnalyticsModule.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthViewModel.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingViewModel.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeViewModel.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailViewModel.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint/ComplaintViewModel.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentUiState.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentViewModel.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/DpdpConsentScreen.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/profile/ProfileScreen.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings/PrivacyDataScreen.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/data/consent/ConsentRepositoryImplTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/domain/consent/GrantConsentUseCaseTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/domain/consent/IsConsentRequiredUseCaseTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/domain/consent/RevokeConsentUseCaseTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/domain/flags/GrowthBookFeatureFlagsTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/domain/flags/PhotoFirstCatalogueFeatureFlagTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/observability/analytics/PostHogAnalyticsFacadeTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthViewModelTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/booking/BookingViewModelBiometricTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/booking/BookingViewModelCreditTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/booking/BookingViewModelDuplicateTapTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/booking/BookingViewModelTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeViewModelTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailTrustDossierTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailViewModelConfidenceScoreTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailViewModelGpsConfidenceTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailViewModelTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/complaint/ComplaintViewModelTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/consent/ConsentViewModelTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/consent/DpdpConsentScreenPaparazziTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelShieldTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelTest.kt


warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 -- customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt customer-app/app/src/main/kotlin/com/homeservices/customer/domain/flags/GrowthBookFeatureFlags.kt" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 419ms:
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt
index 5306cdc6..d7d229ac 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt
@@ -4,10 +4,13 @@ import android.app.Application
 import androidx.appcompat.app.AppCompatDelegate
 import androidx.core.os.LocaleListCompat
 import com.google.android.libraries.places.api.Places
+import com.homeservices.customer.domain.consent.ConsentRepository
+import com.homeservices.customer.domain.consent.ConsentState
 import com.homeservices.customer.domain.flags.GrowthBookFeatureFlags
 import com.homeservices.customer.domain.locale.LocaleRepository
 import com.homeservices.customer.firebase.CustomerFirebaseMessagingService
 import com.homeservices.customer.observability.SentryInitializer
+import com.homeservices.customer.observability.analytics.PostHogAnalyticsFacade
 import dagger.hilt.EntryPoint
 import dagger.hilt.InstallIn
 import dagger.hilt.android.EntryPointAccessors
@@ -16,8 +19,12 @@ import dagger.hilt.components.SingletonComponent
 import kotlinx.coroutines.CoroutineScope
 import kotlinx.coroutines.Dispatchers
 import kotlinx.coroutines.SupervisorJob
+import kotlinx.coroutines.TimeoutCancellationException
 import kotlinx.coroutines.flow.first
 import kotlinx.coroutines.launch
+import kotlinx.coroutines.withTimeout
+
+private const val CONSENT_INIT_TIMEOUT_MS = 5_000L
 
 @HiltAndroidApp
 public class HomeservicesCustomerApplication : Application() {
@@ -33,6 +40,14 @@ public class HomeservicesCustomerApplication : Application() {
         public fun growthBookFeatureFlags(): GrowthBookFeatureFlags
     }
 
+    @EntryPoint
+    @InstallIn(SingletonComponent::class)
+    public interface AnalyticsEntryPoint {
+        public fun postHogAnalyticsFacade(): PostHogAnalyticsFacade
+
+        public fun consentRepository(): ConsentRepository
+    }
+
     override fun onCreate() {
         super.onCreate()
         SentryInitializer.init(this)
@@ -58,5 +73,29 @@ public class HomeservicesCustomerApplication : Application() {
             val tag = entryPoint.localeRepository().currentLocale.first()
             AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
         }
+
+        // Gate PostHog init on user's analytics consent (DPDP Act 2023 / NFR-C-5).
+        // Fire-and-forget: failures here must never propagate to sibling coroutines.
+        CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
+            val analyticsEntryPoint =
+                EntryPointAccessors
+                    .fromApplication(this@HomeservicesCustomerApplication, AnalyticsEntryPoint::class.java)
+            val analyticsOptIn =
+                try {
+                    withTimeout(CONSENT_INIT_TIMEOUT_MS) {
+                        analyticsEntryPoint
+                            .consentRepository()
+                            .consentState
+                            .first()
+                            .let { it is ConsentState.Granted && it.analyticsOptIn }
+                    }
+                } catch (e: TimeoutCancellationException) {
+                    io.sentry.Sentry.addBreadcrumb(
+                        io.sentry.Breadcrumb.info("PostHog init skipped — consent state unavailable after 5s: ${e.message}"),
+                    )
+                    false // default to no-op if consent state not available
+                }
+            analyticsEntryPoint.postHogAnalyticsFacade().initIfConsented(analyticsOptIn)
+        }
     }
 }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt
index 30e797f5..b3bc1a02 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt
@@ -13,6 +13,7 @@ import com.homeservices.customer.data.booking.PaymentResultBus
 import com.homeservices.customer.data.pendingaction.PendingActionStore
 import com.homeservices.customer.di.BuildInfoProvider
 import com.homeservices.customer.domain.booking.model.PaymentResult
+import com.homeservices.customer.domain.consent.IsConsentRequiredUseCase
 import com.homeservices.customer.domain.flags.FeatureFlags
 import com.homeservices.customer.domain.locale.IsFirstLaunchUseCase
 import com.homeservices.customer.navigation.AppNavigation
@@ -65,6 +66,8 @@ public class MainActivity :
 
     @Inject public lateinit var isFirstLaunch: IsFirstLaunchUseCase
 
+    @Inject public lateinit var isConsentRequired: IsConsentRequiredUseCase
+
     @Inject public lateinit var featureFlags: FeatureFlags
 
     /** Injected to support cold-start tier-ladder route resolution (E11-S01b-1). */
@@ -105,6 +108,7 @@ public class MainActivity :
                     activity = this,
                     pendingActionStore = pendingActionStore,
                     isFirstLaunch = isFirstLaunch,
+                    isConsentRequired = isConsentRequired,
                     featureFlags = featureFlags,
                     routeResolver = routeResolver,
                     initialDeepLink = currentDeepLink,
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/flags/GrowthBookFeatureFlags.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/flags/GrowthBookFeatureFlags.kt
index 33dabec4..7385140f 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/flags/GrowthBookFeatureFlags.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/flags/GrowthBookFeatureFlags.kt
@@ -1,6 +1,7 @@
 package com.homeservices.customer.domain.flags
 
 import com.homeservices.customer.BuildConfig
+import com.homeservices.customer.observability.analytics.AnalyticsFacade
 import com.sdk.growthbook.GBSDKBuilder
 import com.sdk.growthbook.GrowthBookSDK
 import com.sdk.growthbook.model.GBValue
@@ -25,11 +26,14 @@ import javax.inject.Singleton
  * last-cached (or default-off) posture is retained.
  *
  * E13-S05 — wires the real SDK, replacing [BuildConfigFeatureFlags].
+ * DPDP/Analytics — trackingCallback forwards experiment exposures to [AnalyticsFacade].
  */
 @Singleton
 public class GrowthBookFeatureFlags
     @Inject
-    constructor() : FeatureFlags {
+    constructor(
+        private val analytics: dagger.Lazy<AnalyticsFacade>,
+    ) : FeatureFlags {
         private val keyPresent: Boolean = BuildConfig.GROWTHBOOK_CLIENT_KEY.isNotBlank()
 
         private val sdk: GrowthBookSDK =
@@ -37,7 +41,15 @@ public class GrowthBookFeatureFlags
                 apiKey = BuildConfig.GROWTHBOOK_CLIENT_KEY.ifBlank { "placeholder" },
                 apiHost = "https://cdn.growthbook.io",
                 attributes = emptyMap<String, GBValue>(),
-                trackingCallback = { _, _ -> },
+                trackingCallback = { experiment, result ->
+                    analytics.get().track(
+                        "experiment_exposure",
+                        mapOf(
+                            "experiment_id" to experiment.key,
+                            "variant" to result.value.toString(),
+                        ),
+                    )
+                },
                 networkDispatcher = GBNetworkDispatcherOkHttp(),
                 // Disable caching when key is blank so Android's CachingImpl never requires
                 // a Context (safe in unit tests and CI without a live key).
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 -- customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/ConsentRepositoryImpl.kt customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 519ms:
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/ConsentRepositoryImpl.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/ConsentRepositoryImpl.kt
new file mode 100644
index 00000000..c058c6ec
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/ConsentRepositoryImpl.kt
@@ -0,0 +1,141 @@
+package com.homeservices.customer.data.consent
+
+import androidx.datastore.core.DataStore
+import androidx.datastore.preferences.core.Preferences
+import androidx.datastore.preferences.core.booleanPreferencesKey
+import androidx.datastore.preferences.core.edit
+import androidx.datastore.preferences.core.intPreferencesKey
+import androidx.datastore.preferences.core.longPreferencesKey
+import androidx.datastore.preferences.core.stringPreferencesKey
+import com.homeservices.customer.data.consent.di.ConsentPrefs
+import com.homeservices.customer.data.consent.remote.ConsentAuditApiService
+import com.homeservices.customer.data.consent.remote.dto.ConsentAuditRequestDto
+import com.homeservices.customer.domain.consent.CURRENT_CONSENT_VERSION
+import com.homeservices.customer.domain.consent.ConsentRepository
+import com.homeservices.customer.domain.consent.ConsentState
+import io.sentry.Breadcrumb
+import io.sentry.Sentry
+import kotlinx.coroutines.CancellationException
+import kotlinx.coroutines.flow.Flow
+import kotlinx.coroutines.flow.map
+import java.time.Instant
+import javax.inject.Inject
+import javax.inject.Singleton
+
+@Singleton
+public class ConsentRepositoryImpl
+    @Inject
+    constructor(
+        @ConsentPrefs private val dataStore: DataStore<Preferences>,
+        private val consentAuditApiService: ConsentAuditApiService,
+    ) : ConsentRepository {
+        private companion object {
+            val KEY_CONSENT_STATE = stringPreferencesKey("consent_state")
+            val KEY_CONSENT_VERSION = intPreferencesKey("consent_version")
+            val KEY_GRANTED_AT = longPreferencesKey("consent_granted_at")
+            val KEY_ANALYTICS = booleanPreferencesKey("consent_analytics")
+            val KEY_CRASH = booleanPreferencesKey("consent_crash")
+            val KEY_MARKETING = booleanPreferencesKey("consent_marketing")
+
+            const val STATE_GRANTED = "GRANTED"
+            const val STATE_REVOKED = "REVOKED"
+        }
+
+        override val consentState: Flow<ConsentState> =
+            dataStore.data.map { prefs ->
+                when (prefs[KEY_CONSENT_STATE]) {
+                    STATE_GRANTED -> {
+                        val version = prefs[KEY_CONSENT_VERSION]
+                        val grantedAt = prefs[KEY_GRANTED_AT]
+                        if (version != null && grantedAt != null) {
+                            ConsentState.Granted(
+                                version = version,
+                                grantedAt = Instant.ofEpochMilli(grantedAt),
+                                analyticsOptIn = prefs[KEY_ANALYTICS] ?: false,
+                                crashOptIn = prefs[KEY_CRASH] ?: false,
+                                marketingOptIn = prefs[KEY_MARKETING] ?: false,
+                            )
+                        } else {
+                            ConsentState.NotGiven
+                        }
+                    }
+                    STATE_REVOKED -> ConsentState.Revoked
+                    else -> ConsentState.NotGiven
+                }
+            }
+
+        override val isConsentRequired: Flow<Boolean> =
+            consentState.map { state ->
+                state is ConsentState.NotGiven ||
+                    state is ConsentState.Revoked ||
+                    (state is ConsentState.Granted && state.version < CURRENT_CONSENT_VERSION)
+            }
+
+        @Suppress("TooGenericExceptionCaught")
+        override suspend fun grantConsent(
+            analyticsOptIn: Boolean,
+            crashOptIn: Boolean,
+            marketingOptIn: Boolean,
+        ) {
+            dataStore.edit { prefs ->
+                prefs[KEY_CONSENT_STATE] = STATE_GRANTED
+                prefs[KEY_CONSENT_VERSION] = CURRENT_CONSENT_VERSION
+                prefs[KEY_GRANTED_AT] = Instant.now().toEpochMilli()
+                prefs[KEY_ANALYTICS] = analyticsOptIn
+                prefs[KEY_CRASH] = crashOptIn
+                prefs[KEY_MARKETING] = marketingOptIn
+            }
+
+            // Best-effort audit POST — never throws to caller.
+            try {
+                consentAuditApiService.postConsentAudit(
+                    ConsentAuditRequestDto(
+                        action = "GRANTED",
+                        version = CURRENT_CONSENT_VERSION,
+                        timestamp = Instant.now().toString(), // ISO-8601 UTC
+                        analyticsOptIn = analyticsOptIn,
+                        crashOptIn = crashOptIn,
+                        marketingOptIn = marketingOptIn,
+                    ),
+                )
+            } catch (e: CancellationException) {
+                throw e
+            } catch (e: Exception) {
+                Sentry.addBreadcrumb(
+                    Breadcrumb.info("consent-audit POST failed (best-effort): ${e.message}"),
+                )
+            }
+        }
+
+        @Suppress("TooGenericExceptionCaught")
+        override suspend fun revokeConsent() {
+            dataStore.edit { prefs ->
+                prefs[KEY_CONSENT_STATE] = STATE_REVOKED
+                prefs.remove(KEY_CONSENT_VERSION)
+                prefs.remove(KEY_GRANTED_AT)
+                prefs.remove(KEY_ANALYTICS)
+                prefs.remove(KEY_CRASH)
+                prefs.remove(KEY_MARKETING)
+            }
+
+            // Best-effort audit POST — never throws to caller.
+            try {
+                consentAuditApiService.postConsentAudit(
+                    ConsentAuditRequestDto(
+                        action = "REVOKED",
+                        version = CURRENT_CONSENT_VERSION,
+                        timestamp = Instant.now().toString(), // ISO-8601 UTC
+                        analyticsOptIn = false,
+                        crashOptIn = false,
+                        marketingOptIn = false,
+                    ),
+                )
+            } catch (e: CancellationException) {
+                throw e
+            } catch (e: Exception) {
+                Sentry.addBreadcrumb(
+                    Breadcrumb.info("consent-audit POST failed (best-effort): ${e.message}"),
+                )
+            }
+        }
+    }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/ConsentRepository.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/ConsentRepository.kt
new file mode 100644
index 00000000..939992d6
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/ConsentRepository.kt
@@ -0,0 +1,18 @@
+package com.homeservices.customer.domain.consent
+
+import kotlinx.coroutines.flow.Flow
+
+public interface ConsentRepository {
+    public val consentState: Flow<ConsentState>
+
+    /** True if consent is [ConsentState.NotGiven] or granted at a version older than [CURRENT_CONSENT_VERSION]. */
+    public val isConsentRequired: Flow<Boolean>
+
+    public suspend fun grantConsent(
+        analyticsOptIn: Boolean,
+        crashOptIn: Boolean,
+        marketingOptIn: Boolean,
+    )
+
+    public suspend fun revokeConsent()
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/ConsentState.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/ConsentState.kt
new file mode 100644
index 00000000..6aa88494
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/ConsentState.kt
@@ -0,0 +1,19 @@
+package com.homeservices.customer.domain.consent
+
+import java.time.Instant
+
+public sealed class ConsentState {
+    public data object NotGiven : ConsentState()
+
+    public data class Granted(
+        val version: Int,
+        val grantedAt: Instant,
+        val analyticsOptIn: Boolean,
+        val crashOptIn: Boolean,
+        val marketingOptIn: Boolean,
+    ) : ConsentState()
+
+    public data object Revoked : ConsentState()
+}
+
+public const val CURRENT_CONSENT_VERSION: Int = 1
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/GetConsentStateUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/GetConsentStateUseCase.kt
new file mode 100644
index 00000000..bb10dbce
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/GetConsentStateUseCase.kt
@@ -0,0 +1,13 @@
+package com.homeservices.customer.domain.consent
+
+import kotlinx.coroutines.flow.Flow
+import javax.inject.Inject
+
+/** Expose the current [ConsentState] as a hot [Flow] sourced from DataStore. */
+public class GetConsentStateUseCase
+    @Inject
+    constructor(
+        private val consentRepository: ConsentRepository,
+    ) {
+        public operator fun invoke(): Flow<ConsentState> = consentRepository.consentState
+    }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/GrantConsentUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/GrantConsentUseCase.kt
new file mode 100644
index 00000000..0bbbadd4
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/GrantConsentUseCase.kt
@@ -0,0 +1,27 @@
+package com.homeservices.customer.domain.consent
+
+import javax.inject.Inject
+
+/**
+ * Grant DPDP consent.
+ *
+ * Delegates entirely to [ConsentRepository.grantConsent], which persists the
+ * consent state and fires a best-effort audit POST to the server internally.
+ */
+public class GrantConsentUseCase
+    @Inject
+    constructor(
+        private val consentRepository: ConsentRepository,
+    ) {
+        public suspend operator fun invoke(
+            analyticsOptIn: Boolean,
+            crashOptIn: Boolean,
+            marketingOptIn: Boolean,
+        ) {
+            consentRepository.grantConsent(
+                analyticsOptIn = analyticsOptIn,
+                crashOptIn = crashOptIn,
+                marketingOptIn = marketingOptIn,
+            )
+        }
+    }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/IsConsentRequiredUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/IsConsentRequiredUseCase.kt
new file mode 100644
index 00000000..d024f7d3
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/IsConsentRequiredUseCase.kt
@@ -0,0 +1,16 @@
+package com.homeservices.customer.domain.consent
+
+import kotlinx.coroutines.flow.Flow
+import javax.inject.Inject
+
+/**
+ * Returns a [Flow] that emits `true` when the user must be shown the consent gate
+ * (i.e. consent is [ConsentState.NotGiven] or was granted at an older version).
+ */
+public class IsConsentRequiredUseCase
+    @Inject
+    constructor(
+        private val consentRepository: ConsentRepository,
+    ) {
+        public operator fun invoke(): Flow<Boolean> = consentRepository.isConsentRequired
+    }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/RevokeConsentUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/RevokeConsentUseCase.kt
new file mode 100644
index 00000000..cafcd1db
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/consent/RevokeConsentUseCase.kt
@@ -0,0 +1,19 @@
+package com.homeservices.customer.domain.consent
+
+import javax.inject.Inject
+
+/**
+ * Revoke DPDP consent.
+ *
+ * Delegates entirely to [ConsentRepository.revokeConsent], which persists the
+ * revocation and fires a best-effort audit POST to the server internally.
+ */
+public class RevokeConsentUseCase
+    @Inject
+    constructor(
+        private val consentRepository: ConsentRepository,
+    ) {
+        public suspend operator fun invoke() {
+            consentRepository.revokeConsent()
+        }
+    }
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 -- customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/di customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/remote customer-app/app/src/main/kotlin/com/homeservices/customer/di/BuildInfoProvider.kt" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 455ms:
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/di/ConsentModule.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/di/ConsentModule.kt
new file mode 100644
index 00000000..139fe2b3
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/di/ConsentModule.kt
@@ -0,0 +1,36 @@
+package com.homeservices.customer.data.consent.di
+
+import android.content.Context
+import androidx.datastore.core.DataStore
+import androidx.datastore.preferences.core.PreferenceDataStoreFactory
+import androidx.datastore.preferences.core.Preferences
+import androidx.datastore.preferences.preferencesDataStoreFile
+import com.homeservices.customer.data.consent.ConsentRepositoryImpl
+import com.homeservices.customer.domain.consent.ConsentRepository
+import dagger.Binds
+import dagger.Module
+import dagger.Provides
+import dagger.hilt.InstallIn
+import dagger.hilt.android.qualifiers.ApplicationContext
+import dagger.hilt.components.SingletonComponent
+import javax.inject.Singleton
+
+@Module
+@InstallIn(SingletonComponent::class)
+public abstract class ConsentModule {
+    @Binds
+    @Singleton
+    public abstract fun bindConsentRepository(impl: ConsentRepositoryImpl): ConsentRepository
+
+    public companion object {
+        @Provides
+        @Singleton
+        @ConsentPrefs
+        public fun provideConsentDataStore(
+            @ApplicationContext context: Context,
+        ): DataStore<Preferences> =
+            PreferenceDataStoreFactory.create(
+                produceFile = { context.preferencesDataStoreFile("consent_prefs") },
+            )
+    }
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/di/ConsentPrefs.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/di/ConsentPrefs.kt
new file mode 100644
index 00000000..6a00f8b9
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/di/ConsentPrefs.kt
@@ -0,0 +1,7 @@
+package com.homeservices.customer.data.consent.di
+
+import javax.inject.Qualifier
+
+@Qualifier
+@Retention(AnnotationRetention.BINARY)
+public annotation class ConsentPrefs
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/remote/ConsentAuditApiService.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/remote/ConsentAuditApiService.kt
new file mode 100644
index 00000000..68e9681c
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/remote/ConsentAuditApiService.kt
@@ -0,0 +1,13 @@
+package com.homeservices.customer.data.consent.remote
+
+import com.homeservices.customer.data.consent.remote.dto.ConsentAuditRequestDto
+import retrofit2.Response
+import retrofit2.http.Body
+import retrofit2.http.POST
+
+public interface ConsentAuditApiService {
+    @POST("v1/users/me/consent-audit")
+    public suspend fun postConsentAudit(
+        @Body body: ConsentAuditRequestDto,
+    ): Response<Unit>
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/remote/di/ConsentApiModule.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/remote/di/ConsentApiModule.kt
new file mode 100644
index 00000000..60f92d19
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/remote/di/ConsentApiModule.kt
@@ -0,0 +1,32 @@
+package com.homeservices.customer.data.consent.remote.di
+
+import com.homeservices.customer.BuildConfig
+import com.homeservices.customer.data.booking.di.AuthOkHttpClient
+import com.homeservices.customer.data.consent.remote.ConsentAuditApiService
+import com.squareup.moshi.Moshi
+import dagger.Module
+import dagger.Provides
+import dagger.hilt.InstallIn
+import dagger.hilt.components.SingletonComponent
+import okhttp3.OkHttpClient
+import retrofit2.Retrofit
+import retrofit2.converter.moshi.MoshiConverterFactory
+import javax.inject.Singleton
+
+@Module
+@InstallIn(SingletonComponent::class)
+public object ConsentApiModule {
+    @Provides
+    @Singleton
+    public fun provideConsentAuditApiService(
+        @AuthOkHttpClient client: OkHttpClient,
+        moshi: Moshi,
+    ): ConsentAuditApiService =
+        Retrofit
+            .Builder()
+            .baseUrl(BuildConfig.API_BASE_URL + "/")
+            .addConverterFactory(MoshiConverterFactory.create(moshi))
+            .client(client)
+            .build()
+            .create(ConsentAuditApiService::class.java)
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/remote/dto/ConsentAuditRequestDto.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/remote/dto/ConsentAuditRequestDto.kt
new file mode 100644
index 00000000..7b19c25e
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/consent/remote/dto/ConsentAuditRequestDto.kt
@@ -0,0 +1,15 @@
+package com.homeservices.customer.data.consent.remote.dto
+
+import com.squareup.moshi.Json
+import com.squareup.moshi.JsonClass
+
+@JsonClass(generateAdapter = true)
+public data class ConsentAuditRequestDto(
+    @Json(name = "action") val action: String,
+    @Json(name = "version") val version: Int,
+    /** ISO-8601 UTC timestamp, e.g. "2026-05-22T10:30:00Z" (Instant.toString()). */
+    @Json(name = "timestamp") val timestamp: String,
+    @Json(name = "analytics_opt_in") val analyticsOptIn: Boolean,
+    @Json(name = "crash_opt_in") val crashOptIn: Boolean,
+    @Json(name = "marketing_opt_in") val marketingOptIn: Boolean,
+)
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/di/BuildInfoProvider.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/di/BuildInfoProvider.kt
index ec9779be..14ce16d2 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/di/BuildInfoProvider.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/di/BuildInfoProvider.kt
@@ -1,5 +1,6 @@
 package com.homeservices.customer.di
 
+import com.homeservices.customer.BuildConfig
 import javax.inject.Singleton
 
 @Singleton
@@ -10,6 +11,9 @@ public class BuildInfoProvider(
     public val shortSha: String
         get() = if (gitSha.length <= SHORT_SHA_LENGTH) gitSha else gitSha.substring(0, SHORT_SHA_LENGTH)
 
+    /** PostHog project API key. Empty string in CI/debug builds without a key — init is skipped when blank. */
+    public val postHogApiKey: String = BuildConfig.POSTHOG_API_KEY
+
     private companion object {
         const val SHORT_SHA_LENGTH: Int = 8
     }
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 -- customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 503ms:
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/AnalyticsEvents.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/AnalyticsEvents.kt
new file mode 100644
index 00000000..e3e7319c
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/AnalyticsEvents.kt
@@ -0,0 +1,17 @@
+package com.homeservices.customer.observability.analytics
+
+public object AnalyticsEvents {
+    public const val AUTH_START: String = "auth_start"
+    public const val AUTH_OTP_SENT: String = "auth_otp_sent"
+    public const val AUTH_SUCCESS: String = "auth_success"
+    public const val AUTH_FAILURE: String = "auth_failure"
+    public const val CATALOGUE_VIEW: String = "catalogue_view"
+    public const val SERVICE_VIEW: String = "service_view"
+    public const val BOOKING_CREATE_START: String = "booking_create_start"
+    public const val BOOKING_CREATE_SUCCESS: String = "booking_create_success"
+    public const val PAYMENT_INITIATED: String = "payment_initiated"
+    public const val PAYMENT_SUCCESS: String = "payment_success"
+    public const val PAYMENT_FAILURE: String = "payment_failure"
+    public const val RATING_SUBMITTED: String = "rating_submitted"
+    public const val COMPLAINT_FILED: String = "complaint_filed"
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/AnalyticsFacade.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/AnalyticsFacade.kt
new file mode 100644
index 00000000..6764c92e
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/AnalyticsFacade.kt
@@ -0,0 +1,15 @@
+package com.homeservices.customer.observability.analytics
+
+public interface AnalyticsFacade {
+    public fun track(
+        event: String,
+        properties: Map<String, Any> = emptyMap(),
+    )
+
+    public fun identify(
+        userId: String,
+        traits: Map<String, Any> = emptyMap(),
+    )
+
+    public fun reset()
+}
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/NoOpAnalyticsFacade.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/NoOpAnalyticsFacade.kt
new file mode 100644
index 00000000..a28005d1
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/NoOpAnalyticsFacade.kt
@@ -0,0 +1,19 @@
+package com.homeservices.customer.observability.analytics
+
+import javax.inject.Inject
+
+public class NoOpAnalyticsFacade
+    @Inject
+    constructor() : AnalyticsFacade {
+        override fun track(
+            event: String,
+            properties: Map<String, Any>,
+        ): Unit = Unit
+
+        override fun identify(
+            userId: String,
+            traits: Map<String, Any>,
+        ): Unit = Unit
+
+        override fun reset(): Unit = Unit
+    }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/PostHogAnalyticsFacade.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/PostHogAnalyticsFacade.kt
new file mode 100644
index 00000000..d3718c55
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/PostHogAnalyticsFacade.kt
@@ -0,0 +1,64 @@
+package com.homeservices.customer.observability.analytics
+
+import android.content.Context
+import com.homeservices.customer.di.BuildInfoProvider
+import com.posthog.PostHog
+import com.posthog.android.PostHogAndroid
+import com.posthog.android.PostHogAndroidConfig
+import dagger.hilt.android.qualifiers.ApplicationContext
+import java.util.concurrent.atomic.AtomicBoolean
+import javax.inject.Inject
+import javax.inject.Singleton
+
+@Singleton
+public class PostHogAnalyticsFacade
+    @Inject
+    constructor(
+        @ApplicationContext private val context: Context,
+        private val buildInfoProvider: BuildInfoProvider,
+    ) : AnalyticsFacade {
+        private val posthogInitialized = AtomicBoolean(false)
+
+        /**
+         * Initializes PostHog if [analyticsOptIn] is true and initialization has not yet occurred.
+         * Skips silently when the API key is blank (CI / local dev without a key).
+         * Safe to call multiple times — only the first call with [analyticsOptIn]=true takes effect.
+         * Thread-safe: uses compareAndSet to prevent double-initialization under concurrent calls.
+         */
+        public fun initIfConsented(analyticsOptIn: Boolean) {
+            if (!analyticsOptIn || !posthogInitialized.compareAndSet(false, true)) return
+            val apiKey = buildInfoProvider.postHogApiKey
+            if (apiKey.isBlank()) {
+                posthogInitialized.set(false) // allow retry if key becomes available
+                return
+            }
+            PostHogAndroid.setup(context, PostHogAndroidConfig(apiKey, "https://app.posthog.com"))
+        }
+
+        override fun track(
+            event: String,
+            properties: Map<String, Any>,
+        ) {
+            if (!posthogInitialized.get()) return
+            runCatching {
+                PostHog.capture(event, properties = properties)
+            }
+        }
+
+        override fun identify(
+            userId: String,
+            traits: Map<String, Any>,
+        ) {
+            if (!posthogInitialized.get()) return
+            runCatching {
+                PostHog.identify(userId, userProperties = traits)
+            }
+        }
+
+        override fun reset() {
+            if (!posthogInitialized.get()) return
+            runCatching {
+                PostHog.reset()
+            }
+        }
+    }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/di/AnalyticsModule.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/di/AnalyticsModule.kt
new file mode 100644
index 00000000..cd5d55ce
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/di/AnalyticsModule.kt
@@ -0,0 +1,17 @@
+package com.homeservices.customer.observability.analytics.di
+
+import com.homeservices.customer.observability.analytics.AnalyticsFacade
+import com.homeservices.customer.observability.analytics.PostHogAnalyticsFacade
+import dagger.Binds
+import dagger.Module
+import dagger.hilt.InstallIn
+import dagger.hilt.components.SingletonComponent
+import javax.inject.Singleton
+
+@Module
+@InstallIn(SingletonComponent::class)
+public abstract class AnalyticsModule {
+    @Binds
+    @Singleton
+    public abstract fun bindAnalyticsFacade(impl: PostHogAnalyticsFacade): AnalyticsFacade
+}
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 -- customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/SettingsGraph.kt customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentViewModel.kt customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentUiState.kt" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 433ms:
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt
index 0293b252..ab3a6051 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt
@@ -28,9 +28,11 @@ import com.homeservices.corenav.PendingActionStatus
 import com.homeservices.customer.data.auth.SessionManager
 import com.homeservices.customer.data.pendingaction.PendingActionStore
 import com.homeservices.customer.domain.auth.model.AuthState
+import com.homeservices.customer.domain.consent.IsConsentRequiredUseCase
 import com.homeservices.customer.domain.flags.FeatureFlags
 import com.homeservices.customer.domain.locale.IsFirstLaunchUseCase
 import com.homeservices.customer.observability.SentryContextBinder
+import com.homeservices.customer.ui.consent.DpdpConsentScreen
 import com.homeservices.customer.ui.locale.FirstLaunchLanguageScreen
 import com.homeservices.customer.ui.rating.RatingRoutes
 
@@ -46,6 +48,13 @@ public object LocaleRoutes {
     public const val DELETE_ACCOUNT: String = "delete_account"
     public const val DELETE_ACCOUNT_CONFIRM: String = "delete_account_confirm"
     public const val DELETE_ACCOUNT_COOL_OFF: String = "delete_account_cool_off"
+
+    // DPDP consent gate (WS-D) — shown on first launch before locale picker,
+    // and accessible from Settings → Privacy & data → Manage consent.
+    public const val DPDP_CONSENT: String = "dpdp_consent"
+
+    // Consent management route wired in SettingsGraph (revoke / update consent).
+    public const val CONSENT_MANAGEMENT: String = "consent_management"
 }
 
 /**
@@ -73,31 +82,35 @@ internal fun AppNavigation(
     activity: FragmentActivity,
     pendingActionStore: PendingActionStore,
     isFirstLaunch: IsFirstLaunchUseCase,
+    isConsentRequired: IsConsentRequiredUseCase,
     featureFlags: FeatureFlags,
     modifier: Modifier = Modifier,
     routeResolver: CustomerRouteResolver? = null,
     initialDeepLink: String? = null,
 ) {
-    // Initial value is null (loading) so returning users with first_launch_completed=true
-    // never see the picker on cold start. We render a blank Surface until DataStore emits.
-    // Per Codex P2: avoid showing onboarding to returning users while the preference loads.
+    // Both booleans start as null (loading) so no screen flashes before DataStore emits.
+    // We hold the blank Surface until BOTH emit — prevents consent/onboarding race.
     val firstLaunchPending: Boolean? =
         isFirstLaunch().collectAsStateWithLifecycle(initialValue = null as Boolean?).value
+    val consentRequired: Boolean? =
+        isConsentRequired().collectAsStateWithLifecycle(initialValue = null as Boolean?).value
 
-    when (firstLaunchPending) {
-        null -> Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {}
-        else ->
-            AppNavigationReady(
-                sessionManager = sessionManager,
-                activity = activity,
-                pendingActionStore = pendingActionStore,
-                featureFlags = featureFlags,
-                firstLaunchPending = firstLaunchPending,
-                modifier = modifier,
-                routeResolver = routeResolver,
-                initialDeepLink = initialDeepLink,
-            )
+    if (firstLaunchPending == null || consentRequired == null) {
+        Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {}
+        return
     }
+
+    AppNavigationReady(
+        sessionManager = sessionManager,
+        activity = activity,
+        pendingActionStore = pendingActionStore,
+        featureFlags = featureFlags,
+        firstLaunchPending = firstLaunchPending,
+        consentRequired = consentRequired,
+        modifier = modifier,
+        routeResolver = routeResolver,
+        initialDeepLink = initialDeepLink,
+    )
 }
 
 /**
@@ -106,6 +119,7 @@ internal fun AppNavigation(
  * Extracted from [AppNavigation] to satisfy detekt LongMethod and CyclomaticComplexMethod
  * limits — the outer function handles the loading gate only; all navigation wiring lives here.
  */
+@Suppress("LongMethod")
 @Composable
 private fun AppNavigationReady(
     sessionManager: SessionManager,
@@ -113,6 +127,7 @@ private fun AppNavigationReady(
     pendingActionStore: PendingActionStore,
     featureFlags: FeatureFlags,
     firstLaunchPending: Boolean,
+    consentRequired: Boolean,
     modifier: Modifier,
     routeResolver: CustomerRouteResolver?,
     initialDeepLink: String?,
@@ -120,13 +135,20 @@ private fun AppNavigationReady(
     val context = LocalContext.current
     val authState by sessionManager.authState.collectAsStateWithLifecycle()
     val navController = rememberNavController()
-    val startDestination = if (firstLaunchPending) LocaleRoutes.FIRST_LAUNCH else ROUTE_AUTH
+    // Consent gate wins over locale picker; both win over auth.
+    val startDestination =
+        when {
+            consentRequired -> LocaleRoutes.DPDP_CONSENT
+            firstLaunchPending -> LocaleRoutes.FIRST_LAUNCH
+            else -> ROUTE_AUTH
+        }
     val notificationPermissionLauncher =
         rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}
 
     AuthStateEffect(
         authState = authState,
         firstLaunchPending = firstLaunchPending,
+        consentRequired = consentRequired,
         context = context,
         navController = navController,
         notificationPermissionLauncher = notificationPermissionLauncher,
@@ -147,6 +169,19 @@ private fun AppNavigationReady(
     }
 
     NavHost(navController = navController, startDestination = startDestination, modifier = modifier) {
+        // DPDP consent gate — shown when consent is required before first-launch locale picker.
+        // On completion, navigates to locale picker if needed, otherwise straight to auth.
+        composable(LocaleRoutes.DPDP_CONSENT) {
+            DpdpConsentScreen(
+                onConsentComplete = {
+                    val next = if (firstLaunchPending) LocaleRoutes.FIRST_LAUNCH else ROUTE_AUTH
+                    navController.navigate(next) {
+                        popUpTo(LocaleRoutes.DPDP_CONSENT) { inclusive = true }
+                        launchSingleTop = true
+                    }
+                },
+            )
+        }
         composable(LocaleRoutes.FIRST_LAUNCH) {
             FirstLaunchLanguageScreen(
                 onConfirmed = {
@@ -171,12 +206,13 @@ private fun AppNavigationReady(
 private fun AuthStateEffect(
     authState: AuthState,
     firstLaunchPending: Boolean,
+    consentRequired: Boolean,
     context: Context,
     navController: NavController,
     notificationPermissionLauncher: ActivityResultLauncher<String>,
 ) {
-    LaunchedEffect(authState, firstLaunchPending) {
-        if (firstLaunchPending) return@LaunchedEffect
+    LaunchedEffect(authState, firstLaunchPending, consentRequired) {
+        if (firstLaunchPending || consentRequired) return@LaunchedEffect
         when (val currentAuth = authState) {
             is AuthState.Authenticated -> {
                 navController.navigate(ROUTE_MAIN) {
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt
index d7afbbe3..1d738ac0 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt
@@ -115,6 +115,8 @@ private fun NavGraphBuilder.homeDestination(
                 }
             },
             onPriceApproval = { id -> navController.navigate(BookingRoutes.priceApprovalRoute(id)) },
+            // WS-D: consent management accessible from Profile tab
+            onManageConsentClick = { navController.navigate(LocaleRoutes.CONSENT_MANAGEMENT) },
         )
     }
 }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/SettingsGraph.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/SettingsGraph.kt
index a69cb082..85936481 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/SettingsGraph.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/SettingsGraph.kt
@@ -9,6 +9,7 @@ import androidx.navigation.compose.composable
 import androidx.navigation.navArgument
 import com.homeservices.customer.domain.flags.FeatureFlags
 import com.homeservices.customer.ui.complaint.ComplaintRoutes
+import com.homeservices.customer.ui.consent.DpdpConsentScreen
 import com.homeservices.customer.ui.deleteaccount.DeleteAccountConfirmScreen
 import com.homeservices.customer.ui.deleteaccount.DeleteAccountCoolOffScreen
 import com.homeservices.customer.ui.deleteaccount.DeleteAccountScreen
@@ -59,6 +60,16 @@ internal fun NavGraphBuilder.settingsGraph(
             onDownloadData = null,
             onDeleteAccount = { navController.navigate(LocaleRoutes.DELETE_ACCOUNT) },
             showDeleteAccount = featureFlags.dpdpSelfServiceEnabled(),
+            onManageConsentClick = { navController.navigate(LocaleRoutes.CONSENT_MANAGEMENT) },
+        )
+    }
+
+    // Consent management route — accessible from Settings → Privacy & data.
+    // Uses the same DpdpConsentScreen composable but pops back on completion instead
+    // of navigating forward to the auth flow.
+    composable(LocaleRoutes.CONSENT_MANAGEMENT) {
+        DpdpConsentScreen(
+            onConsentComplete = { navController.popBackStack() },
         )
     }
 
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentUiState.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentUiState.kt
new file mode 100644
index 00000000..e8b94614
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentUiState.kt
@@ -0,0 +1,9 @@
+package com.homeservices.customer.ui.consent
+
+public data class ConsentUiState(
+    val analyticsOptIn: Boolean = true,
+    val crashOptIn: Boolean = true,
+    val marketingOptIn: Boolean = false,
+    val isLoading: Boolean = false,
+    val error: String? = null,
+)
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentViewModel.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentViewModel.kt
new file mode 100644
index 00000000..489958d5
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentViewModel.kt
@@ -0,0 +1,87 @@
+package com.homeservices.customer.ui.consent
+
+import androidx.lifecycle.ViewModel
+import androidx.lifecycle.viewModelScope
+import com.homeservices.customer.domain.consent.GrantConsentUseCase
+import com.homeservices.customer.domain.consent.IsConsentRequiredUseCase
+import dagger.hilt.android.lifecycle.HiltViewModel
+import kotlinx.coroutines.CancellationException
+import kotlinx.coroutines.channels.Channel
+import kotlinx.coroutines.flow.Flow
+import kotlinx.coroutines.flow.MutableStateFlow
+import kotlinx.coroutines.flow.StateFlow
+import kotlinx.coroutines.flow.asStateFlow
+import kotlinx.coroutines.flow.receiveAsFlow
+import kotlinx.coroutines.flow.update
+import kotlinx.coroutines.launch
+import javax.inject.Inject
+
+@HiltViewModel
+public class ConsentViewModel
+    @Inject
+    constructor(
+        private val grantConsentUseCase: GrantConsentUseCase,
+        @Suppress("UnusedPrivateMember")
+        private val isConsentRequiredUseCase: IsConsentRequiredUseCase,
+    ) : ViewModel() {
+        private val _uiState = MutableStateFlow(ConsentUiState())
+        public val uiState: StateFlow<ConsentUiState> = _uiState.asStateFlow()
+
+        private val _navigateNext = Channel<Unit>(Channel.BUFFERED)
+        public val navigateNext: Flow<Unit> = _navigateNext.receiveAsFlow()
+
+        public fun toggleAnalytics(value: Boolean) {
+            _uiState.update { it.copy(analyticsOptIn = value) }
+        }
+
+        public fun toggleCrash(value: Boolean) {
+            _uiState.update { it.copy(crashOptIn = value) }
+        }
+
+        public fun toggleMarketing(value: Boolean) {
+            _uiState.update { it.copy(marketingOptIn = value) }
+        }
+
+        @Suppress("TooGenericExceptionCaught")
+        public fun onConfirm() {
+            val state = _uiState.value
+            viewModelScope.launch {
+                _uiState.update { it.copy(isLoading = true, error = null) }
+                try {
+                    grantConsentUseCase(
+                        analyticsOptIn = state.analyticsOptIn,
+                        crashOptIn = state.crashOptIn,
+                        marketingOptIn = state.marketingOptIn,
+                    )
+                    _navigateNext.send(Unit)
+                } catch (e: CancellationException) {
+                    throw e
+                } catch (e: Exception) {
+                    _uiState.update { it.copy(error = e.message ?: "Unknown error") }
+                } finally {
+                    _uiState.update { it.copy(isLoading = false) }
+                }
+            }
+        }
+
+        @Suppress("TooGenericExceptionCaught")
+        public fun onDeclineAll() {
+            viewModelScope.launch {
+                _uiState.update { it.copy(isLoading = true, error = null) }
+                try {
+                    grantConsentUseCase(
+                        analyticsOptIn = false,
+                        crashOptIn = false,
+                        marketingOptIn = false,
+                    )
+                    _navigateNext.send(Unit)
+                } catch (e: CancellationException) {
+                    throw e
+                } catch (e: Exception) {
+                    _uiState.update { it.copy(error = e.message ?: "Unknown error") }
+                } finally {
+                    _uiState.update { it.copy(isLoading = false) }
+                }
+            }
+        }
+    }
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 -- customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/DpdpConsentScreen.kt" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 424ms:
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/DpdpConsentScreen.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/DpdpConsentScreen.kt
new file mode 100644
index 00000000..bd296288
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/DpdpConsentScreen.kt
@@ -0,0 +1,554 @@
+package com.homeservices.customer.ui.consent
+
+import androidx.compose.foundation.background
+import androidx.compose.foundation.layout.Arrangement
+import androidx.compose.foundation.layout.Box
+import androidx.compose.foundation.layout.Column
+import androidx.compose.foundation.layout.Row
+import androidx.compose.foundation.layout.Spacer
+import androidx.compose.foundation.layout.fillMaxHeight
+import androidx.compose.foundation.layout.fillMaxSize
+import androidx.compose.foundation.layout.fillMaxWidth
+import androidx.compose.foundation.layout.height
+import androidx.compose.foundation.layout.offset
+import androidx.compose.foundation.layout.padding
+import androidx.compose.foundation.layout.size
+import androidx.compose.foundation.layout.statusBarsPadding
+import androidx.compose.foundation.layout.width
+import androidx.compose.foundation.rememberScrollState
+import androidx.compose.foundation.shape.CircleShape
+import androidx.compose.foundation.shape.RoundedCornerShape
+import androidx.compose.foundation.text.BasicText
+import androidx.compose.foundation.verticalScroll
+import androidx.compose.material.icons.Icons
+import androidx.compose.material.icons.filled.BarChart
+import androidx.compose.material.icons.filled.Eco
+import androidx.compose.material.icons.filled.Notifications
+import androidx.compose.material.icons.filled.Security
+import androidx.compose.material3.Button
+import androidx.compose.material3.ButtonDefaults
+import androidx.compose.material3.CircularProgressIndicator
+import androidx.compose.material3.HorizontalDivider
+import androidx.compose.material3.Icon
+import androidx.compose.material3.MaterialTheme
+import androidx.compose.material3.Surface
+import androidx.compose.material3.Switch
+import androidx.compose.material3.SwitchDefaults
+import androidx.compose.material3.Text
+import androidx.compose.material3.TextButton
+import androidx.compose.runtime.Composable
+import androidx.compose.runtime.LaunchedEffect
+import androidx.compose.runtime.getValue
+import androidx.compose.ui.Alignment
+import androidx.compose.ui.Modifier
+import androidx.compose.ui.draw.drawBehind
+import androidx.compose.ui.geometry.Offset
+import androidx.compose.ui.graphics.Brush
+import androidx.compose.ui.graphics.Color
+import androidx.compose.ui.graphics.vector.ImageVector
+import androidx.compose.ui.text.LinkAnnotation
+import androidx.compose.ui.text.SpanStyle
+import androidx.compose.ui.text.TextLinkStyles
+import androidx.compose.ui.text.TextStyle
+import androidx.compose.ui.text.buildAnnotatedString
+import androidx.compose.ui.text.font.FontWeight
+import androidx.compose.ui.text.style.TextAlign
+import androidx.compose.ui.text.style.TextDecoration
+import androidx.compose.ui.text.withLink
+import androidx.compose.ui.text.withStyle
+import androidx.compose.ui.unit.dp
+import androidx.compose.ui.unit.sp
+import androidx.hilt.navigation.compose.hiltViewModel
+import androidx.lifecycle.compose.collectAsStateWithLifecycle
+import kotlinx.coroutines.flow.collectLatest
+
+// ── Design tokens ─────────────────────────────────────────────────────────────
+private val HeroBg = Color(0xFF0B3D2E)
+private val HeroBgDark = Color(0xFF062A20)
+private val ScreenBgLight = Color(0xFFFBF7EF)
+private val ScreenBgDark = Color(0xFF0D1A16)
+private val CardBgLight = Color.White
+private val CardBgDark = Color(0xFF1A2E24)
+private val DividerLight = Color(0xFFEDE8E3)
+private val DividerDark = Color(0xFF2A3E34)
+private val TextMuted = Color(0xFF5F6C66)
+private val TextOnDarkMuted = Color(0xFF8FA899)
+private val TextOnDark = Color(0xFFE8F1EC)
+private val BrandGreen = Color(0xFF0B3D2E)
+private val SwitchCheckedThumb = Color(0xFF0B3D2E)
+private val SwitchCheckedTrack = Color(0xFFC8E6C9)
+private val SwitchUncheckedTrack = Color(0xFFE0E0E0)
+
+private val AnalyticsBg = Color(0xFFE8F5E8)
+private val AnalyticsTint = Color(0xFF0B3D2E)
+private val CrashBg = Color(0xFFE8EDF5)
+private val CrashTint = Color(0xFF1A4B8C)
+private val MarketingBg = Color(0xFFFFF3E0)
+private val MarketingTint = Color(0xFFE65100)
+
+private const val HERO_FRACTION = 0.40f
+private const val PRIVACY_POLICY_URL = "https://homeservices.app/privacy"
+
+// ── Layout & spacing ──────────────────────────────────────────────────────
+private const val HERO_ICON_SIZE_DP = 72
+private const val HERO_ICON_INNER_SIZE_DP = 36
+private const val HERO_SPACING_DP = 12
+private const val HERO_PADDING_DP = 24
+private const val HERO_SUBTITLE_ALPHA = 0.70f
+private const val HERO_DARK_MODE_THRESHOLD = 0.5f
+private const val CARD_OVERLAP_DP = 20
+private const val CARD_CORNER_RADIUS_DP = 24
+private const val CARD_TOP_PADDING_DP = 28
+private const val CARD_SIDE_PADDING_DP = 20
+private const val CARD_BOTTOM_PADDING_DP = 20
+private const val CARD_SHADOW_ELEVATION_DP = 4
+private const val CONSENT_SECTION_TITLE_FONT_SIZE = 26
+private const val CONSENT_TITLE_SIZE_DP = 16
+private const val CONSENT_DESCRIPTION_SIZE_DP = 14
+private const val CONSENT_SMALL_TEXT_SIZE_DP = 12
+private const val DIVIDER_THICKNESS_DP = 1
+private const val DIVIDER_PADDING_DP = 4
+private const val TOGGLE_ROW_PADDING_DP = 10
+private const val TOGGLE_ROW_SPACING_DP = 12
+private const val TOGGLE_ICON_SIZE_DP = 44
+private const val TOGGLE_ICON_RADIUS_DP = 12
+private const val TOGGLE_ICON_INNER_SIZE_DP = 22
+private const val TOGGLE_TEXT_TITLE_FONT_SIZE = 14
+private const val TOGGLE_TEXT_SPACING_DP = 2
+private const val CTA_HEIGHT_DP = 56
+private const val CTA_CORNER_RADIUS_DP = 16
+private const val CTA_DISABLED_ALPHA = 0.50f
+private const val CTA_PADDING_HORIZONTAL_DP = 20
+private const val CTA_PADDING_VERTICAL_DP = 16
+private const val CTA_SPACING_DP = 8
+private const val PROGRESS_INDICATOR_SIZE_DP = 24
+
+// ── Glow effects (atmospheric) ─────────────────────────────────────────
+private const val GLOW_TOP_RIGHT_RADIUS_DP = 180
+private const val GLOW_TOP_RIGHT_X_OFFSET_DP = 60
+private const val GLOW_TOP_RIGHT_Y_OFFSET_DP = 80
+private const val GLOW_TOP_RIGHT_ALPHA = 0.05f
+private const val GLOW_BOTTOM_LEFT_RADIUS_DP = 90
+private const val GLOW_BOTTOM_LEFT_X_OFFSET_DP = 50
+private const val GLOW_BOTTOM_LEFT_Y_OFFSET_DP = 30
+private const val GLOW_BOTTOM_LEFT_ALPHA = 0.08f
+private const val GLOW_CENTER_RADIUS_DP = 120
+private const val GLOW_CENTER_X_FRACTION = 0.75f
+private const val GLOW_CENTER_Y_FRACTION = 0.55f
+private const val GLOW_CENTER_ALPHA = 0.10f
+
+// ── Color values ──────────────────────────────────────────────────────
+private val TEXT_PRIMARY_LIGHT = Color(0xFF18231F)
+private val GLOW_CENTER_COLOR = Color(0xFF4CAF50)
+private const val CTA_DISABLED_TEXT_ALPHA = 0.40f
+
+/**
+ * Entry composable — collects ViewModel state and wires navigation.
+ * Renders [DpdpConsentScreenContent] for visual logic.
+ */
+@Composable
+public fun DpdpConsentScreen(
+    onConsentComplete: () -> Unit,
+    viewModel: ConsentViewModel = hiltViewModel(),
+) {
+    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
+
+    LaunchedEffect(Unit) {
+        viewModel.navigateNext.collectLatest { onConsentComplete() }
+    }
+
+    DpdpConsentScreenContent(
+        uiState = uiState,
+        onToggleAnalytics = viewModel::toggleAnalytics,
+        onToggleCrash = viewModel::toggleCrash,
+        onToggleMarketing = viewModel::toggleMarketing,
+        onConfirm = viewModel::onConfirm,
+        onDeclineAll = viewModel::onDeclineAll,
+    )
+}
+
+/**
+ * Stateless content composable — all parameters are explicit for Paparazzi testability.
+ *
+ * Layout:
+ *  1. Hero zone (~40% height) — dark green with radial glows, icon, title, subtitle.
+ *  2. Consent card (white surface, overlaps hero by 20dp, rounded top corners 24dp).
+ *     Three toggle rows + legal copy.
+ *  3. Sticky CTA column pinned to bottom.
+ */
+@Suppress("LongMethod")
+@Composable
+internal fun DpdpConsentScreenContent(
+    uiState: ConsentUiState,
+    onToggleAnalytics: (Boolean) -> Unit,
+    onToggleCrash: (Boolean) -> Unit,
+    onToggleMarketing: (Boolean) -> Unit,
+    onConfirm: () -> Unit,
+    onDeclineAll: () -> Unit,
+    modifier: Modifier = Modifier,
+) {
+    val isDark = MaterialTheme.colorScheme.background.red < HERO_DARK_MODE_THRESHOLD
+    val screenBg = if (isDark) ScreenBgDark else ScreenBgLight
+    val cardBg = if (isDark) CardBgDark else CardBgLight
+    val dividerColor = if (isDark) DividerDark else DividerLight
+    val textPrimary = if (isDark) TextOnDark else TEXT_PRIMARY_LIGHT
+    val textMuted = if (isDark) TextOnDarkMuted else TextMuted
+
+    Box(
+        modifier =
+            modifier
+                .fillMaxSize()
+                .background(screenBg),
+    ) {
+        // ── Scrollable body ────────────────────────────────────────────────────
+        Column(
+            modifier =
+                Modifier
+                    .fillMaxSize()
+                    .verticalScroll(rememberScrollState())
+                    .padding(bottom = 112.dp),
+            // reserve space for sticky CTAs
+        ) {
+            // ── Hero zone ──────────────────────────────────────────────────────
+            Box(
+                modifier =
+                    Modifier
+                        .fillMaxWidth()
+                        .fillMaxHeight(HERO_FRACTION)
+                        .drawBehind {
+                            drawRect(
+                                brush = Brush.verticalGradient(listOf(HeroBgDark, HeroBg)),
+                                size = size,
+                            )
+                            // Top-right atmospheric glow
+                            drawCircle(
+                                color = Color.White.copy(alpha = GLOW_TOP_RIGHT_ALPHA),
+                                radius = GLOW_TOP_RIGHT_RADIUS_DP.dp.toPx(),
+                                center =
+                                    Offset(
+                                        size.width - GLOW_TOP_RIGHT_X_OFFSET_DP.dp.toPx(),
+                                        -GLOW_TOP_RIGHT_Y_OFFSET_DP.dp.toPx(),
+                                    ),
+                            )
+                            // Bottom-left accent glow
+                            drawCircle(
+                                color = Color.White.copy(alpha = GLOW_BOTTOM_LEFT_ALPHA),
+                                radius = GLOW_BOTTOM_LEFT_RADIUS_DP.dp.toPx(),
+                                center =
+                                    Offset(
+                                        GLOW_BOTTOM_LEFT_X_OFFSET_DP.dp.toPx(),
+                                        size.height - GLOW_BOTTOM_LEFT_Y_OFFSET_DP.dp.toPx(),
+                                    ),
+                            )
+                            // Center-right mid glow
+                            drawCircle(
+                                color = GLOW_CENTER_COLOR.copy(alpha = GLOW_CENTER_ALPHA),
+                                radius = GLOW_CENTER_RADIUS_DP.dp.toPx(),
+                                center =
+                                    Offset(
+                                        size.width * GLOW_CENTER_X_FRACTION,
+                                        size.height * GLOW_CENTER_Y_FRACTION,
+                                    ),
+                            )
+                        }.statusBarsPadding()
+                        .padding(horizontal = HERO_PADDING_DP.dp, vertical = HERO_PADDING_DP.dp),
+                contentAlignment = Alignment.Center,
+            ) {
+                Column(
+                    horizontalAlignment = Alignment.CenterHorizontally,
+                    verticalArrangement = Arrangement.spacedBy(HERO_SPACING_DP.dp),
+                ) {
+                    // Brand icon circle
+                    Surface(
+                        modifier = Modifier.size(HERO_ICON_SIZE_DP.dp),
+                        shape = CircleShape,
+                        color = Color.White,
+                    ) {
+                        Box(contentAlignment = Alignment.Center) {
+                            Icon(
+                                imageVector = Icons.Default.Eco,
+                                contentDescription = null,
+                                tint = BrandGreen,
+                                modifier = Modifier.size(HERO_ICON_INNER_SIZE_DP.dp),
+                            )
+                        }
+                    }
+
+                    Text(
+                        text = "गोपनीयता आपकी, चुनाव आपका",
+                        style =
+                            MaterialTheme.typography.headlineSmall.copy(
+                                fontWeight = FontWeight.Bold,
+                                fontSize = CONSENT_SECTION_TITLE_FONT_SIZE.sp,
+                            ),
+                        color = Color.White,
+                        textAlign = TextAlign.Center,
+                    )
+
+                    Text(
+                        text = "सेवा शुरू करने से पहले बताएं, हम क्या जानकारी इस्तेमाल कर सकते हैं",
+                        style = MaterialTheme.typography.bodyMedium.copy(fontSize = CONSENT_DESCRIPTION_SIZE_DP.sp),
+                        color = Color.White.copy(alpha = HERO_SUBTITLE_ALPHA),
+                        textAlign = TextAlign.Center,
+                    )
+                }
+            }
+
+            // ── Consent card (overlaps hero by 20dp for depth) ─────────────────
+            Surface(
+                modifier =
+                    Modifier
+                        .fillMaxWidth()
+                        .offset(y = (-CARD_OVERLAP_DP).dp),
+                shape = RoundedCornerShape(topStart = CARD_CORNER_RADIUS_DP.dp, topEnd = CARD_CORNER_RADIUS_DP.dp),
+                color = cardBg,
+                shadowElevation = CARD_SHADOW_ELEVATION_DP.dp,
+            ) {
+                Column(
+                    modifier =
+                        Modifier
+                            .fillMaxWidth()
+                            .padding(
+                                top = CARD_TOP_PADDING_DP.dp,
+                                start = CARD_SIDE_PADDING_DP.dp,
+                                end = CARD_SIDE_PADDING_DP.dp,
+                                bottom = CARD_BOTTOM_PADDING_DP.dp,
+                            ),
+                ) {
+                    // Section heading
+                    Text(
+                        text = "डेटा उपयोग सहमति",
+                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
+                        color = textPrimary,
+                    )
+                    Spacer(Modifier.height(4.dp))
+                    Text(
+                        text = "अपनी पसंद के अनुसार चुनें:",
+                        style = MaterialTheme.typography.bodySmall,
+                        color = textMuted,
+                    )
+
+                    Spacer(Modifier.height(16.dp))
+
+                    // Analytics toggle
+                    ConsentToggleRow(
+                        icon = Icons.Default.BarChart,
+                        iconBg = AnalyticsBg,
+                        iconTint = AnalyticsTint,
+                        title = "ऐप की गुणवत्ता सुधारें",
+                        description = "हम समझते हैं ऐप कैसे इस्तेमाल होता है",
+                        checked = uiState.analyticsOptIn,
+                        onChecked = onToggleAnalytics,
+                    )
+
+                    HorizontalDivider(
+                        modifier = Modifier.padding(vertical = DIVIDER_PADDING_DP.dp),
+                        thickness = DIVIDER_THICKNESS_DP.dp,
+                        color = dividerColor,
+                    )
+
+                    // Crash toggle
+                    ConsentToggleRow(
+                        icon = Icons.Default.Security,
+                        iconBg = CrashBg,
+                        iconTint = CrashTint,
+                        title = "क्रैश रिपोर्ट भेजें",
+                        description = "बग जल्दी ठीक करने के लिए",
+                        checked = uiState.crashOptIn,
+                        onChecked = onToggleCrash,
+                    )
+
+                    HorizontalDivider(
+                        modifier = Modifier.padding(vertical = DIVIDER_PADDING_DP.dp),
+                        thickness = DIVIDER_THICKNESS_DP.dp,
+                        color = dividerColor,
+                    )
+
+                    // Marketing toggle
+                    ConsentToggleRow(
+                        icon = Icons.Default.Notifications,
+                        iconBg = MarketingBg,
+                        iconTint = MarketingTint,
+                        title = "ऑफर और अपडेट",
+                        description = "व्यक्तिगत ऑफर और प्रमोशन",
+                        checked = uiState.marketingOptIn,
+                        onChecked = onToggleMarketing,
+                    )
+
+                    Spacer(Modifier.height(16.dp))
+
+                    HorizontalDivider(thickness = DIVIDER_THICKNESS_DP.dp, color = dividerColor)
+
+                    Spacer(Modifier.height(12.dp))
+
+                    // Legal clickable text
+                    LegalCopyText(textMuted = textMuted)
+
+                    Spacer(Modifier.height(4.dp))
+                }
+            }
+        }
+
+        // ── Sticky CTAs pinned to bottom ───────────────────────────────────────
+        Column(
+            modifier =
+                Modifier
+                    .align(Alignment.BottomCenter)
+                    .fillMaxWidth()
+                    .background(cardBg)
+                    .padding(horizontal = CTA_PADDING_HORIZONTAL_DP.dp, vertical = CTA_PADDING_VERTICAL_DP.dp),
+            verticalArrangement = Arrangement.spacedBy(CTA_SPACING_DP.dp),
+        ) {
+            // Primary CTA
+            Button(
+                onClick = onConfirm,
+                enabled = !uiState.isLoading,
+                modifier =
+                    Modifier
+                        .fillMaxWidth()
+                        .height(CTA_HEIGHT_DP.dp),
+                shape = RoundedCornerShape(CTA_CORNER_RADIUS_DP.dp),
+                colors =
+                    ButtonDefaults.buttonColors(
+                        containerColor = BrandGreen,
+                        disabledContainerColor = BrandGreen.copy(alpha = CTA_DISABLED_ALPHA),
+                    ),
+            ) {
+                if (uiState.isLoading) {
+                    CircularProgressIndicator(
+                        modifier = Modifier.size(PROGRESS_INDICATOR_SIZE_DP.dp),
+                        color = Color.White,
+                        strokeWidth = 2.5.dp,
+                    )
+                } else {
+                    Text(
+                        text = "सहमत हों और जारी रखें",
+                        style =
+                            MaterialTheme.typography.titleMedium.copy(
+                                fontWeight = FontWeight.ExtraBold,
+                                fontSize = CONSENT_TITLE_SIZE_DP.sp,
+                            ),
+                        color = Color.White,
+                    )
+                }
+            }
+
+            // Secondary CTA
+            TextButton(
+                onClick = onDeclineAll,
+                enabled = !uiState.isLoading,
+                modifier = Modifier.fillMaxWidth(),
+            ) {
+                Text(
+                    text = "सभी अस्वीकार करें",
+                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = CONSENT_DESCRIPTION_SIZE_DP.sp),
+                    color = if (uiState.isLoading) TextMuted.copy(alpha = CTA_DISABLED_TEXT_ALPHA) else TextMuted,
+                )
+            }
+        }
+    }
+}
+
+@Composable
+private fun ConsentToggleRow(
+    icon: ImageVector,
+    iconBg: Color,
+    iconTint: Color,
+    title: String,
+    description: String,
+    checked: Boolean,
+    onChecked: (Boolean) -> Unit,
+) {
+    Row(
+        modifier =
+            Modifier
+                .fillMaxWidth()
+                .padding(vertical = TOGGLE_ROW_PADDING_DP.dp),
+        verticalAlignment = Alignment.CenterVertically,
+        horizontalArrangement = Arrangement.spacedBy(TOGGLE_ROW_SPACING_DP.dp),
+    ) {
+        // Icon box
+        Surface(
+            modifier = Modifier.size(TOGGLE_ICON_SIZE_DP.dp),
+            shape = RoundedCornerShape(TOGGLE_ICON_RADIUS_DP.dp),
+            color = iconBg,
+        ) {
+            Box(contentAlignment = Alignment.Center) {
+                Icon(
+                    imageVector = icon,
+                    contentDescription = null,
+                    tint = iconTint,
+                    modifier = Modifier.size(TOGGLE_ICON_INNER_SIZE_DP.dp),
+                )
+            }
+        }
+
+        // Title + description
+        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(TOGGLE_TEXT_SPACING_DP.dp)) {
+            Text(
+                text = title,
+                style =
+                    MaterialTheme.typography.bodyMedium.copy(
+                        fontWeight = FontWeight.SemiBold,
+                        fontSize = TOGGLE_TEXT_TITLE_FONT_SIZE.sp,
+                    ),
+                color = TEXT_PRIMARY_LIGHT,
+            )
+            Text(
+                text = description,
+                style = MaterialTheme.typography.bodySmall.copy(fontSize = CONSENT_SMALL_TEXT_SIZE_DP.sp),
+                color = TextMuted,
+            )
+        }
+
+        // Switch
+        Switch(
+            checked = checked,
+            onCheckedChange = onChecked,
+            colors =
+                SwitchDefaults.colors(
+                    checkedThumbColor = SwitchCheckedThumb,
+                    checkedTrackColor = SwitchCheckedTrack,
+                    uncheckedTrackColor = SwitchUncheckedTrack,
+                    uncheckedThumbColor = Color.White,
+                ),
+        )
+    }
+}
+
+@Composable
+private fun LegalCopyText(textMuted: Color) {
+    val annotatedString =
+        buildAnnotatedString {
+            withStyle(SpanStyle(color = textMuted, fontSize = CONSENT_SMALL_TEXT_SIZE_DP.sp)) {
+                append("जारी रखकर आप हमारी ")
+            }
+            withLink(
+                LinkAnnotation.Url(
+                    url = PRIVACY_POLICY_URL,
+                    styles =
+                        TextLinkStyles(
+                            style =
+                                SpanStyle(
+                                    color = BrandGreen,
+                                    fontSize = CONSENT_SMALL_TEXT_SIZE_DP.sp,
+                                    fontWeight = FontWeight.SemiBold,
+                                    textDecoration = TextDecoration.Underline,
+                                ),
+                        ),
+                ),
+            ) {
+                append("गोपनीयता नीति")
+            }
+            withStyle(SpanStyle(color = textMuted, fontSize = CONSENT_SMALL_TEXT_SIZE_DP.sp)) {
+                append(" से सहमत हैं")
+            }
+        }
+
+    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
+        BasicText(
+            text = annotatedString,
+            style = TextStyle(textAlign = TextAlign.Center),
+        )
+    }
+}
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 -- customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthViewModel.kt customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingViewModel.kt customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeViewModel.kt customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailViewModel.kt customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint/ComplaintViewModel.kt customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 451ms:
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthViewModel.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthViewModel.kt
index 0f0d9d2a..be78b9e5 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthViewModel.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthViewModel.kt
@@ -9,6 +9,8 @@ import com.homeservices.customer.domain.auth.PhoneNumberNormalizer
 import com.homeservices.customer.domain.auth.model.AuthResult
 import com.homeservices.customer.domain.auth.model.OtpSendResult
 import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
+import com.homeservices.customer.observability.analytics.AnalyticsEvents
+import com.homeservices.customer.observability.analytics.AnalyticsFacade
 import dagger.hilt.android.lifecycle.HiltViewModel
 import kotlinx.coroutines.Job
 import kotlinx.coroutines.flow.MutableStateFlow
@@ -22,6 +24,7 @@ public class AuthViewModel
     @Inject
     constructor(
         private val orchestrator: AuthOrchestrator,
+        private val analytics: AnalyticsFacade,
     ) : ViewModel() {
         private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
         public val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()
@@ -40,6 +43,7 @@ public class AuthViewModel
         private var emailAuthJob: Job? = null
 
         public fun initAuth(activity: FragmentActivity) {
+            viewModelScope.launch { runCatching { analytics.track(AnalyticsEvents.AUTH_START) } }
             // FragmentActivity IS-A Context; pass it for both the Context and FragmentActivity params
             when (orchestrator.start(activity, activity)) {
                 AuthOrchestrator.StartResult.TruecallerLaunched -> {
@@ -253,6 +257,7 @@ public class AuthViewModel
                             is OtpSendResult.CodeSent -> {
                                 currentVerificationId = result.verificationId
                                 currentResendToken = result.resendToken
+                                runCatching { analytics.track(AnalyticsEvents.AUTH_OTP_SENT) }
                                 _uiState.value =
                                     AuthUiState.OtpEntry(
                                         phoneNumber = normalizedPhoneNumber,
@@ -361,26 +366,34 @@ public class AuthViewModel
         private suspend fun handleFirebaseAuthResult(result: AuthResult) {
             when (result) {
                 is AuthResult.Success -> {
+                    runCatching { analytics.track(AnalyticsEvents.AUTH_SUCCESS) }
                     orchestrator.completeWithFirebase(result.user, currentPhoneNumber.takeLast(PHONE_LAST_DIGITS))
                 }
                 is AuthResult.Error.WrongCode -> {
                     otpAttempts++
+                    runCatching { analytics.track(AnalyticsEvents.AUTH_FAILURE, mapOf("reason" to "wrong_code")) }
                     _uiState.value =
                         AuthUiState.Error(
                             message = "Incorrect code",
                             retriesLeft = maxOf(0, MAX_OTP_RETRIES - otpAttempts),
                         )
                 }
-                is AuthResult.Error.RateLimited ->
+                is AuthResult.Error.RateLimited -> {
+                    runCatching { analytics.track(AnalyticsEvents.AUTH_FAILURE, mapOf("reason" to "rate_limited")) }
                     _uiState.value = AuthUiState.Error("Too many attempts. Try again later.", retriesLeft = 0)
-                is AuthResult.Error.CodeExpired ->
+                }
+                is AuthResult.Error.CodeExpired -> {
+                    runCatching { analytics.track(AnalyticsEvents.AUTH_FAILURE, mapOf("reason" to "code_expired")) }
                     _uiState.value = AuthUiState.Error("Code expired. Please resend.", retriesLeft = 0)
-                is AuthResult.Error.General ->
+                }
+                is AuthResult.Error.General -> {
+                    runCatching { analytics.track(AnalyticsEvents.AUTH_FAILURE, mapOf("reason" to "general")) }
                     _uiState.value =
                         AuthUiState.Error(
                             "Sign-in failed. Please try again.",
                             retriesLeft = 0,
                         )
+                }
                 is AuthResult.Error.WrongCredential ->
                     _uiState.value = AuthUiState.Error("Incorrect email or password.", retriesLeft = 0)
                 is AuthResult.Error.UserNotFound ->
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingViewModel.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingViewModel.kt
index a53be0ec..8c38226c 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingViewModel.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingViewModel.kt
@@ -13,6 +13,8 @@ import com.homeservices.customer.domain.booking.model.BookingRequest
 import com.homeservices.customer.domain.booking.model.BookingSlot
 import com.homeservices.customer.domain.booking.model.PaymentResult
 import com.homeservices.customer.domain.booking.model.RazorpayErrorCode
+import com.homeservices.customer.observability.analytics.AnalyticsEvents
+import com.homeservices.customer.observability.analytics.AnalyticsFacade
 import dagger.hilt.android.lifecycle.HiltViewModel
 import kotlinx.coroutines.flow.MutableStateFlow
 import kotlinx.coroutines.flow.StateFlow
@@ -32,6 +34,7 @@ internal class BookingViewModel
         private val confirmBooking: ConfirmBookingUseCase,
         private val razorpayPayment: RazorpayPaymentUseCase,
         private val biometricGate: BiometricGateUseCase,
+        private val analytics: AnalyticsFacade,
     ) : ViewModel() {
         private val _uiState = MutableStateFlow<BookingUiState>(BookingUiState.Idle)
         public val uiState: StateFlow<BookingUiState> = _uiState.asStateFlow()
@@ -108,6 +111,7 @@ internal class BookingViewModel
         }
 
         /** Creates a booking. Cash bookings call this directly - no biometric gate. */
+        @Suppress("LongMethod")
         public fun startBooking(
             serviceId: String,
             categoryId: String,
@@ -118,6 +122,12 @@ internal class BookingViewModel
             // race: a second tap within the same frame must see CreatingBooking, not Ready,
             // and bail at the `as? Ready ?: return` guard above. See PRD-03.
             _uiState.value = BookingUiState.CreatingBooking
+            runCatching {
+                analytics.track(
+                    AnalyticsEvents.BOOKING_CREATE_START,
+                    mapOf("service_id" to serviceId, "category_id" to categoryId),
+                )
+            }
             viewModelScope.launch {
                 val request =
                     BookingRequest(
@@ -134,8 +144,14 @@ internal class BookingViewModel
                     onSuccess = { result ->
                         pendingBookingId = result.bookingId
                         pendingAppliedCredit = result.appliedCreditAmount
-                        _uiState.value =
-                            if (result.requiresPayment) {
+                        if (result.requiresPayment) {
+                            runCatching {
+                                analytics.track(
+                                    AnalyticsEvents.PAYMENT_INITIATED,
+                                    mapOf("booking_id" to result.bookingId),
+                                )
+                            }
+                            _uiState.value =
                                 BookingUiState.AwaitingPayment(
                                     bookingId = result.bookingId,
                                     razorpayOrderId = result.razorpayOrderId,
@@ -145,12 +161,19 @@ internal class BookingViewModel
                                     lat = state.lat,
                                     lng = state.lng,
                                 )
-                            } else {
+                        } else {
+                            runCatching {
+                                analytics.track(
+                                    AnalyticsEvents.BOOKING_CREATE_SUCCESS,
+                                    mapOf("booking_id" to result.bookingId),
+                                )
+                            }
+                            _uiState.value =
                                 BookingUiState.BookingConfirmed(
                                     bookingId = result.bookingId,
                                     appliedCreditAmount = result.appliedCreditAmount,
                                 )
-                            }
+                        }
                     },
                     // Error message key: R.string.booking_error_failed surfaced in UI layer
                     onFailure = { _uiState.value = BookingUiState.Error(it.message ?: BOOKING_FAILED_FALLBACK) },
@@ -196,6 +219,18 @@ internal class BookingViewModel
                         .first()
                         .fold(
                             onSuccess = {
+                                runCatching {
+                                    analytics.track(
+                                        AnalyticsEvents.PAYMENT_SUCCESS,
+                                        mapOf("booking_id" to bookingId),
+                                    )
+                                }
+                                runCatching {
+                                    analytics.track(
+                                        AnalyticsEvents.BOOKING_CREATE_SUCCESS,
+                                        mapOf("booking_id" to bookingId),
+                                    )
+                                }
                                 _uiState.value =
                                     BookingUiState.BookingConfirmed(
                                         bookingId = bookingId,
@@ -209,6 +244,12 @@ internal class BookingViewModel
                 is PaymentResult.Failure -> {
                     val awaitingSnapshot = _uiState.value as? BookingUiState.AwaitingPayment
                     val errorCode = RazorpayErrorCode.resolve(result.code, result.description)
+                    runCatching {
+                        analytics.track(
+                            AnalyticsEvents.PAYMENT_FAILURE,
+                            mapOf("booking_id" to bookingId, "reason" to result.description),
+                        )
+                    }
                     _uiState.value =
                         BookingUiState.PaymentFailed(
                             orderId = awaitingSnapshot?.razorpayOrderId ?: "",
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeViewModel.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeViewModel.kt
index 134f234c..cbd87054 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeViewModel.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeViewModel.kt
@@ -5,6 +5,8 @@ import androidx.lifecycle.viewModelScope
 import com.homeservices.customer.domain.catalogue.CatalogueLocalizer
 import com.homeservices.customer.domain.catalogue.GetCategoriesUseCase
 import com.homeservices.customer.domain.locale.GetCurrentLocaleUseCase
+import com.homeservices.customer.observability.analytics.AnalyticsEvents
+import com.homeservices.customer.observability.analytics.AnalyticsFacade
 import dagger.hilt.android.lifecycle.HiltViewModel
 import kotlinx.coroutines.flow.MutableStateFlow
 import kotlinx.coroutines.flow.StateFlow
@@ -20,11 +22,13 @@ internal class CatalogueHomeViewModel
         private val getCategories: GetCategoriesUseCase,
         private val localizer: CatalogueLocalizer,
         private val getCurrentLocale: GetCurrentLocaleUseCase,
+        private val analytics: AnalyticsFacade,
     ) : ViewModel() {
         private val _uiState = MutableStateFlow<CatalogueHomeUiState>(CatalogueHomeUiState.Loading)
         public val uiState: StateFlow<CatalogueHomeUiState> = _uiState.asStateFlow()
 
         init {
+            runCatching { analytics.track(AnalyticsEvents.CATALOGUE_VIEW) }
             viewModelScope.launch {
                 combine(getCategories(), getCurrentLocale()) { result, locale ->
                     result.fold(
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailViewModel.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailViewModel.kt
index ee9c0e6b..935b59d0 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailViewModel.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailViewModel.kt
@@ -8,6 +8,8 @@ import com.homeservices.customer.domain.catalogue.CatalogueLocalizer
 import com.homeservices.customer.domain.catalogue.GetServiceDetailUseCase
 import com.homeservices.customer.domain.locale.GetCurrentLocaleUseCase
 import com.homeservices.customer.domain.technician.GetConfidenceScoreUseCase
+import com.homeservices.customer.observability.analytics.AnalyticsEvents
+import com.homeservices.customer.observability.analytics.AnalyticsFacade
 import dagger.hilt.android.lifecycle.HiltViewModel
 import kotlinx.coroutines.flow.MutableStateFlow
 import kotlinx.coroutines.flow.StateFlow
@@ -17,6 +19,7 @@ import kotlinx.coroutines.launch
 import javax.inject.Inject
 
 @HiltViewModel
+@Suppress("LongParameterList")
 internal class ServiceDetailViewModel
     @Inject
     constructor(
@@ -26,6 +29,7 @@ internal class ServiceDetailViewModel
         private val locationProvider: FusedCurrentLocationProvider,
         private val localizer: CatalogueLocalizer,
         private val getCurrentLocale: GetCurrentLocaleUseCase,
+        private val analytics: AnalyticsFacade,
     ) : ViewModel() {
         private val serviceId: String = checkNotNull(savedStateHandle["serviceId"])
         private val technicianId: String? = savedStateHandle["techId"]
@@ -47,6 +51,12 @@ internal class ServiceDetailViewModel
                 combine(getServiceDetail(serviceId), getCurrentLocale()) { result, locale ->
                     result.fold(
                         onSuccess = { service ->
+                            runCatching {
+                                analytics.track(
+                                    AnalyticsEvents.SERVICE_VIEW,
+                                    mapOf("service_id" to serviceId),
+                                )
+                            }
                             ServiceDetailUiState.Success(localizer.localizeService(service, locale))
                         },
                         onFailure = { ServiceDetailUiState.Error(it.message ?: "Unknown error") },
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint/ComplaintViewModel.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint/ComplaintViewModel.kt
index 66a4db0c..ddf82f6c 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint/ComplaintViewModel.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint/ComplaintViewModel.kt
@@ -7,6 +7,8 @@ import com.homeservices.customer.domain.complaint.GetComplaintStatusUseCase
 import com.homeservices.customer.domain.complaint.PhotoUploadUseCase
 import com.homeservices.customer.domain.complaint.ReopenComplaintUseCase
 import com.homeservices.customer.domain.complaint.SubmitComplaintUseCase
+import com.homeservices.customer.observability.analytics.AnalyticsEvents
+import com.homeservices.customer.observability.analytics.AnalyticsFacade
 import dagger.hilt.android.lifecycle.HiltViewModel
 import kotlinx.coroutines.flow.MutableStateFlow
 import kotlinx.coroutines.flow.StateFlow
@@ -51,6 +53,7 @@ public class ComplaintViewModel
         private val photoUploadUseCase: PhotoUploadUseCase,
         private val getStatusUseCase: GetComplaintStatusUseCase,
         private val reopenUseCase: ReopenComplaintUseCase,
+        private val analytics: AnalyticsFacade,
     ) : ViewModel() {
         private val _uiState = MutableStateFlow<ComplaintUiState>(ComplaintUiState.Idle())
         public val uiState: StateFlow<ComplaintUiState> = _uiState.asStateFlow()
@@ -121,6 +124,12 @@ public class ComplaintViewModel
                         _uiState.value =
                             result.fold(
                                 onSuccess = { dto ->
+                                    runCatching {
+                                        analytics.track(
+                                            AnalyticsEvents.COMPLAINT_FILED,
+                                            mapOf("booking_id" to bookingId, "complaint_id" to dto.id),
+                                        )
+                                    }
                                     ComplaintUiState.Success(
                                         complaintId = dto.id,
                                         acknowledgeDeadlineAt = dto.acknowledgeDeadlineAt,
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
index 1c9f2cdb..171dccde 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
@@ -9,6 +9,8 @@ import com.homeservices.customer.domain.rating.SubmitRatingUseCase
 import com.homeservices.customer.domain.rating.model.CustomerSubScores
 import com.homeservices.customer.domain.rating.model.RatingSnapshot
 import com.homeservices.customer.domain.rating.model.SideState
+import com.homeservices.customer.observability.analytics.AnalyticsEvents
+import com.homeservices.customer.observability.analytics.AnalyticsFacade
 import dagger.hilt.android.lifecycle.HiltViewModel
 import kotlinx.coroutines.Job
 import kotlinx.coroutines.delay
@@ -61,6 +63,7 @@ public class RatingViewModel
         private val getUseCase: GetRatingUseCase,
         private val escalateUseCase: EscalateRatingUseCase,
         private val savedStateHandle: SavedStateHandle,
+        private val analytics: AnalyticsFacade,
     ) : ViewModel() {
         public val bookingId: String =
             savedStateHandle.get<String>("bookingId") ?: error("bookingId required")
@@ -279,6 +282,12 @@ public class RatingViewModel
                                 // Clear shield state only after confirmed success — preserves
                                 // draft for retry if the network call fails.
                                 cancelShieldState()
+                                runCatching {
+                                    analytics.track(
+                                        AnalyticsEvents.RATING_SUBMITTED,
+                                        mapOf("booking_id" to bookingId, "overall" to submitOverall),
+                                    )
+                                }
                                 _uiState.value = RatingUiState.AwaitingPartner(null)
                             }.onFailure { _uiState.value = RatingUiState.Error(it.message ?: "submit failed") }
                     }
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 -- customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt customer-app/app/src/main/kotlin/com/homeservices/customer/ui/profile/ProfileScreen.kt customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings/PrivacyDataScreen.kt" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 489ms:
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt
index 54f57d97..38474b15 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt
@@ -189,6 +189,7 @@ internal fun CatalogueHomeScreen(
     photoFirstCatalogueEnabled: Boolean = false,
     onPendingActionRoute: (String) -> Unit = {},
     onPriceApproval: (String) -> Unit = {},
+    onManageConsentClick: () -> Unit = {},
 ) {
     val uiState by viewModel.uiState.collectAsStateWithLifecycle()
     val homeUiState by customerHomeViewModel.homeUiState.collectAsStateWithLifecycle()
@@ -207,6 +208,7 @@ internal fun CatalogueHomeScreen(
         photoFirstCatalogueEnabled = photoFirstCatalogueEnabled,
         onPendingActionRoute = onPendingActionRoute,
         onPriceApproval = onPriceApproval,
+        onManageConsentClick = onManageConsentClick,
     )
 }
 
@@ -226,6 +228,7 @@ internal fun CatalogueHomeContent(
     homeUiState: CustomerHomeUiState = CustomerHomeUiState.Loading,
     onPendingActionRoute: (String) -> Unit = {},
     onPriceApproval: (String) -> Unit = {},
+    onManageConsentClick: () -> Unit = {},
 ) {
     var selectedNav by remember { mutableIntStateOf(0) }
 
@@ -260,6 +263,7 @@ internal fun CatalogueHomeContent(
             photoFirstCatalogueEnabled = photoFirstCatalogueEnabled,
             onPendingActionRoute = onPendingActionRoute,
             onPriceApproval = onPriceApproval,
+            onManageConsentClick = onManageConsentClick,
         )
     }
 }
@@ -279,6 +283,7 @@ private fun HomeTabs(
     homeUiState: CustomerHomeUiState = CustomerHomeUiState.Loading,
     onPendingActionRoute: (String) -> Unit = {},
     onPriceApproval: (String) -> Unit = {},
+    onManageConsentClick: () -> Unit = {},
 ) {
     when (selectedNav) {
         0 ->
@@ -312,6 +317,7 @@ private fun HomeTabs(
                 modifier = Modifier.fillMaxSize().padding(scaffoldPadding),
                 onLanguageClick = onProfileLanguageClick,
                 onBookingsClick = { onSelectNav(1) },
+                onManageConsentClick = onManageConsentClick,
             )
     }
 }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/profile/ProfileScreen.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/profile/ProfileScreen.kt
index d62bb933..8883946c 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/profile/ProfileScreen.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/profile/ProfileScreen.kt
@@ -60,12 +60,14 @@ private val CardBorder = Color(0xFFDED8CD)
 private val DangerRed = Color(0xFFDC2626)
 private val CardShape = RoundedCornerShape(12.dp)
 
+@Suppress("LongMethod")
 @Composable
 internal fun ProfileScreen(
     viewModel: ProfileViewModel = hiltViewModel(),
     modifier: Modifier = Modifier,
     onLanguageClick: () -> Unit = {},
     onBookingsClick: () -> Unit = {},
+    onManageConsentClick: () -> Unit = {},
 ) {
     val authState by viewModel.authState.collectAsStateWithLifecycle()
     val user = authState as? AuthState.Authenticated
@@ -204,6 +206,13 @@ internal fun ProfileScreen(
                     sublabel = null,
                     onClick = { showPrivacyDialog = true },
                 )
+                HorizontalDivider(color = CardBorder, thickness = 0.5.dp)
+                MenuRow(
+                    icon = Icons.Default.Shield,
+                    label = "गोपनीयता प्रबंधित करें",
+                    sublabel = "डेटा सहमति अपडेट करें",
+                    onClick = onManageConsentClick,
+                )
             }
         }
 
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings/PrivacyDataScreen.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings/PrivacyDataScreen.kt
index be7740f2..60a2ec19 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings/PrivacyDataScreen.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings/PrivacyDataScreen.kt
@@ -20,6 +20,7 @@ import androidx.compose.material.icons.automirrored.filled.ArrowBack
 import androidx.compose.material.icons.automirrored.filled.ArrowForward
 import androidx.compose.material.icons.filled.CloudDownload
 import androidx.compose.material.icons.filled.DeleteForever
+import androidx.compose.material.icons.filled.ManageAccounts
 import androidx.compose.material3.Icon
 import androidx.compose.material3.IconButton
 import androidx.compose.material3.MaterialTheme
@@ -39,6 +40,8 @@ import com.homeservices.customer.R
 private val WarmIvory = Color(0xFFFBF7EF)
 private val BrandGreen = Color(0xFF0B3D2E)
 private val MutedGreen = Color(0xFFE8F1EC)
+private val ShieldBlue = Color(0xFFE8EDF5)
+private val ShieldBlueTint = Color(0xFF1A4B8C)
 private val ErrorRed = Color(0xFFB3261E)
 private val ErrorRedSurface = Color(0xFFFFF0EE)
 private val CardBorder = Color(0xFFDED8CD)
@@ -67,6 +70,7 @@ private val TextSecondary = Color(0xFF5F6C66)
  * @param onDownloadData Navigate to the data-export screen (Stream 2.3). Pass null to hide the row.
  * @param onDeleteAccount Navigate to the delete-account entry screen.
  * @param showDeleteAccount Whether to show the delete-account row (feature flag).
+ * @param onManageConsentClick Navigate to the consent management screen (WS-D). Pass null to hide the row.
  */
 @Composable
 public fun PrivacyDataScreen(
@@ -74,6 +78,7 @@ public fun PrivacyDataScreen(
     onDownloadData: (() -> Unit)?,
     onDeleteAccount: () -> Unit,
     showDeleteAccount: Boolean,
+    onManageConsentClick: (() -> Unit)? = null,
 ) {
     Surface(modifier = Modifier.fillMaxSize(), color = WarmIvory) {
         Column(
@@ -115,6 +120,17 @@ public fun PrivacyDataScreen(
                 )
             }
 
+            // Manage consent row — visible when callback is wired (WS-D)
+            if (onManageConsentClick != null) {
+                PrivacyListItem(
+                    icon = Icons.Default.ManageAccounts,
+                    iconBg = ShieldBlue,
+                    iconTint = ShieldBlueTint,
+                    label = "गोपनीयता सहमति प्रबंधित करें",
+                    onClick = onManageConsentClick,
+                )
+            }
+
             // Delete account row (feature-flagged)
             if (showDeleteAccount) {
                 PrivacyListItem(
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem customer-app' in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 451ms:


    Directory: C:\Alok\Business Projects\Urbanclap-sprint3\customer-app


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
d-----         5/22/2026   1:56 PM                .claude                                                              
d-----         5/22/2026   3:41 PM                .gradle                                                              
d-----         5/22/2026   2:07 PM                .kotlin                                                              
d-----         5/22/2026   3:41 PM                .serena                                                              
d-----         5/22/2026   4:08 PM                app                                                                  
d-----         5/22/2026   2:04 PM                build                                                                
d-----         5/22/2026   1:56 PM                gradle                                                               
-a----         5/22/2026   1:56 PM            487 .editorconfig                                                        
-a----         5/22/2026   1:56 PM            528 build.gradle.kts                                                     
-a----         5/22/2026   1:56 PM           1423 CLAUDE.md                                                            
-a----         5/22/2026   1:56 PM           1457 detekt.yml                                                           
-a----         5/22/2026   1:56 PM            846 gradle.properties                                                    
-a----         5/22/2026   1:56 PM           8762 gradlew                                                              
-a----         5/22/2026   1:56 PM           2872 gradlew.bat                                                          
-a----         5/22/2026   2:05 PM             56 local.properties                                                     
-a----         5/22/2026   1:56 PM           2467 README.md                                                            
-a----         5/22/2026   1:56 PM            403 settings.gradle.kts                                                  



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path customer-app/gradle/libs.versions.toml -Pattern 'posthog|compose' -Context 0,2" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 506ms:

> customer-app\gradle\libs.versions.toml:8:# AndroidX / Compose
  customer-app\gradle\libs.versions.toml:9:androidxBiometric = "1.1.0"
  customer-app\gradle\libs.versions.toml:10:androidxAppcompat = "1.7.0"
> customer-app\gradle\libs.versions.toml:11:androidxNavigationCompose = "2.8.9"
  customer-app\gradle\libs.versions.toml:12:androidxSecurityCrypto = "1.1.0-alpha06"
  customer-app\gradle\libs.versions.toml:13:coreKtx = "1.15.0"
> customer-app\gradle\libs.versions.toml:15:activityCompose = "1.9.3"
> customer-app\gradle\libs.versions.toml:16:lifecycleViewmodelCompose = "2.8.7"
> customer-app\gradle\libs.versions.toml:17:composeBom = "2024.11.00"
> customer-app\gradle\libs.versions.toml:18:hiltNavigationCompose = "1.2.0"
  customer-app\gradle\libs.versions.toml:19:
  customer-app\gradle\libs.versions.toml:20:# DI
> customer-app\gradle\libs.versions.toml:35:posthog = "3.44.1"
  customer-app\gradle\libs.versions.toml:36:
  customer-app\gradle\libs.versions.toml:37:# Third-party auth (Maven Central: latest stable; 3.0.3 never published, 
using 3.2.1)
> customer-app\gradle\libs.versions.toml:55:mapsCompose           = "4.3.3"
  customer-app\gradle\libs.versions.toml:56:workManager          = "2.9.1"
  customer-app\gradle\libs.versions.toml:57:
> customer-app\gradle\libs.versions.toml:99:androidx-activity-compose = { module = 
"androidx.activity:activity-compose", version.ref = "activityCompose" }
> customer-app\gradle\libs.versions.toml:100:androidx-lifecycle-viewmodel-compose = { module = 
"androidx.lifecycle:lifecycle-viewmodel-compose", version.ref = "lifecycleViewmodelCompose" }
> customer-app\gradle\libs.versions.toml:101:androidx-lifecycle-runtime-compose = { module = 
"androidx.lifecycle:lifecycle-runtime-compose", version.ref = "lifecycleViewmodelCompose" }
> customer-app\gradle\libs.versions.toml:102:androidx-navigation-compose = { module = 
"androidx.navigation:navigation-compose", version.ref = "androidxNavigationCompose" }
  customer-app\gradle\libs.versions.toml:103:androidx-security-crypto = { module = 
"androidx.security:security-crypto", version.ref = "androidxSecurityCrypto" }
  customer-app\gradle\libs.versions.toml:104:androidx-datastore-preferences = { module = 
"androidx.datastore:datastore-preferences", version.ref = "datastorePreferences" }
> customer-app\gradle\libs.versions.toml:107:# Compose (BOM-pinned — no version)
> customer-app\gradle\libs.versions.toml:108:compose-bom = { module = "androidx.compose:compose-bom", version.ref = 
"composeBom" }
> customer-app\gradle\libs.versions.toml:109:compose-ui = { module = "androidx.compose.ui:ui" }
> customer-app\gradle\libs.versions.toml:110:compose-ui-tooling = { module = "androidx.compose.ui:ui-tooling" }
> customer-app\gradle\libs.versions.toml:111:compose-ui-tooling-preview = { module = 
"androidx.compose.ui:ui-tooling-preview" }
> customer-app\gradle\libs.versions.toml:112:compose-material3 = { module = "androidx.compose.material3:material3" }
> customer-app\gradle\libs.versions.toml:113:compose-material-icons-core = { module = 
"androidx.compose.material:material-icons-core" }
> customer-app\gradle\libs.versions.toml:114:compose-material-icons-extended = { module = 
"androidx.compose.material:material-icons-extended" }
  customer-app\gradle\libs.versions.toml:115:
  customer-app\gradle\libs.versions.toml:116:# DI
> customer-app\gradle\libs.versions.toml:120:androidx-hilt-navigation-compose = { module = 
"androidx.hilt:hilt-navigation-compose", version.ref = "hiltNavigationCompose" }
  customer-app\gradle\libs.versions.toml:121:
  customer-app\gradle\libs.versions.toml:122:# Firebase (BOM-pinned — firebase-auth-ktx / firebase-storage have no 
explicit version)
> customer-app\gradle\libs.versions.toml:137:posthog-android = { module = "com.posthog:posthog-android", version.ref = 
"posthog" }
  customer-app\gradle\libs.versions.toml:138:
  customer-app\gradle\libs.versions.toml:139:# Credential Manager + Google Identity
> customer-app\gradle\libs.versions.toml:155:coil-compose         = { module = "io.coil-kt:coil-compose",              
         version.ref = "coil" }
  customer-app\gradle\libs.versions.toml:156:kotlinx-serialization-json = { module = 
"org.jetbrains.kotlinx:kotlinx-serialization-json", version.ref = "kotlinxSerialization" }
  customer-app\gradle\libs.versions.toml:157:
> customer-app\gradle\libs.versions.toml:163:maps-compose          = { module = 
"com.google.maps.android:maps-compose",              version.ref = "mapsCompose" }
  customer-app\gradle\libs.versions.toml:164:play-integrity        = { module = "com.google.android.play:integrity",   
              version.ref = "playIntegrity" }
  customer-app\gradle\libs.versions.toml:165:androidx-work-runtime-ktx = { module = "androidx.work:work-runtime-ktx",  
             version.ref = "workManager" }
> customer-app\gradle\libs.versions.toml:196:kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", 
version.ref = "kotlin" }
  customer-app\gradle\libs.versions.toml:197:ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
  customer-app\gradle\libs.versions.toml:198:hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Path $env:USERPROFILE'"\\.gradle\\caches\\modules-2\\files-2.1\\com.posthog\\posthog-android -Recurse -Filter '*.jar' -ErrorAction SilentlyContinue | Select-Object -First 5 -ExpandProperty FullName" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 521ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Path C:\\Users\\alokt\\.gradle\\caches\\modules-2\\files-2.1\\com.posthog\\posthog-android -Recurse -Filter '*.jar' -ErrorAction SilentlyContinue | Select-Object -First 5 -ExpandProperty FullName" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 551ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 -- customer-app/app/src/test/kotlin/com/homeservices/customer/observability/analytics/PostHogAnalyticsFacadeTest.kt customer-app/app/src/test/kotlin/com/homeservices/customer/ui/consent/ConsentViewModelTest.kt customer-app/app/src/test/kotlin/com/homeservices/customer/data/consent/ConsentRepositoryImplTest.kt" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 672ms:
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/consent/ConsentRepositoryImplTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/consent/ConsentRepositoryImplTest.kt
new file mode 100644
index 00000000..14251cb2
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/consent/ConsentRepositoryImplTest.kt
@@ -0,0 +1,206 @@
+package com.homeservices.customer.data.consent
+
+import androidx.datastore.preferences.core.PreferenceDataStoreFactory
+import androidx.datastore.preferences.core.edit
+import androidx.datastore.preferences.core.intPreferencesKey
+import com.google.common.truth.Truth.assertThat
+import com.homeservices.customer.data.consent.remote.ConsentAuditApiService
+import com.homeservices.customer.data.consent.remote.dto.ConsentAuditRequestDto
+import com.homeservices.customer.domain.consent.CURRENT_CONSENT_VERSION
+import com.homeservices.customer.domain.consent.ConsentState
+import io.mockk.coEvery
+import io.mockk.coVerify
+import io.mockk.mockk
+import io.mockk.slot
+import kotlinx.coroutines.flow.first
+import kotlinx.coroutines.test.runTest
+import org.junit.Before
+import org.junit.Rule
+import org.junit.Test
+import org.junit.rules.TemporaryFolder
+import org.junit.runner.RunWith
+import org.robolectric.RobolectricTestRunner
+import retrofit2.Response
+import java.io.IOException
+
+@RunWith(RobolectricTestRunner::class)
+public class ConsentRepositoryImplTest {
+    @get:Rule
+    public val tempFolder: TemporaryFolder = TemporaryFolder()
+
+    private val consentAuditApiService: ConsentAuditApiService = mockk(relaxed = true)
+    private lateinit var repo: ConsentRepositoryImpl
+
+    @Before
+    public fun setUp() {
+        val dataStore =
+            PreferenceDataStoreFactory.create {
+                tempFolder.newFolder().resolve("consent_prefs.preferences_pb")
+            }
+        repo = ConsentRepositoryImpl(dataStore, consentAuditApiService)
+    }
+
+    // ─── Scenario 1: Initial state is NotGiven ───────────────────────────────
+
+    @Test
+    public fun `consentState defaults to NotGiven when nothing is stored`(): Unit =
+        runTest {
+            val state = repo.consentState.first()
+            assertThat(state).isInstanceOf(ConsentState.NotGiven::class.java)
+        }
+
+    // ─── Scenario 2: grantConsent persists and emits Granted ────────────────
+
+    @Test
+    public fun `grantConsent emits Granted with correct fields`(): Unit =
+        runTest {
+            coEvery { consentAuditApiService.postConsentAudit(any()) } returns Response.success(Unit)
+
+            repo.grantConsent(analyticsOptIn = true, crashOptIn = true, marketingOptIn = false)
+
+            val state = repo.consentState.first()
+            assertThat(state).isInstanceOf(ConsentState.Granted::class.java)
+            val granted = state as ConsentState.Granted
+            assertThat(granted.version).isEqualTo(CURRENT_CONSENT_VERSION)
+            assertThat(granted.analyticsOptIn).isTrue()
+            assertThat(granted.crashOptIn).isTrue()
+            assertThat(granted.marketingOptIn).isFalse()
+            assertThat(granted.grantedAt).isNotNull()
+        }
+
+    // ─── Scenario 3: revokeConsent after grant emits Revoked and re-consent required ─
+
+    @Test
+    public fun `revokeConsent after grant emits Revoked and isConsentRequired true`(): Unit =
+        runTest {
+            coEvery { consentAuditApiService.postConsentAudit(any()) } returns Response.success(Unit)
+
+            repo.grantConsent(analyticsOptIn = true, crashOptIn = true, marketingOptIn = true)
+            repo.revokeConsent()
+
+            val state = repo.consentState.first()
+            assertThat(state).isInstanceOf(ConsentState.Revoked::class.java)
+            // Revoked is not Granted, so re-consent must be required.
+            val required = repo.isConsentRequired.first()
+            assertThat(required).isTrue()
+        }
+
+    // ─── Scenario 4: isConsentRequired true for NotGiven ────────────────────
+
+    @Test
+    public fun `isConsentRequired is true when consent is NotGiven`(): Unit =
+        runTest {
+            val required = repo.isConsentRequired.first()
+            assertThat(required).isTrue()
+        }
+
+    // ─── Scenario 5: isConsentRequired false for current-version Granted ────
+
+    @Test
+    public fun `isConsentRequired is false when consent is Granted at current version`(): Unit =
+        runTest {
+            coEvery { consentAuditApiService.postConsentAudit(any()) } returns Response.success(Unit)
+
+            repo.grantConsent(analyticsOptIn = false, crashOptIn = false, marketingOptIn = false)
+
+            val required = repo.isConsentRequired.first()
+            assertThat(required).isFalse()
+        }
+
+    // ─── Scenario 6: isConsentRequired true for old-version Granted ─────────
+
+    @Test
+    public fun `isConsentRequired is true when consent was granted at an older version`(): Unit =
+        runTest {
+            // Grant normally (writes version = CURRENT_CONSENT_VERSION).
+            coEvery { consentAuditApiService.postConsentAudit(any()) } returns Response.success(Unit)
+            repo.grantConsent(analyticsOptIn = true, crashOptIn = true, marketingOptIn = true)
+
+            // Downgrade the stored version to 0 to simulate stale consent.
+            // Mirrors KEY_CONSENT_VERSION — if the key name changes, update this test too.
+            val dataStore =
+                PreferenceDataStoreFactory.create {
+                    tempFolder.newFolder().resolve("consent_prefs.preferences_pb")
+                }
+            val v0Repo = ConsentRepositoryImpl(dataStore, consentAuditApiService)
+            v0Repo.grantConsent(analyticsOptIn = true, crashOptIn = true, marketingOptIn = true)
+            dataStore.edit { prefs ->
+                prefs[intPreferencesKey("consent_version")] = 0
+            }
+
+            val state = v0Repo.consentState.first()
+            assertThat(state).isInstanceOf(ConsentState.Granted::class.java)
+            assertThat((state as ConsentState.Granted).version).isEqualTo(0)
+
+            val required = v0Repo.isConsentRequired.first()
+            assertThat(required).isTrue()
+        }
+
+    // ─── Scenario 7: grantConsent fires audit POST with correct DTO ──────────
+
+    @Test
+    public fun `grantConsent fires ConsentAuditApiService with GRANTED action and correct opt-ins`(): Unit =
+        runTest {
+            val capturedDto = slot<ConsentAuditRequestDto>()
+            coEvery { consentAuditApiService.postConsentAudit(capture(capturedDto)) } returns Response.success(Unit)
+
+            repo.grantConsent(analyticsOptIn = true, crashOptIn = true, marketingOptIn = false)
+
+            coVerify(exactly = 1) { consentAuditApiService.postConsentAudit(any()) }
+            assertThat(capturedDto.captured.action).isEqualTo("GRANTED")
+            assertThat(capturedDto.captured.version).isEqualTo(CURRENT_CONSENT_VERSION)
+            assertThat(capturedDto.captured.analyticsOptIn).isTrue()
+            assertThat(capturedDto.captured.crashOptIn).isTrue()
+            assertThat(capturedDto.captured.marketingOptIn).isFalse()
+        }
+
+    // ─── Scenario 8: grantConsent audit IOException does not rethrow ─────────
+
+    @Test
+    public fun `grantConsent does not rethrow when postConsentAudit throws IOException`(): Unit =
+        runTest {
+            coEvery { consentAuditApiService.postConsentAudit(any()) } throws IOException("network error")
+
+            // DataStore write must succeed; IOException from audit must be swallowed.
+            repo.grantConsent(analyticsOptIn = false, crashOptIn = false, marketingOptIn = false)
+
+            val state = repo.consentState.first()
+            assertThat(state).isInstanceOf(ConsentState.Granted::class.java)
+        }
+
+    // ─── Scenario 9: revokeConsent fires audit POST with REVOKED action ───────
+
+    @Test
+    public fun `revokeConsent fires ConsentAuditApiService with REVOKED action and all opt-ins false`(): Unit =
+        runTest {
+            val capturedDto = slot<ConsentAuditRequestDto>()
+            // Grant first so there is something to revoke.
+            coEvery { consentAuditApiService.postConsentAudit(capture(capturedDto)) } returns Response.success(Unit)
+            repo.grantConsent(analyticsOptIn = true, crashOptIn = true, marketingOptIn = true)
+
+            repo.revokeConsent()
+
+            // The last captured call should be the REVOKED audit.
+            assertThat(capturedDto.captured.action).isEqualTo("REVOKED")
+            assertThat(capturedDto.captured.analyticsOptIn).isFalse()
+            assertThat(capturedDto.captured.crashOptIn).isFalse()
+            assertThat(capturedDto.captured.marketingOptIn).isFalse()
+        }
+
+    // ─── Scenario 10: revokeConsent audit IOException does not rethrow ────────
+
+    @Test
+    public fun `revokeConsent does not rethrow when postConsentAudit throws IOException`(): Unit =
+        runTest {
+            // Grant succeeds, revoke audit throws.
+            coEvery { consentAuditApiService.postConsentAudit(any()) } returns Response.success(Unit)
+            repo.grantConsent(analyticsOptIn = true, crashOptIn = true, marketingOptIn = true)
+
+            coEvery { consentAuditApiService.postConsentAudit(any()) } throws IOException("timeout")
+            // Must not throw.
+            repo.revokeConsent()
+
+            val state = repo.consentState.first()
+            assertThat(state).isInstanceOf(ConsentState.Revoked::class.java)
+        }
+}
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/observability/analytics/PostHogAnalyticsFacadeTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/observability/analytics/PostHogAnalyticsFacadeTest.kt
new file mode 100644
index 00000000..4b03dc75
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/observability/analytics/PostHogAnalyticsFacadeTest.kt
@@ -0,0 +1,111 @@
+package com.homeservices.customer.observability.analytics
+
+import android.content.Context
+import androidx.test.core.app.ApplicationProvider
+import com.homeservices.customer.di.BuildInfoProvider
+import com.posthog.android.PostHogAndroid
+import com.posthog.android.PostHogAndroidConfig
+import io.mockk.every
+import io.mockk.mockk
+import io.mockk.mockkObject
+import io.mockk.unmockkAll
+import org.assertj.core.api.Assertions.assertThat
+import org.junit.After
+import org.junit.Before
+import org.junit.Test
+import org.junit.runner.RunWith
+import org.robolectric.RobolectricTestRunner
+import org.robolectric.annotation.Config
+import java.util.concurrent.atomic.AtomicBoolean
+
+/**
+ * Unit tests for [PostHogAnalyticsFacade].
+ *
+ * [PostHogAndroid] is mocked via mockkObject so that setup() never touches the network.
+ * The key observable is the internal [posthogInitialized] AtomicBoolean:
+ *  - false initially
+ *  - stays false when consent=false or key is blank
+ *  - becomes true after initIfConsented(true) with a non-blank key
+ */
+@RunWith(RobolectricTestRunner::class)
+@Config(sdk = [33], manifest = Config.NONE)
+public class PostHogAnalyticsFacadeTest {
+    private lateinit var context: Context
+
+    @Before
+    public fun setUp() {
+        context = ApplicationProvider.getApplicationContext()
+        mockkObject(PostHogAndroid)
+        every { PostHogAndroid.setup(any(), any<PostHogAndroidConfig>()) } returns Unit
+    }
+
+    @After
+    public fun tearDown() {
+        unmockkAll()
+    }
+
+    private fun buildFacade(apiKey: String): PostHogAnalyticsFacade {
+        val buildInfo = mockk<BuildInfoProvider> { every { postHogApiKey } returns apiKey }
+        return PostHogAnalyticsFacade(context, buildInfo)
+    }
+
+    private fun posthogInitialized(facade: PostHogAnalyticsFacade): Boolean {
+        val field = PostHogAnalyticsFacade::class.java.getDeclaredField("posthogInitialized")
+        field.isAccessible = true
+        return (field.get(facade) as AtomicBoolean).get()
+    }
+
+    @Test
+    public fun `posthogInitialized is false initially`() {
+        val sut = buildFacade("ph-test-key")
+        assertThat(posthogInitialized(sut)).isFalse()
+    }
+
+    @Test
+    public fun `initIfConsented false does not set posthogInitialized`() {
+        val sut = buildFacade("ph-test-key")
+        sut.initIfConsented(false)
+        assertThat(posthogInitialized(sut)).isFalse()
+    }
+
+    @Test
+    public fun `initIfConsented true with blank key does not set posthogInitialized`() {
+        val sut = buildFacade("")
+        sut.initIfConsented(true)
+        assertThat(posthogInitialized(sut)).isFalse()
+    }
+
+    @Test
+    public fun `initIfConsented true with non-blank key sets posthogInitialized`() {
+        val sut = buildFacade("ph-test-key-abc123")
+        sut.initIfConsented(true)
+        assertThat(posthogInitialized(sut)).isTrue()
+    }
+
+    @Test
+    public fun `track is no-op when posthogInitialized is false`() {
+        val sut = buildFacade("ph-test-key")
+        // posthogInitialized is false — track should not throw
+        sut.track("test_event")
+    }
+
+    @Test
+    public fun `identify is no-op when posthogInitialized is false`() {
+        val sut = buildFacade("ph-test-key")
+        sut.identify("user-123")
+    }
+
+    @Test
+    public fun `reset is no-op when posthogInitialized is false`() {
+        val sut = buildFacade("ph-test-key")
+        sut.reset()
+    }
+
+    @Test
+    public fun `second initIfConsented true call is idempotent`() {
+        val sut = buildFacade("ph-test-key-abc123")
+        sut.initIfConsented(true)
+        sut.initIfConsented(true)
+        assertThat(posthogInitialized(sut)).isTrue()
+    }
+}
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/ui/consent/ConsentViewModelTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/ui/consent/ConsentViewModelTest.kt
new file mode 100644
index 00000000..ab032e81
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/ui/consent/ConsentViewModelTest.kt
@@ -0,0 +1,192 @@
+package com.homeservices.customer.ui.consent
+
+import com.google.common.truth.Truth.assertThat
+import com.homeservices.customer.domain.consent.GrantConsentUseCase
+import com.homeservices.customer.domain.consent.IsConsentRequiredUseCase
+import io.mockk.coEvery
+import io.mockk.coVerify
+import io.mockk.every
+import io.mockk.mockk
+import kotlinx.coroutines.CancellationException
+import kotlinx.coroutines.Dispatchers
+import kotlinx.coroutines.ExperimentalCoroutinesApi
+import kotlinx.coroutines.flow.flowOf
+import kotlinx.coroutines.flow.toList
+import kotlinx.coroutines.launch
+import kotlinx.coroutines.test.StandardTestDispatcher
+import kotlinx.coroutines.test.advanceUntilIdle
+import kotlinx.coroutines.test.resetMain
+import kotlinx.coroutines.test.runTest
+import kotlinx.coroutines.test.setMain
+import org.junit.After
+import org.junit.Before
+import org.junit.Test
+
+@OptIn(ExperimentalCoroutinesApi::class)
+public class ConsentViewModelTest {
+    private val testDispatcher = StandardTestDispatcher()
+
+    private lateinit var grantConsentUseCase: GrantConsentUseCase
+    private lateinit var isConsentRequiredUseCase: IsConsentRequiredUseCase
+    private lateinit var viewModel: ConsentViewModel
+
+    @Before
+    public fun setUp() {
+        Dispatchers.setMain(testDispatcher)
+        grantConsentUseCase = mockk()
+        isConsentRequiredUseCase = mockk()
+        every { isConsentRequiredUseCase() } returns flowOf(true)
+        viewModel = ConsentViewModel(grantConsentUseCase, isConsentRequiredUseCase)
+    }
+
+    @After
+    public fun tearDown() {
+        Dispatchers.resetMain()
+    }
+
+    // ── Initial state ─────────────────────────────────────────────────────────
+
+    @Test
+    public fun `initial state has analytics and crash on, marketing off`() {
+        val state = viewModel.uiState.value
+        assertThat(state.analyticsOptIn).isTrue()
+        assertThat(state.crashOptIn).isTrue()
+        assertThat(state.marketingOptIn).isFalse()
+        assertThat(state.isLoading).isFalse()
+        assertThat(state.error).isNull()
+    }
+
+    // ── Toggle functions ──────────────────────────────────────────────────────
+
+    @Test
+    public fun `toggleAnalytics false sets analyticsOptIn to false`() {
+        viewModel.toggleAnalytics(false)
+        assertThat(viewModel.uiState.value.analyticsOptIn).isFalse()
+    }
+
+    @Test
+    public fun `toggleAnalytics true restores analyticsOptIn to true`() {
+        viewModel.toggleAnalytics(false)
+        viewModel.toggleAnalytics(true)
+        assertThat(viewModel.uiState.value.analyticsOptIn).isTrue()
+    }
+
+    @Test
+    public fun `toggleCrash false sets crashOptIn to false`() {
+        viewModel.toggleCrash(false)
+        assertThat(viewModel.uiState.value.crashOptIn).isFalse()
+    }
+
+    @Test
+    public fun `toggleMarketing true sets marketingOptIn to true`() {
+        viewModel.toggleMarketing(true)
+        assertThat(viewModel.uiState.value.marketingOptIn).isTrue()
+    }
+
+    // ── onConfirm ─────────────────────────────────────────────────────────────
+
+    @Test
+    public fun `onConfirm calls grantConsentUseCase with current opt-ins and emits navigateNext`(): Unit =
+        runTest {
+            coEvery { grantConsentUseCase(any(), any(), any()) } returns Unit
+
+            // Set custom toggles before confirm
+            viewModel.toggleAnalytics(true)
+            viewModel.toggleCrash(false)
+            viewModel.toggleMarketing(true)
+
+            val navEvents = mutableListOf<Unit>()
+            val collectJob = launch { viewModel.navigateNext.toList(navEvents) }
+
+            viewModel.onConfirm()
+            testDispatcher.scheduler.advanceUntilIdle()
+
+            coVerify(exactly = 1) {
+                grantConsentUseCase(
+                    analyticsOptIn = true,
+                    crashOptIn = false,
+                    marketingOptIn = true,
+                )
+            }
+            assertThat(navEvents).hasSize(1)
+            assertThat(viewModel.uiState.value.isLoading).isFalse()
+
+            collectJob.cancel()
+        }
+
+    @Test
+    public fun `onConfirm resets isLoading to false even on exception and does not emit navigateNext`(): Unit =
+        runTest {
+            coEvery { grantConsentUseCase(any(), any(), any()) } throws RuntimeException("Network error")
+
+            val navEvents = mutableListOf<Unit>()
+            val collectJob = launch { viewModel.navigateNext.toList(navEvents) }
+
+            viewModel.onConfirm()
+            testDispatcher.scheduler.advanceUntilIdle()
+
+            assertThat(viewModel.uiState.value.isLoading).isFalse()
+            assertThat(viewModel.uiState.value.error).isEqualTo("Network error")
+            assertThat(navEvents).isEmpty()
+
+            collectJob.cancel()
+        }
+
+    // ── onDeclineAll ──────────────────────────────────────────────────────────
+
+    @Test
+    public fun `onDeclineAll calls grantConsentUseCase with all false and emits navigateNext`(): Unit =
+        runTest {
+            coEvery { grantConsentUseCase(false, false, false) } returns Unit
+
+            val navEvents = mutableListOf<Unit>()
+            val collectJob = launch { viewModel.navigateNext.toList(navEvents) }
+
+            viewModel.onDeclineAll()
+            testDispatcher.scheduler.advanceUntilIdle()
+
+            coVerify(exactly = 1) {
+                grantConsentUseCase(
+                    analyticsOptIn = false,
+                    crashOptIn = false,
+                    marketingOptIn = false,
+                )
+            }
+            assertThat(navEvents).hasSize(1)
+            assertThat(viewModel.uiState.value.isLoading).isFalse()
+
+            collectJob.cancel()
+        }
+
+    @Test
+    public fun `onDeclineAll resets isLoading to false on exception and does not emit navigateNext`(): Unit =
+        runTest {
+            coEvery { grantConsentUseCase(any(), any(), any()) } throws RuntimeException("Timeout")
+
+            val navEvents = mutableListOf<Unit>()
+            val collectJob = launch { viewModel.navigateNext.toList(navEvents) }
+
+            viewModel.onDeclineAll()
+            testDispatcher.scheduler.advanceUntilIdle()
+
+            assertThat(viewModel.uiState.value.isLoading).isFalse()
+            assertThat(viewModel.uiState.value.error).isEqualTo("Timeout")
+            assertThat(navEvents).isEmpty()
+
+            collectJob.cancel()
+        }
+
+    // ── CancellationException propagation ─────────────────────────────────────
+
+    @Test
+    public fun `onConfirm rethrows CancellationException from use case`(): Unit =
+        runTest {
+            coEvery { grantConsentUseCase(any(), any(), any()) } throws CancellationException("test cancel")
+            // CancellationException must not be swallowed — the coroutine propagates it
+            // and the viewModelScope handles cancellation. The key assertion is that
+            // isLoading is NOT left as true after the coroutine ends.
+            viewModel.onConfirm()
+            advanceUntilIdle()
+            assertThat(viewModel.uiState.value.isLoading).isFalse()
+        }
+}
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content customer-app/app/src/main/kotlin/com/homeservices/customer/di/BuildInfoProvider.kt -Raw' in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 458ms:
package com.homeservices.customer.di

import com.homeservices.customer.BuildConfig
import javax.inject.Singleton

@Singleton
public class BuildInfoProvider(
    public val version: String,
    public val gitSha: String,
) {
    public val shortSha: String
        get() = if (gitSha.length <= SHORT_SHA_LENGTH) gitSha else gitSha.substring(0, SHORT_SHA_LENGTH)

    /** PostHog project API key. Empty string in CI/debug builds without a key â€” init is skipped when blank. */
    public val postHogApiKey: String = BuildConfig.POSTHOG_API_KEY

    private companion object {
        const val SHORT_SHA_LENGTH: Int = 8
    }
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path customer-app/app/src/main/kotlin/**/*.kt -Pattern 'BuildInfoProvider' -SimpleMatch | Select-Object -First 50" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 584ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem customer-app/app/src/main/kotlin -Recurse -Filter *.kt | Select-String -Pattern 'BuildInfoProvider' | ForEach-Object { \""'$($_.Path):$($_.LineNumber):$($_.Line)" }' in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 593ms:
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\MainActivity.kt:14:import com.homeservices.customer.di.BuildInfoProvider
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\MainActivity.kt:55:    @Inject public lateinit var buildInfo: BuildInfoProvider
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\di\AppModule.kt:15:    public fun provideBuildInfoProvider(): BuildInfoProvider =
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\di\AppModule.kt:16:        BuildInfoProvider(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\di\BuildInfoProvider.kt:7:public class BuildInfoProvider(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:4:import com.homeservices.customer.di.BuildInfoProvider
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:18:        private val buildInfoProvider: BuildInfoProvider,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:30:            val apiKey = buildInfoProvider.postHogApiKey
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\ui\SmokeScreen.kt:16:import com.homeservices.customer.di.BuildInfoProvider
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\ui\SmokeScreen.kt:22:public fun SmokeScreen(buildInfo: BuildInfoProvider): Unit {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content customer-app/app/src/main/kotlin/com/homeservices/customer/di/AppModule.kt -Raw' in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 438ms:
package com.homeservices.customer.di

import com.homeservices.customer.BuildConfig
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public object AppModule {
    @Provides
    @Singleton
    public fun provideBuildInfoProvider(): BuildInfoProvider =
        BuildInfoProvider(
            version = BuildConfig.VERSION_NAME,
            gitSha = BuildConfig.GIT_SHA,
        )
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem customer-app/app/src/test/kotlin -Recurse -Filter *.kt | Select-String -Pattern 'AuthViewModel\\(|BookingViewModel\\(|CatalogueHomeViewModel\\(|ServiceDetailViewModel\\(|ComplaintViewModel\\(|RatingViewModel\\(' | ForEach-Object { \""'$($_.Path):$($_.LineNumber):$($_.Line.Trim())" }' in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 620ms:
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:40:viewModel = AuthViewModel(orchestrator, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelBiometricTest.kt:60:private fun makeVm() = BookingViewModel(createBooking, confirmBooking, razorpayPayment, biometricGate, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelCreditTest.kt:47:private fun makeVm() = BookingViewModel(createBooking, confirmBooking, razorpayPayment, biometricGate, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelDuplicateTapTest.kt:62:private fun makeVm() = BookingViewModel(createBooking, confirmBooking, razorpayPayment, biometricGate, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelTest.kt:56:private fun makeVm() = BookingViewModel(createBooking, confirmBooking, razorpayPayment, biometricGate, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeViewModelTest.kt:39:sut = CatalogueHomeViewModel(useCase, localizer, getCurrentLocale, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeViewModelTest.kt:59:sut = CatalogueHomeViewModel(useCase, localizer, getCurrentLocale, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailTrustDossierTest.kt:76:ServiceDetailViewModel(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailTrustDossierTest.kt:101:ServiceDetailViewModel(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailViewModelConfidenceScoreTest.kt:139:return ServiceDetailViewModel(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailViewModelGpsConfidenceTest.kt:149:return ServiceDetailViewModel(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailViewModelTest.kt:69:ServiceDetailViewModel(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailViewModelTest.kt:87:ServiceDetailViewModel(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailViewModelTest.kt:105:ServiceDetailViewModel(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailViewModelTest.kt:124:ServiceDetailViewModel(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailViewModelTest.kt:144:ServiceDetailViewModel(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\complaint\ComplaintViewModelTest.kt:37:viewModel = ComplaintViewModel(submitUseCase, photoUploadUseCase, getStatusUseCase, reopenUseCase, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelShieldTest.kt:55:val v = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelTest.kt:57:val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelTest.kt:87:val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelTest.kt:110:val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelTest.kt:137:val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelTest.kt:148:val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelTest.kt:162:val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelTest.kt:180:val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelTest.kt:199:val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem customer-app/app/src/main/kotlin -Recurse -Filter *.kt | Select-String -Pattern 'crashOptIn|KEY_CRASH|SentryInitializer|Sentry' | ForEach-Object { \""'$($_.Path):$($_.LineNumber):$($_.Line.Trim())" }' in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 541ms:
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:12:import com.homeservices.customer.observability.SentryInitializer
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:39:public interface FeatureFlagsEntryPoint {
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:45:public interface AnalyticsEntryPoint {
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:53:SentryInitializer.init(this)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:63:.fromApplication(this@HomeservicesCustomerApplication, FeatureFlagsEntryPoint::class.java)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:80:val analyticsEntryPoint =
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:82:.fromApplication(this@HomeservicesCustomerApplication, AnalyticsEntryPoint::class.java)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:86:analyticsEntryPoint
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:93:io.sentry.Sentry.addBreadcrumb(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:94:io.sentry.Breadcrumb.info("PostHog init skipped — consent state unavailable after 5s: ${e.message}"),
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\HomeservicesCustomerApplication.kt:98:analyticsEntryPoint.postHogAnalyticsFacade().initIfConsented(analyticsOptIn)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\MainActivity.kt:49:* Stream 2.6 (Sentry breadcrumbs) can rebase without conflicts.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:11:import io.sentry.Sentry
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:12:import io.sentry.SentryLevel
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:127:Sentry.addBreadcrumb(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:128:io.sentry.Breadcrumb().apply {
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:131:level = SentryLevel.WARNING
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:177:* Sentry breadcrumbs but never thrown — sign-out always completes.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:200:Sentry.addBreadcrumb(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:201:io.sentry.Breadcrumb().apply {
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:204:level = SentryLevel.WARNING
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:214:Sentry.addBreadcrumb(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:215:io.sentry.Breadcrumb().apply {
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:218:level = SentryLevel.WARNING
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:229:Sentry.addBreadcrumb(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:230:io.sentry.Breadcrumb().apply {
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:233:level = SentryLevel.WARNING
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:244:Sentry.addBreadcrumb(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:245:io.sentry.Breadcrumb().apply {
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:248:level = SentryLevel.WARNING
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\di\AuthModule.kt:16:import io.sentry.Sentry
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\di\AuthModule.kt:68:Sentry.addBreadcrumb(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\di\AuthModule.kt:72:Sentry.captureException(e)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\di\AuthModule.kt:75:Sentry.addBreadcrumb(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\di\AuthModule.kt:79:Sentry.captureException(e)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImpl.kt:16:import io.sentry.Breadcrumb
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImpl.kt:17:import io.sentry.Sentry
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImpl.kt:37:val KEY_CRASH = booleanPreferencesKey("consent_crash")
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImpl.kt:55:crashOptIn = prefs[KEY_CRASH] ?: false,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImpl.kt:77:crashOptIn: Boolean,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImpl.kt:85:prefs[KEY_CRASH] = crashOptIn
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImpl.kt:97:crashOptIn = crashOptIn,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImpl.kt:104:Sentry.addBreadcrumb(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImpl.kt:117:prefs.remove(KEY_CRASH)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImpl.kt:129:crashOptIn = false,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImpl.kt:136:Sentry.addBreadcrumb(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\consent\remote\dto\ConsentAuditRequestDto.kt:13:@Json(name = "crash_opt_in") val crashOptIn: Boolean,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:4:import io.sentry.Breadcrumb
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:5:import io.sentry.Sentry
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:6:import io.sentry.SentryLevel
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:15:* failures are logged as Sentry breadcrumbs but never propagate to callers.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:43:Sentry.addBreadcrumb(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:47:level = SentryLevel.WARNING
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:65:Sentry.addBreadcrumb(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:69:level = SentryLevel.WARNING
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\domain\consent\ConsentRepository.kt:13:crashOptIn: Boolean,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\domain\consent\ConsentState.kt:12:val crashOptIn: Boolean,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\domain\consent\GrantConsentUseCase.kt:18:crashOptIn: Boolean,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\domain\consent\GrantConsentUseCase.kt:23:crashOptIn = crashOptIn,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:34:import com.homeservices.customer.observability.SentryContextBinder
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:76:* Stream 2.6 (Sentry breadcrumbs) note: signature extended with named parameters with
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:161:SentryEffects(sessionManager = sessionManager, navController = navController)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:286:* E18-S06: Binds the Sentry user context and records navigation breadcrumbs.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:290:private fun SentryEffects(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:295:SentryContextBinder.bindAuthState(sessionManager.authState)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:301:SentryContextBinder.recordNavigationBreadcrumb(from = previousRoute, to = destination.route)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:3:import io.sentry.SentryEvent
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:4:import io.sentry.protocol.SentryException
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:7:* PII redaction utilities for Sentry events (E13-S04, ADR-0018).
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:9:* Applies to all string values captured in Sentry event messages, exception
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:36:* Scrub a [SentryEvent] in place before it is transmitted.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:41:* - Returns the mutated event (Sentry SDK requires the same instance).
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:43:public fun scrub(event: SentryEvent): SentryEvent {
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:51:event.exceptions?.forEach { exc: SentryException ->
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:4:import io.sentry.Breadcrumb
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:5:import io.sentry.Sentry
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:6:import io.sentry.SentryLevel
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:7:import io.sentry.protocol.User
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:11:* Thin, testable façade for all Sentry context mutations (E18-S06).
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:14:* - Bind user-context in Sentry when [AuthState] changes (never raw UID).
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:18:* be unit-tested by MockK-patching Sentry's static API.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:25:public object SentryContextBinder {
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:27:* Collects [authStateFlow] and updates Sentry user-context on each emission.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:29:* - [AuthState.Authenticated]: calls [Sentry.setUser] with a 16-char hashed uid.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:30:* - [AuthState.Unauthenticated]: calls [Sentry.setUser] with null (clears context).
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:43:id = SentryIdentity.sentryUserId(state.uid)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:45:Sentry.setUser(user)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:47:is AuthState.Unauthenticated -> Sentry.setUser(null)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:53:* Adds a Sentry navigation breadcrumb for a single route transition.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:72:level = SentryLevel.INFO
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:74:Sentry.addBreadcrumb(crumb)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryIdentity.kt:6:* Sentry identity helpers (E18-S06).
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryIdentity.kt:8:* Provides a one-way, deterministic identifier for use in Sentry user-context.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryIdentity.kt:9:* The raw Firebase UID is NEVER sent to Sentry; only the first 16 hex characters
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryIdentity.kt:11:* enough entropy to correlate Sentry issues to a specific account (via internal
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryIdentity.kt:12:* lookup by the engineering team) without exposing the raw identifier to Sentry.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryIdentity.kt:16:* truncated to 16 hex chars (64 bits) — sufficient for Sentry correlation and
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryIdentity.kt:19:public object SentryIdentity {
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryIdentity.kt:20:/** Length of the truncated SHA-256 hex prefix sent to Sentry as user identifier.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryIdentity.kt:21:*  64 bits (16 hex chars) is sufficient for Sentry correlation while reducing
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryIdentity.kt:23:private const val SENTRY_USER_ID_HEX_LENGTH = 16
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryIdentity.kt:28:* Never returns the raw [uid]. Safe to send to Sentry.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryIdentity.kt:33:public fun sentryUserId(uid: String): String {
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryIdentity.kt:36:return hashBytes.joinToString("") { "%02x".format(it) }.take(SENTRY_USER_ID_HEX_LENGTH)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryInitializer.kt:5:import io.sentry.android.core.SentryAndroid
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryInitializer.kt:7:public object SentryInitializer {
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryInitializer.kt:12:dsn: String = BuildConfig.SENTRY_DSN,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryInitializer.kt:15:SentryAndroid.init(application) { options ->
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryInitializer.kt:19:// Sentry release tracking and sourcemap/ProGuard mapping uploads.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryInitializer.kt:23:io.sentry.SentryOptions.BeforeSendCallback { event, _ ->
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\ui\consent\ConsentUiState.kt:5:val crashOptIn: Boolean = true,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\ui\consent\ConsentViewModel.kt:38:_uiState.update { it.copy(crashOptIn = value) }
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\ui\consent\ConsentViewModel.kt:53:crashOptIn = state.crashOptIn,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\ui\consent\ConsentViewModel.kt:74:crashOptIn = false,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\ui\consent\DpdpConsentScreen.kt:357:checked = uiState.crashOptIn,

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt -TotalCount 360' in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 571ms:
package com.homeservices.customer.navigation

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.homeservices.corenav.DeepLinkUri
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.pendingaction.PendingActionStore
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.consent.IsConsentRequiredUseCase
import com.homeservices.customer.domain.flags.FeatureFlags
import com.homeservices.customer.domain.locale.IsFirstLaunchUseCase
import com.homeservices.customer.observability.SentryContextBinder
import com.homeservices.customer.ui.consent.DpdpConsentScreen
import com.homeservices.customer.ui.locale.FirstLaunchLanguageScreen
import com.homeservices.customer.ui.rating.RatingRoutes

public object LocaleRoutes {
    public const val FIRST_LAUNCH: String = "first_launch_language"
    public const val SETTINGS: String = "settings"
    public const val LANGUAGE_SETTINGS: String = "language_settings"
    public const val PRIVACY_AND_DATA: String = "privacy_data"
    public const val PRIVACY_DATA: String = "privacy_data"
    public const val DATA_EXPORT: String = "data_export"

    // DELETE_ACCOUNT routes added by E15-S02 (Stream 2.4) â€” populated by that branch.
    public const val DELETE_ACCOUNT: String = "delete_account"
    public const val DELETE_ACCOUNT_CONFIRM: String = "delete_account_confirm"
    public const val DELETE_ACCOUNT_COOL_OFF: String = "delete_account_cool_off"

    // DPDP consent gate (WS-D) â€” shown on first launch before locale picker,
    // and accessible from Settings â†’ Privacy & data â†’ Manage consent.
    public const val DPDP_CONSENT: String = "dpdp_consent"

    // Consent management route wired in SettingsGraph (revoke / update consent).
    public const val CONSENT_MANAGEMENT: String = "consent_management"
}

/**
 * Root navigation composable for the customer-app.
 *
 * E11-S01b-1 additive parameters:
 *   - [routeResolver]: used by future deep-link handling; currently wired but not yet
 *     consumed in the composable body (full consumption in E11-S01b-2 route migration).
 *   - [initialDeepLink]: `homeservices://action/<TYPE>?entityId=<id>` URI extracted from
 *     the launching Intent by [MainActivity]. Consumed on first composition to navigate
 *     to the action's destination after auth check.
 *
 * E11-S01b-2: PriceApprovalEventBus and RatingPromptEventBus parameters removed.
 * Navigation is now driven by Room-observed [PendingActionStore] rows via
 * [PendingActionsNavEffect]. The FCM service still posts to the legacy event buses
 * as a fallback (see [CustomerFirebaseMessagingService]), but AppNavigation no
 * longer depends on them â€” it observes the Room table directly.
 *
 * Stream 2.6 (Sentry breadcrumbs) note: signature extended with named parameters with
 * defaults â€” existing call sites compile unchanged.
 */
@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    pendingActionStore: PendingActionStore,
    isFirstLaunch: IsFirstLaunchUseCase,
    isConsentRequired: IsConsentRequiredUseCase,
    featureFlags: FeatureFlags,
    modifier: Modifier = Modifier,
    routeResolver: CustomerRouteResolver? = null,
    initialDeepLink: String? = null,
) {
    // Both booleans start as null (loading) so no screen flashes before DataStore emits.
    // We hold the blank Surface until BOTH emit â€” prevents consent/onboarding race.
    val firstLaunchPending: Boolean? =
        isFirstLaunch().collectAsStateWithLifecycle(initialValue = null as Boolean?).value
    val consentRequired: Boolean? =
        isConsentRequired().collectAsStateWithLifecycle(initialValue = null as Boolean?).value

    if (firstLaunchPending == null || consentRequired == null) {
        Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {}
        return
    }

    AppNavigationReady(
        sessionManager = sessionManager,
        activity = activity,
        pendingActionStore = pendingActionStore,
        featureFlags = featureFlags,
        firstLaunchPending = firstLaunchPending,
        consentRequired = consentRequired,
        modifier = modifier,
        routeResolver = routeResolver,
        initialDeepLink = initialDeepLink,
    )
}

/**
 * Inner composable rendered once [firstLaunchPending] has emitted a non-null value.
 *
 * Extracted from [AppNavigation] to satisfy detekt LongMethod and CyclomaticComplexMethod
 * limits â€” the outer function handles the loading gate only; all navigation wiring lives here.
 */
@Suppress("LongMethod")
@Composable
private fun AppNavigationReady(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    pendingActionStore: PendingActionStore,
    featureFlags: FeatureFlags,
    firstLaunchPending: Boolean,
    consentRequired: Boolean,
    modifier: Modifier,
    routeResolver: CustomerRouteResolver?,
    initialDeepLink: String?,
) {
    val context = LocalContext.current
    val authState by sessionManager.authState.collectAsStateWithLifecycle()
    val navController = rememberNavController()
    // Consent gate wins over locale picker; both win over auth.
    val startDestination =
        when {
            consentRequired -> LocaleRoutes.DPDP_CONSENT
            firstLaunchPending -> LocaleRoutes.FIRST_LAUNCH
            else -> ROUTE_AUTH
        }
    val notificationPermissionLauncher =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}

    AuthStateEffect(
        authState = authState,
        firstLaunchPending = firstLaunchPending,
        consentRequired = consentRequired,
        context = context,
        navController = navController,
        notificationPermissionLauncher = notificationPermissionLauncher,
    )
    PendingActionsNavEffect(
        authState = authState,
        pendingActionStore = pendingActionStore,
        navController = navController,
    )
    SentryEffects(sessionManager = sessionManager, navController = navController)
    if (initialDeepLink != null && !firstLaunchPending) {
        DeepLinkEffect(
            initialDeepLink = initialDeepLink,
            authState = authState,
            routeResolver = routeResolver,
            navController = navController,
        )
    }

    NavHost(navController = navController, startDestination = startDestination, modifier = modifier) {
        // DPDP consent gate â€” shown when consent is required before first-launch locale picker.
        // On completion, navigates to locale picker if needed, otherwise straight to auth.
        composable(LocaleRoutes.DPDP_CONSENT) {
            DpdpConsentScreen(
                onConsentComplete = {
                    val next = if (firstLaunchPending) LocaleRoutes.FIRST_LAUNCH else ROUTE_AUTH
                    navController.navigate(next) {
                        popUpTo(LocaleRoutes.DPDP_CONSENT) { inclusive = true }
                        launchSingleTop = true
                    }
                },
            )
        }
        composable(LocaleRoutes.FIRST_LAUNCH) {
            FirstLaunchLanguageScreen(
                onConfirmed = {
                    navController.navigate(ROUTE_AUTH) {
                        popUpTo(LocaleRoutes.FIRST_LAUNCH) { inclusive = true }
                        launchSingleTop = true
                    }
                },
            )
        }
        authGraph(navController, activity)
        mainGraph(navController, featureFlags)
        settingsGraph(navController, featureFlags)
    }
}

/**
 * Reacts to [authState] changes: navigates to main/auth, subscribes/unsubscribes FCM topic,
 * and requests notification permission on first sign-in.
 */
@Composable
private fun AuthStateEffect(
    authState: AuthState,
    firstLaunchPending: Boolean,
    consentRequired: Boolean,
    context: Context,
    navController: NavController,
    notificationPermissionLauncher: ActivityResultLauncher<String>,
) {
    LaunchedEffect(authState, firstLaunchPending, consentRequired) {
        if (firstLaunchPending || consentRequired) return@LaunchedEffect
        when (val currentAuth = authState) {
            is AuthState.Authenticated -> {
                navController.navigate(ROUTE_MAIN) {
                    // Single pop target: by the time this fires, firstLaunchPending is
                    // false (guarded above) and FirstLaunchLanguageScreen.onConfirmed
                    // has already popped first_launch on its way to auth. Stack: [auth].
                    popUpTo(ROUTE_AUTH) { inclusive = true }
                    launchSingleTop = true
                }
                com.google.firebase.messaging.FirebaseMessaging
                    .getInstance()
                    .subscribeToTopic("customer_${currentAuth.uid}")
                if (!context.hasNotificationPermission()) {
                    notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
            is AuthState.Unauthenticated -> {
                com.google.firebase.messaging.FirebaseMessaging
                    .getInstance()
                    .deleteToken()
                navController.navigate(ROUTE_AUTH) {
                    // Single pop target: logout from main means stack is [main];
                    // first_launch is never on the stack at this point.
                    popUpTo(ROUTE_MAIN) { inclusive = true }
                    launchSingleTop = true
                }
            }
        }
    }
}

/**
 * Observes ACTIVE pending actions from Room for the authenticated user and
 * navigates to the appropriate screen when an ADDON_APPROVAL_REQUESTED or
 * RATING_PROMPT_CUSTOMER action is present.
 *
 * E11-S01b-2: Replaces [EventBusEffects] (removed). Navigation is now driven by
 * the Room table rather than in-process event buses. The FCM service continues
 * to post legacy events for backward compat, but AppNavigation no longer depends
 * on them â€” it observes the store directly.
 *
 * Design note: We track a `Set<String>` of already-navigated action IDs so that
 * re-compositions and config changes do not trigger duplicate navigation.
 * The set is cleared when the user ID changes (new login).
 */
@Composable
private fun PendingActionsNavEffect(
    authState: AuthState,
    pendingActionStore: PendingActionStore,
    navController: NavController,
) {
    val authenticatedUid = (authState as? AuthState.Authenticated)?.uid ?: return

    LaunchedEffect(authenticatedUid) {
        val navigatedIds = mutableSetOf<String>()
        pendingActionStore.observeActive(authenticatedUid).collect { actions ->
            actions
                .filter { it.status == PendingActionStatus.ACTIVE && it.id !in navigatedIds }
                .forEach { action ->
                    val route = pendingActionNavRoute(action.type, action.entityId)
                    if (route != null) {
                        navigatedIds += action.id
                        navController.navigate(route) { launchSingleTop = true }
                    }
                }
        }
    }
}

/**
 * E18-S06: Binds the Sentry user context and records navigation breadcrumbs.
 * Separate from auth navigation so the two concerns do not interfere.
 */
@Composable
private fun SentryEffects(
    sessionManager: SessionManager,
    navController: NavController,
) {
    LaunchedEffect(sessionManager) {
        SentryContextBinder.bindAuthState(sessionManager.authState)
    }
    DisposableEffect(navController) {
        var previousRoute: String? = null
        val listener =
            NavController.OnDestinationChangedListener { _, destination, _ ->
                SentryContextBinder.recordNavigationBreadcrumb(from = previousRoute, to = destination.route)
                previousRoute = destination.route
            }
        navController.addOnDestinationChangedListener(listener)
        onDispose { navController.removeOnDestinationChangedListener(listener) }
    }
}

/**
 * E11-S01b-1: Cold-start deep-link routing for `homeservices://action/<TYPE>?entityId=<id>`.
 * Navigates to the resolved route once the user is authenticated and firstLaunch is done.
 */
@Composable
private fun DeepLinkEffect(
    initialDeepLink: String,
    authState: AuthState,
    routeResolver: CustomerRouteResolver?,
    navController: NavController,
) {
    LaunchedEffect(initialDeepLink, authState) {
        val currentAuth = authState
        if (currentAuth !is AuthState.Authenticated) return@LaunchedEffect
        val intent = DeepLinkUri.parse(initialDeepLink) ?: return@LaunchedEffect
        when (routeResolver?.routeFor(intent)) {
            CustomerRouteSpec.BookingPriceApproval ->
                navController.navigate(BookingRoutes.priceApprovalRoute(intent.entityId)) {
                    launchSingleTop = true
                }
            CustomerRouteSpec.Rating ->
                navController.navigate(RatingRoutes.route(intent.entityId)) { launchSingleTop = true }
            else -> Unit // home is the default; no explicit nav needed
        }
    }
}

private fun Context.hasNotificationPermission(): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
        ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 -- customer-app/app/src/test/kotlin/com/homeservices/customer/domain/flags/GrowthBookFeatureFlagsTest.kt customer-app/app/src/test/kotlin/com/homeservices/customer/domain/flags/PhotoFirstCatalogueFeatureFlagTest.kt" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 556ms:
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/flags/GrowthBookFeatureFlagsTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/flags/GrowthBookFeatureFlagsTest.kt
index c36e9caf..b02e5a74 100644
--- a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/flags/GrowthBookFeatureFlagsTest.kt
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/flags/GrowthBookFeatureFlagsTest.kt
@@ -1,5 +1,7 @@
 package com.homeservices.customer.domain.flags
 
+import com.homeservices.customer.observability.analytics.AnalyticsFacade
+import com.homeservices.customer.observability.analytics.NoOpAnalyticsFacade
 import org.assertj.core.api.Assertions.assertThat
 import org.junit.jupiter.api.Test
 
@@ -12,17 +14,20 @@ import org.junit.jupiter.api.Test
  * GROWTHBOOK_CLIENT_KEY.
  */
 public class GrowthBookFeatureFlagsTest {
+    /** Minimal dagger.Lazy wrapper backed by a no-op analytics facade. */
+    private val noOpLazy: dagger.Lazy<AnalyticsFacade> = dagger.Lazy { NoOpAnalyticsFacade() }
+
     @Test
     public fun `truecallerServerVerify defaults to false without features`() {
         // SUT constructed without a live SDK fetch — features map is empty.
-        val sut = GrowthBookFeatureFlags()
+        val sut = GrowthBookFeatureFlags(analytics = noOpLazy)
 
         assertThat(sut.truecallerServerVerify()).isFalse()
     }
 
     @Test
     public fun `GrowthBookFeatureFlags implements FeatureFlags interface`() {
-        val sut: FeatureFlags = GrowthBookFeatureFlags()
+        val sut: FeatureFlags = GrowthBookFeatureFlags(analytics = noOpLazy)
 
         // Interface contract: the result is a Boolean (non-null).
         // Boolean::class.javaObjectType resolves to java.lang.Boolean (the boxed type),
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/flags/PhotoFirstCatalogueFeatureFlagTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/flags/PhotoFirstCatalogueFeatureFlagTest.kt
index af2c07c4..846792bd 100644
--- a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/flags/PhotoFirstCatalogueFeatureFlagTest.kt
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/flags/PhotoFirstCatalogueFeatureFlagTest.kt
@@ -1,5 +1,7 @@
 package com.homeservices.customer.domain.flags
 
+import com.homeservices.customer.observability.analytics.AnalyticsFacade
+import com.homeservices.customer.observability.analytics.NoOpAnalyticsFacade
 import org.assertj.core.api.Assertions.assertThat
 import org.junit.jupiter.api.Test
 
@@ -9,6 +11,8 @@ import org.junit.jupiter.api.Test
  * Verifies the safe-off default for both the BuildConfig and GrowthBook implementations.
  */
 public class PhotoFirstCatalogueFeatureFlagTest {
+    private val noOpLazy: dagger.Lazy<AnalyticsFacade> = dagger.Lazy { NoOpAnalyticsFacade() }
+
     @Test
     public fun `BuildConfigFeatureFlags photoFirstCatalogueEnabled defaults to false`() {
         val sut = BuildConfigFeatureFlags()
@@ -17,13 +21,13 @@ public class PhotoFirstCatalogueFeatureFlagTest {
 
     @Test
     public fun `GrowthBookFeatureFlags photoFirstCatalogueEnabled defaults to false without live SDK`() {
-        val sut = GrowthBookFeatureFlags()
+        val sut = GrowthBookFeatureFlags(analytics = noOpLazy)
         assertThat(sut.photoFirstCatalogueEnabled()).isFalse()
     }
 
     @Test
     public fun `GrowthBookFeatureFlags implements FeatureFlags interface`() {
-        val sut: FeatureFlags = GrowthBookFeatureFlags()
+        val sut: FeatureFlags = GrowthBookFeatureFlags(analytics = noOpLazy)
         assertThat(sut.photoFirstCatalogueEnabled()).isInstanceOf(Boolean::class.javaObjectType)
     }
 }
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command ".\\gradlew.bat :app:compileDebugKotlin --no-daemon --offline" in C:\Alok\Business Projects\Urbanclap-sprint3\customer-app
2026-05-22T20:14:36.481847Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 3.8 seconds
Output:
Exception in thread "main" java.lang.RuntimeException: Could not create parent directory for lock file C:\Users\CodexSandboxOffline\.gradle\wrapper\dists\gradle-8.11-bin\c4te04g51qsyw1bxcb929u7br\gradle-8.11-bin.zip.lck
	at org.gradle.wrapper.GradleWrapperMain.main(SourceFile:65)

 exited 1 in 3802ms:
Exception in thread "main" java.lang.RuntimeException: Could not create parent directory for lock file C:\Users\CodexSandboxOffline\.gradle\wrapper\dists\gradle-8.11-bin\c4te04g51qsyw1bxcb929u7br\gradle-8.11-bin.zip.lck
	at org.gradle.wrapper.GradleWrapperMain.main(SourceFile:65)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$env:GRADLE_USER_HOME='"'C:\\Alok\\Business Projects\\Urbanclap-sprint3\\customer-app\\.gradle-user'; .\\gradlew.bat :app:compileDebugKotlin --no-daemon --offline" in C:\Alok\Business Projects\Urbanclap-sprint3\customer-app
2026-05-22T20:14:48.412934Z ERROR codex_core::tools::router: error=Exit code: 1
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

 exited 1 in 8956ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem C:\\Users\\alokt\\.gradle\\wrapper\\dists\\gradle-8.11-bin -Recurse -Filter gradle.bat -ErrorAction SilentlyContinue | Select-Object -First 5 -ExpandProperty FullName" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 578ms:
C:\Users\alokt\.gradle\wrapper\dists\gradle-8.11-bin\c4te04g51qsyw1bxcb929u7br\gradle-8.11\bin\gradle.bat

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff 8cab4403ef84774eed5790aa789818f6832a7ac3 -- docs/prd.md customer-app/.serena/project.yml customer-app/.serena/.gitignore" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 460ms:
diff --git a/customer-app/.serena/.gitignore b/customer-app/.serena/.gitignore
new file mode 100644
index 00000000..2e510aff
--- /dev/null
+++ b/customer-app/.serena/.gitignore
@@ -0,0 +1,2 @@
+/cache
+/project.local.yml
diff --git a/customer-app/.serena/project.yml b/customer-app/.serena/project.yml
new file mode 100644
index 00000000..9de29246
--- /dev/null
+++ b/customer-app/.serena/project.yml
@@ -0,0 +1,133 @@
+# the name by which the project can be referenced within Serena
+project_name: "customer-app"
+
+
+# list of languages for which language servers are started; choose from:
+#   al                  angular             ansible             bash                clojure
+#   cpp                 cpp_ccls            crystal             csharp              csharp_omnisharp
+#   dart                elixir              elm                 erlang              fortran
+#   fsharp              go                  groovy              haskell             haxe
+#   hlsl                html                java                json                julia
+#   kotlin              lean4               lua                 luau                markdown
+#   matlab              msl                 nix                 ocaml               pascal
+#   perl                php                 php_phpactor        powershell          python
+#   python_jedi         python_ty           r                   rego                ruby
+#   ruby_solargraph     rust                scala               scss                solidity
+#   svelte              swift               systemverilog       terraform           toml
+#   typescript          typescript_vts      vue                 yaml                zig
+#   (This list may be outdated. For the current list, see values of Language enum here:
+#   https://github.com/oraios/serena/blob/main/src/solidlsp/ls_config.py
+#   For some languages, there are alternative language servers, e.g. csharp_omnisharp, ruby_solargraph.)
+# Note:
+#   - For C, use cpp
+#   - For JavaScript, use typescript
+#   - For Angular projects, use angular (subsumes typescript+html; requires `npm install` in the project root)
+#   - For Svelte projects, use svelte (subsumes typescript/javascript for .svelte projects; requires npm)
+#   - For SCSS / Sass / plain CSS, use scss (some-sass-language-server handles all three)
+#   - For Free Pascal/Lazarus, use pascal
+# Special requirements:
+#   Some languages require additional setup/installations.
+#   See here for details: https://oraios.github.io/serena/01-about/020_programming-languages.html#language-servers
+# When using multiple languages, the first language server that supports a given file will be used for that file.
+# The first language is the default language and the respective language server will be used as a fallback.
+# Note that when using the JetBrains backend, language servers are not used and this list is correspondingly ignored.
+languages:
+- java
+
+# the encoding used by text files in the project
+# For a list of possible encodings, see https://docs.python.org/3.11/library/codecs.html#standard-encodings
+encoding: "utf-8"
+
+# line ending convention to use when writing source files.
+# Possible values: unset (use global setting), "lf", "crlf", or "native" (platform default)
+# This does not affect Serena's own files (e.g. memories and configuration files), which always use native line endings.
+line_ending:
+
+# The language backend to use for this project.
+# If not set, the global setting from serena_config.yml is used.
+# Valid values: LSP, JetBrains
+# Note: the backend is fixed at startup. If a project with a different backend
+# is activated post-init, an error will be returned.
+language_backend:
+
+# whether to use project's .gitignore files to ignore files
+ignore_all_files_in_gitignore: true
+
+# advanced configuration option allowing to configure language server-specific options.
+# Maps the language key to the options.
+# Have a look at the docstring of the constructors of the LS implementations within solidlsp (e.g., for C# or PHP) to see which options are available.
+# No documentation on options means no options are available.
+ls_specific_settings: {}
+
+# list of additional workspace folder paths for cross-package reference support (e.g. in monorepos).
+# Paths can be absolute or relative to the project root.
+# Each folder is registered as an LSP workspace folder, enabling language servers to discover
+# symbols and references across package boundaries.
+# Currently supported for: TypeScript.
+# Example:
+#   additional_workspace_folders:
+#     - ../sibling-package
+#     - ../shared-lib
+additional_workspace_folders: []
+
+# list of additional paths to ignore in this project.
+# Same syntax as gitignore, so you can use * and **.
+# Note: global ignored_paths from serena_config.yml are also applied additively.
+ignored_paths: []
+
+# whether the project is in read-only mode
+# If set to true, all editing tools will be disabled and attempts to use them will result in an error
+# Added on 2025-04-18
+read_only: false
+
+# list of tool names to exclude.
+# This extends the existing exclusions (e.g. from the global configuration)
+# Find the list of tools here: https://oraios.github.io/serena/01-about/035_tools.html
+excluded_tools: []
+
+# list of tools to include that would otherwise be disabled (particularly optional tools that are disabled by default).
+# This extends the existing inclusions (e.g. from the global configuration).
+# Find the list of tools here: https://oraios.github.io/serena/01-about/035_tools.html
+included_optional_tools: []
+
+# fixed set of tools to use as the base tool set (if non-empty), replacing Serena's default set of tools.
+# This cannot be combined with non-empty excluded_tools or included_optional_tools.
+# Find the list of tools here: https://oraios.github.io/serena/01-about/035_tools.html
+fixed_tools: []
+
+# list of mode names that are to be activated by default, overriding the setting in the global configuration.
+# The full set of modes to be activated is base_modes (from global config) + default_modes + added_modes.
+# If the setting is undefined/empty, the default_modes from the global configuration (serena_config.yml) apply.
+# Otherwise, this overrides the setting from the global configuration (serena_config.yml).
+# Therefore, you can set this to [] if you do not want the default modes defined in the global config to apply
+# for this project.
+# This setting can, in turn, be overridden by CLI parameters (--mode).
+# See https://oraios.github.io/serena/02-usage/050_configuration.html#modes
+default_modes:
+
+# list of mode names to be activated additionally for this project, e.g. ["query-projects"]
+# The full set of modes to be activated is base_modes (from global config) + default_modes + added_modes.
+# See https://oraios.github.io/serena/02-usage/050_configuration.html#modes
+added_modes:
+
+# initial prompt for the project. It will always be given to the LLM upon activating the project
+# (contrary to the memories, which are loaded on demand).
+initial_prompt: ""
+
+# time budget (seconds) per tool call for the retrieval of additional symbol information
+# such as docstrings or parameter information.
+# This overrides the corresponding setting in the global configuration; see the documentation there.
+# If null or missing, use the setting from the global configuration.
+symbol_info_budget:
+
+# list of regex patterns which, when matched, mark a memory entry as read‑only.
+# Extends the list from the global configuration, merging the two lists.
+read_only_memory_patterns: []
+
+# list of regex patterns for memories to completely ignore.
+# Matching memories will not appear in list_memories or activate_project output
+# and cannot be accessed via read_memory or write_memory.
+# To access ignored memory files, use the read_file tool on the raw file path.
+# Extends the list from the global configuration, merging the two lists.
+# Example: ["_archive/.*", "_episodes/.*"]
+ignored_memory_patterns: []
diff --git a/docs/prd.md b/docs/prd.md
index e2ff0bd0..a99cf3d8 100644
--- a/docs/prd.md
+++ b/docs/prd.md
@@ -92,6 +92,18 @@ The platform is built solo by the founder using BMAD + Claude Code on Firebase +
 
 ## Success Criteria
 
+### Pilot Exit Gates (Binary — all 5 must pass to graduate from soft-launch)
+
+| Gate | Threshold | Measurement |
+|---|---|---|
+| Crash-free sessions | ≥ 99.5% over 7-day rolling window, ≥ 100 sessions | Firebase Crashlytics (crash-free users %) |
+| Booking success rate | ≥ 90% (PAID or CASH_BOOKING_CREATED events / BookingSummaryScreen attempts) | PostHog funnel |
+| Payment success rate | ≥ 92% (Razorpay successful captures / initiations, excluding user-cancelled) | PostHog + Razorpay dashboard |
+| p50 time-to-first-booking | ≤ 3 minutes (PostHog funnel: app_open → booking_confirmed, new users only) | PostHog funnel |
+| Net Promoter Score | ≥ 30 from ≥ 15 soft-launch users (2-question in-app survey after first booking) | Manual survey via PostHog feature flag gate |
+
+> These are the PRD-05 pilot acceptance criteria. All 5 gates must be green for ≥ 7 consecutive days before graduating to public launch. Source: customer-app prod-readiness audit 2026-05-21 (lens 9 proposal, confirmed by owner).
+
 ### User Success
 
 **Customer-side metrics:**
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$files=@('"'customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentUiState.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentViewModel.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/DpdpConsentScreen.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/PostHogAnalyticsFacade.kt'); foreach("'$f in $files){ Write-Output "--- $f"; $i=1; Get-Content $f | ForEach-Object { if($i -ge 1 -and $i -le 120){ '"'{0,4}: {1}' -f "'$i,$_}; $i++ } }' in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 713ms:
--- customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt
   1: package com.homeservices.customer
   2: 
   3: import android.app.Application
   4: import androidx.appcompat.app.AppCompatDelegate
   5: import androidx.core.os.LocaleListCompat
   6: import com.google.android.libraries.places.api.Places
   7: import com.homeservices.customer.domain.consent.ConsentRepository
   8: import com.homeservices.customer.domain.consent.ConsentState
   9: import com.homeservices.customer.domain.flags.GrowthBookFeatureFlags
  10: import com.homeservices.customer.domain.locale.LocaleRepository
  11: import com.homeservices.customer.firebase.CustomerFirebaseMessagingService
  12: import com.homeservices.customer.observability.SentryInitializer
  13: import com.homeservices.customer.observability.analytics.PostHogAnalyticsFacade
  14: import dagger.hilt.EntryPoint
  15: import dagger.hilt.InstallIn
  16: import dagger.hilt.android.EntryPointAccessors
  17: import dagger.hilt.android.HiltAndroidApp
  18: import dagger.hilt.components.SingletonComponent
  19: import kotlinx.coroutines.CoroutineScope
  20: import kotlinx.coroutines.Dispatchers
  21: import kotlinx.coroutines.SupervisorJob
  22: import kotlinx.coroutines.TimeoutCancellationException
  23: import kotlinx.coroutines.flow.first
  24: import kotlinx.coroutines.launch
  25: import kotlinx.coroutines.withTimeout
  26: 
  27: private const val CONSENT_INIT_TIMEOUT_MS = 5_000L
  28: 
  29: @HiltAndroidApp
  30: public class HomeservicesCustomerApplication : Application() {
  31:     @EntryPoint
  32:     @InstallIn(SingletonComponent::class)
  33:     public interface LocaleEntryPoint {
  34:         public fun localeRepository(): LocaleRepository
  35:     }
  36: 
  37:     @EntryPoint
  38:     @InstallIn(SingletonComponent::class)
  39:     public interface FeatureFlagsEntryPoint {
  40:         public fun growthBookFeatureFlags(): GrowthBookFeatureFlags
  41:     }
  42: 
  43:     @EntryPoint
  44:     @InstallIn(SingletonComponent::class)
  45:     public interface AnalyticsEntryPoint {
  46:         public fun postHogAnalyticsFacade(): PostHogAnalyticsFacade
  47: 
  48:         public fun consentRepository(): ConsentRepository
  49:     }
  50: 
  51:     override fun onCreate() {
  52:         super.onCreate()
  53:         SentryInitializer.init(this)
  54:         CustomerFirebaseMessagingService.registerChannels(this)
  55:         if (BuildConfig.MAPS_API_KEY.isNotBlank()) {
  56:             Places.initializeWithNewPlacesApiEnabled(this, BuildConfig.MAPS_API_KEY)
  57:         }
  58: 
  59:         // Best-effort async flag refresh â€” non-blocking, fire-and-forget.
  60:         // Uses a SupervisorJob so a failure here never propagates to sibling coroutines.
  61:         CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
  62:             EntryPointAccessors
  63:                 .fromApplication(this@HomeservicesCustomerApplication, FeatureFlagsEntryPoint::class.java)
  64:                 .growthBookFeatureFlags()
  65:                 .refreshAsync()
  66:         }
  67: 
  68:         // Apply persisted locale BEFORE first Activity onCreate so the initial frame uses correct strings.
  69:         // EntryPoint pattern is used because Application is not @AndroidEntryPoint and cannot @Inject directly.
  70:         val entryPoint = EntryPointAccessors.fromApplication(this, LocaleEntryPoint::class.java)
  71:         val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
  72:         scope.launch {
  73:             val tag = entryPoint.localeRepository().currentLocale.first()
  74:             AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
  75:         }
  76: 
  77:         // Gate PostHog init on user's analytics consent (DPDP Act 2023 / NFR-C-5).
  78:         // Fire-and-forget: failures here must never propagate to sibling coroutines.
  79:         CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
  80:             val analyticsEntryPoint =
  81:                 EntryPointAccessors
  82:                     .fromApplication(this@HomeservicesCustomerApplication, AnalyticsEntryPoint::class.java)
  83:             val analyticsOptIn =
  84:                 try {
  85:                     withTimeout(CONSENT_INIT_TIMEOUT_MS) {
  86:                         analyticsEntryPoint
  87:                             .consentRepository()
  88:                             .consentState
  89:                             .first()
  90:                             .let { it is ConsentState.Granted && it.analyticsOptIn }
  91:                     }
  92:                 } catch (e: TimeoutCancellationException) {
  93:                     io.sentry.Sentry.addBreadcrumb(
  94:                         io.sentry.Breadcrumb.info("PostHog init skipped â€” consent state unavailable after 5s: ${e.message}"),
  95:                     )
  96:                     false // default to no-op if consent state not available
  97:                 }
  98:             analyticsEntryPoint.postHogAnalyticsFacade().initIfConsented(analyticsOptIn)
  99:         }
 100:     }
 101: }
--- customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentUiState.kt
   1: package com.homeservices.customer.ui.consent
   2: 
   3: public data class ConsentUiState(
   4:     val analyticsOptIn: Boolean = true,
   5:     val crashOptIn: Boolean = true,
   6:     val marketingOptIn: Boolean = false,
   7:     val isLoading: Boolean = false,
   8:     val error: String? = null,
   9: )
--- customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentViewModel.kt
   1: package com.homeservices.customer.ui.consent
   2: 
   3: import androidx.lifecycle.ViewModel
   4: import androidx.lifecycle.viewModelScope
   5: import com.homeservices.customer.domain.consent.GrantConsentUseCase
   6: import com.homeservices.customer.domain.consent.IsConsentRequiredUseCase
   7: import dagger.hilt.android.lifecycle.HiltViewModel
   8: import kotlinx.coroutines.CancellationException
   9: import kotlinx.coroutines.channels.Channel
  10: import kotlinx.coroutines.flow.Flow
  11: import kotlinx.coroutines.flow.MutableStateFlow
  12: import kotlinx.coroutines.flow.StateFlow
  13: import kotlinx.coroutines.flow.asStateFlow
  14: import kotlinx.coroutines.flow.receiveAsFlow
  15: import kotlinx.coroutines.flow.update
  16: import kotlinx.coroutines.launch
  17: import javax.inject.Inject
  18: 
  19: @HiltViewModel
  20: public class ConsentViewModel
  21:     @Inject
  22:     constructor(
  23:         private val grantConsentUseCase: GrantConsentUseCase,
  24:         @Suppress("UnusedPrivateMember")
  25:         private val isConsentRequiredUseCase: IsConsentRequiredUseCase,
  26:     ) : ViewModel() {
  27:         private val _uiState = MutableStateFlow(ConsentUiState())
  28:         public val uiState: StateFlow<ConsentUiState> = _uiState.asStateFlow()
  29: 
  30:         private val _navigateNext = Channel<Unit>(Channel.BUFFERED)
  31:         public val navigateNext: Flow<Unit> = _navigateNext.receiveAsFlow()
  32: 
  33:         public fun toggleAnalytics(value: Boolean) {
  34:             _uiState.update { it.copy(analyticsOptIn = value) }
  35:         }
  36: 
  37:         public fun toggleCrash(value: Boolean) {
  38:             _uiState.update { it.copy(crashOptIn = value) }
  39:         }
  40: 
  41:         public fun toggleMarketing(value: Boolean) {
  42:             _uiState.update { it.copy(marketingOptIn = value) }
  43:         }
  44: 
  45:         @Suppress("TooGenericExceptionCaught")
  46:         public fun onConfirm() {
  47:             val state = _uiState.value
  48:             viewModelScope.launch {
  49:                 _uiState.update { it.copy(isLoading = true, error = null) }
  50:                 try {
  51:                     grantConsentUseCase(
  52:                         analyticsOptIn = state.analyticsOptIn,
  53:                         crashOptIn = state.crashOptIn,
  54:                         marketingOptIn = state.marketingOptIn,
  55:                     )
  56:                     _navigateNext.send(Unit)
  57:                 } catch (e: CancellationException) {
  58:                     throw e
  59:                 } catch (e: Exception) {
  60:                     _uiState.update { it.copy(error = e.message ?: "Unknown error") }
  61:                 } finally {
  62:                     _uiState.update { it.copy(isLoading = false) }
  63:                 }
  64:             }
  65:         }
  66: 
  67:         @Suppress("TooGenericExceptionCaught")
  68:         public fun onDeclineAll() {
  69:             viewModelScope.launch {
  70:                 _uiState.update { it.copy(isLoading = true, error = null) }
  71:                 try {
  72:                     grantConsentUseCase(
  73:                         analyticsOptIn = false,
  74:                         crashOptIn = false,
  75:                         marketingOptIn = false,
  76:                     )
  77:                     _navigateNext.send(Unit)
  78:                 } catch (e: CancellationException) {
  79:                     throw e
  80:                 } catch (e: Exception) {
  81:                     _uiState.update { it.copy(error = e.message ?: "Unknown error") }
  82:                 } finally {
  83:                     _uiState.update { it.copy(isLoading = false) }
  84:                 }
  85:             }
  86:         }
  87:     }
--- customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/DpdpConsentScreen.kt
   1: package com.homeservices.customer.ui.consent
   2: 
   3: import androidx.compose.foundation.background
   4: import androidx.compose.foundation.layout.Arrangement
   5: import androidx.compose.foundation.layout.Box
   6: import androidx.compose.foundation.layout.Column
   7: import androidx.compose.foundation.layout.Row
   8: import androidx.compose.foundation.layout.Spacer
   9: import androidx.compose.foundation.layout.fillMaxHeight
  10: import androidx.compose.foundation.layout.fillMaxSize
  11: import androidx.compose.foundation.layout.fillMaxWidth
  12: import androidx.compose.foundation.layout.height
  13: import androidx.compose.foundation.layout.offset
  14: import androidx.compose.foundation.layout.padding
  15: import androidx.compose.foundation.layout.size
  16: import androidx.compose.foundation.layout.statusBarsPadding
  17: import androidx.compose.foundation.layout.width
  18: import androidx.compose.foundation.rememberScrollState
  19: import androidx.compose.foundation.shape.CircleShape
  20: import androidx.compose.foundation.shape.RoundedCornerShape
  21: import androidx.compose.foundation.text.BasicText
  22: import androidx.compose.foundation.verticalScroll
  23: import androidx.compose.material.icons.Icons
  24: import androidx.compose.material.icons.filled.BarChart
  25: import androidx.compose.material.icons.filled.Eco
  26: import androidx.compose.material.icons.filled.Notifications
  27: import androidx.compose.material.icons.filled.Security
  28: import androidx.compose.material3.Button
  29: import androidx.compose.material3.ButtonDefaults
  30: import androidx.compose.material3.CircularProgressIndicator
  31: import androidx.compose.material3.HorizontalDivider
  32: import androidx.compose.material3.Icon
  33: import androidx.compose.material3.MaterialTheme
  34: import androidx.compose.material3.Surface
  35: import androidx.compose.material3.Switch
  36: import androidx.compose.material3.SwitchDefaults
  37: import androidx.compose.material3.Text
  38: import androidx.compose.material3.TextButton
  39: import androidx.compose.runtime.Composable
  40: import androidx.compose.runtime.LaunchedEffect
  41: import androidx.compose.runtime.getValue
  42: import androidx.compose.ui.Alignment
  43: import androidx.compose.ui.Modifier
  44: import androidx.compose.ui.draw.drawBehind
  45: import androidx.compose.ui.geometry.Offset
  46: import androidx.compose.ui.graphics.Brush
  47: import androidx.compose.ui.graphics.Color
  48: import androidx.compose.ui.graphics.vector.ImageVector
  49: import androidx.compose.ui.text.LinkAnnotation
  50: import androidx.compose.ui.text.SpanStyle
  51: import androidx.compose.ui.text.TextLinkStyles
  52: import androidx.compose.ui.text.TextStyle
  53: import androidx.compose.ui.text.buildAnnotatedString
  54: import androidx.compose.ui.text.font.FontWeight
  55: import androidx.compose.ui.text.style.TextAlign
  56: import androidx.compose.ui.text.style.TextDecoration
  57: import androidx.compose.ui.text.withLink
  58: import androidx.compose.ui.text.withStyle
  59: import androidx.compose.ui.unit.dp
  60: import androidx.compose.ui.unit.sp
  61: import androidx.hilt.navigation.compose.hiltViewModel
  62: import androidx.lifecycle.compose.collectAsStateWithLifecycle
  63: import kotlinx.coroutines.flow.collectLatest
  64: 
  65: // â”€â”€ Design tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  66: private val HeroBg = Color(0xFF0B3D2E)
  67: private val HeroBgDark = Color(0xFF062A20)
  68: private val ScreenBgLight = Color(0xFFFBF7EF)
  69: private val ScreenBgDark = Color(0xFF0D1A16)
  70: private val CardBgLight = Color.White
  71: private val CardBgDark = Color(0xFF1A2E24)
  72: private val DividerLight = Color(0xFFEDE8E3)
  73: private val DividerDark = Color(0xFF2A3E34)
  74: private val TextMuted = Color(0xFF5F6C66)
  75: private val TextOnDarkMuted = Color(0xFF8FA899)
  76: private val TextOnDark = Color(0xFFE8F1EC)
  77: private val BrandGreen = Color(0xFF0B3D2E)
  78: private val SwitchCheckedThumb = Color(0xFF0B3D2E)
  79: private val SwitchCheckedTrack = Color(0xFFC8E6C9)
  80: private val SwitchUncheckedTrack = Color(0xFFE0E0E0)
  81: 
  82: private val AnalyticsBg = Color(0xFFE8F5E8)
  83: private val AnalyticsTint = Color(0xFF0B3D2E)
  84: private val CrashBg = Color(0xFFE8EDF5)
  85: private val CrashTint = Color(0xFF1A4B8C)
  86: private val MarketingBg = Color(0xFFFFF3E0)
  87: private val MarketingTint = Color(0xFFE65100)
  88: 
  89: private const val HERO_FRACTION = 0.40f
  90: private const val PRIVACY_POLICY_URL = "https://homeservices.app/privacy"
  91: 
  92: // â”€â”€ Layout & spacing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  93: private const val HERO_ICON_SIZE_DP = 72
  94: private const val HERO_ICON_INNER_SIZE_DP = 36
  95: private const val HERO_SPACING_DP = 12
  96: private const val HERO_PADDING_DP = 24
  97: private const val HERO_SUBTITLE_ALPHA = 0.70f
  98: private const val HERO_DARK_MODE_THRESHOLD = 0.5f
  99: private const val CARD_OVERLAP_DP = 20
 100: private const val CARD_CORNER_RADIUS_DP = 24
 101: private const val CARD_TOP_PADDING_DP = 28
 102: private const val CARD_SIDE_PADDING_DP = 20
 103: private const val CARD_BOTTOM_PADDING_DP = 20
 104: private const val CARD_SHADOW_ELEVATION_DP = 4
 105: private const val CONSENT_SECTION_TITLE_FONT_SIZE = 26
 106: private const val CONSENT_TITLE_SIZE_DP = 16
 107: private const val CONSENT_DESCRIPTION_SIZE_DP = 14
 108: private const val CONSENT_SMALL_TEXT_SIZE_DP = 12
 109: private const val DIVIDER_THICKNESS_DP = 1
 110: private const val DIVIDER_PADDING_DP = 4
 111: private const val TOGGLE_ROW_PADDING_DP = 10
 112: private const val TOGGLE_ROW_SPACING_DP = 12
 113: private const val TOGGLE_ICON_SIZE_DP = 44
 114: private const val TOGGLE_ICON_RADIUS_DP = 12
 115: private const val TOGGLE_ICON_INNER_SIZE_DP = 22
 116: private const val TOGGLE_TEXT_TITLE_FONT_SIZE = 14
 117: private const val TOGGLE_TEXT_SPACING_DP = 2
 118: private const val CTA_HEIGHT_DP = 56
 119: private const val CTA_CORNER_RADIUS_DP = 16
 120: private const val CTA_DISABLED_ALPHA = 0.50f
--- customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt
   1: package com.homeservices.customer.navigation
   2: 
   3: import android.Manifest
   4: import android.content.Context
   5: import android.content.pm.PackageManager
   6: import android.os.Build
   7: import androidx.activity.compose.rememberLauncherForActivityResult
   8: import androidx.activity.result.ActivityResultLauncher
   9: import androidx.activity.result.contract.ActivityResultContracts
  10: import androidx.compose.foundation.layout.fillMaxSize
  11: import androidx.compose.material3.MaterialTheme
  12: import androidx.compose.material3.Surface
  13: import androidx.compose.runtime.Composable
  14: import androidx.compose.runtime.DisposableEffect
  15: import androidx.compose.runtime.LaunchedEffect
  16: import androidx.compose.runtime.getValue
  17: import androidx.compose.ui.Modifier
  18: import androidx.compose.ui.platform.LocalContext
  19: import androidx.core.content.ContextCompat
  20: import androidx.fragment.app.FragmentActivity
  21: import androidx.lifecycle.compose.collectAsStateWithLifecycle
  22: import androidx.navigation.NavController
  23: import androidx.navigation.compose.NavHost
  24: import androidx.navigation.compose.composable
  25: import androidx.navigation.compose.rememberNavController
  26: import com.homeservices.corenav.DeepLinkUri
  27: import com.homeservices.corenav.PendingActionStatus
  28: import com.homeservices.customer.data.auth.SessionManager
  29: import com.homeservices.customer.data.pendingaction.PendingActionStore
  30: import com.homeservices.customer.domain.auth.model.AuthState
  31: import com.homeservices.customer.domain.consent.IsConsentRequiredUseCase
  32: import com.homeservices.customer.domain.flags.FeatureFlags
  33: import com.homeservices.customer.domain.locale.IsFirstLaunchUseCase
  34: import com.homeservices.customer.observability.SentryContextBinder
  35: import com.homeservices.customer.ui.consent.DpdpConsentScreen
  36: import com.homeservices.customer.ui.locale.FirstLaunchLanguageScreen
  37: import com.homeservices.customer.ui.rating.RatingRoutes
  38: 
  39: public object LocaleRoutes {
  40:     public const val FIRST_LAUNCH: String = "first_launch_language"
  41:     public const val SETTINGS: String = "settings"
  42:     public const val LANGUAGE_SETTINGS: String = "language_settings"
  43:     public const val PRIVACY_AND_DATA: String = "privacy_data"
  44:     public const val PRIVACY_DATA: String = "privacy_data"
  45:     public const val DATA_EXPORT: String = "data_export"
  46: 
  47:     // DELETE_ACCOUNT routes added by E15-S02 (Stream 2.4) â€” populated by that branch.
  48:     public const val DELETE_ACCOUNT: String = "delete_account"
  49:     public const val DELETE_ACCOUNT_CONFIRM: String = "delete_account_confirm"
  50:     public const val DELETE_ACCOUNT_COOL_OFF: String = "delete_account_cool_off"
  51: 
  52:     // DPDP consent gate (WS-D) â€” shown on first launch before locale picker,
  53:     // and accessible from Settings â†’ Privacy & data â†’ Manage consent.
  54:     public const val DPDP_CONSENT: String = "dpdp_consent"
  55: 
  56:     // Consent management route wired in SettingsGraph (revoke / update consent).
  57:     public const val CONSENT_MANAGEMENT: String = "consent_management"
  58: }
  59: 
  60: /**
  61:  * Root navigation composable for the customer-app.
  62:  *
  63:  * E11-S01b-1 additive parameters:
  64:  *   - [routeResolver]: used by future deep-link handling; currently wired but not yet
  65:  *     consumed in the composable body (full consumption in E11-S01b-2 route migration).
  66:  *   - [initialDeepLink]: `homeservices://action/<TYPE>?entityId=<id>` URI extracted from
  67:  *     the launching Intent by [MainActivity]. Consumed on first composition to navigate
  68:  *     to the action's destination after auth check.
  69:  *
  70:  * E11-S01b-2: PriceApprovalEventBus and RatingPromptEventBus parameters removed.
  71:  * Navigation is now driven by Room-observed [PendingActionStore] rows via
  72:  * [PendingActionsNavEffect]. The FCM service still posts to the legacy event buses
  73:  * as a fallback (see [CustomerFirebaseMessagingService]), but AppNavigation no
  74:  * longer depends on them â€” it observes the Room table directly.
  75:  *
  76:  * Stream 2.6 (Sentry breadcrumbs) note: signature extended with named parameters with
  77:  * defaults â€” existing call sites compile unchanged.
  78:  */
  79: @Composable
  80: internal fun AppNavigation(
  81:     sessionManager: SessionManager,
  82:     activity: FragmentActivity,
  83:     pendingActionStore: PendingActionStore,
  84:     isFirstLaunch: IsFirstLaunchUseCase,
  85:     isConsentRequired: IsConsentRequiredUseCase,
  86:     featureFlags: FeatureFlags,
  87:     modifier: Modifier = Modifier,
  88:     routeResolver: CustomerRouteResolver? = null,
  89:     initialDeepLink: String? = null,
  90: ) {
  91:     // Both booleans start as null (loading) so no screen flashes before DataStore emits.
  92:     // We hold the blank Surface until BOTH emit â€” prevents consent/onboarding race.
  93:     val firstLaunchPending: Boolean? =
  94:         isFirstLaunch().collectAsStateWithLifecycle(initialValue = null as Boolean?).value
  95:     val consentRequired: Boolean? =
  96:         isConsentRequired().collectAsStateWithLifecycle(initialValue = null as Boolean?).value
  97: 
  98:     if (firstLaunchPending == null || consentRequired == null) {
  99:         Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {}
 100:         return
 101:     }
 102: 
 103:     AppNavigationReady(
 104:         sessionManager = sessionManager,
 105:         activity = activity,
 106:         pendingActionStore = pendingActionStore,
 107:         featureFlags = featureFlags,
 108:         firstLaunchPending = firstLaunchPending,
 109:         consentRequired = consentRequired,
 110:         modifier = modifier,
 111:         routeResolver = routeResolver,
 112:         initialDeepLink = initialDeepLink,
 113:     )
 114: }
 115: 
 116: /**
 117:  * Inner composable rendered once [firstLaunchPending] has emitted a non-null value.
 118:  *
 119:  * Extracted from [AppNavigation] to satisfy detekt LongMethod and CyclomaticComplexMethod
 120:  * limits â€” the outer function handles the loading gate only; all navigation wiring lives here.
--- customer-app/app/src/main/kotlin/com/homeservices/customer/observability/analytics/PostHogAnalyticsFacade.kt
   1: package com.homeservices.customer.observability.analytics
   2: 
   3: import android.content.Context
   4: import com.homeservices.customer.di.BuildInfoProvider
   5: import com.posthog.PostHog
   6: import com.posthog.android.PostHogAndroid
   7: import com.posthog.android.PostHogAndroidConfig
   8: import dagger.hilt.android.qualifiers.ApplicationContext
   9: import java.util.concurrent.atomic.AtomicBoolean
  10: import javax.inject.Inject
  11: import javax.inject.Singleton
  12: 
  13: @Singleton
  14: public class PostHogAnalyticsFacade
  15:     @Inject
  16:     constructor(
  17:         @ApplicationContext private val context: Context,
  18:         private val buildInfoProvider: BuildInfoProvider,
  19:     ) : AnalyticsFacade {
  20:         private val posthogInitialized = AtomicBoolean(false)
  21: 
  22:         /**
  23:          * Initializes PostHog if [analyticsOptIn] is true and initialization has not yet occurred.
  24:          * Skips silently when the API key is blank (CI / local dev without a key).
  25:          * Safe to call multiple times â€” only the first call with [analyticsOptIn]=true takes effect.
  26:          * Thread-safe: uses compareAndSet to prevent double-initialization under concurrent calls.
  27:          */
  28:         public fun initIfConsented(analyticsOptIn: Boolean) {
  29:             if (!analyticsOptIn || !posthogInitialized.compareAndSet(false, true)) return
  30:             val apiKey = buildInfoProvider.postHogApiKey
  31:             if (apiKey.isBlank()) {
  32:                 posthogInitialized.set(false) // allow retry if key becomes available
  33:                 return
  34:             }
  35:             PostHogAndroid.setup(context, PostHogAndroidConfig(apiKey, "https://app.posthog.com"))
  36:         }
  37: 
  38:         override fun track(
  39:             event: String,
  40:             properties: Map<String, Any>,
  41:         ) {
  42:             if (!posthogInitialized.get()) return
  43:             runCatching {
  44:                 PostHog.capture(event, properties = properties)
  45:             }
  46:         }
  47: 
  48:         override fun identify(
  49:             userId: String,
  50:             traits: Map<String, Any>,
  51:         ) {
  52:             if (!posthogInitialized.get()) return
  53:             runCatching {
  54:                 PostHog.identify(userId, userProperties = traits)
  55:             }
  56:         }
  57: 
  58:         override fun reset() {
  59:             if (!posthogInitialized.get()) return
  60:             runCatching {
  61:                 PostHog.reset()
  62:             }
  63:         }
  64:     }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt'; "'$i=1; Get-Content $f | ForEach-Object { if($i -ge 121 -and $i -le 230){ '"'{0,4}: {1}' -f "'$i,$_}; $i++ }' in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 572ms:
 121:  */
 122: @Suppress("LongMethod")
 123: @Composable
 124: private fun AppNavigationReady(
 125:     sessionManager: SessionManager,
 126:     activity: FragmentActivity,
 127:     pendingActionStore: PendingActionStore,
 128:     featureFlags: FeatureFlags,
 129:     firstLaunchPending: Boolean,
 130:     consentRequired: Boolean,
 131:     modifier: Modifier,
 132:     routeResolver: CustomerRouteResolver?,
 133:     initialDeepLink: String?,
 134: ) {
 135:     val context = LocalContext.current
 136:     val authState by sessionManager.authState.collectAsStateWithLifecycle()
 137:     val navController = rememberNavController()
 138:     // Consent gate wins over locale picker; both win over auth.
 139:     val startDestination =
 140:         when {
 141:             consentRequired -> LocaleRoutes.DPDP_CONSENT
 142:             firstLaunchPending -> LocaleRoutes.FIRST_LAUNCH
 143:             else -> ROUTE_AUTH
 144:         }
 145:     val notificationPermissionLauncher =
 146:         rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}
 147: 
 148:     AuthStateEffect(
 149:         authState = authState,
 150:         firstLaunchPending = firstLaunchPending,
 151:         consentRequired = consentRequired,
 152:         context = context,
 153:         navController = navController,
 154:         notificationPermissionLauncher = notificationPermissionLauncher,
 155:     )
 156:     PendingActionsNavEffect(
 157:         authState = authState,
 158:         pendingActionStore = pendingActionStore,
 159:         navController = navController,
 160:     )
 161:     SentryEffects(sessionManager = sessionManager, navController = navController)
 162:     if (initialDeepLink != null && !firstLaunchPending) {
 163:         DeepLinkEffect(
 164:             initialDeepLink = initialDeepLink,
 165:             authState = authState,
 166:             routeResolver = routeResolver,
 167:             navController = navController,
 168:         )
 169:     }
 170: 
 171:     NavHost(navController = navController, startDestination = startDestination, modifier = modifier) {
 172:         // DPDP consent gate â€” shown when consent is required before first-launch locale picker.
 173:         // On completion, navigates to locale picker if needed, otherwise straight to auth.
 174:         composable(LocaleRoutes.DPDP_CONSENT) {
 175:             DpdpConsentScreen(
 176:                 onConsentComplete = {
 177:                     val next = if (firstLaunchPending) LocaleRoutes.FIRST_LAUNCH else ROUTE_AUTH
 178:                     navController.navigate(next) {
 179:                         popUpTo(LocaleRoutes.DPDP_CONSENT) { inclusive = true }
 180:                         launchSingleTop = true
 181:                     }
 182:                 },
 183:             )
 184:         }
 185:         composable(LocaleRoutes.FIRST_LAUNCH) {
 186:             FirstLaunchLanguageScreen(
 187:                 onConfirmed = {
 188:                     navController.navigate(ROUTE_AUTH) {
 189:                         popUpTo(LocaleRoutes.FIRST_LAUNCH) { inclusive = true }
 190:                         launchSingleTop = true
 191:                     }
 192:                 },
 193:             )
 194:         }
 195:         authGraph(navController, activity)
 196:         mainGraph(navController, featureFlags)
 197:         settingsGraph(navController, featureFlags)
 198:     }
 199: }
 200: 
 201: /**
 202:  * Reacts to [authState] changes: navigates to main/auth, subscribes/unsubscribes FCM topic,
 203:  * and requests notification permission on first sign-in.
 204:  */
 205: @Composable
 206: private fun AuthStateEffect(
 207:     authState: AuthState,
 208:     firstLaunchPending: Boolean,
 209:     consentRequired: Boolean,
 210:     context: Context,
 211:     navController: NavController,
 212:     notificationPermissionLauncher: ActivityResultLauncher<String>,
 213: ) {
 214:     LaunchedEffect(authState, firstLaunchPending, consentRequired) {
 215:         if (firstLaunchPending || consentRequired) return@LaunchedEffect
 216:         when (val currentAuth = authState) {
 217:             is AuthState.Authenticated -> {
 218:                 navController.navigate(ROUTE_MAIN) {
 219:                     // Single pop target: by the time this fires, firstLaunchPending is
 220:                     // false (guarded above) and FirstLaunchLanguageScreen.onConfirmed
 221:                     // has already popped first_launch on its way to auth. Stack: [auth].
 222:                     popUpTo(ROUTE_AUTH) { inclusive = true }
 223:                     launchSingleTop = true
 224:                 }
 225:                 com.google.firebase.messaging.FirebaseMessaging
 226:                     .getInstance()
 227:                     .subscribeToTopic("customer_${currentAuth.uid}")
 228:                 if (!context.hasNotificationPermission()) {
 229:                     notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
 230:                 }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff --unified=0 8cab4403ef84774eed5790aa789818f6832a7ac3 -- customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentViewModel.kt customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentUiState.kt | Select-Object -First 260" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 543ms:
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt
index 5306cdc6..d7d229ac 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt
@@ -6,0 +7,2 @@ import com.google.android.libraries.places.api.Places
+import com.homeservices.customer.domain.consent.ConsentRepository
+import com.homeservices.customer.domain.consent.ConsentState
@@ -10,0 +13 @@ import com.homeservices.customer.observability.SentryInitializer
+import com.homeservices.customer.observability.analytics.PostHogAnalyticsFacade
@@ -18,0 +22 @@ import kotlinx.coroutines.SupervisorJob
+import kotlinx.coroutines.TimeoutCancellationException
@@ -20,0 +25,3 @@ import kotlinx.coroutines.launch
+import kotlinx.coroutines.withTimeout
+
+private const val CONSENT_INIT_TIMEOUT_MS = 5_000L
@@ -35,0 +43,8 @@ public class HomeservicesCustomerApplication : Application() {
+    @EntryPoint
+    @InstallIn(SingletonComponent::class)
+    public interface AnalyticsEntryPoint {
+        public fun postHogAnalyticsFacade(): PostHogAnalyticsFacade
+
+        public fun consentRepository(): ConsentRepository
+    }
+
@@ -60,0 +76,24 @@ public class HomeservicesCustomerApplication : Application() {
+
+        // Gate PostHog init on user's analytics consent (DPDP Act 2023 / NFR-C-5).
+        // Fire-and-forget: failures here must never propagate to sibling coroutines.
+        CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
+            val analyticsEntryPoint =
+                EntryPointAccessors
+                    .fromApplication(this@HomeservicesCustomerApplication, AnalyticsEntryPoint::class.java)
+            val analyticsOptIn =
+                try {
+                    withTimeout(CONSENT_INIT_TIMEOUT_MS) {
+                        analyticsEntryPoint
+                            .consentRepository()
+                            .consentState
+                            .first()
+                            .let { it is ConsentState.Granted && it.analyticsOptIn }
+                    }
+                } catch (e: TimeoutCancellationException) {
+                    io.sentry.Sentry.addBreadcrumb(
+                        io.sentry.Breadcrumb.info("PostHog init skipped — consent state unavailable after 5s: ${e.message}"),
+                    )
+                    false // default to no-op if consent state not available
+                }
+            analyticsEntryPoint.postHogAnalyticsFacade().initIfConsented(analyticsOptIn)
+        }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt
index 0293b252..ab3a6051 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt
@@ -30,0 +31 @@ import com.homeservices.customer.domain.auth.model.AuthState
+import com.homeservices.customer.domain.consent.IsConsentRequiredUseCase
@@ -33,0 +35 @@ import com.homeservices.customer.observability.SentryContextBinder
+import com.homeservices.customer.ui.consent.DpdpConsentScreen
@@ -48,0 +51,7 @@ public object LocaleRoutes {
+
+    // DPDP consent gate (WS-D) — shown on first launch before locale picker,
+    // and accessible from Settings → Privacy & data → Manage consent.
+    public const val DPDP_CONSENT: String = "dpdp_consent"
+
+    // Consent management route wired in SettingsGraph (revoke / update consent).
+    public const val CONSENT_MANAGEMENT: String = "consent_management"
@@ -75,0 +85 @@ internal fun AppNavigation(
+    isConsentRequired: IsConsentRequiredUseCase,
@@ -81,3 +91,2 @@ internal fun AppNavigation(
-    // Initial value is null (loading) so returning users with first_launch_completed=true
-    // never see the picker on cold start. We render a blank Surface until DataStore emits.
-    // Per Codex P2: avoid showing onboarding to returning users while the preference loads.
+    // Both booleans start as null (loading) so no screen flashes before DataStore emits.
+    // We hold the blank Surface until BOTH emit — prevents consent/onboarding race.
@@ -85,0 +95,2 @@ internal fun AppNavigation(
+    val consentRequired: Boolean? =
+        isConsentRequired().collectAsStateWithLifecycle(initialValue = null as Boolean?).value
@@ -87,13 +98,3 @@ internal fun AppNavigation(
-    when (firstLaunchPending) {
-        null -> Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {}
-        else ->
-            AppNavigationReady(
-                sessionManager = sessionManager,
-                activity = activity,
-                pendingActionStore = pendingActionStore,
-                featureFlags = featureFlags,
-                firstLaunchPending = firstLaunchPending,
-                modifier = modifier,
-                routeResolver = routeResolver,
-                initialDeepLink = initialDeepLink,
-            )
+    if (firstLaunchPending == null || consentRequired == null) {
+        Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {}
+        return
@@ -100,0 +102,12 @@ internal fun AppNavigation(
+
+    AppNavigationReady(
+        sessionManager = sessionManager,
+        activity = activity,
+        pendingActionStore = pendingActionStore,
+        featureFlags = featureFlags,
+        firstLaunchPending = firstLaunchPending,
+        consentRequired = consentRequired,
+        modifier = modifier,
+        routeResolver = routeResolver,
+        initialDeepLink = initialDeepLink,
+    )
@@ -108,0 +122 @@ internal fun AppNavigation(
+@Suppress("LongMethod")
@@ -115,0 +130 @@ private fun AppNavigationReady(
+    consentRequired: Boolean,
@@ -123 +138,7 @@ private fun AppNavigationReady(
-    val startDestination = if (firstLaunchPending) LocaleRoutes.FIRST_LAUNCH else ROUTE_AUTH
+    // Consent gate wins over locale picker; both win over auth.
+    val startDestination =
+        when {
+            consentRequired -> LocaleRoutes.DPDP_CONSENT
+            firstLaunchPending -> LocaleRoutes.FIRST_LAUNCH
+            else -> ROUTE_AUTH
+        }
@@ -129,0 +151 @@ private fun AppNavigationReady(
+        consentRequired = consentRequired,
@@ -149,0 +172,13 @@ private fun AppNavigationReady(
+        // DPDP consent gate — shown when consent is required before first-launch locale picker.
+        // On completion, navigates to locale picker if needed, otherwise straight to auth.
+        composable(LocaleRoutes.DPDP_CONSENT) {
+            DpdpConsentScreen(
+                onConsentComplete = {
+                    val next = if (firstLaunchPending) LocaleRoutes.FIRST_LAUNCH else ROUTE_AUTH
+                    navController.navigate(next) {
+                        popUpTo(LocaleRoutes.DPDP_CONSENT) { inclusive = true }
+                        launchSingleTop = true
+                    }
+                },
+            )
+        }
@@ -173,0 +209 @@ private fun AuthStateEffect(
+    consentRequired: Boolean,
@@ -178,2 +214,2 @@ private fun AuthStateEffect(
-    LaunchedEffect(authState, firstLaunchPending) {
-        if (firstLaunchPending) return@LaunchedEffect
+    LaunchedEffect(authState, firstLaunchPending, consentRequired) {
+        if (firstLaunchPending || consentRequired) return@LaunchedEffect
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentUiState.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentUiState.kt
new file mode 100644
index 00000000..e8b94614
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentUiState.kt
@@ -0,0 +1,9 @@
+package com.homeservices.customer.ui.consent
+
+public data class ConsentUiState(
+    val analyticsOptIn: Boolean = true,
+    val crashOptIn: Boolean = true,
+    val marketingOptIn: Boolean = false,
+    val isLoading: Boolean = false,
+    val error: String? = null,
+)
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentViewModel.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentViewModel.kt
new file mode 100644
index 00000000..489958d5
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentViewModel.kt
@@ -0,0 +1,87 @@
+package com.homeservices.customer.ui.consent
+
+import androidx.lifecycle.ViewModel
+import androidx.lifecycle.viewModelScope
+import com.homeservices.customer.domain.consent.GrantConsentUseCase
+import com.homeservices.customer.domain.consent.IsConsentRequiredUseCase
+import dagger.hilt.android.lifecycle.HiltViewModel
+import kotlinx.coroutines.CancellationException
+import kotlinx.coroutines.channels.Channel
+import kotlinx.coroutines.flow.Flow
+import kotlinx.coroutines.flow.MutableStateFlow
+import kotlinx.coroutines.flow.StateFlow
+import kotlinx.coroutines.flow.asStateFlow
+import kotlinx.coroutines.flow.receiveAsFlow
+import kotlinx.coroutines.flow.update
+import kotlinx.coroutines.launch
+import javax.inject.Inject
+
+@HiltViewModel
+public class ConsentViewModel
+    @Inject
+    constructor(
+        private val grantConsentUseCase: GrantConsentUseCase,
+        @Suppress("UnusedPrivateMember")
+        private val isConsentRequiredUseCase: IsConsentRequiredUseCase,
+    ) : ViewModel() {
+        private val _uiState = MutableStateFlow(ConsentUiState())
+        public val uiState: StateFlow<ConsentUiState> = _uiState.asStateFlow()
+
+        private val _navigateNext = Channel<Unit>(Channel.BUFFERED)
+        public val navigateNext: Flow<Unit> = _navigateNext.receiveAsFlow()
+
+        public fun toggleAnalytics(value: Boolean) {
+            _uiState.update { it.copy(analyticsOptIn = value) }
+        }
+
+        public fun toggleCrash(value: Boolean) {
+            _uiState.update { it.copy(crashOptIn = value) }
+        }
+
+        public fun toggleMarketing(value: Boolean) {
+            _uiState.update { it.copy(marketingOptIn = value) }
+        }
+
+        @Suppress("TooGenericExceptionCaught")
+        public fun onConfirm() {
+            val state = _uiState.value
+            viewModelScope.launch {
+                _uiState.update { it.copy(isLoading = true, error = null) }
+                try {
+                    grantConsentUseCase(
+                        analyticsOptIn = state.analyticsOptIn,
+                        crashOptIn = state.crashOptIn,
+                        marketingOptIn = state.marketingOptIn,
+                    )
+                    _navigateNext.send(Unit)
+                } catch (e: CancellationException) {
+                    throw e
+                } catch (e: Exception) {
+                    _uiState.update { it.copy(error = e.message ?: "Unknown error") }
+                } finally {
+                    _uiState.update { it.copy(isLoading = false) }
+                }
+            }
+        }
+
+        @Suppress("TooGenericExceptionCaught")
+        public fun onDeclineAll() {
+            viewModelScope.launch {
+                _uiState.update { it.copy(isLoading = true, error = null) }
+                try {
+                    grantConsentUseCase(
+                        analyticsOptIn = false,
+                        crashOptIn = false,
+                        marketingOptIn = false,
+                    )
+                    _navigateNext.send(Unit)
+                } catch (e: CancellationException) {
+                    throw e
+                } catch (e: Exception) {
+                    _uiState.update { it.copy(error = e.message ?: "Unknown error") }
+                } finally {
+                    _uiState.update { it.copy(isLoading = false) }
+                }
+            }
+        }
+    }
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Path C:\\Users\\alokt\\.gradle\\caches -Recurse -Include '*posthog*' -ErrorAction SilentlyContinue | Select-Object -First 50 FullName,Length" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 29914ms:

FullName                                                                                                               
--------                                                                                                               
C:\Users\alokt\.gradle\caches\8.11\dependencies-accessors\2a7c6a80422f5f86a8b36ae8fec2abecfc59a806\classes\org\gradl...
C:\Users\alokt\.gradle\caches\8.11\dependencies-accessors\2a7c6a80422f5f86a8b36ae8fec2abecfc59a806\classes\org\gradl...
C:\Users\alokt\.gradle\caches\8.11\dependencies-accessors\5a9027f01d30c27d971631c8a61b34d0b28190d0\classes\org\gradl...
C:\Users\alokt\.gradle\caches\8.11\dependencies-accessors\5a9027f01d30c27d971631c8a61b34d0b28190d0\classes\org\gradl...
C:\Users\alokt\.gradle\caches\8.11\dependencies-accessors\793762b17cdd85015be4b3b63c9f5d6f9cd3363f\classes\org\gradl...
C:\Users\alokt\.gradle\caches\8.11\dependencies-accessors\793762b17cdd85015be4b3b63c9f5d6f9cd3363f\classes\org\gradl...
C:\Users\alokt\.gradle\caches\8.11\dependencies-accessors\88c03532ee0017f412c2fcddbeba908d760d95b9\classes\org\gradl...
C:\Users\alokt\.gradle\caches\8.11\dependencies-accessors\88c03532ee0017f412c2fcddbeba908d760d95b9\classes\org\gradl...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-api  
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...
C:\Users\alokt\.gradle\caches\8.11\transforms\05ef799c37d3a988629190bf840ea676\transformed\posthog-android-3.44.1-ap...



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$env:GRADLE_USER_HOME='"'C:\\Users\\alokt\\.gradle'; & 'C:\\Users\\alokt\\.gradle\\wrapper\\dists\\gradle-8.11-bin\\c4te04g51qsyw1bxcb929u7br\\gradle-8.11\\bin\\gradle.bat' :app:compileDebugKotlin --no-daemon --offline" in C:\Alok\Business Projects\Urbanclap-sprint3\customer-app
2026-05-22T20:16:44.382280Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 21.4 seconds
Output:
To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.11/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build 
Calculating task graph as no cached configuration is available for tasks: :app:compileDebugKotlin
Configuration cache entry stored.

 exited 1 in 21353ms:
To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.11/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build 
Calculating task graph as no cached configuration is available for tasks: :app:compileDebugKotlin
Configuration cache entry stored.

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$env:GRADLE_USER_HOME='"'C:\\Users\\alokt\\.gradle'; & 'C:\\Users\\alokt\\.gradle\\wrapper\\dists\\gradle-8.11-bin\\c4te04g51qsyw1bxcb929u7br\\gradle-8.11\\bin\\gradle.bat' :app:compileDebugKotlin --no-daemon --offline --console=plain --stacktrace" in C:\Alok\Business Projects\Urbanclap-sprint3\customer-app
2026-05-22T20:17:09.505208Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 20.2 seconds
Output:
To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.11/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build 
Calculating task graph as no cached configuration is available for tasks: :app:compileDebugKotlin
Configuration cache entry stored.

 exited 1 in 20243ms:
To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.11/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build 
Calculating task graph as no cached configuration is available for tasks: :app:compileDebugKotlin
Configuration cache entry stored.

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$env:GRADLE_USER_HOME='"'C:\\Users\\alokt\\.gradle'; & 'C:\\Users\\alokt\\.gradle\\wrapper\\dists\\gradle-8.11-bin\\c4te04g51qsyw1bxcb929u7br\\gradle-8.11\\bin\\gradle.bat' --version --no-daemon --console=plain" in C:\Alok\Business Projects\Urbanclap-sprint3\customer-app
 succeeded in 1030ms:

------------------------------------------------------------
Gradle 8.11
------------------------------------------------------------

Build time:    2024-11-11 13:58:01 UTC
Revision:      b2ef976169a05b3c76d04f0fa76a940859f96fa4

Kotlin:        2.0.20
Groovy:        3.0.22
Ant:           Apache Ant(TM) version 1.10.14 compiled on August 16 2023
Launcher JVM:  21.0.10 (Eclipse Adoptium 21.0.10+7-LTS)
Daemon JVM:    C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot (no JDK specified, using current Java home)
OS:            Windows 11 10.0 amd64


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem C:\\Users\\alokt\\.gradle\\daemon\\8.11 -Filter daemon-*.out.log | Sort-Object LastWriteTime -Descending | Select-Object -First 3 FullName,LastWriteTime,Length" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 717ms:

FullName                                                LastWriteTime        Length
--------                                                -------------        ------
C:\Users\alokt\.gradle\daemon\8.11\daemon-38728.out.log 5/22/2026 4:17:09 PM  41750
C:\Users\alokt\.gradle\daemon\8.11\daemon-50676.out.log 5/22/2026 4:16:44 PM  41750
C:\Users\alokt\.gradle\daemon\8.11\daemon-48860.out.log 5/22/2026 2:04:27 PM      0



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content C:\\Users\\alokt\\.gradle\\daemon\\8.11\\daemon-38728.out.log -Tail 120" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 434ms:
2026-05-22T16:17:07.250-0400 [DEBUG] [org.gradle.launcher.daemon.server.DefaultIncomingConnectionHandler] Starting executing command: Build{id=eeb8206e-8174-44ac-b521-8c1c3b18123d, currentDir=C:\Alok\Business Projects\Urbanclap-sprint3\customer-app} with connection: socket connection from /127.0.0.1:54990 to /127.0.0.1:64265.
2026-05-22T16:17:07.251-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonStateCoordinator] Command execution: started DaemonCommandExecution[command = Build{id=eeb8206e-8174-44ac-b521-8c1c3b18123d, currentDir=C:\Alok\Business Projects\Urbanclap-sprint3\customer-app}, connection = DefaultDaemonConnection: socket connection from /127.0.0.1:54990 to /127.0.0.1:64265] after 0.0019166666666666668 minutes of idle
2026-05-22T16:17:07.252-0400 [INFO] [org.gradle.launcher.daemon.server.DaemonRegistryUpdater] Marking the daemon as busy, address: [f2d464d0-4795-475b-936a-8a4d0bf84e8e port:54990, addresses:[localhost/127.0.0.1]]
2026-05-22T16:17:07.252-0400 [DEBUG] [org.gradle.launcher.daemon.registry.PersistentDaemonRegistry] Marking busy by address: [f2d464d0-4795-475b-936a-8a4d0bf84e8e port:54990, addresses:[localhost/127.0.0.1]]
2026-05-22T16:17:07.252-0400 [DEBUG] [org.gradle.cache.internal.DefaultFileLockManager] Waiting to acquire exclusive lock on daemon addresses registry.
2026-05-22T16:17:07.253-0400 [DEBUG] [org.gradle.cache.internal.DefaultFileLockManager] Lock acquired on daemon addresses registry.
2026-05-22T16:17:07.253-0400 [DEBUG] [org.gradle.cache.internal.DefaultFileLockManager] Releasing lock on daemon addresses registry.
2026-05-22T16:17:07.254-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonStateCoordinator] resetting idle timer
2026-05-22T16:17:07.254-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonStateCoordinator] daemon is running. Sleeping until state changes.
2026-05-22T16:17:07.255-0400 [INFO] [org.gradle.launcher.daemon.server.exec.StartBuildOrRespondWithBusy] Daemon is about to start building Build{id=eeb8206e-8174-44ac-b521-8c1c3b18123d, currentDir=C:\Alok\Business Projects\Urbanclap-sprint3\customer-app}. Dispatching build started information...
2026-05-22T16:17:07.255-0400 [DEBUG] [org.gradle.launcher.daemon.server.SynchronizedDispatchConnection] thread 78: dispatching org.gradle.launcher.daemon.protocol.BuildStarted@35a598bf
2026-05-22T16:17:07.256-0400 [DEBUG] [org.gradle.launcher.daemon.server.exec.EstablishBuildEnvironment] Configuring env variables: [PATH, USERDOMAIN_ROAMINGPROFILE, PROCESSOR_LEVEL, SYSTEMDRIVE, GIT_PAGER, SESSIONNAME, ALLUSERSPROFILE, GIT_CONFIG_COUNT, PROCESSOR_ARCHITECTURE, VSCODE_GIT_IPC_HANDLE, VSCODE_PYTHON_AUTOACTIVATE_GUARD, PSModulePath, COREPACK_ENABLE_AUTO_PIN, PROGRAMFILES, CLAUDE_CODE_ENTRYPOINT, VSCODE_INJECTION, CLAUDECODE, COLORTERM, DIRNAME, USERNAME, GIT_CONFIG_VALUE_0, VSCODE_GIT_ASKPASS_NODE, PWD, TERM_PROGRAM_VERSION, GIT_ASKPASS, ProgramFiles(x86), CHROME_CRASHPAD_PIPE_NAME, CODEX_MANAGED_BY_NPM, APP_HOME, CODEX_SANDBOX_NETWORK_DISABLED, DEFAULT_JVM_OPTS, PATHEXT, SHELL, DriverData, OneDriveConsumer, PAGER, CLAUDE_EFFORT, AI_AGENT, NoDefaultCurrentDirectoryInExePath, OLDPWD, CLAUDE_CODE_SSE_PORT, WINDIR, ProgramData, ProgramW6432, HOMEPATH, PROCESSOR_IDENTIFIER, PUBLIC, LESS, EXEPATH, SHLVL, EFC_8436_1592913036, ZES_ENABLE_SYSMAN, LOCALAPPDATA, USERDOMAIN, LOGONSERVER, JAVA_HOME, PLINK_PROTOCOL, PROMPT, GIT_EDITOR, TERM, LANG, VSCODE_GIT_ASKPASS_MAIN, MSYSTEM, OneDrive, =C:, APPDATA, GRADLE_USER_HOME, CLAUDE_CODE_SESSION_ID, EFC_8436_4126798990, SYSTEMROOT, JAVA_EXE, VSCODE_GIT_ASKPASS_EXTRA_ARGS, CODEX_THREAD_ID, CLAUDE_CODE_EXECPATH, GIT_CONFIG_KEY_0, OS, TERM_PROGRAM, COMPUTERNAME, COMMONPROGRAMFILES, COMSPEC, PROCESSOR_REVISION, CLASSPATH, CommonProgramW6432, APP_BASE_NAME, TEMP, HOMEDRIVE, USERPROFILE, TMP, CommonProgramFiles(x86), NUMBER_OF_PROCESSORS, HOME]
2026-05-22T16:17:07.260-0400 [DEBUG] [org.gradle.launcher.daemon.server.exec.LogToClient] About to start relaying all logs to the client via the connection.
2026-05-22T16:17:07.260-0400 [INFO] [org.gradle.launcher.daemon.server.exec.LogToClient] The client will now receive all logging from the daemon (pid: 38728). The daemon log file: C:\Users\alokt\.gradle\daemon\8.11\daemon-38728.out.log
2026-05-22T16:17:07.261-0400 [DEBUG] [org.gradle.launcher.daemon.server.exec.RequestStopIfSingleUsedDaemon] Requesting daemon stop after processing Build{id=eeb8206e-8174-44ac-b521-8c1c3b18123d, currentDir=C:\Alok\Business Projects\Urbanclap-sprint3\customer-app}
2026-05-22T16:17:07.261-0400 [LIFECYCLE] [org.gradle.launcher.daemon.server.DaemonStateCoordinator] Daemon will be stopped at the end of the build 
2026-05-22T16:17:07.261-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonStateCoordinator] Stop as soon as idle requested. The daemon is busy
2026-05-22T16:17:07.261-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonStateCoordinator] daemon stop has been requested. Sleeping until state changes.
2026-05-22T16:17:07.262-0400 [DEBUG] [org.gradle.launcher.daemon.server.exec.ExecuteBuild] The daemon has started executing the build.
2026-05-22T16:17:07.262-0400 [DEBUG] [org.gradle.launcher.daemon.server.exec.ExecuteBuild] Executing build with daemon context: DefaultDaemonContext[uid=8b7ec7f3-9cc3-4d2d-8d50-94548df95c53,javaHome=C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot,javaVersion=21,javaVendor=Eclipse Adoptium,daemonRegistryDir=C:\Users\alokt\.gradle\daemon,pid=38728,idleTimeout=120000,priority=NORMAL,applyInstrumentationAgent=true,nativeServicesMode=ENABLED,daemonOpts=-XX:+UseParallelGC,-Xmx4g,-Dfile.encoding=UTF-8,-Duser.country=US,-Duser.language=en,-Duser.variant]
Calculating task graph as no cached configuration is available for tasks: :app:compileDebugKotlin
Configuration cache entry stored.
2026-05-22T16:17:09.413-0400 [DEBUG] [org.gradle.launcher.daemon.server.exec.ExecuteBuild] The daemon has finished executing the build.
2026-05-22T16:17:09.431-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonStateCoordinator] daemon stop has been requested. Sleeping until state changes.
2026-05-22T16:17:09.432-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonStateCoordinator] Command execution: finished waiting for DaemonCommandExecution[command = Build{id=eeb8206e-8174-44ac-b521-8c1c3b18123d, currentDir=C:\Alok\Business Projects\Urbanclap-sprint3\customer-app}, connection = DefaultDaemonConnection: socket connection from /127.0.0.1:54990 to /127.0.0.1:64265]. Result org.gradle.launcher.daemon.server.DaemonStateCoordinator@2e6f3396 with state StopRequested
2026-05-22T16:17:09.432-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonStateCoordinator] Command execution: completed DaemonCommandExecution[command = Build{id=eeb8206e-8174-44ac-b521-8c1c3b18123d, currentDir=C:\Alok\Business Projects\Urbanclap-sprint3\customer-app}, connection = DefaultDaemonConnection: socket connection from /127.0.0.1:54990 to /127.0.0.1:64265]
2026-05-22T16:17:09.432-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonStateCoordinator] resetting idle timer
2026-05-22T16:17:09.432-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonStateCoordinator] Marking daemon stopped due to command completed and stop requested. The daemon is not running a build
2026-05-22T16:17:09.432-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonStateCoordinator] daemon has stopped.
2026-05-22T16:17:09.433-0400 [DEBUG] [org.gradle.launcher.daemon.server.Daemon] stop() called on daemon
2026-05-22T16:17:09.433-0400 [INFO] [org.gradle.launcher.daemon.server.Daemon] Stop requested. Daemon is removing its presence from the registry...
2026-05-22T16:17:09.433-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonRegistryUpdater] Removing our presence to clients, eg. removing this address from the registry: [f2d464d0-4795-475b-936a-8a4d0bf84e8e port:54990, addresses:[localhost/127.0.0.1]]
2026-05-22T16:17:09.433-0400 [DEBUG] [org.gradle.launcher.daemon.registry.PersistentDaemonRegistry] Removing daemon address: [f2d464d0-4795-475b-936a-8a4d0bf84e8e port:54990, addresses:[localhost/127.0.0.1]]
2026-05-22T16:17:09.432-0400 [DEBUG] [org.gradle.launcher.daemon.server.exec.ReturnResult] Daemon is dispatching the build result: Success[value=org.gradle.launcher.exec.BuildActionResult@29ab2c03]
2026-05-22T16:17:09.433-0400 [DEBUG] [org.gradle.launcher.daemon.server.SynchronizedDispatchConnection] thread 75: dispatching Success[value=org.gradle.launcher.exec.BuildActionResult@29ab2c03]
2026-05-22T16:17:09.434-0400 [DEBUG] [org.gradle.cache.internal.DefaultFileLockManager] Waiting to acquire exclusive lock on daemon addresses registry.
2026-05-22T16:17:09.434-0400 [DEBUG] [org.gradle.cache.internal.DefaultFileLockManager] Lock acquired on daemon addresses registry.
2026-05-22T16:17:09.435-0400 [DEBUG] [org.gradle.cache.internal.DefaultFileLockManager] Releasing lock on daemon addresses registry.
2026-05-22T16:17:09.435-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonRegistryUpdater] Address removed from registry.
2026-05-22T16:17:09.441-0400 [DEBUG] [org.gradle.launcher.daemon.server.exec.CleanUpVirtualFileSystemAfterBuild] Cleaning virtual file system after build finished
2026-05-22T16:17:09.441-0400 [DEBUG] [org.gradle.launcher.daemon.server.DefaultIncomingConnectionHandler] Finishing executing command: Build{id=eeb8206e-8174-44ac-b521-8c1c3b18123d, currentDir=C:\Alok\Business Projects\Urbanclap-sprint3\customer-app}
2026-05-22T16:17:09.458-0400 [DEBUG] [org.gradle.launcher.daemon.server.SynchronizedDispatchConnection] thread 76: received class org.gradle.launcher.daemon.protocol.CloseInput
2026-05-22T16:17:09.458-0400 [DEBUG] [org.gradle.launcher.daemon.server.DefaultDaemonConnection] thread 76: Received IO message from client: org.gradle.launcher.daemon.protocol.CloseInput@388d916f
2026-05-22T16:17:09.458-0400 [DEBUG] [org.gradle.launcher.daemon.server.SynchronizedDispatchConnection] thread 76: received class org.gradle.launcher.daemon.protocol.Finished
2026-05-22T16:17:09.458-0400 [DEBUG] [org.gradle.launcher.daemon.server.DefaultDaemonConnection] thread 76: Received non-IO message from client: org.gradle.launcher.daemon.protocol.Finished@3f4052c8
2026-05-22T16:17:09.458-0400 [DEBUG] [org.gradle.launcher.daemon.server.DefaultIncomingConnectionHandler] Received finished message: org.gradle.launcher.daemon.protocol.Finished@3f4052c8
2026-05-22T16:17:09.458-0400 [DEBUG] [org.gradle.launcher.daemon.server.SynchronizedDispatchConnection] thread 75: stopping connection
2026-05-22T16:17:09.459-0400 [DEBUG] [org.gradle.internal.remote.internal.inet.SocketConnection] Discarding EOFException: java.io.EOFException
2026-05-22T16:17:09.459-0400 [DEBUG] [org.gradle.launcher.daemon.server.SynchronizedDispatchConnection] thread 76: received null
2026-05-22T16:17:09.459-0400 [DEBUG] [org.gradle.launcher.daemon.server.DefaultDaemonConnection] thread 76: Received end-of-input from client.
2026-05-22T16:17:09.459-0400 [DEBUG] [org.gradle.launcher.daemon.server.SynchronizedDispatchConnection] thread 75: stopping connection
2026-05-22T16:17:09.460-0400 [DEBUG] [org.gradle.cache.internal.DefaultCacheCleanupExecutor] jars (C:\Users\alokt\.gradle\caches\jars-9) has last been fully cleaned up 17 hours ago
2026-05-22T16:17:09.460-0400 [DEBUG] [org.gradle.cache.internal.DefaultCacheCleanupExecutor] Skipping cleanup for jars (C:\Users\alokt\.gradle\caches\jars-9) as it is not yet due
2026-05-22T16:17:09.460-0400 [DEBUG] [org.gradle.cache.internal.DefaultCacheCoordinator] Cache jars (C:\Users\alokt\.gradle\caches\jars-9) was closed 0 times.
2026-05-22T16:17:09.460-0400 [DEBUG] [org.gradle.cache.internal.LockOnDemandCrossProcessCacheAccess] Releasing file lock for file content cache (C:\Users\alokt\.gradle\caches\8.11\fileContent)
2026-05-22T16:17:09.460-0400 [DEBUG] [org.gradle.cache.internal.DefaultFileLockManager] Releasing lock on file content cache (C:\Users\alokt\.gradle\caches\8.11\fileContent).
2026-05-22T16:17:09.460-0400 [DEBUG] [org.gradle.internal.watch.vfs.impl.WatchingVirtualFileSystem] Closing VFS, dropping state
2026-05-22T16:17:09.461-0400 [DEBUG] [org.gradle.internal.watch.registry.impl.DefaultFileWatcherRegistry] Finished listening to file system change events
2026-05-22T16:17:09.461-0400 [DEBUG] [org.gradle.cache.internal.LockOnDemandCrossProcessCacheAccess] Releasing file lock for Generated Gradle JARs cache (C:\Users\alokt\.gradle\caches\8.11\generated-gradle-jars)
2026-05-22T16:17:09.462-0400 [DEBUG] [org.gradle.cache.internal.DefaultFileLockManager] Releasing lock on Generated Gradle JARs cache (C:\Users\alokt\.gradle\caches\8.11\generated-gradle-jars).
2026-05-22T16:17:09.462-0400 [DEBUG] [org.gradle.cache.internal.DefaultCacheCleanupExecutor] groovy-dsl (C:\Users\alokt\.gradle\caches\8.11\groovy-dsl) has last been fully cleaned up 17 hours ago
2026-05-22T16:17:09.462-0400 [DEBUG] [org.gradle.cache.internal.DefaultCacheCleanupExecutor] Skipping cleanup for groovy-dsl (C:\Users\alokt\.gradle\caches\8.11\groovy-dsl) as it is not yet due
2026-05-22T16:17:09.462-0400 [DEBUG] [org.gradle.cache.internal.DefaultCacheCoordinator] Cache groovy-dsl (C:\Users\alokt\.gradle\caches\8.11\groovy-dsl) was closed 0 times.
2026-05-22T16:17:09.462-0400 [DEBUG] [org.gradle.cache.internal.DefaultCacheCleanupExecutor] Artifact transforms cache (C:\Users\alokt\.gradle\caches\8.11\transforms) has last been fully cleaned up 17 hours ago
2026-05-22T16:17:09.462-0400 [DEBUG] [org.gradle.cache.internal.DefaultCacheCleanupExecutor] Skipping cleanup for Artifact transforms cache (C:\Users\alokt\.gradle\caches\8.11\transforms) as it is not yet due
2026-05-22T16:17:09.462-0400 [DEBUG] [org.gradle.cache.internal.DefaultCacheCoordinator] Cache Artifact transforms cache (C:\Users\alokt\.gradle\caches\8.11\transforms) was closed 0 times.
2026-05-22T16:17:09.462-0400 [DEBUG] [org.gradle.cache.internal.DefaultCacheCleanupExecutor] kotlin-dsl (C:\Users\alokt\.gradle\caches\8.11\kotlin-dsl) has last been fully cleaned up 21 hours ago
2026-05-22T16:17:09.463-0400 [DEBUG] [org.gradle.cache.internal.DefaultCacheCleanupExecutor] Skipping cleanup for kotlin-dsl (C:\Users\alokt\.gradle\caches\8.11\kotlin-dsl) as it is not yet due
2026-05-22T16:17:09.463-0400 [DEBUG] [org.gradle.cache.internal.DefaultCacheCoordinator] Cache kotlin-dsl (C:\Users\alokt\.gradle\caches\8.11\kotlin-dsl) was closed 0 times.
2026-05-22T16:17:09.463-0400 [DEBUG] [org.gradle.cache.internal.LockOnDemandCrossProcessCacheAccess] Releasing file lock for journal cache (C:\Users\alokt\.gradle\caches\journal-1)
2026-05-22T16:17:09.463-0400 [DEBUG] [org.gradle.cache.internal.btree.BTreePersistentIndexedCache] Closing cache file-access.bin (C:\Users\alokt\.gradle\caches\journal-1\file-access.bin)
2026-05-22T16:17:09.463-0400 [DEBUG] [org.gradle.cache.internal.DefaultFileLockManager] Releasing lock on journal cache (C:\Users\alokt\.gradle\caches\journal-1).
2026-05-22T16:17:09.464-0400 [DEBUG] [org.gradle.cache.internal.LockOnDemandCrossProcessCacheAccess] Releasing file lock for file hash cache (C:\Users\alokt\.gradle\caches\8.11\fileHashes)
2026-05-22T16:17:09.464-0400 [DEBUG] [org.gradle.cache.internal.btree.BTreePersistentIndexedCache] Closing cache fileHashes.bin (C:\Users\alokt\.gradle\caches\8.11\fileHashes\fileHashes.bin)
2026-05-22T16:17:09.464-0400 [DEBUG] [org.gradle.cache.internal.btree.BTreePersistentIndexedCache] Closing cache resourceHashesCache.bin (C:\Users\alokt\.gradle\caches\8.11\fileHashes\resourceHashesCache.bin)
2026-05-22T16:17:09.464-0400 [DEBUG] [org.gradle.cache.internal.DefaultFileLockManager] Releasing lock on file hash cache (C:\Users\alokt\.gradle\caches\8.11\fileHashes).
2026-05-22T16:17:09.465-0400 [DEBUG] [org.gradle.internal.operations.DefaultBuildOperationRunner] Build operation 'Deleting unused version-specific caches in C:\Users\alokt\.gradle\caches' started
2026-05-22T16:17:09.465-0400 [DEBUG] [org.gradle.internal.operations.DefaultBuildOperationRunner] Completing Build operation 'Deleting unused version-specific caches in C:\Users\alokt\.gradle\caches'
2026-05-22T16:17:09.465-0400 [DEBUG] [org.gradle.internal.operations.DefaultBuildOperationRunner] Build operation 'Deleting unused version-specific caches in C:\Users\alokt\.gradle\caches' completed
2026-05-22T16:17:09.465-0400 [DEBUG] [org.gradle.launcher.daemon.server.Daemon] stop() called on daemon
2026-05-22T16:17:09.465-0400 [INFO] [org.gradle.launcher.daemon.server.Daemon] Stop requested. Daemon is removing its presence from the registry...
2026-05-22T16:17:09.465-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonRegistryUpdater] Removing our presence to clients, eg. removing this address from the registry: [f2d464d0-4795-475b-936a-8a4d0bf84e8e port:54990, addresses:[localhost/127.0.0.1]]
2026-05-22T16:17:09.465-0400 [DEBUG] [org.gradle.launcher.daemon.registry.PersistentDaemonRegistry] Removing daemon address: [f2d464d0-4795-475b-936a-8a4d0bf84e8e port:54990, addresses:[localhost/127.0.0.1]]
2026-05-22T16:17:09.466-0400 [DEBUG] [org.gradle.cache.internal.DefaultFileLockManager] Waiting to acquire exclusive lock on daemon addresses registry.
2026-05-22T16:17:09.466-0400 [DEBUG] [org.gradle.cache.internal.DefaultFileLockManager] Lock acquired on daemon addresses registry.
2026-05-22T16:17:09.467-0400 [DEBUG] [org.gradle.cache.internal.DefaultFileLockManager] Releasing lock on daemon addresses registry.
2026-05-22T16:17:09.467-0400 [DEBUG] [org.gradle.launcher.daemon.server.DaemonRegistryUpdater] Address removed from registry.
2026-05-22T16:17:09.467-0400 [DEBUG] [org.gradle.cache.internal.DefaultCacheCoordinator] Cache Build Output Cleanup Cache (C:\Alok\Business Projects\Urbanclap-sprint3\design-system\.gradle\buildOutputCleanup) was closed 0 times.
2026-05-22T16:17:09.468-0400 [DEBUG] [org.gradle.cache.internal.locklistener.DefaultFileLockContentionHandler] File lock listener thread completed.
2026-05-22T16:17:09.470-0400 [DEBUG] [java.lang.Runtime] Runtime.exit() called with status: 0
java.lang.Throwable: Runtime.exit(0)
	at java.base/java.lang.Shutdown.logRuntimeExit(Shutdown.java:179)
	at java.base/java.lang.Shutdown.exit(Shutdown.java:160)
	at java.base/java.lang.Runtime.exit(Runtime.java:188)
	at java.base/java.lang.System.exit(System.java:1920)
	at org.gradle.launcher.bootstrap.ProcessCompleter.complete(ProcessCompleter.java:21)
	at org.gradle.launcher.bootstrap.EntryPoint.run(EntryPoint.java:61)
	at java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:103)
	at java.base/java.lang.reflect.Method.invoke(Method.java:580)
	at org.gradle.launcher.bootstrap.ProcessBootstrap.runNoExit(ProcessBootstrap.java:72)
	at org.gradle.launcher.bootstrap.ProcessBootstrap.run(ProcessBootstrap.java:39)
	at org.gradle.launcher.daemon.bootstrap.GradleDaemon.main(GradleDaemon.java:22)
Daemon vm is shutting down... The daemon has exited normally or was terminated in response to a user interrupt.
2026-05-22T16:17:09.471-0400 [DEBUG] [org.gradle.launcher.daemon.registry.PersistentDaemonRegistry] Removing daemon address: [f2d464d0-4795-475b-936a-8a4d0bf84e8e port:54990, addresses:[localhost/127.0.0.1]]
2026-05-22T16:17:09.471-0400 [DEBUG] [org.gradle.launcher.daemon.server.Daemon] VM shutdown hook was unable to remove the daemon address from the registry. It will be cleaned up later.
java.lang.IllegalStateException: Cannot start managing file contention because this handler has been closed.
	at org.gradle.cache.internal.locklistener.DefaultFileLockContentionHandler.assertNotStopped(DefaultFileLockContentionHandler.java:217)
	at org.gradle.cache.internal.locklistener.DefaultFileLockContentionHandler.getCommunicator(DefaultFileLockContentionHandler.java:260)
	at org.gradle.cache.internal.locklistener.DefaultFileLockContentionHandler.reservePort(DefaultFileLockContentionHandler.java:254)
	at org.gradle.cache.internal.DefaultFileLockManager.lock(DefaultFileLockManager.java:124)
	at org.gradle.cache.internal.DefaultFileLockManager.lock(DefaultFileLockManager.java:106)
	at org.gradle.cache.internal.DefaultFileLockManager.lock(DefaultFileLockManager.java:101)
	at org.gradle.cache.internal.OnDemandFileAccess.updateFile(OnDemandFileAccess.java:51)
	at org.gradle.cache.internal.FileBackedObjectHolder.update(FileBackedObjectHolder.java:77)
	at org.gradle.cache.internal.FileIntegrityViolationSuppressingObjectHolderDecorator.lambda$update$0(FileIntegrityViolationSuppressingObjectHolderDecorator.java:48)
	at org.gradle.cache.internal.FileIntegrityViolationSuppressingObjectHolderDecorator.doUpdate(FileIntegrityViolationSuppressingObjectHolderDecorator.java:58)
	at org.gradle.cache.internal.FileIntegrityViolationSuppressingObjectHolderDecorator.update(FileIntegrityViolationSuppressingObjectHolderDecorator.java:48)
	at org.gradle.launcher.daemon.registry.PersistentDaemonRegistry.remove(PersistentDaemonRegistry.java:133)
	at org.gradle.launcher.daemon.server.Daemon$1.run(Daemon.java:133)
	at java.base/java.lang.Thread.run(Thread.java:1583)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$env:GRADLE_USER_HOME='"'C:\\Users\\alokt\\.gradle'; & 'C:\\Users\\alokt\\.gradle\\wrapper\\dists\\gradle-8.11-bin\\c4te04g51qsyw1bxcb929u7br\\gradle-8.11\\bin\\gradle.bat' :app:compileDebugKotlin --offline --console=plain" in C:\Alok\Business Projects\Urbanclap-sprint3\customer-app
 succeeded in 17801ms:
Calculating task graph as no cached configuration is available for tasks: :app:compileDebugKotlin

> Configure project :app
WARNING: The option setting 'android.defaults.buildfeatures.buildconfig=true' is deprecated.
The current default is 'false'.
It will be removed in version 9.0 of the Android Gradle plugin.
To keep using this feature, add the following to your module-level build.gradle files:
    android.buildFeatures.buildConfig = true
or from Android Studio, click: `Refactor` > `Migrate BuildConfig to Gradle Build Files`.

> Task :design-system:preBuild UP-TO-DATE
> Task :app:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :app:preBuild UP-TO-DATE
> Task :design-system:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :core-nav:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :app:preDebugBuild UP-TO-DATE
> Task :design-system:preDebugBuild UP-TO-DATE
> Task :core-nav:processResources NO-SOURCE
> Task :app:generateDebugBuildConfig UP-TO-DATE
> Task :app:generateDebugResValues UP-TO-DATE
> Task :app:generateDebugResources UP-TO-DATE
> Task :design-system:javaPreCompileDebug UP-TO-DATE
> Task :design-system:generateDebugResValues UP-TO-DATE
> Task :design-system:writeDebugAarMetadata UP-TO-DATE
> Task :app:createDebugCompatibleScreenManifests UP-TO-DATE
> Task :design-system:extractDeepLinksDebug UP-TO-DATE
> Task :design-system:processDebugManifest UP-TO-DATE
> Task :core-nav:compileKotlin UP-TO-DATE
> Task :app:processDebugGoogleServices UP-TO-DATE
> Task :design-system:generateDebugResources UP-TO-DATE
> Task :app:extractDeepLinksDebug UP-TO-DATE
> Task :app:packageDebugResources UP-TO-DATE
> Task :core-nav:compileJava NO-SOURCE
> Task :core-nav:classes UP-TO-DATE
> Task :design-system:packageDebugResources UP-TO-DATE
> Task :design-system:compileDebugLibraryResources UP-TO-DATE
> Task :app:parseDebugLocalResources UP-TO-DATE
> Task :design-system:parseDebugLocalResources UP-TO-DATE
> Task :core-nav:jar UP-TO-DATE
> Task :design-system:generateDebugRFile UP-TO-DATE
> Task :app:checkDebugAarMetadata UP-TO-DATE
> Task :app:mapDebugSourceSetPaths UP-TO-DATE
> Task :app:mergeDebugResources UP-TO-DATE
> Task :app:processDebugMainManifest UP-TO-DATE
> Task :app:processDebugManifest UP-TO-DATE
> Task :design-system:compileDebugKotlin UP-TO-DATE
> Task :app:processDebugManifestForPackage UP-TO-DATE
> Task :design-system:compileDebugJavaWithJavac NO-SOURCE
> Task :design-system:bundleLibCompileToJarDebug UP-TO-DATE
> Task :app:processDebugResources UP-TO-DATE
> Task :app:kspDebugKotlin UP-TO-DATE
> Task :app:compileDebugKotlin UP-TO-DATE
[Incubating] Problems report is available at: file:///C:/Alok/Business%20Projects/Urbanclap-sprint3/customer-app/build/reports/problems/problems-report.html

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.11/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

BUILD SUCCESSFUL in 17s
31 actionable tasks: 31 up-to-date
Configuration cache entry stored.

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$env:GRADLE_USER_HOME='"'C:\\Users\\alokt\\.gradle'; & 'C:\\Users\\alokt\\.gradle\\wrapper\\dists\\gradle-8.11-bin\\c4te04g51qsyw1bxcb929u7br\\gradle-8.11\\bin\\gradle.bat' :app:testDebugUnitTest --offline --console=plain" in C:\Alok\Business Projects\Urbanclap-sprint3\customer-app
 succeeded in 12664ms:
Calculating task graph as no cached configuration is available for tasks: :app:testDebugUnitTest

> Configure project :app
WARNING: The option setting 'android.defaults.buildfeatures.buildconfig=true' is deprecated.
The current default is 'false'.
It will be removed in version 9.0 of the Android Gradle plugin.
To keep using this feature, add the following to your module-level build.gradle files:
    android.buildFeatures.buildConfig = true
or from Android Studio, click: `Refactor` > `Migrate BuildConfig to Gradle Build Files`.

> Task :app:preBuild UP-TO-DATE
> Task :app:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :app:preDebugBuild UP-TO-DATE
> Task :app:generateDebugResValues UP-TO-DATE
> Task :design-system:preBuild UP-TO-DATE
> Task :app:koverFindJar UP-TO-DATE
> Task :app:processDebugGoogleServices UP-TO-DATE
> Task :app:createDebugCompatibleScreenManifests UP-TO-DATE
> Task :design-system:preDebugBuild UP-TO-DATE
> Task :core-nav:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :app:preDebugUnitTestBuild UP-TO-DATE
> Task :app:extractDeepLinksDebug UP-TO-DATE
> Task :design-system:writeDebugAarMetadata UP-TO-DATE
> Task :app:mergeDebugShaders UP-TO-DATE
> Task :app:generateDebugBuildConfig UP-TO-DATE
> Task :app:javaPreCompileDebugUnitTest UP-TO-DATE
> Task :app:javaPreCompileDebug UP-TO-DATE
> Task :app:generateDebugResources UP-TO-DATE
> Task :app:compileDebugShaders NO-SOURCE
> Task :app:generateDebugAssets UP-TO-DATE
> Task :design-system:generateDebugResValues UP-TO-DATE
> Task :design-system:generateDebugResources UP-TO-DATE
> Task :app:packageDebugResources UP-TO-DATE
> Task :core-nav:compileKotlin UP-TO-DATE
> Task :design-system:packageDebugResources UP-TO-DATE
> Task :core-nav:compileJava NO-SOURCE
> Task :design-system:extractDeepLinksDebug UP-TO-DATE
> Task :core-nav:processResources NO-SOURCE
> Task :core-nav:classes UP-TO-DATE
> Task :design-system:processDebugManifest UP-TO-DATE
> Task :app:parseDebugLocalResources UP-TO-DATE
> Task :design-system:parseDebugLocalResources UP-TO-DATE
> Task :core-nav:jar UP-TO-DATE
> Task :design-system:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :design-system:compileDebugLibraryResources UP-TO-DATE
> Task :design-system:javaPreCompileDebug UP-TO-DATE
> Task :design-system:generateDebugRFile UP-TO-DATE
> Task :design-system:mergeDebugShaders UP-TO-DATE
> Task :design-system:compileDebugShaders NO-SOURCE
> Task :design-system:generateDebugAssets UP-TO-DATE
> Task :design-system:packageDebugAssets UP-TO-DATE
> Task :app:mapDebugSourceSetPaths UP-TO-DATE
> Task :app:mergeDebugResources UP-TO-DATE
> Task :app:checkDebugAarMetadata UP-TO-DATE
> Task :design-system:compileDebugKotlin UP-TO-DATE
> Task :design-system:compileDebugJavaWithJavac NO-SOURCE
> Task :app:mergeDebugAssets UP-TO-DATE
> Task :design-system:processDebugJavaRes UP-TO-DATE
> Task :design-system:bundleLibCompileToJarDebug UP-TO-DATE
> Task :design-system:bundleLibRuntimeToJarDebug UP-TO-DATE
> Task :design-system:createFullJarDebug UP-TO-DATE
> Task :app:preparePaparazziDebugResources UP-TO-DATE
> Task :app:processDebugMainManifest UP-TO-DATE
> Task :app:processDebugManifest UP-TO-DATE
> Task :app:processDebugManifestForPackage UP-TO-DATE
> Task :app:processDebugResources UP-TO-DATE
> Task :app:packageDebugUnitTestForUnitTest UP-TO-DATE
> Task :app:generateDebugUnitTestConfig UP-TO-DATE
> Task :app:kspDebugKotlin UP-TO-DATE
> Task :app:compileDebugKotlin UP-TO-DATE
> Task :app:compileDebugJavaWithJavac UP-TO-DATE
> Task :app:hiltAggregateDepsDebug UP-TO-DATE
> Task :app:hiltJavaCompileDebug UP-TO-DATE
> Task :app:bundleDebugClassesToCompileJar UP-TO-DATE
> Task :app:processDebugJavaRes UP-TO-DATE
> Task :app:transformDebugClassesWithAsm UP-TO-DATE
> Task :app:bundleDebugClassesToRuntimeJar UP-TO-DATE
> Task :app:kspDebugUnitTestKotlin UP-TO-DATE
> Task :app:compileDebugUnitTestKotlin UP-TO-DATE
> Task :app:compileDebugUnitTestJavaWithJavac UP-TO-DATE
> Task :app:hiltAggregateDepsDebugUnitTest UP-TO-DATE
> Task :app:hiltJavaCompileDebugUnitTest UP-TO-DATE
> Task :app:processDebugUnitTestJavaRes UP-TO-DATE
> Task :app:transformDebugUnitTestClassesWithAsm UP-TO-DATE
> Task :app:testDebugUnitTest UP-TO-DATE
[Incubating] Problems report is available at: file:///C:/Alok/Business%20Projects/Urbanclap-sprint3/customer-app/build/reports/problems/problems-report.html

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.11/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

BUILD SUCCESSFUL in 12s
59 actionable tasks: 59 up-to-date
Configuration cache entry stored.

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content customer-app/app/src/main/kotlin/com/homeservices/customer/observability/SentryInitializer.kt -Raw' in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 437ms:
package com.homeservices.customer.observability

import android.app.Application
import com.homeservices.customer.BuildConfig
import io.sentry.android.core.SentryAndroid

public object SentryInitializer {
    private const val TRACES_SAMPLE_RATE: Double = 0.1

    public fun init(
        application: Application,
        dsn: String = BuildConfig.SENTRY_DSN,
    ): Unit {
        if (dsn.isBlank()) return
        SentryAndroid.init(application) { options ->
            options.dsn = dsn
            options.tracesSampleRate = TRACES_SAMPLE_RATE
            // Release tag: "<applicationId>@<versionName>+<gitSha>" â€” enables
            // Sentry release tracking and sourcemap/ProGuard mapping uploads.
            options.release = "${BuildConfig.APPLICATION_ID}@${BuildConfig.VERSION_NAME}+${BuildConfig.GIT_SHA}"
            // Strip PII from every event before transmission (ADR-0018).
            options.beforeSend =
                io.sentry.SentryOptions.BeforeSendCallback { event, _ ->
                    PiiRedactor.scrub(event)
                    event
                }
        }
    }
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/di/AuthOkHttpClient.kt -ErrorAction SilentlyContinue; Get-ChildItem customer-app/app/src/main/kotlin/com/homeservices/customer/data -Recurse -Filter *.kt | Select-String -Pattern 'AuthOkHttpClient|Authorization|FirebaseAuth' | ForEach-Object { \""'$($_.Path):$($_.LineNumber):$($_.Line.Trim())" }' in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 575ms:
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:4:import com.google.firebase.auth.FirebaseAuth
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:28:private val firebaseAuth: FirebaseAuth,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:168:* 5. Best-effort [FirebaseAuth.signOut] (local-only SDK call; safe after prefs are cleared)
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:227:runCatching { firebaseAuth.signOut() }
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:232:message = "firebaseAuth.signOut() failed: ${e.message}"
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\di\AuthModule.kt:8:import com.google.firebase.auth.FirebaseAuth
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\di\AuthModule.kt:26:public fun provideFirebaseAuth(): FirebaseAuth = FirebaseAuth.getInstance()
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:28:public annotation class AuthOkHttpClient
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:53:@AuthOkHttpClient
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:54:public fun provideAuthOkHttpClient(
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:70:.header("Authorization", "Bearer $token")
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:91:@AuthOkHttpClient client: OkHttpClient,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\complaint\di\ComplaintModule.kt:5:import com.homeservices.customer.data.booking.di.AuthOkHttpClient
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\complaint\di\ComplaintModule.kt:30:@AuthOkHttpClient client: OkHttpClient,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\consent\remote\di\ConsentApiModule.kt:4:import com.homeservices.customer.data.booking.di.AuthOkHttpClient
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\consent\remote\di\ConsentApiModule.kt:22:@AuthOkHttpClient client: OkHttpClient,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\dataexport\di\DataExportModule.kt:4:import com.homeservices.customer.data.booking.di.AuthOkHttpClient
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\dataexport\di\DataExportModule.kt:34:@AuthOkHttpClient client: OkHttpClient,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\deleteaccount\di\DeleteAccountModule.kt:4:import com.homeservices.customer.data.booking.di.AuthOkHttpClient
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\deleteaccount\di\DeleteAccountModule.kt:29:@AuthOkHttpClient client: OkHttpClient,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:11:* Authentication is handled by the shared [AuthOkHttpClient] interceptor which
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\di\DeviceModule.kt:4:import com.homeservices.customer.data.booking.di.AuthOkHttpClient
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\di\DeviceModule.kt:19:* Uses the shared [AuthOkHttpClient] so every request carries a Firebase Bearer token.
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\di\DeviceModule.kt:29:@AuthOkHttpClient client: OkHttpClient,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\network\auth\FirebaseTokenAuthenticator.kt:5:import com.google.firebase.auth.FirebaseAuth
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\network\auth\FirebaseTokenAuthenticator.kt:29:private val firebaseAuth: FirebaseAuth,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\network\auth\FirebaseTokenAuthenticator.kt:41:val user = firebaseAuth.currentUser
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\network\auth\FirebaseTokenAuthenticator.kt:58:.header("Authorization", "Bearer $newToken")
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\network\auth\IdTokenCache.kt:4:import com.google.firebase.auth.FirebaseAuth
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\network\auth\IdTokenCache.kt:31:*     chain.proceed(request.newBuilder().header("Authorization", "Bearer $token").build())
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\network\auth\IdTokenCache.kt:57:private val firebaseAuth: FirebaseAuth,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\network\auth\IdTokenCache.kt:177:val user = firebaseAuth.currentUser ?: return null
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\rating\di\RatingModule.kt:4:import com.homeservices.customer.data.booking.di.AuthOkHttpClient
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\rating\di\RatingModule.kt:29:@AuthOkHttpClient client: OkHttpClient,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\sos\di\SosModule.kt:8:import com.homeservices.customer.data.booking.di.AuthOkHttpClient
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\sos\di\SosModule.kt:37:@AuthOkHttpClient client: OkHttpClient,
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:33:// is added (mirrors BookingModule's @AuthOkHttpClient pattern with getIdToken).
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\wallet\di\WalletModule.kt:4:import com.homeservices.customer.data.booking.di.AuthOkHttpClient
C:\Alok\Business Projects\Urbanclap-sprint3\customer-app\app\src\main\kotlin\com\homeservices\customer\data\wallet\di\WalletModule.kt:29:@AuthOkHttpClient client: OkHttpClient,

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/di/BookingModule.kt -TotalCount 110' in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 417ms:
package com.homeservices.customer.data.booking.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.data.booking.BookingRepositoryImpl
import com.homeservices.customer.data.booking.SlotAvailabilityRepository
import com.homeservices.customer.data.booking.SlotAvailabilityRepositoryImpl
import com.homeservices.customer.data.booking.remote.BookingApiService
import com.homeservices.customer.data.network.auth.FirebaseTokenAuthenticator
import com.homeservices.customer.data.network.auth.IdTokenCache
import com.squareup.moshi.Moshi
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.time.Clock
import java.time.ZoneId
import javax.inject.Qualifier
import javax.inject.Singleton

@Qualifier
@Retention(AnnotationRetention.BINARY)
public annotation class AuthOkHttpClient

@Qualifier
@Retention(AnnotationRetention.BINARY)
public annotation class IstClock

private val IST_ZONE: ZoneId = ZoneId.of("Asia/Kolkata")

@Module
@InstallIn(SingletonComponent::class)
public abstract class BookingModule {
    @Binds
    internal abstract fun bindBookingRepository(impl: BookingRepositoryImpl): BookingRepository

    @Binds
    internal abstract fun bindSlotAvailabilityRepository(impl: SlotAvailabilityRepositoryImpl): SlotAvailabilityRepository

    public companion object {
        @Provides
        @Singleton
        @IstClock
        public fun provideIstClock(): Clock = Clock.system(IST_ZONE)

        @Provides
        @Singleton
        @AuthOkHttpClient
        public fun provideAuthOkHttpClient(
            idTokenCache: IdTokenCache,
            authenticator: FirebaseTokenAuthenticator,
        ): OkHttpClient =
            OkHttpClient
                .Builder()
                .addInterceptor { chain ->
                    // Non-blocking: reads the pre-fetched cached token.
                    // IdTokenCache refreshes every 55 min in the background so
                    // this read never blocks a dispatcher thread.
                    val token = idTokenCache.cachedToken
                    val req =
                        if (token != null) {
                            chain
                                .request()
                                .newBuilder()
                                .header("Authorization", "Bearer $token")
                                .build()
                        } else {
                            chain.request()
                        }
                    chain.proceed(req)
                }.addInterceptor(
                    HttpLoggingInterceptor().apply {
                        level =
                            if (BuildConfig.DEBUG) {
                                HttpLoggingInterceptor.Level.BODY
                            } else {
                                HttpLoggingInterceptor.Level.NONE
                            }
                    },
                ).authenticator(authenticator)
                .build()

        @Provides
        @Singleton
        public fun provideBookingApiService(
            @AuthOkHttpClient client: OkHttpClient,
            moshi: Moshi,
        ): BookingApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(BookingApiService::class.java)
    }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint3' diff --check 8cab4403ef84774eed5790aa789818f6832a7ac3" in C:\Alok\Business Projects\Urbanclap-sprint3
 succeeded in 996ms:
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

codex
The patch compiles and tests pass, but the new consent gate can be bypassed by existing navigation side effects and consent changes are not reliably applied to analytics/crash collection. These are functional/privacy regressions that should be fixed before considering the patch correct.

Full review comments:

- [P1] React to analytics consent changes — C:/Alok/Business Projects/Urbanclap-sprint3/customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt:88-90
  When a fresh install reaches this code, `consentState.first()` emits `NotGiven`, `initIfConsented(false)` runs, and nothing retries after the DPDP screen persists an analytics opt-in, so same-session analytics remain disabled until process restart. Conversely, if a user later disables analytics in settings after PostHog was initialized, this one-shot read never disables the facade, so consent changes need to be observed/applied rather than sampled once.

- [P1] Gate deep-link and pending-action navigation too — C:/Alok/Business Projects/Urbanclap-sprint3/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt:214-215
  When `consentRequired=true` for an authenticated returning user, this guard stops only auth-driven navigation; `PendingActionsNavEffect` and `DeepLinkEffect` above are still active and can navigate to booking/rating routes over the DPDP start destination when there is an active pending action or launch deep link. Gate those effects on `!consentRequired` as well so the consent screen cannot be bypassed.

- [P1] Honor the crash-report consent toggle — C:/Alok/Business Projects/Urbanclap-sprint3/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentUiState.kt:4-6
  When the user turns off crash reports or taps Decline all, `crashOptIn` is only stored/audited; no code reads it to disable Sentry, and `SentryInitializer.init` still runs before consent is loaded. That means users who decline crash reporting still send Sentry events/breadcrumbs, so this preference needs to gate Sentry init/beforeSend or be removed.

- [P2] Load existing choices in consent management — C:/Alok/Business Projects/Urbanclap-sprint3/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentViewModel.kt:27-28
  When this ViewModel is used by Settings → Manage consent, it always starts from `ConsentUiState()` instead of the stored `ConsentState`; for a user who previously declined analytics/crash, the screen shows them enabled, and tapping continue overwrites the saved opt-outs as true. Initialize the UI state from the current consent before allowing updates.
2026-05-22T20:19:48.182778Z ERROR codex_core::session: failed to record rollout items: thread 019e5150-89b7-73a3-a175-d8723b564496 not found
2026-05-22T20:19:48.290511Z ERROR codex_core::session: failed to record rollout items: thread 019e5150-857c-7322-a880-9a8ba7c6a0b6 not found
The patch compiles and tests pass, but the new consent gate can be bypassed by existing navigation side effects and consent changes are not reliably applied to analytics/crash collection. These are functional/privacy regressions that should be fixed before considering the patch correct.

Full review comments:

- [P1] React to analytics consent changes — C:/Alok/Business Projects/Urbanclap-sprint3/customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt:88-90
  When a fresh install reaches this code, `consentState.first()` emits `NotGiven`, `initIfConsented(false)` runs, and nothing retries after the DPDP screen persists an analytics opt-in, so same-session analytics remain disabled until process restart. Conversely, if a user later disables analytics in settings after PostHog was initialized, this one-shot read never disables the facade, so consent changes need to be observed/applied rather than sampled once.

- [P1] Gate deep-link and pending-action navigation too — C:/Alok/Business Projects/Urbanclap-sprint3/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt:214-215
  When `consentRequired=true` for an authenticated returning user, this guard stops only auth-driven navigation; `PendingActionsNavEffect` and `DeepLinkEffect` above are still active and can navigate to booking/rating routes over the DPDP start destination when there is an active pending action or launch deep link. Gate those effects on `!consentRequired` as well so the consent screen cannot be bypassed.

- [P1] Honor the crash-report consent toggle — C:/Alok/Business Projects/Urbanclap-sprint3/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentUiState.kt:4-6
  When the user turns off crash reports or taps Decline all, `crashOptIn` is only stored/audited; no code reads it to disable Sentry, and `SentryInitializer.init` still runs before consent is loaded. That means users who decline crash reporting still send Sentry events/breadcrumbs, so this preference needs to gate Sentry init/beforeSend or be removed.

- [P2] Load existing choices in consent management — C:/Alok/Business Projects/Urbanclap-sprint3/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/consent/ConsentViewModel.kt:27-28
  When this ViewModel is used by Settings → Manage consent, it always starts from `ConsentUiState()` instead of the stored `ConsentState`; for a user who previously declined analytics/crash, the screen shows them enabled, and tapping continue overwrites the saved opt-outs as true. Initialize the UI state from the current consent before allowing updates.
