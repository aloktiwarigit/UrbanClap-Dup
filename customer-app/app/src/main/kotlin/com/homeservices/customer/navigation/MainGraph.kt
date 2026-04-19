package com.homeservices.customer.navigation

import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import androidx.navigation.navigation
import com.homeservices.customer.ui.home.HomeScreen

internal fun NavGraphBuilder.mainGraph() {
    navigation(startDestination = "home", route = "main") {
        composable("home") {
            HomeScreen()
        }
    }
}
