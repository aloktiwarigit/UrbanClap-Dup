package com.homeservices.technician.domain.locale

import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

public class GetCurrentLocaleUseCaseTest {
    private val repo: LocaleRepository = mockk()

    @Test
    public fun `returns repo currentLocale flow`(): Unit =
        runTest {
            every { repo.currentLocale } returns flowOf("hi")
            assertEquals("hi", GetCurrentLocaleUseCase(repo)().first())
        }
}
