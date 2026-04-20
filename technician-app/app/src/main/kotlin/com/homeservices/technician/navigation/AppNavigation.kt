package com.homeservices.technician.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.rememberNavController
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.domain.auth.model.AuthState

@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    modifier: Modifier = Modifier,
) {
    val navController = rememberNavController()
    val authState by sessionManager.authState.collectAsStateWithLifecycle()

    LaunchedEffect(authState) {
        when (authState) {
            is AuthState.Authenticated ->
                navController.navigate("main") {
                    popUpTo("auth") { inclusive = true }
                    launchSingleTop = true
                }
            is AuthState.Unauthenticated ->
                navController.navigate("auth") {
                    popUpTo("main") { inclusive = true }
                    launchSingleTop = true
                }
        }
    }

    NavHost(
        navController = navController,
        startDestination = "auth",
        modifier = modifier,
    ) {
        authGraph(navController, activity)
        onboardingGraph(navController)
    }
}
