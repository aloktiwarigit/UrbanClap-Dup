package com.homeservices.technician.ui.rating

import androidx.lifecycle.SavedStateHandle
import com.homeservices.technician.domain.rating.GetTechRatingUseCase
import com.homeservices.technician.domain.rating.SubmitTechRatingUseCase
import com.homeservices.technician.domain.rating.model.RatingSnapshot
import com.homeservices.technician.domain.rating.model.SideState
import com.homeservices.technician.domain.rating.model.TechRating
import com.homeservices.technician.domain.rating.model.TechSubScores
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class RatingViewModelTest {
    private val submit: SubmitTechRatingUseCase = mockk()
    private val get: GetTechRatingUseCase = mockk()
    private val savedState = SavedStateHandle(mapOf("bookingId" to "bk-1"))

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    public fun `submit is disabled until overall and both sub-scores are non-zero`(): Unit =
        runTest {
            coEvery { get.invoke("bk-1") } returns
                flowOf(
                    Result.success(
                        RatingSnapshot(
                            "bk-1",
                            RatingSnapshot.Status.PENDING,
                            null,
                            SideState.Pending,
                            SideState.Pending,
                        ),
                    ),
                )
            val vm = RatingViewModel(submit, get, savedState)
            assertThat(vm.canSubmit.value).isFalse()
            vm.setOverall(5)
            assertThat(vm.canSubmit.value).isFalse()
            vm.setBehaviour(5)
            assertThat(vm.canSubmit.value).isFalse()
            vm.setCommunication(5)
            assertThat(vm.canSubmit.value).isTrue()
        }

    @Test
    public fun `successful submit transitions to AwaitingPartner state`(): Unit =
        runTest {
            coEvery { get.invoke("bk-1") } returns
                flowOf(
                    Result.success(
                        RatingSnapshot(
                            "bk-1",
                            RatingSnapshot.Status.PENDING,
                            null,
                            SideState.Pending,
                            SideState.Pending,
                        ),
                    ),
                )
            coEvery {
                submit.invoke("bk-1", 5, TechSubScores(5, 5), null)
            } returns flowOf(Result.success(Unit))

            val vm = RatingViewModel(submit, get, savedState)
            vm.setOverall(5)
            vm.setBehaviour(5)
            vm.setCommunication(5)
            vm.submit()

            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
        }

    @Test
    public fun `init transitions to AwaitingPartner when techSide already submitted`(): Unit =
        runTest {
            val techRating =
                TechRating(
                    overall = 5,
                    subScores = TechSubScores(5, 5),
                    comment = null,
                    submittedAt = "2026-04-25T10:00:00Z",
                )
            coEvery { get.invoke("bk-1") } returns
                flowOf(
                    Result.success(
                        RatingSnapshot(
                            "bk-1",
                            RatingSnapshot.Status.PARTIALLY_SUBMITTED,
                            null,
                            SideState.Pending,
                            SideState.Submitted(techRating),
                        ),
                    ),
                )

            val vm = RatingViewModel(submit, get, savedState)

            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
        }

    @Test
    public fun `init transitions to Revealed when status is REVEALED`(): Unit =
        runTest {
            val techRating =
                TechRating(
                    overall = 5,
                    subScores = TechSubScores(5, 5),
                    comment = null,
                    submittedAt = "2026-04-25T10:00:00Z",
                )
            coEvery { get.invoke("bk-1") } returns
                flowOf(
                    Result.success(
                        RatingSnapshot(
                            "bk-1",
                            RatingSnapshot.Status.REVEALED,
                            "2026-04-25T10:05:00Z",
                            SideState.Pending,
                            SideState.Submitted(techRating),
                        ),
                    ),
                )

            val vm = RatingViewModel(submit, get, savedState)

            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.Revealed::class.java)
        }
}
