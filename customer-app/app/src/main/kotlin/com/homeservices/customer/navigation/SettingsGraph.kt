package com.homeservices.customer.navigation

import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import com.homeservices.customer.domain.flags.FeatureFlags
import com.homeservices.customer.ui.dataexport.DataExportScreen
import com.homeservices.customer.ui.settings.LanguageSettingsScreen
import com.homeservices.customer.ui.settings.PrivacyAndDataScreen
import com.homeservices.customer.ui.settings.SettingsScreen

/**
 * Settings sub-graph.
 *
 * [featureFlags] is accepted here so the signature is stable when E15-S02
 * (delete-account / Stream 2.4) adds feature-flag gating for the delete-account
 * route. Whichever PR merges first wins the scaffold; the other rebases.
 */
@Suppress("UNUSED_PARAMETER")
internal fun NavGraphBuilder.settingsGraph(
    navController: NavController,
    featureFlags: FeatureFlags,
) {
    composable(LocaleRoutes.SETTINGS) {
        SettingsScreen(
            onLanguageClick = { navController.navigate(LocaleRoutes.LANGUAGE_SETTINGS) },
            onPrivacyDataClick = { navController.navigate(LocaleRoutes.PRIVACY_AND_DATA) },
            onBack = { navController.popBackStack() },
        )
    }
    composable(LocaleRoutes.LANGUAGE_SETTINGS) {
        LanguageSettingsScreen(
            onSaved = { navController.popBackStack() },
        )
    }
    composable(LocaleRoutes.PRIVACY_AND_DATA) {
        PrivacyAndDataScreen(
            onDownloadDataClick = { navController.navigate(LocaleRoutes.DATA_EXPORT) },
            // TODO(E15-S02 / Stream 2.4): replace stub with delete-account route
            onDeleteAccountClick = { /* stub — wired by E15-S02 */ },
            onBack = { navController.popBackStack() },
        )
    }
    composable(LocaleRoutes.DATA_EXPORT) {
        DataExportScreen(
            onBack = { navController.popBackStack() },
        )
    }
}
