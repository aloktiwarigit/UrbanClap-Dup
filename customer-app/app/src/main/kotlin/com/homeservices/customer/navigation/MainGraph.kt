package com.homeservices.customer.navigation

import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.homeservices.customer.ui.catalogue.ServiceDetailScreen
import com.homeservices.customer.ui.catalogue.ServiceDetailViewModel

internal fun NavGraphBuilder.mainGraph(navController: NavController) {
    composable(
        route = CatalogueRoutes.SERVICE_DETAIL,
        arguments = listOf(
            navArgument("serviceId") { type = NavType.StringType },
            navArgument("techId") {
                type = NavType.StringType
                nullable = true
                defaultValue = null
            },
        ),
    ) {
        val vm: ServiceDetailViewModel = hiltViewModel()
        ServiceDetailScreen(
            viewModel = vm,
            onBack = { navController.popBackStack() },
        )
    }
}
