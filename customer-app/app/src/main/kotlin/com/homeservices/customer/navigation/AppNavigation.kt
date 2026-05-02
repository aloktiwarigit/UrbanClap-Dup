package com.homeservices.customer.navigation

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.booking.PriceApprovalEventBus
import com.homeservices.customer.data.rating.RatingPromptEventBus
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.locale.IsFirstLaunchUseCase
import com.homeservices.customer.ui.locale.FirstLaunchLanguageScreen
import com.homeservices.customer.ui.rating.RatingRoutes

public object LocaleRoutes {
    public const val FIRST_LAUNCH: String = "first_launch_language"
    public const val SETTINGS: String = "settings"
    public const val LANGUAGE_SETTINGS: String = "language_settings"
}

@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    priceApprovalEventBus: PriceApprovalEventBus,
    ratingPromptEventBus: RatingPromptEventBus,
    isFirstLaunch: IsFirstLaunchUseCase,
    modifier: Modifier = Modifier,
) {
    val authState by sessionManager.authState.collectAsStateWithLifecycle()

    // Initial value is null (loading) so returning users with first_launch_completed=true
    // never see the picker on cold start. We render a blank Surface until DataStore emits.
    // Per Codex P2: avoid showing onboarding to returning users while the preference loads.
    val firstLaunchPending: Boolean? =
        isFirstLaunch().collectAsStateWithLifecycle(initialValue = null as Boolean?).value

    when (firstLaunchPending) {
        null -> {
            Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {}
        }
        else -> {
            val navController = rememberNavController()
            val startDestination = if (firstLaunchPending) LocaleRoutes.FIRST_LAUNCH else "auth"

            LaunchedEffect(authState, firstLaunchPending) {
                if (firstLaunchPending) return@LaunchedEffect
                val currentAuth = authState
                when (currentAuth) {
                    is AuthState.Authenticated -> {
                        navController.navigate("main") {
                            // Single pop target: by the time this fires, firstLaunchPending is
                            // false (guarded above) and FirstLaunchLanguageScreen.onConfirmed
                            // has already popped first_launch on its way to auth. Stack: [auth].
                            popUpTo("auth") { inclusive = true }
                            launchSingleTop = true
                        }
                        com.google.firebase.messaging.FirebaseMessaging
                            .getInstance()
                            .subscribeToTopic("customer_${currentAuth.uid}")
                    }
                    is AuthState.Unauthenticated -> {
                        com.google.firebase.messaging.FirebaseMessaging
                            .getInstance()
                            .deleteToken()
                        navController.navigate("auth") {
                            // Single pop target: logout from main means stack is [main];
                            // first_launch is never on the stack at this point.
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

            LaunchedEffect(ratingPromptEventBus) {
                ratingPromptEventBus.events.collect { bookingId ->
                    navController.navigate(RatingRoutes.route(bookingId)) { launchSingleTop = true }
                }
            }

            NavHost(
                navController = navController,
                startDestination = startDestination,
                modifier = modifier,
            ) {
                composable(LocaleRoutes.FIRST_LAUNCH) {
                    FirstLaunchLanguageScreen(
                        onConfirmed = {
                            navController.navigate("auth") {
                                popUpTo(LocaleRoutes.FIRST_LAUNCH) { inclusive = true }
                                launchSingleTop = true
                            }
                        },
                    )
                }
                authGraph(navController, activity)
                mainGraph(navController)
                settingsGraph(navController)
            }
        }
    }
}
