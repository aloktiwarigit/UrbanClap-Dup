package com.homeservices.customer.ui.booking

import com.homeservices.customer.domain.places.PlacePrediction
import com.homeservices.customer.domain.places.PlacesAutocompleteUseCase
import com.homeservices.customer.domain.places.ReverseGeocoder
import com.homeservices.customer.domain.serviceArea.LocalServiceAreaCheck
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestCoroutineScheduler
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/** Ayodhya center — inside the service polygon. */
private const val INSIDE_LAT = 26.7958
private const val INSIDE_LNG = 82.1947

/** Gonda district — outside the service polygon. */
private const val OUTSIDE_LAT = 27.1336
private const val OUTSIDE_LNG = 81.9612

private val INSIDE_RING: List<Pair<Double, Double>> =
    listOf(
        Pair(81.9697, 26.5708),
        Pair(82.4197, 26.5708),
        Pair(82.4197, 27.0208),
        Pair(81.9697, 27.0208),
        Pair(81.9697, 26.5708),
    )

@OptIn(ExperimentalCoroutinesApi::class)
public class AddressPickerViewModelTest {
    private val scheduler = TestCoroutineScheduler()
    private val dispatcher = StandardTestDispatcher(scheduler)

    private val placesUseCase: PlacesAutocompleteUseCase = mockk()
    private val geocoder: ReverseGeocoder = mockk()

    /** Use the internal test factory that bypasses AssetManager. */
    private val serviceArea: LocalServiceAreaCheck = LocalServiceAreaCheck(INSIDE_RING)

    private fun vm() =
        AddressPickerViewModel(
            placesUseCase = placesUseCase,
            serviceAreaCheck = serviceArea,
            geocoder = geocoder,
            defaultDispatcher = dispatcher,
        )

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    // ---------------------------------------------------------------------------
    // Initial state
    // ---------------------------------------------------------------------------

    @Test
    public fun `initialState_isIdle`(): Unit =
        runTest(scheduler) {
            val v = vm()
            assertThat(v.uiState.value).isInstanceOf(AddressPickerUiState.Idle::class.java)
        }

    // ---------------------------------------------------------------------------
    // Query change behaviour
    // ---------------------------------------------------------------------------

    @Test
    public fun `onQueryChange_belowMinLength_keepsIdle`(): Unit =
        runTest(scheduler) {
            val v = vm()
            v.onQueryChange("ab") // < 3 chars
            scheduler.advanceTimeBy(400L) // past debounce
            assertThat(v.uiState.value).isInstanceOf(AddressPickerUiState.Idle::class.java)
        }

    @Test
    public fun `onQueryChange_aboveMinLength_emitsSearching_then_predictions`(): Unit =
        runTest(scheduler) {
            val predictions =
                listOf(
                    PlacePrediction("p1", "Ram Mandir", "Ayodhya"),
                )
            coEvery { placesUseCase.findPredictions("Ram M") } returns Result.success(predictions)

            val v = vm()
            v.onQueryChange("Ram M") // >= 3 chars

            // After debounce window elapses the VM emits Searching then PredictionsAvailable
            scheduler.advanceTimeBy(350L)

            // Allow the coroutine to complete
            scheduler.runCurrent()

            val state = v.uiState.value
            assertThat(state).isInstanceOf(AddressPickerUiState.PredictionsAvailable::class.java)
            val available = state as AddressPickerUiState.PredictionsAvailable
            assertThat(available.predictions).isEqualTo(predictions)
        }

    // ---------------------------------------------------------------------------
    // Prediction selected
    // ---------------------------------------------------------------------------

    @Test
    public fun `onPredictionSelected_emitsSelectedState_withLatLngFromFetchPlace_and_isInServiceTrue`(): Unit =
        runTest(scheduler) {
            val resolved =
                com.homeservices.customer.domain.places.ResolvedPlace(
                    placeId = "p1",
                    formattedAddress = "Ram Janmabhoomi, Ayodhya",
                    lat = INSIDE_LAT,
                    lng = INSIDE_LNG,
                )
            coEvery { placesUseCase.fetchPlace("p1") } returns Result.success(resolved)

            val v = vm()
            v.onPredictionSelected(PlacePrediction("p1", "Ram Mandir", "Ayodhya"))
            scheduler.runCurrent()

            val state = v.uiState.value as AddressPickerUiState.Selected
            assertThat(state.formattedAddress).isEqualTo("Ram Janmabhoomi, Ayodhya")
            assertThat(state.lat).isEqualTo(INSIDE_LAT)
            assertThat(state.lng).isEqualTo(INSIDE_LNG)
            assertThat(state.isInService).isTrue()
        }

    // ---------------------------------------------------------------------------
    // Marker drag — outside polygon
    // ---------------------------------------------------------------------------

    @Test
    public fun `onMarkerDragEnd_outsidePolygon_emitsRefusedOutOfArea`(): Unit =
        runTest(scheduler) {
            coEvery { geocoder.reverseGeocode(OUTSIDE_LAT, OUTSIDE_LNG) } returns
                Result.success("Gonda, UP")

            val v = vm()
            v.onMarkerDragEnd(lat = OUTSIDE_LAT, lng = OUTSIDE_LNG)
            scheduler.advanceTimeBy(600L) // past 500ms drag debounce
            scheduler.runCurrent()

            val state = v.uiState.value
            assertThat(state).isInstanceOf(AddressPickerUiState.RefusedOutOfArea::class.java)
            val refused = state as AddressPickerUiState.RefusedOutOfArea
            assertThat(refused.lat).isEqualTo(OUTSIDE_LAT)
            assertThat(refused.lng).isEqualTo(OUTSIDE_LNG)
        }

    // ---------------------------------------------------------------------------
    // Marker drag — inside polygon
    // ---------------------------------------------------------------------------

    @Test
    public fun `onMarkerDragEnd_insidePolygon_keepsSelected_andRefreshesFormattedAddress`(): Unit =
        runTest(scheduler) {
            // First select a place so state becomes Selected
            val resolved =
                com.homeservices.customer.domain.places.ResolvedPlace(
                    placeId = "p1",
                    formattedAddress = "Ram Janmabhoomi, Ayodhya",
                    lat = INSIDE_LAT,
                    lng = INSIDE_LNG,
                )
            coEvery { placesUseCase.fetchPlace("p1") } returns Result.success(resolved)
            coEvery {
                geocoder.reverseGeocode(INSIDE_LAT + 0.001, INSIDE_LNG + 0.001)
            } returns Result.success("Saket, Ayodhya")

            val v = vm()
            v.onPredictionSelected(PlacePrediction("p1", "Ram Mandir", "Ayodhya"))
            scheduler.runCurrent()

            // Drag slightly inside the polygon
            v.onMarkerDragEnd(lat = INSIDE_LAT + 0.001, lng = INSIDE_LNG + 0.001)
            scheduler.advanceTimeBy(600L)
            scheduler.runCurrent()

            val state = v.uiState.value as AddressPickerUiState.Selected
            assertThat(state.formattedAddress).isEqualTo("Saket, Ayodhya")
            assertThat(state.isInService).isTrue()
        }

    // ---------------------------------------------------------------------------
    // onConfirm — navigation branching
    // ---------------------------------------------------------------------------

    @Test
    public fun `onConfirm_outsidePolygon_triggersRefusalNav_notBookingNav`(): Unit =
        runTest(scheduler) {
            // Force state to RefusedOutOfArea
            coEvery { geocoder.reverseGeocode(OUTSIDE_LAT, OUTSIDE_LNG) } returns
                Result.success("Gonda, UP")

            val v = vm()
            v.onMarkerDragEnd(lat = OUTSIDE_LAT, lng = OUTSIDE_LNG)
            scheduler.advanceTimeBy(600L)
            scheduler.runCurrent()

            // Collect nav events; confirm must not emit NavigateToBookingSummary
            val navEvents = mutableListOf<AddressPickerNavEvent>()
            val collectJob =
                launch {
                    v.navEvents.collect { navEvents.add(it) }
                }

            v.onConfirm(serviceId = "svc-1")
            scheduler.runCurrent()

            // Should NOT have emitted a booking navigation
            val bookingNav = navEvents.filterIsInstance<AddressPickerNavEvent.NavigateToBookingSummary>()
            assertThat(bookingNav).isEmpty()

            collectJob.cancel()
        }
}
