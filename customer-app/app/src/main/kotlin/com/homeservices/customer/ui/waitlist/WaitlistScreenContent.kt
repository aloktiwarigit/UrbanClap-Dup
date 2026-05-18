package com.homeservices.customer.ui.waitlist

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.homeservices.customer.R
import com.homeservices.designsystem.components.HsPrimaryButton

private const val SECONDS_PER_MINUTE = 60

/**
 * Stateless composable rendering the waitlist form in all of its states.
 *
 * Extract from [WaitlistScreen] so Paparazzi tests can snapshot each state
 * without needing a ViewModel or Hilt.
 */
@Composable
internal fun WaitlistScreenContent(
    uiState: WaitlistUiState,
    phone: String,
    onPhoneChange: (String) -> Unit,
    onSubmit: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier =
            modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
                .navigationBarsPadding(),
    ) {
        Spacer(modifier = Modifier.height(24.dp))
        WaitlistHeader()
        Spacer(modifier = Modifier.height(32.dp))

        when (uiState) {
            is WaitlistUiState.Confirmed -> ConfirmedContent()

            is WaitlistUiState.RateLimited -> {
                RateLimitedContent(retryAfterSec = uiState.retryAfterSec)
            }

            is WaitlistUiState.Submitting ->
                SubmittingContent(phone = phone, onPhoneChange = onPhoneChange)

            is WaitlistUiState.Error -> {
                PhoneField(
                    phone = phone,
                    onPhoneChange = onPhoneChange,
                    enabled = true,
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = uiState.reason,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.error,
                )
                Spacer(modifier = Modifier.height(24.dp))
                HsPrimaryButton(
                    text =
                        if (uiState.retryable) {
                            stringResource(R.string.waitlist_error_retry)
                        } else {
                            stringResource(R.string.waitlist_submit)
                        },
                    onClick = onSubmit,
                    enabled = uiState.retryable,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            is WaitlistUiState.Form -> {
                PhoneField(
                    phone = phone,
                    onPhoneChange = onPhoneChange,
                    enabled = true,
                )
                Spacer(modifier = Modifier.height(24.dp))
                SubmitButton(
                    enabled = uiState.isPhoneValid,
                    onSubmit = onSubmit,
                )
            }
        }
    }
}

@Composable
private fun PhoneField(
    phone: String,
    onPhoneChange: (String) -> Unit,
    enabled: Boolean,
) {
    OutlinedTextField(
        value = phone,
        onValueChange = onPhoneChange,
        label = { Text(stringResource(R.string.waitlist_phone_label)) },
        placeholder = { Text("+91 98765 43210") },
        singleLine = true,
        enabled = enabled,
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun SubmitButton(
    enabled: Boolean,
    onSubmit: () -> Unit,
) {
    HsPrimaryButton(
        text = stringResource(R.string.waitlist_submit),
        onClick = onSubmit,
        enabled = enabled,
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun ConfirmedContent() {
    Surface(
        color = MaterialTheme.colorScheme.primaryContainer,
        shape = MaterialTheme.shapes.medium,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(24.dp),
        ) {
            Icon(
                imageVector = Icons.Filled.CheckCircle,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(48.dp),
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = stringResource(R.string.waitlist_confirmed_title),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = stringResource(R.string.waitlist_confirmed_body),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun SubmittingContent(
    phone: String,
    onPhoneChange: (String) -> Unit,
) {
    PhoneField(phone = phone, onPhoneChange = onPhoneChange, enabled = false)
    Spacer(modifier = Modifier.height(24.dp))
    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}

@Composable
private fun WaitlistHeader() {
    Text(
        text = stringResource(R.string.waitlist_title),
        style = MaterialTheme.typography.headlineMedium,
        fontWeight = FontWeight.Bold,
    )
    Spacer(modifier = Modifier.height(8.dp))
    Text(
        text = stringResource(R.string.waitlist_body),
        style = MaterialTheme.typography.bodyLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
}

@Composable
private fun RateLimitedContent(retryAfterSec: Int) {
    val minutes = (retryAfterSec + SECONDS_PER_MINUTE - 1) / SECONDS_PER_MINUTE
    Text(
        text = stringResource(R.string.waitlist_rate_limited, minutes),
        style = MaterialTheme.typography.bodyLarge,
        color = MaterialTheme.colorScheme.error,
    )
}
