package com.homeservices.technician.data.payout

import com.homeservices.technician.data.payout.remote.PayoutApiService
import com.homeservices.technician.data.payout.remote.dto.UpdatePayoutCadenceRequestDto
import com.homeservices.technician.data.payout.remote.dto.UpdatePayoutCadenceResponseDto
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

public class PayoutRepositoryImplTest {
    private val apiService: PayoutApiService = mockk()
    private val repository = PayoutRepositoryImpl(apiService)

    @Test
    public fun `updatePayoutCadence maps dto to domain result`(): Unit =
        runTest {
            coEvery {
                apiService.updatePayoutCadence(UpdatePayoutCadenceRequestDto("NEXT_DAY"))
            } returns UpdatePayoutCadenceResponseDto(cadence = "NEXT_DAY", nextPayoutAt = "2026-05-02T04:30:00.000Z")

            val result = repository.updatePayoutCadence("NEXT_DAY")

            assertTrue(result.isSuccess)
            val value = result.getOrNull()!!
            assertEquals("NEXT_DAY", value.cadence)
            assertEquals("2026-05-02T04:30:00.000Z", value.nextPayoutAt)
        }

    @Test
    public fun `updatePayoutCadence maps null nextPayoutAt for INSTANT`(): Unit =
        runTest {
            coEvery {
                apiService.updatePayoutCadence(UpdatePayoutCadenceRequestDto("INSTANT"))
            } returns UpdatePayoutCadenceResponseDto(cadence = "INSTANT", nextPayoutAt = null)

            val result = repository.updatePayoutCadence("INSTANT")

            assertTrue(result.isSuccess)
            assertEquals(null, result.getOrNull()?.nextPayoutAt)
        }

    @Test
    public fun `updatePayoutCadence propagates network failure`(): Unit =
        runTest {
            coEvery { apiService.updatePayoutCadence(any()) } throws RuntimeException("timeout")

            assertTrue(repository.updatePayoutCadence("WEEKLY").isFailure)
        }

    @Test
    public fun `updatePayoutCadence passes cadence value to api`(): Unit =
        runTest {
            coEvery { apiService.updatePayoutCadence(any()) } returns
                UpdatePayoutCadenceResponseDto("WEEKLY", "2026-05-04T04:30:00.000Z")

            repository.updatePayoutCadence("WEEKLY")

            coVerify { apiService.updatePayoutCadence(UpdatePayoutCadenceRequestDto("WEEKLY")) }
        }
}
