package com.homeservices.customer.ui.auth

public sealed class AuthUiState {
    public data object Idle : AuthUiState()

    public data object TruecallerLoading : AuthUiState()

    public data object MethodSelection : AuthUiState()

    public data object GoogleSigningIn : AuthUiState()

    public data class EmailEntry(
        val mode: Mode = Mode.SignIn,
        val prefillEmail: String = "",
    ) : AuthUiState() {
        public enum class Mode {
            SignIn,
            SignUp,
        }
    }

    public data class EmailSubmitting(
        val email: String,
        val mode: EmailEntry.Mode,
    ) : AuthUiState()

    public data class EmailVerificationSent(
        val email: String,
        val message: String? = null,
    ) : AuthUiState()

    public data class OtpEntry(
        val phoneNumber: String = "",
        val verificationId: String? = null,
    ) : AuthUiState()

    public data object OtpSending : AuthUiState()

    public data object OtpVerifying : AuthUiState()

    public data class Error(
        val message: String,
        val retriesLeft: Int,
    ) : AuthUiState()
}
