package com.homeservices.technician.ui.jobOffer

import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.compose.animation.core.animateFloatAsState
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.getSystemService
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.components.HsInfoRow
import com.homeservices.designsystem.components.HsPriceText
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTrustBadge
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
                    // Haptic not available on emulator/test.
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
                .padding(16.dp),
        verticalArrangement = Arrangement.SpaceBetween,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            HsTrustBadge(text = stringResource(R.string.job_offer_new_request))
            Spacer(Modifier.height(18.dp))
            Box(contentAlignment = Alignment.Center) {
                CircularProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.size(104.dp),
                    color = countdownColor,
                    strokeWidth = 7.dp,
                )
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "$remainingSeconds",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = countdownColor,
                    )
                    Text(
                        text = stringResource(R.string.job_offer_seconds),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }

        HsSectionCard {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = offer.serviceName,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                    )
                    Text(
                        text = stringResource(R.string.job_offer_why_you),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )
                }
                HsInfoRow(label = stringResource(R.string.job_offer_address), value = offer.addressText)
                HsInfoRow(
                    label = stringResource(R.string.job_offer_slot),
                    value = "${offer.slotDate} ${offer.slotWindow}",
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = stringResource(R.string.job_offer_distance),
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            text = stringResource(R.string.job_offer_distance_km, offer.distanceKm),
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = stringResource(R.string.job_offer_earnings),
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        HsPriceText(pricePaise = offer.amountPaise.toInt())
                    }
                }
            }
        }

        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            HsPrimaryButton(
                text = stringResource(R.string.job_offer_accept),
                onClick = onAccept,
                modifier = Modifier.fillMaxWidth(),
            )
            HsSecondaryButton(
                text = stringResource(R.string.job_offer_decline),
                onClick = onDecline,
                modifier = Modifier.fillMaxWidth(),
            )
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
        modifier = modifier.fillMaxSize().padding(24.dp),
        contentAlignment = Alignment.Center,
    ) {
        HsSectionCard {
            Text(
                text = message,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color =
                    if (isSuccess) {
                        MaterialTheme.colorScheme.primary
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    },
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
