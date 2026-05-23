package com.homeservices.technician.navigation

import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavBackStackEntry
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.compose.navigation
import androidx.navigation.navArgument
import com.homeservices.corenav.PendingActionType
import com.homeservices.technician.domain.activeJob.model.NavigationEvent
import com.homeservices.technician.domain.auth.model.AuthState
import com.homeservices.technician.ui.activeJob.ActiveJobScreen
import com.homeservices.technician.ui.activeJob.ActiveJobViewModel
import com.homeservices.technician.ui.complaint.ComplaintRoutes
import com.homeservices.technician.ui.complaint.ComplaintScreen
import com.homeservices.technician.ui.dashboard.TechnicianDashboardViewModel
import com.homeservices.technician.ui.home.TechnicianHomeScreen
import com.homeservices.technician.ui.home.TechnicianHomeViewModel
import com.homeservices.technician.ui.myratings.MyRatingsScreen
import com.homeservices.technician.ui.payoutsettings.PayoutCadenceScreen
import com.homeservices.technician.ui.rating.RatingRoutes
import com.homeservices.technician.ui.rating.RatingScreen
import com.homeservices.technician.ui.serviceprofile.ServiceSelectionMode
import com.homeservices.technician.ui.serviceprofile.ServiceSelectionScreen
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.ui.deleteaccount.AccountDeletedScreen
import com.homeservices.technician.ui.deleteaccount.DeleteAccountScreen
import com.homeservices.technician.ui.settings.LanguageSettingsScreen

private const val HOME_GRAPH_ROUTE = "home"
private const val HOME_DASHBOARD_ROUTE = "home_dashboard"

internal fun NavGraphBuilder.homeGraph(
    navController: NavController,
    authState: AuthState,
    sessionManager: SessionManager,
    onSignOut: () -> Unit,
) {
    navigation(startDestination = HOME_DASHBOARD_ROUTE, route = HOME_GRAPH_ROUTE) {
        composable(HOME_DASHBOARD_ROUTE) { backStackEntry ->
            HomeDashboardRoute(
                navController = navController,
                authState = authState,
                onSignOut = onSignOut,
                backStackEntry = backStackEntry,
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
        composable("language_settings") {
            LanguageSettingsScreen(onBack = { navController.popBackStack() })
        }
        composable("delete_account") {
            DeleteAccountScreen(
                onBack = { navController.popBackStack() },
                onDeleted = { scheduledAt ->
                    navController.navigate("account_deleted/${Uri.encode(scheduledAt)}") {
                        popUpTo(HOME_DASHBOARD_ROUTE) { inclusive = false }
                        launchSingleTop = true
                    }
                },
            )
        }
        composable(
            route = "account_deleted/{scheduledAt}",
            arguments = listOf(navArgument("scheduledAt") { type = NavType.StringType }),
        ) { backStackEntry ->
            val scheduledAt = Uri.decode(
                backStackEntry.arguments?.getString("scheduledAt") ?: "",
            )
            AccountDeletedScreen(
                scheduledAt = scheduledAt,
                sessionManager = sessionManager,
            )
        }
        composable("ratings_transparency") {
            MyRatingsScreen(onBack = { navController.popBackStack() })
        }
        composable(
            route = "activeJob/{bookingId}",
            arguments = listOf(navArgument("bookingId") { type = NavType.StringType }),
        ) {
            ActiveJobRoute(navController = navController)
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

@Composable
private fun HomeDashboardRoute(
    navController: NavController,
    authState: AuthState,
    onSignOut: () -> Unit,
    backStackEntry: NavBackStackEntry,
) {
    val viewModel: TechnicianHomeViewModel = hiltViewModel()
    val dashboardViewModel: TechnicianDashboardViewModel = hiltViewModel()
    val refreshJobs =
        backStackEntry.savedStateHandle
            .getStateFlow("refreshJobs", false)
            .collectAsStateWithLifecycle()
    LaunchedEffect(refreshJobs.value) {
        if (refreshJobs.value) {
            viewModel.refresh()
            backStackEntry.savedStateHandle["refreshJobs"] = false
        }
    }
    LaunchedEffect(Unit) {
        dashboardViewModel.reconcile()
    }
    TechnicianHomeScreen(
        authState = authState,
        onOpenJob = { bookingId -> navController.navigate("activeJob/$bookingId") },
        onViewRatings = { navController.navigate("ratings_transparency") },
        onPayoutSettings = { navController.navigate("payout_settings") },
        onLanguageSettings = { navController.navigate("language_settings") },
        onEditServices = { navController.navigate("edit_services") },
        onDeleteAccount = { navController.navigate("delete_account") },
        onSignOut = onSignOut,
        onPendingActionClick = { action ->
            when (action.type) {
                PendingActionType.JOB_OFFER ->
                    navController.navigate("activeJob/${action.entityId}")
                PendingActionType.RATING_PROMPT_TECHNICIAN ->
                    navController.navigate(RatingRoutes.route(action.entityId))
                PendingActionType.RATING_RECEIVED ->
                    navController.navigate("ratings_transparency")
                PendingActionType.EARNINGS_UPDATE ->
                    navController.navigate("payout_settings")
                else -> Unit
            }
        },
        viewModel = viewModel,
        dashboardViewModel = dashboardViewModel,
    )
}

@Composable
private fun ActiveJobRoute(navController: NavController) {
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
        onBackToDashboard = { navController.returnToDashboard() },
    )
}

private fun NavController.returnToDashboard() {
    runCatching {
        getBackStackEntry(HOME_DASHBOARD_ROUTE).savedStateHandle["refreshJobs"] = true
    }
    if (!popBackStack(HOME_DASHBOARD_ROUTE, inclusive = false)) {
        navigate(HOME_DASHBOARD_ROUTE) {
            popUpTo(HOME_GRAPH_ROUTE) { inclusive = false }
            launchSingleTop = true
        }
    }
}
