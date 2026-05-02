package com.homeservices.technician.domain.payout

import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

public class UpdatePayoutCadenceUseCaseTest {
    private val repository: PayoutRepository = mockk()
    private val useCase = UpdatePayoutCadenceUseCase(repository)

    @Test
    public fun `invoke delegates to repository and returns success`(): Unit =
        runTest {
            val expected = PayoutCadenceResult(cadence = "WEEKLY", nextPayoutAt = "2026-05-04T04:30:00.000Z")
            coEvery { repository.updatePayoutCadence("WEEKLY") } returns Result.success(expected)

            val result = useCase.invoke("WEEKLY")

            assertTrue(result.isSuccess)
            assertEquals(expected, result.getOrNull())
            coVerify(exactly = 1) { repository.updatePayoutCadence("WEEKLY") }
        }

    @Test
    public fun `invoke propagates repository failure`(): Unit =
        runTest {
            coEvery { repository.updatePayoutCadence("INSTANT") } returns Result.failure(RuntimeException("network"))

            val result = useCase.invoke("INSTANT")

            assertTrue(result.isFailure)
        }
}
