2026-09-05T12:54:34.486067Z ERROR codex_models_manager::manager: failed to load models cache: missing field `supports_parallel_tool_calls` at line 132 column 5
OpenAI Codex v0.147.0
--------
workdir: C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: high
reasoning summaries: none
session id: 01a071a2-9330-7391-aa32-107d63f17593
--------
user
changes against 'main'
  → Load repository instructions
  • Inspect diff against merge base
  • Analyze changed code for bugs
  • Produce JSON findings
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force -Name' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 717ms:
.claire
.firebase
.githooks
.github
.serena
.superpowers
admin-web
api
artifacts
commonMain
core-nav
customer-app
design-system
docs
figma
firebase
infra
moto-g-snapshots
plans
play-store-assets
technician-app
tools
_bmad
_bmad-output
.bmad-readiness-passed
.codex-review-passed
.firebaserc
.git
.gitattributes
.gitignore
.semgrepignore
CLAUDE.md
firebase.json
TOKEN-SYNC.md

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Recurse -Force -Filter AGENTS.md | Select-Object -ExpandProperty FullName; Get-ChildItem -Recurse -Force -Filter AGENTS.override.md | Select-Object -ExpandProperty FullName' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 3375ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force .agents | Format-List -Property Name,FullName,Mode' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
2026-09-05T12:54:53.602499Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.8 seconds
Output:
Get-ChildItem : Cannot find path 'C:\Alok\Business 
Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\.agents' because it does not exist.
At line:2 char:1
+ Get-ChildItem -Force .agents | Format-List -Property Name,FullName,Mo ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (C:\Alok\Busines...t-error\.agents:String) [Get-ChildItem], ItemNotFound 
   Exception
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetChildItemCommand
 

 exited 1 in 808ms:
Get-ChildItem : Cannot find path 'C:\Alok\Business 
Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\.agents' because it does not exist.
At line:2 char:1
+ Get-ChildItem -Force .agents | Format-List -Property Name,FullName,Mo ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (C:\Alok\Busines...t-error\.agents:String) [Get-ChildItem], ItemNotFound 
   Exception
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetChildItemCommand
 

  ✓ Load repository instructions
  → Inspect diff against merge base
  • Analyze changed code for bugs
  • Produce JSON findings
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --stat 0285c8e513fcc23986ed4cefd93b7a6dd682ec24; git diff --name-only 0285c8e513fcc23986ed4cefd93b7a6dd682ec24' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 651ms:
 .../customer/data/rating/RatingApiErrors.kt        |    53 +
 .../customer/data/rating/RatingRepositoryImpl.kt   |    15 +-
 .../customer/data/rating/remote/dto/RatingDtos.kt  |     9 +
 .../domain/rating/EscalateRatingUseCase.kt         |     5 +
 .../customer/domain/rating/RatingSubmitFailure.kt  |    43 +
 .../customer/ui/rating/RatingScreen.kt             |    69 +-
 .../customer/ui/rating/RatingViewModel.kt          |    49 +-
 .../app/src/main/res/values-hi/strings.xml         |     6 +
 customer-app/app/src/main/res/values/strings.xml   |     6 +
 .../data/rating/RatingSubmitErrorMappingTest.kt    |   123 +
 .../domain/rating/EscalateRatingUseCaseTest.kt     |    29 +-
 .../ui/rating/RatingScreenPaparazziTest.kt         |     1 +
 .../ui/rating/RatingShieldHindiPaparazziTest.kt    |     1 +
 .../ui/rating/RatingViewModelShieldTest.kt         |     7 +-
 .../ui/rating/RatingViewModelSubmitErrorTest.kt    |   235 +
 .../customer/ui/rating/RatingViewModelTest.kt      |     9 +-
 docs/reviews/codex-20260905-0820.md                |  4282 ++++++
 docs/reviews/codex-20260905-0834-round2.md         | 12877 +++++++++++++++++++
 18 files changed, 17809 insertions(+), 10 deletions(-)
customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingApiErrors.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/dto/RatingDtos.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/RatingSubmitFailure.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt
customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
customer-app/app/src/main/res/values-hi/strings.xml
customer-app/app/src/main/res/values/strings.xml
customer-app/app/src/test/kotlin/com/homeservices/customer/data/rating/RatingSubmitErrorMappingTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCaseTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingScreenPaparazziTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingShieldHindiPaparazziTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelShieldTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelSubmitErrorTest.kt
customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelTest.kt
docs/reviews/codex-20260905-0820.md
docs/reviews/codex-20260905-0834-round2.md
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --no-ext-diff --unified=80 0285c8e513fcc23986ed4cefd93b7a6dd682ec24 -- customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingApiErrors.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/dto/RatingDtos.kt customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/RatingSubmitFailure.kt customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt customer-app/app/src/main/res/values-hi/strings.xml customer-app/app/src/main/res/values/strings.xml' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 606ms:
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingApiErrors.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingApiErrors.kt
new file mode 100644
index 00000000..8fa8ed11
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingApiErrors.kt
@@ -0,0 +1,53 @@
+package com.homeservices.customer.data.rating
+
+import com.homeservices.customer.data.rating.remote.dto.ApiErrorDto
+import com.homeservices.customer.domain.rating.RatingSubmitFailure
+import com.squareup.moshi.Moshi
+import retrofit2.HttpException
+import java.io.IOException
+
+private const val HTTP_FORBIDDEN = 403
+private const val HTTP_NOT_FOUND = 404
+
+/** Errors are rare, so one shared adapter is cheaper than building one per failure. */
+private val errorAdapter = Moshi.Builder().build().adapter(ApiErrorDto::class.java)
+
+/**
+ * Translates a transport or API failure into the reason the customer is shown.
+ *
+ * Both write paths on the rating screen — `POST /v1/ratings` and
+ * `POST /v1/ratings/{bookingId}/escalate` — answer with the same vocabulary of `code` values
+ * (see `api/src/functions/ratings.ts` and `api/src/functions/rating-escalate.ts`), so they share
+ * this mapping. Codes only one of them can return, and codes added later, fall through to
+ * [RatingSubmitFailure.Unknown] rather than surfacing a raw "HTTP 409 Conflict".
+ */
+internal fun Throwable.toRatingSubmitFailure(): RatingSubmitFailure =
+    when (this) {
+        is IOException -> RatingSubmitFailure.Network
+        is HttpException -> toSubmitFailure()
+        else -> RatingSubmitFailure.Unknown
+    }
+
+private fun HttpException.toSubmitFailure(): RatingSubmitFailure =
+    when (code()) {
+        HTTP_FORBIDDEN, HTTP_NOT_FOUND -> RatingSubmitFailure.NotAvailable
+        else ->
+            when (errorCode()) {
+                "NO_TECHNICIAN" -> RatingSubmitFailure.NoTechnician
+                "RATING_ALREADY_SUBMITTED" -> RatingSubmitFailure.AlreadySubmitted
+                "BOOKING_NOT_CLOSED" -> RatingSubmitFailure.BookingNotClosed
+                "BOOKING_NOT_FOUND", "FORBIDDEN" -> RatingSubmitFailure.NotAvailable
+                else -> RatingSubmitFailure.Unknown
+            }
+    }
+
+/**
+ * Reads the stable `code` the API puts in every error body. A body that is missing, truncated or
+ * not JSON at all (a gateway HTML page, say) yields null rather than throwing.
+ */
+private fun HttpException.errorCode(): String? =
+    runCatching { response()?.errorBody()?.string() }
+        .getOrNull()
+        ?.takeIf { it.isNotBlank() }
+        ?.let { body -> runCatching { errorAdapter.fromJson(body)?.code }.getOrNull() }
+        ?.takeIf { it.isNotBlank() }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt
index 8ed3c2a4..f4a68cd9 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt
@@ -1,53 +1,66 @@
 package com.homeservices.customer.data.rating
 
 import com.homeservices.customer.data.rating.remote.RatingApiService
 import com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto
+import com.homeservices.customer.domain.rating.RatingSubmitException
+import com.homeservices.customer.domain.rating.RatingSubmitFailure
 import com.homeservices.customer.domain.rating.model.CustomerSubScores
 import com.homeservices.customer.domain.rating.model.RatingSnapshot
 import io.sentry.Sentry
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
             idempotencyKey: String,
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
                             idempotencyKey = idempotencyKey,
                         )
-                    }.onFailure { Sentry.captureException(it) },
+                    }.recoverCatching { throw it.toSubmitException() },
                 )
             }
 
         override fun get(bookingId: String): Flow<Result<RatingSnapshot>> =
             flow {
                 emit(
                     runCatching { api.get(bookingId).toDomain() }
                         .onFailure { Sentry.captureException(it) },
                 )
             }
+
+        /**
+         * Only [RatingSubmitFailure.Unknown] reaches Sentry: the other cases are rules the API is
+         * meant to enforce (no technician, already rated, job not finished) or an offline phone,
+         * none of which are defects worth an alert.
+         */
+        private fun Throwable.toSubmitException(): RatingSubmitException {
+            val failure = toRatingSubmitFailure()
+            if (failure == RatingSubmitFailure.Unknown) Sentry.captureException(this)
+            return RatingSubmitException(failure, this)
+        }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/dto/RatingDtos.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/dto/RatingDtos.kt
index 510c67a5..9b3f2e10 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/dto/RatingDtos.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/dto/RatingDtos.kt
@@ -3,80 +3,89 @@ package com.homeservices.customer.data.rating.remote.dto
 import com.homeservices.customer.domain.rating.model.CustomerRating
 import com.homeservices.customer.domain.rating.model.CustomerSubScores
 import com.homeservices.customer.domain.rating.model.RatingSnapshot
 import com.homeservices.customer.domain.rating.model.SideState
 import com.homeservices.customer.domain.rating.model.TechRating
 import com.homeservices.customer.domain.rating.model.TechSubScores
 import com.squareup.moshi.JsonClass
 
 @JsonClass(generateAdapter = true)
 public data class SubmitRatingRequestDto(
     val side: String,
     val bookingId: String,
     val overall: Int,
     val subScores: Map<String, Int>,
     val comment: String?,
 )
 
 @JsonClass(generateAdapter = true)
 public data class SidePayloadDto(
     val status: String,
     val overall: Int? = null,
     val subScores: Map<String, Int>? = null,
     val comment: String? = null,
     val submittedAt: String? = null,
 )
 
 @JsonClass(generateAdapter = true)
 public data class GetRatingResponseDto(
     val bookingId: String,
     val status: String,
     val revealedAt: String? = null,
     val customerSide: SidePayloadDto,
     val techSide: SidePayloadDto,
 ) {
     public fun toDomain(): RatingSnapshot =
         RatingSnapshot(
             bookingId = bookingId,
             status = RatingSnapshot.Status.valueOf(status),
             revealedAt = revealedAt,
             customerSide = customerSide.toCustomerSide(),
             techSide = techSide.toTechSide(),
         )
 }
 
 private fun SidePayloadDto.toCustomerSide(): SideState =
     if (status == "SUBMITTED" && overall != null && subScores != null && submittedAt != null) {
         SideState.Submitted(
             CustomerRating(
                 overall = overall,
                 subScores =
                     CustomerSubScores(
                         punctuality = subScores["punctuality"] ?: 0,
                         skill = subScores["skill"] ?: 0,
                         behaviour = subScores["behaviour"] ?: 0,
                     ),
                 comment = comment,
                 submittedAt = submittedAt,
             ),
         )
     } else {
         SideState.Pending
     }
 
 private fun SidePayloadDto.toTechSide(): SideState =
     if (status == "SUBMITTED" && overall != null && subScores != null && submittedAt != null) {
         SideState.Submitted(
             TechRating(
                 overall = overall,
                 subScores =
                     TechSubScores(
                         behaviour = subScores["behaviour"] ?: 0,
                         communication = subScores["communication"] ?: 0,
                     ),
                 comment = comment,
                 submittedAt = submittedAt,
             ),
         )
     } else {
         SideState.Pending
     }
+
+/**
+ * Shape of every error body the API returns (`api/src/functions/ratings.ts`): a stable
+ * machine-readable `code`, plus fields that vary by code and are not needed here.
+ */
+@JsonClass(generateAdapter = true)
+public data class ApiErrorDto(
+    val code: String? = null,
+)
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt
index 26730350..6b59aea3 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt
@@ -1,30 +1,35 @@
 package com.homeservices.customer.domain.rating
 
 import com.homeservices.customer.data.rating.remote.RatingApiService
 import com.homeservices.customer.data.rating.remote.dto.EscalateRatingRequestDto
+import com.homeservices.customer.data.rating.toRatingSubmitFailure
 import java.time.Instant
 import javax.inject.Inject
 
 public data class EscalateRatingResult(
     val complaintId: String,
     val expiresAtMs: Long,
 )
 
 public class EscalateRatingUseCase
     @Inject
     constructor(
         private val apiService: RatingApiService,
     ) {
         public suspend fun invoke(
             bookingId: String,
             draftOverall: Int,
             draftComment: String? = null,
         ): Result<EscalateRatingResult> =
             runCatching {
                 val dto = apiService.escalate(bookingId, EscalateRatingRequestDto(draftOverall, draftComment))
                 EscalateRatingResult(
                     complaintId = dto.complaintId,
                     expiresAtMs = Instant.parse(dto.expiresAt).toEpochMilli(),
                 )
+            }.recoverCatching {
+                // The escalate endpoint answers with the same code vocabulary as submit, so the
+                // sheet can name the real reason instead of a generic "try again".
+                throw RatingSubmitException(it.toRatingSubmitFailure(), it)
             }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/RatingSubmitFailure.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/RatingSubmitFailure.kt
new file mode 100644
index 00000000..54674179
--- /dev/null
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/RatingSubmitFailure.kt
@@ -0,0 +1,43 @@
+package com.homeservices.customer.domain.rating
+
+/**
+ * Why a rating submission was rejected.
+ *
+ * The API answers a failed `POST /v1/ratings` with a stable `code` in the body (see
+ * `api/src/functions/ratings.ts`). Mapping those codes to this enum at the data layer keeps
+ * HTTP details out of the UI and lets the screen say what actually went wrong instead of
+ * surfacing a raw "HTTP 409 Conflict".
+ *
+ * [retryable] answers a single question the UI needs: does pressing the button again have any
+ * chance of a different outcome? Transport failures can recover; a booking with no technician
+ * never will.
+ */
+public enum class RatingSubmitFailure(
+    public val retryable: Boolean,
+) {
+    /** Booking closed without a technician ever being assigned — nothing to rate. */
+    NoTechnician(retryable = false),
+
+    /** This side of the rating is already recorded. Not really an error; the screen moves on. */
+    AlreadySubmitted(retryable = false),
+
+    /** Job is not finished yet, so it cannot be rated. */
+    BookingNotClosed(retryable = false),
+
+    /** Booking is missing, or belongs to somebody else. */
+    NotAvailable(retryable = false),
+
+    /** Request never reached the server, or the server never answered. */
+    Network(retryable = true),
+
+    /** Anything else — a 5xx, a malformed body, an unrecognised code. */
+    Unknown(retryable = true),
+}
+
+/**
+ * Failure carried out of [com.homeservices.customer.data.rating.RatingRepository.submitCustomerRating].
+ */
+public class RatingSubmitException(
+    public val failure: RatingSubmitFailure,
+    cause: Throwable? = null,
+) : Exception("Rating submit failed: $failure", cause)
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt
index 2a57374a..4ebefc40 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt
@@ -1,307 +1,374 @@
 package com.homeservices.customer.ui.rating
 
+import androidx.compose.foundation.border
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
 import androidx.compose.foundation.rememberScrollState
+import androidx.compose.foundation.shape.RoundedCornerShape
 import androidx.compose.foundation.verticalScroll
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
 import androidx.lifecycle.compose.collectAsStateWithLifecycle
 import com.homeservices.customer.R
+import com.homeservices.customer.domain.rating.RatingSubmitFailure
 import com.homeservices.designsystem.components.HsPrimaryButton
 import com.homeservices.designsystem.components.HsScreenTitle
 import com.homeservices.designsystem.components.HsSecondaryButton
 import com.homeservices.designsystem.components.HsSectionCard
 import com.homeservices.designsystem.components.HsTrustBadge
+import com.homeservices.designsystem.theme.HomeservicesBorderWidth
+import com.homeservices.designsystem.theme.LocalHomeservicesRadius
+import com.homeservices.designsystem.theme.LocalHomeservicesSpacing
 import kotlinx.coroutines.delay
 
 @OptIn(ExperimentalMaterial3Api::class)
 @Composable
 public fun RatingScreen(
     modifier: Modifier = Modifier,
     viewModel: RatingViewModel = hiltViewModel(),
     onBack: () -> Unit = {},
     onSubmitted: () -> Unit = {},
 ) {
     val state by viewModel.uiState.collectAsStateWithLifecycle()
     val shieldState by viewModel.shieldState.collectAsStateWithLifecycle()
     val overall by viewModel.overall.collectAsStateWithLifecycle()
     val punct by viewModel.punctuality.collectAsStateWithLifecycle()
     val skill by viewModel.skill.collectAsStateWithLifecycle()
     val behav by viewModel.behaviour.collectAsStateWithLifecycle()
     val comment by viewModel.comment.collectAsStateWithLifecycle()
     val canSubmit by viewModel.canSubmit.collectAsStateWithLifecycle()
+    val submitError by viewModel.submitError.collectAsStateWithLifecycle()
 
     androidx.activity.compose.BackHandler(onBack = onBack)
 
     androidx.compose.runtime.LaunchedEffect(state) {
         if (state is RatingUiState.AwaitingPartner || state is RatingUiState.Revealed) {
             onSubmitted()
         }
     }
 
     RatingContent(
         state = state,
         shieldState = shieldState,
         overall = overall,
         punctuality = punct,
         skill = skill,
         behaviour = behav,
         comment = comment,
         canSubmit = canSubmit,
+        submitError = submitError,
         onOverallChange = viewModel::setOverall,
         onPunctualityChange = viewModel::setPunctuality,
         onSkillChange = viewModel::setSkill,
         onBehaviourChange = viewModel::setBehaviour,
         onCommentChange = viewModel::setComment,
         onSubmit = viewModel::submit,
         onPostAnyway = viewModel::onPostAnyway,
         onBack = onBack,
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
+    submitError: RatingSubmitFailure?,
     onOverallChange: (Int) -> Unit,
     onPunctualityChange: (Int) -> Unit,
     onSkillChange: (Int) -> Unit,
     onBehaviourChange: (Int) -> Unit,
     onCommentChange: (String) -> Unit,
     onSubmit: () -> Unit,
     onPostAnyway: () -> Unit,
     onBack: () -> Unit,
     modifier: Modifier = Modifier,
 ) {
     Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
         Column(modifier = Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
             when (state) {
                 is RatingUiState.AwaitingPartner ->
                     StatusMessage(
                         stringResource(R.string.rating_awaiting_title),
                         stringResource(R.string.rating_awaiting_body),
                         actionLabel = stringResource(R.string.rating_back_home),
                         onAction = onBack,
                     )
                 is RatingUiState.Revealed ->
                     StatusMessage(
                         stringResource(R.string.rating_revealed_title),
                         stringResource(R.string.rating_revealed_body),
                         actionLabel = stringResource(R.string.rating_back_home),
                         onAction = onBack,
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
+                        submitError = submitError,
+                        onBack = onBack,
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
+    submitError: RatingSubmitFailure?,
+    onBack: () -> Unit,
     onOverallChange: (Int) -> Unit,
     onPunctualityChange: (Int) -> Unit,
     onSkillChange: (Int) -> Unit,
     onBehaviourChange: (Int) -> Unit,
     onCommentChange: (String) -> Unit,
     onSubmit: () -> Unit,
     onPostAnyway: () -> Unit,
 ) {
     Column(modifier = Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
         HsTrustBadge(text = stringResource(R.string.rating_eyebrow))
         HsScreenTitle(
             text = stringResource(R.string.rating_title),
             style = MaterialTheme.typography.headlineSmall,
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
+        if (submitError != null) {
+            SubmitErrorNotice(submitError)
+        }
         if (shieldState is RatingShieldState.Escalated) {
             CountdownChip(expiresAtMs = shieldState.expiresAtMs, onPostAnyway = onPostAnyway)
+        } else if (submitError != null && !submitError.retryable) {
+            // Pressing submit again cannot change the answer, so offer the only move that helps
+            // rather than leaving a dead button under the message.
+            HsSecondaryButton(
+                text = stringResource(R.string.rating_back_home),
+                onClick = onBack,
+                modifier = Modifier.fillMaxWidth(),
+            )
         } else {
             HsPrimaryButton(
-                text = stringResource(R.string.rating_submit),
+                text =
+                    stringResource(
+                        if (submitError != null) R.string.rating_submit_retry else R.string.rating_submit,
+                    ),
                 onClick = onSubmit,
                 enabled = canSubmit,
                 modifier = Modifier.fillMaxWidth(),
             )
             // TODO(C-19): implement tip-chip composable here in E18-S03 follow-up once
             //  AwaitingPartner post-submit state is wired (after customer rates, show optional
             //  tip-chip before navigating away). Tracked in E18-S03 ADR-0024.
         }
     }
 }
 
+/**
+ * Why the rating did not send, shown where it happened — directly above the button that failed, so
+ * the stars and comment stay visible and intact behind it.
+ */
+@Composable
+private fun SubmitErrorNotice(failure: RatingSubmitFailure) {
+    val spacing = LocalHomeservicesSpacing.current
+    val radius = LocalHomeservicesRadius.current
+    Surface(
+        color = MaterialTheme.colorScheme.errorContainer,
+        contentColor = MaterialTheme.colorScheme.onErrorContainer,
+        shape = RoundedCornerShape(radius.md),
+        modifier =
+            Modifier
+                .fillMaxWidth()
+                .border(
+                    width = HomeservicesBorderWidth.hairline,
+                    color = MaterialTheme.colorScheme.error,
+                    shape = RoundedCornerShape(radius.md),
+                ),
+    ) {
+        Text(
+            text = stringResource(failure.messageRes()),
+            style = MaterialTheme.typography.bodyMedium,
+            modifier = Modifier.padding(horizontal = spacing.space4, vertical = spacing.space3),
+        )
+    }
+}
+
+private fun RatingSubmitFailure.messageRes(): Int =
+    when (this) {
+        RatingSubmitFailure.NoTechnician -> R.string.rating_submit_error_no_technician
+        RatingSubmitFailure.BookingNotClosed -> R.string.rating_submit_error_not_closed
+        RatingSubmitFailure.NotAvailable -> R.string.rating_submit_error_not_available
+        RatingSubmitFailure.Network -> R.string.rating_submit_error_network
+        // AlreadySubmitted never reaches the form — the view model moves the screen on instead.
+        RatingSubmitFailure.AlreadySubmitted, RatingSubmitFailure.Unknown ->
+            R.string.rating_submit_error_generic
+    }
+
 @Composable
 private fun StatusMessage(
     title: String,
     body: String,
     actionLabel: String? = null,
     onAction: () -> Unit = {},
 ) {
     Column(
         modifier = Modifier.fillMaxSize(),
         horizontalAlignment = Alignment.CenterHorizontally,
         verticalArrangement = Arrangement.Center,
     ) {
         Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
         Spacer(Modifier.height(8.dp))
         Text(body, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
         if (actionLabel != null) {
             Spacer(Modifier.height(24.dp))
             HsPrimaryButton(
                 text = actionLabel,
                 onClick = onAction,
                 modifier = Modifier.fillMaxWidth(),
             )
         }
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
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
index 171dccde..87f73849 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
@@ -1,296 +1,341 @@
 package com.homeservices.customer.ui.rating
 
 import androidx.lifecycle.SavedStateHandle
 import androidx.lifecycle.ViewModel
 import androidx.lifecycle.viewModelScope
 import com.homeservices.customer.domain.rating.EscalateRatingUseCase
 import com.homeservices.customer.domain.rating.GetRatingUseCase
+import com.homeservices.customer.domain.rating.RatingSubmitException
+import com.homeservices.customer.domain.rating.RatingSubmitFailure
 import com.homeservices.customer.domain.rating.SubmitRatingUseCase
 import com.homeservices.customer.domain.rating.model.CustomerSubScores
 import com.homeservices.customer.domain.rating.model.RatingSnapshot
 import com.homeservices.customer.domain.rating.model.SideState
 import com.homeservices.customer.observability.analytics.AnalyticsEvents
 import com.homeservices.customer.observability.analytics.AnalyticsFacade
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
 
     /** API call in flight — sheet buttons disabled to prevent double-tap race. */
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
         private val analytics: AnalyticsFacade,
     ) : ViewModel() {
         public val bookingId: String =
             savedStateHandle.get<String>("bookingId") ?: error("bookingId required")
 
         private val _uiState = MutableStateFlow<RatingUiState>(RatingUiState.Loading)
         public val uiState: StateFlow<RatingUiState> = _uiState.asStateFlow()
 
         private val _shieldState = MutableStateFlow<RatingShieldState>(RatingShieldState.Idle)
         public val shieldState: StateFlow<RatingShieldState> = _shieldState.asStateFlow()
 
+        /**
+         * Why the last submit was rejected, or null. Kept apart from [uiState] on purpose: a submit
+         * that fails must leave the form — and everything the customer typed into it — on screen,
+         * whereas [RatingUiState.Error] replaces the screen and is only for a failed load.
+         */
+        private val _submitError = MutableStateFlow<RatingSubmitFailure?>(null)
+        public val submitError: StateFlow<RatingSubmitFailure?> = _submitError.asStateFlow()
+
+        /** Last snapshot the API gave us, so the form can be restored after a failed submit. */
+        private var lastSnapshot: RatingSnapshot? = null
+
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
+                            lastSnapshot = snap
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
             // Intentionally does NOT submit — scrim tap / back gesture is not an opt-out.
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
+            // Same as doSubmit: a fresh attempt clears the last attempt's message, so a retry that
+            // succeeds does not leave the old failure sitting under the countdown.
+            _submitError.value = null
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
-                        _uiState.value = RatingUiState.Error(it.message ?: "escalation failed")
+                        // Same rule as a failed submit: report it, keep the form and the dialog.
+                        _submitError.value =
+                            (it as? RatingSubmitException)?.failure ?: RatingSubmitFailure.Unknown
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
 
+        /**
+         * A rejected submit keeps the customer where they are. The one exception is a rating the
+         * server already holds, which is not a failure at all — the screen simply catches up.
+         */
+        private fun onSubmitFailed(throwable: Throwable) {
+            val failure = (throwable as? RatingSubmitException)?.failure ?: RatingSubmitFailure.Unknown
+            if (failure == RatingSubmitFailure.AlreadySubmitted) {
+                cancelShieldState()
+                _submitError.value = null
+                _uiState.value = RatingUiState.AwaitingPartner(lastSnapshot)
+                return
+            }
+            // The shield is over by the time a submit can fail (onPostAnyway / onSkipShield both
+            // set Idle first), so the captured draft must go too. Keeping it would make doSubmit()
+            // resend the old draft and silently discard whatever the customer edits before
+            // retrying — the owner has already seen the draft, so the retry is theirs to change.
+            cancelShieldState()
+            _submitError.value = failure
+            _uiState.value = RatingUiState.Editing(lastSnapshot)
+        }
+
+        public fun consumeSubmitError() {
+            _submitError.value = null
+        }
+
         private fun doSubmit() {
             val draft = escalatedDraft
             val submitOverall = draft?.overall ?: overall.value
             val submitSubScores = draft?.subScores ?: CustomerSubScores(punctuality.value, skill.value, behaviour.value)
             val submitComment = draft?.comment ?: comment.value.ifBlank { null }
             _uiState.value = RatingUiState.Submitting
+            _submitError.value = null
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
                                 // Clear shield state only after confirmed success — preserves
                                 // draft for retry if the network call fails.
                                 cancelShieldState()
                                 runCatching {
                                     analytics.track(
                                         AnalyticsEvents.RATING_SUBMITTED,
                                         mapOf("booking_id" to bookingId, "overall" to submitOverall),
                                     )
                                 }
                                 _uiState.value = RatingUiState.AwaitingPartner(null)
-                            }.onFailure { _uiState.value = RatingUiState.Error(it.message ?: "submit failed") }
+                            }.onFailure { onSubmitFailed(it) }
                     }
             }
         }
     }
diff --git a/customer-app/app/src/main/res/values-hi/strings.xml b/customer-app/app/src/main/res/values-hi/strings.xml
index 467a1d36..701c8e41 100644
--- a/customer-app/app/src/main/res/values-hi/strings.xml
+++ b/customer-app/app/src/main/res/values-hi/strings.xml
@@ -214,160 +214,166 @@
     </plurals>
     <string name="sos_send_body">Owner support को चुपके से सूचित किया जाएगा। तकनीशियन को यह अलर्ट नहीं दिखेगा।</string>
     <string name="sos_send_now">अभी भेजें</string>
     <string name="sos_cancel_alert">अलर्ट रद्द करें</string>
 
     <!-- SOS evidence upload states (E11-S05b-2) -->
     <string name="sos_uploading_evidence">साक्ष्य अपलोड हो रहा है… %1$d%%</string>
     <string name="sos_evidence_saved">साक्ष्य सुरक्षित रूप से सहेजा गया</string>
     <string name="sos_evidence_upload_error">साक्ष्य नहीं सहेजा जा सका। मदद रास्ते में है।</string>
     <string name="sos_evidence_retry">फिर कोशिश करें</string>
     <string name="sos_evidence_dismiss">अभी नहीं</string>
 
     <!-- SOS consent dialog (E12-S02a) -->
     <string name="sos_consent_title">अलर्ट के साथ ऑडियो रिकॉर्ड करें?</string>
     <string name="sos_consent_body">Owner support को स्थिति समझने में मदद के लिए एक छोटी ऑडियो रिकॉर्डिंग जोड़ सकते हैं।</string>
     <string name="sos_consent_allow">अनुमति दें</string>
     <string name="sos_consent_skip">छोड़ें</string>
 
     <!-- DPDP consent screen -->
     <string name="dpdp_consent_hero_title">गोपनीयता आपकी, चुनाव आपका</string>
     <string name="dpdp_consent_hero_subtitle">सेवा शुरू करने से पहले बताएं, हम क्या जानकारी इस्तेमाल कर सकते हैं</string>
     <string name="dpdp_consent_section_title">डेटा उपयोग सहमति</string>
     <string name="dpdp_consent_section_subtitle">अपनी पसंद के अनुसार चुनें:</string>
     <string name="dpdp_consent_analytics_title">ऐप की गुणवत्ता सुधारें</string>
     <string name="dpdp_consent_analytics_description">हम समझते हैं ऐप कैसे इस्तेमाल होता है</string>
     <string name="dpdp_consent_crash_title">क्रैश रिपोर्ट भेजें</string>
     <string name="dpdp_consent_crash_description">बग जल्दी ठीक करने के लिए</string>
     <string name="dpdp_consent_marketing_title">ऑफर और अपडेट</string>
     <string name="dpdp_consent_marketing_description">व्यक्तिगत ऑफर और प्रमोशन</string>
     <string name="dpdp_consent_legal_prefix">जारी रखकर आप हमारी </string>
     <string name="dpdp_consent_privacy_policy">गोपनीयता नीति</string>
     <string name="dpdp_consent_legal_suffix"> से सहमत हैं</string>
     <string name="dpdp_consent_agree_continue">सहमत हों और जारी रखें</string>
     <string name="dpdp_consent_reject_all">सभी अस्वीकार करें</string>
 
     <!-- Complaint screen (E12-S02a) -->
     <string name="complaint_eyebrow">ग्राहक सहायता</string>
     <string name="complaint_title">शिकायत दर्ज करें</string>
     <string name="complaint_body">बताएं क्या गलत हुआ। Owner support बुकिंग की समीक्षा करेगा और जवाब देगा।</string>
     <string name="complaint_select_reason">कारण चुनें</string>
     <string name="complaint_issue_type">समस्या का प्रकार</string>
     <string name="complaint_what_happened">क्या हुआ?</string>
     <string name="complaint_attach_photo">फोटो जोड़ें (वैकल्पिक)</string>
     <string name="complaint_photo_attached">फोटो जोड़ी गई</string>
     <string name="complaint_submit">शिकायत सबमिट करें</string>
     <string name="complaint_received">शिकायत मिल गई</string>
     <string name="complaint_back">बुकिंग पर वापस</string>
     <string name="complaint_submitting">शिकायत सबमिट हो रही है</string>
     <string name="complaint_error_title">कुछ गलत हो गया</string>
     <string name="complaint_retry">फिर कोशिश करें</string>
     <string name="complaint_status_investigating">Owner support आपकी शिकायत की समीक्षा कर रहा है।</string>
     <string name="complaint_status_resolved">यह शिकायत हल हो गई है।</string>
     <string name="complaint_status_default">Owner support 2 घंटे में जवाब देगा।</string>
     <string name="complaint_error_unknown">अज्ञात त्रुटि</string>
     <!-- Complaint reason labels -->
     <string name="complaint_reason_service_quality">सर्विस की गुणवत्ता</string>
     <string name="complaint_reason_late_arrival">देरी से आना</string>
     <string name="complaint_reason_no_show">तकनीशियन नहीं आए</string>
     <string name="complaint_reason_technician_behaviour">तकनीशियन का व्यवहार</string>
     <string name="complaint_reason_billing_dispute">बिलिंग विवाद</string>
     <string name="complaint_reason_other">अन्य</string>
 
     <!-- Rating screen (E12-S02a) -->
     <string name="rating_awaiting_title">रेटिंग सबमिट हो गई</string>
     <string name="rating_awaiting_body">तकनीशियन के जवाब के बाद दोनों रेटिंग दिखाई जाएंगी।</string>
     <string name="rating_revealed_title">रेटिंग सामने आई</string>
     <string name="rating_revealed_body">सर्विस मार्केटप्लेस को निष्पक्ष रखने के लिए धन्यवाद।</string>
     <string name="rating_back_home">होम पर वापस जाएं</string>
     <string name="rating_error_title">रेटिंग लोड नहीं हो सकी</string>
     <string name="rating_loading_title">रेटिंग लोड हो रही है</string>
     <string name="rating_loading_body">आपका सर्विस फीडबैक फॉर्म तैयार हो रहा है।</string>
     <string name="rating_eyebrow">सर्विस फीडबैक</string>
     <string name="rating_title">अपनी सर्विस रेट करें</string>
     <string name="rating_body">आपकी रेटिंग से तकनीशियन की गुणवत्ता और ग्राहक सहायता बेहतर होती है।</string>
     <string name="rating_overall">कुल अनुभव</string>
     <string name="rating_punctuality">समय पर आना</string>
     <string name="rating_skill">कौशल गुणवत्ता</string>
     <string name="rating_behaviour">व्यवहार</string>
     <string name="rating_comment_label">टिप्पणी (वैकल्पिक)</string>
     <string name="rating_submit">रेटिंग सबमिट करें</string>
+    <string name="rating_submit_error_no_technician">इस बुकिंग पर कोई तकनीशियन नहीं आया, इसलिए रेटिंग नहीं दी जा सकती।</string>
+    <string name="rating_submit_error_not_closed">यह काम अभी पूरा नहीं हुआ है। तकनीशियन के पूरा करने के बाद रेटिंग दें।</string>
+    <string name="rating_submit_error_not_available">यह बुकिंग रेटिंग के लिए उपलब्ध नहीं है।</string>
+    <string name="rating_submit_error_network">आपकी रेटिंग हम तक नहीं पहुंची। कनेक्शन जांचें और दोबारा भेजें।</string>
+    <string name="rating_submit_error_generic">आपकी रेटिंग नहीं भेजी जा सकी। दोबारा भेजें।</string>
+    <string name="rating_submit_retry">दोबारा भेजें</string>
     <plurals name="rating_star_label">
         <item quantity="one">%d स्टार रेट करें</item>
         <item quantity="other">%d स्टार रेट करें</item>
     </plurals>
     <string name="rating_private_review_countdown">निजी समीक्षा: %s बचा है</string>
     <string name="rating_post_anyway">अभी पोस्ट करें</string>
     <string name="rating_shield_title">पहले निजी तौर पर शेयर करें?</string>
     <string name="rating_shield_body">कम रेटिंग सार्वजनिक होने से पहले Owner support को भेजी जा सकती है।</string>
     <string name="rating_shield_send_support">पहले सपोर्ट को भेजें</string>
     <string name="rating_shield_post_now">अभी रेटिंग पोस्ट करें</string>
 
     <!-- Customer bookings screen (E12-S02a) -->
     <string name="bookings_title">बुकिंग</string>
     <string name="bookings_subtitle">आगामी और पूरी हुई सर्विस विजिट</string>
     <string name="bookings_refresh_desc">बुकिंग रिफ्रेश करें</string>
     <string name="bookings_track_technician">तकनीशियन ट्रैक करें</string>
     <string name="bookings_view_status">स्टेटस देखें</string>
     <string name="bookings_no_bookings">अभी कोई बुकिंग नहीं</string>
     <string name="bookings_no_bookings_body">कन्फर्म बुकिंग यहां सर्विस तारीख, स्टेटस और ट्रैकिंग एक्सेस के साथ दिखेंगी।</string>
     <string name="bookings_error_title">बुकिंग रिफ्रेश नहीं हो सकी</string>
     <string name="bookings_error_body">आपकी आखिरी बुकिंग सेव है। नेटवर्क स्थिर होने पर फिर कोशिश करें।</string>
     <string name="bookings_retry">फिर कोशिश करें</string>
     <string name="bookings_rate_booking">बुकिंग को रेट करें</string>
     <string name="bookings_file_complaint">शिकायत दर्ज करें</string>
     <!-- Booking status labels -->
     <string name="booking_status_pending_payment">पेमेंट बाकी</string>
     <string name="booking_status_paid">कन्फर्म</string>
     <string name="booking_status_searching">तकनीशियन खोज रहे हैं</string>
     <string name="booking_status_assigned">तकनीशियन असाइन</string>
     <string name="booking_status_en_route">रास्ते में</string>
     <string name="booking_status_reached">पहुंच गए</string>
     <string name="booking_status_in_progress">काम जारी है</string>
     <string name="booking_status_awaiting_price_approval">कीमत अनुमोदन</string>
     <string name="booking_status_completed">पूरा हो गया</string>
     <string name="booking_status_closed">बंद</string>
     <string name="booking_status_unfulfilled">अनपूर्ण</string>
     <string name="booking_status_cancelled">रद्द</string>
     <string name="booking_status_reassigning">फिर असाइन हो रहा है</string>
     <string name="booking_status_updated">अपडेट हुआ</string>
     <!-- Payment method labels -->
     <string name="payment_method_online">ऑनलाइन पेमेंट किया</string>
     <string name="payment_method_cash">सर्विस पर कैश</string>
 
     <!-- Catalogue home screen (E12-S02a) -->
     <string name="catalogue_our_services">हमारी सेवाएं</string>
     <string name="catalogue_search_hint">AC, प्लंबर, इलेक्ट्रीशियन खोजें&#8230;</string>
     <string name="catalogue_location_display">अयोध्या, उत्तर प्रदेश</string>
     <string name="catalogue_starting_price">%1$s से</string>
     <string name="catalogue_empty_title">यहाँ अभी कोई सेवा नहीं है</string>
     <string name="catalogue_empty_body">हम आपके क्षेत्र में सेवाएँ जोड़ रहे हैं। जल्द ही देखें।</string>
     <string name="catalogue_retry">फिर कोशिश करें</string>
 
     <!-- Confidence score row (E12-S02a) -->
     <string name="confidence_new_area">आपके क्षेत्र में नए हैं &#8212; ट्रैक रिकॉर्ड बना रहे हैं</string>
     <string name="confidence_on_time">%d%% समय पर</string>
     <string name="confidence_area_rating">%.1f क्षेत्र रेटिंग</string>
     <string name="confidence_eta">~%d मिनट दूर</string>
     <string name="confidence_methodology_title">हम यह कैसे गणना करते हैं</string>
     <!-- HI-REVIEW: technical methodology text — please verify with a native speaker -->
     <string name="confidence_methodology_body">समय पर %%: पिछले 30 दिनों में बुक्ड स्लॉट के 15 मिनट के अंदर शुरू हुए जॉब।\n\nक्षेत्र रेटिंग: आपके क्षेत्र में औसत स्टार रेटिंग।\n\nETA: 20 किमी/घंटा पर तकनीशियन की आखिरी लोकेशन से अनुमानित यात्रा समय।</string>
 
     <!-- Slot picker -->
     <string name="slot_picker_title">तारीख और समय चुनें</string>
     <string name="slot_picker_heading">अपना स्लॉट चुनें</string>
     <string name="slot_picker_subtitle">सुविधाजनक आने का समय चुनें। भुगतान से पहले आप सब कुछ देख सकते हैं।</string>
     <string name="slot_picker_date_label">तारीख</string>
     <string name="slot_picker_morning_label">सुबह</string>
     <string name="slot_picker_afternoon_label">दोपहर</string>
     <string name="slot_picker_evening_label">शाम</string>
     <string name="slot_picker_loading_desc">उपलब्ध स्लॉट लोड हो रहे हैं</string>
     <string name="slot_picker_error_label">स्लॉट लोड नहीं हो सके। कृपया पुनः प्रयास करें।</string>
     <string name="slot_picker_retry_button">पुनः प्रयास करें</string>
     <string name="slot_picker_confirm_slot">स्लॉट पक्का करें</string>
     <string name="slot_picker_no_slots_label">इस तारीख के लिए कोई स्लॉट उपलब्ध नहीं</string>
 
     <!-- Trust dossier — Aadhaar/Police badges, certifications, languages, reviews -->
     <string name="trust_dossier_assigning">आपके स्लॉट के लिए जल्द ही तकनीशियन असाइन किया जाएगा।</string>
     <string name="trust_dossier_badge_aadhaar">आधार सत्यापित</string>
     <string name="trust_dossier_badge_police">पुलिस वेरिफिकेशन पूरा</string>
     <string name="trust_dossier_certifications_label">प्रमाणपत्र</string>
diff --git a/customer-app/app/src/main/res/values/strings.xml b/customer-app/app/src/main/res/values/strings.xml
index d9c4f422..81034179 100644
--- a/customer-app/app/src/main/res/values/strings.xml
+++ b/customer-app/app/src/main/res/values/strings.xml
@@ -247,160 +247,166 @@
     </plurals>
     <string name="sos_send_body">Owner support will be notified silently. The technician will not see this alert.</string>
     <string name="sos_send_now">Send now</string>
     <string name="sos_cancel_alert">Cancel alert</string>
 
     <!-- SOS evidence upload states (E11-S05b-2) -->
     <string name="sos_uploading_evidence">Uploading evidence… %1$d%%</string>
     <string name="sos_evidence_saved">Evidence saved securely</string>
     <string name="sos_evidence_upload_error">Could not save evidence. Help is already on the way.</string>
     <string name="sos_evidence_retry">Try again</string>
     <string name="sos_evidence_dismiss">Not now</string>
 
     <!-- SOS consent dialog (E12-S02a) -->
     <string name="sos_consent_title">Record audio with alert?</string>
     <string name="sos_consent_body">You can attach a short local audio recording to help owner support review the situation.</string>
     <string name="sos_consent_allow">Allow</string>
     <string name="sos_consent_skip">Skip</string>
 
     <!-- DPDP consent screen -->
     <string name="dpdp_consent_hero_title">Your privacy, your choice</string>
     <string name="dpdp_consent_hero_subtitle">Before starting service, tell us what information we can use</string>
     <string name="dpdp_consent_section_title">Data use consent</string>
     <string name="dpdp_consent_section_subtitle">Choose what works for you:</string>
     <string name="dpdp_consent_analytics_title">Improve app quality</string>
     <string name="dpdp_consent_analytics_description">We learn how the app is used</string>
     <string name="dpdp_consent_crash_title">Send crash reports</string>
     <string name="dpdp_consent_crash_description">So bugs can be fixed faster</string>
     <string name="dpdp_consent_marketing_title">Offers and updates</string>
     <string name="dpdp_consent_marketing_description">Personalized offers and promotions</string>
     <string name="dpdp_consent_legal_prefix">By continuing, you agree to our </string>
     <string name="dpdp_consent_privacy_policy">Privacy Policy</string>
     <string name="dpdp_consent_legal_suffix">.</string>
     <string name="dpdp_consent_agree_continue">Agree and continue</string>
     <string name="dpdp_consent_reject_all">Reject all</string>
 
     <!-- Complaint screen (E12-S02a) -->
     <string name="complaint_eyebrow">Customer support</string>
     <string name="complaint_title">File a complaint</string>
     <string name="complaint_body">Tell us what went wrong. Owner support will review the booking and follow up.</string>
     <string name="complaint_select_reason">Select reason</string>
     <string name="complaint_issue_type">Issue type</string>
     <string name="complaint_what_happened">What happened?</string>
     <string name="complaint_attach_photo">Attach photo (optional)</string>
     <string name="complaint_photo_attached">Photo attached</string>
     <string name="complaint_submit">Submit complaint</string>
     <string name="complaint_received">Complaint received</string>
     <string name="complaint_back">Back to booking</string>
     <string name="complaint_submitting">Submitting complaint</string>
     <string name="complaint_error_title">Something went wrong</string>
     <string name="complaint_retry">Try again</string>
     <string name="complaint_status_investigating">Owner support is reviewing your complaint.</string>
     <string name="complaint_status_resolved">This complaint has been resolved.</string>
     <string name="complaint_status_default">Owner support will respond within 2 hours.</string>
     <string name="complaint_error_unknown">Unknown error</string>
     <!-- Complaint reason labels -->
     <string name="complaint_reason_service_quality">Service quality</string>
     <string name="complaint_reason_late_arrival">Late arrival</string>
     <string name="complaint_reason_no_show">Technician did not arrive</string>
     <string name="complaint_reason_technician_behaviour">Technician behaviour</string>
     <string name="complaint_reason_billing_dispute">Billing dispute</string>
     <string name="complaint_reason_other">Other</string>
 
     <!-- Rating screen (E12-S02a) -->
     <string name="rating_awaiting_title">Rating submitted</string>
     <string name="rating_awaiting_body">We will reveal both ratings after the technician responds.</string>
     <string name="rating_revealed_title">Ratings revealed</string>
     <string name="rating_revealed_body">Thanks for keeping the service marketplace fair.</string>
     <string name="rating_back_home">Back to Home</string>
     <string name="rating_error_title">Could not load rating</string>
     <string name="rating_loading_title">Loading rating</string>
     <string name="rating_loading_body">Preparing your service feedback form.</string>
     <string name="rating_eyebrow">Service feedback</string>
     <string name="rating_title">Rate your service</string>
     <string name="rating_body">Your rating helps improve technician quality and customer support follow-up.</string>
     <string name="rating_overall">Overall experience</string>
     <string name="rating_punctuality">Punctuality</string>
     <string name="rating_skill">Skill quality</string>
     <string name="rating_behaviour">Behaviour</string>
     <string name="rating_comment_label">Comment (optional)</string>
     <string name="rating_submit">Submit rating</string>
+    <string name="rating_submit_error_no_technician">No technician was assigned to this booking, so there is nothing to rate.</string>
+    <string name="rating_submit_error_not_closed">This job is not finished yet. Rate it once the technician marks it complete.</string>
+    <string name="rating_submit_error_not_available">This booking is not available to rate.</string>
+    <string name="rating_submit_error_network">Your rating did not reach us. Check your connection and send it again.</string>
+    <string name="rating_submit_error_generic">Your rating did not go through. Send it again.</string>
+    <string name="rating_submit_retry">Send again</string>
     <plurals name="rating_star_label">
         <item quantity="one">rate %d star</item>
         <item quantity="other">rate %d stars</item>
     </plurals>
     <string name="rating_private_review_countdown">Private review: %s left</string>
     <string name="rating_post_anyway">Post anyway</string>
     <string name="rating_shield_title">Share this privately first?</string>
     <string name="rating_shield_body">Low ratings can be sent to owner support before posting publicly.</string>
     <string name="rating_shield_send_support">Send to support first</string>
     <string name="rating_shield_post_now">Post rating now</string>
 
     <!-- Customer bookings screen (E12-S02a) -->
     <string name="bookings_title">Bookings</string>
     <string name="bookings_subtitle">Upcoming and completed service visits</string>
     <string name="bookings_refresh_desc">Refresh bookings</string>
     <string name="bookings_track_technician">Track technician</string>
     <string name="bookings_view_status">View status</string>
     <string name="bookings_no_bookings">No bookings yet</string>
     <string name="bookings_no_bookings_body">Confirmed bookings will appear here with service date, status, and tracking access.</string>
     <string name="bookings_error_title">Could not refresh bookings</string>
     <string name="bookings_error_body">Your latest booking is still saved. Retry when the network is stable.</string>
     <string name="bookings_retry">Retry</string>
     <string name="bookings_rate_booking">Rate Booking</string>
     <string name="bookings_file_complaint">File Complaint</string>
     <!-- Booking status labels -->
     <string name="booking_status_pending_payment">Payment pending</string>
     <string name="booking_status_paid">Confirmed</string>
     <string name="booking_status_searching">Finding technician</string>
     <string name="booking_status_assigned">Technician assigned</string>
     <string name="booking_status_en_route">En route</string>
     <string name="booking_status_reached">Arrived</string>
     <string name="booking_status_in_progress">In progress</string>
     <string name="booking_status_awaiting_price_approval">Price approval</string>
     <string name="booking_status_completed">Completed</string>
     <string name="booking_status_closed">Closed</string>
     <string name="booking_status_unfulfilled">Unfulfilled</string>
     <string name="booking_status_cancelled">Cancelled</string>
     <string name="booking_status_reassigning">Reassigning</string>
     <string name="booking_status_updated">Updated</string>
     <!-- Payment method labels -->
     <string name="payment_method_online">Paid online</string>
     <string name="payment_method_cash">Cash on service</string>
 
     <!-- Catalogue home screen (E12-S02a) -->
     <string name="catalogue_our_services">Our services</string>
     <string name="catalogue_search_hint" tools:ignore="UnusedResources">Search AC, plumber, electrician…</string>
     <string name="catalogue_location_display">Ayodhya, Uttar Pradesh</string>
     <string name="catalogue_starting_price">From %1$s</string>
     <string name="catalogue_empty_title">No services here yet</string>
     <string name="catalogue_empty_body">We are adding services in your area. Check back soon.</string>
     <string name="catalogue_retry">Try again</string>
 
     <!-- Confidence score row (E12-S02a) -->
     <string name="confidence_new_area">New in your area &#8212; building track record</string>
     <string name="confidence_on_time">%d%% on-time</string>
     <string name="confidence_area_rating">%.1f area rating</string>
     <string name="confidence_eta">~%d min away</string>
     <string name="confidence_methodology_title">How we calculate this</string>
     <string name="confidence_methodology_body">On-time %%: jobs started within 15 min of booked slot (last 30 days).\n\nArea rating: average star rating in your area.\n\nETA: estimated travel time from technician\'s last location at 20 km/h.</string>
 
     <!-- Settings -->
     <string name="settings_title">Settings</string>
     <string name="settings_language">Language</string>
     <string name="settings_language_current">English</string>
     <string name="settings_language_title">Choose language</string>
     <string name="settings_language_save">Save</string>
     <string name="settings_privacy_and_data">Privacy &amp; data</string>
     <string name="settings_privacy_data_export_title">Download my data</string>
     <string name="settings_privacy_manage_consent_title">Manage privacy consent</string>
     <string name="settings_privacy_data_delete_title">Delete account</string>
 
     <!-- Data export / DPDP §11 self-service data access (E15-S01) -->
     <string name="data_export_title">Download my data</string>
     <string name="data_export_description">Your complete account data — profile, bookings, ratings, and complaints — will be downloaded as a JSON file to a location of your choice.</string>
     <string name="data_export_privacy_note">Your data is downloaded directly to your device. It is never stored or processed by third parties.</string>
     <string name="data_export_button">Download my data</string>
     <string name="data_export_loading">Preparing your data export&#8230;</string>
     <string name="data_export_success_toast">Data saved successfully</string>
     <string name="data_export_error_unknown">Something went wrong. Please check your connection and try again.</string>
     <string name="data_export_retry">Try again</string>
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$files=@('"'customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingApiErrors.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/RatingSubmitFailure.kt'); foreach("'$f in $files){ Write-Output "--- $f"; $i=1; Get-Content $f | ForEach-Object { '"'{0,4}: {1}' -f "'$i, $_; $i++ } }' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 941ms:
--- customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt
   1: package com.homeservices.customer.ui.rating
   2: 
   3: import androidx.compose.foundation.border
   4: import androidx.compose.foundation.clickable
   5: import androidx.compose.foundation.layout.Arrangement
   6: import androidx.compose.foundation.layout.Column
   7: import androidx.compose.foundation.layout.Row
   8: import androidx.compose.foundation.layout.Spacer
   9: import androidx.compose.foundation.layout.fillMaxSize
  10: import androidx.compose.foundation.layout.fillMaxWidth
  11: import androidx.compose.foundation.layout.height
  12: import androidx.compose.foundation.layout.padding
  13: import androidx.compose.foundation.layout.width
  14: import androidx.compose.foundation.rememberScrollState
  15: import androidx.compose.foundation.shape.RoundedCornerShape
  16: import androidx.compose.foundation.verticalScroll
  17: import androidx.compose.material3.ExperimentalMaterial3Api
  18: import androidx.compose.material3.MaterialTheme
  19: import androidx.compose.material3.ModalBottomSheet
  20: import androidx.compose.material3.OutlinedTextField
  21: import androidx.compose.material3.SuggestionChip
  22: import androidx.compose.material3.Surface
  23: import androidx.compose.material3.Text
  24: import androidx.compose.material3.TextButton
  25: import androidx.compose.material3.rememberModalBottomSheetState
  26: import androidx.compose.runtime.Composable
  27: import androidx.compose.runtime.LaunchedEffect
  28: import androidx.compose.runtime.getValue
  29: import androidx.compose.runtime.mutableLongStateOf
  30: import androidx.compose.runtime.remember
  31: import androidx.compose.runtime.setValue
  32: import androidx.compose.ui.Alignment
  33: import androidx.compose.ui.Modifier
  34: import androidx.compose.ui.res.pluralStringResource
  35: import androidx.compose.ui.res.stringResource
  36: import androidx.compose.ui.text.font.FontWeight
  37: import androidx.compose.ui.unit.dp
  38: import androidx.hilt.navigation.compose.hiltViewModel
  39: import androidx.lifecycle.compose.collectAsStateWithLifecycle
  40: import com.homeservices.customer.R
  41: import com.homeservices.customer.domain.rating.RatingSubmitFailure
  42: import com.homeservices.designsystem.components.HsPrimaryButton
  43: import com.homeservices.designsystem.components.HsScreenTitle
  44: import com.homeservices.designsystem.components.HsSecondaryButton
  45: import com.homeservices.designsystem.components.HsSectionCard
  46: import com.homeservices.designsystem.components.HsTrustBadge
  47: import com.homeservices.designsystem.theme.HomeservicesBorderWidth
  48: import com.homeservices.designsystem.theme.LocalHomeservicesRadius
  49: import com.homeservices.designsystem.theme.LocalHomeservicesSpacing
  50: import kotlinx.coroutines.delay
  51: 
  52: @OptIn(ExperimentalMaterial3Api::class)
  53: @Composable
  54: public fun RatingScreen(
  55:     modifier: Modifier = Modifier,
  56:     viewModel: RatingViewModel = hiltViewModel(),
  57:     onBack: () -> Unit = {},
  58:     onSubmitted: () -> Unit = {},
  59: ) {
  60:     val state by viewModel.uiState.collectAsStateWithLifecycle()
  61:     val shieldState by viewModel.shieldState.collectAsStateWithLifecycle()
  62:     val overall by viewModel.overall.collectAsStateWithLifecycle()
  63:     val punct by viewModel.punctuality.collectAsStateWithLifecycle()
  64:     val skill by viewModel.skill.collectAsStateWithLifecycle()
  65:     val behav by viewModel.behaviour.collectAsStateWithLifecycle()
  66:     val comment by viewModel.comment.collectAsStateWithLifecycle()
  67:     val canSubmit by viewModel.canSubmit.collectAsStateWithLifecycle()
  68:     val submitError by viewModel.submitError.collectAsStateWithLifecycle()
  69: 
  70:     androidx.activity.compose.BackHandler(onBack = onBack)
  71: 
  72:     androidx.compose.runtime.LaunchedEffect(state) {
  73:         if (state is RatingUiState.AwaitingPartner || state is RatingUiState.Revealed) {
  74:             onSubmitted()
  75:         }
  76:     }
  77: 
  78:     RatingContent(
  79:         state = state,
  80:         shieldState = shieldState,
  81:         overall = overall,
  82:         punctuality = punct,
  83:         skill = skill,
  84:         behaviour = behav,
  85:         comment = comment,
  86:         canSubmit = canSubmit,
  87:         submitError = submitError,
  88:         onOverallChange = viewModel::setOverall,
  89:         onPunctualityChange = viewModel::setPunctuality,
  90:         onSkillChange = viewModel::setSkill,
  91:         onBehaviourChange = viewModel::setBehaviour,
  92:         onCommentChange = viewModel::setComment,
  93:         onSubmit = viewModel::submit,
  94:         onPostAnyway = viewModel::onPostAnyway,
  95:         onBack = onBack,
  96:         modifier = modifier,
  97:     )
  98: 
  99:     if (shieldState == RatingShieldState.ShowDialog || shieldState == RatingShieldState.Escalating) {
 100:         ShieldBottomSheet(
 101:             onEscalate = viewModel::onEscalate,
 102:             onSkip = viewModel::onSkipShield,
 103:             onDismiss = viewModel::onDismissShieldDialog,
 104:             isEscalating = shieldState == RatingShieldState.Escalating,
 105:         )
 106:     }
 107: }
 108: 
 109: @Composable
 110: internal fun RatingContent(
 111:     state: RatingUiState,
 112:     shieldState: RatingShieldState,
 113:     overall: Int,
 114:     punctuality: Int,
 115:     skill: Int,
 116:     behaviour: Int,
 117:     comment: String,
 118:     canSubmit: Boolean,
 119:     submitError: RatingSubmitFailure?,
 120:     onOverallChange: (Int) -> Unit,
 121:     onPunctualityChange: (Int) -> Unit,
 122:     onSkillChange: (Int) -> Unit,
 123:     onBehaviourChange: (Int) -> Unit,
 124:     onCommentChange: (String) -> Unit,
 125:     onSubmit: () -> Unit,
 126:     onPostAnyway: () -> Unit,
 127:     onBack: () -> Unit,
 128:     modifier: Modifier = Modifier,
 129: ) {
 130:     Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
 131:         Column(modifier = Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
 132:             when (state) {
 133:                 is RatingUiState.AwaitingPartner ->
 134:                     StatusMessage(
 135:                         stringResource(R.string.rating_awaiting_title),
 136:                         stringResource(R.string.rating_awaiting_body),
 137:                         actionLabel = stringResource(R.string.rating_back_home),
 138:                         onAction = onBack,
 139:                     )
 140:                 is RatingUiState.Revealed ->
 141:                     StatusMessage(
 142:                         stringResource(R.string.rating_revealed_title),
 143:                         stringResource(R.string.rating_revealed_body),
 144:                         actionLabel = stringResource(R.string.rating_back_home),
 145:                         onAction = onBack,
 146:                     )
 147:                 is RatingUiState.Error ->
 148:                     StatusMessage(stringResource(R.string.rating_error_title), state.message)
 149:                 is RatingUiState.Loading ->
 150:                     StatusMessage(
 151:                         stringResource(R.string.rating_loading_title),
 152:                         stringResource(R.string.rating_loading_body),
 153:                     )
 154:                 else ->
 155:                     RatingForm(
 156:                         shieldState = shieldState,
 157:                         overall = overall,
 158:                         punctuality = punctuality,
 159:                         skill = skill,
 160:                         behaviour = behaviour,
 161:                         comment = comment,
 162:                         canSubmit = canSubmit,
 163:                         submitError = submitError,
 164:                         onBack = onBack,
 165:                         onOverallChange = onOverallChange,
 166:                         onPunctualityChange = onPunctualityChange,
 167:                         onSkillChange = onSkillChange,
 168:                         onBehaviourChange = onBehaviourChange,
 169:                         onCommentChange = onCommentChange,
 170:                         onSubmit = onSubmit,
 171:                         onPostAnyway = onPostAnyway,
 172:                     )
 173:             }
 174:         }
 175:     }
 176: }
 177: 
 178: @Composable
 179: private fun RatingForm(
 180:     shieldState: RatingShieldState,
 181:     overall: Int,
 182:     punctuality: Int,
 183:     skill: Int,
 184:     behaviour: Int,
 185:     comment: String,
 186:     canSubmit: Boolean,
 187:     submitError: RatingSubmitFailure?,
 188:     onBack: () -> Unit,
 189:     onOverallChange: (Int) -> Unit,
 190:     onPunctualityChange: (Int) -> Unit,
 191:     onSkillChange: (Int) -> Unit,
 192:     onBehaviourChange: (Int) -> Unit,
 193:     onCommentChange: (String) -> Unit,
 194:     onSubmit: () -> Unit,
 195:     onPostAnyway: () -> Unit,
 196: ) {
 197:     Column(modifier = Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
 198:         HsTrustBadge(text = stringResource(R.string.rating_eyebrow))
 199:         HsScreenTitle(
 200:             text = stringResource(R.string.rating_title),
 201:             style = MaterialTheme.typography.headlineSmall,
 202:         )
 203:         Text(
 204:             stringResource(R.string.rating_body),
 205:             style = MaterialTheme.typography.bodyMedium,
 206:             color = MaterialTheme.colorScheme.onSurfaceVariant,
 207:         )
 208:         HsSectionCard {
 209:             StarRow(stringResource(R.string.rating_overall), overall, onOverallChange)
 210:             Spacer(Modifier.height(12.dp))
 211:             StarRow(stringResource(R.string.rating_punctuality), punctuality, onPunctualityChange)
 212:             Spacer(Modifier.height(12.dp))
 213:             StarRow(stringResource(R.string.rating_skill), skill, onSkillChange)
 214:             Spacer(Modifier.height(12.dp))
 215:             StarRow(stringResource(R.string.rating_behaviour), behaviour, onBehaviourChange)
 216:         }
 217:         OutlinedTextField(
 218:             value = comment,
 219:             onValueChange = onCommentChange,
 220:             label = { Text(stringResource(R.string.rating_comment_label)) },
 221:             supportingText = { Text("${comment.length}/500") },
 222:             minLines = 3,
 223:             modifier = Modifier.fillMaxWidth(),
 224:         )
 225:         if (submitError != null) {
 226:             SubmitErrorNotice(submitError)
 227:         }
 228:         if (shieldState is RatingShieldState.Escalated) {
 229:             CountdownChip(expiresAtMs = shieldState.expiresAtMs, onPostAnyway = onPostAnyway)
 230:         } else if (submitError != null && !submitError.retryable) {
 231:             // Pressing submit again cannot change the answer, so offer the only move that helps
 232:             // rather than leaving a dead button under the message.
 233:             HsSecondaryButton(
 234:                 text = stringResource(R.string.rating_back_home),
 235:                 onClick = onBack,
 236:                 modifier = Modifier.fillMaxWidth(),
 237:             )
 238:         } else {
 239:             HsPrimaryButton(
 240:                 text =
 241:                     stringResource(
 242:                         if (submitError != null) R.string.rating_submit_retry else R.string.rating_submit,
 243:                     ),
 244:                 onClick = onSubmit,
 245:                 enabled = canSubmit,
 246:                 modifier = Modifier.fillMaxWidth(),
 247:             )
 248:             // TODO(C-19): implement tip-chip composable here in E18-S03 follow-up once
 249:             //  AwaitingPartner post-submit state is wired (after customer rates, show optional
 250:             //  tip-chip before navigating away). Tracked in E18-S03 ADR-0024.
 251:         }
 252:     }
 253: }
 254: 
 255: /**
 256:  * Why the rating did not send, shown where it happened â€” directly above the button that failed, so
 257:  * the stars and comment stay visible and intact behind it.
 258:  */
 259: @Composable
 260: private fun SubmitErrorNotice(failure: RatingSubmitFailure) {
 261:     val spacing = LocalHomeservicesSpacing.current
 262:     val radius = LocalHomeservicesRadius.current
 263:     Surface(
 264:         color = MaterialTheme.colorScheme.errorContainer,
 265:         contentColor = MaterialTheme.colorScheme.onErrorContainer,
 266:         shape = RoundedCornerShape(radius.md),
 267:         modifier =
 268:             Modifier
 269:                 .fillMaxWidth()
 270:                 .border(
 271:                     width = HomeservicesBorderWidth.hairline,
 272:                     color = MaterialTheme.colorScheme.error,
 273:                     shape = RoundedCornerShape(radius.md),
 274:                 ),
 275:     ) {
 276:         Text(
 277:             text = stringResource(failure.messageRes()),
 278:             style = MaterialTheme.typography.bodyMedium,
 279:             modifier = Modifier.padding(horizontal = spacing.space4, vertical = spacing.space3),
 280:         )
 281:     }
 282: }
 283: 
 284: private fun RatingSubmitFailure.messageRes(): Int =
 285:     when (this) {
 286:         RatingSubmitFailure.NoTechnician -> R.string.rating_submit_error_no_technician
 287:         RatingSubmitFailure.BookingNotClosed -> R.string.rating_submit_error_not_closed
 288:         RatingSubmitFailure.NotAvailable -> R.string.rating_submit_error_not_available
 289:         RatingSubmitFailure.Network -> R.string.rating_submit_error_network
 290:         // AlreadySubmitted never reaches the form â€” the view model moves the screen on instead.
 291:         RatingSubmitFailure.AlreadySubmitted, RatingSubmitFailure.Unknown ->
 292:             R.string.rating_submit_error_generic
 293:     }
 294: 
 295: @Composable
 296: private fun StatusMessage(
 297:     title: String,
 298:     body: String,
 299:     actionLabel: String? = null,
 300:     onAction: () -> Unit = {},
 301: ) {
 302:     Column(
 303:         modifier = Modifier.fillMaxSize(),
 304:         horizontalAlignment = Alignment.CenterHorizontally,
 305:         verticalArrangement = Arrangement.Center,
 306:     ) {
 307:         Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
 308:         Spacer(Modifier.height(8.dp))
 309:         Text(body, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
 310:         if (actionLabel != null) {
 311:             Spacer(Modifier.height(24.dp))
 312:             HsPrimaryButton(
 313:                 text = actionLabel,
 314:                 onClick = onAction,
 315:                 modifier = Modifier.fillMaxWidth(),
 316:             )
 317:         }
 318:     }
 319: }
 320: 
 321: @OptIn(ExperimentalMaterial3Api::class)
 322: @Composable
 323: private fun ShieldBottomSheet(
 324:     onEscalate: () -> Unit,
 325:     onSkip: () -> Unit,
 326:     onDismiss: () -> Unit,
 327:     isEscalating: Boolean = false,
 328: ) {
 329:     val sheetState = rememberModalBottomSheetState()
 330:     ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
 331:         Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp)) {
 332:             Text(
 333:                 stringResource(R.string.rating_shield_title),
 334:                 style = MaterialTheme.typography.titleMedium,
 335:                 fontWeight = FontWeight.Bold,
 336:             )
 337:             Spacer(Modifier.height(8.dp))
 338:             Text(
 339:                 stringResource(R.string.rating_shield_body),
 340:                 style = MaterialTheme.typography.bodyMedium,
 341:                 color = MaterialTheme.colorScheme.onSurfaceVariant,
 342:             )
 343:             Spacer(Modifier.height(16.dp))
 344:             HsPrimaryButton(
 345:                 text = stringResource(R.string.rating_shield_send_support),
 346:                 onClick = onEscalate,
 347:                 enabled = !isEscalating,
 348:                 modifier = Modifier.fillMaxWidth(),
 349:             )
 350:             Spacer(Modifier.height(8.dp))
 351:             HsSecondaryButton(
 352:                 text = stringResource(R.string.rating_shield_post_now),
 353:                 onClick = onSkip,
 354:                 enabled = !isEscalating,
 355:                 modifier = Modifier.fillMaxWidth(),
 356:             )
 357:             Spacer(Modifier.height(16.dp))
 358:         }
 359:     }
 360: }
 361: 
 362: @Composable
 363: private fun CountdownChip(
 364:     expiresAtMs: Long,
 365:     onPostAnyway: () -> Unit,
 366: ) {
 367:     var remainingMs by remember { mutableLongStateOf(expiresAtMs - System.currentTimeMillis()) }
 368:     LaunchedEffect(expiresAtMs) {
 369:         while (true) {
 370:             remainingMs = expiresAtMs - System.currentTimeMillis()
 371:             if (remainingMs <= 0) break
 372:             delay(60_000L)
 373:         }
 374:     }
 375:     val hours = (remainingMs / 3_600_000).coerceAtLeast(0)
 376:     val minutes = ((remainingMs % 3_600_000) / 60_000).coerceAtLeast(0)
 377:     val timeString = "$hours:${minutes.toString().padStart(2, '0')}"
 378:     Row(modifier = Modifier.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
 379:         SuggestionChip(
 380:             onClick = {},
 381:             label = { Text(stringResource(R.string.rating_private_review_countdown, timeString)) },
 382:         )
 383:         Spacer(Modifier.width(8.dp))
 384:         TextButton(onClick = onPostAnyway) { Text(stringResource(R.string.rating_post_anyway)) }
 385:     }
 386: }
 387: 
 388: @Composable
 389: private fun StarRow(
 390:     label: String,
 391:     value: Int,
 392:     onChange: (Int) -> Unit,
 393: ) {
 394:     Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
 395:         Text(label, style = MaterialTheme.typography.labelLarge)
 396:         Row {
 397:             for (i in 1..5) {
 398:                 Text(
 399:                     text = if (i <= value) "â˜…" else "â˜†",
 400:                     style = MaterialTheme.typography.headlineSmall,
 401:                     color = if (i <= value) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
 402:                     modifier =
 403:                         Modifier
 404:                             .padding(end = 6.dp)
 405:                             .clickable(onClickLabel = pluralStringResource(R.plurals.rating_star_label, i, i)) { onChange(i) },
 406:                 )
 407:             }
 408:         }
 409:     }
 410: }
--- customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
   1: package com.homeservices.customer.ui.rating
   2: 
   3: import androidx.lifecycle.SavedStateHandle
   4: import androidx.lifecycle.ViewModel
   5: import androidx.lifecycle.viewModelScope
   6: import com.homeservices.customer.domain.rating.EscalateRatingUseCase
   7: import com.homeservices.customer.domain.rating.GetRatingUseCase
   8: import com.homeservices.customer.domain.rating.RatingSubmitException
   9: import com.homeservices.customer.domain.rating.RatingSubmitFailure
  10: import com.homeservices.customer.domain.rating.SubmitRatingUseCase
  11: import com.homeservices.customer.domain.rating.model.CustomerSubScores
  12: import com.homeservices.customer.domain.rating.model.RatingSnapshot
  13: import com.homeservices.customer.domain.rating.model.SideState
  14: import com.homeservices.customer.observability.analytics.AnalyticsEvents
  15: import com.homeservices.customer.observability.analytics.AnalyticsFacade
  16: import dagger.hilt.android.lifecycle.HiltViewModel
  17: import kotlinx.coroutines.Job
  18: import kotlinx.coroutines.delay
  19: import kotlinx.coroutines.flow.MutableStateFlow
  20: import kotlinx.coroutines.flow.StateFlow
  21: import kotlinx.coroutines.flow.asStateFlow
  22: import kotlinx.coroutines.launch
  23: import javax.inject.Inject
  24: 
  25: public sealed class RatingShieldState {
  26:     public object Idle : RatingShieldState()
  27: 
  28:     public object ShowDialog : RatingShieldState()
  29: 
  30:     /** API call in flight â€” sheet buttons disabled to prevent double-tap race. */
  31:     public object Escalating : RatingShieldState()
  32: 
  33:     public data class Escalated(
  34:         val expiresAtMs: Long,
  35:     ) : RatingShieldState()
  36: }
  37: 
  38: public sealed class RatingUiState {
  39:     public object Loading : RatingUiState()
  40: 
  41:     public data class Editing(
  42:         val snapshot: RatingSnapshot?,
  43:     ) : RatingUiState()
  44: 
  45:     public object Submitting : RatingUiState()
  46: 
  47:     public data class AwaitingPartner(
  48:         val snapshot: RatingSnapshot?,
  49:     ) : RatingUiState()
  50: 
  51:     public data class Revealed(
  52:         val snapshot: RatingSnapshot,
  53:     ) : RatingUiState()
  54: 
  55:     public data class Error(
  56:         val message: String,
  57:     ) : RatingUiState()
  58: }
  59: 
  60: @HiltViewModel
  61: public class RatingViewModel
  62:     @Inject
  63:     constructor(
  64:         private val submitUseCase: SubmitRatingUseCase,
  65:         private val getUseCase: GetRatingUseCase,
  66:         private val escalateUseCase: EscalateRatingUseCase,
  67:         private val savedStateHandle: SavedStateHandle,
  68:         private val analytics: AnalyticsFacade,
  69:     ) : ViewModel() {
  70:         public val bookingId: String =
  71:             savedStateHandle.get<String>("bookingId") ?: error("bookingId required")
  72: 
  73:         private val _uiState = MutableStateFlow<RatingUiState>(RatingUiState.Loading)
  74:         public val uiState: StateFlow<RatingUiState> = _uiState.asStateFlow()
  75: 
  76:         private val _shieldState = MutableStateFlow<RatingShieldState>(RatingShieldState.Idle)
  77:         public val shieldState: StateFlow<RatingShieldState> = _shieldState.asStateFlow()
  78: 
  79:         /**
  80:          * Why the last submit was rejected, or null. Kept apart from [uiState] on purpose: a submit
  81:          * that fails must leave the form â€” and everything the customer typed into it â€” on screen,
  82:          * whereas [RatingUiState.Error] replaces the screen and is only for a failed load.
  83:          */
  84:         private val _submitError = MutableStateFlow<RatingSubmitFailure?>(null)
  85:         public val submitError: StateFlow<RatingSubmitFailure?> = _submitError.asStateFlow()
  86: 
  87:         /** Last snapshot the API gave us, so the form can be restored after a failed submit. */
  88:         private var lastSnapshot: RatingSnapshot? = null
  89: 
  90:         private val _overall = MutableStateFlow(0)
  91:         public val overall: StateFlow<Int> = _overall.asStateFlow()
  92: 
  93:         private val _punctuality = MutableStateFlow(0)
  94:         public val punctuality: StateFlow<Int> = _punctuality.asStateFlow()
  95: 
  96:         private val _skill = MutableStateFlow(0)
  97:         public val skill: StateFlow<Int> = _skill.asStateFlow()
  98: 
  99:         private val _behaviour = MutableStateFlow(0)
 100:         public val behaviour: StateFlow<Int> = _behaviour.asStateFlow()
 101: 
 102:         private val _comment = MutableStateFlow("")
 103:         public val comment: StateFlow<String> = _comment.asStateFlow()
 104: 
 105:         private val _canSubmit = MutableStateFlow(false)
 106:         public val canSubmit: StateFlow<Boolean> = _canSubmit.asStateFlow()
 107: 
 108:         // Snapshot of the full rating at the moment escalation was sent to the owner.
 109:         // doSubmit() uses these values (not the live flows) when shieldState is Escalated,
 110:         // so the public rating always matches the draft the owner reviewed.
 111:         private data class EscalatedDraft(
 112:             val overall: Int,
 113:             val subScores: CustomerSubScores,
 114:             val comment: String?,
 115:         )
 116: 
 117:         private var escalatedDraft: EscalatedDraft? = null
 118: 
 119:         // Held so onPostAnyway() / onSkipShield() can cancel the auto-post before it fires.
 120:         private var countdownJob: Job? = null
 121: 
 122:         init {
 123:             // Restore full shield state from SavedStateHandle after OS-initiated process death.
 124:             // Without the draft, the auto-post would submit default (zero-star) values.
 125:             val savedExpiry = savedStateHandle.get<Long>("shieldExpiresAtMs")
 126:             if (savedExpiry != null && savedExpiry > System.currentTimeMillis()) {
 127:                 val dOverall = savedStateHandle.get<Int>("shieldDraftOverall") ?: 0
 128:                 val dPunct = savedStateHandle.get<Int>("shieldDraftPunct") ?: 0
 129:                 val dSkill = savedStateHandle.get<Int>("shieldDraftSkill") ?: 0
 130:                 val dBehav = savedStateHandle.get<Int>("shieldDraftBehav") ?: 0
 131:                 val dComment = savedStateHandle.get<String>("shieldDraftComment")?.ifBlank { null }
 132:                 if (dOverall > 0) {
 133:                     _overall.value = dOverall
 134:                     _punctuality.value = dPunct
 135:                     _skill.value = dSkill
 136:                     _behaviour.value = dBehav
 137:                     dComment?.let { _comment.value = it }
 138:                     recompute()
 139:                     escalatedDraft = EscalatedDraft(dOverall, CustomerSubScores(dPunct, dSkill, dBehav), dComment)
 140:                 }
 141:                 _shieldState.value = RatingShieldState.Escalated(savedExpiry)
 142:                 startCountdown(savedExpiry)
 143:             }
 144: 
 145:             viewModelScope.launch {
 146:                 getUseCase.invoke(bookingId).collect { result ->
 147:                     result
 148:                         .onSuccess { snap ->
 149:                             lastSnapshot = snap
 150:                             // Cancel shield countdown if rating was already submitted elsewhere
 151:                             // (e.g. from another device, or restored countdown for a stale session).
 152:                             if (snap.customerSide is SideState.Submitted && _shieldState.value is RatingShieldState.Escalated) {
 153:                                 cancelShieldState()
 154:                             }
 155:                             _uiState.value =
 156:                                 when {
 157:                                     snap.status == RatingSnapshot.Status.REVEALED -> RatingUiState.Revealed(snap)
 158:                                     snap.customerSide is SideState.Submitted -> RatingUiState.AwaitingPartner(snap)
 159:                                     else -> RatingUiState.Editing(snap)
 160:                                 }
 161:                         }.onFailure { _uiState.value = RatingUiState.Error(it.message ?: "load failed") }
 162:                 }
 163:             }
 164:         }
 165: 
 166:         private fun cancelShieldState() {
 167:             countdownJob?.cancel()
 168:             countdownJob = null
 169:             escalatedDraft = null
 170:             _shieldState.value = RatingShieldState.Idle
 171:             savedStateHandle.remove<Long>("shieldExpiresAtMs")
 172:             savedStateHandle.remove<Int>("shieldDraftOverall")
 173:             savedStateHandle.remove<Int>("shieldDraftPunct")
 174:             savedStateHandle.remove<Int>("shieldDraftSkill")
 175:             savedStateHandle.remove<Int>("shieldDraftBehav")
 176:             savedStateHandle.remove<String>("shieldDraftComment")
 177:         }
 178: 
 179:         public fun setOverall(stars: Int) {
 180:             _overall.value = stars
 181:             recompute()
 182:         }
 183: 
 184:         public fun setPunctuality(stars: Int) {
 185:             _punctuality.value = stars
 186:             recompute()
 187:         }
 188: 
 189:         public fun setSkill(stars: Int) {
 190:             _skill.value = stars
 191:             recompute()
 192:         }
 193: 
 194:         public fun setBehaviour(stars: Int) {
 195:             _behaviour.value = stars
 196:             recompute()
 197:         }
 198: 
 199:         public fun setComment(text: String) {
 200:             _comment.value = text.take(500)
 201:         }
 202: 
 203:         private fun recompute() {
 204:             _canSubmit.value =
 205:                 overall.value in 1..5 &&
 206:                 punctuality.value in 1..5 &&
 207:                 skill.value in 1..5 &&
 208:                 behaviour.value in 1..5
 209:         }
 210: 
 211:         public fun submit() {
 212:             if (!_canSubmit.value) return
 213:             if (overall.value <= 2 && _shieldState.value == RatingShieldState.Idle) {
 214:                 _shieldState.value = RatingShieldState.ShowDialog
 215:                 return
 216:             }
 217:             doSubmit()
 218:         }
 219: 
 220:         public fun onDismissShieldDialog() {
 221:             if (_shieldState.value == RatingShieldState.Escalating) return // ignore dismiss during in-flight call
 222:             _shieldState.value = RatingShieldState.Idle
 223:             // Intentionally does NOT submit â€” scrim tap / back gesture is not an opt-out.
 224:         }
 225: 
 226:         public fun onSkipShield() {
 227:             countdownJob?.cancel()
 228:             countdownJob = null
 229:             _shieldState.value = RatingShieldState.Idle
 230:             doSubmit()
 231:         }
 232: 
 233:         public fun onPostAnyway() {
 234:             countdownJob?.cancel()
 235:             countdownJob = null
 236:             _shieldState.value = RatingShieldState.Idle
 237:             doSubmit()
 238:         }
 239: 
 240:         public fun onEscalate() {
 241:             if (_shieldState.value != RatingShieldState.ShowDialog) return // guard re-entrant / double-tap
 242:             _shieldState.value = RatingShieldState.Escalating
 243:             // Same as doSubmit: a fresh attempt clears the last attempt's message, so a retry that
 244:             // succeeds does not leave the old failure sitting under the countdown.
 245:             _submitError.value = null
 246:             val capturedOverall = overall.value
 247:             val capturedSubScores = CustomerSubScores(punctuality.value, skill.value, behaviour.value)
 248:             val capturedComment = comment.value.ifBlank { null }
 249:             viewModelScope.launch {
 250:                 val result =
 251:                     escalateUseCase.invoke(
 252:                         bookingId = bookingId,
 253:                         draftOverall = capturedOverall,
 254:                         draftComment = capturedComment,
 255:                     )
 256:                 result
 257:                     .onSuccess { r ->
 258:                         escalatedDraft = EscalatedDraft(capturedOverall, capturedSubScores, capturedComment)
 259:                         savedStateHandle["shieldExpiresAtMs"] = r.expiresAtMs
 260:                         savedStateHandle["shieldDraftOverall"] = capturedOverall
 261:                         savedStateHandle["shieldDraftPunct"] = capturedSubScores.punctuality
 262:                         savedStateHandle["shieldDraftSkill"] = capturedSubScores.skill
 263:                         savedStateHandle["shieldDraftBehav"] = capturedSubScores.behaviour
 264:                         savedStateHandle["shieldDraftComment"] = capturedComment ?: ""
 265:                         _shieldState.value = RatingShieldState.Escalated(r.expiresAtMs)
 266:                         startCountdown(r.expiresAtMs)
 267:                     }.onFailure {
 268:                         _shieldState.value = RatingShieldState.ShowDialog // allow retry
 269:                         // Same rule as a failed submit: report it, keep the form and the dialog.
 270:                         _submitError.value =
 271:                             (it as? RatingSubmitException)?.failure ?: RatingSubmitFailure.Unknown
 272:                     }
 273:             }
 274:         }
 275: 
 276:         private fun startCountdown(expiresAtMs: Long) {
 277:             countdownJob =
 278:                 viewModelScope.launch {
 279:                     val remaining = expiresAtMs - System.currentTimeMillis()
 280:                     if (remaining > 0) delay(remaining)
 281:                     onPostAnyway()
 282:                 }
 283:         }
 284: 
 285:         /**
 286:          * A rejected submit keeps the customer where they are. The one exception is a rating the
 287:          * server already holds, which is not a failure at all â€” the screen simply catches up.
 288:          */
 289:         private fun onSubmitFailed(throwable: Throwable) {
 290:             val failure = (throwable as? RatingSubmitException)?.failure ?: RatingSubmitFailure.Unknown
 291:             if (failure == RatingSubmitFailure.AlreadySubmitted) {
 292:                 cancelShieldState()
 293:                 _submitError.value = null
 294:                 _uiState.value = RatingUiState.AwaitingPartner(lastSnapshot)
 295:                 return
 296:             }
 297:             // The shield is over by the time a submit can fail (onPostAnyway / onSkipShield both
 298:             // set Idle first), so the captured draft must go too. Keeping it would make doSubmit()
 299:             // resend the old draft and silently discard whatever the customer edits before
 300:             // retrying â€” the owner has already seen the draft, so the retry is theirs to change.
 301:             cancelShieldState()
 302:             _submitError.value = failure
 303:             _uiState.value = RatingUiState.Editing(lastSnapshot)
 304:         }
 305: 
 306:         public fun consumeSubmitError() {
 307:             _submitError.value = null
 308:         }
 309: 
 310:         private fun doSubmit() {
 311:             val draft = escalatedDraft
 312:             val submitOverall = draft?.overall ?: overall.value
 313:             val submitSubScores = draft?.subScores ?: CustomerSubScores(punctuality.value, skill.value, behaviour.value)
 314:             val submitComment = draft?.comment ?: comment.value.ifBlank { null }
 315:             _uiState.value = RatingUiState.Submitting
 316:             _submitError.value = null
 317:             viewModelScope.launch {
 318:                 submitUseCase
 319:                     .invoke(
 320:                         bookingId = bookingId,
 321:                         overall = submitOverall,
 322:                         subScores = submitSubScores,
 323:                         comment = submitComment,
 324:                     ).collect { result ->
 325:                         result
 326:                             .onSuccess {
 327:                                 // Clear shield state only after confirmed success â€” preserves
 328:                                 // draft for retry if the network call fails.
 329:                                 cancelShieldState()
 330:                                 runCatching {
 331:                                     analytics.track(
 332:                                         AnalyticsEvents.RATING_SUBMITTED,
 333:                                         mapOf("booking_id" to bookingId, "overall" to submitOverall),
 334:                                     )
 335:                                 }
 336:                                 _uiState.value = RatingUiState.AwaitingPartner(null)
 337:                             }.onFailure { onSubmitFailed(it) }
 338:                     }
 339:             }
 340:         }
 341:     }
--- customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingApiErrors.kt
   1: package com.homeservices.customer.data.rating
   2: 
   3: import com.homeservices.customer.data.rating.remote.dto.ApiErrorDto
   4: import com.homeservices.customer.domain.rating.RatingSubmitFailure
   5: import com.squareup.moshi.Moshi
   6: import retrofit2.HttpException
   7: import java.io.IOException
   8: 
   9: private const val HTTP_FORBIDDEN = 403
  10: private const val HTTP_NOT_FOUND = 404
  11: 
  12: /** Errors are rare, so one shared adapter is cheaper than building one per failure. */
  13: private val errorAdapter = Moshi.Builder().build().adapter(ApiErrorDto::class.java)
  14: 
  15: /**
  16:  * Translates a transport or API failure into the reason the customer is shown.
  17:  *
  18:  * Both write paths on the rating screen â€” `POST /v1/ratings` and
  19:  * `POST /v1/ratings/{bookingId}/escalate` â€” answer with the same vocabulary of `code` values
  20:  * (see `api/src/functions/ratings.ts` and `api/src/functions/rating-escalate.ts`), so they share
  21:  * this mapping. Codes only one of them can return, and codes added later, fall through to
  22:  * [RatingSubmitFailure.Unknown] rather than surfacing a raw "HTTP 409 Conflict".
  23:  */
  24: internal fun Throwable.toRatingSubmitFailure(): RatingSubmitFailure =
  25:     when (this) {
  26:         is IOException -> RatingSubmitFailure.Network
  27:         is HttpException -> toSubmitFailure()
  28:         else -> RatingSubmitFailure.Unknown
  29:     }
  30: 
  31: private fun HttpException.toSubmitFailure(): RatingSubmitFailure =
  32:     when (code()) {
  33:         HTTP_FORBIDDEN, HTTP_NOT_FOUND -> RatingSubmitFailure.NotAvailable
  34:         else ->
  35:             when (errorCode()) {
  36:                 "NO_TECHNICIAN" -> RatingSubmitFailure.NoTechnician
  37:                 "RATING_ALREADY_SUBMITTED" -> RatingSubmitFailure.AlreadySubmitted
  38:                 "BOOKING_NOT_CLOSED" -> RatingSubmitFailure.BookingNotClosed
  39:                 "BOOKING_NOT_FOUND", "FORBIDDEN" -> RatingSubmitFailure.NotAvailable
  40:                 else -> RatingSubmitFailure.Unknown
  41:             }
  42:     }
  43: 
  44: /**
  45:  * Reads the stable `code` the API puts in every error body. A body that is missing, truncated or
  46:  * not JSON at all (a gateway HTML page, say) yields null rather than throwing.
  47:  */
  48: private fun HttpException.errorCode(): String? =
  49:     runCatching { response()?.errorBody()?.string() }
  50:         .getOrNull()
  51:         ?.takeIf { it.isNotBlank() }
  52:         ?.let { body -> runCatching { errorAdapter.fromJson(body)?.code }.getOrNull() }
  53:         ?.takeIf { it.isNotBlank() }
--- customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt
   1: package com.homeservices.customer.data.rating
   2: 
   3: import com.homeservices.customer.data.rating.remote.RatingApiService
   4: import com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto
   5: import com.homeservices.customer.domain.rating.RatingSubmitException
   6: import com.homeservices.customer.domain.rating.RatingSubmitFailure
   7: import com.homeservices.customer.domain.rating.model.CustomerSubScores
   8: import com.homeservices.customer.domain.rating.model.RatingSnapshot
   9: import io.sentry.Sentry
  10: import kotlinx.coroutines.flow.Flow
  11: import kotlinx.coroutines.flow.flow
  12: import javax.inject.Inject
  13: 
  14: internal class RatingRepositoryImpl
  15:     @Inject
  16:     constructor(
  17:         private val api: RatingApiService,
  18:     ) : RatingRepository {
  19:         override fun submitCustomerRating(
  20:             bookingId: String,
  21:             overall: Int,
  22:             subScores: CustomerSubScores,
  23:             comment: String?,
  24:             idempotencyKey: String,
  25:         ): Flow<Result<Unit>> =
  26:             flow {
  27:                 emit(
  28:                     runCatching {
  29:                         api.submit(
  30:                             SubmitRatingRequestDto(
  31:                                 side = "CUSTOMER_TO_TECH",
  32:                                 bookingId = bookingId,
  33:                                 overall = overall,
  34:                                 subScores =
  35:                                     mapOf(
  36:                                         "punctuality" to subScores.punctuality,
  37:                                         "skill" to subScores.skill,
  38:                                         "behaviour" to subScores.behaviour,
  39:                                     ),
  40:                                 comment = comment,
  41:                             ),
  42:                             idempotencyKey = idempotencyKey,
  43:                         )
  44:                     }.recoverCatching { throw it.toSubmitException() },
  45:                 )
  46:             }
  47: 
  48:         override fun get(bookingId: String): Flow<Result<RatingSnapshot>> =
  49:             flow {
  50:                 emit(
  51:                     runCatching { api.get(bookingId).toDomain() }
  52:                         .onFailure { Sentry.captureException(it) },
  53:                 )
  54:             }
  55: 
  56:         /**
  57:          * Only [RatingSubmitFailure.Unknown] reaches Sentry: the other cases are rules the API is
  58:          * meant to enforce (no technician, already rated, job not finished) or an offline phone,
  59:          * none of which are defects worth an alert.
  60:          */
  61:         private fun Throwable.toSubmitException(): RatingSubmitException {
  62:             val failure = toRatingSubmitFailure()
  63:             if (failure == RatingSubmitFailure.Unknown) Sentry.captureException(this)
  64:             return RatingSubmitException(failure, this)
  65:         }
  66:     }
--- customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt
   1: package com.homeservices.customer.domain.rating
   2: 
   3: import com.homeservices.customer.data.rating.remote.RatingApiService
   4: import com.homeservices.customer.data.rating.remote.dto.EscalateRatingRequestDto
   5: import com.homeservices.customer.data.rating.toRatingSubmitFailure
   6: import java.time.Instant
   7: import javax.inject.Inject
   8: 
   9: public data class EscalateRatingResult(
  10:     val complaintId: String,
  11:     val expiresAtMs: Long,
  12: )
  13: 
  14: public class EscalateRatingUseCase
  15:     @Inject
  16:     constructor(
  17:         private val apiService: RatingApiService,
  18:     ) {
  19:         public suspend fun invoke(
  20:             bookingId: String,
  21:             draftOverall: Int,
  22:             draftComment: String? = null,
  23:         ): Result<EscalateRatingResult> =
  24:             runCatching {
  25:                 val dto = apiService.escalate(bookingId, EscalateRatingRequestDto(draftOverall, draftComment))
  26:                 EscalateRatingResult(
  27:                     complaintId = dto.complaintId,
  28:                     expiresAtMs = Instant.parse(dto.expiresAt).toEpochMilli(),
  29:                 )
  30:             }.recoverCatching {
  31:                 // The escalate endpoint answers with the same code vocabulary as submit, so the
  32:                 // sheet can name the real reason instead of a generic "try again".
  33:                 throw RatingSubmitException(it.toRatingSubmitFailure(), it)
  34:             }
  35:     }
--- customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/RatingSubmitFailure.kt
   1: package com.homeservices.customer.domain.rating
   2: 
   3: /**
   4:  * Why a rating submission was rejected.
   5:  *
   6:  * The API answers a failed `POST /v1/ratings` with a stable `code` in the body (see
   7:  * `api/src/functions/ratings.ts`). Mapping those codes to this enum at the data layer keeps
   8:  * HTTP details out of the UI and lets the screen say what actually went wrong instead of
   9:  * surfacing a raw "HTTP 409 Conflict".
  10:  *
  11:  * [retryable] answers a single question the UI needs: does pressing the button again have any
  12:  * chance of a different outcome? Transport failures can recover; a booking with no technician
  13:  * never will.
  14:  */
  15: public enum class RatingSubmitFailure(
  16:     public val retryable: Boolean,
  17: ) {
  18:     /** Booking closed without a technician ever being assigned â€” nothing to rate. */
  19:     NoTechnician(retryable = false),
  20: 
  21:     /** This side of the rating is already recorded. Not really an error; the screen moves on. */
  22:     AlreadySubmitted(retryable = false),
  23: 
  24:     /** Job is not finished yet, so it cannot be rated. */
  25:     BookingNotClosed(retryable = false),
  26: 
  27:     /** Booking is missing, or belongs to somebody else. */
  28:     NotAvailable(retryable = false),
  29: 
  30:     /** Request never reached the server, or the server never answered. */
  31:     Network(retryable = true),
  32: 
  33:     /** Anything else â€” a 5xx, a malformed body, an unrecognised code. */
  34:     Unknown(retryable = true),
  35: }
  36: 
  37: /**
  38:  * Failure carried out of [com.homeservices.customer.data.rating.RatingRepository.submitCustomerRating].
  39:  */
  40: public class RatingSubmitException(
  41:     public val failure: RatingSubmitFailure,
  42:     cause: Throwable? = null,
  43: ) : Exception("Rating submit failed: $failure", cause)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt'; "'$i=1; Get-Content $f | ForEach-Object { '"'{0,4}: {1}' -f "'$i, $_; $i++ }' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 722ms:
   1: package com.homeservices.customer.ui.rating
   2: 
   3: import androidx.lifecycle.SavedStateHandle
   4: import androidx.lifecycle.ViewModel
   5: import androidx.lifecycle.viewModelScope
   6: import com.homeservices.customer.domain.rating.EscalateRatingUseCase
   7: import com.homeservices.customer.domain.rating.GetRatingUseCase
   8: import com.homeservices.customer.domain.rating.RatingSubmitException
   9: import com.homeservices.customer.domain.rating.RatingSubmitFailure
  10: import com.homeservices.customer.domain.rating.SubmitRatingUseCase
  11: import com.homeservices.customer.domain.rating.model.CustomerSubScores
  12: import com.homeservices.customer.domain.rating.model.RatingSnapshot
  13: import com.homeservices.customer.domain.rating.model.SideState
  14: import com.homeservices.customer.observability.analytics.AnalyticsEvents
  15: import com.homeservices.customer.observability.analytics.AnalyticsFacade
  16: import dagger.hilt.android.lifecycle.HiltViewModel
  17: import kotlinx.coroutines.Job
  18: import kotlinx.coroutines.delay
  19: import kotlinx.coroutines.flow.MutableStateFlow
  20: import kotlinx.coroutines.flow.StateFlow
  21: import kotlinx.coroutines.flow.asStateFlow
  22: import kotlinx.coroutines.launch
  23: import javax.inject.Inject
  24: 
  25: public sealed class RatingShieldState {
  26:     public object Idle : RatingShieldState()
  27: 
  28:     public object ShowDialog : RatingShieldState()
  29: 
  30:     /** API call in flight â€” sheet buttons disabled to prevent double-tap race. */
  31:     public object Escalating : RatingShieldState()
  32: 
  33:     public data class Escalated(
  34:         val expiresAtMs: Long,
  35:     ) : RatingShieldState()
  36: }
  37: 
  38: public sealed class RatingUiState {
  39:     public object Loading : RatingUiState()
  40: 
  41:     public data class Editing(
  42:         val snapshot: RatingSnapshot?,
  43:     ) : RatingUiState()
  44: 
  45:     public object Submitting : RatingUiState()
  46: 
  47:     public data class AwaitingPartner(
  48:         val snapshot: RatingSnapshot?,
  49:     ) : RatingUiState()
  50: 
  51:     public data class Revealed(
  52:         val snapshot: RatingSnapshot,
  53:     ) : RatingUiState()
  54: 
  55:     public data class Error(
  56:         val message: String,
  57:     ) : RatingUiState()
  58: }
  59: 
  60: @HiltViewModel
  61: public class RatingViewModel
  62:     @Inject
  63:     constructor(
  64:         private val submitUseCase: SubmitRatingUseCase,
  65:         private val getUseCase: GetRatingUseCase,
  66:         private val escalateUseCase: EscalateRatingUseCase,
  67:         private val savedStateHandle: SavedStateHandle,
  68:         private val analytics: AnalyticsFacade,
  69:     ) : ViewModel() {
  70:         public val bookingId: String =
  71:             savedStateHandle.get<String>("bookingId") ?: error("bookingId required")
  72: 
  73:         private val _uiState = MutableStateFlow<RatingUiState>(RatingUiState.Loading)
  74:         public val uiState: StateFlow<RatingUiState> = _uiState.asStateFlow()
  75: 
  76:         private val _shieldState = MutableStateFlow<RatingShieldState>(RatingShieldState.Idle)
  77:         public val shieldState: StateFlow<RatingShieldState> = _shieldState.asStateFlow()
  78: 
  79:         /**
  80:          * Why the last submit was rejected, or null. Kept apart from [uiState] on purpose: a submit
  81:          * that fails must leave the form â€” and everything the customer typed into it â€” on screen,
  82:          * whereas [RatingUiState.Error] replaces the screen and is only for a failed load.
  83:          */
  84:         private val _submitError = MutableStateFlow<RatingSubmitFailure?>(null)
  85:         public val submitError: StateFlow<RatingSubmitFailure?> = _submitError.asStateFlow()
  86: 
  87:         /** Last snapshot the API gave us, so the form can be restored after a failed submit. */
  88:         private var lastSnapshot: RatingSnapshot? = null
  89: 
  90:         private val _overall = MutableStateFlow(0)
  91:         public val overall: StateFlow<Int> = _overall.asStateFlow()
  92: 
  93:         private val _punctuality = MutableStateFlow(0)
  94:         public val punctuality: StateFlow<Int> = _punctuality.asStateFlow()
  95: 
  96:         private val _skill = MutableStateFlow(0)
  97:         public val skill: StateFlow<Int> = _skill.asStateFlow()
  98: 
  99:         private val _behaviour = MutableStateFlow(0)
 100:         public val behaviour: StateFlow<Int> = _behaviour.asStateFlow()
 101: 
 102:         private val _comment = MutableStateFlow("")
 103:         public val comment: StateFlow<String> = _comment.asStateFlow()
 104: 
 105:         private val _canSubmit = MutableStateFlow(false)
 106:         public val canSubmit: StateFlow<Boolean> = _canSubmit.asStateFlow()
 107: 
 108:         // Snapshot of the full rating at the moment escalation was sent to the owner.
 109:         // doSubmit() uses these values (not the live flows) when shieldState is Escalated,
 110:         // so the public rating always matches the draft the owner reviewed.
 111:         private data class EscalatedDraft(
 112:             val overall: Int,
 113:             val subScores: CustomerSubScores,
 114:             val comment: String?,
 115:         )
 116: 
 117:         private var escalatedDraft: EscalatedDraft? = null
 118: 
 119:         // Held so onPostAnyway() / onSkipShield() can cancel the auto-post before it fires.
 120:         private var countdownJob: Job? = null
 121: 
 122:         init {
 123:             // Restore full shield state from SavedStateHandle after OS-initiated process death.
 124:             // Without the draft, the auto-post would submit default (zero-star) values.
 125:             val savedExpiry = savedStateHandle.get<Long>("shieldExpiresAtMs")
 126:             if (savedExpiry != null && savedExpiry > System.currentTimeMillis()) {
 127:                 val dOverall = savedStateHandle.get<Int>("shieldDraftOverall") ?: 0
 128:                 val dPunct = savedStateHandle.get<Int>("shieldDraftPunct") ?: 0
 129:                 val dSkill = savedStateHandle.get<Int>("shieldDraftSkill") ?: 0
 130:                 val dBehav = savedStateHandle.get<Int>("shieldDraftBehav") ?: 0
 131:                 val dComment = savedStateHandle.get<String>("shieldDraftComment")?.ifBlank { null }
 132:                 if (dOverall > 0) {
 133:                     _overall.value = dOverall
 134:                     _punctuality.value = dPunct
 135:                     _skill.value = dSkill
 136:                     _behaviour.value = dBehav
 137:                     dComment?.let { _comment.value = it }
 138:                     recompute()
 139:                     escalatedDraft = EscalatedDraft(dOverall, CustomerSubScores(dPunct, dSkill, dBehav), dComment)
 140:                 }
 141:                 _shieldState.value = RatingShieldState.Escalated(savedExpiry)
 142:                 startCountdown(savedExpiry)
 143:             }
 144: 
 145:             viewModelScope.launch {
 146:                 getUseCase.invoke(bookingId).collect { result ->
 147:                     result
 148:                         .onSuccess { snap ->
 149:                             lastSnapshot = snap
 150:                             // Cancel shield countdown if rating was already submitted elsewhere
 151:                             // (e.g. from another device, or restored countdown for a stale session).
 152:                             if (snap.customerSide is SideState.Submitted && _shieldState.value is RatingShieldState.Escalated) {
 153:                                 cancelShieldState()
 154:                             }
 155:                             _uiState.value =
 156:                                 when {
 157:                                     snap.status == RatingSnapshot.Status.REVEALED -> RatingUiState.Revealed(snap)
 158:                                     snap.customerSide is SideState.Submitted -> RatingUiState.AwaitingPartner(snap)
 159:                                     else -> RatingUiState.Editing(snap)
 160:                                 }
 161:                         }.onFailure { _uiState.value = RatingUiState.Error(it.message ?: "load failed") }
 162:                 }
 163:             }
 164:         }
 165: 
 166:         private fun cancelShieldState() {
 167:             countdownJob?.cancel()
 168:             countdownJob = null
 169:             escalatedDraft = null
 170:             _shieldState.value = RatingShieldState.Idle
 171:             savedStateHandle.remove<Long>("shieldExpiresAtMs")
 172:             savedStateHandle.remove<Int>("shieldDraftOverall")
 173:             savedStateHandle.remove<Int>("shieldDraftPunct")
 174:             savedStateHandle.remove<Int>("shieldDraftSkill")
 175:             savedStateHandle.remove<Int>("shieldDraftBehav")
 176:             savedStateHandle.remove<String>("shieldDraftComment")
 177:         }
 178: 
 179:         public fun setOverall(stars: Int) {
 180:             _overall.value = stars
 181:             recompute()
 182:         }
 183: 
 184:         public fun setPunctuality(stars: Int) {
 185:             _punctuality.value = stars
 186:             recompute()
 187:         }
 188: 
 189:         public fun setSkill(stars: Int) {
 190:             _skill.value = stars
 191:             recompute()
 192:         }
 193: 
 194:         public fun setBehaviour(stars: Int) {
 195:             _behaviour.value = stars
 196:             recompute()
 197:         }
 198: 
 199:         public fun setComment(text: String) {
 200:             _comment.value = text.take(500)
 201:         }
 202: 
 203:         private fun recompute() {
 204:             _canSubmit.value =
 205:                 overall.value in 1..5 &&
 206:                 punctuality.value in 1..5 &&
 207:                 skill.value in 1..5 &&
 208:                 behaviour.value in 1..5
 209:         }
 210: 
 211:         public fun submit() {
 212:             if (!_canSubmit.value) return
 213:             if (overall.value <= 2 && _shieldState.value == RatingShieldState.Idle) {
 214:                 _shieldState.value = RatingShieldState.ShowDialog
 215:                 return
 216:             }
 217:             doSubmit()
 218:         }
 219: 
 220:         public fun onDismissShieldDialog() {
 221:             if (_shieldState.value == RatingShieldState.Escalating) return // ignore dismiss during in-flight call
 222:             _shieldState.value = RatingShieldState.Idle
 223:             // Intentionally does NOT submit â€” scrim tap / back gesture is not an opt-out.
 224:         }
 225: 
 226:         public fun onSkipShield() {
 227:             countdownJob?.cancel()
 228:             countdownJob = null
 229:             _shieldState.value = RatingShieldState.Idle
 230:             doSubmit()
 231:         }
 232: 
 233:         public fun onPostAnyway() {
 234:             countdownJob?.cancel()
 235:             countdownJob = null
 236:             _shieldState.value = RatingShieldState.Idle
 237:             doSubmit()
 238:         }
 239: 
 240:         public fun onEscalate() {
 241:             if (_shieldState.value != RatingShieldState.ShowDialog) return // guard re-entrant / double-tap
 242:             _shieldState.value = RatingShieldState.Escalating
 243:             // Same as doSubmit: a fresh attempt clears the last attempt's message, so a retry that
 244:             // succeeds does not leave the old failure sitting under the countdown.
 245:             _submitError.value = null
 246:             val capturedOverall = overall.value
 247:             val capturedSubScores = CustomerSubScores(punctuality.value, skill.value, behaviour.value)
 248:             val capturedComment = comment.value.ifBlank { null }
 249:             viewModelScope.launch {
 250:                 val result =
 251:                     escalateUseCase.invoke(
 252:                         bookingId = bookingId,
 253:                         draftOverall = capturedOverall,
 254:                         draftComment = capturedComment,
 255:                     )
 256:                 result
 257:                     .onSuccess { r ->
 258:                         escalatedDraft = EscalatedDraft(capturedOverall, capturedSubScores, capturedComment)
 259:                         savedStateHandle["shieldExpiresAtMs"] = r.expiresAtMs
 260:                         savedStateHandle["shieldDraftOverall"] = capturedOverall
 261:                         savedStateHandle["shieldDraftPunct"] = capturedSubScores.punctuality
 262:                         savedStateHandle["shieldDraftSkill"] = capturedSubScores.skill
 263:                         savedStateHandle["shieldDraftBehav"] = capturedSubScores.behaviour
 264:                         savedStateHandle["shieldDraftComment"] = capturedComment ?: ""
 265:                         _shieldState.value = RatingShieldState.Escalated(r.expiresAtMs)
 266:                         startCountdown(r.expiresAtMs)
 267:                     }.onFailure {
 268:                         _shieldState.value = RatingShieldState.ShowDialog // allow retry
 269:                         // Same rule as a failed submit: report it, keep the form and the dialog.
 270:                         _submitError.value =
 271:                             (it as? RatingSubmitException)?.failure ?: RatingSubmitFailure.Unknown
 272:                     }
 273:             }
 274:         }
 275: 
 276:         private fun startCountdown(expiresAtMs: Long) {
 277:             countdownJob =
 278:                 viewModelScope.launch {
 279:                     val remaining = expiresAtMs - System.currentTimeMillis()
 280:                     if (remaining > 0) delay(remaining)
 281:                     onPostAnyway()
 282:                 }
 283:         }
 284: 
 285:         /**
 286:          * A rejected submit keeps the customer where they are. The one exception is a rating the
 287:          * server already holds, which is not a failure at all â€” the screen simply catches up.
 288:          */
 289:         private fun onSubmitFailed(throwable: Throwable) {
 290:             val failure = (throwable as? RatingSubmitException)?.failure ?: RatingSubmitFailure.Unknown
 291:             if (failure == RatingSubmitFailure.AlreadySubmitted) {
 292:                 cancelShieldState()
 293:                 _submitError.value = null
 294:                 _uiState.value = RatingUiState.AwaitingPartner(lastSnapshot)
 295:                 return
 296:             }
 297:             // The shield is over by the time a submit can fail (onPostAnyway / onSkipShield both
 298:             // set Idle first), so the captured draft must go too. Keeping it would make doSubmit()
 299:             // resend the old draft and silently discard whatever the customer edits before
 300:             // retrying â€” the owner has already seen the draft, so the retry is theirs to change.
 301:             cancelShieldState()
 302:             _submitError.value = failure
 303:             _uiState.value = RatingUiState.Editing(lastSnapshot)
 304:         }
 305: 
 306:         public fun consumeSubmitError() {
 307:             _submitError.value = null
 308:         }
 309: 
 310:         private fun doSubmit() {
 311:             val draft = escalatedDraft
 312:             val submitOverall = draft?.overall ?: overall.value
 313:             val submitSubScores = draft?.subScores ?: CustomerSubScores(punctuality.value, skill.value, behaviour.value)
 314:             val submitComment = draft?.comment ?: comment.value.ifBlank { null }
 315:             _uiState.value = RatingUiState.Submitting
 316:             _submitError.value = null
 317:             viewModelScope.launch {
 318:                 submitUseCase
 319:                     .invoke(
 320:                         bookingId = bookingId,
 321:                         overall = submitOverall,
 322:                         subScores = submitSubScores,
 323:                         comment = submitComment,
 324:                     ).collect { result ->
 325:                         result
 326:                             .onSuccess {
 327:                                 // Clear shield state only after confirmed success â€” preserves
 328:                                 // draft for retry if the network call fails.
 329:                                 cancelShieldState()
 330:                                 runCatching {
 331:                                     analytics.track(
 332:                                         AnalyticsEvents.RATING_SUBMITTED,
 333:                                         mapOf("booking_id" to bookingId, "overall" to submitOverall),
 334:                                     )
 335:                                 }
 336:                                 _uiState.value = RatingUiState.AwaitingPartner(null)
 337:                             }.onFailure { onSubmitFailed(it) }
 338:                     }
 339:             }
 340:         }
 341:     }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git show 0285c8e513fcc23986ed4cefd93b7a6dd682ec24:customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt | % { $global:i=0 } { $global:i++; '"'{0,4}: {1}' -f "'$global:i, $_ }' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 768ms:
   1: package com.homeservices.customer.ui.rating
   2: 
   3: import androidx.lifecycle.SavedStateHandle
   4: import androidx.lifecycle.ViewModel
   5: import androidx.lifecycle.viewModelScope
   6: import com.homeservices.customer.domain.rating.EscalateRatingUseCase
   7: import com.homeservices.customer.domain.rating.GetRatingUseCase
   8: import com.homeservices.customer.domain.rating.SubmitRatingUseCase
   9: import com.homeservices.customer.domain.rating.model.CustomerSubScores
  10: import com.homeservices.customer.domain.rating.model.RatingSnapshot
  11: import com.homeservices.customer.domain.rating.model.SideState
  12: import com.homeservices.customer.observability.analytics.AnalyticsEvents
  13: import com.homeservices.customer.observability.analytics.AnalyticsFacade
  14: import dagger.hilt.android.lifecycle.HiltViewModel
  15: import kotlinx.coroutines.Job
  16: import kotlinx.coroutines.delay
  17: import kotlinx.coroutines.flow.MutableStateFlow
  18: import kotlinx.coroutines.flow.StateFlow
  19: import kotlinx.coroutines.flow.asStateFlow
  20: import kotlinx.coroutines.launch
  21: import javax.inject.Inject
  22: 
  23: public sealed class RatingShieldState {
  24:     public object Idle : RatingShieldState()
  25: 
  26:     public object ShowDialog : RatingShieldState()
  27: 
  28:     /** API call in flight — sheet buttons disabled to prevent double-tap race. */
  29:     public object Escalating : RatingShieldState()
  30: 
  31:     public data class Escalated(
  32:         val expiresAtMs: Long,
  33:     ) : RatingShieldState()
  34: }
  35: 
  36: public sealed class RatingUiState {
  37:     public object Loading : RatingUiState()
  38: 
  39:     public data class Editing(
  40:         val snapshot: RatingSnapshot?,
  41:     ) : RatingUiState()
  42: 
  43:     public object Submitting : RatingUiState()
  44: 
  45:     public data class AwaitingPartner(
  46:         val snapshot: RatingSnapshot?,
  47:     ) : RatingUiState()
  48: 
  49:     public data class Revealed(
  50:         val snapshot: RatingSnapshot,
  51:     ) : RatingUiState()
  52: 
  53:     public data class Error(
  54:         val message: String,
  55:     ) : RatingUiState()
  56: }
  57: 
  58: @HiltViewModel
  59: public class RatingViewModel
  60:     @Inject
  61:     constructor(
  62:         private val submitUseCase: SubmitRatingUseCase,
  63:         private val getUseCase: GetRatingUseCase,
  64:         private val escalateUseCase: EscalateRatingUseCase,
  65:         private val savedStateHandle: SavedStateHandle,
  66:         private val analytics: AnalyticsFacade,
  67:     ) : ViewModel() {
  68:         public val bookingId: String =
  69:             savedStateHandle.get<String>("bookingId") ?: error("bookingId required")
  70: 
  71:         private val _uiState = MutableStateFlow<RatingUiState>(RatingUiState.Loading)
  72:         public val uiState: StateFlow<RatingUiState> = _uiState.asStateFlow()
  73: 
  74:         private val _shieldState = MutableStateFlow<RatingShieldState>(RatingShieldState.Idle)
  75:         public val shieldState: StateFlow<RatingShieldState> = _shieldState.asStateFlow()
  76: 
  77:         private val _overall = MutableStateFlow(0)
  78:         public val overall: StateFlow<Int> = _overall.asStateFlow()
  79: 
  80:         private val _punctuality = MutableStateFlow(0)
  81:         public val punctuality: StateFlow<Int> = _punctuality.asStateFlow()
  82: 
  83:         private val _skill = MutableStateFlow(0)
  84:         public val skill: StateFlow<Int> = _skill.asStateFlow()
  85: 
  86:         private val _behaviour = MutableStateFlow(0)
  87:         public val behaviour: StateFlow<Int> = _behaviour.asStateFlow()
  88: 
  89:         private val _comment = MutableStateFlow("")
  90:         public val comment: StateFlow<String> = _comment.asStateFlow()
  91: 
  92:         private val _canSubmit = MutableStateFlow(false)
  93:         public val canSubmit: StateFlow<Boolean> = _canSubmit.asStateFlow()
  94: 
  95:         // Snapshot of the full rating at the moment escalation was sent to the owner.
  96:         // doSubmit() uses these values (not the live flows) when shieldState is Escalated,
  97:         // so the public rating always matches the draft the owner reviewed.
  98:         private data class EscalatedDraft(
  99:             val overall: Int,
 100:             val subScores: CustomerSubScores,
 101:             val comment: String?,
 102:         )
 103: 
 104:         private var escalatedDraft: EscalatedDraft? = null
 105: 
 106:         // Held so onPostAnyway() / onSkipShield() can cancel the auto-post before it fires.
 107:         private var countdownJob: Job? = null
 108: 
 109:         init {
 110:             // Restore full shield state from SavedStateHandle after OS-initiated process death.
 111:             // Without the draft, the auto-post would submit default (zero-star) values.
 112:             val savedExpiry = savedStateHandle.get<Long>("shieldExpiresAtMs")
 113:             if (savedExpiry != null && savedExpiry > System.currentTimeMillis()) {
 114:                 val dOverall = savedStateHandle.get<Int>("shieldDraftOverall") ?: 0
 115:                 val dPunct = savedStateHandle.get<Int>("shieldDraftPunct") ?: 0
 116:                 val dSkill = savedStateHandle.get<Int>("shieldDraftSkill") ?: 0
 117:                 val dBehav = savedStateHandle.get<Int>("shieldDraftBehav") ?: 0
 118:                 val dComment = savedStateHandle.get<String>("shieldDraftComment")?.ifBlank { null }
 119:                 if (dOverall > 0) {
 120:                     _overall.value = dOverall
 121:                     _punctuality.value = dPunct
 122:                     _skill.value = dSkill
 123:                     _behaviour.value = dBehav
 124:                     dComment?.let { _comment.value = it }
 125:                     recompute()
 126:                     escalatedDraft = EscalatedDraft(dOverall, CustomerSubScores(dPunct, dSkill, dBehav), dComment)
 127:                 }
 128:                 _shieldState.value = RatingShieldState.Escalated(savedExpiry)
 129:                 startCountdown(savedExpiry)
 130:             }
 131: 
 132:             viewModelScope.launch {
 133:                 getUseCase.invoke(bookingId).collect { result ->
 134:                     result
 135:                         .onSuccess { snap ->
 136:                             // Cancel shield countdown if rating was already submitted elsewhere
 137:                             // (e.g. from another device, or restored countdown for a stale session).
 138:                             if (snap.customerSide is SideState.Submitted && _shieldState.value is RatingShieldState.Escalated) {
 139:                                 cancelShieldState()
 140:                             }
 141:                             _uiState.value =
 142:                                 when {
 143:                                     snap.status == RatingSnapshot.Status.REVEALED -> RatingUiState.Revealed(snap)
 144:                                     snap.customerSide is SideState.Submitted -> RatingUiState.AwaitingPartner(snap)
 145:                                     else -> RatingUiState.Editing(snap)
 146:                                 }
 147:                         }.onFailure { _uiState.value = RatingUiState.Error(it.message ?: "load failed") }
 148:                 }
 149:             }
 150:         }
 151: 
 152:         private fun cancelShieldState() {
 153:             countdownJob?.cancel()
 154:             countdownJob = null
 155:             escalatedDraft = null
 156:             _shieldState.value = RatingShieldState.Idle
 157:             savedStateHandle.remove<Long>("shieldExpiresAtMs")
 158:             savedStateHandle.remove<Int>("shieldDraftOverall")
 159:             savedStateHandle.remove<Int>("shieldDraftPunct")
 160:             savedStateHandle.remove<Int>("shieldDraftSkill")
 161:             savedStateHandle.remove<Int>("shieldDraftBehav")
 162:             savedStateHandle.remove<String>("shieldDraftComment")
 163:         }
 164: 
 165:         public fun setOverall(stars: Int) {
 166:             _overall.value = stars
 167:             recompute()
 168:         }
 169: 
 170:         public fun setPunctuality(stars: Int) {
 171:             _punctuality.value = stars
 172:             recompute()
 173:         }
 174: 
 175:         public fun setSkill(stars: Int) {
 176:             _skill.value = stars
 177:             recompute()
 178:         }
 179: 
 180:         public fun setBehaviour(stars: Int) {
 181:             _behaviour.value = stars
 182:             recompute()
 183:         }
 184: 
 185:         public fun setComment(text: String) {
 186:             _comment.value = text.take(500)
 187:         }
 188: 
 189:         private fun recompute() {
 190:             _canSubmit.value =
 191:                 overall.value in 1..5 &&
 192:                 punctuality.value in 1..5 &&
 193:                 skill.value in 1..5 &&
 194:                 behaviour.value in 1..5
 195:         }
 196: 
 197:         public fun submit() {
 198:             if (!_canSubmit.value) return
 199:             if (overall.value <= 2 && _shieldState.value == RatingShieldState.Idle) {
 200:                 _shieldState.value = RatingShieldState.ShowDialog
 201:                 return
 202:             }
 203:             doSubmit()
 204:         }
 205: 
 206:         public fun onDismissShieldDialog() {
 207:             if (_shieldState.value == RatingShieldState.Escalating) return // ignore dismiss during in-flight call
 208:             _shieldState.value = RatingShieldState.Idle
 209:             // Intentionally does NOT submit — scrim tap / back gesture is not an opt-out.
 210:         }
 211: 
 212:         public fun onSkipShield() {
 213:             countdownJob?.cancel()
 214:             countdownJob = null
 215:             _shieldState.value = RatingShieldState.Idle
 216:             doSubmit()
 217:         }
 218: 
 219:         public fun onPostAnyway() {
 220:             countdownJob?.cancel()
 221:             countdownJob = null
 222:             _shieldState.value = RatingShieldState.Idle
 223:             doSubmit()
 224:         }
 225: 
 226:         public fun onEscalate() {
 227:             if (_shieldState.value != RatingShieldState.ShowDialog) return // guard re-entrant / double-tap
 228:             _shieldState.value = RatingShieldState.Escalating
 229:             val capturedOverall = overall.value
 230:             val capturedSubScores = CustomerSubScores(punctuality.value, skill.value, behaviour.value)
 231:             val capturedComment = comment.value.ifBlank { null }
 232:             viewModelScope.launch {
 233:                 val result =
 234:                     escalateUseCase.invoke(
 235:                         bookingId = bookingId,
 236:                         draftOverall = capturedOverall,
 237:                         draftComment = capturedComment,
 238:                     )
 239:                 result
 240:                     .onSuccess { r ->
 241:                         escalatedDraft = EscalatedDraft(capturedOverall, capturedSubScores, capturedComment)
 242:                         savedStateHandle["shieldExpiresAtMs"] = r.expiresAtMs
 243:                         savedStateHandle["shieldDraftOverall"] = capturedOverall
 244:                         savedStateHandle["shieldDraftPunct"] = capturedSubScores.punctuality
 245:                         savedStateHandle["shieldDraftSkill"] = capturedSubScores.skill
 246:                         savedStateHandle["shieldDraftBehav"] = capturedSubScores.behaviour
 247:                         savedStateHandle["shieldDraftComment"] = capturedComment ?: ""
 248:                         _shieldState.value = RatingShieldState.Escalated(r.expiresAtMs)
 249:                         startCountdown(r.expiresAtMs)
 250:                     }.onFailure {
 251:                         _shieldState.value = RatingShieldState.ShowDialog // allow retry
 252:                         _uiState.value = RatingUiState.Error(it.message ?: "escalation failed")
 253:                     }
 254:             }
 255:         }
 256: 
 257:         private fun startCountdown(expiresAtMs: Long) {
 258:             countdownJob =
 259:                 viewModelScope.launch {
 260:                     val remaining = expiresAtMs - System.currentTimeMillis()
 261:                     if (remaining > 0) delay(remaining)
 262:                     onPostAnyway()
 263:                 }
 264:         }
 265: 
 266:         private fun doSubmit() {
 267:             val draft = escalatedDraft
 268:             val submitOverall = draft?.overall ?: overall.value
 269:             val submitSubScores = draft?.subScores ?: CustomerSubScores(punctuality.value, skill.value, behaviour.value)
 270:             val submitComment = draft?.comment ?: comment.value.ifBlank { null }
 271:             _uiState.value = RatingUiState.Submitting
 272:             viewModelScope.launch {
 273:                 submitUseCase
 274:                     .invoke(
 275:                         bookingId = bookingId,
 276:                         overall = submitOverall,
 277:                         subScores = submitSubScores,
 278:                         comment = submitComment,
 279:                     ).collect { result ->
 280:                         result
 281:                             .onSuccess {
 282:                                 // Clear shield state only after confirmed success — preserves
 283:                                 // draft for retry if the network call fails.
 284:                                 cancelShieldState()
 285:                                 runCatching {
 286:                                     analytics.track(
 287:                                         AnalyticsEvents.RATING_SUBMITTED,
 288:                                         mapOf("booking_id" to bookingId, "overall" to submitOverall),
 289:                                     )
 290:                                 }
 291:                                 _uiState.value = RatingUiState.AwaitingPartner(null)
 292:                             }.onFailure { _uiState.value = RatingUiState.Error(it.message ?: "submit failed") }
 293:                     }
 294:             }
 295:         }
 296:     }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/ratings.ts -TotalCount 260 | % { $global:i=0 } { $global:i++; '"'{0,4}: {1}' -f "'$global:i, $_ }; Write-Output '"'--- escalate'; Get-Content api/src/functions/rating-escalate.ts -TotalCount 260 | % { "'$global:j=0 } { $global:j++; '"'{0,4}: {1}' -f "'$global:j, $_ }' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 731ms:
   1: import { type HttpHandler, type HttpResponseInit, type InvocationContext, app } from '@azure/functions';
   2: import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';
   3: import { bookingRepo } from '../cosmos/booking-repository.js';
   4: import { ratingRepo } from '../cosmos/rating-repository.js';
   5: import { SubmitRatingRequestSchema, type GetRatingResponse } from '../schemas/rating.js';
   6: import type { CustomerSubScores, TechSubScores } from '../schemas/rating.js';
   7: import { sendRatingReceivedPush } from '../services/fcm.service.js';
   8: import * as Sentry from '@sentry/node';
   9: 
  10: async function uidFromAuth(authHeader: string): Promise<string | null> {
  11:   if (!authHeader.startsWith('Bearer ')) return null;
  12:   try {
  13:     const decoded = await verifyFirebaseIdToken(authHeader.slice(7));
  14:     return decoded.uid;
  15:   } catch {
  16:     return null;
  17:   }
  18: }
  19: 
  20: export const submitRatingHandler: HttpHandler = async (req, _ctx: InvocationContext) => {
  21:   const uid = await uidFromAuth(req.headers.get('authorization') ?? '');
  22:   if (!uid) return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  23: 
  24:   let body: unknown;
  25:   try { body = await req.json(); } catch { return { status: 400, jsonBody: { code: 'PARSE_ERROR' } }; }
  26:   const parsed = SubmitRatingRequestSchema.safeParse(body);
  27:   if (!parsed.success) {
  28:     return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  29:   }
  30:   const data = parsed.data;
  31: 
  32:   const booking = await bookingRepo.getById(data.bookingId);
  33:   if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  34: 
  35:   const isCustomer = booking.customerId === uid;
  36:   const isTechnician = booking.technicianId === uid;
  37:   if (!isCustomer && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  38:   if (data.side === 'CUSTOMER_TO_TECH' && !isCustomer) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  39:   if (data.side === 'TECH_TO_CUSTOMER' && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  40:   if (!['COMPLETED', 'PAID', 'CLOSED'].includes(booking.status)) {
  41:     return { status: 409, jsonBody: { code: 'BOOKING_NOT_CLOSED', status: booking.status } };
  42:   }
  43:   if (!booking.technicianId) return { status: 409, jsonBody: { code: 'NO_TECHNICIAN' } };
  44:   // Rating Shield (E07-S02) is advisory â€” it notifies the owner and starts a 2-hour window,
  45:   // but the customer can always post their rating at any time ("Post anyway" button, or after
  46:   // the timer expires). The shield does NOT block submission here; enforcement is client-side.
  47:   // See docs/stories/E07-S02-rating-shield-escalation.md Â§ AC-4 and AC-5.
  48: 
  49:   const result = await ratingRepo.submitSide({
  50:     bookingId: data.bookingId,
  51:     customerId: booking.customerId,
  52:     technicianId: booking.technicianId,
  53:     side: data.side,
  54:     overall: data.overall,
  55:     subScores: data.subScores,
  56:     ...(data.comment !== undefined ? { comment: data.comment } : {}),
  57:   });
  58:   if (!result) return { status: 409, jsonBody: { code: 'RATING_ALREADY_SUBMITTED' } };
  59:   if (
  60:     data.side === 'CUSTOMER_TO_TECH' &&
  61:     data.overall < 5 &&
  62:     data.comment &&
  63:     data.comment.trim().length > 0 &&
  64:     booking.technicianId
  65:   ) {
  66:     try {
  67:       await sendRatingReceivedPush(booking.technicianId, {
  68:         bookingId: data.bookingId,
  69:         overall: data.overall,
  70:         comment: data.comment,
  71:       });
  72:     } catch (err) {
  73:       Sentry.captureException(err);
  74:     }
  75:   }
  76:   return { status: 201, jsonBody: { bookingId: result.bookingId } };
  77: };
  78: 
  79: type SideProjection =
  80:   | { status: 'PENDING' }
  81:   | { status: 'SUBMITTED'; overall: number; subScores: CustomerSubScores | TechSubScores; submittedAt: string; comment?: string };
  82: 
  83: function projectSide(
  84:   overall: number | undefined,
  85:   subScores: CustomerSubScores | TechSubScores | undefined,
  86:   comment: string | undefined,
  87:   submittedAt: string | undefined,
  88:   reveal: boolean,
  89: ): SideProjection {
  90:   if (!submittedAt || overall === undefined || !subScores) return { status: 'PENDING' };
  91:   if (!reveal) return { status: 'PENDING' };
  92:   return {
  93:     status: 'SUBMITTED',
  94:     overall,
  95:     subScores,
  96:     submittedAt,
  97:     ...(comment !== undefined ? { comment } : {}),
  98:   };
  99: }
 100: 
 101: export const getRatingHandler: HttpHandler = async (req, _ctx: InvocationContext): Promise<HttpResponseInit> => {
 102:   const uid = await uidFromAuth(req.headers.get('authorization') ?? '');
 103:   if (!uid) return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
 104: 
 105:   const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;
 106:   const booking = await bookingRepo.getById(bookingId);
 107:   if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
 108:   const isCustomer = booking.customerId === uid;
 109:   const isTechnician = booking.technicianId === uid;
 110:   if (!isCustomer && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
 111: 
 112:   const doc = await ratingRepo.getByBookingId(bookingId);
 113:   if (!doc) {
 114:     const empty: GetRatingResponse = {
 115:       bookingId, status: 'PENDING',
 116:       customerSide: { status: 'PENDING' }, techSide: { status: 'PENDING' },
 117:     };
 118:     return { status: 200, jsonBody: empty };
 119:   }
 120: 
 121:   const customerHas = doc.customerSubmittedAt !== undefined;
 122:   const techHas = doc.techSubmittedAt !== undefined;
 123:   const revealed = customerHas && techHas;
 124:   const status: GetRatingResponse['status'] = revealed
 125:     ? 'REVEALED'
 126:     : (customerHas || techHas ? 'PARTIALLY_SUBMITTED' : 'PENDING');
 127: 
 128:   const customerVisible = revealed || (isCustomer && customerHas);
 129:   const techVisible = revealed || (isTechnician && techHas);
 130: 
 131:   const response: GetRatingResponse = {
 132:     bookingId,
 133:     status,
 134:     ...(doc.revealedAt !== undefined ? { revealedAt: doc.revealedAt } : {}),
 135:     customerSide: projectSide(
 136:       doc.customerOverall, doc.customerSubScores, doc.customerComment,
 137:       doc.customerSubmittedAt, customerVisible,
 138:     ),
 139:     techSide: projectSide(
 140:       doc.techOverall, doc.techSubScores, doc.techComment,
 141:       doc.techSubmittedAt, techVisible,
 142:     ),
 143:   };
 144:   return { status: 200, jsonBody: response };
 145: };
 146: 
 147: app.http('submitRating', { route: 'v1/ratings', methods: ['POST'], handler: submitRatingHandler });
 148: app.http('getRating', { route: 'v1/ratings/{bookingId}', methods: ['GET'], handler: getRatingHandler });
--- escalate
   1: import { randomUUID, createHash } from 'crypto';
   2: import { app } from '@azure/functions';
   3: import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
   4: import * as Sentry from '@sentry/node';
   5: import { requireCustomer } from '../middleware/requireCustomer.js';
   6: import type { CustomerContext } from '../types/customer.js';
   7: import { EscalateRatingBodySchema } from '../schemas/complaint.js';
   8: import type { ComplaintDoc } from '../schemas/complaint.js';
   9: import { bookingRepo } from '../cosmos/booking-repository.js';
  10: import { ratingRepo } from '../cosmos/rating-repository.js';
  11: import { createComplaint, findRatingShieldEscalation } from '../cosmos/complaints-repository.js';
  12: import { sendOwnerRatingShieldAlert } from '../services/fcm.service.js';
  13: import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
  14: 
  15: export async function escalateRatingHandler(
  16:   req: HttpRequest,
  17:   ctx: InvocationContext,
  18:   customer: CustomerContext,
  19: ): Promise<HttpResponseInit> {
  20:   const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;
  21: 
  22:   let body: unknown;
  23:   try {
  24:     body = await req.json();
  25:   } catch {
  26:     return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  27:   }
  28:   const parsed = EscalateRatingBodySchema.safeParse(body);
  29:   if (!parsed.success) {
  30:     return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  31:   }
  32: 
  33:   const booking = await bookingRepo.getById(bookingId);
  34:   if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  35:   if (booking.customerId !== customer.customerId) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  36:   if (booking.status !== 'CLOSED') return { status: 409, jsonBody: { code: 'BOOKING_NOT_CLOSED' } };
  37:   if (!booking.technicianId) return { status: 409, jsonBody: { code: 'NO_TECHNICIAN' } };
  38: 
  39:   // Both pre-create checks query Cosmos â€” wrap together so a 404 from an unprovisioned
  40:   // container surfaces as CONTAINER_NOT_PROVISIONED rather than an unhandled 500.
  41:   let existingRating: Awaited<ReturnType<typeof ratingRepo.getByBookingId>>;
  42:   let existing: Awaited<ReturnType<typeof findRatingShieldEscalation>>;
  43:   try {
  44:     [existingRating, existing] = await Promise.all([
  45:       ratingRepo.getByBookingId(bookingId),
  46:       findRatingShieldEscalation(bookingId, customer.customerId),
  47:     ]);
  48:   } catch (err: unknown) {
  49:     if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 404) {
  50:       return { status: 503, jsonBody: { code: 'CONTAINER_NOT_PROVISIONED' } };
  51:     }
  52:     throw err;
  53:   }
  54:   if (existingRating?.customerSubmittedAt) {
  55:     return { status: 409, jsonBody: { code: 'RATING_ALREADY_SUBMITTED' } };
  56:   }
  57:   if (existing) return { status: 409, jsonBody: { code: 'SHIELD_ALREADY_ESCALATED' } };
  58: 
  59:   const now = new Date();
  60:   const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  61: 
  62:   // Deterministic ID: concurrent duplicate requests both try to create the same document ID;
  63:   // Cosmos rejects the second with a conflict, which we surface as SHIELD_ALREADY_ESCALATED.
  64:   const shieldId = createHash('sha256')
  65:     .update(`shield:${bookingId}:${customer.customerId}`)
  66:     .digest('hex')
  67:     .slice(0, 36);
  68: 
  69:   const doc: ComplaintDoc = {
  70:     id: shieldId,
  71:     orderId: bookingId,
  72:     customerId: customer.customerId,
  73:     technicianId: booking.technicianId ?? '',
  74:     description: `Rating Shield â€” booking ${bookingId} â€” draft: ${parsed.data.draftOverall}â˜…`,
  75:     type: 'RATING_SHIELD',
  76:     draftOverall: parsed.data.draftOverall,
  77:     ...(parsed.data.draftComment !== undefined ? { draftComment: parsed.data.draftComment } : {}),
  78:     status: 'NEW',
  79:     internalNotes: [],
  80:     slaDeadlineAt: expiresAt.toISOString(),
  81:     expiresAt: expiresAt.toISOString(),
  82:     escalated: false,
  83:     ackBreached: false,
  84:     createdAt: now.toISOString(),
  85:     updatedAt: now.toISOString(),
  86:   };
  87: 
  88:   try {
  89:     await createComplaint(doc);
  90:   } catch (err: unknown) {
  91:     if (typeof err === 'object' && err !== null && 'code' in err) {
  92:       const code = (err as { code: number }).code;
  93:       if (code === 404) return { status: 503, jsonBody: { code: 'CONTAINER_NOT_PROVISIONED' } };
  94:       if (code === 409) return { status: 409, jsonBody: { code: 'SHIELD_ALREADY_ESCALATED' } };
  95:     }
  96:     throw err;
  97:   }
  98: 
  99:   const _ts = new Date().toISOString();
 100:   void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', action: 'RATING_SHIELD_ESCALATED', resourceType: 'booking', resourceId: bookingId, payload: { bookingId, complaintId: doc.id, draftOverall: parsed.data.draftOverall }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
 101: 
 102:   sendOwnerRatingShieldAlert({
 103:     bookingId,
 104:     technicianId: booking.technicianId ?? '',
 105:     draftOverall: parsed.data.draftOverall,
 106:   }).catch((err: unknown) => ctx.error('FCM OWNER_RATING_SHIELD_ALERT failed', err));
 107: 
 108:   return { status: 201, jsonBody: { complaintId: doc.id, expiresAt: expiresAt.toISOString() } };
 109: }
 110: 
 111: app.http('escalateRating', {
 112:   methods: ['POST'],
 113:   route: 'v1/ratings/{bookingId}/escalate',
 114:   authLevel: 'anonymous',
 115:   handler: requireCustomer(escalateRatingHandler),
 116: });

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$files=@('"'customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCase.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepository.kt','customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt'); foreach("'$f in $files){ Write-Output "--- $f"; if(Test-Path $f){$i=1; Get-Content $f | ForEach-Object {'"'{0,4}: {1}' -f "'$i,$_ ; $i++}}}' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 740ms:
--- customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCase.kt
   1: package com.homeservices.customer.domain.rating
   2: 
   3: import com.homeservices.customer.data.rating.RatingRepository
   4: import com.homeservices.customer.domain.rating.model.CustomerSubScores
   5: import kotlinx.coroutines.flow.Flow
   6: import java.util.UUID
   7: import javax.inject.Inject
   8: 
   9: public class SubmitRatingUseCase
  10:     @Inject
  11:     constructor(
  12:         private val repo: RatingRepository,
  13:     ) {
  14:         public operator fun invoke(
  15:             bookingId: String,
  16:             overall: Int,
  17:             subScores: CustomerSubScores,
  18:             comment: String?,
  19:         ): Flow<Result<Unit>> {
  20:             val idempotencyKey = UUID.randomUUID().toString()
  21:             return repo.submitCustomerRating(bookingId, overall, subScores, comment, idempotencyKey)
  22:         }
  23:     }
--- customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepository.kt
   1: package com.homeservices.customer.data.rating
   2: 
   3: import com.homeservices.customer.domain.rating.model.CustomerSubScores
   4: import com.homeservices.customer.domain.rating.model.RatingSnapshot
   5: import kotlinx.coroutines.flow.Flow
   6: 
   7: public interface RatingRepository {
   8:     public fun submitCustomerRating(
   9:         bookingId: String,
  10:         overall: Int,
  11:         subScores: CustomerSubScores,
  12:         comment: String?,
  13:         idempotencyKey: String,
  14:     ): Flow<Result<Unit>>
  15: 
  16:     public fun get(bookingId: String): Flow<Result<RatingSnapshot>>
  17: }
--- customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt
   1: package com.homeservices.customer.data.rating.remote
   2: 
   3: import com.homeservices.customer.data.rating.remote.dto.EscalateRatingRequestDto
   4: import com.homeservices.customer.data.rating.remote.dto.EscalateRatingResponseDto
   5: import com.homeservices.customer.data.rating.remote.dto.GetRatingResponseDto
   6: import com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto
   7: import retrofit2.http.Body
   8: import retrofit2.http.GET
   9: import retrofit2.http.Header
  10: import retrofit2.http.POST
  11: import retrofit2.http.Path
  12: 
  13: public interface RatingApiService {
  14:     @POST("v1/ratings")
  15:     public suspend fun submit(
  16:         @Body body: SubmitRatingRequestDto,
  17:         @Header("Idempotency-Key") idempotencyKey: String,
  18:     )
  19: 
  20:     @GET("v1/ratings/{bookingId}")
  21:     public suspend fun get(
  22:         @Path("bookingId") bookingId: String,
  23:     ): GetRatingResponseDto
  24: 
  25:     @POST("v1/ratings/{bookingId}/escalate")
  26:     public suspend fun escalate(
  27:         @Path("bookingId") bookingId: String,
  28:         @Body body: EscalateRatingRequestDto,
  29:     ): EscalateRatingResponseDto
  30: }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$files=git diff --name-only 0285c8e513fcc23986ed4cefd93b7a6dd682ec24 -- customer-app/app/src/test/kotlin; foreach($f in $files){ Write-Output "--- $f"; $i=1; Get-Content $f | ForEach-Object { if($i -le 260){'"'{0,4}: {1}' -f "'$i,$_}; $i++ } }' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 669ms:
--- customer-app/app/src/test/kotlin/com/homeservices/customer/data/rating/RatingSubmitErrorMappingTest.kt
   1: package com.homeservices.customer.data.rating
   2: 
   3: import com.homeservices.customer.data.rating.remote.RatingApiService
   4: import com.homeservices.customer.domain.rating.RatingSubmitException
   5: import com.homeservices.customer.domain.rating.RatingSubmitFailure
   6: import com.homeservices.customer.domain.rating.model.CustomerSubScores
   7: import io.mockk.coEvery
   8: import io.mockk.mockk
   9: import io.mockk.unmockkAll
  10: import kotlinx.coroutines.flow.toList
  11: import kotlinx.coroutines.test.runTest
  12: import okhttp3.MediaType.Companion.toMediaType
  13: import okhttp3.ResponseBody.Companion.toResponseBody
  14: import org.assertj.core.api.Assertions.assertThat
  15: import org.junit.jupiter.api.AfterEach
  16: import org.junit.jupiter.api.Test
  17: import retrofit2.HttpException
  18: import retrofit2.Response
  19: import java.io.IOException
  20: 
  21: /**
  22:  * The rating screen used to show "Could not load rating â€” HTTP 409 Conflict" whenever a submit
  23:  * failed, because every throwable was passed through untranslated. These tests pin the mapping
  24:  * from the API's stable error codes to [RatingSubmitFailure].
  25:  */
  26: public class RatingSubmitErrorMappingTest {
  27:     private val api: RatingApiService = mockk()
  28:     private val repo = RatingRepositoryImpl(api)
  29: 
  30:     @AfterEach
  31:     public fun tearDown() {
  32:         unmockkAll()
  33:     }
  34: 
  35:     private fun httpError(
  36:         code: Int,
  37:         body: String,
  38:     ): HttpException =
  39:         HttpException(
  40:             Response.error<Unit>(code, body.toResponseBody("application/json".toMediaType())),
  41:         )
  42: 
  43:     private suspend fun submitFailure(throwable: Throwable): RatingSubmitFailure {
  44:         coEvery { api.submit(any(), any()) } throws throwable
  45:         val result =
  46:             repo.submitCustomerRating("bk-1", 5, CustomerSubScores(5, 5, 5), null, "idem-1").toList().first()
  47:         val error = result.exceptionOrNull()
  48:         assertThat(error).isInstanceOf(RatingSubmitException::class.java)
  49:         return (error as RatingSubmitException).failure
  50:     }
  51: 
  52:     @Test
  53:     public fun `409 NO_TECHNICIAN maps to NoTechnician`(): Unit =
  54:         runTest {
  55:             assertThat(submitFailure(httpError(409, """{"code":"NO_TECHNICIAN"}""")))
  56:                 .isEqualTo(RatingSubmitFailure.NoTechnician)
  57:         }
  58: 
  59:     @Test
  60:     public fun `409 RATING_ALREADY_SUBMITTED maps to AlreadySubmitted`(): Unit =
  61:         runTest {
  62:             assertThat(submitFailure(httpError(409, """{"code":"RATING_ALREADY_SUBMITTED"}""")))
  63:                 .isEqualTo(RatingSubmitFailure.AlreadySubmitted)
  64:         }
  65: 
  66:     @Test
  67:     public fun `409 BOOKING_NOT_CLOSED maps to BookingNotClosed`(): Unit =
  68:         runTest {
  69:             assertThat(submitFailure(httpError(409, """{"code":"BOOKING_NOT_CLOSED","status":"REACHED"}""")))
  70:                 .isEqualTo(RatingSubmitFailure.BookingNotClosed)
  71:         }
  72: 
  73:     @Test
  74:     public fun `403 FORBIDDEN maps to NotAvailable`(): Unit =
  75:         runTest {
  76:             assertThat(submitFailure(httpError(403, """{"code":"FORBIDDEN"}""")))
  77:                 .isEqualTo(RatingSubmitFailure.NotAvailable)
  78:         }
  79: 
  80:     @Test
  81:     public fun `404 BOOKING_NOT_FOUND maps to NotAvailable`(): Unit =
  82:         runTest {
  83:             assertThat(submitFailure(httpError(404, """{"code":"BOOKING_NOT_FOUND"}""")))
  84:                 .isEqualTo(RatingSubmitFailure.NotAvailable)
  85:         }
  86: 
  87:     @Test
  88:     public fun `IO failure maps to retryable Network`(): Unit =
  89:         runTest {
  90:             val failure = submitFailure(IOException("Unable to resolve host"))
  91:             assertThat(failure).isEqualTo(RatingSubmitFailure.Network)
  92:             assertThat(failure.retryable).isTrue()
  93:         }
  94: 
  95:     @Test
  96:     public fun `500 maps to retryable Unknown`(): Unit =
  97:         runTest {
  98:             val failure = submitFailure(httpError(500, """{"code":"INTERNAL"}"""))
  99:             assertThat(failure).isEqualTo(RatingSubmitFailure.Unknown)
 100:             assertThat(failure.retryable).isTrue()
 101:         }
 102: 
 103:     @Test
 104:     public fun `409 with an unrecognised code maps to Unknown rather than crashing`(): Unit =
 105:         runTest {
 106:             assertThat(submitFailure(httpError(409, """{"code":"SOMETHING_NEW"}""")))
 107:                 .isEqualTo(RatingSubmitFailure.Unknown)
 108:         }
 109: 
 110:     @Test
 111:     public fun `409 with a non-JSON body maps to Unknown rather than crashing`(): Unit =
 112:         runTest {
 113:             assertThat(submitFailure(httpError(409, "<html>gateway</html>")))
 114:                 .isEqualTo(RatingSubmitFailure.Unknown)
 115:         }
 116: 
 117:     @Test
 118:     public fun `terminal failures are not marked retryable`() {
 119:         assertThat(RatingSubmitFailure.NoTechnician.retryable).isFalse()
 120:         assertThat(RatingSubmitFailure.BookingNotClosed.retryable).isFalse()
 121:         assertThat(RatingSubmitFailure.NotAvailable.retryable).isFalse()
 122:     }
 123: }
--- customer-app/app/src/test/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCaseTest.kt
   1: package com.homeservices.customer.domain.rating
   2: 
   3: import com.homeservices.customer.data.rating.remote.RatingApiService
   4: import com.homeservices.customer.data.rating.remote.dto.EscalateRatingRequestDto
   5: import com.homeservices.customer.data.rating.remote.dto.EscalateRatingResponseDto
   6: import io.mockk.coEvery
   7: import io.mockk.mockk
   8: import kotlinx.coroutines.test.runTest
   9: import okhttp3.MediaType.Companion.toMediaType
  10: import okhttp3.ResponseBody.Companion.toResponseBody
  11: import org.assertj.core.api.Assertions.assertThat
  12: import org.junit.jupiter.api.Test
  13: import retrofit2.HttpException
  14: import retrofit2.Response
  15: import java.time.Instant
  16: 
  17: public class EscalateRatingUseCaseTest {
  18:     private val apiService: RatingApiService = mockk()
  19:     private val useCase = EscalateRatingUseCase(apiService)
  20: 
  21:     @Test
  22:     public fun `returns EscalateRatingResult with parsed epoch millis on success`(): Unit =
  23:         runTest {
  24:             val isoExpiry = "2026-04-25T14:00:00.000Z"
  25:             coEvery {
  26:                 apiService.escalate("bk-1", EscalateRatingRequestDto(2, null))
  27:             } returns EscalateRatingResponseDto("complaint-abc", isoExpiry)
  28: 
  29:             val result = useCase.invoke("bk-1", 2, null)
  30: 
  31:             assertThat(result.isSuccess).isTrue()
  32:             assertThat(result.getOrNull()?.complaintId).isEqualTo("complaint-abc")
  33:             assertThat(result.getOrNull()?.expiresAtMs)
  34:                 .isEqualTo(Instant.parse(isoExpiry).toEpochMilli())
  35:         }
  36: 
  37:     @Test
  38:     public fun `passes draftComment when provided`(): Unit =
  39:         runTest {
  40:             coEvery {
  41:                 apiService.escalate("bk-1", EscalateRatingRequestDto(1, "rude technician"))
  42:             } returns EscalateRatingResponseDto("complaint-xyz", "2026-04-25T14:00:00.000Z")
  43: 
  44:             val result = useCase.invoke("bk-1", 1, "rude technician")
  45: 
  46:             assertThat(result.isSuccess).isTrue()
  47:         }
  48: 
  49:     @Test
  50:     public fun `wraps network error in a mapped failure that keeps the cause`(): Unit =
  51:         runTest {
  52:             coEvery { apiService.escalate(any(), any()) } throws RuntimeException("timeout")
  53: 
  54:             val result = useCase.invoke("bk-1", 2, null)
  55: 
  56:             assertThat(result.isFailure).isTrue()
  57:             val error = result.exceptionOrNull()
  58:             assertThat(error).isInstanceOf(RatingSubmitException::class.java)
  59:             assertThat((error as RatingSubmitException).failure).isEqualTo(RatingSubmitFailure.Unknown)
  60:             assertThat(error.cause?.message).contains("timeout")
  61:         }
  62: 
  63:     @Test
  64:     public fun `maps an API rejection to its specific reason so the sheet can name it`(): Unit =
  65:         runTest {
  66:             coEvery { apiService.escalate(any(), any()) } throws
  67:                 HttpException(
  68:                     Response.error<Unit>(
  69:                         409,
  70:                         """{"code":"NO_TECHNICIAN"}""".toResponseBody("application/json".toMediaType()),
  71:                     ),
  72:                 )
  73: 
  74:             val result = useCase.invoke("bk-1", 2, null)
  75: 
  76:             val error = result.exceptionOrNull() as RatingSubmitException
  77:             assertThat(error.failure).isEqualTo(RatingSubmitFailure.NoTechnician)
  78:             assertThat(error.failure.retryable).isFalse()
  79:         }
  80: }
--- customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingScreenPaparazziTest.kt
   1: package com.homeservices.customer.ui.rating
   2: 
   3: import app.cash.paparazzi.DeviceConfig
   4: import app.cash.paparazzi.Paparazzi
   5: import com.homeservices.designsystem.theme.HomeservicesTheme
   6: import org.junit.Ignore
   7: import org.junit.Rule
   8: import org.junit.Test
   9: 
  10: @Ignore("Re-record on CI Linux via workflow_dispatch paparazzi-record.yml after sprint2a merge")
  11: public class RatingScreenPaparazziTest {
  12:     @get:Rule
  13:     public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)
  14: 
  15:     @Test
  16:     public fun ratingEditingReadyToSubmit(): Unit {
  17:         paparazzi.snapshot {
  18:             HomeservicesTheme(darkTheme = false) {
  19:                 RatingContent(
  20:                     state = RatingUiState.Editing(null),
  21:                     shieldState = RatingShieldState.Idle,
  22:                     overall = 5,
  23:                     punctuality = 4,
  24:                     skill = 5,
  25:                     behaviour = 5,
  26:                     comment = "Professional and quick.",
  27:                     canSubmit = true,
  28:                     submitError = null,
  29:                     onOverallChange = {},
  30:                     onPunctualityChange = {},
  31:                     onSkillChange = {},
  32:                     onBehaviourChange = {},
  33:                     onCommentChange = {},
  34:                     onSubmit = {},
  35:                     onPostAnyway = {},
  36:                     onBack = {},
  37:                 )
  38:             }
  39:         }
  40:     }
  41: }
--- customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingShieldHindiPaparazziTest.kt
   1: package com.homeservices.customer.ui.rating
   2: 
   3: import app.cash.paparazzi.DeviceConfig
   4: import app.cash.paparazzi.Paparazzi
   5: import com.homeservices.designsystem.theme.HomeservicesTheme
   6: import org.junit.Ignore
   7: import org.junit.Rule
   8: import org.junit.Test
   9: 
  10: // Record goldens on CI: trigger paparazzi-record.yml workflow_dispatch after push
  11: // Per docs/patterns/paparazzi-cross-os-goldens.md â€” never record on Windows.
  12: @Ignore("Re-record on CI Linux via workflow_dispatch paparazzi-record.yml after sprint2a merge")
  13: public class RatingShieldHindiPaparazziTest {
  14:     @get:Rule
  15:     public val paparazzi: Paparazzi =
  16:         Paparazzi(
  17:             deviceConfig = DeviceConfig.PIXEL_5.copy(locale = "hi"),
  18:             theme = "android:Theme.Material3.DayNight.NoActionBar",
  19:         )
  20: 
  21:     @Ignore("Record goldens on CI via paparazzi-record.yml workflow_dispatch")
  22:     @Test
  23:     public fun shieldBottomSheet_hindiLocale() {
  24:         paparazzi.snapshot {
  25:             HomeservicesTheme {
  26:                 // ShieldBottomSheet is rendered within RatingContent when shieldState == ShowDialog
  27:                 RatingContent(
  28:                     state = RatingUiState.Editing(null),
  29:                     shieldState = RatingShieldState.ShowDialog,
  30:                     overall = 2,
  31:                     punctuality = 2,
  32:                     skill = 2,
  33:                     behaviour = 2,
  34:                     comment = "",
  35:                     canSubmit = true,
  36:                     submitError = null,
  37:                     onOverallChange = {},
  38:                     onPunctualityChange = {},
  39:                     onSkillChange = {},
  40:                     onBehaviourChange = {},
  41:                     onCommentChange = {},
  42:                     onSubmit = {},
  43:                     onPostAnyway = {},
  44:                     onBack = {},
  45:                 )
  46:             }
  47:         }
  48:     }
  49: }
--- customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelShieldTest.kt
   1: package com.homeservices.customer.ui.rating
   2: 
   3: import androidx.lifecycle.SavedStateHandle
   4: import com.homeservices.customer.domain.rating.EscalateRatingResult
   5: import com.homeservices.customer.domain.rating.EscalateRatingUseCase
   6: import com.homeservices.customer.domain.rating.GetRatingUseCase
   7: import com.homeservices.customer.domain.rating.RatingSubmitFailure
   8: import com.homeservices.customer.domain.rating.SubmitRatingUseCase
   9: import com.homeservices.customer.domain.rating.model.CustomerSubScores
  10: import com.homeservices.customer.domain.rating.model.RatingSnapshot
  11: import com.homeservices.customer.domain.rating.model.SideState
  12: import com.homeservices.customer.observability.analytics.NoOpAnalyticsFacade
  13: import io.mockk.coEvery
  14: import io.mockk.coVerify
  15: import io.mockk.mockk
  16: import kotlinx.coroutines.Dispatchers
  17: import kotlinx.coroutines.ExperimentalCoroutinesApi
  18: import kotlinx.coroutines.flow.flowOf
  19: import kotlinx.coroutines.test.StandardTestDispatcher
  20: import kotlinx.coroutines.test.TestScope
  21: import kotlinx.coroutines.test.resetMain
  22: import kotlinx.coroutines.test.runCurrent
  23: import kotlinx.coroutines.test.runTest
  24: import kotlinx.coroutines.test.setMain
  25: import org.assertj.core.api.Assertions.assertThat
  26: import org.junit.jupiter.api.AfterEach
  27: import org.junit.jupiter.api.BeforeEach
  28: import org.junit.jupiter.api.Test
  29: 
  30: @OptIn(ExperimentalCoroutinesApi::class)
  31: public class RatingViewModelShieldTest {
  32:     private val submit: SubmitRatingUseCase = mockk()
  33:     private val get: GetRatingUseCase = mockk()
  34:     private val escalate: EscalateRatingUseCase = mockk()
  35:     private val savedState = SavedStateHandle(mapOf("bookingId" to "bk-1"))
  36: 
  37:     @BeforeEach
  38:     public fun setUp() {
  39:         // StandardTestDispatcher: delays do NOT auto-advance â€” prevents startCountdown's
  40:         // delay from firing before assertions on RatingShieldState.Escalated.
  41:         Dispatchers.setMain(StandardTestDispatcher())
  42:         coEvery { get.invoke("bk-1") } returns
  43:             flowOf(
  44:                 Result.success(
  45:                     RatingSnapshot("bk-1", RatingSnapshot.Status.PENDING, null, SideState.Pending, SideState.Pending),
  46:                 ),
  47:             )
  48:     }
  49: 
  50:     @AfterEach
  51:     public fun tearDown() {
  52:         Dispatchers.resetMain()
  53:     }
  54: 
  55:     private fun TestScope.vm(): RatingViewModel {
  56:         val v = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
  57:         runCurrent() // drive init coroutine (collects PENDING snapshot)
  58:         return v
  59:     }
  60: 
  61:     @Test
  62:     public fun `submit with overall le 2 sets ShowDialog without calling API`(): Unit =
  63:         runTest {
  64:             val v = vm()
  65:             v.setOverall(2)
  66:             v.setPunctuality(5)
  67:             v.setSkill(5)
  68:             v.setBehaviour(5)
  69:             v.submit()
  70:             assertThat(v.shieldState.value).isEqualTo(RatingShieldState.ShowDialog)
  71:             coVerify(exactly = 0) { submit.invoke(any(), any(), any(), any()) }
  72:         }
  73: 
  74:     @Test
  75:     public fun `submit with overall ge 3 calls API directly without showing dialog`(): Unit =
  76:         runTest {
  77:             coEvery { submit.invoke("bk-1", 3, CustomerSubScores(5, 5, 5), null) } returns
  78:                 flowOf(Result.success(Unit))
  79:             val v = vm()
  80:             v.setOverall(3)
  81:             v.setPunctuality(5)
  82:             v.setSkill(5)
  83:             v.setBehaviour(5)
  84:             v.submit()
  85:             runCurrent() // drive doSubmit coroutine
  86:             assertThat(v.shieldState.value).isEqualTo(RatingShieldState.Idle)
  87:             coVerify(exactly = 1) { submit.invoke("bk-1", 3, CustomerSubScores(5, 5, 5), null) }
  88:         }
  89: 
  90:     @Test
  91:     public fun `onSkipShield resets to Idle and calls submit API`(): Unit =
  92:         runTest {
  93:             coEvery { submit.invoke("bk-1", 1, CustomerSubScores(5, 5, 5), null) } returns
  94:                 flowOf(Result.success(Unit))
  95:             val v = vm()
  96:             v.setOverall(1)
  97:             v.setPunctuality(5)
  98:             v.setSkill(5)
  99:             v.setBehaviour(5)
 100:             v.submit() // â†’ ShowDialog (no coroutine)
 101:             v.onSkipShield()
 102:             runCurrent() // drive doSubmit
 103:             assertThat(v.shieldState.value).isEqualTo(RatingShieldState.Idle)
 104:             coVerify(exactly = 1) { submit.invoke("bk-1", 1, CustomerSubScores(5, 5, 5), null) }
 105:         }
 106: 
 107:     @Test
 108:     public fun `onEscalate calls use case and sets Escalated on success`(): Unit =
 109:         runTest {
 110:             val expiresAtMs = System.currentTimeMillis() + 2 * 60 * 60 * 1000
 111:             coEvery { escalate.invoke("bk-1", 2, null) } returns
 112:                 Result.success(EscalateRatingResult("c-1", expiresAtMs))
 113:             // runTest drains all coroutines at cleanup (advanceUntilIdle) â€” stub submit so the
 114:             // countdown auto-fire at cleanup doesn't throw MockKException.
 115:             coEvery { submit.invoke(any(), any(), any(), any()) } returns flowOf(Result.success(Unit))
 116:             val v = vm()
 117:             v.setOverall(2)
 118:             v.setPunctuality(5)
 119:             v.setSkill(5)
 120:             v.setBehaviour(5)
 121:             v.submit() // â†’ ShowDialog
 122:             v.onEscalate()
 123:             runCurrent() // drives onEscalate â†’ Escalated, countdown suspended at delay(remaining)
 124:             assertThat(v.shieldState.value).isInstanceOf(RatingShieldState.Escalated::class.java)
 125:             assertThat((v.shieldState.value as RatingShieldState.Escalated).expiresAtMs).isEqualTo(expiresAtMs)
 126:         }
 127: 
 128:     @Test
 129:     public fun `onEscalate failure reopens the dialog and reports why, without losing the form`(): Unit =
 130:         runTest {
 131:             coEvery { escalate.invoke("bk-1", 2, null) } returns Result.failure(RuntimeException("network"))
 132:             val v = vm()
 133:             v.setOverall(2)
 134:             v.setPunctuality(5)
 135:             v.setSkill(5)
 136:             v.setBehaviour(5)
 137:             v.submit()
 138:             v.onEscalate()
 139:             runCurrent()
 140:             assertThat(v.shieldState.value).isEqualTo(RatingShieldState.ShowDialog) // allows retry
 141:             assertThat(v.uiState.value).isNotInstanceOf(RatingUiState.Error::class.java)
 142:             assertThat(v.submitError.value).isEqualTo(RatingSubmitFailure.Unknown)
 143:             assertThat(v.overall.value).isEqualTo(2)
 144:         }
 145: 
 146:     @Test
 147:     public fun `second submit after Escalated state posts API without reshowing dialog`(): Unit =
 148:         runTest {
 149:             val expiresAtMs = System.currentTimeMillis() + 2 * 60 * 60 * 1000
 150:             coEvery { escalate.invoke("bk-1", 2, null) } returns
 151:                 Result.success(EscalateRatingResult("c-1", expiresAtMs))
 152:             coEvery { submit.invoke("bk-1", 2, CustomerSubScores(5, 5, 5), null) } returns
 153:                 flowOf(Result.success(Unit))
 154:             val v = vm()
 155:             v.setOverall(2)
 156:             v.setPunctuality(5)
 157:             v.setSkill(5)
 158:             v.setBehaviour(5)
 159:             v.submit() // â†’ ShowDialog
 160:             v.onEscalate()
 161:             runCurrent() // â†’ Escalated, countdown suspended at delay
 162:             v.submit() // shieldState != Idle â†’ straight to doSubmit
 163:             runCurrent() // drive doSubmit
 164:             assertThat(v.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
 165:         }
 166: }
--- customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelSubmitErrorTest.kt
   1: package com.homeservices.customer.ui.rating
   2: 
   3: import androidx.lifecycle.SavedStateHandle
   4: import com.homeservices.customer.domain.rating.EscalateRatingResult
   5: import com.homeservices.customer.domain.rating.EscalateRatingUseCase
   6: import com.homeservices.customer.domain.rating.GetRatingUseCase
   7: import com.homeservices.customer.domain.rating.RatingSubmitException
   8: import com.homeservices.customer.domain.rating.RatingSubmitFailure
   9: import com.homeservices.customer.domain.rating.SubmitRatingUseCase
  10: import com.homeservices.customer.domain.rating.model.CustomerSubScores
  11: import com.homeservices.customer.domain.rating.model.RatingSnapshot
  12: import com.homeservices.customer.domain.rating.model.SideState
  13: import com.homeservices.customer.observability.analytics.NoOpAnalyticsFacade
  14: import io.mockk.coEvery
  15: import io.mockk.coVerify
  16: import io.mockk.mockk
  17: import kotlinx.coroutines.Dispatchers
  18: import kotlinx.coroutines.ExperimentalCoroutinesApi
  19: import kotlinx.coroutines.flow.flowOf
  20: import kotlinx.coroutines.test.UnconfinedTestDispatcher
  21: import kotlinx.coroutines.test.resetMain
  22: import kotlinx.coroutines.test.runTest
  23: import kotlinx.coroutines.test.setMain
  24: import org.assertj.core.api.Assertions.assertThat
  25: import org.junit.jupiter.api.AfterEach
  26: import org.junit.jupiter.api.BeforeEach
  27: import org.junit.jupiter.api.Test
  28: 
  29: /**
  30:  * A failed submit used to replace the whole screen with `RatingUiState.Error`, which rendered under
  31:  * `rating_error_title` ("Could not load rating") and threw away the stars and comment the customer
  32:  * had just entered. These tests pin the corrected behaviour: the form survives, and the reason is
  33:  * reported separately from a load failure.
  34:  */
  35: @OptIn(ExperimentalCoroutinesApi::class)
  36: public class RatingViewModelSubmitErrorTest {
  37:     private val submit: SubmitRatingUseCase = mockk()
  38:     private val get: GetRatingUseCase = mockk()
  39:     private val escalate: EscalateRatingUseCase = mockk()
  40:     private val savedState = SavedStateHandle(mapOf("bookingId" to "bk-1"))
  41: 
  42:     private val snapshot =
  43:         RatingSnapshot("bk-1", RatingSnapshot.Status.PENDING, null, SideState.Pending, SideState.Pending)
  44: 
  45:     @BeforeEach
  46:     public fun setUp() {
  47:         Dispatchers.setMain(UnconfinedTestDispatcher())
  48:     }
  49: 
  50:     @AfterEach
  51:     public fun tearDown() {
  52:         Dispatchers.resetMain()
  53:     }
  54: 
  55:     private fun viewModel(): RatingViewModel {
  56:         coEvery { get.invoke("bk-1") } returns flowOf(Result.success(snapshot))
  57:         return RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
  58:     }
  59: 
  60:     private fun RatingViewModel.fillForm() {
  61:         setOverall(4)
  62:         setPunctuality(4)
  63:         setSkill(5)
  64:         setBehaviour(3)
  65:         setComment("came on time")
  66:     }
  67: 
  68:     private fun failWith(failure: RatingSubmitFailure) {
  69:         coEvery { submit.invoke(any(), any(), any(), any()) } returns
  70:             flowOf(Result.failure(RatingSubmitException(failure)))
  71:     }
  72: 
  73:     @Test
  74:     public fun `a failed submit keeps the form and its answers instead of showing a load error`(): Unit =
  75:         runTest {
  76:             val vm = viewModel()
  77:             vm.fillForm()
  78:             failWith(RatingSubmitFailure.NoTechnician)
  79: 
  80:             vm.submit()
  81: 
  82:             assertThat(vm.uiState.value).isInstanceOf(RatingUiState.Editing::class.java)
  83:             assertThat(vm.overall.value).isEqualTo(4)
  84:             assertThat(vm.punctuality.value).isEqualTo(4)
  85:             assertThat(vm.skill.value).isEqualTo(5)
  86:             assertThat(vm.behaviour.value).isEqualTo(3)
  87:             assertThat(vm.comment.value).isEqualTo("came on time")
  88:         }
  89: 
  90:     @Test
  91:     public fun `a failed submit reports the reason it failed`(): Unit =
  92:         runTest {
  93:             val vm = viewModel()
  94:             vm.fillForm()
  95:             failWith(RatingSubmitFailure.NoTechnician)
  96: 
  97:             vm.submit()
  98: 
  99:             assertThat(vm.submitError.value).isEqualTo(RatingSubmitFailure.NoTechnician)
 100:         }
 101: 
 102:     @Test
 103:     public fun `a transport failure is reported as retryable`(): Unit =
 104:         runTest {
 105:             val vm = viewModel()
 106:             vm.fillForm()
 107:             failWith(RatingSubmitFailure.Network)
 108: 
 109:             vm.submit()
 110: 
 111:             assertThat(vm.submitError.value?.retryable).isTrue()
 112:             assertThat(vm.canSubmit.value).isTrue()
 113:         }
 114: 
 115:     @Test
 116:     public fun `an unmapped throwable is reported as Unknown rather than leaking its message`(): Unit =
 117:         runTest {
 118:             val vm = viewModel()
 119:             vm.fillForm()
 120:             coEvery { submit.invoke(any(), any(), any(), any()) } returns
 121:                 flowOf(Result.failure(IllegalStateException("HTTP 500 Internal Server Error")))
 122: 
 123:             vm.submit()
 124: 
 125:             assertThat(vm.submitError.value).isEqualTo(RatingSubmitFailure.Unknown)
 126:             assertThat(vm.uiState.value).isInstanceOf(RatingUiState.Editing::class.java)
 127:         }
 128: 
 129:     @Test
 130:     public fun `a rating already recorded on the server moves the screen on rather than erroring`(): Unit =
 131:         runTest {
 132:             val vm = viewModel()
 133:             vm.fillForm()
 134:             failWith(RatingSubmitFailure.AlreadySubmitted)
 135: 
 136:             vm.submit()
 137: 
 138:             assertThat(vm.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
 139:             assertThat(vm.submitError.value).isNull()
 140:         }
 141: 
 142:     @Test
 143:     public fun `retrying clears the previous error`(): Unit =
 144:         runTest {
 145:             val vm = viewModel()
 146:             vm.fillForm()
 147:             failWith(RatingSubmitFailure.Network)
 148:             vm.submit()
 149:             assertThat(vm.submitError.value).isEqualTo(RatingSubmitFailure.Network)
 150: 
 151:             coEvery { submit.invoke(any(), any(), any(), any()) } returns flowOf(Result.success(Unit))
 152:             vm.submit()
 153: 
 154:             assertThat(vm.submitError.value).isNull()
 155:             assertThat(vm.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
 156:         }
 157: 
 158:     @Test
 159:     public fun `a load failure still shows the screen-level error`(): Unit =
 160:         runTest {
 161:             coEvery { get.invoke("bk-1") } returns flowOf(Result.failure(RuntimeException("timeout")))
 162:             val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
 163: 
 164:             assertThat(vm.uiState.value).isInstanceOf(RatingUiState.Error::class.java)
 165:             assertThat(vm.submitError.value).isNull()
 166:         }
 167: 
 168:     @Test
 169:     public fun `after a failed post-anyway, a retry sends the edited rating and not the shield draft`(): Unit =
 170:         runTest {
 171:             val vm = viewModel()
 172:             vm.setOverall(1)
 173:             vm.setPunctuality(1)
 174:             vm.setSkill(1)
 175:             vm.setBehaviour(1)
 176:             coEvery { escalate.invoke("bk-1", 1, null) } returns
 177:                 Result.success(EscalateRatingResult("c-1", System.currentTimeMillis() + 60_000))
 178:             vm.submit() // low rating â†’ shield dialog
 179:             vm.onEscalate() // captures the 1-star draft
 180:             failWith(RatingSubmitFailure.Network)
 181:             vm.onPostAnyway() // fails, form comes back
 182: 
 183:             // Customer reconsiders and raises every score before retrying.
 184:             vm.setOverall(5)
 185:             vm.setPunctuality(5)
 186:             vm.setSkill(5)
 187:             vm.setBehaviour(5)
 188:             coEvery { submit.invoke(any(), any(), any(), any()) } returns flowOf(Result.success(Unit))
 189:             vm.submit()
 190: 
 191:             coVerify { submit.invoke("bk-1", 5, CustomerSubScores(5, 5, 5), null) }
 192:         }
 193: 
 194:     @Test
 195:     public fun `a mapped escalation failure keeps its specific reason`(): Unit =
 196:         runTest {
 197:             val vm = viewModel()
 198:             vm.setOverall(2)
 199:             vm.setPunctuality(5)
 200:             vm.setSkill(5)
 201:             vm.setBehaviour(5)
 202:             coEvery { escalate.invoke("bk-1", 2, null) } returns
 203:                 Result.failure(RatingSubmitException(RatingSubmitFailure.NoTechnician))
 204:             vm.submit()
 205:             vm.onEscalate()
 206: 
 207:             assertThat(vm.submitError.value).isEqualTo(RatingSubmitFailure.NoTechnician)
 208:             assertThat(vm.uiState.value).isNotInstanceOf(RatingUiState.Error::class.java)
 209:         }
 210: 
 211:     @Test
 212:     public fun `a successful escalation retry clears the earlier failure message`(): Unit =
 213:         runTest {
 214:             val vm = viewModel()
 215:             vm.setOverall(2)
 216:             vm.setPunctuality(5)
 217:             vm.setSkill(5)
 218:             vm.setBehaviour(5)
 219:             coEvery { escalate.invoke("bk-1", 2, null) } returns
 220:                 Result.failure(RatingSubmitException(RatingSubmitFailure.Network))
 221:             vm.submit()
 222:             vm.onEscalate()
 223:             assertThat(vm.submitError.value).isEqualTo(RatingSubmitFailure.Network)
 224: 
 225:             coEvery { escalate.invoke("bk-1", 2, null) } returns
 226:                 Result.success(EscalateRatingResult("c-1", System.currentTimeMillis() + 60_000))
 227:             // The countdown auto-posts once runTest drains its virtual clock; stub it so this test
 228:             // only observes the state right after escalation succeeds.
 229:             coEvery { submit.invoke(any(), any(), any(), any()) } returns flowOf(Result.success(Unit))
 230:             vm.onEscalate()
 231: 
 232:             assertThat(vm.submitError.value).isNull()
 233:             assertThat(vm.shieldState.value).isInstanceOf(RatingShieldState.Escalated::class.java)
 234:         }
 235: }
--- customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelTest.kt
   1: package com.homeservices.customer.ui.rating
   2: 
   3: import androidx.lifecycle.SavedStateHandle
   4: import com.homeservices.customer.domain.rating.EscalateRatingUseCase
   5: import com.homeservices.customer.domain.rating.GetRatingUseCase
   6: import com.homeservices.customer.domain.rating.RatingSubmitFailure
   7: import com.homeservices.customer.domain.rating.SubmitRatingUseCase
   8: import com.homeservices.customer.domain.rating.model.CustomerSubScores
   9: import com.homeservices.customer.domain.rating.model.RatingSnapshot
  10: import com.homeservices.customer.domain.rating.model.SideState
  11: import com.homeservices.customer.observability.analytics.NoOpAnalyticsFacade
  12: import io.mockk.coEvery
  13: import io.mockk.mockk
  14: import kotlinx.coroutines.Dispatchers
  15: import kotlinx.coroutines.ExperimentalCoroutinesApi
  16: import kotlinx.coroutines.flow.flowOf
  17: import kotlinx.coroutines.test.UnconfinedTestDispatcher
  18: import kotlinx.coroutines.test.resetMain
  19: import kotlinx.coroutines.test.runTest
  20: import kotlinx.coroutines.test.setMain
  21: import org.assertj.core.api.Assertions.assertThat
  22: import org.junit.jupiter.api.AfterEach
  23: import org.junit.jupiter.api.BeforeEach
  24: import org.junit.jupiter.api.Test
  25: 
  26: @OptIn(ExperimentalCoroutinesApi::class)
  27: public class RatingViewModelTest {
  28:     private val submit: SubmitRatingUseCase = mockk()
  29:     private val get: GetRatingUseCase = mockk()
  30:     private val escalate: EscalateRatingUseCase = mockk()
  31:     private val savedState = SavedStateHandle(mapOf("bookingId" to "bk-1"))
  32: 
  33:     @BeforeEach
  34:     public fun setUp() {
  35:         Dispatchers.setMain(UnconfinedTestDispatcher())
  36:     }
  37: 
  38:     @AfterEach
  39:     public fun tearDown() {
  40:         Dispatchers.resetMain()
  41:     }
  42: 
  43:     @Test
  44:     public fun `submit is disabled until overall and all sub-scores are non-zero`(): Unit =
  45:         runTest {
  46:             coEvery { get.invoke("bk-1") } returns
  47:                 flowOf(
  48:                     Result.success(
  49:                         RatingSnapshot(
  50:                             "bk-1",
  51:                             RatingSnapshot.Status.PENDING,
  52:                             null,
  53:                             SideState.Pending,
  54:                             SideState.Pending,
  55:                         ),
  56:                     ),
  57:                 )
  58:             val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
  59:             assertThat(vm.canSubmit.value).isFalse()
  60:             vm.setOverall(5)
  61:             assertThat(vm.canSubmit.value).isFalse()
  62:             vm.setPunctuality(5)
  63:             vm.setSkill(5)
  64:             assertThat(vm.canSubmit.value).isFalse()
  65:             vm.setBehaviour(5)
  66:             assertThat(vm.canSubmit.value).isTrue()
  67:         }
  68: 
  69:     @Test
  70:     public fun `successful submit transitions to AwaitingPartner state`(): Unit =
  71:         runTest {
  72:             coEvery { get.invoke("bk-1") } returns
  73:                 flowOf(
  74:                     Result.success(
  75:                         RatingSnapshot(
  76:                             "bk-1",
  77:                             RatingSnapshot.Status.PENDING,
  78:                             null,
  79:                             SideState.Pending,
  80:                             SideState.Pending,
  81:                         ),
  82:                     ),
  83:                 )
  84:             coEvery {
  85:                 submit.invoke("bk-1", 5, CustomerSubScores(5, 5, 5), null)
  86:             } returns flowOf(Result.success(Unit))
  87: 
  88:             val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
  89:             vm.setOverall(5)
  90:             vm.setPunctuality(5)
  91:             vm.setSkill(5)
  92:             vm.setBehaviour(5)
  93:             vm.submit()
  94: 
  95:             assertThat(vm.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
  96:         }
  97: 
  98:     @Test
  99:     public fun `transitions to Revealed when snapshot status is REVEALED`(): Unit =
 100:         runTest {
 101:             val snapshot =
 102:                 RatingSnapshot(
 103:                     "bk-1",
 104:                     RatingSnapshot.Status.REVEALED,
 105:                     "2026-04-24T12:30:00.000Z",
 106:                     SideState.Pending,
 107:                     SideState.Pending,
 108:                 )
 109:             coEvery { get.invoke("bk-1") } returns flowOf(Result.success(snapshot))
 110: 
 111:             val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
 112: 
 113:             assertThat(vm.uiState.value).isInstanceOf(RatingUiState.Revealed::class.java)
 114:         }
 115: 
 116:     @Test
 117:     public fun `transitions to AwaitingPartner when customer side already submitted (P2 fix)`(): Unit =
 118:         runTest {
 119:             val customerRating =
 120:                 com.homeservices.customer.domain.rating.model.CustomerRating(
 121:                     overall = 5,
 122:                     subScores =
 123:                         com.homeservices.customer.domain.rating.model
 124:                             .CustomerSubScores(5, 5, 5),
 125:                     comment = null,
 126:                     submittedAt = "2026-04-24T12:00:00.000Z",
 127:                 )
 128:             val snapshot =
 129:                 RatingSnapshot(
 130:                     "bk-1",
 131:                     RatingSnapshot.Status.PARTIALLY_SUBMITTED,
 132:                     null,
 133:                     SideState.Submitted(customerRating),
 134:                     SideState.Pending,
 135:                 )
 136:             coEvery { get.invoke("bk-1") } returns flowOf(Result.success(snapshot))
 137: 
 138:             val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
 139: 
 140:             assertThat(vm.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
 141:         }
 142: 
 143:     @Test
 144:     public fun `transitions to Error when getUseCase fails`(): Unit =
 145:         runTest {
 146:             coEvery { get.invoke("bk-1") } returns
 147:                 flowOf(Result.failure(RuntimeException("load failed")))
 148: 
 149:             val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
 150: 
 151:             assertThat(vm.uiState.value).isInstanceOf(RatingUiState.Error::class.java)
 152:         }
 153: 
 154:     @Test
 155:     public fun `submit does nothing when canSubmit is false`(): Unit =
 156:         runTest {
 157:             coEvery { get.invoke("bk-1") } returns
 158:                 flowOf(
 159:                     Result.success(
 160:                         RatingSnapshot("bk-1", RatingSnapshot.Status.PENDING, null, SideState.Pending, SideState.Pending),
 161:                     ),
 162:                 )
 163:             val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
 164:             vm.submit()
 165:             assertThat(vm.uiState.value).isNotInstanceOf(RatingUiState.Submitting::class.java)
 166:         }
 167: 
 168:     @Test
 169:     public fun `failed submit keeps the form and reports why`(): Unit =
 170:         runTest {
 171:             coEvery { get.invoke("bk-1") } returns
 172:                 flowOf(
 173:                     Result.success(
 174:                         RatingSnapshot("bk-1", RatingSnapshot.Status.PENDING, null, SideState.Pending, SideState.Pending),
 175:                     ),
 176:                 )
 177:             coEvery {
 178:                 submit.invoke("bk-1", 5, CustomerSubScores(5, 5, 5), null)
 179:             } returns flowOf(Result.failure(RuntimeException("network error")))
 180: 
 181:             val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
 182:             vm.setOverall(5)
 183:             vm.setPunctuality(5)
 184:             vm.setSkill(5)
 185:             vm.setBehaviour(5)
 186:             vm.submit()
 187: 
 188:             // The screen-level Error state is reserved for a failed *load*; a failed submit must
 189:             // leave the customer's answers on screen with a reason they can act on.
 190:             assertThat(vm.uiState.value).isInstanceOf(RatingUiState.Editing::class.java)
 191:             assertThat(vm.submitError.value).isEqualTo(RatingSubmitFailure.Unknown)
 192:             assertThat(vm.overall.value).isEqualTo(5)
 193:         }
 194: 
 195:     @Test
 196:     public fun `setComment truncates to 500 chars`(): Unit =
 197:         runTest {
 198:             coEvery { get.invoke("bk-1") } returns
 199:                 flowOf(
 200:                     Result.success(
 201:                         RatingSnapshot("bk-1", RatingSnapshot.Status.PENDING, null, SideState.Pending, SideState.Pending),
 202:                     ),
 203:                 )
 204:             val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
 205:             vm.setComment("a".repeat(600))
 206:             assertThat(vm.comment.value.length).isEqualTo(500)
 207:         }
 208: }
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --no-ext-diff --unified=40 0285c8e513fcc23986ed4cefd93b7a6dd682ec24 -- customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 496ms:
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt
index 2a57374a..4ebefc40 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt
@@ -1,267 +1,334 @@
 package com.homeservices.customer.ui.rating
 
+import androidx.compose.foundation.border
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
 import androidx.compose.foundation.rememberScrollState
+import androidx.compose.foundation.shape.RoundedCornerShape
 import androidx.compose.foundation.verticalScroll
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
 import androidx.lifecycle.compose.collectAsStateWithLifecycle
 import com.homeservices.customer.R
+import com.homeservices.customer.domain.rating.RatingSubmitFailure
 import com.homeservices.designsystem.components.HsPrimaryButton
 import com.homeservices.designsystem.components.HsScreenTitle
 import com.homeservices.designsystem.components.HsSecondaryButton
 import com.homeservices.designsystem.components.HsSectionCard
 import com.homeservices.designsystem.components.HsTrustBadge
+import com.homeservices.designsystem.theme.HomeservicesBorderWidth
+import com.homeservices.designsystem.theme.LocalHomeservicesRadius
+import com.homeservices.designsystem.theme.LocalHomeservicesSpacing
 import kotlinx.coroutines.delay
 
 @OptIn(ExperimentalMaterial3Api::class)
 @Composable
 public fun RatingScreen(
     modifier: Modifier = Modifier,
     viewModel: RatingViewModel = hiltViewModel(),
     onBack: () -> Unit = {},
     onSubmitted: () -> Unit = {},
 ) {
     val state by viewModel.uiState.collectAsStateWithLifecycle()
     val shieldState by viewModel.shieldState.collectAsStateWithLifecycle()
     val overall by viewModel.overall.collectAsStateWithLifecycle()
     val punct by viewModel.punctuality.collectAsStateWithLifecycle()
     val skill by viewModel.skill.collectAsStateWithLifecycle()
     val behav by viewModel.behaviour.collectAsStateWithLifecycle()
     val comment by viewModel.comment.collectAsStateWithLifecycle()
     val canSubmit by viewModel.canSubmit.collectAsStateWithLifecycle()
+    val submitError by viewModel.submitError.collectAsStateWithLifecycle()
 
     androidx.activity.compose.BackHandler(onBack = onBack)
 
     androidx.compose.runtime.LaunchedEffect(state) {
         if (state is RatingUiState.AwaitingPartner || state is RatingUiState.Revealed) {
             onSubmitted()
         }
     }
 
     RatingContent(
         state = state,
         shieldState = shieldState,
         overall = overall,
         punctuality = punct,
         skill = skill,
         behaviour = behav,
         comment = comment,
         canSubmit = canSubmit,
+        submitError = submitError,
         onOverallChange = viewModel::setOverall,
         onPunctualityChange = viewModel::setPunctuality,
         onSkillChange = viewModel::setSkill,
         onBehaviourChange = viewModel::setBehaviour,
         onCommentChange = viewModel::setComment,
         onSubmit = viewModel::submit,
         onPostAnyway = viewModel::onPostAnyway,
         onBack = onBack,
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
+    submitError: RatingSubmitFailure?,
     onOverallChange: (Int) -> Unit,
     onPunctualityChange: (Int) -> Unit,
     onSkillChange: (Int) -> Unit,
     onBehaviourChange: (Int) -> Unit,
     onCommentChange: (String) -> Unit,
     onSubmit: () -> Unit,
     onPostAnyway: () -> Unit,
     onBack: () -> Unit,
     modifier: Modifier = Modifier,
 ) {
     Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
         Column(modifier = Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
             when (state) {
                 is RatingUiState.AwaitingPartner ->
                     StatusMessage(
                         stringResource(R.string.rating_awaiting_title),
                         stringResource(R.string.rating_awaiting_body),
                         actionLabel = stringResource(R.string.rating_back_home),
                         onAction = onBack,
                     )
                 is RatingUiState.Revealed ->
                     StatusMessage(
                         stringResource(R.string.rating_revealed_title),
                         stringResource(R.string.rating_revealed_body),
                         actionLabel = stringResource(R.string.rating_back_home),
                         onAction = onBack,
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
+                        submitError = submitError,
+                        onBack = onBack,
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
+    submitError: RatingSubmitFailure?,
+    onBack: () -> Unit,
     onOverallChange: (Int) -> Unit,
     onPunctualityChange: (Int) -> Unit,
     onSkillChange: (Int) -> Unit,
     onBehaviourChange: (Int) -> Unit,
     onCommentChange: (String) -> Unit,
     onSubmit: () -> Unit,
     onPostAnyway: () -> Unit,
 ) {
     Column(modifier = Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
         HsTrustBadge(text = stringResource(R.string.rating_eyebrow))
         HsScreenTitle(
             text = stringResource(R.string.rating_title),
             style = MaterialTheme.typography.headlineSmall,
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
+        if (submitError != null) {
+            SubmitErrorNotice(submitError)
+        }
         if (shieldState is RatingShieldState.Escalated) {
             CountdownChip(expiresAtMs = shieldState.expiresAtMs, onPostAnyway = onPostAnyway)
+        } else if (submitError != null && !submitError.retryable) {
+            // Pressing submit again cannot change the answer, so offer the only move that helps
+            // rather than leaving a dead button under the message.
+            HsSecondaryButton(
+                text = stringResource(R.string.rating_back_home),
+                onClick = onBack,
+                modifier = Modifier.fillMaxWidth(),
+            )
         } else {
             HsPrimaryButton(
-                text = stringResource(R.string.rating_submit),
+                text =
+                    stringResource(
+                        if (submitError != null) R.string.rating_submit_retry else R.string.rating_submit,
+                    ),
                 onClick = onSubmit,
                 enabled = canSubmit,
                 modifier = Modifier.fillMaxWidth(),
             )
             // TODO(C-19): implement tip-chip composable here in E18-S03 follow-up once
             //  AwaitingPartner post-submit state is wired (after customer rates, show optional
             //  tip-chip before navigating away). Tracked in E18-S03 ADR-0024.
         }
     }
 }
 
+/**
+ * Why the rating did not send, shown where it happened — directly above the button that failed, so
+ * the stars and comment stay visible and intact behind it.
+ */
+@Composable
+private fun SubmitErrorNotice(failure: RatingSubmitFailure) {
+    val spacing = LocalHomeservicesSpacing.current
+    val radius = LocalHomeservicesRadius.current
+    Surface(
+        color = MaterialTheme.colorScheme.errorContainer,
+        contentColor = MaterialTheme.colorScheme.onErrorContainer,
+        shape = RoundedCornerShape(radius.md),
+        modifier =
+            Modifier
+                .fillMaxWidth()
+                .border(
+                    width = HomeservicesBorderWidth.hairline,
+                    color = MaterialTheme.colorScheme.error,
+                    shape = RoundedCornerShape(radius.md),
+                ),
+    ) {
+        Text(
+            text = stringResource(failure.messageRes()),
+            style = MaterialTheme.typography.bodyMedium,
+            modifier = Modifier.padding(horizontal = spacing.space4, vertical = spacing.space3),
+        )
+    }
+}
+
+private fun RatingSubmitFailure.messageRes(): Int =
+    when (this) {
+        RatingSubmitFailure.NoTechnician -> R.string.rating_submit_error_no_technician
+        RatingSubmitFailure.BookingNotClosed -> R.string.rating_submit_error_not_closed
+        RatingSubmitFailure.NotAvailable -> R.string.rating_submit_error_not_available
+        RatingSubmitFailure.Network -> R.string.rating_submit_error_network
+        // AlreadySubmitted never reaches the form — the view model moves the screen on instead.
+        RatingSubmitFailure.AlreadySubmitted, RatingSubmitFailure.Unknown ->
+            R.string.rating_submit_error_generic
+    }
+
 @Composable
 private fun StatusMessage(
     title: String,
     body: String,
     actionLabel: String? = null,
     onAction: () -> Unit = {},
 ) {
     Column(
         modifier = Modifier.fillMaxSize(),
         horizontalAlignment = Alignment.CenterHorizontally,
         verticalArrangement = Arrangement.Center,
     ) {
         Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
         Spacer(Modifier.height(8.dp))
         Text(body, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
         if (actionLabel != null) {
             Spacer(Modifier.height(24.dp))
             HsPrimaryButton(
                 text = actionLabel,
                 onClick = onAction,
                 modifier = Modifier.fillMaxWidth(),
             )
         }
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
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
index 171dccde..87f73849 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
@@ -1,175 +1,189 @@
 package com.homeservices.customer.ui.rating
 
 import androidx.lifecycle.SavedStateHandle
 import androidx.lifecycle.ViewModel
 import androidx.lifecycle.viewModelScope
 import com.homeservices.customer.domain.rating.EscalateRatingUseCase
 import com.homeservices.customer.domain.rating.GetRatingUseCase
+import com.homeservices.customer.domain.rating.RatingSubmitException
+import com.homeservices.customer.domain.rating.RatingSubmitFailure
 import com.homeservices.customer.domain.rating.SubmitRatingUseCase
 import com.homeservices.customer.domain.rating.model.CustomerSubScores
 import com.homeservices.customer.domain.rating.model.RatingSnapshot
 import com.homeservices.customer.domain.rating.model.SideState
 import com.homeservices.customer.observability.analytics.AnalyticsEvents
 import com.homeservices.customer.observability.analytics.AnalyticsFacade
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
 
     /** API call in flight — sheet buttons disabled to prevent double-tap race. */
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
         private val analytics: AnalyticsFacade,
     ) : ViewModel() {
         public val bookingId: String =
             savedStateHandle.get<String>("bookingId") ?: error("bookingId required")
 
         private val _uiState = MutableStateFlow<RatingUiState>(RatingUiState.Loading)
         public val uiState: StateFlow<RatingUiState> = _uiState.asStateFlow()
 
         private val _shieldState = MutableStateFlow<RatingShieldState>(RatingShieldState.Idle)
         public val shieldState: StateFlow<RatingShieldState> = _shieldState.asStateFlow()
 
+        /**
+         * Why the last submit was rejected, or null. Kept apart from [uiState] on purpose: a submit
+         * that fails must leave the form — and everything the customer typed into it — on screen,
+         * whereas [RatingUiState.Error] replaces the screen and is only for a failed load.
+         */
+        private val _submitError = MutableStateFlow<RatingSubmitFailure?>(null)
+        public val submitError: StateFlow<RatingSubmitFailure?> = _submitError.asStateFlow()
+
+        /** Last snapshot the API gave us, so the form can be restored after a failed submit. */
+        private var lastSnapshot: RatingSnapshot? = null
+
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
+                            lastSnapshot = snap
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
@@ -189,108 +203,139 @@ public class RatingViewModel
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
             // Intentionally does NOT submit — scrim tap / back gesture is not an opt-out.
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
+            // Same as doSubmit: a fresh attempt clears the last attempt's message, so a retry that
+            // succeeds does not leave the old failure sitting under the countdown.
+            _submitError.value = null
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
-                        _uiState.value = RatingUiState.Error(it.message ?: "escalation failed")
+                        // Same rule as a failed submit: report it, keep the form and the dialog.
+                        _submitError.value =
+                            (it as? RatingSubmitException)?.failure ?: RatingSubmitFailure.Unknown
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
 
+        /**
+         * A rejected submit keeps the customer where they are. The one exception is a rating the
+         * server already holds, which is not a failure at all — the screen simply catches up.
+         */
+        private fun onSubmitFailed(throwable: Throwable) {
+            val failure = (throwable as? RatingSubmitException)?.failure ?: RatingSubmitFailure.Unknown
+            if (failure == RatingSubmitFailure.AlreadySubmitted) {
+                cancelShieldState()
+                _submitError.value = null
+                _uiState.value = RatingUiState.AwaitingPartner(lastSnapshot)
+                return
+            }
+            // The shield is over by the time a submit can fail (onPostAnyway / onSkipShield both
+            // set Idle first), so the captured draft must go too. Keeping it would make doSubmit()
+            // resend the old draft and silently discard whatever the customer edits before
+            // retrying — the owner has already seen the draft, so the retry is theirs to change.
+            cancelShieldState()
+            _submitError.value = failure
+            _uiState.value = RatingUiState.Editing(lastSnapshot)
+        }
+
+        public fun consumeSubmitError() {
+            _submitError.value = null
+        }
+
         private fun doSubmit() {
             val draft = escalatedDraft
             val submitOverall = draft?.overall ?: overall.value
             val submitSubScores = draft?.subScores ?: CustomerSubScores(punctuality.value, skill.value, behaviour.value)
             val submitComment = draft?.comment ?: comment.value.ifBlank { null }
             _uiState.value = RatingUiState.Submitting
+            _submitError.value = null
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
                                 // Clear shield state only after confirmed success — preserves
                                 // draft for retry if the network call fails.
                                 cancelShieldState()
                                 runCatching {
                                     analytics.track(
                                         AnalyticsEvents.RATING_SUBMITTED,
                                         mapOf("booking_id" to bookingId, "overall" to submitOverall),
                                     )
                                 }
                                 _uiState.value = RatingUiState.AwaitingPartner(null)
-                            }.onFailure { _uiState.value = RatingUiState.Error(it.message ?: "submit failed") }
+                            }.onFailure { onSubmitFailed(it) }
                     }
             }
         }
     }
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse design-system customer-app -Filter *.kt | Select-String -Pattern 'object HomeservicesBorderWidth|class HomeservicesBorderWidth|hairline|LocalHomeservicesRadius|data class HomeservicesRadius' | Select-Object Path,LineNumber,Line | Format-List" in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
2026-09-05T12:55:51.434342Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.8 seconds
Output:
Get-ChildItem : A positional parameter cannot be found that accepts argument 'customer-app'.
At line:2 char:1
+ Get-ChildItem -Recurse design-system customer-app -Filter *.kt | Sele ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : InvalidArgument: (:) [Get-ChildItem], ParameterBindingException
    + FullyQualifiedErrorId : PositionalParameterNotFound,Microsoft.PowerShell.Commands.GetChildItemCommand
 

 exited 1 in 826ms:
Get-ChildItem : A positional parameter cannot be found that accepts argument 'customer-app'.
At line:2 char:1
+ Get-ChildItem -Recurse design-system customer-app -Filter *.kt | Sele ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : InvalidArgument: (:) [Get-ChildItem], ParameterBindingException
    + FullyQualifiedErrorId : PositionalParameterNotFound,Microsoft.PowerShell.Commands.GetChildItemCommand
 

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Path design-system,customer-app -Recurse -Filter *.kt | Select-String -Pattern 'object HomeservicesBorderWidth|class HomeservicesBorderWidth|hairline|LocalHomeservicesRadius|data class HomeservicesRadius' | Select-Object Path,LineNumber,Line | Format-List" in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 2033ms:


Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\design-system\src\main\k
             otlin\com\homeservices\designsystem\theme\BorderWidth.kt
LineNumber : 11
Line       : public object HomeservicesBorderWidth {

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\design-system\src\main\k
             otlin\com\homeservices\designsystem\theme\BorderWidth.kt
LineNumber : 15
Line       :     /** 1 dp hairline stroke. */

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\design-system\src\main\k
             otlin\com\homeservices\designsystem\theme\BorderWidth.kt
LineNumber : 16
Line       :     public val hairline: Dp = 1.dp

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\design-system\src\main\k
             otlin\com\homeservices\designsystem\theme\ExtendedColors.kt
LineNumber : 71
Line       :      * The border tokens remain correct for what they are — decorative hairlines and separators,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\design-system\src\main\k
             otlin\com\homeservices\designsystem\theme\HomeservicesTheme.kt
LineNumber : 32
Line       :  *     [LocalHomeservicesSpacing], [LocalHomeservicesRadius], [LocalHomeservicesElevation],

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\design-system\src\main\k
             otlin\com\homeservices\designsystem\theme\HomeservicesTheme.kt
LineNumber : 55
Line       :         LocalHomeservicesRadius provides radius,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\design-system\src\main\k
             otlin\com\homeservices\designsystem\theme\Radius.kt
LineNumber : 5
Line       :  * Consumers in @Composable code SHOULD prefer `LocalHomeservicesRadius.current.<token>` over

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\design-system\src\main\k
             otlin\com\homeservices\designsystem\theme\Radius.kt
LineNumber : 20
Line       : public data class HomeservicesRadiusScale(

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\design-system\src\main\k
             otlin\com\homeservices\designsystem\theme\Radius.kt
LineNumber : 50
Line       :  * shape mapping still reaches this contract through [LocalHomeservicesRadius].

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\design-system\src\main\k
             otlin\com\homeservices\designsystem\theme\Radius.kt
LineNumber : 75
Line       : public val LocalHomeservicesRadius: ProvidableCompositionLocal<HomeservicesRadiusScale> =

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\design-system\src\test\k
             otlin\com\homeservices\designsystem\theme\BorderWidthTokensTest.kt
LineNumber : 8
Line       :     internal fun border_width_tokens_cover_hairline_and_focus_strokes() {

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\design-system\src\test\k
             otlin\com\homeservices\designsystem\theme\BorderWidthTokensTest.kt
LineNumber : 10
Line       :         assertThat(HomeservicesBorderWidth.hairline.value).isEqualTo(1f)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\design-system\src\test\k
             otlin\com\homeservices\designsystem\theme\RadiusTokensTest.kt
LineNumber : 40
Line       :     internal fun localHomeservicesRadius_isNotNull() {

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\design-system\src\test\k
             otlin\com\homeservices\designsystem\theme\RadiusTokensTest.kt
LineNumber : 41
Line       :         assertThat(LocalHomeservicesRadius).isNotNull()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\rating\RatingScreen.kt
LineNumber : 48
Line       : import com.homeservices.designsystem.theme.LocalHomeservicesRadius

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\rating\RatingScreen.kt
LineNumber : 262
Line       :     val radius = LocalHomeservicesRadius.current

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\rating\RatingScreen.kt
LineNumber : 271
Line       :                     width = HomeservicesBorderWidth.hairline,




exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/dto/RatingDtos.kt'; "'$i=1; Get-Content $f | ForEach-Object {'"'{0,4}: {1}' -f "'$i,$_ ; $i++}' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 677ms:
   1: package com.homeservices.customer.data.rating.remote.dto
   2: 
   3: import com.homeservices.customer.domain.rating.model.CustomerRating
   4: import com.homeservices.customer.domain.rating.model.CustomerSubScores
   5: import com.homeservices.customer.domain.rating.model.RatingSnapshot
   6: import com.homeservices.customer.domain.rating.model.SideState
   7: import com.homeservices.customer.domain.rating.model.TechRating
   8: import com.homeservices.customer.domain.rating.model.TechSubScores
   9: import com.squareup.moshi.JsonClass
  10: 
  11: @JsonClass(generateAdapter = true)
  12: public data class SubmitRatingRequestDto(
  13:     val side: String,
  14:     val bookingId: String,
  15:     val overall: Int,
  16:     val subScores: Map<String, Int>,
  17:     val comment: String?,
  18: )
  19: 
  20: @JsonClass(generateAdapter = true)
  21: public data class SidePayloadDto(
  22:     val status: String,
  23:     val overall: Int? = null,
  24:     val subScores: Map<String, Int>? = null,
  25:     val comment: String? = null,
  26:     val submittedAt: String? = null,
  27: )
  28: 
  29: @JsonClass(generateAdapter = true)
  30: public data class GetRatingResponseDto(
  31:     val bookingId: String,
  32:     val status: String,
  33:     val revealedAt: String? = null,
  34:     val customerSide: SidePayloadDto,
  35:     val techSide: SidePayloadDto,
  36: ) {
  37:     public fun toDomain(): RatingSnapshot =
  38:         RatingSnapshot(
  39:             bookingId = bookingId,
  40:             status = RatingSnapshot.Status.valueOf(status),
  41:             revealedAt = revealedAt,
  42:             customerSide = customerSide.toCustomerSide(),
  43:             techSide = techSide.toTechSide(),
  44:         )
  45: }
  46: 
  47: private fun SidePayloadDto.toCustomerSide(): SideState =
  48:     if (status == "SUBMITTED" && overall != null && subScores != null && submittedAt != null) {
  49:         SideState.Submitted(
  50:             CustomerRating(
  51:                 overall = overall,
  52:                 subScores =
  53:                     CustomerSubScores(
  54:                         punctuality = subScores["punctuality"] ?: 0,
  55:                         skill = subScores["skill"] ?: 0,
  56:                         behaviour = subScores["behaviour"] ?: 0,
  57:                     ),
  58:                 comment = comment,
  59:                 submittedAt = submittedAt,
  60:             ),
  61:         )
  62:     } else {
  63:         SideState.Pending
  64:     }
  65: 
  66: private fun SidePayloadDto.toTechSide(): SideState =
  67:     if (status == "SUBMITTED" && overall != null && subScores != null && submittedAt != null) {
  68:         SideState.Submitted(
  69:             TechRating(
  70:                 overall = overall,
  71:                 subScores =
  72:                     TechSubScores(
  73:                         behaviour = subScores["behaviour"] ?: 0,
  74:                         communication = subScores["communication"] ?: 0,
  75:                     ),
  76:                 comment = comment,
  77:                 submittedAt = submittedAt,
  78:             ),
  79:         )
  80:     } else {
  81:         SideState.Pending
  82:     }
  83: 
  84: /**
  85:  * Shape of every error body the API returns (`api/src/functions/ratings.ts`): a stable
  86:  * machine-readable `code`, plus fields that vary by code and are not needed here.
  87:  */
  88: @JsonClass(generateAdapter = true)
  89: public data class ApiErrorDto(
  90:     val code: String? = null,
  91: )

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Name -Filter gradlew*; Get-ChildItem customer-app -Name' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 645ms:
.claude
.gradle
.kotlin
.serena
app
build
gradle
.editorconfig
build.gradle.kts
CLAUDE.md
detekt.yml
gradle.properties
gradlew
gradlew.bat
local.properties
README.md
settings.gradle.kts

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command ".\\gradlew.bat :app:compileDebugKotlin --no-daemon --console=plain" in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app
2026-09-05T12:56:16.473906Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 9.1 seconds
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

 exited 1 in 9129ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelShieldTest.kt'; "'$i=1; Get-Content $f | ForEach-Object { if($i -ge 108 -and $i -le 230){'"'{0,4}: {1}' -f "'$i,$_}; $i++ }' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 508ms:
 108:     public fun `onEscalate calls use case and sets Escalated on success`(): Unit =
 109:         runTest {
 110:             val expiresAtMs = System.currentTimeMillis() + 2 * 60 * 60 * 1000
 111:             coEvery { escalate.invoke("bk-1", 2, null) } returns
 112:                 Result.success(EscalateRatingResult("c-1", expiresAtMs))
 113:             // runTest drains all coroutines at cleanup (advanceUntilIdle) â€” stub submit so the
 114:             // countdown auto-fire at cleanup doesn't throw MockKException.
 115:             coEvery { submit.invoke(any(), any(), any(), any()) } returns flowOf(Result.success(Unit))
 116:             val v = vm()
 117:             v.setOverall(2)
 118:             v.setPunctuality(5)
 119:             v.setSkill(5)
 120:             v.setBehaviour(5)
 121:             v.submit() // â†’ ShowDialog
 122:             v.onEscalate()
 123:             runCurrent() // drives onEscalate â†’ Escalated, countdown suspended at delay(remaining)
 124:             assertThat(v.shieldState.value).isInstanceOf(RatingShieldState.Escalated::class.java)
 125:             assertThat((v.shieldState.value as RatingShieldState.Escalated).expiresAtMs).isEqualTo(expiresAtMs)
 126:         }
 127: 
 128:     @Test
 129:     public fun `onEscalate failure reopens the dialog and reports why, without losing the form`(): Unit =
 130:         runTest {
 131:             coEvery { escalate.invoke("bk-1", 2, null) } returns Result.failure(RuntimeException("network"))
 132:             val v = vm()
 133:             v.setOverall(2)
 134:             v.setPunctuality(5)
 135:             v.setSkill(5)
 136:             v.setBehaviour(5)
 137:             v.submit()
 138:             v.onEscalate()
 139:             runCurrent()
 140:             assertThat(v.shieldState.value).isEqualTo(RatingShieldState.ShowDialog) // allows retry
 141:             assertThat(v.uiState.value).isNotInstanceOf(RatingUiState.Error::class.java)
 142:             assertThat(v.submitError.value).isEqualTo(RatingSubmitFailure.Unknown)
 143:             assertThat(v.overall.value).isEqualTo(2)
 144:         }
 145: 
 146:     @Test
 147:     public fun `second submit after Escalated state posts API without reshowing dialog`(): Unit =
 148:         runTest {
 149:             val expiresAtMs = System.currentTimeMillis() + 2 * 60 * 60 * 1000
 150:             coEvery { escalate.invoke("bk-1", 2, null) } returns
 151:                 Result.success(EscalateRatingResult("c-1", expiresAtMs))
 152:             coEvery { submit.invoke("bk-1", 2, CustomerSubScores(5, 5, 5), null) } returns
 153:                 flowOf(Result.success(Unit))
 154:             val v = vm()
 155:             v.setOverall(2)
 156:             v.setPunctuality(5)
 157:             v.setSkill(5)
 158:             v.setBehaviour(5)
 159:             v.submit() // â†’ ShowDialog
 160:             v.onEscalate()
 161:             runCurrent() // â†’ Escalated, countdown suspended at delay
 162:             v.submit() // shieldState != Idle â†’ straight to doSubmit
 163:             runCurrent() // drive doSubmit
 164:             assertThat(v.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
 165:         }
 166: }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path docs/reviews/codex-20260905-0834-round2.md -Pattern 'P[0-3]|finding|bug|retry|AlreadySubmitted|Escalated' -CaseSensitive | Select-Object -First 80 | Format-Table -AutoSize" in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 549ms:

IgnoreCase LineNumber Line                                                                                             
---------- ---------- ----                                                                                             
     False         18   • Analyze changed code for bugs                                                                
     False         19   • Produce JSON findings                                                                        
     False         68   • Analyze changed code for bugs                                                                
     False         69   • Produce JSON findings                                                                        
     False        154 +                "RATING_ALREADY_SUBMITTED" -> RatingSubmitFailure.AlreadySubmitted              
     False        264 + * [retryable] answers a single question the UI needs: does pressing the button again have any  
     False        269 +    public val retryable: Boolean,                                                              
     False        272 +    NoTechnician(retryable = false),                                                            
     False        275 +    AlreadySubmitted(retryable = false),                                                        
     False        278 +    BookingNotClosed(retryable = false),                                                        
     False        281 +    NotAvailable(retryable = false),                                                            
     False        284 +    Network(retryable = true),                                                                  
     False        287 +    Unknown(retryable = true),                                                                  
     False        381          if (shieldState is RatingShieldState.Escalated) {                                       
     False        383 +        } else if (submitError != null && !submitError.retryable) {                             
     False        396 +                        if (submitError != null) R.string.rating_submit_retry else R.string.r...
     False        440 +        // AlreadySubmitted never reaches the form — the view model moves the screen on instead.
     False        441 +        RatingSubmitFailure.AlreadySubmitted, RatingSubmitFailure.Unknown ->                    
     False        486                              if (snap.customerSide is SideState.Submitted && _shieldState.valu...
     False        490                          _shieldState.value = RatingShieldState.ShowDialog // allow retry        
     False        508 +            if (failure == RatingSubmitFailure.AlreadySubmitted) {                              
     False        517 +            // retrying — the owner has already seen the draft, so the retry is theirs to cha...
     False        559 +    <string name="rating_submit_retry">दोबारा भेजें</string>                                    
     False        576 +    <string name="rating_submit_retry">Send again</string>                                      
     False        650 +    public fun `409 RATING_ALREADY_SUBMITTED maps to AlreadySubmitted`(): Unit =                
     False        653 +                .isEqualTo(RatingSubmitFailure.AlreadySubmitted)                                
     False        678 +    public fun `IO failure maps to retryable Network`(): Unit =                                 
     False        682 +            assertThat(failure.retryable).isTrue()                                              
     False        686 +    public fun `500 maps to retryable Unknown`(): Unit =                                        
     False        690 +            assertThat(failure.retryable).isTrue()                                              
     False        708 +    public fun `terminal failures are not marked retryable`() {                                 
     False        709 +        assertThat(RatingSubmitFailure.NoTechnician.retryable).isFalse()                        
     False        710 +        assertThat(RatingSubmitFailure.BookingNotClosed.retryable).isFalse()                    
     False        711 +        assertThat(RatingSubmitFailure.NotAvailable.retryable).isFalse()                        
     False        765 +            assertThat(error.failure.retryable).isFalse()                                       
     False        816              assertThat(v.shieldState.value).isEqualTo(RatingShieldState.ShowDialog) // allows...
     False        932 +    public fun `a transport failure is reported as retryable`(): Unit =                         
     False        940 +            assertThat(vm.submitError.value?.retryable).isTrue()                                
     False        963 +            failWith(RatingSubmitFailure.AlreadySubmitted)                                      
     False        972 +    public fun `retrying clears the previous error`(): Unit =                                   
     False        998 +    public fun `after a failed post-anyway, a retry sends the edited rating and not the shiel...
     False       1012 +            // Customer reconsiders and raises every score before retrying.                     
     False       1111     public data class Escalated(                                                                 
     False       1187         // doSubmit() uses these values (not the live flows) when shieldState is Escalated,      
     False       1189         private data class EscalatedDraft(                                                       
     False       1195         private var escalatedDraft: EscalatedDraft? = null                                       
     False       1217                     escalatedDraft = EscalatedDraft(dOverall, CustomerSubScores(dPunct, dSkill...
     False       1219                 _shieldState.value = RatingShieldState.Escalated(savedExpiry)                    
     False       1230                             if (snap.customerSide is SideState.Submitted && _shieldState.value...
     False       1333                         escalatedDraft = EscalatedDraft(capturedOverall, capturedSubScores, ca...
     False       1340                         _shieldState.value = RatingShieldState.Escalated(r.expiresAtMs)          
     False       1343                         _shieldState.value = RatingShieldState.ShowDialog // allow retry         
     False       1366             if (failure == RatingSubmitFailure.AlreadySubmitted) {                               
     False       1375             // retrying â€” the owner has already seen the draft, so the retry is theirs to ch...
     False       1403                                 // draft for retry if the network call fails.                    
     False       1649         if (shieldState is RatingShieldState.Escalated) {                                        
     False       1651         } else if (submitError != null && !submitError.retryable) {                              
     False       1663                         if (submitError != null) R.string.rating_submit_retry else R.string.ra...
     False       1711         // AlreadySubmitted never reaches the form â€” the view model moves the screen on inst...
     False       1712         RatingSubmitFailure.AlreadySubmitted, RatingSubmitFailure.Unknown ->                     
     False       2429         debug {                                                                                  
     False       2960 // Hilt + KSP2 (K2 compiler): pass the flag that tells the Hilt KSP processor                    
     False       2963 // Without this, KSP2 fails with "Expected @AndroidEntryPoint to have a value".                  
     False       2982     debugImplementation(libs.compose.ui.tooling)                                                 
     False       3227 "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command './gradlew.bat :cust...
     False       3234 + ./gradlew.bat :customer-app:app:testDebugUnitTest -PexcludePaparazzi  ...                      
     False       3244 + ./gradlew.bat :customer-app:app:testDebugUnitTest -PexcludePaparazzi  ...                      
     False       3268 "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command ".\\gradlew.bat :app...
     False       3413  255:                         escalatedDraft = EscalatedDraft(capturedOverall, capturedSubScor...
     False       3420  262:                         _shieldState.value = RatingShieldState.Escalated(r.expiresAtMs)    
     False       3423  265:                         _shieldState.value = RatingShieldState.ShowDialog // allow retry   
     False       3446  288:             if (failure == RatingSubmitFailure.AlreadySubmitted) {                         
     False       3455  297:             // retrying â€” the owner has already seen the draft, so the retry is theirs...
     False       3483  325:                                 // draft for retry if the network call fails.              
     False       3533   37:                 "RATING_ALREADY_SUBMITTED" -> RatingSubmitFailure.AlreadySubmitted         
     False       3584     public data class Escalated(                                                                 
     False       3649         // doSubmit() uses these values (not the live flows) when shieldState is Escalated,      
     False       3651         private data class EscalatedDraft(                                                       
     False       3657         private var escalatedDraft: EscalatedDraft? = null                                       
     False       3679                     escalatedDraft = EscalatedDraft(dOverall, CustomerSubScores(dPunct, dSkill...



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content docs/reviews/codex-20260905-0834-round2.md -Tail 120' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 500ms:
-            when (code()) {
-                HTTP_FORBIDDEN, HTTP_NOT_FOUND -> RatingSubmitFailure.NotAvailable
-                else ->
-                    when (errorCode()) {
-                        "NO_TECHNICIAN" -> RatingSubmitFailure.NoTechnician
-                        "RATING_ALREADY_SUBMITTED" -> RatingSubmitFailure.AlreadySubmitted
-                        "BOOKING_NOT_CLOSED" -> RatingSubmitFailure.BookingNotClosed
-                        "BOOKING_NOT_FOUND", "FORBIDDEN" -> RatingSubmitFailure.NotAvailable
-                        else -> RatingSubmitFailure.Unknown
-                    }
-            }
-
-        /**
-         * Reads the stable `code` the API puts in every error body. A body that is missing,
-         * truncated or not JSON at all (a gateway HTML page, say) yields null rather than throwing.
-         */
-        private fun HttpException.errorCode(): String? =
-            runCatching { response()?.errorBody()?.string() }
-                .getOrNull()
-                ?.takeIf { it.isNotBlank() }
-                ?.let { body -> runCatching { errorAdapter.fromJson(body)?.code }.getOrNull() }
-                ?.takeIf { it.isNotBlank() }
-
-        private companion object {
-            /** Errors are rare, so one shared adapter costs nothing and keeps the constructor unchanged. */
-            private val errorAdapter = Moshi.Builder().build().adapter(ApiErrorDto::class.java)
-        }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt
index 26730350..6b59aea3 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt
@@ -2,6 +2,7 @@ package com.homeservices.customer.domain.rating
 
 import com.homeservices.customer.data.rating.remote.RatingApiService
 import com.homeservices.customer.data.rating.remote.dto.EscalateRatingRequestDto
+import com.homeservices.customer.data.rating.toRatingSubmitFailure
 import java.time.Instant
 import javax.inject.Inject
 
@@ -26,5 +27,9 @@ public class EscalateRatingUseCase
                     complaintId = dto.complaintId,
                     expiresAtMs = Instant.parse(dto.expiresAt).toEpochMilli(),
                 )
+            }.recoverCatching {
+                // The escalate endpoint answers with the same code vocabulary as submit, so the
+                // sheet can name the real reason instead of a generic "try again".
+                throw RatingSubmitException(it.toRatingSubmitFailure(), it)
             }
     }
diff --git a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
index 9872e6b2..0c30f9b0 100644
--- a/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
+++ b/customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt
@@ -291,6 +291,11 @@ public class RatingViewModel
                 _uiState.value = RatingUiState.AwaitingPartner(lastSnapshot)
                 return
             }
+            // The shield is over by the time a submit can fail (onPostAnyway / onSkipShield both
+            // set Idle first), so the captured draft must go too. Keeping it would make doSubmit()
+            // resend the old draft and silently discard whatever the customer edits before
+            // retrying â€” the owner has already seen the draft, so the retry is theirs to change.
+            cancelShieldState()
             _submitError.value = failure
             _uiState.value = RatingUiState.Editing(lastSnapshot)
         }

2026-09-05T12:39:11.754132Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 93 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/GetRatingUseCase.kt -Raw' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 938ms:
package com.homeservices.customer.domain.rating

import com.homeservices.customer.data.rating.RatingRepository
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetRatingUseCase
    @Inject
    constructor(
        private val repo: RatingRepository,
    ) {
        public operator fun invoke(bookingId: String): Flow<Result<RatingSnapshot>> = repo.get(bookingId)
    }


2026-09-05T12:39:24.496284Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 93 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path docs/reviews/codex-20260905-0834-round2.md -Pattern "findings|patch is" | Select-Object -Last 20 | ForEach-Object { $_.Line }' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 704ms:
  â€¢ Produce JSON findings
  â€¢ Produce JSON findings
{"timestamp":"2026-09-05T10:53:21Z","commit":"8241d71c0ad188d665fab1d50a03b43a01f38b44","reviewer":"codex","rounds":[{"round":1,"head":"8241d71c","findings":"none Ã¢â‚¬â€ no introduced correctness issues in the changed code"}],"summary":"customer-app: blank-Razorpay-key dev warning scoped to debug AND AwaitingPayment so cash-only pilot testers never see it; stale comment about a removed Gradle assemble guard corrected; 5 unit tests on shouldWarnBlankRazorpayKey; smoke gate 6/6 green"}
  Ã¢â‚¬Â¢ Produce JSON findings
  Ã¢â‚¬Â¢ Produce JSON findings
{"timestamp":"2026-09-05T10:53:21Z","commit":"8241d71c0ad188d665fab1d50a03b43a01f38b44","reviewer":"codex","rounds":[{"round":1,"head":"8241d71c","findings":"none ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no introduced correctness issues in the changed code"}],"summary":"customer-app: blank-Razorpay-key dev warning scoped to debug AND AwaitingPayment so cash-only pilot testers never see it; stale comment about a removed Gradle assemble guard corrected; 5 unit tests on shouldWarnBlankRazorpayKey; smoke gate 6/6 green"}
  Ã¢â‚¬Â¢ Produce JSON findings
  Ã¢â‚¬Â¢ Produce JSON findings
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path docs/reviews/codex-20260905-0834-round2.md -Pattern "findings|patch is" | Select-Object -Last 20 | ForEach-Object { $_.Line }' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error

2026-09-05T12:39:34.322578Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 93 column 5
  âœ“ Inspect repository guidance
  âœ“ Inspect diff against merge base
  âœ“ Analyze changed code for bugs
  â†’ Produce JSON findings
2026-09-05T12:39:39.881894Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 93 column 5
codex
The patch adds useful submit-error mapping, but the escalation retry flow can leave a stale error visible after a successful retry. This is a user-facing correctness issue in the changed state handling.

Review comment:

- [P2] Clear submit errors when escalation succeeds â€” C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\main\kotlin\com\homeservices\customer\ui\rating\RatingViewModel.kt:267-268
  When a Send to support attempt fails once and the customer retries successfully, this error value is left set because the escalation success path never clears `_submitError`. `RatingForm` renders `SubmitErrorNotice` whenever that flow is non-null, so the successful escalated/countdown state continues to show the stale failure message until a later submit attempt.
The patch adds useful submit-error mapping, but the escalation retry flow can leave a stale error visible after a successful retry. This is a user-facing correctness issue in the changed state handling.

Review comment:

- [P2] Clear submit errors when escalation succeeds â€” C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\main\kotlin\com\homeservices\customer\ui\rating\RatingViewModel.kt:267-268
  When a Send to support attempt fails once and the customer retries successfully, this error value is left set because the escalation success path never clears `_submitError`. `RatingForm` renders `SubmitErrorNotice` whenever that flow is non-null, so the successful escalated/countdown state continues to show the stale failure message until a later submit attempt.

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git log --oneline --decorate -5' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 511ms:
1845a22f (HEAD -> fix/customer-rating-submit-error) fix(customer-app): clear the submit error when a shield escalation is retried
353d33df fix(customer-app): address Codex P2s — share the error mapping, drop the stale shield draft
67285bae fix(customer-app): report why a rating submit failed instead of a fake load error
0285c8e5 (origin/main, origin/HEAD) fix(customer-app): stop showing the blank-Razorpay-key dev warning to pilot users (#321)
7e901c27 hotfix(api): catalogue 500s — price-in-prose guard moved off the read path (#320)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path customer-app/app/build.gradle.kts,customer-app/build.gradle.kts,customer-app/gradle/libs.versions.toml -Pattern 'moshi|ksp|codegen|kapt|explicitApi' | Select-Object Path,LineNumber,Line | Format-List" in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 504ms:


Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 110
Line       :     alias(libs.plugins.ksp)

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 342
Line       :                     // KSP-generated factories (pattern: ModuleName_ProvideXxxFactory)

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 424
Line       :                     // Moshi KSP-generated JSON adapters — code-gen output, same rationale as Hilt 
             factories.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 453
Line       :                     // TechnicianProfileDto Moshi adapter — code-gen output

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 477
Line       :                     // Booking remote DTOs — Moshi @JsonClass data holders with toDomain() mappers;

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 480
Line       :                     // Auth remote DTOs — Moshi @JsonClass data holders 
             (TruecallerVerifyRequest/Response),

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 569
Line       :                     // Room KSP-generated DAO/DB implementation classes (anonymous Runnable/Callable on 
             Room executor)

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 720
Line       : // Hilt + KSP2 (K2 compiler): pass the flag that tells the Hilt KSP processor

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 722
Line       : // skipped during the KSP pass (the plugin does the bytecode transform post-compile).

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 723
Line       : // Without this, KSP2 fails with "Expected @AndroidEntryPoint to have a value".

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 724
Line       : // See https://dagger.dev/hilt/gradle-setup.html#ksp

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 725
Line       : ksp {

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 751
Line       :     ksp(libs.hilt.compiler)

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 784
Line       :     implementation(libs.retrofit.moshi)

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 787
Line       :     implementation(libs.moshi.kotlin)

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 788
Line       :     ksp(libs.moshi.kotlin.codegen)

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 794
Line       :     ksp(libs.room.compiler)

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 820
Line       :     kspTest(libs.hilt.compiler)

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\build.gradle.kts
LineNumber : 824
Line       :     kspAndroidTest(libs.hilt.compiler)

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\build.gradle.kts
LineNumber : 5
Line       :     alias(libs.plugins.ksp) apply false

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\gradle\libs.versions.toml
LineNumber : 4
Line       : ksp = "2.0.21-1.0.28"

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\gradle\libs.versions.toml
LineNumber : 47
Line       : moshi = "1.15.1"

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\gradle\libs.versions.toml
LineNumber : 152
Line       : retrofit-moshi       = { module = "com.squareup.retrofit2:converter-moshi",        version.ref = 
             "retrofit" }

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\gradle\libs.versions.toml
LineNumber : 156
Line       : moshi-kotlin         = { module = "com.squareup.moshi:moshi-kotlin",               version.ref = "moshi" }

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\gradle\libs.versions.toml
LineNumber : 157
Line       : moshi-kotlin-codegen = { module = "com.squareup.moshi:moshi-kotlin-codegen",       version.ref = "moshi" }

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\gradle\libs.versions.toml
LineNumber : 200
Line       : ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }




exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Path customer-app/app/src -Recurse -Filter *.kt | Select-String -Pattern 'RatingContent\\(' | Select-Object Path,LineNumber,Line | Format-List" in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 588ms:


Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\rating\RatingScreen.kt
LineNumber : 78
Line       :     RatingContent(

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\rating\RatingScreen.kt
LineNumber : 110
Line       : internal fun RatingContent(

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\tes
             t\kotlin\com\homeservices\customer\ui\rating\RatingScreenPaparazziTest.kt
LineNumber : 19
Line       :                 RatingContent(

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\tes
             t\kotlin\com\homeservices\customer\ui\rating\RatingShieldHindiPaparazziTest.kt
LineNumber : 27
Line       :                 RatingContent(




exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse customer-app/app/src/main/kotlin -Filter *.kt | Select-String -Pattern 'bookings_rate_booking|Rate Booking|rating.*route|RatingScreen|BookingStatus|CLOSED|COMPLETED|PAID' | Select-Object -First 200 Path,LineNumber,Line | Format-List" in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 942ms:


Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\auth\gateway\FirebasePhoneOtpSender.kt
LineNumber : 39
Line       :                         override fun onVerificationCompleted(credential: PhoneAuthCredential) {

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\booking\remote\dto\BookingDtos.kt
LineNumber : 6
Line       : import com.homeservices.customer.domain.booking.model.CustomerBookingStatus

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\booking\remote\dto\BookingDtos.kt
LineNumber : 129
Line       :                     CustomerBookingStatus.valueOf(status)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\booking\remote\dto\BookingDtos.kt
LineNumber : 130
Line       :                 }.getOrDefault(CustomerBookingStatus.UNKNOWN),

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\locale\LocaleRepositoryImpl.kt
LineNumber : 24
Line       :             val KEY_FIRST_LAUNCH_COMPLETED = booleanPreferencesKey("first_launch_completed")

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\locale\LocaleRepositoryImpl.kt
LineNumber : 34
Line       :             dataStore.data.map { prefs -> !(prefs[KEY_FIRST_LAUNCH_COMPLETED] ?: false) }

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\locale\LocaleRepositoryImpl.kt
LineNumber : 40
Line       :         override suspend fun markFirstLaunchCompleted() {

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\locale\LocaleRepositoryImpl.kt
LineNumber : 41
Line       :             dataStore.edit { prefs -> prefs[KEY_FIRST_LAUNCH_COMPLETED] = true }

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\rating\RatingApiErrors.kt
LineNumber : 38
Line       :                 "BOOKING_NOT_CLOSED" -> RatingSubmitFailure.BookingNotClosed

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\technician\remote\dto\TechnicianProfileDto.kt
LineNumber : 26
Line       :     @Json(name = "totalJobsCompleted") val totalJobsCompleted: Int,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\technician\remote\dto\TechnicianProfileDto.kt
LineNumber : 41
Line       :         totalJobsCompleted = totalJobsCompleted,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImpl.kt
LineNumber : 5
Line       : import com.homeservices.customer.domain.tracking.model.BookingStatus

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImpl.kt
LineNumber : 27
Line       :                         BookingStatus.fromFcmString(bookingApi.getBooking(bookingId).status)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImpl.kt
LineNumber : 28
Line       :                     }.getOrDefault(BookingStatus.Unknown)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\data\tracking\TrackingRepositoryImpl.kt
LineNumber : 48
Line       :                                     state.copy(status = BookingStatus.fromFcmString(event.status))

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\booking\model\CustomerBooking.kt
LineNumber : 8
Line       :     val status: CustomerBookingStatus,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\booking\model\CustomerBooking.kt
LineNumber : 18
Line       : public enum class CustomerBookingStatus {

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\booking\model\CustomerBooking.kt
LineNumber : 20
Line       :     PAID,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\booking\model\CustomerBooking.kt
LineNumber : 27
Line       :     COMPLETED,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\booking\model\CustomerBooking.kt
LineNumber : 28
Line       :     CLOSED,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\locale\LocaleRepository.kt
LineNumber : 12
Line       :     public suspend fun markFirstLaunchCompleted()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\locale\SetAppLocaleUseCase.kt
LineNumber : 16
Line       :             repo.markFirstLaunchCompleted()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\rating\RatingSubmitFailure.kt
LineNumber : 18
Line       :     /** Booking closed without a technician ever being assigned — nothing to rate. */

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\rating\RatingSubmitFailure.kt
LineNumber : 25
Line       :     BookingNotClosed(retryable = false),

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\serviceArea\LocalServiceAreaCheck.kt
LineNumber : 78
Line       :  * @param ring list of (lng, lat) pairs; may be open or closed (last == first is ignored)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\technician\model\TechnicianProfile.kt
LineNumber : 13
Line       :     val totalJobsCompleted: Int,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\TrackBookingStatusUseCase.kt
LineNumber : 3
Line       : import com.homeservices.customer.domain.tracking.model.BookingStatus

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\TrackBookingStatusUseCase.kt
LineNumber : 8
Line       : public class TrackBookingStatusUseCase

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\TrackBookingStatusUseCase.kt
LineNumber : 13
Line       :         public fun execute(bookingId: String): Flow<BookingStatus> = 
             repository.trackBooking(bookingId).map { it.status }

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 3
Line       : public sealed class BookingStatus {

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 4
Line       :     public object PendingPayment : BookingStatus()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 6
Line       :     public object Paid : BookingStatus()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 8
Line       :     public object Searching : BookingStatus()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 10
Line       :     public object Assigned : BookingStatus()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 12
Line       :     public object EnRoute : BookingStatus()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 14
Line       :     public object Reached : BookingStatus()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 16
Line       :     public object InProgress : BookingStatus()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 18
Line       :     public object Completed : BookingStatus()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 20
Line       :     public object AwaitingPriceApproval : BookingStatus()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 22
Line       :     public object Cancelled : BookingStatus()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 24
Line       :     public object Closed : BookingStatus()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 26
Line       :     public object Unfulfilled : BookingStatus()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 28
Line       :     public object Unknown : BookingStatus()

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 31
Line       :         public fun fromFcmString(value: String): BookingStatus =

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 34
Line       :                 "PAID" -> Paid

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 41
Line       :                 "COMPLETED" -> Completed

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatus.kt
LineNumber : 45
Line       :                 "CLOSED" -> Closed

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 15
Line       :  * Deliberately exhaustive with no `else` branch: adding a new [BookingStatus] will fail compilation

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 18
Line       :  * [BookingStatus.Unknown] FAILS OPEN — see below.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 20
Line       : public val BookingStatus.isSosEligible: Boolean

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 23
Line       :             BookingStatus.Assigned,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 24
Line       :             BookingStatus.EnRoute,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 25
Line       :             BookingStatus.Reached,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 26
Line       :             BookingStatus.InProgress,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 27
Line       :             BookingStatus.AwaitingPriceApproval,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 33
Line       :             // `BookingStatus.fromFcmString` maps every unrecognised server string to `Unknown`

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 34
Line       :             // (BookingStatus.kt:46), so a NEW backend status — say ON_SITE or TECHNICIAN_WAITING —

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 42
Line       :             BookingStatus.Unknown,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 45
Line       :             BookingStatus.PendingPayment,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 46
Line       :             BookingStatus.Paid,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 47
Line       :             BookingStatus.Searching,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 48
Line       :             BookingStatus.Completed,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 49
Line       :             BookingStatus.Cancelled,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 50
Line       :             BookingStatus.Closed,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\BookingStatusSosEligibility.kt
LineNumber : 51
Line       :             BookingStatus.Unfulfilled,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\domain\tracking\model\TrackingState.kt
LineNumber : 5
Line       :     val status: BookingStatus,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt
LineNumber : 128
Line       :             "BOOKING_STATUS_UPDATE" -> handleBookingStatusUpdate(data, bookingId)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\firebase\CustomerFirebaseMessagingService.kt
LineNumber : 268
Line       :     private fun handleBookingStatusUpdate(

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\navigation\AppNavigation.kt
LineNumber : 37
Line       : import com.homeservices.customer.ui.rating.RatingRoutes

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\navigation\AppNavigation.kt
LineNumber : 341
Line       :                 navController.navigate(RatingRoutes.route(intent.entityId)) { launchSingleTop = true }

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\navigation\CustomerRoutes.kt
LineNumber : 112
Line       : public data class RatingRoute(

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\navigation\MainGraph.kt
LineNumber : 34
Line       : import com.homeservices.customer.ui.rating.RatingRoutes

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\navigation\MainGraph.kt
LineNumber : 35
Line       : import com.homeservices.customer.ui.rating.RatingScreen

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\navigation\MainGraph.kt
LineNumber : 96
Line       :             onRateBooking = { id -> navController.navigate(RatingRoutes.route(id)) },

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\navigation\MainGraph.kt
LineNumber : 113
Line       :                         navController.navigate(RatingRoutes.route(bookingId))

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\navigation\MainGraph.kt
LineNumber : 193
Line       :             route = RatingRoutes.ROUTE,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\navigation\MainGraph.kt
LineNumber : 196
Line       :             RatingScreen(

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt
LineNumber : 4
Line       : import com.homeservices.customer.ui.rating.RatingRoutes

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\navigation\PendingActionNavObserver.kt
LineNumber : 42
Line       :         PendingActionType.RATING_PROMPT_CUSTOMER -> RatingRoutes.route(entityId)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\booking\BookingConfirmedScreen.kt
LineNumber : 177
Line       :                 title = stringResource(R.string.booking_timeline_paid),

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\booking\BookingConfirmedScreen.kt
LineNumber : 178
Line       :                 body = stringResource(R.string.booking_timeline_paid_body),

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\booking\BookingViewModel.kt
LineNumber : 123
Line       :          * - null activity: fail closed, do NOT proceed.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\booking\PriceApprovalViewModel.kt
LineNumber : 45
Line       :          * - null activity: fail closed, show error.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 51
Line       : import com.homeservices.customer.domain.booking.model.CustomerBookingStatus

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 249
Line       :                 text = stringResource(R.string.bookings_rate_booking),

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 395
Line       : private fun CustomerBookingStatus.labelRes(): String =

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 398
Line       : private val BOOKING_STATUS_RES_IDS: Map<CustomerBookingStatus, Int> =

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 400
Line       :         CustomerBookingStatus.PENDING_PAYMENT to R.string.booking_status_pending_payment,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 401
Line       :         CustomerBookingStatus.PAID to R.string.booking_status_paid,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 402
Line       :         CustomerBookingStatus.SEARCHING to R.string.booking_status_searching,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 403
Line       :         CustomerBookingStatus.ASSIGNED to R.string.booking_status_assigned,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 404
Line       :         CustomerBookingStatus.EN_ROUTE to R.string.booking_status_en_route,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 405
Line       :         CustomerBookingStatus.REACHED to R.string.booking_status_reached,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 406
Line       :         CustomerBookingStatus.IN_PROGRESS to R.string.booking_status_in_progress,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 407
Line       :         CustomerBookingStatus.AWAITING_PRICE_APPROVAL to R.string.booking_status_awaiting_price_approval,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 408
Line       :         CustomerBookingStatus.COMPLETED to R.string.booking_status_completed,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 409
Line       :         CustomerBookingStatus.CLOSED to R.string.booking_status_closed,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 410
Line       :         CustomerBookingStatus.UNFULFILLED to R.string.booking_status_unfulfilled,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 411
Line       :         CustomerBookingStatus.CUSTOMER_CANCELLED to R.string.booking_status_cancelled,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 412
Line       :         CustomerBookingStatus.NO_SHOW_REDISPATCH to R.string.booking_status_reassigning,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 413
Line       :         CustomerBookingStatus.UNKNOWN to R.string.booking_status_updated,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 416
Line       : private fun CustomerBookingStatus.canOpenTracking(): Boolean =

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 419
Line       :             CustomerBookingStatus.PAID,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 420
Line       :             CustomerBookingStatus.SEARCHING,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 421
Line       :             CustomerBookingStatus.ASSIGNED,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 422
Line       :             CustomerBookingStatus.EN_ROUTE,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 423
Line       :             CustomerBookingStatus.REACHED,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 424
Line       :             CustomerBookingStatus.IN_PROGRESS,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 425
Line       :             CustomerBookingStatus.AWAITING_PRICE_APPROVAL,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 426
Line       :             CustomerBookingStatus.NO_SHOW_REDISPATCH,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 429
Line       : private val TRACKABLE_STATUSES: Set<CustomerBookingStatus> =

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 431
Line       :         CustomerBookingStatus.ASSIGNED,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 432
Line       :         CustomerBookingStatus.EN_ROUTE,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 433
Line       :         CustomerBookingStatus.REACHED,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 434
Line       :         CustomerBookingStatus.IN_PROGRESS,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 435
Line       :         CustomerBookingStatus.AWAITING_PRICE_APPROVAL,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 438
Line       : private fun CustomerBookingStatus.isLiveTracking(): Boolean =

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 441
Line       :             CustomerBookingStatus.EN_ROUTE,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 442
Line       :             CustomerBookingStatus.REACHED,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 443
Line       :             CustomerBookingStatus.IN_PROGRESS,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\bookings\CustomerBookingsScreen.kt
LineNumber : 446
Line       : private fun CustomerBookingStatus.isPostService(): Boolean = this == CustomerBookingStatus.COMPLETED || 
             this == CustomerBookingStatus.CLOSED

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeTabContent.kt
LineNumber : 40
Line       : import com.homeservices.customer.domain.booking.model.CustomerBookingStatus

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeTabContent.kt
LineNumber : 236
Line       :     setOf(CustomerBookingStatus.AWAITING_PRICE_APPROVAL)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeTabContent.kt
LineNumber : 257
Line       :     val statusLabel = activeBookingStatusLabel(booking.status)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeTabContent.kt
LineNumber : 337
Line       : private fun activeBookingStatusLabel(status: CustomerBookingStatus): String =

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeTabContent.kt
LineNumber : 339
Line       :         CustomerBookingStatus.SEARCHING -> stringResource(R.string.status_finding_technician)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeTabContent.kt
LineNumber : 340
Line       :         CustomerBookingStatus.ASSIGNED -> stringResource(R.string.status_technician_assigned)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeTabContent.kt
LineNumber : 341
Line       :         CustomerBookingStatus.EN_ROUTE -> stringResource(R.string.status_technician_on_way)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeTabContent.kt
LineNumber : 342
Line       :         CustomerBookingStatus.REACHED -> stringResource(R.string.status_technician_arrived)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeTabContent.kt
LineNumber : 343
Line       :         CustomerBookingStatus.IN_PROGRESS -> stringResource(R.string.status_work_in_progress)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeTabContent.kt
LineNumber : 344
Line       :         CustomerBookingStatus.AWAITING_PRICE_APPROVAL -> 
             stringResource(R.string.status_price_approval_needed)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeUiState.kt
LineNumber : 12
Line       :  * - [Ready.recentBookings] — last 5 COMPLETED bookings sorted newest-first (E11-S03 §AC-4)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeViewModel.kt
LineNumber : 11
Line       : import com.homeservices.customer.domain.booking.model.CustomerBookingStatus

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeViewModel.kt
LineNumber : 31
Line       :  * 3. [recentBookingsFlow] — last 5 COMPLETED bookings from [BookingRepository].

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeViewModel.kt
LineNumber : 107
Line       :                         ?.filter { it.status == CustomerBookingStatus.COMPLETED }

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeViewModel.kt
LineNumber : 115
Line       :                     result.getOrNull()?.firstOrNull { it.status == CustomerBookingStatus.PENDING_PAYMENT }

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeViewModel.kt
LineNumber : 140
Line       :                     CustomerBookingStatus.SEARCHING,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeViewModel.kt
LineNumber : 141
Line       :                     CustomerBookingStatus.ASSIGNED,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeViewModel.kt
LineNumber : 142
Line       :                     CustomerBookingStatus.EN_ROUTE,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeViewModel.kt
LineNumber : 143
Line       :                     CustomerBookingStatus.REACHED,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeViewModel.kt
LineNumber : 144
Line       :                     CustomerBookingStatus.IN_PROGRESS,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\catalogue\CustomerHomeViewModel.kt
LineNumber : 145
Line       :                     CustomerBookingStatus.AWAITING_PRICE_APPROVAL,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\dataexport\DataExportUiState.kt
LineNumber : 23
Line       :      * SAF write completed successfully.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\deleteaccount\DeleteAccountViewModel.kt
LineNumber : 102
Line       :          * Fail-closed: null activity -> error, do NOT proceed.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\rating\RatingRoutes.kt
LineNumber : 3
Line       : public object RatingRoutes {

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\rating\RatingScreen.kt
LineNumber : 54
Line       : public fun RatingScreen(

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\rating\RatingScreen.kt
LineNumber : 287
Line       :         RatingSubmitFailure.BookingNotClosed -> R.string.rating_submit_error_not_closed

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\shared\TrustDossierCard.kt
LineNumber : 178
Line       :                         "${stringResource(R.string.trust_dossier_jobs, profile.totalJobsCompleted)}, " +

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 56
Line       : import com.homeservices.customer.domain.tracking.model.BookingStatus

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 319
Line       :         if (state.status is BookingStatus.Closed) {

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 359
Line       : private fun StatusTimeline(currentStatus: BookingStatus) {

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 362
Line       :             BookingStatus.EnRoute to stringResource(R.string.status_en_route),

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 363
Line       :             BookingStatus.Reached to stringResource(R.string.status_reached),

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 364
Line       :             BookingStatus.InProgress to stringResource(R.string.status_in_progress),

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 365
Line       :             BookingStatus.Completed to stringResource(R.string.status_done),

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 396
Line       : private fun statusLabel(status: BookingStatus): String =

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 398
Line       :         BookingStatus.PendingPayment -> "Payment pending"

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 399
Line       :         BookingStatus.Paid -> "Booking confirmed"

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 400
Line       :         BookingStatus.Searching -> "Finding technician"

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 401
Line       :         BookingStatus.Assigned -> "Technician assigned"

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 402
Line       :         BookingStatus.EnRoute -> "Technician on the way"

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 403
Line       :         BookingStatus.Reached -> "Technician arrived"

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 404
Line       :         BookingStatus.InProgress -> "Work in progress"

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 405
Line       :         BookingStatus.AwaitingPriceApproval -> "Price approval needed"

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 406
Line       :         BookingStatus.Completed -> "Service completed"

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 407
Line       :         BookingStatus.Closed -> "Booking closed"

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 408
Line       :         BookingStatus.Cancelled -> "Booking cancelled"

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 409
Line       :         BookingStatus.Unfulfilled -> "Technician unavailable"

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingScreen.kt
LineNumber : 410
Line       :         BookingStatus.Unknown -> "Status unavailable"

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingUiState.kt
LineNumber : 3
Line       : import com.homeservices.customer.domain.tracking.model.BookingStatus

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingUiState.kt
LineNumber : 12
Line       :         val status: BookingStatus,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingViewModel.kt
LineNumber : 9
Line       : import com.homeservices.customer.domain.tracking.TrackBookingStatusUseCase

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingViewModel.kt
LineNumber : 24
Line       :         private val trackBookingStatusUseCase: TrackBookingStatusUseCase,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\mai
             n\kotlin\com\homeservices\customer\ui\tracking\LiveTrackingViewModel.kt
LineNumber : 37
Line       :                 trackBookingStatusUseCase.execute(bookingId),




2026-09-05T12:57:33.947682Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'customer-app/app/src/main/kotlin/com/homeservices/customer/ui/bookings/CustomerBookingsScreen.kt'; "'$i=1; Get-Content $f | ForEach-Object { if($i -ge 330 -and $i -le 455){'"'{0,4}: {1}' -f "'$i,$_}; $i++ }' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 520ms:
 330:         shape = RoundedCornerShape(20.dp),
 331:         color = MaterialTheme.colorScheme.surface,
 332:         tonalElevation = 1.dp,
 333:     ) {
 334:         Column(
 335:             modifier = Modifier.padding(16.dp),
 336:             verticalArrangement = Arrangement.spacedBy(10.dp),
 337:         ) {
 338:             Text(
 339:                 text = stringResource(R.string.bookings_error_title),
 340:                 style = MaterialTheme.typography.titleMedium,
 341:                 fontWeight = FontWeight.Bold,
 342:                 color = MaterialTheme.colorScheme.onSurface,
 343:             )
 344:             Text(
 345:                 text = stringResource(R.string.bookings_error_body),
 346:                 style = MaterialTheme.typography.bodyMedium,
 347:                 color = MaterialTheme.colorScheme.onSurfaceVariant,
 348:             )
 349:             HsSecondaryButton(
 350:                 text = stringResource(R.string.bookings_retry),
 351:                 onClick = onRefresh,
 352:                 modifier = Modifier.fillMaxWidth(),
 353:             )
 354:         }
 355:     }
 356: }
 357: 
 358: @Composable
 359: private fun EmptyBookingsCard() {
 360:     Column(
 361:         modifier = Modifier.padding(32.dp),
 362:         horizontalAlignment = Alignment.CenterHorizontally,
 363:         verticalArrangement = Arrangement.spacedBy(12.dp),
 364:     ) {
 365:         Box(
 366:             modifier =
 367:                 Modifier
 368:                     .size(56.dp)
 369:                     .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(20.dp)),
 370:             contentAlignment = Alignment.Center,
 371:         ) {
 372:             Icon(
 373:                 imageVector = Icons.Default.BookOnline,
 374:                 contentDescription = null,
 375:                 tint = MaterialTheme.colorScheme.primary,
 376:                 modifier = Modifier.size(28.dp),
 377:             )
 378:         }
 379:         Text(
 380:             text = stringResource(R.string.bookings_no_bookings),
 381:             style = MaterialTheme.typography.titleMedium,
 382:             fontWeight = FontWeight.Bold,
 383:             color = MaterialTheme.colorScheme.onSurface,
 384:         )
 385:         Text(
 386:             text = stringResource(R.string.bookings_no_bookings_body),
 387:             style = MaterialTheme.typography.bodyMedium,
 388:             color = MaterialTheme.colorScheme.onSurfaceVariant,
 389:             textAlign = TextAlign.Center,
 390:         )
 391:     }
 392: }
 393: 
 394: @Composable
 395: private fun CustomerBookingStatus.labelRes(): String =
 396:     stringResource(BOOKING_STATUS_RES_IDS.getOrDefault(this, R.string.booking_status_updated))
 397: 
 398: private val BOOKING_STATUS_RES_IDS: Map<CustomerBookingStatus, Int> =
 399:     mapOf(
 400:         CustomerBookingStatus.PENDING_PAYMENT to R.string.booking_status_pending_payment,
 401:         CustomerBookingStatus.PAID to R.string.booking_status_paid,
 402:         CustomerBookingStatus.SEARCHING to R.string.booking_status_searching,
 403:         CustomerBookingStatus.ASSIGNED to R.string.booking_status_assigned,
 404:         CustomerBookingStatus.EN_ROUTE to R.string.booking_status_en_route,
 405:         CustomerBookingStatus.REACHED to R.string.booking_status_reached,
 406:         CustomerBookingStatus.IN_PROGRESS to R.string.booking_status_in_progress,
 407:         CustomerBookingStatus.AWAITING_PRICE_APPROVAL to R.string.booking_status_awaiting_price_approval,
 408:         CustomerBookingStatus.COMPLETED to R.string.booking_status_completed,
 409:         CustomerBookingStatus.CLOSED to R.string.booking_status_closed,
 410:         CustomerBookingStatus.UNFULFILLED to R.string.booking_status_unfulfilled,
 411:         CustomerBookingStatus.CUSTOMER_CANCELLED to R.string.booking_status_cancelled,
 412:         CustomerBookingStatus.NO_SHOW_REDISPATCH to R.string.booking_status_reassigning,
 413:         CustomerBookingStatus.UNKNOWN to R.string.booking_status_updated,
 414:     )
 415: 
 416: private fun CustomerBookingStatus.canOpenTracking(): Boolean =
 417:     this in
 418:         setOf(
 419:             CustomerBookingStatus.PAID,
 420:             CustomerBookingStatus.SEARCHING,
 421:             CustomerBookingStatus.ASSIGNED,
 422:             CustomerBookingStatus.EN_ROUTE,
 423:             CustomerBookingStatus.REACHED,
 424:             CustomerBookingStatus.IN_PROGRESS,
 425:             CustomerBookingStatus.AWAITING_PRICE_APPROVAL,
 426:             CustomerBookingStatus.NO_SHOW_REDISPATCH,
 427:         )
 428: 
 429: private val TRACKABLE_STATUSES: Set<CustomerBookingStatus> =
 430:     setOf(
 431:         CustomerBookingStatus.ASSIGNED,
 432:         CustomerBookingStatus.EN_ROUTE,
 433:         CustomerBookingStatus.REACHED,
 434:         CustomerBookingStatus.IN_PROGRESS,
 435:         CustomerBookingStatus.AWAITING_PRICE_APPROVAL,
 436:     )
 437: 
 438: private fun CustomerBookingStatus.isLiveTracking(): Boolean =
 439:     this in
 440:         setOf(
 441:             CustomerBookingStatus.EN_ROUTE,
 442:             CustomerBookingStatus.REACHED,
 443:             CustomerBookingStatus.IN_PROGRESS,
 444:         )
 445: 
 446: private fun CustomerBookingStatus.isPostService(): Boolean = this == CustomerBookingStatus.COMPLETED || this == CustomerBookingStatus.CLOSED
 447: 
 448: @Composable
 449: private fun BookingPaymentMethod.labelRes(): String =
 450:     when (this) {
 451:         BookingPaymentMethod.RAZORPAY -> stringResource(R.string.payment_method_online)
 452:         BookingPaymentMethod.CASH_ON_SERVICE -> stringResource(R.string.payment_method_cash)
 453:     }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'customer-app/app/src/main/kotlin/com/homeservices/customer/ui/bookings/CustomerBookingsScreen.kt'; "'$i=1; Get-Content $f | ForEach-Object { if($i -ge 230 -and $i -le 330){'"'{0,4}: {1}' -f "'$i,$_}; $i++ }' in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 497ms:
 230:     onTrackBooking: (String) -> Unit,
 231:     onRateBooking: (String) -> Unit,
 232:     onComplainBooking: (String) -> Unit,
 233: ) {
 234:     if (booking.status.canOpenTracking()) {
 235:         HsPrimaryButton(
 236:             text =
 237:                 if (booking.status.isLiveTracking()) {
 238:                     stringResource(R.string.bookings_track_technician)
 239:                 } else {
 240:                     stringResource(R.string.bookings_view_status)
 241:                 },
 242:             onClick = { onTrackBooking(booking.bookingId) },
 243:             modifier = Modifier.fillMaxWidth(),
 244:         )
 245:     }
 246:     if (booking.status.isPostService()) {
 247:         if (!booking.ratingSubmitted) {
 248:             HsPrimaryButton(
 249:                 text = stringResource(R.string.bookings_rate_booking),
 250:                 onClick = { onRateBooking(booking.bookingId) },
 251:                 modifier = Modifier.fillMaxWidth(),
 252:             )
 253:         }
 254:         HsSecondaryButton(
 255:             text = stringResource(R.string.bookings_file_complaint),
 256:             onClick = { onComplainBooking(booking.bookingId) },
 257:             modifier = Modifier.fillMaxWidth(),
 258:         )
 259:     }
 260: }
 261: 
 262: @Composable
 263: private fun InfoLine(
 264:     icon: ImageVector,
 265:     text: String,
 266: ) {
 267:     Row(
 268:         verticalAlignment = Alignment.CenterVertically,
 269:         horizontalArrangement = Arrangement.spacedBy(8.dp),
 270:     ) {
 271:         Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(18.dp))
 272:         Text(
 273:             text = text,
 274:             style = MaterialTheme.typography.bodyMedium,
 275:             color = MaterialTheme.colorScheme.onSurfaceVariant,
 276:             maxLines = 2,
 277:             overflow = TextOverflow.Ellipsis,
 278:         )
 279:     }
 280: }
 281: 
 282: @Suppress("MagicNumber") // 0xFFB68A2C = fixed amber text on WarningSoft (light bg); visible in dark mode
 283: @Composable
 284: private fun StatusPill(
 285:     label: String,
 286:     active: Boolean,
 287: ) {
 288:     Surface(
 289:         shape = RoundedCornerShape(999.dp),
 290:         color = if (active) MaterialTheme.colorScheme.surfaceVariant else WarningSoft,
 291:     ) {
 292:         Text(
 293:             text = label,
 294:             modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
 295:             style = MaterialTheme.typography.labelMedium,
 296:             fontWeight = FontWeight.SemiBold,
 297:             // WarningSoft is a fixed light amber background â€” use a fixed dark-amber foreground so
 298:             // the inactive pill remains readable in dark mode (secondary is light in dark theme).
 299:             color = if (active) MaterialTheme.colorScheme.primary else Color(0xFFB68A2C),
 300:         )
 301:     }
 302: }
 303: 
 304: @Composable
 305: private fun LoadingCard() {
 306:     Surface(
 307:         modifier = Modifier.fillMaxWidth(),
 308:         shape = RoundedCornerShape(20.dp),
 309:         color = MaterialTheme.colorScheme.surface,
 310:     ) {
 311:         Column(
 312:             modifier = Modifier.padding(16.dp),
 313:             verticalArrangement = Arrangement.spacedBy(10.dp),
 314:         ) {
 315:             repeat(3) {
 316:                 Surface(
 317:                     modifier = Modifier.fillMaxWidth().height(18.dp),
 318:                     shape = RoundedCornerShape(8.dp),
 319:                     color = MaterialTheme.colorScheme.surfaceVariant,
 320:                 ) {}
 321:             }
 322:         }
 323:     }
 324: }
 325: 
 326: @Composable
 327: private fun ErrorCard(onRefresh: () -> Unit) {
 328:     Surface(
 329:         modifier = Modifier.fillMaxWidth(),
 330:         shape = RoundedCornerShape(20.dp),

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path docs/**/*.md -Pattern 'Rating Shield|rate|COMPLETED|CLOSED|booking.status|rating' | Select-Object -First 200 Path,LineNumber,Line | Format-List" in C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error
 succeeded in 800ms:


Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0001-primary-stack-choice.md
LineNumber : 15
Line       : - **Mobile (both apps):** **Kotlin 2.x + Jetpack Compose + Material Design 3.** Two separate Android 
             Gradle codebases (`customer-app/`, `technician-app/`) sharing a single design-system Gradle module. 
             Android-only at MVP; iOS deferred to Phase 4 with a separate ADR.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0002-fcm-univer
             sal-messaging-spine.md
LineNumber : 10
Line       : 1. Customer sees live booking status (searching → assigned → en-route → reached → in-progress → completed)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0002-fcm-univer
             sal-messaging-spine.md
LineNumber : 22
Line       : - Backend publishes FCM data messages for: booking status transitions, job offers, tech location pings, 
             chat messages, marketing campaigns (Phase 2).

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0002-fcm-univer
             sal-messaging-spine.md
LineNumber : 40
Line       : - One-time OTP SMS at Firebase Phone Auth rates (~₹0.40/SMS) still costs something. Mitigated to ~₹40/mo 
             steady state by Truecaller-first (ADR-0005).

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0003-cosmos-db-serverless-sor.md
LineNumber : 9
Line       : The product needs a primary system of record for bookings, technicians, customers, ratings, complaints, 
             wallet ledger, audit log, catalogue, and booking events. Real-time dispatch requires geospatial queries 
             (nearest-tech search). Owner admin needs change-feed-driven live updates. Compliance needs an append-only 
             audit log. Free-tier compatibility is binding (NFR-M-1).

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0003-cosmos-db-serverless-sor.md
LineNumber : 17
Line       : - **Partitioning strategy:**

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0003-cosmos-db-serverless-sor.md
LineNumber : 23
Line       :   - `ratings`: partition by `bookingId`

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0004-azure-func
             tions-consumption.md
LineNumber : 32
Line       : - Multiple trigger types in one compute plane — no need to run cron jobs on a separate VM.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0004-azure-func
             tions-consumption.md
LineNumber : 39
Line       :   - Mitigation 3: accept 1-2s cold start for non-critical endpoints (service catalogue fetch is 
             cacheable; booking creation tolerates 2s).

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0006-dispatch-algorithm.md
LineNumber : 20
Line       :    - Filter: `skill ⊇ booking.category` AND `available_in_slot(bookingSlot)` AND `ST_DWITHIN(geo, 
             bookingGeo, 5000 meters)` AND `rating ≥ 3.5` AND `acceptance_rate_30d ≥ 30%`

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0006-dispatch-algorithm.md
LineNumber : 27
Line       :          + 0.3 × normalized_rating

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0006-dispatch-algorithm.md
LineNumber : 29
Line       :          + 0.1 × acceptance_rate_30d

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0006-dispatch-algorithm.md
LineNumber : 77
Line       : - **Distance-only ranking** — ignores rating and recency. Creates "stuck at the same tech" patterns. 
             Rejected.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0007-zero-paid-
             saas-constraint.md
LineNumber : 41
Line       : - Strategic wedge vs UC (Innovation I-1) maintained.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0007-zero-paid-
             saas-constraint.md
LineNumber : 52
Line       : - We accept the discipline as a strategic moat. The constraint makes the architecture better, not worse.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0007-zero-paid-
             saas-constraint.md
LineNumber : 62
Line       : | Azure Form Recognizer | 500 pages/mo | 10× tech onboarding rate |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0007-zero-paid-
             saas-constraint.md
LineNumber : 68
Line       : | Firebase Phone Auth | ~₹0.40/SMS — near-zero at steady state (Truecaller-first) | 20× fallback rate |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0007-zero-paid-
             saas-constraint.md
LineNumber : 69
Line       : | Firebase Storage | 5 GB + 1 GB/day download | several years at pilot rate |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0007-zero-paid-
             saas-constraint.md
LineNumber : 88
Line       : | `openapi-typescript` | MIT | admin-web/ dev — generates schema.d.ts from committed spec | never |

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0009-openapi-client-generator.md
LineNumber : 31
Line       : **Artifact strategy:** committed (`api/openapi.json`, `admin-web/src/api/generated/**`); CI drift-checks 
             both.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0009-openapi-client-generator.md
LineNumber : 43
Line       : | Regenerate at build time (not committed) | Obscures review; CI would need a special "pretend no drift" 
             path; drift only detectable at runtime. |

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0009-openapi-client-generator.md
LineNumber : 44
Line       : | Hand-written seed OpenAPI spec | A generated client from a hand-written spec never fails on drift — lie 
             detector that doesn't fire. |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0010-design-sys
             tem-composite-build.md
LineNumber : 11
Line       : ADR-0001 also committed to "two separate Android codebases" — each app has its own Gradle root 
             (`customer-app/`, `technician-app/`) with independent `settings.gradle.kts`, independent CI workflow 
             (`customer-ship.yml`, `technician-ship.yml`), and no root-of-repo Gradle build. A shared Kotlin library 
             must therefore be distributed somehow; four options exist:

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0010-design-sys
             tem-composite-build.md
LineNumber : 15
Line       : 3. **Root-of-repo `settings.gradle.kts`** — single Gradle build orchestrating `include(":design-system", 
             ":customer-app:app", ":technician-app:app")`.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0010-design-sys
             tem-composite-build.md
LineNumber : 18
Line       : The ₹0-infra constraint (ADR-0007) and the "two separate codebases" principle (ADR-0001) combine to make 
             this a non-trivial choice.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0010-design-sys
             tem-composite-build.md
LineNumber : 29
Line       : - **Zero infrastructure.** No artifact repository to host, no publish step to orchestrate in CI. Token 
             changes ripple to both apps on the next build.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0010-design-sys
             tem-composite-build.md
LineNumber : 47
Line       : | **Maven Local publish (option 2)** | Adds a manual `publishToMavenLocal` step on every design-system 
             change. CI must orchestrate publish-then-app-build. Fragile — developers forget the publish step; token 
             edits appear to not propagate. |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0010-design-sys
             tem-composite-build.md
LineNumber : 48
Line       : | **Root-of-repo `settings.gradle.kts` (option 3)** | Violates ADR-0001's "two separate Android 
             codebases" principle. Couples app independence; a single Gradle failure blocks both apps' CI. Loses the 
             per-app `-ship.yml` isolation that lets customer PRs not re-run technician Paparazzi. |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0011-karnataka-
             decline-history-isolation.md
LineNumber : 6
Line       : - **Supersedes:** the compliance section (§"Compliance enforcement") of ADR-0006, which contemplated 
             `acceptance_rate_30d` as a candidate filter and ranking input. The implementation in 
             `api/src/services/dispatcher.service.ts` never adopted that field, and this ADR ratifies the stricter 
             actual behavior.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0011-karnataka-
             decline-history-isolation.md
LineNumber : 16
Line       : - The implementation diverged in the strict direction — even `acceptance_rate_30d` (which ADR-0006 
             proposed) was never added, because it is mathematically `1 − declineRate` and therefore decline-derived.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0011-karnataka-
             decline-history-isolation.md
LineNumber : 18
Line       : - The actual `dispatcher-up-ranking.test.ts` test passes, but it does not on its own assert *which* 
             fields the function is allowed to read — it only asserts ranking invariance for a single phantom field. A 
             motivated developer could add an `acceptRate` term and the existing test could still pass given specific 
             inputs.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0011-karnataka-
             decline-history-isolation.md
LineNumber : 32
Line       : `api/.semgrep.yml` defines rule `karnataka-no-decline-in-dispatcher` which fails with severity `ERROR` on 
             any occurrence of `declineCount`, `declineHistory`, `declineRatio`, `pastDeclines`, `rejectionCount`, 
             `rejectionHistory`, `acceptRate`, or `acceptanceRate` in:

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0011-karnataka-
             decline-history-isolation.md
LineNumber : 55
Line       : 3. Demonstrate a separate code path that is structurally unable to feed `dispatcher.service.ts` (separate 
             file, separate import graph) for analytics/dashboard use cases.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0011-karnataka-
             decline-history-isolation.md
LineNumber : 62
Line       : - Future ranking improvements based on **non-decline** signals (`completedJobCount`, distance, rating) 
             are explicitly allowed without revising this ADR.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0011-karnataka-
             decline-history-isolation.md
LineNumber : 67
Line       : - Future legitimate analytics features that need decline data must live in a separate code path with no 
             import line-of-sight to `dispatcher.service.ts` — this constrains module organization.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0011-karnataka-
             decline-history-isolation.md
LineNumber : 70
Line       : - The forbidden-token list is finite and may need to grow if future code introduces synonyms (e.g., 
             `noShowRate`). The lint rule and the data-isolation test should be extended together when that happens.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0011-karnataka-
             decline-history-isolation.md
LineNumber : 75
Line       : - **Runtime test only (existing `dispatcher-up-ranking.test.ts`).** Rejected — invariance for one phantom 
             field does not prove the function reads no decline-derived field at all. A developer could add 
             `acceptRate` and craft test inputs that still pass.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0012-dpdp-rights-endpoints.md
LineNumber : 33
Line       :    pilot stack touches (bookings, ratings, complaints, technician profile,

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0012-dpdp-rights-endpoints.md
LineNumber : 55
Line       :    - **Anonymize-and-retain:** bookings, ratings, complaints, wallet ledger,

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0012-dpdp-rights-endpoints.md
LineNumber : 60
Line       :      finance reconciliation, audit, and the platform-rating average — but

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0012-dpdp-rights-endpoints.md
LineNumber : 95
Line       : - Anonymization preserves operational invariants: rating average, financial

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0013-audit-log-immutability.md
LineNumber : 10
Line       : to maintain accurate, complete, consistent records of processing activities),

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0013-audit-log-immutability.md
LineNumber : 87
Line       : `CONTAINER`-metavariable patterns are deliberately excluded from this rule

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0013-audit-log-immutability.md
LineNumber : 159
Line       :   All four together close every gap we could enumerate during W2-4.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0013-audit-log-immutability.md
LineNumber : 167
Line       :   triage, auth events, system events), and enumerating the full set

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0013-audit-log-immutability.md
LineNumber : 169
Line       :   flight. Filed as a separate follow-up. The current `z.string()` is

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0013-audit-log-immutability.md
LineNumber : 178
Line       : 2. **Tighten `AuditLogEntrySchema.action` to a closed enum** once W2-2

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0014-admin-auth-hardening.md
LineNumber : 64
Line       : - Consider rate-limiting and audit-logging failed `X-Setup-Secret` attempts to prevent brute force (noted 
             in AC-5 security review).

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0015-kyc-pii-encryption.md
LineNumber : 34
Line       : - **IV:** 12 random bytes generated per call via `node:crypto.randomBytes(12)`

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0015-kyc-pii-encryption.md
LineNumber : 58
Line       : 1. Generate a new 32-byte key: `node -e 
             "console.log(require('crypto').randomBytes(32).toString('base64'))"`

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0016-admin-web-
             bilingual-from-mvp.md
LineNumber : 10
Line       : `docs/architecture.md:56` explicitly exempted admin-web from MVP i18n scope on the assumption that the 
             sole admin user is an English-fluent solo founder. The Ayodhya/UP pivot (memory 
             `project_pivot_ayodhya_hindi.md`) changes the operating model: the first ops hire in Ayodhya will be 
             Hindi-first. Hindi-everywhere is a binding constraint across all sub-projects.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0017-customer-wallet-ledger.md
LineNumber : 59
Line       : ### 4. Apply-credit idempotency via separate container + 24h TTL

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0017-customer-wallet-ledger.md
LineNumber : 64
Line       : - A separate `applied_credit_idempotency` container (partitioned by `/customerId`) stores one doc per 
             idempotency key.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0017-customer-wallet-ledger.md
LineNumber : 68
Line       : **Why a separate container?** We want TTL at the container level, not per-document (Cosmos supports 
             per-doc TTL but requires the container to have TTL configured). A dedicated container isolates the 
             idempotency concern from the ledger.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0017-customer-wallet-ledger.md
LineNumber : 79
Line       : 2. **_etag optimistic concurrency (future hardening):** For true concurrent requests with *different* 
             idempotency keys (two separate booking attempts at the same time), the current implementation treats a 
             412 response from Cosmos as a non-fatal signal and falls back to `appliedCreditAmount: 0`. The booking 
             still succeeds — credit is just not applied. This is safe (no double-spend), just occasionally 
             conservative.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0017-customer-wallet-ledger.md
LineNumber : 105
Line       : Credit application is gated behind a GrowthBook feature flag. Default is `false` (fail-closed — never 
             silently spend customer money). The flag will be flipped to `true` after E13-S02 (WalletScreen) ships and 
             the balance is visible to the customer in the app.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0018-hindi-defa
             ult-customer-app.md
LineNumber : 44
Line       :    (₹ symbol + comma-separated thousands, e.g. ₹1,299) is locale-invariant within IN.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0018-hindi-defa
             ult-customer-app.md
LineNumber : 76
Line       : | Keep `"en"` default, add Hindi as option | Rejected — conflicts with Ayodhya-first strategy |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0018-hindi-defa
             ult-customer-app.md
LineNumber : 78
Line       : | Separate pilot vs mainstream app build | Rejected — increases build complexity; not needed at pilot 
             scale |

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0019-periodic-tech-location.md
LineNumber : 73
Line       : - **Booking status gate** — 409 `BOOKING_NOT_ACTIVE` for statuses outside `{EN_ROUTE, REACHED, 
             IN_PROGRESS}`.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0019-periodic-tech-location.md
LineNumber : 74
Line       : - **Rate limit** — 1 request per 15 s per `bookingId` via `withRateLimit` `keyExtractor`. Mitigates D-L1 
             (DoS on location endpoint, see threat-model).

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0020-service-area-gating.md
LineNumber : 44
Line       : **Generated by:** spherical destination-point formula (Vincenty-lite) at 0-degree bearing intervals of 
             360°/32 = 11.25°.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0020-service-area-gating.md
LineNumber : 65
Line       : - **Negative:** The 25 km radius is broader than strictly necessary — covers Faizabad city and 
             surrounding villages. May generate customer confusion ("why can't I book from Gonda?" when Gonda is just 
             outside 25 km). Mitigated by clear error message + `suggestedAction: "join_waitlist"`.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0020-service-area-gating.md
LineNumber : 76
Line       : - **PostGIS / Cosmos geospatial** — Cosmos DB Serverless has limited geospatial support; PostGIS requires 
             a separate DB server. Both add complexity and cost beyond the ₹0 constraint. Rejected.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0021-technician
             -app-network-module-and-auth-qualifier.md
LineNumber : 25
Line       :    pattern (`RatingModule`) defined the qualifier inside `data/rating/di/`, and 8 other

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0021-technician
             -app-network-module-and-auth-qualifier.md
LineNumber : 28
Line       : A separate finding noted that `HttpLoggingInterceptor` was set to `Level.BODY` for

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0021-technician
             -app-network-module-and-auth-qualifier.md
LineNumber : 36
Line       : - Owns the `@AuthOkHttpClient` qualifier (moved from `data/rating/di/RatingModule.kt`).

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0021-technician
             -app-network-module-and-auth-qualifier.md
LineNumber : 77
Line       : `AuthInterceptorCoverageTest` enumerates every auth-bearing ApiService via a

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0021-technician
             -app-network-module-and-auth-qualifier.md
LineNumber : 108
Line       : - HttpLoggingInterceptor leak in release builds is closed.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0021-technician
             -app-network-module-and-auth-qualifier.md
LineNumber : 127
Line       : - App Check wiring — separate story; `@UnauthOkHttpClient` qualifier reserves the seam.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0021-technician
             -app-network-module-and-auth-qualifier.md
LineNumber : 128
Line       : - `customer-app` parity for the HttpLoggingInterceptor leak fix (separate codemod).

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0022-defer-post
             hog-customer-app.md
LineNumber : 12
Line       : E18-S06 required a decision: integrate the PostHog Android SDK for product-analytics event capture now, 
             or defer to a later story.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0022-defer-post
             hog-customer-app.md
LineNumber : 53
Line       : - **Integrate PostHog now (rejected):** The SDK is not yet in `libs.versions.toml`. Adding it mid-story 
             increases PR scope beyond feature-tier limits and risks introducing an unreviewed dependency.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0022-defer-post
             hog-customer-app.md
LineNumber : 54
Line       : - **Use Firebase Analytics as interim (deferred):** Possible, but adds its own wiring overhead. Better 
             handled in E18-S07 where the analytics strategy can be decided holistically (PostHog vs Firebase 
             Analytics vs both).

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0023-observabil
             ity-stack-tech-app.md
LineNumber : 52
Line       : - PostHog gives product analytics on locale adoption rates in Ayodhya/UP market.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 1
Line       : # ADR-0024: Rating Shield Threshold — ≤2★ Narrow Default

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 9
Line       : The rating shield intercepts low-star submissions and offers the customer the option to send

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 10
Line       : their feedback to owner support privately before the rating is published. The shield fires when

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 11
Line       : the customer's overall star rating is at or below a configurable threshold.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 15
Line       : - **≤2★ (narrow)**: only 1-star and 2-star ratings trigger the shield.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 16
Line       : - **≤3★ (broad)**: ratings of 1, 2, or 3 stars trigger the shield.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 18
Line       : The threshold is stored as a Firebase Remote Config key (`rating_shield_threshold_stars`,

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 22
Line       : percentage of bookings will receive low ratings or at what rate customers use the escalate vs.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 30
Line       : of all completed bookings** hitting the shield (i.e., rating ≤2★). If the shield is firing that

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 33
Line       : rating.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 39
Line       : - **Positive:** Minimal friction for the majority of raters (3★, 4★, 5★ submitters see no shield).

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 42
Line       : - **Negative:** Customers giving a genuine 3★ rating (unsatisfied but not severely) receive no

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 50
Line       :   3★ is speculative. A 3★ rating reflects moderate dissatisfaction, not a support-triggering event.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 53
Line       : - **≤1★ threshold** — rejected. A 1-star rating is an explicit, deliberate condemnation. Customers

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 56
Line       :   low ratings before they publish).

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 62
Line       : - `docs/stories/E18-S03-rating-shield-hindi-tip-chip.md` — story that authored this ADR

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-rating-shield-threshold.md
LineNumber : 64
Line       : - Firebase Remote Config key: `rating_shield_threshold_stars` (default `2`)

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-sos-audio-e2e-encryption.md
LineNumber : 15
Line       : - **I-A2** — The same FCM payload disclosed the slot address over an unencrypted FCM topic channel.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0024-sos-audio-e2e-encryption.md
LineNumber : 25
Line       : - Key: `KeyGenerator.getInstance("AES").init(256).generateKey()` — fresh per incident.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0026-fcm-device
             -token-vs-topic.md
LineNumber : 12
Line       : The homeservices platform uses Firebase Cloud Messaging (FCM) to push booking status updates,

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0027-cross-part
             ition-query-guardrails.md
LineNumber : 14
Line       :   `findRatingShieldEscalation`, and related helpers

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0027-cross-part
             ition-query-guardrails.md
LineNumber : 16
Line       : - `rating-repository.ts` — `ratingRepo.getAllByTechnicianId`

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0027-cross-part
             ition-query-guardrails.md
LineNumber : 67
Line       : - Phase 2: migrate `getRepeatOffenders` and `queryComplaints` to a serverless read-replica or

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0028-sos-eviden
             ce-retry-is-in-memory-only.md
LineNumber : 35
Line       :   separately via `SosKeyUploadRequest` (`:70`).

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0029-token-mirr
             ors-are-verified-not-generated.md
LineNumber : 1
Line       : # ADR-0029: Token mirrors are verified, not generated

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0029-token-mirr
             ors-are-verified-not-generated.md
LineNumber : 29
Line       : S-12 raises is not "generate or verify" from a standing start — it is "does the third mirror get

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0029-token-mirr
             ors-are-verified-not-generated.md
LineNumber : 42
Line       : mirror is verified by a CI check that fails the build on divergence. Nothing is generated.**

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0029-token-mirr
             ors-are-verified-not-generated.md
LineNumber : 61
Line       : ### What is deliberately NOT covered

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0029-token-mirr
             ors-are-verified-not-generated.md
LineNumber : 90
Line       : - **Option A — generate `Color.kt` and `globals.css` from a `tokens.json` source.** Rejected.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0029-token-mirr
             ors-are-verified-not-generated.md
LineNumber : 93
Line       :   `technician-app`, `design-system` and `core-nav` are four separate builds stitched with

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0029-token-mirr
             ors-are-verified-not-generated.md
LineNumber : 95
Line       :   build graphs plus a generated-file-is-stale check (which is itself a verification step — you do

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\0029-token-mirr
             ors-are-verified-not-generated.md
LineNumber : 97
Line       :   generated artefact while ADR-0010 has it verified, giving one problem two mechanisms. Revisit if

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\adr\README.md
LineNumber : 22
Line       : - [0005](0005-auth-strategy-truecaller-firebase.md) — Auth strategy (Truecaller + Firebase)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 15
Line       : ### `archive/E08-S03-rating-transparency-pre-rebase-2026-05-02`

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 18
Line       : - **Original branch name:** `feature/E08-S03-rating-transparency`

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 19
Line       : - **Original PR:** #52 (CLOSED on 2026-04-26 awaiting weekly Codex quota reset; never re-opened)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 24
Line       : - Android: `MyRatingsScreen.kt`, `MyRatingsViewModel.kt`, `MyRatingsUiState.kt`, 
             `GetMyRatingsSummaryUseCase.kt`, `TechRatingDtos.kt`, `RatingReceivedEventBus.kt`

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 25
Line       : - API: `tech-ratings.ts` handler + `getAllByTechnicianId` repo method + Zod schema additions

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 26
Line       : - Tests: `MyRatingsViewModelTest`, `RatingRepositoryImplTest` (partial — missing `getMyRatings()` test), 
             `tech-ratings.test.ts` (7 tests)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 27
Line       : - 1 Codex P1-fix commit (`fc78723 fix(e08-s03): P1 review fixes — authLevel anonymous on getTechRatings, 
             time-relative trend test`)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 31
Line       : A Phase 0 capability check at 2026-05-02 revealed **main already has equivalent rating-transparency 
             functionality** that landed via different PRs:

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 32
Line       : - `api/src/functions/tech-ratings.ts:17` — main has `visibleDocs = docs.filter(d => 
             d.customerAppealRemoved !== true)` (the appeal-filter — branch REMOVED this)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 33
Line       : - `api/src/schemas/rating.ts:46-81` — main has appeal fields (`customerAppealRemoved`, `appealDisputed`)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 34
Line       : - `technician-app/.../TechRatingDtos.kt:16,62` — main's DTO already includes `appealDisputed` field

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 35
Line       : - `technician-app/.../MyRatingsViewModel.kt:21` — main's ViewModel already imports 
             `FileRatingAppealUseCase`

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 36
Line       : - `technician-app/.../FileRatingAppealUseCase.kt` — main has the appeal use case (E08-S04 PR #53)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 37
Line       : - `technician-app/.../TechRatingSummary.kt:23` — main's domain model has `appealDisputed: Boolean = false`

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 39
Line       : The archived branch is **functionally a regression** of the rating-transparency surface: it was forked 
             before E08-S04 landed and removed the appeal-filter that E08-S04 expects. Shipping it would silently 
             break the appeals product (techs would see appeal-removed ratings inflating their counts/trends).

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 44
Line       : 1. **E08-S04 appeal-filter semantics are revisited** AND there's a documented decision that techs SHOULD 
             see appeal-removed ratings (currently they should NOT)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 45
Line       : 2. **Tech-retention metrics show rating-transparency UX is moving the retention needle** post-launch 
             (i.e. the basic version on main is insufficient)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 46
Line       : 3. **Engineering capacity is available for the 4–6h conflict-resolution sprint** (28 conflicts across 40+ 
             files, hottest in `api/src/schemas/rating.ts`, `api/src/functions/tech-ratings.ts`, 
             `technician-app/.../MyRatingsScreen.kt`)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 49
Line       : - A `docs/stories/E08-S03-rating-transparency.md` story file (BMAD process debt)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 50
Line       : - A Paparazzi golden for `MyRatingsScreenTest` (currently `@Disabled` stub; CI would block merge)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 52
Line       : - A unit test for `RatingRepositoryImpl.getMyRatings()` (only `submit()` and `get()` are tested)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 59
Line       : git checkout -b feature/E08-S03-rating-transparency-recovered 
             origin/archive/E08-S03-rating-transparency-pre-rebase-2026-05-02

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 62
Line       : git show origin/archive/E08-S03-rating-transparency-pre-rebase-2026-05-02:technician-app/app/src/main/kotl
             in/com/homeservices/technician/ui/myratings/MyRatingsScreen.kt

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 75
Line       :   - `customer-app/.../ui/catalogue/CatalogueVisualImage.kt` (244 LOC component, never integrated)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 135
Line       : Two enterprise-grade audit reports (~700 lines each) were generated on 2026-05-02 to inform the cleanup 
             decision:

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\archive\2026-05-02-
             pre-pivot-archives.md
LineNumber : 149
Line       : # Expected: archive/E08-S03-rating-transparency-pre-rebase-2026-05-02 → fc78723...

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 9
Line       : - **⚠️  3** privileged actions with partial coverage (success path only, or written to a separate event 
             log)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 13
Line       : A separate `bookingEvent` log (`booking-event-repository.ts`) is used by tech-driven status transitions; 
             it is **not** the audit log and is flagged as ⚠️  where it substitutes for one.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 56
Line       : | `admin/complaints/patch.ts` | status change | yes | ✅ `appendAuditEntry` line 88 
             (`COMPLAINT_STATUS_CHANGED`) | covered | Includes RATING_APPEAL status changes (E08-S04) by transitive 
             coverage — no separate `APPEAL_DECIDED` action; payload only carries `from`/`to` status, not the verdict 
             text |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 59
Line       : | `admin/complaints/patch.ts` | resolution category set | yes | ⚠️  | partial | Captured only when status 
             flips to RESOLVED (via STATUS_CHANGED payload); standalone category updates on already-RESOLVED 
             complaints not separately logged |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 70
Line       : | `active-job.ts` | transitionStatusHandler (tech) | yes | ⚠️  written to `bookingEvent` log (line 91), 
             not `audit_log` | partial | Status transitions are tech-driven; today they land in a separate event 
             store. Karnataka regulator query "show me state changes on booking X" cannot be answered from `audit_log` 
             alone |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 72
Line       : | `job-offers.ts` | accept job offer (tech) | yes | ⚠️  `bookingEvent` line 42 only | partial | 
             Acceptance assigns the tech to a booking — affects tech standing. Same separate-store problem as 
             active-job transitions |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 78
Line       : | `rating-escalate.ts` | escalate rating → create RATING_SHIELD complaint | yes | ❌ | **GAP** | Creates a 
             privileged complaint document that affects tech standing; admin-created complaints ARE audited 
             (`complaints/create.ts`), this customer-driven path is not |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 79
Line       : | `ratings.ts` | submit rating (customer or tech) | yes | ❌ | gap (P2) | High-volume customer/tech 
             action; affects tech aggregate standing. Karnataka may want it; volume cost trade-off — flag for ADR |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 80
Line       : | `ratings.ts` | get rating | no | n/a (read-only) | n/a | |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 82
Line       : | `tech-ratings.ts` | my ratings summary | no | n/a (read-only) | n/a | |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 96
Line       : | `trigger-booking-completed.ts` | system settle (Razorpay Route transfer) | yes (system) | ✅ 
             `appendAuditEntry` (helper) lines 53/81/99/105 (`ROUTE_TRANSFER_*`) | covered | |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 99
Line       : | `trigger-rating-prompt.ts` | system push notification | no (no state change) | n/a | n/a | FCM-only |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 110
Line       : - **Customer-driven complaints**: RATING_SHIELD escalation

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 117
Line       : | P1 — money / tech standing / security | 8 | payment webhook, customer confirm, KYC Aadhaar, KYC PAN, 
             no-show detector, failed login, rating-shield, all 6 catalogue mutations (counted as 1 issue) |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 118
Line       : | P2 — partial coverage / system aggregates / lower-volume | 5 | complaint note add, addon 
             request/approve, expire stale offers, weekly aggregate, levy creation, ratings submission, status 
             transition / accept-decline (separate store) |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 132
Line       : - #68 — `rating-escalate.ts` RATING_SHIELD complaint creation

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\audit-log-cov
             erage-2026-04-26.md
LineNumber : 140
Line       : - #76 — ADR: high-volume audit decision (ratings, status transitions)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 20
Line       : | 9 | Rating doc reveal | ⚠️ Weak |

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 77
Line       : - `api/tests/integration/dispatcher-data-isolation.test.ts` — file-scan + schema-shape gate against 
             `declineCount`/`acceptRate`/etc. across 5 source files

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 81
Line       : - `rankTechnicians` mutated to factor in any decline-derived term (even a tied positive framing like 
             `acceptRate`) → caught by the data-isolation file-scan over `dispatcher.service.ts`, plus the 
             phantom-decline-field test in `dispatcher-up-ranking.test.ts:86-111`.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 108
Line       : - **No test verifies that a thrown `dispatcherService.triggerDispatch` does not fail the webhook ack.** 
             The fire-and-forget `.catch(() => {})` at `webhooks.ts:55` is a deliberate design choice, but no test 
             pins it.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 112
Line       : **Recommendation:** add 4 tests (malformed JSON, unknown event, orphan order, 
             dispatch-throws-but-webhook-OK), and replace `!==` with `crypto.timingSafeEqual` (separate code change, 
             not part of this audit).

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 119
Line       : - `api/src/functions/trigger-booking-completed.ts` (`settleBooking`)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 123
Line       : - `api/tests/unit/trigger-booking-completed.test.ts` — 18 tests

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 127
Line       : - Audit-call ordering: `trigger-booking-completed.test.ts:153-169` builds a `callOrder` array and asserts 
             `audit:ROUTE_TRANSFER_ATTEMPT` precedes the Razorpay call. A regression that moved the audit after the 
             transfer would fail this.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 132
Line       : - `incrementCompletedJobCount` only on success, never on failure (`:215-224`).

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 191
Line       : - **`updateBookingFields`** (the generic field-merger used by ~20 callers) — **NO TEST.** Any caller 
             passing an unintended `status` field would silently overwrite the booking status.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 237
Line       : ### 9. Rating doc reveal ⚠️ Weak (asymmetric coverage)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 239
Line       : **Source:** `api/src/functions/ratings.ts:101-145` (`getRatingHandler`).

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 241
Line       : The reveal logic at `ratings.ts:128-129` is:

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 248
Line       : **Tests:** `api/tests/unit/ratings.test.ts` — 11 tests.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 252
Line       : - Customer caller, only customer submitted: customer side is `SUBMITTED` for them, tech side is `PENDING` 
             ✅ (`ratings.test.ts:129-141`)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 254
Line       : - No rating doc: `PENDING` ✅ (`:160-166`)

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 295
Line       : - The dispatcher and SSC-levy paths show **layered defense**: behavioural tests + adversarial tests + 
             file-scan/schema introspection. The `audit:ROUTE_TRANSFER_ATTEMPT` call-ordering test in 
             `trigger-booking-completed.test.ts:153-169` and the post-transfer-DB-fail test in 
             `ssc-levy.test.ts:302-321` are both examples of tests that assert *invariants*, not just *behaviour*.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 299
Line       : - **Asymmetric branches with one direction untested.** Seen in rating reveal (path 9) and arguably in 
             token-verification (path 1, where the cookie path is well-tested but the Bearer path lags). When a 
             function has two symmetric branches (e.g. `isCustomer` vs `isTechnician`), tests should cover both — 
             current pattern is to test one and trust the other.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 307
Line       : 2. **Rating doc reveal** (path 9) — add 3 tests for the missing reveal-direction permutations (technician 
             sees own side; customer does NOT see tech side when only tech submitted; technician does NOT see customer 
             side when only customer submitted). Closes the most-likely-mutation regression on a trust-critical 
             handler.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 308
Line       : 3. **Booking state machine** (path 6) — add unit tests for `applyAddOnDecisions` (overcharge risk), 
             `addPhoto` ETag (photo-loss risk), `markSosActivated` (safety-critical), and `confirmPayment` happy-path. 
             The current coverage is concentrated on `markPaid`; the rest is bare.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\critical-path
             -test-review-2026-04-26.md
LineNumber : 315
Line       : The 3 ✅-strong paths (dispatcher, SSC-levy, payout split) need only minor polish; do not invest there 
             until the ⚠️ tier is closed.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\customer-app-
             gap-audit-2026-05-11.md
LineNumber : 3
Line       : **Status:** Stub. Original 6-slice audit pass executed in a prior session was not persisted to the 
             repository. This file is a deliberate pointer to the authoritative source for the gap-closure work.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\customer-app-
             gap-audit-2026-05-11.md
LineNumber : 7
Line       : **Why this exists:** The plan references this path; subagents executing Week 1+ streams may follow the 
             link. Rather than fabricate an audit narrative after the fact, this stub preserves the gap counts and the 
             cross-cutting themes that the plan's `Context` section summarizes, and points readers to the plan for 
             per-epic acceptance criteria, file path maps, dependency graph, and rollout strategy.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\customer-app-
             gap-audit-2026-05-11.md
LineNumber : 21
Line       : - **(A) Half-done i18n** — Hindi pivot ~70% English literals on high-stakes screens (auth, tracking, 
             complaint, rating, booking summary).

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\customer-app-
             gap-audit-2026-05-11.md
LineNumber : 25
Line       : - **(E) Missing entry points** — no DPDP delete-account flow (Google Play policy risk); no 
             rating/complaint CTAs on bookings list.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\customer-app-
             gap-audit-2026-05-11.md
LineNumber : 31
Line       : - API endpoints for confidence-score-with-GPS, rating reveal, and no-show FCM are complete — gaps are 
             purely customer-app rendering.

Path       : C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\audit\story-complet
             eness-2026-04-26.md
LineNumber : 169
Line       : 5. **Run this audit weekly** — at this rate of merging (~9 PRs in 8 days during the recent burst), a 
             weekly run keeps drift bounded. Earlier weekly runs would have caught the 9 Class-A holes (E03-S04 
             onward) before they piled up to 9.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\compliance\traceability-matrix.md
LineNumber : 42
Line       : | Tech appeals logged + decision-with-reason via FCM | FR-9.4 cross-ref (`docs/prd.md:971`), FR-5.7 | 
             E08-S04 (Abusive customer shield + rating appeal) | none — **story not yet executed** | ❌ | 2026-04-26 — 
             index entry only at `docs/stories/README.md:146`; no `docs/stories/E08-S04-*.md` and no 
             implementation/tests |

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\compliance\traceability-matrix.md
LineNumber : 102
Line       : | G-3 | Tech rating-appeal flow + audit log | Karnataka (FR-9.4) / E08-S04 | story planned not executed | 
             Medium — appeals are a Karnataka Act protection |

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\compliance\traceability-matrix.md
LineNumber : 131
Line       : | G-3 | [#59](https://github.com/aloktiwarigit/UrbanClap-Dup/issues/59) — tech rating-appeal flow + audit 
             log (E08-S04) | TBD | Pre-launch |

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\design-language.md
LineNumber : 21
Line       : Do not reintroduce a separate teal/coral Android brand, the admin-only Fraunces editorial direction, or a 
             new Sora "Warm Authority" direction. Those are superseded.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\design-language.md
LineNumber : 59
Line       : Semantic colors may keep existing green/warn/danger roles, but implementation must consolidate values 
             across Android and web in WS-0. Money, rating, complaint, and safety colors must not vary by surface 
             without a named role.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\design-language.md
LineNumber : 123
Line       : | `base` | 200-220ms | emphasized decelerate | Screen content settle, tabs, list item reveal |

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\design-language.md
LineNumber : 124
Line       : | `medium` | 300ms | emphasized decelerate | Bottom sheets, dialogs |

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\design-language.md
LineNumber : 125
Line       : | `slow` | 420-500ms | emphasized decelerate | Rare celebration / onboarding only |

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\screenshot-capture-log.md
LineNumber : 85
Line       : - Password was generated locally for capture, verified through Firebase REST, used in emulator, then the 
             temp file was overwritten with `{"cleared":true}`. No password is stored in the repo.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\SESSION-STATE.md
LineNumber : 15
Line       : one. First CI attempt (tests still ignored) confirmed this — the artifact had zero Shield/RatingAppeal

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\SESSION-STATE.md
LineNumber : 20
Line       : byte-identical blank white images. Root cause: `ShieldReportSheet`/`RatingAppealSheet` wrap

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\SESSION-STATE.md
LineNumber : 28
Line       : Fixed (commit `245dc741`) by extracting `ShieldReportSheetContent`/`RatingAppealSheetContent` out of

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\SESSION-STATE.md
LineNumber : 31
Line       : change to `ShieldReportSheet`/`RatingAppealSheet` themselves.

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\SESSION-STATE.md
LineNumber : 45
Line       : **If `ShieldReportSheetContent`/`RatingAppealSheetContent` are touched again:** they are the pattern

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\SESSION-STATE.md
LineNumber : 56
Line       : - `ShieldReportSheet.kt` and `RatingAppealSheet.kt` each hardcoded two Devanagari literals and

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\SESSION-STATE.md
LineNumber : 70
Line       : reachable: `grep -rn "showShieldSheet" ActiveJobScreen.kt` and `grep -rn "RatingAppealSheet"

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\SESSION-STATE.md
LineNumber : 71
Line       : MyRatingsScreen.kt` both return nothing. Neither composable is ever called from any screen. This is

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\SESSION-STATE.md
LineNumber : 75
Line       : `FileShieldReportUseCase` → repo → API, and `MyRatingsViewModel` has a complete `appealState`

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\SESSION-STATE.md
LineNumber : 76
Line       : (Loading/QuotaExceeded/Success/Error) wired to `FileRatingAppealUseCase`, both covered by passing

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\SESSION-STATE.md
LineNumber : 79
Line       : flag wiring as a separate follow-up** — it's a feature-completion / UI-placement decision (where

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\SESSION-STATE.md
LineNumber : 80
Line       : does "Report customer" live in `ActiveJobScreen`'s UI, does rating-appeal ship now), not a states

Path       : C:\Alok\Business 
             Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\docs\design\SESSION-STATE.md
LineNumber : 82
Line       : **New finding for the backlog: wire `ShieldReportSheet` and `RatingAppealSheet` into their screens**




  ✓ Load repository instructions
  ✓ Inspect diff against merge base
  ✓ Analyze changed code for bugs
  → Produce JSON findings
codex
The patch improves error mapping, but the new retry/error state handling has user-facing edge cases for low-rating shield flows. These should be fixed before considering the change fully correct.

Full review comments:

- [P2] Preserve shield bypass when retrying failed low ratings — C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\main\kotlin\com\homeservices\customer\ui\rating\RatingViewModel.kt:301-301
  When a low-rating submit has already gone through `Post rating now` or the countdown and then fails with a retryable error, this reset leaves `_shieldState` as `Idle`. The retry button calls `submit()`, so unchanged ratings with `overall <= 2` reopen the shield dialog instead of sending the advertised retry; preserve that the user already chose/bypassed the shield for this failed attempt or route retry directly to `doSubmit()`.

- [P2] Treat escalation AlreadySubmitted as a completed rating — C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\main\kotlin\com\homeservices\customer\ui\rating\RatingViewModel.kt:270-271
  If the low-rating escalation endpoint returns `RATING_ALREADY_SUBMITTED` because the rating was posted from another device or a stale session, this branch keeps the shield dialog open and stores `AlreadySubmitted` as an error. The submit path correctly moves to `AwaitingPartner`; apply the same handling here so users are not left retrying support escalation after the server says the rating already exists.
The patch improves error mapping, but the new retry/error state handling has user-facing edge cases for low-rating shield flows. These should be fixed before considering the change fully correct.

Full review comments:

- [P2] Preserve shield bypass when retrying failed low ratings — C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\main\kotlin\com\homeservices\customer\ui\rating\RatingViewModel.kt:301-301
  When a low-rating submit has already gone through `Post rating now` or the countdown and then fails with a retryable error, this reset leaves `_shieldState` as `Idle`. The retry button calls `submit()`, so unchanged ratings with `overall <= 2` reopen the shield dialog instead of sending the advertised retry; preserve that the user already chose/bypassed the shield for this failed attempt or route retry directly to `doSubmit()`.

- [P2] Treat escalation AlreadySubmitted as a completed rating — C:\Alok\Business Projects\Urbanclap-dup\.claire\worktrees\fix-rating-submit-error\customer-app\app\src\main\kotlin\com\homeservices\customer\ui\rating\RatingViewModel.kt:270-271
  If the low-rating escalation endpoint returns `RATING_ALREADY_SUBMITTED` because the rating was posted from another device or a stale session, this branch keeps the shield dialog open and stores `AlreadySubmitted` as an error. The submit path correctly moves to `AwaitingPartner`; apply the same handling here so users are not left retrying support escalation after the server says the rating already exists.
