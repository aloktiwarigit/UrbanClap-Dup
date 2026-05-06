package com.homeservices.technician.navigation

import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import androidx.navigation.compose.navigation
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.ui.kyc.KycScreen
import com.homeservices.technician.ui.serviceprofile.ServiceSelectionScreen
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

internal fun NavGraphBuilder.onboardingGraph(
    navController: NavController,
    sessionManager: SessionManager,
    scope: CoroutineScope,
) {
    navigation(startDestination = "kyc", route = "main") {
        composable("kyc") {
            KycScreen(
                onComplete = {
                    navController.navigate("service_selection")
                },
            )
        }
        composable("service_selection") {
            ServiceSelectionScreen(
                onComplete = {
                    scope.launch {
                        sessionManager.setOnboardingComplete()
                        navController.navigate("home") {
                            popUpTo("main") { inclusive = true }
                        }
                    }
                },
                autoCompleteExistingProfile = true,
            )
        }
    }
}
