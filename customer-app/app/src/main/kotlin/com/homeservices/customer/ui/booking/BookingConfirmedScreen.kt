package com.homeservices.customer.ui.booking

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.customer.ui.shared.TrustDossierCard
import com.homeservices.customer.ui.shared.TrustDossierUiState
import com.homeservices.customer.ui.shared.TrustDossierViewModel
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTimelineStep

/**
 * Booking confirmation screen.
 *
 * E11-S05b-1 additive change: [technicianId] is an optional parameter (default null).
 * When non-null, [TrustDossierViewModel] is loaded and [TrustDossierCard] is shown in
 * compact mode below the timeline. When null, the card is not rendered.
 */
@Composable
internal fun BookingConfirmedScreen(
    bookingId: String,
    onBackToHome: () -> Unit,
    onTrackBooking: (bookingId: String) -> Unit = {},
    technicianId: String? = null,
) {
    val trustDossierViewModel: TrustDossierViewModel? =
        if (technicianId != null) hiltViewModel() else null

    LaunchedEffect(technicianId) {
        if (technicianId != null) trustDossierViewModel?.loadProfile(technicianId)
    }

    val trustUiState: TrustDossierUiState =
        if (trustDossierViewModel != null) {
            val state by trustDossierViewModel.uiState.collectAsStateWithLifecycle()
            state
        } else {
            TrustDossierUiState.Unavailable
        }

    ConfirmationBody(
        bookingId = bookingId,
        trustUiState = trustUiState,
        onBackToHome = onBackToHome,
        onTrackBooking = onTrackBooking,
    )
}

@Composable
private fun ConfirmationBody(
    bookingId: String,
    trustUiState: TrustDossierUiState,
    onBackToHome: () -> Unit,
    onTrackBooking: (bookingId: String) -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(28.dp))
        ConfirmationSuccessIcon()
        Spacer(Modifier.height(18.dp))
        Text(
            text = stringResource(R.string.booking_confirmed_title),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = stringResource(R.string.booking_confirmed_body),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(18.dp))
        Text(
            text = stringResource(R.string.booking_confirmed_id_label, bookingId),
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(18.dp))
        ConfirmationTimeline()
        Spacer(Modifier.height(14.dp))
        // Always show TrustDossierCard:
        // - When technicianId is non-null and load succeeded → shows tech profile (compact).
        // - When technicianId is null (no tech assigned yet) → Unavailable state renders
        //   the platform-level trust signal list ("All HomeServices technicians are verified…").
        // - On Error state, fall back to Unavailable rather than hiding the card entirely.
        val effectiveTrustState =
            if (trustUiState is TrustDossierUiState.Error) TrustDossierUiState.Unavailable else trustUiState
        TrustDossierCard(uiState = effectiveTrustState, compact = true, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.weight(1f))
        HsPrimaryButton(
            text = stringResource(R.string.booking_confirmed_track),
            onClick = { onTrackBooking(bookingId) },
            modifier = Modifier.fillMaxWidth().navigationBarsPadding().height(56.dp),
        )
        Spacer(Modifier.height(8.dp))
        HsSecondaryButton(
            text = stringResource(R.string.booking_confirmed_home),
            onClick = onBackToHome,
            modifier = Modifier.fillMaxWidth().height(52.dp),
        )
    }
}

@Composable
private fun ConfirmationSuccessIcon() {
    Surface(
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.primaryContainer,
    ) {
        Icon(
            imageVector = Icons.Filled.CheckCircle,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onPrimaryContainer,
            modifier = Modifier.padding(18.dp).size(52.dp),
        )
    }
}

@Composable
private fun ConfirmationTimeline() {
    HsSectionCard {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            HsTimelineStep(
                title = stringResource(R.string.booking_timeline_paid),
                body = stringResource(R.string.booking_timeline_paid_body),
            )
            HsTimelineStep(
                title = stringResource(R.string.booking_timeline_assigning),
                body = stringResource(R.string.booking_timeline_assigning_body),
            )
            HsTimelineStep(
                title = stringResource(R.string.booking_timeline_tracking),
                body = stringResource(R.string.booking_timeline_tracking_body),
            )
        }
    }
}
