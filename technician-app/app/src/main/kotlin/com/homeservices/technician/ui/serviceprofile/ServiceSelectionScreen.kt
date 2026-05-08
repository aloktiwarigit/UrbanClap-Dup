package com.homeservices.technician.ui.serviceprofile

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTrustBadge
import com.homeservices.designsystem.theme.LocalHomeservicesSpacing
import com.homeservices.technician.BuildConfig

@Composable
internal fun ServiceSelectionScreen(
    onComplete: () -> Unit,
    modifier: Modifier = Modifier,
    autoCompleteExistingProfile: Boolean = false,
    mode: ServiceSelectionMode = ServiceSelectionMode.Onboarding,
    viewModel: ServiceSelectionViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(uiState.saved, uiState.existingCompleteProfileLoaded, autoCompleteExistingProfile) {
        if (uiState.saved || (autoCompleteExistingProfile && uiState.existingCompleteProfileLoaded)) onComplete()
    }

    ServiceSelectionContent(
        uiState = uiState,
        mode = mode,
        onSkillToggle = viewModel::toggleSkill,
        onLocateStarted = viewModel::onLocateStarted,
        onServiceAreaCaptured = viewModel::onServiceAreaCaptured,
        onLocateFailed = viewModel::onLocateFailed,
        onRetry = viewModel::refresh,
        onSubmit = viewModel::submit,
        modifier = modifier,
    )
}

@Composable
internal fun ServiceSelectionContent(
    uiState: ServiceSelectionUiState,
    mode: ServiceSelectionMode = ServiceSelectionMode.Onboarding,
    onSkillToggle: (String) -> Unit,
    onLocateStarted: () -> Unit,
    onServiceAreaCaptured: (Double, Double) -> Unit,
    onLocateFailed: (String) -> Unit,
    onRetry: () -> Unit,
    onSubmit: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val spacing = LocalHomeservicesSpacing.current
    val context = LocalContext.current
    val locationLauncher =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
            if (permissions.hasAnyLocationGrant()) {
                onLocateStarted()
                captureCurrentLocation(context, onServiceAreaCaptured, onLocateFailed)
            } else {
                onLocateFailed("Allow location access to set your service area.")
            }
        }
    val onUseCurrentLocation = {
        if (hasLocationPermission(context)) {
            onLocateStarted()
            captureCurrentLocation(context, onServiceAreaCaptured, onLocateFailed)
        } else {
            locationLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                ),
            )
        }
    }

    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize().statusBarsPadding(),
            contentPadding = PaddingValues(spacing.space6),
            verticalArrangement = Arrangement.spacedBy(spacing.space4),
        ) {
            item {
                ServiceSelectionHeader(mode = mode)
            }
            if (uiState.isLoading) {
                item { LoadingCard() }
            }
            item {
                ServiceListCard(
                    services = uiState.services,
                    selectedSkillIds = uiState.selectedSkillIds,
                    onSkillToggle = onSkillToggle,
                    enabled = !uiState.isSaving,
                )
            }
            item {
                LocationCard(
                    state = uiState,
                    onUseCurrentLocation = onUseCurrentLocation,
                    enabled = !uiState.isSaving && !uiState.isLoading,
                )
            }
            if (uiState.errorMessage != null) {
                item {
                    ErrorCard(
                        message = uiState.errorMessage,
                        onRetry = onRetry,
                        showRetry = !uiState.isSaving && uiState.errorMessage.startsWith("Could not load"),
                    )
                }
            }
            item {
                SaveButton(uiState = uiState, mode = mode, onSubmit = onSubmit)
            }
        }
    }
}

internal enum class ServiceSelectionMode {
    Onboarding,
    Edit,
}

@Composable
private fun ServiceSelectionHeader(mode: ServiceSelectionMode) {
    val spacing = LocalHomeservicesSpacing.current
    Column(verticalArrangement = Arrangement.spacedBy(spacing.space3)) {
        HsTrustBadge(text = if (mode == ServiceSelectionMode.Onboarding) "Step 3 of 3" else "My services")
        Text(
            text = if (mode == ServiceSelectionMode.Onboarding) "Choose your services" else "Update your services",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text =
                if (mode == ServiceSelectionMode.Onboarding) {
                    "Jobs are matched from these services and your approximate starting area."
                } else {
                    "Changes apply to future job offers matched from your skills and starting area."
                },
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun SaveButton(
    uiState: ServiceSelectionUiState,
    mode: ServiceSelectionMode,
    onSubmit: () -> Unit,
) {
    HsPrimaryButton(
        text =
            if (uiState.isSaving) {
                "Saving services"
            } else if (mode == ServiceSelectionMode.Onboarding) {
                "Save and continue"
            } else {
                "Save services"
            },
        onClick = onSubmit,
        enabled = !uiState.isSaving && !uiState.isLoading && !uiState.isLocating,
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun ServiceListCard(
    services: List<ServiceCatalogueItem>,
    selectedSkillIds: Set<String>,
    onSkillToggle: (String) -> Unit,
    enabled: Boolean,
) {
    HsSectionCard(title = "Services you provide") {
        val grouped = services.groupBy { it.group }
        grouped.forEach { (group, groupServices) ->
            Text(
                text = group,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(top = 8.dp, bottom = 4.dp),
            )
            groupServices.forEach { item ->
                ServiceRow(
                    item = item,
                    selected = item.id in selectedSkillIds,
                    enabled = enabled,
                    onClick = { onSkillToggle(item.id) },
                )
            }
        }
    }
}

@Composable
private fun ServiceRow(
    item: ServiceCatalogueItem,
    selected: Boolean,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    Row(
        modifier =
            Modifier
                .fillMaxWidth()
                .clickable(enabled = enabled, onClick = onClick)
                .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Checkbox(
            checked = selected,
            onCheckedChange = { onClick() },
            enabled = enabled,
        )
        Spacer(modifier = Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = item.name,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun LocationCard(
    state: ServiceSelectionUiState,
    onUseCurrentLocation: () -> Unit,
    enabled: Boolean,
) {
    HsSectionCard(title = "Service area") {
        Row(verticalAlignment = Alignment.Top) {
            Icon(
                imageVector = Icons.Default.LocationOn,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(top = 6.dp),
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.weight(1f)) {
                Text(
                    text = "Set where you usually start service calls. We use this only for nearby job matching.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                ServiceAreaPreview(state)
                HsSecondaryButton(
                    text = if (state.isLocating) "Finding your location" else "Use current location",
                    onClick = onUseCurrentLocation,
                    enabled = enabled && !state.isLocating,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun ServiceAreaPreview(state: ServiceSelectionUiState) {
    val lat = state.serviceLat
    val lng = state.serviceLng
    if (lat == null || lng == null) {
        EmptyLocationPreview(state)
        return
    }

    if (BuildConfig.MAPS_API_KEY.isBlank()) {
        CapturedLocationPreview(state.serviceAreaLabel)
        return
    }

    val point = LatLng(lat, lng)
    val cameraPositionState =
        rememberCameraPositionState {
            position = CameraPosition.fromLatLngZoom(point, 14f)
        }
    GoogleMap(
        modifier = Modifier.fillMaxWidth().height(180.dp),
        cameraPositionState = cameraPositionState,
    ) {
        Marker(
            state = MarkerState(position = point),
            title = "Service area",
        )
    }
}

@Composable
private fun EmptyLocationPreview(state: ServiceSelectionUiState) {
    Surface(
        modifier = Modifier.fillMaxWidth().height(132.dp),
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize().padding(16.dp)) {
            if (state.isLocating) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CircularProgressIndicator()
                    Spacer(Modifier.width(12.dp))
                    Text("Finding your current area")
                }
            } else {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.MyLocation, contentDescription = null)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = "Tap Use current location",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.Center,
                    )
                    Text(
                        text = "No latitude or longitude entry needed.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )
                }
            }
        }
    }
}

@Composable
private fun CapturedLocationPreview(label: String) {
    Surface(
        modifier = Modifier.fillMaxWidth().height(132.dp),
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.primaryContainer,
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(Icons.Default.MyLocation, contentDescription = null, tint = MaterialTheme.colorScheme.onPrimaryContainer)
            Spacer(Modifier.height(8.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
            Text(
                text = "Map preview appears when a Maps API key is configured.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun LoadingCard() {
    HsSectionCard {
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CircularProgressIndicator()
            Spacer(modifier = Modifier.width(16.dp))
            Text(
                text = "Loading saved service profile",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun ErrorCard(
    message: String,
    onRetry: () -> Unit,
    showRetry: Boolean,
) {
    HsSectionCard {
        Row(verticalAlignment = Alignment.Top) {
            Icon(
                imageVector = Icons.Default.Work,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error,
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (showRetry) {
                    Spacer(modifier = Modifier.height(12.dp))
                    HsSecondaryButton(
                        text = "Retry profile load",
                        onClick = onRetry,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
            if (showRetry) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

private fun Map<String, Boolean>.hasAnyLocationGrant(): Boolean =
    this[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
        this[Manifest.permission.ACCESS_COARSE_LOCATION] == true

private fun hasLocationPermission(context: Context): Boolean =
    ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

@SuppressLint("MissingPermission")
private fun captureCurrentLocation(
    context: Context,
    onLocation: (Double, Double) -> Unit,
    onError: (String) -> Unit,
) {
    val client = LocationServices.getFusedLocationProviderClient(context)
    val currentLocationTask = client.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, null)
    currentLocationTask.addOnSuccessListener { location ->
        if (location != null) {
            onLocation(location.latitude, location.longitude)
        } else {
            val lastLocationTask = client.lastLocation
            lastLocationTask.addOnSuccessListener { lastLocation ->
                if (lastLocation != null) {
                    onLocation(lastLocation.latitude, lastLocation.longitude)
                } else {
                    onError("Could not find your location. Check GPS and try again.")
                }
            }
            lastLocationTask.addOnFailureListener {
                onError("Could not find your location. Check GPS and try again.")
            }
        }
    }
    currentLocationTask.addOnFailureListener {
        onError("Could not find your location. Check GPS and try again.")
    }
}
