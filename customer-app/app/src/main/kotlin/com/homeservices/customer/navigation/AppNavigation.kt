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
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.pendingaction.PendingActionStore
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.consent.IsConsentRequiredUseCase
import com.homeservices.customer.domain.flags.FeatureFlags
import com.homeservices.customer.domain.locale.IsFirstLaunchUseCase
import com.homeservices.customer.observability.SentryContextBinder
import com.homeservices.customer.ui.consent.DpdpConsentScreen
import com.homeservices.customer.ui.locale.FirstLaunchLanguageScreen
import com.homeservices.customer.ui.rating.RatingRoutes

public object LocaleRoutes {
    public const val FIRST_LAUNCH: String = "first_launch_language"
    public const val SETTINGS: String = "settings"
    public const val LANGUAGE_SETTINGS: String = "language_settings"
    public const val PRIVACY_AND_DATA: String = "privacy_data"
    public const val PRIVACY_DATA: String = "privacy_data"
    public const val DATA_EXPORT: String = "data_export"

    // DELETE_ACCOUNT routes added by E15-S02 (Stream 2.4) — populated by that branch.
    public const val DELETE_ACCOUNT: String = "delete_account"
    public const val DELETE_ACCOUNT_CONFIRM: String = "delete_account_confirm"
    public const val DELETE_ACCOUNT_COOL_OFF: String = "delete_account_cool_off"

    // DPDP consent gate (WS-D) — shown on first launch before locale picker,
    // and accessible from Settings → Privacy & data → Manage consent.
    public const val DPDP_CONSENT: String = "dpdp_consent"

    // Consent management route wired in SettingsGraph (revoke / update consent).
    public const val CONSENT_MANAGEMENT: String = "consent_management"
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
 * E11-S01b-2: PriceApprovalEventBus and RatingPromptEventBus parameters removed.
 * Navigation is now driven by Room-observed [PendingActionStore] rows via
 * [PendingActionsNavEffect]. The FCM service still posts to the legacy event buses
 * as a fallback (see [CustomerFirebaseMessagingService]), but AppNavigation no
 * longer depends on them — it observes the Room table directly.
 *
 * Stream 2.6 (Sentry breadcrumbs) note: signature extended with named parameters with
 * defaults — existing call sites compile unchanged.
 */
@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    pendingActionStore: PendingActionStore,
    isFirstLaunch: IsFirstLaunchUseCase,
    isConsentRequired: IsConsentRequiredUseCase,
    featureFlags: FeatureFlags,
    modifier: Modifier = Modifier,
    routeResolver: CustomerRouteResolver? = null,
    initialDeepLink: String? = null,
) {
    // Both booleans start as null (loading) so no screen flashes before DataStore emits.
    // We hold the blank Surface until BOTH emit — prevents consent/onboarding race.
    val firstLaunchPending: Boolean? =
        isFirstLaunch().collectAsStateWithLifecycle(initialValue = null as Boolean?).value
    val consentRequired: Boolean? =
        isConsentRequired().collectAsStateWithLifecycle(initialValue = null as Boolean?).value

    if (firstLaunchPending == null || consentRequired == null) {
        Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {}
        return
    }

    AppNavigationReady(
        sessionManager = sessionManager,
        activity = activity,
        pendingActionStore = pendingActionStore,
        featureFlags = featureFlags,
        firstLaunchPending = firstLaunchPending,
        consentRequired = consentRequired,
        modifier = modifier,
        routeResolver = routeResolver,
        initialDeepLink = initialDeepLink,
    )
}

/**
 * Inner composable rendered once [firstLaunchPending] has emitted a non-null value.
 *
 * Extracted from [AppNavigation] to satisfy detekt LongMethod and CyclomaticComplexMethod
 * limits — the outer function handles the loading gate only; all navigation wiring lives here.
 */
@Suppress("LongMethod")
@Composable
private fun AppNavigationReady(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    pendingActionStore: PendingActionStore,
    featureFlags: FeatureFlags,
    firstLaunchPending: Boolean,
    consentRequired: Boolean,
    modifier: Modifier,
    routeResolver: CustomerRouteResolver?,
    initialDeepLink: String?,
) {
    val context = LocalContext.current
    val authState by sessionManager.authState.collectAsStateWithLifecycle()
    if (!firstLaunchPending && !consentRequired && authState is AuthState.Initializing) {
        Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {}
        return
    }
    val navController = rememberNavController()
    // Consent gate wins over locale picker; both win over auth.
    val startDestination =
        when {
            consentRequired -> LocaleRoutes.DPDP_CONSENT
            firstLaunchPending -> LocaleRoutes.FIRST_LAUNCH
            authState is AuthState.Authenticated -> ROUTE_MAIN
            else -> ROUTE_AUTH
        }
    val notificationPermissionLauncher =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}

    AuthStateEffect(
        authState = authState,
        firstLaunchPending = firstLaunchPending,
        consentRequired = consentRequired,
        context = context,
        navController = navController,
        notificationPermissionLauncher = notificationPermissionLauncher,
    )
    PendingActionsNavEffect(
        authState = authState,
        pendingActionStore = pendingActionStore,
        navController = navController,
        consentRequired = consentRequired,
    )
    SentryEffects(sessionManager = sessionManager, navController = navController)
    if (initialDeepLink != null && !firstLaunchPending) {
        DeepLinkEffect(
            initialDeepLink = initialDeepLink,
            authState = authState,
            routeResolver = routeResolver,
            navController = navController,
            consentRequired = consentRequired,
        )
    }

    NavHost(navController = navController, startDestination = startDestination, modifier = modifier) {
        // DPDP consent gate — shown when consent is required before first-launch locale picker.
        // On completion, navigates to locale picker if needed, otherwise straight to auth.
        composable(LocaleRoutes.DPDP_CONSENT) {
            DpdpConsentScreen(
                onConsentComplete = {
                    val next = if (firstLaunchPending) LocaleRoutes.FIRST_LAUNCH else ROUTE_AUTH
                    navController.navigate(next) {
                        popUpTo(LocaleRoutes.DPDP_CONSENT) { inclusive = true }
                        launchSingleTop = true
                    }
                },
            )
        }
        composable(LocaleRoutes.FIRST_LAUNCH) {
            FirstLaunchLanguageScreen(
                onConfirmed = {
                    navController.navigate(ROUTE_AUTH) {
                        popUpTo(LocaleRoutes.FIRST_LAUNCH) { inclusive = true }
                        launchSingleTop = true
                    }
                },
            )
        }
        authGraph(navController, activity)
        mainGraph(navController, featureFlags)
        settingsGraph(navController, featureFlags)
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
    consentRequired: Boolean,
    context: Context,
    navController: NavController,
    notificationPermissionLauncher: ActivityResultLauncher<String>,
) {
    LaunchedEffect(authState, firstLaunchPending, consentRequired) {
        if (firstLaunchPending || consentRequired) return@LaunchedEffect
        when (val currentAuth = authState) {
            is AuthState.Authenticated -> {
                navController.navigate(ROUTE_MAIN) {
                    // Single pop target: by the time this fires, firstLaunchPending is
                    // false (guarded above) and FirstLaunchLanguageScreen.onConfirmed
                    // has already popped first_launch on its way to auth. Stack: [auth].
                    popUpTo(ROUTE_AUTH) { inclusive = true }
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
                navController.navigate(ROUTE_AUTH) {
                    // Single pop target: logout from main means stack is [main];
                    // first_launch is never on the stack at this point.
                    popUpTo(ROUTE_MAIN) { inclusive = true }
                    launchSingleTop = true
                }
            }
            is AuthState.Initializing -> Unit
        }
    }
}

/**
 * Observes ACTIVE pending actions from Room for the authenticated user and
 * navigates to the appropriate screen when an ADDON_APPROVAL_REQUESTED or
 * RATING_PROMPT_CUSTOMER action is present.
 *
 * E11-S01b-2: Replaces [EventBusEffects] (removed). Navigation is now driven by
 * the Room table rather than in-process event buses. The FCM service continues
 * to post legacy events for backward compat, but AppNavigation no longer depends
 * on them — it observes the store directly.
 *
 * Design note: We track a `Set<String>` of already-navigated action IDs so that
 * re-compositions and config changes do not trigger duplicate navigation.
 * The set is cleared when the user ID changes (new login).
 */
@Composable
private fun PendingActionsNavEffect(
    authState: AuthState,
    pendingActionStore: PendingActionStore,
    navController: NavController,
    consentRequired: Boolean,
) {
    val authenticatedUid = (authState as? AuthState.Authenticated)?.uid ?: return
    // Do not navigate over the consent screen — wait until the user has consented.
    if (consentRequired) return

    LaunchedEffect(authenticatedUid) {
        val navigatedIds = mutableSetOf<String>()
        pendingActionStore.observeActive(authenticatedUid).collect { actions ->
            actions
                .filter { it.status == PendingActionStatus.ACTIVE && it.id !in navigatedIds }
                .forEach { action ->
                    val route = pendingActionNavRoute(action.type, action.entityId)
                    if (route != null) {
                        navigatedIds += action.id
                        navController.navigate(route) { launchSingleTop = true }
                    }
                }
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
    consentRequired: Boolean,
) {
    LaunchedEffect(initialDeepLink, authState, consentRequired) {
        // Do not process deep links over the consent screen — wait until the user has consented.
        if (consentRequired) return@LaunchedEffect
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
