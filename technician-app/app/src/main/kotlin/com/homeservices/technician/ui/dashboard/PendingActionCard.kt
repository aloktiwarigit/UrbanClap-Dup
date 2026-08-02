package com.homeservices.technician.ui.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionType
import com.homeservices.technician.R
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive

private const val MUTED_ALPHA = 0.7f
private const val ICON_BG_ALPHA = 0.12f

private val Amber = Color(0xFFB86B00)
private val AmberSoft = Color(0xFFFFF3E0)
private val Teal = Color(0xFF006064)
private val TealSoft = Color(0xFFE0F7FA)
private val Blue = Color(0xFF1565C0)
private val BlueSoft = Color(0xFFE3F2FD)
private val Purple = Color(0xFF6A1B9A)
private val PurpleSoft = Color(0xFFF3E5F5)
private val Green = Color(0xFF1B5E20)
private val GreenSoft = Color(0xFFE8F5E9)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun PendingActionCard(
    action: PendingAction,
    onClick: (PendingAction) -> Unit,
    modifier: Modifier = Modifier,
) {
    val visuals = cardVisuals(action.type)
    val accent = visuals.accent
    val bg = visuals.bg
    val icon = visuals.icon
    val label = visuals.label

    Surface(
        onClick = { onClick(action) },
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = bg,
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = accent.copy(alpha = ICON_BG_ALPHA),
                modifier = Modifier.size(40.dp),
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = accent,
                    modifier =
                        Modifier
                            .padding(8.dp)
                            .size(24.dp),
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = accent,
                )
                action.expiresAt?.let { expiresAt ->
                    var now by remember(action.id, expiresAt) { mutableLongStateOf(System.currentTimeMillis()) }
                    LaunchedEffect(action.id, expiresAt) {
                        while (isActive && now < expiresAt) {
                            delay(MS_PER_SECOND)
                            now = System.currentTimeMillis()
                        }
                    }
                    Text(
                        text = "${remainingSeconds(expiresAtMs = expiresAt, nowMs = now)}s",
                        style = MaterialTheme.typography.labelSmall,
                        color = accent.copy(alpha = MUTED_ALPHA),
                    )
                }
            }
        }
    }
}

private data class CardVisuals(
    val accent: Color,
    val bg: Color,
    val icon: ImageVector,
    val label: String,
)

@Composable
private fun cardVisuals(type: PendingActionType): CardVisuals =
    when (type) {
        PendingActionType.JOB_OFFER ->
            CardVisuals(
                Amber,
                AmberSoft,
                Icons.Default.Work,
                stringResource(R.string.dashboard_pending_action_job_offer),
            )
        PendingActionType.RATING_PROMPT_TECHNICIAN ->
            CardVisuals(
                Blue,
                BlueSoft,
                Icons.Default.Star,
                stringResource(R.string.dashboard_pending_action_rating_prompt),
            )
        PendingActionType.RATING_RECEIVED ->
            CardVisuals(
                Purple,
                PurpleSoft,
                Icons.Default.Star,
                stringResource(R.string.dashboard_pending_action_rating_received),
            )
        PendingActionType.EARNINGS_UPDATE ->
            CardVisuals(
                Teal,
                TealSoft,
                Icons.Default.AccountBalanceWallet,
                stringResource(R.string.dashboard_pending_action_earnings_update),
            )
        else ->
            CardVisuals(Green, GreenSoft, Icons.Default.Work, type.name)
    }
