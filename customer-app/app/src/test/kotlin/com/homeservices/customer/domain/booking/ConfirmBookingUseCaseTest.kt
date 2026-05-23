package com.homeservices.customer.domain.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.data.integrity.IntegrityApiService
import com.homeservices.customer.data.integrity.IntegrityNonceResponseDto
import com.homeservices.customer.domain.integrity.IntegrityAttestor
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class ConfirmBookingUseCaseTest {
    private val repo: BookingRepository = mockk()
    private val integrityAttestor: IntegrityAttestor = mockk()
    private val integrityApiService: IntegrityApiService = mockk()
    private val sut = ConfirmBookingUseCase(repo, integrityAttestor, integrityApiService)

    @Test
    public fun `invoke returns confirmed bookingId on success`(): Unit =
        runTest {
            coEvery { integrityApiService.getNonce() } returns IntegrityNonceResponseDto("nonce-1")
            coEvery { integrityAttestor.attest("nonce-1") } returns Result.success("integrity-token-1")
            every {
                repo.confirmBooking("bk-1", "pay_1", "order_1", "sig_1", "integrity-token-1")
            } returns flowOf(Result.success("bk-1"))

            assertThat(sut("bk-1", "pay_1", "order_1", "sig_1").first().getOrThrow()).isEqualTo("bk-1")
            coVerify(exactly = 1) {
                repo.confirmBooking("bk-1", "pay_1", "order_1", "sig_1", "integrity-token-1")
            }
        }

    @Test
    public fun `invoke propagates failure`(): Unit =
        runTest {
            coEvery { integrityApiService.getNonce() } returns IntegrityNonceResponseDto("nonce-1")
            coEvery { integrityAttestor.attest(any()) } returns Result.success("token")
            every { repo.confirmBooking(any(), any(), any(), any(), any()) } returns
                flowOf(Result.failure(RuntimeException("confirm failed")))

            assertThat(sut("bk-1", "pay_1", "order_1", "sig_1").first().isFailure).isTrue()
        }

    @Test
    public fun `invoke proceeds with null token when attestation fails (fail-open)`(): Unit =
        runTest {
            coEvery { integrityApiService.getNonce() } throws RuntimeException("nonce fetch failed")
            every {
                repo.confirmBooking("bk-1", "pay_1", "order_1", "sig_1", null)
            } returns flowOf(Result.success("bk-1"))

            // Should not throw — attestation failure is fail-open
            val result = sut("bk-1", "pay_1", "order_1", "sig_1").first()
            assertThat(result.isSuccess).isTrue()
            coVerify(exactly = 1) {
                repo.confirmBooking("bk-1", "pay_1", "order_1", "sig_1", null)
            }
        }
}
