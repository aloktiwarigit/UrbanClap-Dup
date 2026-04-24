package com.homeservices.customer.ui.tracking

import androidx.lifecycle.SavedStateHandle
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
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class LiveTrackingViewModelTest {
    private val testDispatcher = StandardTestDispatcher()
    private val getLiveLocation: GetLiveLocationUseCase = mockk()
    private val trackStatus: TrackBookingStatusUseCase = mockk()

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
        return LiveTrackingViewModel(handle, getLiveLocation, trackStatus)
    }

    @Test
    public fun `initial state is Loading`(): Unit =
        runTest {
            every { getLiveLocation.execute(any()) } returns flowOf(null)
            every { trackStatus.execute(any()) } returns flowOf(BookingStatus.EnRoute)
            val vm = viewModel()
            assertThat(vm.uiState.value).isEqualTo(LiveTrackingUiState.Loading)
        }

    @Test
    public fun `emits Tracking state when location arrives`(): Unit =
        runTest {
            val loc = LiveLocation(12.97, 77.59, 8, "Suresh", "url")
            every { getLiveLocation.execute("b1") } returns flowOf(loc)
            every { trackStatus.execute("b1") } returns flowOf(BookingStatus.EnRoute)
            val vm = viewModel("b1")
            advanceUntilIdle()
            val state = vm.uiState.value
            assertThat(state).isInstanceOf(LiveTrackingUiState.Tracking::class.java)
            val tracking = state as LiveTrackingUiState.Tracking
            assertThat(tracking.location).isEqualTo(loc)
            assertThat(tracking.status).isEqualTo(BookingStatus.EnRoute)
            assertThat(tracking.techName).isEqualTo("Suresh")
        }

    @Test
    public fun `Tracking state has null location when no location update yet`(): Unit =
        runTest {
            every { getLiveLocation.execute("b2") } returns flowOf(null)
            every { trackStatus.execute("b2") } returns flowOf(BookingStatus.InProgress)
            val vm = viewModel("b2")
            advanceUntilIdle()
            val tracking = vm.uiState.value as LiveTrackingUiState.Tracking
            assertThat(tracking.location).isNull()
            assertThat(tracking.status).isEqualTo(BookingStatus.InProgress)
        }
}
