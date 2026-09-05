package com.homeservices.customer.ui.rating

import androidx.lifecycle.SavedStateHandle
import com.homeservices.customer.domain.rating.EscalateRatingUseCase
import com.homeservices.customer.domain.rating.GetRatingUseCase
import com.homeservices.customer.domain.rating.RatingSubmitException
import com.homeservices.customer.domain.rating.RatingSubmitFailure
import com.homeservices.customer.domain.rating.SubmitRatingUseCase
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import com.homeservices.customer.domain.rating.model.SideState
import com.homeservices.customer.observability.analytics.NoOpAnalyticsFacade
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

/**
 * A failed submit used to replace the whole screen with `RatingUiState.Error`, which rendered under
 * `rating_error_title` ("Could not load rating") and threw away the stars and comment the customer
 * had just entered. These tests pin the corrected behaviour: the form survives, and the reason is
 * reported separately from a load failure.
 */
@OptIn(ExperimentalCoroutinesApi::class)
public class RatingViewModelSubmitErrorTest {
    private val submit: SubmitRatingUseCase = mockk()
    private val get: GetRatingUseCase = mockk()
    private val escalate: EscalateRatingUseCase = mockk()
    private val savedState = SavedStateHandle(mapOf("bookingId" to "bk-1"))

    private val snapshot =
        RatingSnapshot("bk-1", RatingSnapshot.Status.PENDING, null, SideState.Pending, SideState.Pending)

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun viewModel(): RatingViewModel {
        coEvery { get.invoke("bk-1") } returns flowOf(Result.success(snapshot))
        return RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())
    }

    private fun RatingViewModel.fillForm() {
        setOverall(4)
        setPunctuality(4)
        setSkill(5)
        setBehaviour(3)
        setComment("came on time")
    }

    private fun failWith(failure: RatingSubmitFailure) {
        coEvery { submit.invoke(any(), any(), any(), any()) } returns
            flowOf(Result.failure(RatingSubmitException(failure)))
    }

    @Test
    public fun `a failed submit keeps the form and its answers instead of showing a load error`(): Unit =
        runTest {
            val vm = viewModel()
            vm.fillForm()
            failWith(RatingSubmitFailure.NoTechnician)

            vm.submit()

            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.Editing::class.java)
            assertThat(vm.overall.value).isEqualTo(4)
            assertThat(vm.punctuality.value).isEqualTo(4)
            assertThat(vm.skill.value).isEqualTo(5)
            assertThat(vm.behaviour.value).isEqualTo(3)
            assertThat(vm.comment.value).isEqualTo("came on time")
        }

    @Test
    public fun `a failed submit reports the reason it failed`(): Unit =
        runTest {
            val vm = viewModel()
            vm.fillForm()
            failWith(RatingSubmitFailure.NoTechnician)

            vm.submit()

            assertThat(vm.submitError.value).isEqualTo(RatingSubmitFailure.NoTechnician)
        }

    @Test
    public fun `a transport failure is reported as retryable`(): Unit =
        runTest {
            val vm = viewModel()
            vm.fillForm()
            failWith(RatingSubmitFailure.Network)

            vm.submit()

            assertThat(vm.submitError.value?.retryable).isTrue()
            assertThat(vm.canSubmit.value).isTrue()
        }

    @Test
    public fun `an unmapped throwable is reported as Unknown rather than leaking its message`(): Unit =
        runTest {
            val vm = viewModel()
            vm.fillForm()
            coEvery { submit.invoke(any(), any(), any(), any()) } returns
                flowOf(Result.failure(IllegalStateException("HTTP 500 Internal Server Error")))

            vm.submit()

            assertThat(vm.submitError.value).isEqualTo(RatingSubmitFailure.Unknown)
            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.Editing::class.java)
        }

    @Test
    public fun `a rating already recorded on the server moves the screen on rather than erroring`(): Unit =
        runTest {
            val vm = viewModel()
            vm.fillForm()
            failWith(RatingSubmitFailure.AlreadySubmitted)

            vm.submit()

            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
            assertThat(vm.submitError.value).isNull()
        }

    @Test
    public fun `retrying clears the previous error`(): Unit =
        runTest {
            val vm = viewModel()
            vm.fillForm()
            failWith(RatingSubmitFailure.Network)
            vm.submit()
            assertThat(vm.submitError.value).isEqualTo(RatingSubmitFailure.Network)

            coEvery { submit.invoke(any(), any(), any(), any()) } returns flowOf(Result.success(Unit))
            vm.submit()

            assertThat(vm.submitError.value).isNull()
            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
        }

    @Test
    public fun `a load failure still shows the screen-level error`(): Unit =
        runTest {
            coEvery { get.invoke("bk-1") } returns flowOf(Result.failure(RuntimeException("timeout")))
            val vm = RatingViewModel(submit, get, escalate, savedState, NoOpAnalyticsFacade())

            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.Error::class.java)
            assertThat(vm.submitError.value).isNull()
        }
}
