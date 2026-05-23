package com.homeservices.technician.navigation

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.data.fcm.FcmTopicSubscriber
import com.homeservices.technician.data.rating.RatingPromptEventBus
import com.homeservices.technician.data.rating.RatingReceivedEventBus
import com.homeservices.technician.domain.auth.model.AuthState
import com.homeservices.technician.domain.jobOffer.FcmTokenSyncUseCase
import com.homeservices.technician.ui.jobOffer.JobOfferScreen
import com.homeservices.technician.ui.jobOffer.JobOfferUiState
import com.homeservices.technician.ui.jobOffer.JobOfferViewModel
import kotlinx.coroutines.launch

@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    ratingPromptEventBus: RatingPromptEventBus,
    ratingReceivedEventBus: RatingReceivedEventBus,
    fcmTopicSubscriber: FcmTopicSubscriber,
    fcmTokenSyncUseCase: FcmTokenSyncUseCase,
    coldStartNavDestination: String? = null,
    modifier: Modifier = Modifier,
): Unit {
    val navController = rememberNavController()
    val context = LocalContext.current
    val authState by sessionManager.authState.collectAsStateWithLifecycle()
    val jobOfferViewModel: JobOfferViewModel = hiltViewModel()
    val jobOfferState by jobOfferViewModel.uiState.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()
    val notificationPermissionLauncher =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
            // The dispatch token is synced independently; Android controls notification display.
        }

    LaunchedEffect(authState) {
        val current = authState
        when (current) {
            is AuthState.Authenticated -> {
                val dest = if (sessionManager.isOnboardingComplete) "home" else "onboarding_gate"
                navController.navigate(dest) {
                    popUpTo("auth") { inclusive = true }
                    launchSingleTop = true
                }
                fcmTopicSubscriber.subscribeTechnician(current.uid)
                if (!context.hasNotificationPermission()) {
                    notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
                fcmTokenSyncUseCase()
            }
            is AuthState.Unauthenticated -> {
                // Drain any buffered rating prompts so the next technician to
                // log in on this device can't be routed into the previous
                // technician's pending booking flow.
                ratingPromptEventBus.clearBuffered()
                ratingReceivedEventBus.clearBuffered()
                fcmTopicSubscriber.unsubscribeTechnician()
                navController.navigate("auth") {
                    popUpTo("main") { inclusive = true }
                    launchSingleTop = true
                }
            }
        }
    }

    LaunchedEffect(jobOfferState) {
        if (jobOfferState is JobOfferUiState.Accepted) {
            val bookingId = (jobOfferState as JobOfferUiState.Accepted).bookingId
            navController.navigate("activeJob/$bookingId") {
                launchSingleTop = true
            }
        }
    }

    val isAuthenticated = authState is AuthState.Authenticated
    LaunchedEffect(ratingPromptEventBus, isAuthenticated) {
        // Only collect rating prompts while authenticated. A push that arrives
        // before login (stale topic delivery, race after a recent logout) sits
        // in the Channel buffer until the collector subscribes — preventing
        // unauthenticated users from being routed into RatingScreen, where the
        // load/submit calls would fire without an auth token.
        if (!isAuthenticated) return@LaunchedEffect
        ratingPromptEventBus.events.collect { bookingId ->
            navController.navigate("rating/$bookingId") {
                launchSingleTop = true
            }
        }
    }

    LaunchedEffect(ratingReceivedEventBus, isAuthenticated) {
        if (!isAuthenticated) return@LaunchedEffect
        ratingReceivedEventBus.events.collect {
            navController.navigate("ratings_transparency") {
                launchSingleTop = true
            }
        }
    }

    // Cold-start: the bus has replay=0 so events posted before the collector exists
    // are dropped. Navigate directly from the captured intent extra instead.
    // - Keyed on both keys so it fires after login if the user wasn't yet authenticated
    //   at cold-start (e.g. logged-out state at notification tap).
    // - coldStartNavigated guards against re-fire on subsequent auth state changes
    //   (logout/re-login) while still allowing a first navigation after deferred auth.
    //   Uses remember (not rememberSaveable) so config-changes reset it; launchSingleTop
    //   prevents duplicate back-stack entries if re-navigation occurs.
    // rememberSaveable persists across config changes so rotation doesn't re-navigate.
    val coldStartNavigated = rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(coldStartNavDestination, isAuthenticated) {
        if (coldStartNavigated.value || coldStartNavDestination == null) return@LaunchedEffect
        if (isAuthenticated && coldStartNavDestination == "ratings_transparency") {
            coldStartNavigated.value = true
            navController.navigate("ratings_transparency") {
                launchSingleTop = true
            }
        }
    }

    Box(modifier = modifier.fillMaxSize().navigationBarsPadding()) {
        NavHost(
            navController = navController,
            startDestination = "auth",
        ) {
            authGraph(navController, activity)
            composable("onboarding_gate") {
                OnboardingGateScreen(
                    onComplete = {
                        scope.launch {
                            sessionManager.setOnboardingComplete()
                            navController.navigate("home") {
                                popUpTo("onboarding_gate") { inclusive = true }
                                launchSingleTop = true
                            }
                        }
                    },
                    onNeedsOnboarding = {
                        navController.navigate("main") {
                            popUpTo("onboarding_gate") { inclusive = true }
                            launchSingleTop = true
                        }
                    },
                )
            }
            onboardingGraph(navController, sessionManager, scope)
            homeGraph(
                navController = navController,
                authState = authState,
                sessionManager = sessionManager,
                onSignOut = { scope.launch { sessionManager.clearSession() } },
            )
        }
        if (jobOfferState !is JobOfferUiState.Idle && jobOfferState !is JobOfferUiState.Accepted) {
            JobOfferScreen(
                modifier = Modifier.fillMaxSize(),
                viewModel = jobOfferViewModel,
            )
        }
    }
}

private fun Context.hasNotificationPermission(): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
        ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
