package com.homeservices.customer.domain.places

import com.google.android.libraries.places.api.model.AutocompleteSessionToken
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.delay
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class PlacesAutocompleteUseCaseTest {

    private val gateway: PlacesClientGateway = mockk()
    private lateinit var useCase: PlacesAutocompleteUseCase

    @BeforeEach
    public fun setUp() {
        useCase = PlacesAutocompleteUseCase(gateway)
    }

    // ---------------------------------------------------------------------------
    // findPredictions
    // ---------------------------------------------------------------------------

    @Test
    public fun `findPredictions_returnsList_whenSdkSuccess`(): Unit = runTest {
        coEvery { gateway.findAutocompletePredictions(any(), any()) } returns listOf(
            RawPrediction(
                placeId = "place-1",
                primaryText = "Ram Mandir",
                secondaryText = "Ayodhya, UP",
            ),
        )

        val result = useCase.findPredictions("Ram")

        assertThat(result.isSuccess).isTrue()
        val list = result.getOrThrow()
        assertThat(list).hasSize(1)
        assertThat(list[0].placeId).isEqualTo("place-1")
        assertThat(list[0].primaryText).isEqualTo("Ram Mandir")
        assertThat(list[0].secondaryText).isEqualTo("Ayodhya, UP")
    }

    @Test
    public fun `findPredictions_emptyOnSdkApiError_doesNotThrow`(): Unit = runTest {
        coEvery { gateway.findAutocompletePredictions(any(), any()) } throws
            RuntimeException("NETWORK_ERROR")

        val result = useCase.findPredictions("anything")

        assertThat(result.isSuccess).isTrue()
        assertThat(result.getOrThrow()).isEmpty()
    }

    @Test
    public fun `findPredictions_propagatesTimeoutAsError`(): Unit = runTest {
        coEvery { gateway.findAutocompletePredictions(any(), any()) } coAnswers {
            delay(3_000L)
            emptyList()
        }

        val result = useCase.findPredictions("slow")

        assertThat(result.isFailure).isTrue()
        assertThat(result.exceptionOrNull()).isInstanceOf(java.util.concurrent.TimeoutException::class.java)
    }

    // ---------------------------------------------------------------------------
    // fetchPlace + session-token rotation
    // ---------------------------------------------------------------------------

    @Test
    public fun `fetchPlace_returnsPlaceWithLatLng_andRotatesSessionToken`(): Unit = runTest {
        val rawPlace = RawPlace(
            placeId = "place-1",
            name = "Ram Mandir",
            address = "Ram Janmabhoomi, Ayodhya 224123",
            lat = 26.7958,
            lng = 82.1947,
        )
        coEvery { gateway.fetchPlace(any(), any()) } returns rawPlace

        // Capture the token before fetchPlace
        val tokenBefore: AutocompleteSessionToken = useCase.currentToken

        val result = useCase.fetchPlace("place-1")

        assertThat(result.isSuccess).isTrue()
        val resolved = result.getOrThrow()
        assertThat(resolved.placeId).isEqualTo("place-1")
        assertThat(resolved.formattedAddress).isEqualTo("Ram Janmabhoomi, Ayodhya 224123")
        assertThat(resolved.lat).isEqualTo(26.7958)
        assertThat(resolved.lng).isEqualTo(82.1947)

        // Token must have rotated after successful fetchPlace
        assertThat(useCase.currentToken).isNotSameInstanceAs(tokenBefore)
    }

    @Test
    public fun `sessionToken_isStableAcrossPredictionsCalls_untilFetchPlaceSucceeds`(): Unit = runTest {
        coEvery { gateway.findAutocompletePredictions(any(), any()) } returns emptyList()
        coEvery { gateway.fetchPlace(any(), any()) } returns RawPlace(
            placeId = "p",
            name = "Place",
            address = "Addr",
            lat = 26.79,
            lng = 82.19,
        )

        val tokenAfterInit: AutocompleteSessionToken = useCase.currentToken

        useCase.findPredictions("query1")
        val tokenAfterFirst: AutocompleteSessionToken = useCase.currentToken
        assertThat(tokenAfterFirst).isSameInstanceAs(tokenAfterInit)

        useCase.findPredictions("query2")
        val tokenAfterSecond: AutocompleteSessionToken = useCase.currentToken
        assertThat(tokenAfterSecond).isSameInstanceAs(tokenAfterInit)

        // fetchPlace must rotate
        useCase.fetchPlace("p")
        val tokenAfterFetch: AutocompleteSessionToken = useCase.currentToken
        assertThat(tokenAfterFetch).isNotSameInstanceAs(tokenAfterInit)
    }
}
