package com.homeservices.customer.ui.rating

import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.homeservices.customer.domain.rating.RatingSubmitFailure
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsScreenTitle
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTrustBadge
import com.homeservices.designsystem.theme.HomeservicesBorderWidth
import com.homeservices.designsystem.theme.LocalHomeservicesRadius
import com.homeservices.designsystem.theme.LocalHomeservicesSpacing
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
    val submitError by viewModel.submitError.collectAsStateWithLifecycle()
    val escalateError by viewModel.escalateError.collectAsStateWithLifecycle()

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
        submitError = submitError,
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
            // The sheet sits over the form, so a failed escalation has to report itself here or
            // the customer just sees the buttons re-enable with no explanation.
            error = escalateError,
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
    submitError: RatingSubmitFailure?,
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
                        submitError = submitError,
                        onBack = onBack,
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
    submitError: RatingSubmitFailure?,
    onBack: () -> Unit,
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
        if (submitError != null) {
            SubmitErrorNotice(submitError)
        }
        if (shieldState is RatingShieldState.Escalated) {
            CountdownChip(expiresAtMs = shieldState.expiresAtMs, onPostAnyway = onPostAnyway)
        } else if (submitError != null && !submitError.retryable) {
            // Pressing submit again cannot change the answer, so offer the only move that helps
            // rather than leaving a dead button under the message.
            HsSecondaryButton(
                text = stringResource(R.string.rating_back_home),
                onClick = onBack,
                modifier = Modifier.fillMaxWidth(),
            )
        } else {
            HsPrimaryButton(
                text =
                    stringResource(
                        if (submitError != null) R.string.rating_submit_retry else R.string.rating_submit,
                    ),
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

/**
 * Why the rating did not send, shown where it happened — directly above the button that failed, so
 * the stars and comment stay visible and intact behind it.
 */
@Composable
private fun SubmitErrorNotice(failure: RatingSubmitFailure) {
    val spacing = LocalHomeservicesSpacing.current
    val radius = LocalHomeservicesRadius.current
    Surface(
        color = MaterialTheme.colorScheme.errorContainer,
        contentColor = MaterialTheme.colorScheme.onErrorContainer,
        shape = RoundedCornerShape(radius.md),
        modifier =
            Modifier
                .fillMaxWidth()
                .border(
                    width = HomeservicesBorderWidth.hairline,
                    color = MaterialTheme.colorScheme.error,
                    shape = RoundedCornerShape(radius.md),
                ),
    ) {
        Text(
            text = stringResource(failure.messageRes()),
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(horizontal = spacing.space4, vertical = spacing.space3),
        )
    }
}

private fun RatingSubmitFailure.messageRes(): Int =
    when (this) {
        RatingSubmitFailure.NoTechnician -> R.string.rating_submit_error_no_technician
        RatingSubmitFailure.BookingNotClosed -> R.string.rating_submit_error_not_closed
        RatingSubmitFailure.ShieldAlreadyEscalated -> R.string.rating_submit_error_shield_already_escalated
        RatingSubmitFailure.NotAvailable -> R.string.rating_submit_error_not_available
        RatingSubmitFailure.Network -> R.string.rating_submit_error_network
        // AlreadySubmitted never reaches the form — the view model moves the screen on instead.
        RatingSubmitFailure.AlreadySubmitted, RatingSubmitFailure.Unknown ->
            R.string.rating_submit_error_generic
    }

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
    error: RatingSubmitFailure? = null,
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
            if (error != null) {
                Spacer(Modifier.height(16.dp))
                SubmitErrorNotice(error)
            }
            Spacer(Modifier.height(16.dp))
            HsPrimaryButton(
                text = stringResource(R.string.rating_shield_send_support),
                onClick = onEscalate,
                // A refusal that a retry cannot change leaves "Post rating now" as the way forward.
                enabled = !isEscalating && error?.retryable != false,
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
                    text = if (i <= value) "★" else "☆",
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
