package com.homeservices.technician.navigation

import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import androidx.navigation.compose.navigation
import com.homeservices.technician.ui.kyc.KycScreen

internal fun NavGraphBuilder.onboardingGraph(navController: NavController) {
    navigation(startDestination = "kyc", route = "main") {
        composable("kyc") {
            KycScreen(
                onComplete = {
                    navController.navigate("home") {
                        popUpTo("main") { inclusive = true }
                    }
                },
            )
        }
    }
}
