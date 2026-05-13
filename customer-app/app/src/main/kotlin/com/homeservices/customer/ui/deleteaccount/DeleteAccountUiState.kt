package com.homeservices.customer.ui.deleteaccount

/**
 * Complete state machine for the delete-account / DPDP erasure flow.
 *
 * Transitions (happy path):
 *   Idle → Validating → Submitting → CoolOff → Revoking → Revoked
 *
 * Error transitions:
 *   Submitting → Error
 *   Revoking   → Error
 *   Idle       → CoolOff  (when an active request already exists on entry)
 */
public sealed interface DeleteAccountUiState {
    /** Initial state before any user action. Entry screen shown. */
    public data object Idle : DeleteAccountUiState

    /**
     * User has tapped Continue on the entry screen and is on the confirmation screen.
     * No network call in flight yet.
     *
     * @param typedPhrase Current value of the confirmation phrase text field.
     * @param typedPin Current value of the PIN / last4 text field.
     * @param phraseExpected The locale-appropriate confirmation phrase the user must match.
     * @param last4Expected The last 4 digits of the user's registered phone number.
     */
    public data class Confirming(
        val typedPhrase: String = "",
        val typedPin: String = "",
        val phraseExpected: String,
        val last4Expected: String,
    ) : DeleteAccountUiState {
        /** True when both the phrase and PIN match — enables the Submit button. */
        val isSubmitEnabled: Boolean
            get() = typedPhrase == phraseExpected && typedPin == last4Expected
    }

    /** Network call in flight (POST erasure-request). */
    public data object Submitting : DeleteAccountUiState

    /**
     * Erasure request accepted or already existed; cool-off period running.
     *
     * @param requestId Server-assigned erasure id (used for the revoke call).
     * @param scheduledDeletionAt ISO-8601 string; may be empty if recovered via 409 probe.
     */
    public data class CoolOff(
        val requestId: String,
        val scheduledDeletionAt: String,
    ) : DeleteAccountUiState

    /** Revoke call in flight (DELETE erasure-request). */
    public data object Revoking : DeleteAccountUiState

    /** Revoke succeeded; user's account deletion was cancelled. */
    public data object Revoked : DeleteAccountUiState

    /**
     * A network or validation error occurred.
     *
     * @param message Localised or raw message for display.
     * @param previousState The state before the error, so the UI can offer a retry.
     */
    public data class Error(
        val message: String,
        val previousState: DeleteAccountUiState = Idle,
    ) : DeleteAccountUiState
}
