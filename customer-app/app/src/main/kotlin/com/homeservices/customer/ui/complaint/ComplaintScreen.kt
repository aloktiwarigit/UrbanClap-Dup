package com.homeservices.customer.ui.complaint

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.customer.domain.complaint.ComplaintReason
import com.homeservices.customer.ui.components.CountdownChip
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsScreenTitle
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTrustBadge

@Composable
public fun ComplaintScreen(
    bookingId: String,
    onBack: () -> Unit,
    viewModel: ComplaintViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    LaunchedEffect(bookingId) { viewModel.loadStatus(bookingId) }

    val photoPicker =
        rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
            uri ?: return@rememberLauncherForActivityResult
            val tmpFile = java.io.File(context.cacheDir, "complaint_photo_${System.currentTimeMillis()}.jpg")
            context.contentResolver.openInputStream(uri)?.use { input ->
                tmpFile.outputStream().use { output -> input.copyTo(output) }
            }
            viewModel.onPhotoSelected(tmpFile.absolutePath, bookingId)
        }

    ComplaintContent(
        state = uiState,
        onBack = onBack,
        onRetry = viewModel::onRetry,
        onReasonSelected = viewModel::onReasonSelected,
        onDescriptionChanged = viewModel::onDescriptionChanged,
        onPhotoClick = { photoPicker.launch("image/*") },
        onSubmit = { viewModel.onSubmit(bookingId) },
        onReopen = viewModel::onReopen,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ComplaintContent(
    state: ComplaintUiState,
    onBack: () -> Unit,
    onRetry: () -> Unit,
    onReasonSelected: (ComplaintReason) -> Unit,
    onDescriptionChanged: (String) -> Unit,
    onPhotoClick: () -> Unit,
    onSubmit: () -> Unit,
    onReopen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when (state) {
            is ComplaintUiState.Success -> SuccessState(state = state, onBack = onBack, onReopen = onReopen)
            is ComplaintUiState.PhotoUploading, ComplaintUiState.Submitting -> LoadingState()
            is ComplaintUiState.Error -> ErrorState(message = state.message, onRetry = onRetry)
            is ComplaintUiState.Idle ->
                IdleState(
                    state = state,
                    onReasonSelected = onReasonSelected,
                    onDescriptionChanged = onDescriptionChanged,
                    onPhotoClick = onPhotoClick,
                    onSubmit = onSubmit,
                )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun IdleState(
    state: ComplaintUiState.Idle,
    onReasonSelected: (ComplaintReason) -> Unit,
    onDescriptionChanged: (String) -> Unit,
    onPhotoClick: () -> Unit,
    onSubmit: () -> Unit,
) {
    Column(
        modifier = Modifier.verticalScroll(rememberScrollState()).padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        HsTrustBadge(text = stringResource(R.string.complaint_eyebrow))
        HsScreenTitle(
            text = stringResource(R.string.complaint_title),
            style = MaterialTheme.typography.headlineSmall,
        )
        Text(
            stringResource(R.string.complaint_body),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        ComplaintFormCard(
            state = state,
            onReasonSelected = onReasonSelected,
            onDescriptionChanged = onDescriptionChanged,
            onPhotoClick = onPhotoClick,
        )
        HsPrimaryButton(
            text = stringResource(R.string.complaint_submit),
            onClick = onSubmit,
            enabled = state.submitEnabled,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ComplaintFormCard(
    state: ComplaintUiState.Idle,
    onReasonSelected: (ComplaintReason) -> Unit,
    onDescriptionChanged: (String) -> Unit,
    onPhotoClick: () -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    HsSectionCard {
        ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
            OutlinedTextField(
                value = state.selectedReason?.displayLabel() ?: stringResource(R.string.complaint_select_reason),
                onValueChange = {},
                readOnly = true,
                label = { Text(stringResource(R.string.complaint_issue_type)) },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                modifier = Modifier.menuAnchor(MenuAnchorType.PrimaryNotEditable, true).fillMaxWidth(),
            )
            ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                ComplaintReason.entries.forEach { reason ->
                    DropdownMenuItem(
                        text = { Text(reason.displayLabel()) },
                        onClick = {
                            onReasonSelected(reason)
                            expanded = false
                        },
                    )
                }
            }
        }
        Spacer(Modifier.height(14.dp))
        OutlinedTextField(
            value = state.description,
            onValueChange = onDescriptionChanged,
            label = { Text(stringResource(R.string.complaint_what_happened)) },
            supportingText = { Text("${state.description.length}/2000") },
            minLines = 4,
            maxLines = 8,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(14.dp))
        HsSecondaryButton(
            text =
                if (state.photoStoragePath != null) {
                    stringResource(R.string.complaint_photo_attached)
                } else {
                    stringResource(R.string.complaint_attach_photo)
                },
            onClick = onPhotoClick,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun SuccessState(
    state: ComplaintUiState.Success,
    onBack: () -> Unit,
    onReopen: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            stringResource(R.string.complaint_received),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            statusMessage(state.status),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        if (state.isAcknowledged && state.acknowledgeDeadlineAt != null) {
            Spacer(Modifier.height(12.dp))
            CountdownChip(deadlineIso = state.acknowledgeDeadlineAt)
        }
        Spacer(Modifier.height(24.dp))
        HsPrimaryButton(text = stringResource(R.string.complaint_back), onClick = onBack)
        if (state.isResolved) {
            Spacer(Modifier.height(12.dp))
            HsSecondaryButton(
                text = stringResource(R.string.complaint_reopen),
                onClick = onReopen,
            )
        }
    }
}

@Composable
private fun LoadingState() {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        CircularProgressIndicator()
        Spacer(Modifier.height(12.dp))
        Text(stringResource(R.string.complaint_submitting), color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun ErrorState(
    message: String,
    onRetry: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text(
            stringResource(R.string.complaint_error_title),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(8.dp))
        Text(message, color = MaterialTheme.colorScheme.error)
        Spacer(Modifier.height(16.dp))
        HsPrimaryButton(text = stringResource(R.string.complaint_retry), onClick = onRetry)
    }
}

@Composable
private fun statusMessage(status: String): String =
    when (status) {
        "INVESTIGATING" -> stringResource(R.string.complaint_status_investigating)
        "RESOLVED" -> stringResource(R.string.complaint_status_resolved)
        else -> stringResource(R.string.complaint_status_default)
    }

@Composable
private fun ComplaintReason.displayLabel(): String =
    when (this) {
        ComplaintReason.SERVICE_QUALITY -> stringResource(R.string.complaint_reason_service_quality)
        ComplaintReason.LATE_ARRIVAL -> stringResource(R.string.complaint_reason_late_arrival)
        ComplaintReason.NO_SHOW -> stringResource(R.string.complaint_reason_no_show)
        ComplaintReason.TECHNICIAN_BEHAVIOUR -> stringResource(R.string.complaint_reason_technician_behaviour)
        ComplaintReason.BILLING_DISPUTE -> stringResource(R.string.complaint_reason_billing_dispute)
        ComplaintReason.OTHER -> stringResource(R.string.complaint_reason_other)
    }
