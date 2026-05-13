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
private val WarmIvory = Color(0xFFFBF7EF)
private val BrandGreen = Color(0xFF0B3D2E)
private val MutedGreen = Color(0xFFE8F1EC)
private val ErrorRed = Color(0xFFB3261E)
private val ErrorRedSurface = Color(0xFFFFF0EE)
private val CardBorder = Color(0xFFDED8CD)
private val TextPrimary = Color(0xFF18231F)
private val TextSecondary = Color(0xFF5F6C66)

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

    // Navigate away when revoke succeeds.
    LaunchedEffect(uiState) {
        when (uiState) {
            is DeleteAccountUiState.Revoked -> onRevoked()
            is DeleteAccountUiState.Error -> {
                val err = uiState as DeleteAccountUiState.Error
                snackbarHostState.showSnackbar(err.message.ifEmpty { errorUnknown })
                viewModel.onErrorDismissed()
            }
            else -> Unit
        }
    }

    val coolOff = uiState as? DeleteAccountUiState.CoolOff
    val existingDetected = uiState as? DeleteAccountUiState.ExistingRequestDetected
    val isRevoking = uiState is DeleteAccountUiState.Revoking
    // Both CoolOff and ExistingRequestDetected are "active request" states — revoke is available.
    val hasActiveRequest = coolOff != null || existingDetected != null

    // Periodic tick every 60 s to refresh the countdown display.
    var tickMs by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(60_000L)
            tickMs = System.currentTimeMillis()
        }
    }

    // For ExistingRequestDetected, scheduledDeletionAt is unavailable (not in 409 body).
    // Show an empty countdown — the UI renders a "pending deletion" placeholder message.
    val countdownText by remember(coolOff, tickMs) {
        derivedStateOf {
            formatCountdown(coolOff?.scheduledDeletionAt, tickMs)
        }
    }
    // True when we have an active request but no scheduledDeletionAt (409-detected path).
    val countdownUnavailable = existingDetected != null && coolOff == null

    Surface(modifier = Modifier.fillMaxSize(), color = WarmIvory) {
        Column(
            modifier =
                Modifier
                    .fillMaxSize()
                    .statusBarsPadding()
                    .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            // Top bar
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack, modifier = Modifier.size(44.dp)) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = null,
                        tint = TextPrimary,
                    )
                }
                Spacer(Modifier.width(8.dp))
                Text(
                    text = stringResource(R.string.delete_account_coolOff_title),
                    style =
                        MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.ExtraBold,
                        ),
                    color = TextPrimary,
                )
            }

            Spacer(Modifier.height(8.dp))

            // Countdown card
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
                    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(64.dp)) {
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = ErrorRed.copy(alpha = 0.12f),
                        ) {
                            Box(modifier = Modifier.size(64.dp), contentAlignment = Alignment.Center) {
                                Icon(
                                    Icons.Default.HourglassTop,
                                    contentDescription = null,
                                    tint = ErrorRed,
                                    modifier = Modifier.size(36.dp),
                                )
                            }
                        }
                    }
                    if (countdownUnavailable) {
                        // ExistingRequestDetected path: 409 response did not include scheduledDeletionAt.
                        // Show a generic "pending deletion" message. A follow-up task adds a server-side
                        // GET endpoint to recover the exact date.
                        Text(
                            text = stringResource(R.string.delete_account_coolOff_pending_no_date),
                            style =
                                MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                ),
                            color = ErrorRed,
                            textAlign = TextAlign.Center,
                        )
                    } else {
                        Text(
                            text = countdownText,
                            style =
                                MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                ),
                            color = ErrorRed,
                            textAlign = TextAlign.Center,
                        )
                    }
                    Text(
                        text = stringResource(R.string.delete_account_coolOff_subtitle),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary,
                        textAlign = TextAlign.Center,
                    )
                }
            }

            // Revoked confirmation card (shown briefly during Revoked state before nav)
            if (uiState is DeleteAccountUiState.Revoked) {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = MutedGreen,
                    border = BorderStroke(1.dp, BrandGreen.copy(alpha = 0.3f)),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = BrandGreen)
                        Text(
                            text = stringResource(R.string.delete_account_revoke_success),
                            style = MaterialTheme.typography.bodyMedium,
                            color = BrandGreen,
                        )
                    }
                }
            }

            Spacer(Modifier.weight(1f))

            // Revoke CTA
            Button(
                onClick = { viewModel.onRevokeClicked() },
                enabled = !isRevoking && hasActiveRequest,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors =
                    ButtonDefaults.buttonColors(
                        containerColor = BrandGreen,
                        contentColor = Color.White,
                        disabledContainerColor = BrandGreen.copy(alpha = 0.38f),
                        disabledContentColor = Color.White.copy(alpha = 0.6f),
                    ),
            ) {
                if (isRevoking) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(22.dp),
                        color = Color.White,
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
                border = BorderStroke(1.dp, CardBorder),
            ) {
                Text(
                    text = stringResource(R.string.delete_account_close_cta),
                    color = TextSecondary,
                )
            }
        }

        SnackbarHost(hostState = snackbarHostState, modifier = Modifier.padding(16.dp)) { data ->
            Snackbar(snackbarData = data, containerColor = ErrorRed)
        }
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
        if (target.isBefore(now)) return ""
        val totalHours = ChronoUnit.HOURS.between(now, target)
        val days = totalHours / 24
        val hours = totalHours % 24
        buildString {
            if (days > 0) {
                append("$days day${if (days != 1L) "s" else ""}")
                if (hours > 0) append(", ")
            }
            if (hours > 0 || days == 0L) {
                append("$hours hour${if (hours != 1L) "s" else ""}")
            }
        }
    } catch (_: Exception) {
        ""
    }
}
