package com.homeservices.customer.domain.places

import com.google.android.libraries.places.api.model.AutocompleteSessionToken
import kotlinx.coroutines.withTimeoutOrNull
import java.util.concurrent.TimeoutException
import javax.inject.Inject

private const val TIMEOUT_MS = 2_000L

/**
 * Orchestrates Google Places Autocomplete + Fetch-Place flows with correct session-token lifecycle.
 *
 * Session-token discipline:
 * - One [AutocompleteSessionToken] is created on construction.
 * - The same token is re-used across all [findPredictions] calls in the same trip.
 * - After a successful [fetchPlace] the token is rotated so the next trip starts fresh.
 *
 * Bounding-box / origin / country biasing is applied inside [PlacesClientGateway]
 * (the production implementation, [DefaultPlacesClientGateway], owns the SDK coupling).
 */
public class PlacesAutocompleteUseCase @Inject constructor(
    private val gateway: PlacesClientGateway,
) {
    /** Exposed as `internal` so tests can assert token rotation without reflection. */
    @Suppress("MemberVisibilityCanBePrivate")
    public var currentToken: AutocompleteSessionToken = AutocompleteSessionToken.newInstance()
        private set

    /**
     * Returns a list of [PlacePrediction]s for [query], or an empty list on SDK errors.
     * Returns [Result.failure] with [TimeoutException] if the call exceeds [TIMEOUT_MS].
     */
    public suspend fun findPredictions(query: String): Result<List<PlacePrediction>> {
        val response = withTimeoutOrNull(TIMEOUT_MS) {
            runCatching {
                gateway.findAutocompletePredictions(query, currentToken)
            }
        } ?: return Result.failure(TimeoutException("Places autocomplete timed out"))

        return response.fold(
            onSuccess = { rawList ->
                Result.success(
                    rawList.map { raw ->
                        PlacePrediction(
                            placeId = raw.placeId,
                            primaryText = raw.primaryText,
                            secondaryText = raw.secondaryText,
                        )
                    },
                )
            },
            onFailure = {
                // API errors (network, quota, INVALID_REQUEST) → degrade gracefully to empty list
                Result.success(emptyList())
            },
        )
    }

    /**
     * Resolves a [placeId] into a [ResolvedPlace] with coordinates.
     * Rotates the session token on success so the next autocomplete trip is billed separately.
     */
    public suspend fun fetchPlace(placeId: String): Result<ResolvedPlace> {
        val response = withTimeoutOrNull(TIMEOUT_MS) {
            runCatching {
                gateway.fetchPlace(placeId, currentToken)
            }
        } ?: return Result.failure(TimeoutException("Places fetchPlace timed out"))

        return response.fold(
            onSuccess = { raw ->
                rotateToken()
                Result.success(
                    ResolvedPlace(
                        placeId = raw.placeId,
                        formattedAddress = raw.address ?: raw.name ?: raw.placeId,
                        lat = raw.lat,
                        lng = raw.lng,
                    ),
                )
            },
            onFailure = { ex ->
                Result.failure(ex)
            },
        )
    }

    private fun rotateToken() {
        currentToken = AutocompleteSessionToken.newInstance()
    }
}
