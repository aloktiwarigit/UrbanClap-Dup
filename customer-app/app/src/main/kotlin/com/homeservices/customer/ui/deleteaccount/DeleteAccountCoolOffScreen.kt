package com.homeservices.customer.ui.deleteaccount

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.HourglassTop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import kotlinx.coroutines.delay
import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit

// Design tokens — consistent palette
private val ErrorRed = Color(0xFFB3261E)
private val ErrorRedSurface = Color(0xFFFFF0EE)

// Magic-number constants
private const val TICK_INTERVAL_MS = 60_000L
private const val HOURS_PER_DAY = 24L
private const val COUNTDOWN_ICON_SIZE = 64

/**
 * Cool-off countdown screen.
 *
 * Displays the remaining time until the account is permanently deleted,
 * refreshing every 60 seconds. Offers a "Revoke deletion" CTA during the cool-off window.
 *
 * @param onBack Navigate back to Privacy & data settings.
 * @param onRevoked Navigate back to settings root after a successful revoke.
 */
@Composable
public fun DeleteAccountCoolOffScreen(
    onBack: () -> Unit,
    onRevoked: () -> Unit,
    viewModel: DeleteAccountViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val errorUnknown = stringResource(R.string.delete_account_error_unknown)
    val coolOff = uiState as? DeleteAccountUiState.CoolOff
    val existingDetected = uiState as? DeleteAccountUiState.ExistingRequestDetected
    val isRevoking = uiState is DeleteAccountUiState.Revoking
    val hasActiveRequest = coolOff != null || existingDetected != null
    val countdownUnavailable = existingDetected != null && coolOff == null

    CoolOffSideEffects(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        errorUnknown = errorUnknown,
        onRevoked = onRevoked,
        onErrorDismissed = { viewModel.onErrorDismissed() },
    )

    val countdownText = rememberCountdownText(coolOff)

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().statusBarsPadding().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            DeleteAccountCoolOffTopBar(onBack = onBack)
            Spacer(Modifier.height(8.dp))
            DeleteAccountCoolOffCountdownCard(
                countdownText = countdownText,
                countdownUnavailable = countdownUnavailable,
            )
            DeleteAccountCoolOffRevokedBanner(uiState = uiState)
            Spacer(Modifier.weight(1f))
            DeleteAccountCoolOffActions(
                isRevoking = isRevoking,
                hasActiveRequest = hasActiveRequest,
                onRevokeClicked = { viewModel.onRevokeClicked() },
                onBack = onBack,
            )
        }
        SnackbarHost(hostState = snackbarHostState, modifier = Modifier.padding(16.dp)) { data ->
            Snackbar(snackbarData = data, containerColor = ErrorRed)
        }
    }
}

/** Handles side-effects: navigate on revoke/error, dismiss error on ack. */
@Composable
private fun CoolOffSideEffects(
    uiState: DeleteAccountUiState,
    snackbarHostState: SnackbarHostState,
    errorUnknown: String,
    onRevoked: () -> Unit,
    onErrorDismissed: () -> Unit,
) {
    LaunchedEffect(uiState) {
        when (uiState) {
            is DeleteAccountUiState.Revoked -> onRevoked()
            is DeleteAccountUiState.Error -> {
                snackbarHostState.showSnackbar(uiState.message.ifEmpty { errorUnknown })
                onErrorDismissed()
            }
            else -> Unit
        }
    }
}

/** Ticks every [TICK_INTERVAL_MS] and returns the formatted countdown string. */
@Composable
private fun rememberCountdownText(coolOff: DeleteAccountUiState.CoolOff?): String {
    var tickMs by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(TICK_INTERVAL_MS)
            tickMs = System.currentTimeMillis()
        }
    }
    val countdownText by remember(coolOff, tickMs) {
        derivedStateOf { formatCountdown(coolOff?.scheduledDeletionAt, tickMs) }
    }
    return countdownText
}

@Composable
private fun DeleteAccountCoolOffTopBar(onBack: () -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        IconButton(onClick = onBack, modifier = Modifier.size(44.dp)) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurface,
            )
        }
        Spacer(Modifier.width(8.dp))
        Text(
            text = stringResource(R.string.delete_account_coolOff_title),
            style =
                MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.ExtraBold,
                ),
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

@Composable
private fun DeleteAccountCoolOffCountdownCard(
    countdownText: String,
    countdownUnavailable: Boolean,
) {
    Surface(
        shape = RoundedCornerShape(24.dp),
        color = ErrorRedSurface,
        border = BorderStroke(1.dp, ErrorRed.copy(alpha = 0.3f)),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            DeleteAccountCoolOffCountdownIcon()
            if (countdownUnavailable) {
                // ExistingRequestDetected path: 409 response did not include scheduledDeletionAt.
                Text(
                    text = stringResource(R.string.delete_account_coolOff_pending_no_date),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = ErrorRed,
                    textAlign = TextAlign.Center,
                )
            } else {
                Text(
                    text = countdownText,
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    color = ErrorRed,
                    textAlign = TextAlign.Center,
                )
            }
            Text(
                text = stringResource(R.string.delete_account_coolOff_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun DeleteAccountCoolOffCountdownIcon() {
    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(COUNTDOWN_ICON_SIZE.dp)) {
        Surface(shape = RoundedCornerShape(20.dp), color = ErrorRed.copy(alpha = 0.12f)) {
            Box(modifier = Modifier.size(COUNTDOWN_ICON_SIZE.dp), contentAlignment = Alignment.Center) {
                Icon(
                    Icons.Default.HourglassTop,
                    contentDescription = null,
                    tint = ErrorRed,
                    modifier = Modifier.size(36.dp),
                )
            }
        }
    }
}

@Composable
private fun DeleteAccountCoolOffRevokedBanner(uiState: DeleteAccountUiState) {
    // Revoked confirmation card (shown briefly during Revoked state before nav)
    if (uiState is DeleteAccountUiState.Revoked) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surfaceVariant,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Text(
                    text = stringResource(R.string.delete_account_revoke_success),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}

@Composable
private fun DeleteAccountCoolOffActions(
    isRevoking: Boolean,
    hasActiveRequest: Boolean,
    onRevokeClicked: () -> Unit,
    onBack: () -> Unit,
) {
    Button(
        onClick = onRevokeClicked,
        enabled = !isRevoking && hasActiveRequest,
        modifier = Modifier.fillMaxWidth().height(56.dp),
        shape = RoundedCornerShape(16.dp),
        colors =
            ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                disabledContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.38f),
                disabledContentColor = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.6f),
            ),
    ) {
        if (isRevoking) {
            CircularProgressIndicator(
                modifier = Modifier.size(22.dp),
                color = MaterialTheme.colorScheme.onPrimary,
                strokeWidth = 2.dp,
            )
        } else {
            Text(
                text = stringResource(R.string.delete_account_revoke_cta),
                style =
                    MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                    ),
            )
        }
    }

    OutlinedButton(
        onClick = onBack,
        modifier = Modifier.fillMaxWidth().height(48.dp),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
    ) {
        Text(
            text = stringResource(R.string.delete_account_close_cta),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

/**
 * Formats the remaining time until [scheduledDeletionAt] (ISO-8601).
 *
 * Returns a human-readable string such as "6 days, 14 hours" or
 * an empty string when the date is blank / already past.
 */
private fun formatCountdown(
    scheduledDeletionAt: String?,
    nowMs: Long,
): String {
    if (scheduledDeletionAt.isNullOrEmpty()) return ""
    return try {
        val target = Instant.parse(scheduledDeletionAt).atZone(ZoneId.systemDefault())
        val now = ZonedDateTime.ofInstant(Instant.ofEpochMilli(nowMs), ZoneId.systemDefault())
        when {
            target.isBefore(now) -> ""
            else -> {
                val totalHours = ChronoUnit.HOURS.between(now, target)
                val days = totalHours / HOURS_PER_DAY
                val hours = totalHours % HOURS_PER_DAY
                buildString {
                    if (days > 0) {
                        append("$days day${if (days != 1L) "s" else ""}")
                        if (hours > 0) append(", ")
                    }
                    if (hours > 0 || days == 0L) {
                        append("$hours hour${if (hours != 1L) "s" else ""}")
                    }
                }
            }
        }
    } catch (_: Exception) {
        ""
    }
}
