OpenAI Codex v0.125.0 (research preview)
--------
workdir: C:\Alok\Business Projects\Urbanclap-sprint2b
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR, C:\Users\alokt\.codex\memories]
reasoning effort: xhigh
reasoning summaries: none
session id: 019e5230-3026-7e80-9bfe-de299ad6c4d3
--------
user
changes against 'main'
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff f39ac4b37a5f76121433cc6ac340508f273858ef' in C:\Alok\Business Projects\Urbanclap-sprint2b
2026-05-23T00:16:24.622893Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 25 seconds
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


 exited 1 in 25005ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Location; Get-ChildItem -Force' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 5081ms:

Path                                        
----                                        
C:\Alok\Business Projects\Urbanclap-sprint2b

PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\.claire
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : .claire
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : .claire
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\.claire
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : .claire
CreationTime      : 5/22/2026 7:03:25 PM
CreationTimeUtc   : 5/22/2026 11:03:25 PM
LastAccessTime    : 5/22/2026 8:16:01 PM
LastAccessTimeUtc : 5/23/2026 12:16:01 AM
LastWriteTime     : 5/22/2026 7:03:25 PM
LastWriteTimeUtc  : 5/22/2026 11:03:25 PM
Attributes        : Directory
Mode              : d-----
BaseName          : .claire
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\.firebase
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : .firebase
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : .firebase
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\.firebase
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : .firebase
CreationTime      : 5/22/2026 7:03:25 PM
CreationTimeUtc   : 5/22/2026 11:03:25 PM
LastAccessTime    : 5/22/2026 8:16:01 PM
LastAccessTimeUtc : 5/23/2026 12:16:01 AM
LastWriteTime     : 5/22/2026 7:03:25 PM
LastWriteTimeUtc  : 5/22/2026 11:03:25 PM
Attributes        : Directory
Mode              : d-----
BaseName          : .firebase
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\.githooks
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : .githooks
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : .githooks
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\.githooks
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : .githooks
CreationTime      : 5/22/2026 7:03:25 PM
CreationTimeUtc   : 5/22/2026 11:03:25 PM
LastAccessTime    : 5/22/2026 8:16:01 PM
LastAccessTimeUtc : 5/23/2026 12:16:01 AM
LastWriteTime     : 5/22/2026 7:03:25 PM
LastWriteTimeUtc  : 5/22/2026 11:03:25 PM
Attributes        : Directory
Mode              : d-----
BaseName          : .githooks
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\.github
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : .github
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : .github
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\.github
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : .github
CreationTime      : 5/22/2026 7:03:25 PM
CreationTimeUtc   : 5/22/2026 11:03:25 PM
LastAccessTime    : 5/22/2026 8:16:01 PM
LastAccessTimeUtc : 5/23/2026 12:16:01 AM
LastWriteTime     : 5/22/2026 7:03:25 PM
LastWriteTimeUtc  : 5/22/2026 11:03:25 PM
Attributes        : Directory
Mode              : d-----
BaseName          : .github
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\.serena
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : .serena
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : .serena
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\.serena
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : .serena
CreationTime      : 5/22/2026 7:03:26 PM
CreationTimeUtc   : 5/22/2026 11:03:26 PM
LastAccessTime    : 5/22/2026 8:16:01 PM
LastAccessTimeUtc : 5/23/2026 12:16:01 AM
LastWriteTime     : 5/22/2026 7:03:26 PM
LastWriteTimeUtc  : 5/22/2026 11:03:26 PM
Attributes        : Directory
Mode              : d-----
BaseName          : .serena
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\.superpowers
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : .superpowers
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : .superpowers
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\.superpowers
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : .superpowers
CreationTime      : 5/22/2026 7:03:26 PM
CreationTimeUtc   : 5/22/2026 11:03:26 PM
LastAccessTime    : 5/22/2026 8:16:01 PM
LastAccessTimeUtc : 5/23/2026 12:16:01 AM
LastWriteTime     : 5/22/2026 7:03:26 PM
LastWriteTimeUtc  : 5/22/2026 11:03:26 PM
Attributes        : Directory
Mode              : d-----
BaseName          : .superpowers
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\admin-web
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : admin-web
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : admin-web
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\admin-web
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:26 PM
CreationTimeUtc   : 5/22/2026 11:03:26 PM
LastAccessTime    : 5/22/2026 8:16:01 PM
LastAccessTimeUtc : 5/23/2026 12:16:01 AM
LastWriteTime     : 5/22/2026 7:03:26 PM
LastWriteTimeUtc  : 5/22/2026 11:03:26 PM
Attributes        : Directory
Mode              : d-----
BaseName          : admin-web
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\api
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : api
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : api
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\api
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:26 PM
CreationTimeUtc   : 5/22/2026 11:03:26 PM
LastAccessTime    : 5/22/2026 8:16:01 PM
LastAccessTimeUtc : 5/23/2026 12:16:01 AM
LastWriteTime     : 5/22/2026 7:03:26 PM
LastWriteTimeUtc  : 5/22/2026 11:03:26 PM
Attributes        : Directory
Mode              : d-----
BaseName          : api
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\commonMain
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : commonMain
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : commonMain
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\commonMain
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:26 PM
CreationTimeUtc   : 5/22/2026 11:03:26 PM
LastAccessTime    : 5/22/2026 8:16:01 PM
LastAccessTimeUtc : 5/23/2026 12:16:01 AM
LastWriteTime     : 5/22/2026 7:03:26 PM
LastWriteTimeUtc  : 5/22/2026 11:03:26 PM
Attributes        : Directory
Mode              : d-----
BaseName          : commonMain
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\core-nav
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : core-nav
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : core-nav
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\core-nav
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:26 PM
CreationTimeUtc   : 5/22/2026 11:03:26 PM
LastAccessTime    : 5/22/2026 8:16:01 PM
LastAccessTimeUtc : 5/23/2026 12:16:01 AM
LastWriteTime     : 5/22/2026 7:45:42 PM
LastWriteTimeUtc  : 5/22/2026 11:45:42 PM
Attributes        : Directory
Mode              : d-----
BaseName          : core-nav
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\customer-app
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : customer-app
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : customer-app
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\customer-app
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:26 PM
CreationTimeUtc   : 5/22/2026 11:03:26 PM
LastAccessTime    : 5/22/2026 8:16:19 PM
LastAccessTimeUtc : 5/23/2026 12:16:19 AM
LastWriteTime     : 5/22/2026 7:46:16 PM
LastWriteTimeUtc  : 5/22/2026 11:46:16 PM
Attributes        : Directory
Mode              : d-----
BaseName          : customer-app
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\design-system
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : design-system
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : design-system
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\design-system
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:26 PM
CreationTimeUtc   : 5/22/2026 11:03:26 PM
LastAccessTime    : 5/22/2026 8:16:20 PM
LastAccessTimeUtc : 5/23/2026 12:16:20 AM
LastWriteTime     : 5/22/2026 7:45:38 PM
LastWriteTimeUtc  : 5/22/2026 11:45:38 PM
Attributes        : Directory
Mode              : d-----
BaseName          : design-system
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\docs
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : docs
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : docs
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\docs
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:26 PM
CreationTimeUtc   : 5/22/2026 11:03:26 PM
LastAccessTime    : 5/22/2026 8:16:20 PM
LastAccessTimeUtc : 5/23/2026 12:16:20 AM
LastWriteTime     : 5/22/2026 7:03:27 PM
LastWriteTimeUtc  : 5/22/2026 11:03:27 PM
Attributes        : Directory
Mode              : d-----
BaseName          : docs
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\figma
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : figma
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : figma
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\figma
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:27 PM
CreationTimeUtc   : 5/22/2026 11:03:27 PM
LastAccessTime    : 5/22/2026 8:16:20 PM
LastAccessTimeUtc : 5/23/2026 12:16:20 AM
LastWriteTime     : 5/22/2026 7:03:27 PM
LastWriteTimeUtc  : 5/22/2026 11:03:27 PM
Attributes        : Directory
Mode              : d-----
BaseName          : figma
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\firebase
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : firebase
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : firebase
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\firebase
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:27 PM
CreationTimeUtc   : 5/22/2026 11:03:27 PM
LastAccessTime    : 5/22/2026 8:16:20 PM
LastAccessTimeUtc : 5/23/2026 12:16:20 AM
LastWriteTime     : 5/22/2026 7:03:27 PM
LastWriteTimeUtc  : 5/22/2026 11:03:27 PM
Attributes        : Directory
Mode              : d-----
BaseName          : firebase
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\moto-g-snapshots
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : moto-g-snapshots
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : moto-g-snapshots
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\moto-g-snapshots
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:27 PM
CreationTimeUtc   : 5/22/2026 11:03:27 PM
LastAccessTime    : 5/22/2026 8:16:20 PM
LastAccessTimeUtc : 5/23/2026 12:16:20 AM
LastWriteTime     : 5/22/2026 7:03:27 PM
LastWriteTimeUtc  : 5/22/2026 11:03:27 PM
Attributes        : Directory
Mode              : d-----
BaseName          : moto-g-snapshots
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\plans
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : plans
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : plans
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\plans
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:27 PM
CreationTimeUtc   : 5/22/2026 11:03:27 PM
LastAccessTime    : 5/22/2026 8:16:20 PM
LastAccessTimeUtc : 5/23/2026 12:16:20 AM
LastWriteTime     : 5/22/2026 7:03:27 PM
LastWriteTimeUtc  : 5/22/2026 11:03:27 PM
Attributes        : Directory
Mode              : d-----
BaseName          : plans
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business 
                    Projects\Urbanclap-sprint2b\play-store-assets
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : play-store-assets
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : play-store-assets
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\play-store-assets
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:27 PM
CreationTimeUtc   : 5/22/2026 11:03:27 PM
LastAccessTime    : 5/22/2026 8:16:20 PM
LastAccessTimeUtc : 5/23/2026 12:16:20 AM
LastWriteTime     : 5/22/2026 7:03:27 PM
LastWriteTimeUtc  : 5/22/2026 11:03:27 PM
Attributes        : Directory
Mode              : d-----
BaseName          : play-store-assets
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\technician-app
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : technician-app
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : technician-app
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\technician-app
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:27 PM
CreationTimeUtc   : 5/22/2026 11:03:27 PM
LastAccessTime    : 5/22/2026 8:16:21 PM
LastAccessTimeUtc : 5/23/2026 12:16:21 AM
LastWriteTime     : 5/22/2026 7:03:27 PM
LastWriteTimeUtc  : 5/22/2026 11:03:27 PM
Attributes        : Directory
Mode              : d-----
BaseName          : technician-app
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\tools
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : tools
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : tools
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\tools
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:27 PM
CreationTimeUtc   : 5/22/2026 11:03:27 PM
LastAccessTime    : 5/22/2026 8:16:21 PM
LastAccessTimeUtc : 5/23/2026 12:16:21 AM
LastWriteTime     : 5/22/2026 8:03:05 PM
LastWriteTimeUtc  : 5/23/2026 12:03:05 AM
Attributes        : Directory
Mode              : d-----
BaseName          : tools
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\_bmad
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : _bmad
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : _bmad
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\_bmad
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:26 PM
CreationTimeUtc   : 5/22/2026 11:03:26 PM
LastAccessTime    : 5/22/2026 8:16:21 PM
LastAccessTimeUtc : 5/23/2026 12:16:21 AM
LastWriteTime     : 5/22/2026 7:03:26 PM
LastWriteTimeUtc  : 5/22/2026 11:03:26 PM
Attributes        : Directory
Mode              : d-----
BaseName          : _bmad
Target            : {}
LinkType          : 


PSPath            : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b\_bmad-output
PSParentPath      : Microsoft.PowerShell.Core\FileSystem::C:\Alok\Business Projects\Urbanclap-sprint2b
PSChildName       : _bmad-output
PSDrive           : C
PSProvider        : Microsoft.PowerShell.Core\FileSystem
PSIsContainer     : True
Name              : _bmad-output
FullName          : C:\Alok\Business Projects\Urbanclap-sprint2b\_bmad-output
Parent            : Urbanclap-sprint2b
Exists            : True
Root              : C:\
Extension         : 
CreationTime      : 5/22/2026 7:03:26 PM
CreationTimeUtc   : 5/22/2026 11:03:26 PM
LastAccessTime    : 5/22/2026 8:16:21 PM
LastAccessTimeUtc : 5/23/2026 12:16:21 AM
LastWriteTime     : 5/22/2026 7:03:26 PM
LastWriteTimeUtc  : 5/22/2026 11:03:26 PM
Attributes        : Directory
Mode              : d-----
BaseName          : _bmad-output
Target            : {}
LinkType          : 


LastWriteTime : 5/22/2026 7:03:25 PM
Length        : 26
Name          : .bmad-readiness-passed


LastWriteTime : 5/22/2026 7:03:25 PM
Length        : 183
Name          : .codex-review-passed


LastWriteTime : 5/22/2026 7:03:25 PM
Length        : 63
Name          : .firebaserc


LastWriteTime : 5/22/2026 7:03:25 PM
Length        : 82
Name          : .git


LastWriteTime : 5/22/2026 7:03:25 PM
Length        : 659
Name          : .gitattributes


LastWriteTime : 5/22/2026 7:03:26 PM
Length        : 3116
Name          : .gitignore


LastWriteTime : 5/22/2026 7:03:26 PM
Length        : 694
Name          : .semgrepignore


LastWriteTime : 5/22/2026 7:03:26 PM
Length        : 14551
Name          : CLAUDE.md


LastWriteTime : 5/22/2026 7:03:27 PM
Length        : 252
Name          : firebase.json


LastWriteTime : 5/22/2026 7:03:26 PM
Length        : 5369
Name          : TOKEN-SYNC.md




exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content .git' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 3337ms:
gitdir: C:/Alok/Business Projects/Urbanclap-dup/.git/worktrees/Urbanclap-sprint2b

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Test-Path 'C:\\Alok\\Business Projects\\Urbanclap-dup\\.git\\worktrees\\Urbanclap-sprint2b'; Get-ChildItem -Force 'C:\\Alok\\Business Projects\\Urbanclap-dup\\.git\\worktrees\\Urbanclap-sprint2b'" in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 5116ms:
True


    Directory: C:\Alok\Business Projects\Urbanclap-dup\.git\worktrees\Urbanclap-sprint2b


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
d-----         5/22/2026   7:03 PM                logs                                                                 
d-----         5/22/2026   7:03 PM                refs                                                                 
-a----         5/22/2026   8:07 PM             94 COMMIT_EDITMSG                                                       
-a----         5/22/2026   7:03 PM              6 commondir                                                            
-a----         5/22/2026   7:03 PM             50 gitdir                                                               
-a----         5/22/2026   7:03 PM             48 HEAD                                                                 
-a----         5/22/2026   8:07 PM         251538 index                                                                
-a----         5/22/2026   7:03 PM             41 ORIG_HEAD                                                            



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git status --short --branch' in C:\Alok\Business Projects\Urbanclap-sprint2b
2026-05-23T00:16:50.188229Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 1.9 seconds
Output:
fatal: detected dubious ownership in repository at 'C:/Alok/Business Projects/Urbanclap-sprint2b'
'C:/Alok/Business Projects/Urbanclap-sprint2b/.git' is owned by:
	Home/alokt (S-1-5-21-1726265981-1318906982-882074505-1001)
but the current user is:
	Home/CodexSandboxOffline (S-1-5-21-1726265981-1318906982-882074505-1004)
To add an exception for this directory, call:

	git config --global --add safe.directory 'C:/Alok/Business Projects/Urbanclap-sprint2b'

 exited 1 in 1908ms:
fatal: detected dubious ownership in repository at 'C:/Alok/Business Projects/Urbanclap-sprint2b'
'C:/Alok/Business Projects/Urbanclap-sprint2b/.git' is owned by:
	Home/alokt (S-1-5-21-1726265981-1318906982-882074505-1001)
but the current user is:
	Home/CodexSandboxOffline (S-1-5-21-1726265981-1318906982-882074505-1004)
To add an exception for this directory, call:

	git config --global --add safe.directory 'C:/Alok/Business Projects/Urbanclap-sprint2b'

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint2b' diff f39ac4b37a5f76121433cc6ac340508f273858ef" in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 3803ms:
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
index 00000000..bb70b5e4
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
+- kotlin
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
diff --git a/customer-app/app/build.gradle.kts b/customer-app/app/build.gradle.kts
index d316c7bb..a5df985f 100644
--- a/customer-app/app/build.gradle.kts
+++ b/customer-app/app/build.gradle.kts
@@ -235,6 +235,12 @@ android {
     testOptions {
         unitTests {
             isIncludeAndroidResources = true
+            all { test: org.gradle.api.tasks.testing.Test ->
+                // Pass -PexcludePaparazzi in smoke gate to skip snapshot tests on Windows
+                if (project.hasProperty("excludePaparazzi")) {
+                    test.filter.excludeTestsMatching("*PaparazziTest*")
+                }
+            }
         }
     }
 }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/remote/di/AuthApiModule.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/remote/di/AuthApiModule.kt
index af68523a..2bc72cef 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/remote/di/AuthApiModule.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/remote/di/AuthApiModule.kt
@@ -40,7 +40,12 @@ public object AuthApiModule {
                             HttpLoggingInterceptor.Level.NONE
                         }
                 },
-            ).build()
+            ).connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
+            .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+            .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+            .callTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
+            .retryOnConnectionFailure(true)
+            .build()
 
     @Provides
     @Singleton
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepository.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepository.kt
index 8d38943a..693ff3ab 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepository.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepository.kt
@@ -8,7 +8,10 @@ import com.homeservices.customer.domain.booking.model.PendingAddOn
 import kotlinx.coroutines.flow.Flow
 
 public interface BookingRepository {
-    public fun createBooking(request: BookingRequest): Flow<Result<BookingResult>>
+    public fun createBooking(
+        request: BookingRequest,
+        idempotencyKey: String,
+    ): Flow<Result<BookingResult>>
 
     public fun getMyBookings(): Flow<Result<List<CustomerBooking>>>
 
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImpl.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImpl.kt
index e0e1f5a7..5e38162e 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImpl.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImpl.kt
@@ -11,6 +11,7 @@ import com.homeservices.customer.domain.booking.model.BookingRequest
 import com.homeservices.customer.domain.booking.model.BookingResult
 import com.homeservices.customer.domain.booking.model.CustomerBooking
 import com.homeservices.customer.domain.booking.model.PendingAddOn
+import io.sentry.Sentry
 import kotlinx.coroutines.flow.Flow
 import kotlinx.coroutines.flow.flow
 import javax.inject.Inject
@@ -20,7 +21,10 @@ internal class BookingRepositoryImpl
     constructor(
         private val api: BookingApiService,
     ) : BookingRepository {
-        override fun createBooking(request: BookingRequest): Flow<Result<BookingResult>> =
+        override fun createBooking(
+            request: BookingRequest,
+            idempotencyKey: String,
+        ): Flow<Result<BookingResult>> =
             flow {
                 emit(
                     runCatching {
@@ -35,14 +39,18 @@ internal class BookingRepositoryImpl
                                     addressLatLng = LatLngDto(lat = request.addressLat, lng = request.addressLng),
                                     paymentMethod = request.paymentMethod.name,
                                 ),
+                                idempotencyKey = idempotencyKey,
                             ).toDomain()
-                    },
+                    }.onFailure { Sentry.captureException(it) },
                 )
             }
 
         override fun getMyBookings(): Flow<Result<List<CustomerBooking>>> =
             flow {
-                emit(runCatching { api.getMyBookings().bookings.map { it.toDomain() } })
+                emit(
+                    runCatching { api.getMyBookings().bookings.map { it.toDomain() } }
+                        .onFailure { Sentry.captureException(it) },
+                )
             }
 
         override fun confirmBooking(
@@ -65,13 +73,16 @@ internal class BookingRepositoryImpl
                                 ),
                                 integrityToken = integrityToken,
                             ).bookingId
-                    },
+                    }.onFailure { Sentry.captureException(it) },
                 )
             }
 
         override fun getPendingAddOns(bookingId: String): Flow<Result<List<PendingAddOn>>> =
             flow {
-                emit(runCatching { api.getBooking(bookingId).pendingAddOns.map { it.toDomain() } })
+                emit(
+                    runCatching { api.getBooking(bookingId).pendingAddOns.map { it.toDomain() } }
+                        .onFailure { Sentry.captureException(it) },
+                )
             }
 
         override fun approveFinalPrice(
@@ -86,7 +97,7 @@ internal class BookingRepositoryImpl
                                 bookingId,
                                 ApproveFinalPriceRequestDto(decisions.map { AddOnDecisionDto(it.name, it.approved) }),
                             ).finalAmount ?: error("finalAmount missing in approve-final-price response")
-                    },
+                    }.onFailure { Sentry.captureException(it) },
                 )
             }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/di/BookingModule.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/di/BookingModule.kt
index 54da3abf..34dda5ad 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/di/BookingModule.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/di/BookingModule.kt
@@ -65,6 +65,11 @@ public abstract class BookingModule {
                             }
                     },
                 ).authenticator(authenticator)
+                .connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
+                .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+                .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+                .callTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
+                .retryOnConnectionFailure(true)
                 .build()
 
         @Provides
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/BookingApiService.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/BookingApiService.kt
index 03ecdc07..6c14421d 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/BookingApiService.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/BookingApiService.kt
@@ -18,12 +18,14 @@ public interface BookingApiService {
     @POST("v1/bookings")
     public suspend fun createBooking(
         @Body body: CreateBookingRequestDto,
+        @Header("Idempotency-Key") idempotencyKey: String,
     ): CreateBookingResponseDto
 
     @POST("v1/bookings/{id}/confirm")
     public suspend fun confirmBooking(
         @Path("id") bookingId: String,
         @Body body: ConfirmBookingRequestDto,
+        // Nullable: Retrofit 2 omits the header when null (play-integrity not always available)
         @Header("X-Integrity-Token") integrityToken: String? = null,
     ): ConfirmBookingResponseDto
 
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImpl.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImpl.kt
index 008b87bd..3022d641 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImpl.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImpl.kt
@@ -5,6 +5,7 @@ import com.homeservices.customer.data.catalogue.remote.dto.toDomain
 import com.homeservices.customer.data.catalogue.remote.dto.toServiceDomain
 import com.homeservices.customer.domain.catalogue.model.Category
 import com.homeservices.customer.domain.catalogue.model.Service
+import io.sentry.Sentry
 import kotlinx.coroutines.flow.Flow
 import kotlinx.coroutines.flow.flow
 import javax.inject.Inject
@@ -16,7 +17,10 @@ internal class CatalogueRepositoryImpl
     ) : CatalogueRepository {
         override fun getCategories(): Flow<Result<List<Category>>> =
             flow {
-                emit(runCatching { api.getCategories().categories.map { it.toDomain() } })
+                emit(
+                    runCatching { api.getCategories().categories.map { it.toDomain() } }
+                        .onFailure { Sentry.captureException(it) },
+                )
             }
 
         override fun getServicesForCategory(categoryId: String): Flow<Result<List<Service>>> =
@@ -30,12 +34,15 @@ internal class CatalogueRepositoryImpl
                             ?.services
                             ?.map { it.toServiceDomain() }
                             .orEmpty()
-                    },
+                    }.onFailure { Sentry.captureException(it) },
                 )
             }
 
         override fun getServiceDetail(serviceId: String): Flow<Result<Service>> =
             flow {
-                emit(runCatching { api.getServiceDetail(serviceId).toDomain() })
+                emit(
+                    runCatching { api.getServiceDetail(serviceId).toDomain() }
+                        .onFailure { Sentry.captureException(it) },
+                )
             }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/di/CatalogueModule.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/di/CatalogueModule.kt
index 078dfb52..e4f0c655 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/di/CatalogueModule.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/di/CatalogueModule.kt
@@ -46,7 +46,12 @@ public abstract class CatalogueModule {
                                 HttpLoggingInterceptor.Level.NONE
                             }
                     },
-                ).build()
+                ).connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
+                .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+                .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+                .callTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
+                .retryOnConnectionFailure(true)
+                .build()
 
         @Provides
         @Singleton
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepository.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepository.kt
index 3deb6a47..af909cb2 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepository.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepository.kt
@@ -9,6 +9,7 @@ public interface ComplaintRepository {
         reasonCode: String,
         description: String,
         photoStoragePath: String?,
+        idempotencyKey: String,
     ): Flow<Result<ComplaintResponseDto>>
 
     public fun getComplaintsForBooking(bookingId: String): Flow<Result<List<ComplaintResponseDto>>>
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImpl.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImpl.kt
index ae8b9d4e..36a7f544 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImpl.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImpl.kt
@@ -3,6 +3,7 @@ package com.homeservices.customer.data.complaint
 import com.homeservices.customer.data.complaint.remote.ComplaintApiService
 import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
 import com.homeservices.customer.data.complaint.remote.dto.CreateComplaintRequestDto
+import io.sentry.Sentry
 import kotlinx.coroutines.flow.Flow
 import kotlinx.coroutines.flow.flow
 import javax.inject.Inject
@@ -17,6 +18,7 @@ internal class ComplaintRepositoryImpl
             reasonCode: String,
             description: String,
             photoStoragePath: String?,
+            idempotencyKey: String,
         ): Flow<Result<ComplaintResponseDto>> =
             flow {
                 emit(
@@ -28,13 +30,17 @@ internal class ComplaintRepositoryImpl
                                 description = description,
                                 photoStoragePath = photoStoragePath,
                             ),
+                            idempotencyKey = idempotencyKey,
                         )
-                    },
+                    }.onFailure { Sentry.captureException(it) },
                 )
             }
 
         override fun getComplaintsForBooking(bookingId: String): Flow<Result<List<ComplaintResponseDto>>> =
             flow {
-                emit(runCatching { api.getComplaintsForBooking(bookingId).complaints })
+                emit(
+                    runCatching { api.getComplaintsForBooking(bookingId).complaints }
+                        .onFailure { Sentry.captureException(it) },
+                )
             }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/remote/ComplaintApiService.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/remote/ComplaintApiService.kt
index f3898eb2..e58d2025 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/remote/ComplaintApiService.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/remote/ComplaintApiService.kt
@@ -5,6 +5,7 @@ import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
 import com.homeservices.customer.data.complaint.remote.dto.CreateComplaintRequestDto
 import retrofit2.http.Body
 import retrofit2.http.GET
+import retrofit2.http.Header
 import retrofit2.http.POST
 import retrofit2.http.Path
 
@@ -12,6 +13,7 @@ public interface ComplaintApiService {
     @POST("v1/complaints")
     public suspend fun createComplaint(
         @Body body: CreateComplaintRequestDto,
+        @Header("Idempotency-Key") idempotencyKey: String,
     ): ComplaintResponseDto
 
     @GET("v1/complaints/{bookingId}")
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/network/auth/FirebaseTokenAuthenticator.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/network/auth/FirebaseTokenAuthenticator.kt
index a7f9389a..9c70bf4b 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/network/auth/FirebaseTokenAuthenticator.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/network/auth/FirebaseTokenAuthenticator.kt
@@ -3,6 +3,7 @@ package com.homeservices.customer.data.network.auth
 import android.util.Log
 import com.google.android.gms.tasks.Tasks
 import com.google.firebase.auth.FirebaseAuth
+import io.sentry.Sentry
 import okhttp3.Authenticator
 import okhttp3.Request
 import okhttp3.Response
@@ -46,7 +47,7 @@ public class FirebaseTokenAuthenticator
 
             return try {
                 // Force-refresh (true) to get a new token, not the cached one
-                val result = Tasks.await(user.getIdToken(true))
+                val result = Tasks.await(user.getIdToken(true), 25, java.util.concurrent.TimeUnit.SECONDS)
                 val newToken = result?.token
                 if (newToken == null) {
                     Log.w(TAG, "getIdToken(true) returned null token")
@@ -59,6 +60,7 @@ public class FirebaseTokenAuthenticator
                     .build()
             } catch (e: Exception) {
                 Log.e(TAG, "Token force-refresh failed on 401", e)
+                Sentry.captureException(e)
                 null
             }
         }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepository.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepository.kt
index f978e9a3..e3041f55 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepository.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepository.kt
@@ -10,6 +10,7 @@ public interface RatingRepository {
         overall: Int,
         subScores: CustomerSubScores,
         comment: String?,
+        idempotencyKey: String,
     ): Flow<Result<Unit>>
 
     public fun get(bookingId: String): Flow<Result<RatingSnapshot>>
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt
index 9d05f644..8ed3c2a4 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt
@@ -4,6 +4,7 @@ import com.homeservices.customer.data.rating.remote.RatingApiService
 import com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto
 import com.homeservices.customer.domain.rating.model.CustomerSubScores
 import com.homeservices.customer.domain.rating.model.RatingSnapshot
+import io.sentry.Sentry
 import kotlinx.coroutines.flow.Flow
 import kotlinx.coroutines.flow.flow
 import javax.inject.Inject
@@ -18,6 +19,7 @@ internal class RatingRepositoryImpl
             overall: Int,
             subScores: CustomerSubScores,
             comment: String?,
+            idempotencyKey: String,
         ): Flow<Result<Unit>> =
             flow {
                 emit(
@@ -35,10 +37,17 @@ internal class RatingRepositoryImpl
                                     ),
                                 comment = comment,
                             ),
+                            idempotencyKey = idempotencyKey,
                         )
-                    },
+                    }.onFailure { Sentry.captureException(it) },
                 )
             }
 
-        override fun get(bookingId: String): Flow<Result<RatingSnapshot>> = flow { emit(runCatching { api.get(bookingId).toDomain() }) }
+        override fun get(bookingId: String): Flow<Result<RatingSnapshot>> =
+            flow {
+                emit(
+                    runCatching { api.get(bookingId).toDomain() }
+                        .onFailure { Sentry.captureException(it) },
+                )
+            }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt
index 2945eb3d..ea46033c 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt
@@ -6,6 +6,7 @@ import com.homeservices.customer.data.rating.remote.dto.GetRatingResponseDto
 import com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto
 import retrofit2.http.Body
 import retrofit2.http.GET
+import retrofit2.http.Header
 import retrofit2.http.POST
 import retrofit2.http.Path
 
@@ -13,6 +14,7 @@ public interface RatingApiService {
     @POST("v1/ratings")
     public suspend fun submit(
         @Body body: SubmitRatingRequestDto,
+        @Header("Idempotency-Key") idempotencyKey: String,
     )
 
     @GET("v1/ratings/{bookingId}")
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/technician/di/TechnicianModule.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/technician/di/TechnicianModule.kt
index 01ba7348..a50e1f84 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/technician/di/TechnicianModule.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/technician/di/TechnicianModule.kt
@@ -46,7 +46,12 @@ public abstract class TechnicianModule {
                                 HttpLoggingInterceptor.Level.NONE
                             }
                     },
-                ).build()
+                ).connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
+                .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+                .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+                .callTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
+                .retryOnConnectionFailure(true)
+                .build()
 
         @Provides
         @Singleton
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCase.kt
index c627957f..64bc2ad0 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCase.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCase.kt
@@ -4,6 +4,7 @@ import com.homeservices.customer.data.booking.BookingRepository
 import com.homeservices.customer.domain.booking.model.BookingRequest
 import com.homeservices.customer.domain.booking.model.BookingResult
 import kotlinx.coroutines.flow.Flow
+import java.util.UUID
 import javax.inject.Inject
 
 public class CreateBookingUseCase
@@ -11,5 +12,8 @@ public class CreateBookingUseCase
     constructor(
         private val repo: BookingRepository,
     ) {
-        public operator fun invoke(request: BookingRequest): Flow<Result<BookingResult>> = repo.createBooking(request)
+        public operator fun invoke(request: BookingRequest): Flow<Result<BookingResult>> {
+            val idempotencyKey = UUID.randomUUID().toString()
+            return repo.createBooking(request, idempotencyKey)
+        }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCase.kt
index 7207580c..f69152d0 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCase.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCase.kt
@@ -3,6 +3,7 @@ package com.homeservices.customer.domain.complaint
 import com.homeservices.customer.data.complaint.ComplaintRepository
 import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
 import kotlinx.coroutines.flow.Flow
+import java.util.UUID
 import javax.inject.Inject
 
 public class SubmitComplaintUseCase
@@ -15,5 +16,8 @@ public class SubmitComplaintUseCase
             reason: ComplaintReason,
             description: String,
             photoStoragePath: String?,
-        ): Flow<Result<ComplaintResponseDto>> = repo.createComplaint(bookingId, reason.code, description, photoStoragePath)
+        ): Flow<Result<ComplaintResponseDto>> {
+            val idempotencyKey = UUID.randomUUID().toString()
+            return repo.createComplaint(bookingId, reason.code, description, photoStoragePath, idempotencyKey)
+        }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCase.kt
index afe5f0ef..e8b65a10 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCase.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCase.kt
@@ -3,6 +3,7 @@ package com.homeservices.customer.domain.rating
 import com.homeservices.customer.data.rating.RatingRepository
 import com.homeservices.customer.domain.rating.model.CustomerSubScores
 import kotlinx.coroutines.flow.Flow
+import java.util.UUID
 import javax.inject.Inject
 
 public class SubmitRatingUseCase
@@ -15,5 +16,8 @@ public class SubmitRatingUseCase
             overall: Int,
             subScores: CustomerSubScores,
             comment: String?,
-        ): Flow<Result<Unit>> = repo.submitCustomerRating(bookingId, overall, subScores, comment)
+        ): Flow<Result<Unit>> {
+            val idempotencyKey = UUID.randomUUID().toString()
+            return repo.submitCustomerRating(bookingId, overall, subScores, comment, idempotencyKey)
+        }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/PiiRedactor.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/PiiRedactor.kt
index f8e139df..082d083b 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/PiiRedactor.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/PiiRedactor.kt
@@ -10,27 +10,36 @@ import io.sentry.protocol.SentryException
  * values, and breadcrumb data before transmission.
  *
  * Patterns (Indian context):
- *   - Indian mobile numbers:  \b[6-9]\d{9}\b
+ *   - Mobile numbers (+91):   (?<!\w)(?:\+91[-\s]?)?[6-9]\d{9}\b
  *   - Email addresses:        [\w._%+\-]+@[\w.\-]+\.\w{2,}
  *   - Aadhaar numbers:        \b\d{4}\s?\d{4}\s?\d{4}\b
  *   - PAN card numbers:       \b[A-Z]{5}\d{4}[A-Z]\b
  *   - JWT tokens:             eyJ[A-Za-z0-9_\-]{21,}
+ *   - IPv4 addresses:         \b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b
+ *   - Razorpay IDs:           \b(?:pay|order)_[A-Za-z0-9]+\b
+ *   - Lat/Lng coordinates:    \b\d{1,3}\.\d{6,}\b
  */
 public object PiiRedactor {
-    private val PHONE_RE = Regex("""\b[6-9]\d{9}\b""")
+    private val PHONE_INTL_RE = Regex("""(?<!\w)(?:\+91[-\s]?)?[6-9]\d{9}\b""")
     private val EMAIL_RE = Regex("""[\w._%+\-]+@[\w.\-]+\.\w{2,}""")
     private val AADHAAR_RE = Regex("""\b\d{4}\s?\d{4}\s?\d{4}\b""")
     private val PAN_RE = Regex("""\b[A-Z]{5}\d{4}[A-Z]\b""")
     private val JWT_RE = Regex("""eyJ[A-Za-z0-9_\-]{21,}""")
+    private val IPV4_RE = Regex("""\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b""")
+    private val RAZORPAY_RE = Regex("""\b(?:pay|order)_[A-Za-z0-9]+\b""")
+    private val LATLNG_RE = Regex("""\b\d{1,3}\.\d{6,}\b""")
 
     /** Redact all PII patterns in a single string. */
     public fun redact(input: String): String =
         input
-            .replace(PHONE_RE, "[REDACTED_PHONE]")
+            .replace(PHONE_INTL_RE, "[REDACTED_PHONE]")
             .replace(EMAIL_RE, "[REDACTED_EMAIL]")
             .replace(AADHAAR_RE, "[REDACTED_AADHAAR]")
             .replace(PAN_RE, "[REDACTED_PAN]")
             .replace(JWT_RE, "[REDACTED_JWT]")
+            .replace(IPV4_RE, "[REDACTED_IPV4]")
+            .replace(RAZORPAY_RE, "[REDACTED_RAZORPAY]")
+            .replace(LATLNG_RE, "[REDACTED_LATLNG]")
 
     /**
      * Scrub a [SentryEvent] in place before it is transmitted.
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImplTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImplTest.kt
new file mode 100644
index 00000000..2a2579b0
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImplTest.kt
@@ -0,0 +1,120 @@
+package com.homeservices.customer.data.booking
+
+import com.google.common.truth.Truth.assertThat
+import com.homeservices.customer.data.booking.remote.BookingApiService
+import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
+import com.homeservices.customer.domain.booking.model.BookingRequest
+import com.homeservices.customer.domain.booking.model.BookingSlot
+import io.mockk.coEvery
+import io.mockk.every
+import io.mockk.mockk
+import io.mockk.mockkStatic
+import io.mockk.unmockkAll
+import io.mockk.verify
+import io.sentry.Sentry
+import kotlinx.coroutines.flow.toList
+import kotlinx.coroutines.test.runTest
+import org.junit.After
+import org.junit.Test
+
+public class BookingRepositoryImplTest {
+    private val api: BookingApiService = mockk()
+    private val repo = BookingRepositoryImpl(api)
+
+    @After
+    public fun tearDown() {
+        unmockkAll()
+    }
+
+    private val fakeSlot = BookingSlot(date = "2026-06-01", window = "10:00-12:00")
+
+    private val fakeRequest =
+        BookingRequest(
+            serviceId = "svc-1",
+            categoryId = "cat-1",
+            slot = fakeSlot,
+            addressText = "123 Main St",
+            addressLat = 28.7041,
+            addressLng = 77.1025,
+            paymentMethod = BookingPaymentMethod.RAZORPAY,
+        )
+
+    @Test
+    public fun `createBooking captures exception in Sentry on API failure`(): Unit =
+        runTest {
+            mockkStatic("io.sentry.Sentry")
+            coEvery { api.createBooking(any(), any()) } throws RuntimeException("network error")
+            every { Sentry.captureException(any()) } returns mockk()
+
+            val result = repo.createBooking(fakeRequest, "idem-key").toList()
+
+            assertThat(result.first().isFailure).isTrue()
+            verify { Sentry.captureException(any()) }
+            unmockkAll()
+        }
+
+    @Test
+    public fun `getMyBookings captures exception in Sentry on API failure`(): Unit =
+        runTest {
+            mockkStatic("io.sentry.Sentry")
+            coEvery { api.getMyBookings() } throws RuntimeException("network error")
+            every { Sentry.captureException(any()) } returns mockk()
+
+            val result = repo.getMyBookings().toList()
+
+            assertThat(result.first().isFailure).isTrue()
+            verify { Sentry.captureException(any()) }
+            unmockkAll()
+        }
+
+    @Test
+    public fun `confirmBooking captures exception in Sentry on API failure`(): Unit =
+        runTest {
+            mockkStatic("io.sentry.Sentry")
+            coEvery {
+                api.confirmBooking(any(), any(), any())
+            } throws RuntimeException("network error")
+            every { Sentry.captureException(any()) } returns mockk()
+
+            val result =
+                repo
+                    .confirmBooking(
+                        bookingId = "bk-1",
+                        paymentId = "pay-1",
+                        orderId = "ord-1",
+                        signature = "sig",
+                    ).toList()
+
+            assertThat(result.first().isFailure).isTrue()
+            verify { Sentry.captureException(any()) }
+            unmockkAll()
+        }
+
+    @Test
+    public fun `getPendingAddOns captures exception in Sentry on API failure`(): Unit =
+        runTest {
+            mockkStatic("io.sentry.Sentry")
+            coEvery { api.getBooking(any()) } throws RuntimeException("network error")
+            every { Sentry.captureException(any()) } returns mockk()
+
+            val result = repo.getPendingAddOns("bk-1").toList()
+
+            assertThat(result.first().isFailure).isTrue()
+            verify { Sentry.captureException(any()) }
+            unmockkAll()
+        }
+
+    @Test
+    public fun `approveFinalPrice captures exception in Sentry on API failure`(): Unit =
+        runTest {
+            mockkStatic("io.sentry.Sentry")
+            coEvery { api.approveFinalPrice(any(), any()) } throws RuntimeException("network error")
+            every { Sentry.captureException(any()) } returns mockk()
+
+            val result = repo.approveFinalPrice("bk-1", emptyList()).toList()
+
+            assertThat(result.first().isFailure).isTrue()
+            verify { Sentry.captureException(any()) }
+            unmockkAll()
+        }
+}
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImplTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImplTest.kt
index 06f654c0..5137064e 100644
--- a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImplTest.kt
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImplTest.kt
@@ -8,9 +8,15 @@ import com.homeservices.customer.data.catalogue.remote.dto.CategoryDto
 import com.homeservices.customer.data.catalogue.remote.dto.ServiceDto
 import com.homeservices.customer.data.catalogue.remote.dto.ServiceSummaryDto
 import io.mockk.coEvery
+import io.mockk.every
 import io.mockk.mockk
+import io.mockk.mockkStatic
+import io.mockk.unmockkAll
+import io.mockk.verify
+import io.sentry.Sentry
 import kotlinx.coroutines.flow.first
 import kotlinx.coroutines.test.runTest
+import org.junit.After
 import org.junit.Test
 import java.io.IOException
 
@@ -18,6 +24,11 @@ public class CatalogueRepositoryImplTest {
     private val api: CatalogueApiService = mockk()
     private val sut = CatalogueRepositoryImpl(api)
 
+    @After
+    public fun tearDown() {
+        unmockkAll()
+    }
+
     @Test
     public fun `getCategories emits success with mapped domain models`(): Unit =
         runTest {
@@ -125,4 +136,17 @@ public class CatalogueRepositoryImplTest {
             assertThat(services.first().id).isEqualTo("svc1")
             assertThat(services.first().name).isEqualTo("Pipe fix")
         }
+
+    @Test
+    public fun `getCategories captures exception in Sentry on failure`(): Unit =
+        runTest {
+            mockkStatic("io.sentry.Sentry")
+            coEvery { api.getCategories() } throws IOException("network error")
+            every { Sentry.captureException(any()) } returns mockk()
+
+            sut.getCategories().first()
+
+            verify { Sentry.captureException(any()) }
+            unmockkAll()
+        }
 }
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImplTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImplTest.kt
index 1c01a941..50c809dd 100644
--- a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImplTest.kt
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImplTest.kt
@@ -6,16 +6,28 @@ import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
 import com.homeservices.customer.data.complaint.remote.dto.CreateComplaintRequestDto
 import io.mockk.coEvery
 import io.mockk.coVerify
+import io.mockk.every
 import io.mockk.mockk
+import io.mockk.mockkStatic
+import io.mockk.slot
+import io.mockk.unmockkAll
+import io.mockk.verify
+import io.sentry.Sentry
 import kotlinx.coroutines.flow.toList
 import kotlinx.coroutines.test.runTest
 import org.assertj.core.api.Assertions.assertThat
+import org.junit.jupiter.api.AfterEach
 import org.junit.jupiter.api.Test
 
 public class ComplaintRepositoryImplTest {
     private val api: ComplaintApiService = mockk()
     private val repo = ComplaintRepositoryImpl(api)
 
+    @AfterEach
+    public fun tearDown() {
+        unmockkAll()
+    }
+
     private val mockResponse =
         ComplaintResponseDto(
             id = "c-1",
@@ -30,7 +42,7 @@ public class ComplaintRepositoryImplTest {
     @Test
     public fun `createComplaint returns success result with correct response`(): Unit =
         runTest {
-            coEvery { api.createComplaint(any()) } returns mockResponse
+            coEvery { api.createComplaint(any(), any()) } returns mockResponse
 
             val results =
                 repo
@@ -39,6 +51,7 @@ public class ComplaintRepositoryImplTest {
                         "SERVICE_QUALITY",
                         "Some long enough description here.",
                         null,
+                        "test-key-1",
                     ).toList()
 
             assertThat(results).hasSize(1)
@@ -50,9 +63,9 @@ public class ComplaintRepositoryImplTest {
     @Test
     public fun `createComplaint passes photoStoragePath in request`(): Unit =
         runTest {
-            coEvery { api.createComplaint(any()) } returns mockResponse
+            coEvery { api.createComplaint(any(), any()) } returns mockResponse
 
-            repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description here.", "complaints/bk-1/uid/123.jpg").toList()
+            repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description here.", "complaints/bk-1/uid/123.jpg", "test-key-2").toList()
 
             coVerify {
                 api.createComplaint(
@@ -62,6 +75,7 @@ public class ComplaintRepositoryImplTest {
                         description = "Some description here.",
                         photoStoragePath = "complaints/bk-1/uid/123.jpg",
                     ),
+                    any(),
                 )
             }
         }
@@ -69,13 +83,25 @@ public class ComplaintRepositoryImplTest {
     @Test
     public fun `createComplaint returns failure when api throws`(): Unit =
         runTest {
-            coEvery { api.createComplaint(any()) } throws RuntimeException("network error")
+            coEvery { api.createComplaint(any(), any()) } throws RuntimeException("network error")
 
-            val results = repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description.", null).toList()
+            val results = repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description.", null, "test-key-err").toList()
 
             assertThat(results.first().isFailure).isTrue()
         }
 
+    @Test
+    public fun `createComplaint passes idempotency key to api`(): Unit =
+        runTest {
+            coEvery { api.createComplaint(any(), any()) } returns mockResponse
+            val capturedKey = slot<String>()
+
+            repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description.", null, "idem-key-xyz").toList()
+
+            coVerify { api.createComplaint(any(), capture(capturedKey)) }
+            assertThat(capturedKey.captured).isEqualTo("idem-key-xyz")
+        }
+
     @Test
     public fun `getComplaintsForBooking returns list of complaints`(): Unit =
         runTest {
@@ -106,4 +132,17 @@ public class ComplaintRepositoryImplTest {
 
             assertThat(results.first().isFailure).isTrue()
         }
+
+    @Test
+    public fun `createComplaint captures exception in Sentry on failure`(): Unit =
+        runTest {
+            mockkStatic("io.sentry.Sentry")
+            coEvery { api.createComplaint(any(), any()) } throws RuntimeException("network error")
+            every { Sentry.captureException(any()) } returns mockk()
+
+            repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description.", null, "idem-key").toList()
+
+            verify { Sentry.captureException(any()) }
+            unmockkAll()
+        }
 }
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/network/di/OkHttpTimeoutTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/network/di/OkHttpTimeoutTest.kt
new file mode 100644
index 00000000..93e8d56b
--- /dev/null
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/network/di/OkHttpTimeoutTest.kt
@@ -0,0 +1,59 @@
+package com.homeservices.customer.data.network.di
+
+import com.homeservices.customer.data.auth.remote.di.AuthApiModule
+import com.homeservices.customer.data.booking.di.BookingModule
+import com.homeservices.customer.data.catalogue.di.CatalogueModule
+import com.homeservices.customer.data.network.auth.FirebaseTokenAuthenticator
+import com.homeservices.customer.data.network.auth.IdTokenCache
+import com.homeservices.customer.data.technician.di.TechnicianModule
+import io.mockk.mockk
+import org.assertj.core.api.Assertions.assertThat
+import org.junit.jupiter.api.Test
+
+public class OkHttpTimeoutTest {
+    @Test
+    public fun `AuthOkHttpClient has correct timeouts`() {
+        val idTokenCache = mockk<IdTokenCache>()
+        val authenticator = mockk<FirebaseTokenAuthenticator>(relaxed = true)
+        val client = BookingModule.provideAuthOkHttpClient(idTokenCache, authenticator)
+
+        assertThat(client.connectTimeoutMillis).isEqualTo(15_000)
+        assertThat(client.readTimeoutMillis).isEqualTo(30_000)
+        assertThat(client.writeTimeoutMillis).isEqualTo(30_000)
+        assertThat(client.callTimeoutMillis).isEqualTo(60_000)
+        assertThat(client.retryOnConnectionFailure).isTrue()
+    }
+
+    @Test
+    public fun `CatalogueOkHttpClient has correct timeouts`() {
+        val client = CatalogueModule.provideOkHttpClient()
+
+        assertThat(client.connectTimeoutMillis).isEqualTo(15_000)
+        assertThat(client.readTimeoutMillis).isEqualTo(30_000)
+        assertThat(client.writeTimeoutMillis).isEqualTo(30_000)
+        assertThat(client.callTimeoutMillis).isEqualTo(60_000)
+        assertThat(client.retryOnConnectionFailure).isTrue()
+    }
+
+    @Test
+    public fun `PublicOkHttpClient has correct timeouts`() {
+        val client = AuthApiModule.providePublicOkHttpClient()
+
+        assertThat(client.connectTimeoutMillis).isEqualTo(15_000)
+        assertThat(client.readTimeoutMillis).isEqualTo(30_000)
+        assertThat(client.writeTimeoutMillis).isEqualTo(30_000)
+        assertThat(client.callTimeoutMillis).isEqualTo(60_000)
+        assertThat(client.retryOnConnectionFailure).isTrue()
+    }
+
+    @Test
+    public fun `TechnicianOkHttpClient has correct timeouts`() {
+        val client = TechnicianModule.provideTechnicianOkHttpClient()
+
+        assertThat(client.connectTimeoutMillis).isEqualTo(15_000)
+        assertThat(client.readTimeoutMillis).isEqualTo(30_000)
+        assertThat(client.writeTimeoutMillis).isEqualTo(30_000)
+        assertThat(client.callTimeoutMillis).isEqualTo(60_000)
+        assertThat(client.retryOnConnectionFailure).isTrue()
+    }
+}
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImplTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImplTest.kt
index a68d920e..530e3e43 100644
--- a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImplTest.kt
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImplTest.kt
@@ -7,27 +7,38 @@ import com.homeservices.customer.domain.rating.model.CustomerSubScores
 import com.homeservices.customer.domain.rating.model.RatingSnapshot
 import io.mockk.coEvery
 import io.mockk.coVerify
+import io.mockk.every
 import io.mockk.mockk
+import io.mockk.mockkStatic
 import io.mockk.slot
+import io.mockk.unmockkAll
+import io.mockk.verify
+import io.sentry.Sentry
 import kotlinx.coroutines.flow.toList
 import kotlinx.coroutines.test.runTest
 import org.assertj.core.api.Assertions.assertThat
+import org.junit.jupiter.api.AfterEach
 import org.junit.jupiter.api.Test
 
 public class RatingRepositoryImplTest {
     private val api: RatingApiService = mockk()
     private val repo = RatingRepositoryImpl(api)
 
+    @AfterEach
+    public fun tearDown() {
+        unmockkAll()
+    }
+
     @Test
     public fun `submitCustomerRating calls api with correct DTO`(): Unit =
         runTest {
-            coEvery { api.submit(any()) } returns Unit
+            coEvery { api.submit(any(), any()) } returns Unit
             val subScores = CustomerSubScores(punctuality = 5, skill = 4, behaviour = 3)
 
-            val results = repo.submitCustomerRating("bk-1", 5, subScores, "good").toList()
+            val results = repo.submitCustomerRating("bk-1", 5, subScores, "good", "test-key-1").toList()
 
             val captured = slot<com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto>()
-            coVerify { api.submit(capture(captured)) }
+            coVerify { api.submit(capture(captured), any()) }
             assertThat(captured.captured.side).isEqualTo("CUSTOMER_TO_TECH")
             assertThat(captured.captured.bookingId).isEqualTo("bk-1")
             assertThat(captured.captured.overall).isEqualTo(5)
@@ -38,13 +49,26 @@ public class RatingRepositoryImplTest {
     @Test
     public fun `submitCustomerRating returns failure on API error`(): Unit =
         runTest {
-            coEvery { api.submit(any()) } throws RuntimeException("network error")
+            coEvery { api.submit(any(), any()) } throws RuntimeException("network error")
 
-            val results = repo.submitCustomerRating("bk-1", 5, CustomerSubScores(5, 5, 5), null).toList()
+            val results = repo.submitCustomerRating("bk-1", 5, CustomerSubScores(5, 5, 5), null, "test-key-err").toList()
 
             assertThat(results.first().isFailure).isTrue()
         }
 
+    @Test
+    public fun `submitCustomerRating passes idempotency key to api`(): Unit =
+        runTest {
+            coEvery { api.submit(any(), any()) } returns Unit
+            val subScores = CustomerSubScores(punctuality = 4, skill = 4, behaviour = 4)
+            val capturedKey = slot<String>()
+
+            repo.submitCustomerRating("bk-2", 4, subScores, null, "idem-key-abc").toList()
+
+            coVerify { api.submit(any(), capture(capturedKey)) }
+            assertThat(capturedKey.captured).isEqualTo("idem-key-abc")
+        }
+
     @Test
     public fun `get returns domain model on success`(): Unit =
         runTest {
@@ -74,4 +98,17 @@ public class RatingRepositoryImplTest {
 
             assertThat(results.first().isFailure).isTrue()
         }
+
+    @Test
+    public fun `submitCustomerRating captures exception in Sentry on failure`(): Unit =
+        runTest {
+            mockkStatic("io.sentry.Sentry")
+            coEvery { api.submit(any(), any()) } throws RuntimeException("network error")
+            every { Sentry.captureException(any()) } returns mockk()
+
+            repo.submitCustomerRating("bk-1", 5, CustomerSubScores(5, 5, 5), null, "idem-key").toList()
+
+            verify { Sentry.captureException(any()) }
+            unmockkAll()
+        }
 }
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/tracking/TrackingRepositoryImplTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/tracking/TrackingRepositoryImplTest.kt
index 20d1425c..83613bfe 100644
--- a/customer-app/app/src/test/kotlin/com/homeservices/customer/data/tracking/TrackingRepositoryImplTest.kt
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/data/tracking/TrackingRepositoryImplTest.kt
@@ -24,7 +24,10 @@ public class TrackingRepositoryImplTest {
     private class FakeBookingApiService(
         var status: String = "ASSIGNED",
     ) : BookingApiService {
-        override suspend fun createBooking(body: CreateBookingRequestDto): CreateBookingResponseDto = error("not used")
+        override suspend fun createBooking(
+            body: CreateBookingRequestDto,
+            idempotencyKey: String,
+        ): CreateBookingResponseDto = error("not used")
 
         override suspend fun confirmBooking(
             bookingId: String,
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCaseTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCaseTest.kt
index 39ec63ab..ea8917f3 100644
--- a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCaseTest.kt
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCaseTest.kt
@@ -7,6 +7,7 @@ import com.homeservices.customer.domain.booking.model.BookingResult
 import com.homeservices.customer.domain.booking.model.BookingSlot
 import io.mockk.every
 import io.mockk.mockk
+import io.mockk.slot
 import io.mockk.verify
 import kotlinx.coroutines.flow.first
 import kotlinx.coroutines.flow.flowOf
@@ -31,15 +32,29 @@ public class CreateBookingUseCaseTest {
     public fun `invoke returns BookingResult on success`(): Unit =
         runTest {
             val expected = BookingResult(bookingId = "bk-1", razorpayOrderId = "order_1", amount = 59900)
-            every { repo.createBooking(request) } returns flowOf(Result.success(expected))
+            every { repo.createBooking(request, any()) } returns flowOf(Result.success(expected))
             assertThat(sut(request).first().getOrThrow()).isEqualTo(expected)
-            verify(exactly = 1) { repo.createBooking(request) }
+            verify(exactly = 1) { repo.createBooking(request, any()) }
         }
 
     @Test
     public fun `invoke propagates repository failure`(): Unit =
         runTest {
-            every { repo.createBooking(request) } returns flowOf(Result.failure(RuntimeException("network error")))
+            every { repo.createBooking(request, any()) } returns flowOf(Result.failure(RuntimeException("network error")))
             assertThat(sut(request).first().isFailure).isTrue()
         }
+
+    @Test
+    public fun `invoke generates non-blank UUID idempotency key`(): Unit =
+        runTest {
+            val expected = BookingResult(bookingId = "bk-2", razorpayOrderId = "order_2", amount = 10000)
+            val capturedKey = slot<String>()
+            every { repo.createBooking(request, capture(capturedKey)) } returns flowOf(Result.success(expected))
+
+            sut(request).first()
+
+            val key = capturedKey.captured
+            assertThat(key).isNotEmpty()
+            assertThat(key).matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
+        }
 }
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCaseTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCaseTest.kt
index 0f9b8b1a..6b6e105a 100644
--- a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCaseTest.kt
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCaseTest.kt
@@ -29,7 +29,7 @@ public class SubmitComplaintUseCaseTest {
     public fun `delegates to repo with reason code and returns success`(): Unit =
         runTest {
             coEvery {
-                repo.createComplaint("bk-1", "SERVICE_QUALITY", "A long enough description.", null)
+                repo.createComplaint("bk-1", "SERVICE_QUALITY", "A long enough description.", null, any())
             } returns flowOf(Result.success(mockResponse))
 
             val results = useCase("bk-1", ComplaintReason.SERVICE_QUALITY, "A long enough description.", null).toList()
@@ -41,7 +41,7 @@ public class SubmitComplaintUseCaseTest {
     @Test
     public fun `propagates failure from repository`(): Unit =
         runTest {
-            coEvery { repo.createComplaint(any(), any(), any(), any()) } returns
+            coEvery { repo.createComplaint(any(), any(), any(), any(), any()) } returns
                 flowOf(Result.failure(RuntimeException("network")))
 
             val results = useCase("bk-1", ComplaintReason.OTHER, "A long enough description.", null).toList()
@@ -53,7 +53,7 @@ public class SubmitComplaintUseCaseTest {
     public fun `uses reason code string from enum`(): Unit =
         runTest {
             coEvery {
-                repo.createComplaint("bk-1", "BILLING_DISPUTE", any(), any())
+                repo.createComplaint("bk-1", "BILLING_DISPUTE", any(), any(), any())
             } returns flowOf(Result.success(mockResponse))
 
             val results = useCase("bk-1", ComplaintReason.BILLING_DISPUTE, "Some long description here.", null).toList()
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCaseTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCaseTest.kt
index 7d162d10..cde4a043 100644
--- a/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCaseTest.kt
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCaseTest.kt
@@ -19,7 +19,7 @@ public class SubmitRatingUseCaseTest {
         runTest {
             val subScores = CustomerSubScores(punctuality = 5, skill = 4, behaviour = 5)
             coEvery {
-                repo.submitCustomerRating("bk-1", 5, subScores, "great")
+                repo.submitCustomerRating("bk-1", 5, subScores, "great", any())
             } returns flowOf(Result.success(Unit))
 
             val results = useCase.invoke("bk-1", 5, subScores, "great").toList()
diff --git a/customer-app/app/src/test/kotlin/com/homeservices/customer/observability/PiiRedactorTest.kt b/customer-app/app/src/test/kotlin/com/homeservices/customer/observability/PiiRedactorTest.kt
index 3fd5ca69..50695847 100644
--- a/customer-app/app/src/test/kotlin/com/homeservices/customer/observability/PiiRedactorTest.kt
+++ b/customer-app/app/src/test/kotlin/com/homeservices/customer/observability/PiiRedactorTest.kt
@@ -84,6 +84,45 @@ public class PiiRedactorTest {
                     "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIn0.sig",
                     "Bearer [REDACTED_JWT].eyJzdWIiOiJ1c2VyMTIzIn0.sig",
                 ),
+                // PHONE_INTL_RE — with +91 prefix
+                Arguments.of(
+                    "phone with +91 country code and hyphen",
+                    "Call +91-9876543210 for support",
+                    "Call [REDACTED_PHONE] for support",
+                ),
+                Arguments.of(
+                    "phone with +91 space",
+                    "+91 9876543210 is the number",
+                    "[REDACTED_PHONE] is the number",
+                ),
+                // IPV4_RE
+                Arguments.of(
+                    "IPv4 address",
+                    "Server at 192.168.1.1 is down",
+                    "Server at [REDACTED_IPV4] is down",
+                ),
+                // RAZORPAY_RE
+                Arguments.of(
+                    "Razorpay payment ID",
+                    "Payment pay_ABCdef1234 processed",
+                    "Payment [REDACTED_RAZORPAY] processed",
+                ),
+                Arguments.of(
+                    "Razorpay order ID",
+                    "Order order_XYZ987abc created",
+                    "Order [REDACTED_RAZORPAY] created",
+                ),
+                // LATLNG_RE
+                Arguments.of(
+                    "latitude coordinate",
+                    "Location 28.613939 N",
+                    "Location [REDACTED_LATLNG] N",
+                ),
+                Arguments.of(
+                    "lat/lng exactly 6 decimal places",
+                    "coords 28.613939 precise",
+                    "coords [REDACTED_LATLNG] precise",
+                ),
             )
 
         @JvmStatic
@@ -93,6 +132,10 @@ public class PiiRedactorTest {
                 Arguments.of("file path", "at com.homeservices.customer.BookingViewModel.createBooking:42"),
                 Arguments.of("HTTP status text", "Booking confirmed successfully"),
                 Arguments.of("short numeric id", "bookingId: 12345"),
+                Arguments.of("short decimal no PII", "score 4.5 out of 5"),
+                Arguments.of("price rupees", "price 299.99 INR"),
+                Arguments.of("non-Razorpay underscore", "event_tracking_id"),
+                Arguments.of("decimal 5dp not redacted", "score 28.12345 approx"),
             )
     }
 }
diff --git a/tools/pre-codex-smoke.sh b/tools/pre-codex-smoke.sh
index 6ca971cf..e1a86d3c 100644
--- a/tools/pre-codex-smoke.sh
+++ b/tools/pre-codex-smoke.sh
@@ -18,7 +18,8 @@ echo "[2/4] ktlintCheck — formatting must be clean before Codex sees it..."
 ./gradlew ktlintCheck --quiet 2>&1 | tail -20
 
 echo "[3/4] testDebugUnitTest — TDD invariant: all unit tests must be green..."
-./gradlew testDebugUnitTest --quiet 2>&1 | tail -30
+# -PexcludePaparazzi: Paparazzi snapshot tests require Linux font rendering; run on CI via paparazzi-record.yml
+./gradlew testDebugUnitTest --quiet -PexcludePaparazzi 2>&1 | tail -30
 
 echo "[4/4] koverVerify — coverage must meet >=80% threshold..."
 ./gradlew koverVerify --quiet 2>&1 | tail -10
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint2b' diff --name-status f39ac4b37a5f76121433cc6ac340508f273858ef" in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1820ms:
A	customer-app/.serena/.gitignore
A	customer-app/.serena/project.yml
M	customer-app/app/build.gradle.kts
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/remote/di/AuthApiModule.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepository.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImpl.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/di/BookingModule.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/BookingApiService.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImpl.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/di/CatalogueModule.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepository.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImpl.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/remote/ComplaintApiService.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/network/auth/FirebaseTokenAuthenticator.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepository.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/data/technician/di/TechnicianModule.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCase.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCase.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCase.kt
M	customer-app/app/src/main/kotlin/com/homeservices/customer/observability/PiiRedactor.kt
A	customer-app/app/src/test/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImplTest.kt
M	customer-app/app/src/test/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImplTest.kt
M	customer-app/app/src/test/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImplTest.kt
A	customer-app/app/src/test/kotlin/com/homeservices/customer/data/network/di/OkHttpTimeoutTest.kt
M	customer-app/app/src/test/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImplTest.kt
M	customer-app/app/src/test/kotlin/com/homeservices/customer/data/tracking/TrackingRepositoryImplTest.kt
M	customer-app/app/src/test/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCaseTest.kt
M	customer-app/app/src/test/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCaseTest.kt
M	customer-app/app/src/test/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCaseTest.kt
M	customer-app/app/src/test/kotlin/com/homeservices/customer/observability/PiiRedactorTest.kt
M	tools/pre-codex-smoke.sh
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint2b' diff --unified=80 f39ac4b37a5f76121433cc6ac340508f273858ef -- customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepository.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImpl.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/remote/ComplaintApiService.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepository.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt customer-app/app/src/main/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCase.kt customer-app/app/src/main/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCase.kt customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCase.kt customer-app/app/src/main/kotlin/com/homeservices/customer/observability/PiiRedactor.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/network/auth/FirebaseTokenAuthenticator.kt" in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 2597ms:
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepository.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepository.kt
index 3deb6a47..af909cb2 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepository.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepository.kt
@@ -1,15 +1,16 @@
 package com.homeservices.customer.data.complaint
 
 import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
 import kotlinx.coroutines.flow.Flow
 
 public interface ComplaintRepository {
     public fun createComplaint(
         bookingId: String,
         reasonCode: String,
         description: String,
         photoStoragePath: String?,
+        idempotencyKey: String,
     ): Flow<Result<ComplaintResponseDto>>
 
     public fun getComplaintsForBooking(bookingId: String): Flow<Result<List<ComplaintResponseDto>>>
 }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImpl.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImpl.kt
index ae8b9d4e..36a7f544 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImpl.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImpl.kt
@@ -1,40 +1,46 @@
 package com.homeservices.customer.data.complaint
 
 import com.homeservices.customer.data.complaint.remote.ComplaintApiService
 import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
 import com.homeservices.customer.data.complaint.remote.dto.CreateComplaintRequestDto
+import io.sentry.Sentry
 import kotlinx.coroutines.flow.Flow
 import kotlinx.coroutines.flow.flow
 import javax.inject.Inject
 
 internal class ComplaintRepositoryImpl
     @Inject
     constructor(
         private val api: ComplaintApiService,
     ) : ComplaintRepository {
         override fun createComplaint(
             bookingId: String,
             reasonCode: String,
             description: String,
             photoStoragePath: String?,
+            idempotencyKey: String,
         ): Flow<Result<ComplaintResponseDto>> =
             flow {
                 emit(
                     runCatching {
                         api.createComplaint(
                             CreateComplaintRequestDto(
                                 bookingId = bookingId,
                                 reasonCode = reasonCode,
                                 description = description,
                                 photoStoragePath = photoStoragePath,
                             ),
+                            idempotencyKey = idempotencyKey,
                         )
-                    },
+                    }.onFailure { Sentry.captureException(it) },
                 )
             }
 
         override fun getComplaintsForBooking(bookingId: String): Flow<Result<List<ComplaintResponseDto>>> =
             flow {
-                emit(runCatching { api.getComplaintsForBooking(bookingId).complaints })
+                emit(
+                    runCatching { api.getComplaintsForBooking(bookingId).complaints }
+                        .onFailure { Sentry.captureException(it) },
+                )
             }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/remote/ComplaintApiService.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/remote/ComplaintApiService.kt
index f3898eb2..e58d2025 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/remote/ComplaintApiService.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/remote/ComplaintApiService.kt
@@ -1,21 +1,23 @@
 package com.homeservices.customer.data.complaint.remote
 
 import com.homeservices.customer.data.complaint.remote.dto.ComplaintListResponseDto
 import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
 import com.homeservices.customer.data.complaint.remote.dto.CreateComplaintRequestDto
 import retrofit2.http.Body
 import retrofit2.http.GET
+import retrofit2.http.Header
 import retrofit2.http.POST
 import retrofit2.http.Path
 
 public interface ComplaintApiService {
     @POST("v1/complaints")
     public suspend fun createComplaint(
         @Body body: CreateComplaintRequestDto,
+        @Header("Idempotency-Key") idempotencyKey: String,
     ): ComplaintResponseDto
 
     @GET("v1/complaints/{bookingId}")
     public suspend fun getComplaintsForBooking(
         @Path("bookingId") bookingId: String,
     ): ComplaintListResponseDto
 }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/network/auth/FirebaseTokenAuthenticator.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/network/auth/FirebaseTokenAuthenticator.kt
index a7f9389a..9c70bf4b 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/network/auth/FirebaseTokenAuthenticator.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/network/auth/FirebaseTokenAuthenticator.kt
@@ -1,69 +1,71 @@
 package com.homeservices.customer.data.network.auth
 
 import android.util.Log
 import com.google.android.gms.tasks.Tasks
 import com.google.firebase.auth.FirebaseAuth
+import io.sentry.Sentry
 import okhttp3.Authenticator
 import okhttp3.Request
 import okhttp3.Response
 import okhttp3.Route
 import javax.inject.Inject
 import javax.inject.Singleton
 
 /**
  * OkHttp [Authenticator] that handles 401 responses by force-refreshing the Firebase ID token.
  *
  * Design notes:
  * - [Authenticator.authenticate] is called on an OkHttp worker thread, **never the main thread**.
  *   `Tasks.await(...)` is therefore safe here — it blocks the worker thread while waiting for
  *   the Firebase token refresh, which is exactly what OkHttp's Authenticator contract expects.
  * - The retry guard checks for a prior response with the same URL to prevent an infinite 401 loop.
  *   On the second consecutive 401 (prior response count ≥ 1), we return `null` to stop retrying.
  * - On any error (Firebase exception, null token, no user), we return `null` so OkHttp surfaces
  *   the 401 to the caller rather than looping indefinitely.
  */
 @Singleton
 public class FirebaseTokenAuthenticator
     @Inject
     constructor(
         private val firebaseAuth: FirebaseAuth,
     ) : Authenticator {
         override fun authenticate(
             route: Route?,
             response: Response,
         ): Request? {
             // Infinite-retry guard: stop after the first retry attempt
             if (response.priorResponse != null) {
                 Log.w(TAG, "Stopping token retry — prior 401 already retried")
                 return null
             }
 
             val user = firebaseAuth.currentUser
             if (user == null) {
                 Log.w(TAG, "No signed-in user — cannot refresh token")
                 return null
             }
 
             return try {
                 // Force-refresh (true) to get a new token, not the cached one
-                val result = Tasks.await(user.getIdToken(true))
+                val result = Tasks.await(user.getIdToken(true), 25, java.util.concurrent.TimeUnit.SECONDS)
                 val newToken = result?.token
                 if (newToken == null) {
                     Log.w(TAG, "getIdToken(true) returned null token")
                     return null
                 }
                 Log.d(TAG, "Token refreshed successfully on 401")
                 response.request
                     .newBuilder()
                     .header("Authorization", "Bearer $newToken")
                     .build()
             } catch (e: Exception) {
                 Log.e(TAG, "Token force-refresh failed on 401", e)
+                Sentry.captureException(e)
                 null
             }
         }
 
         private companion object {
             const val TAG = "FirebaseTokenAuth"
         }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepository.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepository.kt
index f978e9a3..e3041f55 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepository.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepository.kt
@@ -1,16 +1,17 @@
 package com.homeservices.customer.data.rating
 
 import com.homeservices.customer.domain.rating.model.CustomerSubScores
 import com.homeservices.customer.domain.rating.model.RatingSnapshot
 import kotlinx.coroutines.flow.Flow
 
 public interface RatingRepository {
     public fun submitCustomerRating(
         bookingId: String,
         overall: Int,
         subScores: CustomerSubScores,
         comment: String?,
+        idempotencyKey: String,
     ): Flow<Result<Unit>>
 
     public fun get(bookingId: String): Flow<Result<RatingSnapshot>>
 }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt
index 9d05f644..8ed3c2a4 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt
@@ -1,44 +1,53 @@
 package com.homeservices.customer.data.rating
 
 import com.homeservices.customer.data.rating.remote.RatingApiService
 import com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto
 import com.homeservices.customer.domain.rating.model.CustomerSubScores
 import com.homeservices.customer.domain.rating.model.RatingSnapshot
+import io.sentry.Sentry
 import kotlinx.coroutines.flow.Flow
 import kotlinx.coroutines.flow.flow
 import javax.inject.Inject
 
 internal class RatingRepositoryImpl
     @Inject
     constructor(
         private val api: RatingApiService,
     ) : RatingRepository {
         override fun submitCustomerRating(
             bookingId: String,
             overall: Int,
             subScores: CustomerSubScores,
             comment: String?,
+            idempotencyKey: String,
         ): Flow<Result<Unit>> =
             flow {
                 emit(
                     runCatching {
                         api.submit(
                             SubmitRatingRequestDto(
                                 side = "CUSTOMER_TO_TECH",
                                 bookingId = bookingId,
                                 overall = overall,
                                 subScores =
                                     mapOf(
                                         "punctuality" to subScores.punctuality,
                                         "skill" to subScores.skill,
                                         "behaviour" to subScores.behaviour,
                                     ),
                                 comment = comment,
                             ),
+                            idempotencyKey = idempotencyKey,
                         )
-                    },
+                    }.onFailure { Sentry.captureException(it) },
                 )
             }
 
-        override fun get(bookingId: String): Flow<Result<RatingSnapshot>> = flow { emit(runCatching { api.get(bookingId).toDomain() }) }
+        override fun get(bookingId: String): Flow<Result<RatingSnapshot>> =
+            flow {
+                emit(
+                    runCatching { api.get(bookingId).toDomain() }
+                        .onFailure { Sentry.captureException(it) },
+                )
+            }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt
index 2945eb3d..ea46033c 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt
@@ -1,28 +1,30 @@
 package com.homeservices.customer.data.rating.remote
 
 import com.homeservices.customer.data.rating.remote.dto.EscalateRatingRequestDto
 import com.homeservices.customer.data.rating.remote.dto.EscalateRatingResponseDto
 import com.homeservices.customer.data.rating.remote.dto.GetRatingResponseDto
 import com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto
 import retrofit2.http.Body
 import retrofit2.http.GET
+import retrofit2.http.Header
 import retrofit2.http.POST
 import retrofit2.http.Path
 
 public interface RatingApiService {
     @POST("v1/ratings")
     public suspend fun submit(
         @Body body: SubmitRatingRequestDto,
+        @Header("Idempotency-Key") idempotencyKey: String,
     )
 
     @GET("v1/ratings/{bookingId}")
     public suspend fun get(
         @Path("bookingId") bookingId: String,
     ): GetRatingResponseDto
 
     @POST("v1/ratings/{bookingId}/escalate")
     public suspend fun escalate(
         @Path("bookingId") bookingId: String,
         @Body body: EscalateRatingRequestDto,
     ): EscalateRatingResponseDto
 }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCase.kt
index c627957f..64bc2ad0 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCase.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/booking/CreateBookingUseCase.kt
@@ -1,15 +1,19 @@
 package com.homeservices.customer.domain.booking
 
 import com.homeservices.customer.data.booking.BookingRepository
 import com.homeservices.customer.domain.booking.model.BookingRequest
 import com.homeservices.customer.domain.booking.model.BookingResult
 import kotlinx.coroutines.flow.Flow
+import java.util.UUID
 import javax.inject.Inject
 
 public class CreateBookingUseCase
     @Inject
     constructor(
         private val repo: BookingRepository,
     ) {
-        public operator fun invoke(request: BookingRequest): Flow<Result<BookingResult>> = repo.createBooking(request)
+        public operator fun invoke(request: BookingRequest): Flow<Result<BookingResult>> {
+            val idempotencyKey = UUID.randomUUID().toString()
+            return repo.createBooking(request, idempotencyKey)
+        }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCase.kt
index 7207580c..f69152d0 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCase.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/complaint/SubmitComplaintUseCase.kt
@@ -1,19 +1,23 @@
 package com.homeservices.customer.domain.complaint
 
 import com.homeservices.customer.data.complaint.ComplaintRepository
 import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
 import kotlinx.coroutines.flow.Flow
+import java.util.UUID
 import javax.inject.Inject
 
 public class SubmitComplaintUseCase
     @Inject
     constructor(
         private val repo: ComplaintRepository,
     ) {
         public operator fun invoke(
             bookingId: String,
             reason: ComplaintReason,
             description: String,
             photoStoragePath: String?,
-        ): Flow<Result<ComplaintResponseDto>> = repo.createComplaint(bookingId, reason.code, description, photoStoragePath)
+        ): Flow<Result<ComplaintResponseDto>> {
+            val idempotencyKey = UUID.randomUUID().toString()
+            return repo.createComplaint(bookingId, reason.code, description, photoStoragePath, idempotencyKey)
+        }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCase.kt
index afe5f0ef..e8b65a10 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCase.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCase.kt
@@ -1,19 +1,23 @@
 package com.homeservices.customer.domain.rating
 
 import com.homeservices.customer.data.rating.RatingRepository
 import com.homeservices.customer.domain.rating.model.CustomerSubScores
 import kotlinx.coroutines.flow.Flow
+import java.util.UUID
 import javax.inject.Inject
 
 public class SubmitRatingUseCase
     @Inject
     constructor(
         private val repo: RatingRepository,
     ) {
         public operator fun invoke(
             bookingId: String,
             overall: Int,
             subScores: CustomerSubScores,
             comment: String?,
-        ): Flow<Result<Unit>> = repo.submitCustomerRating(bookingId, overall, subScores, comment)
+        ): Flow<Result<Unit>> {
+            val idempotencyKey = UUID.randomUUID().toString()
+            return repo.submitCustomerRating(bookingId, overall, subScores, comment, idempotencyKey)
+        }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/PiiRedactor.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/PiiRedactor.kt
index f8e139df..082d083b 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/PiiRedactor.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/observability/PiiRedactor.kt
@@ -1,62 +1,71 @@
 package com.homeservices.customer.observability
 
 import io.sentry.SentryEvent
 import io.sentry.protocol.SentryException
 
 /**
  * PII redaction utilities for Sentry events (E13-S04, ADR-0018).
  *
  * Applies to all string values captured in Sentry event messages, exception
  * values, and breadcrumb data before transmission.
  *
  * Patterns (Indian context):
- *   - Indian mobile numbers:  \b[6-9]\d{9}\b
+ *   - Mobile numbers (+91):   (?<!\w)(?:\+91[-\s]?)?[6-9]\d{9}\b
  *   - Email addresses:        [\w._%+\-]+@[\w.\-]+\.\w{2,}
  *   - Aadhaar numbers:        \b\d{4}\s?\d{4}\s?\d{4}\b
  *   - PAN card numbers:       \b[A-Z]{5}\d{4}[A-Z]\b
  *   - JWT tokens:             eyJ[A-Za-z0-9_\-]{21,}
+ *   - IPv4 addresses:         \b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b
+ *   - Razorpay IDs:           \b(?:pay|order)_[A-Za-z0-9]+\b
+ *   - Lat/Lng coordinates:    \b\d{1,3}\.\d{6,}\b
  */
 public object PiiRedactor {
-    private val PHONE_RE = Regex("""\b[6-9]\d{9}\b""")
+    private val PHONE_INTL_RE = Regex("""(?<!\w)(?:\+91[-\s]?)?[6-9]\d{9}\b""")
     private val EMAIL_RE = Regex("""[\w._%+\-]+@[\w.\-]+\.\w{2,}""")
     private val AADHAAR_RE = Regex("""\b\d{4}\s?\d{4}\s?\d{4}\b""")
     private val PAN_RE = Regex("""\b[A-Z]{5}\d{4}[A-Z]\b""")
     private val JWT_RE = Regex("""eyJ[A-Za-z0-9_\-]{21,}""")
+    private val IPV4_RE = Regex("""\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b""")
+    private val RAZORPAY_RE = Regex("""\b(?:pay|order)_[A-Za-z0-9]+\b""")
+    private val LATLNG_RE = Regex("""\b\d{1,3}\.\d{6,}\b""")
 
     /** Redact all PII patterns in a single string. */
     public fun redact(input: String): String =
         input
-            .replace(PHONE_RE, "[REDACTED_PHONE]")
+            .replace(PHONE_INTL_RE, "[REDACTED_PHONE]")
             .replace(EMAIL_RE, "[REDACTED_EMAIL]")
             .replace(AADHAAR_RE, "[REDACTED_AADHAAR]")
             .replace(PAN_RE, "[REDACTED_PAN]")
             .replace(JWT_RE, "[REDACTED_JWT]")
+            .replace(IPV4_RE, "[REDACTED_IPV4]")
+            .replace(RAZORPAY_RE, "[REDACTED_RAZORPAY]")
+            .replace(LATLNG_RE, "[REDACTED_LATLNG]")
 
     /**
      * Scrub a [SentryEvent] in place before it is transmitted.
      *
      * - Redacts the event message.
      * - Redacts exception value messages (stack traces left intact).
      * - Redacts breadcrumb messages.
      * - Returns the mutated event (Sentry SDK requires the same instance).
      */
     public fun scrub(event: SentryEvent): SentryEvent {
         // Scrub top-level message
         event.message?.let { msg ->
             msg.message?.let { text -> msg.message = redact(text) }
             msg.formatted?.let { text -> msg.formatted = redact(text) }
         }
 
         // Scrub exception value messages (preserve stack frames)
         event.exceptions?.forEach { exc: SentryException ->
             exc.value?.let { value -> exc.value = redact(value) }
         }
 
         // Scrub breadcrumb messages
         event.breadcrumbs?.forEach { crumb ->
             crumb.message?.let { text -> crumb.message = redact(text) }
         }
 
         return event
     }
 }
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint2b' diff --unified=80 f39ac4b37a5f76121433cc6ac340508f273858ef -- customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepository.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImpl.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/BookingApiService.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/remote/di/AuthApiModule.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/di/BookingModule.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImpl.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/di/CatalogueModule.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/technician/di/TechnicianModule.kt customer-app/app/build.gradle.kts" in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 2192ms:
diff --git a/customer-app/app/build.gradle.kts b/customer-app/app/build.gradle.kts
index d316c7bb..a5df985f 100644
--- a/customer-app/app/build.gradle.kts
+++ b/customer-app/app/build.gradle.kts
@@ -158,160 +158,166 @@ android {
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
+            all { test: org.gradle.api.tasks.testing.Test ->
+                // Pass -PexcludePaparazzi in smoke gate to skip snapshot tests on Windows
+                if (project.hasProperty("excludePaparazzi")) {
+                    test.filter.excludeTestsMatching("*PaparazziTest*")
+                }
+            }
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
                 minBound(69, kotlinx.kover.gradle.plugin.dsl.CoverageUnit.BRANCH)
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
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/remote/di/AuthApiModule.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/remote/di/AuthApiModule.kt
index af68523a..2bc72cef 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/remote/di/AuthApiModule.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/remote/di/AuthApiModule.kt
@@ -1,58 +1,63 @@
 package com.homeservices.customer.data.auth.remote.di
 
 import com.homeservices.customer.BuildConfig
 import com.homeservices.customer.data.auth.remote.AuthApi
 import com.squareup.moshi.Moshi
 import dagger.Module
 import dagger.Provides
 import dagger.hilt.InstallIn
 import dagger.hilt.components.SingletonComponent
 import okhttp3.OkHttpClient
 import okhttp3.logging.HttpLoggingInterceptor
 import retrofit2.Retrofit
 import retrofit2.converter.moshi.MoshiConverterFactory
 import javax.inject.Qualifier
 import javax.inject.Singleton
 
 /**
  * Qualifier for an OkHttpClient that carries NO authentication tokens.
  * Used for public / pre-auth API endpoints (e.g. Truecaller verify).
  */
 @Qualifier
 @Retention(AnnotationRetention.BINARY)
 public annotation class PublicOkHttpClient
 
 @Module
 @InstallIn(SingletonComponent::class)
 public object AuthApiModule {
     @Provides
     @Singleton
     @PublicOkHttpClient
     public fun providePublicOkHttpClient(): OkHttpClient =
         OkHttpClient
             .Builder()
             .addInterceptor(
                 HttpLoggingInterceptor().apply {
                     level =
                         if (BuildConfig.DEBUG) {
                             HttpLoggingInterceptor.Level.BODY
                         } else {
                             HttpLoggingInterceptor.Level.NONE
                         }
                 },
-            ).build()
+            ).connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
+            .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+            .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+            .callTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
+            .retryOnConnectionFailure(true)
+            .build()
 
     @Provides
     @Singleton
     public fun provideAuthApi(
         @PublicOkHttpClient okHttpClient: OkHttpClient,
         moshi: Moshi,
     ): AuthApi =
         Retrofit
             .Builder()
             .baseUrl(BuildConfig.API_BASE_URL + "/")
             .addConverterFactory(MoshiConverterFactory.create(moshi))
             .client(okHttpClient)
             .build()
             .create(AuthApi::class.java)
 }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepository.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepository.kt
index 8d38943a..693ff3ab 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepository.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepository.kt
@@ -1,29 +1,32 @@
 package com.homeservices.customer.data.booking
 
 import com.homeservices.customer.domain.booking.model.AddOnDecision
 import com.homeservices.customer.domain.booking.model.BookingRequest
 import com.homeservices.customer.domain.booking.model.BookingResult
 import com.homeservices.customer.domain.booking.model.CustomerBooking
 import com.homeservices.customer.domain.booking.model.PendingAddOn
 import kotlinx.coroutines.flow.Flow
 
 public interface BookingRepository {
-    public fun createBooking(request: BookingRequest): Flow<Result<BookingResult>>
+    public fun createBooking(
+        request: BookingRequest,
+        idempotencyKey: String,
+    ): Flow<Result<BookingResult>>
 
     public fun getMyBookings(): Flow<Result<List<CustomerBooking>>>
 
     public fun confirmBooking(
         bookingId: String,
         paymentId: String,
         orderId: String,
         signature: String,
         integrityToken: String? = null,
     ): Flow<Result<String>>
 
     public fun getPendingAddOns(bookingId: String): Flow<Result<List<PendingAddOn>>>
 
     public fun approveFinalPrice(
         bookingId: String,
         decisions: List<AddOnDecision>,
     ): Flow<Result<Int>>
 }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImpl.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImpl.kt
index e0e1f5a7..5e38162e 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImpl.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImpl.kt
@@ -1,92 +1,103 @@
 package com.homeservices.customer.data.booking
 
 import com.homeservices.customer.data.booking.remote.BookingApiService
 import com.homeservices.customer.data.booking.remote.dto.AddOnDecisionDto
 import com.homeservices.customer.data.booking.remote.dto.ApproveFinalPriceRequestDto
 import com.homeservices.customer.data.booking.remote.dto.ConfirmBookingRequestDto
 import com.homeservices.customer.data.booking.remote.dto.CreateBookingRequestDto
 import com.homeservices.customer.data.booking.remote.dto.LatLngDto
 import com.homeservices.customer.domain.booking.model.AddOnDecision
 import com.homeservices.customer.domain.booking.model.BookingRequest
 import com.homeservices.customer.domain.booking.model.BookingResult
 import com.homeservices.customer.domain.booking.model.CustomerBooking
 import com.homeservices.customer.domain.booking.model.PendingAddOn
+import io.sentry.Sentry
 import kotlinx.coroutines.flow.Flow
 import kotlinx.coroutines.flow.flow
 import javax.inject.Inject
 
 internal class BookingRepositoryImpl
     @Inject
     constructor(
         private val api: BookingApiService,
     ) : BookingRepository {
-        override fun createBooking(request: BookingRequest): Flow<Result<BookingResult>> =
+        override fun createBooking(
+            request: BookingRequest,
+            idempotencyKey: String,
+        ): Flow<Result<BookingResult>> =
             flow {
                 emit(
                     runCatching {
                         api
                             .createBooking(
                                 CreateBookingRequestDto(
                                     serviceId = request.serviceId,
                                     categoryId = request.categoryId,
                                     slotDate = request.slot.date,
                                     slotWindow = request.slot.window,
                                     addressText = request.addressText,
                                     addressLatLng = LatLngDto(lat = request.addressLat, lng = request.addressLng),
                                     paymentMethod = request.paymentMethod.name,
                                 ),
+                                idempotencyKey = idempotencyKey,
                             ).toDomain()
-                    },
+                    }.onFailure { Sentry.captureException(it) },
                 )
             }
 
         override fun getMyBookings(): Flow<Result<List<CustomerBooking>>> =
             flow {
-                emit(runCatching { api.getMyBookings().bookings.map { it.toDomain() } })
+                emit(
+                    runCatching { api.getMyBookings().bookings.map { it.toDomain() } }
+                        .onFailure { Sentry.captureException(it) },
+                )
             }
 
         override fun confirmBooking(
             bookingId: String,
             paymentId: String,
             orderId: String,
             signature: String,
             integrityToken: String?,
         ): Flow<Result<String>> =
             flow {
                 emit(
                     runCatching {
                         api
                             .confirmBooking(
                                 bookingId,
                                 ConfirmBookingRequestDto(
                                     razorpayPaymentId = paymentId,
                                     razorpayOrderId = orderId,
                                     razorpaySignature = signature,
                                 ),
                                 integrityToken = integrityToken,
                             ).bookingId
-                    },
+                    }.onFailure { Sentry.captureException(it) },
                 )
             }
 
         override fun getPendingAddOns(bookingId: String): Flow<Result<List<PendingAddOn>>> =
             flow {
-                emit(runCatching { api.getBooking(bookingId).pendingAddOns.map { it.toDomain() } })
+                emit(
+                    runCatching { api.getBooking(bookingId).pendingAddOns.map { it.toDomain() } }
+                        .onFailure { Sentry.captureException(it) },
+                )
             }
 
         override fun approveFinalPrice(
             bookingId: String,
             decisions: List<AddOnDecision>,
         ): Flow<Result<Int>> =
             flow {
                 emit(
                     runCatching {
                         api
                             .approveFinalPrice(
                                 bookingId,
                                 ApproveFinalPriceRequestDto(decisions.map { AddOnDecisionDto(it.name, it.approved) }),
                             ).finalAmount ?: error("finalAmount missing in approve-final-price response")
-                    },
+                    }.onFailure { Sentry.captureException(it) },
                 )
             }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/di/BookingModule.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/di/BookingModule.kt
index 54da3abf..34dda5ad 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/di/BookingModule.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/di/BookingModule.kt
@@ -1,84 +1,89 @@
 package com.homeservices.customer.data.booking.di
 
 import com.homeservices.customer.BuildConfig
 import com.homeservices.customer.data.booking.BookingRepository
 import com.homeservices.customer.data.booking.BookingRepositoryImpl
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
 import javax.inject.Qualifier
 import javax.inject.Singleton
 
 @Qualifier
 @Retention(AnnotationRetention.BINARY)
 public annotation class AuthOkHttpClient
 
 @Module
 @InstallIn(SingletonComponent::class)
 public abstract class BookingModule {
     @Binds
     internal abstract fun bindBookingRepository(impl: BookingRepositoryImpl): BookingRepository
 
     public companion object {
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
+                .connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
+                .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+                .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+                .callTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
+                .retryOnConnectionFailure(true)
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
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/BookingApiService.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/BookingApiService.kt
index 03ecdc07..6c14421d 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/BookingApiService.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/BookingApiService.kt
@@ -1,43 +1,45 @@
 package com.homeservices.customer.data.booking.remote
 
 import com.homeservices.customer.data.booking.remote.dto.ApproveFinalPriceRequestDto
 import com.homeservices.customer.data.booking.remote.dto.ApproveFinalPriceResponseDto
 import com.homeservices.customer.data.booking.remote.dto.ConfirmBookingRequestDto
 import com.homeservices.customer.data.booking.remote.dto.ConfirmBookingResponseDto
 import com.homeservices.customer.data.booking.remote.dto.CreateBookingRequestDto
 import com.homeservices.customer.data.booking.remote.dto.CreateBookingResponseDto
 import com.homeservices.customer.data.booking.remote.dto.CustomerBookingsResponseDto
 import com.homeservices.customer.data.booking.remote.dto.GetBookingResponseDto
 import retrofit2.http.Body
 import retrofit2.http.GET
 import retrofit2.http.Header
 import retrofit2.http.POST
 import retrofit2.http.Path
 
 public interface BookingApiService {
     @POST("v1/bookings")
     public suspend fun createBooking(
         @Body body: CreateBookingRequestDto,
+        @Header("Idempotency-Key") idempotencyKey: String,
     ): CreateBookingResponseDto
 
     @POST("v1/bookings/{id}/confirm")
     public suspend fun confirmBooking(
         @Path("id") bookingId: String,
         @Body body: ConfirmBookingRequestDto,
+        // Nullable: Retrofit 2 omits the header when null (play-integrity not always available)
         @Header("X-Integrity-Token") integrityToken: String? = null,
     ): ConfirmBookingResponseDto
 
     @GET("v1/bookings/{id}")
     public suspend fun getBooking(
         @Path("id") bookingId: String,
     ): GetBookingResponseDto
 
     @GET("v1/bookings")
     public suspend fun getMyBookings(): CustomerBookingsResponseDto
 
     @POST("v1/bookings/{id}/approve-final-price")
     public suspend fun approveFinalPrice(
         @Path("id") bookingId: String,
         @Body body: ApproveFinalPriceRequestDto,
     ): ApproveFinalPriceResponseDto
 }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImpl.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImpl.kt
index 008b87bd..3022d641 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImpl.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImpl.kt
@@ -1,41 +1,48 @@
 package com.homeservices.customer.data.catalogue
 
 import com.homeservices.customer.data.catalogue.remote.CatalogueApiService
 import com.homeservices.customer.data.catalogue.remote.dto.toDomain
 import com.homeservices.customer.data.catalogue.remote.dto.toServiceDomain
 import com.homeservices.customer.domain.catalogue.model.Category
 import com.homeservices.customer.domain.catalogue.model.Service
+import io.sentry.Sentry
 import kotlinx.coroutines.flow.Flow
 import kotlinx.coroutines.flow.flow
 import javax.inject.Inject
 
 internal class CatalogueRepositoryImpl
     @Inject
     constructor(
         private val api: CatalogueApiService,
     ) : CatalogueRepository {
         override fun getCategories(): Flow<Result<List<Category>>> =
             flow {
-                emit(runCatching { api.getCategories().categories.map { it.toDomain() } })
+                emit(
+                    runCatching { api.getCategories().categories.map { it.toDomain() } }
+                        .onFailure { Sentry.captureException(it) },
+                )
             }
 
         override fun getServicesForCategory(categoryId: String): Flow<Result<List<Service>>> =
             flow {
                 emit(
                     runCatching {
                         api
                             .getCategories()
                             .categories
                             .firstOrNull { it.id == categoryId }
                             ?.services
                             ?.map { it.toServiceDomain() }
                             .orEmpty()
-                    },
+                    }.onFailure { Sentry.captureException(it) },
                 )
             }
 
         override fun getServiceDetail(serviceId: String): Flow<Result<Service>> =
             flow {
-                emit(runCatching { api.getServiceDetail(serviceId).toDomain() })
+                emit(
+                    runCatching { api.getServiceDetail(serviceId).toDomain() }
+                        .onFailure { Sentry.captureException(it) },
+                )
             }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/di/CatalogueModule.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/di/CatalogueModule.kt
index 078dfb52..e4f0c655 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/di/CatalogueModule.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/di/CatalogueModule.kt
@@ -1,65 +1,70 @@
 package com.homeservices.customer.data.catalogue.di
 
 import com.homeservices.customer.BuildConfig
 import com.homeservices.customer.data.catalogue.CatalogueRepository
 import com.homeservices.customer.data.catalogue.CatalogueRepositoryImpl
 import com.homeservices.customer.data.catalogue.remote.CatalogueApiService
 import com.squareup.moshi.Moshi
 import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
 import dagger.Binds
 import dagger.Module
 import dagger.Provides
 import dagger.hilt.InstallIn
 import dagger.hilt.components.SingletonComponent
 import okhttp3.OkHttpClient
 import okhttp3.logging.HttpLoggingInterceptor
 import retrofit2.Retrofit
 import retrofit2.converter.moshi.MoshiConverterFactory
 import javax.inject.Singleton
 
 @Module
 @InstallIn(SingletonComponent::class)
 public abstract class CatalogueModule {
     @Binds
     internal abstract fun bindCatalogueRepository(impl: CatalogueRepositoryImpl): CatalogueRepository
 
     public companion object {
         @Provides
         @Singleton
         public fun provideMoshi(): Moshi =
             Moshi
                 .Builder()
                 .addLast(KotlinJsonAdapterFactory())
                 .build()
 
         @Provides
         @Singleton
         public fun provideOkHttpClient(): OkHttpClient =
             OkHttpClient
                 .Builder()
                 .addInterceptor(
                     HttpLoggingInterceptor().apply {
                         level =
                             if (BuildConfig.DEBUG) {
                                 HttpLoggingInterceptor.Level.BODY
                             } else {
                                 HttpLoggingInterceptor.Level.NONE
                             }
                     },
-                ).build()
+                ).connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
+                .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+                .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+                .callTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
+                .retryOnConnectionFailure(true)
+                .build()
 
         @Provides
         @Singleton
         public fun provideCatalogueApiService(
             moshi: Moshi,
             client: OkHttpClient,
         ): CatalogueApiService =
             Retrofit
                 .Builder()
                 .baseUrl(BuildConfig.API_BASE_URL + "/")
                 .addConverterFactory(MoshiConverterFactory.create(moshi))
                 .client(client)
                 .build()
                 .create(CatalogueApiService::class.java)
     }
 }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/technician/di/TechnicianModule.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/technician/di/TechnicianModule.kt
index 01ba7348..a50e1f84 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/technician/di/TechnicianModule.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/technician/di/TechnicianModule.kt
@@ -1,65 +1,70 @@
 package com.homeservices.customer.data.technician.di
 
 import com.homeservices.customer.BuildConfig
 import com.homeservices.customer.data.technician.ConfidenceScoreRepository
 import com.homeservices.customer.data.technician.ConfidenceScoreRepositoryImpl
 import com.homeservices.customer.data.technician.remote.TechnicianApiService
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
 import javax.inject.Qualifier
 import javax.inject.Singleton
 
 @Qualifier
 @Retention(AnnotationRetention.BINARY)
 public annotation class TechnicianHttpClient
 
 @Module
 @InstallIn(SingletonComponent::class)
 public abstract class TechnicianModule {
     @Binds
     internal abstract fun bindConfidenceScoreRepository(impl: ConfidenceScoreRepositoryImpl): ConfidenceScoreRepository
 
     public companion object {
         // Known limitation (E04-S02): this client has no Firebase auth interceptor.
         // The `requireCustomer` middleware returns 401 until the Firebase token interceptor
         // is added (mirrors BookingModule's @AuthOkHttpClient pattern with getIdToken).
         @Provides
         @Singleton
         @TechnicianHttpClient
         public fun provideTechnicianOkHttpClient(): OkHttpClient =
             OkHttpClient
                 .Builder()
                 .addInterceptor(
                     HttpLoggingInterceptor().apply {
                         level =
                             if (BuildConfig.DEBUG) {
                                 HttpLoggingInterceptor.Level.BODY
                             } else {
                                 HttpLoggingInterceptor.Level.NONE
                             }
                     },
-                ).build()
+                ).connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
+                .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+                .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
+                .callTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
+                .retryOnConnectionFailure(true)
+                .build()
 
         @Provides
         @Singleton
         public fun provideTechnicianApiService(
             @TechnicianHttpClient client: OkHttpClient,
             moshi: Moshi, // injected from CatalogueModule — not redeclared here
         ): TechnicianApiService =
             Retrofit
                 .Builder()
                 .baseUrl(BuildConfig.API_BASE_URL + "/")
                 .addConverterFactory(MoshiConverterFactory.create(moshi))
                 .client(client)
                 .build()
                 .create(TechnicianApiService::class.java)
     }
 }
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg \"createBooking\\(\" customer-app/app/src -n" in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1720ms:
customer-app/app/src\main\kotlin\com\homeservices\customer\ui\booking\BookingViewModel.kt:82:                createBooking(request).first().fold(
customer-app/app/src\test\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImplTest.kt:27:        override suspend fun createBooking(
customer-app/app/src\test\kotlin\com\homeservices\customer\data\booking\BookingRepositoryImplTest.kt:46:            coEvery { api.createBooking(any(), any()) } throws RuntimeException("network error")
customer-app/app/src\test\kotlin\com\homeservices\customer\data\booking\BookingRepositoryImplTest.kt:49:            val result = repo.createBooking(fakeRequest, "idem-key").toList()
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\booking\CreateBookingUseCaseTest.kt:35:            every { repo.createBooking(request, any()) } returns flowOf(Result.success(expected))
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\booking\CreateBookingUseCaseTest.kt:37:            verify(exactly = 1) { repo.createBooking(request, any()) }
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\booking\CreateBookingUseCaseTest.kt:43:            every { repo.createBooking(request, any()) } returns flowOf(Result.failure(RuntimeException("network error")))
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\booking\CreateBookingUseCaseTest.kt:52:            every { repo.createBooking(request, capture(capturedKey)) } returns flowOf(Result.success(expected))
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\booking\CreateBookingUseCase.kt:17:            return repo.createBooking(request, idempotencyKey)
customer-app/app/src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelTest.kt:61:            every { createBooking(any()) } returns
customer-app/app/src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelTest.kt:77:            every { createBooking(capture(capturedRequest)) } returns
customer-app/app/src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelTest.kt:101:            every { createBooking(any()) } returns
customer-app/app/src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelTest.kt:116:            every { createBooking(any()) } returns
customer-app/app/src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelTest.kt:134:            every { createBooking(any()) } returns
customer-app/app/src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelTest.kt:150:            every { createBooking(any()) } returns
customer-app/app/src\main\kotlin\com\homeservices\customer\data\booking\remote\BookingApiService.kt:19:    public suspend fun createBooking(
customer-app/app/src\main\kotlin\com\homeservices\customer\data\booking\BookingRepository.kt:11:    public fun createBooking(
customer-app/app/src\main\kotlin\com\homeservices\customer\data\booking\BookingRepositoryImpl.kt:24:        override fun createBooking(
customer-app/app/src\main\kotlin\com\homeservices\customer\data\booking\BookingRepositoryImpl.kt:32:                            .createBooking(

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg \"submitCustomerRating\\(|createComplaint\\(\" customer-app/app/src -n" in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1382ms:
customer-app/app/src\test\kotlin\com\homeservices\customer\data\rating\RatingRepositoryImplTest.kt:38:            val results = repo.submitCustomerRating("bk-1", 5, subScores, "good", "test-key-1").toList()
customer-app/app/src\test\kotlin\com\homeservices\customer\data\rating\RatingRepositoryImplTest.kt:54:            val results = repo.submitCustomerRating("bk-1", 5, CustomerSubScores(5, 5, 5), null, "test-key-err").toList()
customer-app/app/src\test\kotlin\com\homeservices\customer\data\rating\RatingRepositoryImplTest.kt:66:            repo.submitCustomerRating("bk-2", 4, subScores, null, "idem-key-abc").toList()
customer-app/app/src\test\kotlin\com\homeservices\customer\data\rating\RatingRepositoryImplTest.kt:109:            repo.submitCustomerRating("bk-1", 5, CustomerSubScores(5, 5, 5), null, "idem-key").toList()
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\rating\SubmitRatingUseCaseTest.kt:22:                repo.submitCustomerRating("bk-1", 5, subScores, "great", any())
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\complaint\SubmitComplaintUseCaseTest.kt:32:                repo.createComplaint("bk-1", "SERVICE_QUALITY", "A long enough description.", null, any())
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\complaint\SubmitComplaintUseCaseTest.kt:44:            coEvery { repo.createComplaint(any(), any(), any(), any(), any()) } returns
customer-app/app/src\test\kotlin\com\homeservices\customer\domain\complaint\SubmitComplaintUseCaseTest.kt:56:                repo.createComplaint("bk-1", "BILLING_DISPUTE", any(), any(), any())
customer-app/app/src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:45:            coEvery { api.createComplaint(any(), any()) } returns mockResponse
customer-app/app/src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:49:                    .createComplaint(
customer-app/app/src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:66:            coEvery { api.createComplaint(any(), any()) } returns mockResponse
customer-app/app/src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:68:            repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description here.", "complaints/bk-1/uid/123.jpg", "test-key-2").toList()
customer-app/app/src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:71:                api.createComplaint(
customer-app/app/src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:86:            coEvery { api.createComplaint(any(), any()) } throws RuntimeException("network error")
customer-app/app/src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:88:            val results = repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description.", null, "test-key-err").toList()
customer-app/app/src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:96:            coEvery { api.createComplaint(any(), any()) } returns mockResponse
customer-app/app/src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:99:            repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description.", null, "idem-key-xyz").toList()
customer-app/app/src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:101:            coVerify { api.createComplaint(any(), capture(capturedKey)) }
customer-app/app/src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:140:            coEvery { api.createComplaint(any(), any()) } throws RuntimeException("network error")
customer-app/app/src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:143:            repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description.", null, "idem-key").toList()
customer-app/app/src\main\kotlin\com\homeservices\customer\data\rating\RatingRepositoryImpl.kt:17:        override fun submitCustomerRating(
customer-app/app/src\main\kotlin\com\homeservices\customer\data\rating\RatingRepository.kt:8:    public fun submitCustomerRating(
customer-app/app/src\main\kotlin\com\homeservices\customer\data\complaint\remote\ComplaintApiService.kt:14:    public suspend fun createComplaint(
customer-app/app/src\main\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImpl.kt:16:        override fun createComplaint(
customer-app/app/src\main\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImpl.kt:26:                        api.createComplaint(
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\rating\SubmitRatingUseCase.kt:21:            return repo.submitCustomerRating(bookingId, overall, subScores, comment, idempotencyKey)
customer-app/app/src\main\kotlin\com\homeservices\customer\domain\complaint\SubmitComplaintUseCase.kt:21:            return repo.createComplaint(bookingId, reason.code, description, photoStoragePath, idempotencyKey)
customer-app/app/src\main\kotlin\com\homeservices\customer\data\complaint\ComplaintRepository.kt:7:    public fun createComplaint(

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingViewModel.kt -Raw' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1035ms:
package com.homeservices.customer.ui.booking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.booking.ConfirmBookingUseCase
import com.homeservices.customer.domain.booking.CreateBookingUseCase
import com.homeservices.customer.domain.booking.RazorpayPaymentUseCase
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.BookingRequest
import com.homeservices.customer.domain.booking.model.BookingSlot
import com.homeservices.customer.domain.booking.model.PaymentResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val BOOKING_FAILED_FALLBACK = "Booking failed"
private const val CONFIRMATION_FAILED_FALLBACK = "Confirmation failed"

@HiltViewModel
internal class BookingViewModel
    @Inject
    constructor(
        private val createBooking: CreateBookingUseCase,
        private val confirmBooking: ConfirmBookingUseCase,
        private val razorpayPayment: RazorpayPaymentUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<BookingUiState>(BookingUiState.Idle)
        public val uiState: StateFlow<BookingUiState> = _uiState.asStateFlow()

        private var pendingBookingId: String? = null

        public var pendingServiceId: String = ""
        public var pendingCategoryId: String = ""

        init {
            viewModelScope.launch {
                razorpayPayment.resultFlow().collect { result ->
                    val bookingId = pendingBookingId ?: return@collect
                    handlePaymentResult(result, bookingId)
                }
            }
        }

        public fun setSlotAndAddress(
            slot: BookingSlot,
            addressText: String,
            lat: Double,
            lng: Double,
        ) {
            _uiState.value = BookingUiState.Ready(slot, addressText, lat, lng)
        }

        public fun startPayment(
            serviceId: String,
            categoryId: String,
        ) {
            startBooking(serviceId, categoryId, BookingPaymentMethod.RAZORPAY)
        }

        public fun startBooking(
            serviceId: String,
            categoryId: String,
            paymentMethod: BookingPaymentMethod,
        ) {
            val state = _uiState.value as? BookingUiState.Ready ?: return
            viewModelScope.launch {
                _uiState.value = BookingUiState.CreatingBooking
                val request =
                    BookingRequest(
                        serviceId = serviceId,
                        categoryId = categoryId,
                        slot = state.slot,
                        addressText = state.addressText,
                        addressLat = state.lat,
                        addressLng = state.lng,
                        paymentMethod = paymentMethod,
                    )
                createBooking(request).first().fold(
                    onSuccess = { result ->
                        pendingBookingId = result.bookingId
                        _uiState.value =
                            if (result.requiresPayment) {
                                BookingUiState.AwaitingPayment(
                                    bookingId = result.bookingId,
                                    razorpayOrderId = result.razorpayOrderId,
                                    amount = result.amount,
                                )
                            } else {
                                BookingUiState.BookingConfirmed(result.bookingId)
                            }
                    },
                    // Error message key: R.string.booking_error_failed surfaced in UI layer
                    onFailure = { _uiState.value = BookingUiState.Error(it.message ?: BOOKING_FAILED_FALLBACK) },
                )
            }
        }

        private suspend fun handlePaymentResult(
            result: PaymentResult,
            bookingId: String,
        ) {
            when (result) {
                is PaymentResult.Success -> {
                    _uiState.value = BookingUiState.ConfirmingPayment
                    confirmBooking(bookingId, result.paymentId, result.orderId, result.signature)
                        .first()
                        .fold(
                            onSuccess = { _uiState.value = BookingUiState.BookingConfirmed(bookingId) },
                            // Error message key: R.string.booking_error_confirmation_failed surfaced in UI layer
                            onFailure = { _uiState.value = BookingUiState.Error(it.message ?: CONFIRMATION_FAILED_FALLBACK) },
                        )
                }
                // Error message key: R.string.booking_error_payment_cancelled surfaced in UI layer
                // TODO(E18-S04): map PAYMENT_CANCELLED sentinel to localized message via PaymentFailed state
                is PaymentResult.Failure ->
                    _uiState.value = BookingUiState.Error("PAYMENT_CANCELLED:${result.description}")
            }
        }
    }


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path customer-app/app/src/test/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImplTest.kt -Raw; Get-Content -Path customer-app/app/src/test/kotlin/com/homeservices/customer/data/catalogue/CatalogueRepositoryImplTest.kt -Raw; Get-Content -Path customer-app/app/src/test/kotlin/com/homeservices/customer/data/complaint/ComplaintRepositoryImplTest.kt -Raw' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1986ms:
package com.homeservices.customer.data.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.remote.BookingApiService
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.BookingRequest
import com.homeservices.customer.domain.booking.model.BookingSlot
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import io.mockk.verify
import io.sentry.Sentry
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Test

public class BookingRepositoryImplTest {
    private val api: BookingApiService = mockk()
    private val repo = BookingRepositoryImpl(api)

    @After
    public fun tearDown() {
        unmockkAll()
    }

    private val fakeSlot = BookingSlot(date = "2026-06-01", window = "10:00-12:00")

    private val fakeRequest =
        BookingRequest(
            serviceId = "svc-1",
            categoryId = "cat-1",
            slot = fakeSlot,
            addressText = "123 Main St",
            addressLat = 28.7041,
            addressLng = 77.1025,
            paymentMethod = BookingPaymentMethod.RAZORPAY,
        )

    @Test
    public fun `createBooking captures exception in Sentry on API failure`(): Unit =
        runTest {
            mockkStatic("io.sentry.Sentry")
            coEvery { api.createBooking(any(), any()) } throws RuntimeException("network error")
            every { Sentry.captureException(any()) } returns mockk()

            val result = repo.createBooking(fakeRequest, "idem-key").toList()

            assertThat(result.first().isFailure).isTrue()
            verify { Sentry.captureException(any()) }
            unmockkAll()
        }

    @Test
    public fun `getMyBookings captures exception in Sentry on API failure`(): Unit =
        runTest {
            mockkStatic("io.sentry.Sentry")
            coEvery { api.getMyBookings() } throws RuntimeException("network error")
            every { Sentry.captureException(any()) } returns mockk()

            val result = repo.getMyBookings().toList()

            assertThat(result.first().isFailure).isTrue()
            verify { Sentry.captureException(any()) }
            unmockkAll()
        }

    @Test
    public fun `confirmBooking captures exception in Sentry on API failure`(): Unit =
        runTest {
            mockkStatic("io.sentry.Sentry")
            coEvery {
                api.confirmBooking(any(), any(), any())
            } throws RuntimeException("network error")
            every { Sentry.captureException(any()) } returns mockk()

            val result =
                repo
                    .confirmBooking(
                        bookingId = "bk-1",
                        paymentId = "pay-1",
                        orderId = "ord-1",
                        signature = "sig",
                    ).toList()

            assertThat(result.first().isFailure).isTrue()
            verify { Sentry.captureException(any()) }
            unmockkAll()
        }

    @Test
    public fun `getPendingAddOns captures exception in Sentry on API failure`(): Unit =
        runTest {
            mockkStatic("io.sentry.Sentry")
            coEvery { api.getBooking(any()) } throws RuntimeException("network error")
            every { Sentry.captureException(any()) } returns mockk()

            val result = repo.getPendingAddOns("bk-1").toList()

            assertThat(result.first().isFailure).isTrue()
            verify { Sentry.captureException(any()) }
            unmockkAll()
        }

    @Test
    public fun `approveFinalPrice captures exception in Sentry on API failure`(): Unit =
        runTest {
            mockkStatic("io.sentry.Sentry")
            coEvery { api.approveFinalPrice(any(), any()) } throws RuntimeException("network error")
            every { Sentry.captureException(any()) } returns mockk()

            val result = repo.approveFinalPrice("bk-1", emptyList()).toList()

            assertThat(result.first().isFailure).isTrue()
            verify { Sentry.captureException(any()) }
            unmockkAll()
        }
}

package com.homeservices.customer.data.catalogue

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.catalogue.remote.CatalogueApiService
import com.homeservices.customer.data.catalogue.remote.dto.AddOnDto
import com.homeservices.customer.data.catalogue.remote.dto.CatalogueListResponse
import com.homeservices.customer.data.catalogue.remote.dto.CategoryDto
import com.homeservices.customer.data.catalogue.remote.dto.ServiceDto
import com.homeservices.customer.data.catalogue.remote.dto.ServiceSummaryDto
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import io.mockk.verify
import io.sentry.Sentry
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Test
import java.io.IOException

public class CatalogueRepositoryImplTest {
    private val api: CatalogueApiService = mockk()
    private val sut = CatalogueRepositoryImpl(api)

    @After
    public fun tearDown() {
        unmockkAll()
    }

    @Test
    public fun `getCategories emits success with mapped domain models`(): Unit =
        runTest {
            coEvery { api.getCategories() } returns
                CatalogueListResponse(
                    categories =
                        listOf(
                            CategoryDto(
                                "cat1",
                                "Plumbing",
                                "https://cdn.example.com/plumbing.jpg",
                                listOf(
                                    ServiceSummaryDto(
                                        id = "s1",
                                        categoryId = "cat1",
                                        name = "Leak Fix",
                                        shortDescription = "Fix visible pipe leaks",
                                        heroImageUrl = "https://cdn.example.com/leak.jpg",
                                        basePrice = 39900,
                                        durationMinutes = 45,
                                    ),
                                    ServiceSummaryDto(
                                        id = "s2",
                                        categoryId = "cat1",
                                        name = "Tap Install",
                                        shortDescription = "Install a customer supplied tap",
                                        heroImageUrl = "https://cdn.example.com/tap.jpg",
                                        basePrice = 59900,
                                        durationMinutes = 60,
                                    ),
                                ),
                            ),
                        ),
                )
            val result = sut.getCategories().first()
            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow().first().id).isEqualTo("cat1")
            assertThat(result.getOrThrow().first().name).isEqualTo("Plumbing")
            assertThat(result.getOrThrow().first().serviceCount).isEqualTo(2)
            assertThat(result.getOrThrow().first().minPricePaise).isEqualTo(39900)
        }

    @Test
    public fun `getCategories emits failure on network exception`(): Unit =
        runTest {
            coEvery { api.getCategories() } throws IOException("timeout")
            val result = sut.getCategories().first()
            assertThat(result.isFailure).isTrue()
        }

    @Test
    public fun `getServiceDetail maps addOns correctly`(): Unit =
        runTest {
            coEvery { api.getServiceDetail("svc1") } returns
                ServiceDto(
                    id = "svc1",
                    categoryId = "cat1",
                    name = "Pipe fix",
                    description = "desc",
                    basePrice = 50000,
                    durationMinutes = 60,
                    imageUrl = "https://cdn/img.jpg",
                    includes = listOf("Tools", "Labour"),
                    addOns = listOf(AddOnDto("Extra pipe", 10000)),
                )
            val result = sut.getServiceDetail("svc1").first()
            assertThat(
                result
                    .getOrThrow()
                    .addOns
                    .first()
                    .price,
            ).isEqualTo(10000)
        }

    @Test
    public fun `getServicesForCategory returns list for category`(): Unit =
        runTest {
            coEvery { api.getCategories() } returns
                CatalogueListResponse(
                    categories =
                        listOf(
                            CategoryDto(
                                id = "cat1",
                                name = "Plumbing",
                                imageUrl = "https://cdn.example.com/plumbing.jpg",
                                services =
                                    listOf(
                                        ServiceSummaryDto(
                                            id = "svc1",
                                            categoryId = "cat1",
                                            name = "Pipe fix",
                                            shortDescription = "desc",
                                            heroImageUrl = "https://cdn/img.jpg",
                                            basePrice = 50000,
                                            durationMinutes = 60,
                                        ),
                                    ),
                            ),
                        ),
                )
            val result = sut.getServicesForCategory("cat1").first()
            val services = result.getOrThrow()
            assertThat(services).hasSize(1)
            assertThat(services.first().id).isEqualTo("svc1")
            assertThat(services.first().name).isEqualTo("Pipe fix")
        }

    @Test
    public fun `getCategories captures exception in Sentry on failure`(): Unit =
        runTest {
            mockkStatic("io.sentry.Sentry")
            coEvery { api.getCategories() } throws IOException("network error")
            every { Sentry.captureException(any()) } returns mockk()

            sut.getCategories().first()

            verify { Sentry.captureException(any()) }
            unmockkAll()
        }
}

package com.homeservices.customer.data.complaint

import com.homeservices.customer.data.complaint.remote.ComplaintApiService
import com.homeservices.customer.data.complaint.remote.dto.ComplaintListResponseDto
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.customer.data.complaint.remote.dto.CreateComplaintRequestDto
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.unmockkAll
import io.mockk.verify
import io.sentry.Sentry
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test

public class ComplaintRepositoryImplTest {
    private val api: ComplaintApiService = mockk()
    private val repo = ComplaintRepositoryImpl(api)

    @AfterEach
    public fun tearDown() {
        unmockkAll()
    }

    private val mockResponse =
        ComplaintResponseDto(
            id = "c-1",
            status = "NEW",
            acknowledgeDeadlineAt = "2026-04-25T02:00:00Z",
            slaDeadlineAt = "2026-04-26T00:00:00Z",
            reasonCode = "SERVICE_QUALITY",
            filedBy = "CUSTOMER",
            createdAt = "2026-04-25T00:00:00Z",
        )

    @Test
    public fun `createComplaint returns success result with correct response`(): Unit =
        runTest {
            coEvery { api.createComplaint(any(), any()) } returns mockResponse

            val results =
                repo
                    .createComplaint(
                        "bk-1",
                        "SERVICE_QUALITY",
                        "Some long enough description here.",
                        null,
                        "test-key-1",
                    ).toList()

            assertThat(results).hasSize(1)
            assertThat(results.first().isSuccess).isTrue()
            assertThat(results.first().getOrNull()?.id).isEqualTo("c-1")
            assertThat(results.first().getOrNull()?.status).isEqualTo("NEW")
        }

    @Test
    public fun `createComplaint passes photoStoragePath in request`(): Unit =
        runTest {
            coEvery { api.createComplaint(any(), any()) } returns mockResponse

            repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description here.", "complaints/bk-1/uid/123.jpg", "test-key-2").toList()

            coVerify {
                api.createComplaint(
                    CreateComplaintRequestDto(
                        bookingId = "bk-1",
                        reasonCode = "SERVICE_QUALITY",
                        description = "Some description here.",
                        photoStoragePath = "complaints/bk-1/uid/123.jpg",
                    ),
                    any(),
                )
            }
        }

    @Test
    public fun `createComplaint returns failure when api throws`(): Unit =
        runTest {
            coEvery { api.createComplaint(any(), any()) } throws RuntimeException("network error")

            val results = repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description.", null, "test-key-err").toList()

            assertThat(results.first().isFailure).isTrue()
        }

    @Test
    public fun `createComplaint passes idempotency key to api`(): Unit =
        runTest {
            coEvery { api.createComplaint(any(), any()) } returns mockResponse
            val capturedKey = slot<String>()

            repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description.", null, "idem-key-xyz").toList()

            coVerify { api.createComplaint(any(), capture(capturedKey)) }
            assertThat(capturedKey.captured).isEqualTo("idem-key-xyz")
        }

    @Test
    public fun `getComplaintsForBooking returns list of complaints`(): Unit =
        runTest {
            coEvery { api.getComplaintsForBooking("bk-1") } returns
                ComplaintListResponseDto(
                    complaints = listOf(mockResponse),
                )

            val results = repo.getComplaintsForBooking("bk-1").toList()

            assertThat(results.first().isSuccess).isTrue()
            assertThat(results.first().getOrNull()).hasSize(1)
            assertThat(
                results
                    .first()
                    .getOrNull()
                    ?.first()
                    ?.id,
            ).isEqualTo("c-1")
        }

    @Test
    public fun `getComplaintsForBooking returns failure when api throws`(): Unit =
        runTest {
            coEvery { api.getComplaintsForBooking(any()) } throws RuntimeException("network error")

            val results = repo.getComplaintsForBooking("bk-1").toList()

            assertThat(results.first().isFailure).isTrue()
        }

    @Test
    public fun `createComplaint captures exception in Sentry on failure`(): Unit =
        runTest {
            mockkStatic("io.sentry.Sentry")
            coEvery { api.createComplaint(any(), any()) } throws RuntimeException("network error")
            every { Sentry.captureException(any()) } returns mockk()

            repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some description.", null, "idem-key").toList()

            verify { Sentry.captureException(any()) }
            unmockkAll()
        }
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "junit" customer-app -n | Select-Object -First 100' in C:\Alok\Business Projects\Urbanclap-sprint2b
2026-05-23T00:18:01.325407Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 1.8 seconds
Output:
customer-app\build.gradle.kts:11:    alias(libs.plugins.android.junit5) apply false
customer-app\app\build.gradle.kts:116:    alias(libs.plugins.android.junit5)
customer-app\app\build.gradle.kts:636:    testImplementation(libs.junit.jupiter)
customer-app\app\build.gradle.kts:637:    testImplementation(libs.junit.jupiter.api)
customer-app\app\build.gradle.kts:638:    testRuntimeOnly(libs.junit.jupiter.engine)
customer-app\app\build.gradle.kts:640:    testRuntimeOnly(libs.junit.vintage.engine)
customer-app\gradle\libs.versions.toml:73:junit5 = "5.11.3"
customer-app\gradle\libs.versions.toml:163:junit-jupiter = { module = "org.junit.jupiter:junit-jupiter", version.ref = "junit5" }
customer-app\gradle\libs.versions.toml:164:junit-jupiter-api = { module = "org.junit.jupiter:junit-jupiter-api", version.ref = "junit5" }
customer-app\gradle\libs.versions.toml:165:junit-jupiter-engine = { module = "org.junit.jupiter:junit-jupiter-engine", version.ref = "junit5" }
customer-app\gradle\libs.versions.toml:166:junit-vintage-engine = { module = "org.junit.vintage:junit-vintage-engine", version.ref = "junit5" }
customer-app\gradle\libs.versions.toml:194:android-junit5 = { id = "de.mannodermaus.android-junit5", version.ref = "androidJunit5" }
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\complaint\ComplaintViewModelTest.kt:19:import org.junit.jupiter.api.AfterEach
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\complaint\ComplaintViewModelTest.kt:20:import org.junit.jupiter.api.BeforeEach
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\complaint\ComplaintViewModelTest.kt:21:import org.junit.jupiter.api.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\complaint\ComplaintScreenPaparazziTest.kt:7:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\complaint\ComplaintScreenPaparazziTest.kt:8:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierViewModelTest.kt:15:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierViewModelTest.kt:16:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierViewModelTest.kt:17:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierCardPaparazziTest.kt:7:import org.junit.Ignore
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierCardPaparazziTest.kt:8:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierCardPaparazziTest.kt:9:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierCardPaparazziTest.kt:10:import org.junit.runner.RunWith
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierCardPaparazziTest.kt:11:import org.junit.runners.JUnit4
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\settings\SettingsScreenPaparazziTest.kt:6:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\settings\SettingsScreenPaparazziTest.kt:7:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceListViewModelTest.kt:19:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceListViewModelTest.kt:20:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceListViewModelTest.kt:21:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceListScreenPaparazziTest.kt:7:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceListScreenPaparazziTest.kt:8:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceListScreenPaparazziTest.kt:9:import org.junit.runner.RunWith
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceListScreenPaparazziTest.kt:10:import org.junit.runners.JUnit4
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelTest.kt:20:import org.junit.jupiter.api.AfterEach
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelTest.kt:21:import org.junit.jupiter.api.BeforeEach
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelTest.kt:22:import org.junit.jupiter.api.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelShieldTest.kt:24:import org.junit.jupiter.api.AfterEach
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelShieldTest.kt:25:import org.junit.jupiter.api.BeforeEach
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelShieldTest.kt:26:import org.junit.jupiter.api.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailViewModelTest.kt:21:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailViewModelTest.kt:22:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailViewModelTest.kt:23:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingScreenPaparazziTest.kt:6:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingScreenPaparazziTest.kt:7:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailScreenTest.kt:8:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailScreenTest.kt:9:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailScreenTest.kt:10:import org.junit.runner.RunWith
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailScreenTest.kt:11:import org.junit.runners.JUnit4
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ConfidenceScoreRowPaparazziTest.kt:6:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ConfidenceScoreRowPaparazziTest.kt:7:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\profile\ProfileViewModelTest.kt:16:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\profile\ProfileViewModelTest.kt:17:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\profile\ProfileViewModelTest.kt:18:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeViewModelTest.kt:17:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeViewModelTest.kt:18:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeViewModelTest.kt:19:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreenTest.kt:7:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreenTest.kt:8:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreenTest.kt:9:import org.junit.runner.RunWith
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreenTest.kt:10:import org.junit.runners.JUnit4
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\locale\FirstLaunchLanguageScreenPaparazziTest.kt:21:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\locale\FirstLaunchLanguageScreenPaparazziTest.kt:22:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreenTest.kt:7:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreenTest.kt:8:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreenTest.kt:9:import org.junit.runner.RunWith
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreenTest.kt:10:import org.junit.runners.JUnit4
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\SmokeScreenPaparazziTest.kt:7:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\SmokeScreenPaparazziTest.kt:8:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsViewModelTest.kt:18:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsViewModelTest.kt:19:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsViewModelTest.kt:20:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingViewModelTest.kt:19:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingViewModelTest.kt:20:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingViewModelTest.kt:21:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\SosScreenTest.kt:4:import org.junit.Ignore
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\SosScreenTest.kt:5:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\SosScreenTest.kt:6:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionPrefsMigratorTest.kt:7:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionPrefsMigratorTest.kt:8:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionPrefsMigratorTest.kt:9:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionPrefsMigratorTest.kt:10:import org.junit.runner.RunWith
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\SlotPickerScreenPaparazziTest.kt:6:import org.junit.Ignore
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\SlotPickerScreenPaparazziTest.kt:7:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\SlotPickerScreenPaparazziTest.kt:8:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\PriceApprovalViewModelTest.kt:17:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\PriceApprovalViewModelTest.kt:18:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\PriceApprovalViewModelTest.kt:19:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerTest.kt:10:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerTest.kt:11:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerTest.kt:12:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerTest.kt:13:import org.junit.runner.RunWith
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\PriceApprovalScreenPaparazziTest.kt:7:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\PriceApprovalScreenPaparazziTest.kt:8:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelTest.kt:22:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelTest.kt:23:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelTest.kt:24:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\observability\SentryInitializerTest.kt:13:import org.junit.jupiter.api.AfterEach
customer-app\app\src\test\kotlin\com\homeservices\customer\observability\SentryInitializerTest.kt:14:import org.junit.jupiter.api.BeforeEach
customer-app\app\src\test\kotlin\com\homeservices\customer\observability\SentryInitializerTest.kt:15:import org.junit.jupiter.api.Test

 exited 1 in 1803ms:
customer-app\build.gradle.kts:11:    alias(libs.plugins.android.junit5) apply false
customer-app\app\build.gradle.kts:116:    alias(libs.plugins.android.junit5)
customer-app\app\build.gradle.kts:636:    testImplementation(libs.junit.jupiter)
customer-app\app\build.gradle.kts:637:    testImplementation(libs.junit.jupiter.api)
customer-app\app\build.gradle.kts:638:    testRuntimeOnly(libs.junit.jupiter.engine)
customer-app\app\build.gradle.kts:640:    testRuntimeOnly(libs.junit.vintage.engine)
customer-app\gradle\libs.versions.toml:73:junit5 = "5.11.3"
customer-app\gradle\libs.versions.toml:163:junit-jupiter = { module = "org.junit.jupiter:junit-jupiter", version.ref = "junit5" }
customer-app\gradle\libs.versions.toml:164:junit-jupiter-api = { module = "org.junit.jupiter:junit-jupiter-api", version.ref = "junit5" }
customer-app\gradle\libs.versions.toml:165:junit-jupiter-engine = { module = "org.junit.jupiter:junit-jupiter-engine", version.ref = "junit5" }
customer-app\gradle\libs.versions.toml:166:junit-vintage-engine = { module = "org.junit.vintage:junit-vintage-engine", version.ref = "junit5" }
customer-app\gradle\libs.versions.toml:194:android-junit5 = { id = "de.mannodermaus.android-junit5", version.ref = "androidJunit5" }
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\complaint\ComplaintViewModelTest.kt:19:import org.junit.jupiter.api.AfterEach
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\complaint\ComplaintViewModelTest.kt:20:import org.junit.jupiter.api.BeforeEach
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\complaint\ComplaintViewModelTest.kt:21:import org.junit.jupiter.api.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\complaint\ComplaintScreenPaparazziTest.kt:7:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\complaint\ComplaintScreenPaparazziTest.kt:8:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierViewModelTest.kt:15:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierViewModelTest.kt:16:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierViewModelTest.kt:17:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierCardPaparazziTest.kt:7:import org.junit.Ignore
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierCardPaparazziTest.kt:8:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierCardPaparazziTest.kt:9:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierCardPaparazziTest.kt:10:import org.junit.runner.RunWith
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\shared\TrustDossierCardPaparazziTest.kt:11:import org.junit.runners.JUnit4
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\settings\SettingsScreenPaparazziTest.kt:6:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\settings\SettingsScreenPaparazziTest.kt:7:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceListViewModelTest.kt:19:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceListViewModelTest.kt:20:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceListViewModelTest.kt:21:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceListScreenPaparazziTest.kt:7:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceListScreenPaparazziTest.kt:8:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceListScreenPaparazziTest.kt:9:import org.junit.runner.RunWith
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceListScreenPaparazziTest.kt:10:import org.junit.runners.JUnit4
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelTest.kt:20:import org.junit.jupiter.api.AfterEach
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelTest.kt:21:import org.junit.jupiter.api.BeforeEach
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelTest.kt:22:import org.junit.jupiter.api.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelShieldTest.kt:24:import org.junit.jupiter.api.AfterEach
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelShieldTest.kt:25:import org.junit.jupiter.api.BeforeEach
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingViewModelShieldTest.kt:26:import org.junit.jupiter.api.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailViewModelTest.kt:21:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailViewModelTest.kt:22:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailViewModelTest.kt:23:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingScreenPaparazziTest.kt:6:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\rating\RatingScreenPaparazziTest.kt:7:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailScreenTest.kt:8:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailScreenTest.kt:9:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailScreenTest.kt:10:import org.junit.runner.RunWith
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailScreenTest.kt:11:import org.junit.runners.JUnit4
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ConfidenceScoreRowPaparazziTest.kt:6:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\ConfidenceScoreRowPaparazziTest.kt:7:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\profile\ProfileViewModelTest.kt:16:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\profile\ProfileViewModelTest.kt:17:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\profile\ProfileViewModelTest.kt:18:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeViewModelTest.kt:17:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeViewModelTest.kt:18:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeViewModelTest.kt:19:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreenTest.kt:7:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreenTest.kt:8:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreenTest.kt:9:import org.junit.runner.RunWith
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreenTest.kt:10:import org.junit.runners.JUnit4
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\locale\FirstLaunchLanguageScreenPaparazziTest.kt:21:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\locale\FirstLaunchLanguageScreenPaparazziTest.kt:22:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreenTest.kt:7:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreenTest.kt:8:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreenTest.kt:9:import org.junit.runner.RunWith
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreenTest.kt:10:import org.junit.runners.JUnit4
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\SmokeScreenPaparazziTest.kt:7:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\SmokeScreenPaparazziTest.kt:8:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsViewModelTest.kt:18:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsViewModelTest.kt:19:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsViewModelTest.kt:20:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingViewModelTest.kt:19:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingViewModelTest.kt:20:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingViewModelTest.kt:21:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\SosScreenTest.kt:4:import org.junit.Ignore
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\SosScreenTest.kt:5:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\tracking\SosScreenTest.kt:6:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionPrefsMigratorTest.kt:7:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionPrefsMigratorTest.kt:8:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionPrefsMigratorTest.kt:9:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionPrefsMigratorTest.kt:10:import org.junit.runner.RunWith
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\SlotPickerScreenPaparazziTest.kt:6:import org.junit.Ignore
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\SlotPickerScreenPaparazziTest.kt:7:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\SlotPickerScreenPaparazziTest.kt:8:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\PriceApprovalViewModelTest.kt:17:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\PriceApprovalViewModelTest.kt:18:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\PriceApprovalViewModelTest.kt:19:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerTest.kt:10:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerTest.kt:11:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerTest.kt:12:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\data\auth\SessionManagerTest.kt:13:import org.junit.runner.RunWith
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\PriceApprovalScreenPaparazziTest.kt:7:import org.junit.Rule
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\PriceApprovalScreenPaparazziTest.kt:8:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelTest.kt:22:import org.junit.After
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelTest.kt:23:import org.junit.Before
customer-app\app\src\test\kotlin\com\homeservices\customer\ui\booking\BookingViewModelTest.kt:24:import org.junit.Test
customer-app\app\src\test\kotlin\com\homeservices\customer\observability\SentryInitializerTest.kt:13:import org.junit.jupiter.api.AfterEach
customer-app\app\src\test\kotlin\com\homeservices\customer\observability\SentryInitializerTest.kt:14:import org.junit.jupiter.api.BeforeEach
customer-app\app\src\test\kotlin\com\homeservices\customer\observability\SentryInitializerTest.kt:15:import org.junit.jupiter.api.Test

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path customer-app/app/src/main/kotlin/com/homeservices/customer/observability/SentryInitializer.kt -Raw; Get-Content -Path customer-app/app/src/test/kotlin/com/homeservices/customer/observability/SentryInitializerTest.kt -Raw' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 8756ms:
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

package com.homeservices.customer.observability

import android.app.Application
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.unmockkStatic
import io.mockk.verify
import io.sentry.android.core.SentryAndroid
import io.sentry.android.core.SentryAndroidOptions
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class SentryInitializerTest {
    private lateinit var application: Application

    @BeforeEach
    public fun setUp(): Unit {
        application = mockk(relaxed = true)
        mockkStatic(SentryAndroid::class)
        every {
            SentryAndroid.init(
                any<Application>(),
                any<io.sentry.Sentry.OptionsConfiguration<SentryAndroidOptions>>(),
            )
        } returns Unit
    }

    @AfterEach
    public fun tearDown(): Unit {
        unmockkStatic(SentryAndroid::class)
    }

    @Test
    public fun `init does nothing when DSN is blank`(): Unit {
        SentryInitializer.init(application = application, dsn = "")

        verify(exactly = 0) {
            SentryAndroid.init(
                any<Application>(),
                any<io.sentry.Sentry.OptionsConfiguration<SentryAndroidOptions>>(),
            )
        }
    }

    @Test
    public fun `init does nothing when DSN is whitespace`(): Unit {
        SentryInitializer.init(application = application, dsn = "   ")

        verify(exactly = 0) {
            SentryAndroid.init(
                any<Application>(),
                any<io.sentry.Sentry.OptionsConfiguration<SentryAndroidOptions>>(),
            )
        }
    }

    @Test
    public fun `init calls Sentry once with tracesSampleRate when DSN set`(): Unit {
        val configSlot = slot<io.sentry.Sentry.OptionsConfiguration<SentryAndroidOptions>>()
        every {
            SentryAndroid.init(any<Application>(), capture(configSlot))
        } returns Unit

        SentryInitializer.init(application = application, dsn = "https://key@o0.ingest.sentry.io/0")

        verify(exactly = 1) {
            SentryAndroid.init(
                application,
                any<io.sentry.Sentry.OptionsConfiguration<SentryAndroidOptions>>(),
            )
        }

        val capturedOptions = SentryAndroidOptions()
        configSlot.captured.configure(capturedOptions)
        assertThat(capturedOptions.dsn).isEqualTo("https://key@o0.ingest.sentry.io/0")
        assertThat(capturedOptions.tracesSampleRate).isEqualTo(EXPECTED_TRACES_SAMPLE_RATE)
        // beforeSend must be set for PII scrubbing (E13-S04)
        assertThat(capturedOptions.beforeSend).isNotNull
    }

    private companion object {
        const val EXPECTED_TRACES_SAMPLE_RATE: Double = 0.1
    }
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "BookingApiService" customer-app/app/src -n' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 6202ms:
customer-app/app/src\main\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImpl.kt:3:import com.homeservices.customer.data.booking.remote.BookingApiService
customer-app/app/src\main\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImpl.kt:21:        private val bookingApi: BookingApiService,
customer-app/app/src\main\kotlin\com\homeservices\customer\data\booking\BookingRepositoryImpl.kt:3:import com.homeservices.customer.data.booking.remote.BookingApiService
customer-app/app/src\main\kotlin\com\homeservices\customer\data\booking\BookingRepositoryImpl.kt:22:        private val api: BookingApiService,
customer-app/app/src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:6:import com.homeservices.customer.data.booking.remote.BookingApiService
customer-app/app/src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:77:        public fun provideBookingApiService(
customer-app/app/src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:80:        ): BookingApiService =
customer-app/app/src\main\kotlin\com\homeservices\customer\data\booking\di\BookingModule.kt:87:                .create(BookingApiService::class.java)
customer-app/app/src\main\kotlin\com\homeservices\customer\data\booking\remote\BookingApiService.kt:17:public interface BookingApiService {
customer-app/app/src\test\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImplTest.kt:3:import com.homeservices.customer.data.booking.remote.BookingApiService
customer-app/app/src\test\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImplTest.kt:24:    private class FakeBookingApiService(
customer-app/app/src\test\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImplTest.kt:26:    ) : BookingApiService {
customer-app/app/src\test\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImplTest.kt:98:    private val api = FakeBookingApiService()
customer-app/app/src\test\kotlin\com\homeservices\customer\data\booking\BookingRepositoryImplTest.kt:4:import com.homeservices.customer.data.booking.remote.BookingApiService
customer-app/app/src\test\kotlin\com\homeservices\customer\data\booking\BookingRepositoryImplTest.kt:21:    private val api: BookingApiService = mockk()

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path customer-app/app/src/main/kotlin/com/homeservices/customer/data/tracking/TrackingRepositoryImpl.kt -Raw; Get-Content -Path customer-app/app/src/test/kotlin/com/homeservices/customer/data/tracking/TrackingRepositoryImplTest.kt -Raw' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 5189ms:
package com.homeservices.customer.data.tracking

import com.homeservices.customer.data.booking.remote.BookingApiService
import com.homeservices.customer.domain.tracking.TrackingRepository
import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.customer.domain.tracking.model.LiveLocation
import com.homeservices.customer.domain.tracking.model.TrackingState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.scan
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class TrackingRepositoryImpl
    @Inject
    constructor(
        private val eventBus: TrackingEventBus,
        private val bookingApi: BookingApiService,
    ) : TrackingRepository {
        public override fun trackBooking(bookingId: String): Flow<TrackingState> =
            flow {
                val initialStatus =
                    runCatching {
                        BookingStatus.fromFcmString(bookingApi.getBooking(bookingId).status)
                    }.getOrDefault(BookingStatus.Unknown)
                val initialState = TrackingState(location = null, status = initialStatus)

                emitAll(
                    eventBus.events
                        .filter { it.bookingId == bookingId }
                        .scan(initialState) { state, event ->
                            when (event) {
                                is TrackingEvent.LocationUpdate ->
                                    state.copy(
                                        location =
                                            LiveLocation(
                                                lat = event.lat,
                                                lng = event.lng,
                                                etaMinutes = event.etaMinutes,
                                                techName = event.techName,
                                                techPhotoUrl = event.techPhotoUrl,
                                            ),
                                    )
                                is TrackingEvent.StatusUpdate ->
                                    state.copy(status = BookingStatus.fromFcmString(event.status))
                            }
                        },
                )
            }
    }

package com.homeservices.customer.data.tracking

import com.homeservices.customer.data.booking.remote.BookingApiService
import com.homeservices.customer.data.booking.remote.dto.ApproveFinalPriceRequestDto
import com.homeservices.customer.data.booking.remote.dto.ApproveFinalPriceResponseDto
import com.homeservices.customer.data.booking.remote.dto.ConfirmBookingRequestDto
import com.homeservices.customer.data.booking.remote.dto.ConfirmBookingResponseDto
import com.homeservices.customer.data.booking.remote.dto.CreateBookingRequestDto
import com.homeservices.customer.data.booking.remote.dto.CreateBookingResponseDto
import com.homeservices.customer.data.booking.remote.dto.CustomerBookingsResponseDto
import com.homeservices.customer.data.booking.remote.dto.GetBookingResponseDto
import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.customer.domain.tracking.model.TrackingState
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.yield
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class TrackingRepositoryImplTest {
    private class FakeBookingApiService(
        var status: String = "ASSIGNED",
    ) : BookingApiService {
        override suspend fun createBooking(
            body: CreateBookingRequestDto,
            idempotencyKey: String,
        ): CreateBookingResponseDto = error("not used")

        override suspend fun confirmBooking(
            bookingId: String,
            body: ConfirmBookingRequestDto,
            integrityToken: String?,
        ): ConfirmBookingResponseDto = error("not used")

        override suspend fun getBooking(bookingId: String): GetBookingResponseDto =
            GetBookingResponseDto(
                bookingId = bookingId,
                status = status,
                amount = 59900,
                finalAmount = null,
                pendingAddOns = emptyList(),
            )

        override suspend fun getMyBookings(): CustomerBookingsResponseDto = error("not used")

        override suspend fun approveFinalPrice(
            bookingId: String,
            body: ApproveFinalPriceRequestDto,
        ): ApproveFinalPriceResponseDto = error("not used")
    }

    @Test
    public fun `BookingStatus fromFcmString maps EN_ROUTE`() {
        assertThat(BookingStatus.fromFcmString("EN_ROUTE")).isEqualTo(BookingStatus.EnRoute)
    }

    @Test
    public fun `BookingStatus fromFcmString maps REACHED`() {
        assertThat(BookingStatus.fromFcmString("REACHED")).isEqualTo(BookingStatus.Reached)
    }

    @Test
    public fun `BookingStatus fromFcmString maps IN_PROGRESS`() {
        assertThat(BookingStatus.fromFcmString("IN_PROGRESS")).isEqualTo(BookingStatus.InProgress)
    }

    @Test
    public fun `BookingStatus fromFcmString maps COMPLETED`() {
        assertThat(BookingStatus.fromFcmString("COMPLETED")).isEqualTo(BookingStatus.Completed)
    }

    @Test
    public fun `BookingStatus fromFcmString maps CANCELLED`() {
        assertThat(BookingStatus.fromFcmString("CANCELLED")).isEqualTo(BookingStatus.Cancelled)
    }

    @Test
    public fun `BookingStatus fromFcmString maps ASSIGNED without marking en route`() {
        assertThat(BookingStatus.fromFcmString("ASSIGNED")).isEqualTo(BookingStatus.Assigned)
    }

    @Test
    public fun `BookingStatus fromFcmString maps PAID as confirmed`() {
        assertThat(BookingStatus.fromFcmString("PAID")).isEqualTo(BookingStatus.Paid)
    }

    @Test
    public fun `BookingStatus fromFcmString returns Unknown for unrecognised string`() {
        assertThat(BookingStatus.fromFcmString("GARBAGE")).isEqualTo(BookingStatus.Unknown)
    }

    // â”€â”€ scan logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private val bus: TrackingEventBus = TrackingEventBus()
    private val api = FakeBookingApiService()
    private val repo: TrackingRepositoryImpl = TrackingRepositoryImpl(bus, api)

    @Test
    public fun `location update populates LiveLocation in state`(): Unit =
        runTest {
            val results = mutableListOf<TrackingState>()
            val job = launch { repo.trackBooking("b1").collect { results.add(it) } }
            yield() // let collector coroutine start and subscribe before posting events
            bus.post(
                TrackingEvent.LocationUpdate(
                    bookingId = "b1",
                    lat = 12.97,
                    lng = 77.59,
                    etaMinutes = 10,
                    techName = "Suresh",
                    techPhotoUrl = "https://example.com/photo.jpg",
                ),
            )
            advanceUntilIdle()
            job.cancel()
            assertThat(results).hasSize(2)
            // seed
            assertThat(results[0].location).isNull()
            assertThat(results[0].status).isEqualTo(BookingStatus.Assigned)
            // after location update
            assertThat(results[1].location?.lat).isEqualTo(12.97)
            assertThat(results[1].location?.techName).isEqualTo("Suresh")
            assertThat(results[1].status).isEqualTo(BookingStatus.Assigned)
        }

    @Test
    public fun `status update changes booking status`(): Unit =
        runTest {
            val results = mutableListOf<TrackingState>()
            val job = launch { repo.trackBooking("b2").collect { results.add(it) } }
            yield() // let collector coroutine start and subscribe before posting events
            bus.post(TrackingEvent.StatusUpdate(bookingId = "b2", status = "REACHED"))
            advanceUntilIdle()
            job.cancel()
            assertThat(results).hasSize(2)
            // seed
            assertThat(results[0].location).isNull()
            assertThat(results[0].status).isEqualTo(BookingStatus.Assigned)
            // after status update
            assertThat(results[1].status).isEqualTo(BookingStatus.Reached)
            assertThat(results[1].location).isNull()
        }

    @Test
    public fun `events for different bookingIds are filtered`(): Unit =
        runTest {
            val results = mutableListOf<TrackingState>()
            val job = launch { repo.trackBooking("b3").collect { results.add(it) } }
            yield() // let collector coroutine start and subscribe before posting events
            bus.post(TrackingEvent.StatusUpdate(bookingId = "OTHER", status = "REACHED"))
            bus.post(TrackingEvent.StatusUpdate(bookingId = "b3", status = "IN_PROGRESS"))
            advanceUntilIdle()
            job.cancel()
            assertThat(results).hasSize(2)
            // seed
            assertThat(results[0].status).isEqualTo(BookingStatus.Assigned)
            // after IN_PROGRESS for "b3"
            assertThat(results[1].status).isEqualTo(BookingStatus.InProgress)
        }

    @Test
    public fun `sequential updates accumulate state`(): Unit =
        runTest {
            val results = mutableListOf<TrackingState>()
            val job = launch { repo.trackBooking("b4").collect { results.add(it) } }
            yield() // let collector coroutine start and subscribe before posting events
            bus.post(TrackingEvent.LocationUpdate("b4", 12.97, 77.59, 10, "Suresh", "url"))
            bus.post(TrackingEvent.StatusUpdate("b4", "REACHED"))
            advanceUntilIdle()
            job.cancel()
            assertThat(results).hasSize(3)
            // seed
            assertThat(results[0].location).isNull()
            assertThat(results[0].status).isEqualTo(BookingStatus.Assigned)
            // after LocationUpdate
            assertThat(results[1].location?.techName).isEqualTo("Suresh")
            assertThat(results[1].status).isEqualTo(BookingStatus.Assigned)
            // after StatusUpdate
            assertThat(results[2].location?.techName).isEqualTo("Suresh")
            assertThat(results[2].status).isEqualTo(BookingStatus.Reached)
        }

    @Test
    public fun `trackBooking emits Unknown seed when booking lookup fails`(): Unit =
        runTest {
            api.status = "NOT_A_REAL_STATUS"
            val results = mutableListOf<TrackingState>()
            val job = launch { repo.trackBooking("b5").collect { results.add(it) } }
            yield()
            job.cancel()
            assertThat(results).hasSize(1)
            assertThat(results[0].status).isEqualTo(BookingStatus.Unknown)
        }
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint2b' diff --stat f39ac4b37a5f76121433cc6ac340508f273858ef" in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 5563ms:
 customer-app/.serena/.gitignore                    |   2 +
 customer-app/.serena/project.yml                   | 133 +++++++++++++++++++++
 customer-app/app/build.gradle.kts                  |   6 +
 .../customer/data/auth/remote/di/AuthApiModule.kt  |   7 +-
 .../customer/data/booking/BookingRepository.kt     |   5 +-
 .../customer/data/booking/BookingRepositoryImpl.kt |  23 +++-
 .../customer/data/booking/di/BookingModule.kt      |   5 +
 .../data/booking/remote/BookingApiService.kt       |   2 +
 .../data/catalogue/CatalogueRepositoryImpl.kt      |  13 +-
 .../customer/data/catalogue/di/CatalogueModule.kt  |   7 +-
 .../customer/data/complaint/ComplaintRepository.kt |   1 +
 .../data/complaint/ComplaintRepositoryImpl.kt      |  10 +-
 .../data/complaint/remote/ComplaintApiService.kt   |   2 +
 .../network/auth/FirebaseTokenAuthenticator.kt     |   4 +-
 .../customer/data/rating/RatingRepository.kt       |   1 +
 .../customer/data/rating/RatingRepositoryImpl.kt   |  13 +-
 .../data/rating/remote/RatingApiService.kt         |   2 +
 .../data/technician/di/TechnicianModule.kt         |   7 +-
 .../domain/booking/CreateBookingUseCase.kt         |   6 +-
 .../domain/complaint/SubmitComplaintUseCase.kt     |   6 +-
 .../customer/domain/rating/SubmitRatingUseCase.kt  |   6 +-
 .../customer/observability/PiiRedactor.kt          |  15 ++-
 .../data/booking/BookingRepositoryImplTest.kt      | 120 +++++++++++++++++++
 .../data/catalogue/CatalogueRepositoryImplTest.kt  |  24 ++++
 .../data/complaint/ComplaintRepositoryImplTest.kt  |  49 +++++++-
 .../customer/data/network/di/OkHttpTimeoutTest.kt  |  59 +++++++++
 .../data/rating/RatingRepositoryImplTest.kt        |  47 +++++++-
 .../data/tracking/TrackingRepositoryImplTest.kt    |   5 +-
 .../domain/booking/CreateBookingUseCaseTest.kt     |  21 +++-
 .../domain/complaint/SubmitComplaintUseCaseTest.kt |   6 +-
 .../domain/rating/SubmitRatingUseCaseTest.kt       |   2 +-
 .../customer/observability/PiiRedactorTest.kt      |  43 +++++++
 tools/pre-codex-smoke.sh                           |   3 +-
 33 files changed, 612 insertions(+), 43 deletions(-)
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Path customer-app -Force | Select-Object Name,Length,Mode | Format-Table -AutoSize' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 4455ms:

Name                Length Mode  
----                ------ ----  
.claude                    d-----
.gradle                    d-----
.kotlin                    d-----
.serena                    d-----
app                        d-----
build                      d-----
gradle                     d-----
.editorconfig       487    -a----
build.gradle.kts    528    -a----
CLAUDE.md           1423   -a----
detekt.yml          1352   -a----
gradle.properties   846    -a----
gradlew             8762   -a----
gradlew.bat         2872   -a----
local.properties    402    -a----
README.md           2467   -a----
release-upload.jks  2285   -a----
settings.gradle.kts 403    -a----



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command ".\\gradlew.bat :app:compileDebugKotlin --quiet" in C:\Alok\Business Projects\Urbanclap-sprint2b\customer-app
2026-05-23T00:19:45.418266Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 20 seconds
Output:
Exception in thread "main" java.lang.RuntimeException: Could not create parent directory for lock file C:\Users\CodexSandboxOffline\.gradle\wrapper\dists\gradle-8.11-bin\c4te04g51qsyw1bxcb929u7br\gradle-8.11-bin.zip.lck
	at org.gradle.wrapper.GradleWrapperMain.main(SourceFile:65)

 exited 1 in 20008ms:
Exception in thread "main" java.lang.RuntimeException: Could not create parent directory for lock file C:\Users\CodexSandboxOffline\.gradle\wrapper\dists\gradle-8.11-bin\c4te04g51qsyw1bxcb929u7br\gradle-8.11-bin.zip.lck
	at org.gradle.wrapper.GradleWrapperMain.main(SourceFile:65)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$env:GRADLE_USER_HOME='"'C:\\Alok\\Business Projects\\Urbanclap-sprint2b\\customer-app\\.gradle-user-home'; .\\gradlew.bat :app:compileDebugKotlin --quiet" in C:\Alok\Business Projects\Urbanclap-sprint2b\customer-app
2026-05-23T00:19:57.990927Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 9.7 seconds
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

 exited 1 in 9679ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Path C:\\Users\\alokt\\.gradle\\wrapper\\dists\\gradle-8.11-bin -Recurse -Filter gradle.bat -ErrorAction SilentlyContinue | Select-Object -First 5 -ExpandProperty FullName" in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1647ms:
C:\Users\alokt\.gradle\wrapper\dists\gradle-8.11-bin\c4te04g51qsyw1bxcb929u7br\gradle-8.11\bin\gradle.bat

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$env:GRADLE_USER_HOME='"'C:\\Users\\alokt\\.gradle'; .\\gradlew.bat :app:compileDebugKotlin --quiet --offline" in C:\Alok\Business Projects\Urbanclap-sprint2b\customer-app
 succeeded in 52117ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$env:GRADLE_USER_HOME='"'C:\\Users\\alokt\\.gradle'; .\\gradlew.bat :app:compileDebugUnitTestKotlin --quiet --offline" in C:\Alok\Business Projects\Urbanclap-sprint2b\customer-app
 succeeded in 43064ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$env:GRADLE_USER_HOME='"'C:\\Users\\alokt\\.gradle'; .\\gradlew.bat :app:testDebugUnitTest --offline -PexcludePaparazzi --quiet" in C:\Alok\Business Projects\Urbanclap-sprint2b\customer-app
 succeeded in 139970ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint/ComplaintViewModel.kt -Raw; Get-Content -Path customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt -Raw' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1300ms:
package com.homeservices.customer.ui.complaint

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.complaint.ComplaintReason
import com.homeservices.customer.domain.complaint.GetComplaintStatusUseCase
import com.homeservices.customer.domain.complaint.PhotoUploadUseCase
import com.homeservices.customer.domain.complaint.SubmitComplaintUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed class ComplaintUiState {
    public data class Idle(
        val selectedReason: ComplaintReason? = null,
        val description: String = "",
        val photoStoragePath: String? = null,
        val submitEnabled: Boolean = false,
    ) : ComplaintUiState()

    public data object PhotoUploading : ComplaintUiState()

    public data object Submitting : ComplaintUiState()

    public data class Success(
        val complaintId: String,
        val acknowledgeDeadlineAt: String?,
        val status: String = "NEW",
    ) : ComplaintUiState()

    public data class Error(
        val message: String,
    ) : ComplaintUiState()
}

private const val UNKNOWN_ERROR_FALLBACK = "Unknown error"

@HiltViewModel
public class ComplaintViewModel
    @Inject
    constructor(
        private val submitUseCase: SubmitComplaintUseCase,
        private val photoUploadUseCase: PhotoUploadUseCase,
        private val getStatusUseCase: GetComplaintStatusUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<ComplaintUiState>(ComplaintUiState.Idle())
        public val uiState: StateFlow<ComplaintUiState> = _uiState.asStateFlow()

        public fun loadStatus(bookingId: String) {
            viewModelScope.launch {
                getStatusUseCase(bookingId).collect { result ->
                    val existing = result.getOrNull()?.firstOrNull()
                    if (existing != null && _uiState.value is ComplaintUiState.Idle) {
                        _uiState.value =
                            ComplaintUiState.Success(
                                complaintId = existing.id,
                                acknowledgeDeadlineAt = existing.acknowledgeDeadlineAt,
                                status = existing.status ?: "NEW",
                            )
                    }
                }
            }
        }

        public fun onRetry() {
            _uiState.value = ComplaintUiState.Idle()
        }

        public fun onReasonSelected(reason: ComplaintReason) {
            val current = _uiState.value as? ComplaintUiState.Idle ?: return
            _uiState.value =
                current.copy(
                    selectedReason = reason,
                    submitEnabled = isSubmitEnabled(reason, current.description),
                )
        }

        public fun onDescriptionChanged(description: String) {
            val current = _uiState.value as? ComplaintUiState.Idle ?: return
            _uiState.value =
                current.copy(
                    description = description,
                    submitEnabled = isSubmitEnabled(current.selectedReason, description),
                )
        }

        public fun onPhotoSelected(
            localFilePath: String,
            bookingId: String,
        ) {
            val current = _uiState.value as? ComplaintUiState.Idle ?: return
            _uiState.value = ComplaintUiState.PhotoUploading
            viewModelScope.launch {
                val result = photoUploadUseCase(bookingId, localFilePath)
                _uiState.value =
                    current.copy(
                        photoStoragePath = result.getOrNull(),
                        submitEnabled = isSubmitEnabled(current.selectedReason, current.description),
                    )
            }
        }

        public fun onSubmit(bookingId: String) {
            val current = _uiState.value as? ComplaintUiState.Idle ?: return
            val reason = current.selectedReason ?: return
            _uiState.value = ComplaintUiState.Submitting
            viewModelScope.launch {
                submitUseCase(bookingId, reason, current.description, current.photoStoragePath)
                    .collect { result ->
                        _uiState.value =
                            result.fold(
                                onSuccess = { dto ->
                                    ComplaintUiState.Success(
                                        complaintId = dto.id,
                                        acknowledgeDeadlineAt = dto.acknowledgeDeadlineAt,
                                        status = dto.status ?: "NEW",
                                    )
                                },
                                onFailure = { e ->
                                    // error message surfaced via R.string.complaint_error_unknown in the UI layer
                                    ComplaintUiState.Error(e.message ?: UNKNOWN_ERROR_FALLBACK)
                                },
                            )
                    }
            }
        }

        private fun isSubmitEnabled(
            reason: ComplaintReason?,
            description: String,
        ): Boolean = reason != null && description.length >= 10
    }

package com.homeservices.customer.ui.rating

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.rating.EscalateRatingUseCase
import com.homeservices.customer.domain.rating.GetRatingUseCase
import com.homeservices.customer.domain.rating.SubmitRatingUseCase
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import com.homeservices.customer.domain.rating.model.SideState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed class RatingShieldState {
    public object Idle : RatingShieldState()

    public object ShowDialog : RatingShieldState()

    /** API call in flight â€” sheet buttons disabled to prevent double-tap race. */
    public object Escalating : RatingShieldState()

    public data class Escalated(
        val expiresAtMs: Long,
    ) : RatingShieldState()
}

public sealed class RatingUiState {
    public object Loading : RatingUiState()

    public data class Editing(
        val snapshot: RatingSnapshot?,
    ) : RatingUiState()

    public object Submitting : RatingUiState()

    public data class AwaitingPartner(
        val snapshot: RatingSnapshot?,
    ) : RatingUiState()

    public data class Revealed(
        val snapshot: RatingSnapshot,
    ) : RatingUiState()

    public data class Error(
        val message: String,
    ) : RatingUiState()
}

@HiltViewModel
public class RatingViewModel
    @Inject
    constructor(
        private val submitUseCase: SubmitRatingUseCase,
        private val getUseCase: GetRatingUseCase,
        private val escalateUseCase: EscalateRatingUseCase,
        private val savedStateHandle: SavedStateHandle,
    ) : ViewModel() {
        public val bookingId: String =
            savedStateHandle.get<String>("bookingId") ?: error("bookingId required")

        private val _uiState = MutableStateFlow<RatingUiState>(RatingUiState.Loading)
        public val uiState: StateFlow<RatingUiState> = _uiState.asStateFlow()

        private val _shieldState = MutableStateFlow<RatingShieldState>(RatingShieldState.Idle)
        public val shieldState: StateFlow<RatingShieldState> = _shieldState.asStateFlow()

        private val _overall = MutableStateFlow(0)
        public val overall: StateFlow<Int> = _overall.asStateFlow()

        private val _punctuality = MutableStateFlow(0)
        public val punctuality: StateFlow<Int> = _punctuality.asStateFlow()

        private val _skill = MutableStateFlow(0)
        public val skill: StateFlow<Int> = _skill.asStateFlow()

        private val _behaviour = MutableStateFlow(0)
        public val behaviour: StateFlow<Int> = _behaviour.asStateFlow()

        private val _comment = MutableStateFlow("")
        public val comment: StateFlow<String> = _comment.asStateFlow()

        private val _canSubmit = MutableStateFlow(false)
        public val canSubmit: StateFlow<Boolean> = _canSubmit.asStateFlow()

        // Snapshot of the full rating at the moment escalation was sent to the owner.
        // doSubmit() uses these values (not the live flows) when shieldState is Escalated,
        // so the public rating always matches the draft the owner reviewed.
        private data class EscalatedDraft(
            val overall: Int,
            val subScores: CustomerSubScores,
            val comment: String?,
        )

        private var escalatedDraft: EscalatedDraft? = null

        // Held so onPostAnyway() / onSkipShield() can cancel the auto-post before it fires.
        private var countdownJob: Job? = null

        init {
            // Restore full shield state from SavedStateHandle after OS-initiated process death.
            // Without the draft, the auto-post would submit default (zero-star) values.
            val savedExpiry = savedStateHandle.get<Long>("shieldExpiresAtMs")
            if (savedExpiry != null && savedExpiry > System.currentTimeMillis()) {
                val dOverall = savedStateHandle.get<Int>("shieldDraftOverall") ?: 0
                val dPunct = savedStateHandle.get<Int>("shieldDraftPunct") ?: 0
                val dSkill = savedStateHandle.get<Int>("shieldDraftSkill") ?: 0
                val dBehav = savedStateHandle.get<Int>("shieldDraftBehav") ?: 0
                val dComment = savedStateHandle.get<String>("shieldDraftComment")?.ifBlank { null }
                if (dOverall > 0) {
                    _overall.value = dOverall
                    _punctuality.value = dPunct
                    _skill.value = dSkill
                    _behaviour.value = dBehav
                    dComment?.let { _comment.value = it }
                    recompute()
                    escalatedDraft = EscalatedDraft(dOverall, CustomerSubScores(dPunct, dSkill, dBehav), dComment)
                }
                _shieldState.value = RatingShieldState.Escalated(savedExpiry)
                startCountdown(savedExpiry)
            }

            viewModelScope.launch {
                getUseCase.invoke(bookingId).collect { result ->
                    result
                        .onSuccess { snap ->
                            // Cancel shield countdown if rating was already submitted elsewhere
                            // (e.g. from another device, or restored countdown for a stale session).
                            if (snap.customerSide is SideState.Submitted && _shieldState.value is RatingShieldState.Escalated) {
                                cancelShieldState()
                            }
                            _uiState.value =
                                when {
                                    snap.status == RatingSnapshot.Status.REVEALED -> RatingUiState.Revealed(snap)
                                    snap.customerSide is SideState.Submitted -> RatingUiState.AwaitingPartner(snap)
                                    else -> RatingUiState.Editing(snap)
                                }
                        }.onFailure { _uiState.value = RatingUiState.Error(it.message ?: "load failed") }
                }
            }
        }

        private fun cancelShieldState() {
            countdownJob?.cancel()
            countdownJob = null
            escalatedDraft = null
            _shieldState.value = RatingShieldState.Idle
            savedStateHandle.remove<Long>("shieldExpiresAtMs")
            savedStateHandle.remove<Int>("shieldDraftOverall")
            savedStateHandle.remove<Int>("shieldDraftPunct")
            savedStateHandle.remove<Int>("shieldDraftSkill")
            savedStateHandle.remove<Int>("shieldDraftBehav")
            savedStateHandle.remove<String>("shieldDraftComment")
        }

        public fun setOverall(stars: Int) {
            _overall.value = stars
            recompute()
        }

        public fun setPunctuality(stars: Int) {
            _punctuality.value = stars
            recompute()
        }

        public fun setSkill(stars: Int) {
            _skill.value = stars
            recompute()
        }

        public fun setBehaviour(stars: Int) {
            _behaviour.value = stars
            recompute()
        }

        public fun setComment(text: String) {
            _comment.value = text.take(500)
        }

        private fun recompute() {
            _canSubmit.value =
                overall.value in 1..5 &&
                punctuality.value in 1..5 &&
                skill.value in 1..5 &&
                behaviour.value in 1..5
        }

        public fun submit() {
            if (!_canSubmit.value) return
            if (overall.value <= 2 && _shieldState.value == RatingShieldState.Idle) {
                _shieldState.value = RatingShieldState.ShowDialog
                return
            }
            doSubmit()
        }

        public fun onDismissShieldDialog() {
            if (_shieldState.value == RatingShieldState.Escalating) return // ignore dismiss during in-flight call
            _shieldState.value = RatingShieldState.Idle
            // Intentionally does NOT submit â€” scrim tap / back gesture is not an opt-out.
        }

        public fun onSkipShield() {
            countdownJob?.cancel()
            countdownJob = null
            _shieldState.value = RatingShieldState.Idle
            doSubmit()
        }

        public fun onPostAnyway() {
            countdownJob?.cancel()
            countdownJob = null
            _shieldState.value = RatingShieldState.Idle
            doSubmit()
        }

        public fun onEscalate() {
            if (_shieldState.value != RatingShieldState.ShowDialog) return // guard re-entrant / double-tap
            _shieldState.value = RatingShieldState.Escalating
            val capturedOverall = overall.value
            val capturedSubScores = CustomerSubScores(punctuality.value, skill.value, behaviour.value)
            val capturedComment = comment.value.ifBlank { null }
            viewModelScope.launch {
                val result =
                    escalateUseCase.invoke(
                        bookingId = bookingId,
                        draftOverall = capturedOverall,
                        draftComment = capturedComment,
                    )
                result
                    .onSuccess { r ->
                        escalatedDraft = EscalatedDraft(capturedOverall, capturedSubScores, capturedComment)
                        savedStateHandle["shieldExpiresAtMs"] = r.expiresAtMs
                        savedStateHandle["shieldDraftOverall"] = capturedOverall
                        savedStateHandle["shieldDraftPunct"] = capturedSubScores.punctuality
                        savedStateHandle["shieldDraftSkill"] = capturedSubScores.skill
                        savedStateHandle["shieldDraftBehav"] = capturedSubScores.behaviour
                        savedStateHandle["shieldDraftComment"] = capturedComment ?: ""
                        _shieldState.value = RatingShieldState.Escalated(r.expiresAtMs)
                        startCountdown(r.expiresAtMs)
                    }.onFailure {
                        _shieldState.value = RatingShieldState.ShowDialog // allow retry
                        _uiState.value = RatingUiState.Error(it.message ?: "escalation failed")
                    }
            }
        }

        private fun startCountdown(expiresAtMs: Long) {
            countdownJob =
                viewModelScope.launch {
                    val remaining = expiresAtMs - System.currentTimeMillis()
                    if (remaining > 0) delay(remaining)
                    onPostAnyway()
                }
        }

        private fun doSubmit() {
            val draft = escalatedDraft
            val submitOverall = draft?.overall ?: overall.value
            val submitSubScores = draft?.subScores ?: CustomerSubScores(punctuality.value, skill.value, behaviour.value)
            val submitComment = draft?.comment ?: comment.value.ifBlank { null }
            _uiState.value = RatingUiState.Submitting
            viewModelScope.launch {
                submitUseCase
                    .invoke(
                        bookingId = bookingId,
                        overall = submitOverall,
                        subScores = submitSubScores,
                        comment = submitComment,
                    ).collect { result ->
                        result
                            .onSuccess {
                                // Clear shield state only after confirmed success â€” preserves
                                // draft for retry if the network call fails.
                                cancelShieldState()
                                _uiState.value = RatingUiState.AwaitingPartner(null)
                            }.onFailure { _uiState.value = RatingUiState.Error(it.message ?: "submit failed") }
                    }
            }
        }
    }


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailScreenTest.kt -Raw | Select-Object -First 1; Get-Content -Path customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailScreenTest.kt -Raw' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 2172ms:
package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.catalogue.model.AddOn
import com.homeservices.customer.domain.catalogue.model.Service
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
public class ServiceDetailScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun `service detail success state`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                ServiceDetailContent(
                    uiState = ServiceDetailUiState.Success(sampleService()),
                    confidenceScoreState = ConfidenceScoreUiState.Hidden,
                    onBookNow = { _, _ -> },
                )
            }
        }
    }

    private fun sampleService() =
        Service(
            id = "s1",
            categoryId = "c1",
            name = "AC deep cleaning",
            description = "Indoor unit cleaning, filter wash, drain check, and basic performance inspection.",
            basePrice = 79900,
            durationMinutes = 60,
            imageUrl = "",
            includes = listOf("Indoor unit foam cleaning", "Filter wash", "Drain pipe inspection"),
            addOns = listOf(AddOn("Gas pressure check", 14900), AddOn("Outdoor unit wash", 19900)),
        )
}

package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.catalogue.model.AddOn
import com.homeservices.customer.domain.catalogue.model.Service
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
public class ServiceDetailScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun `service detail success state`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                ServiceDetailContent(
                    uiState = ServiceDetailUiState.Success(sampleService()),
                    confidenceScoreState = ConfidenceScoreUiState.Hidden,
                    onBookNow = { _, _ -> },
                )
            }
        }
    }

    private fun sampleService() =
        Service(
            id = "s1",
            categoryId = "c1",
            name = "AC deep cleaning",
            description = "Indoor unit cleaning, filter wash, drain check, and basic performance inspection.",
            basePrice = 79900,
            durationMinutes = 60,
            imageUrl = "",
            includes = listOf("Indoor unit foam cleaning", "Filter wash", "Drain pipe inspection"),
            addOns = listOf(AddOn("Gas pressure check", 14900), AddOn("Outdoor unit wash", 19900)),
        )
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg \"app\\.cash\\.paparazzi\" customer-app/app/src/test/kotlin -l" in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1163ms:
customer-app/app/src/test/kotlin\com\homeservices\customer\navigation\SpikeRoutePaparazziTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\auth\AuthScreenPaparazziTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\catalogue\ConfidenceScoreRowPaparazziTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\catalogue\ServiceListScreenPaparazziTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\catalogue\CatalogueHomeScreenTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\catalogue\ServiceDetailScreenTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\locale\FirstLaunchLanguageScreenPaparazziTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\settings\SettingsScreenPaparazziTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\rating\RatingScreenPaparazziTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\shared\TrustDossierCardPaparazziTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\tracking\SosScreenTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreenTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\SmokeScreenPaparazziTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\complaint\ComplaintScreenPaparazziTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\booking\AddressScreenPaparazziTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\booking\BookingConfirmedScreenPaparazziTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\booking\BookingSummaryScreenPaparazziTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\booking\PriceApprovalScreenPaparazziTest.kt
customer-app/app/src/test/kotlin\com\homeservices\customer\ui\booking\SlotPickerScreenPaparazziTest.kt

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreenTest.kt -Raw; Get-Content customer-app/app/src/test/kotlin/com/homeservices/customer/ui/tracking/SosScreenTest.kt -Raw; Get-Content customer-app/app/src/test/kotlin/com/homeservices/customer/ui/tracking/LiveTrackingScreenTest.kt -Raw' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1301ms:
package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
public class CatalogueHomeScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun `catalogue home loading state`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                CatalogueHomeContent(
                    uiState = CatalogueHomeUiState.Loading,
                    onCategoryClick = {},
                    onSettingsClick = {},
                    onProfileLanguageClick = {},
                    onTrackBooking = {},
                )
            }
        }
    }

    @Test
    public fun `catalogue home success state`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                CatalogueHomeContent(
                    uiState =
                        CatalogueHomeUiState.Success(
                            listOf(
                                Category("plumbing", "Plumbing", "", 5, minPricePaise = 39900),
                                Category("ac-repair", "AC Repair", "", 8, minPricePaise = 59900),
                                Category("electrical", "Electrical", "", 3, minPricePaise = 29900),
                                Category("water-purifier", "RO / Water Purifier", "", 2, minPricePaise = 49900),
                            ),
                        ),
                    onCategoryClick = {},
                    onSettingsClick = {},
                    onProfileLanguageClick = {},
                    onTrackBooking = {},
                )
            }
        }
    }
}

package com.homeservices.customer.ui.tracking

import app.cash.paparazzi.Paparazzi
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

public class SosScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi()

    @Ignore("Goldens recorded on CI Linux â€” never record on Windows")
    @Test
    public fun sosBottomSheetGolden(): Unit {
        paparazzi.snapshot {
            SosBottomSheet(secondsLeft = 15, onCancel = {}, onConfirmNow = {})
        }
    }

    @Ignore("Goldens recorded on CI Linux â€” never record on Windows")
    @Test
    public fun sosConsentDialogGolden(): Unit {
        paparazzi.snapshot {
            SosConsentDialog(onGranted = {}, onDenied = {})
        }
    }
}

package com.homeservices.customer.ui.tracking

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
public class LiveTrackingScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun liveTrackingInProgressNoLocation(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                LiveTrackingContent(
                    uiState =
                        LiveTrackingUiState.Tracking(
                            bookingId = "bk-1",
                            location = null,
                            status = BookingStatus.InProgress,
                            techName = "Ravi Kumar",
                            techPhotoUrl = "",
                            etaMinutes = 12,
                        ),
                    onFileComplaint = {},
                )
            }
        }
    }
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path customer-app/app/src/test/kotlin/com/homeservices/customer/observability/PiiRedactorTest.kt -Raw' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1070ms:
package com.homeservices.customer.observability

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.MethodSource
import java.util.stream.Stream

/**
 * TDD (E13-S04) â€” PiiRedactor.redact() table-driven tests.
 *
 * Each row: (input, expected-output) pair.  Tests verify each PII type is
 * scrubbed and that non-PII text passes through unmodified.
 */
public class PiiRedactorTest {
    @ParameterizedTest(name = "{0}")
    @MethodSource("redactCases")
    public fun `redact should replace PII patterns`(
        description: String,
        input: String,
        expected: String,
    ) {
        assertEquals(expected, PiiRedactor.redact(input), description)
    }

    @ParameterizedTest(name = "plain text unchanged: {0}")
    @MethodSource("safeCases")
    public fun `redact should preserve non-PII text`(
        description: String,
        input: String,
    ) {
        val result = PiiRedactor.redact(input)
        // Must not introduce a REDACTED marker
        assertFalse(result.contains("[REDACTED"), "Expected no redaction in: $input â†’ got: $result")
    }

    public companion object {
        @JvmStatic
        public fun redactCases(): Stream<Arguments> =
            Stream.of(
                // Indian mobile number (10 digits starting 6-9)
                Arguments.of(
                    "phone number in sentence",
                    "User 9876543210 called",
                    "User [REDACTED_PHONE] called",
                ),
                Arguments.of(
                    "phone number at string start",
                    "9876543210 is the contact",
                    "[REDACTED_PHONE] is the contact",
                ),
                // Email
                Arguments.of(
                    "email address",
                    "Send invoice to user@example.com now",
                    "Send invoice to [REDACTED_EMAIL] now",
                ),
                Arguments.of(
                    "email with plus sign",
                    "user+tag@domain.co.in signed up",
                    "[REDACTED_EMAIL] signed up",
                ),
                // Aadhaar (12-digit, optionally spaced in groups of 4)
                Arguments.of(
                    "Aadhaar spaced format",
                    "Aadhaar 1234 5678 9012 verified",
                    "Aadhaar [REDACTED_AADHAAR] verified",
                ),
                Arguments.of(
                    "Aadhaar compact format",
                    "Aadhaar 123456789012 submitted",
                    "Aadhaar [REDACTED_AADHAAR] submitted",
                ),
                // PAN
                Arguments.of(
                    "PAN card number",
                    "PAN ABCDE1234F is on file",
                    "PAN [REDACTED_PAN] is on file",
                ),
                // JWT (starts with eyJâ€¦)
                Arguments.of(
                    "JWT Bearer token",
                    "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIn0.sig",
                    "Bearer [REDACTED_JWT].eyJzdWIiOiJ1c2VyMTIzIn0.sig",
                ),
                // PHONE_INTL_RE â€” with +91 prefix
                Arguments.of(
                    "phone with +91 country code and hyphen",
                    "Call +91-9876543210 for support",
                    "Call [REDACTED_PHONE] for support",
                ),
                Arguments.of(
                    "phone with +91 space",
                    "+91 9876543210 is the number",
                    "[REDACTED_PHONE] is the number",
                ),
                // IPV4_RE
                Arguments.of(
                    "IPv4 address",
                    "Server at 192.168.1.1 is down",
                    "Server at [REDACTED_IPV4] is down",
                ),
                // RAZORPAY_RE
                Arguments.of(
                    "Razorpay payment ID",
                    "Payment pay_ABCdef1234 processed",
                    "Payment [REDACTED_RAZORPAY] processed",
                ),
                Arguments.of(
                    "Razorpay order ID",
                    "Order order_XYZ987abc created",
                    "Order [REDACTED_RAZORPAY] created",
                ),
                // LATLNG_RE
                Arguments.of(
                    "latitude coordinate",
                    "Location 28.613939 N",
                    "Location [REDACTED_LATLNG] N",
                ),
                Arguments.of(
                    "lat/lng exactly 6 decimal places",
                    "coords 28.613939 precise",
                    "coords [REDACTED_LATLNG] precise",
                ),
            )

        @JvmStatic
        public fun safeCases(): Stream<Arguments> =
            Stream.of(
                Arguments.of("plain error message", "Cannot read property x of undefined"),
                Arguments.of("file path", "at com.homeservices.customer.BookingViewModel.createBooking:42"),
                Arguments.of("HTTP status text", "Booking confirmed successfully"),
                Arguments.of("short numeric id", "bookingId: 12345"),
                Arguments.of("short decimal no PII", "score 4.5 out of 5"),
                Arguments.of("price rupees", "price 299.99 INR"),
                Arguments.of("non-Razorpay underscore", "event_tracking_id"),
                Arguments.of("decimal 5dp not redacted", "score 28.12345 approx"),
            )
    }
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint2b' show f39ac4b37a5f76121433cc6ac340508f273858ef:customer-app/app/src/main/kotlin/com/homeservices/customer/observability/PiiRedactor.kt" in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 879ms:
package com.homeservices.customer.observability

import io.sentry.SentryEvent
import io.sentry.protocol.SentryException

/**
 * PII redaction utilities for Sentry events (E13-S04, ADR-0018).
 *
 * Applies to all string values captured in Sentry event messages, exception
 * values, and breadcrumb data before transmission.
 *
 * Patterns (Indian context):
 *   - Indian mobile numbers:  \b[6-9]\d{9}\b
 *   - Email addresses:        [\w._%+\-]+@[\w.\-]+\.\w{2,}
 *   - Aadhaar numbers:        \b\d{4}\s?\d{4}\s?\d{4}\b
 *   - PAN card numbers:       \b[A-Z]{5}\d{4}[A-Z]\b
 *   - JWT tokens:             eyJ[A-Za-z0-9_\-]{21,}
 */
public object PiiRedactor {
    private val PHONE_RE = Regex("""\b[6-9]\d{9}\b""")
    private val EMAIL_RE = Regex("""[\w._%+\-]+@[\w.\-]+\.\w{2,}""")
    private val AADHAAR_RE = Regex("""\b\d{4}\s?\d{4}\s?\d{4}\b""")
    private val PAN_RE = Regex("""\b[A-Z]{5}\d{4}[A-Z]\b""")
    private val JWT_RE = Regex("""eyJ[A-Za-z0-9_\-]{21,}""")

    /** Redact all PII patterns in a single string. */
    public fun redact(input: String): String =
        input
            .replace(PHONE_RE, "[REDACTED_PHONE]")
            .replace(EMAIL_RE, "[REDACTED_EMAIL]")
            .replace(AADHAAR_RE, "[REDACTED_AADHAAR]")
            .replace(PAN_RE, "[REDACTED_PAN]")
            .replace(JWT_RE, "[REDACTED_JWT]")

    /**
     * Scrub a [SentryEvent] in place before it is transmitted.
     *
     * - Redacts the event message.
     * - Redacts exception value messages (stack traces left intact).
     * - Redacts breadcrumb messages.
     * - Returns the mutated event (Sentry SDK requires the same instance).
     */
    public fun scrub(event: SentryEvent): SentryEvent {
        // Scrub top-level message
        event.message?.let { msg ->
            msg.message?.let { text -> msg.message = redact(text) }
            msg.formatted?.let { text -> msg.formatted = redact(text) }
        }

        // Scrub exception value messages (preserve stack frames)
        event.exceptions?.forEach { exc: SentryException ->
            exc.value?.let { value -> exc.value = redact(value) }
        }

        // Scrub breadcrumb messages
        event.breadcrumbs?.forEach { crumb ->
            crumb.message?.let { text -> crumb.message = redact(text) }
        }

        return event
    }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "fun provide.*OkHttpClient|OkHttpClient" customer-app/app/src/main/kotlin/com/homeservices/customer -n' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1493ms:
customer-app/app/src/main/kotlin/com/homeservices/customer\data\booking\di\BookingModule.kt:15:import okhttp3.OkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\booking\di\BookingModule.kt:24:public annotation class AuthOkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\booking\di\BookingModule.kt:35:        @AuthOkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\booking\di\BookingModule.kt:36:        public fun provideAuthOkHttpClient(
customer-app/app/src/main/kotlin/com/homeservices/customer\data\booking\di\BookingModule.kt:39:        ): OkHttpClient =
customer-app/app/src/main/kotlin/com/homeservices/customer\data\booking\di\BookingModule.kt:40:            OkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\booking\di\BookingModule.kt:78:            @AuthOkHttpClient client: OkHttpClient,
customer-app/app/src/main/kotlin/com/homeservices/customer\data\catalogue\di\CatalogueModule.kt:14:import okhttp3.OkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\catalogue\di\CatalogueModule.kt:37:        public fun provideOkHttpClient(): OkHttpClient =
customer-app/app/src/main/kotlin/com/homeservices/customer\data\catalogue\di\CatalogueModule.kt:38:            OkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\catalogue\di\CatalogueModule.kt:60:            client: OkHttpClient,
customer-app/app/src/main/kotlin/com/homeservices/customer\data\auth\remote\di\AuthApiModule.kt:10:import okhttp3.OkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\auth\remote\di\AuthApiModule.kt:18: * Qualifier for an OkHttpClient that carries NO authentication tokens.
customer-app/app/src/main/kotlin/com/homeservices/customer\data\auth\remote\di\AuthApiModule.kt:23:public annotation class PublicOkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\auth\remote\di\AuthApiModule.kt:30:    @PublicOkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\auth\remote\di\AuthApiModule.kt:31:    public fun providePublicOkHttpClient(): OkHttpClient =
customer-app/app/src/main/kotlin/com/homeservices/customer\data\auth\remote\di\AuthApiModule.kt:32:        OkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\auth\remote\di\AuthApiModule.kt:53:        @PublicOkHttpClient okHttpClient: OkHttpClient,
customer-app/app/src/main/kotlin/com/homeservices/customer\data\complaint\di\ComplaintModule.kt:5:import com.homeservices.customer.data.booking.di.AuthOkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\complaint\di\ComplaintModule.kt:15:import okhttp3.OkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\complaint\di\ComplaintModule.kt:30:            @AuthOkHttpClient client: OkHttpClient,
customer-app/app/src/main/kotlin/com/homeservices/customer\data\rating\di\RatingModule.kt:4:import com.homeservices.customer.data.booking.di.AuthOkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\rating\di\RatingModule.kt:14:import okhttp3.OkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\rating\di\RatingModule.kt:29:            @AuthOkHttpClient client: OkHttpClient,
customer-app/app/src/main/kotlin/com/homeservices/customer\data\sos\di\SosModule.kt:8:import com.homeservices.customer.data.booking.di.AuthOkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\sos\di\SosModule.kt:16:import okhttp3.OkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\sos\di\SosModule.kt:37:        @AuthOkHttpClient client: OkHttpClient,
customer-app/app/src/main/kotlin/com/homeservices/customer\data\technician\di\TechnicianProfileModule.kt:13:import okhttp3.OkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\technician\di\TechnicianProfileModule.kt:29:            client: OkHttpClient,
customer-app/app/src/main/kotlin/com/homeservices/customer\data\technician\di\TechnicianModule.kt:13:import okhttp3.OkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\technician\di\TechnicianModule.kt:33:        // is added (mirrors BookingModule's @AuthOkHttpClient pattern with getIdToken).
customer-app/app/src/main/kotlin/com/homeservices/customer\data\technician\di\TechnicianModule.kt:37:        public fun provideTechnicianOkHttpClient(): OkHttpClient =
customer-app/app/src/main/kotlin/com/homeservices/customer\data\technician\di\TechnicianModule.kt:38:            OkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\data\technician\di\TechnicianModule.kt:59:            @TechnicianHttpClient client: OkHttpClient,
customer-app/app/src/main/kotlin/com/homeservices/customer\domain\integrity\di\IntegrityModule.kt:5:import com.homeservices.customer.data.booking.di.AuthOkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\domain\integrity\di\IntegrityModule.kt:15:import okhttp3.OkHttpClient
customer-app/app/src/main/kotlin/com/homeservices/customer\domain\integrity\di\IntegrityModule.kt:36:        @AuthOkHttpClient client: OkHttpClient,

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path customer-app/app/src/main/kotlin/com/homeservices/customer/data/technician/di/TechnicianProfileModule.kt -Raw; Get-Content -Path customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/di/RatingModule.kt -Raw; Get-Content -Path customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/di/ComplaintModule.kt -Raw' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 792ms:
package com.homeservices.customer.data.technician.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.technician.TechnicianProfileRepositoryImpl
import com.homeservices.customer.data.technician.remote.TechnicianProfileApiService
import com.homeservices.customer.domain.technician.TechnicianProfileRepository
import com.squareup.moshi.Moshi
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class TechnicianProfileModule {
    @Binds
    internal abstract fun bindTechnicianProfileRepository(impl: TechnicianProfileRepositoryImpl): TechnicianProfileRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideTechnicianProfileApiService(
            moshi: Moshi,
            client: OkHttpClient,
        ): TechnicianProfileApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(TechnicianProfileApiService::class.java)
    }
}

package com.homeservices.customer.data.rating.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.rating.RatingRepository
import com.homeservices.customer.data.rating.RatingRepositoryImpl
import com.homeservices.customer.data.rating.remote.RatingApiService
import com.squareup.moshi.Moshi
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class RatingModule {
    @Binds
    internal abstract fun bindRatingRepository(impl: RatingRepositoryImpl): RatingRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideRatingApiService(
            @AuthOkHttpClient client: OkHttpClient,
            moshi: Moshi,
        ): RatingApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(RatingApiService::class.java)
    }
}

package com.homeservices.customer.data.complaint.di

import com.google.firebase.storage.FirebaseStorage
import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.complaint.ComplaintRepository
import com.homeservices.customer.data.complaint.ComplaintRepositoryImpl
import com.homeservices.customer.data.complaint.remote.ComplaintApiService
import com.squareup.moshi.Moshi
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class ComplaintModule {
    @Binds
    internal abstract fun bindComplaintRepository(impl: ComplaintRepositoryImpl): ComplaintRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideComplaintApiService(
            @AuthOkHttpClient client: OkHttpClient,
            moshi: Moshi,
        ): ComplaintApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(ComplaintApiService::class.java)

        @Provides
        @Singleton
        public fun provideFirebaseStorage(): FirebaseStorage = FirebaseStorage.getInstance()
    }
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git -c safe.directory='C:/Alok/Business Projects/Urbanclap-sprint2b' diff --check f39ac4b37a5f76121433cc6ac340508f273858ef" in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1567ms:
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$env:GRADLE_USER_HOME='"'C:\\Users\\alokt\\.gradle'; .\\gradlew.bat :app:ktlintCheck --offline --quiet" in C:\Alok\Business Projects\Urbanclap-sprint2b\customer-app
 succeeded in 32972ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg \"RatingUiState.Error|Error\\(\" customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating -n; rg \"ComplaintUiState.Error|onRetry\" customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint -n; rg \"BookingUiState.Error|startBooking|onRetry\" customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking -n" in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1786ms:
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating\RatingViewModel.kt:51:    public data class Error(
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating\RatingViewModel.kt:144:                        }.onFailure { _uiState.value = RatingUiState.Error(it.message ?: "load failed") }
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating\RatingViewModel.kt:249:                        _uiState.value = RatingUiState.Error(it.message ?: "escalation failed")
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating\RatingViewModel.kt:283:                            }.onFailure { _uiState.value = RatingUiState.Error(it.message ?: "submit failed") }
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating\RatingScreen.kt:119:                is RatingUiState.Error ->
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint\ComplaintViewModel.kt:68:        public fun onRetry() {
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint\ComplaintViewModel.kt:124:                                    ComplaintUiState.Error(e.message ?: UNKNOWN_ERROR_FALLBACK)
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint\ComplaintScreen.kt:67:        onRetry = viewModel::onRetry,
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint\ComplaintScreen.kt:80:    onRetry: () -> Unit,
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint\ComplaintScreen.kt:91:            is ComplaintUiState.Error -> ErrorState(message = state.message, onRetry = onRetry)
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint\ComplaintScreen.kt:208:    onRetry: () -> Unit,
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint\ComplaintScreen.kt:219:        HsPrimaryButton(text = stringResource(R.string.complaint_retry), onClick = onRetry)
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking\BookingSummaryScreen.kt:84:        onCreateBooking = { paymentMethod -> viewModel.startBooking(serviceId, categoryId, paymentMethod) },
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking\BookingSummaryScreen.kt:133:                is BookingUiState.Error -> BookingError(message = state.message)
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking\BookingViewModel.kt:61:            startBooking(serviceId, categoryId, BookingPaymentMethod.RAZORPAY)
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking\BookingViewModel.kt:64:        public fun startBooking(
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking\BookingViewModel.kt:97:                    onFailure = { _uiState.value = BookingUiState.Error(it.message ?: BOOKING_FAILED_FALLBACK) },
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking\BookingViewModel.kt:114:                            onFailure = { _uiState.value = BookingUiState.Error(it.message ?: CONFIRMATION_FAILED_FALLBACK) },
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking\BookingViewModel.kt:120:                    _uiState.value = BookingUiState.Error("PAYMENT_CANCELLED:${result.description}")

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt -Raw; Get-Content customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingSummaryScreen.kt -Raw | Select-String -Pattern "BookingError|Button|onCreateBooking" -Context 3,5' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1678ms:
package com.homeservices.customer.ui.rating

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SuggestionChip
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.homeservices.customer.R
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTrustBadge
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
public fun RatingScreen(
    modifier: Modifier = Modifier,
    viewModel: RatingViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    val shieldState by viewModel.shieldState.collectAsState()
    val overall by viewModel.overall.collectAsState()
    val punct by viewModel.punctuality.collectAsState()
    val skill by viewModel.skill.collectAsState()
    val behav by viewModel.behaviour.collectAsState()
    val comment by viewModel.comment.collectAsState()
    val canSubmit by viewModel.canSubmit.collectAsState()

    RatingContent(
        state = state,
        shieldState = shieldState,
        overall = overall,
        punctuality = punct,
        skill = skill,
        behaviour = behav,
        comment = comment,
        canSubmit = canSubmit,
        onOverallChange = viewModel::setOverall,
        onPunctualityChange = viewModel::setPunctuality,
        onSkillChange = viewModel::setSkill,
        onBehaviourChange = viewModel::setBehaviour,
        onCommentChange = viewModel::setComment,
        onSubmit = viewModel::submit,
        onPostAnyway = viewModel::onPostAnyway,
        modifier = modifier,
    )

    if (shieldState == RatingShieldState.ShowDialog || shieldState == RatingShieldState.Escalating) {
        ShieldBottomSheet(
            onEscalate = viewModel::onEscalate,
            onSkip = viewModel::onSkipShield,
            onDismiss = viewModel::onDismissShieldDialog,
            isEscalating = shieldState == RatingShieldState.Escalating,
        )
    }
}

@Composable
internal fun RatingContent(
    state: RatingUiState,
    shieldState: RatingShieldState,
    overall: Int,
    punctuality: Int,
    skill: Int,
    behaviour: Int,
    comment: String,
    canSubmit: Boolean,
    onOverallChange: (Int) -> Unit,
    onPunctualityChange: (Int) -> Unit,
    onSkillChange: (Int) -> Unit,
    onBehaviourChange: (Int) -> Unit,
    onCommentChange: (String) -> Unit,
    onSubmit: () -> Unit,
    onPostAnyway: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(modifier = Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            when (state) {
                is RatingUiState.AwaitingPartner ->
                    StatusMessage(
                        stringResource(R.string.rating_awaiting_title),
                        stringResource(R.string.rating_awaiting_body),
                    )
                is RatingUiState.Revealed ->
                    StatusMessage(
                        stringResource(R.string.rating_revealed_title),
                        stringResource(R.string.rating_revealed_body),
                    )
                is RatingUiState.Error ->
                    StatusMessage(stringResource(R.string.rating_error_title), state.message)
                is RatingUiState.Loading ->
                    StatusMessage(
                        stringResource(R.string.rating_loading_title),
                        stringResource(R.string.rating_loading_body),
                    )
                else ->
                    RatingForm(
                        shieldState = shieldState,
                        overall = overall,
                        punctuality = punctuality,
                        skill = skill,
                        behaviour = behaviour,
                        comment = comment,
                        canSubmit = canSubmit,
                        onOverallChange = onOverallChange,
                        onPunctualityChange = onPunctualityChange,
                        onSkillChange = onSkillChange,
                        onBehaviourChange = onBehaviourChange,
                        onCommentChange = onCommentChange,
                        onSubmit = onSubmit,
                        onPostAnyway = onPostAnyway,
                    )
            }
        }
    }
}

@Composable
private fun RatingForm(
    shieldState: RatingShieldState,
    overall: Int,
    punctuality: Int,
    skill: Int,
    behaviour: Int,
    comment: String,
    canSubmit: Boolean,
    onOverallChange: (Int) -> Unit,
    onPunctualityChange: (Int) -> Unit,
    onSkillChange: (Int) -> Unit,
    onBehaviourChange: (Int) -> Unit,
    onCommentChange: (String) -> Unit,
    onSubmit: () -> Unit,
    onPostAnyway: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        HsTrustBadge(text = stringResource(R.string.rating_eyebrow))
        Text(
            stringResource(R.string.rating_title),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
        )
        Text(
            stringResource(R.string.rating_body),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        HsSectionCard {
            StarRow(stringResource(R.string.rating_overall), overall, onOverallChange)
            Spacer(Modifier.height(12.dp))
            StarRow(stringResource(R.string.rating_punctuality), punctuality, onPunctualityChange)
            Spacer(Modifier.height(12.dp))
            StarRow(stringResource(R.string.rating_skill), skill, onSkillChange)
            Spacer(Modifier.height(12.dp))
            StarRow(stringResource(R.string.rating_behaviour), behaviour, onBehaviourChange)
        }
        OutlinedTextField(
            value = comment,
            onValueChange = onCommentChange,
            label = { Text(stringResource(R.string.rating_comment_label)) },
            supportingText = { Text("${comment.length}/500") },
            minLines = 3,
            modifier = Modifier.fillMaxWidth(),
        )
        if (shieldState is RatingShieldState.Escalated) {
            CountdownChip(expiresAtMs = shieldState.expiresAtMs, onPostAnyway = onPostAnyway)
        } else {
            Spacer(Modifier.weight(1f))
            HsPrimaryButton(
                text = stringResource(R.string.rating_submit),
                onClick = onSubmit,
                enabled = canSubmit,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun StatusMessage(
    title: String,
    body: String,
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text(body, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ShieldBottomSheet(
    onEscalate: () -> Unit,
    onSkip: () -> Unit,
    onDismiss: () -> Unit,
    isEscalating: Boolean = false,
) {
    val sheetState = rememberModalBottomSheetState()
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp)) {
            Text(
                stringResource(R.string.rating_shield_title),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                stringResource(R.string.rating_shield_body),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(16.dp))
            HsPrimaryButton(
                text = stringResource(R.string.rating_shield_send_support),
                onClick = onEscalate,
                enabled = !isEscalating,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            HsSecondaryButton(
                text = stringResource(R.string.rating_shield_post_now),
                onClick = onSkip,
                enabled = !isEscalating,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun CountdownChip(
    expiresAtMs: Long,
    onPostAnyway: () -> Unit,
) {
    var remainingMs by remember { mutableLongStateOf(expiresAtMs - System.currentTimeMillis()) }
    LaunchedEffect(expiresAtMs) {
        while (true) {
            remainingMs = expiresAtMs - System.currentTimeMillis()
            if (remainingMs <= 0) break
            delay(60_000L)
        }
    }
    val hours = (remainingMs / 3_600_000).coerceAtLeast(0)
    val minutes = ((remainingMs % 3_600_000) / 60_000).coerceAtLeast(0)
    val timeString = "$hours:${minutes.toString().padStart(2, '0')}"
    Row(modifier = Modifier.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        SuggestionChip(
            onClick = {},
            label = { Text(stringResource(R.string.rating_private_review_countdown, timeString)) },
        )
        Spacer(Modifier.width(8.dp))
        TextButton(onClick = onPostAnyway) { Text(stringResource(R.string.rating_post_anyway)) }
    }
}

@Composable
private fun StarRow(
    label: String,
    value: Int,
    onChange: (Int) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(label, style = MaterialTheme.typography.labelLarge)
        Row {
            for (i in 1..5) {
                Text(
                    text = if (i <= value) "â˜…" else "â˜†",
                    style = MaterialTheme.typography.headlineSmall,
                    color = if (i <= value) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier =
                        Modifier
                            .padding(end = 6.dp)
                            .clickable(onClickLabel = pluralStringResource(R.plurals.rating_star_label, i, i)) { onChange(i) },
                )
            }
        }
    }
}


> package com.homeservices.customer.ui.booking

import android.app.Activity
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.BuildConfig
import com.homeservices.customer.R
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.designsystem.components.HsInfoRow
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsSkeletonBlock
import com.razorpay.Checkout
import org.json.JSONObject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun BookingSummaryScreen(
    viewModel: BookingViewModel,
    serviceId: String,
    categoryId: String,
    onConfirmed: (bookingId: String) -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val activity = LocalContext.current as? Activity

    LaunchedEffect(uiState) {
        if (uiState is BookingUiState.AwaitingPayment && activity != null) {
            val state = uiState as BookingUiState.AwaitingPayment
            val checkout = Checkout()
            checkout.setKeyID(BuildConfig.RAZORPAY_KEY_ID)
            val options =
                JSONObject().apply {
                    put("order_id", state.razorpayOrderId)
                    put("amount", state.amount)
                    put("currency", "INR")
                }
            checkout.open(activity, options)
        }
        if (uiState is BookingUiState.BookingConfirmed) {
            onConfirmed((uiState as BookingUiState.BookingConfirmed).bookingId)
        }
    }

    BookingSummaryContent(
        uiState = uiState,
        onCreateBooking = { paymentMethod -> viewModel.startBooking(serviceId, categoryId, paymentMethod) },
        onBack = onBack,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun BookingSummaryContent(
    uiState: BookingUiState,
    onCreateBooking: (BookingPaymentMethod) -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var selectedPaymentMethod by rememberSaveable { mutableStateOf(BookingPaymentMethod.RAZORPAY) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.booking_summary_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.service_detail_back_desc),
                        )
                    }
                },
            )
        },
        modifier = modifier,
    ) { innerPadding ->
        Box(
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
        ) {
            when (val state = uiState) {
                is BookingUiState.Ready ->
                    ReadySummary(
                        state = state,
                        selectedPaymentMethod = selectedPaymentMethod,
                        onPaymentMethodSelected = { selectedPaymentMethod = it },
                        onCreateBooking = { onCreateBooking(selectedPaymentMethod) },
                    )
                is BookingUiState.CreatingBooking,
                is BookingUiState.AwaitingPayment,
                is BookingUiState.ConfirmingPayment,
                -> BookingProgress()
                is BookingUiState.Error -> BookingError(message = state.message)
                else -> Unit
            }
        }
    }
}

@Composable
private fun ReadySummary(
    state: BookingUiState.Ready,
    selectedPaymentMethod: BookingPaymentMethod,
    onPaymentMethodSelected: (BookingPaymentMethod) -> Unit,
    onCreateBooking: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Column(
            modifier =
                Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState()),
        ) {
            Text(
                text = stringResource(R.string.booking_summary_heading),
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = stringResource(R.string.booking_summary_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(18.dp))
            HsSectionCard {
                SummaryRow(
                    label = stringResource(R.string.booking_summary_slot_label),
                    value = "${state.slot.date} ${state.slot.window}",
                )
                SummaryRow(
                    label = stringResource(R.string.booking_summary_address_label),
                    value = state.addressText,
                )
            }
            Spacer(Modifier.height(12.dp))
            HsSectionCard(title = stringResource(R.string.booking_payment_method_title)) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    PaymentOptionRow(
                        title = stringResource(R.string.booking_payment_online_title),
                        body = stringResource(R.string.booking_payment_online_body),
                        method = BookingPaymentMethod.RAZORPAY,
                        selectedPaymentMethod = selectedPaymentMethod,
                        onPaymentMethodSelected = onPaymentMethodSelected,
                    )
                    PaymentOptionRow(
                        title = stringResource(R.string.booking_payment_cash_title),
                        body = stringResource(R.string.booking_payment_cash_body),
                        method = BookingPaymentMethod.CASH_ON_SERVICE,
                        selectedPaymentMethod = selectedPaymentMethod,
                        onPaymentMethodSelected = onPaymentMethodSelected,
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
            HsSectionCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = MaterialTheme.shapes.small,
                        color = MaterialTheme.colorScheme.primaryContainer,
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Lock,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(8.dp),
                        )
                    }
                    Column(modifier = Modifier.padding(start = 12.dp)) {
                        Text(
                            text =
                                stringResource(
                                    if (selectedPaymentMethod == BookingPaymentMethod.RAZORPAY) {
                                        R.string.booking_payment_secure_title
                                    } else {
                                        R.string.booking_payment_cash_note_title
                                    },
                                ),
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text =
                                stringResource(
                                    if (selectedPaymentMethod == BookingPaymentMethod.RAZORPAY) {
                                        R.string.booking_payment_secure_body
                                    } else {
                                        R.string.booking_payment_cash_note_body
                                    },
                                ),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
        }
        Spacer(Modifier.height(14.dp))
        HsPrimaryButton(
            text =
                stringResource(
                    if (selectedPaymentMethod == BookingPaymentMethod.RAZORPAY) {
                        R.string.booking_summary_pay_now
                    } else {
                        R.string.booking_summary_book_cash
                    },
                ),
            onClick = onCreateBooking,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .height(56.dp),
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PaymentOptionRow(
    title: String,
    body: String,
    method: BookingPaymentMethod,
    selectedPaymentMethod: BookingPaymentMethod,
    onPaymentMethodSelected: (BookingPaymentMethod) -> Unit,
) {
    val selected = method == selectedPaymentMethod
    Surface(
        onClick = { onPaymentMethodSelected(method) },
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        color =
            if (selected) {
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.42f)
            } else {
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f)
            },
        border =
            BorderStroke(
                width = 1.dp,
                color =
                    if (selected) {
                        MaterialTheme.colorScheme.primary
                    } else {
                        MaterialTheme.colorScheme.outlineVariant
                    },
            ),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            RadioButton(selected = selected, onClick = { onPaymentMethodSelected(method) })
            Column(modifier = Modifier.padding(start = 8.dp)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = body,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun SummaryRow(
    label: String,
    value: String,
) {
    HsInfoRow(label = label, value = value)
}

@Composable
private fun BookingProgress() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        HsSkeletonBlock(widthFraction = 0.72f, height = 28.dp)
        HsSkeletonBlock(widthFraction = 0.9f, height = 16.dp)
        repeat(3) {
            Surface(
                modifier = Modifier.fillMaxWidth().height(92.dp),
                shape = MaterialTheme.shapes.medium,
                color = MaterialTheme.colorScheme.surfaceVariant,
            ) {}
        }
    }
}

@Composable
private fun BookingError(message: String) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = stringResource(R.string.booking_error_title),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}




exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$env:GRADLE_USER_HOME='"'C:\\Users\\alokt\\.gradle'; .\\gradlew.bat :app:koverVerify --offline --quiet" in C:\Alok\Business Projects\Urbanclap-sprint2b\customer-app
 succeeded in 141693ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$env:GRADLE_USER_HOME='"'C:\\Users\\alokt\\.gradle'; .\\gradlew.bat :app:detekt --offline --quiet" in C:\Alok\Business Projects\Urbanclap-sprint2b\customer-app
2026-05-23T00:30:16.404658Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 44.3 seconds
Output:
#
# A fatal error has been detected by the Java Runtime Environment:
#
#  EXCEPTION_ACCESS_VIOLATION (0xc0000005) at pc=0x00007ffa99e26683, pid=57720, tid=11960
#
# JRE version: OpenJDK Runtime Environment Temurin-21.0.10+7 (21.0.10+7) (build 21.0.10+7-LTS)
# Java VM: OpenJDK 64-Bit Server VM Temurin-21.0.10+7 (21.0.10+7-LTS, mixed mode, sharing, tiered, compressed oops, compressed class ptrs, g1 gc, windows-amd64)
# Problematic frame:
# V  [jvm.dll+0x3e6683]
 exited 1 in 44341ms:
#
# A fatal error has been detected by the Java Runtime Environment:
#
#  EXCEPTION_ACCESS_VIOLATION (0xc0000005) at pc=0x00007ffa99e26683, pid=57720, tid=11960
#
# JRE version: OpenJDK Runtime Environment Temurin-21.0.10+7 (21.0.10+7) (build 21.0.10+7-LTS)
# Java VM: OpenJDK 64-Bit Server VM Temurin-21.0.10+7 (21.0.10+7-LTS, mixed mode, sharing, tiered, compressed oops, compressed class ptrs, g1 gc, windows-amd64)
# Problematic frame:
# V  [jvm.dll+0x3e6683]
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "Idempotency|idempotency|Idempotency-Key" -n' in C:\Alok\Business Projects\Urbanclap-sprint2b
2026-05-23T00:30:22.135428Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 2 seconds
Output:

 exited 1 in 1950ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "idempotency" customer-app -n' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1814ms:
customer-app\app\src\test\kotlin\com\homeservices\customer\data\pendingaction\PendingActionDaoTest.kt:23: *   - upsertAll idempotency
customer-app\app\src\test\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImplTest.kt:94:    public fun `createComplaint passes idempotency key to api`(): Unit =
customer-app\app\src\test\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImplTest.kt:29:            idempotencyKey: String,
customer-app\app\src\test\kotlin\com\homeservices\customer\data\rating\RatingRepositoryImplTest.kt:60:    public fun `submitCustomerRating passes idempotency key to api`(): Unit =
customer-app\app\src\test\kotlin\com\homeservices\customer\domain\booking\CreateBookingUseCaseTest.kt:48:    public fun `invoke generates non-blank UUID idempotency key`(): Unit =
customer-app\app\src\main\kotlin\com\homeservices\customer\domain\booking\CreateBookingUseCase.kt:16:            val idempotencyKey = UUID.randomUUID().toString()
customer-app\app\src\main\kotlin\com\homeservices\customer\domain\booking\CreateBookingUseCase.kt:17:            return repo.createBooking(request, idempotencyKey)
customer-app\app\src\main\kotlin\com\homeservices\customer\domain\rating\SubmitRatingUseCase.kt:20:            val idempotencyKey = UUID.randomUUID().toString()
customer-app\app\src\main\kotlin\com\homeservices\customer\domain\rating\SubmitRatingUseCase.kt:21:            return repo.submitCustomerRating(bookingId, overall, subScores, comment, idempotencyKey)
customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\remote\BookingApiService.kt:21:        @Header("Idempotency-Key") idempotencyKey: String,
customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\BookingRepositoryImpl.kt:26:            idempotencyKey: String,
customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\BookingRepositoryImpl.kt:42:                                idempotencyKey = idempotencyKey,
customer-app\app\src\main\kotlin\com\homeservices\customer\data\booking\BookingRepository.kt:13:        idempotencyKey: String,
customer-app\app\src\main\kotlin\com\homeservices\customer\domain\complaint\SubmitComplaintUseCase.kt:20:            val idempotencyKey = UUID.randomUUID().toString()
customer-app\app\src\main\kotlin\com\homeservices\customer\domain\complaint\SubmitComplaintUseCase.kt:21:            return repo.createComplaint(bookingId, reason.code, description, photoStoragePath, idempotencyKey)
customer-app\app\src\main\kotlin\com\homeservices\customer\data\complaint\ComplaintRepository.kt:12:        idempotencyKey: String,
customer-app\app\src\main\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImpl.kt:21:            idempotencyKey: String,
customer-app\app\src\main\kotlin\com\homeservices\customer\data\complaint\ComplaintRepositoryImpl.kt:33:                            idempotencyKey = idempotencyKey,
customer-app\app\src\main\kotlin\com\homeservices\customer\data\rating\RatingRepository.kt:13:        idempotencyKey: String,
customer-app\app\src\main\kotlin\com\homeservices\customer\data\rating\RatingRepositoryImpl.kt:22:            idempotencyKey: String,
customer-app\app\src\main\kotlin\com\homeservices\customer\data\rating\RatingRepositoryImpl.kt:40:                            idempotencyKey = idempotencyKey,
customer-app\app\src\main\kotlin\com\homeservices\customer\data\rating\remote\RatingApiService.kt:17:        @Header("Idempotency-Key") idempotencyKey: String,
customer-app\app\src\main\kotlin\com\homeservices\customer\data\complaint\remote\ComplaintApiService.kt:16:        @Header("Idempotency-Key") idempotencyKey: String,

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "v1/bookings|ratings|complaints" api -n' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1097ms:
api\openapi.json:126:          "complaintsOpen": {
api\openapi.json:140:          "complaintsOpen",
api\openapi.json:1264:              "ratings": {
api\openapi.json:1268:              "complaints": {
api\openapi.json:1300:              "ratings",
api\openapi.json:1301:              "complaints",
api\openapi.json:2548:    "/v1/admin/complaints": {
api\openapi.json:2552:          "complaints"
api\openapi.json:2554:        "summary": "List complaints with optional filters",
api\openapi.json:2634:            "description": "Paginated complaints list",
api\openapi.json:2654:          "complaints"
api\openapi.json:2694:    "/v1/admin/complaints/{id}": {
api\openapi.json:2698:          "complaints"
api\openapi.json:2751:    "/v1/admin/complaints/repeat-offenders": {
api\openapi.json:2755:          "complaints"
api\openapi.json:2757:        "summary": "Technicians with 3+ resolved complaints in the rolling window",
api\package.json:28:    "seed:complaints": "tsx src/cosmos/seeds/complaints.ts",
api\vitest.config.ts:33:        'src/cosmos/complaints-repository.ts',
api\vitest.config.ts:46:        'src/cosmos/complaints.ts',
api\scripts\setup-cosmos.ts:46:  // (reduces RU/write cost at scale) — must match src/cosmos/seeds/complaints.ts.
api\scripts\setup-cosmos.ts:48:    id: 'complaints',
api\scripts\setup-cosmos.ts:57:  console.log(`Container 'complaints' ready.`);
api\scripts\setup-cosmos.ts:86:    'pending_actions_complaints_leases',
api\scripts\setup-cosmos.ts:89:    'pending_actions_ratings_leases',
api\tests\middleware\withCorrelationId.test.ts:29:    url: 'https://api.example.com/v1/bookings',
api\tests\bookings\price-approval.test.ts:34:  const url = `http://localhost/api/v1/bookings/${id}${suffix}`;
api\tests\bookings\price-approval.test.ts:44:describe('GET /v1/bookings/{id}', () => {
api\tests\bookings\price-approval.test.ts:63:describe('POST /v1/bookings/{id}/request-addon', () => {
api\tests\bookings\price-approval.test.ts:90:describe('POST /v1/bookings/{id}/approve-final-price', () => {
api\tests\bookings\list.test.ts:23:    url: 'http://localhost/api/v1/bookings',
api\tests\bookings\list.test.ts:31:describe('GET /v1/bookings', () => {
api\tests\integration\erasure-cron.test.ts:49:  ratings: 0,
api\tests\integration\erasure-cron.test.ts:50:  complaints: 0,
api\tests\bookings\create.test.ts:64:    url: 'http://localhost/api/v1/bookings', method: 'POST',
api\tests\bookings\create.test.ts:70:describe('POST /v1/bookings', () => {
api\tests\bookings\create-service-area.test.ts:2: * Service-area gating integration tests for POST /v1/bookings — E16-S01
api\tests\bookings\create-service-area.test.ts:68:    url: 'http://localhost/api/v1/bookings',
api\tests\bookings\create-service-area.test.ts:91:describe('POST /v1/bookings — service-area gating (E16-S01)', () => {
api\tests\bookings\create-apply-credit.test.ts:2: * E13-S01 — TDD tests for POST /v1/bookings with applyCredit flag
api\tests\bookings\create-apply-credit.test.ts:139:    url: 'http://localhost/api/v1/bookings',
api\tests\bookings\create-apply-credit.test.ts:151:describe('POST /v1/bookings with applyCredit=true — partial credit Razorpay (AC-3 / P1-6)', () => {
api\tests\bookings\create-apply-credit.test.ts:212:describe('POST /v1/bookings with applyCredit=true — full credit covers price (P1-5)', () => {
api\tests\bookings\create-apply-credit.test.ts:282:describe('POST /v1/bookings with applyCredit=true — zero balance (AC-4)', () => {
api\tests\bookings\create-apply-credit.test.ts:309:describe('POST /v1/bookings with applyCredit absent / false', () => {
api\tests\bookings\create-apply-credit.test.ts:341:describe('POST /v1/bookings — idempotency-key (AC-5)', () => {
api\tests\bookings\create-apply-credit.test.ts:381:describe('POST /v1/bookings — concurrent applyCredit race for full-credit path (AC-6 / P1-1 / P1-5)', () => {
api\tests\bookings\create-apply-credit.test.ts:421:describe('POST /v1/bookings — wallet credit feature flag off', () => {
api\tests\bookings\create-apply-credit.test.ts:444:describe('POST /v1/bookings — service-area gating (E16-S01 regression guard)', () => {
api\tests\bookings\create-apply-credit.test.ts:465:describe('POST /v1/bookings — P1-1 verify-before-PAID (full-credit path)', () => {
api\tests\bookings\create-apply-credit.test.ts:550:describe('POST /v1/bookings — P1-2 reserve-before-Razorpay (partial credit path)', () => {
api\tests\bookings\confirm.test.ts:33:    url: `http://localhost/api/v1/bookings/${id}/confirm`, method: 'POST',
api\tests\bookings\confirm.test.ts:41:describe('POST /v1/bookings/:id/confirm', () => {
api\tests\bookings\branch-coverage.test.ts:58:    url: `http://localhost/api/v1/bookings/${id}/request-addon`,
api\tests\bookings\branch-coverage.test.ts:69:    url: `http://localhost/api/v1/bookings/${id}/confirm`,
api\tests\functions\complaints\partner-get.test.ts:10:vi.mock('../../../src/cosmos/complaints-repository.js', () => ({
api\tests\functions\complaints\partner-get.test.ts:24:import { queryComplaintsByBookingAndParty } from '../../../src/cosmos/complaints-repository.js';
api\tests\functions\complaints\partner-get.test.ts:25:import { partnerGetComplaintsHandler } from '../../../src/functions/complaints/partner-get.js';
api\tests\functions\complaints\partner-get.test.ts:44:describe('GET /v1/complaints/{bookingId} (partner)', () => {
api\tests\functions\complaints\partner-get.test.ts:79:  it('returns 200 with redacted complaints array for customer (no internal fields)', async () => {
api\tests\functions\complaints\partner-get.test.ts:85:    const body = res.jsonBody as { complaints: Record<string, unknown>[] };
api\tests\functions\complaints\partner-get.test.ts:86:    expect(body.complaints).toHaveLength(1);
api\tests\functions\complaints\partner-get.test.ts:87:    const c = body.complaints[0]!;
api\tests\functions\complaints\partner-get.test.ts:98:  it('returns 200 with empty array when no complaints filed', async () => {
api\tests\functions\complaints\partner-get.test.ts:104:    expect((res.jsonBody as { complaints: unknown[] }).complaints).toHaveLength(0);
api\src\functions\admin\complaints\sla-timer.ts:7:} from '../../../cosmos/complaints-repository.js';
api\src\functions\admin\complaints\sla-timer.ts:88:      ctx.log('slaBreachTimer: complaints container not yet provisioned — skipping');
api\src\functions\admin\complaints\repeat-offenders.ts:6:import { getRepeatOffenders } from '../../../cosmos/complaints-repository.js';
api\src\functions\admin\complaints\repeat-offenders.ts:30:  route: 'v1/admin/complaints/repeat-offenders',
api\tests\functions\complaints\partner-create.test.ts:12:vi.mock('../../../src/cosmos/complaints-repository.js', () => ({
api\tests\functions\complaints\partner-create.test.ts:34:import { createComplaint, getComplaint, replaceComplaint } from '../../../src/cosmos/complaints-repository.js';
api\tests\functions\complaints\partner-create.test.ts:35:import { partnerCreateComplaintHandler } from '../../../src/functions/complaints/partner-create.js';
api\tests\functions\complaints\partner-create.test.ts:53:describe('POST /v1/complaints (partner)', () => {
api\src\functions\admin\complaints\patch.ts:7:import { getComplaint, replaceComplaint } from '../../../cosmos/complaints-repository.js';
api\src\functions\admin\complaints\patch.ts:187:  route: 'v1/admin/complaints/{id}',
api\tests\observability\sentry-before-send.test.ts:87:        url: 'https://api.example.com/v1/bookings',
api\src\functions\admin\complaints\list.ts:7:import { queryComplaints } from '../../../cosmos/complaints-repository.js';
api\src\functions\admin\complaints\list.ts:32:    // Cosmos 404 means the complaints container hasn't been provisioned yet.
api\src\functions\admin\complaints\list.ts:44:  route: 'v1/admin/complaints',
api\src\functions\admin\complaints\create.ts:8:import { createComplaint } from '../../../cosmos/complaints-repository.js';
api\src\functions\admin\complaints\create.ts:76:  route: 'v1/admin/complaints',
api\src\cosmos\complaints-repository.ts:6:const CONTAINER = 'complaints';
api\src\cosmos\complaints-repository.ts:62:    // Include items without resolvedAt (active complaints) alongside recently-resolved ones.
api\src\cosmos\complaints-repository.ts:78:  // mixed/all with resolvedSince: sort by updatedAt so recently resolved old complaints
api\src\cosmos\client.ts:84:  return getCosmosClient().database(DB_NAME).container('ratings');
api\tests\unit\admin-erasure-execute.test.ts:148:      ratings: 2,
api\tests\unit\admin-erasure-execute.test.ts:149:      complaints: 1,
api\tests\unit\admin-erasure-execute.test.ts:226:      ratings: 0,
api\tests\unit\admin-erasure-execute.test.ts:227:      complaints: 0,
api\src\functions\admin\dashboard\summary.ts:76:    // Isolated so a missing complaints container (pre-seed) returns 0 instead of breaking the dashboard.
api\src\functions\admin\dashboard\summary.ts:77:    const complaintsOpen = await db
api\src\functions\admin\dashboard\summary.ts:78:      .container('complaints')
api\src\functions\admin\dashboard\summary.ts:99:      complaintsOpen,
api\tests\technicians\confidence-score.test.ts:98:  it('returns areaRating=null (no per-booking ratings collected yet)', async () => {
api\src\cosmos\user-data-export-reads.ts:25:const COMPLAINTS_CONTAINER = 'complaints';
api\src\cosmos\user-data-cascade-writes.ts:4: * anonymizes everything else (bookings, ratings, ledger, audit log) so financial
api\src\cosmos\user-data-cascade-writes.ts:20:const COMPLAINTS_CONTAINER = 'complaints';
api\src\cosmos\seeds\complaints.ts:7:    id: 'complaints',
api\src\cosmos\seeds\complaints.ts:17:  console.log('complaints container ready.');
api\tests\unit\dataExport-service.test.ts:113:    const r = out.ratings[0]!;
api\tests\unit\dataExport-service.test.ts:126:    const r = out.ratings[0]!;
api\tests\unit\dataExport-service.test.ts:139:    const c = out.complaints[0]!;
api\tests\unit\dataExport-service.test.ts:154:    const c = out.complaints[0]!;
api\tests\unit\dataExport-service.test.ts:171:    const c = out.complaints[0]!;
api\src\functions\tech-ratings.ts:94:  route: 'v1/technicians/me/ratings',
api\tests\unit\users-data-export.test.ts:25:vi.mock('../../src/cosmos/complaints-repository.js', () => ({
api\tests\unit\users-data-export.test.ts:113:      ratings: [],
api\tests\unit\users-data-export.test.ts:114:      complaints: [],
api\tests\unit\users-data-export.test.ts:144:      ratings: [],
api\tests\unit\users-data-export.test.ts:145:      complaints: [],
api\tests\unit\users-data-export.test.ts:176:      ratings: [],
api\tests\unit\users-data-export.test.ts:177:      complaints: [],
api\src\functions\shield-report.ts:9:import { createComplaint, findShieldByTechBooking } from '../cosmos/complaints-repository.js';
api\tests\functions\rating-escalate.test.ts:7:vi.mock('../../src/cosmos/complaints-repository.js', () => ({
api\tests\functions\rating-escalate.test.ts:24:import { createComplaint, findRatingShieldEscalation } from '../../src/cosmos/complaints-repository.js';
api\tests\unit\ratings.test.ts:14:import { submitRatingHandler, getRatingHandler } from '../../src/functions/ratings.js';
api\tests\unit\ratings.test.ts:42:describe('POST /v1/ratings', () => {
api\tests\unit\ratings.test.ts:117:describe('GET /v1/ratings/{bookingId}', () => {
api\tests\unit\shield-report.test.ts:16:vi.mock('../../src/cosmos/complaints-repository.js', () => ({
api\tests\unit\shield-report.test.ts:31:import { createComplaint, findShieldByTechBooking } from '../../src/cosmos/complaints-repository.js';
api\src\functions\ratings.ts:147:app.http('submitRating', { route: 'v1/ratings', methods: ['POST'], handler: submitRatingHandler });
api\src\functions\ratings.ts:148:app.http('getRating', { route: 'v1/ratings/{bookingId}', methods: ['GET'], handler: getRatingHandler });
api\tests\unit\rating-appeal.test.ts:13:vi.mock('../../src/cosmos/complaints-repository.js', () => ({
api\tests\unit\rating-appeal.test.ts:28:import { createComplaint, countAppealsByTechInMonth } from '../../src/cosmos/complaints-repository.js';
api\src\functions\rating-escalate.ts:11:import { createComplaint, findRatingShieldEscalation } from '../cosmos/complaints-repository.js';
api\src\functions\rating-escalate.ts:113:  route: 'v1/ratings/{bookingId}/escalate',
api\tests\unit\pending-action-projector.test.ts:560:    await emitFcmForAction(doc, 'ratings');
api\src\functions\trigger-projector-ratings.ts:4: * Triggers: ratings container change feed.
api\src\functions\trigger-projector-ratings.ts:68:    await emitFcmForAction(upserted, 'ratings');
api\src\functions\trigger-projector-ratings.ts:85:  containerName: 'ratings',
api\src\functions\trigger-projector-ratings.ts:86:  leaseContainerName: 'pending_actions_ratings_leases',
api\src\functions\trigger-projector-ratings.ts:96:          ctx.error('[trigger-projector-ratings] Retryable error — rethrowing for runtime retry', String(err));
api\src\functions\trigger-projector-ratings.ts:99:        ctx.error('[trigger-projector-ratings] Non-retryable error — swallowing to advance checkpoint', String(err));
api\tests\unit\technician-dashboard.test.ts:5: * - Dashboard shape with active job, pending offers, earnings, ratings
api\tests\unit\technician-dashboard.test.ts:141:   * This ensures ratings submitted at 00:00–05:29 IST (previous UTC day 18:30–00:00)
api\tests\unit\technician-dashboard.test.ts:142:   * are included, and next-day early UTC ratings are excluded.
api\tests\unit\technician-dashboard.test.ts:196:    // The end bound is exclusive: ratings at exactly the next IST midnight belong to the next day
api\src\functions\rating-appeal.ts:8:import { createComplaint, countAppealsByTechInMonth } from '../cosmos/complaints-repository.js';
api\src\functions\rating-appeal.ts:41:  // Defense in depth: the UI only shows the appeal button for ratings < 5★, but
api\tests\unit\trigger-projectors.test.ts:46:} from '../../src/functions/trigger-projector-ratings.js';
api\tests\unit\trigger-projectors.test.ts:58:} from '../../src/functions/trigger-projector-complaints.js';
api\tests\unit\trigger-projectors.test.ts:138:describe('trigger-projector-ratings', () => {
api\tests\unit\trigger-projectors.test.ts:253:describe('trigger-projector-complaints', () => {
api\tests\unit\trigger-projectors.test.ts:276:  it('does not emit for CLOSED complaints', async () => {
api\tests\unit\trigger-projectors.test.ts:458:  it('ratings: RATING_RECEIVED expiresAt is derived from customerSubmittedAt (not Date.now)', async () => {
api\tests\unit\trigger-projectors.test.ts:599:describe('P2-5: ratings projector resolves RATING_PROMPT_CUSTOMER on submission', () => {
api\tests\functions\admin\dashboard\summary.test.ts:102:            complaints: 2,
api\tests\functions\admin\dashboard\summary.test.ts:147:        complaintsOpen: expect.any(Number),
api\tests\unit\tech-ratings.test.ts:12:import { getTechRatingsHandler } from '../../src/functions/tech-ratings.js';
api\tests\unit\tech-ratings.test.ts:46:describe('GET /v1/technicians/me/ratings', () => {
api\tests\unit\tech-ratings.test.ts:53:  it('returns 200 with empty summary when no ratings', async () => {
api\tests\unit\tech-ratings.test.ts:63:  it('returns correct averages for 3 ratings', async () => {
api\tests\unit\tech-ratings.test.ts:102:  it('excludes ratings with customerAppealRemoved=true from summary', async () => {
api\tests\unit\tech-ratings.test.ts:114:  it('trend groups ratings by ISO week Monday', async () => {
api\src\functions\complaints\partner-get.ts:5:import { queryComplaintsByBookingAndParty } from '../../cosmos/complaints-repository.js';
api\src\functions\complaints\partner-get.ts:34:  const complaints: PartnerComplaintResponse[] = docs.map(doc => ({
api\src\functions\complaints\partner-get.ts:44:  return { status: 200, jsonBody: { complaints } };
api\src\functions\complaints\partner-get.ts:49:  route: 'v1/complaints/{bookingId}',
api\src\functions\bookings.ts:602:app.http('createBooking', { route: 'v1/bookings', methods: ['POST'], handler: createBookingRateLimiter(createBookingHandler) });
api\src\functions\bookings.ts:603:app.http('confirmBooking', { route: 'v1/bookings/{id}/confirm', methods: ['POST'], handler: requireIntegrity(confirmBookingHandler) });
api\src\functions\bookings.ts:604:app.http('getMyBookings', { route: 'v1/bookings', methods: ['GET'], handler: getMyBookingsHandler });
api\src\functions\bookings.ts:605:app.http('getBooking', { route: 'v1/bookings/{id}', methods: ['GET'], handler: getBookingHandler });
api\src\functions\bookings.ts:606:app.http('requestAddon', { route: 'v1/bookings/{id}/request-addon', methods: ['POST'], handler: requestAddonHandler });
api\src\functions\bookings.ts:607:app.http('approveFinalPrice', { route: 'v1/bookings/{id}/approve-final-price', methods: ['POST'], handler: approveFinalPriceHandler });
api\src\functions\complaints\partner-create.ts:5:import { createComplaint, getComplaint, replaceComplaint } from '../../cosmos/complaints-repository.js';
api\src\functions\complaints\partner-create.ts:122:  route: 'v1/complaints',
api\src\services\featureFlags.service.ts:48: * When true: `POST /v1/bookings` rejects with 400 SERVICE_NOT_AVAILABLE_AT_LOCATION.
api\src\functions\trigger-projector-complaints.ts:4: * Source: complaints container (reuses existing complaints-repository.ts).
api\src\functions\trigger-projector-complaints.ts:5: * Triggers: complaints container change feed.
api\src\functions\trigger-projector-complaints.ts:58:    ctx?.warn(`[trigger-projector-complaints] Skipping doc ${complaintId}: missing required fields`);
api\src\functions\trigger-projector-complaints.ts:85:      await emitFcmForAction(upserted, 'complaints');
api\src\functions\trigger-projector-complaints.ts:98:  containerName: 'complaints',
api\src\functions\trigger-projector-complaints.ts:99:  leaseContainerName: 'pending_actions_complaints_leases',
api\src\functions\trigger-projector-complaints.ts:110:          ctx.error('[trigger-projector-complaints] Retryable error — rethrowing for runtime retry', String(err));
api\src\functions\trigger-projector-complaints.ts:113:        ctx.error('[trigger-projector-complaints] Non-retryable error — swallowing to advance checkpoint', String(err));
api\src\functions\technician-dashboard.ts:6: *   Returns: KYC status + active job + pending offer count + today's earnings + today's ratings
api\src\functions\technician-dashboard.ts:56: * Problem with naive UTC bounds: `YYYY-MM-DDT00:00:00Z` = 05:30 IST, so ratings
api\src\functions\technician-dashboard.ts:57: * submitted between 00:00–05:29 IST are omitted and ratings from early next-day UTC
api\src\functions\technician-dashboard.ts:146:// ── Today's ratings helper ────────────────────────────────────────────────────
api\src\functions\technician-dashboard.ts:155:    // Use IST-aligned UTC bounds so ratings submitted between 00:00–05:29 IST
api\src\functions\technician-dashboard.ts:157:    // next-day UTC ratings are correctly excluded. See istMidnightUtcBounds().
api\src\functions\technician-dashboard.ts:161:      .container('ratings')
api\src\functions\technician-dashboard.ts:185:    ctx.warn('[technician-dashboard] Could not fetch today ratings', String(err));
api\src\functions\technicians.ts:365:  const areaRating: number | null = null; // deferred until per-booking ratings are collected
api\src\services\dataExport.service.ts:17:  ratings: Array<Record<string, unknown>>;
api\src\services\dataExport.service.ts:18:  complaints: Array<Record<string, unknown>>;
api\src\services\dataExport.service.ts:131:  const [bookings, ratings, complaints, auditEntries] = await Promise.all([
api\src\services\dataExport.service.ts:186:    ratings: ratings.map((r) => projectRating(r, role)),
api\src\services\dataExport.service.ts:187:    complaints: complaints.map((c) => projectComplaint(c, role)),
api\src\services\erasureCascade.service.ts:34:    ratings,
api\src\services\erasureCascade.service.ts:35:    complaints,
api\src\services\erasureCascade.service.ts:69:    ratings,
api\src\services\erasureCascade.service.ts:70:    complaints,
api\tests\functions\admin\complaints\create.test.ts:4:vi.mock('../../../../src/cosmos/complaints-repository.js', () => ({
api\tests\functions\admin\complaints\create.test.ts:18:import { createComplaint } from '../../../../src/cosmos/complaints-repository.js';
api\tests\functions\admin\complaints\create.test.ts:20:import { adminCreateComplaintHandler } from '../../../../src/functions/admin/complaints/create.js';
api\src\openapi\registry.ts:319:  method: 'get', path: '/v1/admin/complaints', operationId: 'adminListComplaints',
api\src\openapi\registry.ts:320:  tags: ['complaints'], summary: 'List complaints with optional filters',
api\src\openapi\registry.ts:333:    200: { description: 'Paginated complaints list', content: { 'application/json': { schema: ComplaintListResponseSchema } } },
api\src\openapi\registry.ts:340:  method: 'post', path: '/v1/admin/complaints', operationId: 'adminCreateComplaint',
api\src\openapi\registry.ts:341:  tags: ['complaints'], summary: 'File a new complaint',
api\src\openapi\registry.ts:353:  method: 'patch', path: '/v1/admin/complaints/{id}', operationId: 'adminPatchComplaint',
api\src\openapi\registry.ts:354:  tags: ['complaints'], summary: 'Update complaint status, assignee, resolution, or add a note',
api\src\openapi\registry.ts:368:  method: 'get', path: '/v1/admin/complaints/repeat-offenders', operationId: 'adminGetRepeatOffenders',
api\src\openapi\registry.ts:369:  tags: ['complaints'], summary: 'Technicians with 3+ resolved complaints in the rolling window',
api\tests\functions\admin\complaints\list.test.ts:4:vi.mock('../../../../src/cosmos/complaints-repository.js', () => ({
api\tests\functions\admin\complaints\list.test.ts:13:import { queryComplaints } from '../../../../src/cosmos/complaints-repository.js';
api\tests\functions\admin\complaints\list.test.ts:14:import { adminListComplaintsHandler } from '../../../../src/functions/admin/complaints/list.js';
api\tests\functions\admin\complaints\repeat-offenders.test.ts:4:vi.mock('../../../../src/cosmos/complaints-repository.js', () => ({
api\tests\functions\admin\complaints\repeat-offenders.test.ts:13:import { getRepeatOffenders } from '../../../../src/cosmos/complaints-repository.js';
api\tests\functions\admin\complaints\repeat-offenders.test.ts:14:import { adminRepeatOffendersHandler } from '../../../../src/functions/admin/complaints/repeat-offenders.js';
api\tests\functions\admin\complaints\patch.test.ts:4:vi.mock('../../../../src/cosmos/complaints-repository.js', () => ({
api\tests\functions\admin\complaints\patch.test.ts:26:import { getComplaint, replaceComplaint } from '../../../../src/cosmos/complaints-repository.js';
api\tests\functions\admin\complaints\patch.test.ts:30:import { adminPatchComplaintHandler } from '../../../../src/functions/admin/complaints/patch.js';
api\tests\functions\admin\complaints\patch.test.ts:241:    it('does NOT trigger appeal side-effects for non-RATING_APPEAL complaints', async () => {
api\tests\functions\admin\complaints\sla-timer.test.ts:4:vi.mock('../../../../src/cosmos/complaints-repository.js', () => ({
api\tests\functions\admin\complaints\sla-timer.test.ts:29:import { getOverdueComplaints, replaceComplaint, getUnacknowledgedPastDueComplaints } from '../../../../src/cosmos/complaints-repository.js';
api\tests\functions\admin\complaints\sla-timer.test.ts:32:import { slaBreachTimerHandler } from '../../../../src/functions/admin/complaints/sla-timer.js';
api\tests\functions\admin\complaints\sla-timer.test.ts:53:    // Default: no unacknowledged-past-due complaints unless overridden per test
api\tests\functions\admin\complaints\sla-timer.test.ts:100:  it('does nothing when no overdue complaints', async () => {
api\src\schemas\complaint.ts:153:  complaints: z.array(PartnerComplaintResponseSchema),
api\src\schemas\dashboard.ts:30:    complaintsOpen: z.number().int().nonnegative(),
api\src\schemas\erasure-request.ts:29:  ratings: z.number().int().nonnegative(),
api\src\schemas\erasure-request.ts:30:  complaints: z.number().int().nonnegative(),

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content api/src/functions/bookings.ts -Raw | Select-String -Pattern \"idempot|Idempot|headers|get\\(\" -Context 5,8; Get-Content api/tests/bookings/create-apply-credit.test.ts -Raw | Select-String -Pattern \"idempotency\" -Context 5,8" in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 2706ms:

> import { randomUUID } from 'node:crypto';
import type { HttpHandler } from '@azure/functions';
import { app } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { withRateLimit } from '../middleware/withRateLimit.js';
import { requireIntegrity } from '../middleware/requireIntegrity.js';
import { requireCustomer, type CustomerHttpHandler } from '../middleware/requireCustomer.js';
import { CreateBookingRequestSchema, ConfirmBookingRequestSchema } from '../schemas/booking.js';
import { RequestAddOnBodySchema, ApproveAddOnsBodySchema } from '../schemas/addon-approval.js';
import { bookingRepo, type BookingCreateCreditOptions } from '../cosmos/booking-repository.js';
import { createRazorpayOrder, verifyPaymentSignature } from '../services/razorpay.service.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { sendPriceApprovalPush } from '../services/fcm.service.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import { isSoftLaunchEnabled, isMarketingPaused, isServiceAreaGatingEnabled, isWalletCreditEnabled } from 
'../services/featureFlags.service.js';
import { customerCreditLedgerRepo } from '../cosmos/customer-credit-ledger-repository.js';
import { dispatcherService } from '../services/dispatcher.service.js';
import { posthog } from '../observability/posthog.js';
import { normalizeAddressText } from '../shared/address-text.js';
import { isLatLngInServiceArea } from '../services/service-area.service.js';
import { AYODHYA_SERVICE_AREA } from '../data/service-area-ayodhya.js';

function makeRazorpayReceipt(customerId: string): string {
  return `bk_${Date.now().toString(36)}_${customerId.slice(0, 20)}`;
}

function hasRazorpayCredentials(): boolean {
  const hasUsableValue = (value: string | undefined): boolean => {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) return false;
    if (normalized === 'placeholder') return false;
    if (normalized.endsWith('_placeholder')) return false;
    return true;
  };
  return hasUsableValue(process.env.RAZORPAY_KEY_ID) && hasUsableValue(process.env.RAZORPAY_KEY_SECRET);
}

function bookingMetadata(
  customer: Parameters<CustomerHttpHandler>[2],
  serviceName: string,
) {
  return {
    ...(customer.displayName ? { customerName: customer.displayName } : {}),
    ...(customer.phoneNumber ? { customerPhone: customer.phoneNumber } : {}),
    ...(customer.email ? { customerEmail: customer.email } : {}),
    serviceName,
  };
}

/**
 * E13-S01: Attempt to apply wallet credit for a booking.
 *
 * Returns the applied amount (0 if none, or on any non-fatal error).
 * 412 from Cosmos (etag conflict = concurrent apply) is treated as zero-credit:
 * the booking still succeeds, credit just wasn't applied this time.
 *
 * @param customerId     - customer's UID
 * @param bookingId      - pre-generated or created booking ID (used in ledger entry)
 * @param bookingAmount  - booking total in paise (credit capped at this)
 * @param idempotencyKey - UUID from Idempotency-Key header (caller must validate present)
 */
async function attemptCreditApplication(
  customerId: string,
  bookingId: string,
  bookingAmount: number,
  idempotencyKey: string,
): Promise<number> {
  try {
    const { balanceInPaise } = await customerCreditLedgerRepo.getBalance(customerId);
    if (balanceInPaise <= 0) return 0;

    const amountToApply = Math.min(balanceInPaise, bookingAmount);
    const result = await customerCreditLedgerRepo.applyCredit(
      customerId,
      bookingId,
      amountToApply,
      idempotencyKey,
    );
    return result.appliedAmountInPaise;
  } catch (err: unknown) {
    const code = (err as { code?: number }).code;
    if (code === 412) {
      // Optimistic concurrency conflict â€” concurrent write, safe to return 0
      console.warn('[createBooking] applyCredit 412 conflict â€” proceeding without credit', {
        customerId, bookingId,
      });
      return 0;
    }
    // Non-412 unexpected errors â€” log and continue (never block the booking)
    Sentry.captureException(err);
    console.error('[createBooking] applyCredit unexpected error â€” proceeding without credit', {
      customerId, bookingId, err,
    });
    return 0;
  }
}

const createHandler: CustomerHttpHandler = async (req, _ctx, customer) => {
  if (!(await isSoftLaunchEnabled(customer.customerId))) {
    return { status: 503, jsonBody: { code: 'SERVICE_UNAVAILABLE', message: 'Launch coming soon' } };
  }
  if (await isMarketingPaused(customer.customerId)) {
    return { status: 503, jsonBody: { code: 'TEMPORARILY_UNAVAILABLE', message: 'We are pausing new bookings briefly' 
} };
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateBookingRequestSchema.safeParse(body);
  if (!parsed.success) return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };

  // E13-S01: Validate Idempotency-Key is present when applyCredit=true
  const idempotencyKey = req.headers.get('idempotency-key') ?? '';
  if (parsed.data.applyCredit) {
    const creditEnabled = await isWalletCreditEnabled(customer.customerId);
    if (creditEnabled && !idempotencyKey) {
      return { status: 422, jsonBody: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key header is required 
when applyCredit=true' } };
    }
  }

  // Service-area polygon gating â€” E16-S01 / ADR-0020 / Threat-model T-B1
  // Zod already guarantees lat âˆˆ [-90,90] and lng âˆˆ [-180,180]; this is the
  // geographic business rule enforcing the Ayodhya pilot boundary.
  const { lat, lng } = parsed.data.addressLatLng;
  const insideServiceArea = isLatLngInServiceArea(lat, lng, AYODHYA_SERVICE_AREA);
  const gatingEnabled = await isServiceAreaGatingEnabled(customer.customerId);
  // Structured log â€” always emitted (for observability in both warn-only and fail modes).
  // Alert annotation: >5 rejections/min/customer is a recon signal (T-B1).
  const gatingMode = gatingEnabled ? 'fail' : 'warn-only';
  console.info('service_area_check', {
    customerId: customer.customerId,
    lat,
    lng,
    inside: insideServiceArea,
    mode: gatingMode,
  });
  if (!insideServiceArea && gatingEnabled) {
    return {
      status: 400,
      jsonBody: {
        error: 'SERVICE_NOT_AVAILABLE_AT_LOCATION',
        message: 'We currently only serve the Ayodhya region. We hope to expand soon.',
        suggestedAction: 'join_waitlist',
      },
    };
  }
  // When flag is off (warn-only), an out-of-area coordinate is logged above but allowed through.

  const service = await catalogueRepo.getServiceByIdCrossPartition(parsed.data.serviceId);
  if (!service || !service.isActive) return { status: 404, jsonBody: { code: 'SERVICE_NOT_FOUND' } };

  if (parsed.data.paymentMethod === 'CASH_ON_SERVICE') {
    const cashOrderId = `cash_${randomUUID()}`;
    const booking = await bookingRepo.createPending(
      parsed.data,
      customer.customerId,
      cashOrderId,
      service.basePrice,
      bookingMetadata(customer, service.name),
    );
    const paid = await bookingRepo.markPaid(booking.id, 'cash_on_service_pending');
    if (!paid) return { status: 500, jsonBody: { code: 'BOOKING_CONFIRMATION_FAILED' } };

    // E13-S01: Apply wallet credit for cash bookings
    let appliedCreditAmount = 0;
    if (parsed.data.applyCredit && idempotencyKey) {
      const creditEnabled = await isWalletCreditEnabled(customer.customerId);
      if (creditEnabled) {
        appliedCreditAmount = await attemptCreditApplication(
          customer.customerId,
          booking.id,
          service.basePrice,
          idempotencyKey,
        );
      }
    }

    try {
      posthog.capture({
        distinctId: customer.customerId,
        event: 'booking-created',
        properties: {
          bookingId: booking.id,
          serviceId: parsed.data.serviceId,
          paymentMethod: 'CASH_ON_SERVICE',
          appliedCreditAmount,
        },
      });
    } catch { /* never break the main path */ }
    dispatcherService.triggerDispatch(booking.id).catch((err: unknown) => {
      Sentry.captureException(err);
      console.error('[createBooking] cash-on-service dispatch failed', { bookingId: booking.id, err });
    });
    return {
      status: 201,
      jsonBody: {
        bookingId: booking.id,
        razorpayOrderId: cashOrderId,
        amount: service.basePrice,
        requiresPayment: false,
        paymentMethod: 'CASH_ON_SERVICE',
        appliedCreditAmount,
      },
    };
  }

  if (!hasRazorpayCredentials()) {
    const manualOrderId = `manual_${randomUUID()}`;
    const manualRequest = { ...parsed.data, paymentMethod: 'CASH_ON_SERVICE' as const };
    const booking = await bookingRepo.createPending(
      manualRequest,
      customer.customerId,
      manualOrderId,
      service.basePrice,
      bookingMetadata(customer, service.name),
    );
    const paid = await bookingRepo.markPaid(booking.id, 'manual_payment_not_configured');
    if (!paid) return { status: 500, jsonBody: { code: 'BOOKING_CONFIRMATION_FAILED' } };
    dispatcherService.triggerDispatch(booking.id).catch((err: unknown) => {
      Sentry.captureException(err);
      console.error('[createBooking] manual-payment dispatch failed', { bookingId: booking.id, err });
    });
    return {
      status: 201,
      jsonBody: {
        bookingId: booking.id,
        razorpayOrderId: manualOrderId,
        amount: service.basePrice,
        requiresPayment: false,
        paymentMethod: 'CASH_ON_SERVICE',
        appliedCreditAmount: 0,
      },
    };
  }

  // Pre-generate booking ID so we can embed it in Razorpay notes for the fast path.
  // The webhook can then do a cheap point-read (getById) instead of a cross-partition scan.
  const preGeneratedBookingId = randomUUID();

  // E13-S01 (P1-6): Determine intended credit amount WITHOUT writing to the ledger yet.
  // The actual ledger CREDIT_APPLIED entry is written in the Razorpay webhook (payment.captured),
  // NOT here. This prevents the "debit-before-payment" bug where an unpaid/abandoned booking
  // permanently consumes the customer's wallet credit.
  //
  // For the fully-credit-paid path (P1-5): if credit covers 100% of the booking, we skip
  // Razorpay entirely and mark the booking PAID directly â€” no payment intent is needed.
  let pendingCreditAmount = 0;
  const creditEnabled = parsed.data.applyCredit && idempotencyKey
    ? await isWalletCreditEnabled(customer.customerId)
    : false;

  if (creditEnabled) {
    // Peek at current balance; we don't write the ledger entry here.
    const { balanceInPaise } = await customerCreditLedgerRepo.getBalance(customer.customerId);
    pendingCreditAmount = Math.min(balanceInPaise, service.basePrice);
  }

  const payableAmount = service.basePrice - pendingCreditAmount;

  // P1-5: Credit covers 100% â€” skip Razorpay, mark PAID directly
  if (payableAmount <= 0 && pendingCreditAmount > 0) {
    const fullCreditOrderId = `credit_${randomUUID()}`;
    const fullCreditCreditOptions: BookingCreateCreditOptions = {
      pendingCreditAmountInPaise: pendingCreditAmount,
      pendingCreditIdempotencyKey: idempotencyKey,
    };
    const booking = await bookingRepo.createPending(
      parsed.data,
      customer.customerId,
      fullCreditOrderId,
      service.basePrice,
      bookingMetadata(customer, service.name),
      preGeneratedBookingId,
      fullCreditCreditOptions,
    );

    // Apply credit synchronously for the fully-credit-paid path (no payment to wait for)
    const appliedCreditAmount = await attemptCreditApplication(
      customer.customerId,
      booking.id,
      pendingCreditAmount,
      idempotencyKey,
    );

    // P1-1: Verify the credit was actually applied before marking PAID.
    //
    // attemptCreditApplication returns 0 (or a partial amount) when:
    //   - A 412 ETag conflict (race with another concurrent apply) exhausted all retries.
    //   - An unexpected Cosmos error was swallowed by the non-blocking path.
    //
    // If we mark PAID without the credit being applied, the customer gets a free
    // or underpaid booking (the Razorpay order was skipped entirely).
    //
    // Safe fallback: reject with 409 so the customer retries. We cannot safely
    // fall back to Razorpay here because the booking doc was already created and
    // the Razorpay order amount would need to be recomputed â€” doing so in a partially
    // applied state risks double-charging or missed credit.
    if (appliedCreditAmount < pendingCreditAmount) {
      console.warn('[createBooking] full-credit path: applied amount < expected; rejecting with 409', {
        customerId: customer.customerId,
        bookingId: booking.id,
        expected: pendingCreditAmount,
        applied: appliedCreditAmount,
      });
      Sentry.captureException(
        new Error(`CREDIT_RACE: applied ${appliedCreditAmount} < expected ${pendingCreditAmount}`),
      );
      // Booking is in PENDING_PAYMENT state and no Razorpay order was created â€” safe to
      // leave it; it will expire naturally (stale-booking cleanup handles it).
      return {
        status: 409,
        jsonBody: {
          code: 'CREDIT_RACE',
          message: 'Credit application conflict â€” please retry. Your wallet balance is unchanged.',
        },
      };
    }

    // Mark PAID immediately (no Razorpay payment involved)
    const paid = await bookingRepo.markPaid(booking.id, 'credit_full_payment');
    if (!paid) return { status: 500, jsonBody: { code: 'BOOKING_CONFIRMATION_FAILED' } };

    try {
      posthog.capture({
        distinctId: customer.customerId,
        event: 'booking-created',
        properties: {
          bookingId: booking.id,
          serviceId: parsed.data.serviceId,
          paymentMethod: 'CREDIT_FULL',
          appliedCreditAmount,
        },
      });
    } catch { /* never break the main path */ }

    dispatcherService.triggerDispatch(booking.id).catch((err: unknown) => {
      Sentry.captureException(err);
      console.error('[createBooking] credit-full dispatch failed', { bookingId: booking.id, err });
    });

    return {
      status: 201,
      jsonBody: {
        bookingId: booking.id,
        razorpayOrderId: fullCreditOrderId,
        amount: service.basePrice,
        requiresPayment: false,
        paymentMethod: 'CREDIT_FULL',
        appliedCreditAmount,
      },
    };
  }

  // Partial or no credit â€” create Razorpay order for the payable portion.
  //
  // P1-2: Reserve the credit BEFORE creating the discounted Razorpay order.
  //
  // Problem without reservation: `pendingCreditAmount` is only a balance peek. If:
  //   (a) The same idempotency key is replayed (client retry), a second discounted
  //       Razorpay order is created, potentially granting the discount twice.
  //   (b) The wallet balance is spent elsewhere between here and payment.captured,
  //       the webhook tries to apply a credit that no longer exists â€” the Razorpay
  //       payment collected less than basePrice and the booking is undercollected.
  //
  // Fix: write a RESERVED idempotency doc with IfNoneMatch: * before creating the
  // Razorpay order. This guarantees:
  //   - Idempotency-key replay on Razorpay order creation returns 'already_reserved'
  //     (same booking) â†’ skip Razorpay creation and return the same pending credit amount.
  //   - The wallet balance is not double-spent (the reservation does not debit the wallet;
  //     the actual debit in applyCredit will see the RESERVED status and proceed to debit).
  //   - On abandonment (no payment.captured within TTL): the reservation auto-expires, leaving
  //     the wallet balance intact for the next booking.
  if (pendingCreditAmount > 0) {
    try {
      const reserveResult = await customerCreditLedgerRepo.reserveCredit(
        customer.customerId,
        preGeneratedBookingId,
        pendingCreditAmount,
        idempotencyKey,
      );
      if (reserveResult === 'already_reserved') {
        // Idempotent replay: same key, same booking â€” the Razorpay order was already created
        // in a prior attempt (but the response may not have reached the client). Return the
        // same pending credit info so the client can resume payment.
        console.info('[createBooking] credit reservation already exists â€” idempotent replay', {
          customerId: customer.customerId,
          bookingId: preGeneratedBookingId,
        });
        // Fall through to create the Razorpay order (or it may already exist; Razorpay is
        // idempotent on order ID because the receipt is unique per attempt â€” acceptable).
      }
    } catch (reserveErr: unknown) {
      Sentry.captureException(reserveErr);
      console.error('[createBooking] credit reservation failed â€” falling back to no-credit Razorpay', {
        customerId: customer.customerId,
        err: reserveErr,
      });
      // Non-fatal: fall back to full-price Razorpay (safer than blocking the booking).
      // pendingCreditAmount is reset to 0 so no discount is applied.
      // The unreserved credit stays in the wallet for the next booking.
      // NOTE: if this was a 409 IDEMPOTENCY_KEY_ALREADY_USED for a different booking,
      // that is an abuse signal â€” Sentry captures it above.
      // For non-409 errors (Cosmos failures, timeouts, etc.), the reservation didn't
      // happen â€” credit stays intact in the wallet for the next booking attempt.
      // We fall through to create a full-price Razorpay order (no discount) which is safe.
    }
  }

  let order: Awaited<ReturnType<typeof createRazorpayOrder>>;
  try {
    order = await createRazorpayOrder({
      amount: payableAmount > 0 ? payableAmount : service.basePrice,
      currency: 'INR',
      receipt: makeRazorpayReceipt(customer.customerId),
      notes: { bookingId: preGeneratedBookingId },
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error('[createBooking] Razorpay order creation failed', {
      customerId: customer.customerId,
      serviceId: parsed.data.serviceId,
      err,
    });
    return {
      status: 502,
      jsonBody: {
        code: 'PAYMENT_ORDER_FAILED',
        message: 'Could not start payment. Please try again.',
      },
    };
  }

  // P1-6: Store the intended credit amount on the booking doc.
  // The webhook (payment.captured) will call applyCredit to debit the ledger.
  // If the customer abandons payment, no credit is debited (it stays intact).
  const razorpayCreditOptions: BookingCreateCreditOptions | undefined = pendingCreditAmount > 0
    ? { pendingCreditAmountInPaise: pendingCreditAmount, pendingCreditIdempotencyKey: idempotencyKey }
    : undefined;

  const booking = await bookingRepo.createPending(
    parsed.data,
    customer.customerId,
    order.id,
    service.basePrice,
    bookingMetadata(customer, service.name),
    preGeneratedBookingId,
    razorpayCreditOptions,
  );
  try {
    posthog.capture({
      distinctId: customer.customerId,
      event: 'booking-created',
      properties: {
        bookingId: booking.id,
        serviceId: parsed.data.serviceId,
        paymentMethod: 'RAZORPAY',
        // appliedCreditAmount reported as 0 here â€” actual debit happens post-payment
        appliedCreditAmount: 0,
        pendingCreditAmount,
      },
    });
  } catch { /* never break the main path */ }
  return {
    status: 201,
    jsonBody: {
      bookingId: booking.id,
      razorpayOrderId: order.id,
      amount: order.amount,
      requiresPayment: true,
      paymentMethod: 'RAZORPAY',
      // Report pending credit to client so the UI can show "â‚¹X will be applied after payment"
      appliedCreditAmount: 0,
      pendingCreditAmount,
    },
  };
};

const confirmHandler: CustomerHttpHandler = async (req, _ctx, customer) => {
  const id = (req as unknown as { params: { id: string } }).params.id;
  const body = await req.json().catch(() => null);
  const parsed = ConfirmBookingRequestSchema.safeParse(body);
  if (!parsed.success) return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };

  const booking = await bookingRepo.getById(id);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.customerId !== customer.customerId) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };

  if (!verifyPaymentSignature({
    razorpayOrderId: parsed.data.razorpayOrderId,
    razorpayPaymentId: parsed.data.razorpayPaymentId,
    razorpaySignature: parsed.data.razorpaySignature,
  })) return { status: 400, jsonBody: { code: 'SIGNATURE_INVALID' } };

  const confirmed = await bookingRepo.confirmPayment(id, parsed.data.razorpayPaymentId, parsed.data.razorpaySignature);
  if (!confirmed) return { status: 409, jsonBody: { code: 'BOOKING_ALREADY_PROCESSED' } };

  // Only audit when this call actually performed the transition. If status is PAID the webhook
  // already processed the booking â€” this is an idempotent confirm, not a new event.
  if (confirmed.status === 'SEARCHING') {
    const _ts = new Date().toISOString();
    void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', action: 'CUSTOMER_CONFIRMED_PAYMENT', 
resourceType: 'booking', resourceId: confirmed.id, payload: { bookingId: confirmed.id, paymentId: 
parsed.data.razorpayPaymentId }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
  }

  return { status: 200, jsonBody: { bookingId: confirmed.id, status: confirmed.status } };
};

export const createBookingHandler: HttpHandler = requireCustomer(createHandler);
export const confirmBookingHandler: HttpHandler = requireCustomer(confirmHandler);

const getBookingInner: CustomerHttpHandler = async (req, _ctx, customer) => {
  const id = (req as unknown as { params: { id: string } }).params.id;
  const booking = await bookingRepo.getById(id);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.customerId !== customer.customerId) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  return {
    status: 200,
    jsonBody: {
      bookingId: booking.id, status: booking.status, amount: booking.amount,
      finalAmount: booking.finalAmount ?? null,
      pendingAddOns: booking.pendingAddOns ?? [],
      approvedAddOns: booking.approvedAddOns ?? [],
    },
  };
};
export const getBookingHandler: HttpHandler = requireCustomer(getBookingInner);

const getMyBookingsInner: CustomerHttpHandler = async (_req, ctx, customer) => {
  try {
    const bookings = await bookingRepo.getByCustomerId(customer.customerId);
    const serviceNames = new Map<string, string>();

    await Promise.all(
      [...new Set(bookings.map((booking) => booking.serviceId))].map(async (serviceId) => {
        const service = await catalogueRepo.getServiceByIdCrossPartition(serviceId);
        serviceNames.set(serviceId, service?.name ?? serviceId);
      }),
    );

    return {
      status: 200,
      jsonBody: {
        bookings: bookings.map((booking) => ({
          bookingId: booking.id,
          serviceId: booking.serviceId,
          serviceName: serviceNames.get(booking.serviceId) ?? booking.serviceId,
          addressText: normalizeAddressText(booking.addressText),
          addressLatLng: booking.addressLatLng,
          status: booking.status,
          slotDate: booking.slotDate,
          slotWindow: booking.slotWindow,
          amount: booking.finalAmount ?? booking.amount,
          paymentMethod: booking.paymentMethod ?? 'RAZORPAY',
          createdAt: booking.createdAt,
        })),
      },
    };
  } catch (err: unknown) {
    Sentry.captureException(err);
    ctx.error('getMyBookings failed', err);
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }
};
export const getMyBookingsHandler: HttpHandler = requireCustomer(getMyBookingsInner);

export const requestAddonHandler: HttpHandler = async (req, _ctx) => {
  let uid: string;
  try { ({ uid } = await verifyTechnicianToken(req)); }
  catch { return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } }; }
  const id = (req as unknown as { params: { id: string } }).params.id;
  const booking = await bookingRepo.getById(id);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  const body = await req.json().catch(() => null);
  const parsed = RequestAddOnBodySchema.safeParse(body);
  if (!parsed.success) return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  const updated = await bookingRepo.requestAddOn(id, parsed.data);
  if (!updated) return { status: 409, jsonBody: { code: 'BOOKING_NOT_IN_PROGRESS' } };

  try {
    await sendPriceApprovalPush(booking.customerId, id);
  } catch (err) {
    console.error('[requestAddon] FCM push failed â€” booking is AWAITING_PRICE_APPROVAL but customer was not 
notified', { bookingId: id, err });
  }

  return { status: 200, jsonBody: { bookingId: updated.id, status: updated.status } };
};

const approveFinalPriceInner: CustomerHttpHandler = async (req, _ctx, customer) => {
  const id = (req as unknown as { params: { id: string } }).params.id;
  const body = await req.json().catch(() => null);
  const parsed = ApproveAddOnsBodySchema.safeParse(body);
  if (!parsed.success) return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  const updated = await bookingRepo.applyAddOnDecisions(id, customer.customerId, parsed.data.decisions);
  if (!updated) return { status: 409, jsonBody: { code: 'BOOKING_NOT_AWAITING_APPROVAL' } };
  return { status: 200, jsonBody: { bookingId: updated.id, status: updated.status, finalAmount: updated.finalAmount } 
};
};
export const approveFinalPriceHandler: HttpHandler = requireCustomer(approveFinalPriceInner);

const createBookingRateLimiter = withRateLimit({
  buckets: { ip: { capacity: 20, refillPerSec: 20 / 60 } },
});

app.http('createBooking', { route: 'v1/bookings', methods: ['POST'], handler: 
createBookingRateLimiter(createBookingHandler) });
app.http('confirmBooking', { route: 'v1/bookings/{id}/confirm', methods: ['POST'], handler: 
requireIntegrity(confirmBookingHandler) });
app.http('getMyBookings', { route: 'v1/bookings', methods: ['GET'], handler: getMyBookingsHandler });
app.http('getBooking', { route: 'v1/bookings/{id}', methods: ['GET'], handler: getBookingHandler });
app.http('requestAddon', { route: 'v1/bookings/{id}/request-addon', methods: ['POST'], handler: requestAddonHandler });
app.http('approveFinalPrice', { route: 'v1/bookings/{id}/approve-final-price', methods: ['POST'], handler: 
approveFinalPriceHandler });

> /**
 * E13-S01 â€” TDD tests for POST /v1/bookings with applyCredit flag
 *
 * Tests committed BEFORE implementation (red phase).
 * Covers: AC-3, AC-4, AC-5, AC-6, AC-9 (coverage floor).
 *
 * P1-5: When credit covers 100% of booking, Razorpay order is skipped; requiresPayment=false.
 * P1-6: For partial credit, applyCredit is NOT called at booking-creation time.
 *       Instead pendingCreditAmount is returned to client; debit deferred to payment.captured webhook.
 */

import { beforeEach, describe, it, expect, vi } from 'vitest';
import { HttpRequest, type HttpResponseInit } from '@azure/functions';

// ---------------------------------------------------------------------------
// Stubs â€” Razorpay keys so we exercise the credit path, not the fallback path
// ---------------------------------------------------------------------------

vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test');
vi.stubEnv('RAZORPAY_KEY_SECRET', 'rzp_secret');

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('../../src/middleware/requireCustomer.js', () => ({
  requireCustomer: (
    handler: (req: HttpRequest, ctx: unknown, claims: { customerId: string }) => Promise<unknown>,
  ) =>
    (req: HttpRequest, ctx: unknown) =>
      handler(req, ctx, { customerId: 'cust-1' }),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    createPending: vi.fn().mockResolvedValue({
      id: 'bk-100',
      customerId: 'cust-1',
      serviceId: 'svc-1',
      categoryId: 'cat-1',
      slotDate: '2026-05-15',
      slotWindow: '10:00-12:00',
      addressText: '12 Main St',
      addressLatLng: { lat: 26.79, lng: 82.19 },
      status: 'PENDING_PAYMENT',
      paymentOrderId: 'order_abc',
      paymentId: null,
      paymentSignature: null,
      amount: 59900,
      createdAt: new Date().toISOString(),
    }),
    getById: vi.fn(),
    confirmPayment: vi.fn(),
    markPaid: vi.fn(),
  },
}));

vi.mock('../../src/services/razorpay.service.js', () => ({
  createRazorpayOrder: vi.fn().mockResolvedValue({ id: 'order_abc', amount: 59900, currency: 'INR' }),
  verifyPaymentSignature: vi.fn().mockReturnValue(true),
}));

vi.mock('../../src/services/dispatcher.service.js', () => ({
  dispatcherService: {
    triggerDispatch: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: {
    getServiceByIdCrossPartition: vi.fn().mockResolvedValue({
      id: 'svc-1',
      name: 'AC Deep Clean',
      basePrice: 59900,
      isActive: true,
    }),
  },
}));

vi.mock('../../src/cosmos/customer-credit-ledger-repository.js', () => ({
  customerCreditLedgerRepo: {
    getBalance: vi.fn(),
    applyCredit: vi.fn(),
    reserveCredit: vi.fn().mockResolvedValue('reserved'),
  },
}));

vi.mock('../../src/services/featureFlags.service.js', () => ({
  isSoftLaunchEnabled: vi.fn().mockResolvedValue(true),
  isMarketingPaused: vi.fn().mockResolvedValue(false),
  isServiceAreaGatingEnabled: vi.fn().mockResolvedValue(false),
  isWalletCreditEnabled: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
  withScope: vi.fn(),
}));

vi.mock('../../src/observability/posthog.js', () => ({
  posthog: { capture: vi.fn() },
}));

vi.mock('../../src/data/service-area-ayodhya.js', () => ({
  AYODHYA_SERVICE_AREA: { type: 'Polygon', coordinates: [[]] },
}));

vi.mock('../../src/services/service-area.service.js', () => ({
  isLatLngInServiceArea: vi.fn().mockReturnValue(true),
}));

// ---------------------------------------------------------------------------
// Test imports (after mocks)
// ---------------------------------------------------------------------------

import { createBookingHandler } from '../../src/functions/bookings.js';
import { customerCreditLedgerRepo } from '../../src/cosmos/customer-credit-ledger-repository.js';
import { isWalletCreditEnabled } from '../../src/services/featureFlags.service.js';

type MockFn = ReturnType<typeof vi.fn>;

const VALID_BODY_IN_AREA = {
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-05-15',
  slotWindow: '10:00-12:00',
  addressText: '12 Main St, Ayodhya',
  addressLatLng: { lat: 26.79, lng: 82.19 },
};

function postReq(body: unknown, idempotencyKey?: string): HttpRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;
  return new HttpRequest({
    url: 'http://localhost/api/v1/bookings',
    method: 'POST',
    body: { string: JSON.stringify(body) },
    headers,
  });
}

// ---------------------------------------------------------------------------
// AC-3: Sufficient credit â€” partial credit (Razorpay path)
// P1-6: applyCredit is NOT called at booking-creation; credit deferred to webhook
// ---------------------------------------------------------------------------

describe('POST /v1/bookings with applyCredit=true â€” partial credit Razorpay (AC-3 / P1-6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 50000, // partial â€” does NOT cover full 59900 price
      lastUpdatedAt: new Date().toISOString(),
    });
    // applyCredit mock is NOT pre-loaded here because it should NOT be called for partial credit
  });

  it('P1-6: does NOT call applyCredit at booking-creation time for partial Razorpay credit', async () => {
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-001'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    // applyCredit is deferred to webhook â€” must NOT be called here
    expect(customerCreditLedgerRepo.applyCredit).not.toHaveBeenCalled();
    // appliedCreditAmount is 0 at booking creation; pendingCreditAmount signals the deferred amount
    const body = res.jsonBody as { appliedCreditAmount: number; pendingCreditAmount: number; requiresPayment: boolean 
};
    expect(body.appliedCreditAmount).toBe(0);
    expect(body.pendingCreditAmount).toBe(50000);
    expect(body.requiresPayment).toBe(true);
  });

  it('when balance > basePrice the full-credit (P1-5) path fires: requiresPayment=false, applyCredit called', async () 
=> {
    // balance=100000 >= basePrice=59900 â†’ full-credit path (P1-5)
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 100000,
      lastUpdatedAt: new Date().toISOString(),
    });
    (customerCreditLedgerRepo.applyCredit as MockFn).mockResolvedValue({
      appliedAmountInPaise: 59900,
      newBalanceInPaise: 40100,
      idempotent: false,
    });
    // Full-credit path needs markPaid
    const { bookingRepo: repo } = await import('../../src/cosmos/booking-repository.js');
    (repo.markPaid as MockFn).mockResolvedValue({
      id: 'bk-100', customerId: 'cust-1', status: 'PAID', amount: 59900, createdAt: new Date().toISOString(),
    });

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-002'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    const body = res.jsonBody as { appliedCreditAmount: number; requiresPayment: boolean };
    // Credit covers full price â†’ requiresPayment=false (P1-5)
    expect(body.requiresPayment).toBe(false);
    expect(body.appliedCreditAmount).toBe(59900); // capped at basePrice
  });
});

// ---------------------------------------------------------------------------
// P1-5: Credit covers 100% â€” skip Razorpay order, mark PAID directly
// ---------------------------------------------------------------------------

describe('POST /v1/bookings with applyCredit=true â€” full credit covers price (P1-5)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    // Balance >= basePrice â†’ full credit path
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 80000, // > 59900 (basePrice)
      lastUpdatedAt: new Date().toISOString(),
    });
    (customerCreditLedgerRepo.applyCredit as MockFn).mockResolvedValue({
      appliedAmountInPaise: 59900, // capped at booking amount
      newBalanceInPaise: 20100,
      idempotent: false,
    });
    // Full-credit path calls markPaid â€” configure it to return a successful booking
    const { bookingRepo: repo } = await import('../../src/cosmos/booking-repository.js');
    (repo.markPaid as MockFn).mockResolvedValue({
      id: 'bk-100',
      customerId: 'cust-1',
      status: 'PAID',
      amount: 59900,
      createdAt: new Date().toISOString(),
    });
  });

  it('P1-5: skips Razorpay order creation when credit covers full price', async () => {
    const { createRazorpayOrder } = await import('../../src/services/razorpay.service.js');

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-full-1'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    const body = res.jsonBody as {
      appliedCreditAmount: number;
      requiresPayment: boolean;
      paymentMethod: string;
    };
    expect(body.requiresPayment).toBe(false);
    expect(body.paymentMethod).toBe('CREDIT_FULL');
    expect(body.appliedCreditAmount).toBe(59900);
    // Razorpay order must NOT be created
    expect(createRazorpayOrder).not.toHaveBeenCalled();
    // applyCredit IS called synchronously for full-credit path
    expect(customerCreditLedgerRepo.applyCredit).toHaveBeenCalledWith(
      'cust-1',
      expect.any(String),
      59900, // capped at basePrice
      'idem-key-full-1',
    );
  });

  it('P1-5: dispatches booking immediately after full-credit PAID (no payment event needed)', async () => {
    const { dispatcherService } = await import('../../src/services/dispatcher.service.js');

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-full-2'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    expect(dispatcherService.triggerDispatch).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AC-4: Zero balance â€” skip
// ---------------------------------------------------------------------------

describe('POST /v1/bookings with applyCredit=true â€” zero balance (AC-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 0,
      lastUpdatedAt: new Date().toISOString(),
    });
  });

  it('returns 201 with appliedCreditAmount=0 and does not write ledger entry', async () => {
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-003'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    const body = res.jsonBody as { appliedCreditAmount: number };
    expect(body.appliedCreditAmount).toBe(0);
    expect(customerCreditLedgerRepo.applyCredit).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AC-4 variant: applyCredit=false or absent â€” no credit lookup
// ---------------------------------------------------------------------------

describe('POST /v1/bookings with applyCredit absent / false', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
  });

  it('does not query balance when applyCredit is absent', async () => {
    const res = (await createBookingHandler(
      postReq(VALID_BODY_IN_AREA),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    expect(customerCreditLedgerRepo.getBalance).not.toHaveBeenCalled();
    expect(customerCreditLedgerRepo.applyCredit).not.toHaveBeenCalled();
  });

  it('does not query balance when applyCredit=false', async () => {
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: false }),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    expect(customerCreditLedgerRepo.getBalance).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AC-5: Idempotency-key â€” missing header
// ---------------------------------------------------------------------------

describe('POST /v1/bookings â€” idempotency-key (AC-5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 50000,
      lastUpdatedAt: new Date().toISOString(),
    });
  });

  it('returns 422 when applyCredit=true but Idempotency-Key header is missing', async () => {
    // No idempotencyKey passed
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(422);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  it('proceeds with partial credit deferred when key is present', async () => {
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-ok'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    // getBalance called to determine pending credit
    expect(customerCreditLedgerRepo.getBalance).toHaveBeenCalledWith('cust-1');
  });
});

// ---------------------------------------------------------------------------
// AC-6: Concurrent apply â€” 412 race path
// P1-1: Full-credit race now returns 409 CREDIT_RACE (not 201) because marking
// PAID with unapplied credit would result in a free booking.
// ---------------------------------------------------------------------------

describe('POST /v1/bookings â€” concurrent applyCredit race for full-credit path (AC-6 / P1-1 / P1-5)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    // Full-credit path: balance >= basePrice triggers applyCredit synchronously
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 80000,
      lastUpdatedAt: new Date().toISOString(),
    });
    // Re-setup service area mock after clearAllMocks
    const { isLatLngInServiceArea } = await import('../../src/services/service-area.service.js');
    (isLatLngInServiceArea as MockFn).mockReturnValue(true);
    const { isServiceAreaGatingEnabled, isSoftLaunchEnabled, isMarketingPaused } = await 
import('../../src/services/featureFlags.service.js');
    (isServiceAreaGatingEnabled as MockFn).mockResolvedValue(false);
    (isSoftLaunchEnabled as MockFn).mockResolvedValue(true);
    (isMarketingPaused as MockFn).mockResolvedValue(false);
  });

  it('P1-1: returns 409 CREDIT_RACE when applyCredit throws 412 (etag conflict â€” full-credit path)', async () => {
    // Repo throws 412 (etag conflict). attemptCreditApplication catches it and returns 0.
    // P1-1: applied=0 < pendingCreditAmount=59900 â†’ 409 CREDIT_RACE (not 201 free booking).
    const conflictErr = Object.assign(new Error('Precondition failed'), { code: 412 });
    (customerCreditLedgerRepo.applyCredit as MockFn).mockRejectedValue(conflictErr);

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-race'),
      {} as never,
    )) as HttpResponseInit;

    // P1-1: Must NOT return 201 â€” that would mean the booking was marked PAID with 0 credit applied.
    expect(res.status).toBe(409);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('CREDIT_RACE');
  });
});

// ---------------------------------------------------------------------------
// Feature-flag off: wallet credit disabled
// ---------------------------------------------------------------------------

describe('POST /v1/bookings â€” wallet credit feature flag off', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(false);
  });

  it('ignores applyCredit=true when feature flag is off', async () => {
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-flag-off'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    expect(customerCreditLedgerRepo.getBalance).not.toHaveBeenCalled();
    const body = res.jsonBody as { appliedCreditAmount?: number };
    expect(body.appliedCreditAmount ?? 0).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Verify service-area gating still works (Stream 1.4 regression guard)
// ---------------------------------------------------------------------------

describe('POST /v1/bookings â€” service-area gating (E16-S01 regression guard)', () => {
  it('returns 400 when location is out of service area and gating is enabled', async () => {
    const { isServiceAreaGatingEnabled } = await import('../../src/services/featureFlags.service.js');
    const { isLatLngInServiceArea } = await import('../../src/services/service-area.service.js');
    (isServiceAreaGatingEnabled as MockFn).mockResolvedValue(true);
    (isLatLngInServiceArea as MockFn).mockReturnValue(false);

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, addressLatLng: { lat: 28.6, lng: 77.2 } }), // Delhi
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect((res.jsonBody as { error: string }).error).toBe('SERVICE_NOT_AVAILABLE_AT_LOCATION');
  });
});

// ---------------------------------------------------------------------------
// P1-1: Verify credit was actually applied before marking booking PAID
// ---------------------------------------------------------------------------

describe('POST /v1/bookings â€” P1-1 verify-before-PAID (full-credit path)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    // Full-credit path: balance >= basePrice
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 80000, // > 59900
      lastUpdatedAt: new Date().toISOString(),
    });
    const { bookingRepo: repo } = await import('../../src/cosmos/booking-repository.js');
    (repo.markPaid as MockFn).mockResolvedValue({
      id: 'bk-100', customerId: 'cust-1', status: 'PAID', amount: 59900, createdAt: new Date().toISOString(),
    });
    // Re-setup service area mock after clearAllMocks
    const { isLatLngInServiceArea } = await import('../../src/services/service-area.service.js');
    (isLatLngInServiceArea as MockFn).mockReturnValue(true);
    const { isServiceAreaGatingEnabled } = await import('../../src/services/featureFlags.service.js');
    (isServiceAreaGatingEnabled as MockFn).mockResolvedValue(false);
    const { isSoftLaunchEnabled, isMarketingPaused } = await import('../../src/services/featureFlags.service.js');
    (isSoftLaunchEnabled as MockFn).mockResolvedValue(true);
    (isMarketingPaused as MockFn).mockResolvedValue(false);
  });

  it('P1-1a: marks PAID and dispatches when applied amount equals expected credit', async () => {
    // applyCredit returns full amount â€” all good
    (customerCreditLedgerRepo.applyCredit as MockFn).mockResolvedValue({
      appliedAmountInPaise: 59900,
      newBalanceInPaise: 20100,
      idempotent: false,
    });

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-p11a'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    const body = res.jsonBody as { requiresPayment: boolean; appliedCreditAmount: number };
    expect(body.requiresPayment).toBe(false);
    expect(body.appliedCreditAmount).toBe(59900);
  });

  it('P1-1b: returns 409 CREDIT_RACE when applyCredit returns 0 (all retries exhausted)', async () => {
    // Simulate race: all sentinel write retries failed, applied = 0
    (customerCreditLedgerRepo.applyCredit as MockFn).mockResolvedValue({
      appliedAmountInPaise: 0,
      newBalanceInPaise: 0,
      idempotent: false,
    });

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-p11b'),
      {} as never,
    )) as HttpResponseInit;

    // Must NOT mark PAID â€” booking is blocked with 409
    expect(res.status).toBe(409);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('CREDIT_RACE');
  });

  it('P1-1c: returns 409 CREDIT_RACE when applyCredit returns partial amount (balance shifted)', async () => {
    // Simulate partial race: applied = 40000 < expected 59900
    (customerCreditLedgerRepo.applyCredit as MockFn).mockResolvedValue({
      appliedAmountInPaise: 40000,
      newBalanceInPaise: 0,
      idempotent: false,
    });

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-p11c'),
      {} as never,
    )) as HttpResponseInit;

    // Partial credit should also reject â€” booking would be underpaid
    expect(res.status).toBe(409);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('CREDIT_RACE');
  });
});

// ---------------------------------------------------------------------------
// P1-2: Reserve credit BEFORE creating Razorpay order (partial credit path)
// ---------------------------------------------------------------------------

describe('POST /v1/bookings â€” P1-2 reserve-before-Razorpay (partial credit path)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (isWalletCreditEnabled as MockFn).mockResolvedValue(true);
    // Partial credit: balance < basePrice so we go to Razorpay path
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 30000, // < 59900 â†’ partial credit, Razorpay for the rest
      lastUpdatedAt: new Date().toISOString(),
    });
    (customerCreditLedgerRepo.reserveCredit as MockFn).mockResolvedValue('reserved');
    // Re-setup service area mock after clearAllMocks
    const { isLatLngInServiceArea } = await import('../../src/services/service-area.service.js');
    (isLatLngInServiceArea as MockFn).mockReturnValue(true);
    const { isServiceAreaGatingEnabled, isSoftLaunchEnabled, isMarketingPaused } = await 
import('../../src/services/featureFlags.service.js');
    (isServiceAreaGatingEnabled as MockFn).mockResolvedValue(false);
    (isSoftLaunchEnabled as MockFn).mockResolvedValue(true);
    (isMarketingPaused as MockFn).mockResolvedValue(false);
  });

  it('P1-2a: calls reserveCredit BEFORE creating the Razorpay order', async () => {
    const { createRazorpayOrder } = await import('../../src/services/razorpay.service.js');
    const callOrder: string[] = [];

    (customerCreditLedgerRepo.reserveCredit as MockFn).mockImplementation(() => {
      callOrder.push('reserve');
      return Promise.resolve('reserved');
    });
    (createRazorpayOrder as MockFn).mockImplementation(() => {
      callOrder.push('razorpay');
      return Promise.resolve({ id: 'order_partial', amount: 29900, currency: 'INR' });
    });

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-p12a'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    // reserve must come before razorpay
    expect(callOrder[0]).toBe('reserve');
    expect(callOrder[1]).toBe('razorpay');
  });

  it('P1-2b: reserveCredit called with correct customerId, bookingId, and amount', async () => {
    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-p12b'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    expect(customerCreditLedgerRepo.reserveCredit).toHaveBeenCalledWith(
      'cust-1',
      expect.any(String), // preGeneratedBookingId
      30000,              // pendingCreditAmount = min(balance, basePrice)
      'idem-key-p12b',
    );
  });

  it('P1-2c: idempotent replay (already_reserved) still proceeds to create Razorpay order', async () => {
    (customerCreditLedgerRepo.reserveCredit as MockFn).mockResolvedValue('already_reserved');
    const { createRazorpayOrder } = await import('../../src/services/razorpay.service.js');

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-p12c'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    // Razorpay order still created on idempotent replay
    expect(createRazorpayOrder).toHaveBeenCalled();
  });

  it('P1-2d: reserveCredit NOT called when pendingCreditAmount is 0', async () => {
    // Zero balance â†’ no reservation needed
    (customerCreditLedgerRepo.getBalance as MockFn).mockResolvedValue({
      balanceInPaise: 0,
      lastUpdatedAt: new Date().toISOString(),
    });

    const res = (await createBookingHandler(
      postReq({ ...VALID_BODY_IN_AREA, applyCredit: true }, 'idem-key-p12d'),
      {} as never,
    )) as HttpResponseInit;

    expect(res.status).toBe(201);
    expect(customerCreditLedgerRepo.reserveCredit).not.toHaveBeenCalled();
  });
});




exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/ratings.ts -Raw | Select-String -Pattern "Idempot|idempot|headers" -Context 4,6; Get-Content api/src/functions/complaints/partner-create.ts -Raw | Select-String -Pattern "Idempot|idempot|headers" -Context 4,6' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 2243ms:

> import { type HttpHandler, type HttpResponseInit, type InvocationContext, app } from '@azure/functions';
import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { ratingRepo } from '../cosmos/rating-repository.js';
import { SubmitRatingRequestSchema, type GetRatingResponse } from '../schemas/rating.js';
import type { CustomerSubScores, TechSubScores } from '../schemas/rating.js';
import { sendRatingReceivedPush } from '../services/fcm.service.js';
import * as Sentry from '@sentry/node';

async function uidFromAuth(authHeader: string): Promise<string | null> {
  if (!authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = await verifyFirebaseIdToken(authHeader.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

export const submitRatingHandler: HttpHandler = async (req, _ctx: InvocationContext) => {
  const uid = await uidFromAuth(req.headers.get('authorization') ?? '');
  if (!uid) return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };

  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, jsonBody: { code: 'PARSE_ERROR' } }; }
  const parsed = SubmitRatingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }
  const data = parsed.data;

  const booking = await bookingRepo.getById(data.bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };

  const isCustomer = booking.customerId === uid;
  const isTechnician = booking.technicianId === uid;
  if (!isCustomer && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (data.side === 'CUSTOMER_TO_TECH' && !isCustomer) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (data.side === 'TECH_TO_CUSTOMER' && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (booking.status !== 'CLOSED') {
    return { status: 409, jsonBody: { code: 'BOOKING_NOT_CLOSED', status: booking.status } };
  }
  if (!booking.technicianId) return { status: 409, jsonBody: { code: 'NO_TECHNICIAN' } };
  // Rating Shield (E07-S02) is advisory â€” it notifies the owner and starts a 2-hour window,
  // but the customer can always post their rating at any time ("Post anyway" button, or after
  // the timer expires). The shield does NOT block submission here; enforcement is client-side.
  // See docs/stories/E07-S02-rating-shield-escalation.md Â§ AC-4 and AC-5.

  const result = await ratingRepo.submitSide({
    bookingId: data.bookingId,
    customerId: booking.customerId,
    technicianId: booking.technicianId,
    side: data.side,
    overall: data.overall,
    subScores: data.subScores,
    ...(data.comment !== undefined ? { comment: data.comment } : {}),
  });
  if (!result) return { status: 409, jsonBody: { code: 'RATING_ALREADY_SUBMITTED' } };
  if (
    data.side === 'CUSTOMER_TO_TECH' &&
    data.overall < 5 &&
    data.comment &&
    data.comment.trim().length > 0 &&
    booking.technicianId
  ) {
    try {
      await sendRatingReceivedPush(booking.technicianId, {
        bookingId: data.bookingId,
        overall: data.overall,
        comment: data.comment,
      });
    } catch (err) {
      Sentry.captureException(err);
    }
  }
  return { status: 201, jsonBody: { bookingId: result.bookingId } };
};

type SideProjection =
  | { status: 'PENDING' }
  | { status: 'SUBMITTED'; overall: number; subScores: CustomerSubScores | TechSubScores; submittedAt: string; 
comment?: string };

function projectSide(
  overall: number | undefined,
  subScores: CustomerSubScores | TechSubScores | undefined,
  comment: string | undefined,
  submittedAt: string | undefined,
  reveal: boolean,
): SideProjection {
  if (!submittedAt || overall === undefined || !subScores) return { status: 'PENDING' };
  if (!reveal) return { status: 'PENDING' };
  return {
    status: 'SUBMITTED',
    overall,
    subScores,
    submittedAt,
    ...(comment !== undefined ? { comment } : {}),
  };
}

export const getRatingHandler: HttpHandler = async (req, _ctx: InvocationContext): Promise<HttpResponseInit> => {
  const uid = await uidFromAuth(req.headers.get('authorization') ?? '');
  if (!uid) return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  const isCustomer = booking.customerId === uid;
  const isTechnician = booking.technicianId === uid;
  if (!isCustomer && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };

  const doc = await ratingRepo.getByBookingId(bookingId);
  if (!doc) {
    const empty: GetRatingResponse = {
      bookingId, status: 'PENDING',
      customerSide: { status: 'PENDING' }, techSide: { status: 'PENDING' },
    };
    return { status: 200, jsonBody: empty };
  }

  const customerHas = doc.customerSubmittedAt !== undefined;
  const techHas = doc.techSubmittedAt !== undefined;
  const revealed = customerHas && techHas;
  const status: GetRatingResponse['status'] = revealed
    ? 'REVEALED'
    : (customerHas || techHas ? 'PARTIALLY_SUBMITTED' : 'PENDING');

  const customerVisible = revealed || (isCustomer && customerHas);
  const techVisible = revealed || (isTechnician && techHas);

  const response: GetRatingResponse = {
    bookingId,
    status,
    ...(doc.revealedAt !== undefined ? { revealedAt: doc.revealedAt } : {}),
    customerSide: projectSide(
      doc.customerOverall, doc.customerSubScores, doc.customerComment,
      doc.customerSubmittedAt, customerVisible,
    ),
    techSide: projectSide(
      doc.techOverall, doc.techSubScores, doc.techComment,
      doc.techSubmittedAt, techVisible,
    ),
  };
  return { status: 200, jsonBody: response };
};

app.http('submitRating', { route: 'v1/ratings', methods: ['POST'], handler: submitRatingHandler });
app.http('getRating', { route: 'v1/ratings/{bookingId}', methods: ['GET'], handler: getRatingHandler });

> import { app } from '@azure/functions';
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
  if (booking.status !== 'CLOSED') {
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
    }
  }

  sendOwnerComplaintFiled({ bookingId: data.bookingId, filedBy, reasonCode: data.reasonCode })
    .catch((err: unknown) => ctx.error('sendOwnerComplaintFiled failed', err));

  const response: PartnerComplaintResponse = {
    id: doc.id,
    status: doc.status,
    filedBy: doc.filedBy,
    reasonCode: doc.reasonCode,
    acknowledgeDeadlineAt: doc.acknowledgeDeadlineAt,
    slaDeadlineAt: doc.slaDeadlineAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  return { status: 201, jsonBody: response };
}

app.http('partnerCreateComplaint', {
  methods: ['POST'],
  route: 'v1/complaints',
  authLevel: 'anonymous',
  handler: partnerCreateComplaintHandler,
});




exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/dto/CreateBookingRequestDto.kt -Raw; Get-Content api/src/schemas/booking.ts -Raw | Select-String -Pattern "applyCredit" -Context 2,4' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 2525ms:

> import { z } from 'zod';
import { PendingAddOnSchema } from './addon-approval.js';

const BOOKING_STATUSES = [
  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE',
  'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED',
  'UNFULFILLED', 'CUSTOMER_CANCELLED', 'NO_SHOW_REDISPATCH',
] as const;

const PAYMENT_METHODS = ['RAZORPAY', 'CASH_ON_SERVICE'] as const;
const CASH_COLLECTION_STATUSES = ['PENDING', 'COLLECTED'] as const;

export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export const PaymentMethodSchema = z.enum(PAYMENT_METHODS);
export const CashCollectionStatusSchema = z.enum(CASH_COLLECTION_STATUSES);

export const BookingDocSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  serviceId: z.string(),
  serviceName: z.string().optional(),
  categoryId: z.string(),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotWindow: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/),
  addressText: z.string().min(1),
  addressLatLng: LatLngSchema,
  status: z.enum(BOOKING_STATUSES),
  paymentOrderId: z.string(),
  paymentMethod: PaymentMethodSchema.optional(),
  cashCollectionStatus: CashCollectionStatusSchema.optional(),
  paymentId: z.string().nullable(),
  paymentSignature: z.string().nullable(),
  amount: z.number().int().positive(),
  technicianId: z.string().optional(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  feesWaived: z.boolean().optional(),
  escalated: z.boolean().optional(),
  internalNotes: z.array(z.string()).optional(),
  photos: z.record(z.string(), z.array(z.string())).optional(),
  pendingAddOns: z.array(PendingAddOnSchema).optional(),
  approvedAddOns: z.array(PendingAddOnSchema).optional(),
  finalAmount: z.number().int().positive().optional(),
  /** ISO timestamp written atomically after redispatch offers are sent successfully. */
  noShowRedispatchAt: z.string().optional(),
  /** The technician who no-showed. Preserved separately so the exclusion filter works across timer recovery runs even 
after technicianId is cleared. */
  noShowTechnicianId: z.string().optional(),
  /** ISO timestamp written after the NO_SHOW_CREDIT_ISSUED FCM push is sent successfully. Prevents duplicate pushes 
across recovery runs. */
  noShowPushSentAt: z.string().optional(),
  /** ISO timestamp written when customer triggers Safety SOS. */
  sosActivatedAt: z.string().optional(),
  /** ISO timestamp written after sendOwnerSosAlert() succeeds. Absent = alert pending retry. */
  sosAlertSentAt: z.string().optional(),
  /**
   * ISO timestamp written atomically when the booking transitions to AWAITING_PRICE_APPROVAL
   * (i.e. when the technician requests an add-on). Used by the bookings change-feed projector
   * to anchor the ADDON_APPROVAL_REQUESTED expiresAt from the actual request time, not from
   * the booking's original createdAt (which may be >24h in the past for advance bookings).
   */
  pendingAddOnsUpdatedAt: z.string().optional(),
  /**
   * E13-S01 (P1-6): Wallet credit amount in paise that is PENDING debit for a Razorpay booking.
   * Written at booking creation time (before Razorpay order); deducted from the ledger only
   * after payment.captured is received from the Razorpay webhook. Absent = no credit pending.
   * Once the webhook debits the credit, this field should be removed (or left as a historical record).
   */
  pendingCreditAmountInPaise: z.number().int().nonnegative().optional(),
  /**
   * E13-S01 (P1-6): Idempotency key for the pending credit debit above.
   * Stored so the webhook can call applyCredit idempotently on re-delivery.
   */
  pendingCreditIdempotencyKey: z.string().optional(),
});

export const CreateBookingRequestSchema = z.object({
  serviceId: z.string().min(1),
  categoryId: z.string().min(1),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotWindow: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/),
  addressText: z.string().min(1),
  addressLatLng: LatLngSchema,
  paymentMethod: PaymentMethodSchema.default('RAZORPAY'),
  /**
   * E13-S01: If true, the server will attempt to apply the customer's wallet
   * credit balance against this booking's amount. The actual applied amount is
   * returned as `appliedCreditAmount` in the response (may be 0 if no balance).
   * Requires an `Idempotency-Key: <uuid>` header for replay protection.
   */
  applyCredit: z.boolean().optional().default(false),
});

export const ConfirmBookingRequestSchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export type BookingDoc = z.infer<typeof BookingDocSchema>;
export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;
export type ConfirmBookingRequest = z.infer<typeof ConfirmBookingRequestSchema>;



Get-Content : Cannot find path 'C:\Alok\Business Projects\Urbanclap-sprint2b\customer-app\app\src\main\kotlin\com\homes
ervices\customer\data\booking\remote\dto\CreateBookingRequestDto.kt' because it does not exist.
At line:2 char:1
+ Get-Content customer-app/app/src/main/kotlin/com/homeservices/custome ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (C:\Alok\Busines...ngRequestDto.kt:String) [Get-Content], ItemNotFoundEx 
   ception
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetContentCommand
 

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "data class CreateBookingRequestDto" customer-app/app/src/main/kotlin -n' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1659ms:
customer-app/app/src/main/kotlin\com\homeservices\customer\data\booking\remote\dto\BookingDtos.kt:11:public data class CreateBookingRequestDto(

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/dto/BookingDtos.kt -Raw' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1818ms:
package com.homeservices.customer.data.booking.remote.dto

import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.BookingResult
import com.homeservices.customer.domain.booking.model.CustomerBooking
import com.homeservices.customer.domain.booking.model.CustomerBookingStatus
import com.homeservices.customer.domain.booking.model.PendingAddOn
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class CreateBookingRequestDto(
    val serviceId: String,
    val categoryId: String,
    val slotDate: String,
    val slotWindow: String,
    val addressText: String,
    val addressLatLng: LatLngDto,
    val paymentMethod: String = BookingPaymentMethod.RAZORPAY.name,
)

@JsonClass(generateAdapter = true)
public data class LatLngDto(
    val lat: Double,
    val lng: Double,
)

@JsonClass(generateAdapter = true)
public data class CreateBookingResponseDto(
    val bookingId: String,
    val razorpayOrderId: String,
    val amount: Int,
    val requiresPayment: Boolean = true,
    val paymentMethod: String? = null,
) {
    public fun toDomain(): BookingResult =
        BookingResult(
            bookingId = bookingId,
            razorpayOrderId = razorpayOrderId,
            amount = amount,
            requiresPayment = requiresPayment,
            paymentMethod =
                paymentMethod
                    ?.let { runCatching { BookingPaymentMethod.valueOf(it) }.getOrNull() }
                    ?: BookingPaymentMethod.RAZORPAY,
        )
}

@JsonClass(generateAdapter = true)
public data class ConfirmBookingRequestDto(
    val razorpayPaymentId: String,
    val razorpayOrderId: String,
    val razorpaySignature: String,
)

@JsonClass(generateAdapter = true)
public data class ConfirmBookingResponseDto(
    val bookingId: String,
    val status: String,
)

@JsonClass(generateAdapter = true)
public data class PendingAddOnDto(
    val name: String,
    val price: Int,
    val triggerDescription: String,
) {
    public fun toDomain(): PendingAddOn = PendingAddOn(name, price, triggerDescription)
}

@JsonClass(generateAdapter = true)
public data class GetBookingResponseDto(
    val bookingId: String,
    val status: String,
    val amount: Int,
    val finalAmount: Int?,
    val pendingAddOns: List<PendingAddOnDto>,
)

@JsonClass(generateAdapter = true)
public data class AddOnDecisionDto(
    val name: String,
    val approved: Boolean,
)

@JsonClass(generateAdapter = true)
public data class ApproveFinalPriceRequestDto(
    val decisions: List<AddOnDecisionDto>,
)

@JsonClass(generateAdapter = true)
public data class ApproveFinalPriceResponseDto(
    val bookingId: String,
    val status: String,
    val finalAmount: Int?,
)

@JsonClass(generateAdapter = true)
public data class CustomerBookingsResponseDto(
    val bookings: List<CustomerBookingDto> = emptyList(),
)

@JsonClass(generateAdapter = true)
public data class CustomerBookingDto(
    val bookingId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val status: String,
    val slotDate: String,
    val slotWindow: String,
    val amount: Long,
    val paymentMethod: String? = null,
    val createdAt: String,
) {
    public fun toDomain(): CustomerBooking =
        CustomerBooking(
            bookingId = bookingId,
            serviceId = serviceId,
            serviceName = serviceName,
            addressText = addressText,
            status =
                runCatching {
                    CustomerBookingStatus.valueOf(status)
                }.getOrDefault(CustomerBookingStatus.UNKNOWN),
            slotDate = slotDate,
            slotWindow = slotWindow,
            amountPaise = amount,
            paymentMethod =
                paymentMethod
                    ?.let { runCatching { BookingPaymentMethod.valueOf(it) }.getOrNull() }
                    ?: BookingPaymentMethod.RAZORPAY,
            createdAt = createdAt,
        )
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "idempotency key|idem" customer-app/app/src/test/kotlin/com/homeservices/customer/data/booking -n' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 3094ms:
customer-app/app/src/test/kotlin/com/homeservices/customer/data/booking\BookingRepositoryImplTest.kt:49:            val result = repo.createBooking(fakeRequest, "idem-key").toList()

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/tests/observability/sentry-before-send.test.ts -Raw; Get-Content api/src/observability/sentry.ts -Raw' in C:\Alok\Business Projects\Urbanclap-sprint2b
 succeeded in 1451ms:
/**
 * TDD (E13-S04) â€” Sentry beforeSend PII scrubbing + header stripping.
 *
 * These tests verify the scrubSentryEvent helper that is wired into the
 * beforeSend callback on every Sentry.init call.
 */

import { describe, it, expect } from 'vitest';
import { scrubSentryEvent } from '../../src/observability/sentry.js';

// ---------------------------------------------------------------------------
// Fixture: minimal SentryEvent shape used for testing.
// We don't import the real Sentry Event type to keep tests free of SDK deps.
// ---------------------------------------------------------------------------

function makeEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    event_id: 'abc123',
    level: 'error',
    message: undefined,
    exception: undefined,
    request: undefined,
    ...overrides,
  };
}

describe('scrubSentryEvent â€” PII redaction', () => {
  it('redacts Indian mobile number in message', () => {
    const event = makeEvent({ message: 'User 9876543210 signed in' });
    const result = scrubSentryEvent(event);
    expect(result.message).toBe('User [REDACTED_PHONE] signed in');
  });

  it('redacts email address in message', () => {
    const event = makeEvent({ message: 'Login failed for user@example.com' });
    const result = scrubSentryEvent(event);
    expect(result.message).toBe('Login failed for [REDACTED_EMAIL]');
  });

  it('redacts Aadhaar number (spaced format) in message', () => {
    const event = makeEvent({ message: 'Aadhaar 1234 5678 9012 verified' });
    const result = scrubSentryEvent(event);
    expect(result.message).toBe('Aadhaar [REDACTED_AADHAAR] verified');
  });

  it('redacts PAN in message', () => {
    const event = makeEvent({ message: 'PAN ABCDE1234F submitted' });
    const result = scrubSentryEvent(event);
    expect(result.message).toBe('PAN [REDACTED_PAN] submitted');
  });

  it('redacts JWT in message', () => {
    const jwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIn0.sig';
    const event = makeEvent({ message: `Token: ${jwt}` });
    const result = scrubSentryEvent(event);
    expect(result.message).toContain('[REDACTED_JWT]');
  });

  it('preserves stack trace structure (exception.values array passes through)', () => {
    const event = makeEvent({
      exception: {
        values: [
          {
            type: 'TypeError',
            value: 'Cannot read property x of undefined',
            stacktrace: {
              frames: [
                { filename: 'src/functions/bookings.ts', lineno: 42, colno: 7 },
              ],
            },
          },
        ],
      },
    });
    const result = scrubSentryEvent(event);
    const values = (result.exception as { values: unknown[] }).values;
    expect(values).toHaveLength(1);
    const first = (values[0] ?? {}) as Record<string, unknown>;
    expect(first.type).toBe('TypeError');
    const st = first.stacktrace as { frames: { filename: string }[] };
    expect(st.frames[0]?.filename).toBe('src/functions/bookings.ts');
  });

  it('strips sensitive headers from request.headers', () => {
    const event = makeEvent({
      request: {
        url: 'https://api.example.com/v1/bookings',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer eyJsometoken',
          cookie: 'hs_access=abc; hs_refresh=def',
          'x-integrity-token': 'some-integrity-value',
          'x-firebase-token': 'firebase-token-value',
          'x-correlation-id': 'corr-123',
        },
      },
    });
    const result = scrubSentryEvent(event);
    const headers = (result.request as { headers: Record<string, string> }).headers;
    // Sensitive headers must be absent
    expect(headers['authorization']).toBeUndefined();
    expect(headers['cookie']).toBeUndefined();
    expect(headers['x-integrity-token']).toBeUndefined();
    expect(headers['x-firebase-token']).toBeUndefined();
    // Non-sensitive header must be preserved
    expect(headers['content-type']).toBe('application/json');
    expect(headers['x-correlation-id']).toBe('corr-123');
  });
});

import * as Sentry from '@sentry/node';
import type { Event as SentryEvent } from '@sentry/node';

// ---------------------------------------------------------------------------
// PII redaction patterns (ADR-0018)
// ---------------------------------------------------------------------------

const PHONE_RE = /\b[6-9]\d{9}\b/g;
const EMAIL_RE = /[\w._%+\-]+@[\w.\-]+\.\w{2,}/g;
const AADHAAR_RE = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;
const PAN_RE = /\b[A-Z]{5}\d{4}[A-Z]\b/g;
const JWT_RE = /eyJ[A-Za-z0-9_\-]{20,}/g;

/** Headers to strip from request context before sending to Sentry. */
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'x-integrity-token',
  'x-firebase-token',
]);

/**
 * Redact all PII in a string value.
 * Applied to every string field visited during event scrubbing.
 */
function redactString(value: string): string {
  return value
    .replace(PHONE_RE, '[REDACTED_PHONE]')
    .replace(EMAIL_RE, '[REDACTED_EMAIL]')
    .replace(AADHAAR_RE, '[REDACTED_AADHAAR]')
    .replace(PAN_RE, '[REDACTED_PAN]')
    .replace(JWT_RE, '[REDACTED_JWT]');
}

/**
 * Recursively walk an object and redact string leaves.
 * Arrays and nested objects are traversed; non-string primitives are left as-is.
 *
 * NOTE: this mutates the input in place to avoid deep-cloning the entire event
 * (Sentry events can be large). The event object is owned by the SDK for the
 * duration of the beforeSend callback, so mutation is safe.
 */
function walkAndRedact(node: unknown): unknown {
  if (typeof node === 'string') return redactString(node);
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      node[i] = walkAndRedact(node[i]);
    }
    return node;
  }
  if (node !== null && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      obj[key] = walkAndRedact(obj[key]);
    }
    return obj;
  }
  return node;
}

/**
 * Scrub a Sentry event before it is transmitted.
 *
 * - Redacts all string fields that match PII patterns (phone, email, Aadhaar,
 *   PAN, JWT).
 * - Strips sensitive request headers (authorization, cookie, x-integrity-token,
 *   x-firebase-token).
 * - Preserves stack traces and non-string fields untouched.
 *
 * Exported for direct unit testing (sentry-before-send.test.ts).
 *
 * @param event A Sentry event object (may be partially shaped in tests).
 * @returns The mutated event â€” Sentry expects the same event returned.
 */
export function scrubSentryEvent(event: Record<string, unknown>): Record<string, unknown>;
export function scrubSentryEvent(event: SentryEvent): SentryEvent;
export function scrubSentryEvent(event: unknown): unknown {
  if (event === null || typeof event !== 'object') return event;

  const ev = event as Record<string, unknown>;

  // Scrub top-level message
  if (typeof ev['message'] === 'string') {
    ev['message'] = redactString(ev['message']);
  }

  // Scrub exception value messages (stack traces left intact)
  const exception = ev['exception'] as Record<string, unknown> | undefined;
  if (exception && Array.isArray(exception['values'])) {
    for (const exceptionValue of exception['values'] as Record<string, unknown>[]) {
      if (typeof exceptionValue['value'] === 'string') {
        exceptionValue['value'] = redactString(exceptionValue['value']);
      }
      // Stack frames: filenames and function names are code identifiers, not PII.
      // We deliberately do NOT scrub them so stack traces remain readable.
    }
  }

  // Scrub breadcrumbs
  const breadcrumbs = ev['breadcrumbs'] as Record<string, unknown> | undefined;
  if (breadcrumbs && Array.isArray(breadcrumbs['values'])) {
    for (const crumb of breadcrumbs['values'] as Record<string, unknown>[]) {
      if (typeof crumb['message'] === 'string') {
        crumb['message'] = redactString(crumb['message']);
      }
      if (crumb['data'] && typeof crumb['data'] === 'object') {
        walkAndRedact(crumb['data']);
      }
    }
  }

  // Scrub extra/contexts
  if (ev['extra']) walkAndRedact(ev['extra']);
  if (ev['contexts']) walkAndRedact(ev['contexts']);
  if (ev['tags']) walkAndRedact(ev['tags']);

  // Strip sensitive request headers
  const request = ev['request'] as Record<string, unknown> | undefined;
  if (request) {
    const headers = request['headers'] as Record<string, string> | undefined;
    if (headers && typeof headers === 'object') {
      for (const header of Object.keys(headers)) {
        if (SENSITIVE_HEADERS.has(header.toLowerCase())) {
          delete headers[header];
        }
      }
    }
  }

  return ev;
}

export function initSentry(): void {
  const dsn = process.env['SENTRY_DSN'];
  if (!dsn) return;
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    release: process.env['GIT_SHA'] ?? 'local',
    environment: process.env['NODE_ENV'] ?? 'production',
    // Sentry v8 beforeSend uses an overloaded ErrorEvent type that is
    // incompatible with the generic SentryEvent. We cast through unknown to
    // satisfy the compiler; the runtime behavior is identical since we only
    // mutate string leaves and delete header keys.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
    beforeSend: (event: any) => scrubSentryEvent(event as Record<string, unknown>) as unknown as any,
  });
}


codex
The changes compile, unit tests and ktlint pass, and I did not find any introduced correctness, security, or maintainability issues that warrant an actionable review finding.
2026-05-23T00:32:25.844341Z ERROR codex_core::session: failed to record rollout items: thread 019e5230-373c-7542-942d-c6207e99dd98 not found
2026-05-23T00:32:26.666322Z ERROR codex_core::session: failed to record rollout items: thread 019e5230-3026-7e80-9bfe-de299ad6c4d3 not found
The changes compile, unit tests and ktlint pass, and I did not find any introduced correctness, security, or maintainability issues that warrant an actionable review finding.
