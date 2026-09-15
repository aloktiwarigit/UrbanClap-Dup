package com.homeservices.technician.ui.paymentsettings

import androidx.fragment.app.FragmentActivity
import com.homeservices.technician.domain.auth.BiometricGateUseCase
import com.homeservices.technician.domain.auth.model.BiometricResult
import com.homeservices.technician.domain.paymentprofile.PaymentProfileResult
import com.homeservices.technician.domain.paymentprofile.UpdatePaymentProfileUseCase
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
import org.junit.jupiter.api.Assertions.assertInstanceOf
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class UpiSettingsViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val useCase: UpdatePaymentProfileUseCase = mockk()
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

    private fun createVm() = UpiSettingsViewModel(useCase, biometricGate)

    @Test
    public fun `initial state is Ready with empty vpaInput`(): Unit =
        runTest {
            val vm = createVm()
            val state = vm.uiState.value as UpiSettingsUiState.Ready
            assertEquals("", state.vpaInput)
        }

    @Test
    public fun `updateVpaInput changes vpaInput`(): Unit =
        runTest {
            val vm = createVm()
            vm.updateVpaInput("alok@okhdfcbank")
            val state = vm.uiState.value as UpiSettingsUiState.Ready
            assertEquals("alok@okhdfcbank", state.vpaInput)
        }

    @Test
    public fun `save rejects a malformed VPA before calling the use case`(): Unit =
        runTest {
            val vm = createVm()
            vm.updateVpaInput("not-a-vpa")

            vm.save(mockActivity)

            assertInstanceOf(UpiSettingsUiState.Error::class.java, vm.uiState.value)
        }

    @Test
    public fun `save emits SaveSuccess on success`(): Unit =
        runTest {
            val vm = createVm()
            vm.updateVpaInput("alok@okhdfcbank")
            coEvery { useCase.invoke("alok@okhdfcbank") } returns
                Result.success(PaymentProfileResult("alok@okhdfcbank", "2026-09-12T10:00:00.000Z"))

            vm.save(mockActivity)

            val state = vm.uiState.value
            assertInstanceOf(UpiSettingsUiState.SaveSuccess::class.java, state)
            assertEquals("alok@okhdfcbank", (state as UpiSettingsUiState.SaveSuccess).upiVpa)
        }

    @Test
    public fun `save emits Error on repository failure`(): Unit =
        runTest {
            val vm = createVm()
            vm.updateVpaInput("alok@okhdfcbank")
            coEvery { useCase.invoke("alok@okhdfcbank") } returns Result.failure(RuntimeException("network"))

            vm.save(mockActivity)

            assertInstanceOf(UpiSettingsUiState.Error::class.java, vm.uiState.value)
        }

    @Test
    public fun `save aborts when biometric is available but user cancels`(): Unit =
        runTest {
            every { biometricGate.canUseBiometric(any()) } returns true
            coEvery { biometricGate.requestAuth(any(), any(), any()) } returns BiometricResult.Cancelled

            val vm = createVm()
            vm.updateVpaInput("alok@okhdfcbank")
            vm.save(mockActivity)

            // Still in Ready state — not proceeded to save
            assertInstanceOf(UpiSettingsUiState.Ready::class.java, vm.uiState.value)
        }

    @Test
    public fun `save proceeds when biometric not available (best-effort)`(): Unit =
        runTest {
            every { biometricGate.canUseBiometric(any()) } returns false
            coEvery { useCase.invoke("alok@okhdfcbank") } returns
                Result.success(PaymentProfileResult("alok@okhdfcbank", "2026-09-12T10:00:00.000Z"))

            val vm = createVm()
            vm.updateVpaInput("alok@okhdfcbank")
            vm.save(mockActivity)

            assertInstanceOf(UpiSettingsUiState.SaveSuccess::class.java, vm.uiState.value)
        }

    @Test
    public fun `save proceeds when biometric succeeds`(): Unit =
        runTest {
            every { biometricGate.canUseBiometric(any()) } returns true
            coEvery { biometricGate.requestAuth(any(), any(), any()) } returns BiometricResult.Authenticated
            coEvery { useCase.invoke("alok@okhdfcbank") } returns
                Result.success(PaymentProfileResult("alok@okhdfcbank", "2026-09-12T10:00:00.000Z"))

            val vm = createVm()
            vm.updateVpaInput("alok@okhdfcbank")
            vm.save(mockActivity)

            assertInstanceOf(UpiSettingsUiState.SaveSuccess::class.java, vm.uiState.value)
        }
}
