package com.homeservices.customer.data.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.remote.BookingApiService
import com.homeservices.customer.data.booking.remote.dto.SlotAvailabilityResponseDto
import com.homeservices.customer.data.booking.remote.dto.SlotDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Test
import java.io.IOException
import java.time.LocalDate

public class SlotAvailabilityRepositoryImplTest {
    private val api: BookingApiService = mockk()
    private val sut = SlotAvailabilityRepositoryImpl(api)

    @Test
    public fun `getAvailability maps slots list to domain`(): Unit =
        runTest {
            coEvery { api.getSlotAvailability("svc-1", "2026-05-20") } returns
                SlotAvailabilityResponseDto(
                    slots =
                        listOf(
                            SlotDto(window = "08:00-10:00", available = true),
                            SlotDto(window = "10:00-12:00", available = false),
                            SlotDto(window = "12:00-14:00", available = true),
                        ),
                )

            val result = sut.getAvailability("svc-1", LocalDate.of(2026, 5, 20)).first()

            assertThat(result.isSuccess).isTrue()
            val slots = result.getOrThrow()
            assertThat(slots).hasSize(3)
            assertThat(slots[0].window).isEqualTo("08:00-10:00")
            assertThat(slots[0].available).isTrue()
            assertThat(slots[1].available).isFalse()
        }

    @Test
    public fun `getAvailability propagates API exception as Result failure`(): Unit =
        runTest {
            coEvery { api.getSlotAvailability(any(), any()) } throws IOException("timeout")

            val result = sut.getAvailability("svc-1", LocalDate.of(2026, 5, 20)).first()

            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()).isInstanceOf(IOException::class.java)
        }
}
