package com.homeservices.customer.ui.tracking

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
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
                title = { Text("Tracking your service") },
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
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                },
            )
        },
    ) { innerPadding ->
        when (val state = uiState) {
            is LiveTrackingUiState.Loading -> {
                Box(
                    modifier =
                        Modifier
                            .fillMaxSize()
                            .padding(innerPadding),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator()
                }
            }
            is LiveTrackingUiState.Tracking -> {
                Column(
                    modifier =
                        Modifier
                            .fillMaxSize()
                            .padding(innerPadding),
                ) {
                    state.etaMinutes?.let { eta ->
                        Row(
                            modifier =
                                Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = state.techName.ifBlank { "Your technician" },
                                style = MaterialTheme.typography.titleMedium,
                            )
                            AssistChip(
                                onClick = {},
                                label = { Text("ETA $eta min") },
                            )
                        }
                    }

                    state.location?.let { loc ->
                        val techLatLng = LatLng(loc.lat, loc.lng)
                        val cameraPositionState =
                            rememberCameraPositionState {
                                position = CameraPosition.fromLatLngZoom(techLatLng, 15f)
                            }
                        GoogleMap(
                            modifier =
                                Modifier
                                    .fillMaxWidth()
                                    .height(300.dp),
                            cameraPositionState = cameraPositionState,
                        ) {
                            Marker(
                                state = MarkerState(position = techLatLng),
                                title = state.techName.ifBlank { "Technician" },
                            )
                        }
                    } ?: run {
                        Box(
                            modifier =
                                Modifier
                                    .fillMaxWidth()
                                    .height(300.dp),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                text = "Waiting for technician location…",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    Column(
                        modifier =
                            Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Text(
                            text = "Status",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        StatusTimeline(currentStatus = state.status)
                        if (state.status is BookingStatus.Closed) {
                            Spacer(Modifier.height(8.dp))
                            OutlinedButton(
                                onClick = { onFileComplaint(state.bookingId) },
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Text("शिकायत दर्ज करें")
                            }
                        }
                    }
                }
            }
        }
    }

    // SOS overlays — rendered above Scaffold so they cover all content
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
            LaunchedEffect(sos) {
                snackbarHostState.showSnackbar("मालिक को सूचित किया गया")
            }
        }
        is SosUiState.SosError -> {
            LaunchedEffect(sos) {
                snackbarHostState.showSnackbar("अलर्ट नहीं भेजा जा सका। फिर से कोशिश करें।")
            }
        }
        else -> Unit
    }
}

@Composable
private fun StatusTimeline(currentStatus: BookingStatus) {
    val stages =
        listOf(
            BookingStatus.EnRoute to "En route",
            BookingStatus.Reached to "Technician arrived",
            BookingStatus.InProgress to "Work in progress",
            BookingStatus.Completed to "Completed",
        )
    val activeIndex =
        stages
            .indexOfFirst { (status, _) -> status == currentStatus }
            .coerceAtLeast(0)

    stages.forEachIndexed { index, (_, label) ->
        val isActive = index <= activeIndex
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(12.dp),
                contentAlignment = Alignment.Center,
            ) {
                Box(modifier = Modifier.size(if (isActive) 12.dp else 8.dp))
            }
            Spacer(Modifier.width(12.dp))
            Text(
                text = label,
                style =
                    if (isActive) {
                        MaterialTheme.typography.bodyMedium
                    } else {
                        MaterialTheme.typography.bodySmall
                    },
                color =
                    if (isActive) {
                        MaterialTheme.colorScheme.onSurface
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    },
            )
        }
    }
}
