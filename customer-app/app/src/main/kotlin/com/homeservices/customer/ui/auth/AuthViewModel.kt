package com.homeservices.customer.ui.auth

import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.PhoneAuthProvider
import com.homeservices.customer.domain.auth.AuthOrchestrator
import com.homeservices.customer.domain.auth.model.AuthResult
import com.homeservices.customer.domain.auth.model.OtpSendResult
import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class AuthViewModel
    @Inject
    constructor(
        private val orchestrator: AuthOrchestrator,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
        public val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

        private companion object {
            const val MAX_OTP_RETRIES = 3
            const val PHONE_LAST_DIGITS = 4
        }

        private var currentVerificationId: String? = null
        private var currentResendToken: PhoneAuthProvider.ForceResendingToken? = null
        private var currentPhoneNumber: String = ""
        private var otpAttempts: Int = 0
        private var sendOtpJob: Job? = null
        private var truecallerJob: Job? = null

        public fun initAuth(activity: FragmentActivity) {
            // FragmentActivity IS-A Context; pass it for both the Context and FragmentActivity params
            when (orchestrator.start(activity, activity)) {
                AuthOrchestrator.StartResult.TruecallerLaunched -> {
                    _uiState.value = AuthUiState.TruecallerLoading
                    truecallerJob?.cancel()
                    truecallerJob =
                        viewModelScope.launch {
                            orchestrator.observeTruecallerResults().collect { result ->
                                handleTruecallerResult(result)
                            }
                        }
                }
                AuthOrchestrator.StartResult.FallbackToOtp -> {
                    _uiState.value = AuthUiState.OtpEntry()
                }
            }
        }

        private fun handleTruecallerResult(result: TruecallerAuthResult) {
            when (result) {
                is TruecallerAuthResult.Success -> {
                    viewModelScope.launch {
                        val authResult = orchestrator.completeWithTruecaller(result.phoneLastFour)
                        if (authResult is AuthResult.Error) {
                            _uiState.value =
                                AuthUiState.Error(
                                    message = "Sign-in failed. Please use OTP.",
                                    retriesLeft = 0,
                                )
                        }
                    }
                }
                is TruecallerAuthResult.Failure, TruecallerAuthResult.Cancelled -> {
                    _uiState.value = AuthUiState.OtpEntry()
                }
            }
        }

        public fun onPhoneNumberSubmitted(
            phoneNumber: String,
            activity: FragmentActivity,
            resendToken: PhoneAuthProvider.ForceResendingToken? = null,
        ) {
            sendOtpJob?.cancel()
            currentPhoneNumber = phoneNumber
            _uiState.value = AuthUiState.OtpSending
            sendOtpJob =
                viewModelScope.launch {
                    orchestrator.sendOtp(phoneNumber, activity, resendToken).collect { result ->
                        when (result) {
                            is OtpSendResult.CodeSent -> {
                                currentVerificationId = result.verificationId
                                currentResendToken = result.resendToken
                                _uiState.value =
                                    AuthUiState.OtpEntry(
                                        phoneNumber = phoneNumber,
                                        verificationId = result.verificationId,
                                    )
                            }
                            is OtpSendResult.AutoVerified -> {
                                orchestrator.signInWithCredential(result.credential).collect { authResult ->
                                    handleFirebaseAuthResult(authResult)
                                }
                            }
                            is OtpSendResult.Error -> {
                                _uiState.value =
                                    AuthUiState.Error(
                                        message = "Failed to send OTP. Check your number and connection.",
                                        retriesLeft = MAX_OTP_RETRIES,
                                    )
                            }
                        }
                    }
                }
        }

        public fun onOtpEntered(code: String) {
            val verificationId = currentVerificationId ?: return
            _uiState.value = AuthUiState.OtpVerifying
            viewModelScope.launch {
                orchestrator.verifyOtp(verificationId, code).collect { result ->
                    handleFirebaseAuthResult(result)
                }
            }
        }

        public fun onOtpResendRequested(activity: FragmentActivity) {
            otpAttempts = 0
            onPhoneNumberSubmitted(currentPhoneNumber, activity, currentResendToken)
        }

        public fun onRetry() {
            otpAttempts = 0
            currentVerificationId = null
            currentResendToken = null
            _uiState.value = AuthUiState.OtpEntry(phoneNumber = currentPhoneNumber)
        }

        private suspend fun handleFirebaseAuthResult(result: AuthResult) {
            when (result) {
                is AuthResult.Success -> {
                    orchestrator.completeWithFirebase(result.user, currentPhoneNumber.takeLast(PHONE_LAST_DIGITS))
                }
                is AuthResult.Error.WrongCode -> {
                    otpAttempts++
                    _uiState.value =
                        AuthUiState.Error(
                            message = "Incorrect code",
                            retriesLeft = maxOf(0, MAX_OTP_RETRIES - otpAttempts),
                        )
                }
                is AuthResult.Error.RateLimited ->
                    _uiState.value = AuthUiState.Error("Too many attempts. Try again later.", retriesLeft = 0)
                is AuthResult.Error.CodeExpired ->
                    _uiState.value = AuthUiState.Error("Code expired. Please resend.", retriesLeft = 0)
                is AuthResult.Error.General ->
                    _uiState.value =
                        AuthUiState.Error(
                            "Sign-in failed. Please try again.",
                            retriesLeft = 0,
                        )
                is AuthResult.Cancelled, is AuthResult.Unavailable ->
                    _uiState.value = AuthUiState.OtpEntry(phoneNumber = currentPhoneNumber)
            }
        }
    }
