package com.homeservices.technician.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.fragment.app.FragmentActivity
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.rememberNavController
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.domain.auth.model.AuthState
import com.homeservices.technician.ui.jobOffer.JobOfferScreen
import com.homeservices.technician.ui.jobOffer.JobOfferUiState
import com.homeservices.technician.ui.jobOffer.JobOfferViewModel

@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    modifier: Modifier = Modifier,
): Unit {
    val navController = rememberNavController()
    val authState by sessionManager.authState.collectAsStateWithLifecycle()
    val jobOfferViewModel: JobOfferViewModel = hiltViewModel()
    val jobOfferState by jobOfferViewModel.uiState.collectAsStateWithLifecycle()

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

    Box(modifier = modifier) {
        NavHost(
            navController = navController,
            startDestination = "auth",
        ) {
            authGraph(navController, activity)
            onboardingGraph(navController)
        }
        if (jobOfferState !is JobOfferUiState.Idle) {
            JobOfferScreen(
                modifier = Modifier.fillMaxSize(),
                viewModel = jobOfferViewModel,
            )
        }
    }
}
