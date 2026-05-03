package com.homeservices.technician.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsTrustBadge
import com.homeservices.designsystem.theme.LocalHomeservicesSpacing

private const val PHONE_LAST_DIGITS = 4

@Composable
internal fun AuthScreen(
    uiState: AuthUiState,
    onPhoneSubmitted: (String) -> Unit,
    onOtpEntered: (String) -> Unit,
    onResendRequested: () -> Unit,
    onRetry: () -> Unit,
    onGoogleSelected: () -> Unit = {},
    onEmailSelected: () -> Unit = {},
    onPhoneSelected: () -> Unit = {},
    onEmailSignIn: (String, String) -> Unit = { _, _ -> },
    onEmailSignUp: (String, String) -> Unit = { _, _ -> },
    onEmailModeToggle: (String) -> Unit = {},
    onBackToMethodSelection: () -> Unit = {},
    onEmailVerificationContinue: (String) -> Unit = {},
    onResendVerificationEmail: (String) -> Unit = {},
    onForgotPassword: (String) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        when (uiState) {
            is AuthUiState.Idle, is AuthUiState.TruecallerLoading ->
                LoadingContent(
                    eyebrow = "Partner sign in",
                    title = "Checking Truecaller",
                    message = "We are verifying your partner number before falling back to OTP.",
                )

            is AuthUiState.MethodSelection ->
                MethodSelectionContent(
                    onGoogleSelected = onGoogleSelected,
                    onEmailSelected = onEmailSelected,
                    onPhoneSelected = onPhoneSelected,
                )

            is AuthUiState.GoogleSigningIn ->
                LoadingContent(
                    eyebrow = "Google Sign-In",
                    title = "Signing in with Google",
                    message = "Choose your Google account to continue.",
                )

            is AuthUiState.EmailEntry ->
                EmailEntryContent(
                    state = uiState,
                    onEmailSignIn = onEmailSignIn,
                    onEmailSignUp = onEmailSignUp,
                    onEmailModeToggle = onEmailModeToggle,
                    onBackToMethodSelection = onBackToMethodSelection,
                    onForgotPassword = onForgotPassword,
                )

            is AuthUiState.EmailSubmitting ->
                LoadingContent(
                    eyebrow = "Email sign in",
                    title =
                        if (uiState.mode == AuthUiState.EmailEntry.Mode.SignUp) {
                            "Creating account"
                        } else {
                            "Signing in"
                        },
                    message = "Keep this screen open while we verify ${uiState.email}.",
                )

            is AuthUiState.EmailVerificationSent ->
                EmailVerificationSentContent(
                    state = uiState,
                    onContinue = onEmailVerificationContinue,
                    onResend = onResendVerificationEmail,
                    onBackToMethodSelection = onBackToMethodSelection,
                )

            is AuthUiState.OtpEntry -> {
                if (uiState.verificationId == null) {
                    PhoneEntryContent(
                        initialPhone = uiState.phoneNumber,
                        onPhoneSubmitted = onPhoneSubmitted,
                    )
                } else {
                    OtpCodeContent(
                        phoneNumber = uiState.phoneNumber,
                        onOtpEntered = onOtpEntered,
                        onResendRequested = onResendRequested,
                    )
                }
            }

            is AuthUiState.OtpSending ->
                LoadingContent(
                    eyebrow = "OTP verification",
                    title = "Sending OTP",
                    message = "Keep this screen open while we send your secure code.",
                )

            is AuthUiState.OtpVerifying ->
                LoadingContent(
                    eyebrow = "OTP verification",
                    title = "Verifying code",
                    message = "This usually takes a few seconds.",
                )

            is AuthUiState.Error ->
                ErrorContent(state = uiState, onRetry = onRetry)
        }
    }
}

@Composable
private fun AuthFrame(
    eyebrow: String,
    title: String,
    body: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val spacing = LocalHomeservicesSpacing.current
    Column(
        modifier =
            modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(spacing.space6),
        verticalArrangement = Arrangement.Center,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(spacing.space3)) {
            HsTrustBadge(text = eyebrow)
            Text(
                text = title,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = body,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(modifier = Modifier.height(spacing.space6))
        HsSectionCard {
            content()
        }
        Spacer(modifier = Modifier.height(spacing.space4))
        Text(
            text = "Encrypted partner sign-in. Job offers, payouts, and document status stay protected.",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun MethodSelectionContent(
    onGoogleSelected: () -> Unit,
    onEmailSelected: () -> Unit,
    onPhoneSelected: () -> Unit,
) {
    AuthFrame(
        eyebrow = "Technician app",
        title = "Choose how to sign in",
        body = "Use Google, email, or your mobile number to receive jobs and manage payouts.",
    ) {
        Button(
            onClick = onGoogleSelected,
            modifier = Modifier.fillMaxWidth().height(48.dp),
        ) {
            Text("Continue with Google")
        }
        Spacer(modifier = Modifier.height(12.dp))
        HsSecondaryButton(
            text = "Continue with Email",
            onClick = onEmailSelected,
            modifier = Modifier.fillMaxWidth(),
        )
        TextButton(onClick = onPhoneSelected, modifier = Modifier.fillMaxWidth()) {
            Text("Use phone number instead")
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Email sign-up requires verification before partner access.",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun EmailEntryContent(
    state: AuthUiState.EmailEntry,
    onEmailSignIn: (String, String) -> Unit,
    onEmailSignUp: (String, String) -> Unit,
    onEmailModeToggle: (String) -> Unit,
    onBackToMethodSelection: () -> Unit,
    onForgotPassword: (String) -> Unit,
) {
    var email by remember(state.prefillEmail) { mutableStateOf(state.prefillEmail) }
    var password by remember(state.mode) { mutableStateOf("") }
    val isSignUp = state.mode == AuthUiState.EmailEntry.Mode.SignUp
    val isValidEmail = email.trim().matches(Regex("""^[^@\s]+@[^@\s]+\.[^@\s]+$"""))
    val isReady = isValidEmail && password.length >= 6

    AuthFrame(
        eyebrow = if (isSignUp) "Create account" else "Email sign in",
        title = if (isSignUp) "Create your email login" else "Sign in with email",
        body =
            if (isSignUp) {
                "We will send a verification email before enabling partner access."
            } else {
                "Use your verified email and password to continue."
            },
    ) {
        TextButton(onClick = onBackToMethodSelection, modifier = Modifier.fillMaxWidth()) {
            Text("Back to sign-in options")
        }
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            placeholder = { Text("you@example.com") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            visualTransformation = PasswordVisualTransformation(),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(20.dp))
        HsPrimaryButton(
            text = if (isSignUp) "Create account" else "Sign in",
            onClick = {
                if (isSignUp) {
                    onEmailSignUp(email.trim(), password)
                } else {
                    onEmailSignIn(email.trim(), password)
                }
            },
            enabled = isReady,
            modifier = Modifier.fillMaxWidth(),
        )
        TextButton(
            onClick = { onEmailModeToggle(email.trim()) },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (isSignUp) "Already have an account? Sign in" else "New here? Create account")
        }
        if (!isSignUp) {
            TextButton(
                onClick = { onForgotPassword(email.trim()) },
                enabled = isValidEmail,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Forgot password?")
            }
        }
    }
}

@Composable
private fun EmailVerificationSentContent(
    state: AuthUiState.EmailVerificationSent,
    onContinue: (String) -> Unit,
    onResend: (String) -> Unit,
    onBackToMethodSelection: () -> Unit,
) {
    AuthFrame(
        eyebrow = "Email verification",
        title = "Check your inbox",
        body = "We sent a verification link to ${state.email}. Open it, then return here to continue.",
    ) {
        if (state.message != null) {
            Text(
                text = state.message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(modifier = Modifier.height(16.dp))
        }
        HsPrimaryButton(
            text = "I verified, continue",
            onClick = { onContinue(state.email) },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(12.dp))
        HsSecondaryButton(
            text = "Resend email",
            onClick = { onResend(state.email) },
            modifier = Modifier.fillMaxWidth(),
        )
        TextButton(onClick = onBackToMethodSelection, modifier = Modifier.fillMaxWidth()) {
            Text("Use another sign-in method")
        }
    }
}

@Composable
private fun PhoneEntryContent(
    initialPhone: String,
    onPhoneSubmitted: (String) -> Unit,
) {
    var phone by remember { mutableStateOf(initialPhone) }
    val isValidPhone = phone.trim().matches(Regex("""^\+[1-9]\d{9,14}$"""))

    AuthFrame(
        eyebrow = "Technician app",
        title = "Start earning with verified jobs",
        body = "Sign in to receive service requests, complete KYC, track active jobs, and manage payouts.",
    ) {
        OutlinedTextField(
            value = phone,
            onValueChange = { phone = it },
            label = { Text("Mobile number") },
            placeholder = { Text("+91 98765 43210") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "Use the number linked to your partner profile and payout account.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(20.dp))
        HsPrimaryButton(
            text = "Get OTP",
            onClick = { onPhoneSubmitted(phone.trim()) },
            enabled = isValidPhone,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "By continuing, you agree to the Partner Terms and Privacy Policy.",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun OtpCodeContent(
    phoneNumber: String,
    onOtpEntered: (String) -> Unit,
    onResendRequested: () -> Unit,
) {
    var otp by remember { mutableStateOf("") }
    val lastFour = phoneNumber.takeLast(PHONE_LAST_DIGITS).ifEmpty { "your number" }

    AuthFrame(
        eyebrow = "Verification",
        title = "Enter your 6-digit code",
        body = "We sent an OTP to the mobile number ending in $lastFour.",
    ) {
        OutlinedTextField(
            value = otp,
            onValueChange = { if (it.length <= 6) otp = it.filter(Char::isDigit) },
            label = { Text("6-digit code") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(20.dp))
        HsPrimaryButton(
            text = "Verify and continue",
            onClick = { onOtpEntered(otp.trim()) },
            enabled = otp.length == 6,
            modifier = Modifier.fillMaxWidth(),
        )
        TextButton(onClick = onResendRequested, modifier = Modifier.fillMaxWidth()) {
            Text("Resend code")
        }
    }
}

@Composable
private fun LoadingContent(
    eyebrow: String,
    title: String,
    message: String,
) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        AuthFrame(eyebrow = eyebrow, title = title, body = message) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                CircularProgressIndicator()
                Spacer(modifier = Modifier.height(16.dp))
                Text(text = "Please wait", style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@Composable
private fun ErrorContent(
    state: AuthUiState.Error,
    onRetry: () -> Unit,
) {
    AuthFrame(
        eyebrow = "Action needed",
        title = "We could not sign you in",
        body = state.message,
    ) {
        if (state.retriesLeft > 0) {
            Text(
                text = "${state.retriesLeft} attempt${if (state.retriesLeft == 1) "" else "s"} remaining",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(16.dp))
        }
        HsPrimaryButton(
            text = "Try again",
            onClick = onRetry,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
