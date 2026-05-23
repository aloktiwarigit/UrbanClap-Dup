OpenAI Codex v0.125.0 (research preview)
--------
workdir: C:\Alok\Business Projects\Urbanclap-sprint4
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR, C:\Users\alokt\.codex\memories]
reasoning effort: xhigh
reasoning summaries: none
session id: 019e528c-7d9d-7160-9a61-d516aaebc495
--------
user
changes against '6246eb25'
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff 6246eb259e9e277590b1661a4355a32d8eca72b4' in C:\Alok\Business Projects\Urbanclap-sprint4
2026-05-23T01:56:52.856665Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 7.7 seconds
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


 exited 1 in 7728ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1151ms:


    Directory: C:\Alok\Business Projects\Urbanclap-sprint4


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
d-----         5/22/2026   8:50 PM                .claire                                                              
d-----         5/22/2026   8:50 PM                .firebase                                                            
d-----         5/22/2026   8:50 PM                .githooks                                                            
d-----         5/22/2026   8:50 PM                .github                                                              
d-----         5/22/2026   8:50 PM                .serena                                                              
d-----         5/22/2026   8:50 PM                .superpowers                                                         
d-----         5/22/2026   8:53 PM                admin-web                                                            
d-----         5/22/2026   8:53 PM                api                                                                  
d-----         5/22/2026   8:50 PM                commonMain                                                           
d-----         5/22/2026   9:18 PM                core-nav                                                             
d-----         5/22/2026   9:19 PM                customer-app                                                         
d-----         5/22/2026   9:18 PM                design-system                                                        
d-----         5/22/2026   8:53 PM                docs                                                                 
d-----         5/22/2026   8:50 PM                figma                                                                
d-----         5/22/2026   8:53 PM                firebase                                                             
d-----         5/22/2026   8:53 PM                infra                                                                
d-----         5/22/2026   8:50 PM                moto-g-snapshots                                                     
d-----         5/22/2026   8:53 PM                plans                                                                
d-----         5/22/2026   8:50 PM                play-store-assets                                                    
d-----         5/22/2026   8:53 PM                technician-app                                                       
d-----         5/22/2026   8:53 PM                tools                                                                
d-----         5/22/2026   8:50 PM                _bmad                                                                
d-----         5/22/2026   8:50 PM                _bmad-output                                                         
-a----         5/22/2026   8:50 PM             26 .bmad-readiness-passed                                               
-a----         5/22/2026   9:55 PM            612 .codex-review-passed                                                 
-a----         5/22/2026   8:50 PM             63 .firebaserc                                                          
-a-h--         5/22/2026   8:50 PM             81 .git                                                                 
-a----         5/22/2026   8:50 PM            659 .gitattributes                                                       
-a----         5/22/2026   8:53 PM           3603 .gitignore                                                           
-a----         5/22/2026   8:50 PM            694 .semgrepignore                                                       
-a----         5/22/2026   8:50 PM          14551 CLAUDE.md                                                            
-a----         5/22/2026   8:50 PM            252 firebase.json                                                        
-a----         5/22/2026   8:50 PM           5369 TOKEN-SYNC.md                                                        



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -LiteralPath .git' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 971ms:
gitdir: C:/Alok/Business Projects/Urbanclap-dup/.git/worktrees/Urbanclap-sprint4

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Test-Path -LiteralPath 'C:\\Alok\\Business Projects\\Urbanclap-dup\\.git\\worktrees\\Urbanclap-sprint4'; Get-ChildItem -Force -LiteralPath 'C:\\Alok\\Business Projects\\Urbanclap-dup\\.git\\worktrees\\Urbanclap-sprint4' -ErrorAction SilentlyContinue" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1477ms:
True


    Directory: C:\Alok\Business Projects\Urbanclap-dup\.git\worktrees\Urbanclap-sprint4


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
d-----         5/22/2026   8:50 PM                logs                                                                 
d-----         5/22/2026   8:50 PM                refs                                                                 
-a----         5/22/2026   9:56 PM             76 COMMIT_EDITMSG                                                       
-a----         5/22/2026   8:50 PM              6 commondir                                                            
-a----         5/22/2026   8:50 PM             49 gitdir                                                               
-a----         5/22/2026   8:50 PM             47 HEAD                                                                 
-a----         5/22/2026   9:56 PM         317137 index                                                                
-a----         5/22/2026   8:50 PM             41 ORIG_HEAD                                                            



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'C:\\Alok\\Business Projects\\Urbanclap-dup\\.git\\worktrees\\Urbanclap-sprint4\\gitdir'; Get-Content -LiteralPath 'C:\\Alok\\Business Projects\\Urbanclap-dup\\.git\\worktrees\\Urbanclap-sprint4\\commondir'" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 892ms:
C:/Alok/Business Projects/Urbanclap-sprint4/.git
../..

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git status --short' in C:\Alok\Business Projects\Urbanclap-sprint4
2026-05-23T01:57:11.317605Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.7 seconds
Output:
fatal: detected dubious ownership in repository at 'C:/Alok/Business Projects/Urbanclap-sprint4'
'C:/Alok/Business Projects/Urbanclap-sprint4/.git' is owned by:
	Home/alokt (S-1-5-21-1726265981-1318906982-882074505-1001)
but the current user is:
	Home/CodexSandboxOffline (S-1-5-21-1726265981-1318906982-882074505-1004)
To add an exception for this directory, call:

	git config --global --add safe.directory 'C:/Alok/Business Projects/Urbanclap-sprint4'

 exited 1 in 665ms:
fatal: detected dubious ownership in repository at 'C:/Alok/Business Projects/Urbanclap-sprint4'
'C:/Alok/Business Projects/Urbanclap-sprint4/.git' is owned by:
	Home/alokt (S-1-5-21-1726265981-1318906982-882074505-1001)
but the current user is:
	Home/CodexSandboxOffline (S-1-5-21-1726265981-1318906982-882074505-1004)
To add an exception for this directory, call:

	git config --global --add safe.directory 'C:/Alok/Business Projects/Urbanclap-sprint4'

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint4' diff 6246eb259e9e277590b1661a4355a32d8eca72b4 --stat" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1663ms:
 .codex-review-passed                               | 11 +++-
 api/src/functions/devices.ts                       | 23 +++++++
 .../kotlin/com/homeservices/corenav/DeepLinkUri.kt |  2 +
 .../com/homeservices/corenav/DeepLinkUriTest.kt    | 36 ++++++++++
 customer-app/app/build.gradle.kts                  |  1 +
 .../customer/data/auth/SessionPrefsMigrator.kt     | 32 +++++----
 .../homeservices/customer/data/device/DeviceApi.kt |  8 +--
 .../navigation/PendingActionNavObserver.kt         | 23 ++++++-
 .../app/src/main/res/xml/data_extraction_rules.xml |  4 ++
 .../customer/backup/DataExtractionRulesTest.kt     | 77 ++++++++++++++++++++++
 .../customer/data/auth/SessionPrefsMigratorTest.kt | 43 ++++++++++++
 .../customer/data/device/DeviceApiWireTest.kt      | 74 +++++++++++++++++++++
 .../navigation/PendingActionNavObserverTest.kt     | 14 ++++
 13 files changed, 330 insertions(+), 18 deletions(-)
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint4' diff 6246eb259e9e277590b1661a4355a32d8eca72b4 --" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1718ms:
diff --git a/.codex-review-passed b/.codex-review-passed
index 155c54d0..b1a41fcc 100644
--- a/.codex-review-passed
+++ b/.codex-review-passed
@@ -1 +1,10 @@
-{"timestamp":"2026-05-22T16:33:42-04:00","commit":"b98e531e7b73cc155da182c7e37a1973633d9b0f","reviewer":"codex","model":"gpt-5.5","notes":"P1: analytics observer (not one-shot first()), nav bypass guard (PendingActionsNavEffect+DeepLinkEffect), Sentry crash consent gate. P2: ConsentViewModel loads stored consent. All 4 fixed before marker."}
+codex-review: PASSED
+branch: fix/sprint4-security-hardening
+base: fix/sprint3-dpdp-consent-posthog (sprint3 tip; sprint PRs #256/#263/#265/#267 pending merge to main)
+date: 2026-05-22
+findings-closed: SEC-04, SEC-05, SEC-06, SEC-07
+
+Paired API task (SEC-06): Server-side accept X-Device-Token header on DELETE /v1/devices/me
+is implemented in this PR. Legacy DELETE /v1/devices/{deviceToken} kept for transition window.
+Remove legacy path once minimum versionCode in Play Console confirms no old builds in active use.
+This paired task is acknowledged — Codex should cap SEC-06 server-side findings to 1 round.
diff --git a/api/src/functions/devices.ts b/api/src/functions/devices.ts
index b4b446af..6f1ae7b3 100644
--- a/api/src/functions/devices.ts
+++ b/api/src/functions/devices.ts
@@ -37,6 +37,29 @@ app.http('customerRegisterDevice', {
   handler: requireCustomer(customerRegisterDeviceHandler),
 });
 
+// ── Customer: DELETE /v1/devices/me (SEC-06: token in X-Device-Token header) ─────────────
+// New wire format — token is in X-Device-Token header, not in URL path.
+// The legacy /v1/devices/{deviceToken} endpoint is kept for the transition window while
+// old client builds (without SEC-06 fix) are still in the wild.
+
+export async function customerUnregisterDeviceMeHandler(
+  req: HttpRequest,
+  _ctx: InvocationContext,
+  customer: CustomerContext,
+): Promise<HttpResponseInit> {
+  const deviceToken = req.headers.get('x-device-token');
+  if (!deviceToken) return { status: 400, jsonBody: { code: 'MISSING_TOKEN' } };
+  await deviceTokenRepo.unregisterDeviceToken(customer.customerId, deviceToken);
+  return { status: 204 };
+}
+
+app.http('customerUnregisterDeviceMe', {
+  methods: ['DELETE'],
+  authLevel: 'anonymous',
+  route: 'v1/devices/me',
+  handler: requireCustomer(customerUnregisterDeviceMeHandler),
+});
+
 // ── Customer: DELETE /v1/devices/{deviceToken} ─────────────────────────────────
 
 export async function customerUnregisterDeviceHandler(
diff --git a/core-nav/src/main/kotlin/com/homeservices/corenav/DeepLinkUri.kt b/core-nav/src/main/kotlin/com/homeservices/corenav/DeepLinkUri.kt
index f8d7e605..6712a4dd 100644
--- a/core-nav/src/main/kotlin/com/homeservices/corenav/DeepLinkUri.kt
+++ b/core-nav/src/main/kotlin/com/homeservices/corenav/DeepLinkUri.kt
@@ -22,6 +22,7 @@ public object DeepLinkUri {
     private const val HOST = "action"
     private const val ENTITY_ID_KEY = "entityId"
     private const val ENCODING = "UTF-8"
+    private val ENTITY_ID_PATTERN = Regex("^[a-zA-Z0-9_-]{1,64}\$")
 
     /**
      * Build a deep-link URI string from a [NotificationIntent].
@@ -63,6 +64,7 @@ public object DeepLinkUri {
 
             val queryParams = parseQueryString(parsed.rawQuery ?: return null)
             val entityId = queryParams[ENTITY_ID_KEY]?.takeIf { it.isNotEmpty() } ?: return null
+            if (!ENTITY_ID_PATTERN.matches(entityId)) return null
 
             // Build rawArgs from remaining params (excluding entityId)
             val rawArgs = queryParams.filterKeys { it != ENTITY_ID_KEY }
diff --git a/core-nav/src/test/kotlin/com/homeservices/corenav/DeepLinkUriTest.kt b/core-nav/src/test/kotlin/com/homeservices/corenav/DeepLinkUriTest.kt
index 413a6e37..e4f9fc55 100644
--- a/core-nav/src/test/kotlin/com/homeservices/corenav/DeepLinkUriTest.kt
+++ b/core-nav/src/test/kotlin/com/homeservices/corenav/DeepLinkUriTest.kt
@@ -198,4 +198,40 @@ public class DeepLinkUriTest {
             assertThat(result).isNull()
         }
     }
+
+    // ── SEC-04: entityId allowlist validation ─────────────────────────────────
+
+    @Nested
+    public inner class EntityIdValidationTests {
+        @Test
+        public fun `parse returns null for traversal entityId`() {
+            // entityId = "../../delete_account" — must be rejected by allowlist
+            val uri = "homeservices://action/RATING_PROMPT_CUSTOMER?entityId=..%2F..%2Fdelete_account"
+            val result = DeepLinkUri.parse(uri)
+            assertThat(result).isNull()
+        }
+
+        @Test
+        public fun `parse returns null for entityId with slash`() {
+            val uri = "homeservices://action/ADDON_APPROVAL_REQUESTED?entityId=bk-001%2Ffoo"
+            val result = DeepLinkUri.parse(uri)
+            assertThat(result).isNull()
+        }
+
+        @Test
+        public fun `parse accepts valid alphanumeric entityId`() {
+            val uri = "homeservices://action/RATING_PROMPT_CUSTOMER?entityId=bk-test-123"
+            val result = DeepLinkUri.parse(uri)
+            assertThat(result).isNotNull()
+            assertThat(result!!.entityId).isEqualTo("bk-test-123")
+        }
+
+        @Test
+        public fun `parse rejects entityId longer than 64 characters`() {
+            val longId = "a".repeat(65)
+            val uri = "homeservices://action/RATING_PROMPT_CUSTOMER?entityId=$longId"
+            val result = DeepLinkUri.parse(uri)
+            assertThat(result).isNull()
+        }
+    }
 }
diff --git a/customer-app/app/build.gradle.kts b/customer-app/app/build.gradle.kts
index c4564d85..0ba61841 100644
--- a/customer-app/app/build.gradle.kts
+++ b/customer-app/app/build.gradle.kts
@@ -826,6 +826,7 @@ dependencies {
     testImplementation(libs.hilt.testing)
     testImplementation(libs.kotlinx.coroutines.test)
     testImplementation(libs.turbine)
+    testImplementation(libs.okhttp.mockwebserver)
     kspTest(libs.hilt.compiler)
 
     androidTestImplementation(libs.hilt.testing)
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/SessionPrefsMigrator.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/SessionPrefsMigrator.kt
index a2f548cf..88dcfec2 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/SessionPrefsMigrator.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/SessionPrefsMigrator.kt
@@ -6,20 +6,27 @@ import android.util.Log
 import java.security.KeyStore
 
 /**
- * One-time migration helper from the deprecated [androidx.security.crypto.MasterKeys]-based
- * EncryptedSharedPreferences (key alias `_androidx_security_master_key_`) to the new
- * [androidx.security.crypto.MasterKey.Builder]-based prefs.
+ * One-time migration helper that guards against a hypothetical legacy plaintext prefs file
+ * at the `auth_session` filename.
  *
- * Migration is safe and conservative:
- * - If the legacy key alias is absent, this is a no-op.
- * - If the legacy key is present, all key/value pairs are copied to [newPrefs] and the
- *   legacy prefs are cleared.
- * - On any error during migration, [newPrefs] is cleared so the session expires naturally
- *   (180-day TTL means this is a rare edge case).
+ * **Actual migration behavior (SEC-07):**
+ * The _known_ prior state of this app used [androidx.security.crypto.MasterKeys]-backed
+ * [androidx.security.crypto.EncryptedSharedPreferences] (key alias
+ * `_androidx_security_master_key_`). That file cannot be decrypted here because:
+ * - [MasterKeys] encrypted both the key _names_ and the values.
+ * - Opening the file as plaintext via [android.content.Context.getSharedPreferences]
+ *   returns ciphertext blobs under encrypted key names, not readable entries.
+ * - The [androidx.security.crypto.MasterKey] key alias may be unavailable (key rotation,
+ *   device restore, factory reset) so decryption is not attempted.
+ *
+ * Users whose legacy prefs were encrypted will silently re-login. This is the intended
+ * fallback — the session TTL would have expired anyway on most devices.
+ *
+ * This migrator only provides value for a hypothetical plaintext legacy prefs file
+ * (e.g. if a future rollback created one). It is a no-op for the encrypted case.
  *
  * The internal logic is split into [migrateIfNeededInternal] to support unit-testing without
- * Robolectric classloader constraints (objects with @JvmStatic are not intercept-able by
- * mockkObject in a Robolectric sandbox — see [SessionPrefsMigratorTest]).
+ * Robolectric classloader constraints (see [SessionPrefsMigratorTest]).
  */
 public object SessionPrefsMigrator {
     private const val TAG = "SessionPrefsMigrator"
@@ -87,6 +94,9 @@ public object SessionPrefsMigrator {
             return
         }
 
+        // Opening as plaintext. If the legacy file was written by EncryptedSharedPreferences,
+        // legacyPrefs.all returns encrypted key names as strings — migration "copies" them but
+        // produces useless entries; the session will be empty and the user must re-login.
         Log.i(TAG, "Legacy MasterKey alias found — migrating $newPrefsName")
         try {
             val legacyPrefs =
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/device/DeviceApi.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/device/DeviceApi.kt
index 9f93a429..d44e361b 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/device/DeviceApi.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/device/DeviceApi.kt
@@ -2,8 +2,8 @@ package com.homeservices.customer.data.device
 
 import retrofit2.http.Body
 import retrofit2.http.DELETE
+import retrofit2.http.Header
 import retrofit2.http.POST
-import retrofit2.http.Path
 
 /**
  * Retrofit interface for device-token registration endpoints.
@@ -12,7 +12,7 @@ import retrofit2.http.Path
  * attaches a Firebase Bearer token to every request.
  *
  * - POST /v1/devices/register  — register or refresh a device token
- * - DELETE /v1/devices/{token} — de-register a token on sign-out
+ * - DELETE /v1/devices/me      — de-register a token on sign-out; token sent as X-Device-Token header
  */
 public interface DeviceApi {
     @POST("v1/devices/register")
@@ -20,8 +20,8 @@ public interface DeviceApi {
         @Body body: RegisterDeviceRequest,
     )
 
-    @DELETE("v1/devices/{deviceToken}")
+    @DELETE("v1/devices/me")
     public suspend fun unregisterDevice(
-        @Path("deviceToken") deviceToken: String,
+        @Header("X-Device-Token") deviceToken: String,
     )
 }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/PendingActionNavObserver.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/PendingActionNavObserver.kt
index 59448e60..7d463e3d 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/PendingActionNavObserver.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/PendingActionNavObserver.kt
@@ -2,6 +2,11 @@ package com.homeservices.customer.navigation
 
 import com.homeservices.corenav.PendingActionType
 import com.homeservices.customer.ui.rating.RatingRoutes
+import io.sentry.Breadcrumb
+import io.sentry.Sentry
+import io.sentry.SentryLevel
+
+private val ENTITY_ID_PATTERN = Regex("^[a-zA-Z0-9_-]{1,64}\$")
 
 /**
  * Maps a [PendingActionType] and its entity ID to a Compose Nav route string,
@@ -11,6 +16,9 @@ import com.homeservices.customer.ui.rating.RatingRoutes
  * navigation from Room-observed [PendingAction] rows, replacing the legacy
  * [PriceApprovalEventBus] and [RatingPromptEventBus] approach.
  *
+ * SEC-04: [entityId] is validated against [ENTITY_ID_PATTERN] before use. Payloads
+ * with traversal or special characters are rejected with a Sentry breadcrumb.
+ *
  * @param type  The pending action type from the FCM/Room row.
  * @param entityId  The booking or complaint ID associated with the action.
  * @return The Compose Nav route string to navigate to, or null to suppress navigation.
@@ -18,9 +26,20 @@ import com.homeservices.customer.ui.rating.RatingRoutes
 public fun pendingActionNavRoute(
     type: PendingActionType,
     entityId: String,
-): String? =
-    when (type) {
+): String? {
+    if (!ENTITY_ID_PATTERN.matches(entityId)) {
+        Sentry.addBreadcrumb(
+            Breadcrumb().apply {
+                category = "security.nav"
+                message = "Rejected entityId with invalid format (SEC-04)"
+                level = SentryLevel.WARNING
+            },
+        )
+        return null
+    }
+    return when (type) {
         PendingActionType.ADDON_APPROVAL_REQUESTED -> BookingRoutes.priceApprovalRoute(entityId)
         PendingActionType.RATING_PROMPT_CUSTOMER -> RatingRoutes.route(entityId)
         else -> null
     }
+}
diff --git a/customer-app/app/src/main/res/xml/data_extraction_rules.xml b/customer-app/app/src/main/res/xml/data_extraction_rules.xml
index d5647393..ad425fa8 100644
--- a/customer-app/app/src/main/res/xml/data_extraction_rules.xml
+++ b/customer-app/app/src/main/res/xml/data_extraction_rules.xml
@@ -3,9 +3,13 @@
     <cloud-backup>
         <exclude domain="root" />
         <exclude domain="sharedpref" />
+        <exclude domain="database" />
+        <exclude domain="file" />
     </cloud-backup>
     <device-transfer>
         <exclude domain="root" />
         <exclude domain="sharedpref" />
+        <exclude domain="database" />
+        <exclude domain="file" />
     </device-transfer>
 </data-extraction-rules>
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/backup/DataExtractionRulesTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/backup/DataExtractionRulesTest.kt
new file mode 100644
index 00000000..8061e624
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/backup/DataExtractionRulesTest.kt
@@ -0,0 +1,77 @@
+package com.homeservices.customer.backup
+
+import android.content.Context
+import androidx.test.core.app.ApplicationProvider
+import com.homeservices.customer.R
+import org.assertj.core.api.Assertions.assertThat
+import org.junit.Test
+import org.junit.runner.RunWith
+import org.robolectric.RobolectricTestRunner
+import org.robolectric.annotation.Config
+
+/**
+ * SEC-05: Verifies that data_extraction_rules.xml excludes the `database` and `file`
+ * domains from both cloud-backup and device-transfer.
+ *
+ * Room DB (pending_actions.db) and internal files must not leak to cloud backup or
+ * device-to-device transfers. These tests will FAIL until the XML is updated to add
+ * the missing `<exclude domain="database"/>` and `<exclude domain="file"/>` entries.
+ */
+@RunWith(RobolectricTestRunner::class)
+@Config(sdk = [31])
+public class DataExtractionRulesTest {
+    @Test
+    public fun `cloud-backup excludes database domain`() {
+        assertExcludePresent(block = "cloud-backup", domain = "database")
+    }
+
+    @Test
+    public fun `cloud-backup excludes file domain`() {
+        assertExcludePresent(block = "cloud-backup", domain = "file")
+    }
+
+    @Test
+    public fun `device-transfer excludes database domain`() {
+        assertExcludePresent(block = "device-transfer", domain = "database")
+    }
+
+    @Test
+    public fun `device-transfer excludes file domain`() {
+        assertExcludePresent(block = "device-transfer", domain = "file")
+    }
+
+    private fun assertExcludePresent(
+        block: String,
+        domain: String,
+    ) {
+        val excludedDomains = parseDataExtractionRules()
+        assertThat(excludedDomains[block])
+            .withFailMessage(
+                "Expected <exclude domain=\"$domain\"/> inside <$block> but found: ${excludedDomains[block]}",
+            ).contains(domain)
+    }
+
+    private fun parseDataExtractionRules(): Map<String, Set<String>> {
+        val context = ApplicationProvider.getApplicationContext<Context>()
+        val parser = context.resources.getXml(R.xml.data_extraction_rules)
+        val excludedDomains = mutableMapOf<String, MutableSet<String>>()
+        var currentBlock: String? = null
+        generateSequence { parser.next().takeIf { it != org.xmlpull.v1.XmlPullParser.END_DOCUMENT } }
+            .forEach { eventType ->
+                when {
+                    eventType == org.xmlpull.v1.XmlPullParser.START_TAG &&
+                        parser.name in listOf("cloud-backup", "device-transfer") -> currentBlock = parser.name
+                    eventType == org.xmlpull.v1.XmlPullParser.START_TAG &&
+                        parser.name == "exclude" -> {
+                        val domainAttr = parser.getAttributeValue(null, "domain") ?: return@forEach
+                        val block = currentBlock ?: return@forEach
+                        excludedDomains.getOrPut(block) { mutableSetOf() }.add(domainAttr)
+                    }
+                    eventType == org.xmlpull.v1.XmlPullParser.END_TAG &&
+                        parser.name == currentBlock -> currentBlock = null
+                }
+            }
+        parser.close()
+        return excludedDomains
+    }
+}
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/auth/SessionPrefsMigratorTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/auth/SessionPrefsMigratorTest.kt
index b596f4a2..0b45a7ce 100644
--- a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/auth/SessionPrefsMigratorTest.kt
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/auth/SessionPrefsMigratorTest.kt
@@ -147,4 +147,47 @@ public class SessionPrefsMigratorTest {
         // on a device/emulator; Robolectric does not exercise SharedPreferences exceptions.
         assertThat(newPrefs.getString("uid", null)).isEqualTo("stale-uid")
     }
+
+    /**
+     * SEC-07: Documents the failure mode when legacy prefs were written by
+     * MasterKeys-backed EncryptedSharedPreferences.
+     *
+     * When EncryptedSharedPreferences writes to a file, BOTH the key and the value
+     * are encrypted. Reading the file as plain SharedPreferences yields opaque blobs
+     * under encrypted key names — NOT the original "uid" / "phone_last_four" keys.
+     * The migrator copies those garbage-keyed entries into new prefs, leaving no
+     * standard session keys → user is forced to re-login.
+     *
+     * This test documents (and regression-protects) that failure mode so that any
+     * future migrator change which accidentally hides the empty-session outcome is
+     * immediately caught.
+     */
+    @Test
+    public fun `migration with legacy encrypted file produces empty new prefs (forces re-login)`() {
+        // Simulate what happens when legacy prefs were written by EncryptedSharedPreferences:
+        // the key names themselves are encrypted, so "uid" and "phone_last_four" are never
+        // stored under those literal key names. The migrator reads these garbage-key entries
+        // and copies them under their encrypted (unreadable) key names into new prefs.
+        // Result: newPrefs has no "uid" key → session is empty → user must re-login.
+        val legacyPrefs = context.getSharedPreferences("auth_session", Context.MODE_PRIVATE)
+        legacyPrefs
+            .edit()
+            .putString("AES256_ENCRYPTED_KEY_BLOB_1", "AES256_ENCRYPTED_VALUE_BLOB_1") // simulates encrypted uid entry
+            .putString("AES256_ENCRYPTED_KEY_BLOB_2", "AES256_ENCRYPTED_VALUE_BLOB_2") // simulates encrypted phone entry
+            .commit()
+
+        val newPrefs = context.getSharedPreferences("auth_session_new_target", Context.MODE_PRIVATE)
+
+        SessionPrefsMigrator.migrateIfNeededInternal(
+            context = context,
+            newPrefs = newPrefs,
+            newPrefsName = "auth_session_new_target",
+            legacyKeyPresent = true,
+        )
+
+        // The migration "succeeded" but copied useless encrypted key names.
+        // Standard session keys are absent → user is forced to re-login.
+        assertThat(newPrefs.getString("uid", null)).isNull()
+        assertThat(newPrefs.getString("phone_last_four", null)).isNull()
+    }
 }
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/device/DeviceApiWireTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/device/DeviceApiWireTest.kt
new file mode 100644
index 00000000..7d371b3c
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/device/DeviceApiWireTest.kt
@@ -0,0 +1,74 @@
+package com.homeservices.customer.data.device
+
+import kotlinx.coroutines.test.runTest
+import okhttp3.OkHttpClient
+import okhttp3.mockwebserver.MockResponse
+import okhttp3.mockwebserver.MockWebServer
+import org.assertj.core.api.Assertions.assertThat
+import org.junit.After
+import org.junit.Before
+import org.junit.Test
+import retrofit2.Retrofit
+import retrofit2.converter.moshi.MoshiConverterFactory
+
+/**
+ * Wire-format test for [DeviceApi.unregisterDevice].
+ *
+ * SEC-06 fix: the token must travel as an X-Device-Token header on
+ * DELETE /v1/devices/me — NOT in the URL path where it leaks to proxy logs.
+ *
+ * These tests will FAIL against the current `@DELETE("v1/devices/{deviceToken}")`
+ * declaration. They will pass once the interface is updated to:
+ *   @DELETE("v1/devices/me")
+ *   suspend fun unregisterDevice(@Header("X-Device-Token") deviceToken: String)
+ */
+public class DeviceApiWireTest {
+    private lateinit var server: MockWebServer
+    private lateinit var api: DeviceApi
+
+    @Before
+    public fun setUp() {
+        server = MockWebServer()
+        server.start()
+        api =
+            Retrofit
+                .Builder()
+                .baseUrl(server.url("/"))
+                .client(OkHttpClient())
+                .addConverterFactory(MoshiConverterFactory.create())
+                .build()
+                .create(DeviceApi::class.java)
+    }
+
+    @After
+    public fun tearDown() {
+        server.shutdown()
+    }
+
+    @Test
+    public fun `unregisterDevice sends DELETE to slash-v1-slash-devices-slash-me`(): Unit =
+        runTest {
+            server.enqueue(MockResponse().setResponseCode(204))
+            api.unregisterDevice("test-fcm-token-xyz")
+            val request = server.takeRequest()
+            assertThat(request.path).isEqualTo("/v1/devices/me")
+        }
+
+    @Test
+    public fun `unregisterDevice sends token as X-Device-Token header`(): Unit =
+        runTest {
+            server.enqueue(MockResponse().setResponseCode(204))
+            api.unregisterDevice("test-fcm-token-xyz")
+            val request = server.takeRequest()
+            assertThat(request.getHeader("X-Device-Token")).isEqualTo("test-fcm-token-xyz")
+        }
+
+    @Test
+    public fun `unregisterDevice does NOT include token in URL path`(): Unit =
+        runTest {
+            server.enqueue(MockResponse().setResponseCode(204))
+            api.unregisterDevice("test-fcm-token-xyz")
+            val request = server.takeRequest()
+            assertThat(request.path).doesNotContain("test-fcm-token-xyz")
+        }
+}
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/navigation/PendingActionNavObserverTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/navigation/PendingActionNavObserverTest.kt
index 60af1bd1..7d163787 100644
--- a/customer-app/app/src/test/kotlin/com/homeservices/customer/navigation/PendingActionNavObserverTest.kt
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/navigation/PendingActionNavObserverTest.kt
@@ -42,4 +42,18 @@ public class PendingActionNavObserverTest {
         val route = pendingActionNavRoute(PendingActionType.SUPPORT_FOLLOWUP, "t-1")
         assertThat(route).isNull()
     }
+
+    // ── SEC-04: entityId allowlist validation ─────────────────────────────────
+
+    @Test
+    public fun `traversal entityId is rejected and returns null`() {
+        val route = pendingActionNavRoute(PendingActionType.ADDON_APPROVAL_REQUESTED, "../../delete_account")
+        assertThat(route).isNull()
+    }
+
+    @Test
+    public fun `entityId with special characters is rejected`() {
+        val route = pendingActionNavRoute(PendingActionType.RATING_PROMPT_CUSTOMER, "<script>alert(1)</script>")
+        assertThat(route).isNull()
+    }
 }
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'api/src/functions/devices.ts'" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1393ms:
import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireCustomer } from '../middleware/requireCustomer.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { RegisterDeviceTokenBodySchema } from '../schemas/device-token.js';
import { deviceTokenRepo } from '../cosmos/device-token-repository.js';
import type { CustomerContext } from '../types/customer.js';
import type { AdminContext } from '../types/admin.js';

// â”€â”€ Customer: POST /v1/devices/register â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function customerRegisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  customer: CustomerContext,
): Promise<HttpResponseInit> {
  const body = RegisterDeviceTokenBodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return { status: 400, jsonBody: { code: 'INVALID_BODY', errors: body.error.issues } };
  }
  await deviceTokenRepo.registerDeviceToken(
    customer.customerId,
    'customer',
    body.data.deviceToken,
    body.data.platform,
    body.data.appBuild,
  );
  return { status: 204 };
}

app.http('customerRegisterDevice', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/devices/register',
  handler: requireCustomer(customerRegisterDeviceHandler),
});

// â”€â”€ Customer: DELETE /v1/devices/me (SEC-06: token in X-Device-Token header) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// New wire format â€” token is in X-Device-Token header, not in URL path.
// The legacy /v1/devices/{deviceToken} endpoint is kept for the transition window while
// old client builds (without SEC-06 fix) are still in the wild.

export async function customerUnregisterDeviceMeHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  customer: CustomerContext,
): Promise<HttpResponseInit> {
  const deviceToken = req.headers.get('x-device-token');
  if (!deviceToken) return { status: 400, jsonBody: { code: 'MISSING_TOKEN' } };
  await deviceTokenRepo.unregisterDeviceToken(customer.customerId, deviceToken);
  return { status: 204 };
}

app.http('customerUnregisterDeviceMe', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'v1/devices/me',
  handler: requireCustomer(customerUnregisterDeviceMeHandler),
});

// â”€â”€ Customer: DELETE /v1/devices/{deviceToken} â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function customerUnregisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  customer: CustomerContext,
): Promise<HttpResponseInit> {
  const deviceToken = req.params['deviceToken'];
  if (!deviceToken) return { status: 400, jsonBody: { code: 'MISSING_TOKEN' } };
  await deviceTokenRepo.unregisterDeviceToken(customer.customerId, deviceToken);
  return { status: 204 };
}

app.http('customerUnregisterDevice', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'v1/devices/{deviceToken}',
  handler: requireCustomer(customerUnregisterDeviceHandler),
});

// â”€â”€ Technician: POST /v1/technician/devices/register â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function technicianRegisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const { uid } = await verifyTechnicianToken(req);
    const body = RegisterDeviceTokenBodySchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return { status: 400, jsonBody: { code: 'INVALID_BODY', errors: body.error.issues } };
    }
    await deviceTokenRepo.registerDeviceToken(
      uid,
      'technician',
      body.data.deviceToken,
      body.data.platform,
      body.data.appBuild,
    );
    return { status: 204 };
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }
}

app.http('technicianRegisterDevice', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/technician/devices/register',
  handler: technicianRegisterDeviceHandler,
});

// â”€â”€ Technician: DELETE /v1/technician/devices/{deviceToken} â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function technicianUnregisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const { uid } = await verifyTechnicianToken(req);
    const deviceToken = req.params['deviceToken'];
    if (!deviceToken) return { status: 400, jsonBody: { code: 'MISSING_TOKEN' } };
    await deviceTokenRepo.unregisterDeviceToken(uid, deviceToken);
    return { status: 204 };
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }
}

app.http('technicianUnregisterDevice', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'v1/technician/devices/{deviceToken}',
  handler: technicianUnregisterDeviceHandler,
});

// â”€â”€ Admin: POST /admin/v1/devices/register â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function adminRegisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const body = RegisterDeviceTokenBodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return { status: 400, jsonBody: { code: 'INVALID_BODY', errors: body.error.issues } };
  }
  await deviceTokenRepo.registerDeviceToken(
    admin.adminId,
    'admin',
    body.data.deviceToken,
    body.data.platform,
    body.data.appBuild,
  );
  return { status: 204 };
}

app.http('adminRegisterDevice', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'admin/v1/devices/register',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminRegisterDeviceHandler),
});

// â”€â”€ Admin: DELETE /admin/v1/devices/{deviceToken} â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function adminUnregisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const deviceToken = req.params['deviceToken'];
  if (!deviceToken) return { status: 400, jsonBody: { code: 'MISSING_TOKEN' } };
  await deviceTokenRepo.unregisterDeviceToken(admin.adminId, deviceToken);
  return { status: 204 };
}

app.http('adminUnregisterDevice', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'admin/v1/devices/{deviceToken}',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminUnregisterDeviceHandler),
});

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'core-nav/src/main/kotlin/com/homeservices/corenav/DeepLinkUri.kt'" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 819ms:
package com.homeservices.corenav

import java.net.URI
import java.net.URLDecoder
import java.net.URLEncoder

/**
 * Pure builder/parser for `homeservices://action/<TYPE>?<args>` deep-link URIs.
 *
 * This object has no Android dependencies and is fully unit-testable on JVM.
 *
 * URI format:
 *   scheme:  homeservices
 *   host:    action
 *   path:    /<PendingActionType.name>
 *   query:   entityId=<entityId>&<rawArgs key=value pairs>
 *
 * All arg values are URL-encoded to handle special characters (spaces, &, =, unicode).
 */
public object DeepLinkUri {
    private const val SCHEME = "homeservices"
    private const val HOST = "action"
    private const val ENTITY_ID_KEY = "entityId"
    private const val ENCODING = "UTF-8"
    private val ENTITY_ID_PATTERN = Regex("^[a-zA-Z0-9_-]{1,64}\$")

    /**
     * Build a deep-link URI string from a [NotificationIntent].
     *
     * The [NotificationIntent.entityId] is always included as the `entityId` query parameter.
     * Additional [NotificationIntent.rawArgs] are appended after `entityId`.
     */
    public fun build(intent: NotificationIntent): String {
        val sb = StringBuilder()
        sb.append("$SCHEME://$HOST/${intent.type.name}")
        sb.append("?$ENTITY_ID_KEY=${encode(intent.entityId)}")
        intent.rawArgs.forEach { (key, value) ->
            sb.append("&${encode(key)}=${encode(value)}")
        }
        return sb.toString()
    }

    /**
     * Parse a deep-link URI string into a [NotificationIntent].
     *
     * Returns null if:
     * - The URI is malformed or cannot be parsed
     * - The scheme is not "homeservices"
     * - The host is not "action"
     * - The path segment does not match any [PendingActionType] value
     * - The `entityId` query parameter is missing or empty
     */
    @Suppress("ReturnCount") // guard-clause pattern: each early return handles a distinct malformed-URI case
    public fun parse(uri: String): NotificationIntent? {
        if (uri.isBlank()) return null
        return try {
            val parsed = URI(uri)
            if (parsed.scheme != SCHEME) return null
            if (parsed.host != HOST) return null

            // Path is "/<TYPE>" â€” strip the leading slash
            val typeName = parsed.path?.trimStart('/') ?: return null
            val type = runCatching { PendingActionType.valueOf(typeName) }.getOrNull() ?: return null

            val queryParams = parseQueryString(parsed.rawQuery ?: return null)
            val entityId = queryParams[ENTITY_ID_KEY]?.takeIf { it.isNotEmpty() } ?: return null
            if (!ENTITY_ID_PATTERN.matches(entityId)) return null

            // Build rawArgs from remaining params (excluding entityId)
            val rawArgs = queryParams.filterKeys { it != ENTITY_ID_KEY }

            NotificationIntent(
                type = type,
                entityId = entityId,
                rawArgs = rawArgs,
            )
        } catch (_: Exception) {
            null
        }
    }

    // â”€â”€ Private helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private fun encode(value: String): String = URLEncoder.encode(value, ENCODING)

    private fun decode(value: String): String = URLDecoder.decode(value, ENCODING)

    /**
     * Parse a raw query string (no leading `?`) into a map of decoded key-value pairs.
     * Handles URL-encoded keys and values.
     */
    private fun parseQueryString(rawQuery: String): Map<String, String> {
        if (rawQuery.isBlank()) return emptyMap()
        return rawQuery
            .split("&")
            .mapNotNull { pair ->
                val idx = pair.indexOf('=')
                if (idx < 0) return@mapNotNull null
                val key = decode(pair.substring(0, idx))
                val value = decode(pair.substring(idx + 1))
                key to value
            }.toMap()
    }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path 'customer-app/app/build.gradle.kts' -Pattern 'sentry|io.sentry' -CaseSensitive:"'$false -Context 2,2' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 610ms:

  customer-app\app\build.gradle.kts:145:        buildConfigField(
  customer-app\app\build.gradle.kts:146:            "String",
> customer-app\app\build.gradle.kts:147:            "SENTRY_DSN",
> customer-app\app\build.gradle.kts:148:            "\"${System.getenv("SENTRY_DSN") ?: ""}\"",
  customer-app\app\build.gradle.kts:149:        )
  customer-app\app\build.gradle.kts:150:        buildConfigField(
  customer-app\app\build.gradle.kts:762:    implementation(libs.androidx.hilt.navigation.compose)
  customer-app\app\build.gradle.kts:763:
> customer-app\app\build.gradle.kts:764:    implementation(libs.sentry.android)
  customer-app\app\build.gradle.kts:765:    implementation(libs.posthog.android)
  customer-app\app\build.gradle.kts:766:    implementation(libs.growthbook.android)



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Filter '*libs*versions*.toml' | Select-Object -ExpandProperty FullName" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 2642ms:
C:\Alok\Business Projects\Urbanclap-sprint4\customer-app\gradle\libs.versions.toml
C:\Alok\Business Projects\Urbanclap-sprint4\design-system\gradle\libs.versions.toml
C:\Alok\Business Projects\Urbanclap-sprint4\technician-app\gradle\libs.versions.toml

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path 'customer-app/gradle/libs.versions.toml' -Pattern 'mockwebserver|okhttp' -CaseSensitive:"'$false -Context 2,2' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1138ms:

  customer-app\gradle\libs.versions.toml:28:# Feature flags
  customer-app\gradle\libs.versions.toml:29:growthbook = "7.1.1"
> customer-app\gradle\libs.versions.toml:30:growthbookOkHttp = "1.0.8"
  customer-app\gradle\libs.versions.toml:31:
  customer-app\gradle\libs.versions.toml:32:# Observability
  customer-app\gradle\libs.versions.toml:43:# Networking / serialisation / image loading
  customer-app\gradle\libs.versions.toml:44:retrofit = "2.11.0"
> customer-app\gradle\libs.versions.toml:45:okhttp = "4.12.0"
  customer-app\gradle\libs.versions.toml:46:moshi = "1.15.1"
  customer-app\gradle\libs.versions.toml:47:coil = "2.7.0"
  customer-app\gradle\libs.versions.toml:131:# Feature flags
  customer-app\gradle\libs.versions.toml:132:growthbook-android = { module = "io.growthbook.sdk:GrowthBook", 
version.ref = "growthbook" }
> customer-app\gradle\libs.versions.toml:133:growthbook-okhttp = { module = 
"io.growthbook.sdk:NetworkDispatcherOkHttp", version.ref = "growthbookOkHttp" }
  customer-app\gradle\libs.versions.toml:134:
  customer-app\gradle\libs.versions.toml:135:# Observability
  customer-app\gradle\libs.versions.toml:148:retrofit-core        = { module = "com.squareup.retrofit2:retrofit",      
         version.ref = "retrofit" }
  customer-app\gradle\libs.versions.toml:149:retrofit-moshi       = { module = 
"com.squareup.retrofit2:converter-moshi",        version.ref = "retrofit" }
> customer-app\gradle\libs.versions.toml:150:okhttp-core          = { module = "com.squareup.okhttp3:okhttp",          
         version.ref = "okhttp" }
> customer-app\gradle\libs.versions.toml:151:okhttp-logging       = { module = 
"com.squareup.okhttp3:logging-interceptor",      version.ref = "okhttp" }
> customer-app\gradle\libs.versions.toml:152:okhttp-mockwebserver = { module = "com.squareup.okhttp3:mockwebserver",   
         version.ref = "okhttp" }
  customer-app\gradle\libs.versions.toml:153:moshi-kotlin         = { module = "com.squareup.moshi:moshi-kotlin",      
         version.ref = "moshi" }
  customer-app\gradle\libs.versions.toml:154:moshi-kotlin-codegen = { module = 
"com.squareup.moshi:moshi-kotlin-codegen",       version.ref = "moshi" }



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -LiteralPath 'api' -Force; Get-Content -LiteralPath 'api/package.json'" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 607ms:


    Directory: C:\Alok\Business Projects\Urbanclap-sprint4\api


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
d-----         5/22/2026   8:50 PM                .claude                                                              
d-----         5/22/2026   8:50 PM                docs                                                                 
d-----         5/22/2026   8:50 PM                plans                                                                
d-----         5/22/2026   8:53 PM                scripts                                                              
d-----         5/22/2026   8:50 PM                specs                                                                
d-----         5/22/2026   8:50 PM                src                                                                  
d-----         5/22/2026   8:53 PM                tests                                                                
-a----         5/22/2026   8:50 PM            147 .editorconfig                                                        
-a----         5/22/2026   8:50 PM            305 .funcignore                                                          
-a----         5/22/2026   8:50 PM              3 .nvmrc                                                               
-a----         5/22/2026   8:50 PM             45 .prettierignore                                                      
-a----         5/22/2026   8:50 PM             89 .prettierrc.json                                                     
-a----         5/22/2026   8:53 PM           8205 .semgrep.yml                                                         
-a----         5/22/2026   8:50 PM             26 .spectral.yaml                                                       
-a----         5/22/2026   8:50 PM           6656 CLAUDE.md                                                            
-a----         5/22/2026   8:50 PM           1469 eslint.config.mjs                                                    
-a----         5/22/2026   8:50 PM            289 host.json                                                            
-a----         5/22/2026   8:50 PM            570 local.settings.example.json                                          
-a----         5/22/2026   8:53 PM          86808 openapi.json                                                         
-a----         5/22/2026   8:50 PM         503789 package-lock.json                                                    
-a----         5/22/2026   8:53 PM           2337 package.json                                                         
-a----         5/22/2026   8:50 PM         299204 pnpm-lock.yaml                                                       
-a----         5/22/2026   8:50 PM           3981 README.md                                                            
-a----         5/22/2026   8:50 PM            469 tsconfig.json                                                        
-a----         5/22/2026   8:50 PM            166 tsconfig.tests.json                                                  
-a----         5/22/2026   8:53 PM           4924 vitest.config.ts                                                     
{
  "name": "homeservices-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.15.4",
  "main": "dist/functions/**/*.js",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "dev": "pnpm build && func start",
    "dev:direct": "pnpm build && func start",
    "dev:watch": "tsc --watch",
    "build": "tsc",
    "start": "func start",
    "typecheck": "tsc --noEmit -p tsconfig.tests.json",
    "lint": "eslint . --max-warnings 0",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "openapi:build": "tsx src/openapi/build.ts",
    "openapi:lint": "spectral lint openapi.json --fail-severity error",
    "seed:admin": "tsx scripts/seed-admin.ts",
    "invite:admin": "tsx scripts/invite-admin.ts",
    "seed:technicians": "npx tsx scripts/seed-technicians.ts",
    "seed:catalogue": "tsx src/cosmos/seeds/catalogue.ts",
    "seed:complaints": "tsx src/cosmos/seeds/complaints.ts",
    "provision:indexes": "tsx scripts/provision-cosmos-indexes.ts",
    "semgrep:scan": "semgrep --config .semgrep.yml src/"
  },
  "dependencies": {
    "@azure/ai-form-recognizer": "^5.1.0",
    "@azure/communication-email": "^1.1.0",
    "@azure/cosmos": "^4.9.2",
    "@azure/functions": "^4.5.0",
    "@azure/monitor-opentelemetry-exporter": "1.0.0-beta.32",
    "@growthbook/growthbook": "^1",
    "@opentelemetry/resources": "^1",
    "@opentelemetry/sdk-node": "^0.57",
    "@sentry/node": "^8",
    "@turf/boolean-point-in-polygon": "^7.3.5",
    "@turf/helpers": "^7.3.5",
    "fastify": "^5",
    "firebase-admin": "^13.8.0",
    "jose": "^6.2.2",
    "otplib": "^13.4.0",
    "pdfkit": "^0.18.0",
    "posthog-node": "^4",
    "qrcode": "^1.5.4",
    "razorpay": "^2.9.6",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@apidevtools/swagger-parser": "^10.1.0",
    "@asteasolutions/zod-to-openapi": "^7.3.0",
    "@stoplight/spectral-cli": "^6.11.0",
    "@types/geojson": "^7946.0.16",
    "@types/node": "^22",
    "@types/pdfkit": "^0.17.6",
    "@types/qrcode": "^1.5.6",
    "@vitest/coverage-v8": "^2",
    "eslint": "^9",
    "eslint-plugin-import": "^2",
    "prettier": "^3",
    "supertest": "^7",
    "testcontainers": "^10",
    "tsx": "^4",
    "typescript": "^5.6.0",
    "typescript-eslint": "^8",
    "vitest": "^2"
  }
}



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Test-Path -LiteralPath 'api/node_modules'; if (Test-Path -LiteralPath 'api/node_modules') { Get-ChildItem -LiteralPath 'api/node_modules/@azure/functions' -Force | Select-Object -First 5 }" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 608ms:
False

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path 'api/openapi.json','api/src/openapi/**/*.ts','api/src/**/*.ts' -Pattern 'devices' -Context 1,3 | Select-Object -First 100" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 739ms:

  api\src\functions\devices.ts:11:
> api\src\functions\devices.ts:12:// ── Customer: POST /v1/devices/register ───────────────────────────────────────
  api\src\functions\devices.ts:13:
  api\src\functions\devices.ts:14:export async function customerRegisterDeviceHandler(
  api\src\functions\devices.ts:15:  req: HttpRequest,
  api\src\functions\devices.ts:35:  authLevel: 'anonymous',
> api\src\functions\devices.ts:36:  route: 'v1/devices/register',
  api\src\functions\devices.ts:37:  handler: requireCustomer(customerRegisterDeviceHandler),
  api\src\functions\devices.ts:38:});
  api\src\functions\devices.ts:39:
> api\src\functions\devices.ts:40:// ── Customer: DELETE /v1/devices/me (SEC-06: token in X-Device-Token header) 
─────────────
  api\src\functions\devices.ts:41:// New wire format — token is in X-Device-Token header, not in URL path.
> api\src\functions\devices.ts:42:// The legacy /v1/devices/{deviceToken} endpoint is kept for the transition window 
while
  api\src\functions\devices.ts:43:// old client builds (without SEC-06 fix) are still in the wild.
  api\src\functions\devices.ts:44:
  api\src\functions\devices.ts:45:export async function customerUnregisterDeviceMeHandler(
  api\src\functions\devices.ts:58:  authLevel: 'anonymous',
> api\src\functions\devices.ts:59:  route: 'v1/devices/me',
  api\src\functions\devices.ts:60:  handler: requireCustomer(customerUnregisterDeviceMeHandler),
  api\src\functions\devices.ts:61:});
  api\src\functions\devices.ts:62:
> api\src\functions\devices.ts:63:// ── Customer: DELETE /v1/devices/{deviceToken} ─────────────────────────────────
  api\src\functions\devices.ts:64:
  api\src\functions\devices.ts:65:export async function customerUnregisterDeviceHandler(
  api\src\functions\devices.ts:66:  req: HttpRequest,
  api\src\functions\devices.ts:78:  authLevel: 'anonymous',
> api\src\functions\devices.ts:79:  route: 'v1/devices/{deviceToken}',
  api\src\functions\devices.ts:80:  handler: requireCustomer(customerUnregisterDeviceHandler),
  api\src\functions\devices.ts:81:});
  api\src\functions\devices.ts:82:
> api\src\functions\devices.ts:83:// ── Technician: POST /v1/technician/devices/register ─────────────────────────
  api\src\functions\devices.ts:84:
  api\src\functions\devices.ts:85:export async function technicianRegisterDeviceHandler(
  api\src\functions\devices.ts:86:  req: HttpRequest,
  api\src\functions\devices.ts:110:  authLevel: 'anonymous',
> api\src\functions\devices.ts:111:  route: 'v1/technician/devices/register',
  api\src\functions\devices.ts:112:  handler: technicianRegisterDeviceHandler,
  api\src\functions\devices.ts:113:});
  api\src\functions\devices.ts:114:
> api\src\functions\devices.ts:115:// ── Technician: DELETE /v1/technician/devices/{deviceToken} ───────────────────
  api\src\functions\devices.ts:116:
  api\src\functions\devices.ts:117:export async function technicianUnregisterDeviceHandler(
  api\src\functions\devices.ts:118:  req: HttpRequest,
  api\src\functions\devices.ts:134:  authLevel: 'anonymous',
> api\src\functions\devices.ts:135:  route: 'v1/technician/devices/{deviceToken}',
  api\src\functions\devices.ts:136:  handler: technicianUnregisterDeviceHandler,
  api\src\functions\devices.ts:137:});
  api\src\functions\devices.ts:138:
> api\src\functions\devices.ts:139:// ── Admin: POST /admin/v1/devices/register ─────────────────────────────────────
  api\src\functions\devices.ts:140:
  api\src\functions\devices.ts:141:export async function adminRegisterDeviceHandler(
  api\src\functions\devices.ts:142:  req: HttpRequest,
  api\src\functions\devices.ts:162:  authLevel: 'anonymous',
> api\src\functions\devices.ts:163:  route: 'admin/v1/devices/register',
  api\src\functions\devices.ts:164:  handler: requireAdmin(['super-admin', 'ops-manager'])(adminRegisterDeviceHandler),
  api\src\functions\devices.ts:165:});
  api\src\functions\devices.ts:166:
> api\src\functions\devices.ts:167:// ── Admin: DELETE /admin/v1/devices/{deviceToken} ──────────────────────────────
  api\src\functions\devices.ts:168:
  api\src\functions\devices.ts:169:export async function adminUnregisterDeviceHandler(
  api\src\functions\devices.ts:170:  req: HttpRequest,
  api\src\functions\devices.ts:182:  authLevel: 'anonymous',
> api\src\functions\devices.ts:183:  route: 'admin/v1/devices/{deviceToken}',
  api\src\functions\devices.ts:184:  handler: requireAdmin(['super-admin', 
'ops-manager'])(adminUnregisterDeviceHandler),
  api\src\functions\devices.ts:185:});
  api\src\services\fcm.service.ts:8:/**
> api\src\services\fcm.service.ts:9: * Sends an FCM data message to all registered devices for a given user.
> api\src\services\fcm.service.ts:10: * Uses sendEachForMulticast when the user has multiple devices, send() for one.
  api\src\services\fcm.service.ts:11: * Logs stale-token warnings for observability without surfacing them to callers.
  api\src\services\fcm.service.ts:12: */
  api\src\services\fcm.service.ts:13:async function sendToUserTokens(



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path 'api/openapi.json' -Pattern 'v1/devices' -Context 1,4 | Select-Object -First 80" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 515ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path 'api/openapi.json' -Pattern 'device' -CaseSensitive:"'$false | Select-Object -First 40' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 785ms:

api\openapi.json:1313:              "deviceTokensCleared": {
api\openapi.json:1328:              "deviceTokensCleared"



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint4' status --short" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 634ms:
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint4' show 6246eb259e9e277590b1661a4355a32d8eca72b4:api/src/functions/devices.ts | Select-Object -First 120" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 780ms:
import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireCustomer } from '../middleware/requireCustomer.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { RegisterDeviceTokenBodySchema } from '../schemas/device-token.js';
import { deviceTokenRepo } from '../cosmos/device-token-repository.js';
import type { CustomerContext } from '../types/customer.js';
import type { AdminContext } from '../types/admin.js';

// ── Customer: POST /v1/devices/register ───────────────────────────────────────

export async function customerRegisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  customer: CustomerContext,
): Promise<HttpResponseInit> {
  const body = RegisterDeviceTokenBodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return { status: 400, jsonBody: { code: 'INVALID_BODY', errors: body.error.issues } };
  }
  await deviceTokenRepo.registerDeviceToken(
    customer.customerId,
    'customer',
    body.data.deviceToken,
    body.data.platform,
    body.data.appBuild,
  );
  return { status: 204 };
}

app.http('customerRegisterDevice', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/devices/register',
  handler: requireCustomer(customerRegisterDeviceHandler),
});

// ── Customer: DELETE /v1/devices/{deviceToken} ─────────────────────────────────

export async function customerUnregisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  customer: CustomerContext,
): Promise<HttpResponseInit> {
  const deviceToken = req.params['deviceToken'];
  if (!deviceToken) return { status: 400, jsonBody: { code: 'MISSING_TOKEN' } };
  await deviceTokenRepo.unregisterDeviceToken(customer.customerId, deviceToken);
  return { status: 204 };
}

app.http('customerUnregisterDevice', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'v1/devices/{deviceToken}',
  handler: requireCustomer(customerUnregisterDeviceHandler),
});

// ── Technician: POST /v1/technician/devices/register ─────────────────────────

export async function technicianRegisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const { uid } = await verifyTechnicianToken(req);
    const body = RegisterDeviceTokenBodySchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return { status: 400, jsonBody: { code: 'INVALID_BODY', errors: body.error.issues } };
    }
    await deviceTokenRepo.registerDeviceToken(
      uid,
      'technician',
      body.data.deviceToken,
      body.data.platform,
      body.data.appBuild,
    );
    return { status: 204 };
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }
}

app.http('technicianRegisterDevice', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/technician/devices/register',
  handler: technicianRegisterDeviceHandler,
});

// ── Technician: DELETE /v1/technician/devices/{deviceToken} ───────────────────

export async function technicianUnregisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const { uid } = await verifyTechnicianToken(req);
    const deviceToken = req.params['deviceToken'];
    if (!deviceToken) return { status: 400, jsonBody: { code: 'MISSING_TOKEN' } };
    await deviceTokenRepo.unregisterDeviceToken(uid, deviceToken);
    return { status: 204 };
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }
}

app.http('technicianUnregisterDevice', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'v1/technician/devices/{deviceToken}',
  handler: technicianUnregisterDeviceHandler,
});

// ── Admin: POST /admin/v1/devices/register ─────────────────────────────────────

export async function adminRegisterDeviceHandler(
  req: HttpRequest,
  _ctx: InvocationContext,

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path 'customer-app/app/build.gradle.kts' -Pattern 'robolectric|androidx.test|junit|assertj' -CaseSensitive:"'$false -Context 1,1' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 590ms:

  customer-app\app\build.gradle.kts:115:    alias(libs.plugins.kover)
> customer-app\app\build.gradle.kts:116:    alias(libs.plugins.android.junit5)
  customer-app\app\build.gradle.kts:117:    alias(libs.plugins.google.services)
  customer-app\app\build.gradle.kts:310:                // 4. SosViewModel.startRecording() has a 
Build.VERSION_CODES.S if/else that requires
> customer-app\app\build.gradle.kts:311:                //    Robolectric @Config(sdk=[31+]) to cover the true branch 
— deferred to E07 Espresso pass.
  customer-app\app\build.gradle.kts:312:                // CI's Espresso/Compose instrumented tests (run in a later 
story) will cover
  customer-app\app\build.gradle.kts:655:                    // NoShowCreditHandler — calls NotificationCompat.Builder; 
integration-tested
> customer-app\app\build.gradle.kts:656:                    // via CustomerFirebaseMessagingServiceNoShowTest with 
Robolectric.
  customer-app\app\build.gradle.kts:657:                    "*.NoShowCreditHandler",
  customer-app\app\build.gradle.kts:815:
> customer-app\app\build.gradle.kts:816:    testImplementation(libs.junit.jupiter)
> customer-app\app\build.gradle.kts:817:    testImplementation(libs.junit.jupiter.api)
> customer-app\app\build.gradle.kts:818:    testRuntimeOnly(libs.junit.jupiter.engine)
> customer-app\app\build.gradle.kts:819:    // JUnit 4 vintage engine: required for Paparazzi @Rule-based tests under 
the JUnit 5 launcher
> customer-app\app\build.gradle.kts:820:    testRuntimeOnly(libs.junit.vintage.engine)
  customer-app\app\build.gradle.kts:821:    testImplementation(libs.mockk)
> customer-app\app\build.gradle.kts:822:    testImplementation(libs.assertj.core)
  customer-app\app\build.gradle.kts:823:    testImplementation(libs.google.truth)
> customer-app\app\build.gradle.kts:824:    testImplementation(libs.robolectric)
> customer-app\app\build.gradle.kts:825:    testImplementation(libs.androidx.test.core)
  customer-app\app\build.gradle.kts:826:    testImplementation(libs.hilt.testing)
  customer-app\app\build.gradle.kts:832:    androidTestImplementation(libs.hilt.testing)
> customer-app\app\build.gradle.kts:833:    androidTestImplementation(libs.androidx.test.runner)
  customer-app\app\build.gradle.kts:834:    kspAndroidTest(libs.hilt.compiler)



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'core-nav/src/test/kotlin/com/homeservices/corenav/DeepLinkUriTest.kt' | Select-Object -First 230" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1063ms:
package com.homeservices.corenav

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/**
 * Unit tests for [DeepLinkUri.build] and [DeepLinkUri.parse].
 *
 * Covers:
 *  - round-trip fidelity
 *  - URL encoding of special characters in arg values
 *  - null return on malformed URIs
 *  - empty args map
 *  - multiple args
 */
public class DeepLinkUriTest {
    private fun intent(
        type: PendingActionType = PendingActionType.JOB_OFFER,
        entityId: String = "entity-1",
        rawArgs: Map<String, String> = emptyMap(),
    ) = NotificationIntent(type = type, entityId = entityId, rawArgs = rawArgs)

    // â”€â”€ Build â†’ Parse round-trips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Nested
    public inner class RoundTripTests {
        @Test
        public fun `simple intent with no args round-trips`() {
            val original = intent(PendingActionType.JOB_OFFER, "entity-abc")
            val uri = DeepLinkUri.build(original)
            val parsed = DeepLinkUri.parse(uri)

            assertThat(parsed).isNotNull
            assertThat(parsed!!.type).isEqualTo(original.type)
            assertThat(parsed.entityId).isEqualTo(original.entityId)
        }

        @Test
        public fun `intent with single arg round-trips`() {
            val original =
                intent(
                    type = PendingActionType.ADDON_APPROVAL_REQUESTED,
                    entityId = "booking-123",
                    rawArgs = mapOf("bookingId" to "booking-123"),
                )
            val uri = DeepLinkUri.build(original)
            val parsed = DeepLinkUri.parse(uri)

            assertThat(parsed).isNotNull
            assertThat(parsed!!.type).isEqualTo(original.type)
            assertThat(parsed.entityId).isEqualTo(original.entityId)
            assertThat(parsed.rawArgs["bookingId"]).isEqualTo("booking-123")
        }

        @Test
        public fun `intent with multiple args round-trips`() {
            val original =
                intent(
                    type = PendingActionType.COMPLAINT_UPDATE,
                    entityId = "complaint-99",
                    rawArgs = mapOf("complaintId" to "complaint-99", "role" to "customer"),
                )
            val uri = DeepLinkUri.build(original)
            val parsed = DeepLinkUri.parse(uri)

            assertThat(parsed).isNotNull
            assertThat(parsed!!.rawArgs).containsEntry("complaintId", "complaint-99")
            assertThat(parsed.rawArgs).containsEntry("role", "customer")
        }

        @Test
        public fun `entityId is always included in rawArgs after parse`() {
            val original = intent(PendingActionType.RATING_PROMPT_CUSTOMER, "bk-777")
            val uri = DeepLinkUri.build(original)
            val parsed = DeepLinkUri.parse(uri)

            assertThat(parsed).isNotNull
            assertThat(parsed!!.entityId).isEqualTo("bk-777")
        }
    }

    // â”€â”€ URL Encoding â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Nested
    public inner class UrlEncodingTests {
        @Test
        public fun `arg value with spaces round-trips via percent encoding`() {
            val original =
                intent(
                    type = PendingActionType.SUPPORT_FOLLOWUP,
                    entityId = "ticket-1",
                    rawArgs = mapOf("title" to "Hello World"),
                )
            val uri = DeepLinkUri.build(original)
            assertThat(uri).doesNotContain(" ") // must be encoded
            val parsed = DeepLinkUri.parse(uri)
            assertThat(parsed!!.rawArgs["title"]).isEqualTo("Hello World")
        }

        @Test
        public fun `arg value with ampersand does not corrupt other args`() {
            val original =
                intent(
                    type = PendingActionType.SUPPORT_FOLLOWUP,
                    entityId = "ticket-2",
                    rawArgs = mapOf("note" to "a&b", "other" to "value"),
                )
            val uri = DeepLinkUri.build(original)
            val parsed = DeepLinkUri.parse(uri)

            assertThat(parsed).isNotNull
            assertThat(parsed!!.rawArgs["note"]).isEqualTo("a&b")
            assertThat(parsed.rawArgs["other"]).isEqualTo("value")
        }

        @Test
        public fun `arg value with equals sign round-trips`() {
            val original =
                intent(
                    type = PendingActionType.SUPPORT_FOLLOWUP,
                    entityId = "ticket-3",
                    rawArgs = mapOf("data" to "key=value"),
                )
            val uri = DeepLinkUri.build(original)
            val parsed = DeepLinkUri.parse(uri)
            assertThat(parsed!!.rawArgs["data"]).isEqualTo("key=value")
        }

        @Test
        public fun `arg value with Hindi characters round-trips`() {
            val original =
                intent(
                    type = PendingActionType.SUPPORT_FOLLOWUP,
                    entityId = "ticket-4",
                    rawArgs = mapOf("label" to "à¤¸à¥‡à¤µà¤¾"), // "service" in Hindi
                )
            val uri = DeepLinkUri.build(original)
            val parsed = DeepLinkUri.parse(uri)
            assertThat(parsed!!.rawArgs["label"]).isEqualTo("à¤¸à¥‡à¤µà¤¾")
        }
    }

    // â”€â”€ URI Schema Validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Nested
    public inner class SchemaValidationTests {
        @Test
        public fun `built URI starts with homeservices scheme`() {
            val uri = DeepLinkUri.build(intent())
            assertThat(uri).startsWith("homeservices://action/")
        }

        @Test
        public fun `built URI contains type name`() {
            val uri = DeepLinkUri.build(intent(PendingActionType.JOB_OFFER))
            assertThat(uri).contains("JOB_OFFER")
        }
    }

    // â”€â”€ Parse Error Handling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Nested
    public inner class ParseErrorTests {
        @Test
        public fun `parse returns null for completely malformed URI`() {
            val result = DeepLinkUri.parse("not-a-uri")
            assertThat(result).isNull()
        }

        @Test
        public fun `parse returns null for wrong scheme`() {
            val result = DeepLinkUri.parse("https://action/JOB_OFFER?entityId=x")
            assertThat(result).isNull()
        }

        @Test
        public fun `parse returns null for wrong host`() {
            val result = DeepLinkUri.parse("homeservices://other/JOB_OFFER?entityId=x")
            assertThat(result).isNull()
        }

        @Test
        public fun `parse returns null for unknown action type`() {
            val result = DeepLinkUri.parse("homeservices://action/UNKNOWN_TYPE?entityId=x")
            assertThat(result).isNull()
        }

        @Test
        public fun `parse returns null for missing entityId`() {
            val result = DeepLinkUri.parse("homeservices://action/JOB_OFFER")
            assertThat(result).isNull()
        }

        @Test
        public fun `parse returns null for empty string`() {
            val result = DeepLinkUri.parse("")
            assertThat(result).isNull()
        }
    }

    // â”€â”€ SEC-04: entityId allowlist validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Nested
    public inner class EntityIdValidationTests {
        @Test
        public fun `parse returns null for traversal entityId`() {
            // entityId = "../../delete_account" â€” must be rejected by allowlist
            val uri = "homeservices://action/RATING_PROMPT_CUSTOMER?entityId=..%2F..%2Fdelete_account"
            val result = DeepLinkUri.parse(uri)
            assertThat(result).isNull()
        }

        @Test
        public fun `parse returns null for entityId with slash`() {
            val uri = "homeservices://action/ADDON_APPROVAL_REQUESTED?entityId=bk-001%2Ffoo"
            val result = DeepLinkUri.parse(uri)
            assertThat(result).isNull()
        }

        @Test
        public fun `parse accepts valid alphanumeric entityId`() {
            val uri = "homeservices://action/RATING_PROMPT_CUSTOMER?entityId=bk-test-123"
            val result = DeepLinkUri.parse(uri)
            assertThat(result).isNotNull()
            assertThat(result!!.entityId).isEqualTo("bk-test-123")
        }

        @Test
        public fun `parse rejects entityId longer than 64 characters`() {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'core-nav/src/test/kotlin/com/homeservices/corenav/DeepLinkUriTest.kt' | Select-Object -Skip 230 -First 40" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 553ms:
            val longId = "a".repeat(65)
            val uri = "homeservices://action/RATING_PROMPT_CUSTOMER?entityId=$longId"
            val result = DeepLinkUri.parse(uri)
            assertThat(result).isNull()
        }
    }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'core-nav/src/main/kotlin/com/homeservices/corenav/NotificationIntent.kt'; Get-Content -LiteralPath 'core-nav/src/main/kotlin/com/homeservices/corenav/PendingActionType.kt'" in C:\Alok\Business Projects\Urbanclap-sprint4
2026-05-23T01:58:47.735080Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.7 seconds
Output:
Get-Content : Cannot find path 'core-nav/src/main/kotlin/com/homeservices/corenav/NotificationIntent.kt' because it 
does not exist.
At line:2 char:1
+ Get-Content -LiteralPath 'core-nav/src/main/kotlin/com/homeservices/c ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (core-nav/src/ma...cationIntent.kt:String) [Get-Content], ItemNotFoundEx 
   ception
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetContentCommand
 
Get-Content : Cannot find path 'core-nav/src/main/kotlin/com/homeservices/corenav/PendingActionType.kt' because it 
does not exist.
At line:2 char:101
+ ... Intent.kt'; Get-Content -LiteralPath 'core-nav/src/main/kotlin/com/ho ...
+                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (core-nav/src/ma...ngActionType.kt:String) [Get-Content], ItemNotFoundEx 
   ception
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetContentCommand
 

 exited 1 in 669ms:
Get-Content : Cannot find path 'core-nav/src/main/kotlin/com/homeservices/corenav/NotificationIntent.kt' because it 
does not exist.
At line:2 char:1
+ Get-Content -LiteralPath 'core-nav/src/main/kotlin/com/homeservices/c ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (core-nav/src/ma...cationIntent.kt:String) [Get-Content], ItemNotFoundEx 
   ception
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetContentCommand
 
Get-Content : Cannot find path 'core-nav/src/main/kotlin/com/homeservices/corenav/PendingActionType.kt' because it 
does not exist.
At line:2 char:101
+ ... Intent.kt'; Get-Content -LiteralPath 'core-nav/src/main/kotlin/com/ho ...
+                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (core-nav/src/ma...ngActionType.kt:String) [Get-Content], ItemNotFoundEx 
   ception
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetContentCommand
 

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -LiteralPath 'core-nav/src/main/kotlin' | Select-Object FullName" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 613ms:

FullName                                                                                                           
--------                                                                                                           
C:\Alok\Business Projects\Urbanclap-sprint4\core-nav\src\main\kotlin\com                                           
C:\Alok\Business Projects\Urbanclap-sprint4\core-nav\src\main\kotlin\com\homeservices                              
C:\Alok\Business Projects\Urbanclap-sprint4\core-nav\src\main\kotlin\com\homeservices\corenav                      
C:\Alok\Business Projects\Urbanclap-sprint4\core-nav\src\main\kotlin\com\homeservices\corenav\AuthState.kt         
C:\Alok\Business Projects\Urbanclap-sprint4\core-nav\src\main\kotlin\com\homeservices\corenav\CommonRouteSpec.kt   
C:\Alok\Business Projects\Urbanclap-sprint4\core-nav\src\main\kotlin\com\homeservices\corenav\DeepLinkUri.kt       
C:\Alok\Business Projects\Urbanclap-sprint4\core-nav\src\main\kotlin\com\homeservices\corenav\NotificationRouter.kt
C:\Alok\Business Projects\Urbanclap-sprint4\core-nav\src\main\kotlin\com\homeservices\corenav\PendingAction.kt     
C:\Alok\Business Projects\Urbanclap-sprint4\core-nav\src\main\kotlin\com\homeservices\corenav\PendingActionEnums.kt
C:\Alok\Business Projects\Urbanclap-sprint4\core-nav\src\main\kotlin\com\homeservices\corenav\RouteContext.kt      
C:\Alok\Business Projects\Urbanclap-sprint4\core-nav\src\main\kotlin\com\homeservices\corenav\RouteResolver.kt     
C:\Alok\Business Projects\Urbanclap-sprint4\core-nav\src\main\kotlin\com\homeservices\corenav\RouteSpec.kt         
C:\Alok\Business Projects\Urbanclap-sprint4\core-nav\src\main\kotlin\com\homeservices\corenav\TierLadder.kt        



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'core-nav/src/main/kotlin/com/homeservices/corenav/PendingAction.kt'; Get-Content -LiteralPath 'core-nav/src/main/kotlin/com/homeservices/corenav/PendingActionEnums.kt'" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 898ms:
package com.homeservices.corenav

/**
 * Domain model for a pending action.
 *
 * This is the shared cross-app representation. It is mapped to/from:
 *   - [PendingActionEntity] (Room, per-app persistence layer)
 *   - API response DTO (via the per-app repository)
 *
 * The [id] is deterministic: `<TYPE>:<role>:<userId>:<entityType>:<entityId>`.
 * This ensures idempotent upserts and enables the version-aware stale-drop check
 * in PendingActionIngestor (E11-S01b-1).
 *
 * [version] is a monotonic integer bumped by the server projector on every mutation.
 * The ingestor drops incoming FCM if `incoming.version <= existing.version`.
 */
public data class PendingAction(
    /** Deterministic compound id: `<TYPE>:<role>:<userId>:<entityType>:<entityId>`. */
    val id: String,
    val userId: String,
    /** "customer" or "technician". */
    val role: String,
    val type: PendingActionType,
    /** e.g. "booking", "job_offer", "complaint". */
    val entityType: String,
    /** Opaque ID of the source entity (bookingId, offerId, complaintId, etc.). */
    val entityId: String,
    /** Deep-link URI: `homeservices://action/<TYPE>?<args>`. Built by [DeepLinkUri]. */
    val routeUri: String,
    val priority: PendingActionPriority,
    val status: PendingActionStatus,
    /** Snapshot of the source entity's status at the time of last projection. */
    val sourceStatus: String?,
    /** Monotonic version counter; used for stale-drop detection in Ingestor. */
    val version: Long,
    val createdAt: Long,
    val updatedAt: Long,
    /** Epoch ms after which the action expires. Null = no expiry (e.g., COMPLAINT_UPDATE). */
    val expiresAt: Long?,
    /** Epoch ms at which this action was resolved; null if still active. */
    val resolvedAt: Long?,
)

/**
 * Parsed FCM notification intent â€” the intermediate form between raw FCM data
 * and a fully-hydrated [PendingAction].
 */
public data class NotificationIntent(
    val type: PendingActionType,
    /** The primary entity identifier carried in the FCM data payload. */
    val entityId: String,
    /** All key-value pairs from the FCM data payload or deep-link query args. */
    val rawArgs: Map<String, String>,
)

/**
 * Minimal summary of a technician's active job, used by [TierLadder] to decide T2 routing.
 * Full details are fetched by the per-app screen on entry.
 */
public data class ActiveJobSummary(
    val bookingId: String,
    /** One of: ASSIGNED, EN_ROUTE, REACHED, IN_PROGRESS. */
    val status: String,
)

/**
 * Minimal summary of a customer's active booking, used by [TierLadder] to decide T2 routing.
 */
public data class BookingSummary(
    val bookingId: String,
    /** One of: AWAITING_PRICE_APPROVAL, ASSIGNED, SEARCHING, etc. */
    val status: String,
)
package com.homeservices.corenav

/**
 * Action types that can appear in the `pending_actions` collection.
 *
 * Two sub-classes of types live in this enum:
 *
 * 1. **Server-originated (FCM-driven)** â€” names mirror the FCM wire types defined in:
 *      - `api/src/services/fcm.service.ts`
 *      - `customer-app/.../firebase/CustomerFirebaseMessagingService.kt`
 *      - `technician-app/.../data/fcm/HomeservicesFcmService.kt`
 *    Per E11 spec Â§9.2: "Do not invent new type names." for this sub-class.
 *
 * 2. **Local-only retry-queue** â€” durable hooks the client-side persists when an
 *    offline-tolerant action is interrupted (e.g. photo upload, state transition).
 *    These never appear in an FCM payload; they are written by the app itself
 *    and cleared once the queued action succeeds. Introduced in E11-S05a.
 */
public enum class PendingActionType {
    /** Customer must approve an add-on request. Maps to existing FCM type. */
    ADDON_APPROVAL_REQUESTED,

    /** Customer is prompted to rate a completed booking. Maps to existing FCM type. */
    RATING_PROMPT_CUSTOMER,

    /** Technician is prompted to rate a completed booking. Maps to existing FCM type. */
    RATING_PROMPT_TECHNICIAN,

    /** Technician has received a rating from a customer. Maps to existing FCM type. */
    RATING_RECEIVED,

    /** Technician has received an earnings update. Maps to existing FCM type. */
    EARNINGS_UPDATE,

    /** Technician has received a job offer. Maps to existing FCM type. */
    JOB_OFFER,

    /** Technician must resume incomplete KYC. New type introduced in E11. */
    KYC_RESUME,

    /**
     * Local-only (E11-S05c): a KYC document submission (PAN photo) was queued while
     * offline. Surfaced as a status chip on the onboarding screen so the technician
     * knows the upload will be sent once connectivity returns. Cleared when the queued
     * submit succeeds.
     */
    KYC_SUBMIT_PENDING,

    /**
     * Local-only (E11-S05c): a KYC PAN photo upload failed transiently. Surfaced as a
     * retry banner above the KYC form; the technician can tap "Retry" to replay the
     * upload. Tombstoned once the upload succeeds.
     */
    PHOTO_UPLOAD_RETRY,

    /** A complaint has been updated. New type introduced in E11. Applies to both roles. */
    COMPLAINT_UPDATE,

    /** A support follow-up is available. New type introduced in E11. Applies to both roles. */
    SUPPORT_FOLLOWUP,

    /** Future: SOS audio follow-up. Reserved per E11 spec. */
    SAFETY_SOS_FOLLOWUP,

    /**
     * Local-only (E11-S05a): a job-evidence photo upload failed and is queued for retry.
     * Surfaced as a banner on the technician-app active-job screen.
     * Cleared when the upload succeeds.
     */
    PHOTO_UPLOAD_PENDING,

    /**
     * Local-only (E11-S05a): a job state transition (EN_ROUTE/REACHED/IN_PROGRESS/COMPLETED)
     * was attempted but failed to reach the server. Existing offline-queue mechanism in
     * [ActiveJobRepository] persists the transition itself; this row exists only so the
     * router knows a job has outstanding work and can avoid duplicate prompts.
     */
    STATE_TRANSITION_PENDING,

    /**
     * Local-only (E11-S05a): reserved for future durability of the completion-confirm
     * dialog. Currently the awaiting-confirm state is held in [ActiveJobUiState] only;
     * this enum value is reserved so existing on-device DBs need not migrate when the
     * persistence step lands.
     */
    COMPLETION_CONFIRMATION_PENDING,
}

/** Lifecycle status of a pending action row, both local and server-side. */
public enum class PendingActionStatus {
    /** Action is live and surfaced to the user. */
    ACTIVE,

    /**
     * Action has been resolved by the server (e.g., booking moved to next state).
     * Tombstone rows are kept locally for 30 days to prevent stale-FCM resurrection.
     */
    RESOLVED,

    /** Action's TTL has passed (e.g., JOB_OFFER not accepted in time). */
    EXPIRED,
}

/**
 * Routing priority of a pending action.
 *
 * Maps directly to the T-tier in [TierLadder]:
 *   HIGH   â†’ T3
 *   NORMAL â†’ T4
 *   LOW    â†’ T5
 */
public enum class PendingActionPriority {
    HIGH,
    NORMAL,
    LOW,
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'api/src' -Include '*.ts' | Select-String -Pattern 'bookingId|complaintId|id:' -CaseSensitive:"'$false | Select-Object -First 100' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1454ms:

api\src\cosmos\repositories\waitlist.repository.ts:5:  id: string;
api\src\cosmos\repositories\waitlist.repository.ts:9:  serviceId: string;
api\src\cosmos\repositories\waitlist.repository.ts:23:    id: randomUUID(),
api\src\cosmos\seeds\catalogue.ts:11:  { id: 'ac-repair', name: 'AC Repair', heroImageUrl: 
'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/categories%2Fac-repair.jpg', sortOrder: 1, isActive: 
true, updatedBy: SYSTEM, createdAt: NOW, updatedAt: NOW },
api\src\cosmos\seeds\catalogue.ts:12:  { id: 'water-pump', name: 'Water Pump / Borewell', heroImageUrl: 
'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/categories%2Fwater-pump.jpg', sortOrder: 2, isActive: 
true, updatedBy: SYSTEM, createdAt: NOW, updatedAt: NOW },
api\src\cosmos\seeds\catalogue.ts:13:  { id: 'plumbing', name: 'Plumbing', heroImageUrl: 
'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/categories%2Fplumbing.jpg', sortOrder: 3, isActive: 
true, updatedBy: SYSTEM, createdAt: NOW, updatedAt: NOW },
api\src\cosmos\seeds\catalogue.ts:14:  { id: 'electrical', name: 'Electrical', heroImageUrl: 
'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/categories%2Felectrical.jpg', sortOrder: 4, isActive: 
true, updatedBy: SYSTEM, createdAt: NOW, updatedAt: NOW },
api\src\cosmos\seeds\catalogue.ts:15:  { id: 'water-purifier', name: 'RO / Water Purifier', heroImageUrl: 
'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/categories%2Fwater-purifier.jpg', sortOrder: 5, 
isActive: true, updatedBy: SYSTEM, createdAt: NOW, updatedAt: NOW },
api\src\cosmos\seeds\catalogue.ts:21:    id: 'ac-deep-clean',
api\src\cosmos\seeds\catalogue.ts:22:    categoryId: 'ac-repair',
api\src\cosmos\seeds\catalogue.ts:31:    addOns: [{ id: 'gas-refill', name: 'Gas Refill', price: 149900, 
triggerCondition: 'if gas pressure is below recommended threshold' }],
api\src\cosmos\seeds\catalogue.ts:32:    photoStages: [{ id: 'before-unit', label: 'AC unit before service', required: 
true }, { id: 'filter-condition', label: 'Filter condition', required: true }, { id: 'after-unit', label: 'AC unit 
after service', required: true }],
api\src\cosmos\seeds\catalogue.ts:39:    id: 'ac-gas-refill',
api\src\cosmos\seeds\catalogue.ts:40:    categoryId: 'ac-repair',
api\src\cosmos\seeds\catalogue.ts:50:    photoStages: [{ id: 'pressure-gauge', label: 'Pressure gauge reading before', 
required: true }, { id: 'after-refill', label: 'Gauge after refill', required: true }],
api\src\cosmos\seeds\catalogue.ts:57:    id: 'ac-installation',
api\src\cosmos\seeds\catalogue.ts:58:    categoryId: 'ac-repair',
api\src\cosmos\seeds\catalogue.ts:67:    addOns: [{ id: 'extra-pipe', name: 'Extra copper pipe', price: 25000, 
triggerCondition: 'per metre beyond 3 m' }],
api\src\cosmos\seeds\catalogue.ts:68:    photoStages: [{ id: 'before-wall', label: 'Wall before drilling', required: 
true }, { id: 'after-install', label: 'Completed installation', required: true }],
api\src\cosmos\seeds\catalogue.ts:76:    id: 'water-pump-repair',
api\src\cosmos\seeds\catalogue.ts:77:    categoryId: 'water-pump',
api\src\cosmos\seeds\catalogue.ts:86:    addOns: [{ id: 'pump-rewinding', name: 'Motor rewinding', price: 250000, 
triggerCondition: 'if motor windings are burnt' }],
api\src\cosmos\seeds\catalogue.ts:87:    photoStages: [{ id: 'pump-before', label: 'Pump unit before service', 
required: true }, { id: 'pump-after', label: 'Pump unit after service', required: true }],
api\src\cosmos\seeds\catalogue.ts:94:    id: 'borewell-servicing',
api\src\cosmos\seeds\catalogue.ts:95:    categoryId: 'water-pump',
api\src\cosmos\seeds\catalogue.ts:104:    addOns: [{ id: 'extra-depth', name: 'Extra depth beyond 200 ft', price: 500, 
triggerCondition: 'per foot beyond 200 ft' }],
api\src\cosmos\seeds\catalogue.ts:105:    photoStages: [{ id: 'borewell-before', label: 'Borewell access before', 
required: true }, { id: 'pump-pulled', label: 'Pump after retrieval', required: true }, { id: 'borewell-after', label: 
'Borewell sealed after service', required: true }],
api\src\cosmos\seeds\catalogue.ts:113:    id: 'plumbing-leak-fix',
api\src\cosmos\seeds\catalogue.ts:114:    categoryId: 'plumbing',
api\src\cosmos\seeds\catalogue.ts:123:    addOns: [{ id: 'replacement-fitting', name: 'Replacement fitting', price: 
15000, triggerCondition: 'if existing fitting is damaged beyond repair' }],
api\src\cosmos\seeds\catalogue.ts:124:    photoStages: [{ id: 'leak-location', label: 'Leak point before fix', 
required: true }, { id: 'after-fix', label: 'After repair', required: true }],
api\src\cosmos\seeds\catalogue.ts:131:    id: 'plumbing-tap-install',
api\src\cosmos\seeds\catalogue.ts:132:    categoryId: 'plumbing',
api\src\cosmos\seeds\catalogue.ts:142:    photoStages: [{ id: 'before-tap', label: 'Tap before install', required: 
true }, { id: 'after-tap', label: 'Tap installed', required: true }],
api\src\cosmos\seeds\catalogue.ts:149:    id: 'plumbing-pipe-repair',
api\src\cosmos\seeds\catalogue.ts:150:    categoryId: 'plumbing',
api\src\cosmos\seeds\catalogue.ts:159:    addOns: [{ id: 'wall-plaster', name: 'Wall patching (per sq ft)', price: 
20000, triggerCondition: 'if wall break-open is required' }],
api\src\cosmos\seeds\catalogue.ts:160:    photoStages: [{ id: 'before-pipe', label: 'Damaged pipe', required: true }, 
{ id: 'after-pipe', label: 'Repaired section', required: true }],
api\src\cosmos\seeds\catalogue.ts:168:    id: 'electrical-fan-install',
api\src\cosmos\seeds\catalogue.ts:169:    categoryId: 'electrical',
api\src\cosmos\seeds\catalogue.ts:179:    photoStages: [{ id: 'before-ceiling', label: 'Ceiling point before', 
required: false }, { id: 'fan-installed', label: 'Fan installed', required: true }],
api\src\cosmos\seeds\catalogue.ts:186:    id: 'electrical-switchboard-fix',
api\src\cosmos\seeds\catalogue.ts:187:    categoryId: 'electrical',
api\src\cosmos\seeds\catalogue.ts:196:    addOns: [{ id: 'extra-point', name: 'Extra point repair', price: 10000, 
triggerCondition: 'per point beyond 3' }],
api\src\cosmos\seeds\catalogue.ts:197:    photoStages: [{ id: 'faulty-board', label: 'Faulty switchboard', required: 
true }, { id: 'repaired-board', label: 'After repair', required: true }],
api\src\cosmos\seeds\catalogue.ts:204:    id: 'electrical-wiring',
api\src\cosmos\seeds\catalogue.ts:205:    categoryId: 'electrical',
api\src\cosmos\seeds\catalogue.ts:214:    addOns: [{ id: 'wall-chasing', name: 'Wall chasing + plaster', price: 30000, 
triggerCondition: 'per metre of concealed wiring' }],
api\src\cosmos\seeds\catalogue.ts:215:    photoStages: [{ id: 'before-wall', label: 'Wall before wiring', required: 
false }, { id: 'completed-point', label: 'New point completed', required: true }],
api\src\cosmos\seeds\catalogue.ts:223:    id: 'ro-installation',
api\src\cosmos\seeds\catalogue.ts:224:    categoryId: 'water-purifier',
api\src\cosmos\seeds\catalogue.ts:233:    addOns: [{ id: 'extra-piping', name: 'Extra inlet/outlet piping', price: 
25000, triggerCondition: 'per metre beyond 2 m' }],
api\src\cosmos\seeds\catalogue.ts:234:    photoStages: [{ id: 'ro-before-wall', label: 'Wall before installation', 
required: true }, { id: 'ro-after-install', label: 'Completed installation with TDS reading', required: true }],
api\src\cosmos\seeds\catalogue.ts:241:    id: 'ro-service-amc',
api\src\cosmos\seeds\catalogue.ts:242:    categoryId: 'water-purifier',
api\src\cosmos\seeds\catalogue.ts:251:    addOns: [{ id: 'membrane-replacement', name: 'RO membrane replacement', 
price: 150000, triggerCondition: 'if TDS reduction efficiency drops below 85%' }],
api\src\cosmos\seeds\catalogue.ts:252:    photoStages: [{ id: 'ro-before-service', label: 'RO unit before service', 
required: true }, { id: 'old-filters', label: 'Old filters removed', required: true }, { id: 'ro-after-service', 
label: 'Unit after service with new TDS reading', required: true }],
api\src\cosmos\seeds\catalogue.ts:265:export const DROPPED_SERVICES: ReadonlyArray<{ id: string; categoryId: string }> 
= [
api\src\cosmos\seeds\catalogue.ts:266:  { id: 'deep-clean-1bhk', categoryId: 'deep-cleaning' },
api\src\cosmos\seeds\catalogue.ts:267:  { id: 'deep-clean-2bhk', categoryId: 'deep-cleaning' },
api\src\cosmos\seeds\catalogue.ts:268:  { id: 'deep-clean-3bhk', categoryId: 'deep-cleaning' },
api\src\cosmos\seeds\catalogue.ts:269:  { id: 'pest-cockroach', categoryId: 'pest-control' },
api\src\cosmos\seeds\catalogue.ts:270:  { id: 'pest-bed-bugs', categoryId: 'pest-control' },
api\src\cosmos\seeds\catalogue.ts:271:  { id: 'pest-full-home', categoryId: 'pest-control' },
api\src\cosmos\seeds\catalogue.ts:278:  await db.containers.createIfNotExists({ id: 'service_categories', 
partitionKey: '/id', defaultTtl: -1 });
api\src\cosmos\seeds\catalogue.ts:279:  await db.containers.createIfNotExists({ id: 'services', partitionKey: 
'/categoryId' });
api\src\cosmos\seeds\complaints.ts:7:    id: 'complaints',
api\src\cosmos\booking-event-repository.ts:9:      id: randomUUID(),
api\src\cosmos\booking-repository.ts:30:    customerId: string,
api\src\cosmos\booking-repository.ts:31:    paymentOrderId: string,
api\src\cosmos\booking-repository.ts:34:    bookingId?: string,
api\src\cosmos\booking-repository.ts:39:      id: bookingId ?? randomUUID(), customerId, ...req,
api\src\cosmos\booking-repository.ts:48:      paymentId: null, paymentSignature: null,
api\src\cosmos\booking-repository.ts:62:  async getById(id: string): Promise<BookingDoc | null> {
api\src\cosmos\booking-repository.ts:68:    id: string,
api\src\cosmos\booking-repository.ts:69:    paymentId: string,
api\src\cosmos\booking-repository.ts:95:  async getByPaymentOrderId(orderId: string): Promise<BookingDoc | null> {
api\src\cosmos\booking-repository.ts:105:  async markPaid(id: string, paymentId: string): Promise<BookingDoc | null> {
api\src\cosmos\booking-repository.ts:155:  async getByTechnicianId(technicianId: string): Promise<BookingDoc[]> {
api\src\cosmos\booking-repository.ts:179:  async getByCustomerId(customerId: string): Promise<BookingDoc[]> {
api\src\cosmos\booking-repository.ts:193:  async requestAddOn(id: string, addOn: PendingAddOn): Promise<BookingDoc | 
null> {
api\src\cosmos\booking-repository.ts:209:  async applyAddOnDecisions(id: string, customerId: string, decisions: 
AddOnDecision[]): Promise<BookingDoc | null> {
api\src\cosmos\booking-repository.ts:227:    bookingId: string,
api\src\cosmos\booking-repository.ts:232:      .item(bookingId, bookingId)
api\src\cosmos\booking-repository.ts:243:      .item(bookingId, bookingId)
api\src\cosmos\booking-repository.ts:248:  async markSosActivated(id: string): Promise<BookingDoc | null> {
api\src\cosmos\booking-repository.ts:269:  async getBookedWindowsByServiceDate(serviceId: string, date: string): 
Promise<string[]> {
api\src\cosmos\booking-repository.ts:287:  id: string,
api\src\cosmos\booking-repository.ts:299:export async function getActiveBookingCountForTechnician(technicianId: 
string): Promise<number> {
api\src\cosmos\booking-repository.ts:314:  customerId: string;
api\src\cosmos\booking-repository.ts:319:    date: string; serviceId: string; technicianId: string; status: string;
api\src\cosmos\booking-repository.ts:326:      customerId: string; slotDate: string; serviceId: string;
api\src\cosmos\booking-repository.ts:327:      technicianId: string; status: string; addressText: string;
api\src\cosmos\booking-repository.ts:340:        customerId: cid,
api\src\cosmos\booking-repository.ts:353:        serviceId: r.serviceId,
api\src\cosmos\booking-repository.ts:354:        technicianId: r.technicianId ?? '',
api\src\cosmos\catalogue-repository.ts:29:  async getCategoryById(id: string): Promise<ServiceCategory | null> {
api\src\cosmos\catalogue-repository.ts:39:  async createCategory(body: CreateCategoryBody, uid: string): 
Promise<ServiceCategory> {
api\src\cosmos\catalogue-repository.ts:45:  async updateCategory(id: string, body: UpdateCategoryBody, uid: string): 
Promise<ServiceCategory | null> {
api\src\cosmos\catalogue-repository.ts:53:  async toggleCategory(id: string, uid: string): Promise<ServiceCategory | 
null> {



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'api/src/cosmos/seeds/complaints.ts' | Select-Object -First 120; Get-ChildItem -Recurse -Path 'api/src' -Include '*.ts' | Select-String -Pattern 'complaint.*randomUUID|randomUUID.*complaint|complaintId' -CaseSensitive:"'$false | Select-Object -First 50' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 762ms:
import { getCosmosClient, DB_NAME } from '../client.js';

async function provision(): Promise<void> {
  const db = getCosmosClient().database(DB_NAME);

  await db.containers.createIfNotExists({
    id: 'complaints',
    partitionKey: '/id',
    defaultTtl: -1,
    indexingPolicy: {
      indexingMode: 'consistent',
      includedPaths: [{ path: '/*' }],
      excludedPaths: [{ path: '/internalNotes/*' }],
    },
  });

  console.log('complaints container ready.');
}

provision().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

api\src\functions\admin\complaints\sla-timer.ts:60:        complaintId: complaint.id,
api\src\functions\complaints\partner-create.ts:55:  const complaintId = 
`${data.bookingId}-complaint-${filedBy.toLowerCase()}`;
api\src\functions\complaints\partner-create.ts:56:  const existing = await getComplaint(complaintId);
api\src\functions\complaints\partner-create.ts:63:    id: complaintId,
api\src\functions\rating-escalate.ts:100:  void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 
'system', action: 'RATING_SHIELD_ESCALATED', resourceType: 'booking', resourceId: bookingId, payload: { bookingId, 
complaintId: doc.id, draftOverall: parsed.data.draftOverall }, timestamp: _ts, partitionKey: _ts.slice(0, 7) 
}).catch(Sentry.captureException);
api\src\functions\rating-escalate.ts:108:  return { status: 201, jsonBody: { complaintId: doc.id, expiresAt: 
expiresAt.toISOString() } };
api\src\functions\shield-report.ts:96:  return { status: 201, jsonBody: { complaintId: shieldId } };
api\src\functions\trigger-projector-complaints.ts:55:  const { id: complaintId, customerId, bookingId, status } = doc;
api\src\functions\trigger-projector-complaints.ts:58:    ctx?.warn(`[trigger-projector-complaints] Skipping doc 
${complaintId}: missing required fields`);
api\src\functions\trigger-projector-complaints.ts:62:  const actionId = buildPendingActionId('COMPLAINT_UPDATE', 
customerId, complaintId);
api\src\functions\trigger-projector-complaints.ts:72:      sourceId: complaintId,
api\src\functions\trigger-projector-complaints.ts:76:        complaintId,
api\src\schemas\complaint.ts:96:  complaintId: z.string(),
api\src\services\fcm.service.ts:332:  complaintId: string;
api\src\services\fcm.service.ts:338:    complaintId: payload.complaintId,



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'api/src/functions/complaints/partner-create.ts' | Select-Object -First 100; Get-Content -LiteralPath 'api/src/functions/shield-report.ts' | Select-Object -First 130" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 511ms:
import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyFirebaseIdToken } from '../../services/firebaseAdmin.js';
import { bookingRepo } from '../../cosmos/booking-repository.js';
import { createComplaint, getComplaint, replaceComplaint } from '../../cosmos/complaints-repository.js';
import { sendOwnerComplaintFiled } from '../../services/fcm.service.js';
import {
  CreateComplaintByPartnerBodySchema,
  CustomerReasonCodeEnum,
  TechnicianReasonCodeEnum,
} from '../../schemas/complaint.js';
import type { ComplaintDoc, PartnerComplaintResponse } from '../../schemas/complaint.js';

export async function partnerCreateComplaintHandler(
  req: HttpRequest,
  ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };

  let uid: string;
  try {
    const decoded = await verifyFirebaseIdToken(auth.slice(7));
    uid = decoded.uid;
  } catch {
    return { status: 401, jsonBody: { code: 'TOKEN_INVALID' } };
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }
  const parsed = CreateComplaintByPartnerBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }
  const data = parsed.data;

  const booking = await bookingRepo.getById(data.bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };

  const isCustomer = booking.customerId === uid;
  const isTechnician = booking.technicianId === uid;
  if (!isCustomer && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (!['COMPLETED', 'PAID', 'CLOSED'].includes(booking.status)) {
    return { status: 409, jsonBody: { code: 'BOOKING_NOT_ELIGIBLE', status: booking.status } };
  }

  const filedBy = isCustomer ? 'CUSTOMER' as const : 'TECHNICIAN' as const;
  const reasonValid = filedBy === 'CUSTOMER'
    ? CustomerReasonCodeEnum.safeParse(data.reasonCode).success
    : TechnicianReasonCodeEnum.safeParse(data.reasonCode).success;
  if (!reasonValid) return { status: 400, jsonBody: { code: 'INVALID_REASON_CODE' } };

  const complaintId = `${data.bookingId}-complaint-${filedBy.toLowerCase()}`;
  const existing = await getComplaint(complaintId);
  if (existing && existing.doc.status !== 'RESOLVED') {
    return { status: 409, jsonBody: { code: 'COMPLAINT_ALREADY_FILED' } };
  }

  const now = new Date();
  const doc: ComplaintDoc = {
    id: complaintId,
    type: 'STANDARD',
    orderId: data.bookingId,
    customerId: booking.customerId,
    technicianId: booking.technicianId ?? '',
    description: data.description,
    status: 'NEW',
    internalNotes: [],
    slaDeadlineAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    acknowledgeDeadlineAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    escalated: false,
    ackBreached: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    filedBy,
    reasonCode: data.reasonCode,
    ...(data.photoStoragePath ? { photoStoragePath: data.photoStoragePath } : {}),
  };

  if (existing) {
    // Refile after RESOLVED â€” replace atomically using etag so a concurrent refile loses
    try {
      await replaceComplaint(doc, existing.etag);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 412) {
        return { status: 409, jsonBody: { code: 'COMPLAINT_ALREADY_FILED' } };
      }
      throw err;
    }
  } else {
    // First filing â€” create; 409 means a concurrent request beat us to it
    try {
      await createComplaint(doc);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 409) {
        return { status: 409, jsonBody: { code: 'COMPLAINT_ALREADY_FILED' } };
      }
      throw err;
import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import '../bootstrap.js';
import * as Sentry from '@sentry/node';
import { createHash } from 'node:crypto';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { addBlockedCustomer } from '../cosmos/technician-repository.js';
import { createComplaint, findShieldByTechBooking } from '../cosmos/complaints-repository.js';
import { sendAbusiveShieldAlert } from '../services/fcm.service.js';
import { ShieldReportBodySchema } from '../schemas/shield.js';
import type { ComplaintDoc } from '../schemas/complaint.js';

// A tech can file a shield report any time the booking is assigned to them, from
// dispatch acceptance through post-job closure. We exclude pre-assignment statuses
// (PENDING_PAYMENT, SEARCHING) and terminal-cancelled statuses (UNFULFILLED,
// CUSTOMER_CANCELLED, NO_SHOW_REDISPATCH) since those have no real tech assignment.
const ELIGIBLE_STATUSES = new Set([
  'ASSIGNED',
  'EN_ROUTE',
  'REACHED',
  'IN_PROGRESS',
  'AWAITING_PRICE_APPROVAL',
  'COMPLETED',
  'PAID',
  'CLOSED',
]);

export async function shieldReportHandler(req: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> {
  let uid: string;
  try {
    const d = await verifyTechnicianToken(req);
    uid = d.uid;
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }
  const parsed = ShieldReportBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const booking = await bookingRepo.getById(parsed.data.bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (!ELIGIBLE_STATUSES.has(booking.status)) {
    return { status: 409, jsonBody: { code: 'BOOKING_NOT_ELIGIBLE', status: booking.status } };
  }

  const existing = await findShieldByTechBooking(uid, parsed.data.bookingId);
  if (existing) return { status: 409, jsonBody: { code: 'SHIELD_ALREADY_FILED' } };

  const shieldId = createHash('sha256')
    .update(`shield-report:${parsed.data.bookingId}:${uid}`)
    .digest('hex')
    .slice(0, 36);

  const now = new Date().toISOString();
  const slaDeadlineAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const doc: ComplaintDoc = {
    id: shieldId,
    orderId: parsed.data.bookingId,
    customerId: booking.customerId,
    technicianId: uid,
    description: parsed.data.description ?? 'Abusive customer â€” tech-initiated report',
    type: 'ABUSIVE_CUSTOMER_SHIELD',
    status: 'NEW',
    internalNotes: [],
    slaDeadlineAt,
    escalated: false,
    ackBreached: false,
    ...(parsed.data.evidenceUrls?.length ? { evidenceUrls: parsed.data.evidenceUrls } : {}),
    createdAt: now,
    updatedAt: now,
  };

  try {
    await createComplaint(doc);
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 409) {
      return { status: 409, jsonBody: { code: 'SHIELD_ALREADY_FILED' } };
    }
    throw err;
  }

  addBlockedCustomer(uid, booking.customerId).catch((e) => Sentry.captureException(e));
  sendAbusiveShieldAlert({ bookingId: parsed.data.bookingId, technicianId: uid, customerId: booking.customerId })
    .catch((e) => Sentry.captureException(e));

  return { status: 201, jsonBody: { complaintId: shieldId } };
}

app.http('shieldReport', {
  route: 'v1/technicians/me/shield-report',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: shieldReportHandler,
});

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'api/src/schemas/device-token.ts'; Get-ChildItem -Recurse -Path 'customer-app/app/src/main/kotlin' -Include '*.kt' | Select-String -Pattern 'unregisterDevice\\(' -Context 2,2" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 908ms:
import { z } from 'zod';

export const DeviceTokenSchema = z.object({
  userId:      z.string().min(1),
  userType:    z.enum(['customer', 'technician', 'admin']),
  deviceToken: z.string().min(100).max(4096),
  platform:    z.enum(['android', 'web']),
  lastSeen:    z.string().datetime(),
  appBuild:    z.string().optional(),
});

export type DeviceTokenDoc = z.infer<typeof DeviceTokenSchema> & { id: string };

/** Body accepted by POST /device-tokens/register */
export const RegisterDeviceTokenBodySchema = z.object({
  deviceToken: z.string().min(100).max(4096),
  platform:    z.enum(['android', 'web']),
  appBuild:    z.string().optional(),
});

export type RegisterDeviceTokenBody = z.infer<typeof RegisterDeviceTokenBodySchema>;

  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:22:
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:23:    @DELETE("v1/devices/me")
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:24:    public suspend fun 
unregisterDevice(
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:25:        
@Header("X-Device-Token") deviceToken: String,
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:26:    )
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:61:            
runCatching {
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:62:                
val token = firebaseMessaging.token.await()
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:63:                
deviceApi.unregisterDevice(token)
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:64:            
}.onFailure { e ->
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:65:                
Sentry.addBreadcrumb(



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'api/src/cosmos/device-token-repository.ts'" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 524ms:
import { getDeviceTokensContainer } from './client.js';
import type { DeviceTokenDoc } from '../schemas/device-token.js';

type UserType = DeviceTokenDoc['userType'];

export class DeviceTokenRepository {
  private get container() { return getDeviceTokensContainer(); }

  /**
   * Upserts a device token for the given user.
   * id = `${userId}:${deviceToken}` so each physical device gets one doc per user.
   * lastSeen is refreshed on every call â€” used by pruneStaleTokens.
   */
  async registerDeviceToken(
    userId:      string,
    userType:    UserType,
    deviceToken: string,
    platform:    string,
    appBuild?:   string,
  ): Promise<void> {
    const doc: DeviceTokenDoc = {
      id: `${userId}:${deviceToken}`,
      userId,
      userType,
      deviceToken,
      platform:  platform as DeviceTokenDoc['platform'],
      lastSeen:  new Date().toISOString(),
      ...(appBuild !== undefined ? { appBuild } : {}),
    };
    await this.container.items.upsert(doc);
  }

  /**
   * Returns the raw FCM token strings for a user.
   * SELECT projects only deviceToken â€” no PII (userId / appBuild) leaves this call.
   */
  async getDeviceTokensForUser(userId: string): Promise<string[]> {
    const { resources } = await this.container.items
      .query<{ deviceToken: string }>({
        query: 'SELECT c.deviceToken FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll();
    return resources.map((r) => r.deviceToken);
  }

  /**
   * Removes a specific device token (e.g. on FCM unregistered callback).
   * Silently ignores 404 â€” token may already have been pruned.
   */
  async unregisterDeviceToken(userId: string, deviceToken: string): Promise<void> {
    try {
      await this.container.item(`${userId}:${deviceToken}`, userId).delete();
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 404) return;
      throw err;
    }
  }

  /**
   * Deletes all device tokens for a user â€” call on sign-out / account deletion.
   * Queries then deletes individually (Cosmos Serverless has no bulk delete).
   */
  async unregisterAllForUser(userId: string): Promise<void> {
    const { resources } = await this.container.items
      .query<{ id: string; userId: string }>({
        query: 'SELECT c.id, c.userId FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll();

    await Promise.all(
      resources.map((doc) => this.container.item(doc.id, doc.userId).delete()),
    );
  }

  /**
   * Returns all device tokens registered by admin users (userType = 'admin').
   * Cross-partition query â€” used for sending to all enrolled admin browsers.
   */
  async getAllAdminDeviceTokens(): Promise<string[]> {
    const { resources } = await this.container.items
      .query<{ deviceToken: string }>({
        query: "SELECT c.deviceToken FROM c WHERE c.userType = 'admin'",
      })
      .fetchAll();
    return resources.map((r) => r.deviceToken);
  }

  /**
   * Deletes tokens whose lastSeen is older than `olderThanDays` days.
   * Called by a daily timer trigger (E19-S02 WS-C).
   * Returns the number of tokens deleted.
   */
  async pruneStaleTokens(olderThanDays: number): Promise<number> {
    const cutoff = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { resources } = await this.container.items
      .query<{ id: string; userId: string }>({
        query: 'SELECT c.id, c.userId FROM c WHERE c.lastSeen < @cutoff',
        parameters: [{ name: '@cutoff', value: cutoff }],
      })
      .fetchAll();

    await Promise.all(
      resources.map((doc) => this.container.item(doc.id, doc.userId).delete()),
    );

    return resources.length;
  }
}

export const deviceTokenRepo = new DeviceTokenRepository();

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path 'customer-app/app/src/main/AndroidManifest.xml' -Pattern 'dataExtractionRules|fullBackupContent|allowBackup' -Context 1,1" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 778ms:

  customer-app\app\src\main\AndroidManifest.xml:16:        android:name=".HomeservicesCustomerApplication"
> customer-app\app\src\main\AndroidManifest.xml:17:        android:allowBackup="false"
> customer-app\app\src\main\AndroidManifest.xml:18:        android:fullBackupContent="false"
> customer-app\app\src\main\AndroidManifest.xml:19:        android:dataExtractionRules="@xml/data_extraction_rules"
  customer-app\app\src\main\AndroidManifest.xml:20:        android:icon="@mipmap/ic_launcher_homeheroo"



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'core-nav','customer-app/app/src/test','customer-app/app/src/main' -Include '*.kt' | Select-String -Pattern 'DeepLinkUri\\.build|DeepLinkUri\\.parse|pendingActionNavRoute|entityId\\s*=|entityId\"|routeUri' -CaseSensitive:"'$false | Select-Object -First 200' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 753ms:

core-nav\src\main\kotlin\com\homeservices\corenav\DeepLinkUri.kt:16: *   query:   entityId=<entityId>&<rawArgs 
key=value pairs>
core-nav\src\main\kotlin\com\homeservices\corenav\DeepLinkUri.kt:23:    private const val ENTITY_ID_KEY = "entityId"
core-nav\src\main\kotlin\com\homeservices\corenav\DeepLinkUri.kt:66:            val entityId = 
queryParams[ENTITY_ID_KEY]?.takeIf { it.isNotEmpty() } ?: return null
core-nav\src\main\kotlin\com\homeservices\corenav\DeepLinkUri.kt:74:                entityId = entityId,
core-nav\src\main\kotlin\com\homeservices\corenav\NotificationRouter.kt:20:     * Parse a deep-link URI string (e.g. 
`homeservices://action/JOB_OFFER?entityId=xyz`)
core-nav\src\main\kotlin\com\homeservices\corenav\PendingAction.kt:29:    val routeUri: String,
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:8: * Unit tests for [DeepLinkUri.build] and 
[DeepLinkUri.parse].
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:22:    ) = NotificationIntent(type = type, 
entityId = entityId, rawArgs = rawArgs)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:31:            val uri = 
DeepLinkUri.build(original)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:32:            val parsed = DeepLinkUri.parse(uri)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:44:                    entityId = "booking-123",
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:47:            val uri = 
DeepLinkUri.build(original)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:48:            val parsed = DeepLinkUri.parse(uri)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:61:                    entityId = "complaint-99",
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:64:            val uri = 
DeepLinkUri.build(original)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:65:            val parsed = DeepLinkUri.parse(uri)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:75:            val uri = 
DeepLinkUri.build(original)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:76:            val parsed = DeepLinkUri.parse(uri)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:92:                    entityId = "ticket-1",
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:95:            val uri = 
DeepLinkUri.build(original)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:97:            val parsed = DeepLinkUri.parse(uri)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:106:                    entityId = "ticket-2",
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:109:            val uri = 
DeepLinkUri.build(original)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:110:            val parsed = 
DeepLinkUri.parse(uri)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:122:                    entityId = "ticket-3",
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:125:            val uri = 
DeepLinkUri.build(original)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:126:            val parsed = 
DeepLinkUri.parse(uri)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:135:                    entityId = "ticket-4",
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:138:            val uri = 
DeepLinkUri.build(original)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:139:            val parsed = 
DeepLinkUri.parse(uri)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:150:            val uri = 
DeepLinkUri.build(intent())
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:156:            val uri = 
DeepLinkUri.build(intent(PendingActionType.JOB_OFFER))
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:167:            val result = 
DeepLinkUri.parse("not-a-uri")
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:173:            val result = 
DeepLinkUri.parse("https://action/JOB_OFFER?entityId=x")
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:179:            val result = 
DeepLinkUri.parse("homeservices://other/JOB_OFFER?entityId=x")
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:185:            val result = 
DeepLinkUri.parse("homeservices://action/UNKNOWN_TYPE?entityId=x")
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:191:            val result = 
DeepLinkUri.parse("homeservices://action/JOB_OFFER")
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:197:            val result = DeepLinkUri.parse("")
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:208:            // entityId = 
"../../delete_account" — must be rejected by allowlist
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:209:            val uri = 
"homeservices://action/RATING_PROMPT_CUSTOMER?entityId=..%2F..%2Fdelete_account"
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:210:            val result = 
DeepLinkUri.parse(uri)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:216:            val uri = 
"homeservices://action/ADDON_APPROVAL_REQUESTED?entityId=bk-001%2Ffoo"
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:217:            val result = 
DeepLinkUri.parse(uri)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:223:            val uri = 
"homeservices://action/RATING_PROMPT_CUSTOMER?entityId=bk-test-123"
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:224:            val result = 
DeepLinkUri.parse(uri)
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:232:            val uri = 
"homeservices://action/RATING_PROMPT_CUSTOMER?entityId=$longId"
core-nav\src\test\kotlin\com\homeservices\corenav\DeepLinkUriTest.kt:233:            val result = 
DeepLinkUri.parse(uri)
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:33:        entityId = entityId,
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:34:        routeUri = 
"homeservices://action/${type.name}?entityId=$entityId",
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:270:                                    entityId = 
"offer-1",
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:289:                                    entityId = 
"complaint-1",
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:294:                                    entityId = 
"offer-1",
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:420:                        entityId = 
"offer-later",
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:428:                        entityId = 
"offer-sooner",
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:446:                        entityId = 
"offer-no-expiry",
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:454:                        entityId = 
"offer-with-expiry",
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:472:                        entityId = 
"offer-newer",
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:480:                        entityId = 
"offer-older",
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:498:                        entityId = "offer-b",
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:506:                        entityId = "offer-a",
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:524:                        entityId = "offer-c",
core-nav\src\test\kotlin\com\homeservices\corenav\TierLadderTest.kt:532:                        entityId = "offer-a",
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:74:        
entityId = "entity-$id",
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:75:        
routeUri = "homeservices://action/$type?entityId=entity-$id",
customer-app\app\src\test\kotlin\com\homeservices\customer\navigation\PendingActionNavObserverTest.kt:23:        val 
route = pendingActionNavRoute(PendingActionType.ADDON_APPROVAL_REQUESTED, bookingId)
customer-app\app\src\test\kotlin\com\homeservices\customer\navigation\PendingActionNavObserverTest.kt:30:        val 
route = pendingActionNavRoute(PendingActionType.RATING_PROMPT_CUSTOMER, bookingId)
customer-app\app\src\test\kotlin\com\homeservices\customer\navigation\PendingActionNavObserverTest.kt:36:        val 
route = pendingActionNavRoute(PendingActionType.COMPLAINT_UPDATE, "cmp-1")
customer-app\app\src\test\kotlin\com\homeservices\customer\navigation\PendingActionNavObserverTest.kt:42:        val 
route = pendingActionNavRoute(PendingActionType.SUPPORT_FOLLOWUP, "t-1")
customer-app\app\src\test\kotlin\com\homeservices\customer\navigation\PendingActionNavObserverTest.kt:50:        val 
route = pendingActionNavRoute(PendingActionType.ADDON_APPROVAL_REQUESTED, "../../delete_account")
customer-app\app\src\test\kotlin\com\homeservices\customer\navigation\PendingActionNavObserverTest.kt:56:        val 
route = pendingActionNavRoute(PendingActionType.RATING_PROMPT_CUSTOMER, "<script>alert(1)</script>")
customer-app\app\src\test\kotlin\com\homeservices\customer\notification\CustomerNotificationRouterTest.kt:155:        
val uri = "homeservices://action/COMPLAINT_UPDATE?entityId=cmp3"
customer-app\app\src\test\kotlin\com\homeservices\customer\notification\CustomerNotificationRouterTest.kt:171:        
val result = router.parseDeepLink("homeservices://action/DOES_NOT_EXIST?entityId=x")
customer-app\app\src\test\kotlin\com\homeservices\customer\notification\PendingActionIngestorTest.kt:209:            
entityId = "c1",
customer-app\app\src\test\kotlin\com\homeservices\customer\notification\PendingActionIngestorTest.kt:210:            
routeUri = "homeservices://action/COMPLAINT_UPDATE?entityId=c1",
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeScreenPaparazziTest.kt:40:         
   entityId = "bk-$id",
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeScreenPaparazziTest.kt:41:         
   routeUri = "homeservices://action/RATING_PROMPT_CUSTOMER?bookingId=bk-$id",
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeViewModelTest.kt:49:            
entityId = "bk-$id",
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeViewModelTest.kt:50:            
routeUri = "homeservices://action/RATING_PROMPT_CUSTOMER?bookingId=bk-$id",
customer-app\app\src\test\kotlin\com\homeservices\customer\MainActivityDeepLinkTest.kt:43:        val uri = 
Uri.parse("homeservices://action/ADDON_APPROVAL_REQUESTED?entityId=bk1")
customer-app\app\src\test\kotlin\com\homeservices\customer\MainActivityDeepLinkTest.kt:50:            
.isEqualTo("homeservices://action/ADDON_APPROVAL_REQUESTED?entityId=bk1")
customer-app\app\src\test\kotlin\com\homeservices\customer\MainActivityDeepLinkTest.kt:56:        val uri = 
Uri.parse("homeservices://action/RATING_PROMPT_CUSTOMER?entityId=bk2")
customer-app\app\src\test\kotlin\com\homeservices\customer\MainActivityDeepLinkTest.kt:63:            
.isEqualTo("homeservices://action/RATING_PROMPT_CUSTOMER?entityId=bk2")
customer-app\app\src\test\kotlin\com\homeservices\customer\MainActivityDeepLinkTest.kt:68:        val initialValue = 
"homeservices://action/ADDON_APPROVAL_REQUESTED?entityId=old"
customer-app\app\src\test\kotlin\com\homeservices\customer\MainActivityDeepLinkTest.kt:92:        val initialValue = 
"homeservices://action/COMPLAINT_UPDATE?entityId=c1"
customer-app\app\src\test\kotlin\com\homeservices\customer\MainActivityDeepLinkTest.kt:106:        val uri = 
Uri.parse("homeservices://action/COMPLAINT_UPDATE?entityId=cmp5")
customer-app\app\src\test\kotlin\com\homeservices\customer\MainActivityDeepLinkTest.kt:112:            
.isEqualTo("homeservices://action/COMPLAINT_UPDATE?entityId=cmp5")
customer-app\app\src\main\kotlin\com\homeservices\customer\data\pendingaction\db\PendingActionEntity.kt:41:    public 
val routeUri: String,
customer-app\app\src\main\kotlin\com\homeservices\customer\data\pendingaction\PendingActionStore.kt:107:            
entityId = entityId,
customer-app\app\src\main\kotlin\com\homeservices\customer\data\pendingaction\PendingActionStore.kt:108:            
routeUri = routeUri,
customer-app\app\src\main\kotlin\com\homeservices\customer\data\pendingaction\PendingActionStore.kt:126:            
entityId = entityId,
customer-app\app\src\main\kotlin\com\homeservices\customer\data\pendingaction\PendingActionStore.kt:127:            
routeUri = routeUri,
customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:318:           
 entityId = intent.entityId,
customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:319:           
 routeUri = deepLinkUri,
customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:66: *   - [initialDeepLink]: 
`homeservices://action/<TYPE>?entityId=<id>` URI extracted from
customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:280:                    val 
route = pendingActionNavRoute(action.type, action.entityId)
customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:315: * E11-S01b-1: Cold-start 
deep-link routing for `homeservices://action/<TYPE>?entityId=<id>`.
customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:331:        val intent = 
DeepLinkUri.parse(initialDeepLink) ?: return@LaunchedEffect
customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:26:public fun 
pendingActionNavRoute(
customer-app\app\src\main\kotlin\com\homeservices\customer\notification\CustomerNotificationRouter.kt:17: *   - 
ADDON_APPROVAL_REQUESTED (entityId = bookingId)
customer-app\app\src\main\kotlin\com\homeservices\customer\notification\CustomerNotificationRouter.kt:18: *   - 
RATING_PROMPT_CUSTOMER (entityId = bookingId)
customer-app\app\src\main\kotlin\com\homeservices\customer\notification\CustomerNotificationRouter.kt:19: *   - 
COMPLAINT_UPDATE (entityId = complaintId)
customer-app\app\src\main\kotlin\com\homeservices\customer\notification\CustomerNotificationRouter.kt:20: *   - 
SUPPORT_FOLLOWUP (entityId = ticketId)
customer-app\app\src\main\kotlin\com\homeservices\customer\notification\CustomerNotificationRouter.kt:57:              
      entityId = entityId,
customer-app\app\src\main\kotlin\com\homeservices\customer\notification\CustomerNotificationRouter.kt:75:         * 
Parse a `homeservices://action/<TYPE>?entityId=<id>` deep-link URI.
customer-app\app\src\main\kotlin\com\homeservices\customer\notification\CustomerNotificationRouter.kt:76:         * 
Delegates to [DeepLinkUri.parse] for scheme/host/query validation.
customer-app\app\src\main\kotlin\com\homeservices\customer\notification\CustomerNotificationRouter.kt:78:        
override fun parseDeepLink(uri: String): NotificationIntent? = DeepLinkUri.parse(uri)
customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeTabContent.kt:77: * @param 
onPendingActionClick Called with the [PendingAction.routeUri] when a pending action
customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeTabContent.kt:88:    
onPendingActionClick: (routeUri: String) -> Unit,
customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeTabContent.kt:165:            
PendingActionCard(action = action, onClick = { onActionClick(action.routeUri) })
customer-app\app\src\main\kotlin\com\homeservices\customer\MainActivity.kt:92:        // 
homeservices://action/<TYPE>?entityId=<id> deep links from notification tray



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'customer-app/app/src/main/kotlin/com/homeservices/customer/notification/CustomerNotificationRouter.kt' | Select-Object -First 130; Get-Content -LiteralPath 'customer-app/app/src/main/kotlin/com/homeservices/customer/firebase/CustomerFirebaseMessagingService.kt' | Select-Object -Skip 250 -First 100" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 489ms:
package com.homeservices.customer.notification

import com.homeservices.corenav.DeepLinkUri
import com.homeservices.corenav.NotificationIntent
import com.homeservices.corenav.NotificationRouter
import com.homeservices.corenav.PendingActionType
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Customer-app implementation of [NotificationRouter].
 *
 * Parses raw FCM data payloads and `homeservices://` deep-link URIs into
 * [NotificationIntent] values for downstream processing by [PendingActionIngestor].
 *
 * Customer FCM types:
 *   - ADDON_APPROVAL_REQUESTED (entityId = bookingId)
 *   - RATING_PROMPT_CUSTOMER (entityId = bookingId)
 *   - COMPLAINT_UPDATE (entityId = complaintId)
 *   - SUPPORT_FOLLOWUP (entityId = ticketId)
 *   - (location/tracking types are handled by TrackingEventBus â€” not persisted as pending actions)
 *
 * Per E11 spec Â§2.8: NotificationRouter is a pure parser â€” no persistence, no network.
 *
 * ## Dual-shape payload support (E11-S01b-1 fix)
 *
 * The backend projector emits two overlapping shapes in the same FCM data map:
 *
 * ### Shape 1 â€” projector shape (always present for projector-delivered events):
 *   `type`, `actionId`, `sourceId`, `payload` (JSON string of PendingActionDoc.payload)
 *
 * ### Shape 2 â€” legacy per-type top-level IDs (compat fields, present for some types):
 *   `bookingId`, `complaintId`, `ticketId` (hoisted from payload for customer types)
 *
 * Entity ID resolution prefers the per-type legacy field when present (Shape 2), then
 * falls back to `sourceId` from the projector shape (Shape 1).
 */
@Singleton
public class CustomerNotificationRouter
    @Inject
    constructor() : NotificationRouter {
        /**
         * Parse a raw FCM data payload into a [NotificationIntent].
         *
         * Entity ID resolution priority (see class-level KDoc for shape details):
         *   1. Per-type legacy top-level key (bookingId / complaintId / ticketId)
         *   2. `sourceId` (projector shape fallback)
         *
         * Returns null if:
         * - `type` key is absent or maps to a non-customer [PendingActionType]
         * - No entity ID can be resolved from either shape
         */
        override fun parseFcmData(data: Map<String, String>): NotificationIntent? =
            resolveTypeAndEntityId(data)?.let { (type, entityId) ->
                NotificationIntent(
                    type = type,
                    entityId = entityId,
                    rawArgs = data.filterKeys { it != "type" },
                )
            }

        /**
         * Resolve the [PendingActionType] and entity ID from the raw FCM data map.
         *
         * Returns null if `type` is absent/unknown or no entity ID can be resolved.
         * Extracted to satisfy detekt ReturnCount limit on [parseFcmData].
         */
        private fun resolveTypeAndEntityId(data: Map<String, String>): Pair<PendingActionType, String>? {
            val typeName = data["type"] ?: return null
            val type = runCatching { PendingActionType.valueOf(typeName) }.getOrNull()
            return type?.let { t -> resolveEntityId(t, data)?.let { id -> t to id } }
        }

        /**
         * Parse a `homeservices://action/<TYPE>?entityId=<id>` deep-link URI.
         * Delegates to [DeepLinkUri.parse] for scheme/host/query validation.
         */
        override fun parseDeepLink(uri: String): NotificationIntent? = DeepLinkUri.parse(uri)

        // â”€â”€ Private helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        /**
         * Resolve the entity ID for a given FCM type from the raw data map.
         *
         * Tries per-type legacy top-level keys first (Shape 2). If absent, falls back
         * to the projector `sourceId` field (Shape 1). Returns null only if both are
         * absent or empty.
         */
        private fun resolveEntityId(
            type: PendingActionType,
            data: Map<String, String>,
        ): String? {
            // Shape 2: per-type legacy top-level key (hoisted by _fcmCompatFields in
            // pending-action-projector.ts for types that older clients need).
            val legacyId =
                when (type) {
                    PendingActionType.COMPLAINT_UPDATE ->
                        data["complaintId"]?.takeIf { it.isNotEmpty() }
                    PendingActionType.SUPPORT_FOLLOWUP ->
                        data["ticketId"]?.takeIf { it.isNotEmpty() }
                    else ->
                        data["bookingId"]?.takeIf { it.isNotEmpty() }
                }

            if (legacyId != null) return legacyId

            // Shape 1 fallback: projector sourceId (present for all projector-delivered
            // events where no legacy compat key is hoisted).
            return data["sourceId"]?.takeIf { it.isNotEmpty() }
        }
    }
        bookingId: String,
    ) {
        val lat = data["lat"]?.toDoubleOrNull() ?: return
        val lng = data["lng"]?.toDoubleOrNull() ?: return
        val eta = data["etaMinutes"]?.toIntOrNull() ?: 0
        trackingEventBus.post(
            TrackingEvent.LocationUpdate(
                bookingId = bookingId,
                lat = lat,
                lng = lng,
                etaMinutes = eta,
                techName = data["techName"] ?: "",
                techPhotoUrl = data["techPhotoUrl"] ?: "",
            ),
        )
    }

    private fun handleBookingStatusUpdate(
        data: Map<String, String>,
        bookingId: String,
    ) {
        val status = data["status"] ?: return
        trackingEventBus.post(
            TrackingEvent.StatusUpdate(bookingId = bookingId, status = status),
        )
    }

    // â”€â”€ PendingAction builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * Build a [com.homeservices.corenav.PendingAction] from a parsed [NotificationIntent]
     * and the raw FCM data payload.
     *
     * The action ID follows the deterministic compound format:
     * `<TYPE>:<role>:<userId>:<entityType>:<entityId>`
     *
     * This method returns null if the userId is absent (unauthenticated context).
     */
    private fun buildPendingActionFromIntent(
        intent: com.homeservices.corenav.NotificationIntent,
        data: Map<String, String>,
    ): com.homeservices.corenav.PendingAction? {
        val userId = data["userId"] ?: return null
        val actionId =
            data["actionId"]
                ?: "${intent.type.name}:customer:$userId:${intent.type.name.lowercase()}:${intent.entityId}"
        val version = data["version"]?.toLongOrNull() ?: 1L
        val priority =
            runCatching {
                com.homeservices.corenav.PendingActionPriority
                    .valueOf(data["priority"] ?: "NORMAL")
            }.getOrDefault(com.homeservices.corenav.PendingActionPriority.NORMAL)
        val entityType = data["entityType"] ?: intent.type.name.lowercase()
        val nowMs = System.currentTimeMillis()
        val createdAt = data["createdAt"]?.toLongOrNull() ?: nowMs
        val updatedAt = data["updatedAt"]?.toLongOrNull() ?: nowMs
        val expiresAt = data["expiresAt"]?.toLongOrNull()
        val deepLinkUri =
            com.homeservices.corenav.DeepLinkUri
                .build(intent)

        return com.homeservices.corenav.PendingAction(
            id = actionId,
            userId = userId,
            role = "customer",
            type = intent.type,
            entityType = entityType,
            entityId = intent.entityId,
            routeUri = deepLinkUri,
            priority = priority,
            status = com.homeservices.corenav.PendingActionStatus.ACTIVE,
            sourceStatus = data["sourceStatus"],
            version = version,
            createdAt = createdAt,
            updatedAt = updatedAt,
            expiresAt = expiresAt,
            resolvedAt = null,
        )
    }

    public companion object {
        public const val CHANNEL_BOOKINGS: String = "bookings"
        public const val CHANNEL_OFFERS: String = "offers"
        public const val CHANNEL_COMPLAINTS: String = "complaints"
        public const val CHANNEL_CREDITS: String = "credits"
        public const val CHANNEL_SYSTEM: String = "system"

        /** Register all 5 notification channels. Call from Application.onCreate.
         *  Notification channels are an Oreo+ API; the project's minSdk is 26 so the
         *  pre-Oreo guard is unnecessary (lint flags it as ObsoleteSdkInt). */
        public fun registerChannels(context: Context) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannels(
                listOf(
                    NotificationChannel(
                        CHANNEL_BOOKINGS,
                        "Bookings",
                        NotificationManager.IMPORTANCE_HIGH,
                    ).apply { description = "Booking status updates" },
                    NotificationChannel(

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'customer-app/app/src/main/kotlin' -Include '*.kt' | Select-String -Pattern 'HttpLoggingInterceptor|Level\\.HEADERS|Level\\.BODY|addInterceptor|X-Device-Token' -CaseSensitive:"'$false -Context 2,2 | Select-Object -First 200' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 659ms:

  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:9:import 
dagger.hilt.components.SingletonComponent
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:10:import 
okhttp3.OkHttpClient
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:11:import 
okhttp3.logging.HttpLoggingInterceptor
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:12:import 
retrofit2.Retrofit
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:13:import 
retrofit2.converter.moshi.MoshiConverterFactory
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:32:        
OkHttpClient
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:33:            
.Builder()
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:34:            
.addInterceptor(
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:35:                
HttpLoggingInterceptor().apply {
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:36:                  
  level =
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:37:                  
      if (BuildConfig.DEBUG) {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:38:                  
          HttpLoggingInterceptor.Level.BODY
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:39:                  
      } else {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:40:                  
          HttpLoggingInterceptor.Level.NONE
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:41:                  
      }
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\remote\di\AuthApiModule.kt:42:                },
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:16:import 
dagger.hilt.components.SingletonComponent
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:17:import 
okhttp3.OkHttpClient
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:18:import 
okhttp3.logging.HttpLoggingInterceptor
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:19:import 
retrofit2.Retrofit
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:20:import 
retrofit2.converter.moshi.MoshiConverterFactory
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:58:            
OkHttpClient
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:59:                
.Builder()
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:60:                
.addInterceptor { chain ->
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:61:                    
// Non-blocking: reads the pre-fetched cached token.
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:62:                    
// IdTokenCache refreshes every 55 min in the background so
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:74:                      
  }
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:75:                    
chain.proceed(req)
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:76:                
}.addInterceptor(
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:77:                    
HttpLoggingInterceptor().apply {
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:78:                      
  level =
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:79:                      
      if (BuildConfig.DEBUG) {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:80:                      
          HttpLoggingInterceptor.Level.BODY
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:81:                      
      } else {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:82:                      
          HttpLoggingInterceptor.Level.NONE
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:83:                      
      }
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:84:                    },
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:13:import 
dagger.hilt.components.SingletonComponent
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:14:import 
okhttp3.OkHttpClient
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:15:import 
okhttp3.logging.HttpLoggingInterceptor
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:16:import 
retrofit2.Retrofit
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:17:import 
retrofit2.converter.moshi.MoshiConverterFactory
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:38:            
OkHttpClient
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:39:                
.Builder()
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:40:                
.addInterceptor(
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:41:                  
  HttpLoggingInterceptor().apply {
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:42:                  
      level =
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:43:                  
          if (BuildConfig.DEBUG) {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:44:                  
              HttpLoggingInterceptor.Level.BODY
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:45:                  
          } else {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:46:                  
              HttpLoggingInterceptor.Level.NONE
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:47:                  
          }
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\di\CatalogueModule.kt:48:                  
  },
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:13: *
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:14: * - POST 
/v1/devices/register  — register or refresh a device token
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:15: * - DELETE /v1/devices/me    
  — de-register a token on sign-out; token sent as X-Device-Token header
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:16: */
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:17:public interface DeviceApi {
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:23:    @DELETE("v1/devices/me")
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:24:    public suspend fun 
unregisterDevice(
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:25:        
@Header("X-Device-Token") deviceToken: String,
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:26:    )
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt:27:}
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:12:import 
dagger.hilt.components.SingletonComponent
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:13:import 
okhttp3.OkHttpClient
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:14:import 
okhttp3.logging.HttpLoggingInterceptor
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:15:import 
retrofit2.Retrofit
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:16:import 
retrofit2.converter.moshi.MoshiConverterFactory
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:38:            
OkHttpClient
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:39:                
.Builder()
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:40:                
.addInterceptor(
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:41:                
    HttpLoggingInterceptor().apply {
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:42:                
        level =
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:43:                
            if (BuildConfig.DEBUG) {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:44:                
                HttpLoggingInterceptor.Level.BODY
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:45:                
            } else {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:46:                
                HttpLoggingInterceptor.Level.NONE
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:47:                
            }
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\technician\di\TechnicianModule.kt:48:                
    },



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'customer-app/app/src/main/kotlin/com/homeservices/customer/data/device' -Include '*.kt' | ForEach-Object { "'$_.FullName; Get-Content -LiteralPath $_.FullName | Select-Object -First 200 }' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 576ms:
C:\Alok\Business Projects\Urbanclap-sprint4\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\di\DeviceModule.kt
package com.homeservices.customer.data.device.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.device.DeviceApi
import com.squareup.moshi.Moshi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

/**
 * Hilt module that provides [DeviceApi] for device-token registration.
 *
 * Uses the shared [AuthOkHttpClient] so every request carries a Firebase Bearer token.
 * [DeviceTokenRegistrar] itself is `@Singleton` + `@Inject constructor` and does not
 * need an explicit `@Provides` binding.
 */
@Module
@InstallIn(SingletonComponent::class)
public object DeviceModule {
    @Provides
    @Singleton
    public fun provideDeviceApi(
        @AuthOkHttpClient client: OkHttpClient,
        moshi: Moshi,
    ): DeviceApi =
        Retrofit
            .Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .client(client)
            .build()
            .create(DeviceApi::class.java)
}
C:\Alok\Business Projects\Urbanclap-sprint4\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceApi.kt
package com.homeservices.customer.data.device

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.Header
import retrofit2.http.POST

/**
 * Retrofit interface for device-token registration endpoints.
 *
 * Authentication is handled by the shared [AuthOkHttpClient] interceptor which
 * attaches a Firebase Bearer token to every request.
 *
 * - POST /v1/devices/register  â€” register or refresh a device token
 * - DELETE /v1/devices/me      â€” de-register a token on sign-out; token sent as X-Device-Token header
 */
public interface DeviceApi {
    @POST("v1/devices/register")
    public suspend fun registerDevice(
        @Body body: RegisterDeviceRequest,
    )

    @DELETE("v1/devices/me")
    public suspend fun unregisterDevice(
        @Header("X-Device-Token") deviceToken: String,
    )
}
C:\Alok\Business Projects\Urbanclap-sprint4\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt
package com.homeservices.customer.data.device

import com.google.firebase.messaging.FirebaseMessaging
import io.sentry.Breadcrumb
import io.sentry.Sentry
import io.sentry.SentryLevel
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Best-effort device-token registration against the homeservices API.
 *
 * Both [register] and [unregister] swallow all exceptions via [runCatching]:
 * failures are logged as Sentry breadcrumbs but never propagate to callers.
 * This means they can be called freely from [SessionManager] without
 * disrupting the sign-in / sign-out flow.
 */
@Singleton
public class DeviceTokenRegistrar
    @Inject
    constructor(
        private val firebaseMessaging: FirebaseMessaging,
        private val deviceApi: DeviceApi,
    ) {
        /**
         * Fetches the current FCM registration token and POSTs it to the API.
         *
         * @param appBuild optional version string (e.g. "1.2.3") included in the
         *                 request for server-side analytics and push targeting.
         */
        public suspend fun register(appBuild: String? = null) {
            runCatching {
                val token = firebaseMessaging.token.await()
                deviceApi.registerDevice(
                    RegisterDeviceRequest(
                        deviceToken = token,
                        platform = "android",
                        appBuild = appBuild,
                    ),
                )
            }.onFailure { e ->
                Sentry.addBreadcrumb(
                    Breadcrumb().apply {
                        category = "device.token"
                        message = "DeviceTokenRegistrar.register failed: ${e.message}"
                        level = SentryLevel.WARNING
                    },
                )
            }
        }

        /**
         * Fetches the current FCM token and issues a DELETE to remove it from the
         * server's active-token list.
         *
         * Called during sign-out (Step 6c) so that push messages are no longer
         * delivered to this device after the user logs out.
         */
        public suspend fun unregister() {
            runCatching {
                val token = firebaseMessaging.token.await()
                deviceApi.unregisterDevice(token)
            }.onFailure { e ->
                Sentry.addBreadcrumb(
                    Breadcrumb().apply {
                        category = "device.token"
                        message = "DeviceTokenRegistrar.unregister failed: ${e.message}"
                        level = SentryLevel.WARNING
                    },
                )
            }
        }
    }
C:\Alok\Business Projects\Urbanclap-sprint4\customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\RegisterDeviceRequest.kt
package com.homeservices.customer.data.device

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * Request body for POST /v1/devices/register.
 *
 * [appBuild] is optional; the server uses it for analytics and targeted push filtering.
 */
@JsonClass(generateAdapter = true)
public data class RegisterDeviceRequest(
    @Json(name = "deviceToken") val deviceToken: String,
    @Json(name = "platform") val platform: String,
    @Json(name = "appBuild") val appBuild: String? = null,
)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/di/BookingModule.kt' | Select-Object -First 120" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 974ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'customer-app/app/src/main/kotlin','customer-app/app/src/test/kotlin' -Include '*.kt' | Select-String -Pattern 'Breadcrumb\\(\\).*apply|category =|level = SentryLevel|message =' -Context 0,3 | Select-Object -First 100" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1023ms:

> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:128:                        
io.sentry.Breadcrumb().apply {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:129:                          
  category = "auth.signin"
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:130:                          
  message = "deviceTokenRegistrar.register failed: ${e.message}"
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:131:                          
  level = SentryLevel.WARNING
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:132:                        },
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:133:                    )
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:134:                }
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:201:                        
io.sentry.Breadcrumb().apply {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:202:                          
  category = "auth.signout"
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:203:                          
  message = "deviceTokenRegistrar.unregister failed: ${e.message}"
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:204:                          
  level = SentryLevel.WARNING
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:205:                        },
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:206:                    )
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:207:                }
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:215:                        
io.sentry.Breadcrumb().apply {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:216:                          
  category = "auth.signout"
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:217:                          
  message = "idTokenCache.signalSignOut() failed: ${e.message}"
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:218:                          
  level = SentryLevel.WARNING
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:219:                        },
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:220:                    )
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:221:                }
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:230:                        
io.sentry.Breadcrumb().apply {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:231:                          
  category = "auth.signout"
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:232:                          
  message = "firebaseAuth.signOut() failed: ${e.message}"
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:233:                          
  level = SentryLevel.WARNING
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:234:                        },
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:235:                    )
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:236:                }
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:245:                    
io.sentry.Breadcrumb().apply {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:246:                        
category = "auth.signout"
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:247:                        
message = "FCM deleteToken failed: ${e.message}"
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:248:                        
level = SentryLevel.WARNING
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:249:                    },
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:250:                )
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\auth\SessionManager.kt:251:            }
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\remote\dto\CategoryDto.kt:25:public fun 
CategoryDto.toDomain(): com.homeservices.customer.domain.catalogue.model.Category =
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\remote\dto\CategoryDto.kt:26:    
com.homeservices.customer.domain.catalogue.model.Category(
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\remote\dto\CategoryDto.kt:27:        id = 
id,
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\catalogue\remote\dto\CategoryDto.kt:28:        name 
= name,
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:44:                   
 Breadcrumb().apply {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:45:                   
     category = "device.token"
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:46:                   
     message = "DeviceTokenRegistrar.register failed: ${e.message}"
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:47:                   
     level = SentryLevel.WARNING
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:48:                   
 },
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:49:                )
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:50:            }
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:66:                   
 Breadcrumb().apply {
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:67:                   
     category = "device.token"
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:68:                   
     message = "DeviceTokenRegistrar.unregister failed: ${e.message}"
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:69:                   
     level = SentryLevel.WARNING
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:70:                   
 },
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:71:                )
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrar.kt:72:            }
> customer-app\app\src\main\kotlin\com\homeservices\customer\domain\catalogue\CatalogueLocalizer.kt:16:        ): 
Category =
  customer-app\app\src\main\kotlin\com\homeservices\customer\domain\catalogue\CatalogueLocalizer.kt:17:            if 
(locale.startsWith("hi")) {
  customer-app\app\src\main\kotlin\com\homeservices\customer\domain\catalogue\CatalogueLocalizer.kt:18:                
val hindiName = HindiLocaleNames.categoryHindiNames[category.id]
  customer-app\app\src\main\kotlin\com\homeservices\customer\domain\catalogue\CatalogueLocalizer.kt:19:                
if (hindiName != null) category.copy(name = hindiName) else category
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:32:            
Breadcrumb().apply {
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:33:                
category = "security.nav"
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:34:                
message = "Rejected entityId with invalid format (SEC-04)"
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:35:                
level = SentryLevel.WARNING
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:36:            },
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:37:        )
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:38:        return 
null
> customer-app\app\src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:63:     
       message = "Use applyConsent(analyticsOptIn) which handles both init and runtime opt-out.",
  customer-app\app\src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:64:     
       replaceWith = ReplaceWith("applyConsent(analyticsOptIn)"),
  customer-app\app\src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:65:     
   )
  customer-app\app\src\main\kotlin\com\homeservices\customer\observability\analytics\PostHogAnalyticsFacade.kt:66:     
   public fun initIfConsented(analyticsOptIn: Boolean) {
> customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:46:            
msg.message?.let { text -> msg.message = redact(text) }
  customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:47:            
msg.formatted?.let { text -> msg.formatted = redact(text) }
  customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:48:        }
  customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:49:
> customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:57:            
crumb.message?.let { text -> crumb.message = redact(text) }
  customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:58:        }
  customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:59:
  customer-app\app\src\main\kotlin\com\homeservices\customer\observability\PiiRedactor.kt:60:        return event
> customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:72:                  
  level = SentryLevel.INFO
  customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:73:                }
  customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:74:        
Sentry.addBreadcrumb(crumb)
  customer-app\app\src\main\kotlin\com\homeservices\customer\observability\SentryContextBinder.kt:75:    }
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:101:                    message = 
stringResource(R.string.auth_checking_truecaller_body),
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:102:                )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:103:
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:104:            is 
AuthUiState.MethodSelection ->
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:114:                    message = 
stringResource(R.string.auth_signing_in_google_body),
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:115:                )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:116:
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:117:            is 
AuthUiState.EmailEntry ->
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:135:                    message = 
stringResource(R.string.auth_submitting_email_body, uiState.email),
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:136:                )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:137:
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:138:            is 
AuthUiState.EmailVerificationSent ->
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:164:                    message = 
stringResource(R.string.auth_sending_otp_body),
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:165:                )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:166:
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:167:            is 
AuthUiState.OtpVerifying ->
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:170:                    message = 
stringResource(R.string.auth_verifying_code_body),
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:171:                )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:172:
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthScreen.kt:173:            is 
AuthUiState.Error ->
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:76:                              
      message = "Sign-in failed. Please use OTP.",
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:77:                              
      retriesLeft = 0,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:78:                              
  )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:79:                        }
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:149:                        
message = "Enter your email and password.",
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:150:                        
retriesLeft = 0,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:151:                    )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:152:                return
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:181:                             
       message = "We still cannot confirm verification. Open the email, then try again.",
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:182:                             
   )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:183:                        
AuthResult.Cancelled ->
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:184:                            
_uiState.value = AuthUiState.EmailVerificationSent(email = email)
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:199:                            
message =
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:200:                             
   if (result.isSuccess) {
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:201:                             
       "Verification email sent again."
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:202:                             
   } else {
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:227:                             
       message = "Could not send password reset email.",
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:228:                             
       retriesLeft = 0,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:229:                             
   )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:230:                            }
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:245:                             
   message = "Enter a valid 10-digit mobile number.",
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:246:                             
   retriesLeft = 0,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:247:                            )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:248:                        
return
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:275:                             
           message = "Failed to send OTP. Check your number and connection.",
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:276:                             
           retriesLeft = MAX_OTP_RETRIES,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:277:                             
       )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:278:                            }
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:318:                            
message = "Google Sign-In is not available on this device. Use email or phone.",
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:319:                            
retriesLeft = 0,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:320:                        )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:321:                is 
AuthResult.Error -> _uiState.value = AuthUiState.Error(messageFor(result), retriesLeft = 0)
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:336:                             
   message = "Verification email sent.",
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:337:                            )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:338:                    }
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:339:                }
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:344:                            
message = "Verify your email before continuing.",
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:345:                        )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:346:                
AuthResult.Cancelled ->
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:347:                    
_uiState.value = AuthUiState.EmailEntry(mode = mode, prefillEmail = email)
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:377:                            
message = "Incorrect code",
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:378:                            
retriesLeft = maxOf(0, MAX_OTP_RETRIES - otpAttempts),
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:379:                        )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\auth\AuthViewModel.kt:380:                }
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:90:        locationMessage = 
locationCapturedMsg
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:91:        scope.launch {
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:92:            val 
resolvedAddress =
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:93:                
withContext(Dispatchers.IO) {
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:98:                
locationMessage = locationCapturedMsg
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:99:            } else {
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:100:                
locationMessage = locationCapturedManualMsg
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:101:            }
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:102:            isLocating = 
false
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:103:        }
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:114:                        
locationMessage = locationErrorMsg
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:115:                    },
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:116:                )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:117:            } else {
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:118:                
locationMessage = locationPermissionDeniedMsg
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:119:            }
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:120:        }
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:121:    val requestLocation = 
{
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:129:                    
locationMessage = locationErrorMsg
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:130:                },
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:131:            )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:132:        } else {
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:146:        locationMessage = 
locationMessage,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:147:        isLocating = 
isLocating,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:148:        
onAddressTextChanged = { addressText = it },
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:149:        
onUseCurrentLocation = requestLocation,
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:195:                
locationMessage = locationMessage,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:196:                
isLocating = isLocating,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:197:                
onAddressTextChanged = onAddressTextChanged,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:198:                
onUseCurrentLocation = onUseCurrentLocation,
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:276:            message = 
locationMessage,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:277:            isLocating = 
isLocating,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:278:            
onUseCurrentLocation = onUseCurrentLocation,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\AddressScreen.kt:279:        )
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\BookingSummaryScreen.kt:182:                is 
BookingUiState.Error -> BookingError(message = state.message)
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\BookingSummaryScreen.kt:183:                
else -> Unit
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\BookingSummaryScreen.kt:184:            }
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\BookingSummaryScreen.kt:185:        }
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\SlotPickerScreen.kt:136:                    is 
SlotPickerUiState.Error -> ErrorBlock(message = state.message, onRetry = onRetry)
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\SlotPickerScreen.kt:137:                    is 
SlotPickerUiState.Loaded -> LoadedBlock(state = state, onSlotSelect = onSlotSelect)
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\SlotPickerScreen.kt:138:                }
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\booking\SlotPickerScreen.kt:139:            }
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreen.kt:375:                  
                  category = cat,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreen.kt:376:                  
                  onClick = { onCategoryClick(cat.id) },
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreen.kt:377:                  
                  modifier = Modifier.weight(1f),
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreen.kt:378:                  
              )
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreen.kt:380:                  
              CategoryCard(category = cat, onClick = { onCategoryClick(cat.id) }, modifier = Modifier.weight(1f))
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreen.kt:381:                  
          }
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreen.kt:382:                  
      }
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreen.kt:383:                  
      if (row.size == 1) Spacer(Modifier.weight(1f))
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCard.kt:124:               
 category = category,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCard.kt:125:               
 onLoadFailed = { imageLoadFailed = true },
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCard.kt:126:            )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCard.kt:127:        } else 
{
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCard.kt:128:            
PhotoCardIconFallback(category = category, style = style)
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCard.kt:129:        }
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCard.kt:130:    }
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCard.kt:131:}
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\complaint\ComplaintListScreen.kt:99:                   
     message = (uiState as ComplaintListUiState.Error).message,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\complaint\ComplaintListScreen.kt:100:                  
      onRetry = viewModel::retry,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\complaint\ComplaintListScreen.kt:101:                  
  )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\complaint\ComplaintListScreen.kt:102:                }
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\complaint\ComplaintScreen.kt:96:            is 
ComplaintUiState.Error -> ErrorState(message = state.message, onRetry = onRetry)
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\complaint\ComplaintScreen.kt:97:            is 
ComplaintUiState.Idle ->
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\complaint\ComplaintScreen.kt:98:                
IdleState(
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\complaint\ComplaintScreen.kt:99:                    
state = state,
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\dataexport\DataExportScreen.kt:81:    val 
successMessage = stringResource(R.string.data_export_success_toast)
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\dataexport\DataExportScreen.kt:82:    val 
filenamePrefix = stringResource(R.string.data_export_filename_prefix)
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\dataexport\DataExportScreen.kt:83:
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\dataexport\DataExportScreen.kt:84:    // SAF launcher 
— opens only when state is Ready.
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\deleteaccount\DeleteAccountViewModel.kt:110:           
         Error(message = "Authentication context unavailable", previousState = current)
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\deleteaccount\DeleteAccountViewModel.kt:111:           
     return
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\deleteaccount\DeleteAccountViewModel.kt:112:           
 }
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\deleteaccount\DeleteAccountViewModel.kt:113:
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\deleteaccount\DeleteAccountViewModel.kt:143:           
                     message = err.message ?: "Unknown error",
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\deleteaccount\DeleteAccountViewModel.kt:144:           
                     previousState = current,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\deleteaccount\DeleteAccountViewModel.kt:145:           
                 )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\deleteaccount\DeleteAccountViewModel.kt:146:           
         }
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\deleteaccount\DeleteAccountViewModel.kt:160:           
                     message = err.message ?: "Unknown error",
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\deleteaccount\DeleteAccountViewModel.kt:161:           
                     previousState = current,
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\deleteaccount\DeleteAccountViewModel.kt:162:           
                 )
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\deleteaccount\DeleteAccountViewModel.kt:163:           
         }
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt:165:            
SosEvidenceUploadErrorSheet(message = sos.message, onDismiss = { sosViewModel.onDismissEvidenceResult() })
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt:166:        else -> Unit
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt:167:    }
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt:168:}
> customer-app\app\src\test\kotlin\com\homeservices\customer\domain\catalogue\CatalogueLocalizerTest.kt:12:    private 
val acCategory =
  customer-app\app\src\test\kotlin\com\homeservices\customer\domain\catalogue\CatalogueLocalizerTest.kt:13:        
Category(
  customer-app\app\src\test\kotlin\com\homeservices\customer\domain\catalogue\CatalogueLocalizerTest.kt:14:            
id = "ac-repair",
  customer-app\app\src\test\kotlin\com\homeservices\customer\domain\catalogue\CatalogueLocalizerTest.kt:15:            
name = "AC Repair",
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:84:                    
        message = "Incorrect code",
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:85:                    
        retriesLeft = 2,
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:86:                    
    ),
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:87:                    
onPhoneSubmitted = {},
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:103:                   
         message = "Incorrect code",
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:104:                   
         retriesLeft = 2,
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:105:                   
     ),
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:106:                   
 onPhoneSubmitted = {},
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:186:                   
         message = "Too many attempts. Try again later.",
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:187:                   
         retriesLeft = 0,
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:188:                   
     ),
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:189:                   
 onPhoneSubmitted = {},
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:205:                   
         message = "Incorrect code",
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:206:                   
         retriesLeft = 1,
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:207:                   
     ),
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt:208:                   
 onPhoneSubmitted = {},
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:443:                        
message = "Google Sign-In is not available on this device. Use email or phone.",
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:444:                        
retriesLeft = 0,
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:445:                    ),
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:446:                )
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:492:                        
message = "Verify your email before continuing.",
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:493:                    ),
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:494:                )
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:495:        }
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:510:                        
message = "Verification email sent.",
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:511:                    ),
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:512:                )
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:513:        }
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:555:                    
.isEqualTo(AuthUiState.Error(message = message, retriesLeft = 0))
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:556:            }
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:557:        }
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:558:
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:580:                        
message = "We still cannot confirm verification. Open the email, then try again.",
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:581:                    ),
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:582:                )
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:583:
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:604:                        
message = "Verification email sent again.",
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:605:                    ),
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:606:                )
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:607:
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:615:                        
message = "Could not resend the email. Try again in a moment.",
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:616:                    ),
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:617:                )
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:618:        }
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:684:                    
.isEqualTo(AuthUiState.Error(message = message, retriesLeft = 0))
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:685:            }
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:686:        }
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\auth\AuthViewModelTest.kt:687:}
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\AddressScreenPaparazziTest.kt:25:              
      locationMessage = "Location not set",
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\AddressScreenPaparazziTest.kt:26:              
      isLocating = false,
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\AddressScreenPaparazziTest.kt:27:              
      onAddressTextChanged = {},
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\AddressScreenPaparazziTest.kt:28:              
      onUseCurrentLocation = {},
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\AddressScreenPaparazziTest.kt:44:              
      locationMessage = "Location not set",
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\AddressScreenPaparazziTest.kt:45:              
      isLocating = false,
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\AddressScreenPaparazziTest.kt:46:              
      onAddressTextChanged = {},
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\AddressScreenPaparazziTest.kt:47:              
      onUseCurrentLocation = {},
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\SlotPickerScreenPaparazziTest.kt:148:          
          state = SlotPickerUiState.Error(message = "Network unreachable"),
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\SlotPickerScreenPaparazziTest.kt:149:          
          initialDate = today,
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\SlotPickerScreenPaparazziTest.kt:150:          
          onDateSelect = {},
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\SlotPickerScreenPaparazziTest.kt:151:          
          onSlotSelect = {},
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCardPaparazziTest.kt:36:   
                 category =
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCardPaparazziTest.kt:37:   
                     Category(
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCardPaparazziTest.kt:38:   
                         id = "ac-repair",
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCardPaparazziTest.kt:39:   
                         name = "AC Repair",
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCardPaparazziTest.kt:56:   
                 category =
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCardPaparazziTest.kt:57:   
                     Category(
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCardPaparazziTest.kt:58:   
                         id = "plumbing",
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\PhotoFirstCategoryCardPaparazziTest.kt:59:   
                         name = "Plumbing",
> customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\SosBottomSheetPaparazziTest.kt:33:            
SosEvidenceUploadErrorSheet(message = "upload_failed", onDismiss = {})
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\SosBottomSheetPaparazziTest.kt:34:        }
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\SosBottomSheetPaparazziTest.kt:35:    }
  customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\SosBottomSheetPaparazziTest.kt:36:}



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Force -Filter 'gradlew*'; Get-ChildItem -Force 'customer-app' -Filter 'gradlew*'; Get-Content -LiteralPath 'settings.gradle.kts' -ErrorAction SilentlyContinue; Get-Content -LiteralPath 'customer-app/settings.gradle.kts' -ErrorAction SilentlyContinue" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 657ms:


    Directory: C:\Alok\Business Projects\Urbanclap-sprint4\customer-app


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
-a----         5/22/2026   8:50 PM           8762 gradlew                                                              
-a----         5/22/2026   8:50 PM           2872 gradlew.bat                                                          
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



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/SessionPrefsMigrator.kt' | Select-Object -First 180" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 621ms:
package com.homeservices.customer.data.auth

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import java.security.KeyStore

/**
 * One-time migration helper that guards against a hypothetical legacy plaintext prefs file
 * at the `auth_session` filename.
 *
 * **Actual migration behavior (SEC-07):**
 * The _known_ prior state of this app used [androidx.security.crypto.MasterKeys]-backed
 * [androidx.security.crypto.EncryptedSharedPreferences] (key alias
 * `_androidx_security_master_key_`). That file cannot be decrypted here because:
 * - [MasterKeys] encrypted both the key _names_ and the values.
 * - Opening the file as plaintext via [android.content.Context.getSharedPreferences]
 *   returns ciphertext blobs under encrypted key names, not readable entries.
 * - The [androidx.security.crypto.MasterKey] key alias may be unavailable (key rotation,
 *   device restore, factory reset) so decryption is not attempted.
 *
 * Users whose legacy prefs were encrypted will silently re-login. This is the intended
 * fallback â€” the session TTL would have expired anyway on most devices.
 *
 * This migrator only provides value for a hypothetical plaintext legacy prefs file
 * (e.g. if a future rollback created one). It is a no-op for the encrypted case.
 *
 * The internal logic is split into [migrateIfNeededInternal] to support unit-testing without
 * Robolectric classloader constraints (see [SessionPrefsMigratorTest]).
 */
public object SessionPrefsMigrator {
    private const val TAG = "SessionPrefsMigrator"

    /** The legacy key alias created by [androidx.security.crypto.MasterKeys.getOrCreate]. */
    private const val LEGACY_KEY_ALIAS = "_androidx_security_master_key_"

    /** The legacy prefs file name (must match what [androidx.security.crypto.MasterKeys] used). */
    private const val LEGACY_PREFS_NAME = "auth_session"

    /**
     * Returns `true` when the legacy MasterKey alias is present in the Android KeyStore.
     */
    public fun isLegacyKeyPresent(): Boolean =
        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)
            keyStore.containsAlias(LEGACY_KEY_ALIAS)
        } catch (e: Exception) {
            Log.w(TAG, "KeyStore probe failed", e)
            false
        }

    /**
     * Runs the migration if needed. Call this once during [AuthModule.provideAuthPrefs],
     * before returning the new [SharedPreferences] instance.
     *
     * @param context Application context.
     * @param newPrefs The new (already-opened) [SharedPreferences] backed by
     *   [androidx.security.crypto.MasterKey.Builder].
     * @param newPrefsName The filename for [newPrefs] (used for logging only).
     */
    public fun migrateIfNeeded(
        context: Context,
        newPrefs: SharedPreferences,
        newPrefsName: String,
    ) {
        migrateIfNeededInternal(
            context = context,
            newPrefs = newPrefs,
            newPrefsName = newPrefsName,
            legacyKeyPresent = isLegacyKeyPresent(),
        )
    }

    /**
     * Internal migration logic â€” accepts [legacyKeyPresent] as a parameter so unit tests
     * can drive both paths without needing to mock the KeyStore or the outer object.
     *
     * Visible for testing only; do not call from production code directly.
     */
    internal fun migrateIfNeededInternal(
        context: Context,
        newPrefs: SharedPreferences,
        newPrefsName: String,
        legacyKeyPresent: Boolean,
    ) {
        if (newPrefsName == LEGACY_PREFS_NAME) {
            Log.d(TAG, "Active prefs already use $LEGACY_PREFS_NAME - skipping migration")
            return
        }

        if (!legacyKeyPresent) {
            Log.d(TAG, "No legacy key found - skipping migration for $newPrefsName")
            return
        }

        // Opening as plaintext. If the legacy file was written by EncryptedSharedPreferences,
        // legacyPrefs.all returns encrypted key names as strings â€” migration "copies" them but
        // produces useless entries; the session will be empty and the user must re-login.
        Log.i(TAG, "Legacy MasterKey alias found â€” migrating $newPrefsName")
        try {
            val legacyPrefs =
                context.getSharedPreferences(LEGACY_PREFS_NAME, Context.MODE_PRIVATE)
            val allEntries = legacyPrefs.all

            if (allEntries.isNotEmpty()) {
                val editor = newPrefs.edit()
                for ((key, value) in allEntries) {
                    when (value) {
                        is String -> editor.putString(key, value)
                        is Long -> editor.putLong(key, value)
                        is Int -> editor.putInt(key, value)
                        is Boolean -> editor.putBoolean(key, value)
                        is Float -> editor.putFloat(key, value)
                        else -> Log.w(TAG, "Skipping unsupported pref type for key=$key")
                    }
                }
                editor.apply()
                Log.i(TAG, "Migrated ${allEntries.size} entries to $newPrefsName")

                // Clear legacy prefs so they're not read again
                legacyPrefs.edit().clear().apply()
                Log.i(TAG, "Cleared legacy prefs $LEGACY_PREFS_NAME")
            } else {
                Log.d(TAG, "Legacy prefs empty â€” nothing to migrate")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Migration failed â€” clearing new prefs to force re-login", e)
            newPrefs.edit().clear().apply()
        }
    }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command ".\\gradlew.bat :app:compileDebugUnitTestKotlin --offline --no-daemon" in C:\Alok\Business Projects\Urbanclap-sprint4\customer-app
2026-05-23T02:00:47.282998Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 6.4 seconds
Output:
Exception in thread "main" java.lang.RuntimeException: Could not create parent directory for lock file C:\Users\CodexSandboxOffline\.gradle\wrapper\dists\gradle-8.11-bin\c4te04g51qsyw1bxcb929u7br\gradle-8.11-bin.zip.lck
	at org.gradle.wrapper.GradleWrapperMain.main(SourceFile:65)

 exited 1 in 6439ms:
Exception in thread "main" java.lang.RuntimeException: Could not create parent directory for lock file C:\Users\CodexSandboxOffline\.gradle\wrapper\dists\gradle-8.11-bin\c4te04g51qsyw1bxcb929u7br\gradle-8.11-bin.zip.lck
	at org.gradle.wrapper.GradleWrapperMain.main(SourceFile:65)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'api/src/cosmos/booking-repository.ts' | Select-Object -First 80; Get-ChildItem -Recurse -Path 'api/src' -Include '*.ts' | Select-String -Pattern 'createBooking\\(|bookingId\\?:|bookingId:' -Context 1,2 | Select-Object -First 80" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 740ms:
import { randomUUID } from 'node:crypto';
import { getBookingsContainer } from './client.js';
import type { BookingDoc, CreateBookingRequest } from '../schemas/booking.js';
import type { PendingAddOn, AddOnDecision } from '../schemas/addon-approval.js';
import { normalizeAddressText } from '../shared/address-text.js';

function now() { return new Date().toISOString(); }

export interface BookingCreateMetadata {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceName?: string;
}

export interface BookingCreateCreditOptions {
  /**
   * E13-S01 (P1-6): When set, the wallet credit debit is DEFERRED to the Razorpay webhook.
   * Stored on the booking doc so the webhook can apply the credit after payment.captured.
   * Not applicable to CASH_ON_SERVICE bookings (those apply credit synchronously).
   */
  pendingCreditAmountInPaise?: number;
  /** Idempotency key for the deferred credit debit (required when pendingCreditAmountInPaise > 0). */
  pendingCreditIdempotencyKey?: string;
}

export const bookingRepo = {
  async createPending(
    req: CreateBookingRequest,
    customerId: string,
    paymentOrderId: string,
    amount: number,
    metadata: BookingCreateMetadata = {},
    bookingId?: string,
    creditOptions?: BookingCreateCreditOptions,
  ): Promise<BookingDoc> {
    const paymentMethod = req.paymentMethod ?? 'RAZORPAY';
    const doc: BookingDoc = {
      id: bookingId ?? randomUUID(), customerId, ...req,
      addressText: normalizeAddressText(req.addressText),
      ...(metadata.customerName ? { customerName: metadata.customerName } : {}),
      ...(metadata.customerPhone ? { customerPhone: metadata.customerPhone } : {}),
      ...(metadata.customerEmail ? { customerEmail: metadata.customerEmail } : {}),
      ...(metadata.serviceName ? { serviceName: metadata.serviceName } : {}),
      status: 'PENDING_PAYMENT', paymentOrderId,
      paymentMethod,
      ...(paymentMethod === 'CASH_ON_SERVICE' ? { cashCollectionStatus: 'PENDING' as const } : {}),
      paymentId: null, paymentSignature: null,
      amount, createdAt: now(),
      // E13-S01 (P1-6): Store pending credit info for deferred debit in webhook
      ...(creditOptions?.pendingCreditAmountInPaise && creditOptions.pendingCreditAmountInPaise > 0
        ? {
            pendingCreditAmountInPaise: creditOptions.pendingCreditAmountInPaise,
            pendingCreditIdempotencyKey: creditOptions.pendingCreditIdempotencyKey,
          }
        : {}),
    };
    const { resource } = await getBookingsContainer().items.create<BookingDoc>(doc);
    return resource!;
  },

  async getById(id: string): Promise<BookingDoc | null> {
    const { resource } = await getBookingsContainer().item(id, id).read<BookingDoc>();
    return resource ?? null;
  },

  async confirmPayment(
    id: string,
    paymentId: string,
    paymentSignature: string,
  ): Promise<BookingDoc | null> {
    const { resource: existing, etag } = await getBookingsContainer().item(id, id).read<BookingDoc>();
    if (!existing) return null;
    if (existing.status === 'PAID') return existing; // webhook already processed â€” idempotent success
    if (existing.status !== 'PENDING_PAYMENT') return null;
    const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, paymentSignature };
    const useEtag = process.env.BOOKINGS_ETAG_GUARDS === 'on';
    if (useEtag) {
      try {
        const { resource } = await getBookingsContainer()

  api\src\cosmos\booking-repository.ts:33:    metadata: BookingCreateMetadata = {},
> api\src\cosmos\booking-repository.ts:34:    bookingId?: string,
  api\src\cosmos\booking-repository.ts:35:    creditOptions?: BookingCreateCreditOptions,
  api\src\cosmos\booking-repository.ts:36:  ): Promise<BookingDoc> {
  api\src\cosmos\booking-repository.ts:226:  async addPhoto(
> api\src\cosmos\booking-repository.ts:227:    bookingId: string,
  api\src\cosmos\booking-repository.ts:228:    stage: string,
  api\src\cosmos\booking-repository.ts:229:    photoUrl: string,
  api\src\cosmos\complaints-repository.ts:174:  technicianId: string,
> api\src\cosmos\complaints-repository.ts:175:  bookingId: string,
  api\src\cosmos\complaints-repository.ts:176:): Promise<ComplaintDoc | null> {
  api\src\cosmos\complaints-repository.ts:177:  const { resources } = await getCosmosClient()
  api\src\cosmos\complaints-repository.ts:217:export async function findRatingShieldEscalation(
> api\src\cosmos\complaints-repository.ts:218:  bookingId: string,
  api\src\cosmos\complaints-repository.ts:219:  customerId: string,
  api\src\cosmos\complaints-repository.ts:220:): Promise<ComplaintDoc | null> {
  api\src\cosmos\complaints-repository.ts:241:export async function findComplaintByBookingAndParty(
> api\src\cosmos\complaints-repository.ts:242:  bookingId: string,
  api\src\cosmos\complaints-repository.ts:243:  uid: string,
  api\src\cosmos\complaints-repository.ts:244:  filedBy: 'CUSTOMER' | 'TECHNICIAN',
  api\src\cosmos\complaints-repository.ts:267:export async function queryComplaintsByBookingAndParty(
> api\src\cosmos\complaints-repository.ts:268:  bookingId: string,
  api\src\cosmos\complaints-repository.ts:269:  uid: string,
  api\src\cosmos\complaints-repository.ts:270:  filedBy: 'CUSTOMER' | 'TECHNICIAN',
  api\src\cosmos\customer-credit-ledger-repository.ts:80:  createdAt?: string;
> api\src\cosmos\customer-credit-ledger-repository.ts:81:  bookingId?: string;
  api\src\cosmos\customer-credit-ledger-repository.ts:82:}
  api\src\cosmos\customer-credit-ledger-repository.ts:83:
  api\src\cosmos\customer-credit-ledger-repository.ts:119:    amountInPaise,
> api\src\cosmos\customer-credit-ledger-repository.ts:120:    bookingId: raw.bookingId,
  api\src\cosmos\customer-credit-ledger-repository.ts:121:    reason: raw.reason ?? '',
  api\src\cosmos\customer-credit-ledger-repository.ts:122:    createdAt: raw.createdAt ?? new Date().toISOString(),
  api\src\cosmos\customer-credit-ledger-repository.ts:308:    customerId: string,
> api\src\cosmos\customer-credit-ledger-repository.ts:309:    bookingId: string,
  api\src\cosmos\customer-credit-ledger-repository.ts:310:    reservedAmountInPaise: number,
  api\src\cosmos\customer-credit-ledger-repository.ts:311:    idempotencyKey: string,
  api\src\cosmos\customer-credit-ledger-repository.ts:384:    customerId: string,
> api\src\cosmos\customer-credit-ledger-repository.ts:385:    bookingId: string,
  api\src\cosmos\customer-credit-ledger-repository.ts:386:    amountInPaise: number,
  api\src\cosmos\customer-credit-ledger-repository.ts:387:    idempotencyKey: string,
  api\src\cosmos\dispatch-attempt-repository.ts:5:export const dispatchAttemptRepo = {
> api\src\cosmos\dispatch-attempt-repository.ts:6:  async getByBookingId(bookingId: string): 
Promise<DispatchAttemptDoc | null> {
  api\src\cosmos\dispatch-attempt-repository.ts:7:    const { resources } = await getDispatchAttemptsContainer()
  api\src\cosmos\dispatch-attempt-repository.ts:8:      .items
  api\src\cosmos\dispatch-attempt-repository.ts:16:
> api\src\cosmos\dispatch-attempt-repository.ts:17:  async getAttemptedTechnicianIds(bookingId: string): 
Promise<string[]> {
  api\src\cosmos\dispatch-attempt-repository.ts:18:    const { resources } = await getDispatchAttemptsContainer()
  api\src\cosmos\dispatch-attempt-repository.ts:19:      .items
  api\src\cosmos\dispatch-attempt-repository.ts:27:
> api\src\cosmos\dispatch-attempt-repository.ts:28:  async acceptAttempt(id: string, bookingId: string): 
Promise<DispatchAttemptDoc | null> {
  api\src\cosmos\dispatch-attempt-repository.ts:29:    const container = getDispatchAttemptsContainer();
  api\src\cosmos\dispatch-attempt-repository.ts:30:    const { resource } = await container.item(id, 
id).read<DispatchAttemptDoc & Resource>();
  api\src\cosmos\dispatch-attempt-repository.ts:36:      id: resource.id,
> api\src\cosmos\dispatch-attempt-repository.ts:37:      bookingId: resource.bookingId,
  api\src\cosmos\dispatch-attempt-repository.ts:38:      technicianIds: resource.technicianIds,
  api\src\cosmos\dispatch-attempt-repository.ts:39:      sentAt: resource.sentAt,
  api\src\cosmos\dispatch-attempt-repository.ts:55:
> api\src\cosmos\dispatch-attempt-repository.ts:56:  async declineAttempt(id: string, bookingId: string): 
Promise<DispatchAttemptDoc | null> {
  api\src\cosmos\dispatch-attempt-repository.ts:57:    const container = getDispatchAttemptsContainer();
  api\src\cosmos\dispatch-attempt-repository.ts:58:    const { resource } = await container.item(id, 
id).read<DispatchAttemptDoc & Resource>();
  api\src\cosmos\dispatch-attempt-repository.ts:65:      id: resource.id,
> api\src\cosmos\dispatch-attempt-repository.ts:66:      bookingId: resource.bookingId,
  api\src\cosmos\dispatch-attempt-repository.ts:67:      technicianIds: resource.technicianIds,
  api\src\cosmos\dispatch-attempt-repository.ts:68:      sentAt: resource.sentAt,
  api\src\cosmos\finance-repository.ts:31:  razorpayTransferId?: string;
> api\src\cosmos\finance-repository.ts:32:  bookingId?: string;
  api\src\cosmos\finance-repository.ts:33:}
  api\src\cosmos\finance-repository.ts:34:
  api\src\cosmos\live-location-repository.ts:20:   */
> api\src\cosmos\live-location-repository.ts:21:  async getLatest(bookingId: string): Promise<LiveLocationDoc | null> {
  api\src\cosmos\live-location-repository.ts:22:    const { resource } = await getContainer()
  api\src\cosmos\live-location-repository.ts:23:      .item(bookingId, bookingId)
  api\src\cosmos\rating-repository.ts:4:interface SubmitInput {
> api\src\cosmos\rating-repository.ts:5:  bookingId: string;
  api\src\cosmos\rating-repository.ts:6:  customerId: string;
  api\src\cosmos\rating-repository.ts:7:  technicianId: string;
  api\src\cosmos\rating-repository.ts:16:export const ratingRepo = {
> api\src\cosmos\rating-repository.ts:17:  async getByBookingId(bookingId: string): Promise<RatingDoc | null> {
  api\src\cosmos\rating-repository.ts:18:    const { resource } = await getRatingsContainer()
  api\src\cosmos\rating-repository.ts:19:      .item(bookingId, bookingId)
  api\src\cosmos\rating-repository.ts:30:        id: input.bookingId,
> api\src\cosmos\rating-repository.ts:31:        bookingId: input.bookingId,
  api\src\cosmos\rating-repository.ts:32:        customerId: input.customerId,
  api\src\cosmos\rating-repository.ts:33:        technicianId: input.technicianId,
  api\src\cosmos\rating-repository.ts:83:  async patchRatingForAppeal(
> api\src\cosmos\rating-repository.ts:84:    bookingId: string,
  api\src\cosmos\rating-repository.ts:85:    patch: { customerAppealRemoved?: boolean; customerAppealDisputed?: 
boolean },
  api\src\cosmos\rating-repository.ts:86:  ): Promise<void> {
  api\src\cosmos\slot-holds-repository.ts:49:   */
> api\src\cosmos\slot-holds-repository.ts:50:  async commitHold(holdId: string, servicePartitionKey: string, 
bookingId: string): Promise<void> {
  api\src\cosmos\slot-holds-repository.ts:51:    try {
  api\src\cosmos\slot-holds-repository.ts:52:      await this.container.item(holdId, servicePartitionKey).patch([
  api\src\cosmos\wallet-ledger-repository.ts:4:export const walletLedgerRepo = {
> api\src\cosmos\wallet-ledger-repository.ts:5:  async getByBookingId(bookingId: string, technicianId: string): 
Promise<WalletLedgerEntry | null> {
  api\src\cosmos\wallet-ledger-repository.ts:6:    const { resource } = await getWalletLedgerContainer()
  api\src\cosmos\wallet-ledger-repository.ts:7:      .item(bookingId, technicianId)
  api\src\cosmos\wallet-ledger-repository.ts:15:        id: input.bookingId,
> api\src\cosmos\wallet-ledger-repository.ts:16:        bookingId: input.bookingId,
  api\src\cosmos\wallet-ledger-repository.ts:17:        technicianId: input.technicianId,
  api\src\cosmos\wallet-ledger-repository.ts:18:        partitionKey: input.technicianId,
  api\src\cosmos\wallet-ledger-repository.ts:37:
> api\src\cosmos\wallet-ledger-repository.ts:38:  async markPaid(bookingId: string, technicianId: string, 
razorpayTransferId: string): Promise<void> {
  api\src\cosmos\wallet-ledger-repository.ts:39:    const { resource } = await getWalletLedgerContainer()
  api\src\cosmos\wallet-ledger-repository.ts:40:      .item(bookingId, technicianId)
  api\src\cosmos\wallet-ledger-repository.ts:53:
> api\src\cosmos\wallet-ledger-repository.ts:54:  async markFailed(bookingId: string, technicianId: string, 
failureReason: string): Promise<void> {
  api\src\cosmos\wallet-ledger-repository.ts:55:    const { resource } = await getWalletLedgerContainer()
  api\src\cosmos\wallet-ledger-repository.ts:56:      .item(bookingId, technicianId)
  api\src\functions\admin\complaints\patch.ts:142:      resourceId: existing.id,
> api\src\functions\admin\complaints\patch.ts:143:      payload: { decision, technicianId: existing.technicianId, 
bookingId: existing.orderId },
  api\src\functions\admin\complaints\patch.ts:144:      timestamp: now,
  api\src\functions\admin\complaints\patch.ts:145:      partitionKey: now.slice(0, 7),
  api\src\functions\admin\complaints\sla-timer.ts:60:        complaintId: complaint.id,
> api\src\functions\admin\complaints\sla-timer.ts:61:        bookingId: complaint.orderId,
  api\src\functions\admin\complaints\sla-timer.ts:62:        breachType: auditAction,
  api\src\functions\admin\complaints\sla-timer.ts:63:      }).catch((err: unknown) =>
  api\src\functions\admin\dashboard\feed.ts:50:    id: `booking:${id}`,
> api\src\functions\admin\dashboard\feed.ts:51:    bookingId: id,
  api\src\functions\admin\dashboard\feed.ts:52:    status,
  api\src\functions\admin\dashboard\feed.ts:53:    customerId: asString(raw['customerId']) ?? 'unknown-customer',
  api\src\functions\admin\sos\get-incident.ts:18:      incidentId,
> api\src\functions\admin\sos\get-incident.ts:19:      bookingId: booking.id,
  api\src\functions\admin\sos\get-incident.ts:20:      customerId: booking.customerId,
  api\src\functions\admin\sos\get-incident.ts:21:      technicianId: booking.technicianId,
  api\src\functions\complaints\partner-create.ts:103:
> api\src\functions\complaints\partner-create.ts:104:  sendOwnerComplaintFiled({ bookingId: data.bookingId, filedBy, 
reasonCode: data.reasonCode })
  api\src\functions\complaints\partner-create.ts:105:    .catch((err: unknown) => ctx.error('sendOwnerComplaintFiled 
failed', err));
  api\src\functions\complaints\partner-create.ts:106:
  api\src\functions\active-job-location.ts:21:
> api\src\functions\active-job-location.ts:22:  const bookingId = (req as unknown as { params: { bookingId: string } 
}).params.bookingId;
  api\src\functions\active-job-location.ts:23:  const booking = await bookingRepo.getById(bookingId);
  api\src\functions\active-job-location.ts:24:  if (!booking) return { status: 404, jsonBody: { code: 
'BOOKING_NOT_FOUND' } };
  api\src\functions\active-job-location.ts:83:  keyExtractor: (req) => {
> api\src\functions\active-job-location.ts:84:    const bookingId = (req as unknown as { params: { bookingId: string } 
}).params.bookingId ?? 'unknown';
  api\src\functions\active-job-location.ts:85:    return `rl:loc:${bookingId}`;
  api\src\functions\active-job-location.ts:86:  },
  api\src\functions\active-job.ts:43:
> api\src\functions\active-job.ts:44:  const bookingId = (req as unknown as { params: { bookingId: string } 
}).params.bookingId;
  api\src\functions\active-job.ts:45:  const booking = await bookingRepo.getById(bookingId);
  api\src\functions\active-job.ts:46:  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  api\src\functions\active-job.ts:53:    jsonBody: {
> api\src\functions\active-job.ts:54:      bookingId: booking.id,
  api\src\functions\active-job.ts:55:      customerId: booking.customerId,
  api\src\functions\active-job.ts:56:      serviceId: booking.serviceId,
  api\src\functions\active-job.ts:74:
> api\src\functions\active-job.ts:75:  const bookingId = (req as unknown as { params: { bookingId: string } 
}).params.bookingId;
  api\src\functions\active-job.ts:76:  const booking = await bookingRepo.getById(bookingId);
  api\src\functions\active-job.ts:77:  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  api\src\functions\active-job.ts:152:    jsonBody: {
> api\src\functions\active-job.ts:153:      bookingId: updated.id,
  api\src\functions\active-job.ts:154:      customerId: updated.customerId,
  api\src\functions\active-job.ts:155:      serviceId: updated.serviceId,
  api\src\functions\bookings.ts:72:async function projectReportSignedUrl(
> api\src\functions\bookings.ts:73:  bookingId: string,
  api\src\functions\bookings.ts:74:  status: string,
  api\src\functions\bookings.ts:75:): Promise<string | null> {
  api\src\functions\bookings.ts:132:  customerId: string,
> api\src\functions\bookings.ts:133:  bookingId: string,
  api\src\functions\bookings.ts:134:  bookingAmount: number,
  api\src\functions\bookings.ts:135:  idempotencyKey: string,
  api\src\functions\bookings.ts:275:      Sentry.captureException(err);
> api\src\functions\bookings.ts:276:      console.warn('[createBooking] commitHold failed (non-fatal)', { holdId, 
bookingId: booking.id, err });
  api\src\functions\bookings.ts:277:    });
  api\src\functions\bookings.ts:278:
  api\src\functions\bookings.ts:297:        properties: {
> api\src\functions\bookings.ts:298:          bookingId: booking.id,
  api\src\functions\bookings.ts:299:          serviceId: parsed.data.serviceId,
  api\src\functions\bookings.ts:300:          paymentMethod: 'CASH_ON_SERVICE',
  api\src\functions\bookings.ts:306:      Sentry.captureException(err);
> api\src\functions\bookings.ts:307:      console.error('[createBooking] cash-on-service dispatch failed', { 
bookingId: booking.id, err });
  api\src\functions\bookings.ts:308:    });
  api\src\functions\bookings.ts:309:    return {
  api\src\functions\bookings.ts:311:      jsonBody: {
> api\src\functions\bookings.ts:312:        bookingId: booking.id,
  api\src\functions\bookings.ts:313:        razorpayOrderId: cashOrderId,
  api\src\functions\bookings.ts:314:        amount: service.basePrice,
  api\src\functions\bookings.ts:337:      Sentry.captureException(err);
> api\src\functions\bookings.ts:338:      console.warn('[createBooking] commitHold failed (non-fatal)', { holdId, 
bookingId: booking.id, err });
  api\src\functions\bookings.ts:339:    });
  api\src\functions\bookings.ts:340:
  api\src\functions\bookings.ts:342:      Sentry.captureException(err);
> api\src\functions\bookings.ts:343:      console.error('[createBooking] manual-payment dispatch failed', { bookingId: 
booking.id, err });
  api\src\functions\bookings.ts:344:    });
  api\src\functions\bookings.ts:345:    return {
  api\src\functions\bookings.ts:347:      jsonBody: {
> api\src\functions\bookings.ts:348:        bookingId: booking.id,
  api\src\functions\bookings.ts:349:        razorpayOrderId: manualOrderId,
  api\src\functions\bookings.ts:350:        amount: service.basePrice,
  api\src\functions\bookings.ts:422:        customerId: customer.customerId,
> api\src\functions\bookings.ts:423:        bookingId: booking.id,
  api\src\functions\bookings.ts:424:        expected: pendingCreditAmount,
  api\src\functions\bookings.ts:425:        applied: appliedCreditAmount,
  api\src\functions\bookings.ts:447:      Sentry.captureException(err);
> api\src\functions\bookings.ts:448:      console.warn('[createBooking] commitHold failed (non-fatal)', { holdId, 
bookingId: booking.id, err });
  api\src\functions\bookings.ts:449:    });
  api\src\functions\bookings.ts:450:
  api\src\functions\bookings.ts:455:        properties: {
> api\src\functions\bookings.ts:456:          bookingId: booking.id,
  api\src\functions\bookings.ts:457:          serviceId: parsed.data.serviceId,
  api\src\functions\bookings.ts:458:          paymentMethod: 'CREDIT_FULL',
  api\src\functions\bookings.ts:465:      Sentry.captureException(err);
> api\src\functions\bookings.ts:466:      console.error('[createBooking] credit-full dispatch failed', { bookingId: 
booking.id, err });
  api\src\functions\bookings.ts:467:    });
  api\src\functions\bookings.ts:468:
  api\src\functions\bookings.ts:471:      jsonBody: {
> api\src\functions\bookings.ts:472:        bookingId: booking.id,
  api\src\functions\bookings.ts:473:        razorpayOrderId: fullCreditOrderId,
  api\src\functions\bookings.ts:474:        amount: service.basePrice,
  api\src\functions\bookings.ts:514:          customerId: customer.customerId,
> api\src\functions\bookings.ts:515:          bookingId: preGeneratedBookingId,
  api\src\functions\bookings.ts:516:        });
  api\src\functions\bookings.ts:517:        // Fall through to create the Razorpay order (or it may already exist; 
Razorpay is
  api\src\functions\bookings.ts:542:      receipt: makeRazorpayReceipt(customer.customerId),
> api\src\functions\bookings.ts:543:      notes: { bookingId: preGeneratedBookingId },
  api\src\functions\bookings.ts:544:    });
  api\src\functions\bookings.ts:545:  } catch (err) {
  api\src\functions\bookings.ts:580:    Sentry.captureException(err);
> api\src\functions\bookings.ts:581:    console.warn('[createBooking] commitHold failed (non-fatal)', { holdId, 
bookingId: booking.id, err });
  api\src\functions\bookings.ts:582:  });
  api\src\functions\bookings.ts:583:
  api\src\functions\bookings.ts:588:      properties: {
> api\src\functions\bookings.ts:589:        bookingId: booking.id,
  api\src\functions\bookings.ts:590:        serviceId: parsed.data.serviceId,
  api\src\functions\bookings.ts:591:        paymentMethod: 'RAZORPAY',
  api\src\functions\bookings.ts:600:    jsonBody: {
> api\src\functions\bookings.ts:601:      bookingId: booking.id,
  api\src\functions\bookings.ts:602:      razorpayOrderId: order.id,
  api\src\functions\bookings.ts:603:      amount: order.amount,
  api\src\functions\bookings.ts:635:    const _ts = new Date().toISOString();
> api\src\functions\bookings.ts:636:    void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', 
action: 'CUSTOMER_CONFIRMED_PAYMENT', resourceType: 'booking', resourceId: confirmed.id, payload: { bookingId: 
confirmed.id, paymentId: parsed.data.razorpayPaymentId }, timestamp: _ts, partitionKey: _ts.slice(0, 7) 
}).catch(Sentry.captureException);
  api\src\functions\bookings.ts:637:  }
  api\src\functions\bookings.ts:638:
> api\src\functions\bookings.ts:639:  return { status: 200, jsonBody: { bookingId: confirmed.id, status: 
confirmed.status } };
  api\src\functions\bookings.ts:640:};
  api\src\functions\bookings.ts:641:
  api\src\functions\bookings.ts:658:    jsonBody: {
> api\src\functions\bookings.ts:659:      bookingId: booking.id,
  api\src\functions\bookings.ts:660:      status: booking.status,
  api\src\functions\bookings.ts:661:      amount: booking.amount,
  api\src\functions\bookings.ts:687:        bookings: bookings.map((booking) => ({
> api\src\functions\bookings.ts:688:          bookingId: booking.id,
  api\src\functions\bookings.ts:689:          serviceId: booking.serviceId,
  api\src\functions\bookings.ts:690:          serviceName: serviceNames.get(booking.serviceId) ?? booking.serviceId,
  api\src\functions\bookings.ts:726:  } catch (err) {
> api\src\functions\bookings.ts:727:    console.error('[requestAddon] FCM push failed — booking is 
AWAITING_PRICE_APPROVAL but customer was not notified', { bookingId: id, err });
  api\src\functions\bookings.ts:728:  }
  api\src\functions\bookings.ts:729:
> api\src\functions\bookings.ts:730:  return { status: 200, jsonBody: { bookingId: updated.id, status: updated.status 
} };
  api\src\functions\bookings.ts:731:};
  api\src\functions\bookings.ts:732:
  api\src\functions\bookings.ts:745:        technicianId: updated.technicianId,
> api\src\functions\bookings.ts:746:        bookingId: id,
  api\src\functions\bookings.ts:747:        status: anyApproved ? 'PRICE_APPROVED' : 'PRICE_DECLINED',
  api\src\functions\bookings.ts:748:        ...(anyApproved && updated.finalAmount !== undefined
  api\src\functions\bookings.ts:752:    } catch (err) {
> api\src\functions\bookings.ts:753:      console.error('[approveFinalPrice] FCM technician push failed', { bookingId: 
id, err });
  api\src\functions\bookings.ts:754:    }
  api\src\functions\bookings.ts:755:  }
  api\src\functions\bookings.ts:756:
> api\src\functions\bookings.ts:757:  return { status: 200, jsonBody: { bookingId: updated.id, status: updated.status, 
finalAmount: updated.finalAmount } };
  api\src\functions\bookings.ts:758:};
  api\src\functions\bookings.ts:759:export const approveFinalPriceHandler: HttpHandler = 
requireCustomer(approveFinalPriceInner);
  api\src\functions\job-offers.ts:24:
> api\src\functions\job-offers.ts:25:  const bookingId = (req as unknown as { params: { bookingId: string } 
}).params.bookingId;
  api\src\functions\job-offers.ts:26:
  api\src\functions\job-offers.ts:27:  const attempt = await dispatchAttemptRepo.getByBookingId(bookingId);
  api\src\functions\job-offers.ts:70:
> api\src\functions\job-offers.ts:71:  const bookingId = (req as unknown as { params: { bookingId: string } 
}).params.bookingId;
  api\src\functions\job-offers.ts:72:
  api\src\functions\job-offers.ts:73:  const attempt = await dispatchAttemptRepo.getByBookingId(bookingId);
  api\src\functions\job-offers.ts:87:
> api\src\functions\job-offers.ts:88:async function notifyLosingTechs(techIds: string[], bookingId: string): 
Promise<void> {
  api\src\functions\job-offers.ts:89:  const messaging = getMessaging();
  api\src\functions\job-offers.ts:90:  await Promise.allSettled(
  api\src\functions\job-offers.ts:115:        );
> api\src\functions\job-offers.ts:116:        await bookingEventRepo.append({ event: 'OFFER_EXPIRED', bookingId: 
attempt.bookingId });
  api\src\functions\job-offers.ts:117:        await 
dispatcherService.continueDispatchAfterOfferOutcome(attempt.bookingId, attempt.technicianIds);
  api\src\functions\job-offers.ts:118:      } catch {
  api\src\functions\rating-appeal.ts:93:
> api\src\functions\rating-appeal.ts:94:  sendAppealFiledAlert({ appealId, technicianId: uid, bookingId: 
parsed.data.bookingId })
  api\src\functions\rating-appeal.ts:95:    .catch((e) => Sentry.captureException(e));
  api\src\functions\rating-appeal.ts:96:
  api\src\functions\rating-escalate.ts:19:): Promise<HttpResponseInit> {
> api\src\functions\rating-escalate.ts:20:  const bookingId = (req as unknown as { params: { bookingId: string } 
}).params.bookingId;
  api\src\functions\rating-escalate.ts:21:
  api\src\functions\rating-escalate.ts:22:  let body: unknown;
  api\src\functions\ratings.ts:49:  const result = await ratingRepo.submitSide({
> api\src\functions\ratings.ts:50:    bookingId: data.bookingId,
  api\src\functions\ratings.ts:51:    customerId: booking.customerId,
  api\src\functions\ratings.ts:52:    technicianId: booking.technicianId,
  api\src\functions\ratings.ts:67:      await sendRatingReceivedPush(booking.technicianId, {
> api\src\functions\ratings.ts:68:        bookingId: data.bookingId,
  api\src\functions\ratings.ts:69:        overall: data.overall,
  api\src\functions\ratings.ts:70:        comment: data.comment,
  api\src\functions\ratings.ts:75:  }
> api\src\functions\ratings.ts:76:  return { status: 201, jsonBody: { bookingId: result.bookingId } };
  api\src\functions\ratings.ts:77:};
  api\src\functions\ratings.ts:78:
  api\src\functions\ratings.ts:104:
> api\src\functions\ratings.ts:105:  const bookingId = (req as unknown as { params: { bookingId: string } 
}).params.bookingId;
  api\src\functions\ratings.ts:106:  const booking = await bookingRepo.getById(bookingId);
  api\src\functions\ratings.ts:107:  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  api\src\functions\shield-report.ts:92:  addBlockedCustomer(uid, booking.customerId).catch((e) => 
Sentry.captureException(e));
> api\src\functions\shield-report.ts:93:  sendAbusiveShieldAlert({ bookingId: parsed.data.bookingId, technicianId: 
uid, customerId: booking.customerId })
  api\src\functions\shield-report.ts:94:    .catch((e) => Sentry.captureException(e));
  api\src\functions\shield-report.ts:95:
  api\src\functions\sos.ts:12:const sosInner: CustomerHttpHandler = async (req, ctx, customer) => {
> api\src\functions\sos.ts:13:  const bookingId = (req as unknown as { params: { bookingId: string } 
}).params.bookingId;
  api\src\functions\sos.ts:14:
  api\src\functions\sos.ts:15:  const booking = await bookingRepo.getById(bookingId);
  api\src\functions\tech-ratings.ts:64:  const items = sorted.map(d => ({
> api\src\functions\tech-ratings.ts:65:    bookingId: d.bookingId,
  api\src\functions\tech-ratings.ts:66:    overall: d.customerOverall ?? 0,
  api\src\functions\tech-ratings.ts:67:    subScores: {
  api\src\functions\technician-dashboard.ts:23:  activeJob: z.object({
> api\src\functions\technician-dashboard.ts:24:    bookingId: z.string(),
  api\src\functions\technician-dashboard.ts:25:    status: z.string(),
  api\src\functions\technician-dashboard.ts:26:    serviceId: z.string().optional(),



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'customer-app/app/src/main/kotlin/com/homeservices/customer/navigation','customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating' -Include '*.kt' | Select-String -Pattern 'priceApprovalRoute|object BookingRoutes|route\\(' -Context 2,3" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 574ms:

  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:278:                .filter { 
it.status == PendingActionStatus.ACTIVE && it.id !in navigatedIds }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:279:                .forEach 
{ action ->
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:280:                    val 
route = pendingActionNavRoute(action.type, action.entityId)
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:281:                    if 
(route != null) {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:282:                        
navigatedIds += action.id
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:283:                        
navController.navigate(route) { launchSingleTop = true }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:332:        when 
(routeResolver?.routeFor(intent)) {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:333:            
CustomerRouteSpec.BookingPriceApproval ->
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:334:                
navController.navigate(BookingRoutes.priceApprovalRoute(intent.entityId)) {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:335:                    
launchSingleTop = true
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:336:                }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:337:            
CustomerRouteSpec.Rating ->
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:338:                
navController.navigate(RatingRoutes.route(intent.entityId)) { launchSingleTop = true }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:339:            else -> Unit 
// home is the default; no explicit nav needed
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:340:        }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:341:    }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:1:package 
com.homeservices.customer.navigation
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:2:
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:3:internal object 
BookingRoutes {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:4:    const val BOOKING_GRAPH 
= "booking"
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:5:    const val SLOT_PICKER = 
"booking/slot/{serviceId}/{categoryId}"
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:6:    const val ADDRESS = 
"booking/address"
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:23:    ) = 
"booking/waitlist?lat=$lat&lng=$lng&serviceId=$serviceId"
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:24:
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:25:    fun confirmedRoute(
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:26:        bookingId: String,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:27:        appliedCredit: Int 
= 0,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:28:    ) = 
"booking/confirmed/$bookingId/$appliedCredit"
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:30:    const val 
PRICE_APPROVAL = "booking/price-approval/{bookingId}"
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:31:
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:32:    fun 
priceApprovalRoute(bookingId: String) = "booking/price-approval/$bookingId"
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:33:
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:34:    const val 
LIVE_TRACKING = "booking/tracking/{bookingId}"
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:35:
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:36:    fun 
liveTrackingRoute(bookingId: String) = "booking/tracking/$bookingId"
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\BookingRoutes.kt:37:}
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRouteResolver.kt:35:         * @return 
A [RouteSpec] whose [RouteSpec.name] maps to a valid Compose Nav route string.
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRouteResolver.kt:36:         */
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRouteResolver.kt:37:        override 
suspend fun decideInitialRoute(ctx: RouteContext): RouteSpec {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRouteResolver.kt:38:            val 
commonSpec = TierLadder.resolve(ctx)
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRouteResolver.kt:39:            return 
mapToCustomerRoute(commonSpec)
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRouteResolver.kt:40:        }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRouteResolver.kt:41:
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRouteResolver.kt:42:        /** Map a 
[PendingAction] to its customer-side route specifier. */
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRouteResolver.kt:70:        // ── 
Private ───────────────────────────────────────────────────────────
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRouteResolver.kt:71:
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRouteResolver.kt:72:        private 
fun mapToCustomerRoute(common: CommonRouteSpec): RouteSpec =
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRouteResolver.kt:73:            when 
(common) {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRouteResolver.kt:74:                is 
CommonRouteSpec.Auth -> CustomerRouteSpec.Auth
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRouteResolver.kt:75:                is 
CommonRouteSpec.KycBlocked -> CustomerRouteSpec.Home // customers don't have KYC blocking
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:51: *
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:52: * This is the SPIKE file 
for E11-S01a. The go/no-go gate verifies that
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:53: * 
[BookingPriceApprovalRoute] round-trips through the typed nav API.
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:54: *
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:55: * **Do NOT migrate 
existing string-based routes to typed routes in this file.**
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:56: * That migration is 
scoped to E11-S01b-2. The spike only validates feasibility.
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:75: * Verifies that 
arg-passing works through typed Compose Nav.
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:76: *
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:77: * Spike acceptance 
criterion: `BookingPriceApprovalRoute(bookingId="bk123")`
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:78: * round-trips through 
`composable<BookingPriceApprovalRoute>{}` +
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:79: * 
`entry.toRoute<BookingPriceApprovalRoute>()`.
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:80: */
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:81:@Serializable
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:82:public data class 
BookingPriceApprovalRoute(
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:83:    public val bookingId: 
String,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:84:) : CustomerRoute {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:85:    override val spec: 
CustomerRouteSpec get() = CustomerRouteSpec.BookingPriceApproval
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:90: */
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:91:@Serializable
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:92:public data class 
ServiceTrackingRoute(
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:93:    public val bookingId: 
String,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:94:) : CustomerRoute {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:95:    override val spec: 
CustomerRouteSpec get() = CustomerRouteSpec.ServiceTracking
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:100: */
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:101:@Serializable
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:102:public data class 
BookingConfirmedRoute(
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:103:    public val 
bookingId: String,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:104:) : CustomerRoute {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:105:    override val spec: 
CustomerRouteSpec get() = CustomerRouteSpec.BookingConfirmed
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:110: */
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:111:@Serializable
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:112:public data class 
RatingRoute(
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:113:    public val 
bookingId: String,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:114:) : CustomerRoute {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:115:    override val spec: 
CustomerRouteSpec get() = CustomerRouteSpec.Rating
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:120: */
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:121:@Serializable
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:122:public data class 
ComplaintRoute(
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:123:    public val 
bookingId: String,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:124:    public val 
complaintId: String? = null,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt:125:) : CustomerRoute {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:69:        composable(route = 
ComplaintRoutes.LIST) {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:70:            
ComplaintListScreen(
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:71:                
onComplaintClick = { bookingId -> navController.navigate(ComplaintRoutes.route(bookingId)) },
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:72:                onBack = { 
navController.popBackStack() },
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:73:            )
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:74:        }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:93:            onSettingsClick = 
{ navController.navigate(LocaleRoutes.SETTINGS) },
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:94:            
onProfileLanguageClick = { navController.navigate(LocaleRoutes.LANGUAGE_SETTINGS) },
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:95:            onTrackBooking = { 
id -> navController.navigate(BookingRoutes.liveTrackingRoute(id)) },
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:96:            onRateBooking = { 
id -> navController.navigate(RatingRoutes.route(id)) },
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:97:            onComplainBooking 
= { id -> navController.navigate(ComplaintRoutes.route(id)) },
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:98:            showWalletChip = 
featureFlags.walletVisible(),
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:99:            
walletBalanceInPaise = balancePaise,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:100:            onWalletClick = { 
navController.navigate(WalletRoutes.WALLET) },
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:107:                when {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:108:                    
"RATING_PROMPT_CUSTOMER" in uri && bookingId.isNotEmpty() ->
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:109:                        
navController.navigate(RatingRoutes.route(bookingId))
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:110:                    
"ADDON_APPROVAL_REQUESTED" in uri && bookingId.isNotEmpty() ->
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:111:                        
navController.navigate(BookingRoutes.priceApprovalRoute(bookingId))
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:112:                    
"COMPLAINT_UPDATE" in uri && bookingId.isNotEmpty() ->
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:113:                        
navController.navigate(ComplaintRoutes.route(bookingId))
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:114:                    else -> 
Unit // Unknown type — no-op until E11-S01b-2 route migration
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:115:                }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:116:            },
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:117:            onPriceApproval = 
{ id -> navController.navigate(BookingRoutes.priceApprovalRoute(id)) },
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:118:            // WS-D: consent 
management accessible from Profile tab
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:119:            
onManageConsentClick = { navController.navigate(LocaleRoutes.CONSENT_MANAGEMENT) },
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:120:        )
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:305:            categoryId = 
vm.pendingCategoryId,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:306:            onConfirmed = { 
bookingId, appliedCredit ->
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:307:                
navController.navigate(BookingRoutes.confirmedRoute(bookingId, appliedCredit)) {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:308:                    
popUpTo(BookingRoutes.BOOKING_GRAPH) { inclusive = true }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:309:                }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:310:            },
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:331:            bookingId = 
bookingId,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:332:            onBackToHome = { 
navController.popBackStack(CatalogueRoutes.HOME, inclusive = false) },
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:333:            onTrackBooking = 
{ id -> navController.navigate(BookingRoutes.liveTrackingRoute(id)) },
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:334:            
appliedCreditAmount = appliedCredit,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:335:        )
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:336:    }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:360:            viewModel = vm,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:361:            onBack = { 
navController.popBackStack() },
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:362:            onFileComplaint = 
{ id -> navController.navigate(ComplaintRoutes.route(id)) },
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:363:        )
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:364:    }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\MainGraph.kt:365:}
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:24: * @return The 
Compose Nav route string to navigate to, or null to suppress navigation.
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:25: */
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:26:public fun 
pendingActionNavRoute(
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:27:    type: 
PendingActionType,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:28:    entityId: 
String,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:29:): String? {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:39:    }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:40:    return when 
(type) {
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:41:        
PendingActionType.ADDON_APPROVAL_REQUESTED -> BookingRoutes.priceApprovalRoute(entityId)
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:42:        
PendingActionType.RATING_PROMPT_CUSTOMER -> RatingRoutes.route(entityId)
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:43:        else -> 
null
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:44:    }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:45:}
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:27: * Format: 
delete_account_cool_off/{requestId}/{scheduledDeletionEpochMs}
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:28: */
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:29:private fun coolOffRoute(
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:30:    requestId: String,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:31:    
scheduledDeletionEpochMs: Long,
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:32:): String = 
"${LocaleRoutes.DELETE_ACCOUNT_COOL_OFF}/$requestId/$scheduledDeletionEpochMs"
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:103:                // so 
ViewModel.init emits ExistingRequestDetected instead of CoolOff("", "").
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:104:                val 
epochMs = resolveEpochMs(scheduledDeletionAt)
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:105:                
navController.navigate(coolOffRoute(requestId, epochMs)) {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:106:                    
popUpTo(LocaleRoutes.DELETE_ACCOUNT) { inclusive = true }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:107:                }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:108:            },
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:128:                // FIX 2 
(P2): Use -1L sentinel for the 409 path (empty scheduledDeletionAt).
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:129:                val 
epochMs = resolveEpochMs(scheduledDeletionAt)
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:130:                
navController.navigate(coolOffRoute(requestId, epochMs)) {
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:131:                    
popUpTo(LocaleRoutes.DELETE_ACCOUNT) { inclusive = true }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:132:                }
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\SettingsGraph.kt:133:            },
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\rating\RatingRoutes.kt:4:    public const val ROUTE: 
String = "rating/{bookingId}"
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\rating\RatingRoutes.kt:5:
> customer-app\app\src\main\kotlin\com\homeservices\customer\ui\rating\RatingRoutes.kt:6:    public fun 
route(bookingId: String): String = "rating/$bookingId"
  customer-app\app\src\main\kotlin\com\homeservices\customer\ui\rating\RatingRoutes.kt:7:}



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt' | Select-Object -Skip 90 -First 35" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 676ms:
            customerHomeViewModel = customerHomeVm,
            onCategoryClick = { id -> navController.navigate(CatalogueRoutes.serviceList(id)) },
            onSettingsClick = { navController.navigate(LocaleRoutes.SETTINGS) },
            onProfileLanguageClick = { navController.navigate(LocaleRoutes.LANGUAGE_SETTINGS) },
            onTrackBooking = { id -> navController.navigate(BookingRoutes.liveTrackingRoute(id)) },
            onRateBooking = { id -> navController.navigate(RatingRoutes.route(id)) },
            onComplainBooking = { id -> navController.navigate(ComplaintRoutes.route(id)) },
            showWalletChip = featureFlags.walletVisible(),
            walletBalanceInPaise = balancePaise,
            onWalletClick = { navController.navigate(WalletRoutes.WALLET) },
            photoFirstCatalogueEnabled = featureFlags.photoFirstCatalogueEnabled(),
            // E11-S03: durable-hooks navigation callbacks
            onPendingActionRoute = { uri ->
                // Route URI format: homeservices://action/<TYPE>?bookingId=<id>
                // Resolve specific action routes that the nav graph already supports.
                val bookingId = uri.substringAfter("bookingId=", "").substringBefore("&")
                when {
                    "RATING_PROMPT_CUSTOMER" in uri && bookingId.isNotEmpty() ->
                        navController.navigate(RatingRoutes.route(bookingId))
                    "ADDON_APPROVAL_REQUESTED" in uri && bookingId.isNotEmpty() ->
                        navController.navigate(BookingRoutes.priceApprovalRoute(bookingId))
                    "COMPLAINT_UPDATE" in uri && bookingId.isNotEmpty() ->
                        navController.navigate(ComplaintRoutes.route(bookingId))
                    else -> Unit // Unknown type â€” no-op until E11-S01b-2 route migration
                }
            },
            onPriceApproval = { id -> navController.navigate(BookingRoutes.priceApprovalRoute(id)) },
            // WS-D: consent management accessible from Profile tab
            onManageConsentClick = { navController.navigate(LocaleRoutes.CONSENT_MANAGEMENT) },
        )
    }
}

private fun NavGraphBuilder.walletDestination(navController: NavController) {
    composable(WalletRoutes.WALLET) {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/SessionManager.kt' | Select-Object -Skip 160 -First 100" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 638ms:
         * 3.5. Best-effort [DeviceTokenRegistrar.unregister] â€” runs HERE while the cached bearer
         *    token is still valid and before [FirebaseMessaging.deleteToken] rotates the FCM token.
         *    Removes this device's token from the server's active-token list so push notifications
         *    stop being sent to the signed-out device.
         * 4. [IdTokenCache.signalSignOut] â€” clears cached token, pauses the refresh loop,
         *    and increments signOutGeneration; capture the generation for FCM guards below.
         *    Does NOT cancel the singleton scope so the next sign-in can resume.
         * 5. Best-effort [FirebaseAuth.signOut] (local-only SDK call; safe after prefs are cleared)
         * 6. Best-effort FCM cleanup â€” [FirebaseMessaging.deleteToken] (may hang or fail
         *    offline; never block sign-out).
         *    The deleteToken step is guarded by the sign-out generation: if the user signs back in
         *    while the FCM await is in-flight, the generation will have changed (via
         *    [signalSignIn] â†’ incrementAndGet) and the operation is skipped to avoid deleting
         *    the new session's FCM token.
         *
         * Each step after step 1 is wrapped in [runCatching] so failures are logged as
         * Sentry breadcrumbs but never thrown â€” sign-out always completes.
         *
         * If there is no current UID the function returns immediately (idempotent).
         */
        public suspend fun signOut() {
            // Step 1 â€” Capture uid BEFORE clearing prefs (needed for FCM topic name)
            val uid =
                (
                    prefs.getString(KEY_UID, null)
                        ?: (_authState.value as? AuthState.Authenticated)?.uid
                ) ?: return

            // Step 2 â€” Clear persisted session prefs (local-state-first: survives process kill)
            clearPrefs()

            // Step 3 â€” Transition to Unauthenticated immediately (UI reflects sign-out now)
            _authState.value = AuthState.Unauthenticated

            // Step 3.5 â€” Best-effort device-token server unregister.
            //             Runs BEFORE signalSignOut so the cached bearer token is still valid
            //             and BEFORE deleteToken so the FCM token hasn't been rotated.
            runCatching { deviceTokenRegistrar.unregister() }
                .onFailure { e ->
                    Sentry.addBreadcrumb(
                        io.sentry.Breadcrumb().apply {
                            category = "auth.signout"
                            message = "deviceTokenRegistrar.unregister failed: ${e.message}"
                            level = SentryLevel.WARNING
                        },
                    )
                }

            // Step 4 â€” Signal IdTokenCache to clear cached token and pause refresh loop.
            //           signalSignOut() increments signOutGeneration; capture it here so the
            //           FCM steps below can detect a concurrent sign-in and bail out.
            runCatching { idTokenCache.signalSignOut() }
                .onFailure { e ->
                    Sentry.addBreadcrumb(
                        io.sentry.Breadcrumb().apply {
                            category = "auth.signout"
                            message = "idTokenCache.signalSignOut() failed: ${e.message}"
                            level = SentryLevel.WARNING
                        },
                    )
                }
            // Read the generation AFTER signalSignOut (which bumps it) so any concurrent
            // signalSignIn (via saveSession) will produce a different value.
            val signOutGen = idTokenCache.currentSignOutGeneration()

            // Step 5 â€” Best-effort Firebase Auth sign-out (local SDK call; safe after prefs cleared)
            runCatching { firebaseAuth.signOut() }
                .onFailure { e ->
                    Sentry.addBreadcrumb(
                        io.sentry.Breadcrumb().apply {
                            category = "auth.signout"
                            message = "firebaseAuth.signOut() failed: ${e.message}"
                            level = SentryLevel.WARNING
                        },
                    )
                }

            // Step 6b â€” Best-effort FCM token deletion (rotates registration token).
            //            Guard: skip if generation changed (new sign-in raced the FCM await).
            runCatching {
                if (idTokenCache.currentSignOutGeneration() != signOutGen) return@runCatching
                firebaseMessaging.deleteToken().await()
            }.onFailure { e ->
                Sentry.addBreadcrumb(
                    io.sentry.Breadcrumb().apply {
                        category = "auth.signout"
                        message = "FCM deleteToken failed: ${e.message}"
                        level = SentryLevel.WARNING
                    },
                )
            }
        }

        /**
         * Clears prefs and transitions to Unauthenticated without touching Firebase or FCM.
         *
         * Kept for backward-compatibility with internal callers that do not need full
         * Firebase cleanup (e.g. TTL-expired session eviction on cold start).
         * For user-initiated sign-out, prefer [signOut].
         */

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'customer-app/app/src/test/kotlin/com/homeservices/customer/data/auth/SessionPrefsMigratorTest.kt' | Select-Object -First 220" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 644ms:
package com.homeservices.customer.data.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.test.core.app.ApplicationProvider
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * Tests for [SessionPrefsMigrator].
 *
 * Migration contract:
 * 1. When legacy key alias is absent: no-op (new prefs untouched).
 * 2. When legacy key alias is present: values are copied to new prefs.
 * 3. On migration failure (corrupt data): new prefs cleared, session expires naturally.
 *
 * Tests call [SessionPrefsMigrator.migrateIfNeededInternal] directly, passing [legacyKeyPresent]
 * as a parameter, to avoid Robolectric classloader constraints that prevent mockkObject from
 * intercepting @JvmStatic calls on Kotlin objects.
 */
@RunWith(RobolectricTestRunner::class)
public class SessionPrefsMigratorTest {
    private lateinit var context: Context

    @Before
    public fun setUp() {
        context = ApplicationProvider.getApplicationContext()
    }

    @After
    public fun tearDown() {
        context
            .getSharedPreferences("auth_session", Context.MODE_PRIVATE)
            .edit()
            .clear()
            .commit()
        context
            .getSharedPreferences("auth_session_new_target", Context.MODE_PRIVATE)
            .edit()
            .clear()
            .commit()
    }

    @Test
    public fun `isLegacyKeyPresent returns false when AndroidKeyStore has no matching alias`() {
        // Robolectric's AndroidKeyStore is empty â€” legacy key is absent by default.
        val result = SessionPrefsMigrator.isLegacyKeyPresent()
        assertThat(result).isFalse()
    }

    @Test
    public fun `migrateIfNeeded is no-op when legacy key is absent`() {
        val newPrefs: SharedPreferences =
            context.getSharedPreferences("auth_session_new_target", Context.MODE_PRIVATE)

        // Write a sentinel; migration must NOT clear it when legacy key is absent.
        newPrefs.edit().putString("uid", "existing-uid").commit()

        SessionPrefsMigrator.migrateIfNeededInternal(
            context = context,
            newPrefs = newPrefs,
            newPrefsName = "auth_session_new_target",
            legacyKeyPresent = false,
        )

        assertThat(newPrefs.getString("uid", null)).isEqualTo("existing-uid")
    }

    @Test
    public fun `migrateIfNeeded does not clear active auth session prefs`() {
        val activePrefs: SharedPreferences =
            context.getSharedPreferences("auth_session", Context.MODE_PRIVATE)
        activePrefs
            .edit()
            .putString("uid", "active-uid")
            .putLong("session_created_at_epoch_ms", 3_000_000L)
            .commit()

        SessionPrefsMigrator.migrateIfNeededInternal(
            context = context,
            newPrefs = activePrefs,
            newPrefsName = "auth_session",
            legacyKeyPresent = true,
        )

        assertThat(activePrefs.getString("uid", null)).isEqualTo("active-uid")
        assertThat(activePrefs.getLong("session_created_at_epoch_ms", 0L)).isEqualTo(3_000_000L)
    }

    @Test
    public fun `migrateIfNeeded copies values from legacy prefs when legacy key present`() {
        // Seed the legacy prefs file (plain prefs simulate what old EncryptedSharedPreferences held)
        val legacyPrefs: SharedPreferences =
            context.getSharedPreferences("auth_session", Context.MODE_PRIVATE)
        legacyPrefs
            .edit()
            .putString("uid", "uid-legacy")
            .putString("phone_last_four", "1234")
            .putLong("session_created_at_epoch_ms", 1_000_000L)
            .commit()

        val newPrefs: SharedPreferences =
            context.getSharedPreferences("auth_session_new_target", Context.MODE_PRIVATE)

        SessionPrefsMigrator.migrateIfNeededInternal(
            context = context,
            newPrefs = newPrefs,
            newPrefsName = "auth_session_new_target",
            legacyKeyPresent = true,
        )

        assertThat(newPrefs.getString("uid", null)).isEqualTo("uid-legacy")
        assertThat(newPrefs.getString("phone_last_four", null)).isEqualTo("1234")
        assertThat(newPrefs.getLong("session_created_at_epoch_ms", 0L)).isEqualTo(1_000_000L)

        // Legacy prefs must be cleared after successful migration.
        assertThat(legacyPrefs.all).isEmpty()
    }

    @Test
    public fun `migrateIfNeeded clears new prefs when legacy prefs read causes exception`() {
        val newPrefs: SharedPreferences =
            context.getSharedPreferences("auth_session_new_target", Context.MODE_PRIVATE)
        newPrefs.edit().putString("uid", "stale-uid").commit()

        // We can't easily cause a SharedPreferences read to throw in Robolectric, but we can
        // verify the graceful-failure path by seeding an empty legacy prefs (simulates a real
        // exception scenario where migration leaves new prefs intact when nothing to copy).
        // The failure-path is covered by the clear() call in the catch block â€” verified below.

        // For this test we seed a corrupt state: legacy prefs has no entries but key is "present".
        // The migrator finds nothing to copy and exits normally (newPrefs unchanged).
        SessionPrefsMigrator.migrateIfNeededInternal(
            context = context,
            newPrefs = newPrefs,
            newPrefsName = "auth_session_new_target",
            legacyKeyPresent = true,
        )

        // Legacy prefs are empty so nothing to copy; newPrefs with stale-uid survives.
        // This confirms the migration is safe to run even without legacy data.
        // Note: the exception path (clear) is exercised by migrateIfNeeded integration
        // on a device/emulator; Robolectric does not exercise SharedPreferences exceptions.
        assertThat(newPrefs.getString("uid", null)).isEqualTo("stale-uid")
    }

    /**
     * SEC-07: Documents the failure mode when legacy prefs were written by
     * MasterKeys-backed EncryptedSharedPreferences.
     *
     * When EncryptedSharedPreferences writes to a file, BOTH the key and the value
     * are encrypted. Reading the file as plain SharedPreferences yields opaque blobs
     * under encrypted key names â€” NOT the original "uid" / "phone_last_four" keys.
     * The migrator copies those garbage-keyed entries into new prefs, leaving no
     * standard session keys â†’ user is forced to re-login.
     *
     * This test documents (and regression-protects) that failure mode so that any
     * future migrator change which accidentally hides the empty-session outcome is
     * immediately caught.
     */
    @Test
    public fun `migration with legacy encrypted file produces empty new prefs (forces re-login)`() {
        // Simulate what happens when legacy prefs were written by EncryptedSharedPreferences:
        // the key names themselves are encrypted, so "uid" and "phone_last_four" are never
        // stored under those literal key names. The migrator reads these garbage-key entries
        // and copies them under their encrypted (unreadable) key names into new prefs.
        // Result: newPrefs has no "uid" key â†’ session is empty â†’ user must re-login.
        val legacyPrefs = context.getSharedPreferences("auth_session", Context.MODE_PRIVATE)
        legacyPrefs
            .edit()
            .putString("AES256_ENCRYPTED_KEY_BLOB_1", "AES256_ENCRYPTED_VALUE_BLOB_1") // simulates encrypted uid entry
            .putString("AES256_ENCRYPTED_KEY_BLOB_2", "AES256_ENCRYPTED_VALUE_BLOB_2") // simulates encrypted phone entry
            .commit()

        val newPrefs = context.getSharedPreferences("auth_session_new_target", Context.MODE_PRIVATE)

        SessionPrefsMigrator.migrateIfNeededInternal(
            context = context,
            newPrefs = newPrefs,
            newPrefsName = "auth_session_new_target",
            legacyKeyPresent = true,
        )

        // The migration "succeeded" but copied useless encrypted key names.
        // Standard session keys are absent â†’ user is forced to re-login.
        assertThat(newPrefs.getString("uid", null)).isNull()
        assertThat(newPrefs.getString("phone_last_four", null)).isNull()
    }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'api/tests' -Include '*.test.ts','*.spec.ts','*.ts' | Select-String -Pattern 'customerUnregisterDevice|devices' -Context 2,3" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 797ms:

  api\tests\functions\devices.test.ts:22:import {
  api\tests\functions\devices.test.ts:23:  customerRegisterDeviceHandler,
> api\tests\functions\devices.test.ts:24:  customerUnregisterDeviceHandler,
  api\tests\functions\devices.test.ts:25:  technicianRegisterDeviceHandler,
  api\tests\functions\devices.test.ts:26:  technicianUnregisterDeviceHandler,
  api\tests\functions\devices.test.ts:27:  adminRegisterDeviceHandler,
  api\tests\functions\devices.test.ts:28:  adminUnregisterDeviceHandler,
> api\tests\functions\devices.test.ts:29:} from '../../src/functions/devices.js';
  api\tests\functions\devices.test.ts:30:import { deviceTokenRepo } from '../../src/cosmos/device-token-repository.js';
  api\tests\functions\devices.test.ts:31:import { verifyTechnicianToken } from 
'../../src/middleware/verifyTechnicianToken.js';
  api\tests\functions\devices.test.ts:32:
  api\tests\functions\devices.test.ts:67:}
  api\tests\functions\devices.test.ts:68:
> api\tests\functions\devices.test.ts:69:// ── Customer: POST /v1/devices/register 
───────────────────────────────────────
  api\tests\functions\devices.test.ts:70:
  api\tests\functions\devices.test.ts:71:describe('customerRegisterDeviceHandler', () => {
  api\tests\functions\devices.test.ts:72:  beforeEach(() => vi.clearAllMocks());
  api\tests\functions\devices.test.ts:126:});
  api\tests\functions\devices.test.ts:127:
> api\tests\functions\devices.test.ts:128:// ── Customer: DELETE /v1/devices/{deviceToken} 
────────────────────────────────
  api\tests\functions\devices.test.ts:129:
> api\tests\functions\devices.test.ts:130:describe('customerUnregisterDeviceHandler', () => {
  api\tests\functions\devices.test.ts:131:  beforeEach(() => vi.clearAllMocks());
  api\tests\functions\devices.test.ts:132:
  api\tests\functions\devices.test.ts:133:  it('returns 204 and removes token when deviceToken param present', async 
() => {
  api\tests\functions\devices.test.ts:134:    const req = makeReqWithParams('DELETE', 'http://localhost/', { 
deviceToken: VALID_TOKEN });
> api\tests\functions\devices.test.ts:135:    const res = await customerUnregisterDeviceHandler(req, mockCtx, 
mockCustomer);
  api\tests\functions\devices.test.ts:136:    expect(res.status).toBe(204);
  api\tests\functions\devices.test.ts:137:    
expect(vi.mocked(deviceTokenRepo.unregisterDeviceToken)).toHaveBeenCalledWith(
  api\tests\functions\devices.test.ts:138:      'cust_123', VALID_TOKEN,
  api\tests\functions\devices.test.ts:142:  it('returns 400 MISSING_TOKEN when deviceToken param absent', async () => {
  api\tests\functions\devices.test.ts:143:    const req = makeReqWithParams('DELETE', 'http://localhost/', {});
> api\tests\functions\devices.test.ts:144:    const res = await customerUnregisterDeviceHandler(req, mockCtx, 
mockCustomer);
  api\tests\functions\devices.test.ts:145:    expect(res.status).toBe(400);
  api\tests\functions\devices.test.ts:146:    expect((res.jsonBody as { code: string }).code).toBe('MISSING_TOKEN');
  api\tests\functions\devices.test.ts:147:  });
  api\tests\functions\devices.test.ts:148:});
  api\tests\functions\devices.test.ts:149:
> api\tests\functions\devices.test.ts:150:// ── Technician: POST /v1/technician/devices/register 
─────────────────────────
  api\tests\functions\devices.test.ts:151:
  api\tests\functions\devices.test.ts:152:describe('technicianRegisterDeviceHandler', () => {
  api\tests\functions\devices.test.ts:153:  beforeEach(() => vi.clearAllMocks());
  api\tests\functions\devices.test.ts:187:});
  api\tests\functions\devices.test.ts:188:
> api\tests\functions\devices.test.ts:189:// ── Technician: DELETE /v1/technician/devices/{deviceToken} 
──────────────────
  api\tests\functions\devices.test.ts:190:
  api\tests\functions\devices.test.ts:191:describe('technicianUnregisterDeviceHandler', () => {
  api\tests\functions\devices.test.ts:192:  beforeEach(() => vi.clearAllMocks());
  api\tests\functions\devices.test.ts:219:});
  api\tests\functions\devices.test.ts:220:
> api\tests\functions\devices.test.ts:221:// ── Admin: POST /admin/v1/devices/register 
─────────────────────────────────────
  api\tests\functions\devices.test.ts:222:
  api\tests\functions\devices.test.ts:223:describe('adminRegisterDeviceHandler', () => {
  api\tests\functions\devices.test.ts:224:  beforeEach(() => vi.clearAllMocks());
  api\tests\functions\devices.test.ts:244:});
  api\tests\functions\devices.test.ts:245:
> api\tests\functions\devices.test.ts:246:// ── Admin: DELETE /admin/v1/devices/{deviceToken} 
──────────────────────────────
  api\tests\functions\devices.test.ts:247:
  api\tests\functions\devices.test.ts:248:describe('adminUnregisterDeviceHandler', () => {
  api\tests\functions\devices.test.ts:249:  beforeEach(() => vi.clearAllMocks());
  api\tests\services\fcm-technician.service.test.ts:52:  });
  api\tests\services\fcm-technician.service.test.ts:53:
> api\tests\services\fcm-technician.service.test.ts:54:  it('uses sendEachForMulticast when technician has multiple 
devices', async () => {
  api\tests\services\fcm-technician.service.test.ts:55:    mockGetDeviceTokens.mockResolvedValue(['tok-tech-a', 
'tok-tech-b']);
  api\tests\services\fcm-technician.service.test.ts:56:
  api\tests\services\fcm-technician.service.test.ts:57:    await sendTechnicianBookingStatusUpdatePush({



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'api/src' -Include '*.ts' | Select-String -Pattern 'headers\\.get\\(' | Select-Object -First 80" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 685ms:

api\src\functions\admin\auth\login.ts:60:  const ip = req.headers.get('x-forwarded-for') ?? 
req.headers.get('x-real-ip') ?? undefined;
api\src\functions\admin\auth\login.ts:61:  const userAgent = req.headers.get('user-agent') ?? undefined;
api\src\functions\admin\auth\logout.ts:13:  const cookies = parseCookies(req.headers.get('cookie') ?? undefined);
api\src\functions\admin\auth\logout.ts:20:      const ip = req.headers.get('x-forwarded-for') ?? undefined;
api\src\functions\admin\auth\logout.ts:21:      const userAgent = req.headers.get('user-agent') ?? undefined;
api\src\functions\admin\auth\refresh.ts:12:  const cookies = parseCookies(req.headers.get('cookie') ?? undefined);
api\src\functions\admin\auth\setup-totp.ts:14:  const provided = req.headers.get('x-setup-secret') ?? '';
api\src\functions\admin\auth\setup-totp.ts:44:  const auth = req.headers.get('authorization') ?? '';
api\src\functions\admin\auth\setup-totp.ts:132:  const ip = req.headers.get('x-forwarded-for') ?? undefined;
api\src\functions\admin\complaints\create.ts:65:    ip: req.headers.get('x-forwarded-for') ?? '',
api\src\functions\admin\complaints\patch.ts:159:      ip: req.headers.get('x-forwarded-for') ?? '',
api\src\functions\admin\complaints\patch.ts:175:      ip: req.headers.get('x-forwarded-for') ?? '',
api\src\functions\admin\compliance\ssc-levy.ts:198:      { ip: req.headers.get('x-forwarded-for') ?? 'unknown' },
api\src\functions\admin\finance\approve-payouts.ts:96:    { ip: req.headers.get('x-forwarded-for') ?? 'unknown' },
api\src\functions\complaints\partner-create.ts:18:  const auth = req.headers.get('authorization') ?? '';
api\src\functions\complaints\partner-get.ts:12:  const auth = req.headers.get('authorization') ?? '';
api\src\functions\bookings.ts:180:  const idempotencyKey = req.headers.get('idempotency-key') ?? '';
api\src\functions\devices.ts:50:  const deviceToken = req.headers.get('x-device-token');
api\src\functions\ratings.ts:21:  const uid = await uidFromAuth(req.headers.get('authorization') ?? '');
api\src\functions\ratings.ts:102:  const uid = await uidFromAuth(req.headers.get('authorization') ?? '');
api\src\functions\users-data-export.ts:19:  const auth = req.headers.get('authorization') ?? '';
api\src\functions\users-erasure-request.ts:21:  const auth = req.headers.get('authorization') ?? '';
api\src\functions\waitlist.ts:18:    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
api\src\functions\webhooks.ts:18:  const signature = req.headers.get('x-razorpay-signature') ?? '';
api\src\functions\webhooks.ts:130:  const eventId = req.headers.get('razorpay-event-id');
api\src\middleware\requireAdmin.ts:16:      const cookies = parseCookies(req.headers.get('cookie') ?? undefined);
api\src\middleware\requireCustomer.ts:13:    const auth = req.headers.get('authorization') ?? '';
api\src\middleware\requireIntegrity.ts:74:    const token = req.headers.get('x-integrity-token');
api\src\middleware\verifyTechnicianToken.ts:7:  const authorization = req.headers.get('Authorization') ?? '';
api\src\middleware\withCorrelationId.ts:20:    const correlationId = req.headers.get('x-correlation-id') ?? 
randomUUID();
api\src\middleware\withRateLimit.ts:77:        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
api\src\middleware\withRateLimit.ts:78:        req.headers.get('x-real-ip') ??



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -File | Select-String -Pattern '\\.codex-review-passed|codex-review-passed' -SimpleMatch | Select-Object -First 50" in C:\Alok\Business Projects\Urbanclap-sprint4
2026-05-23T02:02:12.776126Z ERROR codex_core::tools::router: error=Exit code: 124
Wall time: 10.3 seconds
Output:
command timed out after 10313 milliseconds

 exited 124 in 10313ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint4' grep -n \"codex-review-passed\\|\\.codex-review-passed\"" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1422ms:
.gitignore:100:# .codex-review-passed — keep committed per-story
CLAUDE.md:137:   - `codex review --base main` → `.codex-review-passed` (local, before push)
admin-web/.claude/settings.json:21:            "command": "bash -c 'if [ -n \"$CLAUDE_OVERRIDE_REASON\" ]; then echo \"{\\\"ts\\\":\\\"$(date -Iseconds)\\\",\\\"reason\\\":\\\"$CLAUDE_OVERRIDE_REASON\\\",\\\"hook\\\":\\\"codex-gate\\\"}\" >> ~/.claude/override-log.jsonl; exit 0; fi; if [ ! -f .codex-review-passed ]; then echo \"{\\\"decision\\\":\\\"block\\\",\\\"reason\\\":\\\"No .codex-review-passed marker. Run /codex-review-gate before push.\\\"}\"; exit 0; fi; MARKER=$(jq -r .commit .codex-review-passed 2>/dev/null); HEAD=$(git rev-parse HEAD); if [ \"$MARKER\" != \"$HEAD\" ]; then echo \"{\\\"decision\\\":\\\"block\\\",\\\"reason\\\":\\\"Codex review marker is stale (marker=$MARKER head=$HEAD). Re-run /codex-review-gate.\\\"}\"; fi'",
admin-web/CLAUDE.md:22:6. 5-layer review gate → `/codex-review-gate` (writes `.codex-review-passed`)
admin-web/README.md:72:- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
api/.claude/settings.json:21:            "command": "bash -c 'if [ -n \"$CLAUDE_OVERRIDE_REASON\" ]; then exit 0; fi; [ -f .codex-review-passed ] && [ \"$(jq -r .commit .codex-review-passed)\" = \"$(git rev-parse HEAD)\" ] || echo \"{\\\"decision\\\":\\\"block\\\",\\\"reason\\\":\\\"Run /codex-review-gate before push.\\\"}\"'",
customer-app/.claude/settings.json:21:            "command": "bash -c 'if [ -n \"$CLAUDE_OVERRIDE_REASON\" ]; then exit 0; fi; [ -f .codex-review-passed ] && [ \"$(jq -r .commit .codex-review-passed)\" = \"$(git rev-parse HEAD)\" ] || echo \"{\\\"decision\\\":\\\"block\\\",\\\"reason\\\":\\\"Run /codex-review-gate before push.\\\"}\"'",
docs/reviews/codex-20260418-2013-e01-s03.md:31:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2013-e01-s03.md:37:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2013-e01-s03.md:113:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2013-e01-s03.md:114:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2013-e01-s03.md:117:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2013-e01-s03.md:121:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2013-e01-s03.md:129:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2013-e01-s03.md:151:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2013-e01-s03.md:157:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2013-e01-s03.md:233:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2013-e01-s03.md:234:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2013-e01-s03.md:237:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2013-e01-s03.md:241:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2013-e01-s03.md:249:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2013-e01-s03.md:383:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2013-e01-s03.md:386:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2013-e01-s03.md:2162:+  - [ ] T7.3 Replace the template's naive codex-marker `MARKER == HEAD` check with the **ancestor-check + scope-diff** block copied verbatim from `.github/workflows/api-ship.yml` (allowed-scope: `.codex-review-passed` + `docs/reviews/**` — same as the other two workflows)
docs/reviews/codex-20260418-2013-e01-s03.md:2173:+  - [ ] T9.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-20260418-2013-e01-s03.md:2204:+| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed`; each workflow enforces via ancestor-check + scope-diff |
docs/reviews/codex-20260418-2013-e01-s03.md:2437:+- [Source: `customer-app/.claude/settings.json` + `technician-app/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-20260418-2013-e01-s03.md:2485:+- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-20260418-2013-e01-s03.md:2588:+| A3 | Baseline codex step uses the naive `MARKER_SHA == HEAD_SHA` pattern — the exact chicken-and-egg paradox E01-S01 + E01-S02 already fixed | Replace verbatim with the **ancestor-check + scope-diff** block copied from `.github/workflows/api-ship.yml` (lines 73–98). Allowed scope: `.codex-review-passed` + `docs/reviews/**`. | **T7.3** |
docs/reviews/codex-20260418-2013-e01-s03.md:2590:+| A5 | Baseline `ship.yml` has **no `paths:` filter** — every push/PR on any sub-project triggers both Android workflows, burning CI minutes | Add `paths:` filter on both `pull_request` and `push`: customer-ship.yml → `['customer-app/**', '.github/workflows/customer-ship.yml', '.codex-review-passed']`; technician-ship.yml mirrors. Including `.codex-review-passed` mirrors admin-ship.yml + api-ship.yml precedent so the codex step re-runs when the marker moves. | **T7.2** |
docs/reviews/codex-20260418-2013-e01-s03.md:4376:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2013-e01-s03.md:4382:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2013-e01-s03.md:4458:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2013-e01-s03.md:4459:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2013-e01-s03.md:4462:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2013-e01-s03.md:4466:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2013-e01-s03.md:4474:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2013-e01-s03.md:4843:+- On PASS: a `.codex-review-passed` marker file at repo root with `{"commit": "<SHA>"}` JSON pointing at the current HEAD
docs/reviews/codex-20260418-2013-e01-s03.md:4859:+git add .codex-review-passed docs/reviews/
docs/reviews/codex-20260418-2013-e01-s03.md:4877:+Expected: push succeeds; pre-push hook in `customer-app/.claude/settings.json` and `technician-app/.claude/settings.json` PASSES because `.codex-review-passed` exists + matches HEAD. If the hook blocks, re-run `/codex-review-gate` to regenerate the marker.
docs/reviews/codex-20260418-2013-e01-s03.md:4899:+- [ ] `.codex-review-passed` present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-20260418-2013-e01-s03.md:5073:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2013-e01-s03.md:5076:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2020-e01-s03-round2.md:31:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2020-e01-s03-round2.md:37:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2020-e01-s03-round2.md:113:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2020-e01-s03-round2.md:114:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2020-e01-s03-round2.md:117:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2020-e01-s03-round2.md:121:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2020-e01-s03-round2.md:129:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2020-e01-s03-round2.md:151:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2020-e01-s03-round2.md:157:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2020-e01-s03-round2.md:233:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2020-e01-s03-round2.md:234:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2020-e01-s03-round2.md:237:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2020-e01-s03-round2.md:241:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2020-e01-s03-round2.md:249:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2020-e01-s03-round2.md:383:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2020-e01-s03-round2.md:386:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2020-e01-s03-round2.md:2159:+  - [ ] T7.3 Replace the template's naive codex-marker `MARKER == HEAD` check with the **ancestor-check + scope-diff** block copied verbatim from `.github/workflows/api-ship.yml` (allowed-scope: `.codex-review-passed` + `docs/reviews/**` — same as the other two workflows)
docs/reviews/codex-20260418-2020-e01-s03-round2.md:2170:+  - [ ] T9.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-20260418-2020-e01-s03-round2.md:2201:+| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed`; each workflow enforces via ancestor-check + scope-diff |
docs/reviews/codex-20260418-2020-e01-s03-round2.md:2434:+- [Source: `customer-app/.claude/settings.json` + `technician-app/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-20260418-2020-e01-s03-round2.md:2482:+- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-20260418-2020-e01-s03-round2.md:2585:+| A3 | Baseline codex step uses the naive `MARKER_SHA == HEAD_SHA` pattern — the exact chicken-and-egg paradox E01-S01 + E01-S02 already fixed | Replace verbatim with the **ancestor-check + scope-diff** block copied from `.github/workflows/api-ship.yml` (lines 73–98). Allowed scope: `.codex-review-passed` + `docs/reviews/**`. | **T7.3** |
docs/reviews/codex-20260418-2020-e01-s03-round2.md:2587:+| A5 | Baseline `ship.yml` has **no `paths:` filter** — every push/PR on any sub-project triggers both Android workflows, burning CI minutes | Add `paths:` filter on both `pull_request` and `push`: customer-ship.yml → `['customer-app/**', '.github/workflows/customer-ship.yml', '.codex-review-passed']`; technician-ship.yml mirrors. Including `.codex-review-passed` mirrors admin-ship.yml + api-ship.yml precedent so the codex step re-runs when the marker moves. | **T7.2** |
docs/reviews/codex-20260418-2020-e01-s03-round2.md:4373:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2020-e01-s03-round2.md:4379:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2020-e01-s03-round2.md:4455:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2020-e01-s03-round2.md:4456:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2020-e01-s03-round2.md:4459:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2020-e01-s03-round2.md:4463:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2020-e01-s03-round2.md:4471:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2020-e01-s03-round2.md:4840:+- On PASS: a `.codex-review-passed` marker file at repo root with `{"commit": "<SHA>"}` JSON pointing at the current HEAD
docs/reviews/codex-20260418-2020-e01-s03-round2.md:4856:+git add .codex-review-passed docs/reviews/
docs/reviews/codex-20260418-2020-e01-s03-round2.md:4874:+Expected: push succeeds; pre-push hook in `customer-app/.claude/settings.json` and `technician-app/.claude/settings.json` PASSES because `.codex-review-passed` exists + matches HEAD. If the hook blocks, re-run `/codex-review-gate` to regenerate the marker.
docs/reviews/codex-20260418-2020-e01-s03-round2.md:4896:+- [ ] `.codex-review-passed` present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-20260418-2020-e01-s03-round2.md:5070:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2020-e01-s03-round2.md:5073:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2031-e01-s03-round3.md:31:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2031-e01-s03-round3.md:37:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2031-e01-s03-round3.md:113:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2031-e01-s03-round3.md:114:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2031-e01-s03-round3.md:117:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2031-e01-s03-round3.md:121:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2031-e01-s03-round3.md:129:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2031-e01-s03-round3.md:151:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2031-e01-s03-round3.md:157:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2031-e01-s03-round3.md:233:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2031-e01-s03-round3.md:234:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2031-e01-s03-round3.md:237:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2031-e01-s03-round3.md:241:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2031-e01-s03-round3.md:249:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2031-e01-s03-round3.md:383:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2031-e01-s03-round3.md:386:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2031-e01-s03-round3.md:2163:+  - [ ] T7.3 Replace the template's naive codex-marker `MARKER == HEAD` check with the **ancestor-check + scope-diff** block copied verbatim from `.github/workflows/api-ship.yml` (allowed-scope: `.codex-review-passed` + `docs/reviews/**` — same as the other two workflows)
docs/reviews/codex-20260418-2031-e01-s03-round3.md:2174:+  - [ ] T9.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-20260418-2031-e01-s03-round3.md:2205:+| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed`; each workflow enforces via ancestor-check + scope-diff |
docs/reviews/codex-20260418-2031-e01-s03-round3.md:2438:+- [Source: `customer-app/.claude/settings.json` + `technician-app/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-20260418-2031-e01-s03-round3.md:2486:+- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-20260418-2031-e01-s03-round3.md:2589:+| A3 | Baseline codex step uses the naive `MARKER_SHA == HEAD_SHA` pattern — the exact chicken-and-egg paradox E01-S01 + E01-S02 already fixed | Replace verbatim with the **ancestor-check + scope-diff** block copied from `.github/workflows/api-ship.yml` (lines 73–98). Allowed scope: `.codex-review-passed` + `docs/reviews/**`. | **T7.3** |
docs/reviews/codex-20260418-2031-e01-s03-round3.md:2591:+| A5 | Baseline `ship.yml` has **no `paths:` filter** — every push/PR on any sub-project triggers both Android workflows, burning CI minutes | Add `paths:` filter on both `pull_request` and `push`: customer-ship.yml → `['customer-app/**', '.github/workflows/customer-ship.yml', '.codex-review-passed']`; technician-ship.yml mirrors. Including `.codex-review-passed` mirrors admin-ship.yml + api-ship.yml precedent so the codex step re-runs when the marker moves. | **T7.2** |
docs/reviews/codex-20260418-2031-e01-s03-round3.md:4377:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2031-e01-s03-round3.md:4383:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2031-e01-s03-round3.md:4459:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2031-e01-s03-round3.md:4460:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2031-e01-s03-round3.md:4463:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2031-e01-s03-round3.md:4467:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2031-e01-s03-round3.md:4475:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2031-e01-s03-round3.md:4844:+- On PASS: a `.codex-review-passed` marker file at repo root with `{"commit": "<SHA>"}` JSON pointing at the current HEAD
docs/reviews/codex-20260418-2031-e01-s03-round3.md:4860:+git add .codex-review-passed docs/reviews/
docs/reviews/codex-20260418-2031-e01-s03-round3.md:4878:+Expected: push succeeds; pre-push hook in `customer-app/.claude/settings.json` and `technician-app/.claude/settings.json` PASSES because `.codex-review-passed` exists + matches HEAD. If the hook blocks, re-run `/codex-review-gate` to regenerate the marker.
docs/reviews/codex-20260418-2031-e01-s03-round3.md:4900:+- [ ] `.codex-review-passed` present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-20260418-2031-e01-s03-round3.md:5074:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2031-e01-s03-round3.md:5077:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2043-e01-s03-round4.md:31:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2043-e01-s03-round4.md:37:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2043-e01-s03-round4.md:113:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2043-e01-s03-round4.md:114:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2043-e01-s03-round4.md:117:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2043-e01-s03-round4.md:121:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2043-e01-s03-round4.md:129:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2043-e01-s03-round4.md:151:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2043-e01-s03-round4.md:157:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2043-e01-s03-round4.md:233:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2043-e01-s03-round4.md:234:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2043-e01-s03-round4.md:237:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2043-e01-s03-round4.md:241:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2043-e01-s03-round4.md:249:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2043-e01-s03-round4.md:385:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2043-e01-s03-round4.md:388:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2043-e01-s03-round4.md:2168:+  - [ ] T7.3 Replace the template's naive codex-marker `MARKER == HEAD` check with the **ancestor-check + scope-diff** block copied verbatim from `.github/workflows/api-ship.yml` (allowed-scope: `.codex-review-passed` + `docs/reviews/**` — same as the other two workflows)
docs/reviews/codex-20260418-2043-e01-s03-round4.md:2179:+  - [ ] T9.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-20260418-2043-e01-s03-round4.md:2210:+| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed`; each workflow enforces via ancestor-check + scope-diff |
docs/reviews/codex-20260418-2043-e01-s03-round4.md:2443:+- [Source: `customer-app/.claude/settings.json` + `technician-app/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-20260418-2043-e01-s03-round4.md:2491:+- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-20260418-2043-e01-s03-round4.md:2594:+| A3 | Baseline codex step uses the naive `MARKER_SHA == HEAD_SHA` pattern — the exact chicken-and-egg paradox E01-S01 + E01-S02 already fixed | Replace verbatim with the **ancestor-check + scope-diff** block copied from `.github/workflows/api-ship.yml` (lines 73–98). Allowed scope: `.codex-review-passed` + `docs/reviews/**`. | **T7.3** |
docs/reviews/codex-20260418-2043-e01-s03-round4.md:2596:+| A5 | Baseline `ship.yml` has **no `paths:` filter** — every push/PR on any sub-project triggers both Android workflows, burning CI minutes | Add `paths:` filter on both `pull_request` and `push`: customer-ship.yml → `['customer-app/**', '.github/workflows/customer-ship.yml', '.codex-review-passed']`; technician-ship.yml mirrors. Including `.codex-review-passed` mirrors admin-ship.yml + api-ship.yml precedent so the codex step re-runs when the marker moves. | **T7.2** |
docs/reviews/codex-20260418-2043-e01-s03-round4.md:4382:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2043-e01-s03-round4.md:4388:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2043-e01-s03-round4.md:4464:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2043-e01-s03-round4.md:4465:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2043-e01-s03-round4.md:4468:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2043-e01-s03-round4.md:4472:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2043-e01-s03-round4.md:4480:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2043-e01-s03-round4.md:4849:+- On PASS: a `.codex-review-passed` marker file at repo root with `{"commit": "<SHA>"}` JSON pointing at the current HEAD
docs/reviews/codex-20260418-2043-e01-s03-round4.md:4865:+git add .codex-review-passed docs/reviews/
docs/reviews/codex-20260418-2043-e01-s03-round4.md:4883:+Expected: push succeeds; pre-push hook in `customer-app/.claude/settings.json` and `technician-app/.claude/settings.json` PASSES because `.codex-review-passed` exists + matches HEAD. If the hook blocks, re-run `/codex-review-gate` to regenerate the marker.
docs/reviews/codex-20260418-2043-e01-s03-round4.md:4905:+- [ ] `.codex-review-passed` present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-20260418-2043-e01-s03-round4.md:5081:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2043-e01-s03-round4.md:5084:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2050-e01-s03-round5.md:31:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2050-e01-s03-round5.md:37:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2050-e01-s03-round5.md:113:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2050-e01-s03-round5.md:114:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2050-e01-s03-round5.md:117:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2050-e01-s03-round5.md:121:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2050-e01-s03-round5.md:129:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2050-e01-s03-round5.md:151:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2050-e01-s03-round5.md:157:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2050-e01-s03-round5.md:233:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2050-e01-s03-round5.md:234:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2050-e01-s03-round5.md:237:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2050-e01-s03-round5.md:241:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2050-e01-s03-round5.md:249:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2050-e01-s03-round5.md:385:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2050-e01-s03-round5.md:388:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2050-e01-s03-round5.md:2168:+  - [ ] T7.3 Replace the template's naive codex-marker `MARKER == HEAD` check with the **ancestor-check + scope-diff** block copied verbatim from `.github/workflows/api-ship.yml` (allowed-scope: `.codex-review-passed` + `docs/reviews/**` — same as the other two workflows)
docs/reviews/codex-20260418-2050-e01-s03-round5.md:2179:+  - [ ] T9.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-20260418-2050-e01-s03-round5.md:2210:+| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed`; each workflow enforces via ancestor-check + scope-diff |
docs/reviews/codex-20260418-2050-e01-s03-round5.md:2443:+- [Source: `customer-app/.claude/settings.json` + `technician-app/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-20260418-2050-e01-s03-round5.md:2491:+- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-20260418-2050-e01-s03-round5.md:2594:+| A3 | Baseline codex step uses the naive `MARKER_SHA == HEAD_SHA` pattern — the exact chicken-and-egg paradox E01-S01 + E01-S02 already fixed | Replace verbatim with the **ancestor-check + scope-diff** block copied from `.github/workflows/api-ship.yml` (lines 73–98). Allowed scope: `.codex-review-passed` + `docs/reviews/**`. | **T7.3** |
docs/reviews/codex-20260418-2050-e01-s03-round5.md:2596:+| A5 | Baseline `ship.yml` has **no `paths:` filter** — every push/PR on any sub-project triggers both Android workflows, burning CI minutes | Add `paths:` filter on both `pull_request` and `push`: customer-ship.yml → `['customer-app/**', '.github/workflows/customer-ship.yml', '.codex-review-passed']`; technician-ship.yml mirrors. Including `.codex-review-passed` mirrors admin-ship.yml + api-ship.yml precedent so the codex step re-runs when the marker moves. | **T7.2** |
docs/reviews/codex-20260418-2050-e01-s03-round5.md:4382:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2050-e01-s03-round5.md:4388:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2050-e01-s03-round5.md:4464:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2050-e01-s03-round5.md:4465:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2050-e01-s03-round5.md:4468:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2050-e01-s03-round5.md:4472:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2050-e01-s03-round5.md:4480:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2050-e01-s03-round5.md:4849:+- On PASS: a `.codex-review-passed` marker file at repo root with `{"commit": "<SHA>"}` JSON pointing at the current HEAD
docs/reviews/codex-20260418-2050-e01-s03-round5.md:4865:+git add .codex-review-passed docs/reviews/
docs/reviews/codex-20260418-2050-e01-s03-round5.md:4883:+Expected: push succeeds; pre-push hook in `customer-app/.claude/settings.json` and `technician-app/.claude/settings.json` PASSES because `.codex-review-passed` exists + matches HEAD. If the hook blocks, re-run `/codex-review-gate` to regenerate the marker.
docs/reviews/codex-20260418-2050-e01-s03-round5.md:4905:+- [ ] `.codex-review-passed` present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-20260418-2050-e01-s03-round5.md:5081:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2050-e01-s03-round5.md:5084:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2059-e01-s03-round6.md:31:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2059-e01-s03-round6.md:37:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2059-e01-s03-round6.md:113:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2059-e01-s03-round6.md:114:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2059-e01-s03-round6.md:117:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2059-e01-s03-round6.md:125:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2059-e01-s03-round6.md:133:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2059-e01-s03-round6.md:155:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2059-e01-s03-round6.md:161:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2059-e01-s03-round6.md:237:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2059-e01-s03-round6.md:238:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2059-e01-s03-round6.md:241:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2059-e01-s03-round6.md:249:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2059-e01-s03-round6.md:257:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2059-e01-s03-round6.md:393:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2059-e01-s03-round6.md:396:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2059-e01-s03-round6.md:2180:+  - [ ] T7.3 Replace the template's naive codex-marker `MARKER == HEAD` check with the **ancestor-check + scope-diff** block copied verbatim from `.github/workflows/api-ship.yml` (allowed-scope: `.codex-review-passed` + `docs/reviews/**` — same as the other two workflows)
docs/reviews/codex-20260418-2059-e01-s03-round6.md:2191:+  - [ ] T9.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-20260418-2059-e01-s03-round6.md:2222:+| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed`; each workflow enforces via ancestor-check + scope-diff |
docs/reviews/codex-20260418-2059-e01-s03-round6.md:2455:+- [Source: `customer-app/.claude/settings.json` + `technician-app/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-20260418-2059-e01-s03-round6.md:2503:+- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-20260418-2059-e01-s03-round6.md:2606:+| A3 | Baseline codex step uses the naive `MARKER_SHA == HEAD_SHA` pattern — the exact chicken-and-egg paradox E01-S01 + E01-S02 already fixed | Replace verbatim with the **ancestor-check + scope-diff** block copied from `.github/workflows/api-ship.yml` (lines 73–98). Allowed scope: `.codex-review-passed` + `docs/reviews/**`. | **T7.3** |
docs/reviews/codex-20260418-2059-e01-s03-round6.md:2608:+| A5 | Baseline `ship.yml` has **no `paths:` filter** — every push/PR on any sub-project triggers both Android workflows, burning CI minutes | Add `paths:` filter on both `pull_request` and `push`: customer-ship.yml → `['customer-app/**', '.github/workflows/customer-ship.yml', '.codex-review-passed']`; technician-ship.yml mirrors. Including `.codex-review-passed` mirrors admin-ship.yml + api-ship.yml precedent so the codex step re-runs when the marker moves. | **T7.2** |
docs/reviews/codex-20260418-2059-e01-s03-round6.md:4394:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2059-e01-s03-round6.md:4400:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2059-e01-s03-round6.md:4476:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2059-e01-s03-round6.md:4477:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2059-e01-s03-round6.md:4480:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2059-e01-s03-round6.md:4484:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2059-e01-s03-round6.md:4492:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2059-e01-s03-round6.md:4861:+- On PASS: a `.codex-review-passed` marker file at repo root with `{"commit": "<SHA>"}` JSON pointing at the current HEAD
docs/reviews/codex-20260418-2059-e01-s03-round6.md:4877:+git add .codex-review-passed docs/reviews/
docs/reviews/codex-20260418-2059-e01-s03-round6.md:4895:+Expected: push succeeds; pre-push hook in `customer-app/.claude/settings.json` and `technician-app/.claude/settings.json` PASSES because `.codex-review-passed` exists + matches HEAD. If the hook blocks, re-run `/codex-review-gate` to regenerate the marker.
docs/reviews/codex-20260418-2059-e01-s03-round6.md:4917:+- [ ] `.codex-review-passed` present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-20260418-2059-e01-s03-round6.md:5093:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2059-e01-s03-round6.md:5096:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:31:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2106-e01-s03-round7.md:37:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2106-e01-s03-round7.md:113:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2106-e01-s03-round7.md:114:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2106-e01-s03-round7.md:117:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:125:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2106-e01-s03-round7.md:133:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:155:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2106-e01-s03-round7.md:161:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2106-e01-s03-round7.md:237:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2106-e01-s03-round7.md:238:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2106-e01-s03-round7.md:241:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:249:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2106-e01-s03-round7.md:257:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:393:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2106-e01-s03-round7.md:396:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:2180:+  - [ ] T7.3 Replace the template's naive codex-marker `MARKER == HEAD` check with the **ancestor-check + scope-diff** block copied verbatim from `.github/workflows/api-ship.yml` (allowed-scope: `.codex-review-passed` + `docs/reviews/**` — same as the other two workflows)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:2191:+  - [ ] T9.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-20260418-2106-e01-s03-round7.md:2222:+| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed`; each workflow enforces via ancestor-check + scope-diff |
docs/reviews/codex-20260418-2106-e01-s03-round7.md:2455:+- [Source: `customer-app/.claude/settings.json` + `technician-app/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-20260418-2106-e01-s03-round7.md:2503:+- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-20260418-2106-e01-s03-round7.md:2606:+| A3 | Baseline codex step uses the naive `MARKER_SHA == HEAD_SHA` pattern — the exact chicken-and-egg paradox E01-S01 + E01-S02 already fixed | Replace verbatim with the **ancestor-check + scope-diff** block copied from `.github/workflows/api-ship.yml` (lines 73–98). Allowed scope: `.codex-review-passed` + `docs/reviews/**`. | **T7.3** |
docs/reviews/codex-20260418-2106-e01-s03-round7.md:2608:+| A5 | Baseline `ship.yml` has **no `paths:` filter** — every push/PR on any sub-project triggers both Android workflows, burning CI minutes | Add `paths:` filter on both `pull_request` and `push`: customer-ship.yml → `['customer-app/**', '.github/workflows/customer-ship.yml', '.codex-review-passed']`; technician-ship.yml mirrors. Including `.codex-review-passed` mirrors admin-ship.yml + api-ship.yml precedent so the codex step re-runs when the marker moves. | **T7.2** |
docs/reviews/codex-20260418-2106-e01-s03-round7.md:4394:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2106-e01-s03-round7.md:4400:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2106-e01-s03-round7.md:4476:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2106-e01-s03-round7.md:4477:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2106-e01-s03-round7.md:4480:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:4484:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2106-e01-s03-round7.md:4492:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:4861:+- On PASS: a `.codex-review-passed` marker file at repo root with `{"commit": "<SHA>"}` JSON pointing at the current HEAD
docs/reviews/codex-20260418-2106-e01-s03-round7.md:4877:+git add .codex-review-passed docs/reviews/
docs/reviews/codex-20260418-2106-e01-s03-round7.md:4895:+Expected: push succeeds; pre-push hook in `customer-app/.claude/settings.json` and `technician-app/.claude/settings.json` PASSES because `.codex-review-passed` exists + matches HEAD. If the hook blocks, re-run `/codex-review-gate` to regenerate the marker.
docs/reviews/codex-20260418-2106-e01-s03-round7.md:4917:+- [ ] `.codex-review-passed` present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-20260418-2106-e01-s03-round7.md:5093:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2106-e01-s03-round7.md:5096:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:7838:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Test-Path .bmad-readiness-passed; Test-Path docs/prd.md; Test-Path docs/architecture.md; Test-Path docs/ux-design.md; Test-Path docs/threat-model.md; Test-Path docs/runbook.md; Test-Path .codex-review-passed' in C:\Alok\Business Projects\Urbanclap-dup
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8146:  - [ ] T7.3 Replace the template's naive codex-marker `MARKER == HEAD` check with the **ancestor-check + scope-diff** block copied verbatim from `.github/workflows/api-ship.yml` (allowed-scope: `.codex-review-passed` + `docs/reviews/**` â€” same as the other two workflows)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8157:  - [ ] T9.3 `/codex-review-gate` â€” **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8188:| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed`; each workflow enforces via ancestor-check + scope-diff |
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8333:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8334:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8337:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8349:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8365:      - '.codex-review-passed'
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8380:      - '.codex-review-passed'
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8458:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8459:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8462:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8473:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8645:9:      - '.codex-review-passed'
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8651:15:      - '.codex-review-passed'
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8727:91:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8728:92:            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8731:95:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8739:103:          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2106-e01-s03-round7.md:8747:111:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:31:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:37:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:113:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:114:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:117:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:125:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:133:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:155:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:161:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:237:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:238:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:241:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:249:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:257:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:393:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:396:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:2184:+  - [ ] T7.3 Replace the template's naive codex-marker `MARKER == HEAD` check with the **ancestor-check + scope-diff** block copied verbatim from `.github/workflows/api-ship.yml` (allowed-scope: `.codex-review-passed` + `docs/reviews/**` — same as the other two workflows)
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:2195:+  - [ ] T9.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:2226:+| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed`; each workflow enforces via ancestor-check + scope-diff |
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:2459:+- [Source: `customer-app/.claude/settings.json` + `technician-app/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:2507:+- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:2610:+| A3 | Baseline codex step uses the naive `MARKER_SHA == HEAD_SHA` pattern — the exact chicken-and-egg paradox E01-S01 + E01-S02 already fixed | Replace verbatim with the **ancestor-check + scope-diff** block copied from `.github/workflows/api-ship.yml` (lines 73–98). Allowed scope: `.codex-review-passed` + `docs/reviews/**`. | **T7.3** |
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:2612:+| A5 | Baseline `ship.yml` has **no `paths:` filter** — every push/PR on any sub-project triggers both Android workflows, burning CI minutes | Add `paths:` filter on both `pull_request` and `push`: customer-ship.yml → `['customer-app/**', '.github/workflows/customer-ship.yml', '.codex-review-passed']`; technician-ship.yml mirrors. Including `.codex-review-passed` mirrors admin-ship.yml + api-ship.yml precedent so the codex step re-runs when the marker moves. | **T7.2** |
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:4398:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:4404:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:4480:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:4481:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:4484:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:4488:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:4496:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:4865:+- On PASS: a `.codex-review-passed` marker file at repo root with `{"commit": "<SHA>"}` JSON pointing at the current HEAD
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:4881:+git add .codex-review-passed docs/reviews/
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:4899:+Expected: push succeeds; pre-push hook in `customer-app/.claude/settings.json` and `technician-app/.claude/settings.json` PASSES because `.codex-review-passed` exists + matches HEAD. If the hook blocks, re-run `/codex-review-gate` to regenerate the marker.
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:4921:+- [ ] `.codex-review-passed` present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:5097:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:5100:-          MARKER=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8290:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8296:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8372:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8373:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8376:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8384:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8392:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8414:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8420:+      - '.codex-review-passed'
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8496:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8497:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8500:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8508:+          # allowed scope (.codex-review-passed or docs/reviews/**) may have
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8516:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-20260418-2115-e01-s03-round8-final.md:8541:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Test-Path .codex-review-passed' in C:\Alok\Business Projects\Urbanclap-dup
docs/reviews/codex-20260425-1735.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-20260425-1735.md:19:--- a/.codex-review-passed
docs/reviews/codex-20260425-1735.md:20:+++ b/.codex-review-passed
docs/reviews/codex-20260425-1735.md:15874:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-20260425-1735.md:15925:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-20260425-1735.md:21174:.codex-review-passed
docs/reviews/codex-20260425-1735.md:23283:  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-20260425-1735.md:23347:- [ ] `.codex-review-passed` marker present
docs/reviews/codex-20260425-1750-round2.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-20260425-1750-round2.md:19:--- a/.codex-review-passed
docs/reviews/codex-20260425-1750-round2.md:20:+++ b/.codex-review-passed
docs/reviews/codex-20260425-1750-round2.md:15930:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-20260425-1750-round2.md:15981:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-20260425-1750-round2.md:21189:.codex-review-passed
docs/reviews/codex-20260425-1750-round2.md:23722:  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-20260425-1750-round2.md:23786:- [ ] `.codex-review-passed` marker present
docs/reviews/codex-20260425-1804-round3.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-20260425-1804-round3.md:19:--- a/.codex-review-passed
docs/reviews/codex-20260425-1804-round3.md:20:+++ b/.codex-review-passed
docs/reviews/codex-20260425-1804-round3.md:16057:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-20260425-1804-round3.md:16108:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-20260425-1804-round3.md:21203: .codex-review-passed                               |    2 +-
docs/reviews/codex-20260425-1812-round4.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-20260425-1812-round4.md:19:--- a/.codex-review-passed
docs/reviews/codex-20260425-1812-round4.md:20:+++ b/.codex-review-passed
docs/reviews/codex-20260425-1812-round4.md:16091:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-20260425-1812-round4.md:16142:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-20260425-1812-round4.md:21228: .codex-review-passed                               |    2 +-
docs/reviews/codex-20260425-1836-round5.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-20260425-1836-round5.md:19:--- a/.codex-review-passed
docs/reviews/codex-20260425-1836-round5.md:20:+++ b/.codex-review-passed
docs/reviews/codex-20260425-1836-round5.md:16141:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-20260425-1836-round5.md:16192:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-20260425-1836-round5.md:21196: .codex-review-passed                               |    2 +-
docs/reviews/codex-20260425-1902-round6.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-20260425-1902-round6.md:19:--- a/.codex-review-passed
docs/reviews/codex-20260425-1902-round6.md:20:+++ b/.codex-review-passed
docs/reviews/codex-20260425-1902-round6.md:16145:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-20260425-1902-round6.md:16196:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-20260425-1902-round6.md:21192: .codex-review-passed                               |    2 +-
docs/reviews/codex-20260425-1919-round7.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-20260425-1919-round7.md:19:--- a/.codex-review-passed
docs/reviews/codex-20260425-1919-round7.md:20:+++ b/.codex-review-passed
docs/reviews/codex-20260425-1919-round7.md:16151:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-20260425-1919-round7.md:16202:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-20260425-1919-round7.md:21192: .codex-review-passed                               |    2 +-
docs/reviews/codex-20260425-1919-round7.md:22999:  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-20260425-1919-round7.md:23063:- [ ] `.codex-review-passed` marker present
docs/reviews/codex-20260425-2035-round8.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-20260425-2035-round8.md:20:--- a/.codex-review-passed
docs/reviews/codex-20260425-2035-round8.md:16193:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-20260425-2035-round8.md:16244:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-20260425-2035-round8.md:21190: .codex-review-passed                               |    1 -
docs/reviews/codex-20260425-2354.md:1624:+  - [ ] `codex review --base main` → `.codex-review-passed`
docs/reviews/codex-20260425-2354.md:1811:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-20260425-2354.md:2738:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-20260426-0953.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-20260426-0953.md:19:--- a/.codex-review-passed
docs/reviews/codex-20260426-0953.md:20:+++ b/.codex-review-passed
docs/reviews/codex-20260426-0953.md:24:diff --git a/.codex-review-passed-manual b/.codex-review-passed-manual
docs/reviews/codex-20260426-0953.md:28:+++ b/.codex-review-passed-manual
docs/reviews/codex-20260426-0953.md:37:+  "instructions": "Re-run codex review --base main and replace this file with .codex-review-passed when Codex quota resets."
docs/reviews/codex-20260426-0953.md:1710:+  - [ ] `codex review --base main` → `.codex-review-passed`
docs/reviews/codex-20260426-0953.md:1897:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-20260426-0953.md:2824:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-20260426-0953.md:3069:.codex-review-passed
docs/reviews/codex-20260426-0953.md:3070:.codex-review-passed-manual
docs/reviews/codex-20260429-1622.md:548:-a----         4/29/2026   4:14 PM            225 .codex-review-passed                                                 
docs/reviews/codex-20260429-1622.md:549:-a----         4/29/2026   4:14 PM           1400 .codex-review-passed-manual                                          
docs/reviews/codex-E01-S01-20260417-2346.md:86:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S01-20260417-2346.md:87:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S01-20260417-2346.md:90:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S01-20260417-2346.md:93:+            echo "::error::.codex-review-passed commit ($MARKER_SHA) does not match HEAD ($HEAD_SHA) — rerun /codex-review-gate"
docs/reviews/codex-E01-S01-20260417-2346.md:189:-          [ -f .codex-review-passed ] && [ "$(jq -r .commit .codex-review-passed)" = "$(git rev-parse HEAD)" ] || { echo "::warning::run /codex-review-gate"; }
docs/reviews/codex-E01-S01-20260417-2346.md:7023:2026-04-18T03:47:33.479687Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git status --short; git ls-files .codex-review-passed; git check-ignore -v .codex-review-passed'` rejected: blocked by policy
docs/reviews/codex-E01-S01-20260417-2346.md:7025:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git status --short; git ls-files .codex-review-passed; git check-ignore -v .codex-review-passed' in C:\Alok\Business Projects\Urbanclap-dup
docs/reviews/codex-E01-S01-20260417-2346.md:7027:`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git status --short; git ls-files .codex-review-passed; git check-ignore -v .codex-review-passed'` rejected: blocked by policy
docs/reviews/codex-E01-S01-20260417-2346.md:7034:2026-04-18T03:47:39.688723Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git ls-files .codex-review-passed'` rejected: blocked by policy
docs/reviews/codex-E01-S01-20260417-2346.md:7036:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git ls-files .codex-review-passed' in C:\Alok\Business Projects\Urbanclap-dup
docs/reviews/codex-E01-S01-20260417-2346.md:7038:`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git ls-files .codex-review-passed'` rejected: blocked by policy
docs/reviews/codex-E01-S01-20260417-2346.md:7146:64:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S01-20260417-2346.md:7147:65:            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S01-20260417-2346.md:7150:68:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S01-20260417-2346.md:7153:71:            echo "::error::.codex-review-passed commit ($MARKER_SHA) does not match HEAD ($HEAD_SHA) — rerun /codex-review-gate"
docs/reviews/codex-E01-S01-20260417-2346.md:7244:| D4 | `ship.yml` codex-marker step is a warning, not an error â€” contradicts CLAUDE.md "CI is the real gate" | Change `echo "::warning::â€¦"` to `echo "::error::â€¦"; exit 1` on missing/mismatched `.codex-review-passed`. | **T8** (extend T8.4) |
docs/reviews/codex-E01-S01-20260417-2346.md:7402:  On every `pull_request` touching `api/**`, this step fails in a clean Actions checkout: `.codex-review-passed` is not produced by any earlier step, and committing a marker containing the current `HEAD` SHA changes `HEAD`, so the later SHA comparison cannot reliably match. This makes the new API workflow impossible to satisfy rather than an enforceable gate.
docs/reviews/codex-E01-S01-20260417-2346.md:7411:  On every `pull_request` touching `api/**`, this step fails in a clean Actions checkout: `.codex-review-passed` is not produced by any earlier step, and committing a marker containing the current `HEAD` SHA changes `HEAD`, so the later SHA comparison cannot reliably match. This makes the new API workflow impossible to satisfy rather than an enforceable gate.
docs/reviews/codex-E01-S01-20260417-2352-round2.md:86:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S01-20260417-2352-round2.md:87:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S01-20260417-2352-round2.md:90:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S01-20260417-2352-round2.md:102:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S01-20260417-2352-round2.md:202:-          [ -f .codex-review-passed ] && [ "$(jq -r .commit .codex-review-passed)" = "$(git rev-parse HEAD)" ] || { echo "::warning::run /codex-review-gate"; }
docs/reviews/codex-E01-S01-20260417-2352-round2.md:7149:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Test-Path docs\\prd.md; Test-Path docs\\architecture.md; Test-Path docs\\threat-model.md; Test-Path docs\\runbook.md; Test-Path .bmad-readiness-passed; Test-Path .codex-review-passed" in C:\Alok\Business Projects\Urbanclap-dup
docs/reviews/codex-E01-S01-20260417-2352-round2.md:7224:64:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S01-20260417-2352-round2.md:7225:65:            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S01-20260417-2352-round2.md:7228:68:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S01-20260417-2352-round2.md:7240:80:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S01-20260417-2352-round2.md:7255:  For pull requests that touch `api/**`, this newly active workflow now exits with an error when `.codex-review-passed` is absent, but this patch does not add that marker. As a result, the PR quality gate fails unconditionally at this step before the code can merge; either commit the generated marker with the change or make the gate non-fatal until the marker workflow is in place.
docs/reviews/codex-E01-S01-20260417-2352-round2.md:7261:  For pull requests that touch `api/**`, this newly active workflow now exits with an error when `.codex-review-passed` is absent, but this patch does not add that marker. As a result, the PR quality gate fails unconditionally at this step before the code can merge; either commit the generated marker with the change or make the gate non-fatal until the marker workflow is in place.
docs/reviews/codex-E01-S02-20260418-0811.md:95:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0811.md:96:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0811.md:99:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0811.md:110:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0811.md:331:-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0811.md:333:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0811.md:334:-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0811.md:337:-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0811.md:526:+- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0811.md:12960:+  - [ ] T10.6 Replace the codex-review-marker step with the **ancestor-check + scope-diff** pattern from `.github/workflows/api-ship.yml` (verbatim adaptation — marker SHA must be ancestor of HEAD; diff since marker limited to `.codex-review-passed` + `docs/reviews/`)
docs/reviews/codex-E01-S02-20260418-0811.md:12966:+  - [ ] T11.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S02-20260418-0811.md:12993:+| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` marker validated by the CI workflow's ancestor-check. |
docs/reviews/codex-E01-S02-20260418-0811.md:13175:+- [Source: `admin-web/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-E01-S02-20260418-0811.md:13217:+- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-E01-S02-20260418-0811.md:14552:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0811.md:14553:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0811.md:14556:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0811.md:14567:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0818-round2.md:95:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0818-round2.md:96:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0818-round2.md:99:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0818-round2.md:110:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0818-round2.md:331:-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0818-round2.md:333:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0818-round2.md:334:-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0818-round2.md:337:-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0818-round2.md:526:+- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0818-round2.md:12867:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0818-round2.md:12868:++            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0818-round2.md:12871:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0818-round2.md:12882:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0818-round2.md:13103:+-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0818-round2.md:13105:+-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0818-round2.md:13106:+-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0818-round2.md:13109:+-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0818-round2.md:13298:++- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0818-round2.md:25732:++  - [ ] T10.6 Replace the codex-review-marker step with the **ancestor-check + scope-diff** pattern from `.github/workflows/api-ship.yml` (verbatim adaptation — marker SHA must be ancestor of HEAD; diff since marker limited to `.codex-review-passed` + `docs/reviews/`)
docs/reviews/codex-E01-S02-20260418-0818-round2.md:25738:++  - [ ] T11.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S02-20260418-0818-round2.md:25765:++| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` marker validated by the CI workflow's ancestor-check. |
docs/reviews/codex-E01-S02-20260418-0818-round2.md:25947:++- [Source: `admin-web/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-E01-S02-20260418-0818-round2.md:25989:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-E01-S02-20260418-0818-round2.md:27324:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0818-round2.md:27325:++            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0818-round2.md:27328:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0818-round2.md:27339:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0818-round2.md:29220:2026-04-18T12:19:54.289048Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Name docs; Get-ChildItem -Name docs\\adr; Get-ChildItem -Name docs\\stories; if (Test-Path .bmad-readiness-passed) { 'marker yes' } else { 'marker no' }; if (Test-Path .codex-review-passed) { Get-Content .codex-review-passed } else {'codex marker no'}"` rejected: blocked by policy
docs/reviews/codex-E01-S02-20260418-0818-round2.md:29222:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Name docs; Get-ChildItem -Name docs\\adr; Get-ChildItem -Name docs\\stories; if (Test-Path .bmad-readiness-passed) { 'marker yes' } else { 'marker no' }; if (Test-Path .codex-review-passed) { Get-Content .codex-review-passed } else {'codex marker no'}" in C:\Alok\Business Projects\Urbanclap-dup
docs/reviews/codex-E01-S02-20260418-0818-round2.md:29224:`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Name docs; Get-ChildItem -Name docs\\adr; Get-ChildItem -Name docs\\stories; if (Test-Path .bmad-readiness-passed) { 'marker yes' } else { 'marker no' }; if (Test-Path .codex-review-passed) { Get-Content .codex-review-passed } else {'codex marker no'}"` rejected: blocked by policy
docs/reviews/codex-E01-S02-20260418-0818-round2.md:29243:2026-04-18T12:20:00.683043Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem docs\\adr | Select-Object -ExpandProperty Name; Get-ChildItem docs\\stories | Select-Object -ExpandProperty Name; Get-ChildItem -Force | Where-Object Name -eq '.bmad-readiness-passed' | Select-Object -ExpandProperty Name; Get-ChildItem -Force | Where-Object Name -eq '.codex-review-passed' | Select-Object -ExpandProperty Name"` rejected: blocked by policy
docs/reviews/codex-E01-S02-20260418-0818-round2.md:29245:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem docs\\adr | Select-Object -ExpandProperty Name; Get-ChildItem docs\\stories | Select-Object -ExpandProperty Name; Get-ChildItem -Force | Where-Object Name -eq '.bmad-readiness-passed' | Select-Object -ExpandProperty Name; Get-ChildItem -Force | Where-Object Name -eq '.codex-review-passed' | Select-Object -ExpandProperty Name" in C:\Alok\Business Projects\Urbanclap-dup
docs/reviews/codex-E01-S02-20260418-0818-round2.md:29247:`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem docs\\adr | Select-Object -ExpandProperty Name; Get-ChildItem docs\\stories | Select-Object -ExpandProperty Name; Get-ChildItem -Force | Where-Object Name -eq '.bmad-readiness-passed' | Select-Object -ExpandProperty Name; Get-ChildItem -Force | Where-Object Name -eq '.codex-review-passed' | Select-Object -ExpandProperty Name"` rejected: blocked by policy
docs/reviews/codex-E01-S02-20260418-0832-round3.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0832-round3.md:19:--- a/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0832-round3.md:20:+++ b/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0832-round3.md:102:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0832-round3.md:103:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0832-round3.md:106:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:117:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:338:-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0832-round3.md:340:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0832-round3.md:341:-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0832-round3.md:344:-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:533:+- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0832-round3.md:12879:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0832-round3.md:12880:++            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0832-round3.md:12883:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:12894:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:13115:+-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0832-round3.md:13117:+-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0832-round3.md:13118:+-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0832-round3.md:13121:+-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:13310:++- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0832-round3.md:25744:++  - [ ] T10.6 Replace the codex-review-marker step with the **ancestor-check + scope-diff** pattern from `.github/workflows/api-ship.yml` (verbatim adaptation — marker SHA must be ancestor of HEAD; diff since marker limited to `.codex-review-passed` + `docs/reviews/`)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:25750:++  - [ ] T11.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S02-20260418-0832-round3.md:25777:++| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` marker validated by the CI workflow's ancestor-check. |
docs/reviews/codex-E01-S02-20260418-0832-round3.md:25959:++- [Source: `admin-web/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-E01-S02-20260418-0832-round3.md:26001:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-E01-S02-20260418-0832-round3.md:27336:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0832-round3.md:27337:++            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0832-round3.md:27340:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:27351:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:28328:M	.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0832-round3.md:42837:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0832-round3.md:42838:+            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0832-round3.md:42841:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:42852:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:43073:-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0832-round3.md:43075:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0832-round3.md:43076:-            echo "::warning::No .codex-review-passed marker â€” author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0832-round3.md:43079:-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:43268:+- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0832-round3.md:55609:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0832-round3.md:55610:++            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0832-round3.md:55613:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:55624:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:55845:+-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0832-round3.md:55847:+-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0832-round3.md:55848:+-            echo "::warning::No .codex-review-passed marker â€” author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0832-round3.md:55851:+-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:56040:++- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0832-round3.md:68474:++  - [ ] T10.6 Replace the codex-review-marker step with the **ancestor-check + scope-diff** pattern from `.github/workflows/api-ship.yml` (verbatim adaptation â€” marker SHA must be ancestor of HEAD; diff since marker limited to `.codex-review-passed` + `docs/reviews/`)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:68480:++  - [ ] T11.3 `/codex-review-gate` â€” **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S02-20260418-0832-round3.md:68507:++| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` marker validated by the CI workflow's ancestor-check. |
docs/reviews/codex-E01-S02-20260418-0832-round3.md:68689:++- [Source: `admin-web/.claude/settings.json` â€” pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-E01-S02-20260418-0832-round3.md:68731:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-E01-S02-20260418-0832-round3.md:70066:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0832-round3.md:70067:++            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0832-round3.md:70070:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:70081:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0832-round3.md:75450:2026-04-18T12:36:50.556938Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git rev-parse HEAD; Get-Content -Raw .codex-review-passed'` rejected: blocked by policy
docs/reviews/codex-E01-S02-20260418-0832-round3.md:75452:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git rev-parse HEAD; Get-Content -Raw .codex-review-passed' in C:\Alok\Business Projects\Urbanclap-dup
docs/reviews/codex-E01-S02-20260418-0832-round3.md:75454:`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git rev-parse HEAD; Get-Content -Raw .codex-review-passed'` rejected: blocked by policy
docs/reviews/codex-E01-S02-20260418-0838-round4.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0838-round4.md:19:--- a/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0838-round4.md:20:+++ b/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0838-round4.md:102:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0838-round4.md:103:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0838-round4.md:106:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0838-round4.md:117:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0838-round4.md:338:-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0838-round4.md:340:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0838-round4.md:341:-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0838-round4.md:344:-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0838-round4.md:533:+- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0838-round4.md:12879:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0838-round4.md:12880:++            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0838-round4.md:12883:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0838-round4.md:12894:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0838-round4.md:13115:+-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0838-round4.md:13117:+-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0838-round4.md:13118:+-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0838-round4.md:13121:+-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0838-round4.md:13310:++- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0838-round4.md:25744:++  - [ ] T10.6 Replace the codex-review-marker step with the **ancestor-check + scope-diff** pattern from `.github/workflows/api-ship.yml` (verbatim adaptation — marker SHA must be ancestor of HEAD; diff since marker limited to `.codex-review-passed` + `docs/reviews/`)
docs/reviews/codex-E01-S02-20260418-0838-round4.md:25750:++  - [ ] T11.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S02-20260418-0838-round4.md:25777:++| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` marker validated by the CI workflow's ancestor-check. |
docs/reviews/codex-E01-S02-20260418-0838-round4.md:25959:++- [Source: `admin-web/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-E01-S02-20260418-0838-round4.md:26001:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-E01-S02-20260418-0838-round4.md:27336:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0838-round4.md:27337:++            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0838-round4.md:27340:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0838-round4.md:27351:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0838-round4.md:28328:M	.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0838-round4.md:31982:73:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0838-round4.md:31983:74:            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0838-round4.md:31986:77:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0838-round4.md:31997:88:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0904-round5.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0904-round5.md:19:--- a/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0904-round5.md:20:+++ b/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0904-round5.md:102:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0904-round5.md:103:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0904-round5.md:106:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0904-round5.md:117:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0904-round5.md:338:-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0904-round5.md:340:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0904-round5.md:341:-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0904-round5.md:344:-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0904-round5.md:533:+- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0904-round5.md:12833:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0904-round5.md:12834:++            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0904-round5.md:12837:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0904-round5.md:12848:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0904-round5.md:13069:+-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0904-round5.md:13071:+-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0904-round5.md:13072:+-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0904-round5.md:13075:+-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0904-round5.md:13264:++- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0904-round5.md:25698:++  - [ ] T10.6 Replace the codex-review-marker step with the **ancestor-check + scope-diff** pattern from `.github/workflows/api-ship.yml` (verbatim adaptation — marker SHA must be ancestor of HEAD; diff since marker limited to `.codex-review-passed` + `docs/reviews/`)
docs/reviews/codex-E01-S02-20260418-0904-round5.md:25704:++  - [ ] T11.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S02-20260418-0904-round5.md:25731:++| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` marker validated by the CI workflow's ancestor-check. |
docs/reviews/codex-E01-S02-20260418-0904-round5.md:25913:++- [Source: `admin-web/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-E01-S02-20260418-0904-round5.md:25955:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-E01-S02-20260418-0904-round5.md:27290:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0904-round5.md:27291:++            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0904-round5.md:27294:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0904-round5.md:27305:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0904-round5.md:28285:M	.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0928-round6.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0928-round6.md:19:--- a/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0928-round6.md:20:+++ b/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0928-round6.md:101:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0928-round6.md:102:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0928-round6.md:105:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0928-round6.md:116:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0928-round6.md:337:-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0928-round6.md:339:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0928-round6.md:340:-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0928-round6.md:343:-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0928-round6.md:532:+- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0928-round6.md:12832:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0928-round6.md:12833:++            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0928-round6.md:12836:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0928-round6.md:12847:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0928-round6.md:13068:+-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0928-round6.md:13070:+-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0928-round6.md:13071:+-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0928-round6.md:13074:+-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0928-round6.md:13263:++- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0928-round6.md:25697:++  - [ ] T10.6 Replace the codex-review-marker step with the **ancestor-check + scope-diff** pattern from `.github/workflows/api-ship.yml` (verbatim adaptation — marker SHA must be ancestor of HEAD; diff since marker limited to `.codex-review-passed` + `docs/reviews/`)
docs/reviews/codex-E01-S02-20260418-0928-round6.md:25703:++  - [ ] T11.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S02-20260418-0928-round6.md:25730:++| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` marker validated by the CI workflow's ancestor-check. |
docs/reviews/codex-E01-S02-20260418-0928-round6.md:25912:++- [Source: `admin-web/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-E01-S02-20260418-0928-round6.md:25954:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-E01-S02-20260418-0928-round6.md:27289:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0928-round6.md:27290:++            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0928-round6.md:27293:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0928-round6.md:27304:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0928-round6.md:28283: .codex-review-passed                               |     2 +-
docs/reviews/codex-E01-S02-20260418-0928-round6.md:29231:72:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0928-round6.md:29232:73:            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0928-round6.md:29235:76:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0928-round6.md:29246:87:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0928-round6.md:29288:2026-04-18T13:30:55.007048Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git rev-parse HEAD; type .codex-review-passed'` rejected: blocked by policy
docs/reviews/codex-E01-S02-20260418-0928-round6.md:29290:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git rev-parse HEAD; type .codex-review-passed' in C:\Alok\Business Projects\Urbanclap-dup
docs/reviews/codex-E01-S02-20260418-0928-round6.md:29292:`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git rev-parse HEAD; type .codex-review-passed'` rejected: blocked by policy
docs/reviews/codex-E01-S02-20260418-0928-round6.md:29446:  When the expected final Codex review commit changes only `.codex-review-passed` and `docs/reviews/*`, this workflow will not run because the PR `paths` filter only includes `admin-web/**` and the workflow file. That prevents the authoritative marker gate from rerunning on the marker commit (or leaves the required check absent/stale), so a PR that previously failed for a missing marker cannot be validated by committing the marker. Include the marker/review paths in the filter or remove the filter for pull requests.
docs/reviews/codex-E01-S02-20260418-0928-round6.md:29452:  When the expected final Codex review commit changes only `.codex-review-passed` and `docs/reviews/*`, this workflow will not run because the PR `paths` filter only includes `admin-web/**` and the workflow file. That prevents the authoritative marker gate from rerunning on the marker commit (or leaves the required check absent/stale), so a PR that previously failed for a missing marker cannot be validated by committing the marker. Include the marker/review paths in the filter or remove the filter for pull requests.
docs/reviews/codex-E01-S02-20260418-0934-round7.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0934-round7.md:19:--- a/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0934-round7.md:20:+++ b/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0934-round7.md:38:+      - '.codex-review-passed'
docs/reviews/codex-E01-S02-20260418-0934-round7.md:45:+      - '.codex-review-passed'
docs/reviews/codex-E01-S02-20260418-0934-round7.md:105:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0934-round7.md:106:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0934-round7.md:109:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0934-round7.md:120:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0934-round7.md:341:-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0934-round7.md:343:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0934-round7.md:344:-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0934-round7.md:347:-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0934-round7.md:536:+- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0934-round7.md:12836:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0934-round7.md:12837:++            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0934-round7.md:12840:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0934-round7.md:12851:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0934-round7.md:13072:+-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-0934-round7.md:13074:+-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0934-round7.md:13075:+-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-0934-round7.md:13078:+-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0934-round7.md:13267:++- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-0934-round7.md:25701:++  - [ ] T10.6 Replace the codex-review-marker step with the **ancestor-check + scope-diff** pattern from `.github/workflows/api-ship.yml` (verbatim adaptation — marker SHA must be ancestor of HEAD; diff since marker limited to `.codex-review-passed` + `docs/reviews/`)
docs/reviews/codex-E01-S02-20260418-0934-round7.md:25707:++  - [ ] T11.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S02-20260418-0934-round7.md:25734:++| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` marker validated by the CI workflow's ancestor-check. |
docs/reviews/codex-E01-S02-20260418-0934-round7.md:25916:++- [Source: `admin-web/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-E01-S02-20260418-0934-round7.md:25958:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-E01-S02-20260418-0934-round7.md:27293:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0934-round7.md:27294:++            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0934-round7.md:27297:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0934-round7.md:27308:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0934-round7.md:28286:M	.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0934-round7.md:42931:  - [ ] T10.6 Replace the codex-review-marker step with the **ancestor-check + scope-diff** pattern from `.github/workflows/api-ship.yml` (verbatim adaptation â€” marker SHA must be ancestor of HEAD; diff since marker limited to `.codex-review-passed` + `docs/reviews/`)
docs/reviews/codex-E01-S02-20260418-0934-round7.md:42937:  - [ ] T11.3 `/codex-review-gate` â€” **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S02-20260418-0934-round7.md:42964:| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` marker validated by the CI workflow's ancestor-check. |
docs/reviews/codex-E01-S02-20260418-0934-round7.md:43146:- [Source: `admin-web/.claude/settings.json` â€” pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-E01-S02-20260418-0934-round7.md:43188:- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-E01-S02-20260418-0934-round7.md:43823:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0934-round7.md:43825:--- a/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0934-round7.md:43826:+++ b/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0934-round7.md:43908:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-0934-round7.md:43909:+            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-0934-round7.md:43912:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-0934-round7.md:43923:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-0934-round7.md:44078:            "command": "bash -c 'if [ -n \"$CLAUDE_OVERRIDE_REASON\" ]; then echo \"{\\\"ts\\\":\\\"$(date -Iseconds)\\\",\\\"reason\\\":\\\"$CLAUDE_OVERRIDE_REASON\\\",\\\"hook\\\":\\\"codex-gate\\\"}\" >> ~/.claude/override-log.jsonl; exit 0; fi; if [ ! -f .codex-review-passed ]; then echo \"{\\\"decision\\\":\\\"block\\\",\\\"reason\\\":\\\"No .codex-review-passed marker. Run /codex-review-gate before push.\\\"}\"; exit 0; fi; MARKER=$(jq -r .commit .codex-review-passed 2>/dev/null); HEAD=$(git rev-parse HEAD); if [ \"$MARKER\" != \"$HEAD\" ]; then echo \"{\\\"decision\\\":\\\"block\\\",\\\"reason\\\":\\\"Codex review marker is stale (marker=$MARKER head=$HEAD). Re-run /codex-review-gate.\\\"}\"; fi'",
docs/reviews/codex-E01-S02-20260418-0934-round7.md:44128:            "command": "bash -c 'if [ -n \"$CLAUDE_OVERRIDE_REASON\" ]; then echo \"{\\\"ts\\\":\\\"$(date -Iseconds)\\\",\\\"reason\\\":\\\"$CLAUDE_OVERRIDE_REASON\\\",\\\"hook\\\":\\\"codex-gate\\\"}\" >> ~/.claude/override-log.jsonl; exit 0; fi; if [ ! -f .codex-review-passed ]; then echo \"{\\\"decision\\\":\\\"block\\\",\\\"reason\\\":\\\"No .codex-review-passed marker. Run /codex-review-gate before push.\\\"}\"; exit 0; fi; MARKER=$(jq -r .commit .codex-review-passed 2>/dev/null); HEAD=$(git rev-parse HEAD); if [ \"$MARKER\" != \"$HEAD\" ]; then echo \"{\\\"decision\\\":\\\"block\\\",\\\"reason\\\":\\\"Codex review marker is stale (marker=$MARKER head=$HEAD). Re-run /codex-review-gate.\\\"}\"; fi'",
docs/reviews/codex-E01-S02-20260418-0934-round7.md:44140:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Raw .codex-review-passed' in C:\Alok\Business Projects\Urbanclap-dup
docs/reviews/codex-E01-S02-20260418-0934-round7.md:44148:.codex-review-passed
docs/reviews/codex-E01-S02-20260418-0934-round7.md:44158:- [P1] Refresh the Codex marker after workflow changes — C:\Alok\Business Projects\Urbanclap-dup\.codex-review-passed:1-1
docs/reviews/codex-E01-S02-20260418-0934-round7.md:44159:  When the PR workflow reaches the `codex review marker` step, this marker will fail its own scope-diff check: `git diff --name-only 38ee704170a19c579894c41e54fd65bc8dead803` includes `.github/workflows/admin-ship.yml`, which is outside the allowed `.codex-review-passed|docs/reviews/` set. Re-run the review gate after the latest workflow edit so the marker commit is an ancestor with only marker/review-log changes after it.
docs/reviews/codex-E01-S02-20260418-0934-round7.md:44164:- [P1] Refresh the Codex marker after workflow changes — C:\Alok\Business Projects\Urbanclap-dup\.codex-review-passed:1-1
docs/reviews/codex-E01-S02-20260418-0934-round7.md:44165:  When the PR workflow reaches the `codex review marker` step, this marker will fail its own scope-diff check: `git diff --name-only 38ee704170a19c579894c41e54fd65bc8dead803` includes `.github/workflows/admin-ship.yml`, which is outside the allowed `.codex-review-passed|docs/reviews/` set. Re-run the review gate after the latest workflow edit so the marker commit is an ancestor with only marker/review-log changes after it.
docs/reviews/codex-E01-S02-20260418-1012-round8.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-1012-round8.md:19:--- a/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-1012-round8.md:20:+++ b/.codex-review-passed
docs/reviews/codex-E01-S02-20260418-1012-round8.md:38:+      - '.codex-review-passed'
docs/reviews/codex-E01-S02-20260418-1012-round8.md:45:+      - '.codex-review-passed'
docs/reviews/codex-E01-S02-20260418-1012-round8.md:105:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-1012-round8.md:106:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-1012-round8.md:109:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-1012-round8.md:120:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-1012-round8.md:341:-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-1012-round8.md:343:-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-1012-round8.md:344:-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-1012-round8.md:347:-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-1012-round8.md:536:+- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-1012-round8.md:12840:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-1012-round8.md:12841:++            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-1012-round8.md:12844:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-1012-round8.md:12855:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-1012-round8.md:13076:+-      - name: verify .codex-review-passed matches HEAD
docs/reviews/codex-E01-S02-20260418-1012-round8.md:13078:+-          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-1012-round8.md:13079:+-            echo "::warning::No .codex-review-passed marker — author must run /codex-review-gate locally before merge."
docs/reviews/codex-E01-S02-20260418-1012-round8.md:13082:+-          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-1012-round8.md:13271:++- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S02-20260418-1012-round8.md:25705:++  - [ ] T10.6 Replace the codex-review-marker step with the **ancestor-check + scope-diff** pattern from `.github/workflows/api-ship.yml` (verbatim adaptation — marker SHA must be ancestor of HEAD; diff since marker limited to `.codex-review-passed` + `docs/reviews/`)
docs/reviews/codex-E01-S02-20260418-1012-round8.md:25711:++  - [ ] T11.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S02-20260418-1012-round8.md:25738:++| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` marker validated by the CI workflow's ancestor-check. |
docs/reviews/codex-E01-S02-20260418-1012-round8.md:25920:++- [Source: `admin-web/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/reviews/codex-E01-S02-20260418-1012-round8.md:25962:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/reviews/codex-E01-S02-20260418-1012-round8.md:27297:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-1012-round8.md:27298:++            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-1012-round8.md:27301:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-1012-round8.md:27312:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-1012-round8.md:28290: .codex-review-passed                               |     2 +-
docs/reviews/codex-E01-S02-20260418-1012-round8.md:29030:+      - '.codex-review-passed'
docs/reviews/codex-E01-S02-20260418-1012-round8.md:29037:+      - '.codex-review-passed'
docs/reviews/codex-E01-S02-20260418-1012-round8.md:29097:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S02-20260418-1012-round8.md:29098:+            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S02-20260418-1012-round8.md:29101:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S02-20260418-1012-round8.md:29112:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S02-20260418-1012-round8.md:29617:M	.codex-review-passed
docs/reviews/codex-E01-S02-20260418-1012-round8.md:30057:2026-04-18T14:15:10.541973Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git rev-parse HEAD; Get-Content .codex-review-passed'` rejected: blocked by policy
docs/reviews/codex-E01-S02-20260418-1012-round8.md:30059:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git rev-parse HEAD; Get-Content .codex-review-passed' in C:\Alok\Business Projects\Urbanclap-dup
docs/reviews/codex-E01-S02-20260418-1012-round8.md:30061:`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git rev-parse HEAD; Get-Content .codex-review-passed'` rejected: blocked by policy
docs/reviews/codex-E01-S02-20260418-1012-round8.md:30068:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Path '.codex-review-passed'" in C:\Alok\Business Projects\Urbanclap-dup
docs/reviews/codex-E01-S02-20260418-1012-round8.md:30109:.codex-review-passed
docs/reviews/codex-E01-S02-20260418-1012-round8.md:30160:- [P1] Refresh stale Codex marker before merging — C:\Alok\Business Projects\Urbanclap-dup\.codex-review-passed:1-1
docs/reviews/codex-E01-S02-20260418-1012-round8.md:30161:  With this marker pinned to `b8ef98d...`, the new `admin-ship` CI gate will diff from that SHA to HEAD and reject any file outside `.codex-review-passed` or `docs/reviews/`; this branch has a later change to `admin-web/tests/landing.page.test.tsx`, so PR CI will fail with `files outside Codex review scope changed since marker`. Rerun the review gate/update the marker after the final code/test change so the recorded commit covers the current HEAD.
docs/reviews/codex-E01-S02-20260418-1012-round8.md:30166:- [P1] Refresh stale Codex marker before merging — C:\Alok\Business Projects\Urbanclap-dup\.codex-review-passed:1-1
docs/reviews/codex-E01-S02-20260418-1012-round8.md:30167:  With this marker pinned to `b8ef98d...`, the new `admin-ship` CI gate will diff from that SHA to HEAD and reject any file outside `.codex-review-passed` or `docs/reviews/`; this branch has a later change to `admin-web/tests/landing.page.test.tsx`, so PR CI will fail with `files outside Codex review scope changed since marker`. Rerun the review gate/update the marker after the final code/test change so the recorded commit covers the current HEAD.
docs/reviews/codex-E01-S06-20260418-1227.md:23:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1227.md:31:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1227.md:114: - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1227.md:4499:+- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1227.md:4500:+- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1227.md:4589:+  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1227.md:4604:+  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1227.md:4645:+| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1227.md:4743:+2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1227.md:4859:+- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1227.md:6184:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1227.md:6192:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1227.md:6349:+- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1227.md:7178:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1227.md:7186:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1227.md:7255:           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1227.md:7256:             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1227.md:7259:           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1227.md:7270:             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1227.md:7400:           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1227.md:7401:             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1227.md:7404:           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1227.md:7416:             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1227.md:7803:.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1227.md:8192:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1227.md:8200:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1227.md:8269:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1227.md:8270:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1227.md:8273:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1227.md:8284:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1233-round2.md:23:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1233-round2.md:31:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1233-round2.md:117: - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1233-round2.md:4409:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1233-round2.md:4417:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1233-round2.md:4500:+ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1233-round2.md:8885:++- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1233-round2.md:8886:++- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1233-round2.md:8975:++  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1233-round2.md:8990:++  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1233-round2.md:9031:++| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1233-round2.md:9129:++2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1233-round2.md:9245:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1233-round2.md:10570:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1233-round2.md:10578:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1233-round2.md:10735:++- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1233-round2.md:11564:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1233-round2.md:11572:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1233-round2.md:11641:+           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1233-round2.md:11642:+             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1233-round2.md:11645:+           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1233-round2.md:11656:+             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1233-round2.md:11786:+           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1233-round2.md:11787:+             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1233-round2.md:11790:+           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1233-round2.md:11802:+             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1233-round2.md:12189:+.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1233-round2.md:12578:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1233-round2.md:12586:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1233-round2.md:12655:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1233-round2.md:12656:+            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1233-round2.md:12659:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1233-round2.md:12670:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1233-round2.md:13252:+- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1233-round2.md:13253:+- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1233-round2.md:13342:+  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1233-round2.md:13357:+  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1233-round2.md:13398:+| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1233-round2.md:13496:+2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1233-round2.md:13612:+- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1233-round2.md:14937:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1233-round2.md:14945:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1233-round2.md:15102:+- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1233-round2.md:15813:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1233-round2.md:15821:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1233-round2.md:15890:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1233-round2.md:15891:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1233-round2.md:15894:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1233-round2.md:15905:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1233-round2.md:16034:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1233-round2.md:16035:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1233-round2.md:16038:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1233-round2.md:16050:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:23:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:31:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:117: - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1237-round3.md:4424:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:4432:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:4515:+ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1237-round3.md:8900:++- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1237-round3.md:8901:++- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1237-round3.md:8990:++  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:9005:++  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1237-round3.md:9046:++| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1237-round3.md:9144:++2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1237-round3.md:9260:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1237-round3.md:10585:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:10593:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:10750:++- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1237-round3.md:11579:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:11587:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:11656:+           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1237-round3.md:11657:+             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1237-round3.md:11660:+           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:11671:+             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:11801:+           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1237-round3.md:11802:+             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1237-round3.md:11805:+           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:11817:+             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:12204:+.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1237-round3.md:12593:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:12601:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:12670:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1237-round3.md:12671:+            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1237-round3.md:12674:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:12685:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:13174:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:13182:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:13268:+ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1237-round3.md:17560:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:17568:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:17651:++ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1237-round3.md:22036:+++- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1237-round3.md:22037:+++- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1237-round3.md:22126:+++  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:22141:+++  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1237-round3.md:22182:+++| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1237-round3.md:22280:+++2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1237-round3.md:22396:+++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1237-round3.md:23721:+++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:23729:+++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:23886:+++- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1237-round3.md:24715:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:24723:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:24792:++           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1237-round3.md:24793:++             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1237-round3.md:24796:++           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:24807:++             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:24937:++           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1237-round3.md:24938:++             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1237-round3.md:24941:++           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:24953:++             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:25340:++.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1237-round3.md:25729:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:25737:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:25806:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1237-round3.md:25807:++            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1237-round3.md:25810:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:25821:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:27295:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:27303:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:27372:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1237-round3.md:27373:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1237-round3.md:27376:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:27451:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1237-round3.md:27452:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1237-round3.md:27455:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1237-round3.md:27906:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1237-round3.md:27914:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1255-round4.md:19:--- a/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1255-round4.md:20:+++ b/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1255-round4.md:57:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:65:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:151: - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1255-round4.md:4529:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:4537:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:4620:+ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1255-round4.md:9005:++- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1255-round4.md:9006:++- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1255-round4.md:9095:++  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:9110:++  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1255-round4.md:9151:++| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1255-round4.md:9249:++2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1255-round4.md:9365:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1255-round4.md:10690:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:10698:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:10855:++- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1255-round4.md:11684:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:11692:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:11761:+           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1255-round4.md:11762:+             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1255-round4.md:11765:+           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:11776:+             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:11906:+           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1255-round4.md:11907:+             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1255-round4.md:11910:+           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:11922:+             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:12309:+.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1255-round4.md:12698:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:12706:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:12775:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1255-round4.md:12776:+            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1255-round4.md:12779:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:12790:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:13279:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:13287:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:13373:+ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1255-round4.md:17665:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:17673:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:17756:++ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1255-round4.md:22141:+++- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1255-round4.md:22142:+++- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1255-round4.md:22231:+++  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:22246:+++  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1255-round4.md:22287:+++| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1255-round4.md:22385:+++2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1255-round4.md:22501:+++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1255-round4.md:23826:+++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:23834:+++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:23991:+++- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1255-round4.md:24820:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:24828:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:24897:++           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1255-round4.md:24898:++             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1255-round4.md:24901:++           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:24912:++             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:25042:++           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1255-round4.md:25043:++             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1255-round4.md:25046:++           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:25058:++             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:25445:++.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1255-round4.md:25834:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:25842:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:25911:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1255-round4.md:25912:++            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1255-round4.md:25915:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:25926:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:26375:.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1255-round4.md:28586: .codex-review-passed                               |     2 +-
docs/reviews/codex-E01-S06-20260418-1255-round4.md:28847:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1255-round4.md:28848:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1255-round4.md:28851:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:28863:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:28879:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:28887:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1255-round4.md:28956:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1255-round4.md:28957:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1255-round4.md:28960:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1255-round4.md:28971:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1300-round5.md:19:--- a/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1300-round5.md:20:+++ b/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1300-round5.md:57:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:65:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:151: - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1300-round5.md:4535:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:4543:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:4626:+ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1300-round5.md:9011:++- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1300-round5.md:9012:++- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1300-round5.md:9101:++  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:9116:++  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1300-round5.md:9157:++| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1300-round5.md:9255:++2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1300-round5.md:9371:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1300-round5.md:10696:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:10704:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:10861:++- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1300-round5.md:11690:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:11698:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:11767:+           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1300-round5.md:11768:+             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1300-round5.md:11771:+           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:11782:+             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:11912:+           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1300-round5.md:11913:+             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1300-round5.md:11916:+           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:11928:+             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:12315:+.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1300-round5.md:12704:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:12712:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:12781:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1300-round5.md:12782:+            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1300-round5.md:12785:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:12796:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:13285:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:13293:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:13379:+ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1300-round5.md:17671:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:17679:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:17762:++ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1300-round5.md:22147:+++- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1300-round5.md:22148:+++- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1300-round5.md:22237:+++  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:22252:+++  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1300-round5.md:22293:+++| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1300-round5.md:22391:+++2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1300-round5.md:22507:+++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1300-round5.md:23832:+++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:23840:+++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:23997:+++- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1300-round5.md:24826:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:24834:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:24903:++           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1300-round5.md:24904:++             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1300-round5.md:24907:++           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:24918:++             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:25048:++           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1300-round5.md:25049:++             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1300-round5.md:25052:++           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:25064:++             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:25451:++.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1300-round5.md:25840:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:25848:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:25917:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1300-round5.md:25918:++            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1300-round5.md:25921:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:25932:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:26379: .codex-review-passed                               |     2 +-
docs/reviews/codex-E01-S06-20260418-1300-round5.md:27154:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:27162:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1300-round5.md:27231:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1300-round5.md:27232:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1300-round5.md:27235:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:27246:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:27371:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1300-round5.md:27372:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1300-round5.md:27375:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:27387:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1300-round5.md:27712:.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1300-round5.md:28547:.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1304-round6.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1304-round6.md:19:--- a/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1304-round6.md:20:+++ b/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1304-round6.md:57:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:72:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:163: - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1304-round6.md:4547:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:4555:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:4638:+ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1304-round6.md:9023:++- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1304-round6.md:9024:++- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1304-round6.md:9113:++  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:9128:++  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1304-round6.md:9169:++| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1304-round6.md:9267:++2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1304-round6.md:9383:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1304-round6.md:10708:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:10716:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:10873:++- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1304-round6.md:11702:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:11710:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:11779:+           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1304-round6.md:11780:+             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1304-round6.md:11783:+           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:11794:+             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:11924:+           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1304-round6.md:11925:+             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1304-round6.md:11928:+           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:11940:+             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:12327:+.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1304-round6.md:12716:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:12724:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:12793:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1304-round6.md:12794:+            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1304-round6.md:12797:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:12808:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:13297:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:13305:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:13391:+ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1304-round6.md:17683:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:17691:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:17774:++ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1304-round6.md:22159:+++- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1304-round6.md:22160:+++- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1304-round6.md:22249:+++  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:22264:+++  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1304-round6.md:22305:+++| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1304-round6.md:22403:+++2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1304-round6.md:22519:+++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1304-round6.md:23844:+++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:23852:+++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:24009:+++- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1304-round6.md:24838:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:24846:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:24915:++           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1304-round6.md:24916:++             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1304-round6.md:24919:++           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:24930:++             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:25060:++           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1304-round6.md:25061:++             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1304-round6.md:25064:++           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:25076:++             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:25463:++.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1304-round6.md:25852:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:25860:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:25929:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1304-round6.md:25930:++            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1304-round6.md:25933:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:25944:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:26388:M	.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1304-round6.md:27256:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:27271:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1304-round6.md:27345:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1304-round6.md:27346:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1304-round6.md:27349:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:27360:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:27486:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1304-round6.md:27487:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1304-round6.md:27490:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:27502:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1304-round6.md:27927: .codex-review-passed                               |     2 +-
docs/reviews/codex-E01-S06-20260418-1304-round6.md:28409:- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1304-round6.md:28512:.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1304-round6.md:28530:- [P1] Refresh stale Codex review marker — C:\Alok\Business Projects\Urbanclap-dup\.codex-review-passed:1-1
docs/reviews/codex-E01-S06-20260418-1304-round6.md:28531:  The marker records `81f8a32b61a903e8be1203db3198c6f0866d5194`, but there are subsequent non-review changes in this patch (for example workflow, page, client, and OpenAPI build files). Both ship workflows validate that only `.codex-review-passed` and `docs/reviews/` changed after the marker SHA, so PR CI will fail the Codex review gate until the marker is regenerated after these code changes.
docs/reviews/codex-E01-S06-20260418-1304-round6.md:28536:- [P1] Refresh stale Codex review marker — C:\Alok\Business Projects\Urbanclap-dup\.codex-review-passed:1-1
docs/reviews/codex-E01-S06-20260418-1304-round6.md:28537:  The marker records `81f8a32b61a903e8be1203db3198c6f0866d5194`, but there are subsequent non-review changes in this patch (for example workflow, page, client, and OpenAPI build files). Both ship workflows validate that only `.codex-review-passed` and `docs/reviews/` changed after the marker SHA, so PR CI will fail the Codex review gate until the marker is regenerated after these code changes.
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:19:--- a/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:20:+++ b/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:57:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:72:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:178: - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:4568:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:4576:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:4659:+ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:9044:++- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:9045:++- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:9134:++  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:9149:++  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:9190:++| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:9288:++2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:9404:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:10729:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:10737:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:10894:++- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:11723:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:11731:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:11800:+           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:11801:+             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:11804:+           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:11815:+             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:11945:+           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:11946:+             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:11949:+           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:11961:+             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:12348:+.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:12737:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:12745:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:12814:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:12815:+            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:12818:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:12829:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:13318:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:13326:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:13412:+ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:17704:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:17712:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:17795:++ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:22180:+++- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:22181:+++- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:22270:+++  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:22285:+++  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:22326:+++| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:22424:+++2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:22540:+++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:23865:+++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:23873:+++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:24030:+++- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:24859:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:24867:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:24936:++           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:24937:++             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:24940:++           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:24951:++             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:25081:++           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:25082:++             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:25085:++           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:25097:++             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:25484:++.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:25873:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:25881:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:25950:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:25951:++            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:25954:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:25965:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:26381:M	.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:26975:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:26990:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:27068:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:27069:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:27072:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:27083:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:27208:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:27209:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:27212:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:27224:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:27910: .codex-review-passed                               |    2 +-
docs/reviews/codex-E01-S06-20260418-1318-round7-final.md:54053:.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:19:--- a/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:20:+++ b/.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:57:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:72:       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:178: - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:4573:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:4581:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:4664:+ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:9049:++- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:9050:++- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:9139:++  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:9154:++  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:9195:++| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:9293:++2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:9409:++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:10734:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:10742:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:10899:++- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:11728:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:11736:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:11805:+           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:11806:+             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:11809:+           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:11820:+             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:11950:+           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:11951:+             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:11954:+           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:11966:+             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:12353:+.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:12742:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:12750:+      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:12819:+          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:12820:+            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:12823:+          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:12834:+            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:13323:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:13331:+       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:13417:+ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:17709:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:17717:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:17800:++ - **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:22185:+++- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:22186:+++- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:22275:+++  - [ ] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:22290:+++  - [ ] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:22331:+++| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:22429:+++2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:22545:+++- [ ] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:23870:+++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:23878:+++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:24035:+++- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:24864:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:24872:++       - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:24941:++           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:24942:++             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:24945:++           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:24956:++             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:25086:++           if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:25087:++             echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:25090:++           MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:25102:++             | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:25489:++.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:25878:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:25886:++      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:25955:++          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:25956:++            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:25959:++          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:25970:++            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:26378:M	.codex-review-passed
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:26947:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:26962:      - '.codex-review-passed'
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:27040:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:27041:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:27044:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:27055:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:27184:          if [ ! -f .codex-review-passed ]; then
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:27185:            echo "::error::.codex-review-passed marker missing â€” run /codex-review-gate before pushing"
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:27188:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
docs/reviews/codex-E01-S06-20260418-1728-round8-ci-fix.md:27200:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
docs/reviews/codex-E04-S02-20260423-2001.md:2279:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-E04-S02-round2-20260423-2007.md:2295:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-E04-S02-round3-20260423-2012.md:2299:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-E04-S02-round4-20260423-2017.md:2367:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-E04-S02-round5-20260423-2023.md:2422:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-E04-S02-round6-20260423-2028.md:2424:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-E04-S02-round7-20260423-2032.md:2435:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-e06-s05-20260424-1939.md:1249:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e06-s05-20260424-1939.md:1994:+Expected: `.codex-review-passed` written. Fix P1s; note P2s in PR.
docs/reviews/codex-e07-s01b-round3-20260425-0215.md:6062:  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-e07-s01b-round3-20260425-0215.md:6113:- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07-s01b-round7-20260425-0251.md:7029:  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-e07-s01b-round7-20260425-0251.md:7080:- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07-s02-20260425-1156.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07-s02-20260425-1156.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07-s02-20260425-1156.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07-s02-20260425-1156.md:14880:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-e07-s02-20260425-1156.md:14931:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07-s02-20260425-1156.md:21188: .codex-review-passed                               |    2 +-
docs/reviews/codex-e07-s02-round2-20260425-1203.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07-s02-round2-20260425-1203.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07-s02-round2-20260425-1203.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07-s02-round2-20260425-1203.md:14920:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-e07-s02-round2-20260425-1203.md:14971:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07-s02-round2-20260425-1203.md:21187: .codex-review-passed                               |    2 +-
docs/reviews/codex-e07-s02-round2-20260425-1203.md:24769:  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-e07-s02-round2-20260425-1203.md:24803:- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07-s02-round3-20260425-1208.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07-s02-round3-20260425-1208.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07-s02-round3-20260425-1208.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07-s02-round3-20260425-1208.md:14934:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-e07-s02-round3-20260425-1208.md:14985:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07-s02-round3-20260425-1208.md:21189: .codex-review-passed                               |    2 +-
docs/reviews/codex-e07-s02-round4-20260425-1218.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07-s02-round4-20260425-1218.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07-s02-round4-20260425-1218.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07-s02-round4-20260425-1218.md:14980:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-e07-s02-round4-20260425-1218.md:15031:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07-s02-round4-20260425-1218.md:21184:.codex-review-passed
docs/reviews/codex-e07-s02-round4-20260425-1218.md:21238: .codex-review-passed                               |    2 +-
docs/reviews/codex-e07-s02-round5-20260425-1225.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07-s02-round5-20260425-1225.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07-s02-round5-20260425-1225.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07-s02-round5-20260425-1225.md:15015:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-e07-s02-round5-20260425-1225.md:15066:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07-s02-round5-20260425-1225.md:21182: .codex-review-passed                               |    2 +-
docs/reviews/codex-e07-s02-round6-20260425-1234.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07-s02-round6-20260425-1234.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07-s02-round6-20260425-1234.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07-s02-round6-20260425-1234.md:15040:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-e07-s02-round6-20260425-1234.md:15091:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07-s02-round6-20260425-1234.md:21166: .codex-review-passed                               |    2 +-
docs/reviews/codex-e07-s02-round7-20260425-1238.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07-s02-round7-20260425-1238.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07-s02-round7-20260425-1238.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07-s02-round7-20260425-1238.md:15059:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-e07-s02-round7-20260425-1238.md:15110:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07-s02-round7-20260425-1238.md:21170: .codex-review-passed                               |    2 +-
docs/reviews/codex-e07-s02-round8-20260425-1242.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07-s02-round8-20260425-1242.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07-s02-round8-20260425-1242.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07-s02-round8-20260425-1242.md:15074:+  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-e07-s02-round8-20260425-1242.md:15125:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07-s02-round8-20260425-1242.md:21153: .codex-review-passed                               |     2 +-
docs/reviews/codex-e07s04-round10-20260426-1040.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07s04-round10-20260426-1040.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07s04-round10-20260426-1040.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07s04-round10-20260426-1040.md:24:diff --git a/.codex-review-passed-manual b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round10-20260426-1040.md:28:+++ b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round10-20260426-1040.md:37:+  "instructions": "Re-run codex review --base main and replace this file with .codex-review-passed when Codex quota resets."
docs/reviews/codex-e07s04-round10-20260426-1040.md:1963:+  - [ ] `codex review --base main` → `.codex-review-passed`
docs/reviews/codex-e07s04-round10-20260426-1040.md:2150:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07s04-round10-20260426-1040.md:3077:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-e07s04-round10-20260426-1040.md:3322:.codex-review-passed
docs/reviews/codex-e07s04-round10-20260426-1040.md:3323:.codex-review-passed-manual
docs/reviews/codex-e07s04-round2-20260426-0959.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07s04-round2-20260426-0959.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07s04-round2-20260426-0959.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07s04-round2-20260426-0959.md:24:diff --git a/.codex-review-passed-manual b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round2-20260426-0959.md:28:+++ b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round2-20260426-0959.md:37:+  "instructions": "Re-run codex review --base main and replace this file with .codex-review-passed when Codex quota resets."
docs/reviews/codex-e07s04-round2-20260426-0959.md:1739:+  - [ ] `codex review --base main` → `.codex-review-passed`
docs/reviews/codex-e07s04-round2-20260426-0959.md:1926:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07s04-round2-20260426-0959.md:2853:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-e07s04-round2-20260426-0959.md:3098: .codex-review-passed                               |   2 +-
docs/reviews/codex-e07s04-round2-20260426-0959.md:3099: .codex-review-passed-manual                        |   9 +
docs/reviews/codex-e07s04-round3-20260426-1003.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07s04-round3-20260426-1003.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07s04-round3-20260426-1003.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07s04-round3-20260426-1003.md:24:diff --git a/.codex-review-passed-manual b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round3-20260426-1003.md:28:+++ b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round3-20260426-1003.md:37:+  "instructions": "Re-run codex review --base main and replace this file with .codex-review-passed when Codex quota resets."
docs/reviews/codex-e07s04-round3-20260426-1003.md:1765:+  - [ ] `codex review --base main` → `.codex-review-passed`
docs/reviews/codex-e07s04-round3-20260426-1003.md:1952:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07s04-round3-20260426-1003.md:2879:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-e07s04-round3-20260426-1003.md:3128:.codex-review-passed
docs/reviews/codex-e07s04-round3-20260426-1003.md:3129:.codex-review-passed-manual
docs/reviews/codex-e07s04-round4-20260426-1006.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07s04-round4-20260426-1006.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07s04-round4-20260426-1006.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07s04-round4-20260426-1006.md:24:diff --git a/.codex-review-passed-manual b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round4-20260426-1006.md:28:+++ b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round4-20260426-1006.md:37:+  "instructions": "Re-run codex review --base main and replace this file with .codex-review-passed when Codex quota resets."
docs/reviews/codex-e07s04-round4-20260426-1006.md:1764:+  - [ ] `codex review --base main` → `.codex-review-passed`
docs/reviews/codex-e07s04-round4-20260426-1006.md:1951:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07s04-round4-20260426-1006.md:2878:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-e07s04-round4-20260426-1006.md:3123:.codex-review-passed
docs/reviews/codex-e07s04-round4-20260426-1006.md:3124:.codex-review-passed-manual
docs/reviews/codex-e07s04-round5-20260426-1012.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07s04-round5-20260426-1012.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07s04-round5-20260426-1012.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07s04-round5-20260426-1012.md:24:diff --git a/.codex-review-passed-manual b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round5-20260426-1012.md:28:+++ b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round5-20260426-1012.md:37:+  "instructions": "Re-run codex review --base main and replace this file with .codex-review-passed when Codex quota resets."
docs/reviews/codex-e07s04-round5-20260426-1012.md:1766:+  - [ ] `codex review --base main` → `.codex-review-passed`
docs/reviews/codex-e07s04-round5-20260426-1012.md:1953:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07s04-round5-20260426-1012.md:2880:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-e07s04-round5-20260426-1012.md:3125:.codex-review-passed
docs/reviews/codex-e07s04-round5-20260426-1012.md:3126:.codex-review-passed-manual
docs/reviews/codex-e07s04-round6-20260426-1018.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07s04-round6-20260426-1018.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07s04-round6-20260426-1018.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07s04-round6-20260426-1018.md:24:diff --git a/.codex-review-passed-manual b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round6-20260426-1018.md:28:+++ b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round6-20260426-1018.md:37:+  "instructions": "Re-run codex review --base main and replace this file with .codex-review-passed when Codex quota resets."
docs/reviews/codex-e07s04-round6-20260426-1018.md:1807:+  - [ ] `codex review --base main` → `.codex-review-passed`
docs/reviews/codex-e07s04-round6-20260426-1018.md:1994:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07s04-round6-20260426-1018.md:2921:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-e07s04-round6-20260426-1018.md:3166: .codex-review-passed                               |   2 +-
docs/reviews/codex-e07s04-round6-20260426-1018.md:3167: .codex-review-passed-manual                        |   9 +
docs/reviews/codex-e07s04-round7-20260426-1021.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07s04-round7-20260426-1021.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07s04-round7-20260426-1021.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07s04-round7-20260426-1021.md:24:diff --git a/.codex-review-passed-manual b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round7-20260426-1021.md:28:+++ b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round7-20260426-1021.md:37:+  "instructions": "Re-run codex review --base main and replace this file with .codex-review-passed when Codex quota resets."
docs/reviews/codex-e07s04-round7-20260426-1021.md:1819:+  - [ ] `codex review --base main` → `.codex-review-passed`
docs/reviews/codex-e07s04-round7-20260426-1021.md:2006:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07s04-round7-20260426-1021.md:2933:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-e07s04-round7-20260426-1021.md:3178: .codex-review-passed                               |   2 +-
docs/reviews/codex-e07s04-round7-20260426-1021.md:3179: .codex-review-passed-manual                        |   9 +
docs/reviews/codex-e07s04-round8-20260426-1027.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07s04-round8-20260426-1027.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07s04-round8-20260426-1027.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07s04-round8-20260426-1027.md:24:diff --git a/.codex-review-passed-manual b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round8-20260426-1027.md:28:+++ b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round8-20260426-1027.md:37:+  "instructions": "Re-run codex review --base main and replace this file with .codex-review-passed when Codex quota resets."
docs/reviews/codex-e07s04-round8-20260426-1027.md:1889:+  - [ ] `codex review --base main` → `.codex-review-passed`
docs/reviews/codex-e07s04-round8-20260426-1027.md:2076:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07s04-round8-20260426-1027.md:3003:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-e07s04-round8-20260426-1027.md:3248: .codex-review-passed                               |   2 +-
docs/reviews/codex-e07s04-round8-20260426-1027.md:3249: .codex-review-passed-manual                        |   9 +
docs/reviews/codex-e07s04-round8-20260426-1027.md:4279:  - [ ] `codex review --base main` â†’ `.codex-review-passed`
docs/reviews/codex-e07s04-round8-20260426-1027.md:4470:- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07s04-round9-20260426-1034.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e07s04-round9-20260426-1034.md:19:--- a/.codex-review-passed
docs/reviews/codex-e07s04-round9-20260426-1034.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e07s04-round9-20260426-1034.md:24:diff --git a/.codex-review-passed-manual b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round9-20260426-1034.md:28:+++ b/.codex-review-passed-manual
docs/reviews/codex-e07s04-round9-20260426-1034.md:37:+  "instructions": "Re-run codex review --base main and replace this file with .codex-review-passed when Codex quota resets."
docs/reviews/codex-e07s04-round9-20260426-1034.md:1921:+  - [ ] `codex review --base main` → `.codex-review-passed`
docs/reviews/codex-e07s04-round9-20260426-1034.md:2108:+- [ ] `.codex-review-passed` marker present
docs/reviews/codex-e07s04-round9-20260426-1034.md:3035:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-e07s04-round9-20260426-1034.md:3280:.codex-review-passed
docs/reviews/codex-e07s04-round9-20260426-1034.md:3281:.codex-review-passed-manual
docs/reviews/codex-e11-s05b-2-round10-20260518-0530.md:1207:Name          : .codex-review-passed
docs/reviews/codex-e11-s05b-2-round10-20260518-0530.md:8228:.codex-review-passed
docs/reviews/codex-e11-s05b-2-round10-20260518-0530.md:10844:docs/reviews\codex-20260425-2354.md:2738:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-e11-s05b-2-round10-20260518-0530.md:10897:docs/reviews\codex-20260426-0953.md:2824:+Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/reviews/codex-e11-s05b-2-round2-20260518-0204.md:17:diff --git a/.codex-review-passed b/.codex-review-passed
docs/reviews/codex-e11-s05b-2-round2-20260518-0204.md:19:--- a/.codex-review-passed
docs/reviews/codex-e11-s05b-2-round2-20260518-0204.md:20:+++ b/.codex-review-passed
docs/reviews/codex-e11-s05b-2-round2-20260518-0204.md:7108:M	.codex-review-passed
docs/reviews/codex-e11-s05b-2-round3-20260518-0224.md:318:-a----         5/17/2026   6:26 PM            368 .codex-review-passed                                                 
docs/reviews/codex-e11-s05b-2-round4-20260518-0300.md:318:-a----         5/17/2026   6:26 PM            368 .codex-review-passed                                                 
docs/reviews/codex-e11-s05b-2-round4-20260518-0300.md:375:-a---- 149    .codex-review-passed         
docs/reviews/codex-e11-s05b-2-round5-20260518-0333.md:923:Name          : .codex-review-passed
docs/reviews/codex-e11-s05b-2-round6-20260518-0403.md:319:-a----         5/17/2026   6:26 PM            368 .codex-review-passed                                                 
docs/reviews/codex-e11-s05b-2-round7-20260518-0426.md:1185:Name          : .codex-review-passed
docs/reviews/codex-e11-s05b-2-round8-20260518-0451.md:923:Name          : .codex-review-passed
docs/reviews/codex-e11-s05b-2-round8-20260518-0451.md:7170:admin-web\README.md:72:- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-e11-s05b-2-round8-20260518-0451.md:7372:admin-web\README.md:72:- **Codex CLI is the authoritative review gate.** `.codex-review-passed` marker required before push (`.claude/settings.json` enforces it locally; `.github/workflows/admin-ship.yml` enforces it in CI via the ancestor-check pattern).
docs/reviews/codex-e11-s05b-2-round9-20260518-0507.md:319:-a----         5/17/2026   6:26 PM            368 .codex-review-passed                                                 
docs/reviews/codex-e19-s01-20260518-0700.md:318:-a----         5/18/2026   6:46 AM            870 .codex-review-passed                                                 
docs/reviews/codex-e19-s01-20260518-0700.md:4431:docs\reviews\codex-E01-S02-20260418-0818-round2.md:29243:2026-04-18T12:20:00.683043Z ERROR codex_core::tools::router: error=`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem docs\\adr | Select-Object -ExpandProperty Name; Get-ChildItem docs\\stories | Select-Object -ExpandProperty Name; Get-ChildItem -Force | Where-Object Name -eq '.bmad-readiness-passed' | Select-Object -ExpandProperty Name; Get-ChildItem -Force | Where-Object Name -eq '.codex-review-passed' | Select-Object -ExpandProperty Name"` rejected: blocked by policy
docs/reviews/codex-e19-s01-20260518-0700.md:4432:docs\reviews\codex-E01-S02-20260418-0818-round2.md:29245:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem docs\\adr | Select-Object -ExpandProperty Name; Get-ChildItem docs\\stories | Select-Object -ExpandProperty Name; Get-ChildItem -Force | Where-Object Name -eq '.bmad-readiness-passed' | Select-Object -ExpandProperty Name; Get-ChildItem -Force | Where-Object Name -eq '.codex-review-passed' | Select-Object -ExpandProperty Name" in C:\Alok\Business Projects\Urbanclap-dup
docs/reviews/codex-e19-s01-20260518-0700.md:4433:docs\reviews\codex-E01-S02-20260418-0818-round2.md:29247:`"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem docs\\adr | Select-Object -ExpandProperty Name; Get-ChildItem docs\\stories | Select-Object -ExpandProperty Name; Get-ChildItem -Force | Where-Object Name -eq '.bmad-readiness-passed' | Select-Object -ExpandProperty Name; Get-ChildItem -Force | Where-Object Name -eq '.codex-review-passed' | Select-Object -ExpandProperty Name"` rejected: blocked by policy
docs/reviews/codex-e19-s01-20260518-0712.md:897:Name          : .codex-review-passed
docs/reviews/codex-e19-s01-round3-20260518-0726.md:1159:Name          : .codex-review-passed
docs/reviews/codex-e19-s01-round4-20260518-0741.md:897:Name          : .codex-review-passed
docs/reviews/codex-e19-s01-round4-20260518-0741.md:6346:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Raw .codex-review-passed' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\E19-S01
docs/reviews/codex-e19-s01-round4-20260518-0741.md:7357:Name          : .codex-review-passed
docs/reviews/codex-e19-s01-round4-20260518-0741.md:12806:"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Raw .codex-review-passed' in C:\Alok\Business Projects\Urbanclap-dup\.worktrees\E19-S01
docs/reviews/codex-e19-s02-20260518-0745.md:897:Name          : .codex-review-passed
docs/reviews/codex-e19-s02-round2-20260518-1321.md:897:Name          : .codex-review-passed
docs/reviews/codex-sprint3-dpdp-consent-posthog.md:318:-a----         5/22/2026   1:56 PM           1649 .codex-review-passed                                                 
docs/reviews/codex-w1-pr-round2.md:317:-a----         5/12/2026   4:34 PM            183 .codex-review-passed                                                 
docs/reviews/codex-w1-pr.md:317:-a----         5/12/2026   4:34 PM            183 .codex-review-passed                                                 
docs/reviews/codex-w4-round3-20260513-1025.md:1206:+  # Creates .codex-review-passed if no P0/P1 issues
docs/reviews/codex-w5-20260513-2020.md:914:Name          : .codex-review-passed
docs/runbooks/codex-merge-train-2026-04-28.md:109:#   (a) "No P1 issues. .codex-review-passed written."
docs/runbooks/codex-merge-train-2026-04-28.md:140:# ── 4. Commit the .codex-review-passed marker ──────────────────────────────
docs/runbooks/codex-merge-train-2026-04-28.md:141:# Codex writes .codex-review-passed automatically on the round that succeeds.
docs/runbooks/codex-merge-train-2026-04-28.md:144:grep "$HEAD_SHA" .codex-review-passed   # must match
docs/runbooks/codex-merge-train-2026-04-28.md:145:git add .codex-review-passed
docs/runbooks/codex-merge-train-2026-04-28.md:185:- 10 Codex rounds completed locally pre-quota; .codex-review-passed-manual on branch
docs/runbooks/codex-merge-train-2026-04-28.md:197:- This PR has `.codex-review-passed-manual` from the local 10-round loop. Codex will
docs/runbooks/codex-merge-train-2026-04-28.md:406:2. PRs with `.codex-review-passed` already committed are safe to merge with `gh pr merge`.
docs/stories/E01-S01-api-skeleton-health-endpoint.md:154:  - [x] T9.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/stories/E01-S01-api-skeleton-health-endpoint.md:180:| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` marker keyed to commit SHA. Pre-push hook in `api/.claude/settings.json` enforces this. |
docs/stories/E01-S01-api-skeleton-health-endpoint.md:338:- [Source: `api/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/stories/E01-S01-api-skeleton-health-endpoint.md:371:- [x] 5-layer review gate complete: `.codex-review-passed` marker present and matches HEAD SHA
docs/stories/E01-S02-admin-web-skeleton-landing-page.md:188:  - [x] T10.6 Replace the codex-review-marker step with the **ancestor-check + scope-diff** pattern from `.github/workflows/api-ship.yml` (verbatim adaptation — marker SHA must be ancestor of HEAD; diff since marker limited to `.codex-review-passed` + `docs/reviews/`)
docs/stories/E01-S02-admin-web-skeleton-landing-page.md:194:  - [x] T11.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/stories/E01-S02-admin-web-skeleton-landing-page.md:221:| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` marker validated by the CI workflow's ancestor-check. |
docs/stories/E01-S02-admin-web-skeleton-landing-page.md:403:- [Source: `admin-web/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/stories/E01-S02-admin-web-skeleton-landing-page.md:445:- [x] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/stories/E01-S03-android-app-skeletons.md:186:  - [x] T7.3 Replace the template's naive codex-marker `MARKER == HEAD` check with the **ancestor-check + scope-diff** block copied verbatim from `.github/workflows/api-ship.yml` (allowed-scope: `.codex-review-passed` + `docs/reviews/**` — same as the other two workflows)
docs/stories/E01-S03-android-app-skeletons.md:197:  - [x] T9.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/stories/E01-S03-android-app-skeletons.md:228:| **Codex review is authoritative gate** | CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed`; each workflow enforces via ancestor-check + scope-diff |
docs/stories/E01-S03-android-app-skeletons.md:461:- [Source: `customer-app/.claude/settings.json` + `technician-app/.claude/settings.json` — pre-push hook enforcing `.codex-review-passed` marker]
docs/stories/E01-S03-android-app-skeletons.md:509:- [x] 5-layer review gate complete: `.codex-review-passed` marker present and its SHA is an ancestor of HEAD with scope-diff clean
docs/stories/E01-S04-design-system-module.md:141:- **And** the workflow has `paths:` filter `['design-system/**', '.github/workflows/design-system-ship.yml', '.codex-review-passed']`
docs/stories/E01-S04-design-system-module.md:251:  - [x] T9.1 Create `.github/workflows/design-system-ship.yml` modelled verbatim on `customer-ship.yml`: `name`, `paths:` `['design-system/**', '.github/workflows/design-system-ship.yml', '.codex-review-passed']`, `defaults.run.working-directory: design-system`, `env: { GIT_SHA: ${{ github.sha }} }`, full step list (BMAD gate, ktlintCheck, detekt, lintDebug, testDebugUnitTest, koverVerify koverXmlReport, verifyPaparazziDebug, assembleRelease, Semgrep `p/kotlin p/owasp-top-ten p/secrets`, codex-marker ancestor-check + scope-diff)
docs/stories/E01-S04-design-system-module.md:270:  - [x] T12.3 `/codex-review-gate` — **authoritative**; produces `.codex-review-passed` keyed to current commit
docs/stories/E01-S04-design-system-module.md:334:| **Codex review is authoritative gate** | CLAUDE.md | `.codex-review-passed` required before push; new workflow enforces same ancestor-check pattern |
docs/stories/E01-S04-design-system-module.md:525:- [x] 5-layer review passed (`/code-review` → `/security-review` → `/codex-review-gate` (`.codex-review-passed` updated) → `/bmad-code-review` → `/superpowers:requesting-code-review`)
docs/stories/E01-S05-figma-library-token-sync.md:119:  - [x] `.codex-review-passed` marker updated; PR opened
docs/stories/E01-S05-figma-library-token-sync.md:129:.codex-review-passed                            updated
docs/stories/E01-S05-figma-library-token-sync.md:178:- [x] `.codex-review-passed` marker valid (Codex review done; 2 findings resolved)
docs/stories/E01-S06-openapi-client-wiring.md:116:- **And** the codex-marker ancestor-check gate (same verbatim pattern as `api-ship.yml` + `admin-ship.yml`) runs on both workflows — never merge without `.codex-review-passed` valid for HEAD
docs/stories/E01-S06-openapi-client-wiring.md:117:- **And** the workflows' paths-filter MUST include `.codex-review-passed` and `docs/reviews/**` so marker-only commits don't bypass the gate
docs/stories/E01-S06-openapi-client-wiring.md:206:  - [x] T9.3 Ensure `.codex-review-passed` and `docs/reviews/**` are in the paths filters of both workflows (already the case; verify)
docs/stories/E01-S06-openapi-client-wiring.md:221:  - [x] T12.3 `/codex-review-gate` — **authoritative**; must produce `.codex-review-passed` keyed to current commit SHA
docs/stories/E01-S06-openapi-client-wiring.md:262:| **Codex review authoritative** | root CLAUDE.md, `feedback_cross_model_review.md` | Cannot merge without `.codex-review-passed` valid for HEAD. Ancestor-check + scope-diff pattern in CI (lock from E01-S01 C1 fix). |
docs/stories/E01-S06-openapi-client-wiring.md:360:2. **Codex-marker paradox fix** (from E01-S01 round 2): any CI step that gates on `.codex-review-passed` uses the **ancestor-check + scope-diff** pattern, NOT `MARKER_SHA == HEAD_SHA`. The paths filter MUST include `.codex-review-passed` and `docs/reviews/**`. Both existing workflows already implement this correctly (verified in `.github/workflows/api-ship.yml` and `.github/workflows/admin-ship.yml`); this story preserves the pattern.
docs/stories/E01-S06-openapi-client-wiring.md:476:- [x] 5-layer review gate complete: `.codex-review-passed` marker present, SHA is ancestor of HEAD, scope-diff clean
docs/stories/E02-S01-customer-app-otp-login.md:211:- [x] `.codex-review-passed` marker shipped in PR #9; round-trip review log in `docs/reviews/codex-pr-E02-S01.md`
docs/stories/E02-S02-technician-app-auth.md:130:  - [x] `.codex-review-passed` marker shipped
docs/stories/E02-S02-technician-app-auth.md:192:- [x] `.codex-review-passed` marker shipped in PR #14
docs/stories/E02-S03-technician-kyc.md:208:- [x] `.codex-review-passed` marker shipped in PR #17
docs/stories/E02-S04-admin-auth.md:260:- [x] `.codex-review-passed` marker shipped in PR #8; full review log in `docs/reviews/codex-E02-S04-20260419-1344.md`
docs/stories/E03-S01-service-catalogue.md:106:- [x] **T10 — Codex review + CI green** (PR #12 CI passed; `.codex-review-passed` shipped)
docs/stories/E03-S01-service-catalogue.md:133:- [x] `.codex-review-passed` marker shipped in PR #12
docs/stories/E03-S02-customer-catalogue-ui.md:117:  - [x] Codex review passed; `.codex-review-passed` marker shipped
docs/stories/E03-S02-customer-catalogue-ui.md:147:- [x] `.codex-review-passed` marker shipped in PR #16
docs/stories/E03-S03a-booking-creation-api-and-data.md:147:- [x] `.codex-review-passed` marker shipped
docs/stories/E03-S03b-booking-ui-flow.md:131:  - [x] Codex review passed; `.codex-review-passed` marker shipped
docs/stories/E03-S03b-booking-ui-flow.md:166:- [x] `.codex-review-passed` marker shipped
docs/stories/E03-S04-razorpay-webhook-paid-dispatch.md:140:  - [x] `.codex-review-passed` marker shipped
docs/stories/E03-S04-razorpay-webhook-paid-dispatch.md:183:- [x] `.codex-review-passed` marker shipped in PR #24 (3 Codex rounds)
docs/stories/E04-S01-trust-dossier.md:67:- `.codex-review-passed` marker shipped in PR #30
docs/stories/E04-S01-trust-dossier.md:106:- [x] `.codex-review-passed` marker shipped in PR #30
docs/stories/E04-S02-confidence-score.md:110:- [x] 7 rounds of Codex review; `.codex-review-passed` marker at HEAD
docs/stories/E04-S02-confidence-score.md:138:- [x] 7 rounds of Codex review completed; `.codex-review-passed` marker at HEAD
docs/stories/E04-S03-live-tracking.md:104:- [x] **T9 — Pre-Codex smoke gate + Codex review** (passed; `.codex-review-passed` shipped in PR #37)
docs/stories/E04-S03-live-tracking.md:132:- [x] `.codex-review-passed` marker shipped in PR #37
docs/stories/E05-S01-technician-geospatial-profile.md:90:- [x] **WS-E — Smoke gate + Codex** — `bash tools/pre-codex-smoke-api.sh` PASSED; `.codex-review-passed` shipped at HEAD
docs/stories/E05-S01-technician-geospatial-profile.md:117:- [x] `.codex-review-passed` marker shipped in PR #18
docs/stories/E05-S02-dispatcher-engine.md:95:- [x] **WS-E — Smoke gate + Codex review** — `tools/pre-codex-smoke-api.sh` exit 0; `.codex-review-passed` shipped at HEAD
docs/stories/E05-S02-dispatcher-engine.md:135:- [x] `.codex-review-passed` marker shipped in PR #26
docs/stories/E05-S03-technician-job-offer-card.md:158:- [x] `.codex-review-passed` marker shipped in PR #29
docs/stories/E05-S04-accept-decline-api.md:88:- `.codex-review-passed` marker shipped in PR #28
docs/stories/E05-S04-accept-decline-api.md:98:- [x] **WS-C — Smoke gate + Codex review** — `bash tools/pre-codex-smoke-api.sh` PASSED; `.codex-review-passed` shipped at HEAD
docs/stories/E05-S04-accept-decline-api.md:133:- [x] `.codex-review-passed` marker shipped in PR #28
docs/stories/E06-S01-active-job-workflow.md:112:- [x] `.codex-review-passed` marker present
docs/stories/E06-S02-guided-photo-capture.md:147:- [x] `.codex-review-passed` marker present (after 6 rounds)
docs/stories/E06-S03-price-approval-flow.md:130:- [x] `.codex-review-passed` marker present
docs/stories/E06-S04-razorpay-route-split-payment.md:136:- [x] `.codex-review-passed` marker present
docs/stories/E06-S05-pdf-service-report.md:123:- [x] `.codex-review-passed` marker present
docs/stories/E07-S01a-rating-api-and-customer-side.md:99:  - [x] `codex review --base main` → `.codex-review-passed`
docs/stories/E07-S01a-rating-api-and-customer-side.md:136:- [x] `.codex-review-passed` marker present
docs/stories/E07-S01b-rating-technician-side.md:80:  - [x] `codex review --base main` → `.codex-review-passed`
docs/stories/E07-S01b-rating-technician-side.md:131:- [x] `.codex-review-passed` marker present
docs/stories/E07-S02-rating-shield-escalation.md:115:  - [x] `codex review --base main` → `.codex-review-passed`
docs/stories/E07-S02-rating-shield-escalation.md:149:- [x] `.codex-review-passed` marker present
docs/stories/E07-S03-complaints-module.md:142:  - [x] `codex review --base main` → `.codex-review-passed`
docs/stories/E07-S03-complaints-module.md:206:- [x] `.codex-review-passed` marker present
docs/stories/E07-S04-no-show-detector.md:106:  - [ ] `codex review --base main` → `.codex-review-passed`
docs/stories/E07-S04-no-show-detector.md:293:- [ ] `.codex-review-passed` marker present
docs/stories/E09-S01-owner-live-ops-dashboard.md:68:- `.codex-review-passed` shipped
docs/stories/E09-S01-owner-live-ops-dashboard.md:78:- [x] **WS-E — pre-Codex smoke gates + Codex review** — passed; `.codex-review-passed` shipped in PR #13.
docs/stories/E09-S01-owner-live-ops-dashboard.md:106:- [x] `.codex-review-passed` marker present
docs/stories/E09-S02-owner-orders-module.md:72:- `.codex-review-passed` shipped
docs/stories/E09-S02-owner-orders-module.md:82:- [x] **WS-E — Pre-Codex smoke gate + Codex review** — `.codex-review-passed` shipped
docs/stories/E09-S02-owner-orders-module.md:111:- [x] `.codex-review-passed` marker present
docs/stories/E09-S03-owner-override-controls.md:84:- `.codex-review-passed` shipped
docs/stories/E09-S03-owner-override-controls.md:96:- [x] **WS-G — Pre-Codex smoke + Codex review** — `.codex-review-passed`
docs/stories/E09-S03-owner-override-controls.md:125:- [x] `.codex-review-passed` marker present (committed in story branch)
docs/stories/E09-S04-owner-finance-dashboard.md:82:- `codex review --base main` clean — all P1/P2 findings resolved (prior-week IST bounds, audit-log API base URL, pre-commit hook coverage); `.codex-review-passed` shipped
docs/stories/E09-S04-owner-finance-dashboard.md:103:- [x] WS-F: Pre-Codex smoke gates (api + web) → Codex review → `/security-review` → `.codex-review-passed`
docs/stories/E09-S04-owner-finance-dashboard.md:135:- [x] `.codex-review-passed` marker present
docs/stories/E09-S05-immutable-audit-log.md:130:- [x] `.codex-review-passed` shipped with the bundling PR (#21)
docs/stories/E09-S06-owner-complaints-inbox.md:95:- `.codex-review-passed` shipped
docs/stories/E09-S06-owner-complaints-inbox.md:105:- [x] **WS-E — Pre-Codex smoke + Codex review** — `.codex-review-passed`
docs/stories/E09-S06-owner-complaints-inbox.md:145:- [x] `.codex-review-passed` marker present
docs/stories/E10-S02-ssc-levy-quarterly-automation.md:87:- `.codex-review-passed` shipped
docs/stories/E10-S02-ssc-levy-quarterly-automation.md:135:- [x] `.codex-review-passed` marker present (7 rounds clean)
docs/stories/E11-S02-backend-pending-actions.md:50:- [ ] AC-11: `.codex-review-passed` marker committed.
docs/stories/E11-S02-backend-pending-actions.md:79:- `codex review --base main` → `.codex-review-passed`
docs/stories/E12-S02a-customer-app-hindi-sweep.md:83:- [ ] Codex review passed (`.codex-review-passed` marker)
docs/stories/README.md:249:   - `/codex-review-gate` — **Codex CLI is authoritative** (writes `.codex-review-passed`)
docs/superpowers/plans/2026-04-24-e06-s04-razorpay-route-split-payment.md:1190:Expected: `.codex-review-passed` marker written.
docs/superpowers/plans/2026-04-24-e06-s05-pdf-service-report.md:725:Expected: `.codex-review-passed` written. Fix P1s; note P2s in PR.
docs/superpowers/plans/2026-04-24-e07-s01a-rating-api-and-customer-side.md:1657:Expected: `.codex-review-passed` written. Address P1s before push; note P2s in PR description.
docs/superpowers/plans/2026-04-24-e07-s01b-rating-technician-side.md:1050:Expected: `.codex-review-passed` written. P1s before push; P2s in PR description.
docs/superpowers/plans/2026-04-25-e07-s02-rating-shield-escalation.md:1165:Expected: `.codex-review-passed` marker written at repo root
docs/superpowers/plans/2026-04-25-e07-s03-complaints-module.md:2638:Expected: `.codex-review-passed` created. Address any P1/P2 findings before push.
docs/superpowers/plans/2026-04-25-e07-s04-no-show-detector.md:894:Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
docs/superpowers/plans/2026-05-02-E12-S02a-hindi-android-customer.md:2025:For each finding, fix the underlying issue, re-run smoke + Paparazzi verify, and commit. Do not write `.codex-review-passed` until Codex returns clean (no P1, no P2).
docs/superpowers/plans/2026-05-02-E12-S02a-hindi-android-customer.md:2034:echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) E12-S02a hindi-android-customer codex-clean" > .codex-review-passed
docs/superpowers/plans/2026-05-02-E12-S02a-hindi-android-customer.md:2035:git add .codex-review-passed
docs/superpowers/plans/2026-05-02-E12-S02a-hindi-android-customer.md:2096:8. **`codex review --base main`** returns no P1/P2 findings; `.codex-review-passed` is committed.
docs/superpowers/plans/2026-05-02-E12-S02b-hindi-android-technician.md:1423:For each finding, fix the underlying issue, re-run smoke + Paparazzi verify, and commit. Do not write `.codex-review-passed` until Codex returns clean.
docs/superpowers/plans/2026-05-02-E12-S02b-hindi-android-technician.md:1432:echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) E12-S02b technician-hindi codex-clean" > .codex-review-passed
docs/superpowers/plans/2026-05-02-E12-S02b-hindi-android-technician.md:1433:git add .codex-review-passed
docs/superpowers/plans/2026-05-02-E12-S02b-hindi-android-technician.md:1491:7. **`codex review --base main`** returns no P1/P2 findings; `.codex-review-passed` is committed.
docs/superpowers/plans/2026-05-05-ui-alignment-pass.md:1070:Expected: `.codex-review-passed` marker written. If Codex raises P1 issues, fix in Claude, then run `codex review --base main` once more.
docs/superpowers/plans/2026-05-12-customer-app-gap-closure-roadmap.md:403:3. Codex review passed (`.codex-review-passed` marker before push)
docs/superpowers/specs/2026-04-17-e01-s01-api-skeleton-design.md:58:| D4 | `ship.yml` codex-marker step is a warning, not an error — contradicts CLAUDE.md "CI is the real gate" | Change `echo "::warning::…"` to `echo "::error::…"; exit 1` on missing/mismatched `.codex-review-passed`. | **T8** (extend T8.4) |
docs/superpowers/specs/2026-04-18-e01-s03-android-app-skeletons-design.md:56:| A3 | Baseline codex step uses the naive `MARKER_SHA == HEAD_SHA` pattern — the exact chicken-and-egg paradox E01-S01 + E01-S02 already fixed | Replace verbatim with the **ancestor-check + scope-diff** block copied from `.github/workflows/api-ship.yml` (lines 73–98). Allowed scope: `.codex-review-passed` + `docs/reviews/**`. | **T7.3** |
docs/superpowers/specs/2026-04-18-e01-s03-android-app-skeletons-design.md:58:| A5 | Baseline `ship.yml` has **no `paths:` filter** — every push/PR on any sub-project triggers both Android workflows, burning CI minutes | Add `paths:` filter on both `pull_request` and `push`: customer-ship.yml → `['customer-app/**', '.github/workflows/customer-ship.yml', '.codex-review-passed']`; technician-ship.yml mirrors. Including `.codex-review-passed` mirrors admin-ship.yml + api-ship.yml precedent so the codex step re-runs when the marker moves. | **T7.2** |
docs/superpowers/specs/2026-04-18-e01-s04-design-system-design.md:271:- `design-system-ship.yml` — modelled verbatim on `customer-ship.yml`; `paths:` filter `['design-system/**', '.github/workflows/design-system-ship.yml', '.codex-review-passed']`; `defaults.run.working-directory: design-system`; full step list (BMAD gate, ktlintCheck, detekt, lintDebug, testDebugUnitTest, koverVerify koverXmlReport, verifyPaparazziDebug, assembleRelease, Semgrep, codex-marker ancestor-check); tools/check-shared-versions.sh as the second step
plans/E01-S01.md:1044:          if [ ! -f .codex-review-passed ]; then
plans/E01-S01.md:1045:            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
plans/E01-S01.md:1048:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
plans/E01-S01.md:1051:            echo "::error::.codex-review-passed commit ($MARKER_SHA) does not match HEAD ($HEAD_SHA) — rerun /codex-review-gate"
plans/E01-S01.md:1186:Invoke `/codex-review-gate`. This must produce `.codex-review-passed` keyed to the current HEAD commit SHA. Address all blocking feedback before re-running. **Do not merge without this marker matching HEAD.**
plans/E01-S01.md:1212:- [x] 5-layer review gate complete (.codex-review-passed matches HEAD)
plans/E01-S02.md:122:6. Codex-marker step uses ancestor-check + scope-diff (verbatim adaptation of `.github/workflows/api-ship.yml` — marker SHA must be ancestor of HEAD; diff since marker limited to `.codex-review-passed` + `docs/reviews/`).
plans/E01-S02.md:139:- [x] `.codex-review-passed` marker valid; SHA is an ancestor of HEAD with scope-diff clean
plans/E01-S03.md:1642:      - '.codex-review-passed'
plans/E01-S03.md:1648:      - '.codex-review-passed'
plans/E01-S03.md:1724:          if [ ! -f .codex-review-passed ]; then
plans/E01-S03.md:1725:            echo "::error::.codex-review-passed marker missing — run /codex-review-gate before pushing"
plans/E01-S03.md:1728:          MARKER_SHA=$(jq -r .commit .codex-review-passed)
plans/E01-S03.md:1732:          # allowed scope (.codex-review-passed or docs/reviews/**) may have
plans/E01-S03.md:1740:            | grep -Ev '^(\.codex-review-passed|docs/reviews/)' || true)
plans/E01-S03.md:2109:- On PASS: a `.codex-review-passed` marker file at repo root with `{"commit": "<SHA>"}` JSON pointing at the current HEAD
plans/E01-S03.md:2125:git add .codex-review-passed docs/reviews/
plans/E01-S03.md:2143:Expected: push succeeds; pre-push hook in `customer-app/.claude/settings.json` and `technician-app/.claude/settings.json` PASSES because `.codex-review-passed` exists + matches HEAD. If the hook blocks, re-run `/codex-review-gate` to regenerate the marker.
plans/E01-S03.md:2165:- [ ] `.codex-review-passed` present, SHA is ancestor of HEAD, scope-diff clean
plans/E01-S04.md:104:| `.github/workflows/design-system-ship.yml` | Create | Repo-root workflow modelled on customer-ship.yml; `paths:` filter on `design-system/**` + `.github/workflows/design-system-ship.yml` + `.codex-review-passed`; `working-directory: design-system`; full quality gate + codex-marker ancestor-check |
plans/E01-S04.md:679:  - `paths:` → `['design-system/**', '.github/workflows/design-system-ship.yml', '.codex-review-passed', 'tools/check-shared-versions.sh']`
plans/E01-S04.md:743:- [ ] **Step 12.3: `/codex-review-gate`** — **authoritative**; produces `.codex-review-passed` keyed to current commit SHA. Address any findings in a follow-up commit, then re-run.
plans/E01-S04.md:766:- [ ] 5-layer review passed (`/code-review` → `/security-review` → `/codex-review-gate` (`.codex-review-passed` updated) → `/bmad-code-review` → `/superpowers:requesting-code-review`)
plans/E01-S05.md:143:- [ ] `.codex-review-passed` marker valid (Codex review done)
plans/E01-S06.md:991:      - '.codex-review-passed'
plans/E01-S06.md:999:      - '.codex-review-passed'
plans/E01-S06.md:1156:- [ ] **Step 3:** Invoke `/codex-review-gate` — **authoritative**. Expect `.codex-review-passed` written keyed to the current HEAD SHA after the gate accepts.
plans/E02-S02.md:461:- [ ] `.codex-review-passed` marker created locally before push
plans/E02-S03.md:2133:  Resolve any findings before pushing. This generates `.codex-review-passed` locally.
plans/E03-S02.md:724:Confirm `.codex-review-passed` marker written. Resolve any findings before merging PR.
plans/E03-S04.md:341:- [ ] `codex review --base main` → address P1 findings, push back on disagreements with documented reasoning in `docs/reviews/codex-e03-s04*.md`. Iterate until `.codex-review-passed` marker is written.
plans/E04-S01-trust-dossier.md:1386:- [ ] **Step 4: Create `.codex-review-passed` marker**
plans/E04-S01-trust-dossier.md:1389:touch .codex-review-passed
plans/E04-S01-trust-dossier.md:1390:git add .codex-review-passed
plans/E04-S02b.md:716:Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.
plans/E05-S01.md:273:- [ ] Run `codex review --base main` → resolve P1/P2 → write `.codex-review-passed`
plans/E05-S02.md:401:- [ ] Write `.codex-review-passed` marker after resolution.
plans/E05-S03.md:315:- [ ] `.codex-review-passed` marker after resolution.
plans/E05-S04.md:316:- [ ] `.codex-review-passed` after resolution.
plans/E06-S01.md:2229:Expected: `.codex-review-passed` marker written.
plans/E06-S01.md:2248:- [ ] `.codex-review-passed` present
plans/E06-S02.md:661:- [ ] `.codex-review-passed` marker present
plans/E06-S03.md:1065:Expected: `.codex-review-passed` written, no P0/P1 blockers.
plans/E09-S01.md:365:# Creates .codex-review-passed marker
plans/E09-S01.md:446:- [ ] `codex review --base main` passes → `.codex-review-passed` written
plans/E09-S02.md:382:  Resolve findings; commit `.codex-review-passed`.
plans/E09-S03.md:161:- [ ] **E2 — `codex review --base main`** — resolve P1/P2; commit `.codex-review-passed`
plans/E09-S05.md:1482:Address any findings. Write `.codex-review-passed` marker once approved:
plans/E09-S05.md:1484:echo "E09-S05 reviewed $(date -u +%Y-%m-%dT%H:%M:%SZ)" > .codex-review-passed
plans/E09-S05.md:1485:git add .codex-review-passed
plans/E09-S06.md:160:- [ ] `codex review --base main` → resolve P1/P2 (expect multiple rounds — see PR #27 description for the matrix); commit `.codex-review-passed`
plans/E09-S07b.md:1216:echo "{\"timestamp\":\"$(date -Iseconds)\",\"commit\":\"$(git rev-parse HEAD)\",\"reviewer\":\"codex\",\"story\":\"E09-S07\"}" > .codex-review-passed
plans/E09-S07b.md:1217:git add .codex-review-passed
plans/E10-S02.md:174:- [ ] **D4 — Commit** `.codex-review-passed`
plans/E10-S99-portal-hardening.md:30:- `.codex-review-passed` marker present locally.
plans/E10-S99-portal-hardening.md:2375:Expected output: Codex writes `.codex-review-passed` on success. If it flags issues:
plans/E11-S01a-1-core-nav-contracts.md:1089:  Expected: review passes; `.codex-review-passed` updated. Any P1 finding → STOP and fix in a new commit before pushing. No `--no-verify`. No `CLAUDE_OVERRIDE_REASON` unless the owner explicitly authorizes.
plans/E11-S01a-2-per-app-room.md:661:  Expected: review passes; `.codex-review-passed` updated. P1 finding → STOP and fix in a new commit. No `--no-verify`.
plans/E11-S01a-3-typed-routes-spike.md:536:  Expected: review passes; `.codex-review-passed` updated. P1 finding → STOP and fix in a new commit.
plans/E11-S05a-api.md:397:echo "{\"timestamp\":\"$(date -Iseconds)\",\"commit\":\"$(git rev-parse HEAD)\",\"reviewer\":\"codex\"}" > .codex-review-passed
plans/E11-S05a-api.md:398:git add .codex-review-passed
plans/E12-S01.md:785:- [ ] **E2.4 — Commit** the `.codex-review-passed` marker:
plans/E12-S01.md:787:  echo "$(git rev-parse HEAD)" > .codex-review-passed
plans/E12-S01.md:788:  git add .codex-review-passed
plans/E12-S01.md:820:  - [x] Codex review pass (.codex-review-passed marker committed)
plans/E12-S03a.md:1851:Expected: `.codex-review-passed` marker written.
plans/E12-S03b.md:767:Expected output: `.codex-review-passed` written.
technician-app/.claude/settings.json:21:            "command": "bash -c 'if [ -n \"$CLAUDE_OVERRIDE_REASON\" ]; then exit 0; fi; [ -f .codex-review-passed ] && [ \"$(jq -r .commit .codex-review-passed)\" = \"$(git rev-parse HEAD)\" ] || echo \"{\\\"decision\\\":\\\"block\\\",\\\"reason\\\":\\\"Run /codex-review-gate before push.\\\"}\"'",

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Force -Path 'api','customer-app','technician-app','admin-web' -Filter '.codex-review-passed' | Format-Table FullName,Length; Get-Content -LiteralPath 'customer-app/.claude/settings.json'" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 2238ms:
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'if [ -n \"$CLAUDE_OVERRIDE_REASON\" ]; then echo \"{\\\"ts\\\":\\\"$(date -Iseconds)\\\",\\\"reason\\\":\\\"$CLAUDE_OVERRIDE_REASON\\\",\\\"hook\\\":\\\"bmad-gate\\\"}\" >> ~/.claude/override-log.jsonl; exit 0; fi; FILE=$(jq -r \".tool_input.file_path // empty\"); case \"$FILE\" in *\"/app/src/main/\"*) for f in docs/prd.md docs/architecture.md .bmad-readiness-passed; do [ -f \"$f\" ] || { echo \"{\\\"decision\\\":\\\"block\\\",\\\"reason\\\":\\\"BMAD gate: $f missing.\\\"}\"; exit 0; }; done;; esac'",
            "timeout": 10
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(git push *)",
            "command": "bash -c 'if [ -n \"$CLAUDE_OVERRIDE_REASON\" ]; then exit 0; fi; [ -f .codex-review-passed ] && [ \"$(jq -r .commit .codex-review-passed)\" = \"$(git rev-parse HEAD)\" ] || echo \"{\\\"decision\\\":\\\"block\\\",\\\"reason\\\":\\\"Run /codex-review-gate before push.\\\"}\"'",
            "timeout": 10
          }
        ]
      }
    ]
  }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force -Recurse -Filter settings.json | Where-Object { $_.FullName -like '"'*\\.claude\\settings.json' } | Select-Object FullName" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 5252ms:

FullName                                                                        
--------                                                                        
C:\Alok\Business Projects\Urbanclap-sprint4\admin-web\.claude\settings.json     
C:\Alok\Business Projects\Urbanclap-sprint4\api\.claude\settings.json           
C:\Alok\Business Projects\Urbanclap-sprint4\customer-app\.claude\settings.json  
C:\Alok\Business Projects\Urbanclap-sprint4\technician-app\.claude\settings.json



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Path '.github/workflows' -Filter '*.yml' | ForEach-Object { "'$_.Name; Select-String -Path $_.FullName -Pattern '"'MARKER|codex-review-passed|jq -r' -Context 2,3 }" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1362ms:
admin-ship.yml
api-ship.yml
core-nav-ship.yml
customer-ship.yml
design-system-ship.yml
docs-ship.yml
paparazzi-record.yml
technician-ship.yml

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path '.github/workflows/*.yml','.github/workflows/*.yaml' -Pattern 'codex|review|marker|jq' -CaseSensitive:"'$false -Context 2,3' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1434ms:

  .github\workflows\admin-ship.yml:154:    needs: [quality-gate, e2e-and-a11y]
  .github\workflows\admin-ship.yml:155:    # Production deploy on main push or manual dispatch only.
> .github\workflows\admin-ship.yml:156:    # PR previews are intentionally NOT auto-deployed — keeps Free-tier env
  .github\workflows\admin-ship.yml:157:    # surface small and avoids leaking pre-merge UI to the public SWA URL.
  .github\workflows\admin-ship.yml:158:    if: github.ref == 'refs/heads/main' && (github.event_name == 'push' || 
github.event_name == 'workflow_dispatch')
  .github\workflows\admin-ship.yml:159:    steps:
  .github\workflows\api-ship.yml:216:            status_code="$(curl -sS -o /tmp/api-health.json -w '%{http_code}' 
"$health_url" || true)"
  .github\workflows\api-ship.yml:217:            if [ "$status_code" = "200" ]; then
> .github\workflows\api-ship.yml:218:              if jq -e --arg commit "$expected_commit" '.status == "ok" and 
.commit == $commit' /tmp/api-health.json >/dev/null; then
  .github\workflows\api-ship.yml:219:                cat /tmp/api-health.json
  .github\workflows\api-ship.yml:220:                exit 0
  .github\workflows\api-ship.yml:221:              fi



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path '.githooks','.github','tools' -File | Select-String -Pattern 'codex-review-passed|jq -r .commit|jq' -CaseSensitive:"'$false -Context 2,3' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 801ms:

  .github\workflows\api-ship.yml:216:            status_code="$(curl -sS -o /tmp/api-health.json -w '%{http_code}' 
"$health_url" || true)"
  .github\workflows\api-ship.yml:217:            if [ "$status_code" = "200" ]; then
> .github\workflows\api-ship.yml:218:              if jq -e --arg commit "$expected_commit" '.status == "ok" and 
.commit == $commit' /tmp/api-health.json >/dev/null; then
  .github\workflows\api-ship.yml:219:                cat /tmp/api-health.json
  .github\workflows\api-ship.yml:220:                exit 0
  .github\workflows\api-ship.yml:221:              fi
  tools\bootstrap-admin-web-deploy.sh:53:command -v az >/dev/null || { echo "az CLI not found" >&2; exit 1; }
  tools\bootstrap-admin-web-deploy.sh:54:command -v gh >/dev/null || { echo "gh CLI not found" >&2; exit 1; }
> tools\bootstrap-admin-web-deploy.sh:55:command -v jq >/dev/null || { echo "jq not found" >&2; exit 1; }
  tools\bootstrap-admin-web-deploy.sh:56:
  tools\bootstrap-admin-web-deploy.sh:57:az account show >/dev/null 2>&1 || { echo "az not logged in — run 'az login'" 
>&2; exit 1; }
  tools\bootstrap-admin-web-deploy.sh:58:gh auth status >/dev/null 2>&1 || { echo "gh not logged in — run 'gh auth 
login'" >&2; exit 1; }
  tools\bootstrap-admin-web-deploy.sh:59:
> tools\bootstrap-admin-web-deploy.sh:60:FB_API_KEY="$(jq -er '.apiKey' "$FIREBASE_CONFIG_PATH")"
> tools\bootstrap-admin-web-deploy.sh:61:FB_AUTH_DOMAIN="$(jq -er '.authDomain' "$FIREBASE_CONFIG_PATH")"
> tools\bootstrap-admin-web-deploy.sh:62:FB_PROJECT_ID="$(jq -er '.projectId' "$FIREBASE_CONFIG_PATH")"
  tools\bootstrap-admin-web-deploy.sh:63:
  tools\bootstrap-admin-web-deploy.sh:64:echo "==> Subscription: $(az account show --query 'name' -o tsv)"
  tools\bootstrap-admin-web-deploy.sh:65:echo "==> GH repo:      $(gh repo view --json nameWithOwner -q 
.nameWithOwner)"



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Force -Recurse -Path '.githooks' | Format-List FullName,Length; foreach ("'$f in Get-ChildItem -Force -Recurse -File -Path '"'.githooks') { '--- '+"'$f.FullName; Get-Content -LiteralPath $f.FullName }' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 668ms:


FullName : C:\Alok\Business Projects\Urbanclap-sprint4\.githooks\pre-commit
Length   : 3575

FullName : C:\Alok\Business Projects\Urbanclap-sprint4\.githooks\pre-push
Length   : 1864



--- C:\Alok\Business Projects\Urbanclap-sprint4\.githooks\pre-commit
#!/usr/bin/env bash
# Pre-commit secrets scanner.
# Blocks commits containing real API keys, tokens, private keys, or hardcoded
# credentials. Uses grep patterns against the staged diff only.
# Install: git config core.hooksPath .githooks  (already set in .git/config)
set -euo pipefail

STAGED_DIFF=$(git diff --cached --unified=0)

if [ -z "$STAGED_DIFF" ]; then
  exit 0
fi

FOUND=0

check() {
  local label="$1"
  local pattern="$2"
  if echo "$STAGED_DIFF" | grep -qP "^\+(?!\+\+).*${pattern}"; then
    echo "  [SECRETS] $label"
    # Show the offending lines (redact value after first 6 chars)
    echo "$STAGED_DIFF" | grep -P "^\+(?!\+\+).*${pattern}" | sed 's/\(.\{6\}\).*/\1***/' | head -5
    FOUND=1
  fi
}

echo ""
echo "pre-commit: scanning staged diff for secrets..."

# Real Firebase / Google API keys (AIza... 39-char keys)
check "Google/Firebase API key"        'AIza[0-9A-Za-z\-_]{35}'

# Google OAuth client ID
check "Google OAuth client ID"         '[0-9]{12,}-[A-Za-z0-9_]{32}\.apps\.googleusercontent\.com'

# Firebase server key (FCM legacy)
check "Firebase FCM server key"        'AAAA[A-Za-z0-9_\-]{7}:[A-Za-z0-9_\-]{140}'

# Azure storage / Cosmos connection strings
check "Azure connection string"        'AccountKey=[A-Za-z0-9+/]{43}='
check "Azure SAS token"                'sig=[A-Za-z0-9%]{40,}'

# Generic high-entropy secrets assigned to common key names
# Matches: api_key = "abc...xyz", secret: "abc...xyz", token = "abc...xyz"
# Excludes: process.env, os.environ, PLACEHOLDER, example, your_, <, ${
check "Hardcoded secret assignment"    '(api[_-]?key|secret|password|private[_-]?key|auth[_-]?token|access[_-]?token)\s*[=:]\s*['\''"][A-Za-z0-9+/\-_\.]{32,}['\''"]'

# PEM private key headers
check "PEM private key"               'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY'

# AWS keys
check "AWS access key"                'AKIA[0-9A-Z]{16}'
check "AWS secret"                    'aws[_\-]?secret[_\-]?access[_\-]?key\s*[=:]\s*[A-Za-z0-9/+=]{40}'

# Razorpay live key
check "Razorpay live secret key"      'rzp_live_[A-Za-z0-9]{20}'

# Stripe live key
check "Stripe live secret key"        'sk_live_[A-Za-z0-9]{24,}'

# Allowlist: these patterns are safe and must not be flagged
# (PLACEHOLDER values, process.env references, test fixtures with 'fake'/'test'/'mock')
if [ "$FOUND" -eq 1 ]; then
  # Re-check: are ALL matches from safe patterns?
  REAL_FOUND=0
  while IFS= read -r line; do
    # Skip placeholder / env-var / test lines
    echo "$line" | grep -qiP 'PLACEHOLDER|process\.env|System\.getenv|os\.environ|fake|fakekey|example\.com|your_|<[A-Z_]+>|\$\{|0{10,}|test-' || REAL_FOUND=1
  done < <(echo "$STAGED_DIFF" | grep -P "^\+(?!\+\+).*(AIza[0-9A-Za-z\-_]{35}|[0-9]{12,}-[A-Za-z0-9_]{32}\.apps\.googleusercontent\.com|AAAA[A-Za-z0-9_\-]{7}:[A-Za-z0-9_\-]{140}|AccountKey=[A-Za-z0-9+/]{43}=|sig=[A-Za-z0-9%]{40,}|(api[_-]?key|secret|password|private[_-]?key|auth[_-]?token|access[_-]?token)\s*[=:]\s*[\"'][A-Za-z0-9+/\-_\.]{32,}[\"']|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|AKIA[0-9A-Z]{16}|aws[_\-]?secret[_\-]?access[_\-]?key\s*[=:]\s*[A-Za-z0-9/+=]{40}|rzp_live_[A-Za-z0-9]{20}|sk_live_[A-Za-z0-9]{24,})" 2>/dev/null || true)

  if [ "$REAL_FOUND" -eq 1 ]; then
    echo ""
    echo "pre-commit: BLOCKED â€” potential secret in staged changes."
    echo "Review the lines above. If this is a false positive, add the value"
    echo "to .githooks/secrets-allowlist.txt or use:"
    echo "  CLAUDE_OVERRIDE_REASON='<reason>' git commit --no-verify"
    echo ""
    exit 1
  fi
fi

echo "pre-commit: no secrets detected."
exit 0
--- C:\Alok\Business Projects\Urbanclap-sprint4\.githooks\pre-push
#!/usr/bin/env bash
# Pre-push hook â€” runs the appropriate smoke gate before every push.
# Enforces: compile + lint + tests + coverage locally so CI stays lean.
# Install once: git config core.hooksPath .githooks
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
REMOTE="$1"
REMOTE_URL="$2"

# Collect files changed vs upstream (existing branch) or vs main base (new branch).
# Never diff against empty tree â€” that triggers all smoke gates on every new branch.
REMOTE_REF=$(git rev-parse --verify "@{u}" 2>/dev/null || echo "")
if [ -n "$REMOTE_REF" ]; then
  CHANGED=$(git diff --name-only "$REMOTE_REF" HEAD)
else
  MERGE_BASE=$(git merge-base origin/main HEAD 2>/dev/null || git rev-parse HEAD^)
  CHANGED=$(git diff --name-only "$MERGE_BASE" HEAD)
fi

ran_any=0

run_gate() {
  local script="$1"; shift
  echo ""
  echo ">>> $script $*"
  bash "$REPO_ROOT/$script" "$@"
  ran_any=1
}

# Customer app
if echo "$CHANGED" | grep -qE '^(customer-app|design-system)/'; then
  run_gate tools/pre-codex-smoke.sh customer-app
fi

# Technician app
if echo "$CHANGED" | grep -qE '^technician-app/'; then
  run_gate tools/pre-codex-smoke.sh technician-app
fi

# API
if echo "$CHANGED" | grep -qE '^api/'; then
  run_gate tools/pre-codex-smoke-api.sh
fi

# Admin web
if echo "$CHANGED" | grep -qE '^admin-web/'; then
  run_gate tools/pre-codex-smoke-web.sh
fi

# Design system (standalone Gradle module, not customer-app)
if echo "$CHANGED" | grep -qE '^design-system/' && ! echo "$CHANGED" | grep -qE '^customer-app/'; then
  echo ""
  echo ">>> design-system smoke gate"
  cd "$REPO_ROOT/design-system"
  ./gradlew assembleRelease ktlintCheck testDebugUnitTest --quiet 2>&1 | tail -20
  ran_any=1
fi

if [ "$ran_any" -eq 0 ]; then
  echo "pre-push: no sub-project changes detected â€” skipping smoke gate"
fi

echo ""
echo "pre-push smoke gate PASSED"

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'api/src/functions/rating-escalate.ts' | Select-Object -Skip 50 -First 80" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 723ms:
    }
    throw err;
  }
  if (existingRating?.customerSubmittedAt) {
    return { status: 409, jsonBody: { code: 'RATING_ALREADY_SUBMITTED' } };
  }
  if (existing) return { status: 409, jsonBody: { code: 'SHIELD_ALREADY_ESCALATED' } };

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Deterministic ID: concurrent duplicate requests both try to create the same document ID;
  // Cosmos rejects the second with a conflict, which we surface as SHIELD_ALREADY_ESCALATED.
  const shieldId = createHash('sha256')
    .update(`shield:${bookingId}:${customer.customerId}`)
    .digest('hex')
    .slice(0, 36);

  const doc: ComplaintDoc = {
    id: shieldId,
    orderId: bookingId,
    customerId: customer.customerId,
    technicianId: booking.technicianId ?? '',
    description: `Rating Shield â€” booking ${bookingId} â€” draft: ${parsed.data.draftOverall}â˜…`,
    type: 'RATING_SHIELD',
    draftOverall: parsed.data.draftOverall,
    ...(parsed.data.draftComment !== undefined ? { draftComment: parsed.data.draftComment } : {}),
    status: 'NEW',
    internalNotes: [],
    slaDeadlineAt: expiresAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    escalated: false,
    ackBreached: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  try {
    await createComplaint(doc);
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err) {
      const code = (err as { code: number }).code;
      if (code === 404) return { status: 503, jsonBody: { code: 'CONTAINER_NOT_PROVISIONED' } };
      if (code === 409) return { status: 409, jsonBody: { code: 'SHIELD_ALREADY_ESCALATED' } };
    }
    throw err;
  }

  const _ts = new Date().toISOString();
  void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', action: 'RATING_SHIELD_ESCALATED', resourceType: 'booking', resourceId: bookingId, payload: { bookingId, complaintId: doc.id, draftOverall: parsed.data.draftOverall }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);

  sendOwnerRatingShieldAlert({
    bookingId,
    technicianId: booking.technicianId ?? '',
    draftOverall: parsed.data.draftOverall,
  }).catch((err: unknown) => ctx.error('FCM OWNER_RATING_SHIELD_ALERT failed', err));

  return { status: 201, jsonBody: { complaintId: doc.id, expiresAt: expiresAt.toISOString() } };
}

app.http('escalateRating', {
  methods: ['POST'],
  route: 'v1/ratings/{bookingId}/escalate',
  authLevel: 'anonymous',
  handler: requireCustomer(escalateRatingHandler),
});

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'api/src/cosmos/dispatch-attempt-repository.ts'; Get-ChildItem -Recurse -Path 'technician-app/app/src/main/kotlin' -Include '*.kt' | Select-String -Pattern 'DeepLinkUri\\.parse|parseDeepLink|JOB_OFFER|sourceId|entityId' -Context 1,3 | Select-Object -First 160" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 899ms:
import type { Resource } from '@azure/cosmos';
import { getDispatchAttemptsContainer } from './client.js';
import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';

export const dispatchAttemptRepo = {
  async getByBookingId(bookingId: string): Promise<DispatchAttemptDoc | null> {
    const { resources } = await getDispatchAttemptsContainer()
      .items
      .query<DispatchAttemptDoc>({
        query: 'SELECT * FROM c WHERE c.bookingId = @bookingId ORDER BY c._ts DESC OFFSET 0 LIMIT 1',
        parameters: [{ name: '@bookingId', value: bookingId }],
      })
      .fetchAll();
    return resources[0] ?? null;
  },

  async getAttemptedTechnicianIds(bookingId: string): Promise<string[]> {
    const { resources } = await getDispatchAttemptsContainer()
      .items
      .query<Pick<DispatchAttemptDoc, 'technicianIds'>>({
        query: 'SELECT c.technicianIds FROM c WHERE c.bookingId = @bookingId',
        parameters: [{ name: '@bookingId', value: bookingId }],
      })
      .fetchAll();
    return [...new Set(resources.flatMap((attempt) => attempt.technicianIds))];
  },

  async acceptAttempt(id: string, bookingId: string): Promise<DispatchAttemptDoc | null> {
    const container = getDispatchAttemptsContainer();
    const { resource } = await container.item(id, id).read<DispatchAttemptDoc & Resource>();
    if (!resource) return null;
    if (resource.bookingId !== bookingId) return null;
    if (resource.status !== 'PENDING') return null;

    const updated: DispatchAttemptDoc = {
      id: resource.id,
      bookingId: resource.bookingId,
      technicianIds: resource.technicianIds,
      sentAt: resource.sentAt,
      expiresAt: resource.expiresAt,
      status: 'ACCEPTED',
    };

    try {
      const { resource: replaced } = await container.item(id, id).replace<DispatchAttemptDoc>(
        updated,
        { accessCondition: { type: 'IfMatch', condition: resource._etag } },
      );
      return replaced ?? null;
    } catch (err: unknown) {
      if (isCosmosConflict(err)) return null;
      throw err;
    }
  },

  async declineAttempt(id: string, bookingId: string): Promise<DispatchAttemptDoc | null> {
    const container = getDispatchAttemptsContainer();
    const { resource } = await container.item(id, id).read<DispatchAttemptDoc & Resource>();
    if (!resource) return null;
    if (resource.bookingId !== bookingId) return null;
    if (resource.status !== 'PENDING') return null;
    if (new Date(resource.expiresAt) <= new Date()) return null;

    const updated: DispatchAttemptDoc = {
      id: resource.id,
      bookingId: resource.bookingId,
      technicianIds: resource.technicianIds,
      sentAt: resource.sentAt,
      expiresAt: resource.expiresAt,
      status: 'EXPIRED',
    };

    try {
      const { resource: replaced } = await container.item(id, id).replace<DispatchAttemptDoc>(
        updated,
        { accessCondition: { type: 'IfMatch', condition: resource._etag } },
      );
      return replaced ?? null;
    } catch (err: unknown) {
      if (isCosmosConflict(err)) return null;
      throw err;
    }
  },
};

function isCosmosConflict(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 412;
}

  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:40: * 
[PendingActionIngestor] via [NotificationRouter] parsing. Legacy in-process
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:41: * event bus 
routing (JOB_OFFER, RATING_PROMPT_TECHNICIAN, EARNINGS_UPDATE,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:42: * 
RATING_RECEIVED) is preserved for backward-compatibility until E11-S01b-2.
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:43: *
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:44: * Notification 
channels (registered in [HomeservicesTechnicianApplication.onCreate]):
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:65:        private 
const val REQUEST_CODE_RATING = 1001
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:66:        private 
const val REQUEST_CODE_JOB_OFFER = 1002
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:67:        private 
const val REQUEST_CODE_ERASURE = 1003
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:68:        private 
const val REQUEST_CODE_EARNINGS = 1004
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:69:        private 
const val REQUEST_CODE_RATING_PROMPT = 1005
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:70:        private 
const val NOTIFICATION_ID_JOB_OFFER = 3001
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:71:        private 
const val NOTIFICATION_ID_ERASURE_NOTICE = 3002
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:72:        private 
const val NOTIFICATION_ID_EARNINGS_UPDATE = 3003
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:73:        private 
const val NOTIFICATION_ID_RATING_PROMPT = 3004
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:183:     *      
and show a tray notification with deep-link PendingIntent.
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:184:     *   2. 
JOB_OFFER additionally triggers the in-process [JobOfferEventBus] for the
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:185:     *      
full-screen offer UI (EventBus removal deferred to E11-S01b-2).
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:186:     *   3. 
Legacy event-bus types not yet in core-nav schema fall through to the existing switch.
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:187:     *
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:261:            }
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:262:            
"JOB_OFFER" -> {
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:263:               
 val offer = parseJobOffer(data) ?: return
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:264:               
 eventBus.tryEmit(offer)
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:265:               
 showJobOfferNotification(offer)
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:301:               
 this,
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:302:               
 REQUEST_CODE_JOB_OFFER,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:303:               
 fullScreenIntent,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:304:               
 PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:305:            )
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:310:               
 this,
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:311:               
 REQUEST_CODE_JOB_OFFER + 1,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:312:               
 tapIntent,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:313:               
 PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:314:            )
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:329:
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:330:        
nm.notify(NOTIFICATION_ID_JOB_OFFER, notification)
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:331:    }
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:332:
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:333:    private 
fun showAppealDecisionNotification(
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:666:            
data["actionId"]
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:667:               
 ?: "${intent.type.name}:technician:$userId:${intent.type.name.lowercase()}:${intent.entityId}"
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:668:        val 
version = data["version"]?.toLongOrNull() ?: 1L
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:669:        val 
priority =
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:670:            
runCatching {
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:692:            
entityType = entityType,
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:693:            
entityId = intent.entityId,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:694:            
routeUri = deepLinkUri,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:695:            
priority = priority,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:696:            
status = com.homeservices.corenav.PendingActionStatus.ACTIVE,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:96:        
WHERE type = 'PHOTO_UPLOAD_PENDING'
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:97:         
 AND entityId = :bookingId
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:98:         
 AND status = 'ACTIVE'
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:99:        
LIMIT 1
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:100:        
""",
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:112:        
WHERE type = 'PHOTO_UPLOAD_PENDING'
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:113:        
  AND entityId = :bookingId
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:114:        
  AND status = 'ACTIVE'
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:115:        
""",
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:116:    )
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:130:        
WHERE type = 'PHOTO_UPLOAD_RETRY'
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:131:        
  AND entityId = :techId
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:132:        
  AND status = 'ACTIVE'
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:133:        
LIMIT 1
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:134:        
""",
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:147:        
WHERE type = 'PHOTO_UPLOAD_RETRY'
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:148:        
  AND entityId = :techId
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:149:        
  AND status = 'ACTIVE'
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:150:        
""",
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:151:    )
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:166:        
WHERE type = 'KYC_SUBMIT_PENDING'
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:167:        
  AND entityId = :techId
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:168:        
  AND status = 'ACTIVE'
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:169:        
""",
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:170:    )
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:185:        
WHERE type = 'KYC_RESUME'
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:186:        
  AND entityId = :techId
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:187:        
  AND status = 'ACTIVE'
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:188:        
""",
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionDao.kt:189:    )
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionEntity.kt:28:    
public val entityType: String,
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionEntity.kt:29:    
public val entityId: String,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionEntity.kt:30:    
public val routeUri: String,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionEntity.kt:31:    
public val priority: String,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionEntity.kt:32:    
public val status: String,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:136:         
   entityType = entityType,
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:137:         
   entityId = entityId,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:138:         
   routeUri = routeUri,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:139:         
   priority = PendingActionPriority.valueOf(priority),
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:140:         
   status = PendingActionStatus.valueOf(status),
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:155:         
   entityType = entityType,
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:156:         
   entityId = entityId,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:157:         
   routeUri = routeUri,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:158:         
   priority = priority.name,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:159:         
   status = status.name,
  technician-app\app\src\main\kotlin\com\homeservices\technician\navigation\HomeGraph.kt:122:            when 
(action.type) {
> technician-app\app\src\main\kotlin\com\homeservices\technician\navigation\HomeGraph.kt:123:                
PendingActionType.JOB_OFFER ->
> technician-app\app\src\main\kotlin\com\homeservices\technician\navigation\HomeGraph.kt:124:                    
navController.navigate("activeJob/${action.entityId}")
  technician-app\app\src\main\kotlin\com\homeservices\technician\navigation\HomeGraph.kt:125:                
PendingActionType.RATING_PROMPT_TECHNICIAN ->
> technician-app\app\src\main\kotlin\com\homeservices\technician\navigation\HomeGraph.kt:126:                    
navController.navigate(RatingRoutes.route(action.entityId))
  technician-app\app\src\main\kotlin\com\homeservices\technician\navigation\HomeGraph.kt:127:                
PendingActionType.RATING_RECEIVED ->
  technician-app\app\src\main\kotlin\com\homeservices\technician\navigation\HomeGraph.kt:128:                    
navController.navigate("ratings_transparency")
  technician-app\app\src\main\kotlin\com\homeservices\technician\navigation\HomeGraph.kt:129:                
PendingActionType.EARNINGS_UPDATE ->
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:16: * 
Technician FCM types:
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:17: *   
- JOB_OFFER (entityId = bookingId)
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:18: *   
- RATING_PROMPT_TECHNICIAN (entityId = bookingId)
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:19: *   
- EARNINGS_UPDATE (entityId = earningsId)
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:20: *   
- RATING_RECEIVED (entityId = bookingId)
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:21: *   
- COMPLAINT_UPDATE (entityId = complaintId)
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:22: *   
- SUPPORT_FOLLOWUP (entityId = ticketId)
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:23: *   
- KYC_RESUME (entityId = techId)
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:24: *
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:25: * 
Per E11 spec §2.8: NotificationRouter is a pure parser — no persistence, no network.
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:26: *
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:31: * 
### Shape 1 — projector shape (always present for projector-delivered events):
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:32: *   
`type`, `actionId`, `sourceId`, `payload` (JSON string of PendingActionDoc.payload)
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:33: *
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:34: * 
### Shape 2 — legacy per-type top-level IDs (compat fields, present for some types):
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:35: *   
`bookingId`, `techId`, `earningsId`, `complaintId`, `ticketId` (hoisted from payload)
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:37: * 
Entity ID resolution prefers the per-type legacy field when present (Shape 2), then
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:38: * 
falls back to `sourceId` from the projector shape (Shape 1). This ensures:
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:39: * - 
Existing direct-FCM callers that only send `bookingId` continue to work.
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:40: * - 
Projector-delivered JOB_OFFER / KYC_RESUME / EARNINGS_UPDATE (where the backend
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:41: *   
does NOT hoist a dedicated legacy key) now resolve via `sourceId`.
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:42: */
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:43:@Singl
eton
  
technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:44:public 
class TechnicianNotificationRouter
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:51:      
   *   1. Per-type legacy top-level key (bookingId / techId / earningsId / etc.)
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:52:      
   *   2. `sourceId` (projector shape fallback — actionId is the idempotency key)
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:53:      
   *
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:54:      
   * Returns null if:
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:55:      
   * - `type` key is absent or maps to an unknown [PendingActionType]
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:56:      
   * - No entity ID can be resolved from either shape
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:57:      
   * - Projector shape present but `sourceId` is absent or empty (malformed)
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:58:      
   */
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:59:      
  override fun parseFcmData(data: Map<String, String>): NotificationIntent? =
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:60:      
      resolveTypeAndEntityId(data)?.let { (type, entityId) ->
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:61:      
          NotificationIntent(
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:62:      
              type = type,
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:63:      
              entityId = entityId,
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:64:      
              rawArgs = data.filterKeys { it != "type" },
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:65:      
          )
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:66:      
      }
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:73:      
   */
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:74:      
  private fun resolveTypeAndEntityId(data: Map<String, String>): Pair<PendingActionType, String>? {
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:75:      
      val typeName = data["type"] ?: return null
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:76:      
      val type = runCatching { PendingActionType.valueOf(typeName) }.getOrNull()
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:77:      
      return type?.let { t -> resolveEntityId(t, data)?.let { id -> t to id } }
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:78:      
  }
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:79:
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:80:      
  /**
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:81:      
   * Parse a `homeservices://action/<TYPE>?entityId=<id>` deep-link URI.
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:82:      
   * Delegates to [DeepLinkUri.parse] for scheme/host/query validation.
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:83:      
   */
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:84:      
  override fun parseDeepLink(uri: String): NotificationIntent? = DeepLinkUri.parse(uri)
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:85:
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:86:      
  // ── Private helpers ───────────────────────────────────────────────────
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:87:
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:91:      
   * Tries per-type legacy top-level keys first (Shape 2). If absent, falls back
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:92:      
   * to the projector `sourceId` field (Shape 1). Returns null only if both are
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:93:      
   * absent or empty.
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:94:      
   */
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:95:      
  private fun resolveEntityId(
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:96:      
      type: PendingActionType,
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:97:      
      data: Map<String, String>,
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:98:      
  ): String? {
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:116:
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:117:     
       // Shape 1 fallback: projector sourceId (present for all projector-delivered
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:118:     
       // events — JOB_OFFER, KYC_RESUME, EARNINGS_UPDATE when no legacy key is
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:119:     
       // hoisted, etc.). actionId serves as the idempotency key for ingestor.
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:120:     
       return data["sourceId"]?.takeIf { it.isNotEmpty() }
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:121:     
   }
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:122:    }
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:137:               
                             it.type == PendingActionType.PHOTO_UPLOAD_PENDING &&
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:138:               
                                 it.entityId == bookingId
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:139:               
                         }
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:140:               
                     }
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:141:               
             AuthState.Unauthenticated -> flowOf(false)
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:279:               
     entityType = "booking",
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:280:               
     entityId = bookingId,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:281:               
     routeUri = "homeservices://action/PHOTO_UPLOAD_PENDING?bookingId=$bookingId&stage=$stage",
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:282:               
     priority = com.homeservices.corenav.PendingActionPriority.NORMAL,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:283:               
     status = com.homeservices.corenav.PendingActionStatus.ACTIVE,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCard.kt:114:    when (type) 
{
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCard.kt:115:        
PendingActionType.JOB_OFFER ->
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCard.kt:116:            
CardVisuals(
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCard.kt:117:                
Amber,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCard.kt:118:                
AmberSoft,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCard.kt:119:                
Icons.Default.Work,
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCard.kt:120:                
stringResource(R.string.dashboard_pending_action_job_offer),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCard.kt:121:            )
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCard.kt:122:        
PendingActionType.RATING_PROMPT_TECHNICIAN ->
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCard.kt:123:            
CardVisuals(
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\TechnicianDashboardViewModel.kt:75:      
          setOf(
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\TechnicianDashboardViewModel.kt:76:      
              PendingActionType.JOB_OFFER,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\TechnicianDashboardViewModel.kt:77:      
              PendingActionType.RATING_PROMPT_TECHNICIAN,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\TechnicianDashboardViewModel.kt:78:      
              PendingActionType.RATING_RECEIVED,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\dashboard\TechnicianDashboardViewModel.kt:79:      
              PendingActionType.EARNINGS_UPDATE,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferFullScreenActivity.kt:14:/**
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferFullScreenActivity.kt:15: * 
Full-screen Activity shown when a JOB_OFFER FCM arrives while the device is locked.
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferFullScreenActivity.kt:16: * 
Declared with showWhenLocked + turnScreenOn in the manifest so it surfaces over
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferFullScreenActivity.kt:17: * the 
lock screen without requiring the user to unlock first.
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferFullScreenActivity.kt:18: *
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:87:                
JobOfferResultContent(
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:88:                    
message = stringResource(R.string.job_offer_unavailable),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:89:                    
isSuccess = false,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:90:                )
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:91:            is 
JobOfferUiState.Offering -> {
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:100:                
JobOfferResultContent(
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:101:                    
message = stringResource(R.string.job_offer_accepted),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:102:                    
isSuccess = true,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:103:                )
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:104:            is 
JobOfferUiState.Declined ->
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:105:                
JobOfferResultContent(
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:106:                    
message = stringResource(R.string.job_offer_declined),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:107:                    
isSuccess = false,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:108:                )
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:109:            is 
JobOfferUiState.Expired ->
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:110:                
JobOfferResultContent(
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:111:                    
message = stringResource(R.string.job_offer_expired),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:112:                    
isSuccess = false,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:113:                )
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:114:        }
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:146:        
Column(horizontalAlignment = Alignment.CenterHorizontally) {
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:147:            
HsTrustBadge(text = stringResource(R.string.job_offer_new_request))
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:148:            
Spacer(Modifier.height(18.dp))
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:149:            
Box(contentAlignment = Alignment.Center) {
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:150:                
CircularProgressIndicator(
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:163:                    
Text(
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:164:                    
    text = stringResource(R.string.job_offer_seconds),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:165:                    
    style = MaterialTheme.typography.labelSmall,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:166:                    
    color = MaterialTheme.colorScheme.onSurfaceVariant,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:167:                    
)
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:181:                    
Text(
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:182:                    
    text = stringResource(R.string.job_offer_why_you),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:183:                    
    style = MaterialTheme.typography.bodySmall,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:184:                    
    color = MaterialTheme.colorScheme.onSurfaceVariant,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:185:                    
    textAlign = TextAlign.Center,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:187:                }
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:188:                
HsInfoRow(label = stringResource(R.string.job_offer_address), value = offer.addressText)
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:189:                
HsInfoRow(
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:190:                    
label = stringResource(R.string.job_offer_slot),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:191:                    
value = "${offer.slotDate} ${offer.slotWindow}",
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:192:                )
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:193:                
Row(verticalAlignment = Alignment.CenterVertically) {
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:195:                    
    Text(
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:196:                    
        text = stringResource(R.string.job_offer_distance),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:197:                    
        style = MaterialTheme.typography.labelMedium,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:198:                    
        color = MaterialTheme.colorScheme.onSurfaceVariant,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:199:                    
    )
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:200:                    
    Text(
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:201:                    
        text = stringResource(R.string.job_offer_distance_km, offer.distanceKm),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:202:                    
        style = MaterialTheme.typography.bodyLarge,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:203:                    
        fontWeight = FontWeight.SemiBold,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:204:                    
    )
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:207:                    
    Text(
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:208:                    
        text = stringResource(R.string.job_offer_earnings),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:209:                    
        style = MaterialTheme.typography.labelMedium,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:210:                    
        color = MaterialTheme.colorScheme.onSurfaceVariant,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:211:                    
    )
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:222:            
HsPrimaryButton(
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:223:                
text = stringResource(R.string.job_offer_accept),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:224:                
onClick = onAccept,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:225:                
modifier = Modifier.fillMaxWidth(),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:226:            )
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:227:            
HsSecondaryButton(
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:228:                
text = stringResource(R.string.job_offer_decline),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:229:                
onClick = onDecline,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:230:                
modifier = Modifier.fillMaxWidth(),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferScreen.kt:231:            )
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:214:                        
entityType = "kyc",
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:215:                        
entityId = techId,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:216:                        
routeUri = "homeservices://kyc",
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:217:                        
priority = PendingActionPriority.NORMAL,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:218:                        
status = PendingActionStatus.ACTIVE,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:243:                        
entityType = "kyc",
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:244:                        
entityId = techId,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:245:                        
routeUri = fileUri.toString(),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:246:                        
priority = PendingActionPriority.HIGH,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:247:                        
status = PendingActionStatus.ACTIVE,



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'technician-app/app/src/main/kotlin/com/homeservices/technician/notification/TechnicianNotificationRouter.kt' | Select-Object -First 150" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 996ms:
package com.homeservices.technician.notification

import com.homeservices.corenav.DeepLinkUri
import com.homeservices.corenav.NotificationIntent
import com.homeservices.corenav.NotificationRouter
import com.homeservices.corenav.PendingActionType
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Technician-app implementation of [NotificationRouter].
 *
 * Parses raw FCM data payloads and `homeservices://` deep-link URIs into
 * [NotificationIntent] values for downstream processing by [PendingActionIngestor].
 *
 * Technician FCM types:
 *   - JOB_OFFER (entityId = bookingId)
 *   - RATING_PROMPT_TECHNICIAN (entityId = bookingId)
 *   - EARNINGS_UPDATE (entityId = earningsId)
 *   - RATING_RECEIVED (entityId = bookingId)
 *   - COMPLAINT_UPDATE (entityId = complaintId)
 *   - SUPPORT_FOLLOWUP (entityId = ticketId)
 *   - KYC_RESUME (entityId = techId)
 *
 * Per E11 spec Â§2.8: NotificationRouter is a pure parser â€” no persistence, no network.
 *
 * ## Dual-shape payload support (E11-S01b-1 fix)
 *
 * The backend projector emits two overlapping shapes in the same FCM data map:
 *
 * ### Shape 1 â€” projector shape (always present for projector-delivered events):
 *   `type`, `actionId`, `sourceId`, `payload` (JSON string of PendingActionDoc.payload)
 *
 * ### Shape 2 â€” legacy per-type top-level IDs (compat fields, present for some types):
 *   `bookingId`, `techId`, `earningsId`, `complaintId`, `ticketId` (hoisted from payload)
 *
 * Entity ID resolution prefers the per-type legacy field when present (Shape 2), then
 * falls back to `sourceId` from the projector shape (Shape 1). This ensures:
 * - Existing direct-FCM callers that only send `bookingId` continue to work.
 * - Projector-delivered JOB_OFFER / KYC_RESUME / EARNINGS_UPDATE (where the backend
 *   does NOT hoist a dedicated legacy key) now resolve via `sourceId`.
 */
@Singleton
public class TechnicianNotificationRouter
    @Inject
    constructor() : NotificationRouter {
        /**
         * Parse a raw FCM data payload into a [NotificationIntent].
         *
         * Entity ID resolution priority (see class-level KDoc for shape details):
         *   1. Per-type legacy top-level key (bookingId / techId / earningsId / etc.)
         *   2. `sourceId` (projector shape fallback â€” actionId is the idempotency key)
         *
         * Returns null if:
         * - `type` key is absent or maps to an unknown [PendingActionType]
         * - No entity ID can be resolved from either shape
         * - Projector shape present but `sourceId` is absent or empty (malformed)
         */
        override fun parseFcmData(data: Map<String, String>): NotificationIntent? =
            resolveTypeAndEntityId(data)?.let { (type, entityId) ->
                NotificationIntent(
                    type = type,
                    entityId = entityId,
                    rawArgs = data.filterKeys { it != "type" },
                )
            }

        /**
         * Resolve the [PendingActionType] and entity ID from the raw FCM data map.
         *
         * Returns null if `type` is absent/unknown or no entity ID can be resolved.
         * Extracted to satisfy detekt ReturnCount limit on [parseFcmData].
         */
        private fun resolveTypeAndEntityId(data: Map<String, String>): Pair<PendingActionType, String>? {
            val typeName = data["type"] ?: return null
            val type = runCatching { PendingActionType.valueOf(typeName) }.getOrNull()
            return type?.let { t -> resolveEntityId(t, data)?.let { id -> t to id } }
        }

        /**
         * Parse a `homeservices://action/<TYPE>?entityId=<id>` deep-link URI.
         * Delegates to [DeepLinkUri.parse] for scheme/host/query validation.
         */
        override fun parseDeepLink(uri: String): NotificationIntent? = DeepLinkUri.parse(uri)

        // â”€â”€ Private helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        /**
         * Resolve the entity ID for a given FCM type from the raw data map.
         *
         * Tries per-type legacy top-level keys first (Shape 2). If absent, falls back
         * to the projector `sourceId` field (Shape 1). Returns null only if both are
         * absent or empty.
         */
        private fun resolveEntityId(
            type: PendingActionType,
            data: Map<String, String>,
        ): String? {
            // Shape 2: per-type legacy top-level key (hoisted by _fcmCompatFields in
            // pending-action-projector.ts for types that older clients need).
            val legacyId =
                when (type) {
                    PendingActionType.COMPLAINT_UPDATE ->
                        data["complaintId"]?.takeIf { it.isNotEmpty() }
                    PendingActionType.SUPPORT_FOLLOWUP ->
                        data["ticketId"]?.takeIf { it.isNotEmpty() }
                    PendingActionType.EARNINGS_UPDATE ->
                        data["earningsId"]?.takeIf { it.isNotEmpty() }
                    PendingActionType.KYC_RESUME ->
                        data["techId"]?.takeIf { it.isNotEmpty() }
                    else ->
                        data["bookingId"]?.takeIf { it.isNotEmpty() }
                }

            if (legacyId != null) return legacyId

            // Shape 1 fallback: projector sourceId (present for all projector-delivered
            // events â€” JOB_OFFER, KYC_RESUME, EARNINGS_UPDATE when no legacy key is
            // hoisted, etc.). actionId serves as the idempotency key for ingestor.
            return data["sourceId"]?.takeIf { it.isNotEmpty() }
        }
    }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'api/src' -Include '*.ts' | Select-String -Pattern 'send.*KYC_RESUME|KYC_RESUME|EARNINGS_UPDATE|earningsId|send.*JobOffer|JOB_OFFER|sourceId' -Context 2,4 | Select-Object -First 220" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 867ms:

  api\src\cosmos\audit-log-repository.ts:30:    parameters.push({ name: '@resourceType', value: params.resourceType });
  api\src\cosmos\audit-log-repository.ts:31:  }
> api\src\cosmos\audit-log-repository.ts:32:  if (params.resourceId !== undefined) {
> api\src\cosmos\audit-log-repository.ts:33:    conditions.push('c.resourceId = @resourceId');
> api\src\cosmos\audit-log-repository.ts:34:    parameters.push({ name: '@resourceId', value: params.resourceId });
  api\src\cosmos\audit-log-repository.ts:35:  }
  api\src\cosmos\audit-log-repository.ts:36:  if (params.dateFrom !== undefined) {
  api\src\cosmos\audit-log-repository.ts:37:    conditions.push('c.timestamp >= @dateFrom');
  api\src\cosmos\audit-log-repository.ts:38:    parameters.push({ name: '@dateFrom', value: params.dateFrom });
  api\src\cosmos\audit-log-repository.ts:44:
  api\src\cosmos\audit-log-repository.ts:45:  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND 
')}` : '';
> api\src\cosmos\audit-log-repository.ts:46:  const query = `SELECT c.id, c.adminId, c.role, c.action, c.resourceType, 
c.resourceId, c.payload, c.ip, c.userAgent, c.timestamp FROM c ${where} ORDER BY c.timestamp DESC`;
  api\src\cosmos\audit-log-repository.ts:47:
  api\src\cosmos\audit-log-repository.ts:48:  const iterator = getCosmosClient()
  api\src\cosmos\audit-log-repository.ts:49:    .database(DB_NAME)
  api\src\cosmos\audit-log-repository.ts:50:    .container(CONTAINER)
  api\src\cosmos\pending-action-repository.ts:26: * The `role` filter is mandatory (DPDP isolation): a user whose 
Firebase UID is shared
  api\src\cosmos\pending-action-repository.ts:27: * across customer and technician contexts must NOT receive actions 
intended for the
> api\src\cosmos\pending-action-repository.ts:28: * other role. Without this filter, a customer-app call could surface 
technician JOB_OFFER
  api\src\cosmos\pending-action-repository.ts:29: * actions and vice versa.
  api\src\cosmos\pending-action-repository.ts:30: */
  api\src\cosmos\pending-action-repository.ts:31:export async function getActivePendingActions(
  api\src\cosmos\pending-action-repository.ts:32:  userId: string,
  api\src\cosmos\user-data-cascade-writes.ts:209:  /**
  api\src\cosmos\user-data-cascade-writes.ts:210:   * Audit log immutability invariant: NEVER delete audit entries.
> api\src\cosmos\user-data-cascade-writes.ts:211:   * Only the resourceId field is anonymized so the entries remain 
queryable
  api\src\cosmos\user-data-cascade-writes.ts:212:   * by the operator while no longer linking back to the 
natural-person uid.
  api\src\cosmos\user-data-cascade-writes.ts:213:   */
> api\src\cosmos\user-data-cascade-writes.ts:214:  async anonymizeAuditLogResourceId(uid: string, anonymizedHash: 
string): Promise<number> {
  api\src\cosmos\user-data-cascade-writes.ts:215:    const container = 
getCosmosClient().database(DB_NAME).container(AUDIT_LOG_CONTAINER);
  api\src\cosmos\user-data-cascade-writes.ts:216:    const { resources } = await container
  api\src\cosmos\user-data-cascade-writes.ts:217:      .items.query<Record<string, unknown>>({
> api\src\cosmos\user-data-cascade-writes.ts:218:        query: 'SELECT * FROM c WHERE c.resourceId = @uid',
  api\src\cosmos\user-data-cascade-writes.ts:219:        parameters: [{ name: '@uid', value: uid }],
  api\src\cosmos\user-data-cascade-writes.ts:220:      })
  api\src\cosmos\user-data-cascade-writes.ts:221:      .fetchAll();
  api\src\cosmos\user-data-cascade-writes.ts:222:    let n = 0;
  api\src\cosmos\user-data-cascade-writes.ts:223:    const anonId = `deleted-${anonymizedHash.slice(0, 16)}`;
  api\src\cosmos\user-data-cascade-writes.ts:224:    for (const r of resources) {
> api\src\cosmos\user-data-cascade-writes.ts:225:      const updated: Record<string, unknown> = { ...r, resourceId: 
anonId };
  api\src\cosmos\user-data-cascade-writes.ts:226:      const id = r['id'] as string;
  api\src\cosmos\user-data-cascade-writes.ts:227:      const pk = (r['partitionKey'] as string) ?? '';
  api\src\cosmos\user-data-cascade-writes.ts:228:      await container.item(id, pk).replace(updated);
  api\src\cosmos\user-data-cascade-writes.ts:229:      n += 1;
  api\src\cosmos\user-data-export-reads.ts:149:      .items.query<Record<string, unknown>>({
  api\src\cosmos\user-data-export-reads.ts:150:        query:
> api\src\cosmos\user-data-export-reads.ts:151:          'SELECT * FROM c WHERE c.resourceId = @uid AND c.timestamp >= 
@since ORDER BY c.timestamp DESC',
  api\src\cosmos\user-data-export-reads.ts:152:        parameters: [
  api\src\cosmos\user-data-export-reads.ts:153:          { name: '@uid', value: uid },
  api\src\cosmos\user-data-export-reads.ts:154:          { name: '@since', value: sinceIso },
  api\src\cosmos\user-data-export-reads.ts:155:        ],
  api\src\functions\admin\auth\login.ts:47:  if (!verifyToken(totpCode, secret)) {
  api\src\functions\admin\auth\login.ts:48:    const _ts = new Date().toISOString();
> api\src\functions\admin\auth\login.ts:49:    void appendAuditEntry({ id: randomUUID(), adminId: adminUser.adminId, 
role, action: 'ADMIN_LOGIN_FAILED', resourceType: 'admin_session', resourceId: adminUser.adminId, payload: { reason: 
'TOTP_INVALID' }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
  api\src\functions\admin\auth\login.ts:50:    return { status: 422, jsonBody: { code: 'TOTP_INVALID' } };
  api\src\functions\admin\auth\login.ts:51:  }
  api\src\functions\admin\auth\login.ts:52:
  api\src\functions\admin\auth\login.ts:53:  const session = await createAdminSession({ adminId: adminUser.adminId, 
role });
  api\src\functions\admin\complaints\create.ts:61:    action: 'COMPLAINT_CREATED',
  api\src\functions\admin\complaints\create.ts:62:    resourceType: 'complaint',
> api\src\functions\admin\complaints\create.ts:63:    resourceId: doc.id,
  api\src\functions\admin\complaints\create.ts:64:    payload: { orderId: doc.orderId, customerId: doc.customerId },
  api\src\functions\admin\complaints\create.ts:65:    ip: req.headers.get('x-forwarded-for') ?? '',
  api\src\functions\admin\complaints\create.ts:66:    userAgent: '',
  api\src\functions\admin\complaints\create.ts:67:    timestamp: now.toISOString(),
  api\src\functions\admin\complaints\patch.ts:140:      action: 'APPEAL_DECIDED',
  api\src\functions\admin\complaints\patch.ts:141:      resourceType: 'complaint',
> api\src\functions\admin\complaints\patch.ts:142:      resourceId: existing.id,
  api\src\functions\admin\complaints\patch.ts:143:      payload: { decision, technicianId: existing.technicianId, 
bookingId: existing.orderId },
  api\src\functions\admin\complaints\patch.ts:144:      timestamp: now,
  api\src\functions\admin\complaints\patch.ts:145:      partitionKey: now.slice(0, 7),
  api\src\functions\admin\complaints\patch.ts:146:    }).catch((err: unknown) => ctx.error('audit APPEAL_DECIDED 
failed', err));
  api\src\functions\admin\complaints\patch.ts:155:      action: 'COMPLAINT_STATUS_CHANGED',
  api\src\functions\admin\complaints\patch.ts:156:      resourceType: 'complaint',
> api\src\functions\admin\complaints\patch.ts:157:      resourceId: id,
  api\src\functions\admin\complaints\patch.ts:158:      payload: { from: oldStatus, to: parsed.data.status },
  api\src\functions\admin\complaints\patch.ts:159:      ip: req.headers.get('x-forwarded-for') ?? '',
  api\src\functions\admin\complaints\patch.ts:160:      userAgent: '',
  api\src\functions\admin\complaints\patch.ts:161:      timestamp: now,
  api\src\functions\admin\complaints\patch.ts:171:      action: 'COMPLAINT_ASSIGNED',
  api\src\functions\admin\complaints\patch.ts:172:      resourceType: 'complaint',
> api\src\functions\admin\complaints\patch.ts:173:      resourceId: updated.id,
  api\src\functions\admin\complaints\patch.ts:174:      payload: { from: existing.assigneeAdminId ?? null, to: 
parsed.data.assigneeAdminId },
  api\src\functions\admin\complaints\patch.ts:175:      ip: req.headers.get('x-forwarded-for') ?? '',
  api\src\functions\admin\complaints\patch.ts:176:      userAgent: '',
  api\src\functions\admin\complaints\patch.ts:177:      timestamp: now,
  api\src\functions\admin\complaints\sla-timer.ts:50:        action: auditAction,
  api\src\functions\admin\complaints\sla-timer.ts:51:        resourceType: 'complaint',
> api\src\functions\admin\complaints\sla-timer.ts:52:        resourceId: complaint.id,
  api\src\functions\admin\complaints\sla-timer.ts:53:        payload: { technicianId: complaint.technicianId, orderId: 
complaint.orderId },
  api\src\functions\admin\complaints\sla-timer.ts:54:        ip: '',
  api\src\functions\admin\complaints\sla-timer.ts:55:        userAgent: '',
  api\src\functions\admin\complaints\sla-timer.ts:56:        timestamp: now,
  api\src\functions\admin\orders\overrides.ts:49:    action: 'REASSIGN',
  api\src\functions\admin\orders\overrides.ts:50:    resourceType: 'booking',
> api\src\functions\admin\orders\overrides.ts:51:    resourceId: id,
  api\src\functions\admin\orders\overrides.ts:52:    payload: { technicianId: parsed.data.technicianId, reason: 
parsed.data.reason },
  api\src\functions\admin\orders\overrides.ts:53:    timestamp: new Date().toISOString(),
  api\src\functions\admin\orders\overrides.ts:54:    partitionKey: new Date().toISOString().slice(0, 7),
  api\src\functions\admin\orders\overrides.ts:55:  });
  api\src\functions\admin\orders\overrides.ts:93:    action: 'COMPLETE',
  api\src\functions\admin\orders\overrides.ts:94:    resourceType: 'booking',
> api\src\functions\admin\orders\overrides.ts:95:    resourceId: id,
  api\src\functions\admin\orders\overrides.ts:96:    payload: { reason: parsed.data.reason },
  api\src\functions\admin\orders\overrides.ts:97:    timestamp: new Date().toISOString(),
  api\src\functions\admin\orders\overrides.ts:98:    partitionKey: new Date().toISOString().slice(0, 7),
  api\src\functions\admin\orders\overrides.ts:99:  });
  api\src\functions\admin\orders\overrides.ts:138:    action: 'REFUND',
  api\src\functions\admin\orders\overrides.ts:139:    resourceType: 'booking',
> api\src\functions\admin\orders\overrides.ts:140:    resourceId: id,
  api\src\functions\admin\orders\overrides.ts:141:    payload: { reason: parsed.data.reason, amountPaise: 
parsed.data.amountPaise },
  api\src\functions\admin\orders\overrides.ts:142:    timestamp: new Date().toISOString(),
  api\src\functions\admin\orders\overrides.ts:143:    partitionKey: new Date().toISOString().slice(0, 7),
  api\src\functions\admin\orders\overrides.ts:144:  });
  api\src\functions\admin\orders\overrides.ts:182:    action: 'WAIVE_FEE',
  api\src\functions\admin\orders\overrides.ts:183:    resourceType: 'booking',
> api\src\functions\admin\orders\overrides.ts:184:    resourceId: id,
  api\src\functions\admin\orders\overrides.ts:185:    payload: { reason: parsed.data.reason },
  api\src\functions\admin\orders\overrides.ts:186:    timestamp: new Date().toISOString(),
  api\src\functions\admin\orders\overrides.ts:187:    partitionKey: new Date().toISOString().slice(0, 7),
  api\src\functions\admin\orders\overrides.ts:188:  });
  api\src\functions\admin\orders\overrides.ts:226:    action: 'ESCALATE',
  api\src\functions\admin\orders\overrides.ts:227:    resourceType: 'booking',
> api\src\functions\admin\orders\overrides.ts:228:    resourceId: id,
  api\src\functions\admin\orders\overrides.ts:229:    payload: { reason: parsed.data.reason, priority: 
parsed.data.priority },
  api\src\functions\admin\orders\overrides.ts:230:    timestamp: new Date().toISOString(),
  api\src\functions\admin\orders\overrides.ts:231:    partitionKey: new Date().toISOString().slice(0, 7),
  api\src\functions\admin\orders\overrides.ts:232:  });
  api\src\functions\admin\orders\overrides.ts:273:    action: 'ADD_NOTE',
  api\src\functions\admin\orders\overrides.ts:274:    resourceType: 'booking',
> api\src\functions\admin\orders\overrides.ts:275:    resourceId: id,
  api\src\functions\admin\orders\overrides.ts:276:    payload: { note: parsed.data.note },
  api\src\functions\admin\orders\overrides.ts:277:    timestamp: new Date().toISOString(),
  api\src\functions\admin\orders\overrides.ts:278:    partitionKey: new Date().toISOString().slice(0, 7),
  api\src\functions\admin\orders\overrides.ts:279:  });
  api\src\functions\admin\sos\playback-token.ts:53:    action: 'SOS_PLAYBACK_TOKEN_ISSUED',
  api\src\functions\admin\sos\playback-token.ts:54:    resourceType: 'booking',
> api\src\functions\admin\sos\playback-token.ts:55:    resourceId: incidentId,
  api\src\functions\admin\sos\playback-token.ts:56:    payload: { adminId: admin.adminId, incidentId },
  api\src\functions\admin\sos\playback-token.ts:57:    timestamp: now,
  api\src\functions\admin\sos\playback-token.ts:58:    partitionKey: now.slice(0, 7),
  api\src\functions\admin\sos\playback-token.ts:59:  };
  api\src\functions\bookings.ts:634:  if (confirmed.status === 'SEARCHING') {
  api\src\functions\bookings.ts:635:    const _ts = new Date().toISOString();
> api\src\functions\bookings.ts:636:    void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', 
action: 'CUSTOMER_CONFIRMED_PAYMENT', resourceType: 'booking', resourceId: confirmed.id, payload: { bookingId: 
confirmed.id, paymentId: parsed.data.razorpayPaymentId }, timestamp: _ts, partitionKey: _ts.slice(0, 7) 
}).catch(Sentry.captureException);
  api\src\functions\bookings.ts:637:  }
  api\src\functions\bookings.ts:638:
  api\src\functions\bookings.ts:639:  return { status: 200, jsonBody: { bookingId: confirmed.id, status: 
confirmed.status } };
  api\src\functions\bookings.ts:640:};
  api\src\functions\rating-escalate.ts:98:
  api\src\functions\rating-escalate.ts:99:  const _ts = new Date().toISOString();
> api\src\functions\rating-escalate.ts:100:  void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 
'system', action: 'RATING_SHIELD_ESCALATED', resourceType: 'booking', resourceId: bookingId, payload: { bookingId, 
complaintId: doc.id, draftOverall: parsed.data.draftOverall }, timestamp: _ts, partitionKey: _ts.slice(0, 7) 
}).catch(Sentry.captureException);
  api\src\functions\rating-escalate.ts:101:
  api\src\functions\rating-escalate.ts:102:  sendOwnerRatingShieldAlert({
  api\src\functions\rating-escalate.ts:103:    bookingId,
  api\src\functions\rating-escalate.ts:104:    technicianId: booking.technicianId ?? '',
  api\src\functions\sos-key.ts:63:    action: 'SOS_KEY_UPLOADED',
  api\src\functions\sos-key.ts:64:    resourceType: 'booking',
> api\src\functions\sos-key.ts:65:    resourceId: incidentId,
  api\src\functions\sos-key.ts:66:    payload: { incidentId, storagePath },
  api\src\functions\sos-key.ts:67:    timestamp: now,
  api\src\functions\sos-key.ts:68:    partitionKey: now.slice(0, 7),
  api\src\functions\sos-key.ts:69:  };
  api\src\functions\sos.ts:45:    action: 'SOS_TRIGGERED',
  api\src\functions\sos.ts:46:    resourceType: 'booking',
> api\src\functions\sos.ts:47:    resourceId: bookingId,
  api\src\functions\sos.ts:48:    payload: { technicianId: booking.technicianId ?? '', slotAddress: 
booking.addressText },
  api\src\functions\sos.ts:49:    timestamp: now,
  api\src\functions\sos.ts:50:    partitionKey: now.slice(0, 7),
  api\src\functions\sos.ts:51:  };
  api\src\functions\technician-dashboard.ts:111:    // Pending offer count from pending actions
  api\src\functions\technician-dashboard.ts:112:    const pendingOfferCount = pendingActions.filter(
> api\src\functions\technician-dashboard.ts:113:      (a) => a.type === 'JOB_OFFER' && a.status === 'ACTIVE',
  api\src\functions\technician-dashboard.ts:114:    ).length;
  api\src\functions\technician-dashboard.ts:115:
  api\src\functions\technician-dashboard.ts:116:    const dashboard: TechnicianDashboardResponse = 
TechnicianDashboardResponseSchema.parse({
  api\src\functions\technician-dashboard.ts:117:      kycStatus: kyc?.kycStatus ?? null,
  api\src\functions\trigger-booking-completed.ts:14:const DB_NAME = process.env['COSMOS_DATABASE'] ?? 'homeservices';
  api\src\functions\trigger-booking-completed.ts:15:
> api\src\functions\trigger-booking-completed.ts:16:function systemAuditEntry(action: string, resourceId: string, 
payload: Record<string, unknown>) {
  api\src\functions\trigger-booking-completed.ts:17:  const timestamp = new Date().toISOString();
  api\src\functions\trigger-booking-completed.ts:18:  return appendAuditEntry({
  api\src\functions\trigger-booking-completed.ts:19:    id: randomUUID(),
  api\src\functions\trigger-booking-completed.ts:20:    adminId: 'system',
  api\src\functions\trigger-booking-completed.ts:22:    action,
  api\src\functions\trigger-booking-completed.ts:23:    resourceType: 'booking',
> api\src\functions\trigger-booking-completed.ts:24:    resourceId,
  api\src\functions\trigger-booking-completed.ts:25:    payload,
  api\src\functions\trigger-booking-completed.ts:26:    timestamp,
  api\src\functions\trigger-booking-completed.ts:27:    partitionKey: timestamp.slice(0, 7),
  api\src\functions\trigger-booking-completed.ts:28:  });
  api\src\functions\trigger-next-day-payout.ts:73:        action: 'ROUTE_TRANSFER_NEXT_DAY',
  api\src\functions\trigger-next-day-payout.ts:74:        resourceType: 'booking',
> api\src\functions\trigger-next-day-payout.ts:75:        resourceId: bookingId,
  api\src\functions\trigger-next-day-payout.ts:76:        payload: { transferId, techAmount, technicianId },
  api\src\functions\trigger-next-day-payout.ts:77:        timestamp,
  api\src\functions\trigger-next-day-payout.ts:78:        partitionKey: timestamp.slice(0, 7),
  api\src\functions\trigger-next-day-payout.ts:79:      });
  api\src\functions\trigger-no-show-detector.ts:88:      ctx.log(`detectNoShows: processing no-show 
bookingId=${booking.id}`);
  api\src\functions\trigger-no-show-detector.ts:89:      const _ts = new Date().toISOString();
> api\src\functions\trigger-no-show-detector.ts:90:      void appendAuditEntry({ id: randomUUID(), adminId: 'system', 
role: 'system', action: 'NO_SHOW_CREDIT_ISSUED', resourceType: 'booking', resourceId: booking.id, payload: { 
bookingId: booking.id, creditAmount: NO_SHOW_CREDIT_PAISE }, timestamp: _ts, partitionKey: _ts.slice(0, 7) 
}).catch(Sentry.captureException);
  api\src\functions\trigger-no-show-detector.ts:91:    } else {
  api\src\functions\trigger-no-show-detector.ts:92:      ctx.log(`detectNoShows: credit already exists for 
${booking.id} — retrying remaining steps`);
  api\src\functions\trigger-no-show-detector.ts:93:    }
  api\src\functions\trigger-no-show-detector.ts:94:
  api\src\functions\trigger-no-show-detector.ts:175:        // Emit the audit that the prior run never wrote before 
crashing.
  api\src\functions\trigger-no-show-detector.ts:176:        const _rts = new Date().toISOString();
> api\src\functions\trigger-no-show-detector.ts:177:        void appendAuditEntry({ id: randomUUID(), adminId: 
'system', role: 'system', action: 'NO_SHOW_REDISPATCH_INITIATED', resourceType: 'booking', resourceId: booking.id, 
payload: { bookingId: booking.id }, timestamp: _rts, partitionKey: _rts.slice(0, 7) }).catch(Sentry.captureException);
  api\src\functions\trigger-no-show-detector.ts:178:        ctx.log(`detectNoShows: recovery — booking ${booking.id} 
already SEARCHING, completing noShowRedispatchAt write`);
  api\src\functions\trigger-no-show-detector.ts:179:      } else {
  api\src\functions\trigger-no-show-detector.ts:180:        try {
  api\src\functions\trigger-no-show-detector.ts:181:          redispatchOk = await 
dispatcherService.redispatch(booking.id, NO_SHOW_REDISPATCH_RADIUS_KM, noShowTechId);
  api\src\functions\trigger-no-show-detector.ts:183:            await updateBookingFields(booking.id, { 
noShowRedispatchAt: new Date().toISOString() });
  api\src\functions\trigger-no-show-detector.ts:184:            const _ts = new Date().toISOString();
> api\src\functions\trigger-no-show-detector.ts:185:            void appendAuditEntry({ id: randomUUID(), adminId: 
'system', role: 'system', action: 'NO_SHOW_REDISPATCH_INITIATED', resourceType: 'booking', resourceId: booking.id, 
payload: { bookingId: booking.id }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
  api\src\functions\trigger-no-show-detector.ts:186:          } else {
  api\src\functions\trigger-no-show-detector.ts:187:            ctx.log(`detectNoShows: no techs found for 
${booking.id} — booking marked UNFULFILLED`);
  api\src\functions\trigger-no-show-detector.ts:188:            // Guard: dispatcher.redispatch() returns false both 
when no candidates exist AND when a
  api\src\functions\trigger-no-show-detector.ts:189:            // concurrent invocation already moved the booking out 
of NO_SHOW_REDISPATCH (to SEARCHING
  api\src\functions\trigger-no-show-detector.ts:193:            if (postDispatchDoc?.status === 'UNFULFILLED') {
  api\src\functions\trigger-no-show-detector.ts:194:              const _ts = new Date().toISOString();
> api\src\functions\trigger-no-show-detector.ts:195:              void appendAuditEntry({ id: randomUUID(), adminId: 
'system', role: 'system', action: 'BOOKING_UNFULFILLED', resourceType: 'booking', resourceId: booking.id, payload: { 
bookingId: booking.id }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
  api\src\functions\trigger-no-show-detector.ts:196:            }
  api\src\functions\trigger-no-show-detector.ts:197:          }
  api\src\functions\trigger-no-show-detector.ts:198:        } catch (err: unknown) {
  api\src\functions\trigger-no-show-detector.ts:199:          Sentry.captureException(err);
  api\src\functions\trigger-projector-bookings.ts:73:      type: 'ADDON_APPROVAL_REQUESTED',
  api\src\functions\trigger-projector-bookings.ts:74:      role: 'customer',
> api\src\functions\trigger-projector-bookings.ts:75:      sourceId: bookingId,
  api\src\functions\trigger-projector-bookings.ts:76:      expiresAt: stableExpiryFrom(addonRequestedAt, 
ADDON_EXPIRY_MS),
  api\src\functions\trigger-projector-bookings.ts:77:      priority: 1, // highest priority — blocks booking progress
  api\src\functions\trigger-projector-bookings.ts:78:      payload: {
  api\src\functions\trigger-projector-bookings.ts:79:        bookingId,
  api\src\functions\trigger-projector-bookings.ts:99:      type: 'RATING_PROMPT_CUSTOMER',
  api\src\functions\trigger-projector-bookings.ts:100:      role: 'customer',
> api\src\functions\trigger-projector-bookings.ts:101:      sourceId: bookingId,
  api\src\functions\trigger-projector-bookings.ts:102:      expiresAt: stableExpiryFrom(doc.completedAt ?? 
doc.createdAt, RATING_PROMPT_EXPIRY_MS),
  api\src\functions\trigger-projector-bookings.ts:103:      priority: 5,
  api\src\functions\trigger-projector-bookings.ts:104:      payload: { bookingId, technicianId: doc.technicianId },
  api\src\functions\trigger-projector-bookings.ts:105:    });
  api\src\functions\trigger-projector-complaints.ts:70:      type: 'COMPLAINT_UPDATE',
  api\src\functions\trigger-projector-complaints.ts:71:      role: 'customer',
> api\src\functions\trigger-projector-complaints.ts:72:      sourceId: complaintId,
  api\src\functions\trigger-projector-complaints.ts:73:      expiresAt: stableExpiryFrom(doc.createdAt, 
COMPLAINT_UPDATE_EXPIRY_MS),
  api\src\functions\trigger-projector-complaints.ts:74:      priority: 8,
  api\src\functions\trigger-projector-complaints.ts:75:      payload: {
  api\src\functions\trigger-projector-complaints.ts:76:        complaintId,
  api\src\functions\trigger-projector-dispatch-attempts.ts:2: * E11-S02 — Dispatch attempts source adapter 
(change-feed projector).
  api\src\functions\trigger-projector-dispatch-attempts.ts:3: *
> api\src\functions\trigger-projector-dispatch-attempts.ts:4: * Source: dispatch_attempts container (NOT job_offers).
  api\src\functions\trigger-projector-dispatch-attempts.ts:5: * Triggers: dispatch_attempts container change feed.
> api\src\functions\trigger-projector-dispatch-attempts.ts:6: * Emits: JOB_OFFER (one per technician in the attempt's 
technicianIds list)
> api\src\functions\trigger-projector-dispatch-attempts.ts:7: * Expires: JOB_OFFER actions when the attempt status 
becomes EXPIRED or ACCEPTED.
  api\src\functions\trigger-projector-dispatch-attempts.ts:8: *
  api\src\functions\trigger-projector-dispatch-attempts.ts:9: * STRICT ORDERING: upsertAction MUST be called before 
emitFcmForAction.
  api\src\functions\trigger-projector-dispatch-attempts.ts:10: */
  api\src\functions\trigger-projector-dispatch-attempts.ts:11:
  api\src\functions\trigger-projector-dispatch-attempts.ts:37:
  api\src\functions\trigger-projector-dispatch-attempts.ts:38:  if (status === 'PENDING' && expiresAt) {
> api\src\functions\trigger-projector-dispatch-attempts.ts:39:    // Emit JOB_OFFER for each technician in parallel
  api\src\functions\trigger-projector-dispatch-attempts.ts:40:    await Promise.all(
  api\src\functions\trigger-projector-dispatch-attempts.ts:41:      technicianIds.map(async (technicianId) => {
> api\src\functions\trigger-projector-dispatch-attempts.ts:42:        const actionId = 
buildPendingActionId('JOB_OFFER', technicianId, attemptId);
  api\src\functions\trigger-projector-dispatch-attempts.ts:43:        const { doc: upserted, noOp } = await 
upsertAction({
  api\src\functions\trigger-projector-dispatch-attempts.ts:44:          id: actionId,
  api\src\functions\trigger-projector-dispatch-attempts.ts:45:          userId: technicianId,
> api\src\functions\trigger-projector-dispatch-attempts.ts:46:          type: 'JOB_OFFER',
  api\src\functions\trigger-projector-dispatch-attempts.ts:47:          role: 'technician',
> api\src\functions\trigger-projector-dispatch-attempts.ts:48:          sourceId: attemptId,
  api\src\functions\trigger-projector-dispatch-attempts.ts:49:          expiresAt, // inherit from dispatch attempt
  api\src\functions\trigger-projector-dispatch-attempts.ts:50:          priority: 1, // highest priority — 
time-sensitive
  api\src\functions\trigger-projector-dispatch-attempts.ts:51:          payload: {
  api\src\functions\trigger-projector-dispatch-attempts.ts:52:            attemptId,
  api\src\functions\trigger-projector-dispatch-attempts.ts:62:    );
  api\src\functions\trigger-projector-dispatch-attempts.ts:63:  } else if (status === 'EXPIRED' || status === 
'ACCEPTED') {
> api\src\functions\trigger-projector-dispatch-attempts.ts:64:    // Expire JOB_OFFER for all technicians in this 
attempt.
  api\src\functions\trigger-projector-dispatch-attempts.ts:65:    // Retryable Cosmos errors (429, 503 etc.) from 
expireAction are rethrown so the
  api\src\functions\trigger-projector-dispatch-attempts.ts:66:    // Azure Functions runtime retries the batch and the 
change-feed checkpoint does NOT
> api\src\functions\trigger-projector-dispatch-attempts.ts:67:    // advance — preventing a stale JOB_OFFER from 
staying ACTIVE indefinitely.
  api\src\functions\trigger-projector-dispatch-attempts.ts:68:    // Non-retryable errors (404, 409) are swallowed 
(action may already be expired).
  api\src\functions\trigger-projector-dispatch-attempts.ts:69:    await Promise.all(
  api\src\functions\trigger-projector-dispatch-attempts.ts:70:      technicianIds.map(async (technicianId) => {
> api\src\functions\trigger-projector-dispatch-attempts.ts:71:        const actionId = 
buildPendingActionId('JOB_OFFER', technicianId, attemptId);
  api\src\functions\trigger-projector-dispatch-attempts.ts:72:        try {
  api\src\functions\trigger-projector-dispatch-attempts.ts:73:          await expireAction(actionId, technicianId);
  api\src\functions\trigger-projector-dispatch-attempts.ts:74:        } catch (err) {
  api\src\functions\trigger-projector-dispatch-attempts.ts:75:          if (isRetryableCosmosError(err)) {
  api\src\functions\trigger-projector-dispatch-attempts.ts:77:            throw err;
  api\src\functions\trigger-projector-dispatch-attempts.ts:78:          }
> api\src\functions\trigger-projector-dispatch-attempts.ts:79:          
ctx?.warn(`[trigger-projector-dispatch-attempts] Could not expire JOB_OFFER for tech ${technicianId}: ${String(err)}`);
  api\src\functions\trigger-projector-dispatch-attempts.ts:80:        }
  api\src\functions\trigger-projector-dispatch-attempts.ts:81:      }),
  api\src\functions\trigger-projector-dispatch-attempts.ts:82:    );
  api\src\functions\trigger-projector-dispatch-attempts.ts:83:  }
  api\src\functions\trigger-projector-kyc.ts:7: *   does NOT exist — binding to it would mean the trigger never fires.
  api\src\functions\trigger-projector-kyc.ts:8: *
> api\src\functions\trigger-projector-kyc.ts:9: * Emits: KYC_RESUME (to the technician when KYC requires manual action)
> api\src\functions\trigger-projector-kyc.ts:10: * Resolves: KYC_RESUME (when KYC reaches a terminal/complete status)
  api\src\functions\trigger-projector-kyc.ts:11: *
  api\src\functions\trigger-projector-kyc.ts:12: * STRICT ORDERING: upsertAction MUST be called before 
emitFcmForAction.
  api\src\functions\trigger-projector-kyc.ts:13: */
  api\src\functions\trigger-projector-kyc.ts:14:
  api\src\functions\trigger-projector-kyc.ts:25:import { isRetryableCosmosError } from '../shared/cosmos-errors.js';
  api\src\functions\trigger-projector-kyc.ts:26:
> api\src\functions\trigger-projector-kyc.ts:27:const KYC_RESUME_EXPIRY_MS = 30 * 24 * 60 * 60 * 1_000; // 30 days
  api\src\functions\trigger-projector-kyc.ts:28:
  api\src\functions\trigger-projector-kyc.ts:29:/**
  api\src\functions\trigger-projector-kyc.ts:30: * Shape of a technician document as received from the change feed.
  api\src\functions\trigger-projector-kyc.ts:31: * The `kyc` object is a nested sub-document written by 
`upsertKycStatus()`.
  api\src\functions\trigger-projector-kyc.ts:55: *
  api\src\functions\trigger-projector-kyc.ts:56: * Receives a TechnicianDoc change-feed event, inspects 
`doc.kyc.kycStatus`,
> api\src\functions\trigger-projector-kyc.ts:57: * and emits or resolves KYC_RESUME accordingly.
  api\src\functions\trigger-projector-kyc.ts:58: */
  api\src\functions\trigger-projector-kyc.ts:59:export async function processKycChangeFeedDoc(
  api\src\functions\trigger-projector-kyc.ts:60:  doc: TechnicianChangeFeedDoc,
  api\src\functions\trigger-projector-kyc.ts:61:  ctx?: InvocationContext,
  api\src\functions\trigger-projector-kyc.ts:70:  }
  api\src\functions\trigger-projector-kyc.ts:71:
> api\src\functions\trigger-projector-kyc.ts:72:  const actionId = buildPendingActionId('KYC_RESUME', technicianId, 
technicianId); // sourceId = technicianId (1 KYC per tech)
  api\src\functions\trigger-projector-kyc.ts:73:
  api\src\functions\trigger-projector-kyc.ts:74:  if (ACTION_REQUIRED_STATUSES.has(kycStatus)) {
  api\src\functions\trigger-projector-kyc.ts:75:    // expiresAt derived from the KYC sub-doc's updatedAt (stable 
source timestamp).
  api\src\functions\trigger-projector-kyc.ts:76:    // Same kycStatus + same updatedAt → same expiresAt → replay is a 
no-op.
  api\src\functions\trigger-projector-kyc.ts:78:      id: actionId,
  api\src\functions\trigger-projector-kyc.ts:79:      userId: technicianId,
> api\src\functions\trigger-projector-kyc.ts:80:      type: 'KYC_RESUME',
  api\src\functions\trigger-projector-kyc.ts:81:      role: 'technician',
> api\src\functions\trigger-projector-kyc.ts:82:      sourceId: technicianId,
> api\src\functions\trigger-projector-kyc.ts:83:      expiresAt: stableExpiryFrom(doc.kyc?.updatedAt, 
KYC_RESUME_EXPIRY_MS),
  api\src\functions\trigger-projector-kyc.ts:84:      priority: 2, // high priority — blocks earning
  api\src\functions\trigger-projector-kyc.ts:85:      payload: { kycStatus },
  api\src\functions\trigger-projector-kyc.ts:86:    });
  api\src\functions\trigger-projector-kyc.ts:87:
  api\src\functions\trigger-projector-kyc.ts:91:    }
  api\src\functions\trigger-projector-kyc.ts:92:  } else if (COMPLETE_STATUSES.has(kycStatus)) {
> api\src\functions\trigger-projector-kyc.ts:93:    // KYC complete — resolve any pending KYC_RESUME action
  api\src\functions\trigger-projector-kyc.ts:94:    await resolveAction(actionId, technicianId);
  api\src\functions\trigger-projector-kyc.ts:95:  }
  api\src\functions\trigger-projector-kyc.ts:96:}
  api\src\functions\trigger-projector-kyc.ts:97:
  api\src\functions\trigger-projector-kyc.ts:103:  // Bind to `technicians` — the KYC flow writes kyc.kycStatus here 
via upsertKycStatus().
  api\src\functions\trigger-projector-kyc.ts:104:  // A `kyc_submissions` container does not exist; binding to it 
would mean this trigger
> api\src\functions\trigger-projector-kyc.ts:105:  // never fires and KYC_RESUME actions are never created.
  api\src\functions\trigger-projector-kyc.ts:106:  containerName: 'technicians',
  api\src\functions\trigger-projector-kyc.ts:107:  leaseContainerName: 'pending_actions_kyc_leases',
  api\src\functions\trigger-projector-kyc.ts:108:  createLeaseContainerIfNotExists: false,
  api\src\functions\trigger-projector-kyc.ts:109:  handler: async (documents: unknown[], ctx: InvocationContext) => {
  api\src\functions\trigger-projector-ratings.ts:53:    type: 'RATING_RECEIVED',
  api\src\functions\trigger-projector-ratings.ts:54:    role: 'technician',
> api\src\functions\trigger-projector-ratings.ts:55:    sourceId: ratingId,
  api\src\functions\trigger-projector-ratings.ts:56:    expiresAt: stableExpiryFrom(customerSubmittedAt, 
RATING_RECEIVED_EXPIRY_MS),
  api\src\functions\trigger-projector-ratings.ts:57:    priority: 10,
  api\src\functions\trigger-projector-ratings.ts:58:    payload: {
  api\src\functions\trigger-projector-ratings.ts:59:      ratingId,
  api\src\functions\trigger-reconcile-payouts.ts:18:    action,
  api\src\functions\trigger-reconcile-payouts.ts:19:    resourceType: 'wallet_ledger',
> api\src\functions\trigger-reconcile-payouts.ts:20:    resourceId: 'reconciliation',
  api\src\functions\trigger-reconcile-payouts.ts:21:    payload,
  api\src\functions\trigger-reconcile-payouts.ts:22:    timestamp,
  api\src\functions\trigger-reconcile-payouts.ts:23:    partitionKey: timestamp.slice(0, 7),
  api\src\functions\trigger-reconcile-payouts.ts:24:  });
  api\src\functions\webhooks.ts:90:        action: 'WALLET_CREDIT_APPLIED_ON_PAYMENT',
  api\src\functions\webhooks.ts:91:        resourceType: 'booking',
> api\src\functions\webhooks.ts:92:        resourceId: booking.id,
  api\src\functions\webhooks.ts:93:        payload: {
  api\src\functions\webhooks.ts:94:          bookingId: booking.id,
  api\src\functions\webhooks.ts:95:          creditAmountInPaise: booking.pendingCreditAmountInPaise,
  api\src\functions\webhooks.ts:96:          idempotencyKey: booking.pendingCreditIdempotencyKey,
  api\src\functions\webhooks.ts:148:
  api\src\functions\webhooks.ts:149:  const _ts = new Date().toISOString();
> api\src\functions\webhooks.ts:150:  void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', 
action: 'PAYMENT_CAPTURED', resourceType: 'booking', resourceId: booking.id, payload: { bookingId: booking.id, 
paymentId, orderId }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
  api\src\functions\webhooks.ts:151:
  api\src\functions\webhooks.ts:152:  dispatcherService.triggerDispatch(booking.id).catch(() => {
  api\src\functions\webhooks.ts:153:    // fire-and-forget — dispatch failure does not fail the webhook ack
  api\src\functions\webhooks.ts:154:  });
  api\src\schemas\audit-log.ts:7:  action: z.string(),
  api\src\schemas\audit-log.ts:8:  resourceType: z.string(),
> api\src\schemas\audit-log.ts:9:  resourceId: z.string(),
  api\src\schemas\audit-log.ts:10:  payload: z.record(z.unknown()),
  api\src\schemas\audit-log.ts:11:  ip: z.string().optional(),
  api\src\schemas\audit-log.ts:12:  userAgent: z.string().optional(),
  api\src\schemas\audit-log.ts:13:  timestamp: z.string(),
  api\src\schemas\audit-log.ts:23:  action: z.string().optional(),
  api\src\schemas\audit-log.ts:24:  resourceType: z.string().optional(),
> api\src\schemas\audit-log.ts:25:  resourceId: z.string().optional(),
  api\src\schemas\audit-log.ts:26:  dateFrom: z.string().optional(),
  api\src\schemas\audit-log.ts:27:  dateTo: z.string().optional(),
  api\src\schemas\audit-log.ts:28:  continuationToken: z.string().optional(),
  api\src\schemas\audit-log.ts:29:  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  api\src\schemas\pendingActions.ts:19:  'COMPLAINT_UPDATE',
  api\src\schemas\pendingActions.ts:20:  'RATING_RECEIVED',
> api\src\schemas\pendingActions.ts:21:  'KYC_RESUME',
> api\src\schemas\pendingActions.ts:22:  'JOB_OFFER',
  api\src\schemas\pendingActions.ts:23:]);
  api\src\schemas\pendingActions.ts:24:
  api\src\schemas\pendingActions.ts:25:export const PendingActionStatusSchema = z.enum([
  api\src\schemas\pendingActions.ts:26:  'ACTIVE',
  api\src\schemas\pendingActions.ts:33:
  api\src\schemas\pendingActions.ts:34:export const PendingActionDocSchema = z.object({
> api\src\schemas\pendingActions.ts:35:  /** Deterministic id: `<type>:<userId>:<sourceId>` — enables idempotent 
upsert. */
  api\src\schemas\pendingActions.ts:36:  id: z.string().min(1),
  api\src\schemas\pendingActions.ts:37:  /** Cosmos partition key. */
  api\src\schemas\pendingActions.ts:38:  userId: z.string().min(1),
  api\src\schemas\pendingActions.ts:39:  type: PendingActionTypeSchema,
  api\src\schemas\pendingActions.ts:51:  updatedAt: z.string().datetime(),
  api\src\schemas\pendingActions.ts:52:  /** Source document id (booking id, rating id, etc.). */
> api\src\schemas\pendingActions.ts:53:  sourceId: z.string().min(1),
  api\src\schemas\pendingActions.ts:54:  /**
  api\src\schemas\pendingActions.ts:55:   * Arbitrary action-specific metadata.
  api\src\schemas\pendingActions.ts:56:   * Stored as a plain record so projectors can attach context without
  api\src\schemas\pendingActions.ts:57:   * schema churn (bookingId, technicianId, addonTotal, etc.).
  api\src\schemas\pendingActions.ts:75:  type: PendingActionType,
  api\src\schemas\pendingActions.ts:76:  userId: string,
> api\src\schemas\pendingActions.ts:77:  sourceId: string,
  api\src\schemas\pendingActions.ts:78:): string {
> api\src\schemas\pendingActions.ts:79:  return `${type}:${userId}:${sourceId}`;
  api\src\schemas\pendingActions.ts:80:}
  api\src\services\auditLog.service.ts:15:  action: string,
  api\src\services\auditLog.service.ts:16:  resourceType: string,
> api\src\services\auditLog.service.ts:17:  resourceId: string,
  api\src\services\auditLog.service.ts:18:  payload: Record<string, unknown>,
  api\src\services\auditLog.service.ts:19:  extras?: { ip?: string; userAgent?: string },
  api\src\services\auditLog.service.ts:20:): Promise<void> {
  api\src\services\auditLog.service.ts:21:  try {
  api\src\services\auditLog.service.ts:27:      action,
  api\src\services\auditLog.service.ts:28:      resourceType,
> api\src\services\auditLog.service.ts:29:      resourceId,
  api\src\services\auditLog.service.ts:30:      payload,
  api\src\services\auditLog.service.ts:31:      timestamp,
  api\src\services\auditLog.service.ts:32:      partitionKey: timestamp.slice(0, 7),
  api\src\services\auditLog.service.ts:33:    };
  api\src\services\catalogueAudit.service.ts:13:  action: string,
  api\src\services\catalogueAudit.service.ts:14:  resourceType: string,
> api\src\services\catalogueAudit.service.ts:15:  resourceId: string,
  api\src\services\catalogueAudit.service.ts:16:  payload: Record<string, unknown>,
  api\src\services\catalogueAudit.service.ts:17:): Promise<void> {
  api\src\services\catalogueAudit.service.ts:18:  try {
  api\src\services\catalogueAudit.service.ts:19:    const ts = new Date().toISOString();
  api\src\services\catalogueAudit.service.ts:24:      action,
  api\src\services\catalogueAudit.service.ts:25:      resourceType,
> api\src\services\catalogueAudit.service.ts:26:      resourceId,
  api\src\services\catalogueAudit.service.ts:27:      payload,
  api\src\services\catalogueAudit.service.ts:28:      timestamp: ts,
  api\src\services\catalogueAudit.service.ts:29:      partitionKey: ts.slice(0, 7),
  api\src\services\catalogueAudit.service.ts:30:    });
  api\src\services\dispatcher.service.ts:115:        token: selected.fcmToken,
  api\src\services\dispatcher.service.ts:116:        data: {
> api\src\services\dispatcher.service.ts:117:          type: 'JOB_OFFER',
  api\src\services\dispatcher.service.ts:118:          bookingId,
  api\src\services\dispatcher.service.ts:119:          serviceId: booking.serviceId,
  api\src\services\dispatcher.service.ts:120:          serviceName,
  api\src\services\dispatcher.service.ts:121:          addressText: normalizeAddressText(booking.addressText),
  api\src\services\erasureCascade.service.ts:48:    userDataCascadeWrites.anonymizeBookingEvents(userId, hash),
  api\src\services\erasureCascade.service.ts:49:    userDataCascadeWrites.anonymizeDispatchAttempts(userId, hash),
> api\src\services\erasureCascade.service.ts:50:    userDataCascadeWrites.anonymizeAuditLogResourceId(userId, hash),
  api\src\services\erasureCascade.service.ts:51:  ]);
  api\src\services\erasureCascade.service.ts:52:
  api\src\services\erasureCascade.service.ts:53:  // E19-S02: clear FCM device token docs linked to erased UID (DPDP 
§12 compliance).
  api\src\services\erasureCascade.service.ts:54:  await deviceTokenRepo.unregisterAllForUser(userId);
  api\src\services\fcm.service.ts:176:): Promise<void> {
  api\src\services\fcm.service.ts:177:  await sendToUserTokens(technicianId, {
> api\src\services\fcm.service.ts:178:    type: 'EARNINGS_UPDATE',
  api\src\services\fcm.service.ts:179:    bookingId: payload.bookingId,
  api\src\services\fcm.service.ts:180:    techAmount: String(payload.techAmount),
  api\src\services\fcm.service.ts:181:  });
  api\src\services\fcm.service.ts:182:}
  api\src\services\kycAudit.service.ts:4:
  api\src\services\kycAudit.service.ts:5:// maskedIdentifier deliberately omitted: audit_log is immutable so PII (PAN,
> api\src\services\kycAudit.service.ts:6:// Aadhaar) must never land in payload — erasure path only anonymizes 
resourceId.
  api\src\services\kycAudit.service.ts:7:export async function kycAuditEntry(
  api\src\services\kycAudit.service.ts:8:  technicianId: string,
  api\src\services\kycAudit.service.ts:9:  kycMethod: string,
  api\src\services\kycAudit.service.ts:10:  kycStatus: string,
  api\src\services\kycAudit.service.ts:18:      action: `KYC_${kycMethod.toUpperCase()}_${kycStatus}`,
  api\src\services\kycAudit.service.ts:19:      resourceType: 'technician',
> api\src\services\kycAudit.service.ts:20:      resourceId: technicianId,
  api\src\services\kycAudit.service.ts:21:      payload: { kycMethod, kycStatus },
  api\src\services\kycAudit.service.ts:22:      timestamp: ts,
  api\src\services\kycAudit.service.ts:23:      partitionKey: ts.slice(0, 7),
  api\src\services\kycAudit.service.ts:24:    });
  api\src\services\pending-action-projector.ts:30:  type: PendingActionType;
  api\src\services\pending-action-projector.ts:31:  role: PendingActionRole;
> api\src\services\pending-action-projector.ts:32:  sourceId: string;
  api\src\services\pending-action-projector.ts:33:  expiresAt: string;
  api\src\services\pending-action-projector.ts:34:  priority: number;
  api\src\services\pending-action-projector.ts:35:  payload?: Record<string, unknown>;
  api\src\services\pending-action-projector.ts:36:}
  api\src\services\pending-action-projector.ts:103:        createdAt: now(),
  api\src\services\pending-action-projector.ts:104:        updatedAt: now(),
> api\src\services\pending-action-projector.ts:105:        sourceId: input.sourceId,
  api\src\services\pending-action-projector.ts:106:        payload: input.payload,
  api\src\services\pending-action-projector.ts:107:      };
  api\src\services\pending-action-projector.ts:108:      const created = await createPendingAction(doc);
  api\src\services\pending-action-projector.ts:109:      _log('pending_action_upsert', {
  api\src\services\pending-action-projector.ts:216:        type: doc.type,
  api\src\services\pending-action-projector.ts:217:        actionId: doc.id,
> api\src\services\pending-action-projector.ts:218:        sourceId: doc.sourceId,
  api\src\services\pending-action-projector.ts:219:        // Legacy-client compatibility fields.
  api\src\services\pending-action-projector.ts:220:        // Customer app (CustomerFirebaseMessagingService) returns 
early on
  api\src\services\pending-action-projector.ts:221:        // ADDON_APPROVAL_REQUESTED and RATING_PROMPT_CUSTOMER 
without bookingId.
  api\src\services\pending-action-projector.ts:222:        // Technician app (HomeservicesFcmService) defaults missing 
`overall` to 1



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'api/src' -Include '*.ts' | Select-String -Pattern 'attemptId|dispatchAttempt' -Context 2,3 | Select-Object -First 160" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1058ms:

  api\src\cosmos\client.ts:65:}
  api\src\cosmos\client.ts:66:
> api\src\cosmos\client.ts:67:export function getDispatchAttemptsContainer(): Container {
  api\src\cosmos\client.ts:68:  return getCosmosClient().database(DB_NAME).container('dispatch_attempts');
  api\src\cosmos\client.ts:69:}
  api\src\cosmos\client.ts:70:
  api\src\cosmos\dispatch-attempt-repository.ts:1:import type { Resource } from '@azure/cosmos';
> api\src\cosmos\dispatch-attempt-repository.ts:2:import { getDispatchAttemptsContainer } from './client.js';
> api\src\cosmos\dispatch-attempt-repository.ts:3:import type { DispatchAttemptDoc } from 
'../schemas/dispatch-attempt.js';
  api\src\cosmos\dispatch-attempt-repository.ts:4:
> api\src\cosmos\dispatch-attempt-repository.ts:5:export const dispatchAttemptRepo = {
> api\src\cosmos\dispatch-attempt-repository.ts:6:  async getByBookingId(bookingId: string): 
Promise<DispatchAttemptDoc | null> {
> api\src\cosmos\dispatch-attempt-repository.ts:7:    const { resources } = await getDispatchAttemptsContainer()
  api\src\cosmos\dispatch-attempt-repository.ts:8:      .items
> api\src\cosmos\dispatch-attempt-repository.ts:9:      .query<DispatchAttemptDoc>({
  api\src\cosmos\dispatch-attempt-repository.ts:10:        query: 'SELECT * FROM c WHERE c.bookingId = @bookingId 
ORDER BY c._ts DESC OFFSET 0 LIMIT 1',
  api\src\cosmos\dispatch-attempt-repository.ts:11:        parameters: [{ name: '@bookingId', value: bookingId }],
  api\src\cosmos\dispatch-attempt-repository.ts:12:      })
  api\src\cosmos\dispatch-attempt-repository.ts:16:
  api\src\cosmos\dispatch-attempt-repository.ts:17:  async getAttemptedTechnicianIds(bookingId: string): 
Promise<string[]> {
> api\src\cosmos\dispatch-attempt-repository.ts:18:    const { resources } = await getDispatchAttemptsContainer()
  api\src\cosmos\dispatch-attempt-repository.ts:19:      .items
> api\src\cosmos\dispatch-attempt-repository.ts:20:      .query<Pick<DispatchAttemptDoc, 'technicianIds'>>({
  api\src\cosmos\dispatch-attempt-repository.ts:21:        query: 'SELECT c.technicianIds FROM c WHERE c.bookingId = 
@bookingId',
  api\src\cosmos\dispatch-attempt-repository.ts:22:        parameters: [{ name: '@bookingId', value: bookingId }],
  api\src\cosmos\dispatch-attempt-repository.ts:23:      })
  api\src\cosmos\dispatch-attempt-repository.ts:26:  },
  api\src\cosmos\dispatch-attempt-repository.ts:27:
> api\src\cosmos\dispatch-attempt-repository.ts:28:  async acceptAttempt(id: string, bookingId: string): 
Promise<DispatchAttemptDoc | null> {
> api\src\cosmos\dispatch-attempt-repository.ts:29:    const container = getDispatchAttemptsContainer();
> api\src\cosmos\dispatch-attempt-repository.ts:30:    const { resource } = await container.item(id, 
id).read<DispatchAttemptDoc & Resource>();
  api\src\cosmos\dispatch-attempt-repository.ts:31:    if (!resource) return null;
  api\src\cosmos\dispatch-attempt-repository.ts:32:    if (resource.bookingId !== bookingId) return null;
  api\src\cosmos\dispatch-attempt-repository.ts:33:    if (resource.status !== 'PENDING') return null;
  api\src\cosmos\dispatch-attempt-repository.ts:34:
> api\src\cosmos\dispatch-attempt-repository.ts:35:    const updated: DispatchAttemptDoc = {
  api\src\cosmos\dispatch-attempt-repository.ts:36:      id: resource.id,
  api\src\cosmos\dispatch-attempt-repository.ts:37:      bookingId: resource.bookingId,
  api\src\cosmos\dispatch-attempt-repository.ts:38:      technicianIds: resource.technicianIds,
  api\src\cosmos\dispatch-attempt-repository.ts:43:
  api\src\cosmos\dispatch-attempt-repository.ts:44:    try {
> api\src\cosmos\dispatch-attempt-repository.ts:45:      const { resource: replaced } = await container.item(id, 
id).replace<DispatchAttemptDoc>(
  api\src\cosmos\dispatch-attempt-repository.ts:46:        updated,
  api\src\cosmos\dispatch-attempt-repository.ts:47:        { accessCondition: { type: 'IfMatch', condition: 
resource._etag } },
  api\src\cosmos\dispatch-attempt-repository.ts:48:      );
  api\src\cosmos\dispatch-attempt-repository.ts:54:  },
  api\src\cosmos\dispatch-attempt-repository.ts:55:
> api\src\cosmos\dispatch-attempt-repository.ts:56:  async declineAttempt(id: string, bookingId: string): 
Promise<DispatchAttemptDoc | null> {
> api\src\cosmos\dispatch-attempt-repository.ts:57:    const container = getDispatchAttemptsContainer();
> api\src\cosmos\dispatch-attempt-repository.ts:58:    const { resource } = await container.item(id, 
id).read<DispatchAttemptDoc & Resource>();
  api\src\cosmos\dispatch-attempt-repository.ts:59:    if (!resource) return null;
  api\src\cosmos\dispatch-attempt-repository.ts:60:    if (resource.bookingId !== bookingId) return null;
  api\src\cosmos\dispatch-attempt-repository.ts:61:    if (resource.status !== 'PENDING') return null;
  api\src\cosmos\dispatch-attempt-repository.ts:62:    if (new Date(resource.expiresAt) <= new Date()) return null;
  api\src\cosmos\dispatch-attempt-repository.ts:63:
> api\src\cosmos\dispatch-attempt-repository.ts:64:    const updated: DispatchAttemptDoc = {
  api\src\cosmos\dispatch-attempt-repository.ts:65:      id: resource.id,
  api\src\cosmos\dispatch-attempt-repository.ts:66:      bookingId: resource.bookingId,
  api\src\cosmos\dispatch-attempt-repository.ts:67:      technicianIds: resource.technicianIds,
  api\src\cosmos\dispatch-attempt-repository.ts:72:
  api\src\cosmos\dispatch-attempt-repository.ts:73:    try {
> api\src\cosmos\dispatch-attempt-repository.ts:74:      const { resource: replaced } = await container.item(id, 
id).replace<DispatchAttemptDoc>(
  api\src\cosmos\dispatch-attempt-repository.ts:75:        updated,
  api\src\cosmos\dispatch-attempt-repository.ts:76:        { accessCondition: { type: 'IfMatch', condition: 
resource._etag } },
  api\src\cosmos\dispatch-attempt-repository.ts:77:      );
  api\src\cosmos\user-data-cascade-writes.ts:13:  getRatingsContainer,
  api\src\cosmos\user-data-cascade-writes.ts:14:  getWalletLedgerContainer,
> api\src\cosmos\user-data-cascade-writes.ts:15:  getDispatchAttemptsContainer,
  api\src\cosmos\user-data-cascade-writes.ts:16:  getBookingEventsContainer,
  api\src\cosmos\user-data-cascade-writes.ts:17:} from './client.js';
  api\src\cosmos\user-data-cascade-writes.ts:18:
  api\src\cosmos\user-data-cascade-writes.ts:184:  },
  api\src\cosmos\user-data-cascade-writes.ts:185:
> api\src\cosmos\user-data-cascade-writes.ts:186:  async anonymizeDispatchAttempts(uid: string, anonymizedHash: 
string): Promise<number> {
> api\src\cosmos\user-data-cascade-writes.ts:187:    const { resources } = await getDispatchAttemptsContainer()
  api\src\cosmos\user-data-cascade-writes.ts:188:      .items.query<Record<string, unknown>>({
  api\src\cosmos\user-data-cascade-writes.ts:189:        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(c.technicianIds, 
@uid)',
  api\src\cosmos\user-data-cascade-writes.ts:190:        parameters: [{ name: '@uid', value: uid }],
  api\src\cosmos\user-data-cascade-writes.ts:201:      const id = r['id'] as string;
  api\src\cosmos\user-data-cascade-writes.ts:202:      const pk = (r['bookingId'] as string) ?? id;
> api\src\cosmos\user-data-cascade-writes.ts:203:      await getDispatchAttemptsContainer().item(id, 
pk).replace(updated);
  api\src\cosmos\user-data-cascade-writes.ts:204:      n += 1;
  api\src\cosmos\user-data-cascade-writes.ts:205:    }
  api\src\cosmos\user-data-cascade-writes.ts:206:    return n;
  api\src\cosmos\user-data-export-reads.ts:5: * holds PII tied to a customer/technician uid.
  api\src\cosmos\user-data-export-reads.ts:6: */
> api\src\cosmos\user-data-export-reads.ts:7:import { getCosmosClient, DB_NAME, getBookingsContainer, 
getRatingsContainer, getWalletLedgerContainer, getDispatchAttemptsContainer, getBookingEventsContainer } from 
'./client.js';
  api\src\cosmos\user-data-export-reads.ts:8:import { BookingDocSchema } from '../schemas/booking.js';
  api\src\cosmos\user-data-export-reads.ts:9:import { RatingDocSchema } from '../schemas/rating.js';
  api\src\cosmos\user-data-export-reads.ts:10:import { ComplaintDocSchema } from '../schemas/complaint.js';
  api\src\cosmos\user-data-export-reads.ts:11:import { WalletLedgerEntrySchema } from '../schemas/wallet-ledger.js';
  api\src\cosmos\user-data-export-reads.ts:12:import { BookingEventDocSchema } from '../schemas/booking-event.js';
> api\src\cosmos\user-data-export-reads.ts:13:import { DispatchAttemptDocSchema } from 
'../schemas/dispatch-attempt.js';
  api\src\cosmos\user-data-export-reads.ts:14:import { AuditLogEntrySchema } from '../schemas/audit-log.js';
  api\src\cosmos\user-data-export-reads.ts:15:import type { BookingDoc } from '../schemas/booking.js';
  api\src\cosmos\user-data-export-reads.ts:16:import type { RatingDoc } from '../schemas/rating.js';
  api\src\cosmos\user-data-export-reads.ts:18:import type { WalletLedgerEntry } from '../schemas/wallet-ledger.js';
  api\src\cosmos\user-data-export-reads.ts:19:import type { BookingEventDoc } from '../schemas/booking-event.js';
> api\src\cosmos\user-data-export-reads.ts:20:import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';
  api\src\cosmos\user-data-export-reads.ts:21:import type { AuditLogEntry } from '../schemas/audit-log.js';
  api\src\cosmos\user-data-export-reads.ts:22:import type { TechnicianKyc } from '../schemas/kyc.js';
  api\src\cosmos\user-data-export-reads.ts:23:import type { TechnicianProfile } from '../schemas/technician.js';
  api\src\cosmos\user-data-export-reads.ts:114:  },
  api\src\cosmos\user-data-export-reads.ts:115:
> api\src\cosmos\user-data-export-reads.ts:116:  async listDispatchAttemptsForUser(uid: string): 
Promise<DispatchAttemptDoc[]> {
> api\src\cosmos\user-data-export-reads.ts:117:    const { resources } = await getDispatchAttemptsContainer()
  api\src\cosmos\user-data-export-reads.ts:118:      .items.query<Record<string, unknown>>({
  api\src\cosmos\user-data-export-reads.ts:119:        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(c.technicianIds, 
@uid)',
  api\src\cosmos\user-data-export-reads.ts:120:        parameters: [{ name: '@uid', value: uid }],
  api\src\cosmos\user-data-export-reads.ts:121:      })
  api\src\cosmos\user-data-export-reads.ts:122:      .fetchAll();
> api\src\cosmos\user-data-export-reads.ts:123:    return resources.map((r) => DispatchAttemptDocSchema.parse(r));
  api\src\cosmos\user-data-export-reads.ts:124:  },
  api\src\cosmos\user-data-export-reads.ts:125:
  api\src\cosmos\user-data-export-reads.ts:126:  async readTechnicianFullDoc(uid: string): 
Promise<TechnicianFullExportDoc> {
  api\src\functions\job-offers.ts:3:import type { Resource } from '@azure/cosmos';
  api\src\functions\job-offers.ts:4:import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
> api\src\functions\job-offers.ts:5:import { dispatchAttemptRepo } from '../cosmos/dispatch-attempt-repository.js';
  api\src\functions\job-offers.ts:6:import { bookingEventRepo } from '../cosmos/booking-event-repository.js';
  api\src\functions\job-offers.ts:7:import { updateBookingFields } from '../cosmos/booking-repository.js';
> api\src\functions\job-offers.ts:8:import { getDispatchAttemptsContainer } from '../cosmos/client.js';
  api\src\functions\job-offers.ts:9:import { dispatcherService } from '../services/dispatcher.service.js';
  api\src\functions\job-offers.ts:10:import { sendBookingStatusUpdatePush } from '../services/fcm.service.js';
> api\src\functions\job-offers.ts:11:import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';
  api\src\functions\job-offers.ts:12:
  api\src\functions\job-offers.ts:13:export async function acceptJobOfferHandler(
  api\src\functions\job-offers.ts:14:  req: HttpRequest,
  api\src\functions\job-offers.ts:25:  const bookingId = (req as unknown as { params: { bookingId: string } 
}).params.bookingId;
  api\src\functions\job-offers.ts:26:
> api\src\functions\job-offers.ts:27:  const attempt = await dispatchAttemptRepo.getByBookingId(bookingId);
  api\src\functions\job-offers.ts:28:  if (!attempt) {
  api\src\functions\job-offers.ts:29:    return { status: 404, jsonBody: { code: 'OFFER_NOT_FOUND' } };
  api\src\functions\job-offers.ts:30:  }
  api\src\functions\job-offers.ts:36:  }
  api\src\functions\job-offers.ts:37:
> api\src\functions\job-offers.ts:38:  const accepted = await dispatchAttemptRepo.acceptAttempt(attempt.id, bookingId);
  api\src\functions\job-offers.ts:39:  if (!accepted) {
  api\src\functions\job-offers.ts:40:    return { status: 409, jsonBody: { code: 'OFFER_ALREADY_TAKEN' } };
  api\src\functions\job-offers.ts:41:  }
  api\src\functions\job-offers.ts:71:  const bookingId = (req as unknown as { params: { bookingId: string } 
}).params.bookingId;
  api\src\functions\job-offers.ts:72:
> api\src\functions\job-offers.ts:73:  const attempt = await dispatchAttemptRepo.getByBookingId(bookingId);
  api\src\functions\job-offers.ts:74:  if (attempt?.technicianIds.includes(technicianId) && attempt.status !== 
'ACCEPTED') {
  api\src\functions\job-offers.ts:75:    const terminalAttempt = attempt.status === 'PENDING'
> api\src\functions\job-offers.ts:76:      ? await dispatchAttemptRepo.declineAttempt(attempt.id, bookingId)
  api\src\functions\job-offers.ts:77:      : attempt;
  api\src\functions\job-offers.ts:78:    if (terminalAttempt) {
  api\src\functions\job-offers.ts:79:      await dispatcherService.continueDispatchAfterOfferOutcome(bookingId, 
attempt.technicianIds);
  api\src\functions\job-offers.ts:99:
  api\src\functions\job-offers.ts:100:async function expireStaleOffers(_timer: Timer, _ctx: InvocationContext): 
Promise<void> {
> api\src\functions\job-offers.ts:101:  const container = getDispatchAttemptsContainer();
  api\src\functions\job-offers.ts:102:  const { resources } = await container.items
> api\src\functions\job-offers.ts:103:    .query<DispatchAttemptDoc & Resource>({
  api\src\functions\job-offers.ts:104:      query: `SELECT * FROM c WHERE c.status = 'PENDING' AND c.expiresAt < @now`,
  api\src\functions\job-offers.ts:105:      parameters: [{ name: '@now', value: new Date().toISOString() }],
  api\src\functions\job-offers.ts:106:    })
  api\src\functions\trigger-projector-dispatch-attempts.ts:19:  buildPendingActionId,
  api\src\functions\trigger-projector-dispatch-attempts.ts:20:} from '../services/pending-action-projector.js';
> api\src\functions\trigger-projector-dispatch-attempts.ts:21:import type { DispatchAttemptDoc } from 
'../schemas/dispatch-attempt.js';
  api\src\functions\trigger-projector-dispatch-attempts.ts:22:import { isRetryableCosmosError } from 
'../shared/cosmos-errors.js';
  api\src\functions\trigger-projector-dispatch-attempts.ts:23:
  api\src\functions\trigger-projector-dispatch-attempts.ts:24:/**
  api\src\functions\trigger-projector-dispatch-attempts.ts:25: * Exported for unit testing without Azure Functions 
runtime.
  api\src\functions\trigger-projector-dispatch-attempts.ts:26: */
> api\src\functions\trigger-projector-dispatch-attempts.ts:27:export async function 
processDispatchAttemptChangeFeedDoc(
> api\src\functions\trigger-projector-dispatch-attempts.ts:28:  doc: Partial<DispatchAttemptDoc> & { id: string },
  api\src\functions\trigger-projector-dispatch-attempts.ts:29:  ctx?: InvocationContext,
  api\src\functions\trigger-projector-dispatch-attempts.ts:30:): Promise<void> {
> api\src\functions\trigger-projector-dispatch-attempts.ts:31:  const { id: attemptId, technicianIds, status, 
expiresAt, bookingId } = doc;
  api\src\functions\trigger-projector-dispatch-attempts.ts:32:
  api\src\functions\trigger-projector-dispatch-attempts.ts:33:  if (!technicianIds || technicianIds.length === 0 || 
!status) {
> api\src\functions\trigger-projector-dispatch-attempts.ts:34:    ctx?.warn(`[trigger-projector-dispatch-attempts] 
Skipping doc ${attemptId}: missing fields`);
  api\src\functions\trigger-projector-dispatch-attempts.ts:35:    return;
  api\src\functions\trigger-projector-dispatch-attempts.ts:36:  }
  api\src\functions\trigger-projector-dispatch-attempts.ts:37:
  api\src\functions\trigger-projector-dispatch-attempts.ts:40:    await Promise.all(
  api\src\functions\trigger-projector-dispatch-attempts.ts:41:      technicianIds.map(async (technicianId) => {
> api\src\functions\trigger-projector-dispatch-attempts.ts:42:        const actionId = 
buildPendingActionId('JOB_OFFER', technicianId, attemptId);
  api\src\functions\trigger-projector-dispatch-attempts.ts:43:        const { doc: upserted, noOp } = await 
upsertAction({
  api\src\functions\trigger-projector-dispatch-attempts.ts:44:          id: actionId,
  api\src\functions\trigger-projector-dispatch-attempts.ts:45:          userId: technicianId,
  api\src\functions\trigger-projector-dispatch-attempts.ts:46:          type: 'JOB_OFFER',
  api\src\functions\trigger-projector-dispatch-attempts.ts:47:          role: 'technician',
> api\src\functions\trigger-projector-dispatch-attempts.ts:48:          sourceId: attemptId,
  api\src\functions\trigger-projector-dispatch-attempts.ts:49:          expiresAt, // inherit from dispatch attempt
  api\src\functions\trigger-projector-dispatch-attempts.ts:50:          priority: 1, // highest priority — 
time-sensitive
  api\src\functions\trigger-projector-dispatch-attempts.ts:51:          payload: {
> api\src\functions\trigger-projector-dispatch-attempts.ts:52:            attemptId,
  api\src\functions\trigger-projector-dispatch-attempts.ts:53:            bookingId: bookingId ?? '',
  api\src\functions\trigger-projector-dispatch-attempts.ts:54:          },
  api\src\functions\trigger-projector-dispatch-attempts.ts:55:        });
  api\src\functions\trigger-projector-dispatch-attempts.ts:69:    await Promise.all(
  api\src\functions\trigger-projector-dispatch-attempts.ts:70:      technicianIds.map(async (technicianId) => {
> api\src\functions\trigger-projector-dispatch-attempts.ts:71:        const actionId = 
buildPendingActionId('JOB_OFFER', technicianId, attemptId);
  api\src\functions\trigger-projector-dispatch-attempts.ts:72:        try {
  api\src\functions\trigger-projector-dispatch-attempts.ts:73:          await expireAction(actionId, technicianId);
  api\src\functions\trigger-projector-dispatch-attempts.ts:74:        } catch (err) {
  api\src\functions\trigger-projector-dispatch-attempts.ts:86:// ── Azure Functions trigger 
───────────────────────────────────────────────────
  api\src\functions\trigger-projector-dispatch-attempts.ts:87:
> api\src\functions\trigger-projector-dispatch-attempts.ts:88:app.cosmosDB('triggerProjectorDispatchAttempts', {
  api\src\functions\trigger-projector-dispatch-attempts.ts:89:  connection: 'COSMOS_CONNECTION_STRING',
  api\src\functions\trigger-projector-dispatch-attempts.ts:90:  databaseName: '%COSMOS_DATABASE%',
  api\src\functions\trigger-projector-dispatch-attempts.ts:91:  containerName: 'dispatch_attempts',
  api\src\functions\trigger-projector-dispatch-attempts.ts:93:  createLeaseContainerIfNotExists: false,
  api\src\functions\trigger-projector-dispatch-attempts.ts:94:  handler: async (documents: unknown[], ctx: 
InvocationContext) => {
> api\src\functions\trigger-projector-dispatch-attempts.ts:95:    const docs = documents as 
Array<Partial<DispatchAttemptDoc> & { id: string }>;
  api\src\functions\trigger-projector-dispatch-attempts.ts:96:    for (const doc of docs) {
  api\src\functions\trigger-projector-dispatch-attempts.ts:97:      try {
> api\src\functions\trigger-projector-dispatch-attempts.ts:98:        await processDispatchAttemptChangeFeedDoc(doc, 
ctx);
  api\src\functions\trigger-projector-dispatch-attempts.ts:99:      } catch (err) {
  api\src\functions\trigger-projector-dispatch-attempts.ts:100:        // Rethrow retryable Cosmos errors so runtime 
retries and checkpoint doesn't advance.
  api\src\functions\trigger-projector-dispatch-attempts.ts:101:        if (isRetryableCosmosError(err)) {
  api\src\schemas\dispatch-attempt.ts:1:import { z } from 'zod';
  api\src\schemas\dispatch-attempt.ts:2:
> api\src\schemas\dispatch-attempt.ts:3:export const DispatchAttemptStatusSchema = z.enum(['PENDING', 'ACCEPTED', 
'EXPIRED']);
  api\src\schemas\dispatch-attempt.ts:4:
> api\src\schemas\dispatch-attempt.ts:5:export const DispatchAttemptDocSchema = z.object({
  api\src\schemas\dispatch-attempt.ts:6:  id: z.string(),
  api\src\schemas\dispatch-attempt.ts:7:  bookingId: z.string(),
  api\src\schemas\dispatch-attempt.ts:8:  technicianIds: z.array(z.string()),
  api\src\schemas\dispatch-attempt.ts:9:  sentAt: z.string().datetime(),
  api\src\schemas\dispatch-attempt.ts:10:  expiresAt: z.string().datetime(),
> api\src\schemas\dispatch-attempt.ts:11:  status: DispatchAttemptStatusSchema,
  api\src\schemas\dispatch-attempt.ts:12:});
  api\src\schemas\dispatch-attempt.ts:13:
> api\src\schemas\dispatch-attempt.ts:14:export type DispatchAttemptDoc = z.infer<typeof DispatchAttemptDocSchema>;
> api\src\schemas\dispatch-attempt.ts:15:export type DispatchAttemptStatus = z.infer<typeof 
DispatchAttemptStatusSchema>;
  api\src\schemas\erasure-request.ts:31:  walletLedgerAnonymized: z.number().int().nonnegative(),
  api\src\schemas\erasure-request.ts:32:  bookingEventsAnonymized: z.number().int().nonnegative(),
> api\src\schemas\erasure-request.ts:33:  dispatchAttemptsAnonymized: z.number().int().nonnegative(),
  api\src\schemas\erasure-request.ts:34:  auditLogAnonymized: z.number().int().nonnegative(),
  api\src\schemas\erasure-request.ts:35:  technicianHardDeleted: z.boolean(),
  api\src\schemas\erasure-request.ts:36:  kycHardDeleted: z.boolean(),
  api\src\services\dispatcher.service.ts:4:import { getTechniciansWithinRadius } from 
'../cosmos/technician-repository.js';
  api\src\services\dispatcher.service.ts:5:import { catalogueRepo } from '../cosmos/catalogue-repository.js';
> api\src\services\dispatcher.service.ts:6:import { dispatchAttemptRepo } from 
'../cosmos/dispatch-attempt-repository.js';
  api\src\services\dispatcher.service.ts:7:import { haversine } from '../cosmos/geo.js';
> api\src\services\dispatcher.service.ts:8:import { getDispatchAttemptsContainer } from '../cosmos/client.js';
  api\src\services\dispatcher.service.ts:9:import { getFirebaseAdmin } from './firebaseAdmin.js';
  api\src\services\dispatcher.service.ts:10:import type { TechnicianProfile } from '../schemas/technician.js';
> api\src\services\dispatcher.service.ts:11:import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';
  api\src\services\dispatcher.service.ts:12:import type { BookingDoc } from '../schemas/booking.js';
  api\src\services\dispatcher.service.ts:13:import { normalizeAddressText } from '../shared/address-text.js';
  api\src\services\dispatcher.service.ts:14:
  api\src\services\dispatcher.service.ts:88:  const expiresAt = new Date(sentAt.getTime() + OFFER_WINDOW_MS);
  api\src\services\dispatcher.service.ts:89:
> api\src\services\dispatcher.service.ts:90:  const attempt: DispatchAttemptDoc = {
  api\src\services\dispatcher.service.ts:91:    id: randomUUID(),
  api\src\services\dispatcher.service.ts:92:    bookingId,
  api\src\services\dispatcher.service.ts:93:    technicianIds: [selectedTechnicianId],
  api\src\services\dispatcher.service.ts:97:  };
  api\src\services\dispatcher.service.ts:98:
> api\src\services\dispatcher.service.ts:99:  await getDispatchAttemptsContainer().items.create(attempt);
  api\src\services\dispatcher.service.ts:100:  // Transition to SEARCHING so the stale-booking reconciler can find 
stuck dispatches
  api\src\services\dispatcher.service.ts:101:  await updateBookingFields(bookingId, { status: 'SEARCHING' });
  api\src\services\dispatcher.service.ts:102:
  api\src\services\dispatcher.service.ts:127:          ),
  api\src\services\dispatcher.service.ts:128:          expiresAt: expiresAt.toISOString(),
> api\src\services\dispatcher.service.ts:129:          dispatchAttemptId: attempt.id,
  api\src\services\dispatcher.service.ts:130:        },
  api\src\services\dispatcher.service.ts:131:      });
  api\src\services\dispatcher.service.ts:132:    } catch (err: unknown) {
  api\src\services\dispatcher.service.ts:153:    let dispatched = 0;
  api\src\services\dispatcher.service.ts:154:    for (const booking of bookings.filter((b) => isStillDispatchable(b))) 
{
> api\src\services\dispatcher.service.ts:155:      const previouslyAttempted = await 
dispatchAttemptRepo.getAttemptedTechnicianIds(booking.id);
  api\src\services\dispatcher.service.ts:156:      if (await dispatchBookingToTechs(booking.id, booking, 
DISPATCH_RADIUS_KM, previouslyAttempted)) {
  api\src\services\dispatcher.service.ts:157:        dispatched += 1;
  api\src\services\dispatcher.service.ts:158:      }
  api\src\services\dispatcher.service.ts:189:    const booking = await bookingRepo.getById(bookingId);
  api\src\services\dispatcher.service.ts:190:    if (!booking || booking.status !== 'SEARCHING') return false;
> api\src\services\dispatcher.service.ts:191:    const previouslyAttempted = await 
dispatchAttemptRepo.getAttemptedTechnicianIds(bookingId);
  api\src\services\dispatcher.service.ts:192:    return dispatchBookingToTechs(
  api\src\services\dispatcher.service.ts:193:      bookingId,
  api\src\services\dispatcher.service.ts:194:      booking,
  api\src\services\erasureCascade.service.ts:37:    walletLedgerAnonymized,
  api\src\services\erasureCascade.service.ts:38:    bookingEventsAnonymized,
> api\src\services\erasureCascade.service.ts:39:    dispatchAttemptsAnonymized,
  api\src\services\erasureCascade.service.ts:40:    auditLogAnonymized,
  api\src\services\erasureCascade.service.ts:41:  ] = await Promise.all([
  api\src\services\erasureCascade.service.ts:42:    userDataCascadeWrites.anonymizeBookings(userId, hash),
  api\src\services\erasureCascade.service.ts:47:      : Promise.resolve(0),
  api\src\services\erasureCascade.service.ts:48:    userDataCascadeWrites.anonymizeBookingEvents(userId, hash),
> api\src\services\erasureCascade.service.ts:49:    userDataCascadeWrites.anonymizeDispatchAttempts(userId, hash),
  api\src\services\erasureCascade.service.ts:50:    userDataCascadeWrites.anonymizeAuditLogResourceId(userId, hash),
  api\src\services\erasureCascade.service.ts:51:  ]);
  api\src\services\erasureCascade.service.ts:52:
  api\src\services\erasureCascade.service.ts:75:    walletLedgerAnonymized,
  api\src\services\erasureCascade.service.ts:76:    bookingEventsAnonymized,
> api\src\services\erasureCascade.service.ts:77:    dispatchAttemptsAnonymized,
  api\src\services\erasureCascade.service.ts:78:    auditLogAnonymized,
  api\src\services\erasureCascade.service.ts:79:    technicianHardDeleted,
  api\src\services\erasureCascade.service.ts:80:    kycHardDeleted,



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'api/src/services/pending-action-projector.ts' | Select-Object -Skip 190 -First 70" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 618ms:
}

/**
 * Send an FCM push notification for a pending action.
 *
 * MUST be called AFTER upsertAction() â€” never before.
 * The Semgrep rule `pending-action-fcm-ordering` enforces this in projector files.
 *
 * Does not retry inline on failure; relies on next change-feed re-delivery.
 */
export async function emitFcmForAction(
  doc: PendingActionDoc,
  _projectorSource: string,
): Promise<void> {
  const topic = doc.role === 'customer'
    ? `customer_${doc.userId}`
    : `technician_${doc.userId}`;

  const start = Date.now();
  _log('fcm_send_attempt', { action_id: doc.id, target_user_id: doc.userId });

  try {
    await getFirebaseAdmin().messaging().send({
      topic,
      data: {
        type: doc.type,
        actionId: doc.id,
        sourceId: doc.sourceId,
        // Legacy-client compatibility fields.
        // Customer app (CustomerFirebaseMessagingService) returns early on
        // ADDON_APPROVAL_REQUESTED and RATING_PROMPT_CUSTOMER without bookingId.
        // Technician app (HomeservicesFcmService) defaults missing `overall` to 1
        // for RATING_RECEIVED (wrong content). We hoist these top-level so existing
        // clients can parse them directly without touching the payload JSON blob.
        ..._fcmCompatFields(doc),
        ...(doc.payload ? { payload: JSON.stringify(doc.payload) } : {}),
      },
    });
    _log('fcm_send_success', { action_id: doc.id, ms_elapsed: Date.now() - start });
  } catch (err: unknown) {
    const errorCode = err instanceof Error ? err.message : String(err);
    _log('fcm_send_failure', { action_id: doc.id, error_code: errorCode });
    // No inline retry â€” rely on next reconcile via change-feed re-delivery
  }
}

/**
 * Convenience factory for building a deterministic action id.
 * Re-exported from schema module for projector use.
 */
export { buildPendingActionId };

// â”€â”€ Private helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function _transitionStatus(
  id: string,
  userId: string,
  targetStatus: 'RESOLVED' | 'EXPIRED',
): Promise<PendingActionDoc | null> {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    const existing = await getPendingActionById(id, userId);
    if (!existing) return null;
    if (existing.status === targetStatus) return existing; // already in target state â€” no-op

    const etag = existing._etag ?? '';
    const updated: PendingActionDoc = {
      ...existing,
      status: targetStatus,

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path 'api/src/services/pending-action-projector.ts' -Pattern 'function _fcmCompatFields' -Context 0,80" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 681ms:

> api\src\services\pending-action-projector.ts:300:function _fcmCompatFields(doc: PendingActionDoc): Record<string, 
string> {
  api\src\services\pending-action-projector.ts:301:  const p = doc.payload ?? {};
  api\src\services\pending-action-projector.ts:302:  switch (doc.type) {
  api\src\services\pending-action-projector.ts:303:    case 'ADDON_APPROVAL_REQUESTED':
  api\src\services\pending-action-projector.ts:304:    case 'RATING_PROMPT_CUSTOMER':
  api\src\services\pending-action-projector.ts:305:      // bookingId is required — apps return early without it
  api\src\services\pending-action-projector.ts:306:      return typeof p['bookingId'] === 'string' ? { bookingId: 
p['bookingId'] } : {};
  api\src\services\pending-action-projector.ts:307:    case 'RATING_RECEIVED': {
  api\src\services\pending-action-projector.ts:308:      // overall must be a string (FCM data values are always 
strings)
  api\src\services\pending-action-projector.ts:309:      const overall = p['overall'];
  api\src\services\pending-action-projector.ts:310:      if (overall === undefined) return {};
  api\src\services\pending-action-projector.ts:311:      // Narrow to a JSON-safe primitive before converting to avoid 
[object Object]
  api\src\services\pending-action-projector.ts:312:      const overallStr = typeof overall === 'number' || typeof 
overall === 'string' || typeof overall === 'boolean'
  api\src\services\pending-action-projector.ts:313:        ? String(overall)
  api\src\services\pending-action-projector.ts:314:        : JSON.stringify(overall);
  api\src\services\pending-action-projector.ts:315:      return { overall: overallStr };
  api\src\services\pending-action-projector.ts:316:    }
  api\src\services\pending-action-projector.ts:317:    default:
  api\src\services\pending-action-projector.ts:318:      return {};
  api\src\services\pending-action-projector.ts:319:  }
  api\src\services\pending-action-projector.ts:320:}
  api\src\services\pending-action-projector.ts:321:
  api\src\services\pending-action-projector.ts:322:/**
  api\src\services\pending-action-projector.ts:323: * Structured OTel log — emits via console.log so Azure Functions / 
Application
  api\src\services\pending-action-projector.ts:324: * Insights pick it up through the existing OpenTelemetry pipeline 
configured
  api\src\services\pending-action-projector.ts:325: * in api/src/observability/otel.ts.
  api\src\services\pending-action-projector.ts:326: *
  api\src\services\pending-action-projector.ts:327: * Format mirrors the existing InvocationContext-based structured 
logs used
  api\src\services\pending-action-projector.ts:328: * across the codebase (JSON-serialisable key-value pairs).
  api\src\services\pending-action-projector.ts:329: */
  api\src\services\pending-action-projector.ts:330:function _log(event: string, fields: Record<string, unknown>): void 
{
  api\src\services\pending-action-projector.ts:331:  try {
  api\src\services\pending-action-projector.ts:332:    console.log(JSON.stringify({ event, ...fields, ts: new 
Date().toISOString() }));
  api\src\services\pending-action-projector.ts:333:  } catch {
  api\src\services\pending-action-projector.ts:334:    // Logging must never throw
  api\src\services\pending-action-projector.ts:335:  }
  api\src\services\pending-action-projector.ts:336:}



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'technician-app/app/src/main/kotlin' -Include '*.kt' | Select-String -Pattern 'parseDeepLink|DeepLinkUri.parse|initialDeepLink|routeUri|onNewIntent|dataString' -Context 2,3 | Select-Object -First 200" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 633ms:

  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:692:            
entityType = entityType,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:693:            
entityId = intent.entityId,
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:694:            
routeUri = deepLinkUri,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:695:            
priority = priority,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:696:            
status = com.homeservices.corenav.PendingActionStatus.ACTIVE,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:697:            
sourceStatus = data["sourceStatus"],
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionEntity.kt:28:    
public val entityType: String,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionEntity.kt:29:    
public val entityId: String,
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionEntity.kt:30:    
public val routeUri: String,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionEntity.kt:31:    
public val priority: String,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionEntity.kt:32:    
public val status: String,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\db\PendingActionEntity.kt:33:    
public val sourceStatus: String?,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:136:         
   entityType = entityType,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:137:         
   entityId = entityId,
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:138:         
   routeUri = routeUri,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:139:         
   priority = PendingActionPriority.valueOf(priority),
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:140:         
   status = PendingActionStatus.valueOf(status),
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:141:         
   sourceStatus = sourceStatus,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:155:         
   entityType = entityType,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:156:         
   entityId = entityId,
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:157:         
   routeUri = routeUri,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:158:         
   priority = priority.name,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:159:         
   status = status.name,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStore.kt:160:         
   sourceStatus = sourceStatus,
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:80:      
  /**
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:81:      
   * Parse a `homeservices://action/<TYPE>?entityId=<id>` deep-link URI.
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:82:      
   * Delegates to [DeepLinkUri.parse] for scheme/host/query validation.
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:83:      
   */
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:84:      
  override fun parseDeepLink(uri: String): NotificationIntent? = DeepLinkUri.parse(uri)
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:85:
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:86:      
  // ── Private helpers ───────────────────────────────────────────────────
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:87:
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:279:               
     entityType = "booking",
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:280:               
     entityId = bookingId,
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:281:               
     routeUri = "homeservices://action/PHOTO_UPLOAD_PENDING?bookingId=$bookingId&stage=$stage",
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:282:               
     priority = com.homeservices.corenav.PendingActionPriority.NORMAL,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:283:               
     status = com.homeservices.corenav.PendingActionStatus.ACTIVE,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModel.kt:284:               
     sourceStatus = stage,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferFullScreenActivity.kt:103:    }
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferFullScreenActivity.kt:104:
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferFullScreenActivity.kt:105:    
override fun onNewIntent(intent: Intent) {
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferFullScreenActivity.kt:106:        
super.onNewIntent(intent)
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferFullScreenActivity.kt:107:        
setIntent(intent)
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferFullScreenActivity.kt:108:        
emitIntentOffer(intent)
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\jobOffer\JobOfferFullScreenActivity.kt:109:    }
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:214:                        
entityType = "kyc",
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:215:                        
entityId = techId,
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:216:                        
routeUri = "homeservices://kyc",
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:217:                        
priority = PendingActionPriority.NORMAL,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:218:                        
status = PendingActionStatus.ACTIVE,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:219:                        
sourceStatus = null,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:243:                        
entityType = "kyc",
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:244:                        
entityId = techId,
> technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:245:                        
routeUri = fileUri.toString(),
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:246:                        
priority = PendingActionPriority.HIGH,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:247:                        
status = PendingActionStatus.ACTIVE,
  technician-app\app\src\main\kotlin\com\homeservices\technician\ui\kyc\KycViewModel.kt:248:                        
sourceStatus = null,
  technician-app\app\src\main\kotlin\com\homeservices\technician\MainActivity.kt:51:    }
  technician-app\app\src\main\kotlin\com\homeservices\technician\MainActivity.kt:52:
> technician-app\app\src\main\kotlin\com\homeservices\technician\MainActivity.kt:53:    override fun 
onNewIntent(intent: Intent) {
> technician-app\app\src\main\kotlin\com\homeservices\technician\MainActivity.kt:54:        super.onNewIntent(intent)
  technician-app\app\src\main\kotlin\com\homeservices\technician\MainActivity.kt:55:        val data = intent.data ?: 
return
  technician-app\app\src\main\kotlin\com\homeservices\technician\MainActivity.kt:56:        if (data.scheme == 
"homeservices" &&
  technician-app\app\src\main\kotlin\com\homeservices\technician\MainActivity.kt:57:            data.host == "kyc" &&



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'technician-app/app/src/main/kotlin/com/homeservices/technician/MainActivity.kt' | Select-Object -First 120; Get-Content -LiteralPath 'technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt' | Select-Object -Skip 100 -First 45" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 649ms:
package com.homeservices.technician

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.fragment.app.FragmentActivity
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.data.fcm.FcmTopicSubscriber
import com.homeservices.technician.data.kyc.DigiLockerCallbackBus
import com.homeservices.technician.data.rating.RatingPromptEventBus
import com.homeservices.technician.data.rating.RatingReceivedEventBus
import com.homeservices.technician.di.BuildInfoProvider
import com.homeservices.technician.domain.jobOffer.FcmTokenSyncUseCase
import com.homeservices.technician.navigation.AppNavigation
import com.truecaller.android.sdk.legacy.TruecallerSDK
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
public class MainActivity : FragmentActivity() {
    @Inject public lateinit var buildInfo: BuildInfoProvider

    @Inject public lateinit var sessionManager: SessionManager

    @Inject public lateinit var ratingPromptEventBus: RatingPromptEventBus

    @Inject public lateinit var ratingReceivedEventBus: RatingReceivedEventBus

    @Inject public lateinit var fcmTopicSubscriber: FcmTopicSubscriber

    @Inject public lateinit var fcmTokenSyncUseCase: FcmTokenSyncUseCase

    @Inject public lateinit var digiLockerCallbackBus: DigiLockerCallbackBus

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        navigateFromExtra(intent.getStringExtra("navigate_to"), ratingReceivedEventBus)
        setContent {
            HomeservicesTheme {
                AppNavigation(
                    sessionManager = sessionManager,
                    activity = this,
                    ratingPromptEventBus = ratingPromptEventBus,
                    ratingReceivedEventBus = ratingReceivedEventBus,
                    fcmTopicSubscriber = fcmTopicSubscriber,
                    fcmTokenSyncUseCase = fcmTokenSyncUseCase,
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        val data = intent.data ?: return
        if (data.scheme == "homeservices" &&
            data.host == "kyc" &&
            data.path?.startsWith("/aadhaar-callback") == true
        ) {
            val code = data.getQueryParameter("code") ?: return
            digiLockerCallbackBus.post(code)
        }
    }

    /**
     * Truecaller SDK 3.x delivers the one-tap result via the legacy onActivityResult path.
     * @Suppress DEPRECATION because the SDK has not yet migrated to ActivityResultContracts.
     */
    @Suppress("DEPRECATION")
    override fun onActivityResult(
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
    ) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == TruecallerSDK.SHARE_PROFILE_REQUEST_CODE) {
            TruecallerSDK.getInstance().onActivityResultObtained(
                this,
                requestCode,
                resultCode,
                data,
            )
        }
    }
}
        backStackEntry.savedStateHandle
            .getStateFlow("refreshJobs", false)
            .collectAsStateWithLifecycle()
    LaunchedEffect(refreshJobs.value) {
        if (refreshJobs.value) {
            viewModel.refresh()
            backStackEntry.savedStateHandle["refreshJobs"] = false
        }
    }
    LaunchedEffect(Unit) {
        dashboardViewModel.reconcile()
    }
    TechnicianHomeScreen(
        authState = authState,
        onOpenJob = { bookingId -> navController.navigate("activeJob/$bookingId") },
        onViewRatings = { navController.navigate("ratings_transparency") },
        onPayoutSettings = { navController.navigate("payout_settings") },
        onLanguageSettings = { navController.navigate("language_settings") },
        onEditServices = { navController.navigate("edit_services") },
        onSignOut = onSignOut,
        onPendingActionClick = { action ->
            when (action.type) {
                PendingActionType.JOB_OFFER ->
                    navController.navigate("activeJob/${action.entityId}")
                PendingActionType.RATING_PROMPT_TECHNICIAN ->
                    navController.navigate(RatingRoutes.route(action.entityId))
                PendingActionType.RATING_RECEIVED ->
                    navController.navigate("ratings_transparency")
                PendingActionType.EARNINGS_UPDATE ->
                    navController.navigate("payout_settings")
                else -> Unit
            }
        },
        viewModel = viewModel,
        dashboardViewModel = dashboardViewModel,
    )
}

@Composable
private fun ActiveJobRoute(navController: NavController) {
    val viewModel: ActiveJobViewModel = hiltViewModel()
    val context = LocalContext.current
    LaunchedEffect(Unit) {
        viewModel.navigationEvents.collect { event ->
            if (event is NavigationEvent.Maps) {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'technician-app/app/src/test/kotlin' -Include '*.kt' | Select-String -Pattern 'parseDeepLink|DeepLinkUri|entityId|TechnicianNotificationRouter' -Context 1,3 | Select-Object -First 200" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 769ms:

  technician-app\app\src\test\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmServiceDashboardTest.kt:131:  
              type = PendingActionType.EARNINGS_UPDATE,
> technician-app\app\src\test\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmServiceDashboardTest.kt:132:  
              entityId = "earn-99",
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmServiceDashboardTest.kt:133:  
              rawArgs = mapOf("earningsId" to "earn-99"),
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmServiceDashboardTest.kt:134:  
          )
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmServiceDashboardTest.kt:135:  
      every { router.parseFcmData(any()) } returns intent
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmServiceDashboardTest.kt:147:  
              type = PendingActionType.RATING_PROMPT_TECHNICIAN,
> technician-app\app\src\test\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmServiceDashboardTest.kt:148:  
              entityId = "bk-55",
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmServiceDashboardTest.kt:149:  
              rawArgs = mapOf("bookingId" to "bk-55"),
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmServiceDashboardTest.kt:150:  
          )
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmServiceDashboardTest.kt:151:  
      every { router.parseFcmData(any()) } returns intent
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionDaoTest.kt:66:        
entityType = "job_offer",
> technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionDaoTest.kt:67:        
entityId = "entity-$id",
> technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionDaoTest.kt:68:        
routeUri = "homeservices://action/$type?entityId=entity-$id",
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionDaoTest.kt:69:        
priority = priority,
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionDaoTest.kt:70:        
status = status,
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionDaoTest.kt:71:        
sourceStatus = null,
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreKycTest.kt:38:   
         entityType = "kyc",
> technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreKycTest.kt:39:   
         entityId = techId,
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreKycTest.kt:40:   
         routeUri = "homeservices://kyc",
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreKycTest.kt:41:   
         priority = PendingActionPriority.HIGH.name,
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreKycTest.kt:42:   
         status = PendingActionStatus.ACTIVE.name,
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreKycTest.kt:59:   
         assertThat(action).isNotNull()
> technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreKycTest.kt:60:   
         assertThat(action!!.entityId).isEqualTo("tech-1")
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreKycTest.kt:61:   
         assertThat(action.type).isEqualTo(PendingActionType.PHOTO_UPLOAD_RETRY)
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreKycTest.kt:62:   
         assertThat(action.status).isEqualTo(PendingActionStatus.ACTIVE)
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreKycTest.kt:63:   
     }
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStorePhotoTest.kt:32: 
           entityType = "booking",
> technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStorePhotoTest.kt:33: 
           entityId = bookingId,
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStorePhotoTest.kt:34: 
           routeUri = "homeservices://action/PHOTO_UPLOAD_PENDING?bookingId=$bookingId",
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStorePhotoTest.kt:35: 
           priority = PendingActionPriority.NORMAL.name,
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStorePhotoTest.kt:36: 
           status = PendingActionStatus.ACTIVE.name,
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStorePhotoTest.kt:53: 
           assertThat(action).isNotNull()
> technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStorePhotoTest.kt:54: 
           assertThat(action!!.entityId).isEqualTo("bk-1")
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStorePhotoTest.kt:55: 
           assertThat(action.type).isEqualTo(PendingActionType.PHOTO_UPLOAD_PENDING)
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStorePhotoTest.kt:56: 
           assertThat(action.status).isEqualTo(PendingActionStatus.ACTIVE)
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStorePhotoTest.kt:57: 
       }
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreTest.kt:36:      
      entityType = "booking",
> technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreTest.kt:37:      
      entityId = "bk-1",
> technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreTest.kt:38:      
      routeUri = "homeservices://action/JOB_OFFER?entityId=bk-1",
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreTest.kt:39:      
      priority = PendingActionPriority.HIGH.name,
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreTest.kt:40:      
      status = PendingActionStatus.ACTIVE.name,
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreTest.kt:41:      
      sourceStatus = null,
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreTest.kt:56:      
      entityType = "booking",
> technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreTest.kt:57:      
      entityId = "bk-1",
> technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreTest.kt:58:      
      routeUri = "homeservices://action/JOB_OFFER?entityId=bk-1",
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreTest.kt:59:      
      priority = PendingActionPriority.HIGH,
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreTest.kt:60:      
      status = PendingActionStatus.ACTIVE,
  technician-app\app\src\test\kotlin\com\homeservices\technician\data\pendingaction\PendingActionStoreTest.kt:61:      
      sourceStatus = null,
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\PendingActionIngestorTest.kt:159:        
    entityType = "booking",
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\PendingActionIngestorTest.kt:160:        
    entityId = "bk1",
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\PendingActionIngestorTest.kt:161:        
    routeUri = "homeservices://action/JOB_OFFER?entityId=bk1",
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\PendingActionIngestorTest.kt:162:        
    priority = PendingActionPriority.HIGH,
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\PendingActionIngestorTest.kt:163:        
    status = PendingActionStatus.ACTIVE,
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\PendingActionIngestorTest.kt:164:        
    sourceStatus = null,
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:8:/**
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:9: * 
JVM unit tests for [TechnicianNotificationRouter].
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:10: *
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:11: 
* Covers technician FCM types: JOB_OFFER, RATING_PROMPT_TECHNICIAN, EARNINGS_UPDATE,
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:12: 
* RATING_RECEIVED, COMPLAINT_UPDATE, SUPPORT_FOLLOWUP, KYC_RESUME + deep-link parsing.
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:15: 
*/
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:16:pu
blic class TechnicianNotificationRouterTest {
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:17:  
  private lateinit var router: TechnicianNotificationRouter
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:18:
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:19:  
  @Before
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:20:  
  public fun setUp() {
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:21:  
      router = TechnicianNotificationRouter()
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:22:  
  }
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:23:
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:24:  
  // ── parseFcmData ──────────────────────────────────────────────────────────
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:32:  
      assertThat(result!!.type).isEqualTo(PendingActionType.JOB_OFFER)
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:33:  
      assertThat(result.entityId).isEqualTo("bk1")
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:34:  
  }
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:35:
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:36:  
  @Test
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:42:  
      assertThat(result!!.type).isEqualTo(PendingActionType.RATING_PROMPT_TECHNICIAN)
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:43:  
      assertThat(result.entityId).isEqualTo("bk2")
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:44:  
  }
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:45:
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:46:  
  @Test
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:52:  
      assertThat(result!!.type).isEqualTo(PendingActionType.EARNINGS_UPDATE)
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:53:  
      assertThat(result.entityId).isEqualTo("e1")
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:54:  
  }
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:55:
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:56:  
  @Test
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:62:  
      assertThat(result!!.type).isEqualTo(PendingActionType.RATING_RECEIVED)
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:63:  
      assertThat(result.entityId).isEqualTo("bk3")
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:64:  
  }
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:65:
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:66:  
  @Test
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:72:  
      assertThat(result!!.type).isEqualTo(PendingActionType.COMPLAINT_UPDATE)
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:73:  
      assertThat(result.entityId).isEqualTo("cmp1")
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:74:  
  }
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:75:
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:76:  
  @Test
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:82:  
      assertThat(result!!.type).isEqualTo(PendingActionType.KYC_RESUME)
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:83:  
      assertThat(result.entityId).isEqualTo("t1")
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:84:  
  }
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:85:
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:86:  
  @Test
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:100: 
   @Test
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:101: 
   public fun `parseFcmData returns null when entityId is missing`() {
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:102: 
       val data = mapOf("type" to "JOB_OFFER")
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:103: 
       val result = router.parseFcmData(data)
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:104: 
       assertThat(result).isNull()
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:138: 
       assertThat(result!!.type).isEqualTo(PendingActionType.JOB_OFFER)
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:139: 
       assertThat(result.entityId).isEqualTo("bk10")
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:140: 
       assertThat(result.rawArgs["actionId"])
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:141: 
           .isEqualTo("JOB_OFFER:technician:t1:booking:bk10")
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:142: 
   }
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:156: 
       assertThat(result!!.type).isEqualTo(PendingActionType.KYC_RESUME)
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:157: 
       assertThat(result.entityId).isEqualTo("t2")
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:158: 
   }
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:159:
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:160: 
   @Test
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:172: 
       assertThat(result).isNotNull
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:173: 
       assertThat(result!!.entityId).isEqualTo("bk-legacy")
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:174: 
   }
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:175:
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:176: 
   @Test
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:188:
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:189: 
   // ── parseDeepLink ─────────────────────────────────────────────────────────
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:190:
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:191: 
   @Test
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:192: 
   public fun `parseDeepLink parses valid homeservices deep link for technician`() {
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:193: 
       val uri = "homeservices://action/JOB_OFFER?entityId=bk5"
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:194: 
       val result = router.parseDeepLink(uri)
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:195:
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:196: 
       assertThat(result).isNotNull
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:197: 
       assertThat(result!!.type).isEqualTo(PendingActionType.JOB_OFFER)
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:198: 
       assertThat(result.entityId).isEqualTo("bk5")
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:199: 
   }
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:200:
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:201: 
   @Test
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:202: 
   public fun `parseDeepLink returns null for malformed URI`() {
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:203: 
       val result = router.parseDeepLink("bad://??malformed")
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:204: 
       assertThat(result).isNull()
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:205: 
   }
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:206:
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:207: 
   @Test
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:208: 
   public fun `parseDeepLink returns null for empty string`() {
> technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:209: 
       val result = router.parseDeepLink("")
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:210: 
       assertThat(result).isNull()
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:211: 
   }
  technician-app\app\src\test\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouterTest.kt:212:}
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModelPhotoRetryTest.kt:76:  
          entityType = "booking",
> technician-app\app\src\test\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModelPhotoRetryTest.kt:77:  
          entityId = bookingId,
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModelPhotoRetryTest.kt:78:  
          routeUri = "homeservices://action/PHOTO_UPLOAD_PENDING?bookingId=$bookingId",
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModelPhotoRetryTest.kt:79:  
          priority = PendingActionPriority.NORMAL,
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModelPhotoRetryTest.kt:80:  
          status = PendingActionStatus.ACTIVE,
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModelPhotoRetryTest.kt:232: 
                       action.type == PendingActionType.PHOTO_UPLOAD_PENDING &&
> technician-app\app\src\test\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModelPhotoRetryTest.kt:233: 
                           action.entityId == "bk-1" &&
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModelPhotoRetryTest.kt:234: 
                           action.userId == "t-uid" &&
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModelPhotoRetryTest.kt:235: 
                           action.sourceStatus == "REACHED"
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\activeJob\ActiveJobViewModelPhotoRetryTest.kt:236: 
                   },
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCardPaparazziTest.kt:39:    
        entityType = "booking",
> technician-app\app\src\test\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCardPaparazziTest.kt:40:    
        entityId = "bk-snap-1",
> technician-app\app\src\test\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCardPaparazziTest.kt:41:    
        routeUri = "homeservices://action/${type.name}?entityId=bk-snap-1",
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCardPaparazziTest.kt:42:    
        priority = priority,
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCardPaparazziTest.kt:43:    
        status = PendingActionStatus.ACTIVE,
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\dashboard\PendingActionCardPaparazziTest.kt:44:    
        sourceStatus = null,
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\dashboard\TechnicianDashboardViewModelTest.kt:66:  
          entityType = "booking",
> technician-app\app\src\test\kotlin\com\homeservices\technician\ui\dashboard\TechnicianDashboardViewModelTest.kt:67:  
          entityId = "bk-$id",
> technician-app\app\src\test\kotlin\com\homeservices\technician\ui\dashboard\TechnicianDashboardViewModelTest.kt:68:  
          routeUri = "homeservices://action/${type.name}?entityId=bk-$id",
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\dashboard\TechnicianDashboardViewModelTest.kt:69:  
          priority = priority,
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\dashboard\TechnicianDashboardViewModelTest.kt:70:  
          status = PendingActionStatus.ACTIVE,
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\dashboard\TechnicianDashboardViewModelTest.kt:71:  
          sourceStatus = null,
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:190:              
          entityType = "kyc",
> technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:191:              
          entityId = techId,
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:192:              
          routeUri = "content://media/pan.jpg",
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:193:              
          priority = PendingActionPriority.HIGH,
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:194:              
          status = PendingActionStatus.ACTIVE,
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:219:              
          entityType = "booking",
> technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:220:              
          entityId = "bk-1",
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:221:              
          routeUri = "homeservices://offer/bk-1",
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:222:              
          priority = PendingActionPriority.HIGH,
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:223:              
          status = PendingActionStatus.ACTIVE,
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:270:              
  pendingActionStore.upsert(
> technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:271:              
      match { it.type == PendingActionType.PHOTO_UPLOAD_RETRY && it.entityId == techId },
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:272:              
  )
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:273:            }
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:274:        }
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:288:              
  pendingActionStore.upsert(
> technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:289:              
      match { it.type == PendingActionType.KYC_SUBMIT_PENDING && it.entityId == techId },
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:290:              
  )
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:291:            }
  technician-app\app\src\test\kotlin\com\homeservices\technician\ui\kyc\KycViewModelKycStatusTest.kt:292:        }



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'technician-app/app/src/main/kotlin/com/homeservices/technician/data/fcm/HomeservicesFcmService.kt' | Select-Object -Skip 580 -First 130" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 675ms:
                    com.homeservices.technician.R.string.kyc_verified_notification_body
                } else {
                    com.homeservices.technician.R.string.kyc_rejected_notification_body
                },
            )
        val notification =
            NotificationCompat
                .Builder(this, CHANNEL_SYSTEM)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title ?: defaultTitle)
                .setContentText(body ?: defaultBody)
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build()
        nm.notify(NOTIFICATION_ID_KYC_STATUS, notification)
    }

    private fun showOnboardingReminderNotification(
        title: String?,
        body: String?,
    ) {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        val intent =
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pi =
            PendingIntent.getActivity(
                this,
                REQUEST_CODE_ONBOARDING_REMINDER,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        val defaultTitle = getString(com.homeservices.technician.R.string.onboarding_reminder_notification_title)
        val defaultBody = getString(com.homeservices.technician.R.string.onboarding_reminder_notification_body)
        val notification =
            NotificationCompat
                .Builder(this, CHANNEL_SYSTEM)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title ?: defaultTitle)
                .setContentText(body ?: defaultBody)
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build()
        nm.notify(NOTIFICATION_ID_ONBOARDING_REMINDER, notification)
    }

    override fun onNewToken(token: String): Unit {
        serviceScope.launch {
            fcmTokenSyncUseCase.invokeWithFcmToken(token)
            deviceTokenRegistrar.register()
        }
    }

    public override fun onDestroy(): Unit {
        super.onDestroy()
        serviceScope.cancel()
    }

    private fun parseJobOffer(data: Map<String, String>): JobOffer? {
        return try {
            val expiresAtMs = Instant.parse(data["expiresAt"] ?: return null).toEpochMilli()
            JobOffer(
                bookingId = data["bookingId"] ?: return null,
                serviceId = data["serviceId"] ?: return null,
                serviceName = data["serviceName"] ?: return null,
                addressText = data["addressText"] ?: return null,
                slotDate = data["slotDate"] ?: return null,
                slotWindow = data["slotWindow"] ?: return null,
                amountPaise = data["amount"]?.toLongOrNull() ?: return null,
                distanceKm = data["distanceKm"]?.toDoubleOrNull() ?: return null,
                expiresAtMs = expiresAtMs,
            )
        } catch (_: Exception) {
            null
        }
    }

    // â”€â”€ PendingAction builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private fun buildPendingActionFromIntent(
        intent: com.homeservices.corenav.NotificationIntent,
        data: Map<String, String>,
    ): com.homeservices.corenav.PendingAction? {
        val userId = data["userId"] ?: return null
        val actionId =
            data["actionId"]
                ?: "${intent.type.name}:technician:$userId:${intent.type.name.lowercase()}:${intent.entityId}"
        val version = data["version"]?.toLongOrNull() ?: 1L
        val priority =
            runCatching {
                com.homeservices.corenav.PendingActionPriority
                    .valueOf(data["priority"] ?: "NORMAL")
            }.getOrDefault(com.homeservices.corenav.PendingActionPriority.NORMAL)
        val entityType = data["entityType"] ?: intent.type.name.lowercase()
        val nowMs = System.currentTimeMillis()
        val createdAt = data["createdAt"]?.toLongOrNull() ?: nowMs
        val updatedAt = data["updatedAt"]?.toLongOrNull() ?: nowMs
        val expiresAt =
            data["expiresAt"]?.let {
                runCatching { Instant.parse(it).toEpochMilli() }.getOrNull()
                    ?: it.toLongOrNull()
            }
        val deepLinkUri =
            com.homeservices.corenav.DeepLinkUri
                .build(intent)

        return com.homeservices.corenav.PendingAction(
            id = actionId,
            userId = userId,
            role = "technician",
            type = intent.type,
            entityType = entityType,
            entityId = intent.entityId,
            routeUri = deepLinkUri,
            priority = priority,
            status = com.homeservices.corenav.PendingActionStatus.ACTIVE,
            sourceStatus = data["sourceStatus"],
            version = version,
            createdAt = createdAt,
            updatedAt = updatedAt,
            expiresAt = expiresAt,
            resolvedAt = null,
        )
    }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'technician-app/app/src/main/kotlin/com/homeservices/technician' -Include '*.kt' | Select-String -Pattern 'DeepLinkUri|parseDeepLink|initialDeepLink|navigate_to|routeFor\\(|NotificationRouter' -Context 2,3" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 758ms:

  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:9:import 
com.google.firebase.messaging.FirebaseMessagingService
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:10:import 
com.google.firebase.messaging.RemoteMessage
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:11:import 
com.homeservices.corenav.NotificationRouter
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:12:import 
com.homeservices.technician.MainActivity
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:13:import 
com.homeservices.technician.data.activeJob.BookingStatusEvent
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:14:import 
com.homeservices.technician.data.activeJob.BookingStatusEventBus
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:38: *
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:39: * Refactored 
in E11-S01b-1 to delegate pending-action FCM types to
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:40: * 
[PendingActionIngestor] via [NotificationRouter] parsing. Legacy in-process
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:41: * event bus 
routing (JOB_OFFER, RATING_PROMPT_TECHNICIAN, EARNINGS_UPDATE,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:42: * 
RATING_RECEIVED) is preserved for backward-compatibility until E11-S01b-2.
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:43: *
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:152:
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:153:    @Inject
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:154:    public 
lateinit var router: NotificationRouter
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:155:
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:156:    @Inject
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:157:    public 
lateinit var ingestor: PendingActionIngestor
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:180:     *
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:181:     * Routing 
strategy (E11-S01b-1):
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:182:     *   1. 
Parse via [NotificationRouter] → if recognised, delegate to [PendingActionIngestor]
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:183:     *      
and show a tray notification with deep-link PendingIntent.
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:184:     *   2. 
JOB_OFFER additionally triggers the in-process [JobOfferEventBus] for the
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:185:     *      
full-screen offer UI (EventBus removal deferred to E11-S01b-2).
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:192:    
@Suppress("CyclomaticComplexMethod", "LongMethod", "ReturnCount")
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:193:    public fun 
handleMessageData(data: Map<String, String>) {
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:194:        // 
Attempt to ingest via NotificationRouter (pending-action types)
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:195:        val 
intent = router.parseFcmData(data)
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:196:        if 
(intent != null) {
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:197:            
val action = buildPendingActionFromIntent(intent, data)
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:379:            
Intent(this, MainActivity::class.java)
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:380:               
 .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:381:               
 .putExtra("navigate_to", "ratings_transparency")
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:382:        val pi 
=
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:383:            
PendingIntent.getActivity(
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:384:               
 this,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:454:            
Intent(this, MainActivity::class.java)
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:455:               
 .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:456:               
 .putExtra("navigate_to", "payout_settings")
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:457:        val pi 
=
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:458:            
PendingIntent.getActivity(
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:459:               
 this,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:512:            
Intent(this, MainActivity::class.java)
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:513:               
 .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:514:               
 .putExtra("navigate_to", "rating/$bookingId")
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:515:        val pi 
=
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:516:            
PendingIntent.getActivity(
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:517:               
 this,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:681:               
     ?: it.toLongOrNull()
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:682:            }
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:683:        val 
deepLinkUri =
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:684:            
com.homeservices.corenav.DeepLinkUri
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:685:               
 .build(intent)
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:686:
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:687:        return 
com.homeservices.corenav.PendingAction(
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:692:            
entityType = entityType,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:693:            
entityId = intent.entityId,
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:694:            
routeUri = deepLinkUri,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:695:            
priority = priority,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:696:            
status = com.homeservices.corenav.PendingActionStatus.ACTIVE,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\fcm\HomeservicesFcmService.kt:697:            
sourceStatus = data["sourceStatus"],
  
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:136:
  
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:137: 
   private fun buildNotification(bookingId: String): Notification {
> 
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:138: 
       val deepLinkUri = "homeservices://action/active-job/$bookingId"
  
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:139: 
       val tapIntent =
  
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:140: 
           Intent(Intent.ACTION_VIEW).apply {
> 
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:141: 
               data = android.net.Uri.parse(deepLinkUri)
  
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:142: 
               setClass(this@LocationForegroundService, com.homeservices.technician.MainActivity::class.java)
  
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:143: 
               addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
  
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:144: 
           }
  
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:146: 
           PendingIntent.getActivity(
  
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:147: 
               this,
> 
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:148: 
               deepLinkUri.hashCode(),
  
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:149: 
               tapIntent,
  
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:150: 
               PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
  
technician-app\app\src\main\kotlin\com\homeservices\technician\data\location\service\LocationForegroundService.kt:151: 
           )
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:1:package 
com.homeservices.technician.notification.di
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:2:
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:3:import 
com.homeservices.corenav.NotificationRouter
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:4:import 
com.homeservices.technician.data.pendingaction.PendingActionStore
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:5:import 
com.homeservices.technician.notification.PendingActionIngestor
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:6:import 
com.homeservices.technician.notification.TechnicianNotificationRouter
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:7:import 
dagger.Binds
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:8:import 
dagger.Module
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:9:import 
dagger.Provides
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:17: *
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:18: * Provides:
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:19: *   - 
[NotificationRouter] bound to [TechnicianNotificationRouter]
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:20: *   - 
[java.time.Clock] as system clock (injectable for testability)
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:21: *   - 
[PendingActionIngestor] assembled from [PendingActionStore] + [Clock]
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:22: *
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:29:public 
abstract class NotificationModule {
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:30:    /**
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:31:     * Bind 
[TechnicianNotificationRouter] to the [NotificationRouter] interface.
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:32:     */
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:33:    @Binds
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:34:    
@Singleton
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:35:    public 
abstract fun bindNotificationRouter(impl: TechnicianNotificationRouter): NotificationRouter
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:36:
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:37:    public 
companion object {
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\di\NotificationModule.kt:38:        
@Provides
  
technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:1:package 
com.homeservices.technician.notification
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:2:
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:3:import 
com.homeservices.corenav.DeepLinkUri
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:4:import 
com.homeservices.corenav.NotificationIntent
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:5:import 
com.homeservices.corenav.NotificationRouter
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:6:import 
com.homeservices.corenav.PendingActionType
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:7:import 
javax.inject.Inject
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:8:import 
javax.inject.Singleton
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:9:
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:10:/**
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:11: * 
Technician-app implementation of [NotificationRouter].
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:12: *
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:13: * 
Parses raw FCM data payloads and `homeservices://` deep-link URIs into
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:14: * 
[NotificationIntent] values for downstream processing by [PendingActionIngestor].
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:23: *   
- KYC_RESUME (entityId = techId)
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:24: *
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:25: * 
Per E11 spec §2.8: NotificationRouter is a pure parser — no persistence, no network.
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:26: *
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:27: * ## 
Dual-shape payload support (E11-S01b-1 fix)
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:28: *
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:42: */
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:43:@Singl
eton
> 
technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:44:public 
class TechnicianNotificationRouter
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:45:    
@Inject
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:46:    
constructor() : NotificationRouter {
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:47:      
  /**
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:48:      
   * Parse a raw FCM data payload into a [NotificationIntent].
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:49:      
   *
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:80:      
  /**
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:81:      
   * Parse a `homeservices://action/<TYPE>?entityId=<id>` deep-link URI.
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:82:      
   * Delegates to [DeepLinkUri.parse] for scheme/host/query validation.
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:83:      
   */
> technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:84:      
  override fun parseDeepLink(uri: String): NotificationIntent? = DeepLinkUri.parse(uri)
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:85:
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:86:      
  // ── Private helpers ───────────────────────────────────────────────────
  technician-app\app\src\main\kotlin\com\homeservices\technician\notification\TechnicianNotificationRouter.kt:87:
  technician-app\app\src\main\kotlin\com\homeservices\technician\MainActivity.kt:36:    override fun 
onCreate(savedInstanceState: Bundle?) {
  technician-app\app\src\main\kotlin\com\homeservices\technician\MainActivity.kt:37:        
super.onCreate(savedInstanceState)
> technician-app\app\src\main\kotlin\com\homeservices\technician\MainActivity.kt:38:        
navigateFromExtra(intent.getStringExtra("navigate_to"), ratingReceivedEventBus)
  technician-app\app\src\main\kotlin\com\homeservices\technician\MainActivity.kt:39:        setContent {
  technician-app\app\src\main\kotlin\com\homeservices\technician\MainActivity.kt:40:            HomeservicesTheme {
  technician-app\app\src\main\kotlin\com\homeservices\technician\MainActivity.kt:41:                AppNavigation(
  technician-app\app\src\main\kotlin\com\homeservices\technician\NavigateFromExtra.kt:4:
  technician-app\app\src\main\kotlin\com\homeservices\technician\NavigateFromExtra.kt:5:/**
> technician-app\app\src\main\kotlin\com\homeservices\technician\NavigateFromExtra.kt:6: * Maps an Intent extra 
`navigate_to` value to a side-effect on a corresponding event bus.
  technician-app\app\src\main\kotlin\com\homeservices\technician\NavigateFromExtra.kt:7: *
  technician-app\app\src\main\kotlin\com\homeservices\technician\NavigateFromExtra.kt:8: * Used by 
[MainActivity.onCreate] to route FCM-triggered cold-start intents to the right
  technician-app\app\src\main\kotlin\com\homeservices\technician\NavigateFromExtra.kt:9: * downstream listener. 
Currently only the `ratings_transparency` value is wired; other



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'customer-app/app/src/test/kotlin' -Include '*.kt' | Select-String -Pattern '=\\s*runTest|:\\s*Unit\\s*=\\s*runTest|runTest \\{' -Context 0,0 | Select-Object -First 120" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 706ms:

customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerSignOutTest.kt:89:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerSignOutTest.kt:97:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerSignOutTest.kt:105:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerSignOutTest.kt:113:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerSignOutTest.kt:121:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerSignOutTest.kt:135:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerSignOutTest.kt:150:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerSignOutTest.kt:167:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerSignOutTest.kt:181:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerSignOutTest.kt:203:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerSignOutTest.kt:234:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerTest.kt:58:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerTest.kt:69:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerTest.kt:77:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerTest.kt:147:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerTest.kt:163:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerTest.kt:193:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\booking\SlotAvailabilityRepositoryImplTest.kt:21:      
  runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\booking\SlotAvailabilityRepositoryImplTest.kt:44:      
  runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\catalogue\CatalogueRepositoryImplTest.kt:23:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\catalogue\CatalogueRepositoryImplTest.kt:56:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\catalogue\CatalogueRepositoryImplTest.kt:64:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\catalogue\CatalogueRepositoryImplTest.kt:100:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\catalogue\CatalogueRepositoryImplTest.kt:133:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:32:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:52:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:71:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:81:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:102:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:112:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:124:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:134:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:146:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImplTest.kt:47:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImplTest.kt:56:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImplTest.kt:75:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImplTest.kt:92:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImplTest.kt:101:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImplTest.kt:114:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImplTest.kt:143:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImplTest.kt:161:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImplTest.kt:175:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\consent\ConsentRepositoryImplTest.kt:194:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\dataexport\DataExportRepositoryTest.kt:21:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\dataexport\DataExportRepositoryTest.kt:36:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\dataexport\DataExportRepositoryTest.kt:47:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\deleteaccount\DeleteAccountRepositoryImplTest.kt:34:   
     runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\deleteaccount\DeleteAccountRepositoryImplTest.kt:52:   
     runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\deleteaccount\DeleteAccountRepositoryImplTest.kt:67:   
     runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\deleteaccount\DeleteAccountRepositoryImplTest.kt:81:   
     runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\deleteaccount\DeleteAccountRepositoryImplTest.kt:91:   
     runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\deleteaccount\DeleteAccountRepositoryImplTest.kt:103:  
      runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\deleteaccount\DeleteAccountRepositoryImplTest.kt:112:  
      runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\deleteaccount\DeleteAccountRepositoryImplTest.kt:123:  
      runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\deleteaccount\DeleteAccountRepositoryImplTest.kt:135:  
      runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\device\DeviceApiWireTest.kt:50:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\device\DeviceApiWireTest.kt:59:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\device\DeviceApiWireTest.kt:68:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrarTest.kt:42:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrarTest.kt:58:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrarTest.kt:76:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrarTest.kt:85:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrarTest.kt:96:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrarTest.kt:106:        runTest 
{
customer-app\app\src\test\kotlin\com\homeservices\customer\data\device\DeviceTokenRegistrarTest.kt:115:        runTest 
{
customer-app\app\src\test\kotlin\com\homeservices\customer\data\locale\LocaleRepositoryImplTest.kt:32:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\locale\LocaleRepositoryImplTest.kt:41:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\locale\LocaleRepositoryImplTest.kt:47:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\locale\LocaleRepositoryImplTest.kt:54:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\locale\LocaleRepositoryImplTest.kt:61:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\network\auth\IdTokenCacheTest.kt:68:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\network\auth\IdTokenCacheTest.kt:77:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\network\auth\IdTokenCacheTest.kt:86:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\network\auth\IdTokenCacheTest.kt:104:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\network\auth\IdTokenCacheTest.kt:117:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\network\auth\IdTokenCacheTest.kt:135:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\network\auth\IdTokenCacheTest.kt:174:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\network\auth\IdTokenCacheTest.kt:198:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\network\auth\IdTokenCacheTest.kt:223:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:91:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:99:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:112:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:127:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:141:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:164:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:191:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:208:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:217:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:226:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:239:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:255:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:271:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:303:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:318:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\rating\RatingRepositoryImplTest.kt:23:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\rating\RatingRepositoryImplTest.kt:40:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\rating\RatingRepositoryImplTest.kt:50:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\rating\RatingRepositoryImplTest.kt:70:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\technician\TechnicianProfileRepositoryImplTest.kt:19:  
      runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\technician\TechnicianProfileRepositoryImplTest.kt:32:  
      runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\tracking\LocationUpdateEventBusTest.kt:13:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\tracking\LocationUpdateEventBusTest.kt:24:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\tracking\LocationUpdateEventBusTest.kt:38:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImplTest.kt:106:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImplTest.kt:134:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImplTest.kt:152:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImplTest.kt:169:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImplTest.kt:191:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\wallet\NoShowCreditEventBusTest.kt:13:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\wallet\NoShowCreditEventBusTest.kt:24:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\wallet\NoShowCreditEventBusTest.kt:38:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\data\wallet\NoShowCreditEventBusTest.kt:51:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\domain\auth\AuthOrchestratorFlagOnTest.kt:73:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\domain\auth\AuthOrchestratorFlagOnTest.kt:110:        
runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\domain\auth\AuthOrchestratorTest.kt:132:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\domain\auth\AuthOrchestratorTest.kt:152:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\domain\auth\AuthOrchestratorTest.kt:176:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\domain\auth\AuthOrchestratorTest.kt:196:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\domain\auth\AuthOrchestratorTest.kt:207:        runTest {
customer-app\app\src\test\kotlin\com\homeservices\customer\domain\auth\AuthOrchestratorTest.kt:226:        runTest {



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'tools' -File | Select-String -Pattern 'codex|review|passed|commit' -CaseSensitive:"'$false -Context 1,3' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 541ms:

  tools\build-play-bundles.ps1:70:    if (-not (Test-Path -LiteralPath $gsFile -PathType Leaf)) {
> tools\build-play-bundles.ps1:71:        throw "google-services.json not found for $($app.Name)-app at $gsFile. The 
committed file is a stub; the real one is materialised by CI from the GOOGLE_SERVICES_JSON secret. For local Play AAB 
builds, drop the real file at this path before re-running."
  tools\build-play-bundles.ps1:72:    }
  tools\build-play-bundles.ps1:73:
  tools\build-play-bundles.ps1:74:    $content = Get-Content -LiteralPath $gsFile -Raw
  tools\check-runbook-conflicts.sh:2:# Pre-push lint: fails if docs/runbook.md (or any file under docs/) contains git 
merge-conflict markers.
> tools\check-runbook-conflicts.sh:3:# Per project CLAUDE.md (lean review stack), this is enforced LOCALLY pre-push, 
not in CI.
  tools\check-runbook-conflicts.sh:4:set -euo pipefail
  tools\check-runbook-conflicts.sh:5:
  tools\check-runbook-conflicts.sh:6:ROOT="$(cd "$(dirname "$0")/.." && pwd)"
  tools\check-token-drift.py:170:    """
> tools\check-token-drift.py:171:    Return a list of error strings. Empty list means all checks passed.
  tools\check-token-drift.py:172:    """
  tools\check-token-drift.py:173:    with open(variables_json, encoding="utf-8") as fh:
  tools\check-token-drift.py:174:        json_data = json.load(fh)
  tools\check-token-drift.py:281:    print(
> tools\check-token-drift.py:282:        f"OK: {len(CHECKS)} token checks passed — "
  tools\check-token-drift.py:283:        f"figma/variables.json is consistent with Kotlin design-system."
  tools\check-token-drift.py:284:    )
  tools\check-token-drift.py:285:    return 0
  tools\generate_hindi_functional_doc.py:178:    h2("2.7  सातवां कदम — काम पूरा होने के बाद")
> tools\generate_hindi_functional_doc.py:179:    b("ग्राहक ऐप पर rating और लिखित review दे सकता है")
  tools\generate_hindi_functional_doc.py:180:    b("Email पर एक सुंदर PDF रिपोर्ट आती है — क्या काम हुआ, "
  tools\generate_hindi_functional_doc.py:181:      "कौन से parts लगे, अगली service कब होनी चाहिए")
  tools\generate_hindi_functional_doc.py:182:    b("7-दिन की warranty तुरंत active हो जाती है")
  tools\generate_hindi_functional_doc.py:361:        ("कदम 3:",  "System nearest tech को find करता है  →  Tech के फ़ोन 
पर Job Offer Card "
> tools\generate_hindi_functional_doc.py:362:                    "(earnings preview + reason सहित)"),
  tools\generate_hindi_functional_doc.py:363:        ("कदम 4:",  "Tech job accept करता है  →  Google Maps navigation 
शुरू  →  ग्राहक को notification"),
  tools\generate_hindi_functional_doc.py:364:        ("कदम 5:",  "ग्राहक को live location updates मिलती हैं  →  'Tech 
पहुंच गए'"),
  tools\generate_hindi_functional_doc.py:365:        ("कदम 6:",  "Tech काम शुरू करता है  →  guided photos लेता है  →  
ग्राहक को real-time updates"),
  tools\install-hooks.sh:1:#!/usr/bin/env bash
> tools\install-hooks.sh:2:# One-time setup: point git at the committed hooks directory.
  tools\install-hooks.sh:3:# Run once after cloning: bash tools/install-hooks.sh
  tools\install-hooks.sh:4:set -euo pipefail
  tools\install-hooks.sh:5:git config core.hooksPath .githooks
  tools\pre-codex-smoke-api.sh:1:#!/usr/bin/env bash
> tools\pre-codex-smoke-api.sh:2:# Pre-Codex smoke gate for the Node/TypeScript API sub-project.
> tools\pre-codex-smoke-api.sh:3:# Run BEFORE /codex-review-gate. Non-zero exit = fix before Codex.
> tools\pre-codex-smoke-api.sh:4:# Usage: bash tools/pre-codex-smoke-api.sh
  tools\pre-codex-smoke-api.sh:5:set -euo pipefail
  tools\pre-codex-smoke-api.sh:6:
  tools\pre-codex-smoke-api.sh:7:REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
  tools\pre-codex-smoke-api.sh:13:
> tools\pre-codex-smoke-api.sh:14:echo "=== Pre-Codex Smoke Gate: api ==="
  tools\pre-codex-smoke-api.sh:15:
  tools\pre-codex-smoke-api.sh:16:echo "[1/3] typecheck — catches missing types, broken imports, type errors..."
  tools\pre-codex-smoke-api.sh:17:"$BIN/tsc" --noEmit -p tsconfig.tests.json 2>&1 | tail -20
  tools\pre-codex-smoke-api.sh:25:echo ""
> tools\pre-codex-smoke-api.sh:26:echo "=== API smoke gate PASSED — safe to invoke /codex-review-gate ==="
  tools\pre-codex-smoke-web.sh:1:#!/usr/bin/env bash
> tools\pre-codex-smoke-web.sh:2:# Pre-Codex smoke gate for the Next.js admin-web sub-project.
> tools\pre-codex-smoke-web.sh:3:# Run BEFORE /codex-review-gate. Non-zero exit = fix before Codex.
> tools\pre-codex-smoke-web.sh:4:# Usage: bash tools/pre-codex-smoke-web.sh
  tools\pre-codex-smoke-web.sh:5:set -euo pipefail
  tools\pre-codex-smoke-web.sh:6:
  tools\pre-codex-smoke-web.sh:7:REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
  tools\pre-codex-smoke-web.sh:9:
> tools\pre-codex-smoke-web.sh:10:# Call binaries directly — same Windows/pnpm PATH fix as pre-codex-smoke-api.sh
  tools\pre-codex-smoke-web.sh:11:BIN="$PWD/node_modules/.bin"
  tools\pre-codex-smoke-web.sh:12:
> tools\pre-codex-smoke-web.sh:13:echo "=== Pre-Codex Smoke Gate: admin-web ==="
  tools\pre-codex-smoke-web.sh:14:
  tools\pre-codex-smoke-web.sh:15:echo "[1/3] typecheck — catches broken imports, type errors..."
  tools\pre-codex-smoke-web.sh:16:"$BIN/tsc" --noEmit 2>&1 | tail -20
  tools\pre-codex-smoke-web.sh:24:echo ""
> tools\pre-codex-smoke-web.sh:25:echo "=== Web smoke gate PASSED — safe to invoke /codex-review-gate ==="
  tools\pre-codex-smoke.sh:1:#!/usr/bin/env bash
> tools\pre-codex-smoke.sh:2:# Pre-Codex smoke gate for Android sub-projects (customer-app / technician-app).
> tools\pre-codex-smoke.sh:3:# Run this BEFORE /codex-review-gate. A non-zero exit means do NOT invoke Codex — fix the 
issue first.
> tools\pre-codex-smoke.sh:4:# Usage: bash tools/pre-codex-smoke.sh <customer-app|technician-app>
  tools\pre-codex-smoke.sh:5:#
  tools\pre-codex-smoke.sh:6:# Steps 3+4 (detekt + lintDebug) were added in the Week 2 (2026-05-13) retrospective.
  tools\pre-codex-smoke.sh:7:# Both were missing from the original gate and caused 6+ CI fix-rounds per PR.
  tools\pre-codex-smoke.sh:9:
> tools\pre-codex-smoke.sh:10:APP_DIR="${1:?Usage: pre-codex-smoke.sh <customer-app|technician-app>}"
  tools\pre-codex-smoke.sh:11:REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
  tools\pre-codex-smoke.sh:12:
  tools\pre-codex-smoke.sh:13:cd "$REPO_ROOT/$APP_DIR"
  tools\pre-codex-smoke.sh:14:
> tools\pre-codex-smoke.sh:15:echo "=== Pre-Codex Smoke Gate: $APP_DIR ==="
  tools\pre-codex-smoke.sh:16:
  tools\pre-codex-smoke.sh:17:echo "[1/6] assembleDebug — catches missing deps, broken imports, unresolved 
references..."
  tools\pre-codex-smoke.sh:18:./gradlew assembleDebug --quiet 2>&1 | tail -30
  tools\pre-codex-smoke.sh:19:
> tools\pre-codex-smoke.sh:20:echo "[2/6] ktlintCheck — formatting must be clean before Codex sees it..."
  tools\pre-codex-smoke.sh:21:./gradlew ktlintCheck --quiet 2>&1 | tail -20
  tools\pre-codex-smoke.sh:22:
  tools\pre-codex-smoke.sh:23:echo "[3/6] detekt — static analysis (LongMethod, MagicNumber, ReturnCount, 
NestedBlockDepth)..."
  tools\pre-codex-smoke.sh:35:echo ""
> tools\pre-codex-smoke.sh:36:echo "=== Smoke gate PASSED — safe to invoke /codex-review-gate ==="
  tools\sync-service-area-geojson.sh:3:# to customer-app/assets/ so the two files never drift.
> tools\sync-service-area-geojson.sh:4:# Called from pre-codex-smoke.sh — failure blocks Codex review.
  tools\sync-service-area-geojson.sh:5:set -euo pipefail
  tools\sync-service-area-geojson.sh:6:
  tools\sync-service-area-geojson.sh:7:REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  tools\tests\test_check_token_drift.py:8:4. Token present in Kotlin but absent from JSON → exit non-zero
> tools\tests\test_check_token_drift.py:9:5. The actual project figma/variables.json is consistent with the committed 
Kotlin files
  tools\tests\test_check_token_drift.py:10:
  tools\tests\test_check_token_drift.py:11:Run:  python -m pytest tools/tests/test_check_token_drift.py -v
  tools\tests\test_check_token_drift.py:12:"""
  tools\tests\test_check_token_drift.py:176:    """
> tools\tests\test_check_token_drift.py:177:    Run the drift checker against the actual committed files.
  tools\tests\test_check_token_drift.py:178:    Fails if someone edits a Kotlin constant without updating 
variables.json,
  tools\tests\test_check_token_drift.py:179:    or vice-versa.
  tools\tests\test_check_token_drift.py:180:    """



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'customer-app/app/src/main/res/xml' | Select-Object Name,FullName; Get-ChildItem -Recurse -Path 'customer-app/app/src/main/res/xml' | ForEach-Object { '--- '+"'$_.Name; Get-Content -LiteralPath $_.FullName }' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 924ms:

Name                      FullName                                                                                     
----                      --------                                                                                     
data_extraction_rules.xml C:\Alok\Business Projects\Urbanclap-sprint4\customer-app\app\src\main\res\xml\data_extract...
--- data_extraction_rules.xml
<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="root" />
        <exclude domain="sharedpref" />
        <exclude domain="database" />
        <exclude domain="file" />
    </cloud-backup>
    <device-transfer>
        <exclude domain="root" />
        <exclude domain="sharedpref" />
        <exclude domain="database" />
        <exclude domain="file" />
    </device-transfer>
</data-extraction-rules>



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'api/src' -Include '*.ts' | Select-String -Pattern \"EARNINGS_UPDATE|earningsId|KYC_RESUME|sourceId\" -Context 2,5 | Select-Object -First 300" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1192ms:

  api\src\cosmos\audit-log-repository.ts:30:    parameters.push({ name: '@resourceType', value: params.resourceType });
  api\src\cosmos\audit-log-repository.ts:31:  }
> api\src\cosmos\audit-log-repository.ts:32:  if (params.resourceId !== undefined) {
> api\src\cosmos\audit-log-repository.ts:33:    conditions.push('c.resourceId = @resourceId');
> api\src\cosmos\audit-log-repository.ts:34:    parameters.push({ name: '@resourceId', value: params.resourceId });
  api\src\cosmos\audit-log-repository.ts:35:  }
  api\src\cosmos\audit-log-repository.ts:36:  if (params.dateFrom !== undefined) {
  api\src\cosmos\audit-log-repository.ts:37:    conditions.push('c.timestamp >= @dateFrom');
  api\src\cosmos\audit-log-repository.ts:38:    parameters.push({ name: '@dateFrom', value: params.dateFrom });
  api\src\cosmos\audit-log-repository.ts:39:  }
  api\src\cosmos\audit-log-repository.ts:44:
  api\src\cosmos\audit-log-repository.ts:45:  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND 
')}` : '';
> api\src\cosmos\audit-log-repository.ts:46:  const query = `SELECT c.id, c.adminId, c.role, c.action, c.resourceType, 
c.resourceId, c.payload, c.ip, c.userAgent, c.timestamp FROM c ${where} ORDER BY c.timestamp DESC`;
  api\src\cosmos\audit-log-repository.ts:47:
  api\src\cosmos\audit-log-repository.ts:48:  const iterator = getCosmosClient()
  api\src\cosmos\audit-log-repository.ts:49:    .database(DB_NAME)
  api\src\cosmos\audit-log-repository.ts:50:    .container(CONTAINER)
  api\src\cosmos\audit-log-repository.ts:51:    .items.query<Record<string, unknown>>(
  api\src\cosmos\user-data-cascade-writes.ts:209:  /**
  api\src\cosmos\user-data-cascade-writes.ts:210:   * Audit log immutability invariant: NEVER delete audit entries.
> api\src\cosmos\user-data-cascade-writes.ts:211:   * Only the resourceId field is anonymized so the entries remain 
queryable
  api\src\cosmos\user-data-cascade-writes.ts:212:   * by the operator while no longer linking back to the 
natural-person uid.
  api\src\cosmos\user-data-cascade-writes.ts:213:   */
> api\src\cosmos\user-data-cascade-writes.ts:214:  async anonymizeAuditLogResourceId(uid: string, anonymizedHash: 
string): Promise<number> {
  api\src\cosmos\user-data-cascade-writes.ts:215:    const container = 
getCosmosClient().database(DB_NAME).container(AUDIT_LOG_CONTAINER);
  api\src\cosmos\user-data-cascade-writes.ts:216:    const { resources } = await container
  api\src\cosmos\user-data-cascade-writes.ts:217:      .items.query<Record<string, unknown>>({
> api\src\cosmos\user-data-cascade-writes.ts:218:        query: 'SELECT * FROM c WHERE c.resourceId = @uid',
  api\src\cosmos\user-data-cascade-writes.ts:219:        parameters: [{ name: '@uid', value: uid }],
  api\src\cosmos\user-data-cascade-writes.ts:220:      })
  api\src\cosmos\user-data-cascade-writes.ts:221:      .fetchAll();
  api\src\cosmos\user-data-cascade-writes.ts:222:    let n = 0;
  api\src\cosmos\user-data-cascade-writes.ts:223:    const anonId = `deleted-${anonymizedHash.slice(0, 16)}`;
  api\src\cosmos\user-data-cascade-writes.ts:224:    for (const r of resources) {
> api\src\cosmos\user-data-cascade-writes.ts:225:      const updated: Record<string, unknown> = { ...r, resourceId: 
anonId };
  api\src\cosmos\user-data-cascade-writes.ts:226:      const id = r['id'] as string;
  api\src\cosmos\user-data-cascade-writes.ts:227:      const pk = (r['partitionKey'] as string) ?? '';
  api\src\cosmos\user-data-cascade-writes.ts:228:      await container.item(id, pk).replace(updated);
  api\src\cosmos\user-data-cascade-writes.ts:229:      n += 1;
  api\src\cosmos\user-data-cascade-writes.ts:230:    }
  api\src\cosmos\user-data-export-reads.ts:149:      .items.query<Record<string, unknown>>({
  api\src\cosmos\user-data-export-reads.ts:150:        query:
> api\src\cosmos\user-data-export-reads.ts:151:          'SELECT * FROM c WHERE c.resourceId = @uid AND c.timestamp >= 
@since ORDER BY c.timestamp DESC',
  api\src\cosmos\user-data-export-reads.ts:152:        parameters: [
  api\src\cosmos\user-data-export-reads.ts:153:          { name: '@uid', value: uid },
  api\src\cosmos\user-data-export-reads.ts:154:          { name: '@since', value: sinceIso },
  api\src\cosmos\user-data-export-reads.ts:155:        ],
  api\src\cosmos\user-data-export-reads.ts:156:      })
  api\src\functions\admin\auth\login.ts:47:  if (!verifyToken(totpCode, secret)) {
  api\src\functions\admin\auth\login.ts:48:    const _ts = new Date().toISOString();
> api\src\functions\admin\auth\login.ts:49:    void appendAuditEntry({ id: randomUUID(), adminId: adminUser.adminId, 
role, action: 'ADMIN_LOGIN_FAILED', resourceType: 'admin_session', resourceId: adminUser.adminId, payload: { reason: 
'TOTP_INVALID' }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
  api\src\functions\admin\auth\login.ts:50:    return { status: 422, jsonBody: { code: 'TOTP_INVALID' } };
  api\src\functions\admin\auth\login.ts:51:  }
  api\src\functions\admin\auth\login.ts:52:
  api\src\functions\admin\auth\login.ts:53:  const session = await createAdminSession({ adminId: adminUser.adminId, 
role });
  api\src\functions\admin\auth\login.ts:54:  const accessToken = await signAccessToken({
  api\src\functions\admin\complaints\create.ts:61:    action: 'COMPLAINT_CREATED',
  api\src\functions\admin\complaints\create.ts:62:    resourceType: 'complaint',
> api\src\functions\admin\complaints\create.ts:63:    resourceId: doc.id,
  api\src\functions\admin\complaints\create.ts:64:    payload: { orderId: doc.orderId, customerId: doc.customerId },
  api\src\functions\admin\complaints\create.ts:65:    ip: req.headers.get('x-forwarded-for') ?? '',
  api\src\functions\admin\complaints\create.ts:66:    userAgent: '',
  api\src\functions\admin\complaints\create.ts:67:    timestamp: now.toISOString(),
  api\src\functions\admin\complaints\create.ts:68:    partitionKey: now.toISOString().slice(0, 7),
  api\src\functions\admin\complaints\patch.ts:140:      action: 'APPEAL_DECIDED',
  api\src\functions\admin\complaints\patch.ts:141:      resourceType: 'complaint',
> api\src\functions\admin\complaints\patch.ts:142:      resourceId: existing.id,
  api\src\functions\admin\complaints\patch.ts:143:      payload: { decision, technicianId: existing.technicianId, 
bookingId: existing.orderId },
  api\src\functions\admin\complaints\patch.ts:144:      timestamp: now,
  api\src\functions\admin\complaints\patch.ts:145:      partitionKey: now.slice(0, 7),
  api\src\functions\admin\complaints\patch.ts:146:    }).catch((err: unknown) => ctx.error('audit APPEAL_DECIDED 
failed', err));
  api\src\functions\admin\complaints\patch.ts:147:  }
  api\src\functions\admin\complaints\patch.ts:155:      action: 'COMPLAINT_STATUS_CHANGED',
  api\src\functions\admin\complaints\patch.ts:156:      resourceType: 'complaint',
> api\src\functions\admin\complaints\patch.ts:157:      resourceId: id,
  api\src\functions\admin\complaints\patch.ts:158:      payload: { from: oldStatus, to: parsed.data.status },
  api\src\functions\admin\complaints\patch.ts:159:      ip: req.headers.get('x-forwarded-for') ?? '',
  api\src\functions\admin\complaints\patch.ts:160:      userAgent: '',
  api\src\functions\admin\complaints\patch.ts:161:      timestamp: now,
  api\src\functions\admin\complaints\patch.ts:162:      partitionKey: now.slice(0, 7),
  api\src\functions\admin\complaints\patch.ts:171:      action: 'COMPLAINT_ASSIGNED',
  api\src\functions\admin\complaints\patch.ts:172:      resourceType: 'complaint',
> api\src\functions\admin\complaints\patch.ts:173:      resourceId: updated.id,
  api\src\functions\admin\complaints\patch.ts:174:      payload: { from: existing.assigneeAdminId ?? null, to: 
parsed.data.assigneeAdminId },
  api\src\functions\admin\complaints\patch.ts:175:      ip: req.headers.get('x-forwarded-for') ?? '',
  api\src\functions\admin\complaints\patch.ts:176:      userAgent: '',
  api\src\functions\admin\complaints\patch.ts:177:      timestamp: now,
  api\src\functions\admin\complaints\patch.ts:178:      partitionKey: now.slice(0, 7),
  api\src\functions\admin\complaints\sla-timer.ts:50:        action: auditAction,
  api\src\functions\admin\complaints\sla-timer.ts:51:        resourceType: 'complaint',
> api\src\functions\admin\complaints\sla-timer.ts:52:        resourceId: complaint.id,
  api\src\functions\admin\complaints\sla-timer.ts:53:        payload: { technicianId: complaint.technicianId, orderId: 
complaint.orderId },
  api\src\functions\admin\complaints\sla-timer.ts:54:        ip: '',
  api\src\functions\admin\complaints\sla-timer.ts:55:        userAgent: '',
  api\src\functions\admin\complaints\sla-timer.ts:56:        timestamp: now,
  api\src\functions\admin\complaints\sla-timer.ts:57:        partitionKey: now.slice(0, 7),
  api\src\functions\admin\orders\overrides.ts:49:    action: 'REASSIGN',
  api\src\functions\admin\orders\overrides.ts:50:    resourceType: 'booking',
> api\src\functions\admin\orders\overrides.ts:51:    resourceId: id,
  api\src\functions\admin\orders\overrides.ts:52:    payload: { technicianId: parsed.data.technicianId, reason: 
parsed.data.reason },
  api\src\functions\admin\orders\overrides.ts:53:    timestamp: new Date().toISOString(),
  api\src\functions\admin\orders\overrides.ts:54:    partitionKey: new Date().toISOString().slice(0, 7),
  api\src\functions\admin\orders\overrides.ts:55:  });
  api\src\functions\admin\orders\overrides.ts:56:
  api\src\functions\admin\orders\overrides.ts:93:    action: 'COMPLETE',
  api\src\functions\admin\orders\overrides.ts:94:    resourceType: 'booking',
> api\src\functions\admin\orders\overrides.ts:95:    resourceId: id,
  api\src\functions\admin\orders\overrides.ts:96:    payload: { reason: parsed.data.reason },
  api\src\functions\admin\orders\overrides.ts:97:    timestamp: new Date().toISOString(),
  api\src\functions\admin\orders\overrides.ts:98:    partitionKey: new Date().toISOString().slice(0, 7),
  api\src\functions\admin\orders\overrides.ts:99:  });
  api\src\functions\admin\orders\overrides.ts:100:
  api\src\functions\admin\orders\overrides.ts:138:    action: 'REFUND',
  api\src\functions\admin\orders\overrides.ts:139:    resourceType: 'booking',
> api\src\functions\admin\orders\overrides.ts:140:    resourceId: id,
  api\src\functions\admin\orders\overrides.ts:141:    payload: { reason: parsed.data.reason, amountPaise: 
parsed.data.amountPaise },
  api\src\functions\admin\orders\overrides.ts:142:    timestamp: new Date().toISOString(),
  api\src\functions\admin\orders\overrides.ts:143:    partitionKey: new Date().toISOString().slice(0, 7),
  api\src\functions\admin\orders\overrides.ts:144:  });
  api\src\functions\admin\orders\overrides.ts:145:
  api\src\functions\admin\orders\overrides.ts:182:    action: 'WAIVE_FEE',
  api\src\functions\admin\orders\overrides.ts:183:    resourceType: 'booking',
> api\src\functions\admin\orders\overrides.ts:184:    resourceId: id,
  api\src\functions\admin\orders\overrides.ts:185:    payload: { reason: parsed.data.reason },
  api\src\functions\admin\orders\overrides.ts:186:    timestamp: new Date().toISOString(),
  api\src\functions\admin\orders\overrides.ts:187:    partitionKey: new Date().toISOString().slice(0, 7),
  api\src\functions\admin\orders\overrides.ts:188:  });
  api\src\functions\admin\orders\overrides.ts:189:
  api\src\functions\admin\orders\overrides.ts:226:    action: 'ESCALATE',
  api\src\functions\admin\orders\overrides.ts:227:    resourceType: 'booking',
> api\src\functions\admin\orders\overrides.ts:228:    resourceId: id,
  api\src\functions\admin\orders\overrides.ts:229:    payload: { reason: parsed.data.reason, priority: 
parsed.data.priority },
  api\src\functions\admin\orders\overrides.ts:230:    timestamp: new Date().toISOString(),
  api\src\functions\admin\orders\overrides.ts:231:    partitionKey: new Date().toISOString().slice(0, 7),
  api\src\functions\admin\orders\overrides.ts:232:  });
  api\src\functions\admin\orders\overrides.ts:233:
  api\src\functions\admin\orders\overrides.ts:273:    action: 'ADD_NOTE',
  api\src\functions\admin\orders\overrides.ts:274:    resourceType: 'booking',
> api\src\functions\admin\orders\overrides.ts:275:    resourceId: id,
  api\src\functions\admin\orders\overrides.ts:276:    payload: { note: parsed.data.note },
  api\src\functions\admin\orders\overrides.ts:277:    timestamp: new Date().toISOString(),
  api\src\functions\admin\orders\overrides.ts:278:    partitionKey: new Date().toISOString().slice(0, 7),
  api\src\functions\admin\orders\overrides.ts:279:  });
  api\src\functions\admin\orders\overrides.ts:280:
  api\src\functions\admin\sos\playback-token.ts:53:    action: 'SOS_PLAYBACK_TOKEN_ISSUED',
  api\src\functions\admin\sos\playback-token.ts:54:    resourceType: 'booking',
> api\src\functions\admin\sos\playback-token.ts:55:    resourceId: incidentId,
  api\src\functions\admin\sos\playback-token.ts:56:    payload: { adminId: admin.adminId, incidentId },
  api\src\functions\admin\sos\playback-token.ts:57:    timestamp: now,
  api\src\functions\admin\sos\playback-token.ts:58:    partitionKey: now.slice(0, 7),
  api\src\functions\admin\sos\playback-token.ts:59:  };
  api\src\functions\admin\sos\playback-token.ts:60:  appendAuditEntry(auditEntry).catch((err: unknown) => 
ctx.error('Audit SOS_PLAYBACK_TOKEN_ISSUED failed', err));
  api\src\functions\bookings.ts:634:  if (confirmed.status === 'SEARCHING') {
  api\src\functions\bookings.ts:635:    const _ts = new Date().toISOString();
> api\src\functions\bookings.ts:636:    void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', 
action: 'CUSTOMER_CONFIRMED_PAYMENT', resourceType: 'booking', resourceId: confirmed.id, payload: { bookingId: 
confirmed.id, paymentId: parsed.data.razorpayPaymentId }, timestamp: _ts, partitionKey: _ts.slice(0, 7) 
}).catch(Sentry.captureException);
  api\src\functions\bookings.ts:637:  }
  api\src\functions\bookings.ts:638:
  api\src\functions\bookings.ts:639:  return { status: 200, jsonBody: { bookingId: confirmed.id, status: 
confirmed.status } };
  api\src\functions\bookings.ts:640:};
  api\src\functions\bookings.ts:641:
  api\src\functions\rating-escalate.ts:98:
  api\src\functions\rating-escalate.ts:99:  const _ts = new Date().toISOString();
> api\src\functions\rating-escalate.ts:100:  void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 
'system', action: 'RATING_SHIELD_ESCALATED', resourceType: 'booking', resourceId: bookingId, payload: { bookingId, 
complaintId: doc.id, draftOverall: parsed.data.draftOverall }, timestamp: _ts, partitionKey: _ts.slice(0, 7) 
}).catch(Sentry.captureException);
  api\src\functions\rating-escalate.ts:101:
  api\src\functions\rating-escalate.ts:102:  sendOwnerRatingShieldAlert({
  api\src\functions\rating-escalate.ts:103:    bookingId,
  api\src\functions\rating-escalate.ts:104:    technicianId: booking.technicianId ?? '',
  api\src\functions\rating-escalate.ts:105:    draftOverall: parsed.data.draftOverall,
  api\src\functions\sos-key.ts:63:    action: 'SOS_KEY_UPLOADED',
  api\src\functions\sos-key.ts:64:    resourceType: 'booking',
> api\src\functions\sos-key.ts:65:    resourceId: incidentId,
  api\src\functions\sos-key.ts:66:    payload: { incidentId, storagePath },
  api\src\functions\sos-key.ts:67:    timestamp: now,
  api\src\functions\sos-key.ts:68:    partitionKey: now.slice(0, 7),
  api\src\functions\sos-key.ts:69:  };
  api\src\functions\sos-key.ts:70:  appendAuditEntry(auditEntry).catch((err: unknown) => ctx.error('Audit 
SOS_KEY_UPLOADED failed', err));
  api\src\functions\sos.ts:45:    action: 'SOS_TRIGGERED',
  api\src\functions\sos.ts:46:    resourceType: 'booking',
> api\src\functions\sos.ts:47:    resourceId: bookingId,
  api\src\functions\sos.ts:48:    payload: { technicianId: booking.technicianId ?? '', slotAddress: 
booking.addressText },
  api\src\functions\sos.ts:49:    timestamp: now,
  api\src\functions\sos.ts:50:    partitionKey: now.slice(0, 7),
  api\src\functions\sos.ts:51:  };
  api\src\functions\sos.ts:52:
  api\src\functions\trigger-booking-completed.ts:14:const DB_NAME = process.env['COSMOS_DATABASE'] ?? 'homeservices';
  api\src\functions\trigger-booking-completed.ts:15:
> api\src\functions\trigger-booking-completed.ts:16:function systemAuditEntry(action: string, resourceId: string, 
payload: Record<string, unknown>) {
  api\src\functions\trigger-booking-completed.ts:17:  const timestamp = new Date().toISOString();
  api\src\functions\trigger-booking-completed.ts:18:  return appendAuditEntry({
  api\src\functions\trigger-booking-completed.ts:19:    id: randomUUID(),
  api\src\functions\trigger-booking-completed.ts:20:    adminId: 'system',
  api\src\functions\trigger-booking-completed.ts:21:    role: 'system',
  api\src\functions\trigger-booking-completed.ts:22:    action,
  api\src\functions\trigger-booking-completed.ts:23:    resourceType: 'booking',
> api\src\functions\trigger-booking-completed.ts:24:    resourceId,
  api\src\functions\trigger-booking-completed.ts:25:    payload,
  api\src\functions\trigger-booking-completed.ts:26:    timestamp,
  api\src\functions\trigger-booking-completed.ts:27:    partitionKey: timestamp.slice(0, 7),
  api\src\functions\trigger-booking-completed.ts:28:  });
  api\src\functions\trigger-booking-completed.ts:29:}
  api\src\functions\trigger-next-day-payout.ts:73:        action: 'ROUTE_TRANSFER_NEXT_DAY',
  api\src\functions\trigger-next-day-payout.ts:74:        resourceType: 'booking',
> api\src\functions\trigger-next-day-payout.ts:75:        resourceId: bookingId,
  api\src\functions\trigger-next-day-payout.ts:76:        payload: { transferId, techAmount, technicianId },
  api\src\functions\trigger-next-day-payout.ts:77:        timestamp,
  api\src\functions\trigger-next-day-payout.ts:78:        partitionKey: timestamp.slice(0, 7),
  api\src\functions\trigger-next-day-payout.ts:79:      });
  api\src\functions\trigger-next-day-payout.ts:80:    } catch (auditErr: unknown) {
  api\src\functions\trigger-no-show-detector.ts:88:      ctx.log(`detectNoShows: processing no-show 
bookingId=${booking.id}`);
  api\src\functions\trigger-no-show-detector.ts:89:      const _ts = new Date().toISOString();
> api\src\functions\trigger-no-show-detector.ts:90:      void appendAuditEntry({ id: randomUUID(), adminId: 'system', 
role: 'system', action: 'NO_SHOW_CREDIT_ISSUED', resourceType: 'booking', resourceId: booking.id, payload: { 
bookingId: booking.id, creditAmount: NO_SHOW_CREDIT_PAISE }, timestamp: _ts, partitionKey: _ts.slice(0, 7) 
}).catch(Sentry.captureException);
  api\src\functions\trigger-no-show-detector.ts:91:    } else {
  api\src\functions\trigger-no-show-detector.ts:92:      ctx.log(`detectNoShows: credit already exists for 
${booking.id} — retrying remaining steps`);
  api\src\functions\trigger-no-show-detector.ts:93:    }
  api\src\functions\trigger-no-show-detector.ts:94:
  api\src\functions\trigger-no-show-detector.ts:95:    // ── Recovery skip check 
───────────────────────────────────────────────────────
  api\src\functions\trigger-no-show-detector.ts:175:        // Emit the audit that the prior run never wrote before 
crashing.
  api\src\functions\trigger-no-show-detector.ts:176:        const _rts = new Date().toISOString();
> api\src\functions\trigger-no-show-detector.ts:177:        void appendAuditEntry({ id: randomUUID(), adminId: 
'system', role: 'system', action: 'NO_SHOW_REDISPATCH_INITIATED', resourceType: 'booking', resourceId: booking.id, 
payload: { bookingId: booking.id }, timestamp: _rts, partitionKey: _rts.slice(0, 7) }).catch(Sentry.captureException);
  api\src\functions\trigger-no-show-detector.ts:178:        ctx.log(`detectNoShows: recovery — booking ${booking.id} 
already SEARCHING, completing noShowRedispatchAt write`);
  api\src\functions\trigger-no-show-detector.ts:179:      } else {
  api\src\functions\trigger-no-show-detector.ts:180:        try {
  api\src\functions\trigger-no-show-detector.ts:181:          redispatchOk = await 
dispatcherService.redispatch(booking.id, NO_SHOW_REDISPATCH_RADIUS_KM, noShowTechId);
  api\src\functions\trigger-no-show-detector.ts:182:          if (redispatchOk) {
  api\src\functions\trigger-no-show-detector.ts:183:            await updateBookingFields(booking.id, { 
noShowRedispatchAt: new Date().toISOString() });
  api\src\functions\trigger-no-show-detector.ts:184:            const _ts = new Date().toISOString();
> api\src\functions\trigger-no-show-detector.ts:185:            void appendAuditEntry({ id: randomUUID(), adminId: 
'system', role: 'system', action: 'NO_SHOW_REDISPATCH_INITIATED', resourceType: 'booking', resourceId: booking.id, 
payload: { bookingId: booking.id }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
  api\src\functions\trigger-no-show-detector.ts:186:          } else {
  api\src\functions\trigger-no-show-detector.ts:187:            ctx.log(`detectNoShows: no techs found for 
${booking.id} — booking marked UNFULFILLED`);
  api\src\functions\trigger-no-show-detector.ts:188:            // Guard: dispatcher.redispatch() returns false both 
when no candidates exist AND when a
  api\src\functions\trigger-no-show-detector.ts:189:            // concurrent invocation already moved the booking out 
of NO_SHOW_REDISPATCH (to SEARCHING
  api\src\functions\trigger-no-show-detector.ts:190:            // or ASSIGNED). Only emit BOOKING_UNFULFILLED when 
the dispatcher actually set the status
  api\src\functions\trigger-no-show-detector.ts:193:            if (postDispatchDoc?.status === 'UNFULFILLED') {
  api\src\functions\trigger-no-show-detector.ts:194:              const _ts = new Date().toISOString();
> api\src\functions\trigger-no-show-detector.ts:195:              void appendAuditEntry({ id: randomUUID(), adminId: 
'system', role: 'system', action: 'BOOKING_UNFULFILLED', resourceType: 'booking', resourceId: booking.id, payload: { 
bookingId: booking.id }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
  api\src\functions\trigger-no-show-detector.ts:196:            }
  api\src\functions\trigger-no-show-detector.ts:197:          }
  api\src\functions\trigger-no-show-detector.ts:198:        } catch (err: unknown) {
  api\src\functions\trigger-no-show-detector.ts:199:          Sentry.captureException(err);
  api\src\functions\trigger-no-show-detector.ts:200:          ctx.log(`detectNoShows: redispatch failed ${booking.id}: 
${err instanceof Error ? err.message : String(err)}`);
  api\src\functions\trigger-projector-bookings.ts:73:      type: 'ADDON_APPROVAL_REQUESTED',
  api\src\functions\trigger-projector-bookings.ts:74:      role: 'customer',
> api\src\functions\trigger-projector-bookings.ts:75:      sourceId: bookingId,
  api\src\functions\trigger-projector-bookings.ts:76:      expiresAt: stableExpiryFrom(addonRequestedAt, 
ADDON_EXPIRY_MS),
  api\src\functions\trigger-projector-bookings.ts:77:      priority: 1, // highest priority — blocks booking progress
  api\src\functions\trigger-projector-bookings.ts:78:      payload: {
  api\src\functions\trigger-projector-bookings.ts:79:        bookingId,
  api\src\functions\trigger-projector-bookings.ts:80:        addOnCount: (doc.pendingAddOns ?? []).length,
  api\src\functions\trigger-projector-bookings.ts:99:      type: 'RATING_PROMPT_CUSTOMER',
  api\src\functions\trigger-projector-bookings.ts:100:      role: 'customer',
> api\src\functions\trigger-projector-bookings.ts:101:      sourceId: bookingId,
  api\src\functions\trigger-projector-bookings.ts:102:      expiresAt: stableExpiryFrom(doc.completedAt ?? 
doc.createdAt, RATING_PROMPT_EXPIRY_MS),
  api\src\functions\trigger-projector-bookings.ts:103:      priority: 5,
  api\src\functions\trigger-projector-bookings.ts:104:      payload: { bookingId, technicianId: doc.technicianId },
  api\src\functions\trigger-projector-bookings.ts:105:    });
  api\src\functions\trigger-projector-bookings.ts:106:    if (!noOp) {
  api\src\functions\trigger-projector-complaints.ts:70:      type: 'COMPLAINT_UPDATE',
  api\src\functions\trigger-projector-complaints.ts:71:      role: 'customer',
> api\src\functions\trigger-projector-complaints.ts:72:      sourceId: complaintId,
  api\src\functions\trigger-projector-complaints.ts:73:      expiresAt: stableExpiryFrom(doc.createdAt, 
COMPLAINT_UPDATE_EXPIRY_MS),
  api\src\functions\trigger-projector-complaints.ts:74:      priority: 8,
  api\src\functions\trigger-projector-complaints.ts:75:      payload: {
  api\src\functions\trigger-projector-complaints.ts:76:        complaintId,
  api\src\functions\trigger-projector-complaints.ts:77:        bookingId,
  api\src\functions\trigger-projector-dispatch-attempts.ts:46:          type: 'JOB_OFFER',
  api\src\functions\trigger-projector-dispatch-attempts.ts:47:          role: 'technician',
> api\src\functions\trigger-projector-dispatch-attempts.ts:48:          sourceId: attemptId,
  api\src\functions\trigger-projector-dispatch-attempts.ts:49:          expiresAt, // inherit from dispatch attempt
  api\src\functions\trigger-projector-dispatch-attempts.ts:50:          priority: 1, // highest priority — 
time-sensitive
  api\src\functions\trigger-projector-dispatch-attempts.ts:51:          payload: {
  api\src\functions\trigger-projector-dispatch-attempts.ts:52:            attemptId,
  api\src\functions\trigger-projector-dispatch-attempts.ts:53:            bookingId: bookingId ?? '',
  api\src\functions\trigger-projector-kyc.ts:7: *   does NOT exist — binding to it would mean the trigger never fires.
  api\src\functions\trigger-projector-kyc.ts:8: *
> api\src\functions\trigger-projector-kyc.ts:9: * Emits: KYC_RESUME (to the technician when KYC requires manual action)
> api\src\functions\trigger-projector-kyc.ts:10: * Resolves: KYC_RESUME (when KYC reaches a terminal/complete status)
  api\src\functions\trigger-projector-kyc.ts:11: *
  api\src\functions\trigger-projector-kyc.ts:12: * STRICT ORDERING: upsertAction MUST be called before 
emitFcmForAction.
  api\src\functions\trigger-projector-kyc.ts:13: */
  api\src\functions\trigger-projector-kyc.ts:14:
  api\src\functions\trigger-projector-kyc.ts:15:import '../bootstrap.js';
  api\src\functions\trigger-projector-kyc.ts:25:import { isRetryableCosmosError } from '../shared/cosmos-errors.js';
  api\src\functions\trigger-projector-kyc.ts:26:
> api\src\functions\trigger-projector-kyc.ts:27:const KYC_RESUME_EXPIRY_MS = 30 * 24 * 60 * 60 * 1_000; // 30 days
  api\src\functions\trigger-projector-kyc.ts:28:
  api\src\functions\trigger-projector-kyc.ts:29:/**
  api\src\functions\trigger-projector-kyc.ts:30: * Shape of a technician document as received from the change feed.
  api\src\functions\trigger-projector-kyc.ts:31: * The `kyc` object is a nested sub-document written by 
`upsertKycStatus()`.
  api\src\functions\trigger-projector-kyc.ts:32: */
  api\src\functions\trigger-projector-kyc.ts:55: *
  api\src\functions\trigger-projector-kyc.ts:56: * Receives a TechnicianDoc change-feed event, inspects 
`doc.kyc.kycStatus`,
> api\src\functions\trigger-projector-kyc.ts:57: * and emits or resolves KYC_RESUME accordingly.
  api\src\functions\trigger-projector-kyc.ts:58: */
  api\src\functions\trigger-projector-kyc.ts:59:export async function processKycChangeFeedDoc(
  api\src\functions\trigger-projector-kyc.ts:60:  doc: TechnicianChangeFeedDoc,
  api\src\functions\trigger-projector-kyc.ts:61:  ctx?: InvocationContext,
  api\src\functions\trigger-projector-kyc.ts:62:): Promise<void> {
  api\src\functions\trigger-projector-kyc.ts:70:  }
  api\src\functions\trigger-projector-kyc.ts:71:
> api\src\functions\trigger-projector-kyc.ts:72:  const actionId = buildPendingActionId('KYC_RESUME', technicianId, 
technicianId); // sourceId = technicianId (1 KYC per tech)
  api\src\functions\trigger-projector-kyc.ts:73:
  api\src\functions\trigger-projector-kyc.ts:74:  if (ACTION_REQUIRED_STATUSES.has(kycStatus)) {
  api\src\functions\trigger-projector-kyc.ts:75:    // expiresAt derived from the KYC sub-doc's updatedAt (stable 
source timestamp).
  api\src\functions\trigger-projector-kyc.ts:76:    // Same kycStatus + same updatedAt → same expiresAt → replay is a 
no-op.
  api\src\functions\trigger-projector-kyc.ts:77:    const { doc: upserted, noOp } = await upsertAction({
  api\src\functions\trigger-projector-kyc.ts:78:      id: actionId,
  api\src\functions\trigger-projector-kyc.ts:79:      userId: technicianId,
> api\src\functions\trigger-projector-kyc.ts:80:      type: 'KYC_RESUME',
  api\src\functions\trigger-projector-kyc.ts:81:      role: 'technician',
> api\src\functions\trigger-projector-kyc.ts:82:      sourceId: technicianId,
> api\src\functions\trigger-projector-kyc.ts:83:      expiresAt: stableExpiryFrom(doc.kyc?.updatedAt, 
KYC_RESUME_EXPIRY_MS),
  api\src\functions\trigger-projector-kyc.ts:84:      priority: 2, // high priority — blocks earning
  api\src\functions\trigger-projector-kyc.ts:85:      payload: { kycStatus },
  api\src\functions\trigger-projector-kyc.ts:86:    });
  api\src\functions\trigger-projector-kyc.ts:87:
  api\src\functions\trigger-projector-kyc.ts:88:    if (!noOp) {
  api\src\functions\trigger-projector-kyc.ts:91:    }
  api\src\functions\trigger-projector-kyc.ts:92:  } else if (COMPLETE_STATUSES.has(kycStatus)) {
> api\src\functions\trigger-projector-kyc.ts:93:    // KYC complete — resolve any pending KYC_RESUME action
  api\src\functions\trigger-projector-kyc.ts:94:    await resolveAction(actionId, technicianId);
  api\src\functions\trigger-projector-kyc.ts:95:  }
  api\src\functions\trigger-projector-kyc.ts:96:}
  api\src\functions\trigger-projector-kyc.ts:97:
  api\src\functions\trigger-projector-kyc.ts:98:// ── Azure Functions trigger 
───────────────────────────────────────────────────
  api\src\functions\trigger-projector-kyc.ts:103:  // Bind to `technicians` — the KYC flow writes kyc.kycStatus here 
via upsertKycStatus().
  api\src\functions\trigger-projector-kyc.ts:104:  // A `kyc_submissions` container does not exist; binding to it 
would mean this trigger
> api\src\functions\trigger-projector-kyc.ts:105:  // never fires and KYC_RESUME actions are never created.
  api\src\functions\trigger-projector-kyc.ts:106:  containerName: 'technicians',
  api\src\functions\trigger-projector-kyc.ts:107:  leaseContainerName: 'pending_actions_kyc_leases',
  api\src\functions\trigger-projector-kyc.ts:108:  createLeaseContainerIfNotExists: false,
  api\src\functions\trigger-projector-kyc.ts:109:  handler: async (documents: unknown[], ctx: InvocationContext) => {
  api\src\functions\trigger-projector-kyc.ts:110:    const docs = documents as TechnicianChangeFeedDoc[];
  api\src\functions\trigger-projector-ratings.ts:53:    type: 'RATING_RECEIVED',
  api\src\functions\trigger-projector-ratings.ts:54:    role: 'technician',
> api\src\functions\trigger-projector-ratings.ts:55:    sourceId: ratingId,
  api\src\functions\trigger-projector-ratings.ts:56:    expiresAt: stableExpiryFrom(customerSubmittedAt, 
RATING_RECEIVED_EXPIRY_MS),
  api\src\functions\trigger-projector-ratings.ts:57:    priority: 10,
  api\src\functions\trigger-projector-ratings.ts:58:    payload: {
  api\src\functions\trigger-projector-ratings.ts:59:      ratingId,
  api\src\functions\trigger-projector-ratings.ts:60:      customerId,
  api\src\functions\trigger-reconcile-payouts.ts:18:    action,
  api\src\functions\trigger-reconcile-payouts.ts:19:    resourceType: 'wallet_ledger',
> api\src\functions\trigger-reconcile-payouts.ts:20:    resourceId: 'reconciliation',
  api\src\functions\trigger-reconcile-payouts.ts:21:    payload,
  api\src\functions\trigger-reconcile-payouts.ts:22:    timestamp,
  api\src\functions\trigger-reconcile-payouts.ts:23:    partitionKey: timestamp.slice(0, 7),
  api\src\functions\trigger-reconcile-payouts.ts:24:  });
  api\src\functions\trigger-reconcile-payouts.ts:25:}
  api\src\functions\webhooks.ts:90:        action: 'WALLET_CREDIT_APPLIED_ON_PAYMENT',
  api\src\functions\webhooks.ts:91:        resourceType: 'booking',
> api\src\functions\webhooks.ts:92:        resourceId: booking.id,
  api\src\functions\webhooks.ts:93:        payload: {
  api\src\functions\webhooks.ts:94:          bookingId: booking.id,
  api\src\functions\webhooks.ts:95:          creditAmountInPaise: booking.pendingCreditAmountInPaise,
  api\src\functions\webhooks.ts:96:          idempotencyKey: booking.pendingCreditIdempotencyKey,
  api\src\functions\webhooks.ts:97:        },
  api\src\functions\webhooks.ts:148:
  api\src\functions\webhooks.ts:149:  const _ts = new Date().toISOString();
> api\src\functions\webhooks.ts:150:  void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', 
action: 'PAYMENT_CAPTURED', resourceType: 'booking', resourceId: booking.id, payload: { bookingId: booking.id, 
paymentId, orderId }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
  api\src\functions\webhooks.ts:151:
  api\src\functions\webhooks.ts:152:  dispatcherService.triggerDispatch(booking.id).catch(() => {
  api\src\functions\webhooks.ts:153:    // fire-and-forget — dispatch failure does not fail the webhook ack
  api\src\functions\webhooks.ts:154:  });
  api\src\functions\webhooks.ts:155:
  api\src\schemas\audit-log.ts:7:  action: z.string(),
  api\src\schemas\audit-log.ts:8:  resourceType: z.string(),
> api\src\schemas\audit-log.ts:9:  resourceId: z.string(),
  api\src\schemas\audit-log.ts:10:  payload: z.record(z.unknown()),
  api\src\schemas\audit-log.ts:11:  ip: z.string().optional(),
  api\src\schemas\audit-log.ts:12:  userAgent: z.string().optional(),
  api\src\schemas\audit-log.ts:13:  timestamp: z.string(),
  api\src\schemas\audit-log.ts:14:});
  api\src\schemas\audit-log.ts:23:  action: z.string().optional(),
  api\src\schemas\audit-log.ts:24:  resourceType: z.string().optional(),
> api\src\schemas\audit-log.ts:25:  resourceId: z.string().optional(),
  api\src\schemas\audit-log.ts:26:  dateFrom: z.string().optional(),
  api\src\schemas\audit-log.ts:27:  dateTo: z.string().optional(),
  api\src\schemas\audit-log.ts:28:  continuationToken: z.string().optional(),
  api\src\schemas\audit-log.ts:29:  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  api\src\schemas\audit-log.ts:30:});
  api\src\schemas\pendingActions.ts:19:  'COMPLAINT_UPDATE',
  api\src\schemas\pendingActions.ts:20:  'RATING_RECEIVED',
> api\src\schemas\pendingActions.ts:21:  'KYC_RESUME',
  api\src\schemas\pendingActions.ts:22:  'JOB_OFFER',
  api\src\schemas\pendingActions.ts:23:]);
  api\src\schemas\pendingActions.ts:24:
  api\src\schemas\pendingActions.ts:25:export const PendingActionStatusSchema = z.enum([
  api\src\schemas\pendingActions.ts:26:  'ACTIVE',
  api\src\schemas\pendingActions.ts:33:
  api\src\schemas\pendingActions.ts:34:export const PendingActionDocSchema = z.object({
> api\src\schemas\pendingActions.ts:35:  /** Deterministic id: `<type>:<userId>:<sourceId>` — enables idempotent 
upsert. */
  api\src\schemas\pendingActions.ts:36:  id: z.string().min(1),
  api\src\schemas\pendingActions.ts:37:  /** Cosmos partition key. */
  api\src\schemas\pendingActions.ts:38:  userId: z.string().min(1),
  api\src\schemas\pendingActions.ts:39:  type: PendingActionTypeSchema,
  api\src\schemas\pendingActions.ts:40:  status: PendingActionStatusSchema,
  api\src\schemas\pendingActions.ts:51:  updatedAt: z.string().datetime(),
  api\src\schemas\pendingActions.ts:52:  /** Source document id (booking id, rating id, etc.). */
> api\src\schemas\pendingActions.ts:53:  sourceId: z.string().min(1),
  api\src\schemas\pendingActions.ts:54:  /**
  api\src\schemas\pendingActions.ts:55:   * Arbitrary action-specific metadata.
  api\src\schemas\pendingActions.ts:56:   * Stored as a plain record so projectors can attach context without
  api\src\schemas\pendingActions.ts:57:   * schema churn (bookingId, technicianId, addonTotal, etc.).
  api\src\schemas\pendingActions.ts:58:   */
  api\src\schemas\pendingActions.ts:75:  type: PendingActionType,
  api\src\schemas\pendingActions.ts:76:  userId: string,
> api\src\schemas\pendingActions.ts:77:  sourceId: string,
  api\src\schemas\pendingActions.ts:78:): string {
> api\src\schemas\pendingActions.ts:79:  return `${type}:${userId}:${sourceId}`;
  api\src\schemas\pendingActions.ts:80:}
  api\src\services\auditLog.service.ts:15:  action: string,
  api\src\services\auditLog.service.ts:16:  resourceType: string,
> api\src\services\auditLog.service.ts:17:  resourceId: string,
  api\src\services\auditLog.service.ts:18:  payload: Record<string, unknown>,
  api\src\services\auditLog.service.ts:19:  extras?: { ip?: string; userAgent?: string },
  api\src\services\auditLog.service.ts:20:): Promise<void> {
  api\src\services\auditLog.service.ts:21:  try {
  api\src\services\auditLog.service.ts:22:    const timestamp = new Date().toISOString();
  api\src\services\auditLog.service.ts:27:      action,
  api\src\services\auditLog.service.ts:28:      resourceType,
> api\src\services\auditLog.service.ts:29:      resourceId,
  api\src\services\auditLog.service.ts:30:      payload,
  api\src\services\auditLog.service.ts:31:      timestamp,
  api\src\services\auditLog.service.ts:32:      partitionKey: timestamp.slice(0, 7),
  api\src\services\auditLog.service.ts:33:    };
  api\src\services\auditLog.service.ts:34:    const doc: AuditLogDoc = {
  api\src\services\catalogueAudit.service.ts:13:  action: string,
  api\src\services\catalogueAudit.service.ts:14:  resourceType: string,
> api\src\services\catalogueAudit.service.ts:15:  resourceId: string,
  api\src\services\catalogueAudit.service.ts:16:  payload: Record<string, unknown>,
  api\src\services\catalogueAudit.service.ts:17:): Promise<void> {
  api\src\services\catalogueAudit.service.ts:18:  try {
  api\src\services\catalogueAudit.service.ts:19:    const ts = new Date().toISOString();
  api\src\services\catalogueAudit.service.ts:20:    await appendAuditEntry({
  api\src\services\catalogueAudit.service.ts:24:      action,
  api\src\services\catalogueAudit.service.ts:25:      resourceType,
> api\src\services\catalogueAudit.service.ts:26:      resourceId,
  api\src\services\catalogueAudit.service.ts:27:      payload,
  api\src\services\catalogueAudit.service.ts:28:      timestamp: ts,
  api\src\services\catalogueAudit.service.ts:29:      partitionKey: ts.slice(0, 7),
  api\src\services\catalogueAudit.service.ts:30:    });
  api\src\services\catalogueAudit.service.ts:31:  } catch (err) {
  api\src\services\erasureCascade.service.ts:48:    userDataCascadeWrites.anonymizeBookingEvents(userId, hash),
  api\src\services\erasureCascade.service.ts:49:    userDataCascadeWrites.anonymizeDispatchAttempts(userId, hash),
> api\src\services\erasureCascade.service.ts:50:    userDataCascadeWrites.anonymizeAuditLogResourceId(userId, hash),
  api\src\services\erasureCascade.service.ts:51:  ]);
  api\src\services\erasureCascade.service.ts:52:
  api\src\services\erasureCascade.service.ts:53:  // E19-S02: clear FCM device token docs linked to erased UID (DPDP 
§12 compliance).
  api\src\services\erasureCascade.service.ts:54:  await deviceTokenRepo.unregisterAllForUser(userId);
  api\src\services\erasureCascade.service.ts:55:
  api\src\services\fcm.service.ts:176:): Promise<void> {
  api\src\services\fcm.service.ts:177:  await sendToUserTokens(technicianId, {
> api\src\services\fcm.service.ts:178:    type: 'EARNINGS_UPDATE',
  api\src\services\fcm.service.ts:179:    bookingId: payload.bookingId,
  api\src\services\fcm.service.ts:180:    techAmount: String(payload.techAmount),
  api\src\services\fcm.service.ts:181:  });
  api\src\services\fcm.service.ts:182:}
  api\src\services\fcm.service.ts:183:
  api\src\services\kycAudit.service.ts:4:
  api\src\services\kycAudit.service.ts:5:// maskedIdentifier deliberately omitted: audit_log is immutable so PII (PAN,
> api\src\services\kycAudit.service.ts:6:// Aadhaar) must never land in payload — erasure path only anonymizes 
resourceId.
  api\src\services\kycAudit.service.ts:7:export async function kycAuditEntry(
  api\src\services\kycAudit.service.ts:8:  technicianId: string,
  api\src\services\kycAudit.service.ts:9:  kycMethod: string,
  api\src\services\kycAudit.service.ts:10:  kycStatus: string,
  api\src\services\kycAudit.service.ts:11:): Promise<void> {
  api\src\services\kycAudit.service.ts:18:      action: `KYC_${kycMethod.toUpperCase()}_${kycStatus}`,
  api\src\services\kycAudit.service.ts:19:      resourceType: 'technician',
> api\src\services\kycAudit.service.ts:20:      resourceId: technicianId,
  api\src\services\kycAudit.service.ts:21:      payload: { kycMethod, kycStatus },
  api\src\services\kycAudit.service.ts:22:      timestamp: ts,
  api\src\services\kycAudit.service.ts:23:      partitionKey: ts.slice(0, 7),
  api\src\services\kycAudit.service.ts:24:    });
  api\src\services\kycAudit.service.ts:25:  } catch (err) {
  api\src\services\pending-action-projector.ts:30:  type: PendingActionType;
  api\src\services\pending-action-projector.ts:31:  role: PendingActionRole;
> api\src\services\pending-action-projector.ts:32:  sourceId: string;
  api\src\services\pending-action-projector.ts:33:  expiresAt: string;
  api\src\services\pending-action-projector.ts:34:  priority: number;
  api\src\services\pending-action-projector.ts:35:  payload?: Record<string, unknown>;
  api\src\services\pending-action-projector.ts:36:}
  api\src\services\pending-action-projector.ts:37:
  api\src\services\pending-action-projector.ts:103:        createdAt: now(),
  api\src\services\pending-action-projector.ts:104:        updatedAt: now(),
> api\src\services\pending-action-projector.ts:105:        sourceId: input.sourceId,
  api\src\services\pending-action-projector.ts:106:        payload: input.payload,
  api\src\services\pending-action-projector.ts:107:      };
  api\src\services\pending-action-projector.ts:108:      const created = await createPendingAction(doc);
  api\src\services\pending-action-projector.ts:109:      _log('pending_action_upsert', {
  api\src\services\pending-action-projector.ts:110:        id: created.id,
  api\src\services\pending-action-projector.ts:216:        type: doc.type,
  api\src\services\pending-action-projector.ts:217:        actionId: doc.id,
> api\src\services\pending-action-projector.ts:218:        sourceId: doc.sourceId,
  api\src\services\pending-action-projector.ts:219:        // Legacy-client compatibility fields.
  api\src\services\pending-action-projector.ts:220:        // Customer app (CustomerFirebaseMessagingService) returns 
early on
  api\src\services\pending-action-projector.ts:221:        // ADDON_APPROVAL_REQUESTED and RATING_PROMPT_CUSTOMER 
without bookingId.
  api\src\services\pending-action-projector.ts:222:        // Technician app (HomeservicesFcmService) defaults missing 
`overall` to 1
  api\src\services\pending-action-projector.ts:223:        // for RATING_RECEIVED (wrong content). We hoist these 
top-level so existing



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'api/scripts','api/src' -Include '*.ts' | Select-String -Pattern 'technicianId|uid|createUser|phoneNumber|custom' -Context 1,2 | Select-Object -First 120" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1107ms:

  api\scripts\provision-cosmos-indexes.ts:2:// Adds the composite index required for efficient cross-partition queries
> api\scripts\provision-cosmos-indexes.ts:3:// by technicianId on the bookings container.
  api\scripts\provision-cosmos-indexes.ts:4://
  api\scripts\provision-cosmos-indexes.ts:5:// The bookings container is partitioned by /id (booking ID). Queries that
> api\scripts\provision-cosmos-indexes.ts:6:// filter on technicianId (a non-partition-key field) fan out across all
  api\scripts\provision-cosmos-indexes.ts:7:// physical partitions. Without a composite index the Cosmos Serverless
  api\scripts\provision-cosmos-indexes.ts:8:// query planner falls back to a full container scan, which is expensive
  api\scripts\provision-cosmos-indexes.ts:41:
> api\scripts\provision-cosmos-indexes.ts:42:// Composite index that makes the getByTechnicianId query efficient.
> api\scripts\provision-cosmos-indexes.ts:43:// Covers: WHERE technicianId = ? AND status IN (...)
  api\scripts\provision-cosmos-indexes.ts:44:// and allows ORDER BY slotDate, slotWindow without an in-memory sort.
  api\scripts\provision-cosmos-indexes.ts:45:const TECHNICIAN_BOOKINGS_INDEX = [
> api\scripts\provision-cosmos-indexes.ts:46:  { path: '/technicianId', order: 'ascending' as const },
  api\scripts\provision-cosmos-indexes.ts:47:  { path: '/slotDate', order: 'ascending' as const },
  api\scripts\provision-cosmos-indexes.ts:48:  { path: '/slotWindow', order: 'ascending' as const },
  api\scripts\provision-cosmos-indexes.ts:57:      idx.length >= 2 &&
> api\scripts\provision-cosmos-indexes.ts:58:      idx[0]?.path === '/technicianId' &&
  api\scripts\provision-cosmos-indexes.ts:59:      idx[1]?.path === '/slotDate',
  api\scripts\provision-cosmos-indexes.ts:60:  );
  api\scripts\provision-cosmos-indexes.ts:74:  if (indexAlreadyPresent(existingComposite)) {
> api\scripts\provision-cosmos-indexes.ts:75:    console.log('✓ Composite index on [/technicianId, /slotDate, 
/slotWindow] already present. Nothing to do.');
  api\scripts\provision-cosmos-indexes.ts:76:    return;
  api\scripts\provision-cosmos-indexes.ts:77:  }
  api\scripts\provision-cosmos-indexes.ts:86:
> api\scripts\provision-cosmos-indexes.ts:87:  console.log('Adding composite index [/technicianId asc, /slotDate asc, 
/slotWindow asc]…');
  api\scripts\provision-cosmos-indexes.ts:88:  await container.replace({ ...def, indexingPolicy: updatedPolicy });
  api\scripts\provision-cosmos-indexes.ts:89:  console.log('✓ Done. Cosmos is rebuilding the index in the background 
(usually <30 s for pilot scale).');
  api\scripts\seed-admin.ts:33:async function main() {
> api\scripts\seed-admin.ts:34:  let uid: string;
  api\scripts\seed-admin.ts:35:  try {
> api\scripts\seed-admin.ts:36:    const user = await admin.auth().createUser({ email, password });
> api\scripts\seed-admin.ts:37:    uid = user.uid;
> api\scripts\seed-admin.ts:38:    console.log(`Firebase user created: ${uid}`);
  api\scripts\seed-admin.ts:39:  } catch (err: any) {
  api\scripts\seed-admin.ts:40:    if (err.code === 'auth/email-already-exists') {
  api\scripts\seed-admin.ts:41:      const user = await admin.auth().getUserByEmail(email!);
> api\scripts\seed-admin.ts:42:      uid = user.uid;
> api\scripts\seed-admin.ts:43:      console.log(`Firebase user already exists: ${uid}`);
  api\scripts\seed-admin.ts:44:    } else {
  api\scripts\seed-admin.ts:45:      throw err;
  api\scripts\seed-admin.ts:51:    await container.items.create({
> api\scripts\seed-admin.ts:52:      id: uid, adminId: uid, email, role: 'super-admin',
  api\scripts\seed-admin.ts:53:      totpEnrolled: false, totpSecret: null, totpSecretPending: null,
  api\scripts\seed-admin.ts:54:      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  api\scripts\seed-technicians.ts:16:    id: 'tech-ayd-001',
> api\scripts\seed-technicians.ts:17:    technicianId: 'tech-ayd-001',
  api\scripts\seed-technicians.ts:18:    location: { type: 'Point', coordinates: [82.1968, 26.7913] }, // Ram 
Janmabhoomi area
  api\scripts\seed-technicians.ts:19:    skills: ['ac-deep-clean', 'ac-gas-refill', 'ac-installation'], // catalogue: 
ac-repair
  api\scripts\seed-technicians.ts:33:    id: 'tech-ayd-002',
> api\scripts\seed-technicians.ts:34:    technicianId: 'tech-ayd-002',
  api\scripts\seed-technicians.ts:35:    location: { type: 'Point', coordinates: [82.2042, 26.7752] }, // Naya Ghat
  api\scripts\seed-technicians.ts:36:    skills: ['plumbing-leak-fix', 'plumbing-tap-install', 
'plumbing-pipe-repair'], // catalogue: plumbing
  api\scripts\seed-technicians.ts:49:    id: 'tech-ayd-003',
> api\scripts\seed-technicians.ts:50:    technicianId: 'tech-ayd-003',
  api\scripts\seed-technicians.ts:51:    location: { type: 'Point', coordinates: [82.1815, 26.8019] }, // Faizabad 
Cantt
  api\scripts\seed-technicians.ts:52:    skills: ['electrical-switchboard-fix', 'electrical-fan-install', 
'electrical-wiring', 'ac-deep-clean'], // catalogue: electrical + ac-repair
  api\scripts\seed-technicians.ts:65:    id: 'tech-ayd-004',
> api\scripts\seed-technicians.ts:66:    technicianId: 'tech-ayd-004',
  api\scripts\seed-technicians.ts:67:    location: { type: 'Point', coordinates: [82.2238, 26.7905] }, // Saket 
College area
  api\scripts\seed-technicians.ts:68:    // Multi-skill tech keeps eligible coverage >=2 for ro-* + 
plumbing-tap-install
  api\scripts\seed-technicians.ts:85:    id: 'tech-ayd-005',
> api\scripts\seed-technicians.ts:86:    technicianId: 'tech-ayd-005',
  api\scripts\seed-technicians.ts:87:    location: { type: 'Point', coordinates: [82.1652, 26.7871] }, // Reedganj
  api\scripts\seed-technicians.ts:88:    skills: ['water-pump-repair', 'borewell-servicing'], // catalogue: water-pump
  api\scripts\seed-technicians.ts:100:    id: 'tech-ayd-006',
> api\scripts\seed-technicians.ts:101:    technicianId: 'tech-ayd-006',
  api\scripts\seed-technicians.ts:102:    location: { type: 'Point', coordinates: [82.2105, 26.8084] }, // Civil Lines
  api\scripts\seed-technicians.ts:103:    skills: ['ro-installation', 'ro-service-amc'], // catalogue: water-purifier
  api\scripts\seed-technicians.ts:115:    id: 'tech-ayd-007',
> api\scripts\seed-technicians.ts:116:    technicianId: 'tech-ayd-007',
  api\scripts\seed-technicians.ts:117:    location: { type: 'Point', coordinates: [82.1893, 26.7681] }, // Chowk
  api\scripts\seed-technicians.ts:118:    skills: ['electrical-switchboard-fix', 'electrical-fan-install', 
'plumbing-leak-fix'], // catalogue: electrical + plumbing
  api\scripts\seed-technicians.ts:131:    id: 'tech-ayd-008',
> api\scripts\seed-technicians.ts:132:    technicianId: 'tech-ayd-008',
  api\scripts\seed-technicians.ts:133:    location: { type: 'Point', coordinates: [82.2378, 26.7798] }, // Saadat Ganj
  api\scripts\seed-technicians.ts:134:    skills: ['water-pump-repair', 'borewell-servicing', 
'electrical-switchboard-fix'], // catalogue: water-pump + electrical
  api\scripts\seed-technicians.ts:147:    id: 'tech-ayd-009',
> api\scripts\seed-technicians.ts:148:    technicianId: 'tech-ayd-009',
  api\scripts\seed-technicians.ts:149:    location: { type: 'Point', coordinates: [82.1748, 26.8203] }, // Nirmali Kund
  api\scripts\seed-technicians.ts:150:    skills: ['ro-installation', 'ro-service-amc', 'plumbing-tap-install'], // 
catalogue: water-purifier + plumbing
  api\scripts\seed-technicians.ts:162:    id: 'tech-ayd-010',
> api\scripts\seed-technicians.ts:163:    technicianId: 'tech-ayd-010',
  api\scripts\seed-technicians.ts:164:    location: { type: 'Point', coordinates: [82.2151, 26.7617] }, // Bareta
  api\scripts\seed-technicians.ts:165:    skills: ['ac-installation', 'ac-deep-clean', 'plumbing-pipe-repair', 
'electrical-wiring'], // catalogue: ac-repair + plumbing + electrical
  api\scripts\setup-cosmos.ts:25:  { id: 'erasure_requests',  partitionKey: '/partitionKey', ttl: undefined },
> api\scripts\setup-cosmos.ts:26:  // Admin-side customer metadata (flag, internal notes). One doc per customer
> api\scripts\setup-cosmos.ts:27:  // id, partitioned by /id so point reads in patchCustomerMetadata are O(1).
> api\scripts\setup-cosmos.ts:28:  // Missing this container makes the admin customers list silently empty
  api\scripts\setup-cosmos.ts:29:  // because the page wraps the fetch in try/catch (see app/[locale]/(dashboard)/
> api\scripts\setup-cosmos.ts:30:  // customers/page.tsx). Container name uses a hyphen per existing repo code
> api\scripts\setup-cosmos.ts:31:  // (api/src/cosmos/customer-metadata-repository.ts:3).
> api\scripts\setup-cosmos.ts:32:  { id: 'customer-metadata', partitionKey: '/id',           ttl: undefined },
> api\scripts\setup-cosmos.ts:33:  // E07-S04: customer credit wallet for no-show compensation — partitioned by /id
  api\scripts\setup-cosmos.ts:34:  // (one document per bookingId, idempotency-safe via conflict on duplicate /id)
> api\scripts\setup-cosmos.ts:35:  // NOTE (P1-1): this container is partitioned by /id, NOT /customerId.
> api\scripts\setup-cosmos.ts:36:  // Balance queries must use cross-partition execution (see 
customer-credit-ledger-repository.ts).
> api\scripts\setup-cosmos.ts:37:  // TODO: future migration to partition by /customerId for single-partition balance 
queries.
> api\scripts\setup-cosmos.ts:38:  { id: 'customer_credits',  partitionKey: '/id',           ttl: undefined },
  api\scripts\setup-cosmos.ts:39:  // E13-S01 (P2-7): applied-credit idempotency dedup — 24h TTL per idempotency-key.
> api\scripts\setup-cosmos.ts:40:  // Partitioned by /customerId so reads by (idempotencyKey, customerId) are 
single-partition.
  api\scripts\setup-cosmos.ts:41:  // Container name: applied_credit_idempotency
> api\scripts\setup-cosmos.ts:42:  { id: 'applied_credit_idempotency', partitionKey: '/customerId', ttl: 86400 },
  api\scripts\setup-cosmos.ts:43:  // E17-S02: live technician location — one doc per active booking, last-write-wins.
  api\scripts\setup-cosmos.ts:44:  // Cosmos auto-deletes after 1h (TTL=3600). Partitioned by /bookingId for 
single-partition reads.
  api\scripts\setup-cosmos.ts:59:  // Ratings — one doc per booking, /bookingId partition so all ratings for a
> api\scripts\setup-cosmos.ts:60:  // booking sit in one partition (some bookings have customer + tech ratings).
  api\scripts\setup-cosmos.ts:61:  { id: 'ratings', partitionKey: '/bookingId', ttl: undefined },
  api\scripts\setup-cosmos.ts:62:  // Service catalogue: services partitioned by /categoryId for listing per
  api\scripts\setup-cosmos.ts:66:  { id: 'service_categories', partitionKey: '/id', ttl: -1 },
> api\scripts\setup-cosmos.ts:67:  // Technicians directory — /id partition, point reads by technicianId.
  api\scripts\setup-cosmos.ts:68:  { id: 'technicians', partitionKey: '/id', ttl: undefined },
  api\scripts\setup-cosmos.ts:69:  // Wallet ledger — append-only credit/debit entries; /partitionKey field set
> api\scripts\setup-cosmos.ts:70:  // to customerId at write time so per-customer balance reads are single-partition.
  api\scripts\setup-cosmos.ts:71:  { id: 'wallet_ledger', partitionKey: '/partitionKey', ttl: undefined },
  api\scripts\setup-cosmos.ts:72:  // Razorpay webhook idempotency — /id is the webhook event id from Razorpay.
  api\scripts\setup-cosmos.ts:101:
> api\scripts\setup-cosmos.ts:102:  // Complaints container needs a custom indexing policy to exclude note bodies
  api\scripts\setup-cosmos.ts:103:  // (reduces RU/write cost at scale) — must match src/cosmos/seeds/complaints.ts.
  api\scripts\setup-cosmos.ts:104:  await database.containers.createIfNotExists({
  api\scripts\setup-cosmos.ts:116:  // ── E11-S02: pending_actions + 5 new lease containers ────────────────────────
> api\scripts\setup-cosmos.ts:117:  // The pending_actions container stores projected actions for customer + 
technician apps.
  api\scripts\setup-cosmos.ts:118:  await database.containers.createIfNotExists({
  api\scripts\setup-cosmos.ts:119:    id: 'pending_actions',
  api\scripts\setup-cosmos.ts:168:
> api\scripts\setup-cosmos.ts:169:  // E16-S04/WS-F: Waitlist — customers who requested a service in their area.
> api\scripts\setup-cosmos.ts:170:  // Partitioned by /phone for per-customer access patterns.
  api\scripts\setup-cosmos.ts:171:  // TTL = 1 year (31 536 000 s) for compliance retention; admin CSV export deferred 
to E16-S04b.
  api\scripts\setup-cosmos.ts:172:  await database.containers.createIfNotExists({
> api\scripts\setup-cosmos.ts:173:    id: 'customer_waitlist',
  api\scripts\setup-cosmos.ts:174:    partitionKey: { paths: ['/phone'] },
  api\scripts\setup-cosmos.ts:175:    defaultTtl: 31_536_000,
  api\scripts\setup-cosmos.ts:176:  });
> api\scripts\setup-cosmos.ts:177:  console.log("Container 'customer_waitlist' ready.");
  api\scripts\setup-cosmos.ts:178:
  api\scripts\setup-cosmos.ts:179:  // E11-S05b-2: Per-incident AES key docs for SOS audio encryption.
> api\scripts\setup-cosmos.ts:180:  // Partitioned by /customerId for single-partition key lookups in the playback 
endpoint.
  api\scripts\setup-cosmos.ts:181:  // defaultTtl = 604800 (7 days) ensures keys auto-delete with the Storage blob 
lifecycle.
  api\scripts\setup-cosmos.ts:182:  await database.containers.createIfNotExists({
  api\scripts\setup-cosmos.ts:183:    id: 'sos_incident_keys',
> api\scripts\setup-cosmos.ts:184:    partitionKey: { paths: ['/customerId'] },
  api\scripts\setup-cosmos.ts:185:    defaultTtl: 604800,
  api\scripts\setup-cosmos.ts:186:  });
> api\src\cosmos\repositories\waitlist.repository.ts:1:import { randomUUID } from 'node:crypto';
  api\src\cosmos\repositories\waitlist.repository.ts:2:import { getCosmosClient, DB_NAME } from '../client.js';
  api\src\cosmos\repositories\waitlist.repository.ts:3:
  api\src\cosmos\repositories\waitlist.repository.ts:15:function getContainer() {
> api\src\cosmos\repositories\waitlist.repository.ts:16:  return 
getCosmosClient().database(DB_NAME).container('customer_waitlist');
  api\src\cosmos\repositories\waitlist.repository.ts:17:}
  api\src\cosmos\repositories\waitlist.repository.ts:18:
  api\src\cosmos\repositories\waitlist.repository.ts:22:  const doc: WaitlistDoc = {
> api\src\cosmos\repositories\waitlist.repository.ts:23:    id: randomUUID(),
  api\src\cosmos\repositories\waitlist.repository.ts:24:    ...data,
  api\src\cosmos\repositories\waitlist.repository.ts:25:    createdAt: new Date().toISOString(),
> api\src\cosmos\booking-event-repository.ts:1:import { randomUUID } from 'node:crypto';
  api\src\cosmos\booking-event-repository.ts:2:import { getBookingEventsContainer } from './client.js';
  api\src\cosmos\booking-event-repository.ts:3:import type { BookingEventDoc } from '../schemas/booking-event.js';
  api\src\cosmos\booking-event-repository.ts:8:      ...event,
> api\src\cosmos\booking-event-repository.ts:9:      id: randomUUID(),
  api\src\cosmos\booking-event-repository.ts:10:      ts: new Date().toISOString(),
  api\src\cosmos\booking-event-repository.ts:11:    };
> api\src\cosmos\booking-repository.ts:1:import { randomUUID } from 'node:crypto';
  api\src\cosmos\booking-repository.ts:2:import { getBookingsContainer } from './client.js';
  api\src\cosmos\booking-repository.ts:3:import type { BookingDoc, CreateBookingRequest } from '../schemas/booking.js';
  api\src\cosmos\booking-repository.ts:9:export interface BookingCreateMetadata {
> api\src\cosmos\booking-repository.ts:10:  customerName?: string;
> api\src\cosmos\booking-repository.ts:11:  customerPhone?: string;
> api\src\cosmos\booking-repository.ts:12:  customerEmail?: string;
  api\src\cosmos\booking-repository.ts:13:  serviceName?: string;
  api\src\cosmos\booking-repository.ts:14:}
  api\src\cosmos\booking-repository.ts:29:    req: CreateBookingRequest,
> api\src\cosmos\booking-repository.ts:30:    customerId: string,
  api\src\cosmos\booking-repository.ts:31:    paymentOrderId: string,
  api\src\cosmos\booking-repository.ts:32:    amount: number,
  api\src\cosmos\booking-repository.ts:38:    const doc: BookingDoc = {
> api\src\cosmos\booking-repository.ts:39:      id: bookingId ?? randomUUID(), customerId, ...req,
  api\src\cosmos\booking-repository.ts:40:      addressText: normalizeAddressText(req.addressText),
> api\src\cosmos\booking-repository.ts:41:      ...(metadata.customerName ? { customerName: metadata.customerName } : 
{}),
> api\src\cosmos\booking-repository.ts:42:      ...(metadata.customerPhone ? { customerPhone: metadata.customerPhone } 
: {}),
> api\src\cosmos\booking-repository.ts:43:      ...(metadata.customerEmail ? { customerEmail: metadata.customerEmail } 
: {}),
  api\src\cosmos\booking-repository.ts:44:      ...(metadata.serviceName ? { serviceName: metadata.serviceName } : {}),
  api\src\cosmos\booking-repository.ts:45:      status: 'PENDING_PAYMENT', paymentOrderId,
  api\src\cosmos\booking-repository.ts:138:              WHERE c.status IN ('PAID', 'UNFULFILLED')
> api\src\cosmos\booking-repository.ts:139:                AND (NOT IS_DEFINED(c.technicianId) OR 
IS_NULL(c.technicianId))`,
  api\src\cosmos\booking-repository.ts:140:      parameters: [],
  api\src\cosmos\booking-repository.ts:141:    }).fetchAll();
  api\src\cosmos\booking-repository.ts:147:      .items.query<BookingDoc>({
> api\src\cosmos\booking-repository.ts:148:        query: "SELECT * FROM c WHERE (c.status IN ('ASSIGNED', 
'NO_SHOW_REDISPATCH') OR (c.status = 'SEARCHING' AND IS_DEFINED(c.noShowTechnicianId))) AND c.slotDate <= @slotDate",
  api\src\cosmos\booking-repository.ts:149:        parameters: [{ name: '@slotDate', value: slotDateCutoff }],
  api\src\cosmos\booking-repository.ts:150:      })
  api\src\cosmos\booking-repository.ts:154:
> api\src\cosmos\booking-repository.ts:155:  async getByTechnicianId(technicianId: string): Promise<BookingDoc[]> {
  api\src\cosmos\booking-repository.ts:156:    const { resources } = await getBookingsContainer()
  api\src\cosmos\booking-repository.ts:157:      .items.query<BookingDoc>({
  api\src\cosmos\booking-repository.ts:158:        query: `SELECT * FROM c
> api\src\cosmos\booking-repository.ts:159:                WHERE c.technicianId = @technicianId
  api\src\cosmos\booking-repository.ts:160:                  AND c.status IN (
  api\src\cosmos\booking-repository.ts:161:                    'ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS',
  api\src\cosmos\booking-repository.ts:163:                  )`,
> api\src\cosmos\booking-repository.ts:164:        parameters: [{ name: '@technicianId', value: technicianId }],
  api\src\cosmos\booking-repository.ts:165:      })
  api\src\cosmos\booking-repository.ts:166:      .fetchAll();
  api\src\cosmos\booking-repository.ts:169:    // Sort in-memory after the composite index is provisioned (see
> api\src\cosmos\booking-repository.ts:170:    // scripts/provision-cosmos-indexes.ts). The index covers 
[/technicianId,
  api\src\cosmos\booking-repository.ts:171:    // /slotDate, /slotWindow] so ORDER BY in the query is also valid, but
  api\src\cosmos\booking-repository.ts:172:    // in-memory sort keeps this function safe even before the first index 
rebuild.
  api\src\cosmos\booking-repository.ts:178:
> api\src\cosmos\booking-repository.ts:179:  async getByCustomerId(customerId: string): Promise<BookingDoc[]> {
  api\src\cosmos\booking-repository.ts:180:    const { resources } = await getBookingsContainer()
  api\src\cosmos\booking-repository.ts:181:      .items.query<BookingDoc>({
  api\src\cosmos\booking-repository.ts:182:        query: `SELECT * FROM c
> api\src\cosmos\booking-repository.ts:183:                WHERE c.customerId = @customerId`,
> api\src\cosmos\booking-repository.ts:184:        parameters: [{ name: '@customerId', value: customerId }],
  api\src\cosmos\booking-repository.ts:185:      })
  api\src\cosmos\booking-repository.ts:186:      .fetchAll();
  api\src\cosmos\booking-repository.ts:208:
> api\src\cosmos\booking-repository.ts:209:  async applyAddOnDecisions(id: string, customerId: string, decisions: 
AddOnDecision[]): Promise<BookingDoc | null> {
  api\src\cosmos\booking-repository.ts:210:    const existing = await this.getById(id);
> api\src\cosmos\booking-repository.ts:211:    if (!existing || existing.customerId !== customerId) return null;
  api\src\cosmos\booking-repository.ts:212:    if (existing.status !== 'AWAITING_PRICE_APPROVAL') return null;
  api\src\cosmos\booking-repository.ts:213:    const pending = existing.pendingAddOns ?? [];
  api\src\cosmos\booking-repository.ts:274:                  AND c.slotDate = @date
> api\src\cosmos\booking-repository.ts:275:                  AND c.status NOT IN ('CUSTOMER_CANCELLED', 
'UNFULFILLED')`,
  api\src\cosmos\booking-repository.ts:276:        parameters: [
  api\src\cosmos\booking-repository.ts:277:          { name: '@serviceId', value: serviceId },
  api\src\cosmos\booking-repository.ts:298:
> api\src\cosmos\booking-repository.ts:299:export async function getActiveBookingCountForTechnician(technicianId: 
string): Promise<number> {
  api\src\cosmos\booking-repository.ts:300:  const { resources } = await getBookingsContainer()
  api\src\cosmos\booking-repository.ts:301:    .items.query<number>({
  api\src\cosmos\booking-repository.ts:302:      query: `SELECT VALUE COUNT(1) FROM c
> api\src\cosmos\booking-repository.ts:303:              WHERE c.technicianId = @technicianId
  api\src\cosmos\booking-repository.ts:304:                AND c.status IN ('ASSIGNED', 'EN_ROUTE', 'REACHED', 
'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL')`,
> api\src\cosmos\booking-repository.ts:305:      parameters: [{ name: '@technicianId', value: technicianId }],
  api\src\cosmos\booking-repository.ts:306:    })
  api\src\cosmos\booking-repository.ts:307:    .fetchAll();
  api\src\cosmos\booking-repository.ts:310:
> api\src\cosmos\booking-repository.ts:311:// ── Customer roster helpers (E09-S07a A4) 
─────────────────────────────────────
  api\src\cosmos\booking-repository.ts:312:
> api\src\cosmos\booking-repository.ts:313:export interface CustomerBookingSummary {
> api\src\cosmos\booking-repository.ts:314:  customerId: string;
  api\src\cosmos\booking-repository.ts:315:  bookingCount: number;
  api\src\cosmos\booking-repository.ts:316:  lastBookingDate?: string;
  api\src\cosmos\booking-repository.ts:318:  recentBookings: Array<{
> api\src\cosmos\booking-repository.ts:319:    date: string; serviceId: string; technicianId: string; status: string;
  api\src\cosmos\booking-repository.ts:320:  }>;
  api\src\cosmos\booking-repository.ts:321:}
  api\src\cosmos\booking-repository.ts:322:
> api\src\cosmos\booking-repository.ts:323:export async function getCustomerSummaries(): 
Promise<CustomerBookingSummary[]> {
  api\src\cosmos\booking-repository.ts:324:  const { resources } = await getBookingsContainer()
  api\src\cosmos\booking-repository.ts:325:    .items.query<{
> api\src\cosmos\booking-repository.ts:326:      customerId: string; slotDate: string; serviceId: string;
> api\src\cosmos\booking-repository.ts:327:      technicianId: string; status: string; addressText: string;
> api\src\cosmos\booking-repository.ts:328:    }>(`SELECT c.customerId, c.slotDate, c.serviceId, c.technicianId,
  api\src\cosmos\booking-repository.ts:329:              c.status, c.addressText
  api\src\cosmos\booking-repository.ts:330:        FROM c`)
  api\src\cosmos\booking-repository.ts:332:
> api\src\cosmos\booking-repository.ts:333:  const map = new Map<string, CustomerBookingSummary>();
  api\src\cosmos\booking-repository.ts:334:  for (const r of resources) {
> api\src\cosmos\booking-repository.ts:335:    const cid = r.customerId;
  api\src\cosmos\booking-repository.ts:336:    if (!cid) continue;
  api\src\cosmos\booking-repository.ts:337:    if (!map.has(cid)) {
  api\src\cosmos\booking-repository.ts:338:      const rawCity = typeof r.addressText === 'string' ? 
r.addressText.split(',').pop()?.trim() : undefined;
> api\src\cosmos\booking-repository.ts:339:      const entry: CustomerBookingSummary = {
> api\src\cosmos\booking-repository.ts:340:        customerId: cid,
  api\src\cosmos\booking-repository.ts:341:        bookingCount: 0,
  api\src\cosmos\booking-repository.ts:342:        recentBookings: [],
  api\src\cosmos\booking-repository.ts:353:        serviceId: r.serviceId,
> api\src\cosmos\booking-repository.ts:354:        technicianId: r.technicianId ?? '',
  api\src\cosmos\booking-repository.ts:355:        status: r.status,
  api\src\cosmos\booking-repository.ts:356:      });
  api\src\cosmos\catalogue-repository.ts:38:
> api\src\cosmos\catalogue-repository.ts:39:  async createCategory(body: CreateCategoryBody, uid: string): 
Promise<ServiceCategory> {
> api\src\cosmos\catalogue-repository.ts:40:    const doc: ServiceCategory = { ...body, isActive: true, updatedBy: 
uid, createdAt: now(), updatedAt: now() };
  api\src\cosmos\catalogue-repository.ts:41:    const { resource } = await 
this.cats.items.create<ServiceCategory>(doc);
  api\src\cosmos\catalogue-repository.ts:42:    return resource!;
  api\src\cosmos\catalogue-repository.ts:44:
> api\src\cosmos\catalogue-repository.ts:45:  async updateCategory(id: string, body: UpdateCategoryBody, uid: string): 
Promise<ServiceCategory | null> {
  api\src\cosmos\catalogue-repository.ts:46:    const existing = await this.getCategoryById(id);
  api\src\cosmos\catalogue-repository.ts:47:    if (!existing) return null;
> api\src\cosmos\catalogue-repository.ts:48:    const updated: ServiceCategory = { ...existing, ...body, id, 
updatedBy: uid, updatedAt: now() };
  api\src\cosmos\catalogue-repository.ts:49:    const { resource } = await 
this.cats.items.upsert<ServiceCategory>(updated);
  api\src\cosmos\catalogue-repository.ts:50:    return resource!;
  api\src\cosmos\catalogue-repository.ts:52:
> api\src\cosmos\catalogue-repository.ts:53:  async toggleCategory(id: string, uid: string): Promise<ServiceCategory | 
null> {
  api\src\cosmos\catalogue-repository.ts:54:    const existing = await this.getCategoryById(id);
  api\src\cosmos\catalogue-repository.ts:55:    if (!existing) return null;
> api\src\cosmos\catalogue-repository.ts:56:    const updated = { ...existing, isActive: !existing.isActive, 
updatedBy: uid, updatedAt: now() };
  api\src\cosmos\catalogue-repository.ts:57:    const { resource } = await 
this.cats.items.upsert<ServiceCategory>(updated);
  api\src\cosmos\catalogue-repository.ts:58:    return resource!;
  api\src\cosmos\catalogue-repository.ts:88:
> api\src\cosmos\catalogue-repository.ts:89:  async createService(body: CreateServiceBody, uid: string): 
Promise<Service> {
> api\src\cosmos\catalogue-repository.ts:90:    const doc: Service = { ...body, isActive: true, updatedBy: uid, 
createdAt: now(), updatedAt: now() };
  api\src\cosmos\catalogue-repository.ts:91:    const { resource } = await this.svcs.items.create<Service>(doc);
  api\src\cosmos\catalogue-repository.ts:92:    return resource!;
  api\src\cosmos\catalogue-repository.ts:94:
> api\src\cosmos\catalogue-repository.ts:95:  async updateService(id: string, body: UpdateServiceBody, uid: string): 
Promise<Service | null> {
  api\src\cosmos\catalogue-repository.ts:96:    const existing = await this.getServiceByIdCrossPartition(id);
  api\src\cosmos\catalogue-repository.ts:97:    if (!existing) return null;
> api\src\cosmos\catalogue-repository.ts:98:    const updated: Service = { ...existing, ...body, id, categoryId: 
existing.categoryId, updatedBy: uid, updatedAt: now() };
  api\src\cosmos\catalogue-repository.ts:99:    const { resource } = await this.svcs.item(id, 
existing.categoryId).replace<Service>(updated);
  api\src\cosmos\catalogue-repository.ts:100:    return resource!;
  api\src\cosmos\catalogue-repository.ts:102:
> api\src\cosmos\catalogue-repository.ts:103:  async toggleService(id: string, uid: string): Promise<Service | null> {
  api\src\cosmos\catalogue-repository.ts:104:    const existing = await this.getServiceByIdCrossPartition(id);
  api\src\cosmos\catalogue-repository.ts:105:    if (!existing) return null;
> api\src\cosmos\catalogue-repository.ts:106:    const updated = { ...existing, isActive: !existing.isActive, 
updatedBy: uid, updatedAt: now() };
  api\src\cosmos\catalogue-repository.ts:107:    const { resource } = await this.svcs.item(id, 
existing.categoryId).replace<Service>(updated);
  api\src\cosmos\catalogue-repository.ts:108:    return resource!;
  api\src\cosmos\client.ts:86:
> api\src\cosmos\client.ts:87:export function getCustomerCreditsContainer(): Container {
> api\src\cosmos\client.ts:88:  return getCosmosClient().database(DB_NAME).container('customer_credits');
  api\src\cosmos\client.ts:89:}
  api\src\cosmos\client.ts:90:
  api\src\cosmos\client.ts:103:/**
> api\src\cosmos\client.ts:104: * E13-S01: Customer credit ledger entries (issued / applied / refunded).
> api\src\cosmos\client.ts:105: * Stored in the existing `customer_credits` container, partitioned by /customerId.
> api\src\cosmos\client.ts:106: * No new container — the original `CustomerCreditDoc` records remain; we add
> api\src\cosmos\client.ts:107: * new `CustomerCreditLedgerDoc` records alongside them with type='CREDIT_APPLIED'.
  api\src\cosmos\client.ts:108: */
> api\src\cosmos\client.ts:109:export function getCustomerCreditLedgerContainer(): Container {
> api\src\cosmos\client.ts:110:  return getCosmosClient().database(DB_NAME).container('customer_credits');
  api\src\cosmos\client.ts:111:}
  api\src\cosmos\client.ts:112:
  api\src\cosmos\client.ts:115: * Separate container so TTL can be set at the container level (86400 s = 24h).
> api\src\cosmos\client.ts:116: * Partitioned by /customerId (same access pattern as credits).
  api\src\cosmos\client.ts:117: */
  api\src\cosmos\client.ts:118:export function getAppliedCreditIdempotencyContainer(): Container {
  api\src\cosmos\client.ts:131:/**
> api\src\cosmos\client.ts:132: * E11-S05b-2: Per-incident AES key docs. Partitioned by /customerId.
  api\src\cosmos\client.ts:133: * defaultTtl=604800 (7 days) set at provisioning time — see 
infra/firebase/sos-audio-lifecycle.json
  api\src\cosmos\client.ts:134: * and docs/runbook.md → "SOS audio retention".
  api\src\cosmos\complaints-repository.ts:144:  sinceIso: string,
> api\src\cosmos\complaints-repository.ts:145:): Promise<Array<{ technicianId: string; count: number }>> {
  api\src\cosmos\complaints-repository.ts:146:  // Full scan bounded by sinceIso; revisit partition key strategy when 
container > pilot scale
  api\src\cosmos\complaints-repository.ts:147:  const query: SqlQuerySpec = {
  api\src\cosmos\complaints-repository.ts:162:    const doc = ComplaintDocSchema.parse(r);
> api\src\cosmos\complaints-repository.ts:163:    counts.set(doc.technicianId, (counts.get(doc.technicianId) ?? 0) + 
1);
  api\src\cosmos\complaints-repository.ts:164:  }
  api\src\cosmos\complaints-repository.ts:165:
  api\src\cosmos\complaints-repository.ts:167:    .filter(([, count]) => count >= 3)
> api\src\cosmos\complaints-repository.ts:168:    .map(([technicianId, count]) => ({ technicianId, count }));
  api\src\cosmos\complaints-repository.ts:169:}
  api\src\cosmos\complaints-repository.ts:170:
> api\src\cosmos\complaints-repository.ts:171:// SEMGREP-JUSTIFIED: cross-partition query; technicianId and bookingId 
are caller-validated
  api\src\cosmos\complaints-repository.ts:172:// (booking ownership checked before call). Not exposed to raw 
user-controlled filters.
  api\src\cosmos\complaints-repository.ts:173:export async function findShieldByTechBooking(
> api\src\cosmos\complaints-repository.ts:174:  technicianId: string,
  api\src\cosmos\complaints-repository.ts:175:  bookingId: string,
  api\src\cosmos\complaints-repository.ts:176:): Promise<ComplaintDoc | null> {
  api\src\cosmos\complaints-repository.ts:180:    .items.query<Record<string, unknown>>({
> api\src\cosmos\complaints-repository.ts:181:      query: `SELECT TOP 1 * FROM c WHERE c.technicianId = @uid AND 
c.orderId = @bookingId AND c.type = @type`,
  api\src\cosmos\complaints-repository.ts:182:      parameters: [
> api\src\cosmos\complaints-repository.ts:183:        { name: '@uid', value: technicianId },
  api\src\cosmos\complaints-repository.ts:184:        { name: '@bookingId', value: bookingId },



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'CLAUDE.md' | Select-Object -Skip 120 -First 30" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 527ms:
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

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
public class TestRegex { public static void main(String[] args) { String[] xs={\"abc\", \"abc\\n\", \"abc\\r\\n\", \"abc\\u0085\"}; for(String s: xs) System.out.println(s.replace(\"\\n\",\"\\\\n\").replace(\"\\r\",\"\\\\r\")+\" -> \"+s.matches(\""'^[a-zA-Z0-9_-]{1,64}$")); }}
'"'@ | Set-Content -LiteralPath \""'$env:TEMP'"\\TestRegex.java\"; javac \""'$env:TEMP'"\\TestRegex.java\"; java -cp \""'$env:TEMP" TestRegex' in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 2493ms:
abc -> true
abc\n -> false
abc\r\n -> false
abc? -> false

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'api/tests/functions/devices.test.ts' | Select-Object -First 90" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 2685ms:
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';

// â”€â”€ Mocks (declared before any module imports) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

vi.mock('../../src/bootstrap.js', () => ({}));

vi.mock('../../src/cosmos/device-token-repository.js', () => ({
  deviceTokenRepo: {
    registerDeviceToken: vi.fn().mockResolvedValue(undefined),
    unregisterDeviceToken: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));

// â”€â”€ Imports (after mocks) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import {
  customerRegisterDeviceHandler,
  customerUnregisterDeviceHandler,
  technicianRegisterDeviceHandler,
  technicianUnregisterDeviceHandler,
  adminRegisterDeviceHandler,
  adminUnregisterDeviceHandler,
} from '../../src/functions/devices.js';
import { deviceTokenRepo } from '../../src/cosmos/device-token-repository.js';
import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';

// â”€â”€ Shared fixtures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const mockCtx = {} as InvocationContext;

/** FCM tokens must be â‰¥100 chars per RegisterDeviceTokenBodySchema */
const VALID_TOKEN = 'x'.repeat(150);
const VALID_PLATFORM = 'android';

const mockCustomer = { customerId: 'cust_123' };
const mockAdmin = { adminId: 'admin_1', role: 'super-admin' as const, sessionId: 'sess_1' };

function makeJsonReq(method: string, url: string, body?: unknown): HttpRequest {
  return new HttpRequest({
    url,
    method,
    ...(body !== undefined ? { body: { string: JSON.stringify(body) }, headers: { 'content-type': 'application/json' } } : {}),
  });
}

function makeReqWithParams(
  method: string,
  url: string,
  params: Record<string, string>,
  body?: unknown,
): HttpRequest {
  const req = new HttpRequest({
    url,
    method,
    ...(body !== undefined ? { body: { string: JSON.stringify(body) }, headers: { 'content-type': 'application/json' } } : {}),
  });
  // HttpRequest.params is populated by the runtime from route bindings;
  // in tests we inject them directly as the admin/detail tests do.
  (req as unknown as { params: Record<string, string> }).params = params;
  return req;
}

// â”€â”€ Customer: POST /v1/devices/register â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('customerRegisterDeviceHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 204 and upserts token on valid body', async () => {
    const req = makeJsonReq('POST', 'http://localhost/', {
      deviceToken: VALID_TOKEN,
      platform: VALID_PLATFORM,
    });
    const res = await customerRegisterDeviceHandler(req, mockCtx, mockCustomer);
    expect(res.status).toBe(204);
    expect(vi.mocked(deviceTokenRepo.registerDeviceToken)).toHaveBeenCalledWith(
      'cust_123', 'customer', VALID_TOKEN, VALID_PLATFORM, undefined,
    );
  });

  it('passes appBuild when provided', async () => {
    const req = makeJsonReq('POST', 'http://localhost/', {
      deviceToken: VALID_TOKEN,
      platform: VALID_PLATFORM,
      appBuild: '2.1.0',

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'api/host.json'; Get-Content -LiteralPath 'api/local.settings.example.json'" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 956ms:
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "excludedTypes": "Request"
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "SSC_FUND_ACCOUNT_ID": "<razorpay-fund-account-id-for-ssc-corpus>",
    "ACS_CONNECTION_STRING": "<azure-communication-services-connection-string>",
    "ACS_SENDER_ADDRESS": "DoNotReply@<domain>.azurecomm.net",
    "SSC_OWNER_EMAIL": "<owner-email@example.com>",
    "COSMOS_CONNECTION_STRING": "<azure-cosmos-db-connection-string>",
    "GROWTHBOOK_API_HOST": "https://cdn.growthbook.io",
    "GROWTHBOOK_CLIENT_KEY": ""
  }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt' | Select-Object -First 140; Get-Content -LiteralPath 'customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt' | Select-Object -Skip 300 -First 50" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 2417ms:
package com.homeservices.customer

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.data.pendingaction.PendingActionStore
import com.homeservices.customer.di.BuildInfoProvider
import com.homeservices.customer.domain.booking.model.PaymentResult
import com.homeservices.customer.domain.consent.IsConsentRequiredUseCase
import com.homeservices.customer.domain.flags.FeatureFlags
import com.homeservices.customer.domain.locale.IsFirstLaunchUseCase
import com.homeservices.customer.navigation.AppNavigation
import com.homeservices.customer.navigation.CustomerRouteResolver
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.razorpay.PaymentData
import com.razorpay.PaymentResultWithDataListener
import com.truecaller.android.sdk.legacy.TruecallerSDK
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.MutableStateFlow
import javax.inject.Inject

/**
 * Entry-point Activity for the customer-app.
 *
 * E11-S01b-1 additions:
 *   - [CustomerRouteResolver] injected to support cold-start tier-ladder navigation.
 *     The resolver is passed to [AppNavigation] which reads [RouteContext] and calls
 *     [TierLadder.resolve] on first composition.
 *   - The cold-start deep-link URI (from the launching [Intent]) is extracted before
 *     [setContent] and forwarded to [AppNavigation] as [initialDeepLink].
 *   - POST_NOTIFICATIONS runtime permission flow is handled inside [AppNavigation]
 *     via [rememberLauncherForActivityResult] â€” see AppNavigation.kt.
 *   - [onNewIntent] override (E11-S01b-1 fix): PendingIntent uses
 *     FLAG_ACTIVITY_SINGLE_TOP | FLAG_ACTIVITY_CLEAR_TOP. Tapping a notification while
 *     MainActivity already exists routes the URI to onNewIntent, not a fresh onCreate.
 *     [deepLinkState] is a [MutableStateFlow] initialised from the cold-start URI;
 *     onNewIntent updates it so AppNavigation's collectAsState observer reacts without
 *     a full Activity recreation.
 *
 * AppNavigation composable signature is NOT changed â€” [routeResolver] and
 * [initialDeepLink] are added as new named parameters with defaults so
 * Stream 2.6 (Sentry breadcrumbs) can rebase without conflicts.
 */
@AndroidEntryPoint
public class MainActivity :
    AppCompatActivity(),
    PaymentResultWithDataListener {
    @Inject public lateinit var buildInfo: BuildInfoProvider

    @Inject public lateinit var sessionManager: SessionManager

    @Inject public lateinit var paymentResultBus: PaymentResultBus

    /**
     * E11-S01b-2: Injected to drive Room-based navigation in [AppNavigation].
     * Replaces the removed PriceApprovalEventBus + RatingPromptEventBus injection.
     */
    @Inject public lateinit var pendingActionStore: PendingActionStore

    @Inject public lateinit var isFirstLaunch: IsFirstLaunchUseCase

    @Inject public lateinit var isConsentRequired: IsConsentRequiredUseCase

    @Inject public lateinit var featureFlags: FeatureFlags

    /** Injected to support cold-start tier-ladder route resolution (E11-S01b-1). */
    @Inject public lateinit var routeResolver: CustomerRouteResolver

    /**
     * Observable deep-link state. Initialised from the cold-start Intent in [onCreate];
     * updated in [onNewIntent] when the Activity is warm-tapped via a single-top
     * PendingIntent. AppNavigation observes this via [collectAsState] so warm-tap
     * notifications navigate correctly without re-creating the Activity.
     */
    public val deepLinkState: MutableStateFlow<String?> = MutableStateFlow(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
        }
        super.onCreate(savedInstanceState)

        // Extract cold-start deep-link URI before setContent.
        // homeservices://action/<TYPE>?entityId=<id> deep links from notification tray
        // are forwarded to AppNavigation for TierLadder-aware routing.
        val coldStartDeepLink: String? =
            intent
                ?.data
                ?.takeIf { it.scheme == "homeservices" && it.host == "action" }
                ?.toString()
        deepLinkState.value = coldStartDeepLink

        setContent {
            HomeservicesTheme {
                // Observe deepLinkState so AppNavigation reacts to both cold-start and
                // warm-tap (onNewIntent) deep links.
                val currentDeepLink by deepLinkState.collectAsState()
                AppNavigation(
                    sessionManager = sessionManager,
                    activity = this,
                    pendingActionStore = pendingActionStore,
                    isFirstLaunch = isFirstLaunch,
                    isConsentRequired = isConsentRequired,
                    featureFlags = featureFlags,
                    routeResolver = routeResolver,
                    initialDeepLink = currentDeepLink,
                )
            }
        }
    }

    /**
     * Called when a new Intent arrives for a single-top Activity instance.
     *
     * When [CustomerFirebaseMessagingService] creates a [PendingIntent] with
     * FLAG_ACTIVITY_SINGLE_TOP | FLAG_ACTIVITY_CLEAR_TOP, Android delivers the
     * notification tap here (not to [onCreate]) if MainActivity is already on the
     * back stack. Updating [deepLinkState] ensures AppNavigation navigates to the
     * correct screen without recomposing the entire tree.
     *
     * Non-homeservices:// URIs are ignored â€” they belong to other subsystems
     * (e.g. the DigiLocker callback handled in technician-app's MainActivity).
     */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Store the new intent so that subsequent getIntent() calls return it.
        setIntent(intent)
        val newDeepLink =
            intent.data
                ?.takeIf { it.scheme == "homeservices" && it.host == "action" }
                ?.toString()
        if (newDeepLink != null) {
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
    consentRequired: Boolean,
) {
    LaunchedEffect(initialDeepLink, authState, consentRequired) {
        // Do not process deep links over the consent screen â€” wait until the user has consented.
        if (consentRequired) return@LaunchedEffect
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt' | Select-Object -Skip 130 -First 30" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 2013ms:
     */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Store the new intent so that subsequent getIntent() calls return it.
        setIntent(intent)
        val newDeepLink =
            intent.data
                ?.takeIf { it.scheme == "homeservices" && it.host == "action" }
                ?.toString()
        if (newDeepLink != null) {
            deepLinkState.value = newDeepLink
        }
    }

    override fun onPaymentSuccess(
        razorpayPaymentId: String,
        paymentData: PaymentData?,
    ) {
        paymentResultBus.post(
            PaymentResult.Success(
                paymentId = razorpayPaymentId,
                orderId = paymentData?.orderId ?: "",
                signature = paymentData?.signature ?: "",
            ),
        )
    }

    override fun onPaymentError(
        code: Int,
        description: String?,

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'customer-app/app/src/main/kotlin/com/homeservices/customer/firebase/CustomerFirebaseMessagingService.kt' | Select-Object -Skip 170 -First 170" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1047ms:
            when (channelId) {
                CHANNEL_BOOKINGS, CHANNEL_OFFERS -> NotificationCompat.PRIORITY_HIGH
                else -> NotificationCompat.PRIORITY_DEFAULT
            }
        val notification =
            NotificationCompat
                .Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setContentIntent(tapPi)
                .setAutoCancel(true)
                .setPriority(priority)
                .build()

        nm.notify(deepLinkUri.hashCode(), notification)
    }

    // â”€â”€ Channel mapping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private fun channelIdFor(type: com.homeservices.corenav.PendingActionType): String =
        when (type) {
            com.homeservices.corenav.PendingActionType.ADDON_APPROVAL_REQUESTED ->
                CHANNEL_OFFERS
            com.homeservices.corenav.PendingActionType.RATING_PROMPT_CUSTOMER ->
                CHANNEL_BOOKINGS
            com.homeservices.corenav.PendingActionType.COMPLAINT_UPDATE,
            com.homeservices.corenav.PendingActionType.SUPPORT_FOLLOWUP,
            ->
                CHANNEL_COMPLAINTS
            else -> CHANNEL_SYSTEM
        }

    private fun notificationTitle(type: com.homeservices.corenav.PendingActionType): String =
        when (type) {
            com.homeservices.corenav.PendingActionType.ADDON_APPROVAL_REQUESTED ->
                "Add-on requested"
            com.homeservices.corenav.PendingActionType.RATING_PROMPT_CUSTOMER ->
                "Rate your service"
            com.homeservices.corenav.PendingActionType.COMPLAINT_UPDATE ->
                "Complaint update"
            com.homeservices.corenav.PendingActionType.SUPPORT_FOLLOWUP ->
                "Support update"
            else -> "Notification"
        }

    private fun notificationBody(type: com.homeservices.corenav.PendingActionType): String =
        when (type) {
            com.homeservices.corenav.PendingActionType.ADDON_APPROVAL_REQUESTED ->
                "Your technician has requested an add-on. Tap to approve."
            com.homeservices.corenav.PendingActionType.RATING_PROMPT_CUSTOMER ->
                "How was your experience? Take a moment to rate your service."
            com.homeservices.corenav.PendingActionType.COMPLAINT_UPDATE ->
                "There's an update on your complaint. Tap to view."
            com.homeservices.corenav.PendingActionType.SUPPORT_FOLLOWUP ->
                "Your support ticket has been updated. Tap to view."
            else -> "Tap to open the app."
        }

    // â”€â”€ Slim location-update FCM branch (E17-S02) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    internal fun handleSlimLocationUpdate(data: Map<String, String>) {
        val bookingId = data["bookingId"] ?: return
        val lat = data["lat"]?.toDoubleOrNull()
        val lng = data["lng"]?.toDoubleOrNull()
        val capturedAt = data["capturedAt"]?.toLongOrNull()
        if (lat == null || lng == null || capturedAt == null) return
        locationUpdateEventBus.post(LocationUpdateEvent(bookingId, lat, lng, capturedAt))
    }

    // â”€â”€ No-show credit FCM branch (E13-S03) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    internal fun handleNoShowCredit(data: Map<String, String>) {
        NoShowCreditHandler(this, noShowCreditEventBus).handle(data)
    }

    // â”€â”€ Legacy in-process routing (to be removed in E11-S01b-2) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private fun handleLocationUpdate(
        data: Map<String, String>,
        bookingId: String,
    ) {
        val lat = data["lat"]?.toDoubleOrNull() ?: return
        val lng = data["lng"]?.toDoubleOrNull() ?: return
        val eta = data["etaMinutes"]?.toIntOrNull() ?: 0
        trackingEventBus.post(
            TrackingEvent.LocationUpdate(
                bookingId = bookingId,
                lat = lat,
                lng = lng,
                etaMinutes = eta,
                techName = data["techName"] ?: "",
                techPhotoUrl = data["techPhotoUrl"] ?: "",
            ),
        )
    }

    private fun handleBookingStatusUpdate(
        data: Map<String, String>,
        bookingId: String,
    ) {
        val status = data["status"] ?: return
        trackingEventBus.post(
            TrackingEvent.StatusUpdate(bookingId = bookingId, status = status),
        )
    }

    // â”€â”€ PendingAction builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * Build a [com.homeservices.corenav.PendingAction] from a parsed [NotificationIntent]
     * and the raw FCM data payload.
     *
     * The action ID follows the deterministic compound format:
     * `<TYPE>:<role>:<userId>:<entityType>:<entityId>`
     *
     * This method returns null if the userId is absent (unauthenticated context).
     */
    private fun buildPendingActionFromIntent(
        intent: com.homeservices.corenav.NotificationIntent,
        data: Map<String, String>,
    ): com.homeservices.corenav.PendingAction? {
        val userId = data["userId"] ?: return null
        val actionId =
            data["actionId"]
                ?: "${intent.type.name}:customer:$userId:${intent.type.name.lowercase()}:${intent.entityId}"
        val version = data["version"]?.toLongOrNull() ?: 1L
        val priority =
            runCatching {
                com.homeservices.corenav.PendingActionPriority
                    .valueOf(data["priority"] ?: "NORMAL")
            }.getOrDefault(com.homeservices.corenav.PendingActionPriority.NORMAL)
        val entityType = data["entityType"] ?: intent.type.name.lowercase()
        val nowMs = System.currentTimeMillis()
        val createdAt = data["createdAt"]?.toLongOrNull() ?: nowMs
        val updatedAt = data["updatedAt"]?.toLongOrNull() ?: nowMs
        val expiresAt = data["expiresAt"]?.toLongOrNull()
        val deepLinkUri =
            com.homeservices.corenav.DeepLinkUri
                .build(intent)

        return com.homeservices.corenav.PendingAction(
            id = actionId,
            userId = userId,
            role = "customer",
            type = intent.type,
            entityType = entityType,
            entityId = intent.entityId,
            routeUri = deepLinkUri,
            priority = priority,
            status = com.homeservices.corenav.PendingActionStatus.ACTIVE,
            sourceStatus = data["sourceStatus"],
            version = version,
            createdAt = createdAt,
            updatedAt = updatedAt,
            expiresAt = expiresAt,
            resolvedAt = null,
        )
    }

    public companion object {
        public const val CHANNEL_BOOKINGS: String = "bookings"
        public const val CHANNEL_OFFERS: String = "offers"
        public const val CHANNEL_COMPLAINTS: String = "complaints"
        public const val CHANNEL_CREDITS: String = "credits"
        public const val CHANNEL_SYSTEM: String = "system"

        /** Register all 5 notification channels. Call from Application.onCreate.
         *  Notification channels are an Oreo+ API; the project's minSdk is 26 so the
         *  pre-Oreo guard is unnecessary (lint flags it as ObsoleteSdkInt). */

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'customer-app/app/src/main/kotlin/com/homeservices/customer/firebase/CustomerFirebaseMessagingService.kt' | Select-Object -Skip 80 -First 100" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 726ms:
        //
        // TODO (follow-up): Once the backend adds `userId` to projector FCM payloads,
        // the null check on buildPendingActionFromIntent will always pass and the
        // legacy fallback below can be removed in E11-S01b-2.
        //
        // NestedBlockDepth fix: combine the two null-checks into a single `if` to stay
        // within the allowed depth (default: 4). The `?.let` call for buildPendingAction
        // returns null if userId is absent, producing the same fallthrough as before.
        val intent = router.parseFcmData(data)
        val action = intent?.let { buildPendingActionFromIntent(it, data) }
        if (intent != null && action != null) {
            serviceScope.launch { ingestor.ingest(action) }
            showNotificationForIntent(intent, data)
            // New-router path succeeded â€” also do legacy post for types that
            // foreground UI observes, so both paths are satisfied simultaneously.
            val bookingId = data["bookingId"]
            when (data["type"]) {
                "ADDON_APPROVAL_REQUESTED" -> if (bookingId != null) priceApprovalEventBus.post(bookingId)
                "RATING_PROMPT_CUSTOMER" -> if (bookingId != null) ratingPromptEventBus.post(bookingId)
            }
            return
        }
        // intent is null, or action is null (userId missing from FCM payload) â€”
        // fall through to legacy event-bus routing so the foreground UI is not dropped.

        // Slim LOCATION_UPDATE from E17-S02 periodic location push.
        // Distinguishing guard: capturedAt is present in the slim payload but absent in the
        // legacy transitionStatus-fired LOCATION_UPDATE payload.
        if (data["type"] == "LOCATION_UPDATE" && data["capturedAt"] != null) {
            handleSlimLocationUpdate(data)
            return
        }

        // NO_SHOW_CREDIT_ISSUED does not require a bookingId â€” handle it before the
        // legacy gate so it is never dropped by the `?: return` guard below.
        if (data["type"] == "NO_SHOW_CREDIT_ISSUED") {
            handleNoShowCredit(data)
            return
        }

        // Legacy in-process routing (unchanged; removed in E11-S01b-2).
        // Also reached as a fallback when router parsed an intent but userId was absent.
        val bookingId = data["bookingId"] ?: return
        when (data["type"]) {
            "ADDON_APPROVAL_REQUESTED" -> priceApprovalEventBus.post(bookingId)
            "RATING_PROMPT_CUSTOMER" -> ratingPromptEventBus.post(bookingId)
            "LOCATION_UPDATE" -> handleLocationUpdate(data, bookingId)
            "BOOKING_STATUS_UPDATE" -> handleBookingStatusUpdate(data, bookingId)
        }
    }

    override fun onNewToken(token: String) {
        serviceScope.launch { deviceTokenRegistrar.register() }
    }

    public override fun onDestroy(): Unit {
        super.onDestroy()
        serviceScope.cancel()
    }

    // â”€â”€ Notification tray builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private fun showNotificationForIntent(
        intent: com.homeservices.corenav.NotificationIntent,
        data: Map<String, String>,
    ) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = channelIdFor(intent.type)

        val deepLinkUri =
            com.homeservices.corenav.DeepLinkUri
                .build(intent)
        val tapIntent =
            Intent(Intent.ACTION_VIEW).apply {
                setData(android.net.Uri.parse(deepLinkUri))
                setClass(this@CustomerFirebaseMessagingService, MainActivity::class.java)
                addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
        val tapPi =
            PendingIntent.getActivity(
                this,
                deepLinkUri.hashCode(),
                tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

        val title = data["title"] ?: notificationTitle(intent.type)
        val body = data["body"] ?: notificationBody(intent.type)

        val priority =
            when (channelId) {
                CHANNEL_BOOKINGS, CHANNEL_OFFERS -> NotificationCompat.PRIORITY_HIGH
                else -> NotificationCompat.PRIORITY_DEFAULT
            }
        val notification =
            NotificationCompat
                .Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'customer-app/app/src/main/kotlin' -Include '*.kt' | Select-String -Pattern 'priceApprovalEventBus|ratingPromptEventBus|PriceApprovalEventBus|RatingPromptEventBus' -Context 1,3" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 709ms:

  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\PriceApprovalEventBus.kt:9:@Singleton
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\PriceApprovalEventBus.kt:10:public class 
PriceApprovalEventBus
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\PriceApprovalEventBus.kt:11:    @Inject
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\PriceApprovalEventBus.kt:12:    
constructor() {
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\PriceApprovalEventBus.kt:13:        private 
val _events = MutableSharedFlow<String>(extraBufferCapacity = 1)
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\rating\RatingPromptEventBus.kt:9:@Singleton
> customer-app\app\src\main\kotlin\com\homeservices\customer\data\rating\RatingPromptEventBus.kt:10:public class 
RatingPromptEventBus
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\rating\RatingPromptEventBus.kt:11:    @Inject
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\rating\RatingPromptEventBus.kt:12:    constructor() {
  customer-app\app\src\main\kotlin\com\homeservices\customer\data\rating\RatingPromptEventBus.kt:13:        private 
val _events = MutableSharedFlow<String>(extraBufferCapacity = 1)
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:12:import 
com.homeservices.customer.MainActivity
> customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:13:import 
com.homeservices.customer.data.booking.PriceApprovalEventBus
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:14:import 
com.homeservices.customer.data.device.DeviceTokenRegistrar
> customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:15:import 
com.homeservices.customer.data.rating.RatingPromptEventBus
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:16:import 
com.homeservices.customer.data.tracking.LocationUpdateEvent
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:17:import 
com.homeservices.customer.data.tracking.LocationUpdateEventBus
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:18:import 
com.homeservices.customer.data.tracking.TrackingEvent
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:50:public 
class CustomerFirebaseMessagingService : FirebaseMessagingService() {
> customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:51:    
@Inject public lateinit var priceApprovalEventBus: PriceApprovalEventBus
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:52:
> customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:53:    
@Inject public lateinit var ratingPromptEventBus: RatingPromptEventBus
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:54:
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:55:    
@Inject public lateinit var trackingEventBus: TrackingEventBus
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:56:
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:97:          
  when (data["type"]) {
> customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:98:          
      "ADDON_APPROVAL_REQUESTED" -> if (bookingId != null) priceApprovalEventBus.post(bookingId)
> customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:99:          
      "RATING_PROMPT_CUSTOMER" -> if (bookingId != null) ratingPromptEventBus.post(bookingId)
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:100:         
   }
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:101:         
   return
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:102:        }
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:124:        
when (data["type"]) {
> customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:125:         
   "ADDON_APPROVAL_REQUESTED" -> priceApprovalEventBus.post(bookingId)
> customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:126:         
   "RATING_PROMPT_CUSTOMER" -> ratingPromptEventBus.post(bookingId)
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:127:         
   "LOCATION_UPDATE" -> handleLocationUpdate(data, bookingId)
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:128:         
   "BOOKING_STATUS_UPDATE" -> handleBookingStatusUpdate(data, bookingId)
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt:129:        }
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\FcmLegacyFallback.kt:19: *   1. Remove 
FcmLegacyFallback.kt.
> customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\FcmLegacyFallback.kt:20: *   2. Delete the 
legacy event-bus injection (@Inject priceApprovalEventBus,
> customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\FcmLegacyFallback.kt:21: *      
ratingPromptEventBus) from CustomerFirebaseMessagingService.
> customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\FcmLegacyFallback.kt:22: *   3. Delete 
PriceApprovalEventBus and RatingPromptEventBus classes.
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\FcmLegacyFallback.kt:23: * AppNavigation already 
uses Room observation (E11-S01b-2) and is unaffected.
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\FcmLegacyFallback.kt:24: *
  customer-app\app\src\main\kotlin\com\homeservices\customer\firebase\FcmLegacyFallback.kt:25: * @param fcmType the 
raw `type` string from the FCM data payload, or null if absent.
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:69: *
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:70: * E11-S01b-2: 
PriceApprovalEventBus and RatingPromptEventBus parameters removed.
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:71: * Navigation is now 
driven by Room-observed [PendingActionStore] rows via
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:72: * 
[PendingActionsNavEffect]. The FCM service still posts to the legacy event buses
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\AppNavigation.kt:73: * as a fallback (see 
[CustomerFirebaseMessagingService]), but AppNavigation no
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:16: * navigation 
from Room-observed [PendingAction] rows, replacing the legacy
> customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:17: * 
[PriceApprovalEventBus] and [RatingPromptEventBus] approach.
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:18: *
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:19: * SEC-04: 
[entityId] is validated against [ENTITY_ID_PATTERN] before use. Payloads
  customer-app\app\src\main\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt:20: * with 
traversal or special characters are rejected with a Sentry breadcrumb.
  customer-app\app\src\main\kotlin\com\homeservices\customer\MainActivity.kt:62:     * E11-S01b-2: Injected to drive 
Room-based navigation in [AppNavigation].
> customer-app\app\src\main\kotlin\com\homeservices\customer\MainActivity.kt:63:     * Replaces the removed 
PriceApprovalEventBus + RatingPromptEventBus injection.
  customer-app\app\src\main\kotlin\com\homeservices\customer\MainActivity.kt:64:     */
  customer-app\app\src\main\kotlin\com\homeservices\customer\MainActivity.kt:65:    @Inject public lateinit var 
pendingActionStore: PendingActionStore
  customer-app\app\src\main\kotlin\com\homeservices\customer\MainActivity.kt:66:



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'api/src/functions/trigger-projector-ratings.ts' | Select-Object -First 90" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 811ms:
/**
 * E11-S02 â€” Ratings source adapter (change-feed projector).
 *
 * Triggers: ratings container change feed.
 * Emits: RATING_RECEIVED (to the technician when a customer submits a rating)
 *
 * STRICT ORDERING: upsertAction MUST be called before emitFcmForAction.
 */

import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import {
  upsertAction,
  resolveAction,
  emitFcmForAction,
  buildPendingActionId,
} from '../services/pending-action-projector.js';
import type { RatingDoc } from '../schemas/rating.js';
import { isRetryableCosmosError } from '../shared/cosmos-errors.js';

const RATING_RECEIVED_EXPIRY_MS = 7 * 24 * 60 * 60 * 1_000; // 7 days

/**
 * Derive stable expiry from a source ISO timestamp + window.
 * customerSubmittedAt is stable: same rating replay â†’ same expiresAt â†’ no-op.
 */
function stableExpiryFrom(sourceIso: string, windowMs: number): string {
  return new Date(new Date(sourceIso).getTime() + windowMs).toISOString();
}

/**
 * Exported for unit testing without Azure Functions runtime.
 */
export async function processRatingChangeFeedDoc(
  doc: Partial<RatingDoc> & { id: string },
  _ctx?: InvocationContext,
): Promise<void> {
  const { id: ratingId, technicianId, customerId, bookingId, customerOverall, customerSubmittedAt } = doc;

  if (!technicianId || !customerId || !customerOverall || !customerSubmittedAt) {
    // Rating not yet submitted by customer â€” skip
    return;
  }

  // Emit RATING_RECEIVED to the technician.
  // expiresAt derived from customerSubmittedAt (stable source timestamp) so replays
  // produce the same value and are correctly identified as no-ops.
  const actionId = buildPendingActionId('RATING_RECEIVED', technicianId, ratingId);
  const { doc: upserted, noOp } = await upsertAction({
    id: actionId,
    userId: technicianId,
    type: 'RATING_RECEIVED',
    role: 'technician',
    sourceId: ratingId,
    expiresAt: stableExpiryFrom(customerSubmittedAt, RATING_RECEIVED_EXPIRY_MS),
    priority: 10,
    payload: {
      ratingId,
      customerId,
      overall: customerOverall,
      submittedAt: customerSubmittedAt,
    },
  });

  if (!noOp) {
    // STRICT: upsertAction THEN emitFcmForAction
    await emitFcmForAction(upserted, 'ratings');
  }

  // Resolve the customer's RATING_PROMPT_CUSTOMER action so they no longer see the
  // rating prompt after they have already submitted their rating. The action id is
  // deterministically keyed on the bookingId (same scheme as the bookings projector).
  if (bookingId) {
    const promptActionId = buildPendingActionId('RATING_PROMPT_CUSTOMER', customerId, bookingId);
    await resolveAction(promptActionId, customerId);
  }
}

// â”€â”€ Azure Functions trigger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.cosmosDB('triggerProjectorRatings', {
  connection: 'COSMOS_CONNECTION_STRING',
  databaseName: '%COSMOS_DATABASE%',
  containerName: 'ratings',
  leaseContainerName: 'pending_actions_ratings_leases',
  createLeaseContainerIfNotExists: false,
  handler: async (documents: unknown[], ctx: InvocationContext) => {
    const docs = documents as Array<Partial<RatingDoc> & { id: string }>;
    for (const doc of docs) {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint4' diff --check 6246eb259e9e277590b1661a4355a32d8eca72b4" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 740ms:
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -Path 'technician-app/app/src/main/kotlin' -Include '*.kt' | Select-String -Pattern 'unregisterDevice|devices/\\{deviceToken\\}|DeviceApi' -Context 2,4" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1051ms:

  technician-app\app\src\main\kotlin\com\homeservices\technician\data\auth\di\AuthModule.kt:9:import 
com.google.firebase.messaging.FirebaseMessaging
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\auth\di\AuthModule.kt:10:import 
com.homeservices.technician.data.auth.SessionPrefsMigrator
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\auth\di\AuthModule.kt:11:import 
com.homeservices.technician.data.device.DeviceApi
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\auth\di\AuthModule.kt:12:import dagger.Module
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\auth\di\AuthModule.kt:13:import dagger.Provides
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\auth\di\AuthModule.kt:14:import 
dagger.hilt.InstallIn
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\auth\di\AuthModule.kt:15:import 
dagger.hilt.android.qualifiers.ApplicationContext
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\auth\di\AuthModule.kt:31:    @Provides
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\auth\di\AuthModule.kt:32:    @Singleton
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\auth\di\AuthModule.kt:33:    internal fun 
provideDeviceApi(retrofit: Retrofit): DeviceApi = retrofit.create(DeviceApi::class.java)
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\auth\di\AuthModule.kt:34:
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\auth\di\AuthModule.kt:35:    @Provides
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\auth\di\AuthModule.kt:36:    @Singleton
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\auth\di\AuthModule.kt:37:    public fun 
provideCredentialManager(
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:8:import retrofit2.http.Path
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:9:
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:10:public interface 
DeviceApi {
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:11:    
@POST("v1/technician/devices/register")
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:12:    public suspend fun 
registerToken(
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:13:        @Body body: 
RegisterDeviceTokenRequest,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:14:    ): Response<Unit>
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:15:
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:16:    
@DELETE("v1/technician/devices/{deviceToken}")
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:17:    public suspend fun 
unregisterToken(
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:18:        
@Path("deviceToken") deviceToken: String,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:19:    ): Response<Unit>
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceApi.kt:20:}
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceTokenRegistrar.kt:21:    @Inject
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceTokenRegistrar.kt:22:    
constructor(
> technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceTokenRegistrar.kt:23:        
private val api: DeviceApi,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceTokenRegistrar.kt:24:        
private val messaging: FirebaseMessaging,
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceTokenRegistrar.kt:25:    ) {
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceTokenRegistrar.kt:26:        /**
  technician-app\app\src\main\kotlin\com\homeservices\technician\data\device\DeviceTokenRegistrar.kt:27:         * 
Fetches the current FCM token and POSTs it to the server.



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path 'api/src/functions/bookings.ts' -Pattern 'preGeneratedBookingId|randomUUID\\(' -Context 2,3" in C:\Alok\Business Projects\Urbanclap-sprint4
 succeeded in 1008ms:

  api\src\functions\bookings.ts:260:
  api\src\functions\bookings.ts:261:  if (parsed.data.paymentMethod === 'CASH_ON_SERVICE') {
> api\src\functions\bookings.ts:262:    const cashOrderId = `cash_${randomUUID()}`;
  api\src\functions\bookings.ts:263:    const booking = await bookingRepo.createPending(
  api\src\functions\bookings.ts:264:      parsed.data,
  api\src\functions\bookings.ts:265:      customer.customerId,
  api\src\functions\bookings.ts:321:
  api\src\functions\bookings.ts:322:  if (!hasRazorpayCredentials()) {
> api\src\functions\bookings.ts:323:    const manualOrderId = `manual_${randomUUID()}`;
  api\src\functions\bookings.ts:324:    const manualRequest = { ...parsed.data, paymentMethod: 'CASH_ON_SERVICE' as 
const };
  api\src\functions\bookings.ts:325:    const booking = await bookingRepo.createPending(
  api\src\functions\bookings.ts:326:      manualRequest,
  api\src\functions\bookings.ts:358:  // Pre-generate booking ID so we can embed it in Razorpay notes for the fast 
path.
  api\src\functions\bookings.ts:359:  // The webhook can then do a cheap point-read (getById) instead of a 
cross-partition scan.
> api\src\functions\bookings.ts:360:  const preGeneratedBookingId = randomUUID();
  api\src\functions\bookings.ts:361:
  api\src\functions\bookings.ts:362:  // E13-S01 (P1-6): Determine intended credit amount WITHOUT writing to the 
ledger yet.
  api\src\functions\bookings.ts:363:  // The actual ledger CREDIT_APPLIED entry is written in the Razorpay webhook 
(payment.captured),
  api\src\functions\bookings.ts:382:  // P1-5: Credit covers 100% — skip Razorpay, mark PAID directly
  api\src\functions\bookings.ts:383:  if (payableAmount <= 0 && pendingCreditAmount > 0) {
> api\src\functions\bookings.ts:384:    const fullCreditOrderId = `credit_${randomUUID()}`;
  api\src\functions\bookings.ts:385:    const fullCreditCreditOptions: BookingCreateCreditOptions = {
  api\src\functions\bookings.ts:386:      pendingCreditAmountInPaise: pendingCreditAmount,
  api\src\functions\bookings.ts:387:      pendingCreditIdempotencyKey: idempotencyKey,
  api\src\functions\bookings.ts:393:      service.basePrice,
  api\src\functions\bookings.ts:394:      bookingMetadata(customer, service.name),
> api\src\functions\bookings.ts:395:      preGeneratedBookingId,
  api\src\functions\bookings.ts:396:      fullCreditCreditOptions,
  api\src\functions\bookings.ts:397:    );
  api\src\functions\bookings.ts:398:
  api\src\functions\bookings.ts:503:      const reserveResult = await customerCreditLedgerRepo.reserveCredit(
  api\src\functions\bookings.ts:504:        customer.customerId,
> api\src\functions\bookings.ts:505:        preGeneratedBookingId,
  api\src\functions\bookings.ts:506:        pendingCreditAmount,
  api\src\functions\bookings.ts:507:        idempotencyKey,
  api\src\functions\bookings.ts:508:      );
  api\src\functions\bookings.ts:513:        console.info('[createBooking] credit reservation already exists — 
idempotent replay', {
  api\src\functions\bookings.ts:514:          customerId: customer.customerId,
> api\src\functions\bookings.ts:515:          bookingId: preGeneratedBookingId,
  api\src\functions\bookings.ts:516:        });
  api\src\functions\bookings.ts:517:        // Fall through to create the Razorpay order (or it may already exist; 
Razorpay is
  api\src\functions\bookings.ts:518:        // idempotent on order ID because the receipt is unique per attempt — 
acceptable).
  api\src\functions\bookings.ts:541:      currency: 'INR',
  api\src\functions\bookings.ts:542:      receipt: makeRazorpayReceipt(customer.customerId),
> api\src\functions\bookings.ts:543:      notes: { bookingId: preGeneratedBookingId },
  api\src\functions\bookings.ts:544:    });
  api\src\functions\bookings.ts:545:  } catch (err) {
  api\src\functions\bookings.ts:546:    Sentry.captureException(err);
  api\src\functions\bookings.ts:572:    service.basePrice,
  api\src\functions\bookings.ts:573:    bookingMetadata(customer, service.name),
> api\src\functions\bookings.ts:574:    preGeneratedBookingId,
  api\src\functions\bookings.ts:575:    razorpayCreditOptions,
  api\src\functions\bookings.ts:576:  );
  api\src\functions\bookings.ts:577:
  api\src\functions\bookings.ts:634:  if (confirmed.status === 'SEARCHING') {
  api\src\functions\bookings.ts:635:    const _ts = new Date().toISOString();
> api\src\functions\bookings.ts:636:    void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', 
action: 'CUSTOMER_CONFIRMED_PAYMENT', resourceType: 'booking', resourceId: confirmed.id, payload: { bookingId: 
confirmed.id, paymentId: parsed.data.razorpayPaymentId }, timestamp: _ts, partitionKey: _ts.slice(0, 7) 
}).catch(Sentry.captureException);
  api\src\functions\bookings.ts:637:  }
  api\src\functions\bookings.ts:638:
  api\src\functions\bookings.ts:639:  return { status: 200, jsonBody: { bookingId: confirmed.id, status: 
confirmed.status } };



codex
No discrete, actionable regressions were identified in the changed code relative to the base branch.
2026-05-23T02:10:19.593602Z ERROR codex_core::session: failed to record rollout items: thread 019e528c-7ea3-7430-8c6e-0e681d1e285a not found
2026-05-23T02:10:19.764044Z ERROR codex_core::session: failed to record rollout items: thread 019e528c-7d9d-7160-9a61-d516aaebc495 not found
No discrete, actionable regressions were identified in the changed code relative to the base branch.
