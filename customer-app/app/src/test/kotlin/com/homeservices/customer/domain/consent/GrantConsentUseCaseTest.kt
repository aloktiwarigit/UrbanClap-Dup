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
import java.time.Instant
import kotlinx.coroutines.test.runTest
import org.junit.Test
import retrofit2.Response

public class GrantConsentUseCaseTest {
    private val consentRepository: ConsentRepository = mockk()
    private val consentAuditApiService: ConsentAuditApiService = mockk()
    private val sut = GrantConsentUseCase(consentRepository, consentAuditApiService)

    @Test
    public fun `invoke calls grantConsent with correct params`(): Unit =
        runTest {
            coEvery { consentRepository.grantConsent(any(), any(), any()) } just Runs
            coEvery { consentAuditApiService.postConsentAudit(any()) } returns Response.success(Unit)

            sut(analyticsOptIn = true, crashOptIn = false, marketingOptIn = true)

            coVerify(exactly = 1) {
                consentRepository.grantConsent(
                    analyticsOptIn = true,
                    crashOptIn = false,
                    marketingOptIn = true,
                )
            }
        }

    @Test
    public fun `invoke posts audit with action GRANTED and correct opt-ins`(): Unit =
        runTest {
            val capturedDto = slot<ConsentAuditRequestDto>()
            coEvery { consentRepository.grantConsent(any(), any(), any()) } just Runs
            coEvery { consentAuditApiService.postConsentAudit(capture(capturedDto)) } returns Response.success(Unit)

            sut(analyticsOptIn = true, crashOptIn = true, marketingOptIn = false)

            assertThat(capturedDto.captured.action).isEqualTo("GRANTED")
            assertThat(capturedDto.captured.version).isEqualTo(CURRENT_CONSENT_VERSION)
            assertThat(capturedDto.captured.analyticsOptIn).isTrue()
            assertThat(capturedDto.captured.crashOptIn).isTrue()
            assertThat(capturedDto.captured.marketingOptIn).isFalse()
        }

    @Test
    public fun `invoke does not throw when postConsentAudit throws IOException`(): Unit =
        runTest {
            coEvery { consentRepository.grantConsent(any(), any(), any()) } just Runs
            coEvery { consentAuditApiService.postConsentAudit(any()) } throws IOException("network error")

            // Must not throw — audit is best-effort
            sut(analyticsOptIn = false, crashOptIn = false, marketingOptIn = false)

            // DataStore write still happened
            coVerify(exactly = 1) { consentRepository.grantConsent(false, false, false) }
        }

    @Test
    public fun `timestamp in audit request is non-blank and parseable as ISO-8601`(): Unit =
        runTest {
            val capturedDto = slot<ConsentAuditRequestDto>()
            coEvery { consentRepository.grantConsent(any(), any(), any()) } just Runs
            coEvery { consentAuditApiService.postConsentAudit(capture(capturedDto)) } returns Response.success(Unit)

            sut(analyticsOptIn = true, crashOptIn = true, marketingOptIn = true)

            val timestamp = capturedDto.captured.timestamp
            assertThat(timestamp).isNotEmpty()
            // Instant.parse throws DateTimeParseException if not valid ISO-8601
            val parsed = Instant.parse(timestamp)
            assertThat(parsed).isNotNull()
        }
}
