package com.homeservices.customer.ui.tracking

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AssistChip
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
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
import com.homeservices.customer.R
import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.customer.domain.tracking.model.isSosEligible
import com.homeservices.customer.ui.shared.TrustDossierCard
import com.homeservices.customer.ui.shared.TrustDossierUiState
import com.homeservices.customer.ui.shared.TrustDossierViewModel
import com.homeservices.customer.ui.wallet.NoShowCreditBanner
import com.homeservices.customer.ui.wallet.NoShowCreditViewModel
import com.homeservices.designsystem.components.HsScreenTitle
import com.homeservices.designsystem.components.HsSecondaryButton

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun LiveTrackingScreen(
    viewModel: LiveTrackingViewModel = hiltViewModel(),
    sosViewModel: SosViewModel = hiltViewModel(),
    noShowVm: NoShowCreditViewModel = hiltViewModel(),
    trustDossierViewModel: TrustDossierViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onFileComplaint: (bookingId: String) -> Unit = {},
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val sosUiState by sosViewModel.sosUiState.collectAsStateWithLifecycle()
    val noShowEvent by noShowVm.event.collectAsStateWithLifecycle()
    val trustDossierUiState by trustDossierViewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    // Hoisted: the semantics{} lambda below is not a composable scope.
    val sosContentDescription = stringResource(R.string.tracking_sos_desc)
    // SAFE-SOS-002: SOS must be reachable for the whole on-site window, not only while work is
    // in progress. EN_ROUTE and REACHED are the highest-risk states, not the lowest.
    val isSosAvailable =
        (uiState as? LiveTrackingUiState.Tracking)?.status?.isSosEligible == true

    val technicianId = (uiState as? LiveTrackingUiState.Tracking)?.technicianId
    LaunchedEffect(technicianId) {
        if (technicianId != null) {
            trustDossierViewModel.loadProfile(technicianId)
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { HsScreenTitle(text = stringResource(R.string.tracking_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.tracking_back_desc),
                        )
                    }
                },
                actions = {
                    if (isSosAvailable) {
                        // SAFE-SOS-003: icon + text, never icon alone — this is the one control
                        // where guessing wrong has physical consequences.
                        TextButton(
                            onClick = { sosViewModel.onSosTapped() },
                            colors =
                                ButtonDefaults.textButtonColors(
                                    contentColor = MaterialTheme.colorScheme.error,
                                ),
                            modifier =
                                Modifier
                                    .defaultMinSize(minWidth = 48.dp, minHeight = 48.dp)
                                    .semantics { contentDescription = sosContentDescription },
                        ) {
                            Icon(Icons.Filled.Warning, contentDescription = null)
                            Spacer(Modifier.width(4.dp))
                            Text(
                                text = stringResource(R.string.tracking_sos_label),
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                },
            )
        },
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            LiveTrackingContent(
                uiState = uiState,
                onFileComplaint = onFileComplaint,
                trustDossierUiState = trustDossierUiState,
            )
            noShowEvent?.let { evt ->
                NoShowCreditBanner(
                    creditAmountPaise = evt.creditAmountPaise,
                    onDismiss = noShowVm::dismiss,
                    modifier =
                        Modifier
                            .align(Alignment.TopCenter)
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                )
            }
        }
    }

    SosOverlay(sosUiState = sosUiState, sosViewModel = sosViewModel, snackbarHostState = snackbarHostState)
}

@Composable
private fun SosOverlay(
    sosUiState: SosUiState,
    sosViewModel: SosViewModel,
    snackbarHostState: SnackbarHostState,
) {
    val sosConfirmedMsg = stringResource(R.string.tracking_sos_confirmed)
    val sosErrorMsg = stringResource(R.string.tracking_sos_error)
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
            LaunchedEffect(sos) { snackbarHostState.showSnackbar(sosConfirmedMsg) }
        }
        is SosUiState.SosError -> {
            LaunchedEffect(sos) { snackbarHostState.showSnackbar(sosErrorMsg) }
        }
        is SosUiState.UploadingEvidence ->
            SosUploadingEvidenceSheet(pct = sos.pct, onDismiss = {})
        is SosUiState.EvidenceSaved ->
            SosEvidenceSavedSheet(onDismiss = { sosViewModel.onDismissEvidenceResult() })
        is SosUiState.EvidenceUploadError ->
            SosEvidenceUploadErrorSheet(
                message = sos.message,
                onRetry = { sosViewModel.onRetryEvidenceUpload() },
                onDismiss = { sosViewModel.onDismissEvidenceResult() },
            )
        else -> Unit
    }
}

@Composable
internal fun LiveTrackingContent(
    uiState: LiveTrackingUiState,
    onFileComplaint: (bookingId: String) -> Unit,
    modifier: Modifier = Modifier,
    trustDossierUiState: TrustDossierUiState = TrustDossierUiState.Unavailable,
) {
    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when (val state = uiState) {
            is LiveTrackingUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is LiveTrackingUiState.Tracking ->
                TrackingBody(
                    state = state,
                    trustDossierUiState = trustDossierUiState,
                    onFileComplaint = onFileComplaint,
                )
        }
    }
}

@Composable
private fun TrackingBody(
    state: LiveTrackingUiState.Tracking,
    trustDossierUiState: TrustDossierUiState,
    onFileComplaint: (bookingId: String) -> Unit,
) {
    val defaultTechName = stringResource(R.string.tracking_your_technician)
    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        TrackingTechHeader(state = state, defaultTechName = defaultTechName)
        TrackingMapSection(state = state, defaultTechName = defaultTechName)
        TrackingServiceProgressCard(state = state, onFileComplaint = onFileComplaint)
        if (state.technicianId != null) {
            TrustDossierCard(
                uiState = trustDossierUiState,
                compact = false,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .padding(bottom = 16.dp),
            )
        }
    }
}

@Composable
private fun TrackingTechHeader(
    state: LiveTrackingUiState.Tracking,
    defaultTechName: String,
) {
    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = state.techName.ifBlank { defaultTechName },
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            AssistChip(onClick = {}, label = { Text(statusLabel(state.status)) })
            state.etaMinutes?.let {
                AssistChip(onClick = {}, label = { Text(stringResource(R.string.tracking_eta_chip, it)) })
            }
        }
    }
}

@Composable
private fun TrackingMapSection(
    state: LiveTrackingUiState.Tracking,
    defaultTechName: String,
) {
    val resolvedLat = state.liveLat ?: state.location?.lat
    val resolvedLng = state.liveLng ?: state.location?.lng
    if (resolvedLat != null && resolvedLng != null) {
        val techLatLng = LatLng(resolvedLat, resolvedLng)
        val techNameForMarker = state.techName.ifBlank { defaultTechName }
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
                title = techNameForMarker,
            )
        }
    } else {
        MapPlaceholder()
    }
}

@Composable
private fun TrackingServiceProgressCard(
    state: LiveTrackingUiState.Tracking,
    onFileComplaint: (bookingId: String) -> Unit,
) {
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
                Text(
                    stringResource(R.string.tracking_service_progress),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                )
                StatusTimeline(currentStatus = state.status)
            }
        }
        if (state.status is BookingStatus.Closed) {
            HsSecondaryButton(
                text = stringResource(R.string.tracking_file_complaint),
                onClick = { onFileComplaint(state.bookingId) },
                modifier = Modifier.fillMaxWidth(),
            )
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
                text = stringResource(R.string.tracking_map_placeholder_title),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = stringResource(R.string.tracking_map_placeholder_body),
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
            BookingStatus.EnRoute to stringResource(R.string.status_en_route),
            BookingStatus.Reached to stringResource(R.string.status_reached),
            BookingStatus.InProgress to stringResource(R.string.status_in_progress),
            BookingStatus.Completed to stringResource(R.string.status_done),
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

// NOTE: statusLabel is a non-composable function retained for backward-compat with callers
// that cannot access stringResource. Composable callers (like TrackingBody) should use
// the composable overload above (StatusTimeline / label chip) instead.
// TODO(E12-S02a): convert status enum labels fully in E18 when all callers are composable.
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
