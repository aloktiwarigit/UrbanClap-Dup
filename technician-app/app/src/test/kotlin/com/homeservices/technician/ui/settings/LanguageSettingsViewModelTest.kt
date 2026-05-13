package com.homeservices.technician.ui.settings

import com.homeservices.technician.domain.locale.GetCurrentLocaleUseCase
import com.homeservices.technician.domain.locale.SetAppLocaleUseCase
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class LanguageSettingsViewModelTest {
    private val dispatcher = StandardTestDispatcher()
    private val getCurrentLocale: GetCurrentLocaleUseCase = mockk()
    private val setAppLocale: SetAppLocaleUseCase = mockk(relaxed = true)

    @BeforeEach public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
        every { getCurrentLocale() } returns flowOf("en")
    }

    @AfterEach public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    private fun vm(): LanguageSettingsViewModel = LanguageSettingsViewModel(getCurrentLocale, setAppLocale)

    @Test public fun `init loads current locale`(): Unit =
        runTest {
            val vm = vm()
            advanceUntilIdle()
            assertEquals("en", vm.selectedTag.value)
        }

    @Test public fun `onSelect updates selectedTag`(): Unit =
        runTest {
            val vm = vm()
            advanceUntilIdle()
            vm.onSelect("hi")
            assertEquals("hi", vm.selectedTag.value)
        }

    @Test public fun `onSave calls setAppLocale with selected tag`(): Unit =
        runTest {
            val vm = vm()
            advanceUntilIdle()
            vm.onSelect("hi")
            vm.onSave()
            advanceUntilIdle()
            coVerify { setAppLocale("hi") }
        }

    @Test public fun `onSave sets savedFlow true`(): Unit =
        runTest {
            val vm = vm()
            advanceUntilIdle()
            vm.onSave()
            advanceUntilIdle()
            assertTrue(vm.savedFlow.value)
        }
}
