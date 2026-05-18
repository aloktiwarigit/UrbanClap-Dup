package com.homeservices.customer.ui.booking

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import com.homeservices.customer.R
import com.homeservices.customer.domain.places.PlacePrediction
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton

private val AYODHYA_CENTER = LatLng(26.7958, 82.1947)
private const val DEFAULT_ZOOM = 13f
private val PREDICTIONS_MAX_HEIGHT = 240.dp

/**
 * Stateless content composable for the address-picker flow.
 *
 * Extracted from [AddressPickerScreen] so Paparazzi tests can snapshot each
 * state without a ViewModel or Hilt graph.
 */
@Composable
internal fun AddressPickerScreenContent(
    uiState: AddressPickerUiState,
    query: String,
    onQueryChange: (String) -> Unit,
    onClearQuery: () -> Unit,
    onPredictionClick: (PlacePrediction) -> Unit,
    onMarkerDragEnd: (Double, Double) -> Unit,
    onConfirm: () -> Unit,
    onNotifyMe: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val selectedLat = (uiState as? AddressPickerUiState.Selected)?.lat
        ?: (uiState as? AddressPickerUiState.RefusedOutOfArea)?.lat
    val selectedLng = (uiState as? AddressPickerUiState.Selected)?.lng
        ?: (uiState as? AddressPickerUiState.RefusedOutOfArea)?.lng

    val mapCenter = if (selectedLat != null && selectedLng != null) {
        LatLng(selectedLat, selectedLng)
    } else {
        AYODHYA_CENTER
    }

    Box(modifier = modifier) {
        // ── Full-bleed map ─────────────────────────────────────────────────────
        AddressMap(
            center = mapCenter,
            markerLat = selectedLat,
            markerLng = selectedLng,
            onMarkerDragEnd = onMarkerDragEnd,
            modifier = Modifier.fillMaxSize(),
        )

        // ── Top panel: search + predictions overlay ────────────────────────────
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.TopCenter),
        ) {
            SearchPanel(
                query = query,
                isSearching = uiState is AddressPickerUiState.Searching,
                onQueryChange = onQueryChange,
                onClearQuery = onClearQuery,
            )

            // Predictions overlay (max 240dp, sits above the map)
            val predictions = when (uiState) {
                is AddressPickerUiState.PredictionsAvailable -> uiState.predictions
                else -> null
            }
            AnimatedVisibility(
                visible = predictions != null,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut(),
            ) {
                if (predictions != null) {
                    PredictionsPanel(predictions = predictions, onPredictionClick = onPredictionClick)
                }
            }
        }

        // ── Bottom CTA bar ─────────────────────────────────────────────────────
        BottomCtaBar(
            uiState = uiState,
            onConfirm = onConfirm,
            onNotifyMe = onNotifyMe,
            modifier = Modifier.align(Alignment.BottomCenter),
        )
    }
}

@Composable
private fun SearchPanel(
    query: String,
    isSearching: Boolean,
    onQueryChange: (String) -> Unit,
    onClearQuery: () -> Unit,
) {
    Surface(
        shadowElevation = 4.dp,
        color = MaterialTheme.colorScheme.surface,
    ) {
        Column {
            OutlinedTextField(
                value = query,
                onValueChange = onQueryChange,
                placeholder = { Text(stringResource(R.string.address_picker_search_hint)) },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                },
                trailingIcon = {
                    if (query.isNotEmpty()) {
                        IconButton(onClick = onClearQuery) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
            )
            if (isSearching) {
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth(),
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}

@Composable
private fun PredictionsPanel(
    predictions: List<PlacePrediction>,
    onPredictionClick: (PlacePrediction) -> Unit,
) {
    Surface(
        shadowElevation = 8.dp,
        color = MaterialTheme.colorScheme.surface,
    ) {
        if (predictions.isEmpty()) {
            Text(
                text = stringResource(R.string.address_picker_search_unavailable_drop_pin),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            )
        } else {
            LazyColumn(modifier = Modifier.heightIn(max = PREDICTIONS_MAX_HEIGHT)) {
                items(predictions, key = { it.placeId }) { prediction ->
                    PredictionRow(prediction = prediction, onClick = { onPredictionClick(prediction) })
                    HorizontalDivider(modifier = Modifier.padding(start = 48.dp))
                }
            }
        }
    }
}

@Composable
private fun PredictionRow(prediction: PlacePrediction, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = Icons.Default.LocationOn,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(20.dp),
        )
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = prediction.primaryText,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface,
            )
            if (prediction.secondaryText.isNotBlank()) {
                Text(
                    text = prediction.secondaryText,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(16.dp),
        )
    }
}

@Composable
private fun AddressMap(
    center: LatLng,
    markerLat: Double?,
    markerLng: Double?,
    onMarkerDragEnd: (Double, Double) -> Unit,
    modifier: Modifier = Modifier,
) {
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(center, DEFAULT_ZOOM)
    }

    GoogleMap(
        modifier = modifier,
        cameraPositionState = cameraPositionState,
    ) {
        if (markerLat != null && markerLng != null) {
            val markerState = MarkerState(position = LatLng(markerLat, markerLng))
            Marker(
                state = markerState,
                draggable = true,
                onInfoWindowClick = {},
                onClick = { false },
                onMarkerDragEnd = {
                    onMarkerDragEnd(markerState.position.latitude, markerState.position.longitude)
                },
            )
        }
    }
}

@Composable
private fun BottomCtaBar(
    uiState: AddressPickerUiState,
    onConfirm: () -> Unit,
    onNotifyMe: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        shadowElevation = 8.dp,
        color = MaterialTheme.colorScheme.surface,
        modifier = modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.navigationBarsPadding()) {
            when (uiState) {
                is AddressPickerUiState.RefusedOutOfArea -> {
                    RefusalBanner(onNotifyMe = onNotifyMe)
                }
                is AddressPickerUiState.Selected -> {
                    if (!uiState.isInService) {
                        RefusalBanner(onNotifyMe = onNotifyMe)
                    } else {
                        InServiceCtaBar(
                            formattedAddress = uiState.formattedAddress,
                            onConfirm = onConfirm,
                        )
                    }
                }
                is AddressPickerUiState.Searching -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(72.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp))
                    }
                }
                else -> {
                    // Idle / PredictionsAvailable / Error — CTA disabled
                    InServiceCtaBar(formattedAddress = null, onConfirm = onConfirm)
                }
            }
        }
    }
}

@Composable
private fun InServiceCtaBar(
    formattedAddress: String?,
    onConfirm: () -> Unit,
) {
    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
        if (!formattedAddress.isNullOrBlank()) {
            Text(
                text = formattedAddress,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                modifier = Modifier.padding(bottom = 8.dp),
            )
        }
        HsPrimaryButton(
            text = stringResource(R.string.address_picker_confirm),
            onClick = onConfirm,
            enabled = formattedAddress != null,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
        )
    }
}

@Composable
private fun RefusalBanner(onNotifyMe: () -> Unit) {
    Surface(
        color = MaterialTheme.colorScheme.errorContainer,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp)) {
            Text(
                text = stringResource(R.string.address_picker_refused_title),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onErrorContainer,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = stringResource(R.string.address_picker_refused_subtitle),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onErrorContainer,
            )
            Spacer(Modifier.height(12.dp))
            HsSecondaryButton(
                text = stringResource(R.string.address_picker_notify_me),
                onClick = onNotifyMe,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
