package com.homeservices.customer.domain.tracking

import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.customer.domain.tracking.model.LiveLocation
import com.homeservices.customer.domain.tracking.model.TrackingState
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

public class GetLiveLocationUseCaseTest {
    private val repo: TrackingRepository = mockk()
    private val useCase = GetLiveLocationUseCase(repo)

    @Test
    public fun `returns null when TrackingState has no location`(): Unit =
        runTest {
            every { repo.trackBooking("b1") } returns
                flowOf(
                    TrackingState(location = null, status = BookingStatus.EnRoute),
                )
            val result = useCase.execute("b1").toList()
            assertThat(result).containsExactly(null)
        }

    @Test
    public fun `returns LiveLocation when present in TrackingState`(): Unit =
        runTest {
            val loc = LiveLocation(12.97, 77.59, 8, "Suresh", "https://example.com/photo.jpg")
            every { repo.trackBooking("b2") } returns
                flowOf(
                    TrackingState(location = loc, status = BookingStatus.InProgress),
                )
            val result = useCase.execute("b2").toList()
            assertThat(result).containsExactly(loc)
        }

    @Test
    public fun `maps multiple emissions`(): Unit =
        runTest {
            val loc = LiveLocation(12.97, 77.59, 5, "Suresh", "url")
            every { repo.trackBooking("b3") } returns
                flowOf(
                    TrackingState(null, BookingStatus.EnRoute),
                    TrackingState(loc, BookingStatus.EnRoute),
                )
            val result = useCase.execute("b3").toList()
            assertThat(result).containsExactly(null, loc)
        }
}
