package com.homeservices.customer.navigation

import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import com.homeservices.customer.domain.flags.FeatureFlags
import com.homeservices.customer.ui.deleteaccount.DeleteAccountConfirmScreen
import com.homeservices.customer.ui.deleteaccount.DeleteAccountCoolOffScreen
import com.homeservices.customer.ui.deleteaccount.DeleteAccountScreen
import com.homeservices.customer.ui.deleteaccount.DeleteAccountViewModel
import com.homeservices.customer.ui.settings.LanguageSettingsScreen
import com.homeservices.customer.ui.settings.PrivacyDataScreen
import com.homeservices.customer.ui.settings.SettingsScreen

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
            onDownloadData = { /* Stream 2.3 — placeholder until PR merges */ },
            onDeleteAccount = { navController.navigate(LocaleRoutes.DELETE_ACCOUNT) },
            showDeleteAccount = featureFlags.dpdpSelfServiceEnabled(),
        )
    }

    // The three delete-account screens share a single ViewModel scoped to the
    // delete_account composable graph entry (hiltViewModel() with no parent override).
    // Because they are sibling composables in the back stack — not a nested graph —
    // we pass the ViewModel via hiltViewModel() at each composable but use the
    // entry's back stack scope for shared state. This pattern mirrors how
    // BookingViewModel is shared across the booking nested graph.

    composable(LocaleRoutes.DELETE_ACCOUNT) { entry ->
        val vm: DeleteAccountViewModel = hiltViewModel(entry)
        DeleteAccountScreen(
            onBack = { navController.popBackStack() },
            onContinue = {
                navController.navigate(LocaleRoutes.DELETE_ACCOUNT_CONFIRM)
            },
            onNavigateToCoolOff = {
                navController.navigate(LocaleRoutes.DELETE_ACCOUNT_COOL_OFF) {
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
            onBack = { navController.popBackStack() },
            onConfirmed = {
                navController.navigate(LocaleRoutes.DELETE_ACCOUNT_COOL_OFF) {
                    popUpTo(LocaleRoutes.DELETE_ACCOUNT) { inclusive = true }
                }
            },
            viewModel = vm,
        )
    }
    composable(LocaleRoutes.DELETE_ACCOUNT_COOL_OFF) { entry ->
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
