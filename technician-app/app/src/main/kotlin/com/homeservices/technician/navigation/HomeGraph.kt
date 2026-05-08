package com.homeservices.technician.navigation

import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.compose.navigation
import androidx.navigation.navArgument
import com.homeservices.technician.domain.activeJob.model.NavigationEvent
import com.homeservices.technician.domain.auth.model.AuthState
import com.homeservices.technician.ui.activeJob.ActiveJobScreen
import com.homeservices.technician.ui.activeJob.ActiveJobViewModel
import com.homeservices.technician.ui.complaint.ComplaintRoutes
import com.homeservices.technician.ui.complaint.ComplaintScreen
import com.homeservices.technician.ui.home.TechnicianHomeScreen
import com.homeservices.technician.ui.home.TechnicianHomeViewModel
import com.homeservices.technician.ui.myratings.MyRatingsScreen
import com.homeservices.technician.ui.payoutsettings.PayoutCadenceScreen
import com.homeservices.technician.ui.rating.RatingRoutes
import com.homeservices.technician.ui.rating.RatingScreen
import com.homeservices.technician.ui.serviceprofile.ServiceSelectionMode
import com.homeservices.technician.ui.serviceprofile.ServiceSelectionScreen

internal fun NavGraphBuilder.homeGraph(
    navController: NavController,
    authState: AuthState,
    onSignOut: () -> Unit,
) {
    navigation(startDestination = "home_dashboard", route = "home") {
        composable("home_dashboard") { backStackEntry ->
            val viewModel: TechnicianHomeViewModel = hiltViewModel()
            val refreshJobs = backStackEntry.savedStateHandle
                .getStateFlow("refreshJobs", false)
                .collectAsStateWithLifecycle()
            LaunchedEffect(refreshJobs.value) {
                if (refreshJobs.value) {
                    viewModel.refresh()
                    backStackEntry.savedStateHandle["refreshJobs"] = false
                }
            }
            TechnicianHomeScreen(
                authState = authState,
                onOpenJob = { bookingId -> navController.navigate("activeJob/$bookingId") },
                onViewRatings = { navController.navigate("ratings_transparency") },
                onPayoutSettings = { navController.navigate("payout_settings") },
                onEditServices = { navController.navigate("edit_services") },
                onSignOut = onSignOut,
                viewModel = viewModel,
            )
        }
        composable("edit_services") {
            ServiceSelectionScreen(
                onComplete = { navController.popBackStack() },
                mode = ServiceSelectionMode.Edit,
            )
        }
        composable("payout_settings") {
            PayoutCadenceScreen(onBack = { navController.popBackStack() })
        }
        composable("ratings_transparency") {
            MyRatingsScreen(onBack = { navController.popBackStack() })
        }
        composable(
            route = "activeJob/{bookingId}",
            arguments = listOf(navArgument("bookingId") { type = NavType.StringType }),
        ) {
            val viewModel: ActiveJobViewModel = hiltViewModel()
            val context = LocalContext.current
            LaunchedEffect(Unit) {
                viewModel.navigationEvents.collect { event ->
                    if (event is NavigationEvent.Maps) {
                        context.startActivity(
                            Intent(Intent.ACTION_VIEW, Uri.parse(event.uri)).apply {
                                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            },
                        )
                    }
                }
            }
            ActiveJobScreen(
                viewModel = viewModel,
                onBackToDashboard = {
                    runCatching {
                        navController.getBackStackEntry("home_dashboard").savedStateHandle["refreshJobs"] = true
                    }
                    if (!navController.popBackStack("home_dashboard", inclusive = false)) {
                        navController.navigate("home_dashboard") {
                            popUpTo("home") { inclusive = false }
                            launchSingleTop = true
                        }
                    }
                },
            )
        }
        composable(
            route = RatingRoutes.ROUTE,
            arguments = listOf(navArgument("bookingId") { type = NavType.StringType }),
        ) {
            RatingScreen(
                onFileComplaint = { id -> navController.navigate(ComplaintRoutes.route(id)) },
            )
        }
        composable(
            route = ComplaintRoutes.ROUTE,
            arguments = listOf(navArgument("bookingId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val bookingId = backStackEntry.arguments?.getString("bookingId") ?: ""
            ComplaintScreen(bookingId = bookingId, onBack = { navController.popBackStack() })
        }
    }
}
