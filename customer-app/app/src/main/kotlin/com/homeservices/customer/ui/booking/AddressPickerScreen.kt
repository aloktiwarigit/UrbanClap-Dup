package com.homeservices.customer.ui.booking

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.designsystem.components.HsScreenTitle

/**
 * Entry-point composable for the address-picker flow.
 *
 * Wires [AddressPickerViewModel] to [AddressPickerScreenContent] and consumes
 * one-shot [AddressPickerNavEvent]s to trigger upstream navigation callbacks.
 *
 * Both [onConfirmed] and [onRefused] are called exactly once per user action.
 * The Scaffold TopAppBar is owned here so Paparazzi tests can snapshot the
 * stateless [AddressPickerScreenContent] without a Scaffold.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun AddressPickerScreen(
    serviceId: String,
    onConfirmed: (addressText: String, lat: Double, lng: Double) -> Unit,
    onRefused: (lat: Double, lng: Double, serviceId: String) -> Unit,
    onBack: () -> Unit,
    viewModel: AddressPickerViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var query by rememberSaveable { mutableStateOf("") }

    // Consume one-shot nav events emitted by the ViewModel
    LaunchedEffect(Unit) {
        viewModel.navEvents.collect { event ->
            when (event) {
                is AddressPickerNavEvent.NavigateToBookingSummary ->
                    onConfirmed(event.formattedAddress, event.lat, event.lng)
                is AddressPickerNavEvent.NavigateToWaitlist ->
                    onRefused(event.lat, event.lng, event.serviceId)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { HsScreenTitle(text = stringResource(R.string.address_picker_title)) },
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
    ) { paddingValues ->
        AddressPickerScreenContent(
            uiState = uiState,
            query = query,
            onQueryChange = { q ->
                query = q
                viewModel.onQueryChange(q)
            },
            onClearQuery = {
                query = ""
                viewModel.onQueryChange("")
            },
            onPredictionClick = { prediction ->
                query = prediction.primaryText
                viewModel.onPredictionSelected(prediction)
            },
            onMarkerDragEnd = { lat, lng ->
                viewModel.onMarkerDragEnd(lat, lng)
            },
            onConfirm = { viewModel.onConfirm(serviceId) },
            onNotifyMe = { viewModel.onConfirm(serviceId) }, // triggers NavigateToWaitlist when out-of-service
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
        )
    }
}
