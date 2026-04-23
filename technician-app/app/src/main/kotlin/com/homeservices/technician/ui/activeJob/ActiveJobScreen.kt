package com.homeservices.technician.ui.activeJob

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus

@Composable
internal fun ActiveJobScreen(
    modifier: Modifier = Modifier,
    viewModel: ActiveJobViewModel = hiltViewModel(),
): Unit {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    ActiveJobScreenContent(
        uiState = uiState,
        onStartTrip = viewModel::startTrip,
        onMarkReached = viewModel::markReached,
        onStartWork = viewModel::startWork,
        onCompleteJob = viewModel::completeJob,
        modifier = modifier,
    )
}

@Composable
internal fun ActiveJobScreenContent(
    uiState: ActiveJobUiState,
    onStartTrip: () -> Unit,
    onMarkReached: () -> Unit,
    onStartWork: () -> Unit,
    onCompleteJob: () -> Unit,
    modifier: Modifier = Modifier,
): Unit {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        when (uiState) {
            is ActiveJobUiState.Loading ->
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text("Loading…", style = MaterialTheme.typography.bodyLarge)
                }
            is ActiveJobUiState.Completed ->
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text("Job Complete!", style = MaterialTheme.typography.headlineSmall)
                }
            is ActiveJobUiState.Error ->
                Column(
                    modifier =
                        Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text(uiState.message, style = MaterialTheme.typography.bodyLarge)
                }
            is ActiveJobUiState.Active ->
                ActiveJobContent(
                    state = uiState,
                    onStartTrip = onStartTrip,
                    onMarkReached = onMarkReached,
                    onStartWork = onStartWork,
                    onCompleteJob = onCompleteJob,
                )
        }
    }
}

@Composable
private fun ActiveJobContent(
    state: ActiveJobUiState.Active,
    onStartTrip: () -> Unit,
    onMarkReached: () -> Unit,
    onStartWork: () -> Unit,
    onCompleteJob: () -> Unit,
    modifier: Modifier = Modifier,
): Unit {
    Column(
        modifier =
            modifier
                .fillMaxSize()
                .padding(24.dp),
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(state.job.serviceName, style = MaterialTheme.typography.headlineSmall)
            Text(
                state.job.addressText,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                "${state.job.slotDate}  ${state.job.slotWindow}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        StatusStepper(currentStatus = state.job.status)

        if (state.hasPendingTransitions) {
            Text(
                "Offline — status will sync on reconnect",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.error,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
        }

        val ctaLabel: String
        val ctaEnabled: Boolean
        val ctaAction: () -> Unit
        when (state.availableAction) {
            ActiveJobAction.START_TRIP -> {
                ctaLabel = "Start Trip"; ctaEnabled = true; ctaAction = onStartTrip
            }
            ActiveJobAction.MARK_ARRIVED -> {
                ctaLabel = "I've Arrived"; ctaEnabled = true; ctaAction = onMarkReached
            }
            ActiveJobAction.START_WORK -> {
                ctaLabel = "Start Work"; ctaEnabled = true; ctaAction = onStartWork
            }
            ActiveJobAction.COMPLETE_JOB -> {
                ctaLabel = "Complete Job"; ctaEnabled = false; ctaAction = onCompleteJob
            }
            ActiveJobAction.NONE -> {
                ctaLabel = "Done"; ctaEnabled = false; ctaAction = {}
            }
        }
        Button(
            onClick = ctaAction,
            enabled = ctaEnabled,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .height(56.dp),
        ) {
            Text(ctaLabel, style = MaterialTheme.typography.titleMedium)
        }
    }
}

@Composable
private fun StatusStepper(
    currentStatus: ActiveJobStatus,
    modifier: Modifier = Modifier,
): Unit {
    val steps =
        listOf(
            ActiveJobStatus.ASSIGNED to "Assigned",
            ActiveJobStatus.EN_ROUTE to "En Route",
            ActiveJobStatus.REACHED to "Arrived",
            ActiveJobStatus.IN_PROGRESS to "Working",
            ActiveJobStatus.COMPLETED to "Done",
        )
    val currentIndex = steps.indexOfFirst { it.first == currentStatus }
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        steps.forEachIndexed { index, (_, label) ->
            val isDone = index <= currentIndex
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.size(56.dp),
            ) {
                Surface(
                    shape = MaterialTheme.shapes.extraSmall,
                    color =
                        if (isDone) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.surfaceVariant
                        },
                    modifier = Modifier.size(16.dp),
                ) {}
                Spacer(Modifier.height(4.dp))
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelSmall,
                    color =
                        if (isDone) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant
                        },
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}
