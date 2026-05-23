package com.homeservices.customer.domain.places

/**
 * Thin coroutine-friendly wrapper around [com.google.android.libraries.places.api.net.PlacesClient].
 *
 * Exists solely to make [PlacesAutocompleteUseCase] unit-testable without bridging
 * Task<T> in tests. The production implementation delegates to the real SDK.
 */
public interface PlacesClientGateway {
    public suspend fun findAutocompletePredictions(
        query: String,
        sessionToken: com.google.android.libraries.places.api.model.AutocompleteSessionToken,
    ): List<RawPrediction>

    public suspend fun fetchPlace(
        placeId: String,
        sessionToken: com.google.android.libraries.places.api.model.AutocompleteSessionToken,
    ): RawPlace
}

/** Raw prediction data from the SDK (avoids leaking SDK types into domain). */
public data class RawPrediction(
    val placeId: String,
    val primaryText: String,
    val secondaryText: String,
)

/** Raw place data from the SDK (avoids leaking SDK types into domain). */
public data class RawPlace(
    val placeId: String,
    val name: String?,
    val address: String?,
    val lat: Double,
    val lng: Double,
)
