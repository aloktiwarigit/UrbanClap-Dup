package com.homeservices.technician.ui.complaint

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTrustBadge
import com.homeservices.technician.domain.complaint.TechComplaintReason

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
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ComplaintContent(
    state: ComplaintUiState,
    onBack: () -> Unit,
    onRetry: () -> Unit,
    onReasonSelected: (TechComplaintReason) -> Unit,
    onDescriptionChanged: (String) -> Unit,
    onPhotoClick: () -> Unit,
    onSubmit: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when (state) {
            is ComplaintUiState.Success -> SuccessState(state = state, onBack = onBack)
            is ComplaintUiState.PhotoUploading, ComplaintUiState.Submitting -> LoadingState()
            is ComplaintUiState.Error -> ErrorState(message = state.message, onRetry = onRetry)
            is ComplaintUiState.Idle -> {
                var expanded by remember { mutableStateOf(false) }
                Column(modifier = Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    HsTrustBadge(text = "Partner support")
                    Text("Report an issue", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text(
                        "Use this when a customer, payout, or safety issue needs owner support review.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    HsSectionCard {
                        ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
                            OutlinedTextField(
                                value = state.selectedReason?.displayLabel() ?: "Select reason",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Issue type") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                                modifier = Modifier.menuAnchor(MenuAnchorType.PrimaryNotEditable, true).fillMaxWidth(),
                            )
                            ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                                TechComplaintReason.entries.forEach { reason ->
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
                            label = { Text("Describe the issue") },
                            supportingText = { Text("${state.description.length}/2000") },
                            minLines = 4,
                            maxLines = 8,
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Spacer(Modifier.height(14.dp))
                        HsSecondaryButton(
                            text = if (state.photoStoragePath != null) "Photo attached" else "Attach photo (optional)",
                            onClick = onPhotoClick,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                    Spacer(Modifier.weight(1f))
                    HsPrimaryButton(
                        text = "Submit issue",
                        onClick = onSubmit,
                        enabled = state.submitEnabled,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
    }
}

@Composable
private fun SuccessState(
    state: ComplaintUiState.Success,
    onBack: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("Issue received", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text(statusMessage(state.status), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(24.dp))
        HsPrimaryButton(text = "Back to job", onClick = onBack)
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
        Text("Submitting issue", color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun ErrorState(
    message: String,
    onRetry: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text("Something went wrong", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text(message, color = MaterialTheme.colorScheme.error)
        Spacer(Modifier.height(16.dp))
        HsPrimaryButton(text = "Try again", onClick = onRetry)
    }
}

private fun statusMessage(status: String): String =
    when (status) {
        "INVESTIGATING" -> "Owner support is reviewing this issue."
        "RESOLVED" -> "This issue has been resolved."
        else -> "Owner support will respond within 2 hours."
    }

private fun TechComplaintReason.displayLabel(): String =
    when (this) {
        TechComplaintReason.CUSTOMER_MISCONDUCT -> "Customer misconduct"
        TechComplaintReason.LATE_PAYMENT -> "Payment not received"
        TechComplaintReason.SAFETY_CONCERN -> "Safety concern"
        TechComplaintReason.OTHER -> "Other"
    }
