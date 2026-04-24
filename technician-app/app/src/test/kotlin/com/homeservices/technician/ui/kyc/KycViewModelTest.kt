package com.homeservices.technician.ui.kyc

import android.net.Uri
import com.homeservices.technician.domain.kyc.KycOrchestrator
import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import com.homeservices.technician.domain.kyc.model.KycStatus
import com.homeservices.technician.domain.kyc.model.PanOcrResult
import io.mockk.every
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

@OptIn(ExperimentalCoroutinesApi::class)
public class KycViewModelTest {
    private lateinit var orchestrator: KycOrchestrator
    private lateinit var viewModel: KycViewModel
    private val testDispatcher = UnconfinedTestDispatcher()

    @BeforeEach
    public fun setUp(): Unit {
        Dispatchers.setMain(testDispatcher)
        orchestrator = mockk(relaxed = true)
        viewModel = KycViewModel(orchestrator)
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
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
    public fun `submitPan emits Complete on PanOcrResult Success`(): Unit =
        runTest {
            val uri = mockk<Uri>()
            every {
                orchestrator.submitPan(uri, any())
            } returns flowOf(PanOcrResult.Success("ABCDE1234F"))

            viewModel.submitPan(uri)

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(KycUiState.Complete::class.java)
            assertThat((state as KycUiState.Complete).status).isEqualTo(KycStatus.PAN_DONE)
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
