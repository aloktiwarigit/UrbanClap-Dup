package com.homeservices.customer.navigation

import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.homeservices.customer.ui.catalogue.ConfidenceScoreRow
import com.homeservices.customer.ui.catalogue.ServiceDetailViewModel
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle

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
        val confidenceScoreState by vm.confidenceScoreState.collectAsStateWithLifecycle()
        ConfidenceScoreRow(uiState = confidenceScoreState)
    }
}
