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
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import androidx.navigation.NavHostController
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
    public const val PRIVACY_DATA: String = "privacy_data"
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
            AppNavigationHost(
                sessionManager = sessionManager,
                activity = activity,
                priceApprovalEventBus = priceApprovalEventBus,
                ratingPromptEventBus = ratingPromptEventBus,
                featureFlags = featureFlags,
                authState = authState,
                firstLaunchPending = firstLaunchPending,
                modifier = modifier,
            )
        }
    }
}

@Composable
private fun AppNavigationHost(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    priceApprovalEventBus: PriceApprovalEventBus,
    ratingPromptEventBus: RatingPromptEventBus,
    featureFlags: FeatureFlags,
    authState: AuthState,
    firstLaunchPending: Boolean,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val navController = rememberNavController()
    val startDestination = if (firstLaunchPending) LocaleRoutes.FIRST_LAUNCH else "auth"
    val notificationPermissionLauncher =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}

    AuthStateEffect(
        navController = navController,
        authState = authState,
        firstLaunchPending = firstLaunchPending,
        context = context,
        requestNotificationPermission = {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
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

    SentryObservers(sessionManager = sessionManager, navController = navController)

    AppNavHost(
        navController = navController,
        startDestination = startDestination,
        activity = activity,
        featureFlags = featureFlags,
        modifier = modifier,
    )
}

/** Handles auth-state driven navigation and notification permission. */
@Composable
private fun AuthStateEffect(
    navController: NavController,
    authState: AuthState,
    firstLaunchPending: Boolean,
    context: Context,
    requestNotificationPermission: () -> Unit,
) {
    LaunchedEffect(authState, firstLaunchPending) {
        if (firstLaunchPending) return@LaunchedEffect
        when (val currentAuth = authState) {
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
                    requestNotificationPermission()
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
}

/** E18-S06: Sentry user-context binding and navigation breadcrumb recording. */
@Composable
private fun SentryObservers(
    sessionManager: SessionManager,
    navController: NavController,
) {
    LaunchedEffect(sessionManager) {
        SentryContextBinder.bindAuthState(sessionManager.authState)
    }

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
}

/** Hosts the [NavHost] with all top-level graph registrations. */
@Composable
private fun AppNavHost(
    navController: NavHostController,
    startDestination: String,
    activity: FragmentActivity,
    featureFlags: FeatureFlags,
    modifier: Modifier = Modifier,
) {
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

private fun Context.hasNotificationPermission(): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
        ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
