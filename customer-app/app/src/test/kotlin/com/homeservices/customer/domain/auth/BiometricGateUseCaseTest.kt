package com.homeservices.customer.domain.auth

import android.content.Context
import androidx.fragment.app.FragmentActivity
import com.homeservices.customer.domain.auth.gateway.BiometricGateway
import com.homeservices.customer.domain.auth.model.BiometricResult
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class BiometricGateUseCaseTest {
    private lateinit var gateway: BiometricGateway
    private lateinit var useCase: BiometricGateUseCase

    @BeforeEach
    public fun setUp() {
        gateway = mockk()
        useCase = BiometricGateUseCase(gateway)
    }

    @Test
    public fun `canUseBiometric delegates to gateway canAuthenticate`() {
        val context = mockk<Context>()
        every { gateway.canAuthenticate(context) } returns true
        assertThat(useCase.canUseBiometric(context)).isTrue()
    }

    @Test
    public fun `canUseBiometric returns false when gateway returns false`() {
        val context = mockk<Context>()
        every { gateway.canAuthenticate(context) } returns false
        assertThat(useCase.canUseBiometric(context)).isFalse()
    }

    @Test
    public fun `requestAuth returns Authenticated when gateway succeeds`(): Unit = runTest {
        val activity = mockk<FragmentActivity>()
        coEvery { gateway.requestAuth(activity, "Title", "Sub") } returns BiometricResult.Authenticated
        assertThat(useCase.requestAuth(activity, "Title", "Sub")).isEqualTo(BiometricResult.Authenticated)
    }

    @Test
    public fun `requestAuth returns Cancelled when gateway returns Cancelled`(): Unit = runTest {
        val activity = mockk<FragmentActivity>()
        coEvery { gateway.requestAuth(activity, any(), any()) } returns BiometricResult.Cancelled
        assertThat(useCase.requestAuth(activity, "t", "s")).isEqualTo(BiometricResult.Cancelled)
    }
}
