package com.homeservices.customer.ui.booking

import androidx.fragment.app.FragmentActivity
import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.auth.BiometricGateUseCase
import com.homeservices.customer.domain.auth.model.BiometricResult
import com.homeservices.customer.domain.booking.ApproveFinalPriceUseCase
import com.homeservices.customer.domain.booking.GetPendingAddOnsUseCase
import com.homeservices.customer.domain.booking.model.AddOnDecision
import com.homeservices.customer.domain.booking.model.PendingAddOn
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test

/**
 * TDD tests for biometric gate injection into PriceApprovalViewModel.
 *
 * Invariants verified:
 * 1. Gate fires on submitDecisions — biometric prompt is invoked when hardware is present.
 * 2. Blocks when result is not Authenticated — state does not advance to Approved.
 * 3. Proceeds without gate when HardwareAbsent — HardwareAbsent must not lock out users.
 * 4. Null activity fails closed — no bypass when FragmentActivity is unavailable.
 */
@OptIn(ExperimentalCoroutinesApi::class)
public class PriceApprovalViewModelBiometricTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val getAddOns: GetPendingAddOnsUseCase = mockk()
    private val approve: ApproveFinalPriceUseCase = mockk()
    private val biometricGate: BiometricGateUseCase = mockk()
    private val activity: FragmentActivity = mockk(relaxed = true)
    private val addOns = listOf(PendingAddOn("Gas refill", 120000, "Low pressure"))
    private val decisions = listOf(AddOnDecision("Gas refill", approved = true))

    @Before
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
        every { getAddOns("bk-1") } returns flowOf(Result.success(addOns))
    }

    @After
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    private fun vm() = PriceApprovalViewModel(getAddOns, approve, biometricGate)

    // ------------------------------------------------------------------
    // 1. Gate fires when hardware present + Authenticated → proceeds
    // ------------------------------------------------------------------

    @Test
    public fun `submitDecisions with Authenticated biometric transitions to Approved`(): Unit =
        runTest(dispatcher) {
            every { biometricGate.canUseBiometric(activity) } returns true
            coEvery {
                biometricGate.requestAuth(activity, any(), any())
            } returns BiometricResult.Authenticated
            every { approve("bk-1", decisions) } returns flowOf(Result.success(179900))

            val v = vm()
            v.loadAddOns("bk-1")
            v.submitDecisions("bk-1", decisions, activity)

            assertThat(v.uiState.value).isInstanceOf(PriceApprovalUiState.Approved::class.java)
            assertThat((v.uiState.value as PriceApprovalUiState.Approved).finalAmount).isEqualTo(179900)
        }

    // ------------------------------------------------------------------
    // 2a. Gate blocks when result is Cancelled — state remains unchanged
    // ------------------------------------------------------------------

    @Test
    public fun `submitDecisions with Cancelled biometric does NOT transition to Approved`(): Unit =
        runTest(dispatcher) {
            every { biometricGate.canUseBiometric(activity) } returns true
            coEvery {
                biometricGate.requestAuth(activity, any(), any())
            } returns BiometricResult.Cancelled

            val v = vm()
            v.loadAddOns("bk-1")
            // Capture state before call — it should be PendingApproval
            val stateBefore = v.uiState.value
            v.submitDecisions("bk-1", decisions, activity)

            // State must NOT be Approved — gate blocked the action
            assertThat(v.uiState.value).isNotInstanceOf(PriceApprovalUiState.Approved::class.java)
            // State should be same as before (no transition on cancel)
            assertThat(v.uiState.value).isEqualTo(stateBefore)
        }

    // ------------------------------------------------------------------
    // 2b. Gate blocks when result is Lockout
    // ------------------------------------------------------------------

    @Test
    public fun `submitDecisions with Lockout biometric does NOT proceed`(): Unit =
        runTest(dispatcher) {
            every { biometricGate.canUseBiometric(activity) } returns true
            coEvery {
                biometricGate.requestAuth(activity, any(), any())
            } returns BiometricResult.Lockout

            val v = vm()
            v.loadAddOns("bk-1")
            v.submitDecisions("bk-1", decisions, activity)

            assertThat(v.uiState.value).isNotInstanceOf(PriceApprovalUiState.Approved::class.java)
        }

    // ------------------------------------------------------------------
    // 3. HardwareAbsent skips biometric and proceeds directly
    // ------------------------------------------------------------------

    @Test
    public fun `submitDecisions proceeds without biometric when HardwareAbsent`(): Unit =
        runTest(dispatcher) {
            // canUseBiometric returns false → gate is skipped entirely
            every { biometricGate.canUseBiometric(activity) } returns false
            every { approve("bk-1", decisions) } returns flowOf(Result.success(179900))

            val v = vm()
            v.loadAddOns("bk-1")
            v.submitDecisions("bk-1", decisions, activity)

            assertThat(v.uiState.value).isInstanceOf(PriceApprovalUiState.Approved::class.java)
        }

    // ------------------------------------------------------------------
    // 4. Null activity fails closed — must NOT proceed with sensitive action
    // ------------------------------------------------------------------

    @Test
    public fun `submitDecisions with null activity fails closed — does not approve`(): Unit =
        runTest(dispatcher) {
            val v = vm()
            v.loadAddOns("bk-1")
            // Pass null activity explicitly
            v.submitDecisions("bk-1", decisions, null)

            assertThat(v.uiState.value).isNotInstanceOf(PriceApprovalUiState.Approved::class.java)
        }
}
