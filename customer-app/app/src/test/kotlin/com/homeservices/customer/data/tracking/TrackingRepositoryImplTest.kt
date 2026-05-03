package com.homeservices.customer.data.tracking

import com.homeservices.customer.data.booking.remote.BookingApiService
import com.homeservices.customer.data.booking.remote.dto.ApproveFinalPriceRequestDto
import com.homeservices.customer.data.booking.remote.dto.ApproveFinalPriceResponseDto
import com.homeservices.customer.data.booking.remote.dto.ConfirmBookingRequestDto
import com.homeservices.customer.data.booking.remote.dto.ConfirmBookingResponseDto
import com.homeservices.customer.data.booking.remote.dto.CreateBookingRequestDto
import com.homeservices.customer.data.booking.remote.dto.CreateBookingResponseDto
import com.homeservices.customer.data.booking.remote.dto.CustomerBookingsResponseDto
import com.homeservices.customer.data.booking.remote.dto.GetBookingResponseDto
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
    private class FakeBookingApiService(
        var status: String = "ASSIGNED",
    ) : BookingApiService {
        override suspend fun createBooking(body: CreateBookingRequestDto): CreateBookingResponseDto = error("not used")

        override suspend fun confirmBooking(
            bookingId: String,
            body: ConfirmBookingRequestDto,
        ): ConfirmBookingResponseDto = error("not used")

        override suspend fun getBooking(bookingId: String): GetBookingResponseDto =
            GetBookingResponseDto(
                bookingId = bookingId,
                status = status,
                amount = 59900,
                finalAmount = null,
                pendingAddOns = emptyList(),
            )

        override suspend fun getMyBookings(): CustomerBookingsResponseDto = error("not used")

        override suspend fun approveFinalPrice(
            bookingId: String,
            body: ApproveFinalPriceRequestDto,
        ): ApproveFinalPriceResponseDto = error("not used")
    }

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
    public fun `BookingStatus fromFcmString maps ASSIGNED without marking en route`() {
        assertThat(BookingStatus.fromFcmString("ASSIGNED")).isEqualTo(BookingStatus.Assigned)
    }

    @Test
    public fun `BookingStatus fromFcmString maps PAID as confirmed`() {
        assertThat(BookingStatus.fromFcmString("PAID")).isEqualTo(BookingStatus.Paid)
    }

    @Test
    public fun `BookingStatus fromFcmString returns Unknown for unrecognised string`() {
        assertThat(BookingStatus.fromFcmString("GARBAGE")).isEqualTo(BookingStatus.Unknown)
    }

    // ── scan logic ─────────────────────────────────────────────────────────────

    private val bus: TrackingEventBus = TrackingEventBus()
    private val api = FakeBookingApiService()
    private val repo: TrackingRepositoryImpl = TrackingRepositoryImpl(bus, api)

    @Test
    public fun `location update populates LiveLocation in state`(): Unit =
        runTest {
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
                ),
            )
            advanceUntilIdle()
            job.cancel()
            assertThat(results).hasSize(2)
            // seed
            assertThat(results[0].location).isNull()
            assertThat(results[0].status).isEqualTo(BookingStatus.Assigned)
            // after location update
            assertThat(results[1].location?.lat).isEqualTo(12.97)
            assertThat(results[1].location?.techName).isEqualTo("Suresh")
            assertThat(results[1].status).isEqualTo(BookingStatus.Assigned)
        }

    @Test
    public fun `status update changes booking status`(): Unit =
        runTest {
            val results = mutableListOf<TrackingState>()
            val job = launch { repo.trackBooking("b2").collect { results.add(it) } }
            yield() // let collector coroutine start and subscribe before posting events
            bus.post(TrackingEvent.StatusUpdate(bookingId = "b2", status = "REACHED"))
            advanceUntilIdle()
            job.cancel()
            assertThat(results).hasSize(2)
            // seed
            assertThat(results[0].location).isNull()
            assertThat(results[0].status).isEqualTo(BookingStatus.Assigned)
            // after status update
            assertThat(results[1].status).isEqualTo(BookingStatus.Reached)
            assertThat(results[1].location).isNull()
        }

    @Test
    public fun `events for different bookingIds are filtered`(): Unit =
        runTest {
            val results = mutableListOf<TrackingState>()
            val job = launch { repo.trackBooking("b3").collect { results.add(it) } }
            yield() // let collector coroutine start and subscribe before posting events
            bus.post(TrackingEvent.StatusUpdate(bookingId = "OTHER", status = "REACHED"))
            bus.post(TrackingEvent.StatusUpdate(bookingId = "b3", status = "IN_PROGRESS"))
            advanceUntilIdle()
            job.cancel()
            assertThat(results).hasSize(2)
            // seed
            assertThat(results[0].status).isEqualTo(BookingStatus.Assigned)
            // after IN_PROGRESS for "b3"
            assertThat(results[1].status).isEqualTo(BookingStatus.InProgress)
        }

    @Test
    public fun `sequential updates accumulate state`(): Unit =
        runTest {
            val results = mutableListOf<TrackingState>()
            val job = launch { repo.trackBooking("b4").collect { results.add(it) } }
            yield() // let collector coroutine start and subscribe before posting events
            bus.post(TrackingEvent.LocationUpdate("b4", 12.97, 77.59, 10, "Suresh", "url"))
            bus.post(TrackingEvent.StatusUpdate("b4", "REACHED"))
            advanceUntilIdle()
            job.cancel()
            assertThat(results).hasSize(3)
            // seed
            assertThat(results[0].location).isNull()
            assertThat(results[0].status).isEqualTo(BookingStatus.Assigned)
            // after LocationUpdate
            assertThat(results[1].location?.techName).isEqualTo("Suresh")
            assertThat(results[1].status).isEqualTo(BookingStatus.Assigned)
            // after StatusUpdate
            assertThat(results[2].location?.techName).isEqualTo("Suresh")
            assertThat(results[2].status).isEqualTo(BookingStatus.Reached)
        }

    @Test
    public fun `trackBooking emits Unknown seed when booking lookup fails`(): Unit =
        runTest {
            api.status = "NOT_A_REAL_STATUS"
            val results = mutableListOf<TrackingState>()
            val job = launch { repo.trackBooking("b5").collect { results.add(it) } }
            yield()
            job.cancel()
            assertThat(results).hasSize(1)
            assertThat(results[0].status).isEqualTo(BookingStatus.Unknown)
        }
}
