package com.homeservices.technician.ui.earnings

import com.homeservices.technician.data.earnings.EarningsUpdateEventBus
import com.homeservices.technician.domain.earnings.GetEarningsUseCase
import com.homeservices.technician.domain.earnings.model.DailyEarnings
import com.homeservices.technician.domain.earnings.model.EarningsPeriod
import com.homeservices.technician.domain.earnings.model.EarningsSummary
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertInstanceOf
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class EarningsViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val useCase: GetEarningsUseCase = mockk()
    private val eventBus = EarningsUpdateEventBus()

    private val fakeSummary =
        EarningsSummary(
            today = EarningsPeriod(120000L, 1),
            week = EarningsPeriod(240000L, 2),
            month = EarningsPeriod(360000L, 3),
            lifetime = EarningsPeriod(960000L, 8),
            lastSevenDays = List(7) { DailyEarnings("2026-04-${20 + it}", 0L) },
        )

    @BeforeEach
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    @Test
    public fun `init loads earnings and transitions to Success`(): Unit =
        runTest {
            coEvery { useCase.invoke() } returns Result.success(fakeSummary)
            val vm = EarningsViewModel(useCase, eventBus)
            assertInstanceOf(EarningsUiState.Success::class.java, vm.uiState.value)
            assertEquals(fakeSummary, (vm.uiState.value as EarningsUiState.Success).summary)
        }

    @Test
    public fun `init failure transitions to Error`(): Unit =
        runTest {
            coEvery { useCase.invoke() } returns Result.failure(RuntimeException())
            val vm = EarningsViewModel(useCase, eventBus)
            assertEquals(EarningsUiState.Error, vm.uiState.value)
        }

    @Test
    public fun `refresh reloads earnings`(): Unit =
        runTest {
            coEvery { useCase.invoke() } returns Result.success(fakeSummary)
            val vm = EarningsViewModel(useCase, eventBus)
            vm.refresh()
            coVerify(exactly = 2) { useCase.invoke() }
        }

    @Test
    public fun `FCM notify triggers reload`(): Unit =
        runTest {
            coEvery { useCase.invoke() } returns Result.success(fakeSummary)
            val vm = EarningsViewModel(useCase, eventBus)
            eventBus.notifyEarningsUpdate()
            coVerify(atLeast = 2) { useCase.invoke() }
        }
}
