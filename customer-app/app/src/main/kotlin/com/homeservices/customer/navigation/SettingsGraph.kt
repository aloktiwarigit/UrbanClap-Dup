package com.homeservices.customer.navigation

import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.homeservices.customer.domain.flags.FeatureFlags
import com.homeservices.customer.ui.deleteaccount.DeleteAccountConfirmScreen
import com.homeservices.customer.ui.deleteaccount.DeleteAccountCoolOffScreen
import com.homeservices.customer.ui.deleteaccount.DeleteAccountScreen
import com.homeservices.customer.ui.deleteaccount.DeleteAccountViewModel
import com.homeservices.customer.ui.deleteaccount.EPOCH_MS_EXISTING_REQUEST_SENTINEL
import com.homeservices.customer.ui.deleteaccount.NAV_ARG_REQUEST_ID
import com.homeservices.customer.ui.deleteaccount.NAV_ARG_SCHEDULED_DELETION_EPOCH_MS
import com.homeservices.customer.ui.settings.LanguageSettingsScreen
import com.homeservices.customer.ui.settings.PrivacyDataScreen
import com.homeservices.customer.ui.settings.SettingsScreen
import java.time.Instant

/**
 * Route pattern for the cool-off destination with nav args.
 * Format: delete_account_cool_off/{requestId}/{scheduledDeletionEpochMs}
 */
private fun coolOffRoute(
    requestId: String,
    scheduledDeletionEpochMs: Long,
): String = "${LocaleRoutes.DELETE_ACCOUNT_COOL_OFF}/$requestId/$scheduledDeletionEpochMs"

/** Template with literal placeholders for NavGraphBuilder composable() declaration. */
private const val COOL_OFF_ROUTE_TEMPLATE: String =
    "${LocaleRoutes.DELETE_ACCOUNT_COOL_OFF}/{$NAV_ARG_REQUEST_ID}/{$NAV_ARG_SCHEDULED_DELETION_EPOCH_MS}"

internal fun NavGraphBuilder.settingsGraph(
    navController: NavController,
    featureFlags: FeatureFlags,
) {
    composable(LocaleRoutes.SETTINGS) {
        SettingsScreen(
            onLanguageClick = { navController.navigate(LocaleRoutes.LANGUAGE_SETTINGS) },
            onPrivacyDataClick = { navController.navigate(LocaleRoutes.PRIVACY_DATA) },
            onBack = { navController.popBackStack() },
        )
    }
    composable(LocaleRoutes.LANGUAGE_SETTINGS) {
        LanguageSettingsScreen(
            onSaved = { navController.popBackStack() },
        )
    }
    composable(LocaleRoutes.PRIVACY_DATA) {
        PrivacyDataScreen(
            onBack = { navController.popBackStack() },
            // FIX 3 (P2): Pass null until Stream 2.3 / PR #211 merges and wires the actual route.
            // PrivacyDataScreen hides the row when the callback is null — no no-op tap possible.
            onDownloadData = null,
            onDeleteAccount = { navController.navigate(LocaleRoutes.DELETE_ACCOUNT) },
            showDeleteAccount = featureFlags.dpdpSelfServiceEnabled(),
        )
    }

    deleteAccountGraph(navController)
}

/**
 * Delete-account flow — three screens registered as composable destinations.
 *
 * FIX 2 (P1 — cool-off state preservation):
 * The cool-off screen now receives requestId and scheduledDeletionEpochMs as nav arguments.
 * This replaces the old pattern where the cool-off composable used hiltViewModel(entry) on
 * the DELETE_ACCOUNT back-stack entry (which was destroyed by popInclusive = true, causing
 * the ViewModel to be recreated with blank state on the cool-off screen).
 *
 * FIX 3 (P2 — confirmation back-trap):
 * The DELETE_ACCOUNT_CONFIRM back handler now calls viewModel.onBackFromConfirmation()
 * before popping, resetting the ViewModel state to Idle so the LaunchedEffect in
 * DeleteAccountScreen does not re-navigate to confirmation when the entry screen resurfaces.
 */
private fun NavGraphBuilder.deleteAccountGraph(navController: NavController) {
    composable(LocaleRoutes.DELETE_ACCOUNT) { entry ->
        val vm: DeleteAccountViewModel = hiltViewModel(entry)
        DeleteAccountScreen(
            onBack = { navController.popBackStack() },
            onContinue = {
                navController.navigate(LocaleRoutes.DELETE_ACCOUNT_CONFIRM)
            },
            onNavigateToCoolOff = { requestId, scheduledDeletionAt ->
                // FIX 2 (P2): Use -1L sentinel for the 409 path (empty scheduledDeletionAt)
                // so ViewModel.init emits ExistingRequestDetected instead of CoolOff("", "").
                val epochMs = resolveEpochMs(scheduledDeletionAt)
                navController.navigate(coolOffRoute(requestId, epochMs)) {
                    popUpTo(LocaleRoutes.DELETE_ACCOUNT) { inclusive = true }
                }
            },
            viewModel = vm,
        )
    }
    composable(LocaleRoutes.DELETE_ACCOUNT_CONFIRM) { entry ->
        // Re-use the ViewModel from the DELETE_ACCOUNT entry so state (phrase, pin) is shared.
        val parentEntry = navController.getBackStackEntry(LocaleRoutes.DELETE_ACCOUNT)
        val vm: DeleteAccountViewModel = hiltViewModel(parentEntry)
        DeleteAccountConfirmScreen(
            onBack = {
                // FIX 3: Reset ViewModel state BEFORE popping so DeleteAccountScreen's
                // LaunchedEffect sees Idle (not Confirming) when the entry screen resurfaces.
                vm.onBackFromConfirmation()
                navController.popBackStack()
            },
            onConfirmed = { requestId, scheduledDeletionAt ->
                // FIX 2 (P2): Use -1L sentinel for the 409 path (empty scheduledDeletionAt).
                val epochMs = resolveEpochMs(scheduledDeletionAt)
                navController.navigate(coolOffRoute(requestId, epochMs)) {
                    popUpTo(LocaleRoutes.DELETE_ACCOUNT) { inclusive = true }
                }
            },
            viewModel = vm,
        )
    }
    composable(
        route = COOL_OFF_ROUTE_TEMPLATE,
        arguments =
            listOf(
                navArgument(NAV_ARG_REQUEST_ID) { type = NavType.StringType },
                navArgument(NAV_ARG_SCHEDULED_DELETION_EPOCH_MS) { type = NavType.LongType },
            ),
    ) { entry ->
        // ViewModel is scoped to this entry. State is restored from nav args via SavedStateHandle
        // in DeleteAccountViewModel.init — no dependence on any parent back-stack entry.
        val vm: DeleteAccountViewModel = hiltViewModel(entry)
        DeleteAccountCoolOffScreen(
            onBack = { navController.popBackStack() },
            onRevoked = {
                navController.popBackStack(LocaleRoutes.SETTINGS, inclusive = false)
            },
            viewModel = vm,
        )
    }
}

/**
 * Converts an ISO-8601 [scheduledDeletionAt] string to epoch-milliseconds.
 * Returns [EPOCH_MS_EXISTING_REQUEST_SENTINEL] when the string is empty (409-detected path).
 */
private fun resolveEpochMs(scheduledDeletionAt: String): Long =
    if (scheduledDeletionAt.isNotEmpty()) {
        runCatching { Instant.parse(scheduledDeletionAt).toEpochMilli() }.getOrDefault(0L)
    } else {
        EPOCH_MS_EXISTING_REQUEST_SENTINEL
    }
