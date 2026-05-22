package com.homeservices.customer.domain.consent

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.consent.remote.ConsentAuditApiService
import com.homeservices.customer.data.consent.remote.dto.ConsentAuditRequestDto
import io.mockk.Runs
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.just
import io.mockk.mockk
import io.mockk.slot
import java.io.IOException
import kotlinx.coroutines.test.runTest
import org.junit.Test
import retrofit2.Response

public class RevokeConsentUseCaseTest {
    private val consentRepository: ConsentRepository = mockk()
    private val consentAuditApiService: ConsentAuditApiService = mockk()
    private val sut = RevokeConsentUseCase(consentRepository, consentAuditApiService)

    @Test
    public fun `invoke calls revokeConsent on repository`(): Unit =
        runTest {
            coEvery { consentRepository.revokeConsent() } just Runs
            coEvery { consentAuditApiService.postConsentAudit(any()) } returns Response.success(Unit)

            sut()

            coVerify(exactly = 1) { consentRepository.revokeConsent() }
        }

    @Test
    public fun `invoke posts audit with action REVOKED and all opt-ins false`(): Unit =
        runTest {
            val capturedDto = slot<ConsentAuditRequestDto>()
            coEvery { consentRepository.revokeConsent() } just Runs
            coEvery { consentAuditApiService.postConsentAudit(capture(capturedDto)) } returns Response.success(Unit)

            sut()

            assertThat(capturedDto.captured.action).isEqualTo("REVOKED")
            assertThat(capturedDto.captured.version).isEqualTo(CURRENT_CONSENT_VERSION)
            assertThat(capturedDto.captured.analyticsOptIn).isFalse()
            assertThat(capturedDto.captured.crashOptIn).isFalse()
            assertThat(capturedDto.captured.marketingOptIn).isFalse()
        }

    @Test
    public fun `invoke does not rethrow when audit throws`(): Unit =
        runTest {
            coEvery { consentRepository.revokeConsent() } just Runs
            coEvery { consentAuditApiService.postConsentAudit(any()) } throws IOException("timeout")

            // Must not throw — best-effort
            sut()

            coVerify(exactly = 1) { consentRepository.revokeConsent() }
        }
}
