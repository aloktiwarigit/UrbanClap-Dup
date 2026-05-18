package com.homeservices.customer.ui.booking

import com.homeservices.customer.domain.places.PlacePrediction

public sealed class AddressPickerUiState {
    public data object Idle : AddressPickerUiState()

    public data class Searching(
        val query: String,
    ) : AddressPickerUiState()

    public data class PredictionsAvailable(
        val query: String,
        val predictions: List<PlacePrediction>,
    ) : AddressPickerUiState()

    public data class Selected(
        val formattedAddress: String,
        val lat: Double,
        val lng: Double,
        val isInService: Boolean,
    ) : AddressPickerUiState()

    public data class RefusedOutOfArea(
        val lat: Double,
        val lng: Double,
    ) : AddressPickerUiState()

    public data class Error(
        val reason: String,
    ) : AddressPickerUiState()
}

public sealed class AddressPickerNavEvent {
    public data class NavigateToWaitlist(
        val lat: Double,
        val lng: Double,
        val serviceId: String,
    ) : AddressPickerNavEvent()

    public data class NavigateToBookingSummary(
        val formattedAddress: String,
        val lat: Double,
        val lng: Double,
    ) : AddressPickerNavEvent()
}
