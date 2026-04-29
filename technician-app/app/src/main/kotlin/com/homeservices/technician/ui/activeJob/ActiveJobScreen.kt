package com.homeservices.technician.ui.activeJob

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus

@Composable
internal fun ActiveJobScreen(
    modifier: Modifier = Modifier,
    viewModel: ActiveJobViewModel = hiltViewModel(),
): Unit {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    ActiveJobScreenContent(
        uiState = uiState,
        onTransitionRequested = viewModel::onTransitionRequested,
        onPhotoCancelled = viewModel::onPhotoCancelled,
        onPhotoConfirmed = viewModel::onPhotoConfirmed,
        onPhotoRetake = viewModel::onPhotoRetake,
        onShowShieldSheet = viewModel::onShowShieldSheet,
        onDismissShieldSheet = viewModel::onDismissShieldSheet,
        onShieldSubmit = viewModel::fileShieldReport,
        onShieldSuccessConsumed = viewModel::consumeShieldReportSuccess,
        onShieldErrorConsumed = viewModel::consumeShieldReportError,
        modifier = modifier,
    )
}

@Composable
internal fun ActiveJobScreenContent(
    uiState: ActiveJobUiState,
    onTransitionRequested: (stage: String) -> Unit,
    onPhotoCancelled: () -> Unit,
    onPhotoConfirmed: (filePath: String) -> Unit,
    onPhotoRetake: () -> Unit,
    onShowShieldSheet: () -> Unit = {},
    onDismissShieldSheet: () -> Unit = {},
    onShieldSubmit: (description: String?) -> Unit = {},
    onShieldSuccessConsumed: () -> Unit = {},
    onShieldErrorConsumed: () -> Unit = {},
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
            is ActiveJobUiState.Active -> {
                val snackbarHostState = remember { SnackbarHostState() }
                Box(modifier = Modifier.fillMaxSize()) {
                    ActiveJobContent(
                        state = uiState,
                        onTransitionRequested = onTransitionRequested,
                        onShowShieldSheet = onShowShieldSheet,
                    )
                    SnackbarHost(
                        hostState = snackbarHostState,
                        modifier = Modifier.align(Alignment.BottomCenter),
                    )
                }
                uiState.pendingPhotoStage?.let { stage ->
                    var lastCapturedPath by remember { mutableStateOf<String?>(null) }
                    PhotoCaptureScreen(
                        stage = stage,
                        onPhotoTaken = { path ->
                            lastCapturedPath = path
                            onPhotoConfirmed(path)
                        },
                        onDismiss = onPhotoCancelled,
                        isUploading = uiState.photoUploadInProgress,
                        uploadError = uiState.photoUploadError,
                        onRetry = { lastCapturedPath?.let(onPhotoConfirmed) },
                        onRetake = onPhotoRetake,
                    )
                }
                if (uiState.showShieldSheet) {
                    ShieldReportSheet(
                        onDismiss = onDismissShieldSheet,
                        onSubmit = onShieldSubmit,
                        isSubmitting = uiState.shieldReportInProgress,
                    )
                }
                LaunchedEffect(uiState.shieldReportSuccess) {
                    if (uiState.shieldReportSuccess) {
                        snackbarHostState.showSnackbar(
                            message = "रिपोर्ट दर्ज हो गई ✓",
                            duration = SnackbarDuration.Short,
                        )
                        onShieldSuccessConsumed()
                    }
                }
                LaunchedEffect(uiState.shieldReportError) {
                    val err = uiState.shieldReportError
                    if (err != null) {
                        snackbarHostState.showSnackbar(
                            message = "रिपोर्ट नहीं हो सकी, पुनः प्रयास करें",
                            duration = SnackbarDuration.Short,
                        )
                        onShieldErrorConsumed()
                    }
                }
            }
        }
    }
}

@Composable
private fun ActiveJobContent(
    state: ActiveJobUiState.Active,
    onTransitionRequested: (stage: String) -> Unit,
    onShowShieldSheet: () -> Unit = {},
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

        val (ctaLabel, ctaEnabled, ctaTargetStage) =
            when (state.availableAction) {
                ActiveJobAction.START_TRIP -> Triple("Start Trip", true, "EN_ROUTE")
                ActiveJobAction.MARK_ARRIVED -> Triple("I've Arrived", true, "REACHED")
                ActiveJobAction.START_WORK -> Triple("Start Work", true, "IN_PROGRESS")
                ActiveJobAction.COMPLETE_JOB -> Triple("Complete Job", true, "COMPLETED")
                ActiveJobAction.NONE -> Triple("Done", false, "")
            }
        Column(
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Button(
                onClick = { if (ctaTargetStage.isNotEmpty()) onTransitionRequested(ctaTargetStage) },
                enabled = ctaEnabled,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .height(56.dp),
            ) {
                Text(ctaLabel, style = MaterialTheme.typography.titleMedium)
            }
            OutlinedButton(
                onClick = onShowShieldSheet,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .height(48.dp),
            ) {
                Text("ग्राहक रिपोर्ट करें")
            }
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
