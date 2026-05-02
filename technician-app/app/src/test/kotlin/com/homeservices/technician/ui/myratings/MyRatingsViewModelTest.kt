package com.homeservices.technician.ui.myratings

import com.homeservices.technician.data.rating.RatingReceivedEventBus
import com.homeservices.technician.domain.rating.GetMyRatingsSummaryUseCase
import com.homeservices.technician.domain.rating.model.RatingSubScoreAverages
import com.homeservices.technician.domain.rating.model.TechRatingSummary
import com.homeservices.technician.domain.shield.FileRatingAppealUseCase
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
public class MyRatingsViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val useCase: GetMyRatingsSummaryUseCase = mockk()
    private val eventBus = RatingReceivedEventBus()
    private val fileRatingAppealUseCase: FileRatingAppealUseCase = mockk(relaxed = true)

    private val fakeSummary =
        TechRatingSummary(
            totalCount = 3,
            averageOverall = 4.2,
            averageSubScores = RatingSubScoreAverages(4.5, 4.1, 4.0),
            trend = emptyList(),
            items = emptyList(),
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
    public fun `init loads ratings and transitions to Success`(): Unit =
        runTest {
            coEvery { useCase.invoke() } returns Result.success(fakeSummary)
            val vm = MyRatingsViewModel(useCase, eventBus, fileRatingAppealUseCase)
            assertInstanceOf(MyRatingsUiState.Success::class.java, vm.uiState.value)
            assertEquals(fakeSummary, (vm.uiState.value as MyRatingsUiState.Success).summary)
        }

    @Test
    public fun `init failure transitions to Error`(): Unit =
        runTest {
            coEvery { useCase.invoke() } returns Result.failure(RuntimeException())
            val vm = MyRatingsViewModel(useCase, eventBus, fileRatingAppealUseCase)
            assertEquals(MyRatingsUiState.Error, vm.uiState.value)
        }

    @Test
    public fun `refresh reloads ratings`(): Unit =
        runTest {
            coEvery { useCase.invoke() } returns Result.success(fakeSummary)
            val vm = MyRatingsViewModel(useCase, eventBus, fileRatingAppealUseCase)
            vm.refresh()
            coVerify(exactly = 2) { useCase.invoke() }
        }

    @Test
    public fun `FCM event triggers reload`(): Unit =
        runTest {
            coEvery { useCase.invoke() } returns Result.success(fakeSummary)
            val vm = MyRatingsViewModel(useCase, eventBus, fileRatingAppealUseCase)
            eventBus.post()
            coVerify(atLeast = 2) { useCase.invoke() }
        }
}
