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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTimelineStep
import com.homeservices.designsystem.components.HsTrustBadge
import com.homeservices.designsystem.theme.LocalHomeservicesSpacing
import com.homeservices.technician.BuildConfig
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
            is KycUiState.AadhaarPending -> launchCustomTab(context, state.consentUrl)
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
                    onSkip = onComplete,
                )
            }
            is KycUiState.Loading -> KycLoadingContent(message = "Processing verification")
            is KycUiState.AadhaarPending -> KycLoadingContent(message = "Opening DigiLocker")
            is KycUiState.AadhaarDone -> {
                KycStepPan(
                    selectedUri = null,
                    onUriSelected = { uri ->
                        if (uri != null) viewModel.submitPan(uri)
                    },
                )
            }
            is KycUiState.PanReady -> {
                KycStepPan(
                    selectedUri = Uri.parse(state.uploadUri),
                    onUriSelected = { uri ->
                        if (uri != null) viewModel.submitPan(uri)
                    },
                )
            }
            is KycUiState.PanUploading -> KycLoadingContent(message = "Uploading PAN card")
            is KycUiState.Complete -> KycStepReview(status = state.status, onRetry = null)
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
private fun KycFrame(
    eyebrow: String,
    title: String,
    body: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val spacing = LocalHomeservicesSpacing.current
    Column(
        modifier =
            modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(spacing.space6),
        verticalArrangement = Arrangement.Center,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(spacing.space3)) {
            HsTrustBadge(text = eyebrow)
            Text(
                text = title,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = body,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(modifier = Modifier.height(spacing.space6))
        HsSectionCard {
            content()
        }
    }
}

@Composable
internal fun KycStepAadhaar(
    onStartKyc: () -> Unit,
    onSkip: () -> Unit,
    modifier: Modifier = Modifier,
) {
    KycFrame(
        eyebrow = "Step 1 of 2",
        title = "Verify your identity",
        body = "Complete Aadhaar verification through DigiLocker before you can receive live jobs.",
        modifier = modifier,
    ) {
        HsTimelineStep(
            title = "DigiLocker consent",
            body = "You approve access directly with DigiLocker. We only store the verification outcome.",
        )
        Spacer(modifier = Modifier.height(16.dp))
        HsTimelineStep(
            title = "Secure profile unlock",
            body = "Verified partners can continue to PAN upload and job activation.",
        )
        Spacer(modifier = Modifier.height(24.dp))
        HsPrimaryButton(
            text = "Verify with DigiLocker",
            onClick = onStartKyc,
            modifier = Modifier.fillMaxWidth(),
        )
        if (BuildConfig.DEBUG) {
            Spacer(modifier = Modifier.height(12.dp))
            HsSecondaryButton(
                text = "Skip KYC (debug only)",
                onClick = onSkip,
                modifier = Modifier.fillMaxWidth(),
            )
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

    KycPanContent(
        selectedUri = selectedUri,
        onChoosePhoto = { launcher.launch("image/*") },
        onSubmit = { onUriSelected(selectedUri) },
        modifier = modifier,
    )
}

@Composable
internal fun KycPanContent(
    selectedUri: Uri?,
    onChoosePhoto: () -> Unit,
    onSubmit: () -> Unit,
    modifier: Modifier = Modifier,
) {
    KycFrame(
        eyebrow = "Step 2 of 2",
        title = "Upload PAN card",
        body = "Add a clear PAN card image so finance can approve payouts and tax records.",
        modifier = modifier,
    ) {
        HsTimelineStep(
            title = "Photo quality",
            body = "Keep all corners visible, avoid glare, and make sure the PAN number is readable.",
        )
        Spacer(modifier = Modifier.height(16.dp))
        HsTimelineStep(
            title = "Review",
            body = "Most document checks complete quickly after submission.",
        )
        Spacer(modifier = Modifier.height(24.dp))
        HsPrimaryButton(
            text = if (selectedUri == null) "Upload PAN card photo" else "Change photo",
            onClick = onChoosePhoto,
            modifier = Modifier.fillMaxWidth(),
        )
        if (selectedUri != null) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Photo selected. Submit it for verification.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(modifier = Modifier.height(16.dp))
            HsSecondaryButton(
                text = "Submit for review",
                onClick = onSubmit,
                modifier = Modifier.fillMaxWidth(),
            )
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
    if (errorMessage != null) {
        KycFrame(
            eyebrow = "Action needed",
            title = "Verification did not complete",
            body = errorMessage,
            modifier = modifier,
        ) {
            if (onRetry != null) {
                HsPrimaryButton(
                    text = "Try again",
                    onClick = onRetry,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    } else {
        KycFrame(
            eyebrow = "Submitted",
            title = "KYC under review",
            body = "Your documents are with the verification team. You will be notified once approved.",
            modifier = modifier,
        ) {
            Text(
                text = "Current status",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = status?.name ?: "UNKNOWN",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
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
        KycFrame(
            eyebrow = "Verification",
            title = message,
            body = "Keep this screen open while the secure check continues.",
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                CircularProgressIndicator()
                Spacer(modifier = Modifier.height(16.dp))
                Text(text = "Please wait", style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

private fun launchCustomTab(
    context: Context,
    url: String,
) {
    val intent = CustomTabsIntent.Builder().build()
    intent.launchUrl(context, Uri.parse(url))
}
