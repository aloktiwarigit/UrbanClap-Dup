package com.homeservices.customer.ui.tracking

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import androidx.lifecycle.SavedStateHandle
import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.sos.SosAudioUploader
import com.homeservices.customer.data.sos.SosConsentStore
import com.homeservices.customer.data.sos.SosUploadProgress
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.flags.FeatureFlags
import com.homeservices.customer.domain.sos.SosUseCase
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkStatic
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.io.File
import kotlin.io.path.createTempDirectory

@OptIn(ExperimentalCoroutinesApi::class)
public class SosViewModelTest {
    private val testDispatcher = StandardTestDispatcher()
    private val sosUseCase: SosUseCase = mockk()
    private val consentStore: SosConsentStore = mockk()
    private val mockContext: Context = mockk(relaxed = true)
    private val savedStateHandle = SavedStateHandle(mapOf("bookingId" to "bk-1"))
    private val featureFlags: FeatureFlags = mockk()
    private val sessionManager: SessionManager = mockk(relaxed = true)
    private val audioUploader: SosAudioUploader = mockk()

    private fun buildVm() =
        SosViewModel(
            savedStateHandle,
            sosUseCase,
            consentStore,
            mockContext,
            featureFlags,
            sessionManager,
            audioUploader,
        )

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(testDispatcher)
        every { featureFlags.sosAudioUploadEnabled() } returns false
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    public fun `initial state is Idle`(): Unit {
        val vm = buildVm()
        assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.Idle::class.java)
    }

    @Test
    public fun `onSosTapped emits ShowConsent when consent not yet answered`(): Unit =
        runTest(testDispatcher) {
            coEvery { consentStore.getAudioConsent() } returns null
            val vm = buildVm()
            vm.onSosTapped()
            advanceUntilIdle()
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.ShowConsent::class.java)
        }

    @Test
    public fun `onSosTapped skips consent and emits Countdown on first tick`(): Unit =
        runTest(testDispatcher) {
            coEvery { consentStore.getAudioConsent() } returns false
            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(1L) // processes launch + Countdown(30) emit, stops at delay(1s)
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.Countdown::class.java)
            assertThat((vm.sosUiState.value as SosUiState.Countdown).secondsLeft).isEqualTo(30)
            // Cancel before test-scope cleanup to avoid mock-missing fireSos call
            vm.onCancelCountdown()
        }

    @Test
    public fun `onConsentResolved stores preference and starts countdown`(): Unit =
        runTest(testDispatcher) {
            coEvery { consentStore.getAudioConsent() } returns null
            coEvery { consentStore.setAudioConsent(false) } returns Unit
            val vm = buildVm()
            vm.onSosTapped()
            advanceUntilIdle()
            vm.onConsentResolved(false)
            advanceTimeBy(1L)
            coVerify { consentStore.setAudioConsent(false) }
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.Countdown::class.java)
            vm.onCancelCountdown()
        }

    @Test
    public fun `onCancelCountdown resets to Idle`(): Unit =
        runTest(testDispatcher) {
            coEvery { consentStore.getAudioConsent() } returns false
            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(1L)
            vm.onCancelCountdown()
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.Idle::class.java)
        }

    @Test
    public fun `countdown completes and calls SOS use case`(): Unit =
        runTest(testDispatcher) {
            coEvery { consentStore.getAudioConsent() } returns false
            coEvery { sosUseCase.execute("bk-1") } returns Result.success(Unit)
            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(31_000L)
            advanceUntilIdle()
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.SosConfirmed::class.java)
            coVerify { sosUseCase.execute("bk-1") }
        }

    @Test
    public fun `failed SOS call emits SosError`(): Unit =
        runTest(testDispatcher) {
            coEvery { consentStore.getAudioConsent() } returns false
            coEvery { sosUseCase.execute("bk-1") } returns Result.failure(RuntimeException("network"))
            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(31_000L)
            advanceUntilIdle()
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.SosError::class.java)
        }

    @Test
    public fun `audio recording starts silently when consent granted and countdown proceeds`(): Unit =
        runTest(testDispatcher) {
            // When audioGranted=true, startRecording() is called. On JVM the MediaRecorder fails
            // silently inside runCatching — countdown must still proceed normally.
            coEvery { consentStore.getAudioConsent() } returns true
            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(1L)
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.Countdown::class.java)
            vm.onCancelCountdown()
        }

    @Test
    public fun `onSendNow fires SOS immediately without waiting for countdown`(): Unit =
        runTest(testDispatcher) {
            coEvery { consentStore.getAudioConsent() } returns false
            coEvery { sosUseCase.execute("bk-1") } returns Result.success(Unit)
            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(1L) // countdown at 30s
            vm.onSendNow()
            advanceUntilIdle()
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.SosConfirmed::class.java)
            coVerify(exactly = 1) { sosUseCase.execute("bk-1") }
        }

    @Test
    public fun `#137 emits RequestAudioPermission when consent granted but OS permission denied`(): Unit =
        runTest(testDispatcher) {
            mockkStatic(ContextCompat::class)
            every {
                ContextCompat.checkSelfPermission(any(), Manifest.permission.RECORD_AUDIO)
            } returns PackageManager.PERMISSION_DENIED
            coEvery { consentStore.getAudioConsent() } returns true
            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(1L)
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.RequestAudioPermission::class.java)
            unmockkStatic(ContextCompat::class)
        }

    @Test
    public fun `flag_off_skips_upload_after_sos_fires`(): Unit =
        runTest(testDispatcher) {
            every { featureFlags.sosAudioUploadEnabled() } returns false
            coEvery { consentStore.getAudioConsent() } returns false
            coEvery { sosUseCase.execute("bk-1") } returns Result.success(Unit)
            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(31_000L)
            advanceUntilIdle()
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.SosConfirmed::class.java)
            coVerify(exactly = 0) { audioUploader.upload(any(), any(), any()) }
        }

    @Test
    public fun `flag_on_uploads_and_emits_evidence_saved_on_success`(): Unit =
        runTest(testDispatcher) {
            val tempDir = createTempDirectory().toFile()
            val sosDir = File(tempDir, "sos").also { it.mkdirs() }
            val file = File(sosDir, "sos-bk-1.m4a").also { it.writeBytes(byteArrayOf(1, 2, 3)) }
            every { mockContext.filesDir } returns tempDir
            every { featureFlags.sosAudioUploadEnabled() } returns true
            every { sessionManager.authState } returns MutableStateFlow(AuthState.Authenticated("cust-1"))
            coEvery { consentStore.getAudioConsent() } returns false
            coEvery { sosUseCase.execute("bk-1") } returns Result.success(Unit)
            every { audioUploader.upload(any(), any(), any()) } returns flowOf(SosUploadProgress.Success)

            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(31_000L)
            advanceUntilIdle()
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.EvidenceSaved::class.java)
            tempDir.deleteRecursively()
        }

    @Test
    public fun `flag_on_emits_upload_error_when_uploader_fails`(): Unit =
        runTest(testDispatcher) {
            val tempDir = createTempDirectory().toFile()
            File(File(tempDir, "sos"), "sos-bk-1.m4a").also {
                it.parentFile?.mkdirs()
                it.writeBytes(byteArrayOf(0))
            }
            every { mockContext.filesDir } returns tempDir
            every { featureFlags.sosAudioUploadEnabled() } returns true
            every { sessionManager.authState } returns MutableStateFlow(AuthState.Authenticated("cust-1"))
            coEvery { consentStore.getAudioConsent() } returns false
            coEvery { sosUseCase.execute("bk-1") } returns Result.success(Unit)
            every { audioUploader.upload(any(), any(), any()) } returns
                flowOf(
                    SosUploadProgress.Failure(RuntimeException("net_error")),
                )

            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(31_000L)
            advanceUntilIdle()
            val state = vm.sosUiState.value
            assertThat(state).isInstanceOf(SosUiState.EvidenceUploadError::class.java)
            assertThat((state as SosUiState.EvidenceUploadError).message).contains("net_error")
            tempDir.deleteRecursively()
        }

    @Test
    public fun `tmp_m4a_file_is_deleted_before_upload_starts`(): Unit =
        runTest(testDispatcher) {
            val tempDir = createTempDirectory().toFile()
            val file =
                File(File(tempDir, "sos"), "sos-bk-1.m4a").also {
                    it.parentFile?.mkdirs()
                    it.writeBytes(byteArrayOf(9))
                }
            every { mockContext.filesDir } returns tempDir
            every { featureFlags.sosAudioUploadEnabled() } returns true
            every { sessionManager.authState } returns MutableStateFlow(AuthState.Authenticated("cust-1"))
            coEvery { consentStore.getAudioConsent() } returns false
            coEvery { sosUseCase.execute("bk-1") } returns Result.success(Unit)
            var fileExistedDuringUpload = true
            every { audioUploader.upload(any(), any(), any()) } answers {
                fileExistedDuringUpload = file.exists()
                flowOf(SosUploadProgress.Success)
            }

            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(31_000L)
            advanceUntilIdle()
            assertThat(fileExistedDuringUpload).isFalse()
            tempDir.deleteRecursively()
        }

    @Test
    public fun `#137 SOS alert fires after audio permission denied — graceful degradation`(): Unit =
        runTest(testDispatcher) {
            mockkStatic(ContextCompat::class)
            every {
                ContextCompat.checkSelfPermission(any(), Manifest.permission.RECORD_AUDIO)
            } returns PackageManager.PERMISSION_DENIED
            coEvery { consentStore.getAudioConsent() } returns true
            coEvery { sosUseCase.execute("bk-1") } returns Result.success(Unit)
            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(1L)
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.RequestAudioPermission::class.java)
            // User denies the OS permission dialog
            vm.onAudioPermissionResult(false)
            advanceTimeBy(1L) // countdown starts at 30s
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.Countdown::class.java)
            advanceTimeBy(31_000L)
            advanceUntilIdle()
            // SOS fires regardless of missing audio permission
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.SosConfirmed::class.java)
            coVerify { sosUseCase.execute("bk-1") }
            unmockkStatic(ContextCompat::class)
        }
}
