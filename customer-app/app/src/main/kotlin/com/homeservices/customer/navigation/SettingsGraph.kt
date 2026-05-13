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
 * [featureFlags] gates the "Delete account" row in PrivacyAndDataScreen.
 * When [FeatureFlags.dpdpSelfServiceEnabled] is false (the default) the row is
 * hidden so users never see an unwired stub.  E15-S02 (Stream 2.4) wires the
 * actual delete-account navigation; this gating stays even after that PR merges
 * until the flag is flipped ON for Play Store submission.
 */
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
            // Pass a non-null lambda only when the DPDP self-service flag is ON.
            // Null → PrivacyAndDataScreen hides the row entirely (no visible stub).
            // TODO(E15-S02 / Stream 2.4): replace the lambda body with the real route.
            onDeleteAccountClick =
                if (featureFlags.dpdpSelfServiceEnabled()) {
                    { /* TODO E15-S02 wires delete-account route */ }
                } else {
                    null
                },
            onBack = { navController.popBackStack() },
        )
    }
    composable(LocaleRoutes.DATA_EXPORT) {
        DataExportScreen(
            onBack = { navController.popBackStack() },
        )
    }
}
