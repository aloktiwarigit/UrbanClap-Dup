package com.homeservices.customer.data.tracking

import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.customer.domain.tracking.model.TrackingState
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.yield
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class TrackingRepositoryImplTest {

    @Test
    public fun `BookingStatus fromFcmString maps EN_ROUTE`() {
        assertThat(BookingStatus.fromFcmString("EN_ROUTE")).isEqualTo(BookingStatus.EnRoute)
    }

    @Test
    public fun `BookingStatus fromFcmString maps REACHED`() {
        assertThat(BookingStatus.fromFcmString("REACHED")).isEqualTo(BookingStatus.Reached)
    }

    @Test
    public fun `BookingStatus fromFcmString maps IN_PROGRESS`() {
        assertThat(BookingStatus.fromFcmString("IN_PROGRESS")).isEqualTo(BookingStatus.InProgress)
    }

    @Test
    public fun `BookingStatus fromFcmString maps COMPLETED`() {
        assertThat(BookingStatus.fromFcmString("COMPLETED")).isEqualTo(BookingStatus.Completed)
    }

    @Test
    public fun `BookingStatus fromFcmString maps CANCELLED`() {
        assertThat(BookingStatus.fromFcmString("CANCELLED")).isEqualTo(BookingStatus.Cancelled)
    }

    @Test
    public fun `BookingStatus fromFcmString returns Unknown for unrecognised string`() {
        assertThat(BookingStatus.fromFcmString("GARBAGE")).isEqualTo(BookingStatus.Unknown)
    }

    // ── scan logic ─────────────────────────────────────────────────────────────

    private val bus: TrackingEventBus = TrackingEventBus()
    private val repo: TrackingRepositoryImpl = TrackingRepositoryImpl(bus)

    @Test
    public fun `location update populates LiveLocation in state`(): Unit = runTest {
        val results = mutableListOf<TrackingState>()
        val job = launch { repo.trackBooking("b1").collect { results.add(it) } }
        yield() // let collector coroutine start and subscribe before posting events
        bus.post(
            TrackingEvent.LocationUpdate(
                bookingId = "b1",
                lat = 12.97,
                lng = 77.59,
                etaMinutes = 10,
                techName = "Suresh",
                techPhotoUrl = "https://example.com/photo.jpg",
            )
        )
        advanceUntilIdle()
        job.cancel()
        assertThat(results).hasSize(1)
        assertThat(results[0].location?.lat).isEqualTo(12.97)
        assertThat(results[0].location?.techName).isEqualTo("Suresh")
        assertThat(results[0].status).isEqualTo(BookingStatus.EnRoute)
    }

    @Test
    public fun `status update changes booking status`(): Unit = runTest {
        val results = mutableListOf<TrackingState>()
        val job = launch { repo.trackBooking("b2").collect { results.add(it) } }
        yield() // let collector coroutine start and subscribe before posting events
        bus.post(TrackingEvent.StatusUpdate(bookingId = "b2", status = "REACHED"))
        advanceUntilIdle()
        job.cancel()
        assertThat(results).hasSize(1)
        assertThat(results[0].status).isEqualTo(BookingStatus.Reached)
        assertThat(results[0].location).isNull()
    }

    @Test
    public fun `events for different bookingIds are filtered`(): Unit = runTest {
        val results = mutableListOf<TrackingState>()
        val job = launch { repo.trackBooking("b3").collect { results.add(it) } }
        yield() // let collector coroutine start and subscribe before posting events
        bus.post(TrackingEvent.StatusUpdate(bookingId = "OTHER", status = "REACHED"))
        bus.post(TrackingEvent.StatusUpdate(bookingId = "b3", status = "IN_PROGRESS"))
        advanceUntilIdle()
        job.cancel()
        assertThat(results).hasSize(1)
        assertThat(results[0].status).isEqualTo(BookingStatus.InProgress)
    }

    @Test
    public fun `sequential updates accumulate state`(): Unit = runTest {
        val results = mutableListOf<TrackingState>()
        val job = launch { repo.trackBooking("b4").collect { results.add(it) } }
        yield() // let collector coroutine start and subscribe before posting events
        bus.post(TrackingEvent.LocationUpdate("b4", 12.97, 77.59, 10, "Suresh", "url"))
        bus.post(TrackingEvent.StatusUpdate("b4", "REACHED"))
        advanceUntilIdle()
        job.cancel()
        assertThat(results).hasSize(2)
        assertThat(results[0].location?.techName).isEqualTo("Suresh")
        assertThat(results[0].status).isEqualTo(BookingStatus.EnRoute)
        assertThat(results[1].location?.techName).isEqualTo("Suresh")
        assertThat(results[1].status).isEqualTo(BookingStatus.Reached)
    }
}
