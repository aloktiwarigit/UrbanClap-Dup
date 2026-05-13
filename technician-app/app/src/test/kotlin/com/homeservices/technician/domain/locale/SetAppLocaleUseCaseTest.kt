package com.homeservices.technician.domain.locale

import androidx.appcompat.app.AppCompatDelegate
import io.mockk.coEvery
import io.mockk.coVerifyOrder
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class SetAppLocaleUseCaseTest {
    private val repo: LocaleRepository = mockk()
    private val useCase: SetAppLocaleUseCase = SetAppLocaleUseCase(repo)

    @BeforeEach public fun setUp() { mockkStatic(AppCompatDelegate::class) }
    @AfterEach public fun tearDown() { unmockkAll() }

    @Test
    public fun `persist is called before setApplicationLocales`(): Unit = runTest {
        coEvery { repo.setLocale(any()) } returns Unit
        every { AppCompatDelegate.setApplicationLocales(any()) } returns Unit
        useCase("hi")
        coVerifyOrder {
            repo.setLocale("hi")
            AppCompatDelegate.setApplicationLocales(any())
        }
    }
}
