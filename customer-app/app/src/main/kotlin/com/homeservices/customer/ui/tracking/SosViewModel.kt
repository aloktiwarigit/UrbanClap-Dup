package com.homeservices.customer.ui.tracking

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.MediaRecorder
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.sos.SosAudioUploader
import com.homeservices.customer.data.sos.SosConsentStore
import com.homeservices.customer.data.sos.SosUploadProgress
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.flags.FeatureFlags
import com.homeservices.customer.domain.sos.SosUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

@HiltViewModel
@Suppress("LongParameterList", "TooManyFunctions")
public class SosViewModel
    @Inject
    constructor(
        savedStateHandle: SavedStateHandle,
        private val sosUseCase: SosUseCase,
        private val consentStore: SosConsentStore,
        @ApplicationContext private val context: Context,
        private val featureFlags: FeatureFlags,
        private val sessionManager: SessionManager,
        private val audioUploader: SosAudioUploader,
    ) : ViewModel() {
        private val bookingId: String = checkNotNull(savedStateHandle["bookingId"])
        private val _sosUiState = MutableStateFlow<SosUiState>(SosUiState.Idle)
        public val sosUiState: StateFlow<SosUiState> = _sosUiState.asStateFlow()

        private var countdownJob: Job? = null
        private var recorder: MediaRecorder? = null

        /** Set to true only when startRecording() completes successfully in this SOS session. */
        private var freshRecordingCaptured = false

        /** SAFE-SOS-006: in-memory copy of evidence awaiting a successful upload, for retry. */
        private var pendingEvidence: PendingEvidence? = null

        /**
         * Re-entry guard for evidence upload (Codex review MAJOR-1). Only mutated from
         * [uploadEvidence] on the viewModelScope dispatcher, so a plain field is sufficient.
         */
        private var evidenceUploadInFlight = false

        public fun onSosTapped() {
            viewModelScope.launch {
                val consent = consentStore.getAudioConsent()
                if (consent == null) {
                    _sosUiState.value = SosUiState.ShowConsent
                } else {
                    startCountdown(audioGranted = consent)
                }
            }
        }

        public fun onConsentResolved(granted: Boolean) {
            viewModelScope.launch {
                consentStore.setAudioConsent(granted)
                startCountdown(audioGranted = granted)
            }
        }

        /** Dismiss the evidence-saved or evidence-error sheet after upload completes. */
        public fun onDismissEvidenceResult() {
            // Drop the retained copy — the customer declined to retry, so do not hold audio in memory.
            pendingEvidence = null
            _sosUiState.value = SosUiState.SosConfirmed
        }

        public fun onCancelCountdown() {
            countdownJob?.cancel()
            countdownJob = null
            stopRecording()
            wipeStaleSosFile()
            _sosUiState.value = SosUiState.Idle
        }

        /** Fires the SOS immediately, cancelling the countdown. Used by the "Send Now" button. */
        public fun onSendNow() {
            countdownJob?.cancel()
            countdownJob = null
            stopRecording()
            viewModelScope.launch { fireSos() }
        }

        /** Called by the UI after the RECORD_AUDIO OS permission dialog resolves. */
        public fun onAudioPermissionResult(granted: Boolean) {
            startCountdown(audioGranted = granted)
        }

        private fun startCountdown(audioGranted: Boolean) {
            val osPermissionGranted =
                ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
                    PackageManager.PERMISSION_GRANTED
            if (audioGranted && !osPermissionGranted) {
                // Pause and ask UI to request the OS permission; countdown resumes via onAudioPermissionResult.
                _sosUiState.value = SosUiState.RequestAudioPermission
                return
            }
            countdownJob?.cancel()
            countdownJob =
                viewModelScope.launch {
                    // Wipe any stale file from a crash/old build before this countdown starts.
                    wipeStaleSosFile()
                    freshRecordingCaptured = false
                    if (audioGranted && osPermissionGranted) startRecording()
                    for (sec in 30 downTo 1) {
                        _sosUiState.value = SosUiState.Countdown(sec)
                        delay(1_000L)
                    }
                    stopRecording()
                    fireSos()
                }
        }

        private fun startRecording() {
            runCatching {
                val dir = File(context.filesDir, "sos").also { it.mkdirs() }
                val file = File(dir, "sos-$bookingId.m4a")
                val rec =
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        MediaRecorder(context)
                    } else {
                        @Suppress("DEPRECATION")
                        MediaRecorder()
                    }
                rec.apply {
                    setAudioSource(MediaRecorder.AudioSource.MIC)
                    setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                    setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                    setOutputFile(file.absolutePath)
                    prepare()
                    start()
                }
                recorder = rec
                freshRecordingCaptured = true
            }
        }

        /** For testing only: simulate a successful recording capture. */
        @Suppress("unused")
        internal fun simulateFreshRecordingCapturedForTest() {
            freshRecordingCaptured = true
        }

        private fun stopRecording() {
            runCatching {
                recorder?.apply {
                    stop()
                    release()
                }
                recorder = null
            }
        }

        private suspend fun fireSos() {
            val result = sosUseCase.execute(bookingId)
            if (!result.isSuccess) {
                _sosUiState.value = SosUiState.SosError(result.exceptionOrNull()?.message ?: "Unknown error")
                return
            }
            _sosUiState.value = SosUiState.SosConfirmed
            maybeUploadEvidence()
        }

        private suspend fun maybeUploadEvidence() {
            if (!featureFlags.sosAudioUploadEnabled() || !freshRecordingCaptured) return
            val customerId = (sessionManager.authState.value as? AuthState.Authenticated)?.uid
            val file = File(File(context.filesDir, "sos"), "sos-$bookingId.m4a")
            if (customerId == null || !file.exists()) return

            val bytes = file.readBytes()
            // Wipe from disk immediately (unchanged privacy behaviour) but retain in memory so a
            // failed upload can be retried — SAFE-SOS-006. Previously the bytes were unrecoverable
            // after the first failure, so safety evidence for a live emergency was simply lost.
            file.delete()
            pendingEvidence = PendingEvidence(customerId, bytes)
            uploadEvidence(customerId, bytes)
        }

        private suspend fun uploadEvidence(
            customerId: String,
            bytes: ByteArray,
        ) {
            evidenceUploadInFlight = true
            try {
                audioUploader.upload(customerId, bookingId, bytes).collect { progress ->
                    _sosUiState.value =
                        when (progress) {
                            is SosUploadProgress.Progress -> SosUiState.UploadingEvidence(progress.pct)
                            is SosUploadProgress.Success -> {
                                pendingEvidence = null
                                SosUiState.EvidenceSaved
                            }
                            is SosUploadProgress.Failure ->
                                SosUiState.EvidenceUploadError(progress.cause.message ?: "upload_failed")
                        }
                }
            } finally {
                evidenceUploadInFlight = false
            }
        }

        /**
         * SAFE-SOS-006: re-attempt a failed evidence upload from the retained in-memory copy.
         *
         * Guarded against re-entry (Codex review MAJOR-1). Without the guard a double-tap on
         * "Try again" launches two coroutines that both collect the upload flow and both write
         * [_sosUiState]; a Failure from the slower one can land after a Success from the faster one,
         * leaving the UI showing an upload error for evidence that was in fact saved — and
         * submitting the recording twice.
         */
        public fun onRetryEvidenceUpload() {
            val pending = pendingEvidence
            if (pending == null) {
                _sosUiState.value = SosUiState.SosConfirmed
                return
            }
            if (evidenceUploadInFlight) return
            // Claim the guard SYNCHRONOUSLY, before launching. Setting it inside the coroutine is
            // too late: a second tap arrives before the first coroutine is dispatched, sees the flag
            // still false, and launches a duplicate upload. Cleared in uploadEvidence's finally.
            evidenceUploadInFlight = true
            viewModelScope.launch { uploadEvidence(pending.customerId, pending.bytes) }
        }

        private data class PendingEvidence(
            val customerId: String,
            val bytes: ByteArray,
        ) {
            override fun equals(other: Any?): Boolean =
                this === other ||
                    (
                        other is PendingEvidence &&
                            customerId == other.customerId &&
                            bytes.contentEquals(other.bytes)
                    )

            override fun hashCode(): Int = 31 * customerId.hashCode() + bytes.contentHashCode()
        }

        private fun wipeStaleSosFile() {
            freshRecordingCaptured = false
            runCatching { File(File(context.filesDir, "sos"), "sos-$bookingId.m4a").delete() }
        }

        override fun onCleared() {
            super.onCleared()
            countdownJob?.cancel()
            stopRecording()
            wipeStaleSosFile()
        }
    }
