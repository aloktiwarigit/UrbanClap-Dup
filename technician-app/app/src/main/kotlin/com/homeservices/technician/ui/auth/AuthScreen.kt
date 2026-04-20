package com.homeservices.technician.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

private const val PHONE_LAST_DIGITS = 4

@Composable
internal fun AuthScreen(
    uiState: AuthUiState,
    onPhoneSubmitted: (String) -> Unit,
    onOtpEntered: (String) -> Unit,
    onResendRequested: () -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        when (uiState) {
            is AuthUiState.Idle, is AuthUiState.TruecallerLoading ->
                TruecallerLoadingContent()

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
                LoadingContent(message = "Sending OTP\u2026")

            is AuthUiState.OtpVerifying ->
                LoadingContent(message = "Verifying\u2026")

            is AuthUiState.Error ->
                ErrorContent(state = uiState, onRetry = onRetry)
        }
    }
}

@Composable
private fun TruecallerLoadingContent() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator()
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Verifying your identity with Truecaller\u2026",
                style = MaterialTheme.typography.bodyMedium,
            )
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

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "Register as a service partner",
            style = MaterialTheme.typography.headlineSmall,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "We\u2019ll verify your mobile number to get you started",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(32.dp))
        OutlinedTextField(
            value = phone,
            onValueChange = { phone = it },
            label = { Text("Mobile number") },
            placeholder = { Text("+91 98765 43210") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "By continuing, you agree to our Partner Terms of Service and Privacy Policy.",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = { onPhoneSubmitted(phone.trim()) },
            enabled = isValidPhone,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Get OTP")
        }
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

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "Enter the code we sent to \u2022\u2022\u2022\u2022$lastFour",
            style = MaterialTheme.typography.headlineSmall,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(32.dp))
        OutlinedTextField(
            value = otp,
            onValueChange = { if (it.length <= 6) otp = it },
            label = { Text("6-digit code") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = { onOtpEntered(otp.trim()) },
            enabled = otp.length == 6,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Verify")
        }
        Spacer(modifier = Modifier.height(8.dp))
        TextButton(onClick = onResendRequested) {
            Text("Resend code")
        }
    }
}

@Composable
private fun LoadingContent(message: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator()
            Spacer(modifier = Modifier.height(16.dp))
            Text(text = message, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun ErrorContent(
    state: AuthUiState.Error,
    onRetry: () -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = state.message,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.error,
            textAlign = TextAlign.Center,
        )
        if (state.retriesLeft > 0) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "${state.retriesLeft} attempt${if (state.retriesLeft == 1) "" else "s"} remaining",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = onRetry, modifier = Modifier.fillMaxWidth()) {
            Text("Try again")
        }
    }
}
