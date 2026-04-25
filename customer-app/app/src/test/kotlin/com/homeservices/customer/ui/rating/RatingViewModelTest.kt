package com.homeservices.customer.ui.rating

import androidx.lifecycle.SavedStateHandle
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
            val vm = RatingViewModel(submit, get, savedState)
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

            val vm = RatingViewModel(submit, get, savedState)
            vm.setOverall(5)
            vm.setPunctuality(5)
            vm.setSkill(5)
            vm.setBehaviour(5)
            vm.submit()

            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
        }
}
