package com.homeservices.technician.ui.payoutsettings

import androidx.fragment.app.FragmentActivity
import com.homeservices.technician.domain.auth.BiometricGateUseCase
import com.homeservices.technician.domain.auth.model.BiometricResult
import com.homeservices.technician.domain.payout.PayoutCadenceResult
import com.homeservices.technician.domain.payout.UpdatePayoutCadenceUseCase
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertInstanceOf
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class PayoutCadenceViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val useCase: UpdatePayoutCadenceUseCase = mockk()
    private val biometricGate: BiometricGateUseCase = mockk()
    private val mockActivity: FragmentActivity = mockk(relaxed = true)

    @BeforeEach
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
        every { biometricGate.canUseBiometric(any()) } returns false // default: no biometric
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    private fun createVm() = PayoutCadenceViewModel(useCase, biometricGate)

    @Test
    public fun `initial state is Ready with WEEKLY cadence`(): Unit =
        runTest {
            val vm = createVm()
            val state = vm.uiState.value as PayoutCadenceUiState.Ready
            assertEquals("WEEKLY", state.selectedCadence)
            assertEquals("WEEKLY", state.savedCadence)
            assertFalse(state.isDirty)
        }

    @Test
    public fun `selectCadence changes selectedCadence and marks dirty`(): Unit =
        runTest {
            val vm = createVm()
            vm.selectCadence("INSTANT")
            val state = vm.uiState.value as PayoutCadenceUiState.Ready
            assertEquals("INSTANT", state.selectedCadence)
            assertTrue(state.isDirty)
        }

    @Test
    public fun `saveCadence emits SaveSuccess on success`(): Unit =
        runTest {
            val vm = createVm()
            vm.selectCadence("NEXT_DAY")
            coEvery { useCase.invoke("NEXT_DAY") } returns
                Result.success(PayoutCadenceResult("NEXT_DAY", "2026-05-02T04:30:00.000Z"))

            vm.saveCadence(mockActivity)

            val state = vm.uiState.value
            assertInstanceOf(PayoutCadenceUiState.SaveSuccess::class.java, state)
            assertEquals("2026-05-02T04:30:00.000Z", (state as PayoutCadenceUiState.SaveSuccess).nextPayoutAt)
        }

    @Test
    public fun `saveCadence emits Error on failure`(): Unit =
        runTest {
            val vm = createVm()
            vm.selectCadence("INSTANT")
            coEvery { useCase.invoke("INSTANT") } returns Result.failure(RuntimeException("network"))

            vm.saveCadence(mockActivity)

            assertInstanceOf(PayoutCadenceUiState.Error::class.java, vm.uiState.value)
        }

    @Test
    public fun `saveCadence does nothing when selection is not dirty`(): Unit =
        runTest {
            val vm = createVm()
            // selectedCadence == savedCadence == WEEKLY — no change
            vm.saveCadence(mockActivity)

            assertInstanceOf(PayoutCadenceUiState.Ready::class.java, vm.uiState.value)
        }

    @Test
    public fun `saveCadence aborts when biometric is available but user cancels`(): Unit =
        runTest {
            every { biometricGate.canUseBiometric(any()) } returns true
            coEvery {
                biometricGate.requestAuth(any(), any(), any())
            } returns BiometricResult.Cancelled

            val vm = createVm()
            vm.selectCadence("INSTANT")
            vm.saveCadence(mockActivity)

            // Still in Ready state — not proceeded to save
            assertInstanceOf(PayoutCadenceUiState.Ready::class.java, vm.uiState.value)
        }

    @Test
    public fun `saveCadence proceeds when biometric not available (best-effort)`(): Unit =
        runTest {
            every { biometricGate.canUseBiometric(any()) } returns false
            coEvery { useCase.invoke("INSTANT") } returns
                Result.success(PayoutCadenceResult("INSTANT", null))

            val vm = createVm()
            vm.selectCadence("INSTANT")
            vm.saveCadence(mockActivity)

            assertInstanceOf(PayoutCadenceUiState.SaveSuccess::class.java, vm.uiState.value)
        }

    @Test
    public fun `selectCadence does nothing when state is not Ready`(): Unit =
        runTest {
            coEvery { useCase.invoke(any()) } returns Result.failure(RuntimeException())
            val vm = createVm()
            vm.selectCadence("INSTANT")
            vm.saveCadence(mockActivity) // transitions to Error
            // now state is Error, not Ready
            vm.selectCadence("WEEKLY") // should silently no-op
            assertInstanceOf(PayoutCadenceUiState.Error::class.java, vm.uiState.value)
        }

    @Test
    public fun `saveCadence does nothing when state is not Ready`(): Unit =
        runTest {
            coEvery { useCase.invoke(any()) } returns Result.failure(RuntimeException())
            val vm = createVm()
            vm.selectCadence("INSTANT")
            vm.saveCadence(mockActivity) // → Error state
            vm.saveCadence(mockActivity) // called again in Error state — should no-op
            assertInstanceOf(PayoutCadenceUiState.Error::class.java, vm.uiState.value)
        }

    @Test
    public fun `saveCadence proceeds when biometric succeeds`(): Unit =
        runTest {
            every { biometricGate.canUseBiometric(any()) } returns true
            coEvery { biometricGate.requestAuth(any(), any(), any()) } returns BiometricResult.Authenticated
            coEvery { useCase.invoke("INSTANT") } returns
                Result.success(PayoutCadenceResult("INSTANT", null))

            val vm = createVm()
            vm.selectCadence("INSTANT")
            vm.saveCadence(mockActivity)

            assertInstanceOf(PayoutCadenceUiState.SaveSuccess::class.java, vm.uiState.value)
        }
}
