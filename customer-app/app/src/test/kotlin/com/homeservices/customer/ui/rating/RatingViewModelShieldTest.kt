package com.homeservices.customer.ui.rating

import androidx.lifecycle.SavedStateHandle
import com.homeservices.customer.domain.rating.EscalateRatingResult
import com.homeservices.customer.domain.rating.EscalateRatingUseCase
import com.homeservices.customer.domain.rating.GetRatingUseCase
import com.homeservices.customer.domain.rating.SubmitRatingUseCase
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import com.homeservices.customer.domain.rating.model.SideState
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class RatingViewModelShieldTest {
    private val submit: SubmitRatingUseCase = mockk()
    private val get: GetRatingUseCase = mockk()
    private val escalate: EscalateRatingUseCase = mockk()
    private val savedState = SavedStateHandle(mapOf("bookingId" to "bk-1"))

    @BeforeEach
    public fun setUp() {
        // StandardTestDispatcher: delays do NOT auto-advance — prevents startCountdown's
        // delay from firing before assertions on RatingShieldState.Escalated.
        Dispatchers.setMain(StandardTestDispatcher())
        coEvery { get.invoke("bk-1") } returns
            flowOf(
                Result.success(
                    RatingSnapshot("bk-1", RatingSnapshot.Status.PENDING, null, SideState.Pending, SideState.Pending),
                ),
            )
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun TestScope.vm(): RatingViewModel {
        val v = RatingViewModel(submit, get, escalate, savedState)
        runCurrent() // drive init coroutine (collects PENDING snapshot)
        return v
    }

    @Test
    public fun `submit with overall le 2 sets ShowDialog without calling API`(): Unit =
        runTest {
            val v = vm()
            v.setOverall(2)
            v.setPunctuality(5)
            v.setSkill(5)
            v.setBehaviour(5)
            v.submit()
            assertThat(v.shieldState.value).isEqualTo(RatingShieldState.ShowDialog)
            coVerify(exactly = 0) { submit.invoke(any(), any(), any(), any()) }
        }

    @Test
    public fun `submit with overall ge 3 calls API directly without showing dialog`(): Unit =
        runTest {
            coEvery { submit.invoke("bk-1", 3, CustomerSubScores(5, 5, 5), null) } returns
                flowOf(Result.success(Unit))
            val v = vm()
            v.setOverall(3)
            v.setPunctuality(5)
            v.setSkill(5)
            v.setBehaviour(5)
            v.submit()
            runCurrent() // drive doSubmit coroutine
            assertThat(v.shieldState.value).isEqualTo(RatingShieldState.Idle)
            coVerify(exactly = 1) { submit.invoke("bk-1", 3, CustomerSubScores(5, 5, 5), null) }
        }

    @Test
    public fun `onSkipShield resets to Idle and calls submit API`(): Unit =
        runTest {
            coEvery { submit.invoke("bk-1", 1, CustomerSubScores(5, 5, 5), null) } returns
                flowOf(Result.success(Unit))
            val v = vm()
            v.setOverall(1)
            v.setPunctuality(5)
            v.setSkill(5)
            v.setBehaviour(5)
            v.submit() // → ShowDialog (no coroutine)
            v.onSkipShield()
            runCurrent() // drive doSubmit
            assertThat(v.shieldState.value).isEqualTo(RatingShieldState.Idle)
            coVerify(exactly = 1) { submit.invoke("bk-1", 1, CustomerSubScores(5, 5, 5), null) }
        }

    @Test
    public fun `onEscalate calls use case and sets Escalated on success`(): Unit =
        runTest {
            val expiresAtMs = System.currentTimeMillis() + 2 * 60 * 60 * 1000
            coEvery { escalate.invoke("bk-1", 2, null) } returns
                Result.success(EscalateRatingResult("c-1", expiresAtMs))
            // runTest drains all coroutines at cleanup (advanceUntilIdle) — stub submit so the
            // countdown auto-fire at cleanup doesn't throw MockKException.
            coEvery { submit.invoke(any(), any(), any(), any()) } returns flowOf(Result.success(Unit))
            val v = vm()
            v.setOverall(2)
            v.setPunctuality(5)
            v.setSkill(5)
            v.setBehaviour(5)
            v.submit() // → ShowDialog
            v.onEscalate()
            runCurrent() // drives onEscalate → Escalated, countdown suspended at delay(remaining)
            assertThat(v.shieldState.value).isInstanceOf(RatingShieldState.Escalated::class.java)
            assertThat((v.shieldState.value as RatingShieldState.Escalated).expiresAtMs).isEqualTo(expiresAtMs)
        }

    @Test
    public fun `onEscalate failure resets to Idle and sets Error uiState`(): Unit =
        runTest {
            coEvery { escalate.invoke("bk-1", 2, null) } returns Result.failure(RuntimeException("network"))
            val v = vm()
            v.setOverall(2)
            v.setPunctuality(5)
            v.setSkill(5)
            v.setBehaviour(5)
            v.submit()
            v.onEscalate()
            runCurrent()
            assertThat(v.shieldState.value).isEqualTo(RatingShieldState.ShowDialog) // allows retry
            assertThat(v.uiState.value).isInstanceOf(RatingUiState.Error::class.java)
        }

    @Test
    public fun `second submit after Escalated state posts API without reshowing dialog`(): Unit =
        runTest {
            val expiresAtMs = System.currentTimeMillis() + 2 * 60 * 60 * 1000
            coEvery { escalate.invoke("bk-1", 2, null) } returns
                Result.success(EscalateRatingResult("c-1", expiresAtMs))
            coEvery { submit.invoke("bk-1", 2, CustomerSubScores(5, 5, 5), null) } returns
                flowOf(Result.success(Unit))
            val v = vm()
            v.setOverall(2)
            v.setPunctuality(5)
            v.setSkill(5)
            v.setBehaviour(5)
            v.submit() // → ShowDialog
            v.onEscalate()
            runCurrent() // → Escalated, countdown suspended at delay
            v.submit() // shieldState != Idle → straight to doSubmit
            runCurrent() // drive doSubmit
            assertThat(v.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
        }
}
