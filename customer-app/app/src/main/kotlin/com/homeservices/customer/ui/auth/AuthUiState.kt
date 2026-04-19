package com.homeservices.customer.ui.auth

public sealed class AuthUiState {
    public data object Idle : AuthUiState()

    public data object TruecallerLoading : AuthUiState()

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
