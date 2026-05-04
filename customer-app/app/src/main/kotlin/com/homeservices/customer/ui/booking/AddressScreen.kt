package com.homeservices.customer.ui.booking

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import com.homeservices.customer.BuildConfig
import com.homeservices.customer.R
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsSectionCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun AddressScreen(
    onAddressConfirmed: (addressText: String, lat: Double, lng: Double) -> Unit,
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    var addressText by rememberSaveable { mutableStateOf("") }
    var selectedLat by rememberSaveable { mutableStateOf<Double?>(null) }
    var selectedLng by rememberSaveable { mutableStateOf<Double?>(null) }
    var locationMessage by rememberSaveable { mutableStateOf("Location not set") }
    var isLocating by rememberSaveable { mutableStateOf(false) }
    val locationLauncher =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
            if (permissions.hasAnyLocationGrant()) {
                isLocating = true
                captureCurrentLocation(
                    context = context,
                    onLocation = { lat, lng ->
                        selectedLat = lat
                        selectedLng = lng
                        isLocating = false
                        locationMessage = "Current location captured"
                    },
                    onError = {
                        isLocating = false
                        locationMessage = it
                    },
                )
            } else {
                locationMessage = "Allow location access to find nearby technicians."
            }
        }
    val requestLocation = {
        if (hasLocationPermission(context)) {
            isLocating = true
            captureCurrentLocation(
                context = context,
                onLocation = { lat, lng ->
                    selectedLat = lat
                    selectedLng = lng
                    isLocating = false
                    locationMessage = "Current location captured"
                },
                onError = {
                    isLocating = false
                    locationMessage = it
                },
            )
        } else {
            locationLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                ),
            )
        }
    }

    AddressScreenContent(
        addressText = addressText,
        selectedLat = selectedLat,
        selectedLng = selectedLng,
        locationMessage = locationMessage,
        isLocating = isLocating,
        onAddressTextChanged = { addressText = it },
        onUseCurrentLocation = requestLocation,
        onAddressConfirmed = onAddressConfirmed,
        onBack = onBack,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun AddressScreenContent(
    addressText: String,
    selectedLat: Double?,
    selectedLng: Double?,
    locationMessage: String,
    isLocating: Boolean,
    onAddressTextChanged: (String) -> Unit,
    onUseCurrentLocation: () -> Unit,
    onAddressConfirmed: (addressText: String, lat: Double, lng: Double) -> Unit,
    onBack: () -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.address_screen_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.service_detail_back_desc),
                        )
                    }
                },
            )
        },
    ) { innerPadding ->
        Column(
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(16.dp),
        ) {
            Text(
                text = stringResource(R.string.address_heading),
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = stringResource(R.string.address_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(18.dp))
            HsSectionCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = MaterialTheme.shapes.small,
                        color = MaterialTheme.colorScheme.primaryContainer,
                    ) {
                        Icon(
                            imageVector = Icons.Filled.LocationOn,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(8.dp),
                        )
                    }
                    Column(modifier = Modifier.padding(start = 12.dp)) {
                        Text(
                            text = stringResource(R.string.address_service_location),
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = stringResource(R.string.address_location_note),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                Spacer(Modifier.height(16.dp))
                OutlinedTextField(
                    value = addressText,
                    onValueChange = onAddressTextChanged,
                    label = { Text(stringResource(R.string.address_hint)) },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 4,
                )
                Spacer(Modifier.height(14.dp))
                LocationCapturePanel(
                    lat = selectedLat,
                    lng = selectedLng,
                    message = locationMessage,
                    isLocating = isLocating,
                    onUseCurrentLocation = onUseCurrentLocation,
                )
            }
            Spacer(Modifier.weight(1f))
            Text(
                text = stringResource(R.string.address_privacy_note),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(12.dp))
            HsPrimaryButton(
                text = stringResource(R.string.address_next),
                onClick = {
                    val lat = selectedLat
                    val lng = selectedLng
                    if (addressText.isNotBlank() && lat != null && lng != null) {
                        onAddressConfirmed(addressText.trim(), lat, lng)
                    }
                },
                enabled = addressText.isNotBlank() && selectedLat != null && selectedLng != null && !isLocating,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .height(56.dp),
            )
        }
    }
}

@Composable
private fun LocationCapturePanel(
    lat: Double?,
    lng: Double?,
    message: String,
    isLocating: Boolean,
    onUseCurrentLocation: () -> Unit,
) {
    Column {
        LocationPreview(lat, lng, message, isLocating)
        Spacer(Modifier.height(10.dp))
        HsSecondaryButton(
            text = if (isLocating) "Finding your location" else "Use current location",
            onClick = onUseCurrentLocation,
            enabled = !isLocating,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun LocationPreview(
    lat: Double?,
    lng: Double?,
    message: String,
    isLocating: Boolean,
) {
    if (lat != null && lng != null && BuildConfig.MAPS_API_KEY.isNotBlank()) {
        val point = LatLng(lat, lng)
        val cameraPositionState =
            rememberCameraPositionState {
                position = CameraPosition.fromLatLngZoom(point, 15f)
            }
        GoogleMap(
            modifier = Modifier.fillMaxWidth().height(156.dp),
            cameraPositionState = cameraPositionState,
        ) {
            Marker(
                state = MarkerState(position = point),
                title = "Service location",
            )
        }
        return
    }

    Surface(
        modifier = Modifier.fillMaxWidth().height(132.dp),
        shape = MaterialTheme.shapes.medium,
        color =
            if (lat != null && lng != null) {
                MaterialTheme.colorScheme.primaryContainer
            } else {
                MaterialTheme.colorScheme.surfaceVariant
            },
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize().padding(16.dp)) {
            if (isLocating) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CircularProgressIndicator()
                    Spacer(Modifier.width(12.dp))
                    Text("Finding your service location")
                }
            } else {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.MyLocation, contentDescription = null)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = message,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.Center,
                    )
                    Text(
                        text = "This helps assign the nearest available technician.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )
                }
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
