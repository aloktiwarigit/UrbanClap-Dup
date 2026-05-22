package com.homeservices.customer.domain.consent

import io.mockk.Runs
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.just
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class RevokeConsentUseCaseTest {
    private val consentRepository: ConsentRepository = mockk()
    private val sut = RevokeConsentUseCase(consentRepository)

    @Test
    public fun `invoke delegates to consentRepository revokeConsent`(): Unit =
        runTest {
            coEvery { consentRepository.revokeConsent() } just Runs

            sut()

            coVerify(exactly = 1) { consentRepository.revokeConsent() }
        }
}
