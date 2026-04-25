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
import com.google.firebase.messaging.FirebaseMessaging
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.data.rating.RatingPromptEventBus
import com.homeservices.technician.domain.auth.model.AuthState
import com.homeservices.technician.ui.jobOffer.JobOfferScreen
import com.homeservices.technician.ui.jobOffer.JobOfferUiState
import com.homeservices.technician.ui.jobOffer.JobOfferViewModel

@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    ratingPromptEventBus: RatingPromptEventBus,
    modifier: Modifier = Modifier,
): Unit {
    val navController = rememberNavController()
    val authState by sessionManager.authState.collectAsStateWithLifecycle()
    val jobOfferViewModel: JobOfferViewModel = hiltViewModel()
    val jobOfferState by jobOfferViewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(authState) {
        val current = authState
        when (current) {
            is AuthState.Authenticated -> {
                navController.navigate("main") {
                    popUpTo("auth") { inclusive = true }
                    launchSingleTop = true
                }
                FirebaseMessaging.getInstance().subscribeToTopic("technician_${current.uid}")
            }
            is AuthState.Unauthenticated ->
                navController.navigate("auth") {
                    popUpTo("main") { inclusive = true }
                    launchSingleTop = true
                }
        }
    }

    LaunchedEffect(jobOfferState) {
        if (jobOfferState is JobOfferUiState.Accepted) {
            val bookingId = (jobOfferState as JobOfferUiState.Accepted).bookingId
            navController.navigate("activeJob/$bookingId") {
                launchSingleTop = true
            }
        }
    }

    LaunchedEffect(ratingPromptEventBus) {
        ratingPromptEventBus.events.collect { bookingId ->
            navController.navigate("rating/$bookingId") {
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
            homeGraph(navController)
        }
        if (jobOfferState !is JobOfferUiState.Idle && jobOfferState !is JobOfferUiState.Accepted) {
            JobOfferScreen(
                modifier = Modifier.fillMaxSize(),
                viewModel = jobOfferViewModel,
            )
        }
    }
}
