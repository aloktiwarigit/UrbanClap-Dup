package com.homeservices.customer.domain.consent

import io.mockk.Runs
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.just
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class GrantConsentUseCaseTest {
    private val consentRepository: ConsentRepository = mockk()
    private val sut = GrantConsentUseCase(consentRepository)

    @Test
    public fun `invoke delegates to consentRepository grantConsent with correct params`(): Unit =
        runTest {
            coEvery { consentRepository.grantConsent(any(), any(), any()) } just Runs

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
    public fun `invoke delegates all-false opt-ins to consentRepository`(): Unit =
        runTest {
            coEvery { consentRepository.grantConsent(any(), any(), any()) } just Runs

            sut(analyticsOptIn = false, crashOptIn = false, marketingOptIn = false)

            coVerify(exactly = 1) { consentRepository.grantConsent(false, false, false) }
        }
}
