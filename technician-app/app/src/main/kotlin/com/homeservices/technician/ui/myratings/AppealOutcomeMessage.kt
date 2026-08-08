package com.homeservices.technician.ui.myratings

/**
 * Pure mapping from [AppealState] to the Snackbar text to show (or null for no snackbar), kept out of
 * the Composable so it stays unit-testable without Robolectric/Compose — same rationale as
 * ActiveJobScreen's shieldReportSnackbarMessage.
 */
public fun appealOutcomeMessage(
    state: AppealState,
    successMessage: String,
    quotaExceededTemplate: String,
    genericErrorMessage: String,
    formatNextAvailable: (String) -> String,
): String? =
    when (state) {
        is AppealState.Success -> successMessage
        is AppealState.QuotaExceeded ->
            quotaExceededTemplate.format(state.nextAvailableAt?.let(formatNextAvailable) ?: "—")
        is AppealState.Error -> genericErrorMessage
        AppealState.Idle, is AppealState.Loading -> null
    }
