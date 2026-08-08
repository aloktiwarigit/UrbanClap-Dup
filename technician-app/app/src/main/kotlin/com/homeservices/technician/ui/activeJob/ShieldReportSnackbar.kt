package com.homeservices.technician.ui.activeJob

/**
 * Pure mapping from [ActiveJobUiState.Active]'s shield-report result flags to the Snackbar text to
 * show, kept out of the Composable so it stays unit-testable without Robolectric/Compose (S-33's
 * PendingActionCard/remainingSeconds extraction is the precedent — see docs/patterns for why
 * LaunchedEffect-only logic risks the Kover floor).
 */
public fun shieldReportSnackbarMessage(
    success: Boolean,
    error: String?,
    successMessage: String,
    genericErrorMessage: String,
): String? =
    when {
        success -> successMessage
        error != null -> genericErrorMessage
        else -> null
    }
