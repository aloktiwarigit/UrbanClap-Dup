package com.homeservices.customer.ui.rating

import androidx.lifecycle.SavedStateHandle
import com.homeservices.customer.domain.rating.EscalateRatingUseCase
import com.homeservices.customer.domain.rating.GetRatingUseCase
import com.homeservices.customer.domain.rating.SubmitRatingUseCase
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import com.homeservices.customer.domain.rating.model.SideState
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
    private val submit: SubmitRatingUseCase = mockk()
    private val get: GetRatingUseCase = mockk()
    private val escalate: EscalateRatingUseCase = mockk()
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
    public fun `submit is disabled until overall and all sub-scores are non-zero`(): Unit =
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
            val vm = RatingViewModel(submit, get, escalate, savedState)
            assertThat(vm.canSubmit.value).isFalse()
            vm.setOverall(5)
            assertThat(vm.canSubmit.value).isFalse()
            vm.setPunctuality(5)
            vm.setSkill(5)
            assertThat(vm.canSubmit.value).isFalse()
            vm.setBehaviour(5)
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
                submit.invoke("bk-1", 5, CustomerSubScores(5, 5, 5), null)
            } returns flowOf(Result.success(Unit))

            val vm = RatingViewModel(submit, get, escalate, savedState)
            vm.setOverall(5)
            vm.setPunctuality(5)
            vm.setSkill(5)
            vm.setBehaviour(5)
            vm.submit()

            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
        }

    @Test
    public fun `transitions to Revealed when snapshot status is REVEALED`(): Unit =
        runTest {
            val snapshot =
                RatingSnapshot(
                    "bk-1",
                    RatingSnapshot.Status.REVEALED,
                    "2026-04-24T12:30:00.000Z",
                    SideState.Pending,
                    SideState.Pending,
                )
            coEvery { get.invoke("bk-1") } returns flowOf(Result.success(snapshot))

            val vm = RatingViewModel(submit, get, escalate, savedState)

            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.Revealed::class.java)
        }

    @Test
    public fun `transitions to AwaitingPartner when customer side already submitted (P2 fix)`(): Unit =
        runTest {
            val customerRating =
                com.homeservices.customer.domain.rating.model.CustomerRating(
                    overall = 5,
                    subScores =
                        com.homeservices.customer.domain.rating.model
                            .CustomerSubScores(5, 5, 5),
                    comment = null,
                    submittedAt = "2026-04-24T12:00:00.000Z",
                )
            val snapshot =
                RatingSnapshot(
                    "bk-1",
                    RatingSnapshot.Status.PARTIALLY_SUBMITTED,
                    null,
                    SideState.Submitted(customerRating),
                    SideState.Pending,
                )
            coEvery { get.invoke("bk-1") } returns flowOf(Result.success(snapshot))

            val vm = RatingViewModel(submit, get, escalate, savedState)

            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
        }

    @Test
    public fun `transitions to Error when getUseCase fails`(): Unit =
        runTest {
            coEvery { get.invoke("bk-1") } returns
                flowOf(Result.failure(RuntimeException("load failed")))

            val vm = RatingViewModel(submit, get, escalate, savedState)

            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.Error::class.java)
        }

    @Test
    public fun `submit does nothing when canSubmit is false`(): Unit =
        runTest {
            coEvery { get.invoke("bk-1") } returns
                flowOf(
                    Result.success(
                        RatingSnapshot("bk-1", RatingSnapshot.Status.PENDING, null, SideState.Pending, SideState.Pending),
                    ),
                )
            val vm = RatingViewModel(submit, get, escalate, savedState)
            vm.submit()
            assertThat(vm.uiState.value).isNotInstanceOf(RatingUiState.Submitting::class.java)
        }

    @Test
    public fun `failed submit transitions to Error state`(): Unit =
        runTest {
            coEvery { get.invoke("bk-1") } returns
                flowOf(
                    Result.success(
                        RatingSnapshot("bk-1", RatingSnapshot.Status.PENDING, null, SideState.Pending, SideState.Pending),
                    ),
                )
            coEvery {
                submit.invoke("bk-1", 5, CustomerSubScores(5, 5, 5), null)
            } returns flowOf(Result.failure(RuntimeException("network error")))

            val vm = RatingViewModel(submit, get, escalate, savedState)
            vm.setOverall(5)
            vm.setPunctuality(5)
            vm.setSkill(5)
            vm.setBehaviour(5)
            vm.submit()

            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.Error::class.java)
        }

    @Test
    public fun `setComment truncates to 500 chars`(): Unit =
        runTest {
            coEvery { get.invoke("bk-1") } returns
                flowOf(
                    Result.success(
                        RatingSnapshot("bk-1", RatingSnapshot.Status.PENDING, null, SideState.Pending, SideState.Pending),
                    ),
                )
            val vm = RatingViewModel(submit, get, escalate, savedState)
            vm.setComment("a".repeat(600))
            assertThat(vm.comment.value.length).isEqualTo(500)
        }
}
