package com.homeservices.technician.data.paymentprofile

import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

public class PaymentProfileRepositoryImplTest {
    private val apiService: PaymentProfileApiService = mockk()
    private val repository = PaymentProfileRepositoryImpl(apiService)

    @Test
    public fun `updatePaymentProfile maps dto to domain result`(): Unit =
        runTest {
            coEvery {
                apiService.updatePaymentProfile(UpdatePaymentProfileRequestDto("alok@okhdfcbank"))
            } returns UpdatePaymentProfileResponseDto(upiVpa = "alok@okhdfcbank", upiUpdatedAt = "2026-09-12T10:00:00.000Z")

            val result = repository.updatePaymentProfile("alok@okhdfcbank")

            assertTrue(result.isSuccess)
            val value = result.getOrNull()!!
            assertEquals("alok@okhdfcbank", value.upiVpa)
            assertEquals("2026-09-12T10:00:00.000Z", value.upiUpdatedAt)
        }

    @Test
    public fun `updatePaymentProfile propagates network failure`(): Unit =
        runTest {
            coEvery { apiService.updatePaymentProfile(any()) } throws RuntimeException("timeout")

            assertTrue(repository.updatePaymentProfile("alok@okhdfcbank").isFailure)
        }

    @Test
    public fun `updatePaymentProfile passes vpa value to api`(): Unit =
        runTest {
            coEvery { apiService.updatePaymentProfile(any()) } returns
                UpdatePaymentProfileResponseDto("alok@okhdfcbank", "2026-09-12T10:00:00.000Z")

            repository.updatePaymentProfile("alok@okhdfcbank")

            coVerify { apiService.updatePaymentProfile(UpdatePaymentProfileRequestDto("alok@okhdfcbank")) }
        }
}
