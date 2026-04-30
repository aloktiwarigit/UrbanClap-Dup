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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.components.HsInfoRow
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsSkeletonBlock
import com.homeservices.designsystem.components.HsTrustBadge
import com.homeservices.technician.R
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
    modifier: Modifier = Modifier,
): Unit {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        when (uiState) {
            is ActiveJobUiState.Loading -> ActiveJobSkeleton()
            is ActiveJobUiState.Completed ->
                CenterMessage(
                    title = stringResource(R.string.active_job_complete_title),
                    body = stringResource(R.string.active_job_complete_body),
                )
            is ActiveJobUiState.Error ->
                CenterMessage(
                    title = stringResource(R.string.active_job_error_title),
                    body = uiState.message,
                )
            is ActiveJobUiState.Active -> {
                ActiveJobContent(
                    state = uiState,
                    onTransitionRequested = onTransitionRequested,
                )
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
            }
        }
    }
}

@Composable
private fun ActiveJobContent(
    state: ActiveJobUiState.Active,
    onTransitionRequested: (stage: String) -> Unit,
    modifier: Modifier = Modifier,
): Unit {
    Column(
        modifier =
            modifier
                .fillMaxSize()
                .padding(16.dp),
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            HsTrustBadge(text = statusLabel(state.job.status))
            HsSectionCard {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = state.job.serviceName,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                    )
                    HsInfoRow(label = stringResource(R.string.active_job_address), value = state.job.addressText)
                    HsInfoRow(
                        label = stringResource(R.string.active_job_slot),
                        value = "${state.job.slotDate} ${state.job.slotWindow}",
                    )
                }
            }
            HsSectionCard(title = stringResource(R.string.active_job_progress_title)) {
                StatusStepper(currentStatus = state.job.status)
            }
            if (state.hasPendingTransitions) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.medium,
                    color = MaterialTheme.colorScheme.errorContainer,
                ) {
                    Text(
                        text = stringResource(R.string.active_job_offline_sync),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(12.dp),
                    )
                }
            }
        }

        val (ctaLabel, ctaEnabled, ctaTargetStage) =
            when (state.availableAction) {
                ActiveJobAction.START_TRIP -> Triple(stringResource(R.string.active_job_start_trip), true, "EN_ROUTE")
                ActiveJobAction.MARK_ARRIVED -> Triple(stringResource(R.string.active_job_mark_arrived), true, "REACHED")
                ActiveJobAction.START_WORK -> Triple(stringResource(R.string.active_job_start_work), true, "IN_PROGRESS")
                ActiveJobAction.COMPLETE_JOB -> Triple(stringResource(R.string.active_job_complete_job), true, "COMPLETED")
                ActiveJobAction.NONE -> Triple(stringResource(R.string.active_job_done), false, "")
            }
        HsPrimaryButton(
            text = ctaLabel,
            onClick = { if (ctaTargetStage.isNotEmpty()) onTransitionRequested(ctaTargetStage) },
            enabled = ctaEnabled,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun StatusStepper(
    currentStatus: ActiveJobStatus,
    modifier: Modifier = Modifier,
): Unit {
    val steps =
        listOf(
            ActiveJobStatus.ASSIGNED to stringResource(R.string.active_job_status_assigned),
            ActiveJobStatus.EN_ROUTE to stringResource(R.string.active_job_status_en_route),
            ActiveJobStatus.REACHED to stringResource(R.string.active_job_status_arrived),
            ActiveJobStatus.IN_PROGRESS to stringResource(R.string.active_job_status_working),
            ActiveJobStatus.COMPLETED to stringResource(R.string.active_job_status_done),
        )
    val currentIndex = steps.indexOfFirst { it.first == currentStatus }
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        steps.forEachIndexed { index, (_, label) ->
            val isDone = index <= currentIndex
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.size(58.dp),
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

@Composable
private fun ActiveJobSkeleton() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        HsSkeletonBlock(widthFraction = 0.42f, height = 32.dp)
        HsSkeletonBlock(height = 132.dp)
        HsSkeletonBlock(height = 108.dp)
        Spacer(Modifier.weight(1f))
        HsSkeletonBlock(height = 56.dp)
    }
}

@Composable
private fun CenterMessage(
    title: String,
    body: String,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text(
            body,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun statusLabel(status: ActiveJobStatus): String =
    when (status) {
        ActiveJobStatus.ASSIGNED -> stringResource(R.string.active_job_status_assigned)
        ActiveJobStatus.EN_ROUTE -> stringResource(R.string.active_job_status_en_route)
        ActiveJobStatus.REACHED -> stringResource(R.string.active_job_status_arrived)
        ActiveJobStatus.IN_PROGRESS -> stringResource(R.string.active_job_status_working)
        ActiveJobStatus.COMPLETED -> stringResource(R.string.active_job_status_done)
    }
