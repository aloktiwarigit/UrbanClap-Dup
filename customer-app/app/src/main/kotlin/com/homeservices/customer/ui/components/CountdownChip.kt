package com.homeservices.customer.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.homeservices.customer.R
import kotlinx.coroutines.delay
import java.time.Instant

private const val CHIP_CORNER_RADIUS = 50
private const val CHIP_HORIZONTAL_PADDING_DP = 12
private const val CHIP_VERTICAL_PADDING_DP = 6
private const val ICON_SIZE_DP = 16
private const val ICON_SPACER_DP = 6
private const val DELAY_MS = 1_000L
private const val SECONDS_PER_HOUR = 3600L
private const val SECONDS_PER_MINUTE = 60L

/**
 * Displays a countdown chip showing "HH:MM:SS remaining" until the given ISO-8601 deadline.
 *
 * - Updates every 1 second via a [LaunchedEffect] delay loop.
 * - Shows nothing when [deadlineIso] is null or the deadline has already passed.
 * - Standalone composable — has no ViewModel dependency.
 */
@Composable
public fun CountdownChip(
    deadlineIso: String?,
    modifier: Modifier = Modifier,
) {
    val deadlineEpoch =
        deadlineIso?.let {
            remember(it) {
                runCatching { Instant.parse(it).epochSecond }.getOrNull()
            }
        } ?: return

    var secondsRemaining by remember { mutableLongStateOf(deadlineEpoch - Instant.now().epochSecond) }

    LaunchedEffect(deadlineIso) {
        while (true) {
            secondsRemaining = deadlineEpoch - Instant.now().epochSecond
            if (secondsRemaining <= 0L) break
            delay(DELAY_MS)
        }
    }

    if (secondsRemaining <= 0L) return

    val formatted = formatCountdown(secondsRemaining)
    val label = stringResource(R.string.complaint_countdown_remaining, formatted)

    Row(
        modifier =
            modifier
                .background(
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    shape = RoundedCornerShape(CHIP_CORNER_RADIUS),
                ).padding(horizontal = CHIP_HORIZONTAL_PADDING_DP.dp, vertical = CHIP_VERTICAL_PADDING_DP.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        Icon(
            imageVector = Icons.Default.Timer,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSecondaryContainer,
            modifier = Modifier.size(ICON_SIZE_DP.dp),
        )
        Spacer(Modifier.width(ICON_SPACER_DP.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSecondaryContainer,
        )
    }
}

private fun formatCountdown(totalSeconds: Long): String {
    val hours = totalSeconds / SECONDS_PER_HOUR
    val minutes = (totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE
    val seconds = totalSeconds % SECONDS_PER_MINUTE
    return "%02d:%02d:%02d".format(hours, minutes, seconds)
}
