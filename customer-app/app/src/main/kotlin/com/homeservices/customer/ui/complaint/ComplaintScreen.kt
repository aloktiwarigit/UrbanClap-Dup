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
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.domain.complaint.ComplaintReason

@OptIn(ExperimentalMaterial3Api::class)
@Composable
public fun ComplaintScreen(
    bookingId: String,
    onBack: () -> Unit,
    viewModel: ComplaintViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(bookingId) { viewModel.loadStatus(bookingId) }

    when (val state = uiState) {
        is ComplaintUiState.Success -> {
            val statusText =
                when (state.status) {
                    "INVESTIGATING" -> "मालिक जांच कर रहे हैं।"
                    "RESOLVED" -> "शिकायत सुलझा दी गई।"
                    else -> "मालिक 2 घंटे में जवाब देंगे।"
                }
            Column(
                modifier =
                    Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Text(
                    text = "आपकी शिकायत दर्ज हो गई।",
                    style = MaterialTheme.typography.headlineSmall,
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = statusText,
                    style = MaterialTheme.typography.bodyMedium,
                )
                Spacer(modifier = Modifier.height(24.dp))
                Button(onClick = onBack) {
                    Text(text = "वापस जाएं")
                }
            }
        }

        is ComplaintUiState.PhotoUploading, ComplaintUiState.Submitting -> {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                CircularProgressIndicator()
            }
        }

        is ComplaintUiState.Error -> {
            Column(
                modifier =
                    Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                verticalArrangement = Arrangement.Center,
            ) {
                Text(
                    text = "त्रुटि: ${state.message}",
                    color = MaterialTheme.colorScheme.error,
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = { viewModel.onRetry() }) {
                    Text(text = "पुनः प्रयास करें")
                }
            }
        }

        is ComplaintUiState.Idle -> {
            var expanded by remember { mutableStateOf(false) }
            val context = LocalContext.current
            val photoPicker =
                rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
                    uri ?: return@rememberLauncherForActivityResult
                    val tmpFile = java.io.File(context.cacheDir, "complaint_photo_${System.currentTimeMillis()}.jpg")
                    context.contentResolver.openInputStream(uri)?.use { input ->
                        tmpFile.outputStream().use { output -> input.copyTo(output) }
                    }
                    viewModel.onPhotoSelected(tmpFile.absolutePath, bookingId)
                }
            Column(
                modifier =
                    Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text(
                    text = "शिकायत दर्ज करें",
                    style = MaterialTheme.typography.headlineSmall,
                )
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = it },
                ) {
                    OutlinedTextField(
                        value = state.selectedReason?.labelHindi ?: "कारण चुनें",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text(text = "समस्या का कारण") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier =
                            Modifier
                                .menuAnchor(MenuAnchorType.PrimaryNotEditable, true)
                                .fillMaxWidth(),
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false },
                    ) {
                        ComplaintReason.entries.forEach { reason ->
                            DropdownMenuItem(
                                text = { Text(text = reason.labelHindi) },
                                onClick = {
                                    viewModel.onReasonSelected(reason)
                                    expanded = false
                                },
                            )
                        }
                    }
                }
                OutlinedTextField(
                    value = state.description,
                    onValueChange = { viewModel.onDescriptionChanged(it) },
                    label = { Text(text = "विवरण (10–2000 अक्षर)") },
                    supportingText = { Text(text = "${state.description.length}/2000") },
                    minLines = 4,
                    maxLines = 8,
                    modifier = Modifier.fillMaxWidth(),
                )
                val photoButtonLabel =
                    if (state.photoStoragePath != null) "फ़ोटो बदलें ✓" else "फ़ोटो जोड़ें (वैकल्पिक)"
                OutlinedButton(
                    onClick = { photoPicker.launch("image/*") },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(text = photoButtonLabel)
                }
                Button(
                    onClick = { viewModel.onSubmit(bookingId) },
                    enabled = state.submitEnabled,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(text = "शिकायत दर्ज करें")
                }
            }
        }
    }
}
