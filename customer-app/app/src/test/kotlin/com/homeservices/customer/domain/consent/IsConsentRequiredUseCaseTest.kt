package com.homeservices.customer.domain.consent

import com.google.common.truth.Truth.assertThat
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class IsConsentRequiredUseCaseTest {
    private val repo: ConsentRepository = mockk()

    @Test
    public fun `delegates to ConsentRepository isConsentRequired`(): Unit =
        runTest {
            every { repo.isConsentRequired } returns flowOf(true)
            val useCase = IsConsentRequiredUseCase(repo)
            assertThat(useCase().first()).isTrue()
        }
}
