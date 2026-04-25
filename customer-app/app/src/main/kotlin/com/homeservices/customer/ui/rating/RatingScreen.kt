package com.homeservices.customer.ui.rating

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
public fun RatingScreen(
    modifier: Modifier = Modifier,
    viewModel: RatingViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()
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
                Button(onClick = viewModel::submit, enabled = canSubmit) { Text("Submit") }
            }
        }
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
                        .clickable(onClickLabel = "rate") { onChange(i) },
            )
        }
    }
}
