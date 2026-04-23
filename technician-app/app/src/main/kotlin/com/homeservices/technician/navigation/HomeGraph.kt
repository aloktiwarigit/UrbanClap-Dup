package com.homeservices.technician.navigation

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.compose.navigation
import androidx.navigation.navArgument
import com.homeservices.technician.domain.activeJob.model.NavigationEvent
import com.homeservices.technician.ui.activeJob.ActiveJobScreen
import com.homeservices.technician.ui.activeJob.ActiveJobViewModel

internal fun NavGraphBuilder.homeGraph(navController: NavController) {
    navigation(startDestination = "home_dashboard", route = "home") {
        composable("home_dashboard") {
            Box(modifier = Modifier.fillMaxSize())
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
            ActiveJobScreen(viewModel = viewModel)
        }
    }
}
