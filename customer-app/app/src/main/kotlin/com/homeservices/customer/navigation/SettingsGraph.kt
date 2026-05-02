package com.homeservices.customer.navigation

import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import com.homeservices.customer.ui.settings.LanguageSettingsScreen
import com.homeservices.customer.ui.settings.SettingsScreen

internal fun NavGraphBuilder.settingsGraph(navController: NavController) {
    composable(LocaleRoutes.SETTINGS) {
        SettingsScreen(
            onLanguageClick = { navController.navigate(LocaleRoutes.LANGUAGE_SETTINGS) },
            onBack = { navController.popBackStack() },
        )
    }
    composable(LocaleRoutes.LANGUAGE_SETTINGS) {
        LanguageSettingsScreen(
            onSaved = { navController.popBackStack() },
        )
    }
}
