package com.homeservices.customer.domain.locale

import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import io.mockk.coVerify
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkStatic
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Before
import org.junit.Test

public class SetAppLocaleUseCaseTest {
    private val repo: LocaleRepository = mockk(relaxed = true)
    private lateinit var useCase: SetAppLocaleUseCase

    @Before
    public fun setUp() {
        mockkStatic(AppCompatDelegate::class)
        useCase = SetAppLocaleUseCase(repo)
    }

    @After
    public fun tearDown() {
        unmockkStatic(AppCompatDelegate::class)
    }

    @Test
    public fun `invoke applies AppCompatDelegate locale and persists tag`(): Unit = runTest {
        useCase("hi")

        verify { AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags("hi")) }
        coVerify { repo.setLocale("hi") }
        coVerify { repo.markFirstLaunchCompleted() }
    }
}
