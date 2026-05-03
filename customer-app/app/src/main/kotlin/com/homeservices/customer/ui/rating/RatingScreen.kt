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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
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
                        "Rating submitted",
                        "We will reveal both ratings after the technician responds.",
                    )
                is RatingUiState.Revealed -> StatusMessage("Ratings revealed", "Thanks for keeping the service marketplace fair.")
                is RatingUiState.Error -> StatusMessage("Could not load rating", state.message)
                is RatingUiState.Loading -> StatusMessage("Loading rating", "Preparing your service feedback form.")
                else -> {
                    HsTrustBadge(text = "Service feedback")
                    Text("Rate your service", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text(
                        "Your rating helps improve technician quality and customer support follow-up.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    HsSectionCard {
                        StarRow("Overall experience", overall, onOverallChange)
                        Spacer(Modifier.height(12.dp))
                        StarRow("Punctuality", punctuality, onPunctualityChange)
                        Spacer(Modifier.height(12.dp))
                        StarRow("Skill quality", skill, onSkillChange)
                        Spacer(Modifier.height(12.dp))
                        StarRow("Behaviour", behaviour, onBehaviourChange)
                    }
                    OutlinedTextField(
                        value = comment,
                        onValueChange = onCommentChange,
                        label = { Text("Comment (optional)") },
                        supportingText = { Text("${comment.length}/500") },
                        minLines = 3,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    if (shieldState is RatingShieldState.Escalated) {
                        CountdownChip(expiresAtMs = shieldState.expiresAtMs, onPostAnyway = onPostAnyway)
                    } else {
                        Spacer(Modifier.weight(1f))
                        HsPrimaryButton(
                            text = "Submit rating",
                            onClick = onSubmit,
                            enabled = canSubmit,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
            }
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
            Text("Share this privately first?", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Text(
                "Low ratings can be sent to owner support before posting publicly.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(16.dp))
            HsPrimaryButton(
                text = "Send to support first",
                onClick = onEscalate,
                enabled = !isEscalating,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            HsSecondaryButton(
                text = "Post rating now",
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
    Row(modifier = Modifier.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        SuggestionChip(onClick = {}, label = { Text("Private review: $hours:${minutes.toString().padStart(2, '0')} left") })
        Spacer(Modifier.width(8.dp))
        TextButton(onClick = onPostAnyway) { Text("Post anyway") }
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
                    text = if (i <= value) "\u2605" else "\u2606",
                    style = MaterialTheme.typography.headlineSmall,
                    color = if (i <= value) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(end = 6.dp).clickable(onClickLabel = "rate $i stars") { onChange(i) },
                )
            }
        }
    }
}
