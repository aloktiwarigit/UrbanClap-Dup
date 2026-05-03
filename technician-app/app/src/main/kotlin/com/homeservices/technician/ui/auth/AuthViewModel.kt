package com.homeservices.technician.ui.auth

import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.PhoneAuthProvider
import com.homeservices.technician.domain.auth.AuthOrchestrator
import com.homeservices.technician.domain.auth.model.AuthResult
import com.homeservices.technician.domain.auth.model.OtpSendResult
import com.homeservices.technician.domain.auth.model.TruecallerAuthResult
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
        private var emailAuthJob: Job? = null

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
                    _uiState.value = AuthUiState.MethodSelection
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
                    _uiState.value = AuthUiState.MethodSelection
                }
            }
        }

        public fun onPhoneSelected() {
            _uiState.value = AuthUiState.OtpEntry(phoneNumber = currentPhoneNumber)
        }

        public fun onEmailSelected() {
            _uiState.value = AuthUiState.EmailEntry()
        }

        public fun onBackToMethodSelection() {
            _uiState.value = AuthUiState.MethodSelection
        }

        public fun onEmailModeToggled(currentEmail: String = "") {
            val current = _uiState.value as? AuthUiState.EmailEntry
            val nextMode =
                if (current?.mode == AuthUiState.EmailEntry.Mode.SignUp) {
                    AuthUiState.EmailEntry.Mode.SignIn
                } else {
                    AuthUiState.EmailEntry.Mode.SignUp
                }
            _uiState.value =
                AuthUiState.EmailEntry(
                    mode = nextMode,
                    prefillEmail = currentEmail.ifBlank { current?.prefillEmail.orEmpty() },
                )
        }

        public fun onGoogleSignInClicked(activity: FragmentActivity) {
            emailAuthJob?.cancel()
            _uiState.value = AuthUiState.GoogleSigningIn
            emailAuthJob =
                viewModelScope.launch {
                    orchestrator.startGoogleSignIn(activity).collect { result ->
                        handleGoogleAuthResult(result)
                    }
                }
        }

        public fun onEmailSignInClicked(
            email: String,
            password: String,
        ) {
            submitEmailAuth(email, password, AuthUiState.EmailEntry.Mode.SignIn)
        }

        public fun onEmailSignUpClicked(
            email: String,
            password: String,
        ) {
            submitEmailAuth(email, password, AuthUiState.EmailEntry.Mode.SignUp)
        }

        private fun submitEmailAuth(
            email: String,
            password: String,
            mode: AuthUiState.EmailEntry.Mode,
        ) {
            val normalizedEmail = email.trim()
            if (normalizedEmail.isBlank() || password.isBlank()) {
                _uiState.value =
                    AuthUiState.Error(
                        message = "Enter your email and password.",
                        retriesLeft = 0,
                    )
                return
            }
            emailAuthJob?.cancel()
            _uiState.value = AuthUiState.EmailSubmitting(normalizedEmail, mode)
            emailAuthJob =
                viewModelScope.launch {
                    val flow =
                        if (mode == AuthUiState.EmailEntry.Mode.SignIn) {
                            orchestrator.startEmailSignIn(normalizedEmail, password)
                        } else {
                            orchestrator.startEmailSignUp(normalizedEmail, password)
                        }
                    flow.collect { result ->
                        handleEmailAuthResult(result, normalizedEmail, mode)
                    }
                }
        }

        public fun onEmailVerificationContinue(email: String) {
            emailAuthJob?.cancel()
            _uiState.value = AuthUiState.EmailSubmitting(email, AuthUiState.EmailEntry.Mode.SignIn)
            emailAuthJob =
                viewModelScope.launch {
                    when (val result = orchestrator.completeCurrentEmailVerification()) {
                        is AuthResult.Success -> Unit
                        AuthResult.Unavailable ->
                            _uiState.value =
                                AuthUiState.EmailVerificationSent(
                                    email = email,
                                    message = "We still cannot confirm verification. Open the email, then try again.",
                                )
                        AuthResult.Cancelled ->
                            _uiState.value = AuthUiState.EmailVerificationSent(email = email)
                        is AuthResult.Error ->
                            _uiState.value = AuthUiState.Error(messageFor(result), retriesLeft = 0)
                    }
                }
        }

        public fun onResendVerificationEmail(email: String) {
            emailAuthJob?.cancel()
            emailAuthJob =
                viewModelScope.launch {
                    val result = orchestrator.resendCurrentEmailVerification()
                    _uiState.value =
                        AuthUiState.EmailVerificationSent(
                            email = email,
                            message =
                                if (result.isSuccess) {
                                    "Verification email sent again."
                                } else {
                                    "Could not resend the email. Try again in a moment."
                                },
                        )
                }
        }

        public fun onForgotPassword(email: String) {
            val normalizedEmail = email.trim()
            if (normalizedEmail.isBlank()) {
                _uiState.value = AuthUiState.Error("Enter your email first.", retriesLeft = 0)
                return
            }
            emailAuthJob?.cancel()
            emailAuthJob =
                viewModelScope.launch {
                    orchestrator.sendPasswordReset(normalizedEmail).collect { result ->
                        _uiState.value =
                            if (result.isSuccess) {
                                AuthUiState.EmailEntry(
                                    mode = AuthUiState.EmailEntry.Mode.SignIn,
                                    prefillEmail = normalizedEmail,
                                )
                            } else {
                                AuthUiState.Error(
                                    message = "Could not send password reset email.",
                                    retriesLeft = 0,
                                )
                            }
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
            _uiState.value =
                if (currentPhoneNumber.isBlank()) {
                    AuthUiState.MethodSelection
                } else {
                    AuthUiState.OtpEntry(phoneNumber = currentPhoneNumber)
                }
        }

        private fun handleGoogleAuthResult(result: AuthResult) {
            when (result) {
                is AuthResult.Success -> Unit
                AuthResult.Cancelled -> _uiState.value = AuthUiState.MethodSelection
                AuthResult.Unavailable ->
                    _uiState.value =
                        AuthUiState.Error(
                            message = "Google Sign-In is not available on this device. Use email or phone.",
                            retriesLeft = 0,
                        )
                is AuthResult.Error -> _uiState.value = AuthUiState.Error(messageFor(result), retriesLeft = 0)
            }
        }

        private fun handleEmailAuthResult(
            result: AuthResult,
            email: String,
            mode: AuthUiState.EmailEntry.Mode,
        ) {
            when (result) {
                is AuthResult.Success -> {
                    if (mode == AuthUiState.EmailEntry.Mode.SignUp) {
                        _uiState.value =
                            AuthUiState.EmailVerificationSent(
                                email = email,
                                message = "Verification email sent.",
                            )
                    }
                }
                AuthResult.Unavailable ->
                    _uiState.value =
                        AuthUiState.EmailVerificationSent(
                            email = email,
                            message = "Verify your email before continuing.",
                        )
                AuthResult.Cancelled ->
                    _uiState.value = AuthUiState.EmailEntry(mode = mode, prefillEmail = email)
                is AuthResult.Error -> _uiState.value = AuthUiState.Error(messageFor(result), retriesLeft = 0)
            }
        }

        private fun messageFor(error: AuthResult.Error): String =
            when (error) {
                AuthResult.Error.WrongCode -> "Incorrect code"
                AuthResult.Error.RateLimited -> "Too many attempts. Try again later."
                AuthResult.Error.CodeExpired -> "Code expired. Please resend."
                AuthResult.Error.WrongCredential,
                AuthResult.Error.UserNotFound,
                -> "Incorrect email or password."
                AuthResult.Error.EmailAlreadyInUse -> "An account already exists with this email."
                AuthResult.Error.WeakPassword -> "Password is too weak. Please choose a stronger one."
                AuthResult.Error.InvalidEmail -> "The email address is not valid."
                is AuthResult.Error.General -> "Sign-in failed. Please try again."
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
                is AuthResult.Error.WrongCredential ->
                    _uiState.value = AuthUiState.Error("Incorrect email or password.", retriesLeft = 0)
                is AuthResult.Error.UserNotFound ->
                    _uiState.value = AuthUiState.Error("Incorrect email or password.", retriesLeft = 0)
                is AuthResult.Error.EmailAlreadyInUse ->
                    _uiState.value = AuthUiState.Error("An account already exists with this email.", retriesLeft = 0)
                is AuthResult.Error.WeakPassword ->
                    _uiState.value =
                        AuthUiState.Error(
                            "Password is too weak. Please choose a stronger one.",
                            retriesLeft = 0,
                        )
                is AuthResult.Error.InvalidEmail ->
                    _uiState.value = AuthUiState.Error("The email address is not valid.", retriesLeft = 0)
                is AuthResult.Cancelled, is AuthResult.Unavailable ->
                    _uiState.value = AuthUiState.OtpEntry(phoneNumber = currentPhoneNumber)
            }
        }
    }
