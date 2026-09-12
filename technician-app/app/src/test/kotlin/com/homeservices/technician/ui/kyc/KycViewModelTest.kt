package com.homeservices.technician.ui.kyc

import android.net.Uri
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.data.kyc.DigiLockerCallbackBus
import com.homeservices.technician.data.kyc.KycStatusEvent
import com.homeservices.technician.data.kyc.KycStatusEventBus
import com.homeservices.technician.data.pendingaction.PendingActionStore
import com.homeservices.technician.domain.auth.model.AuthProvider
import com.homeservices.technician.domain.auth.model.AuthState
import com.homeservices.technician.domain.kyc.KycOrchestrator
import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import com.homeservices.technician.domain.kyc.model.KycState
import com.homeservices.technician.domain.kyc.model.KycStatus
import com.homeservices.technician.domain.kyc.model.PanOcrResult
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
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
public class KycViewModelTest {
    private lateinit var orchestrator: KycOrchestrator
    private lateinit var callbackBus: DigiLockerCallbackBus
    private lateinit var kycStatusEventBus: KycStatusEventBus
    private lateinit var pendingActionStore: PendingActionStore
    private lateinit var sessionManager: SessionManager
    private lateinit var viewModel: KycViewModel
    private val testDispatcher = UnconfinedTestDispatcher()
    private val techId = "tech-1"

    @BeforeEach
    public fun setUp(): Unit {
        Dispatchers.setMain(testDispatcher)
        orchestrator = mockk(relaxed = true)
        callbackBus = DigiLockerCallbackBus()
        kycStatusEventBus = KycStatusEventBus()
        pendingActionStore = mockk(relaxed = true)
        sessionManager = mockk(relaxed = true)

        every { sessionManager.authState } returns
            MutableStateFlow(
                AuthState.Authenticated(
                    uid = techId,
                    phoneLastFour = null,
                    email = null,
                    displayName = null,
                    authProvider = AuthProvider.Phone,
                ),
            )
        every { pendingActionStore.observeActive(techId) } returns MutableStateFlow(emptyList())

        viewModel =
            KycViewModel(
                orchestrator = orchestrator,
                callbackBus = callbackBus,
                kycStatusEventBus = kycStatusEventBus,
                pendingActionStore = pendingActionStore,
                sessionManager = sessionManager,
            )
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    private fun aUri(): Uri = mockk()

    private fun aKycState(
        aadhaarVerified: Boolean,
        panVerified: Boolean,
    ): KycState =
        KycState(
            status = KycStatus.PENDING,
            aadhaarVerified = aadhaarVerified,
            panVerified = panVerified,
            aadhaarMaskedNumber = null,
            panNumber = null,
        )

    /**
     * Builds a fresh [KycViewModel] against the shared [orchestrator], stubbing
     * [KycOrchestrator.fetchCurrentStatus] to return the given verification facts —
     * the authoritative source `terminalStateFor` resolves against.
     */
    private fun createViewModel(
        aadhaarVerified: Boolean,
        panVerified: Boolean,
    ): KycViewModel {
        coEvery { orchestrator.fetchCurrentStatus() } returns aKycState(aadhaarVerified, panVerified)
        return KycViewModel(
            orchestrator = orchestrator,
            callbackBus = callbackBus,
            kycStatusEventBus = kycStatusEventBus,
            pendingActionStore = pendingActionStore,
            sessionManager = sessionManager,
        )
    }

    @Test
    public fun `startKyc emits AadhaarPending with consentUrl`(): Unit =
        runTest {
            viewModel.startKyc()

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(KycUiState.AadhaarPending::class.java)
            assertThat((state as KycUiState.AadhaarPending).consentUrl).isNotBlank()
        }

    @Test
    public fun `startKyc emits Error when startKyc is called twice rapidly`(): Unit =
        runTest {
            // After startKyc, state should be AadhaarPending
            viewModel.startKyc()

            assertThat(viewModel.uiState.value).isInstanceOf(KycUiState.AadhaarPending::class.java)
        }

    @Test
    public fun `handleDeepLink emits AadhaarDone on DigiLockerResult AadhaarVerified`(): Unit =
        runTest {
            every {
                orchestrator.startAadhaarConsent(any(), any())
            } returns flowOf(DigiLockerResult.AadhaarVerified("XXXX-XXXX-1234"))

            viewModel.handleDeepLink("auth-code-123")

            assertThat(viewModel.uiState.value).isEqualTo(KycUiState.AadhaarDone)
        }

    @Test
    public fun `callback bus auth code emits AadhaarDone`(): Unit =
        runTest {
            every {
                orchestrator.startAadhaarConsent("auth-code-bus", any())
            } returns flowOf(DigiLockerResult.AadhaarVerified("XXXX-XXXX-1234"))

            callbackBus.post("auth-code-bus")

            assertThat(viewModel.uiState.value).isEqualTo(KycUiState.AadhaarDone)
        }

    @Test
    public fun `handleDeepLink emits Error on DigiLockerResult ApiError`(): Unit =
        runTest {
            every {
                orchestrator.startAadhaarConsent(any(), any())
            } returns flowOf(DigiLockerResult.ApiError("Bad response"))

            viewModel.handleDeepLink("auth-code-bad")

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(KycUiState.Error::class.java)
            assertThat((state as KycUiState.Error).message).isNotBlank()
        }

    @Test
    public fun `handleDeepLink emits Error on DigiLockerResult NetworkError`(): Unit =
        runTest {
            every {
                orchestrator.startAadhaarConsent(any(), any())
            } returns flowOf(DigiLockerResult.NetworkError(RuntimeException("network")))

            viewModel.handleDeepLink("auth-code-net-err")

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(KycUiState.Error::class.java)
        }

    @Test
    public fun `PAN success while Aadhaar unverified does NOT render Complete`(): Unit =
        runTest {
            val vm = createViewModel(aadhaarVerified = false, panVerified = true)
            every { orchestrator.submitPan(any(), any()) } returns flowOf(PanOcrResult.Success("ABCDE1234F"))

            vm.submitPan(aUri())

            assertThat(vm.uiState.value).isNotInstanceOf(KycUiState.Complete::class.java)
            assertThat(vm.uiState.value).isInstanceOf(KycUiState.PanDone::class.java)
        }

    @Test
    public fun `PAN success with Aadhaar verified renders Complete`(): Unit =
        runTest {
            val vm = createViewModel(aadhaarVerified = true, panVerified = true)
            every { orchestrator.submitPan(any(), any()) } returns flowOf(PanOcrResult.Success("ABCDE1234F"))

            vm.submitPan(aUri())

            assertThat(vm.uiState.value).isInstanceOf(KycUiState.Complete::class.java)
        }

    @Test
    public fun `AadhaarRequired result routes back to the Aadhaar step`(): Unit =
        runTest {
            val vm = createViewModel(aadhaarVerified = false, panVerified = false)
            every { orchestrator.submitPan(any(), any()) } returns flowOf(PanOcrResult.AadhaarRequired)

            vm.submitPan(aUri())

            assertThat(vm.uiState.value).isInstanceOf(KycUiState.AadhaarRequired::class.java)
        }

    @Test
    public fun `ManualReview result renders a distinct ManualReview state, never PanDone AadhaarDone or Idle`(): Unit =
        runTest {
            // panVerified stays false while a human review is outstanding, so this must
            // NOT be derived from terminalStateFor (which would collapse it into
            // AadhaarDone/Idle — indistinguishable from "never submitted a PAN").
            val vm = createViewModel(aadhaarVerified = false, panVerified = false)
            every { orchestrator.submitPan(any(), any()) } returns flowOf(PanOcrResult.ManualReview)

            vm.submitPan(aUri())

            assertThat(vm.uiState.value).isInstanceOf(KycUiState.ManualReview::class.java)
        }

    @Test
    public fun `submitPan Success does NOT render Complete when the status re-fetch throws`(): Unit =
        runTest {
            val vm = createViewModel(aadhaarVerified = true, panVerified = true)
            coEvery { orchestrator.fetchCurrentStatus() } throws java.io.IOException("network down")
            every { orchestrator.submitPan(any(), any()) } returns flowOf(PanOcrResult.Success("ABCDE1234F"))

            vm.submitPan(aUri())

            assertThat(vm.uiState.value).isNotInstanceOf(KycUiState.Complete::class.java)
            assertThat(vm.uiState.value).isInstanceOf(KycUiState.Error::class.java)
        }

    @Test
    public fun `KYC status event verified does NOT render Complete when the status re-fetch throws`(): Unit =
        runTest {
            val vm = createViewModel(aadhaarVerified = true, panVerified = true)
            coEvery { orchestrator.fetchCurrentStatus() } throws java.io.IOException("network down")

            kycStatusEventBus.post(KycStatusEvent(technicianId = techId, verified = true))

            assertThat(vm.uiState.value).isNotInstanceOf(KycUiState.Complete::class.java)
            assertThat(vm.uiState.value).isInstanceOf(KycUiState.Error::class.java)
        }

    @Test
    public fun `KYC status event verified while Aadhaar unverified does NOT render Complete`(): Unit =
        runTest {
            val vm = createViewModel(aadhaarVerified = false, panVerified = true)

            kycStatusEventBus.post(
                KycStatusEvent(technicianId = techId, verified = true),
            )

            assertThat(vm.uiState.value).isNotInstanceOf(KycUiState.Complete::class.java)
            assertThat(vm.uiState.value).isInstanceOf(KycUiState.PanDone::class.java)
        }

    @Test
    public fun `KYC status event verified with both facts true renders Complete`(): Unit =
        runTest {
            val vm = createViewModel(aadhaarVerified = true, panVerified = true)

            kycStatusEventBus.post(
                KycStatusEvent(technicianId = techId, verified = true),
            )

            assertThat(vm.uiState.value).isInstanceOf(KycUiState.Complete::class.java)
        }

    @Test
    public fun `submitPan emits Error on PanOcrResult UploadError`(): Unit =
        runTest {
            val uri = mockk<Uri>()
            every {
                orchestrator.submitPan(uri, any())
            } returns flowOf(PanOcrResult.UploadError(RuntimeException("upload failed")))

            viewModel.submitPan(uri)

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(KycUiState.Error::class.java)
            assertThat((state as KycUiState.Error).message).isNotBlank()
        }
}
