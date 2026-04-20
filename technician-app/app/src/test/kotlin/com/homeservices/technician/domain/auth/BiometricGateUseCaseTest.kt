package com.homeservices.technician.domain.auth

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class BiometricGateUseCaseTest {
    private lateinit var context: Context
    private lateinit var biometricManager: BiometricManager
    private lateinit var useCase: BiometricGateUseCase

    @BeforeEach
    public fun setUp() {
        context = mockk()
        biometricManager = mockk()
        mockkStatic(BiometricManager::class)
        every { BiometricManager.from(context) } returns biometricManager
        useCase = BiometricGateUseCase()
    }

    @Test
    public fun `canUseBiometric returns true when BiometricManager reports BIOMETRIC_SUCCESS`() {
        every {
            biometricManager.canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
        } returns BiometricManager.BIOMETRIC_SUCCESS

        assertThat(useCase.canUseBiometric(context)).isTrue()
    }

    @Test
    public fun `canUseBiometric returns false when no hardware present`() {
        every {
            biometricManager.canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
        } returns BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE

        assertThat(useCase.canUseBiometric(context)).isFalse()
    }

    @Test
    public fun `canUseBiometric returns false when no biometric enrolled`() {
        every {
            biometricManager.canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
        } returns BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED

        assertThat(useCase.canUseBiometric(context)).isFalse()
    }

    @Test
    public fun `canUseBiometric returns false when hardware unavailable`() {
        every {
            biometricManager.canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
        } returns BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE

        assertThat(useCase.canUseBiometric(context)).isFalse()
    }
}
