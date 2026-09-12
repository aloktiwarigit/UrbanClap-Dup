package com.homeservices.technician.domain.paymentprofile

import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

public class UpdatePaymentProfileUseCaseTest {
    private val repository: PaymentProfileRepository = mockk()
    private val useCase = UpdatePaymentProfileUseCase(repository)

    @Test
    public fun `invoke delegates to repository and returns success`(): Unit =
        runTest {
            val expected = PaymentProfileResult(upiVpa = "alok@okhdfcbank", upiUpdatedAt = "2026-09-12T10:00:00.000Z")
            coEvery { repository.updatePaymentProfile("alok@okhdfcbank") } returns Result.success(expected)

            val result = useCase.invoke("alok@okhdfcbank")

            assertTrue(result.isSuccess)
            assertEquals(expected, result.getOrNull())
            coVerify(exactly = 1) { repository.updatePaymentProfile("alok@okhdfcbank") }
        }

    @Test
    public fun `invoke propagates repository failure`(): Unit =
        runTest {
            coEvery { repository.updatePaymentProfile("bad-vpa") } returns Result.failure(RuntimeException("network"))

            val result = useCase.invoke("bad-vpa")

            assertTrue(result.isFailure)
        }
}
