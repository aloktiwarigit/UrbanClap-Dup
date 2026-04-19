package com.homeservices.customer.ui.auth

internal sealed class AuthUiState {
    data object Idle : AuthUiState()
    data object TruecallerLoading : AuthUiState()
    data class OtpEntry(
        val phoneNumber: String = "",
        val verificationId: String? = null,
    ) : AuthUiState()
    data object OtpSending : AuthUiState()
    data object OtpVerifying : AuthUiState()
    data class Error(
        val message: String,
        val retriesLeft: Int,
    ) : AuthUiState()
}
