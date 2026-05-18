package com.homeservices.customer.data.places

import com.google.android.gms.maps.model.LatLng
import com.google.android.libraries.places.api.model.AutocompleteSessionToken
import com.google.android.libraries.places.api.model.Place
import com.google.android.libraries.places.api.model.RectangularBounds
import com.google.android.libraries.places.api.net.FetchPlaceRequest
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest
import com.google.android.libraries.places.api.net.PlacesClient
import com.homeservices.customer.domain.places.PlacesClientGateway
import com.homeservices.customer.domain.places.RawPlace
import com.homeservices.customer.domain.places.RawPrediction
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

private val AYODHYA_BOUNDS: RectangularBounds = RectangularBounds.newInstance(
    LatLng(26.5708, 81.9697),
    LatLng(27.0208, 82.4197),
)
private val AYODHYA_ORIGIN: LatLng = LatLng(26.7958, 82.1947)
private const val COUNTRY_IN = "IN"

/**
 * Production [PlacesClientGateway] backed by the Google Places SDK.
 *
 * - Applies Ayodhya bounding-box and origin biasing on every request.
 * - Uses `.await()` from `kotlinx-coroutines-play-services` — no ad-hoc
 *   `suspendCancellableCoroutine` wrappers.
 * - Timeout is enforced at the use-case layer ([PlacesAutocompleteUseCase]).
 */
public class DefaultPlacesClientGateway @Inject constructor(
    private val client: PlacesClient,
) : PlacesClientGateway {

    override suspend fun findAutocompletePredictions(
        query: String,
        sessionToken: AutocompleteSessionToken,
    ): List<RawPrediction> {
        val request = FindAutocompletePredictionsRequest.builder()
            .setQuery(query)
            .setLocationBias(AYODHYA_BOUNDS)
            .setOrigin(AYODHYA_ORIGIN)
            .setCountries(COUNTRY_IN)
            .setSessionToken(sessionToken)
            .build()

        val response = client.findAutocompletePredictions(request).await()
        return response.autocompletePredictions.map { prediction ->
            RawPrediction(
                placeId = prediction.placeId,
                primaryText = prediction.getPrimaryText(null).toString(),
                secondaryText = prediction.getSecondaryText(null)?.toString() ?: "",
            )
        }
    }

    override suspend fun fetchPlace(
        placeId: String,
        sessionToken: AutocompleteSessionToken,
    ): RawPlace {
        val fields = listOf(
            Place.Field.ID,
            Place.Field.DISPLAY_NAME,
            Place.Field.ADDRESS,
            Place.Field.LOCATION,
        )
        val request = FetchPlaceRequest.newInstance(placeId, fields)
        val response = client.fetchPlace(request).await()
        val place = response.place
        val latLng = place.location ?: error("Place $placeId has no location")
        return RawPlace(
            placeId = place.id ?: placeId,
            name = place.displayName,
            address = place.address,
            lat = latLng.latitude,
            lng = latLng.longitude,
        )
    }
}
