package com.homeservices.technician.domain.kyc

import android.net.Uri
import com.homeservices.technician.data.kyc.KycRepository
import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import com.homeservices.technician.domain.kyc.model.KycState
import com.homeservices.technician.domain.kyc.model.KycStatus
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class KycOrchestratorTest {

    private lateinit var digiLockerUseCase: DigiLockerConsentUseCase
    private lateinit var panOcrUseCase: PanOcrUseCase
    private lateinit var repo: KycRepository
    private lateinit var orchestrator: KycOrchestrator

    @BeforeEach
    public fun setUp(): Unit {
        digiLockerUseCase = mockk()
        panOcrUseCase = mockk()
        repo = mockk()
        orchestrator = KycOrchestrator(digiLockerUseCase, panOcrUseCase, repo)
    }

    @Test
    public fun `startAadhaarConsent delegates to DigiLockerConsentUseCase`(): Unit = runTest {
        every { digiLockerUseCase("code", "uri") } returns
            flowOf(DigiLockerResult.AadhaarVerified("XXXX-XXXX-5678"))

        val result = orchestrator.startAadhaarConsent("code", "uri").toList()

        assertThat(result.first()).isInstanceOf(DigiLockerResult.AadhaarVerified::class.java)
    }

    @Test
    public fun `fetchCurrentStatus returns repo state`(): Unit = runTest {
        val state = KycState(KycStatus.AADHAAR_DONE, true, "XXXX-XXXX-5678", null)
        coEvery { repo.getKycStatus() } returns state

        val result = orchestrator.fetchCurrentStatus()

        assertThat(result).isEqualTo(state)
    }
}
