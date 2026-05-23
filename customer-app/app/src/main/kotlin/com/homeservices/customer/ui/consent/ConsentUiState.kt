package com.homeservices.customer.ui.consent

public data class ConsentUiState(
    val analyticsOptIn: Boolean = true,
    val crashOptIn: Boolean = true,
    val marketingOptIn: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null,
)
