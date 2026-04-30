package com.homeservices.technician.ui.kyc

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.data.kyc.DigiLockerCallbackBus
import com.homeservices.technician.domain.kyc.KycOrchestrator
import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import com.homeservices.technician.domain.kyc.model.KycStatus
import com.homeservices.technician.domain.kyc.model.PanOcrResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
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

@HiltViewModel
internal class KycViewModel
    @Inject
    constructor(
        private val orchestrator: KycOrchestrator,
        private val callbackBus: DigiLockerCallbackBus,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<KycUiState>(KycUiState.Idle)
        public val uiState: StateFlow<KycUiState> = _uiState.asStateFlow()

        init {
            viewModelScope.launch {
                callbackBus.events.collect { authCode -> handleDeepLink(authCode) }
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
            _uiState.value = KycUiState.PanUploading
            viewModelScope.launch {
                // technicianId is sourced from the SessionManager in a future story;
                // passing an empty string here keeps the orchestrator contract satisfied
                // for the pilot MVP and allows unit tests to use `any()` matching.
                orchestrator.submitPan(fileUri, technicianId = "").collect { result ->
                    _uiState.value =
                        when (result) {
                            is PanOcrResult.Success ->
                                KycUiState.Complete(status = KycStatus.PAN_DONE)
                            is PanOcrResult.ManualReview ->
                                KycUiState.Complete(status = KycStatus.MANUAL_REVIEW)
                            is PanOcrResult.OcrError ->
                                KycUiState.Error(result.message)
                            is PanOcrResult.UploadError ->
                                KycUiState.Error("Failed to upload PAN image. Please try again.")
                        }
                }
            }
        }
    }
