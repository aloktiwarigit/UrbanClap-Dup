package com.homeservices.customer.domain.tracking

import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.customer.domain.tracking.model.TrackingState
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

public class TrackBookingStatusUseCaseTest {

    private val repo: TrackingRepository = mockk()
    private val useCase = TrackBookingStatusUseCase(repo)

    @Test
    public fun `returns initial EnRoute status`(): Unit = runTest {
        every { repo.trackBooking("b1") } returns flowOf(
            TrackingState(location = null, status = BookingStatus.EnRoute)
        )
        val result = useCase.execute("b1").toList()
        assertThat(result).containsExactly(BookingStatus.EnRoute)
    }

    @Test
    public fun `maps status transitions`(): Unit = runTest {
        every { repo.trackBooking("b2") } returns flowOf(
            TrackingState(null, BookingStatus.EnRoute),
            TrackingState(null, BookingStatus.Reached),
            TrackingState(null, BookingStatus.InProgress),
            TrackingState(null, BookingStatus.Completed),
        )
        val result = useCase.execute("b2").toList()
        assertThat(result).containsExactly(
            BookingStatus.EnRoute,
            BookingStatus.Reached,
            BookingStatus.InProgress,
            BookingStatus.Completed,
        )
    }
}
