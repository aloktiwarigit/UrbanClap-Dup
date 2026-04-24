package com.homeservices.technician.ui.jobOffer

import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.getSystemService
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.technician.R
import com.homeservices.technician.domain.jobOffer.model.JobOffer

@Composable
internal fun JobOfferScreen(
    modifier: Modifier = Modifier,
    viewModel: JobOfferViewModel = hiltViewModel(),
): Unit {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    LaunchedEffect(uiState) {
        val state = uiState
        if (state is JobOfferUiState.Offering && state.remainingSeconds in 1..5) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try {
                    val vibrator = context.getSystemService<Vibrator>()
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK))
                } catch (_: Exception) {
                    // Haptic not available on emulator/test — guard silently
                }
            }
        }
    }

    JobOfferScreenContent(
        uiState = uiState,
        onAccept = viewModel::accept,
        onDecline = viewModel::decline,
        modifier = modifier,
    )
}

@Composable
internal fun JobOfferScreenContent(
    uiState: JobOfferUiState,
    onAccept: () -> Unit,
    onDecline: () -> Unit,
    modifier: Modifier = Modifier,
): Unit {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        when (uiState) {
            is JobOfferUiState.Idle -> Unit
            is JobOfferUiState.Offering -> {
                JobOfferContent(
                    offer = uiState.offer,
                    remainingSeconds = uiState.remainingSeconds,
                    onAccept = onAccept,
                    onDecline = onDecline,
                )
            }
            is JobOfferUiState.Accepted ->
                JobOfferResultContent(
                    message = stringResource(R.string.job_offer_accepted),
                    isSuccess = true,
                )
            is JobOfferUiState.Declined ->
                JobOfferResultContent(
                    message = stringResource(R.string.job_offer_declined),
                    isSuccess = false,
                )
            is JobOfferUiState.Expired ->
                JobOfferResultContent(
                    message = stringResource(R.string.job_offer_expired),
                    isSuccess = false,
                )
        }
    }
}

@Composable
private fun JobOfferContent(
    offer: JobOffer,
    remainingSeconds: Int,
    onAccept: () -> Unit,
    onDecline: () -> Unit,
    modifier: Modifier = Modifier,
): Unit {
    val isLastFiveSeconds = remainingSeconds <= 5
    val countdownColor =
        if (isLastFiveSeconds) {
            MaterialTheme.colorScheme.error
        } else {
            MaterialTheme.colorScheme.primary
        }
    val progress by animateFloatAsState(
        targetValue = (remainingSeconds / 30f).coerceIn(0f, 1f),
        label = "countdown",
    )

    Column(
        modifier =
            modifier
                .fillMaxSize()
                .padding(24.dp),
        verticalArrangement = Arrangement.SpaceBetween,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // Header: countdown ring
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.padding(top = 32.dp),
        ) {
            CircularProgressIndicator(
                progress = { progress },
                modifier = Modifier.size(96.dp),
                color = countdownColor,
                strokeWidth = 6.dp,
            )
            Text(
                text = "$remainingSeconds",
                style = MaterialTheme.typography.headlineMedium,
                color = countdownColor,
            )
        }

        // Job details
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = offer.serviceName,
                style = MaterialTheme.typography.headlineSmall,
                textAlign = TextAlign.Center,
            )
            Text(
                text = offer.addressText,
                style = MaterialTheme.typography.bodyLarge,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = "${offer.slotDate}  ${offer.slotWindow}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = "%.1f km away".format(offer.distanceKm),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = "Earnings: ₹${offer.amountPaise / 100}",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.primary,
            )
        }

        // Accept / Decline buttons
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Button(
                onClick = onAccept,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                colors =
                    ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF2E7D32),
                    ),
            ) {
                Text("Accept", style = MaterialTheme.typography.titleMedium)
            }
            OutlinedButton(
                onClick = onDecline,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .height(56.dp),
            ) {
                Text("Decline", style = MaterialTheme.typography.titleMedium)
            }
        }
    }
}

@Composable
private fun JobOfferResultContent(
    message: String,
    isSuccess: Boolean,
    modifier: Modifier = Modifier,
): Unit {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = message,
            style = MaterialTheme.typography.headlineSmall,
            color =
                if (isSuccess) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                },
            textAlign = TextAlign.Center,
        )
    }
}
