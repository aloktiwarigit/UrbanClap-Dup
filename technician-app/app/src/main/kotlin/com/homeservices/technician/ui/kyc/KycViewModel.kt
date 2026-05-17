package com.homeservices.technician.ui.kyc

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.data.kyc.DigiLockerCallbackBus
import com.homeservices.technician.data.kyc.KycStatusEvent
import com.homeservices.technician.data.kyc.KycStatusEventBus
import com.homeservices.technician.data.pendingaction.PendingActionStore
import com.homeservices.technician.domain.auth.model.AuthState
import com.homeservices.technician.domain.kyc.KycOrchestrator
import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import com.homeservices.technician.domain.kyc.model.KycStatus
import com.homeservices.technician.domain.kyc.model.PanOcrResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val DIGILOCKER_REDIRECT_URI = "homeservices://kyc/aadhaar-callback"

// DigiLocker authorisation URL template — substituted at runtime with the
// registered client_id and redirect_uri.
private const val DIGILOCKER_CONSENT_URL =
    "https://api.digitallocker.gov.in/public/oauth2/1/authorize" +
        "?response_type=code" +
        "&client_id=HOMESERVICES_DIGILOCKER_CLIENT_ID" +
        "&redirect_uri=$DIGILOCKER_REDIRECT_URI" +
        "&state=kyc_aadhaar"

private const val DEFAULT_REJECTION_MESSAGE = "KYC was rejected. Please contact support."

@HiltViewModel
internal class KycViewModel
    @Inject
    constructor(
        private val orchestrator: KycOrchestrator,
        private val callbackBus: DigiLockerCallbackBus,
        private val kycStatusEventBus: KycStatusEventBus,
        private val pendingActionStore: PendingActionStore,
        private val sessionManager: SessionManager,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<KycUiState>(KycUiState.Idle)
        public val uiState: StateFlow<KycUiState> = _uiState.asStateFlow()

        private val _photoUploadRetryPending = MutableStateFlow(false)
        public val photoUploadRetryPending: StateFlow<Boolean> = _photoUploadRetryPending.asStateFlow()

        /**
         * The last URI the technician submitted via [submitPan]. Held in-memory only —
         * [content://] URIs carry ephemeral grants that do not survive process death,
         * so a cold-start retry must re-prompt the user to pick the photo. The
         * durable PHOTO_UPLOAD_RETRY row is the visible reminder; the URI itself
         * is best-effort.
         */
        private var lastSubmittedUri: Uri? = null

        init {
            viewModelScope.launch {
                callbackBus.events.collect { authCode -> handleDeepLink(authCode) }
            }
            viewModelScope.launch {
                kycStatusEventBus.events.collect { event -> handleKycStatusEvent(event) }
            }
            @OptIn(ExperimentalCoroutinesApi::class)
            viewModelScope.launch {
                sessionManager.authState
                    .flatMapLatest { authState ->
                        when (authState) {
                            is AuthState.Authenticated ->
                                pendingActionStore
                                    .observeActive(authState.uid)
                                    .map { actions ->
                                        actions.any { it.type == PendingActionType.PHOTO_UPLOAD_RETRY }
                                    }
                            AuthState.Unauthenticated -> flowOf(false)
                        }
                    }.collect { _photoUploadRetryPending.value = it }
            }
        }

        /**
         * Initiates the Aadhaar verification flow by emitting the DigiLocker consent URL.
         * The UI is responsible for launching a Custom Tab with this URL.
         */
        public fun startKyc(): Unit {
            _uiState.value = KycUiState.AadhaarPending(consentUrl = DIGILOCKER_CONSENT_URL)
        }

        /**
         * Called when the DigiLocker deep-link redirect delivers the auth code back to the app.
         * Exchanges the code for a verified Aadhaar result.
         */
        public fun handleDeepLink(authCode: String): Unit {
            _uiState.value = KycUiState.Loading
            viewModelScope.launch {
                orchestrator.startAadhaarConsent(authCode, DIGILOCKER_REDIRECT_URI).collect { result ->
                    _uiState.value =
                        when (result) {
                            is DigiLockerResult.AadhaarVerified -> KycUiState.AadhaarDone
                            is DigiLockerResult.UserCancelled ->
                                KycUiState.Error("Aadhaar verification was cancelled. Please try again.")
                            is DigiLockerResult.NetworkError ->
                                KycUiState.Error("Network error during Aadhaar verification. Please try again.")
                            is DigiLockerResult.ApiError ->
                                KycUiState.Error(result.message)
                        }
                }
            }
        }

        /**
         * Uploads the chosen PAN card image and submits it for OCR.
         * On success, emits [KycUiState.Complete] with [KycStatus.PAN_DONE].
         */
        public fun submitPan(fileUri: Uri): Unit {
            lastSubmittedUri = fileUri
            _uiState.value = KycUiState.PanUploading
            val techId = currentTechnicianId()
            viewModelScope.launch {
                // Optimistic durability marker: the submission is in flight and may be
                // interrupted by process death or network loss. OnboardingViewModel
                // observes this so the offline chip surfaces immediately.
                persistKycSubmitPending(techId)

                orchestrator.submitPan(fileUri, technicianId = techId).collect { result ->
                    _uiState.value =
                        when (result) {
                            is PanOcrResult.Success -> {
                                clearSubmissionRows(techId)
                                KycUiState.Complete(status = KycStatus.PAN_DONE)
                            }
                            is PanOcrResult.ManualReview -> {
                                clearSubmissionRows(techId)
                                KycUiState.Complete(status = KycStatus.MANUAL_REVIEW)
                            }
                            is PanOcrResult.OcrError ->
                                KycUiState.Error(result.message)
                            is PanOcrResult.UploadError -> {
                                persistPhotoUploadRetry(fileUri, techId)
                                KycUiState.Error("Failed to upload PAN image. Please try again.")
                            }
                        }
                }
            }
        }

        /**
         * Replays the most recently submitted PAN photo URI. If the URI is no longer
         * available (e.g. cold start after process death), drops the UI back to the
         * PAN picker so the technician can re-select the photo.
         */
        public fun retryPhotoUpload(): Unit {
            val uri = lastSubmittedUri
            if (uri != null) {
                submitPan(uri)
            } else {
                _uiState.value = KycUiState.AadhaarDone
            }
        }

        private fun handleKycStatusEvent(event: KycStatusEvent) {
            // Ignore stale verdicts for previous technicians (multi-account device,
            // delayed delivery, FCM replays). Anchor the verdict to the currently
            // authenticated session.
            val techId = currentTechnicianId()
            if (event.technicianId.isNotBlank() && techId.isNotBlank() && event.technicianId != techId) {
                return
            }

            // Note: tombstoning of queued retry/submit/resume rows is owned by
            // `HomeservicesFcmService.resolveKycPendingRows()` — it runs in a
            // SupervisorJob serviceScope so the writes survive backgrounding and
            // the viewModelScope cancellation that follows `onComplete()`.

            _uiState.value =
                if (event.verified) {
                    KycUiState.Complete(status = KycStatus.PAN_DONE)
                } else {
                    KycUiState.Error(event.rejectionReason ?: DEFAULT_REJECTION_MESSAGE)
                }
        }

        private fun currentTechnicianId(): String = (sessionManager.authState.value as? AuthState.Authenticated)?.uid ?: ""

        private suspend fun clearSubmissionRows(techId: String) {
            if (techId.isBlank()) return
            runCatching { pendingActionStore.clearPhotoRetry(techId) }
            runCatching { pendingActionStore.clearKycSubmitPending(techId) }
            runCatching { pendingActionStore.clearKycResume(techId) }
        }

        private suspend fun persistKycSubmitPending(techId: String) {
            if (techId.isBlank()) return
            val nowMs = System.currentTimeMillis()
            runCatching {
                pendingActionStore.upsert(
                    PendingAction(
                        id = "KYC_SUBMIT_PENDING:technician:$techId:kyc:$techId",
                        userId = techId,
                        role = "technician",
                        type = PendingActionType.KYC_SUBMIT_PENDING,
                        entityType = "kyc",
                        entityId = techId,
                        routeUri = "homeservices://kyc",
                        priority = PendingActionPriority.NORMAL,
                        status = PendingActionStatus.ACTIVE,
                        sourceStatus = null,
                        version = 1L,
                        createdAt = nowMs,
                        updatedAt = nowMs,
                        expiresAt = null,
                        resolvedAt = null,
                    ),
                )
            }
        }

        private suspend fun persistPhotoUploadRetry(
            fileUri: Uri,
            techId: String,
        ) {
            if (techId.isBlank()) return
            val nowMs = System.currentTimeMillis()
            runCatching {
                pendingActionStore.upsert(
                    PendingAction(
                        id = "PHOTO_UPLOAD_RETRY:technician:$techId:kyc:$techId",
                        userId = techId,
                        role = "technician",
                        type = PendingActionType.PHOTO_UPLOAD_RETRY,
                        entityType = "kyc",
                        entityId = techId,
                        routeUri = fileUri.toString(),
                        priority = PendingActionPriority.HIGH,
                        status = PendingActionStatus.ACTIVE,
                        sourceStatus = null,
                        version = 1L,
                        createdAt = nowMs,
                        updatedAt = nowMs,
                        expiresAt = null,
                        resolvedAt = null,
                    ),
                )
            }
        }
    }
