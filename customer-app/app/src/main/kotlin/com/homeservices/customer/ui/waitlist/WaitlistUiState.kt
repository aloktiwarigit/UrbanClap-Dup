package com.homeservices.customer.ui.waitlist

public sealed class WaitlistUiState {
    public data class Form(
        val phone: String,
        val isPhoneValid: Boolean,
    ) : WaitlistUiState()

    public data object Submitting : WaitlistUiState()

    public data object Confirmed : WaitlistUiState()

    public data class Error(
        val reason: String,
        val retryable: Boolean,
    ) : WaitlistUiState()

    public data class RateLimited(
        val retryAfterSec: Int,
    ) : WaitlistUiState()
}
