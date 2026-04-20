package com.homeservices.customer.navigation

import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import androidx.navigation.navigation
import com.homeservices.customer.ui.catalogue.CatalogueHomeScreen
import com.homeservices.customer.ui.catalogue.CatalogueHomeViewModel
import com.homeservices.customer.ui.catalogue.ServiceDetailScreen
import com.homeservices.customer.ui.catalogue.ServiceDetailViewModel
import com.homeservices.customer.ui.catalogue.ServiceListScreen
import com.homeservices.customer.ui.catalogue.ServiceListViewModel

internal fun NavGraphBuilder.mainGraph(navController: NavController) {
    navigation(startDestination = CatalogueRoutes.HOME, route = "main") {
        composable(CatalogueRoutes.HOME) {
            val vm: CatalogueHomeViewModel = hiltViewModel()
            CatalogueHomeScreen(
                viewModel = vm,
                onCategoryClick = { id -> navController.navigate(CatalogueRoutes.serviceList(id)) },
            )
        }
        composable(
            route = CatalogueRoutes.SERVICE_LIST,
            arguments = listOf(navArgument("categoryId") { type = NavType.StringType }),
        ) {
            val vm: ServiceListViewModel = hiltViewModel()
            ServiceListScreen(
                viewModel = vm,
                onServiceClick = { id -> navController.navigate(CatalogueRoutes.serviceDetail(id)) },
                onBack = { navController.popBackStack() },
            )
        }
        composable(
            route = CatalogueRoutes.SERVICE_DETAIL,
            arguments = listOf(navArgument("serviceId") { type = NavType.StringType }),
        ) {
            val vm: ServiceDetailViewModel = hiltViewModel()
            ServiceDetailScreen(
                viewModel = vm,
                onBookNow = { /* E03-S03 */ },
                onBack = { navController.popBackStack() },
            )
        }
    }
}
