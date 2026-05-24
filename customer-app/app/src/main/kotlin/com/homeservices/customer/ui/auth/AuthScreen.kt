package com.homeservices.customer.ui.auth

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.homeservices.customer.R
import com.homeservices.customer.domain.auth.PhoneNumberNormalizer
import com.homeservices.designsystem.components.HsActionButton
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsScreenTitle
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTrustBadge
import com.homeservices.designsystem.theme.LocalHomeservicesExtendedColors
import com.homeservices.designsystem.theme.LocalHomeservicesSpacing

private const val PHONE_LAST_DIGITS = 4

private const val AUTH_HERO_FRACTION = 0.38f
private const val AUTH_FORM_FRACTION = 0.65f
private const val SCROLL_HANDLE_ALPHA = 0.25f

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
                    title = stringResource(R.string.auth_checking_truecaller),
                    message = stringResource(R.string.auth_checking_truecaller_body),
                )

            is AuthUiState.MethodSelection ->
                MethodSelectionContent(
                    onGoogleSelected = onGoogleSelected,
                    onEmailSelected = onEmailSelected,
                    onPhoneSelected = onPhoneSelected,
                )

            is AuthUiState.GoogleSigningIn ->
                LoadingContent(
                    title = stringResource(R.string.auth_signing_in_google),
                    message = stringResource(R.string.auth_signing_in_google_body),
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
                    title =
                        if (uiState.mode == AuthUiState.EmailEntry.Mode.SignUp) {
                            stringResource(R.string.auth_creating_account)
                        } else {
                            stringResource(R.string.auth_signing_in)
                        },
                    message = stringResource(R.string.auth_submitting_email_body, uiState.email),
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
                    title = stringResource(R.string.auth_sending_otp),
                    message = stringResource(R.string.auth_sending_otp_body),
                )

            is AuthUiState.OtpVerifying ->
                LoadingContent(
                    title = stringResource(R.string.auth_verifying_code),
                    message = stringResource(R.string.auth_verifying_code_body),
                )

            is AuthUiState.Error ->
                ErrorContent(state = uiState, onRetry = onRetry)
        }
    }
}

@Composable
private fun AuthHeroZone() {
    val heroStart = LocalHomeservicesExtendedColors.current.brandPrimaryHover
    val heroEnd = MaterialTheme.colorScheme.primary
    val onPrimary = MaterialTheme.colorScheme.onPrimary
    Box(
        modifier =
            Modifier
                .fillMaxWidth()
                .fillMaxHeight(AUTH_HERO_FRACTION)
                .drawBehind {
                    drawRect(
                        brush = Brush.verticalGradient(listOf(heroStart, heroEnd)),
                        size = size,
                    )
                    drawCircle(
                        color = onPrimary.copy(alpha = 0.06f),
                        radius = 140.dp.toPx(),
                        center = Offset(size.width - 80.dp.toPx(), -60.dp.toPx()),
                    )
                    drawCircle(
                        color = onPrimary.copy(alpha = 0.09f),
                        radius = 70.dp.toPx(),
                        center = Offset(40.dp.toPx(), size.height - 20.dp.toPx()),
                    )
                },
        contentAlignment = Alignment.BottomStart,
    ) {
        Column(
            modifier = Modifier.padding(start = 28.dp, end = 28.dp, bottom = 36.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            HsScreenTitle(text = "HomeHeroo", style = MaterialTheme.typography.headlineLarge, color = MaterialTheme.colorScheme.onPrimary)
            Text(
                text = stringResource(R.string.auth_hero_tagline),
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.82f),
            )
            Text(
                text = stringResource(R.string.auth_hero_guarantee),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.65f),
            )
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
    Box(
        modifier =
            modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.primary)
                .statusBarsPadding(),
    ) {
        AuthHeroZone()
        Surface(
            modifier = Modifier.fillMaxWidth().align(Alignment.BottomCenter).fillMaxHeight(AUTH_FORM_FRACTION),
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 8.dp,
        ) {
            Column(
                modifier =
                    Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .imePadding()
                        .padding(horizontal = 24.dp)
                        .padding(top = 28.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(spacing.space6),
            ) {
                Box(
                    modifier =
                        Modifier
                            .width(40.dp)
                            .height(2.dp)
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = SCROLL_HANDLE_ALPHA), RoundedCornerShape(1.dp))
                            .align(Alignment.CenterHorizontally),
                )
                Column(verticalArrangement = Arrangement.spacedBy(spacing.space3)) {
                    HsTrustBadge(text = eyebrow)
                    Text(text = title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text(text = body, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                HsSectionCard { content() }
                SecurityNote(text = stringResource(R.string.auth_security_note))
            }
        }
    }
}

@Composable
private fun MethodSelectionContent(
    onGoogleSelected: () -> Unit,
    onEmailSelected: () -> Unit,
    onPhoneSelected: () -> Unit,
) {
    AuthFrame(
        eyebrow = stringResource(R.string.auth_method_eyebrow),
        title = stringResource(R.string.auth_method_title),
        body = stringResource(R.string.auth_method_body),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            HsActionButton(
                text = stringResource(R.string.auth_continue_google),
                onClick = onGoogleSelected,
                modifier = Modifier.fillMaxWidth(),
                leadingContent = { GoogleMark() },
            )
            HsActionButton(
                text = stringResource(R.string.auth_continue_email),
                onClick = onEmailSelected,
                modifier = Modifier.fillMaxWidth(),
                leadingContent = {
                    Icon(
                        imageVector = Icons.Default.Email,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp),
                    )
                },
            )
            HsActionButton(
                text = stringResource(R.string.auth_continue_phone),
                onClick = onPhoneSelected,
                modifier = Modifier.fillMaxWidth(),
                leadingContent = {
                    Icon(
                        imageVector = Icons.Default.Phone,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp),
                    )
                },
            )
        }
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = stringResource(R.string.auth_email_verification_note),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
        Text(
            text = stringResource(R.string.auth_terms_note),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun GoogleMark() {
    Surface(
        shape = CircleShape,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier.size(22.dp),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                text = "G",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1A73E8),
            )
        }
    }
}

@Composable
private fun SecurityNote(text: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = Icons.Default.Lock,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(16.dp),
        )
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.weight(1f).padding(start = 8.dp),
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
    var passwordVisible by remember(state.mode) { mutableStateOf(false) }
    val isSignUp = state.mode == AuthUiState.EmailEntry.Mode.SignUp
    val isValidEmail = email.trim().matches(Regex("""^[^@\s]+@[^@\s]+\.[^@\s]+$"""))
    val isReady = isValidEmail && password.length >= 6

    AuthFrame(
        eyebrow = if (isSignUp) stringResource(R.string.auth_email_create_eyebrow) else stringResource(R.string.auth_email_signin_eyebrow),
        title = if (isSignUp) stringResource(R.string.auth_email_create_title) else stringResource(R.string.auth_email_signin_title),
        body =
            if (isSignUp) {
                stringResource(R.string.auth_email_create_body)
            } else {
                stringResource(R.string.auth_email_signin_body)
            },
    ) {
        TextButton(onClick = onBackToMethodSelection, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.auth_back_to_options))
        }
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text(stringResource(R.string.auth_email_label)) },
            placeholder = { Text(stringResource(R.string.auth_email_placeholder)) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text(stringResource(R.string.auth_password_label)) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            singleLine = true,
            trailingIcon = {
                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(
                        imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                        contentDescription =
                            if (passwordVisible) {
                                stringResource(R.string.auth_password_hide)
                            } else {
                                stringResource(R.string.auth_password_show)
                            },
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(20.dp))
        HsPrimaryButton(
            text = if (isSignUp) stringResource(R.string.auth_create_account_btn) else stringResource(R.string.auth_signin_btn),
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
            Text(if (isSignUp) stringResource(R.string.auth_have_account) else stringResource(R.string.auth_no_account))
        }
        if (!isSignUp) {
            TextButton(
                onClick = { onForgotPassword(email.trim()) },
                enabled = isValidEmail,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(stringResource(R.string.auth_forgot_password))
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
        eyebrow = stringResource(R.string.auth_verify_eyebrow),
        title = stringResource(R.string.auth_verify_title),
        body = stringResource(R.string.auth_verify_body, state.email),
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
            text = stringResource(R.string.auth_i_verified),
            onClick = { onContinue(state.email) },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(12.dp))
        HsSecondaryButton(
            text = stringResource(R.string.auth_resend_email),
            onClick = { onResend(state.email) },
            modifier = Modifier.fillMaxWidth(),
        )
        TextButton(onClick = onBackToMethodSelection, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.auth_use_other_method))
        }
    }
}

@Composable
private fun PhoneEntryContent(
    initialPhone: String,
    onPhoneSubmitted: (String) -> Unit,
) {
    var phone by remember { mutableStateOf(initialPhone) }
    val normalizedPhone = PhoneNumberNormalizer.normalize(phone)

    AuthFrame(
        eyebrow = stringResource(R.string.auth_method_eyebrow),
        title = stringResource(R.string.auth_phone_title),
        body = stringResource(R.string.auth_phone_body),
    ) {
        OutlinedTextField(
            value = phone,
            onValueChange = { phone = it },
            label = { Text(stringResource(R.string.auth_mobile_label)) },
            placeholder = { Text(stringResource(R.string.auth_mobile_placeholder)) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = stringResource(R.string.auth_mobile_note),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(20.dp))
        HsPrimaryButton(
            text = stringResource(R.string.auth_get_otp),
            onClick = { normalizedPhone?.let(onPhoneSubmitted) },
            enabled = normalizedPhone != null,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = stringResource(R.string.auth_terms_note),
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
    val lastFour = phoneNumber.takeLast(PHONE_LAST_DIGITS).ifEmpty { stringResource(R.string.auth_otp_label) }

    AuthFrame(
        eyebrow = stringResource(R.string.auth_otp_eyebrow),
        title = stringResource(R.string.auth_otp_title),
        body = stringResource(R.string.auth_otp_body, lastFour),
    ) {
        OutlinedTextField(
            value = otp,
            onValueChange = { if (it.length <= 6) otp = it.filter(Char::isDigit) },
            label = { Text(stringResource(R.string.auth_otp_label)) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(20.dp))
        HsPrimaryButton(
            text = stringResource(R.string.auth_verify_continue),
            onClick = { onOtpEntered(otp.trim()) },
            enabled = otp.length == 6,
            modifier = Modifier.fillMaxWidth(),
        )
        TextButton(onClick = onResendRequested, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.auth_resend_code))
        }
    }
}

@Composable
private fun LoadingContent(
    title: String,
    message: String,
) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            modifier = Modifier.padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            CircularProgressIndicator()
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                )
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
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
        eyebrow = stringResource(R.string.auth_error_eyebrow),
        title = stringResource(R.string.auth_error_title),
        body = state.message,
    ) {
        if (state.retriesLeft > 0) {
            val attemptsText =
                pluralStringResource(
                    R.plurals.auth_attempts_remaining,
                    state.retriesLeft,
                    state.retriesLeft,
                )
            Text(
                text = attemptsText,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(16.dp))
        }
        HsPrimaryButton(
            text = stringResource(R.string.auth_retry),
            onClick = onRetry,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
