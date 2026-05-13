package com.homeservices.customer.navigation

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
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
import com.homeservices.corenav.DeepLinkUri

public object LocaleRoutes {
    public const val FIRST_LAUNCH: String = "first_launch_language"
    public const val SETTINGS: String = "settings"
    public const val LANGUAGE_SETTINGS: String = "language_settings"
}

/**
 * Root navigation composable for the customer-app.
 *
 * E11-S01b-1 additive parameters:
 *   - [routeResolver]: used by future deep-link handling; currently wired but not yet
 *     consumed in the composable body (full consumption in E11-S01b-2 route migration).
 *   - [initialDeepLink]: `homeservices://action/<TYPE>?entityId=<id>` URI extracted from
 *     the launching Intent by [MainActivity]. Consumed on first composition to navigate
 *     to the action's destination after auth check.
 *
 * Stream 2.6 (Sentry breadcrumbs) note: signature extended with named parameters with
 * defaults — existing call sites compile unchanged.
 */
@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    priceApprovalEventBus: PriceApprovalEventBus,
    ratingPromptEventBus: RatingPromptEventBus,
    isFirstLaunch: IsFirstLaunchUseCase,
    modifier: Modifier = Modifier,
    routeResolver: CustomerRouteResolver? = null,
    initialDeepLink: String? = null,
) {
    val context = LocalContext.current
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
            val notificationPermissionLauncher =
                rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
                    // Android owns notification display once the customer grants or denies this.
                }

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
                        if (!context.hasNotificationPermission()) {
                            notificationPermissionLauncher.launch(
                                Manifest.permission.POST_NOTIFICATIONS,
                            )
                        }
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

            // Cold-start deep-link: homeservices://action/<TYPE>?entityId=<id>
            // Navigate to the action route only when authenticated and firstLaunch is done.
            if (initialDeepLink != null && !firstLaunchPending) {
                LaunchedEffect(initialDeepLink, authState) {
                    val currentAuth = authState
                    if (currentAuth is AuthState.Authenticated) {
                        val intent = DeepLinkUri.parse(initialDeepLink)
                        if (intent != null) {
                            val route = routeResolver?.routeFor(intent)
                            if (route != null) {
                                when (route) {
                                    com.homeservices.customer.navigation.CustomerRouteSpec.BookingPriceApproval ->
                                        navController.navigate(
                                            BookingRoutes.priceApprovalRoute(intent.entityId),
                                        ) { launchSingleTop = true }
                                    com.homeservices.customer.navigation.CustomerRouteSpec.Rating ->
                                        navController.navigate(
                                            RatingRoutes.route(intent.entityId),
                                        ) { launchSingleTop = true }
                                    else -> Unit // home is the default; no explicit nav needed
                                }
                            }
                        }
                    }
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

private fun Context.hasNotificationPermission(): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
        ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
