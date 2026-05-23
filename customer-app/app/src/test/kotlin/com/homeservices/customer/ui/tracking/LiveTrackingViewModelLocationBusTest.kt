package com.homeservices.customer.ui.tracking

import androidx.lifecycle.SavedStateHandle
import com.homeservices.customer.data.tracking.LocationUpdateEvent
import com.homeservices.customer.data.tracking.LocationUpdateEventBus
import com.homeservices.customer.domain.tracking.GetLiveLocationUseCase
import com.homeservices.customer.domain.tracking.TrackBookingStatusUseCase
import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.customer.domain.tracking.model.LiveLocation
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.take
import kotlinx.coroutines.flow.toList
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class LiveTrackingViewModelLocationBusTest {
    private val testDispatcher = StandardTestDispatcher()
    private val getLiveLocation: GetLiveLocationUseCase = mockk()
    private val trackStatus: TrackBookingStatusUseCase = mockk()
    private val locationBus = LocationUpdateEventBus()

    @Before
    public fun setUp() {
        Dispatchers.setMain(testDispatcher)
    }

    @After
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun viewModel(bookingId: String = "b1"): LiveTrackingViewModel {
        val handle = SavedStateHandle(mapOf("bookingId" to bookingId))
        return LiveTrackingViewModel(handle, getLiveLocation, trackStatus, locationBus)
    }

    // ── 1. Bus event matching bookingId → liveLat/liveLng override in uiState ──────

    @Test
    public fun `bus event matching bookingId sets liveLat and liveLng in uiState`(): Unit =
        runTest {
            val loc = LiveLocation(lat = 12.97, lng = 77.59, etaMinutes = 8, techName = "Suresh", techPhotoUrl = "url")
            every { getLiveLocation.execute("b1") } returns flowOf(loc)
            every { trackStatus.execute("b1") } returns flowOf(BookingStatus.EnRoute)

            val vm = viewModel("b1")
            // With WhileSubscribed, upstream starts on first subscription
            val job = vm.uiState.launchIn(this)
            advanceUntilIdle()

            val busEvent = LocationUpdateEvent(bookingId = "b1", lat = 13.00, lng = 78.00, capturedAt = 999L)
            locationBus.post(busEvent)
            advanceUntilIdle()

            val state = vm.uiState.value as LiveTrackingUiState.Tracking
            assertThat(state.liveLat).isEqualTo(13.00)
            assertThat(state.liveLng).isEqualTo(78.00)
            assertThat(state.liveCapturedAt).isEqualTo(999L)
            job.cancel()
        }

    // ── 2. No bus event → liveLat/liveLng fall back to legacy location ────────────

    @Test
    public fun `when no bus event liveLat and liveLng fall back to legacy location`(): Unit =
        runTest {
            val loc = LiveLocation(lat = 12.97, lng = 77.59, etaMinutes = 8, techName = "Suresh", techPhotoUrl = "url")
            every { getLiveLocation.execute("b1") } returns flowOf(loc)
            every { trackStatus.execute("b1") } returns flowOf(BookingStatus.EnRoute)

            val vm = viewModel("b1")
            // With WhileSubscribed, upstream starts on first subscription
            val job = vm.uiState.launchIn(this)
            advanceUntilIdle()

            val state = vm.uiState.value as LiveTrackingUiState.Tracking
            // No bus event posted — liveLat/liveLng fall back to location.*
            assertThat(state.liveLat).isEqualTo(12.97)
            assertThat(state.liveLng).isEqualTo(77.59)
            assertThat(state.liveCapturedAt).isNull()
            job.cancel()
        }

    // ── 3. Bus event for a different bookingId is filtered out ────────────────────

    @Test
    public fun `bus event for different bookingId is ignored`(): Unit =
        runTest {
            val loc = LiveLocation(lat = 12.97, lng = 77.59, etaMinutes = 8, techName = "Suresh", techPhotoUrl = "url")
            every { getLiveLocation.execute("b1") } returns flowOf(loc)
            every { trackStatus.execute("b1") } returns flowOf(BookingStatus.EnRoute)

            val vm = viewModel("b1")
            // With WhileSubscribed, upstream starts on first subscription
            val job = vm.uiState.launchIn(this)
            advanceUntilIdle()

            // Post event for a DIFFERENT booking — should not affect vm.
            locationBus.post(LocationUpdateEvent(bookingId = "OTHER", lat = 99.0, lng = 99.0, capturedAt = 1L))
            advanceUntilIdle()

            val state = vm.uiState.value as LiveTrackingUiState.Tracking
            // liveLat still falls back to legacy location, not the filtered-out bus event.
            assertThat(state.liveLat).isEqualTo(12.97)
            assertThat(state.liveLng).isEqualTo(77.59)
            job.cancel()
        }

    // ── 4. No legacy location, no bus event → liveLat/liveLng both null ──────────

    @Test
    public fun `with no location and no bus event liveLat and liveLng are null`(): Unit =
        runTest {
            every { getLiveLocation.execute("b2") } returns flowOf(null)
            every { trackStatus.execute("b2") } returns flowOf(BookingStatus.InProgress)

            val vm = viewModel("b2")
            // With WhileSubscribed, upstream starts on first subscription
            val job = vm.uiState.launchIn(this)
            advanceUntilIdle()

            val state = vm.uiState.value as LiveTrackingUiState.Tracking
            assertThat(state.liveLat).isNull()
            assertThat(state.liveLng).isNull()
            assertThat(state.liveCapturedAt).isNull()
            job.cancel()
        }
}
