package com.homeservices.technician.ui.kyc

import android.content.Context
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.technician.domain.kyc.model.KycStatus

@Composable
internal fun KycScreen(
    onComplete: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: KycViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    LaunchedEffect(uiState) {
        when (val state = uiState) {
            is KycUiState.AadhaarPending -> {
                launchCustomTab(context, state.consentUrl)
            }
            is KycUiState.Complete -> onComplete()
            else -> Unit
        }
    }

    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        when (val state = uiState) {
            is KycUiState.Idle -> {
                KycStepAadhaar(
                    onStartKyc = { viewModel.startKyc() },
                )
            }
            is KycUiState.Loading -> {
                KycLoadingContent(message = "Processing\u2026")
            }
            is KycUiState.AadhaarPending -> {
                // CustomTab launched via LaunchedEffect — show waiting message
                KycLoadingContent(message = "Opening DigiLocker\u2026")
            }
            is KycUiState.AadhaarDone -> {
                KycStepPan(
                    selectedUri = null,
                    onUriSelected = { uri ->
                        if (uri != null) {
                            viewModel.submitPan(uri)
                        }
                    },
                )
            }
            is KycUiState.PanReady -> {
                KycStepPan(
                    selectedUri = Uri.parse(state.uploadUri),
                    onUriSelected = { uri ->
                        if (uri != null) {
                            viewModel.submitPan(uri)
                        }
                    },
                )
            }
            is KycUiState.PanUploading -> {
                KycLoadingContent(message = "Uploading PAN card\u2026")
            }
            is KycUiState.Complete -> {
                KycStepReview(status = state.status, onRetry = null)
            }
            is KycUiState.Error -> {
                KycStepReview(
                    status = null,
                    onRetry = { viewModel.startKyc() },
                    errorMessage = state.message,
                )
            }
        }
    }
}

@Composable
internal fun KycStepAadhaar(
    onStartKyc: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier =
            modifier
                .fillMaxSize()
                .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "Step 1 of 2: Aadhaar Verification",
            style = MaterialTheme.typography.headlineSmall,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Verify your identity using DigiLocker. Your Aadhaar data is fetched securely.",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(32.dp))
        Button(
            onClick = onStartKyc,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Verify with DigiLocker")
        }
    }
}

@Composable
internal fun KycStepPan(
    selectedUri: Uri?,
    onUriSelected: (Uri?) -> Unit,
    modifier: Modifier = Modifier,
) {
    val launcher =
        rememberLauncherForActivityResult(
            contract = ActivityResultContracts.GetContent(),
            onResult = { uri -> onUriSelected(uri) },
        )

    Column(
        modifier =
            modifier
                .fillMaxSize()
                .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "Step 2 of 2: PAN Card Upload",
            style = MaterialTheme.typography.headlineSmall,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Upload a clear photo of your PAN card for identity verification.",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(32.dp))
        Button(
            onClick = { launcher.launch("image/*") },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (selectedUri == null) "Upload PAN card photo" else "Change photo")
        }
        if (selectedUri != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Photo selected. Tap 'Submit' to continue.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = { onUriSelected(selectedUri) },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Submit")
            }
        }
    }
}

@Composable
internal fun KycStepReview(
    status: KycStatus?,
    onRetry: (() -> Unit)?,
    modifier: Modifier = Modifier,
    errorMessage: String? = null,
) {
    Column(
        modifier =
            modifier
                .fillMaxSize()
                .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (errorMessage != null) {
            Text(
                text = "Something went wrong",
                style = MaterialTheme.typography.headlineSmall,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.error,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = errorMessage,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (onRetry != null) {
                Spacer(modifier = Modifier.height(24.dp))
                Button(onClick = onRetry, modifier = Modifier.fillMaxWidth()) {
                    Text("Try again")
                }
            }
        } else {
            Text(
                text = "KYC Submitted",
                style = MaterialTheme.typography.headlineSmall,
                textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Status: ${status?.name ?: "Unknown"}",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Your documents are under review. You\u2019ll be notified once approved.",
                style = MaterialTheme.typography.bodySmall,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
internal fun KycLoadingContent(
    message: String,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator()
            Spacer(modifier = Modifier.height(16.dp))
            Text(text = message, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

private fun launchCustomTab(context: Context, url: String) {
    val intent = CustomTabsIntent.Builder().build()
    intent.launchUrl(context, android.net.Uri.parse(url))
}
