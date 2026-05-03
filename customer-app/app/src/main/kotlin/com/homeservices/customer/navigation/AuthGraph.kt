package com.homeservices.customer.navigation

import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.fragment.app.FragmentActivity
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import androidx.navigation.navigation
import com.homeservices.customer.ui.auth.AuthScreen
import com.homeservices.customer.ui.auth.AuthViewModel

// navController will be used in E02-S02 when navigating to HomeGraph on successful auth
@Suppress("UnusedParameter")
internal fun NavGraphBuilder.authGraph(
    navController: NavController,
    activity: FragmentActivity,
) {
    navigation(startDestination = "auth_screen", route = "auth") {
        composable("auth_screen") {
            val viewModel: AuthViewModel = hiltViewModel()
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()

            LaunchedEffect(Unit) {
                viewModel.initAuth(activity)
            }

            AuthScreen(
                uiState = uiState,
                onPhoneSubmitted = { phone -> viewModel.onPhoneNumberSubmitted(phone, activity) },
                onOtpEntered = viewModel::onOtpEntered,
                onResendRequested = { viewModel.onOtpResendRequested(activity) },
                onRetry = viewModel::onRetry,
                onGoogleSelected = { viewModel.onGoogleSignInClicked(activity) },
                onEmailSelected = viewModel::onEmailSelected,
                onPhoneSelected = viewModel::onPhoneSelected,
                onEmailSignIn = viewModel::onEmailSignInClicked,
                onEmailSignUp = viewModel::onEmailSignUpClicked,
                onEmailModeToggle = viewModel::onEmailModeToggled,
                onBackToMethodSelection = viewModel::onBackToMethodSelection,
                onEmailVerificationContinue = viewModel::onEmailVerificationContinue,
                onResendVerificationEmail = viewModel::onResendVerificationEmail,
                onForgotPassword = viewModel::onForgotPassword,
            )
        }
    }
}
