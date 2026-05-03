package com.homeservices.customer.ui.tracking

import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AssistChip
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.designsystem.components.HsSecondaryButton

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun LiveTrackingScreen(
    viewModel: LiveTrackingViewModel = hiltViewModel(),
    sosViewModel: SosViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onFileComplaint: (bookingId: String) -> Unit = {},
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val sosUiState by sosViewModel.sosUiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val isInProgress =
        uiState is LiveTrackingUiState.Tracking &&
            (uiState as LiveTrackingUiState.Tracking).status is BookingStatus.InProgress

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Track service") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (isInProgress) {
                        IconButton(onClick = { sosViewModel.onSosTapped() }) {
                            Icon(
                                Icons.Filled.Warning,
                                contentDescription = "Safety alert",
                                tint = MaterialTheme.colorScheme.error,
                            )
                        }
                    }
                },
            )
        },
    ) { innerPadding ->
        LiveTrackingContent(
            uiState = uiState,
            onFileComplaint = onFileComplaint,
            modifier = Modifier.padding(innerPadding),
        )
    }

    when (val sos = sosUiState) {
        is SosUiState.ShowConsent ->
            SosConsentDialog(
                onGranted = { sosViewModel.onConsentResolved(true) },
                onDenied = { sosViewModel.onConsentResolved(false) },
            )
        is SosUiState.Countdown ->
            SosBottomSheet(
                secondsLeft = sos.secondsLeft,
                onCancel = { sosViewModel.onCancelCountdown() },
                onConfirmNow = { sosViewModel.onSendNow() },
            )
        is SosUiState.SosConfirmed -> {
            LaunchedEffect(sos) { snackbarHostState.showSnackbar("Safety alert sent to owner support.") }
        }
        is SosUiState.SosError -> {
            LaunchedEffect(sos) { snackbarHostState.showSnackbar("Could not send alert. Please try again.") }
        }
        else -> Unit
    }
}

@Composable
internal fun LiveTrackingContent(
    uiState: LiveTrackingUiState,
    onFileComplaint: (bookingId: String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when (val state = uiState) {
            is LiveTrackingUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is LiveTrackingUiState.Tracking -> TrackingBody(state = state, onFileComplaint = onFileComplaint)
        }
    }
}

@Composable
private fun TrackingBody(
    state: LiveTrackingUiState.Tracking,
    onFileComplaint: (bookingId: String) -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                text = state.techName.ifBlank { "Your technician" },
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                AssistChip(onClick = {}, label = { Text(statusLabel(state.status)) })
                state.etaMinutes?.let { AssistChip(onClick = {}, label = { Text("ETA $it min") }) }
            }
        }

        state.location?.let { loc ->
            val techLatLng = LatLng(loc.lat, loc.lng)
            val cameraPositionState =
                rememberCameraPositionState {
                    position = CameraPosition.fromLatLngZoom(techLatLng, 15f)
                }
            GoogleMap(
                modifier = Modifier.fillMaxWidth().height(300.dp),
                cameraPositionState = cameraPositionState,
            ) {
                Marker(
                    state = MarkerState(position = techLatLng),
                    title = state.techName.ifBlank { "Technician" },
                )
            }
        } ?: MapPlaceholder()

        Column(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium,
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 1.dp,
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Service progress", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    StatusTimeline(currentStatus = state.status)
                }
            }
            if (state.status is BookingStatus.Closed) {
                HsSecondaryButton(
                    text = "File a complaint",
                    onClick = { onFileComplaint(state.bookingId) },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun MapPlaceholder() {
    Box(
        modifier =
            Modifier
                .fillMaxWidth()
                .height(300.dp)
                .background(MaterialTheme.colorScheme.primaryContainer),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(24.dp)) {
            Text(
                text = "Live location will appear here",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = "We update the technician position as soon as tracking starts.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun StatusTimeline(currentStatus: BookingStatus) {
    val stages =
        listOf(
            BookingStatus.EnRoute to "En route",
            BookingStatus.Reached to "Arrived",
            BookingStatus.InProgress to "Working",
            BookingStatus.Completed to "Done",
        )
    val activeIndex = stages.indexOfFirst { (status, _) -> status == currentStatus }

    stages.forEachIndexed { index, (_, label) ->
        val isActive = activeIndex >= 0 && index <= activeIndex
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 3.dp)) {
            Surface(
                modifier = Modifier.size(if (isActive) 14.dp else 10.dp),
                shape = MaterialTheme.shapes.extraSmall,
                color =
                    if (isActive) {
                        MaterialTheme.colorScheme.primary
                    } else {
                        MaterialTheme.colorScheme.surfaceVariant
                    },
            ) {}
            Spacer(Modifier.width(12.dp))
            Text(
                text = label,
                style = if (isActive) MaterialTheme.typography.bodyMedium else MaterialTheme.typography.bodySmall,
                color = if (isActive) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

private fun statusLabel(status: BookingStatus): String =
    when (status) {
        BookingStatus.PendingPayment -> "Payment pending"
        BookingStatus.Paid -> "Booking confirmed"
        BookingStatus.Searching -> "Finding technician"
        BookingStatus.Assigned -> "Technician assigned"
        BookingStatus.EnRoute -> "Technician on the way"
        BookingStatus.Reached -> "Technician arrived"
        BookingStatus.InProgress -> "Work in progress"
        BookingStatus.AwaitingPriceApproval -> "Price approval needed"
        BookingStatus.Completed -> "Service completed"
        BookingStatus.Closed -> "Booking closed"
        BookingStatus.Cancelled -> "Booking cancelled"
        BookingStatus.Unfulfilled -> "Technician unavailable"
        BookingStatus.Unknown -> "Status unavailable"
    }
