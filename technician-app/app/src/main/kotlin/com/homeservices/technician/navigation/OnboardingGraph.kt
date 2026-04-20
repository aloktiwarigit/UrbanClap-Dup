package com.homeservices.technician.navigation

import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import androidx.navigation.compose.navigation
import com.homeservices.technician.ui.onboarding.OnboardingScreen

internal fun NavGraphBuilder.onboardingGraph() {
    navigation(startDestination = "onboarding_home", route = "main") {
        composable("onboarding_home") { OnboardingScreen() }
    }
}
