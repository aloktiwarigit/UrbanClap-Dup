package com.homeservices.customer.navigation

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.booking.PriceApprovalEventBus
import com.homeservices.customer.data.rating.RatingPromptEventBus
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.flags.FeatureFlags
import com.homeservices.customer.domain.locale.IsFirstLaunchUseCase
import com.homeservices.customer.observability.SentryContextBinder
import com.homeservices.customer.ui.locale.FirstLaunchLanguageScreen
import com.homeservices.customer.ui.rating.RatingRoutes

public object LocaleRoutes {
    public const val FIRST_LAUNCH: String = "first_launch_language"
    public const val SETTINGS: String = "settings"
    public const val LANGUAGE_SETTINGS: String = "language_settings"
    public const val PRIVACY_AND_DATA: String = "privacy_and_data"
    public const val DATA_EXPORT: String = "data_export"

    // DELETE_ACCOUNT routes added by E15-S02 (Stream 2.4) — populated by that branch.
    public const val DELETE_ACCOUNT: String = "delete_account"
    public const val DELETE_ACCOUNT_CONFIRM: String = "delete_account_confirm"
    public const val DELETE_ACCOUNT_COOL_OFF: String = "delete_account_cool_off"
}

@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    priceApprovalEventBus: PriceApprovalEventBus,
    ratingPromptEventBus: RatingPromptEventBus,
    isFirstLaunch: IsFirstLaunchUseCase,
    featureFlags: FeatureFlags,
    modifier: Modifier = Modifier,
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
            AppNavigationContent(
                sessionManager = sessionManager,
                activity = activity,
                priceApprovalEventBus = priceApprovalEventBus,
                ratingPromptEventBus = ratingPromptEventBus,
                featureFlags = featureFlags,
                firstLaunchPending = firstLaunchPending,
                authState = authState,
                context = context,
                modifier = modifier,
            )
        }
    }
}

@Composable
private fun AppNavigationContent(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    priceApprovalEventBus: PriceApprovalEventBus,
    ratingPromptEventBus: RatingPromptEventBus,
    featureFlags: FeatureFlags,
    firstLaunchPending: Boolean,
    authState: AuthState,
    context: Context,
    modifier: Modifier,
) {
    val navController = rememberNavController()
    val startDestination = if (firstLaunchPending) LocaleRoutes.FIRST_LAUNCH else "auth"
    val notificationPermissionLauncher =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
            // Android owns notification display once the customer grants or denies this.
        }

    AuthNavigationEffect(
        authState = authState,
        firstLaunchPending = firstLaunchPending,
        context = context,
        notificationPermissionLauncher = notificationPermissionLauncher,
        onNavigateToMain = {
            navController.navigate("main") {
                popUpTo("auth") { inclusive = true }
                launchSingleTop = true
            }
        },
        onNavigateToAuth = {
            navController.navigate("auth") {
                popUpTo("main") { inclusive = true }
                launchSingleTop = true
            }
        },
    )

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

    // E18-S06: Sentry user-context — bind hashed uid on auth-state changes.
    // Runs as a separate effect so it does NOT interfere with navigation logic above.
    // Stream 2.1 (E11-S01b-1) also touches AppNavigation; this block is purely additive
    // and does not change the composable signature.
    LaunchedEffect(sessionManager) {
        SentryContextBinder.bindAuthState(sessionManager.authState)
    }

    // E18-S06: Sentry navigation breadcrumbs — record every route transition.
    // DisposableEffect ensures the listener is removed when the composable leaves
    // composition, preventing a leaked reference to NavController.
    DisposableEffect(navController) {
        var previousRoute: String? = null
        val listener =
            NavController.OnDestinationChangedListener { _, destination, _ ->
                SentryContextBinder.recordNavigationBreadcrumb(
                    from = previousRoute,
                    to = destination.route,
                )
                previousRoute = destination.route
            }
        navController.addOnDestinationChangedListener(listener)
        onDispose { navController.removeOnDestinationChangedListener(listener) }
    }

    NavHost(navController = navController, startDestination = startDestination, modifier = modifier) {
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
        settingsGraph(navController, featureFlags)
    }
}

@Composable
private fun AuthNavigationEffect(
    authState: AuthState,
    firstLaunchPending: Boolean,
    context: Context,
    notificationPermissionLauncher: ActivityResultLauncher<String>,
    onNavigateToMain: () -> Unit,
    onNavigateToAuth: () -> Unit,
) {
    LaunchedEffect(authState, firstLaunchPending) {
        if (firstLaunchPending) return@LaunchedEffect
        when (val currentAuth = authState) {
            is AuthState.Authenticated -> {
                onNavigateToMain()
                com.google.firebase.messaging.FirebaseMessaging
                    .getInstance()
                    .subscribeToTopic("customer_${currentAuth.uid}")
                if (!context.hasNotificationPermission()) {
                    notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
            is AuthState.Unauthenticated -> {
                com.google.firebase.messaging.FirebaseMessaging
                    .getInstance()
                    .deleteToken()
                onNavigateToAuth()
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
