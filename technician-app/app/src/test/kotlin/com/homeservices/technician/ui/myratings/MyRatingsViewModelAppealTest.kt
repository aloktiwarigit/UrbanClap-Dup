package com.homeservices.technician.ui.myratings

import com.homeservices.technician.data.rating.RatingReceivedEventBus
import com.homeservices.technician.domain.rating.GetMyRatingsSummaryUseCase
import com.homeservices.technician.domain.rating.model.RatingSubScoreAverages
import com.homeservices.technician.domain.rating.model.TechRatingSummary
import com.homeservices.technician.domain.shield.FileRatingAppealUseCase
import com.homeservices.technician.domain.shield.model.RatingAppealResult
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class MyRatingsViewModelAppealTest {
    private val testDispatcher = UnconfinedTestDispatcher()
    private lateinit var summaryUseCase: GetMyRatingsSummaryUseCase
    private lateinit var ratingReceivedEventBus: RatingReceivedEventBus
    private lateinit var fileRatingAppealUseCase: FileRatingAppealUseCase
    private lateinit var viewModel: MyRatingsViewModel

    private val emptySummary =
        TechRatingSummary(
            totalCount = 0,
            averageOverall = 0.0,
            averageSubScores = RatingSubScoreAverages(0.0, 0.0, 0.0),
            trend = emptyList(),
            items = emptyList(),
        )

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(testDispatcher)
        summaryUseCase = mockk()
        ratingReceivedEventBus = mockk()
        fileRatingAppealUseCase = mockk()
        coEvery { summaryUseCase.invoke() } returns Result.success(emptySummary)
        val flow = MutableSharedFlow<Unit>()
        every { ratingReceivedEventBus.events } returns flow.asSharedFlow()
        viewModel =
            MyRatingsViewModel(
                useCase = summaryUseCase,
                ratingReceivedEventBus = ratingReceivedEventBus,
                fileRatingAppealUseCase = fileRatingAppealUseCase,
            )
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    @Test
    public fun `fileRatingAppeal success transitions to AppealState Success`(): Unit =
        runTest {
            coEvery {
                fileRatingAppealUseCase.invoke("bk-1", "this is a sufficiently long reason for appeal")
            } returns Result.success(RatingAppealResult(appealId = "appeal-1"))

            viewModel.fileRatingAppeal("bk-1", "this is a sufficiently long reason for appeal")
            advanceUntilIdle()

            assertThat(viewModel.appealState.value).isEqualTo(AppealState.Success)
        }

    @Test
    public fun `fileRatingAppeal quota exceeded transitions to QuotaExceeded`(): Unit =
        runTest {
            coEvery {
                fileRatingAppealUseCase.invoke(any(), any())
            } returns
                Result.success(
                    RatingAppealResult(quotaExceeded = true, nextAvailableAt = "2026-05-01T00:00:00.000Z"),
                )

            viewModel.fileRatingAppeal("bk-1", "valid reason at least twenty characters here")
            advanceUntilIdle()

            val state = viewModel.appealState.value
            assertThat(state).isInstanceOf(AppealState.QuotaExceeded::class.java)
            assertThat((state as AppealState.QuotaExceeded).nextAvailableAt).isEqualTo("2026-05-01T00:00:00.000Z")
        }

    @Test
    public fun `fileRatingAppeal failure transitions to Error`(): Unit =
        runTest {
            coEvery { fileRatingAppealUseCase.invoke(any(), any()) } returns
                Result.failure(RuntimeException("network"))

            viewModel.fileRatingAppeal("bk-1", "valid reason at least twenty characters here")
            advanceUntilIdle()

            assertThat(viewModel.appealState.value).isEqualTo(AppealState.Error)
        }

    @Test
    public fun `consumeAppealState resets to Idle`(): Unit =
        runTest {
            coEvery { fileRatingAppealUseCase.invoke(any(), any()) } returns
                Result.success(RatingAppealResult(appealId = "a-1"))
            viewModel.fileRatingAppeal("bk-1", "valid reason at least twenty characters here")
            advanceUntilIdle()
            assertThat(viewModel.appealState.value).isEqualTo(AppealState.Success)

            viewModel.consumeAppealState()

            assertThat(viewModel.appealState.value).isEqualTo(AppealState.Idle)
        }
}
