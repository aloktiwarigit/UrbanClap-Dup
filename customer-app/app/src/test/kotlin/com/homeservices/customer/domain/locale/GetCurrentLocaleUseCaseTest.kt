package com.homeservices.customer.domain.locale

import com.google.common.truth.Truth.assertThat
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class GetCurrentLocaleUseCaseTest {
    private val repo: LocaleRepository = mockk()

    @Test
    public fun `returns repo currentLocale flow`(): Unit =
        runTest {
            every { repo.currentLocale } returns flowOf("hi")
            val useCase = GetCurrentLocaleUseCase(repo)
            assertThat(useCase().first()).isEqualTo("hi")
        }
}
