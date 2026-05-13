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
import com.homeservices.corenav.DeepLinkUri
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
    featureFlags: FeatureFlags,
    modifier: Modifier = Modifier,
    routeResolver: CustomerRouteResolver? = null,
    initialDeepLink: String? = null,
) {
    // Initial value is null (loading) so returning users with first_launch_completed=true
    // never see the picker on cold start. We render a blank Surface until DataStore emits.
    // Per Codex P2: avoid showing onboarding to returning users while the preference loads.
    val firstLaunchPending: Boolean? =
        isFirstLaunch().collectAsStateWithLifecycle(initialValue = null as Boolean?).value

    when (firstLaunchPending) {
        null -> Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {}
        else ->
            AppNavigationReady(
                sessionManager = sessionManager,
                activity = activity,
                priceApprovalEventBus = priceApprovalEventBus,
                ratingPromptEventBus = ratingPromptEventBus,
                firstLaunchPending = firstLaunchPending,
                modifier = modifier,
                routeResolver = routeResolver,
                initialDeepLink = initialDeepLink,
            )
    }
}

/**
 * Inner composable rendered once [firstLaunchPending] has emitted a non-null value.
 *
 * Extracted from [AppNavigation] to satisfy detekt LongMethod and CyclomaticComplexMethod
 * limits — the outer function handles the loading gate only; all navigation wiring lives here.
 */
@Composable
private fun AppNavigationReady(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    priceApprovalEventBus: PriceApprovalEventBus,
    ratingPromptEventBus: RatingPromptEventBus,
    firstLaunchPending: Boolean,
    modifier: Modifier,
    routeResolver: CustomerRouteResolver?,
    initialDeepLink: String?,
) {
    val context = LocalContext.current
    val authState by sessionManager.authState.collectAsStateWithLifecycle()
    val navController = rememberNavController()
    val startDestination = if (firstLaunchPending) LocaleRoutes.FIRST_LAUNCH else "auth"
    val notificationPermissionLauncher =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}

    AuthStateEffect(
        authState = authState,
        firstLaunchPending = firstLaunchPending,
        context = context,
        navController = navController,
        notificationPermissionLauncher = notificationPermissionLauncher,
    )
    EventBusEffects(
        priceApprovalEventBus = priceApprovalEventBus,
        ratingPromptEventBus = ratingPromptEventBus,
        navController = navController,
    )
    SentryEffects(sessionManager = sessionManager, navController = navController)
    if (initialDeepLink != null && !firstLaunchPending) {
        DeepLinkEffect(
            initialDeepLink = initialDeepLink,
            authState = authState,
            routeResolver = routeResolver,
            navController = navController,
        )
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
        settingsGraph(navController)
    }
}

/**
 * Reacts to [authState] changes: navigates to main/auth, subscribes/unsubscribes FCM topic,
 * and requests notification permission on first sign-in.
 */
@Composable
private fun AuthStateEffect(
    authState: AuthState,
    firstLaunchPending: Boolean,
    context: Context,
    navController: NavController,
    notificationPermissionLauncher: ActivityResultLauncher<String>,
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
                    notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
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

/**
 * Collects price-approval and rating-prompt event buses and navigates to their routes.
 */
@Composable
private fun EventBusEffects(
    priceApprovalEventBus: PriceApprovalEventBus,
    ratingPromptEventBus: RatingPromptEventBus,
    navController: NavController,
) {
    LaunchedEffect(priceApprovalEventBus) {
        priceApprovalEventBus.events.collect { bookingId ->
            navController.navigate(BookingRoutes.priceApprovalRoute(bookingId)) { launchSingleTop = true }
        }
    }
    LaunchedEffect(ratingPromptEventBus) {
        ratingPromptEventBus.events.collect { bookingId ->
            navController.navigate(RatingRoutes.route(bookingId)) { launchSingleTop = true }
        }
    }
}

/**
 * E18-S06: Binds the Sentry user context and records navigation breadcrumbs.
 * Separate from auth navigation so the two concerns do not interfere.
 */
@Composable
private fun SentryEffects(
    sessionManager: SessionManager,
    navController: NavController,
) {
    LaunchedEffect(sessionManager) {
        SentryContextBinder.bindAuthState(sessionManager.authState)
    }
    DisposableEffect(navController) {
        var previousRoute: String? = null
        val listener =
            NavController.OnDestinationChangedListener { _, destination, _ ->
                SentryContextBinder.recordNavigationBreadcrumb(from = previousRoute, to = destination.route)
                previousRoute = destination.route
            }
        navController.addOnDestinationChangedListener(listener)
        onDispose { navController.removeOnDestinationChangedListener(listener) }
    }
}

/**
 * E11-S01b-1: Cold-start deep-link routing for `homeservices://action/<TYPE>?entityId=<id>`.
 * Navigates to the resolved route once the user is authenticated and firstLaunch is done.
 */
@Composable
private fun DeepLinkEffect(
    initialDeepLink: String,
    authState: AuthState,
    routeResolver: CustomerRouteResolver?,
    navController: NavController,
) {
    LaunchedEffect(initialDeepLink, authState) {
        val currentAuth = authState
        if (currentAuth !is AuthState.Authenticated) return@LaunchedEffect
        val intent = DeepLinkUri.parse(initialDeepLink) ?: return@LaunchedEffect
        when (routeResolver?.routeFor(intent)) {
            CustomerRouteSpec.BookingPriceApproval ->
                navController.navigate(BookingRoutes.priceApprovalRoute(intent.entityId)) {
                    launchSingleTop = true
                }
            CustomerRouteSpec.Rating ->
                navController.navigate(RatingRoutes.route(intent.entityId)) { launchSingleTop = true }
            else -> Unit // home is the default; no explicit nav needed
        }
    }
}

private fun Context.hasNotificationPermission(): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
        ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
