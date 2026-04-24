package com.homeservices.customer.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.rememberNavController
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.booking.PriceApprovalEventBus
import com.homeservices.customer.domain.auth.model.AuthState

@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    priceApprovalEventBus: PriceApprovalEventBus,
    modifier: Modifier = Modifier,
) {
    val navController = rememberNavController()
    val authState by sessionManager.authState.collectAsStateWithLifecycle()

    LaunchedEffect(authState) {
        val currentAuth = authState
        when (currentAuth) {
            is AuthState.Authenticated -> {
                navController.navigate("main") {
                    popUpTo("auth") { inclusive = true }
                    launchSingleTop = true
                }
                com.google.firebase.messaging.FirebaseMessaging
                    .getInstance()
                    .subscribeToTopic("customer_${currentAuth.uid}")
            }
            is AuthState.Unauthenticated -> {
                // Unsubscribe from all customer topics before navigating to auth.
                // We can't know the previous uid here, so we rely on the fact that
                // Unauthenticated state is only reached after the auth flow clears the session.
                // The safest approach: delete the FCM token so no topics persist.
                com.google.firebase.messaging.FirebaseMessaging
                    .getInstance()
                    .deleteToken()
                navController.navigate("auth") {
                    popUpTo("main") { inclusive = true }
                    launchSingleTop = true
                }
            }
        }
    }

    LaunchedEffect(priceApprovalEventBus) {
        priceApprovalEventBus.events.collect { bookingId ->
            navController.navigate(BookingRoutes.priceApprovalRoute(bookingId)) {
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
        mainGraph(navController)
    }
}
