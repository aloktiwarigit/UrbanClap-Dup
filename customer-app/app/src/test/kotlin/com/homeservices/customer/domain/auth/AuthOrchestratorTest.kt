package com.homeservices.customer.domain.auth

import android.content.Context
import androidx.fragment.app.FragmentActivity
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class AuthOrchestratorTest {

    private lateinit var truecallerUseCase: TruecallerLoginUseCase
    private lateinit var firebaseOtpUseCase: FirebaseOtpUseCase
    private lateinit var saveSessionUseCase: SaveSessionUseCase
    private lateinit var orchestrator: AuthOrchestrator

    @BeforeEach
    public fun setUp() {
        truecallerUseCase = mockk(relaxed = true)
        firebaseOtpUseCase = mockk(relaxed = true)
        saveSessionUseCase = mockk(relaxed = true)
        orchestrator = AuthOrchestrator(truecallerUseCase, firebaseOtpUseCase, saveSessionUseCase)
    }

    @Test
    public fun `start returns TruecallerLaunched and calls launch when Truecaller is available`() {
        val context = mockk<Context>()
        val activity = mockk<FragmentActivity>()
        every { truecallerUseCase.isAvailable() } returns true

        val result = orchestrator.start(context, activity)

        assertThat(result).isEqualTo(AuthOrchestrator.StartResult.TruecallerLaunched)
        verify { truecallerUseCase.init(context) }
        verify { truecallerUseCase.launch(activity) }
    }

    @Test
    public fun `start returns FallbackToOtp when Truecaller is unavailable`() {
        val context = mockk<Context>()
        val activity = mockk<FragmentActivity>()
        every { truecallerUseCase.isAvailable() } returns false

        val result = orchestrator.start(context, activity)

        assertThat(result).isEqualTo(AuthOrchestrator.StartResult.FallbackToOtp)
        verify(exactly = 0) { truecallerUseCase.launch(any()) }
    }
}
