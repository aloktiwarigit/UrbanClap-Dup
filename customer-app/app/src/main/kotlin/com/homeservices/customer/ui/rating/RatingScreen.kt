package com.homeservices.customer.ui.rating

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SuggestionChip
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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
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

    Column(modifier = modifier.fillMaxSize().padding(16.dp)) {
        when (state) {
            is RatingUiState.AwaitingPartner -> Text("Thanks! Awaiting your technician's rating.")
            is RatingUiState.Revealed -> Text("Both ratings revealed.")
            is RatingUiState.Error -> Text("Error: ${(state as RatingUiState.Error).message}")
            else -> {
                Text("How was your service?")
                Spacer(Modifier.height(8.dp))
                StarRow(label = "Overall", value = overall, onChange = viewModel::setOverall)
                StarRow(label = "Punctuality", value = punct, onChange = viewModel::setPunctuality)
                StarRow(label = "Skill", value = skill, onChange = viewModel::setSkill)
                StarRow(label = "Behaviour", value = behav, onChange = viewModel::setBehaviour)
                OutlinedTextField(
                    value = comment,
                    onValueChange = viewModel::setComment,
                    label = { Text("Comment (optional, ≤500 chars)") },
                    modifier = Modifier.padding(vertical = 8.dp),
                )
                if (shieldState is RatingShieldState.Escalated) {
                    CountdownChip(
                        expiresAtMs = (shieldState as RatingShieldState.Escalated).expiresAtMs,
                        onPostAnyway = viewModel::onPostAnyway,
                    )
                } else {
                    Button(onClick = viewModel::submit, enabled = canSubmit) { Text("Submit") }
                }
            }
        }
    }
    if (shieldState == RatingShieldState.ShowDialog || shieldState == RatingShieldState.Escalating) {
        ShieldBottomSheet(
            onEscalate = viewModel::onEscalate,
            onSkip = viewModel::onSkipShield,
            onDismiss = viewModel::onDismissShieldDialog,
            isEscalating = shieldState == RatingShieldState.Escalating,
        )
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
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
    ) {
        Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp)) {
            Text(
                text = "क्या आप मालिक को पहले बताना चाहते हैं?",
                style = MaterialTheme.typography.titleMedium,
            )
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = onEscalate,
                enabled = !isEscalating,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("हाँ")
            }
            Spacer(Modifier.height(8.dp))
            OutlinedButton(
                onClick = onSkip,
                enabled = !isEscalating,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("नहीं, सीधे post करें")
            }
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
    Row(
        modifier = Modifier.padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        SuggestionChip(
            onClick = {},
            label = { Text("मालिक को $hours:${minutes.toString().padStart(2, '0')} बचे हैं") },
        )
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
    Row(modifier = Modifier.padding(vertical = 4.dp)) {
        Text("$label: ", modifier = Modifier.padding(end = 8.dp))
        for (i in 1..5) {
            Text(
                text = if (i <= value) "★" else "☆",
                modifier =
                    Modifier
                        .padding(horizontal = 2.dp)
                        .clickable(onClickLabel = "rate $i stars") { onChange(i) },
            )
        }
    }
}
